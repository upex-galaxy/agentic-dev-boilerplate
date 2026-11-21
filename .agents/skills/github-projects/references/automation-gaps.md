# Automation gaps: what GitHub does not do from the CLI

Four capabilities have no API or CLI path (measured against `gh` 2.102 and the live GraphQL schema, 2026-11-21). The skill works around each by acting explicitly.

| UI-only item | What it means here | What the skill does instead |
|---|---|---|
| Built-in workflows (enable, disable, configure) | Two are on by default: item closed sets Done, PR merged sets Done. They cannot be edited from the CLI. | The bootstrap renames the default options keeping their ids (Todo to Backlog, In Progress to In progress, Done to Released). "Item closed" then sets Released when the release closes the issue. Every other move is an explicit `item-edit` plus read-back. |
| Auto-add (from a repo, by filter) | A new issue does not appear on the board by itself, and it is not retroactive. | `gh project item-add` right after `gh issue create`; `bun run github:project:bootstrap --check` lists open issues missing from the board and `--apply` adds them. |
| Auto-archive | Released cards pile up (the cap is 50,000 items, archived included). | `gh project item-archive` by hand or in a scheduled job when the board gets heavy. Not part of this wave. |
| Column limits, slice-by, field sums, hidden columns | No mutation exists. | State it; set them in the UI once if the owner wants them. |

## Do not add PRs to the Project

The built-in "PR merged" workflow sets Done on any merged PR that is an item. When the flow merges feature PRs into an integration branch (`staging`), that would mark the work released too early. Pull requests stay out of the Project: the issue is the card, the PR is only linked by the change's commits and trail.

## Closing keywords reach the default branch only

`Closes #N` closes an issue only when the commit or PR lands on the repository's default branch. With an integration branch, the keyword in a PR body into `staging` is ignored. Put `Closes #N` in the change's final commit footer, so it travels to `main` with the release merge. Without an integration branch, the PR body into the default branch carries it.

## Rule of thumb

If a status should change and nothing in this table says GitHub will do it, the skill does it with `item-edit` and proves it with `item-list`.
