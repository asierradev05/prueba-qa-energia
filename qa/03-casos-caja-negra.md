# Casos de prueba de caja negra · EnergIA

Ejecución real contra el sistema levantado (backend `:8080`, frontend `:5173`), commit `15765d9`, 2026-10-21.
Estados: **PASS** · **FAIL** · **BLOCKED** · **NOT RUN**.

## A. API — Autenticación

| ID | Título | Pasos | Datos | Esperado | Obtenido | Estado |
|---|---|---|---|---|---|---|
| CN-01 | Login válido | `POST /auth/login` | `admin@energia.local`/`admin123` | 200 + JWT | 200, Bearer exp 28800 | PASS |
| CN-02 | Password incorrecta | `POST /auth/login` | email válido/wrong | 401 | 401 | PASS |
| CN-03 | Email inexistente | `POST /auth/login` | nadie@x/wrong | 401 | 401 | PASS |
| CN-04 | Email normalizado | `POST /auth/login` | `  Admin@Energia.Local  ` | 200 (trim+lower) | 200 | PASS |
| CN-05 | Campos vacíos | `POST /auth/login` | `{"email":"","password":""}` | 400 | 400 ("Datos inválidos") | PASS |
| CN-06 | Sin token | `POST /meter/getAll` | — | 401 | 401 | PASS |
| CN-07 | Token malformado | `GET /auth/me` con `Bearer xxx` | `xxx` | 401 | 401 | PASS |

## B. API — Listado, filtro, orden, paginación

| ID | Título | Pasos | Datos | Esperado | Obtenido | Estado |
|---|---|---|---|---|---|---|
| CN-08 | Listado por defecto | `getAll {}` | — | 200, page 1, size 10, count 12 | 200, idéntico | PASS |
| CN-09 | Búsqueda parcial por id | `filter.meter_id="109"` | `109` | encuentra M-109 | count=1 M-109 | PASS |
| CN-10 | Búsqueda mayúsculas | `filter.meter_id="M-109"` | `M-109` | count=1 | count=1 | PASS |
| CN-11 | Búsqueda minúsculas | `filter.meter_id="m-109"` | `m-109` | count=1 (doc: "sin importar mayúsculas") | **count=0** | **FAIL (DEF-01)** |
| CN-12 | Filtro status=CRITICAL | `filter.status="CRITICAL"` | — | M-109, M-112 | M-109, M-112 | PASS |
| CN-13 | Filtro status=NORMAL | `filter.status="NORMAL"` | — | 9 (incluye M-106) | **8 (falta M-106)** | **FAIL (DEF-02)** |
| CN-14 | Filtro status inválido | `filter.status="FOO"` | — | 400 | 400 | PASS |
| CN-15 | Orden consumo DESC | `sort_by=consumption` | — | mayor→menor | M-109(2207,6)… | PASS |
| CN-16 | Orden consumo ASC | `sort_by=consumption` | — | menor→mayor | M-107(474,66)… | PASS |
| CN-17 | Orden severidad DESC | `sort_by=severity` | — | HIGH>MEDIUM>LOW>— | M-109,M-112,M-104,M-106,resto | PASS |
| CN-18 | sort_by inválido | `sort_by="foo"` | — | 400 | 400 | PASS |
| CN-19 | page=2 size=10 | — | — | 2 filas (M-111,M-112) | 2 filas | PASS |
| CN-20 | page=3 size=10 | — | — | 0 filas | 0 filas (array) | PASS |
| CN-21 | page=0 | — | — | normaliza a 1 | page=1 | PASS |
| CN-22 | page=-1 | — | `page:-1` | 400 | **500 (panic)** | **FAIL (DEF-03)** |
| CN-23 | size=101 | — | `size:101` | 400 | 400 | PASS |
| CN-24 | size=-5 | — | `size:-5` | 400 | 400 | PASS |
| CN-25 | Campo desconocido | `{"extra":1}` | — | 400 | 400 | PASS |
| CN-26 | Body no-JSON | `notjson` | — | 400 | 400 | PASS |

## C. API — Detalle y dashboard

| ID | Título | Pasos | Datos | Esperado | Obtenido | Estado |
|---|---|---|---|---|---|---|
| CN-27 | Detalle con anomalía | `getById/M-109` | M-109 | 200 REAL/HIGH conf 0.95 prio 1 | idéntico | PASS |
| CN-28 | Id sin distinguir mayúsculas en detalle | `getById/m-112` | m-112 | resuelve M-112 | M-112 | PASS |
| CN-29 | Medidor inexistente | `getById/M-999` | M-999 | 404 | 404 | PASS |
| CN-30 | Dashboard summary | `dashboard/getSummary` | — | total 12, 4 anomalías | 12, 4 | PASS |
| CN-31 | Conteo por estado (coherencia doc) | `getSummary` | — | normal=9, alert=1 | **normal=8, alert=2** | **FAIL (DEF-02)** |
| CN-32 | Prioridades ordenadas | `getSummary` | — | 1..4 M-109,M-112,M-104,M-106 | idéntico | PASS |
| CN-33 | by_type | `getSummary` | — | 1 de cada tipo | idéntico | PASS |

## D. UI (caja negra, navegación y presentación)

| ID | Título | Pasos | Esperado | Obtenido | Estado |
|---|---|---|---|---|---|
| CN-34 | Redirección a login | abrir `/` sin sesión | redirige a `/login` | `/login` | PASS |
| CN-35 | Login por UI | llenar y enviar | entra al despacho | `/` con datos | PASS |
| CN-36 | Ruta inexistente | `/meters` (inglés) | 404 amable | "Esta página no existe" | PASS |
| CN-37 | Libro de medidores | ir a `/medidores` | 12 filas, filtros y buscador | 10 filas + paginación | PASS |
| CN-38 | M-106 en libro | observar fila M-106 | Estado **Normal** | Estado **Alerta** | **FAIL (DEF-02)** |
| CN-39 | Hora de planta (M-109) | `/anomalias` columna Detectada | 12/09 14:00 | **12/09 09:00** | **FAIL (DEF-04)** |
| CN-40 | Hora de planta cambia el día | M-104/M-106 | 11/09 00:00 / 08/09 00:00 | **10/09 19:00 / 07/09 19:00** | **FAIL (DEF-04)** |
| CN-41 | Detalle de medidor | `/medidores/M-109` | KPIs y gráficos coherentes | coherentes | PASS |
| CN-42 | Sin errores de consola | navegar pantallas | sin errores JS | sin errores | PASS |

## Resumen de caja negra

- Casos ejecutados: **42** · PASS: **35** · FAIL: **5** (los FAIL se agrupan en 4 defectos) · BLOCKED/NOT RUN: 0.
- Defectos que rompen el contrato documentado: DEF-01 (búsqueda), DEF-02 (estado M-106 + agregados), DEF-03 (paginación), DEF-04 (fechas UI).
