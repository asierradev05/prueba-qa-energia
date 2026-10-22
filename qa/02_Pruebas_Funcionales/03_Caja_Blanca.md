# 04 · Pruebas de caja blanca · EnergIA

Análisis estructural del código + ejecución de las suites existentes, orientado por los riesgos R1-R7 del plan. No modifica código de producción.

## 0. Suite de pruebas existente (ejecutada)

| Suite | Comando | Resultado |
|---|---|---|
| Backend | `go test ./...` | **todos OK** (ai, analysis y subpaquetes, auth, config, data, meter, server) |
| Frontend | `pnpm test` (`vitest run`) | **11/11 PASS** (3 archivos) |

> Observación: los 11 tests del front pasan **incluso** con `TZ=America/Bogota`, lo que demuestra que la suite no cubre la conversión de zona horaria (ver DEF-04). El runner fija `TZ='UTC'` en `vite.config.ts:33`.

## 1. Rutas de decisión y valores límite

### 1.1 `meter.StatusOf` — `backend/internal/meter/enums.go:29-38`
```
switch {
case a == nil:                       → NORMAL
case a.Severity == SeverityHigh:     → CRITICAL
default:                             → ALERT
}
```
- DOC/COMENTARIO (línea 26): "sin anomalía, **o falso positivo** → NORMAL".
- Solo hay 2 ramas por severidad; **nunca se consulta `a.Anomaly` ni `a.Type`**.
- Entrada M-106 = `{Anomaly:false, Type:FALSE_POSITIVE, Severity:LOW}` cae en `default` → **ALERT**. Ruta no cubierta por tests. **Confirma DEF-02.**
- Cobertura de caminos: la rama "FALSE_POSITIVE→NORMAL" del comentario **no existe en el código**.

### 1.2 `httpx.Pagination.Normalize` + `Paginate` — `paging.go:23-36, 47-55`
```
Normalize: Page==0→1; Size==0→10; valida Size∈[1,100];             ← no valida Page<0
Paginate:  start = min((Page-1)*Size, len); end = min(start+Size, len)
           rows = items[start:end]
```
- Con `Page=-1, Size=10`: `(Page-1)*Size = -20` → `start=-20` → `items[-20:...]` → **panic** `slice bounds out of range [:-10]` (confirmado en el log del servidor).
- El tag del struct declara `minimum:"1"` (línea 18) pero **no se aplica** en `Normalize`. **Confirma DEF-03.**
- Análisis de valores límite de `Page`: `0`→OK (default), `1`→OK, `-1`→panic. Falta la rama negativa.

> Nota positiva: la aritmética usa `min(...)` para acotar `start`/`end` contra `len(items)` (caso página fuera de rango hacia arriba → 0 filas, correcto). El hueco es solo el extremo inferior.

### 1.3 `meter.Service.GetAll` (búsqueda) — `service.go:53-70`
```
if search != "" && !strings.Contains(sm.MeterID, search) { continue }
```
- `strings.Contains` es **case-sensitive**; no se aplica `ToUpper`/`TrimSpace` a `search`.
- Contraste: `GetByID` (service.go:74) **sí** normaliza `strings.ToUpper(strings.TrimSpace(id))`.
- Inconsistencia interna + contra la doc (`backend/README.md:96`). **Confirma DEF-01.**

### 1.4 `frontend/src/lib/format.ts` — `formatPlantTime` (55-58) vs `formatPlantDate/Day`
```
formatPlantTime  → getDate(), getHours(), getMinutes()   ← local del navegador
formatPlantDate  → getUTCDate(), getUTCMonth()           ← UTC
formatPlantDay   → getUTCDate(), getUTCMonth()           ← UTC
```
- El comentario 51-52 dice "se leen las partes UTC para NO convertirla a la zona del navegador", pero `formatPlantTime` usa API local. Inconsistente con el resto del módulo y con `frontend/README.md:75`. **Confirma DEF-04.**
- Test `format.test.ts:17` verifica exactamente `14:00 → 14:00`, pero solo pasa por el `TZ='UTC'` forzado.

### 1.5 `analysis/classify.realSeverity` — `classify.go:219-229` (R7)
```
p >= 50 && Ongoing → HIGH
p >= 20            → MEDIUM
else               → LOW
```
- DOC (backend/README.md:276): "**supera** 50%… **supera** 20%".
- Código usa `>=` (inclusivo). Diferencia solo en el **valor exacto** 50.0 / 20.0.
- Con el dataset actual ningún caso cae en el borde (M-109 +109,8% → HIGH; M-104 +47,3% → MEDIUM correcto). **Observación de severidad baja**; no reproducible con los datos actuales (lo reporto como inconsistencia doc↔código, no como fallo funcional).

## 2. Cobertura de caminos de los módulos de riesgo

| Módulo | Caminos | Cubiertos por tests | Hueco |
|---|---|---|---|
| `meter.StatusOf` | 3 (nil/HIGH/otra) | nil, HIGH | **FALSE_POSITIVE** |
| `httpx.Pagination` | page<0, =0, >0 | =0, >0 | **page<0** |
| `meter.GetAll` búsqueda | match/no match (exacto) | — | **case/trim** |
| `formatPlantTime` | UTC/local | solo UTC (TZ forzado) | **local ≠ planta** |

## 3. Hallazgo de calidad de código (no defecto funcional)

- `summarize` (service.go:104) indexa `m.Readings[len(m.Readings)-1]` sin comprobar que `Readings` no esté vacío. Si un medidor llegara sin lecturas → **panic index out of range**. Con el dataset actual todas tienen 336 lecturas, por lo que **no es reproducible** hoy; se registra como **riesgo de robustez** (RIESGO-W1), no como defecto confirmado.

## 4. Conclusión

La caja blanca **explica la causa raíz** de los 4 defectos confirmados en caja negra (asignación directa de rama/campo faltante) y evidencia que la suite existente **no los detecta** por cobertura incompleta de caminos y por forzar `TZ=UTC`.
