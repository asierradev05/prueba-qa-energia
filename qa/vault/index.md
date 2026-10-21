# 🏠 EnergIA · Prueba Técnica QA

Vault de Obsidian con **toda** la documentación de la prueba técnica de QA sobre la plataforma EnergIA (backend Go + frontend React).

> [!info] Punto de entrada
> Empieza por [[00-Inicio/README de la entrega|README]] · luego [[00-Inicio/Resumen ejecutivo|Resumen ejecutivo]] · y el [[00-Inicio/Mapa de la prueba (MOC)|Mapa de la prueba]].

---

## 🗺️ Mapa rápido

| Fase | Nota | Entregable fuente |
|---|---|---|
| 1 · Plan de pruebas | [[01-Plan/Plan de pruebas]] | `qa/01-plan-de-pruebas.md` |
| 2 · Humo | [[02-Humo/Suite de humo]] | `qa/02-smoke.md` |
| 3 · Caja negra | [[03-Caja-Negra/Casos de caja negra]] | `qa/03-casos-caja-negra.md` |
| 4 · Caja blanca | [[04-Caja-Blanca/Caja blanca]] | `qa/04-caja-blanca.md` |
| 5 · Defectos | [[05-Defectos/Registro de defectos]] | `qa/05-defectos.md` |
| 6 · Seguridad | [[06-Seguridad/Reporte de seguridad]] | `qa/06-seguridad.md` |
| 7 · Automatización | [[07-Automatizacion/Playwright E2E]] | `e2e/` |

## 🔴 Defectos y hallazgos de un vistazo

- [[05-Defectos/SEC-01 Forja de JWT con secreto por defecto]] — **Crítica**
- [[05-Defectos/DEF-04 Hora de planta dependiente de la zona]] — Alta/P1
- [[05-Defectos/DEF-02 FALSE_POSITIVE mostrado como ALERT]] — Alta/P1
- [[05-Defectos/DEF-03 Paginación con page negativo → 500]] — Alta/P2
- [[05-Defectos/DEF-01 Búsqueda de meter_id no ignora mayúsculas]] — Media/P2
- [[06-Seguridad/Reporte de seguridad]] — 7 hallazgos (SEC-01…SEC-07)

## 🧰 Meta

- [[90-Meta/Bitácora de trabajo]] — diario de lo hecho, con comandos y resultados
- [[90-Meta/Cómo usar este vault]] — convenciones
- [[90-Meta/Uso de IA y decisiones]] — dónde y cómo se usó IA

#energia #qa #indice
