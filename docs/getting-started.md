# Getting Started

> **Purpose**: Make sense of how this repo's pieces fit together — Skills, Commands, Scripts, and the configuration substrate. The 30-minute orientation a new contributor needs before opening any skill.
> **Audience**: New developers, tech leads, or product engineers adopting this boilerplate. Read AFTER skimming [`../README.md`](../README.md) and BEFORE diving into individual skills.
> **Related**: [`../README.md`](../README.md) (project overview + Quick Start) · [`../CONTEXT.md`](../CONTEXT.md) (Context Engineering canonical map for this repo) · [`agentic-development-engineering.md`](agentic-development-engineering.md) (methodology deep dive, includes §6 on the knowledge layer) · [`../INSTALLER.md`](../INSTALLER.md) (what `bun run setup` configures: gentle-ai, community skills, MCPs, external CLIs, opt-out).

---

## Table of Contents

1. [The fundamental idea](#1-the-fundamental-idea)
2. [Three categories of moving parts](#2-three-categories-of-moving-parts)
3. [The lifecycle: five phases](#3-the-lifecycle-five-phases)
4. [The two confusing pieces](#4-the-two-confusing-pieces)
5. [How everything connects internally](#5-how-everything-connects-internally)
6. [`/sprint-development` vs `/sdd-*` — when to use which](#6-sprint-development-vs-sdd--when-to-use-which)
7. [Cheat sheet — "I want X, I run Y"](#7-cheat-sheet--i-want-x-i-run-y)
8. [Pieces you NEVER invoke directly](#8-pieces-you-never-invoke-directly)
9. [MCPs available](#9-mcps-available)
10. [TL;DR mental model](#10-tldr-mental-model)
11. [Where to go next](#11-where-to-go-next)

---

## 1. The fundamental idea

This repository is an **AI-driven development machine**. You clone it as the seed of a new product — frontend, backend, or both — and it holds the instructions, knowledge layer, and tooling the AI uses to drive the work from PRD to staging deploy. Unlike the QA half (which always pairs with a separate target codebase), this repo BECOMES the target: you fill it in, scaffold inside it, and ship from it.

For the machine to work, three kinds of moving parts cooperate: **Skills** that orchestrate long, multi-phase AI work; **Commands** that perform one-shot utilities; and **Scripts** you run yourself in the terminal to keep the configuration substrate healthy. All three feed off the same fuel — a system of variables defined in `.agents/project.yaml` that resolves to your project's specifics at AI session bootstrap.

Read [`../CONTEXT.md`](../CONTEXT.md) for the canonical map of how this repo structures its knowledge layer, and [`agentic-development-engineering.md`](agentic-development-engineering.md) §6 for the wider rationale on Context Engineering. This document focuses on *how the pieces connect* so you know what to invoke, in what order, and what each piece actually does.

If you came here looking for the QA half (sprint testing, test documentation, automation, regression), that lives in the companion repo [`agentic-qa-boilerplate`](https://github.com/upex-galaxy/agentic-qa-boilerplate). The two repos share the same `.agents/` variable system and skill layout, so a project can adopt both without duplication.

---

## 2. Three categories of moving parts

| Type | What it is | Where it lives | Who invokes it |
|------|------------|----------------|----------------|
| **Skill** | Multi-file markdown that orchestrates the AI through long, multi-phase tasks (subagents, decisions, references). | `.claude/skills/<name>/SKILL.md` + `references/` | The AI auto-activates when your prompt matches the skill's triggers. You can also force-load via `/skill-name`. |
| **Command** | Single-file markdown for one-shot, focused utilities. | `.claude/commands/<name>.md` | You explicitly type `/<name>`. No auto-trigger. |
| **Script** | TypeScript CLI that runs in the terminal. | `scripts/*.ts` (and `cli/`) | You run `bun run <script>` directly. |

The three categories share the same fuel: the variable substrate in `.agents/project.yaml` (and Jira metadata in `.agents/jira-fields.json` + `.agents/jira-required.yaml`). Skills resolve `{{VAR}}` placeholders against it on every AI session; commands use the same resolver; scripts read the YAML and write back to it. See §5 Circuit 1 for how that resolution actually flows.

---

## 3. The lifecycle: five phases

```
+-----------------+     +---------------+     +--------------+     +------------+     +-------------+
| Phase 0         | --> | Phase 1       | --> | Phase 2      | --> | Phase 3    | --> | Phase 4     |
| Bootstrap       |     | Foundation    |     | Scaffolding  |     | Daily dev  |     | Maintenance |
| (install)       |     | (define what) |     | (build base) |     | (sprint)   |     | (drift fix) |
+-----------------+     +---------------+     +--------------+     +------------+     +-------------+
```

Each phase has a clear trigger (one of the three categories above), a deterministic output, and a frequency. You move forward when the previous phase's output exists; you loop back to maintenance whenever the documentation drifts from reality.

### Phase 0 — Bootstrap

- **Trigger**: `bun install` → `bun run setup` (interactive installer). If you cloned skills à la carte and the foundation files are missing, you ALSO run `/agentic-dev-core` first to install `CLAUDE.md`, `.agents/`, the foundation scripts, and the `package.json` script entries.
- **Produces**: Dependencies installed, gentle-ai detected and configured (with 15 skills + Engram + SDD orchestrator on top of your agent), the 4 canonical MCPs wired into `.mcp.json` (Tavily, Context7, Supabase, n8n), external CLIs verified (`vercel`, `supabase`, `acli`, `playwright`, `resend`), a populated `.agents/install-state.json`. If your repo had no `CLAUDE.md` / `.agents/` yet, `/agentic-dev-core` writes them too.
- **Frequency**: One time per repo clone. If you cloned the full repository, the foundation is already in place — only `bun install` and `bun run setup` are needed.

### Phase 1 — Foundation (define what to build)

- **Trigger**: `/project-foundation` (skill). Drives the four-phase definition of the product itself.
- **Produces**:
  - **Constitution** — `.context/idea/*` (business model, market context, user personas, problem statement).
  - **Architecture** — `.context/PRD/*` (product requirements, user journeys, MVP scope) and `.context/SRS/*` (software requirements, infrastructure decisions, API contracts).
  - **Design system** — `DESIGN.md` at the repo root, via Phase 2.5 of foundation invoking `/design-system` (Google Labs spec: palette, typography, tokens, components).
  - **Discovery** — `.context/business/business-data-map.md`, `.context/business/business-api-map.md`, `.context/business/business-feature-map.md`, and (when generated) `.context/master-implementation-plan.md`.
- **Frequency**: Once per product. Re-run individual sub-commands (`/business-data-map`, `/business-feature-map`, `/business-api-map`, `/design-system`) when the domain or visual identity evolves.

### Phase 2 — Scaffolding (build the base)

- **Trigger**: `/project-bootstrap` (skill). Runs strictly AFTER Phase 1 — it consumes `.context/PRD/`, `.context/SRS/`, and `DESIGN.md` (if present).
- **Produces**: Backend skeleton (DB schemas, API base, types, error handling, OpenAPI + Scalar UI, bearer-token auth, env vars + URL builders, Supabase types generation), frontend skeleton (design system wired from `DESIGN.md`, project skeleton, routing). Modifies THIS repo only — never an external target.
- **Frequency**: Once per project. Re-run individual feature sub-flows when adding a new infrastructure feature (a new auth scheme, a new env, a new OpenAPI domain).

### Phase 3 — Daily dev work

Three workflow skills cover the in-sprint loop, ordered by altitude:

- `/product-management` — Backlog management: seed the backlog from the PRD, add a feature, create an epic, refine a story (INVEST + 3-amigos + Gherkin AC + edge cases), generate a sprint report. Continuous.
- `/sprint-development` — Per-story mega-orchestrator: Planning → Implementation → Code Review → Staging deploy → (gated) Production deploy. Drives the 12-step workflow per ticket (precheck epic, transition Jira ticket through dev states, plan, code, PR, review, docs, merge, deploy, optional rollback). Every story, every sprint.
- `/unit-testing` — TDD slice (red-green-refactor), test naming, mocking patterns, coverage strategy. Standalone or composed mid-flight from `/sprint-development` for TDD-shaped work.

The SDD bloque (`/sdd-explore`, `/sdd-propose`, `/sdd-spec`, `/sdd-design`, `/sdd-tasks`, `/sdd-apply`, `/sdd-verify`, `/sdd-archive`) is the alternative path for changes that look more like research projects than tickets — large refactors, architectural decisions, features without a ticket yet. See §6 for when to pick which.

Frequency: every sprint, every story. These skills are designed to be invoked many times per week.

### Phase 4 — Maintenance

When `.context/`, `CLAUDE.md`, or `.agents/` drifts from reality (you shipped new modules, added Jira fields, rebranded, changed API endpoints):

- `/sync-ai-memory` — syncs AI-critical documents (`CLAUDE.md`, `README.md`, `CONTEXT.md`, `docs/agentic-development-engineering.md`, `docs/getting-started.md`) and the rendered onboarding HTML against current `.context/` and `package.json`. Touches FACTS only — never structural sections.
- `/business-data-map`, `/business-feature-map`, `/business-api-map` — regenerate the individual maps when the domain or API evolves.
- `/master-implementation-plan` — regenerate the high-level dev roadmap when feature priorities shift.
- `/design-system` — re-run when rebranding or changing visual identity.
- `bun run jira:sync-fields` — re-catalog Jira custom fields after a new field is added.
- `bun run jira:check` — verify the Jira workspace still satisfies `jira-required.yaml`.
- `bun run lint:agents` — verify every `{{VAR}}` and `{{jira.<slug>}}` placeholder still resolves.
- `bun run api:sync` — regenerate OpenAPI types when the backend contract changes.

Frequency: as needed. Treat drift like compiler warnings — fix them when they appear, not in batches.

---

## 4. The two confusing pieces

Two pieces have similar-sounding names and overlapping verbs ("init", "bootstrap"). They are NOT interchangeable. Use this table to avoid running the wrong one.

| Piece | When you invoke it | What it does | Frequency |
|-------|--------------------|--------------|-----------|
| **`/agentic-dev-core`** (skill) | Once, ONLY if the foundation files are missing (à la carte install). If you cloned the full repo, you NEVER invoke it directly. | Generates `CLAUDE.md`, `.agents/project.yaml`, `.agents/jira-required.yaml`, the foundation scripts (`agents-setup`, `agents-lint`, `sync-jira-fields`, `check-jira-setup`), merges entries into `package.json`. Idempotent: existing files are preserved. | One-time |
| **`/project-bootstrap`** (skill) | Once per project, AFTER `/project-foundation` finishes. | Scaffolds the codebase: backend skeleton (DB, API, types, OpenAPI, auth, env), frontend skeleton (design system from `DESIGN.md`, routing, project structure). Modifies THIS repo. | One-time per project |

Mnemonic:

> `agentic-dev-core` installs the **agent harness** (so the AI knows the rules). `project-bootstrap` scaffolds the **codebase** (so there's a real backend and frontend to develop against).

### A passive role you never invoke

`agentic-dev-core` has a second life beyond its `init` mode: it **hosts shared references** that workflow skills cite on demand. When `/sprint-development`, `/product-management`, `/project-foundation`, or `/project-bootstrap` delegates to a subagent, the AI loads `agentic-dev-core/references/briefing-template.md`, `dispatch-patterns.md`, and `orchestration-doctrine.md` automatically. You never type `/agentic-dev-core` to read those files — they are pulled in as part of orchestration. This passive role is invisible from the user's seat, but it is why `agentic-dev-core` exists even after Phase 0 is complete.

---

## 5. How everything connects internally

Two circuits explain the wiring. Circuit 1 is about variable resolution (the static substrate). Circuit 2 is about subagent orchestration (the dynamic execution model).

### Circuit 1 — Variables

```
.agents/project.yaml   <-- bun run agents:setup writes here (interactive)
    |
    | values: project_name, project_key, web_url, api_url,
    |         jira_url, db_mcp, api_mcp, default_env, ...
    |
    v  resolves {{VAR}} placeholders at AI session bootstrap
CLAUDE.md, .claude/skills/**/SKILL.md, .claude/commands/*.md, templates/
    |
    v  AI substitutes {{VAR}} with the real value before acting
AI runs with concrete URLs, project keys, MCP server names
```

Critical distinction: **`.env` and `.agents/project.yaml` are TWO SEPARATE SYSTEMS**. Do not conflate them.

| | `.env` | `.agents/project.yaml` |
|--|--------|------------------------|
| **Purpose** | Runtime secrets and config consumed by the app and tooling | AI **context-engineering** variables for `{{VAR}}` resolution |
| **Consumers** | The application (env vars at runtime), CLIs (`vercel`, `supabase`, `acli`), Playwright fixtures, login helpers | AI agents (Claude Code, Cursor, Codex, Copilot, OpenCode) when resolving skill / template / doc references |
| **Examples** | `LOCAL_USER_EMAIL`, `STAGING_USER_PASSWORD`, `SUPABASE_SERVICE_ROLE_KEY`, `ATLASSIAN_API_TOKEN`, `MCP_CATALOG_FILE` | `PROJECT_KEY`, `WEB_URL`, `API_URL`, `JIRA_URL`, `DB_MCP`, `default_env` |
| **Secrets?** | Yes (passwords, tokens, API keys) | No — must remain commit-safe |
| **Committed?** | Gitignored (`.env.example` is committed as a template) | Committed |
| **Lifecycle** | Edited per developer / per CI runner | Edited once when adopting the boilerplate; rarely changes after |

Two systems, two consumers, two lifecycles. Secrets in `.env`; AI context in `.agents/project.yaml`.

The variable substrate has four syntaxes that look similar but resolve from different files. The full contract lives in `.agents/README.md`, but the short version is:

- `{{VAR_NAME}}` → resolves from `.agents/project.yaml`. Flat keys lex-lookup (`{{PROJECT_KEY}}` → `project.project_key`). Env-scoped keys (`{{WEB_URL}}`, `{{API_URL}}`, `{{DB_MCP}}`, `{{API_MCP}}`) resolve against the active environment.
- `{{environments.<env>.<var>}}` → explicit cross-env reference; bypasses active-env resolution. Used in multi-env tables.
- `<<VAR_NAME>>` → session variable, computed at runtime by the calling skill (e.g. `<<ISSUE_KEY>>` extracted from the git branch). Never persisted.
- `{{jira.<slug>}}` → portable Jira custom-field reference, resolves through `.agents/jira-required.yaml` (manifest) + `.agents/jira-fields.json` (workspace catalog).

For the deeper rationale on the knowledge split see [`agentic-development-engineering.md`](agentic-development-engineering.md) §6, and [`../CONTEXT.md`](../CONTEXT.md) for the canonical map specific to this repo.

### Circuit 2 — Orchestration

```
Workflow skill (e.g. /sprint-development)
    |
    | cites §Subagent Dispatch Strategy
    v
agentic-dev-core/references/briefing-template.md    <- 6-component format
agentic-dev-core/references/dispatch-patterns.md    <- Single/Sequential/Parallel/Background
    |
    | orchestrator builds the briefing
    v
Subagent (fresh Claude context)
    |
    | loads tool skill per the briefing
    v
/acli, /git-flow-master, /playwright-cli (community)
    |
    v  executes real shell commands
acli jira workitem transition, git commit, gh pr create, playwright test, ...
```

This is the canonical pattern the workflow skills follow. The doctrine itself lives in `CLAUDE.md` §Orchestration Mode and is mirrored at `.claude/skills/agentic-dev-core/references/orchestration-doctrine.md` so subagents can load it without pulling the full `CLAUDE.md` into their fresh context. Each workflow skill declares its specific dispatch points in a `## Subagent Dispatch Strategy` section per-skill (which steps delegate, which pattern, which subagent role).

The takeaway: when you invoke `/sprint-development` or `/project-foundation`, the orchestrator reads its own dispatch strategy, writes a 6-component briefing for each subagent (Goal · Context docs · Skills to load · Exact instructions · Report format · Rules), and the subagent loads tool skills (`/acli`, `/git-flow-master`, `/playwright-cli`) to actually run shell commands. This is what makes the main conversation "lean" — the heavy reading happens inside subagents, not in the main thread.

### The context system (3-level hierarchy)

A separate but related substrate is the per-project context AI agents read on demand. Three levels load progressively, biggest to smallest:

**Level 1 — Project-wide** (loaded at session start):

```
.context/business/business-data-map.md     → System flows and entities
.context/business/business-feature-map.md  → Feature inventory + CRUD matrix
.context/business/business-api-map.md      → Auth model + critical endpoints
.context/master-implementation-plan.md     → Prioritized feature roadmap
```

**Level 2 — Module-level** (shared across stories in a module):

```
.context/PBI/{module}/
  module-context.md                → Module overview and shared context
  ROADMAP.md                       → All stories and their dev status
  PROGRESS.md                      → Current progress tracker
  SESSION-PROMPT.md                → @-loadable session resume prompt
```

**Level 3 — Story-level** (per story):

```
.context/PBI/{module}/{TICKET-ID}-{name}/
  context.md                       → ACs, data, session notes, open questions
  implementation-plan.md           → Plan produced by /sprint-development
  evidence/                        → Screenshots, traces, logs (gitignored)
```

`/sprint-development` reads Level 1 + the relevant Level 2 + the story's Level 3 when it starts a ticket. `/product-management` writes Level 2 + Level 3 when it seeds stories. `/sync-ai-memory` keeps Level 1 in sync with reality.

---

## 6. `/sprint-development` vs `/sdd-*` — when to use which

The most common point of confusion. Both workflows can drive a feature to merge. They serve different shapes of work.

| When                                                                 | Skill                                                        |
| -------------------------------------------------------------------- | ------------------------------------------------------------ |
| Routine Jira ticket work (most cases)                                | `/sprint-development` (ticket-driven workflow)                       |
| Large refactor / architectural decision / feature without ticket yet | `/sdd-*` (spec-driven workflow)                              |
| Story with detailed specs you want to trace formally                 | Both: `/sdd-spec` for spec, then `/sprint-development` for the cycle |

### When to reach for `/sprint-development`

The default choice for normal day-to-day work. You have a Jira ticket, the AC is reasonably clear, the change is bounded (1-3 PRs), and you want the standard cycle: precheck the epic, transition the ticket through dev states (`Ready For Dev → In Progress → In Review → Ready For QA`), plan, code, code review, deploy to staging, optionally deploy to production. Nothing about the change requires a multi-page architectural document — a clear implementation plan is enough.

Example: "Add empty state to the user list when no results match the filter." Ticket exists, AC is 3 bullets, scope is one component plus one helper. `/sprint-development` drives the whole thing.

### When to reach for `/sdd-*`

The right choice when the change is shaped more like a research project than a ticket. You're touching architecture, the design space has alternatives worth comparing, the change crosses several modules, or there's no ticket yet because no one has scoped the work. SDD gives you explicit phases (explore → propose → spec → design → tasks → apply → verify → archive) and an artifact trail that survives across sessions via Engram.

Example: "Replace the auth model — move from session cookies to JWT with refresh rotation." This is a change that benefits from `/sdd-explore` (investigate the current model), `/sdd-propose` (compare approaches), and `/sdd-design` (commit to an architecture) before any code lands.

### When to combine both

You have a ticket but the spec is dense and you want it traced formally. Run `/sdd-spec` first to lock down the requirements and scenarios as a delta spec, then hand off to `/sprint-development` for the implementation cycle. The spec gets archived after the ticket merges, leaving a permanent trace for future readers.

The `/sdd-*` skills are installed by gentle-ai during `bun run setup`. If you opted out of gentle-ai, only `/sprint-development` is available — see [`../INSTALLER.md`](../INSTALLER.md) for the opt-out trade-off.

---

## 7. Cheat sheet — "I want X, I run Y"

| I want to... | I run... |
|--------------|----------|
| Start fresh on a new product | `bun install` → `bun run setup` → `/project-foundation` → `/design-system` → `/project-bootstrap` |
| Seed the backlog from the PRD | `/product-management` (seed flow) |
| Add a new feature or epic | `/product-management` (add-feature / create-epic flow) |
| Refine a story (INVEST + AC + edge cases) | `/product-management` (refine flow) |
| Implement a Jira ticket end-to-end | `/sprint-development` (pass the ticket key) |
| Plan a multi-PR refactor with architecture decisions | `/sdd-new <change>` (explore + propose) |
| Fast-forward all SDD planning phases | `/sdd-ff <change>` (proposal → spec → design → tasks) |
| Implement SDD tasks | `/sdd-apply` |
| Verify SDD implementation against specs | `/sdd-verify` |
| Archive a completed SDD change | `/sdd-archive` |
| Run a TDD slice on a function | `/unit-testing` |
| Generate or update `DESIGN.md` | `/design-system` |
| Regenerate the business data map | `/business-data-map` |
| Regenerate the business feature map | `/business-feature-map` |
| Regenerate the business API map | `/business-api-map` |
| Generate the high-level dev roadmap | `/master-implementation-plan` |
| Sync AI memory (CLAUDE.md + README.md + CONTEXT.md + docs/ + onboarding HTML) | `/sync-ai-memory` |
| Commit + push + open a PR (or any git/PR work) | `/git-flow-master` (auto-triggers on git intents) |
| Resolve a git conflict | `/git-flow-master` (auto-triggers on conflict intents) |
| Work with Jira from the CLI | `/acli` (transitions, work items, comments) |
| Onboard a new team member to this repo | `/agentic-dev-onboard` |
| Take a screenshot via AI | `/playwright-cli` (community skill) |
| Sync new Jira custom fields | `bun run jira:sync-fields` |
| Pull Jira Epics/Stories into `.context/PBI/` markdown | `bun run jira:sync-issues` |
| Validate `{{VAR}}` / `{{jira.*}}` placeholders | `bun run lint:agents` |
| Verify the Jira manifest matches the catalog | `bun run jira:check` |
| Sync OpenAPI types from the API spec | `bun run api:sync` |
| Update this template from upstream | `bun run up` |
| Lint or auto-fix the codebase | `bun run lint` / `bun run lint:fix` |
| Format with Prettier | `bun run format` |
| Bootstrap from scratch (à la carte install) | `/agentic-dev-core` |

Every command above exists in `.claude/skills/`, `.claude/commands/`, or `package.json`. None are placeholders.

---

## 8. Pieces you NEVER invoke directly

These are passive loads — the AI pulls them in as part of orchestration, not because you typed a command.

- **Tool / community skills** (`/playwright-cli`, `/gh-cli`, `/skill-creator`, `/find-skills`, `next-best-practices`, `tailwind-css-patterns`, `shadcn`, etc.): the AI loads them automatically when a workflow skill needs to talk to a browser, GitHub, or a specific stack. You can force-load them when you genuinely need a one-shot operation, but they are usually invoked by other skills, not by you.
- **`agentic-dev-core/references/*`** (`briefing-template.md`, `dispatch-patterns.md`, `orchestration-doctrine.md`): the AI loads these when a workflow skill delegates to a subagent. They are passive references — the subagent loads them inside its own context to know the canonical briefing format and dispatch decision rules.
- **Templates inside `.claude/skills/agentic-dev-core/templates/`** (`CLAUDE.md.template`, `project.yaml.template`, `jira-required.yaml.template`, the `scripts/*.ts.template` files): only consumed by `/agentic-dev-core` during init. They are byte-equivalent mirrors of the live files at the repo root.
- **SDD orchestrator + SDD skills** (`sdd-init`, `sdd-explore`, `sdd-propose`, `sdd-spec`, `sdd-design`, `sdd-tasks`, `sdd-apply`, `sdd-verify`, `sdd-archive`, `skill-registry`): installed by gentle-ai, hosted at the user level (not in this repo). They are invoked directly when you choose the SDD path (see §6), but the orchestrator that coordinates them runs in the background — you talk to it via the `/sdd-*` triggers, not to its internal phase agents.
- **Engram (MCP persistent memory)**: not a skill — an MCP server that auto-captures decisions, conventions, and bug fixes across sessions. `mem_save` / `mem_search` / `mem_context` are called by the AI proactively, not by you. The protocol lives in your global `CLAUDE.md`.

---

## 9. MCPs available

The four canonical MCPs are configured by `bun run setup`. Each one fills a specific need:

| MCP          | Use it for                          | When NOT to use                          |
| ------------ | ----------------------------------- | ---------------------------------------- |
| **Context7** | Official library / framework docs (React, Next.js, Supabase, Tailwind, etc.) | "How do I solve X" — that's Tavily territory |
| **Tavily**   | Web search, community solutions, troubleshooting | Library API syntax — that's Context7 |
| **Supabase** | Database queries, schema inspection, migrations, project state | App-level business logic — that's the application code |
| **n8n**      | Workflow automation, scheduled triggers, third-party integrations | Synchronous user-facing API logic |

Plus the always-available **Engram** MCP (persistent memory, installed by gentle-ai) — not in the table above because you don't invoke it; the AI calls it automatically on every save-worthy event.

Decision rule for the AI (and for you when deciding which to suggest):

- Context7 for "how to use X" (official docs)
- Tavily for "how to solve X" (community solutions)
- Supabase for database / project state
- n8n for workflow automation

---

## 10. TL;DR mental model

- **Skills** = play scripts for the AI (multi-act, with characters that delegate).
- **Commands** = single-act utilities.
- **Scripts** (`bun run …`) = what YOU run in the terminal to keep the fuel (`.agents/project.yaml` + Jira fields) healthy.
- **`.context/`** = what the AI KNOWS about the product (generated by `/project-foundation`, kept fresh by `/sync-ai-memory` + `/business-*` commands).
- **`DESIGN.md`** = the visual identity contract (generated by `/design-system`, consumed by `/project-bootstrap` when scaffolding the frontend).
- **The repo** = the codebase itself (scaffolded by `/project-bootstrap`, developed via `/sprint-development` + `/unit-testing`, or via `/sdd-*` for architectural changes).

If you only remember one thing:

> Install with `bun run setup`, define the product with `/project-foundation` (which calls `/design-system` for visual identity), scaffold the codebase with `/project-bootstrap`, seed the backlog with `/product-management`, then drive every story with `/sprint-development`. Reach for `/sdd-*` only when the change is too architectural to fit in a single ticket.

---

## 11. Where to go next

- [`../README.md`](../README.md) — the GitHub-landing summary, install steps, repository structure, and Skills catalog.
- [`../CLAUDE.md`](../CLAUDE.md) — the canonical project memory + Tool Resolution table that maps `[TAG_TOOL]` pseudocode to concrete CLIs / MCPs.
- [`../CONTEXT.md`](../CONTEXT.md) — Context Engineering canonical map for this repo: stable file names, the `.context/` vs `.claude/` split, architectural decisions, and operational DO/DON'T rules.
- [`agentic-development-engineering.md`](agentic-development-engineering.md) — methodology deep dive. §6 covers the **why** behind the knowledge layer: token efficiency, progressive loading, the `.env` vs `.agents/project.yaml` split, the four variable syntaxes.
- [`../INSTALLER.md`](../INSTALLER.md) — what `bun run setup` configures: gentle-ai (SDD skills, Engram, foundation skills), community skills, MCPs, external CLIs, the hand-off matrix `/sprint-development` vs `/sdd-*`, and how to opt out of gentle-ai.
- [`setup/jira-setup-guide.md`](setup/jira-setup-guide.md) — configuring Jira credentials and the Atlassian MCP.
- [`setup/README.md`](setup/README.md) — index of setup guides in this repo.
- [`../.agents/README.md`](../.agents/README.md) — the full `.agents/` contract: variable syntaxes, validation scripts, workflows for adding prompts or required Jira fields, troubleshooting.
- [`../.claude/skills/agentic-dev-core/SKILL.md`](../.claude/skills/agentic-dev-core/SKILL.md) — foundation skill internals (bootstrap order, idempotency rules, source-of-truth contract).
- [`agentic-qa-boilerplate`](https://github.com/upex-galaxy/agentic-qa-boilerplate) — the companion repo. If you need QA workflows (sprint testing, test documentation, automation, regression), that lives there. Same `.agents/` system, complementary skill layout.

---

**Last Updated**: 2026-05-11
