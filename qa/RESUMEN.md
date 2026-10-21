# Resumen ejecutivo · Prueba técnica QA · EnergIA

Autor: QA técnico · Fecha: 2026-10-21 · Repo `biaenergy/prueba-qa` · commit `15765d9`.
Alcance: backend (Go) + frontend (React/Vite) de EnergIA, ejecutados en modo dev (sin Docker).

## 1. Qué se hizo

Prueba completa en 9 fases sobre el sistema **ejecutándose de verdad**:

1. Reconocimiento y entorno (Go, pnpm, Playwright).
2. Plan y estrategia de pruebas.
3. Levantamiento y exploración (API + UI).
4. Suite de humo.
5. Caja negra (42 casos).
6. Registro de defectos.
7. Caja blanca (causa raíz por ramas/límites).
8. Automatización E2E con Playwright + TypeScript.
9. Revisión final y este resumen.

**No se modificó código de producción.** Solo se añadieron artefactos en `qa/` y la suite en `e2e/` (`git status`: únicamente `qa/` y `e2e/` nuevos).

## 2. Resultado global

| Métrica | Valor |
|---|---|
| Humo | 9/10 PASS, 1 FAIL |
| Caja negra (casos) | 42 ejecutados · 35 PASS · 5 FAIL (agrupados en 4 defectos) |
| Defectos confirmados | **4** (2 Alta/P1, 2 Alta-Media/P2) |
| Suite E2E | **13 tests verdes** (`pnpm test`) sobre el estado actual |
| Backend | `go build` OK · `go test ./...` OK |
| Frontend | `pnpm build`/`pnpm test` OK (11/11) |

El MVP **cumple la función central**: el motor reproduce exactamente el resultado esperado del oráculo (M-109 #1, M-112 #2, M-104 #3, M-106 #4) y la UI presenta las órdenes con evidencia y acción. Los defectos están en **reglas de presentación/estado, validación de entrada y formato de fechas**, no en el núcleo de detección.

## 3. Defectos confirmados

| ID | Título | Severidad | Prioridad | Superficie |
|---|---|---|---|---|
| **DEF-02** | Medidor con falso positivo (M-106) mostrado como "Alerta" (debe ser "Normal"): afecta API, KPIs del dashboard y el libro UI | **Alta** | **P1** | API + UI |
| **DEF-04** | Las horas "Detectada" usan la zona del navegador, no la hora de planta: en Bogotá muestra 09:00 en vez de 14:00 y cambia el día en M-104/M-106 | **Alta** | **P1** | UI |
| **DEF-03** | `pagination.page` negativo devuelve HTTP 500 (panic por slice fuera de rango) en vez de 400 | Alta | P2 | API |
| **DEF-01** | La búsqueda de medidores no ignora mayúsculas pese a que la doc lo promete (`m-109` → 0 resultados) | Media | P2 | API |

Detalle completo (contrato violado, pasos, causa raíz, corrección propuesta, evidencia) en `qa/05-defectos.md`.

Extras no confirmados: `OBS-01` (doc "supera 50 %/20 %" vs código `>=`, borde no reproducible) y `RIESGO-W1` (indexación sin comprobar lista vacía en `summarize`).

## 4. Calidad de la evidencia

- Los 4 defectos se **reprodujeron por ejecución real** (no análisis estático): API con PowerShell/`Invoke-*`, UI con Playwright en 4 zonas horarias, log del servidor para el panic.
- Cada defecto tiene su causa raíz localizada por archivo:línea (caja blanca).
- Los 4 se **automatizaron** en `e2e/` con `test.fail()` y la suite pasa (13/13), de modo que quedan como pruebas de regresión: al corregir el defecto, el test correspondiente fallará y señalará que debe retirarse la anotación.

## 5. Recomendación

**No liberar a producción** hasta resolver los dos defectos P1 (DEF-02 y DEF-04): ambos alteran información que el operador usa para decidir (qué está en alerta y en qué momento ocurrió). Corregir también DEF-03 (500) y DEF-01 (búsqueda) en la misma iteración, dado su bajo costo.

Sugerencias de proceso derivadas de la prueba:
- Ampliar cobertura de caminos en `meter.StatusOf` (caso FALSE_POSITIVE), `httpx.Pagination` (page<0) y la búsqueda (`ToUpper`/`TrimSpace`).
- **No** forzar `TZ=UTC` en los tests de fechas, o añadir una prueba con `TZ=America/Bogota`; el `TZ` forzado (vite.config.ts:33) ocultó DEF-04.

## 6. Entregables

| Artefacto | Ubicación |
|---|---|
| Plan de pruebas | `qa/01-plan-de-pruebas.md` |
| Suite de humo | `qa/02-smoke.md` |
| Casos de caja negra | `qa/03-casos-caja-negra.md` |
| Caja blanca | `qa/04-caja-blanca.md` |
| Defectos | `qa/05-defectos.md` |
| Bitácora | `qa/PROGRESO.md` |
| Mapa funcional (soporte) | `qa/_fase1-mapa-funcional.md` |
| Evidencias | `qa/evidencias/` (API, UI/fechas, log backend, salida del motor, run E2E) |
| Automatización E2E | `e2e/` (Playwright + TypeScript) |

## 7. Limitaciones y transparencia

- Sin `OPENAI_API_KEY`: la narración con OpenAI no se cubrió; sí la determinista del motor.
- Sin Docker: se usó el modo dev equivalente.
- Dataset fijo y determinista (resultados reproducibles).
- Se usó IA como apoyo para análisis, diseño de casos y redacción; **todo resultado fue verificado ejecutando el sistema** y contrastado con la documentación. Ningún hallazgo, código HTTP o causa raíz es especulativo.
