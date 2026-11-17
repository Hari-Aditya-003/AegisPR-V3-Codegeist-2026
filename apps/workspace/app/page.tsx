import Link from 'next/link'

import { VerificationPreview } from '@/components/verification-preview'
import { ReviewDashboard } from '@/components/v2-workspace'

const capabilities = [
  ['Pull requests', 'Commit-pinned GitHub source review', 'Forge review panel and automatic Bitbucket PR events'],
  ['Verification', 'Repeated Python and JavaScript fixture checks', 'JSON contract assertions against real Bitbucket revisions'],
  ['Evidence', 'Signed receipts, changed-file coverage and SARIF', 'Base and head outcomes, run history and portable snapshots'],
  ['Repair', 'Verify prewritten fixture fixes', 'Explicitly create a Jira follow-up for a shared report'],
  ['Models', 'Two-provider advisory routing and budget ledger', 'Aegis Review Assistant explains Jira context and stored evidence'],
]

export default function Page() {
  return (
    <>
      <section className="hero unified-hero" aria-labelledby="home-title">
        <div className="hero-glow" aria-hidden="true" />
        <div className="verify-panel">
          <p className="eyebrow">Pull request verification</p>
          <h1 id="home-title">Don&apos;t just review a PR. <span>Verify the evidence.</span></h1>
          <p className="hero-copy">Compare base and head, inspect what each check found, and verify the signed evidence.</p>
          <div className="unified-actions">
            <Link className="v2-button" href="#run-fixture">Try a live fixture</Link>
            <Link className="v2-button secondary" href="/atlassian">Open Forge integrations</Link>
          </div>
          <p className="field-hint">Live fixtures run without paid model calls.</p>
        </div>
        <VerificationPreview />
      </section>
      <section id="compare-versions" className="section muted version-comparison" aria-labelledby="comparison-heading">
        <div className="section-heading">
          <h2 id="comparison-heading">V2 workspace and V3 Forge integrations</h2>
          <p>Inspect execution evidence in the workspace or review the change where your team works.</p>
        </div>
        <div className="version-table">
          <table aria-label="AegisPR V2 workspace and V3 Forge capabilities">
            <thead><tr><th scope="col">Workflow</th><th scope="col">Evidence workspace</th><th scope="col">Bitbucket, Jira and Rovo</th></tr></thead>
            <tbody>
              {capabilities.map(([name, workspace, forge]) => (
                <tr key={name}><th scope="row">{name}</th><td>{workspace}</td><td>{forge}</td></tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="unified-actions">
          <Link className="v2-button secondary" href="/guide">Getting started</Link>
          <Link className="v2-button" href="#workspace">Open the review workspace</Link>
        </div>
      </section>
      <section id="workspace" className="unified-workspace" aria-label="Review workspace">
        <ReviewDashboard />
      </section>
    </>
  )
}
