import type { Component, SyncStateV7 } from './updater-types.ts';
import { spawnSync } from 'node:child_process';
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';

import { dirname, join } from 'node:path';

import { afterEach, describe, expect, test } from 'bun:test';
import {
  classifyFile,
  componentOwnedPaths,
  computeComponentAdvancement,
  dirtyTreeExemptions,
  foreignDirtyPaths,
  isBootstrapOnlyFile,
  isLocalTemplateSource,
  parsePorcelainPaths,
  reconcileComponentsByContent,
  syncStateWriteNeeded,
  UPDATER_OWNED_PATHS_ENV,
} from './updater-core.ts';

const temporaryRoots: string[] = [];

function temporaryRoot(): string {
  const root = mkdtempSync(join(tmpdir(), 'updater core '));
  temporaryRoots.push(root);
  return root;
}

function git(root: string, args: string[]): string {
  const res = spawnSync('git', ['-C', root, ...args], { encoding: 'utf8' });
  if (res.status !== 0) { throw new Error(`git ${args.join(' ')} failed: ${res.stderr}`); }
  return res.stdout;
}

function write(root: string, relativePath: string, contents: string): void {
  const destination = join(root, relativePath);
  mkdirSync(dirname(destination), { recursive: true });
  writeFileSync(destination, contents);
}

/** A committed consumer repo: the CLI, the memory file, the lock, a `.backups/` ignore rule. */
function committedConsumer(): string {
  const root = temporaryRoot();
  git(root, ['init', '--quiet', '--initial-branch=main']);
  git(root, ['config', 'user.email', 'test@example.com']);
  git(root, ['config', 'user.name', 'test']);
  write(root, 'cli/update-boilerplate.ts', 'old cli\n');
  write(root, 'cli/lib/updater-core.ts', 'old core\n');
  write(root, 'AGENTS.md', '# memory\n');
  write(root, '.template/boilerplate.lock.json', '{}\n');
  write(root, '.gitignore', '.backups/\n');
  git(root, ['add', '-A']);
  git(root, ['commit', '--quiet', '-m', 'baseline']);
  return root;
}

afterEach(() => {
  while (temporaryRoots.length > 0) {
    const root = temporaryRoots.pop();
    if (root) { rmSync(root, { recursive: true, force: true }); }
  }
});

const CLI: Component = { name: 'cli', type: 'directory', paths: ['cli'] };
const CFG = { components: [CLI], selfUpdateComponent: 'cli', versionFile: '.template/boilerplate.lock.json' };

describe('dirty-tree guard: self-update re-exec', () => {
  // Bunkai PR #234: `bun run up --auto` ran the migration preflight, the parent
  // refreshed `cli/` and re-exec'd, and the CHILD aborted on the dirty tree the
  // parent had just produced; `--force` was the only way through.

  test('the re-exec child ignores the CLI files its parent rewrote, and still refuses user work', () => {
    const root = committedConsumer();
    // What the parent does before re-exec: overwrite the self-update component, write a backup.
    write(root, 'cli/update-boilerplate.ts', 'new cli\n');
    write(root, 'cli/lib/updater-parity.ts', 'new file\n');
    write(root, '.backups/update-1/cli/update-boilerplate.ts', 'old cli\n');

    const porcelain = git(root, ['status', '--porcelain']);
    expect(porcelain).toContain('cli/update-boilerplate.ts');

    const child = { UPEX_UPDATER_REEXEC: '1' } as NodeJS.ProcessEnv;
    expect(foreignDirtyPaths(porcelain, dirtyTreeExemptions(CFG, {}, child))).toEqual([]);

    // A parent process (no REEXEC) has no such exemption: that dirt is foreign to it.
    expect(foreignDirtyPaths(porcelain, dirtyTreeExemptions(CFG, {}, {} as NodeJS.ProcessEnv)).sort())
      .toEqual(['cli/lib/updater-parity.ts', 'cli/update-boilerplate.ts']);

    // Genuine uncommitted work next to the self-update still aborts the child.
    write(root, 'AGENTS.md', '# memory, edited and never committed\n');
    expect(foreignDirtyPaths(git(root, ['status', '--porcelain']), dirtyTreeExemptions(CFG, {}, child))).toEqual(['AGENTS.md']);
  });

  test('the lock file and .backups/ are updater-owned in the parent as well as the child', () => {
    const root = committedConsumer();
    // A previous run rewrote the lock and left a backup; the user committed neither.
    write(root, '.template/boilerplate.lock.json', '{"schemaVersion":7}\n');
    write(root, '.backups/update-1/AGENTS.md', '# memory\n');
    const porcelain = git(root, ['status', '--porcelain', '--untracked-files=all']);
    expect(porcelain).toContain('.template/boilerplate.lock.json');

    const parent = {} as NodeJS.ProcessEnv;
    expect(foreignDirtyPaths(porcelain, dirtyTreeExemptions(CFG, {}, parent))).toEqual([]);
    // Ignored by git anyway (.gitignore has .backups/), but exempt even when it is not.
    expect(foreignDirtyPaths('?? .backups/update-2/x.ts\n M .template/boilerplate.lock.json', dirtyTreeExemptions(CFG, {}, parent))).toEqual([]);
    // User work next to them still aborts.
    write(root, 'AGENTS.md', '# edited\n');
    expect(foreignDirtyPaths(git(root, ['status', '--porcelain']), dirtyTreeExemptions(CFG, {}, parent))).toEqual(['AGENTS.md']);
  });

  test('preflight output handed down through the env is exempt in the child too', () => {
    const root = committedConsumer();
    // The cross-harness migration promoted CLAUDE.md, appended .gitignore and unindexed skills.
    write(root, 'CLAUDE.md', '@AGENTS.md\n');
    write(root, '.gitignore', '.backups/\n.claude/skills\n');
    git(root, ['add', '.gitignore']);
    const porcelain = git(root, ['status', '--porcelain']);

    const owned = ['CLAUDE.md', '.gitignore', '.claude/skills'];
    // Parent: the wrapper passes what the migration touched.
    expect(foreignDirtyPaths(porcelain, dirtyTreeExemptions(CFG, { updaterOwnedPaths: owned }, {} as NodeJS.ProcessEnv))).toEqual([]);
    // Child: same list arrives through the env var the parent set on spawn.
    const env = { UPEX_UPDATER_REEXEC: '1', [UPDATER_OWNED_PATHS_ENV]: owned.join('\n') } as NodeJS.ProcessEnv;
    expect(foreignDirtyPaths(porcelain, dirtyTreeExemptions(CFG, {}, env))).toEqual([]);
    // Without either, the same dirt is refused.
    expect(foreignDirtyPaths(porcelain, dirtyTreeExemptions(CFG, {}, {} as NodeJS.ProcessEnv)).sort()).toEqual(['.gitignore', 'CLAUDE.md']);
  });

  test('porcelain parsing handles renames, quoted paths and both status columns', () => {
    const porcelain = [
      ' M cli/a.ts',
      'A  cli/b.ts',
      '?? AGENTS.md',
      'R  old/name.ts -> new/name.ts',
      '?? "dir with space/file.md"',
      // A caller that `.trim()`ed the output loses the first line's leading column.
      'D .claude/hooks/personality-reinject.js',
    ].join('\n');
    expect(parsePorcelainPaths(porcelain)).toEqual([
      'cli/a.ts',
      'cli/b.ts',
      'AGENTS.md',
      'old/name.ts',
      'new/name.ts',
      'dir with space/file.md',
      '.claude/hooks/personality-reinject.js',
    ]);
    // The real guard lists untracked files one by one (-uall), so a directory the
    // migration created matches its per-skill exemption file by file.
    expect(foreignDirtyPaths('?? .agents/skills/acli/SKILL.md\n?? .agents/skills/acli/references/x.md', ['.agents/skills/acli'])).toEqual([]);
    // Segment-aware: `cli` never swallows `cli-tools`.
    expect(foreignDirtyPaths(' M cli-tools/x.ts\n M cli/y.ts', ['cli'])).toEqual(['cli-tools/x.ts']);
  });

  test('component claims cover directory trees and file-list literals', () => {
    expect(componentOwnedPaths(CLI)).toEqual(['cli']);
    expect(componentOwnedPaths({ name: 'tooling', type: 'file-list', paths: ['.'], files: ['.editorconfig'] })).toEqual(['.editorconfig']);
    expect(componentOwnedPaths({ name: 'agents', type: 'file-list', paths: ['.agents'], files: ['project.yaml'] })).toEqual(['.agents/project.yaml']);
  });
});

describe('syncStateWriteNeeded', () => {
  const state: SyncStateV7 = {
    schemaVersion: 7,
    templateRepo: 'upex-galaxy/agentic-dev-boilerplate',
    templateCommit: 'abc',
    perComponentCommit: { cli: 'abc', docs: 'abc' },
    syncedComponents: ['cli', 'docs'],
    ignoreFileSync: {},
    packageJsonSync: {},
    cliVersion: '8.0',
    lastSyncedAt: '2026-09-04T10:00:00.000Z',
    variableSystemVersion: 1,
  };

  test('a run that changed nothing but the timestamp leaves the lock alone, whatever the key order', () => {
    const onDisk = `${JSON.stringify(state, null, 2)}\n`;
    expect(syncStateWriteNeeded(onDisk, { ...state, lastSyncedAt: '2026-09-05T00:00:00.000Z' })).toBe(false);
    const { perComponentCommit: _cursors, lastSyncedAt: _stamp, ...rest } = state;
    const reordered = JSON.stringify({ lastSyncedAt: 'x', perComponentCommit: { docs: 'abc', cli: 'abc' }, ...rest });
    expect(syncStateWriteNeeded(reordered, state)).toBe(false);
  });

  test('any real change, a missing lock or an unreadable one still writes', () => {
    const onDisk = JSON.stringify(state);
    expect(syncStateWriteNeeded(onDisk, { ...state, perComponentCommit: { ...state.perComponentCommit, cli: 'def' } })).toBe(true);
    expect(syncStateWriteNeeded(onDisk, { ...state, cliVersion: '9.0' })).toBe(true);
    expect(syncStateWriteNeeded(onDisk, { ...state, ignoreFileSync: { '.gitignore': { lastSyncedSha: 'x', appendedLines: [] } } })).toBe(true);
    expect(syncStateWriteNeeded(null, state)).toBe(true);
    expect(syncStateWriteNeeded('{not json', state)).toBe(true);
  });
});

describe('.claude/settings.json is delivered once, then project-owned', () => {
  const rootConfig: Component = { name: 'agent-root-config', type: 'file-list', paths: ['.claude'], files: ['settings.json'], bootstrapOnly: true };

  function template(): string {
    const dir = temporaryRoot();
    git(dir, ['init', '--quiet', '--initial-branch=main']);
    git(dir, ['config', 'user.email', 'test@example.com']);
    git(dir, ['config', 'user.name', 'test']);
    write(dir, '.claude/settings.json', '{"permissions":{"allow":[]},"hooks":{}}\n');
    git(dir, ['add', '-A']);
    git(dir, ['commit', '--quiet', '-m', 'upstream']);
    return dir;
  }

  test('a project without the file receives upstream\'s copy', () => {
    const upstream = template();
    const project = temporaryRoot();
    const entries = reconcileComponentsByContent(upstream, [rootConfig], project, []);
    expect(entries.map(e => [e.path, e.classification])).toEqual([['.claude/settings.json', 'new-upstream']]);
    expect(classifyFile({ component: 'agent-root-config', path: '.claude/settings.json', status: 'A', fromSha: '', toSha: 'x', added: 1, removed: 0, isBinary: false, templateOldSha: null, templateNewSha: 'x' }, upstream, project, [rootConfig], [])).toBe('new-upstream');
  });

  test('a bootstrapped component with nothing to deliver still gets its lock cursor', () => {
    // Otherwise the lock never learns the component and every later run
    // repeats "bootstrap parcial" for it.
    const entry = { component: 'docs', path: 'docs/a.md', status: 'A' as const, fromSha: '', toSha: 'x', added: 1, removed: 0, isBinary: false, templateOldSha: null, templateNewSha: 'x', classification: 'new-upstream' as const };
    const advancement = computeComponentAdvancement({ applied: [{ entry, resolution: 'theirs' }], skipped: [], failed: [] }, [], ['agent-root-config', 'docs']);
    expect(advancement.componentsAdvanced.sort()).toEqual(['agent-root-config', 'docs']);
    expect(advancement.componentsHeldBack).toEqual([]);
    // A bootstrapped component that DID skip something is still held back.
    const held = computeComponentAdvancement({ applied: [], skipped: [entry], failed: [] }, [], ['docs']);
    expect(held).toEqual({ componentsAdvanced: [], componentsHeldBack: ['docs'] });
  });

  test('an existing file is never offered as diverged, however different it is', () => {
    const upstream = template();
    const project = temporaryRoot();
    write(project, '.claude/settings.json', '{"permissions":{"allow":["Bash(bun *)"]},"hooks":{}}\n');
    expect(reconcileComponentsByContent(upstream, [rootConfig], project, [])).toEqual([]);
    expect(classifyFile({ component: 'agent-root-config', path: '.claude/settings.json', status: 'M', fromSha: '', toSha: 'x', added: 1, removed: 1, isBinary: false, templateOldSha: 'y', templateNewSha: 'x' }, upstream, project, [rootConfig], [])).toBe('unchanged');
    expect(isBootstrapOnlyFile('.claude/settings.json', rootConfig, [])).toBe(true);
  });
});

describe('isLocalTemplateSource', () => {
  test('GitHub handles go through gh; paths and file URLs are local', () => {
    expect(isLocalTemplateSource('upex-galaxy/agentic-dev-boilerplate')).toBe(false);
    expect(isLocalTemplateSource('/tmp/upstream')).toBe(true);
    expect(isLocalTemplateSource('./upstream')).toBe(true);
    expect(isLocalTemplateSource('../upstream')).toBe(true);
    expect(isLocalTemplateSource('file:///tmp/upstream')).toBe(true);
    expect(isLocalTemplateSource('C:\\upstream')).toBe(true);
  });
});

describe('isBootstrapOnlyFile', () => {
  const agents: Component = { name: 'agents', type: 'file-list', paths: ['.agents'], files: ['README.md', 'project.yaml'] };
  const compat: Component = { name: 'agent-compatibility', type: 'directory', paths: ['.agents/skills', '.agents/compatibility'] };
  const paths = ['.agents/project.yaml', '.agents/compatibility/command-aliases.project.json'];

  test('an exact listed path binds for ANY component, not only `agents`', () => {
    expect(isBootstrapOnlyFile('.agents/compatibility/command-aliases.project.json', compat, paths)).toBe(true);
    expect(isBootstrapOnlyFile('.agents/compatibility/command-aliases.json', compat, paths)).toBe(false);
    expect(isBootstrapOnlyFile('.agents\\compatibility\\command-aliases.project.json', compat, paths)).toBe(true);
  });

  test('the legacy agents basename contract and its framework-file override still hold', () => {
    expect(isBootstrapOnlyFile('.agents/project.yaml', agents, paths)).toBe(true);
    expect(isBootstrapOnlyFile('.agents/project.yaml', agents, ['project.yaml'])).toBe(true);
    expect(isBootstrapOnlyFile('.agents/README.md', agents, paths, ['README.md'])).toBe(false);
    // A basename is NOT enough outside `agents`.
    expect(isBootstrapOnlyFile('docs/project.yaml', { name: 'docs', type: 'directory', paths: ['docs'] }, ['project.yaml'])).toBe(false);
  });

  test('a bootstrapOnly component is bootstrap-only regardless of the list, minus its framework files', () => {
    expect(isBootstrapOnlyFile('.codex/config.toml', { name: 'codex-config', type: 'directory', paths: ['.codex'], bootstrapOnly: true }, [])).toBe(true);
    // The fresh-install walk used to ignore `frameworkFiles`, so a legacy repo's
    // README scaffolds stayed stale until the NEXT (delta) run re-applied them.
    const context: Component = { name: 'context', type: 'directory', paths: ['.context'], bootstrapOnly: true, frameworkFiles: ['README.md'], frameworkFilesExcept: ['.context/ADR/README.md'] };
    expect(isBootstrapOnlyFile('.context/PRD/README.md', context, [])).toBe(false);
    expect(isBootstrapOnlyFile('.context/ADR/README.md', context, [])).toBe(true);
    expect(isBootstrapOnlyFile('.context/PRD/prd.md', context, [])).toBe(true);
  });
});
