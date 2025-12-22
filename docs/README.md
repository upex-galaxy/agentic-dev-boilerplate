# 📚 Documentación del Proyecto

Bienvenido a la documentación del **AI-Driven Software Project Template**.

---

## 🗺️ Arquitectura y Blueprint

### [AI-Driven Software Project Blueprint](./ai-driven-software-project-blueprint.md)

Documentación completa de la metodología y estructura del proyecto. Incluye las 8 fases del desarrollo impulsado por IA (2 sincrónicas + 6 asincrónicas).

### [KATA Test Architecture](./kata-test-architecture.md)

Arquitectura completa de testing automatizado con el framework KATA (Knowledge-Aware Test Automation).

---

## 🔧 MCP (Model Context Protocol)

### Conceptos Generales

- **[MCP - Guía General](./mcp-config-general.md)**
  - ¿Qué es MCP?
  - Tipos de transporte (stdio, SSE, HTTP)
  - Seguridad y autenticación
  - Casos de uso comunes

### Configuración por Herramienta

- **[Claude Code](./mcp-config-claudecode.md)** - CLI de Anthropic
- **[Gemini CLI](./mcp-config-geminicli.md)** - CLI de Google
- **[GitHub Copilot CLI](./mcp-config-copilotcli.md)** - CLI de GitHub
- **[VS Code + GitHub Copilot](./mcp-config-vscode.md)** - Integración en VS Code

### Estrategia de Configuración

- **[MCP Builder Strategy](./mcp-builder-strategy.md)**
  - Sistema de configuración dinámica
  - Carga de MCPs por sesión
  - Optimización de uso de tokens
  - Problema del "Token Hell" y su solución

---

## 📖 Guías de Uso

### Quick Start

1. **Elige tu herramienta de IA**:
   - Claude Code → [Configuración](./mcp-config-claudecode.md)
   - Gemini CLI → [Configuración](./mcp-config-geminicli.md)
   - GitHub Copilot CLI → [Configuración](./mcp-config-copilotcli.md)
   - VS Code → [Configuración](./mcp-config-vscode.md)

2. **Configura MCP Builder**:
   - Lee [MCP Builder Strategy](./mcp-builder-strategy.md)
   - Copia template: `cp templates/mcp/gemini.template.json .gemini/settings.catalog.json`
   - Agrega tus API keys
   - Ejecuta: `node scripts/mcp-builder.js backend`

3. **Empieza a desarrollar**:
   - Sigue el [Blueprint](./ai-driven-software-project-blueprint.md)
   - Implementa tests con [KATA](./kata-test-architecture.md)

---

## 🎯 Workflow Recomendado

### Para Nuevos Proyectos

**Fases Sincrónicas** (una sola vez, setup inicial):

```
1. Fase 1: Constitution
   └─ Usa prompts de .prompts/fase-1-constitution/

2. Fase 2: Architecture (PRD + SRS)
   └─ Usa prompts de .prompts/fase-2-architecture/
```

**Fases Asincrónicas** (iterativas, por sprint/épica):

```
3. Fase 3: Specification (PBI)
   └─ Usa prompts de .prompts/fase-3-specification/

4. Fase 4: Shift-Left Testing
   └─ Usa prompts de .prompts/fase-4-shift-left-testing/

5. Fase 5: Planning
   └─ Usa prompts de .prompts/fase-5-planning/

6. Fase 6: Implementation
   └─ Lee .context/guidelines/
   └─ Configura MCPs con MCP Builder
   └─ NO hay prompts (usa guidelines)

7. Fase 7: Code Review
   └─ Lee .context/guidelines/code-standards.md
   └─ NO hay prompts (usa guidelines)

8. Fase 8: Test Automation Engineering
   └─ Usa prompts de .prompts/fase-8-test-automation/
   └─ Implementa KATA framework
```

### Para Desarrollo Diario

```bash
# 1. Configura MCPs para tu tarea
node scripts/mcp-builder.js backend  # o frontend, apitest, etc.

# 2. Trabaja con tu AI tool favorita
claude  # o gemini, copilot, etc.

# 3. Al cambiar de tarea, reconfigura MCPs
node scripts/mcp-builder.js frontend
```

---

## 🔑 Conceptos Clave

### Context Engineering

La ingeniería de contexto es fundamental en este template:

- **Modular**: Información organizada por fases y épicas
- **DRY**: Sin duplicación, referencias cuando sea posible
- **Eficiente**: Solo carga lo necesario (MCP Builder)

### Token Optimization

- Usa MCP Builder para cargar solo MCPs necesarios
- 80-90% reducción en uso de tokens
- Respuestas más rápidas y económicas

### AI-First Development

- Documentación estructurada para IA
- Prompts optimizados en `.prompts/`
- Guidelines claros en `.context/guidelines/`

---

## 🆘 Soporte

### Problemas Comunes

**MCPs no cargan**:

- Verifica [MCP Builder Strategy](./mcp-builder-strategy.md)
- Revisa configuración específica de tu herramienta

**Tokens muy altos**:

- Usa MCP Builder para optimizar
- Lee sobre "Token Hell" en [MCP Builder](./mcp-builder-strategy.md)

**Testing no funciona**:

- Consulta [KATA Architecture](./kata-test-architecture.md)
- Revisa `.context/guidelines/tae/`

---

## 📚 Documentos por Categoría

### Arquitectura

- [AI-Driven Blueprint](./ai-driven-software-project-blueprint.md)
- [KATA Test Architecture](./kata-test-architecture.md)

### MCP General

- [MCP - Guía General](./mcp-config-general.md)
- [MCP Builder Strategy](./mcp-builder-strategy.md)

### MCP por Herramienta

- [Claude Code](./mcp-config-claudecode.md)
- [Gemini CLI](./mcp-config-geminicli.md)
- [GitHub Copilot CLI](./mcp-config-copilotcli.md)
- [VS Code](./mcp-config-vscode.md)

---

## 🔄 Actualizaciones

Este repositorio se actualiza regularmente con:

- Nuevos MCP servers en templates
- Mejoras a MCP Builder
- Nuevas estrategias de testing
- Optimizaciones de context engineering

**Última actualización**: 2025-10-29

---

**💡 Tip**: Comienza con [MCP Builder Strategy](./mcp-builder-strategy.md) para entender cómo optimizar tu flujo de trabajo con IAs.
