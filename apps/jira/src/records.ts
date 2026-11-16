import { z } from 'zod'

const issuePattern = /^[A-Z][A-Z0-9]{1,29}-[1-9]\d{0,9}$/
const revision = z.string().regex(/^[a-f0-9]{12,40}$/i)
const outcome = z.enum(['pass', 'fail', 'unavailable'])
const verdict = z.enum([
  'confirmed-regression', 'no-regression-in-executed-checks', 'potential-issue',
  'inconclusive', 'verification-unavailable',
])

export const snapshot = z.object({
  schema: z.literal('aegispr.snapshot.v1'),
  pullRequest: z.number().int().positive(),
  repository: z.string().regex(/^\{[\da-f]{8}(?:-[\da-f]{4}){3}-[\da-f]{12}\}$/i),
  base: revision,
  head: revision,
  linkedIssues: z.array(z.string().regex(issuePattern)).max(8),
  analyzedAt: z.iso.datetime(),
  verdict,
  evidence: z.array(z.object({
    name: z.string().max(80), file: z.string().max(160), pointer: z.string().max(160),
    base: outcome, head: outcome,
  })).max(12),
  findings: z.array(z.object({
    kind: z.enum(['static', 'hypothesis']), severity: z.enum(['high', 'medium', 'low']),
    rule: z.string().max(80), path: z.string().max(240), line: z.number().int().positive().nullable(),
    message: z.string().max(300),
  })).max(20),
  notes: z.array(z.string().max(300)).max(10),
}).superRefine((report, ctx) => {
  const reproduced = report.evidence.some(check => check.base === 'pass' && check.head === 'fail')
  const passed = report.evidence.length > 0 && report.evidence.every(check => check.base === 'pass' && check.head === 'pass')
  if ((report.verdict === 'confirmed-regression') !== reproduced ||
      (report.verdict === 'no-regression-in-executed-checks') !== passed) {
    ctx.addIssue({ code: 'custom', message: 'Verdict disagrees with the recorded assertions.' })
  }
})

export type Snapshot = z.infer<typeof snapshot>

export function issueKey(input: unknown): string {
  if (typeof input !== 'string' || !issuePattern.test(input)) throw new Error('Enter a valid Jira issue key.')
  return input
}

export function parseSnapshot(input: unknown, key: string): Snapshot {
  if (typeof input !== 'string' || new TextEncoder().encode(input).length > 24_000) {
    throw new Error('The snapshot is missing or exceeds 24 KB.')
  }
  let value: unknown
  try { value = JSON.parse(input) } catch { throw new Error('The snapshot is not valid JSON.') }
  const parsed = snapshot.safeParse(value)
  if (!parsed.success) throw new Error('The snapshot format or evidence is invalid.')
  if (!parsed.data.linkedIssues.includes(key)) throw new Error('This Jira issue is not referenced in the snapshot.')
  return parsed.data
}
