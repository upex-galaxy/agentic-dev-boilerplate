# Staging deploy (Stage 4)

> **Tracker note.** Written for the `jira` tracker and applied as written when `issue_tracker` resolves to `jira`. On `github` or `none`, its Jira steps (fields, `jira:sync-issues`, the PBI tree, the ATP, transitions, comments) are replaced by `SKILL.md` `## Tracker modes` and `## The trail`.

Gets a reviewed feature onto the staging environment so QA can pick it up: automatically through CI/CD, or by hand when CI is not set up. Run it after `ci-cd-setup.md` (GitHub Actions configured), `environment-config.md` (variables set) and Stage 3 (code review).

> **Integration branch**: its real name is `git_strategy.branches.integration` in `.agents/project.yaml`. This document says `staging` for the conventional name. Read the value before running any git command below, and never write the literal `staging` or `develop` in a command. When it is `null` (`solo-main`, `github-flow`, `trunk-based`) there is no integration branch: there is no merge to staging, Stage 4 verifies the Vercel Preview deployment of the PR branch, and the merge to `git_strategy.branches.production` is Stage 5.
>
> **Stack**: the app's commands are its own scripts (`{{stack.package_manager}} run {{stack.scripts.<role>}}` from `{{stack.app_root}}`; a null role is skipped and reported). CI is whatever the app already runs (`{{stack.ci}}`, any workflow under `.github/workflows/`) and hosting is `{{stack.hosting}}`. With a host other than `vercel`, replace the Vercel steps below with that host's equivalent check. If the host exposes none, report the deploy as unverified (Critical Rule #16). See `../SKILL.md`, `## Stack parameters`.

## Required skills

Load before Step 1: `/deploy-to-vercel` (deploy method, category `deploy`) next to T1 `/vercel-cli` (deployment verification by commit SHA, env sync, logs, rollback). When the story sends or templates email, also load `/resend-cli` (category `email`) before checking the sender and the templates on the target environment. Not installed: say so once, point at `bun setup` or the single `bunx skills add` line from `PROJECT_LEVEL_SKILLS` in `cli/install.ts`, then continue (`agentic-dev-core/references/skill-composition-strategy.md` §3.5).

## What to read first

1. The PR state: approved in code review (Stage 3), unit tests passing locally, local build green, feature branch ready to merge.
2. The app's CI workflows (`.github/workflows/*.yml`, any name; critical) to see what runs on each push or PR and what triggers the deploy, and `.context/ci-cd-setup.md`. Is GitHub Actions configured, does the automatic staging deploy work, and which branch triggers it?

Tools: git, access to the GitHub repo, access to the Vercel or Railway dashboard. No MCP is needed.

## What is in and out

In scope: merge the feature branch to the integration branch, let GitHub Actions run lint, test, build and deploy, let Vercel or Railway publish, get the staging URL, run a smoke test.

Out of scope: production (Stage 5), full exploratory testing and integration or E2E tests (QA's, outside this skill).

Result: the feature is deployed on staging, the URL is shared with QA, and the smoke test passed with no 500 errors and with assets loading.

## Rules

- The PR must be approved and CI green before a deploy. Merge through the pull request and let GitHub Actions do the deploy, never around the CI.
- No force push (`git push -f`).
- No production deploy in this stage.
- Validate locally first (lint, test, build), then validate the deployment with a smoke test, and share the staging URL with QA.

## Step 1: pre-deploy validation

Check the local state:

```bash
git branch
git status
git pull origin [feature-branch]
```

Validate locally, from `{{stack.app_root}}` (a null role is skipped and reported):

```bash
{{stack.package_manager}} run {{stack.scripts.lint}}
{{stack.package_manager}} run {{stack.scripts.test}}
{{stack.package_manager}} run {{stack.scripts.build}}
```

All three pass, with no critical warnings.

Then pick the path from the CI workflows you read. Do not ask the user what the workflows already answer: CI configured goes to Step 2 (automatic), CI not configured goes to Step 3 (manual deploy from the Vercel or Railway CLI).

## Step 2: automatic deploy through GitHub Actions

### 2.1 Merge the pull request

On GitHub, open the PR (`https://github.com/[org]/[repo]/pull/[number]`) and check that code review is approved, CI checks are green and there are no conflicts. Click "Merge pull request", with "Squash and merge" or "Merge commit" according to the strategy, and confirm.

Through the CLI instead:

```bash
# <integration> = git_strategy.branches.integration (.agents/project.yaml)
git checkout <integration>

# Pull latest
git pull origin <integration>

# Merge feature branch
git merge [feature-branch]

# Push to trigger CI/CD. Direct push to a protected branch:
# resolved by git_strategy.policy.direct_push_to_protected (/git-flow-master §3.3)
git push origin <integration>
```

Merge to the integration branch with the method `git_strategy.decisions.feature_merge` names, as `../SKILL.md` Stage 4 says. Do not push straight to the integration branch unless `git_strategy.policy.direct_push_to_protected` allows it.

### 2.2 Monitor GitHub Actions

Open `https://github.com/[org]/[repo]/actions`, find the new "CI/CD Pipeline" run and read each job: Lint, Test and Build must pass, and Deploy Staging must run. It takes about 3 to 7 minutes. Do not assume it passed. Read the full logs and confirm the deploy job ran.

When a job fails:

- Lint: run `{{stack.package_manager}} run {{stack.scripts.lint}}` locally and fix (with the app's fixer if it has one, for example a `lint:fix` script), commit, push, and CI runs again.
- Test: investigate the failing test, fix the code or the test, push.
- Build: run `{{stack.package_manager}} run {{stack.scripts.build}}` locally, read the compile errors, fix, push.
- Deploy: check the environment variables in Vercel, read the logs in the Vercel dashboard, fix the configuration.

### 2.3 Get the staging URL

When Actions completes, open `https://vercel.com/[org]/[project]`. Under "Deployments", find the latest deployment of the integration branch and copy its URL: `https://[project]-staging-[hash].vercel.app`, or the stable `https://[project]-staging.vercel.app`. Report it:

```markdown
## Deployment succeeded

Staging URL: https://[project]-staging.vercel.app

- Branch: <integration>
- Commit: [short hash]
- Status: Ready
- Duration: [X] minutes
```

## Step 3: manual deploy (fallback when CI/CD is not ready)

With the Vercel CLI:

```bash
bun add -g vercel
vercel login
# From the project root. Without --prod: this is a Preview deployment, the
# staging surface. --prod deploys to Production, and that is Stage 5.
vercel
# Select the right project; Vercel deploys and prints the URL
```

With Railway as the alternative:

```bash
bun add -g @railway/cli
railway login
railway up
```

## Step 4: smoke test after the deploy

Open the staging URL and check the basics. This is not QA's test pass.

```markdown
## Smoke test - Staging

URL: https://[project]-staging.vercel.app

1. The application loads:
   - [ ] The landing page loads with no 500 errors
   - [ ] No errors in the browser console (F12)
   - [ ] Assets (CSS, JS, images) load
2. Auth flow (if it applies):
   - [ ] The signup and login pages are reachable (full functionality is QA's)
3. Basic navigation:
   - [ ] The main links work
   - [ ] Routing works (no 404 on valid routes)
4. Database connection:
   - [ ] Pages that use the database show no errors
   - [ ] Data appears (even if empty)

Result: Pass means the app works at a basic level and is ready for QA. Fail means read the logs, fix and deploy again.
```

When something fails, read the logs. On Vercel, open `https://vercel.com/[org]/[project]/[deployment-id]/logs` and look for the red lines. On Railway, run `railway logs`. Common post-deploy errors:

| Error | Fix |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL is not defined` | Configure the environment variables in Vercel (`environment-config.md`) |
| 500 Internal Server Error | Read the Vercel or Railway logs. Likely a database connection issue, so check the variables |
| Assets 404 | Check `next.config.js`. The `basePath` may be wrong |
| Auth not working | Check that the Supabase redirect URLs include the staging URL |

## Step 5: report and hand off to QA

Report to the user:

```markdown
# Deploy to staging completed

Staging URL: https://[project]-staging.vercel.app
Status: Ready

Validation: smoke test passed, the application loads, no critical errors, the database connection works.

Deployment summary:

- Branch: `<integration>`
- Commit: [hash]
- Duration: [X] minutes
- CI/CD: [automatic / manual]

The feature is deployed on staging, ready for QA and exploratory testing. Share the staging URL with QA and tell them which version is deployed.
```

QA verification on staging is out of scope here.

**Assignee.** When the story reaches `{{jira.status.story.ready_for_qa}}` (read the status back, do not trust that the automation fired), move the native `assignee` to the QA in `{{jira.qa_assignee}}`, the record of the QA who followed the story since shift-left. Read that field, never overwrite it. If `qa_assignee` is empty, leave `assignee` as it is and say so in the QA notification comment. Read `assignee` back to verify. The full rule is in `../SKILL.md` Stage 4.

**Development Token Usage (optional, cumulative audit aid).** Tied to the verified `ready_for_qa` state, not to the `deployed` automation having run. Write it on reaching Ready For QA and again after each fix loop:

1. Read the current value of `{{jira.development_token_usage}}`.
2. Add the tokens measured in this cycle, taken from the `progress.md` entries (each session appends its measured figure). K means input plus output tokens, and cache reads are reported separately.
3. Write current value plus the delta, never overwrite. When the current value is empty, write only the delta.
4. Post a short comment `DTU cycle N: +x K (total y K) source=<harness or human>`. If the field is missing from `.agents/jira-fields.json`, the comment carries the figure.

When the harness shows no tokens and nobody enters them, leave the field empty and the verifier says N/A with that reason: empty is valid and never a failure. Never estimate or invent the number. An item that never reaches Ready For QA (a tech item that goes straight to `completed`) says N/A with that reason.

## With nobody at the keyboard

Follow `agentic-dev-core/references/decision-protocol.md` §5.2. The reads and local checks (Step 1) are reversible and run in every mode. The outward actions are the merge or push of Step 2.1, the manual deploy of Step 3 and the tracker writes of Step 5 (assignee, DTU comment, the QA notification). A person present asks the questions as written. A supervised worker stops at an open PR and leaves the merge to its launcher. A routine does these only when the delegating brief names them. Without that, it stops after Step 1, reports what is ready and which actions are pending, and does not wait.

## Done when

- Pre-deploy: PR approved, local tests and build green, CI path checked.
- Deploy: the feature is merged (or deployed manually), GitHub Actions ran or the manual deploy completed, and the staging URL is known.
- Post-deploy: the smoke test ran, the app loads without 500s, the console has no critical errors, and the database connection is validated.
- Communication: the URL is shared with QA, `assignee` is moved to the QA in `{{jira.qa_assignee}}` and read back (or left as is with the reason in the QA comment), and the DTU cycle comment is posted with the cumulative field updated (or N/A with the reason).

## References

- Vercel deployments: https://vercel.com/docs/deployments/overview
- Railway deployments: https://docs.railway.app/deploy/deployments
- Monitoring GitHub Actions: https://docs.github.com/en/actions/monitoring-and-troubleshooting-workflows
