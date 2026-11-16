import { invoke, router, view } from '@forge/bridge'
import { useEffect, useState } from 'react'
import { createRoot } from 'react-dom/client'
import type { Report, ReviewView, Verdict } from '../src/contracts'
import { exportSnapshot } from '../src/export'
import './style.css'

const verdicts: Record<Verdict, string> = {
  'confirmed-regression': 'Confirmed regression',
  'no-regression-in-executed-checks': 'No regression detected in executed checks',
  'potential-issue': 'Potential issue · unverified',
  'inconclusive': 'Inconclusive',
  'verification-unavailable': 'Verification unavailable',
}

function ReportDetails({ report }: { report: Report }) {
  const { evidence, findings, files, scope, notes, verdict } = report
  const [showSnapshot, setShowSnapshot] = useState(false)
  return <>
    {verdict && <p className={'verdict ' + verdictsClass(verdict)}>{verdicts[verdict]}</p>}
    {notes?.map(note => <p key={note}>{note}</p>)}
    {!!evidence?.length && <details open>
      <summary>Base versus head evidence ({evidence.length})</summary>
      <table>
        <thead><tr><th scope="col">JSON assertion</th><th scope="col">Base</th><th scope="col">Head</th></tr></thead>
        <tbody>{evidence.map((entry, i) => <tr key={i}>
          <th scope="row">{entry.name}<small>{entry.file}{entry.pointer}</small></th>
          <td data-outcome={entry.base}>{entry.base}</td>
          <td data-outcome={entry.head}>{entry.head}</td>
        </tr>)}</tbody>
      </table>
    </details>}
    {findings && <details open={findings.length > 0}>
      <summary>Static findings ({findings.length}{findings.length === 60 ? '+' : ''})</summary>
      {!findings.length && <p>No matching rules in the scanned additions.</p>}
      {(['high', 'medium', 'low'] as const).map(severity => {
        const items = findings.filter(finding => finding.severity === severity)
        return items.length > 0 && <section key={severity}>
          <h3>{severity} severity</h3>
          <ul>{items.map((item, i) => <li key={i}>{item.message}<small>{item.path}:{item.line}</small></li>)}</ul>
        </section>
      })}
    </details>}
    {report.finishedAt && verdict && <details onToggle={event => setShowSnapshot(event.currentTarget.open)}>
      <summary>Share evidence to Jira</summary>
      <p>Review the contents and paste the snapshot into the AegisPR panel on a Jira issue with the appropriate audience.</p>
      {showSnapshot && <textarea className="snapshot" aria-label="Review snapshot JSON" readOnly rows={6}
        onFocus={event => event.currentTarget.select()} value={JSON.stringify(exportSnapshot(report), null, 2)} />}
    </details>}
    {scope && <details>
      <summary>Changed files ({files?.length ?? 0}{scope.completeFileList ? '' : '+'})</summary>
      <p>{scope.diffBytes.toLocaleString()} bytes of diff inspected.</p>
      {!scope.completeFileList && <p>Showing the first page of file metadata.</p>}
      <ul>{files?.map(file => <li key={file.path}><code>{file.path}</code> +{file.added} / −{file.removed}</li>)}</ul>
    </details>}
  </>
}

function verdictsClass(verdict: Verdict) {
  if (verdict === 'confirmed-regression') return 'danger'
  if (verdict === 'no-regression-in-executed-checks') return 'success'
  return ''
}

function App() {
  const [data, setData] = useState<ReviewView>()
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [pending, setPending] = useState<{ previous: string | null; since: number }>()
  const [refresh, setRefresh] = useState(0)
  const running = data?.current?.state === 'running'
  useEffect(() => { void view.theme.enable().catch(() => undefined) }, [])
  useEffect(() => {
    let active = true
    let timer: ReturnType<typeof setTimeout>
    async function update() {
      try {
        const next = await invoke<ReviewView>('status')
        if (!active) return
        setData(next)
        setError('')
        const waiting = pending && (!next.current || next.current.attempt === pending.previous)
        if (pending && (!waiting || Date.now() - pending.since > 180_000)) {
          setPending(undefined)
          if (waiting) setError('Forge accepted the job, but the worker has not reported a result. Refresh or retry.')
        }
      } catch {
        if (active) setError('Could not load the review. Check your Bitbucket access, then refresh.')
      }
      if (active) timer = setTimeout(update, pending || running ? 4000 : 25000)
    }
    void update()
    return () => { active = false; clearTimeout(timer) }
  }, [pending, refresh, running])

  async function start() {
    setSubmitting(true)
    setError('')
    try {
      const result = await invoke<{ jobId: string | null; previousAttempt: string | null }>('runReview')
      if (result.jobId) setPending({ previous: result.previousAttempt, since: Date.now() })
      setRefresh(value => value + 1)
    } catch {
      setError('Could not queue the review. Check your access and try again.')
    } finally {
      setSubmitting(false)
    }
  }

  const report = data?.current
  return <div className="panel">
    <header>
      <div>
        <h1>Pull request review</h1>
        {data && <p className="muted">{data.pr.title} · {data.pr.sourceBranch} → {data.pr.destinationBranch}</p>}
      </div>
      <div className="actions">
        <button onClick={() => setRefresh(value => value + 1)}>Refresh</button>
        <button className="primary" disabled={!data || running || !!pending || submitting} onClick={start}>
          {report?.state === 'failed' ? 'Retry review' : report ? 'Run again' : 'Run review'}
        </button>
      </div>
    </header>
    {error && <p role="alert" className="danger">{error}</p>}
    <p role="status" className="muted">{submitting || pending ? 'Review queued…' :
      running ? 'Review in progress…' : !data ? (error ? '' : 'Loading review…') :
      !report ? 'No review for the current commits.' :
      'Last analyzed ' + new Date(report.finishedAt ?? report.startedAt).toLocaleString()}</p>
    {data && <p className="revision">Base <code>{data.pr.base}</code> · Head <code>{data.pr.head}</code></p>}
    {report && report.state !== 'running' && <ReportDetails report={report} />}
    {!!data?.pr.jiraKeys.length && <details open>
      <summary>Referenced Jira issues</summary>
      <ul>{data.pr.jiraKeys.map(key => <li key={key}>{data.jiraSite ?
        <button onClick={() => void router.open('https://' + data.jiraSite + '/browse/' + key)}>{key}</button> : key}</li>)}</ul>
    </details>}
    {!!data?.recent.length && <details>
      <summary>Recent review runs</summary>
      <ul>{data.recent.map(run => <li key={run.attempt}>
        <time dateTime={run.startedAt}>{new Date(run.startedAt).toLocaleString()}</time>
        {' · '}{run.pr.head.slice(0, 12)}{' · '}{run.verdict ? verdicts[run.verdict] : run.state}
      </li>)}</ul>
    </details>}
  </div>
}

createRoot(document.getElementById('root')!).render(<App />)
