import type { DoctorRow } from './doctor.ts';

import { spawnSync } from 'node:child_process';
import { existsSync, readdirSync, readFileSync, realpathSync, statSync } from 'node:fs';
import { join } from 'node:path';

/**
 * Read-only checks `--adopt` runs on an EXISTING app before it installs
 * anything (`--doctor --preflight` prints the same rows without installing).
 *
 * The scaffolder is published on its own and cannot import from the
 * boilerplate, so the stack detection here is a deliberately small twin of
 * `detectStack` in `cli/lib/stack-descriptor.ts`: only the facts that decide
 * whether v1 can adopt the app at all (Next.js + Postgres family, bun as the
 * package manager, one app per adoption). The full `stack:` block is written
 * later by the `project-adoption` skill, never here.
 */

export interface Probes {
  hasBinary: (name: string) => boolean
  run: (cmd: string, args: string[], cwd: string) => { status: number | null, stdout: string }
}

export const realProbes: Probes = {
  hasBinary: (name) => {
    const probe = spawnSync(process.platform === 'win32' ? 'where' : 'which', [name], { stdio: ['ignore', 'pipe', 'ignore'] });
    return probe.status === 0;
  },
  run: (cmd, args, cwd) => {
    const res = spawnSync(cmd, args, { cwd, stdio: ['ignore', 'pipe', 'ignore'], encoding: 'utf8', shell: process.platform === 'win32' });
    return { status: res.error ? null : res.status, stdout: res.stdout ?? '' };
  },
};

interface PackageJson {
  packageManager?: string
  dependencies?: Record<string, string>
  devDependencies?: Record<string, string>
}

/** What the repo already says about a previous install. */
export type InstallState = 'fresh' | 'adopted' | 'installed';

const BOILERPLATE_LOCK = '.template/boilerplate.lock.json';
const INSTALLER_LOCK = '.template/installer.lock.json';

const LOCKFILES: ReadonlyArray<[string, string]> = [
  ['bun.lock', 'bun'],
  ['bun.lockb', 'bun'],
  ['pnpm-lock.yaml', 'pnpm'],
  ['yarn.lock', 'yarn'],
  ['package-lock.json', 'npm'],
];

const POSTGRES_DEPS = ['@supabase/supabase-js', '@supabase/ssr', 'pg', 'postgres', '@neondatabase/serverless', '@vercel/postgres'];
const OTHER_DB_DEPS = ['mysql', 'mysql2', '@planetscale/database', 'mongodb', 'mongoose', 'sqlite3', 'better-sqlite3', '@libsql/client'];

function readJson<T>(file: string): T | null {
  try { return JSON.parse(readFileSync(file, 'utf8')) as T; }
  catch { return null; }
}

function isDir(path: string): boolean {
  try { return statSync(path).isDirectory(); }
  catch { return false; }
}

function deps(pkg: PackageJson): Record<string, string> {
  return { ...pkg.devDependencies, ...pkg.dependencies };
}

export function installState(dir: string): InstallState {
  if (!existsSync(join(dir, BOILERPLATE_LOCK))) { return 'fresh'; }
  const lock = readJson<{ adopted?: boolean }>(join(dir, INSTALLER_LOCK));
  return lock?.adopted === true ? 'adopted' : 'installed';
}

/** Every directory whose package.json declares `next`: the root, then `apps/*` and `packages/*`. */
export function findNextApps(dir: string): string[] {
  const declaresNext = (rel: string): boolean => {
    const pkg = readJson<PackageJson>(join(dir, rel, 'package.json'));
    return pkg !== null && 'next' in deps(pkg);
  };
  const found: string[] = [];
  if (declaresNext('.')) { found.push('.'); }
  for (const parent of ['apps', 'packages']) {
    if (!isDir(join(dir, parent))) { continue; }
    for (const name of readdirSync(join(dir, parent)).sort()) {
      if (declaresNext(`${parent}/${name}`)) { found.push(`${parent}/${name}`); }
    }
  }
  return found;
}

/** The app's package manager and the file that says so; `null` when nothing does. */
export function detectPackageManager(dir: string): { pm: string, evidence: string } | null {
  const lock = LOCKFILES.find(([file]) => existsSync(join(dir, file)));
  if (lock) { return { pm: lock[1], evidence: lock[0] }; }
  const declared = readJson<PackageJson>(join(dir, 'package.json'))?.packageManager?.split('@')[0];
  return declared ? { pm: declared, evidence: 'package.json packageManager' } : null;
}

/** `postgres`, `other` (with the dependency that says so) or `none`. */
export function detectDatabase(appDir: string): { family: 'postgres' | 'other' | 'none', evidence: string } {
  const all = deps(readJson<PackageJson>(join(appDir, 'package.json')) ?? {});
  const pg = POSTGRES_DEPS.find(d => d in all);
  if (pg || isDir(join(appDir, 'supabase'))) { return { family: 'postgres', evidence: pg ?? 'supabase/' }; }
  const prisma = readPrismaProvider(appDir);
  if (prisma !== null) {
    return prisma === 'postgresql' || prisma === 'cockroachdb'
      ? { family: 'postgres', evidence: `prisma provider ${prisma}` }
      : { family: 'other', evidence: `prisma provider ${prisma}` };
  }
  const other = OTHER_DB_DEPS.find(d => d in all);
  if (other) { return { family: 'other', evidence: other }; }
  return { family: 'none', evidence: 'no database dependency' };
}

function readPrismaProvider(appDir: string): string | null {
  try {
    const schema = readFileSync(join(appDir, 'prisma', 'schema.prisma'), 'utf8');
    const block = schema.match(/datasource\s+\w+\s*\{[^}]*\}/);
    return block?.[0].match(/provider\s*=\s*"([^"]+)"/)?.[1] ?? null;
  }
  catch { return null; }
}

function samePath(a: string, b: string): boolean {
  try { return realpathSync(a) === realpathSync(b); }
  catch { return false; }
}

/**
 * The adopt rows, in the order a user fixes them. `required` rows block
 * `--adopt`; the rest only inform.
 */
export function adoptPreflight(dir: string, probes: Probes = realProbes): DoctorRow[] {
  const rows: DoctorRow[] = [];
  const row = (name: string, status: DoctorRow['status'], hint: string, required = true): void => {
    rows.push({ name, status, hint, required });
  };

  // Git: adoption runs inside the app's own repository and never runs `git init`.
  const top = probes.run('git', ['rev-parse', '--show-toplevel'], dir);
  if (top.status !== 0) {
    row('git repository', 'fail', 'Not a git repository. --adopt runs inside the app\'s own repo and never runs git init.');
  }
  else if (!samePath(top.stdout.trim(), dir)) {
    row('git repository', 'fail', `Run from the repository root: ${top.stdout.trim()}`);
  }
  else {
    row('git repository', 'ok', 'repo root');
    const status = probes.run('git', ['status', '--porcelain'], dir);
    const dirty = status.stdout.split('\n').filter(Boolean);
    row(
      'clean working tree',
      status.status === 0 && dirty.length === 0 ? 'ok' : 'fail',
      status.status !== 0
        ? 'git status failed'
        : dirty.length === 0
          ? 'nothing uncommitted'
          : `${dirty.length} uncommitted path(s), e.g. ${dirty[0].slice(3)}. Commit or stash first, so the adoption is one reviewable diff.`,
    );
  }

  const state = installState(dir);
  row(
    'install state',
    state === 'installed' ? 'fail' : 'ok',
    state === 'fresh'
      ? 'no agentic-dev install yet'
      : state === 'adopted'
        ? 'already adopted: nothing to install (bun run up updates it)'
        : `Already an agentic-dev project (${BOILERPLATE_LOCK}). Use bun run up instead.`,
  );

  // The updater clones the template through the GitHub CLI.
  const ghAuthed = probes.hasBinary('gh') && probes.run('gh', ['auth', 'status'], dir).status === 0;
  row('gh authenticated', ghAuthed ? 'ok' : 'fail', ghAuthed ? 'the updater clones the template with it' : 'Install https://cli.github.com and run: gh auth login');

  // bun as the app's own package manager (the doctor's own rows check the binary).
  const pm = detectPackageManager(dir);
  if (pm === null) {
    row('package manager', 'warn', 'No lockfile and no packageManager field: bun assumed.', false);
  }
  else {
    row(
      'package manager',
      pm.pm === 'bun' ? 'ok' : 'fail',
      pm.pm === 'bun' ? `bun (${pm.evidence})` : `The app uses ${pm.pm} (${pm.evidence}). v1 adopts bun apps only.`,
    );
  }

  // Stack family + app root: Next.js on the Postgres family, one app per adoption.
  if (!existsSync(join(dir, 'package.json'))) {
    row('stack family', 'fail', 'No package.json at the repo root. v1 adopts Next.js + Postgres-family apps.');
    return rows;
  }
  const apps = findNextApps(dir);
  if (apps.length === 0) {
    row('stack family', 'fail', 'No package.json declaring next (root, apps/*, packages/*). v1 adopts Next.js + Postgres-family apps.');
    return rows;
  }
  const appRoot = apps[0];
  const db = detectDatabase(join(dir, appRoot));
  row(
    'stack family',
    db.family === 'other' ? 'fail' : 'ok',
    db.family === 'other'
      ? `Next.js on a non-Postgres database (${db.evidence}). v1 adopts the Postgres family only.`
      : `Next.js, ${db.family === 'postgres' ? `Postgres (${db.evidence})` : 'no database'}`,
  );
  row(
    'stack.app_root',
    apps.length === 1 ? 'ok' : 'warn',
    apps.length === 1
      ? appRoot
      : `One app per adoption: ${apps.join(', ')}. project-adoption asks which one (proposes ${appRoot}).`,
    false,
  );

  return rows;
}
