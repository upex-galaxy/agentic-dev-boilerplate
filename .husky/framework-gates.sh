# shellcheck shell=sh
# Framework gates — SYNCED by the boilerplate updater (`husky` component).
#
# WHY THIS FILE EXISTS. `.husky/pre-commit`, `.husky/pre-push` and
# `.husky/commit-msg` are on the updater's PROTECTED_WATCHLIST: delivered once
# when missing, then never overwritten, because a project's own gates live in
# them. The consequence was that a gate added upstream never reached a project
# scaffolded earlier. This file carries the gates upstream owns and IS synced;
# each hook sources it and calls one function, keeping its own ordering and its
# own extra gates around that call.
#
# CONTRACT FOR A HOOK. Source this file, then call the function for the hook:
#
#   GATES="$(dirname -- "$0")/framework-gates.sh"
#   if [ -f "$GATES" ]; then . "$GATES"; framework_gates_pre_commit; fi
#
# The guard is not decoration: `.husky/_/h` runs the hook under `sh -e`, so a
# `.` on a file that is not there kills the hook outright. A rollback, a sparse
# checkout or a half-applied sync can leave the hooks present and this file
# absent, and a repo in that state must still be committable.
#
# CONTRACT FOR THIS FILE. Only gates every scaffolded project can run. No
# package.json script key that does not already exist in every project, no
# project-specific paths, POSIX sh only. Adding a gate here is how it reaches
# every downstream repo on the next sync.

# Gates that run on EVERY commit. Fast, full-repo, plus the freshness checks
# that only matter when the staged set touches what they guard.
framework_gates_pre_commit() {
  # Light-weight repo health checks on every commit (fast, cover full repo).
  bun run types:check
  bun run vars:check
  bun run skills:check

  # Deletions count: removing a SKILL.md stales the registry as surely as
  # editing one does.
  _fg_staged=$(git diff --cached --name-only --diff-filter=ACMRD)

  # skill-registry freshness gate — only runs when staged files affect it.
  if echo "$_fg_staged" | grep -qE '^(\.agents/skills/.+/SKILL\.md$|scripts/build-skill-registry\.ts$|\.agents/skills/REGISTRY\.md$)'; then
    bun run skills:registry:check || {
      echo ""
      echo "❌ .agents/skills/REGISTRY.md is stale. Fix:"
      echo "   bun run skills:registry && git add .agents/skills/REGISTRY.md"
      exit 1
    }
  fi

  # cross-harness compatibility gate — only runs when staged files affect it.
  # Covers the generated Claude skills alias, a harness command that shadows a
  # skill, the three hook adapters, MCP parity across the three host configs and the eslint block
  # wiring. Everything it guards is generated or mirrored, so a hand-edit is
  # invisible to every other check.
  if echo "$_fg_staged" | grep -qE '^(\.agents/hooks/|\.claude/commands/|\.opencode/commands/|\.opencode/plugins/|\.codex/|\.claude/settings\.json$|\.mcp\.json$|opencode\.jsonc$|eslint\.config(\.base)?\.js$|cli/lib/agent-compatibility.*\.ts$|scripts/agent-compatibility.*\.ts$|AGENTS\.md$|CLAUDE\.md$)'; then
    bun run agents:compat:check || {
      echo ""
      echo "❌ Cross-harness compatibility is out of contract. Fix:"
      echo "   bun run agents:compat   # repairs the Claude skills alias, moves a command that shadows a skill to .backups/"
      echo "   then stage the deletion of any command it moved"
      echo "   (an unwired eslint block is fixed by hand in eslint.config.js)"
      exit 1
    }
  fi
}

# Gates that run before a PUSH: ONLY the checks pre-commit does not already run
# per-commit.
#
# pre-commit covers (every commit): types:check, vars:check, skills:check
#   + conditional skills:registry:check (when staged files affect the registry)
#   + conditional agents:compat:check (when staged files affect the contract).
# pre-push adds the full-repo checks pre-commit skips for speed:
#   - format:check / lint:check  full repo (lint-staged only touches staged files at commit)
#   - vars:env:check             not run at commit time. Runs with
#                                VARS_ENV_CHECK_DRIFT=warn: the manifest/.env.example parity
#                                rules stay FATAL (they describe the repo), but the
#                                process-env-vs-.env drift rule only WARNS here, because it
#                                describes the developer's machine.
#   - skills:registry:check      unconditional safety net — a commit in the push range may
#                                have changed the registry without pre-commit catching it.
#   - agents:compat:check        unconditional safety net for the cross-harness contract:
#                                the generated `.claude/skills` alias, no harness command
#                                named like a skill, the three hook adapters, the
#                                CLAUDE.md shim, MCP parity across `.mcp.json` /
#                                `opencode.jsonc` / `.codex/config.toml`, and that
#                                eslint.config.js wires every block the synced base exports.
#
# NOT here, on purpose: `bun run git:policy verify`. This repo's doctrine keeps the
# declared-vs-host reconciliation agent-driven (git-flow-master Step 1b: once per
# session, at the first push / PR / merge intent). As a hook gate it would block every
# push of a freshly scaffolded project whose inherited `git_strategy.policy` has not yet
# been reconciled with its host, for a reason the push itself has nothing to do with.
#
# Commands are spelled out here rather than behind one aggregate npm script: every
# command below already exists in every scaffolded project, so this function cannot be
# broken by a package.json key that lands in a separate, partially-applied sync phase.
# The full suite (incl. types/vars/skills/docs) lives in `repo:check` for CI / manual runs.
framework_gates_pre_push() {
  bun run format:check \
    && bun run lint:check \
    && VARS_ENV_CHECK_DRIFT=warn bun run vars:env:check \
    && bun run skills:registry:check \
    && bun run agents:compat:check
}

# Gate that runs on the COMMIT MESSAGE (`.husky/commit-msg`, which passes the
# message file git hands it as $1). WARN-ONLY by contract: the forensic-trailer
# check (AGENTS.md Critical Rule #3, canon in git-flow-master §3.2) prints what
# is missing or forbidden and never blocks, so a human commit, a merge or an
# emergency fix always lands. The script ships in the `scripts` component, a
# separate sync phase from this file, so a project that has this function but
# not the script yet is skipped silently rather than broken.
framework_gates_commit_msg() {
  if [ -f scripts/check-commit-trailers.ts ]; then
    bun scripts/check-commit-trailers.ts "$1" || true
  fi
  return 0
}
