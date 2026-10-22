# Métricas y cobertura · EnergIA

Anexo de soporte al reporte de defectos y a la auditoría de preparación para producción.

## 1. Métricas de la prueba

| Métrica | Fórmula | Valor |
|---|---|---|
| Cobertura de journeys críticos | journeys con E2E / total | 6/6 = **100 %** |
| Tasa de *flakiness* | flaky / total ejecuciones | 0/27 = **0 %** |
| Densidad de defectos | defectos por área | 4 funcionales + 7 de seguridad |
| Passing rate | passed / total | 27/27 = **100 %** (con `test.fail` esperados) |
| Duración de la suite E2E | — | ~10 s |

**Gate de calidad:** release bloqueado si `fallos P0/P1 > 0` o `cobertura de journeys < 100 %`.

## 2. Huecos de cobertura (significativos, no de vanidad)

Se buscó cobertura de **huecos relevantes**, no el 100 % por sí mismo. Sin cobertura de código cuantificada (no se añadieron herramientas de cobertura para no alterar el proyecto), el análisis es por inspección de los módulos de riesgo.

| Módulo | Cobertura de tests | Hueco relevante |
|---|---|---|
| `analysis/classify` | alta (`go test`) | borde `>=` vs `>` (OBS-01) no cubierto |
| `analysis/baseline`, `changes`, `quality`, `stats` | alta | — |
| `meter` (servicio) | media | `page<0`, búsqueda case-insensitive, `Readings` vacío |
| `auth` | alta | caso "secreto por defecto" **no cubierto** → SEC-01 |
| `httpx` | sin tests | validación de paginación (origen de DEF-03) |
| `server`, `store`, `dashboard`, `anomaly` | sin tests | integración |
| Frontend `format` | 11 tests | **falso verde** por `TZ=UTC` forzado → DEF-04 |

**Ratchet sugerido:** fijar la cobertura actual como piso en CI y exigir que no baje.

## 3. Reproducción de defectos (repro mínima + test)

Para cada defecto, la reproducción mínima y el test que **falla por la razón correcta**:

### SEC-01 — forja de JWT (crítica)
```bash
node qa/evidencias/herramientas/forge-jwt.mjs "dev-secret-change-me" "energyai-api" attacker@evil.local
# → Bearer <token> contra /api/v1/auth/me → 200 (esperado: 401)
```
- **Determinismo:** total (secreto fijo, payload fijo, sin red externa).
- **Origen:** el secreto por defecto existe desde la creación del proyecto; es un defecto de diseño, no una regresión.
- **Test:** `e2e/tests/security.spec.ts` con `test.fail()`.

### DEF-02 — M-106 como ALERT
- **Repro:** `POST /api/v1/meter/getById` `{"meter_id":"M-106"}` → `status=ALERT` (esperado `NORMAL`).
- **Test:** 3 casos en `e2e/tests/meters.spec.ts`.

### DEF-04 — hora de planta
- **Repro:** abrir `/medidores/M-109` con `timezoneId: 'America/Bogota'` vs `'UTC'` → horas distintas.
- **Determinismo:** logrado con `timezoneId` fijo por contexto.
- **Test:** `e2e/tests/timezone.spec.ts`.

### DEF-03 — page negativo
- **Repro:** `POST /api/v1/meter/getAll` `{"pagination":{"page":-1,"size":10}}` → 500 (esperado 400).
- **Test:** `e2e/tests/meters.spec.ts › paginación con page negativo`.

> Todos los tests de defecto se escriben en **rojo** con `test.fail()`. Al corregir el defecto sin retirar la anotación, el test empieza a fallar y obliga a retirar el `test.fail()`: la regresión rojo→verde queda garantizada por construcción (documentado en `e2e/README.md`).

#energia #qa #metricas #cobertura
