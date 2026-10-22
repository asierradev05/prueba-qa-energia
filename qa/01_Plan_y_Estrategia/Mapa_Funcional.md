# Fase 1 · Levantamiento del producto (mapa funcional y oráculo)

Documento de trabajo interno para diseñar las pruebas. Fuentes citadas con archivo y sección.

## 1. Qué es el producto

MVP que monitorea medidores eléctricos y usa un motor determinista de IA para **detectar, explicar, priorizar y recomendar acciones** sobre anomalías de consumo. Backend Go + Frontend React. Sin base de datos: al arrancar lee CSV y corre el motor una vez en memoria.

Fuentes: `README.md` (visión general), `backend/README.md` (motor y API), `frontend/PRODUCT.md` (producto).

## 2. Roles y permisos

- **Un solo usuario** (demo). No hay roles ni multi-tenant.
  - Fuente: `frontend/PRODUCT.md` §Capabilities ("A single user (demo login). No roles.").
- Login por JWT (HS256). Rutas de `/api/v1` protegidas salvo `auth/login`; `GET /health` y `/docs` públicos.
  - Fuente: `backend/internal/server/server.go:45-69`.
- Credenciales por defecto: `admin@energia.local` / `admin123`.
  - Fuente: `backend/README.md` §Login, `.env.example:14-15`.
- El email se compara en minúsculas y sin espacios al construir el servicio; el login compara contra `s.user.Email` (ya normalizado) sin volver a normalizar la entrada del request.
  - Fuente: `backend/internal/auth/service.go:53` y `service.go:65`.

## 3. Entidades y relaciones

| Entidad | Campos clave | Fuente |
|---|---|---|
| Meter | id (M-101..M-112), readings[], baseline, anomaly, events[] | `backend/internal/store/store.go`, `backend/internal/data/entities.go` |
| Reading | timestamp, consumption_kwh, voltage_v, current_a, power_factor | `backend/internal/data/entities.go` |
| Event | timestamp, type (OPERATIONAL_CHANGE, SCHEDULED_OUTAGE, UNKNOWN, DATA_QUALITY), description | `backend/internal/data/entities.go`, `classify/events.go` |
| Anomaly | meter_id, anomaly(bool), type, severity, confidence, priority, detected_at, reason, recommended_action, narrated_by, evidence | `backend/internal/analysis/model/anomaly.go` |
| Evidence | baseline_daily_kwh, last_day_kwh, daily_change_pct, window_start/end, impact_kwh, change, quality, variables[], related_events[], checks[] | `model/anomaly.go:63-75` |

Dataset: 12 medidores, 14 días, 4.032 lecturas (1–14 sep 2026) + 4 eventos. Fuente: `frontend/PRODUCT.md` §Operating Context, `backend/data/readings.csv`.

## 4. Flujos críticos

1. Login → Dashboard (Despacho).
2. Despacho → Libro de medidores → filtro/búsqueda → Detalle de medidor.
3. Detalle → Abrir investigación (Anomalías IA) → evidencia y acción.
4. Run AI Analysis (barra superior) → polling de 7 pasos.
   - Fuente: `frontend/README.md` §Pantallas; `backend/README.md` §Run AI Analysis.

## 5. Reglas de negocio (oráculo)

### 5.1 Estado de alerta del medidor
| Resultado del motor | Estado | Fuente |
|---|---|---|
| Sin anomalía o FALSE_POSITIVE | NORMAL | `meter/enums.go:29-38`, `backend/README.md` §Endpoints |
| Severidad HIGH | CRITICAL | idem |
| Cualquier otra anomalía | ALERT | idem |

### 5.2 Tipo de anomalía (tabla de decisión)
| Pregunta | Tipo | Fuente |
|---|---|---|
| Variables eléctricas no cuadran con el consumo | DATA_QUALITY | `classify/classify.go:25-93`, `backend/README.md` §7 |
| Cambio sostenido que un evento explica y el consumo volvió a normal | FALSE_POSITIVE | `classify.go:150-168` |
| Cambio sostenido que un evento explica y el nuevo nivel se mantiene | EXPLAINABLE_ANOMALY | `classify.go:170-193` |
| Cambio sostenido que ningún evento explica | REAL_ANOMALY | `classify.go:115-148` |

### 5.3 Severidad
- REAL_ANOMALY: HIGH si |var| ≥50% **y sigue activo**; MEDIUM si ≥20%; si no LOW. Fuente: `classify.go:219-229`. **Nota:** usa `>= 50` y `>= 20`, aunque `backend/README.md` §8 dice "supera 50%" / "supera 20%" (potencial discrepancia doc vs. código en el límite exacto).
- DATA_QUALITY: HIGH si horas marcadas ≥12; si no MEDIUM. `classify.go:58-61`.
- EXPLAINABLE_ANOMALY: MEDIUM. FALSE_POSITIVE: LOW. `backend/README.md` §8.

### 5.4 Detección
- Z robusto `0.6745 × (lectura − baseline hora) / MAD`, umbral |z|>3.5. Fuente: `backend/README.md` §2.
- Cambio = tramo ≥6 h seguidas con |z|>3.5 en la misma dirección. `backend/README.md` §3.
- Calidad: voltaje >±5% de su mediana; FP >±0.15 con consumo normal; valores imposibles; horas faltantes/duplicadas. ≥3 horas sospechosas ⇒ problema. `backend/README.md` §4.
- Evento explica si ocurrió entre −24 h y +6 h del inicio y su tipo explica la dirección; SCHEDULED_OUTAGE solo caídas; UNKNOWN y DATA_QUALITY no explican. `classify/events.go:24-27`.
- Confianza = `0.5 + 0.45 × puntaje`, ×0.9 si depende de un evento. `backend/README.md` §9.

### 5.5 Priorización
1. Severidad → 2. energía en juego (impacto kWh) → 3. confianza. `backend/README.md` §10.

### 5.6 Resultado esperado del dataset (oráculo del evaluador)
| Prioridad | Medidor | Tipo | Severidad | Confianza | Estado UI |
|---|---|---|---|---|---|
| 1 | M-109 | REAL_ANOMALY | HIGH | 0,95 | CRITICAL |
| 2 | M-112 | DATA_QUALITY | HIGH | 0,95 | CRITICAL |
| 3 | M-104 | EXPLAINABLE_ANOMALY | MEDIUM | 0,86 | ALERT |
| 4 | M-106 | FALSE_POSITIVE | LOW | 0,86 | **NORMAL** |
Otros 8 NORMAL. Fuente: `backend/README.md` §Resultado, `README.md:9-14`.

## 6. API — endpoints y contrato

| Método | Ruta | Auth | Fuente |
|---|---|---|---|
| POST | `/api/v1/auth/login` | no | `auth/handler.go` |
| GET | `/api/v1/auth/me` | Bearer | `auth/handler.go` |
| GET | `/api/v1/meter/getParams` | Bearer | `meter/handler.go:29` |
| POST | `/api/v1/meter/getAll` | Bearer | `meter/handler.go:48` |
| GET | `/api/v1/meter/getById/{id}` | Bearer | `meter/handler.go:74` |
| GET | `/api/v1/anomaly/getAll` | Bearer | `anomaly/handler.go` |
| GET | `/api/v1/dashboard/getSummary` | Bearer | `dashboard/handler.go` |
| POST | `/api/v1/ai/analyze` | Bearer | `ai/handler.go` |
| GET | `/api/v1/ai/analysis/{id}` · `/latest` | Bearer | `ai/handler.go` |
| GET | `/health` | no | `server.go:45` |
| GET | `/docs`, `/docs/openapi.json` | no | `server.go:48-49` |

### Filtros de `POST /meter/getAll` (`meter/dto.go:40-69`)
| Campo | Regla de validación | Mensaje de error |
|---|---|---|
| `pagination.page` | 0→1; no valida negativos (page<0 produce rango inválido) | — |
| `pagination.size` | 0→10; 1..100 | `pagination.size debe estar entre 1 y 100` |
| `filter.meter_id` | trim; máx 50 chars; búsqueda **parcial** | `filter.meter_id no puede superar 50 caracteres` |
| `filter.status` | upper; ∈ {NORMAL,ALERT,CRITICAL} o vacío | `filter.status debe ser NORMAL, ALERT o CRITICAL` |
| `filter.sort_by` | lower; ∈ {meter_id,consumption,variation,severity}; vacío→meter_id | `filter.sort_by debe ser meter_id, consumption, variation o severity` |
| `filter.sort_order` | asc/ASC/desc/DESC; vacío→ASC | `filter.sort_order debe ser ASC o DESC` |

- El body usa `DisallowUnknownFields`: un campo desconocido ⇒ 400. Fuente: `httpx/request.go:19`.
- **Doc vs. código (búsqueda por meter_id):** `backend/README.md:96` dice "Búsqueda parcial, **sin importar mayúsculas** (`109` encuentra `M-109`)". El código hace `strings.Contains(sm.MeterID, search)` **sin** `ToUpper` sobre `search`. El servicio sí normaliza `Status` y `SortBy` a mayúsculas/minúsculas, pero **no** `MeterID`. Candidato a defecto → verificar con `meter_id="m-109"` (minúsculas) vs `"M-109"`.
  - Fuente: `meter/service.go:55-59` vs `meter/dto.go:44-47` y `backend/README.md:96`.
- `GET /meter/getById/{id}` sí normaliza: `strings.ToUpper(strings.TrimSpace(id))`. `meter/service.go:74`.
- Formato de error uniforme `APIError{status_code,message,errors,timestamp,path}`. `httpx/response.go:13-19`.

### Paginación (`httpx/paging.go`)
- Defaults page=1,size=10; MaxPageSize=100. `count` es total sin paginar. Página vacía ⇒ `rows: []`. `paging.go:9-56`.
- **Nota:** `Normalize` no valida `page < 0`. Con page negativo, `start=min((page-1)*size,len)` puede ser negativo y `items[start:end]` haría panic → posible 500. `paging.go:23-35,48-49`. **Confirmado como DEF-03** en [`05-defectos.md`](../05-defectos.md).

### Ordenamientos (`meter/service.go:116-134`)
- `sort_by=severity`: rank HIGH=3,MEDIUM=2,LOW=1, sin anomalía=0. `model/anomaly.go:37-48`.
- Desempate final por `meter_id` ascendente siempre (orden estable entre páginas). `service.go:132`.

### Dashboard (`dashboard/service.go`)
- `anomalies_detected` incluye falsos positivos (len de anomalías del store). `dto.go:58`.
- `requiring_attention` cuenta severidad HIGH. `service.go:72-74`.
- `ai_confidence` promedio de confianza de anomalías; 0.0 si no hay. `service.go:68-89`.
- `status_counts`: NORMAL incluye medidores sin anomalía **y** FALSE_POSITIVE. `service.go:46-53`.

## 7. Frontend — pantallas, rutas y comportamiento

| Ruta | Pantalla | Fuente |
|---|---|---|
| `/login` | Acceso | `app/routes/LoginRoute.tsx` |
| `/` | Despacho | `DashboardRoute.tsx` |
| `/medidores` | Libro de medidores | `MetersRoute.tsx` |
| `/medidores/:id` | Detalle | `MeterDetailRoute.tsx` |
| `/anomalias` | Anomalías IA | `AnomaliesRoute.tsx` |
| `/anomalias/:id` | Investigación | `InvestigationRoute.tsx` |

- Filtros viven en la URL: `?medidor= &estado= &orden= &dir= &pagina=`. `useMeterFilters.ts:47-53`.
- Al cambiar cualquier filtro se vuelve a página 1. `useMeterFilters.ts:70`.
- Estado por defecto no se escribe en la URL (se borra el param). `useMeterFilters.ts:73-79`.
- `parseMeterFilters` valida status/sortBy contra lista blanca; `page` debe ser entero >0. `useMeterFilters.ts:21-32`.
- Búsqueda se aplica al enviar (Enter o botón), no por tecla. `MeterFilters.tsx:28-33`.
- Etiquetas: NORMAL→"Normal", ALERT→"Alerta", CRITICAL→"Crítica". `lib/labels.ts:8-12`.

### Fechas — punto de riesgo alto
- `formatPlantTime` usa `getDate()/getMonth()/getHours()/getMinutes()` (**hora local del navegador**) mientras que el comentario y el producto dicen "hora de planta". `format.ts:54-58`.
- `formatPlantDate` y `formatPlantDay` usan `getUTCDate()/getUTCMonth()` (**UTC**). `format.ts:60-70`.
- Inconsistencia interna: la misma lectura se formatea con base horaria distinta según la función.
- `frontend/README.md:75` y `PRODUCT.md` §Operating Context exigen mostrar la hora tal como viene, **sin** convertir a la zona del navegador.
- En `America/Bogota` (UTC−5) una lectura `2026-09-12T02:00:00Z` se mostraría como `11/09 21:00` con `formatPlantTime` (día y hora anteriores), mientras `formatPlantDate` mostraría `12 sept`. **Candidato a defecto real** → verificar en Fase 3/5.

## 8. Matriz de riesgos inicial (probabilidad × impacto)

| # | Área | Riesgo | Prob. | Impacto | Prioridad |
|---|---|---|---|---|---|
| R1 | Fechas UI | `formatPlantTime` en hora local desfasa día/hora (Bogotá UTC−5) | Alta | Alto | P1 |
| R2 | Búsqueda API | `meter_id` sin normalizar mayúsculas rompe la promesa "sin importar mayúsculas" | Media | Medio | P2 |
| R3 | Paginación | `page` negativo ⇒ posible panic/500 en vez de 400 | Baja | Alto | P2 |
| R4 | Severidad límite | Documento "supera" vs código `>=` en 20%/50% | Baja | Medio | P3 |
| R5 | Consistencia | Estado UI vs tipo motor (FALSE_POSITIVE→NORMAL) entre capas | Media | Medio | P2 |
| R6 | Auth | Comportamiento de login con email en mayúsculas/espacios y token inválido | Media | Medio | P2 |
| R7 | Motor | Mapeo tipo→severidad→prioridad contra resultado esperado | Media | Alto | P1 |

## 9. Diferencias documentación / API / UI a verificar

1. Búsqueda `meter_id` "sin importar mayúsculas" (doc) vs `Contains` sin normalizar (código).
2. Severidad "supera 50/20 %" (doc) vs `>=` (código) en el valor límite.
3. Fechas "hora de planta" (doc/producto) vs uso de hora local del navegador (código).
4. `page` negativo: no documentado; comportamiento real por verificar.

## 10. Datos de prueba controlados

- Credenciales válidas: `admin@energia.local` / `admin123`.
- Credenciales inválidas: `admin@energia.local` / `wrong`, email inexistente.
- Medidores: `M-109` (REAL HIGH), `M-112` (DQ HIGH), `M-104` (EXPLAIN MEDIUM), `M-106` (FP LOW/NORMAL), `M-999` (inexistente).
- Búsquedas: `109`, `m-109`, `M-109`, `99`, cadena vacía, >50 chars.
- Paginación: page 0/1/2/3, size 0/1/10/100/101/-1, page -1.
- Orden: cada `sort_by` × `ASC`/`DESC`.

## Criterio de salida Fase 1
Mapa funcional, reglas de negocio, contrato de API, pantallas y riesgos documentados con referencias. **CUMPLIDO.**
