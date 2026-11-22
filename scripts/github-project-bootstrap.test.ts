import type { FakeWorld } from './lib/fake-gh.ts';

import { describe, expect, test } from 'bun:test';

import { bootstrap, formatDiff, parseArgs, planOptions } from './github-project-bootstrap.ts';
import { defaultOptions, fakeGh, issueUrl, newProject, newWorld, statusOf } from './lib/fake-gh.ts';
import { readGithubConfig, setProjectNumber } from './lib/gh.ts';

const YAML = `issue_tracker:
  issue_tracker: github
  issue_tracker_cli: gh
  github:
    project_owner: '@me'
    project_number: null # written by the bootstrap
    status_field: Status
    statuses:
      backlog: Backlog
      in_progress: In progress
      in_review: In review
      on_staging: Staging
      released: Released
    releases_dir: .context/releases
trail:
  enabled: null
`;

const DESIRED = ['Backlog', 'In progress', 'In review', 'Staging', 'Released'];

function opt(id: string, name: string) {
  return { id, name, color: 'GRAY', description: '' };
}

function harness(world: FakeWorld, yaml = YAML) {
  const state = { yaml, lines: [] as string[] };
  const deps = {
    run: fakeGh(world),
    readYaml: () => state.yaml,
    writeYaml: (t: string) => { state.yaml = t; },
    log: (l: string) => { state.lines.push(l); },
    sleep: async () => {},
  };
  const options = (o: Partial<Parameters<typeof bootstrap>[1]> = {}) => ({ apply: false, check: false, force: [], renames: {}, renameDefaults: false, ...o });
  return { state, deps, options };
}

function provisioned(world: FakeWorld, names: string[], extra: Partial<ReturnType<typeof newProject>> = {}) {
  const p = newProject(1, 'repo Kanban', names.map((n, i) => opt(`o${i}`, n)));
  p.linked.push(world.repo);
  p.views.push({ id: 'VB', name: 'Board', layout: 'BOARD_LAYOUT' });
  Object.assign(p, extra);
  world.projects.push(p);
  world.labels.push('blocked');
  return p;
}

describe('planOptions', () => {
  test('keep: matching names keep their ids and order', () => {
    const plan = planOptions(DESIRED.map((n, i) => opt(`o${i}`, n)), DESIRED, {}, {}, []);
    expect(plan.changed).toBe(false);
    expect(plan.next.map(o => o.id)).toEqual(['o0', 'o1', 'o2', 'o3', 'o4']);
  });

  test('rename keeps the id and the card count', () => {
    const existing = ['Backlog', 'In progress', 'In review', 'On staging', 'Released'].map((n, i) => opt(`o${i}`, n));
    const plan = planOptions(existing, DESIRED, { 'On staging': 'Staging' }, { 'On staging': 4 }, []);
    expect(plan.errors).toEqual([]);
    expect(plan.next[3]).toMatchObject({ id: 'o3', name: 'Staging' });
    expect(plan.diff.find(d => d.kind === 'rename')).toMatchObject({ from: 'On staging', name: 'Staging', count: 4 });
  });

  test('without --rename a changed name is a drop plus an add, and a held column is refused', () => {
    const existing = ['Backlog', 'In progress', 'In review', 'On staging', 'Released'].map((n, i) => opt(`o${i}`, n));
    const plan = planOptions(existing, DESIRED, {}, { 'On staging': 4 }, []);
    expect(plan.refused.map(r => r.name)).toEqual(['On staging']);
    expect(plan.errors[0]).toContain('holds 4 item(s)');
    expect(plan.next[3].id).toBeUndefined();
  });

  test('--force allows the drop', () => {
    const existing = ['Backlog', 'In progress', 'In review', 'On staging', 'Released'].map((n, i) => opt(`o${i}`, n));
    const plan = planOptions(existing, DESIRED, {}, { 'On staging': 4 }, ['On staging']);
    expect(plan.errors).toEqual([]);
  });

  test('add: a new name becomes a new option with no id', () => {
    const existing = ['Backlog', 'In progress', 'In review', 'Released'].map((n, i) => opt(`o${i}`, n));
    const plan = planOptions(existing, DESIRED, {}, {}, []);
    expect(plan.diff.find(d => d.kind === 'add')?.name).toBe('Staging');
    expect(plan.next.map(o => o.id).filter(Boolean)).toHaveLength(4);
  });

  test('reorder: the same ids in a new order are flagged and resent with their ids', () => {
    const existing = [opt('a', 'In review'), opt('b', 'Backlog'), opt('c', 'In progress'), opt('d', 'Staging'), opt('e', 'Released')];
    const plan = planOptions(existing, DESIRED, {}, {}, []);
    expect(plan.reordered).toBe(true);
    expect(plan.next.map(o => o.id)).toEqual(['b', 'c', 'a', 'd', 'e']);
    expect(formatDiff(plan).join('\n')).toContain('order');
  });

  test('case differences are matched by name and keep the id', () => {
    const plan = planOptions([opt('p', 'In Progress')], ['In progress'], {}, { 'In Progress': 2 }, []);
    expect(plan.next[0]).toMatchObject({ id: 'p', name: 'In progress' });
    expect(plan.errors).toEqual([]);
  });

  test('a default option is protected even when empty', () => {
    const plan = planOptions(defaultOptions(), DESIRED, {}, {}, []);
    expect(plan.errors.join('\n')).toContain('refusing to drop default option');
    expect(plan.warnings.join('\n')).toContain('built-in workflows');
  });

  test('bad renames are rejected', () => {
    const existing = DESIRED.map((n, i) => opt(`o${i}`, n));
    expect(planOptions(existing, DESIRED, { Ghost: 'Backlog' }, {}, []).errors[0]).toContain('no option named');
    expect(planOptions(existing, DESIRED, { Backlog: 'Nope' }, {}, []).errors[0]).toContain('not in issue_tracker.github.statuses');
    expect(planOptions(existing, DESIRED, { Backlog: 'Staging' }, {}, []).errors[0]).toContain('itself a desired status');
    const withOld = [...existing, opt('x', 'Old')];
    expect(planOptions(withOld, DESIRED, { Old: 'Staging' }, {}, []).errors[0]).toContain('already exists');
  });
});

describe('config and yaml', () => {
  test('readGithubConfig reads the five statuses in board order', () => {
    const cfg = readGithubConfig(YAML);
    expect(cfg.statuses).toEqual(DESIRED);
    expect(cfg.backlog).toBe('Backlog');
    expect(cfg.released).toBe('Released');
    expect(cfg.projectNumber).toBeNull();
  });

  test('a duplicate status name is an error', () => {
    expect(() => readGithubConfig(YAML.replace('on_staging: Staging', 'on_staging: Backlog'))).toThrow('duplicate');
  });

  test('setProjectNumber keeps the inline comment', () => {
    expect(setProjectNumber(YAML, 3)).toContain('project_number: 3 # written by the bootstrap');
  });

  test('--force names the option it may drop and a bare --force is refused', () => {
    expect(parseArgs(['--apply', '--force', 'Staging', '--force=Todo']).force).toEqual(['Staging', 'Todo']);
    expect(() => parseArgs(['--apply', '--force'])).toThrow('needs the option name');
    expect(() => parseArgs(['--force', '--apply'])).toThrow('needs an option name');
    const existing = ['Backlog', 'In progress', 'In review', 'On staging', 'Old', 'Released'].map((n, i) => opt(`o${i}`, n));
    const plan = planOptions(existing, DESIRED, {}, { 'On staging': 4, 'Old': 2 }, ['On staging']);
    expect(plan.refused.map(r => r.name)).toEqual(['Old']);
  });

  test('an org-owned repo is not linked to a user-owned project', async () => {
    const world = newWorld({ login: 'someone-else' });
    const h = harness(world);
    const failure = await bootstrap(h.deps, h.options({ apply: true })).catch((error: Error) => error);
    expect(String(failure)).toContain('cannot link');
  });

  test('parseArgs rejects a doubled rename', () => {
    expect(() => parseArgs(['--rename', 'A=B', '--rename', 'A=C'])).toThrow('twice');
    expect(parseArgs(['--apply', '--rename', 'A=B']).renames).toEqual({ A: 'B' });
  });
});

describe('bootstrap with a fake gh', () => {
  test('dry run on a missing project writes nothing', async () => {
    const world = newWorld({ issues: [{ number: 1, title: 'a', state: 'open', milestone: null }] });
    const h = harness(world);
    expect(await bootstrap(h.deps, h.options())).toBe(0);
    expect(world.writes).toEqual([]);
    expect(h.state.lines.join('\n')).toContain('would create project');
  });

  test('apply creates the project, renames the defaults keeping ids, links, builds views and adds issues', async () => {
    const world = newWorld({ issues: [{ number: 1, title: 'a', state: 'open', milestone: null }, { number: 2, title: 'b', state: 'open', milestone: null }] });
    const h = harness(world);
    expect(await bootstrap(h.deps, h.options({ apply: true }))).toBe(0);
    const p = world.projects[0];
    expect(p.options.map(o => o.name)).toEqual(DESIRED);
    expect(p.options.find(o => o.name === 'Backlog')?.id).toBe('od-todo');
    expect(p.options.find(o => o.name === 'Released')?.id).toBe('od-done');
    expect(p.linked).toEqual([world.repo]);
    expect(world.calls.find(c => c[0] === 'project' && c[1] === 'link')).toEqual(['project', 'link', '1', '--owner', 'owner', '--repo', 'repo']);
    expect(p.views.map(v => v.layout).sort()).toEqual(['BOARD_LAYOUT', 'TABLE_LAYOUT']);
    expect(world.labels).toContain('blocked');
    expect(h.state.yaml).toContain('project_number: 1 # written by the bootstrap');
    expect(statusOf(world, 1, 1)).toBe('Backlog');
    expect(statusOf(world, 1, 2)).toBe('Backlog');
  });

  test('apply then check is clean and a second apply changes nothing', async () => {
    const world = newWorld({ issues: [{ number: 1, title: 'a', state: 'open', milestone: null }] });
    const h = harness(world);
    await bootstrap(h.deps, h.options({ apply: true }));
    const writesAfterFirst = world.writes.length;
    expect(await bootstrap(h.deps, h.options({ check: true }))).toBe(0);
    expect(await bootstrap(h.deps, h.options({ apply: true }))).toBe(0);
    expect(world.writes.length).toBe(writesAfterFirst);
  });

  test('a rename of a held column keeps the cards', async () => {
    const world = newWorld({ issues: [{ number: 5, title: 'e', state: 'open', milestone: null }] });
    const p = provisioned(world, ['Backlog', 'In progress', 'In review', 'On staging', 'Released']);
    p.items.push({ id: 'i1', url: issueUrl(world, 5), type: 'Issue', archived: false, optionId: 'o3' });
    const yaml = YAML.replace('project_number: null', 'project_number: 1');
    const h = harness(world, yaml);
    expect(await bootstrap(h.deps, h.options({ apply: true, renames: { 'On staging': 'Staging' } }))).toBe(0);
    expect(statusOf(world, 1, 5)).toBe('Staging');
  });

  test('an unmatched rename is a refused drop: nothing is written and the cards stay', async () => {
    const world = newWorld({ issues: [{ number: 5, title: 'e', state: 'open', milestone: null }] });
    const p = provisioned(world, ['Backlog', 'In progress', 'In review', 'On staging', 'Released']);
    p.items.push({ id: 'i1', url: issueUrl(world, 5), type: 'Issue', archived: false, optionId: 'o3' });
    const h = harness(world, YAML.replace('project_number: null', 'project_number: 1'));
    expect(await bootstrap(h.deps, h.options({ apply: true }))).toBe(1);
    expect(world.writes).toEqual([]);
    expect(p.items[0].optionId).toBe('o3');
    expect(h.state.lines.join('\n')).toContain('holds 1 item(s)');
  });

  test('--force drops a held option and clears its cards', async () => {
    const world = newWorld();
    const p = provisioned(world, ['Backlog', 'In progress', 'In review', 'On staging', 'Released']);
    p.items.push({ id: 'i1', url: issueUrl(world, 5), type: 'Issue', archived: false, optionId: 'o3' });
    const h = harness(world, YAML.replace('project_number: null', 'project_number: 1'));
    expect(await bootstrap(h.deps, h.options({ apply: true, force: ['On staging'] }))).toBe(0);
    expect(p.items[0].optionId).toBeNull();
  });

  test('counts include archived items and survive pagination', async () => {
    const world = newWorld({ pageSize: 2 });
    const p = provisioned(world, ['Backlog', 'In progress', 'In review', 'On staging', 'Released']);
    for (let n = 1; n <= 5; n++) { p.items.push({ id: `i${n}`, url: issueUrl(world, n), type: 'Issue', archived: n === 5, optionId: 'o3' }); }
    const h = harness(world, YAML.replace('project_number: null', 'project_number: 1'));
    await bootstrap(h.deps, h.options());
    expect(h.state.lines.join('\n')).toContain('REFUSED drop On staging (5 item(s))');
  });

  test('check reports missing issues, a pull request on the board and a disabled workflow, and writes nothing', async () => {
    const world = newWorld({ issues: [{ number: 1, title: 'a', state: 'open', milestone: null }, { number: 2, title: 'b', state: 'open', milestone: null }] });
    const p = provisioned(world, DESIRED, { workflows: [{ name: 'Item closed', enabled: false }] });
    p.items.push({ id: 'i1', url: issueUrl(world, 1), type: 'Issue', archived: false, optionId: 'o0' });
    p.items.push({ id: 'i9', url: 'https://github.com/owner/repo/pull/9', type: 'PullRequest', archived: false, optionId: 'o0' });
    const h = harness(world, YAML.replace('project_number: null', 'project_number: 1'));
    expect(await bootstrap(h.deps, h.options({ check: true }))).toBe(1);
    const out = h.state.lines.join('\n');
    expect(out).toContain('1 open issue(s) missing from the board: #2');
    expect(out).toContain('pull request(s) on the board');
    expect(out).toContain('"Item closed" is disabled');
    expect(world.writes).toEqual([]);
  });

  test('check on a null project_number reports drift and does not throw', async () => {
    const world = newWorld();
    provisioned(world, DESIRED);
    const h = harness(world);
    expect(await bootstrap(h.deps, h.options({ check: true }))).toBe(1);
    expect(h.state.lines.join('\n')).toContain('project_number is null');
  });

  test('dry run and check never reach a write even through the runner', async () => {
    const world = newWorld({ issues: [{ number: 1, title: 'a', state: 'open', milestone: null }] });
    provisioned(world, DESIRED);
    const h = harness(world, YAML.replace('project_number: null', 'project_number: 1'));
    await bootstrap(h.deps, h.options());
    await bootstrap(h.deps, h.options({ check: true }));
    expect(world.writes).toEqual([]);
  });

  test('archived cards are counted: dropping a column that holds only archived cards is refused', async () => {
    const world = newWorld();
    const p = provisioned(world, ['Backlog', 'In progress', 'In review', 'On staging', 'Released']);
    p.items.push({ id: 'i1', url: issueUrl(world, 5), type: 'Issue', archived: true, optionId: 'o3' });
    const h = harness(world, YAML.replace('project_number: null', 'project_number: 1'));
    expect(await bootstrap(h.deps, h.options({ apply: true }))).toBe(1);
    expect(p.items[0].optionId).toBe('o3');
  });

  test('a project_number that is not found never creates a second project', async () => {
    const world = newWorld();
    const h = harness(world, YAML.replace('project_number: null', 'project_number: 9'));
    const outcome = await bootstrap(h.deps, h.options({ apply: true })).then(() => 'resolved', (e: Error) => e.message);
    expect(outcome).toContain('refusing to create a second project');
    expect(world.projects).toEqual([]);
  });
});
