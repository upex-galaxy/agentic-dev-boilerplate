import type { IssueTracker } from './issue-tracker.ts';

export const TRAIL_FILES = ['metadata.yml', 'plan.md', 'results.md', 'decisions.json'] as const;
export const DEFAULT_TRAIL_DIR = '.context/trail';

export function resolveTrail(tracker: IssueTracker, enabled: unknown): boolean {
  if (enabled === true || enabled === false) { return enabled; }
  return tracker !== 'jira';
}

export interface TrailConfig {
  enabled: boolean | null
  dir: string
}

export function readTrailConfig(yamlText: string): TrailConfig {
  let inTrail = false;
  let enabled: boolean | null = null;
  let dir = DEFAULT_TRAIL_DIR;
  for (const line of yamlText.split(/\r?\n/)) {
    const top = /^([a-z_]+):/.exec(line);
    if (top) { inTrail = top[1] === 'trail'; continue; }
    if (!inTrail) { continue; }
    const leaf = /^ {2}(enabled|dir):[ \t]*([^#\n]*)/.exec(line);
    if (!leaf) { continue; }
    const value = leaf[2].trim().replace(/^(['"])(.*)\1$/, '$2');
    if (leaf[1] === 'enabled') { enabled = value === 'true' ? true : value === 'false' ? false : null; }
    else if (value !== '' && value !== 'null' && value !== '~') { dir = value.replace(/\/+$/, ''); }
  }
  return { enabled, dir };
}

export interface GitProbe {
  status: number | null
  stdout: string
}

export type CheckIgnore = (path: string) => GitProbe;

export interface TrailDiagnostic {
  enabled: boolean
  dir: string
  ignored: { file: string, rule: string }[]
}

export function trailDiagnostic(yamlText: string, tracker: IssueTracker, checkIgnore: CheckIgnore): TrailDiagnostic {
  const config = readTrailConfig(yamlText);
  const enabled = resolveTrail(tracker, config.enabled);
  const ignored: TrailDiagnostic['ignored'] = [];
  if (!enabled) { return { enabled, dir: config.dir, ignored }; }
  for (const name of TRAIL_FILES) {
    const file = `${config.dir}/doctor-probe/${name}`;
    const probe = checkIgnore(file);
    if (probe.status !== 0) { continue; }
    const match = /^(.*?):(\d+):([^\t]*)\t/.exec(probe.stdout.trim());
    const pattern = match?.[3] ?? '';
    if (pattern.startsWith('!')) { continue; }
    ignored.push({ file, rule: match ? `${match[1]}:${match[2]}:${pattern}` : 'unknown rule' });
  }
  return { enabled, dir: config.dir, ignored };
}
