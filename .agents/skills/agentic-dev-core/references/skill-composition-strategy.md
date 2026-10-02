# Skill Composition Strategy

> **Purpose**: Contract for how this repo's AI orchestrator composes project-owned skills with community skills (project-level and user-level) without duplication, conflicts, or false negatives.
>
> **Home**: `.agents/skills/agentic-dev-core/references/skill-composition-strategy.md` — meta-doctrine consumed by all T1 skills, sibling to `briefing-template.md`, `dispatch-patterns.md`, `orchestration-doctrine.md`, `skill-resolver.md`.
>
> **Status**: v2.0 — T2 (gentle-ai 15-skill bundle) removed. Installer (`cli/install.ts`) now invokes `gentle-ai install --preset minimal`, which installs only Engram (persistent memory). The SDD bundle, judgment-day, cognitive-doc-design, comment-writer, issue-creation, and skill-registry are no longer installed. Document collapses from 4 tiers to 3 (T1 + T3 + T4) and drops the Sprint-Dev ↔ SDD integration contract that v1.x maintained.
>
> **Companion files**:
>
> - `AGENTS.md` (project memory — top-level rules and skill mentions)
> - `.agents/skills/*/SKILL.md` (per-skill instructions; reference this doc relatively as `agentic-dev-core/references/skill-composition-strategy.md`)
> - `cli/install.ts` (installer — declares project-level vs user-level skill installs)
> - `.agents/skills/agentic-dev-core/references/{briefing-template,dispatch-patterns,orchestration-doctrine,skill-resolver}.md` (sibling meta-doctrine references)

---

## 1. Problem Statement

The repo ships the project-owned skills `.agents/skills/REGISTRY.md` lists (`.agents/skills/`). The installer (`cli/install.ts`) also installs:

- **Community skills (project-level)**: the `PROJECT_LEVEL_SKILLS` array in `cli/install.ts`: the stack skills, plus the builder skills a T1 workflow depends on (`skill-creator`, the builder of every skill this repo scaffolds, `skill-scaffold.md`).
- **Community skills (user-level / global)**: the `USER_LEVEL_SKILLS` array in `cli/install.ts`.
- **Engram (persistent memory)**: installed via `gentle-ai install --preset minimal`. Not a workflow skill — it is the persistent-memory MCP referenced from AGENTS.md §12 (proactive memory triggers).

Gaps the protocol addresses:

1. Community skills get deprecated / replaced / renamed by their authors. Naming them in AGENTS.md is fragile.
2. No formal contract for when a project-owned skill should "borrow" capabilities from a sister skill (project-level community or user-level community).
3. T4 user-level skills may or may not be installed in any given environment. Naive references break for users who have not installed them.

---

## 2. Skill Tier Model

Three tiers. Different discovery and load rules per tier.

| Tier                              | Location                                                          | Examples                                                                                                                                                                                                          | Discovery                                                                                                     | Load behavior                                                                                |
| --------------------------------- | ----------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------- |
| **T1 — Project-owned**            | `.agents/skills/` (committed)                                     | every committed skill `.agents/skills/REGISTRY.md` lists | Named in AGENTS.md §5 "Skills T1" table                                                                       | Silent (load on trigger, no ask)                                                             |
| **T3 — Community project-level**  | `.agents/skills/` (installed by `install.ts:PROJECT_LEVEL_SKILLS`) | `PROJECT_LEVEL_SKILLS` in `cli/install.ts` (stack skills + builder skills such as `skill-creator`)                                                            | Named **by category** in AGENTS.md (not by skill name). Discovered at runtime from system-reminder skill list | Silent if matched by category (e.g. user works on Next.js page → load `next-best-practices`) |
| **T4 — Community user-level**     | `~/.claude/skills/` (installed by `install.ts:USER_LEVEL_SKILLS`) | `USER_LEVEL_SKILLS` in `cli/install.ts`                                                                                                       | **NOT named in AGENTS.md**. Discovered at runtime from system-reminder skill list. Auto-match by task domain  | **ASK user before load** (may not be installed, or user may not want it for this task)       |

### Tier decision rule

```
IF skill is committed in .agents/skills/         → T1
ELIF skill is in install.ts PROJECT_LEVEL_SKILLS → T3
ELIF skill is in install.ts USER_LEVEL_SKILLS    → T4
ELSE → T4 (unknown community)
```

**Builder skills are T3, not T4.** A community skill that a T1 workflow DEPENDS on (not one it merely borrows by category) is installed at project level, so a clone never silently skips it. `skill-creator` sits there because `project-context` mode `context-skill` and every new T1 skill are built through it (`skill-scaffold.md`). A user-level install of the same skill still satisfies it. A builder joins `PROJECT_LEVEL_SKILLS` in the same change as the T1 flow that loads it: an install nothing loads should not exist.

---

## 2b. Purpose Axis (`metadata.kind`)

A skill carries three independent labels. Each answers one question, is declared in one place, and has one gate. Collapsing any two of them is the wrong turn: `acli` is T1 **and** utility, `skill-creator` is T3 and nothing here labels its kind (the project does not author community frontmatter).

| Axis | Question it answers | Where declared | Gate |
|---|---|---|---|
| **Ownership** (T1 / T3 / T4, §2) | Who owns it, where it is installed, whether to ask before loading | `.agents/skills/` dir walk + `PROJECT_LEVEL_SKILLS` / `USER_LEVEL_SKILLS` in `cli/install.ts` | the tier checks in `scripts/lint-skills.ts` (`TIER-MISMATCH` against the `(T3)` / `(T4)` annotations of every Expected-matches table, `DUPLICATE-TIER`) |
| **Purpose** (`metadata.kind`) | What the skill IS: knowledge, a procedure, a tool index, or a doctrine parent | `SKILL.md` frontmatter, nested under `metadata:` | `KIND-MISSING`, `KIND-VOCAB`, `KIND-SUFFIX` in `scripts/lint-skills.ts` |
| **Domain** (`complementary_categories`, §4) | Which community skills a T1 skill may borrow, by category not name | `SKILL.md` frontmatter, top level | `ORPHAN-CATEGORY` / `EMPTY-CATEGORY` against §4.1 |

### The four kinds

| Kind | Classifying test | Slug suffix |
|---|---|---|
| **context** | Loading it changes what the agent KNOWS, not what it DOES next. No stages, drives no tool. Cites `.context/`, never restates it. May hold its own generated map and keep it honest (the write-scope amendment, `skill-scaffold.md` §3) | `-context` (mandatory) |
| **workflow** | A procedure with stages the agent runs end-to-end: a delivery stage (foundation, bootstrap, backlog, story, deploy) OR an operating flow around one (git, onboarding, Jira administration, context refresh) | none |
| **utility** | Owns ONE tool's grammar (a binary in `allowed-tools`, or an AGENTS.md §6.5 CLI row) and has no stages of its own | `-cli` / `-tool` / `-app` (mandatory for new skills) |
| **core** | Parent of other skills: they cite its `references/`; it has no write path of its own | none |

### Rules

- **`kind` lives under `metadata`, never top-level.** The Agent Skills frontmatter spec reserves the top level; `metadata` is its extension point. One kind per skill.
- **`stage_owner: true` marks a workflow skill that owns stages.** It binds `STAGE-OWNER-DISPATCH` (a dispatch section must exist) and the session close in `session-footer-contract.md`. The set is whatever skills declare it; `REGISTRY.md` prints `stage owner` on their Source line.
- **The suffix rule binds both ways.** A slug ending `-context` must declare `context` and a `context` skill must end `-context`; a slug ending `-cli` / `-tool` / `-app` must declare `utility` and a `utility` skill must carry one of them. `workflow` and `core` have no suffix rule.
- **Grandfathering is by name, visibly.** `KIND_SUFFIX_EXEMPT` in `scripts/lint-skills.ts` lists the slugs that predate the rule (a utility without a suffix, a workflow whose slug ends `-context`). A new skill picks a slug that matches its kind instead of joining that set.
- **Which skill is which: read `.agents/skills/REGISTRY.md`** (generated by `bun run skills:registry`; the Source line prints `kind:`). This document never carries a per-skill list, so there is nothing here to fall behind.
- **A context skill may write, but only its own `references/`.** `metadata.writes: [references/]` + `references/refresh.md`; it never runs a stage and never touches Jira or Confluence. `CONTEXT-WRITES` in `scripts/lint-skills.ts` gates it.
- **Capabilities are declared, not inferred.** `metadata.requires_capabilities` names MCP capabilities from `mcp-capabilities.md` §2 only; `CAPABILITY-VOCAB` rejects any other name, `CAPABILITY-UNDECLARED` warns when a body uses a resolution tag it did not declare.
- **T3 / T4 bodies are not linted for kind.** A community skill committed in the store keeps its `cli/install.ts` tier and the project does not author its frontmatter.

---

## 3. Skill Composition Protocol

### 3.1 Pre-flight (every task)

Before starting any non-trivial task, the orchestrator (and each invoked skill) MUST:

1. **Scan available skills** — read the local skill-registry cache (`.agents/skills/REGISTRY.md`, built by `scripts/build-skill-registry.ts`). Fallback: scan the `system-reminder` skill list that ships at session start.
2. **Match by domain category** (see vocabulary §5) — not by literal skill name.
3. **Resolve tier per match**:
   - T1 / T3 → load silently when task domain matches.
   - T4 → ask user one short question before loading: `"Detected X skill (T4). Apply it? Y/N"`.
4. **Cache the load decisions** for the session — do not re-ask the same skill twice.

### 3.2 Threshold rule (silent vs ask)

| Tier | Silent load condition                       | Ask condition                   |
| ---- | ------------------------------------------- | ------------------------------- |
| T1   | always                                      | never                           |
| T3   | task domain matches category                | task domain only weakly matches |
| T4   | never silent                                | always ask before load          |

### 3.3 Sub-agent skill propagation

When the orchestrator delegates to a sub-agent via the `Agent` tool, the sub-agent receives **its own** `system-reminder` skill list. The orchestrator cannot directly pass "use these skills". To bridge this:

- Orchestrator MUST inject a `## Composable Skills` block into the sub-agent prompt naming the resolved skills (e.g. `"For this task, consider invoking: unit-testing, next-best-practices."`).
- Sub-agent reads its own skill list, finds those names, loads them.
- If the sub-agent does NOT find a skill it was told to use → it falls back to the skill not found path (typically: do the work inline + flag the missing capability in the result envelope).

### 3.4 Skill not found path

When a referenced skill is not in the available list (deprecated, uninstalled, version mismatch):

1. Continue with project-owned alternative if exists.
2. If no alternative, do the work inline with degraded capability.
3. Flag in result envelope: `skill_resolution: "fallback-inline" + missing: [list]`.
4. Suggest reinstall via `bun run setup` or `bunx skills add <name>` in the user-facing summary.

---

## 4. Category Vocabulary (for community skill auto-match)

Project-owned skills are named explicitly. Community skills (T3, T4) are matched by **category**, not by name. Each project-owned skill declares which categories it can borrow from in its frontmatter `complementary_categories` field.

### 4.1 Category list (v2)

| Category             | Examples of skills that fit (T3/T4)                                                                                                                           | Used by (T1)                                                                          |
| -------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------- |
| `frontend-ui`        | `frontend-design`, `ui-ux-pro-max`, `emil-design-eng`, `shadcn`, `tailwind-css-patterns`, `impeccable`, `design-taste-frontend`, `redesign-existing-projects` | `design-system`, `project-bootstrap` (frontend phase), `sprint-development` (UI work) |
| `frontend-framework` | `next-best-practices`, `next-cache-components`, `next-upgrade`                                                                                                | `project-bootstrap`, `sprint-development`                                             |
| `forms-validation`   | `react-hook-form`, `zod`                                                                                                                                      | `sprint-development` (form work)                                                      |
| `backend-db`         | `supabase`, `supabase-postgres-best-practices`                                                                                                                | `project-bootstrap` (backend phase), `sprint-development` (DB work)                   |
| `runtime`            | `bun`                                                                                                                                                         | `project-bootstrap`, `sprint-development`                                             |
| `language`           | `typescript-advanced-types`                                                                                                                                   | `sprint-development`, `unit-testing`                                                  |
| `accessibility`      | `accessibility`, `accessibility-review`                                                                                                                       | `design-system`, `sprint-development` (UI work)                                       |
| `seo`                | `seo`, `nextjs-seo`                                                                                                                                           | `sprint-development` (public-page work)                                               |
| `deploy`             | `deploy-to-vercel` (T3 — deploy workflow). Note: `vercel-cli` (T1) owns Vercel verification, env sync, debug, rollback — see AGENTS.md §5.                    | `sprint-development` Stage 4/5, `vercel-cli`                                          |
| `email`              | `resend-cli`                                                                                                                                                  | `sprint-development` (email-feature work)                                             |
| `testing-e2e`        | `playwright-cli`, `playwright-best-practices`                                                                                                                 | `sprint-development` Stage 3 (when E2E in scope)                                      |
| `ci-cd`              | `github-actions-docs`                                                                                                                                         | `project-bootstrap` (CI phase), `sprint-development`                                  |
| `issue-tracker`      | (acli is T1)                                                                                                                                                  | `sprint-development`, `product-management`                                            |
| `creativity`         | `brainstorming`                                                                                                                                               | `project-foundation`, `product-management`                                            |
| `meta-skill`         | `skill-creator`, `find-skills`                                                                                                                                | `project-context` mode `context-skill` (`skill-creator`, the builder); otherwise only on user request (find-skills auto-invoked per §6.2 as last-resort) |
| `automation`         | `n8n-skills`                                                                                                                                                  | only on user request                                                                  |
| `presentation`       | `html-ppt`, `presentation-designer`                                                                                                                           | only on user request (HTML decks, slideshows)                                         |

### 4.2 Matching rule

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
---
```

At runtime, the skill (or orchestrator) scans the available skill list, matches each available skill against its category, and applies the threshold rule from §3.2.

### 4.3 Why categories not names

- Community skills get renamed, deprecated, replaced. Naming creates dead refs.
- Different users have different installs. Category match degrades gracefully (skill missing → no false negative, just no extra capability).
- Project-owned skills stay portable across community ecosystems.

---

## 5. Glue Layer Responsibilities

The orchestrator (top-level conversation) owns the glue layer. Cannot be inside a single skill because it spans multiple skills.

### 5.1 Per-session bootstrap (once)

1. Read `.agents/project.yaml` for project standards (test command, env, stack).
2. Cache for session: `test_command`, `delivery_strategy_default`, `complementary_skill_resolutions`.
3. Build / verify the local skill-registry cache (`scripts/build-skill-registry.ts` → `.agents/skills/REGISTRY.md`).

### 5.2 Per-delegation injection

Every sub-agent / skill prompt MUST include:

```
## Composable Skills (auto-resolved)
- T1 to load silently: [list]
- T3 to load by category: [list]
- T4 detected but NOT loaded (ask user first): [list]

## Project Standards
- Test command: {from project.yaml}
- Delivery strategy: {single-pr|chained|exception}
```

### 5.3 Decision points the glue layer owns

| Decision        | When                    | How                                                                       |
| --------------- | ----------------------- | ------------------------------------------------------------------------- |
| Skill load (T4) | First match per session | Ask user once per skill per session. Cache decision.                      |
| Workload chain  | Stage 1 forecast        | Sprint-dev `references/workload-forecast.md` owns the chain-strategy gate. |

---

## 6. Resolved Decisions

1. **Skill registry tooling**: ✅ **Local script.** `scripts/build-skill-registry.ts` scans `.agents/skills/*/SKILL.md`, extracts compact rules, writes `.agents/skills/REGISTRY.md`. Project-owned skills and orchestrator call it instead of ad-hoc scanning of the system-reminder list. Fallback to system-reminder scan only if the cache is unavailable.

2. **find-skills meta-skill**: ✅ **Automatic, but only as last resort.** Invocation order:
   1. Scan T1 (always available).
   2. Scan T3 + T4 already installed (via local skill-registry script).
   3. If a task domain has no match in steps 1-2 AND the task would benefit significantly from a specialized skill → invoke `find-skills` automatically to suggest installable skills. Ask user before installing.
   - **Do NOT confuse with `bunx autoskills`**: that is a one-shot bootstrap step run during `/project-bootstrap` (after `/project-foundation`) to install stack-matched skills. `find-skills` is per-task runtime discovery.

3. **Category vocabulary maintainer**: ✅ **`/sync-ai-memory` auto-maintains §4.1.** On invocation, sync-ai-memory scans T1 SKILL.md frontmatter + installed T3/T4 skills (via local skill-registry script), detects category gaps, writes additions to §4.1 of this doc. No human approval required (categories are additive, not destructive). Removal of unused categories: deferred to manual review.

4. **Sub-agent skill list inspection**: ✅ **Contract drafted in §3.4 is authoritative.** Sub-agents that cannot find a named skill in their own list MUST emit `skill_resolution: "fallback-inline" + missing: [list]` in their result envelope. Orchestrator on receiving fallback re-resolves and may retry with explicit injection.

5. **Per-skill frontmatter migration**: ✅ **Required for every T1 SKILL.md.** Backward-compat default: skills without `complementary_categories` get an empty list (no community matching).

---

## 7. Non-Goals

This doc does NOT:

- Replace any skill's internal workflow. Each skill stays in charge of its own steps.
- Merge project-owned skills into one mega-skill. They stay separate; the orchestrator composes them.
- Define the QA-side composition. QA workflows are out of scope here and follow their own composition strategy.
- Specify exact prompt text for the `## Composable Skills` injection block. That belongs in the orchestrator template, drafted later.
