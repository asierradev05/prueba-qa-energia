# Pruebas End-to-End · EnergIA

Suite de [Playwright](https://playwright.dev) + TypeScript que cubre los flujos críticos del operador y **demuestra** los defectos confirmados en `qa/05-defectos.md`.

## Requisitos

- Node.js 18+ y pnpm.
- El sistema levantado en modo dev (ver `README.md` de la raíz):
  - Backend: `go run ./cmd/api` → `http://localhost:8080`
  - Frontend: `pnpm dev` → `http://localhost:5173`
- Variables de entorno opcionales: `E2E_BASE_URL`, `E2E_API_URL` (por defecto los anteriores).

## Instalación y ejecución

Un solo comando tras instalar (una vez):

```bash
cd e2e
pnpm install && pnpm exec playwright install chromium && pnpm test
```

Si ya instalaste dependencias y navegador, basta `pnpm test`.

Otros comandos:

```bash
pnpm test:headed   # ver el navegador
pnpm test:ui       # modo interfaz
pnpm report        # abre el reporte HTML
```

## Cómo está organizada

```
tests/
  auth.setup.ts        # login una vez → playwright/.auth/user.json (storageState)
  fixtures/pages.ts    # fixtures con Page Objects
  helpers/auth.ts      # utilidades de login por API / siembra de token
  pages/
    LoginPage.ts       # pantalla de acceso
    DispatchPage.ts    # despacho (órdenes priorizadas)
    MetersPage.ts      # libro de medidores (listado, búsqueda, filtros)
  api.spec.ts          # contratos de API con el request de Playwright
  security.spec.ts     # regresiones de seguridad (SEC-01/02/03 y controles)
  smoke.spec.ts        # disponibilidad y flujo mínimo
  meters.spec.ts       # libro de medidores + API (negocio y regresión)
  timezone.spec.ts     # hora de planta independiente de la zona (DEF-04)
```

## Convenciones

- **TypeScript** estricto, **locators semánticos** (`getByRole`, `getByLabel`, `getByText`), sin CSS frágil.
- **Sin `waitForTimeout`**: se usan aserciones *web-first* (`toBeVisible`, `toContainText`, `toHaveURL`).
- **Login reutilizable**: el proyecto `setup` inicia sesión por UI una sola vez y guarda `storageState`; el resto de tests lo heredan. Los casos de login vacían el storageState con `test.use({ storageState: { cookies: [], origins: [] } })`.
- **Page Objects + fixtures** (`tests/pages`, `tests/fixtures/pages.ts`): los tests no construyen locators a mano.
- La zona horaria del navegador se fija en `America/Bogota` (`playwright.config.ts`) por ser la del negocio.
- `test.fail()` se usa **solo** cuando el fallo se explica por un defecto ya confirmado; cada uno lleva anotado su ID de defecto. Cuando el defecto se corrija, el test pasará a fallar (`test.fail` detecta el paso inesperado) y deberá quitarse la anotación.

## Defectos cubiertos por la suite

| Defecto | Test |
|---|---|
| DEF-01 (búsqueda no ignora mayúsculas) | `meters.spec.ts › búsqueda por id no ignora mayúsculas` |
| DEF-02 (FALSE_POSITIVE mostrado como ALERT) | `meters.spec.ts › fila M-106…`, `…estado de M-106…`, `…resumen del dashboard…` |
| DEF-03 (page negativo → 500) | `meters.spec.ts › paginación con page negativo responde 400` |
| DEF-04 (hora de planta dependiente de la zona) | `timezone.spec.ts › el instante "Detectada" no depende de la zona` |
| SEC-01 (forja de JWT con secreto por defecto) | `security.spec.ts › un token firmado con el secreto por defecto NO autentica` |
| SEC-02 (sin cabeceras de seguridad) | `security.spec.ts › las respuestas incluyen cabeceras de seguridad` |
| SEC-03 (sin rate limiting en login) | `security.spec.ts › el login aplica rate limiting` |

Detalle completo de seguridad en `qa/06-seguridad.md`.

## Interpretación del resultado

Con los defectos presentes, los tests marcados con `test.fail()` **pasan** (porque se espera que fallen) y el resto pasa. Al corregir los defectos, esos tests **fallarán** a propósito, señalando que hay que retirarles la anotación `test.fail`.
