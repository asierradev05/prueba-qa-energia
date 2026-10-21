import { API_URL, apiLogin } from './helpers/auth'
import { expect, test } from './fixtures/pages'

test.describe('Libro de medidores', () => {
  test('lista los medidores con su estado, consumo y variación', async ({ metersPage }) => {
    await metersPage.goto()

    const row = metersPage.row('M-109')
    await expect(row).toContainText('2.207,6 kWh')
    await expect(row).toContainText('+109,8 %')
    await expect(row).toContainText('Crítica')
  })

  test('fila M-106 se muestra como Normal y no como alerta', async ({ metersPage }) => {
    // DEF-02 (P1): un FALSE_POSITIVE debe verse "Normal" (backend/README.md:103-108).
    test.fail(true, 'DEF-02: M-106 (FALSE_POSITIVE) se muestra como "Alerta"; debe ser "Normal".')
    await metersPage.goto()
    await expect(metersPage.row('M-106')).toContainText('Normal')
  })

  test('buscar "M-109" filtra a un solo medidor', async ({ metersPage }) => {
    await metersPage.goto()
    await metersPage.searchByMeterId('M-109')
    await expect(metersPage.row('M-109')).toBeVisible()
    await expect(metersPage.row('M-101')).toBeHidden()
  })
})

test.describe('API de medidores', () => {
  test('búsqueda por id no ignora mayúsculas — DEF-01', async ({ request }) => {
    // DEF-01: la doc promete búsqueda "sin importar mayúsculas" (backend/README.md:96).
    test.fail(true, 'DEF-01: filter.meter_id="m-109" devuelve 0 resultados; debe encontrar M-109.')
    const token = await apiLogin(request)
    const headers = { Authorization: `Bearer ${token}` }

    const upper = await request.post(`${API_URL}/api/v1/meter/getAll`, {
      headers,
      data: { filter: { meter_id: 'M-109' } },
    })
    expect((await upper.json()).count).toBe(1)

    const lower = await request.post(`${API_URL}/api/v1/meter/getAll`, {
      headers,
      data: { filter: { meter_id: 'm-109' } },
    })
    expect((await lower.json()).count).toBe(1)
  })

  test('el estado de M-106 es NORMAL en la API — DEF-02', async ({ request }) => {
    // DEF-02: FALSE_POSITIVE → NORMAL (backend/README.md:103-108).
    test.fail(true, 'DEF-02: getById/M-106 devuelve status=ALERT; debe ser NORMAL.')
    const token = await apiLogin(request)
    const res = await request.get(`${API_URL}/api/v1/meter/getById/M-106`, {
      headers: { Authorization: `Bearer ${token}` },
    })
    const body = await res.json()
    expect(body.status).toBe('NORMAL')
  })

  test('paginación con page negativo responde 400, no 500 — DEF-03', async ({ request }) => {
    // DEF-03: entrada inválida debe ser 400, no 500 (panic por slice fuera de rango).
    test.fail(true, 'DEF-03: page=-1 provoca HTTP 500; debe ser 400 de validación.')
    const token = await apiLogin(request)
    const res = await request.post(`${API_URL}/api/v1/meter/getAll`, {
      headers: { Authorization: `Bearer ${token}` },
      data: { pagination: { page: -1, size: 10 } },
    })
    expect(res.status()).toBe(400)
  })

  test('resumen del dashboard con conteos coherentes con la doc — DEF-02', async ({ request }) => {
    // Con M-106 como NORMAL, el dashboard debe contar 9 normales y 1 alerta.
    test.fail(true, 'DEF-02: getSummary reporta normal=8, alert=2; con la doc debe ser normal=9, alert=1.')
    const token = await apiLogin(request)
    const res = await request.get(`${API_URL}/api/v1/dashboard/getSummary`, {
      headers: { Authorization: `Bearer ${token}` },
    })
    const body = await res.json()
    expect(body.status_counts.normal).toBe(9)
    expect(body.status_counts.alert).toBe(1)
  })
})
