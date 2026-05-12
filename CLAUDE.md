# CLAUDE.md — AI Persistent Memory

> **THIS IS NOT A README.** This file loads into AI context EVERY session. Every token persists. Keep lean, priority-ordered, AI-first.
>
> - User-facing setup, scripts, structure diagrams → `README.md` / `docs/`.
> - Heavy detail → skill `references/` (lazy-loaded by sub-agents).
> - Project values (URLs, project name, Jira URL) → `.agents/project.yaml`.
> - Current scripts → READ `package.json` DIRECTLY. Do not trust hardcoded lists.
>
> Structural mirror: `.claude/skills/agentic-dev-core/templates/CLAUDE.md.template`. Sync manually on structural changes.

---

## 1. CRITICAL RULES — ALWAYS APPLY

1. **CREDENTIALS**: ALWAYS read from `.env`. NEVER hardcode/guess. Example keys: `LOCAL_USER_EMAIL`, `STAGING_USER_PASSWORD`. Add `[Project-specific reminders]` per project (e.g. "SPA and API on different hosts — use correct base URLs").
2. **PLAN BEFORE CODING**: Produce implementation plan (`spec.md` or skill-internal plan) BEFORE writing code. Flow: Plan → Code → Review.
3. **NO AI ATTRIBUTION**: NEVER include "Generated with Claude Code", "Co-Authored-By: Claude" in commits. Commits look human-authored.
4. **CONFIRM BEFORE PUSH TO MAIN**: NEVER push to `main` without explicit user confirmation.
5. **GIT HISTORY**: NEVER rewrite pushed history (rebase / amend on pushed commits). NEVER force-push to shared branches. NEVER delete remote branches without confirmation. ALWAYS add forward (new commits, not rewrite). ALWAYS preserve merge history.
6. **QUALITY VERIFICATION**: After code changes, verify in order: tests → types → lint. Do not skip steps.
7. **FILE OPERATIONS**: ALWAYS read file before edit. Preserve formatting + indent. NEVER overwrite without reading.
8. **SKILLS-FIRST**: All workflows live in `.claude/skills/`. NEVER paste instructions inline. Invoke the matching skill, let it self-load detail. Use `[TAG_TOOL]` pseudocode and `{{VARIABLES}}` for dynamic content.
9. **UNIT TESTS** are part of `/sprint-development`. Optionally TDD via `/unit-testing` (composable mid-flight).
10. **PLAYWRIGHT CLI**: For browser automation, load `/playwright-cli` skill (screenshots, tracing, video, session mgmt, request mocking). Skill at `.claude/skills/playwright-cli/`.
11. **MCP CREDENTIAL FAILURE = STOP IMMEDIATELY**: If MCP fails auth or env var missing (`.mcp.json` uses `${VAR}` — Claude Code fails parse if unset; `opencode.jsonc` uses `{env:VAR}` — OpenCode silently substitutes empty → 401/403 is the signal). DO NOT work around. STOP, tell user the exact env var, point to `.env` / `.env.example`, ask them to fix `.env` and **RESTART AGENT SESSION** (env cached at MCP-spawn time, won't refresh mid-session).
12. **SCRIPTS = READ `package.json` DIRECTLY**. NEVER quote build/test/lint commands from this file or any doc — drift kills. Open `package.json` first, then answer.

---

## 2. BEHAVIORAL LAYER — HOW AI REASONS

> Bias toward caution over speed. Trivial tasks use judgment. Full examples + working-signals → `references/behavioral-layer.md`.

**THINK BEFORE CODING.** State assumptions explicit. Multiple interpretations → present them, NEVER pick silently. Simpler approach exists → say so. Unclear → STOP, name confusion, ASK. Exploratory questions get 2-3 sentence recommendation + main tradeoff, not implementation.

**SIMPLICITY FIRST.** Minimum code that solves problem. No features beyond ask. No abstractions for single-use. No "flexibility" not requested. No error handling for impossible scenarios. 200 lines that could be 50 → rewrite. *Scope note*: do NOT collapse scaffold architecture layers (`api/` / `schemas/` / `db/` boundaries in backend, design-system structure in frontend) — framework architecture, not speculative abstraction.

**SURGICAL CHANGES.** Touch only what required. Match existing style even if you'd do it differently. Don't refactor unbroken code. Don't improve adjacent comments/formatting. Notice unrelated dead code → mention, don't delete. Remove imports/vars YOUR changes made unused. *Scope note*: regenerative commands EXEMPT — regen IS the task: `/agentic-dev-core` init, `/project-foundation`, `/design-system`, `/project-bootstrap`, `/sync-ai-memory`, `/sprint-development` impl-plan stage, `/product-management` AC-writing.

**GOAL-DRIVEN EXECUTION.** Define success criteria. Loop until verified. Transform vague tasks into testable goals ("add validation" → "write tests for invalid input, then make them pass"). Multi-step → state plan with explicit `verify:` per step (observable: test passes, file exists, exit 0, type-check clean). Complements 6-component briefing (§3) — does NOT replace it.

**SIGNALS THESE WORK**: fewer unnecessary diff changes, fewer rewrites from overcomplication, clarifying questions BEFORE implementation rather than after mistakes.

---

## 3. ORCHESTRATION MODE — PERMANENTLY ACTIVE

> **Main conversation = command center. Subagents = executors.** Active EVERY session. Not optional.

**USE SUBAGENTS FOR**: reading/writing multiple files, MCP operations, research across repos, git operations, verification (tests/types/lint), multi-file edits, long-running tasks.

**DO NOT USE SUBAGENTS FOR**: quick lookups, memory reads/writes, task tracking, asking user, planning.

**6-COMPONENT BRIEFING (MANDATORY every dispatch)**:

1. **Goal** — one sentence
2. **Context docs** — files to read first
3. **Skills to load** — explicit (e.g. `/playwright-cli`)
4. **Exact instructions** — step-by-step, not vague goals
5. **Report format** — what to return (files changed, tests passed, blockers)
6. **Rules** — relevant Critical Rules to follow

**EXECUTION PATTERNS**:

| Pattern | When | Example |
|---|---|---|
| Parallel | Independent tasks | Read 3 context files at once |
| Sequential | Dependent tasks | Plan → Code → Test |
| Background | Long-running | Test suite + plan next ticket |
| Single | Simple task | One file edit + verification |

**ERROR PROTOCOL**: On subagent error → STOP, report full context, DO NOT fix without approval, offer retry/skip/abort.

**DEEP DETAIL** (subagent-cacheable, do not inline here):

- `.claude/skills/agentic-dev-core/references/orchestration-doctrine.md` — cacheable mirror, subagent-loadable without full CLAUDE.md
- `.claude/skills/agentic-dev-core/references/briefing-template.md` — 6-component briefing examples per pattern
- `.claude/skills/agentic-dev-core/references/dispatch-patterns.md` — when to Single / Parallel / Sequential / Background
- `.claude/skills/agentic-dev-core/references/skill-composition-strategy.md` — T1/T2/T3/T4 tier model, conflict resolutions, delegation points

---

## 4. CONTEXT LOADING MAP — TASK → WHAT TO LOAD

> BEFORE responding to any task: identify task type → load matching skill → read listed context. NEVER guess scripts/commands — READ `package.json` DIRECTLY.

| Task | Trigger phrase | Load skill | Read context | Primary tool |
|---|---|---|---|---|
| First-time orientation | "onboard me", "first time using this" | `/agentic-dev-onboard` | (skill self-loads) | — |
| One-time repo bootstrap | "initialize the project", "regenerate CLAUDE.md" | `/agentic-dev-core` | target repo state | Read + Write |
| Foundational definition (PRD/SRS/Discovery) | "define el PRD", "ideando un nuevo producto" | `/project-foundation` | `idea/`, `PRD/`, `SRS/`, business maps | Read + Write |
| Design system (DESIGN.md) | "definir design system", "rebrandear el proyecto" | `/design-system` | `idea/constitution.md`, `PRD/` | Write |
| Infra scaffolding (backend/frontend) | "scaffolding del proyecto", "API routes setup" | `/project-bootstrap` | `SRS/infrastructure.md`, `DESIGN.md` | Code edit |
| Backlog / story refinement | "create epic", "refine acceptance criteria" | `/product-management` | `.context/PBI/{module}/ROADMAP.md`, `PRD/` | `[ISSUE_TRACKER_TOOL]` |
| Sprint-development ticket | "implementar esta historia", "trabajar UPEX-XXX" | `/sprint-development` | `.context/PBI/{module}/{TICKET}-*/` | `[ISSUE_TRACKER_TOOL]` + `[AUTOMATION_TOOL]` |
| TDD slice / unit tests | "write unit tests", "TDD this function" | `/unit-testing` | function under test, existing tests | Code edit |
| Sync AI memory | "sync memory", `/sync-ai-memory` | `/sync-ai-memory` | `README.md`, this file, `.context/`, `package.json` | Edit |
| Business map refresh | "refresh data map", `/business-*-map` | `/business-data-map` / `-feature-map` / `-api-map` | Supabase schema, backend code, PRD | Read + Write |
| Git / PR work | any git intent | `/git-flow-master` (auto) | `git status`, `git log` | `git` + `gh` |
| Browser action | "screenshot", "trace", "record" | `/playwright-cli` | — | Playwright CLI |
| Jira operation | "Jira issue", "transition story" | `/acli` | `.agents/jira-required.yaml`, `.agents/jira-fields.json` | CLI |
| Any script / build / test command question | "what command runs X", "how do I run lint" | — | **READ `package.json` FIRST** | — |

**Key paths**:

- `.context/business/business-data-map.md` · `business-feature-map.md` · `business-api-map.md` — system maps (refresh via `/business-*-map`)
- `.context/master-implementation-plan.md` — prioritized roadmap
- `.context/PBI/{module}/` — module-level (ROADMAP, PROGRESS, SESSION-PROMPT)
- `.context/PBI/{module}/{TICKET}-{title}/` — story-level (context.md, implementation-plan.md, evidence/)
- `.agents/project.yaml` — `{{VAR}}` source-of-truth (load ONCE per session, cache)
- `.agents/jira-fields.json` · `jira-workflows.json` · `jira-required.yaml` — Jira catalogs

---

## 5. SKILLS + COMMANDS + MCPs REGISTRY

### Skills T1 (committed in `.claude/skills/`, 10)

| Skill | Trigger | Purpose |
|---|---|---|
| `agentic-dev-core` | `/agentic-dev-core` | Foundation: hosts shared references + bootstraps `.agents/`, scripts, CLAUDE.md. |
| `agentic-dev-onboard` | `/agentic-dev-onboard` | First-time orientation. Stack + Jira workflow + skill map + MCPs. |
| `project-foundation` | `/project-foundation` | Constitution + Architecture (PRD/SRS) + Discovery (data/api/dev-guide). |
| `design-system` | `/design-system` | DESIGN.md (Google Labs spec) — 5 paths. Pre-scaffolding visual contract. |
| `project-bootstrap` | `/project-bootstrap` | Infra scaffolding: backend, frontend, OpenAPI, auth, env, Supabase types. |
| `product-management` | `/product-management` | Backlog seed + epic + INVEST/AC refinement + sprint report. |
| `sprint-development` | `/sprint-development` | **Mega-orchestrator**. Per-story Plan → Implement → Review → Staging → Prod (gated). Composes SDD bundle on Path B (see §12). |
| `unit-testing` | `/unit-testing` | TDD red-green-refactor, mocking, coverage. Composable with `/sprint-development`. |
| `git-flow-master` | (auto on git/PR intents) | End-to-end Git operator. Auto-detects branching strategy. |
| `acli` | `/acli` | Atlassian CLI cookbook (Jira + Confluence). Resolves `[ISSUE_TRACKER_TOOL]`. |
| `playwright-cli` | `/playwright-cli` | Browser CLI: screenshots, tracing, video, session, request mocking. |

> **T2 (gentle-ai, 15 skills)** — SDD bundle (sdd-init/explore/propose/spec/design/tasks/apply/verify/archive/onboard) + skill-registry + judgment-day + cognitive-doc-design + comment-writer. Composed silently by T1 orchestrators per the **Skill Composition Protocol** in `references/skill-composition-strategy.md`. Run `bun run setup` to install.
>
> **T3 (community project-level)** — frontend/backend skills matched by category at runtime, NOT by literal name. List lives in `cli/install.ts`.
>
> **T4 (community user-level)** — repo-agnostic skills, auto-discovered at runtime, **ASK before load** per strategy §3.2.

### Slash commands (utilities, 5)

| Command | Purpose |
|---|---|
| `/sync-ai-memory` | Audit + sync README, CLAUDE.md, CONTEXT.md, docs/, onboarding HTML against current repo state. |
| `/business-data-map` | Refresh `.context/business/business-data-map.md` (entities, flows, state machines). |
| `/business-feature-map` | Refresh `.context/business/business-feature-map.md` (CRUD matrix, UI inventory). |
| `/business-api-map` | Refresh `.context/business/business-api-map.md` (auth model, endpoints, architecture). |
| `/master-implementation-plan` | Refresh `.context/master-implementation-plan.md` (prioritized feature roadmap). |

### MCPs (configured in `.mcp.json`)

| MCP | Use for | Rule |
|---|---|---|
| Tavily | Web search, troubleshooting community solutions | `[WEB_SEARCH_TOOL]` |
| Context7 | Library official docs ("how to use X") | Prefer over web search for library APIs |
| Supabase | DB queries, schema, project state | `[DB_TOOL]` primary |
| n8n | Workflow automation, integrations | `[AUTOMATION_FLOWS_TOOL]` |
| Atlassian | Jira/Confluence fallback | Use only when `/acli` unavailable |

---

## 6. TOOL RESOLUTION ([TAG_TOOL] pseudocode)

> Skills use `[TAG_TOOL]` pseudocode. Resolve via this table. **PRIORITY**: CLI tools first (fewer tokens). MCP = fallback only.

| Tag | Domain | Primary | Fallback |
|---|---|---|---|
| `[ISSUE_TRACKER_TOOL]` | Jira Cloud (story/bug/epic) | `/acli` | MCP Atlassian |
| `[AUTOMATION_TOOL]` | Browser automation | `/playwright-cli` | MCP Playwright |
| `[DB_TOOL]` | Database | Supabase MCP | raw SQL via Supabase CLI |
| `[API_TOOL]` | API exploration | curl + OpenAPI types (`bun run api:sync`) | Postman manual |

**MANDATORY**: LOAD owning skill BEFORE invoking its tool. Skills hold WHEN/WHAT only. HOW (syntax, flags, auth, pagination, errors) lives inside the owning skill's `references/`.

**Pseudocode value types**: `Literal` (fixed domain) · `{per convention}` (consult skill ref) · `{{PROJECT_VAR}}` (from `.agents/project.yaml`) · `{from analysis}` (runtime-derived).

---

## 7. PROJECT VARIABLES — POINTER

> ALL variable syntax + Jira field references documented in **`.agents/README.md`**. READ ONCE per session, cache values.

Project values live in **`.agents/project.yaml`** — load once per session. NEVER hardcode Project Identity, environment URLs, Jira URL, project key, MCP names. ALWAYS read them from `.agents/project.yaml`.

**Variable syntaxes (cheat-sheet)**:

- `{{VAR_NAME}}` → static project var. Flat: `{{PROJECT_KEY}}` → `project.project_key`. Env-scoped: `{{WEB_URL}}`, `{{API_URL}}`, `{{DB_MCP}}`, `{{API_MCP}}` → `environments[active_env].<var>`. Cross-env: `{{environments.<env>.<var>}}`.
- `<<VAR_NAME>>` → session var computed at runtime (e.g. `<<ISSUE_KEY>>` from git branch). Never persisted.
- `{{jira.<slug>}}` → Jira custom field via `.agents/jira-fields.json` ↔ `.agents/jira-required.yaml`. Sub-forms: `{{jira.<slug>.<option>}}`, `{{jira.<slug>.<parent>.<child>}}`.
- `{{jira.work_type.<slug>}}` / `{{jira.status.<work_type>.<slug>}}` / `{{jira.transition.<work_type>.<slug>}}` → Jira workflow refs via `.agents/jira-workflows.json`.

**Active env**: `active_env` defaults to `testing.default_env` in `.agents/project.yaml`. If user says "test against production" → switch `active_env` to `production` for that session, ignore `default_env` until session ends.

**Validation**: `bun run lint:agents` checks every `{{VAR}}` resolves; `bun run jira:check` validates manifest vs catalog.

---

## 8. AI BEHAVIOR DURING DEVELOPMENT

1. **EXPLAIN THE STORY**: once ticket understood, briefly state — what the feature is, how it works (simple terms), what will be developed.
2. **WAIT FOR CONFIRMATION**: after important explanations, WAIT for user response before continuing.
3. **EXPLAIN DEFECTS**: on bug / unexpected behavior — describe observed, explain why it's a problem, suggest impact (severity, affected users, business risk).
4. **LANGUAGE**: default English. If user writes other language → mirror it in user-facing communication. Docs + code ALWAYS English.

**ENVIRONMENT SELECTION**: default to **staging** unless user specifies otherwise. Ask when ambiguous. URLs from `.agents/project.yaml`. Credentials from `.env`.

**CONTEXT EFFICIENCY**: main conversation stays lean (no large file reads). Subagents do heavy reading. Skills load only the references the current phase needs.

---

## 9. LOCAL CONTEXT (PBI)

For every story being developed, maintain local docs under `.context/PBI/`:

```
.context/PBI/{module-name}/
  module-context.md          # Module overview + shared context
  ROADMAP.md                 # All stories + dev status
  PROGRESS.md                # Current progress tracker
  SESSION-PROMPT.md          # @-loadable session resume prompt
  {TICKET-ID}-{brief-title}/
    context.md               # ACs, data, session notes, open questions
    implementation-plan.md   # Plan produced by /sprint-development
    evidence/                # Screenshots, traces, logs (gitignored)
```

Variables: `{module-name}` = kebab-case module (`user-management`). `{TICKET-ID}` = issue tracker id (`UPEX-277`). `{brief-title}` = max ~5 words kebab-case AI-generated.

**ENTRY POINT**: invoke `/sprint-development` — fetches ticket, explains story, loads context, drives plan → code → review → deploy.

**RESUME SESSION**: `@.context/PBI/{module}/SESSION-PROMPT.md` — @-loadable, restores full context without copy-paste.

---

## 10. STACK QUICK-REFERENCE (TypeScript + DRY)

> Full TS conventions live in feature dev-guide (Discovery output via `/project-foundation`) if present, else fallback `.claude/skills/agentic-dev-core/references/typescript-patterns.md`. LOAD `/sprint-development` before writing or reviewing feature code.

| Pattern | Rule |
|---|---|
| **Parameters** | Max 2 positional. 3+ → object param |
| **Utilities** | Agnostic only — no domain coupling in shared modules |
| **Imports** | Always aliases (`@api/`, `@schemas/`, `@utils/`). No deep relative imports |
| **Types** | Declare interfaces at top of file, after imports |
| **Errors** | Public methods: fail fast (throw). Utilities: silent fail (return null) |

**DRY — context matters**:

- `api/schemas/` = OpenAPI type facades (`@schemas/{domain}.types`). Single source of truth.
- Shared utilities = framework-agnostic only. No React, no Next, no Bun-specific APIs.
- Domain logic stays inside its feature folder. Move to `shared/` only when ≥2 features import AND abstraction is stable.

---

## 11. GIT WORKFLOW — POINTERS

Git / PR work → `/git-flow-master` auto-loads. Full details in `.claude/skills/git-flow-master/` and `docs/workflows/git-flow.md` if present.

**Protected branches**:

| Branch | Role |
|---|---|
| `main` | Production. PRs merged from `staging` or `feature/*` after review. |
| `staging` | Integration branch for AI commits + pre-release validation. |
| `feature/*` | Task-specific. Use `feature/TICKET-ID-desc`. |
| `fix/*` | Bug-fix branches. Use `fix/TICKET-ID-desc`. |

**Critical commit rules** (also enforced in §1):

- Semantic prefixes: `feat:` / `fix:` / `docs:` / `test:` / `refactor:` / `chore:`
- One commit = one responsibility. Clear messages.
- **NO AI attribution** in commits.
- **Confirm before push to `main`**.
- Branch + commit + push + PR + conflict-fix + chained-PR planning all in `/git-flow-master`.

---

## 12. DELIVERY STRATEGY — Path A vs Path B

`/sprint-development` selects path based on story complexity. Pick the right path at session start to avoid wasted SDD overhead on simple stories or insufficient rigor on complex ones.

| Path | Gate | Skills invoked |
|---|---|---|
| **A — Simple** | Jira ticket · ≤400 LOC · no new architecture · no Strict TDD | `/sprint-development` only. No SDD calls. |
| **B — Complex** | multi-file refactor OR new architecture OR >400 LOC OR Strict TDD active | `sprint-development` orchestrates: `sdd-init` → `sdd-design` → `sdd-tasks` (delivery-strategy gate) → `sdd-apply` → `sdd-verify` → `sdd-archive`. Sprint-dev keeps Jira transitions, deploy, rollback. |

Full contract: `.claude/skills/agentic-dev-core/references/skill-composition-strategy.md`.

---

## 13. PROACTIVE MEMORY TRIGGERS

Engram MCP is configured. Call `mem_save` IMMEDIATELY (no user prompt needed) after ANY of:

- **Architecture / design decision made** (tradeoffs chosen, alternative rejected).
- **Convention or workflow established** (naming, structure, lint rule, branch policy).
- **Bug fix completed** — include root cause, not just the fix.
- **Non-obvious discovery, gotcha, or edge case** found.
- **Session close** — MANDATORY `mem_session_summary` before saying "done" / "listo".

Self-check after every task: *did I make a decision, fix a bug, learn something non-obvious, or establish a convention? If yes → `mem_save` NOW.*

---

*AI persistent memory. Update when behaviors / skills / rules change. Mirror to `.claude/skills/agentic-dev-core/templates/CLAUDE.md.template`.*
