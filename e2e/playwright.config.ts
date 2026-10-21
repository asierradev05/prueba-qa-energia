import { defineConfig, devices } from '@playwright/test'

/**
 * Configuración E2E de EnergIA.
 *
 * El sistema se levanta aparte en modo dev:
 *   backend  →  http://localhost:8080   (go run ./cmd/api)
 *   frontend →  http://localhost:5173   (pnpm dev)
 *
 * Autenticación: el proyecto `setup` inicia sesión una vez y guarda el
 * `storageState`; los tests lo reutilizan (no repiten el login).
 *
 * La suite fija la zona horaria del navegador en America/Bogota (zona del
 * negocio) para que las aserciones de "hora de planta" reflejen el uso real.
 */

const STORAGE_STATE = 'playwright/.auth/user.json'

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
    // Genera el storageState con una sesión válida.
    {
      name: 'setup',
      testMatch: /auth\.setup\.ts/,
    },
    // Suite principal: hereda la sesión guardada.
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'], storageState: STORAGE_STATE },
      dependencies: ['setup'],
      testIgnore: /auth\.setup\.ts/,
    },
  ],
})
