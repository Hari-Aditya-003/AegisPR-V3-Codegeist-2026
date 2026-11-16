import { randomUUID } from 'node:crypto'
import { BitbucketError, type Bitbucket } from './bitbucket'
import type { Report, ReviewView, Target } from './contracts'
import { sameRevision, storageKey } from './identity'
import { staticFindings } from './static-analysis'
import { verify } from './verification'

export type ReviewRequest = { target: Target; replaceAttempt?: string }
export type ReportStore = {
  get(key: string): Promise<Report[]>
  set(key: string, reports: Report[]): Promise<void>
}
export type WorkerResult = { retryAfter: number } | undefined

const maxHistoryBytes = 200_000
const maxHistoryRuns = 6
const staleRunMs = 60 * 60 * 1000

function summarizeStaleRun(report: Report): Report {
  if (report.state !== 'running' || Date.now() - Date.parse(report.startedAt) < staleRunMs) return report
  return { ...report, state: 'failed', verdict: 'verification-unavailable',
    notes: ['The worker did not report a result. Retry the review.'] }
}

function boundedHistory(latest: Report, recent: Report[]): Report[] {
  const chain = [latest, ...recent.filter(item => item.attempt !== latest.attempt)].slice(0, maxHistoryRuns)
  while (chain.length > 1 && Buffer.byteLength(JSON.stringify(chain)) > maxHistoryBytes) chain.pop()
  return chain
}

export async function readReview(client: Bitbucket, store: ReportStore, ref: Target): Promise<ReviewView> {
  const pr = await client.metadata()
  const recent = (await store.get(storageKey(ref))).map(summarizeStaleRun)
  return { pr, current: recent.find(report => sameRevision(report.pr, pr)) ?? null, recent }
}

function userMessage(error: unknown) {
  return error instanceof BitbucketError ? error.message : 'The review could not read or validate the Bitbucket response.'
}

export async function runReview(
  client: Bitbucket, store: ReportStore, request: ReviewRequest, retryCount = 0,
): Promise<WorkerResult> {
  let pr
  try {
    pr = await client.metadata()
  } catch (error) {
    if (error instanceof BitbucketError && (error.status === 429 || error.status >= 500) && retryCount < 3) {
      return { retryAfter: Math.min(900, Math.max(20 * (retryCount + 1), error.retryAfter)) }
    }
    // The PR and its revision could not be verified. Let Forge retain the failed delivery.
    throw new Error(userMessage(error))
  }
  const key = storageKey(request.target)
  const recent = await store.get(key)
  const recorded = recent.find(report => sameRevision(report.pr, pr))
  const current = recorded && summarizeStaleRun(recorded)
  if (current && current.state !== 'running' && current.attempt !== request.replaceAttempt) return
  const started: Report = current?.state === 'running' ? current : {
    schema: 1, target: request.target, pr, attempt: randomUUID(),
    startedAt: new Date().toISOString(), state: 'running',
  }
  const save = (report: Report) => store.set(key, boundedHistory(report, recent))
  await save(started)

  let result: Report
  try {
    const [diff, files, verification] = await Promise.all([client.diff(), client.files(), verify(client, pr)])
    if (!sameRevision(pr, await client.metadata())) {
      result = { ...started, state: 'failed', verdict: 'inconclusive',
        notes: ['The pull request changed during review. Run a review on the latest revision.'] }
    } else {
      result = { ...started, ...verification, state: 'completed',
        findings: staticFindings(diff), files: files.entries,
        scope: { diffBytes: Buffer.byteLength(diff), completeFileList: files.complete } }
    }
  } catch (error) {
    if (error instanceof BitbucketError && (error.status === 429 || error.status >= 500) && retryCount < 3) {
      return { retryAfter: Math.min(900, Math.max(20 * (retryCount + 1), error.retryAfter)) }
    }
    result = { ...started, state: 'failed', verdict: 'verification-unavailable', notes: [userMessage(error)] }
  }
  await save({ ...result, finishedAt: new Date().toISOString() })
}
