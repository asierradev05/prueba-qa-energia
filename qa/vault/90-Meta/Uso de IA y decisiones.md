# Uso de IA y decisiones

El enunciado pide contar cómo y para qué se usó IA. Aquí queda registrado.

## Dónde se usó IA
- **Diseño de la batería de seguridad** (`security-probe.ps1`) y el **forjador de JWT** (`forge-jwt.mjs`): escritos con asistencia de IA; **todas** las salidas citadas son de ejecución real.
- **Redacción de notas/documentos** (vault, reportes) y estructura.
- **Análisis de código** para localizar causas raíz (archivo:línea).

## Dónde NO se usó IA para decidir
- Los **resultados** (PASS/FAIL, códigos HTTP, conteos) provienen de ejecutar la app, no de suposiciones.
- No se inventaron hallazgos: cada defecto tiene evidencia reproducible y comando.

## Decisiones tomadas (sin preguntar, según el enunciado)
1. **Modo dev sin Docker** (Docker no disponible) → backend `go run`, frontend `pnpm dev`.
2. **No versionar el JWT** de desarrollo; se regenera con el login.
3. **Rutas en español** confirmadas en `frontend/src/config/paths.ts`.
4. **`test.fail()`** solo para defectos confirmados; cada uno documenta su ID.
5. **Seguridad como bonus**: el usuario la pidió explícitamente como diferenciador.

#energia #qa #meta #ia
