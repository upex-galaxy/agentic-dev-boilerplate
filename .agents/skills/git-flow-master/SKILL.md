---
name: git-flow-master
description: "Git operator that adapts to the repo's branching strategy. Use when creating a branch, committing, pushing, opening a pull request, fixing a merge conflict or a rejected push, splitting a large change into stacked PRs, isolating work in a worktree, or choosing or setting up the git strategy. Not for implementing features (/sprint-development)."
license: MIT
compatibility: [claude-code, codex, opencode, pi]
phase: implementation
complementary_categories: []
# compact_rules is read verbatim by scripts/build-skill-registry.ts (frontmatter first, never truncated).
# The body keeps the exact `## Compact Rules` heading as a pointer, because other instruction files cite it as a carrier.
compact_rules: |
  - Read the repo state (status, branches, diff, log, fetch, upstream, remotes) at the start of every invocation and report it before acting (Step 1). A wrong guess about state is the most common git mistake.
  - The strategy comes from the `git_strategy:` block in `.agents/project.yaml`, read on every invocation; then layout heuristics; then ask. Never pick one silently, never infer it from a skill example or from another project, and persist a new resolution back into that block, never into a separate file or into `AGENTS.md`.
  - `strategy: solo-main` is the shipped default, not evidence of a decision. `meta.strategy_source` tells them apart: `chosen` confirms the strategy whatever `project.project_name` holds, and `inherited` (or absent) means nobody chose. While it is not `chosen`, offer Strategy Setup once per session and say what the default costs (no integration branch, no promotion path, no review gate). Only Strategy Setup stamps `chosen`. Never auto-run it; on a "no", proceed under the inherited strategy.
  - `policy:` records intent, not enforcement. At the first push, PR or merge intent of a session, run `bun run git:policy verify` (Step 1b), then `--stamp` when clean. Never hand-query the protection endpoints, and never state what the remote requires from a `declared` reading: say "declared, not verified".
  - GitHub has two protection mechanisms, classic (`branches/{b}/protection`) and rulesets (`rules/branches/{b}`); `git:policy verify` queries both. A `404` on the classic endpoint does not mean unprotected, because rulesets enforce PR requirements without it. A push that succeeds does not prove a rule is absent: admins bypass rulesets while the rule still binds everyone else. Report it as a bypass, never as permission.
  - Report drift, never auto-correct it. A mismatch between `policy:` and the host is shown with both values and three options (update the yaml, change the host, accept and record why). Editing `.agents/project.yaml` needs the user's choice, and so does writing the host: `git:policy apply` is a dry run until `--yes`, and it refuses to remove a guard, lower the approval bar, turn off code-owner review or widen the merge methods unless `--allow-loosening` names that specific give-up.
  - `require_code_owner_review: true` with no `CODEOWNERS` file is unsatisfiable, not strict: nobody outside the bypass list can clear it, so every merge becomes a bypass. Treat it as drift with a named remedy (add the file, or turn the flag off).
  - Config snippets in `references/` are illustrations. A claim about this repo's strategy, branches or policy cites `.agents/project.yaml` (or `git:policy verify` output) read in the same turn.
  - Before a direct push to a protected branch, resolve `git_strategy.policy.direct_push_to_protected` (Critical Rule 4). `evidence` pushes without asking when the pre-push gate (`bun run edd gate`) passes; a failed gate means no push and no question: fix forward and retry. `allowed` is a standing authorization to push without asking and without a gate, because asking anyway collapses it into `confirm`. `confirm` asks before every push, because the team chose it. `forbidden` never direct-pushes and routes through a PR without asking. A missing or null value or block reads as `evidence`.
  - Never rewrite pushed history (amend, rebase) and never force-push (Critical Rule 5, an invariant no authorization relaxes). `--force`, `--force-with-lease` and `--no-verify` are a human gate (`.agents/skills/edd/references/human-gates.md` item 2): ask, and never use one on a shared branch. Fix forward with a new commit.
  - Offer admin bypass only when `admin_bypass: true`, and only after confirming at runtime that the operator is an admin and accepts the specific irreversible action (human gate 3).
  - Never run a repo-wide discard (`git restore .`, `git checkout -- .`, `git reset --hard`, untargeted `git stash`, `git clean -f`) (Critical Rule 13): concurrent sessions may share the working tree. Discard only explicit paths this session modified, and when ownership is unclear, stop and ask.
  - In a stacked or chained PR, the body names its place in the chain (which PR comes before it and which come after) so a reviewer knows what to read first.
  - Never `git add -A` or `git add .`. List explicit paths, so a secret or another session's work cannot ride along.
  - One commit has one responsibility, a conventional prefix and no AI attribution (Critical Rule 3). Every commit ends with the two forensic trailers `Worktree: <name|primary>` then `Session: <label>`, copied from the `AGENT IDENTITY:` context line (`unknown` when unresolved). They are provenance, not attribution; harness-branded trailers (`Claude-Session:`, an AI `Co-Authored-By:`) stay forbidden (§3.2).
  - When the pre-push or CI documentation-contract gate names a region (ADR-0017), update every page it lists in the same push. Only if they still hold, add `Docs-Checked: <label> <reason>` above the forensic trailers, and always with the reason, never by reflex.
  - When a pre-commit hook rejects a commit, stop, fix the cause and create a new commit. `--amend` would rewrite the previous, unrelated commit.
  - Deliver on evidence per the `edd` doctrine (load `.agents/skills/edd/SKILL.md` before the first push, PR or merge): the branch name, the commit set and the PR body are the agent's call, stated in its report, never proposed for an OK. Ask a person only for the closed list in `.agents/skills/edd/references/human-gates.md`, plus the push ask under `confirm`; everything else is the agent's call, made and reported. Commits, branch names and PR bodies are English.
  - `gh` is the PR transport. If it is missing or unauthenticated, surface the blocker and do not imply a PR was opened. Enable the merge once the PR is open and its head carries its evidence (after the attest; for a PR opened for review first, after that review), never right after `gh pr create` by reflex: read `git_strategy.policy.merge_mode`: under `auto` (missing or null reads as this) and `human-approves`, run `bun run git:policy verify --merge <base>` and only on exit 0 `gh pr merge <n> --auto --<method>`; under `manual`, stop after opening and a person merges.
  - Never `gh pr merge --auto` unless `bun run git:policy verify --merge <base>` passes: on a base that requires no check, auto-merge merges at once, red or not. A protected base that fails it: stop and tell the person. A base with no ruleset (a stacked PR, an unprotected trunk): no `--auto`; wait for `edd/evidence` to pass, then `gh pr merge <n> --<method>`.
  - Merge with a merge commit (`--merge`) unless `git_strategy.decisions.feature_merge` declares another (`squash` is `--squash`, `rebase-merge` is `--rebase`); `n/a` or missing means `--merge`. A squash folds the evidence commit into a message body and loses its signature.
  - Only the gate writes the evidence record (`bun run edd gate` before a push, `bun run edd verify --ci` in CI), and only `bun run edd attest` creates the evidence commit. Never write or edit either by hand.
  - Depth comes from the paths the change touches. It may be raised (`--depth`), never lowered, and no required check is skipped. A check that cannot run is reported and that delivery waits (human gate 8).
  - At depth `standard` or deeper the agentic verdict comes from a tester other than the author session: a subagent or another session under its own label (`<author label>/tester`), passed as `bun run edd attest --tester <label>`.
  - After opening a PR, arm the bundled watcher (`.agents/skills/edd/scripts/pr-watch.sh`, preset `pr-delivery`), label the terminal tab and end the turn. On each wake, act and re-arm until the PR merges, then confirm it with `git fetch` and `git merge-base --is-ancestor <merge-commit> origin/<base>` (`references/pr-loop.md`).
  - A change to the gate itself (workflows, hooks, the evidence script, the contract, the policy) is delivered like any other change: depth `standard` or deeper, the record flags it `touches_gate`, and only a repo on `human-approves` lists those paths in CODEOWNERS. Nothing else stops it.
  - Describe the gate honestly: it catches mistakes and drift, not a deliberately forged check.
  - When a planned change passes about 400 changed lines, run the chained-PR decision (Step 4) before coding, and re-run it if the real diff outgrows the estimate. Return `Chain strategy`, `Decision trace` (each tree question answered with the reason from this change) and `Decided by`. This skill is the only authority that fills those lines; a bare label counts as no decision.
  - When a conflict fires, diagnose and classify it first, infer the intent from the reflog and the branch and report it, then resolve a non-destructive one yourself (a content merge where both intents are clear, or abort and retry). Ask only when the two sides disagree on product behaviour (human gate 1). A destructive option (force push, `reset --hard`, a `git rebase --skip` that drops commits, discarding someone's work) stays a stop, the same class as human gate 2.
metadata:
  kind: workflow
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

# Git Flow Master: Branches, Commits, Pushes, PRs and Conflicts

This skill is the single entry point for everything on the version-control layer: creating branches, writing commits, pushing safely, opening pull requests, resolving conflicts, and planning chained or stacked PRs when a change outgrows the review budget. It runs the operations; the `edd` doctrine skill (`.agents/skills/edd/SKILL.md`) decides when a change may land, so load it before the first push, PR or merge.

It does not assume one branching model. A project may run on `main` only, on `main + staging`, on a multi-branch enterprise layout, or on a well-known flow (trunk-based, GitFlow, GitHub Flow, GitLab Flow). The skill detects which one is active and adapts every command to it. Detection is sticky: once resolved, the strategy is recorded in the `git_strategy:` block of `.agents/project.yaml`, so later invocations skip the question.

---

## When to use

Any git-shaped request, with or without the literal skill name:

- "start work on UPEX-123": branch creation
- "commit and push", "push to main": commit and push flow
- "open a PR against staging": PR creation
- "I have conflicts on pull", "the push was rejected": conflict diagnosis and recovery
- "this PR is going to be huge": chained-PR planning
- "which git strategy do we use here": strategy detection and persistence

Feature implementation, test design, backlog work and architecture are not this skill. Hand those back to `/sprint-development`, `/unit-testing` or `/product-management`.

---

## Compact Rules

The rules live in this file's frontmatter (`compact_rules`), which the registry copies into `.agents/skills/REGISTRY.md` and into subagent briefings. They are not repeated here. Rationale and mechanics follow in the steps below.

**Read full SKILL.md when**: opening or merging a PR, running Strategy Setup, resolving a specific conflict type, planning a chain, picking a base branch or prefix for an unfamiliar strategy, setting up a worktree, or when the compact rules do not settle the operation.

---

## The six operations

Every invocation maps to one operation or a sequence of them. The request picks the operation; the resolved strategy shapes how it runs.

| Op | Trigger phrases (examples) | What the skill does |
| --- | --- | --- |
| Branch | "create branch", "new feature branch", "start UPEX-123" | Resolve the strategy, derive the name from prefix and issue key, cut it from `origin/<base>` without switching (`references/session-safety.md`), report it |
| Commit | "commit this", "commit and push", "make atomic commits" | Group by responsibility, commit one by one in conventional format, report each sha and subject |
| Push | "push", "push to main" | Diagnose the upstream, apply the protected-branch policy (`evidence`, `allowed`, `confirm`, `forbidden`; 3.3); a force flag is a human gate |
| PR | "create PR", "open PR", "gh pr create" | `gh` account guard, base from the strategy, body with the evidence block (`bun run edd render --pr`), metadata before review, `verify --merge`, auto-merge, arm the watcher |
| Conflict | "fix conflict", "rebase failed", "push rejected" | Diagnose first (`references/conflict-resolution.md`), resolve a non-destructive conflict yourself, ask before a destructive option, verify a clean state |
| Strategy Setup | "set up our git strategy", "bootstrap branching", "materialize the flow" | Resolve the strategy, run the decision questionnaire, create or fast-forward the long-lived branches (never force), write the `git_strategy:` block. Skips questions already answered by a non-`n/a` `git_strategy.decisions.*` field. See `references/strategy-setup.md` |

When the operation is ambiguous ("let's do the git stuff"), report the repo state (Step 1) and ask what the user needs.

---

## Step 1: Read the repo state

Run these silently on every invocation, and act only once the picture is clear:

```bash
git status
git branch --show-current
git branch -a
git diff --stat
git log --oneline -5
git fetch origin
git status -sb
git remote -v
```

Summarise for the user: the current branch; a clean or dirty tree (staged, unstaged and untracked counts); commits ahead of or behind the upstream; the upstream state (none, up to date, diverged); and the remotes (most repos have `origin`, some also a fork). The summary is cheap and prevents most mistakes.

### Step 1b: Reconcile the declared policy against the host (once per session)

`git_strategy.policy.*` in `.agents/project.yaml` records what the team decided. The host records what is enforced, and the two drift: someone tightens protection in the UI, or the block was filled before the remote existed. Acting on the declared value alone produces a merge that stalls on an approval nobody expected, or a "protected" branch that never was.

Run the reconciliation once per session, at the first push, PR or merge intent (not on read-only operations), and reuse the result for the rest of the session:

```bash
bun run git:policy verify          # read-only; exit 1 on unaccepted drift
bun run git:policy verify --stamp  # same, and records the reconciliation when clean
```

The tool queries both GitHub protection mechanisms for every branch in `git_strategy.branches` and `protected`, compares the union with the declared policy, and prints each divergence as `declared` against `enforced`. The contract and the strategy-to-ruleset mapping are in `references/ruleset-parity.md`.

The reconciliation was once specified here as prose steps and kept not happening: the boilerplate itself shipped `require_pr_reviews: 0` against a host demanding one approval plus a code-owner review, and the gap surfaced as a refused merge months later. A script runs every query every time, where a procedure runs the ones the reader remembered.

Three facts of the output still bind you when you read it:

- A `404` from the classic endpoint says nothing about protection. A repo governed by rulesets returns `404` there while it enforces PR requirements, approvals, signed commits and non-fast-forward bans through `rules/branches/{b}`. Stopping at the classic endpoint yields a confident "unprotected" reading and a wrong `verified` stamp, which is worse than never verifying.
- A successful push does not show that a rule is absent. Org owners and anyone on the ruleset bypass list push through while the rule still binds everyone else. When a push prints `Changes must be made through a pull request`, the operation was a bypass: report it as drift.
- `require_code_owner_review: true` with no `CODEOWNERS` file is unsatisfiable. The tool reports that combination as drift with a named remedy.

Host adapters: the check is host-shaped, not GitHub-only (GitLab has protected-branches, Bitbucket has branch restrictions). When no host CLI is available, or a call returns `403` (token scope) rather than `404` (nothing configured through that mechanism), record which case applies and continue. Never block a git operation because verification was impossible, and record `verified` only when every mechanism the host offers was queried.

On drift, report and do not correct:

```
Branch-protection drift on `{branch}`:
  require_pr_reviews:        declared 0   ·  enforced 1
  direct_push_to_protected:  declared allowed  ·  enforced blocked (protection active)
Options: (a) update .agents/project.yaml to match the host, (b) change the host
configuration, (c) accept the divergence and record WHY.
```

Option (c) needs a durable home or it re-litigates itself every session. Record an accepted divergence in `git_strategy.policy.accepted_divergences` (one entry per `verify` finding field, with a reason; `references/ruleset-parity.md` §2b). `verify` then reports it as ACCEPTED and exits 0. Prose context goes in the project's own `.agents/instructions/agent-project.md`, section `## Git Strategy (this repository)`, which is per-project and never synced from a template. Legitimate reasons exist and are project-specific: a template repository whose only committer makes the review requirement ceremony, or a ruleset inherited from an org policy nobody local can change. The skill never decides on its own that a bypass is fine and never treats "the push went through" as the reason. The user states the exception once, in writing, and it holds until they change it.

Editing `.agents/project.yaml` takes the user's choice, as in Strategy Setup. Once verified, stamp the outcome so later runs know how far to trust the block:

```yaml
git_strategy:
  meta:
    policy_verified: YYYY-MM-DD # date of the last successful host reconciliation
    policy_source: verified # verified | declared (declared = never reconciled against the host)
```

Any statement about what the remote requires (for example "this PR needs 1 approval") is made only from a `verified` reading. With `policy_source: declared`, say so: _"declared 0 required approvals, not verified against the host"_. An unverified field is a claim about intent, not about reality.

---

## Step 2: Resolve the branching strategy

`references/branching-strategies.md` holds the full catalogue, the detection signals and the trade-offs. The strategies:

| Strategy | One-line description |
| --- | --- |
| `solo-main` | Single long-lived branch (`main`). All work lands directly. Best for solo projects, scratch repos, prototypes. |
| `main-integration` | `main` (production) plus one integration branch (`staging`, `dev` or `develop`). Features merge to integration, release-promote to `main`. |
| `enterprise` | `main` plus integration plus many short-lived `feature/*`, `fix/*`, `release/*`, `hotfix/*` branches. Adds environment branches when needed. |
| `trunk-based` | Trunk (`main`) is the only long-lived branch. Short-lived feature branches (under a day) merge fast, behind feature flags. A CI gate is non-negotiable. |
| `gitflow` | Vincent Driessen's classic. `main` (releases), `develop` (integration), `feature/*`, `release/*`, `hotfix/*`. Heavyweight, mostly legacy. |
| `github-flow` | `main` always deployable. `feature/*` branches go through a PR, merge, deploy. No staging or develop branch. |
| `gitlab-flow` | GitHub Flow plus environment branches (`pre-production`, `production`) to model deployment promotion. |

### Detection algorithm

Apply in order and stop at the first definitive answer:

1. The `git_strategy:` block in `.agents/project.yaml`. If `git_strategy.strategy` is non-null (one of the slugs above), it plus `git_strategy.branches` (production, integration, ephemeral_pattern) and `git_strategy.decisions` (promote_method, feature_merge, hotfix_policy) are the persisted decision. A `git_strategy.decisions.*` field that is not `n/a` or empty means Strategy Setup skips that question on a re-run: idempotency is keyed off those fields, not markers. Inherited-template guard: the boilerplate ships the block filled (`strategy: solo-main`) and a scaffolded project inherits it verbatim (the scaffolder patches only `project.project_name` and `project.project_key`). A non-null strategy is therefore authoritative only when this project chose it. Read `git_strategy.meta.strategy_source` in the same block: `chosen` means Strategy Setup ran here and the block is confirmed, whatever `project.project_name` holds, so it gets no nudge. `inherited` (or absent) means the block came from the template and nobody chose it, so treat the strategy as unconfirmed and route to the Bootstrap trigger's inherited case (the skill still operates under the inherited strategy if the offer is declined).
2. Single-branch heuristic: `git branch -a` shows only `main` (or `master`) and no integration branch on the remote, so `solo-main`.
3. Two-branch heuristic: exactly `main` (or `master`) plus one of `staging`, `dev`, `develop`, `integration` upstream, so `main-integration` (record the integration branch name).
4. Multi-branch heuristic: `main`, an integration branch, and active `feature/*` or `release/*` branches, so `enterprise`.
5. Project hints: a `.gitlab-ci.yml` suggests `gitlab-flow`; long-lived `release/*` and `hotfix/*` branches suggest `gitflow`.
6. Fallback: ask the user. Show the options with one-line descriptions and mirror their language. Never pick silently.

### Persist the decision

Once resolved, by detection or by asking, write or update the `git_strategy:` block in place inside `.agents/project.yaml`. Preserve the rest of the file, create the block if it is missing, write values only (each key is documented in `.agents/project.schema.yaml`, ADR-0021), and never write a separate file: the block is the single source of truth, and its `description:` field is the one-paragraph human summary. The first five operations need at least `git_strategy.strategy` and `git_strategy.branches`; Strategy Setup (3.6) populates the full schema (`decisions:`, `policy:`, `protected:`, `branch_prefixes:`, `meta:`). The user can edit the block and the next invocation re-reads it.

```yaml
# .agents/project.yaml  (git_strategy block, in place)
git_strategy:
  strategy: main-integration
  branches:
    production: main
    integration: staging
    ephemeral_pattern: null
```

An integration branch with any name other than `staging` is recorded under `git_strategy.branches.integration`, so commits do not re-detect it.

The `## Git Strategy` section of `.agents/instructions/agent-git.md` is only a pointer to this block. Strategy policy and branch decisions never go into `AGENTS.md` or an instruction section. Any other change to an instruction file follows `agentic-dev-core/references/instructions-doctrine.md` (its §4 covers this skill's one write, the `## Git Strategy (this repository)` heading of `agent-project.md`).

**Fields and idempotent setup.** Strategy Setup also fills the three `git_strategy.decisions.*` fields and the `git_strategy.policy.*` fields. On a re-run it asks only the questions whose `decisions.*` field is still `n/a` and never recreates a branch that exists.

### Bootstrap trigger: offer setup, never auto-run

At the top of any git intent, after Step 1 and the Step 2 detection, evaluate the gate. It fires on either condition:

- (a) Unset: `git_strategy.strategy` is null (or the block is absent) and the repo looks fresh: only `main` or `master` exists locally and on the remote, fewer than about 3 commits, or a boilerplate sentinel file such as `.agents/project.yaml` is present.
- (b) Inherited: `git_strategy.strategy` is non-null and `git_strategy.meta.strategy_source` is not `chosen` (it is `inherited` or absent), whatever `project.project_name` holds. The block came from the template and nobody chose it for this project; treat it as unconfirmed.

If either holds, offer Strategy Setup with the matching prompt. Do not auto-execute and do not pick a strategy silently.

> _(unset case (a))_ "No git strategy is set up yet. Want me to run Strategy Setup, pick the flow, create the branches it needs, and write the `git_strategy:` block in `.agents/project.yaml`? (Y/N)"

> _(inherited case (b))_ "This project's `git_strategy` looks inherited from the boilerplate (`meta.strategy_source` is not `chosen`). Want to run Strategy Setup to define this project's own flow? (Y/N)"

- Offer once per session and reuse the answer.
- A "No" proceeds with the requested operation under the detected (a) or inherited (b) strategy, without writing the block. A "Yes" enters Strategy Setup (3.6) before the original intent continues.
- The boilerplate ships `.agents/project.yaml` with the block filled and the updater freezes the file via `bootstrapOnlyPaths`, so (a) and (b) are the two ways a project reaches a real git intent without having confirmed its own flow. The offer fires on first real use by design, as a guard against the template trap. `git_strategy.meta.strategy_source: chosen` confirms the strategy, so neither case fires on it.

---

## Step 3: Operation runbooks

### 3.1 Branch creation

Pick the prefix from the dominant change. Where a change mixes several, the precedence is `feat > fix > refactor > test > docs > chore`.

| Prefix | When the dominant change is |
| --- | --- |
| `feat/` | a new feature or capability |
| `fix/` | a bug fix |
| `test/` | adding or updating automated tests (no product code) |
| `docs/` | docs only |
| `refactor/` | a code change without behaviour change |
| `chore/` | tooling, deps, housekeeping |

For `enterprise` and `gitflow`, also consider `release/X.Y.Z` and `hotfix/X.Y.Z`.

Find the issue key in this order:

1. The current branch name, regex `(?:feat|feature|fix|test|docs|refactor|chore)/([A-Z]+-\d+)-`.
2. `$ARGUMENTS`, for `[A-Z]+-\d+`.

With neither source, the branch and its commits go without a key, and the report says so.

Branch name format:

- With a key: `{prefix}/{ISSUE-KEY}-{kebab-slug}` (for example `feat/UPEX-123-bulk-assign-users`).
- Without a key: `{prefix}/{kebab-slug}` (for example `refactor/split-auth-utils`).
- Slugs are lowercase, hyphen-separated and at most 50 characters.

Source branch by strategy:

- `solo-main`, `github-flow`, `trunk-based`: branch off `main`.
- `main-integration`, `gitlab-flow`: branch off the integration branch (`staging`, `dev` or equivalent).
- `enterprise`: branch off the integration branch, except `hotfix/*`, which branches off `main`.
- `gitflow`: `feature/*` off `develop`, `hotfix/*` off `main`, `release/*` off `develop`.

Cut the branch with `git fetch origin --prune`, then `git switch -c <name> origin/<base>`. Never check out the base first: in a shared checkout that changes files under other sessions (`references/session-safety.md`). The name is the agent's call, and the report states it.

### 3.2 Commits

Group changes by responsibility, not by file type:

| Group | Typical paths |
| --- | --- |
| Source code | `src/`, `app/`, `components/`, `pages/`, `lib/`, `api/` (excluding generated) |
| Tests | `tests/`, `__tests__/`, `*.test.*`, `*.spec.*` |
| Generated | `api/schemas/`, codegen output, OpenAPI types |
| Config | `package.json`, `tsconfig.json`, lint and format configs, CI workflows |
| Docs | `README.md`, `AGENTS.md`, `docs/`, `.agents/skills/` |

Tests stay with the behaviour they verify: a feature commit that ships its own tests includes them, with no separate `test:` commit.

Conventional commit format:

- With an issue key: `{type}({ISSUE-KEY}): {description}` (for example `feat(UPEX-123): add bulk-assign action`).
- Without a key: `{type}: {description}`.
- Breaking changes: append `!` after the type or scope and add a `BREAKING CHANGE:` footer.
- Types: `feat`, `fix`, `docs`, `style`, `refactor`, `perf`, `test`, `chore`, `build`, `ci`, `revert` (full list in `references/conventional-commits.md`).

Rules on every commit:

- One responsibility per commit. Bundled changes cannot be reverted or blamed surgically.
- List explicit paths instead of `git add -A` or `git add .`, so credentials (`.env`) or unrelated work cannot ride along. History keeps a leaked secret forever.
- No AI attribution: no `Generated with Claude Code`, no `Co-Authored-By: Claude`, no equivalent line (Critical Rule 3).
- If a pre-commit hook fails, stop, fix the cause and create a new commit. `--amend` after a rejected commit would rewrite the previous commit and destroy its context.

**Forensic trailers (every commit, every strategy).** The last two lines of every commit message are:

```
Worktree: <name|primary>
Session: <label>
```

- Both values come from the `AGENT IDENTITY:` line the prompt hook (`.agents/hooks/personality-reinject.mjs`) injects into the session context (`worktree=…`, `session=…`). Copy them instead of re-deriving them per commit. The session label may contain spaces and parentheses (`my-session (c0ffee12)`): take everything after `session=` up to the literal ` harness=` token, and never split the line on whitespace.
- `primary` is the right worktree value when the session runs in the main checkout. When a value cannot be resolved at all, write `unknown`. A guessed name or a dropped key is less recoverable than an honest `unknown`.
- Nothing goes below them and nothing else is added beside them.
- For a change with a trail, `Closes #N` (on `github`) and then `Trail: <trail.dir>/<KEY>-<slug>/` sit directly above `Worktree:` and `Session:`, in that order (`/sprint-development` `## The trail`).
- `Docs-Checked: <label> <reason>` may sit above them (ADR-0017). Add it only when the change touched a `LINT.IfChange(<label>)` region, the pages its `LINT.ThenChange(...)` names were not updated, and they still describe the behaviour correctly; the reason says why. Never by reflex, and never without a reason (a bare label does not count). The pre-push and CI documentation-contract gate block the push without it or the page edits. On an already-pushed range the acknowledgement is an empty commit carrying the line, never an amend.
- These are forensics, not attribution. They record which working tree and which session produced the commit, so a bisect, an incident review or a parallel-session post-mortem can find the right transcript on any harness. They name no tool, vendor or model. Critical Rule 3 stands: no `Claude-Session:` or any other `<Tool>-Session:` key, no `Co-Authored-By:` for an AI, no "Generated with …" line.
- `.husky/commit-msg` runs `scripts/check-commit-trailers.ts`, which warns (it never blocks) when the pair is missing or out of place or a branded trailer is present. A warning on an agent-written commit is a defect to fix in the next commit, not by amending a pushed one.

Execute the commits one by one, staging and committing explicit paths (`references/session-safety.md`), and report each sha and subject.

### 3.3 Push

The command depends on the Step 1 output:

- No upstream: `git push -u origin {branch}`.
- Upstream behind: `git push`.
- Upstream diverged: stop, do not force, and hand over to conflict resolution (3.5).

Protected branches by strategy:

- `solo-main`: `main`.
- `main-integration`: `main` and the integration branch.
- `gitflow`: `main` and `develop`.
- `github-flow`, `trunk-based`: `main`.
- `gitlab-flow`: `main` (where work integrates) and the environment branches `pre-production` and `production`.
- `enterprise`: `main`, the integration branch and any `release/*`.

These are unioned with `git_strategy.protected`. A push to a branch that is not protected needs no ask under any value; the pre-push hook still runs its static subset.

Before a push that lands the change, when its depth (computed from the paths it touches, `.agents/skills/edd/references/contract.md`) is `light` or deeper, a tester runs the agentic checks and leaves its artifacts in the attest layout, then `bun run edd attest` creates the evidence commit on HEAD. In this repo the agentic checks are `/sprint-development`'s own verify stage: live UI screenshots through `/playwright-cli`, API calls and database reads against the declared environment, next to the contract's static checks (lint, types, unit tests, repo gates). At `standard` or deeper the tester is never the author session: a subagent or another session, under its own label such as `<author label>/tester`, passed as `bun run edd attest --tester <label>`. Layout, sequence and attest mechanics: `.agents/skills/edd/references/flows.md` and `.agents/skills/edd/references/record-and-signature.md`.

Before a direct push to a protected branch, read `git_strategy.policy.direct_push_to_protected` (Critical Rule 4):

| Value | Behaviour |
| --- | --- |
| `evidence` (a missing or null value or block reads as this) | Push without asking. The pre-push hook runs `bun run edd gate`, which re-runs the `pre-push` static checks and verifies the evidence commit when depth needs one. On a fail there is no push and no question: fix forward, re-attest if the diff changed, retry. Never `--no-verify`. |
| `allowed` | Standing authorization: push without asking and without a gate. The recorded value is the authorization (Strategy Setup stamped it with the user), and asking anyway collapses `allowed` into `confirm`. |
| `confirm` | The team chose to be asked: ask every time, _"You are about to push directly to the protected branch `{branch}` in a `{strategy}` flow. Confirm?"_, and push only on a yes. |
| `forbidden` | Never direct-push. Route the work through a PR without asking (branch off the strategy's default base, push the work branch, open a PR via 3.4). |

Admin bypass is rare and opt-in, and a bypass beyond the standing one the project declared is human gate 3 (`.agents/skills/edd/references/human-gates.md`). It may be offered only when `git_strategy.policy.admin_bypass: true`. Even then, confirm both at runtime before bypassing: that the operator is a repo admin (ask them, the skill cannot see the GitHub role) and that they accept the specific irreversible action. With `admin_bypass: false`, never offer a bypass.

`--force`, `--force-with-lease`, `--no-verify` and any history-rewriting flag are human gate 2: ask, use one only on an unshared branch after a yes, and note the request in the conversation (Critical Rule 5). Force-pushing a shared branch destroys teammates' history, and `--no-verify` skips the hooks that run the evidence gate.

### 3.4 Pull request

The sequence is the one in `.agents/skills/edd/references/flows.md` Flow 2: commits, then (when the computed depth asks for it) the agentic run by a tester other than the author and `bun run edd attest --tester <label>` (3.3), then the branch push, so the `edd/evidence` check finds the evidence commit on the PR head.

The base branch comes from the strategy:

| Strategy | Default PR base |
| --- | --- |
| `solo-main`, `github-flow`, `trunk-based` | `main` |
| `main-integration`, `gitlab-flow` | the integration branch (for example `staging`) |
| `enterprise` | the integration branch; `hotfix/*` goes to `main` |
| `gitflow` | `feature/*` to `develop`; `hotfix/*` to `main`; `release/*` to `main` (and back-merge to `develop`) |

The user can override with `--base X`. When they do, the PR report says so: _"PR targets `{base}` instead of the strategy default `{default}`."_

Title format: `{type}({ISSUE-KEY}): {description}`, under 70 characters. Without a key: `{type}: {description}`.

Body: render it inline (there is no template file to read) with the structure in `references/pr-templating.md`. Fill the placeholders the skill can (`<<ISSUE_KEY>>`, `<<SUMMARY>>`, `<<CHANGES>>`, `<<TEST_PLAN>>`, `<<EDD_RECORD>>`, `<<READY_BLOCK>>`, `<<EVIDENCE>>`, `<<RISK>>`, `<<WORKTREE>>`, `<<SESSION_LABEL>>`, and `<<TRAIL>>`, which is dropped together with its `## Trail` section when the change has no trail). Leave an unfilled placeholder visible so the author can edit it before posting, and do not drop sections silently. The `- Worktree:` and `- Session:` provenance lines carry the same values as the commit trailers (`unknown` when unresolved) and are dropped together only on a human-opened PR (`references/pr-templating.md` § Placeholder rules).

Fill `<<RISK>>` with the merge danger, in three lines. First, say whether the merge is a one-way door (destructive or hard to reverse: migrations, deleted data, published contracts) or a two-way door (cheap to roll back). Second, give the blast radius in a word or two (consumers, other modules, layout, rollback cost). Third, give the rollback plan.

Fill `<<EDD_RECORD>>` with the output of `bun run edd render --pr`, pasted as printed (it carries its own `## Evidence` heading): under policy `evidence` it prints the local record the pre-push gate wrote, under any other policy a fresh verification of the head. The CI verifier's PR comment (the "EDD Evidence" workflow) is the copy a reader sees, and it keeps that copy current. Never hand-write it (`references/pr-templating.md`). Fill `<<READY_BLOCK>>` with the checklist from `references/pr-loop.md`. Back the "works" claim in `<<EVIDENCE>>` with the heaviest proof available: a before and after screenshot of the live UI for visual changes, the exact test that failed and now passes for logic, console output last.

Write the rendered body to a tempfile (for example `$(mktemp)`) and pass it with `gh pr create --body-file` to avoid escaping problems. Before the first `gh` call, run the `gh` account guard (`references/session-safety.md`).

Set the metadata before review, without asking (`references/pr-loop.md`). Labels come from `gh label list`, never invented, because `--add-label` silently drops a missing one. The assignee is the owner of the work (the `gh` user). A reviewer is requested only under `human-approves`, from CODEOWNERS; when nobody can be resolved, the ready block says so. A draft never merges, so run `gh pr ready <n>` before the merge step.

Command shape (`--reviewer` only under `human-approves`), then the merge step and the watcher:

```bash
gh pr create \
  --title "{title}" \
  --body-file {tmpfile} \
  --base {base} \
  --assignee {owner} \
  [--label {labels}] \
  [--reviewer {users}] \
  [--draft]

bun run git:policy verify --merge {base}
gh pr merge {number} --auto {merge-flag}
bash .agents/skills/edd/scripts/pr-watch.sh start pr-delivery {repo}-pr-{number} REPO={owner/name} PR={number}
bash .agents/skills/edd/scripts/pr-watch.sh wake {repo}-pr-{number}
```

In the PR report, state how many approvals stand between it and a merge, and where that number came from. With a Step 1b reading of `policy_source: verified`, say _"the host requires N approving review(s) on `{base}`"_. With `policy_source: declared`, say _"declared `require_pr_reviews: N` in `.agents/project.yaml`, not verified against the host"_. A silent assumption here is what turns "just merge it" into a surprise mid-merge.

Merge on evidence, by `git_strategy.policy.merge_mode` (`.agents/skills/edd/references/flows.md`, Flow 2). Enable auto-merge only once the head carries its evidence: after the attest, or at depth `none` once nothing but the static checks is required. A caller that opens the PR before its own review is done (`/sprint-development` Stage 3 opens it for review) enables auto-merge after that review and the attest, never at `gh pr create`.

- `auto` (missing or null reads as this) and `human-approves`: run `bun run git:policy verify --merge <base>`, and only on exit 0 run `gh pr merge <n> --auto <merge-flag>`. GitHub merges when the required checks, `edd/evidence` among them, pass, with zero approvals under `auto`; under `human-approves` it also waits for a person's approval. A protected base that fails `verify --merge` is a human gate: stop and tell the person, because on a base that requires no check auto-merge merges at once, red or not.
- A base with no ruleset (a stacked PR on another feature branch, an unprotected trunk): no `--auto`. Wait through the watcher for the `edd/evidence` check from the "EDD Evidence" workflow to pass (`CHECK EDD Evidence/edd/evidence success on <head>`), then run `gh pr merge <n> <merge-flag>`. The check catches mistakes and drift, not a deliberately forged check (`.agents/skills/edd/SKILL.md` "What the evidence proves").
- `manual`: stop after opening the PR; a person merges (human gate 7). The watcher still runs.

The merge flag is `--merge` (a merge commit) unless `git_strategy.decisions.feature_merge` declares another: `merge-commit` is `--merge`, `squash` is `--squash`, `rebase-merge` is `--rebase`, and `n/a` or missing means `--merge`. Squash only when `feature_merge` declares it: a squash folds the evidence commit into a message body and loses its signature. The remote branch is never deleted from this skill (human gate 2), so no `--delete-branch`.

Then arm the watcher, run `wake` as a background call, label the terminal tab `PR#<n> <previous title>` (a label that fails is a warning), post the PR announcement from the template in `references/pr-loop.md`, and end the turn. On each wake, act per `.agents/skills/edd/references/waiting.md` and re-arm. On `WATCH ENDED ... MERGED`, close out: `git fetch`, `git merge-base --is-ancestor <merge-commit> origin/<base>`, restore the tab title. Close-out never switches the local branch, because the checkout may be shared; it deletes the merged local branch with `git branch -d` only when no worktree has it checked out. The review-bot loop (only when `evidence.review.bot` is set), the ready block and what to do when the PR changes under you are in `references/pr-loop.md`.

`gh` is the transport; if it is missing or `gh auth status` fails, surface the blocker and do not pretend a PR was opened.

### 3.5 Conflict resolution

Diagnose before resolving. The user is rarely in a hurry, and a wrong fix costs hours.

Run `git status` and `git diff --check`, inspect `.git/MERGE_HEAD` and `REBASE_HEAD` to classify the situation, then follow the matching playbook in `references/conflict-resolution.md`:

- Merge conflict (content)
- Merge conflict (rename or delete)
- Rebase conflict
- Push rejected (diverged)
- Detached HEAD
- Stash apply conflict
- Unrelated histories
- Pre-commit hook rejected the commit

Every playbook has the same shape:

1. Explain what happened (root cause, in the user's language).
2. Infer the intent from the reflog and the branch (`git reflog -n 20`, the branch name, the commits on each side) and report it. Resolve a non-destructive conflict yourself: a content merge where both intents are clear, or abort and retry. Ask only when the two sides disagree on product behaviour (human gate 1). A destructive option stays a stop: force push, `reset --hard`, a `git rebase --skip` that drops commits, discarding someone's work, aborting an unfinished merge that has uncommitted work. These destroy committed or uncommitted work, the same class as human gate 2.
3. Apply the resolution step by step, or walk the user through the option they picked.
4. Verify with `git status` and `git log --oneline -3`.
5. Add one short note on how to avoid it next time.

When in doubt, abort safely (`git merge --abort`, `git rebase --abort`, `git cherry-pick --abort`) instead of pushing forward. An abort is always recoverable and a guess is not.

### 3.6 Strategy Setup

The first five operations adapt to a strategy that already exists. Strategy Setup establishes one: it resolves (or asks) the strategy, captures the merge, hotfix and protection decisions the other operations depend on, materializes the long-lived branches, and writes the `git_strategy:` block in `.agents/project.yaml`. It is the only operation that creates branches and writes the strategy block.

**When it runs**

- The user asks: "set up our git strategy", "bootstrap branching", "materialize the flow".
- A git intent arrives and any of these holds (the skill offers and never auto-runs; see the Bootstrap trigger):
  - `git_strategy.strategy` is null, or the block is absent, on a fresh-looking repo.
  - `git_strategy.strategy` is non-null and `git_strategy.meta.strategy_source` is not `chosen` (`inherited` or absent), whatever `project.project_name` holds: the unonboarded template itself, or a real project that onboarded and never chose a strategy.

Say it out loud when it fires on a named project. The shipped default is `solo-main`: one branch, no integration branch, no promotion path, no review gate of its own. That is right for a template with one maintainer and thin for a product with a team, a staging environment or a release cadence. Say which of those the repo looks like and let the user decide. A default nobody picked is not a decision, though it is not automatically wrong either.

**The flow** (mechanics are in `references/strategy-setup.md`, not here):

1. Read the repo state (Step 1, which always runs).
2. Resolve the strategy by reusing Step 2 detection. If it is still undetermined, ask the strategy question (one slug out).
3. Run the decision questionnaire below, capturing merge methods, hotfix policy and protection policy. Skip any question that does not apply to the resolved strategy, and any question whose `git_strategy.decisions.*` field is already set (not `n/a` or empty), which makes a re-run idempotent. Q4 applies to every strategy.
4. Materialize, conditional on the strategy: create an integration branch only if the strategy needs one and it is missing; fast-forward the integration and production pair if one is a pure ancestor of the other (never `--force`); set up local tracking. The materialization table and sync mechanics are in `references/strategy-setup.md`.
5. Persist: write the `git_strategy:` block in place inside `.agents/project.yaml` with the fields that apply. No prose runbook is rendered anywhere, because the operational how lives in this skill's references. Per-strategy field values are in `references/branching-strategies.md` under "git_strategy field rules (per strategy)".
6. Report the branches created or synced, the decisions captured and the block location.

**Decision questionnaire** (defaults first, each gated on the resolved strategy)

| Q | Question | Applies to | Options (default first) | Drives |
| --- | --- | --- | --- | --- |
| Q1 | Promotion method, integration to production | strategies with an integration branch (`main-integration`, `gitlab-flow`, `enterprise`; `gitflow` is `develop` to `main`) | **Fast-forward only** / Merge commit (`--no-ff`) / Squash | release runbook, and whether branches stay byte-identical |
| Q2 | Merge method, work branch to integration (or to trunk) | all multi-branch strategies | **Merge commit (`--no-ff`)** / Squash / Rebase + merge | how integration history accrues |
| Q3 | Hotfix policy | strategies with a production branch distinct from where work lands | **Branch off production, PR to production, back-merge to integration the same day** / Always via integration / No policy | hotfix runbook and invariant maintenance |
| Q4 | Protected-branch bypass policy | all strategies | direct push to protected: `forbidden` / `confirm` / `allowed` / `evidence` (default: `solo-main` is `evidence`, every PR strategy is `forbidden`); merge mode: **`auto`** / `human-approves` / `manual`; admin bypass: **`false`** / `true`; require PR reviews: `null` / `0` / `N` (default `0`; under `auto`, `git:policy` derives 0 whatever it says) | how protected branches are guarded (Push 3.3) and how a PR reaches its base (PR 3.4) |

The defaults of Q1 to Q3 are what the `main-integration` worked example chose, and the user can override any of them. Single-branch strategies (`solo-main`, `github-flow`, `trunk-based`) answer none of Q1 to Q3, since they have no integration branch and no distinct production branch. Q4 sets the `git_strategy.policy.*` fields; its per-strategy defaults are in `references/branching-strategies.md` under "git_strategy field rules (per strategy)".

**The `git_strategy` fields** (write only the ones that apply; leave `decisions.*` at `n/a` for a decision the strategy does not use):

```yaml
git_strategy:
  strategy: VALUE                 # one of the seven slugs
  branches:
    integration: NAME             # or null
  decisions:
    promote_method: ff-only|merge-commit|squash|n/a
    feature_merge: merge-commit|squash|rebase-merge|n/a
    hotfix_policy: branch-off-prod-backmerge|via-integration|none|n/a
  policy:                         # Q4, applies to all strategies
    direct_push_to_protected: forbidden|confirm|allowed|evidence
    merge_mode: auto|human-approves|manual
    admin_bypass: true|false      # team POLICY (intent), not enforcement; real capability depends on the GitHub user's role
    require_pr_reviews: null|0|N
```

**Boundaries during setup**

- Never `--force` or `--force-with-lease` during a setup sync. Sync only on a true fast-forward. If the integration and production pair has diverged both ways, stop and hand over to conflict resolution (3.5).
- A setup fast-forward push to a protected branch follows the push policy (3.3) like any other push.
- The accepted questionnaire is the decision: create the branches its answers imply with no second OK, and report each branch created, off what and why. The strategy itself stays asked, because a strategy change is human gate 5.
- Commits made by setup carry no AI attribution (Critical Rule 3).

---

## Step 4: Chained and stacked PRs

When a planned change estimates over 400 changed lines (additions plus deletions), split the work. The 400-line cognitive review budget comes from industry research (SmartBear and Cisco code-review studies): above it, defect detection drops sharply.

There are three ways to split:

1. `stacked-to-main`: 2 to 4 small PRs, each branched off the strategy's default base, each depending on the previous merge. The base works between merges. Best for linearly decomposable work.
2. `feature-branch-chain`: one long-lived integration branch; child PRs merge into it and one final PR merges it to the default base. Before opening the final PR, run `bun run edd attest --depth <highest depth of the children>` on the branch tip: a fresh attest, with the children's evidence commits left in the range (`.agents/skills/edd/references/flows.md` Flow 3). Best when shared scaffolding (new types, new schemas) would break a partial merge.
3. `size-exception`: for mechanical diffs (mass renames, formatter sweeps, generated code, vendor updates). The agent picks it and records why with a `Why size-exception:` line in the PR body.

Walk the chained-PR decision tree inline (`references/branching-strategies.md` § Chained-PR decision tree). It ends at one of `single-pr`, `stacked-to-main`, `feature-branch-chain`, `size-exception`, and the skill then executes the resulting branch plan. A stacked or chained PR names its place in the chain in the body (which PR comes before it and which come after), so reviewers know which one to read first.

### Return contract: the answer travels with its trace

Callers gate on this decision (`/sprint-development` blocks Stage 2 on it) and their gate is fail-closed, so a bare strategy label is rejected. Always return:

```
Chain strategy: <stacked-to-main | feature-branch-chain | size-exception | single-pr>
Decision trace: Q1=<Yes|No> (<one-clause reason>) · Q2=<Yes|No> (<reason>) · Q3=<Yes|No> (<reason>) → <leaf>
Decided by: /git-flow-master §Chained-PR decision tree (branching-strategies.md)
```

Answer the questions in order and stop at the leaf: a `Yes` at Q1 means Q2 and Q3 are never asked, so write `Q2=n/a · Q3=n/a`. Each answer carries the concrete reason from this change, not a restatement of the question, and the answers must actually lead to the stated leaf. A trace that only restates the conclusion is malformed, and the caller treats it as no decision.

This skill is the only authority that fills those lines. A planner or implementer that writes a strategy label without walking the tree has produced a guess (see "Gate design" in `agentic-dev-core/references/orchestration-doctrine.md`).

The branch plan is the contract for execution. If the implementation diverges (the actual diff is larger than the estimate), re-run the decision instead of quietly up-budgeting the existing strategy.

---

## Variables consumed

- `{{PROJECT_KEY}}`: issue prefix for branch naming (for example `UPEX-123`). Resolves from `.agents/project.yaml`.
- `{{ATLASSIAN_URL}}`: base URL for the Traceability section in PR bodies. Resolves from `.agents/project.yaml:atlassian_url`.
- A project without `.agents/project.yaml` lacks both. Fall back to a generic `{prefix}/{slug}` and warn in one line that the agentic layer is not installed: `bunx create-agentic-dev@latest <name>` for a new project, or `bunx create-agentic-dev@latest --adopt` then `/project-adoption` for an existing app (the Install model in `agentic-dev-core`).

---

## Autonomous use

A worker, a routine or a cloud session delivers exactly as an attended session does, because the gate is the decision (`.agents/skills/edd/SKILL.md`, "With nobody at the keyboard"): it commits, pushes under the push policy, opens the PR, enables auto-merge after `verify --merge` and watches the PR until it merges. A supervised worker enables auto-merge itself unless its workflow skill gives the merge step to its conductor: `/sprint-development` fleet mode does, and there the worker stops at its open, attested PR and the conductor enables auto-merge in dependency order. The only stops are the closed list in `.agents/skills/edd/references/human-gates.md`, plus the push ask under `confirm`. On that list, the Strategy Setup offer, the strategy question and the drift options of Step 1b are item 5 (a strategy or policy change), the admin-bypass re-confirm is item 3, and the destructive conflict options of 3.5 are items 1 and 2. The ruling on which of them reach a person is `agentic-dev-core/references/decision-protocol.md`.

| Case | Who holds those stops |
| --- | --- |
| A person is present | The person: ask the item and wait. |
| A supervised worker | The conductor or launcher: each item goes to it as a question with options and a recommendation, and only that change waits. |
| No one is present (a routine, `/autonomous-delivery`) | The delegating brief, when it covers the item (for example a brief that names the strategy and every questionnaire answer for Strategy Setup). Otherwise report the item and leave that change undelivered. |

Other work continues in every case. An absent person never turns `confirm` into `allowed`, and never authorizes a bypass or a force flag. `autonomous-delivery` never waits for a person, so the answers it needs travel in its brief.

---

## Hand-offs to other skills

| Situation | Hand off to |
| --- | --- |
| Strategic split of a large change | Step 4 (inline decision tree in this skill) |
| Per-story dev loop including code review | `/sprint-development` |
| TDD inside a feature | `/unit-testing` |
| Atlassian (Jira) operations triggered by a commit or PR | `/acli` |
| Backlog grooming and story refinement | `/product-management` |

---

## Isolated worktrees (parallel or risky work)

When work needs isolation from in-progress changes on the current branch (a second AI session in parallel, a hotfix while a feature is open, unrelated WIP you do not want to mix), use a git worktree: a second working directory on its own branch that shares one `.git`. The lifecycle is the same on every host and every creation path:

```
create  ->  bun run worktree:provision  ->  work  ->  bun run worktree:audit <wt> --rescue  ->  remove
```

- Create: `git worktree add ../dir -b feat/x main` works on any host and is the portable canon. A host's own tool (Claude Code `EnterWorktree` and `ExitWorktree`, a Codex-managed worktree) is a harness path only and still needs the two repo steps around it. Supervised fleets go through `/agent-orchestration`, and this repo's committed `orca.yaml` runs both steps as hooks (`agentic-dev-core/references/fleet-provisioning.md`).
- Provision copies the gitignored inputs a fresh worktree lacks (`.env`, `.vercel/`, local settings), installs dependencies and creates the `.claude/skills` alias.
- `.session/` is never copied. Durable state lives at `<<PRIMARY_ROOT>>` and is cited by absolute path (`.agents/README.md` §"Checkout roots").
- Audit before removing: `--rescue` copies state that lives only in the worktree back to the primary, never overwriting.

The usual gotcha is that a fresh worktree holds only the tracked files of its base, so untracked WIP does not teleport: `mv` it in, or commit first. Keep the primary tree's `git status` clean. Provenance is the commit's forensic trailers (§3.2), not a side file. The full lifecycle, the multi-session safety rules and the decision guide are in `references/worktrees.md`.

---

## Before you exit any operation

- [ ] Step 1 ran and the repo state was reported.
- [ ] The strategy is resolved (read from the `git_strategy:` block, inferred from the layout, or asked) and persisted to the block if newly chosen.
- [ ] The operation followed the runbook for that strategy.
- [ ] Each commit is atomic, conventional, free of AI attribution and closed by `Worktree:` then `Session:` (values from the `AGENT IDENTITY:` line, or `unknown`).
- [ ] No `git add -A`, `--force` or `--no-verify` ran without explicit authorization, and no global discard ran (any discard targeted explicit session-owned paths).
- [ ] Evidence, when depth asked for it, was created by `bun run edd attest`, with a tester other than the author at `standard` or deeper.
- [ ] A PR, if created, has a title under 70 characters, a body with Summary / Changes / Test Plan / Traceability / Evidence / Merge danger and the evidence block, its metadata set, and a base branch that matches the strategy. Auto-merge was enabled only after `verify --merge` passed (or the PR stopped under `manual`), the watcher is armed and the tab labelled, and its URL went back in the report.
- [ ] Conflicts, if any, are resolved and verified (`git status` clean, `git log` sensible).
- [ ] If Strategy Setup ran: each branch created was reported (off what, why), fast-forwards were true fast-forwards (a diverged pair went to conflict resolution), and the `git_strategy:` block was written in place with the fields that apply (strategy, branches, decisions, policy, protected, branch_prefixes, description, meta), preserving the rest of the file.

---

## Reference files

Read references on demand, not all upfront. Each file is self-contained.

| File | When to read |
| --- | --- |
| `references/branching-strategies.md` | The catalogue of strategies with detection signals, trade-offs and the chained-PR decision tree. Read when resolving the strategy or planning a chain. |
| `references/strategy-setup.md` | Strategy Setup (3.6) mechanics: questionnaire detail, per-strategy materialization table, fast-forward sync (never force), persist sequence, report format. Read when running or re-running setup. |
| `references/conventional-commits.md` | The type vocabulary, scope rules, breaking-change syntax and mixed-changes precedence. Read when proposing commits. |
| `references/pr-templating.md` | The PR body template, placeholder rules, label, reviewer and draft conventions, and the base-branch table. Read when opening a PR. |
| `references/pr-loop.md` | A PR from open to merged: metadata, merge enable, the watcher, the review-bot loop, the ready block, the PR announcement, close-out. Read when a PR is open. |
| `references/session-safety.md` | The shared-checkout hazards, cutting a branch from origin without switching, the `gh` account guard. Read before touching the index in a shared checkout or before the first `gh` call. |
| `references/conflict-resolution.md` | Playbooks per conflict type (merge, rebase, push rejected, detached HEAD, stash, unrelated histories, hook rejection). Read when 3.5 fires. |
| `references/ruleset-parity.md` | The `git:policy` contract: the strategy-to-ruleset mapping, accepted divergences, what the tool does not manage. Read when `verify` reports drift. |
| `references/worktrees.md` | Worktrees for isolated or parallel work: the repo lifecycle, manual git as the portable canon, harness tools, the untracked-files gotcha, multi-session safety, cleanup, decision guide. Read when isolating work or running parallel sessions. |
