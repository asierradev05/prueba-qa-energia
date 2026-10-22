# Bitácora de trabajo

> Registro cronológico del trabajo: entorno, comandos clave, resultados y decisiones. Trazabilidad del proceso.

## Entorno
- **SO:** Windows 11 · **Shell:** PowerShell 5.1
- **Backend:** Go 1.27 (`go run ./cmd/api`) → `http://localhost:8080`
- **Frontend:** Node 25, pnpm 12 (`pnpm dev`) → `http://localhost:5173`
- **E2E:** Playwright 1.64 + Chromium
- **Repo:** rama `main`, commit base `15765d9`

## Fases 0–9 (resumen)
| Fase | Qué se hizo | Resultado |
|---|---|---|
| 0 | Preparación del entorno y estructura de evidencias | OK |
| 1 | Mapa funcional + salida del motor (`cmd/inspect`) | Oráculo capturado |
| 2 | Plan de pruebas (alcance, riesgos, criterios) | [`01-plan-de-pruebas.md`](../01-plan-de-pruebas.md) |
| 3 | Levante de backend/frontend, login, exploración API/UI | Evidencias + capturas |
| 4 | Suite de humo | 9/10 PASS (SMK-10 → DEF-02) |
| 5 | Caja negra (UI + API) | 42 casos · 35 PASS |
| 6 | Reporte de defectos | DEF-01…DEF-04 |
| 7 | Caja blanca | Causas raíz por `archivo:línea` |
| 8 | Playwright | 13 → 19 → 27 tests |
| 9 | Resumen ejecutivo | [`RESUMEN.md`](../00_Resumen_Ejecutivo/RESUMEN.md) |

## Endurecimiento del pipeline E2E
- **Page Objects** (`e2e/tests/pages/`: `LoginPage`, `DispatchPage`, `MetersPage`) y **fixtures** (`e2e/tests/fixtures/pages.ts`).
- **storageState**: `e2e/tests/auth.setup.ts` + proyecto `setup` en `e2e/playwright.config.ts`.
- `e2e/tests/api.spec.ts` (contratos con `request`) y `e2e/tests/security.spec.ts` (regresiones de seguridad).

## CI
- `.github/workflows/e2e.yml`: levanta la app, corre la suite, sube el reporte y ejecuta `govulncheck`.

## Seguridad
- Herramientas de reproducción en `qa/05_Evidencias/herramientas/` (`forge-jwt.mjs`, `security-probe.ps1`).
- **SEC-01 confirmada:** token forjado con `dev-secret-change-me` → `200`.
- Cabeceras ausentes, sin rate limiting, JWT en `localStorage`, secretos por defecto, `govulncheck` (10 vulns de stdlib).
- Reporte completo: [`Seguridad.md`](../03_Defectos_y_Seguridad/Seguridad.md) (7 hallazgos + 17 controles).

## Verificación (evidencia)
- `go test ./...` OK · `go build ./...` OK · `go vet` exit 0.
- `pnpm lint`/`typecheck`/`test` OK (11/11 frontend).
- Playwright **27 passed** (`qa/05_Evidencias/logs/e2e-run.txt`).

## Comandos clave (réplica)
```powershell
# Backend / frontend
cd backend; go run ./cmd/api
cd frontend; pnpm dev

# E2E
cd e2e; pnpm test
```

#energia #qa #bitacora
