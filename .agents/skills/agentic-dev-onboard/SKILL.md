---
name: agentic-dev-onboard
description: "Walks new users through this repo's dev flow — Next.js + Supabase stack, Jira workflow (Ready For Dev → In Progress → In Review → Ready For QA), /sprint-development for ticket-driven work, MCP capabilities (library docs, web search at harness level, DB, automation flows), critical env vars, Critical Rule #10 (READ package.json DIRECTLY). Triggers on: `onboard me`, `explain this repo`, `first time using this`, `primer vez en este repo`, `/agentic-dev-onboard`. Do NOT use for: feature implementation (use /sprint-development), test design (use /unit-testing), backlog refinement (use /product-management)."
license: MIT
compatibility: [claude-code, codex, opencode]
phase: foundation
complementary_categories: []
# compact_rules is consumed VERBATIM by scripts/build-skill-registry.ts (frontmatter-first,
# no truncation). Keep in sync with the MCP decision rule + "What this skill does NOT do" in the body below.
compact_rules: |
  - Use `library-docs` (Context7) for "how to use X" — official docs, current API
  - Use `web-search` (Exa or Tavily, connected at harness level) for "how to solve X" — community fixes, troubleshooting
  - Use **Atlassian** only as fallback — prefer `/acli` skill (fewer tokens, faster)
  What this skill does NOT do:
  - Implement features → use `/sprint-development`
  - Write unit tests → use `/unit-testing`
  - Refine acceptance criteria → use `/product-management`
  - Define a brand-new product → use `/project-foundation`
  - Scaffold backend / frontend code → use `/project-bootstrap`
  - Generate the in-app `/qa` page + credentials artifact → use `/testability-guide`
metadata:
  kind: workflow
---

<!-- Model preferences (advisory; dispatchers may use to route) -->
<!--
model_preferences:
  foundation: opus       # high-leverage architectural work
  planning: sonnet       # structured writing
  implementation: sonnet # default for code work
  review: opus           # critical analysis
  archive: haiku         # mechanical close-out
-->

# Agentic Dev Onboard — First-time tour of this repo

Activate when a user lands on this repo for the first time and asks "where do I start?", "how does this work?", or invokes `/agentic-dev-onboard`. The skill is a guided tour, not an executor: it explains the stack, the workflow, the MCPs, and the env vars that everything depends on, points at the visual docs hub, then hands off to the right downstream skill.

`/agentic-dev-onboard` is specific to **this** Next.js + Supabase boilerplate and points at the concrete entry points (`/sprint-development`, `/product-management`, etc.).

---

## Welcome

This is **agentic-dev-boilerplate** — a dev-only boilerplate for building Next.js + Supabase apps with AI agents in the loop. The repo ships skills, scripts, and conventions that turn a Jira ticket into merged code via `/sprint-development`. It does **not** ship a backend or a frontend; both are scaffolded on top of the boilerplate by `/project-bootstrap`.

If you cloned this repo and you don't yet have `bun run setup` complete, start there. Everything else assumes the foundation is green.

**Docs hub (read it in a browser):** `https://upex-galaxy.github.io/agentic-dev-boilerplate/`. It holds the start-here page (`onboarding.html`, also opened locally by `bun run onboarding`), the multi-harness page, and one deck per workflow skill (table below). Hand the user this URL in every tour.

---

## Composable Skills (auto-resolved at skill entry)

This skill is mostly a static walkthrough — it rarely dispatches sub-agents, so composition is minimal. Run once at entry per `agentic-dev-core/references/skill-composition-strategy.md`.

Steps:

1. Read `complementary_categories` from this skill's frontmatter.
2. Resolve via local skill-registry script (`scripts/build-skill-registry.ts` → cached at `.agents/skills/REGISTRY.md`). Fallback: scan the session-start `system-reminder` skill list.
3. Apply threshold rule per strategy doc §3.2 (T1/T3 silent; T4 ASK).
4. Inject a `## Composable Skills` block per strategy doc §6.2 only when (rarely) dispatching a sub-agent.

Skip step if the catalog is unavailable; log `skill_resolution: "fallback-inline"` plus `missing: [<categories>]` per §3.4.

---

## Stack

| Layer       | Choice                                |
| ----------- | ------------------------------------- |
| Framework   | Next.js (locked, App Router)          |
| Database    | Supabase (Postgres + Auth + Storage)  |
| Language    | TypeScript (strict mode)              |
| Runtime     | bun                                   |
| Lint/format | ESLint + Prettier (pre-commit hooks)  |
| Tests       | Vitest (unit) + Playwright (E2E) — scaffolded app stack; this repo's own suite runs on Bun's test runner |
| AI agent    | Claude Code, OpenCode, Codex (CLI + Desktop): one `AGENTS.md`, one skill store (AGENTS.md §5.5) |

The stack is intentionally locked. If your project needs a different stack, this boilerplate is not the right starting point.

---

## First-time setup

Run the interactive installer once after cloning:

```bash
bun run setup
```

This bootstraps `.agents/`, installs Engram (persistent memory) via gentle-ai `--preset minimal`, wires the `.env` keys for every MCP server `.mcp.json` declares, and prints how to connect web search at harness level. Full details in [`INSTALLER.md`](../../../INSTALLER.md).

After setup, fill `.env` with the credentials the rest of the workflow expects (see "Critical env vars" below).

**Launch the agent through the wrappers** `bun run claude`, `bun run opencode` or `bun run codex` (names in `package.json`): each loads `.env` so the MCP servers get their credentials. A launch with no command line (desktop app, a supervised worker) gets them from `bun run harness:env`, re-run after every `.env` change. A second working tree (`git worktree add`) needs `bun run worktree:provision` before its first session (`/git-flow-master`, `references/worktrees.md`).

> **Critical Rule #10** (AGENTS.md §1): for build/test/lint commands, **READ `package.json` DIRECTLY** — never trust a hardcoded list in a doc. Scripts drift; `package.json` is canonical.

---

## Primary workflow: `/sprint-development`

`/sprint-development` is the mega-orchestrator for ticket-driven work. Call it with a Jira issue key (`/sprint-development UPEX-123`) and it drives the per-story dev loop end-to-end.

**Jira state machine:**

```
Ready For Dev → In Progress → In Review → Ready For QA
```

**Five stages inside the loop:**

| Stage | Name              | What happens                                                                                        |
| ----- | ----------------- | --------------------------------------------------------------------------------------------------- |
| 1     | Planning          | Read the ticket, load module context, produce an implementation plan, transition to **In Progress** |
| 2     | Implementation    | Write code per plan, run unit tests + lint + types, commit on the feature branch                    |
| 3     | Code Review       | Open the PR, run review                                                                              |
| 4     | Staging Deploy    | Deploy to the integration target (`git_strategy.branches.integration` in `.agents/project.yaml`, or a Preview under `solo-main`), verify by commit SHA, smoke-check, transition to **Ready For QA** |
| 5     | Production Deploy | (Gated, optional) Promote to production (`git_strategy.branches.production`), deploy with rollback plan |

The skill handles Jira transitions, branch creation, commits, PR open, deploy. You confirm at the gates.

---

## Screen design flow (optional — for UI-heavy projects)

UI stories can be built against **agreed screen mockups**, not improvised UI. The loop (AGENTS.md
Critical Rule 14 — UI Fidelity Contract):

```
/design-system (screen-mapping, opt-in)
  → generates a portable DESIGN BRIEF (frozen tokens + your stories' functional intent)
  → YOU paste it into Claude Design (claude.ai/design) or Open Design (open-design.ai),
    iterate, export the bundle into .context/designs/<project>/<batch>/
  → the skill maps the mockups into .context/design/master-design-plan.md
    (per-screen specs + US→Screen map)
  → /sprint-development builds every UI story with the mockup as inspiration;
    the fidelity reference is the live UI + DESIGN.md tokens, and an
    unratified divergence from THEM = review defect
```

The AI never hand-authors mockups on its own: it commissions them through a design tool (Open Design
MCP or equivalent), generates the HTML itself only through a loaded design skill (`frontend-design`,
`ui-ux-pro-max`, `impeccable`: the `frontend-ui` category), or hands you the brief to design in the external tool (which keeps project memory
across batches, so later briefs are light "follow-up" deltas). Either way you ratify every mockup. Entirely
optional: without a master design plan, UI fidelity degrades gracefully to `DESIGN.md` tokens only.

---

## MCPs available

Skills ask for a CAPABILITY and resolve it by tool-name suffix, whatever the server prefix (`agentic-dev-core/references/mcp-capabilities.md`). The committed servers are whatever `.mcp.json` declares; web search runs at harness level, connected once per machine:

| Capability         | Provided by                                              | Use it for                                |
| ------------------ | -------------------------------------------------------- | ----------------------------------------- |
| `library-docs`     | Context7 (committed)                                     | Official library docs (Next.js, Supabase…) |
| `web-search`       | Exa or Tavily at harness level (`bun run setup:doctor`)  | Web search, troubleshooting community Q&A |
| `db`               | Supabase (committed)                                     | DB queries, migrations, type generation   |
| `automation-flows` | n8n (committed)                                          | Workflow automation, scheduled jobs       |

The Atlassian MCP is opt-in (`docs/mcp/`): Jira and Confluence go through `/acli`.

**Decision rule:**

- Use `library-docs` for "how to use X" — official docs, current API
- Use `web-search` for "how to solve X" — community fixes, troubleshooting
- Use **Atlassian** only as fallback — prefer `/acli` skill (fewer tokens, faster)

`.mcp.json` lives at the repo root and is **committed** (uses `${VAR}` references to `.env` — no secrets stored in the file).

---

## Critical env vars

Place these in `.env` before running anything that talks to a real environment:

| Var                                            | Used by                                |
| ---------------------------------------------- | -------------------------------------- |
| `QA_E2E_USER_EMAIL` / `QA_E2E_USER_PASSWORD`   | **Automation identity** — the account live-UI validation and authenticated probes log in as. Declare the names in `.agents/project.yaml` → `testing.automation_identity`. Must be a DEDICATED non-production account; a missing slot STOPS the sprint instead of improvising a login. See `sprint-development/references/live-ui-identity.md` |
| `LOCAL_USER_EMAIL` / `LOCAL_USER_PASSWORD`     | Local dev login (manual / ad-hoc)      |
| `STAGING_USER_EMAIL` / `STAGING_USER_PASSWORD` | Staging smoke tests, manual login      |
| `ATLASSIAN_EMAIL` / `ATLASSIAN_API_TOKEN` | `acli` Jira CLI, MCP atlassian, scripts/sync-jira-* (the site HOST is not here — it lives in `.agents/project.yaml` -> `issue_tracker.atlassian_url`; read it with `bun run --silent jira:url`) |
| `NEXT_PUBLIC_SUPABASE_URL` / `SUPABASE_PUBLISHABLE_KEY` / `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` / `SUPABASE_SECRET_KEY` | App runtime + Supabase MCP (the full set is `.env.example`) |
| `SUPABASE_ACCESS_TOKEN`                        | Supabase MCP (personal access token)   |
| `N8N_API_URL` / `N8N_API_KEY`                  | n8n MCP (`automation-flows`)           |

`.mcp.json` is **committed** — it references env vars via `${VAR}` placeholders (Claude Code); OpenCode reads `{file:.auth/opencode/VAR}` files that `bun run harness:env` writes from `.env`, and Codex starts its servers through a `.env` loader. The actual secret values live in `.env` (gitignored). Never inline a real token in `.mcp.json`.

Verify your config by running the linter declared in `package.json` (typically `bun run vars:check`). Always check `package.json` for the canonical script name — Critical Rule #10.

---

## Skills and their decks

The skill catalog is `.agents/skills/REGISTRY.md` (generated by `bun run skills:registry`) and the table in AGENTS.md §5: read the list there, never from a copy. Repo skills live in `.agents/skills/`; community skills (`playwright-cli`, `frontend-design`, `shadcn`, …) are installed into the SAME project store by `bun run setup`, and only user-level skills stay harness-specific (AGENTS.md §5 layout note).

Invocation: on Claude Code `/<skill> <mode>`; on OpenCode and Codex name the skill and the mode in prose ("load `project-context`, mode `data`").

Every workflow skill has a deck on the docs hub, at `https://upex-galaxy.github.io/agentic-dev-boilerplate/decks/<skill>/como-funciona.es.html`, unless the row below says otherwise. Point the user to the deck of the skill you hand them off to:

| Deck path (under the hub URL)                      | Teaches |
| -------------------------------------------------- | ------- |
| `decks/<skill>/como-funciona.es.html`              | the workflow skill `<skill>`: every `kind: workflow` skill in `REGISTRY.md`, except `design-system` (next row) and this skill |
| `decks/design-system/flujo-mockups.es.html`        | `design-system`: token phase and screen phase |
| `decks/context-skills/como-funciona.es.html`       | the business context skills (`business-data-context`, `business-feature-context`, `business-api-context`) and `bun run context:map` |
| `decks/tooling/como-funciona.es.html`              | the utility skills (`acli`, `vercel-cli`), CLI → skill auto-load, launch + `harness:env` |
| `decks/agentic-dev-core/capa-comportamental.es.html` | how the agent writes back (AGENTS.md §2) |
| `decks/agentic-dev-core/pbi-jira-cache.es.html`    | `.context/PBI/` as a Jira cache (AGENTS.md §9) |
| `harnesses.es.html`                                | the three hosts (AGENTS.md §5.5) |

This skill has no deck of its own: the hub and its start-here page are its surface.

Browser automation is provided by `/playwright-cli` (community skill from `microsoft/playwright-cli`, installed by setup; AGENTS.md §6 resolves `[AUTOMATION_TOOL]` to it).

Long sessions: when the context window runs high or work must outlive the session, `/session-handoff` writes the handoff and launches the successor in the same worktree and harness.

---

## Persistent memory via gentle-ai

`bun run setup` installs Engram via `gentle-ai install --preset minimal` — persistent memory that survives across sessions and compactions. No other gentle-ai skills are installed (AGENTS.md §12 covers the proactive-save protocol). Full details in [`INSTALLER.md`](../../../INSTALLER.md).

---

## Where to learn more (AGENTS.md pointers)

The AI persistent-memory file at the repo root carries the full operational contract. Before your first ticket, skim these sections:

- **§1 CRITICAL RULES** — the rules that override defaults (credentials, plan-before-coding, no AI attribution + forensic trailers, MCP credential failure protocol, `READ package.json DIRECTLY`, UI fidelity contract, verify at the destination, committed prose names the source of truth).
- **§4 CONTEXT LOADING MAP** — task → trigger phrase → skill → context files → primary tool.
- **§5 SKILLS + MODES + MCPs REGISTRY** — full T1/T3/T4 skill model, skill modes, MCP capabilities.
- **§5.5 MULTI-HARNESS** — one source, three hosts: what is generated, the hook, MCP parity, launch gotchas.
- **§12 PROACTIVE MEMORY TRIGGERS** — when to call `mem_save` without being asked.

---

## Next steps after the onboard

Run through this checklist before you reach for your first ticket:

- [ ] Did you run the setup script (`bun run setup` — verify name in `package.json`)?
- [ ] Did you fill `.env` with your own credentials (`LOCAL_*`, `STAGING_*`, `ATLASSIAN_*`, `SUPABASE_*`, `N8N_*`)? Did you connect a web-search provider at harness level (`bun run setup:doctor`)?
- [ ] Did you launch the agent through `bun run claude|opencode|codex` (or run `bun run harness:env` for a launch with no command line)?
- [ ] Does the agents linter (`bun run vars:check` per `package.json`) exit clean (0 errors)?
- [ ] Does Engram appear in the active MCP list (restart your agent if not)?
- [ ] Did you open the docs hub (`https://upex-galaxy.github.io/agentic-dev-boilerplate/`) and the deck of the skill you are about to use?
- [ ] Ready for your first ticket: `/sprint-development <UPEX-XXX>`

If any box is unchecked, fix that first. The downstream skills assume a green foundation.

---

## What this skill does NOT do

- Implement features → use `/sprint-development`
- Write unit tests → use `/unit-testing`
- Refine acceptance criteria → use `/product-management`
- Define a brand-new product → use `/project-foundation`
- Scaffold backend / frontend code → use `/project-bootstrap`
- Generate the in-app `/qa` page + credentials artifact → use `/testability-guide`

The onboard tour ends once the user knows which skill to call next. From there, the relevant workflow skill takes over.
