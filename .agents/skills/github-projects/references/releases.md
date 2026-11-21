# Releases: milestones with a local record

A release is a GitHub milestone plus a committed file. The file is the definition and the audit trail; the milestone is where issues are grouped. `bun run github:releases:sync` keeps them in step.

## The file

`<issue_tracker.github.releases_dir>/<slug>.md` (default `.context/releases`), one per release:

```markdown
---
title: v0.2.0
goal: One sentence on what this release is for.
due: 2026-12-15
state: planned
released_at: null
release_sha: null
milestone_number: null
---

<!-- releases:members:start -->
Last synced: 2026-11-21
- #12 Add CSV export (open) · In progress
<!-- releases:members:end -->
```

`state` is `planned` (defined, nothing in flight yet), `open` (work in flight) or `released`. `planned` and `open` both map to an open milestone, so issues can be assigned from the day the release is defined. `milestone_number` is written by the sync. The block between the markers is generated: never edit it by hand, the sync rewrites it. It is a dated record (like the trail), so the `Last synced` stamp is allowed to be stale.

## Sync directions

| Data | Direction | Fields |
|---|---|---|
| Definition | repo to GitHub | title, goal (milestone description), due, open or closed |
| Membership | GitHub to repo | issues in the milestone with their state and Status, in the generated block |

A full two-way merge was rejected: it needs conflict rules for no gain. The sync never closes a milestone: a file marked `released` against an open milestone is reported as drift and only `--close-out` closes it. It never reopens one either: a `planned` or `open` file against a closed milestone is reported as drift (`refusing to reopen`) and left closed, unless `--reopen <slug>` names that release. Due dates are sent as noon UTC and compared by date part.

## Commands

```bash
bun run github:releases:sync                      # dry run: what would change
bun run github:releases:sync --apply              # create or patch milestones, rewrite blocks
bun run github:releases:sync --check              # drift both ways, exit 1
bun run github:releases:sync --close-out <slug>   # dry run of the close-out
bun run github:releases:sync --close-out <slug> --apply
bun run github:releases:sync --apply --reopen <slug>   # the one way to reopen a closed milestone
bun run github:releases:sync --apply --adopt <milestone-number>   # write a file for a milestone that has none
```

`--check` reports: a definition that differs from its milestone, a file whose milestone is missing, a milestone with no file (orphan), and a membership block that differs from GitHub. The `Last synced` stamp never counts as drift.

## Close-out

Run it after the release merge, once the release commits are on `main`. `--close-out <slug>`:

1. runs `git fetch origin`, then collects the issues named by `Closes|Fixes|Resolves #N` (any case, optional colon or `owner/repo#N`) in `git log <range>`, plus every issue in the milestone. The default range is `<previous released file's release_sha>..origin/main`, or `origin/main..origin/staging` when there is no earlier release; override it with `--range REV..REV`. After the release merge the default range is often empty: the close-out then retries with `<previous release_sha>..<this file's release_sha>` when the file already records one, and otherwise checks the milestone membership only and says so (pass `--range` to read the closing references from the log too). An empty set is refused unless `--allow-empty`;
2. reads back each issue: it must be closed and its card must be in the released option. The built-in "item closed" workflow is asynchronous, so a failing check is retried with a growing wait. Anything still wrong (open, not on the board, wrong column) is listed and the command exits non-zero without closing the milestone;
3. with `--apply` and a clean read-back: closes the milestone, sets `state: released`, writes `released_at` (the run date) and `release_sha` (`git rev-parse origin/main`) and regenerates the block. Commit the file with the release.

The dry run does the same checks and writes nothing.

## The merge method keeps the `Closes #N` footer

The footer is what closes the issue when the change reaches the default branch, so the merge method must preserve it (`git_strategy.decisions.feature_merge` for the feature PR and `git_strategy.decisions.promote_method` for the release promotion). A merge commit or a rebase keeps the commit messages. A squash merge replaces them with the PR title unless the squash message is written from the commits, which drops the footer: the issue then stays open and the close-out fails on it. Pick the squash message source accordingly, or close such an issue by hand before the close-out.

## Where milestones are asked

`/github-projects` issue creation and `/sprint-development` Stage 1 both ask which milestone an idea goes into (open releases, "new release", or the owner's explicit "unplanned"). "New release" writes the file (`state: planned`), runs the sync with `--apply` and returns the new milestone.

Milestones go through `gh api` (`gh milestone` does not exist): `repos/<repo>/milestones`.
