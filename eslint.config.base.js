/**
 * @fileoverview SYNCED BASE — `bun sync` overwrites this file. Do not edit it
 * here; the project's own `eslint.config.js` spreads these exports and
 * overrides whatever it needs.
 *
 * A flat ESLint config is an executable module, so it has no merge-able shape:
 * upstream cannot deliver "the new rule" into a project-owned file the way a
 * structured format would allow. Splitting the values out and letting the
 * project spread them is the idiom that makes a rule reach a downstream repo at
 * all.
 *
 * `CLI_IMPORT_CLOSURE` is the reason this file is not optional: it enforces an
 * invariant of the UPDATER, not a project style preference. While it lived only
 * in the project-owned `eslint.config.js` (watched, never overwritten), a
 * project scaffolded before the block existed ran `bun sync` with no rule
 * guarding the import closure its self-update depends on.
 *
 * Every scoped block exported here (a SCREAMING_SNAKE `export const` other than
 * `BASE_ESLINT_OPTIONS`) must be wired into `eslint.config.js`:
 * `bun run agents:compat:check` fails, group `lint`, on one that is not.
 * `GUARD_ENFORCEMENT_LEVEL` and `GUARD_LAYERS` are values the GUARD blocks read,
 * not blocks, and are exempt from that check.
 */
import { relative } from 'node:path';

/**
 * Options handed to `antfu()`. Spread it, then override: the project's config
 * owns the final shape, and `ignores` / `rules` are the two a project realistically
 * extends (spread the base array/object first, or you drop what upstream added).
 */
export const BASE_ESLINT_OPTIONS = {
  // TypeScript configuration
  typescript: {
    tsconfigPath: 'tsconfig.json',
  },

  // Less opinionated mode for easier adoption
  lessOpinionated: true,

  // Ignore patterns
  ignores: [
    'node_modules',
    'dist',
    'test-results',
    'playwright-report',
    'allure-results',
    'allure-report',
    'reports',
    'cli/legacy/**',
    '*.min.js',
    // Documentation files (contain code examples that shouldn't be linted)
    '**/*.md',
    // GitHub workflows (YAML files)
    '.github/**',
    // Generated files (auto-generated, not manually edited)
    'api/openapi-types.ts',
    // Supabase Database types written by `supabase gen types typescript`
    // (project-bootstrap). Large machine-generated snake_case file — linting it
    // produces noise and `eslint --fix` would diverge it from the generator.
    'src/types/supabase.ts',
    // Git worktrees placed under .claude/worktrees/ are another branch's full
    // checkout — never lint another tree from this one.
    '.claude/worktrees/**',
    // Skill directories — never lint.
    // T1 skills (.claude/skills/) and community T3/T4 skills (.agents/skills/,
    // installed at scaffold-time by `bunx skills add`) ship their .md/.json/.ts
    // as-is. ESLint must not touch them: their schemas, frontmatter, fenced
    // code blocks, and example snippets rely on exact formatting we don't own.
    '.claude/skills/**',
    '.agents/skills/**',
    // MCP reference templates — syntax-sensitive opt-in configs. Linting them
    // (e.g. toml/array-bracket-newline) corrupts the layout users copy from.
    'docs/mcp/**',
  ],

  // Custom rules
  rules: {
    // Allow console for test logging
    'no-console': 'off',

    // TypeScript specific - strict but practical
    'ts/explicit-function-return-type': 'off',
    'ts/explicit-module-boundary-types': 'off',
    'ts/no-explicit-any': 'warn',
    // Required for @atc decorator flexibility
    'ts/no-unsafe-assignment': 'off',
    'ts/no-unsafe-return': 'off',
    'ts/no-unsafe-member-access': 'off',
    'ts/no-unsafe-argument': 'off',
    'ts/no-unsafe-call': 'off',
    // Disabled: requires type info for all files including JSON
    'ts/switch-exhaustiveness-check': 'off',
    // Disabled: too strict for config files, requires explicit boolean checks
    'ts/strict-boolean-expressions': 'off',

    // Node.js globals - standard in Bun/Node environment
    'node/prefer-global/buffer': 'off',
    'node/prefer-global/process': 'off',

    // Style preferences
    'style/semi': ['error', 'always'],
    'style/quotes': ['error', 'single'],
    'style/comma-dangle': ['error', 'always-multiline'],
    'style/max-statements-per-line': 'off',
    // Disabled: conflicts with Prettier YAML formatting (Prettier owns YAML style)
    'yaml/flow-mapping-curly-spacing': 'off',
    // Disabled: conflicts with Prettier JSONC formatting (Prettier adds trailing commas
    // in opencode.jsonc which this rule rejects). Prettier owns JSONC style.
    'jsonc/comma-dangle': 'off',

    // Allow unused vars with underscore prefix
    'unused-imports/no-unused-vars': [
      'warn',
      {
        argsIgnorePattern: '^_',
        varsIgnorePattern: '^_',
      },
    ],
  },
};

/**
 * --- cli/ IMPORT CLOSURE (updater self-update invariant) ---
 *
 * `cli/` is the updater's self-update component: `runUpdate` refreshes those
 * files in place and re-execs the process BEFORE any other component is
 * synced (cli/lib/updater-core.ts, "SELF-UPDATE (before Phase 2)"). A repo
 * several releases behind therefore runs the NEW `cli/` against its OWN, old
 * copy of every sibling directory.
 *
 * So an import that escapes `cli/` is not a style question: it bricks the
 * update path for anyone jumping more than one release. It happened in the
 * QA boilerplate: `cli/` imported `../scripts/agent-compatibility.ts`, the
 * re-exec died on `Cannot find module`, and `bun sync`, `bun sync --rollback`,
 * `setup` and `setup:doctor` all went down together, since the failure is at
 * module load and the rollback path shares the same entrypoint.
 *
 * Shared code goes in `cli/lib/`. A `scripts/` file that needs it imports
 * FROM `cli/` (that direction is safe: `scripts/` is synced later, never
 * re-exec'd mid-run). `api/`, `src/`, `config/` and `tests/` are listed for
 * the scaffolded project this config travels into; they are equally absent
 * at re-exec time.
 */
export const CLI_IMPORT_CLOSURE = {
  files: ['cli/**/*.ts'],
  rules: {
    'no-restricted-imports': ['error', {
      patterns: [{
        group: [
          '../scripts/**',
          '../../scripts/**',
          '../../../scripts/**',
          '../../../../scripts/**',
          '../packages/**',
          '../../packages/**',
          '../../../packages/**',
          '../../../../packages/**',
          '../api/**',
          '../../api/**',
          '../../../api/**',
          '../../../../api/**',
          '../src/**',
          '../../src/**',
          '../../../src/**',
          '../../../../src/**',
          '../config/**',
          '../../config/**',
          '../../../config/**',
          '../../../../config/**',
          '../tests/**',
          '../../tests/**',
          '../../../tests/**',
          '../../../../tests/**',
          '@/*',
          '@api/*',
          '@schemas/*',
          '@utils/*',
        ],
        message: 'cli/ must be import-closed: the updater re-execs the new cli/ before other components are synced, so an import that escapes cli/ breaks `bun sync` for repos more than one release behind. Move the shared module into cli/lib/ instead.',
      }],
    }],
  },
};

/**
 * --- GUARD (product architecture, agentic-dev-core/references/guard-architecture.md) ---
 *
 * Severity of every GUARD rule: `warn` this release, `error` the next. Mirrored
 * in `scripts/guard-manifest.ts`.
 */
export const GUARD_ENFORCEMENT_LEVEL = 'warn';

/**
 * Default layer map: globs per layer, lowest first (platform < adapters <
 * features < app). An adopted app maps its own folders without moving files:
 * add a later block in its own `eslint.config.js`,
 *
 *   { settings: { guard: { layers: { adapters: ['db/**'], platform: ['lib/**'] } } } }
 *
 * Settings merge key by key, so name only the layers that differ; a layer's
 * value is replaced whole. A path that matches no layer is ignored.
 */
export const GUARD_LAYERS = {
  platform: ['src/platform/**'],
  adapters: ['src/adapters/**'],
  features: ['src/features/**'],
  app: ['src/app/**'],
};

const GUARD_ORDER = ['platform', 'adapters', 'features', 'app'];
const GUARD_ALIASES = { '@platform/': 'platform', '@adapters/': 'adapters', '@features/': 'features' };
const GUARD_DOC = 'agentic-dev-core/references/guard-architecture.md';

/** Repo-relative POSIX path of a file or of an import resolved against it. */
function guardPosix(path) {
  return path.split('\\').join('/');
}

/** Folder part of a glob: everything before the first wildcard, with no trailing slash. */
function guardGlobFolder(glob) {
  const wildcard = glob.search(/[*?{[]/);
  return guardPosix(wildcard === -1 ? glob : glob.slice(0, wildcard)).replace(/\/+$/, '');
}

/** Layer of a repo-relative path and the matched folder, or `undefined`. */
function guardClassify(path, layers) {
  for (const layer of GUARD_ORDER) {
    for (const glob of [layers[layer] ?? []].flat()) {
      const folder = guardGlobFolder(glob);
      if (folder === '' || path === folder || path.startsWith(`${folder}/`)) {
        return { layer, folder };
      }
    }
  }
  return undefined;
}

/**
 * Where an import points: its layer plus the feature segment and the path
 * inside the feature, when it targets one. Relative paths resolve against the
 * importing file; `@platform/`, `@adapters/` and `@features/` name the layer
 * directly; `@/` is `src/`. Anything else (packages) is ignored.
 */
function guardTarget(source, filePath, layers) {
  const alias = Object.keys(GUARD_ALIASES).find(prefix => source.startsWith(prefix));
  if (alias) {
    const layer = GUARD_ALIASES[alias];
    const [feature, ...rest] = source.slice(alias.length).split('/');
    return { layer, feature: layer === 'features' ? feature : undefined, inside: rest.join('/') };
  }
  let resolved;
  if (source.startsWith('@/')) { resolved = `src/${source.slice(2)}`; }
  else if (source.startsWith('.')) { resolved = guardPosix(relative('.', `${filePath.split('/').slice(0, -1).join('/') || '.'}/${source}`)); }
  else { return undefined; }
  const hit = guardClassify(resolved, layers);
  if (!hit) { return undefined; }
  const [feature, ...rest] = resolved.slice(hit.folder.length).replace(/^\//, '').split('/');
  return { layer: hit.layer, feature: hit.layer === 'features' ? feature.replace(/\.[cm]?[jt]sx?$/, '') : undefined, inside: rest.join('/') };
}

/** Repo-relative POSIX path of the file ESLint is linting, plus the layer map in force. */
function guardContext(context) {
  const filePath = guardPosix(relative(context.cwd ?? process.cwd(), context.filename));
  const layers = context.settings?.guard?.layers ?? GUARD_LAYERS;
  return { filePath, layers, own: guardClassify(filePath, layers) };
}

/**
 * Inline ESLint plugin `guard`: the GUARD layer rules a machine can check, with
 * messages that name the doctrine rule and the fix. Inline for the same reason
 * as `kata` in the QA boilerplate: two small rules do not justify a package.
 */
export const guardPlugin = {
  meta: { name: 'guard' },
  rules: {
    'layer-imports': {
      meta: {
        type: 'problem',
        schema: [],
        messages: {
          higher: `GUARD one direction (${GUARD_DOC}, R1): a {{from}} file never imports the {{to}} layer. Dependencies flow downward only (platform < adapters < features < app); move the call into a feature action or inject the dependency.`,
          appAdapters: `GUARD thin app (${GUARD_DOC}, R3): src/app never imports adapters. Move the call into a feature action and import the feature through its index.ts.`,
        },
      },
      create(context) {
        const { filePath, layers, own } = guardContext(context);
        if (!own) { return {}; }
        const check = (node) => {
          const source = node.source?.value;
          if (typeof source !== 'string') { return; }
          const target = guardTarget(source, filePath, layers);
          if (!target) { return; }
          if (own.layer === 'app' && target.layer === 'adapters') {
            context.report({ node, messageId: 'appAdapters' });
          }
          else if (GUARD_ORDER.indexOf(target.layer) > GUARD_ORDER.indexOf(own.layer)) {
            context.report({ node, messageId: 'higher', data: { from: own.layer, to: target.layer } });
          }
        };
        return { ImportDeclaration: check, ExportNamedDeclaration: check, ExportAllDeclaration: check };
      },
    },

    'feature-door': {
      meta: {
        type: 'problem',
        schema: [],
        messages: {
          deepImport: `GUARD one door (${GUARD_DOC}, R2): import feature {{feature}} only through its index.ts ('@features/{{feature}}'), never '{{source}}'. Export what you need from features/{{feature}}/index.ts.`,
        },
      },
      create(context) {
        const { filePath, layers, own } = guardContext(context);
        const ownFeature = own?.layer === 'features' ? filePath.slice(own.folder.length + 1).split('/')[0].replace(/\.[cm]?[jt]sx?$/, '') : undefined;
        const check = (node) => {
          const source = node.source?.value;
          if (typeof source !== 'string') { return; }
          const target = guardTarget(source, filePath, layers);
          if (target?.layer !== 'features' || !target.feature || target.feature === ownFeature) { return; }
          if (target.inside === '' || /^index(?:\.[cm]?[jt]sx?)?$/.test(target.inside)) { return; }
          context.report({ node, messageId: 'deepImport', data: { feature: target.feature, source } });
        };
        return { ImportDeclaration: check, ExportNamedDeclaration: check, ExportAllDeclaration: check };
      },
    },
  },
};

/**
 * The two `guard/*` rules on every TypeScript file. They are layer-aware
 * inside, so one block is enough; a file in no layer is ignored. `settings`
 * carries the default map a project overrides (see `GUARD_LAYERS`).
 */
export const GUARD_RULES = {
  files: ['**/*.{ts,tsx}'],
  plugins: { guard: guardPlugin },
  settings: { guard: { layers: GUARD_LAYERS } },
  rules: {
    'guard/layer-imports': GUARD_ENFORCEMENT_LEVEL,
    'guard/feature-door': GUARD_ENFORCEMENT_LEVEL,
  },
};

/**
 * Size limits that keep a feature reviewable: at most 2 positional params on
 * features and adapters, at most 400 lines per feature file.
 */
export const GUARD_SHAPE = [
  {
    files: ['src/features/**/*.{ts,tsx}', 'src/adapters/**/*.{ts,tsx}'],
    rules: { 'max-params': [GUARD_ENFORCEMENT_LEVEL, 2] },
  },
  {
    files: ['src/features/**/*.{ts,tsx}'],
    rules: { 'max-lines': [GUARD_ENFORCEMENT_LEVEL, { max: 400, skipBlankLines: true, skipComments: true }] },
  },
];
