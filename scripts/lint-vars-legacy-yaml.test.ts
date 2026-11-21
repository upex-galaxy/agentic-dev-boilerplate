import { copyFileSync, mkdirSync, mkdtempSync, readFileSync, rmSync, symlinkSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';

import { afterEach, describe, expect, test } from 'bun:test';

const REPO = resolve(import.meta.dir, '..');
const roots: string[] = [];
afterEach(() => {
  for (const root of roots.splice(0)) { rmSync(root, { recursive: true, force: true }); }
});

export function legacyShape(yamlText: string): string {
  const lines = yamlText.split('\n');
  const out: string[] = [];
  let skipping: number | null = null;
  for (const line of lines) {
    const indent = line.length - line.trimStart().length;
    if (skipping !== null) {
      if (line.trim() === '' || indent > skipping) { continue; }
      skipping = null;
    }
    if (line.startsWith('trail:') || /^ {2}github:/.test(line)) { skipping = indent; continue; }
    if (/^ {2}local_build:/.test(line)) { continue; }
    out.push(line);
  }
  return out.join('\n');
}

describe('vars:check on a project.yaml written before the tracker, trail and local_build keys', () => {
  test('the shape helper removes exactly those three keys', () => {
    const legacy = legacyShape(readFileSync(join(REPO, '.agents/project.yaml'), 'utf8'));
    expect(legacy).not.toContain('local_build');
    expect(legacy).not.toMatch(/^trail:/m);
    expect(legacy).not.toMatch(/^ {2}github:/m);
    expect(legacy).toContain('git_strategy:');
  });

  test('exits 0 against the shipped skills, so a synced project that declined the backfill keeps committing', () => {
    const root = mkdtempSync(join(tmpdir(), 'lint-vars-legacy-'));
    roots.push(root);
    const copy = (rel: string, text?: string): void => {
      mkdirSync(dirname(join(root, rel)), { recursive: true });
      if (text === undefined) { copyFileSync(join(REPO, rel), join(root, rel)); }
      else { writeFileSync(join(root, rel), text); }
    };
    copy('.agents/project.yaml', legacyShape(readFileSync(join(REPO, '.agents/project.yaml'), 'utf8')));
    for (const rel of ['.agents/project.schema.yaml', '.agents/jira-required.yaml', 'scripts/lint-vars.ts', 'cli/lib/check-scope.ts', 'AGENTS.md', '.agents/skills/sprint-development/SKILL.md', '.agents/skills/REGISTRY.md']) { copy(rel); }
    symlinkSync(join(REPO, 'node_modules'), join(root, 'node_modules'));
    const result = Bun.spawnSync(['bun', 'scripts/lint-vars.ts'], { cwd: root, stdout: 'pipe', stderr: 'pipe' });
    const out = result.stdout.toString() + result.stderr.toString();
    expect(out).not.toContain('UNDECLARED stack reference');
    expect(result.exitCode).toBe(0);
  });
});
