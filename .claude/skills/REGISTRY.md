# Skill Registry (auto-generated)

> Generated: `2026-08-22T00:37:10.957Z`
> Generator: `bun scripts/build-skill-registry.ts`
> Protocol: `.claude/skills/agentic-dev-core/references/skill-resolver.md`

This file is the per-session compact-rules cache for the Skill Resolver protocol.
The orchestrator copies one or more `## Skill: <slug>` blocks below into every subagent briefing under `## Project Standards (auto-resolved)`.
Subagents trust those compact rules and only read the full SKILL.md when explicitly instructed.

Skills indexed: 13

---
## Skill: acli

**Purpose**: Atlassian CLI (official `acli` binary, v1.3+ as of 2026) for Jira Cloud, Confluence Cloud, and org admin tasks from the terminal.

**Compact Rules**:
- **T1.** NEVER hand-author raw ADF JSON for descriptions, comments, or rich-text custom fields. Use `scripts/md-to-adf.ts` — deterministic, diffable, snake_case-safe, and avoids the combined-marks bug (inline `code` co-occurring with `strong`/`em` causes HTTP 400).
- **T2.** NEVER hardcode Jira `customfield_NNNNN` IDs in scripts or AI output that consumes `acli`. Resolve via the host project's slug catalog (see the host repo's `acli-integration.md`). IDs differ per workspace; slugs travel.
- **T3.** NEVER assume `acli` accepts custom-field input on `workitem edit`. It hard-rejects every shape (`additionalAttributes`, `fields`, flat `customfield_X`) with exit 1. Use the REST `PUT /rest/api/3/issue/{KEY}` workaround documented above — there is no acli-native path.
- **T4.** NEVER run a bulk `acli` mutation (transition, edit, comment, link, archive) without first verifying `acli jira auth status`. Silent auth expiry cascades into HTTP 401s mid-loop, leaving the batch half-applied with no clean rollback.
- **`--paginate` is opt-in.** Default limit is server-side (30–50 depending on command). No warning on truncation. If you are counting, iterating, or making decisions based on the result, pass `--paginate`.
- **Custom fields on `workitem create` go through `additionalAttributes` in `--from-json`.** Numeric IDs only (`customfield_NNNN`), no name-addressing. Documented value shapes in the `create` template are: `{"value": "..."}` (single-select), bare number, bare string. **`workitem edit` actively REJECTS custom-field input — hard error, exit 1, not a silent drop** (empirically confirmed across `additionalAttributes`, `fields`, and flat `customfield_X` shapes). For editing custom-field values on existing items, the **only** working path is REST `PUT /rest/api/3/issue/{KEY}` via `curl` using the session env vars — see the "WORKAROUND" subsection in "Publishing rich text" above, plus `references/gotchas.md` §4 and `references/workitem.md`.
- **`acli` cannot enumerate custom fields.** `acli jira field` only does create/update/delete/cancel-delete. To discover field IDs, use `workitem view --json | jq` against an item that has the field set, or call `GET /rest/api/3/field` directly. There is no in-CLI listing. Host repos typically cache the catalog under `.agents/` and resolve fields by slug — see `<repo-core>/references/acli-integration.md`.
- **Transitions match by status name, not transition ID.** When two transitions lead to the same status with different validators, the CLI picks one and may fail. No `--transition-id` escape hatch exists — fall back to REST if this hits.
- **Trace IDs are the only debug signal.** An `unexpected error, trace id: XXXXXXXX` line is all you get on backend failures. Capture and log the trace ID always; Atlassian Support needs it.
- **`workitem link create` flag names are misleading — `--out` and `--in` are EMPIRICALLY INVERTED relative to Jira's outward/inward semantics.** Running `acli jira workitem link create --out X --in Y --type Dependencies` produces "**Y** depends on **X**" — NOT "X depends on Y" as the flag names suggest. Y becomes the outward party (the one that performs the outward verb, e.g. "depends on" / "blocks" / "causes"); X becomes the inward party. Confirmed empirically against Dependencies; the same inversion applies to ALL outward-asymmetric link types (Blocks, Blocking, Causes, Duplicate, Cloners, Defect, Test, Test Automation, Test Design, Test Execute). Symmetric types (Relates) are immune — direction is lost either way. **Reverse-mapping rule of thumb**: `--out` takes the PREREQUISITE (the inward partner in Jira's UI); `--in` takes the DEPENDENT (the outward partner in Jira's UI). **Mandatory verification after every link create**: run `acli jira workitem link list --key <expected-dependent> --json` and confirm the response shows `outwardIssueKey: <expected-prerequisite>`. If the direction is wrong, delete the link and recreate with swapped flags. Deep recipe + per-type mapping table → `references/workitem.md`.

**Read full SKILL.md when**: the compact rules above are insufficient (e.g. novel scenario, debugging, or the briefing tells you to load the full skill).

> Source: `.claude/skills/acli/SKILL.md` · phase: `unknown` · source: frontmatter `compact_rules` (verbatim)

---

## Skill: agentic-dev-core

**Purpose**: Foundation skill that hosts shared references cited by other workflow skills (briefing template, dispatch patterns, orchestration doctrin...

**Compact Rules**:
- `agentic-dev-core` does not:
- Provide a bootstrap or init action — clone the full repo instead.
- Create or modify any files. It is a passive reference library.
- Create or modify `.context/` files (that belongs to `/agentic-dev-onboard` and `/project-foundation`).
- Generate or scaffold tests, fixtures, or test components (that belongs to `/unit-testing` and test-automation skills).
- Adapt the framework to a specific stack (that belongs to `/project-bootstrap`).
- Sync project-specific facts in `CLAUDE.md` (that belongs to `/sync-ai-memory`).
- Sync OpenAPI / API schemas (that's `bun run api:sync`).
- Run any external command — no `bun install`, no `git`, no `gh`.

**Read full SKILL.md when**: the compact rules above are insufficient (e.g. novel scenario, debugging, or the briefing tells you to load the full skill).

> Source: `.claude/skills/agentic-dev-core/SKILL.md` · phase: `foundation` · source: frontmatter `compact_rules` (verbatim)

---

## Skill: agentic-dev-onboard

**Purpose**: Walks new users through this repo's dev flow — Next.js + Supabase stack, Jira workflow (Ready For Dev → In Progress → In Review → Ready F...

**Compact Rules**:
- Use **Context7** for "how to use X" — official docs, current API
- Use **Tavily** for "how to solve X" — community fixes, troubleshooting
- Use **Atlassian** only as fallback — prefer `/acli` skill (fewer tokens, faster)
- What this skill does NOT do:
- Implement features → use `/sprint-development`
- Write unit tests → use `/unit-testing`
- Refine acceptance criteria → use `/product-management`
- Define a brand-new product → use `/project-foundation`
- Scaffold backend / frontend code → use `/project-bootstrap`
- Generate the in-app `/qa` page + credentials artifact → use `/testability-guide`

**Read full SKILL.md when**: the compact rules above are insufficient (e.g. novel scenario, debugging, or the briefing tells you to load the full skill).

> Source: `.claude/skills/agentic-dev-onboard/SKILL.md` · phase: `foundation` · source: frontmatter `compact_rules` (verbatim)

---

## Skill: autonomous-delivery

**Purpose**: SCHEDULED / UNATTENDED entry point for a delivery run with no human on the line.

**Compact Rules**:
- **Git is the source of truth; the tracker is a hint.** A ticket shipped only when `git merge-base --is-ancestor <mergeCommit> <integration-branch>` succeeds. A status of ready-for-QA, done, or merged proves nothing — merge automation commonly fires on ANY pull request merge, including a chain's internal ones. Never advance a dependency on a status flip.
- **`git fetch` immediately before every ancestor or fast-forward check, unconditionally.** A merge performed through the host's API updates the real ref at once; your remote-tracking ref updates only on the next fetch. "I fetched a few minutes ago" has produced a confident, wrong answer.
- **One lock per mode, never a queue.** A live lock for your mode means another run owns it: exit cleanly with a report. Do not wait, do not queue, do not run anyway. A lock older than `lock_staleness_minutes` is abandoned — reclaim it and log the reclamation.
- **An empty run is a correct outcome.** Nothing genuinely unblocked means stop and say so. Selecting marginal work to avoid an empty report is the failure this phase exists to prevent.
- **Caps are hard: `story` 1 per run, `bug` 3 sequential (each fully closed before the next), `discovery` writes no code.** Every measured story became a multi-thousand-line chain; two do not fit in one run's context.
- **Write the handoff as you go, never at the end.** A run that exhausts its context cannot write up why. Checkpoint after every phase and after every completed slice.
- **When context runs low, push the branch FIRST, then record resume state, then stop.** Unpushed commits in a disposable worktree are the only unrecoverable loss in this system. A clean mid-work handoff is a success; a mid-ticket death with unpushed work is the failure to design against.
- **Applying a schema migration to shared infrastructure is irreversible and hits every concurrent agent.** Under `migrations: confirm` (default) it stops for approval, stating target and additive-vs-destructive. Under `migrations: autonomous` it proceeds for ADDITIVE changes only and still stops for anything that drops, renames, or rewrites a live object. Writing the migration file is always autonomous; applying it is not.
- **Take the migration number from the live ledger immediately before writing the file**, never from a local directory listing. The ledger can be ahead of your branch by a peer's unmerged migration, and behind no file you can list.
- **Read regenerated output before committing it.** Types, clients, and API specs generated from a shared live instance silently absorb a concurrent sibling's unmerged schema. Diff it; strip foreign entries after proving zero consumers.
- **Give every dispatched agent its own worktree.** A background subagent writes into its dispatcher's working directory by default, outlives its dispatcher, and keeps mutating shared state after the dispatcher is gone. Fixing this after `git status` looks wrong is too late.
- **Never rebase a branch a subagent already pushed** — merge the base in instead (`git checkout -B <branch> origin/<branch> && git merge <integration-branch> --no-edit`). Rebasing forces a force-push, which is a history rewrite on pushed work.
- **Green tests are not evidence the feature works.** Fixtures that seed the column the code reads, rather than the column production writes, keep every test green over a dead data path. Require at least one assertion against a real production write path before calling an acceptance criterion covered.
- **Editing a skill's rules does nothing until the registry is regenerated** (`bun run skills:registry`). The registry is what reaches a subagent briefing; a rule that never reached the briefing never reached any executor.
- **Decide technical calls yourself, after searching the record.** Follow `agentic-dev-core/references/decision-protocol.md`: search -> follow if settled -> scored judge panel if genuinely novel -> escalate ONLY product, novel security posture, irreversible, and whatever the operator reserved. Record every autonomous decision where the NEXT run's Phase 1 will find it.
- **Whether a PRODUCT call escalates is per-project config, not a constant.** Read `decision_authority.product` in `.agents/project.yaml`. `escalate` (default, and the correct default) means it stops the run. `decide` means there is no human PO: dispatch a scored decision subagent, publish the ruling to the ticket under a heading naming the deciding profile, resync, and continue — never style it as human sign-off. Categories 2-4 escalate under both settings. Method: `decision-protocol.md` §5.1.

**Read full SKILL.md when**: you are running any phase of a scheduled run, a gate fires, or the briefing tells you to load the full skill.

> Source: `.claude/skills/autonomous-delivery/SKILL.md` · phase: `implementation` · source: frontmatter `compact_rules` (verbatim)

---

## Skill: design-system

**Purpose**: Genera un DESIGN.md (formato Google Labs Apache-2.0) en el root del proyecto antes del scaffolding del frontend.

**Compact Rules**:
- **D1.** NEVER hardcode hex color values, font sizes, or spacing values in component code — they belong in `DESIGN.md` frontmatter tokens and are consumed via Tailwind config / CSS variables.
- **D2.** NEVER bypass `DESIGN.md` when answering "what color is X?" / "what's the spacing scale?" — the file is the source of truth, including for the assistant. Read it, do not guess.
- **D3.** NEVER regenerate `DESIGN.md` from scratch when a surgical rebrand suffices — UPSERT existing tokens, preserve section order, do not lose rationale prose.
- **D4.** NEVER ship a token rename without a migration path for component consumers — silent rename breaks every downstream import + `tailwind.config.js` reference.
- **D5.** NEVER override design tokens inline (`style={{ color: '#fff' }}`, `className="text-[#1A1C1E]"`) in components — the escape hatch becomes the rule and the token system rots.
- **D6.** NEVER let a designer hand off a Figma URL alone — require the exported token JSON or a built `DESIGN.md`; design intent must be machine-readable for downstream scaffolds.
- **D7.** NEVER auto-run the optional screen phase or hand-author screen mockups yourself — the phase is always an explicit user opt-in, and the mockups always come from the external tool: either supplied by the user into `.context/designs/<project>/` (Mode B) or commissioned by the AI through the Open Design MCP and exported there (Mode A — sanctioned delegation, see `references/screen-design-mapping.md` S1). What stays banned is the orchestrating AI writing mockup markup itself.

**Read full SKILL.md when**: the compact rules above are insufficient (e.g. novel scenario, debugging, or the briefing tells you to load the full skill).

> Source: `.claude/skills/design-system/SKILL.md` · phase: `foundation` · source: frontmatter `compact_rules` (verbatim)

---

## Skill: git-flow-master

**Purpose**: End-to-end Git operator for any branching strategy.

**Compact Rules**:
- **Read the repo state first (Step 1).** Never assume branch, upstream, or cleanliness.
- **The strategy comes from `.agents/project.yaml` → `git_strategy`**, read per invocation. Never infer it from a skill example or from another project.
- **`strategy: solo-main` is the shipped DEFAULT, not evidence of a decision.** `meta.strategy_source` is what tells them apart: `inherited` means nobody chose. On a repo whose `project.project_name` is set and whose `strategy_source` is still `inherited`, OFFER Strategy Setup and say what the default costs (no integration branch, no promotion path, no review gate). Strategy Setup stamps `chosen`; nothing else may.
- **`policy:` records INTENT, not enforcement.** Reconcile it by RUNNING `bun run git:policy verify` (Step 1b) at the first push / PR / merge intent, then `--stamp` when clean. Never perform the protection queries by hand and never state what the remote requires from a `declared` reading — say "declared, not verified".
- **Query BOTH GitHub protection mechanisms.** `branches/{b}/protection` (classic) AND `rules/branches/{b}` (rulesets); `git:policy verify` does both. A `404` on the classic endpoint does NOT mean unprotected — rulesets enforce PR requirements invisibly to it. A push that succeeds is not proof a rule is absent: admins bypass rulesets while the rule still binds everyone else.
- **Report drift, never auto-correct it.** A mismatch between `policy:` and host protection is surfaced with both values and three options; editing `.agents/project.yaml` needs the user's choice. Writing the HOST needs it too: `git:policy apply` is a dry run until `--yes`, and refuses outright to remove a guard, lower the approval bar, turn off code-owner review, or widen the merge methods unless `--allow-loosening` is passed for that specific give-up.
- **`require_code_owner_review: true` with no `CODEOWNERS` file is unsatisfiable, not strict.** Nobody outside the bypass list can clear it, so every merge becomes a bypass. Treat that combination as drift with a named remedy: add the file, or turn the flag off.
- **Config examples in `references/` are examples.** Quoting one as a project's real configuration is a defect. Open the project's own file and cite it.
- **The chained-PR decision travels with its trace.** Return `Chain strategy` + `Decision trace` (verbatim tree answers, each with the reason from this change) + `Decided by`. Callers reject a bare label. This skill is the ONLY authority that may fill those lines.
- **Never push to `main` without explicit confirmation**; honour `direct_push_to_protected` on every protected branch.
- **Never** `--force`, `--force-with-lease`, `--no-verify`, amend, or rebase pushed history on a shared branch unless the user explicitly asks AND the branch is unshared.
- **Admin bypass may only be OFFERED when `admin_bypass: true`**, and only after re-confirming at runtime that the operator really is an admin and that they accept the specific irreversible action.
- **Stop at PR creation.** Never auto-merge.
- **One commit = one responsibility**, conventional prefix, no AI-attribution lines (sole scoped exception: the `Claude-Session: <session-id>` forensic trailer on AI-authored commits — `references/conventional-commits.md` § Hard rules).

**Read full SKILL.md when**: running Strategy Setup, resolving conflicts, planning a chain, or when the compact rules above do not settle the operation.

> Source: `.claude/skills/git-flow-master/SKILL.md` · phase: `implementation` · source: frontmatter `compact_rules` (verbatim)

---

## Skill: product-management

**Purpose**: Orchestrates continuous product management work — initial backlog seed from PRD, incremental feature addition, epic creation, story refin...

**Compact Rules**:
- **I1.** NEVER hardcode `customfield_NNNNN` IDs in skill or AI output. Resolve via `{{jira.<slug>}}`.
- **I2.** NEVER prefix story summaries with `FR-XXX —`. Use `**Source spec:** FR-XXX` as the first body line.
- **I3.** NEVER copy AC / Scope / Out-of-Scope content into the description. Those live exclusively in their custom fields.
- **I4.** NEVER let two stories in the same epic share a literal Scope bullet. Surface as `overlap_alert` and ask the user to resolve.
- **I5.** NEVER invent acceptance criteria, scope items, or business rules. Source must be PRD / SRS / business map / explicit user input. If missing → report `gap`, halt that field, continue with the rest.
- **I6.** NEVER batch multiple ADF custom fields in a single MCP update call. Split per field, or pre-convert with `md-to-adf.ts`.
- **I7.** NEVER nest inline `code` inside `**bold**` markdown destined for ADF — the converter combines incompatible marks and Jira rejects HTTP 400.
- **I8.** NEVER create stories without immediately running the dependency-linking phase. Local declarations are not enough; Jira links must exist.
- **I9.** NEVER hardcode `acli`, `mcp__atlassian__`, or REST URL examples in this skill. Use `[ISSUE_TRACKER_TOOL]` pseudo-code. The tool skill owns the syntax.
- **I10.** NEVER use "Wave" terminology. Use "Sprint" (or "Master Sprint" / "Execution Sprint" when ambiguity matters).
- **I11.** NEVER skip sprint-sequencing after creating multiple linked stories.
- **I12.** NEVER hardcode link-type names (`"Dependencies"`, `"Blocks"`, `"Relates"`). Use `{{jira.link_types.<slug>}}`.
- **I13.** NEVER use `Relates` for ordering-sensitive dependencies. Symmetric → direction is lost. Use `Dependencies` (or flag fallback explicitly as degradation).
- **I14.** NEVER ignore cycle detection in sprint-sequencing. A cycle in the `dependencies` graph is a bug — halt and report.
- **I15.** NEVER include implementation surface in `{{jira.acceptance_criteria}}`, `{{jira.scope}}`, `{{jira.out_of_scope}}`, or `{{jira.workflow}}`. Disallowed surface: API/endpoint paths, HTTP status codes, DB table/column names, error-code identifiers (e.g. `VALIDATION_ERROR`), framework or library names, transaction/locking patterns, internal algorithms. Those describe HOW; AC/Scope/Workflow describe WHAT the persona observes/does/receives. Implementation belongs in the impl-plan generated by `/sprint-development`. `{{jira.business_rules_specification}}` tolerates domain rules (boundaries, role gates, retry semantics, audit guarantees) but NOT internal algorithms. **Exception**: when the persona is an API consumer (DevEx, integration agent, headless client), endpoint paths and response shapes ARE part of their observable UX. **Heuristic**: if the criterion stays true after a stack swap → business voice; if a stack swap breaks it → implementation, rewrite.
- **I16.** NEVER populate `{{jira.story_points}}` on create or edit by default. Story Points stay EMPTY unless the user explicitly requests estimation in the current session ("estimate this", "size this story", "story points", or equivalent in the user's language). Rationale: PO/BA role does not estimate; estimation belongs to the team that will build the work (Design + Dev + Test). When opted-in by the user, use Fibonacci (1, 2, 3, 5, 8); 13+ is a smell → split instead.
- **I17.** NEVER write `{{jira.acceptance_criteria}}` as plain text. Every scenario MUST be wrapped in a fenced ```gherkin code block. Applies on initial create AND on every edit/re-format pass. Reason: Jira ADF renders the fenced block as monospaced + syntax-highlighted, which is the only readable shape for Given/When/Then in the Jira UI. When refining EXISTING AC that was written unfenced, rewrite the field in full to apply the fence.
- **I18.** NEVER create or edit a story (or epic) without first running an **active dependency discovery** pass against the current backlog graph (`.context/PBI/epic-tree.md` + live Jira link graph + `.context/business/business-data-map.md` when present). Default state is "no global/infrastructural dependencies surface as story links" — generic prerequisites (auth exists, DB exists, framework is set up) are filtered out as noise. Only feature-level, observable, explicit dependencies become candidate links. Output: a `(from, to, source-of-decision)` matrix surfaced to the user for confirmation BEFORE writing any Jira link. Passive "only link if obviously needed" is rejected — discovery is an active step.
- **I19.** NEVER use generic actors ("the user", "the customer", "the system") in the `As a` line of a user story. The persona MUST resolve to a named entity in `.context/PRD/user-personas.md`. If the matching persona is absent → surface as `gap`, ask the user, never invent.
- **I20.** NEVER write the `As a … I want to … so that …` sentence as the story summary. The summary MUST be `{Feature} | {Action}` (see §Story title format); the full sentence lives ONLY in the description `## User story` section. Persona and benefit NEVER appear in the title. Domain-entity feature prefixes that collide with agile/QA vocabulary carry the `TMS-` (project-domain) tag; cross-cutting features stay plain. Epics keep noun-phrase titles (no pipe, no verb).
- **I21.** NEVER publish Jira content whose domain entity/process/state names diverge from `.context/business/domain-glossary.md`, and NEVER use a term its anti-glossary bans — use the prescribed replacement. A needed term missing from the glossary → surface as `gap` for the PM to add per the glossary's change protocol; never invent terminology mid-story.

**Read full SKILL.md when**: the compact rules above are insufficient (e.g. novel scenario, debugging, or the briefing tells you to load the full skill).

> Source: `.claude/skills/product-management/SKILL.md` · phase: `management` · source: frontmatter `compact_rules` (verbatim)

---

## Skill: project-bootstrap

**Purpose**: Scaffolds the technical infrastructure of a new project: backend (DB schemas, API base, types, error handling), frontend (design system,...

**Compact Rules**:
- **B1.** NEVER collapse the scaffold architecture layers (`api/` / `schemas/` / `db/` boundaries in backend, design-system structure in frontend). That structure is framework architecture, not speculative abstraction — CLAUDE.md §2 SIMPLICITY FIRST exempts it.
- **B2.** NEVER skip env-var validation (Zod or equivalent schema check at boot). Silent missing env vars cause cryptic prod failures far from the root cause.
- **B3.** NEVER clobber existing scaffolding. Detect prior state under `app/`, `lib/`, `db/` and apply UPSERT semantics — patch surgically, preserve user edits.
- **B4.** NEVER hardcode credentials, URLs, or env-specific values in scaffolded code. They belong in `.env` (secrets) + `.agents/project.yaml` (non-secret config).
- **B5.** NEVER scaffold the frontend before `DESIGN.md` exists at repo root. Design tokens are the input contract for Phase 2 — run `/design-system` first.
- **B6.** NEVER skip Supabase types generation when scaffolding the DB layer. Runtime TypeScript types must match the live schema; drift is a silent bug factory.
- **B7.** NEVER ship bearer-token auth without rate-limiting + secret-rotation guidance in the same scaffold. Auth without those two is a half-finished feature.
- **B8.** NEVER scaffold OpenAPI without the Scalar UI route at `/api/docs` (the `@scalar/nextjs-api-reference` route handler). The contract surface must be browsable from day one or downstream consumers won't trust it. Do NOT ship Redoc/Swagger instead — Scalar is the standard for this stack.

**Read full SKILL.md when**: the compact rules above are insufficient (e.g. novel scenario, debugging, or the briefing tells you to load the full skill).

> Source: `.claude/skills/project-bootstrap/SKILL.md` · phase: `foundation` · source: frontmatter `compact_rules` (verbatim)

---

## Skill: project-foundation

**Purpose**: Orchestrates the foundational definition of a new product/project: Constitution (business model + market context), Architecture (PRD + SR...

**Compact Rules**:
- **F1.** NEVER rewrite the project Constitution, PRD, or SRS from scratch when prior versions exist under `.context/`. Always UPSERT — preserve existing decisions, surface diffs, refine in place.
- **F2.** NEVER fabricate user personas, market data, or competitor analysis. If the user has no research, surface the gap as a `[PLACEHOLDER]` open TODO and ask — speculative personas mislead every downstream skill.
- **F3.** NEVER conflate PRD scope with SRS architecture. PRD answers WHAT and WHY (problem, users, journeys, MVP cut); SRS answers HOW (functional contracts, NFRs, tech stack, API definitions). Cross-contamination breaks traceability.
- **F4.** NEVER skip Phase 4 Discovery (`/business-data-map`, `/business-feature-map`, `/business-api-map`, `project-dev-guide`). Downstream skills (`/product-management`, `/sprint-development`) assume those running-mental-model docs exist.
- **F5.** NEVER hardcode tool choices (DB engine, hosting provider, auth vendor, framework) in the Constitution. Tool selection lives in SRS architecture — Constitution stays vendor-agnostic so the SRS can change without invalidating the strategic anchor.
- **F6.** NEVER define personas, problem statements, or KPIs without quoting evidence (user interview, analytics snapshot, stakeholder ask, market data citation). Evidence-free claims look authoritative and mislead the PRD downstream.
- **F7.** NEVER produce a PRD without an explicit out-of-scope section. Implicit scope boundaries always leak; missing out-of-scope is the #1 source of mid-sprint argumentation.
- **F8.** NEVER leave the SRS architecture's hard-to-reverse decisions undocumented. Seed the foundational ones as ADRs in `.context/ADR/` (per `agentic-dev-core/references/adr-doctrine.md`) so later sessions don't re-litigate or silently violate them. Draft as `Proposed`; never mark `Accepted` without human sign-off.

**Read full SKILL.md when**: the compact rules above are insufficient (e.g. novel scenario, debugging, or the briefing tells you to load the full skill).

> Source: `.claude/skills/project-foundation/SKILL.md` · phase: `foundation` · source: frontmatter `compact_rules` (verbatim)

---

## Skill: sprint-development

**Purpose**: Orchestrates the per-story dev loop end-to-end: Planning -> Implementation -> Code Review -> Staging deploy -> (gated) Production deploy.

**Compact Rules**:
- **Automation identity is declared, never chosen.** Log into a running app ONLY as the account named in `.agents/project.yaml` → `testing.automation_identity` (variable NAMES there, values in `.env`). Slot unset or variable missing → STOP and report; never substitute another account, query the DB for one, create one, or reuse the human's browser session. See `references/live-ui-identity.md`.
- **Never bypass the app's own login path.** No service-role / secret / admin keys, no admin user-management APIs (list / create / mutate users), no generated magic or password-reset links, no locally-signed JWTs, no hand-crafted session cookies, no impersonation of any account — including "just to see the admin view". Surface the need as a finding instead.
- **Session material is ephemeral.** Cookie jars, `storageState.json`, token files, `.har` captures: session scratch directory only (never the repo tree), deleted BEFORE reporting, disclosed as `secrets_materialized:` + `cleaned:` in the report. Never echo a credential into a report, plan, commit, PR body, or tracker comment.
- **Live-UI validation is browser-based at the gate.** A UI story cannot be approved on HTTP-probe evidence alone; Tier 0 probes carry the inner loop and non-visual assertions only (`references/live-ui-validation.md` §7). Never validate against a production build.
- **A DEFINER function's `WHERE` clause is not authorization.** `SECURITY DEFINER` bypasses RLS unless the table declares `FORCE ROW LEVEL SECURITY` (verify for your schema; never assume it), so a filter on a caller-supplied identity or scope parameter selects rows — it does not decide who may ask. Writing or changing such a function requires BOTH an actor bind at step 0 (`if auth.uid() is not null and auth.uid() <> p_actor_user_id then raise ... errcode 'P0002'`) AND explicit scoping of every returned row; asserting the caller's own membership does NOT scope the result set. First ask whether `SECURITY INVOKER` — or deleting the identity parameter — removes the class instead. Prove it with a DB-integration test that attempts the spoof against the real database: a mocked `db.rpc` proves nothing. See `references/rpc-authorization.md`.
- **The workload forecast gate is fail-closed.** With `risk = High`, `Chain strategy` is accepted ONLY with a verbatim `Decision trace:` citing the git-flow-master chained-PR tree answers. Missing or malformed trace is treated as `pending` and blocks Stage 2. The planner may only emit `pending` — it never picks a strategy itself.
- **Ticket availability is queried, never read from prose.** Before planning or recommending a ticket, query the tracker live for that ticket and its direct blockers. `.context/dev-roadmap.md` is authoritative for dependency edges and mockup gates, never for current status — a recent timestamp on that file says nothing about a ticket's status today.
- **Config claims cite the file they came from.** Read `.agents/project.yaml` / `package.json` / `.env.example` before asserting what the project is configured to do. Never quote a value from a skill reference or worked example as project state.
- **Technical decisions are yours to make — but read the record before you make one.** Search the run's decision/escalation log, `.context/ADR/`, and the ticket plus its siblings BEFORE deciding OR asking. A decision already made is followed and cited, never re-derived; re-asking a settled question — even to a human, asked cold without the prior ruling in front of them — yields a contradiction, not an override. Genuinely unsettled and technical → decide it yourself via a scored judge panel of 3-5 independent lenses, then record the decision AND its scoring rationale where the next agent's search will find it. Escalate ONLY product/business calls, a novel security posture not already ratified, irreversible or destructive actions, and whatever the operator explicitly reserved. See `agentic-dev-core/references/decision-protocol.md`. **Product calls are the one configurable category**: a project that sets `decision_authority.product: decide` in `.agents/project.yaml` (no human PO in the loop) routes them to a scored, attributed decision subagent instead of escalating — read the block, then `decision-protocol.md` §5.1.
- **Plan before code.** Stage 1 always runs; even a bug fix gets a one-paragraph root-cause analysis before the diff.
- **Verification cap=3**: lint + types + unit tests in parallel; green before any push.
- **Atomic commits**, semantic prefixes, no AI-attribution lines, never `--no-verify`, never force-push a pushed branch, never push to `main` without explicit confirmation.
- **Scope discipline**: touch only what the story states. No "while I'm here" refactors.
- **Reviewer findings are adjudicated**, not auto-applied: each is verified against the diff + AC, or dismissed with a one-line reason.

**Read full SKILL.md when**: the stage you are running needs its full walkthrough, a gate fires, or the briefing tells you to load the full skill.

> Source: `.claude/skills/sprint-development/SKILL.md` · phase: `implementation` · source: frontmatter `compact_rules` (verbatim)

---

## Skill: testability-guide

**Purpose**: Generates a public in-app `/qa` page ("Software Testability Guide for QA") + a tool-agnostic credentials artifact (markdown body) the use...

**Compact Rules**:
- **T1.** NEVER hardcode credential values in the in-app `/qa` page or in the credentials artifact body. Reference environment / config slots by name (e.g. `LOCAL_USER_EMAIL`, `STAGING_USER_PASSWORD`); the real values live in `.env` and in the chosen publisher destination, never in source.
- **T2.** NEVER bypass drift detection. When the host-stack signature changes, respect the snapshot-comment mechanism (`/* qa-guide-snapshot: stack=…, generated=… */`) and propose a surgical patch — do NOT regenerate the page from scratch when a targeted diff suffices.
- **T3.** Gate `/qa` in production ONLY when the host is an internal tool / customer-facing product where an operational page would leak. For a **public practice / demo platform** (where `/qa` IS the teaching surface, e.g. the page that onboards external testers), the page is intentionally public — do NOT gate it. Detect the project type in pre-flight; when unsure, ask. Either way the page NEVER inlines real secrets (T1), so "public" means "public docs", not "public credentials".
- **T4.** NEVER include PII, real customer data, or production data examples in the testability guide. Demo users and sanitized fixtures only.
- **T5.** NEVER duplicate the credentials-artifact body across multiple publisher targets. The markdown body in `references/credentials-content-template.md` is the single source of truth; publishers are thin adapters.
- **T6.** NEVER assume idempotency without re-checking the snapshot comment. Re-runs MUST read the snapshot, diff against current detected stack, and only then decide no-op vs surgical patch vs fresh scaffold.

**Read full SKILL.md when**: the compact rules above are insufficient (e.g. novel scenario, debugging, or the briefing tells you to load the full skill).

> Source: `.claude/skills/testability-guide/SKILL.md` · phase: `foundation-extension` · source: frontmatter `compact_rules` (verbatim)

---

## Skill: unit-testing

**Purpose**: Focused skill for unit-test design — TDD workflow (red-green-refactor), test naming (AAA, Given-When-Then), mocking patterns (mocks/spies...

**Compact Rules**:
- **U1.** NEVER test implementation details (private helpers, internal state, call counts on internal methods). Test public behavior and observable contracts — implementation details refactor freely, tests should not.
- **U2.** NEVER over-mock. When a test mocks every collaborator, it verifies the mock graph rather than the code under test. Prefer real implementations + dependency injection at the seam; mock only true external boundaries (HTTP, DB, filesystem, time, randomness).
- **U3.** NEVER skip the red phase in TDD. Writing the test AFTER the code defeats the design feedback loop — the test must fail for the right reason before any production code is written.
- **U4.** NEVER use weak assertions (`expect(result).toBeTruthy()`, `expect(x).toBeDefined()`) when you actually mean an exact value. Weak assertions hide regressions; assert the specific value, shape, or error.
- **U5.** NEVER share mutable state between tests (module-level vars, singleton caches, shared fixtures mutated in-place). Order-dependent flakes are the result. Reset state in `beforeEach` or scope it inside the test.
- **U6.** NEVER chase 100% line coverage as a goal. Coverage is a signal, not a target — 100% with brittle mock-heavy tests is worse than 80% with behavior-driven tests. Mutation testing is the better signal when the question is "are my tests actually catching bugs?".
- **U7.** NEVER mock what you own without a real reason. Prefer dependency injection at the seam so the test can pass a fake or stub explicitly; reach for `jest.mock` / `vi.mock` only when the seam is unavoidable (module-level side effects, third-party SDK).
- **U8.** NEVER let a flaky test ship green. Either fix the root cause (timing, shared state, network) or quarantine with a tracked ticket — ignoring flakes erodes trust in the entire suite.
- **U9.** NEVER write tests for framework code (matchers behaving correctly, library internals, ORM mechanics). Test YOUR logic; trust the framework's own test suite.

**Read full SKILL.md when**: the compact rules above are insufficient (e.g. novel scenario, debugging, or the briefing tells you to load the full skill).

> Source: `.claude/skills/unit-testing/SKILL.md` · phase: `implementation` · source: frontmatter `compact_rules` (verbatim)

---

## Skill: vercel-cli

**Purpose**: Vercel CLI cookbook for this Next.js + Supabase + Vercel boilerplate.

**Compact Rules**:
- **`--no-wait` on deploy, `--wait` on inspect — never the other way around.** Inverting these means you either block for 10 minutes waiting on a deploy URL you needed immediately, or you race an unfinished deployment with a smoke test.
- **`vercel ls -m githubCommitSha=<sha>` is the canonical "find MY deploy" query.** No grep, no parsing, no race. Use `--format json` and `jq`.
- **Status filter values are UPPERCASE.** `vercel ls --status READY` works; `--status ready` returns empty with no error.
- **`vercel env pull` writes to `.env.local` by default.** That file is in `.gitignore` for a reason — never commit it. If you need a different filename, pass it as a positional arg.
- **Multi-team accounts need `--scope <team-slug>` on EVERY mutating command.** Otherwise the operation hits the wrong team's project, or fails with a confusing 404.
- **Always `--format json`** on `ls`, `env ls`, `teams ls`. Human tables include ANSI color and lose columns at narrow widths.
- **Always `--no-wait` on `vercel deploy`** in scripts. Capture the URL, then poll with `vercel inspect --wait` separately.
- **Always `--wait --timeout=10m`** on `vercel inspect` when verifying. Default behavior returns immediately with whatever state the deploy is currently in — usually `BUILDING`, which tells you nothing.
- **Always pass `--scope <team-slug>`** if `vercel teams ls` shows more than one team. If the project is already linked, the `orgId` in `.vercel/project.json` / `.vercel/repo.json` resolves the team automatically and you can omit `--scope`.
- **Never grep `vercel ls` output for URLs.** Use metadata filters (`-m githubCommitSha=$SHA`) + `--format json` + `jq`. ANSI codes will break naive regex.
- **Never commit `.env.local`** produced by `vercel env pull`. It's gitignored; keep it that way.
- **Verify exit codes.** `vercel inspect --wait` exits 0 only on `READY`. Any non-zero is a real failure — surface it, don't swallow it.
- **Pin the CLI version in CI.** New majors have shifted flag shapes (e.g. `--confirm` → `--yes`). Document the pinned version in `package.json` devDependencies or in the CI workflow.

**Read full SKILL.md when**: the compact rules above are insufficient (e.g. novel scenario, debugging, or the briefing tells you to load the full skill).

> Source: `.claude/skills/vercel-cli/SKILL.md` · phase: `implementation` · source: frontmatter `compact_rules` (verbatim)
