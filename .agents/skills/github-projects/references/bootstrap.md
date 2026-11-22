# Bootstrap: `bun run github:project:bootstrap`

The only writer of the Project's shape. Dry run by default; nothing is created, edited or added without `--apply`. Tests inject a fake `gh`, so no test touches the network.

## Commands

```bash
bun run github:project:bootstrap                       # dry run: prints the plan and the option diff
bun run github:project:bootstrap --rename-defaults     # dry run for a fresh project (Todo, In Progress, Done)
bun run github:project:bootstrap --apply --rename-defaults
bun run github:project:bootstrap --check               # read-only; exit 1 on drift
bun run github:project:bootstrap --apply --rename "Staging=On staging"
bun run github:project:bootstrap --apply --force "Old name"   # names the one option it may drop, repeatable; a bare --force is refused
```

## What it does

1. Reads `issue_tracker.github` (owner, `project_number`, `status_field`, `statuses`) and the repo from `gh repo view`.
2. Finds the project by `project_number`, else by the title `<project_name> Kanban` (the repo name when `project_name` is null; closed projects included); creates it on `--apply` only when `project_number` is null: a numbered project that cannot be found stops the run instead of creating a second one.
3. Matches Status options by NAME, in the board order of `statuses`:
   - kept option: name present on both sides, resent with its id and color;
   - rename: only through `--rename Old=New`, which keeps the id (a name-based merge would see a drop plus an add and wipe the column);
   - add: a desired name that exists nowhere: a new option;
   - drop: an existing option not desired and not renamed. Refused while it holds items unless `--force "<name>"` names it. Dropping `Todo`, `In Progress` or `Done` is refused unless `--force "<name>"` names it, even when empty, because the built-in workflows point at those option ids. A fresh project whose options are exactly those three is renamed automatically (ids kept), and a difference of case only (`In Progress` against `In progress`) is matched by name and keeps the id;
   - the dry run prints this diff with per-option item counts.
   Counts are read with paginated GraphQL, archived cards included. `updateProjectV2Field` replaces the whole list, so every apply reads the existing ids and resends them, then reads the options back and checks names and ids.
4. Links the repo to the project (only when it is not linked).
5. Creates a Board view grouped by Status and a Table view through the REST views endpoint (`users/<login>`). The default view is never deleted, and counts as the table.
6. Creates the `blocked` label (`gh label create`, never `--force`: an existing label keeps the owner's color). Issue types are native (`Bug`, `Feature`, `Task`); the script only reports them.
7. Writes `project_number` into `.agents/project.yaml` (a one-line edit that keeps comments).
8. Lists open repo issues missing from the board; `--apply` adds each and sets the backlog option. This fills the auto-add gap.

## `--check`

Reads live state and compares it to the yaml: project present and numbered, Status option names and order, repo linked, a board view, the `blocked` label, zero open issues missing. Prints each drift and exits non-zero. Run it after every bootstrap and before a release.

## Requirements

`gh` logged in with the `project` scope (`scopes-and-auth.md`). The conductor or owner runs `--apply` live; agents and tests run the dry run and the fixtures.
