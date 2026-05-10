#!/usr/bin/env bun
/**
 * detect-testing-capabilities.ts — emits `.context/testing-capabilities.json`.
 *
 * Cached, write-once snapshot of the project's testing tooling so downstream
 * skills (`unit-testing`, `sprint-dev`) can read a static fact instead of
 * re-scanning `package.json` on every dispatch. Regenerated only when
 * `/agentic-dev-core` runs.
 *
 * Detection algorithm:
 *   - `runner`     — vitest > jest > null (from package.json deps).
 *   - `e2e`        — playwright > null (from package.json deps).
 *   - `typecheck`  — true iff tsconfig.json exists AND a typecheck script
 *                    (literal "typecheck" key OR script value containing
 *                    "tsc --noEmit") is declared in package.json.
 *   - `lint`       — true iff an ESLint config (.eslintrc* or eslint.config.*)
 *                    exists AND package.json declares a "lint" script.
 *   - `strict_tdd` — priority chain:
 *                    1. <!-- strict_tdd: true|false --> marker in CLAUDE.md
 *                    2. testing.strict_tdd in .agents/project.yaml
 *                    3. fallback: runner !== null
 *
 * See `.claude/skills/agentic-dev-core/references/testing-capabilities.md` for
 * the full rationale and consumer table.
 *
 * Flags:
 *   --dry-run    Print what would be written; do not write the file.
 *   --verbose    Log each detection step.
 *   --help       Show usage.
 *
 * Exit codes:
 *   0 — detection ran (cache written, or printed with --dry-run)
 *   1 — fatal error (no package.json found, or write failure)
 */

import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join, relative } from 'node:path';
import { parse as parseYaml } from 'yaml';

// -----------------------------------------------------------------------------
// Config
// -----------------------------------------------------------------------------

const REPO_ROOT = process.cwd();
const PACKAGE_JSON = join(REPO_ROOT, 'package.json');
const TSCONFIG = join(REPO_ROOT, 'tsconfig.json');
const CLAUDE_MD = join(REPO_ROOT, 'CLAUDE.md');
const AGENTS_MD = join(REPO_ROOT, 'AGENTS.md');
const PROJECT_YAML = join(REPO_ROOT, '.agents', 'project.yaml');
const CACHE_DIR = join(REPO_ROOT, '.context');
const CACHE_FILE = join(CACHE_DIR, 'testing-capabilities.json');

const ESLINT_CONFIGS = [
  '.eslintrc',
  '.eslintrc.js',
  '.eslintrc.cjs',
  '.eslintrc.mjs',
  '.eslintrc.json',
  '.eslintrc.yaml',
  '.eslintrc.yml',
  'eslint.config.js',
  'eslint.config.cjs',
  'eslint.config.mjs',
  'eslint.config.ts',
];

// -----------------------------------------------------------------------------
// Types
// -----------------------------------------------------------------------------

type Runner = 'vitest' | 'jest' | null;
type E2E = 'playwright' | null;

interface Capabilities {
  runner: Runner
  e2e: E2E
  typecheck: boolean
  lint: boolean
  strict_tdd: boolean
  detected_at: string
}

interface PackageJson {
  dependencies?: Record<string, string>
  devDependencies?: Record<string, string>
  scripts?: Record<string, string>
}

// -----------------------------------------------------------------------------
// CLI
// -----------------------------------------------------------------------------

function printHelp(): void {
  console.log(`Usage: bun scripts/detect-testing-capabilities.ts [--dry-run] [--verbose] [--help]

Detects the project's testing capabilities (runner, e2e, typecheck, lint,
strict_tdd) and writes .context/testing-capabilities.json. Consumed by the
unit-testing and sprint-dev skills.

Flags:
  --dry-run    Print the would-be JSON to stdout without writing the file.
  --verbose    Log each detection step.
  -h, --help   Show this help.

Exit code:
  0 — detection ran successfully
  1 — fatal error
`);
}

interface CliFlags {
  dryRun: boolean
  verbose: boolean
}

function parseArgs(argv: string[]): CliFlags {
  if (argv.includes('-h') || argv.includes('--help')) {
    printHelp();
    process.exit(0);
  }
  return {
    dryRun: argv.includes('--dry-run'),
    verbose: argv.includes('--verbose') || argv.includes('-v'),
  };
}

let VERBOSE = false;
function vlog(msg: string): void {
  if (VERBOSE) { console.log(`  ${msg}`); }
}

// -----------------------------------------------------------------------------
// Loaders
// -----------------------------------------------------------------------------

function loadPackageJson(): PackageJson {
  if (!existsSync(PACKAGE_JSON)) {
    console.error(`FATAL: ${relative(REPO_ROOT, PACKAGE_JSON)} not found in cwd (${REPO_ROOT}).`);
    process.exit(1);
  }
  let parsed: unknown;
  try {
    parsed = JSON.parse(readFileSync(PACKAGE_JSON, 'utf8'));
  }
  catch (err) {
    console.error(`FATAL: cannot parse package.json: ${(err as Error).message}`);
    process.exit(1);
  }
  if (parsed === null || typeof parsed !== 'object' || Array.isArray(parsed)) {
    console.error('FATAL: package.json must be a JSON object.');
    process.exit(1);
  }
  vlog('[load] package.json OK');
  return parsed as PackageJson;
}

function readIfExists(path: string): string | null {
  if (!existsSync(path)) { return null; }
  try { return readFileSync(path, 'utf8'); }
  catch { return null; }
}

// -----------------------------------------------------------------------------
// Detection
// -----------------------------------------------------------------------------

function combinedDeps(pkg: PackageJson): Set<string> {
  return new Set<string>([
    ...Object.keys(pkg.dependencies ?? {}),
    ...Object.keys(pkg.devDependencies ?? {}),
  ]);
}

function detectRunner(deps: Set<string>): Runner {
  const r: Runner = deps.has('vitest') ? 'vitest' : deps.has('jest') ? 'jest' : null;
  vlog(`[runner] ${r ?? 'none'}`);
  return r;
}

function detectE2E(deps: Set<string>): E2E {
  const e: E2E = (deps.has('@playwright/test') || deps.has('playwright')) ? 'playwright' : null;
  vlog(`[e2e] ${e ?? 'none'}`);
  return e;
}

function detectTypecheck(pkg: PackageJson): boolean {
  const tsconfig = existsSync(TSCONFIG);
  const scripts = pkg.scripts ?? {};
  const hasKey = Object.prototype.hasOwnProperty.call(scripts, 'typecheck');
  const hasTscNoEmit = Object.values(scripts).some(v => typeof v === 'string' && v.includes('tsc --noEmit'));
  const result = tsconfig && (hasKey || hasTscNoEmit);
  vlog(`[typecheck] tsconfig=${tsconfig} typecheckScript=${hasKey} tscNoEmit=${hasTscNoEmit} → ${result}`);
  return result;
}

function detectLint(pkg: PackageJson): boolean {
  const configFound = ESLINT_CONFIGS.find(name => existsSync(join(REPO_ROOT, name))) ?? null;
  const hasLintKey = Object.prototype.hasOwnProperty.call(pkg.scripts ?? {}, 'lint');
  const result = configFound !== null && hasLintKey;
  vlog(`[lint] config=${configFound ?? 'none'} lintScript=${hasLintKey} → ${result}`);
  return result;
}

/**
 * Priority 1: <!-- strict_tdd: true|false --> marker in CLAUDE.md / AGENTS.md.
 * `readIfExists` follows symlinks transparently (CLAUDE.md → AGENTS.md is the
 * default Linux/macOS install layout per agentic-dev-core SKILL.md).
 */
function detectStrictTddFromMarker(): boolean | null {
  for (const path of [CLAUDE_MD, AGENTS_MD]) {
    const text = readIfExists(path);
    if (text === null) { continue; }
    if (/<!--\s*strict_tdd:\s*true\s*-->/i.test(text)) {
      vlog(`[strict_tdd] marker = true (from ${relative(REPO_ROOT, path)})`);
      return true;
    }
    if (/<!--\s*strict_tdd:\s*false\s*-->/i.test(text)) {
      vlog(`[strict_tdd] marker = false (from ${relative(REPO_ROOT, path)})`);
      return false;
    }
  }
  vlog('[strict_tdd] no CLAUDE.md/AGENTS.md marker');
  return null;
}

/** Priority 2: `testing.strict_tdd` in `.agents/project.yaml`. */
function detectStrictTddFromYaml(): boolean | null {
  const text = readIfExists(PROJECT_YAML);
  if (text === null) {
    vlog('[strict_tdd] .agents/project.yaml not found');
    return null;
  }
  let parsed: unknown;
  try { parsed = parseYaml(text); }
  catch {
    vlog('[strict_tdd] .agents/project.yaml unparseable, ignoring');
    return null;
  }
  if (parsed === null || typeof parsed !== 'object' || Array.isArray(parsed)) { return null; }
  const testing = (parsed as Record<string, unknown>).testing;
  if (testing === null || typeof testing !== 'object' || Array.isArray(testing)) { return null; }
  const flag = (testing as Record<string, unknown>).strict_tdd;
  if (typeof flag === 'boolean') {
    vlog(`[strict_tdd] project.yaml testing.strict_tdd = ${flag}`);
    return flag;
  }
  vlog('[strict_tdd] project.yaml testing.strict_tdd absent or non-boolean');
  return null;
}

function resolveStrictTdd(runner: Runner): boolean {
  const fromMarker = detectStrictTddFromMarker();
  if (fromMarker !== null) { return fromMarker; }
  const fromYaml = detectStrictTddFromYaml();
  if (fromYaml !== null) { return fromYaml; }
  const fallback = runner !== null;
  vlog(`[strict_tdd] fallback (runner present?) = ${fallback}`);
  return fallback;
}

// -----------------------------------------------------------------------------
// Main
// -----------------------------------------------------------------------------

function main(): void {
  const flags = parseArgs(process.argv.slice(2));
  VERBOSE = flags.verbose;
  if (VERBOSE) { console.log(`[detect-testing-capabilities] cwd=${REPO_ROOT}`); }

  const pkg = loadPackageJson();
  const deps = combinedDeps(pkg);

  const runner = detectRunner(deps);
  const e2e = detectE2E(deps);
  const typecheck = detectTypecheck(pkg);
  const lint = detectLint(pkg);
  const strictTdd = resolveStrictTdd(runner);

  const capabilities: Capabilities = {
    runner,
    e2e,
    typecheck,
    lint,
    strict_tdd: strictTdd,
    detected_at: new Date().toISOString(),
  };

  const summary = `Detected: runner=${runner ?? 'none'}, e2e=${e2e ?? 'none'}, typecheck=${typecheck}, lint=${lint}, strict_tdd=${strictTdd}`;

  if (flags.dryRun) {
    console.log('[dry-run] would write:', relative(REPO_ROOT, CACHE_FILE));
    console.log(JSON.stringify(capabilities, null, 2));
    console.log(summary);
    process.exit(0);
  }

  try {
    if (!existsSync(CACHE_DIR)) { mkdirSync(CACHE_DIR, { recursive: true }); }
    writeFileSync(CACHE_FILE, `${JSON.stringify(capabilities, null, 2)}\n`, 'utf8');
  }
  catch (err) {
    console.error(`FATAL: cannot write ${relative(REPO_ROOT, CACHE_FILE)}: ${(err as Error).message}`);
    process.exit(1);
  }

  console.log(summary);
  if (VERBOSE) { console.log(`[detect-testing-capabilities] wrote ${relative(REPO_ROOT, CACHE_FILE)}`); }
  process.exit(0);
}

main();
