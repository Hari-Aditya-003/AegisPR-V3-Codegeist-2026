import api, { route } from '@forge/api'
import { InvocationError, InvocationErrorCode, Queue, type AsyncEvent } from '@forge/events'
import { kvs } from '@forge/kvs'
import Resolver from '@forge/resolver'
import { bitbucket } from './bitbucket'
import type { Report, Target } from './contracts'
import { eventTarget, storageKey, target, type PullRequestEvent } from './identity'
import { readReview, runReview, type ReportStore, type ReviewRequest } from './reviews'

const queue = new Queue<ReviewRequest>({ key: 'aegispr-reviews' })
const retentionDays = 30
const store: ReportStore = {
  async get(key) {
    const reports = await kvs.get<Report[]>(key) ?? []
    const cutoff = Date.now() - retentionDays * 86_400_000
    return reports.filter(report => Date.parse(report.startedAt) >= cutoff)
  },
  async set(key, reports) {
    await kvs.set(key, reports, { ttl: { unit: 'DAYS', value: retentionDays } })
  },
}

function client(ref: Target, user: boolean) {
  const auth = user ? api.asUser() : api.asApp()
  return bitbucket(parts => {
    const [, , workspace, repository, resource, value, ...rest] = parts
    if (resource === 'pullrequests') {
      if (rest[0] === 'diff') return auth.requestBitbucket(route`/2.0/repositories/${workspace}/${repository}/pullrequests/${value}/diff`)
      if (rest[0] === 'diffstat') return auth.requestBitbucket(route`/2.0/repositories/${workspace}/${repository}/pullrequests/${value}/diffstat?pagelen=50`)
      return auth.requestBitbucket(route`/2.0/repositories/${workspace}/${repository}/pullrequests/${value}`)
    }
    const file = rest.reduce((current, segment) => route`${current}/${segment}`, route`/2.0/repositories/${workspace}/${repository}/src/${value}`)
    return auth.requestBitbucket(file)
  }, ref)
}

async function schedule(request: ReviewRequest) {
  const body = request.replaceAttempt ? request : { target: request.target }
  return queue.push({ body, concurrency: { key: storageKey(request.target), limit: 1 } })
}

export async function onPullRequest(event: PullRequestEvent) {
  const ref = eventTarget(event)
  if (ref) await schedule({ target: ref })
}

export async function reviewWorker(event: AsyncEvent<ReviewRequest>) {
  const { workspace, repository, id } = event.body.target
  const ref = target(workspace, repository, id)
  const retry = await runReview(client(ref, false), store, event.body, event.retryContext?.retryCount ?? 0)
  if (retry) {
    return new InvocationError({
      retryAfter: retry.retryAfter, retryReason: InvocationErrorCode.FUNCTION_UPSTREAM_RATE_LIMITED,
    })
  }
}

const handler = new Resolver()
handler.define('status', async ({ context }) => {
  const ref = target(context.workspaceId, context.extension.repository?.uuid, context.extension.pullRequest?.id)
  const review = await readReview(client(ref, true), store, ref)
  const site = process.env.AEGISPR_JIRA_SITE
  return /^[a-z0-9][a-z0-9-]{0,62}\.atlassian\.net$/.test(site ?? '') ?
    { ...review, jiraSite: site } : review
})
handler.define('runReview', async ({ context }) => {
  const ref = target(context.workspaceId, context.extension.repository?.uuid, context.extension.pullRequest?.id)
  const view = await readReview(client(ref, true), store, ref)
  if (view.current?.state === 'running') return { jobId: null, previousAttempt: null }
  const { jobId } = await schedule({ target: ref, replaceAttempt: view.current?.attempt })
  return { jobId, previousAttempt: view.current?.attempt ?? null }
})
export const resolver = handler.getDefinitions()
