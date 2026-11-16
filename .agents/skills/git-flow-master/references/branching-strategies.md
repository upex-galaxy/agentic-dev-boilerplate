# Branching strategies: catalogue, detection, trade-offs

Seven strategies are supported. For each one this file says where new branches start, where PRs target, which branches are protected and how a release promotes. It also holds the detection algorithm, the chained-PR decision tree, the comparison matrix and the `git_strategy` field values each strategy writes.

## Table of contents

1. [`solo-main`](#solo-main)
2. [`main-integration`](#main-integration)
3. [`enterprise`](#enterprise)
4. [`trunk-based`](#trunk-based)
5. [`gitflow`](#gitflow)
6. [`github-flow`](#github-flow)
7. [`gitlab-flow`](#gitlab-flow)
8. [Detection algorithm](#detection-algorithm)
9. [Chained-PR decision tree](#chained-pr-decision-tree)
10. [Strategy comparison matrix](#strategy-comparison-matrix)
11. [git_strategy field rules (per strategy)](#git_strategy-field-rules-per-strategy)

A direct push to any protected branch below is gated by `git_strategy.policy.direct_push_to_protected` (SKILL.md 3.3): `allowed` pushes, `confirm` asks, `forbidden` routes through a PR.

---

## `solo-main`

One long-lived branch (`main`), and all work lands on it directly. Ephemeral branches appear only when the user wants a PR for documentation or a CI gate. It fits solo projects, prototypes, scratch repos, personal sites and throwaway demos.

Detection signals:

- `git branch -a` returns only `main` (or `master`) and no other long-lived remote branch.
- `git log --format='%ae' | sort -u` shows a single contributor.
- No `staging`, `dev` or `develop` branch upstream.

New work branches from `main`. PRs target `main` when they are used at all, and solo-main often skips them. `main` is the only protected branch. The release model is continuous: every push is a release.

Trade-offs: there is no branching overhead and feedback is fast, but there is no review gate, `main` can break between commits, and risky work has no isolation.

---

## `main-integration`

`main` (production) plus one integration branch (`staging`, `dev` or `develop`). Features merge to integration, and integration promotes to `main` only on release. It fits small teams (2 to 10 people), one-product repos and CD pipelines that promote `staging` to `main` on a cadence.

Detection signals:

- `git branch -a` shows `main` (or `master`) and exactly one of `{staging, dev, develop, integration}` upstream.
- Branch protection rules on both branches, when `gh api` can see them.
- `AGENTS.md` mentions both branches in a "Git Workflow" section.

New work branches from the integration branch (for example `staging`), and PRs target it by default. Promotion PRs (`staging` to `main`) target `main`. Both `main` and the integration branch are protected.

Release model: the integration branch is always deployable to a staging environment, and `main` deploys to production on a release event.

Trade-offs: one review gate, a staging environment that matches production, and a simple rollback (revert the promotion PR). The costs are integration drift when releases are rare, and a double merge on promotion (cherry-pick, merge, rebase or re-PR).

The `git_strategy:` block in `.agents/project.yaml` records it as:

```yaml
git_strategy:
  strategy: main-integration
  branches:
    production: main
    integration: staging
```

---

## `enterprise`

`main` plus integration, many short-lived `feature/*` and `fix/*` branches, and `release/*` and `hotfix/*` for production fixes. It may add environment branches (`pre-production`, regional branches) when the deployment topology needs them. It fits 10 or more contributors, several parallel features, regulated environments (compliance, audit) and products with explicit release cycles.

Detection signals:

- `main`, integration and active `feature/*` or `release/*` branches in `git branch -a`.
- A non-trivial `.github/CODEOWNERS`.
- `gh api repos/.../branches/main/protection` returns rules with required reviewers and status checks.
- Long-lived `release/*` or `hotfix/*` branches.

Where work starts and where it goes:

| Branch | Branches from | PR base |
| --- | --- | --- |
| `feature/*`, `fix/*` | integration | integration |
| `hotfix/*` | `main` (cherry-pick back to integration after the merge) | `main` |
| `release/X.Y.Z` | integration (cut for stabilisation) | `main` (with a back-merge to integration) |

Protected: `main`, integration and `release/*`.

Release model: a release branch stabilises, and its PR merges to `main` and triggers the production deploy.

Trade-offs: parallel work stays isolated, stabilising on a release branch avoids a feature freeze on integration, and the hotfix path does not depend on feature work. The costs are branching overhead, back-merges that are easy to forget, and release-branch coordination.

---

## `trunk-based`

The trunk (`main`) is the only long-lived branch. Short-lived branches (under a day, often under an hour) merge fast, incomplete features hide behind feature flags, and a CI gate on every commit is required. It fits high-velocity teams with strong CI/CD, feature-flag infrastructure and a mature test pyramid (the DORA elite-performer pattern).

Detection signals:

- `git branch -a` shows `main` plus only ephemeral feature branches, most of them a day old or less.
- High commit frequency on `main` (`git log --since='7 days ago' --pretty=oneline | wc -l` above 20 in a small team).
- A feature-flag system in `package.json` or config (LaunchDarkly, Unleash, custom).
- `.github/workflows/` enforces CI on every PR.

New work branches from `main`, and PRs target `main`. Direct commits to `main` for tiny changes are acceptable in pure trunk-based. `main` is the only protected branch, and the CI gate is the protection: required status checks before merge.

Release model: continuous deployment from `main`, with feature flags separating deploy from release.

Trade-offs: minimal branching overhead, rare conflicts (the branches are short-lived), and CD fits naturally. It needs feature flags and strong CI, and it has no obvious place for long-running spikes.

---

## `gitflow`

Vincent Driessen's classic (2010): `main` (releases only), `develop` (integration), `feature/*` off `develop`, `release/*` off `develop` that merges to `main`, and `hotfix/*` off `main`. It fits products with explicit, infrequent versioned releases (desktop apps, libraries with semver, embedded software). It is mostly legacy, and Driessen himself says most teams should prefer trunk-based or GitHub Flow.

Detection signals:

- A `develop` branch upstream (the unique signal).
- Long-lived `release/*` or `hotfix/*` branches.
- A `.gitflow` config file (rare).
- Merge commits such as `Merge branch 'release/X.Y.Z'` in the history.

Where work starts and where it goes:

| Branch | Branches from | PR base |
| --- | --- | --- |
| `feature/*` | `develop` | `develop` |
| `release/*` | `develop` | `main` (then back-merge to `develop`) |
| `hotfix/*` | `main` | `main` (then back-merge to `develop`) |

Protected: `main`, `develop` and every `release/*`.

Release model: cut `release/X.Y.Z` from `develop`, stabilise it, merge to `main` and to `develop`, then tag.

Trade-offs: explicit release stabilisation, an independent hotfix path and good documentation. It is heavy, merges are complex, back-merge errors are common, and it suits CD badly.

---

## `github-flow`

`main` is always deployable. A `feature/*` branch becomes a PR, gets a review, merges and deploys. There is no staging or develop branch. It fits web apps with continuous deployment, GitHub-native teams and projects with one production environment.

Detection signals:

- `git branch -a` shows `main` and `feature/*` (or unprefixed feature branches) only.
- No `staging`, `dev` or `develop` upstream.
- `.github/workflows/` deploys on push to `main`.
- `CONTRIBUTING.md` says "branch off main, open PR".

New work branches from `main`, and PRs target `main`. `main` is the only protected branch, with required status checks and at least one review.

Release model: every merge to `main` deploys. Tags are optional and used for marketing versions.

Trade-offs: it is simple, matches CD and has one clear source of truth. A staging environment takes extra effort, and rollback is a revert PR.

---

## `gitlab-flow`

GitHub Flow plus environment branches (`pre-production`, `production`, regional ones such as `production-eu`). Code flows one way: `main` to `pre-production` to `production`. It fits teams that want a deployment pipeline with promotion gates without GitFlow's release-branch complexity, and it is common in GitLab-hosted projects.

Detection signals:

- A `.gitlab-ci.yml` that references several environments.
- `git branch -a` shows `main`, `pre-production` (or `staging`) and `production`.
- Linear merge history, with no back-merges.
- A GitLab repo, though the pattern is portable.

New work branches from `main`, and feature MRs target `main`. Promotion MRs go `main` to `pre-production`, then `pre-production` to `production`. Every environment branch (`main`, `pre-production`, `production`) is protected.

Release model: cherry-pick or fast-forward from `main` through the environment branches.

Trade-offs: an explicit promotion path that matches the deployment pipeline, and no back-merge complexity. It means extra branches to maintain, and promotion MRs add ceremony.

---

## Detection algorithm

Run the steps in order and stop at the first definitive answer.

```
1. Read the `git_strategy:` block in `.agents/project.yaml`. If `git_strategy.strategy`
   is non-null, use its `strategy:` + `branches:` + `decisions:` + `policy:` fields.
   (A recorded decision wins.)

2. Inspect `git branch -a`:
   - Only `main` (or `master`) → solo-main.
   - `main` + exactly one of {staging, dev, develop, integration} → main-integration.
     Record the integration branch name.
   - `main` + `develop` (Driessen-style) → check for `release/*` or `hotfix/*`.
     If present → gitflow. If only `develop` and `feature/*` → main-integration with develop.
   - `main` + `pre-production` and/or `production` → gitlab-flow.

3. Inspect `git log` and `git branch -a` together:
   - Many short-lived ephemeral branches (most under a day) + high `main` commit frequency
     + feature-flag config detected → trunk-based.
   - Many `feature/*` + long-lived `release/*` → enterprise.

4. Inspect repo metadata:
   - `.gitlab-ci.yml` with environment stages → gitlab-flow.
   - `.github/CODEOWNERS` non-trivial + protection rules visible → enterprise.
   - `.github/workflows/deploy.yml` triggered on push to main, no other long-lived
     branches → github-flow.

5. Fallback: ask the person. Show the seven options as a numbered list
   with one-line descriptions, in their language, and let them pick.
   With nobody to ask, see "With nobody at the keyboard" in strategy-setup.md.
```

After the strategy is resolved, persist it to the `git_strategy:` block in `.agents/project.yaml`, in place:

```yaml
git_strategy:
  strategy: VALUE
  branches:
    production: main
    integration: NAME            # null when the strategy has none
    ephemeral_pattern: null
  description: >
    This project uses the `VALUE` flow: <one-paragraph description for humans>.
```

---

## Chained-PR decision tree

When a planned change estimates more than 400 changed lines (additions plus deletions), walk this tree before opening PRs.

```
Q1: Is the change mostly mechanical (rename, formatter, generated code, vendor update)?
├─ Yes → size-exception (requires explicit user override + Why size-exception: rationale)
└─ No  → continue to Q2

Q2: Is the change linearly decomposable into 2–4 independent slices, each <400 lines,
    where the strategy's default base safely contains slice N without slices N+1..M?
├─ Yes → stacked-to-main
└─ No  → continue to Q3

Q3: Does the change have shared scaffolding (new types, new base classes, new schemas)
    that multiple later slices depend on, where partial merges to base would break things?
├─ Yes → feature-branch-chain
└─ No  → re-decompose. Send the planner back to story breakdown.
         A monolithic non-mechanical change without shared scaffolding is a planning smell.
```

The answers are the deliverable, and the leaf name alone is not. Callers gate on this decision and reject a bare strategy name. Record each answer with the concrete reason from this change, stop at the leaf, and return the three-line block defined in `SKILL.md` Step 4 under "Return contract":

```
Chain strategy: feature-branch-chain
Decision trace: Q1=No (new domain logic, not a rename or formatter run) ·
                Q2=No (slice 2 cannot compile without the types added in slice 1) ·
                Q3=Yes (shared schema + base client consumed by slices 2-4) → feature-branch-chain
Decided by: /git-flow-master §Chained-PR decision tree (branching-strategies.md)
```

A `Yes` at Q1 ends the walk, and the trace then reads `Q2=n/a · Q3=n/a`. An answer that does not lead to the stated leaf, or a trace that only repeats the conclusion, is malformed and counts as no decision.

The three outputs:

- `stacked-to-main` is 2 to 4 PRs, each branched off the strategy's default base. Each PR is self-contained, so the base works after every merge.
- `feature-branch-chain` is one long-lived integration branch cut from the strategy's default base. Child PRs merge into it, and a final PR merges it into the base.
- `size-exception` is a single PR with an explicit `Why size-exception:` line. The reviewer is told upfront not to read it line by line.

The chosen plan is a contract for execution. If the actual diff exceeds the estimate, run the decision again instead of quietly raising the budget.

---

## Strategy comparison matrix

| Aspect                       | solo-main  | main-integration | enterprise  | trunk-based  | gitflow     | github-flow | gitlab-flow |
| ---------------------------- | ---------- | ---------------- | ----------- | ------------ | ----------- | ----------- | ----------- |
| Long-lived branches          | 1          | 2                | 3+          | 1            | 3+          | 1           | 2-4         |
| PR review required           | Optional   | Yes              | Yes         | Yes          | Yes         | Yes         | Yes         |
| CI gate                      | Optional   | Yes              | Yes         | **Required** | Yes         | Yes         | Yes         |
| Feature flags                | No         | Optional         | Optional    | **Required** | Optional    | Optional    | Optional    |
| Release-branch stabilisation | No         | No               | Yes         | No           | Yes         | No          | No          |
| Hotfix path                  | Direct     | Promotion        | Dedicated   | Direct       | Dedicated   | Direct      | Promotion   |
| Best team size               | 1          | 2-10             | 10+         | 5+           | 5-50        | 1-20        | 5-30        |
| Deployment frequency         | Continuous | Per-release      | Per-release | Continuous   | Per-release | Continuous  | Continuous  |
| Complexity                   | Low        | Low-medium       | High        | Medium       | High        | Low         | Medium      |

---

## git_strategy field rules (per strategy)

Strategy Setup (SKILL.md 3.6) fills the `git_strategy:` block in `.agents/project.yaml` in place and keeps the rest of the file. That block is the single source of truth. This section lists the field values each strategy writes. The operational detail (release commands, hotfix commands, the invariant prose) is not persisted anywhere. It lives in the per-strategy sections above and is read on demand.

All field paths below sit under `git_strategy` in `.agents/project.yaml` (for example `git_strategy.decisions.promote_method`). Each yaml example shows the block on its own, and you write it in place inside the existing file.

> The yaml blocks in this section are examples of what a strategy typically writes, and they are not any project's values. Real projects often differ, `policy:` most of all (a repo can run `solo-main` with `admin_bypass: true` while the example below shows `false`). To answer how a project is configured, open that project's `.agents/project.yaml` and cite it. The value-provenance rule in `agentic-dev-core/references/orchestration-doctrine.md` treats quoting an example as project state as a defect.

The old prose runbook's blocks map to fields like this. The invariant is not persisted: `decisions.promote_method: ff-only` implies it, because "production is an ancestor of integration" holds only for `ff-only`. With `merge-commit` or `squash` it does not hold, and the per-strategy sections above give the other command shape. Command shapes are read from this catalogue and never stored in the block.

| Runbook block | Fields |
| --- | --- |
| Markers | `strategy:`, `branches.integration` (or `ephemeral_pattern`), the applicable `decisions.*` (`n/a` when unused) |
| Branch roles | `branches:` (long-lived and ephemeral) and `protected:` (branches gated by `policy.direct_push_to_protected`); work-branch prefixes live in `branch_prefixes:` |
| Merge, promotion, hotfix | `decisions.feature_merge` (work branch to integration or trunk), `decisions.promote_method` (integration to production), `decisions.hotfix_policy` |
| Protection | `policy.direct_push_to_protected`, `policy.admin_bypass`, `policy.require_pr_reviews`, set by Q4 for every strategy; they set how strict the Push gate (SKILL.md 3.3) is and whether an admin bypass may be offered |

### `solo-main` (minimal)

A single long-lived branch with no integration, promotion or hotfix, so every `decisions.*` stays `n/a`.

```yaml
git_strategy:
  strategy: solo-main
  description: >
    This project uses the `solo-main` flow. One long-lived branch; every push to `main` is a release.
  branches:
    production: main
    integration: null
    ephemeral_pattern: null
  protected:
    - main
  decisions:
    promote_method: n/a
    feature_merge: n/a
    hotfix_policy: n/a
  policy:
    direct_push_to_protected: allowed   # solo repo: direct push to main is the normal flow
    admin_bypass: false                 # n/a, solo repo has no team-admin concept (kept false)
    require_pr_reviews: 0               # no reviewer; PRs optional
```

Work lands on `main` directly, or through an optional PR to `main` when a review or CI gate is wanted. There is no promotion or hotfix ceremony because there is one branch.

### `github-flow` (minimal)

`main` is always deployable, and a feature branch becomes a PR, merges and deploys. There is no integration, promotion or hotfix.

```yaml
git_strategy:
  strategy: github-flow
  description: >
    This project uses the `github-flow` flow. `main` is always deployable; every change is a
    short-lived branch merged via PR. Merge = deploy; rollback = revert the PR.
  branches:
    production: main
    integration: null
    ephemeral_pattern: null
  protected:
    - main
  decisions:
    promote_method: n/a
    feature_merge: n/a
    hotfix_policy: n/a
  policy:
    direct_push_to_protected: forbidden # every change goes through a PR to main
    admin_bypass: false
    require_pr_reviews: 1
```

Every change is a short-lived `feat/*` or `fix/*` branch off `main`, opened as a PR to `main`.

### `trunk-based` (minimal)

The trunk (`main`) is the only long-lived branch. Short-lived branches merge fast behind flags, and the CI gate is required.

```yaml
git_strategy:
  strategy: trunk-based
  description: >
    This project uses the `trunk-based` flow. `main` is the only long-lived branch; short-lived
    branches merge fast, incomplete work hides behind feature flags. The CI gate is non-negotiable.
  branches:
    production: main
    integration: null
    ephemeral_pattern: null
  protected:
    - main
  decisions:
    promote_method: n/a
    feature_merge: merge-commit   # or n/a if Q2 was not asked
    hotfix_policy: n/a
  policy:
    direct_push_to_protected: forbidden # CI-gated PR into trunk; direct push bypasses the gate
    admin_bypass: false
    require_pr_reviews: 1
```

A short-lived branch (off `main`, under a day) makes a fast, CI-gated merge to the trunk. Record `feature_merge` only if Q2 was asked, and otherwise leave `n/a`.

### `main-integration`

`main` (production) plus one integration branch. It fills `branches.integration` and all three `decisions.*`, and it is the reference shape.

```yaml
git_strategy:
  strategy: main-integration
  description: >
    This project uses the `main-integration` flow. One environment per branch:
    localhost (dev) → staging (integration) → main (production).
    Core invariant (ff-only promotion): `main` must always be an ancestor of `staging`.
  branches:
    production: main
    integration: staging
    ephemeral_pattern: null
  protected:
    - main
    - staging
  decisions:
    promote_method: ff-only                 # Q1
    feature_merge: merge-commit             # Q2
    hotfix_policy: branch-off-prod-backmerge # Q3
  policy:
    direct_push_to_protected: forbidden # work merges via PR to staging; main is promotion-only
    admin_bypass: false
    require_pr_reviews: 1
```

- With `decisions.promote_method: ff-only`, "main is an ancestor of staging" holds and the release is `git merge --ff-only staging`. With `merge-commit` or `squash` the invariant does not hold, and the release is `git merge --no-ff staging` (or `--squash`).
- `decisions.feature_merge` sets how `feat` and `fix` branches accrue history on `staging`.
- `decisions.hotfix_policy: branch-off-prod-backmerge` means a hotfix branches off `main`, merges to `main` through a PR, and back-merges to `staging` the same day. The command shapes are in the `main-integration` section above.

### `gitflow`

`main` plus `develop`. `release/*` is cut off `develop` and merged to `main` and back to `develop`, and `hotfix/*` branches off `main`.

```yaml
git_strategy:
  strategy: gitflow
  description: >
    This project uses the `gitflow` flow. `develop` is integration; `main` holds releases only.
    Invariant: `develop` and `main` diverge between releases by design; every release/hotfix that
    lands on `main` is back-merged into `develop` the same day (back-merge discipline).
  branches:
    production: main
    integration: develop
    ephemeral_pattern: null
  protected:
    - main
    - develop
  decisions:
    promote_method: merge-commit             # release/* → main is inherently a merge commit, never ff
    feature_merge: merge-commit              # Q2: feat/* → develop
    hotfix_policy: branch-off-prod-backmerge # Q3: hotfix off main, back-merge to develop
  policy:
    direct_push_to_protected: forbidden # both main and develop are PR-gated
    admin_bypass: false
    require_pr_reviews: 1
```

Gitflow's `promote_method` is `merge-commit` by nature, because a `release/*` to `main` merge is a merge commit and never a fast-forward. Keep it, and do not normalise it to the Q1 `ff-only` default. The gitflow invariant is the same-day back-merge to `develop`, not an ancestor relation. `release/*` and `hotfix/*` are on-demand branches and are not stored in `branches:`. Their roles and command shapes are in the `gitflow` section above.

### `gitlab-flow`

`main` plus environment branches, with code flowing one way: `main`, `pre-production`, `production`. `production` is the production branch.

```yaml
git_strategy:
  strategy: gitlab-flow
  description: >
    This project uses the `gitlab-flow` flow. Work merges to `main`; code is promoted one
    direction through environment branches: main → pre-production → production.
    Invariant (ff-only promotion): each env branch is a pure ancestor of the one upstream.
  branches:
    production: production
    integration: main          # feature base + first env
    ephemeral_pattern: null
  protected:
    - main
    - pre-production
    - production
  decisions:
    promote_method: ff-only                 # Q1: promotion through env branches
    feature_merge: merge-commit             # Q2: feat/fix → main
    hotfix_policy: branch-off-prod-backmerge # Q3: branch off production, forward-port up the chain
  policy:
    direct_push_to_protected: forbidden # work merges via PR to main; env branches are promotion-only
    admin_bypass: false
    require_pr_reviews: 1
```

- `branches.production` is `production`, not `main`, because work integrates at `main` and production is the last environment. The `pre-production` and `production` branches carry the promotion chain, and their roles and fast-forward promotion commands are in the `gitlab-flow` section above.
- For a one-direction flow, `decisions.hotfix_policy` means branching off `production` and then forward-porting (cherry-picking) up the chain. There is no literal back-merge.

### `enterprise`

`main`, integration and on-demand `feat/*`, `fix/*`, `release/*` and `hotfix/*`. Promotion goes integration to `main` and `release/*` to `main`.

```yaml
git_strategy:
  strategy: enterprise
  description: >
    This project uses the `enterprise` flow. `main` (production) + integration, with on-demand
    release/* stabilisation branches and hotfix/* off main.
    Invariant (ff-only promotion): `main` is a pure ancestor of the integration branch.
  branches:
    production: main
    integration: staging
    ephemeral_pattern: null
  protected:
    - main
    - staging
    # release/* are protected-when-alive (on-demand, not stored here)
  decisions:
    promote_method: ff-only                 # Q1
    feature_merge: merge-commit             # Q2: feat/fix → integration
    hotfix_policy: branch-off-prod-backmerge # Q3
  policy:
    direct_push_to_protected: forbidden # PR-gated; release/* protected-when-alive too
    admin_bypass: false
    require_pr_reviews: 1
```

`release/*`, `hotfix/*` and `feat/*` are on-demand branches. The Branch operation creates them when work starts, never at setup. Their roles, the `release/*` to `main` promotion and the back-merge command shapes are in the `enterprise` section above.
