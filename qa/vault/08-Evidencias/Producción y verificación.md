# Producción y verificación

> Fuente: `qa/08-produccion-readiness.md`, `qa/09-verificacion-skills.md`, `qa/10-skills-externas.md`.

## Production readiness (skill production-audit)
**42/100 — BLOCKED.** No desplegar. Ver [[00-Inicio/Resumen ejecutivo]].

- **Blockers:** SEC-01 (auth eludible), SEC-05 (secretos por defecto), SEC-06 (10 vulns de stdlib Go, fix en 1.27.3).
- **Al subir el score:** arreglar SEC-01+SEC-05 → 62; + Go 1.27.3 + SEC-02/03 → 74; + DEF-02/DEF-04 + CI verde → 85.

## Verification loop (skill verification-loop)
| Fase | Resultado |
|---|---|
| Build | ✅ |
| Tipos | ✅ |
| Lint | ✅ |
| Tests | ✅ (backend + 11/11 + 27 E2E) |
| Secretos | ✅ ninguno embebido |
| Diff | ✅ backend/frontend intactos |

## Skills de QA aplicadas
- **Locales:** verification-loop, e2e-testing, browser-qa, ai-regression-testing, production-audit.
- **Externas** ([petrkindlmann/qa-skills](https://github.com/petrkindlmann/qa-skills)): qa-project-context, release-readiness, bug-reproduction, qa-metrics, coverage-analysis, qa-report-humanizer.
- **Contexto:** `.agents/qa-project-context.md`.

## Go/No-Go (skill release-readiness)
**NO-GO.** Ningún P0/P1 puede convivir con un release. Smoke ≤5 min ya cubierto por `smoke.spec.ts`.

## Huecos de cobertura (skill coverage-analysis)
`httpx` sin tests (origen de DEF-03) · caso "secreto por defecto" sin test (SEC-01) · `format` con falso verde por `TZ=UTC` (DEF-04).

## Pendiente reconocido
- **Accesibilidad (axe-core):** no ejecutado (decisión explícita de no instalar dependencias). Documentado como pendiente en `qa/09-verificacion-skills.md`.

Volver a: [[index|Índice]] · [[05-Defectos/Registro de defectos]] · [[06-Seguridad/Reporte de seguridad]]

#energia #qa #produccion #verificacion
