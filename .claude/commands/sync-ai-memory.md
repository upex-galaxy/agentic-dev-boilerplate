---
name: sync-ai-memory
description: Audit + sync all AI-consumed documentation in this repo. Detects critical markdown files (README, CLAUDE.md, CONTEXT.md, docs/agentic-development-engineering.md, docs/getting-started.md, plus auto-detected high-frequency docs) and patches them in-place. Also syncs the rendered HTML mirror (docs/onboarding/index.html) when present. Preserves human-authored structure — never rewrites from scratch. Triggers on 'sync ai memory', 'sync docs', 'sincronizar memoria', 'docs audit', 'realinear documentación con el estado del repo' (canonical), plus back-compat aliases 'refresh memory', 'refresh ai memory', 'actualizar memoria', 'refrescar documentación'. Do NOT use for: writing new docs (use /agentic-dev-core or manual), generating business maps (use /business-data-map etc.), creating CONTEXT.md from scratch (one-time manual creation).
license: MIT
compatibility: [claude-code, copilot, cursor, codex, opencode]
---

# Sync AI Memory — Repo Doc Audit & Sync

Audit every markdown file the AI consumes at session start (or that humans treat as authoritative), then **patch in place** only the facts that have drifted. The verb is **sync**, not refresh: once the operation grew to audit + cross-doc consistency check + per-doc preserve-list + HTML rendered-from sync, the original "refresh" framing was too narrow. Every doc in scope is either patched surgically or confirmed unchanged.

**Target**: `$ARGUMENTS` (leave blank to operate on the current repo)

---

## What this does

1. **Audits** the repo via a delegated sub-agent to discover every AI-critical markdown file (auto-detected via 5 heuristic rules), then merges that list with a fixed set of always-included docs.
2. **Gates** on user approval — shows the prioritized list (CRITICAL / HIGH / MEDIUM) and waits for `proceed` / `adjust` / `abort` before touching anything.
3. **Patches** each approved file in-place, preserving structure, headers, comments, examples, and human-authored prose. Only drifted facts (paths, commands, skills, MCPs, env vars, counts, dates) get updated.

## What this does NOT do

- **Does NOT rewrite docs from scratch.** README and CLAUDE.md are the BASE; this command edits them, never regenerates them.
- **Does NOT generate new documentation files.** Use `/agentic-dev-core`, `/project-foundation`, or manual creation for new docs.
- **Does NOT generate business maps.** Those are owned by `/business-data-map`, `/business-feature-map`, `/business-api-map`, `/master-implementation-plan`.
- **Does NOT touch generated artifacts.** SKILL.md files (except where listed below), `references/*` caches, `testing-capabilities.json`, and other auto-generated files are skipped.
- **Does NOT rewrite skill reference files.** `.claude/skills/agentic-dev-core/references/behavioral-layer.md`, `typescript-patterns.md`, and the other 6 references are skill-internal — managed by `/agentic-dev-core`, not this command. Sync validates they exist + cross-doc consistency only.

---

## The 6 always-included docs (+ 1 rendered-from HTML target)

These are **always** in scope, regardless of what the audit discovers. They are the highest-frequency AI-consumed docs in this repo.

| File | Role | Why it's always in scope |
|---|---|---|
| `README.md` | `anchor` | Human-facing entry point; synced from `package.json` scripts + project identity |
| `CLAUDE.md` (or detected equivalent) | `anchor` | AI memory file loaded every session |
| `.claude/skills/agentic-dev-core/templates/CLAUDE.md.template` | `structural-mirror` | Template mirror of live `CLAUDE.md`. Must match the 13-section structure header-for-header. Sync via Phase 4c (structural diff + placeholder restore). |
| `CONTEXT.md` | `anchor` | Canonical Context Engineering reference for this repo; patched for `.context/` path changes |
| `docs/agentic-development-engineering.md` | `supplementary` | Vision + lifecycle overview; patched for command/skill/path drift |
| `docs/getting-started.md` | `supplementary` | Operator guide; patched for command names, quick-reference tables |
| `docs/onboarding/index.html` | `rendered-from` | HTML mirror of `docs/getting-started.md`. Sync via Phase 4b (patch-in-place text nodes only — sidebar/JS/CSS preserved) |

The audit (Phase 1) may **add** docs to this list. It never removes a file from the always-included set — files that don't exist on disk are simply marked `skipped (not present)`.

### What the `rendered-from` role means

A `rendered-from` target is an HTML file whose **base name matches an adjacent MD file** (e.g. `docs/onboarding/index.html` is paired with `docs/getting-started.md` via narrative content, even though stems differ — the audit also accepts an explicit pairing manifest). The HTML carries hand-crafted sidebar nav, tab panels, JS-driven navigation, card layouts, and CSS classes that have no equivalent in the MD source.

**Architectural decision — patch in place, do NOT regenerate from MD**. Regenerating would destroy the custom structure on every sync run. Phase 4b only patches **text nodes** that mirror drifted facts: `<code>` element contents, `<td>` cells, plain-text spans with classes like `mnemonic`. Sidebar, `<head>`, `<script>`, and `<style>` are treated as opaque-preserve.

---

## Phase 1 — Audit (delegated to sub-agent)

**Do NOT run the audit inline.** Dispatch a dedicated sub-agent to scan the repo and classify every `.md` file. This keeps the orchestrator's context lean.

### Sub-agent briefing template

```
Goal: Audit all markdown files in this repo and classify by AI-criticality. Produce a priority-sorted list of files to refresh.

Scan: <repo root>
Exclude paths (hard-skip — never scan or report):
  - node_modules/
  - .git/
  - dist/, build/, out/, .next/
  - .scratch/, .tmp/, .cache/
  - coverage/
  - .claude/skills/*/SKILL.md (managed by their own skill)
  - .claude/skills/*/references/* (skill-internal docs cache)
  - .agents/testing-capabilities.json (auto-generated)
  - Any file generated by another /command (business-data-map.md, business-feature-map.md, business-api-map.md, master-implementation-plan.md — these are owned by their generating commands)

Classification heuristic — a file qualifies if it matches ANY rule:

RULE 1 — All-caps root files (highest signal):
  Files at the repo root whose stem is all uppercase (README.md, CLAUDE.md, CONTEXT.md, INSTALLER.md, etc.).

RULE 2 — Referenced by CLAUDE.md or any SKILL.md:
  Scan CLAUDE.md and .claude/skills/*/SKILL.md for path mentions under docs/ or repo root. Any file mentioned by name (not just a directory) qualifies.

RULE 3 — Lives under docs/ and is not a skill subreference:
  Top-level docs/*.md files qualify. Nested files (docs/setup/*, docs/workflows/*) qualify only if they meet Rule 2 or Rule 4.

RULE 4 — High inbound reference density (≥ 3 cross-references):
  Scan .claude/skills/**/*.md and .claude/commands/*.md for file-path mentions. Count per target. Files with ≥ 3 references qualify.

RULE 5 — Likely-drifting content:
  File mentions ≥ 2 of: bun run commands, /skill or /command names, MCP names, env vars, .context/ paths, environment URLs. Higher count = stronger signal.

RULE 6 — Rendered-from HTML (NEW):
  Any `.html` file whose directory contains an MD file with overlapping narrative content (e.g. docs/onboarding/index.html mirrors docs/getting-started.md). These are tagged with role `rendered-from` and processed in Phase 4b (patch-in-place text nodes, sidebar/JS/CSS preserved). Do NOT classify as SKIP just because the file extension is not .md.

Classification levels:
  CRITICAL — Anchor docs (Rule 1) + AI memory file. Patch failure is blocking.
  HIGH — Multi-rule matches OR top-level docs/ files referenced by skills. Patch failure surfaces but does not block.
  MEDIUM — Single-rule matches with drift signals. Patch best-effort.
  RENDERED-FROM — HTML mirror of an MD doc (Rule 6). Patched in Phase 4b after the source MD is updated.
  SKIP — Excluded by the hard-skip list, or no drift signals detected.

For each qualifying file, report:
  - Path (absolute or repo-relative)
  - Classification (CRITICAL / HIGH / MEDIUM)
  - Rules matched (e.g. "R1, R2, R5")
  - Drift indicator count (rough count of facts that may need verification: bun commands, /skills, MCPs, env vars, paths mentioned)
  - Last-modified date (so the orchestrator can prioritize)

Report format: priority-sorted table (CRITICAL first, then HIGH, then MEDIUM).

Do NOT read full file contents — only the signals needed for classification. Do NOT propose edits. Do NOT touch disk.

If you make important discoveries, save them to engram via mem_save with project: 'agentic-dev-boilerplate'.
```

### Merging the audit list with always-included

After the sub-agent returns:

1. Take the audit result.
2. Force-add the 6 always-included docs (skip ones not on disk; mark them `not present`).
3. Force-promote `README.md`, `CLAUDE.md` (or detected equivalent), `CONTEXT.md`, and the template mirror to `CRITICAL` if they aren't already.
4. Deduplicate.

---

## Phase 2 — Approval gate

Show the user the merged, prioritized list. Format:

```
Audit complete. Proposed refresh scope:

CRITICAL (3)
  - README.md                                    [always-included, R1, R5]
  - CLAUDE.md                                    [always-included, R1, R2, R5]
  - CONTEXT.md                                   [always-included, R1, R2, R5]

HIGH (2)
  - docs/agentic-development-engineering.md      [always-included, R2, R3, R5]
  - docs/getting-started.md                      [always-included, R2, R3, R5]

MEDIUM (N)
  - <auto-detected files>

EXCLUDED (informational)
  - SKILL.md files (managed by their own skill)
  - .context/business/business-*-map.md (owned by their generating commands)

Respond with:
  - "proceed"  → patch all listed files
  - "adjust"   → I'll tell you which files to add/remove
  - "abort"    → stop without writing anything
```

**Do not write anything until the user confirms.**

---

## Phase 3 — Detect AI memory file

Auto-detect which AI memory file lives in this repo. Pick the first match:

| Tool | File | Auto-loaded by |
|---|---|---|
| Claude Code | `CLAUDE.md` | Claude Code CLI |
| Gemini CLI | `GEMINI.md` | Gemini CLI |
| Claude Agent SDK | `CLAUDE.md` | Agent SDK |
| Cursor | `.cursor/rules` | Cursor |
| GitHub Copilot | `.github/copilot-instructions.md` | Copilot |
| Windsurf | `.windsurf/rules` | Windsurf |

If none exist, ask the user which AI tool they use and create the directory if missing (e.g. `mkdir -p .cursor`). If multiple exist, ask which one to refresh — do not assume. Whichever file is selected replaces `CLAUDE.md` in the approved scope.

---

## Phase 4 — Per-file patch (CRITICAL → HIGH → MEDIUM)

For each approved file, in priority order:

### a) Read current state

Read the file in full. **This version is the BASE.** All edits are diffs against this content. Never write a fresh draft from a template if the file already exists.

### b) Identify drift

For every fact in the file, verify it against the actual repo state. The most common drift sources:

| Drift category | How to verify |
|---|---|
| File paths | `ls <path>` — does it exist? |
| `bun run X` commands | Read `package.json` — is the script present? |
| `/skill-name` references | `ls .claude/skills/<name>/` — does the skill exist? |
| `/command-name` references | `ls .claude/commands/<name>.md` — does the command exist? |
| MCP names | Read `.mcp.json` — is the MCP listed? (`.mcp.example.json` was removed; `.mcp.json` is now committed) |
| Env var names | Read `.env.example` — is the variable defined? |
| Section counts / table row counts | Count actual entries vs. the declared count |
| Versions, dates | Compare against current value |
| Skill/command descriptions | Read the SKILL.md frontmatter `description:` and verify the doc quotes it accurately |
| Cross-doc fact agreement | If a fact appears in multiple docs (env URLs, command names, project identity), all copies must agree |

### c) Patch surgically (the patch-no-rewrite rule)

For each drift detected, apply the smallest possible Edit. The rules:

1. **Patch, never rewrite.** Use the `Edit` tool with the exact original `old_string` and a minimal `new_string`. Never use `Write` to replace a file that already exists.
2. **Preserve human structure.** Headers, comment lines, code-fence languages, ordered/unordered list styles, table column widths, blank-line spacing — all preserved byte-for-byte except for the changed cells.
3. **Preserve human prose.** Examples, rationale paragraphs, narrative passages, personalized notes — never touched.
4. **Structural drift requires confirmation.** If a section is entirely obsolete (the whole feature was removed, the whole table refers to deleted skills), do NOT delete it autonomously. Surface it to the user with a `STRUCTURAL` note and let them decide.
5. **Do not "improve" formatting.** No collapsing redundant tables, no merging sections, no reordering, no rewording for style.

### d) Sections to preserve verbatim (per file)

Different docs have different stable sections. Apply the appropriate list:

**`README.md`:**
- Any prose block the user added that is not a facts table
- Section order and top-level headings
- The Quick Start narrative

**`CLAUDE.md` (or detected equivalent)** — current structure is 13 numbered sections (see live CLAUDE.md). Preserve:
- §1 CRITICAL RULES (12 items — only patch wording drift, never reorder)
- §2 BEHAVIORAL LAYER (4 pillars + scope notes — full examples live in `references/behavioral-layer.md`)
- §3 ORCHESTRATION MODE (6-component briefing + execution patterns + deep-detail pointers)
- §4 CONTEXT LOADING MAP (task → trigger → skill → context → tool)
- §6 TOOL RESOLUTION ([TAG_TOOL] pseudocode)
- §7 PROJECT VARIABLES — POINTER (pointer-only by design; never inline `.agents/project.yaml` contents)
- §8 AI BEHAVIOR DURING DEVELOPMENT (4 numbered items)
- §9 LOCAL CONTEXT (PBI) — directory tree
- §10 STACK QUICK-REFERENCE (TS Patterns + DRY — full conventions in `references/typescript-patterns.md`)
- §11 GIT WORKFLOW — POINTERS (branch table + pointer to `/git-flow-master`)
- §12 DELIVERY STRATEGY — Path A vs Path B
- §13 PROACTIVE MEMORY TRIGGERS

Sections that may be **patched** (data drift only): §5 SKILLS + COMMANDS + MCPs REGISTRY (T1 skill table, slash commands table, MCP table — verify against `.claude/skills/`, `.claude/commands/`, `.mcp.json`).

**DELETED sections that MUST NOT be re-introduced** (engram MCP supersedes; flag any reappearance as drift):
- ~~Quick Start / Onboarding~~ (moved to `README.md`)
- ~~Project Identity / Environment URLs~~ (live in `.agents/project.yaml`)
- ~~Discovery Progress / Access Configuration~~ (orphan trackers)
- ~~Future Hooks~~ (moved to `docs/agentic-development-engineering.md`)
- ~~Session Log / Known Issues / Next Actions~~ (engram supersedes)
- ~~Quick Reference checklist~~ (duplicated §1 + §10)

**Critical Rule #12 enforcement**: CLAUDE.md must NOT inline build/test/lint script names in tables. Detect any `| \`bun run` / `| \`npm run` / `| \`pnpm run` table row — flag as STRUCTURAL drift (violates Rule #12, scripts must defer to `package.json`).

**`CONTEXT.md`** (when present):
- All structural sections
- Only patch: command-name references, file-path references, and any description tagged "auto-detected"

**`docs/agentic-development-engineering.md`:**
- Vision statements, principles, and narrative sections
- Lifecycle diagrams and ASCII art
- Only patch: command/skill tables and path references

**`docs/getting-started.md`:**
- Step-by-step prose and tutorial flow
- The TL;DR mnemonic line
- Only patch: command names in tables, the quick-reference table, file paths

### e) Credential redaction (security gate before every Write)

Scan the drafted patch in memory **before** applying it to disk:

1. **Credential patterns** — strings matching `/(password|secret|token|api[_-]?key|authorization)\s*[:=]\s*\S+/i`.
2. **Production URLs with secrets** — hostnames that resolve to the project's production domain outside the Environment URLs table. Staging / dev / localhost are fine.
3. **Shaped secrets** — JWTs (`eyJ...`), Atlassian API tokens (`ATATT...`), GitHub PATs (`ghp_...`, `gho_...`), AWS keys (`AKIA...`).

On any match:

1. Replace the literal with `<<REDACTED>>` (or `{your-{field-name}}` placeholder when the field is the point of the paragraph).
2. Record the redaction: `{file} · {line reference} · {what was redacted} · {why}`.
3. Surface the redaction log in the Phase 6 report. A redaction never silently succeeds — the user must see what was removed.

---

## Phase 4c — Template mirror sync (`.claude/skills/agentic-dev-core/templates/CLAUDE.md.template`)

Run **after** Phase 4 (so the live CLAUDE.md is up to date) and **before** Phase 4b. The template mirror must match the live CLAUDE.md header-for-header, with project-specific values replaced by placeholders.

### Why it exists

`CLAUDE.md` (live, repo root) is consumed by the AI every session in THIS repo. `CLAUDE.md.template` is the structural mirror used by `/agentic-dev-core` init when bootstrapping a NEW project. They diverge over time unless synced — past drift has surfaced as renamed sections appearing in only one file (e.g. live had `Behavioral Layer`, template did not).

### Algorithm

1. **Extract section headings** from the live CLAUDE.md: `grep -E '^## [0-9]+\.' CLAUDE.md` → expect 13 numbered sections.
2. **Extract section headings** from the template: same grep.
3. **Diff the heading sequences**. If they differ, sync the template structure to match.
4. **For each section body** that changed in Phase 4, copy the structural skeleton into the template, then:
   - Replace project-specific values (project name, environment URLs, Jira URL, `{{TICKET-PREFIX}}-XXX` examples) with `[PLACEHOLDER]` or `{{TEMPLATE_VAR}}` markers.
   - Re-introduce the `<!-- Add project-specific reminders as #13+ when bootstrapping. -->` slot in §1 if removed.
   - Preserve the template's `<!-- TEMPLATE — DO NOT EDIT IN PLACE WHEN BOOTSTRAPPING -->` HTML comment header.
5. **Verify final diff** of section headings is empty: `diff <(grep '^## [0-9]\.' CLAUDE.md) <(grep '^## [0-9]\.' .claude/skills/agentic-dev-core/templates/CLAUDE.md.template)` → expect 0 lines.

### What stays project-specific in the template (always placeholders)

- `[Project-specific reminders]` slot in §1
- `[TICKET-PREFIX]-XXX` instead of `UPEX-XXX` examples
- `{{PROJECT_KEY}}`, `{{WEB_URL}}`, `{{API_URL}}` references (the syntax is canonical; values must come from `.agents/project.yaml`)

### Reporting

Emit one row in the Phase 7 report:

```
.claude/skills/agentic-dev-core/templates/CLAUDE.md.template | structural-mirror | updated | +X / -Y | section headings + body skeletons | placeholders restored
```

---

## Phase 4b — Rendered-from HTML sync (patch-in-place, NEVER regenerate)

Run **after** Phase 4 (so source MDs are up to date) and **before** Phase 5 (so the consistency check sees the synced HTML state). Process every target tagged `rendered-from`.

### The patch-in-place rule for HTML

Regenerating the HTML from the source MD would destroy the hand-crafted sidebar nav, tab panels, JS-driven interactive navigation, card layouts, and CSS classes — none of which exist in the MD source. Phase 4b patches **only text nodes** that mirror drifted facts from the just-patched source MD.

### What is in scope for patching

| HTML construct | In scope? | Notes |
|---|---|---|
| `<code>` element contents | ✅ Yes | Most command-name / path drift lives here |
| `<td>` cells (plain text or single inline element) | ✅ Yes | Quick-reference tables, command tables |
| `<span class="mnemonic">`, `<span class="muted">`, similar inline text spans | ✅ Yes | Short narrative phrases mirroring MD |
| `<p>` paragraph text that quotes a command name verbatim | ✅ Yes | Only the quoted fact, not the surrounding sentence |
| `<a href="https://github.com/.../blob/main/...">` URLs pointing at repo files | ✅ Yes | When the target file was renamed/moved |
| `<a>` link text (visible label) | ✅ Yes | Only when the link target's name changed |

### What is out of scope (opaque-preserve)

- `<head>`, `<script>`, `<style>` sections — never touched.
- Sidebar nav structure, IDs, classes — never touched.
- Tab panel structure, `data-*` attributes — never touched.
- Footer card structure (only the `href` and the text inside `<code>`/`<span>` cells inside cards are eligible).
- Any whitespace, indentation, or attribute order — preserved byte-for-byte except for the targeted text node.

### Algorithm

1. **Read the HTML** in full.
2. **Read the source MD** that this HTML mirrors (e.g. `docs/getting-started.md` for `docs/onboarding/index.html`).
3. **Extract drifted facts** from the Phase 4 patch log for the source MD (command renames, path changes, count changes).
4. For each drifted fact, **search the HTML** for occurrences inside the in-scope constructs above.
5. **Apply the smallest possible Edit** — exact `old_string` containing the eligible construct, minimal `new_string` with the corrected text. Never use `Write` on an HTML file.
6. If the same fact appears in an out-of-scope region (e.g. an `aria-label` attribute), flag it as `STRUCTURAL — HTML attribute drift` and let the user decide.

### Trust the pre-commit hooks

Prettier and any other pre-commit hooks are your last line of defense for HTML structure errors (a stray sed-style edit can truncate `</a>` to `</` and break the DOM). Do **NOT** bypass hooks with `--no-verify`. If a hook fails, fix the root cause manually — never paper over.

### Reporting

Emit one row per rendered-from target in the Phase 7 report with this format:

```
docs/onboarding/index.html | rendered-from | updated | +3 / -3 | command names | sidebar/JS/CSS preserved
```

---

## Phase 5 — Cross-doc consistency check

After all individual patches are computed but **before any file is written**, verify cross-document consistency. If a fact appears in multiple docs, all copies must agree.

**Facts to cross-check:**

| Fact category | Documents to check | Example drift |
|---|---|---|
| Command names | All targets | `CLAUDE.md` says `/refresh-ai-memory`, `docs/getting-started.md` still says `/sync-ai-memory` |
| Skill names | All targets | Skill renamed but not all docs updated |
| `.context/` directory paths | `CLAUDE.md`, `README.md`, `CONTEXT.md` | One doc says `.context/business/`, another says `.context/discovery/` |
| Environment URLs | `CLAUDE.md`, `README.md` | Staging URL changed in only one doc (note: CLAUDE.md should NOT inline env URLs — they live in `.agents/project.yaml`) |
| Script names | `README.md`, `docs/getting-started.md` (NOT `CLAUDE.md` — Rule #12 forbids inlining scripts there) | Script renamed in `package.json` but not in docs |
| Project identity | `README.md` only (NOT `CLAUDE.md` — lives in `.agents/project.yaml`) | Name / stack / target repo mismatch |
| AI memory filename | `README.md`, `docs/*` | `GEMINI.md` is the active file but docs still say `CLAUDE.md` |
| CLAUDE.md section headings | `CLAUDE.md` vs `.claude/skills/agentic-dev-core/templates/CLAUDE.md.template` | Live and template diverge on §-count or section names (Phase 4c enforces) |
| Reference files exist | `CLAUDE.md` pointers vs `.claude/skills/agentic-dev-core/references/` | CLAUDE.md §2 points to `behavioral-layer.md`, §10 to `typescript-patterns.md`, §3 to `orchestration-doctrine.md` / `briefing-template.md` / `dispatch-patterns.md` / `skill-composition-strategy.md` — all must exist on disk |
| MCP table | `CLAUDE.md §5` vs `.mcp.json` | MCP listed in one but not the other |

**Algorithm:**

1. Extract each fact instance from each document's planned patch.
2. If all instances match → mark `consistent`.
3. If any instance differs → mark `DRIFT DETECTED`, record `{fact} | {file A value} | {file B value}`.
4. Resolve all drift before writing any file. Compute an extra patch for the lagging document and add it to the queue.

This step catches the "renamed a directory and now 12 files disagree" class of bug. Run it every time.

---

## Phase 6 — Generate diff summary

For each file, compute:

- Path
- Lines changed (`+X / -Y`)
- Drifts corrected (list)
- Drifts NOT applied (list + reason: `needs user input`, `structural — flagged for review`, `out of scope`)

---

## Phase 7 — Report

```markdown
✅ AI memory sync complete

**AI tool detected**: {tool name}
**Audit sub-agent**: returned {N} qualifying files
**Scope**: {N} files patched, {M} files unchanged, {K} files skipped (not present)

**Per-file outcome:**

| File | Classification | Outcome | Lines changed | Drifts fixed | Notes |
|---|---|---|---|---|---|
| README.md | CRITICAL | updated | +12 / -8 | scripts table, env URLs | — |
| CLAUDE.md | CRITICAL | updated | +5 / -3 | §5 skill/MCP table | 13-section structure preserved |
| .claude/skills/agentic-dev-core/templates/CLAUDE.md.template | CRITICAL | updated | +5 / -3 | mirrored §5 table | placeholders restored (Phase 4c) |
| CONTEXT.md | CRITICAL | updated | +1 / -1 | `.context/` path | — |
| docs/agentic-development-engineering.md | HIGH | updated | +2 / -2 | command rename | — |
| docs/getting-started.md | HIGH | unchanged | — | — | no drift detected |
| docs/onboarding/index.html | RENDERED-FROM | updated | +3 / -3 | command names | sidebar/JS/CSS preserved |
| {auto-detected file} | MEDIUM | updated | +3 / -1 | bun script rename | — |

**Cross-doc drift resolved:**
- {fact}: {old value} → {new value} in {N} files

**Sections preserved verbatim:**
- CLAUDE.md: §1 CRITICAL RULES, §2 BEHAVIORAL LAYER, §3 ORCHESTRATION MODE, §4 CONTEXT LOADING MAP, §6 TOOL RESOLUTION, §7 PROJECT VARIABLES, §8 AI BEHAVIOR, §9 LOCAL CONTEXT, §10 STACK QUICK-REFERENCE, §11 GIT WORKFLOW, §12 DELIVERY STRATEGY, §13 PROACTIVE MEMORY TRIGGERS (only §5 SKILLS+COMMANDS+MCPs may be patched for data drift)
- CLAUDE.md.template: same 13-section structure, with placeholders preserved
- README.md: Quick Start narrative, top-level section order
- docs/onboarding/index.html: `<head>`, `<script>`, `<style>`, sidebar nav, tab structure, footer card layout

**Structural drift flagged for user review (NOT auto-applied):**
- {file} · {section} · {reason — e.g. "table references deleted skill X, suggest removing row"}
- {html-file} · {selector or attribute} · "HTML attribute drift (e.g. aria-label) — confirm before editing"

**Security / redaction log:**
- {empty if none}
- {file · line · what was redacted · why}

**Suggested next steps:**
- Review structural-drift flags above and decide manually
- Commit the diff with a clear message: `docs: sync AI memory — patch drift in {N} files (+ HTML mirror)`
```

---

## Patch rules (the regla de oro — patch-no-rewrite)

1. **README + CLAUDE.md current state IS the base.** Always read before writing. Patch against the read content. Never use `Write` for an existing file in this command — only `Edit`.
2. **Preserve human-authored structure.** Headers, comments, examples, blank lines, table widths — byte-for-byte except for the changed cell.
3. **Approval gate before any write.** Phase 2 confirmation is non-negotiable. No file is touched until the user says `proceed`.
4. **Credential safety.** Run the redaction scan in memory before every Write. Surface every redaction to the user.
5. **Scope is dynamic.** The 5 always-included docs (+ 1 rendered-from HTML) are a floor, not a ceiling. The audit can extend the list; it cannot shrink the floor.
6. **No re-introduction of deleted CLAUDE.md sections.** Session Log, Known Issues, Discovery Progress, Next Actions, Future Hooks, Project Identity placeholder, Environment URLs placeholder, Quick Start, Onboarding — all retired (engram MCP + `.agents/project.yaml` + README supersede them). If the audit suggests adding any of these back to CLAUDE.md, flag as STRUCTURAL drift and refuse autonomously.
7. **Structural drift requires user confirmation.** If a whole section is obsolete, flag it; do not delete autonomously.
8. **Cross-doc consistency over single-doc cleanliness.** If patching one file would create drift with another, patch both in the same run.
9. **HTML rendered-from targets patch in place, never regenerate.** Phase 4b touches only text nodes (`<code>`, `<td>`, `<span>`, link text/href). Sidebar, JS, CSS, `<head>` are opaque. Pre-commit hooks are your safety net — never bypass with `--no-verify`.

---

## Excluded by default (never touched by this command)

- `.claude/skills/*/SKILL.md` — managed by each skill's own author
- `.claude/skills/*/references/*` — skill-internal documentation caches
- `.context/business/business-data-map.md` — owned by `/business-data-map`
- `.context/business/business-feature-map.md` — owned by `/business-feature-map`
- `.context/business/business-api-map.md` — owned by `/business-api-map`
- `.context/master-implementation-plan.md` — owned by `/master-implementation-plan`
- `.agents/testing-capabilities.json` and other auto-generated caches
- `node_modules/`, `.git/`, `dist/`, `build/`, `.next/`, `.scratch/`, `coverage/`

If the audit sub-agent surfaces one of these (mistake), drop it before showing the approval gate.

---

## Final checklist

- [ ] Audit sub-agent dispatched (Phase 1)
- [ ] Audit list merged with 6 always-included docs + 1 rendered-from HTML (Phase 1)
- [ ] User confirmation received via approval gate (Phase 2)
- [ ] AI memory file detected (Phase 3)
- [ ] Each approved file read first, then patched in-place (Phase 4)
- [ ] Preserve-lists applied per file (Phase 4d)
- [ ] Credential redaction scan run before each Write (Phase 4e)
- [ ] Template mirror synced (Phase 4c) — section headings diff empty against live CLAUDE.md
- [ ] Rule #12 enforcement: CLAUDE.md contains 0 inlined `| \`bun run` table rows
- [ ] Reference files exist + cross-doc consistent (`behavioral-layer.md`, `typescript-patterns.md`, `orchestration-doctrine.md`, `briefing-template.md`, `dispatch-patterns.md`, `skill-composition-strategy.md`)
- [ ] Rendered-from HTML targets synced via text-node patches only — sidebar/JS/CSS preserved (Phase 4b)
- [ ] Pre-commit hooks not bypassed (no `--no-verify`)
- [ ] Cross-doc consistency verified, drift resolved (Phase 5)
- [ ] Diff summary computed per file (Phase 6)
- [ ] Per-file outcome and redaction log reported to user (Phase 7)
