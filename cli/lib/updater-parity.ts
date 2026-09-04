/**
 * @fileoverview Parity report after `bun run up`: ONE table of what still
 * differs from upstream per surface, with concrete evidence, and ONE prompt the
 * user hands to their AI so every row gets a decision (keep project | take
 * upstream | merge) BEFORE anything is edited.
 *
 * Inputs are collected by the wrapper at afterApply time, while the upstream
 * clone is still on disk:
 *
 *  - protected watchlist entries that drifted this run (`updater-drift.ts`);
 *  - the compatibility check (`checkAgentCompatibility`): its errors are the
 *    only BLOCKING findings, and the MCP set errors are folded per host. When a
 *    compat error and a watched-file drift name the SAME path, they fold into
 *    one row (compat evidence first, drift evidence appended);
 *  - skills the cross-harness migration archived because `.agents/skills/`
 *    already owned the name (this run's, plus any archive dir entry that has
 *    not been nudged yet; one marker per skill under `.template/upstream-sha/`);
 *  - command wrappers no manifest produced (upstream manifest, plus the
 *    optional project overlay `command-aliases.project.json`), ONE row per
 *    path whether the compat check named it or the disk scan found it;
 *  - components held back this run, with their lock commits;
 *  - `.env` keys upstream documents and the project lacks;
 *  - the `git_strategy` provenance stamp in `.agents/project.yaml`.
 *
 * Rules: no finding without evidence (a heading, a key, a server id, a count);
 * ids are sequential per run; the prompt speaks in headings and sections,
 * never in rule numbers. Full diffs go to the saved file, never to the terminal.
 */

import { spawnSync } from 'node:child_process';
import * as fs from 'node:fs';
import * as path from 'node:path';

import { stripJsonComments } from './agent-compatibility-contracts.ts';
import { COMMAND_ALIAS_MANIFEST, COMMAND_ALIAS_PROJECT_MANIFEST, undeclaredCommandWrappers } from './agent-compatibility.ts';

// ============================================================================
// TYPES
// ============================================================================

export type ParitySurface = 'instructions' | 'skills' | 'commands' | 'hooks' | 'mcp' | 'env' | 'components' | 'git';

export type ParitySuggestion
  = 'keep project' | 'take upstream' | 'merge' | 'add to overlay' | 'run agents:compat' | 'decide';

export interface ParityFinding {
  id: number
  surface: ParitySurface
  path: string
  /** Concrete, scannable: headings, keys, server ids, counts. Never a diff. */
  evidence: string
  suggested: ParitySuggestion
  /** Blocking = a failed compatibility contract. Watched-file drift never blocks. */
  blocking: boolean
  /** Full paired diff, written to the saved file under the finding's heading. */
  diff?: string
}

export interface ParityDriftInput {
  path: string
  reason: string
}

export interface HeldBackComponent {
  component: string
  lockCommit: string | null
}

export interface ParityInput {
  /** Project root (the consumer repo). */
  root: string
  /** Upstream clone directory, still on disk during afterApply. */
  upstreamDir: string
  /** Watchlist entries that drifted this run (already filtered by the sha markers). */
  drift: ParityDriftInput[]
  /** `checkAgentCompatibility().errors`. */
  compatErrors: string[]
  /** Skills to report as archived (names only); see `archivedSkillsToReport`. */
  archivedSkills: string[]
  /** Directory holding the archived skills (`<MIGRATION_BACKUP_DIR>/skills`). */
  archivedSkillsDir: string
  heldBack: HeldBackComponent[]
  /** Keys upstream `.env.example` documents that the project's `.env` / `.env.example` lack. */
  envNewKeys: string[]
}

export interface ParityMeta {
  templateRepo: string
  upstreamSha: string
  lockSha: string
  /** Repo-relative path of the saved prompt file (named inside the prompt). */
  promptFile: string
}

export type SurfaceState = 'ok' | 'warn' | 'blocked';

export interface SurfaceRow {
  surface: ParitySurface
  label: string
  state: SurfaceState
  cell: string
}

export interface ParityReport {
  /** One row per surface, in `SURFACE_ORDER`; the wrapper renders them with `tui.table`. */
  surfaces: SurfaceRow[]
  prompt: string
  fileBody: string
}

// ============================================================================
// CONSTANTS
// ============================================================================

export const PARITY_PROMPT_PATH = path.join('.agents', 'prompts', 'parity-plan.md');
/** One marker per archived skill, next to the watchlist sha markers (gitignored). */
const ARCHIVED_SKILL_MARKER_DIR = path.join('.template', 'upstream-sha');
const WRAPPER_UNDECLARED_EVIDENCE = `wrapper not produced by ${COMMAND_ALIAS_MANIFEST} nor ${COMMAND_ALIAS_PROJECT_MANIFEST}`;

const MCP_HOST_FILE: Record<string, string> = {
  claude: '.mcp.json',
  opencode: 'opencode.jsonc',
  codex: '.codex/config.toml',
};

/** Order of the surfaces in every table. */
export const SURFACE_ORDER: ParitySurface[] = ['instructions', 'skills', 'commands', 'hooks', 'mcp', 'env', 'components', 'git'];

/** English labels for the prompt (the AI reads it). */
const SURFACE_LABEL_EN: Record<ParitySurface, string> = {
  instructions: 'Instructions',
  skills: 'Skills',
  commands: 'Commands',
  hooks: 'Hooks',
  mcp: 'MCP',
  env: 'Env',
  components: 'Components',
  git: 'Git',
};

/** Spanish labels for the terminal table (the human reads it). */
const SURFACE_LABEL_ES: Record<ParitySurface, string> = {
  instructions: 'Instrucciones y config',
  skills: 'Skills',
  commands: 'Comandos',
  hooks: 'Hooks',
  mcp: 'MCP',
  env: 'Env',
  components: 'Componentes',
  git: 'Git',
};

const MAX_NAMES = 3;

// ============================================================================
// DIFF HELPERS
// ============================================================================

export interface DiffStats {
  hunks: number
  added: number
  removed: number
}

/** Hunk / line counts of a unified diff. */
export function diffStats(diff: string): DiffStats {
  let hunks = 0;
  let added = 0;
  let removed = 0;
  for (const line of diff.split('\n')) {
    if (line.startsWith('@@')) { hunks += 1; }
    else if (line.startsWith('+') && !line.startsWith('+++')) { added += 1; }
    else if (line.startsWith('-') && !line.startsWith('---')) { removed += 1; }
  }
  return { hunks, added, removed };
}

/**
 * `git diff --no-index` between two paths (files or directories), uncolored,
 * `+` = what `b` has. Absolute paths in the headers are replaced by the labels
 * so the saved file reads `project/AGENTS.md` -> `upstream/AGENTS.md`, not two
 * temp-dir paths. Git prints header paths with forward slashes on every
 * platform, so a Windows `a` / `b` is normalized the same way before the
 * relabel, or the temp-dir paths would survive there. Returns '' when the
 * paths are identical or git is unavailable.
 */
export function diffNoIndex(a: string, b: string, labels: { a: string, b: string } = { a: 'project', b: 'upstream' }): string {
  const res = spawnSync('git', ['diff', '--no-index', '--no-color', '--', a, b], { encoding: 'utf8' });
  let out = res.stdout ?? '';
  const relabel = (raw: string, label: string): void => {
    const needle = raw.replace(/\\/g, '/');
    const replacement = `/${label}/${path.basename(needle)}`;
    for (const form of new Set([needle, raw])) { out = out.split(form).join(replacement); }
  };
  relabel(a, labels.a);
  relabel(b, labels.b);
  return out;
}

function formatStats(stats: DiffStats): string {
  return `${stats.hunks} hunk${stats.hunks === 1 ? '' : 's'} (+${stats.added}/-${stats.removed})`;
}

function listNames(names: string[]): string {
  const shown = names.slice(0, MAX_NAMES).map(n => `"${n}"`).join(', ');
  return names.length > MAX_NAMES ? `${shown} +${names.length - MAX_NAMES} more` : shown;
}

// ============================================================================
// SECTION-LEVEL EVIDENCE
// ============================================================================

const HEADING_RE = /^#{1,3}\s+/;

/** Markdown sections keyed by heading (levels 1-3). Body is whitespace-normalized. */
export function markdownSections(text: string): Map<string, string> {
  const sections = new Map<string, string[]>();
  let current = '';
  sections.set(current, []);
  for (const line of text.replace(/\r\n/g, '\n').split('\n')) {
    if (HEADING_RE.test(line)) {
      current = line.replace(HEADING_RE, '').trim();
      // A repeated heading gets a suffix so both bodies survive the comparison.
      let key = current;
      for (let n = 2; sections.has(key); n += 1) { key = `${current} (${n})`; }
      current = key;
      sections.set(current, []);
      continue;
    }
    sections.get(current)!.push(line.trimEnd());
  }
  return new Map([...sections].map(([k, v]) => [k, v.join('\n').trim()]));
}

export interface SectionDelta {
  added: string[]
  removed: string[]
  changed: string[]
}

/** Headings upstream added / project-only / present in both with a different body. */
export function markdownSectionDelta(project: string, upstream: string): SectionDelta {
  const mine = markdownSections(project);
  const theirs = markdownSections(upstream);
  const added: string[] = [];
  const changed: string[] = [];
  for (const [heading, body] of theirs) {
    if (heading === '') { continue; }
    if (!mine.has(heading)) { added.push(heading); }
    else if (mine.get(heading) !== body) { changed.push(heading); }
  }
  const removed = [...mine.keys()].filter(h => h !== '' && !theirs.has(h));
  return { added, removed, changed };
}

/**
 * Keys of a structured config, two levels deep (`top`, `top.child` when the
 * child is a plain object). Two levels is where MCP registries, permission
 * blocks and `git_strategy` live; deeper is noise.
 */
export function configKeys(text: string, filePath: string): string[] | null {
  const ext = path.extname(filePath).toLowerCase();
  let parsed: unknown;
  try {
    if (ext === '.json') { parsed = JSON.parse(text); }
    else if (ext === '.jsonc') { parsed = JSON.parse(stripJsonComments(text).replace(/,(\s*[}\]])/g, '$1')); }
    else if (ext === '.toml') { parsed = Bun.TOML.parse(text); }
    else if (ext === '.yaml' || ext === '.yml') { return yamlKeys(text); }
    else { return null; }
  }
  catch {
    return null;
  }
  if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) { return null; }
  const keys: string[] = [];
  for (const [top, value] of Object.entries(parsed as Record<string, unknown>)) {
    keys.push(top);
    if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
      for (const child of Object.keys(value as Record<string, unknown>)) { keys.push(`${top}.${child}`); }
    }
  }
  return keys;
}

/** Top-level and first-nested YAML keys (block style, 2-space indent), no parser needed. */
function yamlKeys(text: string): string[] {
  const keys: string[] = [];
  let top = '';
  for (const line of text.replace(/\r\n/g, '\n').split('\n')) {
    const topMatch = /^([\w.-]+):/.exec(line);
    if (topMatch) { top = topMatch[1]; keys.push(top); continue; }
    const childMatch = /^ {2}([\w.-]+):/.exec(line);
    if (childMatch && top !== '') { keys.push(`${top}.${childMatch[1]}`); }
  }
  return keys;
}

export interface KeyDelta {
  added: string[]
  projectOnly: string[]
}

export function configKeyDelta(projectKeys: string[], upstreamKeys: string[]): KeyDelta {
  const mine = new Set(projectKeys);
  const theirs = new Set(upstreamKeys);
  return {
    added: [...theirs].filter(k => !mine.has(k)),
    projectOnly: [...mine].filter(k => !theirs.has(k)),
  };
}

/** One evidence sentence for a watched file, from its two copies plus the diff. */
export function describeWatchedFile(filePath: string, project: string, upstream: string, diff: string): string {
  const stats = formatStats(diffStats(diff));
  const parts: string[] = [];
  if (path.extname(filePath).toLowerCase() === '.md') {
    const delta = markdownSectionDelta(project, upstream);
    if (delta.added.length > 0) { parts.push(`upstream added ${delta.added.length} heading(s): ${listNames(delta.added)}`); }
    if (delta.changed.length > 0) { parts.push(`changed ${delta.changed.length}: ${listNames(delta.changed)}`); }
    if (delta.removed.length > 0) { parts.push(`project-only ${delta.removed.length}: ${listNames(delta.removed)}`); }
    if (parts.length === 0) { parts.push('same headings, body differs'); }
  }
  else {
    const mine = configKeys(project, filePath);
    const theirs = configKeys(upstream, filePath);
    if (mine && theirs) {
      const delta = configKeyDelta(mine, theirs);
      if (delta.added.length > 0) { parts.push(`upstream added key(s): ${listNames(delta.added)}`); }
      if (delta.projectOnly.length > 0) { parts.push(`project-only key(s): ${listNames(delta.projectOnly)}`); }
      if (parts.length === 0) { parts.push('same keys, values differ'); }
    }
    else {
      parts.push('content differs');
    }
  }
  return `${parts.join('; ')}; ${stats}`;
}

// ============================================================================
// COMPAT ERROR CLASSIFICATION
// ============================================================================

const MCP_MISSING_RE = /^MCP (\S+) missing from (\w+):/;
const MCP_EXTRA_RE = /^MCP (\S+) present in (\w+) only:/;
/** `validateCommandAliases` names a wrapper file no manifest produced. */
const WRAPPER_UNDECLARED_RE = /^Command wrapper not declared in any manifest: (\S+?);/;

export function compatErrorSurface(message: string): ParitySurface {
  if (/\bMCP\b/.test(message)) { return 'mcp'; }
  if (/command wrapper|command alias/i.test(message)) { return 'commands'; }
  if (/skills alias|\.claude\/skills|skill/i.test(message)) { return 'skills'; }
  if (/hook/i.test(message)) { return 'hooks'; }
  return 'instructions';
}

/**
 * Generated surfaces are rebuilt by `agents:compat`; a wrapper no manifest
 * declares is the project's to declare (overlay) or delete; anything else
 * comes from upstream's shape.
 */
export function compatErrorSuggestion(message: string): ParitySuggestion {
  if (WRAPPER_UNDECLARED_RE.test(message)) { return 'add to overlay'; }
  return /command wrapper|skills alias|\.claude\/skills/i.test(message) ? 'run agents:compat' : 'take upstream';
}

function compatErrorPath(message: string): string {
  const m = /(?:^|\s|:)((?:\.[\w-]+|[\w-]+)(?:\/[\w.-]+)+\.\w+)/.exec(message);
  if (m) { return m[1]; }
  const host = /(claude|opencode|codex)\b/i.exec(message);
  if (host && /MCP/.test(message)) { return MCP_HOST_FILE[host[1].toLowerCase()]; }
  if (/skills alias|\.claude\/skills/.test(message)) { return '.claude/skills'; }
  return '(compat)';
}

// ============================================================================
// COLLECTOR
// ============================================================================

function readIfExists(filePath: string): string | null {
  try { return fs.readFileSync(filePath, 'utf8'); }
  catch { return null; }
}

function watchedSurface(filePath: string): ParitySurface {
  if (filePath === '.mcp.json' || filePath === 'opencode.jsonc' || filePath === '.codex/config.toml') { return 'mcp'; }
  if (filePath === '.claude/settings.json') { return 'hooks'; }
  return 'instructions';
}

/**
 * Wrappers on disk that no manifest (upstream, project overlay) produces, as the
 * compat engine sees them. Without a manifest there is nothing to compare
 * against, so a project that has not received `agent-compatibility` yet yields
 * nothing instead of throwing.
 */
function wrappersNoManifestProduced(root: string): string[] {
  try { return undeclaredCommandWrappers(root); }
  catch { return []; }
}

// ============================================================================
// ARCHIVED SKILLS (one nudge per skill)
// ============================================================================

function archivedSkillMarkerPath(root: string, skill: string): string {
  return path.join(root, ARCHIVED_SKILL_MARKER_DIR, `archived-skill-${skill.replace(/[^a-z0-9.-]+/gi, '_')}.marker`);
}

/**
 * Archived skills that still need a row: what THIS run archived (the migration
 * result, carried into the re-exec child by the wrapper) plus any directory
 * under `archivedSkillsDir` that was never nudged. A skill whose marker exists
 * is skipped, so the row appears once even though the archive dir (gitignored,
 * per developer) stays on disk until the user deletes it.
 */
export function archivedSkillsToReport(root: string, archivedSkillsDir: string, thisRun: readonly string[]): string[] {
  const names = new Set(thisRun);
  try {
    for (const d of fs.readdirSync(archivedSkillsDir, { withFileTypes: true })) {
      if (d.isDirectory()) { names.add(d.name); }
    }
  }
  catch { /* no archive dir: only this run's names, if any */ }
  return [...names].sort().filter(skill => !fs.existsSync(archivedSkillMarkerPath(root, skill)));
}

/** Write the one-nudge marker for each reported skill. Non-fatal: worst case we nudge again. */
export function persistArchivedSkillMarkers(root: string, skills: readonly string[]): void {
  for (const skill of skills) {
    try {
      const marker = archivedSkillMarkerPath(root, skill);
      fs.mkdirSync(path.dirname(marker), { recursive: true });
      fs.writeFileSync(marker, `${new Date().toISOString()}\n`);
    }
    catch { /* non-fatal */ }
  }
}

export interface GitStrategyStamp {
  present: boolean
  strategy: string | null
  source: string | null
}

/** `git_strategy` provenance from `.agents/project.yaml`, regex-read (no YAML parser in `cli/`). */
export function readGitStrategyStamp(projectYaml: string | null): GitStrategyStamp {
  if (projectYaml === null || !/^git_strategy:/m.test(projectYaml)) { return { present: false, strategy: null, source: null }; }
  const strategy = /^ {2}strategy:\s*([\w-]+)/m.exec(projectYaml)?.[1] ?? null;
  const source = /^\s+strategy_source:\s*([\w-]+)/m.exec(projectYaml)?.[1] ?? null;
  return { present: true, strategy, source };
}

/**
 * Build the findings for this run. Reads the two trees and shells `git diff
 * --no-index` for counts; writes nothing.
 */
export function collectParityFindings(input: ParityInput): ParityFinding[] {
  const findings: Omit<ParityFinding, 'id'>[] = [];

  // 1. Watched files that drifted: section-level evidence, full diff for the
  //    file. Kept aside until the compat errors are known: a compat error on
  //    the same path folds the drift into its (blocking) row.
  const drifted = new Map<string, Omit<ParityFinding, 'id'>>();
  for (const entry of input.drift) {
    const project = readIfExists(path.join(input.root, entry.path));
    const upstream = readIfExists(path.join(input.upstreamDir, entry.path));
    if (project === null || upstream === null) { continue; }
    const diff = diffNoIndex(path.join(input.root, entry.path), path.join(input.upstreamDir, entry.path));
    drifted.set(entry.path, {
      surface: watchedSurface(entry.path),
      path: entry.path,
      evidence: describeWatchedFile(entry.path, project, upstream, diff),
      suggested: 'merge',
      blocking: false,
      diff,
    });
  }

  // 2. Compat errors. MCP set errors fold into one finding per host; a wrapper
  //    no manifest declares is one row per path; the rest stay one finding
  //    each. All of them block: the contract failed. A drifted watched file on
  //    the same path folds in: compat evidence first, drift evidence appended,
  //    the full diff kept for the saved file, and upstream's shape suggested.
  const compat: Omit<ParityFinding, 'id'>[] = [];
  const pushCompat = (finding: Omit<ParityFinding, 'id'>): void => {
    const drift = drifted.get(finding.path);
    if (!drift) { compat.push(finding); return; }
    drifted.delete(finding.path);
    compat.push({
      ...finding,
      evidence: `${finding.evidence}; ${drift.evidence}`,
      suggested: 'take upstream',
      diff: drift.diff,
    });
  };
  const wrappersReported = new Set<string>();
  const mcpByHost = new Map<string, { missing: string[], extra: string[] }>();
  for (const error of input.compatErrors) {
    const undeclared = WRAPPER_UNDECLARED_RE.exec(error);
    if (undeclared) {
      wrappersReported.add(undeclared[1]);
      pushCompat({ surface: 'commands', path: undeclared[1], evidence: WRAPPER_UNDECLARED_EVIDENCE, suggested: 'add to overlay', blocking: true });
      continue;
    }
    const missing = MCP_MISSING_RE.exec(error);
    const extra = MCP_EXTRA_RE.exec(error);
    const match = missing ?? extra;
    if (!match) {
      pushCompat({
        surface: compatErrorSurface(error),
        path: compatErrorPath(error),
        evidence: error,
        suggested: compatErrorSuggestion(error),
        blocking: true,
      });
      continue;
    }
    const host = match[2];
    const bucket = mcpByHost.get(host) ?? { missing: [], extra: [] };
    (missing ? bucket.missing : bucket.extra).push(match[1]);
    mcpByHost.set(host, bucket);
  }
  for (const [host, sets] of mcpByHost) {
    const parts: string[] = [];
    if (sets.missing.length > 0) { parts.push(`missing: ${sets.missing.join(', ')} (declared in .mcp.json)`); }
    if (sets.extra.length > 0) { parts.push(`only here: ${sets.extra.join(', ')} (not in .mcp.json)`); }
    pushCompat({
      surface: 'mcp',
      path: MCP_HOST_FILE[host] ?? host,
      evidence: parts.join('; '),
      suggested: sets.extra.length === 0 ? 'take upstream' : 'decide',
      blocking: true,
    });
  }
  findings.push(...drifted.values(), ...compat);

  // 3. Archived skills: the migration kept the legacy copy because upstream owns the name.
  for (const skill of input.archivedSkills) {
    const archived = path.join(input.archivedSkillsDir, skill);
    const canonical = path.join(input.root, '.agents', 'skills', skill);
    if (!fs.existsSync(archived)) { continue; }
    const diff = fs.existsSync(canonical) ? diffNoIndex(canonical, archived, { a: 'canonical', b: 'archived' }) : '';
    const stats = diffStats(diff);
    findings.push({
      surface: 'skills',
      path: path.relative(input.root, archived).replace(/\\/g, '/'),
      evidence: fs.existsSync(canonical)
        ? `archived collision vs .agents/skills/${skill}: ${formatStats(stats)}`
        : `archived; .agents/skills/${skill} no longer exists`,
      suggested: 'decide',
      blocking: false,
      diff: diff || undefined,
    });
  }

  // 4. Command wrappers no manifest knows about, when the compat check did not
  //    already name them (it did not run, or the manifest was missing then).
  for (const wrapper of wrappersNoManifestProduced(input.root)) {
    if (wrappersReported.has(wrapper)) { continue; }
    findings.push({
      surface: 'commands',
      path: wrapper,
      evidence: WRAPPER_UNDECLARED_EVIDENCE,
      suggested: 'add to overlay',
      blocking: false,
    });
  }

  // 5. Components held back this run, with the lock cursor each one stays at.
  if (input.heldBack.length > 0) {
    findings.push({
      surface: 'components',
      path: '.template/boilerplate.lock.json',
      evidence: `held back: ${input.heldBack.map(h => `${h.component}@${h.lockCommit ? h.lockCommit.slice(0, 7) : 'no lock'}`).join(', ')}`,
      suggested: 'decide',
      blocking: false,
    });
  }

  // 6. Env keys upstream documents and the project lacks.
  if (input.envNewKeys.length > 0) {
    findings.push({
      surface: 'env',
      path: '.env',
      evidence: `upstream .env.example added ${input.envNewKeys.length} key(s): ${input.envNewKeys.join(', ')}`,
      suggested: 'decide',
      blocking: false,
    });
  }

  // 7. Git strategy provenance: a shipped default nobody chose is a pending decision.
  const stamp = readGitStrategyStamp(readIfExists(path.join(input.root, '.agents', 'project.yaml')));
  if (fs.existsSync(path.join(input.root, '.agents', 'project.yaml'))) {
    if (!stamp.present) {
      findings.push({
        surface: 'git',
        path: '.agents/project.yaml',
        evidence: 'no git_strategy block (git-flow-master cannot read a branch policy)',
        suggested: 'decide',
        blocking: false,
      });
    }
    else if (stamp.source !== 'chosen') {
      findings.push({
        surface: 'git',
        path: '.agents/project.yaml',
        evidence: `git_strategy.meta.strategy_source: ${stamp.source ?? 'unset'} (strategy: ${stamp.strategy ?? 'unset'}, shipped default, never chosen)`,
        suggested: 'decide',
        blocking: false,
      });
    }
  }

  return findings.map((f, i) => ({ id: i + 1, ...f }));
}

// ============================================================================
// RENDERER
// ============================================================================

function surfaceRows(findings: ParityFinding[]): SurfaceRow[] {
  return SURFACE_ORDER.map((surface) => {
    const own = findings.filter(f => f.surface === surface);
    const state: SurfaceState = own.length === 0 ? 'ok' : own.some(f => f.blocking) ? 'blocked' : 'warn';
    const paths = [...new Set(own.map(f => f.path))];
    const shown = paths.slice(0, MAX_NAMES).join(', ') + (paths.length > MAX_NAMES ? ` (+${paths.length - MAX_NAMES})` : '');
    const cell = own.length === 0
      ? 'sin diferencias'
      : `${own.length} hallazgo${own.length === 1 ? '' : 's'}: ${shown}`;
    return { surface, label: SURFACE_LABEL_ES[surface], state, cell };
  });
}

function escapeCell(text: string): string {
  return text.replace(/\|/g, '\\|').replace(/\r?\n/g, ' ');
}

export function buildParityPrompt(findings: ParityFinding[], meta: ParityMeta): string {
  const upstream = meta.upstreamSha ? meta.upstreamSha.slice(0, 7) : 'unknown';
  const lock = meta.lockSha ? meta.lockSha.slice(0, 7) : 'none';
  const rows = findings.map(f => `| ${f.id} | ${SURFACE_LABEL_EN[f.surface]} | ${escapeCell(f.path)} | ${escapeCell(f.evidence)} | ${f.suggested} |`);
  // A GitHub handle has a raw URL per file; a local clone (UPEX_TEMPLATE_REPO=/path) does not.
  const isGitHubHandle = /^[\w.-]+\/[\w.-]+$/.test(meta.templateRepo);
  const copies = isGitHubHandle ? `; upstream copies: https://raw.githubusercontent.com/${meta.templateRepo}/main/<path>` : '';
  return [
    `Parity review after \`bun run up\` (upstream ${meta.templateRepo}@${upstream}, project lock ${lock}).`,
    'Present the table below to the user, one row per finding, and WAIT for a decision per row',
    '(keep project | take upstream | merge) BEFORE editing anything. Then apply only the chosen rows,',
    'run tests -> types -> lint, and report.',
    `Full diffs per row live in ${meta.promptFile}${copies}.`,
    'Rows marked BLOCKING failed a compatibility contract and must be resolved for `bun run agents:compat:check` to pass.',
    '',
    '| # | Surface | File | What differs (evidence) | Suggested |',
    '|---|---|---|---|---|',
    ...rows.map((row, i) => (findings[i].blocking ? row.replace(/ \|$/, ' (BLOCKING) |') : row)),
    '',
    'Post-merge: bun run agents:compat && bun run agents:compat:check && bun run repo:check',
  ].join('\n');
}

export function buildParityFileBody(findings: ParityFinding[], meta: ParityMeta): string {
  const today = new Date().toISOString().slice(0, 10);
  const evidence = findings.filter(f => f.diff).flatMap(f => [
    `### ${f.id}. ${f.path}`,
    '',
    f.evidence,
    '',
    '```diff',
    f.diff!.trimEnd(),
    '```',
    '',
  ]);
  return [
    '# Parity plan — AI review prompt',
    '',
    `> **AUTO-GENERATED, SINGLE-USE.** Written by \`bun run up\` on ${today}.`,
    '> Paste the prompt below into your AI session, then delete this file.',
    '> It is regenerated (overwritten) on every run that ends with findings.',
    '',
    '```text',
    buildParityPrompt(findings, meta),
    '```',
    '',
    ...(evidence.length > 0 ? ['## Evidence (full diffs: `+` is what upstream has, `-` is what the project has)', '', ...evidence] : []),
  ].join('\n');
}

export function renderParityReport(findings: ParityFinding[], meta: ParityMeta): ParityReport {
  return {
    surfaces: surfaceRows(findings),
    prompt: buildParityPrompt(findings, meta),
    fileBody: buildParityFileBody(findings, meta),
  };
}

// ============================================================================
// EXIT VERDICT (--strict, aborts)
// ============================================================================

export interface StrictVerdict {
  exitCode: 0 | 1
  /** One line, or null when exit 0. */
  reason: string | null
}

/** Exit 1 under `--strict` when any finding blocks; warn + exit 0 otherwise. */
export function strictVerdict(strict: boolean, findings: ParityFinding[]): StrictVerdict {
  const blocking = findings.filter(f => f.blocking);
  if (!strict || blocking.length === 0) { return { exitCode: 0, reason: null }; }
  const paths = [...new Set(blocking.map(f => f.path))];
  return {
    exitCode: 1,
    reason: `--strict: ${blocking.length} hallazgo(s) bloqueante(s) de compatibilidad (${paths.slice(0, MAX_NAMES).join(', ')}${paths.length > MAX_NAMES ? ', …' : ''}). Corrige y vuelve a correr \`bun run agents:compat:check\`.`,
  };
}

export interface RunVerdict extends StrictVerdict {
  /** The closing line the wrapper prints through `tui.outro`. */
  outro: string
}

export const ABORTED_OUTRO = 'Abortado.';

/**
 * What the process reports at the end. An aborted run (a preflight refusal:
 * dirty tree, corrupt lock, clone failure, a declined migration or
 * self-update) is never a success: exit 1 and `Abortado.` in every mode. An
 * explicit prompt cancel (Ctrl-C) never reaches here: it throws and exits 130.
 * Otherwise `--strict` decides, and the outro names the mode.
 */
export function runVerdict(
  run: { aborted: boolean, dryRun: boolean, strict: boolean },
  findings: ParityFinding[],
): RunVerdict {
  if (run.aborted) { return { exitCode: 1, reason: null, outro: ABORTED_OUTRO }; }
  const strict = strictVerdict(run.strict, findings);
  if (strict.exitCode !== 0) { return { ...strict, outro: 'Sincronizacion completada con contratos rotos (--strict).' }; }
  return { ...strict, outro: run.dryRun ? 'Dry-run completado.' : 'Sincronizacion completada.' };
}
