#!/usr/bin/env bun
/**
 * Setup doctor — read-only health check for the agentic-dev-boilerplate setup.
 *
 * Outputs a structured report (human-readable by default, JSON with --json)
 * describing what's wired correctly and what still needs action. Designed for
 * AI agents driving the setup: parse the JSON, take action on each
 * pending_actions entry, then re-run until status === "ok".
 *
 * Usage:
 *   bun run setup:doctor              # human-readable summary
 *   bun run setup:doctor --json       # machine-readable JSON
 *   bun run setup:doctor --preflight  # blocker-only gate for `bun run setup`
 *
 * --preflight mode: minimal pre-install gate. Checks only the things that
 * would crash `cli/install.ts` at module-load time (Bun runtime present and
 * recent enough, `node_modules/@inquirer/prompts` resolvable). Skips env
 * vars, MCPs, direnv, external CLIs — those are install.ts's job. Uses only
 * node built-ins so it runs safely before `bun install`. Wired into the
 * `setup` npm script as `bun cli/doctor.ts --preflight && bun cli/install.ts`.
 *
 * Exit code:
 *   0 if status === "ok"     (full mode) or preflight passes
 *   1 if status === "needs-action"  or preflight blocker hit
 *
 * Side effects: none. This script never edits files or installs anything.
 */

import { execFileSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { readFile } from 'node:fs/promises';
import { homedir } from 'node:os';
import { join, resolve } from 'node:path';

// ----------------------------------------------------------------------------
// Constants
// ----------------------------------------------------------------------------

const REPO_ROOT = resolve(import.meta.dir, '..');
const ENV_PATH = join(REPO_ROOT, '.env');
const MCP_PATH = join(REPO_ROOT, '.mcp.json');
const OPENCODE_PATH = join(REPO_ROOT, 'opencode.jsonc');
const NODE_MODULES_DOTENV = join(REPO_ROOT, 'node_modules', 'dotenv-cli');
// --preflight mode resolves install.ts's only third-party import.
const INQUIRER_MARKER = join(REPO_ROOT, 'node_modules', '@inquirer', 'prompts', 'package.json');

// Minimum Bun version that install.ts is known to work with.
const MIN_BUN: readonly [number, number, number] = [1, 0, 0];

// Required MCP env vars (mirrors MCP_SERVER_SECRETS in cli/install.ts).
const REQUIRED_VARS = [
  'TAVILY_API_KEY',
  'JIRA_URL',
  'JIRA_USERNAME',
  'JIRA_API_TOKEN',
  'SUPABASE_ACCESS_TOKEN',
  'SUPABASE_URL',
  'SUPABASE_ANON_KEY',
  'SUPABASE_SERVICE_ROLE_KEY',
  'N8N_API_URL',
  'N8N_API_KEY',
] as const;

const VAR_HINTS: Record<string, { hint: string, where: string }> = {
  TAVILY_API_KEY: {
    hint: 'Tavily web-search MCP API key',
    where: 'https://app.tavily.com/  →  account  →  API keys',
  },
  JIRA_URL: {
    hint: 'Atlassian / Jira workspace URL',
    where: 'e.g. https://yourorg.atlassian.net',
  },
  JIRA_USERNAME: {
    hint: 'Email used to log in to Atlassian',
    where: 'Your Atlassian account email',
  },
  JIRA_API_TOKEN: {
    hint: 'Atlassian API token for acli / MCP',
    where: 'https://id.atlassian.com/manage-profile/security/api-tokens',
  },
  SUPABASE_ACCESS_TOKEN: {
    hint: 'Supabase personal access token (PAT) for the Supabase MCP server',
    where: 'https://supabase.com/dashboard/account/tokens',
  },
  SUPABASE_URL: {
    hint: 'Supabase project URL',
    where: 'Supabase dashboard → Project Settings → API',
  },
  SUPABASE_ANON_KEY: {
    hint: 'Supabase anon (public) API key',
    where: 'Supabase dashboard → Project Settings → API',
  },
  SUPABASE_SERVICE_ROLE_KEY: {
    hint: 'Supabase service-role key (server-side, full DB access)',
    where: 'Supabase dashboard → Project Settings → API',
  },
  N8N_API_URL: {
    hint: 'n8n instance API URL for the n8n MCP server',
    where: 'e.g. https://n8n.yourapp.com/api/v1',
  },
  N8N_API_KEY: {
    hint: 'n8n API key for the n8n MCP server',
    where: 'n8n instance → Settings → API',
  },
};

// ----------------------------------------------------------------------------
// Types
// ----------------------------------------------------------------------------

type PendingActionType = 'credential' | 'shell_hook' | 'system_install' | 'shell_command';

interface PendingAction {
  type: PendingActionType
  target: string
  hint: string
  where?: string
}

interface DirenvState {
  installed: boolean
  version?: string
  envrc_allowed?: boolean
  hook_in_rc?: boolean
  rc_file?: string
}

interface DoctorReport {
  status: 'ok' | 'needs-action'
  repo_root: string
  platform: NodeJS.Platform
  shell: string
  is_tty: boolean
  env_file_exists: boolean
  env_vars: Record<string, 'set' | 'missing'>
  mcp_json_exists: boolean
  opencode_jsonc_exists: boolean
  deps_installed: boolean
  direnv: DirenvState
  pending_actions: PendingAction[]
}

// ----------------------------------------------------------------------------
// Helpers
// ----------------------------------------------------------------------------

function tryRun(binary: string, args: string[]): { ok: boolean, stdout: string } {
  try {
    const stdout = execFileSync(binary, args, {
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'pipe'],
    });
    return { ok: true, stdout };
  }
  catch {
    return { ok: false, stdout: '' };
  }
}

function parseEnvFile(content: string): Record<string, string> {
  const out: Record<string, string> = {};
  for (const rawLine of content.split('\n')) {
    const line = rawLine.trim();
    if (line.length === 0 || line.startsWith('#')) { continue; }
    const eq = line.indexOf('=');
    if (eq <= 0) { continue; }
    const key = line.slice(0, eq).trim();
    let value = line.slice(eq + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"'))
      || (value.startsWith('\'') && value.endsWith('\''))
    ) {
      value = value.slice(1, -1);
    }
    out[key] = value;
  }
  return out;
}

async function detectDirenv(): Promise<DirenvState> {
  const version = tryRun('direnv', ['version']);
  if (!version.ok) { return { installed: false }; }

  const status = tryRun('direnv', ['status']);
  const envrcAllowed = /Found RC allowed true/.test(status.stdout);

  const candidates = ['.bashrc', '.zshrc', '.bash_profile', '.profile'];
  let hookInRc = false;
  let rcFile: string | undefined;
  for (const file of candidates) {
    const path = join(homedir(), file);
    if (!existsSync(path)) { continue; }
    try {
      const content = await readFile(path, 'utf8');
      if (/\bdirenv\s+hook\b/.test(content)) {
        hookInRc = true;
        rcFile = path;
        break;
      }
    }
    catch {
      // skip unreadable files (permissions, broken symlinks)
    }
  }

  return {
    installed: true,
    version: version.stdout.trim(),
    envrc_allowed: envrcAllowed,
    hook_in_rc: hookInRc,
    rc_file: rcFile,
  };
}

function installCommandForPlatform(): string {
  if (process.platform === 'win32') {
    return 'winget install direnv';
  }
  if (process.platform === 'darwin') {
    return 'brew install direnv';
  }
  return 'sudo apt install direnv  (or: dnf install direnv / pacman -S direnv)';
}

function shellHookLine(): { line: string, rc: string } {
  const shell = (process.env.SHELL ?? '').toLowerCase();
  if (shell.endsWith('zsh')) {
    return { line: 'eval "$(direnv hook zsh)"', rc: '~/.zshrc' };
  }
  if (shell.endsWith('fish')) {
    return { line: 'direnv hook fish | source', rc: '~/.config/fish/config.fish' };
  }
  return { line: 'eval "$(direnv hook bash)"', rc: '~/.bashrc' };
}

function parseBunVersion(v: string): [number, number, number] | null {
  const m = v.match(/^(\d+)\.(\d+)\.(\d+)/);
  if (!m) { return null; }
  return [Number(m[1]), Number(m[2]), Number(m[3])];
}

function compareVersion(a: readonly number[], b: readonly number[]): number {
  for (let i = 0; i < 3; i++) {
    if (a[i] !== b[i]) { return a[i] - b[i]; }
  }
  return 0;
}

// ----------------------------------------------------------------------------
// Main check
// ----------------------------------------------------------------------------

async function runDoctor(): Promise<DoctorReport> {
  const report: DoctorReport = {
    status: 'ok',
    repo_root: REPO_ROOT,
    platform: process.platform,
    shell: process.env.SHELL ?? '',
    is_tty: Boolean(process.stdin.isTTY),
    env_file_exists: existsSync(ENV_PATH),
    env_vars: {},
    mcp_json_exists: existsSync(MCP_PATH),
    opencode_jsonc_exists: existsSync(OPENCODE_PATH),
    deps_installed: existsSync(NODE_MODULES_DOTENV),
    direnv: { installed: false },
    pending_actions: [],
  };

  // .env presence
  if (!report.env_file_exists) {
    report.pending_actions.push({
      type: 'shell_command',
      target: 'cp .env.example .env',
      hint: 'Create .env from the template; then fill in the vars below.',
    });
  }

  // env vars
  const envValues = report.env_file_exists
    ? parseEnvFile(await readFile(ENV_PATH, 'utf8'))
    : {};
  for (const v of REQUIRED_VARS) {
    const value = envValues[v];
    const isSet = value !== undefined && value.trim().length > 0;
    report.env_vars[v] = isSet ? 'set' : 'missing';
    if (!isSet) {
      report.pending_actions.push({
        type: 'credential',
        target: v,
        hint: VAR_HINTS[v]?.hint ?? `Required env var: ${v}`,
        where: VAR_HINTS[v]?.where,
      });
    }
  }

  // node_modules / dotenv-cli
  if (!report.deps_installed) {
    report.pending_actions.push({
      type: 'shell_command',
      target: 'bun install',
      hint: 'Install project dependencies including dotenv-cli (needed for `bun claude`).',
    });
  }

  // direnv (optional — wrapper still works without it)
  report.direnv = await detectDirenv();
  if (!report.direnv.installed) {
    report.pending_actions.push({
      type: 'system_install',
      target: 'direnv',
      hint: 'Optional. Without direnv, launch with `bun claude` / `bun opencode` (wrapper). Install if you want `claude` to work directly via shell autoload.',
      where: installCommandForPlatform(),
    });
  }
  else {
    if (!report.direnv.envrc_allowed) {
      report.pending_actions.push({
        type: 'shell_command',
        target: 'direnv allow',
        hint: 'Approve this repo\'s .envrc so direnv auto-loads .env on cd.',
      });
    }
    if (!report.direnv.hook_in_rc) {
      const hook = shellHookLine();
      report.pending_actions.push({
        type: 'shell_hook',
        target: hook.rc,
        hint: `Add the direnv shell hook to ${hook.rc} so 'cd' into this repo auto-loads .env.`,
        where: hook.line,
      });
    }
  }

  // .mcp.json / opencode.jsonc presence
  if (!report.mcp_json_exists) {
    report.pending_actions.push({
      type: 'shell_command',
      target: 'git restore .mcp.json',
      hint: '.mcp.json is missing. Restore from git — it is the committed Claude Code config.',
    });
  }
  if (!report.opencode_jsonc_exists) {
    report.pending_actions.push({
      type: 'shell_command',
      target: 'git restore opencode.jsonc',
      hint: 'opencode.jsonc is missing. Restore from git — it is the committed OpenCode config.',
    });
  }

  if (report.pending_actions.length > 0) {
    report.status = 'needs-action';
  }
  return report;
}

// ----------------------------------------------------------------------------
// Output formatters
// ----------------------------------------------------------------------------

const COLORS = {
  reset: '\x1B[0m',
  dim: '\x1B[2m',
  green: '\x1B[32m',
  yellow: '\x1B[33m',
  red: '\x1B[31m',
  bold: '\x1B[1m',
};

function printHuman(report: DoctorReport): void {
  const tick = (ok: boolean) => (ok ? `${COLORS.green}✓${COLORS.reset}` : `${COLORS.red}✗${COLORS.reset}`);
  const headerColor = report.status === 'ok' ? COLORS.green : COLORS.yellow;
  const headerLabel = report.status === 'ok' ? '✓ OK' : '⚠ needs action';

  process.stdout.write(`\n${COLORS.bold}Setup doctor — ${headerColor}${headerLabel}${COLORS.reset}\n\n`);
  process.stdout.write(`Platform         ${report.platform}\n`);
  process.stdout.write(`Shell            ${report.shell || '(unset)'}\n`);
  process.stdout.write(`TTY              ${report.is_tty ? 'yes' : 'no (running non-interactive)'}\n`);
  process.stdout.write('\n');
  process.stdout.write(`.env file        ${tick(report.env_file_exists)}\n`);
  process.stdout.write(`.mcp.json        ${tick(report.mcp_json_exists)}\n`);
  process.stdout.write(`opencode.jsonc   ${tick(report.opencode_jsonc_exists)}\n`);
  process.stdout.write(`node_modules     ${tick(report.deps_installed)}\n`);
  process.stdout.write(`direnv binary    ${tick(report.direnv.installed)}${report.direnv.version ? ` (${report.direnv.version})` : ''}\n`);
  if (report.direnv.installed) {
    process.stdout.write(`  .envrc allowed ${tick(Boolean(report.direnv.envrc_allowed))}\n`);
    process.stdout.write(`  shell hook     ${tick(Boolean(report.direnv.hook_in_rc))}${report.direnv.rc_file ? ` (in ${report.direnv.rc_file})` : ''}\n`);
  }

  process.stdout.write('\nEnv vars:\n');
  for (const [k, v] of Object.entries(report.env_vars)) {
    const mark = v === 'set' ? `${COLORS.green}✓ set${COLORS.reset}` : `${COLORS.red}✗ missing${COLORS.reset}`;
    process.stdout.write(`  ${k.padEnd(28)} ${mark}\n`);
  }

  if (report.pending_actions.length > 0) {
    process.stdout.write(`\n${COLORS.bold}Pending actions:${COLORS.reset}\n`);
    for (const action of report.pending_actions) {
      process.stdout.write(`  ${COLORS.yellow}[${action.type}]${COLORS.reset} ${action.target}\n`);
      process.stdout.write(`    ${action.hint}\n`);
      if (action.where) {
        process.stdout.write(`    ${COLORS.dim}→ ${action.where}${COLORS.reset}\n`);
      }
    }
    process.stdout.write(`\n${COLORS.dim}For AI agents: bun run setup:doctor --json  (machine-readable)${COLORS.reset}\n`);
  }
  else {
    process.stdout.write(`\n${COLORS.green}All green.${COLORS.reset} Launch agent: bun claude  /  bun opencode\n`);
  }
}

// ----------------------------------------------------------------------------
// Preflight (blocker-only gate for `bun run setup`)
// ----------------------------------------------------------------------------

function preflightFail(msg: string, fix: string): never {
  process.stderr.write(`${COLORS.red}✗ Preflight failed:${COLORS.reset} ${msg}\n`);
  process.stderr.write(`${COLORS.yellow}  Fix:${COLORS.reset} ${fix}\n`);
  process.exit(1);
}

function runPreflight(): never {
  const bunVersion = process.versions.bun;
  if (!bunVersion) {
    preflightFail(
      'Bun runtime not detected (process.versions.bun is undefined).',
      'Install Bun from https://bun.sh, then re-run `bun run setup`.',
    );
  }
  const parsed = parseBunVersion(bunVersion);
  if (!parsed || compareVersion(parsed, MIN_BUN) < 0) {
    preflightFail(
      `Bun ${bunVersion} is older than required ${MIN_BUN.join('.')}.`,
      'Upgrade Bun: `bun upgrade` (or reinstall from https://bun.sh).',
    );
  }
  if (!existsSync(INQUIRER_MARKER)) {
    preflightFail(
      'Project dependencies not installed (node_modules/@inquirer/prompts missing).',
      'Run `bun install` first, then re-run `bun run setup`.',
    );
  }
  process.stdout.write(
    `${COLORS.green}✓ Preflight OK${COLORS.reset} ${COLORS.dim}(Bun ${bunVersion}, deps installed)${COLORS.reset}\n`,
  );
  process.exit(0);
}

// ----------------------------------------------------------------------------
// Entry
// ----------------------------------------------------------------------------

if (process.argv.includes('--preflight')) {
  runPreflight();
}

const asJson = process.argv.includes('--json');

runDoctor().then((report) => {
  if (asJson) {
    process.stdout.write(`${JSON.stringify(report, null, 2)}\n`);
  }
  else {
    printHuman(report);
  }
  process.exit(report.status === 'ok' ? 0 : 1);
}).catch((err) => {
  process.stderr.write(`Doctor failed: ${(err as Error).message ?? String(err)}\n`);
  process.exit(2);
});
