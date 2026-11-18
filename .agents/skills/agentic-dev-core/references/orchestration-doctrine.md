# Orchestration Doctrine

> **Mirror**: this file mirrors `AGENTS.md` §3 ("ORCHESTRATION MODE: PERMANENTLY ACTIVE").
> If you change the doctrine, update both files. The root `AGENTS.md` is the canonical source.
> Why it exists: a subagent can load this without pulling the whole `AGENTS.md` into its context.

## Orchestration Mode (Subagent Strategy)

The main conversation is the command center and subagents are the executors.

**Sanctioned exceptions.** A skill may define an explicit all-inline (**Solo**) mode that a user invokes and that dispatches no subagents. It may also pin one step to the session that owns a resource a subagent cannot hold, such as a browser or extension, or user auth bound to the main session. `/sprint-development` Solo mode is the example. Its live-UI step is not an exception: `/playwright-cli` is not session-bound, so that step runs inside the stage subagent.

**Use subagents for** reading or writing several files, MCP operations, research across repos, git operations, verification (tests, types, lint) and multi-file edits. **Keep in the main conversation** quick lookups, memory reads and writes, task tracking, questions to the user and planning. Delegate when the work returns a lot of tool output or splits into independent units; one scripted command or a lookup of under about five calls stays inline.

**A harness without subagents** (Pi ships none) runs the work inline, or uses a supervised worker when its gate allows. A brief that says "dispatch" still binds what the dispatch would have done, its report format included.

**Two executors.** One-shot subagents are the default. The optional second executor is a supervised worker: a persistent session coordinated through the user-level skill `/agent-orchestration`, available only when the orchestration binary exists and a runtime is reachable. When either is missing, a workflow skill says nothing about it. How to pick: `./dispatch-patterns.md` and `.agents/instructions/agent-orchestration-detail.md`.

**Briefing format.** Every dispatch carries all seven components:

1. **Goal**: one sentence.
2. **Context docs**: the files to read first.
3. **Project Standards (auto-resolved)**: compact rules copied from `.agents/skills/REGISTRY.md` (protocol: `./skill-resolver.md`).
4. **Skills to load**: named explicitly (for example `/playwright-cli`).
5. **Exact instructions**: step by step, not vague goals.
6. **Report format**: what to return (files changed, tests passed or failed, blockers).
7. **Rules**: the Critical Rules that apply.

### Rule reachability (a rule a subagent cannot see does not exist)

A dispatched subagent sees its briefing, the `## Project Standards (auto-resolved)` block copied from `.agents/skills/REGISTRY.md`, and the files the briefing names. It does not walk the `references/` tree of the skill that owns the work.

A rule that must bind an executor (a prohibition, a fail-closed gate, a credential contract, a cleanup duty) therefore lives in three places:

1. The owning `references/*.md`, with the full statement and the reason.
2. A bullet under the owning skill's `## Compact Rules` in `SKILL.md`, or its frontmatter `compact_rules`, so `scripts/build-skill-registry.ts` carries it into `REGISTRY.md`.
3. Component 7 (Rules) of every briefing whose dispatch could trip it.

A rule that lives only in a reference documents the orchestrator and constrains nobody. Observed failure: stage subagents improvised credentials and left session artifacts behind because they never opened the reference that forbade it.

### Ephemeral-artifact contract (secret hygiene)

This binds any subagent that writes authentication or session material to disk: cookie jars, `storageState.json` or other saved auth state, bearer-token or API-key files, `.har` captures with `Authorization` or `Cookie` headers, request logs that carry a session, DB dumps, or any file that would grant access if it leaked.

1. **Location**: write it only under the session scratch directory, never under the repo working tree, not even in an ignored path.
2. **Lifetime**: delete it before returning to the orchestrator. "At the end of the sprint" and "when the session closes" are too late; the deletion happens before the report.
3. **Disclosure**: the report (briefing component 6) includes:
   ```
   secrets_materialized: none | <list of artifact kinds>
   cleaned: yes | no (<reason>)
   ```
   `cleaned: no` is a blocker the orchestrator surfaces to the user and never lets pass silently.
4. **Reference by kind, never by value**: the material stays out of the report body, a plan, a commit message, a PR body and a tracker comment.

The orchestrator restates this contract in every briefing whose work involves logging into a running app, capturing traffic or holding a token.

### Gate design: fail-closed, evidence-bearing

A gate keyed on a value the gated agent writes itself is fail-open, because the agent can open its own gate by emitting a plausible value. A gate in any skill therefore:

1. Requires a **citation** beside the value: the decision procedure that produced it (which tree, which questions, which answers), written out enough to audit.
2. Treats a missing, empty or malformed citation as the blocking value, whatever the value field says.
3. Names who may fill the field. When the decision belongs to another skill, the gated agent may only emit the blocking value, and only the hand-off may resolve it.

Observed failure: a planner emitted a plausible chain-strategy label without running the decision tree, which switched off the gate that existed to force that decision.

### Value provenance (config claims cite the file they came from)

Critical Rule 10 (read `package.json` directly) extends to all project configuration:

- A statement about what the project is configured to do names the file and location it was read from, in the same turn (`read from .agents/project.yaml`).
- A value found in a skill reference, a template or a worked example is illustrative and routinely differs from any real project. Do not quote it as this project's state.
- Config samples inside `references/*.md` are labelled as examples where they appear, so a later reader cannot take one for state.

### Execution Patterns

| Pattern | When | Example |
|---|---|---|
| Parallel | Independent tasks | Read 3 context files at once |
| Sequential | Dependent tasks | Plan, then code, then test |
| Background | Long-running | Test suite runs while the next ticket is planned |
| Single | Simple task | One file edit with verification |

### Error protocol

When a subagent errors, stop and report the full context. Fix nothing without approval, and offer retry, skip or abort.

With nobody at the keyboard, the delegating brief answers that offer when it covers the case. Without such a brief, the run reports the error and does nothing outward or irreversible. Who may decide what: `./decision-protocol.md`.

### Planning

Present the plan, get approval, track progress, report results. A supervised worker takes the approval from its conductor or launcher. An unattended run takes it from the brief that launched it when the brief covers the plan; otherwise it does the reversible work, stops before any outward or irreversible action, and reports.
