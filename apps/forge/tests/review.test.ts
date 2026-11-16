import assert from 'node:assert/strict'
import { execFileSync } from 'node:child_process'
import { mkdtempSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { after, test } from 'node:test'
import { fileURLToPath } from 'node:url'
import { bitbucket, BitbucketError, type BitbucketTransport } from '../src/bitbucket'
import type { Report } from '../src/contracts'
import { exportSnapshot } from '../src/export'
import { eventTarget, jiraKeys, storageKey, target } from '../src/identity'
import { readReview, runReview, type ReportStore } from '../src/reviews'
import { staticFindings } from '../src/static-analysis'
import { verify } from '../src/verification'

const workspace = '{12345678-1234-4321-a123-123456789012}'
const repo = '{11345678-1234-4321-a123-123456789012}'
const ref = target(workspace, repo, 42)
const tmp = mkdtempSync(join(tmpdir(), 'aegispr-fixtures-'))
const demo = join(tmp, 'repository')
execFileSync('bash', [fileURLToPath(new URL('../../../scripts/seed-demo.sh', import.meta.url)), demo], {
  env: { ...process.env, GIT_AUTHOR_DATE: '2026-11-16T00:00:00Z', GIT_COMMITTER_DATE: '2026-11-16T00:00:00Z' },
})
after(() => rmSync(tmp, { recursive: true, force: true }))
const git = (...args: string[]) => execFileSync('git', ['-C', demo, ...args], {
  encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'],
})
const base = git('rev-parse', 'main').trim()
const payload = (head: string) => ({
  id: ref.id, title: 'DEMO-1 Coupon quote', description: 'See PAY-27.',
  source: { commit: { hash: head }, repository: { uuid: repo }, branch: { name: 'coupon' } },
  destination: { commit: { hash: base }, repository: { uuid: repo }, branch: { name: 'main' } },
})

function fixture(branch: string, intercept?: BitbucketTransport) {
  const head = git('rev-parse', branch).trim()
  const requests: string[] = []
  const transport: BitbucketTransport = async (parts) => {
    requests.push(parts.join('/'))
    if (intercept) return intercept(parts)
    assert.deepEqual(parts.slice(0, 4), ['2.0', 'repositories', workspace, repo])
    if (parts[4] === 'src') {
      try { return new Response(git('show', parts[5] + ':' + parts.slice(6).join('/'))) }
      catch { return new Response('', { status: 404 }) }
    }
    assert.equal(parts[5], String(ref.id))
    if (parts[6] === 'diff') return new Response(git('diff', base, head))
    if (parts[6] === 'diffstat') return Response.json({
      values: git('diff', '--numstat', base, head).trim().split('\n').map(line => {
        const [added, removed, path] = line.split('\t')
        return { new: { path }, lines_added: Number(added), lines_removed: Number(removed) }
      }),
    })
    return Response.json(payload(head))
  }
  return { client: bitbucket(transport, ref), requests, head }
}

function memoryStore(): ReportStore {
  const data = new Map<string, Report[]>()
  return {
    get: async key => structuredClone(data.get(key) ?? []),
    set: async (key, reports) => { data.set(key, structuredClone(reports)) },
  }
}

const scenarios = [
  ['regression', 'confirmed-regression', 'fail'],
  ['clean', 'no-regression-in-executed-checks', 'pass'],
  ['inconclusive', 'inconclusive', 'unavailable'],
] as const
for (const [branch, verdict, headStatus] of scenarios) {
  test('real commit comparison ' + branch, async () => {
    const { client, head, requests } = fixture(branch)
    const store = memoryStore()
    await runReview(client, store, { target: ref })
    const { current } = await readReview(client, store, ref)
    assert.ok(current)
    assert.equal(current.pr.base, base)
    assert.equal(current.pr.head, head)
    assert.equal(current.verdict, verdict)
    assert.equal(current.evidence?.[0].base, 'pass')
    assert.equal(current.evidence?.[0].head, headStatus)
    assert.ok(requests.some(path => path.endsWith('/diff')))
    assert.ok(requests.some(path => path.endsWith('/diffstat')))
    assert.deepEqual(exportSnapshot(current).linkedIssues, ['DEMO-1', 'PAY-27'])
    console.log(JSON.stringify({ branch, base, head, verdict, evidence: current.evidence }))
  })
}

test('duplicate event skips diff and explicit manual run produces one replacement', async () => {
  const { client, requests } = fixture('clean')
  const store = memoryStore()
  await runReview(client, store, { target: ref })
  const { current } = await readReview(client, store, ref)
  await runReview(client, store, { target: ref })
  assert.equal(requests.filter(path => path.endsWith('/diff')).length, 1)
  const manual = { target: ref, replaceAttempt: current?.attempt }
  await runReview(client, store, manual)
  await runReview(client, store, manual)
  assert.equal(requests.filter(path => path.endsWith('/diff')).length, 2)
})

test('latest pull request revision never inherits evidence from an older run', async () => {
  const store = memoryStore()
  await runReview(fixture('regression').client, store, { target: ref })
  const view = await readReview(fixture('clean').client, store, ref)
  assert.equal(view.current, null)
  assert.equal(view.recent.length, 1)
})

test('a PR changing during analysis cannot get a completed result', async () => {
  const { client } = fixture('regression')
  const updated = fixture('clean').client
  let seen = false
  const store = memoryStore()
  await runReview({ ...client, metadata: () => {
    if (seen) return updated.metadata()
    seen = true
    return client.metadata()
  } }, store, { target: ref })
  assert.equal((await readReview(client, store, ref)).current?.verdict, 'inconclusive')
})

test('unauthorized users cannot access stored reports', async () => {
  const { client } = fixture('clean', async () => new Response('', { status: 403 }))
  await assert.rejects(readReview(client, {
    get: async () => { assert.fail('store was read before authorization') },
    set: async () => {},
  }, ref), /access was denied/)
})

test('invalid identifiers are rejected and workspace storage keys differ', () => {
  assert.throws(() => target(workspace, '../repository', 42), /identifier/)
  assert.throws(() => target(workspace, repo, 0), /identifier/)
  assert.notEqual(storageKey(ref), storageKey(target(repo, repo, 42)))
})

test('rate limit is retried and retry exhaustion persists a visible failure', async () => {
  const { client, head } = fixture('clean')
  const rateLimited = bitbucket(async parts => parts.at(-1) === 'diff' ?
    new Response('', { status: 429, headers: { 'Retry-After': '45' } }) :
    Response.json(payload(head)), ref)
  const store = memoryStore()
  assert.deepEqual(await runReview(rateLimited, store, { target: ref }), { retryAfter: 45 })
  assert.equal((await readReview(client, store, ref)).current?.state, 'running')
  await runReview(rateLimited, store, { target: ref }, 3)
  assert.equal((await readReview(client, store, ref)).current?.state, 'failed')
})

test('bounded response parser rejects large streamed diffs and keeps first diffstat page', async () => {
  const { client } = fixture('clean', async parts => parts.at(-1) === 'diffstat' ?
    Response.json({ values: [{ new: { path: 'a.json' }, lines_added: 2 }], next: 'reported-next-page' }) :
    new Response('x'.repeat(320_001)))
  await assert.rejects(client.diff(), (error: unknown) => error instanceof BitbucketError && error.status === 413)
  assert.deepEqual(await client.files(), { entries: [{ path: 'a.json', added: 2, removed: 0 }], complete: false })
})

test('missing base contract, forks and malformed assertions do not produce verification claims', async () => {
  const original = fixture('clean').client
  const pr = await original.metadata()
  const missing = { source: async () => { throw new BitbucketError('missing', 404) } }
  for (const data of [await verify(missing, pr), await verify(original, { ...pr, sameRepository: false }),
    await verify({ source: async () => '{"version":1,"checks":[{"file":"../quotes.json"}]}' }, pr)]) {
    assert.equal(data.verdict, 'verification-unavailable')
    assert.deepEqual(data.evidence, [])
  }
})

test('static findings point to added lines and preserve redaction', () => {
  const diff = ['diff --git a/src/app.ts b/src/app.ts', '+++ b/src/app.ts', '@@ -7,2 +7,4 @@',
    ' context', '-old', '+debugger;', '+new  ', '+ok', ''].join('\n')
  const findings = staticFindings(diff)
  assert.deepEqual(findings.map(finding => [finding.rule, finding.line]), [
    ['debug-breakpoint', 8], ['trailing-whitespace', 9],
  ])
  assert.deepEqual(jiraKeys('PAY-27 and PAY-27', 'A-2', 'DEMO-1'), ['PAY-27', 'DEMO-1'])
})

test('documented Forge create and update event targets share the manual review identity', () => {
  const payload = { workspace: { uuid: workspace }, repository: { uuid: repo }, pullrequest: { id: ref.id } }
  for (const verb of ['created', 'updated']) {
    assert.deepEqual(eventTarget({ ...payload, eventType: 'avi:bitbucket:' + verb + ':pullrequest' }), ref)
  }
  assert.equal(eventTarget({ ...payload, eventType: 'avi:bitbucket:push:repository' }), null)
  assert.throws(() => eventTarget({ eventType: 'avi:bitbucket:created:pullrequest' }), /identifier/)
})
