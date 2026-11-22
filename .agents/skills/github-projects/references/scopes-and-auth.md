# Scopes and auth

## What needs what

| Operation | Needs |
|---|---|
| Any `gh project ...` command | token scope `project` (reads alone accept `read:project`); `gh` checks this on the client before calling the API |
| `gh issue`, `gh label`, `gh api` on issues and milestones | `repo` (already present on a normal login) |
| `gh issue create --project` | likely `project` or `read:project` to resolve the title; unverified |
| Pushing `.github/workflows/*` | `workflow` |

## The owner step

`project` is granted once, interactively, by the human, for the active account:

```bash
gh auth status
gh auth refresh -h github.com -s project
```

The command opens a browser device-code flow, so an agent cannot run it. `gh auth refresh` acts only on the active account; with two logins, run `gh auth switch -u <account>` first.

## How the repo checks it

`cli/lib/issue-tracker.ts` parses `gh auth status` (`parseGhAuthStatus`): the active github.com account's scopes. `bun run setup:doctor` and the installer preflight warn with the fix command when `gh` is missing, not logged in, or lacks `project`. Both warn only; nothing in the install needs the scope.

## When a call fails on scope

Stop. Report the exact failure line, give the owner the command above, and wait. Do not retry through another token, a PAT in the environment, or the GitHub MCP: a missing scope is the human's to grant (Critical Rule 1 and 9 apply to credentials the same way).

## User-owned versus org-owned projects

`project_owner: '@me'` resolves to the authenticated user. User projects: REST fields and items take the login, REST view creation takes the login too (`users/<login>/projectsV2/<n>/views`; the numeric user id returns 404). Org projects use `/orgs/<org>/...`. Keep the project private (`gh project edit <N> --visibility PRIVATE`): project visibility is separate from repo visibility.
