import { createHmac } from 'node:crypto'
import { expect, test } from '@playwright/test'
import { API_URL, CREDENTIALS, apiLogin } from './helpers/auth'

function toBase64Url(input: Buffer | string): string {
  const buf = typeof input === 'string' ? Buffer.from(input) : input
  return buf.toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

/** Forges an HS256 JWT with the given secret (same shape as the backend). */
function forgeJwt(secret: string, subject: string): string {
  const now = Math.floor(Date.now() / 1000)
  const header = toBase64Url(JSON.stringify({ alg: 'HS256', typ: 'JWT' }))
  const payload = toBase64Url(
    JSON.stringify({
      name: 'attacker',
      sub: subject,
      iss: 'energyai-api',
      iat: now,
      exp: now + 3600,
    }),
  )
  const input = `${header}.${payload}`
  const sig = createHmac('sha256', secret).update(input).digest()
  return `${input}.${toBase64Url(sig)}`
}

test.describe('Security · authentication', () => {
  test('JWT signed with default secret must not authenticate — SEC-01', async ({ request }) => {
    test.fail(
      true,
      'SEC-01: JWT signed with "dev-secret-change-me" authenticates (200). Expected 401.',
    )
    const forged = forgeJwt('dev-secret-change-me', 'attacker@evil.local')
    const res = await request.get(`${API_URL}/api/v1/auth/me`, {
      headers: { Authorization: `Bearer ${forged}` },
    })
    expect(res.status()).toBe(401)
  })

  test('alg=none token is rejected', async ({ request }) => {
    const none = `${toBase64Url('{"alg":"none","typ":"JWT"}')}.${toBase64Url('{"sub":"x","iss":"energyai-api","exp":9999999999}')}.`
    const res = await request.get(`${API_URL}/api/v1/auth/me`, {
      headers: { Authorization: `Bearer ${none}` },
    })
    expect(res.status()).toBe(401)
  })

  test('malformed token is rejected', async ({ request }) => {
    const res = await request.get(`${API_URL}/api/v1/auth/me`, {
      headers: { Authorization: 'Bearer abc.def.ghi' },
    })
    expect(res.status()).toBe(401)
  })

  test('login does not reveal whether the email exists', async ({ request }) => {
    const missing = await request.post(`${API_URL}/api/v1/auth/login`, {
      data: { email: 'missing@example.com', password: 'x' },
    })
    const wrongPass = await request.post(`${API_URL}/api/v1/auth/login`, {
      data: { email: CREDENTIALS.email, password: 'x' },
    })
    expect(missing.status()).toBe(401)
    expect(wrongPass.status()).toBe(401)
    expect((await missing.json()).message).toBe((await wrongPass.json()).message)
  })
})

test.describe('Security · hardening', () => {
  test('responses include security headers — SEC-02', async ({ request }) => {
    test.fail(true, 'SEC-02: missing security headers (X-Content-Type-Options, CSP, X-Frame-Options).')
    const res = await request.get(`${API_URL}/health`)
    const headers = res.headers()
    expect(headers['x-content-type-options']).toBe('nosniff')
    expect(headers['x-frame-options']).toBeTruthy()
  })

  test('login applies rate limiting — SEC-03', async ({ request }) => {
    test.fail(true, 'SEC-03: no rate limiting on /auth/login (20×401, no 429).')
    const statuses: number[] = []
    for (let i = 0; i < 20; i++) {
      const res = await request.post(`${API_URL}/api/v1/auth/login`, {
        data: { email: CREDENTIALS.email, password: `wrong-${i}` },
      })
      statuses.push(res.status())
    }
    expect(statuses).toContain(429)
  })
})

test.describe('Security · input handling', () => {
  test('injection payloads in filters have no effect', async ({ request }) => {
    const token = await apiLogin(request)
    for (const payload of ["' OR '1'='1", "M-109' UNION SELECT * FROM users--", '../../etc/passwd']) {
      const res = await request.post(`${API_URL}/api/v1/meter/getAll`, {
        headers: { Authorization: `Bearer ${token}` },
        data: { filter: { meter_id: payload } },
      })
      expect(res.status()).toBe(200)
      expect((await res.json()).count).toBe(0)
    }
  })

  test('body larger than 1 MB is rejected', async ({ request }) => {
    const token = await apiLogin(request)
    const big = '{"filter":{"meter_id":"' + 'A'.repeat(2_000_000) + '"}}'
    const res = await request.post(`${API_URL}/api/v1/meter/getAll`, {
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      data: big,
    })
    expect(res.status()).toBe(400)
  })
})
