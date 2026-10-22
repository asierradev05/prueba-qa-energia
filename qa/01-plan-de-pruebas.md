# Plan de pruebas · EnergIA

QA técnico · Prueba Bia Energy · Repo `biaenergy/prueba-qa` · commit `15765d9`.

## 1. Objetivo y alcance

Verificar que el MVP **EnergIA** (detección/priorización de anomalías de consumo) cumple el contrato documentado en `README.md`, `backend/README.md`, `frontend/README.md` y `frontend/PRODUCT.md`, priorizando los flujos del operador y la coherencia entre documentación, API y UI.

**Incluido:** login/JWT; lista de medidores (`getAll` con filtro/búsqueda/orden/paginación); detalle (`getById`); anomalías; dashboard; formato de fechas/hora de planta; validación de entradas y códigos HTTP.

**Excluido (con justificación):**
- Redacción con OpenAI: sin `OPENAI_API_KEY` en el entorno; el narrador determinista sí se cubre.
- Multi-rol/multiusuario: el producto documenta un solo usuario (`PRODUCT.md`).
- Pruebas de carga/stress: fuera del alcance de un MVP de 14 días de datos en memoria.
- Corrección de defectos: prohibido por el enunciado (solo reportar).

## 2. Análisis de riesgos (probabilidad × impacto)

| # | Área | Riesgo | Prob. | Impacto | Prioridad |
|---|---|---|---|---|---|
| R1 | Fechas UI | `formatPlantTime` en hora local desfasa día/hora (Bogotá UTC−5) | Alta | Alto | **P1** |
| R2 | Estado medidor | FALSE_POSITIVE mostrado/seleccionado como ALERT (debe ser NORMAL) | Alta | Alto | **P1** |
| R3 | Búsqueda API | `meter_id` no ignora mayúsculas pese a la doc | Alta | Medio | **P2** |
| R4 | Paginación | `page` negativo ⇒ 500 (panic) en vez de 400 | Media | Alto | **P2** |
| R5 | Motor | tipo→severidad→prioridad vs. resultado esperado | Baja | Alto | **P2** |
| R6 | Auth | token inválido/vencido, email con espacios/mayúsculas | Media | Medio | **P3** |
| R7 | Severidad límite | doc "supera 20/50 %" vs código `>=` | Baja | Bajo | **P3** |

## 3. Estrategia por capa

- **API (principal):** validación de contrato, filtros, orden, paginación, códigos HTTP, errores uniformes. Herramienta: Playwright `request` / PowerShell (equivalente a curl) contra `:8080`.
- **UI (E2E):** flujo de negocio login→libro→filtro→detalle con aserciones de datos. Herramienta: **Playwright + TypeScript** (`e2e/`).
- **Unitaria / caja blanca:** revisar módulos de riesgo y ejecutar las suites existentes (`go test ./...`, `pnpm test`).

## 4. Técnicas de diseño

Partición de equivalencia, análisis de valores límite (paginación, longitudes, severidad), **tablas de decisión** (tipo→estado y tipo→severidad del motor), pruebas negativas y de validación, y **consistencia entre capas** (doc vs API vs UI).

## 5. Datos y ambiente

- Backend `go run ./cmd/api` (`:8080`), frontend `pnpm dev` (`:5173`); modo dev, sin Docker.
- Credenciales: `admin@energia.local`/`admin123`. Inválidas: contraseña errónea, email inexistente.
- Medidores clave: M-109 (REAL/HIGH), M-112 (DQ/HIGH), M-104 (EXPLAIN/MEDIUM), M-106 (FP/LOW), M-999 (inexistente).
- Zona de negocio: `America/Bogota`.
- Datos controlados, sin operaciones destructivas.

## 6. Criterios de entrada

Build compila (`go build`, `pnpm install`), servicios arriba, login OK, tests existentes ejecutables.

## 7. Criterios de salida

Suite de humo ejecutada con resultado; casos de caja negra ejecutados; ≥2 defectos verificados con evidencia reproducible; automatización Playwright que corre; resumen ejecutivo con recomendación fundada.

## 8. Limitaciones

- Sin Docker; sin OpenAI; dataset fijo (resultados deterministas).
- Entrevista: reproducción en vivo de un defecto y explicación del test.

## 9. Uso de IA y control de validación

El enunciado valora contar cómo se usó la IA. Se usó como **acelerador** para análisis estático, propuesta de casos y redacción. El control de validación es lo que la vuelve fiable: **todos** los resultados aquí registrados se obtuvieron ejecutando realmente la app; ningún resultado, código HTTP ni causa raíz proviene de suposición. Cada defecto se contrastó contra el oráculo documental y se reprodujo en vivo.

## 10. Resumen ejecutivo

**Veredicto: NO liberar a producción.**

El sistema funciona en el "camino feliz" (login, listado, filtros, detalle, motor, anomalías), pero hay **1 vulnerabilidad crítica de seguridad** y **2 defectos P1** que alteran la decisión del operador. Además hay 2 defectos P2 y 6 hallazgos de seguridad secundarios.

### Bloqueantes
| ID | Severidad | Resumen |
|---|---|---|
| SEC-01 | Crítica | Bypass de autenticación: se puede forjar un JWT válido con el secreto por defecto `dev-secret-change-me` y leer toda la API sin credenciales. Verificado: `200 OK`. |
| DEF-04 | Alta (P1) | Las horas "Detectada" dependen de la zona del navegador; un operador en Bogotá ve `09:00` cuando la planta marcó `14:00`. |
| DEF-02 | Alta (P1) | El medidor M-106 (falso positivo, "no escalar") se muestra como **Alerta** en API y UI → el operador escala algo que debía ignorar. |

### No bloqueantes
- DEF-03 (P2): `pagination.page` negativo → HTTP 500 (panic de slice).
- DEF-01 (P2): la búsqueda de `meter_id` no ignora mayúsculas, pese a la doc.
- SEC-02/03/04/05/06/07: sin cabeceras de seguridad, sin rate limiting, JWT en `localStorage`, secretos por defecto, dependencias de Go con vulnerabilidades alcanzables, nginx sin endurecer.

### Fortalezas observadas
Login que no enumera usuarios, validación estricta de JSON, límite de body, CORS correcto, sin inyección SQL/XSS, `alg=none` rechazado, formato de error uniforme, `go vet` limpio.

### Plan de corrección sugerido
1. **P0:** SEC-01 (fail-closed con el secreto por defecto + secreto real ≥32 bytes).
2. **P1:** DEF-02 y DEF-04.
3. **P2:** DEF-03, DEF-01, SEC-02/03/04/05/06.

Detalle en [`05-defectos.md`](05-defectos.md), [`03_Defectos_y_Seguridad/Seguridad.md`](03_Defectos_y_Seguridad/Seguridad.md) y [`00_Resumen_Ejecutivo/RESUMEN.md`](00_Resumen_Ejecutivo/RESUMEN.md).
