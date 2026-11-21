#!/usr/bin/env bun

import type { GhRunner } from './lib/gh.ts';
import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

import process from 'node:process';

import { parse as parseYaml } from 'yaml';

import { boardStatuses } from './github-project-bootstrap.ts';
import { flagValues, ghJson, ghText, guardReadOnly, readGithubConfig, realGh, repoRoot } from './lib/gh.ts';

export const BLOCK_START = '<!-- releases:members:start -->';
export const BLOCK_END = '<!-- releases:members:end -->';

export interface ReleaseFile {
  name: string
  slug: string
  text: string
  title: string
  goal: string
  due: string | null
  state: 'planned' | 'open' | 'released'
  releasedAt: string | null
  releaseSha: string | null
  milestoneNumber: number | null
}

export interface Milestone {
  number: number
  title: string
  description: string | null
  state: 'open' | 'closed'
  due_on: string | null
}

export interface Member {
  number: number
  title: string
  state: string
  url: string
}

export interface Deps {
  run: GhRunner
  git: (args: string[]) => Promise<string>
  readFiles: () => { name: string, text: string }[]
  writeFile: (name: string, text: string) => void
  readYaml: () => string
  log: (line: string) => void
  today: () => string
  sleep?: (ms: number) => Promise<void>
}

export interface Options {
  apply: boolean
  check: boolean
  closeOut: string | null
  range: string | null
  allowEmpty: boolean
  adopt: number | null
  reopen: string[]
}

const FRONTMATTER = /^---\n([\s\S]*?)\n---\n?/;

function scalar(value: unknown): string | null {
  if (value === null || value === undefined || value === '') { return null; }
  return String(value);
}

export function parseRelease(name: string, text: string): ReleaseFile {
  const match = FRONTMATTER.exec(text);
  if (!match) { throw new Error(`${name}: missing frontmatter`); }
  const fm = (parseYaml(match[1]) ?? {}) as Record<string, unknown>;
  const state = String(fm.state ?? 'planned');
  if (!['planned', 'open', 'released'].includes(state)) { throw new Error(`${name}: state must be planned, open or released (got "${state}")`); }
  const title = scalar(fm.title);
  if (!title) { throw new Error(`${name}: title is required`); }
  const number = fm.milestone_number;
  return {
    name,
    slug: name.replace(/\.md$/, ''),
    text,
    title,
    goal: scalar(fm.goal) ?? '',
    due: scalar(fm.due)?.slice(0, 10) ?? null,
    state: state as ReleaseFile['state'],
    releasedAt: scalar(fm.released_at),
    releaseSha: scalar(fm.release_sha),
    milestoneNumber: typeof number === 'number' ? number : null,
  };
}

export function setFrontmatterKey(text: string, key: string, value: string | number | null): string {
  const match = FRONTMATTER.exec(text);
  if (!match) { throw new Error('missing frontmatter'); }
  const lines = match[1].split('\n');
  const rendered = `${key}: ${value === null ? 'null' : value}`;
  const at = lines.findIndex(l => l.startsWith(`${key}:`));
  if (at >= 0) { lines[at] = rendered; }
  else { lines.push(rendered); }
  return `---\n${lines.join('\n')}\n---\n${text.slice(match[0].length)}`;
}

export function renderBlock(members: Member[], statuses: Map<string, string | null> | null, stamp: string): string {
  const rows = [...members].sort((a, b) => a.number - b.number).map((m) => {
    const status = statuses ? (statuses.get(m.url) ?? 'not on the board') : 'board not configured';
    return `- #${m.number} ${m.title} (${m.state}) · ${status}`;
  });
  return [BLOCK_START, `Last synced: ${stamp}`, ...(rows.length > 0 ? rows : ['- (no issues)']), BLOCK_END].join('\n');
}

export function currentBlock(text: string): string | null {
  const a = text.indexOf(BLOCK_START);
  const b = text.indexOf(BLOCK_END);
  return a >= 0 && b > a ? text.slice(a, b + BLOCK_END.length) : null;
}

export function blockBody(block: string | null): string | null {
  return block === null ? null : block.split('\n').filter(l => !l.startsWith('Last synced:')).join('\n');
}

export function withBlock(text: string, block: string): string {
  const existing = currentBlock(text);
  if (existing) { return text.replace(existing, block); }
  return `${text.replace(/\n*$/, '\n')}\n${block}\n`;
}

export const REOPEN_REFUSED = 'refusing to reopen';

export function definitionDiffs(file: ReleaseFile, m: Milestone, allowReopen = false): string[] {
  const out: string[] = [];
  if (m.title !== file.title) { out.push(`title: file "${file.title}" vs GitHub "${m.title}"`); }
  if ((m.description ?? '') !== file.goal) { out.push('goal differs from the milestone description'); }
  if ((m.due_on?.slice(0, 10) ?? null) !== file.due) { out.push(`due: file ${file.due ?? 'none'} vs GitHub ${m.due_on?.slice(0, 10) ?? 'none'}`); }
  const want = file.state === 'released' ? 'closed' : 'open';
  if (m.state !== want) {
    const hint = want === 'closed' ? ' (only --close-out closes a milestone)' : (allowReopen ? '' : ` (${REOPEN_REFUSED}: pass --reopen ${file.slug})`);
    out.push(`state: file ${file.state} wants ${want}, GitHub is ${m.state}${hint}`);
  }
  return out;
}

function milestoneBody(file: ReleaseFile, current: Milestone | null, allowReopen: boolean): Record<string, unknown> {
  const keepClosed = file.state === 'released' || (current?.state === 'closed' && !allowReopen);
  const state = keepClosed ? (current?.state ?? 'open') : 'open';
  return { title: file.title, description: file.goal, state, due_on: file.due ? `${file.due}T12:00:00Z` : null };
}

export function closingIssues(logText: string, repo?: string): number[] {
  const found = new Set<number>();
  for (const m of logText.matchAll(/\b(?:close[sd]?|fix(?:e[sd])?|resolve[sd]?):?\s+([\w.-]+\/[\w.-]+)?#(\d+)/gi)) {
    if (m[1] && repo && m[1].toLowerCase() !== repo.toLowerCase()) { continue; }
    found.add(Number(m[2]));
  }
  return [...found].sort((a, b) => a - b);
}

async function paged<T>(run: GhRunner, path: string): Promise<T[]> {
  const out = await ghJson<unknown>(run, ['api', '--paginate', '--slurp', '-X', 'GET', path]);
  const flat: T[] = [];
  for (const entry of (Array.isArray(out) ? out : [])) {
    if (Array.isArray(entry)) { flat.push(...entry as T[]); }
    else { flat.push(entry as T); }
  }
  return flat;
}

async function members(run: GhRunner, repo: string, milestone: number): Promise<Member[]> {
  const rows = await paged<{ number: number, title: string, state: string, html_url: string, pull_request?: unknown }>(run, `repos/${repo}/issues?milestone=${milestone}&state=all&per_page=100`);
  return rows.filter(r => !r.pull_request).map(r => ({ number: r.number, title: r.title, state: r.state, url: r.html_url }));
}

function kebab(title: string): string {
  return title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

export async function releases(deps: Deps, opts: Options): Promise<number> {
  const writing = opts.apply && !opts.check;
  const run = writing ? deps.run : guardReadOnly(deps.run);
  const { log } = deps;
  const sleep = deps.sleep ?? (async ms => new Promise<void>(r => setTimeout(r, ms)));
  const cfg = readGithubConfig(deps.readYaml());
  const repo = (await ghText(run, ['repo', 'view', '--json', 'nameWithOwner', '--jq', '.nameWithOwner'])).trim();
  const mode = opts.check ? 'check' : opts.closeOut ? (writing ? 'close-out apply' : 'close-out dry-run') : opts.apply ? 'apply' : 'dry-run';
  log(`github-releases (${mode}) repo=${repo} dir=${cfg.releasesDir}`);

  const files = deps.readFiles().map(f => parseRelease(f.name, f.text));
  const milestones = await paged<Milestone>(run, `repos/${repo}/milestones?state=all&per_page=100`);
  const matched = new Map<string, Milestone | null>();
  for (const f of files) {
    matched.set(f.slug, milestones.find(m => f.milestoneNumber !== null && m.number === f.milestoneNumber) ?? (f.milestoneNumber === null ? milestones.find(m => m.title === f.title) ?? null : null));
  }
  const claimed = new Set([...matched.values()].filter((m): m is Milestone => m !== null).map(m => m.number));
  const orphans = milestones.filter(m => !claimed.has(m.number));
  const statuses = await boardStatuses(run, cfg, repo);
  const drift: string[] = [];

  if (opts.adopt !== null) {
    const m = milestones.find(x => x.number === opts.adopt);
    if (!m) { log(`ERROR no milestone #${opts.adopt}`); return 1; }
    const slug = kebab(m.title);
    if (milestones.some(x => x.number === m.number) && files.some(f => matched.get(f.slug)?.number === m.number)) { log(`ERROR milestone #${m.number} already has a release file`); return 1; }
    if (files.some(f => f.slug === slug)) { log(`ERROR ${slug}.md already exists`); return 1; }
    const body = `---\ntitle: ${JSON.stringify(m.title)}\ngoal: ${JSON.stringify(m.description ?? '')}\ndue: ${m.due_on ? m.due_on.slice(0, 10) : 'null'}\nstate: ${m.state === 'closed' ? 'released' : 'open'}\nreleased_at: null\nrelease_sha: null\nmilestone_number: ${m.number}\n---\n\n`;
    const text = withBlock(body, renderBlock(await members(run, repo, m.number), statuses, deps.today()));
    if (!writing) { log(`would write ${cfg.releasesDir}/${slug}.md for milestone #${m.number} "${m.title}". Re-run with --apply.`); return 0; }
    deps.writeFile(`${slug}.md`, text);
    log(`wrote ${cfg.releasesDir}/${slug}.md`);
    return 0;
  }

  if (opts.closeOut) { return closeOut(deps, opts, { cfg, repo, files, matched, statuses, run, writing, sleep }); }

  const plans: { file: ReleaseFile, milestone: Milestone | null, diffs: string[], blockDrift: boolean, text: string }[] = [];
  for (const f of files) {
    const m = matched.get(f.slug) ?? null;
    const diffs = m ? definitionDiffs(f, m, opts.reopen.includes(f.slug)) : ['milestone missing on GitHub'];
    let blockDrift = false;
    if (m) {
      const fresh = renderBlock(await members(run, repo, m.number), statuses, deps.today());
      blockDrift = blockBody(currentBlock(f.text)) !== blockBody(fresh);
      plans.push({ file: f, milestone: m, diffs, blockDrift, text: blockDrift ? withBlock(f.text, fresh) : f.text });
    }
    else { plans.push({ file: f, milestone: null, diffs, blockDrift: false, text: f.text }); }
  }

  for (const p of plans) {
    for (const d of p.diffs) { drift.push(`${p.file.slug}: ${d}`); }
    if (p.blockDrift) { drift.push(`${p.file.slug}: membership block differs from GitHub`); }
  }
  for (const o of orphans) { drift.push(`milestone #${o.number} "${o.title}" has no release file (adopt it with --adopt ${o.number})`); }

  if (opts.check) {
    if (drift.length === 0) { log(`OK: ${files.length} release file(s) match GitHub`); return 0; }
    for (const d of drift) { log(`DRIFT ${d}`); }
    return 1;
  }

  if (!writing) {
    if (drift.length === 0) { log('nothing to change'); }
    for (const d of drift) { log(`would sync: ${d}`); }
    log('dry run: nothing written. Re-run with --apply.');
    return 0;
  }

  for (const p of plans) {
    let { text } = p;
    let milestone = p.milestone;
    if (!milestone) {
      const created = await ghJson<Milestone>(run, ['api', '-X', 'POST', `repos/${repo}/milestones`, '--input', '-'], JSON.stringify(milestoneBody(p.file, null, false)));
      milestone = created;
      text = setFrontmatterKey(text, 'milestone_number', created.number);
      text = withBlock(text, renderBlock(await members(run, repo, created.number), statuses, deps.today()));
      log(`created milestone #${created.number} "${created.title}" for ${p.file.slug}`);
      await sleep(1000);
    }
    else if (p.diffs.some(d => !d.includes(REOPEN_REFUSED))) {
      await ghJson<Milestone>(run, ['api', '-X', 'PATCH', `repos/${repo}/milestones/${milestone.number}`, '--input', '-'], JSON.stringify(milestoneBody(p.file, milestone, opts.reopen.includes(p.file.slug))));
      log(`patched milestone #${milestone.number} for ${p.file.slug}: ${p.diffs.join('; ')}`);
      await sleep(1000);
    }
    else if (p.diffs.length > 0) { log(`NOTE ${p.file.slug}: milestone #${milestone.number} is closed on GitHub and the file is ${p.file.state}; left closed (pass --reopen ${p.file.slug} to reopen)`); }
    if (p.file.milestoneNumber === null && milestone) { text = setFrontmatterKey(text, 'milestone_number', milestone.number); }
    if (text !== p.file.text) { deps.writeFile(p.file.name, text); log(`wrote ${cfg.releasesDir}/${p.file.name}`); }
  }
  for (const o of orphans) { log(`NOTE milestone #${o.number} "${o.title}" has no release file (adopt it with --adopt ${o.number})`); }
  log('done. Run with --check to confirm.');
  return 0;
}

interface CloseCtx {
  cfg: ReturnType<typeof readGithubConfig>
  repo: string
  files: ReleaseFile[]
  matched: Map<string, Milestone | null>
  statuses: Map<string, string | null> | null
  run: GhRunner
  writing: boolean
  sleep: (ms: number) => Promise<void>
}

async function closeOut(deps: Deps, opts: Options, ctx: CloseCtx): Promise<number> {
  const { log } = deps;
  const { cfg, repo, run } = ctx;
  const file = ctx.files.find(f => f.slug === opts.closeOut);
  if (!file) { log(`ERROR no release file "${opts.closeOut}" in ${cfg.releasesDir}`); return 1; }
  const milestone = ctx.matched.get(file.slug) ?? null;
  if (!milestone) { log(`ERROR ${file.slug} has no milestone on GitHub: run the sync with --apply first`); return 1; }

  await deps.git(['fetch', 'origin']);
  const previous = ctx.files.filter(f => f.state === 'released' && f.releaseSha && f.slug !== file.slug).sort((a, b) => (b.releasedAt ?? '').localeCompare(a.releasedAt ?? ''))[0];
  let range = opts.range ?? (previous?.releaseSha ? `${previous.releaseSha}..origin/main` : null);
  if (!range) {
    const hasStaging = await deps.git(['rev-parse', '--verify', 'origin/staging']).then(() => true, () => false);
    if (!hasStaging) { log('ERROR no earlier release and no origin/staging: pass --range REV..REV'); return 1; }
    range = 'origin/main..origin/staging';
  }
  let gitLog = await deps.git(['log', '--format=%B', range]);
  if (gitLog.trim() === '' && opts.range === null) {
    if (file.releaseSha && previous?.releaseSha) {
      range = `${previous.releaseSha}..${file.releaseSha}`;
      gitLog = await deps.git(['log', '--format=%B', range]);
      log(`NOTE the default range was empty after the release merge; using the recorded release_sha range ${range}`);
    }
    else { log('NOTE the default range is empty after the release merge; checking the milestone membership only. Pass --range REV..REV to also read closing references from the log.'); }
  }
  const fromLog = closingIssues(gitLog, repo);
  const fromMilestone = (await members(run, repo, milestone.number)).map(m => m.number);
  const set = [...new Set([...fromLog, ...fromMilestone])].sort((a, b) => a - b);
  log(`range ${range}: ${fromLog.length} closing reference(s); milestone #${milestone.number}: ${fromMilestone.length} issue(s); checking ${set.length}`);
  if (set.length === 0 && !opts.allowEmpty) { log('ERROR nothing to verify (empty range and empty milestone); pass --allow-empty to close an empty release'); return 1; }

  let failing: string[] = [];
  let passed: Map<string, string | null> | null = ctx.statuses;
  for (let attempt = 0; attempt < 4; attempt++) {
    const board = attempt === 0 ? ctx.statuses : await boardStatuses(run, cfg, repo);
    failing = [];
    for (const n of set) {
      const issue = await ghJson<{ state: string, html_url: string, pull_request?: unknown }>(run, ['api', `repos/${repo}/issues/${n}`]);
      if (issue.pull_request) { continue; }
      const status = board?.get(issue.html_url);
      if (issue.state !== 'closed') { failing.push(`#${n} is ${issue.state}`); }
      else if (board === null || board === undefined) { failing.push(`#${n} cannot be checked: no project configured`); }
      else if (status === undefined) { failing.push(`#${n} is not on the board`); }
      else if (status !== cfg.released) { failing.push(`#${n} is closed but in "${status ?? 'no status'}", not "${cfg.released}"`); }
    }
    if (failing.length === 0) { passed = board ?? null; break; }
    if (attempt < 3) { await ctx.sleep(2000 * (attempt + 1)); }
  }
  if (failing.length > 0) {
    for (const f of failing) { log(`FAIL ${f}`); }
    log('not closing the milestone. The built-in workflows are asynchronous: re-run in a minute, or fix the cards with gh project item-edit.');
    return 1;
  }
  log(`OK: ${set.length} issue(s) closed and in ${cfg.released}`);
  if (!ctx.writing) { log('dry run: milestone not closed, file not written. Re-run with --apply.'); return 0; }

  const sha = (await deps.git(['rev-parse', 'origin/main'])).trim();
  await ghJson<Milestone>(run, ['api', '-X', 'PATCH', `repos/${repo}/milestones/${milestone.number}`, '--input', '-'], JSON.stringify({ state: 'closed' }));
  const after = (await paged<Milestone>(run, `repos/${repo}/milestones?state=all&per_page=100`)).find(m => m.number === milestone.number);
  if (after?.state !== 'closed') { log(`FAIL milestone #${milestone.number} did not read back as closed`); return 1; }
  let text = setFrontmatterKey(file.text, 'state', 'released');
  text = setFrontmatterKey(text, 'released_at', deps.today());
  text = setFrontmatterKey(text, 'release_sha', sha);
  const fresh = renderBlock(await members(run, repo, milestone.number), passed, deps.today());
  deps.writeFile(file.name, withBlock(text, fresh));
  log(`closed milestone #${milestone.number}; wrote ${cfg.releasesDir}/${file.name} (released_at ${deps.today()}, release_sha ${sha}). Commit it with the release.`);
  return 0;
}

export function parseArgs(argv: string[]): Options {
  const closeOut = flagValues(argv, '--close-out')[0] ?? null;
  const adopt = flagValues(argv, '--adopt')[0];
  return {
    apply: argv.includes('--apply'),
    check: argv.includes('--check'),
    closeOut,
    range: flagValues(argv, '--range')[0] ?? null,
    allowEmpty: argv.includes('--allow-empty'),
    adopt: adopt === undefined ? null : Number(adopt),
    reopen: flagValues(argv, '--reopen'),
  };
}

if (import.meta.main) {
  const root = repoRoot();
  const yamlPath = join(root, '.agents', 'project.yaml');
  try {
    const opts = parseArgs(process.argv.slice(2));
    if (opts.apply && opts.check) { throw new Error('--apply and --check are mutually exclusive'); }
    const cfg = readGithubConfig(readFileSync(yamlPath, 'utf8'));
    const dir = join(root, cfg.releasesDir);
    const code = await releases({
      run: realGh,
      git: async (args) => {
        const proc = Bun.spawn(['git', ...args], { cwd: root, stdout: 'pipe', stderr: 'pipe' });
        const [out, err, exit] = await Promise.all([new Response(proc.stdout).text(), new Response(proc.stderr).text(), proc.exited]);
        if (exit !== 0) { throw new Error(`git ${args.join(' ')} failed: ${err.trim()}`); }
        return out;
      },
      readFiles: () => (existsSync(dir) ? readdirSync(dir).filter(n => n.endsWith('.md')).sort().map(name => ({ name, text: readFileSync(join(dir, name), 'utf8') })) : []),
      writeFile: (name, text) => { mkdirSync(dir, { recursive: true }); writeFileSync(join(dir, name), text); },
      readYaml: () => readFileSync(yamlPath, 'utf8'),
      log: line => console.log(line),
      today: () => new Date().toISOString().slice(0, 10),
    }, opts);
    process.exit(code);
  }
  catch (error) {
    console.error(`github-releases: ${(error as Error).message}`);
    process.exit(2);
  }
}
