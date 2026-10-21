# Plan de pruebas

> Fuente completa: `qa/01-plan-de-pruebas.md`. Esta nota es el resumen navegable.

Ver también: [[00-Inicio/Resumen ejecutivo]] · [[05-Defectos/Registro de defectos]]

## Alcance
- **Dentro:** login/autenticación, despacho, libro de medidores, detalle, anomalías, Run AI Analysis, motor de detección, contratos de API, frontend (React) y backend (Go), seguridad de superficie.
- **Fuera:** rendimiento/carga masiva, accesibilidad profunda (WCAG AAA), datos reales, multi-usuario/roles (hoy es un solo usuario), infraestructura Docker en producción.

## Análisis de riesgos (R1–R7)
| ID | Riesgo | Impacto |
|---|---|---|
| R1 | Auth/JWT mal implementado | Crítico |
| R2 | Clasificación errónea del motor (tipo → estado) | Alto |
| R3 | Hora de planta mal convertida | Alto |
| R4 | Validación de entradas / paginación | Medio |
| R5 | Consistencia API ↔ UI ↔ doc | Medio |
| R6 | Secretos/credenciales por defecto | Alto |
| R7 | Cobertura de tests que da falsa confianza | Medio |

## Técnicas
Partición de equivalencia · valores límite · tablas de decisión (motor) · pruebas negativas · consistencia entre capas · caja blanca · análisis de seguridad.

## Criterios
- **Entrada:** build levanta, login funciona, dataset cargado.
- **Salida:** todos los casos ejecutados y con estado; defectos reportados con evidencia reproducible; veredicto de liberación.

## Limitaciones reconocidas
- Sin Docker (modo dev). Una sola zona horaria del negocio pero probadas varias sintéticas.
- Daño/边界 no reproducible con el dataset actual (ver [[05-Defectos/OBS-01 Umbral mayor-vs-mayor-igual|OBS-01]]).

#energia #qa #plan
