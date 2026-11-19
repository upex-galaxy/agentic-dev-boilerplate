/**
 * An adopting app whose `.gitignore` hides the agentic store (measured on a
 * real app, U18-12), and the migration guard that refuses to move tracked
 * skills into an ignored folder.
 */

import { spawnSync } from 'node:child_process';
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';

import { afterEach, describe, expect, test } from 'bun:test';
import { hiddenPaths, hiddenUntracked, REINCLUDE_BLOCK_HEADER, REINCLUDE_PROBES, reincludeAgenticStore, reincludeCovers } from './adopt-gitignore.ts';
import { planHarnessMigration } from './updater-harness-migration.ts';

const roots: string[] = [];
function repo(files: Record<string, string>): string {
  const root = mkdtempSync(join(tmpdir(), 'adopt gitignore '));
  roots.push(root);
  spawnSync('git', ['-C', root, 'init', '--quiet'], { encoding: 'utf8' });
  for (const [rel, text] of Object.entries(files)) {
    mkdirSync(dirname(join(root, rel)), { recursive: true });
    writeFileSync(join(root, rel), text);
  }
  return root;
}
afterEach(() => {
  while (roots.length > 0) { rmSync(roots.pop()!, { recursive: true, force: true }); }
});

describe('hiddenPaths', () => {
  test('names the rule that hides a path, existing or not', () => {
    const root = repo({ '.gitignore': 'node_modules/\n.agents\n' });
    expect(hiddenPaths(root, ['.agents/project.yaml', 'src/page.tsx'])).toEqual([
      { path: '.agents/project.yaml', source: '.gitignore:2', pattern: '.agents' },
    ]);
  });

  test('a path a later negation re-includes is not hidden', () => {
    const root = repo({ '.gitignore': '.agents\n!/.agents/\n' });
    expect(hiddenPaths(root, ['.agents/project.yaml'])).toEqual([]);
  });
});

const STORE_FILES = ['.agents/project.yaml', '.agents/README.md', '.agents/project.schema.yaml', '.agents/jira-fields.json', '.agents/jira-link-types.json', '.agents/jira-required.yaml', '.agents/jira-workflows.json', '.agents/personality-override.md'];

describe('reincludeAgenticStore', () => {
  test('nothing hidden: the file is untouched', () => {
    const root = repo({ '.gitignore': 'node_modules/\n' });
    const out = reincludeAgenticStore(root);
    expect(out).toEqual({ hidden: [], added: [], stillHidden: [] });
    expect(readFileSync(join(root, '.gitignore'), 'utf8')).toBe('node_modules/\n');
  });

  test('an app that ignores .agents and .env* gets one appended block; its own lines stay byte-identical', () => {
    const app = 'node_modules/\n.agents\n.env*\n';
    const root = repo({ '.gitignore': app });
    const out = reincludeAgenticStore(root);
    expect(out.added).toEqual(['!/.agents/', '!/.env.schema', '!/.env.core.schema']);
    expect(out.stillHidden).toEqual([]);
    const text = readFileSync(join(root, '.gitignore'), 'utf8');
    expect(text.startsWith(app)).toBe(true);
    expect(text).toContain(REINCLUDE_BLOCK_HEADER);
    expect(text).toContain('.agents (.gitignore:2)');
    expect(hiddenPaths(root, ['.agents/skills/acli/SKILL.md', '.agents/hooks/doc-contracts.mjs'])).toEqual([]);
    expect(hiddenPaths(root, ['.env', '.env.local']).map(h => h.path)).toEqual(['.env', '.env.local']);
    writeFileSync(join(root, '.gitignore'), `${text}/.agents/prompts/\n`);
    expect(hiddenPaths(root, ['.agents/prompts/parity-plan.md']).map(h => h.pattern)).toEqual(['/.agents/prompts/']);
  });

  test('a rule on the children re-includes each delivered path, never the whole store', () => {
    const root = repo({ '.gitignore': '.agents/*\n' });
    const out = reincludeAgenticStore(root);
    expect(out.added).toEqual(['!/.agents/project.yaml', '!/.agents/skills/', '!/.agents/instructions/', '!/.agents/hooks/', ...STORE_FILES.slice(1).map(f => `!/${f}`)]);
    expect(out.stillHidden).toEqual([]);
    expect(hiddenPaths(root, ['.agents/briefs/plan.md']).map(h => h.pattern)).toEqual(['.agents/*']);
  });

  test('an app that hides .agents/* with its own re-includes keeps its run state ignored', () => {
    const app = '.agents/*\n!.agents/instructions/\n!.agents/project.yaml\n!.agents/skills/\n.env*\n!.envrc\n';
    const root = repo({ '.gitignore': app });
    const out = reincludeAgenticStore(root);
    expect(out.added).toEqual(['!/.agents/hooks/', ...STORE_FILES.slice(1).map(f => `!/${f}`), '!/.env.schema', '!/.env.core.schema']);
    expect(out.stillHidden).toEqual([]);
    expect(hiddenPaths(root, ['.agents/briefs/x.md', '.agents/orchestration/run.json', '.env', '.env.local']).map(h => h.path))
      .toEqual(['.agents/briefs/x.md', '.agents/orchestration/run.json', '.env', '.env.local']);
  });

  test('a ** rule gets the ** negation per folder', () => {
    const root = repo({ '.gitignore': '.agents/**\n' });
    const out = reincludeAgenticStore(root);
    expect(out.added).toContain('!/.agents/skills/**');
    expect(out.stillHidden).toEqual([]);
  });

  test('a block from an earlier adoption gets only the missing lines, inside the block', () => {
    const old = `.agents\n.env*\n\n${REINCLUDE_BLOCK_HEADER}\n# The agentic layer is versioned: it re-includes what .agents (.gitignore:1) hid.\n!/.agents/\n/.agents/prompts/\n`;
    const root = repo({ '.gitignore': old });
    const out = reincludeAgenticStore(root);
    expect(out.added).toEqual(['!/.env.schema', '!/.env.core.schema']);
    expect(out.stillHidden).toEqual([]);
    const once = readFileSync(join(root, '.gitignore'), 'utf8');
    expect(once).toBe(old.replace('!/.agents/\n', '!/.agents/\n!/.env.schema\n!/.env.core.schema\n'));
    expect(reincludeAgenticStore(root).hidden).toEqual([]);
    expect(readFileSync(join(root, '.gitignore'), 'utf8')).toBe(once);
  });

  test('a block that already holds every line but still loses to a later rule reports it, writing nothing', () => {
    const text = `${REINCLUDE_BLOCK_HEADER}\n!/.env.schema\n!/.env.core.schema\n.env*\n`;
    const root = repo({ '.gitignore': text });
    const out = reincludeAgenticStore(root);
    expect(out.added).toEqual([]);
    expect(out.stillHidden.map(h => h.path)).toEqual(['.env.schema', '.env.core.schema']);
    expect(readFileSync(join(root, '.gitignore'), 'utf8')).toBe(text);
  });

  test('--dry-run plans the same lines and the same still-hidden set, writing nothing', () => {
    const app = '.agents/*\n!.agents/skills/\n.env*\n';
    const dry = repo({ '.gitignore': app });
    const real = repo({ '.gitignore': app });
    const planned = reincludeAgenticStore(dry, true);
    expect(readFileSync(join(dry, '.gitignore'), 'utf8')).toBe(app);
    const applied = reincludeAgenticStore(real);
    expect(planned.added).toEqual(applied.added);
    expect(planned.stillHidden).toEqual(applied.stillHidden);
  });

  test('every top-level path of this repo\'s store and every .env*.schema it ships has a probe', () => {
    const ls = spawnSync('git', ['ls-files', '.agents', '.env*.schema'], { encoding: 'utf8', cwd: join(import.meta.dir, '..', '..') }).stdout.trim().split('\n');
    const tops = [...new Set(ls.map(f => f.split('/').slice(0, f.startsWith('.agents/') ? 2 : 1).join('/')))];
    expect(tops.filter(top => !REINCLUDE_PROBES.some(p => p.path === top))).toEqual([]);
  });
});

describe('reincludeCovers', () => {
  test('a folder line covers what is below it, a file line only itself', () => {
    expect(reincludeCovers('!/.agents/hooks/', '.agents/hooks/a.mjs')).toBe(true);
    expect(reincludeCovers('!/.agents/skills/**', '.agents/skills/x/SKILL.md')).toBe(true);
    expect(reincludeCovers('!/.env.schema', '.env.schema')).toBe(true);
    expect(reincludeCovers('!/.env.schema', '.env.schema.bak')).toBe(false);
  });
});

describe('hiddenUntracked', () => {
  test('a tracked file a rule matches is not reported', () => {
    const root = repo({ '.gitignore': '.env*\n', '.env.example': 'A=\n' });
    spawnSync('git', ['-C', root, 'add', '-f', '.env.example'], { encoding: 'utf8' });
    expect(hiddenPaths(root, ['.env.example', '.env.schema']).map(h => h.path)).toEqual(['.env.example', '.env.schema']);
    expect(hiddenUntracked(root, ['.env.example', '.env.schema']).map(h => h.path)).toEqual(['.env.schema']);
  });
});

describe('the cross-harness migration never moves tracked skills into an ignored store', () => {
  function legacyApp(gitignore: string): string {
    const root = repo({
      '.gitignore': gitignore,
      '.claude/skills/app-skill/SKILL.md': '---\nname: app-skill\n---\n',
    });
    spawnSync('git', ['-C', root, 'add', '-A'], { encoding: 'utf8' });
    return root;
  }

  test('refused, naming the rule and the skill', () => {
    const plan = planHarnessMigration(legacyApp('.agents\n'), { adopt: true });
    expect(plan.blockers.some(b => b.includes('which git ignores') && b.includes('.agents (.gitignore:1)') && b.includes('app-skill'))).toBe(true);
  });

  test('planned as before once the store is versioned', () => {
    const plan = planHarnessMigration(legacyApp('node_modules/\n'), { adopt: true });
    expect(plan.blockers).toEqual([]);
    expect(plan.skillsToMove).toEqual(['app-skill']);
  });
});
