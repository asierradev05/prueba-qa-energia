# Registro de defectos · EnergIA

Confirmados por **ejecución real** (backend `:8080`, frontend `:5173`, commit `15765d9`, 2026-10-21).  
**Entorno:** Windows 11 · Chrome/Chromium (Playwright) · zona de negocio `America/Bogota` · modo dev.

**Severidad** = impacto para el operador / negocio. **Prioridad** = urgencia de corrección (puede diferir: un 500 es severidad alta pero P2 si el cliente no envía `page=-1` en UI normal).

---

## Resumen

| ID | Título corto | Severidad | Prioridad | Estado |
|---|---|---|---|---|
| **SEC-01** | JWT forjable con secreto por defecto | Crítica | **P0** | Confirmado |
| **DEF-02** | FALSE_POSITIVE (M-106) como Alerta | Alta | **P1** | Confirmado |
| **DEF-04** | Hora “Detectada” según zona del navegador | Alta | **P1** | Confirmado |
| **DEF-03** | `page` negativo → HTTP 500 | Alta | **P2** | Confirmado |
| **DEF-01** | Búsqueda `meter_id` case-sensitive | Media | **P2** | Confirmado |

**No liberar** hasta P0 + P1. Detalle de seguridad SEC-02…07: [`anexos/seguridad.md`](anexos/seguridad.md).

---

## SEC-01 · Forja de JWT con secreto por defecto

- **Severidad:** Crítica · **Prioridad:** P0  
- **Componente:** `backend/internal/config/config.go` (default) · `backend/cmd/api/main.go:53-55` (solo Warn) · `backend/internal/auth/service.go`  
- **Contrato / sentido común:** fuera de local el secreto debe ser propio; un token firmado con el default **no** debe autenticar.

**Pasos**

1. `node evidencias/herramientas/forge-jwt.mjs "dev-secret-change-me" "energyai-api" "attacker@evil.local"`
2. `curl -s -H "Authorization: Bearer <token>" http://localhost:8080/api/v1/auth/me`

**Esperado:** 401.  
**Obtenido:** `200` `{"email":"attacker@evil.local","name":"Atacante"}` · mismo token abre `getAll`, `getById`, `getSummary`, `anomaly/getAll`.

**Causa raíz:** secreto público por defecto + arranque que solo advierte (no fail-closed).  
**Detección:** `e2e/tests/security.spec.ts` (`test.fail`).  
**Evidencia:** `evidencias/logs/seguridad-probe.txt`.

---

## DEF-01 · Búsqueda de medidores no ignora mayúsculas

- **Severidad:** Media · **Prioridad:** P2  
- **Componente:** `backend/internal/meter/service.go:59`  
- **Contrato:** `backend/README.md` — búsqueda parcial **sin importar mayúsculas**.

**Pasos:** JWT → `POST /meter/getAll` body `{"filter":{"meter_id":"m-109"}}`.

| Input | Esperado | Obtenido |
|---|---|---|
| `"109"` | count=1 | 1 ✔ |
| `"M-109"` | count=1 | 1 ✔ |
| `"m-109"` | count=1 | **0** ✘ |

**Causa raíz:** `strings.Contains` sin normalizar; `GetByID` sí usa `ToUpper`.  
**Evidencia:** `evidencias/api/api-exploracion.txt` §4 · CN-10 · `e2e` DEF-01.

---

## DEF-02 · Falso positivo (M-106) mostrado como “Alerta”

- **Severidad:** Alta · **Prioridad:** P1  
- **Componente:** `backend/internal/meter/enums.go:29-38` (+ UI que refleja el status)  
- **Contrato:** `backend/README.md` — FALSE_POSITIVE → **NORMAL**; `PRODUCT.md` — M-106 “no escalar”.

**Pasos**

1. `GET /meter/getById/M-106` → `status`
2. `POST /meter/getAll` `filter.status=NORMAL`
3. `GET /dashboard/getSummary`
4. UI `/medidores` fila M-106

**Esperado:** status NORMAL; 9 normales / 1 alerta; UI “Normal”.  
**Obtenido:** status **ALERT**; 8 / 2; UI **“Alerta”** (texto “Falso positivo · No escalar” contradice el badge).

**Causa raíz:** `StatusOf` ignora `Anomaly`/`Type`; FP cae en `default` → ALERT.  
**Impacto:** el operador escala lo que debía ignorar; KPIs inflados.  
**Evidencia:** `api-exploracion.txt` §5 · capturas `evidencias/capturas/ui-Medidores.png` · CN-12/21/24 · `e2e` DEF-02.

---

## DEF-03 · `pagination.page` negativo → HTTP 500

- **Severidad:** Alta · **Prioridad:** P2 (UI no envía page&lt;0; superficie API sí)  
- **Componente:** `backend/internal/httpx/paging.go:23-36, 47-55`

**Pasos:** `POST /meter/getAll` `{"pagination":{"page":-1,"size":10}}`.

**Esperado:** 400 `pagination.page debe ser >= 1`.  
**Obtenido:** **500** · log: `slice bounds out of range [:-10]`.

**Causa raíz:** `Normalize` no valida `Page < 1`; `Paginate` indexa negativo.  
**Evidencia:** `api-exploracion.txt` §6 · `evidencias/backend-server.err.log` · CN-15 · `e2e` DEF-03.

---

## DEF-04 · Horas “Detectada” según zona del navegador

- **Severidad:** Alta · **Prioridad:** P1  
- **Componente:** `frontend/src/lib/format.ts:55-58` (`formatPlantTime`)  
- **Contrato:** `frontend/README.md` — fechas de planta **sin** convertir a zona del navegador.

**Pasos:** UI despacho/anomalías en Bogotá vs UTC; comparar con `detected_at` de la API.

| Medidor | API `detected_at` | UI Bogotá | UI UTC | Correcto (planta) |
|---|---|---|---|---|
| M-109 | `…T14:00:00Z` | **09:00** | 14:00 | 14:00 |
| M-112 | `…T00:00:00Z` | **día anterior 19:00** | 00:00 | 00:00 |
| M-104 / M-106 | medianoche Z | **cambia el día** | OK en UTC | medianoche planta |

**Causa raíz:** `formatPlantTime` usa `getHours()` local; date/day usan UTC. Tests unitarios ocultan el bug con `TZ=UTC`.  
**Evidencia:** `evidencias/api/ui-fechas-timezone.txt` · CN-25/26 · `e2e/tests/timezone.spec.ts`.

---

## Observaciones (no defectos confirmados)

- **OBS-01:** doc “supera” vs código `>=` en umbrales 20/50 % — borde no reproducible con el dataset.
- **RIESGO-W1:** `summarize` sin guard de `Readings` vacío — panic potencial; hoy todas tienen 336 lecturas.

## Recomendación

No liberar hasta **SEC-01**, **DEF-02** y **DEF-04**. Incluir DEF-01/03 en la misma iteración (bajo costo, alta higiene de API).
