# Guion del video de entrega

Guía para grabar el video de presentación de la prueba técnica de QA de **EnergIA**.
Duración objetivo: **5-7 minutos**. Todo lo que se menciona aquí ya está en el repositorio.

> Apoyo visual: abre `qa/guion-video-flujo.html` (los 6 bloques) junto a
> `qa/entregables-prueba-qa.html` (mapa de entregables) y
> `qa/arquitectura-energia.html` (cómo está construido el sistema).

## Antes de grabar (5 min de preparación)

1. **Arranca la app** (dos terminales, sin Docker):
   - Backend: `cd backend` y `go run ./cmd/api` → API en `http://localhost:8080`.
   - Frontend: `cd frontend` y `pnpm dev` → app en `http://localhost:5173`.
   - Login: `admin@energia.local` / `admin123`.
2. **Ten abiertos** en el navegador: la app, y en el repo los archivos `qa/RESUMEN.md`,
   `qa/explainer-entrega-qa.html` y `qa/05-defectos.md`.
3. **Ten una terminal a mano** en `e2e/` para la demo de tests (paso 4).
4. **Cierra ruido**: notificaciones, pestañas y apps que no uses. Ventana a 1080p o más.

Consejo de grabación: graba por **bloques** (uno por cada paso de abajo) y únelos;
es más fácil repetir un bloque que todo el video.

---

## Bloque 0 — Intro (30 s)

**Muestra:** tu cara o el repo abierto en la raíz (`README.md`).

**Di algo así:**
> "Hola, soy [tu nombre]. Este video recorre la prueba técnica de QA que hice sobre
> EnergIA, una plataforma que monitorea medidores eléctricos y prioriza anomalías con IA.
> En 6 minutos te muestro cómo lo probé, qué encontré y por qué mi veredicto es
> **no liberar todavía**. Todo está en el repo y no modifiqué ni una línea de código de
> producción."

---

## Bloque 1 — Panorama (60 s)

**Muestra:** `qa/RESUMEN.md` y, si quieres, `qa/explainer-entrega-qa.html`.

**Di algo así:**
> "Empecemos por el resultado. Hice pruebas de caja negra, caja blanca, automatización y
> seguridad. Encontré **4 defectos** —dos de severidad alta— y **7 hallazgos de seguridad**,
> uno crítico. La suite de automatización tiene **27 tests en verde**. El resumen ejecutivo
> está en `qa/RESUMEN.md`; este explainer es una versión visual del mismo."

**La idea:** que en 1 minuto el evaluador sepa el resultado y dónde profundizar.

---

## Bloque 2 — Pruebas (90 s)

**Muestra:** `qa/01-plan-de-pruebas.md`, `qa/02-smoke.md`, `qa/03-casos-caja-negra.md`,
`qa/04-caja-blanca.md` y la carpeta `qa/evidencias/`.

**Di algo así:**
> "Este es el plan: definí alcance, estrategia y riesgos en `01-plan-de-pruebas.md`.
> Primero un **smoke test**: 9 de 10 rutas respondieron bien. Luego **42 casos de caja negra**
> cubriendo login, listado, filtros, detalle, anomalías y orden. Después **caja blanca**:
> revisé 4 módulos por dentro —el motor de análisis, el store, el paginado y el formateo—
> y comparé lo que dice el código con lo que hace la interfaz. Las capturas y las
> peticiones/respuestas están en `qa/evidencias/`."

**La idea:** demostrar método (plan → smoke → caja negra → caja blanca), no improvisación.

---

## Bloque 3 — Hallazgos (120 s) · el más importante

**Muestra:** `qa/05-defectos.md` (defecto por defecto) y luego `qa/06-seguridad.md`.
Opcional: reproduce DEF-02 en la app si tienes el dato a mano.

**Di algo así (recorre los 4 defectos):**
> "Aquí está el corazón de la entrega: los defectos. Los dos más graves son P1.
>
> - **DEF-02**: la clasificación de eventos tiene un error en `backend/internal/meter/enums.go`:
>   ciertos códigos no caen en la categoría correcta, así que un operador puede ver un evento
>   mal etiquetado.
> - **DEF-04**: el formato de fecha en `frontend/src/lib/format.ts` muestra mal el día en
>   algunos casos —el clásico problema de zona horaria— y como la zona de negocio es
>   `America/Bogota`, el operador lee una fecha que no es.
>
> Los otros dos son P2: **DEF-03** (el paginado pierde/duplica un registro en el borde) y
> **DEF-01** (un caso de borde en el servicio de medidores). Cada defecto trae su severidad,
> su evidencia y el archivo:línea del código.
>
> En seguridad encontré **SEC-01, crítica**: si no se define `JWT_SECRET` en el entorno, el
> backend arranca con el secreto de desarrollo, y cualquiera podría firmar un token válido.
> Los otros hallazgos y los 17 controles que evalué están en `06-seguridad.md`."

**La idea:** este bloque justifica el veredicto. No lo aceleres.

---

## Bloque 4 — Automatización (90 s) · demo en vivo

**Muestra:** la terminal en `e2e/` corriendo la suite; luego abre `e2e/README.md` y
`.github/workflows/e2e.yml`.

**Di algo así:**
> "Para que esto no se rompa hacia atrás, automaticé la parte crítica con Playwright."
> *(ejecuta: `pnpm test`)*
> "Son **27 tests en verde**: login, API, seguridad, smoke, medidores y zona horaria.
> Escribí los tests en TypeScript estricto, con localizadores semánticos y sin esperas
> arbitrarias. Los defectos confirmados quedan marcados como *expected failure* hasta que
> se corrijan, así la suite documenta lo que sigue roto. Además hay un workflow de CI en
> `.github/workflows/e2e.yml` que corre la suite y un escaneo de vulnerabilidades."

**La idea:** enseñar los tests pasando y explicar la integración con CI.

---

## Bloque 5 — Veredicto (45 s)

**Muestra:** `qa/08-produccion-readiness.md` y vuelve a `qa/RESUMEN.md`.

**Di algo así:**
> "Con todo esto, corrí un chequeo de preparación para producción: **42 de 100, bloqueado**.
> Los dos defectos P1 y el secreto JWT son la razón. Mi recomendación es **no liberar** hasta
> cerrar al menos esos tres puntos; el resto son mejoras que pueden ir después.
> Para cerrar: **no toqué código de producción** —solo añadí la carpeta `qa/`, la suite en
> `e2e/` y el CI. Gracias por ver el video; cualquier cosa la puedo detallar."

**La idea:** cerrar con la acción concreta (qué arreglar antes de liberar) y la garantía
de que el código de producción quedó intacto.

---

## Checklist final antes de entregar

- [ ] El video dura entre 5 y 7 minutos.
- [ ] Se mencionan los 4 defectos y SEC-01 con nombre y severidad.
- [ ] Se dice explícitamente el veredicto **no liberar** y por qué.
- [ ] Se dice que **no se modificó código de producción**.
- [ ] Se ve la suite E2E corriendo (27 passed) al menos una vez.
- [ ] Se nombran las rutas reales del repo para que el evaluador las abra.
- [ ] Se ve la app funcionando (login + dashboard) en algún momento.
