# Suite de humo · EnergIA

Conjunto **mínimo** que decide si el build puede pasar a pruebas funcionales. Ambiente: modo dev, backend `:8080`, frontend `:5173`, commit `15765d9`, 2026-10-21.

Estados: **PASS** · **FAIL** · **BLOCKED** · **NOT RUN**.

| ID | Objetivo | Por qué es humo | Pasos / datos | Esperado | Obtenido | Estado | Evidencia |
|---|---|---|---|---|---|---|---|
| SMK-01 | App/API arriba | Sin servicios no hay qué probar | `GET /health`; `GET :5173/` | `{"status":"ok"}`; HTML 200 | ok + 200 | **PASS** | `evidencias/backend-server.log` |
| SMK-02 | Login válido | Puerta a todo el producto | `POST /auth/login` admin/admin123 | 200 + JWT | 200, Bearer exp 28800 | **PASS** | `evidencias/api/api-exploracion.txt` §1 |
| SMK-03 | Rechazo de credenciales | Seguridad básica | login password errada | 401 | 401 | **PASS** | idem |
| SMK-04 | Rutas protegidas | No exponer datos | `getAll` sin token | 401 | 401 | **PASS** | idem |
| SMK-05 | Lista de medidores | Core del producto | `getAll {}` + token | 200, count 12, page 1 size 10 | idéntico | **PASS** | idem |
| SMK-06 | Motor con datos | Sin datos reales no hay producto | `go run ./cmd/inspect` | 4 anomalías, 2 prioritarias | idéntico | **PASS** | `evidencias/api/engine-inspect-json.txt` |
| SMK-07 | Detalle operable | Ruta de detalle | `getById/M-109` | REAL/HIGH | REAL HIGH conf 0.95 | **PASS** | `api-exploracion.txt` |
| SMK-08 | Superficie crítica API | Dashboard + anomalías + params | 3 GETs | 200 cada uno | 200 | **PASS** | idem |
| SMK-09 | Oráculo del motor | Criterio de éxito del MVP | inspect vs README | M-109→#1 … M-106→#4 | idéntico | **PASS** | `engine-inspect-json.txt` |
| SMK-10 | Estado FP→NORMAL | Regla de negocio central | `getById/M-106` | status **NORMAL** | status **ALERT** | **FAIL** | `api-exploracion.txt` §5 · DEF-02 |

## Conclusión

- **9/10 PASS, 1 FAIL.** El build **arranca, autentica, sirve datos y el motor coincide con el oráculo** → **apto para pruebas funcionales**.
- SMK-10 no bloquea seguir probando, pero es defecto funcional confirmado ([`05-defectos.md`](05-defectos.md) DEF-02). Se incluyó en humo porque el mapeo tipo→estado define cuántas órdenes ve el operador.
