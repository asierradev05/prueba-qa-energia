import { defineConfig, devices } from '@playwright/test'
import { STORAGE_STATE } from './tests/helpers/auth'

/**
 * Prerequisites (run separately):
 *   backend  → http://localhost:8080
 *   frontend → http://localhost:5173
 *
 * The `setup` project logs in once and persists storageState for the suite.
 * Browser timezone is America/Bogota (plant/business zone).
 */
export default defineConfig({
  testDir: './tests',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: [['list'], ['html', { open: 'never', outputFolder: 'playwright-report' }]],

  use: {
    baseURL: process.env.E2E_BASE_URL ?? 'http://localhost:5173',
    timezoneId: 'America/Bogota',
    locale: 'es-CO',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },

  projects: [
    {
      name: 'setup',
      testMatch: /auth\.setup\.ts/,
    },
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'], storageState: STORAGE_STATE },
      dependencies: ['setup'],
      testIgnore: /auth\.setup\.ts/,
    },
  ],
})
