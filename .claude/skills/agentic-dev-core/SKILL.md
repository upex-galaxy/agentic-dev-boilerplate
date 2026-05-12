---
name: agentic-dev-core
description: "Foundation skill that (a) hosts shared references cited by all workflow skills (briefing template, dispatch patterns, orchestration doctrine) and (b) bootstraps a target repo with the boilerplate's foundation files (CLAUDE.md, .agents/, scripts/, package.json updates). Triggers on: `/agentic-dev-core`, `initialize the project`, `bootstrap framework`, `setup foundation`, `regenerate CLAUDE.md`, `install project scripts`. Do NOT use for: syncing project memory facts (use `/sync-ai-memory`), onboarding project discovery (use `/project-discovery` if available), or test framework adaptation (testing-only, not in scope)."
license: MIT
compatibility: [claude-code, copilot, cursor, codex, opencode]
phase: bootstrap
complementary_categories:
  - doc-generation
  - meta-skill
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

# Agentic Dev Core — Foundation references + bootstrap

`agentic-dev-core` is the skill that other skills assume already exists. It plays two distinct roles in the same package:

1. **Passive — shared reference library.** Workflow skills (`sprint-development`, `unit-testing`, `project-foundation`, `project-bootstrap`, `product-management`) cite files under `references/` instead of duplicating the same briefing template, dispatch patterns and orchestration doctrine inside every skill. Loading a workflow skill therefore implies loading the relevant `agentic-dev-core/references/*.md` on demand.
2. **Active — bootstrap trigger.** When users adopt this boilerplate by downloading skills à la carte (e.g. cloning `.claude/skills/sprint-development/` only), they end up missing the foundation files those skills depend on (`CLAUDE.md`, `.agents/project.yaml`, `scripts/agents-*.ts`, etc.). Invoking `/agentic-dev-core` regenerates that foundation from the templates shipped under `templates/`.

Without `agentic-dev-core`, every other workflow skill would either silently rely on files that don't exist or copy-paste the same boilerplate-foundation paragraphs into its own `references/`. This skill is the single source of truth for both.

---

## Two roles

| Role                            | Trigger                                                                              | Consumers                                                                                                                  |
| ------------------------------- | ------------------------------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------- |
| **Reference library (passive)** | Other skills loading on-demand                                                       | `sprint-development`, `unit-testing`, `project-foundation`, `project-bootstrap`, `product-management` <!-- TODO: future skills --> |
| **Bootstrap (active)**          | `/agentic-dev-core`, `initialize the project`, `bootstrap framework`, `setup foundation` | End users adopting the boilerplate, or repairing a partial install                                                         |

Passive role: nobody invokes `agentic-dev-core` directly to read a reference — they just cite `agentic-dev-core/references/<file>.md` and the AI loads it. Active role: only the user invokes it, and only when foundation files are missing.

---

## Composable Skills (auto-resolved at active-role entry)

When invoked in **active role** (bootstrap), run once before any write below. Follows the contract in `references/skill-composition-strategy.md` (this skill hosts the doc; downstream skills cite it as `agentic-dev-core/references/skill-composition-strategy.md`).

Steps:

1. Read `complementary_categories` from this skill's frontmatter (`doc-generation`, `meta-skill`).
2. Resolve available skills via `skill-registry` (gentle-ai T2). Fallback: scan the session-start `system-reminder` skill list.
3. For each matched skill, classify tier per strategy doc §2.
4. Apply threshold rule per strategy doc §3.2:
   - **T1 / T2 / T3** matches → load silently. Cache for the session.
   - **T4** matches → ASK user once: `"Detected <skill> (T4). Apply for this bootstrap? Y/N"`. Cache the answer for the session.
5. When dispatching sub-agents (foundation file generation, scripts setup, package.json updates), inject a `## Composable Skills` block per strategy doc §6.2.

Expected matches (illustrative — actual list depends on what the user has installed):

| Category         | Likely matches                                                                                          |
| ---------------- | ------------------------------------------------------------------------------------------------------- |
| `doc-generation` | `cognitive-doc-design` (T2) — applied when generating CLAUDE.md, README.md, .agents/ docs               |
| `meta-skill`     | T4 ASK: `skill-creator` (custom skill authoring), `find-skills` (runtime skill discovery)               |

Passive role (file-reference-only) skips this step entirely — no composition needed when another skill just cites a `references/*.md` file.

Skip step also if neither `skill-registry` nor a session-start skill list is available. When skipped, log `skill_resolution: "fallback-inline"` plus `missing: [<categories with no resolution>]` in the result envelope (per strategy doc §3.4).

---

## Init: write order

Bootstrap writes files in **this exact order**. Each step is justified by what depends on what:

1. **`.agents/project.yaml`** — template variable source. Skills resolve `{{VAR}}` against this. Nothing depends on it yet at this point in the install, so write it first.
2. **`.agents/jira-required.yaml`** — manifest of Jira custom fields AND `work_types:` (issue types + canonical statuses + canonical transitions) the methodology requires. Read by `scripts/check-jira-setup.ts`, `scripts/sync-jira-workflows.ts`, and `scripts/agents-lint.ts`.
3. **`.agents/jira-fields.json`** — empty stub (`{}`). Real catalog is written later by `bun run jira:sync-fields`. Documented in `templates/jira-fields.json.template` so the file exists from minute zero.
4. **`.agents/jira-workflows.json`** — empty shell with one entry per declared `work_type` (e.g. `{"story": {...}, "bug": {...}}` with `null`/`{}` placeholders). Real catalog is written later by `bun run jira:sync-workflows`. Documented in `templates/jira-workflows.json.template` so the file exists from minute zero.
5. **`scripts/agents-setup.ts` + `scripts/agents-lint.ts` + `scripts/sync-jira-fields.ts` + `scripts/sync-jira-workflows.ts` + `scripts/check-jira-setup.ts`** — the five CLIs that operate on the four files above. Source files live as `templates/scripts/*.ts.template` (the `.template` suffix keeps them out of this repo's `tsconfig`/`eslint` scope, since they aren't live source code here); strip the `.template` suffix when writing to the destination `scripts/` directory. Order within this group does not matter.
6. **`package.json`** (penultimate) — merged: declared `dependencies` and `scripts` from `templates/package.json.partial.json` are added to the existing `package.json` if one exists; otherwise the partial is the seed for a fresh `package.json`. **Mandatory step:** without this merge, none of the five scripts written in step 5 are invocable via `bun run …`.
7. **`CLAUDE.md`** (last). It cites every file written in steps 1-6, so it must be written after all of them. OpenCode reads `CLAUDE.md` as a fallback per its Claude Code compat docs, so a single canonical file covers both supported agents — no symlink needed.
8. **`.context/_framework/testing-capabilities.json`** (post-bootstrap detection). After CLAUDE.md exist, run `bun scripts/detect-testing-capabilities.ts` to populate the testing-capabilities cache. The script inspects `package.json`, `tsconfig.json`, ESLint configs, plus the strict-TDD priority chain (`<!-- strict_tdd: ... -->` marker in CLAUDE.md → `testing.strict_tdd` in `.agents/project.yaml` → runner-based fallback) and writes `.context/_framework/testing-capabilities.json`. Downstream skills (`unit-testing`, `sprint-development`) read this cache instead of re-detecting on every dispatch. Schema and detection algorithm: `references/testing-capabilities.md`.

Files MUST NOT be reordered. The dependency chain is real: a user who runs the bootstrap halfway and then types `bun run agents:setup` would otherwise hit "missing script" errors. Step 8 must follow step 7 because the strict-TDD priority chain reads `CLAUDE.md`.

**Post-bootstrap order for the user.** After `init` completes, the report should instruct the user to run, in this exact order:

1. `bun run agents:setup` — fill `.agents/project.yaml` interactively.
2. `bun run jira:sync-fields` — populate `.agents/jira-fields.json` from their Jira workspace.
3. `bun run jira:sync-workflows` — populate `.agents/jira-workflows.json` from their Jira workspace (interactive on first run for canonical slugs that don't auto-resolve to a workflow's real status / transition names).
4. `bun run jira:check` — validate that BOTH catalogs satisfy the manifest (custom fields + `work_types`).
5. `bun run lint:agents` — confirm every project-variable and Jira reference (custom fields, work types, statuses, transitions) resolves.

---

## Init: idempotency

For each file written in steps 1-7:

- **If the destination file does not exist** → copy the corresponding template, report `WROTE <path>`.
- **If the destination file already exists** → do NOT overwrite, report `SKIPPED <path> (already present)`.

**Exception — step 6 (`package.json`)**: never overwrite. Read the existing `package.json`, merge in the `dependencies` and `scripts` declared in `templates/package.json.partial.json` (only adding keys that are not already present; never modifying existing keys), and write back. If `package.json` does not exist at all, copy the partial verbatim and report `WROTE package.json (from partial)`.

The `init` action never deletes files, never modifies values in existing files (only adds), and never runs `bun install`. Surface deps that need to be installed in the report so the user can run `bun install` themselves.

---

## References cited by other skills

| File                                   | Cited by                                                                                                                   | Purpose                                                                                                                     |
| -------------------------------------- | -------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------- |
| `references/briefing-template.md`      | `sprint-development`, `unit-testing`, `project-foundation`, `project-bootstrap`, `product-management` <!-- TODO: future skills --> | The 6-component subagent briefing template, with concrete filled examples per dispatch pattern.                             |
| `references/dispatch-patterns.md`      | All workflow skills with a "Subagent Dispatch Strategy" section                                                            | Decision table + heuristic for picking Single / Sequential / Parallel / Background.                                         |
| `references/orchestration-doctrine.md` | Subagents that need orchestration rules without pulling the whole `CLAUDE.md`                                              | Cacheable mirror of `CLAUDE.md` §"Orchestration Mode (Subagent Strategy)".                                                  |
| `references/testing-capabilities.md`   | `unit-testing`, `sprint-development`                                                                                               | Cache schema + detection algorithm for `.context/_framework/testing-capabilities.json` (runner / e2e / typecheck / lint / strict_tdd). |

When a skill cites one of these, it includes a Dependencies block at the top (see next section) so the AI knows to load `agentic-dev-core` before continuing.

---

## Dependency declaration for downstream skills

Every workflow skill that cites `agentic-dev-core/references/*.md` should declare it explicitly so the AI knows what to load on demand. Example block to add near the top of the skill's `SKILL.md`:

```markdown
## Dependencies

Requires `agentic-dev-core`. Loads on demand:

- agentic-dev-core/references/briefing-template.md
- agentic-dev-core/references/dispatch-patterns.md
```

The block is documentation — the AI reads it and pulls the cited files. There is no automated wiring: skills are markdown, not code.

---

## Source of truth contract

`templates/CLAUDE.md.template` is a **byte-equivalent mirror** of the live `CLAUDE.md` at the repo root. Any change to a structural section in one MUST be applied to the other in the same commit. Structural sections include:

- Critical Rules
- Project Variables
- Tool Resolution
- Orchestration Mode
- Skills Available
- Commands Available
- Fundamental Rules
- Git Workflow
- Context System
- MCPs Available
- AI Behavior
- Local Context (PBI)
- CLI Tools
- Test Project Structure
- Quick Reference

**Project-specific FACTS** (Project Identity table, Environment URLs, Discovery Progress, etc.) are NOT mirrored. Those are populated per-project by `/sync-ai-memory` and live only in the live `CLAUDE.md`. The template keeps them as `[PLACEHOLDER]` rows so a fresh bootstrap surfaces them as TODOs.

This contract is enforced by convention, not tooling — a future linter could diff the two files but is out of scope here.

The same contract applies to `templates/project.yaml.template`, `templates/jira-required.yaml.template`, and the five script templates (`agents-setup.ts.template`, `agents-lint.ts.template`, `sync-jira-fields.ts.template`, `sync-jira-workflows.ts.template`, `check-jira-setup.ts.template`): they are byte-equivalent mirrors of their live counterparts at the repo root. When the live file evolves, update the template in the same commit.

> **Note on `jira-fields.json.template` and `jira-workflows.json.template`**: both are shipped as empty stubs (`jira-fields.json.template` is `{}`; `jira-workflows.json.template` is a shell with one entry per declared `work_type` and `null`/`{}` placeholders). The real catalogs are generated by running `bun run jira:sync-fields` and `bun run jira:sync-workflows` against the user's Jira workspace AFTER bootstrap completes. The bootstrap report should mention these follow-up steps.

---

## Out of scope

`agentic-dev-core` does not:

- Create or modify `.context/` files (that belongs to `/project-discovery` if available).
- Generate or scaffold tests, fixtures, or test components (that belongs to test-automation skills).
- Adapt the framework to a specific stack (that belongs to stack-adaptation skills).
- Sync project-specific facts in `CLAUDE.md` (that belongs to `/sync-ai-memory`).
- Sync OpenAPI / API schemas (that's `bun run api:sync`).
- Run any external command beyond file writes — no `bun install`, no `git`, no `gh`.

If a user invokes `/agentic-dev-core` and then asks "now configure the project", route them to the project-discovery / foundation skill. If they ask "now wire the test fixtures", route them to the test-automation skill.
