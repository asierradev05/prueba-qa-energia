# 06 · Pruebas de seguridad de alto nivel · EnergIA

> Complemento del reporte funcional. Aquí se documenta la **revisión de seguridad** de la API y el frontend: qué se probó, qué se encontró y cómo se verifica. Todo lo aquí reportado fue **reproducido por ejecución real** contra el backend en `http://localhost:8080` (modo dev, commit base `15765d9`).
>
> Alcance: análisis de seguridad ofensivo/defensivo sobre el MVP. **No sustituye** una auditoría formal ni una prueba de penetración completa; se hizo sin herramientas comerciales (sin Burp/Nessus) y sin autenticación destructiva.

## 0. Entorno y metodología

- **Entorno:** Windows 11, PowerShell 5.1, Go 1.27.0, Node v25.9.0, backend `go run ./cmd/api` (:8080), frontend `pnpm dev` (:5173).
- **Config:** `.env` copiado de `.env.example` (valores por defecto). `JWT_SECRET=dev-secret-change-me`, `AUTH_PASSWORD=admin123`.
- **Técnicas aplicadas:** OWASP Top 10 (2021), análisis de cabeceras, forja de tokens, fuerza bruta, inyección, path traversal, validación de entrada, análisis estático (`go vet`, revisión de código) y de dependencias (`govulncheck`).
- **Evidencias:** `qa/evidencias/logs/seguridad-probe.txt`, `seguridad-login-enum.txt`, `seguridad-govulncheck.txt`, `forge-jwt.mjs`, `security-probe.ps1`.
- **Regla de compromiso:** solo lectura sobre los datos; ninguna prueba destruye información. La forja de token es no destructiva (el usuario final no existe en el sistema, que es de un solo usuario).

## 1. Resumen ejecutivo de seguridad

| # | Hallazgo | Severidad | OWASP 2021 | Estado |
|---|---|---|---|---|
| **SEC-01** | Forja de JWT con el secreto por defecto → bypass total de autenticación | **Crítica** | A07 / A02 | Confirmado por ejecución |
| **SEC-02** | Sin cabeceras de seguridad HTTP (CSP, X-Content-Type-Options, X-Frame-Options, HSTS…) | **Media** | A05 | Confirmado por ejecución |
| **SEC-03** | Sin rate limiting en `/auth/login` → fuerza bruta viable | **Media** | A07 | Confirmado por ejecución |
| **SEC-04** | JWT almacenado en `localStorage` (expuesto a XSS) | **Media** | A07 / A03 | Confirmado por código |
| **SEC-05** | Credenciales y secreto por defecto en `.env.example` / valores por defecto del código | **Media** | A05 / A07 | Confirmado por código/config |
| **SEC-06** | Dependencias con vulnerabilidades conocidas (stdlib de Go) | **Media** | A06 | Confirmado por `govulncheck` |
| **SEC-07** | Ausencia de cabeceras de seguridad y HTTPS en `nginx.conf` | **Baja** | A05 | Confirmado por código |

**Controles positivos** (probados y correctos): `alg=none` y tokens malformados rechazados (401); validación estricta de JSON; límite de tamaño de body (1 MB); mensaje de login uniforme (no enumera usuarios); CORS sin reflejo de orígenes no permitidos; sin inyección SQL/NoSQL/path traversal; métodos HTTP no soportados rechazados; `go vet` limpio; sin `dangerouslySetInnerHTML`/`eval` en el frontend.

---

## SEC-01 · Forja de JWT con el secreto por defecto (CRÍTICA)

**Título:** Un atacante puede firmar un JWT válido porque el backend usa el secreto por defecto público `dev-secret-change-me`, obteniendo acceso total a la API.

**Severidad:** Crítica · **Prioridad:** P0
**Categoría:** A07:2021 Identification and Authentication Failures · A02:2021 Cryptographic Failures (CWE-798: Use of Hard-coded Credentials).

### Descripción
El backend arranca con `JWT_SECRET` por defecto si no se define uno. Ese valor (`dev-secret-change-me`) está en el código fuente (`backend/internal/config/config.go:14`) y en `.env.example`. Cualquiera que conozca ese valor puede **firmar tokens válidos** sin credenciales, porque `ParseToken` valida con el mismo secreto con el que se firman (`backend/internal/auth/service.go:98`).

El código **avisa** del problema pero **no lo impide**:
```go
// backend/cmd/api/main.go:53-55
if cfg.JWTSecret == config.DefaultJWTSecret {
    slog.Warn("usando el JWT_SECRET de desarrollo: defínelo en producción")
}
```
La advertencia aparece en el log (evidencia: `evidencias/backend-server.err.log:1`) y el servidor continúa arrancando.

### Pasos para reproducir
1. Generar un JWT HS256 con `sub` arbitrario, `iss=energyai-api` y firma con `dev-secret-change-me`:
   ```bash
   node qa/evidencias/herramientas/forge-jwt.mjs "dev-secret-change-me" "energyai-api" "attacker@evil.local"
   ```
2. Usarlo contra `GET /api/v1/auth/me`:
   ```bash
   curl -s -H "Authorization: Bearer <token_forjado>" http://localhost:8080/api/v1/auth/me
   ```

### Resultado esperado vs obtenido
- **Esperado (sentido común + README “Cámbialo fuera de local”):** el token forjado debe ser **rechazado con 401**.
- **Obtenido:** `200 OK` con `{"email":"attacker@evil.local","name":"Atacante"}`. Con el mismo token, **todos** los endpoints protegidos responden **200**: `meter/getAll`, `meter/getById/M-109`, `dashboard/getSummary`, `anomaly/getAll`.

```
=== 2. Forja de JWT con el secreto por defecto (dev-secret-change-me) ===
GET /auth/me con token forjado -> 200
cuerpo: {"email":"attacker@evil.local","name":"Atacante"}
```
Y con el token forjado:
```
POST /api/v1/meter/getAll        -> 200 (2094 bytes)
GET  /api/v1/meter/getById/M-109 -> 200 (50909 bytes)
GET  /api/v1/dashboard/getSummary-> 200 (2523 bytes)
GET  /api/v1/anomaly/getAll      -> 200 (8136 bytes)
```

### Impacto
Compromiso total: lectura de inventario de medidores, lecturas horarias, anomalías y resumen del dashboard **sin credenciales**. En un despliegue real, este único fallo anula el login. Escalada a escritura si se añaden endpoints mutadores (hoy solo hay uno: `POST /ai/analyze`).

### Causa raíz
`JWT_SECRET` con valor por defecto público (`config.go:14,55`) + ausencia de **fail-closed** al arrancar. El `Warn` no protege.

### Remediación propuesta
1. **Fail-closed:** si `JWT_SECRET` está vacío o es el valor por defecto **y** el entorno no es explícitamente de desarrollo, **abortar el arranque** (no solo `Warn`).
   ```go
   if cfg.JWTSecret == config.DefaultJWTSecret && cfg.Env != "dev" {
       return errors.New("JWT_SECRET no configurado: defínelo antes de arrancar")
   }
   ```
2. Exigir un secreto con entropía mínima (p. ej. ≥ 32 bytes aleatorios) y rotarlo.
3. En `docker-compose.yml`, generar el secreto en el despliegue (no dejarlo al valor por defecto).
4. Considerar `RS256` (clave pública/privada) para no compartir el material de firma con los validadores.

### Detección automatizada
- **Test de regresión (añadido):** `e2e/tests/security.spec.ts` verifica que un token firmado con el secreto por defecto **no** autentica. Hoy se marca como defecto (falla) y pasará cuando se use un secreto real en CI.
- **CI:** `govulncheck` + un guard “no arrancar con secreto por defecto”.

---

## SEC-02 · Ausencia de cabeceras de seguridad HTTP (MEDIA)

**Título:** Las respuestas de la API no incluyen cabeceras de seguridad (CSP, `X-Content-Type-Options`, `X-Frame-Options`, `Strict-Transport-Security`, `Referrer-Policy`, `Permissions-Policy`).

**Severidad:** Media · **Prioridad:** P2 · **Categoría:** A05:2021 Security Misconfiguration (CWE-693).

### Pasos y evidencia
`GET /health` no devuelve ninguna cabecera de seguridad:
```
AUSENTE   Content-Security-Policy
AUSENTE   X-Content-Type-Options
AUSENTE   X-Frame-Options
AUSENTE   Strict-Transport-Security
AUSENTE   Referrer-Policy
AUSENTE   Permissions-Policy
```
(evidencia: `qa/evidencias/logs/seguridad-probe.txt`, §1)

### Impacto
Sin `X-Content-Type-Options: nosniff` hay riesgo de *MIME sniffing*; sin `X-Frame-Options`/`frame-ancestors`, *clickjacking*; sin CSP, mayor superficie si algún día entra contenido inyectable.

### Remediación
Añadir un middleware `SecurityHeaders` en la cadena (`backend/internal/httpx/middleware.go`), junto a `Recover`/`Logger`/`CORS`:
```go
h.Set("X-Content-Type-Options", "nosniff")
h.Set("X-Frame-Options", "DENY")
h.Set("Referrer-Policy", "no-referrer")
h.Set("Content-Security-Policy", "default-src 'none'; frame-ancestors 'none'")
// HSTS solo cuando se sirva por HTTPS:
// h.Set("Strict-Transport-Security", "max-age=63072000; includeSubDomains")
```
Y lo mismo en `frontend/nginx.conf` (`add_header ... always;`) para el HTML/asset.

---

## SEC-03 · Sin rate limiting en el login (MEDIA)

**Título:** No hay límite de intentos en `POST /auth/login`; es viable la fuerza bruta de credenciales.

**Severidad:** Media · **Prioridad:** P2 · **Categoría:** A07 (CWE-307).

### Pasos y evidencia
20 intentos fallidos consecutivos devuelven siempre `401`, **nunca `429`**:
```
=== 5. Rate limiting / fuerza bruta en /auth/login (20 intentos) ===
statuses: 401x20  (si no hay 429, no hay rate limiting)
```
(evidencia: `qa/evidencias/logs/seguridad-probe.txt`, §5)

### Agravante
El usuario y la contraseña por defecto son conocidos (`admin@energia.local` / `admin123`) y están en `.env.example`. Con fuerza bruta no hace falta siquiera adivinar.

### Impacto
Un atacante puede probar diccionarios de contraseñas sin freno. Mitigado parcialmente por bcrypt (coste default) pero no bloqueado.

### Remediación
- Middleware de rate limiting por IP + por cuenta (p. ej. token bucket; `golang.org/x/time/rate` o un limiter propio) aplicado a `/auth/login`.
- Backoff exponencial y bloqueo temporal tras N fallos.
- Alertas en el log ante ráfagas de 401.

---

## SEC-04 · JWT en localStorage (MEDIA)

**Título:** El token se guarda en `localStorage`, legible por cualquier script; un XSS exfiltra la sesión.

**Severidad:** Media · **Prioridad:** P2 · **Categoría:** A07 / A03 (CWE-522).

### Evidencia (código)
`frontend/src/lib/token-storage.ts` usa `localStorage` (`energyai.token`) y `api-client.ts:15-18` lo inyecta en cada request. Diagnóstico: hoy **no** hay `dangerouslySetInnerHTML`/`eval`/`innerHTML` en `frontend/src` (verificado por búsqueda), así que no hay vector XSS conocido — pero `localStorage` elimina la defensa en profundidad.

### Remediación
- Preferir cookie `HttpOnly; Secure; SameSite=Strict` gestionada por el backend (requiere cambiar el flujo de login a set-cookie y protección CSRF).
- Si se mantiene el Bearer en memoria, reducir la ventana: no persistir en `localStorage`, o usar `sessionStorage` + CSP estricta.
- Endurecer la CSP para que un XSS no pueda exfiltrar (SEC-02).

---

## SEC-05 · Secretos y credenciales por defecto (MEDIA)

**Título:** `.env.example` y los valores por defecto del código distribuyen `JWT_SECRET=dev-secret-change-me` y `AUTH_PASSWORD=admin123`.

**Severidad:** Media · **Prioridad:** P2 · **Categoría:** A05 / A07 (CWE-1188: Insecure Default).

### Evidencia
- `backend/internal/config/config.go:14,55,58` — por defecto secreto y contraseña.
- `.env.example` — mismas credenciales, con comentarios `Cámbialo fuera de local`.
- `.env` local efectivamente usa esos valores.

### Impacto
Se combina con SEC-01 y SEC-03: un despliegue “rápido” queda con credenciales públicas y secreto forjable.

### Remediación
- `.env.example` sin valores válidos (`JWT_SECRET=` vacío, `AUTH_PASSWORD=` vacío) y `docker-compose` que **exija** que estén definidos.
- Documentar/forzar cambio en el primer arranque de producción.
- No loguear valores de configuración sensibles.

---

## SEC-06 · Dependencias vulnerables (MEDIA)

**Título:** `govulncheck` reporta 10 vulnerabilidades **alcanzables** en la biblioteca estándar de Go (más 2 en paquetes importados y 3 en módulos no llamados).

**Severidad:** Media · **Prioridad:** P2 · **Categoría:** A06:2021 Vulnerable and Outdated Components.

### Evidencia
`qa/evidencias/logs/seguridad-govulncheck.txt` (resumen final):
```
Your code is affected by 10 vulnerabilities from the Go standard library.
This scan also found 2 vulnerabilities in packages you import and 3
vulnerabilities in modules you require, but your code doesn't appear to call
these vulnerabilities.
```
Ejemplos alcanzables: `GO-2026-6809` (crypto/x509), `GO-2026-6617` (HTTP/2 HPACK race → crash del servidor), `GO-2026-6613` (desincronización HTTP/1), `GO-2026-6603` (agotamiento de memoria HTTP/2), `GO-2026-6608` (MIME). Todas **corregidas en Go 1.27.2/1.27.3**.

**Matiz importante:** son vulnerabilidades de la **versión del runtime de Go**, no del código de la aplicación. Se resuelven actualizando el toolchain y la imagen base.

### Remediación
- Compilar con **Go ≥ 1.27.3** (subir `go.mod` y la imagen Docker a la última 1.27.x/1.28).
- Añadir `govulncheck` al CI como puerta (falla si hay vulnerabilidades alcanzables).
- `pnpm audit` en el frontend (revisar en cada actualización de dependencias).

---

## SEC-07 · nginx sin cabeceras de seguridad ni HTTPS (BAJA)

**Título:** `frontend/nginx.conf` sirve la SPA sin cabeceras de seguridad ni redirección a HTTPS.

**Severidad:** Baja · **Prioridad:** P3 · **Categoría:** A05.

### Evidencia (código)
`frontend/nginx.conf:1-26` — `add_header` solo para caché de assets; sin CSP/X-Frame-Options/HSTS. No hay término TLS (se asume un proxy delante).

### Remediación
- `add_header` de seguridad con `always`; terminar TLS y `HSTS` en el proxy/ingress; `server_tokens off;`.

---

## 2. Matriz de pruebas de seguridad ejecutadas

| Prueba | Resultado | Evidencia |
|---|---|---|
| Forja de JWT (secreto por defecto) | **VULNERABLE (200)** | `seguridad-probe.txt` §2 |
| JWT `alg=none` | Correcto (401) | §3 |
| Tokens malformados / sin firma | Correcto (401) | §4 |
| Rate limiting en login (20×) | **VULNERABLE (sin 429)** | §5 |
| CORS origen no permitido | Correcto (sin ACAO) | §6 |
| CORS origen permitido | Correcto (refleja el permitido) | §6 |
| Enumeración de usuarios en login | Correcto (mismo 401/mensaje) | `seguridad-login-enum.txt` |
| Inyección SQL/NoSQL en `meter_id` | Correcto (sin efecto, count=0) | §8 |
| Path traversal en `getById` | Correcto (404) | §8 |
| XSS en `getById` | Correcto (404) | §8 |
| Métodos HTTP no soportados | Correcto (404) | §9 |
| Límite de body (~2 MB) | Correcto (400) | §10 |
| JSON con campos desconocidos | Correcto (400) | §11 |
| Rutas protegidas sin token | Correcto (401) | §12 |
| Cabeceras de seguridad | **AUSENTES** | §1 |
| Análisis estático `go vet` | Limpio (exit 0) | run en sesión |
| XSS en frontend (`innerHTML`/`eval`) | No encontrado | búsqueda en `frontend/src` |
| Dependencias (`govulncheck`) | 10 alcanzables (stdlib) | `seguridad-govulncheck.txt` |

## 3. Recomendaciones priorizadas

1. **P0 — SEC-01:** fail-closed con secreto por defecto + secreto real en despliegue. **Bloqueante.**
2. **P2 — SEC-05/SEC-03:** quitar credenciales de `.env.example`, exigirlas en compose, rate limiting en login.
3. **P2 — SEC-02/SEC-07:** middleware de cabeceras de seguridad en back y front.
4. **P2 — SEC-06:** actualizar Go a ≥ 1.27.3 y `govulncheck` en CI.
5. **P2 — SEC-04:** sacar el JWT de `localStorage` (cookie HttpOnly) o CSP estricta.

## 4. Cómo se automatiza

- `e2e/tests/security.spec.ts`: regresiones de seguridad (token forjado rechazado, `alg=none`, sin cabeceras → documented, etc.).
- `qa/evidencias/herramientas/security-probe.ps1`: batería reproducible de extremo a extremo (este reporte).
- `.github/workflows/e2e.yml`: puerta de CI; se propone añadir `govulncheck` y un guard de secreto.

---

### Nota sobre uso de IA
La batería `security-probe.ps1` y el forjador `forge-jwt.mjs` se escribieron con asistencia de IA como acelerador; **todas** las salidas aquí citadas provienen de ejecución real contra el backend local, capturadas verbatim en `qa/evidencias/`. No se incluyó ningún hallazgo no reproducido.
