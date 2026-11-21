# Story code review (Stage 3 reviewer)

> **Tracker note.** Written for the `jira` tracker and applied as written when `issue_tracker` resolves to `jira`. On `github` or `none`, its Jira steps (fields, `jira:sync-issues`, the PBI tree, the ATP, transitions, comments) are replaced by `SKILL.md` `## Tracker modes` and `## The trail`. Read the diff without the trail folder (`':(exclude)<trail.dir>'`); without a feature PR you get a diff command instead of a PR, reviewed the same way.

This file is the Stage 3 reviewer of one story inside `/sprint-development`. The reviewer proposes findings, the orchestrator adjudicates them, and nothing is posted. Reviewing a teammate's PR or an external repo's PR for a human, with a strictness lens, a score and a posted comment, is `/pr-review-lead`. It walks the checklist below by reference and shares the severity scale in "Adjudication contract". Change the checklist here, never in a copy.

The task: a complete static code review of the code implemented for `STORY-{PROJECT_KEY}-{ISSUE_NUM}-{slug}`.

## Tooling check

The review leans on current best practices, so it uses the docs tool (`[DOCS_TOOL]`, Context7 by default) when it is available.

When it is not, a person who is present gets one offer: pause to connect it (recommended), or continue on built-in knowledge, which may be out of date. A supervised worker or a run with nobody present continues without asking, and the report says the best-practice checks rest on built-in knowledge.

## Context to read

1. **Story and plan.** They define what the code must satisfy (the acceptance criteria) and the technical approach that was planned:

   ```
   .context/PBI/epics/EPIC-{PROJECT_KEY}-{ISSUE_NUM}-{slug}/stories/STORY-{PROJECT_KEY}-{ISSUE_NUM}-{slug}/story.md
   .context/PBI/epics/EPIC-{PROJECT_KEY}-{ISSUE_NUM}-{slug}/stories/STORY-{PROJECT_KEY}-{ISSUE_NUM}-{slug}/implementation-plan.md
   ```

2. **Code standards.** The checklist of standards, the error-handling rules and the `data-testid` standards for component identity:

   ```
   references/code-standards.md
   references/error-handling.md
   references/data-testid-standards.md
   ```

   These are defaults for an app with no convention of its own. Where the app already has one (import alias `{{stack.conventions.import_alias}}`, folder structure, error handling, test ids `{{stack.conventions.testid_style}}`), review against the app's convention. Departing from the app's convention is a finding. Departing from a default here, where the app has its own, is not (`../SKILL.md`, `## Stack parameters`, "Existing conventions win").

3. **Design system and screen design (UI stories).**

   ```
   DESIGN.md                              # token + component-system authority
   .context/design/master-design-plan.md  # per-screen fidelity specs + US→Screen map (if present)
   ```

   Look up the story's screen in the master design plan's US-to-screen map (when the plan exists) and check the UI against that screen's fidelity spec and the frozen `DESIGN.md` tokens, not just "uses some component". The agreed design for that screen is the reference, not intuition. An unratified divergence from it is a review defect.

4. **The implementation.** The full diff and the files created or modified.

## Review checklist

Review in this order. A criterion that is not met, or a failing build, is a `BLOCKER`.

### 1. Acceptance criteria

- [ ] Every AC in `story.md` is met
- [ ] The functionality works as specified
- [ ] Edge cases from the ACs and the implementation plan are handled

### 2. Lint and build

Run them when you can, from `{{stack.app_root}}` with the app's own scripts. A role that is `null` is skipped and reported:

```bash
{{stack.package_manager}} run {{stack.scripts.lint}}
{{stack.package_manager}} run {{stack.scripts.build}}
```

- [ ] Linting: no ESLint errors
- [ ] TypeScript: no compile errors
- [ ] Build: succeeds

A failure must be fixed before merge (`BLOCKER`). When you cannot run them, report each as "not run" with the command, so a person or the orchestrator can run it. Do not mark it passed.

### 3. Code standards

Go file by file.

#### A) DRY

- [ ] No duplicated code
- [ ] Repeated logic is extracted into reusable functions
- [ ] UI components reuse the design system

```typescript
// Bad: duplicated code
function getUserName() {
  const user = await fetch('/api/user');
  return user.name;
}

function getUserEmail() {
  const user = await fetch('/api/user'); // Duplicate
  return user.email;
}

// Good: DRY
async function getUser() {
  return await fetch('/api/user');
}
```

#### B) Naming conventions

- [ ] Variables: descriptive `camelCase`
- [ ] Functions: `camelCase` with verbs (`getUserData`, `handleClick`)
- [ ] React components: `PascalCase`
- [ ] Constants: `UPPER_SNAKE_CASE`
- [ ] No generic names (`data`, `temp`, `x`)

```typescript
// Bad
const data = getUserData();
const x = 5;

// Good
const userData = getUserData();
const maxRetryAttempts = 5;
```

#### C) TypeScript strict

- [ ] No `any` (except justified exceptions)
- [ ] Explicit types on parameters and return values
- [ ] Interfaces or types for complex objects
- [ ] No `@ts-ignore` without an explanatory comment

```typescript
// Bad
function processData(data: any) {
  return data.map((item: any) => item.value);
}

// Good
interface DataItem {
  value: string;
  id: number;
}

function processData(data: DataItem[]): string[] {
  return data.map(item => item.value);
}
```

#### D) Error handling

- [ ] try/catch around async operations
- [ ] No `console.error()` (use the app's logger)
- [ ] Specific errors, not generic ones
- [ ] Error messages that help debugging

```typescript
// Bad
async function fetchData() {
  const data = await fetch('/api/data'); // No error handling
  console.error('Error'); // Not specific
}

// Good
async function fetchData(): Promise<Data[]> {
  try {
    const response = await fetch('/api/data');
    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    logger.error('Failed to fetch data', { error });
    throw error;
  }
}
```

#### E) Magic numbers and hardcoding

- [ ] No hardcoded values (use constants or env vars)
- [ ] No API keys or secrets in code
- [ ] Configuration lives in the proper files

```typescript
// Bad
const apiKey = 'sk-1234567890'  // Hardcoded secret
if (users.length > 50) {  // Magic number

// Good
const apiKey = process.env.API_KEY
const MAX_USERS_PER_PAGE = 50
if (users.length > MAX_USERS_PER_PAGE) {
```

### 4. Architecture & Structure

- [ ] Folder structure is right for the project
- [ ] Concerns are separated: UI (components) is not logic (hooks, utils), which is not data (API calls)
- [ ] Components are reusable, not duplicated
- [ ] Imports are organized (React, then libraries, then local)

A good structure, where `[feature]`, `[DomainCard]` and `[domain-entity]` come from the project's domain (for example `mentors/MentorCard/useMentors` in one project, `products/ProductCard/useProducts` in another):

```
app/
├── [feature]/
│   ├── page.tsx          # UI (component)
│   └── components/
│       └── [DomainCard].tsx
lib/
├── api/
│   └── [domain-entity].ts        # Data (API calls)
└── hooks/
    └── use[DomainEntity].ts     # Logic (custom hook)
```

### 5. Security

- [ ] No hardcoded secrets (API keys, tokens, passwords)
- [ ] User input is validated and sanitized
- [ ] SQL injection is prevented (when queries are written by hand)
- [ ] XSS is prevented (no `dangerouslySetInnerHTML` without sanitizing)
- [ ] Protected routes check auth

```typescript
// Bad: hardcoded secret
const dbUrl = 'postgresql://user:password@localhost/db'

// Good: env var
const dbUrl = process.env.DATABASE_URL

// Bad: unvalidated input
function createUser(email: string) {
  db.query(`INSERT INTO users (email) VALUES ('${email}')`)  // SQL injection

// Good: validated input and a parameterized query
function createUser(email: string) {
  if (!isValidEmail(email)) throw new Error('Invalid email')
  db.query('INSERT INTO users (email) VALUES ($1)', [email])
}
```

A hardcoded secret is a `BLOCKER` with no exceptions. For functions that take a caller-supplied identity, see `references/rpc-authorization.md`.

### 6. Basic performance

- [ ] No needless loops or complex nesting (O(n²))
- [ ] React: `useMemo` / `useCallback` around expensive computations
- [ ] No needless refetching
- [ ] Optimized queries (no N+1)
- [ ] Heavy components load lazily (when it applies)

```typescript
// Bad: N+1 queries
users.forEach(user => {
  const posts = await fetchPostsByUser(user.id); // N queries
});

// Good: one query
const allPosts = await fetchAllPosts();
const postsByUser = groupBy(allPosts, 'userId');
```

### 7. UI/UX (stories with an interface)

- [ ] Uses design-system components (Button, Card, Input, and so on)
- [ ] Correct color palette (`bg-primary`, not `bg-blue-500`)
- [ ] Responsive on mobile, tablet and desktop
- [ ] Loading states (skeleton, spinner)
- [ ] Error states (message plus retry)
- [ ] Empty states (message plus call to action)
- [ ] Basic accessibility: labels on inputs, alt text on images, working keyboard navigation

```tsx
// Bad: skips the design system, hardcoded color
<button className="bg-blue-500 px-4 py-2">Click me</button>;

// Good: uses the design system
import { Button } from '@/components/ui/button';
<Button variant="primary">Click me</Button>;
```

### 8. Data-testid for component identity

Check against the app's test-id convention (`{{stack.conventions.testid_style}}`, or the one its code already uses). With none, use `references/data-testid-standards.md`. Another tool may select by a test id, so renaming, re-casing or deleting an existing one is a `MAJOR` finding.

- [ ] Domain components (MentorCard, LoginForm, and so on) carry `data-testid` in their definition
- [ ] Base UI components (shadcn Button, Card, Input) receive `data-testid` where they are used, not in their definition
- [ ] Naming: component root in `camelCase` (`data-testid="mentorCard"`), inner elements in `snake_case` (`data-testid="submit_button"`)
- [ ] No dynamic ids such as `` data-testid={`card-${id}`} ``

```tsx
// Bad: dynamic id (tests cannot predict it)
<Card data-testid={`mentor-${mentor.id}`}>

// Bad: data-testid in a base UI component's definition
// components/ui/button.tsx
export function Button({ children }) {
  return <button data-testid="button">{children}</button>  // No
}

// Good: domain component with data-testid in its definition
export function MentorCard({ mentor }) {
  return (
    <Card data-testid="mentorCard">
      <h3 data-testid="mentor_name">{mentor.name}</h3>
      <Button data-testid="book_session_button">Book session</Button>
    </Card>
  )
}
```

A missing `data-testid` on a critical UI component is a `MAJOR` finding: selectors get less stable and automating the flow later gets harder.

### 9. General code quality

- [ ] Small functions (under about 50 lines)
- [ ] Comments only where needed (the code explains itself)
- [ ] No commented-out code (delete it)
- [ ] No forgotten `console.log`
- [ ] Unused imports removed

## What this phase does not review

Automated tests are out of scope here: unit tests were written during implementation, and integration and E2E tests, like coverage, have their own flow. This review covers code quality, the ACs and architecture. The one exception is the lying-tests check in "Two-axis review", which looks at the tests the diff adds.

## Report

```markdown
# Code review: STORY-{PROJECT_KEY}-{ISSUE_NUM}-{slug}

**Reviewer:** [role and axis]
**Date:** [date]

## Decision

- [ ] APPROVED: ready to integrate or deploy
- [ ] APPROVED with comments: merge, and open issues for the minor improvements
- [ ] CHANGES REQUESTED: fix the BLOCKER and MAJOR findings first

## Acceptance criteria

**Story:** [story title]

| AC                 | Status  | Notes                    |
| ------------------ | ------- | ------------------------ |
| AC1: [description] | Met     | [optional comment]       |
| AC2: [description] | Met     | [optional comment]       |
| AC3: [description] | Not met | **Reason:** [explain why] |

## Findings

### BLOCKER (must fix)

1. **`app/api/users/route.ts:15`** (standards): hardcoded API key
   - **Problem:** `const apiKey = 'sk-123456'`
   - **Why it matters:** security risk
   - **Suggestion:** move it to `process.env.API_KEY`

### MAJOR (should fix)

2. **`components/[EntityList].tsx:45`** (standards): duplicated code
   - **Problem:** the filter logic is repeated in 3 places
   - **Why it matters:** breaks DRY
   - **Suggestion:** extract a `use[Entity]Filters()` hook

### MINOR and NIT (optional)

3. **`lib/utils.ts:8`** (standards), NIT: vague variable name
   - **Problem:** `const data = fetchData()`
   - **Suggestion:** `const [entity]Data = fetch[Entity]Data()`

(`[EntityList]`, `[Entity]` and `[entity]` come from the project's domain.)

## What went well

- [specific strengths, for example separation of concerns or correct design-system use]

## Lint and build

- **ESLint:** no errors / N errors (details) / not run
- **TypeScript:** no errors / N errors (details) / not run
- **Build:** succeeds / fails (details) / not run

## Metrics

- **Files created:** X
- **Files modified:** Y
- **Lines added:** +Z
- **Lines removed:** -W

## Additional comments

[general feedback for the developer]

## Next steps

- If APPROVED: integrate or deploy the story.
- If CHANGES REQUESTED: the developer fixes the BLOCKER and MAJOR findings, then the story is re-reviewed.
```

Every finding names its file and line. Be specific.

## Two-axis review

A change can pass one axis and fail the other. Code that follows every convention but does something the story never asked for passes Standards and fails Spec. Code that delivers the ACs in a tangle of duplication does the reverse. One reviewer holding both questions lets the first answer color the second, so two reviewers answer them separately, each in a fresh context.

| Axis | Question | Reads | Does not read |
| --- | --- | --- | --- |
| Spec | Does the diff deliver what the story, its ACs and the plan asked for? | the diff, `story.md`, `implementation-plan.md`, the screen's fidelity spec and `DESIGN.md` for a UI story, the LT-1 and LT-2 rows of the lying-tests table | `references/code-standards.md` and the checklist above |
| Standards | Does the diff meet the code standards and the checklist? | the diff, `references/code-standards.md`, `references/error-handling.md`, `references/data-testid-standards.md`, checklist sections 2 to 9, the LT-3 row of the lying-tests table | the ACs and the story |

The implementer already read the standards while coding, so keeping them from the orchestrator and the Spec reviewer costs nothing and stops either from grading convention in place of behavior. The lying-tests split follows what each axis can see (`/unit-testing`, `references/tdd-workflow.md`, "Lying tests (LT-1 to LT-3)"): tautology and cannot-fail need the spec to know where an expected value should come from (Spec), and structure sensitivity is a code-convention matter (Standards).

Both briefs use the 7-component shape of `agentic-dev-core/references/briefing-template.md`. Each reviewer gets the diff command and the files for its own axis, returns a report of about 400 words, tags every finding with its axis (`spec` or `standards`) and uses the severity scale below.

```
Spec reviewer
Goal: Check the diff against the story, its acceptance criteria and the implementation plan, and find lying tests (LT-1, LT-2).
Context docs: the files in the Spec row above.
Skills to load: (none)
Exact instructions:
  1. Run the diff command from the briefing.
  2. Report acceptance criteria with no implementation, or a partial one.
  3. Report work nobody asked for (scope creep).
  4. Report code that looks like it meets a criterion but does something else.
  5. For a UI story, report where the screen departs from its fidelity spec or the DESIGN.md tokens.
  6. Apply LT-1 and LT-2 to every new test.
Report format: about 400 words, each finding quoting the AC or plan line, with axis, severity and file:line.
Rules:
  - Do not read the code standards.
  - Do not edit code.

Standards reviewer
Goal: Check the diff against the code standards and the review checklist, and find structure-sensitive tests (LT-3).
Context docs: the files in the Standards row above.
Skills to load: (none)
Exact instructions:
  1. Run the diff command from the briefing.
  2. Walk checklist sections 2 to 9 in order, against the app's own conventions first.
  3. Apply LT-3 to every new test.
  4. Skip what lint or the type checker already enforces.
Report format: about 400 words, each finding with axis, severity, file and line.
Rules:
  - Do not read the story or the ACs.
  - Do not edit code.
```

The orchestrator does not merge or rerank the two reports. The verdict counts the blockers from both, and it adjudicates every finding as described below. With no spec to check (a refactor ticket with no ACs), the Spec reviewer is skipped and the report says "no spec available". In SOLO mode the orchestrator runs the two passes one after the other, Spec first, each with its own findings table.

Reviewers are subagents, so neither axis waits for a person. Under `autonomous-delivery` the orchestrator adjudicates exactly as it does with a person present.

## Adjudication contract

The reviewer is an independent, adversarial agent: fresh context, no stake in the implementation. It proposes findings and does not apply fixes. The orchestrator then adjudicates each finding before anything loops back to Stage 2. This section governs that step.

### Severity scale

| Severity | Meaning |
| -------- | ------- |
| `BLOCKER` | Merge-stopping: failing AC, security hole, broken build, data-loss risk. |
| `MAJOR` | Should fix before merge: a real defect, or a DRY or standards violation with impact. |
| `MINOR` | Low impact. Fix it or file a follow-up. |
| `NIT` | Cosmetic or preference. Optional. |

Every finding carries `file:line` evidence. No evidence, no finding.

### Per-finding adjudication

The orchestrator verifies each finding against the actual diff and the ACs and records a verdict. Only `legitimate` findings become fixes (they loop back to Stage 2 through `fix-issues.md`). A `false-positive` is dismissed with a one-line reason, so a finding is never dropped silently or applied blindly.

| # | finding | axis | severity | verdict (`legitimate` \| `false-positive`) | reason | action |
| - | ------- | ---- | -------- | ------------------------------------------ | ------ | ------ |
| 1 | `path:line`, short description | spec\|standards | BLOCKER\|MAJOR\|MINOR\|NIT | legitimate | why the diff or AC confirms it | fix via `fix-issues.md` |
| 2 | `path:line`, short description | spec\|standards | BLOCKER\|MAJOR\|MINOR\|NIT | false-positive | why the diff or AC refutes it | dismissed (no change) |

Rules:

1. Only `legitimate` findings loop back to Stage 2. Applying a false positive is as much a defect as ignoring a real one.
2. Every `false-positive` needs an explicit one-line reason (for example "Postgres `search_path` is set per-session by the framework; not reachable from this diff").
3. Record the full per-finding verdict table in `.session/sprint-development/<KEY>/review.md` (session working state at `<<PRIMARY_ROOT>>`, beside `progress.md`; topic_key `pbi/{ticket}/review`).
4. In SOLO mode the orchestrator runs a deliberate fresh-eyes review pass inline, then adjudicates with the same table.
5. Architectural rework (rare) does not loop to Stage 2. It loops to Stage 1 with a new spec, plus an ADR when the decision passes the three-gate test in `agentic-dev-core/references/adr-doctrine.md` §1 (hard to reverse, surprising without context, a real trade-off).
