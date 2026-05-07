# Decision tree — picking a chain strategy

> Cited from: `chained-pr/SKILL.md` decision-tree section.
> Single source of truth for which strategy fits which change shape. Other references (`stacked-to-main.md`, `feature-branch-chain.md`) describe the pattern; this file decides between them.

## The tree

Apply questions in order. The first definitive answer wins.

```
Q1: Is the change mostly mechanical?
    (rename, formatter, generated code, vendor / lockfile update, ESLint auto-fix sweep)
├─ Yes ────► size-exception
│           Requires user override + written rationale.
│           Reviewer spot-checks; CI signal is sufficient.
│
└─ No  ────► continue to Q2

Q2: Is the change linearly decomposable into 2-4 independent slices,
    each < 400 lines, where main/staging is safe after each merge?
├─ Yes ────► stacked-to-main
│           Each PR branched off staging, merged in order.
│           Best for: feature work with safe intermediate states.
│
└─ No  ────► continue to Q3

Q3: Does the change have shared scaffolding (new types, base classes, schemas)
    that multiple later slices depend on, where partial merges to staging
    would leave it broken?
├─ Yes ────► feature-branch-chain
│           Long-lived integration branch, child PRs target immediate parent.
│           Best for: big architectural change where staging must stay green.
│
└─ No  ────► RE-DECOMPOSE
            A large monolithic change that is neither mechanical nor linearly
            decomposable nor scaffolding-shaped is a code smell.
            Send the planner back to Stage 1 to split into smaller stories.
            This is NOT a chain-strategy problem — it's a planning problem.
```

## Trade-off table

| Strategy               | Best for                                      | Trade-off                                      | Reviewer experience                  |
| ---------------------- | --------------------------------------------- | ---------------------------------------------- | ------------------------------------ |
| `stacked-to-main`      | Linear feature work, safe intermediate states | Rebase pain if PRs land out of order           | Each PR self-contained; budget bound |
| `feature-branch-chain` | Big architectural change, shared scaffolding  | Integration-branch drift; final merge is large | Small slices targeting parent branch |
| `size-exception`       | Mechanical bulk (rename, format, generated)   | Skips line-by-line review; relies on CI signal | Spot-check + CI green                |

## Worked examples by change type

### Example 1: "Add empty states to dashboard" (UPEX-277)

- **Estimated lines**: 180 (3 modified files, ~50 lines each)
- **Risk**: Low. No chain decision required.
- **Strategy**: `pending` is fine; the forecast block does not gate Stage 2.

### Example 2: "Add new API endpoint + hook into dashboard" (UPEX-300, hypothetical)

- **Estimated lines**: 350 (1 new endpoint file ~120 lines, 4 modified UI files ~60 lines each)
- **Risk**: Medium. Planner can suggest `stacked-to-main` with two slices:
  - PR 1: API endpoint + types
  - PR 2: UI integration + tests
- Or proceed as a single PR (within budget).

### Example 3: "Rebuild search across UI + API + DB" (UPEX-450, hypothetical)

- **Estimated lines**: 1,800 (5 new schema files, 8 new service files, 12 modified UI files)
- **Risk**: High.
- **Q1**: Mechanical? **No** — it's a feature rewrite.
- **Q2**: Linearly decomposable with safe intermediate states? **No** — UI depends on the new service which depends on the new schema. Partial merges leave search broken.
- **Q3**: Shared scaffolding? **Yes** — new schemas and types are referenced by every later slice.
- **Strategy**: `feature-branch-chain` with tracker `feat/UPEX-450-search-rebuild` and 4 child PRs (schemas → service → UI → tests).

### Example 4: "Mass rename `User` → `Account` across 50 files" (UPEX-500, hypothetical)

- **Estimated lines**: 600 (50 modified files, ~12 lines each, mostly identifier swaps)
- **Risk**: High by line count, but…
- **Q1**: Mechanical? **Yes** — it's a rename. Cognitive load per line is near zero.
- **Strategy**: `size-exception`. PR description must include:
  ```
  Why size-exception: pure mechanical rename `User` → `Account` across 50 files.
  No logic changes. CI types + tests are the trust signal. Spot-check 2-3 random
  files for confidence; do not read line-by-line.
  ```

### Example 5: "Add 4 new feature flags + their UI surface" (hypothetical)

- **Estimated lines**: 700 (4 new flag definitions, 4 new UI sections, no shared scaffolding)
- **Risk**: High.
- **Q1**: Mechanical? **No** — each flag is a new feature.
- **Q2**: Linearly decomposable with safe intermediate states? **Yes** — each flag is independent. `staging` works with 1, 2, 3, or 4 flags landed.
- **Strategy**: `stacked-to-main` with 4 PRs, one per flag. (Or arguably 4 separate stories — that's a planning decision.)

### Example 6: "Refactor authentication module" (hypothetical)

- **Estimated lines**: 2,500 (rewrite of auth + all callers)
- **Risk**: High.
- **Q1**: Mechanical? **No** — it's a refactor with new auth flows.
- **Q2**: Linearly decomposable with safe intermediate states? **No** — partial migration leaves callers broken.
- **Q3**: Shared scaffolding? **Yes** — new auth contracts referenced by all callers.
- **But**: this is too big for a single chain. Estimated 2 weeks of integration-branch life. **Re-decompose**: split into "introduce new auth contracts (no callers migrated)" + "migrate caller group A" + "migrate caller group B" + "remove old auth". Each piece becomes its own story; some may be `stacked-to-main`, some `feature-branch-chain`.

## Edge cases

### "What if the change is mechanical AND has shared scaffolding?"

E.g. a codegen refresh that introduces new generated types AND requires manual updates to 3 hand-written files. Two options:

1. **Two PRs**: PR 1 is `size-exception` (the codegen output, marked `// generated`). PR 2 is `stacked-to-main` with the 3 hand-written file updates (within budget).
2. **One `size-exception` PR** with the 3 hand-written files highlighted in the description as "review these only; the rest is generated".

Pick option 1 if the hand-written changes are non-trivial; option 2 if they are 1-line each.

### "What if Q2 says yes but I have 5 slices?"

If 5+ stacked PRs is the answer, the story is too big. Re-decompose at the planning level. Stacked-to-main is for 2-4 slices; beyond that the calendar-time + rebase cost outweighs the benefit.

### "What if I'm not sure between Q2 and Q3?"

Ask: "If I merge slice 1 and stop, is `staging` still working as before?"

- Yes → `stacked-to-main`.
- No → `feature-branch-chain`.

### "What if the user wants `size-exception` for a non-mechanical change?"

Refuse. `size-exception` is reserved for mechanical / generated / vendor changes. Using it for cognitive-load changes defeats the entire purpose of the 400-line budget. Push back and re-decompose.

## Anti-patterns

- **Picking `feature-branch-chain` to "buy time."** If the only reason for a long-lived integration branch is "I haven't decided how to split this yet," go back to planning. The integration branch is not a holding cell.
- **Picking `size-exception` because the diff is "mostly" mechanical.** If even 20% of the diff is non-mechanical, the reviewer must read it; `size-exception` doesn't fit. Split into a `size-exception` PR (mechanical) + a normal PR (cognitive).
- **Stacking 6+ PRs.** Stop. Re-decompose.
- **Not picking a strategy and just opening one giant PR.** The whole point of the gate is to prevent this. The reviewer will skim, miss bugs, and approve out of fatigue. The 400-line budget exists for a reason.

## Hand-off

Once a strategy is chosen:

- `chained-pr/SKILL.md` returns the Chain Strategy Decision block to the caller.
- For auto-handoff: sprint-dev's forecast block in `implementation-plan.md` updates from `chain_strategy: pending` to the chosen value. Stage 2 unblocks.
- For manual invocation: the user reads the chosen pattern's reference (`stacked-to-main.md` or `feature-branch-chain.md`) for the executable runbook.
