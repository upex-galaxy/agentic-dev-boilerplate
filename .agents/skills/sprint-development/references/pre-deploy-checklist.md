# Pre-deploy checklist (Stage 5 go/no-go)

Run this before deploying to production: before the promotion push or PR, or, with a null integration branch, before auto-merge is enabled on the feature PR into the production branch. With the rollback plan it is the promotion's evidence. Every box must be ticked, or the item named as skipped with its reason. One unticked box with no reason is a no-go.

## 1. Tests (dev scope)

- [ ] Unit tests pass (100%).
- [ ] Type-check passes (`{{stack.package_manager}} run {{stack.scripts.types}}`).
- [ ] Lint passes (`{{stack.package_manager}} run {{stack.scripts.lint}}`).
- [ ] The production build succeeds (`{{stack.package_manager}} run {{stack.scripts.build}}`).
- [ ] A null role in `stack.scripts` is named as a skipped check, not counted as passed.
- [ ] Dev smoke checks pass on staging (curl the health endpoint, verify the deployed version, basic UI load; this is not the QA test suite).

Full QA verification (E2E, exploratory, regression) is out of scope here.

## 2. Code quality

- [ ] Code review approved.
- [ ] No critical TODOs.
- [ ] Security scan clean.

## 3. Infrastructure

- [ ] Environment variables are configured in production.
- [ ] Secrets are configured correctly.
- [ ] Database changes are ready (when there are any): each applied and verified in the integration environment, present in `list_migrations` of the DB MCP, and with its plan to apply in production according to `{{stack.database.migrations_tool}}` (`agentic-dev-core/references/db-change-doctrine.md`).
- [ ] A recent production backup exists.

## 4. Monitoring

- [ ] Sentry or DataDog is configured.
- [ ] Alerts are configured.
- [ ] Dashboards are ready.

## 5. Stakeholders

- [ ] Where a QA workflow exists, QA's go/no-go on staging is green, read back from the tracker (QA validation is managed in QA's own flow).
- [ ] A final OK, such as the PM's, only when the project reserves one for a person (`.agents/skills/edd/references/human-gates.md`); otherwise the box is named as not applicable.
- [ ] DevOps is ready to monitor.

## With nobody at the keyboard

The checklist runs the same with nobody present: sections 1 to 4 are reads and local checks, and section 5 reads QA's verdict from the tracker. Only a final OK the project reserves waits for a person: it goes to whoever launched the session with the checklist result, and this promotion waits while other work continues.

## Output

Ready to deploy to production, or the list of unticked items with their reasons.
