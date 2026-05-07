# Feature-Branch-Chain pattern

> Cited from: `chained-pr/SKILL.md` strategy patterns.
> Use this pattern when the change has **shared scaffolding** (new types, new base classes, new schemas) that multiple later slices depend on, where partial merges to `main`/`staging` would leave it in a broken state.

## Shape

A long-lived integration branch (`feat/<key>-<slug>`) is cut from the project base branch. N child PRs each merge INTO the integration branch (not into the base). When the integration branch is complete, a single final PR merges integration → base.

```
staging ← feat/UPEX-300-search-rebuild              (integration branch, draft, no-merge)
            └── feat/UPEX-300-01-types-and-schemas  (PR 1, targets integration)
                 └── feat/UPEX-300-02-service       (PR 2, targets PR 1's branch)
                      └── feat/UPEX-300-03-ui       (PR 3, targets PR 2's branch)
                           └── feat/UPEX-300-04-tests (PR 4, targets PR 3's branch)
            └── (after all child PRs merged) → integration → staging  (final PR)
```

## When to use

Picks this pattern when:

- The change has shared scaffolding that multiple slices depend on (e.g. a new domain model used by several services).
- Partial merges to `staging`/`main` would leave it broken (e.g. service layer references types that the UI hasn't migrated to yet).
- The work is large enough that 2-4 stacked-to-main PRs cannot bound it.
- The team wants reviewable small slices but cannot accept partial deliverables landing in `staging`.

Does NOT pick this pattern when:

- The change can be linearly ordered with safe intermediate states. Use `stacked-to-main` instead — simpler, fewer moving parts.
- The change is mechanical bulk. Use `size-exception`.
- The integration branch would live for more than ~2 weeks. Long-lived integration branches drift and become merge hell. Re-decompose into shippable stories.

## Pros and cons

**Pros:**

- Child PRs review small slices (each `< 400` lines).
- Integration branch isolates the risk of partial merges. `staging`/`main` only sees the complete feature.
- Reviewers can approve slices in any order — they target the integration branch, not `staging`.
- Final merge to `staging` is a single, well-bounded event.

**Cons:**

- **Integration branch drift.** Long-lived branches diverge from `staging`. Periodic rebases (or merge-from-staging) are required.
- Final PR is large by definition (sum of all slices). Reviewer is supposed to spot-check, not re-review — but the GitHub UI shows the full diff and that can be intimidating.
- More branch overhead. 5+ branches for a single feature.
- Child PRs target the **immediate parent branch**, not the tracker. Targeting the tracker directly produces inflated diffs that show changes from earlier slices.

## Branch naming convention

Hierarchical: `feat/<key>-<slug>` for the tracker, `feat/<key>-NN-<slug>` for child PRs.

```
# Tracker (integration branch)
feat/UPEX-300-search-rebuild

# Child branches (targeting one another in sequence)
feat/UPEX-300-01-types-and-schemas      # targets feat/UPEX-300-search-rebuild
feat/UPEX-300-02-service                # targets feat/UPEX-300-01-types-and-schemas
feat/UPEX-300-03-ui                     # targets feat/UPEX-300-02-service
feat/UPEX-300-04-tests                  # targets feat/UPEX-300-03-ui
```

**Critical rule**: every child PR targets the **immediate previous child branch**, never the tracker directly. Targeting the tracker shows inflated diffs that include all upstream slices.

## Workflow (executable runbook)

> This skill **does not run these commands** — it picks the pattern. The user (or `/git-flow`) executes the runbook below.

### Step 0: cut the integration branch

```bash
git checkout staging
git pull origin staging
git checkout -b feat/UPEX-300-search-rebuild
git push -u origin feat/UPEX-300-search-rebuild

# Optional: open a draft "tracker PR" on GitHub to give the chain a discussion home
gh pr create --base staging --draft \
  --title "feat(UPEX-300): search rebuild [TRACKER — do not merge]" \
  --body "Tracker PR for the search-rebuild chain. Do not merge until all child PRs land."
```

### PR 1: types and schemas (targets tracker)

```bash
git checkout feat/UPEX-300-search-rebuild
git checkout -b feat/UPEX-300-01-types-and-schemas
# ... implement
git push -u origin feat/UPEX-300-01-types-and-schemas
gh pr create --base feat/UPEX-300-search-rebuild \
  --title "feat(UPEX-300): types and schemas (1/4)"
```

### PR 2: service (targets PR 1's branch)

```bash
git checkout feat/UPEX-300-01-types-and-schemas
git checkout -b feat/UPEX-300-02-service
# ... implement
git push -u origin feat/UPEX-300-02-service
gh pr create --base feat/UPEX-300-01-types-and-schemas \
  --title "feat(UPEX-300): service (2/4)"
```

### PRs 3, 4: same pattern, each targets the immediate parent

```bash
# PR 3 targets PR 2's branch
gh pr create --base feat/UPEX-300-02-service \
  --title "feat(UPEX-300): ui (3/4)"

# PR 4 targets PR 3's branch
gh pr create --base feat/UPEX-300-03-ui \
  --title "feat(UPEX-300): tests (4/4)"
```

### Final: collapse the chain into the tracker, then merge to staging

After all child PRs are approved and merged into their parents (the merges propagate up the chain to the tracker):

```bash
git checkout feat/UPEX-300-search-rebuild
git pull origin feat/UPEX-300-search-rebuild
# Verify the tracker now contains the cumulative feature
git diff staging...feat/UPEX-300-search-rebuild

# Open the final PR: tracker → staging
gh pr ready  # un-draft the tracker PR if it was draft
# (or open a fresh PR if no tracker PR existed)
```

## PR description template

Each child PR should include the chain context block:

```markdown
## Chain Context

| Field         | Value                                |
| ------------- | ------------------------------------ |
| Strategy      | feature-branch-chain                 |
| Slice         | 2 of 4                               |
| Base          | `feat/UPEX-300-01-types-and-schemas` |
| Tracker       | `feat/UPEX-300-search-rebuild`       |
| Review budget | <N> / 400 lines                      |

### Chain overview
```

staging
└── feat/UPEX-300-search-rebuild (tracker)
└── 01-types-and-schemas #100 ✓ approved
└── 📍 02-service #101 (this PR)
└── 03-ui (queued)
└── 04-tests (queued)

```

```

## Drift management

The tracker can lag `staging` if other features merge in. Rebase the tracker periodically:

```bash
git checkout feat/UPEX-300-search-rebuild
git pull origin staging --rebase
# Resolve conflicts if any
git push --force-with-lease
```

Then rebase open child PRs onto the updated parent:

```bash
git checkout feat/UPEX-300-02-service
git pull origin feat/UPEX-300-01-types-and-schemas --rebase
git push --force-with-lease
```

> **Force-push warning**: child branches are short-lived and only have one author, so `--force-with-lease` is safe. Never `--force-push` to `staging` or `main`.

## Common mistakes

- **Child PR targets the tracker directly.** Inflates the diff to include all upstream slices. Target the immediate parent branch only.
- **Merging child PRs to `staging`.** Defeats the whole pattern — partial feature lands in `staging` in a broken state. Child PRs ALWAYS target their parent branch (or the tracker for PR 1).
- **Letting the integration branch live too long.** > 2 weeks = drift hell. If the chain is taking that long, decompose into separately shippable stories.
- **No tracker PR.** Without a draft tracker PR, there's no discussion home for the chain as a whole. Some teams use a Jira ticket for this; either is fine, but pick one.
- **Skipping the final tracker → staging PR.** The chain is incomplete until the tracker merges. Don't declare done after the last child merges.

## Hand-off

Once the chain is approved and child PRs are merged up to the tracker:

- `/git-flow` runs the final tracker → staging merge.
- `/sprint-dev` Stage 4 deploys to staging after the tracker merges (not after each child).
- Jira transition `In Review → Ready For QA` happens after the tracker merges to `staging`.
