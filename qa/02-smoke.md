# 02 · Suite de humo · EnergIA

Objetivo: conjunto **mínimo** de verificaciones que deciden si el build puede pasar a pruebas funcionales más profundas. Ambiente: modo dev, backend `:8080`, frontend `:5173`, commit `15765d9`, 2026-10-21.

Convención de estados: **PASS** · **FAIL** · **BLOCKED** · **NOT RUN**.

| ID | Objetivo | Por qué es humo | Precondición | Pasos | Datos | Resultado esperado | Resultado obtenido | Estado | Evidencia |
|---|---|---|---|---|---|---|---|---|---|
| SMK-01 | App/API disponibles | Sin servicios no hay nada que probar | — | `GET /health`; `GET :5173/` | — | `{"status":"ok"}`; HTML 200 | `{"status":"ok"}`; 200 HTML | **PASS** | `evidencias/backend-server.log`, `frontend-server.log` |
| SMK-02 | Login válido | Puerta de entrada a todo | API arriba | `POST /auth/login` credenciales válidas | `admin@energia.local`/`admin123` | 200 + `access_token` | 200, token Bearer, exp 28800 | **PASS** | `evidencias/api-exploracion.txt` §1 |
| SMK-03 | Rechazo de credenciales inválidas | Seguridad básica | API arriba | `POST /auth/login` con password errada | `admin@energia.local`/`wrong` | 401 | 401 (`ErrInvalidCredentials`) | **PASS** | `evidencias/api-exploracion.txt` |
| SMK-04 | Rutas protegidas exigen JWT | No exponer datos | — | `POST /meter/getAll` sin token | — | 401 | 401 | **PASS** | `evidencias/api-exploracion.txt` |
| SMK-05 | Funcionalidad principal: lista de medidores | Core del producto | Token | `POST /meter/getAll {}` | — | 200, page 1 size 10, count 12 | 200, count=12, rows=10 | **PASS** | `evidencias/api-exploracion.txt` |
| SMK-06 | Carga de datos esenciales (motor) | Sin datos reales no hay producto | — | `go run ./cmd/inspect` | CSV del repo | 4 anomalías, 2 prioritarias | 4 anomalías, 2 prioritarias | **PASS** | `evidencias/engine-inspect-json.txt` |
| SMK-07 | Detalle de un medidor | Ruta de detalle operable | Token | `GET /meter/getById/M-109` | M-109 | 200 con anomalía REAL/HIGH | 200, REAL_ANOMALY HIGH conf 0.95 | **PASS** | `evidencias/api-exploracion.txt` |
| SMK-08 | Endpoints críticos de la API | Cobertura de superficie | Token | `getParams`, `dashboard/getSummary`, `anomaly/getAll` | — | 200 cada uno | 200 cada uno | **PASS** | `evidencias/api-exploracion.txt` |
| SMK-09 | Validación de negocio fundamental (resultado esperado del motor) | Criterio de éxito del MVP | — | comparar `inspect` con el oráculo | dataset | M-109→#1, M-112→#2, M-104→#3, M-106→#4 | idéntico al oráculo | **PASS** | `evidencias/engine-inspect-json.txt` |
| SMK-10 | Estado de medidor coherente con la doc (M-106 FP→NORMAL) | Regla de negocio explícita | Token | `GET /meter/getById/M-106` | M-106 | status **NORMAL** | status **ALERT** | **FAIL** | `evidencias/api-exploracion.txt` §5 |

## Conclusión de humo

- **9/10 PASS, 1 FAIL.** El build **arranca, autentica, sirve datos reales y el motor reproduce exactamente el resultado esperado** → **apto para pruebas funcionales más profundas**.
- El FAIL de SMK-10 (estado de M-106) no bloquea la continuidad, pero es un defecto funcional confirmado (ver `05-defectos.md`, DEF-02).

> Nota: SMK-10 se incluyó en humo porque el mapeo tipo→estado es una regla de negocio explícita y central del producto (cuántas órdenes ve el operador), no un detalle de borde.
