import { describe, expect, test } from 'bun:test';

import { appliesToTracker, criticalVars, requiredNow, validateVarManifest, VAR_MANIFEST } from './variables-manifest.ts';

const ATLASSIAN = ['ATLASSIAN_URL', 'ATLASSIAN_EMAIL', 'ATLASSIAN_API_TOKEN'];
const spec = (name: string) => VAR_MANIFEST.find(s => s.name === name)!;

describe('the tracker gate on the Atlassian credentials', () => {
  test('the manifest validates', () => {
    expect(() => validateVarManifest()).not.toThrow();
  });

  test('a Jira project (the default) keeps every Atlassian var required and critical', () => {
    for (const name of ATLASSIAN) {
      expect(spec(name).tracker).toBe('jira');
      expect(requiredNow(spec(name), {})).toBe(true);
      expect(appliesToTracker(spec(name), 'jira')).toBe(true);
    }
    expect(criticalVars().map(s => s.name)).toEqual(expect.arrayContaining([...ATLASSIAN, 'RESEND_API_KEY']));
    expect(criticalVars('jira')).toEqual(criticalVars());
  });

  test.each(['github', 'none'] as const)('a %s project requires none of them and still gets the rest', (tracker) => {
    for (const name of ATLASSIAN) {
      expect(appliesToTracker(spec(name), tracker)).toBe(false);
    }
    expect(criticalVars(tracker).map(s => s.name)).toEqual(['RESEND_API_KEY']);
  });

  test('a var without a tracker belongs to every project', () => {
    const resend = spec('RESEND_API_KEY');
    expect(resend.tracker).toBeUndefined();
    for (const tracker of ['jira', 'github', 'none'] as const) {
      expect(appliesToTracker(resend, tracker)).toBe(true);
    }
  });

  test('only the Atlassian credentials are tied to a tracker', () => {
    expect(VAR_MANIFEST.filter(s => s.tracker !== undefined).map(s => s.name)).toEqual(ATLASSIAN);
  });
});
