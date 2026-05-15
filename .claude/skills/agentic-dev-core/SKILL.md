---
name: agentic-dev-core
description: 'Foundation skill that hosts shared references cited by other workflow skills (briefing template, dispatch patterns, orchestration doctrine, skill composition strategy, behavioral layer, model routing, skill resolver, topic-key conventions, TypeScript patterns). Loaded on demand by `sprint-development`, `unit-testing`, `project-foundation`, `project-bootstrap`, `product-management`, `testability-guide`, `agentic-dev-onboard`. Do NOT use for: syncing project memory facts (use `/sync-ai-memory`), onboarding project discovery (use `/agentic-dev-onboard`), or test framework adaptation (testing-only, not in scope).'
license: MIT
compatibility: [claude-code, copilot, cursor, codex, opencode]
phase: foundation
---

# Agentic Dev Core — Foundation reference host

`agentic-dev-core` is the shared reference library that every workflow skill in this repo cites. It exists so doctrine (briefing template, dispatch patterns, orchestration rules, skill composition tiers, behavioral layer, model routing, topic-key conventions, TypeScript patterns) lives in one place instead of being duplicated across every `SKILL.md`.

Loading a workflow skill (e.g. `sprint-development`, `unit-testing`, `project-foundation`, `project-bootstrap`, `product-management`, `testability-guide`) implies loading the relevant `agentic-dev-core/references/*.md` on demand — workflow skills declare a `## Dependencies` block at the top so the AI knows what to pull in.

This skill does NOT orchestrate workflows, does NOT generate files, and does NOT bootstrap a target repo. The entire framework (skills, foundation files, scripts) ships together as one repo; à la carte adoption is not supported — see "Install model" below.

---

## References cited by other skills

| File                                       | Cited by                                                                                                                   | Purpose                                                                                         |
| ------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------- |
| `references/briefing-template.md`          | `sprint-development`, `unit-testing`, `project-foundation`, `project-bootstrap`, `product-management`, `testability-guide` | The 6-component subagent briefing template, with concrete filled examples per dispatch pattern. |
| `references/dispatch-patterns.md`          | All workflow skills with a "Subagent Dispatch Strategy" section                                                            | Decision table + heuristic for picking Single / Sequential / Parallel / Background.             |
| `references/orchestration-doctrine.md`     | Subagents that need orchestration rules without pulling the whole `CLAUDE.md`                                              | Cacheable mirror of `CLAUDE.md` §"Orchestration Mode (Subagent Strategy)".                      |
| `references/skill-composition-strategy.md` | All workflow skills, plus `framework-development` if present                                                               | T1-T4 tier model + SDD boundary + composition contract.                                         |
| `references/behavioral-layer.md`           | Workflow skills that need full behavioral-layer examples beyond CLAUDE.md §2                                               | Detailed examples + working-signals for THINK / SIMPLICITY / SURGICAL / GOAL-DRIVEN.            |
| `references/model-routing.md`              | Orchestrators that route phases across Opus / Sonnet / Haiku                                                               | Phase → model alias mapping with rationale.                                                     |
| `references/skill-resolver.md`             | Skills that resolve composable skills at runtime via the registry                                                          | Skill Resolver Protocol used by sub-agent launches.                                             |
| `references/topic-key-conventions.md`      | SDD-aware skills + sprint-development                                                                                      | Engram / openspec topic-key naming conventions for SDD artifacts.                               |
| `references/typescript-patterns.md`        | `sprint-development`, code-writing skills                                                                                  | Fallback TS conventions when no project-specific dev guide exists.                              |

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

## Install model

This boilerplate is designed to be cloned in full. The workflow skills under `.claude/skills/` depend on foundation files that live at the repo root (`CLAUDE.md`, `.agents/`, `scripts/`, `package.json`, `tests/`) and on shared references under `agentic-dev-core/references/`. Installing only a subset of skills (e.g. copying one skill directory in isolation) leaves those skills without their dependencies and they will not function. If a downstream user has only the skills and not the rest of the repo, the supported path is to clone the full boilerplate repository and integrate it as a single unit. No per-skill scaffolding action is provided by this skill — the skill set is intentionally inseparable from the foundation.

---

## Out of scope

`agentic-dev-core` does not:

- Provide a bootstrap or init action — clone the full repo instead.
- Create or modify any files. It is a passive reference library.
- Create or modify `.context/` files (that belongs to `/agentic-dev-onboard` and `/project-foundation`).
- Generate or scaffold tests, fixtures, or test components (that belongs to `/unit-testing` and test-automation skills).
- Adapt the framework to a specific stack (that belongs to `/project-bootstrap`).
- Sync project-specific facts in `CLAUDE.md` (that belongs to `/sync-ai-memory`).
- Sync OpenAPI / API schemas (that's `bun run api:sync`).
- Run any external command — no `bun install`, no `git`, no `gh`.

If a user invokes this skill expecting a bootstrap action, route them to "clone the full boilerplate repository" — there is no per-skill scaffolding.
