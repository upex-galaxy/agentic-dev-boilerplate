---
name: project-foundation
description: 'Orchestrates the foundational definition of a new product/project: Constitution (business model + market context), Architecture (PRD + SRS + API contracts), and Discovery (business data map + API architecture + dev guide). Triggers on: `ideando un nuevo producto`, `define el PRD`, `construir la constitución del proyecto`, `mapear arquitectura del sistema`, `definir SRS`, `user personas`, `user journeys`, `MVP scope`, `business data map`, `api architecture discovery`, `project dev guide`, `constituir el proyecto desde cero`. Do NOT use for: infrastructure scaffolding (use `/project-bootstrap`), backlog seeding (use `/product-management`), per-story development (use `/sprint-dev`), unit testing (use `/unit-testing`), or QA workflows (out of scope, see `agentic-qa-boilerplate`).'
license: MIT
compatibility: [claude-code, copilot, cursor, codex, opencode]
phase: foundation
---

# Project Foundation — Product definition orchestrator

`project-foundation` orchestrates the one-time, up-front definition of a product: **why** we are building it (Constitution), **what** we are building (Architecture: PRD + SRS), and **how the system maps to its world** (Discovery). It produces the documents every later skill assumes already exist.

It is invoked once per project at inception, before any infrastructure scaffolding (`/project-bootstrap`) or backlog seeding (`/product-management`). Re-invoke individual phases if scope changes substantially mid-project.

---

## Dependencies

Requires `init-project`. Loads on demand:

- `init-project/references/briefing-template.md` — used when dispatching subagents to research market data, audit competitors, or interview users.
- `init-project/references/dispatch-patterns.md` — picks Single / Sequential / Parallel for each phase below.

---

## When to use

Use this skill when:

- A new product/project is being defined from scratch and you need Constitution + PRD + SRS + Discovery artifacts.
- An existing project needs to redefine scope significantly (e.g. pivot, new MVP cut) and the foundation docs must be regenerated.
- A specific section is missing or stale (e.g. user journeys haven't been written yet) — invoke just that phase via the Specific tasks table below.

Do NOT use this skill to:

- Scaffold the codebase (backend / frontend / OpenAPI / auth) — that's `/project-bootstrap`.
- Seed the Jira backlog with epics + stories — that's `/product-management`.
- Plan or implement an individual user story — that's `/sprint-dev`.
- Set up unit tests — that's `/unit-testing`.
- Run QA workflows (test plans, exploratory testing, automation) — out of scope, see the sister `agentic-qa-boilerplate`.

---

## Phase walkthrough

The skill covers three sequential phases. Each phase has multiple sub-deliverables; read only the references your current task needs.

### 1. Constitution (Why we're building this)

The constitution captures the rationale for the product before any scope decisions are made: the problem worth solving, who it serves, how it monetizes, and the competitive context it lives in. Without this, the PRD has no anchor.

- Read `references/constitution-business-model.md` for the canvas template (problem, solution, value prop, customer segments, channels, revenue model, cost structure, key metrics).
- Read `references/constitution-market-context.md` for industry positioning, competitive analysis, and trends.

Output: `.context/idea/business-model.md` and `.context/idea/market-context.md` (or wherever your project keeps strategic context).

### 2. Architecture: PRD (Product Requirements Document)

The PRD turns the constitution into a buildable product spec. It defines the problem statement formally, names the target users, slices the MVP, and traces the user journeys end-to-end.

- Read `references/prd-executive-summary.md` for problem statement, solution overview, success KPIs, MVP success metrics.
- Read `references/prd-personas.md` for target users, demographics, jobs-to-be-done, pain points.
- Read `references/prd-mvp-scope.md` for epic breakdown, must-have / should-have / could-have user stories, MVP cut.
- Read `references/prd-user-journeys.md` for happy paths, alternate flows, and edge cases per persona.

Output: `.context/PRD/*.md` files (one per sub-deliverable, or a consolidated `prd.md`).

### 3. Architecture: SRS (Software Requirements Specification)

The SRS turns the PRD into a technical contract: formal functional requirements, non-functional constraints, system architecture decisions, and the API contract. This is the input `/project-bootstrap` consumes to scaffold the codebase.

- Read `references/srs-functional.md` for formal functional requirements (one section per epic, traceable to PRD user stories).
- Read `references/srs-non-functional.md` for performance, security, scalability, reliability, accessibility NFRs.
- Read `references/srs-architecture.md` for system architecture diagram, tech stack rationale, data model, deployment topology.
- Read `references/srs-api-contracts.md` for OpenAPI endpoint definitions per domain.

Output: `.context/SRS/*.md` files.

### 4. Discovery (Codify the system mental model)

Discovery produces the running-mental-model docs every later skill loads at session start: the entity map, the API map, and a conversational dev guide. These three docs are what makes a fresh AI session productive on day one.

- Read `references/business-data-map.md` to map entities, relationships, and business flows visually.
- Read `references/api-architecture.md` to discover (existing system) or design (new system) the endpoint catalog with auth classification and testing examples.
- Read `references/project-dev-guide.md` to produce a conversational guide that answers "how do I build feature X here?".

Output: `.context/business-data-map.md`, `.context/api-architecture.md`, `.context/project-dev-guide.md`.

---

## Specific tasks — which reference to read

| User intent                                                  | Read                                        |
| ------------------------------------------------------------ | ------------------------------------------- |
| "constitución del proyecto" / "business model canvas"        | `references/constitution-business-model.md` |
| "análisis de mercado" / "market context" / "competitivo"     | `references/constitution-market-context.md` |
| "executive summary del PRD" / "problem statement" / "KPIs"   | `references/prd-executive-summary.md`       |
| "user personas" / "perfiles de usuario" / "target users"     | `references/prd-personas.md`                |
| "MVP scope" / "epic breakdown" / "must-have stories"         | `references/prd-mvp-scope.md`               |
| "user journeys" / "happy path" / "edge cases" / "flujos"     | `references/prd-user-journeys.md`           |
| "functional requirements" / "SRS funcional" / "FR formales"  | `references/srs-functional.md`              |
| "NFR" / "performance/security/scalability" / "no funcional"  | `references/srs-non-functional.md`          |
| "system architecture" / "tech stack" / "diagrama de sistema" | `references/srs-architecture.md`            |
| "API contracts" / "OpenAPI" / "endpoints definition"         | `references/srs-api-contracts.md`           |
| "business data map" / "entity model" / "mapa de negocio"     | `references/business-data-map.md`           |
| "API architecture discovery" / "endpoint catalog"            | `references/api-architecture.md`            |
| "project dev guide" / "guía de desarrollo" / "onboarding"    | `references/project-dev-guide.md`           |

If the user intent does not match a row exactly, identify the closest phase (Constitution / PRD / SRS / Discovery) and fall back to the most relevant reference, surfacing in the report that no exact match was found.

---

## Subagent dispatch

Phases 1 → 2 → 3 → 4 are **logically sequential** (each phase consumes output from the previous), but sub-deliverables WITHIN a phase are often independent and parallel-friendly:

- **Phase 2 (PRD)**: `prd-personas`, `prd-user-journeys`, `prd-mvp-scope` can run in parallel after `prd-executive-summary` is drafted.
- **Phase 3 (SRS)**: `srs-functional`, `srs-non-functional`, `srs-architecture`, `srs-api-contracts` can run in parallel once the PRD is locked.
- **Phase 4 (Discovery)**: all three discovery docs are independent and run in parallel against the same source code / SRS.

Use the parallel dispatch pattern from `init-project/references/dispatch-patterns.md`. Each subagent briefing must follow the 6-component template in `init-project/references/briefing-template.md` and cite the specific reference file the subagent must read.

For research-heavy tasks (market sizing, competitor audits, persona interviews) dispatch a single subagent with web/search tools rather than running the research from the main conversation.

---

## Hand-offs

When the foundation is solid, the natural next steps are:

- **Infrastructure scaffolding** → `/project-bootstrap`. Turns the SRS architecture + API contracts into a working backend + frontend skeleton.
- **Seed the product backlog** → `/product-management`. Turns the PRD MVP scope into Jira epics, user stories, and refined acceptance criteria.
- **(Eventually) implement stories** → `/sprint-dev`. The per-story planning → code → review → deploy loop, only after `/project-bootstrap` is done.

Foundation output is **not** code — it is documentation. The output is "ready for `/project-bootstrap`", not "ready for production".

---

## Verification

After running any phase, confirm:

- The deliverables for that phase exist at the expected paths under `.context/`.
- Each document follows the structure specified in the corresponding reference file (sections, headings, tables).
- Cross-references are wired: PRD personas appear in user journeys; SRS functional requirements trace to PRD epics; API contracts trace to SRS architecture decisions.
- `bun run lint:agents` does not surface new unresolved `{{VAR}}` references introduced by the new docs.

If a section is left as `[PLACEHOLDER]` because the user could not yet answer (e.g. no real user-research data exists), surface it in the report as an open TODO rather than inventing content.

---

## Notes

- This skill is **one-time per project**. If scope changes significantly mid-project, re-invoke specific phases (e.g. only `references/prd-mvp-scope.md` to re-cut the MVP).
- Several reference files are written in Spanish (preserved from the original prompts). The skill orchestrator (this file) is in English; subagents should mirror the user's language when reporting results.
- This skill consumes `{{PROJECT_NAME}}`, `{{PROJECT_KEY}}`, `{{WEBAPP_DOMAIN}}` from `.agents/project.yaml`. If those are unset, run `/init-project` first.
- The discovery references (`business-data-map.md`, `api-architecture.md`, `project-dev-guide.md`) are intentionally agnostic of stack and can run on either greenfield projects (where they ENCODE decisions) or brownfield projects (where they REVERSE-ENGINEER existing code).
