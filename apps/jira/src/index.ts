import api, { route } from '@forge/api'
import Resolver from '@forge/resolver'
import { actions } from './actions'
import { jira } from './jira'

const property = 'aegispr.review.v1'
const client = jira((key, operation, body) => {
  const auth = api.asUser()
  const options = { headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) }
  switch (operation) {
    case 'issue':
      return auth.requestJira(route`/rest/api/3/issue/${key}?fields=summary,description,status,project`)
    case 'get':
      return auth.requestJira(route`/rest/api/3/issue/${key}/properties/${property}`)
    case 'save':
      return auth.requestJira(route`/rest/api/3/issue/${key}/properties/${property}`, { ...options, method: 'PUT' })
    case 'types':
      return auth.requestJira(route`/rest/api/3/issue/createmeta/${key}/issuetypes`)
    case 'create':
      return auth.requestJira(route`/rest/api/3/issue`, { ...options, method: 'POST' })
    default:
      throw new Error('Unsupported Jira operation.')
  }
})
const assistant = actions(client)
export const getReport = (payload: { issueKey?: string }) => assistant.getReport(payload.issueKey)
export const getEvidence = (payload: { issueKey?: string }) => assistant.getEvidence(payload.issueKey)
export const getContext = (payload: { issueKey?: string }) => assistant.getContext(payload.issueKey)

const handler = new Resolver()
handler.define('load', async ({ context }) => {
  const key = context.extension.issue?.key
  const [requirement, report] = await Promise.all([client.context(key), client.report(key)])
  return { requirement, report }
})
handler.define('save', ({ context, payload }) => client.save(context.extension.issue?.key, payload.snapshot))
handler.define('issueTypes', ({ context }) => client.issueTypes(context.extension.issue?.key))
handler.define('createFollowUp', ({ context, payload }) =>
  client.createFollowUp(context.extension.issue?.key, payload.type, payload.title))
export const resolver = handler.getDefinitions()
