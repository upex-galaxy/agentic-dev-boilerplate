/**
 * @fileoverview PROJECT-OWNED — `bun sync` never overwrites this file.
 *
 * `eslint.config.base.js` is the synced half: the shared options and the
 * `cli/` import-closure block that guards the updater's self-update. Override
 * anything here.
 *
 * `ignores` and `rules` are arrays/objects, so an override REPLACES rather than
 * merges: spread the base value first or you silently drop what upstream added.
 *
 *   ignores: [...BASE_ESLINT_OPTIONS.ignores, 'my-generated-dir/**'],
 *   rules: { ...BASE_ESLINT_OPTIONS.rules, 'no-console': 'error' },
 *
 * Extra project-only config blocks go after the base blocks in the `antfu()`
 * call: later blocks win. Every scoped block the base exports must stay wired
 * here; `bun run agents:compat:check` fails on one that is not.
 */
import antfu from '@antfu/eslint-config';
import oxlint from 'eslint-plugin-oxlint';

import { BASE_ESLINT_OPTIONS, CLI_IMPORT_CLOSURE, GUARD_RULES, GUARD_SHAPE } from './eslint.config.base.js';

// The oxlint block goes first so it only switches off stock rules Oxlint already runs; the scoped blocks after it re-enable what ESLint gates in CI.
export default antfu({ ...BASE_ESLINT_OPTIONS }, ...oxlint.buildFromOxlintConfigFile('./.oxlintrc.json'), CLI_IMPORT_CLOSURE, GUARD_RULES, GUARD_SHAPE);
