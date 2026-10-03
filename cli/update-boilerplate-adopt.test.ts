import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { afterEach, describe, expect, test } from 'bun:test';
import { parseArgs } from './update-boilerplate.ts';

const UPDATER = join(import.meta.dir, 'update-boilerplate.ts');
const roots: string[] = [];
function tempRoot(): string {
  const root = mkdtempSync(join(tmpdir(), 'updater adopt cli '));
  roots.push(root);
  return root;
}
afterEach(() => {
  while (roots.length > 0) { rmSync(roots.pop()!, { recursive: true, force: true }); }
});

function run(cwd: string, args: string[]): { status: number | null, out: string } {
  const res = Bun.spawnSync(['bun', UPDATER, ...args], { cwd, stdout: 'pipe', stderr: 'pipe', stdin: 'ignore' });
  return { status: res.exitCode, out: `${res.stdout.toString()}${res.stderr.toString()}` };
}

describe('--adopt flag', () => {
  test('parses, and stays off by default (a plain run is unchanged)', () => {
    expect(parseArgs(['--adopt']).adopt).toBe(true);
    expect(parseArgs([]).adopt).toBe(false);
    expect(parseArgs(['--auto']).adopt).toBe(false);
  });

  test('refuses to combine with --force or a component subset', () => {
    const cwd = tempRoot();
    for (const extra of [['--force'], ['scripts']]) {
      const res = run(cwd, ['--adopt', ...extra]);
      expect(res.status).toBe(1);
      expect(res.out).toContain('--adopt no se combina');
    }
  });

  test('on an adopted repo a second --adopt is a no-op that exits 0; on a greenfield lock it refuses', () => {
    const cwd = tempRoot();
    mkdirSync(join(cwd, '.template'));
    writeFileSync(join(cwd, '.template', 'boilerplate.lock.json'), '{}\n');
    writeFileSync(join(cwd, '.template', 'installer.lock.json'), '{"template":"upex-galaxy/agentic-dev-boilerplate","adopted":true}\n');
    const adopted = run(cwd, ['--adopt']);
    expect(adopted.status).toBe(0);
    expect(adopted.out).toContain('ya está adoptado');

    writeFileSync(join(cwd, '.template', 'installer.lock.json'), '{"template":"upex-galaxy/agentic-dev-boilerplate"}\n');
    const greenfield = run(cwd, ['--adopt']);
    expect(greenfield.status).toBe(1);
    expect(greenfield.out).toContain('solo para la primera corrida');
  });
});
