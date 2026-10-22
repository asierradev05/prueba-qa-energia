import { expect, type APIRequestContext, type Page } from '@playwright/test'

export const API_URL = process.env.E2E_API_URL ?? 'http://localhost:8080'
export const STORAGE_STATE = 'playwright/.auth/user.json'

/** localStorage key used by the frontend (`token-storage.ts`). */
export const TOKEN_KEY = 'energyai.token'

export const CREDENTIALS = {
  email: 'admin@energia.local',
  password: 'admin123',
} as const

export async function apiLogin(request: APIRequestContext): Promise<string> {
  const res = await request.post(`${API_URL}/api/v1/auth/login`, {
    data: CREDENTIALS,
  })
  expect(res.ok(), `API login failed: ${res.status()}`).toBeTruthy()
  const body = await res.json()
  return body.access_token as string
}

/** Injects a JWT into localStorage before the app loads. */
export async function injectToken(page: Page, token: string): Promise<void> {
  await page.addInitScript(
    ([key, value]) => window.localStorage.setItem(key, value),
    [TOKEN_KEY, token],
  )
}
