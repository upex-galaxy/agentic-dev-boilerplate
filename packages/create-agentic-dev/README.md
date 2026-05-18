# create-agentic-dev

Official scaffolder for the [Agentic Dev](https://github.com/upex-galaxy/agentic-dev-boilerplate)
ecosystem. Downloads the boilerplate template, scrubs git history, initializes a
fresh repository, installs dependencies, and runs the interactive installer.

## Usage

```bash
bunx create-agentic-dev my-app
```

That single command:

1. Downloads `upex-galaxy/agentic-dev-boilerplate` (latest `main`) as a tarball.
2. Extracts into `./my-app/` (no git history).
3. Rewrites `package.json` name + `.agents/project.yaml` `project.name`.
4. Initializes a fresh `git init -b main` and creates the initial commit.
5. Runs `bun install`.
6. Hands off to the boilerplate's interactive installer (`bun run setup`),
   which configures gentle-ai, agent skills, MCPs, `.env`, and — at the end —
   optionally creates a GitHub repository for you via `gh`.

## Flags

| Flag                           | Default                               | Description                                                                                                           |
| ------------------------------ | ------------------------------------- | --------------------------------------------------------------------------------------------------------------------- |
| `<project-name>`               | (required)                            | Target directory name. Required unless `--here` is passed.                                                            |
| `--here`                       | off                                   | Bootstrap into the current directory; or, if already inside a bootstrapped project, skip download and run setup only. |
| `--template <ref>`             | `main`                                | Branch / tag / SHA of the template repo to download.                                                                  |
| `--template-repo <owner/repo>` | `upex-galaxy/agentic-dev-boilerplate` | Override the upstream repository (useful for forks).                                                                  |
| `--project-key <KEY>`          | (prompted)                            | Jira project key (e.g. `UPEX`). Optional — leave blank to fill in later.                                              |
| `--no-install`                 | off                                   | Skip `bun install`.                                                                                                   |
| `--no-setup`                   | off                                   | Skip `bun run setup` — only download + git init.                                                                      |
| `--no-git`                     | off                                   | Skip `git init` + initial commit.                                                                                     |
| `--non-interactive`            | auto on no-TTY                        | Forwarded to the installer. Prompts use safe defaults.                                                                |
| `--help`, `-h`                 |                                       | Print help and exit.                                                                                                  |
| `--version`, `-v`              |                                       | Print CLI version and exit.                                                                                           |

## In-repo mode

If you already cloned `agentic-dev-boilerplate` manually, you can run the CLI
inside that folder:

```bash
cd existing-clone
bunx create-agentic-dev --here
```

The CLI detects the `.template/installer.lock.json` sentinel, skips the download
stage entirely, and jumps straight to the installer.

## Requirements

The scaffolder itself only needs three binaries. Everything else is checked by
the boilerplate's `bun run setup` (the last stage of this CLI) and surfaced
through its own install hints. The split below mirrors the responsibility
boundary, so a missing `gentle-ai` is not an error of `create-agentic-dev` — it's
something `bun run setup` will point you at.

### For the scaffolder itself (checked upfront, exits on missing)

| Tool          | Required for                                                 | Install                                                                                |
| ------------- | ------------------------------------------------------------ | -------------------------------------------------------------------------------------- |
| `bun` ≥ 1.0.0 | Running this CLI, `bun install`, and `bun run setup`         | `curl -fsSL https://bun.sh/install \| bash` · [docs](https://bun.sh/docs/installation) |
| `tar`         | Extracting the GitHub template tarball                       | Ships with macOS/Linux. Windows: use Git Bash or WSL                                   |
| `git`         | `git init` + initial commit (skipped if you pass `--no-git`) | [git-scm.com/downloads](https://git-scm.com/downloads)                                 |

### For `bun run setup` downstream (the boilerplate installer will tell you about these)

| Tier                   | Tool                                                                 | What it does                                                                                                                                                                                   |
| ---------------------- | -------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Hard blocker**       | Claude Code **or** OpenCode                                          | The agent the installer configures. `bun run setup` Step 4 aborts if neither is found. Install [Claude Code](https://docs.claude.com/claude-code) or [OpenCode](https://opencode.ai).          |
| **Quasi-required**     | `gentle-ai` ≥ 1.26.5                                                 | Installs the 15-skill ecosystem + Engram + SDD orchestrator. Missing → installer prints commands and asks exit-or-continue (degraded mode if you continue).                                    |
| **Per-skill (lazy)**   | `gh`, `acli`, `playwright-cli`, `supabase`, `vercel`, `resend`, `jq` | Each is required by a specific skill; Step 11 prints a `found` / `missing` table and never blocks. Install lazily when a skill surfaces a missing-binary error.                                |
| **Convenience opt-in** | `direnv`                                                             | Auto-loads `.env` so the bare `claude` / `opencode` binaries see MCP credentials. Without it, use the cross-platform `bun claude` / `bun opencode` wrappers. **Windows users should skip it.** |

This CLI checks `bun`, `git`, and `tar` up front with a `where` / `which` probe
(POSIX uses `which`, Windows uses `where`) and prints actionable install hints
if any are missing. The boilerplate's installer (invoked as the last stage)
checks everything else. See the unified
[Prerequisites](https://github.com/upex-galaxy/agentic-dev-boilerplate#prerequisites)
section in the boilerplate README for the full list with URLs, per-skill
mapping, and the order in which each layer surfaces what's missing.

## Exit codes

| Code | Meaning                                                           |
| ---- | ----------------------------------------------------------------- |
| 0    | Success                                                           |
| 2    | Usage error (missing name, conflicting flags)                     |
| 10   | Environment error (no bun / no tar / no git)                      |
| 11   | Network error (template download failed)                          |
| 12   | Target directory already exists and is not an agentic-dev project |
| 20   | Bootstrap error (extract / scrub / git init failed)               |
| 30   | `bun install` failed                                              |
| 31   | `bun run setup` failed                                            |
| 130  | User cancelled (Ctrl+C)                                           |

## Local development / testing without npm publish

```bash
git clone https://github.com/upex-galaxy/agentic-dev-boilerplate
cd agentic-dev-boilerplate/packages/create-agentic-dev
bun install
bun run build

# Symlink the bin globally:
bun link

# Anywhere else on your machine:
create-agentic-dev test-app
```

To run directly from source without building:

```bash
bun run src/cli.ts test-app
```

## License

MIT — same as the parent repo.
