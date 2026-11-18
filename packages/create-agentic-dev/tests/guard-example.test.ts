import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { afterEach, beforeEach, describe, expect, test } from 'bun:test';

import { copyGuardExample, GUARD_EXAMPLE_DIR, pruneBootstrapExcludes } from '../src/prepare.ts';

let dir: string;

function write(rel: string, content: string): void {
  mkdirSync(join(dir, rel, '..'), { recursive: true });
  writeFileSync(join(dir, rel), content);
}

beforeEach(() => {
  dir = mkdtempSync(join(tmpdir(), 'cad-guard-'));
  write(`${GUARD_EXAMPLE_DIR}/src/features/notes/index.ts`, 'export {};\n');
  write(`${GUARD_EXAMPLE_DIR}/src/platform/env.ts`, 'export {};\n');
  write(`${GUARD_EXAMPLE_DIR}/guard-manifest.json`, '{}\n');
  write(`${GUARD_EXAMPLE_DIR}/README.md`, '# example\n');
});

afterEach(() => {
  rmSync(dir, { recursive: true, force: true });
});

describe('copyGuardExample', () => {
  test('a new project gets src/** and the manifest, not the package files', async () => {
    const copied = await copyGuardExample(dir);
    expect(copied.sort()).toEqual(['guard-manifest.json', 'src/features/notes/index.ts', 'src/platform/env.ts']);
    expect(readFileSync(join(dir, 'guard-manifest.json'), 'utf8')).toBe('{}\n');
    expect(readFileSync(join(dir, 'src/features/notes/index.ts'), 'utf8')).toBe('export {};\n');
  });

  test('an existing file is never overwritten', async () => {
    write('src/platform/env.ts', 'export const mine = 1;\n');
    write('guard-manifest.json', '{"mine":true}\n');
    const copied = await copyGuardExample(dir);
    expect(copied).toEqual(['src/features/notes/index.ts']);
    expect(readFileSync(join(dir, 'src/platform/env.ts'), 'utf8')).toBe('export const mine = 1;\n');
    expect(readFileSync(join(dir, 'guard-manifest.json'), 'utf8')).toBe('{"mine":true}\n');
  });

  test('the copy survives the prune of packages/', async () => {
    await copyGuardExample(dir);
    await pruneBootstrapExcludes(dir);
    expect(readFileSync(join(dir, 'src/features/notes/index.ts'), 'utf8')).toBe('export {};\n');
    expect(() => readFileSync(join(dir, GUARD_EXAMPLE_DIR, 'README.md'))).toThrow();
  });

  test('a repo without the example copies nothing', async () => {
    rmSync(join(dir, GUARD_EXAMPLE_DIR), { recursive: true });
    expect(await copyGuardExample(dir)).toEqual([]);
  });
});

describe('where the example is copied from', () => {
  const cli = readFileSync(join(import.meta.dir, '../src/cli.ts'), 'utf8');

  test('only the new-project path calls it, before the prune; adoption never does', () => {
    expect(cli.match(/copyGuardExample\(/g)).toHaveLength(1);
    expect(cli.indexOf('copyGuardExample(projectDir)')).toBeLessThan(cli.indexOf('pruneBootstrapExcludes(projectDir)'));
    const adopt = cli.slice(cli.indexOf('async function runAdopt'));
    expect(adopt).not.toContain('copyGuardExample');
  });

  test('the updater never syncs packages/ or src/', () => {
    const updater = readFileSync(join(import.meta.dir, '../../../cli/update-boilerplate.ts'), 'utf8');
    expect(updater).not.toContain('guard-example');
    expect(updater).not.toMatch(/path:\s*'src\b/);
  });
});
