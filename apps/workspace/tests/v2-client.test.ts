import { afterEach, expect, it, vi } from 'vitest'
import { apiUrl } from '@/lib/api'
import { getReview, startSafeDemo } from '@/lib/v2-api'

afterEach(() => vi.unstubAllGlobals())

it('posts the fixture to the configured API endpoint', async () => {
  const fetch = vi.fn().mockResolvedValue(Response.json({ id: 'fixture-run' }, { status: 202 }))
  vi.stubGlobal('fetch', fetch)

  await expect(startSafeDemo('py-coupon-floor')).resolves.toMatchObject({ id: 'fixture-run' })
  expect(fetch).toHaveBeenCalledWith(apiUrl('/api/v2/demo'), expect.objectContaining({
    method: 'POST',
    body: JSON.stringify({ fixture_id: 'py-coupon-floor' }),
  }))
})

it('loads a review using the public fixture endpoint before falling back to owner access', async () => {
  const fetch = vi.fn()
    .mockResolvedValueOnce(new Response(null, { status: 404 }))
    .mockResolvedValueOnce(Response.json({ id: 'private-run' }))
  vi.stubGlobal('fetch', fetch)

  await expect(getReview('private-run')).resolves.toMatchObject({ id: 'private-run' })
  expect(fetch.mock.calls.map(call => call[0])).toEqual([
    apiUrl('/api/v2/demo/private-run'),
    apiUrl('/api/v2/reviews/private-run'),
  ])
})
