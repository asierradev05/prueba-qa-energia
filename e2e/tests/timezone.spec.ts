import { expect, test } from '@playwright/test'
import { API_URL, TOKEN_KEY, apiLogin } from './helpers/auth'

/**
 * DEF-04 (P1): las horas "Detectada" deben ser hora de planta (UTC del dataset),
 * idénticas sin importar la zona del navegador (frontend/README.md:75).
 *
 * Este test abre dos contextos con zonas distintas y compara el MISMO dato de
 * la API: en UTC debe verse igual que en Bogotá. Hoy difiere.
 */
test.describe('Hora de planta', () => {
  test('el instante "Detectada" no depende de la zona del navegador — DEF-04', async ({
    browser,
    request,
  }) => {
    test.fail(
      true,
      'DEF-04: "Detectada" usa la zona del navegador (formatPlantTime). ' +
        'En Bogotá muestra 12/09 09:00; debe ser 12/09 14:00 (hora de planta).',
    )

    const token = await apiLogin(request)

    // Valor de planta según la API (fuente de verdad).
    const api = await request.get(`${API_URL}/api/v1/meter/getById/M-109`, {
      headers: { Authorization: `Bearer ${token}` },
    })
    const detectedAt = (await api.json()).anomaly.detected_at as string // 2026-09-12T14:00:00Z
    const expected = '12/09 14:00' // hora de planta, sin conversión

    const readDetected = async (tz: string) => {
      const context = await browser.newContext({ timezoneId: tz, locale: 'es-CO' })
      const page = await context.newPage()
      await page.addInitScript(
        ([key, value]) => window.localStorage.setItem(key, value),
        [TOKEN_KEY, token],
      )
      await page.goto('/')
      const text = await page.getByText(/Detectada/).first().innerText()
      await context.close()
      return text
    }

    const inUtc = await readDetected('UTC')
    const inBogota = await readDetected('America/Bogota')

    expect(detectedAt).toBe('2026-09-12T14:00:00Z')
    expect(inUtc).toContain(expected)
    // Si las horas fueran de planta, Bogotá mostraría lo mismo que UTC.
    expect(inBogota, 'la hora de planta no debe convertirse a la zona del navegador').toContain(
      expected,
    )
  })
})
