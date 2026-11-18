/**
 * @fileoverview Tests for the inline `guard` ESLint plugin in `guard-eslint-plugin.js`.
 *
 * ESLint's own RuleTester with the TypeScript parser. The filename decides which
 * layer a file is in, so every case names the repo-relative path it pretends to be.
 */

import type { Rule } from 'eslint';
import tsParser from '@typescript-eslint/parser';
import { describe, expect, it } from 'bun:test';
import { RuleTester } from 'eslint';
import { GUARD_ENFORCEMENT_LEVEL, GUARD_LAYERS, GUARD_RULES, GUARD_SHAPE, guardPlugin } from '../eslint.config.base.js';

RuleTester.describe = describe;
RuleTester.it = it;

const tester = new RuleTester({
  languageOptions: { parser: tsParser, ecmaVersion: 'latest', sourceType: 'module' },
});

const rules = guardPlugin.rules as Record<string, Rule.RuleModule>;

// An adopted app: no src/, its own folders mapped to layers.
const ADOPTED = { guard: { layers: { platform: ['lib/**'], adapters: ['db/**'], features: ['modules/**'], app: ['pages/**'] } } };

tester.run('guard/layer-imports', rules['layer-imports'], {
  valid: [
    { filename: 'src/adapters/notes/memory.ts', code: 'import { env } from \'@platform/env\';' },
    { filename: 'src/features/notes/actions/create.ts', code: 'import { repo } from \'@adapters/notes\';' },
    { filename: 'src/features/notes/actions/create.ts', code: 'import { env } from \'../../../platform/env\';' },
    { filename: 'src/app/notes/page.tsx', code: 'import { listNotes } from \'@features/notes\';' },
    { filename: 'src/app/notes/page.tsx', code: 'import { env } from \'@platform/env\';' },
    { filename: 'src/platform/env.ts', code: 'import { z } from \'zod\';' },
    { filename: 'src/platform/env.ts', code: 'import { x } from \'./other\';' },
    // A file in no layer is ignored.
    { filename: 'scripts/tool.ts', code: 'import { x } from \'@features/notes\';' },
    { filename: 'db/client.ts', code: 'import { x } from \'../modules/notes\';' },
    // Custom map: lib < db < modules < pages.
    { filename: 'modules/notes/create.ts', code: 'import { query } from \'../../db/query\';', settings: ADOPTED },
    { filename: 'pages/notes.tsx', code: 'import { list } from \'../modules/notes\';', settings: ADOPTED },
  ],
  invalid: [
    { filename: 'src/platform/env.ts', code: 'import { repo } from \'@adapters/notes\';', errors: [{ messageId: 'higher', data: { from: 'platform', to: 'adapters' } }] },
    { filename: 'src/adapters/notes/memory.ts', code: 'import { createNote } from \'@features/notes\';', errors: [{ messageId: 'higher', data: { from: 'adapters', to: 'features' } }] },
    { filename: 'src/adapters/notes/memory.ts', code: 'import { createNote } from \'../../features/notes\';', errors: [{ messageId: 'higher' }] },
    { filename: 'src/features/notes/actions/create.ts', code: 'export { Page } from \'../../../app/notes/page\';', errors: [{ messageId: 'higher', data: { from: 'features', to: 'app' } }] },
    { filename: 'src/app/notes/page.tsx', code: 'import { repo } from \'@adapters/notes\';', errors: [{ messageId: 'appAdapters' }] },
    { filename: 'src/app/notes/page.tsx', code: 'import { repo } from \'../../adapters/notes/memory\';', errors: [{ messageId: 'appAdapters' }] },
    { filename: 'src/platform/env.ts', code: 'import { x } from \'@/features/notes\';', errors: [{ messageId: 'higher' }] },
    { filename: 'db/client.ts', code: 'import { x } from \'../modules/notes\';', settings: ADOPTED, errors: [{ messageId: 'higher', data: { from: 'adapters', to: 'features' } }] },
    { filename: 'pages/notes.tsx', code: 'import { q } from \'../db/query\';', settings: ADOPTED, errors: [{ messageId: 'appAdapters' }] },
  ],
});

tester.run('guard/feature-door', rules['feature-door'], {
  valid: [
    { filename: 'src/app/notes/page.tsx', code: 'import { listNotes } from \'@features/notes\';' },
    { filename: 'src/app/notes/page.tsx', code: 'import { listNotes } from \'@features/notes/index\';' },
    { filename: 'src/app/notes/page.tsx', code: 'import { listNotes } from \'../../features/notes\';' },
    { filename: 'src/app/notes/page.tsx', code: 'import { listNotes } from \'../../features/notes/index.ts\';' },
    // A feature reaches into its own folders freely.
    { filename: 'src/features/notes/actions/create.ts', code: 'import { validate } from \'../domain/validate\';' },
    { filename: 'src/features/notes/actions/create.ts', code: 'import { validate } from \'@features/notes/domain/validate\';' },
    // Not a feature import.
    { filename: 'src/app/notes/page.tsx', code: 'import { x } from \'@platform/env\';' },
    { filename: 'src/app/notes/page.tsx', code: 'import { x } from \'react\';' },
    { filename: 'modules/a/x.ts', code: 'import { y } from \'../b\';', settings: ADOPTED },
  ],
  invalid: [
    { filename: 'src/app/notes/page.tsx', code: 'import { x } from \'@features/notes/domain/validate\';', errors: [{ messageId: 'deepImport', data: { feature: 'notes', source: '@features/notes/domain/validate' } }] },
    { filename: 'src/app/notes/page.tsx', code: 'export * from \'../../features/notes/actions/create\';', errors: [{ messageId: 'deepImport' }] },
    { filename: 'src/features/tags/actions/tag.ts', code: 'import { validate } from \'@features/notes/domain/validate\';', errors: [{ messageId: 'deepImport' }] },
    { filename: 'src/features/tags/actions/tag.ts', code: 'import { validate } from \'../../notes/domain/validate\';', errors: [{ messageId: 'deepImport' }] },
    { filename: 'src/adapters/notes/memory.ts', code: 'import type { Note } from \'@features/notes/domain/note\';', errors: [{ messageId: 'deepImport' }] },
    { filename: 'modules/a/x.ts', code: 'import { y } from \'../b/domain/y\';', settings: ADOPTED, errors: [{ messageId: 'deepImport', data: { feature: 'b', source: '../b/domain/y' } }] },
  ],
});

describe('guard config exports', () => {
  it('ships the default layer map and the warn level on both rules', () => {
    expect(GUARD_ENFORCEMENT_LEVEL).toBe('error');
    expect(Object.keys(GUARD_LAYERS)).toEqual(['platform', 'adapters', 'features', 'app']);
    expect(GUARD_RULES.rules).toEqual({ 'guard/layer-imports': 'error', 'guard/feature-door': 'error' });
    expect(GUARD_SHAPE).toHaveLength(2);
  });
});
