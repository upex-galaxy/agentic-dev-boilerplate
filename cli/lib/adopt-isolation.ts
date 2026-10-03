/**
 * @fileoverview Keeping the boilerplate's tooling out of an ADOPTED app's own
 * checks, without ever writing one of the app's files.
 *
 * The tooling (`cli/`, `scripts/`) is Bun TypeScript: `.ts` import
 * extensions, top-level await, `bun-types`. Its own scope is
 * `tsconfig.tooling.json` + `eslint.config.tooling.mjs`, which the framework
 * gates use on an adopted repo. But a stock Next.js `tsconfig.json` includes
 * `**\/*.ts`, so the app's own `tsc` and `next build` type-check the tooling
 * too and fail: measured on a stock Next tsconfig, 118 errors (105 TS5097
 * `.ts` extension imports, 9 TS1378 top-level await, 4 TS2307). The app's
 * ESLint config lints it by the app's rules the same way. No tooling-side
 * config can prevent that; only the app's configs can exclude the two
 * directories.
 *
 * The adoption never edits the app's configs (`project-adoption` refusal
 * list), so each one becomes a BLOCKING parity row with the exact lines to
 * add, plus one saved file with all of them. The same goes for the app's own
 * hook manager (`./hook-manager.ts`). `cli/doctor.ts` reads the same analysis
 * to keep reporting what is still unapplied after the run.
 */

import type { HookManagerDetection } from './hook-manager.ts';
import type { ParityFinding } from './updater-parity';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

import { detectHookManager, FRAMEWORK_GATES_FILE, gatesWired, hookWiringSnippet } from './hook-manager.ts';

/** The tooling directories an app's own checks must not reach. Dot-directories (`.agents/`) are never matched by tsconfig wildcards. */
export const TOOLING_DIRS = ['cli', 'scripts'] as const;

/** Root-level tooling config files an app's own ESLint would otherwise lint. */
export const TOOLING_ROOT_FILES = ['eslint.config.base.js', 'eslint.config.tooling.mjs'] as const;

/** Where the adopt run saves every isolation snippet for review (gitignored, single-use). */
export const ADOPT_ISOLATION_PROMPT = '.agents/prompts/adopt-tooling-isolation.md';

const FLAT_CONFIGS = ['eslint.config.js', 'eslint.config.mjs', 'eslint.config.cjs', 'eslint.config.ts', 'eslint.config.mts', 'eslint.config.cts'];
const LEGACY_CONFIGS = ['.eslintrc.js', '.eslintrc.cjs', '.eslintrc.yaml', '.eslintrc.yml', '.eslintrc.json', '.eslintrc'];

// ============================================================================
// tsconfig
// ============================================================================

/** JSON with comments and trailing commas (tsconfig's dialect) -> value, or null. */
export function parseJsonc(text: string): unknown {
  let out = '';
  let inString = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (inString) {
      out += c;
      if (c === '\\') { out += text[++i] ?? ''; }
      else if (c === '"') { inString = false; }
      continue;
    }
    if (c === '"') { inString = true; out += c; continue; }
    if (c === '/' && text[i + 1] === '/') { while (i < text.length && text[i] !== '\n') { i++; } out += '\n'; continue; }
    if (c === '/' && text[i + 1] === '*') { i += 2; while (i < text.length && !(text[i] === '*' && text[i + 1] === '/')) { i++; } i++; continue; }
    out += c;
  }
  try { return JSON.parse(out.replace(/,(\s*[}\]])/g, '$1')); }
  catch { return null; }
}

/**
 * tsconfig `include` / `exclude` matching, the subset that decides this
 * question: `*`, `?`, `**\/`, a wildcard never entering a dot-directory, and a
 * last segment without a wildcard or extension naming a directory.
 */
export function tsGlobMatches(pattern: string, file: string): boolean {
  const p = pattern.replace(/\\/g, '/').replace(/^\.\//, '').replace(/\/+$/, '');
  const last = p.split('/').pop() ?? '';
  const directory = !/[*?]/.test(last) && !last.includes('.');
  const spec = directory ? `${p}/**/*` : p.endsWith('**') ? `${p}/*` : p;
  let re = '';
  for (let i = 0; i < spec.length; i++) {
    const c = spec[i];
    if (spec.startsWith('**/', i)) { re += '(?:(?!\\.)[^/]+/)*'; i += 2; }
    else if (c === '*') { re += '[^/]*'; }
    else if (c === '?') { re += '[^/]'; }
    else { re += c.replace(/[.+^${}()|[\]\\]/g, '\\$&'); }
  }
  return new RegExp(`^${re}$`).test(file);
}

export interface TsconfigIsolation {
  path: 'tsconfig.json'
  /** Tooling dirs the app's program reaches today. */
  reached: string[]
  /** The `exclude` array to write (the app's entries first). */
  exclude: string[]
}

/** null = no root `tsconfig.json`, unparseable, or the tooling is already out of its program. */
export function tsconfigIsolation(root: string): TsconfigIsolation | null {
  const file = join(root, 'tsconfig.json');
  if (!existsSync(file)) { return null; }
  const parsed = parseJsonc(readFileSync(file, 'utf8')) as { include?: unknown, exclude?: unknown, files?: unknown } | null;
  if (parsed === null || typeof parsed !== 'object') { return null; }
  const strings = (v: unknown): string[] | null => Array.isArray(v) ? v.filter((s): s is string => typeof s === 'string') : null;
  const include = strings(parsed.include) ?? (Array.isArray(parsed.files) ? [] : ['**/*']);
  const exclude = strings(parsed.exclude);

  const reached = TOOLING_DIRS.filter((dir) => {
    const samples = [`${dir}/x.ts`, `${dir}/lib/x.ts`];
    return samples.some(f => include.some(p => tsGlobMatches(p, f)) && !(exclude ?? []).some(p => tsGlobMatches(p, f)));
  });
  if (reached.length === 0) { return null; }
  // An absent `exclude` means TypeScript's default (node_modules and friends);
  // writing the key replaces that default, so it is restated.
  const base = exclude ?? ['node_modules'];
  return { path: 'tsconfig.json', reached, exclude: [...base, ...reached.filter(d => !base.includes(d))] };
}

// ============================================================================
// ESLint
// ============================================================================

export interface EslintIsolation {
  path: string
  kind: 'flat' | 'legacy'
  /** Patterns still missing from the app's ignores. */
  missing: string[]
}

/** The app's root ESLint config, or null when it has none. */
export function findAppEslintConfig(root: string): { path: string, kind: 'flat' | 'legacy' } | null {
  const flat = FLAT_CONFIGS.find(f => existsSync(join(root, f)));
  if (flat) { return { path: flat, kind: 'flat' }; }
  const legacy = LEGACY_CONFIGS.find(f => existsSync(join(root, f)));
  if (legacy) { return { path: legacy, kind: 'legacy' }; }
  try {
    const pkg = JSON.parse(readFileSync(join(root, 'package.json'), 'utf8')) as Record<string, unknown>;
    return 'eslintConfig' in pkg ? { path: 'package.json', kind: 'legacy' } : null;
  }
  catch { return null; }
}

function uncommented(text: string): string {
  return text.replace(/\/\*[\s\S]*?\*\//g, ' ').split('\n').filter(l => !/^\s*(?:\/\/|#)/.test(l)).join('\n');
}

/** null = the app has no ESLint config, or it already ignores every tooling path. */
export function eslintIsolation(root: string): EslintIsolation | null {
  const config = findAppEslintConfig(root);
  if (config === null) { return null; }
  const read = (rel: string): string => {
    try { return uncommented(readFileSync(join(root, rel), 'utf8')); }
    catch { return ''; }
  };
  const configText = read(config.path);
  const ignoreLines = read('.eslintignore').split('\n').map(l => l.trim().replace(/^\.?\//, ''));
  const wanted = [...TOOLING_DIRS.map(d => `${d}/**`), ...TOOLING_ROOT_FILES];
  // A path counts as ignored under any of its usual spellings (`cli`, `cli/`,
  // `cli/**`, `./cli/**`): as a quoted literal in the config, or as a line of
  // `.eslintignore`. Quotes are required in the config, so prose and
  // identifiers never count.
  const ignored = (pattern: string): boolean => {
    const stem = pattern.replace(/\/\*\*$/, '');
    const spellings = [stem, `${stem}/`, `${stem}/**`, `${stem}/**/*`];
    if (ignoreLines.some(l => spellings.includes(l))) { return true; }
    const escaped = stem.replace(/\./g, '\\.');
    return new RegExp(`['"\`](?:\\./)?${escaped}(?:/|/\\*\\*|/\\*\\*/\\*)?['"\`]`).test(configText);
  };
  const missing = wanted.filter(p => !ignored(p));
  return missing.length === 0 ? null : { path: config.path, kind: config.kind, missing };
}

// ============================================================================
// Rows + saved file
// ============================================================================

export interface IsolationAnalysis {
  tsconfig: TsconfigIsolation | null
  eslint: EslintIsolation | null
  hooks: HookManagerDetection
  /** Foreign manager whose config does not call the gates file yet. */
  hooksPending: boolean
}

export function analyzeIsolation(root: string, hooks: HookManagerDetection = detectHookManager(root)): IsolationAnalysis {
  return { tsconfig: tsconfigIsolation(root), eslint: eslintIsolation(root), hooks, hooksPending: hooks.foreign && !gatesWired(root, hooks) };
}

export function tsconfigSnippet(t: TsconfigIsolation): string {
  return `// tsconfig.json: replace "exclude" with\n"exclude": ${JSON.stringify(t.exclude)}`;
}

export function eslintSnippet(e: EslintIsolation): string {
  const list = e.missing.map(p => `'${p}'`).join(', ');
  if (e.kind === 'flat') {
    return `// ${e.path}: add one config object at the top of the exported array\n{ ignores: [${list}] },`;
  }
  const legacy = e.missing.map(p => p.replace(/\/\*\*$/, '/'));
  return `// ${e.path}: add to "ignorePatterns" (or list the same lines in .eslintignore)\n"ignorePatterns": ${JSON.stringify(legacy)}`;
}

/** One BLOCKING row per app config the tooling still reaches, and one for an unwired foreign hook manager. */
export function isolationFindings(a: IsolationAnalysis, savedAt: string | null): Omit<ParityFinding, 'id'>[] {
  const where = savedAt ? `; every snippet saved in ${savedAt}` : '';
  const rows: Omit<ParityFinding, 'id'>[] = [];
  if (a.tsconfig !== null) {
    rows.push({
      surface: 'gates',
      path: a.tsconfig.path,
      evidence: `the app's tsconfig type-checks the tooling (${a.tsconfig.reached.map(d => `${d}/`).join(', ')}): its own tsc and next build fail on Bun-only syntax until the app excludes them; the adoption never edits it${where}`,
      suggested: 'decide',
      blocking: true,
      detail: tsconfigSnippet(a.tsconfig),
      note: 'Add the tooling directories to the app\'s "exclude" by hand (the tooling has its own tsconfig.tooling.json; bun run tooling:types:check). If the app keeps its own TypeScript under scripts/, list the boilerplate\'s files there instead of the directory.',
    });
  }
  if (a.eslint !== null) {
    rows.push({
      surface: 'gates',
      path: a.eslint.path,
      evidence: `the app's ESLint config lints the tooling by the app's rules (${a.eslint.missing.join(', ')} not ignored); the adoption never edits it${where}`,
      suggested: 'decide',
      blocking: true,
      detail: eslintSnippet(a.eslint),
      note: 'Ignore the tooling paths in the app\'s config by hand; the tooling lints itself with eslint.config.tooling.mjs (bun run tooling:lint:check).',
    });
  }
  if (a.hooksPending && a.hooks.configPath !== null) {
    rows.push({
      // `components`, like the husky hook rows; `hooks` is the agent prompt hooks.
      surface: 'components',
      path: a.hooks.configPath,
      evidence: `the app's hooks run on ${a.hooks.manager} (${a.hooks.evidence}): husky is NOT installed (it would switch them off), so the framework gates run only once ${a.hooks.manager} calls ${FRAMEWORK_GATES_FILE}${where}`,
      suggested: 'decide',
      blocking: true,
      detail: hookWiringSnippet(a.hooks) ?? undefined,
      note: `Wire the three gate functions into ${a.hooks.manager} by hand, keeping every hook the app already runs. The .husky/ hook files are inert here; the synced ${FRAMEWORK_GATES_FILE} is the part that counts.`,
    });
  }
  return rows;
}

/** The saved review file: every snippet in one place. null when nothing is pending. */
export function isolationPrompt(a: IsolationAnalysis): string | null {
  const parts: string[] = [];
  if (a.tsconfig !== null) { parts.push('## tsconfig.json', '', '```jsonc', tsconfigSnippet(a.tsconfig), '```', ''); }
  if (a.eslint !== null) { parts.push(`## ${a.eslint.path}`, '', '```js', eslintSnippet(a.eslint), '```', ''); }
  const hook = a.hooksPending ? hookWiringSnippet(a.hooks) : null;
  if (hook !== null) { parts.push(`## Hooks (${a.hooks.manager}: ${a.hooks.configPath})`, '', '```', hook, '```', ''); }
  if (parts.length === 0) { return null; }
  return [
    '# Tooling isolation for this adopted app',
    '',
    'The adoption never edits these files: they are the app\'s. Apply each snippet by hand, then run the app\'s own build, lint and test to confirm nothing changed for the app, and `bun run tooling:types:check` / `bun run tooling:lint:check` for the tooling.',
    '',
    ...parts,
  ].join('\n');
}
