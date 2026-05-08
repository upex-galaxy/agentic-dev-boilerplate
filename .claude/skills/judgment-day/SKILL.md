---
name: judgment-day
description: "Adversarial parallel review protocol: launches 2 independent blind judge subagents simultaneously to review the same target, synthesizes findings, applies fixes, re-judges until both pass or escalates after 2 iterations. Use for critical PRs (security/auth/billing/payments paths) and high-stakes architectural changes. Composable from sprint-dev Stage 3 (manual or auto-trigger on sensitive paths). Triggers on: 'judgment day', 'doble review', 'adversarial review', 'que lo juzguen', 'dual review', 'critical PR review', 'security review of this PR'. Do NOT use for: routine code review (use sprint-dev Stage 3 directly), single-perspective review, or merge-conflict resolution (use /fix-git-conflict)."
license: MIT
compatibility: [claude-code, copilot, cursor, codex, opencode]
phase: review
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

# Judgment-Day — Adversarial parallel review protocol

Two independent judge subagents review the same target **in parallel, blind to each other**. The orchestrator synthesizes their findings (cross-checking real vs theoretical), dispatches a fix agent, and re-judges. Max 2 iterations; if the target still fails, escalate to the user with a structured report.

This skill is **review-grade**, not routine. The cost (two parallel subagents, possibly twice) only pays off when a single-perspective review (sprint-dev Stage 3 default) is insufficient — sensitive code paths, high-stakes architectural changes, pre-production gates.

---

## When to use

Two entry points.

### Auto-trigger from sprint-dev Stage 3

When a PR's diff touches any path in `.agents/project.yaml::judgment_day.auto_trigger_paths`, sprint-dev Stage 3 invokes this skill **before** declaring the review green. Default trigger paths:

```
- security/
- auth/
- billing/
- payments/
- secrets/
```

The auto-trigger is meant to be **boring** — it fires every time, no judgment call required from sprint-dev. Override the path list per project to match the codebase's high-risk surface.

### Manual invocation

The user explicitly asks for a stronger review than the default. Trigger phrases:

- "judgment day on PR #345"
- "doble review for the auth refactor"
- "que lo juzguen, esto toca payments"
- "adversarial review of the security middleware change"
- "critical PR review"
- "I want two perspectives on this before merge"

Manual mode accepts any of: a PR URL, a branch name, a `.context/PBI/{ticket}/` folder, or a free-form change description with diff.

---

## When NOT to use

- **Routine code review** — sprint-dev Stage 3 single-reviewer pass is enough. Don't burn two parallel subagents on a 50-line CRUD change.
- **Doc-only PRs** — README, comments, type doc. Lint catches these; adversarial review adds noise.
- **Low-risk changes** — UI tweaks, copy changes, dependency bumps with no security implications.
- **Merge-conflict resolution** — use `/fix-git-conflict`. This skill judges code, it doesn't resolve conflicts.
- **Single-perspective review** — if you only want one opinion, just use sprint-dev Stage 3.

If the user invokes judgment-day for a clearly-low-risk change, surface the cost ("this will dispatch 2 parallel subagents — confirm?") and let them confirm or downgrade to standard review.

---

## Pre-requisites

- A reviewable target: PR URL, branch with diff, or local change description with file paths.
- The PR / change is **complete** — judgment-day reviews finished work, not work-in-progress drafts.
- Project standards available in `.context/skill-registry.md` (built once per session by `bun scripts/build-skill-registry.ts`). The orchestrator injects relevant skill rules into both judge briefings identically.
- For auto-trigger mode: sprint-dev's Stage 3 has already produced a diff summary the orchestrator can hand to the judges.

If the target is incomplete (open TODOs, missing tests the AC requires, draft commits), STOP and ask the user to finish the work before judgment.

---

## Workflow

The protocol has 7 steps. Steps 3 and 6 are **parallel dispatches**.

### 1. Receive target

Inputs accepted (in priority order):

1. PR URL (e.g. `https://github.com/org/repo/pull/345`) — the orchestrator reads the diff via `gh pr diff` or equivalent.
2. Branch name (e.g. `feat/UPEX-277-empty-states`) — orchestrator runs `git diff staging...<branch>`.
3. PBI folder (e.g. `.context/PBI/user-management/UPEX-277-empty-states/`) — orchestrator reads spec.md + the PR linked in PROGRESS.md.
4. Free-form change description with file paths — orchestrator reads each file and reconstructs the change surface.

The orchestrator captures: file list, diff, spec/AC source (if available), test results (if CI ran), commit history. This becomes the **target packet** the judges receive.

### 2. Build judge briefings

Both judges receive **identical** briefings (the only difference is their evaluation focus). Use `init-project/references/briefing-template.md` as the shape. The 7 components are filled like this:

1. **Goal** — judge-specific: "Review the target packet for correctness" (Judge A) or "...for robustness" (Judge B).
2. **Context docs** — target packet contents, spec.md (if any), `references/jury-protocol.md` (the judge's playbook).
3. **Project Standards (auto-resolved)** — pulled from `.context/skill-registry.md`, filtered to skills relevant by file type/path. Both judges receive the same Project Standards block verbatim.
4. **Skills to load** — none. Judges are read-only; they don't dispatch tools that mutate.
5. **Exact instructions** — pointer to `references/jury-protocol.md` §"Judge A briefing" or §"Judge B briefing".
6. **Report format** — structured findings list per `references/jury-protocol.md` §"Judge output format".
7. **Rules** — the hard rules from `references/jury-protocol.md` §"Hard rules for judges".

The orchestrator does NOT tell either judge that the other exists. Blind protocol is load-bearing — each judge must form its verdict independently to make the synthesis cross-check meaningful.

### 3. Dispatch ∥ 2 judges in parallel

Both subagents fire in the **same dispatch block** (parallel pattern from `init-project/references/dispatch-patterns.md`).

- **Judge A — correctness focus**: does the code do what the spec says? Are AC met? Logic errors? Bug surface? Contract violations? Off-by-one? Wrong types?
- **Judge B — robustness focus**: edge cases? Security implications? Performance regressions? Maintainability? Hidden coupling? Accessibility? Error handling?

Full briefings: `references/jury-protocol.md`.

### 4. Receive both reports

Each judge returns a structured findings list with severity tags: **Critical / Major / Minor / Theoretical**. The orchestrator does not act on individual reports — it waits for both, then synthesizes.

If one judge times out or errors, **do not proceed with one report**. Re-dispatch the failing judge or escalate to the user. A single-judge verdict defeats the protocol's purpose.

### 5. Synthesize

The orchestrator (or a synthesis subagent for very large diffs) cross-checks the two reports per `references/synthesis-rules.md`:

- **Both judges agree** → strong signal, action item.
- **One judge cites concrete evidence** (file:line, test, AC scenario) → action item.
- **One judge speculates without evidence** → discard or de-prioritize as Theoretical.
- **Both judges flag same concern with different framing** → consolidate into one action item.

Output: a synthesized report with grouped findings (Critical / Major / Minor) and action items per Critical/Major finding. Theoretical findings are listed separately as INFO — not actioned in this iteration.

### 6. Fix → re-judge

If the synthesized report has any **Critical** findings (and optionally Major, configurable), dispatch a **fix agent** with the action items. The fix agent:

- Reads the synthesis report.
- Applies fixes only for the listed action items (no scope creep).
- Reports back: files changed, commits made.

After fixes, **re-launch both judges in parallel** with the updated target packet. Same blind protocol. Round 2 verdict goes through synthesis again.

### 7. Convergence or escalation

- **Round 1 clean** (both judges report zero Criticals) → APPROVED. Hand back to caller.
- **Round 2 clean** → APPROVED. Hand back to caller.
- **Round 2 still has Criticals** → **ESCALATE** to user per `references/escalation-rules.md`. Do not auto-iterate beyond 2 rounds.

`max_iterations` is configurable via `.agents/project.yaml::judgment_day.max_iterations` (default: `2`). Hard cap is 3 — the orchestrator MUST NOT iterate past that under any config.

---

## Judge briefings

See `references/jury-protocol.md` for:

- Judge A briefing template (correctness focus)
- Judge B briefing template (robustness focus)
- Common briefing structure (goal, target, evaluation criteria, output format)
- Severity classification (Critical / Major / Minor / Theoretical)
- Hard rules for judges (evidence-only, no speculation, no style gate-keeping)

Both judge briefings reference the same playbook. Do not maintain divergent rules across the two judges' instructions — that breaks the cross-check.

---

## Synthesis rules

See `references/synthesis-rules.md` for:

- Cross-checking findings (both agree / one with evidence / one speculating)
- Severity reconciliation when judges disagree
- Output format for the synthesized report
- Anti-patterns (hallucinated agreements, severity inflation, scope creep)

The synthesizer is the orchestrator's discriminator. A bad synthesis defeats the parallel-blind setup — be strict about evidence.

---

## Escalation rules

See `references/escalation-rules.md` for:

- When to escalate (max iterations, irreconcilable disagreement, scope-creep findings)
- Escalation report format (iteration history, open Criticals, recommendation)
- What escalation is NOT (it's not punting; it's structured hand-off with enough context for the user to decide quickly)

The user's options at escalation: merge with risk acceptance, split PR, defer, or abort. The skill provides the data; the user decides.

---

## Composability with sprint-dev

### Auto-trigger path

```
sprint-dev Stage 3 (Code Review)
  ↓
read .agents/project.yaml::judgment_day.auto_trigger_paths
  ↓
diff intersects any path? → invoke judgment-day → wait for verdict → continue Stage 3
diff does not intersect → standard single-reviewer Stage 3
```

The auto-trigger is **gating**: sprint-dev cannot mark Stage 3 green without a judgment-day APPROVED verdict (when the trigger fires).

### Manual path

User invokes the skill directly; verdict (APPROVED or ESCALATED) is returned to the user. The skill does not call back into sprint-dev; the user decides what to do with the verdict.

### Hand-off contract

What this skill returns to the caller:

```
## Judgment-Day Verdict

Iterations: <1 | 2>
Status: APPROVED | ESCALATED

Findings (synthesized, final round):
  Critical: <n> (<list>)
  Major:    <n> (<list>)
  Minor:    <n> (<list>)
  Theoretical (INFO): <n>

Fixes applied: <yes | no | partial>
Commits: <SHA list, if any>

Recommendation: <merge | merge-with-risk-acceptance | split-PR | defer | abort>
```

Sprint-dev consumes this block to decide whether Stage 3 is green or whether to loop back to Stage 2 (fix-and-iterate).

---

## Variables consumed

- `.agents/project.yaml::judgment_day.auto_trigger_paths` — list of path prefixes that trigger auto-invocation from sprint-dev. Optional; default: `["security/", "auth/", "billing/", "payments/", "secrets/"]`.
- `.agents/project.yaml::judgment_day.max_iterations` — max judge rounds before escalation. Optional; default: `2`. Hard cap: `3`.
- `.agents/project.yaml::judgment_day.fix_severity_threshold` — minimum severity to trigger the fix agent. Optional; default: `Critical`. Set to `Major` for stricter projects.
- `{{PROJECT_KEY}}` — for ticket reference in escalation reports.
- `{{ISSUE_TRACKER}}` — for ticket linking in the verdict.

If unset, fall back to the defaults listed and surface a one-line warning that `/init-project` should be run to populate `.agents/project.yaml`.

---

## Hand-offs

- **Routine review (single perspective)** → sprint-dev Stage 3 directly (no judgment-day).
- **Fix application after synthesis** → sprint-dev Stage 2 fix-and-iterate (`fix-issues.md`). Judgment-day's fix agent IS that loop, just scoped to the synthesis action items.
- **Merge conflict resolution** → `/fix-git-conflict`.
- **PR creation / merge ops** → `/git-flow`.
- **Test automation** of any uncovered AC scenario surfaced by the judges → out of scope here. Surface the gap to the caller; sprint-testing (sister repo) handles automation.

---

## Gotchas — inline rules you must apply every invocation

1. **Blind judges**: never tell either judge about the other. Do not paste Judge A's findings into Judge B's briefing or vice versa. Cross-checking happens in synthesis, not inside the judges.
2. **Identical Project Standards block**: both judges receive the same auto-resolved skill rules block. Asymmetric briefings break the cross-check.
3. **Parallel, not sequential**: both judges fire in the same dispatch block. If you serialize them, you lose the protocol's value (and double the wallclock).
4. **Re-dispatch on judge failure**: if one judge errors, do NOT proceed with one verdict. Re-dispatch or escalate.
5. **Hard cap at 3 iterations**: regardless of config, never iterate past 3 rounds. Escalate.
6. **Fix agent stays in scope**: the fix agent only addresses synthesis action items. No drive-by refactors, no "while I'm here" cleanups.
7. **Theoretical findings are INFO, not actions**: never fix Theoretical findings in the same round. They go to the verdict's INFO bucket.
8. **Severity reconciliation**: when judges disagree on severity, take the higher one if evidence is solid; downgrade only if both judges' evidence is weak.
9. **Language**: artifacts (briefings, reports, verdicts) in English. Mirror the user's language only in conversation.
10. **No commits without verdict**: judgment-day does not commit fixes to `staging` or `main`. Commits live on the feature branch; merge is the caller's decision (or sprint-dev Stage 4's).

---

## Pre-flight checklist

- [ ] Target identified, complete, and `.context/skill-registry.md` available.
- [ ] Project Standards block resolved per `init-project/references/skill-resolver.md`.
- [ ] Both judge briefings drafted with **identical** Project Standards, **divergent** focus.
- [ ] Parallel dispatch confirmed (both judges in the same `<function_calls>` block).
- [ ] Synthesis rules + escalation criteria ready.
- [ ] Caller identified — verdict returned to that caller.

---

## Notes

- Borrowed from gentle-ai's judgment-day, re-anchored to sprint-dev Stage 3 and our `.agents/project.yaml` + skill-registry stack.
- The "Real vs Theoretical" classification is the most load-bearing single rule. Re-read `references/synthesis-rules.md` §"Anti-patterns" before each invocation.
- Adversarial review is expensive. If most PRs trigger it, your `auto_trigger_paths` list is too broad — tune it to genuinely sensitive surfaces.
