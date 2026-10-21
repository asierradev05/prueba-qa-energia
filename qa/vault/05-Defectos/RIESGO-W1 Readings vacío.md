# RIESGO-W1 · Readings vacío

> [!warning] Baja · P3 · Riesgo latente

`backend/internal/meter/service.go:104` — `summarize` indexa `Readings[len-1]` sin comprobar que la lista no esté vacía. Hoy todos los medidores traen 336 lecturas, así que no se reproduce; si un medidor llega sin lecturas, sería un panic.

**Fix:** guardar `if len(r.Readings) == 0 { ... }` antes de indexar.

Ver también: [[04-Caja-Blanca/Caja blanca]]

#energia #qa #riesgo
