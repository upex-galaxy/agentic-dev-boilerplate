# Stacked-to-Main pattern

> Cited from: `chained-pr/SKILL.md` strategy patterns.
> Use this pattern when the change is **linearly decomposable** into 2–4 self-contained slices, each `< 400` lines, where `main` (or `staging` per project Git Flow) safely contains slice N without slices N+1..M.

## Shape

Each PR merges directly to the project base branch (`staging` in this repo) in sequence. PR N+1 cannot open until PR N is merged.

```
staging ← PR 1: foundation       (N lines, < 400)
           └── PR 1 merges → staging is back to a stable state
staging ← PR 2: feature slice    (M lines, < 400)
           └── PR 2 merges → staging stable
staging ← PR 3: docs + tests     (K lines, < 400)
           └── PR 3 merges → done
```

## When to use

Picks this pattern when:

- The work decomposes into a clear sequence of independent deliverables (e.g. `add types → add service layer → wire UI → add tests`).
- Every intermediate state is safe — `staging`/`main` works after each merge.
- 2 to 4 slices is the sweet spot. More than 4 stacked PRs is a sign the story is too big and should be re-decomposed at the planning level.

Does NOT pick this pattern when:

- Slices share scaffolding that would leave `staging` in a broken state if only some slices land. Use `feature-branch-chain` instead.
- The change is mechanical bulk (rename, format). Use `size-exception`.

## Pros and cons

**Pros:**

- Each PR is reviewable on its own. No "do I have to read the previous 3 PRs to understand this one?" pain.
- `staging` always works. Continuous integration stays green between merges.
- Rollback is cheap: revert one PR, the previous slices remain.
- Reviewer cognitive load is bounded by the 400-line budget on every slice.

**Cons:**

- **Rebase pain if PRs land out of order.** If PR 2 is approved before PR 1, rebasing PR 2 onto post-merge `staging` (after PR 1) can produce conflicts.
- Calendar-time longer: slice 3 cannot open until slices 1 and 2 are merged. Reviewer round-trip latency dominates.
- Forces explicit task ordering at planning time; no parallelism across slices.

## Branch naming convention

Use the project ticket key + slice index + slug:

```
feat/UPEX-277-01-foundation
feat/UPEX-277-02-feature-slice
feat/UPEX-277-03-docs-tests
```

For tickets without a project key, fall back to:

```
feat/<slug>-01-foundation
feat/<slug>-02-feature-slice
feat/<slug>-03-docs-tests
```

## Workflow (executable runbook)

> This skill **does not run these commands** — it picks the pattern. The user (or `/git-flow`) executes the runbook below.

### PR 1: foundation

```bash
git checkout staging
git pull origin staging
git checkout -b feat/UPEX-277-01-foundation
# ... implement slice 1, atomic commits
git push -u origin feat/UPEX-277-01-foundation
gh pr create --base staging --title "feat(UPEX-277): foundation (1/3)"
```

PR description should include:

```markdown
## Chain Context

| Field         | Value           |
| ------------- | --------------- |
| Strategy      | stacked-to-main |
| Slice         | 1 of 3          |
| Base          | `staging`       |
| Review budget | <N> / 400 lines |

### Slices in this chain

1. (this PR) foundation
2. feature slice → opens after this merges
3. docs + tests → opens after slice 2 merges
```

### After PR 1 merges → open PR 2

```bash
git checkout staging
git pull origin staging
git checkout -b feat/UPEX-277-02-feature-slice
# ... implement slice 2
git push -u origin feat/UPEX-277-02-feature-slice
gh pr create --base staging --title "feat(UPEX-277): feature slice (2/3)"
```

### After PR 2 merges → open PR 3

```bash
git checkout staging
git pull origin staging
git checkout -b feat/UPEX-277-03-docs-tests
# ... implement slice 3
git push -u origin feat/UPEX-277-03-docs-tests
gh pr create --base staging --title "feat(UPEX-277): docs + tests (3/3)"
```

## Out-of-order merge handling

If reviewers approve PR 2 before PR 1 (rare but possible):

1. Do NOT merge PR 2 first. Stacked-to-main relies on order; merging out of sequence breaks the contract.
2. Wait for PR 1 to land. If PR 1 is blocked, escalate — do not work around the block by merging slice 2 against a base that doesn't have slice 1.
3. If absolutely necessary, switch the strategy to `feature-branch-chain` mid-flight (re-invoke `/chained-pr` to re-resolve).

## Linking PRs

Cross-link PRs in their descriptions so reviewers know the chain shape:

- PR 1 description: links to PR 2 and PR 3 (forward)
- PR 2 description: links back to PR 1 and forward to PR 3
- PR 3 description: links back to PR 1 and PR 2

Example footer block:

```markdown
**Chain**: PR 1 #100 → PR 2 #105 → PR 3 (this PR)
```

## Common mistakes

- **Opening all 3 PRs at once.** Defeats the point — reviewers see 3 in-flight PRs and don't know which to start with. Open sequentially.
- **Each slice exceeds 400 lines.** If after splitting the slices are still over budget, re-decompose at the planning level. Stacked-to-main does not buy size; it buys ordering + isolation.
- **Mixing scope across slices.** Slice 1 should be "foundation only" — types, scaffolding, no feature logic. If slice 1 contains feature logic, it isn't foundation.
- **Skipping the chain context block in PR description.** Without it, the reviewer doesn't know this is part of a chain and may approve in isolation, missing dependencies.

## Hand-off

Once the chain is approved:

- `/git-flow` runs the merge sequence (one PR at a time, verify CI green between each).
- `/sprint-dev` Stage 4 deploys to staging after the LAST slice merges (not after each — a chain ships as one feature).
- Jira transition `In Review → Ready For QA` happens after the last slice merges.
