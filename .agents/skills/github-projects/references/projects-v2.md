# Projects v2: fields, Status, items

The board is one GitHub Project (v2) per repo, owned by `issue_tracker.github.project_owner`, linked to the repo, with one single-select field (`status_field`, default `Status`) whose options are the columns.

## Status options

Five options in board order, named by `issue_tracker.github.statuses`: backlog, in_progress, in_review, on_staging, released. The abstract status in the dev loop maps to the option name through that block; the names in this file are the shipped defaults, not a reference.

Only `bun run github:project:bootstrap` edits the option list (`bootstrap.md`). `updateProjectV2Field` replaces the whole list: an option sent without its id is a new option, and every card that held the old one loses its Status.

## Items

```bash
gh project item-add <N> --owner <owner> --url <issue-url>
gh project item-list <N> --owner <owner> -L 1000 --format json
gh project item-archive <N> --owner <owner> --id <item-id>
```

`item-list` defaults to 30 rows: always pass `-L`. Each item carries its field values by lower-cased field name (`.status`) and its content (`.content.url`, `.content.number`).

## Move a card

By option name, with no ids:

```bash
gh project item-edit <N> --owner <owner> --url <issue-url> --field Status --value "<option name>"
```

Then read it back; the exit code only proves the call was well formed:

```bash
gh project item-list <N> --owner <owner> -L 1000 --format json \
  --jq '.items[] | select(.content.url=="<issue-url>") | .status'
```

Wait at least a second between consecutive writes in a script (secondary rate limits).

## Which status when

| Abstract status | Moves there when |
|---|---|
| `backlog` | the issue is created and added to the Project |
| `in_progress` | work starts (the branch or the local change begins) |
| `in_review` | the change is ready for the reviewers (the PR is open, or the local diff is up for review on a no-PR flow) |
| `on_staging` | the change reached the integration branch |
| `released` | the release merged and the issue closed: the built-in "item closed" workflow sets it (the bootstrap renamed Done to Released keeping its id); verify, do not assume |

## Views

The bootstrap creates a Board view grouped by Status and keeps a Table view (the default view counts). The board's column order follows the Status option order. Group-by is settable only when a view is created; to change it, create the view again.

## Reading ids when you must

`gh project field-list <N> --owner <owner> -L 50 --format json` lists fields and options with ids (default limit 30, a project holds up to 50 fields). The by-name `item-edit` form needs none of them.
