# Prueba técnica QA · EnergIA

Entrega alineada al enunciado. Todo se ejecutó contra el sistema real (modo dev, backend `:8080`, frontend `:5173`), commit base `15765d9`.

## Veredicto

**No liberar a producción.** Bloquean el release: **SEC-01** (bypass de autenticación, crítica) y **DEF-02 / DEF-04** (P1: el operador ve mal el estado y la hora de planta). Detalle en [`01-plan-de-pruebas.md`](01-plan-de-pruebas.md#10-resumen-ejecutivo) y [`05-defectos.md`](05-defectos.md).

## Cómo revisar (ruta del evaluador)

| Orden | Archivo | Qué mirar |
|:---:|---|---|
| 1 | [`01-plan-de-pruebas.md`](01-plan-de-pruebas.md) | Alcance, riesgos, criterios · **resumen ejecutivo** |
| 2 | [`02-smoke.md`](02-smoke.md) | Suite mínima 9/10 PASS |
| 3 | [`03-casos-caja-negra.md`](03-casos-caja-negra.md) | ~26 casos curados con técnicas + tablas de decisión |
| 4 | [`04-caja-blanca.md`](04-caja-blanca.md) | Ramas de riesgo + confianza en tests existentes + tests propuestos |
| 5 | [`05-defectos.md`](05-defectos.md) | 4 DEF + SEC-01 · pasos, evidencia, causa raíz |
| 6 | [`evidencias/`](evidencias/) | API, capturas, logs, herramientas de reproducción |
| 7 | [`../e2e/README.md`](../e2e/README.md) | Playwright · un comando: `cd e2e && pnpm install && pnpm exec playwright install chromium && pnpm test` |

Video de la entrega: *(pegar enlace aquí — YouTube no listado / Loom / Drive)*.

## Estructura (como pide el enunciado)

```
qa/
├── 01-plan-de-pruebas.md
├── 02-smoke.md
├── 03-casos-caja-negra.md
├── 04-caja-blanca.md
├── 05-defectos.md
├── evidencias/
└── anexos/                 ← opcional (seguridad extendida, readiness, guion)
e2e/
├── README.md
├── playwright.config.ts
└── tests/...
```

## Anexos (fuera del núcleo de evaluación)

| Anexo | Contenido |
|---|---|
| [`anexos/seguridad.md`](anexos/seguridad.md) | SEC-01…SEC-07 completos |
| [`anexos/produccion-readiness.md`](anexos/produccion-readiness.md) | Scorecard de producción |
| [`anexos/mapa-funcional.md`](anexos/mapa-funcional.md) | Mapa funcional |
| [`anexos/guion-video.md`](anexos/guion-video.md) | Guion del video ≤15 min |

## Reglas respetadas

- No se modificó `backend/` ni `frontend/` para “arreglar” defectos; solo se reportan.
- Se añadieron artefactos en `qa/`, `e2e/` y (si aplica) `.github/`.
- Uso de IA: acelerador de análisis/redacción; **todos** los resultados se validaron ejecutando la app.
