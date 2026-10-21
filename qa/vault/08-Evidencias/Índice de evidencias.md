# Índice de evidencias

Todas las pruebas fueron **ejecutadas de verdad**; las salidas se guardan verbatim en `qa/evidencias/`.

| Archivo | Qué contiene |
|---|---|
| `api-exploracion.txt` | Exploración de la API (auth, endpoints, formato de error) |
| `ui-fechas-timezone.txt` | Captura de UI sobre fechas/horas por zona |
| `engine-inspect-json.txt` | Salida exacta del motor vía `cmd/inspect` (el oráculo) |
| `backend-server.err.log` | Log del backend (incluye el panic de DEF-03 y el `WARN` de SEC-01) |
| `e2e-run.txt` | Salida completa de la suite Playwright |
| `seguridad-probe.txt` | Batería de seguridad (SEC-01…SEC-07) |
| `seguridad-login-enum.txt` | Prueba de enumeración de usuarios en login |
| `seguridad-govulncheck.txt` | Salida de `govulncheck` (dependencias) |
| `forge-jwt.mjs` | Forjador de JWT (SEC-01) |
| `security-probe.ps1` | Script reproducible de la batería de seguridad |
| `ui-*.png` | Capturas: Despacho, Medidores, Detalle M-109, Anomalías |

> [!note] Nota sobre secretos
> El JWT real de desarrollo **no** está versionado. Las credenciales usadas son las públicas de `.env.example` (`admin@energia.local` / `admin123`).

#energia #qa #evidencias
