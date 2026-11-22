#!/usr/bin/env bun

import type { GhRunner, GithubConfig } from './lib/gh.ts';
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

import process from 'node:process';

import { flagValues, ghJson, ghText, graphql, guardReadOnly, readGithubConfig, realGh, repoRoot, resolveOwner, setProjectNumber } from './lib/gh.ts';

export interface StatusOption {
  id: string
  name: string
  color: string
  description: string
}

export interface OptionInput {
  id?: string
  name: string
  color: string
  description: string
}

export interface OptionDiff {
  kind: 'keep' | 'rename' | 'add' | 'drop'
  name: string
  from?: string
  id?: string
  count: number
  refused?: boolean
}

export interface OptionPlan {
  next: OptionInput[]
  diff: OptionDiff[]
  refused: OptionDiff[]
  warnings: string[]
  errors: string[]
  reordered: boolean
  changed: boolean
}

export const DEFAULT_RENAMES: Record<string, string> = { 'Todo': 'Backlog', 'In Progress': 'In progress', 'Done': 'Released' };
const PROTECTED_DEFAULTS = new Set(Object.keys(DEFAULT_RENAMES));
const PALETTE: Record<string, string> = { 'Backlog': 'GRAY', 'In progress': 'YELLOW', 'In review': 'PURPLE', 'Staging': 'ORANGE', 'Released': 'GREEN' };
const FALLBACK_COLORS = ['BLUE', 'PINK', 'RED', 'GRAY'];

export function planOptions(
  existing: StatusOption[],
  desired: string[],
  renames: Record<string, string>,
  counts: Record<string, number>,
  force: string[],
): OptionPlan {
  const errors: string[] = [];
  const warnings: string[] = [];
  const byName = new Map(existing.map(o => [o.name, o]));
  const byLower = new Map(existing.map(o => [o.name.toLowerCase(), o]));
  const consumed = new Set<string>();
  const renameTo = new Map<string, string>();
  const renameSources = new Set(Object.keys(renames));
  for (const [from, to] of Object.entries(renames)) {
    if (!byName.has(from)) { errors.push(`--rename ${from}=${to}: no option named "${from}" exists`); continue; }
    if (!desired.includes(to)) { errors.push(`--rename ${from}=${to}: "${to}" is not in issue_tracker.github.statuses`); continue; }
    if (desired.includes(from)) { errors.push(`--rename ${from}=${to}: "${from}" is itself a desired status`); continue; }
    if (byName.has(to) && to !== from) { errors.push(`--rename ${from}=${to}: an option named "${to}" already exists`); continue; }
    if (renameTo.has(to)) { errors.push(`--rename ${from}=${to}: "${to}" is already the target of another rename`); continue; }
    renameTo.set(to, from);
  }

  const next: OptionInput[] = [];
  const diff: OptionDiff[] = [];
  desired.forEach((name, index) => {
    const same = byName.get(name);
    const renamedFrom = renameTo.get(name);
    if (same && !consumed.has(name)) {
      consumed.add(name);
      next.push({ id: same.id, name, color: same.color, description: same.description });
      diff.push({ kind: 'keep', name, id: same.id, count: counts[name] ?? 0 });
    }
    else if (renamedFrom) {
      const old = byName.get(renamedFrom)!;
      consumed.add(renamedFrom);
      next.push({ id: old.id, name, color: old.color, description: old.description });
      diff.push({ kind: 'rename', name, from: renamedFrom, id: old.id, count: counts[renamedFrom] ?? 0 });
    }
    else if (byLower.has(name.toLowerCase()) && !consumed.has(byLower.get(name.toLowerCase())!.name) && !renameSources.has(byLower.get(name.toLowerCase())!.name)) {
      const old = byLower.get(name.toLowerCase())!;
      consumed.add(old.name);
      next.push({ id: old.id, name, color: old.color, description: old.description });
      diff.push({ kind: 'rename', name, from: old.name, id: old.id, count: counts[old.name] ?? 0 });
    }
    else {
      next.push({ name, color: PALETTE[name] ?? FALLBACK_COLORS[index % FALLBACK_COLORS.length], description: '' });
      diff.push({ kind: 'add', name, count: 0 });
    }
  });

  const refused: OptionDiff[] = [];
  for (const option of existing) {
    if (consumed.has(option.name)) { continue; }
    const count = counts[option.name] ?? 0;
    const entry: OptionDiff = { kind: 'drop', name: option.name, id: option.id, count };
    if (!force.includes(option.name) && count > 0) {
      entry.refused = true;
      refused.push(entry);
    }
    else if (!force.includes(option.name) && PROTECTED_DEFAULTS.has(option.name)) {
      entry.refused = true;
      refused.push(entry);
      warnings.push(`"${option.name}" is a default option the built-in workflows point at; dropping it breaks them. Rename it (--rename "${option.name}=${DEFAULT_RENAMES[option.name]}") or pass --force "${option.name}".`);
    }
    diff.push(entry);
  }
  for (const entry of refused) {
    if (entry.count > 0) { errors.push(`refusing to drop "${entry.name}": it holds ${entry.count} item(s). Use --rename ${entry.name}=<New> to keep them, or --force "${entry.name}".`); }
    else { errors.push(`refusing to drop default option "${entry.name}" without --force "${entry.name}"`); }
  }

  const keptOrder = next.filter(o => o.id).map(o => o.id);
  const existingOrder = existing.filter(o => keptOrder.includes(o.id)).map(o => o.id);
  const reordered = keptOrder.join(',') !== existingOrder.join(',');
  const changed = reordered || diff.some(d => d.kind !== 'keep');
  return { next, diff, refused, warnings, errors, reordered, changed };
}

export function formatDiff(plan: OptionPlan): string[] {
  const lines: string[] = [];
  for (const d of plan.diff) {
    const items = `${d.count} item(s)`;
    if (d.kind === 'keep') { lines.push(`  keep    ${d.name} (${items})`); }
    else if (d.kind === 'rename') { lines.push(`  rename  ${d.from} -> ${d.name} (${items}, id kept)`); }
    else if (d.kind === 'add') { lines.push(`  add     ${d.name}`); }
    else { lines.push(`  ${d.refused ? 'REFUSED drop' : 'drop   '} ${d.name} (${items})`); }
  }
  if (plan.reordered) { lines.push('  order   the option order changes'); }
  return lines;
}

interface ProjectRef {
  id: string
  number: number
  title: string
}

interface BoardItem {
  url: string | null
  type: string
  archived: boolean
  optionId: string | null
}

interface ProjectState {
  project: ProjectRef
  fieldId: string
  fieldDbId: string
  options: StatusOption[]
  counts: Record<string, number>
  items: BoardItem[]
  itemUrls: Set<string>
  linked: boolean
  views: { id: string, name: string, layout: string }[]
  workflows: { name: string, enabled: boolean }[]
}

export interface Deps {
  run: GhRunner
  readYaml: () => string
  writeYaml: (text: string) => void
  log: (line: string) => void
  sleep?: (ms: number) => Promise<void>
}

export interface Options {
  apply: boolean
  check: boolean
  force: string[]
  renames: Record<string, string>
  renameDefaults: boolean
}

const Q_FIELD = 'query($id:ID!){node(id:$id){... on ProjectV2SingleSelectField{id databaseId options{id name color description}}}}';
const Q_PROJECT = 'query($id:ID!){node(id:$id){... on ProjectV2{id number title repositories(first:50){nodes{nameWithOwner}} views(first:50){nodes{id name layout}} workflows(first:50){nodes{name enabled}}}}}';
const Q_ITEMS = 'query($id:ID!,$f:String!,$after:String){node(id:$id){... on ProjectV2{items(first:100,after:$after,archivedStates:[ARCHIVED,NOT_ARCHIVED]){totalCount pageInfo{hasNextPage endCursor} nodes{isArchived content{__typename ... on Issue{url} ... on PullRequest{url}} fieldValueByName(name:$f){... on ProjectV2ItemFieldSingleSelectValue{optionId}}}}}}}';
// updateProjectV2Field replaces the whole option list, so existing ids must be resent or cards lose their Status.
const M_FIELD = 'mutation($f:ID!,$o:[ProjectV2SingleSelectFieldOptionInput!]!){updateProjectV2Field(input:{fieldId:$f,singleSelectOptions:$o}){projectV2Field{... on ProjectV2SingleSelectField{options{id name color description}}}}}';
const Q_TYPES = 'query($o:String!,$n:String!){repository(owner:$o,name:$n){issueTypes(first:20){nodes{name}}}}';

async function findProject(run: GhRunner, cfg: GithubConfig, repoName: string): Promise<ProjectRef | null> {
  const list = await ghJson<{ projects: { id: string, number: number, title: string }[] }>(run, ['project', 'list', '--owner', cfg.owner, '--closed', '--format', 'json', '-L', '200']);
  const projects = list?.projects ?? [];
  if (cfg.projectNumber !== null) {
    const hit = projects.find(p => p.number === cfg.projectNumber);
    return hit ? { id: hit.id, number: hit.number, title: hit.title } : null;
  }
  const hit = projects.find(p => p.title === `${cfg.projectName ?? repoName} Kanban`) ?? projects.find(p => p.title === `${repoName} Kanban`);
  return hit ? { id: hit.id, number: hit.number, title: hit.title } : null;
}

interface ItemsPage { node: { items: { totalCount: number, pageInfo: { hasNextPage: boolean, endCursor: string | null }, nodes: { isArchived: boolean, content: { __typename: string, url?: string } | null, fieldValueByName: { optionId?: string } | null }[] } } }

async function readItems(run: GhRunner, cfg: GithubConfig, project: ProjectRef): Promise<BoardItem[]> {
  const items: BoardItem[] = [];
  let after: string | null = null;
  let total = 0;
  for (let page = 0; page < 200; page++) {
    const data: ItemsPage = await graphql<ItemsPage>(run, Q_ITEMS, { id: project.id, f: cfg.statusField, after });
    total = data.node.items.totalCount;
    for (const n of data.node.items.nodes) {
      items.push({ url: n.content?.url ?? null, type: n.content?.__typename ?? 'DraftIssue', archived: n.isArchived, optionId: n.fieldValueByName?.optionId ?? null });
    }
    if (!data.node.items.pageInfo.hasNextPage) { break; }
    after = data.node.items.pageInfo.endCursor;
  }
  if (items.length < total) { throw new Error(`read ${items.length} of ${total} board items; refusing to count options on a partial read`); }
  return items;
}

async function readState(run: GhRunner, cfg: GithubConfig, project: ProjectRef, repo: string): Promise<ProjectState> {
  const fields = await ghJson<{ fields: { id: string, name: string }[] }>(run, ['project', 'field-list', String(project.number), '--owner', cfg.owner, '-L', '50', '--format', 'json']);
  const status = (fields?.fields ?? []).find(f => f.name === cfg.statusField);
  if (!status) { throw new Error(`project #${project.number} has no single-select field named "${cfg.statusField}"`); }
  const field = (await graphql<{ node: { id: string, databaseId: number, options: StatusOption[] } }>(run, Q_FIELD, { id: status.id })).node;
  const proj = (await graphql<{ node: { repositories: { nodes: { nameWithOwner: string }[] }, views: { nodes: { id: string, name: string, layout: string }[] }, workflows: { nodes: { name: string, enabled: boolean }[] } } }>(run, Q_PROJECT, { id: project.id })).node;
  const items = await readItems(run, cfg, project);
  const nameById = new Map(field.options.map(o => [o.id, o.name]));
  const counts: Record<string, number> = {};
  for (const item of items) {
    const name = item.optionId ? nameById.get(item.optionId) : undefined;
    if (name) { counts[name] = (counts[name] ?? 0) + 1; }
  }
  return {
    project,
    fieldId: field.id,
    fieldDbId: String(field.databaseId),
    options: field.options,
    counts,
    items,
    itemUrls: new Set(items.map(i => i.url).filter((u): u is string => u !== null)),
    linked: proj.repositories.nodes.some(r => r.nameWithOwner.toLowerCase() === repo.toLowerCase()),
    views: proj.views.nodes,
    workflows: proj.workflows.nodes,
  };
}

async function openIssues(run: GhRunner, repo: string): Promise<{ number: number, url: string }[]> {
  return (await ghJson<{ number: number, url: string }[]>(run, ['issue', 'list', '-R', repo, '--state', 'open', '-L', '1000', '--json', 'number,url'])) ?? [];
}

async function hasLabel(run: GhRunner, repo: string, name: string): Promise<boolean> {
  const labels = (await ghJson<{ name: string }[]>(run, ['label', 'list', '-R', repo, '-L', '200', '--json', 'name'])) ?? [];
  return labels.some(l => l.name === name);
}

function parseRepo(name: string): { owner: string, name: string } {
  const [owner, repo] = name.split('/');
  return { owner, name: repo };
}

function isFreshDefaults(options: StatusOption[]): boolean {
  const names = options.map(o => o.name.toLowerCase()).sort();
  return names.length === 3 && names.join('|') === ['done', 'in progress', 'todo'].join('|');
}

export async function boardStatuses(run: GhRunner, cfg: GithubConfig, repo: string): Promise<Map<string, string | null> | null> {
  const project = await findProject(run, cfg, parseRepo(repo).name);
  if (!project) { return null; }
  const state = await readState(run, cfg, project, repo);
  const nameById = new Map(state.options.map(o => [o.id, o.name]));
  return new Map(state.items.filter(i => i.url).map(i => [i.url as string, i.optionId ? (nameById.get(i.optionId) ?? null) : null]));
}

export async function bootstrap(deps: Deps, opts: Options): Promise<number> {
  const writing = opts.apply && !opts.check;
  const run = writing ? deps.run : guardReadOnly(deps.run);
  const { log } = deps;
  const sleep = deps.sleep ?? (async ms => new Promise<void>(r => setTimeout(r, ms)));
  const cfg = readGithubConfig(deps.readYaml());
  const repo = (await ghText(run, ['repo', 'view', '--json', 'nameWithOwner', '--jq', '.nameWithOwner'])).trim();
  const repoName = parseRepo(repo).name;
  const mode = opts.check ? 'check' : opts.apply ? 'apply' : 'dry-run';
  log(`github-project-bootstrap (${mode}) repo=${repo} owner=${cfg.owner}`);

  const owner = await resolveOwner(run, cfg.owner);
  if (owner.kind === 'org') { throw new Error('org-owned projects are not supported yet: set issue_tracker.github.project_owner to a user (@me)'); }
  let project = await findProject(run, cfg, repoName);
  const drift: string[] = [];

  if (!project && cfg.projectNumber !== null && !opts.check) {
    throw new Error(`project #${cfg.projectNumber} from issue_tracker.github.project_number was not found for ${cfg.owner}; refusing to create a second project`);
  }
  if (!project) {
    if (opts.check) {
      log(`DRIFT ${cfg.projectNumber === null ? 'no project found and issue_tracker.github.project_number is null' : `project #${cfg.projectNumber} not found for ${cfg.owner}`}`);
      return 1;
    }
    const title = `${cfg.projectName ?? repoName} Kanban`;
    if (!opts.apply) {
      log(`would create project "${title}" (owner ${cfg.owner}), PRIVATE`);
      log(`would set Status options (a fresh project's Todo, In Progress, Done become ${cfg.statuses[0]}, ${cfg.statuses[1]}, ${cfg.released}, keeping their ids): ${cfg.statuses.join(' > ')}`);
      log('would link the repo, create Board and Table views, create the blocked label, write project_number, add every open issue');
      log('dry run: nothing written. Re-run with --apply.');
      return 0;
    }
    const created = await ghJson<{ id: string, number: number, title: string }>(run, ['project', 'create', '--owner', cfg.owner, '--title', title, '--format', 'json']);
    project = { id: created.id, number: created.number, title: created.title };
    await ghText(run, ['project', 'edit', String(project.number), '--owner', cfg.owner, '--visibility', 'PRIVATE']);
    log(`created project #${project.number} "${project.title}"`);
    await sleep(1000);
  }

  let state = await readState(run, cfg, project, repo);
  const names = state.options.map(o => o.name);
  const autoDefaults = opts.renameDefaults || isFreshDefaults(state.options);
  const targets: Record<string, string> = { 'todo': cfg.statuses[0], 'in progress': cfg.statuses[1], 'done': cfg.released };
  const defaults: Record<string, string> = {};
  if (autoDefaults) {
    for (const n of names) { if (targets[n.toLowerCase()]) { defaults[n] = targets[n.toLowerCase()]; } }
  }
  const renames: Record<string, string> = {};
  for (const [from, to] of Object.entries({ ...defaults, ...opts.renames })) {
    if (names.includes(from) && !names.includes(to) && cfg.statuses.includes(to)) { renames[from] = to; }
    else if (opts.renames[from] !== undefined) { renames[from] = to; }
  }
  const plan = planOptions(state.options, cfg.statuses, renames, state.counts, opts.force);

  log(`Status options of project #${project.number}:`);
  for (const line of formatDiff(plan)) { log(line); }
  for (const w of plan.warnings) { log(`WARN ${w}`); }

  const issues = await openIssues(run, repo);
  const missing = issues.filter(i => !state.itemUrls.has(i.url));
  const hasBoard = state.views.some(v => v.layout === 'BOARD_LAYOUT');
  const hasTable = state.views.some(v => v.layout === 'TABLE_LAYOUT');
  const labelOk = await hasLabel(run, repo, 'blocked');

  if (opts.check) {
    if (plan.changed) { drift.push(`Status options differ from issue_tracker.github.statuses (${plan.diff.filter(d => d.kind !== 'keep').map(d => `${d.kind} ${d.name}`).join(', ') || 'order'})`); }
    if (cfg.projectNumber === null || cfg.projectNumber !== project.number) { drift.push(`issue_tracker.github.project_number is ${cfg.projectNumber ?? 'null'}, the project is #${project.number}`); }
    if (!state.linked) { drift.push(`repo ${repo} is not linked to the project`); }
    if (!hasBoard) { drift.push('no board view'); }
    if (!labelOk) { drift.push('label "blocked" is missing'); }
    const closed = state.workflows.find(w => /item closed/i.test(w.name));
    if (closed && !closed.enabled) { drift.push('built-in workflow "Item closed" is disabled: closing an issue will not set Released (enable it in the UI)'); }
    const prs = state.items.filter(i => i.type === 'PullRequest');
    if (prs.length > 0) { drift.push(`${prs.length} pull request(s) on the board: the built-in "PR merged" workflow would set them Released early`); }
    if (missing.length > 0) { drift.push(`${missing.length} open issue(s) missing from the board: ${missing.map(i => `#${i.number}`).join(', ')}`); }
    if (drift.length === 0) { log('OK: project, Status options, repo link, board view, blocked label, workflows and issue coverage match'); return 0; }
    for (const line of drift) { log(`DRIFT ${line}`); }
    return 1;
  }

  if (plan.errors.length > 0) {
    for (const e of plan.errors) { log(`ERROR ${e}`); }
    log('nothing written.');
    return 1;
  }

  const types = await graphql<{ repository: { issueTypes: { nodes: { name: string }[] } } }>(run, Q_TYPES, parseRepo(repo)).catch(() => null);
  log(`issue types (native, best effort): ${types?.repository.issueTypes.nodes.map(n => n.name).join(', ') || 'unreadable'}`);

  const steps: string[] = [];
  if (plan.changed) { steps.push('update Status options'); }
  if (!state.linked) { steps.push(`link ${repo}`); }
  if (!hasBoard) { steps.push('create Board view grouped by Status'); }
  if (!hasTable) { steps.push('create Table view'); }
  if (!labelOk) { steps.push('create label blocked'); }
  if (cfg.projectNumber !== project.number) { steps.push(`write project_number: ${project.number}`); }
  if (missing.length > 0) { steps.push(`add ${missing.length} open issue(s) to the board: ${missing.map(i => `#${i.number}`).join(', ')}`); }

  if (!writing) {
    log(steps.length > 0 ? `would: ${steps.join('; ')}` : 'nothing to change');
    log('dry run: nothing written. Re-run with --apply.');
    return 0;
  }

  if (plan.changed) {
    await graphql(run, M_FIELD, { f: state.fieldId, o: plan.next });
    const backOptions = (await graphql<{ node: { options: StatusOption[] } }>(run, Q_FIELD, { id: state.fieldId })).node.options;
    const back = backOptions.map(o => o.name);
    if (back.join('|') !== cfg.statuses.join('|')) { throw new Error(`Status options read back as [${back.join(', ')}], expected [${cfg.statuses.join(', ')}]`); }
    const lost = plan.next.filter(o => o.id && !backOptions.some(b => b.id === o.id));
    if (lost.length > 0) { throw new Error(`Status option ids changed on update (cards may have lost their Status): ${lost.map(o => o.name).join(', ')}`); }
    log(`Status options set and read back: ${back.join(' > ')}`);
    state = await readState(run, cfg, project, repo);
    await sleep(1000);
  }
  if (!state.linked) {
    if (parseRepo(repo).owner.toLowerCase() !== owner.login.toLowerCase()) { throw new Error(`cannot link ${repo}: gh project link resolves a bare repo name under the project owner (${owner.login}). Create the project under ${parseRepo(repo).owner} or link it by hand.`); }
    await ghText(run, ['project', 'link', String(project.number), '--owner', owner.login, '--repo', parseRepo(repo).name]);
    log(`linked ${repo}`);
    await sleep(1000);
  }
  const viewsPath = `users/${owner.login}/projectsV2/${project.number}/views`;
  const apiVersion = ['-H', 'X-GitHub-Api-Version: 2026-03-10'];
  if (!hasBoard) {
    await ghText(run, ['api', '-X', 'POST', viewsPath, ...apiVersion, '--input', '-'], JSON.stringify({ name: 'Board', layout: 'board', vertical_group_by: [Number(state.fieldDbId)] }));
    log('created Board view grouped by Status');
    await sleep(1000);
  }
  if (!hasTable) {
    await ghText(run, ['api', '-X', 'POST', viewsPath, ...apiVersion, '--input', '-'], JSON.stringify({ name: 'Table', layout: 'table' }));
    log('created Table view');
    await sleep(1000);
  }
  if (!labelOk) {
    try {
      await ghText(run, ['label', 'create', 'blocked', '--color', 'B60205', '--description', 'Blocked by a dependency', '-R', repo]);
      log('created label blocked');
    }
    catch (error) {
      if (!/already exists/i.test((error as Error).message)) { throw error; }
    }
    await sleep(1000);
  }
  if (cfg.projectNumber !== project.number) {
    deps.writeYaml(setProjectNumber(deps.readYaml(), project.number));
    log(`wrote issue_tracker.github.project_number: ${project.number}`);
  }
  for (const issue of missing) {
    await ghText(run, ['project', 'item-add', String(project.number), '--owner', cfg.owner, '--url', issue.url]);
    await ghText(run, ['project', 'item-edit', String(project.number), '--owner', cfg.owner, '--url', issue.url, '--field', cfg.statusField, '--value', cfg.backlog]);
    log(`added #${issue.number} to the board as ${cfg.backlog}`);
    await sleep(1000);
  }
  if (missing.length > 0) {
    const after = await readItems(run, cfg, project);
    const have = new Set(after.map(i => i.url));
    const still = missing.filter(i => !have.has(i.url));
    if (still.length > 0) { throw new Error(`items not on the board after add: ${still.map(i => `#${i.number}`).join(', ')}`); }
  }
  log('done. Run with --check to confirm.');
  return 0;
}

function parseRenames(argv: string[]): Record<string, string> {
  const out: Record<string, string> = {};
  for (const pair of flagValues(argv, '--rename')) {
    const at = pair.indexOf('=');
    if (at < 1 || at === pair.length - 1) { throw new Error(`--rename expects Old=New, got "${pair}"`); }
    const from = pair.slice(0, at);
    const to = pair.slice(at + 1);
    if (from in out) { throw new Error(`--rename names "${from}" twice`); }
    if (Object.values(out).includes(to)) { throw new Error(`--rename targets "${to}" twice`); }
    out[from] = to;
  }
  return out;
}

function parseForce(argv: string[]): string[] {
  const names = flagValues(argv, '--force');
  if (argv.includes('--force') && names.length === 0) { throw new Error('--force needs the option name it may drop, for example --force "Staging"'); }
  for (const name of names) {
    if (name.startsWith('--')) { throw new Error(`--force needs an option name, got "${name}"`); }
  }
  return names;
}

export function parseArgs(argv: string[]): Options {
  return {
    apply: argv.includes('--apply'),
    check: argv.includes('--check'),
    force: parseForce(argv),
    renames: parseRenames(argv),
    renameDefaults: argv.includes('--rename-defaults'),
  };
}

if (import.meta.main) {
  const yamlPath = join(repoRoot(), '.agents', 'project.yaml');
  if (!existsSync(yamlPath)) {
    console.error(`missing ${yamlPath}`);
    process.exit(2);
  }
  try {
    const opts = parseArgs(process.argv.slice(2));
    if (opts.apply && opts.check) { throw new Error('--apply and --check are mutually exclusive'); }
    const code = await bootstrap({
      run: realGh,
      readYaml: () => readFileSync(yamlPath, 'utf8'),
      writeYaml: text => writeFileSync(yamlPath, text),
      log: line => console.log(line),
    }, opts);
    process.exit(code);
  }
  catch (error) {
    console.error(`github-project-bootstrap: ${(error as Error).message}`);
    process.exit(2);
  }
}
