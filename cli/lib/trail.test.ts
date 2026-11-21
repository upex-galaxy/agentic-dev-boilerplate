import type { CheckIgnore } from './trail.ts';
import { describe, expect, test } from 'bun:test';
import { readTrailConfig, resolveTrail, TRAIL_FILES, trailDiagnostic } from './trail.ts';

describe('resolveTrail', () => {
  test.each([
    ['github', null, true],
    ['none', null, true],
    ['jira', null, false],
    ['jira', true, true],
    ['github', false, false],
    ['none', false, false],
    ['jira', 'yes', false],
  ] as const)('%s with enabled %p is %p', (tracker, enabled, expected) => {
    expect(resolveTrail(tracker, enabled)).toBe(expected);
  });
});

describe('readTrailConfig', () => {
  test('reads enabled and dir, and falls back when the block is absent', () => {
    expect(readTrailConfig('trail:\n  enabled: true\n  dir: sessions/ # kept\n')).toEqual({ enabled: true, dir: 'sessions' });
    expect(readTrailConfig('trail:\n  enabled: null\n')).toEqual({ enabled: null, dir: '.context/trail' });
    expect(readTrailConfig('stack:\n  dir: nope\n')).toEqual({ enabled: null, dir: '.context/trail' });
  });
});

describe('trailDiagnostic', () => {
  const ignoreAll: CheckIgnore = path => ({ status: 0, stdout: `.gitignore:12:sessions/**\t${path}\n` });
  const keepAll: CheckIgnore = () => ({ status: 1, stdout: '' });
  const negated: CheckIgnore = path => ({ status: 0, stdout: `.gitignore:20:!sessions/*/plan.md\t${path}\n` });

  test('checks the four kept names under a custom dir and reports the ignored ones', () => {
    const seen: string[] = [];
    const result = trailDiagnostic('trail:\n  dir: sessions\n', 'github', (p) => { seen.push(p); return ignoreAll(p); });
    expect(seen).toEqual(TRAIL_FILES.map(n => `sessions/doctor-probe/${n}`));
    expect(result.ignored).toHaveLength(4);
    expect(result.ignored[0].rule).toBe('.gitignore:12:sessions/**');
  });

  test('a kept file or a negated rule is not reported', () => {
    expect(trailDiagnostic('', 'none', keepAll).ignored).toEqual([]);
    expect(trailDiagnostic('', 'none', negated).ignored).toEqual([]);
  });

  test('does not run git when the trail is off (jira default or enabled false)', () => {
    const never: CheckIgnore = () => { throw new Error('git must not run'); };
    expect(trailDiagnostic('', 'jira', never).enabled).toBe(false);
    expect(trailDiagnostic('trail:\n  enabled: false\n', 'github', never).enabled).toBe(false);
    expect(trailDiagnostic('trail:\n  enabled: true\n', 'jira', keepAll).enabled).toBe(true);
  });
});
