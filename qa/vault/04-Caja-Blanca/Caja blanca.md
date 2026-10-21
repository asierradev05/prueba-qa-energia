# Caja blanca

> Fuente completa: `qa/04-caja-blanca.md`. Análisis del código y de los tests existentes.

## Módulos de riesgo revisados
### 1. Motor de clasificación / estados
- `backend/internal/meter/enums.go:29-38` — `StatusOf` no usa `a.Anomaly`/`a.Type`.
- `backend/internal/analysis/classify/classify.go:219-229` — umbrales con `>=`.
- `backend/internal/meter/service.go:104` — `Readings[len-1]` sin comprobar vacío.

### 2. Autenticación
- `backend/internal/auth/service.go:61-107` — login + `ParseToken` (bien con HS256 y `WithValidMethods`).
- `backend/internal/config/config.go:14,55` — **secreto por defecto** → [[05-Defectos/SEC-01 Forja de JWT con secreto por defecto|SEC-01]].
- `frontend/src/lib/token-storage.ts` — JWT en `localStorage` → [[06-Seguridad/Reporte de seguridad|SEC-04]].

### 3. Paginación
- `backend/internal/httpx/paging.go:23-36,47-55` — `Normalize` valida `Size` pero no `Page<0` → panic → [[05-Defectos/DEF-03 Paginación con page negativo → 500|DEF-03]].

## Tests existentes: ¿confiamos en ellos?
| Suite | Cobertura | Veredicto |
|---|---|---|
| `go test ./...` | Motor, auth, httpx, data, ai | Buena base; no cubre `Page<0` ni `StatusOf` FALSE_POSITIVE |
| `pnpm test` (11) | `format`, hooks, api-client | **Falso verde en fechas**: `vite.config.ts:33` fuerza `TZ=UTC`, oculta [[05-Defectos/DEF-04 Hora de planta dependiente de la zona|DEF-04]] |

## Riesgos latentes
- [[05-Defectos/RIESGO-W1 Readings vacío|RIESGO-W1]] — índice sin comprobar vacío.
- [[05-Defectos/OBS-01 Umbral mayor-vs-mayor-igual|OBS-01]] — doc "supera" vs código `>=`.

#energia #qa #caja-blanca
