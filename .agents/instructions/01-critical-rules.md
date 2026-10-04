---
id: critical-rules
title: "Critical rules (full text)"
load_when: "about to break, unsure about, or asked about a Critical Rule"
triggers: ["critical rule", "regla cr[ií]tica", "\\brule #?\\d+", "\\bregla #?\\d+"]
paths: []
---

# Critical rules (full text)

> Section `critical-rules` of the project instructions (progressive disclosure, L1). The router in `AGENTS.md` (L0) names when to read it. Edit this file, never paste its prose back into `AGENTS.md`.

Each rule below carries the same number and name as in `AGENTS.md` § 1, where its binding sentence is quoted verbatim. This file holds the full text: the rationale, the edge cases and the mechanics.

## 1. CREDENTIALS

ALWAYS read from `.env`. NEVER hardcode/guess. Example keys: `LOCAL_USER_EMAIL`, `STAGING_USER_PASSWORD`. Add `[Project-specific reminders]` per project (e.g. "SPA and API on different hosts: use correct base URLs").

## 2. PLAN BEFORE CODING

Produce impl plan (`implementation-plan.md` or skill-internal plan) BEFORE code. Flow: Plan → Code → Review.

## 3. NO AI ATTRIBUTION

NEVER include "Generated with Claude Code", "Co-Authored-By: Claude", harness branding, or any equivalent authorship/advertising line in commits. Commits look human-authored. **Forensic trailers are the one MANDATORY exception and are NOT attribution**: every commit an agent session writes ends with `Worktree: <name|primary>` then `Session: <label>`, copied from the `AGENT IDENTITY:` line the prompt hook injects (`unknown` when unresolved). They answer "which checkout and which session produced this line", not "who wrote it", and name no tool. `Claude-Session:` and every other harness-branded trailer are FORBIDDEN (ADR-0004 supersedes ADR-0002 item 8). `.husky/commit-msg` WARNS on a missing pair or a branded trailer, never blocks. Canon + label rule: `.agents/skills/git-flow-master/SKILL.md` §3.2.

## 4. PUSH TO PROTECTED = RESOLVE `git_strategy.policy.direct_push_to_protected`

(`.agents/project.yaml`; protected list = `git_strategy.protected`): `forbidden` → NEVER direct-push, route through a PR. `confirm` → ask explicit user confirmation before EVERY push. `allowed` → standing authorization, push without asking (asking anyway collapses `allowed` into `confirm`). `git_strategy` block missing or null (fresh scaffold) → behave as `confirm`. NEVER hardcode the answer here: the variable is the decision. Mechanics: `git-flow-master` §3.3.

## 5. GIT HISTORY

NEVER rewrite pushed history (rebase/amend on pushed commits). NEVER force-push to shared branches. NEVER delete remote branches without confirmation. ALWAYS add forward (new commits, not rewrite). ALWAYS preserve merge history.

## 6. QUALITY VERIFICATION

After code changes, verify in order: tests → types → lint. No skip steps.

## 7. FILE OPERATIONS

ALWAYS read file before edit. Preserve formatting + indent. NEVER overwrite without reading.

## 8. SKILLS-FIRST

All workflows live in `.agents/skills/`. NEVER paste instructions inline. Invoke matching skill, let it self-load detail. Use `[TAG_TOOL]` pseudocode + `{{VARIABLES}}` for dynamic content.

## 9. MCP CREDENTIAL FAILURE = STOP IMMEDIATELY

MCP fail auth or env var missing. **The failure is SILENT on every host but Codex**: `.mcp.json` `${VAR}` unset → Claude Code passes the LITERAL `${VAR}` through and the server dies later on its first authenticated call, NOT a parse error (`/mcp` inside a session is the check); `opencode.jsonc` reads `{file:.auth/opencode/VAR}`: an existing empty placeholder (`bun install` creates them) → empty string, a missing file → OpenCode config error; `.codex/config.toml` is the only loud one (a missing `bearer_token_env_var` is a hard error naming the server). **So a 401/403 or a mystery tool failure is the signal**: never wait for a parse error that will not come. NO workaround. STOP, tell user exact env var, point to `.env` / `.env.example`, ask fix `.env` + **RESTART AGENT SESSION** (env cached at MCP-spawn time, no refresh mid-session).

## 10. SCRIPTS = READ `package.json` DIRECTLY

NEVER quote build/test/lint commands from `AGENTS.md`, an instruction section or any doc: drift kills. Open `package.json` first, then answer.

## 11. DEFAULT COMMUNICATION MODE: CAVEMAN

If caveman installed user-level (the `caveman@caveman` Claude Code plugin, §2 layer table), respond caveman level `full` by default (drop articles, fillers, pleasantries; fragments OK; technical terms exact; code/commits/PRs/security warnings always write normal English: caveman built-in boundary). Revert verbose ONLY when user explicitly say "normal mode", "habla normal", "stop caveman", "speak normally", "be verbose", "más detallado" or clear semantic equivalent. If caveman not installed, or the host is not Claude Code (`.agents/instructions/10-harnesses.md` §5.5), rule = no-op.

## 12. LANGUAGE DETECTION + MIRRORING

At start of every conversation, READ FULL USER MESSAGE (not just opening words) to detect user's working language. Mirror that language in ALL conversational replies (questions, summaries, explanations, status updates). Repo artifacts ALWAYS English regardless of conversation language: code, code comments, commits, PR titles + bodies, branch names, file names, test names, configuration values, + any external action artifact (Jira issues/comments, GitHub issues/PRs/comments, Slack messages, emails, deploy notes, MCP tool inputs). Override: if user explicitly request another language for specific artifact ("crea el ticket en español", "write this PR description in Spanish"), honor that request only for that artifact + continue defaulting to English for next ones unless re-requested.

## 13. NO GLOBAL DISCARDS (MULTI-SESSION SAFETY)

PROHIBITED to run repo-wide destructive git commands: `git restore .`, `git checkout -- .`, `git reset --hard`, untargeted `git stash`, `git clean -f`. Multiple agent sessions may share this working tree without worktrees: a global discard silently destroys another session's uncommitted work, unrecoverably. Discard ONLY explicit paths YOU modified in THIS session (`git restore <path>...` / `git stash push <path>...`). Unsure who modified a file → do NOT restore it: ask the user.

## 14. UI FIDELITY CONTRACT

Story has UI + `.context/design/master-design-plan.md` exists → look story up in §8 (US→Screen map) → open §4 screen spec + §2 frozen tokens → use the mockup in `.context/designs/<project-slug>/<batch-slug>/` as inspiration (LIVE-UI-FIRST below). NEVER invent UI. **Fidelity reference = the CURRENT LIVE UI + `DESIGN.md` tokens**: a UI change that diverges from the live UI or the tokens and carries no §5 ratification = defect (review gate); following the improved live UI where the mockup differs is NOT a defect. Story missing from §8 → STOP: (a) just-in-time mockup via `/design-system` screen phase (the AI commissions it through a design tool, capability Open Design MCP or equivalent, or generates the HTML itself through a loaded design skill, or hands the user a portable brief for Claude Design / Open Design; the bundle lands in the drop zone and a human ratifies it), (b) ratify spec-only build in §5 (+ ADR if architectural), or (c) explicit user-approved DESIGN.md-only build. No plan at all → DESIGN.md-only fidelity (tokens, no screen reference). **The AI NEVER hand-authors mockups outside a design skill** (design-system D7): it may commission them through a design tool, and it may generate its own HTML mockups ONLY through a design skill loaded for that job (category `frontend-ui` in `agentic-dev-core/references/skill-composition-strategy.md`), which then counts as the design tool; with no design skill loaded it may not. A human ratifies every mockup, whatever produced it; with no tool and no design skill available the answer is (b) or (c), never markup written to fill the gap.

**LIVE-UI-FIRST (refines design fidelity)**: the CURRENT LIVE UI is the source of truth for fidelity, NOT the mockup. Mockup = INSPIRATION to stay close to or improve upon, adapted to what already exists. Therefore: (1) before building UI, INSPECT the current live components and REUSE them; (2) never blind-copy the mockup where it conflicts with the improved live UI; (3) navigation: how a user reaches and moves through the app: is paramount for UX; (4) if the mockup has something genuinely good the live UI lacks, do NOT force it into the current story: file it as a future tech-story / tech-debt. Live-UI validation (`/sprint-development`) checks consistency with the current app + design system, not pixel-match to the mockup. The §5 ratification machinery still applies: a deliberate departure from the live UI or the tokens, or a build with no mockup, is recorded as a §5 spec-only divergence (+ ADR if architectural).

## 15. HARNESS SURFACES ARE GENERATED

never hand-edit `CLAUDE.md` (shim) or `.claude/skills` (alias). Edit the source (`AGENTS.md`, `.agents/skills/`, `.agents/hooks/`) and run `bun run agents:compat`. `bun run agents:compat:check` is the gate. A skill is invoked by its name plus a mode; no command file ships, and a command named like a skill is refused (ADR-0006). Full wiring → §5.5.

## 16. A SUCCESS CODE DESCRIBES THE CALL, NEVER THE OUTCOME: VERIFY AT THE DESTINATION

`ok: true`, exit 0, `201`, `accepted`, a returned id or URL all say the REQUEST was well formed. None of them says the thing happened. **A green receipt is the most dangerous kind of green, because it SUPPRESSES the verification that would have caught the failure.** So verify by reading the destination back: a Jira transition by re-reading the issue's status (`bun run jira:sync-issues get <KEY>`), a deploy by polling the deployment for the pushed commit SHA until it reads `READY` (never "the push succeeded" or "Vercel accepted the build"), a Supabase migration by re-reading the schema / migration list it was meant to change, a push to a protected branch by `bun run git:policy verify` (a push that went through may have been a bypass), a file write by re-parsing the file, a subagent's "done" by checking the files or tests it claims. Binds subagent reports, `[ISSUE_TRACKER_TOOL]` writes, MCP calls, the updater and every CLI in `.agents/instructions/30-tool-resolution.md` §6.5. Where verifying is genuinely expensive, SAY the claim is unverified rather than letting the receipt stand in for it.

## 17. COMMITTED PROSE NAMES THE SOURCE OF TRUTH, NEVER ITS CURRENT VALUE

text that is committed (`AGENTS.md`, `.agents/**`, `docs/**`, `README.md`, `INSTALLER.md`, `CONTEXT.md`, the decks and the Pages home) NEVER states a fact that changes with the normal life of the repo, the tracker or the deploy platform. Forbidden: a COUNT that moves (skills, aliases, MCP servers, scripts, Jira fields / statuses, tests, files, rows, gates `N/N`); an ENUMERATION of a mutable set owned elsewhere (the skill list, the alias list, the server list, the updater surfaces); a `file:line` citation (a path, a symbol or a heading is fine); a CURRENT-STATE claim ("today", "currently", "as of <date>", a dated verification, a measured size, a tool version, a PR or issue number as live state); and EDIT-HISTORY narration inside doctrine ("since <version>", "correcting an earlier claim"). Every one goes stale within weeks, and then every session either trusts a wrong value or burns a turn reporting the drift. Write the NAME of the owner instead and let the reader resolve it: a file (`.mcp.json`), a command (`bun run skills:registry`), a generated artifact (`REGISTRY.md`), a constant (`SURFACE_ORDER` in `cli/lib/updater-parity.ts`). STABLE names that change only by decision are fine: stage names, rule numbers, file and command names, "three hosts". EXEMPT: gitignored files and `.session/**`, generated artifacts, ADRs / `CHANGELOG.md` / dated reports (a number "at the time" is right forever), test fixtures, code constants, example output inside fenced blocks. A fact that must be stated with its date goes to an ADR and the doctrine links to it; the measurements behind this repo's own doctrine are in `.context/ADR/ADR-0003-forensic-measurements-ledger.md`. `scripts/lint-skills.ts` and `scripts/lint-docs.ts` (`bun run docs:check`) flag the two regex-visible families (`FILE-LINE`, `CURRENT-STATE`) as blocking errors in `repo:check`; a line that must carry one is marked `volatile-ok: <reason>`. Canon + examples: `agentic-dev-core/references/volatile-facts.md`. <!-- volatile-ok: names the words it forbids -->

---
