/**
 * @fileoverview Proves `.oxlintrc.base.json` runs the GUARD rules under Oxlint,
 * not just ESLint. Each case lints a planted violation in a scratch project
 * whose config extends the real base, so a plugin that stops loading, an
 * `overrides` glob that stops matching or a `settings.guard.layers` map that
 * stops being read fails here instead of in a pre-commit that reports nothing.
 */

import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { afterAll, describe, expect, it } from 'bun:test';

const ROOT = resolve(import.meta.dir, '..');
const OXLINT = join(ROOT, 'node_modules', '.bin', 'oxlint');
const scratch = mkdtempSync(join(tmpdir(), 'oxlint-config-'));

writeFileSync(join(scratch, '.oxlintrc.json'), JSON.stringify({ extends: [join(ROOT, '.oxlintrc.base.json')] }));
writeFileSync(join(scratch, '.oxlintrc.layers.json'), JSON.stringify({
  extends: [join(ROOT, '.oxlintrc.base.json')],
  settings: { guard: { layers: { adapters: ['db/**'], platform: ['lib/**'] } } },
}));

afterAll(() => rmSync(scratch, { recursive: true, force: true }));

function lint(path: string, code: string, config = '.oxlintrc.json'): string {
  const file = join(scratch, path);
  mkdirSync(dirname(file), { recursive: true });
  writeFileSync(file, code);
  const result = Bun.spawnSync([OXLINT, '-c', config, '--format=json', path], { cwd: scratch });
  const report = JSON.parse(result.stdout.toString()) as { diagnostics: { code: string }[] };
  if (result.exitCode !== 0 && report.diagnostics.length === 0) { throw new Error(`oxlint exited ${result.exitCode}: ${result.stderr.toString()}`); }
  return report.diagnostics.map(d => d.code).join('\n');
}

describe('oxlint severity follows GUARD_ENFORCEMENT_LEVEL', () => {
  it('every GUARD severity in .oxlintrc.base.json equals the ESLint constant', async () => {
    const { GUARD_ENFORCEMENT_LEVEL } = await import('../eslint.config.base.js');
    const base = JSON.parse(readFileSync(join(ROOT, '.oxlintrc.base.json'), 'utf8')) as { overrides: { rules: Record<string, unknown> }[] };
    const severities = base.overrides.flatMap(o => Object.entries(o.rules))
      .filter(([name]) => name.startsWith('guard/') || name === 'max-params' || name === 'max-lines')
      .map(([, value]) => (Array.isArray(value) ? value[0] : value));
    expect(severities.length).toBe(4);
    expect(new Set(severities)).toEqual(new Set([GUARD_ENFORCEMENT_LEVEL]));
  });
});

describe('oxlint runs the GUARD rules', () => {
  it('guard/layer-imports reports a feature importing the app layer', () => {
    expect(lint('src/features/notes/a.ts', 'import { p } from \'../../app/page\';\nexport { p };\n')).toContain('guard(layer-imports)');
  });

  it('guard/layer-imports reports src/app importing adapters', () => {
    expect(lint('src/app/b.ts', 'import { d } from \'@adapters/db\';\nexport { d };\n')).toContain('guard(layer-imports)');
  });

  it('guard/feature-door reports a deep import into another feature', () => {
    expect(lint('src/app/c.ts', 'import { n } from \'@features/notes/internal\';\nexport { n };\n')).toContain('guard(feature-door)');
  });

  it('a custom settings.guard.layers map is honoured', () => {
    expect(lint('lib/d.ts', 'import { x } from \'../db/e\';\nexport { x };\n', '.oxlintrc.layers.json')).toContain('guard(layer-imports)');
  });

  it('no-restricted-imports blocks cli/ importing outside cli/', () => {
    expect(lint('cli/e.ts', 'import { x } from \'../scripts/foo\';\nexport { x };\n')).toContain('no-restricted-imports');
  });

  it('max-params reports a third parameter in a feature', () => {
    expect(lint('src/features/notes/f.ts', 'export const f = (a: number, b: number, c: number) => a + b + c;\n')).toContain('max-params');
  });

  it('a clean feature is silent', () => {
    expect(lint('src/features/notes/g.ts', 'export const g = (a: number) => a;\n')).toBe('');
  });
});
