# DEF-04 · Hora de planta dependiente de la zona

> [!warning] Alta · P1
> Las horas "Detectada" usan la zona del **navegador**, no la de la planta (Bogotá).

Volver a: [[05-Defectos/Registro de defectos]]

## Qué pasa
`frontend/src/lib/format.ts:55-58` — `formatPlantTime` usa `getDate/getHours/getMinutes` (locales) en vez de `getUTC*`, que sí usan `formatPlantDate/Day`.

## Reproducción
Valor de planta `detected_at = 2026-09-12T14:00:00Z`. Abriendo la UI en distintas zonas:
| Zona | Muestra | Debería |
|---|---|---|
| UTC | `12/09 14:00` | `12/09 14:00` |
| Bogotá | `12/09 09:00` | `12/09 14:00` |
| New York | `10:00` | `14:00` |
| Tokyo | `23:00` | `14:00` |

Cambia el **día** en M-104/M-106.

## Por qué los tests no lo ven
`frontend/vite.config.ts:33` fuerza `TZ='UTC'`; el test `format.test.ts:17` pasa en falso.

## Fix
Usar `getUTCDate/getUTCHours/getUTCMinutes` en `formatPlantTime`.

## Detección automática
`e2e/tests/timezone.spec.ts › el instante "Detectada" no depende de la zona` (abre contextos en UTC y Bogotá).

#energia #qa #defecto #fechas
