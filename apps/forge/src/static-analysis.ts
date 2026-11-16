import type { Finding } from './contracts'

export function staticFindings(diff: string): Finding[] {
  const findings: Finding[] = []
  let path = ''
  let line = 0
  let inHunk = false
  for (const row of diff.split('\n')) {
    if (row.startsWith('diff --git ')) {
      path = ''
      inHunk = false
    }
    const hunk = /^@@ -\d+(?:,\d+)? \+(\d+)(?:,\d+)? @@/.exec(row)
    if (hunk) {
      line = Number(hunk[1])
      inHunk = true
      continue
    }
    if (!inHunk && row.startsWith('+++ b/')) path = row.slice(6).split('\t')[0].slice(0, 240)
    if (!inHunk || !path) continue
    if (row.startsWith(' ')) line++
    if (!row.startsWith('+')) continue
    const added = row.slice(1).replace(/\r$/, '')
    if (/^(<{7}|>{7})(\s|$)|^={7}$/.test(added)) {
      findings.push({ kind: 'static', severity: 'high', rule: 'merge-marker', path, line,
        message: 'Added line contains an unresolved merge marker.' })
    } else if (/-----BEGIN (?:[A-Z0-9]+ )*PRIVATE KEY-----/.test(added)) {
      findings.push({ kind: 'static', severity: 'high', rule: 'private-key-marker', path, line,
        message: 'Added line resembles the header of a private key. Check the file before merging.' })
    } else if (/^(?:\s*)(?:debugger;?\s*$|breakpoint\(\)\s*$)/.test(added) && /\.(?:[cm]?[jt]sx?|py)$/.test(path)) {
      findings.push({ kind: 'static', severity: 'medium', rule: 'debug-breakpoint', path, line,
        message: 'Added line contains a debugger breakpoint.' })
    } else if (/[ \t]$/.test(added)) {
      findings.push({ kind: 'static', severity: 'low', rule: 'trailing-whitespace', path, line,
        message: 'Added line ends with whitespace.' })
    }
    line++
    if (findings.length >= 60) break
  }
  return findings
}
