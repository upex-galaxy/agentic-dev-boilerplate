# guard-example

The reference feature for GUARD (`.agents/skills/agentic-dev-core/references/guard-architecture.md`): a `notes` feature that passes every rule. It is the mold agents copy when they create a feature.

- `src/` is laid out as a consumer project: `platform/`, `adapters/notes/`, `features/notes/` (door: `index.ts`), `app/notes/page.tsx`.
- The installer copies `src/**` into a new project's `src/` and `guard-manifest.json` to its root, never over an existing file. `bun sync` never ships it.
- This repo checks it so it never rots: `bun run guard:example:check` (lint, types, manifest, tests).

Refresh it from upstream when asked:

```bash
git clone --depth 1 https://github.com/upex-galaxy/agentic-dev-boilerplate /tmp/agentic-dev-upstream
cp -Rn /tmp/agentic-dev-upstream/packages/guard-example/src/. src/
cp -n /tmp/agentic-dev-upstream/packages/guard-example/guard-manifest.json .
```
