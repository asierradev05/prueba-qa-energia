# Plan de pruebas · EnergIA

QA técnico · Prueba Bia Energy · Repo `biaenergy/prueba-qa` · commit `15765d9`.

## 1. Objetivo y alcance

Verificar que el MVP **EnergIA** (detección/priorización de anomalías de consumo) cumple el contrato documentado en `README.md`, `backend/README.md`, `frontend/README.md` y `frontend/PRODUCT.md`, priorizando los flujos del operador y la coherencia entre documentación, API y UI.

**Incluido**

- Login / JWT
- Lista de medidores (`getAll`: filtro, búsqueda, orden, paginación)
- Detalle (`getById`), anomalías, dashboard
- Formato de fechas / hora de planta (`America/Bogota`)
- Validación de entradas y códigos HTTP
- Reglas de negocio del motor (tipo → estado / severidad / prioridad)

**Excluido (con justificación)**

| Fuera de alcance | Por qué |
|---|---|
| Redacción con OpenAI | Sin `OPENAI_API_KEY` en el entorno; el narrador determinista sí se cubre |
| Multi-rol / multiusuario | El producto documenta un solo usuario (`PRODUCT.md`) |
| Carga / stress | Dataset en memoria de 14 días; fuera del alcance del MVP |
| Corregir defectos en el código de la app | Prohibido por el enunciado (solo reportar; sí se añaden tests) |

## 2. Análisis de riesgos (probabilidad × impacto)

| # | Área | Riesgo | Prob. | Impacto | Prioridad |
|---|---|---|---|---|---|
| R1 | Fechas UI | `formatPlantTime` en hora local desfasa día/hora (Bogotá UTC−5) | Alta | Alto | **P1** |
| R2 | Estado medidor | FALSE_POSITIVE mostrado como ALERT (debe ser NORMAL) | Alta | Alto | **P1** |
| R3 | Auth / secreto | JWT firmable con secreto por defecto → bypass | Alta | Crítico | **P0** |
| R4 | Búsqueda API | `meter_id` no ignora mayúsculas pese a la doc | Alta | Medio | **P2** |
| R5 | Paginación | `page` negativo ⇒ 500 (panic) en vez de 400 | Media | Alto | **P2** |
| R6 | Motor | tipo → severidad → prioridad vs. oráculo | Baja | Alto | **P2** |
| R7 | Auth inputs | token inválido/vencido, email con espacios | Media | Medio | **P3** |
| R8 | Severidad límite | doc “supera 20/50 %” vs código `>=` | Baja | Bajo | **P3** |

Priorización: primero lo que **cambia la decisión del operador** o **abre la puerta sin credenciales** (R3, R1, R2); después robustez de API (R4, R5); el motor se valida por oráculo (R6) porque ya tiene inspect + tests.

## 3. Estrategia por capa

| Capa | Qué | Herramienta |
|---|---|---|
| **API** (principal) | Contrato, filtros, orden, paginación, HTTP, errores | Playwright `request` / PowerShell contra `:8080` |
| **UI (E2E)** | Login → libro → filtro → detalle; aserciones de negocio | Playwright + TypeScript (`e2e/`) |
| **Unitaria / caja blanca** | Módulos de riesgo + confianza en suites existentes | `go test ./…`, `pnpm test` |

## 4. Técnicas de diseño

- Partición de equivalencia y valores límite (login, filtros, paginación)
- Tablas de decisión (tipo → estado; tipo/desvío → severidad del motor)
- Pruebas negativas y validación de entradas
- Consistencia entre capas (doc ↔ API ↔ UI)

## 5. Datos y ambiente

- Backend `go run ./cmd/api` (`:8080`), frontend `pnpm dev` (`:5173`); modo dev, sin Docker
- Credenciales: `admin@energia.local` / `admin123`
- Medidores clave: M-109 (REAL/HIGH), M-112 (DQ/HIGH), M-104 (EXPLAIN/MEDIUM), M-106 (FP/LOW), M-999 (inexistente)
- Zona de negocio: `America/Bogota`
- Datos controlados; sin operaciones destructivas

## 6. Criterios de entrada

Build compila (`go build`, `pnpm install`), servicios arriba, login OK, suites existentes ejecutables.

## 7. Criterios de salida

- Suite de humo ejecutada con resultado
- Casos de caja negra ejecutados (técnicas visibles)
- ≥2 defectos verificados con evidencia reproducible
- Automatización Playwright que corre
- Resumen ejecutivo con recomendación fundada

## 8. Limitaciones

Sin Docker; sin OpenAI; dataset fijo (resultados deterministas). En entrevista: reproducir un defecto en vivo y explicar un test Playwright.

## 9. Uso de IA

Acelerador para análisis estático, propuesta de casos y redacción. **Control de validación:** todos los resultados se obtuvieron ejecutando la app; ningún HTTP ni causa raíz proviene de suposición. Cada defecto se contrastó con el oráculo documental y se reprodujo.

---

## 10. Resumen ejecutivo

**Veredicto: NO liberar a producción.**

El camino feliz funciona (login, listado, filtros, detalle, motor, anomalías), pero hay **1 vulnerabilidad crítica** y **2 defectos P1** que alteran la decisión del operador.

### Bloqueantes

| ID | Severidad | Resumen |
|---|---|---|
| **SEC-01** | Crítica | Bypass: JWT forjable con secreto por defecto `dev-secret-change-me` → API completa sin credenciales (`200 OK` verificado) |
| **DEF-04** | Alta (P1) | Horas “Detectada” dependen de la zona del navegador; en Bogotá `09:00` cuando la planta marcó `14:00` |
| **DEF-02** | Alta (P1) | M-106 (falso positivo, “no escalar”) aparece como **Alerta** en API y UI |

### No bloqueantes (misma iteración recomendada)

- DEF-03 (P2): `page` negativo → HTTP 500
- DEF-01 (P2): búsqueda `meter_id` case-sensitive
- SEC-02…07: cabeceras, rate limit, JWT en `localStorage`, secretos por defecto, deps Go, nginx

### Fortalezas

Login sin enumeración de usuarios, JSON estricto, límite de body, CORS correcto, sin SQLi/XSS obvio, `alg=none` rechazado, error uniforme, `go vet` limpio. El motor **reproduce el oráculo** (M-109 #1 … M-106 #4).

### Plan de corrección sugerido

1. **P0:** SEC-01 (fail-closed + secreto real ≥32 bytes)
2. **P1:** DEF-02 y DEF-04
3. **P2:** DEF-03, DEF-01, endurecimiento SEC

Detalle: [`05-defectos.md`](05-defectos.md) · seguridad extendida: [`anexos/seguridad.md`](anexos/seguridad.md) · E2E: [`../e2e/README.md`](../e2e/README.md).
