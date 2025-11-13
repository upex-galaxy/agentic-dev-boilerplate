# Fase 3: Infrastructure - Setup Técnico Base

## Propósito
Implementar la base técnica del proyecto ANTES de empezar desarrollo iterativo.
Esta fase se ejecuta UNA sola vez después de tener las specs (Fase 2).

## Orden de ejecución
1. cloud-services.md       (primero)
2. backend-setup.md        (segundo)
3. frontend-setup.md       (tercero)

## Por qué este orden
- Backend define schemas → genera tipos TypeScript
- Frontend consume esos tipos → zero type errors
- Flujo natural: DB → API → UI

## Por qué Backend antes que Frontend
El backend define el contrato de datos. Al crear schemas primero:
- Se generan tipos TypeScript automáticamente
- Frontend importa tipos reales (no mock)
- Zero type mismatches
- Ejemplo: schemas → types → componentes

## Cuándo ejecutar
- Después de completar Fase 2 (Architecture)
- ANTES de Fase 4 (Specification)
- Una sola vez por proyecto

## Roles involucrados
- DevOps Engineer (cloud-services)
- Backend Developer (backend-setup)
- Frontend Developer + Designer (frontend-setup)
