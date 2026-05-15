# agentic-dev-boilerplate

> AI-driven, skills-first boilerplate for software development. From product
> ideation to staging deployment, orchestrated by curated Claude Code skills.

[![TypeScript](https://img.shields.io/badge/TypeScript-5.8+-blue?logo=typescript)](https://www.typescriptlang.org/)
[![Bun](https://img.shields.io/badge/Bun-1.0+-black?logo=bun)](https://bun.sh/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

---

## Start here — pick your path

| Goal                                                               | What to read / run                                                                        |
| ------------------------------------------------------------------ | ----------------------------------------------------------------------------------------- |
| **Just install**                                                   | `bun install && bun run setup` (skip the rest)                                            |
| **See the repo's mental model before touching anything** (~30 min) | `bun run onboarding` — opens `docs/onboarding.html` with sidebar nav                      |
| **Methodology / philosophy / extension guide** (~25 min)           | [`docs/agentic-development-engineering.md`](docs/agentic-development-engineering.md)      |
| **Troubleshooting the installer**                                  | [`INSTALLER.md`](INSTALLER.md)                                                            |
| **You're an AI agent**                                             | [`CLAUDE.md`](CLAUDE.md) (operational rules) + [`CONTEXT.md`](CONTEXT.md) (knowledge map) |

> First-time clones: `bun run onboarding` is optional but recommended — it serves a single-file HTML with the full repo orientation. Close the browser tab + `Ctrl-C` the server when done, then run `bun run setup` to install.

---

## What this is

A project starter for teams that want AI agents to drive their development workflow end-to-end — from PRD to staging deploy — using composable skills tagged by phase of the Spec-Driven Development (SDD) lifecycle. Ten workflow skills cover foundation, management, and implementation; five utility slash commands cover the common chores around them. The QA half (sprint testing, test documentation, automation, regression) lives in [agentic-qa-boilerplate](https://github.com/upex-galaxy/agentic-qa-boilerplate) — the two repos are designed as a complementary pair.

---

## Quick start

```bash
# 1. Clone the boilerplate
git clone https://github.com/upex-galaxy/agentic-dev-boilerplate.git my-new-project
cd my-new-project

# 2. (Optional, recommended for first-timers) Install deps + open the orientation
bun install
bun run onboarding   # opens docs/onboarding.html with sidebar nav
                     # Close the tab + Ctrl-C when done

# 3. Install everything (gentle-ai, skills, MCPs, env)
#    installs deps if not done already, gentle-ai + 15 skills, community
#    skills, wires .env for the 5 MCPs (context7, tavily, atlassian,
#    supabase, n8n), and offers direnv autoload.
bun run setup

# Or, do it manually instead of step 3:
bun install
cp .env.example .env   # then fill in the values

# 4. Bootstrap project context (in Claude Code)
/agentic-dev-core          # scaffolds .agents/, scripts, CLAUDE.md

# 5. Define what to build (one-time)
/project-foundation    # Constitution, PRD, SRS, Discovery

# 5.5. Define visual identity (one-time, optional — invoked from foundation Phase 2.5)
/design-system         # DESIGN.md (Google Labs spec) — paleta, tipografía, tokens

# 6. Scaffold the codebase (one-time)
/project-bootstrap     # Backend, frontend, OpenAPI, env, auth (reads DESIGN.md if present)

# 7. Manage the backlog (continuous)
/product-management    # Seed backlog, refine stories, AC, edge cases

# 8. Implement (per story)
/sprint-development            # Plan -> Code -> Review -> Deploy
/unit-testing          # Composable mid-flight from sprint-development for TDD
```

> Don't chain `bun run onboarding && bun run setup` — the onboarding server is blocking, so chaining deadlocks. Run them as two separate steps.

### Launching the agent

`.mcp.json` (Claude Code) and `opencode.jsonc` are committed with `${VAR}` / `{env:VAR}` expansion — real values live in `.env`. Launch the agent via one of these paths so the env vars get loaded:

```bash
# Cross-platform default (uses dotenv-cli, no extra tooling required):
bun run claude        # Claude Code
bun run opencode      # OpenCode

# Optional: direnv autoload (any OS with direnv installed)
direnv allow          # one-time per repo (the installer offers to run this)
claude                # direct binary picks up .env from your shell
```

direnv works on macOS / Linux / Windows. On Windows install via `winget install direnv` — Git Bash is recommended; PowerShell support is experimental and requires direnv 2.37+. See [INSTALLER.md § Launching the agent](./INSTALLER.md#launching-the-agent-after-setup) for the per-shell hook lines.

---

## How it works

Skills auto-trigger from natural-language prompts that match each skill's `description` frontmatter; you can also force-load any of them via the slash trigger in Claude Code (e.g. `/sprint-development`). Each skill is a `SKILL.md` plus a `references/` folder that loads progressively — the agent only reads the files relevant to the current step.

Project-specific values (URLs, project key, Jira fields) live in `.agents/project.yaml` and are injected into prompts via a 4-syntax variable system. Workflow skills correspond to phases of the SDD lifecycle: foundation (one-time definition), management (continuous PM work), and implementation (per-story dev loop).

---

## Skills

### Workflow skills (auto-trigger)

| Skill                  | Phase          | Purpose                                                                              |
| ---------------------- | -------------- | ------------------------------------------------------------------------------------ |
| `/agentic-dev-core`    | bootstrap      | Bootstrap a new repo with foundation files (`.agents/`, scripts, `CLAUDE.md`)        |
| `/project-foundation`  | foundation     | Constitution + PRD + SRS + Discovery (one-time at conception)                        |
| `/design-system`       | foundation     | DESIGN.md generation (Google Labs spec) before frontend scaffolding — 5 paths        |
| `/project-bootstrap`   | foundation     | Backend / frontend / OpenAPI / auth / env scaffolding (one-time)                     |
| `/product-management`  | management     | Backlog seed, story refinement (INVEST), AC (Gherkin), edge cases                    |
| `/sprint-development`  | implementation | Per-story mega-orchestrator: Plan -> Code -> Review -> Staging -> (gated) Production |
| `/unit-testing`        | implementation | TDD, test naming, mocking patterns, coverage. Composable from `/sprint-development`  |
| `/git-flow-master`     | git            | End-to-end Git operator: branches, commits, push, PR, conflicts, chained-PR planning |
| `/acli`                | tooling        | Atlassian CLI cookbook for Jira Cloud + Confluence Cloud workflows                   |
| `/agentic-dev-onboard` | onboarding     | Walks new users through the repo's dev flow, MCPs, env vars, workflow skills         |

### Reusable community skills (installed by `bun run setup`)

These skills are not committed in this repo; the installer fetches them via `npx skills add` from upstream community repositories. The exact list lives in `cli/install.ts` (source of truth — it changes faster than this README, so consult the file directly).

After running `/project-foundation` and `/project-bootstrap`, you can also run `npx autoskills` to auto-detect your concrete stack and add more.

### Skill tiers (T1–T4)

The repo classifies every skill into one of four tiers. Each tier has different discovery and load rules. Full contract: [`.claude/skills/agentic-dev-core/references/skill-composition-strategy.md`](.claude/skills/agentic-dev-core/references/skill-composition-strategy.md).

| Tier | What                           | Location                                           | Load behavior                                               |
| ---- | ------------------------------ | -------------------------------------------------- | ----------------------------------------------------------- |
| T1   | Project-owned (this repo)      | `.claude/skills/`                                  | Silent — load on trigger                                    |
| T2   | Project dependency (gentle-ai) | Installed by gentle-ai (SDD bundle, judgment-day…) | Silent inside T1 orchestrators                              |
| T3   | Community project-level        | Installed by `install.ts` `PROJECT_LEVEL_SKILLS`   | Silent if matched by category                               |
| T4   | Community user-level (global)  | Installed by `install.ts` `USER_LEVEL_SKILLS`      | **ASK** user before load (cross-project, not always wanted) |

Validation: `bun run lint:skills` checks tier coherence (orphan categories, tier mismatches, missing sections, stale doc paths).

### Slash commands (utilities)

| Command                       | Purpose                                                                                           |
| ----------------------------- | ------------------------------------------------------------------------------------------------- |
| `/sync-ai-memory`             | Audit + sync README, CLAUDE.md, CONTEXT.md, docs/, and onboarding HTML against current repo state |
| `/business-data-map`          | Generate or update `.context/business/business-data-map.md`                                       |
| `/business-feature-map`       | Generate or update `.context/business/business-feature-map.md`                                    |
| `/business-api-map`           | Generate or update `.context/business/business-api-map.md`                                        |
| `/master-implementation-plan` | Generate or update `.context/master-implementation-plan.md`                                       |

---

## Repository structure

```
.claude/
├── skills/         # 10 workflow skills (community skills installed by bun run setup)
└── commands/       # 5 utility slash commands
.agents/
├── project.yaml          # Per-project variables (template)
├── jira-required.yaml    # Custom field + work_type manifest
├── jira-fields.json      # Workspace-resolved field IDs (regenerated per project)
├── jira-workflows.json   # Workspace-resolved workflows / statuses / transitions
└── README.md             # The .agents/ contract
.context/                 # Per-project context (PBI, PRD, SRS, business knowledge)
├── _framework/           # Auto-generated caches (skill-registry, testing-capabilities)
├── business/             # Constitution (business model, market context) + maps (data, feature, api)
├── PRD/                  # Product Requirements
├── SRS/                  # Software Requirements
└── PBI/                  # Per-epic + per-ticket memory
scripts/                  # CLI tooling: agents-lint, jira-sync, etc.
CLAUDE.md                 # Project memory loaded every AI session
CONTEXT.md                # Context Engineering canonical reference
DESIGN.md                 # Visual identity spec (Google Labs, generated by /design-system)
```

---

## Variables system

The `.agents/` directory hosts a 4-syntax variable system used by every skill and command.

| Syntax                         | Purpose                                      | Resolves from                                             |
| ------------------------------ | -------------------------------------------- | --------------------------------------------------------- |
| `{{VAR_NAME}}`                 | Static project value (flat or env-scoped)    | `.agents/project.yaml`                                    |
| `{{environments.<env>.<var>}}` | Explicit cross-env reference                 | `.agents/project.yaml` -> `environments.<env>.<var>`      |
| `<<VAR_NAME>>`                 | Session/runtime value (e.g. `<<ISSUE_KEY>>`) | Computed by the calling prompt at runtime                 |
| `{{jira.<slug>}}`              | Jira custom field reference                  | `.agents/jira-required.yaml` + `.agents/jira-fields.json` |

See `.agents/README.md` for the full contract.

**Validation scripts:**

```bash
bun run lint:agents        # Every {{VAR}} and {{jira.*}} reference resolves
bun run jira:sync-fields   # Discover Jira custom fields -> .agents/jira-fields.json
bun run jira:check         # Validate jira-required.yaml against jira-fields.json
```

---

## Common scripts

```bash
bun run lint              # Lint codebase
bun run lint:fix          # Auto-fix lint issues
bun run format            # Format with Prettier
bun run format:check      # Check formatting
bun up                    # Update template from upstream (interactive)
bun up --auto             # Non-interactive / CI mode (safe changes only, exit 0 always)
bun up --dry-run          # Preview what would change without writing anything
bun up --rollback         # Restore from most recent backup
bun run api:sync          # Sync OpenAPI spec + generate types
bun run lint:agents       # Validate {{VAR}} and {{jira.*}} references
bun run jira:sync-fields  # Sync Jira custom fields -> .agents/jira-fields.json
bun run jira:check        # Validate Jira manifest vs catalog
```

`bun up` ahora corre un sync per-archivo con tracking de SHAs por componente vía `.boilerplate-version.json` (schema v6). Detecta archivos modificados localmente y prompta resolución (`[t]heirs / [m]ine / [s]kip`). El flag `--auto` aplica cambios seguros y salta los diverged — ideal para CI o flujos no-interactivos (siempre exit 0). El flag `--dry-run` simula el sync completo sin escribir nada; `--rollback` restaura desde el directorio de backup más reciente (`.backups/update-{ISO-ts}/`). Requiere git ≥ 2.25 (partial clone). Primera corrida sin `.boilerplate-version.json`: bootstrap automático con bulk sync + escritura inicial del estado v6. Detalle del flujo y schema en el JSDoc header de `cli/update-boilerplate.ts` y vía `bun up --help`.

---

## Companion repo

Software testing — sprint-testing, test-documentation, test-automation, regression-testing — lives in [agentic-qa-boilerplate](https://github.com/upex-galaxy/agentic-qa-boilerplate). The two repos share the same `.agents/` variable system and `agentskills.io` skill layout, so a project can adopt both without duplication.

---

## Cross-agent compatibility

All skills declare `compatibility: [claude-code, copilot, cursor, codex, opencode]` per the [agentskills.io](https://agentskills.io) spec. Slash triggers are Claude Code specific; in other agents the same `description` triggers cause the skills to auto-activate from natural prompts. The variable system is agent-agnostic.

---

## Future hooks

The skill architecture leaves room for: per-phase model routing, an explicit skill registry, Engram-style cross-session memory, and CI-validated cross-agent portability. Notes in `CLAUDE.md`.

---

## License

MIT (or fill in)

---

## Status

Project renamed from `ai-driven-project-starter` to `agentic-dev-boilerplate`. See `.plans/MASTER-PLAN.md` for the migration story.

---

> **You are here**: Project overview for visitors. **Read time**: 5 min. **Next**: `bun run onboarding` for visual orientation, or [`INSTALLER.md`](INSTALLER.md) for installer details.
