# `.context/` — Project Memory the AI Reads

This directory is what makes a fresh AI session productive on day one. Every file here is either **auto-generated** by a script or skill, or **source-of-truth** that downstream tooling regenerates from.

## Structure

```
.context/
├── README.md                      This file — index + generator map
│
├── _framework/                    Framework infrastructure (auto-generated + source-of-truth)
│   ├── context-engineering.md     Repo architecture map                (manual)
│   ├── system-prompt.md           Source-of-truth template for CLAUDE.md (manual)
│   ├── skill-registry.md          Compact-rules cache for skills        (scripts/build-skill-registry.ts)
│   └── testing-capabilities.json  Testing tooling cache                 (scripts/detect-testing-capabilities.ts; gitignored)
│
├── discovery/                     Outputs of /project-foundation Phase 4 — Discovery
│   ├── business-data-map.md       Entities, flows, state machines
│   ├── api-architecture.md        Auth model, critical endpoints, data flows
│   └── project-dev-guide.md       How to build features in this codebase
│
├── idea/                          Output of /project-foundation Phase 1 — Constitution
│   └── README.md                  Phase placeholder (see file)
│
├── PRD/                           Output of /project-foundation Phase 2 — Product Requirements
│   └── README.md                  Phase placeholder (see file)
│
├── SRS/                           Output of /project-foundation Phase 2 — Software Requirements
│   └── README.md                  Phase placeholder (see file)
│
└── PBI/                           Outputs of /product-management + /sprint-dev (per epic / per ticket)
    └── README.md                  Backlog layout (see file)
```

## Who generates what

Every file in `.context/` has an owner. Do not edit auto-generated files by hand — re-run the owner.

| File / Pattern                                      | Owner                                   | Notes                                                  |
| --------------------------------------------------- | --------------------------------------- | ------------------------------------------------------ |
| `_framework/context-engineering.md`                 | Manual (human-curated)                  | Repo architecture map                                  |
| `_framework/system-prompt.md`                       | Manual (human-curated)                  | Mirrored into CLAUDE.md by `/refresh-ai-memory`        |
| `_framework/skill-registry.md`                      | `bun scripts/build-skill-registry.ts`   | Re-run when skills change                              |
| `_framework/testing-capabilities.json`              | `bun scripts/detect-testing-capabilities.ts` | Re-run during `/agentic-dev-core` bootstrap            |
| `discovery/business-data-map.md`                    | `/project-foundation` (Phase 4)         | Re-run if data model pivots                            |
| `discovery/api-architecture.md`                     | `/project-foundation` (Phase 4)         | Re-run if API auth or topology changes                 |
| `discovery/project-dev-guide.md`                    | `/project-foundation` (Phase 4)         | Re-run if codebase architecture changes                |
| `idea/*.md`                                         | `/project-foundation` (Phase 1)         | Business model + market context                        |
| `PRD/*.md`                                          | `/project-foundation` (Phase 2)         | Executive summary, personas, MVP scope, user journeys  |
| `SRS/*.md`                                          | `/project-foundation` (Phase 2)         | Functional / non-functional / architecture / API specs |
| `PBI/{epic-slug}/epic.md`                           | `/product-management` (epic creation)   | Topic key: `pbi/{epic-slug}/epic`                      |
| `PBI/{ticket}/spec.md`                              | `/product-management` (AC refinement)   | Topic key: `pbi/{ticket}/spec`                         |
| `PBI/{ticket}/impl-plan.md`                         | `/sprint-dev` Stage 1                   | Topic key: `pbi/{ticket}/impl-plan`                    |
| `PBI/{ticket}/review.md`                            | `/sprint-dev` Stage 3                   | Topic key: `pbi/{ticket}/review`                       |
| `PBI/{ticket}/compliance-matrix.md`                 | `/sprint-dev` Stage 3                   | Topic key: `pbi/{ticket}/compliance-matrix`            |
| `PBI/{ticket}/bug-fix.md`                           | `/sprint-dev` Stage 2 (bug-fix flow)    | Topic key: `pbi/{ticket}/bug-fix`                      |
| `PBI/{ticket}/edge-cases.md`                        | `/product-management` (enumeration)     | Topic key: `pbi/{ticket}/edge-cases`                   |

Full topic-key conventions: `.claude/skills/agentic-dev-core/references/topic-key-conventions.md`.

## Minimum viable context

A brand-new project that wants productive AI sessions should produce, in order:

1. `/agentic-dev-core` — bootstraps `.agents/`, scripts, CLAUDE.md, then runs `detect-testing-capabilities`.
2. `/project-foundation` — Constitution → PRD → SRS → Discovery outputs.
3. `/product-management` — Seed initial backlog (epics + foundational stories) under `PBI/`.

After that, `/sprint-dev` operates per ticket and fills in `PBI/{ticket}/*` files as work progresses.

## References

- Repo architecture: `_framework/context-engineering.md`
- Project memory: `CLAUDE.md` (root) — generated/refreshed via `/refresh-ai-memory`
- Skill cookbook: `.claude/skills/*/SKILL.md` (also indexed in `_framework/skill-registry.md`)
- Topic keys for engram: `.claude/skills/agentic-dev-core/references/topic-key-conventions.md`
