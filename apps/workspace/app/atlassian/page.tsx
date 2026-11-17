'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState, type FormEvent } from 'react'
import { Workspace } from '@/components/v2-workspace'
import { v2Request } from '@/lib/v2-api'
import type { Review } from '@/lib/v2-types'

const installationGuide = 'https://github.com/Hari-Aditya-003/AegisPR-V3-Codegeist-2026/blob/main/docs/JUDGE_INSTALLATION.md'

export default function AtlassianPage() {
  const router = useRouter()
  const [snapshot, setSnapshot] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  async function importReview(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError('')
    let evidence: unknown
    try {
      evidence = JSON.parse(snapshot)
    } catch {
      setError('Paste a valid AegisPR snapshot from the Bitbucket review panel.')
      return
    }
    setBusy(true)
    try {
      const record = await v2Request<Review>('/api/v2/forge-snapshots', evidence)
      router.push('/reviews/' + encodeURIComponent(record.id))
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'The snapshot could not be imported.')
    } finally {
      setBusy(false)
    }
  }

  return <Workspace>
    <div className="v2-page-heading">
      <div><h1>Atlassian integrations</h1><p>Review in Bitbucket, share the evidence with Jira, and ask Rovo about the result.</p></div>
      <a className="v2-button secondary" href={installationGuide}>Install the Forge apps ↗</a>
    </div>
    <div className="v2-two-columns">
      <section className="v2-panel"><h2>Bitbucket reviews</h2>
        <p>Open AegisPR on the pull request overview to see static findings, exact revisions and each JSON assertion result.</p>
      </section>
      <section className="v2-panel"><h2>Jira and Rovo</h2>
        <p>Share a snapshot with the intended issue readers. Aegis Review Assistant explains the stored results and Jira requirement.</p>
        <Link href="/guide#forge">See the workflow</Link>
      </section>
    </div>
    <form className="v2-panel v2-pr-form" onSubmit={importReview}>
      <h2>Import a Bitbucket evidence snapshot</h2>
      <p>Paste the export from <strong>Share evidence to Jira</strong> to save a reviewer-supplied copy in this workspace.</p>
      <label htmlFor="forge-snapshot">Review snapshot JSON</label>
      <textarea id="forge-snapshot" value={snapshot} onChange={event => setSnapshot(event.target.value)}
        rows={7} required maxLength={24000} />
      {error && <p role="alert" className="v2-error">{error}</p>}
      <button className="v2-button" disabled={busy}>{busy ? 'Importing…' : 'Import snapshot'}</button>
    </form>
  </Workspace>
}
