# Configuración de MCP para Claude Code

**Claude Code** es la herramienta CLI oficial de Anthropic para codificación asistida directamente desde la terminal.

> 💡 Para conceptos generales de MCP, consulta [MCP - Guía General](./README.md)

---

## 🚀 Quick Start

### Setup Inicial

La primera vez que uses Claude Code basta con lanzarlo: el login y la inicialización son automáticos.

```bash
bun run claude
```

> ⚠️ El flag `--dangerously-skip-permissions` NO es parte del setup: desactiva TODOS los prompts de permisos y solo tiene sentido en sandboxes desechables. No lo uses en tu máquina de trabajo.

**En este boilerplate**: `bun run claude` es un wrapper `dotenv -o -e .env -- claude` que carga `.env` antes de arrancar, para que los `${VAR}` del `.mcp.json` resuelvan. El `-o` hace que `.env` gane sobre una variable heredada del shell.

**Lanzamientos sin línea de comando** (la app de escritorio, un worker supervisado): no pasan por el wrapper. Corré `bun run harness:env` después de cada cambio de `.env`: escribe el bloque `env` de `.claude/settings.local.json`, que Claude Code lee antes de arrancar los MCPs. En macOS/Linux Claude Code lee la copia del checkout PRINCIPAL, así que desde un worktree el comando escribe ahí (y se niega si el `.env` del worktree falta o borraría credenciales). `bun run harness:env:check` reporta drift por nombre de variable, nunca por valor.

**Tres harnesses, un solo inventario**: los servidores que declara `.mcp.json` viven también en `opencode.jsonc` (OpenCode) y en `.codex/config.toml` (Codex CLI + Desktop, ver [codex.md](./codex.md)). `bun run agents:compat:check` toma `.mcp.json` como conjunto canónico, normaliza los tres formatos y falla si un servidor falta en otro host, existe en un solo host o depende de otras variables de `.env`. Si agregás un servidor acá, agregalo en los otros dos. Las instrucciones (`AGENTS.md`, que Claude Code lee vía el shim `CLAUDE.md`) y las skills (`.agents/skills/`, alias generado `.claude/skills`) también son una sola copia: ver `AGENTS.md` §5.5.

**Qué NO va en `.mcp.json`**: la búsqueda web (Exa primero, Tavily segundo) se conecta una vez por máquina, en el scope `user` o como conector de claude.ai; la automatización de browser es `playwright-cli`, no un MCP (`AGENTS.md` §6). Las skills piden capacidades, no servidores: `.agents/skills/agentic-dev-core/references/mcp-capabilities.md`.

### Archivos de Configuración

Claude Code usa un sistema jerárquico:

1. **Local** (scope `local`, guardado en `~/.claude.json` por proyecto): mayor prioridad
2. **Proyecto** (`.mcp.json` en la raíz del proyecto, commiteado al repo)
3. **Usuario** (scope `user` en `~/.claude.json`): configuración global

### Scopes de Configuración

- `user`: global para todos los proyectos
- `project`: específico del proyecto actual (archivo `.mcp.json`, compartido con el equipo)
- `local`: privado tuyo para el proyecto actual

---

## 📝 Configuración de MCPs

### Método 1: Mediante CLI (scope `user` o `local`)

```bash
# Servidor stdio
claude mcp add -t stdio -s user mi-servidor -- npx -y @paquete/servidor

# Servidor HTTP
claude mcp add --transport http --scope user notion https://mcp.notion.com/mcp

# Listar / eliminar
claude mcp list
claude mcp remove mi-servidor
```

### Método 2: Edición manual de `.mcp.json` (scope `project`)

Para un servidor que el equipo comparte. Copiá el bloque del template opt-in ([`docs/mcp/claude.template.json`](../../mcp/claude.template.json)) y replicalo en los otros dos hosts:

```json
{
  "mcpServers": {
    "postman": {
      "type": "http",
      "url": "https://mcp.postman.com/mcp",
      "headers": {
        "Authorization": "Bearer ${POSTMAN_API_KEY}"
      }
    }
  }
}
```

> **Nota**: Claude Code NO soporta el bloque `inputs` / `${input:...}` (eso es sintaxis de VS Code). Los secretos se referencian como `${VAR}` (o `${VAR:-default}`) y se expanden desde el entorno del proceso. **Si la variable falta, Claude Code no avisa**: pasa `${VAR}` como texto literal y el servidor falla recién en su primera llamada autenticada. El chequeo es `/mcp` dentro de la sesión (`AGENTS.md` Critical Rule #9).

---

## 🔧 Transportes Soportados

- ✅ **stdio**: servidores locales; los únicos que este repo commitea
- ✅ **HTTP Streamable** (`type: "http"`): el transporte recomendado para servidores remotos
- ⚠️ **SSE**: deprecado en el estándar MCP. Si un servicio solo expone SSE, agregalo igual con `--transport http`: Claude Code prueba HTTP y cae a SSE cuando el servidor no lo acepta. `--transport sse` sigue disponible para conectar directo.

---

## 🎯 Características Especiales

### Sistema Jerárquico

Local > Project > User. Ante nombres repetidos, el scope local gana sobre el `.mcp.json` del proyecto, y este sobre la configuración global de usuario.

### Conectores de claude.ai

Un conector que conectás en la configuración de claude.ai aparece en la sesión con prefijo `mcp__claude_ai_<conector>__`. Las skills lo resuelven igual que a un servidor local: por el sufijo del nombre de la tool, no por el prefijo.

### Variables de Entorno

Expansión de `${VAR}` y `${VAR:-default}` en `command`, `args`, `env`, `url` y `headers`, desde el entorno del proceso.

---

## 🐛 Troubleshooting

### 401 / 403 o una tool que falla sin explicación

La variable falta o está vacía. Revisá `.env` contra `.env.example`, corré `bun run harness:env` si no lanzaste con `bun run claude`, y **reiniciá la sesión**: las variables se leen al arrancar el MCP.

### "Permission denied"

Revisá los permisos configurados (`/permissions` dentro de la sesión, o `settings.json` / `settings.local.json` en `.claude/`). NO uses `--dangerously-skip-permissions` como atajo fuera de un sandbox desechable.

### Servidor no se encuentra

Verificá que el binario esté en el `PATH` del proceso (`which npx`, `which bunx`), o usá rutas absolutas en `command`.

### Herramientas no aparecen

1. `/mcp` dentro de la sesión: muestra el estado de cada servidor y permite reconectar o autenticar.
2. `bun run agents:compat:check`: si falla, `.mcp.json` divergió de los otros dos hosts.
3. Reiniciá Claude Code después de cambiar la configuración.

---

## 📚 Recursos Adicionales

- **Documentación Oficial**: https://docs.anthropic.com/en/docs/claude-code/mcp
- **Conceptos MCP**: [MCP - Guía General](./README.md)
- **Configs del repo y templates opt-in**: [`docs/mcp/README.md`](../../mcp/README.md)
