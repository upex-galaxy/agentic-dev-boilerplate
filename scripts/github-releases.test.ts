import type { FakeWorld } from './lib/fake-gh.ts';

import { describe, expect, test } from 'bun:test';

import { blockBody, closingIssues, currentBlock, definitionDiffs, parseArgs, parseRelease, releases, renderBlock, setFrontmatterKey, withBlock } from './github-releases.ts';
import { fakeGh, issueUrl, newProject, newWorld } from './lib/fake-gh.ts';

const YAML = `issue_tracker:
  issue_tracker: github
  github:
    project_owner: '@me'
    project_number: 1
    status_field: Status
    statuses:
      backlog: Backlog
      in_progress: In progress
      in_review: In review
      on_staging: Staging
      released: Released
    releases_dir: .context/releases
`;

const FILE = `---
title: v0.2.0
goal: CSV export and reports
due: 2026-12-15
state: planned
released_at: null
release_sha: null
milestone_number: null
---

Notes the owner wrote.
`;

const NAMES = ['Backlog', 'In progress', 'In review', 'Staging', 'Released'];

function harness(world: FakeWorld, files: Record<string, string>, gitLog = '', sha = 'abc123') {
  const state = { files: { ...files }, lines: [] as string[], git: [] as string[][] };
  const deps = {
    run: fakeGh(world),
    git: async (args: string[]) => { state.git.push(args); return args[0] === 'log' ? gitLog : args[0] === 'rev-parse' ? `${sha}\n` : ''; },
    readFiles: () => Object.entries(state.files).map(([name, text]) => ({ name, text })),
    writeFile: (name: string, text: string) => { state.files[name] = text; },
    readYaml: () => YAML,
    log: (l: string) => { state.lines.push(l); },
    today: () => '2026-11-21',
    sleep: async () => {},
  };
  const options = (o: Partial<Parameters<typeof releases>[1]> = {}) => ({ apply: false, check: false, closeOut: null, range: null, allowEmpty: false, adopt: null, ...o });
  return { state, deps, options };
}

function board(world: FakeWorld) {
  const p = newProject(1, 'repo Kanban', NAMES.map((n, i) => ({ id: `o${i}`, name: n, color: 'GRAY', description: '' })));
  world.projects.push(p);
  return p;
}

describe('pure helpers', () => {
  test('parseRelease reads the frontmatter and rejects a bad state', () => {
    const f = parseRelease('v0-2-0.md', FILE);
    expect(f).toMatchObject({ slug: 'v0-2-0', title: 'v0.2.0', due: '2026-12-15', state: 'planned', milestoneNumber: null });
    expect(() => parseRelease('x.md', FILE.replace('planned', 'later'))).toThrow('state must be');
  });

  test('setFrontmatterKey edits one line and keeps the body', () => {
    const out = setFrontmatterKey(FILE, 'milestone_number', 4);
    expect(out).toContain('milestone_number: 4');
    expect(out).toContain('Notes the owner wrote.');
  });

  test('block drift ignores the Last synced stamp', () => {
    const a = renderBlock([{ number: 1, title: 'a', state: 'open', url: 'u' }], null, '2026-01-01');
    const b = renderBlock([{ number: 1, title: 'a', state: 'open', url: 'u' }], null, '2026-11-21');
    expect(blockBody(a)).toBe(blockBody(b));
    expect(withBlock(FILE, a)).toContain('Notes the owner wrote.');
    expect(currentBlock(withBlock(FILE, a))).toBe(a);
  });

  test('definitionDiffs compares dates by their date part and null with empty', () => {
    const f = parseRelease('v.md', FILE);
    expect(definitionDiffs(f, { number: 1, title: 'v0.2.0', description: 'CSV export and reports', state: 'open', due_on: '2026-12-15T07:00:00Z' })).toEqual([]);
    const none = parseRelease('v.md', FILE.replace('goal: CSV export and reports', 'goal: ""').replace('due: 2026-12-15', 'due: null'));
    expect(definitionDiffs(none, { number: 1, title: 'v0.2.0', description: null, state: 'open', due_on: null })).toEqual([]);
    expect(definitionDiffs(f, { number: 1, title: 'other', description: 'x', state: 'closed', due_on: null })).toHaveLength(4);
  });

  test('closingIssues reads every closing keyword form', () => {
    expect(closingIssues('Closes #3\nfixed: #4\nResolves owner/repo#5\nrefs #9\nCLOSE #7\nCloses other/x#8', 'owner/repo')).toEqual([3, 4, 5, 7]);
  });

  test('parseArgs', () => {
    expect(parseArgs(['--close-out', 'v1', '--range', 'a..b', '--apply'])).toMatchObject({ closeOut: 'v1', range: 'a..b', apply: true });
  });
});

describe('sync', () => {
  test('dry run reports and writes nothing', async () => {
    const world = newWorld();
    const h = harness(world, { 'v0-2-0.md': FILE });
    expect(await releases(h.deps, h.options())).toBe(0);
    expect(world.writes).toEqual([]);
    expect(h.state.files['v0-2-0.md']).toBe(FILE);
    expect(h.state.lines.join('\n')).toContain('milestone missing on GitHub');
  });

  test('apply creates the milestone, writes its number and the members block; a second apply is a no-op', async () => {
    const world = newWorld();
    board(world);
    const h = harness(world, { 'v0-2-0.md': FILE });
    expect(await releases(h.deps, h.options({ apply: true }))).toBe(0);
    expect(world.milestones).toHaveLength(1);
    expect(world.milestones[0]).toMatchObject({ title: 'v0.2.0', description: 'CSV export and reports', state: 'open' });
    expect(h.state.files['v0-2-0.md']).toContain('milestone_number: 1');
    expect(currentBlock(h.state.files['v0-2-0.md'])).not.toBeNull();
    const writes = world.writes.length;
    expect(await releases(h.deps, h.options({ apply: true }))).toBe(0);
    expect(world.writes.length).toBe(writes);
    expect(await releases(h.deps, h.options({ check: true }))).toBe(0);
  });

  test('check reports drift both ways: definition, membership and an orphan milestone', async () => {
    const world = newWorld({ milestones: [{ number: 1, title: 'v0.2.0', description: 'old', state: 'open', due_on: null }, { number: 2, title: 'legacy', description: null, state: 'closed', due_on: null }] });
    board(world);
    world.issues.push({ number: 8, title: 'csv', state: 'open', milestone: 1 });
    const file = setFrontmatterKey(FILE, 'milestone_number', 1);
    const h = harness(world, { 'v0-2-0.md': withBlock(file, renderBlock([], null, '2026-01-01')) });
    expect(await releases(h.deps, h.options({ check: true }))).toBe(1);
    const out = h.state.lines.join('\n');
    expect(out).toContain('goal differs');
    expect(out).toContain('due: file 2026-12-15 vs GitHub none');
    expect(out).toContain('membership block differs');
    expect(out).toContain('milestone #2 "legacy" has no release file');
    expect(world.writes).toEqual([]);
  });

  test('a closed milestone is found, not recreated', async () => {
    const world = newWorld({ milestones: [{ number: 5, title: 'v0.1.0', description: '', state: 'closed', due_on: null }] });
    board(world);
    const released = parseRelease('v0-1-0.md', FILE);
    expect(released.title).toBe('v0.2.0');
    const text = FILE.replace('v0.2.0', 'v0.1.0').replace('goal: CSV export and reports', 'goal: ""').replace('due: 2026-12-15', 'due: null').replace('planned', 'released');
    const h = harness(world, { 'v0-1-0.md': text });
    await releases(h.deps, h.options({ apply: true }));
    expect(world.milestones).toHaveLength(1);
    expect(h.state.files['v0-1-0.md']).toContain('milestone_number: 5');
  });

  test('adopt writes a file from an existing milestone', async () => {
    const world = newWorld({ milestones: [{ number: 2, title: 'Legacy Batch', description: 'older', state: 'closed', due_on: '2026-10-01T07:00:00Z' }] });
    board(world);
    const h = harness(world, {});
    expect(await releases(h.deps, h.options({ apply: true, adopt: 2 }))).toBe(0);
    const text = h.state.files['legacy-batch.md'];
    expect(parseRelease('legacy-batch.md', text)).toMatchObject({ state: 'released', due: '2026-10-01', milestoneNumber: 2 });
  });
});

describe('close-out', () => {
  function shipped(world: FakeWorld, status: string, state: 'open' | 'closed' = 'closed') {
    const p = board(world);
    world.milestones.push({ number: 1, title: 'v0.2.0', description: 'CSV export and reports', state: 'open', due_on: '2026-12-15T07:00:00Z' });
    world.issues.push({ number: 8, title: 'csv', state, milestone: 1 });
    p.items.push({ id: 'i8', url: issueUrl(world, 8), type: 'Issue', archived: false, optionId: p.options.find(o => o.name === status)!.id });
  }
  const file = () => setFrontmatterKey(setFrontmatterKey(FILE, 'milestone_number', 1), 'state', 'open');

  test('verified: closes the milestone, writes released_at and release_sha, regenerates the block', async () => {
    const world = newWorld();
    shipped(world, 'Released');
    const h = harness(world, { 'v0-2-0.md': file() }, 'feat: csv\n\nCloses #8\n', 'deadbeef');
    expect(await releases(h.deps, h.options({ apply: true, closeOut: 'v0-2-0' }))).toBe(0);
    expect(world.milestones[0].state).toBe('closed');
    const f = parseRelease('v0-2-0.md', h.state.files['v0-2-0.md']);
    expect(f).toMatchObject({ state: 'released', releasedAt: '2026-11-21', releaseSha: 'deadbeef' });
    expect(h.state.files['v0-2-0.md']).toContain('#8 csv (closed) · Released');
  });

  test('an issue not in Released fails the close-out and nothing is written', async () => {
    const world = newWorld();
    shipped(world, 'Staging');
    const h = harness(world, { 'v0-2-0.md': file() }, 'Closes #8');
    expect(await releases(h.deps, h.options({ apply: true, closeOut: 'v0-2-0' }))).toBe(1);
    expect(h.state.lines.join('\n')).toContain('#8 is closed but in "Staging", not "Released"');
    expect(world.milestones[0].state).toBe('open');
    expect(world.writes).toEqual([]);
  });

  test('an open issue fails, and so does a log reference to an issue that is not on the board', async () => {
    const world = newWorld();
    shipped(world, 'Released', 'open');
    world.issues.push({ number: 9, title: 'x', state: 'closed', milestone: null });
    const h = harness(world, { 'v0-2-0.md': file() }, 'Fixes #9');
    expect(await releases(h.deps, h.options({ closeOut: 'v0-2-0' }))).toBe(1);
    const out = h.state.lines.join('\n');
    expect(out).toContain('#8 is open');
    expect(out).toContain('#9 is not on the board');
  });

  test('an empty range with an empty milestone is refused unless allowed', async () => {
    const world = newWorld();
    board(world);
    world.milestones.push({ number: 1, title: 'v0.2.0', description: 'CSV export and reports', state: 'open', due_on: '2026-12-15T07:00:00Z' });
    const h = harness(world, { 'v0-2-0.md': file() }, '');
    expect(await releases(h.deps, h.options({ closeOut: 'v0-2-0' }))).toBe(1);
    expect(await releases(h.deps, h.options({ closeOut: 'v0-2-0', allowEmpty: true }))).toBe(0);
  });

  test('the default range starts at the previous release sha when there is one', async () => {
    const world = newWorld();
    shipped(world, 'Released');
    const prev = '---\ntitle: v0.1.0\ngoal: first\ndue: null\nstate: released\nreleased_at: 2026-10-01\nrelease_sha: cafe01\nmilestone_number: 9\n---\n';
    const h = harness(world, { 'v0-1-0.md': prev, 'v0-2-0.md': file() }, 'Closes #8');
    await releases(h.deps, h.options({ closeOut: 'v0-2-0' }));
    expect(h.state.git.find(a => a[0] === 'log')).toContain('cafe01..origin/main');
  });

  test('dry run verifies but closes nothing', async () => {
    const world = newWorld();
    shipped(world, 'Released');
    const h = harness(world, { 'v0-2-0.md': file() }, 'Closes #8');
    expect(await releases(h.deps, h.options({ closeOut: 'v0-2-0' }))).toBe(0);
    expect(world.writes).toEqual([]);
    expect(world.milestones[0].state).toBe('open');
  });

  test('the sync never closes a milestone, only reports it', async () => {
    const world = newWorld({ milestones: [{ number: 1, title: 'v0.2.0', description: 'CSV export and reports', state: 'open', due_on: '2026-12-15T07:00:00Z' }] });
    board(world);
    const text = setFrontmatterKey(setFrontmatterKey(FILE, 'milestone_number', 1), 'state', 'released');
    const h = harness(world, { 'v0-2-0.md': text });
    await releases(h.deps, h.options({ apply: true }));
    expect(world.milestones[0].state).toBe('open');
    expect(h.state.lines.join('\n')).toContain('only --close-out closes');
  });

  test('no earlier release and no origin/staging asks for --range', async () => {
    const world = newWorld();
    shipped(world, 'Released');
    const h = harness(world, { 'v0-2-0.md': file() }, 'Closes #8');
    h.deps.git = async (args: string[]) => { if (args[0] === 'rev-parse') { throw new Error('no ref'); } return ''; };
    expect(await releases(h.deps, h.options({ closeOut: 'v0-2-0' }))).toBe(1);
    expect(h.state.lines.join('\n')).toContain('pass --range');
  });
});
