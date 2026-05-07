# Project Memory

> **Purpose**: Operational context loaded every AI session.
> **Usage**: AI reads this file automatically at session start.
> **Customize**: Replace `[PLACEHOLDER]` values with your project specifics.
> **Note**: This is the **AI-Driven Project Starter** template. Each project that uses this starter should fill in the placeholder values below.

---

## Quick Start

```bash
# PROJECT STARTER — GETTING ORIENTED:
# When you start a new session, the relevant workflow skill auto-triggers.
# Manual invocation order for a new project:
# 1. /init-project              → Bootstrap .agents/ + scripts + AGENTS.md
# 2. /project-foundation        → Constitution + PRD + SRS + Discovery
# 3. /project-bootstrap         → Backend + Frontend + features
# 4. /product-management        → Seed backlog, refine stories
# 5. /sprint-dev                → Per-story dev loop (orchestrator)
# 6. /unit-testing              → Composable TDD inside sprint-dev
#
# Slash commands (utilities):
# /git-flow, /git-conflict-fix, /project-doc-setup,
# /context-engineering-setup, /sprint-report
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
bun run jira:sync-fields  # Sync Jira custom fields → .agents/jira.json
bun run jira:check        # Validate Jira manifest vs catalog
```

**Generate/Update Project Documentation:**

```bash
# Use this slash command to regenerate README.md and update CLAUDE.md
/project-doc-setup
```

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
| `{{jira.<slug>}}`              | Jira custom field reference                     | `.agents/jira-required.yaml` (canonical manifest) + `.agents/jira.json` (workspace-resolved IDs).                                                                                                             |

**Active environment** (for env-scoped vars):

1. Session override (e.g. user says "test against production")
2. Otherwise: `testing.default_env` from `.agents/project.yaml`

**Validation scripts:**

- `bun run lint:agents` — every `{{VAR}}` and `{{jira.*}}` reference in prompts/context resolves against config
- `bun run jira:sync-fields` — discover Jira custom fields → write `.agents/jira.json`
- `bun run jira:check` — validate `jira-required.yaml` manifest against `.agents/jira.json` catalog

See `.agents/README.md` for the full contract, workflows (new-user setup, adding prompts, adding required Jira fields), and troubleshooting.

---

## Tool Resolution

> When prompts use `[TAG_TOOL]` pseudocode, the AI resolves to the actual tool using this table.
> **Priority rule**: CLI tools first (fewer tokens, faster execution), MCP as fallback.
> Skills are self-documenting — the AI reads the skill file to learn exact syntax.

### Resolution Table

| Tag                    | Domain             | Primary Tool            | Fallback               | Skill/Reference                  |
| ---------------------- | ------------------ | ----------------------- | ---------------------- | -------------------------------- |
| `[ISSUE_TRACKER_TOOL]` | Issue Tracking     | Atlassian CLI (`acli`)  | MCP Atlassian          | MCP tool list                    |
| `[AUTOMATION_TOOL]`    | Browser Automation | `/playwright-cli` skill | MCP Playwright         | `.claude/skills/playwright-cli/` |
| `[DB_TOOL]`            | Database           | DBHub MCP               | Supabase MCP / raw SQL | MCP tool list                    |
| `[API_TOOL]`           | API Exploration    | OpenAPI MCP             | Postman / curl         | MCP tool list                    |

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

→ **Full details**: `/git-flow` slash command (and `/git-conflict-fix` for merge conflicts)

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
| **New project bootstrap**   | `/init-project`       | One-time: scaffold `.agents/`, scripts, AGENTS.md                  |
| **Foundational definition** | `/project-foundation` | Constitution + PRD + SRS + Discovery (one-time per product)        |
| **Infra scaffolding**       | `/project-bootstrap`  | Backend + frontend skeleton + features (OpenAPI, auth, env, types) |
| **Backlog & refinement**    | `/product-management` | Seed backlog, add feature, create epic, refine story (INVEST + AC) |
| **Per-story dev loop**      | `/sprint-dev`         | Plan → Code → Review → Staging → (gated) Production                |
| **TDD slice**               | `/unit-testing`       | Standalone or composable mid-flight from `/sprint-dev`             |

> QA workflows (sprint testing, exploratory testing, automation, regression) live in the sister repo `agentic-qa-boilerplate`.

---

## Context System (3-Level Hierarchy)

### Level 1: Project-Wide (loaded at session start)

```
.context/business-data-map.md      → System flows and entities
.context/api-architecture.md       → API endpoints reference
.context/project-dev-guide.md      → How to develop features
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
| **Develop a Feature**   | `project-dev-guide.md` + relevant `module-context.md`                 |
| **Plan a Story**        | `module-context.md` + story `context.md` + `business-data-map.md`     |
| **Write Unit Test**     | `/unit-testing` skill internal docs                                   |
| **Understand System**   | `business-data-map.md` + `PRD/user-journeys.md`                       |
| **Use MCP Tools**       | `CLAUDE.md section Tool Resolution`                                   |
| **Code Review**         | `/sprint-dev` skill (Code Review step)                                |
| **Plan Implementation** | `/sprint-dev` skill (Planning step)                                   |
| **Bootstrap Project**   | `/init-project` + `/project-foundation` + `/project-bootstrap` skills |

---

## MCPs Available

| MCP            | When to Use                                |
| -------------- | ------------------------------------------ |
| **Playwright** | E2E testing, UI automation, screenshots    |
| **OpenAPI**    | API endpoint exploration, contract testing |
| **DBHub**      | Database queries, data validation          |
| **Atlassian**  | Jira issue tracking and ticket workflows   |
| **Context7**   | Official library documentation             |
| **Tavily**     | Web search, troubleshooting                |

**Decision Rule:**

- Context7 for "how to use X" (official docs)
- Tavily for "how to solve X" (community solutions)

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

| Script             | Usage                              | Documentation            |
| ------------------ | ---------------------------------- | ------------------------ |
| `bun run api:sync` | Sync OpenAPI spec + generate types | `cli/sync-openapi.ts`    |
| `bun run up`       | Update template from upstream      | `cli/update-template.js` |
| `bun run lint`     | Lint codebase with ESLint          | `eslint.config.js`       |
| `bun run format`   | Format with Prettier               | `.prettierrc`            |

**Run `bun <script> --help`** for usage details.

---

## Skills (Claude Code)

> Pre-built skills available in `.claude/skills/`. These are loaded automatically by Claude Code.

### Workflow Skills (project-starter, 6)

| Skill                  | Trigger               | Description                                                                                      |
| ---------------------- | --------------------- | ------------------------------------------------------------------------------------------------ |
| **init-project**       | `/init-project`       | Bootstrap a new repo with foundation files (one-time): `.agents/`, scripts, AGENTS.md            |
| **project-foundation** | `/project-foundation` | Constitution + Architecture (PRD, SRS) + Discovery (data map, API arch, dev guide)               |
| **project-bootstrap**  | `/project-bootstrap`  | Infrastructure scaffolding: backend, frontend, OpenAPI, env, Supabase types                      |
| **product-management** | `/product-management` | Backlog seed + add-feature + epic creation + story refinement (INVEST, AC, edge cases)           |
| **sprint-dev**         | `/sprint-dev`         | Per-story dev loop: Planning → Implementation → Code Review → Staging deploy. Mega-orchestrator. |
| **unit-testing**       | `/unit-testing`       | TDD workflow, test naming, mocking, coverage. Composable with `/sprint-dev`.                     |

### Reusable Knowledge Skills (5)

| Skill                     | Trigger                  | Description                                                                       |
| ------------------------- | ------------------------ | --------------------------------------------------------------------------------- |
| **frontend-design**       | `/frontend-design`       | Production-grade frontend interfaces with high design quality                     |
| **next-best-practices**   | `/next-best-practices`   | Next.js best practices: file conventions, RSC boundaries, data patterns, metadata |
| **next-cache-components** | `/next-cache-components` | Next.js Cache Components: PPR, use cache, cacheLife, cacheTag                     |
| **next-upgrade**          | `/next-upgrade`          | Upgrade Next.js with official migration guides and codemods                       |
| **playwright-cli**        | `/playwright-cli`        | Browser automation: screenshots, tracing, recording, mocking                      |

### Slash Commands (utilities)

| Command                      | Purpose                                                 |
| ---------------------------- | ------------------------------------------------------- |
| `/git-flow`                  | Git Flow workflow guidance                              |
| `/git-conflict-fix`          | Resolve merge conflicts safely                          |
| `/project-doc-setup`         | Regenerate README.md and CLAUDE.md from repo state      |
| `/context-engineering-setup` | Set up `.context/` directory structure                  |
| `/sprint-report`             | Generate sprint progress report (epics + stories + PRs) |

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

- [ ] Playwright MCP (browser automation)
- [ ] Database MCP (data validation)
- [ ] Atlassian MCP (Jira issue tracking)
- [ ] OpenAPI MCP (API exploration)
- [ ] Context7 MCP (library documentation)
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
