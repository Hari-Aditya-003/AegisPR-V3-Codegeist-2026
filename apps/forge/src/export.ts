import type { Report } from './contracts'

export function exportSnapshot(report: Report) {
  if (!report.finishedAt || !report.verdict || report.state === 'running') {
    throw new Error('Wait for review completion before sharing.')
  }
  return {
    schema: 'aegispr.snapshot.v1',
    pullRequest: report.target.id,
    repository: report.target.repository,
    base: report.pr.base,
    head: report.pr.head,
    linkedIssues: report.pr.jiraKeys,
    analyzedAt: report.finishedAt,
    verdict: report.verdict,
    evidence: report.evidence ?? [],
    findings: (report.findings ?? []).slice(0, 20),
    notes: report.notes ?? [],
  }
}
