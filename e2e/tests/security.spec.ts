import { createHmac } from 'node:crypto'
import { API_URL, apiLogin } from './helpers/auth'
import { expect, test } from '@playwright/test'

/**
 * Regresiones de seguridad (ver qa/06-seguridad.md).
 *
 * Cada test codifica el comportamiento CORRECTO para que los defectos de hoy se
 * conviertan en fallos reproducibles y en verde cuando se corrijan.
 */

/** Forja un JWT HS256 con un secreto dado (mismo formato que emite el backend). */
function forgeJwt(secret: string, subject: string): string {
  const b64url = (buf: Buffer) =>
    buf.toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
  const now = Math.floor(Date.now() / 1000)
  const header = { alg: 'HS256', typ: 'JWT' }
  const payload = { name: 'atacante', sub: subject, iss: 'energyai-api', iat: now, exp: now + 3600 }
  const input = `${b64url(Buffer.from(JSON.stringify(header)))}.${b64url(Buffer.from(JSON.stringify(payload)))}`
  const sig = createHmac('sha256', secret).update(input).digest()
  return `${input}.${b64url(sig)}`
}

test.describe('Seguridad · autenticación', () => {
  test('un token firmado con el secreto por defecto NO autentica — SEC-01', async ({ request }) => {
    // SEC-01 (crítica): con JWT_SECRET=dev-secret-change-me el token forjado da 200.
    // Debe rechazarse (401): el despliegue no puede usar el secreto por defecto.
    test.fail(
      true,
      'SEC-01: un JWT firmado con "dev-secret-change-me" autentica (200). Debe ser 401: no arrancar con el secreto por defecto.',
    )
    const forged = forgeJwt('dev-secret-change-me', 'attacker@evil.local')
    const res = await request.get(`${API_URL}/api/v1/auth/me`, {
      headers: { Authorization: `Bearer ${forged}` },
    })
    expect(res.status()).toBe(401)
  })

  test('token con alg=none es rechazado', async ({ request }) => {
    const b64url = (s: string) =>
      Buffer.from(s).toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
    const none = `${b64url('{"alg":"none","typ":"JWT"}')}.${b64url('{"sub":"x","iss":"energyai-api","exp":9999999999}')}.`
    const res = await request.get(`${API_URL}/api/v1/auth/me`, {
      headers: { Authorization: `Bearer ${none}` },
    })
    expect(res.status()).toBe(401)
  })

  test('token malformado es rechazado', async ({ request }) => {
    const res = await request.get(`${API_URL}/api/v1/auth/me`, {
      headers: { Authorization: 'Bearer abc.def.ghi' },
    })
    expect(res.status()).toBe(401)
  })

  test('el login no revela si el email existe', async ({ request }) => {
    const missing = await request.post(`${API_URL}/api/v1/auth/login`, {
      data: { email: 'noexiste@x.com', password: 'x' },
    })
    const wrongPass = await request.post(`${API_URL}/api/v1/auth/login`, {
      data: { email: 'admin@energia.local', password: 'x' },
    })
    expect(missing.status()).toBe(401)
    expect(wrongPass.status()).toBe(401)
    expect((await missing.json()).message).toBe((await wrongPass.json()).message)
  })
})

test.describe('Seguridad · endurecimiento', () => {
  test('las respuestas incluyen cabeceras de seguridad — SEC-02', async ({ request }) => {
    // SEC-02: hoy no hay ninguna cabecera de seguridad (CSP, nosniff, etc.).
    test.fail(true, 'SEC-02: faltan cabeceras de seguridad (X-Content-Type-Options, CSP, X-Frame-Options).')
    const res = await request.get(`${API_URL}/health`)
    const headers = res.headers()
    expect(headers['x-content-type-options']).toBe('nosniff')
    expect(headers['x-frame-options']).toBeTruthy()
  })

  test('el login aplica rate limiting — SEC-03', async ({ request }) => {
    // SEC-03: 20 intentos fallidos devuelven 401 y nunca 429.
    test.fail(true, 'SEC-03: no hay rate limiting en /auth/login (20×401, sin 429).')
    const statuses: number[] = []
    for (let i = 0; i < 20; i++) {
      const res = await request.post(`${API_URL}/api/v1/auth/login`, {
        data: { email: 'admin@energia.local', password: `mal-${i}` },
      })
      statuses.push(res.status())
    }
    expect(statuses).toContain(429)
  })
})

test.describe('Seguridad · entrada de datos', () => {
  test('la inyección en filtros no tiene efecto', async ({ request }) => {
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

  test('un body mayor de 1 MB es rechazado', async ({ request }) => {
    const token = await apiLogin(request)
    const big = '{"filter":{"meter_id":"' + 'A'.repeat(2000000) + '"}}'
    const res = await request.post(`${API_URL}/api/v1/meter/getAll`, {
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      data: big,
    })
    expect(res.status()).toBe(400)
  })
})
