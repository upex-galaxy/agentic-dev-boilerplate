/**
 * @fileoverview Hook and MCP contracts shared by the three harnesses.
 *
 * The personality hook has ONE emitter (`.agents/hooks/personality-reinject.mjs`)
 * and three adapters (`.claude/settings.json`, `.codex/hooks.json`,
 * `.opencode/plugins/personality-reinject.js`). The MCP inventory has ONE
 * meaning and three spellings (`.mcp.json`, `opencode.jsonc`,
 * `.codex/config.toml`). This module pins both contracts so a drift in any of
 * the six files fails `bun run agents:compat:check` instead of surfacing as a
 * harness that silently lost a server or a hook.
 *
 * Import-closed: only Node builtins and `cli/lib` siblings (see the header of
 * `agent-compatibility.ts` for why `cli/` must never import a sibling
 * top-level directory).
 */

import { existsSync, readFileSync } from 'node:fs';
import { join, relative, resolve } from 'node:path';

export const CANONICAL_MCP_IDS = [
  'context7',
  'tavily',
  'supabase',
  'n8n',
] as const;

export const CLAUDE_HOOK_COMMAND = 'node "$CLAUDE_PROJECT_DIR/.agents/hooks/personality-reinject.mjs"';
export const CODEX_HOOK_COMMAND = 'root="$(git rev-parse --show-toplevel)" && node "$root/.agents/hooks/personality-reinject.mjs"';
export const CODEX_HOOK_COMMAND_WINDOWS = 'powershell.exe -NoProfile -Command "$root = git rev-parse --show-toplevel; if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }; node (Join-Path $root \'.agents/hooks/personality-reinject.mjs\')"';

export type McpId = (typeof CANONICAL_MCP_IDS)[number];
export type McpHost = 'claude' | 'opencode' | 'codex';
type Transport = 'stdio' | 'http';

/**
 * One MCP server, host-agnostic.
 *
 * `dependsOn` is the set of `.env` variable NAMES the server needs at launch,
 * regardless of how the host spells the reference: `${VAR}` in `.mcp.json`,
 * `{env:VAR}` in `opencode.jsonc`, `env_vars = [...]` / `bearer_token_env_var`
 * / `env_http_headers` in `.codex/config.toml`. A renamed key does not count as
 * a new dependency: `SUPABASE_URL = "${NEXT_PUBLIC_SUPABASE_URL}"` depends on
 * `NEXT_PUBLIC_SUPABASE_URL`, the same variable Codex forwards by name.
 *
 * `literalEnv` holds the env entries whose value is a plain string (no
 * placeholder), i.e. settings such as `MCP_MODE = "stdio"`. Those must match
 * across hosts too, otherwise one harness runs the server in a different mode.
 */
export interface NormalizedMcpServer {
  transport: Transport
  command?: string
  args?: string[]
  url?: string
  dependsOn: string[]
  literalEnv: Record<string, string>
  enabled: boolean
}

type NormalizedMcpConfig = Record<string, NormalizedMcpServer>;

interface JsonObject {
  [key: string]: unknown
}

/**
 * PARITY RULE. Every host must declare exactly the canonical server set, and
 * for every server the three hosts must agree on `dependsOn` and `literalEnv`
 * (what the server needs from `.env`, what it is told to do). `transport`,
 * `command` and `args` are allowed to differ per host and are pinned per host
 * below, because Codex cannot expand `${VAR}` inside `args`:
 *
 *   - `tavily`: Claude/OpenCode tunnel through `mcp-remote` with the key in
 *     the URL; Codex connects to the streamable-HTTP endpoint directly with
 *     `bearer_token_env_var`.
 *   - `supabase`: Claude/OpenCode pass `--access-token ${SUPABASE_ACCESS_TOKEN}`;
 *     Codex forwards `SUPABASE_ACCESS_TOKEN` via `env_vars` and lets the server
 *     read it from the environment (documented behaviour of
 *     `@supabase/mcp-server-supabase`).
 *
 * Whatever the spelling, the `.env` names each server depends on are identical
 * across the three hosts. That is what the cross-host check enforces.
 */
const N8N_LITERAL_ENV = {
  MCP_MODE: 'stdio',
  LOG_LEVEL: 'error',
  DISABLE_CONSOLE_OUTPUT: 'true',
} as const;

const SUPABASE_DEPENDS_ON = [
  'NEXT_PUBLIC_SUPABASE_URL',
  'SUPABASE_ACCESS_TOKEN',
  'SUPABASE_PUBLISHABLE_KEY',
  'SUPABASE_SECRET_KEY',
];

const TAVILY_MCP_REMOTE = ['-y', 'mcp-remote'];

/** `${NAME}`: the canonical spelling every host's placeholder is normalized to. */
function ref(name: string): string {
  return `\${${name}}`;
}

/**
 * Canonical field order + sorted collections, so two servers compare equal
 * through `JSON.stringify` whenever they mean the same thing.
 */
function canonical(shape: Pick<NormalizedMcpServer, 'transport'> & Partial<NormalizedMcpServer>): NormalizedMcpServer {
  const literalEnv: Record<string, string> = {};
  for (const key of Object.keys(shape.literalEnv ?? {}).sort()) {
    literalEnv[key] = (shape.literalEnv ?? {})[key];
  }
  return {
    transport: shape.transport,
    command: shape.command,
    args: shape.args,
    url: shape.url,
    dependsOn: [...new Set(shape.dependsOn ?? [])].sort(),
    literalEnv,
    enabled: shape.enabled ?? true,
  };
}

const server = canonical;

const CLAUDE_AND_OPENCODE: Record<McpId, NormalizedMcpServer> = {
  context7: server({ transport: 'stdio', command: 'bunx', args: ['-y', '@upstash/context7-mcp'] }),
  tavily: server({
    transport: 'stdio',
    command: 'bunx',
    args: [...TAVILY_MCP_REMOTE, `https://mcp.tavily.com/mcp/?tavilyApiKey=${ref('TAVILY_API_KEY')}`],
    dependsOn: ['TAVILY_API_KEY'],
  }),
  supabase: server({
    transport: 'stdio',
    command: 'bunx',
    args: ['-y', '@supabase/mcp-server-supabase@latest', '--access-token', ref('SUPABASE_ACCESS_TOKEN')],
    dependsOn: SUPABASE_DEPENDS_ON,
  }),
  n8n: server({
    transport: 'stdio',
    command: 'npx',
    args: ['-y', 'n8n-mcp'],
    dependsOn: ['N8N_API_URL', 'N8N_API_KEY'],
    literalEnv: { ...N8N_LITERAL_ENV },
  }),
};

export const EXPECTED_MCP: Record<McpHost, Record<McpId, NormalizedMcpServer>> = {
  claude: CLAUDE_AND_OPENCODE,
  opencode: CLAUDE_AND_OPENCODE,
  codex: {
    context7: CLAUDE_AND_OPENCODE.context7,
    tavily: server({
      transport: 'http',
      url: 'https://mcp.tavily.com/mcp/',
      dependsOn: ['TAVILY_API_KEY'],
    }),
    supabase: server({
      transport: 'stdio',
      command: 'bunx',
      args: ['-y', '@supabase/mcp-server-supabase@latest'],
      dependsOn: SUPABASE_DEPENDS_ON,
    }),
    n8n: CLAUDE_AND_OPENCODE.n8n,
  },
};

function object(value: unknown, label: string): JsonObject {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    throw new Error(`${label} must be an object.`);
  }
  return value as JsonObject;
}

function stringArray(value: unknown, label: string): string[] {
  if (!Array.isArray(value) || !value.every(entry => typeof entry === 'string')) {
    throw new Error(`${label} must be an array of strings.`);
  }
  return value;
}

function stringValue(value: unknown, label: string): string {
  if (typeof value !== 'string') {
    throw new TypeError(`${label} must be a string.`);
  }
  return value;
}

export function stripJsonComments(source: string): string {
  let result = '';
  let inString = false;
  let escaped = false;
  let lineComment = false;
  let blockComment = false;

  for (let index = 0; index < source.length; index++) {
    const current = source[index];
    const next = source[index + 1];

    if (lineComment) {
      if (current === '\n') {
        lineComment = false;
        result += current;
      }
      continue;
    }
    if (blockComment) {
      if (current === '*' && next === '/') {
        blockComment = false;
        index++;
      }
      else if (current === '\n') {
        result += current;
      }
      continue;
    }
    if (inString) {
      result += current;
      if (escaped) {
        escaped = false;
      }
      else if (current === '\\') {
        escaped = true;
      }
      else if (current === '"') {
        inString = false;
      }
      continue;
    }
    if (current === '"') {
      inString = true;
      result += current;
    }
    else if (current === '/' && next === '/') {
      lineComment = true;
      index++;
    }
    else if (current === '/' && next === '*') {
      blockComment = true;
      index++;
    }
    else {
      result += current;
    }
  }

  return result;
}

/**
 * Strips a trailing comma before `}` / `]` (outside strings) so the JSONC that
 * Prettier writes for `opencode.jsonc` parses with `JSON.parse`.
 */
function stripTrailingCommas(source: string): string {
  let result = '';
  let inString = false;
  let escaped = false;
  for (let index = 0; index < source.length; index++) {
    const current = source[index];
    if (inString) {
      result += current;
      if (escaped) { escaped = false; }
      else if (current === '\\') { escaped = true; }
      else if (current === '"') { inString = false; }
      continue;
    }
    if (current === '"') {
      inString = true;
      result += current;
      continue;
    }
    if (current === ',') {
      const rest = source.slice(index + 1);
      const closer = /^\s*[}\]]/.test(rest);
      if (closer) { continue; }
    }
    result += current;
  }
  return result;
}

const PLACEHOLDER = /\$\{([A-Z][A-Z0-9_]*)\}|\{env:([A-Z][A-Z0-9_]*)\}/g;

/** OpenCode spells a placeholder `{env:VAR}`; compare it as `${VAR}`. */
function canonicalPlaceholders(text: string): string {
  return text.replace(/\{env:([A-Z][A-Z0-9_]*)\}/g, (_match, name: string) => ref(name));
}

/** Every `${VAR}` / `{env:VAR}` referenced anywhere inside `value`. */
function placeholderNames(value: unknown): string[] {
  const names = new Set<string>();
  const visit = (entry: unknown): void => {
    if (typeof entry === 'string') {
      for (const match of entry.matchAll(PLACEHOLDER)) {
        names.add(match[1] ?? match[2]);
      }
    }
    else if (Array.isArray(entry)) {
      entry.forEach(visit);
    }
    else if (typeof entry === 'object' && entry !== null) {
      Object.values(entry).forEach(visit);
    }
  };
  visit(value);
  return [...names];
}

/** Env entries whose value carries no placeholder, sorted by key. */
function literalEntries(env: JsonObject | undefined, label: string): Record<string, string> {
  if (!env) { return {}; }
  const literal: Record<string, string> = {};
  for (const key of Object.keys(env).sort()) {
    const value = stringValue(env[key], `${label}.${key}`);
    if (placeholderNames(value).length === 0) {
      literal[key] = value;
    }
  }
  return literal;
}

function sorted(names: Iterable<string>): string[] {
  return [...new Set(names)].sort();
}

function normalizeClaude(root: JsonObject): NormalizedMcpConfig {
  const servers = object(root.mcpServers, '.mcp.json mcpServers');
  return Object.fromEntries(Object.entries(servers).map(([id, raw]) => {
    const label = `.mcp.json ${id}`;
    const server = object(raw, label);
    const transport: Transport = server.type === 'http' || typeof server.url === 'string' ? 'http' : 'stdio';
    const env = server.env === undefined ? undefined : object(server.env, `${label}.env`);
    return [id, {
      transport,
      command: transport === 'stdio' ? stringValue(server.command, `${label}.command`) : undefined,
      args: transport === 'stdio' ? stringArray(server.args ?? [], `${label}.args`) : undefined,
      url: transport === 'http' ? stringValue(server.url, `${label}.url`) : undefined,
      dependsOn: sorted(placeholderNames(server)),
      literalEnv: literalEntries(env, `${label}.env`),
      enabled: server.enabled !== false,
    }];
  }));
}

function normalizeOpenCode(root: JsonObject): NormalizedMcpConfig {
  const servers = object(root.mcp, 'opencode.jsonc mcp');
  return Object.fromEntries(Object.entries(servers).map(([id, raw]) => {
    const label = `opencode.jsonc ${id}`;
    const server = object(raw, label);
    const transport: Transport = server.type === 'remote' ? 'http' : 'stdio';
    const command = transport === 'stdio'
      ? stringArray(server.command, `${label}.command`)
      : [];
    const environment = server.environment === undefined
      ? undefined
      : object(server.environment, `${label}.environment`);
    return [id, {
      transport,
      command: command[0],
      args: transport === 'stdio' ? command.slice(1).map(canonicalPlaceholders) : undefined,
      url: transport === 'http' ? canonicalPlaceholders(stringValue(server.url, `${label}.url`)) : undefined,
      // OpenCode spells the placeholder `{env:VAR}` and, like Claude, expands it
      // in both `command` and `environment`.
      dependsOn: sorted(placeholderNames(server)),
      literalEnv: literalEntries(environment, `${label}.environment`),
      enabled: server.enabled !== false,
    }];
  }));
}

function normalizeCodex(root: JsonObject): NormalizedMcpConfig {
  const servers = object(root.mcp_servers, '.codex/config.toml mcp_servers');
  return Object.fromEntries(Object.entries(servers).map(([id, raw]) => {
    const label = `.codex/config.toml ${id}`;
    const server = object(raw, label);
    const transport: Transport = typeof server.url === 'string' ? 'http' : 'stdio';

    // Codex never expands placeholders: `env` is a table of LITERAL values,
    // `env_vars` forwards host variables BY NAME (plain strings or
    // `{ name, source }` objects), `bearer_token_env_var` names the variable
    // holding the token, `env_http_headers` maps header -> variable name.
    const dependsOn: string[] = [];
    if (Array.isArray(server.env_vars)) {
      for (const entry of server.env_vars) {
        dependsOn.push(typeof entry === 'string'
          ? entry
          : stringValue(object(entry, `${label}.env_vars entry`).name, `${label}.env_vars name`));
      }
    }
    if (typeof server.bearer_token_env_var === 'string') {
      dependsOn.push(server.bearer_token_env_var);
    }
    if (server.env_http_headers !== undefined) {
      const headers = object(server.env_http_headers, `${label}.env_http_headers`);
      for (const header of Object.keys(headers)) {
        dependsOn.push(stringValue(headers[header], `${label}.env_http_headers.${header}`));
      }
    }
    const env = server.env === undefined ? undefined : object(server.env, `${label}.env`);
    const leaked = placeholderNames(env);
    if (leaked.length > 0) {
      throw new Error(`${label}.env cannot reference ${leaked.join(', ')}: Codex does not expand placeholders. Forward the variable through env_vars instead.`);
    }

    return [id, {
      transport,
      command: transport === 'stdio' ? stringValue(server.command, `${label}.command`) : undefined,
      args: transport === 'stdio' ? stringArray(server.args ?? [], `${label}.args`) : undefined,
      url: transport === 'http' ? stringValue(server.url, `${label}.url`) : undefined,
      dependsOn: sorted(dependsOn),
      literalEnv: literalEntries(env, `${label}.env`),
      enabled: server.enabled !== false,
    }];
  }));
}

function parseJson(path: string): JsonObject {
  return object(JSON.parse(readFileSync(path, 'utf8')), path);
}

function parseJsonc(path: string): JsonObject {
  return object(JSON.parse(stripTrailingCommas(stripJsonComments(readFileSync(path, 'utf8')))), path);
}

function parseToml(path: string): JsonObject {
  return object(Bun.TOML.parse(readFileSync(path, 'utf8')), path);
}

function sameServer(actual: NormalizedMcpServer, expected: NormalizedMcpServer): boolean {
  return JSON.stringify(canonical(actual)) === JSON.stringify(canonical(expected));
}

function describeServer(server: NormalizedMcpServer): string {
  return JSON.stringify(canonical(server));
}

function describeContract(server: NormalizedMcpServer): string {
  return JSON.stringify({ dependsOn: server.dependsOn, literalEnv: server.literalEnv });
}

export function validateMcpParity(root = process.cwd()): string[] {
  const resolvedRoot = resolve(root);
  const errors: string[] = [];
  let configs: Record<McpHost, NormalizedMcpConfig>;
  try {
    configs = {
      claude: normalizeClaude(parseJson(join(resolvedRoot, '.mcp.json'))),
      opencode: normalizeOpenCode(parseJsonc(join(resolvedRoot, 'opencode.jsonc'))),
      codex: normalizeCodex(parseToml(join(resolvedRoot, '.codex', 'config.toml'))),
    };
  }
  catch (error) {
    return [error instanceof Error ? error.message : String(error)];
  }

  const expectedIds = [...CANONICAL_MCP_IDS].sort();
  const completeHosts: McpHost[] = [];
  for (const [host, config] of Object.entries(configs) as Array<[McpHost, NormalizedMcpConfig]>) {
    const actualIds = Object.keys(config).sort();
    if (JSON.stringify(actualIds) !== JSON.stringify(expectedIds)) {
      errors.push(`${host} MCP IDs must be exactly: ${CANONICAL_MCP_IDS.join(', ')}; found: ${actualIds.join(', ')}`);
      continue;
    }
    completeHosts.push(host);
    for (const id of CANONICAL_MCP_IDS) {
      const actual = config[id];
      const expected = EXPECTED_MCP[host][id];
      if (!sameServer(actual, expected)) {
        errors.push(`${host} MCP ${id} mismatch: expected ${describeServer(expected)}, found ${describeServer(actual)}`);
      }
    }
  }

  // Cross-host contract: same `.env` dependencies and same literal settings per
  // server, whatever the transport or command each host uses (see PARITY RULE).
  const [reference, ...others] = completeHosts;
  if (reference) {
    for (const id of CANONICAL_MCP_IDS) {
      const baseline = describeContract(configs[reference][id]);
      for (const host of others) {
        const contract = describeContract(configs[host][id]);
        if (contract !== baseline) {
          errors.push(`MCP ${id} env contract differs between ${reference} and ${host}: ${baseline} vs ${contract}`);
        }
      }
    }
  }

  return errors;
}

function personalAbsolutePath(command: string): boolean {
  return /(?:^|[\s"'])(?:\/Users\/|\/home\/|[A-Za-z]:[\\/]Users[\\/])/.test(command);
}

function readHookCommand(settings: JsonObject, host: 'claude' | 'codex'): JsonObject {
  const hooks = object(settings.hooks, `${host} hooks`);
  const event = hooks.UserPromptSubmit;
  if (!Array.isArray(event) || event.length !== 1) {
    throw new Error(`${host} must define exactly one UserPromptSubmit group.`);
  }
  const group = object(event[0], `${host} UserPromptSubmit group`);
  if (!Array.isArray(group.hooks) || group.hooks.length !== 1) {
    throw new Error(`${host} must define exactly one UserPromptSubmit command.`);
  }
  return object(group.hooks[0], `${host} UserPromptSubmit command`);
}

export function validateHookCompatibility(root = process.cwd()): string[] {
  const resolvedRoot = resolve(root);
  const errors: string[] = [];
  const required = [
    '.agents/hooks/personality-reinject.mjs',
    '.opencode/plugins/personality-reinject.js',
    '.claude/settings.json',
    '.codex/hooks.json',
  ];
  for (const path of required) {
    if (!existsSync(join(resolvedRoot, path))) {
      errors.push(`Hook compatibility file missing: ${path}`);
    }
  }
  if (errors.length > 0) { return errors; }

  try {
    const claude = readHookCommand(parseJson(join(resolvedRoot, '.claude', 'settings.json')), 'claude');
    const codex = readHookCommand(parseJson(join(resolvedRoot, '.codex', 'hooks.json')), 'codex');
    const claudeCommand = stringValue(claude.command, 'Claude hook command');
    const codexCommand = stringValue(codex.command, 'Codex hook command');
    const codexWindows = stringValue(codex.commandWindows, 'Codex Windows hook command');

    if (claudeCommand !== CLAUDE_HOOK_COMMAND) {
      errors.push(`Claude hook command must be repository-relative through $CLAUDE_PROJECT_DIR: ${CLAUDE_HOOK_COMMAND}`);
    }
    if (codexCommand !== CODEX_HOOK_COMMAND) {
      errors.push(`Codex hook command must resolve the Git root: ${CODEX_HOOK_COMMAND}`);
    }
    if (codexWindows !== CODEX_HOOK_COMMAND_WINDOWS) {
      errors.push(`Codex Windows hook command must resolve the Git root with Join-Path: ${CODEX_HOOK_COMMAND_WINDOWS}`);
    }
    for (const [host, command] of [['claude', claudeCommand], ['codex', codexCommand], ['codex-windows', codexWindows]] as const) {
      if (personalAbsolutePath(command)) {
        errors.push(`${host} hook command contains an absolute personal path.`);
      }
    }

    const shared = readFileSync(join(resolvedRoot, '.agents', 'hooks', 'personality-reinject.mjs'), 'utf8');
    const plugin = readFileSync(join(resolvedRoot, '.opencode', 'plugins', 'personality-reinject.js'), 'utf8');
    if (!shared.includes('AGENTS.md') || shared.includes('CLAUDE.md')) {
      errors.push('Shared personality hook must reference AGENTS.md and must not treat CLAUDE.md as canonical.');
    }
    if (!plugin.includes('../../.agents/hooks/personality-reinject.mjs')) {
      errors.push('OpenCode personality adapter must import the shared hook contract.');
    }
    if (plugin.includes('output.system =')) {
      errors.push('OpenCode personality adapter must mutate output.system in place.');
    }
    for (const duplicate of ['.claude/hooks/personality-reinject.js', '.codex/hooks/personality-reinject.js']) {
      if (existsSync(join(resolvedRoot, duplicate))) {
        errors.push(`Duplicated personality hook must be removed: ${duplicate}`);
      }
    }
  }
  catch (error) {
    errors.push(error instanceof Error ? error.message : String(error));
  }

  return errors;
}

export function compatibilityContractPaths(root = process.cwd()): string[] {
  const resolvedRoot = resolve(root);
  return [
    '.agents/hooks/personality-reinject.mjs',
    '.opencode/plugins/personality-reinject.js',
    '.claude/settings.json',
    '.codex/hooks.json',
    '.mcp.json',
    'opencode.jsonc',
    '.codex/config.toml',
  ].map(path => relative(resolvedRoot, join(resolvedRoot, path)));
}
