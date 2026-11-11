#!/usr/bin/env bun
/**
 * @fileoverview One leg of the consumer matrix: a throwaway downstream project
 * synced from this checkout, then held to the gates a project runs.
 *
 *   bun packages/consumer-fixture/run-leg.ts --leg <name> --out <dir>
 *
 * Legs (LEGS below): `all` (every harness), `claude-only`, `codex-only`,
 * `no-pi-legacy` (three harnesses, no `.pi/`: the shape of a project made
 * before Pi existed, which a fresh install would never reproduce), and
 * `adopted-protected` (an adopted app with its own script and test under
 * `scripts/` and `cli/lib/`, a `cli/lib` path in `updater.protected_paths`,
 * and an upstream that carries a newer updater, so the self-update runs).
 *
 * Per leg: `buildUpFixture` (scripts/ui-up-fixture.ts) makes an upstream clone
 * of HEAD and a consumer rolled back 30 commits with its lock there. The
 * consumer is then shaped into a downstream project (package renamed, the
 * maintainer sentinel line deleted, `harnesses:` set, the undeclared harness
 * files and `packages/` deleted) and must stop being the boilerplate
 * (`contractsEnforced` false). Then `bun sync --auto --no-gates` against the
 * local upstream, and the checks: exit 0, no boilerplate-only file left, no
 * undeclared harness file delivered, the project gates, a bare `bun test`.
 *
 * Lives under `packages/`, which the scaffold prunes and no sync delivers: it
 * is the boilerplate's own CI tooling (`.github/workflows/ci.yml`,
 * job consumer-matrix). Exit 0 only when every check passed.
 */

import type { Harness } from '../../cli/lib/harness-selection.ts';
import { spawnSync } from 'node:child_process';
import { appendFileSync, existsSync, mkdirSync, readdirSync, readFileSync, rmSync, statSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';

import { HARNESS_FILES, HARNESSES } from '../../cli/lib/harness-selection.ts';
import { BOILERPLATE_TEST_PATHS, BOILERPLATE_TEST_PATTERNS, INSTALLER_LOCK_FILE } from '../../cli/lib/updater-adopt.ts';
import { isRepoOnlyForRun } from '../../cli/lib/updater-core.ts';
import { contractsEnforced } from '../../scripts/lib/doc-contracts.ts';
import { buildUpFixture } from '../../scripts/ui-up-fixture.ts';

export interface Leg {
  harnesses: Harness[]
  /** Also delete `.pi/` as a whole (a project from before Pi). */
  noPiDir?: boolean
  /** An adopted app with files of its own and a protected `cli/lib` path; upstream carries a newer updater. */
  adopted?: boolean
  /**
   * `cli/`, `package.json` and `INSTALLER.md` at LEGACY_UPDATER_COMMIT, plus
   * one `cli/` test the project edited: the first sync of a project made
   * before the boilerplate's tests stopped travelling, run by its OLD updater.
   */
  legacyUpdater?: boolean
}

/**
 * The last boilerplate commit whose updater still delivered its own tests (the
 * base of the change that stopped it). A fixed point in history: the shape
 * every project made before then has on its first sync after it.
 */
export const LEGACY_UPDATER_COMMIT = '493353fbd36aa8f5e8c6915dd10a542ff36c1092';
/** The `cli/` test the legacy leg's project edited: it must survive with its edit. */
export const EDITED_CLI_TEST = 'cli/lib/updater-drift.test.ts';
const PROJECT_EDIT = '\n// project edit: kept by the team\n';

/** The adopted leg's own files: they must survive the sync untouched. */
export const APP_FILES: Record<string, string> = {
  'scripts/app-task.ts': 'export const appTask = 1;\n',
  'scripts/app-task.test.ts': 'import { expect, test } from \'bun:test\';\nimport { appTask } from \'./app-task.ts\';\n\ntest(\'the app task\', () => { expect(appTask).toBe(1); });\n',
  'cli/lib/app-helper.ts': 'export const appHelper = 2;\n',
  'cli/lib/app-helper.test.ts': 'import { expect, test } from \'bun:test\';\nimport { appHelper } from \'./app-helper.ts\';\n\ntest(\'the app helper\', () => { expect(appHelper).toBe(2); });\n',
};
/** The fixture's `--self-update` changes this file upstream; the adopted leg protects it. */
export const PROTECTED_CLI_PATH = 'cli/lib/tui.ts';

export const LEGS: Record<string, Leg> = {
  'all': { harnesses: ['claude', 'opencode', 'codex', 'pi'] },
  'claude-only': { harnesses: ['claude'] },
  'no-pi-legacy': { harnesses: ['claude', 'opencode', 'codex'], noPiDir: true },
  'codex-only': { harnesses: ['codex'] },
  'adopted-protected': { harnesses: ['claude', 'opencode', 'codex', 'pi'], adopted: true },
  'legacy-updater': { harnesses: ['claude', 'opencode', 'codex', 'pi'], legacyUpdater: true },
};

/** The gates a consumer runs (`repo:check` carries no `git:policy` here). */
export const CONSUMER_GATES = ['repo:check', 'test'];

function arg(name: string): string | undefined {
  const i = process.argv.indexOf(name);
  return i > 0 ? process.argv[i + 1] : undefined;
}

function run(cwd: string, cmd: string[], env: Record<string, string> = {}): { status: number, out: string } {
  const r = spawnSync(cmd[0], cmd.slice(1), { cwd, encoding: 'utf8', env: { ...process.env, ...env, CI: 'true' }, maxBuffer: 256 * 1024 * 1024 });
  return { status: r.status ?? 1, out: `${r.stdout ?? ''}${r.stderr ?? ''}` };
}

function git(cwd: string, ...args: string[]): void {
  const r = run(cwd, ['git', '-c', 'user.email=fixture@example.invalid', '-c', 'user.name=fixture', ...args]);
  if (r.status !== 0) { throw new Error(`git ${args.join(' ')}: ${r.out}`); }
}

function filesUnder(root: string, rel: string): string[] {
  const abs = join(root, rel);
  if (!existsSync(abs)) { return []; }
  if (statSync(abs).isFile()) { return [rel]; }
  return readdirSync(abs).filter(n => n !== 'node_modules').flatMap(n => filesUnder(root, `${rel}/${n}`));
}

/** Turns the fixture consumer (a clone of this repo) into a downstream project of `leg`'s shape. */
export function shapeConsumer(consumer: string, leg: Leg): void {
  const pkgPath = join(consumer, 'package.json');
  const pkg = JSON.parse(readFileSync(pkgPath, 'utf8')) as Record<string, unknown>;
  pkg.name = 'consumer-fixture-project';
  writeFileSync(pkgPath, `${JSON.stringify(pkg, null, 2)}\n`);
  // The WHOLE sentinel line, and the blank line after it: a blank first line fails lint:check.
  const yamlPath = join(consumer, '.agents', 'project.yaml');
  const yaml = readFileSync(yamlPath, 'utf8').split('\n').filter(line => !line.startsWith('# MAINTAINER COPY:')).join('\n').replace(/^\n+/, '');
  writeFileSync(yamlPath, yaml.replace(/^harnesses:.*$/m, `harnesses: [${leg.harnesses.join(', ')}]`));
  for (const harness of HARNESSES.filter(h => !leg.harnesses.includes(h))) {
    for (const f of HARNESS_FILES[harness]) { rmSync(join(consumer, f), { force: true }); }
  }
  if (!leg.harnesses.includes('claude')) { rmSync(join(consumer, '.claude'), { recursive: true, force: true }); }
  if (!leg.harnesses.includes('opencode')) { rmSync(join(consumer, '.opencode'), { recursive: true, force: true }); }
  if (!leg.harnesses.includes('codex')) { rmSync(join(consumer, '.codex'), { recursive: true, force: true }); }
  if (leg.noPiDir || !leg.harnesses.includes('pi')) { rmSync(join(consumer, '.pi'), { recursive: true, force: true }); }
  // The scaffold prunes packages/ (TEMPLATE_EXCLUDES); a project never has it.
  rmSync(join(consumer, 'packages'), { recursive: true, force: true });
  if (leg.adopted) {
    mkdirSync(join(consumer, '.template'), { recursive: true });
    writeFileSync(join(consumer, INSTALLER_LOCK_FILE), `${JSON.stringify({ adopted: true }, null, 2)}\n`);
    for (const [rel, text] of Object.entries(APP_FILES)) { writeFileSync(join(consumer, rel), text); }
    const y = readFileSync(yamlPath, 'utf8');
    writeFileSync(yamlPath, y.replace(/^( {2}protected_paths:) \[\]/m, `$1 [${PROTECTED_CLI_PATH}]`));
  }
  git(consumer, 'add', '-A');
  git(consumer, 'commit', '-q', '-m', 'fixture: shaped as a downstream project');
}

export interface LegResult { name: string, checks: { check: string, ok: boolean, detail: string }[] }

export function runLeg(name: string, out: string): LegResult {
  const leg = LEGS[name];
  if (!leg) { throw new Error(`unknown leg "${name}" (one of: ${Object.keys(LEGS).join(', ')})`); }
  const result: LegResult = { name, checks: [] };
  const check = (label: string, ok: boolean, detail = ''): void => { result.checks.push({ check: label, ok, detail }); };

  const { upstream, consumer } = buildUpFixture(resolve(out), { back: 30, selfUpdate: leg.adopted === true });
  if (leg.legacyUpdater) {
    git(consumer, 'checkout', LEGACY_UPDATER_COMMIT, '--', 'cli', 'package.json', 'INSTALLER.md');
    appendFileSync(join(consumer, EDITED_CLI_TEST), PROJECT_EDIT);
    // A real project's lock records upstream's package.json at its last sync.
    const lockPath = join(consumer, '.template', 'boilerplate.lock.json');
    const lock = JSON.parse(readFileSync(lockPath, 'utf8')) as Record<string, unknown>;
    const blob = run(consumer, ['git', 'rev-parse', `${LEGACY_UPDATER_COMMIT}:package.json`]).out.trim();
    lock.packageJsonSync = { 'package.json': Object.fromEntries(['scripts', 'devDependencies', 'dependencies', 'lint-staged'].map(s => [s, { lastSyncedSha: blob, appliedKeys: [] }])) };
    // Its updater synced `cli/` at that commit, so the `cli` cursor sits there.
    (lock.perComponentCommit as Record<string, string>).cli = LEGACY_UPDATER_COMMIT;
    writeFileSync(lockPath, `${JSON.stringify(lock, null, 2)}\n`);
  }
  shapeConsumer(consumer, leg);
  check('consumer is not the boilerplate (contractsEnforced false)', !contractsEnforced(consumer));
  if (leg.adopted) {
    check(`${PROTECTED_CLI_PATH} is protected in the consumer`, readFileSync(join(consumer, '.agents', 'project.yaml'), 'utf8').includes(`protected_paths: [${PROTECTED_CLI_PATH}]`));
  }
  const protectedBefore = leg.adopted ? readFileSync(join(consumer, PROTECTED_CLI_PATH)) : null;

  const sync = run(consumer, ['bun', 'cli/update-boilerplate.ts', '--auto', '--no-gates'], { UPEX_TEMPLATE_REPO: upstream });
  check('bun sync --auto exits 0', sync.status === 0, sync.status === 0 ? '' : sync.out.split('\n').slice(-15).join('\n'));

  if (protectedBefore !== null) {
    check(`protected ${PROTECTED_CLI_PATH} kept byte-identical through the self-update`, Buffer.compare(protectedBefore, readFileSync(join(consumer, PROTECTED_CLI_PATH))) === 0);
    const missing = Object.keys(APP_FILES).filter(rel => !existsSync(join(consumer, rel)) || readFileSync(join(consumer, rel), 'utf8') !== APP_FILES[rel]);
    check('the app\'s own files and tests survive untouched', missing.length === 0, missing.join(', '));
  }
  const lists = { repoOnlyPaths: BOILERPLATE_TEST_PATHS, repoOnlyPatterns: BOILERPLATE_TEST_PATTERNS };
  const appOwned = new Set(leg.adopted ? Object.keys(APP_FILES) : []);
  if (leg.legacyUpdater) {
    const edited = join(consumer, EDITED_CLI_TEST);
    check(`the project's edited ${EDITED_CLI_TEST} survives with its edit`, existsSync(edited) && readFileSync(edited, 'utf8').endsWith(PROJECT_EDIT));
    appOwned.add(EDITED_CLI_TEST);
  }
  const left = [...filesUnder(consumer, 'cli'), ...filesUnder(consumer, 'scripts'), ...filesUnder(consumer, '.agents/skills')].filter(f => isRepoOnlyForRun(lists, f) && !appOwned.has(f));
  check('no boilerplate-only file left in cli/, scripts/ or the skills', left.length === 0, left.slice(0, 10).join(', '));

  const undeclared = HARNESSES.filter(h => !leg.harnesses.includes(h)).flatMap(h => HARNESS_FILES[h].filter(f => existsSync(join(consumer, f))));
  check('no file of an undeclared harness delivered', undeclared.length === 0, undeclared.join(', '));

  for (const gate of CONSUMER_GATES) {
    const r = run(consumer, ['bun', 'run', gate]);
    check(`bun run ${gate}`, r.status === 0, r.status === 0 ? '' : r.out.split('\n').slice(-12).join('\n'));
  }
  const tests = run(consumer, ['bun', 'test', '--pass-with-no-tests']);
  const ranBoilerplateTest = tests.out.split('\n').some(l => /^(?:cli|scripts|\.agents\/skills)\/.*\.test\.[cm]?[jt]s:$/.test(l) && !appOwned.has(l.slice(0, -1)));
  check('bare bun test exits 0', tests.status === 0, tests.status === 0 ? '' : tests.out.split('\n').filter(l => /^\(fail\)|^ *\d+ (?:pass|fail)/.test(l)).slice(0, 15).join('\n'));
  check('bare bun test ran no boilerplate test', !ranBoilerplateTest);
  return result;
}

if (import.meta.main) {
  const name = arg('--leg');
  const out = arg('--out');
  if (!name || !out) {
    process.stderr.write(`usage: bun packages/consumer-fixture/run-leg.ts --leg <${Object.keys(LEGS).join('|')}> --out <dir>\n`);
    process.exit(2);
  }
  const result = runLeg(name, out);
  for (const c of result.checks) {
    process.stdout.write(`${c.ok ? 'PASS' : 'FAIL'}  ${c.check}\n`);
    if (!c.ok && c.detail) { process.stdout.write(`${c.detail.split('\n').map(l => `      ${l}`).join('\n')}\n`); }
  }
  const failed = result.checks.filter(c => !c.ok).length;
  process.stdout.write(`\nleg ${name}: ${result.checks.length - failed} passed, ${failed} failed\n`);
  process.exit(failed === 0 ? 0 : 1);
}
