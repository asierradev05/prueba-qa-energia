# Guion del video (≤ 15 min)

Apoyo: app levantada + [`../01-plan-de-pruebas.md`](../01-plan-de-pruebas.md) + [`../05-defectos.md`](../05-defectos.md) + terminal en `e2e/`.

## 0:00–1:00 · Apertura

- Quién eres, qué producto (EnergIA), commit `15765d9`.
- Veredicto en una frase: **no liberar** por SEC-01 + DEF-02 + DEF-04.
- Estructura de la entrega: `qa/01`…`05` + `e2e/`.

## 1:00–3:00 · Estrategia

- Alcance / fuera de alcance (OpenAI, carga, no fix de código).
- Riesgos P0/P1 (auth, estado FP, hora de planta).
- Técnicas: partición, límites, tablas de decisión, consistencia capas.

## 3:00–5:00 · Humo + caja negra

- Humo 9/10; SMK-10 = DEF-02.
- Mostrar TD-1 (FALSE_POSITIVE → NORMAL) y 2–3 casos FAIL (CN-10, CN-15, CN-25).

## 5:00–10:00 · Defectos en vivo (núcleo)

1. **DEF-02:** UI `/medidores` M-106 “Alerta” + API `getById` status ALERT.
2. **DEF-04:** “Detectada” en Bogotá vs valor de planta / UTC.
3. **SEC-01:** forjar JWT con `evidencias/herramientas/forge-jwt.mjs` → `/auth/me` 200.
4. Mencionar DEF-01 y DEF-03 en 20 s (búsqueda / page=-1 → 500).

## 10:00–13:00 · Playwright

```bash
cd e2e && pnpm test
```

- `storageState`, Page Objects, sin `waitForTimeout`.
- Un flujo de negocio (libro M-109) + un `test.fail()` (p. ej. DEF-02) y explicar por qué pasa hoy.

## 13:00–15:00 · Cierre

- Caja blanca: suites verdes no cubren los huecos; tests unitarios propuestos en `04`.
- Riesgos abiertos y orden de fix: P0 → P1 → P2.
- Repetir veredicto.
