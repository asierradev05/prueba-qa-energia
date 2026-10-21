import { API_URL, apiLogin } from './helpers/auth'
import { expect, test } from '@playwright/test'

/**
 * Contratos de API verificados con el `request` de Playwright.
 * Complementa los flujos de UI sin depender del navegador.
 */
test.describe('Contratos de API', () => {
  test('rechaza credenciales inválidas con 401', async ({ request }) => {
    const res = await request.post(`${API_URL}/api/v1/auth/login`, {
      data: { email: 'admin@energia.local', password: 'mal' },
    })
    expect(res.status()).toBe(401)
  })

  test('la ruta protegida sin token responde 401', async ({ request }) => {
    const res = await request.post(`${API_URL}/api/v1/meter/getAll`, { data: {} })
    expect(res.status()).toBe(401)
  })

  test('getById de un medidor inexistente responde 404', async ({ request }) => {
    const token = await apiLogin(request)
    const res = await request.get(`${API_URL}/api/v1/meter/getById/M-999`, {
      headers: { Authorization: `Bearer ${token}` },
    })
    expect(res.status()).toBe(404)
  })

  test('paginación con size fuera de rango responde 400', async ({ request }) => {
    const token = await apiLogin(request)
    const res = await request.post(`${API_URL}/api/v1/meter/getAll`, {
      headers: { Authorization: `Bearer ${token}` },
      data: { pagination: { page: 1, size: 9999 } },
    })
    expect(res.status()).toBe(400)
  })

  test('el listado por defecto devuelve los 12 medidores', async ({ request }) => {
    const token = await apiLogin(request)
    const res = await request.post(`${API_URL}/api/v1/meter/getAll`, {
      headers: { Authorization: `Bearer ${token}` },
      data: {},
    })
    expect(res.status()).toBe(200)
    expect((await res.json()).count).toBe(12)
  })
})
