# Skill Composition Strategy

> **Purpose**: Contract for how this repo's AI orchestrator composes project-owned skills with external skills (gentle-ai SDD bundle, community skills) without duplication, conflicts, or false negatives.
>
> **Home**: `.claude/skills/agentic-dev-core/references/skill-composition-strategy.md` — meta-doctrine consumed by all T1 skills, sibling to `briefing-template.md`, `dispatch-patterns.md`, `orchestration-doctrine.md`, `skill-resolver.md`.
>
> **Status**: v1.2 — fully wired. CLAUDE.md, sprint-development, and all 9 other T1 skills have `complementary_categories` frontmatter + `## Composable Skills` workflow step (sprint-development integrates the equivalent under `## SDD Composition`). Pass 2 complete; project-bootstrap dry-run PASS.
>
> **Companion files**:
> - `CLAUDE.md` (project memory — top-level rules and skill mentions)
> - `.claude/skills/*/SKILL.md` (per-skill instructions; reference this doc relatively as `agentic-dev-core/references/skill-composition-strategy.md`)
> - `cli/install.ts` (installer — declares project-level vs user-level skill installs)
> - `.claude/skills/agentic-dev-core/references/{briefing-template,dispatch-patterns,orchestration-doctrine,skill-resolver}.md` (sibling meta-doctrine references)
>
> **Last updated**: 2026-05-11

---

## 1. Problem Statement

The repo ships with **10 project-owned workflow skills** (`.claude/skills/`). The installer (`cli/install.ts`) also installs:

- **15 gentle-ai skills** (user-level): SDD bundle (`sdd-init`, `sdd-explore`, `sdd-propose`, `sdd-spec`, `sdd-design`, `sdd-tasks`, `sdd-apply`, `sdd-verify`, `sdd-archive`, `sdd-onboard`) + 5 extras (`skill-registry`, `judgment-day`, `cognitive-doc-design`, `comment-writer`, `issue-creation`).
- **16 community skills (project-level)**: `next-best-practices`, `next-cache-components`, `next-upgrade`, `react-best-practices`, `composition-patterns`, `deploy-to-vercel`, `tailwind-css-patterns`, `shadcn`, `react-hook-form`, `zod`, `typescript-advanced-types`, `supabase-postgres-best-practices`, `bun`, `accessibility`, `seo`, `frontend-design`.
- **9 community skills (user-level / global)**: `skill-creator`, `find-skills`, `gh-cli`, `github-actions-docs`, `playwright-cli`, `n8n-skills`, `emil-design-eng`, `ui-ux-pro-max`, `brainstorming`.

Current state (CLAUDE.md): **all 4 tiers named explicitly**. Auto-discovery: zero mechanism. Cross-skill composition: only project-owned sister calls (`sprint-development` → `unit-testing`, `git-flow-master`).

Gaps:

1. Community user-level skills get deprecated / replaced / renamed by their authors. Naming them in CLAUDE.md is fragile.
2. Sprint-development and SDD overlap heavily on planning + implementation + verification, but have hard conflicts (Jira, deploy, backend artifact storage).
3. No formal contract for when a project-owned skill should "borrow" capabilities from a sister skill (project-level community or user-level community).
4. SDD bundle is project-dependency level (installed by `install.ts`) but treated as foreign code.

---

## 2. Skill Tier Model

Four tiers. Different discovery and load rules per tier.

| Tier | Location | Examples | Discovery | Load behavior |
|--|--|--|--|--|
| **T1 — Project-owned** | `.claude/skills/` (committed) | `sprint-development`, `design-system`, `git-flow-master`, `product-management`, `project-foundation`, `project-bootstrap`, `agentic-dev-core`, `agentic-dev-onboard`, `acli`, `unit-testing` | Named in CLAUDE.md "Workflow Skills" table | Silent (load on trigger, no ask) |
| **T2 — Project dependency (gentle-ai)** | `~/.claude/skills/sdd-*`, `judgment-day`, etc | All 15 gentle-ai skills | Named in CLAUDE.md (one section, with phase mapping) | Silent **inside** project-owned orchestrators (sprint-dev can call sdd-apply without asking) |
| **T3 — Community project-level** | `~/.claude/skills/` (installed by `install.ts:135-152`) | `next-best-practices`, `shadcn`, `tailwind-css-patterns`, `zod`, `supabase-postgres-best-practices`, etc | Named **by category** in CLAUDE.md (not by skill name). Discovered at runtime from system-reminder skill list | Silent if matched by category (e.g. user works on Next.js page → load `next-best-practices`) |
| **T4 — Community user-level** | `~/.claude/skills/` (installed by `install.ts:155-165`) | `playwright-cli`, `ui-ux-pro-max`, `emil-design-eng`, `gh-cli`, `github-actions-docs`, `brainstorming`, `n8n-skills`, `skill-creator`, `find-skills` | **NOT named in CLAUDE.md**. Discovered at runtime from system-reminder skill list. Auto-match by task domain | **ASK user before load** (may not be installed, or user may not want it for this task) |

### Tier decision rule

```
IF skill is committed in .claude/skills/   → T1
ELIF skill is in install.ts SKILL_SLUGS    → T2
ELIF skill is in install.ts PROJECT_LEVEL_SKILLS → T3
ELIF skill is in install.ts USER_LEVEL_SKILLS    → T4
ELSE → T4 (unknown community)
```

---

## 3. Skill Composition Protocol

### 3.1 Pre-flight (every task)

Before starting any non-trivial task, the orchestrator (and each invoked skill) MUST:

1. **Scan available skills** — read the `system-reminder` skill list that ships at session start.
2. **Match by domain category** (see vocabulary §5) — not by literal skill name.
3. **Resolve tier per match**:
   - T1 / T2 / T3 → load silently when task domain matches.
   - T4 → ask user one short question before loading: `"Detected X skill (T4). Apply it? Y/N"`.
4. **Cache the load decisions** for the session — do not re-ask the same skill twice.

### 3.2 Threshold rule (silent vs ask)

| Tier | Silent load condition | Ask condition |
|--|--|--|
| T1 | always | never |
| T2 | inside a project-owned orchestrator (sprint-dev, product-management, etc) | when invoked standalone by user outside a host orchestrator |
| T3 | task domain matches category | task domain only weakly matches |
| T4 | never silent | always ask before load |

### 3.3 Sub-agent skill propagation

When the orchestrator delegates to a sub-agent via the `Agent` tool, the sub-agent receives **its own** `system-reminder` skill list. The orchestrator cannot directly pass "use these skills". To bridge this:

- Orchestrator MUST inject a `## Composable Skills` block into the sub-agent prompt naming the resolved skills (e.g. `"For this task, consider invoking: sdd-apply, unit-testing. TDD mode: strict. Delivery strategy: ask-on-risk."`).
- Sub-agent reads its own skill list, finds those names, loads them.
- If the sub-agent does NOT find a skill it was told to use → it falls back to the skill not found path (typically: do the work inline + flag the missing capability in the result envelope).

### 3.4 Skill not found path

When a referenced skill is not in the available list (deprecated, uninstalled, version mismatch):

1. Continue with project-owned alternative if exists.
2. If no alternative, do the work inline with degraded capability.
3. Flag in result envelope: `skill_resolution: "fallback-inline" + missing: [list]`.
4. Suggest reinstall via `bun run setup` or `npx skills add <name>` in the user-facing summary.

---

## 4. Sprint-Development ↔ SDD Integration Contract

This is the most-overlapping pair. Both want to own "build a feature". The contract below resolves all 7 hard conflicts identified in the comparison matrix.

### 4.1 Ownership map

| Concern | Owner | Why |
|--|--|--|
| Jira lifecycle (Ready For Dev → In Progress → In Review → Ready For QA) | sprint-dev | SDD has zero Jira knowledge |
| Jira custom field writes (implementation plan, links) | sprint-dev | SDD agnostic |
| ATP (Acceptance Test Plan) source-of-truth | sprint-dev | Jira comments → custom field → local fallback |
| Branching strategy + branch naming with Jira keys | sprint-dev (delegates to `git-flow-master`) | SDD has no VCS concept |
| PR creation + PR title format | sprint-dev (via `git-flow-master`) | same |
| Spec / design / tasks **artifacts** | sdd-* (when invoked) | SDD is the authoring engine |
| Apply-progress merge across batches | sdd-apply | resumable batching is SDD's contract |
| Strict TDD enforcement | sdd-init (resolves) + sdd-apply (enforces) | TDD policy is project-wide, set once by sdd-init |
| Delivery strategy (single / chained / exception) | sdd-tasks (forecast) + orchestrator (decision) | SDD owns the gate; orchestrator owns user-facing question |
| Behavioral compliance matrix (test execution proof) | sdd-verify | sprint-dev only does static AC checklist |
| Adversarial review | judgment-day (when requested) | parallel blind judges, neither sprint-dev nor SDD owns this |
| Staging deploy + QA handoff | sprint-dev | SDD has no deploy |
| Production deploy + rollback | sprint-dev | SDD has no deploy |
| Spec sync to main specs + archive | sdd-archive | sprint-dev has no spec concept |

### 4.2 Conflict resolutions (the 7 hard conflicts)

| # | Conflict | Resolution |
|--|--|--|
| 1 | Jira lifecycle ownership | Sprint-dev owns transitions. SDD called only as sub-step. Orchestrator never asks SDD about Jira state. |
| 2 | ATP (Jira) vs Capabilities (SDD proposal) | One source per change. **Default: ATP from Jira.** If the change is large enough to invoke SDD planning, sprint-dev derives a proposal Capabilities section FROM the Jira ATP — they must stay in sync. |
| 3 | Workload forecast: sprint-dev emits, SDD blocks | Sprint-dev Stage 1 invokes `sdd-tasks` (when complex). Orchestrator resolves delivery strategy from forecast BEFORE entering Stage 2. Decision is passed in the `sdd-apply` prompt. |
| 4 | Strict TDD mode | Orchestrator pre-flight: `mem_search("sdd-init/{project}")` → if not found, run `sdd-init` silently. Cache `strict_tdd: true/false` for session. Inject into every `sdd-apply` and `sdd-verify` prompt. Sprint-dev Stage 2 respects TDD mode by routing implementation to `sdd-apply` (which loads the strict-tdd module). |
| 5 | Artifact backend | Per-change decision, made at Stage 1 entry. **Default: hybrid** — sprint-dev keeps `.context/PBI/{ticket}/` files for Jira-linked artifacts (impl-plan.md, review.md, compliance-matrix.md) AND engram topic keys `sdd/{change-name}/*` for SDD artifacts (spec, design, tasks, apply-progress, verify-report, archive-report). The two do not overlap; they describe the same change from different angles. |
| 6 | Spec Compliance Matrix structure | Sprint-dev keeps its AC-mapped matrix (lines 219-233) as the **gating** matrix for PR merge. `sdd-verify` runs as an **additional** behavioral test that produces a richer matrix — but is non-gating by default. User can promote sdd-verify to gating via project config. |
| 7 | Test execution environment | Both sprint-dev Stage 2 verification and `sdd-verify` MUST read test command from a single source: `.agents/project.yaml` → `testing.commands` (or equivalent). Same command, same env, idempotent results. |

### 4.3 Clean delegation points (5)

When sprint-dev delegates to SDD, exact data contract:

| Sprint-dev phase | Delegate to | Trigger condition | Data IN (from sprint-dev) | Data OUT (to sprint-dev) |
|--|--|--|--|--|
| Stage 1 — Planning (architecture) | `sdd-design` | Complex/multi-file/new module/>400 lines forecast | proposal (derived from Jira AC), affected paths, project context | `design.md` (architecture decisions, data flow, file changes, testing strategy) |
| Stage 1 — Planning (workload guard) | `sdd-tasks` | Always when sdd-design was invoked | `design.md` | `tasks.md` with Review Workload Forecast + decision flag |
| Stage 2 — Implementation | `sdd-apply` | Strict TDD active OR workload=chained/exception OR sdd-design+sdd-tasks exist | `design.md`, `tasks.md`, TDD mode, delivery strategy | `apply-progress` (merged across batches) |
| Stage 3 — Code Review (behavioral) | `sdd-verify` | Always when sdd-apply was invoked. Optional standalone for AC-only changes. | `spec.md` (or AC scenarios), `apply-progress` | verdict PASS / PASS WITH WARNINGS / FAIL + compliance matrix |
| Post-merge | `sdd-archive` | Always when SDD specs were authored | delta specs | main specs merged + archive folder with date |

**Never delegate to SDD**:

- Jira transitions
- PR open / merge
- Staging or prod deploy
- Rollback
- QA handoff
- Branch ops

### 4.4 Two implementation paths

#### Path A — Story-driven simple

Used when: Jira ticket, scope conventional, AC clear, ≤400 lines forecast, no architectural decisions needed.

```
sprint-dev Stage 1 (impl-plan from Jira AC)
sprint-dev Stage 2 (inline implementation, optional /unit-testing hand-off)
sprint-dev Stage 3 (PR + AC compliance matrix)
sprint-dev Stage 4 (staging deploy + QA handoff)
sprint-dev Stage 5 (prod deploy, gated)
```

No SDD calls. No `sdd-init` requirement.

#### Path B — Story-driven complex

Used when: Jira ticket + (multi-file OR new architecture OR >400 lines forecast OR Strict TDD enforced OR user opts in).

```
PRE-FLIGHT (orchestrator):
  - mem_search("sdd-init/{project}")
  - If absent → run sdd-init silently
  - Cache: strict_tdd, test_command, delivery_strategy_default, artifact_backend

sprint-dev Stage 1 (entry, Jira transition Ready For Dev → In Progress)
  → sdd-design (architecture)
  → sdd-tasks (workload forecast + decision)
  ← orchestrator resolves delivery_strategy

sprint-dev Stage 2 (orchestrator, Jira stays In Progress)
  → sdd-apply (batched, TDD-enforced, merge-aware)

sprint-dev Stage 3 (PR open via git-flow-master, Jira → In Review)
  → AC compliance matrix (sprint-dev, gating)
  → sdd-verify (behavioral proof, non-gating by default)
  → judgment-day (optional, adversarial)

sprint-dev Stage 4 (merge to staging, deploy, Jira → Ready For QA, QA handoff)

sprint-dev Stage 5 (prod deploy, gated by QA green + business approval)

POST-MERGE (orchestrator):
  → sdd-archive (spec sync, audit trail)
```

---

## 5. Category Vocabulary (for community skill auto-match)

Project-owned and project-dependency skills are named explicitly. Community skills (T3, T4) are matched by **category**, not by name. Each project-owned skill declares which categories it can borrow from.

### 5.1 Category list (v1)

| Category | Examples of skills that fit (T3/T4) | Used by (T1) |
|--|--|--|
| `frontend-ui` | `frontend-design`, `ui-ux-pro-max`, `emil-design-eng`, `shadcn`, `tailwind-css-patterns` | `design-system`, `project-bootstrap` (frontend phase), `sprint-development` (UI work) |
| `frontend-framework` | `next-best-practices`, `next-cache-components`, `next-upgrade`, `react-best-practices`, `composition-patterns` | `project-bootstrap`, `sprint-development` |
| `forms-validation` | `react-hook-form`, `zod` | `sprint-development` (form work) |
| `backend-db` | `supabase-postgres-best-practices` | `project-bootstrap` (backend phase), `sprint-development` (DB work) |
| `runtime` | `bun` | `project-bootstrap`, `sprint-development` |
| `language` | `typescript-advanced-types` | `sprint-development`, `unit-testing` |
| `accessibility` | `accessibility`, `accessibility-review` | `design-system`, `sprint-development` (UI work) |
| `seo` | `seo`, `nextjs-seo` | `sprint-development` (public-page work) |
| `deploy` | `deploy-to-vercel` | `sprint-development` Stage 4/5 |
| `testing-e2e` | `playwright-cli`, `playwright-best-practices` | `sprint-development` Stage 3 (when E2E in scope) |
| `vcs` | `gh-cli` | `git-flow-master`, `sprint-development` |
| `ci-cd` | `github-actions-docs` | `project-bootstrap` (CI phase), `sprint-development` |
| `issue-tracker` | (acli is T1) | `sprint-development`, `product-management` |
| `creativity` | `brainstorming` | `project-foundation`, `product-management` |
| `meta-skill` | `skill-creator`, `find-skills` | only on user request (find-skills auto-invoked per §8.2 as last-resort) |
| `automation` | `n8n-skills` | only on user request |
| `doc-generation` | `cognitive-doc-design` (T2) | `agentic-dev-core`, `sync-ai-memory` |
| `prose-polishing` | `comment-writer` (T2) | `sprint-development` (Stage 3), `git-flow-master` |
| `adversarial-review` | `judgment-day` (T2) | `sprint-development` (Stage 3, default per §8.3) |

### 5.2 Matching rule

Each T1 SKILL.md declares its category list in frontmatter:

```yaml
---
name: sprint-development
complementary_categories:
  - frontend-ui
  - frontend-framework
  - forms-validation
  - backend-db
  - testing-e2e
  - accessibility
  - vcs
---
```

At runtime, the skill (or orchestrator) scans the available skill list, matches each available skill against its category, and applies the threshold rule from §3.2.

### 5.3 Why categories not names

- Community skills get renamed, deprecated, replaced. Naming creates dead refs.
- Different users have different installs. Category match degrades gracefully (skill missing → no false negative, just no extra capability).
- Project-owned skills stay portable across community ecosystems.

---

## 6. Glue Layer Responsibilities

The orchestrator (top-level conversation) owns the glue layer. Cannot be inside a single skill because it spans multiple skills.

### 6.1 Per-session bootstrap (once)

1. Detect change complexity bucket on every entry (story-simple vs story-complex).
2. If complex → run `sdd-init` once per project (cached via `mem_search("sdd-init/{project}")`).
3. Cache for session: `strict_tdd`, `test_command`, `delivery_strategy_default`, `artifact_backend`, `complementary_skill_resolutions`.

### 6.2 Per-delegation injection

Every sub-agent / skill prompt MUST include:

```
## Composable Skills (auto-resolved)
- T1/T2 to load silently: [list]
- T3 to load by category: [list]
- T4 detected but NOT loaded (ask user first): [list]

## Project Standards
- TDD mode: {strict|standard|off}
- Test command: {from project.yaml}
- Delivery strategy: {single-pr|chained|exception}
- Artifact backend: {file|engram|hybrid}
```

### 6.3 Decision points the glue layer owns

| Decision | When | How |
|--|--|--|
| Path A vs Path B | Stage 1 entry | Heuristic: forecast lines, file count, architectural impact. Falls back to user question. |
| Backend per change | First SDD invocation | Default hybrid. Override by user. |
| Delivery strategy | sdd-tasks forecast | Default `ask-on-risk`. Cached per session. |
| Gating matrix | Stage 3 | Sprint-dev AC matrix always gates. sdd-verify gates only if project config opts in. |
| Skill load (T4) | First match per session | Ask user once per skill per session. Cache decision. |

---

## 7. What Lives Where

| Rule | CLAUDE.md | SKILL.md (per-skill) | This doc (`skill-composition-strategy.md`) |
|--|--|--|--|
| Skill tier model | Brief mention + link here | — | Authoritative |
| Skill Composition Protocol | Summary + link | Per-skill `complementary_categories` frontmatter + load behavior | Authoritative full protocol |
| Category vocabulary | — | — | Authoritative |
| Sprint-dev ↔ SDD contract | Brief mention + link | Each affected skill (sprint-dev, agentic-dev-onboard) gets a pointer | Authoritative |
| Glue layer responsibilities | Brief mention + link | — | Authoritative |
| T1 skill names | Workflow Skills table (named) | — | Reference only |
| T2 skill names (gentle-ai/SDD) | New "Project dependencies (gentle-ai)" subsection (named, with phase mapping) | sprint-dev SKILL.md references SDD skills by name in delegation points | Reference only |
| T3 skill names (community project-level) | "Reusable Community Skills (project-level)" — keep mention but remove the literal name list; replace with category description + reference to install.ts as source of truth | — | Reference only |
| T4 skill names (community user-level) | **REMOVE from CLAUDE.md.** Replace with "Auto-discovered at runtime per `skill-composition-strategy.md`" pointer | — | Reference only — name list only in installer |

---

## 8. Resolved Decisions

1. **Skill registry tooling**: ✅ **Adopted as canonical discovery mechanism.** Gentle-ai's `skill-registry` (installed via `install.ts:107-123`) is the authoritative scanner. Project-owned skills and orchestrator call it instead of ad-hoc scanning of the system-reminder list. Fallback to system-reminder scan only if `skill-registry` is unavailable.

2. **find-skills meta-skill**: ✅ **Automatic, but only as last resort.** Invocation order:
   1. Scan T1 + T2 (always available).
   2. Scan T3 + T4 already installed (via `skill-registry`).
   3. If a task domain has no match in steps 1-2 AND the task would benefit significantly from a specialized skill → invoke `find-skills` automatically to suggest installable skills. Ask user before installing.
   - **Do NOT confuse with `npx autoskills`**: that is a one-shot bootstrap step run during `/project-bootstrap` (after `/project-foundation`) to install stack-matched skills. `find-skills` is per-task runtime discovery.

3. **judgment-day adoption**: ✅ **Default Stage 3 reviewer for `sprint-development`** when no conflicts. Always invokable explicitly via `/judgment-day`. Sprint-dev Stage 3 routing:
   - Default: AC compliance matrix (sprint-dev) → `sdd-verify` (if SDD specs exist) → `judgment-day` (parallel adversarial).
   - Override: user can skip `judgment-day` per PR via prompt flag.

4. **Gentle-ai non-SDD skills**: ✅ **Selective hookup.**
   - `cognitive-doc-design`: hooked as T2 composable callee in `agentic-dev-core` (foundation doc generation) and `sync-ai-memory` (doc structure refinement). Category: `doc-generation`.
   - `comment-writer`: hooked as T2 composable callee in `sprint-development` Stage 3 (PR comments) and `git-flow-master` (commit message refinement). Category: `prose-polishing`.
   - `issue-creation`: ❌ **Discarded.** Conflict with the repo's Jira-first flow. The repo creates issues via `product-management` + `acli` (Jira), not GitHub. Adopting `issue-creation` (GitHub-centric) would split the issue-tracker layer.

5. **Category vocabulary maintainer**: ✅ **`/sync-ai-memory` auto-maintains §5.1.** On invocation, sync-ai-memory scans T1 SKILL.md frontmatter + installed T3/T4 skills (via `skill-registry`), detects category gaps, writes additions to §5.1 of this doc. No human approval required (categories are additive, not destructive). Removal of unused categories: deferred to manual review.

6. **Sub-agent skill list inspection**: ✅ **Contract drafted in §3.4 is authoritative.** Sub-agents that cannot find a named skill in their own list MUST emit `skill_resolution: "fallback-inline" + missing: [list]` in their result envelope. Orchestrator on receiving fallback re-resolves and may retry with explicit injection.

7. **Per-skill frontmatter migration**: ✅ **Required for every T1 SKILL.md.** Backward-compat default: skills without `complementary_categories` get an empty list (no community matching). Migration is part of §9 checklist.

---

## 9. Implementation Checklist

- [x] Patch `CLAUDE.md`:
  - [x] Add "Skill Composition Protocol" section (summary + link to this doc)
  - [x] Add "Project Dependencies (gentle-ai)" subsection naming the 15 SDD/gentle-ai skills with brief phase mapping to sprint-dev
  - [x] Modify "Reusable Community Skills" subsection: keep section, remove explicit T3 name list, replace with category description + pointer to `install.ts`
  - [x] **Remove** the T4 (user-level) name list. Replaced with auto-discovery pointer.
  - [x] Mark Future Hooks #2 (skill registry) as resolved.
- [x] Patch `.claude/skills/sprint-development/SKILL.md`:
  - [x] Add frontmatter `complementary_categories` (11 categories)
  - [x] Add "SDD Composition (Path A vs Path B)" section covering pre-flight glue, path selection, 5 delegation points, never-delegate list, composable callees
  - [x] Stage 1 / 2 / 3 / 4 inline notes for Path B
  - [x] Hand-offs section restructured (T1 / T2 / category matches / out-of-scope)
  - [x] Pre-flight checklist expanded with SDD glue items + Path B markers
- [x] Patch each other T1 SKILL.md (`design-system`, `git-flow-master`, `product-management`, `project-bootstrap`, `project-foundation`, `unit-testing`, `agentic-dev-core`, `agentic-dev-onboard`, `acli`):
  - [x] Add frontmatter `complementary_categories`
  - [x] Add "Composable Skills" step early in the workflow (scan + match + tier classify + threshold + sub-agent inject)
- [x] Verify `cli/install.ts` lists stay authoritative for T3/T4 names (true; no changes needed).
- [x] Dry-run test on `project-bootstrap`: PASS verdict (read-only sub-agent simulation; no scaffolding artifacts created).
- [x] Validation script `bun run lint:skills` — scans `.claude/skills/*/SKILL.md` frontmatter, install.ts tier arrays, and strategy doc §5.1; checks orphan categories, stale skill mentions, tier mismatches, missing Composable Skills sections, single-skill fragility, stale `.context/` paths, duplicate-tier conflicts. Source: `scripts/lint-skills.ts`. Wired in `package.json`. Caught the T3/T4 mismatch bug in project-bootstrap before final review.
- [ ] (Optional, deferred) Wire `/sync-ai-memory` to auto-maintain §5.1 (per §8.5 resolution).
- [ ] (Optional, deferred) Address fragility: categories `runtime` and `language` each map to a single skill in §5.1 — add additional fallback skills, or accept fragility.

---

## 10. Non-Goals

This doc does NOT:

- Replace any skill's internal workflow. Each skill stays in charge of its own steps.
- Rewrite SDD. The gentle-ai bundle is treated as a stable upstream dependency.
- Merge sprint-development and SDD into one mega-skill. They stay separate; the orchestrator composes them.
- Define the QA-side composition. QA workflows live in the sister repo `agentic-qa-boilerplate` and follow their own composition strategy.
- Specify exact prompt text for the `## Composable Skills` injection block. That belongs in the orchestrator template, drafted later.
