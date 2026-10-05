# Changelog

All notable changes to this boilerplate are documented here.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## 2026-10-05 — No shell autoloader: secrets stay out of the shell

Each process loads its own config, so nothing exports `.env` into a shell the
AI uses (ADR-0015, owner decision B8).

### Removed

- **`.envrc`** and every direnv step: the installer's `direnv allow` offer and
  `INSTALL_SKIP_DIRENV`, the doctor's direnv check (its `direnv` JSON field and
  the `shell_hook` action type), the `direnv allow` step of
  `bun run worktree:provision` and its `.envrc.local` copy.

### Changed

- **`/acli` REST fallback**: the `curl` recipes run inside
  `bunx varlock run --`, which loads `.env` for that one process.
- **`.gitignore`** ignores `.envrc`, `.envrc.local` and `.direnv/`: a personal
  autoloader is never committed. The updater never delivers, watches or
  deletes `.envrc`.
- **Docs**: README, INSTALLER, `.env.example`, the orca-orchestration and
  testability-guide references describe per-process loading only.

## 2026-10-05 — A project on one harness keeps only that harness's files

A project declares the harnesses it uses in `.agents/project.yaml`
(`harnesses: [claude]`), and every compatibility gate checks only those
(ADR-0013, after agentic-qa ADR-0012). The boilerplate itself still checks all
three.

### Added

- **`harnesses:`** (top level of `.agents/project.yaml`, `null` in the shipped
  schema): absent or `null` detects from the files present, where a harness is
  in use while ANY of its files exists. `cli/lib/harness-selection.ts` is the
  one answer every gate reads.
- **Installer**: the agent selection is written to `harnesses:` as a union
  (never shrinks), then the installer offers to delete the files of each
  harness left out; the default keeps them.

### Changed

- **`agents:compat:check`**: MCP parity, hook adapters, route re-arm and the
  Codex 32 KB cap bind only the harnesses in use; without Claude Code the
  canonical MCP set is the first declared harness's file and neither the
  `CLAUDE.md` shim nor the `.claude/skills` alias is required. One `NOTE:` per
  skipped harness. A missing MCP config of a harness in use now groups under
  MCP.
- **`setup:doctor`**: rows and pending actions only for the harnesses in use;
  the others read `not used`, and no action advises restoring their files.
- **`bun run up`**: the files of a harness not in use (its `docs/mcp/`
  template included) are neither delivered, watched nor reported; the
  `.claude/settings.json` permission merge runs only with Claude Code and the
  OpenCode deny-gap row only with OpenCode.
- **Tests**: the OpenCode plugin is imported dynamically, and the tests that
  read the OpenCode or Codex files skip when the checkout lacks them, so
  `types:check` and `bun run test` pass on a one-harness project.

## 2026-10-05 — Engram wired directly with `engram setup`; caveman no longer assumed

`bun run setup` wires Engram with the engram binary's own `engram setup
<agent>` instead of `gentle-ai install --preset minimal`, and the repo no
longer assumes or recommends the caveman communication-mode plugin.

### Changed

- **Engram without gentle-ai**: the installer detects `engram` (>= 3.0.0) and
  runs `engram setup <agent>` per selected agent (`--protocol=slim` on Claude
  Code), then offers to install the Engram Claude Code plugin (one confirm,
  skipped without a TTY, never fatal). gentle-ai's `minimal` preset was never
  "Engram only": it also carries the SDD skills, plus its own orchestrator
  instructions, hooks and telemetry in the user-level agent config. New
  `INSTALL_SKIP_ENGRAM` / `INSTALL_FORCE_ENGRAM`; `INSTALL_FORCE_AGENTS_SETUP`
  stays as an alias, and an installer state file written before this change
  still loads.
- **Critical Rule #11 rewritten in place**: concision comes from `AGENTS.md`
  §2 (Butler + PM Voice) and the user-level OUTPUT STYLE; no
  communication-mode plugin is assumed or recommended. The §2 LAYER SPLIT has
  two rows. The installer, `INSTALLER.md`, `docs/ai-personality.md`, the
  onboarding page and the behavioural-layer deck drop caveman.
- **Scaffolder manifest**: `willInstall.gentleAiSkills` is now
  `willInstall.engram`.

## 2026-10-05 — MCP servers read `.env` through a filtered loader; no plaintext credential copies

Every MCP server that needs `.env` values now starts through
`bunx -p varlock@<pin> varlock run --no-redact-stdout --inject vars --filter <its vars> -- <server>`
on Claude Code, OpenCode and Codex, so a desktop or natively launched harness
gets its credentials (from `.env` or the secret manager) with nothing copied to
disk, and each server sees only its own variables (ADR-0012).

### Changed

- **One filtered loader on every host**: `.mcp.json`, `opencode.jsonc`,
  `.codex/config.toml`; `agents:compat:check` treats the `--filter` as the
  server's dependency set and rejects a host-side reference beside it (warning
  downstream, naming the exact launch). context7 launches bare. The Supabase
  server receives `SUPABASE_ACCESS_TOKEN` only: it never read the URL or the
  publishable / secret key the old configs mapped into it.
- **`bun run harness:env` retires instead of generating**: the `.claude/settings.local.json`
  env block and `.auth/opencode/` copies are deleted when `.env` holds the same
  value, otherwise moved to `.auth/harness-env-backup/` and named. `setup`
  retires in Step 7d, `setup --variables` prints a restart notice, and
  `worktree:provision` derives nothing from `.env`.
- **`.envrc`** loads `.env` then `.env.local` (varlock's order) with
  `watch_file`, and is only for shell CLIs.

### Added

- **Sensitivity lint** in `bun run vars:schema:check` (so `repo:check` and the
  pre-commit gate): a key matching `SECRET_NAME_PATTERNS` without `@sensitive`
  in any schema varlock loads fails the gate, because `varlock load --agent`
  prints unmarked values in clear.
- **`setup:doctor` "Secret source"**: the provider, its overlay, the names it
  resolves from the vault, the manager CLI, and where vault values reach.

### Migration

Run `bun run harness:env` in the main checkout (and in each worktree) to retire
the old copies, then restart the agent session. A downstream project on the old
config shape gets one `agents:compat:check` warning per server naming the launch
to paste.

## 2026-10-03 — Brownfield adoption: install the agentic layer into an existing app (updater 8.8)

An application that already has its own code, schema, CI and conventions can
now take the agentic layer without being overwritten (#80 to #91 and the
sweep PR that closes the wave). There are two install paths: a new project
starts with `bunx create-agentic-dev@latest <name>`, an existing app runs
`bunx create-agentic-dev@latest --adopt` from its repo root and then the
`project-adoption` skill. The install layer (the updater's `--adopt`) never
writes over what the app owns; the understanding layer (`project-adoption`)
reads the app, proposes one plan, and writes only agentic surfaces after
approval. v1 supports a Next.js app on the Postgres family that uses bun, one
app per adoption; the set is `V1_SUPPORTED` in `cli/lib/stack-descriptor.ts`.

### Added

- **Stack descriptor** (#81): the `stack:` block of `.agents/project.yaml`
  (app root, framework, package manager, script names, database layout and
  how a schema change lands, UI, hosting, CI, test runner, conventions),
  detected and written by `bun run agents:setup --stack`, validated and
  drift-checked by `bun run setup:doctor`. Owner: `cli/lib/stack-descriptor.ts`.
- **`--adopt` first-run policy in the updater** (#82): absent paths are
  delivered, identical ones marked seen, app-owned ones never written and
  protected through `updater.protected_paths`; `package.json` is append-only;
  app instructions are composed verbatim into `AGENTS.md` only on an explicit
  yes. Owner: `cli/lib/updater-adopt.ts` plus the `adopt` option of
  `runUpdate` (`cli/lib/updater-core.ts`).
- **Scaffolder `--adopt` and `--doctor --preflight`** (#86): a read-only
  preflight, then the template's updater run with `--adopt` from a temp
  directory. Owner: `packages/create-agentic-dev/`.
- **`project-adoption` skill** (#84): sealed analysis, one plan file waiting
  for approval, writes to agentic surfaces only, then the app's own build,
  lint, types and test compared against their baseline; mode `check` is a
  read-only drift report. Owner: `.agents/skills/project-adoption/`.
- **Tooling isolation** (#89): `tsconfig.tooling.json`,
  `eslint.config.tooling.mjs` and the `tooling:types:check` /
  `tooling:lint:check` scripts scope the tooling to `cli/` + `scripts/`; a
  foreign hook manager is detected and never replaced. Owners:
  `cli/lib/adopt-isolation.ts`, `cli/lib/hook-manager.ts`.
- **Greenfield guard for `project-bootstrap`** (#88): `bun run
  bootstrap:guard` refuses the base phases on an existing app and routes to
  `project-adoption`; the add-ons stay. Owner: `cli/lib/bootstrap-guard.ts`.
- **`design-system` mode `extract`** (#80): `DESIGN.md` written from the live
  theme, with provenance on every value and no change to app code. Owner:
  `.agents/skills/design-system/references/extract-from-code.md`.
- **DB change doctrine** (#88, owner decision OD4 = C): agents keep applying
  schema changes through the DB MCP, read the migration history first, and
  follow `stack.database.migrations_tool`; the adoption itself never touches
  a database. Owner:
  `.agents/skills/agentic-dev-core/references/db-change-doctrine.md`.
- **Decks**: `packages/decks/project-adoption/como-funciona.es.html` with its
  hub card, the `extract` band in the design-system deck, and the greenfield
  guard band in the project-bootstrap deck.

### Changed

- **Skills read the app's stack instead of greenfield literals**:
  `project-context` (#83), `project-foundation` Discovery-only and the
  business maps as an adopted app's product docs (#87), `sprint-development`
  and `autonomous-delivery` (#91), `agentic-dev-onboard`, `unit-testing` and
  `testability-guide` (#90). Stack skills are required at the step that
  needs them, and a DB-MCP mutation loads the Supabase skills first (#85).
- **`AGENTS.md`**: the `db` capability resolves from `stack.database`, `n8n`
  applies when `.mcp.json` declares it, `api:sync` is documented as writing
  `api/` at the repo root, and the PBI cache is pulled by scope on an adopted
  tracker (sweep PR). §5.5 documents `--adopt` and the tooling isolation.
- **Install paths named everywhere**: the "clone the full boilerplate" lines
  in `agentic-dev-core`, `git-flow-master`, `product-management`,
  `project-foundation`, `sprint-development` and `.context/README.md` now name
  the two install paths (sweep PR). `agentic-dev-core` → "Install model"
  carries the table.
- **Updater CLI version** `8.7` → `8.8` (`CLI_VERSION` in
  `cli/update-boilerplate.ts`).

### Fixed (dogfood: the adoption run on a copy of a real app, U18-12)

The wave was run end to end on a throwaway copy of an existing Next.js +
Supabase app; every defect it exposed is fixed here, and the measured
contract is ADR-0008 (`.context/ADR/ADR-0008-adoption-contract.md`).

- **The agentic store is versioned even when the app's `.gitignore` hid it**:
  `--adopt` re-includes `.agents/` in an appended block before the
  cross-harness migration runs, and the migration refuses, on any run, to
  untrack skills into a folder git ignores. Owner: `cli/lib/adopt-gitignore.ts`.
- **Nothing of the app is deleted or hidden**: a file at a path upstream
  retired is kept and protected; an upstream ignore line that matches files
  the app tracks is withheld; the tooling's own test files never reach an
  adopted app, the updater's self-update included.
- **The tooling gates judge only the tooling**: on an adopted repo every
  sync records what upstream owns under `scripts/` and `.agents/skills/`
  (`upstreamOwned` in the installer lock, `cli/lib/tooling-scope.ts`);
  `tooling:types:check` / `tooling:lint:check` (`scripts/tooling-check.ts`)
  and `skills:check` scope themselves to it; the app's preserved instruction
  text is not judged by Critical Rule #17; a retired variable name the app
  declares itself is a warning in `vars:env:check`.
- **The adoption commit passes the gates**: a pending instruction merge
  defers the alias instead of failing the compatibility check; the
  agent-context hook joins an app `.claude/settings.json` that has none;
  `.husky/pre-commit` runs lint-staged only where the project configures it;
  the post-sync gates of an adopted repo run the tooling's scope and are
  skipped on the `--adopt` run itself.
- **Framework skills the app had copied in by hand** are no longer frozen:
  they stay unprotected, upstream's copy is saved under
  `.agents/prompts/adopt-upstream/`, and `project-adoption` takes it on its
  own approval line.
- **Isolation snippets fit an app that keeps its own `scripts/`**: every app
  `tsconfig*.json` is analysed, upstream's files are excluded one by one, and
  an ESM flat ESLint config reads them from the installer lock; the agentic
  dot-directories are covered.
- **The stack block describes the app**: the adopt seed starts it as unknown,
  and detection prefers the app's own role scripts over the ones the tooling
  appended.

### Fixed (deferred from the dogfood, U18-14)

- **`lint-staged` changes reach every project**: the `package.json` sync kept
  string values only, so a glob mapped to an array of commands never
  travelled, greenfield included. A `lint-staged` value now moves through the
  delta and the kept-keys state as JSON text and is written back as the array
  it was. Owner: `getSection` in `cli/lib/updater-package.ts`.
- **Identity leaves follow the stack**: `bun run agents:setup --stack` fills
  `backend_stack`, `frontend_stack`, `db_type` and the two entry points where
  they are still null, from the `stack:` block and the router directories on
  disk, once an app exists; a filled leaf is never overwritten. Owner:
  `writeDerivedIdentity` in `cli/lib/stack-descriptor.ts`.
- **`setup:doctor` no longer asks an adopted app to delete its own variable**:
  a retired credential name the app declares above the tooling block of
  `.env.example` is listed as the app's, the rule `vars:env:check` applies.
- **An adopted app's skills run without a prompt**: the `--adopt` run creates
  the `permissions.allow` list an app `.claude/settings.json` lacks, with
  upstream's entries; greenfield and plain updates keep skipping that shape.
- **`repo:check` judges only the tooling on an adopted app**: it opens with
  `bun scripts/tooling-check.ts repo`, which runs `format:check`,
  `lint:check` and `types:check` unchanged on greenfield and the
  tooling-scoped lint and types checks, with no format leg, on an adopted
  app. `setup:doctor` names an adopted app whose `repo:check` predates it.

## 2026-10-03 — Docs hub and one deck per workflow skill; behaviour layer recorded (updater 8.7)

The human-docs wave that follows the parity wave (#52 to #77, and the portal
PR that closes it): every human surface was measured against the owners it
describes, rewritten where it had drifted, and the GitHub Pages hub now
carries a deck for every workflow skill. The catalog itself is
`.agents/skills/REGISTRY.md`; the deck backlog and its fold/drop decisions are
`packages/decks/ROADMAP.md`.

### Added

- **One deck per workflow skill** (#56, #58, #60 to #62, #67 to #74):
  `packages/decks/<skill>/como-funciona.es.html`, published under
  `/decks/<skill>/`. Category decks for the business context skills
  (`packages/decks/context-skills/`, #75) and the utility skills
  (`packages/decks/tooling/`, #76). The design-system deck now covers the token
  phase and the screen phase at its old URL (#77).
- **Start-here page on Pages**: `docs/onboarding.html`, rebuilt on the
  skill-plus-mode model (#64), is published as `/onboarding.html` by
  `.github/workflows/pages.yml`; `scripts/lint-docs.ts` resolves links to it
  through `PUBLISHED_FILES`.
- **Docs hub portal**: `packages/pages-home/index.html` links every deck that
  exists, grouped by section, plus a block for maintainers. `README.md`,
  `CONTEXT.md`, `INSTALLER.md`, `docs/README.md` and the `agentic-dev-onboard`
  skill link the hub root, and the onboard skill hands the user each skill's
  deck.
- **Deployed build stamp on `/qa`** (#54): the page `/testability-guide`
  generates shows the deployed short SHA at runtime
  (`data-testid="qa-build-sha"`), outside the idempotency snapshot.

### Changed

- **Doctrine settled before the decks quoted it** (#57, #63): push under
  `direct_push_to_protected: allowed` is standing authorization (Critical Rule
  #4); the AI may commission mockups through a design tool and a human
  ratifies them, never hand-authoring them (Rule #14); the live UI plus
  `DESIGN.md` tokens are the fidelity reference and the mockup is inspiration;
  every skill's `compatibility:` frontmatter names the three supported hosts.
- **Human docs refreshed** (#55, #59, #64 to #66): `docs/mcp/` and
  `docs/setup/` describe the committed servers, harness-level web search,
  OpenCode `{file:.auth/opencode/VAR}` files and the Codex `.env` loader; the
  multi-harness page (`packages/pages-home/harnesses.es.html`) is an evergreen
  behaviour page; `docs/methodology/` keeps only the dev-to-QA handoff and the
  dev side of Jira; the core decks drop dated stamps and edit history.
- **Deck convention** (`packages/decks/README.md`, #57): no dated stamp, count
  or version in a deck or on the hub; a deck names its owner files instead.
- **The behaviour layer** (recorded here; the change itself landed with the
  `capa-comportamental` deck): three layers govern chat output, each on one
  dimension. caveman owns word count, `AGENTS.md` §2 owns what is said and at
  what granularity, and the active user-level OUTPUT STYLE owns rendering and
  texture. Butler bullets use a colon separator, the headline punch is gone,
  and `.agents/hooks/personality-reinject.mjs` re-injects the output contract
  every turn on all three hosts (`AGENTS.md` §5.5 HOOK). `cli/install.ts`
  installs caveman with `--no-hooks` so the plugin's own hooks are the only
  copy. Narrative: `packages/decks/agentic-dev-core/capa-comportamental.es.html`
  and `docs/ai-personality.md`.

### Removed

- Docs pages for hosts outside the three-host contract (Copilot CLI, Gemini
  CLI, VS Code, the Gemini MCP template), the Xray setup guide and the
  early/mid/late-game QA methodology pages (#55, #64). They are
  `RETIRED_DOCS_FILES` in `cli/update-boilerplate.ts`, so `bun run up` removes
  them downstream instead of holding the `docs` component back.

### Fixed

- The registry carries every authored compact rule; only the Strategy B scrape
  is capped (#52).
- Greenfield hygiene in skills and docs: stale env names, version pins, stage
  and rule numbers, import aliases read from `tsconfig.json` (#53).

### Upgrading a project

`bun run up` delivers the refreshed `docs/` and skills and retires the pages
listed above. `packages/` (the hub and the decks) and `.github/workflows/pages.yml`
never travel: a project reads the upstream hub.

## 2026-10-03 — Parity wave with agentic-qa-boilerplate; volatile-facts lints block (updater 8.6)

The dev-sync parity wave: mechanisms first built in the sibling
`agentic-qa-boilerplate`, adapted to a development boilerplate (stories, PRs,
deploys, Supabase, Vercel), one PR per unit (#31 to #50, and the sweep that
closes it). The command-alias retirement of the same wave has its own entry
below (updater 8.5).

### Added

- **Doctrine pack** (#35): verify at the destination (Critical Rule #16),
  decision elicitation through the harness prompt or the `mkd` deck, ADRs that
  record an owner decision as Accepted.
- **Volatile facts** (#36, closed by the sweep): Critical Rule #17 and its canon
  `agentic-dev-core/references/volatile-facts.md`, the `FILE-LINE` and
  `CURRENT-STATE` checks in `scripts/lint-skills.ts`, the `docs:check` gate
  (`scripts/lint-docs.ts`) and the measurements ledger ADR-0003.
- **Agent identity and forensic trailers** (#37): the prompt hook injects an
  `AGENT IDENTITY:` line; every agent commit ends with `Worktree:` + `Session:`;
  harness-branded trailers are forbidden (ADR-0004). `.husky/commit-msg` warns.
- **Worktree foundation** (#34): `bun run worktree:provision`, `bun run
  worktree:audit` and the checkout roots.
- **Live-UI browser sessions and the Jira ADF budget** (#38, #40): named
  in-memory `playwright-cli` sessions at the live-UI gate; plan templates that
  fit under the Jira rich-text cap, guarded by a test.
- **MCP capabilities** (#39): skills declare `library-docs`, `web-search`, `db`,
  `automation-flows`; tools resolve by name suffix; web search lives at harness
  level (ADR-0005).
- **Skill-system mechanics** (#41): `metadata.kind`, context skills, the session
  footer.
- **`session-handoff` and `pr-review-lead`** (#42).
- **Artifact lifecycle doctrine** (#44).
- **`bun run harness:env`** (#46, #48): per-harness MCP credential files derived
  from `.env` for launches with no command line, supervised workers included.
- **`orca-orchestration`** (#47): conductor / worker / automation modes over the
  Orca runtime and `/sprint-development` fleet mode; silent when the runtime is
  absent.
- **Business context maps as HTML** (#49): the data, feature and API maps live
  inside three shipped context skills, read with `bun run context:map`.
- **`.agents/project.schema.yaml`** (#50): generated from the maintainer yaml with
  an identity leak gate; one schema-driven hook back-fills every block a project
  lacks; `setup:doctor` reports the gaps; `agents:setup` reseeds a copied
  maintainer yaml.

### Changed

- **Updater parity gates** (#43): array-valued config deltas, `PATH_PREREQUISITES`
  and `CONFIG_BLOCK_READERS` block a half-delivered release, the synced halves
  `eslint.config.base.js` and `.husky/framework-gates.sh`, and the additive
  `permissions.allow` merge of `.claude/settings.json`.
- **Volatile-facts lints block.** `FILE-LINE` and `CURRENT-STATE` are ERROR in
  `skills:check` and `docs:check` after the prose sweep: dated tool releases and
  verifications moved to the ADR-0003 ledger, line-number citations became
  symbol names, and the updater release narration in `README.md`,
  `INSTALLER.md` and `CONTEXT.md` became behaviour statements pointing here.

### Fixed

- `bun run git:policy verify`, `--stamp` and `apply` honour
  `policy.accepted_divergences` (#31).
- The OpenCode plugin loads on both plugin generations; Codex stdio MCP servers
  start through a `.env` loader (#33).

### Upgrading a project

`bun run up` delivers the wave; its parity prompt names what a project must
merge by hand (hooks, `eslint.config.js`, `AGENTS.md` sections, missing
`.agents/project.yaml` blocks). After it, `bun run repo:check` fails on any
`FILE-LINE` or `CURRENT-STATE` hit in the project's own committed prose: name
the owner instead of the value, or mark a line that must keep it with
`volatile-ok: <reason>`.

## 2026-10-02 — Skills by name plus mode; command aliases and sync-ai-memory retired (updater 8.5)

Port of the sibling `agentic-qa-boilerplate` retirements (its PRs #52 and #55),
adapted to this repo. Decision record: ADR-0006.

### Removed

- **BREAKING**: the command-alias layer. `.agents/compatibility/command-aliases.json`,
  the project overlay contract and every generated wrapper under
  `.claude/commands/` and `.opencode/commands/` are gone, with the `commands`
  updater component and the `Commands` parity surface. Invoke a skill by its
  name plus a mode instead: `/project-context data`, `/jira-administration
  components` on Claude Code, the skill and mode in prose on OpenCode and Codex.
- **BREAKING**: the `sync-ai-memory` skill. `bun run docs:check` and
  `agents:compat:check` cover its mechanical half; the judgment half is
  `agentic-dev-core/references/docs-follow-through.md`, run in the same PR as
  the change.

### Added

- `agents:compat:check` fails on a harness command named like a repo skill (it
  hides the skill's instructions); `agents:compat`, `bun run up` and `bun run
  setup` move it to `.backups/shadowing-commands/`, never delete it.
- A `## Mode routing` section in every multi-mode skill: the first token of
  `$ARGUMENTS` is the mode.

### Upgrading a project

`bun run up` removes the retired manifest, the wrappers it generated and the
`sync-ai-memory` skill folder through `deprecatedFiles` (listed on `--dry-run`;
regenerable files, no backup). A command the project declared itself stays as a
plain harness command it edits by hand; a leftover
`command-aliases.project.json` gets one informational parity row. A lock that
still carries the `commands` cursor is ignored.

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
