# DEF-02 · FALSE_POSITIVE mostrado como ALERT

> [!warning] Alta · P1
> M-106 (falso positivo, "no escalar") se muestra como **Alerta**.

Volver a: [[05-Defectos/Registro de defectos]]

## Qué pasa
`backend/internal/meter/enums.go:29-38` — `StatusOf` ignora `a.Anomaly`/`a.Type`; `FALSE_POSITIVE` + `LOW` cae en `default → ALERT`. La doc (`backend/README.md:103-108`) dice que debe ser **NORMAL**.

## Impacto (4 sitios)
- `getById/M-106` → `status=ALERT`
- `filter.status=NORMAL` → 8 en vez de 9
- `getSummary` → `normal=8, alert=2` en vez de `9,1`
- UI `/medidores` → fila "Alerta" + "8 normales · 2 alerta · 2 críticas"

## Constantes reales
- `model.Anomaly bool` — `backend/internal/analysis/model/anomaly.go:80`
- `model.TypeFalsePositive = "FALSE_POSITIVE"` — `anomaly.go:21`

## Fix
En `StatusOf`, mapear `FALSE_POSITIVE` → `NORMAL` (usando `a.Anomaly`/`a.Type`).

## Detección automática
`e2e/tests/meters.spec.ts` (3 tests con `test.fail`).

#energia #qa #defecto #motor
