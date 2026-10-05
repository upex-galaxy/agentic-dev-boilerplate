# `.context/ADR/` — Architecture Decision Records

Append-only log of the **important, hard-to-reverse** architectural decisions made on this project. One file per decision. Decisions are never deleted — they are **superseded** by newer ADRs that link back, so the history of _why the system is the way it is_ stays intact.

The point: a future human or AI session can read these instead of re-litigating a settled decision or silently violating an invariant it didn't know existed.

---

## What an ADR is (and is not)

An ADR captures a single decision: the context that forced it, the option chosen, the alternatives rejected, and the consequences the team accepted. It is a **source-of-truth document**, not a cache — nothing regenerates it, and it is committed to git like code.

It is the right artifact when a decision passes **both** gates:

| Gate                  | Question                                                                                              |
| --------------------- | ---------------------------------------------------------------------------------------------------- |
| **1 — Architectural** | Does it shape system structure, a cross-cutting concern, or a system-wide invariant?                 |
| **2 — Hard to reverse** | Would changing it later mean touching many files, migrating data, or coordinating across the team? |

Examples that earn an ADR: auth/authorization model, data-access pattern, error/response contract, multi-tenancy model, state-management approach, API style (REST vs RPC vs GraphQL), a framework/library choice with real lock-in, deployment topology, a cross-cutting invariant every feature must uphold.

**NOT an ADR** (these have other homes):

- Bug fixes and their root causes → engram `mem_save` + the story's `bug-fix.md`.
- Local refactors, naming tweaks, formatting → just the commit.
- Single-use code or speculative abstraction → no record needed.
- **Story-local technical decisions** (which hook, which component, a one-file trade-off) → they stay in that story's `implementation-plan.md` under `## Technical Decisions`. Promote one to an ADR **only** when it passes both gates above.

---

## Status lifecycle

```
Proposed ──→ Accepted ──→ Superseded   (by ADR-NNNN, which links back)
                   └────→ Deprecated   (no longer applies; nothing replaces it)
```

- **Proposed** — the decision is still open; the ADR names what is unresolved. An ADR that records a decision the human already approved starts as `Accepted`.
- **Accepted** — binding. Downstream work must honor it.
- **Superseded** — a newer ADR replaces it. Set `Superseded by: ADR-NNNN`; the new ADR sets `Supersedes: ADR-MMMM`. **Do not edit the old decision body** — leave it as the historical record.
- **Deprecated** — the decision no longer applies and nothing replaces it (e.g. the feature was removed).

**Append-only.** Never delete an ADR file. Never rewrite a decision after it is Accepted — supersede it with a new one. The only in-place edit allowed on an Accepted ADR is flipping its `Status` line and adding the `Superseded by` / `Deprecated` pointer.

---

## How to write one

1. Copy [`ADR-NNNN-template.md`](./ADR-NNNN-template.md) to `ADR-<NNNN>-<slug>.md`.
   - `<NNNN>` = next free 4-digit number, zero-padded (`0001`, `0002`, …). Numbers are never reused.
   - `<slug>` = short kebab-case summary (`unified-api-authentication`, `event-sourced-orders`).
2. Fill every section. If a decision is still open, set `Status: Proposed` and say what's unresolved.
3. Add a row to the **Index** below.
4. If it supersedes an existing ADR, wire both directions (`Supersedes` / `Superseded by`) and flip the old one's `Status`.

Who authors: a human architect directly, **or** an AI workflow that detected an ADR-worthy decision and drafted it for human approval — `/project-foundation` (SRS architecture phase, seeds the first batch) and `/sprint-development` (Stage 1 planning, promotes a story/feature decision that passes both gates). Either way, `Status: Accepted` means a human approved the decision: an ADR that records a decision the human already took (a decision deck, a chat answer, an approved plan) is written `Accepted` from the start, naming the approval in `Deciders`; only a decision still open is `Proposed`. The detection + authoring procedure for AI workflows lives in `.agents/skills/agentic-dev-core/references/adr-doctrine.md`.

---

## Index

| ADR | Title | Status | Supersedes | Superseded by |
| --- | ----- | ------ | ---------- | ------------- |
| [ADR-0002](./ADR-0002-multi-harness-single-source.md) | One instruction source and one skill store for three harnesses (`AGENTS.md` canonical, `CLAUDE.md` shim, `.agents/skills/` store, generated adapters, parity gate, updater migration) | Accepted (items 3, 6 in part, 8 superseded) | — | ADR-0004 (item 8), ADR-0006 (item 3, item 6 wrapper half) |
| [ADR-0003](./ADR-0003-forensic-measurements-ledger.md) | Doctrine keeps the why; the measured figures and dates live here (Critical Rule #17 forensic-note split + the ledger of measurements behind the boilerplate's doctrine) | Accepted | — | — |
| [ADR-0004](./ADR-0004-harness-agnostic-commit-trailers.md) | Harness-agnostic forensic trailers on every agent commit (`Worktree:` + `Session:` from the hook's `AGENT IDENTITY:` line; `Claude-Session:` and every branded trailer forbidden; WARN-only `commit-msg` check) | Accepted | ADR-0002 (item 8) | — |
| [ADR-0005](./ADR-0005-harness-level-mcps-and-capabilities.md) | Remote API-key MCPs (web search) run at harness level, never in the project MCP files; skills declare capabilities and resolve tools by name suffix, with a point-of-use STOP instead of a silent fallback | Accepted | — | — |
| [ADR-0006](./ADR-0006-skill-plus-mode-invocation.md) | A skill is invoked by its name plus a mode; the command-alias layer and `sync-ai-memory` are retired (no generated commands, a command that shadows a skill is moved to `.backups/shadowing-commands/`, docs kept in step by the change that moved them) | Accepted | ADR-0002 (item 3, item 6 wrapper half) | — |
| [ADR-0007](./ADR-0007-discovery-runs-without-approval-gate.md) | Unattended `discovery` runs create within the per-run cap and never wait on an approval gate (the operator vetoes after the fact; `created-log.md` read first; no softer synchronous wait) | Accepted | — | — |
| [ADR-0008](./ADR-0008-adoption-contract.md) | Adopting an existing app: an install layer that never overwrites or deletes an app file (`--adopt`) and an understanding layer (`project-adoption`) that writes agentic surfaces only after approval; owner decisions OD1-OD9 (OD4 = C: DB changes through the DB MCP, never during adoption) and the contract measured on a dogfood copy | Accepted | — | — |
| [ADR-0009](./ADR-0009-progressive-disclosure-of-instructions.md) | Progressive disclosure of the project instructions: an always-on L0 `AGENTS.md` (rule binding sentences, §2 whole, router, LOAD PROTOCOL), one routed section per topic under `.agents/instructions/`, a hook that emits `ROUTE:` lines, two Claude imports, a two-level byte budget under Codex's cap; owner decisions OD1-OD7 and the measured budgets | Accepted | — | — |
| [ADR-0010](./ADR-0010-varlock-env-schema-and-launch.md) | varlock owns the env schema (generated `.env.core.schema` + project-owned `.env.schema`, no values, nothing required, exact pin + pair-load gate) and launches the three harnesses behind a precedence preflight; `env:set` reads `@sensitive` from the schema; Codex stdio servers load through `varlock run` | Accepted | — | — |
| [ADR-0011](./ADR-0011-secret-manager-advanced-option.md) | Secret values live in `.env` by default; a secret manager is the advanced, provider-agnostic opt-in (optional `.env.provider.schema` overlay imported by the core schema, 1Password adapter with a pinned plugin, `secrets:` block, launcher drops empty inherited copies of overlay keys) | Accepted | — | — |
| [ADR-0012](./ADR-0012-mcp-env-loader.md) | Every MCP server reads `.env` through one filtered varlock loader on the three hosts (`--filter` = its dependency set, context7 bare, Supabase token only); `harness:env` retires the plaintext copies; `vars:schema:check` fails a secret-looking key without `@sensitive`; doctor reports the secret source | Accepted | — | — |
| [ADR-0013](./ADR-0013-declared-harnesses.md) | A project declares the harnesses it uses (`harnesses:` in `.agents/project.yaml`, absent = detect from the files present); every compatibility gate (compat check, doctor, installer, updater) checks only those, the boilerplate always checks all three; the installer records the selection and offers to delete unused harness files (precedent: agentic-qa ADR-0012) | Accepted | — | — |
| [ADR-0014](./ADR-0014-instructions-maintenance-locks.md) | Progressive disclosure is held in place by a placement doctrine and one edit procedure (`agentic-dev-core/references/instructions-doctrine.md`), three `instructions:check` locks (router fingerprint behind its ADR, router eval on every run, complete section) and a recall audit (`instructions:audit`) | Accepted | — | — |

> Keep this table in sync whenever an ADR is added or its status changes. It is the fast index every session reads first.
>
> The ADRs in this table are decisions about the boilerplate itself; ADR-0001 is left free for the first product-level decision seeded by `/project-foundation`. Product-level ADRs in a scaffolded project start their own sequence from the next free number.

---

## References

- Template: [`ADR-NNNN-template.md`](./ADR-NNNN-template.md)
- AI detection + authoring doctrine: `.agents/skills/agentic-dev-core/references/adr-doctrine.md`
- Where this folder sits in the bigger map: `.context/README.md` and root `CONTEXT.md` §6
- Decisions about _the framework itself_ (why the repo is structured this way) live in `CONTEXT.md` §6, not here. This folder is for decisions about **the product you are building** with the boilerplate.
