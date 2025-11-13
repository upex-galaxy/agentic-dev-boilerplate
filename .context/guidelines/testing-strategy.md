# Testing Strategy

## Pirámide de testing

```
        /\
       /E2E\       ← Fase 11 (pocos, lentos, críticos)
      /------\
     /Integration\ ← Fase 11 (medianos, APIs)
    /------------\
   /  Unit Tests  \ ← Fase 7 (muchos, rápidos, lógica)
  /----------------\
```

## Por fase

| Fase | Tipo | Cuándo | Quién | Herramienta |
|------|------|--------|-------|-------------|
| 7 | Unit | Durante implementación | Dev | Jest/Vitest |
| 10 | Exploratory | Después de deploy staging | QA | Manual |
| 11 | Integration | Después de exploratory | QA/Dev | Vitest + Supertest |
| 11 | E2E | Después de exploratory | QA | Playwright |
| 13 | Smoke | Post-deploy producción | Automatizado | Playwright |

## Principio clave
**Manual antes que automatizado**

Exploratory Testing (Fase 10) valida funcionalidad manualmente.
Solo después automatizas (Fase 11).

Razón: No pierdas tiempo automatizando funcionalidad rota.
