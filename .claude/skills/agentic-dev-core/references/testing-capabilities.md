# Testing Capabilities Cache

> Cited by: `unit-testing`, `sprint-dev`. Loaded on demand when those skills need to know what test runners, e2e frameworks, type-checking, or lint tooling the project supports — without re-running a `package.json` scan on every dispatch.

## Purpose

Downstream workflow skills (`unit-testing` decides whether to enforce TDD red-green; `sprint-dev` decides whether its quality gate runs `bun run typecheck` / `bun run lint`) need a yes/no answer on what the project supports. Re-detecting this on every invocation is wasteful and inconsistent. The cache is a single JSON file regenerated only when `/agentic-dev-core` runs, so consumers read it as a static fact.

## Cache schema

The cache lives at `.context/testing-capabilities.json` (gitignored or not — that's the project's call; the file is reproducible). Schema:

```jsonc
{
  // Unit/integration test runner detected from package.json deps.
  // null = neither vitest nor jest is installed.
  "runner": "vitest" | "jest" | null,

  // E2E framework detected from package.json deps. null = no playwright dep.
  "e2e": "playwright" | null,

  // true when tsconfig.json exists AND a typecheck script exists in package.json
  // (heuristics: literal "typecheck" key, or a script value containing
  // "tsc --noEmit"). false otherwise.
  "typecheck": true,

  // true when an ESLint config exists (.eslintrc* or eslint.config.*) AND a
  // "lint" script exists in package.json. false otherwise.
  "lint": true,

  // true when the project follows strict TDD (red-green enforced before code).
  // Resolved via the priority chain documented below.
  "strict_tdd": true,

  // ISO-8601 UTC timestamp of the last detection run.
  "detected_at": "2026-05-07T12:34:56.000Z"
}
```

## Detection algorithm

`scripts/detect-testing-capabilities.ts` performs the detection and writes the cache. The algorithm:

| Field        | Source                                                   | Detection rule                                                                                                                                                                                                        |
| ------------ | -------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `runner`     | `package.json` → `dependencies` ∪ `devDependencies`      | `"vitest"` if the `vitest` package is declared. Otherwise `"jest"` if `jest` is declared. Otherwise `null`. Vitest wins ties because monorepos sometimes carry both during a migration; vitest is the modern default. |
| `e2e`        | same                                                     | `"playwright"` if `@playwright/test` or `playwright` is declared. Otherwise `null`.                                                                                                                                   |
| `typecheck`  | `tsconfig.json` existence + `package.json` → `scripts`   | `true` only when both: (a) `tsconfig.json` exists at the repo root; (b) the `scripts` object has a key named `typecheck` OR any script value contains the substring `tsc --noEmit`. Otherwise `false`.                |
| `lint`       | ESLint config existence + `package.json` → `scripts`     | `true` only when both: (a) any of `.eslintrc`, `.eslintrc.{js,cjs,mjs,json,yaml,yml}`, `eslint.config.{js,cjs,mjs,ts}` exists; (b) the `scripts` object has a `lint` key. Otherwise `false`.                          |
| `strict_tdd` | priority chain (CLAUDE.md > project.yaml > runner-based) | See below.                                                                                                                                                                                                            |

### `strict_tdd` priority chain

Resolved in this order; first hit wins:

1. **CLAUDE.md marker** (highest priority — explicit user override). The script greps `CLAUDE.md` (and follows it as a symlink, e.g. to `AGENTS.md`) for an HTML comment marker:
   - `<!-- strict_tdd: true -->` → `strict_tdd = true`
   - `<!-- strict_tdd: false -->` → `strict_tdd = false`
2. **`.agents/project.yaml`** → `testing.strict_tdd`. If present and a boolean, that's the answer.
3. **Runner-based fallback.** If a test runner was detected (`runner !== null`) → `strict_tdd = true`. Otherwise → `strict_tdd = false`. Rationale: a project with a runner installed has the infrastructure for TDD; absence of a runner makes red-green meaningless.

Ties go to the highest-priority signal. If `CLAUDE.md` says `false` but `project.yaml` says `true`, the marker wins — the user added the marker on purpose.

## Cache lifecycle

| Event                           | Action                                                                                                                             |
| ------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------- |
| `/agentic-dev-core` is invoked      | The bootstrap step runs `bun scripts/detect-testing-capabilities.ts`, which (re)writes `.context/testing-capabilities.json`.       |
| Consumer skill needs the cache  | Read the JSON file directly. Treat as static. Do NOT re-detect.                                                                    |
| Cache is missing                | Tell the user to run `/agentic-dev-core`. Do not silently re-detect — that defeats the purpose of caching.                             |
| `package.json` changes mid-flow | Cache becomes stale by definition. Stale cache is preferred to inconsistent re-detection; user re-runs `/agentic-dev-core` when ready. |

The script never deletes anything. It only writes `.context/testing-capabilities.json` (creating `.context/` if missing).

## Consumers

| Skill          | Reads which fields?                                                                                                                                                           |
| -------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `unit-testing` | `runner` (chooses `vitest` vs `jest` syntax in scaffolds), `strict_tdd` (whether the red-green-refactor flow is enforced or treated as a soft recommendation).                |
| `sprint-dev`   | `typecheck` + `lint` (whether the quality gate at code-review time invokes `bun run typecheck` / `bun run lint`), `e2e` (whether to mention E2E smoke before staging deploy). |

Future skills that depend on test capabilities should add a row here when they start consuming the cache.

## Out of scope

- This cache does not record _which test files exist_ (that's a per-task search).
- It does not record formatter detection (Prettier presence is independent of test capability).
- It does not record CI-only tools (those are inferred from `.github/workflows/` when needed).
