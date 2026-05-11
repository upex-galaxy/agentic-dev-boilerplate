#!/usr/bin/env bun
/**
 * Project installer for ai-driven-project-starter.
 *
 * Drives the end-to-end setup flow defined in `.plans/FASE-15-DESIGN.md`:
 *   1. Detect gentle-ai (presence + version)
 *   2. Detect agents (Claude Code / OpenCode) and prompt selection
 *   3. Optionally install 15 skills + engram via gentle-ai
 *   4. Configure 4 canonical MCPs (tavily, context7, supabase, n8n)
 *   5. Verify external CLIs (vercel, supabase, acli, playwright, resend)
 *   6. Persist `.agents/install-state.json` for idempotency
 *
 * Usage:
 *   bun run setup
 */

import { execFileSync, spawnSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { mkdir, readFile, stat, writeFile } from 'node:fs/promises';
import { homedir } from 'node:os';
import { dirname, join, resolve } from 'node:path';

import { checkbox, confirm, password } from '@inquirer/prompts';

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
}

interface ClaudeMcpEntry {
  command?: string
  args?: string[]
  env?: Record<string, string>
  type?: string
  url?: string
  headers?: Record<string, string>
}

interface ClaudeMcpFile {
  mcpServers: Record<string, ClaudeMcpEntry>
}

interface OpencodeMcpEntry {
  type: 'local' | 'remote'
  command?: string[]
  url?: string
  oauth?: boolean
  headers?: Record<string, string>
  environment?: Record<string, string>
  enabled: boolean
}

interface OpencodeMcpFile {
  $schema?: string
  mcp: Record<string, OpencodeMcpEntry>
}

// ============================================================================
// Constants
// ============================================================================

const REPO_ROOT = resolve(import.meta.dir, '..');
const STATE_PATH = join(REPO_ROOT, '.agents', 'install-state.json');
const CLAUDE_TEMPLATE_PATH = join(REPO_ROOT, 'templates', 'mcp', 'claude.template.json');
const OPENCODE_TEMPLATE_PATH = join(REPO_ROOT, 'templates', 'mcp', 'opencode.template.json');
const CLAUDE_MCP_OUTPUT = join(REPO_ROOT, '.mcp.json');
const OPENCODE_MCP_OUTPUT = join(REPO_ROOT, 'opencode.json');

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

const CANONICAL_MCPS = ['tavily', 'context7', 'supabase', 'n8n'] as const;

interface CommunitySkill {
  package: string
  skill?: string  // omit or '*' to install all skills from the package
}

// Community skills installed at PROJECT level (`npx skills add`).
// Stack-aware defaults — tuned for Next.js + React + Tailwind + shadcn + Supabase + Vercel.
// Users can run `npx autoskills` later to refine for their concrete stack.
const PROJECT_LEVEL_SKILLS: ReadonlyArray<CommunitySkill> = [
  { package: 'https://github.com/anthropics/skills', skill: 'frontend-design' },
  { package: 'https://github.com/vercel-labs/agent-skills', skill: 'react-best-practices' },
  { package: 'https://github.com/vercel-labs/agent-skills', skill: 'composition-patterns' },
  { package: 'https://github.com/vercel-labs/agent-skills', skill: 'deploy-to-vercel' },
  { package: 'https://github.com/vercel-labs/next-skills', skill: 'next-best-practices' },
  { package: 'https://github.com/vercel-labs/next-skills', skill: 'next-cache-components' },
  { package: 'https://github.com/vercel-labs/next-skills', skill: 'next-upgrade' },
  { package: 'https://github.com/pproenca/dot-skills', skill: 'react-hook-form' },
  { package: 'https://github.com/pproenca/dot-skills', skill: 'zod' },
  { package: 'https://github.com/shadcn/ui', skill: 'shadcn' },
  { package: 'https://github.com/supabase/agent-skills', skill: 'supabase-postgres-best-practices' },
  { package: 'https://github.com/midudev/autoskills', skill: 'bun' },
  { package: 'https://github.com/giuseppe-trisciuoglio/developer-kit', skill: 'tailwind-css-patterns' },
  { package: 'https://github.com/wshobson/agents', skill: 'typescript-advanced-types' },
  { package: 'https://github.com/addyosmani/web-quality-skills', skill: 'accessibility' },
  { package: 'https://github.com/addyosmani/web-quality-skills', skill: 'seo' },
];

// Community skills installed at USER (global) level — useful across most projects.
const USER_LEVEL_SKILLS: ReadonlyArray<CommunitySkill> = [
  { package: 'https://github.com/anthropics/skills', skill: 'skill-creator' },
  { package: 'https://github.com/vercel-labs/skills', skill: 'find-skills' },
  { package: 'https://github.com/github/awesome-copilot', skill: 'gh-cli' },
  { package: 'https://github.com/xixu-me/skills', skill: 'github-actions-docs' },
  { package: 'https://github.com/microsoft/playwright-cli', skill: 'playwright-cli' },
  { package: 'czlonkowski/n8n-skills' },  // whole repo (n8n MCP toolkit)
  { package: 'https://github.com/emilkowalski/skill', skill: 'emil-design-eng' },
  { package: 'https://github.com/nextlevelbuilder/ui-ux-pro-max-skill', skill: 'ui-ux-pro-max' },
  { package: 'https://github.com/obra/superpowers', skill: 'brainstorming' },
];

const EXTERNAL_CLIS: ReadonlyArray<{ name: string, install: string }> = [
  { name: 'vercel', install: 'npm i -g vercel' },
  { name: 'supabase', install: 'brew install supabase/tap/supabase  (or: npm i -g supabase)' },
  { name: 'acli', install: 'brew install --cask atlassian-cli' },
  { name: 'playwright', install: 'npm i -D @playwright/test' },
  { name: 'resend', install: 'npm i -g resend' },
];

// TODO: B3 confirms exact npx package name + invocation flags for n8n MCP.
const N8N_NPX_PACKAGE = '@n8n/mcp-server';
const N8N_API_KEY_VAR = 'N8N_API_KEY';

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
    process.exit(1);
  }
  const raw = await readFile(pkgPath, 'utf8');
  const pkg = JSON.parse(raw) as { name?: string };
  if (pkg.name !== 'ai-driven-project-starter') {
    const proceed = await confirm({
      message: `package.json name is "${pkg.name ?? '(unknown)'}". Continue anyway?`,
      default: false,
    });
    if (!proceed) { process.exit(0); }
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
    log.banner('Install gentle-ai with one of these commands:');
    process.stdout.write('  macOS  : brew install gentle-ai\n');
    process.stdout.write('  Linux  : go install github.com/Gentleman-Programming/gentle-ai/cmd/gentle-ai@latest\n\n');
    log.dim('After installing, re-run: bun run setup');
    return 'show-and-exit';
  }

  log.warn('Continuing without gentle-ai. Skills + engram will NOT be installed.');
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

function runGentleAiInstall(args: string[]): { ok: boolean, reason?: string } {
  // Try with --yes first; fall back without it if gentle-ai rejects the flag.
  // TODO: validate --yes flag in smoke test (Phase B / Fase D).
  const withYes = tryRun('gentle-ai', [...args, '--yes']);
  if (withYes.ok) { return { ok: true }; }

  const stderrLower = withYes.stderr.toLowerCase();
  const flagUnknown
    = stderrLower.includes('unknown flag')
      || stderrLower.includes('unknown option')
      || stderrLower.includes('invalid flag');

  if (flagUnknown) {
    const retry = tryRun('gentle-ai', args);
    if (retry.ok) { return { ok: true }; }
    return { ok: false, reason: retry.stderr.trim() || retry.stdout.trim() || 'unknown error' };
  }

  return { ok: false, reason: withYes.stderr.trim() || withYes.stdout.trim() || 'unknown error' };
}

async function installSkillsViaGentleAi(
  agents: AgentId[],
  state: InstallState,
): Promise<void> {
  if (agents.length === 0) {
    log.info('No agents selected, skipping skill install.');
    return;
  }

  const totalCalls = agents.length * (1 + SKILL_SLUGS.length);
  log.info(`This will run ${totalCalls} gentle-ai install commands (${1 + SKILL_SLUGS.length} per agent × ${agents.length}).`);

  const proceed = await confirm({ message: 'Continue with skill installation?', default: true });
  if (!proceed) {
    log.warn('Skipping skill installation.');
    for (const slug of [ENGRAM_COMPONENT, ...SKILL_SLUGS]) {
      if (!state.skills[slug]) { state.skills[slug] = 'skipped'; }
    }
    return;
  }

  for (const agent of agents) {
    log.banner(`Installing skills for: ${agent}`);

    const engramKey = `${ENGRAM_COMPONENT}::${agent}`;
    if (state.skills[engramKey] === 'installed') {
      log.dim(`  skipping ${ENGRAM_COMPONENT} (already installed for ${agent})`);
    }
    else {
      const result = runGentleAiInstall(['install', '--component', ENGRAM_COMPONENT, '--agent', agent]);
      if (result.ok) {
        log.success(`  installed: engram (${agent})`);
        state.skills[engramKey] = 'installed';
      }
      else {
        log.error(`  failed: engram (${agent}) — ${result.reason}`);
        state.skills[engramKey] = 'failed';
      }
    }

    for (const slug of SKILL_SLUGS) {
      const key = `${slug}::${agent}`;
      if (state.skills[key] === 'installed') {
        log.dim(`  skipping ${slug} (already installed for ${agent})`);
        continue;
      }
      const result = runGentleAiInstall(['install', '--skill', slug, '--agent', agent]);
      if (result.ok) {
        log.success(`  installed: ${slug} (${agent})`);
        state.skills[key] = 'installed';
      }
      else {
        log.error(`  failed: ${slug} (${agent}) — ${result.reason}`);
        state.skills[key] = 'failed';
      }
    }
  }
}

// ============================================================================
// Step 6.5 — install community skills via npx skills CLI
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
  log.info(`This will run ${list.length} \`npx skills add\` commands (${label}).`);

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
    const result = tryRun('npx', args);
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
// Step 7 — MCP configuration
// ============================================================================

async function resolveSecret(varName: string): Promise<{ value: string, source: 'env' | 'prompt' | 'placeholder' }> {
  const fromEnv = process.env[varName];
  if (fromEnv && fromEnv.trim().length > 0) {
    log.dim(`  using ${varName} from environment`);
    return { value: fromEnv.trim(), source: 'env' };
  }
  const entered = await password({
    message: `${varName} (Enter to keep placeholder):`,
    mask: '*',
  });
  const trimmed = entered.trim();
  if (trimmed.length === 0) {
    return { value: `{{${varName}}}`, source: 'placeholder' };
  }
  return { value: trimmed, source: 'prompt' };
}

function buildN8nClaudeEntry(): ClaudeMcpEntry {
  return {
    command: 'npx',
    args: ['-y', N8N_NPX_PACKAGE],
    env: {
      [N8N_API_KEY_VAR]: `{{${N8N_API_KEY_VAR}}}`,
    },
  };
}

function buildN8nOpencodeEntry(): OpencodeMcpEntry {
  return {
    type: 'local',
    command: ['npx', '-y', N8N_NPX_PACKAGE],
    environment: {
      [N8N_API_KEY_VAR]: `{{${N8N_API_KEY_VAR}}}`,
    },
    enabled: true,
  };
}

function replacePlaceholders(input: unknown, replacements: Record<string, string>): unknown {
  if (typeof input === 'string') {
    let out = input;
    for (const [key, value] of Object.entries(replacements)) {
      out = out.split(`{{${key}}}`).join(value);
    }
    return out;
  }
  if (Array.isArray(input)) { return input.map(item => replacePlaceholders(item, replacements)); }
  if (input && typeof input === 'object') {
    const obj = input as Record<string, unknown>;
    const result: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(obj)) { result[k] = replacePlaceholders(v, replacements); }
    return result;
  }
  return input;
}

async function configureMcpForClaude(
  state: InstallState,
  pendingEnvVars: Set<string>,
): Promise<void> {
  log.banner('Configuring MCPs for Claude Code (.mcp.json)');

  const tavily = await resolveSecret('TAVILY_API_KEY');
  if (tavily.source === 'placeholder') { pendingEnvVars.add('TAVILY_API_KEY'); }

  const supabase = await resolveSecret('SUPABASE_ACCESS_TOKEN');
  if (supabase.source === 'placeholder') { pendingEnvVars.add('SUPABASE_ACCESS_TOKEN'); }

  const n8nKey = await resolveSecret(N8N_API_KEY_VAR);
  if (n8nKey.source === 'placeholder') { pendingEnvVars.add(N8N_API_KEY_VAR); }

  const templateRaw = await readFile(CLAUDE_TEMPLATE_PATH, 'utf8');
  const template = JSON.parse(templateRaw) as ClaudeMcpFile;

  const filtered: Record<string, ClaudeMcpEntry> = {};
  for (const name of CANONICAL_MCPS) {
    if (name === 'n8n') {
      filtered[name] = buildN8nClaudeEntry();
    }
    else if (template.mcpServers[name]) {
      filtered[name] = template.mcpServers[name];
    }
  }

  const replaced = replacePlaceholders(
    { mcpServers: filtered },
    {
      TAVILY_API_KEY: tavily.value,
      SUPABASE_ACCESS_TOKEN: supabase.value,
      [N8N_API_KEY_VAR]: n8nKey.value,
    },
  );

  await writeMcpFile(CLAUDE_MCP_OUTPUT, replaced);
  log.success(`Wrote ${CLAUDE_MCP_OUTPUT}`);

  state.mcps.tavily = tavily.source === 'placeholder' ? 'placeholder' : 'configured-with-key';
  state.mcps.context7 = 'configured-no-key';
  state.mcps.supabase = supabase.source === 'placeholder' ? 'placeholder' : 'configured-with-key';
  state.mcps.n8n = n8nKey.source === 'placeholder' ? 'placeholder' : 'configured-with-key';
}

async function configureMcpForOpencode(
  state: InstallState,
  pendingEnvVars: Set<string>,
): Promise<void> {
  log.banner('Configuring MCPs for OpenCode (opencode.json)');

  const tavily = await resolveSecret('TAVILY_API_KEY');
  if (tavily.source === 'placeholder') { pendingEnvVars.add('TAVILY_API_KEY'); }

  const supabase = await resolveSecret('SUPABASE_ACCESS_TOKEN');
  if (supabase.source === 'placeholder') { pendingEnvVars.add('SUPABASE_ACCESS_TOKEN'); }

  const n8nKey = await resolveSecret(N8N_API_KEY_VAR);
  if (n8nKey.source === 'placeholder') { pendingEnvVars.add(N8N_API_KEY_VAR); }

  const templateRaw = await readFile(OPENCODE_TEMPLATE_PATH, 'utf8');
  const template = JSON.parse(templateRaw) as OpencodeMcpFile;

  const filtered: Record<string, OpencodeMcpEntry> = {};
  for (const name of CANONICAL_MCPS) {
    if (name === 'n8n') {
      filtered[name] = buildN8nOpencodeEntry();
    }
    else if (template.mcp[name]) {
      filtered[name] = { ...template.mcp[name], enabled: true };
    }
  }

  const replaced = replacePlaceholders(
    { $schema: template.$schema, mcp: filtered },
    {
      TAVILY_API_KEY: tavily.value,
      SUPABASE_ACCESS_TOKEN: supabase.value,
      [N8N_API_KEY_VAR]: n8nKey.value,
    },
  );

  await writeMcpFile(OPENCODE_MCP_OUTPUT, replaced);
  log.success(`Wrote ${OPENCODE_MCP_OUTPUT}`);

  // Don't overwrite Claude's MCP state if both agents share the run; merge by max truthiness.
  if (!state.mcps.tavily || state.mcps.tavily === 'skipped-by-user') { state.mcps.tavily = tavily.source === 'placeholder' ? 'placeholder' : 'configured-with-key'; }
  state.mcps.context7 = 'configured-no-key';
  if (!state.mcps.supabase || state.mcps.supabase === 'skipped-by-user') { state.mcps.supabase = supabase.source === 'placeholder' ? 'placeholder' : 'configured-with-key'; }
  if (!state.mcps.n8n || state.mcps.n8n === 'skipped-by-user') { state.mcps.n8n = n8nKey.source === 'placeholder' ? 'placeholder' : 'configured-with-key'; }
}

async function writeMcpFile(target: string, content: unknown): Promise<void> {
  if (existsSync(target)) {
    const overwrite = await confirm({
      message: `${target} already exists. Overwrite?`,
      default: false,
    });
    if (!overwrite) {
      log.warn(`Keeping existing ${target}.`);
      return;
    }
  }
  await mkdir(dirname(target), { recursive: true });
  await writeFile(target, `${JSON.stringify(content, null, 2)}\n`, 'utf8');
}

async function configureMcps(agents: AgentId[], state: InstallState): Promise<void> {
  if (agents.length === 0) {
    log.info('No agents selected, skipping MCP config.');
    return;
  }
  const pending = new Set<string>();
  if (agents.includes('claude-code')) { await configureMcpForClaude(state, pending); }
  if (agents.includes('opencode')) { await configureMcpForOpencode(state, pending); }
  state.pendingEnvVars = [...pending].sort();
}

// ============================================================================
// Step 8 — verify external CLIs
// ============================================================================

function verifyExternalClis(state: InstallState): { name: string, status: CliStatus, install: string }[] {
  const results = EXTERNAL_CLIS.map((cli) => {
    const found = which(cli.name) !== null;
    const status: CliStatus = found ? 'found' : 'missing';
    state.externalClis[cli.name] = status;
    return { name: cli.name, status, install: cli.install };
  });

  process.stdout.write('\n');
  process.stdout.write(`${COLORS.bold}CLI            Status      Install (if missing)${COLORS.reset}\n`);
  process.stdout.write(`${'─'.repeat(64)}\n`);
  for (const r of results) {
    const statusColor = r.status === 'found' ? COLORS.green : COLORS.yellow;
    const statusText = `${statusColor}${r.status}${COLORS.reset}`;
    const padName = r.name.padEnd(14);
    const padStatus = r.status === 'found' ? 'found     ' : 'missing   ';
    const installCol = r.status === 'found' ? '(skip)' : r.install;
    process.stdout.write(`${padName} ${statusText.replace(r.status, padStatus.trim().padEnd(11))} ${installCol}\n`);
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
// Step 10 — closing summary
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
  process.stdout.write('  1. Resolve pending env vars (export in your shell or replace inline in .mcp.json)\n');
  process.stdout.write('  2. Install missing CLIs (see table above)\n');
  process.stdout.write('  3. Run: bun run lint:agents (validate config)\n');
  process.stdout.write('  4. In your agent: /refresh-ai-memory (load initial context)\n');
  process.stdout.write('  5. In your agent: /agentic-dev-core (bootstrap on this repo)\n');
  process.stdout.write('  6. In your agent: /project-foundation, then /project-bootstrap (define + scaffold)\n');
  process.stdout.write('  7. After foundation+bootstrap, run: npx autoskills (auto-detect concrete stack and add matching community skills)\n');
  process.stdout.write('\n');
  log.dim('Full docs: INSTALLER.md');
}

// ============================================================================
// Main
// ============================================================================

async function main(): Promise<void> {
  log.banner('ai-driven-project-starter — installer');
  log.dim('See .plans/FASE-15-DESIGN.md for the spec this implements.');

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

  // Step 6 — community skills via npx skills CLI (independent of gentle-ai)
  log.step(6, 11, 'Installing community skills via npx skills CLI');
  await installCommunitySkills(state, 'project');
  await installCommunitySkills(state, 'global');

  // Step 7
  log.step(7, 11, 'Configuring MCPs');
  await configureMcps(agents, state);

  // Step 8
  log.step(8, 11, 'Verifying external CLIs');
  verifyExternalClis(state);

  // Step 9
  log.step(9, 11, 'Persisting state');
  await writeInstallState(state);

  // Step 10 (closing summary)
  log.step(10, 11, 'Closing summary');
  printClosingSummary(state);
}

main().catch((err) => {
  if (err && typeof err === 'object' && 'name' in err && (err as { name: string }).name === 'ExitPromptError') {
    log.warn('Aborted by user.');
    process.exit(130);
  }
  log.error(`Fatal: ${(err as Error).message ?? String(err)}`);
  if (err instanceof Error && err.stack) { log.dim(err.stack); }
  process.exit(1);
});
