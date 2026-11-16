# Refresh: keeping `business-data-map.html` honest

> Loaded by `business-data-context` when a session observes something the map contradicts, or when someone asks whether the map is stale. The generic procedure (anatomy, the five steps, the write scope) is synced doctrine in `agentic-dev-core/references/business-context-maps.md` §5-§6. This file holds only what is specific to the data aspect, and the project owns it.

## Staleness signals for this aspect

| Signal in `data-sources` | Stale when | Check |
|---|---|---|
| a backend path (a route handler, a server action, a service) | a commit touched it after `data-updated` | `git log --since=<data-updated> --oneline -- <path>` |
| `db:<table>` / `migration:<file>` | a migration since the date, or the schema shows a column, constraint, enum value, policy or trigger the section does not describe | by `stack.database.schema_source` in `.agents/project.yaml`: `migrations`: `git log --since=<data-updated>` on `stack.database.migrations_dir` (under `stack.app_root`), then the new files; `live`: `[DB_TOOL]` `list_migrations` for entries after the date, then a read-only schema query |
| `cron:<job>` / `webhook:<event>` | the scheduler or handler file changed | `git log` on the file named |
| a third-party integration | its client module or SDK version changed | `git log` on the client module, `package.json` |

A section with no declared sources is `unknown`, never fresh.

## Two paths

Keep them apart, because one edits a single section and the other regenerates several.

| Situation | Who writes | How |
|---|---|---|
| one section contradicted by something a session observed | this skill, after approval | the five steps of `agentic-dev-core/references/business-context-maps.md` §6: locate, evidence, propose, apply on approval, verify |
| several sections stale, or something new the map lacks | `project-context` mode `data` UPDATE | it regenerates only the stale sections and shows a section-level diff; hand the user that mode instead of rebuilding sections here |

## The proposal, in one message

```
business-data-context · proposed edit to section <id> (updated <date>)
evidence: <what was observed, how, where: query / request / file@commit / session label>
before: <the sentence or row as the map has it>
after:  <the replacement>
figure: <unchanged | redraw: why>
apply? (yes / no)
```

Verify the edit with `[DB_TOOL]` (capability `db`) before proposing it. Only `yes` applies it; silence is not approval.

Who answers `apply?` depends on who is running (`agentic-dev-core/references/business-context-maps.md` §10 and `agentic-dev-core/references/decision-protocol.md`):

- A person is present: they answer.
- A supervised worker: send the proposal to the conductor, which holds the gate, and apply only on its yes.
- A routine with nobody: apply only when the delegating brief names the map or section. Otherwise leave the proposal in the report and the map untouched until a person or conductor approves.

## Never

- Edit a file outside this skill's `references/`: the skill owns one map and nothing else.
- Rewrite a section that was not contradicted, or regenerate the whole map: that is `project-context` mode `data`.
- Change a section id: a renamed entity, feature or route group is a new section plus one line in `discovery-gaps` for one refresh.
