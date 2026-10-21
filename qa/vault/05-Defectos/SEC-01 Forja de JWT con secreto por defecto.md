# SEC-01 · Forja de JWT con secreto por defecto

> [!danger] Crítica · P0 · OWASP A07/A02 · CWE-798
> Bypass total de autenticación. **Bloqueante de release.**

Volver a: [[05-Defectos/Registro de defectos]] · [[06-Seguridad/Reporte de seguridad]]

## Qué pasa
El backend firma y valida JWT con el secreto por defecto público `dev-secret-change-me` (`backend/internal/config/config.go:14,55`). Cualquiera puede firmar un token válido sin credenciales.

## Reproducción
```bash
node qa/evidencias/forge-jwt.mjs "dev-secret-change-me" "energyai-api" "attacker@evil.local"
curl -s -H "Authorization: Bearer <token>" http://localhost:8080/api/v1/auth/me
```

## Resultado
- Esperado: `401`
- Obtenido: `200 {"email":"attacker@evil.local","name":"Atacante"}`
- Y `200` en `meter/getAll`, `meter/getById/M-109`, `dashboard/getSummary`, `anomaly/getAll`.

Evidencia: `qa/evidencias/seguridad-probe.txt` §2.

## Causa raíz
`config.go` pone secreto por defecto; `main.go:53-55` solo hace `slog.Warn` y **arranca igual**.

## Fix
Fail-closed si el secreto es el de defecto (fuera de dev) + secreto aleatorio ≥32 bytes + fail en CI.

## Detección automática
`e2e/tests/security.spec.ts › un token firmado con el secreto por defecto NO autentica` (`test.fail`).

#energia #qa #defecto #seguridad #critico
