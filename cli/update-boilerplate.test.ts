import { existsSync, mkdirSync, mkdtempSync, realpathSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { afterEach, describe, expect, test } from 'bun:test';

import { cleanupDeprecated, validateComponentRegistry } from './lib/updater-core.ts';
import { COMPONENTS, DEPRECATED_FILES, GATE_SCRIPTS, gatesSummaryLine, MCP_TEMPLATE_AGENTS, MCP_TEMPLATE_FILE, parseArgs, resolveProtectedWatchlist, RETIRED_COMMAND_WRAPPERS, RETIRED_DOCS_FILES, RETIRED_SKILL_FILES, runGate, summarizeGates, worktreeRefusal } from './update-boilerplate.ts';

const temporaryRoots: string[] = [];

function temporaryRoot(): string {
  const root = mkdtempSync(join(tmpdir(), 'updater wrapper '));
  temporaryRoots.push(root);
  return root;
}

afterEach(() => {
  while (temporaryRoots.length > 0) {
    const root = temporaryRoots.pop();
    if (root) { rmSync(root, { recursive: true, force: true }); }
  }
});

describe('component registry', () => {
  test('no two components claim the same path', () => {
    expect(() => validateComponentRegistry(COMPONENTS)).not.toThrow();
  });

  test('.claude/settings.json ships once (bootstrap-only) and stays out of every directory component', () => {
    const rootConfig = COMPONENTS.find(c => c.name === 'agent-root-config');
    expect(rootConfig).toMatchObject({ type: 'file-list', paths: ['.claude'], files: ['settings.json'], bootstrapOnly: true });
    // `.claude` itself is never a directory component: `.claude/commands` is
    // the project's own, the alias `.claude/skills` is generated.
    expect(COMPONENTS.filter(c => c.type !== 'file-list').flatMap(c => c.paths)).not.toContain('.claude');
  });

  test('the retired command aliases leave the sync and are removed downstream, the project\'s own commands stay', () => {
    const paths = COMPONENTS.flatMap(c => c.paths);
    for (const p of ['.agents/compatibility', '.claude/commands', '.opencode/commands']) {
      expect(paths).not.toContain(p);
    }
    expect(COMPONENTS.find(c => c.name === 'commands')).toBeUndefined();
    // Muscle memory: the retired component name still selects the one that replaced it.
    expect(parseArgs(['commands']).commands).toEqual(['agent-compatibility']);

    const retired = RETIRED_COMMAND_WRAPPERS.map(d => d.path);
    expect(retired).toContain('.agents/compatibility/command-aliases.json');
    expect(retired).toContain('.claude/commands/business-data-map.md');
    expect(retired).toContain('.opencode/commands/sync-ai-memory.md');
    // Same alias set on both hosts: one wrapper per host per alias.
    const byHost = (dir: string): string[] => retired.filter(p => p.startsWith(`${dir}/`)).map(p => p.slice(dir.length + 1)).sort();
    expect(byHost('.claude/commands')).toEqual(byHost('.opencode/commands'));
    expect(retired).not.toContain('.agents/compatibility/command-aliases.project.json');
    for (const d of RETIRED_COMMAND_WRAPPERS) {
      expect(d.reason).toContain('invoke the skill by name plus its mode');
      expect(d.deprecatedSince).not.toBe('');
    }

    const root = temporaryRoot();
    for (const d of RETIRED_COMMAND_WRAPPERS) {
      mkdirSync(join(root, d.path, '..'), { recursive: true });
      writeFileSync(join(root, d.path), 'wrapper\n');
    }
    writeFileSync(join(root, '.claude/commands/acme-deploy.md'), 'the project\'s own\n');
    const cfg = { deprecatedFiles: RETIRED_COMMAND_WRAPPERS } as Parameters<typeof cleanupDeprecated>[0];
    expect(cleanupDeprecated(cfg, root, true)).toBe(RETIRED_COMMAND_WRAPPERS.length);
    expect(cleanupDeprecated(cfg, root, false)).toBe(RETIRED_COMMAND_WRAPPERS.length);
    expect(cleanupDeprecated(cfg, root, false)).toBe(0);
    expect(existsSync(join(root, '.claude/commands/acme-deploy.md'))).toBe(true);
    // A folder the cleanup emptied goes with it; one that still holds a file stays.
    expect(existsSync(join(root, '.opencode/commands'))).toBe(false);
    expect(existsSync(join(root, '.agents/compatibility'))).toBe(false);
  });

  test('the retired sync-ai-memory skill leaves downstream, folder included', () => {
    expect(DEPRECATED_FILES.map(d => d.path)).toEqual(expect.arrayContaining([...RETIRED_COMMAND_WRAPPERS, ...RETIRED_SKILL_FILES].map(d => d.path)));
    const retired = RETIRED_SKILL_FILES.map(d => d.path);
    expect(retired).toEqual(['.agents/skills/sync-ai-memory/SKILL.md', '.agents/skills/sync-ai-memory/references/sync.md']);
    for (const d of RETIRED_SKILL_FILES) { expect(d.reason).toContain('docs:check'); }

    const root = temporaryRoot();
    for (const p of [...retired, '.agents/skills/acli/SKILL.md']) {
      mkdirSync(join(root, p, '..'), { recursive: true });
      writeFileSync(join(root, p), 'x\n');
    }
    const cfg = { deprecatedFiles: RETIRED_SKILL_FILES } as Parameters<typeof cleanupDeprecated>[0];
    expect(cleanupDeprecated(cfg, root, false)).toBe(2);
    // A skill folder with no SKILL.md would fail skills:check: the empty folders go.
    expect(existsSync(join(root, '.agents/skills/sync-ai-memory'))).toBe(false);
    expect(existsSync(join(root, '.agents/skills/acli/SKILL.md'))).toBe(true);
  });
  test('docs pages removed upstream leave downstream instead of holding the docs component back', () => {
    expect(DEPRECATED_FILES.map(d => d.path)).toEqual(expect.arrayContaining(RETIRED_DOCS_FILES.map(d => d.path)));
    for (const d of RETIRED_DOCS_FILES) {
      expect(d.component).toBe('docs');
      expect(existsSync(join(import.meta.dir, '..', d.path))).toBe(false);
    }

    // Pages that stay next to the retired ones must survive the cleanup.
    const kept = ['docs/setup/mcp/codex.md', 'docs/methodology/IQL-methodology.md', 'docs/methodology/jira-platform.md'];
    const root = temporaryRoot();
    for (const p of [...RETIRED_DOCS_FILES.map(d => d.path), ...kept]) {
      mkdirSync(join(root, p, '..'), { recursive: true });
      writeFileSync(join(root, p), 'x\n');
    }
    const cfg = { deprecatedFiles: RETIRED_DOCS_FILES } as Parameters<typeof cleanupDeprecated>[0];
    expect(cleanupDeprecated(cfg, root, false)).toBe(RETIRED_DOCS_FILES.length);
    for (const p of kept) { expect(existsSync(join(root, p))).toBe(true); }
  });
});

describe('synced halves of project-owned configs', () => {
  // `eslint.config.js` and the husky hooks are watched (never overwritten); the
  // halves upstream owns reach a project only because these components sync them.
  test('the tooling component carries the eslint base, the husky component the gates file', () => {
    expect(COMPONENTS.find(c => c.name === 'tooling')?.files).toContain('eslint.config.base.js');
    expect(COMPONENTS.find(c => c.name === 'husky')).toMatchObject({ type: 'directory', paths: ['.husky'] });
  });
});

describe('worktree refusal', () => {
  function git(cwd: string, ...args: string[]): void {
    const p = Bun.spawnSync(['git', '-C', cwd, ...args], { stdout: 'pipe', stderr: 'pipe' });
    if (p.exitCode !== 0) { throw new Error(`git ${args.join(' ')}: ${p.stderr.toString()}`); }
  }

  test('runs in the primary checkout and refuses in a linked worktree, naming the primary', () => {
    const root = realpathSync(temporaryRoot());
    const primary = join(root, 'primary');
    mkdirSync(primary);
    git(primary, 'init', '-q', '-b', 'main');
    git(primary, '-c', 'user.email=t@t.invalid', '-c', 'user.name=t', 'commit', '-q', '--allow-empty', '-m', 'init');
    const wt = join(root, 'wt');
    git(primary, 'worktree', 'add', '-q', '-b', 'probe', wt);

    expect(worktreeRefusal(primary)).toBeNull();
    const refusal = worktreeRefusal(wt);
    expect(refusal).toContain('worktree');
    expect(refusal).toContain(primary);
    // Outside any checkout there is nothing to refuse.
    expect(worktreeRefusal(root)).toBeNull();
  });

  test('orca.yaml and .worktreeinclude ship once, then stay project-owned', () => {
    for (const [name, file] of [['worktree-include', '.worktreeinclude'], ['orca-config', 'orca.yaml']] as const) {
      expect(COMPONENTS.find(c => c.name === name)).toMatchObject({ type: 'file-list', paths: ['.'], files: [file], bootstrapOnly: true });
    }
  });

  test('the playwright-cli config ships once, then stays project-owned', () => {
    expect(COMPONENTS.find(c => c.name === 'playwright-cli-config')).toMatchObject({ type: 'file-list', paths: ['.playwright'], files: ['cli.config.json'], bootstrapOnly: true });
  });
});

describe('protected watchlist', () => {
  test('the husky hooks are watched (project gates), the identity files are structural, and a project without the block adds nothing', () => {
    const root = temporaryRoot();
    const warnings: string[] = [];
    const watchlist = resolveProtectedWatchlist(root, m => warnings.push(m));
    expect(warnings).toEqual([]);
    const byPath = Object.fromEntries(watchlist.map(e => [e.path, e]));
    // Every hook's reason names the synced gates file: that sentence is what the
    // drift row shows the operator.
    for (const hook of ['.husky/pre-commit', '.husky/pre-push', '.husky/commit-msg']) {
      expect(byPath[hook]).toMatchObject({ source: 'upstream' });
      expect(byPath[hook]?.reason).toContain('.husky/framework-gates.sh');
    }
    expect(byPath['.agents/project.yaml']?.structural).toBe(true);
    expect(byPath['.agents/jira-required.yaml']?.structural).toBe(true);
    expect(byPath['.claude/settings.json']?.structural).toBeUndefined();
    expect(watchlist.every(e => e.source === 'upstream')).toBe(true);
    // The husky component still owns the directory: the hooks are protected by path, not unsynced.
    expect(COMPONENTS.find(c => c.name === 'husky')).toMatchObject({ type: 'directory', paths: ['.husky'] });
  });

  test('updater.protected_paths joins the watchlist; invalid entries are reported in Spanish and ignored', () => {
    const root = temporaryRoot();
    mkdirSync(join(root, '.agents'), { recursive: true });
    writeFileSync(join(root, '.agents', 'project.yaml'), 'updater:\n  protected_paths:\n    - scripts/lint-vars.ts\n    - .husky/pre-push\n    - ../outside.ts\n    - .git/config\n');
    const warnings: string[] = [];
    const watchlist = resolveProtectedWatchlist(root, m => warnings.push(m));
    expect(watchlist.filter(e => e.source === 'project').map(e => e.path)).toEqual(['scripts/lint-vars.ts']);
    expect(watchlist.filter(e => e.path === '.husky/pre-push')).toHaveLength(1);
    expect(warnings).toEqual([
      'updater.protected_paths (.agents/project.yaml): entrada ignorada "../outside.ts": outside the repo (`..` segment).',
      'updater.protected_paths (.agents/project.yaml): entrada ignorada ".git/config": under .git.',
    ]);
  });
});

describe('flags', () => {
  test('--no-gates and --interactive parse next to the existing modes', () => {
    expect(parseArgs(['--auto', '--no-gates'])).toMatchObject({ auto: true, noGates: true, interactive: false });
    expect(parseArgs(['--interactive', '--dry-run'])).toMatchObject({ interactive: true, dryRun: true, auto: false, noGates: false });
    expect(parseArgs([])).toMatchObject({ auto: false, noGates: false, interactive: false, strict: false });
  });
});

describe('MCP template refresh', () => {
  test('offers one template per supported host, and each one ships in docs/mcp', () => {
    expect([...MCP_TEMPLATE_AGENTS]).toEqual(['claude', 'opencode', 'codex']);
    for (const agent of MCP_TEMPLATE_AGENTS) {
      expect(existsSync(join(import.meta.dir, '..', 'docs', 'mcp', MCP_TEMPLATE_FILE[agent]))).toBe(true);
    }
  });

  test('--update-mcp-template takes a supported host', () => {
    expect(parseArgs(['--update-mcp-template', 'codex']).updateMcpTemplate).toBe('codex');
  });
});

describe('post-apply gates', () => {
  // A release can ship a skill and the vocabulary hunk that admits it in two
  // files; when the second is protected, only skills:check sees the half.
  test('skills:check runs after the apply, next to types and lint', () => {
    expect([...GATE_SCRIPTS]).toEqual(['types:check', 'lint:check', 'skills:check']);
  });

  /** A project whose package.json defines the gate scripts as shell one-liners. */
  function project(scripts: Record<string, string>): string {
    const root = temporaryRoot();
    mkdirSync(root, { recursive: true });
    writeFileSync(join(root, 'package.json'), JSON.stringify({ name: 'gate-fixture', private: true, scripts }, null, 2));
    return root;
  }

  test('a failing gate reports exit code, error count, the first lines and which applied files they name', () => {
    const root = project({ 'types:check': 'printf "cli/lib/updater-core.test.ts(84,19): error TS2352: bad cast\\nsrc/app.ts(1,1): error TS1000: nope\\n" >&2; exit 2' });
    const gate = runGate('types:check', root, ['cli/lib/updater-core.test.ts', 'cli/update-boilerplate.ts']);
    expect(gate).toMatchObject({ script: 'types:check', status: 'fail', exitCode: 2, errorCount: 2, failingApplied: ['cli/lib/updater-core.test.ts'] });
    expect(gate.firstErrors).toEqual(['cli/lib/updater-core.test.ts(84,19): error TS2352: bad cast', 'src/app.ts(1,1): error TS1000: nope']);
    expect(gate.output).toContain('TS2352');
  });

  test('a passing gate carries no errors; one that does not finish in time is a timeout, not a failure', () => {
    const root = project({ 'lint:check': 'exit 0', 'types:check': 'sleep 5' });
    expect(runGate('lint:check', root, [])).toMatchObject({ status: 'pass', exitCode: 0, errorCount: 0, firstErrors: [] });
    const slow = runGate('types:check', root, [], 300);
    expect(slow.status).toBe('timeout');
    expect(slow.exitCode).toBeNull();
  }, 15_000);

  test('the closing-box line names every gate and its verdict', () => {
    expect(summarizeGates([])).toBeNull();
    expect(summarizeGates([
      { script: 'types:check', status: 'fail', exitCode: 2, seconds: 8, errorCount: 5, firstErrors: [], failingApplied: [], output: '' },
      { script: 'lint:check', status: 'pass', exitCode: 0, seconds: 3, errorCount: 0, firstErrors: [], failingApplied: [], output: '' },
      { script: 'test', status: 'timeout', exitCode: null, seconds: 120, errorCount: 0, firstErrors: [], failingApplied: [], output: '' },
    ])).toBe('types:check FAIL (5 errores); lint:check OK; test omitido (>120 s)');
  });

  // Live finding: a no-op run (nothing applied) or one launched with
  // `--no-gates` used to drop the `Gates:` line entirely — reading as
  // "nothing to say" when it actually means "nothing ran".
  test('a skipped run names WHY, never just drops the line; a real result always wins over the reason', () => {
    expect(gatesSummaryLine([], null)).toBeNull();
    expect(gatesSummaryLine([], 'no-gates')).toBe('omitidas (--no-gates)');
    expect(gatesSummaryLine([], 'no-changes')).toBe('omitidas (sin cambios)');
    expect(gatesSummaryLine([
      { script: 'types:check', status: 'pass', exitCode: 0, seconds: 3, errorCount: 0, firstErrors: [], failingApplied: [], output: '' },
    ], 'no-changes')).toBe('types:check OK');
  });
});
