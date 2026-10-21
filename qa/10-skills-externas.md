# 10 · Skills externas de QA (petrkindlmann/qa-skills)

> Aplicación de las skills del repo [petrkindlmann/qa-skills](https://github.com/petrkindlmann/qa-skills) (50 skills, MIT) sobre la prueba de EnergIA. Commit del repo externo clonado en `%TEMP%\opencode\qa-skills` (no se versiona en el proyecto).

Skills aplicadas aquí: `qa-project-context` · `release-readiness` · `bug-reproduction` · `qa-metrics` · `coverage-analysis` · `qa-report-humanizer`.

El contexto de proyecto que todas consumen quedó en `.agents/qa-project-context.md`.

---

## 1) qa-project-context ✅

Generado `.agents/qa-project-context.md` con: producto, journeys críticos, tech stack, test stack, CI/CD, entornos, goals de calidad, áreas de riesgo (matriz Impacto×Probabilidad) y convenciones. Los valores provienen del repo (go.mod, vite.config, docker-compose, e2e/); los desconocidos (URL de staging, equipo, on-call) se marcan explícitamente como **desconocido**, sin inventar.

## 2) release-readiness — decisión Go/No-Go

**Decisión: NO-GO.** Ningún P0/P1 abierto puede convivir con un release.

### Checklist automatizado
| Check | Resultado | Evidencia |
|---|---|---|
| CI verde | ⚠️ No verificado en remoto | workflow existe; sin push al repo empresa |
| Smoke en staging | ❌ BLOCKED | no hay entorno staging |
| Sin P0/P1 abiertos | ❌ FAIL | SEC-01 (crítica), DEF-02 y DEF-04 (P1) |
| Presupuesto de rendimiento | ⏭️ no medido | fuera de alcance |
| Escaneo de seguridad limpio | ❌ FAIL | SEC-01/05/06 (`govulncheck`: 10 vulns) |
| Contratos de API | ✅ PASS | `e2e/tests/api.spec.ts` |
| Regresión visual | ⚠️ INCONCLUSIVE | sin baseline |
| Accesibilidad (axe) | ⏭️ no ejecutado | fuera de alcance |

### Checklist manual
| Check | Estado |
|---|---|
| Feature flags | N/A (no hay flags) |
| Monitorización/alertas | ❌ no hay |
| **Plan de rollback documentado y probado** | ❌ **no existe** |
| Migraciones de BD | N/A (datos JSON, sin SQL) |
| Dependencias revisadas | ❌ Govulnerabilidades alcanzables |
| Notas de release | ⏭️ |
| On-call identificado | ❌ desconocido |

### Riesgo del release
- **Alcance:** Medio (app completa, no un solo feature).
- **Blast radius:** 100% de los operadores (1 solo usuario/rol hoy).
- **Complejidad de reversión:** baja en infra (compose), **alta en confianza** por el secreto por defecto.

### Diseño de smoke sugerido (≤5 min, 6 tests)
Ya cubierto por `smoke.spec.ts`: health, login, ruta protegida 401, listado, despacho, motor. Corre en ~10 s.

## 3) bug-reproduction — repro mínima + test rojo

Para cada defecto, repro mínima (1 comando o 1 URL) y test que **falla por la razón correcta**:

### SEC-01 — forja de JWT (crítica)
- **Repro mínima (1 comando):**
  ```bash
  node qa/evidencias/forge-jwt.mjs "dev-secret-change-me" "energyai-api" attacker@evil.local
  # → Bearer <token> contra /api/v1/auth/me → 200 (esperado: 401)
  ```
- **Determinismo:** total (secreto fijo, payload fijo, sin red externa).
- **Introducing commit:** `90c9a03` (creación del proyecto; el secreto por defecto existe desde el inicio — no hubo regresión, es un defecto de diseño).
- **Test rojo→verde:** `e2e/tests/security.spec.ts › un token… NO autentica` con `test.fail()` (rojo documentado).

### DEF-02 — M-106 como ALERT
- **Repro mínima:** `POST /api/v1/meter/getById {"meter_id":"M-106"}` → `status=ALERT` (esperado `NORMAL`).
- **Introducing commit:** `90c9a03` (`StatusOf` sin usar `anomaly`/`type`).
- **Test rojo→verde:** 3 tests en `meters.spec.ts`.

### DEF-04 — hora de planta
- **Repro mínima:** abrir `/medidores/M-109` en contexto Playwright con `timezoneId: 'America/Bogota'` vs `'UTC'` → horas distintas.
- **Determinismo:** logrado con `timezoneId` fijo por contexto (equivalente a `page.clock` para TZ).
- **Test rojo→verde:** `timezone.spec.ts`.

### DEF-03 — page negativo
- **Repro mínima:** `POST /api/v1/meter/getAll {"pagination":{"page":-1,"size":10}}` → 500 (esperado 400).
- **Test rojo→verde:** `meters.spec.ts › paginación con page negativo`.

**Regla de oro aplicada:** todos los tests se escribieron en rojo (con `test.fail()`), y **revert-to-verify** queda garantizado por el propio `test.fail()`: si alguien arregla el bug sin quitar la anotación, el test empieza a fallar y obliga a retirar el `test.fail()`. Documentado en `e2e/README.md`.

## 4) qa-metrics — KPIs con fórmula

| Métrica | Fórmula | Valor |
|---|---|---|
| Cobertura de journeys críticos | journeys con E2E / total | 6/6 = **100%** |
| Tasa de flakiness | flaky / total ejecuciones | 0/27 = **0%** |
| Defect escape (pre-prod) | defectos hallados en QA / total | N/A (no hay prod) |
| Densidad de defectos | defectos / módulo | 4 funcionales + 7 seguridad |
| Passing rate | passed / total | 27/27 = **100%** (con `test.fail` esperados) |
| Duración suite E2E | — | ~10 s |
| MTTR de defects | — | N/A |

Gate de calidad propuesto: **release bloqueado si `fallos P0/P1 > 0` o `cobertura de journeys < 100%`**.

## 5) coverage-analysis — huecos de cobertura (no vanidad)

La skill advierte: no perseguir 100% de cobertura; buscar **huecos significativos**.

| Módulo | Cobertura de tests | Hueco relevante |
|---|---|---|
| `analysis/classify` | alta (go test) | borde `>=` vs `>` (OBS-01) no cubierto |
| `analysis/baseline`, `changes`, `quality`, `stats` | alta | — |
| `meter` (servicio) | media | `page<0`, búsqueda case-insensitive, `Readings` vacío |
| `auth` | alta | caso "secreto por defecto" **no cubierto** → SEC-01 |
| `httpx` | **sin tests** | validación de paginación (origen de DEF-03) |
| `server`, `store`, `dashboard`, `anomaly` | sin tests | integración |
| Frontend `format` | 11 tests | **falso verde** por `TZ=UTC` forzado → DEF-04 |

**Patrón ratchet sugerido:** fijar la cobertura actual como piso en CI y exigir que no baje.

## 6) qa-report-humanizer — tono de los reportes

Los reportes de este vault y `qa/*.md` siguen las directrices de la skill: lenguaje directo, sin relleno de IA, cada afirmación con evidencia y sin repetir "comprehensive/sí/además" porque sí. Resultado: veredicto claro ("NO liberar") en vez de un muro de adjetivos.

---

## Relación con las skills locales

| Aspecto | Skill local (ECC/Claude) | Skill externa (qa-skills) |
|---|---|---|
| Verificación de calidad | `verification-loop` | `qa-metrics`, `coverage-analysis` |
| E2E | `e2e-testing` | `playwright-automation`, `release-readiness` |
| Seguridad | `application-security-testing` | `security-testing` |
| Contexto/estrategia | — | `qa-project-context`, `test-strategy` |
| Repro de defectos | `systematic-debugging` | `bug-reproduction` |

Se complementan: las locales ejecutan la suite y verifican; las externas formalizan **contexto, go/no-go, métricas y cobertura**.

#energia #qa #skills #metricas #release
