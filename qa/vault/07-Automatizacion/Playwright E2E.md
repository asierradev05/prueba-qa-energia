# Playwright E2E

> Fuente: `e2e/`. **27 tests verdes** (incluye `test.fail` que reproducen defectos).

Ver también: [[05-Defectos/Registro de defectos]] · [[06-Seguridad/Reporte de seguridad]]

## Estructura
```
e2e/
  playwright.config.ts     # proyecto setup + chromium (storageState)
  tests/
    auth.setup.ts          # login una vez → playwright/.auth/user.json
    fixtures/pages.ts      # fixtures con Page Objects
    helpers/auth.ts
    pages/                 # LoginPage, DispatchPage, MetersPage
    api.spec.ts            # contratos de API
    security.spec.ts       # SEC-01/02/03 + controles
    smoke.spec.ts
    meters.spec.ts         # DEF-01/02/03
    timezone.spec.ts       # DEF-04
```

## Cumple lo pedido por el enunciado
- ✅ 1 flujo E2E de negocio (login → libro → filtrar/buscar → detalle).
- ✅ Tests que evidencian defectos (`test.fail` documentado).
- ✅ `e2e/README.md` con un solo comando.
- ✅ Locators semánticos · sin `waitForTimeout` · **storageState** · **Page Objects + fixtures**.
- ✅ Extras: **tests de API**, **timezoneId**, **GitHub Actions**, reporte HTML/trazas/video.

## Endurecimiento de la suite (quality pass)
Refactor de limpieza sobre `e2e/` sin tocar código de producción:
- Helpers muertos eliminados (`loginViaUI`, `seedSession`) → un único `injectToken`.
- Constantes centralizadas en `helpers/auth.ts` (`API_URL`, `STORAGE_STATE`, `TOKEN_KEY`, `CREDENTIALS as const`).
- Locators semánticos y comentarios en inglés; specs sin locators inline.

> **Nota de corrección:** el refactor introdujo `getByLabel('Medidor')` para la búsqueda,
> pero ese locator **rompe en strict mode** (colisiona con el botón `aria-label="Buscar medidor"`,
> que contiene "Medidor"). Se corrigió a `getByRole('combobox', { name: 'Medidor' })`:
> semántico, sin id de CSS y sin ambigüedad. Suite **27 passed** + `tsc --noEmit` exit 0.

## Cómo correr
```bash
cd e2e
pnpm install && pnpm exec playwright install chromium && pnpm test
```

## CI
`.github/workflows/e2e.yml` levanta backend+frontend, corre la suite, sube el reporte y ejecuta `govulncheck`.

#energia #qa #playwright #e2e
