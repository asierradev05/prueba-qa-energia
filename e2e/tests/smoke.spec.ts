import { API_URL, CREDENTIALS } from './helpers/auth'
import { expect, test } from './fixtures/pages'

test.describe('Smoke · EnergIA', () => {
  test.describe('unauthenticated', () => {
    test.use({ storageState: { cookies: [], origins: [] } })

    test('root redirects to login', async ({ page, loginPage }) => {
      await page.goto('/')
      await expect(page).toHaveURL(/\/login$/)
      await loginPage.expectVisible()
    })

    test('valid login reaches dispatch', async ({ dispatchPage, loginPage }) => {
      await loginPage.login(CREDENTIALS.email, CREDENTIALS.password)
      await dispatchPage.expectLoaded()
    })

    test('invalid credentials show error and stay on login', async ({ page, loginPage }) => {
      await loginPage.login(CREDENTIALS.email, 'wrong-password')
      await expect(page).toHaveURL(/\/login$/)
      await expect(loginPage.error).toContainText(/incorrect/i)
    })
  })

  test('API health is up and protected route requires token', async ({ request }) => {
    const health = await request.get(`${API_URL}/health`)
    expect(health.ok()).toBeTruthy()

    const noAuth = await request.post(`${API_URL}/api/v1/meter/getAll`, { data: {} })
    expect(noAuth.status()).toBe(401)
  })

  test('dispatch shows engine-prioritized work orders', async ({ dispatchPage }) => {
    await dispatchPage.goto()
    await dispatchPage.expectTopPriorityIs('M-109')
  })
})
