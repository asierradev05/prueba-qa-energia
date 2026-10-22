import { test as base } from '@playwright/test'
import { DispatchPage } from '../pages/DispatchPage'
import { LoginPage } from '../pages/LoginPage'
import { MetersPage } from '../pages/MetersPage'

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
