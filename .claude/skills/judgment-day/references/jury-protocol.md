# Jury Protocol — Judge briefings, severity classification, hard rules

> Cited by: `judgment-day/SKILL.md` §"Workflow" steps 2-3.
> Audience: the orchestrator drafting parallel judge briefings; the judges executing them.

This file is the **single source of truth** for what each judge does. Both judges share the common briefing structure and the hard rules; only the evaluation focus differs.

---

## Common briefing structure (both judges)

Every judge briefing follows the 7-component shape from `init-project/references/briefing-template.md`. Component-by-component:

| #   | Component              | Judge A vs B                                                                                    |
| --- | ---------------------- | ----------------------------------------------------------------------------------------------- |
| 1   | **Goal**               | Different. A: correctness focus. B: robustness focus. (See per-judge sections below.)           |
| 2   | **Context docs**       | **Identical**. Target packet (diff, files, commits), spec/AC source, this file, CI/test output. |
| 3   | **Project Standards**  | **Identical**. Pulled from `.context/skill-registry.md`, filtered by diff file types and paths. |
| 4   | **Skills to load**     | None. Judges are read-only.                                                                     |
| 5   | **Exact instructions** | Different. Pointer to §"Judge A briefing" or §"Judge B briefing".                               |
| 6   | **Report format**      | **Identical**. See §"Judge output format".                                                      |
| 7   | **Rules**              | **Identical**. See §"Hard rules for judges".                                                    |

If the two judges receive divergent Project Standards or Report format blocks, the cross-check is poisoned. Verify symmetry before dispatch.

Project Standards filtering examples: diff touches `*.ts` → include `unit-testing`, `next-best-practices` rules; touches `tests/e2e/` → include `playwright-cli`, KATA rules; touches `auth/`, `security/` → include `code-auditor` / `security-scan` rules if registered.

---

## Judge A briefing — Correctness focus

Judge A asks: **"Does this code do what the spec says?"**

### Evaluation criteria (in priority order)

1. **AC coverage** — each Acceptance Criterion (Gherkin scenario or equivalent) has corresponding code paths. Missing AC → Critical finding.
2. **Spec compliance** — code matches the design described in spec.md or the implementation plan. Deviation without justification → Major.
3. **Logical errors** — control flow, data flow, off-by-one, wrong type coercion, inverted conditions, missing null checks where the type says non-null.
4. **Contract violations** — public APIs (function signatures, HTTP routes, DB schema) match the documented contract. Breaking changes that should have been versioned → Critical.
5. **Bug surface** — code that "works for the happy path the spec describes" but fails for legal inputs the spec also describes (e.g. spec says "accepts UTC and local timezones", code only handles UTC).

### What Judge A does NOT cover

- Edge cases beyond the spec (Judge B's territory).
- Security/performance/accessibility (Judge B's territory).
- Style preferences (lint catches those).
- Hypothetical refactors ("you could write this with a Map instead").

### Investigation steps

1. Read the spec / AC source; list every AC.
2. Read the diff and map each AC to the code path that implements it.
3. For each AC: implemented? correct per spec wording? tested?
4. Compare public API surfaces touched by the diff against existing contracts.
5. Produce findings per §"Judge output format".

---

## Judge B briefing — Robustness focus

Judge B asks: **"What breaks this code outside the happy path?"**

### Evaluation criteria (in priority order)

1. **Security** — input validation, authn/authz, secret handling, injection vectors (SQL, XSS, command, path traversal), privilege escalation, CSRF, SSRF. Touches sensitive paths → Critical for any unaddressed vector.
2. **Edge cases** — empty inputs, null/undefined, boundary values (0, -1, MAX_INT), unicode, very long strings, malformed payloads, concurrent access, partial failures.
3. **Error handling** — does the code fail loudly where it should (public methods, request handlers) and silently where it should (utility helpers per project convention)? Are errors actionable for the caller?
4. **Performance** — obvious N+1 queries, unbounded loops, blocking I/O on hot paths, memory leaks, missing indexes implied by the diff.
5. **Maintainability** — hidden coupling (a change here forces unrelated changes elsewhere), implicit ordering dependencies, magic numbers, naming that obscures intent.
6. **Accessibility** (where applicable) — keyboard nav, ARIA, contrast, focus management, semantic HTML. Use `accessibility-review` skill rules if registered.

### What Judge B does NOT cover

- AC compliance (Judge A's territory).
- Spec deviation (Judge A's territory).
- "Code could be more elegant" — only flag maintainability when the cost of NOT fixing is concrete (future-bug-likely, hard-to-onboard, etc.).
- Hypothetical scaling concerns absent evidence of the scale.

### Investigation steps

1. Read the diff; build a mental model of inputs and outputs.
2. For each input: enumerate boundary/empty/malformed cases. Does the code crash?
3. For each output/side effect: what happens on failure (network, DB, perms)?
4. Trace user-controlled data from entry to sink (DB, filesystem, shell, HTML). Unescaped paths?
5. Check error handling layers; check tests for edge-case coverage.
6. Produce findings per §"Judge output format".

---

## Judge output format

Each judge returns a structured findings list. JSON-shaped, but the orchestrator may render as markdown for readability:

```
{
  "judge": "A" | "B",
  "iteration": 1 | 2 | 3,
  "summary": "<one paragraph: overall posture, top concerns>",
  "findings": [
    {
      "id": "<judge-letter>-<iteration>-<index>",  // e.g. "A-1-3"
      "severity": "Critical" | "Major" | "Minor" | "Theoretical",
      "category": "AC-coverage" | "spec-compliance" | "logic-error" | "contract" | "security" | "edge-case" | "error-handling" | "performance" | "maintainability" | "accessibility",
      "title": "<short noun phrase>",
      "evidence": "<file:line + snippet OR test result OR AC scenario reference>",
      "explanation": "<2-4 sentences: what's wrong, why it matters, what triggers it>",
      "suggested_fix": "<one paragraph; optional but encouraged for Critical/Major>"
    }
  ],
  "verdict": "clean" | "has-criticals" | "has-majors-only" | "minors-only"
}
```

If a judge finds nothing actionable, `findings: []` and `verdict: "clean"`. Do NOT pad reports — empty is acceptable.

---

## Severity classification

| Severity        | Definition                                                                                   | Examples                                                                                |
| --------------- | -------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------- |
| **Critical**    | Blocks merge. Bug, data loss risk, security hole, AC not met, contract break.                | SQL injection, auth bypass, AC scenario completely missing, public API breaking change. |
| **Major**       | Should fix before merge. Real defect or robustness gap with concrete trigger, not blocking.  | Missing edge case the spec implies, error handling that loses context, N+1 query.       |
| **Minor**       | Nice-to-have. Real but low-impact: small maintainability improvement, naming, doc gap.       | Magic number, ambiguous variable name, comment outdated.                                |
| **Theoretical** | Speculative finding without concrete evidence the case can occur. **Reported, never fixed.** | "What if 10 million users hit this at once?" without evidence of that load.             |

The severity ladder is the most-cited piece of this protocol. Judges that inflate severities (Critical-everything) produce noise; judges that deflate (Theoretical-everything) miss real bugs. Be calibrated.

---

## Hard rules for judges

These rules are non-negotiable. Violations make the protocol worthless.

1. **Evidence-only findings** — every finding must cite **file:line** OR a **test result** OR an **AC scenario**. No `"this might be a problem"` without a pointer.
2. **No speculation without evidence** — if you can't construct a concrete trigger (input, sequence of calls, environmental condition), the finding is **Theoretical**, not Major or Critical.
3. **No style gate-keeping** — formatting, naming preferences, "I would write this differently" → out of scope. Lint and code review checklists handle those.
4. **No scope creep into pre-existing code** — only flag issues in the diff or in code paths the diff materially changes. "There's a bug in this other unrelated module" → out of scope (note in `summary`, do not list as a finding).
5. **No sympathy fixes** — don't downgrade a Critical because "the dev is busy" or "it's almost shipping." Severity is a function of the code, not the schedule.
6. **No coordination with the other judge** — you do not know the other judge exists. If your briefing accidentally references "the other judge" or "Judge B," that's an orchestrator bug; ignore it and operate as if you're solo.
7. **Be terse** — `summary` ≤ 5 lines, `explanation` ≤ 4 sentences, `suggested_fix` ≤ 1 paragraph. Reviewers should be able to skim.
8. **Be specific** — "improve error handling" is bad; "wrap line 47's `await fetch()` in try/catch and log the URL on failure" is good.
9. **Honor the project's conventions** — read the Project Standards block in your briefing. If it says "utility methods silent-fail, public methods fail-fast," don't flag a utility for not throwing.
10. **No fabricated agreement** — if you have nothing to flag, return `findings: []`. NEVER invent findings to "look thorough."

---

## Judge briefing skeleton (orchestrator-side)

Use this exact shape for both dispatches. Replace `<JUDGE>` with `A` or `B`.

```
Goal: Review the target packet for <correctness | robustness>.
Context docs: <target packet>, <spec.md>, <jury-protocol.md path>, <CI/test outputs>
Project Standards: <auto-resolved block — IDENTICAL for both judges>
Skills to load: (none)
Exact instructions:
  1. Read jury-protocol.md §"Judge <JUDGE> briefing".
  2. Read the target packet, spec, and test/CI output.
  3. Apply the investigation steps.
  4. Produce findings per §"Judge output format" with calibrated severities.
  5. No speculation without evidence — Theoretical bucket only.
Report format: JSON per §"Judge output format".
Rules: all 10 hard rules from §"Hard rules for judges". STOP if you cannot read the diff.
```

Dispatch both briefings in the **same** `<function_calls>` block. Sequential dispatch is a protocol violation.
