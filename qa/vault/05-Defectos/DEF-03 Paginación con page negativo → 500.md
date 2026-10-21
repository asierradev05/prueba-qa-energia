# DEF-03 · Paginación con page negativo → 500

> [!warning] Alta · P2
> `pagination.page` negativo provoca HTTP 500 por panic (slice fuera de rango).

Volver a: [[05-Defectos/Registro de defectos]]

## Qué pasa
`backend/internal/httpx/paging.go:23-36,47-55` — `Normalize()` valida `Size` pero no `Page<0`; `start=(Page-1)*Size` es negativo → `items[start:end]` hace panic.

## Reproducción
```bash
curl -s -X POST http://localhost:8080/api/v1/meter/getAll \
  -H "Authorization: Bearer <token>" -H "Content-Type: application/json" \
  -d '{"pagination":{"page":-1,"size":10}}'
```
- Esperado: `400`
- Obtenido: `500`

Log del backend:
```
ERROR panic error="runtime error: slice bounds out of range [:-10]" path=/api/v1/meter/getAll
```
(`page=0` → normalizado a 1, OK.)

## Fix
En `Normalize()`, si `Page < 0` → error de validación (400).

## Detección automática
`e2e/tests/meters.spec.ts › paginación con page negativo responde 400` (`test.fail`).

#energia #qa #defecto #paginacion
