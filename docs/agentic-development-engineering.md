# Agentic Development Engineering

> **Purpose**: The single source of truth for what this repository is and how it works — the strategy, the architecture, the skills, the orchestration model, and the engineering discipline that back every line of code an AI agent commits.
> **Audience**: Engineers, tech leads, product owners, and technical leaders evaluating or adopting this boilerplate. Read this before you read anything else.
> **Scope**: Spec-Driven Development, Context Engineering, Claude Code skills and commands, MCP integrations, agent orchestration with human-in-the-loop, the per-story development loop, the design-system contract, and the merge-to-staging quality gate.
> **Why "agentic"?** This practice is not "AI as a copilot autocompleting lines." It relies on auto-triggering skills, subagents dispatched for focused tasks, live tool use through MCPs and CLIs, persistent memory across sessions, and checkpointed human supervision. Those are the defining traits of *agentic* systems — hence the name.

---

## Table of Contents

1. [Overview](#1-overview)
2. [Why This Boilerplate Exists](#2-why-this-boilerplate-exists)
3. [Strategy: Spec-Driven, Skills-First, Agentic](#3-strategy-spec-driven-skills-first-agentic)
4. [Glossary: Terms Used Throughout This Document](#4-glossary-terms-used-throughout-this-document)
5. [System Architecture](#5-system-architecture)
6. [Context Engineering: The Knowledge Layer](#6-context-engineering-the-knowledge-layer)
7. [Sources of Truth: Where Context Comes From](#7-sources-of-truth-where-context-comes-from)
8. [Working with Claude Code: Daily Workflow](#8-working-with-claude-code-daily-workflow)
9. [The Orchestration Model: AI Works, Human Decides](#9-the-orchestration-model-ai-works-human-decides)
10. [The Foundation → Management → Implementation Pipeline](#10-the-foundation--management--implementation-pipeline)
11. [The Per-Story Dev Loop: Sprint-Dev in Depth](#11-the-per-story-dev-loop-sprint-dev-in-depth)
12. [The AI Toolkit: Skills, Commands, Integrations](#12-the-ai-toolkit-skills-commands-integrations)
13. [Quality Gates: Lint, Types, Tests, Review, Deploy](#13-quality-gates-lint-types-tests-review-deploy)
14. [Anatomy of a Story Session](#14-anatomy-of-a-story-session)
15. [Persistent Memory and Cross-Session Continuity](#15-persistent-memory-and-cross-session-continuity)
16. [Extending the Framework](#16-extending-the-framework)
17. [Summary of What the Practice Delivers](#17-summary-of-what-the-practice-delivers)

---

## 1. Overview

This repository is not a traditional project starter. It is an **agentic development engineering practice** built on top of Next.js, Supabase, TypeScript, and Bun, orchestrated through Claude Code skills and commands, and backed by a structured knowledge layer that lets AI agents understand the product, the architecture, and the backlog without the developer having to re-explain it every session.

The skills are written in the open SKILL format and are compatible with Claude Code, Copilot, Cursor, Codex, and OpenCode runtimes — Claude Code is the reference implementation used throughout this document.

The practice is organised around a **three-tier lifecycle** that takes a product idea from blank repository all the way to merged code in staging:

```
ONE-TIME FOUNDATION    →    CONTINUOUS MANAGEMENT    →    PER-STORY IMPLEMENTATION
  (Define the product)        (Shape the backlog)            (Ship the code)
```

| Tier | Owning skill(s) | Output |
| ---- | --------------- | ------ |
| **Bootstrap** (one-time) | `agentic-dev-core` | `CLAUDE.md`, `.agents/project.yaml`, `scripts/agents-*.ts`, `.context/_framework/testing-capabilities.json` |
| **Foundation** (one-time per product) | `project-foundation` → `design-system` → `project-bootstrap` | `.context/idea/`, `.context/PRD/`, `.context/SRS/`, `.context/business/`, `DESIGN.md`, scaffolded backend + frontend |
| **Management** (continuous) | `product-management` | Jira backlog (epics + stories), refined ACs in Gherkin, edge-case enumeration, sprint snapshots |
| **Implementation** (per story) | `sprint-dev` (+ optional `unit-testing`, `git-flow-master`) | `implementation-plan.md`, code on a feature branch, PR, code review, merged to staging |
| **Spec-Driven Development** (any substantial change) | `sdd-*` skill bloque | Exploration → Proposal → Spec → Design → Tasks → Apply → Verify → Archive |

Every phase is powered by an AI skill, every skill operates with at least one human-in-the-loop checkpoint, and every artefact produced is traceable from the original Jira ticket back to the source PRD requirement that motivated it.

This document walks through the full system — the problem it solves, the strategy behind it, the architecture that supports it, and the engineering rigor applied to each layer.

> **QA workflows** (sprint testing, exploratory testing, test automation, regression) live in the sister repo [`agentic-qa-boilerplate`](https://github.com/upex-galaxy/agentic-qa-boilerplate). The two repos are designed as a complementary pair: dev side ships features, QA side validates them.

---

## 2. Why This Boilerplate Exists

Most early-stage product teams start in the same place:

- **Zero structured product definition.** A few Notion docs, a slack thread, maybe a Figma. Nothing the AI can read deterministically.
- **No skill library.** Every prompt is bespoke. Every developer has their own "system prompt." No way to share or version conventions.
- **No persistent memory.** The AI forgets everything between sessions. The same architectural decision is re-explained ten times a week.
- **No orchestration model.** A single chat handles planning, coding, reviewing, deploying — all in one bloated context window. Token cost spikes, hallucinations compound.
- **No backlog discipline.** Stories live in Jira with three-line descriptions and "see the design doc" as acceptance criteria. The AI cannot work from that.

That works until it doesn't. The moment the product handles **real money**, **regulated data**, **multi-tenant isolation**, or just **more than three concurrent developers**, the cost of an undocumented decision explodes. A misread acceptance criterion becomes a production rollback, a security finding, or a customer-data leak.

The goal of this boilerplate is therefore not to "add some AI to a project," but to install — end-to-end — the **infrastructure, knowledge layer, and workflows** that make agentic development engineering possible at all. A team that adopts this repository gets, on day one:

- A three-tier pipeline (foundation → management → implementation) owned by AI skills, with human checkpoints between stages.
- A structured context layer (`.context/`) the AI reads before it acts.
- A Spec-Driven Development (SDD) workflow for any substantial change, with explicit phases (explore → propose → spec → design → tasks → apply → verify → archive).
- A backlog seeded from the PRD with INVEST-validated stories and Gherkin acceptance criteria.
- A per-story dev loop that drives Jira state transitions, plans before it codes, reviews before it merges, and never deploys to production without a human gate.
- Persistent memory (`engram`) that survives sessions and compactions, plus on-disk PBI folders for everything `engram` cannot host.

The rest of this document describes how that boilerplate is built and how it operates in practice.

---

## 3. Strategy: Spec-Driven, Skills-First, Agentic

The practice rests on three load-bearing strategic choices.

### 3.1 Spec-Driven Development (SDD) before code

Code is the last artefact produced, not the first. Before any line of TypeScript is written, the AI walks the project through:

```
Constitution  →  PRD  →  SRS  →  Discovery  →  DESIGN.md  →  Epic  →  Story (with AC)  →  Implementation Plan  →  Code
```

Each artefact is the input contract for the next. The Implementation Plan is the input to Stage 2 of `/sprint-dev`. The story's Acceptance Criteria are the input to the Implementation Plan. The PRD is the input to the backlog seed. None of these steps is optional in a regulated or revenue-bearing context.

```
   Cost / Effort to Fix a Misread Requirement
          ▲
          │                                                    ╱
          │                                                 ╱       ← Without specs
          │                                             ╱             (exponential rise)
          │                                         ╱
          │                                     ╱
          │                        inflection
          │                            ●
          │                  ╱──────────────────
          │                ╱                        ← With Spec-Driven Development
          │              ╱                            (small early effort, then flat)
          │            ╱
          ●──────────────────────────────────────────────────▶  SDLC phase
        Constitution    PRD    SRS    Story    Plan   Code   Deploy
         [Strategy]   [Prod]  [Eng]   [AC]   [How]  [Build]  [Ship]
```

The red curve is the trajectory of a team that codes from a Jira description: every misread requirement compounds. The green curve is the trajectory of a team that defines its specs upfront: small repeated investment, then a flat tail.

### 3.2 Skills-first over prompts

Workflows live in `.claude/skills/<name>/SKILL.md`, not in copy-paste prompt files. A skill is:

- **Versioned** — committed to the repo, evolves with the project, reviewed in PRs.
- **Self-documenting** — a `SKILL.md` describes when it triggers, what it does, what references it loads, what it produces.
- **Composable** — `/unit-testing` runs standalone or mid-flight from `/sprint-dev`. `/design-system` runs standalone or from `/project-foundation` Phase 2.5.
- **Auto-triggered** — Claude Code matches user intent against the skill description and loads the right skill automatically. No `/<name>` typing required for common phrasings.

Compare to the alternative: a `prompts/` directory full of `.md` files that developers copy into their chat window. There is no versioning of *behavior*, no autocomplete, no composition, no way to enforce that a "test plan" prompt is always run before a "test run" prompt.

### 3.3 Agentic: orchestrator + subagents, not a single chat

A traditional AI workflow looks like this: one chat window, one developer, one giant context, one model reasoning over everything from the PRD to the JSX. The context window inflates, the cost spikes, and hallucinations compound because the AI is doing planning, reading, writing, reviewing, and deploying all in the same thread.

The agentic model is different:

```
                ┌─────────────────────────┐
                │      ORCHESTRATOR       │
                │   "Command Center"      │
                │   Lean, decision-only   │
                └────────────┬────────────┘
                             │
        ┌────────────────────┼────────────────────┐
        ▼                    ▼                    ▼
  ┌──────────┐         ┌──────────┐         ┌──────────┐
  │ Subagent │ ──●→    │ Subagent │ ──●→    │ Subagent │  ──●→ Done
  │   READ   │  👤     │  WRITE   │  👤     │  VERIFY  │   👤
  └──────────┘         └──────────┘         └──────────┘

  ● = Human checkpoint
```

The orchestrator decides. Subagents execute. Each subagent gets a fresh, minimal context and returns a structured report. The orchestrator never reads 50 files inline; it dispatches a subagent that reads them, summarises them, and reports back.

This is the foundational decision behind every architectural choice in this repo. Sections 5, 9, and 11 explore it in depth.

---

## 4. Glossary: Terms Used Throughout This Document

| Term                   | Definition                                                                                                                                                       |
| ---------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Token**              | The unit an AI model reads and writes. Tokens have direct cost and occupy context window space.                                                                  |
| **Context Window**     | The memory available within a single conversation. Everything the AI can "see" right now.                                                                        |
| **MCP**                | Model Context Protocol. A standard that lets AI tools talk to live systems — database, browser, web search, official library docs.                               |
| **Skill**              | A reusable AI capability, stored under `.claude/skills/<name>/`. Auto-triggers when the user's intent matches its description.                                  |
| **Command**            | A one-shot utility stored under `.claude/commands/<name>.md`. Invoked explicitly with `/<name>`. No auto-triggering.                                              |
| **Subagent**           | A specialist worker dispatched by the orchestrator for a focused task (reading, writing, verifying, deploying).                                                  |
| **Orchestrator**       | The main conversation thread that coordinates work. Decides; delegates; synthesises. Does not read or write code inline when delegation makes sense.             |
| **Engram**             | Persistent memory layer (MCP server) that survives across sessions and compactions. Stores decisions, conventions, bug fixes, discoveries.                       |
| **PRD**                | Product Requirements Document. Output of `/project-foundation` Phase 2. Defines *what* we are building.                                                          |
| **SRS**                | Software Requirements Specification. Output of `/project-foundation` Phase 3. Defines *how* the system is structured.                                            |
| **AC**                 | Acceptance Criterion. The Gherkin-formatted condition a story must satisfy to be considered done. Refined by `/product-management`.                              |
| **PBI**                | Product Backlog Item. In this repo, the local folder (`.context/PBI/...`) that stores per-epic and per-story knowledge.                                          |
| **SDD**                | Spec-Driven Development. Meta-skill bloque (`sdd-explore`, `sdd-propose`, `sdd-spec`, `sdd-design`, `sdd-tasks`, `sdd-apply`, `sdd-verify`, `sdd-archive`).      |
| **INVEST**             | Independent, Negotiable, Valuable, Estimable, Small, Testable. Validation criteria for user stories. Enforced by `/product-management`.                          |
| **Implementation Plan**| The artefact produced by `/sprint-dev` Stage 1. The input contract for Stage 2 (coding).                                                                          |
| **Compact Rules**      | Pre-digested coding standards injected into subagent prompts so they do not have to load and parse a full skill registry on every dispatch.                      |
| **Briefing Template**  | The 6-component format (Goal · Context docs · Skills to load · Exact instructions · Report format · Rules) every subagent dispatch follows.                       |
| **Dispatch Pattern**   | One of Single / Sequential / Parallel / Background. Picked per stage in each skill's `## Subagent Dispatch Strategy` section.                                     |
| **Active Environment** | The environment URLs and credentials currently in use (local / staging / production). Resolved from `testing.default_env` in `.agents/project.yaml` or session override. |
| **Topic Key**          | The stable identifier under which an artefact is saved in engram (e.g. `pbi/{ticket}/impl-plan`). Documented in `agentic-dev-core/references/topic-key-conventions.md`. |

---

## 5. System Architecture

The practice is organised in three conceptual tiers:

```
┌─────────────────────────────────────────────────────────────────────┐
│                       DEVELOPER (Human)                             │
│         Makes decisions · Reviews AI output · Approves merges       │
└────────────────────────────────┬────────────────────────────────────┘
                                 │
┌────────────────────────────────┴────────────────────────────────────┐
│                          AI SKILLS LAYER                            │
│                                                                     │
│  Foundation skill                                                   │
│  ┌──────────────────┐                                               │
│  │ agentic-dev-core │  Briefing template · Dispatch patterns ·      │
│  └──────────────────┘  Orchestration doctrine · Bootstrap CLI       │
│                                                                     │
│  Foundation workflow skills (one-time)                              │
│  ┌──────────────┐ ┌──────────────┐ ┌──────────────┐                 │
│  │   project-   │ │   design-    │ │   project-   │                 │
│  │  foundation  │ │    system    │ │  bootstrap   │                 │
│  └──────────────┘ └──────────────┘ └──────────────┘                 │
│                                                                     │
│  Management + implementation workflow skills (continuous)           │
│  ┌──────────────┐ ┌──────────────┐ ┌──────────────┐ ┌──────────────┐│
│  │   product-   │ │   sprint-    │ │    unit-     │ │ git-flow-    ││
│  │  management  │ │     dev      │ │   testing    │ │    master    ││
│  └──────────────┘ └──────────────┘ └──────────────┘ └──────────────┘│
│                                                                     │
│  SDD meta-skills (any substantial change)                           │
│  sdd-init · sdd-explore · sdd-propose · sdd-spec · sdd-design ·     │
│  sdd-tasks · sdd-apply · sdd-verify · sdd-archive                   │
│                                                                     │
│  Tool / utility skills                                              │
│  acli (Jira CLI) · agentic-dev-onboard (tour)                       │
│                                                                     │
│  Shared Knowledge Layer                                             │
│  Product specs · Design tokens · Discovery docs · Per-ticket memory │
└──────────────────────┬──────────────────┬──────────────────┬────────┘
                       │                  │                  │
              ┌────────▼─────┐   ┌───────▼────────┐  ┌──────▼───────┐
              │ Issue tracker│   │   [DB_TOOL]    │  │   CI / CD    │
              │ (Jira via    │   │ (Supabase MCP) │  │ (Vercel +    │
              │  acli)       │   │                │  │  GitHub Acts)│
              └──────────────┘   └────────────────┘  └──────────────┘
```

### Top tier — the Developer

The human sits on top. The AI never ships anything on its own. Every stage has a checkpoint where a developer reviews, approves, modifies, or rejects the AI's work. Production deploys are *always* human-gated.

### Middle tier — the AI skills

The skill roster is split by *phase* (declared in each `SKILL.md` frontmatter as `phase:`):

- **`bootstrap`** — `agentic-dev-core` (one-time foundation install), `agentic-dev-onboard` (guided tour for newcomers).
- **`foundation`** — `project-foundation` (Constitution + PRD + SRS + Discovery), `design-system` (DESIGN.md), `project-bootstrap` (backend + frontend scaffolding).
- **`management`** — `product-management` (backlog seed, epic creation, story refinement, AC quality, edge-case enumeration, sprint reporting).
- **`implementation`** — `sprint-dev` (per-story mega-orchestrator), `unit-testing` (TDD composable slice), `git-flow-master` (branches, commits, PRs, conflicts).

On top of the project-shipped skills, the boilerplate composes with **two external skill catalogs** installed via `bun run setup`:

- **Reusable community skills** (installed via `npx skills add` from community repositories): stack-aware skills like `next-best-practices`, `next-cache-components`, `next-upgrade`, `react-best-practices`, `tailwind-css-patterns`, `shadcn`, `react-hook-form`, `zod`, `typescript-advanced-types`, `supabase-postgres-best-practices`, `bun`, `accessibility`, `seo`, `frontend-design`. These ship the canonical "how to do X in framework Y" knowledge so the project-shipped skills can stay stack-agnostic.
- **Gentle-AI user-installed skills** (cross-cutting): `skill-creator`, `find-skills`, `gh-cli`, `github-actions-docs`, `playwright-cli`, `n8n-skills`, `ui-ux-pro-max`, plus the **SDD bloque** (`sdd-init`, `sdd-explore`, `sdd-propose`, `sdd-spec`, `sdd-design`, `sdd-tasks`, `sdd-apply`, `sdd-verify`, `sdd-archive`, `sdd-onboard`) and the **judgment-day** parallel adversarial review skill.

All skills share the **Knowledge Layer** (the `.context/` directory and the engram MCP): product specs, design tokens, discovery docs, per-ticket memory.

### Bottom tier — the systems the AI operates on

- **Issue tracker** — Jira (Stories, Bugs, Epics) accessed via the `acli` skill (official Atlassian CLI). Drives the `Ready For Dev → In Progress → In Review → Ready For QA` state machine.
- **`[DB_TOOL]`** — the Supabase database, accessed through the Supabase MCP. Used for schema exploration, migrations, type generation, and Discovery.
- **`[API_TOOL]`** — the OpenAPI spec, generated by `bun run api:sync`. Used for contract verification and type generation in the frontend.
- **CI / CD** — Vercel for deploys, GitHub Actions for lint/types/tests on PRs. Triggers the staging deploy on merge to `staging`; production deploys are human-gated.

The `[TAG_TOOL]` brackets are not decorative. Every skill in this repo writes tool calls in `[TAG_TOOL]` pseudocode, which resolves against the **Tool Resolution** table in `CLAUDE.md`. Swap the row, swap the backend — no skill edits required.

---

## 6. Context Engineering: The Knowledge Layer

Context Engineering is the discipline of curating the information the AI reads **before** it acts. An AI that reads the right context does not need to guess, and does not hallucinate. An AI that guesses is dangerous in a production-grade system.

The knowledge layer is organised in three tiers, mirroring the scope at which the information is relevant:

```
┌──────────────────────────────────────────────────────────────┐
│  PROJECT LEVEL                                               │
│  Business model · PRD · SRS · API map · Data map · Feature   │
│  map · Design tokens                                         │
│  Example: .context/business/business-feature-map.md tells    │
│  the AI what features exist in THIS codebase.                │
└──────────────────────────────────────────────────────────────┘
                              ▼
┌──────────────────────────────────────────────────────────────┐
│  MODULE / EPIC LEVEL                                         │
│  Module context · Roadmap of stories · Cross-story decisions │
│  Example: .context/PBI/{module}/module-context.md catalogues │
│  the routes, DB tables, and shared types for that module.    │
└──────────────────────────────────────────────────────────────┘
                              ▼
┌──────────────────────────────────────────────────────────────┐
│  STORY / TICKET LEVEL                                        │
│  Acceptance criteria · Implementation plan · Review notes ·  │
│  Compliance matrix · Bug-fix root cause                      │
│  Example: .context/PBI/{module}/UPEX-123-add-login/          │
│  implementation-plan.md is the input contract for coding.    │
└──────────────────────────────────────────────────────────────┘
```

### How it actually looks on disk

```
.context/
├── _framework/                       # Framework infrastructure
│   ├── skill-registry.md            #   Compact-rules cache    (scripts/build-skill-registry.ts)
│   └── testing-capabilities.json    #   Testing tooling cache  (scripts/detect-testing-capabilities.ts)
│
├── idea/                             # Constitution (/project-foundation Phase 1)
│   ├── business-model.md            #   Problem, solution, monetization, segments
│   └── market-context.md            #   Industry, competitors, trends
│
├── PRD/                              # Product Requirements (/project-foundation Phase 2)
│   ├── executive-summary.md         #   Problem, KPIs, MVP metrics
│   ├── personas.md                  #   Target users, JTBD
│   ├── mvp-scope.md                 #   Must / should / could-have
│   └── user-journeys.md             #   Happy paths, edge cases
│
├── SRS/                              # Software Requirements (/project-foundation Phase 3)
│   ├── functional.md                #   FRs per epic
│   ├── non-functional.md            #   Perf, security, accessibility
│   ├── architecture.md              #   Stack, data model, deploy topology
│   └── api-contracts.md             #   OpenAPI endpoint definitions
│
├── business/                         # Auto-generated business maps (/project-foundation Phase 4 + slash commands)
│   ├── business-data-map.md         #   Entities, flows, state machines  (/business-data-map)
│   ├── business-feature-map.md      #   Feature inventory + CRUD matrix  (/business-feature-map)
│   └── business-api-map.md          #   Auth model + critical endpoints  (/business-api-map)
│
├── master-implementation-plan.md     # High-level roadmap                (/master-implementation-plan)
│
└── PBI/                              # Per-epic + per-ticket memory
    ├── epic-tree.md                 #   Output of /product-management seed
    └── {module}/
        ├── module-context.md
        ├── ROADMAP.md               #   Stories + dev status
        ├── PROGRESS.md              #   Current progress
        ├── SESSION-PROMPT.md        #   @-loadable session resume
        └── {TICKET-ID}-{title}/
            ├── spec.md              #   AC in Gherkin       (/product-management)
            ├── edge-cases.md        #   Enumeration         (/product-management)
            ├── implementation-plan.md  # Plan              (/sprint-dev Stage 1)
            ├── review.md            #   Code review notes   (/sprint-dev Stage 3)
            ├── compliance-matrix.md #   AC → code mapping   (/sprint-dev Stage 3)
            └── evidence/            #   Screenshots, logs   (gitignored)
```

Plus, at the project root:

- **`DESIGN.md`** — Apache-2.0 spec from Google Labs. The portable visual identity (palette, typography, spacing, components) every AI agent reads. Generated by `/design-system`.
- **`CLAUDE.md`** — operational context loaded every Claude Code session: project identity, behavioral layer, critical reminders, tool resolution, orchestration mode, skills catalog.

The canonical shape is documented in `.context/README.md`. The strategic reasoning behind the three-tier split lives in `CONTEXT.md` at the repo root.

### Cross-skill references

A second knowledge surface exists outside `.context/`: the `agentic-dev-core/references/*.md` files. They host the briefing template, the dispatch patterns decision guide, the orchestration doctrine, the testing-capabilities cache schema, the topic-key conventions, the model-routing table, and the skill-resolver protocol. Workflow skills cite these files instead of duplicating the content. They are loaded on demand and form part of the practice's knowledge layer even though they live under `.claude/skills/` rather than `.context/`.

| `agentic-dev-core` reference          | Purpose                                                                                                                |
| ------------------------------------- | ---------------------------------------------------------------------------------------------------------------------- |
| `briefing-template.md`                | The 6-component subagent briefing format with concrete examples per dispatch pattern.                                  |
| `dispatch-patterns.md`                | Decision table + heuristic for picking Single / Sequential / Parallel / Background.                                    |
| `orchestration-doctrine.md`           | Cacheable mirror of `CLAUDE.md` §Orchestration Mode (Subagent Strategy).                                               |
| `model-routing.md`                    | Phase → model alias table (opus for foundation, sonnet for impl, haiku for archive).                                   |
| `testing-capabilities.md`             | Cache schema + detection algorithm for `.context/_framework/testing-capabilities.json`.                                |
| `topic-key-conventions.md`            | Stable engram topic keys per artefact (e.g. `pbi/{ticket}/impl-plan`, `sdd/{change}/spec`).                            |
| `skill-resolver.md`                   | Skill-resolver protocol: how the orchestrator looks up compact rules and injects them into subagent prompts.            |

### Project variables vs runtime credentials

Static project values (`{{PROJECT_KEY}}`, `{{WEB_URL}}`, `{{API_URL}}`, `{{JIRA_URL}}`, etc.) live in `.agents/project.yaml` — the AI resolves `{{VAR_NAME}}` references against that file once per session. Runtime credentials (`STAGING_USER_EMAIL`, `STAGING_USER_PASSWORD`, etc.) remain in `.env` and are read at execution time. The two systems are separate by design: `.agents/project.yaml` is committed to the repo, `.env` is gitignored.

Four reference syntaxes coexist across prompts and docs:

| Syntax                         | Purpose                                         | Resolves from                                                                            |
| ------------------------------ | ----------------------------------------------- | ---------------------------------------------------------------------------------------- |
| `{{VAR_NAME}}`                 | Static project value (flat or env-scoped)       | `.agents/project.yaml`                                                                   |
| `{{environments.<env>.<var>}}` | Explicit cross-env reference                    | `.agents/project.yaml` → `environments.<env>.<var>` directly                              |
| `<<VAR_NAME>>`                 | Session/runtime value (e.g. `<<ISSUE_KEY>>`)    | Computed by the calling prompt at runtime. Never declared, never persisted.              |
| `{{jira.<slug>}}`              | Jira custom field reference                     | `.agents/jira-required.yaml` (manifest) + `.agents/jira-fields.json` (resolved IDs)       |

Validated via `bun run lint:agents`, `bun run jira:sync-fields`, and `bun run jira:check`. The full contract lives in `.agents/README.md`.

### Why it matters

When the AI opens a ticket a week after the last session, the context is still there — every AC, every team decision, every architectural choice. There is no re-briefing cost. This is how "zero context loss" is maintained sprint over sprint.

---

## 7. Sources of Truth: Where Context Comes From

The knowledge layer is static documentation. Before every meaningful action, the AI **also** pulls from live sources — this is what makes the system feel alive and prevents the AI from reasoning against stale assumptions.

```
                          ┌─────────────────────────┐
                          │      SESSION START      │
                          │   Multiple sources      │
                          │   loaded on demand      │
                          └──────────┬──────────────┘
                                     │
   ┌──────────┬──────────┬───────────┼───────────┬──────────────┬──────────┐
   ▼          ▼          ▼           ▼           ▼              ▼          ▼
 Frontend   Backend   Knowledge   Database      API           Engram      Issue
 codebase   API       layer       schema        spec          memory      tracker
 (Next.js)  routes    (.context/) (Supabase     (OpenAPI      (engram     (Jira via
                                  MCP)          generated)    MCP)        acli)
```

Each source feeds the AI a specific kind of truth:

| Source                | What it provides                                                  | Access mechanism                              |
| --------------------- | ----------------------------------------------------------------- | --------------------------------------------- |
| **Frontend codebase** | Routes, components, state management, API call patterns           | Direct file reads (`apps/web/`, `src/app/`)   |
| **Backend codebase**  | API routes, handlers, services, DB queries                        | Direct file reads (`apps/api/`, `src/api/`)   |
| **Knowledge layer**   | Curated product specs, design tokens, discovery docs              | `.context/` files + `DESIGN.md` at root       |
| **Database schema**   | Live tables, columns, relationships, RLS policies                 | `[DB_TOOL]` — Supabase MCP                    |
| **API spec**          | Every endpoint, request/response shapes, types                    | `[API_TOOL]` — OpenAPI generated locally      |
| **Engram memory**     | Decisions, bug fixes, conventions, discoveries from past sessions | `engram` MCP (`mem_search`, `mem_context`)    |
| **Issue tracker**     | Tickets, ACs, comments, transitions, parent epic                  | `acli` skill (Atlassian CLI)                  |
| **Library docs**      | Official documentation for libraries, frameworks, SDKs            | `context7` MCP                                |
| **Web search**        | Community solutions, troubleshooting, recent changes              | `tavily` MCP                                  |
| **Workflow automation** | Workflow design, integration patterns                           | `n8n` MCP                                     |

The `[TAG_TOOL]` brackets map to concrete implementations via the **Tool Resolution** table in `CLAUDE.md`. Skills never hard-code a tool name — they call `[DB_TOOL]` and let the table decide whether that means the Supabase MCP, a Postgres MCP, or raw `psql`.

### Decision rule for documentation lookups

- **`context7` MCP** — "how do I use X?" (official library docs: Next.js, Supabase, Tailwind, Zod, etc.).
- **`tavily` MCP** — "how do I solve X?" (community solutions: Stack Overflow, GitHub issues, blog posts).
- **`engram` MCP** — "did we do this before?" (past decisions, conventions, bug fixes from this project).

Before any non-trivial action — implementation plan, code generation, code review — the AI has traversed the relevant subset of these sources. That is the reason it does not need to guess.

### CLIs vs MCPs

Two complementary interfaces access these sources:

- **CLIs** — first-party command-line tools shipped inside this repo (`acli`, `bun run api:sync`, `gh`, `vercel`, `supabase`, etc.). Fast, deterministic, low-token. Preferred when available.
- **MCPs** — Anthropic's Model Context Protocol bridges to external systems (`supabase`, `context7`, `tavily`, `n8n`, `engram`). Used when the CLI does not cover the action, or when the AI needs to explore rather than execute a fixed workflow.

The Tool Resolution table in `CLAUDE.md` makes the priority explicit: CLI first, MCP as fallback.

---

## 8. Working with Claude Code: Daily Workflow

The daily workflow is plain English. The developer tells Claude Code what is needed, and the matching skill auto-triggers on description match.

### Example invocations

```text
> implementar UPEX-123
  → Auto-triggers: sprint-dev skill (full per-story loop)

> Fix the bug in UPEX-456
  → Auto-triggers: sprint-dev skill in bug-fix mode

> agregar feature al backlog: "users can export their data"
  → Auto-triggers: product-management skill (incremental feature)

> create branch for UPEX-789
  → Auto-triggers: git-flow-master skill (branch operation)

> abrí un PR contra staging
  → Auto-triggers: git-flow-master skill (PR operation)

> TDD this function
  → Auto-triggers: unit-testing skill (TDD red-green-refactor)

> rebrand the project
  → Auto-triggers: design-system skill (DESIGN.md regeneration)

> sprint report
  → Auto-triggers: product-management skill workflow G (read-only PM snapshot)

> /sdd-new authentication-rework
  → SDD orchestrator handles: exploration → proposal → spec → design → tasks → apply → verify → archive
```

Auto-triggering is governed by each skill's `description` field, which lists the phrases the skill should respond to. The decision tree in `CLAUDE.md` documents the full mapping. Explicit invocation is also supported — `/sprint-dev`, `/product-management`, `/git-flow-master`, and so on — for cases where determinism is preferred over pattern matching.

### What happens on invocation

The skill loads its references, opens the PBI folder for the target ticket (or creates it), pulls context from the seven sources listed above, searches engram for relevant prior work, and dispatches the first subagent of the stage. Everything that happens next is visible in the transcript.

### Recommended stack

The practice runs on this combination of tools. Each is replaceable, but the combination is what the practice expects out of the box:

| Tool                              | Role                                                             |
| --------------------------------- | ---------------------------------------------------------------- |
| **AI-native terminal** (Warp, etc.) | Terminal with blocks, smart autocomplete.                       |
| **Claude Code**                   | The AI CLI that runs on top — dispatches skills, subagents, MCPs.|
| **VSCode · Cursor · Windsurf**    | Editor — personal preference. Pick one.                          |
| **Git** + **gh CLI**              | Version control and PR operations.                               |
| **Bun**                           | Runtime + package manager.                                       |
| **Vercel**                        | Frontend hosting + preview deploys.                              |
| **Supabase**                      | Database, auth, storage.                                         |
| **Jira (via `acli`)**             | Issue tracker — stories, bugs, epics.                            |

Claude Code is the load-bearing piece — it is the orchestrator that triggers skills, dispatches subagents, and accesses MCPs. Everything else is the developer's working surface around it.

---

## 9. The Orchestration Model: AI Works, Human Decides

This is the most important architectural decision in the practice, and the one most often misunderstood in AI-assisted development: **skills do not run end-to-end autonomously**.

```
                ┌─────────────────────────┐
                │    MAIN AI (Skill)      │
                │    "Command Center"     │
                │    Dispatches work      │
                └────────────┬────────────┘
                             │
        ┌────────────────────┼────────────────────┐
        ▼                    ▼                    ▼
  ┌──────────┐         ┌──────────┐         ┌──────────┐
  │ Subagent │ ──●→    │ Subagent │ ──●→    │ Subagent │  ──●→ Done
  │ PLANNING │  👤     │   IMPL   │  👤     │  REVIEW  │   👤
  └──────────┘         └──────────┘         └──────────┘

  ● = Human checkpoint. The developer reviews, approves, modifies, or vetoes.
      Nothing proceeds without review.
```

### Three guarantees

1. **Every subagent reports back.** No silent work. The orchestrator presents a structured summary at the end of each stage.
2. **The human can stop, redirect, or modify at any checkpoint.** Veto at any gate forces the skill to replan.
3. **Full transcript is logged.** Every decision, every dispatch, every output is auditable after the fact.

### Why the checkpoints exist

AI makes mistakes — misreading an AC, picking the wrong abstraction, breaking an unrelated test. Catching those mistakes **between stages** prevents them from cascading. A wrong decision in Planning that reaches Implementation produces broken code. Caught at the Planning gate, it is a two-minute correction.

This is what gives the practice AI **speed** without losing human **judgment**. The skill does the mechanical work; the engineer does the deciding.

### Delegation rules

The orchestrator follows an explicit cost-aware delegation policy. The decision is *"does this inflate my context without need? If yes → delegate."*

| Action                                    | Inline | Delegate |
| ----------------------------------------- | ------ | -------- |
| Read 1–3 files to decide or verify        | ✅     | —        |
| Read 4+ files to explore / understand     | —      | ✅       |
| Read files as preparation for writing     | —      | ✅ (together with the write) |
| Write one file (mechanical, you know what) | ✅     | —        |
| Write across multiple files with new logic | —     | ✅       |
| Bash for state (`git status`, `gh pr list`)| ✅    | —        |
| Bash for execution (`bun test`, `bun build`)| —    | ✅       |

`delegate (async)` is the default for delegated work. Synchronous task delegation is used only when the next inline action depends on the result.

**Anti-patterns** — these always inflate context without need:

- Reading 4+ files to "understand" the codebase inline → delegate an exploration.
- Writing a feature across multiple files inline → delegate.
- Running tests or builds inline → delegate.
- Reading files as preparation for edits, then editing → delegate the whole thing together.

### Where the doctrine lives

The orchestration model is not improvised per session — it is captured in canonical references that workflow skills load on demand. Engineers and skill authors should know where to look:

- **`CLAUDE.md` §Orchestration Mode** — canonical project-level statement of the strategy (delegation rules, briefing format, error protocol).
- **`agentic-dev-core/references/orchestration-doctrine.md`** — cacheable mirror loaded by subagents that need the full doctrine without re-reading `CLAUDE.md`.
- **`agentic-dev-core/references/briefing-template.md`** — the six-component briefing format every dispatch uses (Goal · Context docs · Skills to load · Exact instructions · Report format · Rules).
- **`agentic-dev-core/references/dispatch-patterns.md`** — decision guide for the four patterns (Single, Sequential, Parallel, Background) and when each applies.
- **`## Subagent Dispatch Strategy`** sections inside each workflow `SKILL.md` (`sprint-dev`, `project-foundation`, `project-bootstrap`, `product-management`, etc.) — per-stage tables declaring which steps delegate to subagents and with what pattern.

When a skill writes `Use the dispatch defined in §Subagent Dispatch Strategy: Parallel`, that line is shorthand for the full briefing assembled from the references above. The doctrine is a single source, cited from many places.

### Per-phase model routing

Each skill declares a `phase:` in its `SKILL.md` frontmatter, and the model-routing table in `agentic-dev-core/references/model-routing.md` maps phases to model aliases:

| Phase            | Default model | Reason                                       |
| ---------------- | ------------- | -------------------------------------------- |
| orchestrator     | opus          | Coordinates, makes decisions                 |
| foundation       | opus          | Architectural decisions                      |
| planning         | sonnet        | Structured writing                           |
| implementation   | sonnet        | Coding                                       |
| review           | opus          | Critical analysis                            |
| archive          | haiku         | Mechanical close-out                         |
| default          | sonnet        | Non-classified delegation                    |

The orchestrator reads the table once at session start and routes each delegated subagent to the appropriate model — giving deep reasoning where it matters and cheap tokens where it does not.

---

## 10. The Foundation → Management → Implementation Pipeline

The practice's lifecycle is a **three-tier pipeline**. Each tier is owned by a distinct set of skills and produces distinct artefacts. Run them in order the first time; re-invoke individual tiers when the underlying assumption changes.

```
[Empty repo]
     │
     ▼
┌───────────────────────────────────────┐
│  TIER 0: BOOTSTRAP                    │
│  /agentic-dev-core                    │
│  Writes: .agents/, scripts/,          │
│          CLAUDE.md, testing-caps.json │
└───────────────────────────────────────┘
     │
     ▼
┌───────────────────────────────────────┐
│  TIER 1: FOUNDATION (one-time)        │
│                                       │
│  Phase 1 — /project-foundation        │
│    Constitution + PRD + SRS           │
│                                       │
│  Phase 2 — /design-system             │
│    DESIGN.md (Google Labs spec)       │
│                                       │
│  Phase 3 — /project-foundation        │
│    Discovery (data map, API arch,     │
│              project dev guide)       │
│                                       │
│  Phase 4 — /project-bootstrap         │
│    Backend + Frontend + features      │
└───────────────────────────────────────┘
     │
     ▼
┌───────────────────────────────────────┐
│  TIER 2: MANAGEMENT (continuous)      │
│  /product-management                  │
│    A — Backlog seed (from PRD)        │
│    B — Add feature (incremental)      │
│    C — Epic creation                  │
│    D — Story refinement (INVEST)      │
│    E — AC quality (Gherkin)           │
│    F — Edge-case enumeration          │
│    G — Sprint reporting               │
└───────────────────────────────────────┘
     │
     ▼
┌───────────────────────────────────────┐
│  TIER 3: IMPLEMENTATION (per story)   │
│  /sprint-dev (mega-orchestrator)      │
│    Stage 1 — Planning                 │
│    Stage 2 — Implementation           │
│    Stage 3 — Code Review              │
│    Stage 4 — Staging Deploy           │
│    Stage 5 — Production Deploy (gated)│
│                                       │
│  Composable mid-flight:               │
│    /unit-testing  → TDD slice         │
│    /git-flow-master → branches, PRs   │
└───────────────────────────────────────┘
     │
     ▼
[Code merged + deployed]
```

### Tier 0 — Bootstrap (`/agentic-dev-core`)

Bootstrap is the one-time install. It writes, in this exact dependency-ordered sequence:

1. `.agents/project.yaml` — template variable source.
2. `.agents/jira-required.yaml` — manifest of Jira custom fields + work types.
3. `.agents/jira-fields.json` (stub) — populated later by `bun run jira:sync-fields`.
4. `.agents/jira-workflows.json` (stub) — populated later by `bun run jira:sync-workflows`.
5. `scripts/agents-setup.ts`, `scripts/agents-lint.ts`, `scripts/sync-jira-fields.ts`, `scripts/sync-jira-workflows.ts`, `scripts/check-jira-setup.ts` — the five CLIs.
6. `package.json` — merged (never overwritten) with the scripts needed for the CLIs above.
7. `CLAUDE.md` — citation-rich operational context, written last because it cites everything above.
8. `.context/_framework/testing-capabilities.json` — testing tooling cache populated by `scripts/detect-testing-capabilities.ts`.

Idempotent: never overwrites existing files (except merging `package.json`), never deletes, never runs `bun install` itself — surfaces what needs to be installed in the report.

### Tier 1 — Foundation (`/project-foundation`, `/design-system`, `/project-bootstrap`)

**Phase 1: Constitution.** *Why* are we building this? The constitution captures the rationale before any scope decisions are made: the problem worth solving, who it serves, how it monetizes, and the competitive context. Output: `.context/idea/business-model.md` and `.context/idea/market-context.md`.

**Phase 2: PRD.** *What* are we building? The PRD turns the constitution into a buildable product spec: problem statement, personas, MVP scope, user journeys. Output: `.context/PRD/*.md`.

**Phase 2.5: Design system.** *What does it look like?* `/design-system` is invoked post-PRD, pre-SRS. Five available paths:

| Path                                 | When                                                                                | Notes              |
| ------------------------------------ | ----------------------------------------------------------------------------------- | ------------------ |
| **A — Gallery manual**               | User wants to browse and pick visually.                                             | Free               |
| **B — `getdesign` + LLM-matcher** ⭐ | PRD exists + you want off-the-shelf with zero manual effort. **Default**.           | Free, automatable  |
| **C — Open Design app**              | You want to iterate visually before locking tokens.                                 | OSS, requires Docker |
| **D — Claude Design handoff**        | You have Claude Pro+ and want best-in-class.                                        | Premium            |
| **E — LLM-authored custom**          | Business is very specific and no off-the-shelf matches.                             | Free               |

Output: `DESIGN.md` at the project root, Apache-2.0 spec from Google Labs, validated with `npx @google/design.md lint`.

**Phase 3: SRS.** *How* is the system structured? The SRS turns the PRD into a technical contract: functional requirements traceable to PRD user stories, non-functional constraints, system architecture decisions, OpenAPI endpoint definitions. Output: `.context/SRS/*.md`.

**Phase 4: Discovery.** *How does the system map to its world?* Phase 4 orchestrates 4 standalone commands plus 1 embedded reference, producing the docs every later skill loads on session start:

- `business-data-map.md` — entities, relationships, business flows (generated by `/business-data-map`).
- `business-feature-map.md` — feature catalog by domain, CRUD matrix, flags (generated by `/business-feature-map`).
- `business-api-map.md` — auth model, critical journeys, architecture behind the API (generated by `/business-api-map`).
- `project-dev-guide.md` — conversational guide answering "how do I build feature X here?" (embedded skill logic).
- `master-implementation-plan.md` — recommended-but-optional synthesis: dependency-cascaded roadmap (generated by `/master-implementation-plan`).

**Phase 5: Project Bootstrap.** `/project-bootstrap` consumes the SRS + DESIGN.md and scaffolds:

- **Backend** — DB schemas, ORM/migrations, API base, shared types, error handling, structured logging.
- **Frontend** — framework scaffolding (Next.js App Router), design-system import from `DESIGN.md`, project structure, routing skeleton, state baseline.
- **Incremental features** (composable, run in any order after the base):
  - OpenAPI / Scalar UI for contract publication.
  - API routes + middleware conventions.
  - Bearer-token auth (JWT, refresh, protected routes).
  - Env vars + URL builders (typed `.env`, environment-aware helpers).
  - Supabase types generation pipeline.

### Tier 2 — Management (`/product-management`)

After foundation, the backlog is still empty. `/product-management` is the continuous work that turns PRD epics into Jira stories with refined ACs. Seven workflows:

| Workflow | Purpose | Reference |
| -------- | ------- | --------- |
| **A — Backlog seed** | One-time. Generate initial backlog tree (epics + stories) from a fresh PRD. | `product-backlog-seed.md` |
| **B — Add feature** | Continuous. New feature mid-flight; complexity-routed to single story, full epic, or multi-epic. | `add-feature.md` |
| **C — Epic creation** | Formal structure for a new epic: naming, scope, decomposition, PRD traceability. | `epic-creation.md` |
| **D — Story refinement** | Validate INVEST; optional 3-amigos; story slicing; ready-for-dev checklist. | `story-refinement.md` |
| **E — AC quality refinement** | Turn rough ACs into Gherkin (Scenario / Given–When–Then) with concrete data, error scenarios, and boundary scenarios. | `acceptance-criteria.md` |
| **F — Edge-case enumeration** | Systematically enumerate failure modes, boundary conditions, integration risks. Decide which become AC vs test-only. | `edge-cases-enumeration.md` |
| **G — Sprint reporting** | Read-only PM snapshot: epics, stories, PRs grouped by status. No state mutation. | `sprint-report.md` |

### Tier 3 — Implementation (`/sprint-dev`, `/unit-testing`, `/git-flow-master`)

Section 11 walks through this in depth. The short version: `/sprint-dev` is the mega-orchestrator that drives Planning → Implementation → Code Review → Staging → (gated) Production for one story at a time. Composable mid-flight with `/unit-testing` (TDD slice) and `/git-flow-master` (branches, commits, PRs, conflicts).

---

## 11. The Per-Story Dev Loop: Sprint-Dev in Depth

The `sprint-dev` skill handles the per-story work across five stages. A full cycle compresses what would otherwise be a multi-hour manual workflow into a predictable, repeatable per-ticket process. The 12-step workflow is dispatched stage-by-stage.

```
[Story in Jira: Ready For Dev]
       │
       ▼
   +--------------------------+
   | PASO 0: Epic precheck    |   inline; verify feature-plan + feature-impl-plan exist
   +--------------------------+
       │
       ▼
   +--------------------------+
   | STAGE 1: PLANNING        |   references/feature-plan.md, story-plan.md, spec-driven-development.md
   |  - Read story + AC       |
   |  - Discover module ctx   |
   |  - Decompose into tasks  |
   |  - Output: impl-plan.md  |
   |  - Jira: Ready For Dev   |
   |    → In Progress         |
   +--------------------------+
       │
       ▼
   +--------------------------+
   | STAGE 2: IMPLEMENTATION  |   references/implement-story.md, bug-fix-workflow.md,
   |  - TDD optional          |       continue-implementation.md, fix-issues.md,
   |    (→ /unit-testing)     |       code-standards.md, error-handling.md, data-testid-standards.md
   |  - Multi-file edits      |
   |  - Lint+types+tests      |
   |    in parallel (cap=3)   |
   |  - Iterate on red signal |
   +--------------------------+
       │
       ▼
   +--------------------------+
   | STAGE 3: CODE REVIEW     |   references/review-pr.md, setup-linting.md
   |  - Push branch + open PR |
   |    (→ /git-flow-master)  |
   |  - Jira: auto → In Review|
   |  - Static review check   |
   |  - Fix-and-iterate loop  |
   |  - Update docs in branch |
   +--------------------------+
       │
       ▼
   +--------------------------+
   | STAGE 4: STAGING DEPLOY  |   references/staging-deploy.md, ci-cd-setup.md
   |  - Merge to staging      |
   |  - Vercel preview        |
   |  - Background health     |
   |    monitor               |
   |  - Jira: → Ready For QA  |
   +--------------------------+
       │
       ▼ (gated — human approval + QA green)
   +--------------------------+
   | STAGE 5: PROD DEPLOY     |   references/production-deploy.md, rollback.md
   |  - Tag release           |
   |  - Promote to prod       |
   |  - Background monitor    |
   |  - Rollback ready        |
   +--------------------------+
```

### Stage 1 — Planning (`Single` dispatch)

A dedicated planner subagent reads the story, the AC, the module context, and the relevant code paths. It produces `implementation-plan.md` under the PBI folder. The plan lists:

- Acceptance criteria → expected code-level outcome.
- Files to create / modify / delete.
- Functions / components affected.
- Tests to add (or update).
- Open questions surfaced for the developer to answer before Stage 2.

Jira transition: **Ready For Dev → In Progress**.

The plan is presented to the developer and approved before any code is written. If the developer modifies the plan, the changes are persisted in the file; the file *is* the contract Stage 2 will follow.

### Stage 2 — Implementation (`Sequential` or `Parallel` dispatch)

An implementation subagent picks up the plan, splits by file or feature slice, and writes code. Multi-file edits run sequentially when there are inter-file dependencies, parallel when independent.

After each batch of edits, a **parallel verification trio** runs (cap = 3):

```
┌─────────────────────────────────────────────────┐
│ Verifier 1   Verifier 2   Verifier 3            │
│ bun run lint bun run build bun test             │
│ (parallel)   (parallel)    (parallel)           │
└─────────────────────────────────────────────────┘
              ↓
       All green → continue
              ↓
       Any red → fix loop
```

If any verifier reports red, the implementation subagent picks up the failures and iterates. Maximum two iterations per slice before escalating to the developer.

**TDD opt-in.** When the slice is TDD-friendly (pure function, complex branching, bug-fix reproducer), the developer or the orchestrator invokes `/unit-testing` mid-flight. Red-green-refactor runs inside the slice, then control returns to the `sprint-dev` main flow.

### Stage 3 — Code Review (`Single` + fix-iterate)

The branch is pushed and a PR is opened (via `/git-flow-master`). Jira automatically transitions **In Progress → In Review** (configured via the Jira workflow integration).

A reviewer subagent runs a static review against:

- The AC compliance matrix (every AC mapped to a code change).
- Project code standards (`code-standards.md`, `error-handling.md`, `data-testid-standards.md`).
- Composition patterns (Server Components vs Client Components for Next.js, RLS for Supabase).
- Test coverage of the new behavior.

If the review finds issues, the implementation subagent picks them up via `fix-issues.md` and re-runs the verification trio. Two iterations maximum; on the third, escalate to the developer.

Output: `review.md` and `compliance-matrix.md` under the PBI folder, both committed in the PR branch.

### Stage 4 — Staging Deploy (`Single` + `Background` monitor)

Once the PR is approved and merged to `staging`, the staging deploy fires:

- Vercel deploys the frontend.
- Supabase migrations run (if any).
- A background subagent monitors health endpoints, smoke checks, and error rates for the first N minutes.

Jira transition: **In Review → Ready For QA**.

### Stage 5 — Production Deploy (`gated`)

Production is *always* human-gated. The developer triggers it explicitly after:

1. QA has signed off in the sister `agentic-qa-boilerplate` workflow.
2. Business stakeholders have approved (if business-critical).
3. The release window is appropriate.

Then `production-deploy.md` runs: tag the release, promote to production, background monitor, rollback playbook ready.

### On any subagent failure

STOP. Report partial state: which stages completed, what artifacts landed, which Jira transitions fired. Present retry / skip-step / abort options. Do NOT auto-fix. Do NOT auto-rollback. See `agentic-dev-core/references/orchestration-doctrine.md`.

### Subagent dispatch summary

| Stage / step                              | Pattern                | Subagent role                                                                  |
| ----------------------------------------- | ---------------------- | ------------------------------------------------------------------------------ |
| Trigger / context-load (epic precheck)    | inline                 | orchestrator reads epic artifacts + ticket; no subagent yet                    |
| Stage 1 — Plan creation                   | Single                 | dedicated planner: read story + AC, decompose tasks, output impl-plan.md       |
| Stage 2 — Implementation (multi-file)     | Sequential or Parallel | impl agent(s); split by file or feature slice                                  |
| Stage 2 — Verification (lint+types+tests) | Parallel cap=3         | three verifiers in parallel: lint, build/types, unit tests                     |
| Stage 3 — Code review                     | Single                 | reviewer: static review against AC + code-standards checklist                  |
| Stage 3 — Fix-and-iterate (if red)        | Sequential             | impl agent picks up review notes; re-runs verification                         |
| Stage 4 — Deploy to staging               | Single + Background    | deploy agent kicks off; background monitor watches health/smoke                |
| Pre-prod gate                             | inline                 | orchestrator gates with the user; never auto-promote                           |
| Stage 5 — Deploy to production            | Single + Background    | same pattern as staging, prod target, plus rollback ready                      |

**Sequential, not Parallel, across stages**: each stage feeds the next (Stage 1's plan is read by Stage 2; Stage 2's diff is read by Stage 3; Stage 3's approval gates Stage 4). Parallelism happens *inside* a stage.

---

## 12. The AI Toolkit: Skills, Commands, Integrations

The practice uses three complementary kinds of AI capability:

- **Skills** auto-trigger on intent (a user phrase matches the skill description).
- **Commands** are invoked explicitly with `/<name>` for one-shot utilities.
- **Integrations** are the live systems the AI can query and act on. These split into two kinds: **MCPs** (the external bridge) and **CLIs** (first-party command-line tools built inside this repo or installed system-wide). Both surface the same systems — teams pick CLI-first when available, MCP as fallback.

### Workflow skills (auto-trigger on intent)

The 10 project-shipped workflow skills:

| Skill                   | Phase          | When it fires                                                                                                                                |
| ----------------------- | -------------- | -------------------------------------------------------------------------------------------------------------------------------------------- |
| `agentic-dev-core`      | bootstrap      | "initialize the project", "bootstrap framework", "regenerate CLAUDE.md", "install project scripts"                                           |
| `agentic-dev-onboard`   | bootstrap      | "onboard me", "explain this repo", "first time using this", "primer vez en este repo"                                                        |
| `project-foundation`    | foundation     | "ideando un nuevo producto", "define el PRD", "construir la constitución", "mapear arquitectura", "MVP scope", "user journeys"               |
| `design-system`         | foundation     | "definir design system", "crear DESIGN.md", "establecer paleta de colores", "branding del proyecto", "rebrandear el proyecto"                |
| `project-bootstrap`     | foundation     | "scaffolding del proyecto", "setup del backend", "inicializar el frontend", "configurar OpenAPI", "bearer token authentication"              |
| `product-management`    | management     | "create epic", "crear épica", "agregar historia al backlog", "refine acceptance criteria", "INVEST", "sprint report"                         |
| `sprint-dev`            | implementation | "implementar esta historia", "trabajar el ticket UPEX-XXX", "plan to code to review to deploy", "fix this bug and merge", "deploy a staging" |
| `unit-testing`          | implementation | "write unit tests", "TDD this function", "red-green-refactor", "what to mock", "AAA pattern", "coverage target"                              |
| `git-flow-master`       | implementation | "crear branch", "commit and push", "abrir PR", "fix conflict", "stack of PRs", "qué estrategia de git usamos"                                |
| `acli`                  | any            | Atlassian CLI for Jira from the terminal — create/edit/transition issues, bulk operations, scripting Jira                                    |

### SDD meta-skills (Spec-Driven Development)

Installed via gentle-ai, used for any substantial change that benefits from formal upfront design:

| Skill         | Phase    | Purpose                                                                            |
| ------------- | -------- | ---------------------------------------------------------------------------------- |
| `sdd-init`    | bootstrap| Initialize SDD context — detect stack, bootstrap persistence backend (engram)      |
| `sdd-explore` | exploration | Investigate an idea, read codebase, compare approaches. No files created.       |
| `sdd-propose` | proposal | Create a change proposal with intent, scope, and approach                          |
| `sdd-spec`    | spec     | Write requirements + scenarios (delta specs for changes)                           |
| `sdd-design`  | design   | Technical design document with architecture decisions                              |
| `sdd-tasks`   | tasks    | Break the change into a task checklist                                             |
| `sdd-apply`   | apply    | Implement tasks from the change                                                    |
| `sdd-verify`  | verify   | Validate implementation matches specs, design, and tasks                           |
| `sdd-archive` | archive  | Sync delta specs to main specs and archive the completed change                    |
| `sdd-onboard` | onboard  | Guided end-to-end walkthrough of the SDD workflow using the real codebase          |

Three meta-commands the orchestrator handles directly (do not appear in autocomplete):

- `/sdd-new <change>` — start a new change by delegating exploration + proposal.
- `/sdd-continue [change]` — run the next dependency-ready phase.
- `/sdd-ff <name>` — fast-forward planning: proposal → specs → design → tasks.

### Commands (`/<name>` — on-demand utility)

Commands are deterministic, single-purpose prompts invoked explicitly. Unlike skills, they do not auto-trigger.

| Command                      | Purpose                                                                       |
| ---------------------------- | ----------------------------------------------------------------------------- |
| `/sync-ai-memory`            | Audit + sync README, CLAUDE.md, CONTEXT.md, docs/, and onboarding HTML against current repo state |
| `/business-data-map`         | Generate or update `.context/business/business-data-map.md`                   |
| `/business-feature-map`      | Generate or update `.context/business/business-feature-map.md`                |
| `/business-api-map`          | Generate or update `.context/business/business-api-map.md`                    |
| `/master-implementation-plan`| Generate or update `.context/master-implementation-plan.md`                   |

All command definitions live under `.claude/commands/<name>.md`.

### Reusable community skills

Installed via `bun run setup` from community catalogs (not committed in this repo). Project-level, stack-aware:

- **Next.js / React** — `next-best-practices`, `next-cache-components`, `next-upgrade`, `nextjs-seo`, `nextjs-performance`, `react-best-practices`, `composition-patterns`.
- **Styling** — `tailwind-css-patterns`, `shadcn`.
- **Forms / validation** — `react-hook-form`, `zod`.
- **TypeScript** — `typescript-advanced-types`.
- **Database** — `supabase-postgres-best-practices`, `postgresql-optimization`.
- **Runtime / tooling** — `bun`, `webpack-bundler`.
- **A11y / SEO / design** — `accessibility`, `seo`, `frontend-design`, `ui-ux-pro-max`, `accessibility-review`.
- **Deploy** — `deploy-to-vercel`.

User-level (cross-cutting, installed globally): `skill-creator`, `find-skills`, `gh-cli`, `github-actions-docs`, `playwright-cli`, `n8n-skills` (including `n8n-expression-syntax`, `n8n-node-configuration`, `n8n-mcp-tools-expert`, `n8n-validation-expert`, `n8n-code-javascript`, `n8n-code-python`, `n8n-workflow-patterns`), `claude-api`, `humanizer`, `security-scan`, `code-auditor`, `presentation-designer`.

After `/project-foundation` and `/project-bootstrap` run, `npx autoskills` auto-detects the concrete stack and installs additional matching skills.

### Integrations (live system access)

MCPs and CLIs are how the AI talks to real systems. Without them, the AI can only reason against text; with them, the AI can query, act, and verify.

| Integration            | Default provider               | Use                                                                          |
| ---------------------- | ------------------------------ | ---------------------------------------------------------------------------- |
| `[ISSUE_TRACKER_TOOL]` | `acli` skill (Atlassian CLI)   | Fetch tickets, transitions, comments, links, bulk operations                 |
| `[DB_TOOL]`            | Supabase MCP                   | Schema exploration, migrations, query, type generation                       |
| `[API_TOOL]`           | OpenAPI generated locally + `bun run api:sync` | Contract verification, endpoint discovery, type generation       |
| `[AUTOMATION_TOOL]`    | `playwright-cli` skill         | Browser automation — screenshots, tracing, mocking, multi-tab flows          |
| `context7` MCP         | Anthropic-ecosystem            | Official library documentation (Next.js, Supabase, Zod, etc.)                |
| `tavily` MCP           | Anthropic-ecosystem            | Web search for community solutions                                           |
| `n8n` MCP              | Anthropic-ecosystem            | Workflow automation design and validation                                    |
| `engram` MCP           | Plugin                         | Persistent memory across sessions and compactions                            |
| `gh` CLI               | First-party                    | GitHub PR / issue / actions operations                                       |
| `vercel` CLI           | First-party                    | Deploy preview, promote, rollback                                            |
| `supabase` CLI         | First-party                    | Local dev stack, migrations, types                                           |
| `playwright` CLI       | First-party                    | E2E test runner                                                              |

Each `[TAG_TOOL]` resolves via the Tool Resolution table in `CLAUDE.md`. Swap the row to swap the backend — skills keep calling the same tag.

**Decision rule:**

- `context7` — "how to use X" (official docs).
- `tavily` — "how to solve X" (community solutions).
- `engram` — "did we do this before?" (project memory).
- Supabase MCP — for live DB state and queries.
- `n8n` MCP — only when integrating workflow automation.

Authentication tokens for long-lived MCPs expire on their own cadence. Refresh scripts live under `cli/` and `scripts/` and are documented in each MCP's setup guide (`docs/setup/mcp/`).

### Scripts shipped in `scripts/`

Foundation utilities written by `agentic-dev-core`:

| Script                                | Purpose                                                                       |
| ------------------------------------- | ----------------------------------------------------------------------------- |
| `agents-setup.ts`                     | Interactive setup that fills `.agents/project.yaml`                           |
| `agents-lint.ts`                      | Validate every `{{VAR}}` and `{{jira.*}}` reference resolves                  |
| `sync-jira-fields.ts`                 | Discover Jira custom fields → write `.agents/jira-fields.json`                |
| `sync-jira-workflows.ts`              | Discover Jira workflows → write `.agents/jira-workflows.json`                 |
| `sync-jira-issues.ts`                 | Pull Jira issues for offline reasoning                                        |
| `check-jira-setup.ts`                 | Validate `jira-required.yaml` manifest against the workspace catalogs         |
| `detect-testing-capabilities.ts`      | Detect test runner, e2e, typecheck, lint, strict-TDD → write cache JSON       |
| `build-skill-registry.ts`             | Scan `.claude/skills/` and emit compact-rules registry                        |
| `sync-openapi.ts`                     | Sync OpenAPI spec + generate types                                            |
| `engram-bridge.ts`                    | Bridge between local context and engram MCP                                   |
| `onboarding.ts`                       | Interactive installer (gentle-ai + MCPs + CLIs verification)                  |

---

## 13. Quality Gates: Lint, Types, Tests, Review, Deploy

Every change merged to `staging` (and especially every change promoted to `main`) passes through the same gate. There is no "I think it's fine" shipping decision — the verdict is data-driven, owned by `/sprint-dev`'s Stage 3 and Stage 4 dispatchers, and enforced by CI.

### The five gates

```
┌──────────┐   ┌──────────┐   ┌──────────┐   ┌──────────┐   ┌──────────┐
│   LINT   │ → │  TYPES   │ → │  TESTS   │ → │  REVIEW  │ → │  DEPLOY  │
└──────────┘   └──────────┘   └──────────┘   └──────────┘   └──────────┘
   ESLint        tsc           Vitest +        Reviewer       Vercel +
   Prettier      --noEmit      Playwright      subagent +     migrations
                                               human          (gated for
                                                              prod)
```

| Gate     | Command                                    | Owner               | Behavior on red                                |
| -------- | ------------------------------------------ | ------------------- | ---------------------------------------------- |
| Lint     | `bun run lint`                             | Stage 2 verifier #1 | Auto-fix attempt, then escalate                |
| Types    | `bun run build` or `tsc --noEmit`          | Stage 2 verifier #2 | Surface to impl subagent for fix loop          |
| Tests    | `bun test` (Vitest) + `bun run e2e` (PW)   | Stage 2 verifier #3 | Surface to impl subagent for fix loop          |
| Review   | Reviewer subagent + developer              | Stage 3             | Fix-and-iterate, max 2 loops, then escalate    |
| Deploy   | Vercel + Supabase migrations               | Stage 4 + Stage 5   | Rollback playbook ready; prod is human-gated   |

### Pre-flight checklist

Before any push to `main`:

- [ ] Plan presented and approved before coding (skill-internal in `/sprint-dev`).
- [ ] Aliases used for imports (`@api/`, `@schemas/`, `@utils/`). No deep relative imports.
- [ ] Credentials read from `.env`, never hardcoded.
- [ ] Unit tests pass (when applicable; see `/unit-testing`).
- [ ] Lint + types green.
- [ ] No AI attribution in commits ("Generated with Claude Code", "Co-Authored-By: Claude" are forbidden).
- [ ] Context loaded progressively (not all at once).
- [ ] Human confirmation before push to `main`.

### Failure protocol

When any gate fails, the orchestrator does NOT auto-fix without approval. It STOPS, reports the failure with full context (which gate, which command, what output), and presents three options: **retry**, **skip-step**, **abort**. The developer decides.

This is the same protocol used in the QA sister repo for test failures — both halves of the agentic engineering practice share the rule: AI works, human decides.

---

## 14. Anatomy of a Story Session

To illustrate how the pieces fit together, here is what a typical story's journey looks like from start to merged code.

Consider a ticket `UPEX-XXX` with a handful of acceptance criteria covering a user-facing feature.

1. **Session Start.** The developer types `implementar UPEX-XXX`. The `sprint-dev` skill auto-triggers. The orchestrator searches engram for prior work on this module (`mem_search`), opens the ticket via `acli`, explores the frontend and backend code paths related to the feature, queries the database via the Supabase MCP for relevant schema, and creates the PBI folder for the ticket if it does not exist.

2. **Stage 1 — Planning.** A planner subagent is dispatched (Single pattern, model alias = sonnet). It reads the story, the AC, the module context, and produces `implementation-plan.md`. The plan is presented to the developer with open questions and approved. Jira transitions Ready For Dev → In Progress.

3. **Stage 2 — Implementation.** An implementation subagent picks up the plan and writes code across the listed files. After each batch, three verifiers run in parallel: `bun run lint`, `bun run build`, `bun test`. Red → fix loop, max 2 iterations. The developer can opt into a TDD slice via `/unit-testing` for any pure function or complex branching.

4. **Stage 3 — Code Review.** The branch is pushed and a PR is opened via `/git-flow-master` (auto-detected branching strategy chooses the base branch). Jira automatically transitions In Progress → In Review. A reviewer subagent (model alias = opus) walks the AC compliance matrix, the code-standards checklist, and the composition patterns. Output: `review.md` and `compliance-matrix.md` committed in the PR branch.

5. **Stage 4 — Staging Deploy.** PR is merged to `staging`. Vercel deploys the preview. Supabase migrations run (if any). A background subagent watches health and smoke for N minutes. Jira transitions In Review → Ready For QA.

6. **Stage 5 — Production Deploy (gated).** The developer triggers `/sprint-dev` Stage 5 explicitly after QA sign-off (from the sister `agentic-qa-boilerplate`) and business approval. Tag, promote, monitor, rollback-ready.

7. **Memory persistence.** Throughout the session, the orchestrator and subagents call `mem_save` on decisions, bug fixes, conventions, and discoveries — tagged with stable topic keys (`pbi/UPEX-XXX/impl-plan`, `pbi/UPEX-XXX/review`, etc.) so the next session can recover them.

Every artefact lives in the PBI folder on disk and in engram. The AI produces the plan, writes the code, opens the PR, runs the deploy. The engineer reviews and approves at each checkpoint.

### Typical timing

| Stage              | Typical duration (small story) | Typical duration (medium story) |
| ------------------ | ------------------------------ | ------------------------------- |
| Session start      | < 1 min                        | 1–2 min                         |
| Stage 1 — Planning | 2–5 min                        | 5–15 min                        |
| Stage 2 — Impl     | 5–20 min                       | 30–60 min                       |
| Stage 3 — Review   | 2–5 min                        | 5–15 min                        |
| Stage 4 — Staging  | < 5 min (Vercel deploy)        | < 5 min                         |
| Stage 5 — Prod     | Gated; depends on schedule     | Gated                           |

These are rough orders of magnitude, not commitments. Exact duration depends on scope, risk, and how many verification loops fire.

---

## 15. Persistent Memory and Cross-Session Continuity

A single chat thread is ephemeral. A practice is durable. Bridging the two is the job of the **memory layer**.

The practice uses two complementary memory surfaces:

### 15.1 Engram (MCP-backed, cross-session)

Engram is a persistent memory MCP server. It survives across:

- Session restarts.
- Compactions of the context window.
- Hardware changes (memory lives on the engram backend, not in the chat).

Engram is structured by **topic key** — a stable identifier under which an artefact is saved. Examples:

| Topic key                              | Stored content                                    | Owner                          |
| -------------------------------------- | ------------------------------------------------- | ------------------------------ |
| `sdd-init/{project}`                   | Project stack detection, testing capabilities     | `/sdd-init`                    |
| `pbi/{epic-slug}/epic`                 | Epic spec                                         | `/product-management`          |
| `pbi/{ticket}/spec`                    | Story spec with refined AC                        | `/product-management`          |
| `pbi/{ticket}/edge-cases`              | Enumerated edge cases                             | `/product-management`          |
| `pbi/{ticket}/impl-plan`               | Implementation plan                               | `/sprint-dev` Stage 1          |
| `pbi/{ticket}/review`                  | Review notes                                      | `/sprint-dev` Stage 3          |
| `pbi/{ticket}/compliance-matrix`       | AC → code mapping                                 | `/sprint-dev` Stage 3          |
| `pbi/{ticket}/bug-fix`                 | Root cause + fix                                  | `/sprint-dev` bug-fix flow     |
| `sdd/{change}/explore` … `archive`     | SDD phase artefacts (8 keys per change)           | SDD bloque                     |
| `architecture/<topic>`                 | Architectural decision (free-form)                | Any proactive save             |

Full topic-key conventions: `agentic-dev-core/references/topic-key-conventions.md`.

### 15.2 On-disk PBI folders (file-backed, project-scoped)

For artefacts that need to be committed to git (so the team and CI see them), the practice uses `.context/PBI/{module}/{TICKET-ID}-{title}/`. This is what makes a session "resumable from a fresh checkout":

```
.context/PBI/{module}/UPEX-XXX-add-login/
├── spec.md                  # AC in Gherkin
├── edge-cases.md
├── implementation-plan.md
├── review.md
├── compliance-matrix.md
├── bug-fix.md               # only if bug-fix flow ran
└── evidence/                # screenshots, logs (gitignored)
```

Plus, per module:

```
.context/PBI/{module}/
├── module-context.md        # Module overview
├── ROADMAP.md               # All stories + dev status
├── PROGRESS.md              # Current progress
└── SESSION-PROMPT.md        # @-loadable session resume
```

To resume a session from anywhere, the developer types `@.context/PBI/{module}/SESSION-PROMPT.md` — the file is structured so Claude Code loads it as a primer, restoring full context without any copy-paste.

### 15.3 The proactive save rule

Engram saves are *proactive*, not reactive. The orchestrator and every workflow skill call `mem_save` immediately after:

- An architecture or design decision is made.
- A team convention is documented.
- A bug fix is completed (include root cause).
- A non-obvious approach is implemented.
- A pattern is established (naming, structure, convention).
- A user preference or constraint is learned.

Self-check after every task: *"Did I make a decision, fix a bug, learn something non-obvious, or establish a convention? If yes, call `mem_save` NOW."*

This is what makes the system feel like it remembers the team's preferences and the project's history — because it actually does.

### 15.4 Session close protocol

Before any session ends or the orchestrator says "done", it calls `mem_session_summary` with a structured summary:

```
## Goal
[What we were working on this session]

## Discoveries
- [Technical findings, gotchas, non-obvious learnings]

## Accomplished
- [Completed items with key details]

## Next Steps
- [What remains to be done — for the next session]

## Relevant Files
- path/to/file — [what it does or what changed]
```

Without this, the next session starts blind. With it, the next session starts knowing exactly where the last one left off.

---

## 16. Extending the Framework

The framework is meant to be extended. The hooks are documented and the conventions are stable.

### 16.1 Adding a workflow skill

1. Create `.claude/skills/<name>/SKILL.md` with the standard frontmatter:

```markdown
---
name: <skill-name>
description: "<what it does, what it triggers on, what NOT to use it for>"
license: MIT
compatibility: [claude-code, opencode]
phase: <bootstrap | foundation | management | implementation | exploration | proposal | spec | design | tasks | apply | verify | archive>
---
```

2. Document `## When to use`, `## Pre-requisites`, `## Subagent Dispatch Strategy`, `## Main workflow`, and `## Hand-offs`.
3. Cite `agentic-dev-core/references/*.md` in a `## Dependencies` block (do not duplicate the orchestration doctrine, briefing template, or dispatch patterns inline).
4. Put long-form procedures under `.claude/skills/<name>/references/`. Keep `SKILL.md` itself as a router; the references are the meat.
5. Run `bun scripts/build-skill-registry.ts` to update `.context/_framework/skill-registry.md` with the new skill's compact rules.

### 16.2 Adding a slash command

1. Create `.claude/commands/<name>.md` with a single-purpose prompt.
2. Document what it produces and when to invoke it.
3. List it in `CLAUDE.md` under the Skills/Commands tables and update `CONTEXT.md` if the command surface changes.

### 16.3 Adding a project variable

1. Add the key to `.agents/project.yaml` (top-level if static, under `environments.<env>` if env-scoped).
2. Update `.agents/README.md` if the contract changes.
3. Run `bun run lint:agents` to confirm every reference still resolves.

### 16.4 Adding a Jira custom field

1. Add the slug to `.agents/jira-required.yaml` with expected type, options, and consumers.
2. Run `bun run jira:sync-fields` to populate the workspace catalog.
3. Run `bun run jira:check` to confirm the workspace satisfies the manifest.
4. Reference the field in skills/commands as `{{jira.<slug>}}` — never `customfield_XXXXX`.

### 16.5 Adding a new MCP

1. Configure the MCP server in `.mcp.json` (or `opencode.json` for OpenCode).
2. Add the resolution row to `CLAUDE.md` § Tool Resolution.
3. Document the MCP under `docs/setup/mcp/<mcp-name>.md`.
4. Update the integrations table in this document (Section 12) and in `CLAUDE.md` § MCPs Available.

### 16.6 Adopting Spec-Driven Development (SDD)

The SDD bloque (`sdd-*` skills) is installed via gentle-ai (`bun run setup`). Once installed:

1. Run `/sdd-init` to detect the stack and bootstrap the persistence backend (engram by default).
2. For any substantial change, use `/sdd-new <change-name>` to start the full lifecycle: explore → propose → spec → design → tasks → apply → verify → archive.
3. Each phase has its own model alias (see § per-phase model routing in Section 9). The orchestrator routes each subagent accordingly.

### 16.7 Future hooks (deferred patterns)

The skill architecture leaves room for future enhancements without rework. Documented but not yet implemented:

- **Cross-agent portability.** Each skill declares `compatibility: [claude-code, copilot, cursor, codex, opencode]`. A future CI step could spin up multiple runners to validate cross-agent reliability.
- **Team-shared engram.** A future cross-machine persistent memory layer (sync between developers, team-shared decisions) could plug into the existing topic-key convention.
- **Per-phase autonomous routing.** A future orchestrator could read each skill's `phase:` frontmatter and route to a different model automatically without the developer specifying.
- **Master roadmap.** A future pattern (Pattern 7, currently deferred) would produce a high-level `.context/master-implementation-plan.md` from the business maps and the SRS — see `docs/methodology/` for the deferral rationale.

These hooks are documented but not implemented. Reopen when there is concrete demand.

---

## 17. Summary of What the Practice Delivers

### What ships in this repository

- **A foundation skill (`agentic-dev-core`)** — bootstraps `CLAUDE.md`, `.agents/project.yaml`, the `scripts/agents-*.ts` CLIs, and the testing-capabilities cache. Hosts the canonical orchestration doctrine, briefing template, dispatch patterns, model-routing table, topic-key conventions, and skill-resolver protocol cited by every workflow skill.
- **A roster of phase-aware AI skills** — auto-triggered by user intent, orchestrated with human-in-the-loop checkpoints. Each tier of the lifecycle has its own skill. The current roster is enumerated in Section 12.
- **The SDD meta-skill bloque** — explore → propose → spec → design → tasks → apply → verify → archive for any substantial change.
- **A library of utility slash commands** — deterministic, single-purpose, invoked with `/<name>`. Current library enumerated in Section 12.
- **Live system integrations** — MCPs for the database (Supabase), library docs (context7), web search (tavily), workflow automation (n8n), persistent memory (engram); first-party CLIs for Jira (acli), GitHub (gh), deploys (vercel, supabase), browser automation (playwright).
- **A structured context layer** — project, module, and story-level knowledge, on disk and version-controlled. Contains product specs, design tokens, discovery docs, per-ticket memory, and team guidelines.
- **A portable design system (`DESIGN.md`)** — Apache-2.0 Google Labs spec at the project root. Consumed by `/project-bootstrap` and any AI agent reading the repo.
- **Project variable contract** — `.agents/project.yaml` + `.agents/jira-required.yaml` + auto-generated catalogs, validated by `bun run lint:agents` and `bun run jira:check`.
- **Persistent memory (engram + PBI folders)** — sessions resume from the exact point they ended. No context loss between days or developers.
- **A per-story dev loop** — Planning → Implementation → Code Review → Staging → (gated) Production. Drives Jira state transitions automatically. Production is always human-gated.
- **A CI / CD pipeline** — Vercel for deploys, GitHub Actions for lint/types/tests on PRs, Supabase migrations on merge to `staging`.
- **A pre-flight quality gate** — lint + types + tests + review + deploy. Failures stop the line; the developer decides retry / skip / abort.

### The core claim

A development practice that ships features faster, documents every decision, remembers everything across sessions, and never deploys to production without a human gate. Built on the premise that AI handles the mechanical work, and the engineer handles the decisions.

The rest is execution.

---

**Last Updated**: 2026-05-11

**See also**:

- `CLAUDE.md` — canonical project memory, Tool Resolution, orchestration mode, skill routing.
- `CONTEXT.md` — strategic reasoning behind the three-tier knowledge layer (repo root).
- `docs/methodology/IQL-methodology.md` — phased lifecycle deep-dive.
- `docs/architectures/supabase-nextjs/` — stack-specific configuration.
- `docs/workflows/` — environments, git-flow, OpenAPI sync, template updates.
- `INSTALLER.md` — what `bun run setup` configures: gentle-ai, community skills, MCPs, external CLIs, opt-out.
- `.claude/skills/agentic-dev-core/SKILL.md` — foundation skill internals (bootstrap + shared references).
- `.claude/skills/agentic-dev-core/references/orchestration-doctrine.md` — canonical orchestration doctrine cited by every workflow skill.
- `.claude/skills/project-foundation/SKILL.md` — Constitution + PRD + SRS + Discovery skill internals.
- `.claude/skills/design-system/SKILL.md` — DESIGN.md generation skill internals.
- `.claude/skills/project-bootstrap/SKILL.md` — Infrastructure scaffolding skill internals.
- `.claude/skills/product-management/SKILL.md` — Backlog + refinement skill internals.
- `.claude/skills/sprint-dev/SKILL.md` — Per-story dev loop skill internals.
- `.claude/skills/unit-testing/SKILL.md` — TDD slice skill internals.
- `.claude/skills/git-flow-master/SKILL.md` — Git operator skill internals.
- `.context/README.md` — canonical context layout.
- `.agents/README.md` — project variable contract and validation scripts.
- Sister repo: [`agentic-qa-boilerplate`](https://github.com/upex-galaxy/agentic-qa-boilerplate) — the QA half of the practice.
