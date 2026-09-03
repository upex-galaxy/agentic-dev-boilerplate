# Changelog

All notable changes to this boilerplate are documented here.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## 2026-08-22 — PBI-as-Jira-cache port (PR #22)

Port of the sibling `agentic-qa-boilerplate` release of the same model: the
local PBI tree becomes a disposable cache of Jira, and the toolchain around it
is hardened accordingly.

### Changed

- `.context/PBI/` is now a **gitignored cache**: only `README.md` and
  `templates/` are committed. Jira is the source of truth; `bun run
  context:hydrate` rebuilds the whole `[SYNC]` tree from scratch, so a fresh
  clone starting with an almost-empty `PBI/` is the intended state.
- Skill registry generation is now **frontmatter-first**: `compact_rules` are
  read verbatim and uncapped from each `SKILL.md` frontmatter.
- `import.meta.dir` usage in the two shared runtime libs made portable.

### Added

- Defensive filters in the Jira issue sync for the shared Jira workspace.
- Minimal boilerplate-only CI quality gate, plus `context:hydrate` and a root
  test target.

### Fixed

- Updater hardening: `repoOnlyPaths`, atomic gitignore groups, and a PBI
  migration hook for repos cloned before the cache model.
- Scaffolder (`create-agentic-dev`) resets git-strategy provenance on
  scaffold, so a new project never inherits the template's verified state.
- Stale git-strategy claims in `CLAUDE.md` corrected; docs, skills and decks
  swept for alignment with the cache model.

## [Unreleased]

### Breaking

**One source, three harnesses** (`refactor(agents)!`, 2026-09-03). The
boilerplate now runs on Claude Code, OpenCode and Codex (CLI + Desktop) from
exactly one copy of every instruction and every skill, mirroring the model the
sibling `agentic-qa-boilerplate` shipped. Decision record:
`.context/ADR/ADR-0002-multi-harness-single-source.md`.

- **BREAKING: `AGENTS.md` is the canonical AI memory.** `CLAUDE.md` is now a
  generated one-line shim (`@AGENTS.md` plus a newline) and never holds prose;
  the compatibility check enforces it byte-for-byte. Every reference to
  `CLAUDE.md` as the instruction body has been rewritten.
- **BREAKING: the skill store moved from `.claude/skills/` to
  `.agents/skills/`.** OpenCode and Codex read it natively; Claude Code reaches
  it through a generated, gitignored `.claude/skills` alias (POSIX symlink,
  Windows junction). Project-level community skills (`bunx skills add`) install
  into the same store. `scripts/lint-skills.ts`, `scripts/build-skill-registry.ts`,
  the `test` script and the husky globs follow the new path.
- **BREAKING: slash commands are generated transport aliases.** The six
  commands that carried a workflow body (`business-data-map`,
  `business-feature-map`, `business-api-map`, `master-implementation-plan`,
  `dev-roadmap`, `sync-ai-memory`) now live as skill modes: new skill
  `project-context` (modes `data`, `features`, `api`, `master-plan`,
  `dev-roadmap`, `refresh-all`) and new skill `sync-ai-memory`. All eight
  wrappers under `.claude/commands/` and `.opencode/commands/` are generated
  from `.agents/compatibility/command-aliases.json`; a wrapper that grows a
  body fails the check as `contains workflow prose`. Codex has no wrapper layer
  and invokes the skill plus mode directly.
- The personality hook is one emitter, `.agents/hooks/personality-reinject.mjs`,
  with three adapters: `.claude/settings.json` (`UserPromptSubmit`),
  `.codex/hooks.json` (`UserPromptSubmit`, POSIX + PowerShell command) and
  `.opencode/plugins/personality-reinject.js`. The former
  `.claude/hooks/personality-reinject.js` is gone.
- New Codex adapter `.codex/config.toml` with the same four MCP servers as
  `.mcp.json` and `opencode.jsonc`. Parity across the three formats is checked
  semantically on the `.env` variables each server depends on. Codex cannot
  expand `${VAR}` in `args`, so it reaches `tavily` over HTTP with
  `bearer_token_env_var` and passes `supabase` env-only auth. `docs/mcp/*.template.*`
  remain opt-in templates for Gemini CLI and Cursor (no runtime adapter).
- Commit provenance (Critical Rule #3): the harness session trailer
  (`Claude-Session:`) is emitted only when the running harness exposes a
  transcript pointer; OpenCode and Codex sessions omit it. The AI-attribution
  ban is unchanged on every harness.

### Added

- `bun run agents:compat` regenerates every derived harness artifact (shim,
  alias, both wrapper sets) and then checks; `bun run agents:compat:check`
  validates the whole contract (shim bytes, alias target, wrappers byte-for-byte
  against the manifest, hook adapters, MCP parity). It runs in `repo:check`,
  unconditionally in pre-push, and in pre-commit when a harness surface is
  staged. Engine: `cli/lib/agent-compatibility.ts` +
  `cli/lib/agent-compatibility-contracts.ts`; CLI: `scripts/agent-compatibility.ts`.
- `bun run codex` dotenv wrapper next to `bun run claude` / `bun run opencode`.
- Installer: detects Claude Code, OpenCode and Codex (config directory, binary
  on PATH, or `.codex/config.toml` in the repo), multi-select prompt,
  `INSTALL_AGENTS=claude-code,opencode,codex` override, hard exit with three
  docs URLs when none is found, and a compatibility repair (alias + wrappers +
  verify) at the end of every run.
- Doctor: reports instructions, alias, wrapper counts per host, the three hook
  adapters, MCP parity across the three configs, and Codex repository trust as
  WARN (runtime state no file read can verify).
- `AGENTS.md` §5.5 "Multi-harness" and Critical Rule #15 ("harness surfaces are
  generated"); README, CONTEXT, INSTALLER and `docs/README.md` describe the
  model; Spanish visual walkthrough published at
  <https://upex-galaxy.github.io/agentic-dev-boilerplate/harnesses.es.html>
  (source `packages/pages-home/harnesses.es.html`).

### Changed

- `bun run up` runs a migration preflight before any component sync on a
  project created before this change: promotes `CLAUDE.md` to `AGENTS.md` and
  leaves the shim, moves every `.claude/skills/*` skill (project-authored ones
  included) into `.agents/skills/`, archives name collisions under
  `.template/pre-agents-migration/`, never deletes, and is idempotent. A shim
  found without `AGENTS.md` is reported as an orphaned shim with a recovery
  command. Updater components renamed: `claude` becomes `agent-compatibility`
  (`.agents/skills`, `.agents/hooks`, `.agents/compatibility`); new
  `codex-config` (`.codex/`), `commands` (`.claude/commands`,
  `.opencode/commands`), `agent-root-config` (`.claude/settings.json`,
  `.opencode/plugins`). `AGENTS.md` joins the never-synced watchlist.
- Scaffolder `create-agentic-dev` stays harness-neutral; the manifest documents
  `AGENTS.md`, `.codex/` and `.opencode/`, and `bun run setup` generates the
  alias after scaffold (nothing generated ships in the tarball).

### Migration — for downstream repos cloned before this change

1. `bun run up` (the preflight above migrates instructions and skills; nothing
   is deleted).
2. `bun run agents:compat:check`, then `bun run setup:doctor` to see the
   per-harness rows.
3. If you had hand-written a `.claude/commands/*.md` with a body, move that body
   into a skill under `.agents/skills/` and declare the alias in
   `.agents/compatibility/command-aliases.json`.
4. Codex users: mark the repository trusted in Codex, or `.codex/` config and
   hooks will not load.

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
