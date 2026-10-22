# Bitácora de trabajo

> Registro cronológico de la prueba. Fuente también en `qa/07_Anexos_Internos/Bitacora.md`.

## Resumen por fase
[[01-Plan/Plan de pruebas|Fase 1]] · [[02-Humo/Suite de humo|2]] · [[03-Caja-Negra/Casos de caja negra|3]] · [[04-Caja-Blanca/Caja blanca|4]] · [[05-Defectos/Registro de defectos|5]] · [[06-Seguridad/Reporte de seguridad|6]] · [[07-Automatizacion/Playwright E2E|7]]

## Sesión de endurecimiento
1. Sanitización de evidencias (JWT fuera del repo).
2. E2E con storageState + Page Objects + fixtures + tests de API.
3. GitHub Actions + `govulncheck`.
4. Seguridad de alto nivel → [[05-Defectos/SEC-01 Forja de JWT con secreto por defecto|SEC-01]].
5. Vault de Obsidian.

## Verificación final
- `go test ./...` OK · `go vet` exit 0.
- `pnpm lint`/`typecheck`/`test` OK.
- Playwright **27 passed**.

#energia #qa #bitacora #meta
