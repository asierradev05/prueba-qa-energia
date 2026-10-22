import { expect, test as setup } from '@playwright/test'
import { CREDENTIALS, STORAGE_STATE } from './helpers/auth'
import { LoginPage } from './pages/LoginPage'

setup('authenticate and persist storage state', async ({ page }) => {
  const loginPage = new LoginPage(page)
  await loginPage.login(CREDENTIALS.email, CREDENTIALS.password)
  await expect(page.getByRole('heading', { name: 'Despacho' })).toBeVisible()
  await page.context().storageState({ path: STORAGE_STATE })
})
