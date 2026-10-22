# EnergIA · Prueba Técnica QA — Entrega

> [!tip] Si vienes a leer la entrega
> El punto de entrada es el [[index|índice del vault]]. Aquí tienes el resumen, los defectos y las recomendaciones.

## Qué es esto
Prueba técnica de QA sobre **EnergIA**, una plataforma que monitorea medidores eléctricos y usa IA para detectar anomalías. Este vault documenta el trabajo completo: estrategia, ejecución, defectos, caja blanca, seguridad y automatización.

## Entregables
- `qa/01-plan-de-pruebas.md` — estrategia + resumen ejecutivo
- `qa/02-smoke.md` — suite de humo
- `qa/03-casos-caja-negra.md` — casos funcionales (UI + API)
- `qa/04-caja-blanca.md` — análisis del código y los tests
- `qa/05-defectos.md` — reporte de defectos
- `qa/03_Defectos_y_Seguridad/Seguridad.md` — pruebas de seguridad (extra)
- `e2e/` — automatización Playwright (TypeScript)
- `.github/workflows/e2e.yml` — workflow de CI

## Estado global
| Métrica | Valor |
|---|---|
| Fases completadas | 10 + seguridad |
| Tests E2E (27 passed, defectos abiertos como *expected failure*) | 27 |
| Defectos funcionales | 4 (DEF-01…DEF-04) |
| Hallazgos de seguridad | 7 (SEC-01…SEC-07) |
| ¿Liberar a producción? | **No** (ver [[00-Inicio/Resumen ejecutivo]]) |

## Enlaces
- [[00-Inicio/Mapa de la prueba (MOC)]]
- [[00-Inicio/Resumen ejecutivo]]
- [[05-Defectos/Registro de defectos]]

#energia #qa #entrega #readme
