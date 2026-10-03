# Configuración de Codex CLI + Codex Desktop

**Codex** es el agente de codificación de OpenAI. La CLI y la app de escritorio (Codex Desktop) leen la misma configuración de repositorio, así que todo lo que sigue aplica a las dos.

> 💡 Para conceptos generales de MCP, consulta [MCP - Guía General](./README.md). Para la arquitectura completa de tres harnesses, `AGENTS.md` §5.5.

---

## 🚀 Quick Start

```bash
bun install
bun run setup        # detecta Claude Code / OpenCode / Codex instalados, genera los shims
bun run codex        # lanza codex con .env cargado
```

`bun run codex` es un wrapper `dotenv -o -e .env -- codex`. El `-o` hace que `.env` gane sobre una variable heredada del shell. Los MCPs no dependen de ese wrapper: cada server stdio de `.codex/config.toml` arranca con su propio loader de `.env` (ver [abajo](#el-loader-de-env)), así que lanzar `codex` a secas o abrir Codex Desktop desde el Dock también les da credenciales. El wrapper sigue sirviendo para el resto del proceso (hooks, comandos que corre el agente).

Si el instalador no detecta Codex (por ejemplo, un binario en una ruta no estándar), forzá la lista con `INSTALL_AGENTS=codex bun run setup`.

---

## 📂 Qué lee Codex de este repo

Codex no necesita ningún shim: consume las dos fuentes canónicas directamente.

| Superficie    | Archivo                                          | Cómo llega a Codex                                                                                                                                                                                                |
| ------------- | ------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Instrucciones | `AGENTS.md`                                      | Nativo. Es el mismo archivo que OpenCode lee nativo y que Claude Code lee a través del shim `CLAUDE.md` (`@AGENTS.md` en una línea).                                                                              |
| Skills        | `.agents/skills/<name>/SKILL.md` + `references/` | Nativo. Una sola copia commiteada; Claude Code llega por el alias generado `.claude/skills`.                                                                                                                      |
| Comandos      | ninguno                                          | Ningún host trae archivos de comando: una skill se invoca por nombre más modo. Donde en Claude Code tipeás `/project-context dev-roadmap`, acá lo pedís en prosa: "load skill `project-context`, mode `dev-roadmap`". Cada skill lista sus modos en su `## Mode routing` (`AGENTS.md` §5 "Skill modes"). |
| Hook          | `.codex/hooks.json`                              | `UserPromptSubmit` ejecuta `.agents/hooks/personality-reinject.mjs` (el mismo emisor que usan los otros dos harnesses) desde la raíz de git. Trae `command` POSIX y `commandWindows`. |
| MCP           | `.codex/config.toml`                             | Los servidores que declara `.mcp.json`, en formato Codex. Paridad con `.mcp.json` y `opencode.jsonc` verificada por `bun run agents:compat:check`. La búsqueda web no está acá: se conecta a nivel harness (`~/.codex/config.toml`). |

---

## 🔐 Repository trust (obligatorio)

Codex carga `.codex/config.toml` y `.codex/hooks.json` **solo en un repositorio trusted**. Sin trust, Codex arranca igual pero sin los MCPs ni el hook de personalidad, y no avisa.

- La confianza es estado de runtime de Codex, no un archivo del repo: no se puede verificar leyendo el disco. Por eso `bun run setup:doctor` la muestra como fila **WARN** (no FAIL) y te recuerda confirmarla.
- La primera vez que abrís el repo, Codex pregunta si confiás en él. Aceptá. Si lo rechazaste, revisá la configuración de proyectos trusted de tu instalación de Codex y volvé a marcarlo.
- Codex Desktop comparte esa confianza con la CLI: es la misma configuración de usuario.

---

## 🔌 MCP en `.codex/config.toml`

### Por qué la forma cambia respecto de `.mcp.json`

Codex **no expande `${VAR}`** dentro de `args` ni dentro de los valores de `[mcp_servers.X.env]`. Un placeholder ahí llega al server como texto literal. Los secretos se reenvían **por nombre** desde el entorno del proceso:

- `env_vars = ["NOMBRE", ...]` en un server stdio reenvía esas variables al proceso hijo.
- `bearer_token_env_var = "NOMBRE"` en un server HTTP manda `Authorization: Bearer <valor>`.
- `[mcp_servers.X.env]` queda para settings literales, nunca para secretos.

Eso cambia la forma de dos servidores respecto de `.mcp.json` / `opencode.jsonc`:

| Server     | En `.mcp.json` / `opencode.jsonc`                    | En `.codex/config.toml`                                                                         |
| ---------- | ---------------------------------------------------- | ----------------------------------------------------------------------------------------------- |
| `supabase` | `--access-token` con el token en `args`              | sin flag; `SUPABASE_ACCESS_TOKEN` + URL + keys en `env_vars` (fallback documentado del paquete) |
| `n8n`      | `env` con `N8N_API_URL` / `N8N_API_KEY` + literales  | `env_vars = ["N8N_API_URL", "N8N_API_KEY"]` + `[mcp_servers.n8n.env]` con los literales         |

`bun run agents:compat:check` compara los **nombres de variables de `.env`** de los que depende cada host y la existencia de cada servidor, no la forma literal del comando, así que estas adaptaciones pasan el gate y un servidor agregado solo acá (o solo en otro host) lo hace fallar.

### El loader de `.env`

`env_vars` reenvía desde el entorno del proceso Codex, y Codex Desktop abierto desde Finder o el Dock no tiene ninguno. Por eso **cada** server stdio arranca envuelto en un loader:

```toml
command = "bunx"
startup_timeout_sec = 30
args = ["-p", "dotenv-cli@8.0.0", "dotenv", "-o", "-e", ".env", "--", <el comando real>]
```

El loader lee `.env` desde la raíz del proyecto lo haya lanzado quien sea; `-o` hace que `.env` gane sobre un valor heredado, igual que `bun run codex`. `startup_timeout_sec = 30` cubre un `bunx` en frío más el salto del loader (Codex espera 10 s por defecto). Necesita `bun install` una vez y un `.env` en el checkout; un worktree recibe el suyo con `bun run worktree:provision`. Un server stdio sin loader o sin timeout falla `agents:compat:check` en el boilerplate y es WARNING en un proyecto derivado (`.codex/` se entrega una sola vez y un sync no lo corrige).

El archivo real, con un comentario por adaptación, es `.codex/config.toml`: leelo ahí, no en una copia. `docs/mcp/codex.template.toml` trae solo servidores opt-in (OpenAPI, DBHub, Atlassian, Postman, etc.), ya envueltos en el loader: para sumar uno, copiá su bloque a `.codex/config.toml`, agregalo también a `.mcp.json` y `opencode.jsonc`, y corré `bun run agents:compat:check`.

### Agregar o inspeccionar MCPs

```bash
codex mcp list                                  # ver los servidores cargados
codex mcp add nombre -- npx -y paquete          # agrega en ~/.codex/config.toml (global)
codex mcp --help
```

Dentro de la sesión, `/mcp` lista los servidores activos. Si `.codex/config.toml` no aparece, el repo no está trusted (ver arriba).

---

## 🎭 Hook de personalidad

`.codex/hooks.json` registra un hook `UserPromptSubmit` que corre el emisor desde la raíz de git, con una variante POSIX (`command`) y otra PowerShell (`commandWindows`).

El emisor es `.agents/hooks/personality-reinject.mjs`, el mismo que ejecuta Claude Code desde `.claude/settings.json` y que OpenCode importa desde `.opencode/plugins/personality-reinject.js`. Reinyecta en cada turno el contrato de salida de `AGENTS.md` §2 (PM Voice, Butler, Visual Mapping) para que no se diluya en sesiones largas, más la línea `AGENT IDENTITY: worktree=… session=… harness=…` de la que salen los trailers `Worktree:` / `Session:` de cada commit (`AGENTS.md` Critical Rule #3), una línea `ORCA:` cuando el binario `orca` está disponible, y como mucho un aviso de setup (falta `.env`, o un worktree que nunca corrió `bun run worktree:provision`). Codex resuelve la raíz con `git rev-parse` porque no expone una variable de directorio de proyecto como `$CLAUDE_PROJECT_DIR`. Requiere `node` y `git` en el `PATH`.

---

## 🧩 Qué NO existe en Codex

- **Plugins de Claude Code** (Engram, caveman): no se instalan. Las reglas de `AGENTS.md` que los mencionan (§1 #11, §12) son no-ops en Codex.
- **Archivos de comando**: no existen en ningún host; se pide la skill + modo (ver la tabla de arriba).

---

## 🐛 Troubleshooting

### Los MCPs no aparecen en `/mcp`

1. Confirmá que el repo está trusted (`bun run setup:doctor` lo recuerda como WARN).
2. `bun run agents:compat:check` en verde: si falla, el TOML y los otros dos configs divergieron.
3. Un server que tarda en arrancar en frío: confirmá que su bloque tiene `startup_timeout_sec`.

### 401 / 403 en Supabase o n8n

La variable falta o está vacía en el `.env` del checkout (en un worktree, el del worktree). Revisá `.env` (`SUPABASE_ACCESS_TOKEN`, `N8N_API_KEY`, …) contra `.env.example` y **reiniciá la sesión**: las variables se leen una sola vez al arrancar el MCP. Ningún host avisa antes: el 401/403 es la señal (Critical Rule #9 aplica a los tres harnesses).

### Búsqueda web no disponible

No es un MCP del proyecto. Conectá Exa (o Tavily) una vez por máquina en `~/.codex/config.toml` (`codex mcp add <nombre> --url <url>`, luego `codex mcp login <nombre>`); `bun run setup` imprime los comandos y `bun run setup:doctor` muestra qué declara esta máquina.

### El hook no imprime el contrato

`node` o `git` no están en el `PATH` del proceso de Codex, o el repo no está trusted. Probá a mano desde la raíz: `node .agents/hooks/personality-reinject.mjs` tiene que imprimir una línea que empieza con `OUTPUT CONTRACT`.

---

## 📚 Recursos

- **Codex MCP**: https://developers.openai.com/codex/mcp/
- **Arquitectura de tres harnesses**: `AGENTS.md` §5.5 y la página publicada [harnesses.es.html](https://upex-galaxy.github.io/agentic-dev-boilerplate/harnesses.es.html) (fuente: `packages/pages-home/harnesses.es.html`)
- **Capacidades MCP y búsqueda web**: `.agents/skills/agentic-dev-core/references/mcp-capabilities.md`
- **Sintaxis por host**: [`docs/mcp/mcp-configuration-guide.md`](../../mcp/mcp-configuration-guide.md)

