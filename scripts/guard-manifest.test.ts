import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';

import { afterAll, beforeAll, describe, expect, test } from 'bun:test';

import { buildManifest, DEFAULT_ROOT, featuresRoot, formatWarning, GUARD_ENFORCEMENT_LEVEL, isStale, parseExports, serializeManifest } from './guard-manifest.ts';

const SCRIPT = resolve(import.meta.dir, 'guard-manifest.ts');
let tmp: string;
let root: string;

beforeAll(() => {
  tmp = mkdtempSync(join(tmpdir(), 'guard-manifest-'));
  root = join(tmp, 'features');
  mkdirSync(join(root, 'billing'), { recursive: true });
  mkdirSync(join(root, 'orders'), { recursive: true });
  mkdirSync(join(root, 'ghost'), { recursive: true });
  writeFileSync(join(root, 'billing', 'index.ts'), 'export { createInvoice, type Invoice } from \'./actions\';\nexport const payInvoice = 1;\n');
  writeFileSync(join(root, 'orders', 'index.tsx'), 'export function createInvoice() {}\nexport * from \'./queries\';\nexport default function Page() {}\n');
  writeFileSync(join(root, 'ghost', 'helper.ts'), 'export const x = 1;\n');
});

afterAll(() => rmSync(tmp, { recursive: true, force: true }));

describe('parseExports', () => {
  test('collects named, re-exported, aliased, star and default exports sorted', () => {
    const source = '// export const hidden = 1\nexport const b = 1;\nexport async function a() {}\nexport { c as d, type E } from \'./x\';\nexport * from \'./y\';\nexport * as ns from \'./z\';\nexport default 1;\n';
    expect(parseExports(source)).toEqual(['* from ./y', 'E', 'a', 'b', 'd', 'default', 'ns']);
  });
});

describe('buildManifest', () => {
  test('lists features with doors, warns on a missing door and a duplicate action', () => {
    const manifest = buildManifest(root, tmp);
    expect(manifest.features.map(f => f.name)).toEqual(['billing', 'orders']);
    expect(manifest.features[0]).toEqual({ name: 'billing', door: 'features/billing/index.ts', exports: ['Invoice', 'createInvoice', 'payInvoice'] });
    expect(manifest.warnings).toEqual([
      'feature "ghost" has no index.ts or index.tsx door',
      'action "createInvoice" is exported by billing and orders (possible duplicate)',
    ]);
    expect(formatWarning('x')).toBe(`guard-manifest: ${GUARD_ENFORCEMENT_LEVEL}: x`);
  });

  test('output is stable and has no timestamp', () => {
    const a = serializeManifest(buildManifest(root, tmp));
    expect(a).toBe(serializeManifest(buildManifest(root, tmp)));
    expect(a).not.toContain('generatedAt');
    expect(isStale(buildManifest(root, tmp), a)).toBe(false);
    expect(isStale(buildManifest(root, tmp), null)).toBe(true);
  });
});

describe('featuresRoot', () => {
  const project = (yaml: string | null) => {
    const dir = mkdtempSync(join(tmp, 'project-'));
    if (yaml !== null) {
      mkdirSync(join(dir, '.agents'));
      writeFileSync(join(dir, '.agents', 'project.yaml'), yaml);
    }
    return dir;
  };

  test('reads stack.conventions.features_root relative to stack.app_root', () => {
    expect(featuresRoot(project('stack:\n  app_root: .\n  conventions:\n    features_root: lib # where features live\n'))).toBe('lib');
    expect(featuresRoot(project('stack:\n  app_root: apps/web\n  conventions:\n    features_root: modules\n'))).toBe('apps/web/modules');
  });

  test('falls back to src/features below app_root when the key is null, absent or unreadable', () => {
    expect(featuresRoot(project('stack:\n  conventions:\n    features_root: null\n'))).toBe(DEFAULT_ROOT);
    expect(featuresRoot(project('stack:\n  app_root: apps/web\n'))).toBe(`apps/web/${DEFAULT_ROOT}`);
    expect(featuresRoot(project(null))).toBe(DEFAULT_ROOT);
    expect(featuresRoot(project('stack: [unclosed\n'))).toBe(DEFAULT_ROOT);
  });
});

describe('cli', () => {
  const run = (...args: string[]) => Bun.spawnSync(['bun', SCRIPT, ...args], { cwd: tmp });

  test('generate then --check passes, a stale file fails', () => {
    const clean = join(tmp, 'clean');
    mkdirSync(join(clean, 'billing'), { recursive: true });
    writeFileSync(join(clean, 'billing', 'index.ts'), 'export const payInvoice = 1;\n');
    const out = join(tmp, 'm.json');
    expect(run('--root', clean, '--out', out).exitCode).toBe(0);
    expect(JSON.parse(readFileSync(out, 'utf8')).features).toHaveLength(1);
    expect(run('--root', clean, '--out', out, '--check').exitCode).toBe(0);
    writeFileSync(join(clean, 'billing', 'index.ts'), 'export const other = 1;\n');
    expect(run('--root', clean, '--out', out, '--check').exitCode).toBe(1);
  });

  test('a warning fails --check exactly when the level is error', () => {
    const out = join(tmp, 'w.json');
    const expected = GUARD_ENFORCEMENT_LEVEL === 'error' ? 1 : 0;
    expect(run('--root', root, '--out', out).exitCode).toBe(expected);
    expect(run('--root', root, '--out', out, '--check').exitCode).toBe(expected);
  });

  test('with no --root the yaml key picks the folder', () => {
    const app = mkdtempSync(join(tmp, 'app-'));
    mkdirSync(join(app, '.agents'));
    writeFileSync(join(app, '.agents', 'project.yaml'), 'stack:\n  conventions:\n    features_root: lib\n');
    mkdirSync(join(app, 'lib', 'billing'), { recursive: true });
    writeFileSync(join(app, 'lib', 'billing', 'index.ts'), 'export const payInvoice = 1;\n');
    const r = Bun.spawnSync(['bun', SCRIPT], { cwd: app });
    expect(r.exitCode).toBe(0);
    expect(JSON.parse(readFileSync(join(app, 'guard-manifest.json'), 'utf8')).features).toEqual([{ name: 'billing', door: 'lib/billing/index.ts', exports: ['payInvoice'] }]);
  });

  test('missing features root exits 0 with one line', () => {
    const r = run('--root', join(tmp, 'nope'), '--check');
    expect(r.exitCode).toBe(0);
    expect(r.stdout.toString().trim()).toBe('no features folder: nothing to check');
  });
});
