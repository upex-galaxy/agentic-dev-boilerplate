# Investigación: gentle-ai ecosystem

> Documento de referencia para diseñar el installer de Fase 15.
> Investigado el 2026-05-09.
> Fuente: repositorio oficial Gentleman-Programming/gentle-ai (v1.26.5).

---

## TL;DR

**gentle-ai** es un configurador de ecosistema (CLI/TUI en Go) que toma cualquier agente de IA (Claude Code, OpenCode, Cursor, etc.) y lo potencia con:

- **Engram** — memoria persistente entre sesiones (MCP + CLI + almacenamiento local)
- **SDD** — flujo de Spec-Driven Development con 9 fases orchestradas (orchestrator + sub-agents)
- **20 skills embebidas** — SDD phases (sdd-init, sdd-explore, ..., sdd-onboard) + foundation (testing, workflow, GitHub, Jira)
- **Skills community** — React 19, Next.js 15, TypeScript, Tailwind 4, Zod 4, Zustand 5, Angular, Django, Playwright, pytest + más (repo separado: Gentleman-Skills)
- **Context7** — MCP server para documentación live de frameworks/librerías
- **GGA** — Gentleman Guardian Angel = AI provider switcher
- **Persona** — Teaching-oriented persona ("gentleman" o "neutral")
- **Permisos** — Defaults security-first
- **Tema** — Kanagawa theme overlay

**No es un instalador de agentes** — estos ya son fáciles de instalar. **Es un configurador** que sintoniza y enriquece lo que ya existe.

---

## Repos y URLs

| Repo                 | URL                                                       | Rol                                                                                                                                                       |
| -------------------- | --------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **gentle-ai**        | https://github.com/Gentleman-Programming/gentle-ai        | Principal: CLI/TUI, orchestrator, skills embebidas, installation logic                                                                                    |
| **Gentleman-Skills** | https://github.com/Gentleman-Programming/Gentleman-Skills | Community skills: React 19, Next.js 15, TypeScript, Tailwind 4, Zod, Zustand, Angular, Django, Playwright, pytest, Electron, Spring Boot 3, Java 21, etc. |
| **Gentleman.Dots**   | https://github.com/Gentleman-Programming/Gentleman.Dots   | Dev environment: Neovim, shells (Fish/Zsh), terminals (Tmux/Zellij/Ghostty). Complementario a gentle-ai (no es el mismo repo).                            |
| **engram**           | https://github.com/Gentleman-Programming/engram           | Binario + MCP de memoria persistente (instalado/synced via gentle-ai)                                                                                     |

---

## CLI: comandos

| Comando                        | Qué hace                                                                                                              | Args/Flags principales                                                                                                                                                                      | Ejemplo                                                                   |
| ------------------------------ | --------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------- |
| `gentle-ai` (sin args)         | TUI interactivo — guía visual para install/sync/uninstall                                                             | ninguno                                                                                                                                                                                     | `gentle-ai` → seleccionar agentes, componentes, skills, preset            |
| `gentle-ai install`            | Instalación inicial — detecta agentes, configura componentes, inyecta skills                                          | `--agent`, `--agents`, `--component`, `--components`, `--skill`, `--skills`, `--persona` (gentleman/neutral/custom), `--preset` (full-gentleman/ecosystem-only/minimal/custom), `--dry-run` | `gentle-ai install --agent claude-code --preset full-gentleman --dry-run` |
| `gentle-ai sync`               | Refresca assets managedos a versión actual. NO reinstala binarios, solo actualiza prompts, skills, MCP, orchestrators | `--agent`, `--agents`, `--component`, `--profile`, `--profile-phase`, `--sdd-profile-strategy`, `--include-permissions`, `--include-theme`                                                  | `gentle-ai sync --agent opencode --profile cheap:gemini/fast`             |
| `gentle-ai uninstall`          | Elimina config manageda (secciones de persona, MCP, skills) de agentes seleccionados. Crea backup antes.              | `--agent`, `--agents`, `--component`, `--components`, `--all`, `--yes`                                                                                                                      | `gentle-ai uninstall --agent claude-code --component sdd --yes`           |
| `gentle-ai update` / `upgrade` | Verifica e instala nueva versión del binario gentle-ai                                                                | ninguno                                                                                                                                                                                     | `gentle-ai update` → descarga, reemplaza binario, re-run `sync` luego     |
| `gentle-ai version`            | Muestra versión instalada                                                                                             | ninguno                                                                                                                                                                                     | `gentle-ai version`                                                       |

**Nota sobre interactividad**: El TUI es la experiencia principal — flags son para automation/scripting.

---

## Grupos / artifacts instalables

### 1. **Engram** (componente ID: `engram`)

**Qué instala/configura:**

- Binario global `engram` (Go binary) en `~/bin/` o PATH del sistema
- MCP server registration en `~/.claude/mcp/engram.json` (para Claude Code) y equivalentes en otros agentes
- Almacenamiento local `~/.engram/` (obsidian-like structure: `projects/{project-name}/observations/*.md`)
- Integración con git: auto-detección de project name desde remote
- Auto-dedup, auto-consolidation de projects con nombres similares

**Comandos CLI (engram binario):**

- `engram tui` — UI visual para browsear memories
- `engram sync` — export memories a `.engram/` (git-trackable)
- `engram sync --import` — import memories desde `.engram/` en otro machine
- `engram projects list` — lista todos los projects + counts
- `engram projects consolidate` — merge project names duplicados
- `engram search <query>` — quick search from terminal

**MCP tools disponibles (el agente usa estos automáticamente):**

- `mem_save` — guarda decisions, bugs, discoveries, conventions
- `mem_search` — búsqueda full-text
- `mem_context` — historial reciente (auto-llamado al session start)
- `mem_session_summary` — guarda resumen end-of-session
- `mem_get_observation` — retrieve full content por ID
- `mem_save_prompt` — guarda user prompt para dedup
- Avanzados: `mem_update`, `mem_suggest_topic_key`, `mem_session_start`, `mem_session_end`, `mem_stats`, `mem_delete`, `mem_timeline`, `mem_capture_passive`, `mem_merge_projects`

**Dependencias:** ninguna (binario standalone + MCP auto-integración)

---

### 2. **SDD** (Spec-Driven Development) (componente ID: `sdd`)

**Qué instala/configura:**

- **Orchestrator prompt** — inyectado en cada agente como `sdd-orchestrator.md` (o `gentle-orchestrator.md` en OpenCode)
- **9 SDD skills embebidas** — `sdd-init`, `sdd-explore`, `sdd-propose`, `sdd-spec`, `sdd-design`, `sdd-tasks`, `sdd-apply`, `sdd-verify`, `sdd-archive`
- **1 workflow skill adicional** — `sdd-onboard` (guided walkthrough en proyecto real)
- **Sub-agent delegation setup** — según el agente:
  - **Claude Code**: Task tool + orchestrator instructions
  - **OpenCode/Kilo Code**: `opencode.json` overlay multi-mode + agents array
  - **Cursor**: 10 agent files en `~/.cursor/agents/sdd-{phase}.md`
  - **Otros**: inline execution (solo-agent)

**Cómo funciona SDD:**

- El orchestrator "sugiere" SDD para features sustanciales, pero no lo fuerza
- User puede decir "usa sdd" o "hazlo con sdd" para explícitamente usarlo
- Las 9 fases se ejecutan en context aislados (sub-agents) o inline (solo-agent)
- Cada fase tiene output específico (proposal, spec, design, tasks, etc.)
- Engram persiste artifacts entre fases (explore data → proposal → spec, etc.)

**Dependencias:** Engram (para cross-phase persistence), skills (foundation + SDD)

---

### 3. **Skills** (componente ID: `skills`)

**Qué instala/configura:**

#### a) **20 skills embebidas** (en el binario gentle-ai, inyectadas en `~/.{agent}/skills/`)

**SDD skills (11 total):**

1. `sdd-init` — bootstrap SDD context en proyecto (detec stack, testing capabilities)
2. `sdd-explore` — investigar codebase antes de commiterse a cambio
3. `sdd-propose` — crear change proposal (intent, scope, approach)
4. `sdd-spec` — write specs (requirements, scenarios)
5. `sdd-design` — technical design (architecture decisions)
6. `sdd-tasks` — breakdown cambio en tasks implementables
7. `sdd-apply` — implement tasks siguiendo specs
8. `sdd-verify` — validate implementation vs specs
9. `sdd-archive` — sync delta specs → main specs, archive
10. `sdd-onboard` — guided end-to-end SDD walkthrough (learning)
11. `judgment-day` — parallel adversarial review (2 independent judges same target)

**Foundation skills (9 total):**

1. `go-testing` — Go testing patterns (Bubbletea TUI testing)
2. `skill-creator` — crear new AI agent skills
3. `branch-pr` — PR creation workflow (conventional commits, issue-first)
4. `issue-creation` — issue filing (bug + feature templates)
5. `skill-registry` — build compact project standards registry
6. `chained-pr` — plan + create stacked/chained PRs
7. `cognitive-doc-design` — write docs que reducen cognitive load
8. `comment-writer` — draft warm, direct collaboration comments
9. `work-unit-commits` — split implementation en reviewable work units

#### b) **Community skills** (repo Gentleman-Skills, instalación manual)

**Curated skills:**

**Frontend:**

- `angular/core` — standalone components, signals, inject, zoneless
- `angular/forms` — Signal Forms, Reactive Forms
- `angular/performance` — NgOptimizedImage, @defer, lazy loading, SSR
- `angular/architecture` — Scope Rule, project structure, file naming
- `react-19` — React 19 patterns con React Compiler
- `nextjs-15` — Next.js 15 App Router patterns
- `typescript` — TypeScript strict patterns
- `tailwind-4` — Tailwind CSS 4 patterns
- `zod-4` — Zod 4 schema validation
- `zustand-5` — Zustand 5 state management

**Backend & AI:**

- `ai-sdk-5` — Vercel AI SDK 5 patterns
- `django-drf` — Django REST Framework patterns

**Testing:**

- `playwright` — Playwright E2E testing
- `pytest` — Python pytest patterns

**Workflow:**

- `jira-task` — Jira task creation
- `jira-epic` — Jira epic creation

**Community skills:**

- `electron` — Electron desktop app patterns
- `elixir-antipatterns` — 8 critical Elixir/Phoenix anti-patterns
- `hexagonal-architecture-layers-java` — Java hexagonal architecture
- `java-21` — Java 21 language patterns
- `react-native` — React Native (Expo + bare workflow)
- `spring-boot-3` — Spring Boot 3 patterns

**Cómo funcionan las skills:**

- El **skill registry** (`.atl/skill-registry.md`) es built automaticamente por `/skill-registry` command
- Registry escanea user-level skills + project-level skills, lee frontmatter, mapea triggers
- Orchestrator lee el registry y **pre-resuelve skill paths** para sub-agents
- Sub-agents cargan skills relevantes según proyecto (React project → react-19, nextjs-15, etc.)
- Skills son MARKDOWN files con YAML frontmatter + instrucciones detalladas

**Instalación de community skills:**

```bash
# Clonar repo
git clone https://github.com/Gentleman-Programming/Gentleman-Skills.git

# Copiar skills curated a agent
cp -r Gentleman-Skills/curated/react-19 ~/.claude/skills/
cp -r Gentleman-Skills/curated/typescript ~/.claude/skills/

# O todo de una vez
cp -r Gentleman-Skills/curated/* ~/.claude/skills/
```

**Dependencias:** ninguna (embebidas en binario para foundation skills, manual para community)

---

### 4. **Context7** (componente ID: `context7`)

**Qué instala/configura:**

- MCP server registration en agentes
- Acceso a documentación live de 50+ frameworks/librerías (React, Next.js, Vue, Angular, Tailwind, Zod, Prisma, Express, Django, Spring Boot, etc.)
- Context7 es un servicio externo (no packaged en gentle-ai binary)

**Cómo funciona:**

- Agente invoca MCP tool "query-docs" con librería + query
- Context7 API retorna current docs (no training data cutoff)
- Muy útil para features nuevas, breaking changes, sintaxis actualizada

**Dependencias:** acceso a internet, Context7 API key (usually managed via gentle-ai setup)

---

### 5. **Persona** (componente ID: `persona`)

**Qué instala/configura:**

- Prompt instructions inyectado en agente
- 2 opciones:
  - **`gentleman`** — teaching-oriented mentor, pushes back on bad practices, explains the why
  - **`neutral`** — same philosophy, no regional language, warm & professional
  - **`custom`** — keep existing persona unmanaged (gentle-ai no toca nada)

**Inyección:**

- Claude Code: `~/.claude/CLAUDE.md` (append sección manageda con marker)
- OpenCode: `~/.config/opencode/opencode.json` (system prompt en agent)
- Cursor: `~/.cursor/agents/` (included en agent files)
- Otros: similar, path depende del agente

**Dependencias:** ninguna (parte de install logic)

---

### 6. **Permissions** (componente ID: `permissions`)

**Qué instala/configura:**

- Security-first defaults en `~/.claude/settings.json` (o agente-equivalente)
- Guardrails para: shell access, file read/write, MCP tools, API calls
- Granular per-tool/MCP server permissions

**Qué deja OUT by default:**

- Dangerous bash commands (rm -rf, etc.)
- Unvetted MCP servers
- Destructive file operations sin confirmation

**Dependencias:** ninguna (configuration only)

---

### 7. **GGA** (Gentleman Guardian Angel) (componente ID: `gga`)

**Qué instala/configura:**

- Binario global `gga` (AI provider switcher)
- Permite switch entre múltiples AI providers (Claude, OpenAI, Gemini, etc.)
- **IMPORTANTE:** global install solo provisiona el binario. **NO** hace project-level setup automáticamente.
- Project-level setup es explícito: `gga init` / `gga install` per repo

**Dependencias:** go (para compilar) o binario pre-built

---

### 8. **Theme** (componente ID: `theme`)

**Qué instala/configura:**

- Kanagawa Rose Pine color scheme overlay en agent config
- Affects terminal output, syntax highlighting si aplica

**Dependencias:** ninguna (cosmetic, optional)

---

### 9. **Backups** (automático en todos los commands)

**Behavior:**

- `gentle-ai install`, `sync`, `upgrade` crean snapshots antes de cambios
- Backups: comprimidos (tar.gz), dedup (si config es idéntico, skip), auto-pruned (keep 5 most recent)
- Pinning: user puede marcar important backups (protected from pruning)
- Restore: via TUI o `gentle-ai restore <timestamp>` o `gentle-ai restore latest`

**Paths:**

- Almacenados en agent-specific backup dirs (ej: `~/.claude/.backups/`, etc.)

---

## Settings injection (CRÍTICO)

### Niveles de configuración en gentle-ai

gentle-ai modifica configuración en **múltiples niveles** y con **markers para safe merging**:

#### A. **User-level** (`~/.claude/`, `~/.config/opencode/`, etc.)

**CLAUDE.md (`~/.claude/CLAUDE.md`):**

- gentle-ai inyecta secciones con markers:

  ```markdown
  <!-- gentle-ai:engram-protocol -->

  [instrucciones engram + MCP registration]

  <!-- /gentle-ai:engram-protocol -->

  <!-- gentle-ai:sdd-orchestrator -->

  [orchestrator prompts para 9 fases SDD]

  <!-- /gentle-ai:sdd-orchestrator -->

  <!-- gentle-ai:persona -->

  [teaching-oriented persona instructions]

  <!-- /gentle-ai:persona -->
  ```

- Markers permiten que user edite su propio contenido sin conflictos
- On sync/upgrade: gentle-ai reemplaza SOLO el contenido dentro de markers

**settings.json (`~/.claude/settings.json`):**

- gentle-ai inyecta:
  - `permissions` — security-first defaults
  - `mcp.servers` — Context7, Engram MCP endpoints
  - `hooks` — if needed para orchestration
- Preserva user settings fuera de managed keys

**mcp/ (`~/.claude/mcp/`):**

- MCP server configs para Engram, Context7, GGA (si aplica)

**skills/ (`~/.claude/skills/`):**

- Embebidas: 20 skills en SKILL.md files
- Community: user-instaladas manually

#### B. **Project-level** (`.claude/CLAUDE.md`, `.claude/settings.json` en proyecto)

- Si proyecto tiene `.claude/CLAUDE.md`: gentle-ai puede inyectar project-level orchestrator
- `.claude/settings.json`: project-specific permissions

#### C. **Agent-specific paths**

| Agent           | Paths principales                                                                               |
| --------------- | ----------------------------------------------------------------------------------------------- |
| Claude Code     | `~/.claude/CLAUDE.md`, `~/.claude/settings.json`, `~/.claude/mcp/`, `~/.claude/skills/`         |
| OpenCode        | `~/.config/opencode/opencode.json`, `~/.config/opencode/mcp.json`, `~/.config/opencode/skills/` |
| Cursor          | `~/.cursor/agents/`, `~/.cursor/mcp.json`, `~/.cursor/skills/`                                  |
| VS Code Copilot | `%APPDATA%\Code\User\settings.json`, `~/.copilot/skills/`, `~/.copilot/mcp.json`                |
| Gemini CLI      | `~/.gemini/agents/`, `~/.gemini/mcp.json`, `~/.gemini/skills/`                                  |
| Codex           | `~/.codex/config.toml`, `~/.codex/mcp.json`, `~/.codex/skills/`                                 |
| Windsurf        | `~/.codeium/windsurf/mcp_config.json`, `~/.codeium/windsurf/skills/`                            |
| Kiro IDE        | `~/.kiro/agents/`, `~/.kiro/settings/mcp.json`, `~/.kiro/skills/`                               |
| Qwen Code       | `~/.qwen/QWEN.md`, `~/.qwen/settings.json`, `~/.qwen/commands/`, `~/.qwen/skills/`              |

### File merging strategy

gentle-ai usa **marker-based file merging** (no clobber):

1. Detecta markers existentes en files
2. Reemplaza contenido SOLO entre markers
3. Preserva user content fuera de markers
4. Safe para múltiples runs + user edits simultáneamente

**Ej:** User edit a `~/.claude/CLAUDE.md` fuera del `<!-- gentle-ai:persona -->` block → preservado on sync.

### Desinstalación / Cleanup

```bash
# Remove ALL managed config de agentes
gentle-ai uninstall --all

# Remove SOLO componentes específicos
gentle-ai uninstall --agent claude-code --component sdd,persona

# Dry-run primero
gentle-ai uninstall --agent claude-code --component sdd --dry-run
```

**Behavior:**

- Elimina secciones managedas (dentro de markers)
- Restaura desde backup si hay issues
- No toca user edits fuera de managed sections

---

## Catálogo completo de skills

### Skills embebidas (20 total)

| Slug                   | Tipo         | Descripción                                                                                  | Trigger                                                         | Aplica a Dev-only Next.js + Supabase?        |
| ---------------------- | ------------ | -------------------------------------------------------------------------------------------- | --------------------------------------------------------------- | -------------------------------------------- |
| `sdd-init`             | SDD Phase    | Bootstrap SDD context, detect stack, testing capabilities, activate Strict TDD if available  | `/sdd-init` cuando entras a nuevo proyecto                      | **SÍ** — recomendado en el primer commit     |
| `sdd-explore`          | SDD Phase    | Investigate codebase, understand structure, identify patterns antes de cambios               | Automático si feature es sustancial; o `/sdd-explore` explícito | **SÍ** — muy útil en refactors grandes       |
| `sdd-propose`          | SDD Phase    | Create change proposal (intent, scope, approach, trade-offs)                                 | Automático en SDD; o `/sdd-propose`                             | **SÍ** — antes de major features             |
| `sdd-spec`             | SDD Phase    | Write specifications (requirements, scenarios, edge cases, testing)                          | Automático en SDD; o `/sdd-spec`                                | **SÍ** — core del process                    |
| `sdd-design`           | SDD Phase    | Technical design (architecture decisions, component boundaries, data flow)                   | Automático en SDD; o `/sdd-design`                              | **SÍ** — recomendado para features grandes   |
| `sdd-tasks`            | SDD Phase    | Break down change into implementation tasks (work units, dependencies)                       | Automático en SDD; o `/sdd-tasks`                               | **SÍ** — mejora clarity en PRs               |
| `sdd-apply`            | SDD Phase    | Implement tasks following specs and design (step-by-step coding)                             | Automático en SDD; o `/sdd-apply`                               | **SÍ** — implementation guidance             |
| `sdd-verify`           | SDD Phase    | Validate implementation matches specs (test coverage, edge cases, performance)               | Automático en SDD; o `/sdd-verify`                              | **SÍ** — QA crítico                          |
| `sdd-archive`          | SDD Phase    | Sync delta specs → main specs, archive SDD artifacts                                         | Final phase en SDD; o `/sdd-archive`                            | **DEPENDE** — si mantienes specs versionadas |
| `sdd-onboard`          | SDD Workflow | Guided end-to-end SDD walkthrough on real codebase (learning tool)                           | `/sdd-onboard` — learning mode                                  | **SÍ** — excelente para onboard nuevos devs  |
| `judgment-day`         | Review Skill | Parallel adversarial review — 2 independent judges review same target, compare verdicts      | `/judgment-day` para pre-landing review                         | **SÍ** — mejora quality antes de merge       |
| `go-testing`           | Foundation   | Go testing patterns (unit, table-driven, Bubbletea TUI testing)                              | Cuando escribes tests en Go                                     | **NO** — aplicable solo si usas Go           |
| `skill-creator`        | Foundation   | Create new AI agent skills siguiendo Agent Skills spec                                       | `/skill-creator` cuando necesitas custom skills                 | **DEPENDE** — si planeas crear skills custom |
| `branch-pr`            | Foundation   | PR creation workflow (conventional commits, branch naming, issue-first enforcement)          | `/branch-pr` cuando creas PRs                                   | **SÍ** — estándar workflow                   |
| `issue-creation`       | Foundation   | Issue filing workflow (bug report + feature request templates)                               | `/issue-creation` cuando reportas bugs/features                 | **SÍ** — standardized issues                 |
| `skill-registry`       | Foundation   | Build compact project standards registry from installed skills                               | `/skill-registry` después de instalar/cambiar skills            | **SÍ** — recomendado una vez al inicio       |
| `chained-pr`           | Foundation   | Plan y create stacked/chained pull requests (cuando cambio es muy grande)                    | `/chained-pr` para large refactors                              | **DEPENDE** — si hacés large refactors       |
| `cognitive-doc-design` | Foundation   | Write docs que reducen cognitive load para readers/reviewers                                 | `/cognitive-doc-design` cuando escribís docs                    | **SÍ** — mejora docs quality                 |
| `comment-writer`       | Foundation   | Draft warm, direct collaboration comments, PR feedback, issue replies                        | `/comment-writer` cuando respondés reviews                      | **SÍ** — communication skill                 |
| `work-unit-commits`    | Foundation   | Split implementation en reviewable work units/commits (similar a chained-pr pero per-commit) | `/work-unit-commits` en large refactors                         | **DEPENDE** — workflow preference            |

### Community skills (Gentleman-Skills repo)

| Slug                                  | Categoría    | Descripción                                              | Trigger                        | Aplica a Dev-only Next.js + Supabase?       |
| ------------------------------------- | ------------ | -------------------------------------------------------- | ------------------------------ | ------------------------------------------- |
| `react-19`                            | Frontend     | React 19 patterns con React Compiler                     | Escribir React components      | **SÍ** — core tech stack                    |
| `nextjs-15`                           | Frontend     | Next.js 15 App Router, Server Components, streaming      | Trabajar en Next.js            | **SÍ** — core tech stack                    |
| `typescript`                          | Frontend     | TypeScript strict patterns, generics, utility types      | Escribir TypeScript            | **SÍ** — core tech stack                    |
| `tailwind-4`                          | Frontend     | Tailwind CSS 4 patterns, composability                   | Styling                        | **SÍ** — probable (si usas Tailwind)        |
| `zod-4`                               | Frontend     | Zod 4 schema validation                                  | Form validation, API contracts | **SÍ** — común en Next.js + Supabase        |
| `zustand-5`                           | Frontend     | Zustand 5 state management                               | Client-side state              | **DEPENDE** — si necesitas global state     |
| `ai-sdk-5`                            | Backend      | Vercel AI SDK 5 patterns (streaming, tool calling, etc.) | Building AI chat features      | **DEPENDE** — si integras AI features       |
| `django-drf`                          | Backend      | Django REST Framework patterns                           | Django API building            | **NO** — este project es Next.js, no Django |
| `playwright`                          | Testing      | Playwright E2E testing patterns                          | E2E tests                      | **SÍ** — recomendado para full-stack        |
| `pytest`                              | Testing      | Python pytest patterns                                   | Python testing                 | **NO** — no hay Python en este stack        |
| `angular/core`, `angular/forms`, etc. | Frontend     | Angular patterns                                         | N/A — project es React/Next.js | **NO** — incompatible                       |
| `electron`                            | Desktop      | Electron desktop app patterns                            | Desktop app building           | **NO** — web app, not desktop               |
| `spring-boot-3`                       | Backend      | Spring Boot 3 patterns                                   | Java backend                   | **NO** — stack es Next.js/Supabase          |
| `java-21`                             | Backend      | Java 21 language patterns                                | Java development               | **NO** — stack es Next.js/Supabase          |
| `react-native`                        | Mobile       | React Native patterns (Expo, bare workflow)              | React Native apps              | **DEPENDE** — si planeas mobile             |
| `hexagonal-architecture-layers-java`  | Architecture | Hexagonal architecture (Java)                            | Java architecture              | **NO** — stack es Next.js/Supabase          |
| `elixir-antipatterns`                 | Language     | Elixir/Phoenix anti-patterns                             | Elixir development             | **NO** — stack es JavaScript/TypeScript     |
| `jira-task`, `jira-epic`              | Workflow     | Jira task/epic creation                                  | Jira integration               | **DEPENDE** — si usas Jira                  |

---

## Catálogo de agentes soportados

| Agent               | ID               | Skills       | MCP | Delegation                   | Multi-mode SDD?                  | Config Path             |
| ------------------- | ---------------- | ------------ | --- | ---------------------------- | -------------------------------- | ----------------------- |
| **Claude Code**     | `claude-code`    | Yes          | Yes | Full (Task tool)             | No                               | `~/.claude`             |
| **OpenCode**        | `opencode`       | Yes          | Yes | Full (multi-mode overlay)    | **Yes** ← mejor para multi-model | `~/.config/opencode`    |
| **Kilo Code**       | `kilocode`       | Yes          | Yes | Full (multi-mode overlay)    | **Yes**                          | `~/.config/kilo`        |
| **Gemini CLI**      | `gemini-cli`     | Yes          | Yes | Full (experimental)          | No                               | `~/.gemini`             |
| **Cursor**          | `cursor`         | Yes          | Yes | Full (native subagents)      | No                               | `~/.cursor`             |
| **VS Code Copilot** | `vscode-copilot` | Yes          | Yes | Full (runSubagent)           | No                               | `~/.copilot`            |
| **Codex**           | `codex`          | Yes          | Yes | Solo-agent                   | No                               | `~/.codex`              |
| **Windsurf**        | `windsurf`       | Yes (native) | Yes | Solo-agent                   | No                               | `~/.codeium/windsurf`   |
| **Antigravity**     | `antigravity`    | Yes (native) | Yes | Solo-agent + Mission Control | No                               | `~/.gemini/antigravity` |
| **Kimi Code**       | `kimi`           | Yes          | Yes | Full (native custom agents)  | No                               | `~/.kimi`               |
| **Kiro IDE**        | `kiro-ide`       | Yes          | Yes | Full (native subagents)      | Yes (via model: frontmatter)     | `~/.kiro`               |
| **Qwen Code**       | `qwen-code`      | Yes          | Yes | Full (native sub-agents)     | No                               | `~/.qwen`               |

**Notas por agente:**

- **Claude Code**: Task tool for sub-agents + orchestrator instructions
- **OpenCode/Kilo Code**: Multi-mode profiles = assign different models per SDD phase. `gentle-orchestrator` es el default, custom profiles son `sdd-orchestrator-{name}`
- **Cursor**: 10 agent files en `~/.cursor/agents/sdd-{phase}.md`, auto-delegation via description frontmatter
- **VS Code Copilot**: runSubagent + orchestrator
- **Codex, Windsurf, Antigravity**: Solo-agent (no custom sub-agents)
- **Kiro IDE**: Native multi-mode via `KiroModelAssignments` + model: field en agent files

---

## Casos de uso típicos

### Caso 1: Setup nuevo proyecto con gentle-ai (Full-Gentleman)

```bash
# 1. Instalar gentle-ai
brew install gentle-ai  # macOS
# O: go install github.com/Gentleman-Programming/gentle-ai/cmd/gentle-ai@latest

# 2. Ejecutar installer
gentle-ai
# Seleccionar:
# - Agent: Claude Code (o múltiples)
# - Preset: full-gentleman (o ecosystem-only)
# - Persona: gentleman (o neutral)
# - Confirm

# 3. Dentro del proyecto
cd my-project
/sdd-init              # Detect stack, setup Strict TDD si aplica
/skill-registry        # Scan skills, build registry

# 4. Usar SDD
/sdd-propose           # Plan change
/sdd-spec              # Write spec
/sdd-design            # Design
/sdd-tasks             # Break into tasks
/sdd-apply             # Implement
/sdd-verify            # QA
/sdd-archive           # Archive spec, persist learnings
```

**Tiempo total:** ~5 min (install) + project-level commands on-demand

---

### Caso 2: Agregar engram a proyecto existente (minimal setup)

```bash
# Ya tenés gentle-ai instalado
gentle-ai sync --component engram --agent claude-code

# Engram binario + MCP registration automático
# Agora Claude Code tiene memory persistente

# Verificar
engram projects list
engram tui  # Browse memories
```

---

### Caso 3: OpenCode con multi-mode SDD profiles (3 modelos diferentes)

```bash
# 1. Setup inicial
gentle-ai install --agent opencode --preset full-gentleman

# 2. Crear profiles
gentle-ai sync --agent opencode --profile cheap:claude/haiku
gentle-ai sync --agent opencode --profile premium:claude/opus
gentle-ai sync --agent opencode --profile fast:gemini/fast

# 3. En OpenCode, presionar Tab → switch entre:
#    - gentle-orchestrator (default)
#    - sdd-orchestrator-cheap (haiku para todo)
#    - sdd-orchestrator-premium (opus para todo)
#    - sdd-orchestrator-fast (gemini para todo)

# 4. Usar SDD → automáticamente usa profile activo
/sdd-propose
```

---

### Caso 4: Cursor con native sub-agents (10 phase agents)

```bash
# 1. Install
gentle-ai install --agent cursor --preset ecosystem-only

# 2. gentle-ai escribe 10 files: ~/.cursor/agents/sdd-{phase}.md
#    Cada uno con full orchestrator + phase-specific instructions

# 3. Cursor auto-detecta agents (native integration)
#    Cuando llamas /sdd-propose → Cursor delega a sdd-propose agent automáticamente

# 4. Sub-agents pueden descubrir skills desde .atl/skill-registry.md
```

---

### Caso 5: Community skills (React 19 + Tailwind 4 en proyecto Next.js)

```bash
# 1. Clone Gentleman-Skills
git clone https://github.com/Gentleman-Programming/Gentleman-Skills.git
cd Gentleman-Skills

# 2. Copy curated skills a Claude Code
cp -r curated/react-19 ~/.claude/skills/
cp -r curated/nextjs-15 ~/.claude/skills/
cp -r curated/typescript ~/.claude/skills/
cp -r curated/tailwind-4 ~/.claude/skills/

# 3. En el proyecto, rebuild registry
/skill-registry

# 4. Ahora cuando escribís React components → agent carga react-19 skill automáticamente
#    TypeScript code → typescript skill
#    Tailwind classes → tailwind-4 skill
```

---

## Compatibilidad

### Plataformas soportadas

| Plataforma                    | Architecture  | Package Manager   | Status                                               |
| ----------------------------- | ------------- | ----------------- | ---------------------------------------------------- |
| macOS (Apple Silicon + Intel) | arm64, x86_64 | Homebrew          | ✓ Full support                                       |
| Linux (Ubuntu/Debian)         | x86_64, arm64 | apt + Homebrew    | ✓ Full support                                       |
| Linux (Arch)                  | x86_64        | pacman + Homebrew | ✓ Full support                                       |
| Linux (Fedora/RHEL)           | x86_64, arm64 | dnf               | ✓ Full support                                       |
| Windows 10/11                 | x86_64, arm64 | winget            | ✓ Full support (via PowerShell installer + Git Bash) |

**Derivados de Linux** (Linux Mint, Pop!\_OS, Manjaro, EndeavourOS, CentOS Stream, Rocky Linux, AlmaLinux, etc.) auto-detectados via `ID_LIKE` en `/etc/os-release`.

### Agentes soportados (matriz de compatibilidad)

| Feature            | Claude Code | OpenCode    | Kilo        | Gemini | Cursor | VS Code | Codex | Windsurf | Antigravity  | Kiro | Qwen |
| ------------------ | ----------- | ----------- | ----------- | ------ | ------ | ------- | ----- | -------- | ------------ | ---- | ---- |
| SDD orchestrator   | ✓           | ✓           | ✓           | ✓      | ✓      | ✓       | ✓     | ✓        | ✓            | ✓    | ✓    |
| Single-mode SDD    | ✓           | ✓           | ✓           | ✓      | ✓      | ✓       | ✓     | ✓        | ✓            | ✓    | ✓    |
| Multi-mode SDD     | —           | ✓           | ✓           | —      | —      | —       | —     | —        | —            | ✓    | —    |
| Native sub-agents  | ✓ (Task)    | ✓ (overlay) | ✓ (overlay) | ✓      | ✓      | ✓       | —     | —        | ✓ (built-in) | ✓    | ✓    |
| Skills injection   | ✓           | ✓           | ✓           | ✓      | ✓      | ✓       | ✓     | ✓        | ✓            | ✓    | ✓    |
| MCP servers        | ✓           | ✓           | ✓           | ✓      | ✓      | ✓       | ✓     | ✓        | ✓            | ✓    | ✓    |
| Engram integration | ✓           | ✓           | ✓           | ✓      | ✓      | ✓       | ✓     | ✓        | ✓            | ✓    | ✓    |
| Persona injection  | ✓           | ✓           | ✓           | ✓      | ✓      | ✓       | ✓     | ✓        | ✓            | ✓    | ✓    |

### Requisitos de sistema

**Binario gentle-ai:**

- Go 1.24+
- 15-20 MB disk space
- Internet connection (para download + sync remote assets)

**Dependencies detectadas automáticamente:**

- git
- curl
- node/npm (si configurás agentes que lo necesitan)
- brew/apt/pacman/dnf/winget (según plataforma)

---

## Recomendaciones para Fase 15 del repo destino

### Contexto

El repo `ai-driven-project-starter` es un **dev-only** boilerplate para Next.js + Supabase con un instalador propio que va a integrar gentle-ai como "delegado de base".

### Estrategia recomendada: Dual installer

**Instalador Fase 15 = Dos componentes:**

1. **Delegado a gentle-ai** — instala base ecosystem
2. **Setup específico nuestro** — agrega customizaciones del boilerplate

```bash
# Conceptual flow:
gentle-ai install --preset ecosystem-only --agent <user-choice> \
  [+ persona + skills core SDD + engram + context7]

# LUEGO:
./scripts/setup-boilerplate.sh [adicional:
  - verify CLIs externos específicos (bun?, supabase CLI, etc.)
  - copy/symlink boilerplate-specific skills/agents
  - inyectar project CLAUDE.md si aplica
  - setup hooks si aplica (pre-commit, etc.)
  - initialize `.plans/` structure
  - initialize `.engram/` si user quiere git-trackable memory
]
```

### Qué instalar via gentle-ai (recomendado)

**Componentes "core":**

- ✅ **Engram** — memoria persistente invaluable
- ✅ **SDD** — orchestrator + 9 skills es standard
- ✅ **Skills foundation** (all 9) — muy útiles
- ✅ **Context7** — documentación live es game-changer
- ✅ **Persona** (gentleman o neutral) — teaching value
- ✅ **Permissions** — security defaults
- ⚠️ **GGA** — optional, if planning multi-provider support
- ⚠️ **Theme** — cosmetic, optional

**Preset recomendado:** `ecosystem-only` (Engram + SDD + Skills + Context7 + GGA, menos Permissions/Theme)

### Qué personalizar (Fase 15 boilerplate setup)

**Community skills a pre-instalar:**

```bash
# Copy automáticamente a skills directory
- react-19
- nextjs-15
- typescript
- tailwind-4
- zod-4
- zustand-5 (si planea state management)
- playwright (si hacer E2E)
- ai-sdk-5 (si integra AI features)
```

**Project-level customizations:**

- `.plans/` estructura (GENTLE-AI-RESEARCH.md ya existe; agregar PROJECT-SETUP.md, PHASE-15-INSTALLER.md, etc.)
- `.engram/` (opcional pero recomendado para team sharing)
- Boilerplate-specific agents/skills (si aplica)
- Pre-configured OpenSpec config (`.kiro/specs/` estructura si es relevante)

**Hooks to consider:**

- Pre-commit: `/skill-registry` auto-run si cambio skills
- Post-install: verify Supabase CLI, bun version, etc.

### Qué NO instalar via gentle-ai

- **Binarios específicos del boilerplate** (bun, supabase CLI, etc.) — manejarlos fuera
- **Custom personas/rules** — dejar user choice via `--persona custom`
- **Large upstream deps** — rely en gentle-ai's lightweight approach

### Desinstalación graceful

Si user quiere "rollback" Fase 15:

```bash
# Remover gentle-ai managed config
gentle-ai uninstall --all --yes

# User puede seguir usando su agent sin SDD/memory/skills
# No hay datos perdidos (backups automáticos)
```

### Consideraciones para CLI design Fase 15

**Instalador principal debe:**

1. Detectar si gentle-ai ya está instalado
2. Si no: ofrecer instalar con preset recomendado + preguntar agentes
3. Si ya: ofrecer re-sync + customizations boilerplate
4. Hacer setup project-level (`/sdd-init`, `/skill-registry`) automático
5. Crear `.plans/PROJECT-SETUP.md` con instrucciones específicas del user

**Ejemplo flujo:**

```bash
./install.sh
# Detects: "gentle-ai not found"
# Proposes: "Install gentle-ai ecosystem? (Y/n)"
# -> Runs: `gentle-ai install --preset ecosystem-only --agent <detected>`
# -> Copies: community skills (react-19, nextjs-15, etc.)
# -> Runs: `/sdd-init` (in current project context)
# -> Creates: `.plans/PROJECT-SETUP.md` (instructions for this boilerplate)
```

---

## Referencias

**Repos oficiales:**

- https://github.com/Gentleman-Programming/gentle-ai — CLI/TUI principal
- https://github.com/Gentleman-Programming/Gentleman-Skills — Community skills
- https://github.com/Gentleman-Programming/engram — Memory persistence
- https://github.com/Gentleman-Programming/Gentleman.Dots — Dev environment (complementario)

**Documentación core (en gentle-ai README + docs/):**

- [README.md](https://github.com/Gentleman-Programming/gentle-ai/blob/main/README.md) — overview, quick start, features
- [intended-usage.md](https://github.com/Gentleman-Programming/gentle-ai/blob/main/docs/intended-usage.md) — mental model (READ FIRST)
- [usage.md](https://github.com/Gentleman-Programming/gentle-ai/blob/main/docs/usage.md) — CLI commands, flags, workflows
- [agents.md](https://github.com/Gentleman-Programming/gentle-ai/blob/main/docs/agents.md) — agent matrix, delegation models
- [components.md](https://github.com/Gentleman-Programming/gentle-ai/blob/main/docs/components.md) — skills, presets, GGA
- [platforms.md](https://github.com/Gentleman-Programming/gentle-ai/blob/main/docs/platforms.md) — OS support, config paths
- [engram.md](https://github.com/Gentleman-Programming/gentle-ai/blob/main/docs/engram.md) — memory commands, MCP tools
- [opencode-profiles.md](https://github.com/Gentleman-Programming/gentle-ai/blob/main/docs/opencode-profiles.md) — multi-mode SDD (OpenCode)
- [rollback.md](https://github.com/Gentleman-Programming/gentle-ai/blob/main/docs/rollback.md) — backup/restore behavior
- [architecture.md](https://github.com/Gentleman-Programming/gentle-ai/blob/main/docs/architecture.md) — internal codebase map

**Latest release:**

- [v1.26.5](https://github.com/Gentleman-Programming/gentle-ai/releases/tag/v1.26.5) (2026-05-09 research date)

---

**Investigación completada:** 2026-05-09 | Fuente: lectura completa + extracts de 12+ documentos oficiales
