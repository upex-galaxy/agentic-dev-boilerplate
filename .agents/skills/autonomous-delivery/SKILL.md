---
name: autonomous-delivery
description: "Unattended delivery runs: audit git, pick genuinely unblocked work, dispatch the owning skill, report. Use when a scheduler or routine fires `/autonomous-delivery story|bug|discovery`, or when asked to pick up the next unblocked ticket yourself. Not for a named ticket with a person present (`/sprint-development`)."
license: MIT
compatibility: [claude-code, codex, opencode, pi]
phase: implementation
# compact_rules is consumed verbatim by scripts/build-skill-registry.ts (frontmatter first,
# no truncation). Keep in sync with the "## Compact Rules" section in the body below.
compact_rules: |
  - **Git is the source of truth; the tracker is a hint.** A ticket shipped only when `git merge-base --is-ancestor <mergeCommit> <integration-branch>` succeeds. A status of ready-for-QA, done or merged proves nothing, because merge automation fires on any pull request merge, including a chain's internal ones. Never advance a dependency on a status flip.
  - **`<integration-branch>` is read, and may be the production branch.** It is `git_strategy.branches.integration`, or `git_strategy.branches.production` when that is null (`solo-main`, `github-flow`, `trunk-based`). Every ancestry check, base check and merge-in runs against it, and a null integration never ends a run. With a null integration the run never merges: the ticket stops at an open PR with its preview deployment verified, because the merge to production is `/sprint-development` Stage 5, a human-gated event. App commands, branches and database changes follow `## Stack parameters` of `/sprint-development` (`{{stack.*}}`); capability `db` binds only a ticket that touches the database.
  - **Run `git fetch` immediately before every ancestor or fast-forward check, every time.** A merge made through the host's API updates the real ref at once; your remote-tracking ref updates only on the next fetch.
  - **One lock per mode, never a queue.** A live lock for your mode means another run owns it: exit cleanly with a report, without waiting, queuing or running anyway. A lock older than `lock_staleness_minutes` is abandoned: reclaim it and log the reclamation.
  - **An empty run is a correct outcome.** When nothing is genuinely unblocked, stop and say so. Selecting marginal work to avoid an empty report is the failure this phase exists to prevent.
  - **Caps are hard: `story` 1 per run, `bug` 3 sequential (each fully closed before the next), `discovery` writes no code.** Two chain-sized stories do not fit in one run's context.
  - **AI Effort High is a note, never a skip.** Read `{{jira.ai_effort}}` at selection and always proceed. `High` (or unset) is written in the plan and the PR description (the story may be split; about 200 changed lines and 2 to 5 files per stacked PR is the reference), and never makes the run skip, defer or escalate the story. A missing ATP is flagged to QA in a comment, never a block.
  - **The close-out DTU and assignee are verified, never invented.** At the verified Ready For QA state the owning skill reads the current `{{jira.development_token_usage}}`, adds this cycle's measured delta and posts `DTU cycle N: +x K (total y K) source=<harness or human>`. With no figure the field stays empty and N/A with the reason, never an estimate. It moves the native `assignee` to the `{{jira.qa_assignee}}` QA (empty: leave it and say so in the QA comment) and reads it back.
  - **Write the handoff as you go, never at the end.** A run that exhausts its context cannot write up why. Checkpoint after every phase and after every completed slice.
  - **When context runs low, push the branch first, then record resume state, then stop.** Unpushed commits in a disposable worktree are the only unrecoverable loss here. A clean mid-work handoff is a success.
  - **Applying a schema change to shared infrastructure is irreversible and hits every concurrent agent.** Under `migrations: confirm` (default) the run stops with an escalation that asks for approval, stating the target and whether the change is additive or destructive. Under `migrations: autonomous` it proceeds for additive changes only and still stops for anything that drops, renames or rewrites a live object. Composing the change (and its file, when `{{stack.database.migrations_tool}}` keeps one) is always autonomous; applying it is not. How it is applied (the DB MCP, or the app's own tool for `prisma` / `drizzle`) is `agentic-dev-core/references/db-change-doctrine.md`; this gate decides only whether.
  - **Read the migration history through the DB MCP immediately before composing a schema change**, and take any file's number or version from it, never from a local directory listing. The ledger can be ahead of your branch by a peer's unmerged migration.
  - **Read regenerated output before committing it.** Types, clients and API specs generated from a shared live instance silently absorb a concurrent sibling's unmerged schema. Diff it, and strip foreign entries only after proving zero consumers.
  - **The dispatch brief carries the push-and-PR permission.** Component 7 says the dispatched agent may push its own work branch and open its PR against `<integration-branch>` (the brief-as-approval of `/git-flow-master` "Autonomous use"); merging follows the merge permission.
  - **Give every dispatched agent its own worktree.** A background subagent writes into its dispatcher's working directory by default, outlives its dispatcher, and keeps mutating shared state after the dispatcher is gone.
  - **Merge the base into a branch a subagent already pushed, never rebase it:** `git checkout -B <branch> origin/<branch> && git merge <integration-branch> --no-edit`. A rebase forces a force-push, which rewrites pushed history.
  - **An unmapped transition is a flag, never a guess.** When a transition slug the run needs is absent from `.agents/jira-workflows.json` (or Jira rejects a mapped one on a validator), fire nothing, leave the issue where it is, and name the slug, the live candidates and the recommended `bun run jira:sync-workflows` in the run report. Use no remembered id, no status-name guess and no invented field value (`agentic-dev-core/references/artifact-lifecycle.md` §4 step 6, §4.2).
  - **Green tests are not evidence the feature works.** Fixtures that seed the column the code reads, rather than the column production writes, keep every test green over a dead data path. Require at least one assertion against a real production write path before calling an acceptance criterion covered.
  - **Editing a skill's rules does nothing until the registry is regenerated** (`bun run skills:registry`). The registry is what reaches a subagent briefing.
  - **Decide technical calls yourself, after searching the record, and never wait for a person.** Follow `agentic-dev-core/references/decision-protocol.md`: search, follow what is settled, run a scored judge panel when the call is novel, and escalate only product, a novel security posture, irreversible actions and whatever the operator reserved. An escalation is a clean stop (§5.2): write the entry, do the reversible work, end the run. Nothing this skill calls waits for a person either. Record every autonomous decision where the next run's Phase 1 will find it.
  - **Whether a product call escalates is per-project config.** Read `decision_authority.product` in `.agents/project.yaml`. `escalate` (the default) stops the run. `decide` means there is no human PO: dispatch a scored decision subagent, publish the ruling to the ticket under a heading that names the authority, resync and continue, never styled as human sign-off. Categories 2 to 4 escalate under both settings (`decision-protocol.md` §5.1).
  - **Capabilities** (`metadata.requires_capabilities`): resolve each by tool-name suffix, any prefix. When none is available at the step that needs it, stop per `agentic-dev-core/references/mcp-capabilities.md` §4 and never substitute silently (built-in `WebSearch` / `WebFetch` only when the user chooses it).
  - **Three brakes, and a fix never starts a fix.** What a run produces passes checks (the app's own lint, types and test scripts, green on the final tree), then a review by a reader that did not write it (the Stage 3 review of `/sprint-development`), then a person's review after the run ends. A run that cannot pass a brake reports instead of pushing on. A run that fixes a failure never starts another fix run, and a failed ticket is retried at most three times before the report says `BLOCKED`. None of this waits for a person or narrows what the project's `autonomous_delivery` config lets the run merge. Detail: `### The three brakes` in Phase 3.
metadata:
  kind: workflow
  stage_owner: true
  requires_capabilities: [db]
---

<!-- Model preferences (advisory; dispatchers may use to route) -->
<!--
model_preferences:
  audit: sonnet          # mechanical state verification
  selection: opus        # dependency reasoning under contradictory evidence
  execution: sonnet      # delegated to the owning pipeline skill
  judge_panel: opus      # scored decision lenses
  archive: haiku         # mechanical close-out
-->

# Autonomous delivery: scheduled runs with nobody watching

> **Tracker note.** Work selection reads the Jira backlog and runs when `issue_tracker` resolves to `jira`. A `github` or `none` project has no unattended pickup: run `/sprint-development` with a named issue.

This is the layer between a scheduler and `/sprint-development`. A pipeline skill assumes a person picked the ticket, confirmed the state, and is there when something goes sideways. Unattended, all three assumptions are false, and each one fails in its own way.

The skill implements nothing. It establishes what is true, picks work that is unblocked, hands it to the skill that owns it, and leaves a record the next run can start from. Point to the stages of `/sprint-development` instead of restating them.

It never waits for a person, and neither does anything it dispatches while the run is unattended. A question only a person can answer goes into the escalation log and ends the run cleanly. What counts as one, and who decides everything else, is `agentic-dev-core/references/decision-protocol.md` (§5.2 covers who is running).

---

## Compact Rules

> Extracted verbatim into `.agents/skills/REGISTRY.md` by `scripts/build-skill-registry.ts` and copied into every subagent briefing. These are the rules that have to bind an executor, not only inform the orchestrator (`agentic-dev-core/references/orchestration-doctrine.md`, "Rule reachability"). Keep the list short; the reasons live in the referenced files.

- **Git is the source of truth; the tracker is a hint.** A ticket shipped only when `git merge-base --is-ancestor <mergeCommit> <integration-branch>` succeeds. A status of ready-for-QA, done or merged proves nothing, because merge automation fires on any pull request merge, including a chain's internal ones. Never advance a dependency on a status flip.
- **`<integration-branch>` is read, and may be the production branch.** It is `git_strategy.branches.integration`, or `git_strategy.branches.production` when that is null (`solo-main`, `github-flow`, `trunk-based`). Every ancestry check, base check and merge-in runs against it, and a null integration never ends a run. With a null integration the run never merges: the ticket stops at an open PR with its preview deployment verified, because the merge to production is `/sprint-development` Stage 5, a human-gated event. App commands, branches and database changes follow `## Stack parameters` of `/sprint-development` (`{{stack.*}}`); capability `db` binds only a ticket that touches the database.
- **Run `git fetch` immediately before every ancestor or fast-forward check, every time.** A merge made through the host's API updates the real ref at once; your remote-tracking ref updates only on the next fetch.
- **One lock per mode, never a queue.** A live lock for your mode means another run owns it: exit cleanly with a report, without waiting, queuing or running anyway. A lock older than `lock_staleness_minutes` is abandoned: reclaim it and log the reclamation.
- **An empty run is a correct outcome.** When nothing is genuinely unblocked, stop and say so. Selecting marginal work to avoid an empty report is the failure this phase exists to prevent.
- **Caps are hard: `story` 1 per run, `bug` 3 sequential (each fully closed before the next), `discovery` writes no code.** Two chain-sized stories do not fit in one run's context.
- **AI Effort High is a note, never a skip.** Read `{{jira.ai_effort}}` at selection and always proceed. `High` (or unset) is written in the plan and the PR description (the story may be split; about 200 changed lines and 2 to 5 files per stacked PR is the reference), and never makes the run skip, defer or escalate the story. A missing ATP is flagged to QA in a comment, never a block.
- **The close-out DTU and assignee are verified, never invented.** At the verified Ready For QA state the owning skill reads the current `{{jira.development_token_usage}}`, adds this cycle's measured delta and posts `DTU cycle N: +x K (total y K) source=<harness or human>`. With no figure the field stays empty and N/A with the reason, never an estimate. It moves the native `assignee` to the `{{jira.qa_assignee}}` QA (empty: leave it and say so in the QA comment) and reads it back.
- **Write the handoff as you go, never at the end.** A run that exhausts its context cannot write up why. Checkpoint after every phase and after every completed slice.
- **When context runs low, push the branch first, then record resume state, then stop.** Unpushed commits in a disposable worktree are the only unrecoverable loss here. A clean mid-work handoff is a success.
- **Applying a schema change to shared infrastructure is irreversible and hits every concurrent agent.** Under `migrations: confirm` (default) the run stops with an escalation that asks for approval, stating the target and whether the change is additive or destructive. Under `migrations: autonomous` it proceeds for additive changes only and still stops for anything that drops, renames or rewrites a live object. Composing the change (and its file, when `{{stack.database.migrations_tool}}` keeps one) is always autonomous; applying it is not. How it is applied (the DB MCP, or the app's own tool for `prisma` / `drizzle`) is `agentic-dev-core/references/db-change-doctrine.md`; this gate decides only whether.
- **Read the migration history through the DB MCP immediately before composing a schema change**, and take any file's number or version from it, never from a local directory listing. The ledger can be ahead of your branch by a peer's unmerged migration.
- **Read regenerated output before committing it.** Types, clients and API specs generated from a shared live instance silently absorb a concurrent sibling's unmerged schema. Diff it, and strip foreign entries only after proving zero consumers.
- **The dispatch brief carries the push-and-PR permission.** Component 7 says the dispatched agent may push its own work branch and open its PR against `<integration-branch>` (the brief-as-approval of `/git-flow-master` "Autonomous use"); merging follows the merge permission.
- **Give every dispatched agent its own worktree.** A background subagent writes into its dispatcher's working directory by default, outlives its dispatcher, and keeps mutating shared state after the dispatcher is gone.
- **Merge the base into a branch a subagent already pushed, never rebase it:** `git checkout -B <branch> origin/<branch> && git merge <integration-branch> --no-edit`. A rebase forces a force-push, which rewrites pushed history.
- **An unmapped transition is a flag, never a guess.** When a transition slug the run needs is absent from `.agents/jira-workflows.json` (or Jira rejects a mapped one on a validator), fire nothing, leave the issue where it is, and name the slug, the live candidates and the recommended `bun run jira:sync-workflows` in the run report. Use no remembered id, no status-name guess and no invented field value (`agentic-dev-core/references/artifact-lifecycle.md` §4 step 6, §4.2).
- **Green tests are not evidence the feature works.** Fixtures that seed the column the code reads, rather than the column production writes, keep every test green over a dead data path. Require at least one assertion against a real production write path before calling an acceptance criterion covered.
- **Editing a skill's rules does nothing until the registry is regenerated** (`bun run skills:registry`). The registry is what reaches a subagent briefing.
- **Decide technical calls yourself, after searching the record, and never wait for a person.** Follow `agentic-dev-core/references/decision-protocol.md`: search, follow what is settled, run a scored judge panel when the call is novel, and escalate only product, a novel security posture, irreversible actions and whatever the operator reserved. An escalation is a clean stop (§5.2): write the entry, do the reversible work, end the run. Nothing this skill calls waits for a person either. Record every autonomous decision where the next run's Phase 1 will find it.
- **Whether a product call escalates is per-project config.** Read `decision_authority.product` in `.agents/project.yaml`. `escalate` (the default) stops the run. `decide` means there is no human PO: dispatch a scored decision subagent, publish the ruling to the ticket under a heading that names the authority, resync and continue, never styled as human sign-off. Categories 2 to 4 escalate under both settings (`decision-protocol.md` §5.1).
- **Capabilities** (`metadata.requires_capabilities`): resolve each by tool-name suffix, any prefix. When none is available at the step that needs it, stop per `agentic-dev-core/references/mcp-capabilities.md` §4 and never substitute silently (built-in `WebSearch` / `WebFetch` only when the user chooses it).
- **Three brakes, and a fix never starts a fix.** What a run produces passes checks (the app's own lint, types and test scripts, green on the final tree), then a review by a reader that did not write it (the Stage 3 review of `/sprint-development`), then a person's review after the run ends. A run that cannot pass a brake reports instead of pushing on. A run that fixes a failure never starts another fix run, and a failed ticket is retried at most three times before the report says `BLOCKED`. None of this waits for a person or narrows what the project's `autonomous_delivery` config lets the run merge. Detail: `### The three brakes` in Phase 3.

**Read full SKILL.md when**: you are running any phase of a scheduled run, a gate fires, or the briefing tells you to load the full skill.

---

## When to use

Use this skill when a scheduler, cron, routine or timed wake-up starts a session with nobody present and a mode argument. That is the whole trigger surface.

| Mode | Selects | Cap | Dispatches to | Writes code |
| --- | --- | --- | --- | --- |
| `story` | the highest-priority genuinely unblocked user story | **1 per run, hard** | `/sprint-development` | yes |
| `bug` | genuinely unblocked defects, oldest and most severe first | **up to 3, strictly sequential** | `/sprint-development` (bug entry point) | yes |
| `discovery` | refinement, epic or backlog gaps | backlog definitions only | `/product-management` | **never** |

The routine passes the mode: `/autonomous-delivery story`.

## Mode routing

The first token of `$ARGUMENTS` is the mode: `story`, `bug` or `discovery`. Claude Code takes `/autonomous-delivery bug`; OpenCode and Codex take a routine prompt that says "load autonomous-delivery, mode bug". Nobody is on the line to answer, so the mode is never asked for or inferred from prose. A missing or unknown first token is the Phase 0b fast-fail, because a guessed default could run the wrong kind of work unnoticed.

When a person is on the line and named a ticket, the work is `/sprint-development` directly. This skill's only value is the audit, selection and handoff layer around it, and that layer is overhead once a person has done the selecting.

---

## Pre-requisites

- `.agents/project.yaml` is populated, including `git_strategy.branches` (the integration branch every ancestor check runs against, or the production branch when integration is null: `<integration-branch>` below), the `stack:` block the dispatched skill reads, and an `autonomous_delivery:` block (see Configuration).
- The owning pipeline skill's own pre-requisites are met. This skill fails fast when the dispatched skill reports them missing, and does not re-check them.
- A dependency source exists: `.context/dev-roadmap.md` for ticket-level edges, plus whatever queue or board file the project keeps.
- `.env` is populated. Credentials are read by variable name at runtime, never inlined and never carried in a report.
- The run has write access to the code host under an identity with push scope. Verify it in Phase 0, not at the first push.

A missing pre-requisite ends the run in Phase 0 with a report naming the exact file and key. The run does not improvise around it.

---

## Configuration

The block lives in `.agents/project.yaml`. Defaults sit at the safe end of every axis, and a scheduled run inherits them unless the project deliberately widened them.

```yaml
autonomous_delivery:
  enabled: false # master switch. false -> every mode exits in Phase 0 with a report.
  modes: [story, bug, discovery] # modes this project permits. A mode not listed is rejected.
  caps:
    story: 1 # HARD. Raising this is a measured mistake, not a tuning knob.
    bug: 3 # sequential; each fully closed before the next starts.
    discovery: 0 # application CODE cap — always zero, discovery never writes code.
    discovery_definitions: 2 # NEW user stories drafted + created per run — created UNATTENDED; this cap is what bounds the blast radius.
  lock_staleness_minutes: 90 # older than this -> abandoned, reclaimable with a logged note.
  automation_gh_account: null # gh identity this run asserts before every push and merge. See Phase 0b step 3.
  migrations: confirm # confirm | autonomous | unrestricted. See "Migration gate".
  isolation: worktree # worktree | in-place. worktree is strongly preferred.
  context_budget:
    handoff_checkpoint: every-phase # every-phase | every-slice. Never "at-end".
    stop_at_remaining_pct: 20 # begin the clean-stop sequence at this much budget left.
  report_channel: null # null | tracker:<ISSUE-KEY> | file:<path>. A plain summary log for all three modes —
    # NOT a mailbox. For discovery it is where the operator SEES what was created — the input to the
    # veto (close or delete the ticket) — while still being a log nobody replies to.
  escalation_channel: null # null | slack:<CHANNEL-ID> | <any channel the harness can post to>.
    # ESCALATIONS ONLY — never summaries; those go to report_channel above.
  escalation_log: .session/autonomous-delivery/escalation-log.md # append-only, shared across modes.
```

Read the block and cite it; a default quoted from this document is not project state (`agentic-dev-core/references/orchestration-doctrine.md`, "Value provenance").

Leave the scheduler's own worktree option off (a Claude Code routine's "Worktree" checkbox, a Codex automation's worktree mode). This skill creates and closes its own isolation (Phase 0a in, Phase 4 out) on every host, which is what lets Phase 4 close the worktree instead of leaving it on disk. A scheduler-assigned worktree still works as a degraded path (Phase 0a step 3, Hazard H16): the run works in place and the report names the path to remove. An Orca automation needs no person for that, because its committed `orca.yaml` archive hook audits and removes the worktree it assigned.

---

## Session & Dispatch

> **Orchestration & Session contracts**: this skill follows `./orchestration-doctrine.md` (mandatory subagent dispatch — main thread is command center) AND `./session-management.md` (Phase 0 resume check, plan-first persistence at `.session/<skill-slug>/<scope>/`, archive on completion). Phase 0 (resume check) is NOT optional. Phase 1 plan is delegated to the canonical artifact owned by the dispatched pipeline skill (`.context/PBI/epics/EPIC-<KEY>-<slug>/stories/STORY-<KEY>-<slug>/implementation-plan.md` for `/sprint-development`); this skill writes only `progress.md`.
>
> **Session close**: every stage ends with the light stage verifier and the session ends with the chat footer (tools used + dev surfaces touched), both per `agentic-dev-core/references/session-footer-contract.md`.

`<scope>` is the mode (`story`, `bug` or `discovery`). Session state lives at `<<PRIMARY_ROOT>>/.session/autonomous-delivery/<mode>/`, in the primary checkout even when the run works inside a worktree. Every `.session/...` path below means that absolute location, never a copy inside the worktree.

```
.session/autonomous-delivery/
├── escalation-log.md            # append-only, SHARED across modes and runs
├── <mode>/
│   ├── lock.json                # Phase 0 — presence means a run owns this mode
│   ├── progress.md              # append-only, per session-management.md §7
│   ├── handoff.md               # written AS YOU GO, never at the end
│   └── run-report.md            # Phase 4 output
```

`session-management.md` §4 ends the resume check by presenting resume, restart and abort and waiting for the user. This skill departs from that on purpose, because nobody is there to answer: Phase 0 resolves it deterministically.

| Prior state | Action |
| --- | --- |
| No `progress.md` | Fresh run. |
| `progress.md` ends mid-phase and its branch exists on the remote | **Resume** at the recorded next step. |
| `progress.md` ends mid-phase and its branch is absent from the remote | **Escalate.** Work was lost. Log it and report it rather than redoing it silently, because a half-applied migration or a half-posted tracker update may already exist. |
| `progress.md` ends with the final phase completed | Archive to `.session/.archive/<YYYY-MM-DD>-autonomous-delivery-<mode>/` and start fresh. |

### Dispatch table

| Phase / step | Pattern | Subagent role |
| --- | --- | --- |
| Phase 0, enter isolation | inline | orchestrator only; create the run's own worktree (Phase 0a step 4) before config or lock work touches anything |
| Phase 0, lock and resume resolution | inline | orchestrator only; a delegated lock decision is a raced one |
| Phase 1, audit | Parallel | one verifier per evidence source: git ancestry, open pull requests and unmerged branches, tracker status, queue/board and claim files |
| Phase 2, select | inline | the orchestrator reasons over Phase 1's report; planning is never delegated |
| Phase 2, scored judge panel (only when a call is genuinely novel) | Parallel | 3 to 5 independent lenses per `decision-protocol.md` §4 |
| Phase 3, execute | Single, in an isolated worktree | the owning pipeline skill runs its own stages; this skill does not decompose them |
| Phase 3, context checkpoint | inline | the orchestrator writes handoff and progress between slices |
| Phase 3.5, per-ticket cleanup | inline | orchestrator only; rescue that ticket's session artifacts, then `git worktree remove` its worktree immediately, not batched |
| Phase 4, close and report | Sequential | close-out per the owning skill, rescue session records, release the lock, report, then close the run's own worktree |

Phase 1 runs in parallel because evidence sources that disagree are the normal case, and the orchestrator notices the disagreement only if it sees each source independently. One agent merging them hands back a single reconciled narrative with the contradiction already smoothed away.

When any subagent fails, stop that mode's run, write the failure into `progress.md` and the escalation log, release the lock and report. Retry a failed dispatch no more often than the pipeline skill's own capped fix-iterate loop allows, and never roll back automatically.

---

## Main flow

```
[scheduler fires: /autonomous-delivery <mode>]
       |
       v
   +--------------------------------+
   | Phase 0: LOCK                  |  inline
   |  - config read + mode validate |
   |  - lock: take / reclaim / exit |
   |  - resume resolution (table)   |
   +--------------------------------+
       |  live lock for this mode -> EXIT CLEANLY (report, no queue, no wait)
       v
   +--------------------------------+
   | Phase 1: AUDIT                 |  Parallel x4
   |  - git ancestry (the truth)    |
   |  - open PRs + unmerged branches|
   |  - tracker status (a hint)     |
   |  - queue / board / claim files |
   |  => merged-vs-claimed table    |
   +--------------------------------+
       |
       v
   +--------------------------------+
   | Phase 2: SELECT                |  inline
   |  - edges x live status x Phase1|
   |  - caps, scope-growth check    |
   |  - claim, re-read, back off    |
   +--------------------------------+
       |  nothing genuinely unblocked -> EXIT CLEANLY (empty run is correct)
       v
   +--------------------------------+
   | Phase 3: EXECUTE               |  Single, isolated worktree
   |  story/bug -> /sprint-development
   |  discovery -> /product-management
   |  - migration gate              |
   |  - handoff as you go           |
   |  - context budget monitor      |
   +--------------------------------+
       |  budget exhausted -> PUSH BRANCH, record resume state, stop (this is a SUCCESS)
       v
   +--------------------------------+
   | Phase 4: CLOSE AND REPORT      |  Sequential
   |  - owning skill's close-out    |
   |  - rescue session records      |
   |  - release lock                |
   |  - run report + channel post   |
   +--------------------------------+
```

---

## Phase 0 — Enter isolation, then lock

Concurrent routines must not collide: the collision to prevent is two runs implementing the same ticket into two branches. Before locking, `story` and `bug` runs enter their own worktree explicitly, so they can close it explicitly (a scheduler-assigned one cannot be closed). `discovery` needs no worktree (§0a).

### 0a. Enter isolation (before touching config, lock or git state), `story` and `bug` only

`discovery` skips this whole subsection. It writes no application code and creates no git branch; it produces tracker content through `/product-management`. A worktree would cost it the one thing its create-then-veto record depends on: `.session/autonomous-delivery/discovery/created-log.md`, the mode lock and the shared escalation log must be the same files the next fire reads, not copies inside a worktree that is removed first. It works in the plain checkout from start to finish. Go straight to §0b.

For `story` and `bug`:

1. **Note the home checkout path.** `<<PRIMARY_ROOT>>` comes from `dirname "$(git rev-parse --path-format=absolute --git-common-dir)"` (`.agents/README.md` §"Checkout roots"), resolved before anything else. `pwd` is wrong here: a session that starts inside a worktree would "rescue" everything into a directory about to be removed. `<<PRIMARY_ROOT>>` is the same value from the primary checkout and from every worktree of it. `.session/` lives there for the whole run: read and write `<<PRIMARY_ROOT>>/.session/...` by absolute path from inside the worktree, and use worktree-relative paths only for tracked files from here on.
2. **Read `autonomous_delivery.isolation`** from `.agents/project.yaml` (tracked, so present in the plain checkout without a worktree). If it is `in-place`, skip to §0b.
3. **Check whether you are already inside a worktree.** `<<REPO_ROOT>>` (`git rev-parse --show-toplevel`) differs from `<<PRIMARY_ROOT>>` for every worktree kind (harness, Orca, Codex, plain `git worktree add`); a path check such as "under `.claude/worktrees/`" misses all but one. If you are inside one, the scheduler assigned it: create no second one (`EnterWorktree` errors from inside an existing worktree session anyway), run `bun run worktree:provision` in place (step 5) and proceed. The run report notes that the scheduler's worktree option should be off for this routine and that Phase 4 will not remove this worktree (Hazard H16); a person, or under Orca the `orca.yaml` archive hook, removes it afterward. This path is degraded but functional.
4. **Otherwise, create the run's own worktree** under a unique, generated name, because a fixed per-mode name risks colliding with a stale worktree from a crashed run. The path depends on the host and the lifecycle does not (`/git-flow-master` `references/worktrees.md`):
   - **Claude Code**: `EnterWorktree` with no fixed `name`; it moves the session into the worktree.
   - **OpenCode, Codex** (no session-moving tool): the portable path, `git worktree add <path outside the primary> -b <branch> origin/<integration-branch>`, then run every later command from that directory (`cd` inside each shell call, or `git -C <path>`). Record the absolute path; Phase 4 closes it with `git worktree remove`.
5. **Provision what a fresh worktree does not carry.** Run `bun run worktree:provision` inside it: it copies `.env`, `.vercel/` and the other gitignored inputs from `<<PRIMARY_ROOT>>`, then installs dependencies and the `.claude/skills` alias. It deliberately does not copy `.session/`. The lock, `progress.md`, the shared `escalation-log.md` and `created-log.md` are read and written at `<<PRIMARY_ROOT>>/.session/autonomous-delivery/` by absolute path (step 1). A copy would be worse than useless: the per-mode lock excludes a concurrent run only when both runs see the same file.
6. **Verify the base branch, and realign it if it is wrong.** A harness tool's default base (`EnterWorktree`'s `fresh`, a scheduler-assigned worktree) is `origin/<the repo's default branch>`, whatever `refs/remotes/origin/HEAD` points at; on the portable path it is the ref you passed. Neither is guaranteed to be the branch this project works against. Read `<integration-branch>` from `.agents/project.yaml` (`git_strategy.branches.integration`, or `production` when that is null) and compare. In a `main-integration` strategy the default branch is typically `main` while the work belongs on the integration branch, and the host's default can be flipped at any time, so check instead of assuming.

   ```bash
   git fetch origin
   git merge-base --is-ancestor origin/<integration-branch> HEAD && echo "base OK" || echo "REALIGN NEEDED"
   ```

   If realignment is needed:

   ```bash
   git checkout -B <this-worktree-branch> origin/<integration-branch>
   ```

   Use `git checkout -B` here, never `git reset --hard`. Critical Rule #13 forbids repo-wide destructive git commands, a project that enforces it has the permission layer deny the call, and a run that reaches for it stalls at Phase 0a. `git checkout -B` reaches the same state without a destructive discard, and is safe on a brand-new branch with nothing committed on it (Hazard H17).

### 0b. Lock

1. **Read the rest of the config.** `enabled: false`, or a mode absent from `modes`, ends the run here with a one-line report (written at `<<PRIMARY_ROOT>>`) and the run's own worktree closed per Phase 4 step 7. This is not a failure.
2. **Validate the mode** against the three literals `story`, `bug`, `discovery`. Anything else fails fast, with no fallback to a default mode.
3. **Assert push identity before anything else, and again at every point of no return.** A multi-account CLI with the wrong cached identity reads and fetches fine and fails only at the first push or merge, with a permission error that looks like branch protection. One observation is not enough: a write-scope account can be active at Phase 0 and a read-only one by `gh pr merge`, because `git push` uses a separate keychain credential that never drifted. Check `gh auth status` against `autonomous_delivery.automation_gh_account` (`.agents/project.yaml`), and if the active account is wrong, run `gh auth switch --user <account>` before proceeding. Run the same check again immediately before the first push of the run and immediately before any merge, not only here (Hazard H20).
4. **Take the lock** at `.session/autonomous-delivery/<mode>/lock.json`:

```json
{
  "mode": "story",
  "owner": "<session id or pid — whatever this harness makes stable and observable>",
  "host": "<machine identifier>",
  "worktree": "<absolute path of the worktree this run created in §0a, or null for discovery / in-place>",
  "home_checkout": "<the <<PRIMARY_ROOT>> path noted in §0a step 1 — where this lock and all .session/ state live>",
  "started_at": "<ISO-8601 UTC>",
  "heartbeat_at": "<ISO-8601 UTC, refreshed at every phase boundary>"
}
```

5. **Arbitrate the lock**, in this order:
   - **No lock file**: write it and proceed.
   - **Lock exists and `heartbeat_at` is newer than `lock_staleness_minutes`**: a live run owns this mode. Exit cleanly with a report naming the owner and its start time. Do not queue, sleep and retry, or proceed anyway; the next scheduled fire is the retry. Close your own worktree before ending (nothing was claimed in it).
   - **Lock exists and `heartbeat_at` is older than `lock_staleness_minutes`**: treat it as abandoned. Reclaim it, and append a note to the escalation log recording whose lock was reclaimed, its age, and what the resume table then decided; a silent reclamation loses the only evidence that a prior run died. The dead run's worktree (the reclaimed lock's `worktree` field) is likely orphaned. If it is still on disk, note its path in the escalation log for a person to inspect (`bun run worktree:audit <path>`) and remove. Never remove another run's worktree yourself (Anti-pattern A20).
   - **Lock exists and names this session**: a prior phase of this same run; continue.
6. **Resolve resume** per the table in "Session & Dispatch". From here on, refresh `heartbeat_at` at every phase boundary; a run that stops refreshing is exactly what the staleness window is for.

Locks are per mode, so `story` and `bug` runs may overlap by design, which is why every hazard in `references/hazard-catalogue.md` §2 (shared mutable infrastructure) applies to a single-mode run too.

---

## Phase 1 — Audit

Establish what is real: git is the source of truth and the tracker is a hint.

A tracker can report ready-for-QA while nothing is on the integration branch, because merge automation fires on any pull request merge, including a chain's internal ones. Every dependency decision in Phase 2 rests on this phase, so verify; do not infer.

Fetch first, every time, then run the four evidence sources in parallel. Exact commands, the traps inside them and the reconciliation procedure live in `references/audit-and-selection.md` §1-§4. The check everything rests on:

```bash
git fetch origin
git merge-base --is-ancestor <merge-commit> origin/<integration-branch>   # exit 0 == genuinely shipped
```

Run it on every contributing merge commit of a dependency, not on the dependency's status field and not on a coordination file's claim about it.

The output of the phase is an explicit picture, not a narrative:

| Ticket | Tracker says | Merge commit | Ancestor of integration? | Open PR | Branch state | Verdict |
| --- | --- | --- | --- | --- | --- | --- |
| ... | ... | ... | yes / **no** | #NN / — | pushed / unpushed / absent | **merged** / claimed-only / in-flight / not-started |

Any row where "tracker says" and "verdict" disagree goes into the escalation log as a discrepancy, with the evidence, so the next run's Phase 1 knows this tracker lies in this specific way.

The phase also collects what Phase 2 and Phase 3 both need, so neither goes looking on its own:

- **The live migration ledger**, queried from the shared instance through `[DB_TOOL]` (`list_migrations`). It can be ahead of your branch (a peer applied out of band) and can hold a migration that exists in no file you can list. When `{{stack.database.engine}}` is `none`, or no `db` capability is connected, skip it, say so in the run report, and do not claim a candidate whose plan would touch the schema.
- **The queue, board or claim file, read in full**, not just your own row: a peer's coordination flag routinely lands on someone else's row.
- **Branch-protection reality**, from both the classic protection endpoint and the rulesets endpoint. The classic endpoint returns a not-protected 404 when protection is implemented as a ruleset, which reads as "unprotected" if it is all you check.

---

## Phase 2 — Select

Pick work whose dependencies are actually satisfied. Four inputs, weighted, not averaged:

1. **`.context/dev-roadmap.md`** is authoritative for dependency edges, mockup gates and execution ordering, and never for current status, whatever its timestamp.
2. **Live tracker status**, queried now through `[ISSUE_TRACKER_TOOL]` for the candidate and its direct blockers in one call.
3. **Phase 1's verdict column**, which overrides both of the above whenever they disagree.
4. **The claim or queue file**, to avoid taking work a peer already owns.

### Selection algorithm

1. Build the candidate set for the mode: `story` takes stories at ready-for-dev; `bug` takes open defects; `discovery` takes refinement gaps (`/product-management`'s own workflows define what counts).
2. Drop any candidate whose hard blocker is not merged by Phase 1's verdict, and log the skip with the reason. A blocked candidate is a skip, not an escalation.
3. Drop any candidate that is already past dev by live status, whatever the queue file claims.
4. **Readiness is not status.** Read the refinement trail before accepting a candidate. Unresolved blocking refinement questions, explicitly disclaimed practice-exercise answers and unchecked edge-case lists all mean not ready, even when the status field says otherwise: a ticket can be moved to ready-for-dev with a declared blocker still open and no comment trail explaining the move.
5. **Scope-growth check.** A candidate that carries signals of being larger than a normal pick is not claimed in an unattended run. Signals: no mockup where the design plan expects one, an architectural decision implied by its acceptance criteria, more than one migration. Log it as needing a session with a person present, and take the next candidate. (A `High` AI Effort alone is never such a signal; it is a note in the plan, `references/audit-and-selection.md` §7.) Pulling the next available row regardless of size is a measured way to burn a whole run.
6. **Apply the cap.** `story` takes exactly one. `bug` takes up to three and processes them strictly sequentially, each fully closed through Phase 4's close-out before the next is claimed. `discovery` creates backlog definitions (up to `discovery_definitions`) and writes no code.
7. **Claim it** with the claim protocol: write your name and status into the row, save, then re-read the file. If a different name is there, a peer won the race, so back off and take the next candidate. Never fight over a row.
8. **If nothing survives, exit cleanly.** Write the run report saying what was considered and why each candidate was dropped. An empty run is a correct outcome, and a report that explains the emptiness is worth more than a marginal ticket.

Full recipes, including the readiness signals and the scope-growth signals: `references/audit-and-selection.md` §5-§7.

---

## Phase 3 — Execute

Dispatch the owning skill. This skill orchestrates and does not repeat the stages it dispatches.

| Mode | Dispatch | What this skill supplies |
| --- | --- | --- |
| `story` | `/sprint-development` (new-story entry) | ticket key, Phase 1 verdict table, the claim, the worktree path, the migration gate setting, the context budget |
| `bug` | `/sprint-development` (bug entry, root cause first) | same, once per bug, sequentially |
| `discovery` | `/product-management` (its refinement, epic and AC workflows) | the gap found in Phase 2 and the evidence for it |

Every dispatch uses the 7-component briefing from `agentic-dev-core/references/briefing-template.md`. A rule that lives only in this file never reaches the executor, so component 7 (Rules) carries these:

- The run is unattended. The dispatched agent never waits for a person: a question only a person can answer goes into the escalation log and ends its work cleanly (`agentic-dev-core/references/decision-protocol.md` §5.2).
- The DTU rule: cumulative and optional. Read the current value, add this cycle's measured delta, never overwrite; with no figure, N/A with the reason, never an invented number.
- The AI Effort pickup rule: `High` warns and never skips the story.
- The migration gate, the resolved `<integration-branch>` and whether this run may merge into it.
- The dispatch may push its own work branch and open its PR against `<integration-branch>`; this is the brief-as-approval of `/git-flow-master` "Autonomous use". Merging follows the merge permission above.
- The stack contract: app commands from `{{stack.scripts.*}}`, database changes per `{{stack.database.migrations_tool}}`, and the app's own conventions win.
- The worktree path, the no-rebase rule for pushed branches, and the context-budget stop procedure.

**Who runs the dispatched skill.** By default, an agent in the ticket's isolated worktree. When the orchestration gate passes (binary present and runtime reachable; canon in the user-level skill `/agent-orchestration`), a `story` or `bug` dispatch may go to one supervised worker per ticket: `[ORCHESTRATION_TOOL] launch: one worker running /sprint-development <KEY> fleet worker, in that ticket's worktree, with this phase's briefing`. Nothing else here changes. The lock, the audit, the selection, the caps (the lower of the mode cap and `orchestration.max_workers` wins), the migration gate and the context-budget contract stay with this skill, and the worker's handle and dispatch id go into the run report the moment it opens. The worker stops at an open PR; the merge and the deploy stay with this run (`sprint-development/references/fleet-mode.md` §2.1). When the gate fails, the default path runs and nothing in the run report or the escalation log names the orchestrator. How the two skills split the work: `references/worker-dispatch.md`.

### Isolation

`isolation: worktree` (the default) gives the dispatched agent its own git worktree. A background subagent otherwise writes into its dispatcher's working directory, its uncommitted files ride along through every branch switch, and it outlives its dispatcher: one went on to finish a slice, push a branch, open a pull request and merge it with nobody watching.

Three consequences the dispatch briefing states, because none of them raises an error:

- Gitignored files do not come with a worktree, so it has no credentials. An agent that finds no declared identity has been seen improvising one. Copy the environment file in on entry, before any step that needs a credential.
- An absolute path inside a worktree reads and writes the main checkout. Reads return another branch's content and writes land on the wrong branch while reporting success. Use worktree-relative paths, and when a write succeeds but a later search in the same session cannot find it, suspect the path before the tool.
- Session files written inside a worktree are gitignored and die with it. Rescue them in Phase 4 before the worktree is removed.

### Phase 3.5 — Per-ticket cleanup (do this immediately, not batched at Phase 4)

The Agent tool leaves a dispatched agent's worktree in place once it holds changes, so the orchestrator closes it, per ticket, the moment that ticket is done. Done means merged, escalated with its branch pushed, or stopped at the migration-apply gate with its branch pushed. In each case the remote branch already holds the work.

Right after a dispatched agent reports back, and before selecting or dispatching the next ticket:

1. **Confirm the branch is pushed** (or that the agent made no commits). A worktree holding unpushed work is never removed: something upstream failed to push first, and that is an escalation, not a cleanup step.
2. **Rescue the worktree's `.session/` tree** when this run's progress log does not already capture it (a dispatched skill may have written its own progress files, such as `/sprint-development`'s `.session/sprint-development/<KEY>/`): `bun run worktree:audit <path> --rescue` copies the state class to `<<PRIMARY_ROOT>>`, never overwriting, and exits 1 while a conflict or an unclassified file remains. A non-zero exit blocks step 3.
3. **`git worktree remove <path>`**, not `ExitWorktree`, which tracks only worktrees entered through `EnterWorktree` in this session. A refusal on modified tracked files means step 1 missed something, so never force through it. When the Agent tool already removed an empty worktree, the command errors "not a working tree": check the path first and count "already gone" as success.
4. **Log the removal** in `progress.md`, one line beside that ticket's outcome, so a reader can tell it was closed on purpose.

Deferring this to Phase 4 leaves worktrees dangling for the whole run, and a mid-run context exhaustion means they are never cleaned.

### Migration gate

Applying a schema migration to a shared database is irreversible and affects every concurrent agent. It has already happened out of band on a shared instance, and a different ticket's type regeneration absorbed the resulting schema into its own diff.

Composing the change, and writing its file when `{{stack.database.migrations_tool}}` keeps one, is ordinary technical work and always autonomous. Applying it is a separate act with its own gate. How it is applied (the DB MCP, or the app's own tool) is `agentic-dev-core/references/db-change-doctrine.md`; this gate decides only whether. One case the gate cannot open: with `{{stack.database.migrations_tool}}` set to `prisma` or `drizzle` the doctrine asks the team before its pipeline applies a migration, and nobody is on the line, so the run writes the generated migration, pushes it and escalates, whatever `migrations:` says.

An escalation here is a clean stop (Autonomy, below). The run writes the entry, pushes the branch, releases the lock and ends; it never parks a session waiting for an answer.

| `migrations:` | Additive change (new table, function, index, or column with a default) | Destructive change (drop, rename, rewrite of an existing live object) |
| --- | --- | --- |
| `confirm` (default) | Escalate and stop. The entry states the target instance, exactly what the migration does, and that it is additive. | Escalate and stop. The entry states target and effect, says it is destructive, and offers a real second option (defer to a fast-follow) instead of a yes/no. |
| `autonomous` | Proceed. Read the history through the DB MCP immediately before applying. | Stops. `autonomous` never covers dropping, renaming or rewriting a live object. |
| `unrestricted` | Proceed, after the same history read. | Proceed. Every class applies unattended, including drop, rename and `CREATE OR REPLACE` rewrites of a live object, after the same history read. |

`unrestricted` is opt-in and unsafe by choice. It exists for a project whose database holds no production data to lose (a greenfield build, a disposable environment) and whose operator decided that stopping the run costs more than a bad migration. It is never the default, and a project that only set `autonomous` is never read as having chosen it.

Two rules hold under every setting, `unrestricted` included:

- A local error is never a reason to apply a migration. If a local failure seems to need a live schema change, that is a finding, not a step.
- After every apply, re-read the live definition (re-applies too, even when you believe nothing changed) and diff it against the SQL you applied (the committed file when the tool keeps one). Retyping SQL by hand into an apply call has dropped a clause, and only the diff caught it.

A `CREATE OR REPLACE` that changes an existing live object's output is a rewrite, not an additive change, even when the fix is narrow and unambiguous. Under `unrestricted` the classification no longer decides whether the apply proceeds, but the run report logs it as destructive so the record stays honest.

### Verification that actually verifies

The pipeline skill owns the verification stages. This skill adds one requirement, because an unattended run has no human to notice: at least one assertion exercises a real production write path before an acceptance criterion counts as covered. A suite can be fully green over a feature that cannot work when fixtures seed the column the code reads rather than the one production writes. In one run every test passed and two production metrics stayed at zero. Grep the migration history for writes to the table in question and confirm something other than your own fixture writes the column.

Related and cheap: a function never executed against the real backend can be reviewed and merged and still fail on every call, because mocked calls prove nothing about the thing mocked.

### The three brakes

What a run produces passes three brakes, and a run that cannot pass one reports instead of pushing on.

1. **Checks.** The app's own lint, types and test scripts, as `package.json` names them, are green on the final tree.
2. **A reader that did not write the work.** The Stage 3 review of `/sprint-development`, against the ticket and the standards. Hazard H13 applies: the assembled diff gets the same review as any slice.
3. **A person, after the run ends.** This brake never makes a run wait and never changes who may merge. The run leaves its output where the team reads it (the PR, the run report, the ticket comment) and stops; whatever merge permission the project's `autonomous_delivery` config grants stays exactly as configured.

A run that fixes a failure never starts another fix run, because a fix changes the system itself and always gets a person's review. `bug` mode's sequential bugs are separate tickets, not a chain: a bug whose fix fails a brake stops there, the next fire is the retry, and no fix-the-fix ticket is created. Retry a failed ticket at most three times, then report `BLOCKED`. Add one automatic trigger at a time and widen it as the brakes earn trust.

Source: https://github.com/mattpocock/skills (in-progress/software-factory, may still move), MIT, (c) 2026 Matt Pocock. Adapted by UPEX Galaxy.

---

## Context-budget contract

The binding constraint on an unattended run is context, not wall-clock time. In the run this skill is derived from, worker generations kept retiring on context, several mid-ticket. Design for that.

Three obligations, in order of importance:

1. **Write the handoff as you go.** Append to `handoff.md` at every phase boundary and after every completed slice (`context_budget.handoff_checkpoint`). A session that runs out of room cannot write up why, so there is no end to defer it to.
2. **Watch your own budget.** At every phase boundary, estimate what remains. At `stop_at_remaining_pct` (default 20), take no new work: start no slice, dispatch no background agent, schedule no wake-up, and begin the clean-stop sequence.
3. **Clean-stop sequence, in this order:**

```
1. PUSH the branch.                 <- first, always. Unpushed work in a disposable
                                       worktree is the only unrecoverable loss here.
2. Rescue a dispatched skill's worktree-local session records into <<PRIMARY_ROOT>>
   (this skill's own state already lives there).
3. Append the resume state to handoff.md: exact branch, exact tip SHA, which pull
   requests exist and their state, what is done, what is not, and the NEXT CONCRETE
   COMMAND. Written so a stranger could resume from it cold.
4. Append the final progress.md entry.
5. Release the lock.
6. Report.
```

A run that hands off cleanly is a success. Judge a run by whether the next one can pick it up, not by whether it shipped.

What goes in the handoff and what stays out: `references/run-report-format.md` §3. It carries only what the next run cannot get elsewhere (traps with their exact symptom, conventions not yet written down, work in flight with the next command); restating what is durable in the board, the merge record or the escalation log is noise.

Never start a slice with a background agent and schedule a wake-up in the same breath with the budget thin: that shape produces a mid-write death. When a clean stopping point exists (right after planning, nothing in flight), take it.

---

## Autonomy

Follow `agentic-dev-core/references/decision-protocol.md` in full. The order is the substance:

```
SEARCH THE RECORD -> settled? FOLLOW IT
        |
        | not settled
        v
  product / novel security / irreversible / reserved?
        |  no                                  |  yes
        v                                      v
  SCORED JUDGE PANEL (3-5 lenses)          ESCALATE (informed)
        |                                      |
        +--------> WRITE IT DOWN <-------------+
```

Three amplifications for an unattended run:

- **Search the record first, starting with `.session/autonomous-delivery/escalation-log.md`, read in full, then `.context/ADR/` and the ticket's siblings.** Search for the shape of the question, not its wording: a ruling that governs you may have been written an hour ago by a run you never saw.
- **Escalating costs more here than it does interactively.** Nobody can answer, so an escalation ends the run's forward progress until the next human touch, and an over-stop on a technical call costs a whole scheduled slot. The escalate-only categories are exhaustive: product and business decisions, a genuinely new security posture (applying an already ratified pattern is implementation), irreversible or destructive actions, and anything the operator reserved.
- **Check whether product calls are an escalation at all.** Read `decision_authority.product` in `.agents/project.yaml`. Under the default (`escalate`) a product question stops the run. Under `decide`, a project with no human PO, it is work: dispatch the decision subagent, publish the attributed ruling to the ticket, resync and continue. `decision-protocol.md` §5.1 owns the method. This changes category 1 only; the other three still end the run.

Record every autonomous decision in the escalation log when you make it, where the next run's Phase 1 will find it. A decision not recorded did not happen, and the next run re-derives it and may land somewhere else.

Keep a decision log for the run as well: one TSV row per decision, with `ts`, `phase`, `decision`, `why`, `evidence` (a commit, PR number, path or screenshot, never a paragraph) and `result`. It lives at `.session/autonomous-delivery/<mode>/decisions.tsv`, with the mode's other session files, so Phase 4 archives it with them, and the run report names it. Call the Skill tool with "show-me-your-work" for the format and the audit of the log against the transcript. When that skill is not installed, keep the same six columns by hand and say so in the report. The log never blocks a run: a failed append goes in the report and the run continues. A decision that rules for later runs also goes in the escalation log, as above.

When an escalation fires, it is a clean stop and never a hang. Write the entry (what happened, why it is this category, what the human must decide, the downstream cost of waiting), push anything unpushed, release the lock, notify `escalation_channel` if one is configured, and end the run. A scheduled session is never parked on an answer that cannot arrive.

### Notifying an escalation

An escalation nobody hears about looks the same as a run that silently died. When `autonomous_delivery.escalation_channel` is set (it is `null` by default, which makes the run report the notification), the clean stop gains a notify step after the lock is released and before the run ends:

1. **Post to `escalation_channel`.** This is the primary path: an external channel persists, leaves a record and does not depend on any agent client being connected. Name the ticket key, what blocks it and what exactly the operator must decide. A human reads it on a phone, so keep it short and lead with the key.
2. **Send a push notification second**, if the harness offers one: one line under 200 characters, no markdown, ticket key first, then the decision needed (not "run stopped").

A failed delivery never becomes a second failure that swallows the first. Record the send failure in the run report and end cleanly.

`escalation_channel` carries escalations only. A clean finish and an empty run both belong in the run report, and everything in that channel must be something the operator has to act on, or the channel gets muted. Routine summaries go to `report_channel`, a different setting.

### Discovery creates, the operator vetoes (no approval gate)

`discovery` never waits, like `story` and `bug`. When the run settles on a definition worth creating, it creates it, records it and reports it. Creating definitions within the `discovery_definitions` cap is this mode's work product, not an escalation; the cap, not a human in the loop, bounds the blast radius.

Once a definition is settled:

1. Dispatch `/product-management` to create it in the tracker.
2. Append one entry per created artifact to `.session/autonomous-delivery/discovery/created-log.md`: key, title, parent, date, run session id, one-line reason. The file is append-only; never rewrite, resolve or prune an entry.
3. Report the created keys to `report_channel`.

At the start of every discovery run, read `created-log.md` in full before any fresh analysis and cross-check each entry against live tracker state. An entry whose ticket is closed or deleted is a veto, a standing operator ruling: do not re-create it, and do not create a near-identical restatement under a new title. The veto is cheap by design, since closing a user story in `Backlog` costs one click, less than one idle scheduled fire.

New epics are created the same way, but the run report owes an argument for why no existing epic could hold the work. That argument is accountability after the fact, not a request for permission.

This is why `discovery` skips worktree isolation (Phase 0a): `created-log.md` must be the one real file the next fire reads, not a copy trapped in a worktree that is removed before then.

Do not reintroduce the approval gate or a softer version of it (a confirm-first flag for big items, a pause-on-epic rule, any other synchronous wait). The decision and the evidence behind it are in `.context/ADR/ADR-0007-discovery-runs-without-approval-gate.md`.

---

## Phase 4 — Close and report

The order matters, because each step can be lost by the one before it.

1. **Complete the owning skill's close-out.** For `/sprint-development` that is its Stage 4 tail. Verify the tracker's auto-transition fired (it is inconsistent, so check live, every ticket, every type; the slug each stage owns is in `agentic-dev-core/references/artifact-lifecycle.md` §1). Move the native `assignee` to the `{{jira.qa_assignee}}` QA (empty: leave it and say so in the comment) and verify it changed, because some tracker CLI paths report success while clearing the field. Write the DTU cycle (`DTU cycle N: +x K (total y K) source=<...>`, summing the dispatched agents' reported `tokens_used`) or verify its stated N/A (no measured figure, or an item that never reaches Ready For QA). Post the handoff comment and sync the tracker cache. This skill does not reimplement any of it; it verifies it happened.
2. **Rescue session records before the worktree is removed.** This skill's own state already lives at `<<PRIMARY_ROOT>>`, but a dispatched skill may have written a worktree-relative `.session/` file, and gitignored files die with the worktree. Run `bun run worktree:audit <worktree> --rescue`: it copies the state class to `<<PRIMARY_ROOT>>`, never overwrites, and a conflict it reports is resolved by hand before removal.
3. **Release the lock** by deleting `lock.json`. A run that escalated or stopped on budget releases it too, because a lock belongs to a running session, not to an unfinished ticket.
4. **Write the run report** to `.session/autonomous-delivery/<mode>/run-report.md` per `references/run-report-format.md` §1, empty runs included (what was considered, what was dropped, why). It names the decision log, `decisions.tsv`, and its row count.
5. **Post the summary** to `report_channel` when one is configured. `null` means the file is the report; do not improvise a destination.
6. **Archive** this mode's session directory (`.session/autonomous-delivery/<mode>/`; the shared `escalation-log.md` beside it is never archived) per `session-management.md` §8, and call the memory session summary with the archive path.
7. **Close the run's own worktree**, the one Phase 0a created and no other: `ExitWorktree(remove)` on Claude Code, `git worktree remove <path>` (run from `<<PRIMARY_ROOT>>`) on the portable path. Dispatched agents' worktrees were closed per ticket in Phase 3.5, and another run's worktree is never yours to remove (A20). This step is last because everything above reads or writes paths that stop existing when it runs. In the degraded path from Phase 0a step 3 (a scheduler-assigned worktree), do not remove it: say so in the report and name the path a person (or Orca's archive hook) must remove.

Name in the report every discrepancy Phase 1 found, every autonomous decision, and every check the run could not perform. What an unattended run could not verify becomes an explicit flag for the humans who can.

---

## Hazard checks

Every item below has been observed. Each is a check the run performs, not a caution it holds in mind. Trigger, symptom and countermeasure for each: `references/hazard-catalogue.md`.

| # | Hazard | Check |
| --- | --- | --- |
| H1 | Tracker reports ready-for-QA while nothing is on the integration branch (automation fires on any pull request merge, including a chain's internal ones) | Ancestor check on the merge commit, every time |
| H2 | Regenerating types or clients from a shared live database pulls an unmerged sibling's schema into your diff | Read regenerated output before committing; diff it; prove zero consumers before stripping |
| H3 | Migration numbering taken from local files collides, in both directions | Query the live ledger immediately before writing the file |
| H4 | A fully green suite over an unsatisfiable feature, because fixtures seed the column the code reads rather than the one production writes | At least one assertion against a real production write path |
| H5 | Editing a skill's compact-rules block changes nothing until the registry is regenerated | Regeneration is a second, separate, explicit step |
| H6 | A background subagent outlives its dispatcher and keeps mutating shared state | Isolated worktree per dispatched agent, from the start |
| H7 | Rebasing a branch a subagent already pushed forces a history rewrite | Merge the base in; never rebase pushed work |
| H8 | A fast-forward check no-ops against a stale remote-tracking ref | `git fetch` immediately before, unconditionally |
| H9 | An absolute path inside a worktree silently reads or writes the main checkout, with no error | Worktree-relative paths; suspect the path when a write "succeeds" but cannot be found |
| H10 | Declared branch protection differs from what the host enforces; the classic endpoint 404s when a ruleset is in force | Query both endpoints before planning any merge |
| H11 | A claim or coordination file goes stale within minutes, and the flag that matters is on someone else's row | Re-read the whole file at least once per work session |
| H12 | A privileged function filtering on a caller-supplied identity or scope authorizes nothing | The `sprint-development/references/rpc-authorization.md` gate; this run never waives it |
| H13 | Per-slice review passing is not evidence the assembled chain is sound | Budget the assembled-diff review as seriously as any slice's |
| H14 | A tracker status flips to ready-for-dev with blocking refinement questions still open | Read the refinement trail in Phase 2, not the status field |
| H15 | Session records die with the worktree that held them; a `.session/` copied into a worktree splits the lock | Keep `.session/` at `<<PRIMARY_ROOT>>` (Phase 0a steps 1 and 5); rescue anything a dispatched skill wrote locally before removal, Phase 4 step 2 |
| H16 | The scheduler's own worktree option assigns a worktree this run did not create and must not remove (`ExitWorktree` cannot even see it) | Leave that option off; the run creates and closes its own isolation (Phase 0a, Phase 4); when one is assigned anyway, work in place and report the path |
| H17 | A fresh harness worktree (`EnterWorktree`, a scheduler's) branches from the repo's default branch, which is not guaranteed to be the integration branch the project works against | Fetch and run the `git merge-base --is-ancestor` check after entry; realign with `git checkout -B`, never `git reset --hard` (Critical Rule 13 denies it), Phase 0a step 6 |
| H18 | A dispatched agent's worktree is never auto-removed once it holds changes (deliberate on the Agent tool's part) | Explicit `git worktree remove` per ticket, immediately, Phase 3.5 |
| H19 | `discovery` re-creates a definition a prior run already created, or restates one the operator vetoed by closing or deleting it, flooding the backlog | Read `created-log.md` first; cross-check every entry against live tracker state; closed or deleted is a standing ruling: never re-create, never restate under a new title |
| H20 | A multi-account `gh` CLI's active identity silently flips between Phase 0 and merge time. `git push` keeps working under a separate keychain credential, so the failure surfaces only at `gh pr merge` as a permission error that looks like branch protection | Assert `autonomous_delivery.automation_gh_account`, run `gh auth switch --user <account>` if wrong, at Phase 0, again before the first push and again before any merge |

---

## Anti-patterns

Each line restates a rule from above where a run is most likely to break it. The codes are cited, so they stay fixed.

- **A1.** Never advance a dependency on a tracker status; only the ancestor check decides whether something shipped.
- **A2.** Never queue, sleep-and-retry or proceed anyway on a live lock. Exit cleanly.
- **A3.** Never take a second story in one run.
- **A4.** Never start the next bug before the current one is fully closed through Phase 4.
- **A5.** Never write code in `discovery` mode.
- **A6.** Never defer the handoff to the end of the run.
- **A7.** Never stop on a low budget with unpushed commits.
- **A8.** Never apply a destructive migration autonomously. No setting covers it, and clearing a local error is not a reason.
- **A9.** Never take a migration number from a local directory listing.
- **A10.** Never commit generated output from a shared live instance without reading it first.
- **A11.** Never rebase, force-push, amend or otherwise rewrite pushed history, and never route around a denied operation by finding another path to the same effect. A denial is a signal to stop and name the exact permission needed, not a puzzle to solve.
- **A12.** Never modify your own permission settings, allowlists or configuration to restore your own capability.
- **A13.** Never improvise an identity, credential or account when the declared one is missing. Fail closed and report. A worktree without its environment file is the most common way the temptation arises.
- **A14.** Never select work by "pull the next available row" without the scope-growth check. Large or novel work belongs in a session with a person present.
- **A15.** Never manufacture a non-empty run.
- **A16.** Never re-ask a settled question, and never treat an answer obtained without the prior ruling in front of the human as a supersession. It is an uninformed re-ask and overrides nothing.
- **A17.** Never escalate a technical call this run is equipped to settle.
- **A18.** Never leave an escalation parked waiting for a reply, in any mode (Autonomy: an escalation is a clean stop, and `discovery` creates within its cap and lets the operator veto).
- **A19.** Never remove a worktree before rescuing the session records inside it.
- **A20.** Never edit another run's board row (except to claim an unclaimed one per protocol), branch or worktree.
- **A21.** Never include AI-attribution lines in commits, pull request bodies or tracker comments.
- **A22.** Never reimplement a stage that `/sprint-development` or `/product-management` owns. Dispatch it.
- **A23.** Never start a fix run from a fix run's failure. The failure is reported and a person reviews it (`### The three brakes`).

---

## Pre-flight checklist

- [ ] Mode is one of `story`, `bug`, `discovery`, present in `autonomous_delivery.modes`, and `enabled: true`
- [ ] Push identity verified as having write scope, before the first push rather than at it
- [ ] Lock taken, reclaimed with a logged note, or the run exited cleanly on a live lock
- [ ] Resume resolved deterministically per the unattended table; a missing remote branch escalated rather than redone
- [ ] `git fetch` run before every ancestry and fast-forward check
- [ ] Ancestor check run on every contributing merge commit of every dependency
- [ ] Merged-vs-claimed table produced; every tracker/git discrepancy written to the escalation log with evidence
- [ ] Live migration ledger queried; queue, board and claim file read in full; both protection endpoints checked
- [ ] Candidate's refinement trail read: readiness established, not inferred from status
- [ ] Scope-growth check applied; oversized or novel work deferred to a session with a person present
- [ ] Cap respected (`story` 1, `bug` 3 sequential, `discovery` no code)
- [ ] Claim written, file re-read, and the row conceded if contested
- [ ] Dispatched agent given an isolated worktree, its environment file copied in, and briefing component 7 carrying the unattended rule, the migration gate and the budget stop procedure
- [ ] Migration gate honoured; live definition re-read and diffed after every apply
- [ ] At least one assertion exercises a real production write path
- [ ] The three brakes passed or the run reported; no fix run started from a fix run's failure
- [ ] Handoff appended at every phase boundary
- [ ] On low budget: branch pushed first, resume state recorded, then stop
- [ ] Owning skill's close-out verified (auto-transition fired, assignee changed to the `qa_assignee` QA or left with the reason, DTU cycle present or N/A stated)
- [ ] Session records rescued out of the worktree before removal
- [ ] Lock released, run report written, channel posted if configured, session archived
- [ ] Every autonomous decision recorded where the next run's Phase 1 will find it

---

## Hand-offs

### Project-owned (T1)

- Per-ticket implementation, review and deploy go to `/sprint-development`. It owns every stage; this skill only selects and dispatches.
- Refinement, epics, acceptance criteria and backlog gaps go to `/product-management` (`discovery` mode's only callee).
- Branch creation, pull requests, merges, conflicts and chained-pull-request planning go to `/git-flow-master`.
- Stale or missing dependency edges and execution ordering go to `/project-context dev-roadmap`.
- Launching, supervising and closing the dispatched workers through an orchestration runtime, and registering the run as a scheduled routine there, go to `/agent-orchestration` (only when its gate passes; this skill keeps every WHAT).

### Out of scope

- QA verification: a separate workflow picks up from the QA-ready state.
- Choosing what to build: that is product work and it escalates.

If a pre-requisite check fails, stop and report. Do not continue and do not improvise around it.

---

## Pseudocode tags used here

| Tag | Resolves to | Defined in |
| --- | --- | --- |
| `[ISSUE_TRACKER_TOOL]` | the project's tracker CLI or MCP | `AGENTS.md` Tool Resolution |
| `[DB_TOOL]` | the project's database MCP or CLI | `AGENTS.md` Tool Resolution |
| `[ORCHESTRATION_TOOL]` | the multi-session orchestration layer, used only for the optional Phase 3 worker dispatch; when the gate fails the default dispatch runs and the tag is never named | `/agent-orchestration` (user level) |

`git`, `gh` and `bun` are used literally.

---

## Variables consumed

- `autonomous_delivery.*`: every key in the Configuration block, read from `.agents/project.yaml`
- `git_strategy.branches.integration`: the branch every ancestry check runs against (`<integration-branch>`); null means `git_strategy.branches.production` takes that role for the checks only
- `git_strategy.branches.production` and `git_strategy.protected`: never a merge or deploy target for this skill
- `{{stack.*}}`: passed through to the dispatched skill (`/sprint-development`, `## Stack parameters`): the app's script names, root, database and `{{stack.database.migrations_tool}}`
- `{{PROJECT_KEY}}`, `{{ISSUE_TRACKER}}`: tracker queries
- `testing.automation_identity`: passed through to the dispatched skill, never substituted

If a required key is unset, the run ends in Phase 0 naming the file and the key.

---

## References

| Read | For |
| --- | --- |
| `references/audit-and-selection.md` | Phase 1 audit commands and their traps; Phase 2 selection recipes, readiness signals, scope-growth signals, claim protocol |
| `references/hazard-catalogue.md` | Every hazard by class: trigger, symptom, check |
| `references/run-report-format.md` | Run report, handoff, escalation-log entry and `progress.md` formats |
| `agentic-dev-core/references/decision-protocol.md` | Who decides what, and in which order |
| `agentic-dev-core/references/briefing-template.md` | The 7-component dispatch briefing |
| `agentic-dev-core/references/session-management.md` | The session contract this skill adapts for unattended use |
| `sprint-development/references/rpc-authorization.md` | The authorization gate this run never waives |
| `references/worker-dispatch.md` | How a run dispatched through supervised workers splits the work with the orchestration skill (only when its gate passes) |

---

## Notes

- This skill assumes `/sprint-development` and `/product-management` are installed and their pre-requisites met. It fails fast rather than substituting for either.
- The caps, the lock semantics, the order of the clean-stop sequence and every hazard come from a measured multi-agent run. Treat a change to one as a change to a finding, not a preference.
- Shipping is the output; a resumable state is the invariant.
