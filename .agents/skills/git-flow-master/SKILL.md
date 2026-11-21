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
  - `strategy: solo-main` is the shipped default, not evidence of a decision. `meta.strategy_source` tells them apart: `inherited` means nobody chose. On a named project (`project.project_name` set) whose `strategy_source` is still `inherited`, offer Strategy Setup once per session and say what the default costs (no integration branch, no promotion path, no review gate). Only Strategy Setup stamps `chosen`. Never auto-run it; on a "no", proceed under the inherited strategy.
  - `policy:` records intent, not enforcement. At the first push, PR or merge intent of a session, run `bun run git:policy verify` (Step 1b), then `--stamp` when clean. Never hand-query the protection endpoints, and never state what the remote requires from a `declared` reading: say "declared, not verified".
  - GitHub has two protection mechanisms, classic (`branches/{b}/protection`) and rulesets (`rules/branches/{b}`); `git:policy verify` queries both. A `404` on the classic endpoint does not mean unprotected, because rulesets enforce PR requirements without it. A push that succeeds does not prove a rule is absent: admins bypass rulesets while the rule still binds everyone else. Report it as a bypass, never as permission.
  - Report drift, never auto-correct it. A mismatch between `policy:` and the host is shown with both values and three options (update the yaml, change the host, accept and record why). Editing `.agents/project.yaml` needs the user's choice, and so does writing the host: `git:policy apply` is a dry run until `--yes`, and it refuses to remove a guard, lower the approval bar, turn off code-owner review or widen the merge methods unless `--allow-loosening` names that specific give-up.
  - `require_code_owner_review: true` with no `CODEOWNERS` file is unsatisfiable, not strict: nobody outside the bypass list can clear it, so every merge becomes a bypass. Treat it as drift with a named remedy (add the file, or turn the flag off).
  - Config snippets in `references/` are illustrations. A claim about this repo's strategy, branches or policy cites `.agents/project.yaml` (or `git:policy verify` output) read in the same turn.
  - Before a direct push to a protected branch, resolve `git_strategy.policy.direct_push_to_protected` (Critical Rule 4). `allowed` is standing authorization: push without asking, because asking anyway collapses it into `confirm`. `confirm` asks every time. `forbidden` refuses and routes through a PR. A missing or null block behaves as `confirm`.
  - Never rewrite pushed history (amend, rebase) and never force-push (Critical Rule 5, an invariant no authorization relaxes). `--force`, `--force-with-lease` and `--no-verify` need the user's explicit request and an unshared branch. Fix forward with a new commit.
  - Offer admin bypass only when `admin_bypass: true`, and only after confirming at runtime that the operator is an admin and accepts the specific irreversible action.
  - Never run a repo-wide discard (`git restore .`, `git checkout -- .`, `git reset --hard`, untargeted `git stash`, `git clean -f`) (Critical Rule 13): concurrent sessions may share the working tree. Discard only explicit paths this session modified, and when ownership is unclear, stop and ask.
  - In a stacked or chained PR, the body names its place in the chain (which PR comes before it and which come after) so a reviewer knows what to read first.
  - Never `git add -A` or `git add .`. List explicit paths, so a secret or another session's work cannot ride along.
  - One commit has one responsibility, a conventional prefix and no AI attribution (Critical Rule 3). Every commit ends with the two forensic trailers `Worktree: <name|primary>` then `Session: <label>`, copied from the `AGENT IDENTITY:` context line (`unknown` when unresolved). They are provenance, not attribution; harness-branded trailers (`Claude-Session:`, an AI `Co-Authored-By:`) stay forbidden (§3.2).
  - When the pre-push or CI documentation-contract gate names a region (ADR-0017), update every page it lists in the same push. Only if they still hold, add `Docs-Checked: <label> <reason>` above the forensic trailers, and always with the reason, never by reflex.
  - When a pre-commit hook rejects a commit, stop, fix the cause and create a new commit. `--amend` would rewrite the previous, unrelated commit.
  - Propose every branch name, commit set and PR body, and wait for an explicit OK before executing (Autonomous use below says who gives it when no person is present). Commits, branch names and PR bodies are English.
  - `gh` is the PR transport. If it is missing or unauthenticated, surface the blocker and do not imply a PR was opened. Stop at PR creation: merging is the user's next step.
  - When a planned change passes about 400 changed lines, run the chained-PR decision (Step 4) before coding, and re-run it if the real diff outgrows the estimate. Return `Chain strategy`, `Decision trace` (each tree question answered with the reason from this change) and `Decided by`. This skill is the only authority that fills those lines; a bare label counts as no decision.
  - When a conflict fires, diagnose and classify it first, present options ranked by safety, and prefer a safe abort over a guess. Never pick a destructive option silently.
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

This skill is the single entry point for everything on the version-control layer: creating branches, writing commits, pushing safely, opening pull requests, resolving conflicts, and planning chained or stacked PRs when a change outgrows the review budget.

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

**Read full SKILL.md when**: running Strategy Setup, resolving a specific conflict type, planning a chain, picking a base branch or prefix for an unfamiliar strategy, setting up a worktree, or when the compact rules do not settle the operation.

---

## The six operations

Every invocation maps to one operation or a sequence of them. The request picks the operation; the resolved strategy shapes how it runs.

| Op | Trigger phrases (examples) | What the skill does |
| --- | --- | --- |
| Branch | "create branch", "new feature branch", "start UPEX-123" | Resolve the strategy, propose a name with prefix and issue key, wait for OK, check out |
| Commit | "commit this", "commit and push", "make atomic commits" | Group by responsibility, propose conventional commits, wait for OK, execute one by one |
| Push | "push", "push to main" | Diagnose the upstream, resolve the protected-branch policy, never `--force` without explicit user opt-in |
| PR | "create PR", "open PR", "gh pr create" | Pick the base branch from the strategy, render the body inline, ask for labels and reviewers, call `gh pr create` |
| Conflict | "fix conflict", "rebase failed", "push rejected" | Diagnose first (`references/conflict-resolution.md`), present options, guide the resolution, verify a clean state |
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

1. The `git_strategy:` block in `.agents/project.yaml`. If `git_strategy.strategy` is non-null (one of the slugs above), it plus `git_strategy.branches` (production, integration, ephemeral_pattern) and `git_strategy.decisions` (promote_method, feature_merge, hotfix_policy) are the persisted decision. A `git_strategy.decisions.*` field that is not `n/a` or empty means Strategy Setup skips that question on a re-run: idempotency is keyed off those fields, not markers. Inherited-template guard: the boilerplate ships the block filled (`strategy: solo-main`) and a scaffolded project inherits it verbatim (the scaffolder patches only `project.project_name` and `project.project_key`). A non-null strategy is therefore authoritative only when the project is onboarded. Read `project.project_name` in the same file: if it is `null`, the block was inherited and this project did not choose it, so treat the strategy as unconfirmed and route to the Bootstrap trigger's inherited case (the skill still operates under the inherited strategy if the offer is declined). If `project.project_name` is set, the block is confirmed and gets no nudge.
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
- (b) Inherited: `git_strategy.strategy` is non-null but `project.project_name` is `null`. The block came from the template and this project has not been onboarded; treat it as unconfirmed.

If either holds, offer Strategy Setup with the matching prompt. Do not auto-execute and do not pick a strategy silently.

> _(unset case (a))_ "No git strategy is set up yet. Want me to run Strategy Setup, pick the flow, create the branches it needs, and write the `git_strategy:` block in `.agents/project.yaml`? (Y/N)"

> _(inherited case (b))_ "This project's `git_strategy` looks inherited from the boilerplate (project not onboarded yet, `project.project_name` is null). Want to run Strategy Setup to define this project's own flow? (Y/N)"

- Offer once per session and reuse the answer.
- A "No" proceeds with the requested operation under the detected (a) or inherited (b) strategy, without writing the block. A "Yes" enters Strategy Setup (3.6) before the original intent continues.
- The boilerplate ships `.agents/project.yaml` with the block filled and the updater freezes the file via `bootstrapOnlyPaths`, so (a) and (b) are the two ways a project reaches a real git intent without having confirmed its own flow. The offer fires on first real use by design, as a guard against the template trap. With `project.project_name` set, the strategy counts as confirmed and neither case fires, except the third case in 3.6.

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
3. Ask once, "Is there an issue key for this work?", and accept "no".

Branch name format:

- With a key: `{prefix}/{ISSUE-KEY}-{kebab-slug}` (for example `feat/UPEX-123-bulk-assign-users`).
- Without a key: `{prefix}/{kebab-slug}` (for example `refactor/split-auth-utils`).
- Slugs are lowercase, hyphen-separated and at most 50 characters.

Source branch by strategy:

- `solo-main`, `github-flow`, `trunk-based`: branch off `main`.
- `main-integration`, `gitlab-flow`: branch off the integration branch (`staging`, `dev` or equivalent).
- `enterprise`: branch off the integration branch, except `hotfix/*`, which branches off `main`.
- `gitflow`: `feature/*` off `develop`, `hotfix/*` off `main`, `release/*` off `develop`.

Propose the name and wait for OK before `git checkout -b`; a branch created silently is hard for the user to trust.

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

Present all proposed commits as one block and wait for OK, modify or reject before executing.

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
- `enterprise`: `main`, the integration branch and any `release/*`.

Before pushing to one of them, read `git_strategy.policy.direct_push_to_protected` (Critical Rule 4):

- `allowed`: standing authorization. Push without a per-push confirm. The recorded value is the authorization (Strategy Setup stamped it with the user), and asking anyway collapses `allowed` into `confirm`.
- `confirm` (the default): ask every time, _"You are about to push directly to the protected branch `{branch}` in a `{strategy}` flow. Confirm?"_, and wait for an explicit yes.
- `forbidden`: refuse the direct push and route the work through a PR (branch off the strategy's default base, push the work branch, open a PR via 3.4).
- A missing or null `git_strategy` block (fresh scaffold, project never onboarded) behaves as `confirm`. The safe default is to ask.

Admin bypass is rare and opt-in. It may be offered only when `git_strategy.policy.admin_bypass: true`. Even then, confirm both at runtime before bypassing: that the operator is a repo admin (ask them, the skill cannot see the GitHub role) and that they accept the specific irreversible action. With `admin_bypass: false`, never offer a bypass.

Pass `--force`, `--force-with-lease`, `--no-verify` or any history-rewriting flag only when the user explicitly asks and the branch is unshared, and note the request in the conversation (Critical Rule 5).

### 3.4 Pull request

The base branch comes from the strategy:

| Strategy | Default PR base |
| --- | --- |
| `solo-main`, `github-flow`, `trunk-based` | `main` |
| `main-integration`, `gitlab-flow` | the integration branch (for example `staging`) |
| `enterprise` | the integration branch; `hotfix/*` goes to `main` |
| `gitflow` | `feature/*` to `develop`; `hotfix/*` to `main`; `release/*` to `main` (and back-merge to `develop`) |

The user can override with `--base X`. When they do, say so in the confirmation: _"PR will target `{base}` instead of the strategy default `{default}`."_

Title format: `{type}({ISSUE-KEY}): {description}`, under 70 characters. Without a key: `{type}: {description}`.

Body: render it inline (there is no template file to read) with the structure in `references/pr-templating.md`. Fill the placeholders the skill can (`<<ISSUE_KEY>>`, `<<SUMMARY>>`, `<<CHANGES>>`, `<<TEST_PLAN>>`, `<<EVIDENCE>>`, `<<RISK>>`, `<<WORKTREE>>`, `<<SESSION_LABEL>>`, and `<<TRAIL>>`, which is dropped together with its `## Trail` section when the change has no trail). Leave an unfilled placeholder visible so the author can edit it before posting, and do not drop sections silently. The `- Worktree:` and `- Session:` provenance lines carry the same values as the commit trailers (`unknown` when unresolved) and are dropped together only on a human-opened PR (`references/pr-templating.md` § Placeholder rules).

Fill `<<RISK>>` with the merge danger, in three lines. First, say whether the merge is a one-way door (destructive or hard to reverse: migrations, deleted data, published contracts) or a two-way door (cheap to roll back). Second, give the blast radius in a word or two (consumers, other modules, layout, rollback cost). Third, give the rollback plan.

Write the rendered body to a tempfile (for example `$(mktemp)`) and pass it with `gh pr create --body-file` to avoid escaping problems. Reviewers, labels and draft conventions are in `references/pr-templating.md`; verify labels with `gh label list` when unsure instead of hardcoding labels the repo may not have.

```bash
gh pr create \
  --title "{title}" \
  --body-file {tmpfile} \
  --base {base} \
  [--reviewer {users}] \
  [--label {labels}] \
  [--draft]
```

After creating the PR, state how many approvals stand between it and a merge, and where that number came from. With a Step 1b reading of `policy_source: verified`, say _"the host requires N approving review(s) on `{base}`"_. With `policy_source: declared`, say _"declared `require_pr_reviews: N` in `.agents/project.yaml`, not verified against the host"_. A silent assumption here is what turns "just merge it" into a surprise mid-merge.

Stop at PR creation. Merging is the user's next step: _"Review the PR. Once approved, merge via the GitHub UI or run `gh pr merge {number} --squash --delete-branch`."_ `gh` is the transport; if it is missing or `gh auth status` fails, surface the blocker and do not pretend a PR was opened.

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
2. Present options ranked by safety. A destructive option (force push, hard reset, aborting an unfinished merge that has uncommitted work) is never picked silently.
3. Guide the resolution step by step.
4. Verify with `git status` and `git log --oneline -3`.
5. Add one short note on how to avoid it next time.

When in doubt, abort safely (`git merge --abort`, `git rebase --abort`, `git cherry-pick --abort`) instead of pushing forward. An abort is always recoverable and a guess is not.

### 3.6 Strategy Setup

The first five operations adapt to a strategy that already exists. Strategy Setup establishes one: it resolves (or asks) the strategy, captures the merge, hotfix and protection decisions the other operations depend on, materializes the long-lived branches, and writes the `git_strategy:` block in `.agents/project.yaml`. It is the only operation that creates branches and writes the strategy block.

**When it runs**

- The user asks: "set up our git strategy", "bootstrap branching", "materialize the flow".
- A git intent arrives and any of these holds (the skill offers and never auto-runs; see the Bootstrap trigger):
  - `git_strategy.strategy` is null, or the block is absent, on a fresh-looking repo.
  - `git_strategy.strategy` is non-null but `project.project_name` is null: the unonboarded template itself.
  - `git_strategy.meta.strategy_source: inherited` and `project.project_name` is set: a real project that onboarded and never chose a strategy. The two conditions above both miss it, because the strategy is not null and the project name is filled.

Say the third case out loud when it fires. The shipped default is `solo-main`: one branch, no integration branch, no promotion path, no review gate of its own. That is right for a template with one maintainer and thin for a product with a team, a staging environment or a release cadence. Say which of those the repo looks like and let the user decide. A default nobody picked is not a decision, though it is not automatically wrong either.

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
| Q4 | Protected-branch bypass policy | all strategies | direct push to protected: **`confirm`** / `forbidden` / `allowed`; admin bypass: **`false`** / `true`; require PR reviews: `null` / `0` / `N` | how strictly the Push gate (3.3) guards protected branches |

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
    direct_push_to_protected: forbidden|confirm|allowed
    admin_bypass: true|false      # team POLICY (intent), not enforcement; real capability depends on the GitHub user's role
    require_pr_reviews: null|0|N
```

**Boundaries during setup**

- Never `--force` or `--force-with-lease` during a setup sync. Sync only on a true fast-forward. If the integration and production pair has diverged both ways, stop and hand over to conflict resolution (3.5).
- A setup fast-forward push is still a push to a protected branch, so ask first. Setup runs before the user has ratified the new `policy:` values, which means `allowed` does not authorize its own setup push.
- Propose branch creation and wait for OK before any `git checkout -b` or `git branch`: show which branch, off what, and why.
- Commits made by setup carry no AI attribution (Critical Rule 3).

---

## Step 4: Chained and stacked PRs

When a planned change estimates over 400 changed lines (additions plus deletions), split the work. The 400-line cognitive review budget comes from industry research (SmartBear and Cisco code-review studies): above it, defect detection drops sharply.

There are three ways to split:

1. `stacked-to-main`: 2 to 4 small PRs, each branched off the strategy's default base, each depending on the previous merge. The base works between merges. Best for linearly decomposable work.
2. `feature-branch-chain`: one long-lived integration branch; child PRs merge into it and one final PR merges it to the default base. Best when shared scaffolding (new types, new schemas) would break a partial merge.
3. `size-exception`: for mechanical diffs (mass renames, formatter sweeps, generated code, vendor updates). It needs an explicit user override and a `Why size-exception:` line in the PR body.

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

Several steps wait for a person: the OK on a proposed branch, commit set or PR body, the protected-branch confirm under `confirm`, the Strategy Setup offer, the strategy question, the drift options of Step 1b, and the conflict options of 3.5. The ruling on who may decide is `agentic-dev-core/references/decision-protocol.md`; these are the three cases.

- A person is present: the gates work as written above.
- A supervised worker: the conductor or launcher that dispatched it holds the gates and answers them.
- No one is present (a routine, `/autonomous-delivery`): the delegating brief is the approval source when it covers the decision, for example a recorded `allowed` policy or a brief that names the branch and commit set. Without that, do the reversible work (a local branch, local commits, a rendered PR body) and stop before anything outward or irreversible: a push to a protected branch, a PR, an admin bypass, a force of any kind. Report what is ready and what is waiting. Strategy Setup runs unattended only when the brief names the strategy and every questionnaire answer; otherwise the offer goes into the report. `autonomous-delivery` never waits for a person, so it carries the approval in its brief.

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
- [ ] A PR, if created, has a title under 70 characters, a body with Summary / Changes / Test Plan / Traceability / Merge danger, and a base branch that matches the strategy. Its URL went back to the user and no merge was attempted.
- [ ] Conflicts, if any, are resolved and verified (`git status` clean, `git log` sensible).
- [ ] If Strategy Setup ran: branches were proposed and not auto-created, fast-forwards were true fast-forwards (a diverged pair went to conflict resolution), and the `git_strategy:` block was written in place with the fields that apply (strategy, branches, decisions, policy, protected, branch_prefixes, description, meta), preserving the rest of the file.

---

## Reference files

Read references on demand, not all upfront. Each file is self-contained.

| File | When to read |
| --- | --- |
| `references/branching-strategies.md` | The catalogue of strategies with detection signals, trade-offs and the chained-PR decision tree. Read when resolving the strategy or planning a chain. |
| `references/strategy-setup.md` | Strategy Setup (3.6) mechanics: questionnaire detail, per-strategy materialization table, fast-forward sync (never force), persist sequence, report format. Read when running or re-running setup. |
| `references/conventional-commits.md` | The type vocabulary, scope rules, breaking-change syntax and mixed-changes precedence. Read when proposing commits. |
| `references/pr-templating.md` | The PR body template, placeholder rules, label, reviewer and draft conventions, and the base-branch table. Read when opening a PR. |
| `references/conflict-resolution.md` | Playbooks per conflict type (merge, rebase, push rejected, detached HEAD, stash, unrelated histories, hook rejection). Read when 3.5 fires. |
| `references/ruleset-parity.md` | The `git:policy` contract: the strategy-to-ruleset mapping, accepted divergences, what the tool does not manage. Read when `verify` reports drift. |
| `references/worktrees.md` | Worktrees for isolated or parallel work: the repo lifecycle, manual git as the portable canon, harness tools, the untracked-files gotcha, multi-session safety, cleanup, decision guide. Read when isolating work or running parallel sessions. |
