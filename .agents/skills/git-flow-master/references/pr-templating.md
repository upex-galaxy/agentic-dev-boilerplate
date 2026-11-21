# PR templating: body, labels, reviewers, base branch

This file is the contract for opening pull requests. The body is rendered inline, because no template file exists in the repo. The skill fills every placeholder it can from session context and leaves the rest visible, so the author completes them before posting. A section is never dropped silently.


## Title

Format: `{type}({ISSUE-KEY}): {description}`, under 70 characters.

Without an issue key: `{type}: {description}`.

Examples:

- `feat(UPEX-123): add bulk-assign action`
- `fix({{PROJECT_KEY}}-45): handle empty response in reservation list`
- `docs: clarify branch prefix vocabulary`
- `chore(deps): bump zod to v4`

The title is the first thing reviewers see in the PR list, so keep it scannable.


## Body: inline template

Render this as written, substituting the placeholders:

```markdown
## Summary

<<SUMMARY>>

## Changes

<<CHANGES>>

## Test Plan

<<TEST_PLAN>>

## Traceability

- Issue: [<<ISSUE_KEY>>](<<ISSUE_URL>>)
- Branch: `{branch}`
- Base: `{base}`
- Strategy: `{strategy}`
- Worktree: `<<WORKTREE>>`
- Session: `<<SESSION_LABEL>>`

## Trail

<<TRAIL>>

## Evidence

<<EVIDENCE>>

## Merge danger

<<RISK>>
```

### Placeholder rules

| Placeholder | What goes here |
| --- | --- |
| `<<SUMMARY>>` | One-paragraph summary derived from the commits: what changed and why. When Step 4 returned `stacked-to-main` or `feature-branch-chain`, it also says where this PR sits in the chain. |
| `<<CHANGES>>` | Bulleted list, one bullet per commit, format `- {type}({ISSUE-KEY}): {description}`. |
| `<<TEST_PLAN>>` | Bulleted steps to verify: test commands run, manual checks done, environments hit. Mark each `[x]` once verified locally. |
| `<<ISSUE_KEY>>` | Key extracted in the branch step. Without one, drop the whole `- Issue:` line so no link dangles. |
| `<<ISSUE_URL>>` | `{{ATLASSIAN_URL}}/browse/<<ISSUE_KEY>>` when both are available. Otherwise drop. On the `github` tracker, the issue's own URL. |
| `<<TRAIL>>` | When the change has a trail (`/sprint-development` `## The trail`): a link to its folder at the PR head commit (`https://github.com/<owner>/<repo>/tree/<head-sha>/<trail-dir>/<KEY>-<slug>`), then the Spec Compliance Matrix copied from `results.md`, nothing else from the trail. Without a trail, drop the `## Trail` section. On the `github` tracker with no integration branch, also add `Closes #<n>` to the body. |
| `{branch}` | Current branch name (computed by the skill). |
| `{base}` | PR base branch (resolved from the strategy, see the table below). |
| `{strategy}` | Active strategy slug (`solo-main`, `main-integration`, etc.). Helps reviewers understand the merge target. |
| `<<WORKTREE>>` / `<<SESSION_LABEL>>` | The same two values the commit trailers carry, copied from the `AGENT IDENTITY:` line in session context (`worktree=…`, `session=…`; `SKILL.md` §3.2). A value the line does not resolve is written `unknown`, never guessed. A human-opened PR drops both lines. |
| `<<EVIDENCE>>` | Pointer to evidence a reviewer can open: a PR comment or a Jira attachment (screenshots, traces, logs). The session working copy (`.session/sprint-development/<KEY>/evidence/`) is local, so it is never the only pointer. For backend or CLI PRs without visual evidence, leave the placeholder so the author can fill it in or delete it. See Evidence below. |
| `<<RISK>>` | The merge danger, three lines: `**Door:**` one-way or two-way, `**Blast radius:**` in a word or two, `**Rollback:**` the plan. See Merge danger below. |

A padded section invites skim-reads, so write each one at the size its content needs.

The `Worktree` and `Session` lines are provenance for debugging, not authorship attribution. They exist so a broken, abandoned or conflicting PR can be routed back to the session that explains why it exists. They name a checkout and a session, never a tool, so they do not conflict with the no-AI-attribution rule (`conventional-commits.md` § Hard rules). Harness-branded provenance (a `claude.ai` session link, a `~/.claude/projects/…` transcript path) is out of place here for the same reason it is out of place in a commit.

### Evidence

Show a before and after: what the change did not do, then what it does. Rank by weight:

1. Screenshots, when the environment allows it and the change is visual. These carry the most weight.
2. Execution output: a test run, console output. Name the exact test that failed before and passes now, in a line of pseudocode.
3. A description of the check, only when neither of the above exists.

### Merge danger

`<<RISK>>` renders as three lines: `**Door:**`, `**Blast radius:**` and `**Rollback:**` (see the worked example), each followed by optional detail.

The door is `one-way` or `two-way`. A two-way door can be walked back, so a PR that is cheap to roll back is low risk. A destructive action or a hard-to-reverse decision (a migration, deleted data, a published contract or release, a deleted branch) makes it one-way.

The blast radius is one word for the scope of impact (`docs`, `one module`, `all consumers`), followed by the ramifications a reviewer should weigh: broken consumers, layout shift, other environments, a pipeline that reads the changed file. Consider every consumer before choosing the word.

The rollback line gives the plan to undo the change: revert the PR, switch a flag off, restore from a backup. For a one-way door, either name a real plan or say there is none. Production deploys make this line matter most.


## Base branch, resolved from strategy

| Strategy | Default PR base | Notes |
| --- | --- | --- |
| `solo-main` | `main` | PRs are optional in this flow; if used, target `main`. |
| `main-integration` | integration branch (e.g. `staging`) | Promotion PRs (`staging` to `main`) are explicit, separate events. |
| `enterprise` | integration branch | Exception: `hotfix/*` goes to `main`, with a back-merge to integration. |
| `trunk-based` | `main` | PRs are short-lived; merges are fast. |
| `gitflow` | `develop` for `feature/*`; `main` for `release/*` and `hotfix/*` | Release PRs back-merge to `develop` after merging to `main`. |
| `github-flow` | `main` | Always. |
| `gitlab-flow` | `main` | Promotion MRs target `pre-production`, then `production`. |

The user can override with `--base X` in arguments. When overridden, surface it in the confirmation:

> _"PR will target `{base}` instead of the strategy default `{default}`. Confirm?"_


## Labels

Suggest labels based on the dominant commit type:

| Type | Label |
| --- | --- |
| `feat:` | `feature` |
| `fix:` | `bugfix` |
| `docs:` | `docs` |
| `perf:` | `feature` (or `perf` if the repo defines it) |
| `chore:` / `refactor:` / `style:` / `test:` / `build:` / `ci:` | `chore` |
| Breaking change (`!`) | `breaking-change` |

Combine the type label with `ready-for-review`, or propose `--draft` when the user wants a draft PR.

Repos differ, so run `gh label list` when unsure before applying a label, and treat the table as suggestions the repo may not have configured. When a label is missing, ask whether to create it or skip it. This label step belongs to `/git-flow-master`: on `jira` and `none` it never loads `/github-projects` (`agent-tool-resolution.md` §6.5).


## Reviewers

- If `.github/CODEOWNERS` exists and matches the modified paths, suggest the matched owners.
- Otherwise ask the user. Usernames come from the repo's CODEOWNERS or the user, because teams change.

For solo-main and personal projects, reviewers are usually skipped.


## Draft vs ready-for-review

Open as `--draft` when:

- The implementation is intentionally incomplete (early feedback wanted).
- CI is expected to fail until follow-up commits land.
- The user explicitly says "draft".

Otherwise open as ready-for-review with the appropriate label.


## Rendering and submission

Write the rendered body to a tempfile to avoid shell-escaping issues:

```bash
TMP=$(mktemp)
cat > "$TMP" <<'EOF'
## Summary
…rendered body…
EOF

gh pr create \
  --title "{title}" \
  --body-file "$TMP" \
  --base "{base}" \
  [--reviewer {users}] \
  [--label {labels}] \
  [--draft]

rm "$TMP"
```

Show the rendered body and base branch to the user before running `gh pr create`, so they can edit, accept or reject it. With nobody present (a worker or a routine), the delegating brief authorises the PR when it names it. Otherwise stop with the body written to a file and report, because opening a PR is an outward action (see `agentic-dev-core/references/decision-protocol.md`).


## After creation

- Return the PR URL.
- Surface the next step: _"Review the PR. Once approved, merge via the GitHub UI or run `gh pr merge {number} --squash --delete-branch`."_
- Leave the merge to the user: it is a separate, explicit action, never part of opening the PR.


## Worked example

Branch: `feat/UPEX-123-bulk-assign`
Strategy: `main-integration` (integration = `staging`)
Issue key: `UPEX-123`
Two commits:

1. `feat(UPEX-123): add bulk-assign domain model and tests`
2. `feat(UPEX-123): wire bulk-assign into users table UI`

Rendered body:

```markdown
## Summary

Adds bulk-assign action to the users table so admins can transfer
ownership of multiple records in one operation. Backed by a new domain
model with unit tests; UI uses the existing table-action slot.

## Changes

- feat(UPEX-123): add bulk-assign domain model and tests
- feat(UPEX-123): wire bulk-assign into users table UI

## Test Plan

- [x] Unit tests pass (`bun run test domain/bulk-assign`)
- [x] Lint green (`bun run lint:check`)
- [x] Types green (`bun run types:check`)
- [ ] Manual smoke test on staging after merge

## Traceability

- Issue: [UPEX-123](https://upex.atlassian.net/browse/UPEX-123)
- Branch: `feat/UPEX-123-bulk-assign`
- Base: `staging`
- Strategy: `main-integration`
- Worktree: `UPEX-123-bulk-assign`
- Session: `UPEX-123-sprint-development`

## Evidence

Design walkthrough screenshots are attached to UPEX-123 in Jira and to the
first comment of this PR.

## Merge danger

**Door:** two-way. The new code path sits behind a feature flag (`bulkAssign`).

**Blast radius:** one module, the users table.

**Rollback:** disable the flag and revert this PR.
```

Title: `feat(UPEX-123): add bulk-assign action`
Labels: `feature, ready-for-review`
Base: `staging`
