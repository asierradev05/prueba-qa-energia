import { expect, type Page } from '@playwright/test'

/**
 * Libro de medidores (`/medidores`): listado, búsqueda y filtros.
 */
export class MetersPage {
  constructor(private readonly page: Page) {}

  async goto(): Promise<void> {
    await this.page.goto('/medidores')
    await expect(this.page.getByRole('heading', { name: 'Libro de medidores' })).toBeVisible()
  }

  /**
   * La búsqueda se aplica al ENVIAR el formulario, no en cada pulsación de tecla
   * (`frontend/src/features/meters/components/MeterFilters.tsx`).
   */
  async searchByMeterId(meterId: string): Promise<void> {
    await this.page.locator('#meter-search').fill(meterId)
    await this.page.getByRole('button', { name: 'Buscar medidor' }).click()
  }

  row(meterId: string) {
    return this.page.getByRole('row', { name: new RegExp(meterId) })
  }
}
