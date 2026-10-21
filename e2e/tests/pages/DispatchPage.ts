import { expect, type Page } from '@playwright/test'

/**
 * Pantalla de despacho (`/`, orden de trabajo priorizada del motor).
 */
export class DispatchPage {
  constructor(private readonly page: Page) {}

  async goto(): Promise<void> {
    await this.page.goto('/')
  }

  async expectLoaded(): Promise<void> {
    await expect(this.page.getByRole('heading', { name: 'Despacho' })).toBeVisible()
  }

  /** Órdenes priorizadas: primer medidor del oráculo (M-109). */
  async expectTopPriorityIs(meterId: string): Promise<void> {
    await expect(this.page.getByText('Prioridad máxima')).toBeVisible()
    await expect(this.page.getByRole('heading', { name: meterId })).toBeVisible()
  }

  get firstDetectedText() {
    return this.page.getByText(/Detectada/).first()
  }
}
