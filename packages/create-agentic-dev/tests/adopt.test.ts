import type { Probes } from '../src/preflight.ts';

import { spawnSync } from 'node:child_process';
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { afterEach, beforeEach, describe, expect, test } from 'bun:test';

import { DEFAULT_TEMPLATE_REPO, parseArgs } from '../src/args.ts';
import { CliError } from '../src/errors.ts';
import { adoptPreflight, detectDatabase, findNextApps, installState, realProbes } from '../src/preflight.ts';
import { adoptUpdaterCommand, UPDATER_ENTRY } from '../src/runners.ts';

// ---------------------------------------------------------------------------
// fixtures
// ---------------------------------------------------------------------------

let dir: string;

beforeEach(() => {
  dir = mkdtempSync(join(tmpdir(), 'cad-adopt-'));
});

afterEach(() => {
  rmSync(dir, { recursive: true, force: true });
});

function write(rel: string, content: string): void {
  mkdirSync(join(dir, rel, '..'), { recursive: true });
  writeFileSync(join(dir, rel), content);
}

function pkg(rel: string, deps: Record<string, string>): void {
  write(rel, JSON.stringify({ name: 'app', scripts: { dev: 'next dev' }, dependencies: deps }, null, 2));
}

function git(...args: string[]): void {
  const res = spawnSync('git', ['-c', 'user.email=t@example.com', '-c', 'user.name=t', ...args], { cwd: dir, stdio: 'ignore' });
  if (res.status !== 0) { throw new Error(`git ${args.join(' ')} failed`); }
}

/** A committed Next.js + Supabase app on bun: every required row passes. */
function nextApp(): void {
  pkg('package.json', { 'next': '15.0.0', '@supabase/supabase-js': '2.0.0' });
  write('bun.lock', '{}');
  write('app/page.tsx', 'export default function Page() { return null; }\n');
  git('init', '-q', '-b', 'main');
  git('add', '.');
  git('commit', '-q', '-m', 'init');
}

/** Real git; `gh` authenticated and every binary present unless told otherwise. */
function probes(over: { gh?: boolean } = {}): Probes {
  return {
    hasBinary: name => (name === 'gh' ? over.gh !== false : true),
    run: (cmd, args, cwd) => (cmd === 'gh' ? { status: 0, stdout: '' } : realProbes.run(cmd, args, cwd)),
  };
}

function rowOf(name: string, d = dir, p = probes()): { status: string, hint: string, required: boolean } {
  const row = adoptPreflight(d, p).find(r => r.name === name);
  if (!row) { throw new Error(`no row ${name}`); }
  return row;
}

function blocking(d = dir, p = probes()): string[] {
  return adoptPreflight(d, p).filter(r => r.required && r.status === 'fail').map(r => r.name);
}

// ---------------------------------------------------------------------------
// parseArgs
// ---------------------------------------------------------------------------

describe('parseArgs --adopt / --doctor', () => {
  test('--adopt needs no project name, even without a TTY', () => {
    const a = parseArgs(['--adopt']);
    expect(a.adopt).toBe(true);
    expect(a.projectName).toBeUndefined();
  });

  test('greenfield defaults are unchanged: adopt, doctor and preflight off', () => {
    const a = parseArgs(['my-app']);
    expect(a.adopt).toBe(false);
    expect(a.doctor).toBe(false);
    expect(a.preflight).toBe(false);
    expect(a.templateRepo).toBe(DEFAULT_TEMPLATE_REPO);
  });

  test.each([
    [['my-app', '--adopt'], '<project-name>'],
    [['--adopt', '--here'], '--here'],
    [['--adopt', '--project-key', 'ACME'], '--project-key'],
    [['--adopt', '--no-git'], '--no-git'],
    [['--adopt', '--no-setup'], '--no-setup'],
  ])('--adopt refuses greenfield-only input %p', (argv, flag) => {
    expect(() => parseArgs(argv)).toThrow(CliError);
    expect(() => parseArgs(argv)).toThrow(flag);
  });

  test('--adopt refuses a non-default --template (the updater syncs main)', () => {
    expect(() => parseArgs(['--adopt', '--template', 'v2'])).toThrow('--template is not supported');
  });

  test('--adopt keeps --template-repo and --non-interactive', () => {
    const a = parseArgs(['--adopt', '--template-repo', 'me/fork', '--non-interactive']);
    expect(a.templateRepo).toBe('me/fork');
    expect(a.nonInteractive).toBe(true);
  });

  test('--doctor --preflight parses; --preflight alone is a usage error', () => {
    const a = parseArgs(['--doctor', '--preflight']);
    expect(a.doctor).toBe(true);
    expect(a.preflight).toBe(true);
    expect(() => parseArgs(['--preflight'])).toThrow('--doctor');
  });
});

// ---------------------------------------------------------------------------
// the updater hand-off
// ---------------------------------------------------------------------------

describe('adoptUpdaterCommand', () => {
  const base = { updaterDir: '/tmp/tpl', templateRepo: DEFAULT_TEMPLATE_REPO, defaultTemplateRepo: DEFAULT_TEMPLATE_REPO };

  test('runs the downloaded updater with --adopt', () => {
    const { args } = adoptUpdaterCommand({ ...base, nonInteractive: false });
    expect(args).toEqual([join('/tmp/tpl', UPDATER_ENTRY), '--adopt']);
  });

  test('--non-interactive becomes the updater\'s --auto', () => {
    expect(adoptUpdaterCommand({ ...base, nonInteractive: true }).args).toContain('--auto');
  });

  test('the default template sets no environment override', () => {
    expect(adoptUpdaterCommand({ ...base, nonInteractive: false }).env).toEqual({});
  });

  test('a fork reaches the updater as UPEX_TEMPLATE_REPO', () => {
    const { env } = adoptUpdaterCommand({ ...base, templateRepo: 'me/fork', nonInteractive: false });
    expect(env).toEqual({ UPEX_TEMPLATE_REPO: 'me/fork' });
  });
});

// ---------------------------------------------------------------------------
// preflight
// ---------------------------------------------------------------------------

describe('adoptPreflight', () => {
  test('a clean Next.js + Supabase app on bun passes every required row', () => {
    nextApp();
    expect(blocking()).toEqual([]);
    expect(rowOf('stack.app_root').hint).toBe('.');
    expect(rowOf('stack family').hint).toContain('Postgres');
  });

  test('outside a git repository: blocks, and says no git init happens', () => {
    pkg('package.json', { next: '15.0.0' });
    const row = rowOf('git repository');
    expect(row.status).toBe('fail');
    expect(row.hint).toContain('never runs git init');
  });

  test('from a subdirectory of the repo: blocks and names the root', () => {
    nextApp();
    mkdirSync(join(dir, 'app', 'nested'), { recursive: true });
    const row = rowOf('git repository', join(dir, 'app', 'nested'));
    expect(row.status).toBe('fail');
    expect(row.hint).toContain('repository root');
  });

  test('uncommitted work blocks (tracked edit or untracked file)', () => {
    nextApp();
    write('notes.txt', 'wip');
    const row = rowOf('clean working tree');
    expect(row.status).toBe('fail');
    expect(row.hint).toContain('notes.txt');
  });

  test('another package manager blocks with the reason', () => {
    nextApp();
    rmSync(join(dir, 'bun.lock'));
    write('pnpm-lock.yaml', '');
    git('add', '-A');
    git('commit', '-q', '-m', 'pnpm');
    const row = rowOf('package manager');
    expect(row.status).toBe('fail');
    expect(row.hint).toContain('pnpm');
  });

  test('no lockfile: bun assumed, a warning only', () => {
    nextApp();
    rmSync(join(dir, 'bun.lock'));
    git('add', '-A');
    git('commit', '-q', '-m', 'no lock');
    const row = rowOf('package manager');
    expect(row.status).toBe('warn');
    expect(row.required).toBe(false);
  });

  test('not a Next.js app: blocks with the supported family', () => {
    pkg('package.json', { vite: '5.0.0' });
    git('init', '-q', '-b', 'main');
    git('add', '.');
    git('commit', '-q', '-m', 'init');
    const row = rowOf('stack family');
    expect(row.status).toBe('fail');
    expect(row.hint).toContain('Next.js + Postgres');
  });

  test('a non-Postgres database blocks', () => {
    pkg('package.json', { next: '15.0.0', mysql2: '3.0.0' });
    write('bun.lock', '{}');
    git('init', '-q', '-b', 'main');
    git('add', '.');
    git('commit', '-q', '-m', 'init');
    const row = rowOf('stack family');
    expect(row.status).toBe('fail');
    expect(row.hint).toContain('mysql2');
  });

  test('already installed by the greenfield scaffolder: blocks, points at bun run up', () => {
    nextApp();
    write('.template/boilerplate.lock.json', '{}');
    git('add', '-A');
    git('commit', '-q', '-m', 'lock');
    const row = rowOf('install state');
    expect(row.status).toBe('fail');
    expect(row.hint).toContain('bun run up');
  });

  test('already adopted: passes (the install is a no-op)', () => {
    nextApp();
    write('.template/boilerplate.lock.json', '{}');
    write('.template/installer.lock.json', JSON.stringify({ adopted: true }));
    git('add', '-A');
    git('commit', '-q', '-m', 'adopted');
    expect(rowOf('install state').status).toBe('ok');
  });

  test('gh missing or logged out blocks (the updater clones through it)', () => {
    nextApp();
    expect(rowOf('gh authenticated', dir, probes({ gh: false })).status).toBe('fail');
  });

  test('a monorepo with two Next apps warns: one app per adoption', () => {
    pkg('package.json', { turbo: '2.0.0' });
    pkg('apps/admin/package.json', { next: '15.0.0' });
    pkg('apps/web/package.json', { next: '15.0.0' });
    write('bun.lock', '{}');
    git('init', '-q', '-b', 'main');
    git('add', '.');
    git('commit', '-q', '-m', 'init');
    expect(blocking()).toEqual([]);
    const row = rowOf('stack.app_root');
    expect(row.status).toBe('warn');
    expect(row.required).toBe(false);
    expect(row.hint).toContain('apps/admin, apps/web');
  });
});

describe('stack detection helpers', () => {
  test('findNextApps: the root first, then apps/* and packages/* sorted', () => {
    pkg('package.json', { next: '15.0.0' });
    pkg('packages/site/package.json', { next: '15.0.0' });
    pkg('apps/web/package.json', { next: '15.0.0' });
    pkg('apps/api/package.json', { express: '4.0.0' });
    expect(findNextApps(dir)).toEqual(['.', 'apps/web', 'packages/site']);
  });

  test('detectDatabase: a Prisma datasource decides the family', () => {
    pkg('package.json', { next: '15.0.0', prisma: '5.0.0' });
    write('prisma/schema.prisma', 'datasource db {\n  provider = "postgresql"\n  url = env("DATABASE_URL")\n}\n');
    expect(detectDatabase(dir).family).toBe('postgres');
    write('prisma/schema.prisma', 'datasource db {\n  provider = "mysql"\n}\n');
    expect(detectDatabase(dir)).toEqual({ family: 'other', evidence: 'prisma provider mysql' });
  });

  test('detectDatabase: no driver at all is supported (none)', () => {
    pkg('package.json', { next: '15.0.0' });
    expect(detectDatabase(dir).family).toBe('none');
  });

  test('installState: fresh, adopted, installed', () => {
    expect(installState(dir)).toBe('fresh');
    write('.template/boilerplate.lock.json', '{}');
    expect(installState(dir)).toBe('installed');
    write('.template/installer.lock.json', JSON.stringify({ adopted: true }));
    expect(installState(dir)).toBe('adopted');
  });
});
