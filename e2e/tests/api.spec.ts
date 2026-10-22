import { expect, test } from '@playwright/test'
import { API_URL, CREDENTIALS, apiLogin } from './helpers/auth'

test.describe('API contracts', () => {
  test('rejects invalid credentials with 401', async ({ request }) => {
    const res = await request.post(`${API_URL}/api/v1/auth/login`, {
      data: { email: CREDENTIALS.email, password: 'wrong' },
    })
    expect(res.status()).toBe(401)
  })

  test('protected route without token returns 401', async ({ request }) => {
    const res = await request.post(`${API_URL}/api/v1/meter/getAll`, { data: {} })
    expect(res.status()).toBe(401)
  })

  test('getById for unknown meter returns 404', async ({ request }) => {
    const token = await apiLogin(request)
    const res = await request.get(`${API_URL}/api/v1/meter/getById/M-999`, {
      headers: { Authorization: `Bearer ${token}` },
    })
    expect(res.status()).toBe(404)
  })

  test('pagination with out-of-range size returns 400', async ({ request }) => {
    const token = await apiLogin(request)
    const res = await request.post(`${API_URL}/api/v1/meter/getAll`, {
      headers: { Authorization: `Bearer ${token}` },
      data: { pagination: { page: 1, size: 9999 } },
    })
    expect(res.status()).toBe(400)
  })

  test('default listing returns 12 meters', async ({ request }) => {
    const token = await apiLogin(request)
    const res = await request.post(`${API_URL}/api/v1/meter/getAll`, {
      headers: { Authorization: `Bearer ${token}` },
      data: {},
    })
    expect(res.status()).toBe(200)
    expect((await res.json()).count).toBe(12)
  })
})
