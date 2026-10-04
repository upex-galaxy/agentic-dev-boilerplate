# MCP Configuration

This directory holds **opt-in MCP blocks** the repo does not enable, one template per supported host, plus the DBHub example and the long-form per-host syntax guide. The servers the repo actually runs are not here: they live in the three committed configs below.

## Runtime configs committed in this repo

The boilerplate runs on three harnesses from one source (`AGENTS.md` + `.agents/skills/`, see `.agents/instructions/10-harnesses.md` §5.5). The MCP inventory is the one surface that genuinely differs per host, so it exists once per format, committed, with the same server set on every host: whatever `.mcp.json` declares. Only LOCAL (stdio) servers are committed; web search is connected at harness level (see [Capabilities](#capabilities-not-server-names)).

| Harness             | Committed config     | How a secret is referenced                                                                  | Launcher (loads `.env` first) |
| ------------------- | -------------------- | ------------------------------------------------------------------------------------------- | ----------------------------- |
| Claude Code         | `.mcp.json`          | `${VAR}` inside args / env values                                                           | `bun run claude`              |
| OpenCode            | `opencode.jsonc`     | `{file:.auth/opencode/VAR}`: a gitignored value file `bun run harness:env` writes from `.env` | `bun run opencode`            |
| Codex CLI + Desktop | `.codex/config.toml` | `env_vars = ["VAR"]` by name; every stdio server starts through a `.env` loader             | `bun run codex`               |

`bun run agents:compat:check` normalizes the three files into one shape (transport, command, args, url, env vars, enabled) and compares them. The canonical set is whatever `.mcp.json` declares: a server missing from another host, present in one host only, or depending on a different set of `.env` variables, fails the check (it runs inside `repo:check` and the pre-push hook). The servers the boilerplate ships (`KNOWN_MCP_IDS` in `cli/lib/agent-compatibility-contracts.ts`) additionally get a strict per-host shape check when the project declares them; a project that declares a different set passes on the generic check alone. `.codex/config.toml` is read only in a repository Codex trusts; `bun run setup:doctor` warns about that.

### Getting `.env` into the MCP servers

- **Terminal launch:** `bun run claude` / `bun run opencode` / `bun run codex` (`dotenv -o -e .env` wrappers in `package.json`; `-o` makes `.env` win over a stale inherited shell variable).
- **Launch with no command line** (desktop app, a natively launched supervised worker): run `bun run harness:env` after every `.env` change. It writes the `env` block of `.claude/settings.local.json` (on macOS/Linux Claude Code reads the MAIN checkout's copy, so from a worktree the command writes there) and the `.auth/opencode/<VAR>` value files. `bun run harness:env:check` reports drift by variable name, never by value.
- **Codex** needs neither: each stdio server in `.codex/config.toml` starts through `bunx -p dotenv-cli@<pinned> dotenv -o -e .env -- <command>` (the pin lives in `.codex/config.toml`) with `startup_timeout_sec = 30`, so Codex Desktop opened from the Dock gets the same credentials as the CLI.
- **OpenCode** caches the resolved config per directory: after `harness:env` rewrites a value file, run `opencode service restart` (or quit every OpenCode session).
- A worktree carries its own `.env` and `.auth/opencode/`; `bun run worktree:provision` copies the one and regenerates the other.

### A missing credential fails silently

None of the three hosts refuses to start when a variable is unset. The server starts, and dies on its first authenticated call:

| Host        | Unset variable                                                                                                       |
| ----------- | -------------------------------------------------------------------------------------------------------------------- |
| Claude Code | `${VAR}` is passed through as literal text                                                                           |
| OpenCode    | an empty placeholder file (created by `bun install`) resolves to `""`; a MISSING `{file:}` target invalidates the whole config |
| Codex       | the variable is not forwarded                                                                                        |

So a 401/403 or a mystery tool failure is the signal, not a parse error. Check with `/mcp` inside the session, fix `.env`, then restart the session: values are read when the MCP server spawns (`AGENTS.md` Critical Rule #9).

## Capabilities, not server names

Skills never name a server. They declare a CAPABILITY in `metadata.requires_capabilities` (`library-docs`, `web-search`, `db`, `automation-flows`, `diagrams`) and the AI resolves it by tool-name SUFFIX, whatever prefix the host gave the server: `mcp__context7__query-docs` and a claude.ai connector's `mcp__claude_ai_context7__query-docs` are the same capability. When no tool provides a capability the skill needs, the AI stops at that step, names the capability and how to enable it, and waits: it never swaps in another tool on its own.

- **Web search** (`web-search`) is connected once per machine at harness level (Exa first, Tavily second), never in a project file. The recommended servers and their connect commands are in `cli/lib/harness-level-mcps.ts`; `bun run setup` prints them and `bun run setup:doctor` shows what this machine declares.
- **Browser automation** is not an MCP: it is `playwright-cli` named sessions (`.agents/instructions/30-tool-resolution.md` §6, `[AUTOMATION_TOOL]`).
- **Jira / Confluence** go through `acli` by default; the Atlassian MCP is opt-in ([below](#atlassian-mcp-opt-in)).

Vocabulary, suffixes and the stop procedure: `.agents/skills/agentic-dev-core/references/mcp-capabilities.md`. Why web search stays out of the project files: `.context/ADR/ADR-0005-harness-level-mcps-and-capabilities.md`.

## Files in this directory

| File                         | For                | Format | Holds                                                                                       |
| ---------------------------- | ------------------ | ------ | ------------------------------------------------------------------------------------------- |
| `claude.template.json`       | Claude Code        | JSON   | opt-in blocks for `.mcp.json`                                                               |
| `opencode.template.json`     | OpenCode           | JSON   | opt-in blocks for `opencode.jsonc` (each one `"enabled": false`)                            |
| `codex.template.toml`        | Codex CLI + Desktop | TOML  | opt-in blocks for `.codex/config.toml`, stdio ones already wrapped in the `.env` loader     |
| `dbhub.example.toml`         | DBHub (SQL)        | TOML   | starting point for a `dbhub.toml`, used by the opt-in `sql` block                           |
| `mcp-configuration-guide.md` | all three hosts    | md     | per-host syntax reference (scopes, CLI commands, remote servers, OAuth)                     |

`bun run up --update-mcp-template <claude|opencode|codex>` refreshes one template from upstream.

## Adding an opt-in server

Never `cp` a template over a committed config: it would replace the parity-checked server set. Copy single blocks instead.

1. Copy the server's block from each of the three templates into `.mcp.json`, `opencode.jsonc` and `.codex/config.toml`. A server added to one host only fails `bun run agents:compat:check`.
2. Replace each `{{VAR}}` (see below). Secrets become host-native references, never literal values.
3. Add the variables to `.env` and, with an empty value, to `.env.example`.
4. Run `bun run harness:env` (writes the OpenCode value file for the new reference), then `bun run agents:compat:check`.
5. Restart the session and confirm the server with `/mcp`.
6. If a skill should use it, give it a capability row in `mcp-capabilities.md` first; a server no skill instructs gets no capability name.

### `{{VAR}}` placeholders

Templates use `{{VARIABLE}}` as a find-and-replace marker, not runtime syntax. Replace a SECRET with the host-native reference and keep its value in `.env`:

| Host        | `{{API_BEARER_TOKEN}}` becomes                                                                 |
| ----------- | ---------------------------------------------------------------------------------------------- |
| Claude Code | `${API_BEARER_TOKEN}`                                                                          |
| OpenCode    | `{file:.auth/opencode/API_BEARER_TOKEN}`                                                       |
| Codex       | the variable name in `env_vars` (stdio) or `bearer_token_env_var` (HTTP); never inside a value |

Codex never expands `${VAR}` inside `args` or `env` values, so a placeholder there reaches the server as literal text. Where a secret sits inside a larger value (`API_HEADERS = "Authorization:Bearer <token>"`), put the whole value in `.env` and forward it by name.

Non-secret placeholders (`{{API_BASE_URL}}`, `{{OPENAPI_SPEC_URL}}`, `{{SENTRY_ORG}}`, `{{SENTRY_PROJECT}}`, `{{ATLASSIAN_URL}}`) are pasted as literal values. `{{ATLASSIAN_URL}}` is not a `.env` variable: it lives in `.agents/project.yaml` → `issue_tracker.atlassian_url`; print it with `bun run --silent jira:url`.

Pasting a literal secret into a config is only acceptable in a personal, gitignored copy; nothing in `.gitignore` covers such a file for you.

## Key differences by host

| Feature        | Claude Code    | OpenCode                    | Codex                                                       |
| -------------- | -------------- | --------------------------- | ----------------------------------------------------------- |
| Root key       | `mcpServers`   | `mcp`                       | `mcp_servers`                                               |
| Command        | string + `args` | array                      | string + `args`                                             |
| Env vars       | `env`          | `environment`               | `env_vars` (forwarded by name) + `[mcp_servers.X.env]` (literals) |
| Secret in URL  | `${VAR}`       | `{file:.auth/opencode/VAR}` | not possible: `url` + `bearer_token_env_var`                |
| Remote type    | `type: "http"` | `type: "remote"`            | `url`                                                       |
| Enable/disable | N/A            | `enabled`                   | `enabled`                                                   |

Full syntax per host: [`mcp-configuration-guide.md`](./mcp-configuration-guide.md).

## Security

- **Templates** (this folder) are safe for git: `{{VAR}}` placeholders only.
- **Committed configs** (`.mcp.json`, `opencode.jsonc`, `.codex/config.toml`) reference variables only; values live in `.env` (gitignored) and, for OpenCode, in `.auth/opencode/` (gitignored, written by `bun run harness:env`).
- **DBHub:** a project that adds it commits `dbhub.toml` with `${VAR}` references only; literal overrides go in `dbhub.local.toml`, which `.gitignore` already covers.

## Atlassian MCP (opt-in)

The Atlassian MCP server is **not enabled by default**: the boilerplate uses `acli` for all Jira and Confluence work. If you need MCP-level access to Atlassian (tools `acli` does not expose), enable it on all three hosts:

1. Copy the `atlassian` block from each template into `.mcp.json`, `opencode.jsonc` and `.codex/config.toml`.
2. Confirm `ATLASSIAN_EMAIL` and `ATLASSIAN_API_TOKEN` are set in `.env` (the installer collects both during `bun run setup`), and reference them with each host's syntax.
3. Replace `{{ATLASSIAN_URL}}` with the literal site host. The Codex block authenticates through `mcp-remote` OAuth and has no host to replace. Print the host with:

   ```bash
   bun run --silent jira:url
   ```

   An MCP config cannot run a command, so this one value is pasted rather than referenced. After a site migration, update `.agents/project.yaml` first, then re-paste here; `bun run setup:doctor` does not catch a stale value inside an MCP config.

4. Run `bun run harness:env` and `bun run agents:compat:check`, then restart the session.
