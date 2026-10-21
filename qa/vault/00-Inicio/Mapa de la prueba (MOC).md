# Mapa de la prueba (MOC)

> [!note] MOC = Map of Content
> Esta nota es el **panel central** del vault. Desde aquí se llega a todo.

## Fases
```mermaid
flowchart LR
    A[1. Plan] --> B[2. Humo]
    B --> C[3. Caja negra]
    C --> D[4. Caja blanca]
    D --> E[5. Defectos]
    E --> F[6. Seguridad]
    F --> G[7. Automatización]
    G --> H[Resumen ejecutivo]
```

```mermaid
mindmap
  root((EnergIA QA))
    Plan
      Alcance
      Riesgos R1-R7
      Criterios
    Humo
      10 casos
    Caja negra
      42 casos
    Caja blanca
      Motor
      Auth
    Defectos
      DEF-01..04
      SEC-01..07
    Automatización
      Playwright
      storageState
      Page Objects
      CI
```

## Notas por fase
- [[01-Plan/Plan de pruebas]]
- [[02-Humo/Suite de humo]]
- [[03-Caja-Negra/Casos de caja negra]]
- [[04-Caja-Blanca/Caja blanca]]
- [[05-Defectos/Registro de defectos]]
- [[06-Seguridad/Reporte de seguridad]]
- [[07-Automatizacion/Playwright E2E]]
- [[08-Evidencias/Índice de evidencias]]
- [[90-Meta/Bitácora de trabajo]]

## Cómo navegar
- Usa **Ctrl+O** para abrir una nota por nombre.
- El **grafo** (Ctrl+G) muestra los enlaces entre notas.
- Haz clic en los `[[wikilinks]]` para saltar.

#energia #qa #moc
