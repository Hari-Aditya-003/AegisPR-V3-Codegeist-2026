export type Target = { workspace: string; repository: string; id: number }

export type PullRequest = {
  base: string
  head: string
  title: string
  sourceBranch: string
  destinationBranch: string
  jiraKeys: string[]
  sameRepository: boolean
}

export type Finding = {
  kind: 'static' | 'hypothesis'
  severity: 'high' | 'medium' | 'low'
  rule: string
  path: string
  line: number | null
  message: string
}

export type Evidence = {
  name: string
  file: string
  pointer: string
  base: 'pass' | 'fail' | 'unavailable'
  head: 'pass' | 'fail' | 'unavailable'
}

export type Verdict = 'confirmed-regression' | 'no-regression-in-executed-checks' |
  'potential-issue' | 'inconclusive' | 'verification-unavailable'

export type Report = {
  schema: 1
  attempt: string
  target: Target
  pr: PullRequest
  state: 'running' | 'completed' | 'failed'
  startedAt: string
  finishedAt?: string
  findings?: Finding[]
  files?: { path: string; added: number; removed: number }[]
  evidence?: Evidence[]
  verdict?: Verdict
  notes?: string[]
  scope?: { diffBytes: number; completeFileList: boolean }
}

export type ReviewView = { pr: PullRequest; current: Report | null; recent: Report[]; jiraSite?: string }
