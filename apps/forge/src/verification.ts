import type { Bitbucket } from './bitbucket'
import { BitbucketError } from './bitbucket'
import type { Evidence, PullRequest, Verdict } from './contracts'

type Value = string | number | boolean | null
type Check = { name: string; file: string; pointer: string; equals: Value }

function validCheck(check: unknown): check is Check {
  if (!check || typeof check !== 'object') return false
  const { name, file, pointer, equals } = check as Check
  return typeof name === 'string' && name.length > 0 && name.length <= 80 &&
    typeof file === 'string' && file.length <= 160 && file !== '.aegispr.json' &&
    file.endsWith('.json') && file.split('/').every(segment =>
      /^[\w.-]+$/.test(segment) && segment !== '.' && !segment.includes('..')) &&
    typeof pointer === 'string' && pointer.length <= 160 &&
    /^(?:\/(?:[^/~]|~[01])*)*$/.test(pointer) &&
    (equals === null || typeof equals === 'boolean' || Number.isFinite(equals) ||
      (typeof equals === 'string' && equals.length <= 500))
}

function atPointer(data: unknown, pointer: string): unknown {
  if (!pointer) return data
  for (const segment of pointer.slice(1).split('/')) {
    const key = segment.replace(/~1/g, '/').replace(/~0/g, '~')
    if (data === null || typeof data !== 'object' || !Object.hasOwn(data, key)) return undefined
    if (Array.isArray(data) && !/^(0|[1-9]\d*)$/.test(key)) return undefined
    data = (data as Record<string, unknown>)[key]
  }
  return data
}

export async function verify(
  client: Pick<Bitbucket, 'source'>, pr: PullRequest,
): Promise<{ evidence: Evidence[]; verdict: Verdict; notes: string[] }> {
  const unavailable = (note: string) => ({
    evidence: [], verdict: 'verification-unavailable' as const, notes: [note],
  })
  if (!pr.sameRepository) return unavailable('Executable JSON checks currently support same-repository pull requests.')
  let contract: { version?: unknown; checks?: unknown }
  try {
    contract = JSON.parse(await client.source(pr.base, '.aegispr.json'))
  } catch (error) {
    if (error instanceof BitbucketError && (error.status === 429 || error.status >= 500)) throw error
    return unavailable('The destination commit has no readable, valid .aegispr.json contract.')
  }
  if (contract?.version !== 1 || !Array.isArray(contract.checks) ||
      contract.checks.length < 1 || contract.checks.length > 12 || !contract.checks.every(validCheck)) {
    return unavailable('The destination contract must contain 1–12 valid JSON equality checks.')
  }
  const checks = contract.checks as Check[]
  const files = [...new Set(checks.map(check => check.file))]
  if (files.length > 6) return unavailable('A JSON contract can reference at most six files.')
  const docs = new Map<string, unknown>()
  const inaccessible = Symbol('inaccessible JSON')
  for (const commit of new Set([pr.base, pr.head])) {
    await Promise.all(files.map(async file => {
      try {
        docs.set(commit + ':' + file, JSON.parse(await client.source(commit, file)))
      } catch (error) {
        if (error instanceof BitbucketError && (error.status === 429 || error.status >= 500)) throw error
        docs.set(commit + ':' + file, inaccessible)
      }
    }))
  }
  const outcome = (commit: string, check: Check): Evidence['base'] => {
    const data = docs.get(commit + ':' + check.file)
    if (data === inaccessible) return 'unavailable'
    return atPointer(data, check.pointer) === check.equals ? 'pass' : 'fail'
  }
  const evidence = checks.map(check => ({
    name: check.name, file: check.file, pointer: check.pointer,
    base: outcome(pr.base, check), head: outcome(pr.head, check),
  }))
  if (evidence.some(check => check.base === 'pass' && check.head === 'fail')) {
    return { evidence, verdict: 'confirmed-regression', notes: ['A destination-defined JSON assertion passed at base and failed at head.'] }
  }
  if (evidence.every(check => check.base === 'pass' && check.head === 'pass')) {
    return { evidence, verdict: 'no-regression-in-executed-checks', notes: ['All listed JSON assertions passed at both commits.'] }
  }
  return { evidence, verdict: 'inconclusive',
    notes: ['At least one destination check failed or a checked file was unavailable at one revision.'] }
}
