# 09 · Verificación por skills de QA

> Resultado de ejecutar las skills de QA disponibles en ECC / superpowers / Claude sobre esta prueba. Cierra el ciclo "verificar antes de declarar terminado".

Skills aplicadas: `verification-loop` · `e2e-testing` · `browser-qa` · `ai-regression-testing` · `production-audit` (esta última en `qa/08-produccion-readiness.md`).

---

## A) verification-loop — gate de calidad

| Fase | Comando | Resultado |
|---|---|---|
| 1. Build | `go build ./...` | ✅ PASS (exit 0) |
| 2. Tipos | `pnpm typecheck` (`tsc -b`) | ✅ PASS (exit 0) |
| 3. Lint | `pnpm lint` (`eslint .`) | ✅ PASS (exit 0) |
| 4. Tests | `go test ./...` · `pnpm test` · `pnpm test` (e2e) | ✅ PASS (backend OK · 11/11 · **27 passed**) |
| 5. Secretos | búsqueda de `secret/api_key/password/token` en código y tests | ✅ PASS — solo valores por defecto públicos documentados; JWT no versionado |
| 6. Diff | `git status --short` · `git diff --stat -- backend frontend` | ✅ PASS — **0 cambios** en código de producción |

```
VERIFICATION REPORT
===================
Build:     PASS
Types:     PASS (0 errores)
Lint:      PASS (0 warnings)
Tests:     PASS (backend OK, frontend 11/11, e2e 27/27)
Security:  PASS (sin secretos embebidos)
Diff:      5 archivos de entrega (qa/, e2e/, .github/) — backend/frontend intactos

Overall:   READY (trabajo de QA), con hallazgos de producto reportados
```

Extra comprobado: sin `console.log`/`debugger` en la suite; sin `node_modules`, `playwright-report`, `test-results` ni `.env` real versionados (493 archivos rastreados).

## B) e2e-testing — calidad de la suite Playwright

| Patrón de la skill | En la suite | Estado |
|---|---|---|
| Page Object Model | `tests/pages/{LoginPage,DispatchPage,MetersPage}.ts` | ✅ |
| Fixtures | `tests/fixtures/pages.ts` | ✅ |
| storageState / auth una vez | `tests/auth.setup.ts` + proyecto `setup` | ✅ |
| Reporter HTML + trazas/video en fallo | `playwright.config.ts` | ✅ |
| `webServer` / arranque controlado | proyectos `setup`+`chromium` dependientes | ✅ |
| Sin `waitForTimeout` (auto-wait) | revisado | ✅ |
| CI/CD con `upload-artifact` | `.github/workflows/e2e.yml` | ✅ |
| Test de fallo esperado → cuarentena explícita | `test.fail()` solo para defectos confirmados | ✅ |

**Mejora recomendada de la skill no aplicada (deliberada):** `test.fixme`/`test.skip` para flakiness — no aplica: la suite es determinista (27/27 estable) y los fallos son **defectos reales**, no flakiness, por eso van como `test.fail()`.

## C) browser-qa — verificación visual e interacción

Ejecutado vía Playwright (equivalente al browser MCP que propone la skill):

| Fase | Qué se verificó | Resultado |
|---|---|---|
| Smoke | navegación, 0 errores de consola críticos, rutas 200, capturas desktop | ✅ |
| Interacción | login, navegación, búsqueda, filtros, paginación, detalle | ✅ (con defectos DEF-01/03 documentados) |
| Visual | 4 capturas clave (`ui-Despacho`, `ui-Medidores`, `ui-detalle-M109`, `ui-anomalias`) | ✅ sin baseline versionado → veredicto **INCONCLUSIVE** para regresión visual (no hay baseline) |
| Accesibilidad | no se corrió axe-core (fuera de alcance) | ⏭️ no ejecutado |

> La skill es explícita: sin baseline no se declara PASS visual silencioso. Por eso queda **INCONCLUSIVE**, no "ok".

**Veredicto browser-qa: DO NOT SHIP** (coincide con el resto: hay defectos P1 + SEC-01 crítica).

## D) ai-regression-testing — cubrir el sesgo "mismo modelo escribe y revisa"

La skill advierte que cuando un mismo modelo escribe y revisa, arrastra los mismos supuestos. Mitigación aplicada: **tests mecánicos que no dependen del juicio del modelo**.

| Patrón de regresión IA | ¿Presente en el proyecto? | Test que lo cubre |
|---|---|---|
| Mismatch entre caminos (sandbox/prod) | No aplica (sin sandbox/prod dual) | — |
| Omisión de campo en la respuesta | **Sí (DEF-02)**: el estado no usa `anomaly`/`type` | `meters.spec.ts` (3 tests `test.fail`) |
| Fuga de estado / inconsistencia de forma | Contrato de error uniforme | `api.spec.ts` |
| Borde no validado (índice/entrada) | **Sí (DEF-03 / RIESGO-W1)** | `meters.spec.ts` + observación |
| Supuesto de zona horaria oculto por el entorno de test | **Sí (DEF-04)**: `vite.config.ts:33` fuerza UTC y oculta el bug | `timezone.spec.ts` |

> El caso DEF-04 es exactamente el patrón de la skill: el test unitario pasaba en falso por un supuesto del entorno. El test E2E abre contextos en **UTC y Bogotá** y lo destapa.

## Conclusión

- **Gate de verificación (A): PASS** — el trabajo de QA está completo y es reproducible.
- **Readiness de producto (D/B/C): NO SHIP** — bloquean SEC-01 (crítica), SEC-05, deps y DEF-02/DEF-04.
- Coherente con `qa/05-defectos.md`, `qa/06-seguridad.md`, `qa/08-produccion-readiness.md` y el resumen ejecutivo.

#energia #qa #verificacion #skills
