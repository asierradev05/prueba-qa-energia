# Caja blanca · EnergIA

Análisis estructural orientado por riesgos R1–R8 del plan. **No se modificó código de producción.**

## 0. Suites existentes (ejecutadas)

| Suite | Comando | Resultado | Confianza |
|---|---|---|---|
| Backend | `go test ./...` | OK (ai, analysis, auth, config, data, meter, server) | Media: cubre caminos felices; **no** los bordes que fallan en prod |
| Frontend | `pnpm test` (vitest) | **11/11 PASS** (3 archivos) | Baja en fechas: `vite.config.ts` fuerza `TZ='UTC'`, así que DEF-04 no puede fallar |

Los tests existentes **pasan con el producto defectuoso**. No son un oráculo fiable para release; sirven como red de regresión parcial del motor y del formato es-CO.

---

## 1. Módulos de riesgo revisados

### 1.1 `meter.StatusOf` — `backend/internal/meter/enums.go:29-38` (R2 / DEF-02)

```
switch {
case a == nil:                   → NORMAL
case a.Severity == SeverityHigh: → CRITICAL
default:                         → ALERT
}
```

- Comentario/doc: “sin anomalía, **o falso positivo** → NORMAL”.
- El `switch` **nunca** consulta `a.Anomaly` ni `a.Type`.
- M-106 `{Anomaly:false, Type:FALSE_POSITIVE, Severity:LOW}` → `default` → **ALERT**.
- Tests existentes (`TestStatusOf`): nil, HIGH, MEDIUM, LOW con `Anomaly:true`. **Falta** FALSE_POSITIVE / `Anomaly:false`.

### 1.2 `httpx.Pagination` — `paging.go:23-36, 47-55` (R5 / DEF-03)

- `Normalize` valida `size` ∈ [1,100]; **no** valida `Page < 0`.
- `Paginate`: `start=(Page-1)*Size` con `Page=-1` → índice negativo → **panic** → middleware Recover → **500**.
- `page=0` sí se normaliza a 1 (OK). Tag `minimum:"1"` no se aplica en runtime.

### 1.3 `meter.Service.GetAll` búsqueda — `service.go:53-70` (R4 / DEF-01)

- `strings.Contains(sm.MeterID, search)` case-sensitive.
- `GetByID` sí hace `ToUpper(TrimSpace(id))` → inconsistencia interna + vs doc.

### 1.4 `formatPlantTime` — `frontend/src/lib/format.ts:55-58` (R1 / DEF-04)

| Función | API usada | Comportamiento |
|---|---|---|
| `formatPlantDate` / `Day` | `getUTC*` | Hora de planta (correcto) |
| `formatPlantTime` | `getDate` / `getHours` / `getMinutes` | **Zona del navegador** |

Comentario del archivo (L51-52) dice leer UTC; la implementación de time no lo hace. El test `format.test.ts` solo pasa porque el runner fuerza UTC.

### 1.5 `realSeverity` — `classify.go:219-229` (R8 / OBS-01)

Doc: “supera” (>); código: `>=`. Sin caso en el dataset en el borde exacto → observación, no defecto funcional reproducible.

### 1.6 Robustez — `summarize` `service.go:104` (RIESGO-W1)

Indexa `Readings[len-1]` sin guard de lista vacía. Hoy todas tienen 336 lecturas → no reproducible; riesgo de panic futuro.

---

## 2. Cobertura de caminos vs huecos

| Módulo | Caminos relevantes | Cubiertos por tests | Hueco |
|---|---|---|---|
| `StatusOf` | nil / HIGH / otra / **FP** | nil, HIGH, MED, LOW | **FALSE_POSITIVE → NORMAL** |
| `Pagination` | page&lt;0, =0, &gt;0 | =0, &gt;0, size inválido | **page&lt;0 → 400** |
| `GetAll` search | match / case | parcial `"109"` | **`"m-109"`** |
| `formatPlantTime` | UTC / Bogotá | solo UTC forzado | **TZ≠UTC** |

---

## 3. Tests unitarios propuestos (no aplicados al código de la app)

El enunciado permite proponer (y opcionalmente escribir) tests. Aquí el contrato que debería fallar **hoy** y pasar tras el fix. La detección E2E ya está en `e2e/` con `test.fail()`.

### 3.1 Go — `StatusOf` (DEF-02)

```go
func TestStatusOf_FalsePositiveIsNormal(t *testing.T) {
	a := &model.Anomaly{
		Anomaly:  false,
		Type:     model.TypeFalsePositive,
		Severity: model.SeverityLow,
	}
	if got := StatusOf(a); got != StatusNormal {
		t.Fatalf("StatusOf(FALSE_POSITIVE)=%s, want NORMAL", got)
	}
}
```

### 3.2 Go — paginación negativa (DEF-03)

```go
func TestNormalize_RejectsNegativePage(t *testing.T) {
	p := httpx.Pagination{Page: -1, Size: 10}
	errs := p.Normalize()
	if len(errs) == 0 {
		t.Fatal("esperaba error de validación para page < 1")
	}
}
```

### 3.3 Go — búsqueda case-insensitive (DEF-01)

```go
func TestGetAll_MeterIDCaseInsensitive(t *testing.T) {
	svc := newTestService(t)
	got := getAll(t, svc, PagedRequest{
		Pagination: httpx.Pagination{Size: httpx.MaxPageSize},
		Filter:     Filter{MeterID: "m-109"},
	})
	if !slices.Equal(got, []string{"M-109"}) {
		t.Fatalf("got %v, want [M-109]", got)
	}
}
```

### 3.4 TypeScript — hora de planta con TZ Bogotá (DEF-04)

Ejecutar el test **sin** forzar `TZ=UTC`, o con `process.env.TZ = 'America/Bogota'`:

```ts
it('mantiene la hora de planta en America/Bogota', () => {
  // 14:00Z de planta no debe convertirse a 09:00 local
  expect(formatPlantTime('2026-09-12T14:00:00Z')).toBe('12/09 14:00')
})
```

Hoy, con `TZ=America/Bogota`, este expect **falla** (obtiene `12/09 09:00`) — evidencia de que el test actual solo “pasa” por el TZ forzado.

---

## 4. Conclusión

La caja blanca **explica la causa raíz** de DEF-01…04 (rama o normalización faltante) y muestra por qué las suites verdes **no protegen el release**. Confianza en tests existentes: **parcial** (motor/oráculo sí; estado FP, paginación negativa, case search y TZ: no). Detección automática ya cubierta en E2E; los snippets de §3 cierran el hueco unitario.
