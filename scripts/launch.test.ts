/**
 * Regression tests for `scripts/launch.ts`, the `bun run claude | codex |
 * opencode` launcher. What they guard:
 *   1. An inherited value that DIFFERS from `.env` / `.env.local` refuses the
 *      launch (varlock would let it win in silence), naming the variable.
 *   2. An equal inherited value, or one whose env-file line is empty, passes.
 *   3. The refusal text carries names and lengths only, never a value.
 */

import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';

import { generateCoreSchema, projectSchemaTemplate } from '../cli/lib/env-schema.ts';
import { preflightRefusal } from './launch.ts';

const FILE_TOKEN = 'file-token-value-000000000000';
const SHELL_TOKEN = 'shell-token-value-11111111111';

let root: string;

beforeEach(() => {
  root = mkdtempSync(join(tmpdir(), 'launch-'));
  writeFileSync(join(root, '.env.core.schema'), generateCoreSchema());
  writeFileSync(join(root, '.env.schema'), projectSchemaTemplate());
  writeFileSync(join(root, '.env'), [
    `ATLASSIAN_API_TOKEN=${FILE_TOKEN}`,
    'NEXT_PUBLIC_APP_URL=http://localhost:3000',
    'N8N_API_URL=',
    '',
  ].join('\n'));
});

afterEach(() => { rmSync(root, { recursive: true, force: true }); });

describe('preflightRefusal', () => {
  it('refuses when an inherited value differs from the env file, by name only', () => {
    const text = preflightRefusal(root, { ATLASSIAN_API_TOKEN: SHELL_TOKEN });
    expect(text).not.toBeNull();
    expect(text).toContain('ATLASSIAN_API_TOKEN');
    expect(text).toContain('(sensitive)');
    expect(text).toContain('unset ATLASSIAN_API_TOKEN');
    expect(text).not.toContain(SHELL_TOKEN);
    expect(text).not.toContain(FILE_TOKEN);
  });

  it('passes an equal inherited value and one whose file line is empty', () => {
    expect(preflightRefusal(root, {
      ATLASSIAN_API_TOKEN: FILE_TOKEN,
      NEXT_PUBLIC_APP_URL: 'http://localhost:3000',
      N8N_API_URL: 'https://n8n.example.test',
    })).toBeNull();
  });

  it('lets .env.local decide over .env', () => {
    writeFileSync(join(root, '.env.local'), 'NEXT_PUBLIC_APP_URL=http://localhost:4000\n');
    expect(preflightRefusal(root, { NEXT_PUBLIC_APP_URL: 'http://localhost:4000' })).toBeNull();
    expect(preflightRefusal(root, { NEXT_PUBLIC_APP_URL: 'http://localhost:3000' })).toContain('NEXT_PUBLIC_APP_URL');
  });

  it('passes when there is no env file at all', () => {
    rmSync(join(root, '.env'));
    expect(preflightRefusal(root, { ATLASSIAN_API_TOKEN: SHELL_TOKEN })).toBeNull();
  });
});
