# DEF-01 · Búsqueda de meter_id no ignora mayúsculas

> [!note] Media · P2
> La búsqueda de medidores es *case-sensitive*; la doc promete "sin importar mayúsculas".

Volver a: [[05-Defectos/Registro de defectos]]

## Qué pasa
`backend/internal/meter/service.go:59` — `strings.Contains(sm.MeterID, search)` sin normalizar. En cambio `GetByID` (`service.go:74`) sí hace `strings.ToUpper(strings.TrimSpace(id))`.

## Reproducción
```bash
# filter.meter_id = "m-109"  → count=0 (debería ser 1)
curl -s -X POST http://localhost:8080/api/v1/meter/getAll \
  -H "Authorization: Bearer <token>" -H "Content-Type: application/json" \
  -d '{"filter":{"meter_id":"m-109"}}'
```
Doc que lo promete: `backend/README.md:96`.

## Fix
Normalizar con `strings.ToUpper` ambos lados (patrón ya usado en `GetByID`).

## Detección automática
`e2e/tests/meters.spec.ts › búsqueda por id no ignora mayúsculas` (`test.fail`).

#energia #qa #defecto #busqueda
