---
name: business-api-context
description: "The business meaning of the API: auth model and roles, route groups, who calls them, journeys, errors, integrations. Use when a task adds or changes a route handler, server action, OpenAPI contract or auth rule; a status code looks wrong; someone asks which route does what; the API map needs a fix. Payload shapes are the OpenAPI spec; entities are business-data-context; screens are business-feature-context."
license: MIT
compatibility: [claude-code, codex, opencode, pi]
metadata:
  kind: context
  writes: [references/]
  requires_capabilities: [diagrams]
---

# business-api-context

> Kind `context` with a declared write scope (`agentic-dev-core/references/skill-composition-strategy.md` §2b). Upstream delivers it once as a placeholder, then the project owns it: the map inside is this project's synthesis. Procedure: `agentic-dev-core/references/business-context-maps.md`.

## Compact Rules

- Read the map through `bun run context:map business-api-context` (or `--section <id>` for one route group or journey). Skip `references/business-api-map.html` raw: its SVG is most of the bytes and none of the facts.
- A placeholder map means there is no map. Say so and hand the user `project-context` mode `api`, so nobody mistakes an empty map for an empty API.
- Take field names, types and required flags from the OpenAPI types (`bun run api:sync`, `@schemas/{domain}.types`) and the meaning from the map. When they conflict, the spec wins for shape and the running API wins for behaviour.
- When a session observes something that contradicts a section (a status, a field, an auth rule), propose the one-section edit with its evidence to the user, or to the conductor when you are a supervised worker, and apply it only on approval. A routine with nobody applies nothing unless its brief names the map or section. Procedure: `references/refresh.md`.
- Write only inside this skill's own `references/`. Jira, `.context/`, other skills, generated types and product code are out of scope, because this skill owns one map and nothing else.
- Keep map content out of this SKILL.md. Judgment goes in `## Rules` or `references/gotchas.md`, dated and measured.
- Before a step that uses `diagrams` (redrawing a figure), run the point-of-use check in `agentic-dev-core/references/mcp-capabilities.md` §4.

**Read full SKILL.md when**: building a briefing for a route, OpenAPI or auth dispatch, deciding whether a section is stale, or proposing an edit to the map.

## What this skill knows

The API as a business surface: how a caller authenticates and which roles exist, which route groups (Next.js route handlers and server actions) exist and what each is for, who may call them, what they change, how a multi-call journey chains them, what each error means to a user, and which third parties sit behind them. Loading it changes what the agent knows. The only thing it ever does is propose an edit to its own map.

## Sources of truth (cited, never copied)

| Source | What lives there | Role |
|---|---|---|
| `references/business-api-map.html` | the synthesis, one `<section>` per route group or cross-route journey, plus the auth model and `discovery-gaps` | this skill's map (read via `bun run context:map`) |
| the OpenAPI spec and its generated types (`bun run api:sync`) | paths, methods, payload shapes | wins for shape |
| the route handlers and server actions in the repo | what each route really does | wins over the map on any conflict |
| the running API of the active environment | real statuses and bodies | wins for behaviour |
| `project-context` mode `api` | the generator that creates the map and updates its stale sections | owns regeneration |

## Rules (judgment, dated)

_(none yet: each rule carries `YYYY-MM-DD · rule · measured: how`)_

## Not here

- Payload schemas and types: the OpenAPI spec and `@schemas/{domain}.types`.
- Entities, RLS, triggers and state machines: `business-data-context`.
- Screens, CRUD actions and the feature catalog: `business-feature-context`.
- Tokens and credentials: `.env`, never a map.

## References

- `references/business-api-map.html`: the map (generated; read through the reader).
- `references/refresh.md`: the self-update procedure and this aspect's staleness signals.
- `references/gotchas.md`: measured traps in reading this project's API map.
