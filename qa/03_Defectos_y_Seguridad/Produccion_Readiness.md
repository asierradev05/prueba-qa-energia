# 08 · Production readiness audit

> Aplicando la skill **production-audit** (lente de "¿está listo para producción / qué se rompe en prod?"). Evidencia local, sin enviar código a servicios externos.

**Veredicto: 42/100 — BLOCKED** (no desplegar hasta resolver los bloqueantes).

El tope de 69 se aplica porque **la autenticación es eludible** (SEC-01) y hay **secretos por defecto**. Además CI no está verificado en remoto y hay dependencias con vulnerabilidades alcanzables.

---

## Blockers (deben arreglarse antes de desplegar)

1. **Auth eludible (SEC-01).** Se puede forjar un JWT válido con `dev-secret-change-me` y leer toda la API sin credenciales. Verificado: `200 OK`. → `backend/internal/config/config.go:14,55`, `backend/cmd/api/main.go:53-55`.
2. **Secretos y credenciales por defecto (SEC-05).** `JWT_SECRET` y `AUTH_PASSWORD=admin123` vienen por defecto; el arranque solo emite un `WARN` y continúa. Debe ser **fail-closed** fuera de desarrollo.
3. **Dependencias vulnerables (SEC-06).** `govulncheck`: **10 vulnerabilidades alcanzables** de la stdlib de Go (`crypto/x509`, `net/http`, `net/http/internal/http2`, `net/textproto`, `crypto/tls`), todas con fix en Go **1.27.2 / 1.27.3**. El repo usa go1.27.0. → `qa/evidencias/seguridad-govulncheck.txt`.

## High-value fixes (siguiente nivel)

- **DEF-02** (P1): clasificación errónea M-106 (falso positivo → ALERT) altera la decisión operativa.
- **DEF-04** (P1): hora de planta dependiente de la zona del navegador.
- **DEF-03** (P2): `page` negativo → HTTP 500 (panic de slice).
- **SEC-02/03/04**: cabeceras de seguridad, rate limiting y sacar el JWT de `localStorage`.
- **Endurecer nginx** (`frontend/nginx.conf`): hoy sin cabeceras ni forzado de HTTPS.
- Añadir un **health check que compruebe dependencias** (hoy `/health` responde 200 sin verificar nada del estado interno).

## Evidence checked (recolectada localmente)

- `git status --short --branch` → rama `main`, 5 commits locales por delante de `origin/main`.
- `git ls-files` → **493 archivos**; ninguno de `node_modules`, reportes ni `.env` real. Solo `.env.example` versionado.
- **Build:** `go build ./...` OK · `go vet ./...` OK · `go test ./...` OK (backend).
- **Frontend:** `pnpm lint` OK · `pnpm typecheck` OK · `pnpm test` 11/11 OK.
- **E2E:** Playwright **27 passed** (`qa/evidencias/e2e-run.txt`).
- **Seguridad:** `qa/evidencias/seguridad-probe.txt`, `seguridad-login-enum.txt`, `seguridad-govulncheck.txt`.
- **Deploy:** `docker-compose.yml`, `backend/Dockerfile`, `frontend/Dockerfile`, `frontend/nginx.conf` presentes.
- Sin migraciones SQL (los datos son JSON embebido) → sin riesgo de migración.

## Evidence missing (lo que faltaría para subir la confianza)

- URL de staging desplegada para un smoke real post-deploy.
- Ejecución de CI en remoto (el workflow existe; no se pudo verificar en GitHub por falta de push).
- Prueba de carga/estrés (fuera de alcance acordado).

## Recalculo del score si se arreglan los bloqueantes

| Escenario | Score estimado |
|---|---|
| Hoy | 42 (Blocked) |
| + SEC-01 y SEC-05 (fail-closed + secreto real) | 62 (Risky) |
| + Go 1.27.3 (deps) + SEC-02/03 | 74 (Launchable With Caveats) |
| + DEF-02 y DEF-04 + E2E en CI verde | 85 (Strong) |

## Next action

Arreglar SEC-01 (fail-closed con el secreto por defecto + secreto real ≥32 bytes) y actualizar Go a 1.27.3. Son las dos palancas de mayor impacto.

#energia #qa #produccion #audit
