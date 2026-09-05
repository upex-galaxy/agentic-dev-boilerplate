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

### Fixed (updater 8.4)

`CLI_VERSION` 8.3 -> 8.4. Five polish items.

- **The `cli` lock cursor also advances after a self-update from a pre-8.1
  parent.** A 7.x parent predates `UPEX_UPDATER_SELF_UPDATED` and re-execs the
  child on `UPEX_UPDATER_REEXEC=1` alone, so the env-signal fast path never
  fires. The re-exec child now detects the same fact independently: when
  `cli/` is byte-identical to the fetched upstream and the lock's prior
  cursor for the component is not already at that sha, the component settles
  there anyway, same as the env signal.
- **A heading changed only by punctuation is not a heading change.** The
  markdown evidence normalizes an em dash, an en dash, a spaced hyphen and a
  colon to one canonical separator before comparing headings (`## A - B` and
  `## A: B` now compare equal). Case-sensitive otherwise. Hunk counts still
  come from the real diff, untouched.
- **The skills registry regenerates after everything else, including a
  restored overwrite.** `bun run skills:registry` now reruns as the very last
  afterApply hook, after the parity report; an overwritten-edit row for a
  path under `.agents/skills/` now ends with `after restoring, run bun run
  skills:registry`, so `skills:registry:check` does not go red the moment the
  project restores its own edit from the backup.
- **First-run noise for a watched file no upstream ever touched.** A watched
  path with no marker yet (a migrated repo, or one running the per-file
  marker tracking for the first time) whose upstream copy has not changed
  since the project's own lock cursor seeds its marker silently instead of
  firing a row: the same treatment `updater.protected_paths` first advice
  already got in 8.3, now for any watched path when the cursor proves nothing
  moved. An unknown cursor (no lock yet) keeps today's first advice.
- **The closing box names why gates did not run.** `Gates:` used to be
  omitted entirely on a no-op run (nothing applied) or with `--no-gates`,
  reading as "nothing to say"; it now prints `omitidas (sin cambios)` or
  `omitidas (--no-gates)`.

### Fixed (updater 8.3, after the QA port and two more live runs)

`CLI_VERSION` 8.2 -> 8.3. Two improvements born in the QA boilerplate's port
of updater 8 come back upstream, plus four polish items from the live runs on
bunkai-qa-engineering and upex-bunkai-tms.

- **The dirty-tree guard blocks only on what the sync writes.** Uncommitted
  work inside the write surface (a synced component file, an ignore file,
  `package.json`, a deprecated file) still aborts `--auto` and names the
  paths; dirt anywhere else (`tests/`, app code, a protected or bootstrap-only
  file, generated surfaces) is listed as `N ruta(s) con cambios sin commitear
  fuera de lo que este updater escribe; no bloquean` and never blocks. The
  last-apply hash and the updater-owned exemptions are unchanged.
- **No "project edit overwritten" row for a path upstream added after the
  lock cursor.** A file with no base copy at the cursor (`status A`, no
  `templateOldSha`) cannot be told apart from one that arrived another way;
  a migrated Claude-era repo had every moved skill in that state and got one
  false row each. Unknown is never reported as an edit.
- **`.context/PBI/` migration is one parity row.** A repo that still tracks
  the Jira cache in git gets one Componentes row (`N tracked path(s) still in
  git ...; migration recipe saved to .agents/prompts/pbi-cache-migration.md`)
  and the full recipe in that file; the terminal no longer receives the path
  list (370 lines on one live run, next to eight parity rows). The 8.2 file
  name `pbi-cache-migration-prompt.md` is removed when the recipe is written.
  `--dry-run` shows the row without writing the file.
- **A freshly protected path gets no residual row.** A path just declared in
  `updater.protected_paths` (any project-declared entry with no marker yet)
  has its upstream marker seeded silently, with a one-line note; the drift
  row fires on the next upstream change. Before, the first dry-run and the
  first real run after declaring it both showed a `content differs` row that
  only went away once a real run had persisted the marker.
- **The `cli` lock cursor advances after a self-update.** The re-exec child
  found `cli/` identical to upstream (its parent had just written it), walked
  no entry for the component and never moved its cursor, so the lock kept
  `cli@<scaffold sha>` release after release. The parent now hands the sha it
  refreshed `cli/` to through `UPEX_UPDATER_SELF_UPDATED` and the child
  settles the component at it (only when it equals the HEAD the child
  fetched; otherwise the files differ again and sync as usual).
- **MCP registries are compared per server.** `.mcp.json`, `opencode.jsonc`
  and `.codex/config.toml` rows no longer say `same keys and values` when a
  server's args, env, url or command differ: a nested server object is
  compared whole and the evidence names it (`context7: args differ`,
  `supabase: env keys differ`), at most three servers named, the rest
  counted.

### Fixed (updater 8.2, after the second live run)

`CLI_VERSION` 8.1 -> 8.2. Three findings from re-running `bun run up --auto`
on the same downstream repo after its parity decisions were committed.

- **Project-customized synced files converge.** `.husky/pre-commit` and
  `.husky/pre-push` join the protected watchlist (`project gates live here`):
  delivered once when missing, never overwritten (`--auto` and `--force`
  included), one drift row per upstream change with the hunks as evidence.
  Before, every run force-applied upstream's copy over a committed merge and
  re-raised the identical "project edit overwritten" row. The `_/` helpers
  under `.husky/` keep syncing.
- **`updater.protected_paths` in `.agents/project.yaml`.** A project lists
  any other synced file it merged by hand (repo-relative file paths; shipped
  empty, documented in `.agents/README.md`, allowlisted for `vars:check`).
  Listed paths join the watchlist at runtime with the same semantics and the
  sparse checkout. A path outside the repo, under `.git`, a directory or a
  non-string is reported (`entrada ignorada "...": <reason>`) and ignored.
  The overwritten-edit row now ends with `add the path to
  updater.protected_paths in .agents/project.yaml so the next sync keeps your
  merge`, and the saved prompt repeats the fix under the row as YAML.
- **Cost signal on config rows.** A watched file with keys (JSON / JSONC /
  TOML / YAML) or headings (markdown) never suggests a bare `merge`:
  `port upstream additions only: <keys>; keep project-only key(s): <keys>`
  when both sides have something of their own, `keep project` when only the
  project has extra keys, `take upstream` only when upstream added keys and
  nothing else differs, and shared keys whose values differ are named.
  `tsconfig.json` in a Next.js host now says what to port and that `jsx`,
  `lib` and `paths` stay.
- **Identity files compare structure only.** `.agents/project.yaml` and
  `.agents/jira-required.yaml` (bootstrap-only, project-owned) fire an
  `informational` row listing the keys upstream added (`merge = add the new
  keys`), and no row at all for value-only differences.

### Fixed (updater 8.1, after the first live run against a Next.js project)

`CLI_VERSION` 8.0 -> 8.1. Every item below comes from
`bun run up` v8 running against a real downstream repo (upex-bunkai-tms).

- **Never a destructive suggestion for project-only content.** The parity
  table suggests `take upstream` only where the project lacks the content
  entirely. An MCP host holding servers that exist only in the project
  (`only here: dbhub, postman (not in .mcp.json): declare them in .mcp.json
  and .codex/config.toml, or remove them`) and a watched file with
  project-only keys or headings now suggest `merge`, still BLOCKING when a
  compat contract is broken. Applying the old row literally would have
  deleted four working integrations.
- **`--dry-run` previews with the NEW updater.** With a self-update pending,
  the preview no longer runs the old code's opinion: `cli/` stays untouched,
  the fetched updater runs from the upstream clone against the project
  (`UPEX_UPDATER_UPSTREAM_DIR` hands the clone to the child) and shows its
  migration plan, component preview and parity table; nothing is written and
  the prompt is not saved (`[dry-run] prompt not saved`).
- **Non-TTY defaults to `--auto`.** Without a terminal on stdin and without
  `--auto` or the new `--interactive`, the run assumes `--auto` and prints one
  notice instead of hanging on the Phase 3 multi-select.
- **Post-sync gates.** After the apply, the project's `types:check` and
  `lint:check` run (120 s each, `--no-gates` to skip). A failure is a
  "Verificación" row (exit code, first error lines, which of the failing
  files this run applied) plus a `Gates:` line in the closing box; never an
  abort, never blocking.
- **`package.json` rows.** Each key kept at the project's value while
  upstream differs is one `package.json` row (`scripts.repo:check: project
  value kept; upstream differs`), both values in the saved file.
- **Overwritten project edits get a row.** A synced file the project had
  edited (3-way against the lock cursor) and the run overwrote is a `merge`
  row on Skills or Componentes: `project edit overwritten; backup:
  .backups/update-<ts>/<path>; N hunks vs applied`, full diff in the file.
- **Re-run after an uncommitted sync no longer aborts.** The run records
  what it wrote in `.template/last-apply.json` (gitignored, sha256 per path);
  the dirty-tree guard exempts a recorded path whose hash still matches. An
  unrelated file, or a synced file edited by hand since, still aborts and
  names `Commit sugerido` plus the prompt path. A re-run before the migration
  commit keeps the `.claude/skills` alias deferred, and a no-op re-run keeps
  the previous prompt file.
- **Alias status independent of the verdict.** `bun run agents:compat:check`
  and `setup:doctor` always print the alias line (created / OK / deferred
  until the migration commit / missing) and group errors per surface
  (instructions, alias, wrappers, hooks, MCP).
- **Host-agnostic synced tests.** `cli/lib/updater-core.test.ts` and
  `cli/updater-harness-migration.test.ts` no longer cast plain objects to
  `NodeJS.ProcessEnv` (TS2352 under Next.js, whose `ProcessEnv` requires
  `NODE_ENV`); `cli/updater-host-types.test.ts` compiles `cli/**` with that
  augmentation on every `bun test`.

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

- `bun run up` ends with one "Estado por superficie" table (8 rows:
  Instrucciones y config / Skills / Comandos / Hooks / MCP / Env / Componentes
  / Git, ok or warn per row) and ONE parity prompt, printed and saved to
  `.agents/prompts/parity-plan.md` (gitignored, single-use). Every row cites a
  surface, a file and concrete evidence (headings added or removed plus hunk
  counts, a server missing from a host, a wrapper no manifest produced, an
  archived skill collision, a held-back component, a drifted env key) and
  awaits a per-row decision, `keep project | take upstream | merge`, before the
  AI edits anything. One row per path: a stray wrapper is a single blocking
  `add to overlay` row, and a watched file that also fails a compat contract
  (`.codex/config.toml` missing a declared server) is one blocking row that
  carries the contract evidence first and the drift evidence after it,
  suggestion `take upstream`. Archived skills nudge once: what this run
  archived (the migration result travels to the self-update re-exec child
  through `UPEX_UPDATER_MIGRATION_RESULT`) plus any archive entry never
  reported, each with a one-nudge marker under `.template/upstream-sha/`. The
  commit suggestion is part of the closing box.
- An aborted run is reported as one. When a preflight refuses (dirty tree,
  corrupt lock, failed clone, declined migration or self-update) `runUpdate`
  returns `aborted: true`, the closing line is `Abortado.` and the exit code
  is 1 in every mode; Ctrl-C on a prompt keeps exit 130. `CLI_VERSION` is
  `8.0` (it stamps the lock's `cliVersion` and the ignore-file sentinel, which
  is matched by prefix; the lock schema stays at 7).
- `bun run up --strict`: exit 1 when the compat check fails or a blocking
  parity finding is present. Default stays warn and exit 0. Documented in
  `--help`.
- Project overlay for slash commands:
  `.agents/compatibility/command-aliases.project.json` (same schema as the
  upstream manifest, optional, bootstrap-only so `bun run up` never overwrites
  it). Upstream aliases are read first; an overlay entry overrides by `alias`
  name or adds a new one; `wrapperHosts` always come from upstream.
  `validateCommandAliases`, `repairCommandWrappers`, `commandWrapperCounts`
  and the doctor wrapper row use the merged list. A wrapper file under
  `.claude/commands/` or `.opencode/commands/` that no manifest produced now
  fails by name (`Command wrapper not declared in any manifest: <path>; add it
  to .agents/compatibility/command-aliases.project.json or delete it`) instead
  of being ignored; the repair never deletes it.
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

- `.claude/settings.json` joins the protected watchlist: the updater never
  overwrites it, project permissions and hook edits survive, and drift from
  upstream shows up as a row in the parity prompt (a stale hook command is
  still caught by `agents:compat:check`). Component `agent-root-config`
  delivers it ONCE when the project lacks it (bootstrap-only, the same rule as
  `.codex/`) and never touches it afterwards.
- On the run that applies the cross-harness migration the `.claude/skills`
  alias is NOT created: the migration unindexes the committed
  `.claude/skills/*` tree and git refuses to rewrite index entries behind a
  symlink, so the alias would break `lint-staged` on the migration commit
  itself (`'.claude/skills/REGISTRY.md' is beyond a symbolic link`). The run
  prints the next step and repeats it in the closing box (`Siguiente: commit
  de la migración, luego bun run agents:compat (crea el alias .claude/skills)`);
  the compat check (and the pre-commit gate that runs it) treats the missing
  alias as expected while the marker
  `.template/upstream-sha/claude-skills-alias.deferred` exists, and the self-update
  re-exec child learns about the migration through the same env var as the
  archived skills. `repairAgentSurfaces` in `cli/lib/agent-compatibility.ts`
  is the shared repair with that switch; `repairClaudeSkillsAlias` removes the
  marker once the alias exists.
- Real-repo tests in `cli/lib/agent-compatibility.test.ts` assert the server
  set `.mcp.json` declares and the merged alias list, never the literal
  boilerplate four or the literal count of eight wrappers, so a downstream
  project with a different set passes them unchanged. Docs (`README`,
  `INSTALLER`, `CONTEXT`, `AGENTS.md` §5.5,
  ADR-0002, `docs/mcp/*`, `docs/setup/mcp/*`, `docs/onboarding.html`) describe
  the same project-neutral rule: the canonical set is whatever `.mcp.json`
  declares; the four boilerplate-known ids get an extra strict shape check
  only when present.
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
   is deleted). Commit what it staged: the pre-commit hook passes because the
   `.claude/skills` alias does not exist yet on purpose.
2. `bun run agents:compat` (creates the alias), then
   `bun run agents:compat:check` and `bun run setup:doctor` to see the
   per-harness rows.
3. If you had hand-written a `.claude/commands/*.md` with a body, move that body
   into a skill under `.agents/skills/` and declare the alias in
   `.agents/compatibility/command-aliases.json`.
4. Codex users: mark the repository trusted in Codex, or `.codex/` config and
   hooks will not load.

### Fixed

- Self-update vs dirty-tree guard: `bun run up --auto` aborted on the dirty
  `cli/` tree the self-update itself had just produced and needed `--force`
  to continue. The re-exec child now ignores paths inside the self-update
  component, and the parent no longer leaves the tree in a state the child
  rejects. The lock file (`.template/boilerplate.lock.json`) and `.backups/`
  are updater-owned in the parent too, so a lock left uncommitted by the
  previous run never aborts the next one.
- A run that applied nothing rewrote the lock only to bump `lastSyncedAt`,
  leaving `git status` dirty after a no-op sync. The lock is now written only
  when its content (timestamp excluded) changed, so a second run on a synced
  tree is byte-identical.
- A bootstrapped component with nothing to deliver (its only file is
  bootstrap-only and the project already owns it, e.g. `agent-root-config`
  with `.claude/settings.json`, or `codex-config` on a repo that already had
  `.codex/`) never got a lock cursor, so every later run repeated
  "Componentes sin sincronizar previamente: ... bootstrap parcial". It now
  advances like any component that skipped nothing.
- Windows: the `project/` and `upstream/` relabel of the saved diffs matched
  the backslash caller paths against git's forward-slash headers and left the
  temp-dir paths in the file. Both forms are normalized before the relabel.
- `scripts/lint-skills.ts` raised `TIER-MISMATCH` on community skills committed
  as real directories inside `.agents/skills/` (downstream projects commit
  their `bunx skills add` output; one repo hit five errors). A skill that
  `cli/install.ts` lists as T2 / T3 / T4 keeps that tier even when present in
  the store and is no longer reclassified as T1. The scan line reports how
  many committed community skills were seen. Regression fixture in
  `scripts/lint-skills.test.ts` (`LINT_SKILLS_ROOT` override for fixture
  repos).

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
