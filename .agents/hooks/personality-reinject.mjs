/**
 * Prompt-time context: ONE emitter, three harness adapters.
 *
 * Why this exists: AGENTS.md §2 (Butler + PM Voice + Visual Mapping) and the
 * user-level OUTPUT STYLE are read ONCE at session start and then dilute as
 * the context window fills, while the caveman plugin re-injects itself on
 * every UserPromptSubmit. That asymmetry is mechanical, not editorial:
 * whichever layer is repeated most often wins. Re-emitting the contract on
 * every turn restores the balance for ~30 tokens.
 *
 * The emitter carries, in this order:
 *   1. `PERSONALITY_CONTRACT`: the AGENTS.md §2 output contract.
 *   2. The `AGENT IDENTITY:` line: worktree, session label, harness. It is
 *      forensic metadata: `git-flow-master` copies it into the `Worktree:` /
 *      `Session:` commit trailers (AGENTS.md Critical Rule #3), which name a
 *      checkout and a session, never a tool, so they are NOT attribution.
 *   3. The `ORCA:` line, only when an `orca` binary is reachable, so a machine
 *      without Orca never hears about it.
 *   4. At most ONE setup warning: `MISSING_ENV_LINE` when the checkout has no
 *      `.env`, else `UNPROVISIONED_WORKTREE_LINE` when it is a linked worktree
 *      that never ran `bun run worktree:provision`.
 *
 * The text lives HERE and nowhere else. Each harness reaches it through a thin
 * adapter:
 *   - Claude Code: `.claude/settings.json` UserPromptSubmit runs this file.
 *   - Codex: `.codex/hooks.json` UserPromptSubmit runs this file from the Git root.
 *   - OpenCode: `.opencode/plugins/personality-reinject.js` imports
 *     `agentContextLines` and pushes the same lines into the system prompt.
 * `bun run agents:compat:check` pins the three adapters to this emitter.
 *
 * Hook wire (verified against the vendor docs): Claude Code pipes a JSON
 * payload with `session_id`, `prompt` and an optional `session_title`, and
 * reads `hookSpecificOutput.additionalContext` plus `sessionTitle` back. Codex
 * pipes `session_id` / `turn_id` / `cwd` / `model` / `prompt` and accepts the
 * same `additionalContext` (no `sessionTitle`). OpenCode exposes no session id
 * to a command hook, so its adapter passes what the plugin API hands it.
 *
 * Node built-ins only, no dependency, no network, no child process: this runs
 * on EVERY prompt and must finish well inside its 5 s budget.
 */

import { existsSync, readFileSync, statSync } from 'node:fs';
import { homedir } from 'node:os';
import { basename, delimiter, dirname, join } from 'node:path';
import { pathToFileURL } from 'node:url';

export const PERSONALITY_CONTRACT = [
  'OUTPUT CONTRACT (AGENTS.md §2 plus the active user-level output style):',
  'PM Voice headline = value, never a punch phrase.',
  'Render markdown: headings when 2+ sections, one bold anchor per block, backticks on every path/command/identifier, tables for comparisons, no wall of text.',
  'Butler bullets as `topic: fragment`.',
  'No em dash. Vary sentence length. No closing recap.',
].join(' ');

/** Prefix of the forensic identity line. Consumed by `git-flow-master`. */
export const IDENTITY_PREFIX = 'AGENT IDENTITY:';

/**
 * Emitted when this checkout has no `.env` (Critical Rule #9). A harness
 * spawns every MCP server BEFORE any hook runs, so by the time this line is
 * read those servers already started without their credentials, and the
 * failure surfaces much later as an auth error that reads like a broken tool.
 * This session cannot be repaired; the next one can.
 *
 * It fires most often in a worktree: `git worktree add`, a harness-created
 * worktree and `orca worktree create` copy TRACKED files only, and `.env` is
 * gitignored by design.
 */
export const MISSING_ENV_LINE = [
  'CREDENTIALS: no `.env` in this checkout, so every MCP server in this session',
  'started without one. They are already running; this session cannot be repaired.',
  'Fix and restart: in a linked worktree run `bun run worktree:provision` in it',
  '(it copies `.env` from the main checkout); in a fresh clone run `bun run setup`.',
  'Then `bun run harness:env` (writes the credential files Claude and OpenCode read at startup).',
].join(' ');

/**
 * Emitted in a linked worktree that has no `node_modules/` or no `.husky/_/`.
 * `core.hooksPath` is shared with the primary checkout and points at
 * `.husky/_`, so with that directory missing every commit in the worktree
 * skips every gate and succeeds. Nothing else says so.
 */
export const UNPROVISIONED_WORKTREE_LINE = [
  'WORKTREE: this linked worktree is not provisioned (no node_modules/ or .husky/_),',
  'so git hooks do not run here, repo scripts may fail and Claude Code may not see the repo skills.',
  'Run `bun run worktree:provision` in it, then restart the session.',
].join(' ');

/** Emitted only when the `orca` binary is reachable (`orcaAvailable`). */
export const ORCA_CONTEXT_LINE = [
  'ORCA: available.',
  'Dispatched worker: follow your preamble;',
  'channel = orca orchestration, never SendMessage/AskUserQuestion.',
].join(' ');

/**
 * The fleet-worker token names the session after the roster label:
 * `/<skill> <label> fleet worker` → `<label>`. Any skill slug qualifies and
 * the label is whatever the conductor wrote: a ticket key, `<KEY>-<slug>`, or
 * a kebab slug. Unanchored, because on the supervised path the runtime
 * prepends its own preamble to the prompt that carries the token.
 */
export const FLEET_PROMPT_PATTERN
  = /(?:^|\s)\/([a-z][a-z0-9-]*)\s+([A-Za-z0-9][\w.-]{0,59})\s+fleet worker\b/;

/**
 * Outside a fleet, a ticket-driven workflow skill plus an issue key in the
 * prompt names the session `<KEY>-<workflow>`.
 */
export const WORKFLOW_PROMPT_PATTERN
  = /(sprint-development|product-management|unit-testing)\s+([A-Z][A-Z0-9]+-\d+)/;

const EXPLICIT_NAME_PATTERN = /--name[\s=]+(?:"([^"\n]{1,60})"|([^\s"]{1,60}))/;

/** Codex session index: skip a pathological file rather than stall the prompt. */
const SESSION_INDEX_LIMIT = 2 * 1024 * 1024;

function readJson(path) {
  try {
    if (!existsSync(path)) { return null; }
    return JSON.parse(readFileSync(path, 'utf8'));
  }
  catch {
    return null;
  }
}

function text(value) {
  return typeof value === 'string' && value.length > 0 ? value : '';
}

/**
 * The hook payload Claude Code and Codex pipe on stdin. A TTY means a human
 * ran the file by hand: never block waiting for input.
 */
export function readHookInput(descriptor = 0) {
  try {
    if (process.stdin.isTTY) { return {}; }
    const raw = readFileSync(descriptor, 'utf8').trim();
    if (raw.length === 0) { return {}; }
    const parsed = JSON.parse(raw);
    return typeof parsed === 'object' && parsed !== null && !Array.isArray(parsed) ? parsed : {};
  }
  catch {
    return {};
  }
}

/**
 * `turn_id` is a Codex extension of the shared payload, so it identifies the
 * host before any environment variable does: Codex scrubs the hook
 * environment down to a session snapshot. Claude Code always exports
 * `CLAUDE_PROJECT_DIR` to its hooks.
 */
export function detectHarness({ env = process.env, hookInput = {} } = {}) {
  if (text(hookInput.turn_id)) { return 'codex'; }
  if (text(env.CLAUDE_PROJECT_DIR) || text(env.CLAUDE_CODE_SESSION_ID) || text(env.CLAUDE_PID)) {
    return 'claude-code';
  }
  if (text(env.CODEX_HOME)) { return 'codex'; }
  if (text(env.OPENCODE_TERMINAL)) { return 'opencode'; }
  return 'unknown';
}

/** Walk up from `start` to the checkout root: the nearest directory holding `.git`. */
function checkoutRootOf(start) {
  let dir = start;
  for (let depth = 0; depth < 64 && dir; depth++) {
    if (existsSync(join(dir, '.git'))) { return dir; }
    const parent = dirname(dir);
    if (parent === dir) { return ''; }
    dir = parent;
  }
  return '';
}

/**
 * True when `root/.git` is a FILE `gitdir: <common>/worktrees/<name>`, i.e. a
 * linked worktree. The primary checkout's `.git` is a directory; a
 * submodule's is a file too, but its gitdir sits under `modules/`, so the
 * pointer is read rather than trusting the file type.
 */
function isLinkedWorktree(root, read = readFileSync) {
  try {
    if (statSync(join(root, '.git')).isDirectory()) { return false; }
    return /^gitdir:.*[\\/]worktrees[\\/][^\\/\s]+\s*$/m.test(String(read(join(root, '.git'), 'utf8')));
  }
  catch {
    return false;
  }
}

/**
 * The worktree name for the `Worktree:` trailer, or `primary`.
 *
 * Decided by the checkout itself, never by an inherited variable: walk up from
 * `cwd` to the nearest `.git`; a linked worktree is named after its directory
 * (the name `git worktree add`, a harness and Orca all give it), anything else
 * is `primary`. Orca's `ORCA_WORKTREE_ID` (`<repoId>::<absolute path>`) is
 * only a fallback when no `.git` is reachable: it describes the TERMINAL's
 * worktree, is set for the primary checkout too, and leaks into any session
 * started from that terminal in another checkout.
 *
 * `env` is typed as a plain string map, not `NodeJS.ProcessEnv`: a host that
 * augments `ProcessEnv` with required keys (Next.js adds `NODE_ENV`) would
 * otherwise reject every literal a caller passes
 * (`cli/updater-host-types.test.ts`).
 *
 * @param {Record<string, string | undefined>} [env]
 * @param {string} [cwd]
 */
export function resolveWorktree(env = process.env, cwd = process.cwd()) {
  const root = checkoutRootOf(cwd);
  if (root) {
    return isLinkedWorktree(root) ? basename(root) : 'primary';
  }
  const raw = text(env.ORCA_WORKTREE_ID);
  if (!raw) { return 'primary'; }
  const separator = raw.indexOf('::');
  const path = separator === -1 ? raw : raw.slice(separator + 2);
  const segments = path.split(/[\\/]/).filter(Boolean);
  return segments.length > 0 ? segments[segments.length - 1] : 'primary';
}

/** Where the session runs: the harness's project dir, else the payload's cwd, else ours. */
function sessionDirectory(env, hookInput) {
  return text(env.CLAUDE_PROJECT_DIR) || text(env.CODEX_PROJECT_DIR) || text(hookInput.cwd) || process.cwd();
}

/** `~/.claude/sessions/<CLAUDE_PID>.json` → `{ sessionId, name, nameSource }`. */
function claudeSessionRecord(env, home) {
  const pid = text(env.CLAUDE_PID);
  if (!pid) { return null; }
  return readJson(join(home, '.claude', 'sessions', `${pid}.json`));
}

/** `$CODEX_HOME/session_index.jsonl` → the newest `thread_name` for this id. */
function codexThreadName(sessionId, env, home) {
  if (!sessionId) { return ''; }
  const path = join(text(env.CODEX_HOME) || join(home, '.codex'), 'session_index.jsonl');
  try {
    if (!existsSync(path) || statSync(path).size > SESSION_INDEX_LIMIT) { return ''; }
    const lines = readFileSync(path, 'utf8').split('\n');
    for (let index = lines.length - 1; index >= 0; index--) {
      const line = lines[index].trim();
      if (line.length === 0 || !line.includes(sessionId)) { continue; }
      try {
        const entry = JSON.parse(line);
        if (entry.id === sessionId && text(entry.thread_name)) { return entry.thread_name; }
      }
      catch {
        continue;
      }
    }
  }
  catch {
    return '';
  }
  return '';
}

/**
 * The label rule, applied in order so two sessions never produce two formats:
 * a name the user set, or one this hook set from a prompt token → the name
 * verbatim. A derived name (or one whose origin cannot be established) →
 * `<name> (<id8>)`, so two auto-named sessions stay distinct. Only an id → the
 * full id. Nothing → `unknown`, a positive statement that the resolver ran and
 * came back empty (an absent trailer is indistinguishable from an old commit).
 */
export function sessionLabel({ sessionName = '', nameSource = 'none', sessionId = '' } = {}) {
  if (sessionName && (nameSource === 'user' || nameSource === 'hook')) { return sessionName; }
  if (sessionName && sessionId) { return `${sessionName} (${sessionId.slice(0, 8)})`; }
  if (sessionName) { return sessionName; }
  if (sessionId) { return sessionId; }
  return 'unknown';
}

/**
 * One resolution per prompt: harness, session id, session name and its origin,
 * the label the commit trailers use, and the worktree.
 *
 * `nameSource` is `user` | `hook` | `derived` | `unknown` | `none`. `hook` is
 * Claude Code's record of a title this emitter set. `unknown` means a name
 * exists but nothing tells us who set it (Claude Code's `session_title` hook
 * field, Codex's `thread_name`): exactly the case where the hook must NOT
 * overwrite the title.
 */
export function resolveAgentIdentity(options = {}) {
  const { env = process.env, hookInput = {}, home = homedir() } = options;
  const harness = text(options.harness) || detectHarness({ env, hookInput });
  let sessionId = text(options.sessionId) || text(hookInput.session_id) || text(hookInput.sessionID);
  let sessionName = '';
  let nameSource = 'none';

  if (harness === 'claude-code') {
    sessionId = sessionId || text(env.CLAUDE_CODE_SESSION_ID);
    const record = claudeSessionRecord(env, home);
    if (record) {
      sessionId = sessionId || text(record.sessionId);
      if (text(record.name)) {
        sessionName = record.name;
        nameSource = record.nameSource === 'user' || record.nameSource === 'hook' ? record.nameSource : 'derived';
      }
    }
    if (!sessionName && text(hookInput.session_title)) {
      sessionName = hookInput.session_title;
      nameSource = 'unknown';
    }
  }
  else if (harness === 'codex') {
    const threadName = codexThreadName(sessionId, env, home);
    if (threadName) {
      sessionName = threadName;
      nameSource = 'unknown';
    }
  }

  return {
    harness,
    sessionId,
    sessionName,
    nameSource,
    label: sessionLabel({ sessionName, nameSource, sessionId }),
    worktree: resolveWorktree(env, options.cwd ?? sessionDirectory(env, hookInput)),
  };
}

/**
 * `command -v orca` without spawning a process: scan PATH. An `orca` shell
 * alias is invisible this way, which is the safe direction.
 *
 * Inside an Orca-managed terminal Orca exports `ORCA_APP_VERSION` /
 * `ORCA_TERMINAL_HANDLE`, so those are the first signal. Outside one, on
 * Linux the CLI registers as `orca-ide` (bare `/usr/bin/orca` is the GNOME
 * screen reader), so the Linux probe name is `orca-ide`; macOS and Windows
 * probe `orca`.
 *
 * @param {Record<string, string | undefined>} [env]
 */
export function orcaAvailable(env = process.env) {
  if (text(env.ORCA_APP_VERSION) || text(env.ORCA_TERMINAL_HANDLE)) { return true; }
  const path = text(env.PATH) || text(env.Path);
  if (!path) { return false; }
  const names = [process.platform === 'linux' ? 'orca-ide' : 'orca'];
  if (process.platform === 'win32') {
    const extensions = (text(env.PATHEXT) || '.COM;.EXE;.BAT;.CMD').split(';').filter(Boolean);
    for (const extension of extensions) {
      names.push(`orca${extension.toLowerCase()}`);
    }
  }
  for (const directory of path.split(delimiter)) {
    if (!directory) { continue; }
    for (const name of names) {
      try {
        if (existsSync(join(directory, name))) { return true; }
      }
      catch {
        continue;
      }
    }
  }
  return false;
}

function checkoutRoot(options) {
  const { env = process.env } = options;
  return options.repoRoot ?? env.CLAUDE_PROJECT_DIR ?? env.CODEX_PROJECT_DIR ?? process.cwd();
}

/**
 * Is there a `.env` where the harness would look for one? One `existsSync` on
 * a known path: this runs on every prompt. Existence only; whether a given key
 * is filled is `bun run setup:doctor`'s job.
 */
export function envFileMissing(options = {}) {
  const { existsSync: exists = existsSync } = options;
  const root = checkoutRoot(options);
  if (!root) { return false; }
  try { return !exists(join(root, '.env')); }
  catch { return false; }
}

/** Is the checkout a LINKED worktree missing what provisioning adds? */
export function worktreeUnprovisioned(options = {}) {
  const { existsSync: exists = existsSync, readFileSync: read = readFileSync } = options;
  const root = checkoutRoot(options);
  if (!root || !isLinkedWorktree(root, read)) { return false; }
  try {
    return !exists(join(root, 'node_modules')) || !exists(join(root, '.husky', '_'));
  }
  catch {
    return false;
  }
}

export function identityLine(identity) {
  return `${IDENTITY_PREFIX} worktree=${identity.worktree} session=${identity.label} harness=${identity.harness}`;
}

/** The lines every harness injects, in order. OpenCode pushes them as-is. */
export function agentContextLines(options = {}) {
  const { env = process.env } = options;
  const identity = options.identity ?? resolveAgentIdentity(options);
  const orca = options.orca ?? orcaAvailable(env);
  const lines = [PERSONALITY_CONTRACT, identityLine(identity)];
  if (orca) { lines.push(ORCA_CONTEXT_LINE); }
  if (options.envMissing ?? envFileMissing(options)) { lines.push(MISSING_ENV_LINE); }
  else if (options.worktreeUnprovisioned ?? worktreeUnprovisioned(options)) { lines.push(UNPROVISIONED_WORKTREE_LINE); }
  return lines;
}

/** A title is a single line: control characters collapse into spaces. */
function sanitizeTitle(value) {
  const printable = [...value]
    .map(character => (character.codePointAt(0) < 0x20 || character.codePointAt(0) === 0x7F ? ' ' : character))
    .join('');
  return printable.replace(/\s+/g, ' ').trim().slice(0, 60);
}

/**
 * A title only when no human named the session: `nameSource` `user` (a
 * `/rename` or `--name`) and `unknown` (a name of unverifiable origin) are
 * both left alone. A name this hook set earlier (`hook`) may be replaced,
 * because a re-engaged fleet terminal receives a new task with a new label.
 * Precedence: the fleet-worker token, then an explicit `--name <value>`, then
 * the workflow + issue-key shape `<KEY>-<workflow>`. A title equal to the
 * current name is not re-emitted.
 */
export function proposeSessionTitle({ prompt = '', identity = {} } = {}) {
  if (identity.nameSource === 'user' || identity.nameSource === 'unknown') { return ''; }
  const title = titleFromPrompt(prompt);
  return title === identity.sessionName ? '' : title;
}

function titleFromPrompt(prompt) {
  const fleet = FLEET_PROMPT_PATTERN.exec(prompt);
  if (fleet) { return sanitizeTitle(fleet[2]); }
  const explicit = EXPLICIT_NAME_PATTERN.exec(prompt);
  if (explicit) { return sanitizeTitle(explicit[1] ?? explicit[2] ?? ''); }
  const workflow = WORKFLOW_PROMPT_PATTERN.exec(prompt);
  return workflow ? sanitizeTitle(`${workflow[2]}-${workflow[1]}`) : '';
}

/**
 * Claude Code and Codex both read `hookSpecificOutput.additionalContext` from
 * stdout JSON; only Claude Code documents `sessionTitle`, so only Claude Code
 * receives it. Any other caller (a human running the file) gets plain lines.
 */
export function renderHookOutput(options = {}) {
  const { env = process.env, hookInput = {}, home = homedir() } = options;
  const identity = resolveAgentIdentity({ ...options, env, hookInput, home });
  const context = agentContextLines({ ...options, env, hookInput, home, identity }).join('\n');
  if (identity.harness !== 'claude-code' && identity.harness !== 'codex') {
    return `${context}\n`;
  }
  const event = text(hookInput.hook_event_name) || 'UserPromptSubmit';
  const hookSpecificOutput = { hookEventName: event, additionalContext: context };
  if (identity.harness === 'claude-code' && event === 'UserPromptSubmit') {
    const title = proposeSessionTitle({ prompt: text(hookInput.prompt), identity });
    if (title) { hookSpecificOutput.sessionTitle = title; }
  }
  return `${JSON.stringify({ hookSpecificOutput })}\n`;
}

export function emitHookOutput(stream = process.stdout, options = {}) {
  const hookInput = options.hookInput ?? readHookInput();
  stream.write(renderHookOutput({ ...options, hookInput }));
}

const entrypoint = process.argv[1];
if (entrypoint && import.meta.url === pathToFileURL(entrypoint).href) {
  emitHookOutput();
}
