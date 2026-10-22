import { expect, test } from '@playwright/test'
import { API_URL, apiLogin, injectToken } from './helpers/auth'

/**
 * DEF-04: "Detectada" must show plant time (UTC from the dataset), independent
 * of the browser timezone. Same API timestamp must render identically in UTC and Bogotá.
 */
test.describe('Plant time', () => {
  test('"Detectada" instant does not depend on browser timezone — DEF-04', async ({
    browser,
    request,
  }) => {
    test.fail(
      true,
      'DEF-04: "Detectada" uses browser timezone (formatPlantTime). ' +
        'Bogotá shows 12/09 09:00; expected 12/09 14:00 (plant time).',
    )

    const token = await apiLogin(request)
    const api = await request.get(`${API_URL}/api/v1/meter/getById/M-109`, {
      headers: { Authorization: `Bearer ${token}` },
    })
    const detectedAt = (await api.json()).anomaly.detected_at as string
    const expectedPlantTime = '12/09 14:00'

    const readDetected = async (timezoneId: string) => {
      const context = await browser.newContext({ timezoneId, locale: 'es-CO' })
      const page = await context.newPage()
      await injectToken(page, token)
      await page.goto('/')
      const text = await page.getByText(/Detectada/).first().innerText()
      await context.close()
      return text
    }

    const inUtc = await readDetected('UTC')
    const inBogota = await readDetected('America/Bogota')

    expect(detectedAt).toBe('2026-09-12T14:00:00Z')
    expect(inUtc).toContain(expectedPlantTime)
    expect(inBogota, 'plant time must not be converted to the browser timezone').toContain(
      expectedPlantTime,
    )
  })
})
