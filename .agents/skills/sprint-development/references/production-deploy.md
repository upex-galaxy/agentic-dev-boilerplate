# Production deploy (Stage 5)

Promotes the integration branch to production, gradually behind feature flags when possible. Run `pre-deploy-checklist.md` first, and keep `rollback-plan.md` at hand: the two are the promotion's evidence. It never chains automatically from Stage 4, and the promotion is delivered on evidence like any other change, through the git policy (`../SKILL.md` Stage 5).

## Required skills

Load before the promotion: `/deploy-to-vercel` (deploy method, category `deploy`) next to T1 `/vercel-cli` (deployment verification by commit SHA, env sync, logs, rollback). When the story sends or templates email, also load `/resend-cli` (category `email`) before checking the sender and the templates on the target environment. Not installed: say so once, point at `bun setup` or the single `bunx skills add` line from `PROJECT_LEVEL_SKILLS` in `cli/install.ts`, then continue (`agentic-dev-core/references/skill-composition-strategy.md` §3.5).

## Process (automatic, Vercel or Railway)

```bash
# 1. Promote to production
# <production>  = git_strategy.branches.production  (.agents/project.yaml)
# <integration> = git_strategy.branches.integration (null in solo-main,
#   github-flow, trunk-based: there Stage 5 is the story's PR into <production>, which
#   merges by git_strategy.policy.merge_mode once this checklist and its evidence pass)
# Promotion method: git_strategy.decisions.promote_method, via /git-flow-master.
git checkout <production>
git pull origin <production>
git merge --ff-only <integration>   # or the method promote_method names
# Direct push to a protected branch: resolved by git_strategy.policy.direct_push_to_protected
#   (evidence: the pre-push gate `bun run edd gate` decides; forbidden: open the promotion PR,
#   which merges by git_strategy.policy.merge_mode)
git push origin <production>

# 2. Vercel deploys to production automatically
# Watch it in the dashboard
```

## After the deploy

1. Run the automatic smoke tests (Stage 5, post-deploy).
2. Monitor actively for the first 2 to 4 hours.
3. Validate the business metrics.

## With nobody at the keyboard

The promotion runs the same with or without a person: the git policy decides the push or the merge, and the pre-push gate or `edd/evidence` decides whether it lands. It stops for a person only on an item of the closed list in `.agents/skills/edd/references/human-gates.md`, the one `../SKILL.md` `#### Evidence and attest` repeats (for a promotion, typically a final OK the project reserves, the approval under `human-approves` or the merge under `manual`, or a shared-infrastructure migration under `autonomous_delivery.migrations: confirm`). Such an item goes to whoever launched the session, with the commits that would ship; this promotion waits and other work continues.

## Output

- The production URL is up.
- Smoke tests pass.
- Monitoring is active.
