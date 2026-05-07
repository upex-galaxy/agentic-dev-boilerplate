# Synthesis Rules — Cross-checking Judge A vs Judge B

> Cited by: `judgment-day/SKILL.md` §"Workflow" step 5.
> Audience: the orchestrator (or a synthesis subagent for very large diffs) reconciling the two parallel judge reports into a single actionable list.

The synthesizer is the protocol's discriminator. A poor synthesis turns two good reports into noise; a good one extracts the signal that neither judge alone could provide. Be strict about evidence.

---

## Core principle: real vs theoretical

Every finding from either judge is classified into one of four categories during synthesis. Only **Real** findings become action items; Theoretical findings are reported as INFO and never fixed in this iteration.

```
Confirmed-Real    → both judges flag the same issue (with overlapping evidence) → strong signal
Singleton-Real    → one judge flags, with concrete evidence (file:line + trigger) → action item
Singleton-Theoretical → one judge flags, no concrete trigger (speculative) → INFO bucket
Contradiction     → judges disagree on whether something is a problem → see §"Contradiction handling"
```

The single most-load-bearing rule in the whole protocol: **a finding without a concrete trigger is Theoretical, no matter how senior the judge sounds.**

---

## Cross-checking algorithm

Walk the union of both judges' findings. For each finding:

**Step 1 — Find the counterpart** in the other judge's report. Match on: same file+line (highest confidence) → same code path/function → same category + logical concern. If counterpart exists → **Confirmed-Real**.

**Step 2 — If no counterpart, classify by evidence**: file:line + concrete trigger → **Singleton-Real** (action item). file:line but no trigger → **Singleton-Theoretical** (INFO). Neither → discard, note in summary.

**Step 3 — Different framing, same concern**: consolidate into ONE Confirmed-Real action item; cite both judge findings.

### Step 4 — Severity reconciliation

When the matched judges assigned different severities to the same Confirmed-Real finding:

| Judge A     | Judge B     | Synthesized                                  |
| ----------- | ----------- | -------------------------------------------- |
| Critical    | Critical    | Critical                                     |
| Critical    | Major       | Critical (if A's evidence holds), else Major |
| Critical    | Minor       | Major (split the difference; investigate)    |
| Critical    | Theoretical | Major (one solid evidence beats no trigger)  |
| Major       | Major       | Major                                        |
| Major       | Minor       | Major                                        |
| Major       | Theoretical | Major                                        |
| Minor       | Minor       | Minor                                        |
| Minor       | Theoretical | Minor                                        |
| Theoretical | Theoretical | Theoretical (INFO only)                      |

Rule of thumb: **prefer the higher severity if the higher-severity judge cited concrete evidence**. Downgrade only when the evidence is weak.

---

## Contradiction handling

Two cases when judges disagree:

- **Case 1 — One judge missed it**: the other judge's finding has solid evidence. Treat as Singleton-Real. The "missing" judge isn't wrong; they just didn't flag it.
- **Case 2 — Genuine disagreement**: e.g. Judge A says "code handles X via line 42" and Judge B says "code does NOT handle X at line 42." Resolution: synthesizer reads line 42 directly (do not ask either judge). If determinable from code → decide and note "Judge X was correct." If not determinable → **escalate** per `escalation-rules.md`.

Never resolve by "Judge A had more findings overall." That defeats the protocol.

---

## Synthesized report format

```
{
  "iteration": 1 | 2 | 3,
  "summary": "<paragraph: overall posture, top concerns>",
  "findings": {
    "Critical": [{ id, title, evidence, explanation, suggested_fix,
                   source_judges: ["A"|"B"|"A+B"], source_finding_ids }],
    "Major":    [ ...same shape ],
    "Minor":    [ ...same shape ],
    "Theoretical_INFO": [{ id, title, explanation, source_judges,
                           note: "Reported only — no fix this iteration." }]
  },
  "contradictions_resolved": [{ concern, judge_A_position, judge_B_position,
                                synthesizer_verdict, evidence_consulted }],
  "contradictions_escalated": [{ concern, reason }],
  "verdict": "clean" | "has-criticals" | "has-majors-only" | "minors-only" | "needs-escalation"
}
```

`source_finding_ids` is non-optional — every synthesized finding cites which raw judge findings it came from.

`verdict` drives the next step in the workflow:

- `clean` → APPROVED, hand back to caller.
- `has-criticals` (or `has-majors-only` if `fix_severity_threshold = Major`) → dispatch fix agent, re-judge.
- `minors-only` → APPROVED with a "minor findings noted" appendix. No re-judge.
- `needs-escalation` → escalate per `escalation-rules.md` regardless of iteration count.

---

## Anti-patterns

These break the protocol. The synthesizer must NOT do any of these.

1. **Hallucinated agreement** — claiming "both judges flagged X" when only one did. Cross-check is meaningless if overlap is fabricated. Always cite `source_finding_ids`.
2. **Severity inflation** — promoting Theoretical findings to Major because "it sounds bad." Severity is a function of evidence, not vibe.
3. **Severity deflation** — burying Criticals in Minor because of schedule pressure. Severity is a function of the code, not the calendar.
4. **Scope creep** — including pre-existing-code findings as action items. Surface in summary instead.
5. **Sympathy synthesis** — softening the report because the dev tried hard. The synthesizer surfaces real issues, not softens them.
6. **One-sided synthesis** — preferring one judge because their report was longer/prettier. Reconcile by evidence, not aesthetics.
7. **Missing `source_finding_ids`** — every synthesized finding MUST cite raw judge findings. Untracked synthesis is unreviewable.
8. **Padding with INFO** — inventing Theoretical findings to "round out" the report. INFO contains real Theoreticals from the judges only.

---

## Worked example

**Judge A** (correctness): A-1-1 Critical AC-coverage `handler.ts:23` empty-cart AC not implemented; A-1-2 Major contract `handler.ts:78` response shape changed without version bump.

**Judge B** (robustness): B-1-1 Major edge-case `handler.ts:23` empty-cart crashes (POST `{items:[]}` → 500); B-1-2 Critical security `handler.ts:91` SQL injection in coupon code; B-1-3 Theoretical performance "slow under high concurrency" (no trigger).

**Synthesized output**:

- **S-1-1 Critical** — Empty-cart: AC not implemented AND handler crashes. Evidence: spec.md AC#4 + `handler.ts:23`. Source: A+B (consolidated A-1-1 + B-1-1; same underlying defect, took higher severity because A's spec evidence was solid).
- **S-1-2 Critical** — SQL injection in coupon at `handler.ts:91`. Source: B-1-2.
- **S-1-3 Major** — Response shape changed without version bump at `handler.ts:78`. Source: A-1-2.
- **Theoretical INFO** — B-1-3 (concurrency slowness, no trigger). Reported, not fixed.

Verdict: `has-criticals`. Dispatch fix agent for S-1-1, S-1-2 (and S-1-3 if `fix_severity_threshold = Major`), then re-judge.
