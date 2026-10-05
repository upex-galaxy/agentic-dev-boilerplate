/**
 * Regression tests for `scripts/env-set.ts`, the only write path into `.env`
 * an agent may use (Critical Rule #1). What they guard:
 *   1. Both refusal paths: a key the manifest marks `secret: true`, and a key
 *      the manifest does not declare at all (default = refuse). A refusal
 *      writes nothing, even when another pair in the same call was allowed.
 *   2. A key whose value is not read from `.env` (ATLASSIAN_URL) is refused.
 *   3. The upsert replaces the active line in place, keeps comments and every
 *      other line byte-identical, and appends a missing key.
 *   4. Nothing printed carries a value: neither the one written nor any other.
 */

import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';

import { formatValue, parsePairs, refusalFor, run, upsertEnvLine } from './env-set.ts';

const OTHER_SECRET = 'canary-other-secret-value';

let root: string;
let printed: string[];
const out = (line: string): void => { printed.push(line); };

beforeEach(() => {
  root = mkdtempSync(join(tmpdir(), 'env-set-'));
  printed = [];
  writeFileSync(join(root, '.env'), [
    '# local env',
    `SUPABASE_SECRET_KEY=${OTHER_SECRET}`,
    'NEXT_PUBLIC_APP_URL=http://localhost:3000',
    '# NEXT_PUBLIC_APP_URL=commented-out',
    '',
  ].join('\n'));
});

afterEach(() => { rmSync(root, { recursive: true, force: true }); });

const envText = (): string => readFileSync(join(root, '.env'), 'utf8');

describe('refusal', () => {
  it('refuses a key the manifest marks secret', () => {
    expect(refusalFor('SUPABASE_SECRET_KEY')).toContain('is a secret');
    const before = envText();
    expect(run(['SUPABASE_SECRET_KEY=new-value'], root, out)).toBe(1);
    expect(envText()).toBe(before);
  });

  it('refuses a key the manifest does not declare (default = refuse)', () => {
    expect(refusalFor('SOME_UNDECLARED_KEY')).toContain('not declared');
    const before = envText();
    expect(run(['SOME_UNDECLARED_KEY=x'], root, out)).toBe(1);
    expect(envText()).toBe(before);
  });

  it('refuses a key whose value does not live in .env', () => {
    expect(refusalFor('ATLASSIAN_URL')).toContain('not read from .env');
  });

  it('writes nothing when any pair in the call is refused', () => {
    const before = envText();
    expect(run(['NEXT_PUBLIC_APP_URL=https://staging.example.com', 'ATLASSIAN_API_TOKEN=x'], root, out)).toBe(1);
    expect(envText()).toBe(before);
    expect(printed.join('\n')).toContain('nothing written');
  });

  it('accepts a manifest key marked non-sensitive', () => {
    expect(refusalFor('NEXT_PUBLIC_APP_URL')).toBeNull();
  });
});

describe('write', () => {
  it('replaces the active line in place and leaves every other line alone', () => {
    expect(run(['NEXT_PUBLIC_APP_URL=https://staging.example.com'], root, out)).toBe(0);
    expect(envText()).toBe([
      '# local env',
      `SUPABASE_SECRET_KEY=${OTHER_SECRET}`,
      'NEXT_PUBLIC_APP_URL=https://staging.example.com',
      '# NEXT_PUBLIC_APP_URL=commented-out',
      '',
    ].join('\n'));
  });

  it('appends a key that has no active line', () => {
    expect(upsertEnvLine('A=1', 'N8N_API_URL', 'https://n8n.example.com')).toBe('A=1\nN8N_API_URL=https://n8n.example.com\n');
  });

  it('keeps an export prefix', () => {
    expect(upsertEnvLine('export NEXT_PUBLIC_APP_URL=old\n', 'NEXT_PUBLIC_APP_URL', 'new')).toBe('export NEXT_PUBLIC_APP_URL=new\n');
  });

  it('never prints a value', () => {
    run(['NEXT_PUBLIC_APP_URL=https://staging.example.com'], root, out);
    run(['SUPABASE_SECRET_KEY=attempted-secret'], root, out);
    const all = printed.join('\n');
    expect(all).toContain('NEXT_PUBLIC_APP_URL');
    expect(all).not.toContain('staging.example.com');
    expect(all).not.toContain('attempted-secret');
    expect(all).not.toContain(OTHER_SECRET);
  });

  it('refuses when .env does not exist', () => {
    rmSync(join(root, '.env'));
    expect(run(['NEXT_PUBLIC_APP_URL=x'], root, out)).toBe(1);
  });
});

describe('parsing and formatting', () => {
  it('keeps an = inside the value', () => {
    expect(parsePairs(['NEXT_PUBLIC_APP_URL=https://h/?a=b'])).toEqual([{ name: 'NEXT_PUBLIC_APP_URL', value: 'https://h/?a=b' }]);
  });

  it('rejects a multi-line value and a bare word', () => {
    expect(typeof parsePairs(['NEXT_PUBLIC_APP_URL=a\nb'])).toBe('string');
    expect(typeof parsePairs(['NEXT_PUBLIC_APP_URL'])).toBe('string');
    expect(run([], root, out)).toBe(2);
  });

  it('quotes a value a loader would split or strip', () => {
    expect(formatValue('https://h.example.com:8080/x')).toBe('https://h.example.com:8080/x');
    expect(formatValue('two words')).toBe('"two words"');
    expect(formatValue('a#b')).toBe('"a#b"');
  });
});
