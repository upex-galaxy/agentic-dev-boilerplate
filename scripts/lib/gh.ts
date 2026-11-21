import process from 'node:process';

import { parse as parseYaml } from 'yaml';

export interface GhResult {
  code: number
  stdout: string
  stderr: string
}

export type GhRunner = (args: string[], input?: string) => Promise<GhResult>;

export const realGh: GhRunner = async (args, input) => {
  const proc = Bun.spawn(['gh', ...args], {
    stdin: input === undefined ? 'ignore' : new TextEncoder().encode(input),
    stdout: 'pipe',
    stderr: 'pipe',
  });
  const [stdout, stderr, code] = await Promise.all([
    new Response(proc.stdout).text(),
    new Response(proc.stderr).text(),
    proc.exited,
  ]);
  return { code, stdout, stderr };
};

export class GhError extends Error {
  constructor(public readonly args: string[], public readonly result: GhResult) {
    super(`gh ${args.slice(0, 3).join(' ')} failed (exit ${result.code}): ${result.stderr.trim() || result.stdout.trim()}`);
  }
}

export async function ghText(run: GhRunner, args: string[], input?: string): Promise<string> {
  const result = await run(args, input);
  if (result.code !== 0) { throw new GhError(args, result); }
  return result.stdout;
}

export async function ghJson<T = unknown>(run: GhRunner, args: string[], input?: string): Promise<T> {
  const text = await ghText(run, args, input);
  return (text.trim() === '' ? null : JSON.parse(text)) as T;
}

export async function graphql<T = unknown>(run: GhRunner, query: string, variables: Record<string, unknown> = {}): Promise<T> {
  const args = ['api', 'graphql', '--input', '-'];
  const result = await run(args, JSON.stringify({ query, variables }));
  let out: { data?: T, errors?: { message: string }[] } | null = null;
  try { out = result.stdout.trim() ? JSON.parse(result.stdout) : null; }
  catch { out = null; }
  if (out?.errors?.length) { throw new Error(`GraphQL error: ${out.errors.map(e => e.message).join('; ')}`); }
  if (result.code !== 0 || !out) { throw new GhError(args, result); }
  return out.data as T;
}

const WRITE_SUBCOMMANDS: Record<string, string[]> = {
  project: ['create', 'edit', 'link', 'unlink', 'delete', 'close', 'copy', 'mark-template', 'item-add', 'item-edit', 'item-create', 'item-archive', 'item-delete', 'field-create', 'field-delete'],
  label: ['create', 'edit', 'delete', 'clone'],
  issue: ['create', 'edit', 'close', 'reopen', 'comment', 'delete', 'develop', 'transfer', 'lock', 'unlock', 'pin', 'unpin'],
  pr: ['create', 'edit', 'close', 'reopen', 'comment', 'merge', 'review', 'ready'],
};

export function isWriteCall(args: string[], input?: string): boolean {
  const [cmd, sub] = args;
  if (WRITE_SUBCOMMANDS[cmd]?.includes(sub)) { return true; }
  if (cmd !== 'api') { return false; }
  const inline = args.find(a => a.startsWith('--method='));
  if (inline && inline.slice(9).toUpperCase() !== 'GET') { return true; }
  const method = args.findIndex(a => a === '-X' || a === '--method');
  if (method >= 0 && args[method + 1].toUpperCase() !== 'GET') { return true; }
  const path = args.find((a, i) => i > 0 && !a.startsWith('-') && args[i - 1] !== '-X' && args[i - 1] !== '--method' && args[i - 1] !== '-H' && args[i - 1] !== '--header' && args[i - 1] !== '--jq' && args[i - 1] !== '-q');
  if (path === 'graphql') {
    if (args.some(a => /^query=\s*mutation\b/.test(a))) { return true; }
    try { return /^\s*mutation\b/.test(String(JSON.parse(input ?? '{}').query ?? '')); }
    catch { return true; }
  }
  return args.some(a => a === '-f' || a === '-F' || a === '--field' || a === '--raw-field' || a === '--input') && !(method >= 0 && args[method + 1].toUpperCase() === 'GET');
}

export function guardReadOnly(run: GhRunner): GhRunner {
  return async (args, input) => {
    if (isWriteCall(args, input)) { throw new Error(`read-only mode refused a write: gh ${args.slice(0, 4).join(' ')}`); }
    return run(args, input);
  };
}

export interface GithubConfig {
  owner: string
  projectNumber: number | null
  statusField: string
  statuses: string[]
  backlog: string
  released: string
  releasesDir: string
  projectName: string | null
}

export const STATUS_KEYS = ['backlog', 'in_progress', 'in_review', 'on_staging', 'released'] as const;
export const DEFAULT_STATUS_NAMES: Record<string, string> = { backlog: 'Backlog', in_progress: 'In progress', in_review: 'In review', on_staging: 'Staging', released: 'Released' };

export function readGithubConfig(yamlText: string): GithubConfig {
  const doc = (parseYaml(yamlText) ?? {}) as { issue_tracker?: { github?: Record<string, unknown> }, project?: { project_name?: unknown } };
  const gh = doc.issue_tracker?.github ?? {};
  const raw = (gh.statuses ?? {}) as Record<string, unknown>;
  const statuses = STATUS_KEYS.map((key) => {
    const value = raw[key] ?? DEFAULT_STATUS_NAMES[key];
    if (typeof value !== 'string' || value.trim() === '') { throw new Error(`issue_tracker.github.statuses.${key} must be a non-empty string`); }
    return value;
  });
  const seen = new Set(statuses.map(s => s.toLowerCase()));
  if (seen.size !== statuses.length) { throw new Error('issue_tracker.github.statuses holds a duplicate option name'); }
  const number = gh.project_number;
  return {
    owner: typeof gh.project_owner === 'string' && gh.project_owner ? gh.project_owner : '@me',
    projectNumber: typeof number === 'number' ? number : null,
    statusField: typeof gh.status_field === 'string' && gh.status_field ? gh.status_field : 'Status',
    statuses,
    backlog: statuses[0],
    released: statuses[4],
    releasesDir: typeof gh.releases_dir === 'string' && gh.releases_dir ? gh.releases_dir : '.context/releases',
    projectName: typeof doc.project?.project_name === 'string' ? doc.project.project_name : null,
  };
}

export function setProjectNumber(yamlText: string, value: number): string {
  const lines = yamlText.split('\n');
  const tracker = lines.findIndex(l => /^issue_tracker:\s*$/.test(l));
  if (tracker < 0) { throw new Error('issue_tracker block not found in project.yaml'); }
  const github = lines.findIndex((l, i) => i > tracker && /^ {2}github:\s*$/.test(l));
  if (github < 0) { throw new Error('issue_tracker.github block not found in project.yaml'); }
  for (let i = github + 1; i < lines.length; i++) {
    if (/^ {0,2}\S/.test(lines[i]) && !/^\s*$/.test(lines[i])) { break; }
    const prefix = '    project_number:';
    if (lines[i].startsWith(prefix)) {
      const rest = lines[i].slice(prefix.length);
      const hash = rest.indexOf('#');
      const comment = hash >= 0 ? `${rest.slice(0, hash).match(/ *$/)?.[0] ?? ' '}${rest.slice(hash)}` : '';
      lines[i] = `${prefix} ${value}${comment}`;
      return lines.join('\n');
    }
  }
  throw new Error('issue_tracker.github.project_number not found in project.yaml');
}

export interface OwnerRef {
  kind: 'user' | 'org'
  login: string
  id: number
}

export async function resolveOwner(run: GhRunner, owner: string): Promise<OwnerRef> {
  if (owner === '@me') {
    const me = await ghJson<{ login: string, id: number }>(run, ['api', 'user']);
    return { kind: 'user', login: me.login, id: me.id };
  }
  const info = await ghJson<{ login: string, id: number, type: string }>(run, ['api', `users/${owner}`]);
  return { kind: info.type === 'Organization' ? 'org' : 'user', login: info.login, id: info.id };
}

export function repoRoot(): string {
  return process.env.GH_SCRIPT_ROOT ?? new URL('../..', import.meta.url).pathname;
}

export function flagValues(argv: string[], name: string): string[] {
  const out: string[] = [];
  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === name && argv[i + 1] !== undefined) { out.push(argv[i + 1]); i++; }
    else if (argv[i].startsWith(`${name}=`)) { out.push(argv[i].slice(name.length + 1)); }
  }
  return out;
}
