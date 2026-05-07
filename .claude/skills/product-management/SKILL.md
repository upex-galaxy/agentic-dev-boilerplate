---
name: product-management
description: "Orchestrates continuous product management work — initial backlog seed from PRD, incremental feature addition, epic creation, story refinement (INVEST + 3-amigos), AC quality refinement (Gherkin), and edge-case enumeration. Triggers on: 'create epic', 'crear épica', 'agregar historia al backlog', 'add feature', 'refine acceptance criteria', 'enumerar edge cases', 'INVEST a esta historia', '3 amigos', 'story refinement', 'product backlog seed', 'epic creation', 'ready for development checklist'. Do NOT use for: foundational product definition (use `/project-foundation`), infrastructure scaffolding (use `/project-bootstrap`), per-story implementation (use `/sprint-dev`), unit testing (use `/unit-testing`), or formal QA test cases / TMS workflows (out of scope, see `agentic-qa-boilerplate`)."
license: MIT
compatibility: [claude-code, copilot, cursor, codex, opencode]
phase: management
---

# Product Management

Orchestrates the continuous product management lifecycle: turning a fresh PRD into an initial Jira backlog, adding new features incrementally as the product evolves, structuring epics, and refining individual stories until they are truly "ready for development". Unlike `/project-foundation` (one-time, foundational), product management is **ongoing work** — re-invoke this skill any time backlog work surfaces.

## When to use

Use this skill whenever you are doing backlog or refinement work after the foundational PRD/SRS exists:

- A new feature or epic needs to be added to the backlog
- A story has rough or ambiguous acceptance criteria that need sharpening
- A story needs INVEST validation or a 3-amigos session before development starts
- You're systematically enumerating edge cases / failure modes for a feature
- You're seeding the very first product backlog from a freshly minted PRD

The skill is reference-driven: each workflow points to a specific reference file with the exact protocol.

## Pre-requisites

- `/project-foundation` should have produced `.context/PRD/` and `.context/SRS/` (required for the initial backlog-seed workflow; useful context for all others)
- `.agents/project.yaml` populated with `{{PROJECT_KEY}}`, `{{ISSUE_TRACKER}}`, `{{JIRA_URL}}` — run `/init-project` if missing
- Atlassian / Jira tooling reachable (Atlassian CLI `acli` preferred, MCP Atlassian as fallback) for any workflow that writes to Jira

## Main workflows

### A. Initial backlog seeding (one-time, from PRD)

When you have a fresh PRD/SRS and zero issues in Jira, generate the initial backlog tree (epics + their foundational stories) and persist it both in Jira and under `.context/PBI/`.

Read `references/product-backlog-seed.md`.

Output: `.context/PBI/epic-tree.md` + per-epic folders + initial stories created in Jira under `{{PROJECT_KEY}}`.

### B. Incremental feature addition (continuous)

When a new feature emerges mid-flight (PO ask, market opportunity, post-MVP work, customer feedback). The reference first analyzes complexity — single story, full epic, or multi-epic — then routes accordingly.

Read `references/add-feature.md`.

Output: new epic or stories appended to the backlog, with the complexity decision documented.

### C. Epic creation (from scratch or from add-feature workflow)

When you need to formally structure a new epic — naming, scope boundaries, decomposition into stories, traceability back to PRD goals.

Read `references/epic-creation.md`.

Output: epic folder under `.context/PBI/{epic-slug}/` + `epic.md` + decomposed child stories.

### D. Story refinement (per story)

When a story exists in Jira but is not yet "ready for development". Validates INVEST, optionally runs a 3-amigos session, ensures story slicing is appropriate, and confirms the ready-for-development checklist passes.

Read `references/story-refinement.md`.

Output: refined story with INVEST validated, optional 3-amigos notes appended, ready-for-dev checklist confirmed.

### E. AC quality refinement (per story)

When a story has rough acceptance criteria — vague conditions, missing data, no error scenarios, no boundaries — and you need to sharpen them into concrete Gherkin scenarios (Scenario / Given–When–Then).

Read `references/acceptance-criteria.md`.

Output: refined AC in Gherkin with concrete data, error scenarios, and boundary scenarios; ambiguities surfaced as open questions if not resolvable from PRD/SRS.

### F. Edge-case enumeration (per feature/epic)

When designing or refining a feature and you need to systematically enumerate failure modes, boundary conditions, integration risks, and unusual user paths. Includes the decision rule for what becomes AC vs what stays as a test-only concern.

Read `references/edge-cases-enumeration.md`.

Output: cataloged edge cases with criticality + decision (high-criticality + clearly-defined behavior → promote into AC; otherwise → test-only, hand off to QA).

## Specific tasks — which reference to read

| User intent                                                                             | Read                                   |
| --------------------------------------------------------------------------------------- | -------------------------------------- |
| "create initial backlog from PRD" / "seed the product backlog"                          | `references/product-backlog-seed.md`   |
| "add new feature" / "agregar feature al backlog" / "incremental story creation"         | `references/add-feature.md`            |
| "create epic" / "crear épica" / "epic structure" / "epic vs feature flag"               | `references/epic-creation.md`          |
| "refine this story" / "INVEST" / "ready for development" / "3 amigos" / "story slicing" | `references/story-refinement.md`       |
| "refine AC" / "acceptance criteria quality" / "Gherkin scenarios" / "AC ambiguities"    | `references/acceptance-criteria.md`    |
| "enumerate edge cases" / "boundary scenarios" / "failure modes" / "what could go wrong" | `references/edge-cases-enumeration.md` |

## Hand-offs

When PM artifacts are ready, the natural downstream skills are:

- **Per-story implementation** → `/sprint-dev` (planning → code → review → deploy loop)
- **TDD on a single function** → `/unit-testing` (composable inside `/sprint-dev`)
- **Formal QA test cases, exploratory testing, automation, regression** → out of scope here; see the sister boilerplate `agentic-qa-boilerplate` for `sprint-testing`, `test-documentation`, `test-automation`, and related QA workflows

## Variables consumed

This skill uses standard `.agents/project.yaml` variables resolved at runtime:

- `{{PROJECT_KEY}}` — Jira project key (e.g., `MYM`, `UPEX`)
- `{{ISSUE_TRACKER}}` — issue tracker name (typically `Jira`)
- `{{JIRA_URL}}` — workspace URL

If unset, run `/init-project` first.

## Notes

- Refinement is a **continuous activity**, not a one-time gate. Re-invoke this skill any time AC questions emerge, edge cases surface during design, or a story is found to violate INVEST mid-sprint.
- The 3-amigos protocol is **optional** in story refinement — recommended for stories larger than ~5 SP, integration-heavy stories, or anything touching unfamiliar areas of the system.
- Edge cases that don't make it into AC are not lost — they live in QA test cases (out of scope here; documented in `agentic-qa-boilerplate`).
- Orchestration: for parallel research tasks (e.g., competitive analysis on a feature, prior-art review, persona impact study), dispatch via the briefing template at `.claude/skills/init-project/references/briefing-template.md`.
