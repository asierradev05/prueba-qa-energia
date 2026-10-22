# End-to-End tests · EnergIA

[Playwright](https://playwright.dev) + TypeScript suite covering critical operator flows and confirming defects documented in `qa/05-defectos.md`.

## Requirements

- Node.js 18+ and pnpm.
- App running in dev mode (see root `README.md`):
  - Backend: `go run ./cmd/api` → `http://localhost:8080`
  - Frontend: `pnpm dev` → `http://localhost:5173`
- Optional env: `E2E_BASE_URL`, `E2E_API_URL` (defaults above).

## Install and run

```bash
cd e2e
pnpm install && pnpm exec playwright install chromium && pnpm test
```

If dependencies and the browser are already installed: `pnpm test`.

```bash
pnpm test:headed   # headed browser
pnpm test:ui       # Playwright UI
pnpm report        # open HTML report
```

## Layout

```
tests/
  auth.setup.ts        # one login → playwright/.auth/user.json (storageState)
  fixtures/pages.ts    # Page Object fixtures
  helpers/auth.ts      # API login, token inject, shared constants
  pages/
    LoginPage.ts
    DispatchPage.ts
    MetersPage.ts
  api.spec.ts          # API contracts
  security.spec.ts     # security regressions (SEC-01/02/03)
  smoke.spec.ts        # availability and minimum happy path
  meters.spec.ts       # meter book + API (business + regression)
  timezone.spec.ts     # plant time independent of browser zone (DEF-04)
```

## Conventions

- Strict TypeScript; semantic locators (`getByRole`, `getByLabel`, `getByText`); no brittle CSS selectors.
- No `waitForTimeout`; use web-first assertions (`toBeVisible`, `toContainText`, `toHaveURL`).
- Reusable login: `setup` authenticates once via UI and saves `storageState`. Login cases clear it with `test.use({ storageState: { cookies: [], origins: [] } })`.
- Page Objects + fixtures; specs do not build locators inline.
- Browser timezone fixed to `America/Bogota` in `playwright.config.ts`.
- `test.fail()` only for confirmed defects (annotated with defect ID). When fixed, remove the annotation after the unexpected pass.

## Defects covered

| Defect | Test |
|---|---|
| DEF-01 (case-insensitive search) | `meters.spec.ts › meter_id filter is case-insensitive` |
| DEF-02 (FALSE_POSITIVE shown as ALERT) | `meters.spec.ts › M-106…`, `…status is NORMAL…`, `…dashboard summary…` |
| DEF-03 (negative page → 500) | `meters.spec.ts › negative page returns 400` |
| DEF-04 (plant time depends on timezone) | `timezone.spec.ts › "Detectada" instant…` |
| SEC-01 (JWT forged with default secret) | `security.spec.ts › JWT signed with default secret…` |
| SEC-02 (missing security headers) | `security.spec.ts › responses include security headers` |
| SEC-03 (no login rate limiting) | `security.spec.ts › login applies rate limiting` |

Full security detail: `qa/anexos/seguridad.md` · defect register: `qa/05-defectos.md`.

## Interpreting results

With open defects, `test.fail()` cases **pass** (failure is expected) and the rest pass. After a fix, those tests **fail** on purpose until `test.fail` is removed.
