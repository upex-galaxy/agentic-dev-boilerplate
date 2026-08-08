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
| `bun` ≥ 1.0.0 | Running this CLI, `bun install`, and `bun run setup`         | macOS/Linux/WSL: `curl -fsSL https://bun.sh/install \| bash` · Windows: `powershell -c "irm bun.sh/install.ps1 \| iex"` |
| `tar`         | Extracting the GitHub template tarball. GNU tar or bsdtar, either works | Ships with macOS, Linux, and Windows 10 1803+ / Windows 11 (`C:\Windows\System32\tar.exe`) |
| `git`         | `git init` + initial commit on `main` (skipped if you pass `--no-git`) | [git-scm.com/downloads](https://git-scm.com/downloads)                                 |
| `node` ≥ 18   | Running this CLI under `npx`                                 | [nodejs.org](https://nodejs.org)                                                       |

**Windows**: PowerShell and cmd are supported; WSL and Git Bash work but are not
required. Install Bun via the PowerShell one-liner rather than `npm i -g bun` —
the npm route writes only a `bun.cmd` shim, which this CLI then has to launch
through `cmd.exe`. `tar` needs no install.

**WSL**: scaffold onto the Linux filesystem (`~/projects/...`). On a `/mnt/c`
path Bun cannot create its bin shims, and `bun install` fails with
`could not open bin metadata file`.

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

## Releasing a new version to npm

Publishing is manual — there is no release workflow in `.github/workflows/`.
The package is owned by a single npm account, so whoever publishes needs to be
logged in as an owner (`npm owner ls create-agentic-dev` lists them).

### The ordering that matters

This package and the template it downloads ship **separately**, and the
scaffolder fetches the template from GitHub `main` at runtime rather than
bundling it. So a change to the boilerplate itself (`package.json` scripts,
`cli/`, skills, docs) reaches users the moment it lands on `main` — no publish
involved. Only changes under `packages/create-agentic-dev/` need npm.

When one release touches both, **push the template first**. Publishing a
scaffolder that expects template changes which are not yet on `main` breaks
every scaffold until the push lands.

### Steps

```bash
# 1. From the repo root — the whole suite must be green before you publish.
bun run repo:check

# 2. Package-level gates.
cd packages/create-agentic-dev
bun test
bun run types:check
bun run check:manifest      # installer-manifest.json must not have drifted

# 3. Bump the version. Semver against the PUBLISHED version, not the file:
#    npm view create-agentic-dev version
#    patch = bug fix · minor = new flag or behaviour · major = breaking CLI change
npm version patch --no-git-tag-version

# 4. Record the change in the root CHANGELOG.md (move the relevant
#    "Unreleased" entries under the new version heading).

# 5. Commit, then push the TEMPLATE side first if this release depends on it.
git add -A
git commit -m "chore(create-agentic-dev): bump to X.Y.Z"
git push origin main

# 6. Publish. `prepublishOnly` runs `check:manifest` + `build` for you.
npm login                   # if `npm whoami` errors with 401
npm publish

# 7. Tag the release.
git tag -m "create-agentic-dev X.Y.Z" create-cli-vX.Y.Z
git push origin create-cli-vX.Y.Z

# 8. Verify what actually went out.
npm view create-agentic-dev version
cd "$(mktemp -d)" && bunx create-agentic-dev@latest smoke-test --no-setup
```

### What ends up in the tarball

`files` is `["README.md", "dist"]`, so the published package is exactly three
entries — `README.md`, `dist/cli.js`, `package.json`. Nothing under `src/`,
`tests/` or `scripts/` ships; `dist/cli.js` is the bundled build of all of them.

### Gotcha: `npm pack --dry-run` does not rebuild

`prepublishOnly` is what regenerates `dist/cli.js`, and only `npm publish` runs
it. `npm pack --dry-run` packs whatever `dist/cli.js` is already on disk — which
is gitignored, so it can be weeks stale and predate the very fix you are
shipping. To inspect the real contents before publishing, build first:

```bash
bun run build && npm pack --dry-run
```

## License

MIT — same as the parent repo.
