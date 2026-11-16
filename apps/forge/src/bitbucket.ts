import type { PullRequest, Target } from './contracts'
import { jiraKeys, uuid } from './identity'

export class BitbucketError extends Error {
  constructor(message: string, public readonly status: number, public readonly retryAfter = 0) {
    super(message)
  }
}

export type ResponseLike = Pick<Response, 'status' | 'ok' | 'arrayBuffer'> & {
  headers: Pick<Headers, 'get'>
  body?: ReadableStream<Uint8Array> | null
}
export type BitbucketTransport = (parts: string[]) => Promise<ResponseLike>

const DIFF_LIMIT = 320_000
const JSON_LIMIT = 150_000
const FILE_LIMIT = 32_000

async function read(response: ResponseLike, limit: number): Promise<string> {
  if (!response.ok) {
    const retryAfter = Number(response.headers.get('retry-after')) || 0
    const message = response.status === 429 ? 'Bitbucket rate limit reached.' :
      [401, 403, 404].includes(response.status) ? 'Bitbucket resource is unavailable or access was denied.' :
      'Bitbucket returned an error.'
    throw new BitbucketError(message, response.status, retryAfter)
  }
  const tooLarge = () => new BitbucketError('Bitbucket response exceeds the review size limit.', 413)
  if (Number(response.headers.get('content-length')) > limit) {
    if (typeof response.body?.cancel === 'function') await response.body.cancel()
    throw tooLarge()
  }
  if (typeof response.body?.getReader !== 'function') {
    // The Forge backend response exposes arrayBuffer even when a stream is unavailable.
    const buffer = await response.arrayBuffer()
    if (buffer.byteLength > limit) throw tooLarge()
    return new TextDecoder().decode(buffer)
  }
  const chunks = response.body.getReader()
  const decoder = new TextDecoder()
  let size = 0
  let result = ''
  try {
    for (;;) {
      const { value, done } = await chunks.read()
      if (done) return result + decoder.decode()
      size += value.byteLength
      if (size > limit) {
        await chunks.cancel()
        throw tooLarge()
      }
      result += decoder.decode(value, { stream: true })
    }
  } finally {
    chunks.releaseLock()
  }
}

type PrPayload = {
  id: number
  title?: string
  description?: string
  source?: { commit?: { hash?: string }; branch?: { name?: string }; repository?: { uuid?: string } }
  destination?: { commit?: { hash?: string }; branch?: { name?: string }; repository?: { uuid?: string } }
}

export function bitbucket(request: BitbucketTransport, ref: Target) {
  const repository = ['2.0', 'repositories', ref.workspace, ref.repository]
  const pullRequest = [...repository, 'pullrequests', String(ref.id)]
  const load = async (parts: string[], limit: number) => read(await request(parts), limit)

  return {
    async metadata(): Promise<PullRequest> {
      const data: PrPayload = JSON.parse(await load(pullRequest, JSON_LIMIT))
      const base = data.destination?.commit?.hash
      const head = data.source?.commit?.hash
      const validHash = /^[a-f0-9]{12,40}$/i
      if (data.id !== ref.id || uuid(data.destination?.repository?.uuid) !== ref.repository ||
          !base || !head || !validHash.test(base) || !validHash.test(head)) {
        throw new Error('Bitbucket returned an unexpected pull request or revision.')
      }
      const sourceBranch = data.source?.branch?.name ?? ''
      const destinationBranch = data.destination?.branch?.name ?? ''
      const title = data.title ?? ''
      return {
        base, head, title: title.slice(0, 240), sourceBranch: sourceBranch.slice(0, 160),
        destinationBranch: destinationBranch.slice(0, 160),
        jiraKeys: jiraKeys(title, sourceBranch, destinationBranch, data.description ?? ''),
        sameRepository: Boolean(data.source?.repository?.uuid && uuid(data.source.repository.uuid) === ref.repository),
      }
    },
    diff: () => load([...pullRequest, 'diff'], DIFF_LIMIT),
    async files() {
      const page = JSON.parse(await load([...pullRequest, 'diffstat'], JSON_LIMIT)) as {
        values: { new?: { path?: string }; old?: { path?: string }; lines_added?: number; lines_removed?: number }[]
        next?: string
      }
      return {
        entries: page.values.slice(0, 50).map(row => ({
          path: (row.new?.path || row.old?.path || '(unnamed path)').slice(0, 240),
          added: row.lines_added ?? 0,
          removed: row.lines_removed ?? 0,
        })),
        complete: !page.next && page.values.length <= 50,
      }
    },
    source: (commit: string, path: string) => load([...repository, 'src', commit, ...path.split('/')], FILE_LIMIT),
  }
}

export type Bitbucket = ReturnType<typeof bitbucket>
