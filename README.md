<div align="center">

<pre>
                  ░█████  ░██████ ░███████░███   ░██░████████░██ ░██████                         
                 ░██  ░██░██      ░██     ░████  ░██   ░██   ░██░██                              
                 ░███████░██  ░███░█████  ░██░██ ░██   ░██   ░██░██                              
  ██████████     ░██  ░██░██   ░██░██     ░██ ░██░██   ░██   ░██░██                              
  ██▀▀▀▀▀▀██     ░██  ░██ ░██████ ░███████░██  ░████   ░██   ░██ ░██████                         
  ██ ◉  ◉ ██     ░░   ░░  ░░░░░░  ░░░░░░░ ░░   ░░░░    ░░    ░░  ░░░░░░                          
  ██   3  ██                                                                                     
  ██████████     ░███████░███   ░██ ░██████ ░██░███   ░██░███████░███████░██████                 
   ██    ██      ░██     ░████  ░██░██      ░██░████  ░██░██     ░██     ░██  ░██                
                 ░█████  ░██░██ ░██░██  ░███░██░██░██ ░██░█████  ░█████  ░██████                 
                 ░██     ░██ ░██░██░██   ░██░██░██ ░██░██░██     ░██     ░██  ░██                
                 ░███████░██  ░████ ░██████ ░██░██  ░████░███████░███████░██  ░██                
                 ░░░░░░░ ░░   ░░░░  ░░░░░░  ░░ ░░   ░░░░ ░░░░░░░ ░░░░░░░ ░░   ░░                 
                               Full-Stack Software Engineer                                      
</pre>

<h3>The dev workflow, but AI runs it.</h3>

<p><i>From PRD to Jira stories to staging deploy. Built for real teams shipping real backlogs — every phase has a skill. You decide what to build.</i></p>

<br />

[![TypeScript](https://img.shields.io/badge/TypeScript-5.8+-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Bun](https://img.shields.io/badge/Bun-1.0+-000000?style=for-the-badge&logo=bun&logoColor=white)](https://bun.sh/)
[![License: MIT](https://img.shields.io/badge/License-MIT-EAB308?style=for-the-badge)](https://opensource.org/licenses/MIT)

</div>

<br />
<br />

<div align="center">

### Get started in one command

</div>

```bash
bunx create-agentic-dev@latest <your-repo-name>
```

<div align="center">

<sub><b>One command.</b> Downloads · scrubs git history · renames the project · runs <code>bun install</code> · launches the interactive installer. <code>@latest</code> is explicit but optional — <code>bunx</code> resolves the <code>latest</code> dist-tag by default.</sub>

</div>

<br />
<br />

## Prerequisites

Before running `bunx create-agentic-dev@latest` or `bun install && bun run setup`, install the **hard blockers**. The installer detects everything else and prints exact install URLs when something is missing — but front-loading these saves a fail-and-retry loop.

### Hard blockers (installer exits 1 if missing)

| Tool                                                                                                                                                    | Min version | Why                                                                                                                                                                                                                                                                                                                    | Install                                                                                                                                                            |
| ------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **Bun**                                                                                                                                                 | `>= 1.0.0`  | Runtime for every script (`bun install`, `bun run setup`, `bun cli/doctor.ts`, every `bun run …` in `package.json`)                                                                                                                                                                                                    | macOS/Linux/WSL: `curl -fsSL https://bun.sh/install \| bash` · Windows: `powershell -c "irm bun.sh/install.ps1 \| iex"` · [docs](https://bun.sh/docs/installation) |
| **An agent** — [Claude Code](https://docs.claude.com/claude-code), [OpenCode](https://opencode.ai) **or** [Codex](https://developers.openai.com/codex/) | latest      | `bun run setup` Step 4 detects all three (`~/.claude/` or `claude` on PATH · `~/.config/opencode/` or `opencode` on PATH · `codex` on PATH or `.codex/config.toml` in the repo) and lets you pick which to configure (`INSTALL_AGENTS=claude-code,opencode,codex` overrides the prompt); exits 1 only if none is found | See each project's official docs                                                                                                                                   |
| `git`                                                                                                                                                   | any         | Scaffolder runs `git init`; pre-commit hooks (Husky) require git; `/git-flow-master` skill depends on it                                                                                                                                                                                                               | [git-scm.com/downloads](https://git-scm.com/downloads)                                                                                                             |
| `tar`                                                                                                                                                   | any         | Scaffolder extracts the template tarball. Either flavour works — GNU tar (Linux, WSL, Git Bash) or bsdtar                                                                                                                                                                                                              | Ships with macOS, Linux, and Windows 10 1803+ / Windows 11 (`C:\Windows\System32\tar.exe`)                                                                         |

> **Windows**: PowerShell and cmd are supported — no WSL or Git Bash required. Install Bun with the PowerShell one-liner above rather than `npm i -g bun`, which writes only a `bun.cmd` shim.
>
> **WSL**: keep the project on the Linux filesystem (`~/projects/...`). On a `/mnt/c` path Bun cannot create its bin shims and `bun install` fails with `could not open bin metadata file`.

### Quasi-required (installer warns + offers install)

| Tool          | Min version | Why                                                                                                                              | Install                                                                                                                                                                                              |
| ------------- | ----------- | -------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **gentle-ai** | `>= 1.26.5` | Installs Engram (MCP-based persistent memory across sessions). Framework still runs without it, but cross-session memory is off. | macOS: `brew install gentle-ai` · Linux: `go install github.com/Gentleman-Programming/gentle-ai/cmd/gentle-ai@latest` (needs Go ≥ 1.22) · [repo](https://github.com/Gentleman-Programming/gentle-ai) |

### Per-skill CLIs (lazy-required — needed when the skill runs, not at setup)

These are **not optional** for the workflow — each one is required by a specific skill. They are non-blocking at setup time because the installer cannot guess which skills you will actually use. Install them up front if you plan to use the whole stack, or lazily when the skill that uses them surfaces a missing-binary error.

| Tool             | Required by                                                                                                          | Install                                                                                                                                  |
| ---------------- | -------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| `gh`             | `/git-flow-master`, `/sprint-development` (PR ops, deploy hand-off), optional `gh repo create` step in the installer | [cli.github.com](https://cli.github.com/)                                                                                                |
| `acli`           | `/acli`, `/sprint-development`, `/product-management` (Jira / Confluence from terminal)                              | [Atlassian docs](https://developer.atlassian.com/cloud/acli/guides/install-acli/)                                                        |
| `playwright-cli` | `/playwright-cli`, `/sprint-development` (agent-driven browser automation, E2E checks)                               | `bun add -g @playwright/cli@latest`                                                                                                      |
| `supabase`       | `/supabase`, `/supabase-postgres-best-practices`, `/project-bootstrap` (local stack, migrations, type gen)           | [supabase.com/docs/guides/local-development/cli/getting-started](https://supabase.com/docs/guides/local-development/cli/getting-started) |
| `vercel`         | `/vercel-cli`, `/deploy-to-vercel`, `/sprint-development` (staging + production deploys; verification, env sync, debug, rollback)        | `bun add -g vercel`                                                                                                                      |
| `resend`         | `/resend-cli` (transactional email development + sending)                                                            | [resend.com/docs/cli](https://resend.com/docs/cli)                                                                                       |
| `jq`             | `/acli` JSON pipelines (`acli ... --json \| jq ...`)                                                                 | [jqlang.org](https://jqlang.org/)                                                                                                        |

### Convenience opt-ins (pure UX, never required)

| Tool     | What it buys you                                                                                                                                                                                                                                                                                                     | Install                                                                                       |
| -------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------- |
| `direnv` | Loads `.env` automatically when you `cd` into the repo, so the bare `claude` / `opencode` / `codex` binaries see MCP credentials. Without it the project ships `bun run claude` / `bun run opencode` / `bun run codex` wrappers (via `dotenv-cli`) that do the same thing: direnv just removes the `bun run` prefix. | macOS/Linux: `brew install direnv` / `apt install direnv` · [direnv.net](https://direnv.net/) |

> **Windows users**: skip direnv. The `bun run claude` / `bun run opencode` / `bun run codex` wrappers already load `.env` cross-platform with zero setup. direnv on PowerShell needs version 2.37+ and is officially experimental; Git Bash works but at that point the wrapper is simpler. The installer will offer the direnv hook; just decline it.

### MCP credentials (`.env` keys)

The three MCP configs, `.mcp.json` (Claude Code), `opencode.jsonc` (OpenCode) and `.codex/config.toml` (Codex), ship with placeholders that read from `.env` (`${VAR}`, `{env:VAR}`, and `env_vars` / `bearer_token_env_var` respectively). Nine keys back the 4 canonical MCPs and the Atlassian CLI (context7 needs none):

```
TAVILY_API_KEY
ATLASSIAN_EMAIL · ATLASSIAN_API_TOKEN
SUPABASE_ACCESS_TOKEN · NEXT_PUBLIC_SUPABASE_URL · SUPABASE_PUBLISHABLE_KEY · SUPABASE_SECRET_KEY
N8N_API_URL · N8N_API_KEY
```

**The Atlassian site host is not one of them.** It lives in `.agents/project.yaml` -> `issue_tracker.atlassian_url` and is read with `bun run --silent jira:url` (`--slug` for the bare host `acli --site` wants). It was pulled out of `.env` because a stale copy inherited from the parent shell silently shadowed the file — `jira:sync-issues` rebuilt the local PBI cache from a dead Jira site and exited 0. A hostname is not a secret, and it is project identity, so it belongs in a versioned file that shows up in a diff.

`.env.example` has the full template with per-var comments. Run `bun run setup:doctor` at any time to see which are still missing — it prints `pending_actions[].where` URLs for every credential, and reports the resolved Atlassian host by value.

### When the installer tells you something is wrong

| Stage                    | Check depth                                                                                                                                                                                         | Behavior                                                                                                                                                                                                                       |
| ------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Preflight (Step 0)       | Version compare — reads `process.versions.bun`, parses semver, requires `>= 1.0.0`. Also checks `node_modules/@inquirer/prompts`.                                                                   | Hard exit 1 with explicit `Fix:` command before any other step.                                                                                                                                                                |
| Step 2 — gentle-ai       | Version compare — runs `gentle-ai version`, parses semver, requires `>= 1.26.5`.                                                                                                                    | Missing: prints brew + go install commands + docs URL, asks exit-or-continue. Too old: warns and continues with `gentle-ai update` hint.                                                                                       |
| Step 4 — agents          | Detects Claude Code, OpenCode and Codex (config directory, binary on PATH, or `.codex/config.toml`), then prompts which to configure.                                                               | None of the three found: prints all three docs URLs, hard exit 1.                                                                                                                                                              |
| Step 11 — per-skill CLIs | PATH probe — runs `which <name>` on POSIX, `where <name>` on Windows. Presence only, no version check.                                                                                              | Prints `found` / `missing` table; for missing entries adds `quick:` install command (when cross-platform — e.g. `bun add -g vercel`) + `docs:` URL. Non-blocking.                                                              |
| direnv (optional)        | Presence + `.envrc` allow status + shell-rc hook line.                                                                                                                                              | Pure convenience nudge: the `bun run claude` / `bun run opencode` / `bun run codex` wrappers already work without it. If absent, lists `system_install` action with install command; safe to decline (recommended on Windows). |
| `bun run setup:doctor`   | Re-runs everything above + the MCP `.env` vars + direnv state + the multi-harness contract (instructions shim, skills alias, command wrappers, hook adapters, MCP parity) + Codex repository trust. | Human-readable or `--json` report. Every `pending_action` carries a `where` hint or URL — re-run any time after partial setup. Codex trust is reported as WARN, never FAIL: it is runtime state no file read can verify.       |

> **TL;DR**: install **Bun** plus at least one of **Claude Code, OpenCode, or Codex** before you run setup. Everything else, the installer points you at when you hit it.

<br />
<br />

## Start here — pick your path

| Goal                                                               | What to read / run                                                                                                                                                                                      |
| ------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Start a new project — magic command (recommended)**              | `bunx create-agentic-dev@latest <your-repo-name>` — official scaffolder ([npm](https://www.npmjs.com/package/create-agentic-dev))                                                                       |
| **Start a new project — GitHub "Use this template"**               | Click [**Use this template**](https://github.com/upex-galaxy/agentic-dev-boilerplate/generate) → clone your new repo → `bun install && bun run setup` (see [Other ways to start](#other-ways-to-start)) |
| **Contribute to the boilerplate itself**                           | `git clone …` then `bun install && bun run setup` (see [Other ways to start](#other-ways-to-start))                                                                                                     |
| **See the repo's mental model before touching anything** (~30 min) | `bun run onboarding` — opens `docs/onboarding.html` with sidebar nav                                                                                                                                    |
| **Methodology / philosophy / extension guide** (~25 min)           | [`docs/agentic-development-engineering.md`](docs/agentic-development-engineering.md)                                                                                                                    |
| **Troubleshooting the installer**                                  | [`INSTALLER.md`](INSTALLER.md)                                                                                                                                                                          |
| **You're an AI agent**                                             | [`AGENTS.md`](AGENTS.md) (operational rules, auto-loaded each session on every supported harness) + [`CONTEXT.md`](CONTEXT.md) (knowledge map)                                                          |

> First-timers, use the scaffolder. It handles tarball download, git scrub, rename, `bun install`, and the interactive installer in one shot. The manual clone is for people hacking on the boilerplate itself.

<br />

## What this is

A starter for teams that want AI agents driving the dev workflow — not just autocomplete in the editor, but the whole loop. Define the product, scaffold the stack, refine the backlog, ship every story, deploy to staging. Sixteen workflow skills cover the phases. Eight slash commands are thin aliases onto them. It runs on Claude Code, OpenCode and Codex from one copy of every instruction and skill (see [Multi-harness architecture](#multi-harness-architecture-one-source-three-consumers)). The testing half (sprint testing, regression, automation) lives in [agentic-qa-boilerplate](https://github.com/upex-galaxy/agentic-qa-boilerplate) — pair them or use one.

<br />

## Scaffold a new project

`create-agentic-dev` is the official scaffolder ([npm](https://www.npmjs.com/package/create-agentic-dev), source in [`packages/create-agentic-dev/`](packages/create-agentic-dev/)). One command, full setup:

```bash
bunx create-agentic-dev@latest <your-repo-name>
cd <your-repo-name>
```

> `@latest` pins the resolution to the npm `latest` dist-tag. `bunx` already defaults to `latest` when no tag is specified, so `bunx create-agentic-dev <your-repo-name>` works identically — `@latest` is just explicit. To pin a specific version, use `bunx create-agentic-dev@1.2.3 <your-repo-name>`.

What it does:

1. Downloads `upex-galaxy/agentic-dev-boilerplate` (latest `main`) as a tarball — no git history.
2. Rewrites `package.json` name + `.agents/project.yaml` `project.name`.
3. Initializes a fresh `git init -b main` with an initial commit.
4. Runs `bun install`.
5. Hands off to `bun run setup` — detects which of Claude Code / OpenCode / Codex you have, gentle-ai (Engram only), community skills, `.env` wiring for every MCP server declared in `.mcp.json` (context7, tavily, supabase and n8n out of the box) plus the Atlassian CLI, direnv autoload, optional `gh repo create`, and finally generates the harness surfaces (`.claude/skills` alias, command wrappers) and verifies them. The scaffolder itself is harness-neutral: nothing generated ships in the tarball.

Useful flags (full list in [`packages/create-agentic-dev/README.md`](packages/create-agentic-dev/README.md)):

| Flag                           | Effect                                                          |
| ------------------------------ | --------------------------------------------------------------- |
| `--here`                       | Bootstrap into the current directory instead of a new one.      |
| `--template <ref>`             | Pin to a branch / tag / SHA instead of `main`.                  |
| `--template-repo <owner/repo>` | Use a fork instead of `upex-galaxy/agentic-dev-boilerplate`.    |
| `--project-key UPEX`           | Pre-fill the Jira project key (otherwise prompted).             |
| `--no-install` / `--no-setup`  | Skip `bun install` or the interactive installer.                |
| `--non-interactive`            | Auto-pick defaults (also auto-detected when no TTY is present). |

Then continue with the per-project workflow:

```bash
# Optional: open the orientation HTML (~30 min repo tour, single file)
bun run onboarding

# Optional, Claude Code only: configure the statusline in a SEPARATE terminal
bunx -y ccstatusline@latest

# Define what to build (one-time)
/project-foundation    # Constitution, PRD, SRS, Discovery
/design-system         # DESIGN.md (optional — Google Labs spec; paleta, tipografía, tokens)

# Scaffold the codebase (one-time)
/project-bootstrap     # Backend, frontend, OpenAPI, env, auth (reads DESIGN.md if present)

# Manage the backlog (continuous)
/product-management    # Seed backlog, refine stories, AC, edge cases

# Implement (per story)
/sprint-development    # Plan -> Code -> Review -> Deploy
/unit-testing          # Composable mid-flight from sprint-development for TDD
```

> Don't chain `bun run onboarding && bun run setup` — the onboarding server is blocking and the chain deadlocks. Run them as separate steps.

> `bunx -y ccstatusline@latest` is Claude Code-only and optional. Run it from a plain terminal with NO agent running — concurrent TUIs fight over stdin and the configurator silently breaks. OpenCode users skip this: the `opencode-subagent-statusline` plugin is already wired into `opencode.jsonc`.

<br />

## Launching the agent

`.mcp.json` (Claude Code), `opencode.jsonc` (OpenCode) and `.codex/config.toml` (Codex) ship with placeholders — real values live in `.env`. Launch the agent via one of these so env vars actually load:

```bash
# Cross-platform default (uses dotenv-cli, no extra tooling required):
bun run claude        # Claude Code
bun run opencode      # OpenCode
bun run codex         # Codex CLI (Desktop reads the same repository config)

# Optional: direnv autoload (any OS with direnv installed)
direnv allow          # one-time per repo (the installer offers to run this)
claude                # direct binary picks up .env from your shell

# Or load .env into your CURRENT shell once, then run any binary directly:
set -a; source .env; set +a   # bash/zsh only — exports every .env key into this session
claude                        # now claude / opencode / codex / acli all see the vars
```

> The wrappers pass `dotenv -o`, so a value in `.env` wins over a stale variable inherited from the parent shell. The bare binary and the direnv path do not force that: if a server answers 401/403 after you fixed `.env`, check your shell exports first.

PowerShell equivalent of that last block:

```powershell
Get-Content .env | Where-Object { $_ -match '^\s*[^#].*=' } | ForEach-Object {
  $k, $v = $_ -split '=', 2
  Set-Item -Path "Env:$($k.Trim())" -Value $v.Trim()
}
claude
```

> Run the snippet **inline** in the shell you are already in. Wrapping it in a script would export into a child process that exits immediately, leaving your terminal untouched — which is why there is no `bun run env` script.

direnv works on macOS / Linux / Windows. On Windows install via `winget install direnv` — Git Bash is recommended; PowerShell support is experimental and requires direnv 2.37+. See [INSTALLER.md § Launching the agent](./INSTALLER.md#launching-the-agent-after-setup) for the per-shell hook lines.

<br />

<details>
<summary><b>Other ways to start</b> — GitHub template flow + manual clone for contributors</summary>

<br />

### Use this template (GitHub)

Prefer to start your project **on GitHub from day one** (your own repo, your own remote, full history under your account)? Use GitHub's native template flow:

1. Click [**Use this template → Create a new repository**](https://github.com/upex-galaxy/agentic-dev-boilerplate/generate) on the boilerplate's GitHub page.
2. Pick owner + name for your new repo, choose visibility, create.
3. Clone YOUR new repo locally:
   ```bash
   git clone https://github.com/<your-org>/<your-repo>.git
   cd <your-repo>
   ```
4. Install + configure:
   ```bash
   bun install
   bun run setup        # gentle-ai (Engram only), community skills, .env wiring, MCPs
   ```
5. (Optional) Rename the project inside the codebase: edit `package.json` → `name`, and `.agents/project.yaml` → `project.name`.

> **The magic command does this better.** `bunx create-agentic-dev@latest <your-repo-name>` does everything the template flow does **plus**: scrubs the upstream git history (so your repo doesn't carry boilerplate commits), auto-rewrites `package.json` name and `.agents/project.yaml` `project.name`, runs `bun install`, runs the interactive installer, and optionally creates the GitHub repo for you via `gh` — all in one command. The template route is a good fit only if you want the GitHub repo created via the web UI before any local work.

### Manual clone (contributors)

Hacking on the boilerplate **itself** (skills, installer, scripts, docs)? Clone the repo directly:

```bash
# 1. Clone the boilerplate
git clone https://github.com/upex-galaxy/agentic-dev-boilerplate.git
cd agentic-dev-boilerplate

# 2. (Optional) Install deps + open the orientation
bun install
bun run onboarding   # opens docs/onboarding.html with sidebar nav
                     # Close the tab + Ctrl-C when done

# 3. Install everything (gentle-ai Engram, community skills, MCPs, env)
bun run setup

# Or, do it manually instead of step 3:
bun install
cp .env.example .env   # then fill in the values
```

> Foundation files (`.agents/`, `scripts/`, `AGENTS.md`) ship with the repo — no bootstrap step needed. À la carte adoption of individual skills is not supported.

> End-users building a new project should NOT clone manually — use `bunx create-agentic-dev@latest` so git history is scrubbed and the project is renamed automatically.

</details>

<br />

## How it works

Skills auto-trigger when your prompt matches their `description` frontmatter — or you force-load with a slash command (`/sprint-development`). Each skill is a `SKILL.md` plus a `references/` folder. The agent only reads what the current step needs, so context stays lean.

Project values (URLs, project key, Jira fields) live in `.agents/project.yaml` and get injected into prompts via a 4-syntax variable system. Skills are grouped by phase: foundation (one-time setup), management (continuous PM), implementation (per-story dev). The QA companion repo follows the same pattern.

<br />

## Skills

### Workflow skills (auto-trigger)

| Skill                  | Phase          | Purpose                                                                                                                                                                                                                                                                    |
| ---------------------- | -------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `agentic-dev-core`     | foundation     | Passive reference host for shared doctrine (briefing template, dispatch patterns, orchestration, skill-composition strategy). Loaded on demand by workflow skills — not invoked directly.                                                                                  |
| `/project-foundation`  | foundation     | Constitution + PRD + SRS + Discovery (one-time at conception)                                                                                                                                                                                                              |
| `/design-system`       | foundation     | DESIGN.md generation (Google Labs spec) before frontend scaffolding — 5 paths. Optional opt-in screen-mapping phase: portable design briefs for Claude Design / Open Design + `master-design-plan.md` (per-screen specs + US→Screen map consumed by `/sprint-development`) |
| `/project-bootstrap`   | foundation     | Backend / frontend / OpenAPI / auth / env scaffolding (one-time)                                                                                                                                                                                                           |
| `/testability-guide`   | foundation+    | In-app `/qa` page ("Software Testability Guide for QA") + tool-agnostic credentials artifact (Jira Epic / Confluence / Notion / MCP / CLI / manual paste). Idempotent re-runs.                                                                                             |
| `/product-management`  | management     | Backlog seed, story refinement (INVEST), AC (Gherkin), edge cases                                                                                                                                                                                                          |
| `/sprint-development`  | implementation | Per-story mega-orchestrator: Plan -> Code -> Review -> Staging -> (gated) Production                                                                                                                                                                                       |
| `/unit-testing`        | implementation | TDD, test naming, mocking patterns, coverage. Composable from `/sprint-development`                                                                                                                                                                                        |
| `/autonomous-delivery` | implementation | Scheduled / unattended delivery runs: audits real state (git is truth, tracker is a hint), selects genuinely unblocked work, dispatches the owning pipeline skill, reports. Modes: `story` (1 per run), `bug` (up to 3), `discovery` (backlog only, no code)               |
| `/git-flow-master`     | git            | End-to-end Git operator: branches, commits, push, PR, conflicts, chained-PR planning                                                                                                                                                                                       |
| `/project-context`     | context        | Business maps + master implementation plan + dev roadmap, one mode per run: `data` · `features` · `api` · `master-plan` · `dev-roadmap` (formerly six inline commands)                                                                                                     |
| `/sync-ai-memory`      | context        | Audit + sync `README.md`, `AGENTS.md`, `CONTEXT.md`, `docs/` and the onboarding HTML against the current repo state. Stops if it finds prose in the `CLAUDE.md` shim                                                                                                       |
| `/jira-administration` | tooling        | Bounded Jira admin workflows, one mode per run: `components` (reconcile Jira Components against real modules) or `instance-migration` (repoint the Atlassian host + regenerate catalogs)                                                                                   |
| `/acli`                | tooling        | Atlassian CLI cookbook for Jira Cloud + Confluence Cloud workflows                                                                                                                                                                                                         |
| `/vercel-cli`          | tooling        | Vercel CLI cookbook: deployment verification, env var sync (`.env` ↔ Preview/Production), debug, rollback. Companion to community `/deploy-to-vercel`. Auto-loads on `vercel` Bash calls                                                                                   |
| `/agentic-dev-onboard` | onboarding     | Walks new users through the repo's dev flow, MCPs, env vars, workflow skills                                                                                                                                                                                               |

### Reusable community skills (installed by `bun run setup`)

These aren't committed in this repo. The installer fetches them via `bunx skills add` from upstream community repositories. Project-level ones install into the same `.agents/skills/` store as the committed skills, so every harness sees them without a second copy; user-level (T4) ones stay per harness (`~/.claude/skills/` and the equivalent for each host). The exact list lives in `cli/install.ts` — source of truth, changes faster than this README, consult the file directly.

After running `/project-foundation` and `/project-bootstrap`, you can also run `bunx autoskills` to auto-detect your concrete stack and add more.

### Skill tiers (T1–T4)

Every skill belongs to one of three tiers. Each tier has different discovery and load rules. Full contract: [`.agents/skills/agentic-dev-core/references/skill-composition-strategy.md`](.agents/skills/agentic-dev-core/references/skill-composition-strategy.md).

| Tier | What                          | Location                                         | Load behavior                                               |
| ---- | ----------------------------- | ------------------------------------------------ | ----------------------------------------------------------- |
| T1   | Project-owned (this repo)     | `.agents/skills/`                                | Silent — load on trigger                                    |
| T3   | Community project-level       | Installed by `install.ts` `PROJECT_LEVEL_SKILLS` | Silent if matched by category                               |
| T4   | Community user-level (global) | Installed by `install.ts` `USER_LEVEL_SKILLS`    | **ASK** user before load (cross-project, not always wanted) |

Validation: `bun run skills:check` checks tier coherence (orphan categories, tier mismatches, missing sections, stale doc paths).

### Slash commands (transport aliases, not workflows)

These eight commands carry **no workflow body**. Each is a thin alias declared in `.agents/compatibility/command-aliases.json` that names a target skill plus a mode and forwards `$ARGUMENTS`; the wrappers under `.claude/commands/` and `.opencode/commands/` are generated from that manifest by `bun run agents:compat`. Codex has no wrapper layer: invoke the target skill and mode directly.

| Command                       | Target skill          | Mode                 | Purpose                                                                                                                                            |
| ----------------------------- | --------------------- | -------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------- |
| `/sync-ai-memory`             | `sync-ai-memory`      | (single)             | Audit + sync README, `AGENTS.md`, CONTEXT.md, docs/, and onboarding HTML against current repo state                                                |
| `/business-data-map`          | `project-context`     | `data`               | Generate or update `.context/business/business-data-map.md`                                                                                        |
| `/business-feature-map`       | `project-context`     | `features`           | Generate or update `.context/business/business-feature-map.md`                                                                                     |
| `/business-api-map`           | `project-context`     | `api`                | Generate or update `.context/business/business-api-map.md`                                                                                         |
| `/master-implementation-plan` | `project-context`     | `master-plan`        | Generate or update `.context/master-implementation-plan.md` (EPIC/strategy roadmap)                                                                |
| `/dev-roadmap`                | `project-context`     | `dev-roadmap`        | Generate or update `.context/dev-roadmap.md` (TICKET/sequence: dependency edges + execution sprints + mockup-gates; subsumes `sprint-sequence.md`) |
| `/jira-instance-migration`    | `jira-administration` | `instance-migration` | Repoint the repo at a new Atlassian instance (`.agents/project.yaml` + `acli` session) and regenerate the `.agents/` catalogs                      |
| `/jira-components`            | `jira-administration` | `components`         | Reconcile a Jira project's Components against the app's real functional modules, plan-first with explicit approval                                 |

<br />

## Repository structure

```
.agents/                  # Agentskills.io spec layout: the shared, harness-agnostic substrate
├── project.yaml          # Per-project variables (template)
├── jira-required.yaml    # Custom field + work_type manifest
├── jira-fields.json      # Workspace-resolved field IDs (regenerated per project)
├── jira-workflows.json   # Workspace-resolved workflows / statuses / transitions
├── README.md             # The .agents/ contract
├── compatibility/        # command-aliases.json: source for every generated slash-command wrapper
├── hooks/                # personality-reinject.mjs: one emitter, three harness adapters
└── skills/               # THE skill store (16 committed + REGISTRY.md), read by all three harnesses;
                          # project-level community skills install here too (bun run setup)
.claude/                  # Claude Code adapter: settings.json (hook) + generated commands/ and skills alias (gitignored)
.opencode/                # OpenCode adapter: plugins/personality-reinject.js + generated commands/
.codex/                   # Codex adapter: config.toml (MCP) + hooks.json. Shared by CLI and Desktop
.context/                 # Per-project context (PBI, PRD, SRS, business knowledge)
├── business/             # Constitution (business model, market context) + maps (data, feature, api)
├── PRD/                  # Product Requirements
├── SRS/                  # Software Requirements
├── ADR/                  # Architecture Decision Records (append-only)
└── PBI/                  # Per-epic + per-ticket memory (gitignored Jira cache)
packages/
└── create-agentic-dev/   # Official npm scaffolder (bunx create-agentic-dev …) — own README + tests
cli/                      # install.ts, update-boilerplate.ts, doctor, agent-compatibility engine, helpers
scripts/                  # CLI tooling: lint-vars, jira-sync, agent-compatibility, etc.
templates/                # Files copied into bootstrapped projects by /project-bootstrap
AGENTS.md                 # AI memory: the ONLY instruction body, loaded by all three harnesses
CLAUDE.md                 # One-line shim (`@AGENTS.md`) so Claude Code reaches it. Generated, never holds prose
.mcp.json                 # MCP config: Claude Code
opencode.jsonc            # MCP config: OpenCode
CONTEXT.md                # Context Engineering canonical reference
DESIGN.md                 # Visual identity spec (Google Labs, generated by /design-system)
INSTALLER.md              # Contract for `bun run setup` — what each installer layer does
```

<br />

## Variables system

The `.agents/` directory hosts a 4-syntax variable system used by every skill and command.

| Syntax                         | Purpose                                      | Resolves from                                             |
| ------------------------------ | -------------------------------------------- | --------------------------------------------------------- |
| `{{VAR_NAME}}`                 | Static project value (flat or env-scoped)    | `.agents/project.yaml`                                    |
| `{{environments.<env>.<var>}}` | Explicit cross-env reference                 | `.agents/project.yaml` -> `environments.<env>.<var>`      |
| `<<VAR_NAME>>`                 | Session/runtime value (e.g. `<<ISSUE_KEY>>`) | Computed by the calling prompt at runtime                 |
| `{{jira.<slug>}}`              | Jira custom field reference                  | `.agents/jira-required.yaml` + `.agents/jira-fields.json` |

See `.agents/README.md` for the full contract.

**Validation scripts:**

```bash
bun run vars:check          # Every {{VAR}} and {{jira.*}} reference resolves
bun run jira:sync-fields   # Discover Jira custom fields -> .agents/jira-fields.json
bun run jira:check         # Validate jira-required.yaml against jira-fields.json
```

<br />

## Common scripts

```bash
bun run lint:check              # Lint codebase
bun run lint:fix          # Auto-fix lint issues
bun run format:fix            # Format with Prettier
bun run format:check      # Check formatting
bun up                    # Update template from upstream (interactive)
bun up --auto             # Non-interactive / CI mode (safe changes only, exit 0 always)
bun up --dry-run          # Preview what would change without writing anything
bun up --strict           # Exit 1 on compat errors or blocking parity findings (CI gate)
bun up --rollback         # Restore from most recent backup
bun run api:sync          # Sync OpenAPI spec + generate types
bun run vars:check         # Validate {{VAR}} and {{jira.*}} references
bun run jira:sync-fields            # Sync Jira custom fields (REQUIRES Jira Administer permission)
bun run jira:sync-workflows         # Sync Jira workflows (REQUIRES Jira Administer permission)
bun run jira:sync-link-types        # Sync issue-link types (USER-OK; no admin needed; manual-only)
bun run jira:sync-fields --upex     # Download UPEX-standard JSON from upstream (no admin, no Jira API)
bun run jira:sync-workflows --upex  # Same — bypasses Jira entirely, fetches upex-galaxy/agentic-dev-boilerplate@main
bun run jira:check        # Validate Jira manifest vs catalog
```

> **`--upex` flag** — every `jira:sync-*` script accepts `--upex` to download the UPEX-standard reference JSON from `upex-galaxy/agentic-dev-boilerplate@main` instead of hitting Jira. Use when you don't have admin access on your Jira workspace, when you want a working catalog without setting up auth, or when you want the canonical UPEX standard as a reference. Non-admin users running the regular `jira:sync-fields` / `jira:sync-workflows` get a pre-flight permission check + friendly skip pointing at `--upex` as the fallback.

`bun up` ahora corre un sync per-archivo con tracking de SHAs por componente vía `.template/boilerplate.lock.json` (schema v6). Detecta archivos modificados localmente y prompta resolución (`[t]heirs / [m]ine / [s]kip`). El flag `--auto` aplica cambios seguros y salta los diverged — ideal para CI o flujos no-interactivos (siempre exit 0). El flag `--dry-run` simula el sync completo sin escribir nada; `--rollback` restaura desde el directorio de backup más reciente (`.backups/update-{ISO-ts}/`). Requiere git ≥ 2.25 (partial clone). Primera corrida sin `.template/boilerplate.lock.json`: bootstrap automático con bulk sync + escritura inicial del estado v6. Detalle del flujo y schema en el JSDoc header de `cli/update-boilerplate.ts` y vía `bun up --help`.

**What a run leaves behind.** Every `bun up` ends with one "Estado por superficie" table (8 rows: Instrucciones y config / Skills / Comandos / Hooks / MCP / Env / Componentes / Git, one ok or warn glyph per row) followed by ONE parity prompt, also saved to `.agents/prompts/parity-plan.md` (gitignored, single-use). The prompt lists every difference between the project and upstream as a numbered row with concrete evidence (headings added or removed in `AGENTS.md`, hunk counts, server ids missing from a host, wrapper files no manifest produced, archived skill collisions) and asks the AI to present the table and WAIT for a per-row decision, `keep project | take upstream | merge`, before editing anything. One row per path: a stray wrapper is a single `add to overlay` row, and a watched file that also fails a compat contract (say `.codex/config.toml` missing a server) is one blocking row carrying both the contract evidence and the drift evidence. `--strict` turns compat errors or blocking findings into exit 1 for CI; the default stays warn and exit 0. `.claude/settings.json` is delivered once when the project lacks it (bootstrap-only, like `.codex/`) and then sits on the protected watchlist next to `AGENTS.md`, `.mcp.json` and `opencode.jsonc`: never overwritten, project permissions survive, drift shows up in the prompt. Project-owned slash commands go in `.agents/compatibility/command-aliases.project.json` (see [Multi-harness architecture](#multi-harness-architecture-one-source-three-consumers)); the updater never touches that file. The self-update no longer trips its own dirty-tree guard, so `--auto` works without `--force` after `cli/` refreshes itself; the lock file and `.backups/` are updater-owned and never count as user dirt. A run that applies nothing leaves the tree byte-identical (the lock is not rewritten just to bump its timestamp), and an aborted run (dirty tree, corrupt lock, failed clone, declined migration or self-update) ends with `Abortado.` and exit 1, never with a success line. On the run that migrates a Claude-era project, the `.claude/skills` alias is deliberately NOT created (git cannot rewrite the staged `.claude/skills/*` deletions behind a symlink, so the pre-commit hook would fail): commit the migration, then `bun run agents:compat` creates it; the closing box says so.

<br />

## Companion repo

The testing side lives in [agentic-qa-boilerplate](https://github.com/upex-galaxy/agentic-qa-boilerplate) — sprint-testing, test-documentation, test-automation, regression-testing. Same `.agents/` variable system, same `agentskills.io` layout. Pair them or use one.

<br />

## Multi-harness architecture: one source, three consumers

This repo runs on **Claude Code, OpenCode, and Codex (CLI + Desktop)**. There is exactly one copy of every instruction and every skill. Where the harnesses genuinely differ (MCP file format, hook API, whether slash commands exist at all) each keeps a thin versioned adapter. Nothing is duplicated.

> Visual walkthrough, including what happens when you update a project created before this change: [**Una fuente, tres harnesses**](https://upex-galaxy.github.io/agentic-dev-boilerplate/harnesses.es.html) (Spanish, published page with diagrams; source `packages/pages-home/harnesses.es.html`).

| Surface          | Claude Code                                     | OpenCode                                    | Codex CLI + Desktop                      |
| ---------------- | ----------------------------------------------- | ------------------------------------------- | ---------------------------------------- |
| **Instructions** | `CLAUDE.md` → `@AGENTS.md` **[generated shim]** | `AGENTS.md` (native)                        | `AGENTS.md` (native)                     |
| **Skills**       | `.claude/skills` **[generated alias]**          | `.agents/skills/` (native)                  | `.agents/skills/` (native)               |
| **Commands**     | `.claude/commands/*.md` **[generated]**         | `.opencode/commands/*.md` **[generated]**   | none: invoke the skill + mode directly   |
| **Hook**         | `.claude/settings.json` → `UserPromptSubmit`    | `.opencode/plugins/personality-reinject.js` | `.codex/hooks.json` → `UserPromptSubmit` |
| **MCP**          | `.mcp.json`                                     | `opencode.jsonc`                            | `.codex/config.toml`                     |

- **Instructions.** `AGENTS.md` is the only instruction body. OpenCode and Codex load it natively; Claude Code loads `CLAUDE.md`, which is exactly `@AGENTS.md` plus one newline: a documented import rather than a symlink, so it survives a Windows checkout. Operational prose in the shim is structural drift, and `/sync-ai-memory` stops rather than propagating it.
- **Skills.** All 16 skills live committed in `.agents/skills/`, and the project-level community skills install into the same store. OpenCode and Codex read it directly; Claude Code reaches it through `.claude/skills`, a POSIX symlink (Windows junction) that is generated and gitignored: never committed, never hand-edited. Each skill still declares `compatibility: [claude-code, copilot, cursor, codex, opencode]` per the [agentskills.io](https://agentskills.io) spec, and hosts without slash triggers auto-activate from the same `description` field.
- **Commands.** The 8 slash commands are transport, not workflow: generated from `.agents/compatibility/command-aliases.json`, a few lines each. A wrapper that grows a body fails the check as `contains workflow prose`.
- **Hook.** `.agents/hooks/personality-reinject.mjs` holds the contract text once. Claude Code and Codex run it as a `UserPromptSubmit` command hook (the Codex adapter carries a POSIX and a PowerShell command); OpenCode imports the constant from a thin plugin.
- **MCP.** Every server declared in `.mcp.json` must exist in the other two configs with the same `.env` dependencies. Parity is checked semantically: each native format (JSON / JSONC / TOML) is normalized into a common shape, then compared on the `.env` variables each server depends on, so a server missing from one host, or present in one host only, is a failure. The boilerplate's own four (`context7`, `tavily`, `supabase`, `n8n`) additionally get a strict per-host shape check when declared; a downstream project with a different set passes on the generic check alone. Codex cannot expand `${VAR}` inside `args`, so its adapter reaches `tavily` over HTTP with `bearer_token_env_var` and passes `supabase` env-only auth.
- **Commit provenance.** Rule #3 in `AGENTS.md` bans AI attribution on every harness. The harness session trailer (`Claude-Session:`) is emitted only when the running harness exposes a transcript pointer; OpenCode and Codex sessions omit it.

Gemini CLI and Cursor stay at the template level: skills declare them in `compatibility:`, and `docs/mcp/*.template.*` holds opt-in MCP configs, but there is no runtime adapter.

### Regenerating and verifying

Bold `[generated]` cells above are output. Edit the source, then regenerate:

| Generated artifact                                  | Its source                                   | Regenerate              |
| --------------------------------------------------- | -------------------------------------------- | ----------------------- |
| `CLAUDE.md` (one-line `@AGENTS.md` shim)            | `AGENTS.md`                                  | `bun run agents:compat` |
| `.claude/skills` (POSIX symlink / Windows junction) | `.agents/skills/`                            | `bun run agents:compat` |
| One Claude + one OpenCode wrapper per alias (8 upstream, plus any project-declared) | `.agents/compatibility/command-aliases.json`, overlaid by the optional `command-aliases.project.json` | `bun run agents:compat` |

```bash
bun run agents:compat         # regenerate every derived harness artifact, then check
bun run agents:compat:check   # validate the whole contract (also runs in repo:check + pre-push)
```

**Project-owned slash commands** live in `.agents/compatibility/command-aliases.project.json` (same schema as the upstream manifest, optional, never synced by `bun run up`). Upstream aliases are read first; an overlay entry with the same `alias` replaces it, a new `alias` is added, and `wrapperHosts` always come from the upstream manifest. A wrapper file under `.claude/commands/` or `.opencode/commands/` that neither manifest produced fails the check by name (`Command wrapper not declared in any manifest: <path>`); declare it in the overlay or delete it, the repair never deletes for you.

`agents:compat:check` covers the shim bytes, the alias target, both wrapper sets byte-for-byte against the merged manifest, the hook adapters, and MCP parity. It runs inside `bun run repo:check`, unconditionally in the pre-push hook, and in pre-commit whenever a harness surface is staged. `bun run setup:doctor` reports the same surfaces plus **Codex repository trust**: project `.codex/` config and hooks load only in a trusted repo, and that is runtime state no file read can verify, so the doctor reports it as WARN.

**Updating a project created before this change.** The first `bun run up` on a Claude-era project runs a migration preflight before any component sync: it promotes `CLAUDE.md` to `AGENTS.md` and leaves the shim behind, moves every skill under `.claude/skills/` into `.agents/skills/` (project-authored ones included), and archives any name collision under `.template/pre-agents-migration/` instead of overwriting. Nothing is deleted, and a second run is a no-op. Details in [`INSTALLER.md`](INSTALLER.md#multi-harness-layout-one-source-three-consumers) and [ADR-0002](.context/ADR/ADR-0002-multi-harness-single-source.md).

The `.agents/` variable system is harness-agnostic and unchanged across all three.

<br />

## Future hooks

Room for per-phase model routing. The skill registry (`.agents/skills/REGISTRY.md`, `bun run skills:registry`), Engram cross-session memory and the CI-validated multi-harness contract (`bun run agents:compat:check`) are already shipped, not future work. Notes in `AGENTS.md`.

<br />

## License

MIT — see [`LICENSE`](LICENSE).

<br />

## Status

Renamed from `ai-driven-project-starter` to `agentic-dev-boilerplate`.

<br />

---

<div align="center">

<sub><b>You are here</b> — project overview for visitors · <b>Read time</b> ~5 min · <b>Next</b>: <code>bunx create-agentic-dev@latest &lt;your-repo-name&gt;</code> to bootstrap · <code>bun run onboarding</code> for the visual repo tour · <a href="INSTALLER.md"><code>INSTALLER.md</code></a> for installer details.</sub>

</div>
