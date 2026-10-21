import { expect, test as setup } from '@playwright/test'
import { CREDENTIALS } from './helpers/auth'
import { LoginPage } from './pages/LoginPage'

const STORAGE_STATE = 'playwright/.auth/user.json'

/**
 * Inicia sesión UNA vez por corrida por el flujo real del operador y guarda el
 * `storageState` (localStorage con el JWT) para reutilizarlo en el resto de los
 * proyectos. Cumple la recomendación del enunciado: login reutilizable por
 * storageState en lugar de loguearse en cada test.
 */
setup('autenticar y guardar estado de sesión', async ({ page }) => {
  const loginPage = new LoginPage(page)
  await loginPage.login(CREDENTIALS.email, CREDENTIALS.password)
  await expect(page.getByRole('heading', { name: 'Despacho' })).toBeVisible()
  await page.context().storageState({ path: STORAGE_STATE })
})
