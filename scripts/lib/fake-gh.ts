import type { GhResult, GhRunner } from './gh.ts';

import { isWriteCall } from './gh.ts';

export interface FakeOption { id: string, name: string, color: string, description: string }
export interface FakeItem { id: string, url: string, type: 'Issue' | 'PullRequest', archived: boolean, optionId: string | null }
export interface FakeIssue { number: number, title: string, state: 'open' | 'closed', milestone: number | null }
export interface FakeMilestone { number: number, title: string, description: string | null, state: 'open' | 'closed', due_on: string | null }

export interface FakeProject {
  id: string
  number: number
  title: string
  options: FakeOption[]
  items: FakeItem[]
  linked: string[]
  views: { id: string, name: string, layout: string }[]
  workflows: { name: string, enabled: boolean }[]
}

export interface FakeWorld {
  repo: string
  userId: number
  login: string
  projects: FakeProject[]
  issues: FakeIssue[]
  labels: string[]
  milestones: FakeMilestone[]
  pageSize: number
  calls: string[][]
  writes: string[][]
  seq: number
}

export function newWorld(overrides: Partial<FakeWorld> = {}): FakeWorld {
  return { repo: 'owner/repo', userId: 7, login: 'owner', projects: [], issues: [], labels: [], milestones: [], pageSize: 100, calls: [], writes: [], seq: 100, ...overrides };
}

export function defaultOptions(): FakeOption[] {
  return [
    { id: 'od-todo', name: 'Todo', color: 'GREEN', description: '' },
    { id: 'od-prog', name: 'In Progress', color: 'YELLOW', description: '' },
    { id: 'od-done', name: 'Done', color: 'PURPLE', description: '' },
  ];
}

export function newProject(number: number, title: string, options: FakeOption[] = defaultOptions()): FakeProject {
  return {
    id: `PVT_${number}`,
    number,
    title,
    options,
    items: [],
    linked: [],
    views: [{ id: 'V1', name: 'View 1', layout: 'TABLE_LAYOUT' }],
    workflows: [{ name: 'Item closed', enabled: true }, { name: 'Pull request merged', enabled: true }],
  };
}

export function issueUrl(world: FakeWorld, n: number): string {
  return `https://github.com/${world.repo}/issues/${n}`;
}

const ok = (value: unknown): GhResult => ({ code: 0, stdout: typeof value === 'string' ? value : JSON.stringify(value), stderr: '' });
const fail = (message: string): GhResult => ({ code: 1, stdout: '', stderr: message });

function flag(args: string[], name: string): string | undefined {
  const i = args.indexOf(name);
  return i >= 0 ? args[i + 1] : undefined;
}

export function fakeGh(world: FakeWorld): GhRunner {
  const project = (n: number): FakeProject => {
    const p = world.projects.find(x => x.number === n);
    if (!p) { throw new Error(`fake gh: no project #${n}`); }
    return p;
  };

  const graphqlHandler = (body: { query: string, variables: { f: string, o: unknown, id: string, after?: string } }): GhResult => {
    const { query, variables: v } = body;
    const byNode = (id: string): FakeProject => world.projects.find(p => p.id === id || `F_${p.number}` === id)!;
    if (query.includes('updateProjectV2Field')) {
      const p = byNode(v.f);
      const incoming = v.o as { id?: string, name: string, color: string, description: string }[];
      const next: FakeOption[] = incoming.map(o => ({ id: o.id ?? `on-${++world.seq}`, name: o.name, color: o.color, description: o.description }));
      const keep = new Set(next.map(o => o.id));
      for (const item of p.items) { if (item.optionId && !keep.has(item.optionId)) { item.optionId = null; } }
      p.options = next;
      return ok({ data: { updateProjectV2Field: { projectV2Field: { options: next } } } });
    }
    if (query.includes('databaseId')) {
      const p = byNode(v.id);
      return ok({ data: { node: { id: `F_${p.number}`, databaseId: 900 + p.number, options: p.options } } });
    }
    if (query.includes('repositories(first')) {
      const p = byNode(v.id);
      return ok({ data: { node: { id: p.id, number: p.number, title: p.title, repositories: { nodes: p.linked.map(nameWithOwner => ({ nameWithOwner })) }, views: { nodes: p.views }, workflows: { nodes: p.workflows } } } });
    }
    if (query.includes('items(first')) {
      const p = byNode(v.id);
      const start = v.after ? Number(v.after) : 0;
      const visible = query.includes('archivedStates') ? p.items : p.items.filter(i => !i.archived);
      const slice = visible.slice(start, start + world.pageSize);
      const end = start + slice.length;
      return ok({ data: { node: { items: {
        totalCount: visible.length,
        pageInfo: { hasNextPage: end < visible.length, endCursor: String(end) },
        nodes: slice.map(i => ({ isArchived: i.archived, content: { __typename: i.type, url: i.url }, fieldValueByName: i.optionId ? { optionId: i.optionId } : null })),
      } } } });
    }
    if (query.includes('issueTypes')) {
      return ok({ data: { repository: { issueTypes: { nodes: [{ name: 'Task' }, { name: 'Bug' }, { name: 'Feature' }] } } } });
    }
    return fail(`fake gh: unhandled graphql ${query.slice(0, 40)}`);
  };

  return async (args, input) => {
    world.calls.push(args);
    if (isWriteCall(args, input)) { world.writes.push(args); }
    const [cmd, sub] = args;
    if (cmd === 'repo' && sub === 'view') { return ok(`${world.repo}\n`); }
    if (cmd === 'api' && args[1] === 'user') { return ok({ login: world.login, id: world.userId }); }
    if (cmd === 'api' && args[1] === 'graphql') { return graphqlHandler(JSON.parse(input ?? '{}')); }
    if (cmd === 'project') {
      if (sub === 'list') { return ok({ projects: world.projects.map(p => ({ id: p.id, number: p.number, title: p.title })), totalCount: world.projects.length }); }
      if (sub === 'create') {
        const p = newProject(world.projects.length + 1, flag(args, '--title')!);
        world.projects.push(p);
        return ok({ id: p.id, number: p.number, title: p.title });
      }
      if (sub === 'edit') { return ok(''); }
      if (sub === 'field-list') { return ok({ fields: [{ id: `F_${args[2]}`, name: 'Status' }, { id: 'F_title', name: 'Title' }] }); }
      const p = project(Number(args[2]));
      if (sub === 'link') {
        const repo = flag(args, '--repo')!;
        p.linked.push(repo.includes('/') ? repo : `${world.repo.split('/')[0]}/${repo}`);
        return ok('');
      }
      if (sub === 'item-add') {
        const url = flag(args, '--url')!;
        if (!p.items.some(i => i.url === url)) { p.items.push({ id: `PVTI_${++world.seq}`, url, type: url.includes('/pull/') ? 'PullRequest' : 'Issue', archived: false, optionId: null }); }
        return ok('');
      }
      if (sub === 'item-edit') {
        const item = p.items.find(i => i.url === flag(args, '--url'));
        const option = p.options.find(o => o.name === flag(args, '--value'));
        if (!item || !option) { return fail('fake gh: item-edit target not found'); }
        item.optionId = option.id;
        return ok('');
      }
    }
    if (cmd === 'issue' && sub === 'list') {
      return ok(world.issues.filter(i => i.state === 'open').map(i => ({ number: i.number, url: issueUrl(world, i.number) })));
    }
    if (cmd === 'label') {
      if (sub === 'list') { return ok(world.labels.map(name => ({ name }))); }
      if (sub === 'create') { world.labels.push(args[2]); return ok(''); }
    }
    if (cmd === 'api') {
      const path = args.find((a, i) => i > 0 && !a.startsWith('-') && !['GET', 'POST', 'PATCH'].includes(a) && !String(args[i - 1]).startsWith('-H') && args[i - 1] !== '-H')!;
      const method = (flag(args, '-X') ?? 'GET').toUpperCase();
      const body = input ? JSON.parse(input) : {};
      const viewsMatch = /^users\/[^/]+\/projectsV2\/(\d+)\/views$/.exec(path);
      if (viewsMatch && method === 'POST') {
        const p = project(Number(viewsMatch[1]));
        p.views.push({ id: `V${++world.seq}`, name: body.name, layout: body.layout === 'board' ? 'BOARD_LAYOUT' : 'TABLE_LAYOUT' });
        return ok({});
      }
      if (/^repos\/[^/]+\/[^/]+\/milestones(?:\?|$)/.test(path) && method === 'GET') { return ok(world.milestones); }
      if (/^repos\/[^/]+\/[^/]+\/milestones$/.test(path) && method === 'POST') {
        const m: FakeMilestone = { number: world.milestones.length + 1, title: body.title, description: body.description ?? null, state: body.state ?? 'open', due_on: body.due_on ? `${String(body.due_on).slice(0, 10)}T07:00:00Z` : null };
        world.milestones.push(m);
        return ok(m);
      }
      const patch = /^repos\/[^/]+\/[^/]+\/milestones\/(\d+)$/.exec(path);
      if (patch && method === 'PATCH') {
        const m = world.milestones.find(x => x.number === Number(patch[1]))!;
        Object.assign(m, { ...body, due_on: body.due_on ? `${String(body.due_on).slice(0, 10)}T07:00:00Z` : ('due_on' in body ? null : m.due_on) });
        return ok(m);
      }
      const members = /^repos\/[^/]+\/[^/]+\/issues\?milestone=(\d+)/.exec(path);
      if (members) {
        return ok(world.issues.filter(i => i.milestone === Number(members[1])).map(i => ({ number: i.number, title: i.title, state: i.state, html_url: issueUrl(world, i.number) })));
      }
      const single = /^repos\/[^/]+\/[^/]+\/issues\/(\d+)$/.exec(path);
      if (single) {
        const i = world.issues.find(x => x.number === Number(single[1]));
        return i ? ok({ number: i.number, title: i.title, state: i.state, html_url: issueUrl(world, i.number) }) : fail('Not Found');
      }
    }
    return fail(`fake gh: unhandled ${args.join(' ')}`);
  };
}

export function statusOf(world: FakeWorld, projectNumber: number, n: number): string | null {
  const p = world.projects.find(x => x.number === projectNumber)!;
  const item = p.items.find(i => i.url === issueUrl(world, n));
  return item ? (p.options.find(o => o.id === item.optionId)?.name ?? null) : null;
}
