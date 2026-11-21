import type { GhProbe } from './doctor.ts';
import { mkdirSync, mkdtempSync, realpathSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { describe, expect, test } from 'bun:test';

import { envVarApplies, issueTrackerDiagnostic, legacyCredentialKeys, piTrustStatus, repoCheckRunsAppWideLegs, userSkillInstalled, worktreeSetupAction } from './doctor.ts';

describe('worktreeSetupAction', () => {
  test('a provisioned worktree needs nothing', () => {
    expect(worktreeSetupAction({ envFile: true, deps: true, gitHooks: true })).toBeNull();
  });

  test('anything missing collapses into one worktree:provision action that names what is missing', () => {
    const action = worktreeSetupAction({ envFile: false, deps: true, gitHooks: false });
    expect(action?.target).toBe('bun run worktree:provision');
    expect(action?.hint).toContain('.env, .husky/_ (git hooks)');
    expect(action?.hint).not.toContain('node_modules');
  });
});

describe('legacyCredentialKeys', () => {
  const env = { JIRA_API_TOKEN: 'x', JIRA_URL: 'https://a.atlassian.net', JIRA_USERNAME: '  ' };

  test('greenfield: every retired name set in .env is a removal', () => {
    expect(legacyCredentialKeys(env, new Set())).toEqual({ remove: ['JIRA_URL', 'JIRA_API_TOKEN'], appOwned: [] });
  });

  test('adopted: a retired name the app declares as its own is never a removal', () => {
    expect(legacyCredentialKeys(env, new Set(['JIRA_API_TOKEN']))).toEqual({ remove: ['JIRA_URL'], appOwned: ['JIRA_API_TOKEN'] });
  });

  test('an empty value is not reported at all', () => {
    const out = legacyCredentialKeys(env, new Set(['JIRA_USERNAME']));
    expect([...out.remove, ...out.appOwned]).not.toContain('JIRA_USERNAME');
  });
});

describe('repoCheckRunsAppWideLegs', () => {
  test('the pre-scoping value is reported; the scoped one, a missing script and an app composition are not', () => {
    expect(repoCheckRunsAppWideLegs('bun run format:check && bun run lint:check && bun run types:check && bun run vars:check')).toBe(true);
    expect(repoCheckRunsAppWideLegs('bun scripts/tooling-check.ts repo && bun run vars:check')).toBe(false);
    expect(repoCheckRunsAppWideLegs(undefined)).toBe(false);
    expect(repoCheckRunsAppWideLegs('npm run ci')).toBe(false);
  });
});

describe('userSkillInstalled', () => {
  test('found in either user-level store, missing otherwise', () => {
    const home = mkdtempSync(join(tmpdir(), 'user-skill-'));
    expect(userSkillInstalled('agent-orchestration', home)).toBe(false);
    mkdirSync(join(home, '.claude', 'skills', 'agent-orchestration'), { recursive: true });
    expect(userSkillInstalled('agent-orchestration', home)).toBe(false);
    writeFileSync(join(home, '.claude', 'skills', 'agent-orchestration', 'SKILL.md'), 'x\n');
    expect(userSkillInstalled('agent-orchestration', home)).toBe(true);
    const other = mkdtempSync(join(tmpdir(), 'user-skill-'));
    mkdirSync(join(other, '.agents', 'skills', 'agent-orchestration'), { recursive: true });
    writeFileSync(join(other, '.agents', 'skills', 'agent-orchestration', 'SKILL.md'), 'x\n');
    expect(userSkillInstalled('agent-orchestration', other)).toBe(true);
  });
});

describe('piTrustStatus', () => {
  const workspace = (trust?: unknown, settings?: unknown): { root: string, env: Record<string, string> } => {
    const base = realpathSync(mkdtempSync(join(tmpdir(), 'pi-trust-')));
    const root = join(base, 'group', 'repo');
    const agentDir = join(base, 'agent');
    mkdirSync(root, { recursive: true });
    mkdirSync(agentDir, { recursive: true });
    if (trust !== undefined) { writeFileSync(join(agentDir, 'trust.json'), JSON.stringify(typeof trust === 'function' ? trust(base) : trust)); }
    if (settings !== undefined) { writeFileSync(join(agentDir, 'settings.json'), JSON.stringify(settings)); }
    return { root, env: { PI_CODING_AGENT_DIR: agentDir } };
  };

  test('the default on a fresh machine is to ask', () => {
    const { root, env } = workspace();
    expect(piTrustStatus(root, env)).toBe('ask');
  });

  test('defaultProjectTrust decides when nothing is saved', () => {
    const always = workspace(undefined, { defaultProjectTrust: 'always' });
    expect(piTrustStatus(always.root, always.env)).toBe('trusted');
    const never = workspace(undefined, { defaultProjectTrust: 'never' });
    expect(piTrustStatus(never.root, never.env)).toBe('declined');
  });

  test('the closest saved decision wins, a parent counts, and it beats the default', () => {
    const parent = workspace((base: string) => ({ [join(base, 'group')]: true }));
    expect(piTrustStatus(parent.root, parent.env)).toBe('trusted');
    const closer = workspace((base: string) => ({ [join(base, 'group')]: true, [join(base, 'group', 'repo')]: false }), { defaultProjectTrust: 'always' });
    expect(piTrustStatus(closer.root, closer.env)).toBe('declined');
  });

  test('no agent directory at all is unknown', () => {
    const { root } = workspace();
    expect(piTrustStatus(root, { PI_CODING_AGENT_DIR: join(root, 'nowhere') })).toBe('unknown');
  });
});

describe('issueTrackerDiagnostic', () => {
  const yaml = (value: string, projectNumber = '7'): string => `issue_tracker:\n  issue_tracker: ${value}\n  atlassian_url: null\n  github:\n    project_owner: '@me'\n    project_number: ${projectNumber}\n`;
  const status = (scopes: string): string => `github.com\n  ✓ Logged in to github.com account octo (keyring)\n  - Active account: true\n  - Token scopes: ${scopes}\n`;
  const never = (): GhProbe => { throw new Error('gh must not be probed off the github tracker'); };

  test.each(['null', 'Jira', 'JIRA', '\'Jira Cloud\''])('%s stays on Jira: Atlassian vars required, gh never probed, nothing to fix', (value) => {
    const { report, actions } = issueTrackerDiagnostic(yaml(value), never);
    expect(report.tracker).toBe('jira');
    expect(report.gh).toBeNull();
    expect(actions).toEqual([]);
    for (const name of ['ATLASSIAN_EMAIL', 'ATLASSIAN_API_TOKEN']) { expect(envVarApplies(name, report.tracker)).toBe(true); }
  });

  test('a value outside the enum stays on Jira and says so', () => {
    const { report, actions } = issueTrackerDiagnostic(yaml('Linear'), never);
    expect(report).toMatchObject({ tracker: 'jira', recognized: false, value: 'Linear' });
    expect(actions).toEqual([]);
    expect(report.note).toContain('jira | github | none');
    expect(report.note).not.toContain('Did you mean github');
    expect(issueTrackerDiagnostic(yaml('\'GitHub Issues\''), never).report.note).toContain('Did you mean github');
  });

  test('github with no board linked yet points at the bootstrap', () => {
    const scoped = (): GhProbe => ({ installed: true, ok: true, output: status('\'project\'') });
    for (const n of ['null', '~', '']) {
      expect(issueTrackerDiagnostic(yaml('github', n), scoped).actions).toEqual([expect.objectContaining({ target: 'bun run github:project:bootstrap --apply' })]);
    }
    const elsewhere = `other:\n  block:\n    project_number: 9\n${yaml('github', 'null')}`;
    expect(issueTrackerDiagnostic(elsewhere, scoped).actions).toHaveLength(1);
  });

  test('github: a broken inactive account does not hide a healthy active one', () => {
    const output = `${status('\'project\'')}\n  X Failed to log in to github.com account old (keyring)\n  - Active account: false\n  - The token in keyring is invalid.\n`;
    const { report, actions } = issueTrackerDiagnostic(yaml('github'), () => ({ installed: true, ok: false, output }));
    expect(report.gh).toEqual({ installed: true, authenticated: true, account: 'octo', project_scope: true });
    expect(actions).toEqual([]);
  });

  test('none: no Atlassian vars, no gh probe', () => {
    const { report, actions } = issueTrackerDiagnostic(yaml('none'), never);
    expect(report.tracker).toBe('none');
    expect(actions).toEqual([]);
    expect(envVarApplies('ATLASSIAN_EMAIL', 'none')).toBe(false);
    expect(envVarApplies('RESEND_API_KEY', 'none')).toBe(true);
    expect(envVarApplies('SUPABASE_ACCESS_TOKEN', 'none')).toBe(true);
  });

  test('github without the project scope names the exact owner command', () => {
    const { report, actions } = issueTrackerDiagnostic(yaml('github'), () => ({ installed: true, ok: true, output: status('\'gist\', \'repo\'') }));
    expect(report.gh).toEqual({ installed: true, authenticated: true, account: 'octo', project_scope: false });
    expect(actions).toEqual([expect.objectContaining({ type: 'shell_command', target: 'gh auth refresh -h github.com -s project' })]);
    expect(envVarApplies('ATLASSIAN_API_TOKEN', report.tracker)).toBe(false);
  });

  test('github with the scope is clean; a missing gh or session is an action', () => {
    expect(issueTrackerDiagnostic(yaml('github'), () => ({ installed: true, ok: true, output: status('\'project\', \'repo\'') })).actions).toEqual([]);
    expect(issueTrackerDiagnostic(yaml('github'), () => ({ installed: false, ok: false, output: '' })).actions[0]).toMatchObject({ type: 'system_install', target: 'gh' });
    expect(issueTrackerDiagnostic(yaml('github'), () => ({ installed: true, ok: false, output: '' })).actions[0]).toMatchObject({ target: 'gh auth login' });
  });
});
