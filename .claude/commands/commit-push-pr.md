# Commit, Push, PR

> One-shot guided flow: analyse changes → commit by groups → push → open a structured PR.
> Stops after the PR is created. Merge is explicit and out of scope (happens in the GitHub UI or via `gh pr merge`).

**Input**: `$ARGUMENTS` (optional) — issue key override (e.g. `UPEX-123`), target base branch (e.g. `--base staging`), or short description of the work.

---

## Preconditions

- `gh` CLI available and authenticated (`gh auth status`). If not, stop before Step 7 and surface the blocker to the user.
- Working tree has changes to ship, OR the current branch already has unpushed commits, OR the branch is pushed and the only task is opening a PR. Otherwise there is nothing to do — stop and report.

---

## Step 1 — Detect current state

Run and summarise:

```bash
git status
git branch --show-current
git diff --stat
git log --oneline -5
git fetch origin
git status -sb
```

Report to the user:

- Current branch.
- Dirty vs clean working tree (counts: staged / unstaged / untracked).
- Unpushed commits (ahead / behind upstream).
- Upstream status (no upstream, up-to-date, diverged).

Do not act until the picture is clear.

## Step 2 — Protected branch guard

If the current branch is `main` or `staging` **and** the working tree is dirty:

1. Warn the user explicitly: _"You are on a protected branch (`{branch}`) with uncommitted changes."_
2. Require opting into a semantic branch before continuing (Critical Reminder #5 in `AGENTS.md`: confirm before push to `main`). See Step 3 for the prefix vocabulary.
3. Do not commit on the protected branch unless the user explicitly insists.

If the branch is already clean but the user plans to push directly to `main`/`staging`, still require explicit confirmation at Step 6.

## Step 3 — Branch detection / creation (issue-key + semantic prefix convention)

Branch names use the **same semantic vocabulary as commits**, so the branch announces the contract of the work.

### Prefix vocabulary

| Branch prefix | Use when the dominant change is…                              |
| ------------- | ------------------------------------------------------------- |
| `feat/`       | A new feature or capability                                   |
| `fix/`        | A bug fix                                                     |
| `test/`       | Writing or updating automated tests (no product-code changes) |
| `docs/`       | Documentation only                                            |
| `refactor/`   | Code change without behaviour change                          |
| `chore/`      | Tooling, config, deps, housekeeping                           |

**Mixed changes**: pick the prefix of the _dominant_ change by semantic weight: `feat` > `fix` > `refactor` > `test` > `docs` > `chore`. Example: a feature PR that ships tests alongside the feature code is `feat/`, not `test/`.

### Extract the issue key

In this order:

1. From the current branch name using the regex `(?:feat|feature|fix|test|docs|refactor|chore)/([A-Z]+-\d+)-`.
2. If no match, search `$ARGUMENTS` for the pattern `[A-Z]+-\d+` (e.g. `UPEX-123`, `OB-45`).
3. If still no match, ask the user: _"Is there an issue key for this work? (yes → provide it; no → proceed without)."_

### Propose a new branch

If the user needs a **new** branch (currently on `main`/`staging`, or explicitly asks to branch off):

- Decide the prefix from the dominant change (see table + mixed-changes rule above).
- With an issue key: `{prefix}/{ISSUE-KEY}-{kebab-slug}` (e.g. `feat/UPEX-123-bulk-assign-users`, `fix/OB-45-empty-reservation-list`).
- Without an issue key: `{prefix}/{kebab-slug}` (e.g. `refactor/split-auth-utils`).
- Derive the kebab slug from the diff summary or from `$ARGUMENTS`.
- Present the proposed branch name _and_ which prefix you chose + why. Wait for OK. Do not create the branch unilaterally.

Once confirmed: `git checkout -b {branch}`.

## Step 4 — Group changes and propose commits

Inspect `git status` and `git diff` and group files by responsibility. Suggested heuristics:

| Group                    | Typical paths                                                                                                                        |
| ------------------------ | ------------------------------------------------------------------------------------------------------------------------------------ |
| **Source code**          | `src/`, `app/`, `components/`, `pages/`, `lib/`, `api/` (excluding generated schemas)                                                |
| **Tests**                | `tests/`, `__tests__/`, `*.test.ts`, `*.test.tsx`, `*.spec.ts`, `*.spec.tsx`                                                         |
| **Generated / fixtures** | `api/schemas/`, generated types, OpenAPI-derived files                                                                               |
| **Config**               | `package.json`, `tsconfig.json`, `eslint.config.*`, `.prettierrc*`, `.env.example`, `next.config.*`, CI files (`.github/workflows/`) |
| **Docs**                 | `README.md`, `CLAUDE.md` / `AGENTS.md`, `docs/`, `.claude/commands/`, `.claude/skills/`, `.plans/`                                   |

For each group with changes, propose **one** commit. The proposal must include:

- **Semantic prefix** from this fixed vocabulary:
  - `feat:` — new feature or capability
  - `fix:` — bug fix
  - `test:` — adding or updating automated tests
  - `docs:` — documentation only
  - `refactor:` — code change without behaviour change
  - `chore:` — tooling, config, deps, housekeeping
- **Issue key** in the message when present. Format: `{type}({ISSUE-KEY}): {description}` (e.g. `feat(UPEX-123): add bulk-assign action`). Without a key: `{type}: {description}`.
- **Short justification** — one sentence on _why_ these files belong in one commit (shared responsibility / same layer / atomic change).
- **File list** — exact paths that will be staged.

Present all proposed commits in a single block. Wait for the user to OK, modify, or reject individual commits before moving on. Do not execute anything yet.

## Step 5 — Execute commits

For each accepted commit (in order):

```bash
git add {exact files}
git commit -m "{type}({ISSUE-KEY}): {description}"
```

Rules:

- One commit = one responsibility. Never bundle unrelated changes.
- **Never** add AI attribution. No `Generated with Claude Code`, no `Co-Authored-By: Claude`, no equivalent line (Critical Reminder #4 in `AGENTS.md`). Commits must look human-authored.
- Never `git add -A` / `git add .` — always list the files explicitly to avoid pulling in secrets or unrelated work.
- After each commit, show the resulting commit hash and one-line summary so the user can verify.

If a pre-commit hook fails, stop. Report the failure. Fix the underlying issue and create a **new** commit — never `--amend` a commit that the hook rejected (Critical Reminder #7 in `AGENTS.md`: never rewrite pushed history; do not rewrite local commits the hook rejected either, add forward instead).

## Step 6 — Push

Decide the push command based on Step 1 output:

- No upstream yet (`git status -sb` shows no tracking): `git push -u origin {branch}`.
- Upstream exists and is behind: `git push`.
- Upstream exists and has diverged: **stop** and surface to the user. Do not force push (Critical Reminder #7 in `AGENTS.md`).

**Before pushing to `main` or `staging`**, require explicit confirmation from the user (Critical Reminder #5 in `AGENTS.md`). Pushing to a semantic branch (`feat/*`, `fix/*`, `test/*`, `docs/*`, `refactor/*`, `chore/*`) does not need extra confirmation beyond the user's original request.

Never pass `--force`, `--force-with-lease`, `--no-verify`, or any history-rewriting flag unless the user has explicitly requested it and understands the consequences.

## Step 7 — Open PR

Build the PR title and body, then call `gh pr create`.

### Title

Format: `{type}({ISSUE-KEY}): {description}` — keep under 70 characters. Without an issue key: `{type}: {description}`. Examples:

- `feat(UPEX-123): add bulk-assign action`
- `fix(OB-45): handle empty response in reservation list`
- `docs: clarify branch prefix vocabulary`

### Body

Build the body **inline** (no template file to read) using the structure below. Substitute the placeholders the command can fill from session context. Leave any unfilled placeholder **visible** in the final body so the author can edit before posting if desired — do not silently delete sections.

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

## Evidence

<<EVIDENCE>>

## Risk

<<RISK>>
```

Placeholder rules:

- `<<ISSUE_KEY>>` — key extracted in Step 3. If absent, drop the issue line from the Traceability section rather than leaving a dangling link.
- `<<ISSUE_URL>>` — `{{JIRA_URL}}/browse/<<ISSUE_KEY>>` when both are available (`{{JIRA_URL}}` comes from `.agents/project.yaml`; `<<ISSUE_KEY>>` is computed in-session).
- `<<SUMMARY>>` — one-paragraph summary of the change derived from the commits. What changed, why it changed.
- `<<CHANGES>>` — bulleted list of the commits created in Step 5 (`{type}({ISSUE-KEY}): {description}` per line).
- `<<TEST_PLAN>>` — bulleted steps to verify the change: test commands (`bun run lint`, `tsc --noEmit`, unit tests), manual checks, environments hit.
- `<<EVIDENCE>>` — pointer to `.context/PBI/{module}/{TICKET-ID}-{name}/evidence/` when relevant (screenshots, traces, logs). Optional for DEV PRs; leave the placeholder literal if nothing applies so the author can fill it in.
- `<<RISK>>` — short risk assessment: blast radius, affected modules, rollback plan.

Write the rendered body to a temp file (e.g. `$(mktemp)`) so `gh pr create --body-file` can consume it without escaping issues.

### Reviewers, labels, base branch, draft

- **Reviewers**: if `.github/CODEOWNERS` exists and matches the modified paths, suggest the owners; otherwise ask the user. Never hardcode usernames.
- **Labels**: suggest labels based on the dominant prefix from Step 4:
  - `feat:` → `feature`
  - `fix:` → `bugfix`
  - `docs:` → `docs`
  - `chore:` / `refactor:` → `chore`
  - Always combine the type label with `ready-for-review` (or propose `--draft` instead if the user wants a draft PR).
    Ask before applying. Never hardcode labels the repo may not have configured — verify via `gh label list` if uncertain.
- **Base branch**: default `main`. Override if `$ARGUMENTS` specifies one (`--base staging`) or if the current branch clearly chains off a different base.

### Create the PR

Run exactly:

```bash
gh pr create \
  --title "{title}" \
  --body-file {tmpfile} \
  --base {base} \
  [--reviewer {user1},{user2}] \
  [--label {label1},{label2}] \
  [--draft]
```

Return the PR URL to the user.

## Step 8 — Done

- **Do not merge.** Merging is explicit and out of scope for this command.
- Surface next steps: _"Review the PR. Once approved, merge via the GitHub UI or run `gh pr merge {number} --squash --delete-branch`."_
- Clean up the temp body file if one was created.

---

## Rules

- **Analyse before acting.** Never assume repo state. Step 1 runs every time.
- **Atomic commits.** One commit = one responsibility. No bundled unrelated changes.
- **No AI attribution** in commit messages or PR bodies (Critical Reminder #4 in `AGENTS.md`). Commits and PRs must look human-authored.
- **Confirm before push to `main`/`staging`** (Critical Reminder #5 in `AGENTS.md`). Feature/fix branches do not need extra confirmation beyond the user's request.
- **Never force push, never rewrite pushed history, never bypass hooks** (Critical Reminder #7 in `AGENTS.md`). No `--force`, `--force-with-lease`, `--no-verify`, `--amend` on published commits, or rebase on pushed branches unless the user explicitly authorises it.
- **Show proposed commits and wait for OK** before executing Step 5. The user can accept, modify, or reject any commit.
- **Never stage files with `git add -A` / `git add .`** — always list the paths, to avoid pulling in secrets (`.env`, credentials) or unrelated work.
- **If `gh` is missing or unauthenticated**, stop at the end of Step 6 and surface the blocker. Do not pretend the PR was opened.
- **Auto-merge is never invoked.** This command stops at PR creation. Merging is the user's explicit next step.

---

## Final Checklist (before exiting)

- [ ] Step 1 ran and the repo state was reported to the user.
- [ ] Branch matches the prefix vocabulary (`feat/`, `fix/`, `test/`, `docs/`, `refactor/`, `chore/`).
- [ ] Each commit is atomic and uses the semantic prefix + issue key when known.
- [ ] No AI attribution anywhere in commits or PR body.
- [ ] No `git add -A` / `--force` / `--no-verify` used unless the user explicitly authorised it.
- [ ] PR title under 70 chars; body has Summary, Changes, Test Plan, Traceability, Evidence, Risk.
- [ ] PR URL returned to the user; no merge attempted.
