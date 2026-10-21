import { expect, type Page } from '@playwright/test'

/**
 * Pantalla de acceso (`frontend/src/features/auth/components/LoginForm.tsx`).
 * Locators por etiqueta/rol para no acoplarse al CSS.
 */
export class LoginPage {
  constructor(private readonly page: Page) {}

  async goto(): Promise<void> {
    await this.page.goto('/login')
  }

  async fillCredentials(email: string, password: string): Promise<void> {
    await this.page.getByLabel('Email').fill(email)
    await this.page.getByLabel('Contraseña').fill(password)
  }

  async submit(): Promise<void> {
    await this.page.getByRole('button', { name: 'Entrar' }).click()
  }

  async login(email: string, password: string): Promise<void> {
    await this.goto()
    await this.fillCredentials(email, password)
    await this.submit()
  }

  get error(): ReturnType<Page['getByRole']> {
    return this.page.getByRole('alert')
  }

  async expectVisible(): Promise<void> {
    await expect(this.page.getByRole('button', { name: 'Entrar' })).toBeVisible()
  }
}
