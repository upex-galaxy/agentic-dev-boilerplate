# The installer — what `bun run setup` configures

> **Audience**: developers cloning `agentic-dev-boilerplate` for the first time, anyone deciding whether to opt into the gentle-ai ecosystem, or anyone trying to understand which CLI / skill / MCP layer does what.
> **Read time**: 10 minutes.
> **Status**: stable as of 2026-05-11.

This doc is the **contract that `cli/install.ts` implements**. It covers the four installer layers — gentle-ai (~30%), community skills via `npx skills add` (~25%), locally committed workflow skills (~20%), the canonical MCPs (~15%) — plus the external CLI verification step and the opt-out path.

---

## What is gentle-ai and why this repo uses it

[gentle-ai](https://github.com/Gentleman-Programming/gentle-ai) is a user-level installer that configures AI agents (Claude Code, OpenCode, Cursor, etc.) with a curated set of skills, an MCP-based persistent memory layer (Engram), and an SDD (Spec-Driven Development) orchestrator. It does not install agents themselves — it tunes the agents you already have.

This repo treats gentle-ai as a **base global "quasi-must-have"**. The recommended onboarding (`bun run setup`) installs it if missing, then layers 15 skills + Engram + the SDD orchestrator on top of your agent. The result is one consistent skillset across every repo on your machine that follows this model.

The integration is **not strict**. If you choose to skip gentle-ai, the repo still works: workflow skills committed locally (`/sprint-dev`, `/agentic-dev-core`, etc.) keep functioning, and the 4 canonical MCPs are still configured. What you lose is the SDD spec-driven loop, persistent cross-session memory, adversarial review, and a few documentation/communication helpers. Section "How to opt out" below details the trade-off.

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

> The installer dispatches one `gentle-ai install --skill <slug> --agent <agent>` per skill, plus `gentle-ai install --component engram --agent <agent>` for Engram. Re-runs are idempotent: already-installed skills are skipped.

---

## What stays local (committed in this repo)

Skills that are workflow-specific to this boilerplate live in `.claude/skills/` and are committed to the repo. They install with the clone — no external installer required.

| Skill                 | Trigger                | Why it stays local                                          |
| --------------------- | ---------------------- | ----------------------------------------------------------- |
| `agentic-dev-core`        | `/agentic-dev-core`        | One-time bootstrap of `.agents/` + scripts + CLAUDE.md      |
| `project-foundation`  | `/project-foundation`  | Constitution + PRD + SRS + Discovery (one-time per product) |
| `project-bootstrap`   | `/project-bootstrap`   | Backend + frontend skeleton + features (OpenAPI, auth, env) |
| `product-management`  | `/product-management`  | Backlog seeding + epic creation + INVEST/AC refinement      |
| `sprint-dev`          | `/sprint-dev`          | Per-story dev loop (mega-orchestrator, 12-step workflow)    |
| `unit-testing`        | `/unit-testing`        | TDD slice — composable mid-flight from `/sprint-dev`        |
| `git-flow-master`     | (auto)                 | Branching/commit/push/PR strategy auto-detected per repo    |
| `acli`                | (auto)                 | Atlassian CLI wrapper for Jira/Confluence terminal work     |
| `agentic-dev-onboard` | `/agentic-dev-onboard` | End-to-end onboarding guided tour (pending Phase C)         |

These skills evolve with the repo and are versioned in git. The split is intentional: gentle-ai owns the **horizontal** ecosystem (apply across all your repos), this repo owns the **vertical** workflow (specific to `agentic-dev-boilerplate`).

---

## External CLIs (verified, not auto-installed)

Step 11 of `bun run setup` calls `verifyExternalClis()`. The installer **does not install** these — it only checks whether each binary is on `PATH` and prints an install hint (and the official docs URL) when missing. The verify-only stance is deliberate: these are platform-specific tools whose canonical install path differs by OS, and forcing one path would surprise users on others.

| CLI              | Powers in this repo                                                                       | Install hint (when missing)                                                              | Official docs                                                          |
| ---------------- | ----------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------- | ---------------------------------------------------------------------- |
| `vercel`         | Deploy Next.js frontend to Vercel (staging + production via `/sprint-dev` deploy steps)   | `npm i -g vercel`                                                                        | <https://vercel.com/docs/cli>                                          |
| `supabase`       | Local Supabase stack, migrations, type generation (`bun run supabase:types`)              | `brew install supabase/tap/supabase` (or: `npm i -g supabase`)                           | <https://supabase.com/docs/guides/local-development/cli/getting-started> |
| `acli`           | Atlassian CLI for Jira/Confluence terminal workflows — used by the `/acli` skill          | `brew tap atlassian/homebrew-acli && brew install acli`                                  | <https://developer.atlassian.com/cloud/acli/guides/install-macos/>     |
| `playwright-cli` | Agent-driven browser automation — used by the `/playwright-cli` skill                     | `bun add -g @playwright/cli@latest` (or: `npm install -g @playwright/cli@latest`)        | <https://playwright.dev/agent-cli/introduction>                        |
| `resend`         | Send transactional email via Resend (used by features that integrate email notifications) | `npm i -g resend`                                                                        | <https://resend.com/docs/send-with-nodejs>                             |

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

## Hand-off matrix — `/sprint-dev` vs `/sdd-*`

This is the most common point of confusion. Both workflows can drive a feature to merge. They serve different shapes of work.

| When                                                                 | Skill                                                        |
| -------------------------------------------------------------------- | ------------------------------------------------------------ |
| Routine Jira ticket work (most cases)                                | `/sprint-dev` (ticket-driven workflow)                       |
| Large refactor / architectural decision / feature without ticket yet | `/sdd-*` (spec-driven workflow)                              |
| Story with detailed specs you want to trace formally                 | Both: `/sdd-spec` for spec, then `/sprint-dev` for the cycle |

### When to reach for `/sprint-dev`

The default choice for normal day-to-day work. You have a Jira ticket, the AC is reasonably clear, the change is bounded (1-3 PRs), and you want the standard cycle: precheck the epic, transition the ticket through dev states, plan, code, code review, deploy to staging, optionally deploy to production. Nothing about the change requires a multi-page architectural document — a clear implementation plan is enough.

Example: "Add empty state to the user list when no results match the filter." Ticket exists, AC is 3 bullets, scope is one component plus one helper. `/sprint-dev` drives the whole thing.

### When to reach for `/sdd-*`

The right choice when the change is shaped more like a research project than a ticket. You're touching architecture, the design space has alternatives worth comparing, the change crosses several modules, or there's no ticket yet because no one has scoped the work. SDD gives you explicit phases (explore → propose → spec → design → tasks → apply → verify → archive) and an artifact trail that survives across sessions via Engram.

Example: "Replace the auth model — move from session cookies to JWT with refresh rotation." This is a change that benefits from `/sdd-explore` (investigate the current model), `/sdd-propose` (compare approaches), and `/sdd-design` (commit to an architecture) before any code lands.

### When to combine both

You have a ticket but the spec is dense and you want it traced formally. Run `/sdd-spec` first to lock down the requirements and scenarios as a delta spec, then hand off to `/sprint-dev` for the implementation cycle. The spec gets archived after the ticket merges, leaving a permanent trace for future readers.

---

## Troubleshooting

- **gentle-ai not detected after install** — re-run `bun run setup`. The detector probes `which gentle-ai` plus `gentle-ai version`; if either fails the installer falls back to "skip gentle-ai" branch. Confirm the binary is on PATH (`which gentle-ai` should return a path under `/usr/local/bin/`, `~/bin/`, `~/go/bin/`, or a Homebrew prefix).
- **MCPs not loading** — open `.mcp.json` in the repo root and check that no `{{VAR_NAME}}` placeholders remain. The installer fills them with values you provided or with placeholders for later. Replace placeholders with real values, or export the env vars in your shell. `.mcp.json` is gitignored.
- **Skills not appearing in autocomplete** — restart Claude Code (or your agent of choice). MCP and skill configs are cached at agent startup.
- **How do I uninstall gentle-ai skills?** — `gentle-ai uninstall --skill <slug> --agent <agent>` removes a single skill. `gentle-ai uninstall --all --agent <agent>` removes everything gentle-ai-managed for that agent. Backups are created automatically before uninstall.

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

What you keep: every workflow skill committed in this repo (`/sprint-dev`, `/agentic-dev-core`, etc.) and the 4 canonical MCPs (Tavily, Context7, Supabase, n8n). The repo is fully usable without gentle-ai — the integration is additive.

---

## See also

- [.scratch/plans/GENTLE-AI-RESEARCH.md](./.scratch/plans/GENTLE-AI-RESEARCH.md) — full research doc on the gentle-ai ecosystem (commands, components, agent matrix)
- [CLAUDE.md § Onboarding](./CLAUDE.md) — quick-start entry point for `bun run setup`
- [README.md](./README.md) — project overview and Quick Start
- [docs/setup/README.md](./docs/setup/README.md) — index of remaining setup guides (Jira, MCPs)
