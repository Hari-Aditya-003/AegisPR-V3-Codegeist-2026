import { invoke, router, rovo, view } from '@forge/bridge'
import { useEffect, useState, type FormEvent } from 'react'
import { createRoot } from 'react-dom/client'
import type { Snapshot } from '../src/records'
import './style.css'

type Data = {
  requirement: { key: string; summary: string; status: string; description: string }
  report: Snapshot | null
}
type IssueType = { id: string; name: string }

function App() {
  const [data, setData] = useState<Data>()
  const [raw, setRaw] = useState('')
  const [title, setTitle] = useState('')
  const [type, setType] = useState('')
  const [issueTypes, setIssueTypes] = useState<IssueType[]>()
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState(false)
  const [created, setCreated] = useState('')
  const [rovoEnabled, setRovoEnabled] = useState(false)

  async function run(task: () => Promise<void>, fallback: string) {
    setBusy(true)
    setError(false)
    setMessage('')
    try { await task() } catch (failure) {
      setError(true)
      setMessage(failure instanceof Error && failure.message.length < 220 ? failure.message : fallback)
    } finally { setBusy(false) }
  }

  function refresh() {
    void run(async () => setData(await invoke<Data>('load')), 'Could not load the Jira issue.')
  }

  useEffect(() => {
    void view.theme.enable().catch(() => undefined)
    void rovo.isEnabled().then(setRovoEnabled).catch(() => undefined)
    refresh()
  }, [])

  function publish(event: FormEvent) {
    event.preventDefault()
    void run(async () => {
      const report = await invoke<Snapshot>('save', { snapshot: raw })
      setData(previous => previous && ({ ...previous, report }))
      setMessage('Review snapshot saved on this issue.')
      setRaw('')
    }, 'Could not share the review.')
  }

  function create(event: FormEvent) {
    event.preventDefault()
    void run(async () => {
      const result = await invoke<{ key: string }>('createFollowUp', { type, title })
      setCreated(result.key)
      setTitle('')
      setMessage('Created ' + result.key + '.')
    }, 'Could not create the follow-up.')
  }

  return <div className="panel">
    <header><h1>AegisPR evidence</h1><button onClick={refresh} disabled={busy}>Refresh</button></header>
    <p role={error ? 'alert' : 'status'}>{message || (busy ? 'Working…' : '')}</p>
    {data && <>
      <h2>{data.requirement.key} · {data.requirement.summary}</h2>
      <p>{data.requirement.status}</p>
      <details>
        <summary>Jira description</summary>
        <p className="description">{data.requirement.description || 'No description provided.'}</p>
      </details>
      {data.report ? <details open>
        <summary>Shared report for Bitbucket PR #{data.report.pullRequest}</summary>
        <p>{data.report.verdict.replaceAll('-', ' ')} · {new Date(data.report.analyzedAt).toLocaleString()}</p>
        <p>Base <code>{data.report.base}</code> · Head <code>{data.report.head}</code></p>
        <ul>{data.report.evidence.map((item, i) => <li key={i}>{item.name} · Base {item.base} · Head {item.head}</li>)}</ul>
        {rovoEnabled && <button onClick={() => void run(() => rovo.open({
          type: 'forge', agentKey: 'aegis-review-assistant', agentName: 'Aegis Review Assistant',
          prompt: 'Explain the AegisPR evidence shared on ' + data.requirement.key + '.',
        }), 'Could not open Aegis Review Assistant.')}>Ask Aegis Review Assistant</button>}
      </details> : <p>No review snapshot has been shared on this issue.</p>}
      <details open={!data.report}>
        <summary>{data.report ? 'Replace review snapshot' : 'Share a review snapshot'}</summary>
        <form onSubmit={publish}>
          <label htmlFor="snapshot">Snapshot JSON from the Bitbucket review panel</label>
          <textarea id="snapshot" value={raw} onChange={event => setRaw(event.target.value)} maxLength={24_000} rows={5} required />
          <p>Sharing makes this snapshot available to people who can browse this Jira issue.</p>
          <button className="primary" disabled={busy || !raw.trim()}>Share with issue readers</button>
        </form>
      </details>
      {data.report && <details>
        <summary>Create Jira follow-up</summary>
        {issueTypes ? <form onSubmit={create}>
          <label htmlFor="type">Issue type</label>
          <select id="type" value={type} onChange={event => setType(event.target.value)} required>
            <option value="">Select an issue type</option>
            {issueTypes.map(item => <option key={item.id} value={item.id}>{item.name}</option>)}
          </select>
          <label htmlFor="title">Follow-up summary</label>
          <input id="title" value={title} onChange={event => setTitle(event.target.value)} minLength={5} maxLength={150} required />
          <button className="primary" disabled={busy}>Create follow-up</button>
        </form> : <button disabled={busy} onClick={() => void run(async () =>
          setIssueTypes(await invoke<IssueType[]>('issueTypes')), 'Could not load issue types.')}>Load issue types</button>}
        {created && <button onClick={() => void router.open('/browse/' + created)}>Open {created}</button>}
      </details>}
    </>}
  </div>
}
createRoot(document.getElementById('root')!).render(<App />)
