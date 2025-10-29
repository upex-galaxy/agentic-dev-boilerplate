# FASES 5-6: Implementation Guidelines

Este directorio contiene system prompts que la IA debe leer antes de implementar código.

## 📄 Archivos a crear

Estos archivos deben crearse según las necesidades del proyecto:

1. **`implementation-workflow.md`** - Workflow paso a paso para implementar una story
   - Cómo cargar contexto
   - Verificar plan de implementación
   - Breakdown en subtareas
   - Quality checks después de cada step

2. **`code-standards.md`** - Estándares de código del proyecto
   - DRY (Don't Repeat Yourself)
   - Naming conventions
   - TypeScript strict mode
   - Component structure
   - Performance best practices
   - Accessibility (a11y)

3. **`error-handling.md`** - Manejo de errores
   - NO hardcodear fallbacks
   - Structured error responses
   - Custom error classes
   - Retry logic
   - Logging estratégico

4. **`context-loading.md`** - Qué archivos leer en cada fase
   - Living Documentation (usar MCPs en vez de docs estáticos)
   - Context loading checklist
   - Cuándo leer qué

5. **`automation-workflow.md`** - Testing automation con KATA
   - Page Object Model (POM)
   - AAA pattern (Arrange-Act-Assert)
   - Test organization
   - CI/CD integration

6. **`mcp-usage-tips.md`** - Cuándo usar MCP tools
   - Supabase MCP: Para schema de DB real
   - Atlassian MCP: Para sync con Jira
   - IDE Diagnostics: Para verificar errores

## 🎯 Propósito

Estos guidelines aseguran que la IA:
- ✅ Sigue los estándares del proyecto
- ✅ No hardcodea valores
- ✅ Usa las mejores prácticas
- ✅ Lee el contexto correcto antes de codear
- ✅ Implementa con calidad consistente

## 🚀 Uso

La IA debe leer **TODOS** estos archivos antes de implementar cualquier story (Fases 5-6).
