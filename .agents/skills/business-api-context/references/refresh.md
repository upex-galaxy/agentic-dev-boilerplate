# Refresh: keeping `business-api-map.html` honest

> Loaded by `business-api-context` when a session observes something the map contradicts, or when someone asks whether the map is stale. The generic procedure (anatomy, the five steps, the write scope) is synced doctrine in `agentic-dev-core/references/business-context-maps.md` §5-§6. This file holds only what is specific to the API aspect, and the project owns it.

## Staleness signals for this aspect

| Signal in `data-sources` | Stale when | Check |
|---|---|---|
| `openapi:<tag or path>` | the contract changed after `data-updated` | `bun run api:sync` output, or the spec file's `git log` |
| `route:<path>` or a route handler or server action path | a commit touched it after the date | `git log --since=<data-updated> --oneline -- <path>` |
| `rpc:<function>` or `db:<table>` on a Supabase-direct domain | the function, the table's RLS policies or a calling module changed | the schema source `stack.database.schema_source` names (new migrations, or a read-only `[DB_TOOL]` query), then `git log` on the calling module |
| `auth:<scheme>` | the auth middleware, the Supabase Auth config or a role definition changed | `git log` on the middleware or config file |
| an observed response | a real request answers a status, field or error the section does not describe | the request evidence (`curl` command and response, session label) |

A section with no declared sources is `unknown`, never fresh.

## Two paths

Keep them apart, because one edits a single section and the other regenerates several.

| Situation | Who writes | How |
|---|---|---|
| one section contradicted by something a session observed | this skill, after approval | the five steps of `agentic-dev-core/references/business-context-maps.md` §6: locate, evidence, propose, apply on approval, verify |
| several sections stale, or something new the map lacks | `project-context` mode `api` UPDATE | it regenerates only the stale sections and shows a section-level diff; hand the user that mode instead of rebuilding sections here |

## The proposal, in one message

```
business-api-context · proposed edit to section <id> (updated <date>)
evidence: <what was observed, how, where: query / request / file@commit / session label>
before: <the sentence or row as the map has it>
after:  <the replacement>
figure: <unchanged | redraw: why>
apply? (yes / no)
```

Check the edit against the route file, the OpenAPI types or a real request before proposing it. Only `yes` applies it, and silence is not approval. Who answers `apply?` depends on who is running (`agentic-dev-core/references/business-context-maps.md` §10 and `agentic-dev-core/references/decision-protocol.md`):

- A person is present: they answer.
- A supervised worker: send the proposal to the conductor, which holds the gate, and apply only on its yes.
- A routine with nobody: apply only when the delegating brief names the map or section. Otherwise leave the proposal in the report and the map untouched, say it is unapplied, and continue.

## Never

- Edit a file outside this skill's `references/`.
- Rewrite a section that was not contradicted. Regenerating the whole map belongs to `project-context`.
- Change a section id. A renamed entity, feature or route group becomes a new section plus one line in `discovery-gaps` for one refresh.
