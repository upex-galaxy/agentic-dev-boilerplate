/**
 * @fileoverview Which checkout OWNS the boilerplate's contracts.
 *
 * Several checks are stricter in the boilerplate itself than downstream: the
 * boilerplate ships a fix, so its own copy must carry it (error), while a
 * project scaffolded before the fix existed may hold the file as
 * bootstrap-only and cannot receive it from a sync (warning naming what to
 * add). This module answers the one question those checks share.
 *
 * Import-closed: only Node builtins and `cli/lib` siblings.
 */

/**
 * The package name of the upstream boilerplate. A fork keeps it, and a fork is
 * an upstream, so that is correct.
 */
export const UPSTREAM_PACKAGE = 'agentic-dev-boilerplate';

/** Whether `package.json` (raw text) belongs to the upstream boilerplate. */
export function isSchemaOwner(packageJsonText: string): boolean {
  try { return (JSON.parse(packageJsonText) as { name?: string }).name === UPSTREAM_PACKAGE; }
  catch { return false; }
}
