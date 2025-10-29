# FASE 2: Software Requirements Specification (SRS)

Este directorio contiene los requerimientos técnicos del sistema.

## 📄 Archivos a generar

Usa los prompts de `.prompts/fase-2-specification/` para crear:

1. **`functional-specs.md`** - Requerimientos funcionales (FRs mapeados 1:1 con user stories)
   - Usa: `.prompts/fase-2-specification/srs-functional-specs.md`

2. **`non-functional-specs.md`** - Performance, security, scalability, accessibility
   - Usa: `.prompts/fase-2-specification/srs-non-functional-specs.md`

3. **`architecture-specs.md`** - C4 diagrams, ERD, tech stack, data flow
   - Usa: `.prompts/fase-2-specification/srs-architecture-specs.md`

4. **`api-contracts.yaml`** - OpenAPI 3.0 spec de todos los endpoints
   - Usa: `.prompts/fase-2-specification/srs-api-contracts.md`

## 🎯 Output esperado

Al completar esta sección tendrás:
- 4 archivos con especificaciones técnicas completas
- Diagramas de arquitectura (C4, ERD)
- Contratos de API definidos
- Base para implementación (Fase 4-6)

## ⚠️ IMPORTANTE

- **NO hardcodear SQL schemas** - Usar Supabase MCP para obtener schema real
- Los diagramas deben usar Mermaid para fácil visualización
