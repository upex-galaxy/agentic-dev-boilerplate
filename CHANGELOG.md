# Changelog

All notable changes to this boilerplate are documented here.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Fixed

Cross-platform defects across the whole bootstrap path, found by an audit run
against the sibling `agentic-qa-boilerplate` after the same defects were fixed
there. Windows PowerShell and cmd are now supported directly; WSL and Git Bash
still work but are no longer required.

**Installer (`cli/install.ts`)**

- Nine prompts bypassed `NON_INTERACTIVE` entirely, so any run without a TTY
  hung forever instead of using defaults — clack and inquirer both render and
  never resolve on a non-TTY stdin. `promptAgentSelection` is reached
  unconditionally from `main()`, so the hang was guaranteed in CI, under an AI
  agent with piped stdin, and in Git Bash on Windows (MSYS ptys are named pipes
  and report `isTTY` false). It now defaults to the detected agents, with an
  `INSTALL_AGENTS=claude-code,opencode` override; the remaining prompts route
  through `maybeConfirm` or return an empty value.
- The "no agents detected" hard exit now runs before the non-interactive guard.
  It is a validation, not a prompt — skipping it let an unattended install
  proceed with zero agents and configure nothing.
- Step 12.4 (acli auth) aborted the whole installer with `process.exit(1)` when
  the `ATLASSIAN_*` vars were absent. Because that branch is gated on
  `AUTO_NON_INTERACTIVE`, it fired for real interactive users on Git Bash and
  stranded every re-run before the later steps that write the Jira catalog
  placeholders. It now records the outcome, warns loudly, and continues — a
  visible skip rather than a silent one.
- The manual `acli` recovery command it prints was POSIX-only. Pasted into
  PowerShell, `$ATLASSIAN_URL` expands as an undefined PowerShell variable and
  acli authenticates with an empty site and token. It is now platform-aware.

**Scaffolder (`create-agentic-dev` 1.0.3)**

- `rewriteProjectYaml` patched a field named `name`, but `.agents/project.yaml`
  declares `project_name` — so **every scaffold since the CLI shipped left
  `project_name: null`** while the CLI logged that it had written the name. The
  field name is fixed, and a miss is now reported instead of swallowed.
- `--force-local` was passed to tar on every win32 run. The flag is GNU-only and
  Windows 10 1803+ / Windows 11 resolve `tar` to the bsdtar at
  `C:\Windows\System32\tar.exe`, which rejects it, so extraction always failed
  in PowerShell and cmd. Tar now runs with `cwd` at the tarball and takes a bare
  relative filename, so GNU tar's `host:path` heuristic (which only applies to
  the `-f` argument) never triggers and both flavours accept the same argv.
- `bun` could not be launched when installed via `npm i -g bun`, which writes a
  `bun.cmd` shim and no `bun.exe`. `where` honours PATHEXT so the preflight
  passed green, but libuv only appends `.com`/`.exe`, so the spawn hit ENOENT.
  Both bun spawns now pass `shell` on win32.
- A spawn that never launched was misread as a failed exit code (`spawnSync`
  reports it as `status: null`, and `null !== 0` is true), discarding the real
  OS error and reporting `exit null`.
- `bun install` failures aborted with no recovery path. The scaffolder now wipes
  `node_modules` and retries once with `--force`, then prints recovery steps and
  the WSL `/mnt/c` caveat.
- `git init -b main` requires git >= 2.28, newer than Ubuntu 20.04 (2.25),
  Debian 10 (2.20) and Catalina's Command Line Tools (2.24). Replaced with
  `git init` plus `git symbolic-ref HEAD refs/heads/main`.
- The doctor's `node >= 18` check read `process.versions.node`, which Bun
  emulates, so it reported OK on machines with no Node. It now probes the real
  binary.
- `CHANGELOG.md` is now in `TEMPLATE_EXCLUDES`. The boilerplate's own release
  history was being copied into every scaffolded consumer project.

### Changed

- `bun run claude` and `bun run opencode` no longer shell out to
  `bash -c 'set -a; . ./.env; set +a; exec <bin> "$@"' --`, which cannot run in
  PowerShell or cmd (Bun executes package.json scripts through Bun Shell, which
  has no `bash`, `set` or `source`). They now use `dotenv -e .env -- <bin>` via
  the `dotenv-cli` devDependency — which the README, INSTALLER and the doctor's
  own probe already described as the mechanism. Argument forwarding is
  unchanged.
- `README.md` and the scaffolder README document the real Windows story and the
  WSL `/mnt/c` caveat, and the scaffolder README gains an npm release runbook.

### Removed

- The `env` npm script (`set -a; source .env; set +a`). It failed outright in
  PowerShell and was a no-op everywhere else: `bun run env` exports into a child
  subshell that exits immediately.

### Breaking

- Hardcoded `customfield_NNNNN` references in the `product-management` skill replaced by `{{jira.<slug>}}` slug references. Downstream repos must re-run `bun run jira:sync-fields` to refresh `.agents/jira-fields.json`.
- "Wave" terminology retired across the `product-management` skill, the `master-implementation-plan` slash command, and the `.context/master-implementation-plan.md` template. Replaced with "Sprint" / "Master Sprint" / "Execution Sprint" (see Glossary in `SKILL.md` for disambiguation).
- Acceptance Criteria, Scope, and Out-of-Scope content removed from story description templates. Those now live exclusively in dedicated Jira custom fields (`{{jira.acceptance_criteria_gherkin}}`, `{{jira.scope}}`, `{{jira.out_of_scope}}`). Existing stories with duplicated content require a manual dedup pass.
- Workflow skill content is now tool-agnostic — every literal `acli ...`, `mcp__atlassian__...`, or `curl ... /rest/api/3/...` command stripped and replaced with `[ISSUE_TRACKER_TOOL]` pseudo-code per the `CLAUDE.md` Tool Resolution table.

### Added

- New slugs in `.agents/jira-required.yaml`:
  - `out_of_scope` (required custom field — explicit exclusions, complementary to `scope`).
  - Top-level `statuses:` section with `epic_default` (literal default `Planning`) and `story_default` (literal default `Shift-Left QA`).
  - Top-level `link_types:` section with `required.dependencies` (outward `depends on`, inward `is dependency for`, fallback `relates`) and `required.blocks` (Jira built-in synonym), plus optional `relates`, `causes`, `tested_by`.
- Five new reference files under `.claude/skills/product-management/references/`:
  - `jira-operations.md` — tool-routing decision table for every Jira operation.
  - `dependency-linking.md` — when / how / direction semantics for issue links.
  - `description-custom-field-dedup.md` — single-source-of-truth contract.
  - `sprint-sequencing.md` — Kahn's topological sort over the dependency graph.
  - `jira-publishing-gotchas.md` — two known ADF bugs and workarounds.
- 14 explicit anti-patterns enumerated in `SKILL.md` (I1–I14).
- New top-level workflow `H — Sprint sequencing (topological execution order)` in `SKILL.md`.
- New script binding `bun run jira:sync-link-types` (stub — full implementation deferred to follow-up PR).
- New CI lint checks: hardcoded `customfield_NNNNN` blocked; `FR-XXX —` summary prefix blocked; literal tool commands blocked; `{{jira.*}}` slug references validated against `.agents/jira-required.yaml`; "Wave" terminology blocked.

### Changed

- Workflows A (initial backlog seed), B (incremental feature), and C (epic creation) now mandate post-create status transitions (epic → `Planning`, story → `Shift-Left QA`), the dependency-linking phase after multiple stories exist, the cross-story Scope overlap check per epic, and the sprint-sequencing terminal phase.
- Workflow D (story refinement) ready-for-dev checklist now includes the deduplication audit and dependency-link verification.
- `master-implementation-plan` slash command and template renamed "Wave N" headers to "Master Sprint N".

### Migration — for downstream repos cloned from earlier boilerplate

1. Pull the boilerplate update: `bun run boilerplate:update` (or your repo's equivalent sync command).
2. Refresh the custom-field catalog: `bun run jira:sync-fields`.
3. Validate the workspace declares all required slugs: `bun run jira:check`. Expect a WARN for missing `.agents/jira-link-types.json` until the follow-up PR ships.
4. Audit existing Jira stories: run the dedup audit per `references/description-custom-field-dedup.md` — strip Acceptance Criteria / Scope / Out-of-Scope H2 sections from descriptions where the content already lives in the dedicated custom fields.
5. Rename `## Wave N` headers in existing `.context/master-implementation-plan.md` outputs to `## Master Sprint N`.
6. Re-read `.claude/skills/product-management/SKILL.md` glossary for the Master Sprint vs Execution Sprint distinction before running `/master-implementation-plan` or `/product-management` again.

### Deferred (next PR)

- Implementation of `scripts/sync-jira-link-types.ts` (binding declared as a stub in this PR).
- Fix for the `md-to-adf.ts` `code` + `strong` mark combination bug (lives in the `acli` skill).
- Execution Sprint visualization (Gantt / dependency-graph render).
