# Automatización E2E

La suite de automatización con **Playwright + TypeScript** se encuentra en la raíz del repositorio:

- **Ubicación:** [`../../e2e/`](../../e2e/)
- **Guía de ejecución:** [`../../e2e/README.md`](../../e2e/README.md)
- **Resultado:** **27 tests passed**
- **Incluye:** Page Objects + fixtures, `storageState`, tests de API, regresiones de defectos con `test.fail()`, CI en GitHub Actions

Para ejecutar:
```bash
cd e2e
pnpm install && pnpm exec playwright install chromium && pnpm test
```
