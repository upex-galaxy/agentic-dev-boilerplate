/**
 * @fileoverview Additive merge of the Claude permission allow and deny lists.
 *
 * `.claude/settings.json` is bootstrap-only AND watched: delivered once when
 * missing, then project-owned and never overwritten, because the permissions,
 * the hook wiring and the env block are the project's. The cost was that a
 * skill shipped upstream arrived downstream WITHOUT the `Skill(<name>)` entry
 * that authorizes it, so the skill was installed and silently could not be
 * invoked — which happened to several of this repo's own skills. The same
 * freeze kept the secret deny rules (`Read(.env)`, `Bash(printenv*)`, ...)
 * away from every project scaffolded before they shipped.
 *
 * The fix is a set-union merge of TWO arrays: `permissions.allow` and
 * `permissions.deny`. Entries upstream declares and the project lacks are
 * appended after the project's own, in upstream's order. Nothing is removed or
 * reordered, and every other key — `ask`, `hooks`, `env`, `attribution`, any
 * key at all — is read and written back untouched.
 *
 * WHY NO MEMORY OF REMOVALS. A project that deliberately deleted an entry gets
 * it back on the next sync. For `allow` that is accepted, deliberately: a
 * deliberate removal is re-expressible in `deny`, which wins over `allow`.
 * `deny` has no stronger list to express "not this one", so a project that
 * wants an upstream deny OFF says so by name in `.agents/project.yaml` ->
 * `updater.declined_denies` (`readDeclinedDenies`). The opt-out is per entry,
 * not per file: protecting the whole file would also stop every deny a later
 * release adds, which is the exposure this merge exists to close.
 *
 * `opencode.jsonc` is on the same watchlist but is never merged: it is JSONC
 * (comments, trailing commas) and its permission block is an ordered map where
 * the last matching rule wins, so a programmatic rewrite would lose the
 * project's comments and could reorder its rules. `opencodeDenyGap` measures
 * which upstream denies the project lacks and renders the block to paste; the
 * parity report carries it as a row.
 *
 * Relation to `updater-package.ts`: the JSON shape helpers are reused from
 * there (`parsePackageJson` / `stringifyPackageJson` are generic despite their
 * names: they capture indent, CRLF and trailing newline so the rewrite
 * preserves the file's formatting). The DELTA machinery is not reused, and
 * could not be: it is built on object keys with a same-key/different-value
 * bucket and per-key `appliedKeys` / `keptKeys` state. A string array has no
 * keys, no value to diverge — an entry is present or it is not — and the
 * no-memory decision above removes the state tracking entirely.
 */

import * as fs from 'node:fs';
import * as path from 'node:path';
import { parse as parseYaml } from 'yaml';
import { REARM_SESSION_START_SOURCES, stripJsonComments, stripTrailingCommas } from './agent-compatibility-contracts.ts';
import { parsePackageJson, stringifyPackageJson } from './updater-package.ts';

/** The file whose permission lists are merged. */
export const CLAUDE_SETTINGS_FILE = '.claude/settings.json';

/** The OpenCode config whose permission denies are measured, never rewritten. */
export const OPENCODE_SETTINGS_FILE = 'opencode.jsonc';

/** Where a project declines an upstream deny entry, by its exact text. */
export const DECLINED_DENIES_KEY = 'updater.declined_denies';

const PROJECT_YAML = '.agents/project.yaml';

export interface PermissionListMerge {
  /** `permissions.allow` entries upstream declares that the project lacked, in upstream's order. */
  allowAdded: string[]
  /** `permissions.deny` entries upstream declares that the project lacked and did not decline, in upstream's order. */
  denyAdded: string[]
  /** Upstream deny entries the project lacks and declined through `updater.declined_denies`: left out. */
  denyDeclined: string[]
  /** The file's new contents, or null when nothing was added (no write). */
  merged: string | null
}

/** The string entries of a list (none when it is not an array). */
function stringEntries(list: unknown): string[] {
  return Array.isArray(list) ? list.filter((entry): entry is string => typeof entry === 'string') : [];
}

/** A parsed settings object's `permissions` block, or null when absent or of another shape. */
function permissionsBlock(data: Record<string, unknown>): Record<string, unknown> | null {
  const permissions = data.permissions;
  if (permissions === null || typeof permissions !== 'object' || Array.isArray(permissions)) { return null; }
  return permissions as Record<string, unknown>;
}

/**
 * Set-union the upstream allow and deny lists into the project's, appending
 * the missing entries at the END in upstream's own order — never reordering
 * what is there, never removing anything, never touching another key.
 *
 * Returns `merged: null` when there is nothing to add, when either file is
 * missing or unparseable, or when the project's file declares no `permissions`
 * object at all. That last case is deliberate on a project the boilerplate
 * delivered the file to: a settings file with no permissions block is not a
 * project that dropped an entry, it is a shape this merge does not understand,
 * and guessing at it would be a rewrite.
 *
 * Inside an existing `permissions` object the two lists differ on purpose.
 * An absent `allow` stays absent (today's behaviour). An absent `deny` is
 * CREATED when upstream has a deny to add: a project that never wrote a deny
 * list did not choose against the secret denies, and the explicit way to
 * choose against one is `declinedDenies`. A `deny` of another shape (not an
 * array) is left alone.
 *
 * `createMissing` is the `--adopt` run's exception. An adopted app's own
 * settings file (kept, never overwritten) commonly declares hooks and env but
 * no permissions at all, and without the upstream `Skill(<name>)` entries
 * every framework skill prompts instead of running (measured on the dogfood
 * app). There the absent `permissions` object, or an absent `allow` array in
 * one that exists, is created with upstream's entries; a value of another
 * shape is still left alone. Greenfield and every plain update pass nothing.
 *
 * `declinedDenies` lists upstream deny entries, by exact text, the project
 * does not want (`readDeclinedDenies`). They are never appended and are
 * reported back in `denyDeclined` when upstream has them and the project
 * lacks them.
 */
export function mergePermissionLists(
  repoRoot: string,
  templateDir: string,
  opts: { createMissing?: boolean, declinedDenies?: readonly string[] } = {},
): PermissionListMerge {
  const localPath = path.join(repoRoot, CLAUDE_SETTINGS_FILE);
  const upstreamPath = path.join(templateDir, CLAUDE_SETTINGS_FILE);
  const nothing: PermissionListMerge = { allowAdded: [], denyAdded: [], denyDeclined: [], merged: null };
  if (!fs.existsSync(localPath) || !fs.existsSync(upstreamPath)) { return nothing; }

  let local: ReturnType<typeof parsePackageJson>;
  let upstream: ReturnType<typeof parsePackageJson>;
  try {
    local = parsePackageJson(localPath);
    upstream = parsePackageJson(upstreamPath);
  }
  catch {
    return nothing; // unparseable on either side: never rewrite a file we cannot read
  }

  const create = opts.createMissing === true;
  if (create && local.data.permissions === undefined) { local.data.permissions = {}; }
  const block = permissionsBlock(local.data);
  if (block === null) { return nothing; }
  const upstreamBlock = permissionsBlock(upstream.data) ?? {};

  let allowAdded: string[] = [];
  if (create && block.allow === undefined) { block.allow = []; }
  if (Array.isArray(block.allow)) {
    const localAllow = stringEntries(block.allow);
    const have = new Set(localAllow);
    allowAdded = stringEntries(upstreamBlock.allow).filter(entry => !have.has(entry));
    if (allowAdded.length > 0) { block.allow = [...localAllow, ...allowAdded]; }
  }

  let denyAdded: string[] = [];
  let denyDeclined: string[] = [];
  if (block.deny === undefined || Array.isArray(block.deny)) {
    const localDeny: unknown[] = Array.isArray(block.deny) ? block.deny : [];
    const have = new Set(stringEntries(localDeny));
    const declined = new Set(opts.declinedDenies ?? []);
    const missing = stringEntries(upstreamBlock.deny).filter(entry => !have.has(entry));
    denyDeclined = missing.filter(entry => declined.has(entry));
    denyAdded = missing.filter(entry => !declined.has(entry));
    if (denyAdded.length > 0) { block.deny = [...localDeny, ...denyAdded]; }
  }

  if (allowAdded.length === 0 && denyAdded.length === 0) { return { ...nothing, denyDeclined }; }
  return { allowAdded, denyAdded, denyDeclined, merged: stringifyPackageJson(local) };
}

/**
 * Run the merge and write the result. Returns what was added (empty lists
 * when nothing changed, so the caller can stay silent). The caller owns the
 * backup: this only writes when there is something to write.
 */
export function applyPermissionListMerge(
  repoRoot: string,
  templateDir: string,
  opts: { createMissing?: boolean, declinedDenies?: readonly string[] } = {},
): Omit<PermissionListMerge, 'merged'> {
  const { merged, ...result } = mergePermissionLists(repoRoot, templateDir, opts);
  if (merged !== null) { fs.writeFileSync(path.join(repoRoot, CLAUDE_SETTINGS_FILE), merged, 'utf-8'); }
  return result;
}

export interface DeclinedDenies {
  /** Deny entries, by exact text, the project declined. */
  entries: string[]
  /** Set when the key exists but is not a list of strings: names the problem, the run ignores the key. */
  error?: string
}

/**
 * `updater.declined_denies` from `<root>/.agents/project.yaml`. An absent file,
 * block or key is an empty list. A malformed value is reported and ignored,
 * which fails toward MORE denies, never fewer.
 */
export function readDeclinedDenies(root: string): DeclinedDenies {
  const file = path.join(root, PROJECT_YAML);
  if (!fs.existsSync(file)) { return { entries: [] }; }
  let parsed: unknown;
  try { parsed = parseYaml(fs.readFileSync(file, 'utf-8')); }
  catch (err) { return { entries: [], error: `cannot parse ${PROJECT_YAML}: ${err instanceof Error ? err.message : String(err)}` }; }
  const updater = parsed !== null && typeof parsed === 'object' ? (parsed as Record<string, unknown>).updater : undefined;
  if (updater === undefined || updater === null) { return { entries: [] }; }
  const raw = typeof updater === 'object' && !Array.isArray(updater) ? (updater as Record<string, unknown>).declined_denies : undefined;
  if (raw === undefined || raw === null) { return { entries: [] }; }
  if (!Array.isArray(raw) || raw.some(entry => typeof entry !== 'string')) {
    return { entries: [], error: `${DECLINED_DENIES_KEY} must be a list of deny entries, written exactly as in ${CLAUDE_SETTINGS_FILE}` };
  }
  return { entries: raw as string[] };
}

export interface OpencodeDenyGap {
  /** Upstream `deny` rules the project's permission block lacks, grouped by tool, in upstream's order. */
  missing: { tool: string, patterns: string[] }[]
  /** JSONC the operator pastes into the project's `permission` block. */
  block: string
}

function parseJsonc(file: string): Record<string, unknown> | null {
  try {
    const parsed: unknown = JSON.parse(stripTrailingCommas(stripJsonComments(fs.readFileSync(file, 'utf-8'))));
    return parsed !== null && typeof parsed === 'object' && !Array.isArray(parsed) ? parsed as Record<string, unknown> : null;
  }
  catch { return null; }
}

function objectAt(value: unknown): Record<string, unknown> | null {
  return value !== null && typeof value === 'object' && !Array.isArray(value) ? value as Record<string, unknown> : null;
}

/**
 * The upstream `permission.<tool>` patterns whose action is `deny` and that
 * the project's `opencode.jsonc` does not mention at all, or null when there
 * is no gap (or either file is missing or unparseable).
 *
 * A pattern the project already lists, WHATEVER its action, is the project's
 * decision and is not reported: that is OpenCode's opt-out, set the pattern to
 * `ask` or `allow` yourself. A tool the project declares as a single action
 * (`"bash": "ask"`) has no map to append to: the block opens that tool's map
 * with `"*": "<that action>"` so pasting it keeps the project's default.
 */
export function opencodeDenyGap(root: string, upstreamDir: string): OpencodeDenyGap | null {
  const localFile = path.join(root, OPENCODE_SETTINGS_FILE);
  const upstreamFile = path.join(upstreamDir, OPENCODE_SETTINGS_FILE);
  if (!fs.existsSync(localFile) || !fs.existsSync(upstreamFile)) { return null; }
  const local = parseJsonc(localFile);
  const upstream = parseJsonc(upstreamFile);
  if (local === null || upstream === null) { return null; }
  const upstreamPermission = objectAt(upstream.permission) ?? {};
  const localPermission = objectAt(local.permission) ?? {};

  const missing: OpencodeDenyGap['missing'] = [];
  const lines: string[] = [
    `// Paste into "permission" in ${OPENCODE_SETTINGS_FILE}: append each entry at the END of`,
    '// that tool\'s map (OpenCode applies the last matching rule), creating the map when absent.',
  ];
  for (const [tool, rules] of Object.entries(upstreamPermission)) {
    const upstreamRules = objectAt(rules);
    if (upstreamRules === null) { continue; }
    const localValue = localPermission[tool];
    const localRules = objectAt(localValue) ?? {};
    const patterns = Object.entries(upstreamRules)
      .filter(([pattern, action]) => action === 'deny' && !(pattern in localRules))
      .map(([pattern]) => pattern);
    if (patterns.length === 0) { continue; }
    missing.push({ tool, patterns });
    lines.push(`${JSON.stringify(tool)}: {`);
    if (typeof localValue === 'string') { lines.push(`  "*": ${JSON.stringify(localValue)},`); }
    for (const pattern of patterns) { lines.push(`  ${JSON.stringify(pattern)}: "deny",`); }
    lines.push('},');
  }
  return missing.length === 0 ? null : { missing, block: lines.join('\n') };
}

export interface PromptHookMerge {
  /** True when the project's file had no `hooks.UserPromptSubmit` and upstream's groups were added. */
  added: boolean
  /** The re-arm sources (`compact`, `clear`) whose upstream group was appended because the project's `hooks.SessionStart` had none of its own. */
  rearmAdded: string[]
  /** The file's new contents, or null when nothing changes (no write). */
  merged: string | null
}

/** `matcher: <source>` groups of a hooks object's `SessionStart` (none when the event is absent or malformed). */
function sourceGroups(hooks: Record<string, unknown> | undefined, source: string): unknown[] {
  const groups = hooks?.SessionStart;
  if (!Array.isArray(groups)) { return []; }
  return groups.filter(group => group !== null && typeof group === 'object' && (group as Record<string, unknown>).matcher === source);
}

/**
 * `--adopt` only. An adopted app's own `.claude/settings.json` (kept, never
 * overwritten) usually has no `UserPromptSubmit` hook, and the compatibility
 * contract requires the one that emits the agent context (output contract +
 * the AGENT IDENTITY line the commit trailers copy): without it the adoption
 * commit itself is refused by the pre-commit gate (measured on
 * upexgalaxy-webapp). Added only when the event is ABSENT: an app that wires
 * its own `UserPromptSubmit` keeps it, and the contract row says what to add.
 *
 * The same contract requires a `SessionStart` group per re-arm source
 * (`compact`, `clear`) running that hook, so the instruction routes re-arm
 * after a compaction or a `/clear`. An app often has its own `SessionStart`
 * (upexgalaxy-webapp does), so the test is one level down, per source:
 * upstream's group is APPENDED when the app has no group of its own for that
 * source; the app's groups keep their order and an app group of its own is
 * kept as is.
 * Every other key, and every other hook event, is written back untouched.
 */
export function mergeAdoptPromptHook(repoRoot: string, templateDir: string): PromptHookMerge {
  const localPath = path.join(repoRoot, CLAUDE_SETTINGS_FILE);
  const upstreamPath = path.join(templateDir, CLAUDE_SETTINGS_FILE);
  const nothing: PromptHookMerge = { added: false, rearmAdded: [], merged: null };
  if (!fs.existsSync(localPath) || !fs.existsSync(upstreamPath)) { return nothing; }
  let local: ReturnType<typeof parsePackageJson>;
  let upstream: ReturnType<typeof parsePackageJson>;
  try {
    local = parsePackageJson(localPath);
    upstream = parsePackageJson(upstreamPath);
  }
  catch { return nothing; }

  const upstreamHooks = upstream.data.hooks as Record<string, unknown> | undefined;
  const hooks = local.data.hooks;
  if (hooks !== undefined && (hooks === null || typeof hooks !== 'object' || Array.isArray(hooks))) { return nothing; }
  const localHooks = { ...(hooks ?? {}) as Record<string, unknown> };

  const wanted = upstreamHooks?.UserPromptSubmit;
  const added = Array.isArray(wanted) && !('UserPromptSubmit' in localHooks);
  if (added) { localHooks.UserPromptSubmit = wanted; }

  const rearmAdded: string[] = [];
  const localSessionStart = localHooks.SessionStart;
  if (localSessionStart === undefined || Array.isArray(localSessionStart)) {
    const appended: unknown[] = [];
    for (const source of REARM_SESSION_START_SOURCES) {
      const wanted = sourceGroups(upstreamHooks, source);
      if (wanted.length === 0 || sourceGroups(localHooks, source).length > 0) { continue; }
      appended.push(...wanted);
      rearmAdded.push(source);
    }
    if (appended.length > 0) { localHooks.SessionStart = [...(localSessionStart as unknown[] | undefined ?? []), ...appended]; }
  }

  if (!added && rearmAdded.length === 0) { return nothing; }
  local.data.hooks = localHooks;
  return { added, rearmAdded, merged: stringifyPackageJson(local) };
}
