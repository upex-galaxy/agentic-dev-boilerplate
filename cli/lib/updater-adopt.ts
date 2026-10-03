/**
 * @fileoverview The `--adopt` first-run policy: what `bun run up --adopt` does
 * on an EXISTING application, beyond the file sync itself.
 *
 * The core (`runUpdate` with `adopt: true`) already guarantees the sync never
 * overwrites a file the app carries: absent paths are delivered, identical ones
 * are marked seen, different ones come back as `RunSummary.adoptCollisions`.
 * This module turns that run into an adopted repo, from one afterApply hook:
 *
 *  - `.env.example`: the app's file is kept; the variables the tooling reads
 *    are appended inside one sentinel block, like the ignore files.
 *  - `.agents/project.yaml`: when this run delivered it, it is re-seeded from
 *    `.agents/project.schema.yaml` (identity null, `git_strategy` inherited),
 *    never left as the maintainer's filled copy, and every collision is listed
 *    under `updater.protected_paths` so no later `bun run up` overwrites it.
 *  - Instructions: an app that carries its own `AGENTS.md` and/or `CLAUDE.md`
 *    gets ONE proposal (upstream `AGENTS.md` with the app's text verbatim under
 *    a top `## 0.` block, `CLAUDE.md` as the `@AGENTS.md` shim, originals in
 *    the run's backup), applied only on an explicit yes. Otherwise the
 *    composed file is saved for review and the row blocks.
 *  - `.template/installer.lock.json` records `adopted: true`, which
 *    `cli/install.ts` (`verifyRepoRoot`) accepts as "bootstrapped project".
 *  - Parity rows for all of it, plus one BLOCKING row per `package.json`
 *    script the app kept under a name upstream also defines.
 *  - Tooling isolation (`./adopt-isolation.ts`): one BLOCKING row per app
 *    config (tsconfig, ESLint, a foreign hook manager) that still reaches the
 *    tooling, with the lines to add; the app's file itself is never written.
 *
 * Nothing here runs on a plain `bun run up` or on a greenfield first run.
 */

import type { HiddenPath, ReincludeOutcome } from './adopt-gitignore.ts';
import type { ParityFinding, ParitySurface } from './updater-parity';
import type { AdoptCollision, IgnoreLineWithheld, PackageJsonKeptKey } from './updater-types';
import { spawnSync } from 'node:child_process';
import * as fs from 'node:fs';
import * as path from 'node:path';

import { parse as parseYaml } from 'yaml';
import { hiddenPaths } from './adopt-gitignore.ts';
import { ADOPT_ISOLATION_PROMPT, analyzeIsolation, isolationFindings, isolationPrompt } from './adopt-isolation.ts';
import { CLAUDE_INSTRUCTIONS_SHIM } from './agent-compatibility.ts';
import { SCHEMA_FILE, SCHEMA_SOURCE, seedFromSchema } from './agents-schema.ts';
import { resetGitStrategyProvenance } from './git-strategy-provenance.ts';
import { detectHookManager, withoutHuskyStep } from './hook-manager.ts';
import { collectUpstreamOwned, writeUpstreamOwned } from './tooling-scope.ts';
import { createBackupDir, normalizeWhitespace } from './updater-core';
import { diffNoIndex, PROTECT_HINT, protectNote } from './updater-parity';

/**
 * Upstream paths an adopted app never receives, on the `--adopt` run and on
 * every plain run after it (`UpdaterConfig.repoOnlyPatterns`):
 *  - the boilerplate's own numbered ADRs would land in the app's decision log
 *    and take its numbers (the ADR README and `ADR-NNNN-template.md` travel);
 *  - the tooling's own test files: they verify the boilerplate in its CI, and
 *    an app's test runner picks them up (measured: `bun test lib` matched
 *    `cli/lib/*.test.ts` and the app's suite went red on the boilerplate's
 *    self-checks).
 */
export const ADOPT_REPO_ONLY_PATTERNS: RegExp[] = [
  /^\.context\/ADR\/ADR-\d{4}-/,
  /^(?:cli|scripts)\/.*\.test\.[cm]?[jt]s$/,
  /^\.agents\/skills\/[^/]+\/.*\.test\.[cm]?[jt]s$/,
];

/**
 * Agentic files the `--adopt` run delivers when the app lacks them. Each is on
 * the protected watchlist and owned by no synced component, so the sync never
 * creates one (a greenfield project gets it from the scaffold). `AGENTS.md`
 * is handled with the instructions; `tsconfig.json` and `eslint.config.js`
 * are the app's own configs and are never created here.
 */
export const ADOPT_DELIVER_IF_ABSENT: readonly string[] = ['.mcp.json', 'opencode.jsonc'];

/** Tracked sentinel `cli/install.ts` reads to accept a renamed `package.json`. */
export const INSTALLER_LOCK_FILE = '.template/installer.lock.json';

/** The template handle `verifyRepoRoot` (`cli/install.ts`) accepts in the installer lock. */
export const CANONICAL_TEMPLATE = 'upex-galaxy/agentic-dev-boilerplate';

/** Opens the block of tooling variables appended to an app's own `.env.example`. */
export const ADOPT_ENV_SENTINEL = '# ===== Synced from boilerplate: variables the agentic tooling reads =====';

/** The top block of an adopted `AGENTS.md` that carries the app's own instruction text. */
export const ADOPT_INSTRUCTIONS_HEADING = '## 0. Project instructions (pre-adoption)';

/** Where a composed `AGENTS.md` waits for review when it was not applied (gitignored, single-use). */
export const ADOPT_INSTRUCTIONS_PROMPT = path.join('.agents', 'prompts', 'adopt-instructions.md');

/**
 * Where `--adopt` saves upstream's copy of each framework skill the app had
 * copied in by hand (gitignored with `.agents/prompts/`, single-use):
 * `project-adoption` replaces the app's copy from here on its own approval
 * line, after backing the app's copy up.
 */
export const ADOPT_UPSTREAM_SKILLS_DIR = path.join('.agents', 'prompts', 'adopt-upstream');

/** A framework skill the app already carried (an older hand copy): kept this run, `take upstream` proposed. */
export interface FrameworkSkillCollision {
  name: string
  /** Files of upstream's copy that differ in the app's copy. */
  differing: string[]
  /** Files only the app's copy has (they move to the backup when upstream's copy is taken). */
  appOnly: string[]
  /** `git diff --no-index --shortstat` of the app copy against upstream's. */
  shortstat: string
  /** Where upstream's copy was saved (null on --dry-run). */
  saved: string | null
}

function filesOf(dir: string): string[] {
  const out: string[] = [];
  const walk = (abs: string): void => {
    let entries: fs.Dirent[];
    try { entries = fs.readdirSync(abs, { withFileTypes: true }); }
    catch { return; }
    for (const e of entries) {
      const child = path.join(abs, e.name);
      if (e.isDirectory()) { walk(child); }
      else if (e.isFile()) { out.push(path.relative(dir, child).replace(/\\/g, '/')); }
    }
  };
  walk(dir);
  return out.sort();
}

/**
 * The collisions that sit inside a skill folder upstream ships: the app's
 * hand copy of a FRAMEWORK skill, not an app file. Grouped by skill.
 */
export function frameworkSkillGroups(collisions: readonly string[], upstreamDir: string): Map<string, string[]> {
  const groups = new Map<string, string[]>();
  for (const p of collisions) {
    const m = /^\.agents\/skills\/([^/]+)\//.exec(p);
    if (!m || !fs.existsSync(path.join(upstreamDir, '.agents', 'skills', m[1], 'SKILL.md'))) { continue; }
    groups.set(m[1], [...(groups.get(m[1]) ?? []), p]);
  }
  return groups;
}

function describeFrameworkSkill(root: string, upstreamDir: string, name: string, files: readonly string[]): Omit<FrameworkSkillCollision, 'saved'> {
  const appDir = path.join(root, '.agents', 'skills', name);
  const upDir = path.join(upstreamDir, '.agents', 'skills', name);
  const upstreamFiles = new Set(filesOf(upDir));
  const stat = spawnSync('git', ['diff', '--no-index', '--shortstat', '--', appDir, upDir], { encoding: 'utf8' });
  return {
    name,
    differing: files.map(f => f.slice(`.agents/skills/${name}/`.length)).sort(),
    appOnly: filesOf(appDir).filter(f => !upstreamFiles.has(f)),
    shortstat: (stat.stdout ?? '').trim(),
  };
}

/** Scripts whose collision gets a composition proposal: both halves must run for setup to work. */
const COMPOSABLE_SCRIPTS = new Set(['prepare', 'setup']);

const AGENTS_FILE = 'AGENTS.md';
const CLAUDE_FILE = 'CLAUDE.md';
const ENV_EXAMPLE = '.env.example';

// ============================================================================
// .env.example
// ============================================================================

/** Keys a `.env.example` declares, commented declarations (`# KEY=`) included. */
export function envDeclaredKeys(text: string): Set<string> {
  const keys = new Set<string>();
  for (const raw of text.split(/\r?\n/)) {
    const line = raw.trim().replace(/^#+\s*/, '').replace(/^export\s+/, '');
    const m = /^([A-Z_][A-Z0-9_]*)\s*=/.exec(line);
    if (m) { keys.add(m[1]); }
  }
  return keys;
}

/**
 * Append, inside one sentinel block at the end of the app's `.env.example`,
 * the upstream declarations whose key the app does not declare. Never edits a
 * line the app wrote; a re-run adds only what is still missing.
 */
export function appendEnvExampleBlock(local: string, upstream: string): { text: string, added: string[] } {
  const present = envDeclaredKeys(local);
  const lines: string[] = [];
  const added: string[] = [];
  for (const raw of upstream.split(/\r?\n/)) {
    const line = raw.trim().replace(/^#+\s*/, '').replace(/^export\s+/, '');
    const m = /^([A-Z_][A-Z0-9_]*)\s*=/.exec(line);
    if (!m || present.has(m[1]) || added.includes(m[1])) { continue; }
    lines.push(raw.trimEnd());
    added.push(m[1]);
  }
  if (added.length === 0) { return { text: local, added }; }

  const eol = /\r\n/.test(local) ? '\r\n' : '\n';
  const body = local.replace(/(?:\r?\n)*$/, '');
  const hasBlock = local.split(/\r?\n/).some(l => l.trim().startsWith(ADOPT_ENV_SENTINEL));
  const head = hasBlock ? [] : ['', ADOPT_ENV_SENTINEL, '# Empty on purpose: the values go in .env (see bun run setup).'];
  const text = [body, ...head, ...lines].join(eol) + eol;
  return { text: body === '' ? text.replace(/^(?:\r?\n)+/, '') : text, added };
}

// ============================================================================
// INSTRUCTIONS
// ============================================================================

export interface AdoptInstructionSource {
  file: 'AGENTS.md' | 'CLAUDE.md'
  text: string
}

export type AdoptInstructionsPlan
  /** `AGENTS.md` is upstream's and `CLAUDE.md` is the exact shim: nothing to do. */
  = | { kind: 'none' }
  /** `AGENTS.md` is upstream's; `CLAUDE.md` is absent or a loose shim: write the exact shim. */
    | { kind: 'shim' }
  /** No instruction text anywhere: deliver upstream `AGENTS.md` and the shim. */
    | { kind: 'deliver' }
  /** The app carries its own instruction text: one proposal, applied only on approval. */
    | { kind: 'compose', sources: AdoptInstructionSource[] };

function isShim(text: string): boolean {
  return text.trim() === CLAUDE_INSTRUCTIONS_SHIM.trim();
}

/** What the app's instruction files need. `upstreamAgents` null = upstream ships none (nothing to deliver). */
export function planAdoptInstructions(root: string, upstreamAgents: string | null): AdoptInstructionsPlan {
  if (upstreamAgents === null) { return { kind: 'none' }; }
  const read = (file: string): string | null => {
    try { return fs.readFileSync(path.join(root, file), 'utf8'); }
    catch { return null; }
  };
  const agents = read(AGENTS_FILE);
  const claude = read(CLAUDE_FILE);

  const sources: AdoptInstructionSource[] = [];
  const agentsIsUpstream = agents !== null && normalizeWhitespace(agents) === normalizeWhitespace(upstreamAgents);
  if (agents !== null && !agentsIsUpstream && agents.trim() !== '') { sources.push({ file: AGENTS_FILE, text: agents }); }
  if (claude !== null && !isShim(claude) && claude.trim() !== '') { sources.push({ file: CLAUDE_FILE, text: claude }); }
  if (sources.length > 0) { return { kind: 'compose', sources }; }

  if (!agentsIsUpstream) { return { kind: 'deliver' }; }
  return claude === CLAUDE_INSTRUCTIONS_SHIM ? { kind: 'none' } : { kind: 'shim' };
}

/**
 * Upstream `AGENTS.md` with the app's text, verbatim, in a top `## 0.` block
 * placed before the first numbered section (`## 1.`).
 */
export function composeAdoptedInstructions(upstreamAgents: string, sources: readonly AdoptInstructionSource[], archiveRel: string | null): string {
  const block: string[] = [
    ADOPT_INSTRUCTIONS_HEADING,
    '',
    `> Preserved verbatim by \`bun run up --adopt\` from the instruction file(s) this application carried before adoption${archiveRel ? ` (originals archived in \`${archiveRel}/\`)` : ''}. The numbered sections after this block are the boilerplate's. Where the two disagree, decide which rule wins and say so here.`,
    '',
  ];
  for (const source of sources) {
    block.push(`### From \`${source.file}\``, '', source.text.replace(/\s+$/, ''), '');
  }
  block.push('---', '');

  const lines = upstreamAgents.split('\n');
  let at = lines.findIndex(l => /^## 1[.\s]/.test(l));
  if (at === -1) {
    const h1 = lines.findIndex(l => l.startsWith('# '));
    at = h1 === -1 ? 0 : h1 + 1;
    if (at > 0) { block.unshift(''); }
  }
  return [...lines.slice(0, at), ...block, ...lines.slice(at)].join('\n');
}

// ============================================================================
// .agents/project.yaml
// ============================================================================

/**
 * The adopting app's `.agents/project.yaml`: seeded from upstream's schema
 * (identity null, `git_strategy` inherited), or, for a template older than the
 * schema, the delivered copy with its git-strategy provenance reset.
 */
export function seedAdoptedProjectYaml(delivered: string, schema: string | null): string {
  const seeded = schema === null ? null : seedFromSchema(schema);
  return seeded ?? resetGitStrategyProvenance(delivered).content;
}

/**
 * List `paths` under `updater.protected_paths`, as a block sequence, only when
 * that list is empty (`[]`) or the `updater:` block is absent. A list the
 * project already wrote is never edited: returns null. The result is
 * re-parsed and must hold exactly `paths`, or null.
 */
export function withProtectedPaths(yaml: string, paths: readonly string[]): string | null {
  const wanted = [...new Set(paths)].sort();
  if (wanted.length === 0) { return yaml; }
  const items = wanted.map(p => `    - ${JSON.stringify(p)}`);

  const lines = yaml.split('\n');
  const updaterAt = lines.findIndex(l => /^updater:\s*(?:#.*)?$/.test(l));
  let next: string;
  if (updaterAt === -1) {
    next = `${yaml.replace(/\n*$/, '\n')}\nupdater:\n  protected_paths: # app files kept by bun run up --adopt\n${items.join('\n')}\n`;
  }
  else {
    let found = -1;
    for (let i = updaterAt + 1; i < lines.length; i += 1) {
      const line = lines[i];
      if (line.trim() === '' || line.trimStart().startsWith('#')) { continue; }
      if (!/^\s/.test(line)) { break; }
      if (/^ {2}protected_paths:/.test(line)) { found = i; break; }
    }
    if (found === -1) { return null; }
    const m = /^ {2}protected_paths:\s*\[\s*\]\s*(#.*)?$/.exec(lines[found]);
    if (!m) { return null; }
    lines.splice(found, 1, `  protected_paths:${m[1] ? ` ${m[1]}` : ''}`, ...items);
    next = lines.join('\n');
  }

  try {
    const parsed = parseYaml(next) as { updater?: { protected_paths?: unknown } } | null;
    const got = parsed?.updater?.protected_paths;
    if (!Array.isArray(got) || got.length !== wanted.length || got.some((v, i) => v !== wanted[i])) { return null; }
  }
  catch {
    return null;
  }
  return next;
}

// ============================================================================
// INSTALLER LOCK
// ============================================================================

/** Record `adopted: true` in `.template/installer.lock.json`, keeping whatever else it holds. */
export function writeInstallerLock(root: string): void {
  const file = path.join(root, INSTALLER_LOCK_FILE);
  let current: Record<string, unknown> = {};
  try {
    const parsed = JSON.parse(fs.readFileSync(file, 'utf8')) as unknown;
    if (parsed !== null && typeof parsed === 'object' && !Array.isArray(parsed)) { current = parsed as Record<string, unknown>; }
  }
  catch { current = {}; }
  const next = { ...current, template: typeof current.template === 'string' ? current.template : CANONICAL_TEMPLATE, adopted: true };
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, `${JSON.stringify(next, null, 2)}\n`);
}

/** True when the installer lock says this repo was adopted. */
export function isAdopted(root: string): boolean {
  try {
    const parsed = JSON.parse(fs.readFileSync(path.join(root, INSTALLER_LOCK_FILE), 'utf8')) as { adopted?: unknown };
    return parsed.adopted === true;
  }
  catch {
    return false;
  }
}

// ============================================================================
// PARITY ROWS
// ============================================================================

/**
 * `"prepare": "<app> && <upstream>"` for a `prepare` / `setup` collision, else
 * null. A step both sides already run (`husky`) appears once, the app's first.
 * With `foreignHooks` (the app's hooks run on another manager) upstream's
 * `husky` step is left out: it would switch the app's hooks off.
 */
export function scriptCompositionProposal(key: string, local: string, upstream: string, foreignHooks = false): string | null {
  if (!COMPOSABLE_SCRIPTS.has(key)) { return null; }
  const steps = (cmd: string): string[] => cmd.split('&&').map(part => part.trim()).filter(Boolean);
  const composed = [...steps(local)];
  const upstreamSteps = foreignHooks ? steps(withoutHuskyStep(upstream) ?? '') : steps(upstream);
  for (const step of upstreamSteps) {
    if (!composed.includes(step)) { composed.push(step); }
  }
  return `${JSON.stringify(key)}: ${JSON.stringify(composed.join(' && '))}`;
}

/** At most `max` names, then `+N more`. */
function someNames(names: readonly string[], max = 6): string {
  return names.length <= max ? names.join(', ') : `${names.slice(0, max).join(', ')} +${names.length - max} more`;
}

/** One row per skill folder under `.agents/skills/`, one per file elsewhere. */
function collisionGroups(paths: readonly string[]): Map<string, string[]> {
  const groups = new Map<string, string[]>();
  for (const p of [...paths].sort()) {
    const skill = /^(\.agents\/skills\/[^/]+\/)/.exec(p);
    const key = skill ? skill[1] : p;
    groups.set(key, [...(groups.get(key) ?? []), p]);
  }
  return groups;
}

function surfaceFor(p: string): ParitySurface {
  if (p.startsWith('.agents/skills/')) { return 'skills'; }
  if (p === ENV_EXAMPLE) { return 'env'; }
  return 'components';
}

export interface AdoptRowsInput {
  root: string
  upstreamDir: string
  /** Collisions other than `.env.example` (that one has its own row). */
  collisions: readonly string[]
  /** App files at paths upstream retired (`deprecatedFiles`): kept, never deleted. */
  retired?: readonly string[]
  /** The app's hand copies of framework skills (`frameworkSkillGroups`). */
  frameworkSkills?: readonly FrameworkSkillCollision[]
  /** True when `collisions` are listed in `updater.protected_paths` (this run, or would be on a real run). */
  protectedWritten: boolean
  envAdded: readonly string[]
  envCollision: boolean
  scriptsKept: readonly PackageJsonKeptKey[]
  instructions: AdoptInstructionsOutcome
  /** The app's hooks run on a manager other than husky (`./hook-manager.ts`). */
  foreignHooks?: boolean
  /** The agentic store the app's `.gitignore` hid, and what re-included it. */
  reinclude?: ReincludeOutcome | null
  /** Delivered paths the app's `.gitignore` still hides (teammates never receive them). */
  hiddenDelivered?: readonly HiddenPath[]
  ignoreLinesWithheld?: readonly IgnoreLineWithheld[]
}

export interface AdoptInstructionsOutcome {
  kind: AdoptInstructionsPlan['kind']
  /** compose only: true = written, false = waiting for approval. */
  applied: boolean
  files: string[]
  /** compose: where the originals were archived (applied) or the composed file was saved (pending). */
  where: string | null
}

export function adoptFindings(input: AdoptRowsInput): Omit<ParityFinding, 'id'>[] {
  const rows: Omit<ParityFinding, 'id'>[] = [];

  const ins = input.instructions;
  if (ins.kind === 'compose') {
    const files = ins.files.map(f => `\`${f}\``).join(' and ');
    rows.push(ins.applied
      ? {
          surface: 'instructions',
          path: AGENTS_FILE,
          evidence: `the app's instructions (${files}) preserved verbatim under "${ADOPT_INSTRUCTIONS_HEADING}"; originals in ${ins.where ?? 'the run backup'}; ${CLAUDE_FILE} is now the @AGENTS.md shim`,
          suggested: 'keep project',
          blocking: false,
        }
      : {
          surface: 'instructions',
          path: AGENTS_FILE,
          evidence: `the app's instructions (${files}) are not merged yet: the proposal (upstream ${AGENTS_FILE} with the app text verbatim under "${ADOPT_INSTRUCTIONS_HEADING}", ${CLAUDE_FILE} as the @AGENTS.md shim) needs an explicit yes; ${ins.where ? `saved for review in ${ins.where}` : 'not saved (--dry-run)'}`,
          suggested: 'decide',
          blocking: true,
          note: `Review the composed file, copy it over ${AGENTS_FILE}, write ${CLAUDE_FILE} as the single line \`@AGENTS.md\`, then run \`bun run agents:compat\`. --adopt is first-run only, so this step is by hand.`,
        });
  }

  for (const [group, files] of collisionGroups(input.collisions)) {
    const single = files.length === 1 && group === files[0];
    const protectedClause = input.protectedWritten
      ? 'listed in updater.protected_paths, so no later sync overwrites it'
      : `NOT protected yet: ${PROTECT_HINT}, or the next \`bun run up\` overwrites it`;
    rows.push({
      surface: surfaceFor(group),
      path: group,
      evidence: `${single ? 'app file' : `${files.length} app file(s)`} kept (--adopt never overwrites what the app already has); upstream ships a different copy; ${protectedClause}`,
      suggested: 'merge',
      blocking: !input.protectedWritten,
      ...(single ? { diff: diffNoIndex(path.join(input.root, group), path.join(input.upstreamDir, group)) || undefined } : { detail: files.join('\n') }),
      note: input.protectedWritten
        ? 'To take upstream\'s copy later: remove the path from updater.protected_paths in .agents/project.yaml, then run bun run up.'
        : protectNote(single ? group : files[0]),
    });
  }

  for (const skill of input.frameworkSkills ?? []) {
    const detail = [
      `differs from upstream: ${skill.differing.join(', ')}`,
      ...(skill.appOnly.length > 0 ? [`only in the app's copy (moves to the backup when upstream's is taken): ${skill.appOnly.join(', ')}`] : []),
      ...(skill.shortstat ? [skill.shortstat] : []),
    ].join('\n');
    rows.push({
      surface: 'skills',
      path: `.agents/skills/${skill.name}/`,
      evidence: `the app carries its own copy of the framework skill \`${skill.name}\` (${skill.differing.length} file(s) differ from upstream${skill.appOnly.length > 0 ? `, ${skill.appOnly.length} only in the app's copy` : ''}${skill.shortstat ? `; ${skill.shortstat}` : ''}); kept this run and NOT protected, so it does not freeze on this copy`,
      suggested: 'take upstream',
      blocking: false,
      detail,
      note: skill.saved
        ? `Upstream's copy is saved in ${skill.saved}/. \`project-adoption\` applies it on its own approval line: the app's copy goes to .backups/project-adoption/ first. Review the detail for app-specific edits before approving.`
        : 'On the real run upstream\'s copy is saved under .agents/prompts/adopt-upstream/ for project-adoption to apply.',
    });
  }

  for (const file of input.retired ?? []) {
    rows.push({
      surface: surfaceFor(file),
      path: file,
      evidence: `app file kept at a path upstream retired (--adopt never deletes what the app already has); ${input.protectedWritten
        ? 'listed in updater.protected_paths, so no later sync deletes it'
        : `NOT protected yet: ${PROTECT_HINT}, or the next \`bun run up\` deletes it`}`,
      suggested: 'keep project',
      blocking: !input.protectedWritten,
      note: input.protectedWritten
        ? 'Upstream no longer ships this path. Delete it by hand when the app no longer needs it, and drop it from updater.protected_paths.'
        : protectNote(file),
    });
  }

  const re = input.reinclude;
  if (re && re.hidden.length > 0) {
    const rules = [...new Set(re.hidden.map(h => `\`${h.pattern}\` (${h.source})`))].join(', ');
    rows.push(re.stillHidden.length === 0
      ? {
          surface: 'components',
          path: '.gitignore',
          evidence: `the app's ${rules} hid the agentic store; re-included with ${re.added.map(a => `\`${a}\``).join(', ')} in an appended block, the app's own lines untouched`,
          suggested: 'keep project',
          blocking: false,
          note: 'Without it the adoption commit versions nothing under .agents/ and the moved .claude/skills disappear from git. Drop the block only if the team decides to keep the agentic layer local.',
        }
      : {
          surface: 'components',
          path: '.gitignore',
          evidence: `the app's ${rules} still hide${re.stillHidden.length === 1 ? 's' : ''} ${re.stillHidden.map(h => h.path).join(', ')}: the agentic store would not be versioned`,
          suggested: 'decide',
          blocking: true,
          note: 'Re-include .agents/ by hand (a `!/.agents/` line, plus `!/.agents/**` when a rule hides its children), then confirm with `git check-ignore -v .agents/project.yaml` (no output).',
        });
  }

  for (const w of input.ignoreLinesWithheld ?? []) {
    rows.push({
      surface: 'components',
      path: w.file,
      evidence: `upstream line \`${w.line}\` NOT appended: it matches files the app tracks (${w.tracked.join(', ')}), so every new file there would be ignored`,
      suggested: 'keep project',
      blocking: false,
      note: `Upstream ignores its own \`${w.line}\` output; the app's folder of that name is source. If the app has build output there too, ignore it with a path the app's source does not share.`,
    });
  }

  for (const h of input.hiddenDelivered ?? []) {
    rows.push({
      surface: surfaceFor(h.path),
      path: h.path,
      evidence: `delivered, but the app's \`${h.pattern}\` (${h.source}) keeps it out of git: a teammate who clones never receives it`,
      suggested: 'keep project',
      blocking: false,
      note: `The app's ignore rule is its own decision and is never edited. Track the file with \`git add -f ${h.path}\` or a \`!/${h.path}\` line only if the team wants it shared.`,
    });
  }

  if (input.envCollision) {
    rows.push({
      surface: 'env',
      path: ENV_EXAMPLE,
      evidence: input.envAdded.length > 0
        ? `app file kept; ${input.envAdded.length} variable(s) the tooling reads appended inside the sentinel block: ${someNames(input.envAdded)}`
        : 'app file kept; it already declares every variable the tooling reads',
      suggested: 'keep project',
      blocking: false,
      ...(input.envAdded.length > 0 ? { detail: input.envAdded.join('\n') } : {}),
    });
  }

  for (const kept of input.scriptsKept) {
    const proposal = scriptCompositionProposal(kept.key, kept.localValue, kept.upstreamValue, input.foreignHooks === true);
    rows.push({
      surface: 'package',
      path: kept.file,
      evidence: `scripts.${kept.key}: the app's script kept, so upstream's \`${kept.key}\` never runs here${proposal ? `; proposed: ${proposal}` : ''}`,
      suggested: 'decide',
      blocking: true,
      detail: `app (kept):\n  ${kept.localValue}\nupstream:\n  ${kept.upstreamValue}${proposal ? `\nproposal:\n  ${proposal}` : ''}`,
    });
  }
  return rows;
}

// ============================================================================
// THE HOOK
// ============================================================================

export interface AdoptHookInput {
  root: string
  upstreamDir: string
  dryRun: boolean
  /** No prompt can be answered (`--auto`): the instructions proposal stays pending. */
  nonInteractive: boolean
  /** Repo-relative paths this run wrote. */
  appliedPaths: readonly string[]
  collisions: readonly AdoptCollision[]
  packageJsonKept: readonly PackageJsonKeptKey[]
  /** This run's backup dir, when the core created one. */
  backupDir: string | null
  /** The app's `.gitignore` hid the agentic store and the wrapper re-included it (`./adopt-gitignore.ts`). */
  reinclude?: ReincludeOutcome | null
  /** Upstream ignore lines the core withheld: they would hide files the app tracks. */
  ignoreLinesWithheld?: readonly IgnoreLineWithheld[]
  confirm: (message: string) => Promise<boolean>
  step: (message: string) => void
  warn: (message: string) => void
}

export interface AdoptOutcome {
  findings: Omit<ParityFinding, 'id'>[]
  /** Written under `updater.protected_paths` (or, on --dry-run, that would be). */
  protectedPaths: string[]
  yamlSeeded: boolean
  envAdded: string[]
  instructions: AdoptInstructionsOutcome
  /** `ADOPT_DELIVER_IF_ABSENT` files written this run (on --dry-run: that would be). */
  delivered: string[]
  installerLockWritten: boolean
  /** Where the tooling-isolation snippets were saved (null: nothing pending, or --dry-run). */
  isolationPrompt: string | null
  /** The app's hand copies of framework skills: kept, unprotected, upstream's copy saved. */
  frameworkSkills: FrameworkSkillCollision[]
}

function readOrNull(file: string): string | null {
  try { return fs.readFileSync(file, 'utf8'); }
  catch { return null; }
}

function relPosix(root: string, abs: string): string {
  return path.relative(root, abs).replace(/\\/g, '/');
}

/** Everything `--adopt` does after the sync landed. On --dry-run it writes nothing and reports what it would do. */
export async function runAdopt(input: AdoptHookInput): Promise<AdoptOutcome> {
  const { root, upstreamDir, dryRun } = input;
  // The app's hand copies of framework skills are NOT protected: protecting
  // them would freeze the app on a stale framework forever. Upstream's copy is
  // saved for `project-adoption` to apply on its own approval line.
  const frameworkGroups = frameworkSkillGroups(input.collisions.filter(c => c.retired !== true).map(c => c.path), upstreamDir);
  const inFrameworkSkill = new Set([...frameworkGroups.values()].flat());
  const collisionPaths = input.collisions.map(c => c.path).filter(p => !inFrameworkSkill.has(p));
  const frameworkSkills: FrameworkSkillCollision[] = [];
  for (const [name, files] of frameworkGroups) {
    let saved: string | null = null;
    if (!dryRun) {
      const dest = path.join(root, ADOPT_UPSTREAM_SKILLS_DIR, name);
      fs.rmSync(dest, { recursive: true, force: true });
      fs.cpSync(path.join(upstreamDir, '.agents', 'skills', name), dest, { recursive: true });
      saved = relPosix(root, dest);
    }
    frameworkSkills.push({ ...describeFrameworkSkill(root, upstreamDir, name, files), saved });
  }

  // 1. .env.example: the app's file stays, the tooling's variables are appended.
  const envCollision = collisionPaths.includes(ENV_EXAMPLE);
  let envAdded: string[] = [];
  if (envCollision) {
    const local = readOrNull(path.join(root, ENV_EXAMPLE));
    const upstream = readOrNull(path.join(upstreamDir, ENV_EXAMPLE));
    if (local !== null && upstream !== null) {
      const merged = appendEnvExampleBlock(local, upstream);
      envAdded = merged.added;
      if (!dryRun && merged.text !== local) { fs.writeFileSync(path.join(root, ENV_EXAMPLE), merged.text); }
      if (envAdded.length > 0) {
        input.step(`${dryRun ? '[dry-run] ' : ''}${ENV_EXAMPLE}: ${envAdded.length} variable(s) de la herramienta ${dryRun ? 'se añadirían' : 'añadidas'} en un bloque sentinel; el resto del archivo es de la app.`);
      }
    }
  }

  // 2. Instructions.
  const upstreamAgents = readOrNull(path.join(upstreamDir, AGENTS_FILE));
  const plan = planAdoptInstructions(root, upstreamAgents);
  const instructions: AdoptInstructionsOutcome = { kind: plan.kind, applied: false, files: [], where: null };
  if (plan.kind === 'deliver' && upstreamAgents !== null) {
    if (!dryRun) {
      fs.writeFileSync(path.join(root, AGENTS_FILE), upstreamAgents);
      fs.writeFileSync(path.join(root, CLAUDE_FILE), CLAUDE_INSTRUCTIONS_SHIM);
    }
    input.step(`${dryRun ? '[dry-run] se entregarían' : 'Entregados'} ${AGENTS_FILE} y el shim ${CLAUDE_FILE} (la app no tenía instrucciones).`);
  }
  else if (plan.kind === 'shim') {
    if (!dryRun) { fs.writeFileSync(path.join(root, CLAUDE_FILE), CLAUDE_INSTRUCTIONS_SHIM); }
  }
  else if (plan.kind === 'compose' && upstreamAgents !== null) {
    instructions.files = plan.sources.map(s => s.file);
    const ask = `La app tiene instrucciones propias (${instructions.files.join(' y ')}). ¿Componer ${AGENTS_FILE} = upstream + ese texto literal bajo "${ADOPT_INSTRUCTIONS_HEADING}", con ${CLAUDE_FILE} como shim y los originales en el backup?`;
    const approved = !dryRun && !input.nonInteractive && await input.confirm(ask);
    if (approved) {
      const backupDir = input.backupDir ?? createBackupDir(root);
      for (const source of plan.sources) { fs.copyFileSync(path.join(root, source.file), path.join(backupDir, source.file)); }
      const archiveRel = relPosix(root, backupDir);
      fs.writeFileSync(path.join(root, AGENTS_FILE), composeAdoptedInstructions(upstreamAgents, plan.sources, archiveRel));
      fs.writeFileSync(path.join(root, CLAUDE_FILE), CLAUDE_INSTRUCTIONS_SHIM);
      instructions.applied = true;
      instructions.where = archiveRel;
      input.step(`${AGENTS_FILE} compuesto; originales en ${archiveRel}/ (restaurables con --rollback).`);
    }
    else if (!dryRun) {
      const out = path.join(root, ADOPT_INSTRUCTIONS_PROMPT);
      fs.mkdirSync(path.dirname(out), { recursive: true });
      fs.writeFileSync(out, composeAdoptedInstructions(upstreamAgents, plan.sources, null));
      instructions.where = ADOPT_INSTRUCTIONS_PROMPT.replace(/\\/g, '/');
      input.warn(`Instrucciones de la app sin componer: propuesta guardada en ${instructions.where} para revisión.`);
    }
  }

  // 3. Agentic files no synced component creates (the MCP registries).
  const delivered: string[] = [];
  for (const rel of ADOPT_DELIVER_IF_ABSENT) {
    const upstream = path.join(upstreamDir, rel);
    if (fs.existsSync(path.join(root, rel)) || !fs.existsSync(upstream)) { continue; }
    if (!dryRun) { fs.copyFileSync(upstream, path.join(root, rel)); }
    delivered.push(rel);
  }
  if (delivered.length > 0) {
    input.step(`${dryRun ? '[dry-run] se entregarían' : 'Entregados'} (la app no los tenía): ${delivered.join(', ')}.`);
  }

  // 4. .agents/project.yaml: seeded from the schema when this run delivered it.
  const yamlPath = path.join(root, SCHEMA_SOURCE);
  const yamlDelivered = dryRun ? !fs.existsSync(yamlPath) : input.appliedPaths.includes(SCHEMA_SOURCE);
  let yamlSeeded = false;
  let protectedPaths: string[] = [];
  if (yamlDelivered) {
    const delivered = readOrNull(dryRun ? path.join(upstreamDir, SCHEMA_SOURCE) : yamlPath) ?? '';
    const seeded = seedAdoptedProjectYaml(delivered, readOrNull(path.join(upstreamDir, SCHEMA_FILE)));
    const withPaths = withProtectedPaths(seeded, collisionPaths);
    if (withPaths === null) {
      input.warn(`No se pudo listar las colisiones en updater.protected_paths de ${SCHEMA_SOURCE}; cada fila de la tabla dice cómo hacerlo a mano.`);
    }
    else {
      protectedPaths = collisionPaths.slice().sort();
    }
    if (!dryRun) { fs.writeFileSync(yamlPath, withPaths ?? seeded); }
    yamlSeeded = true;
    input.step(`${dryRun ? '[dry-run] ' : ''}${SCHEMA_SOURCE} ${dryRun ? 'se sembraría' : 'sembrado'} desde el schema (identidad en null, git_strategy inherited)${protectedPaths.length > 0 ? `; ${protectedPaths.length} ruta(s) de la app en updater.protected_paths` : ''}.`);
  }
  else if (collisionPaths.length > 0) {
    input.warn(`${SCHEMA_SOURCE} ya existía (de la app): no se edita. Las filas de colisión dicen qué rutas proteger.`);
  }

  // 5. The installer lock, with what upstream owns in the namespaces the app
  //    shares (`./tooling-scope.ts`): the isolation below and the tooling gates
  //    read it. The wrapper refreshes the list on every later sync.
  const owned = collectUpstreamOwned(upstreamDir, rel => ADOPT_REPO_ONLY_PATTERNS.some(re => re.test(rel)));
  if (!dryRun) {
    writeInstallerLock(root);
    writeUpstreamOwned(root, owned);
  }

  // 6. Tooling isolation: the app's tsconfig / ESLint config / hook manager
  //    still reach (or ignore) the tooling. Never edited: one blocking row
  //    each, every snippet saved in one file.
  const hooks = detectHookManager(root);
  const isolation = analyzeIsolation(root, hooks, owned);
  const isolationText = isolationPrompt(isolation);
  let isolationSaved: string | null = null;
  if (isolationText !== null && !dryRun) {
    const out = path.join(root, ADOPT_ISOLATION_PROMPT);
    fs.mkdirSync(path.dirname(out), { recursive: true });
    fs.writeFileSync(out, isolationText);
    isolationSaved = ADOPT_ISOLATION_PROMPT;
    input.warn(`Configs de la app que alcanzan la herramienta (nunca se editan): fragmentos guardados en ${ADOPT_ISOLATION_PROMPT}.`);
  }
  if (hooks.foreign) {
    input.step(`Hooks de la app en ${hooks.manager} (${hooks.evidence}): husky no se instala; las gates se llaman desde ${hooks.manager}.`);
  }

  const findings = adoptFindings({
    root,
    upstreamDir,
    collisions: input.collisions.filter(c => c.retired !== true && c.path !== ENV_EXAMPLE && !inFrameworkSkill.has(c.path)).map(c => c.path),
    frameworkSkills,
    retired: input.collisions.filter(c => c.retired === true).map(c => c.path),
    protectedWritten: protectedPaths.length > 0,
    envAdded,
    envCollision,
    scriptsKept: input.packageJsonKept.filter(k => k.section === 'scripts'),
    instructions,
    foreignHooks: hooks.foreign,
    reinclude: input.reinclude ?? null,
    ignoreLinesWithheld: input.ignoreLinesWithheld ?? [],
    hiddenDelivered: dryRun ? [] : hiddenPaths(root, [...input.appliedPaths, ...delivered]),
  });
  findings.push(...isolationFindings(isolation, isolationSaved));
  return { findings, protectedPaths, yamlSeeded, envAdded, instructions, delivered, installerLockWritten: !dryRun, isolationPrompt: isolationSaved, frameworkSkills };
}
