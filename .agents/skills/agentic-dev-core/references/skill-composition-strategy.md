# Skill Composition Strategy

> **Purpose**: how this repo's orchestrator composes project-owned skills with community skills (project-level and user-level) without duplication, conflicts or false negatives.
>
> **Home**: meta-doctrine consumed by all T1 skills, sibling to `briefing-template.md`, `dispatch-patterns.md`, `orchestration-doctrine.md` and `skill-resolver.md`. Related: `AGENTS.md` (top-level rules and skill mentions), `.agents/skills/*/SKILL.md` (they cite this doc as `agentic-dev-core/references/skill-composition-strategy.md`) and `cli/install.ts` (declares project-level and user-level skill installs).

---

## 1. Problem Statement

The repo ships the project-owned skills that `.agents/skills/REGISTRY.md` lists. The installer (`cli/install.ts`) also installs:

| Source | Where it lives |
| --- | --- |
| Community skills, project-level | The `PROJECT_LEVEL_SKILLS` array in `cli/install.ts`: the stack skills plus the builder skills a T1 workflow depends on (`skill-creator`, the builder of every skill this repo scaffolds, `skill-scaffold.md`). |
| Community skills, user-level | The `USER_LEVEL_SKILLS` array in `cli/install.ts`. |
| Engram (persistent memory) | Wired per agent by `engram setup <agent>`. It is the memory MCP behind `AGENTS.md` §12, not a workflow skill. |

Three gaps need a protocol: authors deprecate and rename community skills, so naming them in `AGENTS.md` is fragile; nothing says when a project-owned skill may borrow from a sister skill; and a user-level skill may be missing from a given environment, so a plain reference to it breaks.

---

## 2. Skill Tier Model

Three tiers, each with its own discovery rule. Load behaviour per tier is in §3.2.

| Tier | Location | Discovery |
| --- | --- | --- |
| **T1, project-owned** | `.agents/skills/` (committed; `REGISTRY.md` lists them) | Named in `.agents/instructions/agent-skills-and-mcps.md` §5 "Skills T1" table. A skill the project created for itself goes in the "Project context skills" table of `.agents/instructions/agent-project.md` |
| **T3, community project-level** | `.agents/skills/` (installed by `install.ts:PROJECT_LEVEL_SKILLS`: stack skills and builder skills such as `skill-creator`) | Named by category in `AGENTS.md`, not by skill name. Found at runtime by the §3.1 scan (session skill list plus `.agents/skills/` on disk), never from `REGISTRY.md` |
| **T4, community user-level** | `~/.claude/skills/` (installed by `install.ts:USER_LEVEL_SKILLS`) | Not named in `AGENTS.md`. Found at runtime from the session skill list (§3.1) and matched by task domain |

### Tier decision rule

```
IF skill is committed in .agents/skills/         -> T1
ELIF skill is in install.ts PROJECT_LEVEL_SKILLS -> T3
ELIF skill is in install.ts USER_LEVEL_SKILLS    -> T4
ELSE -> T4 (unknown community)
```

**Orchestration vendor stubs are T4 but not in `USER_LEVEL_SKILLS`.** `orca-cli` and `orchestration` are guides bundled with the orchestration binary, which installs them user-level itself. They are optional: the T4 skill `agent-orchestration` (in `USER_LEVEL_SKILLS`) loads beside them and asks the binary for its grammar when none is installed; a worker loads only the `orchestration` guide. The availability gate is the binary plus a reachable runtime, never an installed stub. Do not add the stubs to `cli/install.ts`; per-machine setup is the user skill's machine setup reference, and this repo's half is `./fleet-provisioning.md`.

**Builder skills are T3, not T4.** A community skill that a T1 workflow depends on (as opposed to one it merely borrows by category) is installed at project level, so a clone never silently skips it. `skill-creator` sits there because `project-context` mode `context-skill` and every new T1 skill are built through it (`skill-scaffold.md`); a user-level install of it also satisfies the dependency. A builder joins `PROJECT_LEVEL_SKILLS` in the same change as the T1 flow that loads it, because an install nothing loads should not exist.

---

## 2b. Purpose Axis (`metadata.kind`)

A skill carries three independent labels. Each answers one question, is declared in one place and has one gate. They do not collapse into each other: `acli` is T1 and utility, and `skill-creator` is T3 with no kind label here (the project does not author community frontmatter).

| Axis | Question it answers | Where declared | Gate |
|---|---|---|---|
| **Ownership** (T1 / T3 / T4, §2) | Who owns it, where it is installed, whether to ask before loading | `.agents/skills/` dir walk + `PROJECT_LEVEL_SKILLS` / `USER_LEVEL_SKILLS` in `cli/install.ts` | the tier checks in `scripts/lint-skills.ts` (`TIER-MISMATCH` against the `(T3)` / `(T4)` annotations of every Expected-matches table, `DUPLICATE-TIER`) |
| **Purpose** (`metadata.kind`) | What the skill is: knowledge, a procedure, a tool index, or a doctrine parent | `SKILL.md` frontmatter, nested under `metadata:` | `KIND-MISSING`, `KIND-VOCAB`, `KIND-SUFFIX` in `scripts/lint-skills.ts` |
| **Domain** (`complementary_categories`, §4) | Which community skills a T1 skill may borrow, by category and not by name | `SKILL.md` frontmatter, top level | `ORPHAN-CATEGORY` / `EMPTY-CATEGORY` against §4.1 |

### The four kinds

| Kind | Classifying test | Slug suffix |
|---|---|---|
| **context** | Loading it changes what the agent knows, not what it does next. No stages, drives no tool. Cites `.context/` and never restates it. May hold its own generated map and keep it honest (the write-scope amendment, `skill-scaffold.md` §3) | `-context` (mandatory) |
| **workflow** | A procedure with stages the agent runs end to end: a delivery stage (foundation, bootstrap, backlog, story, deploy) or an operating flow around one (git, onboarding, Jira administration, context refresh) | none |
| **utility** | Owns one tool's grammar (a binary in `allowed-tools`, or an `.agents/instructions/agent-tool-resolution.md` §6.5 CLI row) and has no stages of its own | `-cli` / `-tool` / `-app` (mandatory for new skills) |
| **core** | Parent of other skills: they cite its `references/`, and it has no write path of its own | none |

### Rules

- **`kind` lives under `metadata`, never top-level.** The Agent Skills frontmatter spec reserves the top level, and `metadata` is its extension point. One kind per skill.
- **`stage_owner: true` marks a workflow skill that owns stages.** It binds `STAGE-OWNER-DISPATCH` (a dispatch section must exist) and the session close in `session-footer-contract.md`. The set is whatever skills declare it, and `REGISTRY.md` prints `stage owner` on their Source line.
- **The suffix rule binds both ways.** The suffixes in the table above are required of the kind and the kind of the suffix. `workflow` and `core` have no suffix rule.
- **Grandfathering is by name, in the open.** `KIND_SUFFIX_EXEMPT` in `scripts/lint-skills.ts` lists the slugs that predate the rule. A new skill picks a slug that matches its kind instead of joining that set.
- **Which skill is which: read `.agents/skills/REGISTRY.md`** (its Source line prints `kind:`). This document carries no per-skill list.
- **A context skill may write, but only its own `references/`.** It declares `metadata.writes: [references/]`, carries `references/refresh.md`, and never runs a stage or touches Jira or Confluence (`CONTEXT-WRITES` in `scripts/lint-skills.ts`).
- **Capabilities are declared, not inferred.** `metadata.requires_capabilities` names MCP capabilities from `mcp-capabilities.md` §2 only. `CAPABILITY-VOCAB` rejects any other name, and `CAPABILITY-UNDECLARED` warns when a body uses a resolution tag it did not declare.
- **T3 and T4 bodies are not linted for kind.** A community skill in the store keeps its `cli/install.ts` tier.

---

## 3. Skill Composition Protocol

### 3.1 Pre-flight (every task)

Before a non-trivial task, the orchestrator (and each invoked skill) does the following.

1. **Scan the skills actually installed**, from two sources read together:
   - the skill list the harness injects at session start (the `system-reminder` list in Claude Code, the equivalent list in Codex, OpenCode and Pi). It already carries the user-level skills and the project-level ones the harness discovers through `.agents/skills/` (Claude Code through the generated `.claude/skills` alias);
   - the project store on disk: every `.agents/skills/*/SKILL.md`, git-ignored community folders included (`ls .agents/skills/*/SKILL.md`, then the frontmatter `description` of any folder the session list did not show).

   `.agents/skills/REGISTRY.md` is not this scan. `scripts/build-skill-registry.ts` skips git-ignored folders on purpose, so the file is identical on every clone and lists committed skills only, and a community (T3) skill never appears in it. The registry is where the resolver copies T1 compact rules from (`skill-resolver.md`), never the inventory of this machine.
2. **Match by domain category** (vocabulary in §4), not by literal skill name.
3. **Resolve the tier per match** and apply §3.2. A T4 match gets one short question before loading: `"Detected X skill (T4). Apply it? Y/N"`. With nobody to ask, see "With nobody at the keyboard" below.
4. **Cache the load decisions** for the session and do not ask about the same skill twice.

### 3.2 Threshold rule (silent vs ask)

| Tier | Silent load condition | Ask condition |
| ---- | --------------------- | ------------- |
| T1 | always | never |
| T3 | task domain matches the category | task domain matches only weakly |
| T4 | never silent (the skill may not be installed, or the user may not want it for this task) | always ask before load |

### 3.3 Sub-agent skill propagation

A sub-agent launched through the `Agent` tool has its own `system-reminder` skill list, and the orchestrator cannot hand it a skill. So the orchestrator injects a `## Composable Skills` block into the sub-agent prompt naming the resolved skills (for example `"For this task, consider invoking: unit-testing, typescript-advanced-types."`). The sub-agent finds those names in its own list and loads them. A name it cannot find takes the path in §3.4.

### 3.4 Skill not found path

When a referenced skill is not in the available list (deprecated, uninstalled, version mismatch):

1. Continue with a project-owned alternative if one exists.
2. Otherwise do the work inline with degraded capability.
3. Flag it in the result envelope: `skill_resolution: "fallback-inline" + missing: [list]`.
4. Suggest a reinstall through `bun setup` or `bunx skills add <name>` in the user-facing summary.

### 3.5 Step-required skills (named at the step that needs them)

The entry-time scan (§3.1) loads a community skill only when the task domain "matches", which is too soft for the steps where a stack skill carries the real rules. So a workflow step that writes in a domain a stack skill owns names that skill and requires it at that step. The owners:

| Step does | Load first | Category |
| --------- | ---------- | -------- |
| Any database schema, RLS, function or migration change (through the DB MCP or the `supabase` CLI) | `supabase` + `supabase-postgres-best-practices` | `backend-db` |
| Screen design: a mockup or a screen's HTML (`design-system` screen phase, Mode C) | the design set (below) | `frontend-ui` |
| Screen, component or layout work in code | the design set + `shadcn` + `tailwind-css-patterns` | `frontend-ui` |
| A deploy to a Vercel environment | `deploy-to-vercel` (method), next to T1 `vercel-cli` (verification) | `deploy` |
| Sending or templating transactional email | `resend-cli` | `email` |
| A public, indexable page | `seo` | `seo` |

**The design set.** Every step that designs or builds a screen loads the same group, each member owning a different part of the job:

- `frontend-design`: the aesthetic direction, typography, choices that do not read as a template.
- `ui-ux-pro-max`: searchable design data (styles, palettes, font pairings, UX guidelines, per-stack UI rules).
- `impeccable`: the critique and polish pass (hierarchy, states, responsive behaviour, motion, UX copy).
- `emil-design-eng`: component-level polish and animation decisions.
- `modern-web-guidance`: platform correctness. It picks the native web feature and its Baseline-aware fallback (dialog, popover, anchor positioning, view transitions, container queries, form validation, scheduling, passkeys, accessibility) where the others pick the look. Before writing UI behaviour, run `npx modern-web-guidance@latest search "<task>"`, then `retrieve "<guide-id>"` on the best match. The project's Baseline target is the line in `agent-project.md` (`This project's Baseline target is Baseline <year>.`): read it before the first `search` and keep it in the conversation, because the skill sees only what is loaded; without one the skill assumes Baseline Widely available. Volatile features stay gated until a person runs `npx modern-web-guidance@latest set-allow-volatile-features`.

Two more join only when the step matches their scope:

- `redesign-existing-projects`: only when the step redesigns a UI that already exists (it audits the current design before changing it). Not on a new screen.
- `design-taste-frontend`: only when the screen is a public marketing page (landing, pricing, portfolio). That is its declared scope. Outside it, it repeats what `frontend-design` and `redesign-existing-projects` already cover.

The contract is the same at every step that cites this section:

1. Load the named skills before the first write of the step, not after.
   After the first write, two checks run on what was built: `impeccable` critiques the built screen (hierarchy, states, responsive behaviour, copy), and `npx modern-web-guidance@latest legacy-scan <changed UI files>` flags legacy patterns in the touched files. The step records both results.
2. If one is not installed, say so once in the session (every missing skill in one line, with the step) and point at the install path: `bun setup` installs the project-level list (`PROJECT_LEVEL_SKILLS` in `cli/install.ts`), or one `bunx skills add <package> --skill <name> --yes` with the package from that list. `bun run setup:doctor` checks the machine. Then continue with the step. A missing community skill is never a hard stop and never a silent skip, so record `skill_resolution: "fallback-inline"` (§3.4).
3. The skill guides how. The step's own rules (the project's ADRs, `DESIGN.md` tokens, Critical Rules) still win on a conflict.

### With nobody at the keyboard

Two steps here wait for a person: the T4 question in §3.1 and the `find-skills` install question in §6.2. The decision protocol (`./decision-protocol.md`) says where the answer comes from.

| Who is running | T4 skill that matches the task |
|---|---|
| a person in the main thread | ask the one question, as in §3.1 |
| a supervised worker | the conductor holds the gate: the briefing's `Skills to load` is its answer, and a T4 skill outside that list is not loaded |
| a routine, or a worker whose brief covers it | load a T4 skill only when the delegating brief names it. Otherwise do the step inline, record `skill_resolution: "fallback-inline"` with the skill under `missing`, and say so in the report |

In every case nothing is installed without a person: `find-skills` may suggest a skill in the report, and the install stays with the human.

---

## 4. Category Vocabulary (for community skill auto-match)

Project-owned skills are named explicitly. Community skills (T3, T4) are matched by category and not by name. Each project-owned skill declares which categories it can borrow from in its frontmatter `complementary_categories` field.

### 4.1 Category list

| Category             | Examples of skills that fit (T3/T4)                                                                                                                           | Used by (T1)                                                                          |
| -------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------- |
| `frontend-ui`        | `frontend-design`, `ui-ux-pro-max`, `emil-design-eng`, `shadcn`, `tailwind-css-patterns`, `impeccable`, `design-taste-frontend`, `redesign-existing-projects` | `design-system`, `project-bootstrap` (frontend phase), `sprint-development` (UI work) |
| `frontend-framework` | `next-cache-components-adoption`, `next-cache-components-optimizer`. Next.js reference knowledge and upgrades are not skills: they come from `[DOCS_TOOL]` (Context7) and the docs bundled in the app's `next` package | `project-bootstrap`, `sprint-development`                                             |
| `forms-validation`   | `react-hook-form`, `zod`                                                                                                                                      | `sprint-development` (form work)                                                      |
| `backend-db`         | `supabase`, `supabase-postgres-best-practices`                                                                                                                | `project-bootstrap` (backend phase), `sprint-development` (DB work)                   |
| `language`           | `typescript-advanced-types`                                                                                                                                   | `sprint-development`, `unit-testing`                                                  |
| `accessibility`      | `accessibility`                                                                                                                                               | `design-system`, `sprint-development` (UI work)                                       |
| `seo`                | `seo`                                                                                                                                                         | `sprint-development` (public-page work)                                               |
| `deploy`             | `deploy-to-vercel` (T3, the deploy workflow). `vercel-cli` (T1) owns Vercel verification, env sync, debug and rollback (`.agents/instructions/agent-skills-and-mcps.md` §5) | `sprint-development` Stage 4/5, `vercel-cli`                                          |
| `email`              | `resend-cli`                                                                                                                                                  | `sprint-development` (email-feature work)                                             |
| `testing-e2e`        | `playwright-cli`                                                                                                                                              | `sprint-development` Stage 3 (when E2E in scope)                                      |
| `ci-cd`              | `github-actions-docs`                                                                                                                                         | `project-bootstrap` (CI phase), `sprint-development`                                  |
| `issue-tracker`      | (acli is T1)                                                                                                                                                  | `sprint-development`, `product-management`                                            |
| `meta-skill`         | `skill-creator`, `diagram-design`, `find-skills`                                                                                                              | `project-context` mode `context-skill` (`skill-creator`, the builder); modes `data` / `features` / `api` and each business map skill's refresh (`diagram-design`, the maps' figures, capability `diagrams`); otherwise only on user request (`find-skills` runs automatically as a last resort, §6.2) |
| `presentation`       | `html-ppt`                                                                                                                                                    | only on user request (HTML decks, slideshows)                                         |
| `orchestration`      | `orca-cli`, `orchestration` (the orchestration binary's own guides; optional to have, loaded beside the user-level `/agent-orchestration` when present, never a gate) | cited as the transport by `sprint-development` (fleet mode) and `autonomous-delivery` (Phase 3 workers) |

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

At runtime the skill (or orchestrator) scans the available skill list, matches each available skill against its category, and applies the threshold rule from §3.2.

### 4.3 Why categories, not names

A name becomes a dead reference when a community skill is renamed or replaced, and installs differ between users. A category match degrades gracefully: a missing skill means no extra capability and no false negative. Project-owned skills stay portable across community ecosystems.

---

## 5. Glue Layer Responsibilities

The orchestrator (the top-level conversation) owns the glue layer, because it spans several skills and cannot live inside one.

### 5.1 Per-session bootstrap (once)

1. Read `.agents/project.yaml` for project standards (test command, env, stack).
2. Cache for the session: `test_command`, `delivery_strategy_default`, `complementary_skill_resolutions`.
3. Build or verify the registry cache for T1 compact rules (§6.1). The installed community skills come from the §3.1 scan.

### 5.2 Per-delegation injection

Every sub-agent or skill prompt includes:

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

| Decision | When | How |
| --- | --- | --- |
| Skill load (T4) | First match per session | Ask the user once per skill per session and cache the answer. Nobody to ask: see "With nobody at the keyboard" in §3 |
| Review size chain | Stage 1 forecast | Sprint-dev `references/review-size-forecast.md` owns the chain-strategy gate |

---

## 6. Resolved Decisions

1. **Skill registry tooling: a local script, committed skills only.** `scripts/build-skill-registry.ts` scans the committed `.agents/skills/*/SKILL.md`, extracts compact rules and writes `.agents/skills/REGISTRY.md` (§3.1 says why git-ignored folders are skipped). Community skills get no machine-local registry section or file: the session list is already live and complete, a generated local file would go stale the moment `bunx skills add` runs, and a machine-dependent section would break the committed file's determinism.

2. **find-skills meta-skill: automatic, but only as a last resort.** The order is:
   1. Scan T1 (always available).
   2. Scan the T3 and T4 skills already installed (§3.1).
   3. If the task domain has no match in steps 1 and 2 and the task would benefit significantly from a specialized skill, invoke `find-skills` to suggest installable skills. Ask the user before installing.

   `bunx autoskills` is a different thing: a one-shot bootstrap step run during `/project-bootstrap` (after `/project-foundation`) to install stack-matched skills. `find-skills` is per-task runtime discovery.

3. **Category vocabulary: no automated maintainer.** `bun run skills:check` rejects a `complementary_categories` value missing from §4.1, so a skill that needs a new category fails until a human adds it to §4.1 in the same change. Unused categories are removed by manual review.

4. **Sub-agent skill list inspection: the §3.4 contract is authoritative.** On receiving a `fallback-inline` envelope, the orchestrator re-resolves and may retry with explicit injection.

5. **`complementary_categories` is declared by every T1 SKILL.md.** A skill without it gets an empty list, which means no community matching.

---

## 7. Non-Goals

This doc does not:

- Replace any skill's internal workflow. Each skill stays in charge of its own steps.
- Merge project-owned skills into one mega-skill. The orchestrator composes them.
- Fix prompt text for the `## Composable Skills` injection beyond the block in §5.2.
