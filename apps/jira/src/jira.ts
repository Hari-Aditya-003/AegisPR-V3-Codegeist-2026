import { issueKey, parseSnapshot, snapshot } from './records'

type JiraRequest = (key: string, operation: 'issue' | 'get' | 'save' | 'types' | 'create',
  body?: Record<string, unknown>) => Promise<Pick<Response, 'ok' | 'status' | 'json'>>

function textOfAdf(value: unknown): string {
  if (typeof value === 'string') return value.slice(0, 5000)
  const parts: string[] = []
  const stack = [value]
  let length = 0
  let visited = 0
  while (stack.length && length < 5000 && visited++ < 1500) {
    const node = stack.pop()
    if (!node || typeof node !== 'object') continue
    const { text, content, type } = node as { text?: string; content?: unknown[]; type?: string }
    if (typeof text === 'string') {
      parts.push(text.slice(0, 5000 - length))
      length += text.length
    }
    if (type === 'hardBreak') parts.push('\n')
    if (Array.isArray(content)) {
      if (['paragraph', 'heading', 'listItem'].includes(type ?? '') && parts.length) parts.push('\n')
      stack.push(...content.slice(0, 1500).reverse())
    }
  }
  return parts.join('').trim().slice(0, 5000)
}

async function checked(response: Awaited<ReturnType<JiraRequest>>, message: string) {
  if (!response.ok) throw new Error(message + ' (Jira HTTP ' + response.status + ').')
  return response.json()
}

export function jira(request: JiraRequest) {
  const context = async (input: unknown) => {
    const key = issueKey(input)
    const data = await checked(await request(key, 'issue'), 'Could not read this Jira issue')
    return {
      key: issueKey(data.key),
      summary: String(data.fields.summary ?? '').slice(0, 255),
      description: textOfAdf(data.fields.description),
      status: String(data.fields.status?.name ?? '').slice(0, 100),
      projectKey: String(data.fields.project?.key ?? ''),
    }
  }
  const report = async (input: unknown) => {
    const key = (await context(input)).key
    const response = await request(key, 'get')
    if (response.status === 404) return null
    const data = await checked(response, 'Could not read AegisPR evidence')
    const parsed = snapshot.safeParse(data.value)
    if (!parsed.success || !parsed.data.linkedIssues.includes(key)) throw new Error('The saved evidence is invalid.')
    return parsed.data
  }
  return {
    context, report,
    async save(input: unknown, raw: unknown) {
      const key = (await context(input)).key
      const parsed = parseSnapshot(raw, key)
      const response = await request(key, 'save', parsed)
      if (!response.ok) throw new Error('Jira refused to save the snapshot (HTTP ' + response.status + ').')
      return parsed
    },
    async issueTypes(input: unknown) {
      const { projectKey } = await context(input)
      if (!/^[A-Z][A-Z0-9]{1,29}$/.test(projectKey)) throw new Error('Could not identify the Jira project.')
      const data = await checked(await request(projectKey, 'types'), 'Could not read creatable issue types')
      return (data.issueTypes as { id: string; name: string; subtask?: boolean }[])
        .filter(type => !type.subtask && /^\d+$/.test(type.id))
        .map(type => ({ id: type.id, name: type.name }))
    },
    async createFollowUp(input: unknown, type: unknown, title: unknown) {
      const origin = await context(input)
      if (typeof type !== 'string' || !/^\d{1,15}$/.test(type) ||
          typeof title !== 'string' || title.trim().length < 5 || title.trim().length > 150) {
        throw new Error('Select an issue type and enter a summary of 5–150 characters.')
      }
      const saved = await report(origin.key)
      if (!saved) throw new Error('Share a review snapshot before creating a follow-up.')
      const text = 'Follow-up for ' + origin.key + ' · Bitbucket PR #' + saved.pullRequest +
        '\nBase ' + saved.base + ' · Head ' + saved.head + '\nReported outcome: ' + saved.verdict
      const created = await checked(await request(origin.key, 'create', { fields: {
        project: { key: origin.projectKey }, issuetype: { id: type }, summary: title.trim(),
        description: { type: 'doc', version: 1, content: text.split('\n').map(line => ({
          type: 'paragraph', content: [{ type: 'text', text: line }],
        })) },
      } }), 'Could not create a Jira follow-up')
      return { key: issueKey(created.key) }
    },
  }
}
export type Jira = ReturnType<typeof jira>
