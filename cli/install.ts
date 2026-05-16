#!/usr/bin/env bun
/**
 * Project installer for agentic-dev-boilerplate.
 *
 * Drives the end-to-end setup flow defined in `.plans/FASE-15-DESIGN.md`:
 *   1. Detect gentle-ai (presence + version)
 *   2. Detect agents (Claude Code / OpenCode) and prompt selection
 *   3. Optionally install 15 skills + engram via gentle-ai
 *   4. Wire `.env` for MCP servers + offer direnv autoload
 *      (`.mcp.json` and `opencode.jsonc` are committed with ${VAR}/{env:VAR}
 *      expansion — installer only ensures `.env` has the required values)
 *   5. Verify external CLIs (bun, gh, supabase, vercel, resend, acli,
 *      playwright-cli, jq) — `which`-check only; no auto-install (Rule 4:
 *      OS-dependent installs are deferred to upstream docs)
 *   6. Persist `.agents/install-state.json` for idempotency
 *
 * Env:
 *   INSTALL_SKIP_DIRENV=1   Skip direnv autoload sub-step
 *
 * Usage:
 *   bun run setup
 */

import { execFileSync, spawnSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { mkdir, readFile, stat, writeFile } from 'node:fs/promises';
import { homedir } from 'node:os';
import { dirname, join, resolve } from 'node:path';

import { checkbox, confirm, input, password, select } from '@inquirer/prompts';

// ============================================================================
// Types
// ============================================================================

type AgentId = 'claude-code' | 'opencode';

type InstallStatus = 'installed' | 'skipped' | 'failed';

type McpStatus = 'configured-with-key' | 'configured-no-key' | 'placeholder' | 'skipped-by-user';

type CliStatus = 'found' | 'missing';

interface GentleAiInfo {
  found: boolean
  version?: string
  compatible?: boolean
  status: 'installed' | 'missing' | 'skipped' | 'incompatible'
}

interface AgentDetection {
  claudeCode: boolean
  opencode: boolean
}

interface GithubRemoteInfo {
  account: string
  repo: string
  visibility: 'private' | 'public' | 'internal'
  url: string
  createdAt: string
}

interface InstallState {
  version: 1
  installedAt: string
  agents: AgentId[]
  gentleAi: {
    status: GentleAiInfo['status']
    version?: string
    checkedAt: string
  }
  skills: Record<string, InstallStatus>
  mcps: Record<string, McpStatus>
  externalClis: Record<string, CliStatus>
  pendingEnvVars: string[]
  github?: GithubRemoteInfo
}

// ============================================================================
// Constants
// ============================================================================

const REPO_ROOT = resolve(import.meta.dir, '..');
const STATE_PATH = join(REPO_ROOT, '.agents', 'install-state.json');
const CLAUDE_MCP_PATH = join(REPO_ROOT, '.mcp.json');
const OPENCODE_CONFIG_PATH = join(REPO_ROOT, 'opencode.jsonc');
const ENV_PATH = join(REPO_ROOT, '.env');
const ENV_EXAMPLE_PATH = join(REPO_ROOT, '.env.example');

const MIN_GENTLE_AI_VERSION = [1, 26, 5] as const;

const ENGRAM_COMPONENT = 'engram';

const SKILL_SLUGS = [
  'sdd-init',
  'sdd-explore',
  'sdd-propose',
  'sdd-spec',
  'sdd-design',
  'sdd-tasks',
  'sdd-apply',
  'sdd-verify',
  'sdd-archive',
  'sdd-onboard',
  'skill-registry',
  'judgment-day',
  'cognitive-doc-design',
  'comment-writer',
  'issue-creation',
] as const;

const CANONICAL_MCPS = ['context7', 'tavily', 'atlassian', 'supabase', 'n8n'] as const;

interface CommunitySkill {
  package: string
  skill?: string // omit or '*' to install all skills from the package
}

// Community skills installed at PROJECT level (`bunx skills add`).
// Stack-aware defaults — tuned for Next.js + React + Tailwind + shadcn.
// CLI-companion skills (gh-cli, supabase, deploy-to-vercel, resend-cli, bun,
// playwright-cli) live at USER level instead — they're useful across every
// project the user works on, not just this boilerplate. See USER_LEVEL_SKILLS.
// Users can run `bunx autoskills` later to refine for their concrete stack.
const PROJECT_LEVEL_SKILLS: ReadonlyArray<CommunitySkill> = [
  { package: 'https://github.com/anthropics/skills', skill: 'frontend-design' },
  { package: 'https://github.com/vercel-labs/agent-skills', skill: 'react-best-practices' },
  { package: 'https://github.com/vercel-labs/agent-skills', skill: 'composition-patterns' },
  { package: 'https://github.com/vercel-labs/next-skills', skill: 'next-best-practices' },
  { package: 'https://github.com/vercel-labs/next-skills', skill: 'next-cache-components' },
  { package: 'https://github.com/vercel-labs/next-skills', skill: 'next-upgrade' },
  { package: 'https://github.com/pproenca/dot-skills', skill: 'react-hook-form' },
  { package: 'https://github.com/pproenca/dot-skills', skill: 'zod' },
  { package: 'https://github.com/shadcn/ui', skill: 'shadcn' },
  { package: 'https://github.com/giuseppe-trisciuoglio/developer-kit', skill: 'tailwind-css-patterns' },
  { package: 'https://github.com/wshobson/agents', skill: 'typescript-advanced-types' },
  { package: 'https://github.com/addyosmani/web-quality-skills', skill: 'accessibility' },
  { package: 'https://github.com/addyosmani/web-quality-skills', skill: 'seo' },
  { package: 'czlonkowski/n8n-skills' }, // whole repo (n8n MCP toolkit)
  { package: 'https://github.com/emilkowalski/skill', skill: 'emil-design-eng' },
  { package: 'https://github.com/nextlevelbuilder/ui-ux-pro-max-skill', skill: 'ui-ux-pro-max' },
  { package: 'https://github.com/pbakaus/impeccable', skill: 'impeccable' },
  { package: 'https://github.com/Leonxlnx/taste-skill', skill: 'design-taste-frontend' },
  { package: 'https://github.com/Leonxlnx/taste-skill', skill: 'redesign-existing-projects' },
];

// Community skills installed at USER (global) level — useful across most
// projects. Includes every CLI-companion skill (so `gh`, `supabase`, `vercel`,
// `resend`, `bun`, `playwright-cli` always have their docs/skill loaded
// regardless of which repo the user is in).
const USER_LEVEL_SKILLS: ReadonlyArray<CommunitySkill> = [
  { package: 'https://github.com/anthropics/skills', skill: 'skill-creator' },
  { package: 'https://github.com/vercel-labs/skills', skill: 'find-skills' },
  { package: 'https://github.com/xixu-me/skills', skill: 'github-actions-docs' },
  { package: 'https://github.com/obra/superpowers', skill: 'brainstorming' },
  // cli-printing-press: full functionality requires Go 1.26.3+ (go install github.com/mvanhorn/cli-printing-press/v4/cmd/printing-press@latest); skill works standalone with degraded features
  { package: 'https://github.com/mvanhorn/cli-printing-press', skill: 'cli-printing-press' },
  { package: 'https://github.com/lewislulu/html-ppt-skill', skill: 'html-ppt' },
  // CLI-companion skills (mirror EXTERNAL_CLIS) — load whenever user runs the
  // matching binary, anywhere on their machine.
  { package: 'https://github.com/github/awesome-copilot', skill: 'gh-cli' },
  { package: 'supabase/agent-skills', skill: 'supabase' },
  { package: 'supabase/agent-skills', skill: 'supabase-postgres-best-practices' },
  { package: 'https://github.com/vercel-labs/agent-skills', skill: 'deploy-to-vercel' },
  { package: 'resend/resend-cli' },
  { package: 'https://bun.sh/docs', skill: 'bun' },
  { package: 'https://github.com/microsoft/playwright-cli', skill: 'playwright-cli' },
];

// External CLIs the boilerplate's skills depend on. Installer NEVER auto-installs
// these — it only `which`-checks and points the user to the OFFICIAL docs.
// Rule: any install whose command depends on the user's OS must be deferred to
// the upstream docs (Rule 4). Single-shot cross-platform commands (e.g.
// `bun add -g X`) MAY ship as `install`; everything else uses `docs` only.
const EXTERNAL_CLIS: ReadonlyArray<{ name: string, install?: string, docs: string, purpose: string }> = [
  {
    name: 'bun',
    docs: 'https://bun.com/',
    purpose: 'general-purpose runtime + package manager (this repo runs on bun)',
  },
  {
    name: 'gh',
    docs: 'https://github.com/cli/cli#installation',
    purpose: 'GitHub CLI — repos, PRs, releases, gh api',
  },
  {
    name: 'supabase',
    docs: 'https://supabase.com/docs/guides/local-development/cli/getting-started',
    purpose: 'database — migrations, types, local stack',
  },
  {
    name: 'vercel',
    install: 'bun add -g vercel',
    docs: 'https://vercel.com/docs/cli',
    purpose: 'deploys + project linking',
  },
  {
    name: 'resend',
    docs: 'https://resend.com/docs/cli',
    purpose: 'email development + transactional sending',
  },
  {
    // `acli` install command depends on OS (brew tap on macOS, manual binary on
    // Linux/Windows). Defer to upstream docs.
    name: 'acli',
    docs: 'https://developer.atlassian.com/cloud/acli/guides/install-acli/',
    purpose: 'Atlassian (Jira/Confluence) CLI — used by /acli skill',
  },
  {
    // Binary produced by @playwright/cli is `playwright-cli`, used by the
    // /playwright-cli skill. NOT @playwright/test, which is a devDep test
    // runner library producing no global binary — `which playwright` would
    // never find it.
    name: 'playwright-cli',
    install: 'bun add -g @playwright/cli@latest',
    docs: 'https://playwright.dev/agent-cli/introduction',
    purpose: 'browser automation — screenshots, traces, recordings',
  },
  {
    name: 'jq',
    docs: 'https://jqlang.org/',
    purpose: 'JSON processor — required by /acli skill for parsing acli --json output',
  },
];

// Matches Claude Code ${VAR} and ${VAR:-default} placeholders in .mcp.json.
const MCP_VAR_PATTERN = /\$\{([A-Z][A-Z0-9_]*)(?::-[^}]*)?\}/g;
// Matches OpenCode {env:VAR} placeholders in opencode.jsonc.
const OPENCODE_VAR_PATTERN = /\{env:([A-Z][A-Z0-9_]*)\}/g;
const SECRET_NAME_HINTS = ['TOKEN', 'KEY', 'SECRET', 'PASSWORD'];

// Map MCP server → env vars its secrets depend on. Servers with empty arrays
// have no secrets (so they're always "configured-no-key").
const MCP_SERVER_SECRETS: Record<string, readonly string[]> = {
  context7: [],
  tavily: ['TAVILY_API_KEY'],
  atlassian: ['JIRA_URL', 'JIRA_USERNAME', 'JIRA_API_TOKEN'],
  supabase: [
    'SUPABASE_ACCESS_TOKEN',
    'SUPABASE_URL',
    'SUPABASE_ANON_KEY',
    'SUPABASE_SERVICE_ROLE_KEY',
  ],
  n8n: ['N8N_API_URL', 'N8N_API_KEY'],
};

// ============================================================================
// CLI flags
// ============================================================================

// Auto-detect non-TTY (e.g. when an AI agent or CI pipeline invokes the
// installer) so prompts don't hang waiting for stdin. The flag still wins
// explicitly when passed; without it, lack of a TTY forces the same mode.
const NON_INTERACTIVE
  = process.argv.includes('--non-interactive') || !process.stdin.isTTY;
const AUTO_NON_INTERACTIVE
  = !process.argv.includes('--non-interactive') && !process.stdin.isTTY;
const SKIP_DIRENV = process.env.INSTALL_SKIP_DIRENV === '1';

// ============================================================================
// Logger
// ============================================================================

const COLORS = {
  reset: '\x1B[0m',
  dim: '\x1B[2m',
  cyan: '\x1B[36m',
  green: '\x1B[32m',
  yellow: '\x1B[33m',
  red: '\x1B[31m',
  bold: '\x1B[1m',
};

const log = {
  info: (msg: string) => process.stdout.write(`${COLORS.cyan}ℹ${COLORS.reset} ${msg}\n`),
  success: (msg: string) => process.stdout.write(`${COLORS.green}✓${COLORS.reset} ${msg}\n`),
  warn: (msg: string) => process.stdout.write(`${COLORS.yellow}⚠${COLORS.reset} ${msg}\n`),
  error: (msg: string) => process.stderr.write(`${COLORS.red}✗${COLORS.reset} ${msg}\n`),
  banner: (msg: string) => process.stdout.write(`\n${COLORS.bold}${COLORS.cyan}${msg}${COLORS.reset}\n\n`),
  step: (n: number, total: number, title: string) =>
    process.stdout.write(`\n${COLORS.bold}[${n}/${total}] ${title}${COLORS.reset}\n`),
  dim: (msg: string) => process.stdout.write(`${COLORS.dim}${msg}${COLORS.reset}\n`),
};

// ============================================================================
// Prompt helpers
// ============================================================================

async function maybeConfirm(message: string, defaultYes: boolean): Promise<boolean> {
  if (NON_INTERACTIVE) { return defaultYes; }
  return confirm({ message, default: defaultYes });
}

// ============================================================================
// Subprocess helpers
// ============================================================================

function which(binary: string): string | null {
  const result = spawnSync('which', [binary], { encoding: 'utf8' });
  if (result.status !== 0) { return null; }
  const out = result.stdout.trim();
  return out.length > 0 ? out : null;
}

function tryRun(binary: string, args: string[]): { ok: boolean, stdout: string, stderr: string } {
  try {
    const stdout = execFileSync(binary, args, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] });
    return { ok: true, stdout, stderr: '' };
  }
  catch (err) {
    const e = err as { stdout?: Buffer | string, stderr?: Buffer | string };
    return {
      ok: false,
      stdout: typeof e.stdout === 'string' ? e.stdout : e.stdout?.toString() ?? '',
      stderr: typeof e.stderr === 'string' ? e.stderr : e.stderr?.toString() ?? '',
    };
  }
}

// ============================================================================
// Step 1 — repo identity check
// ============================================================================

async function verifyRepoRoot(): Promise<void> {
  const pkgPath = join(REPO_ROOT, 'package.json');
  if (!existsSync(pkgPath)) {
    log.error(`No package.json found at ${pkgPath}. Run this from the repo root.`);
    log.dim('Re-run from the repo root with: bun run setup');
    process.exit(1);
  }
  const raw = await readFile(pkgPath, 'utf8');
  const pkg = JSON.parse(raw) as { name?: string };

  if (pkg.name === 'agentic-dev-boilerplate') {
    return;
  }

  // Accept projects bootstrapped from this template — they keep a marker file
  // even though their package.json name is the user-chosen project name.
  const markerPath = join(REPO_ROOT, '.agents', 'template-marker.json');
  if (existsSync(markerPath)) {
    try {
      const marker = JSON.parse(await readFile(markerPath, 'utf8')) as { template?: string };
      if (marker.template === 'upex-galaxy/agentic-dev-boilerplate') {
        log.info(`Bootstrapped project detected: ${pkg.name ?? '(unknown)'}`);
        return;
      }
    }
    catch {
      // marker present but unreadable — fall through to confirm
    }
  }

  const proceed = await confirm({
    message: `package.json name is "${pkg.name ?? '(unknown)'}". Continue anyway?`,
    default: false,
  });
  if (!proceed) {
    log.dim('Aborted. Re-run from the correct repo root with: bun run setup');
    process.exit(0);
  }
}

// ============================================================================
// Step 2 — detect gentle-ai
// ============================================================================

function parseGentleAiVersion(output: string): string | undefined {
  const match = output.match(/(\d+)\.(\d+)\.(\d+)/);
  return match ? `${match[1]}.${match[2]}.${match[3]}` : undefined;
}

function isCompatible(version: string): boolean {
  const parts = version.split('.').map(n => Number.parseInt(n, 10));
  for (let i = 0; i < 3; i++) {
    const got = parts[i] ?? 0;
    const min = MIN_GENTLE_AI_VERSION[i];
    if (got > min) { return true; }
    if (got < min) { return false; }
  }
  return true;
}

function detectGentleAi(): GentleAiInfo {
  const path = which('gentle-ai');
  if (!path) { return { found: false, status: 'missing' }; }

  const result = tryRun('gentle-ai', ['version']);
  if (!result.ok) { return { found: true, status: 'incompatible' }; }

  const version = parseGentleAiVersion(result.stdout);
  if (!version) { return { found: true, status: 'incompatible' }; }

  const compatible = isCompatible(version);
  return {
    found: true,
    version,
    compatible,
    status: compatible ? 'installed' : 'incompatible',
  };
}

// ============================================================================
// Step 3 — gentle-ai install instructions / skip
// ============================================================================

async function handleMissingGentleAi(): Promise<'show-and-exit' | 'skip'> {
  log.warn('gentle-ai not detected on PATH.');
  log.info('gentle-ai installs the 15 skills + engram + SDD orchestrator into your agent.');
  process.stdout.write('\n');

  const choice = await confirm({
    message: 'Show install commands and exit so you can install it? (No = continue without gentle-ai)',
    default: true,
  });

  if (choice) {
    log.banner('Install gentle-ai');
    process.stdout.write('  Official docs : https://github.com/Gentleman-Programming/gentle-ai\n');
    process.stdout.write('  Quick install :\n');
    process.stdout.write('    macOS : brew install gentle-ai\n');
    process.stdout.write('    Linux : go install github.com/Gentleman-Programming/gentle-ai/cmd/gentle-ai@latest\n\n');
    log.dim('After installing, re-run: bun run setup');
    return 'show-and-exit';
  }

  log.warn('Continuing without gentle-ai. Skills + engram will NOT be installed.');
  log.dim('  To enable later: install gentle-ai (see docs above), then re-run: bun run setup');
  return 'skip';
}

// ============================================================================
// Step 4 — detect agents
// ============================================================================

async function detectAgents(): Promise<AgentDetection> {
  const claudePath = join(homedir(), '.claude');
  const opencodePath = join(homedir(), '.config', 'opencode');

  const [claude, opencode] = await Promise.all([
    stat(claudePath).then(
      s => s.isDirectory(),
      () => false,
    ),
    stat(opencodePath).then(
      s => s.isDirectory(),
      () => false,
    ),
  ]);

  return { claudeCode: claude, opencode };
}

async function promptAgentSelection(detected: AgentDetection): Promise<AgentId[]> {
  if (!detected.claudeCode && !detected.opencode) {
    log.error('No agents detected. Install Claude Code (~/.claude/) or OpenCode (~/.config/opencode/) and rerun.');
    log.dim('  Claude Code : https://docs.claude.com/claude-code');
    log.dim('  OpenCode    : https://opencode.ai');
    log.dim('After installing one (or both), re-run: bun run setup');
    process.exit(1);
  }

  if (detected.claudeCode && !detected.opencode) {
    const ok = await confirm({ message: 'Detected Claude Code. Configure for it?', default: true });
    return ok ? ['claude-code'] : [];
  }

  if (detected.opencode && !detected.claudeCode) {
    const ok = await confirm({ message: 'Detected OpenCode. Configure for it?', default: true });
    return ok ? ['opencode'] : [];
  }

  const selected = await checkbox<AgentId>({
    message: 'Detected both agents. Which to configure?',
    choices: [
      { name: 'Claude Code', value: 'claude-code', checked: true },
      { name: 'OpenCode', value: 'opencode', checked: true },
    ],
    required: true,
  });
  return selected;
}

// ============================================================================
// Step 5/6 — install skills via gentle-ai
// ============================================================================

// Components installed in the batched gentle-ai call:
//   - engram → persistent memory (MCP + plugin)
//   - sdd    → SDD slash-commands + orchestrator config
//   - skills → skill files filtered by --skills list
const GENTLE_AI_COMPONENTS = ['engram', 'sdd', 'skills'] as const;

function runGentleAiInstall(args: string[]): { ok: boolean, reason?: string } {
  // gentle-ai uses Go's `flag` package with a fixed schema (see source
  // internal/cli/install.go). Supported flags are: --agent(s), --component(s),
  // --skill(s), --persona, --preset, --sdd-mode, --dry-run. There is NO --yes
  // flag — passing one yields `flag provided but not defined: -yes`.
  // Interactive prompts inside the run (e.g. "Add to allowlist? (y/N)") fall
  // back to their default answer when stdin is not a TTY, so subprocess calls
  // are effectively non-interactive without any extra flag.
  const result = tryRun('gentle-ai', args);
  if (result.ok) { return { ok: true }; }
  return { ok: false, reason: result.stderr.trim() || result.stdout.trim() || 'unknown error' };
}

async function installSkillsViaGentleAi(
  agents: AgentId[],
  state: InstallState,
): Promise<void> {
  if (agents.length === 0) {
    log.info('No agents selected, skipping skill install.');
    return;
  }

  // One batched call per agent: engram + sdd + skills (filtered by --skills).
  // gentle-ai re-applies components idempotently (existing files get backed up
  // via the built-in snapshot system, then overwritten with the current
  // version), so re-runs are safe.
  const totalCalls = agents.length;
  log.info(`This will run ${totalCalls} gentle-ai install command(s) — one batched call per agent.`);
  log.dim(`  Each call installs: components=${GENTLE_AI_COMPONENTS.join(',')}; skills=${SKILL_SLUGS.length}`);

  const proceed = await confirm({ message: 'Continue with skill installation?', default: true });
  if (!proceed) {
    log.warn('Skipping skill installation.');
    for (const agent of agents) {
      for (const slug of [ENGRAM_COMPONENT, ...SKILL_SLUGS]) {
        const key = `${slug}::${agent}`;
        if (!state.skills[key]) { state.skills[key] = 'skipped'; }
      }
    }
    return;
  }

  const skillsCsv = SKILL_SLUGS.join(',');
  const componentsCsv = GENTLE_AI_COMPONENTS.join(',');

  for (const agent of agents) {
    log.banner(`Installing for: ${agent}`);
    log.dim(`  gentle-ai install --agent ${agent} --components ${componentsCsv} --skills ${skillsCsv}`);

    const result = runGentleAiInstall([
      'install',
      '--agent',
      agent,
      '--components',
      componentsCsv,
      '--skills',
      skillsCsv,
    ]);

    const slugs = [ENGRAM_COMPONENT, ...SKILL_SLUGS];
    if (result.ok) {
      log.success(`  installed: engram + ${SKILL_SLUGS.length} skills (${agent})`);
      for (const slug of slugs) { state.skills[`${slug}::${agent}`] = 'installed'; }
    }
    else {
      log.error(`  failed: batched install for ${agent} — ${result.reason}`);
      for (const slug of slugs) { state.skills[`${slug}::${agent}`] = 'failed'; }
    }
  }
}

// ============================================================================
// Step 6.5 — install community skills via bunx skills CLI
// ============================================================================

function describeSkill(item: CommunitySkill): string {
  if (!item.skill || item.skill === '*') {
    return item.package.split('/').slice(-2).join('/');
  }
  return item.skill;
}

async function installCommunitySkills(
  state: InstallState,
  level: 'project' | 'global',
): Promise<void> {
  const list = level === 'project' ? PROJECT_LEVEL_SKILLS : USER_LEVEL_SKILLS;
  const label = level === 'project' ? 'project-level' : 'user-level (global)';

  log.banner(`Community skills — ${label}`);
  log.info(`This will run ${list.length} \`bunx skills add\` commands (${label}).`);

  const proceed = await confirm({
    message: `Install ${label} community skills?`,
    default: true,
  });
  if (!proceed) {
    log.warn(`Skipping ${label} community skills.`);
    for (const item of list) {
      const slug = describeSkill(item);
      const key = `community:${level}:${slug}`;
      if (!state.skills[key]) { state.skills[key] = 'skipped'; }
    }
    return;
  }

  for (const item of list) {
    const slug = describeSkill(item);
    const key = `community:${level}:${slug}`;
    if (state.skills[key] === 'installed') {
      log.dim(`  skipping ${slug} (already installed)`);
      continue;
    }
    const args = ['skills', 'add', item.package];
    if (item.skill && item.skill !== '*') {
      args.push('--skill', item.skill);
    }
    if (level === 'global') { args.push('--global'); }
    args.push('--yes');
    const result = tryRun('bunx', args);
    if (result.ok) {
      log.success(`  installed: ${slug}`);
      state.skills[key] = 'installed';
    }
    else {
      log.error(`  failed: ${slug} — ${(result.stderr || result.stdout).trim().slice(0, 120) || 'unknown error'}`);
      state.skills[key] = 'failed';
    }
  }
}

// ============================================================================
// Step 7 — Wire .env for MCP servers (+ direnv autoload offer)
// ============================================================================
//
// `.mcp.json` and `opencode.jsonc` are committed with `${VAR}` / `{env:VAR}`
// expansion. The installer no longer rewrites those files — it only ensures
// `.env` contains the required values, then optionally enables direnv.

function isSecretName(name: string): boolean {
  return SECRET_NAME_HINTS.some(hint => name.endsWith(hint) || name.endsWith(`_${hint}`));
}

function stripJsoncComments(input: string): string {
  // Strip /* … */ block comments + // line comments. Conservative: only strips
  // line comments that start the (trimmed) line, so URLs containing `//`
  // inside JSON string values survive.
  return input
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/^\s*\/\/.*$/gm, '');
}

async function discoverRequiredEnvVars(agents: AgentId[]): Promise<string[]> {
  const seen = new Set<string>();
  if (agents.includes('claude-code') && existsSync(CLAUDE_MCP_PATH)) {
    const content = await readFile(CLAUDE_MCP_PATH, 'utf8');
    for (const m of content.matchAll(MCP_VAR_PATTERN)) { seen.add(m[1]); }
  }
  if (agents.includes('opencode') && existsSync(OPENCODE_CONFIG_PATH)) {
    const raw = await readFile(OPENCODE_CONFIG_PATH, 'utf8');
    const content = stripJsoncComments(raw);
    for (const m of content.matchAll(OPENCODE_VAR_PATTERN)) { seen.add(m[1]); }
  }
  return [...seen].sort();
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

async function ensureEnvFileExists(): Promise<void> {
  if (existsSync(ENV_PATH)) { return; }
  if (existsSync(ENV_EXAMPLE_PATH)) {
    const tmpl = await readFile(ENV_EXAMPLE_PATH, 'utf8');
    await writeFile(ENV_PATH, tmpl, 'utf8');
    log.success('Created .env from .env.example (values are empty — fill them below).');
    return;
  }
  await writeFile(ENV_PATH, '', 'utf8');
  log.warn('.env.example missing; created empty .env.');
}

async function appendVarsToEnv(vars: Record<string, string>): Promise<void> {
  if (Object.keys(vars).length === 0) { return; }
  const existing = await readFile(ENV_PATH, 'utf8');
  const needsNewline = existing.length > 0 && !existing.endsWith('\n');
  const header = '\n# ===== Added by `bun run setup` =====\n';
  const body = `${Object.entries(vars).map(([k, v]) => `${k}=${v}`).join('\n')}\n`;
  await writeFile(ENV_PATH, `${existing}${needsNewline ? '\n' : ''}${header}${body}`, 'utf8');
}

async function promptForVar(name: string): Promise<string> {
  const ask = isSecretName(name) ? password : input;
  const entered = await ask({
    message: `${name} (Enter to skip — fill later in .env):`,
    ...(isSecretName(name) ? { mask: '*' } : {}),
  } as Parameters<typeof password>[0]);
  return (entered ?? '').trim();
}

async function configureMcps(agents: AgentId[], state: InstallState): Promise<void> {
  if (agents.length === 0) {
    log.info('No agents selected, skipping MCP config.');
    return;
  }

  await ensureEnvFileExists();

  const required = await discoverRequiredEnvVars(agents);
  if (required.length === 0) {
    log.warn('No env-var placeholders found in .mcp.json or opencode.jsonc.');
    state.pendingEnvVars = [];
    return;
  }

  log.info(`Required MCP env vars (from committed configs): ${required.join(', ')}`);

  const envValues = parseEnvFile(await readFile(ENV_PATH, 'utf8'));
  const newValues: Record<string, string> = {};
  const stillPending: string[] = [];

  for (const name of required) {
    const fromEnvFile = envValues[name];
    if (fromEnvFile && fromEnvFile.trim().length > 0) {
      log.dim(`  ${name}: already set in .env`);
      continue;
    }
    const fromProcessEnv = process.env[name];
    if (fromProcessEnv && fromProcessEnv.trim().length > 0) {
      newValues[name] = fromProcessEnv.trim();
      log.dim(`  ${name}: captured from shell environment`);
      continue;
    }
    if (NON_INTERACTIVE) {
      stillPending.push(name);
      continue;
    }
    const value = await promptForVar(name);
    if (value.length === 0) {
      stillPending.push(name);
    }
    else {
      newValues[name] = value;
    }
  }

  if (Object.keys(newValues).length > 0) {
    await appendVarsToEnv(newValues);
    log.success(`Wrote ${Object.keys(newValues).length} var(s) to .env: ${Object.keys(newValues).join(', ')}`);
  }
  if (stillPending.length > 0) {
    log.warn(`Pending (fill in .env manually): ${stillPending.join(', ')}`);
  }

  state.pendingEnvVars = stillPending;

  // Per-server status — placeholder if any of its required vars are still pending.
  const merged = { ...envValues, ...newValues };
  for (const [server, secrets] of Object.entries(MCP_SERVER_SECRETS)) {
    if (secrets.length === 0) {
      state.mcps[server] = 'configured-no-key';
    }
    else {
      const anyMissing = secrets.some(s => !merged[s] || merged[s].trim().length === 0);
      state.mcps[server] = anyMissing ? 'placeholder' : 'configured-with-key';
    }
  }
}

// ----------------------------------------------------------------------------
// direnv autoload sub-step (still part of Step 7)
// ----------------------------------------------------------------------------

interface DirenvInfo {
  installed: boolean
  version?: string
  supportsDotenvIfExists: boolean
  supportsPwshHook: boolean
  platform: NodeJS.Platform
}

function detectDirenv(): DirenvInfo {
  const platform = process.platform;
  const result = tryRun('direnv', ['version']);
  if (!result.ok) {
    return { installed: false, supportsDotenvIfExists: false, supportsPwshHook: false, platform };
  }
  const version = result.stdout.trim();
  const parts = version.split('.').map(n => Number.parseInt(n, 10));
  const maj = parts[0] ?? 0;
  const min = parts[1] ?? 0;
  const supportsDotenvIfExists = maj > 2 || (maj === 2 && min >= 30);
  const supportsPwshHook = maj > 2 || (maj === 2 && min >= 37);
  return { installed: true, version, supportsDotenvIfExists, supportsPwshHook, platform };
}

function installHintForPlatform(): string {
  if (process.platform === 'win32') {
    return 'winget install direnv  (then restart Git Bash or PowerShell)';
  }
  if (process.platform === 'darwin') {
    return 'brew install direnv';
  }
  return 'sudo apt install direnv  (or: dnf install direnv  /  pacman -S direnv)';
}

// OS-aware recommendation surfaced in the closing summary. Used to point users
// at the right package manager for installing the EXTERNAL_CLIS we DON'T
// auto-install (Rule 4 — OS-dependent installs are deferred to upstream docs).
function recommendedPackageManager(): { label: string, url: string, install: string } {
  if (process.platform === 'win32') {
    return {
      label: 'Scoop',
      url: 'https://scoop.sh',
      install: 'iwr -useb get.scoop.sh | iex   # PowerShell, one-time',
    };
  }
  // macOS + Linux → Homebrew is cross-platform.
  return {
    label: 'Homebrew',
    url: 'https://brew.sh',
    install: '/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"',
  };
}

function shellHookHint(info: DirenvInfo): string {
  const shell = (process.env.SHELL ?? '').toLowerCase();
  if (process.platform === 'win32' && shell.length === 0) {
    if (info.supportsPwshHook) {
      return 'Invoke-Expression "$(direnv hook pwsh)"  →  add to $PROFILE  (PowerShell)';
    }
    return 'eval "$(direnv hook bash)"  →  add to ~/.bashrc  (Git Bash; PowerShell needs direnv 2.37+)';
  }
  if (shell.endsWith('zsh')) {
    return 'eval "$(direnv hook zsh)"  →  add to ~/.zshrc';
  }
  if (shell.endsWith('fish')) {
    return 'direnv hook fish | source  →  add to ~/.config/fish/config.fish';
  }
  if (shell.endsWith('bash')) {
    return 'eval "$(direnv hook bash)"  →  add to ~/.bashrc';
  }
  return 'eval "$(direnv hook <your-shell>)"  →  see https://direnv.net/docs/hook.html';
}

async function offerDirenvAutoload(): Promise<void> {
  if (SKIP_DIRENV) {
    log.dim('  INSTALL_SKIP_DIRENV=1, skipping direnv setup.');
    return;
  }
  const info = detectDirenv();

  if (!info.installed) {
    log.info('direnv not installed (optional).');
    log.dim('  Launch agents with: bun run claude  /  bun run opencode  (dotenv-cli loads .env automatically).');
    log.dim(`  Or install direnv for shell autoload: ${installHintForPlatform()}`);
    return;
  }
  log.info(`direnv ${info.version} detected.`);
  if (info.platform === 'win32') {
    log.dim('  Tip: direnv on Windows works best in Git Bash. PowerShell support is experimental and requires direnv 2.37+.');
  }

  const proceed = await maybeConfirm(
    'Run `direnv allow` so the repo\'s .envrc auto-loads .env into your shell?',
    true,
  );
  if (!proceed) {
    log.dim('  Skipped. Launch agents with: bun run claude  /  bun run opencode.');
    return;
  }
  const result = tryRun('direnv', ['allow', REPO_ROOT]);
  if (result.ok) {
    log.success('direnv allow succeeded — .envrc will auto-load .env on cd.');
    log.dim(`  Reminder: add this to your shell rc if not already done: ${shellHookHint(info)}`);
  }
  else {
    log.warn('direnv allow failed. Launch agents with: bun run claude  /  bun run opencode.');
    log.dim(`  ${(result.stderr || result.stdout).trim().slice(0, 200)}`);
  }
}

// ============================================================================
// Step 8 — verify external CLIs
// ============================================================================

interface CliResult {
  name: string
  status: CliStatus
  install?: string
  docs: string
  purpose: string
}

function verifyExternalClis(state: InstallState): CliResult[] {
  const results: CliResult[] = EXTERNAL_CLIS.map((cli) => {
    const found = which(cli.name) !== null;
    const status: CliStatus = found ? 'found' : 'missing';
    state.externalClis[cli.name] = status;
    return { name: cli.name, status, install: cli.install, docs: cli.docs, purpose: cli.purpose };
  });

  process.stdout.write('\n');
  process.stdout.write(`${COLORS.bold}CLI              Status      Purpose${COLORS.reset}\n`);
  process.stdout.write(`${'─'.repeat(80)}\n`);
  for (const r of results) {
    const padName = r.name.padEnd(16);
    const padStatus = r.status === 'found' ? 'found     ' : 'missing   ';
    const statusColor = r.status === 'found' ? COLORS.green : COLORS.yellow;
    process.stdout.write(`${padName} ${statusColor}${padStatus}${COLORS.reset} ${r.purpose}\n`);
    if (r.status === 'missing') {
      if (r.install) {
        process.stdout.write(`${' '.repeat(28)}${COLORS.dim}quick: ${r.install}${COLORS.reset}\n`);
      }
      process.stdout.write(`${' '.repeat(28)}${COLORS.dim}docs:  ${r.docs}${COLORS.reset}\n`);
    }
  }
  return results;
}

// ============================================================================
// Step 9 — persist state
// ============================================================================

async function loadPriorState(): Promise<InstallState | null> {
  if (!existsSync(STATE_PATH)) { return null; }
  try {
    const raw = await readFile(STATE_PATH, 'utf8');
    return JSON.parse(raw) as InstallState;
  }
  catch {
    log.warn(`Could not parse ${STATE_PATH}, starting fresh.`);
    return null;
  }
}

async function writeInstallState(state: InstallState): Promise<void> {
  await mkdir(dirname(STATE_PATH), { recursive: true });
  await writeFile(STATE_PATH, `${JSON.stringify(state, null, 2)}\n`, 'utf8');
  log.success(`Wrote ${STATE_PATH}`);
}

function buildInitialState(prior: InstallState | null): InstallState {
  if (prior && prior.version === 1) { return prior; }
  return {
    version: 1,
    installedAt: new Date().toISOString(),
    agents: [],
    gentleAi: { status: 'missing', checkedAt: new Date().toISOString() },
    skills: {},
    mcps: {},
    externalClis: {},
    pendingEnvVars: [],
  };
}

// ============================================================================
// Step 10 — GitHub remote (optional)
// ============================================================================

interface GhStatus {
  found: boolean
  version?: string
  authenticated: boolean
}

function detectGh(): GhStatus {
  const path = which('gh');
  if (!path) { return { found: false, authenticated: false }; }

  const versionRes = tryRun('gh', ['--version']);
  const versionMatch = versionRes.stdout.match(/gh version (\d+\.\d+\.\d+)/);
  const version = versionMatch ? versionMatch[1] : undefined;

  const authRes = tryRun('gh', ['auth', 'status']);
  const authenticated = authRes.ok;

  return { found: true, version, authenticated };
}

function ghApi(args: string[]): { ok: boolean, stdout: string } {
  const res = tryRun('gh', ['api', ...args]);
  return { ok: res.ok, stdout: res.stdout.trim() };
}

function sanitizeRepoName(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9._-]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 100);
}

async function setupGithubRemote(state: InstallState): Promise<void> {
  if (NON_INTERACTIVE) {
    log.dim('Non-interactive mode — skipping GitHub remote creation.');
    return;
  }

  // Idempotency: if a prior run already created a repo and the local `origin`
  // points at the same URL, skip silently. Re-running `gh repo create` for the
  // same name would fail with `name already exists`.
  if (state.github) {
    const originUrl = tryRun('git', ['remote', 'get-url', 'origin']);
    if (originUrl.ok && originUrl.stdout.trim().includes(`${state.github.account}/${state.github.repo}`)) {
      log.dim(`GitHub remote already configured: ${state.github.url} — skipping.`);
      return;
    }
  }

  const gh = detectGh();
  if (!gh.found) {
    log.warn('gh CLI not found. Skipping GitHub repository creation.');
    log.dim('  Install: https://github.com/cli/cli#installation  (then run `gh auth login`).');
    log.dim('  To wire a remote later:  gh repo create --source=. --remote=origin --push');
    return;
  }
  if (!gh.authenticated) {
    log.warn(`gh ${gh.version ?? ''} detected but not authenticated.`);
    log.dim('  Run `gh auth login`, then re-run: bun run setup');
    return;
  }
  log.success(`gh ${gh.version ?? ''} detected (authenticated).`);

  const wantRepo = await confirm({
    message: 'Create a GitHub repository for this project now?',
    default: true,
  });
  if (!wantRepo) {
    log.dim('Skipped. To wire later:  gh repo create --source=. --remote=origin --push');
    return;
  }

  // Resolve current package name as default repo name.
  const pkgPath = join(REPO_ROOT, 'package.json');
  let defaultRepoName = 'my-app';
  try {
    const pkg = JSON.parse(await readFile(pkgPath, 'utf8')) as { name?: string };
    if (pkg.name) { defaultRepoName = sanitizeRepoName(pkg.name); }
  }
  catch { /* fall through with default */ }

  // Resolve account choices: personal login + memberships.
  const userRes = ghApi(['user', '--jq', '.login']);
  if (!userRes.ok || !userRes.stdout) {
    log.error('Could not resolve GitHub user via `gh api user`. Skipping.');
    return;
  }
  const userLogin = userRes.stdout;

  const orgsRes = ghApi(['user/orgs', '--jq', '.[].login']);
  const orgs = orgsRes.ok && orgsRes.stdout.length > 0 ? orgsRes.stdout.split('\n').filter(Boolean) : [];

  const accountChoices: { name: string, value: string }[] = [
    { name: `${userLogin} (personal)`, value: userLogin },
    ...orgs.map(o => ({ name: `${o} (organization)`, value: o })),
  ];

  const account = await select({
    message: 'Where should the repository live?',
    choices: accountChoices,
    default: userLogin,
  });

  const visibility = await select<'private' | 'public' | 'internal'>({
    message: 'Repository visibility?',
    choices: [
      { name: 'private (default)', value: 'private' },
      { name: 'public', value: 'public' },
      { name: 'internal (org only)', value: 'internal' },
    ],
    default: 'private',
  });

  const rawName = await input({
    message: 'Repository name:',
    default: defaultRepoName,
  });
  const repoName = sanitizeRepoName(rawName);
  if (!repoName) {
    log.error('Invalid repository name. Skipping.');
    return;
  }

  log.info(`Creating ${account}/${repoName} (${visibility})…`);
  const createRes = spawnSync('gh', [
    'repo',
    'create',
    `${account}/${repoName}`,
    `--${visibility}`,
    '--source=.',
    '--remote=origin',
    '--push',
  ], { stdio: ['ignore', 'pipe', 'pipe'], encoding: 'utf8' });

  if (createRes.status !== 0) {
    log.error(`gh repo create failed (exit ${createRes.status}).`);
    if (createRes.stderr) { log.dim(`  ${createRes.stderr.trim()}`); }
    log.dim('  Repo not created. Local files left intact. You can retry later.');
    return;
  }

  const url = `https://github.com/${account}/${repoName}`;
  state.github = {
    account,
    repo: repoName,
    visibility,
    url,
    createdAt: new Date().toISOString(),
  };
  log.success(`Repository created and pushed: ${url}`);
}

// ============================================================================
// Step 11 — closing summary
// ============================================================================

function printClosingSummary(state: InstallState): void {
  const allSkillEntries = Object.entries(state.skills);
  const gentleSkills = allSkillEntries.filter(([k]) => !k.startsWith('community:'));
  const projectCommunity = allSkillEntries.filter(([k]) => k.startsWith('community:project:'));
  const userCommunity = allSkillEntries.filter(([k]) => k.startsWith('community:global:'));

  const gentleInstalled = gentleSkills.filter(([, s]) => s === 'installed').length;
  const projectInstalled = projectCommunity.filter(([, s]) => s === 'installed').length;
  const userInstalled = userCommunity.filter(([, s]) => s === 'installed').length;

  const mcpConfigured = Object.values(state.mcps).filter(
    s => s === 'configured-with-key' || s === 'configured-no-key' || s === 'placeholder',
  ).length;
  const mcpTotal = CANONICAL_MCPS.length;

  const cliFound = Object.values(state.externalClis).filter(s => s === 'found').length;
  const cliTotal = Object.keys(state.externalClis).length;
  const cliMissing = Object.entries(state.externalClis)
    .filter(([, s]) => s === 'missing')
    .map(([name]) => name);

  log.banner('Installer complete.');
  process.stdout.write(`gentle-ai skills    : ${gentleInstalled}/${gentleSkills.length}\n`);
  process.stdout.write(`Project skills (npx): ${projectInstalled}/${projectCommunity.length}\n`);
  process.stdout.write(`User skills   (npx): ${userInstalled}/${userCommunity.length}\n`);
  process.stdout.write(`MCPs configured     : ${mcpConfigured}/${mcpTotal} (${CANONICAL_MCPS.join(', ')})\n`);
  process.stdout.write(`External CLIs       : ${cliFound}/${cliTotal} found`);
  if (cliMissing.length > 0) { process.stdout.write(` (missing: ${cliMissing.join(', ')})`); }
  process.stdout.write('\n');
  if (state.pendingEnvVars.length > 0) {
    process.stdout.write(`Pending env vars    : ${state.pendingEnvVars.join(', ')}\n`);
  }
  else {
    process.stdout.write('Pending env vars    : (none)\n');
  }

  process.stdout.write('\n');
  process.stdout.write(`${COLORS.bold}Next steps:${COLORS.reset}\n`);
  let n = 1;
  if (state.pendingEnvVars.length > 0) {
    process.stdout.write(`  ${n}. Fill remaining vars in .env: ${state.pendingEnvVars.join(', ')}\n`);
    n++;
  }
  process.stdout.write(`  ${n}. Launch your agent (preferred — short + native):\n`);
  process.stdout.write('       claude               # Claude Code\n');
  process.stdout.write('       opencode             # OpenCode\n');
  log.dim('       (requires direnv allow OR a shell that sources .env — e.g. `set -a; . .env; set +a`)');
  process.stdout.write('     Fallback (works everywhere, no direnv needed):\n');
  process.stdout.write('       bun run claude       # dotenv-cli wraps and loads .env\n');
  process.stdout.write('       bun run opencode     # dotenv-cli wraps and loads .env\n');
  n++;
  process.stdout.write(`  ${n}. Install missing CLIs (see table above — use your OS package manager)\n`);
  n++;
  process.stdout.write(`  ${n}. Run: bun run lint:agents (validate config)\n`);
  n++;
  process.stdout.write(`  ${n}. In your agent: /sync-ai-memory (load initial context)\n`);
  n++;
  process.stdout.write(`  ${n}. In your agent: /project-foundation, then /project-bootstrap (define + scaffold)\n`);
  n++;
  process.stdout.write(`  ${n}. After foundation+bootstrap, run: npx autoskills (auto-detect concrete stack and add matching community skills)\n`);
  process.stdout.write('\n');

  // GitHub repository block — only if step 10 created a remote
  if (state.github) {
    process.stdout.write(`${COLORS.bold}GitHub repository:${COLORS.reset}\n`);
    process.stdout.write(`  URL        : ${state.github.url}\n`);
    process.stdout.write(`  Visibility : ${state.github.visibility}\n`);
    process.stdout.write('  Remote     : origin (pushed)\n');
    process.stdout.write('\n');
    process.stdout.write(`${COLORS.bold}GitHub follow-ups (manual):${COLORS.reset}\n`);
    process.stdout.write('  • Add Actions secrets at:\n');
    process.stdout.write(`      ${state.github.url}/settings/secrets/actions\n`);
    process.stdout.write('    Recommended secrets (only those you actually use):\n');
    process.stdout.write('      - TAVILY_API_KEY         (Tavily MCP)\n');
    process.stdout.write('      - JIRA_API_TOKEN         (Atlassian MCP / acli)\n');
    process.stdout.write('      - JIRA_URL, JIRA_USERNAME\n');
    process.stdout.write('      - SUPABASE_ACCESS_TOKEN  (Supabase MCP)\n');
    process.stdout.write('      - N8N_API_KEY, N8N_API_URL\n');
    process.stdout.write(`  • Move repository to an org later:  gh repo transfer ${state.github.account}/${state.github.repo} <org>\n`);
    process.stdout.write('\n');
  }
  else {
    process.stdout.write(`${COLORS.bold}GitHub repository:${COLORS.reset}\n`);
    process.stdout.write('  Not created during install. To wire later:\n');
    process.stdout.write('      gh auth login   # if not authenticated\n');
    process.stdout.write('      gh repo create --source=. --remote=origin --push\n');
    process.stdout.write('\n');
  }

  process.stdout.write(`${COLORS.bold}Project metadata follow-ups:${COLORS.reset}\n`);
  process.stdout.write('  • Jira project key — edit `.agents/project.yaml` → `project.project_key`\n');
  process.stdout.write('       (leave the placeholder until you have a real workspace + project)\n');
  process.stdout.write('       After setting, run:  bun run jira:sync-fields && bun run jira:check\n');
  process.stdout.write('\n');

  process.stdout.write(`${COLORS.bold}Warp terminal users — recommended notification plugins:${COLORS.reset}\n`);
  process.stdout.write(`  ${COLORS.dim}Warp + CLI agents is the community's current favorite combo. Surface agent activity${COLORS.reset}\n`);
  process.stdout.write(`  ${COLORS.dim}as native Warp notifications by installing the matching plugin:${COLORS.reset}\n`);
  process.stdout.write('\n');
  process.stdout.write('  • Claude Code (manual install — see docs):\n');
  process.stdout.write('      /plugin marketplace add warpdotdev/claude-code-warp\n');
  process.stdout.write('      /plugin install warp@claude-code-warp\n');
  process.stdout.write(`      ${COLORS.dim}Docs: https://docs.warp.dev/agent-platform/cli-agents/claude-code/${COLORS.reset}\n`);
  process.stdout.write(`      ${COLORS.dim}(Or click the auto-install chip that appears when Claude Code runs in Warp.)${COLORS.reset}\n`);
  process.stdout.write('\n');
  process.stdout.write('  • OpenCode: already wired in opencode.jsonc via the "plugin" field.\n');
  process.stdout.write(`      ${COLORS.dim}Docs: https://docs.warp.dev/agent-platform/cli-agents/opencode/${COLORS.reset}\n`);
  process.stdout.write('\n');

  // OS-aware package-manager recommendation. We never auto-install external
  // CLIs (Rule 4), so point the user at the canonical pkg manager for their OS.
  const pm = recommendedPackageManager();
  process.stdout.write(`${COLORS.bold}Recommended package manager (for installing the external CLIs above):${COLORS.reset}\n`);
  process.stdout.write(`  ${pm.label}  →  ${pm.url}\n`);
  process.stdout.write(`  ${COLORS.dim}Install ${pm.label}:  ${pm.install}${COLORS.reset}\n`);
  process.stdout.write(`  ${COLORS.dim}Then install any missing CLI from the table above using ${pm.label}.${COLORS.reset}\n`);
  process.stdout.write('\n');

  log.dim('Full docs: INSTALLER.md');
}

// ============================================================================
// Main
// ============================================================================

async function main(): Promise<void> {
  log.banner('agentic-dev-boilerplate — installer');
  log.dim('See .plans/FASE-15-DESIGN.md for the spec this implements.');
  if (AUTO_NON_INTERACTIVE) {
    log.warn('No TTY detected — running in --non-interactive mode (prompts will use defaults).');
    log.dim('  AI agents: parse pending vars from the closing summary, or run `bun run setup:doctor --json`.');
  }

  // Step 1
  log.step(1, 11, 'Verifying repo root');
  await verifyRepoRoot();

  // Step 2
  log.step(2, 11, 'Detecting gentle-ai');
  const gentleAi = detectGentleAi();
  if (gentleAi.found && gentleAi.version) {
    if (gentleAi.compatible) {
      log.success(`gentle-ai ${gentleAi.version} detected (>= ${MIN_GENTLE_AI_VERSION.join('.')}).`);
    }
    else {
      log.warn(`gentle-ai ${gentleAi.version} is older than required ${MIN_GENTLE_AI_VERSION.join('.')}. Upgrade with: gentle-ai update`);
    }
  }
  else {
    log.info('gentle-ai not found.');
  }

  const prior = await loadPriorState();
  const state = buildInitialState(prior);
  state.installedAt = new Date().toISOString();
  state.gentleAi = {
    status: gentleAi.status,
    version: gentleAi.version,
    checkedAt: new Date().toISOString(),
  };

  // Step 3
  log.step(3, 11, 'gentle-ai install / skip decision');
  let runSkillInstall = false;
  if (gentleAi.status === 'installed') {
    runSkillInstall = true;
  }
  else if (gentleAi.status === 'incompatible') {
    const cont = await confirm({
      message: 'gentle-ai is installed but version is older than required. Try anyway?',
      default: false,
    });
    runSkillInstall = cont;
  }
  else {
    const decision = await handleMissingGentleAi();
    if (decision === 'show-and-exit') {
      await writeInstallState(state);
      process.exit(0);
    }
    state.gentleAi.status = 'skipped';
    runSkillInstall = false;
  }

  // Step 4
  log.step(4, 11, 'Detecting agents');
  const detected = await detectAgents();
  log.info(
    `Claude Code: ${detected.claudeCode ? 'found' : 'not found'} | OpenCode: ${detected.opencode ? 'found' : 'not found'}`,
  );
  const agents = await promptAgentSelection(detected);
  state.agents = agents;
  if (agents.length === 0) {
    log.warn('No agents selected, exiting.');
    log.dim('Re-run when ready: bun run setup');
    await writeInstallState(state);
    process.exit(0);
  }

  // Step 5
  if (runSkillInstall) {
    log.step(5, 11, 'Installing gentle-ai skills (engram + SDD + foundation)');
    await installSkillsViaGentleAi(agents, state);
  }
  else {
    log.step(5, 11, 'Skipping gentle-ai skill install (no compatible gentle-ai)');
    for (const slug of [ENGRAM_COMPONENT, ...SKILL_SLUGS]) {
      for (const agent of agents) {
        const key = `${slug}::${agent}`;
        if (!state.skills[key]) { state.skills[key] = 'skipped'; }
      }
    }
  }

  // Step 6 — community skills via bunx skills CLI (independent of gentle-ai)
  log.step(6, 11, 'Installing community skills via bunx skills CLI');
  await installCommunitySkills(state, 'project');
  await installCommunitySkills(state, 'global');

  // Step 7
  log.step(7, 11, 'Wiring .env for MCP servers');
  await configureMcps(agents, state);
  await offerDirenvAutoload();

  // Step 8
  log.step(8, 11, 'Verifying external CLIs');
  verifyExternalClis(state);

  // Step 9 — optional GitHub repo creation
  log.step(9, 11, 'GitHub repository (optional)');
  await setupGithubRemote(state);

  // Step 10
  log.step(10, 11, 'Persisting state');
  await writeInstallState(state);

  // Step 11 (closing summary)
  log.step(11, 11, 'Closing summary');
  printClosingSummary(state);
}

main().catch((err) => {
  if (err && typeof err === 'object' && 'name' in err && (err as { name: string }).name === 'ExitPromptError') {
    log.warn('Aborted by user.');
    log.dim('Re-run anytime with: bun run setup');
    process.exit(130);
  }
  log.error(`Fatal: ${(err as Error).message ?? String(err)}`);
  if (err instanceof Error && err.stack) { log.dim(err.stack); }
  log.dim('After fixing the issue above, re-run: bun run setup  (installer is idempotent — completed steps are skipped)');
  process.exit(1);
});
