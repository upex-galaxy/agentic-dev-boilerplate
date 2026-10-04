# Project instructions: sections

The project instructions are split in two layers so every session pays only for what it needs.

| Layer | File | Loaded |
|---|---|---|
| L0 | `AGENTS.md` | every session, on every host (Claude Code through the `CLAUDE.md` shim) |
| L1 | one file per section in this folder | on demand: the router table in `AGENTS.md` names when to read each one |
| L2 | skill `references/` | on demand, named by the section or the skill that needs them |

L0 keeps what must bind on every turn: the binding sentence of each Critical Rule, the behavioural layer, the core of orchestration mode, the load protocol, the router and the memory triggers. Everything else lives here.

## How a section is reached

1. The router in `AGENTS.md` (between `<!-- router:start -->` and `<!-- router:end -->`) maps request kinds to files in this folder.
2. Each section's frontmatter declares `triggers:` (case-insensitive regexes) and `paths:` (repo prefixes); the prompt hook (`.agents/hooks/personality-reinject.mjs`) classifies each prompt with them and the router, so the table the model reads is the table the classifier uses. A row fires on its first Load target (its anchor) and routes every target in it. The hook emits one `ROUTE: read <file> (<id>)` line per file this session has not been routed to yet (a per-session state file dedupes, so a prompt that needs nothing new adds nothing), and a `SessionStart` with source `compact` or `clear` re-arms the routes (Claude Code and Codex; OpenCode 1 on compaction only). OpenCode 1 routes from `chat.message`; OpenCode 2 has no per-message hook with the prompt text and relies on the router alone.
3. `project.md` adds the project's own rows: its "Project context skills" table (between `<!-- project-skills:start -->` and `<!-- project-skills:end -->`) lists each skill the project created, with the triggers that route a prompt to its `SKILL.md`. The hook reads that table like the router, and no `bun run up` touches the file, so the project's routing to its own skills survives updates.
4. The load protocol in `AGENTS.md` makes a routed read binding, and "unsure → read" the default.
5. Two router rows also name data files as Claude Code imports, `@package.json` and `@.agents/project.yaml`, written as plain text so Claude Code loads them at launch; OpenCode and Codex do not expand imports and follow the rows' reinforced instruction instead. No other bare `@` token may appear in `AGENTS.md`.

## Frontmatter

```yaml
---
id: git                 # the file stem without its number (80-git.md -> git)
title: "Git workflow and strategy"
load_when: "any git, branch, commit, push, pull request, merge, rebase or conflict intent"
triggers: ["\\bgit\\b", "\\bcommit"]
paths: [".husky/", ".github/"]
---
```

The number in the file name is the stable reading order. `project.md` carries `id`, `title` and `load_when` and may leave `triggers` empty (its skill rows carry their own); this README carries no frontmatter.

## Editing

- Edit the section file. Never paste section prose back into `AGENTS.md`: L0 has a byte budget, because Codex cuts its project instructions at `project_doc_max_bytes` without a visible notice.
- A Critical Rule changes in two places on purpose: its full text in `01-critical-rules.md` and its binding excerpt in `AGENTS.md`, which must stay verbatim.
- A section line that says `NEVER` or `MUST` names what carries it when the section is not loaded (a Critical Rule, a skill's Compact Rules, a contract L0 carries) or declares itself section-scoped with `<!-- binds-in-section: <reason> -->`.
- A rule only this project has goes in `project.md`, the project-owned overlay. The other files are shared doctrine.
- `bun run instructions:check` gates all of the above: budget, router (the `project.md` skill rows included), frontmatter, rule excerpts, binding carriers, imports.
