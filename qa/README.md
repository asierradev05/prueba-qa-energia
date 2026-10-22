# Prueba técnica QA · EnergIA

Documentación completa de la prueba de QA sobre **EnergIA** (backend Go + frontend React/Vite).
Todo el contenido se obtuvo **ejecutando el sistema real** (modo dev, backend `:8080`, frontend `:5173`), commit base `15765d9`.

## Entregables (nombres del enunciado)

| # | Entregable | Archivo (Markdown) | Informe HTML |
|---|---|---|---|
| 1 | Plan de pruebas + resumen ejecutivo | [`01-plan-de-pruebas.md`](01-plan-de-pruebas.md) | [plan-de-pruebas.html](reportes/plan-de-pruebas.html) |
| 2 | Suite de humo | [`02-smoke.md`](02-smoke.md) | [suite-de-humo.html](reportes/suite-de-humo.html) |
| 3 | Casos de caja negra | [`03-casos-caja-negra.md`](03-casos-caja-negra.md) | [casos-caja-negra.html](reportes/casos-caja-negra.html) |
| 4 | Caja blanca | [`04-caja-blanca.md`](04-caja-blanca.md) | [caja-blanca.html](reportes/caja-blanca.html) |
| 5 | Defectos | [`05-defectos.md`](05-defectos.md) | [registro-de-defectos.html](reportes/registro-de-defectos.html) |
| 6 | Evidencias | [`05_Evidencias/`](05_Evidencias/) y [`evidencias/`](evidencias/) | — |

> **Portal completo:** [qa/reportes/index.html](reportes/index.html) — Informes HTML con identidad **BiaEnergy** listos para revisión.

## Extras (más allá del enunciado)

| Extra | Archivo |
|---|---|
| Reporte de seguridad (7 hallazgos, SEC-01 crítica) | [`03_Defectos_y_Seguridad/Seguridad.md`](03_Defectos_y_Seguridad/Seguridad.md) |
| Preparación para producción (42/100, bloqueado) | [`03_Defectos_y_Seguridad/Produccion_Readiness.md`](03_Defectos_y_Seguridad/Produccion_Readiness.md) |
| Mapa funcional y análisis de estabilidad | [`01_Plan_y_Estrategia/Mapa_Funcional.md`](01_Plan_y_Estrategia/Mapa_Funcional.md) |
| Reportes interactivos (HTML) | [`06_Reportes_Interactivos/`](06_Reportes_Interactivos/) |
| Índice de entrega | [`00_Resumen_Ejecutivo/INDICE_ENTREGA.md`](00_Resumen_Ejecutivo/INDICE_ENTREGA.md) |
| Vault navegable (Obsidian) | [`vault/index.md`](vault/index.md) |

## Veredicto

**No liberar a producción.** Una vulnerabilidad crítica (SEC-01) y dos defectos P1 (DEF-02, DEF-04) afectan la información que usa el operador para decidir. Detalle en [`01-plan-de-pruebas.md`](01-plan-de-pruebas.md#resumen-ejecutivo) y [`05-defectos.md`](05-defectos.md).

## Estructura

```
qa/
├── README.md                     ← este índice
├── 01-plan-de-pruebas.md         ← entregable 1
├── 02-smoke.md                   ← entregable 2
├── 03-casos-caja-negra.md        ← entregable 3
├── 04-caja-blanca.md             ← entregable 4
├── 05-defectos.md                ← entregable 5
├── 05_Evidencias/                ← entregable 6: capturas, logs, herramientas
├── evidencias/                   ← logs de servidor (arranque)
├── 00_Resumen_Ejecutivo/         ← resumen + índice de entrega
├── 01_Plan_y_Estrategia/         ← plan completo + mapa funcional
├── 02_Pruebas_Funcionales/       ← humo, caja negra, caja blanca (detalle completo)
├── 03_Defectos_y_Seguridad/      ← defectos, seguridad, readiness
├── 04_Automatizacion_E2E/        ← guía hacia e2e/
├── 06_Reportes_Interactivos/     ← diagramas HTML
├── 07_Anexos_Internos/           ← bitácora y notas de proceso
└── vault/                        ← vault de Obsidian (vista navegable del mismo contenido)
```
