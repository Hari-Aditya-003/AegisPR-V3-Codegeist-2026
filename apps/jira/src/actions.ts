import type { Jira } from './jira'

export function actions(client: Jira) {
  async function read<T>(load: () => Promise<T>) {
    try { return { ok: true as const, value: await load() } }
    catch (error) {
      return { ok: false as const, error: error instanceof Error && error.message.startsWith('Could not ') ?
        error.message : 'The issue or its evidence could not be accessed or validated.' }
    }
  }
  return {
    getReport: (issueKey: unknown) => read(async () => {
      const report = await client.report(issueKey)
      if (!report) return null
      const { evidence, ...summary } = report
      return { ...summary, assertionCount: evidence.length, source: 'reviewer-shared Jira snapshot' }
    }),
    getEvidence: (issueKey: unknown) => read(async () => {
      const report = await client.report(issueKey)
      if (!report) return null
      const { pullRequest, base, head, verdict, notes, evidence } = report
      return { pullRequest, base, head, verdict, notes, evidence, source: 'reviewer-shared Jira snapshot' }
    }),
    getContext: (issueKey: unknown) => read(() => client.context(issueKey)),
  }
}
