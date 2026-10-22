# Reporte de seguridad

> Fuente completa: `qa/03_Defectos_y_Seguridad/Seguridad.md`. 7 hallazgos + 17 controles probados.

Ver también: [[05-Defectos/SEC-01 Forja de JWT con secreto por defecto]] · [[00-Inicio/Resumen ejecutivo]]

## Hallazgos
| ID | Hallazgo | Severidad | OWASP |
|---|---|---|---|
| SEC-01 | Forja de JWT con secreto por defecto | **Crítica** | A07/A02 |
| SEC-02 | Sin cabeceras de seguridad | Media | A05 |
| SEC-03 | Sin rate limiting en login | Media | A07 |
| SEC-04 | JWT en `localStorage` | Media | A07/A03 |
| SEC-05 | Secretos/credenciales por defecto | Media | A05/A07 |
| SEC-06 | Dependencias vulnerables (stdlib Go) | Media | A06 |
| SEC-07 | nginx sin cabeceras ni HTTPS | Baja | A05 |

## Controles positivos (probados y correctos)
`alg=none` → 401 · tokens malformados → 401 · login no enumera usuarios · CORS sin reflejo indebido · sin inyección SQL/NoSQL/path traversal/XSS · métodos no soportados → 404 · body >1 MB → 400 · JSON estricto → 400 · `go vet` limpio · sin `innerHTML`/`eval`.

## Evidencias
- `qa/05_Evidencias/logs/seguridad-probe.txt`
- `qa/05_Evidencias/logs/seguridad-login-enum.txt`
- `qa/05_Evidencias/logs/seguridad-govulncheck.txt`
- `qa/05_Evidencias/herramientas/forge-jwt.mjs`, `security-probe.ps1`

## Metodología
OWASP Top 10 (2021) · análisis de cabeceras · forja de tokens · fuerza bruta · inyección · path traversal · análisis estático (`go vet`) · dependencias (`govulncheck`).

#energia #qa #seguridad
