# The installer — what `bun run setup` configures

> **Audience**: developers cloning `agentic-dev-boilerplate` for the first time, anyone deciding whether to opt into the gentle-ai ecosystem, or anyone trying to understand which CLI / skill / MCP layer does what.
> **Read time**: 10 minutes.
> **Status**: updated 2026-09-03: three-harness selection (Claude Code / OpenCode / Codex), compatibility repair at the end of install, doctor rows for the multi-harness contract.

This doc is the **contract that `cli/install.ts` implements**. It covers the four installer layers — gentle-ai (~30%), community skills via `bunx skills add` (~25%), locally committed workflow skills (~20%), the canonical MCPs (~15%) — plus the external CLI verification step, the multi-harness compatibility repair that closes the run, and the opt-out path.

## Before you run setup — prerequisites

`bun run setup` assumes a few tools already exist on `PATH` and that you've already installed **at least one** AI agent: Claude Code, OpenCode or Codex. The unified front-of-house checklist lives in [README → Prerequisites](README.md#prerequisites); this is the same list with installer-flavored detail (exact check location, exact failure message, exact code reference).

### Harness detection (Step 4)

The installer detects all three harnesses and lets you pick which to configure. Everything detected is pre-checked; you untick whatever you do not want. `INSTALL_AGENTS=claude-code,opencode,codex` (any subset) overrides the prompt, which is also what a non-TTY run falls back to.

| Harness     | Counts as detected when                                                         | Note                                                                                     |
| ----------- | ------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------- |
| Claude Code | `~/.claude/` exists **or** the `claude` binary is on PATH                       |                                                                                          |
| OpenCode    | `~/.config/opencode/` exists **or** the `opencode` binary is on PATH            |                                                                                          |
| Codex       | the `codex` binary is on PATH **or** this repo already has `.codex/config.toml` | Codex Desktop needs no separate entry: it consumes the same repository config as the CLI |

### Hard blockers — installer exits 1 if missing

| What                                 | Min version | Checked at                                                                                                                                      | Failure message                                                                                    |
| ------------------------------------ | ----------- | ----------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------- |
| **Bun**                              | `>= 1.0.0`  | `cli/doctor.ts --preflight` — runs before `cli/install.ts` loads, because install.ts uses Bun built-ins (`runPreflight()`, `doctor.ts:421-446`) | `✗ Preflight failed: Bun X.Y.Z is older than required 1.0.0`                                       |
| **`node_modules/@inquirer/prompts`** | present     | `cli/doctor.ts --preflight` (`INQUIRER_MARKER`, `doctor.ts:45`)                                                                                 | `✗ Preflight failed: Project dependencies not installed (node_modules/@inquirer/prompts missing).` |
| **Claude Code, OpenCode or Codex**   | any         | `cli/install.ts` Step 4 — config directory, binary on PATH, or `.codex/config.toml` in the repo (`detectAgents()`)                              | `No agent executable or Codex repository configuration detected.` followed by all three docs URLs  |
| **`git` + `tar`**                    | any         | Scaffolder upfront (`packages/create-agentic-dev/src/runners.ts:13-31` for `bun`/`git`; `download.ts:25` for `tar`)                             | `ENVIRONMENT: git is required but not found on PATH.` / `GNU/BSD tar not found on PATH.`           |

### Quasi-required — installer warns and offers install commands

| What          | Min version | Checked at                                                                               | Behavior when missing                                                                                                                                                                                                       |
| ------------- | ----------- | ---------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **gentle-ai** | `>= 1.26.5` | `cli/install.ts` Step 2 — `which gentle-ai` + `gentle-ai version` (`install.ts:385-410`) | `log.warn` + interactive prompt offering to print install commands (`brew install gentle-ai` / `go install …@latest`) and exit. Decline → continues without it. Too old → warns and continues with `gentle-ai update` hint. |

### Per-skill CLIs — lazy-required, non-blocking at setup

`cli/install.ts` Step 11 (`verifyExternalClis()`, `install.ts:929-953`) does a **PATH probe only** — runs `which <name>` on POSIX, `where <name>` on Windows. Presence only, no version check. For each missing entry the installer prints:

- `quick:` line — a cross-platform install command (only when one exists, e.g. `bun add -g vercel` or `bun add -g @playwright/cli@latest`).
- `docs:` line — the upstream install guide URL.

Each entry is required by one or more skills; install them as you need them.

| Tool             | Required by                                                                                                          | Source-of-truth                                                          |
| ---------------- | -------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------ |
| `gh`             | `/git-flow-master`, `/sprint-development` (PR ops, deploy hand-off), optional `gh repo create` step in the installer | <https://github.com/cli/cli#installation>                                |
| `acli`           | `/acli`, `/sprint-development`, `/product-management` (Jira / Confluence from terminal)                              | <https://developer.atlassian.com/cloud/acli/guides/install-acli/>        |
| `playwright-cli` | `/playwright-cli`, `/sprint-development` (agent-driven browser automation, E2E checks)                               | <https://playwright.dev/agent-cli/introduction>                          |
| `supabase`       | `/supabase`, `/supabase-postgres-best-practices`, `/project-bootstrap`                                               | <https://supabase.com/docs/guides/local-development/cli/getting-started> |
| `vercel`         | `/vercel-cli`, `/deploy-to-vercel`, `/sprint-development` (staging + production deploys; verification, env sync, debug, rollback)        | <https://vercel.com/docs/cli>                                            |
| `resend`         | `/resend-cli`                                                                                                        | <https://resend.com/docs/cli>                                            |
| `jq`             | `/acli` JSON pipelines (`acli ... --json \| jq ...`)                                                                 | <https://jqlang.org/>                                                    |

### Convenience opt-ins — never required

| Tool     | What it buys you                                                                                                                                                                                                                                                                             | Check                                               |
| -------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------- |
| `direnv` | Bare `claude` / `opencode` / `codex` see MCP credentials automatically when you `cd` into the repo. Without it, use the `bun run claude` / `bun run opencode` / `bun run codex` wrappers (cross-platform, no setup). The installer offers `direnv allow` and a shell hook — safe to decline. | `cli/install.ts` Step 10 (`detectDirenv()` + offer) |

> **Windows users**: skip direnv. PowerShell support is experimental and needs direnv 2.37+; Git Bash works but the `bun run claude` wrapper is simpler everywhere. Decline the installer's direnv prompt — the wrappers already load `.env`.

### MCP credentials — 9 env vars filled into `.env`

The MCP config of every selected harness ships with credential placeholders: `${VAR}` in `.mcp.json` (Claude Code), `{env:VAR}` in `opencode.jsonc` (OpenCode), `env_vars` / `bearer_token_env_var` keys in `.codex/config.toml` (Codex). The installer resolves required vars by scanning those committed configs (`discoverRequiredEnvVars()`) — current list backs the MCP servers those configs declare (four out of the box) and the Atlassian CLI (context7 needs none):

```
TAVILY_API_KEY
ATLASSIAN_EMAIL · ATLASSIAN_API_TOKEN
SUPABASE_ACCESS_TOKEN · NEXT_PUBLIC_SUPABASE_URL · SUPABASE_PUBLISHABLE_KEY · SUPABASE_SECRET_KEY
N8N_API_URL · N8N_API_KEY
```

The Atlassian **site host** is deliberately not in that list. The installer prompts for it at day-0 and writes it to `.agents/project.yaml` -> `issue_tracker.atlassian_url`, not to `.env` — a hostname is not a secret, it is project identity, and while it sat in `.env` a stale copy inherited from the parent shell shadowed the file in silence. Read it back with `bun run --silent jira:url`.

Generation is interactive (web logins + 2FA), so the installer cannot do it for you. `.env.example` has the full template with per-var comments. Run `bun run setup:doctor` at any time to see which are still missing — every pending credential carries a `where` URL (Tavily dashboard, Atlassian token page, Supabase project settings, n8n API panel).

### Where to verify your status

`bun run setup:doctor` re-runs every check above (read-only) plus the MCP `.env` vars, direnv state, and the multi-harness contract: instructions (`AGENTS.md` present, `CLAUDE.md` is the exact shim), the `.claude/skills` alias, wrapper counts per host, the three hook adapters, MCP parity across the three configs, and **Codex repository trust**. The trust row is WARN, never FAIL: project `.codex/` config and hooks load only in a repository you have marked trusted, and that is runtime state no file read can verify. Use the doctor after a partial setup to confirm a fix without re-running the full installer. JSON mode (`--json`) emits `pending_actions[]` with `type` / `target` / `hint` / `where` so an AI agent can iterate the list and pick the right tool per item.

---

## Running setup from an AI agent

Most users today ask an AI (Claude Code, OpenCode, Codex, …) to drive the setup instead of running it by hand. The installer is built for both flows; the AI path uses a few specific entry points:

### `bun run setup:doctor` — read-only health check

The fastest way for an AI to figure out **what's wired and what's missing** without changing anything:

```bash
bun run setup:doctor          # human-readable summary
bun run setup:doctor --json   # machine-readable, parse with jq / agent
```

Exit code: `0` when everything is green, `1` when any pending action remains. JSON shape:

```json
{
  "status": "needs-action",
  "platform": "linux",
  "shell": "/usr/bin/bash",
  "is_tty": true,
  "env_vars": { "TAVILY_API_KEY": "set", "N8N_API_KEY": "missing", ... },
  "direnv": { "installed": true, "version": "2.25.2", "envrc_allowed": true, "hook_in_rc": true, "rc_file": "/home/user/.bashrc" },
  "pending_actions": [
    { "type": "credential", "target": "N8N_API_KEY", "hint": "n8n API key for the n8n MCP server", "where": "n8n instance → Settings → API" },
    { "type": "shell_hook", "target": "~/.bashrc", "hint": "Add direnv hook ...", "where": "eval \"$(direnv hook bash)\"" }
  ]
}
```

`pending_actions[].type` is one of: `credential` · `shell_hook` · `system_install` · `shell_command`. The AI iterates the list and picks the right tool per type:

| type             | Who handles it | How                                                                                                                             |
| ---------------- | -------------- | ------------------------------------------------------------------------------------------------------------------------------- |
| `credential`     | **User**       | AI asks the user for the value in chat (e.g. "paste your Tavily key from https://app.tavily.com"). Then AI writes it to `.env`. |
| `shell_hook`     | **AI**         | AI appends the `where` line to the `target` rc file with its Edit/Bash tool. Trivial.                                           |
| `system_install` | **User**       | AI shows the `where` command; the user runs it (brew/winget/apt may prompt for admin password).                                 |
| `shell_command`  | **AI**         | AI runs the `target` command via Bash.                                                                                          |

### What an AI **cannot** do (hard limits)

- **Generate API tokens** — Tavily / Atlassian / Supabase / n8n keys all require an interactive web login + 2FA. The user creates and pastes them; the AI never sees the generation flow.
- **Decide business config** — e.g. which Supabase project to target, which n8n instance to use, etc. The AI suggests; the user decides.
- **Execute privileged installs cleanly** — `brew install`, `winget install`, `apt install` may show a sudo/admin prompt that lives outside the agent's terminal. The AI runs the command but the user clicks "allow".

### `bun run setup --non-interactive` (or just `bun run setup` without a TTY)

The installer auto-detects no-TTY (an agent invoking it without a terminal) and silently switches to `--non-interactive`. Prompts skip with their default answer. The closing summary lists pending env vars and next steps — same data the doctor exposes. Use this path when the AI wants to run the full setup batch:

```bash
INSTALL_AGENTS=claude-code,opencode,codex \
  TAVILY_API_KEY=tvly-... \
  ATLASSIAN_EMAIL=... \
  ATLASSIAN_API_TOKEN=... \
  SUPABASE_ACCESS_TOKEN=... \
  bun run setup --non-interactive
```

`INSTALL_AGENTS` is optional: without it the non-interactive run configures every harness it detected.

The Atlassian host cannot be passed this way, by design: `agents:setup` refuses to seed `issue_tracker.atlassian_url` from the environment, so a stale inherited value can never overwrite the versioned one on an unattended run. Set it once, interactively:

```bash
bun run agents:setup          # fills .agents/project.yaml
bun run --silent jira:url     # confirm what the tooling resolves
```

Then `bun run setup:doctor --json` to confirm the rest.

### Skip flags (per-step opt-out)

| Env var                                     | Effect                                                                        |
| ------------------------------------------- | ----------------------------------------------------------------------------- |
| `INSTALL_SKIP_DIRENV=1`                     | Skip direnv detection / autoload                                              |
| `INSTALL_AGENTS=claude-code,opencode,codex` | Configure exactly these harnesses (any subset), skipping the selection prompt |

---

## Launching the agent after setup

`bun run setup` finishes with two recommended ways to start an agent so MCP env vars (e.g. `TAVILY_API_KEY`, `ATLASSIAN_API_TOKEN`, `SUPABASE_ACCESS_TOKEN`, `N8N_API_KEY`) get loaded from `.env`:

| Method                                                                | Platform                                                                                      | One-time setup                                                                                                                                          | Usage                                                          |
| --------------------------------------------------------------------- | --------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------- |
| **`bun run claude` / `bun run opencode` / `bun run codex`** (default) | Windows, macOS, Linux                                                                         | None — `dotenv-cli` is a project devDep; each wrapper passes `-o` so `.env` wins over an inherited shell variable                                       | `bun run claude` from the repo root                            |
| **direnv autoload** (optional)                                        | macOS, Linux, **Windows** (Git Bash recommended; PowerShell experimental, needs direnv 2.37+) | Install direnv (`brew install direnv` / `apt install direnv` / `winget install direnv`) + add hook to your shell rc, then installer runs `direnv allow` | Just `claude`, `opencode` or `codex` from anywhere in the repo |

### direnv hook per shell

| Shell      | Line to add                               | File                                             |
| ---------- | ----------------------------------------- | ------------------------------------------------ |
| bash       | `eval "$(direnv hook bash)"`              | `~/.bashrc` (also works for Git Bash on Windows) |
| zsh        | `eval "$(direnv hook zsh)"`               | `~/.zshrc`                                       |
| fish       | `direnv hook fish \| source`              | `~/.config/fish/config.fish`                     |
| PowerShell | `Invoke-Expression "$(direnv hook pwsh)"` | `$PROFILE` (requires direnv 2.37+, experimental) |

All three MCP configs are committed with credential placeholders — `${VAR}` in `.mcp.json` (Claude Code), `{env:VAR}` in `opencode.jsonc` (OpenCode), `env_vars` / `bearer_token_env_var` keys in `.codex/config.toml` (Codex). Real values live in `.env` (gitignored). If a server returns 401/403 at first call, the matching env var is missing — see `AGENTS.md` Critical Rule #9 (stop, fix `.env`, restart the agent session).

---

## Git strategy setup (agent-driven, before your first push)

The scaffold ships a **default** git strategy (`solo-main`) with `meta.strategy_source: inherited` in `.agents/project.yaml` — a placeholder nobody chose for YOUR project (`packages/create-agentic-dev/src/prepare.ts` resets the provenance stamps on scaffold). Defining it is an explicit step, not an inherited fact: once your project identity is filled in, ask your AI agent:

> **"set up our git strategy"**

That runs git-flow-master's Strategy Setup: it resolves your branching flow (solo-main / main-integration / trunk-based / others), asks the merge + hotfix + protection-policy questions, materializes any long-lived branches, and writes the `git_strategy:` block with `strategy_source: chosen`. Until you do this, the agent will OFFER Strategy Setup on your first git intent — that offer is the signal that this setup is pending, not a bug. At any point, `bun run git:policy verify` reconciles the declared policy against the host's actual branch ruleset (and `apply` writes it — dry run until `--yes`).

---

## Optional UX upgrades

Two community tools that the closing summary recommends. Both are **user-level** (not installed by `bun run setup`) because they modify your global environment, not this repo. They are recommended, not required.

### caveman — token compression skill

What it does: rewrites how the agent talks. Drops articles, fillers, and pleasantries; keeps technical terms exact; code blocks, errors, and security warnings stay in normal English. Net effect on this repo's defaults: ~65–75% fewer output tokens per turn with no loss of substance.

Why we recommend it: every workflow in this repo (`/sprint-development`, `/project-foundation`, `/design-system`, etc.) emits long status reports. Caveman compresses the conversational part without touching the actionable part.

Install (one-time, user-level, ~30s, requires Node ≥ 18):

```bash
# macOS / Linux
curl -fsSL https://raw.githubusercontent.com/JuliusBrussee/caveman/main/install.sh | bash -s -- --no-hooks

# Windows PowerShell
npx -y github:JuliusBrussee/caveman --no-hooks
```

> **Why `--no-hooks`.** The installer defaults to `--all`, which installs the Claude Code plugin **and** writes a second copy of the same two hooks into `~/.claude/settings.json`. Both copies then fire on every turn, so caveman is injected twice per prompt for no benefit. `--no-hooks` keeps the plugin (which registers those hooks itself, in its own `plugin.json`), the multi-agent coverage that matters here because this repo also runs on OpenCode, and the `caveman-shrink` MCP proxy. It only skips the duplicate registration.
>
> Already installed without the flag? Delete the `hooks` block from `~/.claude/settings.json`. Nothing else needs to change, and no files are removed: the scripts under `~/.claude/hooks/` simply stop being registered.
>
> On Windows the one-liner cannot take flags (`irm | iex` gets no arguments, see caveman issue #565), so the command above calls the same Node installer the script would have delegated to.

Levels: `lite` (light trim), **`full`** (this repo's default), `ultra` (max compression), `wenyan` (classical Chinese register). Switch with `/caveman lite|full|ultra|wenyan`.

Revert triggers (EN + ES): `"normal mode"`, `"habla normal"`, `"stop caveman"`, `"speak normally"`, `"be verbose"`, `"más detallado"`. Caveman boundaries are built-in — code, commits, PRs, and security warnings always render in normal English.

Docs: <https://github.com/JuliusBrussee/caveman>

If caveman is **not** installed, `AGENTS.md` §1 #11 becomes a no-op and the agent writes normal terse output. No errors, no degraded behavior. Caveman and Engram are Claude Code plugins; on OpenCode and Codex the rules that mention them are no-ops in the same way.

### ccstatusline — Claude Code statusline configurator

What it does: a TUI configurator for the Claude Code bottom statusline. Lets you surface model name, token usage, current git branch, context-window utilization, and similar metadata at a glance.

> ⚠️ **Run in a SEPARATE terminal with NO agent active.** ccstatusline is a TUI that grabs stdin. If you launch it while Claude Code or OpenCode is running in the same terminal, the two will fight over input and one will hang. Open a fresh terminal, run the command, configure, exit. Then start the agent.

Install + configure (run anywhere, one-time, ~1 min):

```bash
bunx -y ccstatusline@latest
```

Docs: <https://github.com/sirmalloc/ccstatusline>

Cosmetic upgrade — does not change agent behavior. Skip if you prefer the default statusline.

---

## What is gentle-ai and why this repo uses it

[gentle-ai](https://github.com/Gentleman-Programming/gentle-ai) is a user-level installer that configures AI agents (Claude Code, OpenCode, Cursor, etc.) with curated capabilities. It does not install agents themselves — it tunes the agents you already have.

This repo treats gentle-ai as the install vehicle for **Engram**, the MCP-based persistent memory layer that survives across sessions and compactions. The `bun run setup` invocation uses `gentle-ai install --preset minimal`, which installs **only** Engram — no SDD bundle, no extra skills.

The integration is **not strict**. If you choose to skip gentle-ai, the repo still works: workflow skills committed locally (`/sprint-development`, `/project-foundation`, etc.) keep functioning, and the canonical MCPs are still configured. What you lose is persistent cross-session memory. Section "How to opt out" below details the trade-off.

---

## What gets installed via gentle-ai

When `bun run setup` runs the gentle-ai branch (Engram only, repeated per agent):

### Engram (MCP component, not a skill)

| Slug     | Type      | What it does                                                                                                |
| -------- | --------- | ----------------------------------------------------------------------------------------------------------- |
| `engram` | Component | Persistent memory across sessions. Auto-saves decisions, bugs, conventions; auto-recalls on session resume. |

> The installer dispatches a single call per agent:
>
> ```sh
> gentle-ai install --agent <agent> --preset minimal
> ```
>
> `--preset minimal` resolves to the `engram` component only (per gentle-ai's `componentsForPreset(PresetMinimal)` source). Re-runs are idempotent: gentle-ai snapshots existing config files (compressed, deduplicated, last 5 retained) before overwriting them with the current version. There is no `--yes` flag — non-interactive runs inherit a non-TTY stdin, so gentle-ai's internal prompts auto-pick their default answer.

---

## What stays local (committed in this repo)

Skills that are workflow-specific to this boilerplate live in `.agents/skills/` and are committed to the repo. They install with the clone — no external installer required. All three harnesses read that one directory (§ Multi-harness layout below); project-level community skills (`bunx skills add`) install into the same store, so there is never a second copy per harness.

| Skill                 | Trigger                                         | Why it stays local                                                                                                                                                                                      |
| --------------------- | ----------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `agentic-dev-core`    | (auto, cited by other skills)                   | Passive reference host for shared doctrine (briefing template, dispatch patterns, orchestration, skill-composition strategy). Loaded on demand by workflow skills — not invoked directly.               |
| `project-foundation`  | `/project-foundation`                           | Constitution + PRD + SRS + Discovery (one-time per product)                                                                                                                                             |
| `design-system`       | `/design-system`                                | DESIGN.md (Google Labs spec, 5 paths) pre-scaffolding + opt-in per-story screen-mapping phase (design briefs → `master-design-plan.md`)                                                                 |
| `project-bootstrap`   | `/project-bootstrap`                            | Backend + frontend skeleton + features (OpenAPI, auth, env)                                                                                                                                             |
| `testability-guide`   | `/testability-guide`                            | `/qa` page + tool-agnostic credentials artifact (Jira / Confluence / Notion / MCP / CLI / manual). Idempotent re-runs on stack drift.                                                                   |
| `product-management`  | `/product-management`                           | Backlog seeding + epic creation + INVEST/AC refinement                                                                                                                                                  |
| `sprint-development`  | `/sprint-development`                           | Per-story dev loop (mega-orchestrator, 12-step workflow)                                                                                                                                                |
| `unit-testing`        | `/unit-testing`                                 | TDD slice — composable mid-flight from `/sprint-development`                                                                                                                                            |
| `autonomous-delivery` | `/autonomous-delivery`                          | Scheduled / unattended delivery runs: audit real state, select genuinely unblocked work, dispatch the owning pipeline skill, report (`story` / `bug` / `discovery` modes)                               |
| `git-flow-master`     | (auto)                                          | Branching/commit/push/PR strategy auto-detected per repo                                                                                                                                                |
| `jira-administration` | `/jira-components` · `/jira-instance-migration` | Bounded Jira admin workflows, one mode per run (`components`, `instance-migration`), sealed behind explicit approval                                                                                    |
| `project-context`     | `/project-context` + aliases                    | Business maps, master implementation plan, dev roadmap. Modes `data` · `features` · `api` · `master-plan` · `dev-roadmap`; the six former inline commands alias into it                                 |
| `sync-ai-memory`      | `/sync-ai-memory`                               | Audit + sync `README.md`, `AGENTS.md`, `CONTEXT.md`, `docs/`, onboarding HTML. Stops on operational prose in the `CLAUDE.md` shim                                                                       |
| `acli`                | (auto)                                          | Atlassian CLI wrapper for Jira/Confluence terminal work                                                                                                                                                 |
| `vercel-cli`          | (auto on `vercel`)                              | Vercel CLI cookbook — deployment verification (poll commit SHA + `inspect --wait`), env var sync, build/runtime log streaming, rollback, `.vercel/` linking. Companion to community `/deploy-to-vercel` |
| `agentic-dev-onboard` | `/agentic-dev-onboard`                          | End-to-end onboarding guided tour (pending Phase C)                                                                                                                                                     |

These skills evolve with the repo and are versioned in git. The split is intentional: gentle-ai owns the **horizontal** ecosystem (apply across all your repos), this repo owns the **vertical** workflow (specific to `agentic-dev-boilerplate`).

### Slash commands are transport, not workflow

Eight slash commands survive as thin aliases onto the skills above. Each entry in `.agents/compatibility/command-aliases.json` names a target skill plus a mode; the generated wrapper only selects and forwards `$ARGUMENTS`. `agents:compat:check` rejects an alias whose target skill or declared mode does not exist.

| Command                       | Target skill          | Mode                 |
| ----------------------------- | --------------------- | -------------------- |
| `/business-data-map`          | `project-context`     | `data`               |
| `/business-feature-map`       | `project-context`     | `features`           |
| `/business-api-map`           | `project-context`     | `api`                |
| `/master-implementation-plan` | `project-context`     | `master-plan`        |
| `/dev-roadmap`                | `project-context`     | `dev-roadmap`        |
| `/sync-ai-memory`             | `sync-ai-memory`      | (single)             |
| `/jira-components`            | `jira-administration` | `components`         |
| `/jira-instance-migration`    | `jira-administration` | `instance-migration` |

On Codex there are no wrappers at all: invoke the target skill and its mode directly.

---

## Multi-harness layout: one source, three consumers

The installer configures whichever of **Claude Code, OpenCode, and Codex** you selected in Step 4, but it never duplicates content to do it. There is exactly one copy of every instruction and every skill; where the harnesses genuinely differ (MCP file format, hook API, whether slash commands exist at all) each keeps a thin versioned adapter.

| Surface          | Claude Code                                     | OpenCode                                    | Codex CLI + Desktop                      |
| ---------------- | ----------------------------------------------- | ------------------------------------------- | ---------------------------------------- |
| **Instructions** | `CLAUDE.md` → `@AGENTS.md` **[generated shim]** | `AGENTS.md` (native)                        | `AGENTS.md` (native)                     |
| **Skills**       | `.claude/skills` **[generated alias]**          | `.agents/skills/` (native)                  | `.agents/skills/` (native)               |
| **Commands**     | `.claude/commands/*.md` **[generated]**         | `.opencode/commands/*.md` **[generated]**   | none: invoke the skill + mode directly   |
| **Hook**         | `.claude/settings.json` → `UserPromptSubmit`    | `.opencode/plugins/personality-reinject.js` | `.codex/hooks.json` → `UserPromptSubmit` |
| **MCP**          | `.mcp.json`                                     | `opencode.jsonc`                            | `.codex/config.toml`                     |

- **Instructions.** `AGENTS.md` is the only instruction body. OpenCode and Codex load it natively; Claude Code loads `CLAUDE.md`, which is exactly `@AGENTS.md` plus one newline. A documented import rather than a symlink, so it survives a Windows checkout.
- **Skills.** All 16 committed skills live in `.agents/skills/`, and the community project-level skills install into the same store. Claude Code reaches that tree through `.claude/skills`, a POSIX symlink (Windows junction) that is generated and gitignored: never committed, never hand-edited.
- **Commands.** The 8 slash commands carry no workflow body. Both wrapper sets are short files generated from `.agents/compatibility/command-aliases.json`; each names a target skill plus a mode and forwards `$ARGUMENTS`. Codex skips the wrapper layer and invokes the skill directly.
- **Hook.** `.agents/hooks/personality-reinject.mjs` holds the contract text once. Claude Code and Codex run it as a command hook (`.claude/settings.json` and `.codex/hooks.json`, the latter with a POSIX and a PowerShell command); OpenCode imports the constant from `.opencode/plugins/personality-reinject.js`.
- **MCP.** The canonical server set is whatever `.mcp.json` declares (`context7`, `tavily`, `supabase`, `n8n` out of the box); every server there must exist in the other two configs. Parity is checked semantically: each native format is normalized before comparison and matched on the `.env` variables each server depends on, so a server missing from one host, or present in one host only, is a failure. The four boilerplate-known ids additionally get a strict per-host shape check when the project declares them; any other server gets the generic check only, so a downstream project may add or drop servers freely. Codex cannot expand `${VAR}` inside `args`, so `.codex/config.toml` reaches `tavily` over HTTP with `bearer_token_env_var` and passes `supabase` env-only auth. `docs/mcp/*.template.*` stay as opt-in templates for hosts without a runtime adapter (Gemini CLI, Cursor).

### Regenerating and verifying

Bold `[generated]` cells above are output. Edit the source, then regenerate:

| Generated artifact                                  | Its source                                   | Regenerate              |
| --------------------------------------------------- | -------------------------------------------- | ----------------------- |
| `CLAUDE.md` (one-line `@AGENTS.md` shim)            | `AGENTS.md`                                  | `bun run agents:compat` |
| `.claude/skills` (POSIX symlink / Windows junction) | `.agents/skills/`                            | `bun run agents:compat` |
| One Claude + one OpenCode wrapper per alias (8 upstream, plus any project-declared) | `.agents/compatibility/command-aliases.json`, overlaid by the optional `command-aliases.project.json` | `bun run agents:compat` |

A project that needs its own slash commands declares them in `.agents/compatibility/command-aliases.project.json` (same schema as the upstream manifest; optional; bootstrap-only, so `bun run up` never overwrites it). The engine reads the upstream aliases first, then the overlay: same `alias` replaces, new `alias` adds, `wrapperHosts` always come from upstream. A wrapper file that neither manifest produced is reported by name (`Command wrapper not declared in any manifest: <path>; add it to .agents/compatibility/command-aliases.project.json or delete it`) and never deleted by the repair.

You rarely run either command by hand. `bun run setup` and `bun run up` both call the same repair internally at the end of their run: they create or fix the alias, rewrite any stale wrapper, and then re-verify, so a clean install and a routine update both leave the contract satisfied without a manual step. The scaffolder (`create-agentic-dev`) ships nothing generated; the alias appears the first time `bun run setup` runs in the new project.

`bun run agents:compat:check` validates the whole contract — shim bytes, alias target, both wrapper sets byte-for-byte against the manifest, hook adapters, MCP parity. It runs inside `bun run repo:check`, unconditionally in the pre-push hook, and in pre-commit when a staged path touches `AGENTS.md`, `CLAUDE.md`, `.agents/`, `.claude/`, `.opencode/`, `.codex/`, `.mcp.json` or `opencode.jsonc`. A wrapper that grew a body fails as `contains workflow prose`. `bun run setup:doctor` reports the same surfaces plus **Codex repository trust**, which is runtime state no file read can verify: project `.codex/` config and hooks load only in a repository you have marked trusted, so the doctor reports it as WARN, never FAIL.

### Updating a project created before the multi-harness move

A project scaffolded when instructions lived in `CLAUDE.md` and skills in `.claude/skills/` gets a one-time migration the first time it runs `bun run up`. It happens **before** any component is synced, because the sync alone would be destructive: `CLAUDE.md` is a synced file whose upstream copy is now the one-line shim, and `AGENTS.md` is on the never-synced watchlist, so a plain sync would replace the project's AI memory with a pointer to a file that does not exist.

The migration promotes the project's memory from `CLAUDE.md` to `AGENTS.md` and leaves `CLAUDE.md` as the shim; moves every skill under `.claude/skills/` into `.agents/skills/`, project-authored ones included; and archives (never overwrites) any legacy skill whose name the canonical store already owns. Nothing is deleted: what is not moved is preserved under `.template/pre-agents-migration/` (gitignored). The pass is idempotent, and if a single item cannot be resolved without guessing it refuses in full, before touching anything, rather than applying halfway. A shim found without an `AGENTS.md` beside it is reported as an orphaned shim with a recovery command instead of being synced over.

After that one update, the project works in Claude Code, OpenCode and Codex from the same source. See [**Una fuente, tres harnesses**](https://upex-galaxy.github.io/agentic-dev-boilerplate/harnesses.es.html) for the full picture and [`ADR-0002`](.context/ADR/ADR-0002-multi-harness-single-source.md) for the decision record.

### What every `bun run up` reports

The run ends with a single "Estado por superficie" table: one row each for Instrucciones y config, Skills, Comandos, Hooks, MCP, Env, Componentes, package.json, Git and Verificación (10 rows), with an ok or warn glyph. Below it comes ONE parity prompt, printed and saved to `.agents/prompts/parity-plan.md` (gitignored, single-use). Each row of the prompt names a surface, a file and concrete evidence: headings added, removed or changed in a watched file plus hunk counts, a server declared in `.mcp.json` but missing from a host, a wrapper file no manifest produced, a skill archived under `.template/pre-agents-migration/` because of a name collision, a component held back, an env key that drifted. The prompt tells the AI to present that table and WAIT for a decision per row (`keep project | take upstream | merge`) before editing, then apply only the chosen rows and run tests, types and lint.

Two flags and one watchlist change shape that report. `--strict` exits 1 when the compat check fails or a blocking finding is present, for CI; without it the run warns and exits 0. `.claude/settings.json` is delivered once when the project lacks it (bootstrap-only, like `.codex/`) and is otherwise on the protected watchlist: the updater never overwrites it, so project permissions and hook edits survive, and any drift from upstream appears as a prompt row (a stale hook command is still caught by `agents:compat:check`). Since 8.2 the same holds for `.husky/pre-commit` and `.husky/pre-push` (project gates) and for every path a project lists under `updater.protected_paths` in `.agents/project.yaml`. Every row is one path: a stray wrapper is a single `add to overlay` row, and a watched file that also breaks a compat contract is one blocking row with both pieces of evidence. The self-update re-exec no longer rejects the dirty `cli/` it just produced, and the lock file plus `.backups/` never count as user dirt, so `--auto` runs unattended without `--force`. A run that applies nothing leaves the tree byte-identical (`git status` clean, the lock untouched). An aborted run, whatever the cause (dirty tree, corrupt lock, failed clone, declined migration or self-update), ends with `Abortado.` and exit 1 rather than a success line.

One more thing on the migration run itself: the `.claude/skills` alias is NOT created in that invocation. The migration unindexes the committed `.claude/skills/*` tree, and git refuses to rewrite index entries behind a symlink, so an alias created right away would break `lint-staged` on the very commit that records the migration. The run prints the next step and repeats it in the closing box: commit the migration, then `bun run agents:compat` creates the alias. The compat check treats the missing alias as expected while that commit is pending (a re-run before it keeps deferring); every other contract is still enforced. `bun run agents:compat:check` and `setup:doctor` print the alias status line (created, OK, deferred until the migration commit, missing) whatever the overall verdict, and group the errors per surface (instructions, alias, wrappers, hooks, MCP), so "alias pending commit" and "MCP drift" never read as one flat failure.

### What changed in updater 8.1

The first live run against a Next.js project surfaced a handful of gaps, all closed in 8.1:

- **Never a destructive default.** `take upstream` is suggested only where the project lacks the content entirely. A row naming project-only servers, keys, headings or edits suggests `merge`; an `opencode.jsonc` holding four project servers reads "only here: ... declare them in `.mcp.json` and `.codex/config.toml`, or remove them", still blocking, never "take upstream".
- **`--dry-run` previews with the new updater.** When upstream carries a newer `cli/`, the preview does not write it: the fetched updater runs from the upstream clone against the project (same flags, same cwd) and shows its migration plan, component preview and parity table. Nothing is written and the prompt is not saved (`[dry-run] prompt not saved`). Without a terminal on stdin and no `--auto` / `--interactive`, the run assumes `--auto` and prints one notice instead of hanging.
- **Post-sync gates.** After the apply, the project's `types:check` and `lint:check` run (120 s each; a gate that does not finish is skipped with a note; `--no-gates` disables them). A failure becomes a "Verificación" row with the exit code, the first error lines and which of the failing files this run applied, plus a `Gates:` line in the closing box. Informational only: never an abort, never blocking under `--strict`.
- **`package.json` rows.** Every key kept at the project's value while upstream differs is one `package.json` row (`scripts.repo:check: project value kept; upstream differs`), with both values in the saved file, so a non-interactive run no longer loses the FYI in the scrollback.
- **Overwritten project edits.** A synced file the project had edited (3-way against the lock cursor) and the run overwrote gets a `merge` row on Skills or Componentes: `project edit overwritten; backup: .backups/update-<ts>/<path>; N hunks vs applied`, with the full diff in the saved file.
- **Re-run safety.** The run records what it wrote in `.template/last-apply.json` (gitignored, sha256 per path). The next dirty-tree guard exempts a recorded path whose hash still matches, so `bun run up --auto` twice in a row, without committing in between, proceeds as a no-op (the previous prompt file is kept). An unrelated file, or a synced file edited by hand since, still aborts, naming `Commit sugerido` and the prompt path.
- **Host-agnostic `cli/**`.** The synced tests build env objects through `unknown`, and `cli/updater-host-types.test.ts` compiles `cli/**` with a required `NODE_ENV` on `ProcessEnv` (what `next/types/global.d.ts` adds) on every `bun test`.

### What changed in updater 8.2

The second live run (same project, after applying the 8.1 decisions) left three findings, all closed in 8.2:

- **Converging rows for project-customized synced files.** `.husky/pre-commit` and `.husky/pre-push` are on the protected watchlist (`project gates live here`): delivered once when missing, never overwritten, one drift row per upstream change with the hunks as evidence. A committed merge of a hook survives the next `bun run up --auto` and the row does not come back (marker semantics). The rest of `.husky/` (the `_/` helpers) keeps syncing.
- **`updater.protected_paths`.** A project lists any other synced file it merged by hand under `updater:` in `.agents/project.yaml` (repo-relative file paths, empty by default, documented in `.agents/README.md`). Listed paths join the watchlist at runtime with the same semantics: never overwritten, delivered once when missing, sparse checkout, drift row. A path outside the repo, under `.git`, a directory or a non-string is reported at the start of the run and ignored. The row for an overwritten project edit ends with `add the path to updater.protected_paths in .agents/project.yaml so the next sync keeps your merge`, and the saved prompt repeats it under the row as the YAML to paste. Since 8.3 a path just declared gets its upstream marker seeded with no row (one `sin fila esta vez` note); its drift row fires on the next upstream change.
- **Guard scope (8.3).** The dirty-tree guard blocks only on uncommitted work the sync would overwrite: a synced component file, an ignore file, `package.json`, a deprecated file. Dirt anywhere else (`tests/`, app code, a protected or bootstrap-only file) is listed as `N ruta(s) con cambios sin commitear fuera de lo que este updater escribe; no bloquean` and never aborts `--auto`.
- **`.context/PBI/` still tracked in git (8.3).** One Componentes row (`N tracked path(s) still in git ...; migration recipe saved to .agents/prompts/pbi-cache-migration.md`); the recipe (tag, `git rm --cached`, commit, resync, push-to-Jira pass) lives in that gitignored file, never in the terminal.
- **Cost signal on every config row.** A watched file with keys (JSON, JSONC, TOML, YAML) or headings (markdown) never gets a bare `merge`: project-only keys plus upstream additions read `port upstream additions only: <keys>; keep project-only key(s): <keys>`; only project-only keys read `keep project`; only upstream additions with nothing else different read `take upstream`; shared keys with different values are named. `tsconfig.json` in a Next.js host now says which keys to port and that `jsx`, `lib`, `paths` stay.
- **Identity files compare structure only.** `.agents/project.yaml` and `.agents/jira-required.yaml` (bootstrap-only, project-owned) fire an `informational` row listing the keys upstream added (`merge = add the new keys`), and no row at all when only values differ: those are the project's answers to upstream's scaffold, not drift.

---

## External CLIs (verified, not auto-installed)

Step 11 of `bun run setup` calls `verifyExternalClis()`. The installer **does not install** these — it does a **PATH probe only** (`which <name>` on POSIX, `where <name>` on Windows — presence only, no version check) and prints an install hint (`quick:` line when a cross-platform command exists) plus the official docs URL when something is missing. The verify-only stance is deliberate: these are platform-specific tools whose canonical install path differs by OS, and forcing one path would surprise users on others.

| CLI              | Powers in this repo                                                                             | Quick install (cross-platform only — else use docs) | Official docs                                                            |
| ---------------- | ----------------------------------------------------------------------------------------------- | --------------------------------------------------- | ------------------------------------------------------------------------ |
| `bun`            | General-purpose runtime + package manager — this repo runs on bun (scripts, install.ts, dev)    | — (OS-specific — see docs)                          | <https://bun.com/>                                                       |
| `gh`             | GitHub CLI — `gh repo create`, PR ops, `gh api`. Powers Step 9 of the installer                 | — (OS-specific — see docs)                          | <https://github.com/cli/cli#installation>                                |
| `supabase`       | Local Supabase stack, migrations, type generation (`bun run supabase:types`)                    | — (OS-specific — see docs)                          | <https://supabase.com/docs/guides/local-development/cli/getting-started> |
| `vercel`         | Deploy Next.js frontend to Vercel (staging + production via `/sprint-development` deploy steps) + verification, env sync, debug, rollback via `/vercel-cli` | `bun add -g vercel`                                 | <https://vercel.com/docs/cli>                                            |
| `resend`         | Send transactional email via Resend (used by features that integrate email notifications)       | — (OS-specific — see docs)                          | <https://resend.com/docs/cli>                                            |
| `acli`           | Atlassian CLI for Jira/Confluence terminal workflows — used by the `/acli` skill                | — (OS-specific — see docs)                          | <https://developer.atlassian.com/cloud/acli/guides/install-acli/>        |
| `playwright-cli` | Agent-driven browser automation — used by the `/playwright-cli` skill                           | `bun add -g @playwright/cli@latest`                 | <https://playwright.dev/agent-cli/introduction>                          |
| `jq`             | JSON processor — required by `/acli` skill for parsing `acli ... --json` output                 | — (OS-specific — see docs)                          | <https://jqlang.org/>                                                    |

**Cross-platform package-manager recommendation** (the installer prints the OS-matched one):

- **macOS / Linux** → Homebrew: <https://brew.sh>
- **Windows** → Scoop: <https://scoop.sh>

Once installed, use it to install any missing CLI from the table above. The installer NEVER auto-installs OS-specific tools (Rule 4).

### `playwright-cli` is NOT `@playwright/test`

A subtle bit of confusion lives in the Playwright ecosystem. There are **three different identities** that all use the name "playwright":

1. **`@playwright/test`** — a devDep test runner library, installed per-project. It produces no global binary. `which playwright` finds nothing even when this package is installed.
2. **`@playwright/cli`** — a global agent-driven CLI. Installs as the binary `playwright-cli`. This is what powers the `/playwright-cli` skill in this repo.
3. **`/playwright-cli`** — the community skill installed user-level by `bun run setup` (via `bunx skills add`, `cli/install.ts` `USER_LEVEL_SKILLS`). It calls the `playwright-cli` binary from `@playwright/cli`.

The installer verifies (2). If you need the test runner (1) for E2E suites, add it per-project: `bun add -D @playwright/test`.

### Why verify and not install?

Three reasons:

1. **Cross-platform install paths differ**. macOS prefers Homebrew, Windows prefers winget/scoop, Linux varies by distro. A single auto-install path would be wrong for most users.
2. **Global installs are user-scoped, not repo-scoped**. Installing `vercel` or `supabase` globally as part of `bun run setup` would leak state outside the repo. The installer is opinionated about staying local.
3. **Verify + point at docs** is the polite alternative. When a CLI is missing, the installer prints the official documentation URL on a continuation line so users can install the way that fits their setup.

---

## Troubleshooting

- **Jira catalogs sync (Step 13)** — one prompt picks the catalog source for the whole project: **My own Jira workspace** (auth loop → `jira:sync-fields --force` + `jira:sync-workflows --force`; **requires `Administer` permission**), **UPEX-Galaxy standard** (`--upex --force` downloads the reference catalogs from `upex-galaxy/agentic-dev-boilerplate@main` + `jira:sync-link-types --upex` — no admin, no Jira API), or **Skip for now**. Whatever the choice, the installer then writes an empty `{}` placeholder for any of `.agents/jira-fields.json` / `jira-workflows.json` / `jira-link-types.json` still missing on disk — guaranteeing the SKILL.md-referenced paths exist so `lint-skills` STALE-PATH never fails `repo:check` / the pre-push hook. The `{}` form is treated as "unpopulated", so a later `bun run jira:sync-*` fills it without `--force`.
- **`jira:sync-fields` / `jira:sync-workflows` skipped with "not an Administrator"** — your authenticated Jira user does not have `ADMINISTER` (global) or `ADMINISTER_PROJECTS` (project-scoped) permission. The scripts pre-flight `/rest/api/3/mypermissions` to avoid mid-run 403s. The installer records `state.postInstall.jiraSync* = "skipped-no-admin"` and exits Step 13 cleanly — repo stays usable (any missing catalog gets a `{}` placeholder, see above). Two recovery paths: (a) ask a Jira admin to run the scripts and commit the resulting `.agents/jira-*.json` to the team repo; (b) re-run `bun run setup --force-step 13-jira-sync` and pick the **UPEX-Galaxy standard** source — or run `bun run jira:sync-fields --upex && bun run jira:sync-workflows --upex` directly to pull the UPEX-standard catalog from `upex-galaxy/agentic-dev-boilerplate@main` (no admin, no Jira API calls — just a GitHub raw fetch).
- **Pre-push rejected — `lint:skills` STALE-PATH: `.agents/jira-fields.json` / `jira-workflows.json` does not exist on disk** — the bootstrap scaffolder prunes those two catalogs from a fresh project, and a no-admin / skipped Jira sync left the SKILL.md-referenced paths dangling. Setup now writes an empty `{}` placeholder for any missing catalog (Step 13), so a fresh `bun run setup` self-heals this. If you hit it on an older project, just create the files: `echo '{}' > .agents/jira-fields.json` and the same for `jira-workflows.json` (then optionally `bun run jira:sync-fields` to populate). The `{}` form is valid JSON, satisfies the lint, and is treated as "unpopulated" so a later sync fills it without `--force`.
- **`--upex` flag** — every `jira:sync-*` script (`fields`, `workflows`, `link-types`) accepts `--upex` to download the UPEX-standard reference JSON from the upstream boilerplate repo. URL is hardcoded per script and pinned to `main`. Bypasses ATLASSIAN_* env vars, `project_key`, `jira-required.yaml` and all Jira REST calls; only network requirement is GitHub raw access. Useful when (a) you have no Jira admin, (b) you want a working catalog without setting up auth, or (c) you want to compare against the canonical UPEX standard before custom-syncing.
- **gentle-ai not detected after install** — re-run `bun run setup`. The detector probes `which gentle-ai` plus `gentle-ai version`; if either fails the installer falls back to "skip gentle-ai" branch. Confirm the binary is on PATH (`which gentle-ai` should return a path under `/usr/local/bin/`, `~/bin/`, `~/go/bin/`, or a Homebrew prefix).
- **MCPs returning 401/403** — the matching env var in `.env` is unset or wrong. All three MCP configs (`.mcp.json`, `opencode.jsonc`, `.codex/config.toml`) are committed with placeholders; real values live in `.env`. Open `.env`, fill the var, and **restart the agent session** — env vars are read once at MCP-server spawn time. See `AGENTS.md` Critical Rule #9.
- **MCPs not loading at all** — confirm you launched the agent via `bun run claude` / `bun run opencode` / `bun run codex` (each wraps with `dotenv-cli`), or that direnv autoload is active (`direnv status` shows your `.envrc` allowed). Launching the bare binary without either path means MCP placeholders never get expanded.
- **Codex ignores `.codex/config.toml` and the hook never fires** — the repository is not marked trusted. Codex loads project `.codex/` config and hooks only in a trusted repo, and that is runtime state no file check can see. `bun run setup:doctor` reports it on its own WARN line; approve trust in Codex, then restart the session.
- **A slash command or the skills alias disappeared after an edit** — you probably hand-edited a generated wrapper under `.claude/commands/` or `.opencode/commands/`, or the `.claude/skills` alias. Fix the source instead: `.agents/compatibility/command-aliases.json` for commands, `.agents/skills/` for skills, then run `bun run agents:compat`. Verify with `bun run agents:compat:check`.
- **`agents:compat:check` fails with `contains workflow prose`** — a wrapper grew a body, or `CLAUDE.md` holds more than the one-line `@AGENTS.md` shim. Move the prose into the owning skill (or into `AGENTS.md`) and regenerate.
- **`direnv allow` produced `dotenv_if_exists: command not found`** — this would mean the `.envrc` is using a newer direnv feature than your version supports. The committed `.envrc` uses portable POSIX loading (works on direnv 2.21+), so if you see this, your `.envrc` has been edited locally — restore it from `git checkout .envrc`.
- **Skills not appearing in autocomplete** — restart Claude Code (or your agent of choice). MCP and skill configs are cached at agent startup. On Claude Code specifically, also confirm the `.claude/skills` alias exists; if a checkout dropped it, `bun run agents:compat` recreates it.
- **How do I uninstall Engram?** — `gentle-ai uninstall --agent <agent> --components engram --yes` removes Engram for that agent. `gentle-ai uninstall --all --yes` removes everything gentle-ai-managed for every supported agent. Backups are created automatically before uninstall.

---

## How to opt out

If you prefer not to use gentle-ai, the installer accepts a "skip" choice. To make it permanent:

1. Edit `.template/installer.state.json` and set `"gentleAi": { "status": "skipped" }`.
2. Re-run `bun run setup`. The installer detects the skipped state and only configures the canonical MCPs.

What you lose:

- **Persistent memory (Engram)** — no cross-session recall, no `mem_save` / `mem_search`. Each session starts blind.

What you keep: every workflow skill committed in this repo (`/sprint-development`, `/project-foundation`, etc.) and the canonical MCPs (Tavily, Context7, Supabase, n8n). The repo is fully usable without gentle-ai — the integration is additive.

---

## See also

- [.scratch/plans/GENTLE-AI-RESEARCH.md](./.scratch/plans/GENTLE-AI-RESEARCH.md) — full research doc on the gentle-ai ecosystem (commands, components, agent matrix)
- [AGENTS.md](./AGENTS.md) — the single instruction body every harness loads; §5.5 covers the multi-harness contract
- [CONTEXT.md](./CONTEXT.md) — context-engineering strategy and the surface-by-harness map (§2.1)
- [README.md](./README.md) — project overview and Quick Start
- [docs/setup/README.md](./docs/setup/README.md) — index of remaining setup guides (Jira, MCPs)

---

> **You are here**: What `bun run setup` configures. **Read time**: 10 min. **Next**: `bun run setup:doctor` to verify your install, or [`README.md`](README.md) to navigate the rest.
