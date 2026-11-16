---
name: business-data-context
description: "The product's data model: entities, RLS, migrations, state machines and background jobs. Use when a task writes a migration, changes RLS, seeds data, follows an entity lifecycle or touches a trigger, cron job or webhook; when the data map needs a fix. Route contracts are business-api-context; screens and features are business-feature-context."
license: MIT
compatibility: [claude-code, codex, opencode, pi]
metadata:
  kind: context
  writes: [references/]
  requires_capabilities: [diagrams, db]
---

# business-data-context

> Kind `context` with a declared write scope (`agentic-dev-core/references/skill-composition-strategy.md` §2b). Upstream delivers it once as a placeholder, then the project owns it: the map inside is this project's synthesis. Procedure: `agentic-dev-core/references/business-context-maps.md`.

## Compact Rules

- Read the map through `bun run context:map business-data-context` (or `--section <id>` for one entity or flow). Skip `references/business-data-map.html` raw: its SVG is most of the bytes and none of the facts.
- A placeholder map means there is no map. Say so and hand the user `project-context` mode `data`, so nobody plans a migration as if the schema were empty.
- Cite a fact with its section id and `data-updated` date. A section older than the migration it describes is a hypothesis to check with `[DB_TOOL]`, not an answer.
- When a session observes something that contradicts a section (a column, a policy, a trigger), propose the one-section edit with its evidence to the user, or to the conductor when you are a supervised worker, and apply it only on approval. A routine with nobody applies nothing unless its brief names the map or section. Procedure: `references/refresh.md`.
- Write only inside this skill's own `references/`. Jira, `.context/`, other skills, migrations and product code are out of scope, because this skill owns one map and nothing else.
- Keep map content out of this SKILL.md. A rule for reading the data goes in `## Rules` or `references/gotchas.md`, dated and measured.
- Before a step that uses `db` (verifying a section) or `diagrams` (redrawing a figure), run the point-of-use check in `agentic-dev-core/references/mcp-capabilities.md` §4.

**Read full SKILL.md when**: building a briefing for a migration, RLS or seed dispatch, deciding whether a section is stale, or proposing an edit to the map.

## What this skill knows

One aspect of the product: its data. Which business entities exist and why, how they relate, which RLS policies decide who sees which rows, which migrations shaped the schema, which states each entity moves through and what fires the transitions, what runs automatically, which external services read or write it, and the end-to-end flows (`User -> Route -> Logic -> DB -> Response`) that move it. Loading it changes what the agent knows. The only thing it ever does is propose an edit to its own map.

## Sources of truth (cited, never copied)

| Source | What lives there | Role |
|---|---|---|
| `references/business-data-map.html` | the synthesis, one `<section>` per entity, flow, state machine, process and integration, plus `discovery-gaps` | this skill's map (read via `bun run context:map`) |
| the live Supabase database of the active environment (`[DB_TOOL]`, capability `db`) | schema, constraints, enums, RLS policies, triggers, real rows | wins over the map on any conflict |
| the migrations folder and the generated Supabase types | the schema's history and its typed shape | wins over the map for shape |
| `project-context` mode `data` | the generator that creates the map and updates its stale sections | owns regeneration |

## Rules (judgment, dated)

_(none yet: each rule carries `YYYY-MM-DD · rule · measured: how`)_

## Not here

- Column lists and raw DDL: the database itself, on demand through `[DB_TOOL]`.
- Route handlers, auth levels, payloads: `business-api-context`.
- Screens, CRUD actions and the feature catalog: `business-feature-context`.
- Domain vocabulary: the domain glossary `/project-foundation` seeds under `.context/business/` (hand-kept, append-only; `.agents/instructions/agent-context-map.md` §4 Key paths).
- Jira stories and their ACs: `.context/PBI/` (synced cache).

## References

- `references/business-data-map.html`: the map (generated; read through the reader).
- `references/refresh.md`: the self-update procedure and this aspect's staleness signals.
- `references/gotchas.md`: measured traps in reading this project's data map.
