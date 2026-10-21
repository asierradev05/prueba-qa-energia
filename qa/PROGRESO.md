# PROGRESO · Prueba técnica QA · EnergIA

Bitácora de trabajo. Se actualiza al final de cada fase.

## Estado general

- **Fase actual:** todas las fases (0-9) completadas.
- **Repositorio:** `biaenergy/prueba-qa` clonado en `C:\Users\angel\Documents\Codex\prueba-qa`
- **Rama:** `main` · **Commit base:** `15765d9` ("Update PRUEBA_QA.md")
- **Working tree:** limpio al iniciar (sin cambios del usuario previos).

## Fase 0 — Reconocimiento y preparación (COMPLETADA)

### Actividades completadas
- Clonado del repositorio con `gh repo clone` (autenticado como `asierradev05`).
- Inspección de estructura: `backend/` (Go 1.26), `frontend/` (React 19 + Vite), `docker-compose.yml`.
- Lectura de documentación oráculo: `README.md`, `PRUEBA_QA.md`, `backend/README.md`, `frontend/README.md`, `frontend/PRODUCT.md`, `.env.example`, `docker-compose.yml`.
- Verificación de herramientas del entorno.
- Ejecución de la suite de tests del backend: `go test ./...` → **todos OK**.

### Entorno verificado

| Herramienta | Estado inicial | Acción |
|---|---|---|
| git 2.53.0 | OK | — |
| gh 2.98.0 | OK (auth `asierradev05`) | — |
| node v25.9.0 / npm 11.12.1 | OK | — |
| go | NO instalado | Instalado vía winget → **go1.27.0** |
| pnpm | NO instalado | Instalado vía `npm i -g pnpm` → **12.14.0** |
| docker | NO instalado | **Decisión: se omite (modo dev sin Docker)** |

> Nota de entorno: la sesión de shell no refresca el PATH automáticamente. En cada comando que use `go`/`pnpm` se antepone:
> `$env:Path = [Environment]::GetEnvironmentVariable("Path","Machine") + ";" + [Environment]::GetEnvironmentVariable("Path","User")`

### Evidencia obtenida
- `go test ./...` (backend): todos los paquetes con tests en `ok`. Sin `[no test files]` relevantes salvo módulos previstos.
  - Paquetes con tests OK: `ai`, `analysis`, `analysis/baseline`, `analysis/changes`, `analysis/classify`, `analysis/quality`, `analysis/stats`, `auth`, `config`, `data`, `meter`, `server`.

### Bloqueos
- Ninguno activo. Docker ausente por decisión (no bloquea UI/API/E2E en modo dev).

### Decisiones tomadas
1. **Levantar en modo dev** (Go nativo + `pnpm dev`) en lugar de Docker. Justificación: Docker requiere WSL2/Hyper-V y reinicio; el modo dev cubre todo lo que se necesita para smoke, caja negra y Playwright.
2. **No instalar Docker.** Evita riesgos de sistema y tiempos de setup.
3. Se conservará intacto el código de producción; solo se añaden artefactos en `qa/` y `e2e/`.

### Próxima acción
Fase 1 — Levantamiento del producto: construir matriz funcional, entidades, reglas de negocio, estados/severidades y endpoints a partir de la documentación y del código.

## Fase 1 — Levantamiento del producto (COMPLETADA)
- Producto: matriz funcional, roles, entidades, flujos, reglas de negocio, endpoints, pantallas y riesgos documentados en `qa/_fase1-mapa-funcional.md`.
- Hallazgos preliminares (a verificar en fases siguientes, NO confirmados):
  1. `formatPlantTime` usa hora local del navegador; `formatPlantDate/Day` usan UTC → posible desfase de fecha/hora en America/Bogota.
  2. Búsqueda `meter_id` sin normalizar mayúsculas, pese a que la doc promete "sin importar mayúsculas".
  3. `pagination.page` negativo no se valida → posible 500 por slice fuera de rango.
  4. Doc dice "supera 50/20 %" pero el código usa `>=`.
- Criterio de salida: CUMPLIDO.

## Fase 2 — Plan y estrategia de pruebas (COMPLETADA)
- Entregable: `qa/01-plan-de-pruebas.md` (alcance, riesgos R1-R7, estrategia, técnicas, datos, criterios, limitaciones, uso de IA).
- Criterio de salida: CUMPLIDO.

## Fase 3 — Levantar y explorar la aplicación (COMPLETADA)
- Backend `go run ./cmd/api` en `:8080` (PID 21164); `/health` OK.
- Frontend `pnpm dev` en `:5173` (PID 2968); 200 OK.
- Login real OK (JWT Bearer, exp 28800). Ruta protegida sin token → 401.
- Exploración API y UI guardada en `qa/evidencias/api-exploracion.txt` y `qa/evidencias/ui-fechas-timezone.txt`.
- Rutas UI reales: `/login`, `/` (despacho), `/medidores`, `/medidores/:id`, `/anomalias`, `/anomalias/:id`.
- Selectores UI para E2E: `#email`, `#password`, `button[type=submit]`; `#meter-search`; radios `name=estado`; `#sort-by`; botones "Anterior"/"Siguiente".
- Criterio de salida: CUMPLIDO.

## Fase 4 — Suite de humo (COMPLETADA)
- Entregable: `qa/02-smoke.md`. Resultado: **9/10 PASS, 1 FAIL** (SMK-10, estado M-106 = ALERT en vez de NORMAL).
- El build arranca, autentica, sirve datos y el motor reproduce el resultado esperado → apto para pruebas profundas.
- Criterio de salida: CUMPLIDO.

## Fase 5 — Caja negra (EN CURSO)
- API probada por ejecución real: login/auth, getAll (filtro/búsqueda/orden/paginación), getById, getParams, dashboard/getSummary, validaciones (400) y errores.
- **4 defectos confirmados por ejecución** (ver `qa/05-defectos.md`):
  - DEF-01: búsqueda `meter_id` no ignora mayúsculas (doc dice que sí).
  - DEF-02: FALSE_POSITIVE (M-106) mostrado como ALERT (doc: NORMAL).
  - DEF-03: `pagination.page` negativo → HTTP 500 (panic `slice bounds out of range`).
  - DEF-04: `formatPlantTime` usa hora local del navegador → desfase fecha/hora (reproducido en 4 zonas).
- Pendiente: cerrar casos de caja negra de la UI (formularios, estados vacíos).

## Fase 6 — Defectos (COMPLETADA)
- Entregable: `qa/05-defectos.md` con DEF-01..DEF-04 (severidad, contrato violado, pasos, causa raíz, corrección propuesta, evidencia) + observaciones OBS-01 y RIESGO-W1.



## Fase 7 — Caja blanca (COMPLETADA)
- Entregable: `qa/04-caja-blanca.md`. Causa raíz de los 4 defectos por análisis de ramas/límites.
- Suites ejecutadas: `go test ./...` OK; `pnpm test` 11/11 PASS (no detecta DEF-04 por `TZ=UTC` forzado).

## Fase 8 — Automatización Playwright (COMPLETADA)
- Entregable: `e2e/` (package.json, playwright.config.ts, tsconfig.json, README.md, tests/{helpers/auth.ts, smoke.spec.ts, meters.spec.ts, timezone.spec.ts}).
- Resultado real: `pnpm test` → **13 passed** (7 de flujo + 6 con `test.fail` que reproduce cada defecto).
- Evidencia: `qa/evidencias/e2e-run.txt`, reporte HTML en `e2e/playwright-report/`.
- Playwright 1.64.1 + Chromium; zona fijada en America/Bogota.

## Fase 9 — Revisión final (COMPLETADA)
- Entregables: `qa/01-plan-de-pruebas.md §10` (resumen ejecutivo con veredicto), `qa/07-bitacora.md`, `qa/RESUMEN.md`.
- Veredicto: **NO liberar a producción** (SEC-01 crítica, DEF-02 y DEF-04 P1).

## Fase 10 — Seguridad de alto nivel (COMPLETADA)
- Entregable: `qa/06-seguridad.md` (SEC-01..SEC-07 + matriz de 17 controles).
- SEC-01 crítica confirmada: forja de JWT con `dev-secret-change-me` → 200.
- Evidencias: `seguridad-probe.txt`, `seguridad-login-enum.txt`, `seguridad-govulncheck.txt` (10 vulns de stdlib), `forge-jwt.mjs`, `security-probe.ps1`.

## Fase 11 — Endurecimiento E2E y CI (COMPLETADA)
- Suite elevada: storageState + Page Objects + fixtures + `api.spec.ts` + `security.spec.ts` → **27 passed**.
- `.github/workflows/e2e.yml` (levanta app, corre suite, `govulncheck`, sube reporte).

## Fase 12 — Vault de Obsidian (COMPLETADA)
- `qa/vault/`: MOC, canvas, notas por fase, una por defecto, índice de evidencias y meta.

## Fase 13 — Verificación con skills de QA (COMPLETADA)
- **Locales:** verification-loop (gate PASS), e2e-testing, browser-qa, ai-regression-testing, production-audit.
- **Externas** (petrkindlmann/qa-skills): qa-project-context, release-readiness, bug-reproduction, qa-metrics, coverage-analysis, qa-report-humanizer.
- Entregables: `.agents/qa-project-context.md`, `qa/08-produccion-readiness.md` (42/100 BLOCKED), `qa/09-verificacion-skills.md`, `qa/10-skills-externas.md`.
- Pendiente reconocido: accesibilidad con axe-core (no ejecutada; decisión explícita de no instalar dependencias).

## Estado final
- **Commits locales (6):** plan/defectos, seguridad+bitácora, vault, e2e, CI, skills/verificación. `main` por delante de `origin/main`.
- **Working tree:** limpio. Código de producción **intacto** (`backend/`/`frontend/` sin cambios).
