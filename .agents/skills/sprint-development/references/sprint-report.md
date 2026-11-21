# Sprint Report: Batch-Sprint Mode

> **Release batch.** A sprint here is the release batch; on `github` it is the milestone and `sprint-<N>` in a session path reads `batch-<milestone-slug>`. File names keep the word `sprint`. The Jira statuses below apply on `jira`; `SKILL.md` `## Tracker modes` gives the `github` moves.

This reference covers how batch-sprint mode keeps `SPRINT-{N}-DEVELOPMENT.md`: generating the file, updating it at each stage, its status state machine, stale handling, the trigger phrases that select the mode, the single-ticket boundary, and how it relates to `/product-management`.

`SKILL.md` delegates here when:

- a batch-mode invocation is detected (`"process sprint N"`, `"continue sprint"`, `"implement sprint N"`, a `sprint-file` parameter, or any phrase that implies a sprint loop), and `.context/reports/SPRINT-{N}-DEVELOPMENT.md` is missing or stale (older than 24h), or
- a per-stage update applies during Stage 1 through Stage 4.

Single-ticket runs only read the latest report at Stage 1 entry, to see the queue and dependencies. They never write it.

---

## Part 1 — Sprint Roadmap Generator

Batch-sprint mode invokes this itself when the report file is missing or stale (older than 24h). It is a precondition of the batch loop, not a standalone command.

### Inputs

| Parameter              | Required | Description                                                                | Example                                    |
| ---------------------- | -------- | -------------------------------------------------------------------------- | ------------------------------------------ |
| `sprint_number`        | YES      | Sprint to generate                                                         | `10`                                       |
| `tech_lead`            | NO       | Defaults to `git config user.name`; if that is empty, ask (see the last section) | `Jane Doe`                           |
| `previous_sprint_file` | NO       | For carryover detection                                                    | `.context/reports/SPRINT-9-DEVELOPMENT.md` |

### Output path

`.context/reports/SPRINT-{sprint_number}-DEVELOPMENT.md`.

If the file already exists, warn before overwriting. On regenerate the Session Log section is preserved verbatim (it is append-only), so manual notes survive.

> **Prerequisite**: load the `/acli` skill before the `[ISSUE_TRACKER_TOOL]` call in Step 1. The Roadmap Generator runs before the per-ticket Session Start, so the standard pre-flight has not run yet. Load it explicitly here.

### Steps

1. **Query tickets** through `[ISSUE_TRACKER_TOOL]` for `Sprint {N}` with the fields Ticket ID, Type, Title, Priority, Status, Dev Assignee and Project/Epic. Sort by Priority descending, then Status ascending.
2. **Classify** each ticket's board status by canonical slug (resolve it through `.agents/jira-workflows.json`):

   | Canonical Status (Story)                                                                                                                                                                                  | Dev Category               | Section            |
   | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------- | ------------------ |
   | `{{jira.status.story.in_progress}}`                                                                                                                                                                       | Active implementation      | In-Flight          |
   | `{{jira.status.story.in_review}}`                                                                                                                                                                         | PR open, awaiting review   | In-Flight          |
   | `{{jira.status.story.ready_for_dev}}`                                                                                                                                                                     | Queue head, pull next      | Queue              |
   | `{{jira.status.story.ready_for_qa}}` / `{{jira.status.story.in_test}}` / `{{jira.status.story.qa_approved}}` / `{{jira.status.story.ready_for_release}}` / `{{jira.status.story.deployed_to_production}}` | Done from dev's POV        | Done — This Sprint |
   | `{{jira.status.story.blocked}}`                                                                                                                                                                           | Blocking issue (monitor)   | Blocked            |
   | `{{jira.status.story.backlog}}` / `shift_left_qa`                                                                                                                                                         | Not pulled into sprint yet | Pipeline           |
   | `{{jira.status.story.aborted}}`                                                                                                                                                                           | Cancelled (terminal)       | Cancelled          |

   If the project's substrate lacks a slug (for example no `blocked` status), drop that row and continue.

3. **Detect carryovers** when `previous_sprint_file` was given. Scan it for tickets whose status is not `PROD_DEPLOYED` or `ABORTED`. A ticket that also appears in the current sprint is a carryover: mark it with its prior context. One that does not appear is "dropped from sprint": tell the user.
4. **Build the Board Summary** counts (Ready For Dev, In Progress, In Review, Ready For QA, Deployed to Prod, Blocked, Total).
5. **Build the In-Flight table** with the 11-column shape below (`#`, Ticket, Type, Title, Priority, Owner, Impl Plan, PR, Delivery Strategy, Review Size, Status). The Status column holds the state machine value, not the Jira label.
6. **Fill the Stats section** from the counts: in-flight, merged, staging-deployed, prod-deployed, blocked, cancelled, carryovers, total lines delivered by the merged PRs (measured, not forecast), and the token usage of the previous sprint. The sprint has no capacity plan (people own that). The report states what is done and what the previous sprint measurably cost in tokens.
7. **Write the file** with the framework structure below.
8. **Append a Session Log entry** for the setup pass: date, totals, in-flight IDs, assigned and unassigned counts, carryover IDs, and "Created SPRINT-{N}-DEVELOPMENT.md tracker".
9. **Report** a short board summary to the user: totals, in-flight count, carryovers.

### Framework file structure (full template)

```markdown
# Sprint {N} — In-Sprint Development Tracker

> Purpose: track dev progress per ticket; cross-ticket aggregate for AI session resume.
> Sprint: {N} | Tech Lead: {tech_lead} | Started: {YYYY-MM-DD} | Last Updated: {date}

## Board Summary

| Status           | Count   | Dev Relevant            |
| ---------------- | ------- | ----------------------- |
| Ready For Dev    | {n}     | YES — queue head        |
| In Progress      | {n}     | YES — being implemented |
| In Review        | {n}     | YES — PR open           |
| Ready For QA     | {n}     | NO — handed to QA       |
| Deployed to Prod | {n}     | NO — done               |
| Blocked          | {n}     | YES — needs resolution  |
| Total Sprint {N} | {total} |                         |

## Development Queue (Priority Order)

### In-Flight — Active Work

> Tickets currently in `In Progress` or `In Review`.

| #   | Ticket | Type               | Title   | Priority   | Owner | Impl Plan | PR        | Delivery Strategy                   | Review Size      | Status                                |
| --- | ------ | ------------------ | ------- | ---------- | ----- | --------- | --------- | ----------------------------------- | ---------------- | ------------------------------------- |
| 1   | {ID}   | {Story\|Bug\|Task} | {title} | {priority} | {dev} | {link\|-} | {#NNN\|-} | {stacked\|chain\|single\|exception} | {Low\|Med\|High} | {IN_PROGRESS\|IN_REVIEW\|MERGED\|...} |

#### In-Flight Notes

- {Ticket ID}: {context, blockers, implementation-plan highlights}

#### Dependencies

- {Ticket A} blocks {Ticket B} — {reason}

### Queue — Ready For Dev

| Ticket | Type | Title | Priority | Owner | Notes |
| ------ | ---- | ----- | -------- | ----- | ----- |

### Pipeline — Pending Refinement

> Backlog / Shift-Left-QA — not yet pulled into the sprint.

### Done — This Sprint

| Ticket | Title | Owner | PR  | Merged | Staging | Prod | TCs (QA hand-off) |
| ------ | ----- | ----- | --- | ------ | ------- | ---- | ----------------- |

### Blocked

| Ticket | Owner | Blocking | Since | Decision Pending |
| ------ | ----- | -------- | ----- | ---------------- |

### Cancelled (Aborted)

| Ticket | Reason | Decided By | Date |
| ------ | ------ | ---------- | ---- |

## Sprint Carryovers from Sprint {N-1}

{include ONLY if previous_sprint_file was provided}

| Ticket | Sprint {N-1} Status | Sprint {N} Status | Notes |

## Sprint {N} Stats

| Metric                              | Value                                                                       |
| ----------------------------------- | --------------------------------------------------------------------------- |
| Total Sprint Tickets                | {total}                                                                     |
| In-Flight (In Progress + In Review) | {count}                                                                     |
| Merged this sprint                  | {count}                                                                     |
| Staging-deployed                    | {count}                                                                     |
| Prod-deployed                       | {count}                                                                     |
| Blocked                             | {count}                                                                     |
| Cancelled                           | {count}                                                                     |
| Carryovers from Sprint {N-1}        | {count or 0}                                                                |
| Total lines delivered               | {sum of the additions and deletions of the merged PRs, measured}            |
| Previous sprint DTU (K tokens)      | {sum and average of `{{jira.development_token_usage}}` as measured, or N/A} |
| Previous sprint QTU (K tokens)      | {sum and average of `{{jira.quality_token_usage}}` as measured, or N/A}     |

## Session Log

### {YYYY-MM-DD} — Sprint {N} Setup & Triage

- Queried {{ISSUE_TRACKER}}: {total} tickets in Sprint {N}
- {inflight_count} in-flight tickets ({list IDs})
- {assigned_count} assigned to {tech_lead}, {unassigned_count} unassigned
- {carryover_count} carryovers from Sprint {N-1}: {list}
- Created SPRINT-{N}-DEVELOPMENT.md tracker

### {YYYY-MM-DD} — {Ticket} {transition}

- {brief note on transition + decision drivers}
```

### Framework file conventions

1. **Dates** use ISO 8601 (`YYYY-MM-DD`). Last Updated moves on every write.
2. **Status column** (In-Flight table) holds one of `PENDING`, `IN_PROGRESS`, `IN_REVIEW`, `MERGED`, `STAGING_DEPLOYED`, `PROD_DEPLOYED`, `BLOCKED`, `ABORTED`. The state machine is below.
3. **Impl Plan, PR, Delivery Strategy and Review Size columns** start as `-` and are filled at the matching stage (Part 2). A row is never deleted when its ticket stops mattering. Move it to `Done — This Sprint` or `Cancelled (Aborted)`.
4. **Priority order** inside In-Flight comes from the `#` column. When the user asks for "next", pick the lowest-numbered non-terminal ticket.
5. **Session Log** is append-only. Every state-changing event adds an entry. The Roadmap Generator adds new entries and never rewrites or deletes old ones, including on regenerate.

---

## Part 2 — Per-stage update rules

In batch mode the orchestrator updates the ticket's report row at every Jira transition. Single-ticket mode never updates it.

### Stage 1 — Planning entry

Fires when sprint-dev moves Jira from `Ready For Dev` to `In Progress`.

- **Status**: `PENDING` to `IN_PROGRESS`.
- **Owner**: the dev driving the ticket (default `git config user.name`).
- **Impl Plan**: link to `.context/PBI/epics/EPIC-<KEY>-<slug>/stories/STORY-<KEY>-<slug>/implementation-plan.md` (synced from the Jira `spec_implementation_plan` field, or the topic key `pbi/{ticket}/implementation-plan`).
- **Review Size**: `Low`, `Medium` or `High`, read from the Review Size Forecast block in the implementation plan.
- **Session Log**: append `### {date} — {ticket} IN_PROGRESS` with a one-line note (review size and any salient context).

### Stage 3 — Code Review (PR open)

Fires when sprint-dev opens the PR through `/git-flow-master` and Jira auto-transitions `In Progress` to `In Review`.

- **Status**: `IN_PROGRESS` to `IN_REVIEW`.
- **PR**: fill `#NNN`. Build the link as `<repo-url>/pull/NNN`, with `<repo-url>` read at runtime from `git remote get-url origin` (strip a trailing `.git`). Never hardcode the repo URL or take it from `.agents/project.yaml`.
- **Delivery Strategy**: read the chain decision recorded in the forecast block of the implementation plan (`stacked-to-main`, `feature-branch-chain`, `single-pr` or `size-exception`), and normalize it to `stacked`, `chain`, `single` or `exception` for the column.
- **Session Log**: append `### {date} — {ticket} IN_REVIEW` with the PR number and delivery strategy.

### Stage 4 — Merge + Staging Deploy

Two sub-transitions, merge and CI smoke.

- When the PR merge lands (method `git_strategy.decisions.feature_merge`, through `/git-flow-master`): **Status** `IN_REVIEW` to `MERGED`, and Session Log entry `### {date} — {ticket} MERGED`.
- When staging CI smoke passes and the auto-deploy fires: **Status** `MERGED` to `STAGING_DEPLOYED`, and Session Log entry `### {date} — {ticket} STAGING_DEPLOYED`.
- When Jira auto-transitions to `Ready For QA`: move the row from In-Flight to `Done — This Sprint`, keep every column value, and fill the `Merged` and `Staging` date columns. Add a Session Log entry confirming the hand-off.

If a transition is skipped (manual merge, red CI, failed deploy), append a Session Log entry that says what happened and pause the loop. The loop does not advance on its own after that.

### Stage 5 — Production Deploy

Stage 5 never runs in batch mode. A production deploy is always a per-ticket manual invocation, gated by QA green and business approval.

- On a successful prod deploy: **Status** `STAGING_DEPLOYED` to `PROD_DEPLOYED`, with a Session Log entry holding the deploy timestamp and the outcome of the monitoring window.
- On rollback: **Status** to `BLOCKED`. Put a pointer to the rollback runbook entry in the row's `Blocking` field, and add a Session Log entry that summarizes the rollback decision.

---

## Status state machine

```
PENDING → IN_PROGRESS → IN_REVIEW → MERGED → STAGING_DEPLOYED → PROD_DEPLOYED
                                      ↘ ABORTED
              BLOCKED (sideways from any active state)
```

State definitions:

- **`PENDING`**: the ticket is in the sprint and queued, not yet pulled. Default state for Queue rows.
- **`IN_PROGRESS`**: sprint-dev Stage 1 was entered, and the implementation plan is being written or the code is being built.
- **`IN_REVIEW`**: the PR is open and the reviewer is running.
- **`MERGED`**: the PR is merged into the integration branch (`git_strategy.branches.integration`) and CI is not green yet.
- **`STAGING_DEPLOYED`**: staging CI smoke passed, the staging environment auto-deployed, and Jira is at `Ready For QA`.
- **`PROD_DEPLOYED`**: Stage 5 succeeded and production is live.
- **`BLOCKED`**: any active state can move sideways here (deploy failure, rollback, dependency block). Fill the row's Blocking column with the cause.
- **`ABORTED`**: terminal cancellation. Move the row to `Cancelled (Aborted)` with the reason and the decision date.

State changes are append-only in the Session Log. A past transition is never rewritten. A new entry supersedes it.

---

## Stale handling

- **More than 24h since Last Updated**: regenerate, after the user confirms. Jira may have moved past the report state, so offer a refresh.
- **Manual edits to the Session Log** survive every regenerate. The generator appends new entries and leaves existing ones alone.
- **Manual edits to tables** survive while the Jira state matches. They are overwritten only where Jira disagrees and the user confirms. To lock a manual override, note it in the Session Log.

When in doubt, append a Session Log entry explaining the change instead of overwriting silently.

---

## Trigger phrases (batch mode detection)

Batch mode activates on any of:

- `"process sprint N"` (for example "process sprint 12")
- `"continue sprint"` or `"continue sprint N"`
- `"implement sprint N"` or `"implementar sprint N"`
- a `sprint-file` parameter given explicitly
- `"work the sprint"`, `"loop through the sprint"`, or any phrase that implies a multi-ticket loop

Single-ticket mode activates on:

- a bare ticket ID (`"work on <KEY>-277"`, `"trabajar <KEY>-277"`)
- a bug-only invocation (`"fix <KEY>-301"`)
- `"resume implementation"` or `"continue where I left off"`
- anything without a sprint scope

If the invocation is ambiguous, ask once before generating the report (the last section covers a run with nobody to ask).

---

## Single-ticket mode

In single-ticket mode the orchestrator:

1. Reads the latest `SPRINT-{N}-DEVELOPMENT.md` at Stage 1 entry, when it exists, for queue and dependency context: same-sprint blocking tickets, related epic threads, carryovers from the previous sprint.
2. Does not update the report. Single-ticket runs leave no trace in `.context/reports/`.
3. Keeps per-ticket artifacts under `.context/PBI/epics/EPIC-<KEY>-<slug>/stories/STORY-<KEY>-<slug>/` (Module = Epic, 1:1).

The report stays a sprint-scoped artifact owned by batch mode, so a one-off invocation never leaves a stale half-update in it.

---

## Batch mode boundaries

- **The loop runs Stage 1 through Stage 4 only.** After Stage 4 completes for a ticket, the orchestrator shows a per-ticket summary and the remaining queue, and waits for the user's OK before pulling the next ticket.
- **Stage 5 is never chained in batch mode.** Production promotion is a separate, per-ticket manual invocation. Even when every ticket in the sprint is `STAGING_DEPLOYED`, prod needs an explicit dispatch per ticket.
- **A red signal stops the loop.** If a ticket lands in `BLOCKED` mid-stage, append a Session Log entry, show the blocker to the user, and wait for instructions instead of moving to the next ticket.
- **TDD on a function** is handed off per ticket to `/unit-testing`. Batch mode does not override TDD decisions.

---

## Coupling with `/product-management` G workflow

- `/product-management` G renders a read-only, PM-facing inline snapshot of the current sprint state. It queries Jira live and writes nothing to `.context/`.
- `/sprint-development` in batch mode writes `.context/reports/SPRINT-{N}-DEVELOPMENT.md` for the dev audience.
- Both read the same Jira data for different purposes (PM visibility, dev session-resume context) and write to different surfaces, so they do not collide.
- If both run in the same session, the PM snapshot reflects whatever sprint-dev last persisted. Sprint-dev updates the file on its own cadence, once per Jira transition.

---

## Variables consumed

- `{{ISSUE_TRACKER}}`: Jira instance label
- `{{PROJECT_KEY}}`: Jira project key
- `{{jira.status.story.*}}` and `{{jira.transition.story.*}}`: canonical Jira slugs from `.agents/jira-workflows.json`
- `git config user.name`: default `tech_lead` and `Owner` values

---

## Error protocol recap

| Signal                                        | Action                                                                                      |
| --------------------------------------------- | ------------------------------------------------------------------------------------------- |
| Sprint file missing on batch trigger          | Generate it through Part 1 before entering the ticket loop.                                 |
| Sprint file stale (older than 24h)            | Warn and ask before regenerating. Preserve Session Log entries.                             |
| Ticket in `BLOCKED` during loop               | Append a Session Log entry, show the blocker, pause the loop, wait for the user.            |
| Jira transition fails                         | Append a Session Log entry with the failure, leave the row in its current state, tell the user. |
| User says "next" but every ticket is terminal | Report the sprint-complete summary and invent no work.                                      |

A red signal never gets passed silently.

---

## With nobody at the keyboard

Every wait above has a person-present path (unchanged) and these others. The ruling frame is `agentic-dev-core/references/decision-protocol.md`.

| Wait                                                     | Supervised worker                                   | Routine with nobody                                                                                                                                                       |
| -------------------------------------------------------- | --------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Overwrite warning, stale regenerate, `tech_lead` missing | The conductor decides.                              | Regenerate (the Session Log survives), use `git config user.name` or else `unassigned`, keep a manual table row where Jira disagrees, and log each assumption in the Session Log. |
| Ambiguous batch or single invocation                     | The conductor names the mode.                       | Take single-ticket mode, which writes nothing here, and say so in the report.                                                                                             |
| "Wait for the user's OK" between tickets                 | The conductor holds the gate and releases the next ticket. | The delegating brief is the approval when it covers the next ticket (its cap included). Without that, stop after the finished ticket and report.                   |
| `BLOCKED` ticket or skipped transition                   | The worker reports to the conductor and stops.      | Append the Session Log entry, stop the loop and report. No outward action follows.                                                                                        |
