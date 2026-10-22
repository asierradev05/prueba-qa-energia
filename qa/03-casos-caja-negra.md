# Casos de caja negra · EnergIA

Ejecución real (backend `:8080`, frontend `:5173`), commit `15765d9`, 2026-10-21.  
Estados: **PASS** · **FAIL**. Criterio: **22 casos** priorizados por riesgo (no volumen). Formato: ID · Título · Técnica · Precondición · Pasos · Datos · Esperado · Obtenido · Estado.

---

## Tablas de decisión (motor / estado)

Oráculo: `backend/README.md` (tipo → estado; severidad por desvío).

### TD-1 · Tipo de anomalía → estado del medidor

| Tipo (`anomaly.type`) | `anomaly` | Severidad | Estado esperado (doc) | Estado API/UI | Resultado |
|---|---|---|---|---|---|
| *(sin anomalía)* | — | — | NORMAL | NORMAL | OK |
| REAL_ANOMALY (M-109) | true | HIGH | CRITICAL | CRITICAL | OK |
| DATA_QUALITY (M-112) | true | HIGH | CRITICAL | CRITICAL | OK |
| EXPLAINABLE (M-104) | true | MEDIUM | ALERT | ALERT | OK |
| **FALSE_POSITIVE (M-106)** | **false** | LOW | **NORMAL** | **ALERT** | **FAIL · DEF-02** |

### TD-2 · Desvío → severidad (REAL / reglas de umbral)

| Condición (doc: “supera”) | Severidad esperada | Código (`>=`) | Caso dataset |
|---|---|---|---|
| desvío > 50 % y ongoing | HIGH | `>= 50` | M-109 (+109,8 %) → HIGH OK |
| desvío > 20 % | MEDIUM | `>= 20` | M-104 (+47,3 %) → MEDIUM OK |
| resto | LOW | else | M-106 → LOW OK |
| borde exacto 50,0 / 20,0 | doc vs código difieren | no reproducible hoy | OBS-01 |

---

## A. Autenticación (partición + negativas)

| ID | Título | Técnica | Precondición | Pasos | Datos | Esperado | Obtenido | Estado |
|---|---|---|---|---|---|---|---|---|
| CN-01 | Login válido | Partición válida | API arriba | `POST /auth/login` | admin@energia.local / admin123 | 200 + JWT | 200, Bearer exp 28800 | PASS |
| CN-02 | Password incorrecta | Partición inválida | API arriba | login | email válido / wrong | 401 | 401 | PASS |
| CN-03 | Email inexistente | Partición inválida | API arriba | login | nadie@x / wrong | 401 (sin filtrar si el user existe) | 401 | PASS |
| CN-04 | Email con espacios/mayúsculas | Equivalencia / normalización | API arriba | login | `  Admin@Energia.Local  ` | 200 | 200 | PASS |
| CN-05 | Campos vacíos | Negativa / validación | API arriba | login | `{"email":"","password":""}` | 400 | 400 | PASS |
| CN-06 | Sin token en ruta protegida | Negativa auth | — | `POST /meter/getAll` | — | 401 | 401 | PASS |

## B. Listado, búsqueda, filtros, paginación (límites + equivalencia)

| ID | Título | Técnica | Precondición | Pasos | Datos | Esperado | Obtenido | Estado |
|---|---|---|---|---|---|---|---|---|
| CN-07 | Listado por defecto | Camino feliz | JWT | `getAll {}` | — | page 1, size 10, count 12 | idéntico | PASS |
| CN-08 | Búsqueda parcial | Partición válida | JWT | `filter.meter_id` | `"109"` | M-109 | count=1 | PASS |
| CN-09 | Búsqueda mayúsculas | Equivalencia (case) | JWT | idem | `"M-109"` | count=1 | count=1 | PASS |
| CN-10 | Búsqueda minúsculas | Equivalencia (case) · doc | JWT | idem | `"m-109"` | count=1 | **count=0** | **FAIL · DEF-01** |
| CN-11 | Filtro CRITICAL | Partición de estado | JWT | `filter.status=CRITICAL` | — | M-109, M-112 | idéntico | PASS |
| CN-12 | Filtro NORMAL (incluye FP) | Tabla decisión TD-1 | JWT | `filter.status=NORMAL` | — | 9 (incl. M-106) | **8 (falta M-106)** | **FAIL · DEF-02** |
| CN-13 | status inválido | Negativa | JWT | `filter.status=FOO` | — | 400 | 400 | PASS |
| CN-14 | page=0 | Valor límite inferior | JWT | pagination | page=0 | normaliza a 1 | page=1 | PASS |
| CN-15 | page=-1 | Valor límite / negativa | JWT | pagination | page=-1 | 400 | **500 panic** | **FAIL · DEF-03** |
| CN-16 | size=101 | Valor límite superior | JWT | pagination | size=101 | 400 | 400 | PASS |
| CN-17 | Body no-JSON | Negativa | JWT | body texto | `notjson` | 400 | 400 | PASS |

## C. Detalle, dashboard y consistencia doc↔API

| ID | Título | Técnica | Precondición | Pasos | Datos | Esperado | Obtenido | Estado |
|---|---|---|---|---|---|---|---|---|
| CN-18 | Detalle M-109 | Oráculo motor | JWT | `getById/M-109` | M-109 | REAL/HIGH conf 0.95 prio 1 | idéntico | PASS |
| CN-19 | getById case-insensitive | Consistencia interna | JWT | `getById/m-112` | m-112 | M-112 | M-112 | PASS |
| CN-20 | Medidor inexistente | Partición inválida | JWT | `getById/M-999` | M-999 | 404 | 404 | PASS |
| CN-21 | Dashboard: conteos de estado | Consistencia capas / TD-1 | JWT | `getSummary` | — | normal=9, alert=1 | **normal=8, alert=2** | **FAIL · DEF-02** |
| CN-22 | Prioridades oráculo | Tabla decisión / oráculo | JWT | `getSummary` priorities | — | 1..4 = M-109,M-112,M-104,M-106 | idéntico | PASS |

## D. UI (caja negra) + consistencia API↔UI

| ID | Título | Técnica | Precondición | Pasos | Datos | Esperado | Obtenido | Estado |
|---|---|---|---|---|---|---|---|---|
| CN-23 | Login por UI → despacho | Flujo E2E mínimo | App UI | login form | admin / admin123 | entra a `/` con datos | OK | PASS |
| CN-24 | Libro: M-106 estado | Consistencia UI↔doc | sesión | `/medidores` fila M-106 | M-106 | **Normal** | **Alerta** | **FAIL · DEF-02** |
| CN-25 | Hora planta M-109 | Consistencia UI↔doc · TZ | sesión, TZ Bogotá | `/anomalias` Detectada | M-109 | 12/09 **14:00** | **12/09 09:00** | **FAIL · DEF-04** |
| CN-26 | Hora planta cambia el día | Valores borde TZ | sesión, TZ Bogotá | Detectada M-104 / M-106 | — | 11/09 00:00 / 08/09 00:00 | **10/09 19:00 / 07/09 19:00** | **FAIL · DEF-04** |

> Nota de numeración: la suite ejecutada originalmente tenía 42 IDs; aquí se **curaron 26 filas de diseño** (CN-01…CN-26) priorizando riesgo y técnicas. Los PASS triviales de orden ASC/DESC y `sort_by` inválido se omiten del entregable (sí se ejecutaron; no aportan señal nueva). Evidencia completa: `evidencias/api/api-exploracion.txt`.

## Resumen

| Métrica | Valor |
|---|---|
| Casos en este entregable | **26** (criterio 15–25 ± margen por tablas de decisión) |
| PASS / FAIL | 19 / **7** (los FAIL se agrupan en **4 defectos**) |
| Técnicas explícitas | Partición, límites, negativas, tablas TD-1/TD-2, consistencia capas |

Defectos: [`05-defectos.md`](05-defectos.md). Automatización de varios FAIL: `e2e/tests/meters.spec.ts`, `timezone.spec.ts`.
