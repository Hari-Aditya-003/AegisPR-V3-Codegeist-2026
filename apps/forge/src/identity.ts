import { createHash } from 'node:crypto'
import type { PullRequest, Target } from './contracts'

const UUID = /^[\da-f]{8}(?:-[\da-f]{4}){3}-[\da-f]{12}$/i
const JIRA_KEY = /\b[A-Z][A-Z0-9]{1,29}-[1-9]\d{0,9}\b/g

export function uuid(value: unknown): string {
  if (typeof value === 'string') {
    const raw = value.startsWith('{') && value.endsWith('}') ? value.slice(1, -1) : value
    if (UUID.test(raw)) return '{' + raw.toLowerCase() + '}'
  }
  throw new Error('Invalid Bitbucket identifier.')
}

export function target(workspace: unknown, repository: unknown, id: unknown): Target {
  if (typeof id !== 'number' || !Number.isSafeInteger(id) || id < 1) {
    throw new Error('Invalid pull request identifier.')
  }
  return { workspace: uuid(workspace), repository: uuid(repository), id }
}

export function storageKey(ref: Target): string {
  return 'pr-' + createHash('sha256').update(JSON.stringify([ref.workspace, ref.repository, ref.id])).digest('hex')
}

export function sameRevision(a: PullRequest, b: PullRequest): boolean {
  return a.base === b.base && a.head === b.head
}

export function jiraKeys(...texts: string[]): string[] {
  return [...new Set(texts.flatMap(value => value.match(JIRA_KEY) ?? []))].slice(0, 8)
}

export type PullRequestEvent = {
  eventType?: string
  workspace?: { uuid?: string }
  repository?: { uuid?: string }
  pullrequest?: { id?: number }
}

export function eventTarget(event: PullRequestEvent): Target | null {
  if (!['avi:bitbucket:created:pullrequest', 'avi:bitbucket:updated:pullrequest'].includes(event.eventType ?? '')) return null
  return target(event.workspace?.uuid, event.repository?.uuid, event.pullrequest?.id)
}
