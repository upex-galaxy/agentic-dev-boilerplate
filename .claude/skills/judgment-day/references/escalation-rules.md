# Escalation Rules — When to stop iterating and hand to the user

> Cited by: `judgment-day/SKILL.md` §"Workflow" step 7.
> Audience: the orchestrator deciding whether to dispatch another fix-and-rejudge round, or escalate.

Escalation is not punting. It is structured hand-off with enough data for the user to decide quickly. The skill's value is doing the iteration on their behalf up to a sensible limit; past that limit, the user has cheaper tools (read the diff, ask the dev, override) than another auto-iteration.

---

## Escalation triggers (any one suffices)

1. **Max iterations reached with Criticals still open** — default `max_iterations = 2` (`.agents/project.yaml::judgment_day.max_iterations`). After Round 2 with `has-criticals`, escalate. Hard cap: 3 rounds regardless of config. If two fix-and-rejudge rounds can't drive Criticals to zero, the issue is structural and needs human decision.
2. **Judges genuinely contradict and synthesizer cannot resolve from code** — per `synthesis-rules.md` §"Contradiction handling" Case 2.
3. **Findings reveal scope-creep outside the PR** — judges flag issues not caused by THIS diff (e.g. pre-existing SQL injection in a file the diff touches but doesn't introduce). User decides: widen scope, open separate ticket, or accept pre-existing risk. Fix agent must not silently expand scope.
4. **Fix would require architectural changes** — sensible fix means redesigning (move logic to another layer, introduce abstraction, change data model). Not fix-and-iterate; Stage 1 re-spec. Examples: "fix needs a queue that doesn't exist"; "fix needs a DB schema migration."
5. **Synthesizer flags `verdict: "needs-escalation"`** — allowed without exhausting iterations when red flags can't be addressed by code fixes.

---

## What escalation is NOT

- **Not a failure** — escalation is the protocol's terminal state for ambiguous situations. Use it.
- **Not a substitute for trying** — escalate only after running the iteration loop or detecting one of the trigger conditions. Don't escalate at Round 0 because "this looks hard."
- **Not silent** — every escalation produces a structured report (see below). The user must not have to reverse-engineer what happened.
- **Not "let the dev figure it out"** — the report includes recommendations. The user picks; the report frames the picks.

---

## Escalation report format

Returned to the caller (sprint-dev Stage 3 or the user directly):

```
## Judgment-Day ESCALATED

Iterations completed: <1 | 2 | 3>
Iteration history:
  Round 1: <verdict — n Criticals, n Majors fixed | unresolved>
  Round 2: <verdict — n Criticals, n Majors fixed | unresolved>

Open Critical findings (final round):
  S-<round>-<index>: <title> | Evidence: <file:line+trigger> | Why we couldn't fix: <one para>

Open Major findings (optional, only if fix_severity_threshold = Major): <same shape>

Unresolvable contradictions: <concern> — A said X, B said Y, synthesizer could not determine.

Recommendation: <merge-with-risk-acceptance | split-PR | defer | abort | re-spec>
Reasoning: <2-4 sentences>

Alternatives: brief description of each option the user can pick.

Artifacts: synthesized report path, raw judge reports, diff reviewed (PR/SHA).
```

The recommendation is **the orchestrator's best guess given the data**. The user is free to override. The alternatives section makes that override one-step.

---

## Recommendation decision aid

Use this table to pick the recommendation. First match wins.

| Situation                                                      | Recommendation                           |
| -------------------------------------------------------------- | ---------------------------------------- |
| Critical = security hole (injection, auth bypass, secret leak) | `abort` (do NOT merge)                   |
| Critical = AC not implemented AND no architectural blocker     | `defer` (back to Stage 2)                |
| Critical = AC not implemented AND architectural blocker        | `re-spec` (back to Stage 1)              |
| Critical = breaking contract change without version bump       | `defer` (revert or version)              |
| Major-only with concrete fixes but ran out of iterations       | `defer` (one more manual round)          |
| Major-only with architectural blockers                         | `split-PR` (ship what's safe)            |
| Findings are mostly scope-creep into pre-existing code         | `merge-with-risk-acceptance` (note debt) |
| Contradictions unresolvable from code                          | `defer` (need human review)              |

If no row matches, default to `defer` and explain in the reasoning.

---

## Risk acceptance — when it's allowed

`merge-with-risk-acceptance` is the only recommendation that lets a Critical-finding PR ship. Use it ONLY when all three hold: finding is scope-creep (pre-existing, not introduced by this PR), the user has explicit awareness (report surfaces the risk), and a follow-up ticket is created.

Never recommend risk acceptance for: new Critical findings introduced by THIS PR; security findings of any kind (use `abort`); AC failures (use `defer` or `re-spec`).

---

## Hand-off to the caller

- **From sprint-dev Stage 3 auto-trigger**: return the report block; sprint-dev stays paused at Stage 3, surfaces the report to the user, and waits for the user to pick from the alternatives.
- **From manual user invocation**: return the report block directly; the user picks.

The orchestrator's job is to **frame the decision**, not to make it.
