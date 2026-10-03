/**
 * @fileoverview SYNCED — `bun run up` overwrites this file. The lint scope of
 * the boilerplate's OWN tooling (`cli/`, `scripts/`), independent of the
 * project's root ESLint config.
 *
 * A greenfield project never needs it: its root `eslint.config.js` spreads the
 * same base and lints everything. It exists for an ADOPTED app, whose root
 * config (`eslint.config.mjs`, a legacy `.eslintrc*`, a CommonJS package) is
 * the app's own and is never replaced, so nothing there wires the `cli/`
 * import closure the updater's self-update depends on. `bun run
 * tooling:lint:check` lints the tooling with this file instead.
 *
 * `.mjs` on purpose: an app without `"type": "module"` would load a `.js`
 * config as CommonJS. The base it imports is plain ESM; Node parses it as such
 * by syntax detection.
 */
import antfu from '@antfu/eslint-config';

import { BASE_ESLINT_OPTIONS, CLI_IMPORT_CLOSURE } from './eslint.config.base.js';

export default antfu({
  ...BASE_ESLINT_OPTIONS,
  typescript: { tsconfigPath: 'tsconfig.tooling.json' },
}, CLI_IMPORT_CLOSURE);
