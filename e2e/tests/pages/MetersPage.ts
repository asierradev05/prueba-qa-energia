import { expect, type Locator, type Page } from '@playwright/test'

export class MetersPage {
  constructor(private readonly page: Page) {}

  async goto(): Promise<void> {
    await this.page.goto('/medidores')
    await expect(this.page.getByRole('heading', { name: 'Libro de medidores' })).toBeVisible()
  }

  /** Search applies on form submit, not on each keystroke. */
  async searchByMeterId(meterId: string): Promise<void> {
    await this.page.getByLabel('Medidor').fill(meterId)
    await this.page.getByRole('button', { name: 'Buscar medidor' }).click()
  }

  row(meterId: string): Locator {
    return this.page.getByRole('row', { name: new RegExp(meterId) })
  }
}
