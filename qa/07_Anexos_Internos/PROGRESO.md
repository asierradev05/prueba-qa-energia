# Progreso · Prueba técnica QA · EnergIA

Registro cronológico por fases. Entorno: backend Go en `:8080`, frontend en `:5173` (modo dev), commit base `15765d9`.

## Estado general

- **Fases 0-13:** completadas.
- **Repositorio:** `biaenergy/prueba-qa`, rama `main`, commit base `15765d9`.
- **Código de producción:** intacto (`backend/` y `frontend/` sin cambios); la entrega solo añade `qa/`, `e2e/` y `.github/`.

## Fase 0 — Reconocimiento y preparación

- Estructura inspeccionada: `backend/` (Go), `frontend/` (React 19 + Vite), `docker-compose.yml`.
- Lectura de la documentación-oráculo: `README.md`, `PRUEBA_QA.md`, `backend/README.md`, `frontend/README.md`, `frontend/PRODUCT.md`, `.env.example`, `docker-compose.yml`.
- Herramientas del entorno: git, gh, node/npm, Go (instalado vía winget → 1.27), pnpm (instalado vía npm → 12). Docker no disponible.
- `go test ./...` → todos los paquetes OK.

### Decisión de entorno
Se levanta en **modo dev** (Go nativo + `pnpm dev`) en lugar de Docker: Docker requiere WSL2/Hyper-V y reinicio, y el modo dev cubre smoke, caja negra, caja blanca y Playwright.

## Fase 1 — Levantamiento del producto

- Matriz funcional, roles, entidades, flujos, reglas de negocio, endpoints, pantallas y riesgos: [`Mapa_Funcional.md`](../01_Plan_y_Estrategia/Mapa_Funcional.md).
- Hipótesis preliminares (confirmadas luego por ejecución): desfase de fecha/hora en `formatPlantTime`, búsqueda `meter_id` sin normalizar mayúsculas, `pagination.page` negativo sin validar, y doc "supera 50/20 %" vs código `>=`.

## Fase 2 — Plan y estrategia

- Entregable: [`01-plan-de-pruebas.md`](../01-plan-de-pruebas.md) (alcance, riesgos R1-R7, estrategia, técnicas, datos, criterios, limitaciones, uso de IA).

## Fase 3 — Levantamiento y exploración

- Backend `go run ./cmd/api` en `:8080`; `/health` OK. Frontend `pnpm dev` en `:5173`; 200 OK.
- Login real OK (JWT Bearer, exp 28800); ruta protegida sin token → 401.
- Exploración API y UI en `qa/05_Evidencias/api/` (exploración, fechas/zona horaria).
- Rutas UI reales: `/login`, `/` (despacho), `/medidores`, `/medidores/:id`, `/anomalias`, `/anomalias/:id`.

## Fase 4 — Suite de humo

- Entregable: [`02-smoke.md`](../02-smoke.md). Resultado: **9/10 PASS, 1 FAIL** (SMK-10, estado M-106 = ALERT en vez de NORMAL).

## Fase 5 — Caja negra

- API y UI probadas por ejecución real: login/auth, `getAll` (filtro/búsqueda/orden/paginación), `getById`, `getParams`, `dashboard/getSummary`, validaciones (400) y errores.
- Entregable: [`03-casos-caja-negra.md`](../03-casos-caja-negra.md). **42 casos · 35 PASS · 5 FAIL agrupados en 4 defectos.**

## Fase 6 — Registro de defectos

- Entregable: [`05-defectos.md`](../05-defectos.md) con DEF-01..DEF-04 (severidad, contrato violado, pasos, causa raíz, corrección propuesta, evidencia) + observaciones OBS-01 y RIESGO-W1.

## Fase 7 — Caja blanca

- Entregable: [`04-caja-blanca.md`](../04-caja-blanca.md). Causa raíz de los 4 defectos por análisis de ramas/límites.
- Suites ejecutadas: `go test ./...` OK; `pnpm test` 11/11 PASS (no detecta DEF-04 por el `TZ=UTC` forzado en `vite.config.ts`).

## Fase 8 — Automatización Playwright

- Entregable: `e2e/` (package.json, playwright.config.ts, tsconfig.json, README.md, `.gitignore`).
- Estructura: `tests/{auth.setup,smoke,meters,timezone,api,security}.spec.ts`, `tests/pages/{LoginPage,DispatchPage,MetersPage}.ts`, `tests/fixtures/pages.ts`, `tests/helpers/auth.ts`.
- Resultado real: `pnpm test` → **27 passed** (flujo de negocio + storageState + API + seguridad + `test.fail` que reproduce cada defecto).
- Evidencia: `qa/05_Evidencias/logs/e2e-run.txt`, reporte HTML en `e2e/playwright-report/`.

## Fase 9 — Revisión final

- Entregables: [`01-plan-de-pruebas.md`](../01-plan-de-pruebas.md) §10 (resumen ejecutivo con veredicto) y [`RESUMEN.md`](../00_Resumen_Ejecutivo/RESUMEN.md).
- Veredicto: **NO liberar a producción** (SEC-01 crítica, DEF-02 y DEF-04 P1).

## Fase 10 — Seguridad

- Entregable: [`Seguridad.md`](../03_Defectos_y_Seguridad/Seguridad.md) (SEC-01..SEC-07 + matriz de 17 controles).
- SEC-01 crítica confirmada: forja de JWT con `dev-secret-change-me` → 200.
- Evidencias: `seguridad-probe.txt`, `seguridad-login-enum.txt`, `seguridad-govulncheck.txt` (10 vulns de stdlib), `forge-jwt.mjs`, `security-probe.ps1`.

## Fase 11 — Endurecimiento E2E y CI

- Suite con storageState + Page Objects + fixtures + `api.spec.ts` + `security.spec.ts` → **27 passed**.
- `.github/workflows/e2e.yml` (levanta la app, corre la suite, `govulncheck`, sube el reporte).

## Fase 12 — Vault de Obsidian

- `qa/vault/`: MOC, canvas, notas por fase, una por defecto, índice de evidencias y meta.

## Fase 13 — Verificación de la entrega

- Gate de calidad (build, tipos, lint, tests, secretos, diff) → PASS con el trabajo de QA completo.
- Auditoría de preparación para producción: [`Produccion_Readiness.md`](../03_Defectos_y_Seguridad/Produccion_Readiness.md) (42/100, bloqueado).
- Métricas y huecos de cobertura: [`Metricas_y_Cobertura.md`](../03_Defectos_y_Seguridad/Metricas_y_Cobertura.md).
