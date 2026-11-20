/**
 * The tooling's own type/lint scope, and the framework gates that pick it on an
 * ADOPTED app. The greenfield path is asserted command for command: a project
 * scaffolded from the boilerplate must run exactly the gates it ran before.
 */
import { chmodSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { delimiter, dirname, join, resolve } from 'node:path';

import { afterEach, describe, expect, test } from 'bun:test';
import { ADOPTED_APP_CONFIGS, COMPONENTS, resolveProtectedWatchlist, watchedForDrift } from './update-boilerplate.ts';

const REPO_ROOT = resolve(import.meta.dir, '..');
const GATES = join(REPO_ROOT, '.husky', 'framework-gates.sh');
const IS_WINDOWS = process.platform === 'win32';

const roots: string[] = [];
afterEach(() => {
  while (roots.length > 0) { rmSync(roots.pop()!, { recursive: true, force: true }); }
});

describe('the tooling scope ships with the tooling component', () => {
  test('tsconfig.tooling.json and eslint.config.tooling.mjs are synced like the eslint base', () => {
    const files = COMPONENTS.find(c => c.name === 'tooling')?.files ?? [];
    expect(files).toEqual(expect.arrayContaining(['eslint.config.base.js', 'eslint.config.tooling.mjs', 'tsconfig.tooling.json']));
  });

  test('tsconfig.tooling.json covers the tooling only, never the app tree', () => {
    const config = JSON.parse(readFileSync(join(REPO_ROOT, 'tsconfig.tooling.json'), 'utf8')) as { include: string[], extends?: string };
    expect(config.include).toEqual(['cli/**/*.ts', 'scripts/**/*.ts', '.agents/**/*.ts']);
    // Standalone: extending the root tsconfig would inherit an adopted app's settings.
    expect(config.extends).toBeUndefined();
  });

  test('package.json runs the tooling scope through its own scripts; the greenfield scripts are unchanged', () => {
    const scripts = (JSON.parse(readFileSync(join(REPO_ROOT, 'package.json'), 'utf8')) as { scripts: Record<string, string> }).scripts;
    // Scoped to what upstream owns on an adopted app; folder-wide everywhere else (scripts/tooling-check.ts).
    expect(scripts['tooling:types:check']).toBe('bun scripts/tooling-check.ts types');
    expect(scripts['tooling:lint:check']).toBe('bun scripts/tooling-check.ts lint');
    expect(scripts['types:check']).toBe('bun check');
    expect(scripts['lint:check']).toBe('eslint .');
  });
});

describe('the app\'s own root configs on an adopted repo', () => {
  // Upstream's root tsconfig/eslint config are greenfield's: comparing an app's
  // config with them advises porting Bun settings INTO the app.
  test('their drift rows are dropped on an adopted repo and kept on a greenfield one; the watchlist itself is unchanged', () => {
    const watchlist = resolveProtectedWatchlist(REPO_ROOT);
    const paths = (adopted: boolean): string[] => watchedForDrift(watchlist, adopted).map(e => e.path);
    for (const config of ADOPTED_APP_CONFIGS) {
      expect(watchlist.map(e => e.path)).toContain(config);
      expect(paths(false)).toContain(config);
      expect(paths(true)).not.toContain(config);
    }
    expect(paths(true)).toContain('.husky/pre-commit');
  });
});

describe('framework gates pick the scope', () => {
  /** A git repo with a stub `bun` that logs every `bun run <script>` and succeeds. */
  function repo(opts: { adopted: boolean, toolingScripts: boolean }): { root: string, run: (fn: string) => { code: number, calls: string[], out: string } } {
    const root = mkdtempSync(join(tmpdir(), 'gates scope '));
    roots.push(root);
    const bin = join(root, '.bin');
    mkdirSync(bin);
    const log = join(root, 'calls.log');
    writeFileSync(join(bin, 'bun'), `#!/bin/sh\necho "$*" >> "${log}"\nexit 0\n`);
    chmodSync(join(bin, 'bun'), 0o755);
    const scripts: Record<string, string> = { 'types:check': 'x', 'lint:check': 'x', 'format:check': 'x' };
    if (opts.toolingScripts) { Object.assign(scripts, { 'tooling:types:check': 'x', 'tooling:lint:check': 'x' }); }
    writeFileSync(join(root, 'package.json'), `${JSON.stringify({ scripts }, null, 2)}\n`);
    if (opts.adopted) {
      mkdirSync(join(root, '.template'));
      writeFileSync(join(root, '.template', 'installer.lock.json'), `${JSON.stringify({ template: 'upex-galaxy/agentic-dev-boilerplate', adopted: true }, null, 2)}\n`);
    }
    Bun.spawnSync(['git', 'init', '-q'], { cwd: root });
    return {
      root,
      run: (fn) => {
        rmSync(log, { force: true });
        // `sh -e`, as `.husky/_/h` runs every hook.
        const p = Bun.spawnSync(['sh', '-e', '-c', `. "${GATES}"; ${fn}`], {
          cwd: root,
          stdout: 'pipe',
          stderr: 'pipe',
          env: { ...process.env, PATH: `${bin}${delimiter}${process.env.PATH ?? ''}` },
        });
        let calls: string[] = [];
        try { calls = readFileSync(log, 'utf8').trim().split('\n').filter(Boolean); }
        catch {}
        return { code: p.exitCode ?? 1, calls, out: `${p.stdout.toString()}${p.stderr.toString()}` };
      },
    };
  }

  test('greenfield: exactly the gates it ran before, command for command', () => {
    if (IS_WINDOWS) { return; }
    const { run } = repo({ adopted: false, toolingScripts: true });
    expect(run('framework_gates_pre_commit')).toMatchObject({ code: 0, calls: ['run types:check', 'run vars:check', 'run skills:check'] });
    expect(run('framework_gates_pre_push').calls).toEqual([
      'run format:check',
      'run lint:check',
      'run vars:env:check',
      'run skills:registry:check',
      'run agents:compat:check',
    ]);
  });

  test('adopted app: the tooling scope instead of the app\'s scripts, and no repo-wide format check', () => {
    if (IS_WINDOWS) { return; }
    const { run } = repo({ adopted: true, toolingScripts: true });
    expect(run('framework_gates_pre_commit').calls).toEqual(['run tooling:types:check', 'run vars:check', 'run skills:check']);
    const push = run('framework_gates_pre_push');
    expect(push.calls).toEqual(['run tooling:lint:check', 'run vars:env:check', 'run skills:registry:check', 'run agents:compat:check']);
    expect(push.out).toContain('format:check skipped');
  });

  test('adopted app whose package.json lacks the tooling scripts: the check is skipped and says so, the hook survives', () => {
    if (IS_WINDOWS) { return; }
    const { run } = repo({ adopted: true, toolingScripts: false });
    const commit = run('framework_gates_pre_commit');
    expect(commit.code).toBe(0);
    expect(commit.calls).toEqual(['run vars:check', 'run skills:check']);
    expect(commit.out).toContain('no "tooling:types:check" script');
  });
});

describe('the pre-commit hook runs lint-staged only where the project configures it', () => {
  const HOOK = resolve(import.meta.dir, '..', '.husky', 'pre-commit');

  /** Runs the real hook with a stub `bunx` that logs its arguments; no gates file, so only lint-staged can call it. */
  function commit(files: Record<string, string>): { code: number, calls: string[] } {
    const root = mkdtempSync(join(tmpdir(), 'pre-commit lint-staged '));
    roots.push(root);
    const bin = join(root, '.bin');
    mkdirSync(bin);
    const log = join(root, 'calls.log');
    writeFileSync(join(bin, 'bunx'), `#!/bin/sh\necho "$*" >> "${log}"\nexit 0\n`);
    chmodSync(join(bin, 'bunx'), 0o755);
    for (const [rel, text] of Object.entries(files)) { writeFileSync(join(root, rel), text); }
    // A copy of the hook with no gates file beside it: the gates only warn, so lint-staged is all that runs.
    mkdirSync(join(root, '.husky'));
    writeFileSync(join(root, '.husky', 'pre-commit'), readFileSync(HOOK, 'utf8'));
    const p = Bun.spawnSync(['sh', '-e', join(root, '.husky', 'pre-commit')], { cwd: root, stdout: 'pipe', stderr: 'pipe', env: { ...process.env, PATH: `${bin}${delimiter}${process.env.PATH ?? ''}` } });
    let calls: string[] = [];
    try { calls = readFileSync(log, 'utf8').trim().split('\n').filter(Boolean); }
    catch {}
    return { code: p.exitCode ?? 1, calls };
  }

  test('greenfield: package.json carries the config, lint-staged runs as before', () => {
    if (IS_WINDOWS) { return; }
    expect(commit({ 'package.json': '{\n  "lint-staged": {\n    "*.ts": ["eslint --fix"]\n  }\n}\n' }).calls).toEqual(['lint-staged']);
    expect(commit({ '.lintstagedrc.json': '{}', 'package.json': '{}' }).calls).toEqual(['lint-staged']);
  });

  test('adopted app with no config (only the devDependency): skipped, the commit is not failed', () => {
    if (IS_WINDOWS) { return; }
    const r = commit({ 'package.json': '{\n  "devDependencies": {\n    "lint-staged": "^16.2.7"\n  }\n}\n' });
    expect(r.calls).toEqual([]);
    expect(r.code).toBe(0);
  });
});

describe('checks.hooks.scope: staged runs each always-on gate only when its inputs change', () => {
  const ZERO = '0'.repeat(40);
  const git = (root: string, ...args: string[]): string => Bun.spawnSync(['git', '-C', root, ...args], { stdout: 'pipe', stderr: 'pipe' }).stdout.toString().trim();

  /** A committed repo with a stub `bun`; `yaml` is the `.agents/project.yaml` text. */
  function scoped(yaml: string, opts: { adopted?: boolean } = {}) {
    const root = mkdtempSync(join(tmpdir(), 'gates staged '));
    roots.push(root);
    const bin = join(root, '.bin');
    mkdirSync(bin);
    const log = join(root, '.calls.log');
    writeFileSync(join(bin, 'bun'), `#!/bin/sh\necho "$*" >> "${log}"\nexit 0\n`);
    chmodSync(join(bin, 'bun'), 0o755);
    const scripts = { 'types:check': 'x', 'lint:check': 'x', 'format:check': 'x', 'tooling:types:check': 'x', 'tooling:lint:check': 'x', 'docs:check': 'x' };
    writeFileSync(join(root, 'package.json'), `${JSON.stringify({ scripts }, null, 2)}\n`);
    mkdirSync(join(root, '.agents'));
    writeFileSync(join(root, '.agents', 'project.yaml'), yaml);
    mkdirSync(join(root, 'docs'));
    writeFileSync(join(root, 'docs', 'a.md'), 'a\n');
    if (opts.adopted) {
      mkdirSync(join(root, '.template'));
      writeFileSync(join(root, '.template', 'installer.lock.json'), '{ "adopted": true }\n');
    }
    git(root, 'init', '-q');
    git(root, '-c', 'user.email=t@example.com', '-c', 'user.name=t', 'add', '-A');
    git(root, '-c', 'user.email=t@example.com', '-c', 'user.name=t', 'commit', '-qm', 'base');
    const commit = (rel: string, text: string): string => {
      mkdirSync(dirname(join(root, rel)), { recursive: true });
      writeFileSync(join(root, rel), text);
      git(root, 'add', '-A');
      git(root, '-c', 'user.email=t@example.com', '-c', 'user.name=t', 'commit', '-qm', rel);
      return git(root, 'rev-parse', 'HEAD');
    };
    const stage = (rel: string, text: string): void => {
      mkdirSync(dirname(join(root, rel)), { recursive: true });
      writeFileSync(join(root, rel), text);
      git(root, 'add', '-A');
    };
    const run = (fn: string, stdin?: string): { code: number, calls: string[], out: string } => {
      writeFileSync(log, '');
      const p = Bun.spawnSync(['sh', '-e', '-c', `. "${GATES}"; ${fn}`], {
        cwd: root,
        stdin: stdin === undefined ? 'ignore' : Buffer.from(stdin),
        stdout: 'pipe',
        stderr: 'pipe',
        env: { ...process.env, PATH: `${bin}${delimiter}${process.env.PATH ?? ''}` },
      });
      const calls = readFileSync(log, 'utf8').trim().split('\n').filter(Boolean);
      return { code: p.exitCode ?? 1, calls, out: `${p.stdout.toString()}${p.stderr.toString()}` };
    };
    return { root, commit, stage, run, base: git(root, 'rev-parse', 'HEAD') };
  }

  const STAGED = 'checks:\n  hooks:\n    scope: staged # gates follow their inputs\n';
  const FULL_COMMIT = ['run types:check', 'run vars:check', 'run skills:check'];
  const FULL_PUSH = ['run format:check', 'run lint:check', 'run vars:env:check', 'run skills:registry:check', 'run agents:compat:check', 'run docs:check'];

  test('the default, full and an unknown value run every gate; only the unknown value adds a line', () => {
    if (IS_WINDOWS) { return; }
    const absent = scoped('project: {}\n');
    absent.stage('docs/a.md', 'b\n');
    const reference = absent.run('framework_gates_pre_commit');
    expect(reference.calls).toEqual(FULL_COMMIT);
    for (const yaml of ['checks:\n  hooks:\n    scope: full\n', 'checks:\n  hooks: { scope: "full" }\n', 'checks:\n  mcp_parity:\n    hooks:\n      scope: staged\n']) {
      const repo = scoped(yaml);
      repo.stage('docs/a.md', 'b\n');
      expect(repo.run('framework_gates_pre_commit'), yaml).toEqual(reference);
      expect(repo.run('framework_gates_pre_push').calls, yaml).toEqual(FULL_PUSH);
    }
    const typo = scoped('checks:\n  hooks:\n    scope: stagged\n');
    typo.stage('docs/a.md', 'b\n');
    const warned = typo.run('framework_gates_pre_commit');
    expect(warned.calls).toEqual(FULL_COMMIT);
    expect(warned.out).toContain('checks.hooks.scope in .agents/project.yaml is "stagged", not full or staged: every gate runs (full).');
  });

  test('pre-commit: a content-only commit runs no always-on gate and names what it skipped', () => {
    if (IS_WINDOWS) { return; }
    for (const yaml of [STAGED, 'checks:\r\n  hooks: { scope: \'staged\' }\r\n']) {
      const repo = scoped(yaml);
      repo.stage('docs/a.md', 'changed\n');
      const result = repo.run('framework_gates_pre_commit');
      expect(result).toMatchObject({ code: 0, calls: [] });
      expect(result.out).toContain('Skipped (no staged file touches their inputs): types:check, vars:check, skills:check.');
    }
  });

  test('pre-commit: each gate runs when the staged set touches its inputs', () => {
    if (IS_WINDOWS) { return; }
    const cases: Array<[string, string[]]> = [
      ['lib/a.ts', ['run types:check']],
      ['.context/notes.md', ['run vars:check', 'run skills:check']],
      ['.agents/skills/x/SKILL.md', FULL_COMMIT],
      ['package.json', FULL_COMMIT],
    ];
    for (const [rel, calls] of cases) {
      const repo = scoped(STAGED);
      repo.stage(rel, '{}\n');
      expect(repo.run('framework_gates_pre_commit').calls.filter(c => FULL_COMMIT.includes(c)), rel).toEqual(calls);
    }
    // A deletion can break a cited path: skills:check runs.
    const gone = scoped(STAGED);
    git(gone.root, 'rm', '-q', 'docs/a.md');
    expect(gone.run('framework_gates_pre_commit').calls).toEqual(['run skills:check']);
  });

  test('pre-commit on an adopted app: only the tooling scope counts for types', () => {
    if (IS_WINDOWS) { return; }
    const repo = scoped(STAGED, { adopted: true });
    repo.stage('src/app/page.tsx', 'export {};\n');
    expect(repo.run('framework_gates_pre_commit').calls).toEqual([]);
    const tooling = scoped(STAGED, { adopted: true });
    tooling.stage('scripts/x.ts', 'export {};\n');
    expect(tooling.run('framework_gates_pre_commit').calls).toEqual(['run tooling:types:check', 'run vars:check', 'run skills:check']);
  });

  test('pre-push: a content-only range skips the chain, and the refs stay readable after it', () => {
    if (IS_WINDOWS) { return; }
    const repo = scoped(STAGED);
    git(repo.root, 'update-ref', 'refs/remotes/origin/main', repo.base);
    const head = repo.commit('docs/a.md', 'content\n');
    const line = `refs/heads/main ${head} refs/heads/main ${repo.base}`;
    const result = repo.run('framework_gates_pre_push; echo "after: $(cat)"', `${line}\n`);
    expect(result).toMatchObject({ code: 0, calls: ['run docs:check'] });
    expect(result.out).toContain(`after: ${line}`);
    expect(result.out).toContain('Skipped (no file in the push range touches their inputs): format:check, lint:check, vars:env:check, skills:registry:check, agents:compat:check, varlock.');
    const content = scoped(STAGED);
    git(content.root, 'update-ref', 'refs/remotes/origin/main', content.base);
    const top = content.commit('content/page.txt', 'words\n');
    expect(content.run('framework_gates_pre_push', `refs/heads/main ${top} refs/heads/main ${ZERO}\n`).calls).toEqual([]);
  });

  test('pre-push: the gates whose inputs the range touches run, the cross-harness check only on its paths', () => {
    if (IS_WINDOWS) { return; }
    const repo = scoped(STAGED);
    git(repo.root, 'update-ref', 'refs/remotes/origin/main', repo.base);
    const head = repo.commit('.mcp.json', '{}\n');
    expect(repo.run('framework_gates_pre_push', `refs/heads/main ${head} refs/heads/main ${repo.base}\n`).calls)
      .toEqual(['run format:check', 'run lint:check', 'run agents:compat:check']);
    const tooling = scoped(STAGED);
    const top = tooling.commit('scripts/x.ts', 'export {};\n');
    expect(tooling.run('framework_gates_pre_push', `refs/heads/main ${top} refs/heads/main ${tooling.base}\n`).calls).toEqual(FULL_PUSH);
  });

  test('pre-push: no refs, a deleting push and a git failure', () => {
    if (IS_WINDOWS) { return; }
    const repo = scoped(STAGED);
    expect(repo.run('framework_gates_pre_push').calls).toEqual(FULL_PUSH);
    expect(repo.run('framework_gates_pre_push', `(delete) ${ZERO} refs/heads/old ${repo.base}\n`).calls).toEqual([]);
    expect(repo.run('framework_gates_pre_push', `refs/heads/main ${'f'.repeat(40)} refs/heads/main ${ZERO}\n`).calls).toEqual(FULL_PUSH);
  });
});
