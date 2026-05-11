# Project Memory

> **Purpose**: Operational context loaded every AI session.
> **Usage**: AI reads this file automatically at session start.
> **Customize**: Replace `[PLACEHOLDER]` values with your project specifics.
> **Note**: This is the **AI-Driven Project Starter** template. Each project that uses this starter should fill in the placeholder values below.
> **Companion files**: `README.md` (humans-first overview), `CONTEXT.md` (Context Engineering canonical map), `DESIGN.md` (visual identity contract), `docs/agentic-development-engineering.md` (methodology deep dive), `docs/getting-started.md` (onboarding for new contributors).

---

## Quick Start

```bash
# PROJECT STARTER — GETTING ORIENTED:
# When you start a new session, the relevant workflow skill auto-triggers.
# Manual invocation order for a new project:
# 1. /agentic-dev-core              → Bootstrap .agents/ + scripts + CLAUDE.md
# 2. /project-foundation        → Constitution + PRD + SRS + Discovery
# 2.5. /design-system           → DESIGN.md (visual identity) — invoked by foundation Phase 2.5
# 3. /project-bootstrap         → Backend + Frontend + features (reads DESIGN.md if present)
# 4. /product-management        → Seed backlog, refine stories
# 5. /sprint-dev                → Per-story dev loop (orchestrator)
# 6. /unit-testing              → Composable TDD inside sprint-dev
#
# Slash commands (utilities):
# /refresh-ai-memory
# (Git/branch/commit/PR work is consolidated in the /git-flow-master skill;
#  sprint reporting now lives inside the /product-management skill — workflow G)
#
# Plan-driven development: each skill plans before coding (skill-internal pattern).
```

**Common commands:**

```bash
bun run lint              # Lint codebase
bun run lint:fix          # Auto-fix lint issues
bun run format            # Format with Prettier
bun run format:check      # Check formatting
bun run up                # Update template from upstream
bun run api:sync          # Sync OpenAPI spec + generate types
bun run lint:agents       # Validate {{VAR}} and {{jira.*}} references
bun run jira:sync-fields  # Sync Jira custom fields → .agents/jira-fields.json
bun run jira:check        # Validate Jira manifest vs catalog
```

---

## Onboarding (first time using this repo)

If this is your first time on this repo, run:

```bash
bun run setup
```

This launches an interactive installer that:

1. Detects gentle-ai (installs via `brew install gentle-ai` or `go install ...` if missing)
2. Detects your AI agent (Claude Code or OpenCode)
3. Installs 15 skills + engram + SDD orchestrator via gentle-ai (skip if you opt out)
4. Configures the 4 canonical MCPs (Tavily, Context7, Supabase, n8n) interactively
5. Verifies external CLIs are present (vercel, supabase, acli, playwright-cli, resend)
6. Writes `.mcp.json` (or `opencode.json`) and `.agents/install-state.json`

For details on every installer layer (gentle-ai, community skills, MCPs, external CLIs, opt-out path), see [INSTALLER.md](INSTALLER.md).

---

## Behavioral Layer

> How to reason before and during work. These guidelines bias toward caution over speed. For trivial tasks, use judgment.

### 1. Think Before Coding

**Don't assume. Don't hide confusion. Surface tradeoffs.**

- State your assumptions explicitly. If uncertain, ask.
- If multiple interpretations exist, present them — don't pick silently.
- If a simpler approach exists, say so. Push back when warranted.
- If something is unclear, stop. Name what's confusing. Ask.

### 2. Simplicity First

**Minimum code that solves the problem. Nothing speculative.**

- No features beyond what was asked.
- No abstractions for single-use code.
- No "flexibility" or "configurability" that wasn't requested.
- No error handling for impossible scenarios.
- If you write 200 lines and it could be 50, rewrite it.

> **Scope note**: This rule applies to code authored by the agent within a task. Do **not** collapse the architecture layers of the scaffold (`api/`, `schemas/`, `db/` boundaries in backend; design system structure in frontend) — they are framework architecture, not speculative abstraction.

### 3. Surgical Changes

**Touch only what you must. Clean up only your own mess.**

- Don't "improve" adjacent code, comments, or formatting.
- Don't refactor things that aren't broken.
- Match existing style, even if you'd do it differently.
- If you notice unrelated dead code, mention it — don't delete it.
- Remove imports/variables/functions that **your** changes made unused.

> **Scope note**: This rule applies to incidental edits during a task. User-invoked regenerative commands and skill phases are exempt — regeneration is the task. This includes `/agentic-dev-core` init mode (foundation files), `/project-foundation` (PRD, SRS, Discovery), `/design-system` (DESIGN.md generation, including rebrand), `/project-bootstrap` (backend + frontend scaffolding), `/refresh-ai-memory` (project memory), `/sprint-dev` implementation-plan stage, and `/product-management` AC-writing (Gherkin scenarios).

### 4. Goal-Driven Execution

**Define success criteria. Loop until verified.**

Transform tasks into verifiable goals:
- "Add validation" → "Write tests for invalid inputs, then make them pass"
- "Fix the bug" → "Write a test that reproduces it, then make it pass"
- "Refactor X" → "Ensure tests pass before and after"

For multi-step tasks, state a brief plan with explicit checks:

```
1. [Step] → verify: [observable check]
2. [Step] → verify: [observable check]
3. [Step] → verify: [observable check]
```

`verify` = an observable signal that the step actually landed (test passes, file exists, command exits 0, type-check clean). This format **complements** the 6-component subagent briefing in `Orchestration Mode` — it does **not** replace it. Use this format for thinking-out-loud during execution; use the briefing for delegation.

### Working signals

These guidelines are working if: **fewer unnecessary changes in diffs, fewer rewrites due to overcomplication, and clarifying questions come before implementation rather than after mistakes.**

---

## Critical Reminders

> These rules override defaults and must always be in context.

1. **This is a project starter template**: All sections with `[PLACEHOLDER]` or `{{VARIABLE}}` values must be filled in per-project. Do not assume defaults.
2. **Login Credentials**: ALWAYS read from `.env` file — NEVER hardcode or guess passwords.
   - Example keys: `LOCAL_USER_EMAIL` / `LOCAL_USER_PASSWORD`, `STAGING_USER_EMAIL` / `STAGING_USER_PASSWORD`
3. **Plan before coding**: Always produce a plan (spec / implementation plan) before writing code. Each workflow skill enforces this internally.
4. **No AI attribution in commits**: Never include "Generated with Claude Code", "Co-Authored-By: Claude", or similar lines in commit messages.
5. **Confirm before push to main**: Never push to `main` without explicit user confirmation.
6. **Unit tests are part of `/sprint-dev`**: Optionally TDD via `/unit-testing` (composable mid-flight from sprint-dev).
7. **Git History Management**:
   - NEVER rewrite pushed history (`rebase`, `amend` on pushed commits)
   - NEVER force push to any shared branch
   - NEVER delete remote branches without confirmation
   - ALWAYS add forward (new commits to fix, not rewrite)
   - ALWAYS preserve merge history
8. **Quality Verification**: After code changes, verify in order: run tests → check types → lint. Do not skip steps.
9. **File Operations**: Always read a file before editing it. Preserve existing formatting and indentation. Never overwrite files without reading first.
10. **No Copy-Paste in Skills**: All skills and slash commands are invocable via `/<name>`. Never ask users to copy-paste content. Use `[TAG_TOOL]` pseudocode and `{{VARIABLES}}` for dynamic content.
11. **Playwright CLI Usage**: For browser automation, load the `/playwright-cli` skill. It provides screenshots, tracing, video recording, session management, and request mocking. See `.claude/skills/playwright-cli/` for details.
12. [Add project-specific reminders here — e.g., "SPA and API are on different hosts — use correct base URLs"]

---

## Project Variables

Project-specific values live in `.agents/project.yaml` (single source of truth). Four reference syntaxes coexist across prompts and docs; each tells you which file resolves the value.

| Syntax                         | Purpose                                         | Resolves from                                                                                                                                                                                                 |
| ------------------------------ | ----------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `{{VAR_NAME}}`                 | Static project value (flat or env-scoped)       | `.agents/project.yaml`. Flat keys lex-lookup (`{{PROJECT_KEY}}` → `project.project_key`). Env-scoped keys (`{{WEB_URL}}`, `{{API_URL}}`, `{{DB_MCP}}`, `{{API_MCP}}`) resolve against the active environment. |
| `{{environments.<env>.<var>}}` | Explicit cross-env reference (multi-env tables) | `.agents/project.yaml` → `environments.<env>.<var>` directly, regardless of active env.                                                                                                                       |
| `<<VAR_NAME>>`                 | Session/runtime value (e.g. `<<ISSUE_KEY>>`)    | Computed by the calling prompt at runtime. Never declared, never persisted.                                                                                                                                   |
| `{{jira.<slug>}}`              | Jira custom field reference                     | `.agents/jira-required.yaml` (canonical manifest) + `.agents/jira-fields.json` (workspace-resolved IDs).                                                                                                             |

**Active environment** (for env-scoped vars):

1. Session override (e.g. user says "test against production")
2. Otherwise: `testing.default_env` from `.agents/project.yaml`

**Validation scripts:**

- `bun run lint:agents` — every `{{VAR}}` and `{{jira.*}}` reference in prompts/context resolves against config
- `bun run jira:sync-fields` — discover Jira custom fields → write `.agents/jira-fields.json`
- `bun run jira:check` — validate `jira-required.yaml` manifest against `.agents/jira-fields.json` catalog

See `.agents/README.md` for the full contract, workflows (new-user setup, adding prompts, adding required Jira fields), and troubleshooting.

---

## Tool Resolution

> When prompts use `[TAG_TOOL]` pseudocode, the AI resolves to the actual tool using this table.
> **Priority rule**: CLI tools first (fewer tokens, faster execution), MCP as fallback.
> Skills are self-documenting — the AI reads the skill file to learn exact syntax.

### Resolution Table

| Tag                    | Domain             | Primary Tool               | Fallback                 | Skill/Reference                  |
| ---------------------- | ------------------ | -------------------------- | ------------------------ | -------------------------------- |
| `[ISSUE_TRACKER_TOOL]` | Issue Tracking     | `acli` CLI (`/acli` skill) | manual via Atlassian UI  | `.claude/skills/acli/`           |
| `[AUTOMATION_TOOL]`    | Browser Automation | `/playwright-cli` skill    | —                        | `.claude/skills/playwright-cli/` |
| `[DB_TOOL]`            | Database           | Supabase MCP               | raw SQL via Supabase CLI | `.mcp.example.json`              |
| `[API_TOOL]`           | API Exploration    | curl + OpenAPI types       | Postman manual           | `scripts/sync-openapi.ts`            |

### How It Works

1. Prompts describe WHAT to do using `[TAG_TOOL]` pseudocode
2. The AI reads this table to determine WHICH tool to use
3. The AI reads the skill/MCP documentation to learn HOW to execute
4. If the primary tool is unavailable, try the fallback
5. If all tools are unavailable, inform the user

### Pseudocode Syntax

```
[TAG_TOOL] Action:
  - parameter: value
  - parameter: {per convention name}
  - parameter: {{PROJECT_VARIABLE}}
```

**Value types in pseudocode:**

| Type                 | Syntax               | Example                             | When to use                       |
| -------------------- | -------------------- | ----------------------------------- | --------------------------------- |
| Fixed/domain         | Literal value        | `type: Manual`                      | Domain concepts that never change |
| Convention reference | `{per <convention>}` | `title: {per TC naming convention}` | Forces AI to consult guidelines   |
| Project variable     | `{{VARIABLE}}`       | `project: {{PROJECT_KEY}}`          | Configured once per project       |
| Context-derived      | `{from <source>}`    | `steps: {from test analysis}`       | Derived during session            |

### Convention References

> Dev-side conventions are owned by the relevant skill (e.g., `/sprint-dev` for branch/PR naming, `/product-management` for AC format).
> QA-side conventions (TC naming, label format, execution naming) live in the sister repo `agentic-qa-boilerplate`.

---

## Project Identity

> Replace placeholders with your project details.

| Aspect           | Value                                                     |
| ---------------- | --------------------------------------------------------- |
| **Name**         | [Your Project Name]                                       |
| **Type**         | [e.g., B2B Web Platform, E-commerce, SaaS]                |
| **Stack**        | [e.g., React + TypeScript (FE), Node.js (BE), PostgreSQL] |
| **Target Repo**  | [Path to application repository]                          |
| **Starter Repo** | [Path to this project-starter repository]                 |

**TL;DR Flow:**

```
[User Action] → [System Process] → [Outcome]
```

---

## Environment URLs

> Replace with your project URLs. Keep the same structure so tooling and context files can reference it.

| Environment    | Frontend                      | Backend (API)                     |
| -------------- | ----------------------------- | --------------------------------- |
| **Local**      | `http://localhost:3000`       | `http://localhost:3000/api`       |
| **Staging**    | `https://staging.example.com` | `https://staging.example.com/api` |
| **Production** | `https://example.com`         | `https://example.com/api`         |

> If the Frontend and Backend are on **different hosts**, document it here and make sure API tests target the API host directly.

---

## Planning Scopes

### Development Planning

| Scope                   | Skill / Reference               | When to Use                              |
| ----------------------- | ------------------------------- | ---------------------------------------- |
| **Epic / Feature**      | `/product-management`           | Plan an epic and seed its stories        |
| **Story-level** (Micro) | `/sprint-dev` (Planning step)   | Implementation plan for a specific story |
| **Unit-test slice**     | `/unit-testing` (TDD red-green) | TDD workflow for an isolated unit        |

> QA test planning (acceptance test plans, regression suites, E2E automation plans) lives in the sister repo `agentic-qa-boilerplate`.

---

## Fundamental Rules (Always in Memory)

### TypeScript Patterns

| Pattern        | Rule                                                                           |
| -------------- | ------------------------------------------------------------------------------ |
| **Parameters** | Max 2 positional. 3+ → use object parameter                                    |
| **Utilities**  | Agnostic utilities only — no domain coupling in shared modules                 |
| **Imports**    | Always use aliases (`@api/`, `@schemas/`, `@utils/`). No deep relative imports |
| **Types**      | Define interfaces at top of file, after imports                                |
| **Errors**     | Public methods: fail fast. Utilities: silent fail (return null)                |

**DRY — Context Matters:**

- `api/schemas/` = OpenAPI type facades (`@schemas/{domain}.types`)
- Shared utilities = framework-agnostic only
- Domain logic stays inside its feature folder

> Full TS conventions live in the relevant feature's `dev-guide` (Discovery output). The `/sprint-dev` skill points to it during Planning.

---

## Git Workflow

### Branch Strategy

| Branch      | Role                                                               |
| ----------- | ------------------------------------------------------------------ |
| `main`      | Production. PRs merged from `staging` or `feature/*` after review. |
| `staging`   | Integration branch for AI commits and pre-release validation.      |
| `feature/*` | Task-specific branches for new work. Use `feature/TICKET-ID-desc`. |
| `fix/*`     | Bug-fix branches. Use `fix/TICKET-ID-desc`.                        |

### Commit Rules

- **Semantic prefixes**: `feat:`, `fix:`, `docs:`, `test:`, `refactor:`, `chore:`
- **One commit = one responsibility**
- **Clear messages**: Someone should understand the change without reading the diff
- **NO AI attribution**: Never include "Generated with Claude Code", "Co-Authored-By: Claude", or similar lines. Commits must look human-authored.
- **Confirm before push to main**: Always ask user confirmation before pushing to `main`.

### Example Flow

```bash
# General work (no ticket)
git add <files>
git commit -m "docs: update context files"
# → Ask: "Confirm push to main?"
git push origin main

# Ticket-based work
git checkout -b feature/UPEX-123-add-login-tests
git add <files>
git commit -m "test: add login API tests"
git push -u origin feature/UPEX-123-add-login-tests
gh pr create --base staging
```

→ **Full details**: `/git-flow-master` skill (covers branches, commits, push, PR creation, merge conflicts, and chained-PR planning — auto-adapts to the project's branching strategy)

---

## Orchestration Mode (Subagent Strategy)

**Core Principle**: Main conversation = command center. Subagents = executors.

**Use subagents for**: Reading/writing multiple files, MCP operations, research across repos, git operations, verification (tests/types/lint), multi-file edits.

**Do NOT use subagents for**: Quick lookups, memory reads/writes, task tracking, asking the user, planning.

**Briefing format** — every dispatch must include:

1. **Goal**: One-sentence description
2. **Context docs**: Which files to read first
3. **Skills to load**: Which skills the subagent needs (e.g., `/playwright-cli`)
4. **Exact instructions**: Step-by-step, not vague goals
5. **Report format**: What to return (files changed, tests passed/failed, blockers)
6. **Rules**: Relevant Critical Rules to follow

### Execution Patterns

| Pattern        | When              | Example                                         |
| -------------- | ----------------- | ----------------------------------------------- |
| **Parallel**   | Independent tasks | Read 3 context files simultaneously             |
| **Sequential** | Dependent tasks   | Plan → Code → Test                              |
| **Background** | Long-running      | Test suite execution while planning next ticket |
| **Single**     | Simple task       | One file edit with verification                 |

**Error protocol**: On subagent error — STOP, report to user with full context, do NOT fix without approval, present options (retry/skip/abort).

**Planning**: Present plan → wait for approval → track progress → report results.

---

## Usage Modes & Entry Points

| Mode                        | Entry Point           | When to Use                                                        |
| --------------------------- | --------------------- | ------------------------------------------------------------------ |
| **New project bootstrap**   | `/agentic-dev-core`       | One-time: scaffold `.agents/`, scripts, CLAUDE.md                  |
| **Foundational definition** | `/project-foundation` | Constitution + PRD + SRS + Discovery (one-time per product)        |
| **Design system**           | `/design-system`      | DESIGN.md (Google Labs spec) before scaffolding — 5 paths (getdesign default, manual, Open Design, Claude Design, LLM-authored) |
| **Infra scaffolding**       | `/project-bootstrap`  | Backend + frontend skeleton + features (OpenAPI, auth, env, types) |
| **Backlog & refinement**    | `/product-management` | Seed backlog, add feature, create epic, refine story (INVEST + AC) |
| **Per-story dev loop**      | `/sprint-dev`         | Plan → Code → Review → Staging → (gated) Production                |
| **TDD slice**               | `/unit-testing`       | Standalone or composable mid-flight from `/sprint-dev`             |

> QA workflows (sprint testing, exploratory testing, automation, regression) live in the sister repo `agentic-qa-boilerplate`.

---

## Context System (3-Level Hierarchy)

### Level 1: Project-Wide (loaded at session start)

```
.context/business/business-data-map.md     → System flows and entities
.context/business/business-feature-map.md  → Feature inventory (CRUD matrix, UI inventory)
.context/business/business-api-map.md      → API as journey-enabler (auth model, endpoints)
.context/master-implementation-plan.md     → Prioritized feature roadmap
```

### Level 2: Module-Level (shared across stories in a module)

```
.context/PBI/{module}/
  module-context.md                → Module overview and shared context
  ROADMAP.md                       → All stories and their dev status
  PROGRESS.md                      → Current progress tracker
  SESSION-PROMPT.md                → @-loadable session resume prompt
```

### Level 3: Story-Level (per story)

```
.context/PBI/{module}/{TICKET-ID}-{name}/
  context.md                       → ACs, data, session notes, open questions
  implementation-plan.md           → Plan produced by /sprint-dev
  evidence/                        → Screenshots, traces, logs (gitignored)
```

### Context Loading by Task

| Task                    | Load These Files                                                      |
| ----------------------- | --------------------------------------------------------------------- |
| **Develop a Feature**   | `business-feature-map.md` + relevant `module-context.md`              |
| **Plan a Story**        | `module-context.md` + story `context.md` + `business-data-map.md`     |
| **Write Unit Test**     | `/unit-testing` skill internal docs                                   |
| **Understand System**   | `business-data-map.md` + `PRD/user-journeys.md`                       |
| **Use MCP Tools**       | `CLAUDE.md section Tool Resolution`                                   |
| **Code Review**         | `/sprint-dev` skill (Code Review step)                                |
| **Plan Implementation** | `/sprint-dev` skill (Planning step)                                   |
| **Bootstrap Project**   | `/agentic-dev-core` + `/project-foundation` + `/project-bootstrap` skills |

---

## MCPs Available

| MCP          | When to Use                          |
| ------------ | ------------------------------------ |
| **Tavily**   | Web search, troubleshooting          |
| **Context7** | Official library documentation       |
| **Supabase** | Database queries, project management |
| **n8n**      | Workflow automation, integrations    |

**Decision Rule:**

- Context7 for "how to use X" (official docs)
- Tavily for "how to solve X" (community solutions)
- Supabase for database/project state
- n8n for workflow automation

---

## AI Behavior During Sessions

**Workflow**: Plan first (wait for approval) → delegate to subagents → use skills → track progress → report results → verify quality.

### Explanations and Confirmations

When working on a User Story, feature, or bug:

1. **Explain the story**: Once you understand the ticket, explain briefly:
   - What the feature is about
   - How it works (in simple terms)
   - What we'll be doing (developing, testing, or both)

2. **Wait for confirmation**: After important explanations, WAIT for the user to respond before continuing. This allows the user to:
   - Read and understand
   - Ask questions if needed
   - Confirm whether to proceed

3. **Explain defects**: When you find a bug or unexpected behavior:
   - Describe what you observed
   - Explain why it's a problem
   - Suggest the impact (severity, affected users, business risk)

4. **Language**: Default to **English**. If the user writes in another language, mirror that language for user-facing communication. Documentation and code are always written in English.

### Environment Selection

- Ask the user which environment they're working on (e.g., "local or staging?") when it's ambiguous.
- Default to **staging** unless the user specifies otherwise.
- Use the environment URLs from the "Environment URLs" table above and credentials from `.env`.

### Context Efficiency

Main conversation stays lean (no large file reads). Subagents do heavy reading. Load only what the current step needs.

---

## Local Context (PBI)

For every story being worked on, maintain local documentation under `.context/PBI/`:

```
.context/PBI/{module-name}/
  module-context.md                → Module overview and shared context
  ROADMAP.md                       → All stories and their dev status
  PROGRESS.md                      → Current progress tracker
  SESSION-PROMPT.md                → @-loadable session resume prompt
  {TICKET-ID}-{brief-title}/
    context.md                     → ACs, data, session notes, open questions
    implementation-plan.md         → Plan produced by /sprint-dev
    evidence/                      → Screenshots, traces, logs (gitignored)
```

**Variables:**

- `{module-name}`: kebab-case of the module or epic (e.g., `user-management`)
- `{TICKET-ID}`: Issue tracker identifier (e.g., `UPEX-277`)
- `{brief-title}`: AI-generated summary of the ticket title, max ~5 words, kebab-case (e.g., `empty-states`)

**Entry point**: `/sprint-dev` — fetches ticket, explains story, loads context, drives plan-code-review-deploy.

**Resume a session**: `@.context/PBI/{module}/SESSION-PROMPT.md` — @-loadable, restores full context without copy-paste.

---

## CLI Tools

| Script             | Usage                                               | Documentation               |
| ------------------ | --------------------------------------------------- | --------------------------- |
| `bun run api:sync` | Sync OpenAPI spec + generate types                  | `scripts/sync-openapi.ts`       |
| `bun run setup`    | Run interactive installer (gentle-ai + MCPs + CLIs) | `cli/install.ts`            |
| `bun run up`       | Update template from upstream                       | `cli/update-boilerplate.ts` |
| `bun run lint`     | Lint codebase with ESLint                           | `eslint.config.js`          |
| `bun run format`   | Format with Prettier                                | `.prettierrc`               |

**Run `bun <script> --help`** for usage details.

---

## Skills (Claude Code)

> Pre-built skills available in `.claude/skills/`. These are loaded automatically by Claude Code.

> **Note**: This repo uses a hybrid model. Workflow skills are committed in `.claude/skills/`. Foundation/SDD skills (`judgment-day`, `cognitive-doc-design`, `comment-writer`, `issue-creation`, the SDD bloque) come from gentle-ai user-install. Reusable community skills (next-*, react-*, shadcn, supabase-postgres-best-practices, etc.) come from `npx skills add` invoked by the installer. Run `bun run setup` to install everything. See [INSTALLER.md](INSTALLER.md).

### Workflow Skills (project-starter, 10)

| Skill                   | Trigger                | Description                                                                                                            |
| ----------------------- | ---------------------- | ---------------------------------------------------------------------------------------------------------------------- |
| **agentic-dev-core**        | `/agentic-dev-core`        | Bootstrap a new repo with foundation files (one-time): `.agents/`, scripts, CLAUDE.md                                  |
| **project-foundation**  | `/project-foundation`  | Constitution + Architecture (PRD, SRS) + Discovery (data map, API arch, dev guide)                                     |
| **design-system**       | `/design-system`       | Generates DESIGN.md (Google Labs Apache-2.0 spec) at project root — 5 paths: getdesign default, manual gallery, Open Design app, Claude Design handoff, LLM-authored. Invoked by foundation Phase 2.5; consumed by bootstrap frontend-setup. |
| **project-bootstrap**   | `/project-bootstrap`   | Infrastructure scaffolding: backend, frontend, OpenAPI, env, Supabase types                                            |
| **product-management**  | `/product-management`  | Backlog seed + add-feature + epic creation + story refinement (INVEST, AC, edge cases)                                 |
| **sprint-dev**          | `/sprint-dev`          | Per-story dev loop: Planning → Implementation → Code Review → Staging deploy. Mega-orchestrator.                       |
| **unit-testing**        | `/unit-testing`        | TDD workflow, test naming, mocking, coverage. Composable with `/sprint-dev`.                                           |
| **git-flow-master**     | `/git-flow-master`     | End-to-end Git operator: branches, commits, push, PR, conflicts, chained-PR planning. Auto-detects branching strategy. |
| **acli**                | `/acli`                | Atlassian CLI cookbook for Jira Cloud + Confluence Cloud workflows.                                                    |
| **agentic-dev-onboard** | `/agentic-dev-onboard` | Walks new users through this repo's dev flow: stack, Jira workflow, /sprint-dev vs /sdd-\*, MCPs, env vars.            |

### Reusable Community Skills (installed by `bun run setup`)

These skills are NOT committed in this repo. The installer fetches them via `npx skills add` from community repositories.

**Project-level (auto-installed via `bun run setup`)**: stack-aware skills like `next-best-practices`, `next-cache-components`, `next-upgrade`, `react-best-practices`, `composition-patterns`, `deploy-to-vercel`, `tailwind-css-patterns`, `shadcn`, `react-hook-form`, `zod`, `typescript-advanced-types`, `supabase-postgres-best-practices`, `bun`, `accessibility`, `seo`, `frontend-design`.

**User-level (auto-installed globally)**: cross-cutting skills like `skill-creator`, `find-skills`, `gh-cli`, `github-actions-docs`, `playwright-cli`, `n8n-skills`, `ui-ux-pro-max`, `emil-design-eng`, `brainstorming`.

After running `/project-foundation` and `/project-bootstrap`, run `npx autoskills` to auto-detect your concrete stack and install additional matching skills.

### Slash Commands (utilities)

| Command                       | Purpose                                                                       |
| ----------------------------- | ----------------------------------------------------------------------------- |
| `/refresh-ai-memory`          | Refresh README + AI memory file from current repo state                       |
| `/business-data-map`          | Generate or update `.context/business/business-data-map.md`                   |
| `/business-feature-map`       | Generate or update `.context/business/business-feature-map.md`                |
| `/business-api-map`           | Generate or update `.context/business/business-api-map.md`                    |
| `/master-implementation-plan` | Generate or update `.context/master-implementation-plan.md` (prioritized roadmap) |

> Sprint reporting (epics + stories + PRs snapshot) lives inside `/product-management` (workflow G) — trigger with "sprint report", "estado del sprint", or "qué hay en el sprint".

> Git, branch, commit, push, PR, conflict-fix and chained-PR planning are all in the `/git-flow-master` skill (Workflow Skills table above), not as separate slash commands.

**Note:** Skills and commands are committed to the repo so anyone who clones the project gets them out of the box. User-specific settings (`.claude/settings.local.json`) are gitignored.

---

## Discovery Progress

> Track which foundation steps have been completed.

| Step                     | Skill                 | Status         | Output Files                                                 |
| ------------------------ | --------------------- | -------------- | ------------------------------------------------------------ |
| Constitution             | `/project-foundation` | [Pending/Done] | `idea/*`                                                     |
| Architecture (PRD + SRS) | `/project-foundation` | [Pending/Done] | `PRD/*`, `SRS/*`                                             |
| Infrastructure scaffold  | `/project-bootstrap`  | [Pending/Done] | `SRS/infrastructure.md`, backend/frontend boilerplate        |
| Discovery                | `/project-foundation` | [Pending/Done] | `business-data-map`, `api-architecture`, `project-dev-guide` |

---

## Access Configuration

### Configured

- [ ] Tavily MCP (web search)
- [ ] Context7 MCP (library documentation)
- [ ] Supabase MCP (database + project queries)
- [ ] n8n MCP (workflow automation)
- [ ] Bun runtime installed
- [ ] Playwright browsers installed
- [ ] GitHub Actions workflows
- [ ] ESLint + Prettier configured
- [ ] Husky pre-commit hooks

### Pending / Manual Steps

- [ ] Populate `.env` with staging/production URLs
- [ ] Populate `.env` with test user credentials (`LOCAL_*`, `STAGING_*`)
- [ ] Run `bun run env:validate` to check configuration
- [ ] Restart Claude Code after any MCP credential change (configs are cached)

---

## Quick Reference

**Pre-flight checklist:**

- [ ] Plan presented and approved before coding (skill-internal)
- [ ] Aliases used for imports (`@api/`, `@schemas/`, `@utils/`)
- [ ] Credentials from `.env`, never hardcoded
- [ ] Unit tests pass (when applicable; see `/unit-testing`)
- [ ] Lint + types green (`bun run lint`, `tsc --noEmit`)
- [ ] No AI attribution in commits
- [ ] Context loaded progressively (not all at once)

See "Quick Start" above for common commands.

---

## Future Hooks (gentle-ai inspired)

The skill architecture leaves room for future enhancements without requiring rework:

1. **Per-phase model routing.** Each SKILL.md declares `phase:` in frontmatter. A future orchestrator can read this and route to a different model per phase (e.g., Opus for foundation, Sonnet for implementation, Haiku for review). Hook point: SKILL.md frontmatter is already structured.

2. **Skill registry.** A future `scripts/skill-registry.ts` could scan `.claude/skills/` and emit a machine-readable catalog. Useful for skills that need to discover other skills, or for dashboards. Hook point: `.claude/skills/` directory structure is already conventional.

3. **Engram-style persistent memory.** Today we use `.context/PBI/{module}/{ticket}/` plus auto-memory. A richer cross-session memory layer (sync between machines, team-shared) could plug in here. Hook point: `.context/.engram/` (TBD).

4. **Cross-agent portability.** Each skill's frontmatter declares `compatibility: [claude-code, copilot, cursor, codex, opencode]`. To validate cross-agent reliability, a future CI step could spin up multiple runners. Hook point: `.claude/skills/` follows the agentskills.io standard.

These hooks are documented but not implemented. Reopen when there's concrete demand.

---

## Known Issues & Blockers

| Issue               | Severity          | Status          |
| ------------------- | ----------------- | --------------- |
| [Issue description] | [HIGH/MEDIUM/LOW] | [Open/Resolved] |

---

## Session Log

> Log significant changes per session. Delete old entries as needed.

### [DATE] - [Session Title]

- [Change 1]
- [Change 2]
- Result: [Outcome]

---

## Next Actions

1. **[Priority 1]**
   - [ ] [Subtask]
   - [ ] [Subtask]

2. **[Priority 2]**
   - [ ] [Subtask]

---

**Last Updated**: [DATE]
**Session Count**: [N]
