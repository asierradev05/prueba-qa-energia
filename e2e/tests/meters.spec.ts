import { API_URL, apiLogin } from './helpers/auth'
import { expect, test } from './fixtures/pages'

test.describe('Meter book', () => {
  test('lists meters with status, consumption, and variation', async ({ metersPage }) => {
    await metersPage.goto()

    const row = metersPage.row('M-109')
    await expect(row).toContainText('2.207,6 kWh')
    await expect(row).toContainText('+109,8 %')
    await expect(row).toContainText('Crítica')
  })

  test('M-106 row shows Normal, not alert — DEF-02', async ({ metersPage }) => {
    test.fail(true, 'DEF-02: M-106 (FALSE_POSITIVE) shows as "Alerta"; expected "Normal".')
    await metersPage.goto()
    await expect(metersPage.row('M-106')).toContainText('Normal')
  })

  test('search "M-109" filters to a single meter', async ({ metersPage }) => {
    await metersPage.goto()
    await metersPage.searchByMeterId('M-109')
    await expect(metersPage.row('M-109')).toBeVisible()
    await expect(metersPage.row('M-101')).toBeHidden()
  })
})

test.describe('Meters API', () => {
  test('meter_id filter is case-insensitive — DEF-01', async ({ request }) => {
    test.fail(true, 'DEF-01: filter.meter_id="m-109" returns 0; expected to match M-109.')
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

  test('M-106 status is NORMAL in the API — DEF-02', async ({ request }) => {
    test.fail(true, 'DEF-02: getById/M-106 returns status=ALERT; expected NORMAL.')
    const token = await apiLogin(request)
    const res = await request.get(`${API_URL}/api/v1/meter/getById/M-106`, {
      headers: { Authorization: `Bearer ${token}` },
    })
    const body = await res.json()
    expect(body.status).toBe('NORMAL')
  })

  test('negative page returns 400, not 500 — DEF-03', async ({ request }) => {
    test.fail(true, 'DEF-03: page=-1 returns HTTP 500; expected 400 validation.')
    const token = await apiLogin(request)
    const res = await request.post(`${API_URL}/api/v1/meter/getAll`, {
      headers: { Authorization: `Bearer ${token}` },
      data: { pagination: { page: -1, size: 10 } },
    })
    expect(res.status()).toBe(400)
  })

  test('dashboard summary counts match expected NORMAL mapping — DEF-02', async ({ request }) => {
    test.fail(true, 'DEF-02: getSummary reports normal=8, alert=2; expected normal=9, alert=1.')
    const token = await apiLogin(request)
    const res = await request.get(`${API_URL}/api/v1/dashboard/getSummary`, {
      headers: { Authorization: `Bearer ${token}` },
    })
    const body = await res.json()
    expect(body.status_counts.normal).toBe(9)
    expect(body.status_counts.alert).toBe(1)
  })
})
