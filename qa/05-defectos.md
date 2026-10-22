# Registro de defectos · EnergIA

Todos los defectos fueron **confirmados por ejecución real** contra el sistema levantado (backend `:8080`, frontend `:5173`, commit `15765d9`, 2026-10-21). No hay hallazgos inventados. Severidad = impacto funcional para el operador; prioridad = urgencia de corrección.

Severidades: **Crítica · Alta · Media · Baja**.

---

## DEF-01 · La búsqueda de medidores no ignora mayúsculas/minúsculas

- **Severidad:** Media · **Prioridad:** P2
- **Componente:** API `POST /api/v1/meter/getAll` · `backend/internal/meter/service.go:59`
- **Tipo:** funcional · incumple contrato documentado
- **Contrato violado:** `backend/README.md:96` — "Búsqueda parcial, **sin importar mayúsculas** (`109` encuentra `M-109`)".

**Pasos para reproducir**
1. Login y obtener JWT.
2. `POST /meter/getAll` con body `{"filter":{"meter_id":"m-109"}}`.

**Resultado esperado:** `count=1` (M-109), igual que con `M-109` y con `109`.
**Resultado obtenido:** `count=0`.
- `meter_id="109"` → count=1 ✔ · `"M-109"` → count=1 ✔ · `"m-109"` → **count=0** ✘

**Causa raíz:** `strings.Contains(sm.MeterID, search)` compara sin normalizar. `GetByID` (service.go:74) sí usa `strings.ToUpper(strings.TrimSpace(id))` → inconsistencia interna.
**Corrección propuesta (referencia):** normalizar `search = strings.ToUpper(strings.TrimSpace(f.MeterID))` y comparar `strings.Contains(strings.ToUpper(sm.MeterID), search)`.
**Evidencia:** `05_Evidencias/api/api-exploracion.txt` §4; caso CN-11.

---

## DEF-02 · Un medidor con falso positivo aparecen como "Alerta" (debería ser "Normal")

- **Severidad:** Alta · **Prioridad:** P1
- **Componente:** API `getAll`/`getById`/`dashboard`, UI `/medidores` y despacho · `backend/internal/meter/enums.go:29-38`
- **Tipo:** funcional · regla de negocio (incumple contrato documentado)
- **Contrato violado:** `backend/README.md:103-108` — "Sin anomalía, **o FALSE_POSITIVE** → NORMAL"; `frontend/PRODUCT.md` — M-106 FALSE_POSITIVE "no escalar".
- **Afecta a:** 3 superficies (lista API, detalle API, KPIs del dashboard y libro de medidores UI).

**Pasos para reproducir**
1. `GET /meter/getById/M-106` → observar `status`.
2. `POST /meter/getAll` con `{"filter":{"status":"NORMAL"}}`.
3. `GET /dashboard/getSummary`.
4. UI: `/medidores`, fila M-106.

**Resultado esperado:** M-106 `status=NORMAL`; `status=NORMAL` incluye 9 medidores; dashboard `normal=9, alert=1`.
**Resultado obtenido:**
- `getById/M-106` → `status=ALERT` (con `type=FALSE_POSITIVE`, `anomaly=false`).
- `filter.status=NORMAL` → **8** (falta M-106).
- `getSummary` → `normal=8, alert=2, critical=2`.
- UI `/medidores` → fila "M-106 | **Alerta** | … | Falso positivo"; KPI "8 normales · 2 alerta · 2 críticas".

**Causa raíz:** `StatusOf` documenta "falso positivo → NORMAL" pero el `switch` ignora `a.Anomaly`/`a.Type`; un FALSE_POSITIVE (LOW) cae en `default` → ALERT.
**Corrección propuesta (referencia):** añadir rama `case !a.Anomaly || a.Type == model.TypeFalsePositive: return StatusNormal` antes de la de severidad (constantes reales: `model.Anomaly` bool en `model/anomaly.go:80`, `model.TypeFalsePositive = "FALSE_POSITIVE"` en `model/anomaly.go:21`).
**Impacto:** el operador ve una alerta que el oráculo dice no escalar; infla el conteo de "requieren atención" y contradice el mensaje de la propia UI ("Falso positivo · No escalar").
**Evidencia:** `05_Evidencias/api/api-exploracion.txt` §5; casos CN-13, CN-31, CN-38.

---

## DEF-03 · `pagination.page` negativo provoca HTTP 500 (panic)

- **Severidad:** Alta · **Prioridad:** P2
- **Componente:** API `POST /api/v1/meter/getAll` · `backend/internal/httpx/paging.go:23-36, 47-55`
- **Tipo:** robustez / validación de entrada · error de servidor no controlado

**Pasos para reproducir**
1. `POST /meter/getAll` con `{"pagination":{"page":-1,"size":10}}`.

**Resultado esperado:** `400` con `errors: ["pagination.page debe ser >= 1"]` (coherente con el tag `minimum:"1"` del struct y con la validación de `size`).
**Resultado obtenido:** **HTTP 500**.
Log del servidor:
```
ERROR panic error="runtime error: slice bounds out of range [:-10]" path=/api/v1/meter/getAll
ERROR panic error="runtime error: slice bounds out of range [:-20]" path=/api/v1/meter/getAll
```

**Causa raíz:** `Normalize()` valida `size` pero **no** valida `Page < 0`; `Paginate` calcula `start=(Page-1)*Size` negativo y hace `items[start:end]`. El middleware `Recover` lo convierte en 500 (se evita la caída del proceso, pero expone un 500 al cliente).
**Nota:** `page=0` sí se normaliza a 1 (correcto).
**Corrección propuesta (referencia):** en `Normalize`, `if p.Page < 1 { errs = append(errs, "pagination.page debe ser >= 1") }`.
**Evidencia:** `05_Evidencias/api/api-exploracion.txt` §6; `evidencias/backend-server.err.log`; caso CN-22.

---

## DEF-04 · Las horas "Detectada" usan la zona del navegador y no la hora de planta

- **Severidad:** Alta · **Prioridad:** P1
- **Componente:** frontend `formatPlantTime` · `frontend/src/lib/format.ts:55-58`
- **Tipo:** funcional · incumple contrato documentado · dependiente de entorno (se reproduce en vivo)
- **Contrato violado:** `frontend/README.md:75` — "las fechas del dataset son **hora de planta**: se muestran tal como vienen, **sin convertirlas a la zona del navegador** (`lib/format.ts`)". Igual en `DESIGN.md:230`, `.impeccable/design.json:388`.

**Pasos para reproducir**
1. Abrir el despacho `/` (o `/anomalias`) con el navegador en `America/Bogota`.
2. Observar el texto "Detectada …" de cada orden.
3. Repetir con el navegador en `UTC`.

**Resultado esperado:** el mismo instante de planta en todas las zonas.
**Resultado obtenido:** el texto cambia según la zona del navegador para el **mismo dato** de la API (`detected_at`):

| Medidor | API `detected_at` (planta) | UI en Bogotá | UI en UTC | Correcto (planta) |
|---|---|---|---|---|
| M-109 | 2026-09-12T14:00:00Z | 12/09 **09:00** | 12/09 14:00 | 12/09 14:00 |
| M-112 | 2026-09-13T00:00:00Z | 12/09 **19:00** | 13/09 00:00 | 13/09 00:00 |
| M-104 | 2026-09-11T00:00:00Z | 10/09 **19:00** | 11/09 00:00 | 11/09 00:00 |
| M-106 | 2026-09-08T00:00:00Z | 07/09 **19:00** | 08/09 00:00 | 08/09 00:00 |

En Bogotá (zona objetivo) muestra `09:00` en vez de `14:00`; en M-104/M-106 **cambia el día**.

**Causa raíz:** `formatPlantTime` usa `getDate()/getHours()/getMinutes()` (hora local del navegador) mientras `formatPlantDate/Day` usan `getUTC*()`. El propio comentario (líneas 51-52) dice que deben leerse las partes UTC.
**Por qué los tests no lo detectan:** `vite.config.ts:33` fuerza `env: { TZ: 'UTC' }`; el test `format.test.ts:17` (`14:00 → 14:00`) pasa solo por ese forzado.
**Corrección propuesta (referencia):** usar `getUTCDate()/getUTCHours()/getUTCMinutes()` en `formatPlantTime`.
**Evidencia:** `05_Evidencias/api/ui-fechas-timezone.txt` (4 zonas horarias); casos CN-39, CN-40.

---

## Observaciones (no defectos confirmados)

- **OBS-01 (R7, baja):** doc dice "**supera** 50 %/20 %" (`backend/README.md:276`) pero `realSeverity` usa `>=` (`classify.go:222,224`). Solo difiere en el valor exacto 50.0/20.0; **no reproducible** con el dataset actual. Inconsistencia doc↔código.
- **RIESGO-W1 (robustez, no reproducible):** `summarize` (`service.go:104`) indexa `Readings[len-1]` sin comprobar lista vacía → panic si un medidor no tuviera lecturas. Hoy todos traen 336.

## Resumen

| ID | Severidad | Prioridad | Estado |
|---|---|---|---|
| DEF-01 | Media | P2 | Confirmado por ejecución |
| DEF-02 | Alta | P1 | Confirmado por ejecución |
| DEF-03 | Alta | P2 | Confirmado por ejecución |
| DEF-04 | Alta | P1 | Confirmado por ejecución (reproducido en vivo) |

**Recomendación:** no liberar a producción hasta resolver **DEF-02** y **DEF-04** (P1), que afectan directamente la información que ve el operador; corregir **DEF-03** (500) y **DEF-01** (búsqueda) en la misma iteración.
