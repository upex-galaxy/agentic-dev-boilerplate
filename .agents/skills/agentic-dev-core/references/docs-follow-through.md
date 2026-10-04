# Docs follow-through: keeping the docs in step with the change that moved them

> Cited by `sprint-development` (Stage 3, docs before merge), `project-context` (the Key-paths pointer after an artifact write), `testability-guide` (registering the `/qa` page) and `.agents/instructions/15-context-map.md` §4 (the "sync AI memory" row). It replaces the retired `sync-ai-memory` skill.

## 1. Why there is no sync skill any more

A doc drifts in the PR that changed the thing it describes, and it stays drifted because nothing asks about it at that moment. A separate "sync the docs" skill ran later, if ever, and had to rediscover every change from the repo. So the work splits in two:

| Half | Owner | What it catches |
|---|---|---|
| Mechanical | `bun run docs:check` (inside `repo:check`, so CI runs it) | dead links and paths, a repo skill missing from the `.agents/instructions/20-skills-and-mcps.md` §5 router and from the project's own rows (`project.md` "Project context skills", an `AGENTS.md` router row to its `SKILL.md`) (`roster`), a `bun run <name>` quoted in a doc that `package.json` does not declare (`script`), missing page metadata, the volatile-fact families of Critical Rule #17 |
| Mechanical | `bun run agents:compat:check` | the `CLAUDE.md` shim (exactly `@AGENTS.md` plus one newline), the skills alias, a harness command that shadows a skill, hooks, MCP parity |
| Judgment | this reference, run by whoever makes the change, in the same PR | the sentence around each fact, a section that still describes the old behaviour, two docs that now disagree |

## 2. When it runs

Close the change with this follow-through when it adds, renames or retires any of: a skill or a skill mode, a `package.json` script, a doc or `.context/` path, an MCP server, an env var, a harness surface. A change that touches none of these needs nothing here.

## 3. The surfaces

| Surface | What to patch | Never |
|---|---|---|
| `AGENTS.md` + `.agents/instructions/` | `AGENTS.md`: a router row only when a new request KIND appears; the sections: `15-context-map.md` task-map row and Key paths, `20-skills-and-mcps.md` skill router row, `10-harnesses.md` surface tables | inline a `bun run` script in a table (Rule #10); restate a count or a mutable list (Rule #17); paste section prose into `AGENTS.md` (its byte budget, `bun run instructions:check`) |
| `.agents/instructions/project.md` | a fact true only for this project: a Key path only it has (`## Key paths (this project)`), the row of a skill it created (`## Project context skills`), its own exception, its reading of shared doctrine | write it into `AGENTS.md` (the boilerplate-owned always-on layer) or a shared section (`bun run up` overwrites those) |
| `README.md`, `CONTEXT.md`, `INSTALLER.md` | the command, path or skill name the change moved, and the sentence around it | enumerate the skill set: point to `.agents/skills/REGISTRY.md` |
| `docs/**` | the same facts; `docs/onboarding.html` is hand-maintained HTML: patch text nodes only (`<code>`, `<td>`, inline spans, a repo-file `href`), never `<head>`, `<script>`, `<style>`, the sidebar or attributes | regenerate a page |
| `CLAUDE.md` | nothing: operational prose found there is structural drift, report it and run `bun run agents:compat` | propagate that prose anywhere |
| Generated files (`REGISTRY.md`, `.claude/skills`) | regenerate with their command | hand-edit |
| `.context/` maps and roadmaps | owned by `project-context` modes | rewrite their content from here |
| `.claude/commands/`, `.opencode/commands/` | the project's own commands, if it keeps any | name one like a skill: it hides the skill (`agents:compat` moves it to `.backups/shadowing-commands/`) |

## 4. How to patch

1. **The current file is the base.** Edit the drifted fact; never rewrite a doc from a template.
2. **Preserve structure and voice.** Headings, list style, table columns, examples and human prose stay byte-for-byte except the changed cell or sentence. No reformatting on the way past.
3. **Structural drift is a question, not an edit.** A whole section about a removed feature, or a section that reappeared after being deleted on purpose: surface it to the user and let them decide.
4. **One fact, one value everywhere.** When a fact appears in several docs (a command, a path, a skill name, the instruction topology), patch every copy in the same PR. `grep -rn '<old value>'` across the surfaces above before calling it done.
5. **Redact before writing.** No credential, token, shaped secret (`eyJ…`, `ATATT…`, `ghp_…`, `AKIA…`) or production URL carrying one lands in a doc; replace it with a placeholder and say so in the report.
6. **Name the owner, not the value** (Rule #17, `volatile-facts.md`): "the servers `.mcp.json` declares", never their count or list.

## 5. Verify and report

Run `bun run docs:check`, `bun run agents:compat:check` and `bun run skills:check`; all three exit 0 or the follow-through is not done. Report one line per touched doc: path, the facts corrected, anything flagged as structural and left for the user.
