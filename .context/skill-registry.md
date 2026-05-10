# Skill Registry (auto-generated)

> Generated: `2026-05-10T03:56:44.256Z`
> Generator: `bun scripts/build-skill-registry.ts`
> Protocol: `.claude/skills/agentic-dev-core/references/skill-resolver.md`

This file is the per-session compact-rules cache for the Skill Resolver protocol.
The orchestrator copies one or more `## Skill: <slug>` blocks below into every subagent briefing under `## Project Standards (auto-resolved)`.
Subagents trust those compact rules and only read the full SKILL.md when explicitly instructed.

Skills indexed: 15

---
## Skill: acli

**Purpose**: Atlassian CLI (official `acli` binary, v1.3+) for Jira Cloud, Confluence Cloud, and org admin tasks from the terminal.

**Compact Rules**:
- **Silent pagination truncation.** `workitem search` without `--paginate` returns the first page only — no warning. Scripts that count or iterate keys read the wrong number of items.
- **Auth is per-product.** `acli jira auth login` does not authenticate `acli admin`, `acli confluence`, or `acli rovodev`. There is also a top-level `acli auth` for global OAuth (newer surface). Each scope has its own session.
- **The "work item" vs "issue" split.** The CLI renamed commands (`jira issue` → `jira workitem`) but the JSON response still has a top-level `issues[]` array and CSV inputs still use `issueType`/`parentIssueId` spellings. Mixing old and new terminology in the same script works, but confuses readers.
- **Unknown subcommands fail silently.** Typing `acli jira workflow --help` does NOT error — it falls back to `acli jira --help` with exit 0. So "no error" ≠ "command exists". Always verify by checking the help body actually changed.
- **Hard limits the docs do not advertise.** `acli` cannot list custom fields, edit custom-field values on existing items, manage workflows, manage issue types, or touch project versions/components. See `references/gotchas.md`.
- `acli` binary is not installed in the environment.
- `acli` auth fails and cannot be fixed in the current session.
- The operation is one of the documented `acli` blind spots: enumerate custom fields, edit custom-field values on existing work items, manage workflows / issue types / priorities / resolutions / project versions / components, upload attachments, add watchers, add an item to a sprint.
- Bulk operations (acli consumes far fewer tokens per call).
- Scripting / CI pipelines.
- Operations that return large result sets (MCP payloads inflate token usage).
- `-y, --yes` — skip the interactive confirmation prompt. Required in CI; if omitted the command hangs waiting on stdin. **Note:** this flag does NOT exist on `admin user delete` / `admin user cancel-delete` (use `--ignore-errors` there instead).
- `--ignore-errors` — do not abort the batch when a single item fails.
- default table (human-readable)
- `--json` (for `jq` / scripts)
- (truncated — read full SKILL.md for the rest)

**Read full SKILL.md when**: the compact rules above are insufficient (e.g. novel scenario, debugging, or the briefing tells you to load the full skill).

> Source: `.claude/skills/acli/SKILL.md` · phase: `implementation` · extraction strategy: B

---

## Skill: agentic-dev-core

**Purpose**: Foundation skill that (a) hosts shared references cited by all workflow skills (briefing template, dispatch patterns, orchestration doctr...

**Compact Rules**:
- **Passive — shared reference library.** Workflow skills (`sprint-dev`, `unit-testing`, `project-foundation`, `project-bootstrap`, `product-management`) cite files under `references/` instead of duplicating the same briefing template, dispatch patterns and orchestration doctrine inside every skill. Loading a workflow skill therefore implies loading the relevant `agentic-dev-core/references/*.md` on demand.
- **Active — bootstrap trigger.** When users adopt this boilerplate by downloading skills à la carte (e.g. cloning `.claude/skills/sprint-dev/` only), they end up missing the foundation files those skills depend on (`AGENTS.md`, `.agents/project.yaml`, `scripts/agents-*.ts`, etc.). Invoking `/agentic-dev-core` regenerates that foundation from the templates shipped under `templates/`.
- **`.agents/project.yaml`** — template variable source. Skills resolve `{{VAR}}` against this. Nothing depends on it yet at this point in the install, so write it first.
- **`.agents/jira-required.yaml`** — manifest of Jira custom fields AND `work_types:` (issue types + canonical statuses + canonical transitions) the methodology requires. Read by `scripts/check-jira-setup.ts`, `scripts/sync-jira-workflows.ts`, and `scripts/agents-lint.ts`.
- **`.agents/jira-fields.json`** — empty stub (`{}`). Real catalog is written later by `bun run jira:sync-fields`. Documented in `templates/jira-fields.json.template` so the file exists from minute zero.
- **`.agents/jira-workflows.json`** — empty shell with one entry per declared `work_type` (e.g. `{"story": {...}, "bug": {...}}` with `null`/`{}` placeholders). Real catalog is written later by `bun run jira:sync-workflows`. Documented in `templates/jira-workflows.json.template` so the file exists from minute zero.
- **`scripts/agents-setup.ts` + `scripts/agents-lint.ts` + `scripts/sync-jira-fields.ts` + `scripts/sync-jira-workflows.ts` + `scripts/check-jira-setup.ts`** — the five CLIs that operate on the four files above. Source files live as `templates/scripts/*.ts.template` (the `.template` suffix keeps them out of this repo's `tsconfig`/`eslint` scope, since they aren't live source code here); strip the `.template` suffix when writing to the destination `scripts/` directory. Order within this group does not matter.
- **`package.json`** (penultimate) — merged: declared `dependencies` and `scripts` from `templates/package.json.partial.json` are added to the existing `package.json` if one exists; otherwise the partial is the seed for a fresh `package.json`. **Mandatory step:** without this merge, none of the five scripts written in step 5 are invocable via `bun run …`.
- **`AGENTS.md`** + symlink **`CLAUDE.md → AGENTS.md`** (last). `AGENTS.md` cites every file written in steps 1-6, so it must be written after all of them. The `CLAUDE.md → AGENTS.md` symlink must be created after the real file exists.
- **`.context/testing-capabilities.json`** (post-bootstrap detection). After AGENTS.md / CLAUDE.md exist, run `bun scripts/detect-testing-capabilities.ts` to populate the testing-capabilities cache. The script inspects `package.json`, `tsconfig.json`, ESLint configs, plus the strict-TDD priority chain (`<!-- strict_tdd: ... -->` marker in CLAUDE.md → `testing.strict_tdd` in `.agents/project.yaml` → runner-based fallback) and writes `.context/testing-capabilities.json`. Downstream skills (`unit-testing`, `sprint-dev`) read this cache instead of re-detecting on every dispatch. Schema and detection algorithm: `references/testing-capabilities.md`.
- `bun run agents:setup` — fill `.agents/project.yaml` interactively.
- `bun run jira:sync-fields` — populate `.agents/jira-fields.json` from their Jira workspace.
- `bun run jira:sync-workflows` — populate `.agents/jira-workflows.json` from their Jira workspace (interactive on first run for canonical slugs that don't auto-resolve to a workflow's real status / transition names).
- `bun run jira:check` — validate that BOTH catalogs satisfy the manifest (custom fields + `work_types`).
- `bun run lint:agents` — confirm every project-variable and Jira reference (custom fields, work types, statuses, transitions) resolves.
- (truncated — read full SKILL.md for the rest)

**Read full SKILL.md when**: the compact rules above are insufficient (e.g. novel scenario, debugging, or the briefing tells you to load the full skill).

> Source: `.claude/skills/agentic-dev-core/SKILL.md` · phase: `bootstrap` · extraction strategy: B

---

## Skill: agentic-dev-onboard

**Purpose**: Walks new users through this repo's dev flow — Next.js + Supabase stack, Jira workflow (Ready For Dev → In Progress → In Review → Ready F...

**Compact Rules**:
- Use **Context7** for "how to use X" — official docs, current API
- Use **Tavily** for "how to solve X" — community fixes, troubleshooting
- [ ] Did you run `bun run setup`?
- [ ] Did you fill `.env` with your own credentials (`LOCAL_*`, `STAGING_*`, `ATLASSIAN_*`, `TAVILY_API_KEY`, `SUPABASE_*`)?
- [ ] Does `bun run lint:agents` exit clean (0 errors)?
- [ ] Do the gentle-ai skills appear in autocomplete (restart your agent if not)?
- [ ] Ready for your first ticket: `/sprint-dev <UPEX-XXX>`
- Implement features → use `/sprint-dev`
- Write unit tests → use `/unit-testing`
- Refine acceptance criteria → use `/product-management`
- Define a brand-new product → use `/project-foundation`
- Scaffold backend / frontend code → use `/project-bootstrap`

**Read full SKILL.md when**: the compact rules above are insufficient (e.g. novel scenario, debugging, or the briefing tells you to load the full skill).

> Source: `.claude/skills/agentic-dev-onboard/SKILL.md` · phase: `bootstrap` · extraction strategy: B

---

## Skill: frontend-design

**Purpose**: Create distinctive, production-grade frontend interfaces with high design quality.

**Compact Rules**:
- **Purpose**: What problem does this interface solve? Who uses it?
- **Tone**: Pick an extreme: brutally minimal, maximalist chaos, retro-futuristic, organic/natural, luxury/refined, playful/toy-like, editorial/magazine, brutalist/raw, art deco/geometric, soft/pastel, industrial/utilitarian, etc. There are so many flavors to choose from. Use these for inspiration but design one that is true to the aesthetic direction.
- **Constraints**: Technical requirements (framework, performance, accessibility).
- **Differentiation**: What makes this UNFORGETTABLE? What's the one thing someone will remember?
- Production-grade and functional
- Visually striking and memorable
- Cohesive with a clear aesthetic point-of-view
- Meticulously refined in every detail
- **Typography**: Choose fonts that are beautiful, unique, and interesting. Avoid generic fonts like Arial and Inter; opt instead for distinctive choices that elevate the frontend's aesthetics; unexpected, characterful font choices. Pair a distinctive display font with a refined body font.
- **Color & Theme**: Commit to a cohesive aesthetic. Use CSS variables for consistency. Dominant colors with sharp accents outperform timid, evenly-distributed palettes.
- **Motion**: Use animations for effects and micro-interactions. Prioritize CSS-only solutions for HTML. Use Motion library for React when available. Focus on high-impact moments: one well-orchestrated page load with staggered reveals (animation-delay) creates more delight than scattered micro-interactions. Use scroll-triggering and hover states that surprise.
- **Spatial Composition**: Unexpected layouts. Asymmetry. Overlap. Diagonal flow. Grid-breaking elements. Generous negative space OR controlled density.
- **Backgrounds & Visual Details**: Create atmosphere and depth rather than defaulting to solid colors. Add contextual effects and textures that match the overall aesthetic. Apply creative forms like gradient meshes, noise textures, geometric patterns, layered transparencies, dramatic shadows, decorative borders, custom cursors, and grain overlays.

**Read full SKILL.md when**: the compact rules above are insufficient (e.g. novel scenario, debugging, or the briefing tells you to load the full skill).

> Source: `.claude/skills/frontend-design/SKILL.md` · phase: `unknown` · extraction strategy: B

---

## Skill: git-flow-master

**Purpose**: End-to-end Git operator for any branching strategy.

**Compact Rules**:
- "I want to start work on UPEX-123" → branch creation
- "commit and push", "subir cambios", "push to main" → commit + push flow
- "abrí un PR contra staging" → PR creation
- "tengo conflictos al hacer pull" → conflict resolution
- "este PR va a quedar enorme" → chained-PR planning hand-off
- "qué estrategia de git usamos en este repo" → strategy detection / persistence
- "el push fue rechazado" → diagnostic + recovery flow
- Current branch.
- Dirty / clean working tree (staged / unstaged / untracked counts).
- Unpushed / unpulled commits (ahead / behind upstream).
- Upstream status (no upstream, up-to-date, diverged).
- Remote name(s) — most repos have one (`origin`); some have a fork + upstream.
- **Marker in `AGENTS.md`** — search for `<!-- git-flow-master:strategy:VALUE -->` where `VALUE` is one of the seven slugs. If found, use it. This is the persisted decision.
- **Single-branch heuristic** — `git branch -a` shows only `main` (or `master`) and no integration branch in the remote → `solo-main`.
- **Two-branch heuristic** — exactly `main` (or `master`) + one of `{staging, dev, develop, integration}` exists upstream → `main-integration` (record the integration branch name).
- (truncated — read full SKILL.md for the rest)

**Read full SKILL.md when**: the compact rules above are insufficient (e.g. novel scenario, debugging, or the briefing tells you to load the full skill).

> Source: `.claude/skills/git-flow-master/SKILL.md` · phase: `implementation` · extraction strategy: B

---

## Skill: next-best-practices

**Purpose**: Next.js best practices - file conventions, RSC boundaries, data patterns, async APIs, metadata, error handling, route handlers, image/fon...

**Compact Rules**:
- Project structure and special files
- Route segments (dynamic, catch-all, groups)
- Parallel and intercepting routes
- Middleware rename in v16 (middleware → proxy)
- Async client component detection (invalid)
- Non-serializable props detection
- Server Action exceptions
- Async `params` and `searchParams`
- Async `cookies()` and `headers()`
- Migration codemod
- Default to Node.js runtime
- When Edge runtime is appropriate
- `'use client'`, `'use server'` (React)
- `'use cache'` (Next.js)
- Navigation hooks: `useRouter`, `usePathname`, `useSearchParams`, `useParams`
- (truncated — read full SKILL.md for the rest)

**Read full SKILL.md when**: the compact rules above are insufficient (e.g. novel scenario, debugging, or the briefing tells you to load the full skill).

> Source: `.claude/skills/next-best-practices/SKILL.md` · phase: `unknown` · extraction strategy: B

---

## Skill: next-cache-components

**Purpose**: Next.js 16 Cache Components - PPR, use cache directive, cacheLife, cacheTag, updateTag

**Compact Rules**:
- **Build ID** - invalidates all caches on deploy
- **Function ID** - hash of function location
- **Serializable arguments** - props become part of key
- **Closure variables** - outer scope values included
- **No manual cache keys** - `use cache` generates keys automatically from function arguments and closures. The `keyParts` array from `unstable_cache` is no longer needed.
- **Tags** - Replace `options.tags` with `cacheTag()` calls inside the function.
- **Revalidation** - Replace `options.revalidate` with `cacheLife({ revalidate: N })` or a built-in profile like `cacheLife('minutes')`.
- **Dynamic data** - `unstable_cache` did not support `cookies()` or `headers()` inside the callback. The same restriction applies to `use cache`, but you can use `'use cache: private'` if needed.
- **Edge runtime not supported** - requires Node.js
- **Static export not supported** - needs server
- **Non-deterministic values** (`Math.random()`, `Date.now()`) execute once at build time inside `use cache`
- [Cache Components Guide](https://nextjs.org/docs/app/getting-started/cache-components)
- [use cache Directive](https://nextjs.org/docs/app/api-reference/directives/use-cache)
- [unstable_cache (legacy)](https://nextjs.org/docs/app/api-reference/functions/unstable_cache)

**Read full SKILL.md when**: the compact rules above are insufficient (e.g. novel scenario, debugging, or the briefing tells you to load the full skill).

> Source: `.claude/skills/next-cache-components/SKILL.md` · phase: `unknown` · extraction strategy: B

---

## Skill: next-upgrade

**Purpose**: Upgrade Next.js to the latest version following official migration guides and codemods

**Compact Rules**:
- **Detect current version**: Read `package.json` to identify the current Next.js version and related dependencies (React, React DOM, etc.)
- **Fetch the latest upgrade guide**: Use WebFetch to get the official upgrade documentation:
- Codemods: https://nextjs.org/docs/app/guides/upgrading/codemods
- Version-specific guides (adjust version as needed):
- https://nextjs.org/docs/app/guides/upgrading/version-16
- https://nextjs.org/docs/app/guides/upgrading/version-15
- https://nextjs.org/docs/app/guides/upgrading/version-14
- **Determine upgrade path**: Based on current version, identify which migration steps apply. For major version jumps, upgrade incrementally (e.g., 13 → 14 → 15).
- **Run codemods first**: Next.js provides codemods to automate breaking changes:
- `next-async-request-api` - Updates async Request APIs (v15)
- `next-request-geo-ip` - Migrates geo/ip properties (v15)
- `next-dynamic-access-named-export` - Transforms dynamic imports (v15)
- **Update dependencies**: Upgrade Next.js and peer dependencies together:
- **Review breaking changes**: Check the upgrade guide for manual changes needed:
- API changes (e.g., async params in v15)
- (truncated — read full SKILL.md for the rest)

**Read full SKILL.md when**: the compact rules above are insufficient (e.g. novel scenario, debugging, or the briefing tells you to load the full skill).

> Source: `.claude/skills/next-upgrade/SKILL.md` · phase: `unknown` · extraction strategy: B

---

## Skill: playwright-cli

**Purpose**: Automates browser interactions for web testing, form filling, screenshots, and data extraction.

**Compact Rules**:
- **Request mocking** [references/request-mocking.md](references/request-mocking.md)
- **Running Playwright code** [references/running-code.md](references/running-code.md)
- **Browser session management** [references/session-management.md](references/session-management.md)
- **Storage state (cookies, localStorage)** [references/storage-state.md](references/storage-state.md)
- **Test generation** [references/test-generation.md](references/test-generation.md)
- **Tracing** [references/tracing.md](references/tracing.md)
- **Video recording** [references/video-recording.md](references/video-recording.md)

**Read full SKILL.md when**: the compact rules above are insufficient (e.g. novel scenario, debugging, or the briefing tells you to load the full skill).

> Source: `.claude/skills/playwright-cli/SKILL.md` · phase: `unknown` · extraction strategy: B

---

## Skill: product-management

**Purpose**: Orchestrates continuous product management work — initial backlog seed from PRD, incremental feature addition, epic creation, story refin...

**Compact Rules**:
- A new feature or epic needs to be added to the backlog
- A story has rough or ambiguous acceptance criteria that need sharpening
- A story needs INVEST validation or a 3-amigos session before development starts
- You're systematically enumerating edge cases / failure modes for a feature
- You're seeding the very first product backlog from a freshly minted PRD
- `/project-foundation` should have produced `.context/PRD/` and `.context/SRS/` (required for the initial backlog-seed workflow; useful context for all others)
- `.agents/project.yaml` populated with `{{PROJECT_KEY}}`, `{{ISSUE_TRACKER}}`, `{{JIRA_URL}}` — run `/agentic-dev-core` if missing
- Atlassian / Jira tooling reachable (Atlassian CLI `acli` preferred, MCP Atlassian as fallback) for any workflow that writes to Jira
- **Source-of-truth specs** at `.context/PBI/specs/{capability}/{feature}.md` (canonical, always-current behavior — RFC 2119 + Gherkin)
- **Delta specs** per change at `.context/PBI/{ticket}/spec.md` with explicit `## ADDED Requirements`, `## MODIFIED Requirements`, and `## REMOVED Requirements` sections
- **Archive process** that merges deltas back into the source-of-truth on story close and moves the change folder under `.context/PBI/archive/YYYY-MM-DD-{ticket}/`
- **Per-story implementation** → `/sprint-dev` (planning → code → review → deploy loop)
- **TDD on a single function** → `/unit-testing` (composable inside `/sprint-dev`)
- **Formal QA test cases, exploratory testing, automation, regression** → out of scope here; see the sister boilerplate `agentic-qa-boilerplate` for `sprint-testing`, `test-documentation`, `test-automation`, and related QA workflows
- `{{PROJECT_KEY}}` — Jira project key (e.g., `MYM`, `UPEX`)
- (truncated — read full SKILL.md for the rest)

**Read full SKILL.md when**: the compact rules above are insufficient (e.g. novel scenario, debugging, or the briefing tells you to load the full skill).

> Source: `.claude/skills/product-management/SKILL.md` · phase: `management` · extraction strategy: B

---

## Skill: project-bootstrap

**Purpose**: Scaffolds the technical infrastructure of a new project: backend (DB schemas, API base, types, error handling), frontend (design system,...

**Compact Rules**:
- `agentic-dev-core/references/briefing-template.md` — used when dispatching parallel scaffolding subagents (e.g. backend + frontend in parallel).
- `agentic-dev-core/references/dispatch-patterns.md` — picks Single / Sequential / Parallel for each phase below.
- A fresh repo has its product foundation (`/project-foundation` already ran) but no code yet.
- An existing repo needs an incremental infrastructure feature added (e.g. "add OpenAPI to the API", "add bearer auth", "wire Supabase types into the frontend").
- Define the product (PRD, user journeys, architecture decisions) — that's `/project-foundation`.
- Seed the Jira backlog with epics + user stories — that's `/product-management`.
- Implement an individual user story (planning → code → review → deploy) — that's `/sprint-dev`.
- Set up a unit-test framework — that's `/unit-testing` (and is its own concern).
- **OpenAPI integration** → `references/openapi-setup.md`. Schema generation, Swagger / Scalar UI, contract publication.
- **API routes + middleware** → `references/api-routes-setup.md`. Route conventions, error responses, request logging, auth middleware wiring.
- **Bearer-token auth** → `references/bearer-token-support.md`. JWT issuance, refresh tokens, protected-route middleware, session handling.
- **Env vars + URL builders** → `references/env-url-setup.md`. Typed `.env` schema, environment-aware URL helpers, validation at boot.
- **Supabase types generation** → `references/supabase-types-setup.md`. DB schema → TypeScript types pipeline, regeneration script, frontend wiring.
- After base backend exists → `openapi-setup`, `api-routes-setup`, `bearer-token-support`, `env-url-setup` can each run in their own subagent.
- After base frontend exists → `supabase-types-setup` wires backend types into the frontend.
- (truncated — read full SKILL.md for the rest)

**Read full SKILL.md when**: the compact rules above are insufficient (e.g. novel scenario, debugging, or the briefing tells you to load the full skill).

> Source: `.claude/skills/project-bootstrap/SKILL.md` · phase: `foundation` · extraction strategy: B

---

## Skill: project-foundation

**Purpose**: Orchestrates the foundational definition of a new product/project: Constitution (business model + market context), Architecture (PRD + SR...

**Compact Rules**:
- `agentic-dev-core/references/briefing-template.md` — used when dispatching subagents to research market data, audit competitors, or interview users.
- `agentic-dev-core/references/dispatch-patterns.md` — picks Single / Sequential / Parallel for each phase below.
- A new product/project is being defined from scratch and you need Constitution + PRD + SRS + Discovery artifacts.
- An existing project needs to redefine scope significantly (e.g. pivot, new MVP cut) and the foundation docs must be regenerated.
- A specific section is missing or stale (e.g. user journeys haven't been written yet) — invoke just that phase via the Specific tasks table below.
- Scaffold the codebase (backend / frontend / OpenAPI / auth) — that's `/project-bootstrap`.
- Seed the Jira backlog with epics + stories — that's `/product-management`.
- Plan or implement an individual user story — that's `/sprint-dev`.
- Set up unit tests — that's `/unit-testing`.
- Run QA workflows (test plans, exploratory testing, automation) — out of scope, see the sister `agentic-qa-boilerplate`.
- Read `references/constitution-business-model.md` for the canvas template (problem, solution, value prop, customer segments, channels, revenue model, cost structure, key metrics).
- Read `references/constitution-market-context.md` for industry positioning, competitive analysis, and trends.
- Read `references/prd-executive-summary.md` for problem statement, solution overview, success KPIs, MVP success metrics.
- Read `references/prd-personas.md` for target users, demographics, jobs-to-be-done, pain points.
- Read `references/prd-mvp-scope.md` for epic breakdown, must-have / should-have / could-have user stories, MVP cut.
- (truncated — read full SKILL.md for the rest)

**Read full SKILL.md when**: the compact rules above are insufficient (e.g. novel scenario, debugging, or the briefing tells you to load the full skill).

> Source: `.claude/skills/project-foundation/SKILL.md` · phase: `foundation` · extraction strategy: B

---

## Skill: resend-cli

**Purpose**: Operate the Resend platform from the terminal — send emails (including React Email .tsx templates via --react-email), manage domains, con...

**Compact Rules**:
- Supply ALL required flags. The CLI will NOT prompt when stdin is not a TTY.
- Pass `--quiet` (or `-q`) to suppress spinners and status messages.
- Exit `0` = success, `1` = error.
- Error JSON goes to stderr, success JSON goes to stdout:
- Use `--api-key` or `RESEND_API_KEY` env var. Never rely on interactive login.
- All `delete`/`rm` commands require `--yes` in non-interactive mode.
- **Sending or reading emails** → [references/emails.md](references/emails.md)
- **Setting up or verifying a domain** → [references/domains.md](references/domains.md)
- **Managing API keys** → [references/api-keys.md](references/api-keys.md)
- **Creating or sending broadcasts** → [references/broadcasts.md](references/broadcasts.md)
- **Managing contacts, segments, or topics** → [references/contacts.md](references/contacts.md), [references/segments.md](references/segments.md), [references/topics.md](references/topics.md)
- **Defining contact properties** → [references/contact-properties.md](references/contact-properties.md)
- **Working with templates** → [references/templates.md](references/templates.md)
- **Viewing API request logs** → [references/logs.md](references/logs.md)
- **Creating automations or sending events** → [references/automations.md](references/automations.md)
- (truncated — read full SKILL.md for the rest)

**Read full SKILL.md when**: the compact rules above are insufficient (e.g. novel scenario, debugging, or the briefing tells you to load the full skill).

> Source: `.claude/skills/resend-cli/SKILL.md` · phase: `unknown` · extraction strategy: B

---

## Skill: sprint-dev

**Purpose**: Orchestrates the per-story dev loop end-to-end: Planning -> Implementation -> Code Review -> Staging deploy -> (gated) Production deploy.

**Compact Rules**:
- **New user story** (most common) -> Stage 1 (story-plan) -> Stage 2 (implement-story) -> ... -> Stage 4
- **New feature with multiple stories** -> Stage 1 macro (feature-plan) -> loop Stage 1+2 per story -> Stage 4 per merge
- **Bug fix** -> skip to Stage 2 with `bug-fix-workflow.md` (root cause first), then Stage 3+4
- **Resume from interruption** -> Stage 2 entry via `continue-implementation.md`
- **PR feedback / code review iteration** -> Stage 3 with `fix-issues.md`, fix-and-iterate loop
- **Production deploy** (separate event) -> Stage 5, only after QA green + business approval
- `.agents/project.yaml` populated. If missing, run `/agentic-dev-core` first.
- Story exists in the issue tracker with refined Acceptance Criteria. If backlog is empty or AC are unclear, run `/product-management` first.
- Branch policy clear and CI configured. First-time-only setup lives in `references/setup-linting.md` and `references/ci-cd-setup.md`.
- Working directory is the **target project repo**. Sprint-dev runs there, not in the boilerplate.
- `.env` populated with environment URLs and credentials. Never hardcode credentials.
- `references/feature-plan.md` — macro plan (epic-level, multiple stories)
- `references/story-plan.md` — micro plan (single story, recommended starting point)
- `references/spec-driven-development.md` — TDD-friendly philosophy: AC -> spec -> code
- **New story** -> `references/implement-story.md` (main flow). Walk the impl plan step-by-step.
- (truncated — read full SKILL.md for the rest)

**Read full SKILL.md when**: the compact rules above are insufficient (e.g. novel scenario, debugging, or the briefing tells you to load the full skill).

> Source: `.claude/skills/sprint-dev/SKILL.md` · phase: `implementation` · extraction strategy: B

---

## Skill: unit-testing

**Purpose**: Focused skill for unit-test design — TDD workflow (red-green-refactor), test naming (AAA, Given-When-Then), mocking patterns (mocks/spies...

**Compact Rules**:
- "Write unit tests for this function/class"
- "TDD this slice" / "red-green-refactor"
- "What should I mock here?"
- "How do I name this test?"
- "What's the right coverage target for this module?"
- Mid-flight from `/sprint-dev` Stage 2 (Implementation) when implementing TDD-friendly code (pure functions, complex branching, bug fix reproducers)
- Project has a unit test runner configured (Jest, Vitest, Mocha, or similar)
- Test command exists in `package.json` (`bun test`, `npm test`, `vitest`, etc.)
- For TDD: test runner supports watch mode (`--watch`)
- If no runner is configured, the first task is to set one up — see `references/unit-testing.md` § Setup
- Identify the unit (function, class, module) — confirm with the user if ambiguous
- Decide TDD or after-the-fact (see `references/tdd-workflow.md`)
- Write tests using the project's naming convention (see `references/test-naming.md`)
- Mock external deps cleanly (see `references/mocking-patterns.md`)
- Run tests, confirm green
- (truncated — read full SKILL.md for the rest)

**Read full SKILL.md when**: the compact rules above are insufficient (e.g. novel scenario, debugging, or the briefing tells you to load the full skill).

> Source: `.claude/skills/unit-testing/SKILL.md` · phase: `implementation` · extraction strategy: B
