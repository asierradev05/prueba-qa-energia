# Registro de defectos

> Fuente completa: `qa/05-defectos.md`. Ver también [[06-Seguridad/Reporte de seguridad]].

## Defectos funcionales
- [[05-Defectos/DEF-01 Búsqueda de meter_id no ignora mayúsculas]] — Media / P2
- [[05-Defectos/DEF-02 FALSE_POSITIVE mostrado como ALERT]] — Alta / P1
- [[05-Defectos/DEF-03 Paginación con page negativo → 500]] — Alta / P2
- [[05-Defectos/DEF-04 Hora de planta dependiente de la zona]] — Alta / P1

## Hallazgos de seguridad
- [[05-Defectos/SEC-01 Forja de JWT con secreto por defecto]] — **Crítica** / P0
- SEC-02…SEC-07 → [[06-Seguridad/Reporte de seguridad]]

## Observaciones / riesgos
- [[05-Defectos/OBS-01 Umbral mayor-vs-mayor-igual]]
- [[05-Defectos/RIESGO-W1 Readings vacío]]

## Matriz
| ID | Título | Severidad | Prioridad | Estado |
|---|---|---|---|---|
| SEC-01 | Forja de JWT | Crítica | P0 | Confirmado |
| DEF-04 | Hora de planta | Alta | P1 | Confirmado |
| DEF-02 | M-106 como ALERT | Alta | P1 | Confirmado |
| DEF-03 | page negativo → 500 | Alta | P2 | Confirmado |
| DEF-01 | búsqueda case-sensitive | Media | P2 | Confirmado |
| OBS-01 | umbral `>=` vs doc | Baja | P3 | No reproducible |
| RIESGO-W1 | `Readings[len-1]` | Baja | P3 | Latente |

#energia #qa #defectos #indice
