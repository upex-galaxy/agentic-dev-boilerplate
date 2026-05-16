# The installer — what `bun run setup` configures

> **Audience**: developers cloning `agentic-dev-boilerplate` for the first time, anyone deciding whether to opt into the gentle-ai ecosystem, or anyone trying to understand which CLI / skill / MCP layer does what.
> **Read time**: 10 minutes.
> **Status**: stable as of 2026-05-11.

This doc is the **contract that `cli/install.ts` implements**. It covers the four installer layers — gentle-ai (~30%), community skills via `bunx skills add` (~25%), locally committed workflow skills (~20%), the canonical MCPs (~15%) — plus the external CLI verification step and the opt-out path.

## Running setup from an AI agent

Most users today ask an AI (Claude Code, OpenCode, Cursor, …) to drive the setup instead of running it by hand. The installer is built for both flows; the AI path uses a few specific entry points:

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
TAVILY_API_KEY=tvly-... \
  JIRA_URL=... \
  JIRA_USERNAME=... \
  JIRA_API_TOKEN=... \
  SUPABASE_ACCESS_TOKEN=... \
  bun run setup --non-interactive
```

Then `bun run setup:doctor --json` to confirm.

### Skip flags (per-step opt-out)

| Env var                 | Effect                           |
| ----------------------- | -------------------------------- |
| `INSTALL_SKIP_DIRENV=1` | Skip direnv detection / autoload |

---

## Launching the agent after setup

`bun run setup` finishes with two recommended ways to start an agent so MCP env vars (e.g. `TAVILY_API_KEY`, `JIRA_API_TOKEN`, `SUPABASE_ACCESS_TOKEN`, `N8N_API_KEY`) get loaded from `.env`:

| Method                                              | Platform                                                                                      | One-time setup                                                                                                                                          | Usage                                                 |
| --------------------------------------------------- | --------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------- |
| **`bun claude` / `bun opencode`** (default) | Windows, macOS, Linux                                                                         | None — `dotenv-cli` is a project devDep                                                                                                                 | `bun claude` from the repo root                       |
| **direnv autoload** (optional)                      | macOS, Linux, **Windows** (Git Bash recommended; PowerShell experimental, needs direnv 2.37+) | Install direnv (`brew install direnv` / `apt install direnv` / `winget install direnv`) + add hook to your shell rc, then installer runs `direnv allow` | Just `claude` or `opencode` from anywhere in the repo |

### direnv hook per shell

| Shell      | Line to add                               | File                                             |
| ---------- | ----------------------------------------- | ------------------------------------------------ |
| bash       | `eval "$(direnv hook bash)"`              | `~/.bashrc` (also works for Git Bash on Windows) |
| zsh        | `eval "$(direnv hook zsh)"`               | `~/.zshrc`                                       |
| fish       | `direnv hook fish \| source`              | `~/.config/fish/config.fish`                     |
| PowerShell | `Invoke-Expression "$(direnv hook pwsh)"` | `$PROFILE` (requires direnv 2.37+, experimental) |

`.mcp.json` (Claude Code) and `opencode.jsonc` are committed with `${VAR}` / `{env:VAR}` placeholders. Real values live in `.env` (gitignored). If a server returns 401/403 at first call, the matching env var is missing — see `CLAUDE.md` Critical Reminder #12 (stop, fix `.env`, restart the agent session).

---

## What is gentle-ai and why this repo uses it

[gentle-ai](https://github.com/Gentleman-Programming/gentle-ai) is a user-level installer that configures AI agents (Claude Code, OpenCode, Cursor, etc.) with a curated set of skills, an MCP-based persistent memory layer (Engram), and an SDD (Spec-Driven Development) orchestrator. It does not install agents themselves — it tunes the agents you already have.

This repo treats gentle-ai as a **base global "quasi-must-have"**. The recommended onboarding (`bun run setup`) installs it if missing, then layers 15 skills + Engram + the SDD orchestrator on top of your agent. The result is one consistent skillset across every repo on your machine that follows this model.

The integration is **not strict**. If you choose to skip gentle-ai, the repo still works: workflow skills committed locally (`/sprint-development`, `/project-foundation`, etc.) keep functioning, and the 4 canonical MCPs are still configured. What you lose is the SDD spec-driven loop, persistent cross-session memory, adversarial review, and a few documentation/communication helpers. Section "How to opt out" below details the trade-off.

---

## What gets installed via gentle-ai

When `bun run setup` runs the gentle-ai branch (1 engram component + 15 skills, repeated per agent):

### Engram (MCP component, not a skill)

| Slug     | Type      | What it does                                                                                                |
| -------- | --------- | ----------------------------------------------------------------------------------------------------------- |
| `engram` | Component | Persistent memory across sessions. Auto-saves decisions, bugs, conventions; auto-recalls on session resume. |

### SDD skills (11)

| Slug             | Brief description                                                                |
| ---------------- | -------------------------------------------------------------------------------- |
| `sdd-init`       | Bootstrap SDD context, detect stack, activate Strict TDD if testing is available |
| `sdd-explore`    | Investigate codebase before committing to a change                               |
| `sdd-propose`    | Create a change proposal (intent, scope, approach)                               |
| `sdd-spec`       | Write requirements + scenarios as delta specs                                    |
| `sdd-design`     | Technical design (architecture decisions, component boundaries)                  |
| `sdd-tasks`      | Break a change into reviewable implementation tasks                              |
| `sdd-apply`      | Implement tasks following specs and design                                       |
| `sdd-verify`     | Validate implementation against specs (tests, edge cases, perf)                  |
| `sdd-archive`    | Sync delta specs into main specs and close the change                            |
| `sdd-onboard`    | Guided end-to-end SDD walkthrough on a real codebase                             |
| `skill-registry` | Build the compact project-standards registry from installed skills               |

### Foundation skills (4)

| Slug                   | Brief description                                                           |
| ---------------------- | --------------------------------------------------------------------------- |
| `judgment-day`         | Adversarial parallel review — 2 independent judges review the same target   |
| `cognitive-doc-design` | Write docs that reduce cognitive load (progressive disclosure, signposting) |
| `comment-writer`       | Draft warm, direct PR/issue comments and review feedback                    |
| `issue-creation`       | Issue filing workflow (bug + feature templates, issue-first enforcement)    |

> The installer dispatches a single batched call per agent:
>
> ```sh
> gentle-ai install \
>   --agent <agent> \
>   --components engram,sdd,skills \
>   --skills <comma-separated slug list>
> ```
>
> `gentle-ai install`'s flag parser accepts comma-separated CSV values, so one call per agent installs Engram + the SDD slash commands + every listed skill. Re-runs are idempotent: gentle-ai snapshots existing config files (compressed, deduplicated, last 5 retained) before overwriting them with the current version. There is no `--yes` flag — non-interactive runs inherit a non-TTY stdin, so gentle-ai's internal prompts auto-pick their default answer.

---

## What stays local (committed in this repo)

Skills that are workflow-specific to this boilerplate live in `.claude/skills/` and are committed to the repo. They install with the clone — no external installer required.

| Skill                 | Trigger                       | Why it stays local                                                                                                                                                                        |
| --------------------- | ----------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `agentic-dev-core`    | (auto, cited by other skills) | Passive reference host for shared doctrine (briefing template, dispatch patterns, orchestration, skill-composition strategy). Loaded on demand by workflow skills — not invoked directly. |
| `project-foundation`  | `/project-foundation`         | Constitution + PRD + SRS + Discovery (one-time per product)                                                                                                                               |
| `project-bootstrap`   | `/project-bootstrap`          | Backend + frontend skeleton + features (OpenAPI, auth, env)                                                                                                                               |
| `testability-guide`   | `/testability-guide`          | `/qa` page + tool-agnostic credentials artifact (Jira / Confluence / Notion / MCP / CLI / manual). Idempotent re-runs on stack drift.                                                     |
| `product-management`  | `/product-management`         | Backlog seeding + epic creation + INVEST/AC refinement                                                                                                                                    |
| `sprint-development`  | `/sprint-development`         | Per-story dev loop (mega-orchestrator, 12-step workflow)                                                                                                                                  |
| `unit-testing`        | `/unit-testing`               | TDD slice — composable mid-flight from `/sprint-development`                                                                                                                              |
| `git-flow-master`     | (auto)                        | Branching/commit/push/PR strategy auto-detected per repo                                                                                                                                  |
| `acli`                | (auto)                        | Atlassian CLI wrapper for Jira/Confluence terminal work                                                                                                                                   |
| `agentic-dev-onboard` | `/agentic-dev-onboard`        | End-to-end onboarding guided tour (pending Phase C)                                                                                                                                       |

These skills evolve with the repo and are versioned in git. The split is intentional: gentle-ai owns the **horizontal** ecosystem (apply across all your repos), this repo owns the **vertical** workflow (specific to `agentic-dev-boilerplate`).

---

## External CLIs (verified, not auto-installed)

Step 11 of `bun run setup` calls `verifyExternalClis()`. The installer **does not install** these — it only checks whether each binary is on `PATH` and prints an install hint (and the official docs URL) when missing. The verify-only stance is deliberate: these are platform-specific tools whose canonical install path differs by OS, and forcing one path would surprise users on others.

| CLI              | Powers in this repo                                                                             | Quick install (cross-platform only — else use docs) | Official docs                                                            |
| ---------------- | ----------------------------------------------------------------------------------------------- | --------------------------------------------------- | ------------------------------------------------------------------------ |
| `bun`            | General-purpose runtime + package manager — this repo runs on bun (scripts, install.ts, dev)    | — (OS-specific — see docs)                          | <https://bun.com/>                                                       |
| `gh`             | GitHub CLI — `gh repo create`, PR ops, `gh api`. Powers Step 9 of the installer                 | — (OS-specific — see docs)                          | <https://github.com/cli/cli#installation>                                |
| `supabase`       | Local Supabase stack, migrations, type generation (`bun run supabase:types`)                    | — (OS-specific — see docs)                          | <https://supabase.com/docs/guides/local-development/cli/getting-started> |
| `vercel`         | Deploy Next.js frontend to Vercel (staging + production via `/sprint-development` deploy steps) | `bun add -g vercel`                                 | <https://vercel.com/docs/cli>                                            |
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
3. **`/playwright-cli`** — the local workflow skill in `.claude/skills/playwright-cli/`. It calls the `playwright-cli` binary from `@playwright/cli`.

The installer verifies (2). If you need the test runner (1) for E2E suites, add it per-project: `bun add -D @playwright/test`.

### Why verify and not install?

Three reasons:

1. **Cross-platform install paths differ**. macOS prefers Homebrew, Windows prefers winget/scoop, Linux varies by distro. A single auto-install path would be wrong for most users.
2. **Global installs are user-scoped, not repo-scoped**. Installing `vercel` or `supabase` globally as part of `bun run setup` would leak state outside the repo. The installer is opinionated about staying local.
3. **Verify + point at docs** is the polite alternative. When a CLI is missing, the installer prints the official documentation URL on a continuation line so users can install the way that fits their setup.

---

## Hand-off matrix — `/sprint-development` vs `/sdd-*`

This is the most common point of confusion. Both workflows can drive a feature to merge. They serve different shapes of work.

| When                                                                 | Skill                                                                |
| -------------------------------------------------------------------- | -------------------------------------------------------------------- |
| Routine Jira ticket work (most cases)                                | `/sprint-development` (ticket-driven workflow)                       |
| Large refactor / architectural decision / feature without ticket yet | `/sdd-*` (spec-driven workflow)                                      |
| Story with detailed specs you want to trace formally                 | Both: `/sdd-spec` for spec, then `/sprint-development` for the cycle |

### When to reach for `/sprint-development`

The default choice for normal day-to-day work. You have a Jira ticket, the AC is reasonably clear, the change is bounded (1-3 PRs), and you want the standard cycle: precheck the epic, transition the ticket through dev states, plan, code, code review, deploy to staging, optionally deploy to production. Nothing about the change requires a multi-page architectural document — a clear implementation plan is enough.

Example: "Add empty state to the user list when no results match the filter." Ticket exists, AC is 3 bullets, scope is one component plus one helper. `/sprint-development` drives the whole thing.

### When to reach for `/sdd-*`

The right choice when the change is shaped more like a research project than a ticket. You're touching architecture, the design space has alternatives worth comparing, the change crosses several modules, or there's no ticket yet because no one has scoped the work. SDD gives you explicit phases (explore → propose → spec → design → tasks → apply → verify → archive) and an artifact trail that survives across sessions via Engram.

Example: "Replace the auth model — move from session cookies to JWT with refresh rotation." This is a change that benefits from `/sdd-explore` (investigate the current model), `/sdd-propose` (compare approaches), and `/sdd-design` (commit to an architecture) before any code lands.

### When to combine both

You have a ticket but the spec is dense and you want it traced formally. Run `/sdd-spec` first to lock down the requirements and scenarios as a delta spec, then hand off to `/sprint-development` for the implementation cycle. The spec gets archived after the ticket merges, leaving a permanent trace for future readers.

---

## Troubleshooting

- **gentle-ai not detected after install** — re-run `bun run setup`. The detector probes `which gentle-ai` plus `gentle-ai version`; if either fails the installer falls back to "skip gentle-ai" branch. Confirm the binary is on PATH (`which gentle-ai` should return a path under `/usr/local/bin/`, `~/bin/`, `~/go/bin/`, or a Homebrew prefix).
- **MCPs returning 401/403** — the matching env var in `.env` is unset or wrong. `.mcp.json` (Claude) and `opencode.jsonc` are committed with `${VAR}` / `{env:VAR}` expansion; real values live in `.env`. Open `.env`, fill the var, and **restart the agent session** — env vars are read once at MCP-server spawn time. See `CLAUDE.md` Critical Reminder #12.
- **MCPs not loading at all** — confirm you launched the agent via `bun claude` / `bun opencode` (wraps with `dotenv-cli`), or that direnv autoload is active (`direnv status` shows your `.envrc` allowed). Launching `claude` directly without either path means MCP placeholders never get expanded.
- **`direnv allow` produced `dotenv_if_exists: command not found`** — this would mean the `.envrc` is using a newer direnv feature than your version supports. The committed `.envrc` uses portable POSIX loading (works on direnv 2.21+), so if you see this, your `.envrc` has been edited locally — restore it from `git checkout .envrc`.
- **Skills not appearing in autocomplete** — restart Claude Code (or your agent of choice). MCP and skill configs are cached at agent startup.
- **How do I uninstall gentle-ai skills?** — `gentle-ai uninstall --agent <agent> --components skills --yes` removes every gentle-ai-managed skill for that agent (gentle-ai's `uninstall` operates at component granularity, not per-skill). `gentle-ai uninstall --all --yes` removes everything gentle-ai-managed for every supported agent. Backups are created automatically before uninstall.

---

## How to opt out

If you prefer not to use gentle-ai, the installer accepts a "skip" choice. To make it permanent:

1. Edit `.agents/install-state.json` and set `"gentleAi": { "status": "skipped" }`.
2. Re-run `bun run setup`. The installer detects the skipped state and only configures the 4 canonical MCPs.

What you lose:

- **SDD spec-driven loop** — `/sdd-*` skills are not installed. Large refactors fall back to ad-hoc planning.
- **Persistent memory (Engram)** — no cross-session recall, no `mem_save` / `mem_search`. Each session starts blind.
- **Adversarial review (judgment-day)** — no parallel-judges review for high-stakes PRs. Code review reverts to single-perspective.
- **Cognitive doc design (cognitive-doc-design)** — no skill that explicitly optimizes docs for low cognitive load. You write the docs by feel.
- **Issue creation (issue-creation)** — no issue-first enforcement helper. You file issues however your team usually does.

What you keep: every workflow skill committed in this repo (`/sprint-development`, `/project-foundation`, etc.) and the 4 canonical MCPs (Tavily, Context7, Supabase, n8n). The repo is fully usable without gentle-ai — the integration is additive.

---

## See also

- [.scratch/plans/GENTLE-AI-RESEARCH.md](./.scratch/plans/GENTLE-AI-RESEARCH.md) — full research doc on the gentle-ai ecosystem (commands, components, agent matrix)
- [CLAUDE.md § Onboarding](./CLAUDE.md) — quick-start entry point for `bun run setup`
- [README.md](./README.md) — project overview and Quick Start
- [docs/setup/README.md](./docs/setup/README.md) — index of remaining setup guides (Jira, MCPs)

---

> **You are here**: What `bun run setup` configures. **Read time**: 10 min. **Next**: `bun run setup:doctor` to verify your install, or [`README.md`](README.md) to navigate the rest.
