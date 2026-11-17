const gateway = 'http://workspace-gateway.internal:8080'

export default {
  async fetch(request, env) {
    const incoming = new URL(request.url)
    const destination = new URL(gateway)
    destination.pathname = incoming.pathname
    destination.search = incoming.search

    const headers = new Headers(request.headers)
    for (const name of ['host', 'cookie', 'forwarded', 'x-forwarded-for', 'x-forwarded-host', 'x-forwarded-proto']) {
      headers.delete(name)
    }

    try {
      return await env.WORKSPACE_ORIGIN.fetch(new Request(destination, {
        method: request.method,
        headers,
        body: request.body,
        redirect: 'manual',
      }))
    } catch {
      return new Response('The AegisPR workspace is temporarily unavailable.', {
        status: 503,
        headers: {
          'Cache-Control': 'no-store',
          'Content-Type': 'text/plain; charset=utf-8',
          'Retry-After': '30',
        },
      })
    }
  },
}
