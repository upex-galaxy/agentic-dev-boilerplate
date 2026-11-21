---
name: github-projects
description: "GitHub Issues and Projects v2 operator for projects whose `issue_tracker` is `github`. Use when creating or refining an issue, moving a card on the Kanban board, bootstrapping or checking the GitHub Project, or defining and closing a release milestone. Not for Jira (/acli), git or PRs (/git-flow-master) or story delivery (/sprint-development)."
license: MIT
compatibility: [claude-code, codex, opencode, pi]
allowed-tools: Bash(gh:*), Bash(bun:*)
phase: planning
complementary_categories: []
compact_rules: |
  - Resolve the tracker first: `issue_tracker.issue_tracker` in `.agents/project.yaml`, read in the same turn (`cli/lib/issue-tracker.ts`). Act only when it is `github`; for `jira` hand off to `/acli`, for `none` make no tracker call.
  - Read-modify-read: every card move is `gh project item-edit --field Status --value "<option name>"`, followed by `gh project item-list` to read the new Status back (Critical Rule 16). A zero exit says the call was well formed, never that the card moved. No id catalog: options are addressed by name.
  - Status names come from `issue_tracker.github.statuses` (abstract backlog, in_progress, in_review, on_staging, released). Never hardcode the five names, never invent a sixth column. `blocked` is a label, not a status.
  - Every issue creation and every Stage-1 idea asks which milestone it goes into: the open releases, "new release" (writes the release file and syncs it) or an explicit "unplanned" from the owner. An issue never lands without that answer.
  - An issue body carries an acceptance-criteria checklist (`- [ ]`) before it leaves Backlog, and an issue type (Bug, Feature or Task) set with `--type`. English.
  - Add each issue to the Project (`gh project item-add`) right after creating it: auto-add is UI-only, so nothing does it for you. Never add PRs to the Project: the built-in "PR merged" workflow would then fire on a merge into the integration branch and set Released too early.
  - Never edit Status options by hand-built GraphQL. `bun run github:project:bootstrap` is the only writer: `updateProjectV2Field` replaces the whole option list, so a name-based edit wipes every card in a renamed column. A rename is `--rename Old=New` (keeps the id), a drop that holds items needs `--force`, and the dry run is the default.
  - Never run a `gh` call that creates, edits or deletes on GitHub without the user's request or the owning workflow's step. Reads are free; a project, milestone or label write follows the dry-run, then `--apply`.
  - `gh project` needs the `project` token scope. When it is missing, stop and give the owner the command (`gh auth refresh -h github.com -s project`); a missing scope is the human's to grant, never worked around.
  - Releases are milestones with a local record: `<issue_tracker.github.releases_dir>/<slug>.md`. The definition goes repo to GitHub, the membership goes GitHub to the generated block. Close a release with `bun run github:releases:sync --close-out <slug>`, which reads back that every issue is closed and Released.
  - Built-in workflows, auto-add, auto-archive and column limits are UI-only. State the gap and move the card explicitly instead of promising automation; `references/automation-gaps.md` lists the four.
metadata:
  kind: workflow
---

# GitHub Projects: issues, board and releases on GitHub

The tracker skill for projects that run on GitHub Issues and a GitHub Project (Kanban) instead of Jira. It creates and refines issues, moves cards, bootstraps and checks the Project, and keeps release milestones in step with a committed record. The dev loop (`/sprint-development`) speaks abstract statuses; this skill turns each one into the `gh` call and reads it back.

## When to use

- "create an issue for X", "refine this issue", "add the acceptance criteria": `references/issues-and-labels.md`
- "move it to In review", "what is on the board": `references/projects-v2.md`
- "set up the GitHub Project", "check the board", "add the missing issues": `references/bootstrap.md`
- "define a release", "close the release", "which milestone": `references/releases.md`
- "why did the card not move on its own": `references/automation-gaps.md`
- "`gh project` says missing scope": `references/scopes-and-auth.md`

Jira projects, git and PR work and story delivery are other skills. This one never touches code.

## Compact Rules

The rules live in this file's frontmatter (`compact_rules`), which the registry copies into `.agents/skills/REGISTRY.md` and into subagent briefings. They are not repeated here.

**Read full SKILL.md when**: the compact rules do not settle the operation, or a reference below is named for it.

## Step 1: Resolve the tracker and the config

Read `.agents/project.yaml` and cite what you read:

```yaml
issue_tracker:
  issue_tracker: github
  github:
    project_owner: '@me'
    project_number: 3          # null until the bootstrap ran
    status_field: Status
    statuses: { backlog: Backlog, in_progress: In progress, in_review: In review, on_staging: Staging, released: Released }
    releases_dir: .context/releases
```

The example values are illustrative; the project's own file is the truth. A `null` `project_number` means the bootstrap has not run: stop and offer `bun run github:project:bootstrap` (dry run first).

## Step 2: Pick the operation

| Intent | Operation | Detail |
|---|---|---|
| New idea or story | create an issue, ask the milestone, add it to the Project, set Backlog | `references/issues-and-labels.md` |
| Refine | edit the body (AC checklist), type and labels | `references/issues-and-labels.md` |
| Status change | `item-edit` by option name, read back | `references/projects-v2.md` |
| Project setup or drift | `bun run github:project:bootstrap` (`--check`, `--apply`) | `references/bootstrap.md` |
| Release | `bun run github:releases:sync` (`--check`, `--apply`, `--close-out`) | `references/releases.md` |

## Step 3: Move a card

```bash
gh project item-edit <N> --owner <owner> --url <issue-url> --field Status --value "<option name>"
gh project item-list <N> --owner <owner> -L 1000 --format json --jq '.items[] | select(.content.url=="<issue-url>") | .status'
```

The second command is the proof. If it does not print the new option name, the move did not happen: report it, do not retry blindly.

## Composable with

| Skill | How |
|---|---|
| `/sprint-development` | Calls this skill for every tracker touchpoint when the tracker is `github`: Stage 1 pickup and milestone question, each Status move, the release close-out. |
| `/git-flow-master` | Owns branches, commits, PRs and the plain `gh` commands outside `project`, `issue`, `label` and projectV2 or milestone `gh api` calls. |
| `/acli` | The Jira equivalent. Never loaded together with this skill for one project. |
