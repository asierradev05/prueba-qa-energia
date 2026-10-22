# Índice de Entrega QA - EnergIA

> **Entrega completa.** Todo lo necesario para revisar esta prueba técnica está organizado por secciones lógicas.

## Ruta rápida para el validador

| Orden | Sección | Archivo/Carpeta | Descripción |
|---|---|---|---|
| **1** | **Resumen Ejecutivo** | [`00_Resumen_Ejecutivo/RESUMEN.md`](00_Resumen_Ejecutivo/RESUMEN.md) | Veredicto: **No liberar a producción**. Riesgos abiertos, hallazgos clave. |
| **2** | **Plan y Estrategia** | [`01_Plan_y_Estrategia/Plan_de_Pruebas.md`](01_Plan_y_Estrategia/Plan_de_Pruebas.md) | Alcance, riesgos, técnicas, criterios de entrada/salida. |
| **3** | **Pruebas Funcionales** | [`02_Pruebas_Funcionales/`](02_Pruebas_Funcionales/) | Humo (9/10), Caja Negra (42 casos), Caja Blanca (análisis + propuesta de tests). |
| **4** | **Defectos y Seguridad** | [`03_Defectos_y_Seguridad/`](03_Defectos_y_Seguridad/) | 4 defectos confirmados con causa raíz + 7 hallazgos de seguridad (SEC-01 crítica) + Readiness. |
| **5** | **Automatización E2E** | [`04_Automatizacion_E2E/`](04_Automatizacion_E2E/) | Guía hacia [`../../e2e/`](../../e2e/) - 27 tests Playwright. |
| **6** | **Evidencias** | [`05_Evidencias/`](05_Evidencias/) | Capturas, logs verbatim, exploración API, herramientas de reproducción. |
| **7** | **Reportes Interactivos** | [`06_Reportes_Interactivos/`](06_Reportes_Interactivos/) | Diagramas navegables (Arquitectura, Entregables, Página para el video). |

## Archivos clave para revisión rápida

| Archivo | Propósito |
|---|---|
| [`03_Defectos_y_Seguridad/Defectos.md`](03_Defectos_y_Seguridad/Defectos.md) | Defectos reproducibles con pasos, evidencia y `archivo:línea`. |
| [`03_Defectos_y_Seguridad/Seguridad.md`](03_Defectos_y_Seguridad/Seguridad.md) | Hallazgos de seguridad con evidencia real. |
| [`02_Pruebas_Funcionales/02_Caja_Negra.md`](02_Pruebas_Funcionales/02_Caja_Negra.md) | Casos con técnicas (partición, valores límite, tablas de decisión). |
| [`06_Reportes_Interactivos/video-entrega-qa.html`](06_Reportes_Interactivos/video-entrega-qa.html) | Vista general interactiva (recomendada para revisión). |
| [`../../e2e/README.md`](../../e2e/README.md) | Cómo ejecutar la suite automatizada (un solo comando). |

## Notas

- **Sin cambios a producción:** Solo se añadió `qa/`, `e2e/`, `.github/`. No se modificó `backend/` ni `frontend/`.
- **Evidencias reales:** Todo ejecutado contra la app levantada en modo dev. Los logs, capturas y respuestas API son verbatim.
- **Material interno:** Las bitácoras y verificaciones se encuentran en [`07_Anexos_Internos/`](07_Anexos_Internos/) fuera de la ruta principal de evaluación.
