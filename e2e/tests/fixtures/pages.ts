import { test as base } from '@playwright/test'
import { DispatchPage } from '../pages/DispatchPage'
import { LoginPage } from '../pages/LoginPage'
import { MetersPage } from '../pages/MetersPage'

/**
 * Fixtures de Page Objects. Cada test recibe las páginas listas para usar,
 * evitando construir locators a mano dentro de la especificación.
 *
 * El inicio de sesión NO ocurre aquí: se reutiliza el `storageState` generado
 * por `auth.setup.ts` (login una sola vez por corrida).
 */
type Pages = {
  loginPage: LoginPage
  dispatchPage: DispatchPage
  metersPage: MetersPage
}

export const test = base.extend<Pages>({
  loginPage: async ({ page }, use) => {
    await use(new LoginPage(page))
  },
  dispatchPage: async ({ page }, use) => {
    await use(new DispatchPage(page))
  },
  metersPage: async ({ page }, use) => {
    await use(new MetersPage(page))
  },
})

export { expect } from '@playwright/test'
