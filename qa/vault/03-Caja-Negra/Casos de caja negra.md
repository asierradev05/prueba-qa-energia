# Casos de caja negra

> Fuente completa: `qa/03-casos-caja-negra.md`. **42 casos ejecutados · 35 PASS · 5 FAIL** (4 defectos).

## Técnicas aplicadas
- **Partición de equivalencia / valores límite:** paginación (`page`, `size`), login, filtros.
- **Tabla de decisión:** reglas del motor (tipo → estado, severidad, prioridad).
- **Pruebas negativas:** entradas inválidas, tipos equivocados, campos desconocidos.
- **Consistencia entre capas:** API ↔ UI ↔ documentación.

## Cobertura por área
| Área | Casos | Highlights |
|---|---|---|
| Login/contratos | 12 | 401/400, formato de error uniforme |
| Paginación | 6 | límites de `page`/`size` → **DEF-03** |
| Filtros/búsqueda | 8 | case-insensitive → **DEF-01** |
| Motor/clasificación | 10 | M-106 tipo→estado → **DEF-02** |
| Fechas/hora | 6 | hora de planta → **DEF-04** |

## Formato de error uniforme (confirmado)
```json
{ "status_code": 400, "message": "...", "errors": [], "timestamp": "...", "path": "..." }
```

## Defectos derivados
- [[05-Defectos/DEF-01 Búsqueda de meter_id no ignora mayúsculas|DEF-01]]
- [[05-Defectos/DEF-02 FALSE_POSITIVE mostrado como ALERT|DEF-02]]
- [[05-Defectos/DEF-03 Paginación con page negativo → 500|DEF-03]]
- [[05-Defectos/DEF-04 Hora de planta dependiente de la zona|DEF-04]]

#energia #qa #caja-negra
