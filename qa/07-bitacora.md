# 07 · Bitácora de trabajo

> Registro cronológico de lo hecho en la prueba: comandos clave, resultados y decisiones. Es la trazabilidad del trabajo, no el entregable.

## Entorno
- **SO:** Windows 11 · **Shell:** PowerShell 5.1
- **Backend:** Go 1.27.0 (`go run ./cmd/api`) → `http://localhost:8080`
- **Frontend:** Node v25.9.0, pnpm 12.14.0 (`pnpm dev`) → `http://localhost:5173`
- **E2E:** Playwright 1.64.1 + Chromium
- **Repo:** `C:\Users\angel\Documents\Codex\prueba-qa` (rama `main`, commit base `15765d9`)

## Fases 0–9 (resumen)
| Fase | Qué se hizo | Resultado |
|---|---|---|
| 0 | Preparación del entorno, `qa/PROGRESO.md`, `qa/evidencias/` | OK |
| 1 | Mapa funcional + salida del motor (`cmd/inspect`) | Oráculo capturado |
| 2 | Plan de pruebas (alcance, riesgos, criterios) | `qa/01-plan-de-pruebas.md` |
| 3 | Levante de backend/frontend, login, exploración API/UI | Evidencias + capturas |
| 4 | Suite de humo | 9/10 PASS (SMK-10 → DEF-02) |
| 5 | Caja negra (UI + API) | 42 casos · 35 PASS |
| 6 | Reporte de defectos | DEF-01…DEF-04 |
| 7 | Caja blanca | Causas raíz por `archivo:línea` |
| 8 | Playwright | 13 → 19 → **27** tests verdes |
| 9 | Resumen ejecutivo | `qa/RESUMEN.md` |

## Bloque "endurecer y destacar" (esta sesión)

### Sanitización
- Se eliminó `qa/evidencias/login-token.txt` (contenía el JWT de dev) y capturas duplicadas.
- Se actualizaron referencias a ese archivo en `api-exploracion.txt` y `02-smoke.md`.

### E2E elevado al enunciado
- Añadidos **Page Objects** (`tests/pages/`: `LoginPage`, `DispatchPage`, `MetersPage`).
- Añadidas **fixtures** (`tests/fixtures/pages.ts`).
- **storageState**: `tests/auth.setup.ts` + proyecto `setup` en `playwright.config.ts`.
- Nuevo `tests/api.spec.ts` (contratos con `request`).

### GitHub Actions
- `.github/workflows/e2e.yml`: levanta app, corre suite, sube reporte y ejecuta `govulncheck`.

### Seguridad de alto nivel
- `qa/evidencias/forge-jwt.mjs` + `security-probe.ps1`.
- **SEC-01 confirmada:** token forjado con `dev-secret-change-me` → `200`.
- Cabeceras ausentes, sin rate limiting, JWT en `localStorage`, secretos por defecto, `govulncheck` (10 vulns stdlib).
- `e2e/tests/security.spec.ts` con regresiones.
- `qa/06-seguridad.md` (7 hallazgos + 17 controles).

### Documentación
- Vault de Obsidian (`qa/vault/`) con MOC, canvas, callouts y wikilinks.
- Esta bitácora.

## Verificación (evidencia)
- `go test ./...` OK · `go build ./...` OK · `go vet` exit 0.
- `pnpm lint`/`typecheck`/`test` OK (11/11 frontend).
- Playwright **27 passed** (`qa/evidencias/e2e-run.txt`).

## Comandos clave (réplica)
```powershell
# PATH fresco (la sesión no lo refresca)
$env:Path = [System.Environment]::GetEnvironmentVariable("Path","Machine") + ";" + [System.Environment]::GetEnvironmentVariable("Path","User")

# Backend / frontend
cd backend; go run ./cmd/api
cd frontend; pnpm dev

# E2E
cd e2e; pnpm test
```

#energia #qa #bitacora
