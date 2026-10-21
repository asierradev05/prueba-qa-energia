# Suite de humo

> Fuente completa: `qa/02-smoke.md`. Resultado: **9/10 PASS, 1 FAIL**.

## Casos
| ID | Caso | Estado |
|---|---|---|
| SMK-01 | API `/health` 200 | ✅ PASS |
| SMK-02 | Login válido → token | ✅ PASS |
| SMK-03 | Credenciales inválidas → 401 | ✅ PASS |
| SMK-04 | Ruta protegida sin token → 401 | ✅ PASS |
| SMK-05 | `getAll` devuelve count=12 | ✅ PASS |
| SMK-06 | Motor coincide con el oráculo | ✅ PASS |
| SMK-07 | `getById/M-109` | ✅ PASS |
| SMK-08 | Endpoints 200 | ✅ PASS |
| SMK-09 | Validaciones 400 | ✅ PASS |
| SMK-10 | Estado de M-106 = NORMAL | ❌ FAIL |

> [!failure] SMK-10 → se convirtió en [[05-Defectos/DEF-02 FALSE_POSITIVE mostrado como ALERT|DEF-02]]
> El oráculo dice que M-106 (FALSE_POSITIVE) debe verse "Normal"; SMK-10 encontró "Alerta".

#energia #qa #humo
