# EnergIA · AI Energy Management Platform

> **¿Vienes a presentar la prueba técnica de QA?** Empieza por [PRUEBA_QA.md](PRUEBA_QA.md).

MVP para monitorear medidores eléctricos y usar IA para **detectar, explicar, priorizar y recomendar acciones** sobre anomalías de consumo.

Con 14 días de lecturas horarias de 12 medidores, la plataforma responde lo que necesita un operador: qué está pasando, qué se sale de lo normal, si la anomalía es real, explicable o un problema de calidad de datos, cuál revisar primero y qué hacer.

| Prioridad | Medidor | Resultado | Acción |
|---|---|---|---|
| 1 | M-109 | Anomalía real (+110,5 % sin evento que lo explique) | Investigar en sitio |
| 2 | M-112 | Calidad de datos (voltaje y factor de potencia incoherentes) | Validar el medidor |
| 3 | M-104 | Anomalía explicable (nueva línea productiva) | Actualizar baseline |
| 4 | M-106 | Falso positivo (parada programada) | No escalar |

## Proyecto

Este repo tiene dos aplicaciones y la configuración para correrlas juntas:

| Carpeta | Qué es | Documentación |
|---|---|---|
| [`backend/`](backend/) | API en Go: motor de detección de anomalías, login con JWT, Run AI Analysis y narrador opcional con OpenAI | [backend/README.md](backend/README.md): API, variables de entorno, metodología del motor y tests |
| [`frontend/`](frontend/) | Dashboard en React 19 + Vite + TanStack Query | [frontend/README.md](frontend/README.md): pantallas y arquitectura. El diseño está en [DESIGN.md](frontend/DESIGN.md) y el producto en [PRODUCT.md](frontend/PRODUCT.md) |

```
energy-ai/
├── .env.example         # plantilla de variables (copiar como .env)
├── docker-compose.yml   # backend + frontend
├── backend/             # API en Go (datos en backend/data/*.csv)
└── frontend/            # React, servido por nginx en Docker
```

## Configuración

Hay **un solo `.env`**, en la raíz del proyecto. Lo usan el backend, el frontend y `docker compose`:

```bash
cp .env.example .env
```

Todas las variables son opcionales y tienen un valor por defecto, así que la app arranca sin tocar nada. Las que conviene definir:

| Variable | Para qué |
|---|---|
| `OPENAI_API_KEY` | Si está, Run AI Analysis redacta las explicaciones con OpenAI. Si no, las escribe el motor |
| `JWT_SECRET` | Secreto de los tokens. **Cámbialo fuera de local** |
| `AUTH_EMAIL`, `AUTH_PASSWORD` | Usuario del login (por defecto `admin@energia.local` / `admin123`) |

La lista completa está en [backend/README.md](backend/README.md#variables-de-entorno). El `.env` está en `.gitignore` y nunca se sube al repo.

## Cómo correrlo

### Con Docker

Desde la raíz del proyecto:

```bash
docker compose up -d --build
```

| Servicio | URL |
|---|---|
| Frontend | http://localhost:3000 |
| API (Swagger) | http://localhost:8080/docs |

nginx sirve el frontend y reenvía `/api` al backend, así que la app funciona desde cualquier IP sin configurar CORS. Para detenerla: `docker compose down`.

### En desarrollo

Se corre cada aplicación en su propia terminal. El frontend se recarga solo al guardar.

```bash
# Terminal 1: backend (Go 1.26+), en http://localhost:8080
cd backend
go run ./cmd/api

# Terminal 2: frontend (Node 20.19+ y pnpm), en http://localhost:5173
cd frontend
pnpm install
pnpm dev
```

El backend se corre desde `backend/`: ahí busca los CSV (`data/`) y el `.env` de la raíz (`../.env`). En desarrollo, Vite reenvía `/api` al backend.

## Despliegue en un servidor

En cualquier máquina con Docker (por ejemplo, una VM o un LXC de Proxmox):

```bash
git clone <url-del-repo> energy-ai
cd energy-ai
cp .env.example .env     # completa JWT_SECRET, AUTH_PASSWORD y OPENAI_API_KEY
docker compose up -d --build
```

Para actualizar: `git pull && docker compose up -d --build`.

El servidor construye las imágenes, así que no hace falta un registro como Docker Hub. Los CSV van dentro de la imagen del backend.

## Tests

```bash
# backend
cd backend
go test ./...

# frontend
cd frontend
pnpm test && pnpm lint && pnpm typecheck
```

El detalle de qué cubre cada suite está en el README de cada aplicación.

---

# Entrega de la prueba técnica de QA

Documentación completa de la prueba de QA sobre **EnergIA** (backend Go + frontend React/Vite). Todo ejecutado contra el sistema real en modo dev.

## Informes profesionales (BiaEnergy · QA)

**[Abrir portal de informes HTML →](qa/reportes/index.html)**

Los informes se han generado con la identidad visual de BiaEnergy (tema oscuro, acento menta) a partir del mismo contenido que los `.md`, listos para revisar con un aspecto corporativo.

| Informe | Descripción |
|---|---|
| [Resumen ejecutivo](qa/reportes/resumen-ejecutivo.html) | Veredicto **No liberar a producción**, riesgos abiertos y recomendaciones. |
| [Plan de pruebas](qa/reportes/plan-de-pruebas.html) | Alcance, riesgos, técnicas, criterios de entrada/salida. |
| [Suite de humo](qa/reportes/suite-de-humo.html) | Comprobación rápida de salud del sistema. |
| [Casos de caja negra](qa/reportes/casos-caja-negra.html) | 42 casos con técnicas (partición equivalente, valores límite). |
| [Caja blanca](qa/reportes/caja-blanca.html) | Análisis estático, cobertura y propuesta de tests unitarios. |
| [Registro de defectos](qa/reportes/registro-de-defectos.html) | 4 defectos confirmados con causa raíz, reproducción y propuesta de corrección. |
| [Reporte de seguridad](qa/reportes/reporte-de-seguridad.html) | 7 hallazgos (SEC-01 **crítica**) con evidencia reproducible. |
| [Preparación para producción](qa/reportes/produccion-readiness.html) | Evaluación 42/100 — bloqueado. |
| [Métricas y cobertura](qa/reportes/metricas-y-cobertura.html) | Métricas, huecos y estado de ejecución. |

> **Video de la entrega:** _(enlace pendiente de publicación)._ Guion en [`qa/07_Anexos_Internos/Guion_Video.md`](qa/07_Anexos_Internos/Guion_Video.md).

## Empezar a revisar

> **ÍNDICE DE ENTREGA (recomendado):** [`qa/00_Resumen_Ejecutivo/INDICE_ENTREGA.md`](qa/00_Resumen_Ejecutivo/INDICE_ENTREGA.md) — recorrido ordenado por secciones para revisión eficiente.
>
> **Vista general interactiva:** [`qa/06_Reportes_Interactivos/video-entrega-qa.html`](qa/06_Reportes_Interactivos/video-entrega-qa.html) — página para el video: conclusión, recorrido, artefactos, defectos y checklist.
>
> **Diagramas:** [Arquitectura del sistema](qa/06_Reportes_Interactivos/arquitectura-energia.html) · [Mapa de entregables](qa/06_Reportes_Interactivos/entregables-prueba-qa.html).

1. **[`qa/00_Resumen_Ejecutivo/RESUMEN.md`](qa/00_Resumen_Ejecutivo/RESUMEN.md)** — resumen ejecutivo: qué se hizo, veredicto **No liberar** y riesgos abiertos.
2. **[`qa/03_Defectos_y_Seguridad/Defectos.md`](qa/03_Defectos_y_Seguridad/Defectos.md)** — los 4 defectos confirmados (título, severidad/prioridad, pasos, evidencia, causa raíz `archivo:línea`).
3. **[`qa/03_Defectos_y_Seguridad/Seguridad.md`](qa/03_Defectos_y_Seguridad/Seguridad.md)** — hallazgos de seguridad (SEC-01 crítica).
4. **[`qa/vault/index.md`](qa/vault/index.md)** — vault de Obsidian que enlaza todo (mapa visual en `qa/vault/Mapa.canvas`).

## Entregables

| Parte | Entregable | Ubicación |
|---|---|---|
| A · Plan | Estrategia, riesgos, técnicas, criterios | [`qa/01_Plan_y_Estrategia/Plan_de_Pruebas.md`](qa/01_Plan_y_Estrategia/Plan_de_Pruebas.md) |
| B · Humo | 10 verificaciones mínimas (9 PASS / 1 FAIL) | [`qa/02_Pruebas_Funcionales/01_Smoke.md`](qa/02_Pruebas_Funcionales/01_Smoke.md) |
| C · Caja negra | 42 casos sobre API y UI | [`qa/02_Pruebas_Funcionales/02_Caja_Negra.md`](qa/02_Pruebas_Funcionales/02_Caja_Negra.md) |
| D · Caja blanca | Ramas/casos borde + análisis de tests existentes | [`qa/02_Pruebas_Funcionales/03_Caja_Blanca.md`](qa/02_Pruebas_Funcionales/03_Caja_Blanca.md) |
| E · Defectos | 4 defectos confirmados | [`qa/03_Defectos_y_Seguridad/Defectos.md`](qa/03_Defectos_y_Seguridad/Defectos.md) |
| F · Playwright | Suite E2E (27 tests) | [`e2e/`](e2e/), guía en [`e2e/README.md`](e2e/README.md) |
| Extra · Seguridad | Probing propio + `govulncheck` | [`qa/03_Defectos_y_Seguridad/Seguridad.md`](qa/03_Defectos_y_Seguridad/Seguridad.md) |
| Extra · Readiness | Auditoría de preparación para producción | [`qa/03_Defectos_y_Seguridad/Produccion_Readiness.md`](qa/03_Defectos_y_Seguridad/Produccion_Readiness.md) |
| Evidencias | Logs, capturas, request/response, runs | [`qa/05_Evidencias/`](qa/05_Evidencias/) |
| Reportes Interactivos | Diagramas navegables | [`qa/06_Reportes_Interactivos/`](qa/06_Reportes_Interactivos/) |
| CI | Workflow que levanta la app y corre la suite | [`.github/workflows/e2e.yml`](.github/workflows/e2e.yml) |

## Ejecutar la suite E2E

```bash
cd e2e
pnpm install && pnpm exec playwright install chromium && pnpm test
```

Requiere el backend (`:8080`) y el frontend (`:5173`) levantados. Guía completa en [`e2e/README.md`](e2e/README.md).

## Anexos de proceso

Notas de trazabilidad del proceso (bitácora, guion del video y progreso por fases):

- [`qa/07_Anexos_Internos/`](qa/07_Anexos_Internos/) — bitácora, guion del video y progreso por fases.

## Nota

No se modificó código de producción (`backend/`, `frontend/`): la entrega **solo añade** `qa/`, `e2e/` y `.github/`.
