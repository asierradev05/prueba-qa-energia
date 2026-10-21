# QA Project Context — EnergIA

> Archivo fuente que leen todas las skills de QA (qa-skills.com). Valores observados con su evidencia; los desconocidos se declaran como tales, no se inventan.

## Product
- **Nombre:** EnergIA (`prueba-qa`).
- **Qué hace (una frase):** monitorea medidores eléctricos y usa un motor de análisis + IA para detectar anomalías y priorizar el despacho del operador.
- **Tipo:** herramienta interna / dashboard operativo (SaaS interno) con API REST y UI React.
- **URLs:** dev `http://localhost:5173` (frontend) y `http://localhost:8080` (backend, Swagger en `/docs`). Staging/producción: **desconocido** (solo existe `docker-compose.yml` con frontend en `:3000`).
- **Zona de negocio:** `America/Bogota`.

### Journeys críticos (los "si se rompe, nos llaman a las 2am")
1. **Login** y sesión persistente.
2. **Despacho priorizado** (`/`): órdenes ordenadas por el motor.
3. **Libro de medidores** (`/medidores`): listar, buscar, filtrar por estado, paginar.
4. **Detalle de medidor** (`/medidores/:id`): consumo, variación, estado, anomalías.
5. **Anomalías** (`/anomalias`, `/anomalias/:id`) y **Run AI Analysis**.
6. **Hora de planta** mostrada correctamente (es el eje temporal del operador).

## Tech Stack
| Capa | Tecnología | Evidencia |
|---|---|---|
| Backend | Go (módulo `energyai`), REST, `net/http` | `backend/go.mod` (`go 1.26.0`; toolchain local 1.27.0) |
| Frontend | React + TypeScript + Vite + pnpm | `frontend/vite.config.ts`, `frontend/package.json` |
| Datos | JSON embebido (medidores y lecturas); sin BD | `backend/internal/data`, sin `*.sql` |
| IA | OpenAI (`gpt-4o-mini` por defecto) opcional | `docker-compose.yml` (`OPENAI_*`) |
| Auth | JWT HS256, token en `localStorage` | `backend/internal/auth`, `frontend/src/lib/token-storage.ts` |
| Deploy | Docker Compose (backend `:8080`, frontend nginx `:80`) | `docker-compose.yml`, `frontend/nginx.conf` |

## Test Stack
| Tipo | Framework | Config / ubicación | Estado |
|---|---|---|---|
| Unit/integración backend | `go test` | `backend/internal/**/*_test.go` | ✅ pasa |
| Unit frontend | Vitest 5 | `frontend/vite.config.ts` (fuerza `TZ=UTC`) | ✅ 11/11 |
| E2E | Playwright 1.64.1 + TS | `e2e/playwright.config.ts` | ✅ 27 passed |
| API (contratos) | Playwright `request` | `e2e/tests/api.spec.ts` | ✅ |
| Seguridad | Playwright + scripts PS/Node | `e2e/tests/security.spec.ts`, `qa/evidencias/` | ✅ (regresiones) |

- **Sin** tests de visual regression con baseline, performance, accesibilidad (axe), contrato (Pact), pago/email/analytics.
- Nota: la skill advierte que la presencia de configuración no prueba que los tests corran; aquí **corren** (evidencias en `qa/evidencias/`).

## CI/CD
- **Plataforma:** GitHub Actions — `.github/workflows/e2e.yml`.
- **Cuándo:** push / PR.
- **Qué hace:** setup Go + pnpm, levanta backend (`go run`) y frontend (`pnpm dev`), corre la suite E2E, ejecuta `govulncheck`, sube `playwright-report` como artefacto.
- **Bloquea deploy:** desconocido (no hay pipeline de deploy; solo build de imágenes vía compose).
- **Verificado en remoto:** ❌ No (no hay permiso de push al repo de la empresa).

## Environments
- **Cantidad:** dev local + compose "todo-en-uno". Sin staging ni pre-prod.
- **Paridad:** baja — no hay entorno real distinto; los tests corren contra el mismo código.
- **Mocks:** la IA (OpenAI) es opcional; si falta `OPENAI_API_KEY`, hay motor determinista local.

## Quality Goals
- **Cobertura:** sin objetivo declarado. Frontend con 11 tests acotados; backend con buena base en `analysis`/`meter`/`auth`.
- **Flake tolerance:** 0 (la suite E2E es determinista; los fallos son defectos reales).
- **Duración suite E2E:** ~10 s.
- **Sugerido por madurez (skill qa-metrics):** cobertura de journeys críticos al 100% (hoy ✅ vía E2E), unit target 70%, cero defectos P0/P1 abiertos para release.

## Risk Areas (Impacto × Probabilidad)
| Área | Impacto | Prob. | Notas |
|---|---|---|---|
| Autenticación / JWT | A | Alta | **SEC-01** confirmado (secreto por defecto) |
| Clasificación del motor (tipo→estado) | A | Alta | **DEF-02** (M-106) |
| Conversión de hora de planta | A | Media | **DEF-04** |
| Paginación / validación de entrada | M | Media | **DEF-03** |
| Búsqueda / filtros | M | Baja | **DEF-01** |
| Dependencias (stdlib Go) | M | Media | **SEC-06** (10 vulns) |

## Team
- **QA:** 1 (esta prueba). **Dev:** desconocido.
- **Metodología:** desconocida. QA engage: post-dev (prueba técnica).
- **On-call / notificaciones:** desconocido.

## Conventions
- **Nombres de test:** `*.spec.ts` (E2E), `*_test.go` (Go), `*.test.ts` (Vitest).
- **Estructura:** E2E separado en `e2e/`; unit co-localizado.
- **Selectores:** semánticos (`getByRole`, `getByLabel`, ids estables como `#meter-search`); **sin** `data-testid` en prod (respeta "cero cambios en código de producción").
- **Test data:** dataset JSON fijo (12 medidores); credenciales de dev en `.env.example`.
- **Conventional Commits:** sí.

#energia #qa #contexto
