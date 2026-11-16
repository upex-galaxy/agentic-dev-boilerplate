---
id: project-variables
title: "Project variables"
load_when: "a skill reads a {{VAR}} or <<VAR>>, an environment URL or the active env is needed, .agents/project.yaml is read or edited, or the Atlassian host is resolved"
triggers: ["\\{\\{", "<<[A-Z_]+>>", "project\\.yaml", "\\benvironments?\\b", "\\burls?\\b", "\\bdeploy", "default_env", "\\b(?:staging|production|prod)\\s+(?:url|env|environment|db|database|domain)", "atlassian", "jira url", "vars:check"]
paths: [".agents/project.yaml", ".agents/README.md", ".env.example"]
---

# Project variables

> Section `project-variables` of the project instructions (progressive disclosure, L1). The router in `AGENTS.md` (L0) names when to read it. Edit this file, never paste its prose back into `AGENTS.md`.

## 7. PROJECT VARIABLES: POINTER

All variable syntax and the Jira field references are documented in `.agents/README.md`. Read it once per session and cache the values.

Project values live in `.agents/project.yaml`, loaded once per session. Read the project identity, env URLs, Jira URL, project key and MCP names from there and hardcode none of them. <!-- binds-in-section: every read of a project value routes here (L0 router row) -->

**Variable syntaxes** (full reference in `.agents/README.md`):

- `{{VAR_NAME}}` is a static project variable, flat or env-scoped through `environments[active_env].<var>`.
- `<<VAR_NAME>>` is a session variable computed at runtime (for example `<<ISSUE_KEY>>` from the git branch).
- `{{jira.*}}` is a Jira custom field or workflow reference (see `.agents/jira-fields.json`, `jira-workflows.json` and `jira-required.yaml`).

**Active env.** `active_env` defaults to `testing.default_env` in `.agents/project.yaml`. When the user says "test against production", switch `active_env` to `production` for that session and ignore `default_env` until it ends.

**Validation.** `bun run vars:check` checks that every `{{VAR}}` resolves, and `bun run jira:check` validates the manifest against the catalog.

**Instance-identity anchor** (binding; compact rule of `jira-administration`). The Atlassian host lives in `.agents/project.yaml` → `issue_tracker.atlassian_url` and nowhere else locally. `ATLASSIAN_URL` is not a `.env` variable: it is absent from `.env` and `.env.example` on purpose, because a second copy is what goes stale.

- The canonical resolver is `cli/lib/atlassian-instance.ts`. A new script does not read `process.env.ATLASSIAN_URL` directly.
- From a shell, call the accessor: `bun run --silent jira:url` for the base URL, or with `--slug` for the bare host that `acli --site` takes. Do not strip `https://` by hand.
- The resolver still reads the env var last, as a transitional fallback for a repo whose yaml is unset. When the two disagree, the yaml wins and a warning names both values, because a hit there means a stale copy is loose in the environment.
- This is a deliberate inversion of `project_key`, where the env var wins. A project key is a legitimate per-run override, while the host is project identity that changes on site migrations, which is exactly the value that goes stale.
- Credentials (`ATLASSIAN_EMAIL`, `ATLASSIAN_API_TOKEN`) stay env-only and are never mirrored into the versioned yaml. The host is a public hostname, not a secret, so the reverse split is safe.
- `scripts/agents-setup.ts` refuses to seed this one field from the environment (`envVar: null`), so an unattended run cannot overwrite the versioned value.
- The name survives only as Vercel runtime config for a serverless Jira integration, pushed there from the yaml by `bun setup --variables` (manifest `valueSource: 'atlassian-instance'`), so the yaml and the deploy scope cannot drift.
- `bun run vars:env:check` fails on any `.env`-sourced manifest variable whose process value differs from `.env`, and warns when a yaml-sourced variable still has a dead line in `.env`. It is warn-only in `.husky/pre-push`, so a machine-local condition never blocks an unrelated push.

The test behind all of this: does a stale value here corrupt data silently, or fail loudly? Silent corruption calls for one versioned source and no local duplicate.
