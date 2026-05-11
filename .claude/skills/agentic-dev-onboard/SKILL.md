---
name: agentic-dev-onboard
description: "Walks new users through this repo's dev flow — Next.js + Supabase stack, Jira workflow (Ready For Dev → In Progress → In Review → Ready For QA), /sprint-development for ticket-driven work, /sdd-* for spec-driven work, MCPs available (Tavily, Context7, Supabase, n8n), critical env vars. Triggers on: `onboard me`, `explain this repo`, `first time using this`, `primer vez en este repo`, `/agentic-dev-onboard`. Do NOT use for: feature implementation (use /sprint-development), test design (use /unit-testing), backlog refinement (use /product-management)."
license: MIT
compatibility: [claude-code, opencode]
phase: bootstrap
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

Activate when a user lands on this repo for the first time and asks "where do I start?", "how does this work?", or invokes `/agentic-dev-onboard`. The skill is a guided tour, not an executor: it explains the stack, the workflow, the MCPs, and the env vars that everything depends on, then hands off to the right downstream skill.

This skill complements `/sdd-onboard` (installed via gentle-ai). `/sdd-onboard` walks users through the SDD spec-driven loop in the abstract; `/agentic-dev-onboard` is specific to **this** Next.js + Supabase boilerplate and points at the concrete entry points (`/sprint-development`, `/product-management`, etc.).

---

## Welcome

This is the **AI-Driven Project Starter** — a dev-only boilerplate for building Next.js + Supabase apps with AI agents in the loop. The repo ships skills, scripts, and conventions that turn a Jira ticket into merged code through a structured 12-step workflow. It does **not** ship a backend or a frontend; both are scaffolded on top of the boilerplate by `/project-bootstrap`.

If you cloned this repo and you don't yet have `bun run setup` complete, start there. Everything else assumes the foundation is green.

---

## Stack

| Layer       | Choice                                |
| ----------- | ------------------------------------- |
| Framework   | Next.js (locked, App Router)          |
| Database    | Supabase (Postgres + Auth + Storage)  |
| Language    | TypeScript (strict mode)              |
| Runtime     | bun                                   |
| Lint/format | ESLint + Prettier (pre-commit hooks)  |
| Tests       | Vitest (unit) + Playwright (E2E)      |
| AI agent    | Claude Code (primary), OpenCode (alt) |

The stack is intentionally locked. If your project needs a different stack, this boilerplate is not the right starting point.

---

## First-time setup

Run the interactive installer once after cloning:

```bash
bun run setup
```

This bootstraps `.agents/`, installs gentle-ai skills (15 of them), configures the 4 canonical MCPs, and writes `.mcp.json`. Full details in [`INSTALLER.md`](../../../INSTALLER.md).

After setup, fill `.env` with the credentials the rest of the workflow expects (see "Critical env vars" below).

---

## Primary workflow: `/sprint-development`

`/sprint-development` is the mega-orchestrator for ticket-driven work. Call it with a Jira issue key (`/sprint-development UPEX-123`) and it drives the full 12-step loop end-to-end.

**Jira state machine:**

```
Ready For Dev → In Progress → In Review → Ready For QA
```

**Five stages inside the loop:**

| Stage | Name              | What happens                                                                                        |
| ----- | ----------------- | --------------------------------------------------------------------------------------------------- |
| 1     | Planning          | Read the ticket, load module context, produce an implementation plan, transition to **In Progress** |
| 2     | Implementation    | Write code per plan, run unit tests + lint + types, commit on the feature branch                    |
| 3     | Code Review       | Open the PR, run review (single-perspective, or escalate to `/judgment-day` for sensitive paths)    |
| 4     | Staging Deploy    | Merge to `staging`, deploy, smoke-check, transition to **Ready For QA**                             |
| 5     | Production Deploy | (Gated, optional) Merge to `main`, deploy with rollback plan                                        |

The skill handles Jira transitions, branch creation, commits, PR open, deploy. You confirm at the gates.

---

## When to use `/sdd-*` instead

Hand-off matrix copied from [`INSTALLER.md`](../../../INSTALLER.md):

| When                                                              | Skill                                                         |
| ----------------------------------------------------------------- | ------------------------------------------------------------- |
| Routine Jira ticket work (most cases)                             | `/sprint-development` (ticket-driven)                                 |
| Large refactor, architectural decision, or feature without ticket | `/sdd-*` (spec-driven, explore → propose → spec → design → …) |
| Story with detailed specs you want traced formally                | Both: `/sdd-spec` first, then `/sprint-development` for the cycle     |

If the change feels like a research project (alternatives to compare, multiple modules touched, no ticket yet), reach for `/sdd-explore` first. Otherwise, stick with `/sprint-development`.

---

## MCPs available

Four canonical MCPs ship with the boilerplate:

| MCP      | Use it for                                 |
| -------- | ------------------------------------------ |
| Tavily   | Web search, troubleshooting community Q&A  |
| Context7 | Official library docs (Next.js, Supabase…) |
| Supabase | DB queries, migrations, type generation    |
| n8n      | Workflow automation, scheduled jobs        |

**Decision rule:**

- Use **Context7** for "how to use X" — official docs, current API
- Use **Tavily** for "how to solve X" — community fixes, troubleshooting

`.mcp.json` lives at the repo root and is **gitignored** (it contains secrets).

---

## Critical env vars

Place these in `.env` before running anything that talks to a real environment:

| Var                                            | Used by                                |
| ---------------------------------------------- | -------------------------------------- |
| `LOCAL_USER_EMAIL` / `LOCAL_USER_PASSWORD`     | Local dev login (Playwright, Supabase) |
| `STAGING_USER_EMAIL` / `STAGING_USER_PASSWORD` | Staging smoke tests, manual login      |
| `ATLASSIAN_SITE` / `ATLASSIAN_EMAIL` / token   | `acli` Jira CLI                        |
| `TAVILY_API_KEY`                               | Tavily MCP                             |
| `SUPABASE_URL` / `SUPABASE_*_KEY`              | Supabase MCP + runtime                 |

`.mcp.json` is **gitignored** — it holds the wired-up MCP configuration with secrets resolved. Never commit it.

Verify your config with `bun run lint:agents` (should report 0 errors when fully configured).

---

## Local skills (committed in this repo)

| Skill                 | Trigger                | Purpose                                                             |
| --------------------- | ---------------------- | ------------------------------------------------------------------- |
| `agentic-dev-core`        | `/agentic-dev-core`        | One-time bootstrap of `.agents/`, scripts, CLAUDE.md                |
| `project-foundation`  | `/project-foundation`  | Constitution + PRD + SRS + Discovery                                |
| `project-bootstrap`   | `/project-bootstrap`   | Backend + frontend skeleton + features                              |
| `product-management`  | `/product-management`  | Backlog seeding, epic creation, INVEST/AC refinement                |
| `sprint-development`          | `/sprint-development`          | Per-story dev loop (12-step orchestrator)                           |
| `unit-testing`        | `/unit-testing`        | TDD red-green-refactor (composable mid-flight from `/sprint-development`)   |
| `git-flow-master`     | (auto)                 | Branch / commit / push / PR — adapts to detected branching strategy |
| `acli`                | (auto)                 | Atlassian CLI wrapper for Jira/Confluence terminal work             |
| `agentic-dev-onboard` | `/agentic-dev-onboard` | This skill — first-time orientation                                 |

Reusable knowledge skills (symlinks): `frontend-design`, `next-best-practices`, `next-cache-components`, `next-upgrade`, `playwright-cli`, `resend-cli`.

---

## Skills installed via gentle-ai (user-level)

Run `bun run setup` once to install these at user level. They are not committed in this repo.

| Skill                  | Trigger                 | Purpose                                       |
| ---------------------- | ----------------------- | --------------------------------------------- |
| `sdd-init`             | `/sdd-init`             | Initialize SDD context for a project          |
| `sdd-explore`          | `/sdd-explore`          | Investigate an idea / compare approaches      |
| `sdd-propose`          | `/sdd-propose`          | Write a change proposal                       |
| `sdd-spec`             | `/sdd-spec`             | Write requirements + scenarios as delta specs |
| `sdd-design`           | `/sdd-design`           | Architecture + technical design doc           |
| `sdd-tasks`            | `/sdd-tasks`            | Break design into a task checklist            |
| `sdd-apply`            | `/sdd-apply`            | Implement tasks per spec/design               |
| `sdd-verify`           | `/sdd-verify`           | Validate implementation against specs         |
| `sdd-archive`          | `/sdd-archive`          | Sync delta specs into main, close the change  |
| `sdd-onboard`          | `/sdd-onboard`          | Guided SDD walkthrough on real codebase       |
| `skill-registry`       | (auto)                  | Build the project-standards compact registry  |
| `judgment-day`         | `/judgment-day`         | Adversarial parallel review (2 blind judges)  |
| `cognitive-doc-design` | `/cognitive-doc-design` | Reduce cognitive load in technical docs       |
| `comment-writer`       | `/comment-writer`       | Draft warm, direct PR/issue comments          |
| `issue-creation`       | `/issue-creation`       | Issue filing workflow (bug + feature)         |

Plus `engram` (persistent memory across sessions). Full details in [`INSTALLER.md`](../../../INSTALLER.md).

---

## Next steps after the onboard

Run through this checklist before you reach for your first ticket:

- [ ] Did you run `bun run setup`?
- [ ] Did you fill `.env` with your own credentials (`LOCAL_*`, `STAGING_*`, `ATLASSIAN_*`, `TAVILY_API_KEY`, `SUPABASE_*`)?
- [ ] Does `bun run lint:agents` exit clean (0 errors)?
- [ ] Do the gentle-ai skills appear in autocomplete (restart your agent if not)?
- [ ] Ready for your first ticket: `/sprint-development <UPEX-XXX>`

If any box is unchecked, fix that first. The downstream skills assume a green foundation.

---

## What this skill does NOT do

- Implement features → use `/sprint-development`
- Write unit tests → use `/unit-testing`
- Refine acceptance criteria → use `/product-management`
- Define a brand-new product → use `/project-foundation`
- Scaffold backend / frontend code → use `/project-bootstrap`

The onboard tour ends at the moment the user knows which skill to call next. From there, the relevant workflow skill takes over.
