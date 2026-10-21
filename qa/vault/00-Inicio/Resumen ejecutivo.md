# Resumen ejecutivo

> [!danger] Veredicto: **NO liberar a producción**
> El build **no** debe ir a producción. Hay **1 vulnerabilidad crítica de seguridad** (bypass de autenticación) y **2 defectos P1** que alteran la decisión del operador. Son bloqueantes.

## Por qué (en una frase por hallazgo)
1. **[[05-Defectos/SEC-01 Forja de JWT con secreto por defecto|SEC-01]] (Crítica):** cualquiera puede forjar un token y leer toda la API sin credenciales. Verificado: `200 OK` con token firmado con `dev-secret-change-me`.
2. **[[05-Defectos/DEF-04 Hora de planta dependiente de la zona|DEF-04]] (P1):** las horas "Detectada" cambian con la zona del navegador; un operador en Bogotá ve `09:00` cuando la planta marcó `14:00`. Riesgo operativo real.
3. **[[05-Defectos/DEF-02 FALSE_POSITIVE mostrado como ALERT|DEF-02]] (P1):** el medidor M-106 (falso positivo, "no escalar") se muestra como **Alerta** en la API y en el dashboard → el operador escala algo que debía ignorar.

## Riesgos que quedan abiertos
- **[[06-Seguridad/Reporte de seguridad|SEC-02/03/04/05/06/07]]:** sin cabeceras de seguridad, sin rate limiting, JWT en `localStorage`, secretos por defecto, dependencias de Go con vulnerabilidades alcanzables.
- **[[04-Caja-Blanca/Caja blanca|RIESGO-W1]]:** índice `Readings[len-1]` sin comprobar lista vacía (latente).

## Qué arreglar y en qué orden
1. **P0 — SEC-01:** fail-closed con secreto por defecto + secreto real. *Bloqueante.*
2. **P1 — DEF-02 y DEF-04.**
3. **P2 — DEF-03, DEF-01, SEC-02/03/04/05/06.**

## Qué está bien
Login uniforme (no enumera usuarios), validación estricta de JSON, límite de body, CORS correcto, sin inyección SQL/XSS, `alg=none` rechazado, `go vet` limpio. Detalle en [[06-Seguridad/Reporte de seguridad]].

---
Volver a: [[index|Índice]] · [[00-Inicio/Mapa de la prueba (MOC)|Mapa]] · [[05-Defectos/Registro de defectos|Defectos]]

#energia #qa #resumen #veredicto
