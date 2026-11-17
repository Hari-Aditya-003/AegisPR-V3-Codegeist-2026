import Link from 'next/link'
import styles from './guide.module.css'

const chapters = [
  ['run', 'Run a fixture'],
  ['proof', 'Proof and repair'],
  ['github', 'GitHub reviews'],
  ['forge', 'Bitbucket, Jira and Rovo'],
  ['model-settings', 'Model settings'],
  ['benchmarks', 'Benchmarks and resources'],
]

export default function Guide() {
  return <div className={styles.guide}>
    <header className={styles.intro}><h1>Getting started with AegisPR V3</h1>
      <p>Run a controlled example, inspect base and head evidence, and use the Forge apps on your own pull request.</p>
      <Link className="v2-button" href="/#run-fixture">Open the review workspace</Link>
    </header>
    <div className={styles.layout}>
      <nav className={styles.chapters} aria-label="Guide chapters">
        <p>On this page</p><ul>{chapters.map(([id, title]) => <li key={id}><a href={'#' + id}>{title}</a></li>)}</ul>
      </nav>
      <div className={styles.content}>
        <section id="run"><h2>Run a fixture</h2>
          <p>Choose a Python or JavaScript fixture under <strong>Live safe example</strong> and select <strong>Run safe example</strong>. The workspace executes three checks on base and three on head.</p>
        </section>
        <section id="proof"><h2>Inspect proof and a repair</h2>
          <p>Open <strong>Proof</strong> for revisions, repeated results, captured output and the Ed25519 receipt. You can verify and download the receipt, and export findings as SARIF.</p>
          <p>For a reproduced fixture regression, open <strong>Repair</strong> to evaluate the prewritten patch. The result links to the prior receipt.</p>
        </section>
        <section id="github"><h2>Review a pinned GitHub PR</h2>
          <p>Use the owner access code if your deployment requires one. Open <strong>Review a pull request</strong>, enter the allowlisted public GitHub PR URL, and supply the current base and head SHA. Static findings and skipped files appear under <strong>Findings</strong> and <strong>Coverage</strong>.</p>
        </section>
        <section id="forge"><h2>Use Bitbucket, Jira and Rovo</h2>
          <p>Install the Forge apps from the <Link href="/atlassian">Atlassian integrations</Link> page. Open a PR overview in Bitbucket. AegisPR automatically schedules review when a PR is created or updated. You can run it manually from the panel.</p>
          <p>Copy a completed snapshot for Jira or import it into the workspace. In Jira, open <strong>View app actions</strong>, choose <strong>AegisPR evidence</strong>, and share the snapshot on the issue named in the PR. Use <strong>Ask Aegis Review Assistant</strong> to inspect the cited results.</p>
        </section>
        <section id="model-settings"><h2>Review model settings</h2>
          <p>Model calls are optional and consume the operator’s provider budget. The <Link href="/settings">Models &amp; limits</Link> page lists model routing, current configuration and the spending ledger. Review metadata is shared only after per-review consent. Model labels are advisory.</p>
        </section>
        <section id="benchmarks"><h2>Read benchmark and resource measurements</h2>
          <p>Open <Link href="/benchmarks">Benchmarks</Link> and run one to three repetitions of the 12-fixture suite. Each row links to its actual signed review. The sidebar displays available CPU, memory and GPU measurements according to the operator’s telemetry settings.</p>
        </section>
      </div>
    </div>
  </div>
}
