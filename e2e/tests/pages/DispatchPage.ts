import { expect, type Page } from '@playwright/test'

export class DispatchPage {
  constructor(private readonly page: Page) {}

  async goto(): Promise<void> {
    await this.page.goto('/')
  }

  async expectLoaded(): Promise<void> {
    await expect(this.page.getByRole('heading', { name: 'Despacho' })).toBeVisible()
  }

  async expectTopPriorityIs(meterId: string): Promise<void> {
    await expect(this.page.getByText('Prioridad máxima')).toBeVisible()
    await expect(this.page.getByRole('heading', { name: meterId })).toBeVisible()
  }
}
