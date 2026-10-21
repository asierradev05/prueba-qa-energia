import { API_URL, CREDENTIALS } from './helpers/auth'
import { expect, test } from './fixtures/pages'

/**
 * Humo: el conjunto mínimo que dice "este build se puede probar".
 * Los casos de login parten SIN sesión, por eso vacían el storageState heredado.
 */
test.describe('Humo · EnergIA', () => {
  test.describe('sin sesión', () => {
    test.use({ storageState: { cookies: [], origins: [] } })

    test('la raíz sin sesión redirige al login', async ({ page, loginPage }) => {
      await page.goto('/')
      await expect(page).toHaveURL(/\/login$/)
      await loginPage.expectVisible()
    })

    test('login válido entra al despacho', async ({ dispatchPage, loginPage }) => {
      await loginPage.login(CREDENTIALS.email, CREDENTIALS.password)
      await dispatchPage.expectLoaded()
    })

    test('credenciales inválidas muestran error y no entran', async ({ page, loginPage }) => {
      await loginPage.login(CREDENTIALS.email, 'contraseña-incorrecta')
      await expect(page).toHaveURL(/\/login$/)
      await expect(loginPage.error).toContainText(/incorrect/i)
    })
  })

  test('la API responde y la ruta protegida exige token', async ({ request }) => {
    const health = await request.get(`${API_URL}/health`)
    expect(health.ok()).toBeTruthy()

    const noAuth = await request.post(`${API_URL}/api/v1/meter/getAll`, { data: {} })
    expect(noAuth.status()).toBe(401)
  })

  test('el despacho muestra las órdenes priorizadas del motor', async ({ dispatchPage }) => {
    await dispatchPage.goto()
    // El oráculo: orden 1 = M-109 (anomalía real, prioridad máxima).
    await dispatchPage.expectTopPriorityIs('M-109')
  })
})
