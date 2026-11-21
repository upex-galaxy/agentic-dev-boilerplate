---
name: sprint-development
description: "Drives the per-story dev loop from tracker ticket to deployed code: plan, implement, review, staging deploy, gated production deploy. Use when implementing a story or fixing a bug, reviewing or merging a PR, deploying to staging or production, rolling back, resuming interrupted work, or processing a sprint. Not for backlog or AC work (/product-management), scaffolding (/project-bootstrap) or standalone TDD (/unit-testing)."
license: MIT
compatibility: [claude-code, codex, opencode, pi]
phase: implementation
complementary_categories:
  - frontend-ui
  - frontend-framework
  - forms-validation
  - backend-db
  - testing-e2e
  - accessibility
  - seo
  - deploy
  - email
  - ci-cd
# compact_rules is read verbatim by scripts/build-skill-registry.ts (frontmatter first, no truncation).
# Keep it in sync with the "## Compact Rules" section in the body below.
compact_rules: |
  - Critical Rule #18, no comments in code by default: new and edited code carries no comments except a toolchain directive (`eslint-disable-next-line <rule> -- <reason>`, `@ts-expect-error`, `LINT.IfChange`/`LINT.ThenChange`) or one line of WHY the code cannot express and a reader would otherwise get wrong. No JSDoc blocks, section banners, narrated steps or example TODOs; teaching goes to docs and decks. Put this rule in component 7 of every briefing that writes or edits code.
  - Log into a running app only as the account that `testing.automation_identity` in `.agents/project.yaml` names (the file holds variable names, the values live in `.env`). If the slot is unset or a variable is missing, stop and report. Do not substitute another account, look one up in the database, create one, or reuse the human's browser session. See `references/live-ui-identity.md`.
  - Load a stack skill at the step that writes in its domain: `supabase` and `supabase-postgres-best-practices` before a DB MCP schema, RLS or migration call; the design set (`frontend-design`, `ui-ux-pro-max`, `impeccable`, `emil-design-eng`, `modern-web-guidance`, strategy doc §3.5) plus `shadcn` and `tailwind-css-patterns` before a component or layout write; `deploy-to-vercel` next to `vercel-cli` at Stage 4 and 5; `resend-cli` for email; `seo` for a public page. If one is not installed, say so once with the install path (`bun setup`) and continue (`agentic-dev-core/references/skill-composition-strategy.md` §3.5).
  - Never go around the app's own login path: no service-role, secret or admin keys, no admin user-management APIs, no generated magic or password-reset links, no locally signed JWTs, no hand-crafted session cookies, no impersonating an account, not even to look at the admin view. Report the need as a finding instead.
  - Session material is ephemeral. Keep cookie jars, `storageState.json`, token files and `.har` captures in the session scratch directory, never the repo tree, delete them before reporting, and disclose them as `secrets_materialized:` and `cleaned:` in the report. Never echo a credential into a report, plan, commit, PR body or tracker comment.
  - Approve a UI story on browser evidence at the gate, not on HTTP probes alone. Tier 0 probes carry the inner loop and non-visual assertions only (`references/live-ui-validation.md` §7). Validate against the dev server, never a production build.
  - `/playwright-cli` is the only browser path. Name every session (`-s=<name>`, never the default), keep it in memory (no `--persistent`, no `--profile`), and never touch the human's own browser. Type credentials only as `--raw fill <ref> "$VAR"`. One identity gets one live browser, so subagents on the same identity run serially. Close every session before the report and prove it with `playwright-cli list`; never `close-all`, `kill-all` or `pkill`. Report `browser_sessions:` with the names (`references/live-ui-validation.md` §3).
  - The `WHERE` clause of a `SECURITY DEFINER` function is not authorization. The function bypasses RLS unless the table declares `FORCE ROW LEVEL SECURITY` (check your schema, never assume it), so a filter on a caller-supplied identity or scope parameter selects rows but does not decide who may ask. Such a function needs both an actor bind at step 0 (`if auth.uid() is not null and auth.uid() <> p_actor_user_id then raise ... errcode 'P0002'`) and explicit scoping of every returned row; asserting the caller's own membership does not scope the result set. First ask whether `SECURITY INVOKER`, or deleting the identity parameter, removes the whole class. Prove the fix with a DB integration test that attempts the spoof against the real database; a mocked `db.rpc` proves nothing (`references/rpc-authorization.md`).
  - The review size forecast gate fails closed. With `Review Size = High`, accept a `Chain strategy` only with a verbatim `Decision trace:` citing the git-flow-master chained-PR tree answers. A missing or malformed trace counts as `pending` and blocks Stage 2. The planner may only emit `pending` and never picks a strategy itself.
  - On the `jira` tracker, AI Effort `High` warns and never blocks. At pickup read the QA shift-left handoff comment, the ATP (the QA test intent) and `{{jira.ai_effort}}`, then proceed. On `High`, write in the plan and the PR description that the story may be large and may be split; you may split your own work into stacked small PRs (about 200 changed lines and 2 to 5 files each) but you still work the whole ticket. Unset: proceed and note it. Autonomous and fleet runs never skip or stop a story for `High`, and a missing ATP is flagged to QA in a comment, never a block.
  - On the `jira` tracker, DTU is optional, measured and cumulative. At the verified `{{jira.status.story.ready_for_qa}}` state (not when the `deployed` automation fires) and after each fix loop, read the current `{{jira.development_token_usage}}`, add this cycle's measured delta (K = input plus output tokens, cache reads apart) and never overwrite it (an empty value takes just the delta). Post one comment `DTU cycle N: +x K (total y K) source=<harness or human>` and append each session's measured tokens to `progress.md` so Stage 4 can sum them. If the field is absent from `.agents/jira-fields.json`, the comment carries the figure. With no measured figure from the harness or a human, leave it empty and state N/A with the reason in the stage verifier; never estimate or invent a number. A tech item that goes straight to `completed` states N/A too.
  - On the `jira` tracker, at Ready For QA, move the native `assignee` to the QA named in `{{jira.qa_assignee}}` (the record of the QA who followed the story since shift-left; read it, never overwrite it), then read `assignee` back. If `qa_assignee` is empty, leave `assignee` as it is and say so in the QA notification comment.
  - Query ticket availability live. Before planning or recommending a ticket, ask the tracker about it and its direct blockers. `.context/dev-roadmap.md` is authoritative for dependency edges and mockup gates, never for current status, whatever its timestamp says. With tracker `none` there is no ticket to query: say so.
  - Read `.agents/project.yaml`, `package.json` and `.env.example` before asserting what the project is configured to do, and cite the file. A value in a skill reference or a worked example is never project state.
  - Resolve the tracker before the first tracker call: `issue_tracker.issue_tracker` in `.agents/project.yaml` through `cli/lib/issue-tracker.ts` gives `jira`, `github` or `none` (null and any text other than exactly `github` or `none` are `jira`). Every Jira step (`{{jira.*}}` fields, `jira:sync-*`, the `.context/PBI/` tree, ATP, AI Effort, DTU, the QA assignee, the QA comment, the defect loop) runs only on `jira`, exactly as written. On `github` and `none` (and on `jira` with `trail.enabled: true`) the trail `<trail.dir>/<KEY>-<slug>/` holds the plan and the results, and a commit of the change carries `Trail: <trail.dir>/<KEY>-<slug>/` on the line above `Worktree:` and `Session:` (`## Tracker modes`, `## The trail`).
  - Product docs are the PRD/SRS or the business maps. Fast-fail only when neither set exists (Pre-requisites), and never author a PRD, an SRS or a Constitution to satisfy the check. `## Inputs`, under "Product docs: PRD/SRS or business maps", lists what each case reads.
  - Read the app's stack, never assume it. An app command is `{{stack.package_manager}} run {{stack.scripts.<role>}}` from `{{stack.app_root}}`; a null role means skip that check and say so, never invent or add the script. Branches come from `git_strategy.branches` (with integration null, the base and merge target are the production branch, never a literal `staging` or `develop`). A schema change goes through the DB MCP per `{{stack.database.migrations_tool}}` after reading the migration history through it (`agentic-dev-core/references/db-change-doctrine.md`); capability `db` binds only a story that touches the database. The app's own conventions win over this skill's defaults, and an existing test id is never renamed (`## Stack parameters`). With `stack.local_build` (absent means true) false, Stages 2 to 4 skip the local `build` role, say so in the report and rely on the hosting build that the Stage 4 staging deploy check reads.
  - Technical decisions are yours, but read the record first. Search the run's decision and escalation log, `.context/ADR/`, and the ticket plus its siblings before deciding or asking. Follow and cite a decision already made; re-asking a settled question, even of a human who gets it cold, produces a contradiction and not an override. Decide an unsettled technical call through a scored judge panel of 3 to 5 independent lenses, and record the decision with its scoring rationale where the next agent's search will find it. Escalate only product or business calls, a new security posture nobody ratified, irreversible or destructive actions, and whatever the operator reserved (`agentic-dev-core/references/decision-protocol.md`, which also says who answers when a person, a conductor or nobody is present). With `decision_authority.product: decide` in `.agents/project.yaml` (no human PO in the loop), product calls go to a scored, attributed decision subagent instead (`decision-protocol.md` §5.1).
  - Name tracker moves by slug, verify them at the destination, never guess. On `github` a move is an abstract status set by option name through `/github-projects` and read back (`agentic-dev-core/references/artifact-lifecycle.md` §6), and `none` makes no tracker call. On `jira`, fire only the transitions `agentic-dev-core/references/artifact-lifecycle.md` §1 gives this stage (Stage 1 `start_working`; Stage 3 `pull_request` and `ready`; Stage 4 `deployed` and `fixed_and_deployed`; the bug-triage slugs; the defect loop `fix_defect` and `back_to_dev` when QA moved the story to `blocked`). Re-read the status after every Stage 3 and Stage 4 event and fire the slug yourself when automation did not. Read `assignee` before and after every transition, because merge automation reassigns it to the developer. If the slug is missing for the work type, list the live transitions, ask one question through the path `decision-protocol.md` §5.2 gives for who is running (a routine with nobody records it and fires nothing), fire the live id and recommend `bun run jira:sync-workflows`. Never use a remembered or cross-project id, hand-edit `.agents/jira-workflows.json`, or skip silently.
  - A fleet worker stops at an open PR. In batch-sprint with N>1 executors (`references/fleet-mode.md`), a worker is detected from its prompt (`/sprint-development <KEY> fleet worker` plus a brief path), never from the environment. It runs Stages 1 to 3 on its one ticket without human checkpoints and without returning to its prompt. Merge, staging deploy, shared-DB migrations, live-instance regeneration and the sprint report stay with the conductor. N=1 is unchanged, and when the orchestration gate fails the launch file is still written and the orchestrator is never named.
  - Plan before code. Stage 1 always runs; even a bug fix gets a one-paragraph root-cause analysis before the diff.
  - Verification cap=3: run lint, types and unit tests in parallel, and push only when all three are green.
  - Commit atomically with semantic prefixes and no AI-attribution lines. Never use `--no-verify` and never force-push a pushed branch. A push to a protected branch follows `git_strategy.policy.direct_push_to_protected` (Critical Rule #4: `allowed` pushes, `confirm` asks, `forbidden` routes through a PR).
  - Touch only what the story states. No "while I'm here" refactors.
  - Place code by GUARD layer (`agentic-dev-core/references/guard-architecture.md`). Before writing, read `guard-manifest.json` and reuse a feature action that exists before adding one. A new feature starts from the shape of `packages/guard-example/`. Run `bun run guard:manifest` when a feature door changed.
  - Docs travel with the change. A story that adds, renames or retires a skill mode, a `package.json` script, a doc or `.context/` path, an MCP server or an env var, or changes a behaviour a page describes, patches every doc that names or describes it in the same PR, per `agentic-dev-core/references/docs-follow-through.md`. `bun run docs:check` proves the mechanical half.
  - Adjudicate reviewer findings instead of applying them blindly: verify each against the diff and the AC, or dismiss it with a one-line reason.
  - Resolve each capability in `metadata.requires_capabilities` by tool-name suffix, any prefix. When none is available at the step that needs it, stop per `agentic-dev-core/references/mcp-capabilities.md` §4 and never substitute silently (built-in `WebSearch` and `WebFetch` only when the user chooses it).
metadata:
  kind: workflow
  stage_owner: true
  requires_capabilities: [library-docs, db]
---

<!-- Model preferences (advisory; dispatchers may use to route) -->
<!--
model_preferences:
  foundation: opus       # high-leverage architectural work
  planning: sonnet       # structured writing
  implementation: sonnet # default for code work
  review: opus           # critical analysis
  archive: haiku         # mechanical close-out
-->

# Sprint development: plan, code, review and deploy per story

This skill drives the per-story development loop from tracker ticket (a Jira story, a GitHub issue, or with no tracker a trail plan) to deployed code in five stages, always in this order: **Stage 1 Planning, Stage 2 Implementation, Stage 3 Code Review, Stage 4 Staging Deploy, Stage 5 Production Deploy (gated, optional)**.

The same pipeline runs for a new story, a bug fix or a resume of interrupted work. Only the entry point and the dispatch payload per stage differ.

## Compact Rules

> The registry copies these rules into `.agents/skills/REGISTRY.md` and into every subagent briefing, because they have to bind an executor and not only inform the orchestrator (`agentic-dev-core/references/orchestration-doctrine.md`, "Rule reachability"). Rationale lives in the files they point to.

- Critical Rule #18, no comments in code by default: new and edited code carries no comments except a toolchain directive (`eslint-disable-next-line <rule> -- <reason>`, `@ts-expect-error`, `LINT.IfChange`/`LINT.ThenChange`) or one line of WHY the code cannot express and a reader would otherwise get wrong. No JSDoc blocks, section banners, narrated steps or example TODOs; teaching goes to docs and decks. Put this rule in component 7 of every briefing that writes or edits code.
- Log into a running app only as the account that `testing.automation_identity` in `.agents/project.yaml` names (the file holds variable names, the values live in `.env`). If the slot is unset or a variable is missing, stop and report. Do not substitute another account, look one up in the database, create one, or reuse the human's browser session. See `references/live-ui-identity.md`.
- Load a stack skill at the step that writes in its domain: `supabase` and `supabase-postgres-best-practices` before a DB MCP schema, RLS or migration call; the design set (`frontend-design`, `ui-ux-pro-max`, `impeccable`, `emil-design-eng`, `modern-web-guidance`, strategy doc §3.5) plus `shadcn` and `tailwind-css-patterns` before a component or layout write; `deploy-to-vercel` next to `vercel-cli` at Stage 4 and 5; `resend-cli` for email; `seo` for a public page. If one is not installed, say so once with the install path (`bun setup`) and continue (`agentic-dev-core/references/skill-composition-strategy.md` §3.5).
- Never go around the app's own login path: no service-role, secret or admin keys, no admin user-management APIs, no generated magic or password-reset links, no locally signed JWTs, no hand-crafted session cookies, no impersonating an account, not even to look at the admin view. Report the need as a finding instead.
- Session material is ephemeral. Keep cookie jars, `storageState.json`, token files and `.har` captures in the session scratch directory, never the repo tree, delete them before reporting, and disclose them as `secrets_materialized:` and `cleaned:` in the report. Never echo a credential into a report, plan, commit, PR body or tracker comment.
- Approve a UI story on browser evidence at the gate, not on HTTP probes alone. Tier 0 probes carry the inner loop and non-visual assertions only (`references/live-ui-validation.md` §7). Validate against the dev server, never a production build.
- `/playwright-cli` is the only browser path. Name every session (`-s=<name>`, never the default), keep it in memory (no `--persistent`, no `--profile`), and never touch the human's own browser. Type credentials only as `--raw fill <ref> "$VAR"`. One identity gets one live browser, so subagents on the same identity run serially. Close every session before the report and prove it with `playwright-cli list`; never `close-all`, `kill-all` or `pkill`. Report `browser_sessions:` with the names (`references/live-ui-validation.md` §3).
- The `WHERE` clause of a `SECURITY DEFINER` function is not authorization. The function bypasses RLS unless the table declares `FORCE ROW LEVEL SECURITY` (check your schema, never assume it), so a filter on a caller-supplied identity or scope parameter selects rows but does not decide who may ask. Such a function needs both an actor bind at step 0 (`if auth.uid() is not null and auth.uid() <> p_actor_user_id then raise ... errcode 'P0002'`) and explicit scoping of every returned row; asserting the caller's own membership does not scope the result set. First ask whether `SECURITY INVOKER`, or deleting the identity parameter, removes the whole class. Prove the fix with a DB integration test that attempts the spoof against the real database; a mocked `db.rpc` proves nothing (`references/rpc-authorization.md`).
- The review size forecast gate fails closed. With `Review Size = High`, accept a `Chain strategy` only with a verbatim `Decision trace:` citing the git-flow-master chained-PR tree answers. A missing or malformed trace counts as `pending` and blocks Stage 2. The planner may only emit `pending` and never picks a strategy itself.
- On the `jira` tracker, AI Effort `High` warns and never blocks. At pickup read the QA shift-left handoff comment, the ATP (the QA test intent) and `{{jira.ai_effort}}`, then proceed. On `High`, write in the plan and the PR description that the story may be large and may be split; you may split your own work into stacked small PRs (about 200 changed lines and 2 to 5 files each) but you still work the whole ticket. Unset: proceed and note it. Autonomous and fleet runs never skip or stop a story for `High`, and a missing ATP is flagged to QA in a comment, never a block.
- On the `jira` tracker, DTU is optional, measured and cumulative. At the verified `{{jira.status.story.ready_for_qa}}` state (not when the `deployed` automation fires) and after each fix loop, read the current `{{jira.development_token_usage}}`, add this cycle's measured delta (K = input plus output tokens, cache reads apart) and never overwrite it (an empty value takes just the delta). Post one comment `DTU cycle N: +x K (total y K) source=<harness or human>` and append each session's measured tokens to `progress.md` so Stage 4 can sum them. If the field is absent from `.agents/jira-fields.json`, the comment carries the figure. With no measured figure from the harness or a human, leave it empty and state N/A with the reason in the stage verifier; never estimate or invent a number. A tech item that goes straight to `completed` states N/A too.
- On the `jira` tracker, at Ready For QA, move the native `assignee` to the QA named in `{{jira.qa_assignee}}` (the record of the QA who followed the story since shift-left; read it, never overwrite it), then read `assignee` back. If `qa_assignee` is empty, leave `assignee` as it is and say so in the QA notification comment.
- Query ticket availability live. Before planning or recommending a ticket, ask the tracker about it and its direct blockers. `.context/dev-roadmap.md` is authoritative for dependency edges and mockup gates, never for current status, whatever its timestamp says. With tracker `none` there is no ticket to query: say so.
- Read `.agents/project.yaml`, `package.json` and `.env.example` before asserting what the project is configured to do, and cite the file. A value in a skill reference or a worked example is never project state.
- Resolve the tracker before the first tracker call: `issue_tracker.issue_tracker` in `.agents/project.yaml` through `cli/lib/issue-tracker.ts` gives `jira`, `github` or `none` (null and any text other than exactly `github` or `none` are `jira`). Every Jira step (`{{jira.*}}` fields, `jira:sync-*`, the `.context/PBI/` tree, ATP, AI Effort, DTU, the QA assignee, the QA comment, the defect loop) runs only on `jira`, exactly as written. On `github` and `none` (and on `jira` with `trail.enabled: true`) the trail `<trail.dir>/<KEY>-<slug>/` holds the plan and the results, and a commit of the change carries `Trail: <trail.dir>/<KEY>-<slug>/` on the line above `Worktree:` and `Session:` (`## Tracker modes`, `## The trail`).
- Product docs are the PRD/SRS or the business maps. Fast-fail only when neither set exists (Pre-requisites), and never author a PRD, an SRS or a Constitution to satisfy the check. `## Inputs`, under "Product docs: PRD/SRS or business maps", lists what each case reads.
- Read the app's stack, never assume it. An app command is `{{stack.package_manager}} run {{stack.scripts.<role>}}` from `{{stack.app_root}}`; a null role means skip that check and say so, never invent or add the script. Branches come from `git_strategy.branches` (with integration null, the base and merge target are the production branch, never a literal `staging` or `develop`). A schema change goes through the DB MCP per `{{stack.database.migrations_tool}}` after reading the migration history through it (`agentic-dev-core/references/db-change-doctrine.md`); capability `db` binds only a story that touches the database. The app's own conventions win over this skill's defaults, and an existing test id is never renamed (`## Stack parameters`). With `stack.local_build` (absent means true) false, Stages 2 to 4 skip the local `build` role, say so in the report and rely on the hosting build that the Stage 4 staging deploy check reads.
- Technical decisions are yours, but read the record first. Search the run's decision and escalation log, `.context/ADR/`, and the ticket plus its siblings before deciding or asking. Follow and cite a decision already made; re-asking a settled question, even of a human who gets it cold, produces a contradiction and not an override. Decide an unsettled technical call through a scored judge panel of 3 to 5 independent lenses, and record the decision with its scoring rationale where the next agent's search will find it. Escalate only product or business calls, a new security posture nobody ratified, irreversible or destructive actions, and whatever the operator reserved (`agentic-dev-core/references/decision-protocol.md`, which also says who answers when a person, a conductor or nobody is present). With `decision_authority.product: decide` in `.agents/project.yaml` (no human PO in the loop), product calls go to a scored, attributed decision subagent instead (`decision-protocol.md` §5.1).
- Name tracker moves by slug, verify them at the destination, never guess. On `github` a move is an abstract status set by option name through `/github-projects` and read back (`agentic-dev-core/references/artifact-lifecycle.md` §6), and `none` makes no tracker call. On `jira`, fire only the transitions `agentic-dev-core/references/artifact-lifecycle.md` §1 gives this stage (Stage 1 `start_working`; Stage 3 `pull_request` and `ready`; Stage 4 `deployed` and `fixed_and_deployed`; the bug-triage slugs; the defect loop `fix_defect` and `back_to_dev` when QA moved the story to `blocked`). Re-read the status after every Stage 3 and Stage 4 event and fire the slug yourself when automation did not. Read `assignee` before and after every transition, because merge automation reassigns it to the developer. If the slug is missing for the work type, list the live transitions, ask one question through the path `decision-protocol.md` §5.2 gives for who is running (a routine with nobody records it and fires nothing), fire the live id and recommend `bun run jira:sync-workflows`. Never use a remembered or cross-project id, hand-edit `.agents/jira-workflows.json`, or skip silently.
- A fleet worker stops at an open PR. In batch-sprint with N>1 executors (`references/fleet-mode.md`), a worker is detected from its prompt (`/sprint-development <KEY> fleet worker` plus a brief path), never from the environment. It runs Stages 1 to 3 on its one ticket without human checkpoints and without returning to its prompt. Merge, staging deploy, shared-DB migrations, live-instance regeneration and the sprint report stay with the conductor. N=1 is unchanged, and when the orchestration gate fails the launch file is still written and the orchestrator is never named.
- Plan before code. Stage 1 always runs; even a bug fix gets a one-paragraph root-cause analysis before the diff.
- Verification cap=3: run lint, types and unit tests in parallel, and push only when all three are green.
- Commit atomically with semantic prefixes and no AI-attribution lines. Never use `--no-verify` and never force-push a pushed branch. A push to a protected branch follows `git_strategy.policy.direct_push_to_protected` (Critical Rule #4: `allowed` pushes, `confirm` asks, `forbidden` routes through a PR).
- Touch only what the story states. No "while I'm here" refactors.
- Place code by GUARD layer (`agentic-dev-core/references/guard-architecture.md`). Before writing, read `guard-manifest.json` and reuse a feature action that exists before adding one. A new feature starts from the shape of `packages/guard-example/`. Run `bun run guard:manifest` when a feature door changed.
- Docs travel with the change. A story that adds, renames or retires a skill mode, a `package.json` script, a doc or `.context/` path, an MCP server or an env var, or changes a behaviour a page describes, patches every doc that names or describes it in the same PR, per `agentic-dev-core/references/docs-follow-through.md`. `bun run docs:check` proves the mechanical half.
- Adjudicate reviewer findings instead of applying them blindly: verify each against the diff and the AC, or dismiss it with a one-line reason.
- Resolve each capability in `metadata.requires_capabilities` by tool-name suffix, any prefix. When none is available at the step that needs it, stop per `agentic-dev-core/references/mcp-capabilities.md` §4 and never substitute silently (built-in `WebSearch` and `WebFetch` only when the user chooses it).

**Read full SKILL.md when**: the stage you are running needs its full walkthrough, a gate fires, or the briefing tells you to load the full skill.

## When to use

- A new user story (the common case): Stage 1 (`story-plan`), Stage 2 (`implement-story`), then on to Stage 4.
- A new feature with several stories: Stage 1 macro (`feature-plan`), then Stage 1 and 2 per story, and Stage 4 per merge.
- A bug fix: start at Stage 2 with `bug-fix-workflow.md` (root cause first), then Stage 3 and 4.
- Resuming an interruption: enter at Stage 2 through `continue-implementation.md`.
- PR feedback or a code review iteration: Stage 3 with `fix-issues.md`, looping fix and review.
- A production deploy is a separate event: Stage 5, only after QA is green and the business has approved.

## Tracker modes

Resolve the tracker once per run, before the first tracker call: `issue_tracker.issue_tracker` in `.agents/project.yaml`, read through `cli/lib/issue-tracker.ts`: trim and lowercase it, and exactly `github` or `none` selects that tracker; null, `Jira`, `JIRA` and any text other than exactly `github` or `none` (for example a legacy "Jira Cloud") is `jira`. State the value in the Stage 1 plan.

Every passage of this skill and its references that names Jira, a `{{jira.*}}` field, `jira:sync-issues`, the `.context/PBI/` tree, the ATP, AI Effort, DTU, the QA assignee, the QA notification or the defect loop runs only when the tracker resolves to `jira`, and there it runs exactly as written. On `github` and `none` use this table instead:

| Step | `jira` | `github` | `none` |
|---|---|---|---|
| Prerequisite story | story with refined AC; else `/product-management` | issue whose body has an AC checklist (`- [ ]`); else hand off to `/github-projects` | the AC section of the trail `plan.md` |
| `<KEY>` (session scope) | `UPEX-123` | `GH-<n>` | `<NNN>`, the next free three-digit number under `trail.dir` |
| Pickup read | QA handoff, ATP, AI Effort | issue body and comments (`gh issue view <n> --comments`) | the request in `plan.md` |
| Live status (Phase 0b) | JQL through `[ISSUE_TRACKER_TOOL]` | the card's Status and its blocked-by issues, through `/github-projects` | none; say so |
| Release batch | the sprint | the milestone: Stage 1 confirms the issue's milestone or asks (open releases, "new release", or the owner's "unplanned") | none |
| Canonical plan | `spec_implementation_plan`, synced to `implementation-plan.md` | trail `plan.md` plus one issue comment linking it | trail `plan.md` |
| Status moves | slugs, `artifact-lifecycle.md` §1 | abstract statuses, `artifact-lifecycle.md` §6, each read back | no tracker call |
| PR title and commit footer | `feat({{PROJECT_KEY}}-N)`, `Story: [Jira link]` | `feat(#N)`, `Refs #N` (the final commit carries `Closes #N`) | `feat(<slug>)`, no footer |
| Stage 4 hand-off | QA comment, assignee to QA, DTU | one issue comment: PR or pushed SHA, staging URL, trail link | trail `results.md` |
| Bug | Jira bug fields | issue type Bug plus a severity label (`references/bug-fix-workflow.md`, `## Tracker branch`) | the trail |

The abstract statuses are `backlog`, `in_progress`, `in_review`, `on_staging` and `released`; `blocked` is a label. Stage 1 sets `in_progress`, Stage 3 `in_review` (PR opened, or the local review started without a feature PR), Stage 4 `on_staging` once the staging deploy for the SHA reads READY; `released` comes from the issue closing on the production branch.

A sprint in this skill, `references/fleet-mode.md` and `references/sprint-report.md` is the release batch, the milestone on `github`; a fleet conductor's folder is `batch-<milestone-slug>/` there. File names keep the word `sprint`.

## The trail

The committed record of one change: on for `github` and `none`, off for `jira` unless `trail.enabled: true` (`null` means that default). Folder `<trail.dir>/<KEY>-<slug>/` (default `.context/trail`), started from `templates/trail/`:

| File | Written | Holds |
|---|---|---|
| `metadata.yml` | Stage 1, updated each stage | key, issue, milestone, branch, session; then SHA, PR, deploy |
| `plan.md` | Stage 1 | the canonical plan on `github`/`none`, Review Size Forecast at the bottom |
| `results.md` | Stage 3, closed at Stage 4 | what was done, the Spec Compliance Matrix, deviations, verification, the review adjudication summary with the root cause of anything the review bounced |
| `decisions.json` | only when the owner answered a question | each question and answer |

- `.session/sprint-development/<KEY>/progress.md` stays the resume log; `review.md` and the other working files stay in `.session/`.
- On `github`, post one issue comment linking `plan.md` once the trail is pushed (with the PR, or with the push in the no-feature-PR path); Stage 4 posts the hand-off comment; never paste the plan into the issue.
- Trail prose cites paths in inline code, not markdown links. The trail is left out of the Review Size forecast and out of the reviewers' diff (`git diff <base>...HEAD -- . ':(exclude)<trail.dir>'`); `bun run docs:check` skips the default dir.
- `.gitignore` commits only the four file names under `.context/trail/`. A project with another `trail.dir` owns its ladder; prove it with `git check-ignore -v` on a kept name and on a stray file.

## Pre-requisites

If one of these is missing, fast-fail and hand off to the setup skill that owns it.

- `.agents/project.yaml` is populated. If not, the agentic layer is not installed: `bunx create-agentic-dev@latest <name>` for a new project, or `bunx create-agentic-dev@latest --adopt` then `/project-adoption` for an existing app.
- Product docs exist in one of two forms (either passes):
  - PRD/SRS: `.context/PRD/` and `.context/SRS/` hold documents beyond their `README.md` placeholder (`/project-foundation` Phases 2 and 3).
  - Business maps: the data map is generated (`bun run context:map business-data-context` prints sections, not the placeholder notice). The existing-app chain is `/project-adoption`, `/project-context refresh-all`, then `/project-foundation` in Discovery-only mode for the dev guide and the glossary.
  - With neither, hand off to `/project-foundation` (product still being defined) or `/project-context data` (code already exists). Never write a PRD or SRS to get past this check.
- The story exists in the issue tracker with refined acceptance criteria. On `jira`, with an empty backlog or unclear AC, run `/product-management` first. On `github`, the issue body carries an AC checklist; without one, hand off to `/github-projects`. On `none`, the AC section of the trail `plan.md` is the story (`## Tracker modes`).
- On `jira`, the pickup read (QA shift-left handoff comment, ATP, `{{jira.ai_effort}}`; Phase 0b step 5) is a warning and never a gate. A `High` AI Effort never stops the work.
- The branch policy is clear and CI is configured. First-time setup lives in `references/setup-linting.md` and `references/ci-cd-setup.md`.
- The working directory is the target project repo, not the boilerplate, and `.env` holds the environment URLs and credentials (never hardcoded).

## Inputs

Read these in order when you start cold, and stop earlier when the ticket is small enough that the later inputs add nothing. Inputs 2, 3, 4, 7 and 8 apply on `jira`; on `github` and `none` the trail folder (`## The trail`) takes the place of 7 and 8.

1. `.agents/project.yaml`: project identity, env URLs, project key, MCP names, `git_strategy` (branch policy), `stack:` (see `## Stack parameters`) and `testing.automation_identity` (the account a live-UI or authenticated-probe step logs in as).
2. `.agents/jira-required.yaml`: the canonical slug catalog (custom fields, statuses, link types) for the active workspace.
3. `.agents/jira-fields.json`: the slug to custom-field-ID mapping behind `{{jira.<slug>}}`.
4. `.agents/jira-workflows.json`: the workflow and transition catalog. Which stage fires which slug, and the fallback for an unmapped status: `agentic-dev-core/references/artifact-lifecycle.md`.
5. `.context/master-implementation-plan.md` (epic and strategy) and `.context/dev-roadmap.md` (ticket and sequence) for the parent feature. The master plan gives the Master Sprint priority; `dev-roadmap.md` gives the dependency edges, the execution-sprint order and the mockup gates, so it answers what is next and what blocks this ticket. If it is missing, Phase 0 bootstraps it through `/project-context dev-roadmap`.
6. `.context/business/domain-glossary.md`: the canonical domain terms. Read it before planning so the plan, identifiers, PR prose and Jira comments use them and avoid its banned terms.
7. `.context/PBI/epics/EPIC-<KEY>-<slug>/stories/STORY-<KEY>-<slug>/context.md`: story-level notes and open questions the dev writes (not from Jira).
8. `.context/PBI/epics/EPIC-<KEY>-<slug>/stories/STORY-<KEY>-<slug>/implementation-plan.md`: the canonical story-level plan, a read-only cache synced from the Jira `spec_implementation_plan` field. Read it before resuming Stage 2.
9. The architecture record: `.context/SRS/architecture-specs.md` when the SRS exists, otherwise the business-map sections in the table below, plus `.context/ADR/` in both cases, so the plan honors a settled decision. It is mandatory when the Stage 1 plan forecasts a database migration or touches an authentication, authorization, session or tenancy path. Answer from the plan, not the story title: the stories that most need a settled invariant are the ones nobody would call architectural. Otherwise read it whenever the story touches a cross-cutting concern. A yes on the migration half also loads `/supabase` and `/supabase-postgres-best-practices` before the first DB MCP schema, RLS or migration call (`references/implement-story.md`, the dependency setup step).
10. `DESIGN.md`, plus `.context/design/master-design-plan.md` when the project keeps per-screen specs. Mandatory whenever the story has UI. `DESIGN.md` is the token and component contract; a master design plan adds per-screen specs and a US-to-Screen map. Look the story up in §8, open its screen spec in §4 and the frozen tokens in §2, and treat the mockup in `.context/designs/<project-slug>/<batch-slug>/` as inspiration. The fidelity reference is the live UI plus the `DESIGN.md` tokens (Critical Rule #14): reuse live components, never invent UI, and ratify in §5 any departure before coding. With no screen to build against, `## The design gate` decides.
11. The business maps, read with `bun run context:map business-data-context`, `business-feature-context` and `business-api-context` (`--section <id>` for one section), for impact assessment when the story touches several domains.

On a PRD/SRS project the business maps (input 11) often arrive after `/project-context` modes `data`, `features` and `api` run and may still be placeholders. Proceed without them and note a `missing_input` in the Stage 1 plan.

### Product docs: PRD/SRS or business maps

The Pre-requisites accept either set. This table says where each Stage 1 and Stage 2 need reads from in each case (map sections by id: `bun run context:map <skill> --section <id>`):

| Need | PRD/SRS project | Business-maps project (no PRD/SRS) |
|---|---|---|
| Architecture and stack (input 9) | `.context/SRS/architecture-specs.md` | `business-api-context` `architecture` + `business-data-context` `overview`, `.context/business/project-dev-guide.md` |
| Data model, access rules | SRS functional specs, then the data map | `business-data-context` `entities`, `entity-<slug>`, `access-control`, `migrations`, `state-<entity>` |
| API contract (backend stories) | `.context/SRS/api-contracts.yaml` | the app's OpenAPI spec when it serves or commits one (synced by `bun run api:sync`); otherwise `business-api-context` `auth-model` + `journey-<slug>` and `business-feature-context` `route-inventory` |
| User journeys | `.context/PRD/user-journeys.md` | `business-api-context` `journey-<slug>`, `business-data-context` `flow-<slug>` |
| Scope and copy voice (UI text) | PRD `executive-summary.md`, `user-personas.md`, `mvp-scope.md` + the glossary | `.context/business/domain-glossary.md`, `business-feature-context` `overview` + `module-<slug>`, and the copy the live UI already uses |

`.context/ADR/` and the glossary (input 6) are read in both cases. With both sets present, the PRD/SRS state intent and the maps state what the code does, so when they disagree the code wins and the plan names the mismatch. On a business-maps project the maps are required inputs: a placeholder feature or API map the story needs is a `missing_input` in the plan, and the plan recommends `/project-context <mode>` and not a PRD or SRS.

## Stack parameters

The `stack:` block of `.agents/project.yaml` (leaves are `{{stack.<path>}}`) describes the app this skill builds, and `git_strategy` describes its branches. Read both once per run, together with input 1, and let them parametrize every stage. A reference that shows a literal command, branch or tool is showing the greenfield default those values resolve to. If the block is missing, use the defaults of `.agents/project.schema.yaml`, say so once in the Stage 1 plan, and name `bun run agents:setup --stack` as the fix.

| Value | What it decides | How each stage uses it |
|---|---|---|
| `{{stack.app_root}}` | where the app's `package.json` and code live | every app command runs from it and every app path a reference names resolves under it; the agentic tooling (`bun run jira:*`, `skills:*`, `context:map`) stays at the repo root |
| `{{stack.scripts.<role>}}` | the app's own script names (`dev`, `build`, `lint`, `types`, `test`, `db_types`) | an app command is `{{stack.package_manager}} run {{stack.scripts.<role>}}`. Verification cap=3 is the `lint`, `types` and `test` roles; the live-UI dev server is `dev`; the Stage 2 build check is `build`. A null role means the app has no such script: skip that check and say so in the report, and never invent the script or add one to the app's `package.json` inside a story |
| `git_strategy.branches.*` | where work branches from and merges to | base is `integration`, or `production` when `integration` is null (`solo-main`, `github-flow`, `trunk-based`); never the literal `staging` or `develop` in a command. With a null integration branch, Stage 4 verifies the PR's preview deployment and the merge to production is Stage 5 (`references/staging-deploy.md`) |
| `{{stack.database.*}}` | how a schema change is read and applied | through the DB MCP, with `{{stack.database.migrations_tool}}` naming who keeps the ledger, and the migration history read first. The doctrine is `agentic-dev-core/references/db-change-doctrine.md`. Story-level additions: never apply a change just to clear a local error (that is a finding); a fleet worker never applies to a shared database (`references/fleet-mode.md`); with `{{stack.database.engine}}` = `none`, a story that needs a database is a finding, not a step |
| capability `db` | the DB MCP | required only by a story whose plan touches the schema, RLS, a database function or the data (input 9's trigger); a story that does not is never stopped for it (`agentic-dev-core/references/mcp-capabilities.md` §4, optional steps) |
| `stack.local_build` (read by path; absent means `true`) | whether the production build runs locally | `false`: Stages 2 to 4 and every reference that runs the `build` role skip it, say so in the report and in `results.md`, and rely on the hosting build, read from the Stage 4 staging deploy check. `true` (default) runs it |
| `{{stack.ci}}` and `{{stack.hosting}}` | the CI the app already runs and where it deploys | `references/ci-cd-setup.md` is additive: an existing workflow is complemented with the user's OK and never replaced |
| `{{stack.conventions.import_alias}}`, `{{stack.conventions.testid_style}}` | the app's own conventions | see "Existing conventions win" below |

### Existing conventions win

The conventions in `references/code-standards.md`, `references/error-handling.md` and `references/data-testid-standards.md` are the default for an app that has none yet. Where the app already has one (folder layout, import alias, naming, error-handling shape, state or data-fetching library, test runner, test-id attribute and case), the story follows it and a contradicting reference rule does not apply. Read the convention from the code the story touches and its neighbours.

- Test ids: use `{{stack.conventions.testid_style}}` when set. When it is null and the code already carries test ids, infer the style from them. When it is null and there are none, follow `references/data-testid-standards.md`. Never rename, re-case or remove an existing test id, because other tooling (a QA suite, an analytics tag) may select on it.
- A convention you would change is a tech-debt note in the plan or the PR, not a rewrite inside the story.
- In review, a departure from the app's convention is a finding; a departure from a reference's default is not, where the app has its own.

## The design gate: a UI story with no screen

This skill checks and routes design and never authors a mockup. `/design-system`'s screen phase produces it, invoked per story at this moment, not up front for the whole product and not by `/product-management` when the story was written.

Run the gate in Stage 1 for every story with UI, before any code is planned:

| What you find | What to do |
|---|---|
| A §8 row exists and its mockup exists | Build against it. Open §4 for the screen spec and §2 for the frozen tokens, and ratify any deliberate departure in §5 before coding |
| A §8 row exists but is `🔒 mockup-gated` | The row already names what is missing. Take one of the three routes below; the row is the gate's input, not a blocker |
| No §8 row at all | Same three routes, plus write the row. A UI story with no row breaks the host repo's design-fidelity rule |
| No master design plan in the project | Fall back to `DESIGN.md`-only fidelity: token checks, no screen reference. Say so in the Stage 1 plan |

The three routes, and the user picks one (never choose silently):

- (a) Just-in-time mockup. Route to `/design-system`'s screen phase. It generates the design brief (`references/screen-design-brief.md`), commissions the screens through the best available method and returns a bundle. This is the default, so offer it first.
- (b) Spec-only build, ratified as a §5 divergence (plus an ADR when the departure is architectural). Legitimate when no design tool is reachable or the screen is trivial against existing patterns.
- (c) `DESIGN.md`-only build for this story, explicitly user-approved. Token fidelity only, no screen reference.

When the screen encodes an irreversible or scope-changing decision, ratify that decision in an ADR before the mockup is drawn, and check for this before routing to (a). A destructive-action confirmation is the deletion policy, not a picture of it, and drawing first lets whoever composes the screen pick the policy.

With nobody to pick the route, the choice follows `agentic-dev-core/references/decision-protocol.md` §5.2. A supervised worker asks its launcher and keeps working on what does not depend on the answer. A routine with nobody follows a route the delegating brief names; without one it records the question in the escalation log, builds nothing for that screen and reports the story as waiting on a route.

The gate lives here and not earlier because, once the token system is frozen, composing a screen is assembly against a fixed contract. Designing every screen up front produces mockups for requirements that later change. What has to exist early is the §8 row, a one-line statement of what the screen owes.

## Subagent Dispatch Strategy

> **Orchestration & Session contracts**: this skill follows `./orchestration-doctrine.md` (mandatory subagent dispatch — main thread is command center) AND `./session-management.md` (Phase 0 resume check, plan-first persistence at `.session/<skill-slug>/<scope>/`, archive on completion). Phase 0 (resume check) is NOT optional. The Phase 1 plan is authored in-session, pushed to the Jira `spec_implementation_plan` field, then read back from the synced canonical artifact at `.context/PBI/epics/EPIC-<KEY>-<slug>/stories/STORY-<KEY>-<slug>/implementation-plan.md`; under `.session/` this skill writes `progress.md` plus the Stage 2-3 working artifacts (`notes.md`, `bug-fix.md`, `review.md`, `compliance-matrix.md`, `evidence/`), never a `plan.md`.
>
> **Session close**: every stage ends with the light stage verifier and the session ends with the chat footer (tools used and dev surfaces touched), both per `agentic-dev-core/references/session-footer-contract.md`.

The scope is one ticket: `<scope>` is `<JIRA-KEY>` (for example `UPEX-123`), resolved from the invocation trigger, and session state lives at `.session/sprint-development/<JIRA-KEY>/progress.md` per `agentic-dev-core/references/session-management.md` §3 and §9. The skill uses the progress-only variant (§5 special cases and §13): the canonical plan stays in Jira and is materialized to `implementation-plan.md` by the sync. Every dispatch uses the 7-component briefing in `agentic-dev-core/references/briefing-template.md`, with the pattern per stage from `agentic-dev-core/references/dispatch-patterns.md`, under `agentic-dev-core/references/orchestration-doctrine.md`. On `github` and `none`, `<scope>` is `GH-<n>` or `<NNN>` and the canonical plan is the trail `plan.md`, which also lives outside `.session/`, so the progress-only variant holds.

### Execution mode: orchestrated or solo

The default is orchestrated: each stage goes to a fresh-context subagent with the 7-component briefing, and the main thread stays the command center without doing the heavy per-stage work.

Solo is opt-in, and only the user invokes it. An explicit solo signal in the invocation (`solo`, `no-subagents`, `no subagent`, `single session`, `inline`, `work in one session`, or the Spanish `en una sola sesión`, `sin subagentes`, `trabaja todo en esta sesión`) makes the orchestrator run every stage inline in this conversation with zero subagents. If the signal is ambiguous, ask once, lock the mode for the run and state it back ("Running SOLO: all stages inline, no subagents"). With nobody to ask (a worker or a routine), stay orchestrated.

| Aspect             | Orchestrated (default)                  | Solo (opt-in)                        |
| ------------------ | --------------------------------------- | ------------------------------------ |
| Per-stage work     | fresh subagent per the dispatch table   | inline in the main thread            |
| Briefing           | 7-component briefing per dispatch       | n/a (no dispatch); same context docs |
| Verification cap=3 | 3 parallel verifier subagents           | the 3 checks inline, sequentially    |
| Fix after review   | dispatch a fix subagent                 | apply the fix inline                 |
| Live-UI validation | inside the stage subagent that owns it  | inline, same stage                   |
| Failure protocol   | stop, report, offer retry/skip/abort    | identical                            |

Solo trades context isolation for fewer round-trips and one readable transcript, so it suits small or single-file tickets; anything multi-file stays orchestrated. Both modes run identical stages, gates, order and verification, and only delegation changes (solo is a sanctioned exception in `agentic-dev-core/references/orchestration-doctrine.md`).

| Stage / step                              | Pattern                | Subagent role                                                                                 |
| ----------------------------------------- | ---------------------- | --------------------------------------------------------------------------------------------- |
| Trigger / context-load (epic precheck)    | inline                 | the orchestrator reads the epic artifacts and the ticket; no subagent yet                     |
| Stage 1: Plan creation                   | Single                 | a dedicated planner: pickup read (QA handoff, ATP, AI Effort warning), read story and AC, decompose tasks, write `implementation-plan.md` |
| Stage 2: Implementation (multi-file)     | Sequential or Parallel | implementation agents, split by file or feature slice per the plan                            |
| Stage 2: Verification (lint, types, tests) | Parallel cap=3       | three verifiers in parallel on the app's `lint`, `types` and `test` scripts (`{{stack.package_manager}} run {{stack.scripts.<role>}}`; a null role is skipped and reported) |
| Stage 3: Code review                     | Parallel (two axes)    | two fresh-context reviewers, Spec and Standards, each tagging findings by axis; the orchestrator adjudicates. Briefs: `references/review-pr.md` `## Two-axis review` |
| Stage 3: Fix and iterate (review red)    | Sequential             | an implementation agent takes the review notes through `fix-issues.md` and reruns verification |
| Stage 4: Deploy to staging               | Single + Background    | a deploy agent kicks off and a background monitor watches health and smoke; then the Ready For QA hand-off (assignee to QA, DTU cycle, notification) |
| Pre-prod gate                             | inline                 | the orchestrator gates with the user and never auto-promotes                                  |
| Stage 5: Deploy to production            | Single + Background    | same pattern as staging, production target, rollback ready                                    |
| Fleet fan-out (batch-sprint, N>1 executors only) | Parallel        | not subagents of this turn: one launchable worker session per ticket of the round, each running this skill single-ticket through Stages 1 to 3; the conductor keeps Stage 4 per `references/fleet-mode.md` |

Stages run sequentially because each feeds the next (the plan feeds Stage 2, the diff feeds Stage 3, and Stage 3's approval gates Stage 4). Parallelism happens inside a stage: verification, multi-file implementation, the two review axes.

Production is never reached without a person. With nobody present, the pre-prod gate and Stage 5 run only when the delegating brief names that ticket and that deploy; otherwise stop at Stage 4 and report.

When a subagent fails, stop and report the partial state (which stages completed, which artifacts landed, which Jira transitions fired). With a person present, offer retry, skip-step or abort. A supervised worker reports to its conductor, and a routine records the options in its report and stops. Do not auto-fix or auto-rollback. See `agentic-dev-core/references/orchestration-doctrine.md`.

## Sprint roadmap checkpoint (batch-sprint mode only)

Batch mode is detected from the invocation ("process sprint N", "implement sprint N", "continue sprint", a `sprint-file` parameter, or any phrase that implies a sprint loop; on `github` the batch is a milestone, "process release <name>"). Single-ticket and bug-only invocations skip this step entirely.

Check whether `.context/reports/SPRINT-{N}-DEVELOPMENT.md` exists for the target sprint.

- Missing: generate it before entering the ticket loop, through `references/sprint-report.md` §Part 1 (Sprint Roadmap Generator).
- Present but older than 24h, or the user asks for a refresh: regenerate it. Warn, confirm the overwrite and preserve the Session Log entries. With nobody to confirm, regenerate only when the delegating brief covers it; otherwise proceed with the stale file and say it was stale.
- Present and fresh: proceed.

At Stage 1 entry the orchestrator reads the latest sprint report, if there is one, for queue and dependency context, and does not update it. In batch mode it updates the report row at each Jira transition (Stage 1 through Stage 4). Stage 5 is always manual per ticket: batch mode loops Stages 1 to 4 only.

### Executors: one session or a fleet (batch-sprint only)

Scope is one axis (single-ticket or batch-sprint) and executors is the other (1 or N). One executor is the default and unchanged: the ticket loop above, in this session. N>1 (fleet mode) applies to batch-sprint only, when the user asks for it or `.agents/project.yaml` `orchestration.max_workers` is greater than 1 (an explicit user number wins; no `orchestration:` block means N=1). The conductor (this session) seeds one brief per unblocked ticket of the round and always writes `<<PRIMARY_ROOT>>/.session/sprint-development/sprint-<N>/launch.txt`. Each worker runs this skill in single-ticket mode through Stages 1 to 3 in its own worktree and stops at an open PR; merging, the staging deploy and every other shared-state write stay with the conductor.

The orchestration gate alone decides how the sessions are launched. When it passes, `[ORCHESTRATION_TOOL]` launches and supervises them and the workers also report to its mailbox. When it fails, the user pastes the `launch.txt` lines into terminals, and nothing names, recommends or reports the orchestrator. A worker is recognised by its launch prompt (`/sprint-development <KEY> fleet worker` plus its brief), never by the environment. `references/fleet-mode.md` holds the rest: conductor-only operations, brief seeding, `launch.txt` rules, rounds, claims, blocked lines, liveness and failure modes.

### Composable callees

Per `complementary_categories` in this skill's frontmatter and the matching rule in `agentic-dev-core/references/skill-composition-strategy.md` §3:

- UI work: `frontend-ui` category (T3 or T4; ask if T4). The design set, `shadcn` and `tailwind-css-patterns` are required before the first component or layout write (`references/implement-story.md`, the analysis step), and the post-write pass (`impeccable` critique, `modern-web-guidance legacy-scan`) runs in `references/live-ui-validation.md` §5.
- Next.js and React patterns: `frontend-framework` (T3, silent if matched). Forms: `forms-validation` (T3, silent).
- DB work: `backend-db` (T3, silent). `supabase` and `supabase-postgres-best-practices` are required before any DB MCP schema, RLS or migration call (`references/implement-story.md`, the dependency setup step).
- Deploy (Stages 4 and 5): `deploy-to-vercel` (method) next to the T1 `vercel-cli` (verification), required in `references/staging-deploy.md` and `references/production-deploy.md`.
- Email: `resend-cli`, required when the story sends or templates email. Public pages: `seo`, required when the story adds or changes an indexable page.
- E2E tests, if in scope: `testing-e2e` (T4; ask before loading).

"Required at the step" follows `agentic-dev-core/references/skill-composition-strategy.md` §3.5: load before the first write, and if the skill is not installed, say so once with the install path and continue (neither a silent skip nor a hard stop). A T4 skill loads only after a yes; with nobody to ask, continue without it and note that in the plan.

When delegating to a subagent, inject a `## Composable Skills` block into its prompt that lists the resolved skills and project standards per `agentic-dev-core/references/skill-composition-strategy.md` §5.2.

---

## Main workflow

```
[Story in Jira: Ready For Dev]
       |
       v
   +--------------------------+
   | Epic precheck (step 0)   |   inline; verify feature-plan + feature-implementation-plan exist
   +--------------------------+
       |
       v
   +--------------------------+
   | Stage 1: PLANNING        |   references/feature-plan.md, story-plan.md
   |  - Read story + AC       |
   |  - Read QA handoff + ATP |
   |  - Note AI Effort (warn) |
   |  - Name test seams       |
   |  - Decompose into tasks  |
   |  - Push plan -> Jira     |
   |    field; sync; read     |
   |    implementation-plan.md|
   |  - Jira: -> In Progress  |
   +--------------------------+
       |
       v
   +--------------------------+
   | Stage 2: IMPLEMENTATION  |   references/implement-story.md, bug-fix-workflow.md,
   |  - TDD at planned seams  |       continue-implementation.md, fix-issues.md,
   |    (-> /unit-testing)    |       code-standards.md, error-handling.md, data-testid-standards.md
   |  - Multi-file edits      |
   |  - Lint+types+tests      |
   |    in parallel (cap=3)   |
   |  - Iterate on red signal |
   +--------------------------+
       |
       v
   +--------------------------+
   | Stage 3: CODE REVIEW     |   references/review-pr.md, setup-linting.md
   |  - Push branch + open PR |
   |    (-> /git-flow-master) |
   |  - Jira: auto -> In Review
   |  - Two-axis review       |
   |  - Fix-and-iterate loop  |
   |  - Update docs in branch |
   +--------------------------+
       |
       v
   +--------------------------+
   | Stage 4: STAGING DEPLOY  |   references/staging-deploy.md, ci-cd-setup.md, environment-config.md
   |  - Merge -> CI green     |
   |  - Auto-deploy staging   |
   |  - Jira: auto -> Ready For QA
   |  - Assignee -> QA owner  |
   |  - Notify QA, DTU cycle  |
   +--------------------------+
       |
       v
[QA verifies on staging (out of scope here)]
       |
       v (gate: QA green + business approval)
   +--------------------------+
   | Stage 5: PRODUCTION (opt)|   references/pre-deploy-checklist.md, production-deploy.md, rollback-plan.md
   |  - Pre-deploy checklist  |
   |  - Deploy to prod        |
   |  - Monitor + rollback ready
   +--------------------------+
```

The Jira lines above are the `jira` mode; `## Tracker modes` gives the `github` and `none` steps.

---

## Phase 0 — Resume check (MANDATORY, inline)

Before the Epic precheck and Stage 1, run the resume contract from `agentic-dev-core/references/session-management.md` §4:

1. Resolve `<scope>` for this invocation: `<JIRA-KEY>` from the trigger (for example `UPEX-123`; `GH-<n>` or `<NNN>` on `github` or `none`, read in place of `<JIRA-KEY>` below).
2. Check whether `.session/sprint-development/<JIRA-KEY>/progress.md` exists.
3. If it does not exist, go on to the Epic precheck and Stage 1. The orchestrator creates the directory and writes the first `progress.md` entry once Stage 1 begins. **No `plan.md` is written under `.session/`**: the synced `.context/PBI/epics/EPIC-<KEY>-<slug>/stories/STORY-<KEY>-<slug>/implementation-plan.md` stays canonical. On `github`/`none` the trail `plan.md` is canonical instead.
4. If it does exist:
   1. Read `.session/sprint-development/<JIRA-KEY>/progress.md` in full (at least the last 3 entries).
   2. Read the cross-referenced `.context/PBI/epics/EPIC-<KEY>-<slug>/stories/STORY-<KEY>-<slug>/implementation-plan.md` (the canonical plan, synced from Jira). To refresh it from the source of truth, run `bun run jira:sync-issues get <JIRA-KEY> --include-comments` and read the materialized file. On `github`/`none`, read the trail `plan.md` instead.
   3. Tell the user the ticket goal (from the implementation plan), the last completed stage with its timestamp, the next planned stage and any blocking note (for example "PR opened but CI red, last review note unresolved").
   4. Offer three options and wait for the answer: **resume** (jump to the next planned stage: a Stage 2 chunk, a Stage 3 fix-iterate, and so on), **restart** (archive the current directory to `.session/.archive/<YYYY-MM-DD>-sprint-development-<JIRA-KEY>-aborted/`, then re-enter the Epic precheck) or **abort**.

   With nobody to answer, resume: it is the reversible choice. A supervised worker takes the answer from its launcher, and restart or abort happens only when the launcher or the delegating brief says so (`agentic-dev-core/references/decision-protocol.md` §5.2).

Phase 0 is inline, with no subagent dispatch. The check fires even on a first invocation, so resume-or-fresh is never a guess.

### Phase 0b: dev-roadmap consult (inline, mandatory)

Right after the resume check and before the Epic precheck, consult `.context/dev-roadmap.md`. It is the canonical ticket-level source for what is next and what blocks this ticket.

1. **Bootstrap if missing.** If `.context/dev-roadmap.md` is absent or still the placeholder stub, run `/project-context dev-roadmap` to generate it, then go on. The owner holds the one implementation of the sort, so never re-derive it inline.
2. **Consult, always.** Read the §3 dependency graph, the §4 execution sprints and the §5 mockup-gate registry for `<JIRA-KEY>`:
   - Take the dependency edges, the mockup gates and the execution-sprint grouping from the doc, which owns them.
   - Confirm the ticket is not 🔒 mockup-gated in §5. If it is and the mockup is absent, route it through `## The design gate` (Critical Rule #14, the UI fidelity contract) before any code.
   - Put this ticket's execution sprint and any §6 per-story pre-dev blocker into the plan.
3. **Live status query, before recommending or planning any ticket.** The roadmap is authoritative for edges and never for status. Run the §6 query recipe against `[ISSUE_TRACKER_TOOL]` for this ticket and its direct hard blockers in one call (for example one JQL `key in (<CANDIDATE>, <BLOCKER-1>, <BLOCKER-2>)` returning status). Then:
   - Every hard blocker must be dev-done according to the live query. If one is not, stop and say so ("TICKET-X depends on TICKET-Y, live status `In Progress`: proceed anyway, switch tickets, or abort?"). With nobody to ask, a supervised worker reports the blocker to its conductor, and a routine stops that ticket, records the blocker and takes the next unblocked ticket the brief allows.
   - If the candidate is already past dev (`Ready For QA`, `Done`), stop and say so before planning anything.
   - The live query wins over prose. When it contradicts the doc, act on the query and flag the stale line for the next `/project-context dev-roadmap` run.
   - A recent timestamp on `dev-roadmap.md` is not evidence of live status: its dates track edge and mockup-gate refreshes, a different axis. Never skip the query because the doc looks fresh, and never recommend a next ticket on prose alone.
   - On `github`, read the card's Status and its blocked-by issues through `/github-projects`; on `none` there is no live status: say so.
4. **Cheap inline flips (surgical, not a regeneration).** Keep the durable layers fresh as work lands:
   - When this ticket reaches dev-done in this run (Stage 4: staging merged, Jira at Ready For QA, or the card at `on_staging` on `github`), flip its gate marker in §3 and §4 and clear any §5 mockup gate it satisfied.
   - If this ticket is new and absent from §3, add its edge (cite the Jira link, data-map or design source) or, when unclear, log it in the §6 edge-mapping TODO.
   - Never write live status into the doc (status stays a §6 query recipe) and never regenerate §4 inline. A structural re-sort is `/project-context dev-roadmap`'s job, so when many edges changed, recommend that run instead of hand-editing.
5. **Pickup read (never a gate).** After the live query, read the synced story (`bun run jira:sync-issues get <KEY> --include-comments`) and note in the Stage 1 plan the QA handoff comment (the shift-left comment: ATP pointer, risks, open questions), the ATP (the QA test intent; a missing one is flagged to QA in a Jira comment and the work continues) and AI Effort (`{{jira.ai_effort}}`; with the field absent from `.agents/jira-fields.json`, the `## AI Effort` comment in `comments.md`). `High` only warns, as Compact Rules say; unset means proceed and note it, optionally telling QA in the notification comment. A PO (`/product-management`) may propose splitting a `High` story (clone it, refine both, leave both Ready For Dev). Nobody waits for that, and whoever resolves a split may add one optional label (`split-accepted`, `split-edited` or `split-rejected`). On `github`, the pickup read is the issue body and its comments.

Phase 0b reads on every invocation and writes only the narrow flips above, and only when this run changed the ticket's state.

The first `progress.md` entry has a `## Cross-references` section that cites both `.context/PBI/epics/EPIC-<KEY>-<slug>/stories/STORY-<KEY>-<slug>/implementation-plan.md` (the canonical plan, synced from Jira; on `github`/`none`: the trail `plan.md`) and `.context/reports/SPRINT-<N>-DEVELOPMENT.md` (the cross-ticket sprint tracker, when batch mode is active). These two pointers replace the `plan.md` the full session variant would write.

> **Progress checkpoint**: the orchestrator appends a `progress.md` entry (`agentic-dev-core/references/session-management.md` §7) when Stage 1 is done (plan pushed to Jira `spec_implementation_plan`, synced, Jira at In Progress; on `github`/`none` the trail `plan.md` committed and the card at `in_progress`), after every completed Stage 2 chunk (multi-file edit pass plus verification cap=3 green), after each Stage 3 review iteration (review red, fix-issues loop, re-review), when Stage 4 merges to staging (Jira at Ready For QA; `on_staging` on `github`) and when Stage 5 deploys or rolls back. Failed phases emit `status: failed` entries and retries emit fresh ones: entries are append-only, never rewritten.

## Stage walkthroughs

### Epic precheck (inline, before Stage 1)

Confirm the parent epic has its macro artifacts: `feature-test-plan.md` (from product-management or shift-left) and `feature-implementation-plan.md` (the macro tech plan). If either is missing, say so and offer (a) to generate it through `references/feature-plan.md` or hand off to `/product-management`, or (b) to proceed without. The user picks; with nobody to ask, proceed without and record the gap as a `missing_input` in the Stage 1 plan. It runs on `jira`; on `github` and `none` skip it and say so in the plan.

### Stage 1: Planning

A feature spanning 3 or more stories merits a macro `feature-plan.md` first. Otherwise go straight to `story-plan.md`. The two templates are `references/feature-plan.md` (epic level, several stories) and `references/story-plan.md` (single story, the usual starting point).

The story-level plan maps every Acceptance Test Plan test case to an implementation step, so read the ATP in detail first. The read depends on the TMS modality:

- **jira-native**: the ATP is the Story field `{{jira.acceptance_test_plan}}`. Run `bun run jira:sync-issues get <STORY_KEY> --include-comments`, then read the synced `.context/PBI/epics/EPIC-<KEY>-<slug>/stories/STORY-<KEY>-<slug>/acceptance-test-plan.md`, and `comments.md` for inline "Test Case", "TC-" or "Scenario:" notes.
- **jira-xray**: the ATP is the Test Plan issue `description`. Run `bun run jira:sync-issues get <ATP_KEY>` (the sync supports Test Plan and Test Execution types), then read the synced `.context/PBI/.../test-plans/TESTPLAN-<KEY>-<slug>.md`. Per-TC run results come through xray-cli.

The discovery order is: sync `<STORY>` or `<ATP_KEY>`, then the synced `acceptance-test-plan.md` (or `test-plans/TESTPLAN-<KEY>-<slug>.md`), then as a last fallback `comments.md` or the issue description, where the `## Acceptance Test Plan` fallback comment lands when the custom field is absent. Never read the ATP custom field through `[ISSUE_TRACKER_TOOL]` `view`: the synced file is the source.

**Test seams.** Name them in the plan's `## Technical Decisions`: the few points where the story will be tested, preferring seams the codebase already has and the highest one that works. The plan author, a person or the agent, picks them, nobody confirms them, and the plan carries the choice (record it in `progress.md` too).

**RPC authorization gate (fail-closed).** If the story writes or changes a Postgres function that takes a caller-supplied identity or scope parameter (`p_actor_user_id`, `p_workspace_id` or similar), the plan's `## Technical Decisions` must answer the six questions in `references/rpc-authorization.md` §4 (does it need `SECURITY DEFINER` at all, can the identity parameter be deleted instead of guarded, where does the actor bind sit, what scopes each returned row). A DEFINER function with such a parameter and no recorded answer blocks Stage 2. The answer belongs in planning because code written first reads as correct either way, so this is a planning gate and not a review checklist item.

**ADR promotion (inline).** Story-local technical decisions stay in the plan's `## Technical Decisions`. A decision that passes the three-gate test (hard to reverse, surprising without context, a real trade-off, after the architectural-scope screen) is promoted to a standalone `ADR-NNNN-<slug>.md` in `.context/ADR/` before coding, and the plan keeps a `See ADR-NNNN` backlink. Detection and authoring: `agentic-dev-core/references/adr-doctrine.md`. Template, lifecycle and index: `.context/ADR/README.md`. A decision the human already approved (an approved plan, a chat answer, a decision deck) is written `Accepted` and cites the approval, and only a still-open one is `Proposed`. Architectural rework found in a Stage 3 review loops back here to record or supersede the ADR.

**Output.** The plan is authored in-session, then pushed to the Jira `spec_implementation_plan` field (story level) or `feature_implementation_plan` field (epic level) through `[ISSUE_TRACKER_TOOL]`. If the field is absent, a `## Spec Implementation Plan (Dev)` or `## Feature Implementation Plan (Dev)` fallback comment per `.agents/jira-required.yaml` takes its place. Then run `bun run jira:sync-issues get <KEY> --include-comments` and read the materialized `implementation-plan.md` or `feature-implementation-plan.md` under the synced PBI tree (a read-only cache). Transition Jira `Ready For Dev -> In Progress` (`start_working`; read the assignee before and after, and follow the fallback protocol for an unmapped slug, per `agentic-dev-core/references/artifact-lifecycle.md` §2 and §4).

**Output on `github` and `none`.** Write the plan to the trail `plan.md` from `templates/trail/plan.md`, with the AC copied from the issue checklist (`github`) or written there (`none`); there is no ATP read. On `github`, confirm the issue's milestone or ask which release the change goes into (open releases, "new release", or the owner's "unplanned"; `/github-projects` owns the write), record it in `metadata.yml`, commit the trail, post one issue comment linking `plan.md` after its first push, and move the card to `in_progress` with a read-back (`agentic-dev-core/references/artifact-lifecycle.md` §6).

**Sprint report.** In batch mode, update this ticket's in-flight row: Status PENDING to IN_PROGRESS, and fill Owner, Path (A or B), Impl Plan link and Review Size from the Review Size Forecast block (`references/sprint-report.md` §Part 2).

**Persistence.** The canonical story plan lives in the Jira `spec_implementation_plan` field, and the sync materializes it to `.context/PBI/epics/EPIC-<KEY>-<slug>/stories/STORY-<KEY>-<slug>/implementation-plan.md` with topic_key `pbi/{ticket}/implementation-plan`. Macro plans live in the `feature_implementation_plan` field and land in `feature-implementation-plan.md` with topic_key `pbi/{epic}/feature-implementation-plan`. Both are auto-generated, so `capture_prompt: false` (`agentic-dev-core/references/topic-key-conventions.md`).

#### Review Size Forecast (required output of Stage 1)

After the plan is authored, the planner emits a forecast block at the bottom of the plan body (so it lands in the Jira `spec_implementation_plan` field and the synced `implementation-plan.md`; on `github`/`none`, at the bottom of the trail `plan.md`) and in the orchestrator's turn summary:

```
## Review Size Forecast

Estimated: <X> additions + <Y> deletions = <Z> total lines
Review Size (400-line budget): Low | Medium | High
Chain strategy: stacked-to-main | feature-branch-chain | size-exception | pending
Decision trace: <verbatim Q1/Q2/Q3 answers + resolved leaf, or "n/a (Review Size not High)">
Decided by: </git-flow-master §Chained-PR decision tree | n/a>
Decision needed before apply: Yes | No
```

The algorithm (per-file multipliers, a 20% test and docs buffer), the thresholds (`<200` Low, `200-400` Medium, `>400` High) and the chain-strategy options are in `references/review-size-forecast.md`. A `High` AI Effort story that the dev splits into stacked small PRs gets one forecast per PR slice, and the chain decision covers the stack.

The planner emits and never decides: with `Review Size = High` it writes `Chain strategy: pending` and leaves `Decision trace:` empty, because picking a strategy is `/git-flow-master`'s job. The orchestrator enforces the gate at the Stage 1 to Stage 2 boundary and fails closed, treating a strategy with a missing, empty or malformed `Decision trace` as `pending`. A gate keyed on a field its own agent writes is otherwise switched off by a plausible label (`agentic-dev-core/references/orchestration-doctrine.md`, "Gate design").

### Live-UI validation (flow-aware, `/playwright-cli` sessions)

A UI story is validated against the running app, never against a static read of the mockup plus green lint, types and tests, because those stay green while the rendered UI is wrong. The binding rules (identity, no login bypass, session hygiene, the browser path, browser evidence at the gate) are in Compact Rules. The mechanics are in `references/live-ui-validation.md` and `references/live-ui-identity.md`. This section says when and where the validation runs.

- **Where.** It runs wherever the active flow runs: inside the stage subagent that owns the work when Orchestrated, inline when Solo. `[AUTOMATION_TOOL]` resolves to `/playwright-cli` (`.agents/instructions/agent-tool-resolution.md` §6), which is not session-bound, so both flows behave the same. Sessions are named (`-s=<KEY>`), in memory and headless (`.playwright/cli.config.json`) and log in through the app's own form with `--raw fill` (`references/live-ui-validation.md` §1, §3).
- **When.** In Stage 2, open the running dev server while building UI and check in real time that it renders correctly against the live UI and the design system. In Stage 3, run a final live-render pass over the story's screens (loading, empty and error states, responsive layout, the AC's interactive flows) before merge.
- **Against what.** The current live app and design system, not pixel match to the mockup (LIVE-UI-FIRST, Critical Rule #14). Inspect and reuse the existing live components first.
- **Which tier.** Tier 0, an authenticated HTTP probe through `[API_TOOL]` (log in through the app's own endpoint as the declared identity, keep the session in the scratch dir, delete it before reporting), covers route reachability, auth redirects, server-rendered content, data correctness in markup and quick regression re-checks. It cannot judge layout, computed tokens, client-rendered loading, empty and error states, breakpoints, interactive AC flows or screenshots. It may carry the Stage 2 inner loop, but the Stage 3 final pass on a UI story is always browser-based (`references/live-ui-validation.md` §7).

Validate against the running dev server (`{{stack.package_manager}} run {{stack.scripts.dev}}` from `{{stack.app_root}}`; confirm the name in the app's `package.json`), never a production build. A UI story cannot reach merge with an open, unratified live-UI gap: fix it right away (a fix subagent when Orchestrated, inline when Solo) and validate again. Non-UI stories skip all of this.

**Dispatch requirement.** When live-UI work is delegated, component 7 (Rules) of the briefing carries the resolved identity by variable name, the prohibition list, the hygiene contract and the browser-session rules (named in-memory session, `--raw fill`, close and `playwright-cli list` before reporting). A subagent does not read `references/` on its own, so a rule left out of the briefing is absent (`agentic-dev-core/references/orchestration-doctrine.md`, "Rule reachability").

### Stage 2: Implementation

**Gate (review size forecast), fail-closed.** Stage 2 does not start while the Stage 1 forecast reports `Review Size = High` and the chain decision is unresolved. Unresolved means `chain_strategy=pending`, or a `chain_strategy` whose `Decision trace:` is missing, empty or does not name the tree answers that produced it. Check the trace itself before opening the gate, because a bare label proves nothing.

To resolve it, hand off to `/git-flow-master` (Step 4, the chained-PR decision tree and a concrete branch plan), which returns the strategy with its `Decision trace:` and `Decided by:` lines. Update the forecast block in the Jira `spec_implementation_plan` field, re-sync (`bun run jira:sync-issues get <KEY>`) so the synced `implementation-plan.md` shows it (on `github`/`none`, update the block in the trail `plan.md`), and go on. Gate behavior in full: `references/review-size-forecast.md`.

Pick the entry point by ticket type:

- A new story: `references/implement-story.md` (main flow). Walk the implementation plan step by step.
- A bug fix: `references/bug-fix-workflow.md` (root cause first, reproduce, fix, regression check). When the cause is not obvious from the report, or the bug reproduces only sometimes, `Call the Skill tool with "diagnosing-bugs"` and follow it through all six phases, then fix the bug yourself, since that skill's diagnosis stops short of the fix. Without the skill, write down the failing command before forming a hypothesis and say once that the diagnosis method was not available. With nobody present, `references/bug-fix-workflow.md` Phase 2 holds the unattended path. Root-cause notes are dev-authored (non-Jira) and persist at `.session/sprint-development/<JIRA-KEY>/bug-fix.md` (session working state at `<<PRIMARY_ROOT>>`, beside `progress.md`; never under the gitignored `.context/PBI/` cache, `.agents/instructions/agent-local-context-pbi.md` §9) with topic_key `pbi/{ticket}/bug-fix` (`agentic-dev-core/references/topic-key-conventions.md`).
- Resuming after an interruption: `references/continue-implementation.md` (re-orient, find the last completed step, resume).
- PR feedback, lint or CI red: `references/fix-issues.md` (address comments without rewriting history).

Read inline for style and standards. They are defaults for an app that has none of its own, and the app's own convention wins (`## Stack parameters`, "Existing conventions win"):

- `references/code-standards.md`: TS patterns, imports, error handling.
- `references/error-handling.md`: public-method fail-fast versus utility silent-fail.
- `references/data-testid-standards.md`: naming and placement of test ids.

Verification runs in parallel at cap=3: the app's `lint`, `types` and `test` scripts (`## Stack parameters`; a null role is skipped and reported, never replaced by an invented command). Each subagent reports red or green and the orchestrator iterates only on red. Commit atomically, one commit per logical step, never one giant dump.

**Live-UI check while building (UI stories).** In the active flow mode (a subagent when Orchestrated, inline when Solo), open the running dev server through `[AUTOMATION_TOOL]` and confirm what you build renders correctly against the live UI and design system as you code, not after.

**Tests.** If the work needs TDD on a specific function, hand off to `/unit-testing` mid-implementation, and come back to Stage 2 once the unit is green. Hand it the seams the Stage 1 plan named: no test is written at a seam the plan did not name, and when the code turns out to need a seam the plan lacks, add it to the plan first.

### Stage 3: Code Review

Push the feature branch and open the PR through `/git-flow-master`. It reads the project's branching strategy from `git_strategy` (the base is the integration branch, or the production branch when `git_strategy.branches.integration` is null) and uses the title format `feat({{PROJECT_KEY}}-N): <short>`. The PR body carries a Merge danger section: whether the merge is a one-way door (a migration, deleted data, a published contract) or a two-way door (cheap to roll back), and the blast radius in a few words. For a diff you do not trust to be contained, `Call the Skill tool with "blast-radius"` first and use its key fact. Without it, size the blast radius by hand from the callers of the touched code and say it was not proven by running code. Back the "it works" claim with the heaviest evidence available: before and after screenshots for UI, the exact test that failed and now passes for logic, console output last.

A Jira automation rule should move the ticket `In Progress -> In Review` within about 30 seconds of the PR opening. If it does not, fire `pull_request` yourself (tech items: `ready`) and surface the gap (`agentic-dev-core/references/artifact-lifecycle.md` §3). On `github`, no automation moves the card: set `in_review` yourself and read it back (`artifact-lifecycle.md` §6).

**Sprint report.** Update the row: Status IN_PROGRESS to IN_REVIEW, the PR number, and the Delivery Strategy from the chain decision in the plan's forecast block.

Review checklist (driven by `references/review-pr.md`):

- Every Acceptance Criterion is covered by a code path.
- Lint and build are green, types clean.
- Conventions: the app's own where it has one (import alias `{{stack.conventions.import_alias}}`, structure, test ids, never renamed), `references/code-standards.md` where it has none (parameter limits and the like).
- Security: no secrets in the diff, auth handled, input validated.
- RPC authorization, when the diff touches database migrations. For every function taking a caller-supplied identity or scope parameter, confirm separately that (a) an actor bind sits at step 0, before any table read, (b) every returned row is explicitly scoped to the asserted boundary and (c) a DB-integration test attempts the spoof against the real database. Challenge whether `SECURITY DEFINER` was needed at all, and treat a missing bind as a BLOCKER, not a MAJOR (`references/rpc-authorization.md`).
- UI/UX fidelity, where it applies: the story's screen matches `DESIGN.md` tokens plus the per-screen spec in `.context/design/master-design-plan.md` when the project keeps one. The fidelity reference is the live UI plus the `DESIGN.md` tokens (Critical Rule #14), so an unratified divergence from them is a defect, and following the improved live UI where the mockup differs is not.

**Live-render verification pass (UI stories).** Before approving, run the final live-UI validation over the story's screens (loading, empty and error states, responsive layout, the AC's interactive flows) in the active flow mode through `[AUTOMATION_TOOL]`. A UI story with an open, unratified live-UI gap cannot be approved: fix it and validate again, always against the current live app and never a production build.

Review notes are dev-authored (non-Jira) and persist at `.session/sprint-development/<JIRA-KEY>/review.md` (session working state, beside `progress.md`) with topic_key `pbi/{ticket}/review`. Auto-generated summaries use `capture_prompt: false`, and human-prompted architectural decisions use `capture_prompt: true` (`agentic-dev-core/references/topic-key-conventions.md`).

**Adversarial review and adjudication (orchestrator-owned).** Review runs on two axes, each by its own reviewer in a fresh context with no stake in the implementation. The Spec reviewer reads the diff, the story, its acceptance criteria and the plan, and reports missing or partial criteria, work nobody asked for, and code that looks like it meets a criterion but does something else. The Standards reviewer reads the diff, `references/code-standards.md` and the review checklist, and not the acceptance criteria. Both tag findings with their axis and a severity (`BLOCKER | MAJOR | MINOR | NIT`) with `file:line` evidence, and both propose without applying; do not merge or rerank the two reports, since the verdict counts blockers from both. The orchestrator then adjudicates every finding against the actual diff and AC: `legitimate` (apply) or `false-positive` (dismiss with a one-line reason), recorded per finding in `review.md`. Only `legitimate` findings loop back to Stage 2 through `fix-issues.md`, which prevents both rubber-stamping and churning on reviewer noise. The two briefs, the lying-tests check on new tests, the Solo order and the adjudication contract are in `references/review-pr.md`, `## Two-axis review`. Architectural rework loops back to Stage 1 with a new spec (rare).

**Glossary check.** If the story introduced new domain terms or exposed an ambiguous or banned term, flag it in the review notes and the PR description so the PM adds it to `.context/business/domain-glossary.md` under its change protocol. Implementation never edits the glossary.

**Docs update before merge.** Every doc change the story needs goes inside the same PR branch, never pushed straight to the integration branch. When the story moved a fact the repo docs quote (a skill mode, a script, a path, an MCP, an env var) or changed a behavior a page describes, run the docs follow-through in that branch: `agentic-dev-core/references/docs-follow-through.md`.

Hand-off: `/git-flow-master` for PR creation, merge operations and conflict resolution.

#### Without a feature PR

The PR path is the default and stays the only path on `jira` without a trail. The no-PR path applies only when both hold: (1) the change has a trail (`github`, `none`, or `jira` with `trail.enabled: true`); (2) `git_strategy` takes feature work without a PR, meaning the target branch (integration, or production when integration is null) is absent from `git_strategy.protected` or has `git_strategy.policy.direct_push_to_protected: allowed` with `require_pr_reviews: 0`, with `git_strategy.description` as the tiebreaker. Then Stage 3 reviews the local diff before the push:

1. The two reviewers get the diff command, not a PR: `git diff <base>...HEAD -- . ':(exclude)<trail.dir>'`. Adjudication is unchanged.
2. The Spec Compliance Matrix lives in the trail `results.md`, and its gate holds before the push as it holds before a merge.
3. Push only when the review is green and no row is unjustified `uncovered`, per `git_strategy.policy.direct_push_to_protected`. The `Trail:` trailer and one issue comment link the trail.
4. On `github` the final commit carries `Closes #N` as a footer (`artifact-lifecycle.md` §6); on the PR path the same footer rides the final commit, or the PR body when there is no integration branch.

#### Spec Compliance Matrix (required output of Stage 3)

Once the static review checklist passes, the reviewer or orchestrator generates a Spec Compliance Matrix: one row per AC scenario of the story, mapped to the evidence that proves it works.

```
| AC scenario (Gherkin) | covered_by | evidence | status |
|---|---|---|---|
| <one row per AC scenario from the story> | <type:id> | <link or path> | <status> |
```

`covered_by` takes `test:<id>`, `manual:<evidence-path>`, `exempt:<reason>` or `review-approved:<reviewer>`. Status is one of `covered`, `manual`, `exempt`, `review-approved`, `uncovered`.

**Gate.** The PR cannot merge while any row is `uncovered` without justification. Resolve it by adding a test, adding manual evidence or reclassifying to `exempt:<specific reason>` (a vague reason is rejected). A scenario that truly cannot be verified sends the story back to Stage 1 to re-spec the AC.

The algorithm, the four `covered_by` shapes with examples, the full status legend, the 2FA-login worked example and persistence are in `references/spec-compliance-matrix.md`. The matrix that gates the merge is the copy published in the PR body, durable and visible to reviewers, and the merge gate reads it there. The working copy at `.session/sprint-development/<JIRA-KEY>/compliance-matrix.md` (topic_key `pbi/{ticket}/compliance-matrix`) is scratch. With a trail, `results.md` holds the durable copy and the PR body embeds it through `<<TRAIL>>` (`git-flow-master/references/pr-templating.md`).

### Stage 4: Staging Deploy

Merge the PR into the integration branch (`git_strategy.branches.integration`) with the method `git_strategy.decisions.feature_merge` names, through `/git-flow-master`. With nobody present, a fleet worker stops at its open PR, and a routine merges only when the delegating brief covers it. When the integration branch is `null` (`solo-main`, `github-flow`, `trunk-based`) there is no integration merge: Stage 4 verifies the PR branch's Vercel Preview deployment, and the merge to `git_strategy.branches.production` is Stage 5 (`references/staging-deploy.md`). CI runs end to end, and when it is green the staging environment auto-deploys per the project's CI/CD setup (first-time setup: `references/ci-cd-setup.md`). A Jira automation rule should move the ticket `In Review -> Ready For QA` within about 30 seconds. If it does not, fire `deployed` (bugs: `fixed_and_deployed`; tech items with no QA scope: `complete`) and surface the gap (`agentic-dev-core/references/artifact-lifecycle.md` §1, §3). Without a feature PR there is nothing to merge: Stage 4 starts at the staging deploy check for the pushed SHA. On `github`, set `on_staging` once that deploy reads READY and read it back, post one issue comment with the PR or SHA, the staging URL and the trail link, and close `results.md` and `metadata.yml`; the QA notification, DTU, assignee and defect loop below are `jira` only.

Read for guidance:

- `references/staging-deploy.md`: staging deploy steps.
- `references/ci-cd-setup.md`: first-time CI setup, once per project.
- `references/environment-config.md`: env vars per environment, with `.env` as the source of truth.

After the deploy, post a QA notification comment on the ticket with the PR URL, the branch name and an `@`-mention of the QA owner who did the Shift-Left.

**Development Token Usage (optional audit aid, cumulative).** The write is tied to the verified `{{jira.status.story.ready_for_qa}}` state (the status read back after the move), not to the `deployed` automation having fired, and repeats after each fix loop that returns the story to Ready For QA. Read `{{jira.development_token_usage}}` from the synced story, sum this cycle's measured tokens from the `progress.md` entries (each session appends `tokens: <n> K, source=<harness|human|unknown>`), write current plus delta (an empty current value takes just the delta), and post `DTU cycle N: +x K (total y K) source=<harness or human>`. The comment carries the figure when the field is absent from `.agents/jira-fields.json`. With no measured figure, leave DTU empty and let the stage verifier say N/A with that reason, as Compact Rules say. An item that never reaches Ready For QA (a tech item that goes straight to `completed`) states N/A too.

#### Hand-off to QA: assignee and notification (mandatory at Ready For QA)

The native `assignee` follows the dev model. At Ready For QA (merged and deployed, status read back), move it to the QA named in `{{jira.qa_assignee}}`, read from the synced story, and read `assignee` back to prove the change. When the field is empty (a story with no shift-left phase), leave `assignee` as it is, never guess a QA from the comments, and say so in the QA notification comment.

Two assignment gotchas, both seen live:

- The tracker's merge automation tends to assign the merged story to the developer, so the dev has to move it to the QA explicitly. The default is wrong.
- Assigning through `[ISSUE_TRACKER_TOOL]` with a raw `712020:`-prefixed accountId can silently unassign: some CLI paths report success while clearing the field. Prefer the Atlassian MCP `editJiraIssue` (`fields.assignee.accountId`) and verify that the assignee actually changed. The exact CLI syntax lives in the `/acli` skill.

The QA notification comment carries the PR URL, the branch, the staging URL, the DTU cycle line (or its N/A), the AI Effort note when it was `High` or unset, and an `@`-mention of the `{{jira.qa_assignee}}` QA.

#### Defect loop: the story is in `blocked`

QA's `defect_reported` moves the story from `in_test` to `blocked` while a Defect is open. The dev then:

1. Reads the Defect and the story, and fires `fix_defect` (`blocked` to `in_progress`) on the Story (`agentic-dev-core/references/artifact-lifecycle.md` §1.1).
2. Fixes through `references/bug-fix-workflow.md`, then runs Stages 2 and 3 as usual.
3. Re-delivers the story to Ready For QA (`pushed` from `in_progress`, or `pull_request` then `deployed`), reads the status back, moves `assignee` to the QA again and writes the next DTU cycle.

`back_to_dev` (`blocked` to `ready_for_dev`) exists in the catalog for a story that has to return to the dev queue before work resumes, and no stage fires it on its own. `back_from_blocked` (`blocked` to `in_test`) is QA's.

Sync the integration branch locally (`git pull origin <integration>`, the name from `git_strategy.branches.integration`) and clean up the merged branch. Then wait for the user to name the next ticket. With nobody present, stop and report, because the next ticket comes from the conductor or the brief.

**Sprint report.** Status IN_REVIEW to MERGED once the squash-merge lands, then MERGED to STAGING_DEPLOYED after the CI smoke passes. Move the row to "Done: This Sprint" once Jira reaches Ready For QA, and append a Session Log entry with date, ticket and transition.

**Hand-off.** QA verification on staging is out of scope here: a separate QA workflow picks up from `Ready For QA`.

When Stage 4 completes (Jira at `Ready For QA` and the staging smoke passed; on `github` the card at `on_staging`), the orchestrator archives per `agentic-dev-core/references/session-management.md` §8: it moves `.session/sprint-development/<JIRA-KEY>/` to `.session/.archive/<YYYY-MM-DD>-sprint-development-<JIRA-KEY>/` and calls `mem_session_summary` with the archive path, so a later `mem_search "session sprint-development <JIRA-KEY>"` finds it. Stage 5 is a separate event: when it runs later, Phase 0 reopens the archived session by recreating `.session/sprint-development/<JIRA-KEY>/progress.md` and appends the Stage 5 entries on top of the archived progress (or the user starts fresh and links forward).

### Stage 5: Production Deploy (optional, gated)

Proceed only after QA is green on staging and the business has explicitly approved. This is a separate, gated event and Stage 4 never chains into it. With nobody present it runs only when the delegating brief names that ticket and that deploy (`## Subagent Dispatch Strategy`). Where no QA workflow exists (`github`, `none`), the owner's explicit approval stands for both. On `github`, after the release reaches the production branch, run the release close-out (`bun run github:releases:sync --close-out <slug>`, through `/github-projects`), which reads back that every issue is closed and Released.

Read for guidance:

- `references/pre-deploy-checklist.md`: go or no-go checks (DB migrations, env vars, feature flags, comms).
- `references/production-deploy.md`: deploy steps and the monitoring window.
- `references/rollback-plan.md`: the runbook if KPIs go red after the deploy.

Dispatch is Single + Background: one subagent runs the deploy and a background monitor watches the health window. The orchestrator stays on the line for at least the rollback decision window before declaring success.

**Sprint report.** On a successful prod deploy, Status STAGING_DEPLOYED to PROD_DEPLOYED. On a rollback, Status to BLOCKED with a Blocking note pointing at the rollback runbook entry. Stage 5 never runs in batch mode, only as a per-ticket manual invocation.

---

## Decision tree

- New story: Stage 1 (`story-plan.md`). New feature (3 or more stories): Stage 1 macro (`feature-plan.md`), then Stages 1 and 2 per story.
- Bug: Stage 2 directly with `bug-fix-workflow.md` (root cause first; the Stage 1 plan is optional and lightweight). Interrupted work: `continue-implementation.md`, reusing the existing plan.
- Review green: Stage 4. Comments to address: back to Stage 2 through `fix-issues.md`. Architectural rework: back to Stage 1 with a new spec.
- Story `blocked` after `defect_reported`: the defect loop in Stage 4.
- Smoke green: hand off to QA (out of scope here). Smoke red: back to Stage 2 with `bug-fix-workflow.md` or `fix-issues.md`.
- Production is optional, and only after QA green plus business approval. If deploy KPIs go red, run `rollback-plan.md` inline and start no new feature until the rollback is done.

---

## Specific tasks: which reference to read

| User intent                                          | Read                                    |
| ---------------------------------------------------- | --------------------------------------- |
| "plan this feature (epic-level)"                     | `references/feature-plan.md`            |
| "plan this story"                                    | `references/story-plan.md`              |
| "record an ADR" / "promote this to an architecture decision" | `agentic-dev-core/references/adr-doctrine.md` + `.context/ADR/README.md` |
| "implement this story"                               | `references/implement-story.md`         |
| "fix this bug"                                       | `references/bug-fix-workflow.md`        |
| "continue where I left off"                          | `references/continue-implementation.md` |
| "address PR feedback"                                | `references/fix-issues.md`              |
| "code style / TS patterns"                           | `references/code-standards.md`          |
| "error handling pattern"                             | `references/error-handling.md`          |
| "data-testid naming / placement"                     | `references/data-testid-standards.md`   |
| "review this PR"                                     | `references/review-pr.md`               |
| "setup eslint+prettier+typecheck for the first time" | `references/setup-linting.md`           |
| "setup CI (first time)"                              | `references/ci-cd-setup.md`             |
| "change the schema" / "add a migration" / "RLS policy" | `agentic-dev-core/references/db-change-doctrine.md`        |
| "deploy to staging"                                  | `references/staging-deploy.md`          |
| "configure env vars"                                 | `references/environment-config.md`      |
| "pre-deploy-to-prod checklist"                       | `references/pre-deploy-checklist.md`    |
| "deploy to production"                               | `references/production-deploy.md`       |
| "rollback production deploy"                         | `references/rollback-plan.md`           |
| "process sprint N" / "continue sprint"               | `references/sprint-report.md`           |
| "parallelize the sprint" / "one session per story"   | `references/fleet-mode.md` (the HOW: `/agent-orchestration`) |

---

## Hand-offs

### Project-owned (T1)

- TDD on a function: `/unit-testing`, composable mid-implementation.
- PR creation, merge, branch operations, conflict resolution and chained-PR planning: `/git-flow-master`.
- A backlog item that is missing or has unclear AC: `/product-management` on `jira`, `/github-projects` on `github` (refine first, then come back).
- Issues, card moves and release milestones on `github`: `/github-projects`.
- Missing foundation or infrastructure: `/project-foundation` or `/project-bootstrap`.

### Composable category matches (T3/T4, auto-discovered; ask if T4)

See `complementary_categories` in this skill's frontmatter. Discovery and threshold rules: `agentic-dev-core/references/skill-composition-strategy.md` §3.

### Out of scope

QA verification on staging: a separate QA workflow picks up from `Ready For QA`.

If the prerequisite check at the top of this skill fails (no `.agents/project.yaml`, no story, no AC), stop and hand off instead of continuing.

---

## Pseudocode tags used here

| Tag                    | Resolves to                                       | Defined in                  |
| ---------------------- | ------------------------------------------------- | --------------------------- |
| `[ISSUE_TRACKER_TOOL]` | `acli`, Atlassian MCP, or `{{ISSUE_TRACKER_CLI}}` on `jira`; `gh` through `/github-projects` on `github`; no call on `none` | `AGENTS.md` Tool Resolution |
| `[DB_TOOL]`            | capability `db` (Supabase MCP; DBHub if the project adds it); raw SQL only when the user chooses it. Needed only by a story that touches the database; how a change is applied per `{{stack.database.migrations_tool}}`: `agentic-dev-core/references/db-change-doctrine.md` | `AGENTS.md` Tool Resolution |
| `[API_TOOL]`           | OpenAPI MCP, Postman, or `curl`                   | `AGENTS.md` Tool Resolution |
| `[AUTOMATION_TOOL]`    | Playwright CLI (`/playwright-cli`), the only browser path | `AGENTS.md` Tool Resolution |
| `[ORCHESTRATION_TOOL]` | the multi-session orchestration layer, used only in fleet mode (batch-sprint, N>1 executors); when the gate fails, the `launch.txt` fallback, which never names it | `/agent-orchestration` (user level, the tool owner; this skill names verbs, never commands) |

Concrete tools (`bun`, `git`, `gh`) are used literally. Project variables resolve from `.agents/project.yaml`, and env-scoped ones resolve to the active environment.

---

## Variables consumed

- `{{PROJECT_KEY}}`, `{{ISSUE_TRACKER}}`, `{{ATLASSIAN_URL}}`: the issue tracker.
- `{{WEB_URL}}`, `{{API_URL}}`: env-scoped, the active environment from `.agents/project.yaml`.
- `{{BACKEND_STACK}}`, `{{FRONTEND_STACK}}`, `{{DB_TYPE}}`: stack-specific patterns.
- `{{stack.<path>}}`: the app's root, script names, database, CI, hosting and conventions (`## Stack parameters`).
- `{{jira.*}}`: story custom fields (acceptance_criteria, business_rules, acceptance_test_plan and the rest), `jira` only.
- `issue_tracker.github.*`, `trail.*`: read by path from `.agents/project.yaml`, not as template variables.

If a required variable is unset, make sure `.agents/project.yaml` exists. When it does not, the agentic layer is not installed: run `bunx create-agentic-dev@latest <name>` for a new project, or `bunx create-agentic-dev@latest --adopt` then `/project-adoption` for an existing app (`agentic-dev-core`, Install model). Then fill the missing values with `/project-foundation` on a new project, or `/project-adoption` on an adopted app (its `stack:` block and identity).

---

## Gotchas and anti-patterns

The identity, session-hygiene, browser, RPC, forecast-gate, AI Effort, DTU, assignee, live-status, tracker-slug, plan-first, verification, attribution and docs rules are in Compact Rules and are not repeated here. These are the rest, each with the reason it exists.

1. **Credentials come from `.env`, by variable name.** Never hardcode one, guess a password, or commit credentials, secrets or `.env` content, in code, plans or commit messages alike. Anything that logs into the running app uses the declared automation identity (`references/live-ui-identity.md`).
2. **A story is done only when tests, types and lint are green** (parallel cap=3, no more verifiers). "I will fix the lint after merge" is not accepted, and a failing pre-commit or pre-push hook is fixed in a separate commit, never silenced with `--no-verify`.
3. **Code review is not optional** for a PR that touches production behavior. The review checklist and the Spec Compliance Matrix gate the merge.
4. **Pushing to a protected branch resolves `git_strategy.policy.direct_push_to_protected`** (Critical Rule #4, mechanics in `/git-flow-master` §3.3). The PR flow targets the integration branch (the production branch when it is null), and production promotion is the separate gated Stage 5. Never force-push, amend or rewrite history on pushed commits in shared branches (the production and integration branches, any branch with an open PR).
5. **Verify the Jira automation.** After the PR opens and after the merge, wait about 30 seconds and check that the auto-transition fired. If it did not, fire the mapped slug and surface the gap. A slug the catalog lacks follows the unmapped-status fallback in `agentic-dev-core/references/artifact-lifecycle.md` §4.
6. **Read the ATP through the sync.** The detailed read is `bun run jira:sync-issues get <STORY_KEY> --include-comments` then the synced `acceptance-test-plan.md` (jira-native), or `bun run jira:sync-issues get <ATP_KEY>` then the synced `test-plans/TESTPLAN-<KEY>-<slug>.md` (jira-xray). The last fallback is `comments.md` or the issue description. Never read the custom field through `[ISSUE_TRACKER_TOOL]` `view`.
7. **Resolve Jira fields as `{{jira.<slug>}}`** against `.agents/jira-required.yaml`. Never hardcode a `customfield_NNNNN` id in a plan, reference or output, because the ids differ per instance.
8. **Stay inside the story's scope.** No "while I am here" refactors: open a separate ticket. No E2E or integration test automation here either: unit tests live in Stage 2 through `/unit-testing`, and anything QA-side is out of scope.
9. **Language.** Artifacts, code and commit messages are in English, and the user's language is mirrored only in conversation.
10. **ADRs are append-only.** A decision that passes the three-gate test in `agentic-dev-core/references/adr-doctrine.md` §1 goes to `.context/ADR/`, and a story-local trade-off stays in the plan. Read the existing ADRs before planning a cross-cutting story so you do not violate one. Never rewrite or delete an ADR to change course: supersede it with a new `ADR-NNNN` that links back, and flip only the old one's `Status` line. Mark an ADR `Accepted` only when a human approved the decision (one the human already took is `Accepted` from the start, citing the approval).
11. **Binding rules travel in the briefing.** A prohibition that lives only in a `references/*.md` never reaches a stage subagent, so restate the identity contract, the prohibition list and the hygiene contract in briefing component 7 for every dispatch that could trip them (`agentic-dev-core/references/orchestration-doctrine.md`, "Rule reachability"). The DTU, assignee and AI Effort pickup rules go into component 7 of every Stage 1 and Stage 4 dispatch, and component 6 asks for `tokens_used` (measured or `unknown`, never estimated). Every report carries `secrets_materialized:` and `cleaned:`, and `cleaned: no` is a blocker surfaced to the user.
12. **Mark Ready For QA only after the staging deploy is verified** (CI green and the smoke passed). A premature transition burns QA cycles.

---

## Pre-flight checklist

- [ ] Pre-requisites green, the Phase 0b live query run, and the stack, execution mode and (for a UI story) automation identity resolved and stated back.
- [ ] Epic precheck done or its gap recorded, and the pickup read noted in the plan.
- [ ] Stage 1 plan pushed, synced and read back, with the test seams named, the ATP mapped into it and Jira at `In Progress`. The forecast gate was honored.
- [ ] Stage 2 verification green with atomic commits. A UI story had live-UI validation, with the Stage 3 final pass done in a browser. Every authenticated dispatch reported `cleaned: yes`.
- [ ] Stage 3 PR opened through `/git-flow-master` with its Merge danger section and the `In Review` transition verified. Findings adjudicated, doc updates in the PR branch.
- [ ] Stage 4 merged (or Preview verified), CI green, Jira at `Ready For QA`, QA notified, the DTU cycle written or N/A, the assignee moved and read back.
- [ ] Sprint report row updated at each transition, and a Session Log entry for any blocking, aborting or sprint-spanning event.
- [ ] On `github`/`none`: the trail holds `metadata.yml`, `plan.md`, `results.md` (and `decisions.json` when the owner answered), the issue has one comment linking it, and every card move was read back.
- [ ] Stage 5 only if it applies: pre-deploy checklist green, rollback plan loaded, monitoring window observed.

---

## Notes

- This skill assumes `/project-foundation`, `/project-bootstrap` and `/product-management` have run, or are not needed for this project. Fast-fail if no story exists, or if neither product-doc set exists (PRD/SRS, or the business maps of an existing app: Pre-requisites).
- Iterate, and do not try to ship through all 5 stages in one pass. Each PR is one Stage 4, and production (Stage 5) is a separate, gated event that business approval triggers.
- Dispatch with the briefing template in `agentic-dev-core/references/briefing-template.md` (multi-file edits, parallel verification, deploy plus monitor and so on). At each stage, re-evaluate Single, Sequential, Parallel or Background for the work shape (`agentic-dev-core/references/dispatch-patterns.md`).
- On any subagent failure, stop, report and present options. Never auto-fix or auto-rollback (`agentic-dev-core/references/orchestration-doctrine.md`).
