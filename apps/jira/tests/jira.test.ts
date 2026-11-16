import assert from 'node:assert/strict'
import { test } from 'node:test'
import { actions } from '../src/actions'
import { jira } from '../src/jira'
import { parseSnapshot } from '../src/records'

const saved = {
  schema: 'aegispr.snapshot.v1', pullRequest: 1,
  repository: '{11345678-1234-4321-a123-123456789012}', linkedIssues: ['DEMO-1'],
  base: 'a'.repeat(40), head: 'b'.repeat(40), analyzedAt: '2026-11-16T08:10:00.000Z',
  verdict: 'confirmed-regression',
  evidence: [{ name: 'Coupon total', file: 'store/quotes.json', pointer: '/total', base: 'pass', head: 'fail' }],
  findings: [], notes: [],
}

function fixture(allowed = true) {
  const requests: unknown[][] = []
  const client = jira(async (key, operation, body) => {
    requests.push([key, operation, body])
    if (!allowed) return Response.json({}, { status: 403 })
    if (operation === 'issue') return Response.json({ key, fields: {
      summary: 'Apply coupon', project: { key: 'DEMO' }, status: { name: 'Open' },
      description: { type: 'doc', content: [{ type: 'paragraph', content: [{ type: 'text', text: '10% off should cost 90.' }] }] },
    } })
    if (operation === 'save') return Response.json({}, { status: 201 })
    if (operation === 'types') return Response.json({ issueTypes: [{ id: '1', name: 'Task' }, { id: '2', name: 'Subtask', subtask: true }] })
    if (operation === 'create') return Response.json({ key: 'DEMO-2' }, { status: 201 })
    return Response.json({ value: saved })
  })
  return { client, requests }
}

test('Rovo actions explain saved evidence and actual Jira requirement text', async () => {
  const rovo = actions(fixture().client)
  const report = await rovo.getReport('DEMO-1')
  const evidence = await rovo.getEvidence('DEMO-1')
  const jiraContext = await rovo.getContext('DEMO-1')
  assert.equal(report.ok && report.value?.assertionCount, 1)
  assert.equal(evidence.ok && evidence.value?.evidence[0].head, 'fail')
  assert.equal(evidence.ok && evidence.value?.source, 'reviewer-shared Jira snapshot')
  assert.equal(jiraContext.ok && jiraContext.value.description, '10% off should cost 90.')
})

test('denied Jira access prevents reading the property and surfaces a Rovo error', async () => {
  const { client, requests } = fixture(false)
  const result = await actions(client).getReport('DEMO-1')
  assert.equal(result.ok, false)
  assert.deepEqual(requests.map(row => row[1]), ['issue'])
})

test('Jira snapshot enforces issue linkage and agreement between evidence and verdict', () => {
  assert.throws(() => parseSnapshot(JSON.stringify(saved), 'DEMO-2'), /not referenced/)
  assert.throws(() => parseSnapshot(JSON.stringify({ ...saved, evidence: [] }), 'DEMO-1'), /invalid/)
  assert.throws(() => parseSnapshot('x'.repeat(24_001), 'DEMO-1'), /24 KB/)
})

test('explicit sharing and follow-up mutations target the requested issue and project', async () => {
  const { client, requests } = fixture()
  assert.equal((await client.save('DEMO-1', JSON.stringify(saved))).pullRequest, 1)
  assert.deepEqual(await client.issueTypes('DEMO-1'), [{ id: '1', name: 'Task' }])
  assert.deepEqual(await client.createFollowUp('DEMO-1', '1', 'Investigate coupon result'), { key: 'DEMO-2' })
  const creation = requests.find(row => row[1] === 'create')
  assert.equal(creation?.[0], 'DEMO-1')
  assert.throws(() => parseSnapshot(JSON.stringify(saved), 'INVALID'), /not referenced/)
})

test('Rovo reports missing review as an empty record', async () => {
  const client = jira(async (key, operation) => operation === 'issue' ?
    Response.json({ key, fields: { summary: 'Test' } }) : new Response('', { status: 404 }))
  assert.deepEqual(await actions(client).getEvidence('DEMO-1'), { ok: true, value: null })
})
