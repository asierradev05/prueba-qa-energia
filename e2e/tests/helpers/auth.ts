import { expect, type APIRequestContext, type Page } from '@playwright/test'

export const API_URL = process.env.E2E_API_URL ?? 'http://localhost:8080'

export const CREDENTIALS = {
  email: 'admin@energia.local',
  password: 'admin123',
}

/** Clave real del JWT en localStorage (frontend/src/lib/token-storage.ts). */
export const TOKEN_KEY = 'energyai.token'

/** Autentica por API y devuelve el JWT. */
export async function apiLogin(request: APIRequestContext): Promise<string> {
  const res = await request.post(`${API_URL}/api/v1/auth/login`, {
    data: CREDENTIALS,
  })
  expect(res.ok(), `login API falló: ${res.status()}`).toBeTruthy()
  const body = await res.json()
  return body.access_token as string
}

/**
 * Autentica por UI (flujo real del operador) y deja la sesión iniciada.
 */
export async function loginViaUI(page: Page): Promise<void> {
  await page.goto('/login')
  await page.getByLabel('Email').fill(CREDENTIALS.email)
  await page.getByLabel('Contraseña').fill(CREDENTIALS.password)
  await page.getByRole('button', { name: 'Entrar' }).click()
  await expect(page.getByRole('heading', { name: 'Despacho' })).toBeVisible()
}

/**
 * Siembra el token en localStorage antes de cargar la app, para llegar
 * directo a las pantallas autenticadas sin repetir el formulario.
 */
export async function seedSession(page: Page, request: APIRequestContext): Promise<void> {
  const token = await apiLogin(request)
  await page.addInitScript(
    ([key, value]) => window.localStorage.setItem(key, value),
    [TOKEN_KEY, token],
  )
}
