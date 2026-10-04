---
id: project
title: "Project instructions"
load_when: "anything specific to this project: its own rules, conventions, exceptions and its reading of shared doctrine"
triggers: []
paths: []
---

# Project instructions

> Section `project` of the project instructions: the PROJECT-OWNED overlay. Every other file in `.agents/instructions/` is shared doctrine; this one holds what is true only for this repository. A rule here may narrow a shared rule for this project and must say which one; it never silently contradicts a Critical Rule.

## Git Strategy (this repository)

This repository (the boilerplate itself) runs `git_strategy.strategy: solo-main` with `meta.strategy_source: chosen` (the dates are the block's own `meta:` stamps): single maintainer, commit + push directly to `main` under standing authorization — see the block's `description` in `.agents/project.yaml`.

**Accepted policy divergence (this repo only)**: a GitHub **ruleset** on `main` requires a reviewed pull request (the count is `policy.require_pr_reviews`, reconciled by `bun run git:policy verify`; the classic `branches/main/protection` endpoint returns `404`, so only the `rules/branches/main` endpoint reveals it; the dated reading is in `.context/ADR/ADR-0003-forensic-measurements-ledger.md`), while `policy.direct_push_to_protected: allowed` describes how work actually lands: the maintainer's admin credential is on the ruleset's bypass list and pushes `main` directly — every push here is a release of the template, so PR ceremony would protect nothing. **Both sides are correct on purpose**: the divergence is formally recorded in `policy.accepted_divergences` (`main.direct_push_to_protected`, with its acceptance date) and stamped `meta.policy_source: accepted` with the `meta.policy_verified` date of the last reconciliation, and `bun run git:policy verify` treats a listed divergence as ACCEPTED, not drift.

This exception belongs to THIS repository and travels nowhere: this file is project-owned (a downstream project gets its own stub, never this text), and the scaffolder resets every provenance stamp in a fresh project (`.agents/instructions/agent-git.md`). **A project scaffolded from this boilerplate defines its own answer during setup**, no approvals, one, two, protections or none: and `git-flow-master` reports what THAT host enforces. Never carry this repo's exception into a downstream project, and never infer a bypass is acceptable from the fact that a push succeeded.
