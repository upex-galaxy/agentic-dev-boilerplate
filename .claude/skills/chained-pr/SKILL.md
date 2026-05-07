---
name: chained-pr
description: "Strategic decision skill for splitting oversized changes into a chain of reviewable PRs. Triggers when sprint-dev's Workload Forecast emits risk=High and chain_strategy=pending, or when user manually invokes. Outputs: chosen strategy (stacked-to-main vs feature-branch-chain vs size-exception) + concrete branch plan. Triggers on: 'split this into chained PRs', 'stacked PR strategy', 'PR demasiado grande', 'chained-pr', 'too big PR', 'how to split this', 'cómo trozeo este cambio', 'workload forecast risk=high'. Do NOT use for: simple Git Flow operations (use /git-flow), merge conflicts (use /git-conflict-fix), or feature implementation (use /sprint-dev)."
license: MIT
compatibility: [claude-code, copilot, cursor, codex, opencode]
phase: planning
---

<!-- Model preferences (advisory; dispatchers may use to route) -->
<!--
model_preferences:
  foundation: opus       # high-leverage architectural work
  planning: sonnet       # structured writing
  implementation: sonnet # default for code work
  review: opus           # critical analysis
  archive: haiku         # mechanical close-out
-->

# Chained-PR — Strategic split of oversized changes

Pick a chain strategy when a planned change exceeds the **400-line cognitive review budget**. Output: a chosen strategy (`stacked-to-main`, `feature-branch-chain`, or `size-exception`) plus a concrete branch plan the user can execute literally.

This skill is **strategic only** — it does not write code, does not open PRs, does not run git commands. It picks the layout, hands the layout back to the caller (typically `/sprint-dev` Stage 2), and exits.

---

## When to use

Two entry points:

### Auto-handoff from sprint-dev (most common)

Sprint-dev Stage 1 ends with a Workload Forecast block. When that block says:

```
400-line budget risk: High
Chain strategy: pending
```

…the orchestrator blocks Stage 2 and hands off here. Input: the forecast block plus the `implementation-plan.md`. Output: a resolved `chain_strategy` value plus branch plan, returned to sprint-dev so Stage 2 can proceed.

### Manual invocation

The user notices a planned change is too big and asks for a strategy directly. Trigger phrases:

- "split this into chained PRs"
- "stacked PR strategy"
- "este PR va a quedar enorme, cómo lo trozeo"
- "what's the difference between stacked-to-main and feature-branch-chain"
- "we need to chain this — pick a layout"
- "workload forecast risk=high, chain_strategy=pending — resolve"

In manual mode the input is a free-form change description; the skill will ask for the missing pieces (file count, scope, whether main must always work) before deciding.

---

## Pre-requisites

- A change description detailed enough to identify: rough file count, whether the change has shared scaffolding (types, base classes, schemas), whether it's mechanical (rename / format / generated) vs cognitive (new logic).
- For auto-handoff: the forecast block from sprint-dev with `<X>`, `<Y>`, `<Z>` populated.
- Project Git Flow understood. PR base is `staging` in this repo (not `main` directly); production promotion is a separate gated event. Adjust branch naming examples accordingly.

If the change description is too vague (no file list, no scope), STOP and ask the user for clarification. Do not guess.

---

## Inputs

The skill expects one of:

1. **Forecast block** (from sprint-dev):

   ```
   ## Review Workload Forecast
   Estimated: <X> additions + <Y> deletions = <Z> total lines
   400-line budget risk: High
   Chain strategy: pending
   Decision needed before apply: Yes
   ```

   Plus the `implementation-plan.md` task list.

2. **User-provided change description** (manual invocation): free-form prose. The skill will probe for the decision-tree inputs below.

---

## Decision tree

Apply the questions in order. The first definitive answer wins.

```
Q1: Is the change mostly mechanical (rename, formatter, generated code, vendor update)?
├─ Yes → size-exception (with rationale required)
└─ No  → continue to Q2

Q2: Is the change linearly decomposable into 2-4 independent slices, each <400 lines,
    where main can safely contain slice N without slices N+1..M?
├─ Yes → stacked-to-main
└─ No  → continue to Q3

Q3: Does the change have shared scaffolding (new types, new base classes, new schemas)
    that multiple later slices depend on, where partial merges to main would break things?
├─ Yes → feature-branch-chain
└─ No  → re-decompose. A large monolithic non-mechanical change without shared scaffolding
         is a code smell — go back to Stage 1 planning and split into smaller stories.
```

Full decision tree with worked examples per change type lives in `references/decision-tree.md`.

---

## Strategy patterns (one paragraph each — full detail in references)

### `stacked-to-main`

2 to 4 PRs, each `< 400` lines. Each PR is branched off `main` (or `staging` per project Git Flow). PRs depend on previous PRs being merged before the next opens. Each PR is self-contained — `main` always works after each merge. Best for linear feature work with clear sub-deliverables (foundation → feature slice → docs/tests). Trade-off: rebase pain if PRs land out of order. Full pattern: `references/stacked-to-main.md`.

### `feature-branch-chain`

One long-lived integration branch (`feat/<key>-<slug>`) cut from `main`/`staging`. N child PRs each merge INTO the integration branch (not into `main`). When the integration branch is complete, a single final PR merges integration → `main`. Child PRs are reviewable as small slices; the integration branch isolates risk of partial merges. Best for big architectural changes with shared scaffolding. Trade-off: the integration branch can drift from `main`; periodic rebases needed. Full pattern: `references/feature-branch-chain.md`.

### `size-exception`

The diff is large but the change is mechanical and low-cognitive-cost: mass renames, formatter runs, ESLint auto-fix sweeps, generated code (OpenAPI types, Supabase types, GraphQL codegen output), vendor library updates. Requires explicit user override AND a written rationale in the PR description (`Why size-exception:` line). Reviewer is told upfront: do not read line-by-line; spot-check + CI signal is sufficient. Generated and vendor files SHOULD be marked in the diff with a `// generated, do not review` note where the file format allows.

---

## Output

The skill returns to the caller (sprint-dev or user) a structured answer:

```
## Chain Strategy Decision

Chosen: <stacked-to-main | feature-branch-chain | size-exception>

Rationale: <one paragraph explaining why this strategy fits the change>

Branch plan:
  Tracker / base: <branch name>
  PRs:
    1. <branch name> -> targets <branch> | scope: <one line> | est lines: <N>
    2. <branch name> -> targets <branch> | scope: <one line> | est lines: <N>
    ...

Update sprint-dev forecast block: chain_strategy=<chosen>
```

For `size-exception`:

```
## Chain Strategy Decision

Chosen: size-exception

Rationale: <why the diff is mechanical / low-cognitive>

Reviewer note (paste into PR description):
  > Why size-exception: <one paragraph>
  > Generated / vendor files (do not review line-by-line):
  >   - <path>
  >   - <path>

Update sprint-dev forecast block: chain_strategy=size-exception
```

---

## Hand-off back to sprint-dev

When invoked from sprint-dev Stage 2 gate:

1. Emit the Chain Strategy Decision block above.
2. Update the forecast block in `implementation-plan.md` from `chain_strategy: pending` to the chosen value.
3. Return control. The sprint-dev orchestrator re-evaluates the gate; with `chain_strategy != pending`, Stage 2 unblocks.
4. Stage 3 (Code Review) and Stage 4 (Staging Deploy) follow the chosen strategy's PR layout. The branch plan from this skill is the contract for those stages.

The hand-off is one-shot per planning cycle. If the implementation diverges from the plan (e.g. the planner under-estimated and the actual diff is larger), the orchestrator re-invokes this skill with the updated numbers — do not silently up-budget the existing strategy.

---

## Manual-mode flow

When invoked directly by the user (not from sprint-dev):

1. **Probe**: ask for the change description if not provided. Specifically ask:
   - Estimated total file count and rough line count.
   - Is there shared scaffolding (new types, base classes, shared schemas)?
   - Does `main` need to remain working at every merge point?
   - Is the change mechanical (rename, format, generated, vendor) or cognitive?
2. **Apply decision tree**: walk Q1 → Q2 → Q3.
3. **Emit Chain Strategy Decision**: same output format as auto-handoff mode.
4. **Optional**: if the user wants the literal git commands, point at `references/stacked-to-main.md` or `references/feature-branch-chain.md` for the executable runbook. This skill does not run those commands itself.

---

## Specific tasks — which reference to read

| User intent                             | Read                                                        |
| --------------------------------------- | ----------------------------------------------------------- |
| "what's stacked-to-main, exactly?"      | `references/stacked-to-main.md`                             |
| "what's feature-branch-chain, exactly?" | `references/feature-branch-chain.md`                        |
| "decision tree by change type"          | `references/decision-tree.md`                               |
| "how does the gate work in sprint-dev?" | `sprint-dev/references/workload-forecast.md` (sister skill) |

---

## Hand-offs

- **PR creation / branch ops** → `/git-flow` skill (this skill picks the layout; `/git-flow` runs the commands)
- **Merge conflicts during chain rebase** → `/git-conflict-fix` skill
- **Feature implementation** → `/sprint-dev` skill (this skill is invoked FROM sprint-dev, not the other way around)
- **Workload forecast algorithm / thresholds** → `sprint-dev/references/workload-forecast.md`

---

## Variables consumed

- `{{PROJECT_KEY}}` — for branch naming convention (e.g. `feat/UPEX-277-empty-states`)
- `{{ISSUE_TRACKER}}` — for ticket reference in PR description

If unset, fall back to a generic `feat/<slug>` naming and surface a warning that `/init-project` should be run.

---

## Gotchas — inline rules you must apply every invocation

1. **Strategic, not executional**: this skill picks the layout. It does NOT run git commands, open PRs, or write code. Hand off to `/git-flow` for execution.
2. **Don't pick a strategy for the planner**: in auto-handoff mode, the forecast block must already say `chain_strategy: pending`. This skill resolves the pending value; it does not decide for plans where the strategy is already set.
3. **`size-exception` requires user override**: never auto-pick it. The user must explicitly accept that the diff won't be reviewed line-by-line.
4. **Re-decompose is a valid output**: if Q3 says "no shared scaffolding, not mechanical, not linearly decomposable" — that's a planning failure, not a chain-strategy problem. Send the planner back to Stage 1.
5. **Branch base is `staging`, not `main`**: per project Git Flow. Production promotion is a separate gated event. Adjust branch plans accordingly.
6. **Chain plan is a contract**: Stage 3 (Code Review) and Stage 4 (Staging Deploy) follow the branch plan from this skill. If implementation diverges, re-invoke this skill — don't silently up-budget.
7. **Language**: artifacts and PR descriptions in English. Mirror the user's language only in conversation.

---

## Pre-flight checklist

- [ ] Input identified: forecast block (auto-handoff) or change description (manual).
- [ ] Decision-tree questions answered (Q1 mechanical? Q2 linearly decomposable? Q3 shared scaffolding?).
- [ ] Chain Strategy Decision block emitted with rationale + branch plan.
- [ ] If `size-exception`: user override obtained AND rationale + generated/vendor file list documented.
- [ ] If auto-handoff: forecast block in `implementation-plan.md` updated from `pending` to chosen strategy.
- [ ] Hand-off to `/git-flow` (or back to `/sprint-dev`) identified.

---

## Notes

- This skill is the answer to the question "what does the planner do when the forecast says risk=High?" — it is the gate-resolver, not a general PR-strategy advisor for already-merged work.
- Trade-off table (which strategy wins for which shape) lives in `references/decision-tree.md`. Keep that file as the single source of truth; do not duplicate decision logic across references.
- The 400-line cognitive review budget is borrowed from industry research (SmartBear, Cisco code review studies). Override at your own risk; the budget exists to protect reviewer focus, not to gate-keep PR size for its own sake.
