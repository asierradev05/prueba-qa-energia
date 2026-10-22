# Producción y verificación

> Fuente: `qa/03_Defectos_y_Seguridad/Produccion_Readiness.md` y `qa/03_Defectos_y_Seguridad/Metricas_y_Cobertura.md`.

## Preparación para producción
**42/100 — BLOCKED.** No desplegar. Ver [[00-Inicio/Resumen ejecutivo]].

- **Blockers:** SEC-01 (auth eludible), SEC-05 (secretos por defecto), SEC-06 (10 vulns de stdlib Go, fix en 1.27.3).
- **Al subir el score:** arreglar SEC-01+SEC-05 → 62; + Go 1.27.3 + SEC-02/03 → 74; + DEF-02/DEF-04 + CI verde → 85.

## Gate de verificación
| Fase | Resultado |
|---|---|
| Build | OK |
| Tipos | OK |
| Lint | OK |
| Tests | OK (backend + 11/11 + 27 E2E) |
| Secretos | OK, ninguno embebido |
| Diff | OK, backend/frontend intactos |

## Go/No-Go
**NO-GO.** Ningún P0/P1 puede convivir con un release. El smoke ≤5 min ya está cubierto por `smoke.spec.ts`.

## Huecos de cobertura
`httpx` sin tests (origen de DEF-03) · caso "secreto por defecto" sin test (SEC-01) · `format` con falso verde por `TZ=UTC` (DEF-04).

## Fuera del alcance acordado
- **Accesibilidad (axe-core):** no ejecutada; requeriría añadir dependencias al proyecto. Documentada como límite de alcance.

Volver a: [[index|Índice]] · [[05-Defectos/Registro de defectos]] · [[06-Seguridad/Reporte de seguridad]]

#energia #qa #produccion #verificacion
