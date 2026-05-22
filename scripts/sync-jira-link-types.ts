#!/usr/bin/env bun
/**
 * jira:sync-link-types — sync the Jira workspace's issue-link-type catalog
 * into `.agents/jira-link-types.json` so methodology slugs declared under
 * `link_types:` in `.agents/jira-required.yaml` resolve at lint time.
 *
 * STATUS — STUBBED (May 2026).
 * Full implementation deferred to a follow-up PR. See
 * `.scratch/plans/2026-05-22-product-management-refactor-plan.md` §6.2 and §14
 * for the contract this script will fulfill once implemented.
 *
 * Contract (target shape):
 *   1. Authenticate via env vars: ATLASSIAN_URL, ATLASSIAN_EMAIL, ATLASSIAN_API_TOKEN.
 *   2. Fetch workspace link types from `GET /rest/api/3/issueLinkType` (or via
 *      [ISSUE_TRACKER_TOOL] equivalent). Map workspace names → declared slugs.
 *   3. Write `.agents/jira-link-types.json` with shape:
 *        { "<slug>": { "id": "10010", "name": "Dependencies",
 *                      "outward": "depends on", "inward": "is dependency for",
 *                      "exists_in_workspace": true } }
 *   4. Slugs declared in `.agents/jira-required.yaml` but missing in the
 *      workspace get `exists_in_workspace: false`. `bun run jira:check`
 *      degrades to the declared `fallback` slug when the canonical is absent.
 *   5. Manual invocation only. Not auto-invoked by `bun run setup` or
 *      `bun run jira:check` (per locked decision §0 of the refactor plan).
 */
console.warn(
  '[jira:sync-link-types] Not yet implemented.\n'
  + '  Tracking: follow-up PR after the product-management skill refactor.\n'
  + '  Until then: declare workspace link types manually in `.agents/jira-link-types.json`,\n'
  + '             OR skip the link_types validation in `bun run jira:check`\n'
  + '             (it WARNs without failing while the JSON file is absent).',
);
process.exit(0);
