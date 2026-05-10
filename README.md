# agentic-dev-boilerplate

> AI-driven, skills-first boilerplate for software development. From product
> ideation to staging deployment, orchestrated by curated Claude Code skills.

[![TypeScript](https://img.shields.io/badge/TypeScript-5.8+-blue?logo=typescript)](https://www.typescriptlang.org/)
[![Bun](https://img.shields.io/badge/Bun-1.0+-black?logo=bun)](https://bun.sh/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

---

## What this is

A project starter for teams that want AI agents to drive their development workflow end-to-end — from PRD to staging deploy — using composable skills tagged by phase of the Spec-Driven Development (SDD) lifecycle. Nine workflow skills cover foundation, management, and implementation; four utility slash commands cover the common chores around them. The QA half (sprint testing, test documentation, automation, regression) lives in [agentic-qa-boilerplate](https://github.com/upex-galaxy/agentic-qa-boilerplate) — the two repos are designed as a complementary pair.

---

## Quick start

```bash
# 1. Clone the boilerplate
git clone https://github.com/upex-galaxy/agentic-dev-boilerplate.git my-new-project
cd my-new-project

# 2. Install deps
bun install

# 3. Run interactive installer (gentle-ai + MCPs + CLIs verification)
bun run setup

# 4. Bootstrap project context (in Claude Code)
/agentic-dev-core          # scaffolds .agents/, scripts, CLAUDE.md

# 5. Define what to build (one-time)
/project-foundation    # Constitution, PRD, SRS, Discovery

# 6. Scaffold the codebase (one-time)
/project-bootstrap     # Backend, frontend, OpenAPI, env, auth

# 7. Manage the backlog (continuous)
/product-management    # Seed backlog, refine stories, AC, edge cases

# 8. Implement (per story)
/sprint-dev            # Plan -> Code -> Review -> Deploy
/unit-testing          # Composable mid-flight from sprint-dev for TDD
```

---

## How it works

Skills auto-trigger from natural-language prompts that match each skill's `description` frontmatter; you can also force-load any of them via the slash trigger in Claude Code (e.g. `/sprint-dev`). Each skill is a `SKILL.md` plus a `references/` folder that loads progressively — the agent only reads the files relevant to the current step.

Project-specific values (URLs, project key, Jira fields) live in `.agents/project.yaml` and are injected into prompts via a 4-syntax variable system. Workflow skills correspond to phases of the SDD lifecycle: foundation (one-time definition), management (continuous PM work), and implementation (per-story dev loop).

---

## Skills

### Workflow skills (auto-trigger)

| Skill                  | Phase          | Purpose                                                                              |
| ---------------------- | -------------- | ------------------------------------------------------------------------------------ |
| `/agentic-dev-core`        | bootstrap      | Bootstrap a new repo with foundation files (`.agents/`, scripts, `CLAUDE.md`)        |
| `/project-foundation`  | foundation     | Constitution + PRD + SRS + Discovery (one-time at conception)                        |
| `/project-bootstrap`   | foundation     | Backend / frontend / OpenAPI / auth / env scaffolding (one-time)                     |
| `/product-management`  | management     | Backlog seed, story refinement (INVEST), AC (Gherkin), edge cases                    |
| `/sprint-dev`          | implementation | Per-story mega-orchestrator: Plan -> Code -> Review -> Staging -> (gated) Production |
| `/unit-testing`        | implementation | TDD, test naming, mocking patterns, coverage. Composable from `/sprint-dev`          |
| `/git-flow-master`     | git            | End-to-end Git operator: branches, commits, push, PR, conflicts, chained-PR planning |
| `/acli`                | tooling        | Atlassian CLI cookbook for Jira Cloud + Confluence Cloud workflows                   |
| `/agentic-dev-onboard` | onboarding     | Walks new users through the repo's dev flow, MCPs, env vars, workflow skills         |

### Reusable community skills (installed by `bun run setup`)

These skills are not committed in this repo; the installer fetches them via `npx skills add` from upstream community repositories. The installer recommends a curated stack-aware list (Next.js, React, shadcn/ui, Supabase, Vercel, etc.) at project level, plus a smaller cross-cutting set at user level (`skill-creator`, `gh-cli`, `find-skills`, `playwright-cli`, `n8n-skills`, `ui-ux-pro-max`, `frontend-design`, etc.). After running `/project-foundation` and `/project-bootstrap`, you can also run `npx autoskills` to auto-detect your stack and add more.

### Slash commands (utilities)

| Command                      | Purpose                                                                     |
| ---------------------------- | --------------------------------------------------------------------------- |
| `/project-doc-setup`         | Regenerate `README.md` and `CLAUDE.md` from current repo state              |
| `/context-engineering-setup` | Set up `.context/` (business-data-map, api-architecture, project-dev-guide) |
| `/sprint-report`             | Generate a sprint progress report — epics + stories + PRs                   |
| `/refresh-ai-memory`         | Refresh README + AI memory file from current repo state                     |

---

## Repository structure

```
.claude/
├── skills/         # 9 workflow skills (community skills installed by bun run setup)
└── commands/       # 4 utility slash commands
.agents/
├── project.yaml          # Per-project variables (template)
├── jira-required.yaml    # Custom field manifest
├── jira.json             # Workspace-resolved IDs (regenerated per project)
└── README.md             # The .agents/ contract
.context/                 # Per-project context (PBI, PRD, SRS, idea, dev guide)
scripts/                  # CLI tooling: agents-lint, jira-sync, etc.
.plans/MASTER-PLAN.md     # The migration plan that produced this repo
CLAUDE.md                 # Project memory loaded every AI session
CLAUDE.md                 # Cross-agent compatibility template (mirror of CLAUDE.md)
```

---

## Variables system

The `.agents/` directory hosts a 4-syntax variable system used by every skill and command.

| Syntax                         | Purpose                                      | Resolves from                                        |
| ------------------------------ | -------------------------------------------- | ---------------------------------------------------- |
| `{{VAR_NAME}}`                 | Static project value (flat or env-scoped)    | `.agents/project.yaml`                               |
| `{{environments.<env>.<var>}}` | Explicit cross-env reference                 | `.agents/project.yaml` -> `environments.<env>.<var>` |
| `<<VAR_NAME>>`                 | Session/runtime value (e.g. `<<ISSUE_KEY>>`) | Computed by the calling prompt at runtime            |
| `{{jira.<slug>}}`              | Jira custom field reference                  | `.agents/jira-required.yaml` + `.agents/jira.json`   |

See `.agents/README.md` for the full contract.

**Validation scripts:**

```bash
bun run lint:agents        # Every {{VAR}} and {{jira.*}} reference resolves
bun run jira:sync-fields   # Discover Jira custom fields -> .agents/jira.json
bun run jira:check         # Validate jira-required.yaml against jira.json
```

---

## Common scripts

```bash
bun run lint              # Lint codebase
bun run lint:fix          # Auto-fix lint issues
bun run format            # Format with Prettier
bun run format:check      # Check formatting
bun run up                # Update template from upstream
bun run api:sync          # Sync OpenAPI spec + generate types
bun run lint:agents       # Validate {{VAR}} and {{jira.*}} references
bun run jira:sync-fields  # Sync Jira custom fields -> .agents/jira.json
bun run jira:check        # Validate Jira manifest vs catalog
```

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

Migration from `ai-driven-project-starter` complete. See `.plans/MASTER-PLAN.md` for the migration story.
