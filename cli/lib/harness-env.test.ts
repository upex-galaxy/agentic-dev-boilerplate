/**
 * @fileoverview Tests for the per-harness credential generator.
 *
 * Every test runs against a throwaway repo root under `os.tmpdir()`, so nothing
 * here reads or writes this checkout's real `.env`, settings or `.auth/`.
 *
 * The credential-shaped strings below are literals invented for the test. They
 * are not secrets and they never touch the repo.
 */

import { execFileSync } from 'node:child_process';
import { existsSync, mkdirSync, mkdtempSync, readFileSync, realpathSync, rmSync, statSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { afterEach, describe, expect, test } from 'bun:test';
import { CODEX_ENV_LOADER_ARGS } from './agent-compatibility-contracts.ts';
import {
  buildAllowlist,
  check,
  CLAUDE_LOCAL_SETTINGS,
  claudeSettingsRoot,
  codexNamesWithoutLoader,
  ensureOpencodePlaceholders,
  generate,
  OPENCODE_CONFIG,
  OPENCODE_SECRET_DIR,
  opencodeFileRef,
  planClaudeSettings,
  readEnvSnapshot,
  stripInlineComments,
  writeOpencodeSurface,
} from './harness-env.ts';

const roots: string[] = [];

function makeRoot(): string {
  // realpath, because macOS resolves /var to /private/var and `git rev-parse
  // --path-format=absolute` returns the resolved form.
  const root = realpathSync(mkdtempSync(join(tmpdir(), 'harness-env-')));
  roots.push(root);
  return root;
}

/**
 * A literal `${VAR}` placeholder, the form `.mcp.json` carries.
 *
 * Built here rather than written inline because a plain string containing
 * `${...}` trips `no-template-curly-in-string`, and that rule is right in
 * general: it catches a template literal someone forgot to backtick. A template
 * literal with an escaped `$` is exempt and says what it means.
 */
function dollarVar(name: string): string {
  return `\${${name}}`;
}

function write(root: string, rel: string, contents: string): void {
  const target = join(root, rel);
  mkdirSync(dirname(target), { recursive: true });
  writeFileSync(target, contents, 'utf8');
}

afterEach(() => {
  while (roots.length > 0) {
    const root = roots.pop();
    if (root !== undefined) { rmSync(root, { recursive: true, force: true }); }
  }
});

/**
 * A minimal repo shaped like the servers this boilerplate ships: one local MCP
 * that takes its token as an argument (supabase), one that reads it from an env
 * block (n8n).
 *
 * `template` is the COMMITTED `.env.example`, which is what decides whether
 * `opencode.jsonc` may carry a `{file:}` reference for a variable. It defaults
 * to declaring both variables, empty, which is the shape a real template has.
 */
function scaffold(root: string, env: string, template = 'SUPABASE_ACCESS_TOKEN=\nN8N_API_KEY=\n'): void {
  write(root, '.env.example', template);
  write(root, '.mcp.json', JSON.stringify({
    mcpServers: {
      supabase: { command: 'bunx', args: ['-y', '@supabase/mcp-server-supabase@latest', '--access-token', dollarVar('SUPABASE_ACCESS_TOKEN')] },
      n8n: { command: 'npx', args: ['-y', 'n8n-mcp'], env: { N8N_API_KEY: dollarVar('N8N_API_KEY') } },
    },
  }, null, 2));
  write(root, OPENCODE_CONFIG, [
    '{',
    '  // Docs comment mentioning {env:VAR} and {env:VAR_NAME} — noise, not variables.',
    '  "mcp": {',
    '    "supabase": { "command": ["bunx", "-y", "@supabase/mcp-server-supabase@latest", "--access-token", "{env:SUPABASE_ACCESS_TOKEN}"] },',
    '    "n8n": { "environment": { "N8N_API_KEY": "{env:N8N_API_KEY}" } }',
    '  }',
    '}',
    '',
  ].join('\n'));
  write(root, '.codex/config.toml', [
    `# Header comment naming ${dollarVar('VAR')} — noise.`,
    '[mcp_servers.supabase]',
    'env_vars = ["SUPABASE_ACCESS_TOKEN"]',
    '',
    '[mcp_servers.n8n]',
    'env_vars = ["N8N_API_KEY"]',
    'env = { CODEX_LITERAL = "not-from-dotenv" }',
    '',
  ].join('\n'));
  write(root, '.env', env);
}

describe('stripInlineComments', () => {
  test('strips a comment after an unquoted value', () => {
    const out = readEnvSnapshotFrom('N8N_API_URL=          # https://n8n.example | self-hosted\n');
    expect(out.N8N_API_URL).toBe('');
  });

  test('keeps a quoted value whole, comment marker and all', () => {
    const out = readEnvSnapshotFrom('A="keep # this"\n');
    expect(out.A).toBe('keep # this');
  });

  test('keeps a hash with no whitespace before it', () => {
    const out = readEnvSnapshotFrom('B=pass#word\n');
    expect(out.B).toBe('pass#word');
  });

  test('leaves a full-line comment alone', () => {
    expect(stripInlineComments('# just a comment\nC=v\n')).toBe('# just a comment\nC=v\n');
  });

  function readEnvSnapshotFrom(content: string): Record<string, string> {
    const root = makeRoot();
    write(root, '.env', content);
    return readEnvSnapshot(root).values;
  }
});

describe('buildAllowlist', () => {
  test('parses every config and never picks up the comment noise', () => {
    const root = makeRoot();
    scaffold(root, 'SUPABASE_ACCESS_TOKEN=tk\nN8N_API_KEY=n8n.invalid\n');
    const list = buildAllowlist(root);
    expect(list.all).toEqual(['N8N_API_KEY', 'SUPABASE_ACCESS_TOKEN']);
    expect(list.all).not.toContain('VAR');
    expect(list.all).not.toContain('VAR_NAME');
  });

  test('reports Codex variables only for servers that skip the .env loader', () => {
    const root = makeRoot();
    write(root, '.codex/config.toml', [
      '[mcp_servers.wrapped]',
      'command = "bunx"',
      `args = [${[...CODEX_ENV_LOADER_ARGS, 'bunx', '-y', 'pkg@1'].map(a => JSON.stringify(a)).join(', ')}]`,
      'env_vars = ["WRAPPED_VAR"]',
      '',
      '[mcp_servers.bare]',
      'command = "bunx"',
      'args = ["-y", "pkg@1"]',
      'env_vars = ["BARE_VAR"]',
      '',
      '[mcp_servers.remote]',
      'url = "https://example.test/mcp"',
      'bearer_token_env_var = "REMOTE_TOKEN"',
      '',
    ].join('\n'));

    expect(codexNamesWithoutLoader(root)).toEqual(['BARE_VAR', 'REMOTE_TOKEN']);
  });

  test('skips a Codex [mcp_servers.*].env table, whose values Codex supplies itself', () => {
    const root = makeRoot();
    scaffold(root, '');
    expect(buildAllowlist(root).all).not.toContain('CODEX_LITERAL');
  });

  test('scopes emitter A to .mcp.json and emitter B to opencode.jsonc', () => {
    const root = makeRoot();
    scaffold(root, '');
    write(root, '.mcp.json', JSON.stringify({
      mcpServers: {
        supabase: { command: 'bunx', args: ['--access-token', dollarVar('SUPABASE_ACCESS_TOKEN')], env: { SUPABASE_URL: dollarVar('NEXT_PUBLIC_SUPABASE_URL') } },
        n8n: { command: 'npx', args: ['-y', 'n8n-mcp'], env: { N8N_API_KEY: dollarVar('N8N_API_KEY') } },
      },
    }, null, 2));
    const list = buildAllowlist(root);
    expect(list.claude).toEqual(['N8N_API_KEY', 'NEXT_PUBLIC_SUPABASE_URL', 'SUPABASE_ACCESS_TOKEN']);
    expect(list.opencode).toEqual(['N8N_API_KEY', 'SUPABASE_ACCESS_TOKEN']);
  });

  test('reports an unparseable config instead of silently emitting a short allowlist', () => {
    const root = makeRoot();
    scaffold(root, 'SUPABASE_ACCESS_TOKEN=tk\n');
    write(root, '.mcp.json', '{ not json');
    const result = check(root);
    expect(result.ok).toBe(false);
    expect(result.findings.some(f => f.kind === 'config-unparseable' && f.names.includes('.mcp.json'))).toBe(true);
  });

  test('cross-checks the declared MCP_SERVER_SECRETS map without failing on drift', () => {
    const root = makeRoot();
    scaffold(root, 'SUPABASE_ACCESS_TOKEN=tk\nN8N_API_KEY=n8n.invalid\n');
    const findings = check(root).findings.filter(f => f.surface === 'allowlist' && f.kind !== 'config-unparseable');
    expect(findings.every(f => f.blocking === false)).toBe(true);
  });
});

describe('emitter A — .claude/settings.local.json', () => {
  test('creates the env block with only the allowlisted variables', () => {
    const root = makeRoot();
    scaffold(
      root,
      'SUPABASE_ACCESS_TOKEN=tk\nN8N_API_KEY=n8n.invalid\nATLASSIAN_API_TOKEN=nope\nQA_E2E_USER_PASSWORD=nope\n',
      'SUPABASE_ACCESS_TOKEN=\nN8N_API_KEY=\nATLASSIAN_API_TOKEN=\nQA_E2E_USER_PASSWORD=\n',
    );
    const result = generate(root);
    const data = JSON.parse(readFileSync(join(root, CLAUDE_LOCAL_SETTINGS), 'utf8')) as { env: Record<string, string> };
    expect(Object.keys(data.env).sort()).toEqual(['N8N_API_KEY', 'SUPABASE_ACCESS_TOKEN']);
    // Jira credentials and test users are declared by the template and used by
    // no MCP, so they are never copied into a harness config.
    expect(result.excluded).toEqual(['ATLASSIAN_API_TOKEN', 'QA_E2E_USER_PASSWORD']);
    expect(result.declared).toHaveLength(4);
  });

  test('the summary arithmetic closes: emitted plus excluded equals declared', () => {
    const root = makeRoot();
    scaffold(root, 'SUPABASE_ACCESS_TOKEN=tk\n', 'SUPABASE_ACCESS_TOKEN=\nN8N_API_KEY=\nATLASSIAN_API_TOKEN=\n');
    const result = generate(root);
    expect(result.emitted.length + result.excluded.length).toBe(result.declared.length);
    expect(check(root).summary).toContain('emitted 2 of 3 declared variables; 1 not referenced');
  });

  test('MERGES: every key it did not put there survives', () => {
    const root = makeRoot();
    scaffold(root, 'SUPABASE_ACCESS_TOKEN=tk\nN8N_API_KEY=n8n.invalid\n');
    write(root, CLAUDE_LOCAL_SETTINGS, JSON.stringify({
      permissions: { allow: ['Bash(git status)'], deny: ['Bash(rm -rf *)'] },
      hooks: { UserPromptSubmit: [] },
      env: { CLAUDE_CODE_SOMETHING: 'hand-placed' },
    }, null, 2));
    generate(root);
    const data = JSON.parse(readFileSync(join(root, CLAUDE_LOCAL_SETTINGS), 'utf8')) as Record<string, unknown>;
    expect(data.permissions).toEqual({ allow: ['Bash(git status)'], deny: ['Bash(rm -rf *)'] });
    expect(data.hooks).toEqual({ UserPromptSubmit: [] });
    expect((data.env as Record<string, string>).CLAUDE_CODE_SOMETHING).toBe('hand-placed');
    expect(Object.keys(data.env as object).sort()).toEqual(['CLAUDE_CODE_SOMETHING', 'N8N_API_KEY', 'SUPABASE_ACCESS_TOKEN']);
  });

  test('skips an allowlisted variable .env declares empty rather than writing an empty override', () => {
    const root = makeRoot();
    scaffold(root, 'SUPABASE_ACCESS_TOKEN=tk\nN8N_API_KEY=\n');
    const result = generate(root);
    expect(result.claude.skipped).toEqual(['N8N_API_KEY']);
    const data = JSON.parse(readFileSync(join(root, CLAUDE_LOCAL_SETTINGS), 'utf8')) as { env: Record<string, string> };
    expect('N8N_API_KEY' in data.env).toBe(false);
  });

  test('removes an entry it owns once .env stops giving it a value', () => {
    const root = makeRoot();
    scaffold(root, 'SUPABASE_ACCESS_TOKEN=tk\nN8N_API_KEY=n8n.invalid\n');
    generate(root);
    write(root, '.env', 'SUPABASE_ACCESS_TOKEN=tk\nN8N_API_KEY=\n');
    const result = generate(root);
    expect(result.claude.removed).toEqual(['N8N_API_KEY']);
    const data = JSON.parse(readFileSync(join(root, CLAUDE_LOCAL_SETTINGS), 'utf8')) as { env: Record<string, string> };
    expect('N8N_API_KEY' in data.env).toBe(false);
  });

  test('refuses to rewrite a settings file it cannot parse', () => {
    const root = makeRoot();
    scaffold(root, 'SUPABASE_ACCESS_TOKEN=tk\n');
    write(root, CLAUDE_LOCAL_SETTINGS, '{ broken');
    const { plan, content } = planClaudeSettings(root);
    expect(content).toBeNull();
    expect(plan.dirty).toBe(false);
    expect(readFileSync(join(root, CLAUDE_LOCAL_SETTINGS), 'utf8')).toBe('{ broken');
  });

  test('is idempotent: a second run writes nothing', () => {
    const root = makeRoot();
    scaffold(root, 'SUPABASE_ACCESS_TOKEN=tk\nN8N_API_KEY=n8n.invalid\n');
    generate(root);
    expect(generate(root).changed).toBe(false);
  });

  test('writes at mode 0600', () => {
    if (process.platform === 'win32') { return; }
    const root = makeRoot();
    scaffold(root, 'SUPABASE_ACCESS_TOKEN=tk\n');
    generate(root);
    expect(statSync(join(root, CLAUDE_LOCAL_SETTINGS)).mode & 0o777).toBe(0o600);
  });
});

describe('emitter B — .auth/opencode + opencode.jsonc', () => {
  test('writes one value file per referenced variable and rewrites the placeholders', () => {
    const root = makeRoot();
    scaffold(root, 'SUPABASE_ACCESS_TOKEN=tk\nN8N_API_KEY=n8n.invalid\n');
    const result = generate(root);
    expect(result.opencode.rewritten).toEqual(['N8N_API_KEY', 'SUPABASE_ACCESS_TOKEN']);
    const config = readFileSync(join(root, OPENCODE_CONFIG), 'utf8');
    expect(config).toContain(opencodeFileRef('SUPABASE_ACCESS_TOKEN'));
    expect(config).toContain(opencodeFileRef('N8N_API_KEY'));
    expect(config).not.toContain('{env:SUPABASE_ACCESS_TOKEN}');
    expect(readFileSync(join(root, OPENCODE_SECRET_DIR, 'SUPABASE_ACCESS_TOKEN'), 'utf8')).toBe('tk');
  });

  test('writes NO trailing newline, because {file:} substitutes contents verbatim', () => {
    const root = makeRoot();
    scaffold(root, 'SUPABASE_ACCESS_TOKEN=tk\n');
    generate(root);
    const raw = readFileSync(join(root, OPENCODE_SECRET_DIR, 'SUPABASE_ACCESS_TOKEN'), 'utf8');
    expect(raw.endsWith('\n')).toBe(false);
    expect(raw).toBe('tk');
  });

  test('keeps the config comments that document the MCP wiring', () => {
    const root = makeRoot();
    scaffold(root, 'SUPABASE_ACCESS_TOKEN=tk\n');
    generate(root);
    expect(readFileSync(join(root, OPENCODE_CONFIG), 'utf8')).toContain('Docs comment mentioning');
  });

  test('writes an EMPTY file rather than none, because a MISSING target invalidates the WHOLE OpenCode config', () => {
    const root = makeRoot();
    scaffold(root, 'SUPABASE_ACCESS_TOKEN=tk\nN8N_API_KEY=\n');
    generate(root);
    const target = join(root, OPENCODE_SECRET_DIR, 'N8N_API_KEY');
    expect(existsSync(target)).toBe(true);
    expect(readFileSync(target, 'utf8')).toBe('');
  });

  test('writes a file, and rewrites, for a variable the TEMPLATE declares even when .env omits it', () => {
    const root = makeRoot();
    // The fresh-clone guarantee: `.env` knows nothing about N8N_API_KEY, but
    // `.env.example` does, so the committed config's shape does not depend on
    // this developer's `.env` and the {file:} target still exists.
    scaffold(root, 'SUPABASE_ACCESS_TOKEN=tk\n');
    const result = generate(root);
    expect(result.opencode.write).toEqual(['N8N_API_KEY', 'SUPABASE_ACCESS_TOKEN']);
    expect(result.opencode.undeclared).toEqual([]);
    expect(readFileSync(join(root, OPENCODE_SECRET_DIR, 'N8N_API_KEY'), 'utf8')).toBe('');
    expect(readFileSync(join(root, OPENCODE_CONFIG), 'utf8')).toContain(opencodeFileRef('N8N_API_KEY'));
  });

  test('leaves {env:} alone for a variable the TEMPLATE never declares, rather than asserting a contract that does not exist', () => {
    const root = makeRoot();
    scaffold(root, 'SUPABASE_ACCESS_TOKEN=tk\n', 'SUPABASE_ACCESS_TOKEN=\n');
    const result = generate(root);
    expect(result.opencode.undeclared).toEqual(['N8N_API_KEY']);
    expect(existsSync(join(root, OPENCODE_SECRET_DIR, 'N8N_API_KEY'))).toBe(false);
    const config = readFileSync(join(root, OPENCODE_CONFIG), 'utf8');
    expect(config).toContain('{env:N8N_API_KEY}');
    expect(config).toContain(opencodeFileRef('SUPABASE_ACCESS_TOKEN'));
  });

  test('an undocumented variable is reported but does not fail the check, because nothing got worse', () => {
    const root = makeRoot();
    scaffold(root, 'SUPABASE_ACCESS_TOKEN=tk\n', 'SUPABASE_ACCESS_TOKEN=\n');
    generate(root);
    const result = check(root);
    expect(result.ok).toBe(true);
    const finding = result.findings.find(f => f.kind === 'undeclared');
    expect(finding?.names).toEqual(['N8N_API_KEY']);
    expect(finding?.blocking).toBe(false);
  });

  test('picks the variable up once the template declares it', () => {
    const root = makeRoot();
    scaffold(root, 'SUPABASE_ACCESS_TOKEN=tk\n', 'SUPABASE_ACCESS_TOKEN=\n');
    generate(root);
    write(root, '.env.example', 'SUPABASE_ACCESS_TOKEN=\nN8N_API_KEY=\n');
    const result = generate(root);
    expect(result.opencode.rewritten).toEqual(['N8N_API_KEY']);
    expect(readFileSync(join(root, OPENCODE_CONFIG), 'utf8')).toContain(opencodeFileRef('N8N_API_KEY'));
    expect(check(root).ok).toBe(true);
  });

  test('removes a stale value file nothing references any more', () => {
    const root = makeRoot();
    scaffold(root, 'SUPABASE_ACCESS_TOKEN=tk\nN8N_API_KEY=n8n.invalid\n');
    generate(root);
    write(root, `${OPENCODE_SECRET_DIR}/GONE_API_KEY`, 'leftover');
    const result = generate(root);
    expect(result.opencode.removed).toEqual(['GONE_API_KEY']);
    expect(existsSync(join(root, OPENCODE_SECRET_DIR, 'GONE_API_KEY'))).toBe(false);
  });

  test('writes value files at mode 0600 in a 0700 directory', () => {
    if (process.platform === 'win32') { return; }
    const root = makeRoot();
    scaffold(root, 'SUPABASE_ACCESS_TOKEN=tk\nN8N_API_KEY=n8n.invalid\n');
    generate(root);
    expect(statSync(join(root, OPENCODE_SECRET_DIR, 'SUPABASE_ACCESS_TOKEN')).mode & 0o777).toBe(0o600);
    expect(statSync(join(root, OPENCODE_SECRET_DIR)).mode & 0o777).toBe(0o700);
  });

  test('emits a POSIX reference path on every platform', () => {
    expect(opencodeFileRef('SUPABASE_ACCESS_TOKEN')).toBe('{file:.auth/opencode/SUPABASE_ACCESS_TOKEN}');
  });

  test('still recognises the variables after the rewrite has erased every {env:} form', () => {
    const root = makeRoot();
    scaffold(root, 'SUPABASE_ACCESS_TOKEN=tk\nN8N_API_KEY=n8n.invalid\n');
    generate(root);
    const config = readFileSync(join(root, OPENCODE_CONFIG), 'utf8');
    expect(config).not.toContain('{env:SUPABASE_ACCESS_TOKEN}');
    expect(config).not.toContain('{env:N8N_API_KEY}');
    // The comment's {env:VAR} prose survives, because the rewrite is driven by
    // the PARSED allowlist and `VAR` is not in it.
    expect(config).toContain('{env:VAR}');
    // The emitter erased its own input. The {file:} form must count as the same
    // declaration, or the next run deletes the value files it just wrote.
    expect(buildAllowlist(root).opencode).toEqual(['N8N_API_KEY', 'SUPABASE_ACCESS_TOKEN']);
    expect(generate(root).opencode.removed).toEqual([]);
  });
});

describe('ensureOpencodePlaceholders — the fresh-clone guarantee', () => {
  /** A COMMITTED config after the generator has run: `{file:}` references, no `.env` anywhere. */
  function scaffoldFreshClone(root: string): void {
    write(root, OPENCODE_CONFIG, [
      '{',
      '  // Comment naming {file:.auth/opencode/VAR} — noise, not a variable.',
      '  "mcp": {',
      `    "supabase": { "command": ["bunx", "--access-token", "${opencodeFileRef('SUPABASE_ACCESS_TOKEN')}"] },`,
      `    "n8n": { "environment": { "N8N_API_KEY": "${opencodeFileRef('N8N_API_KEY')}" } }`,
      '  }',
      '}',
      '',
    ].join('\n'));
  }

  test('creates an EMPTY file for every {file:} reference, because a MISSING target invalidates the whole config', () => {
    const root = makeRoot();
    scaffoldFreshClone(root);
    const result = ensureOpencodePlaceholders(root);
    expect(result.created).toEqual(['N8N_API_KEY', 'SUPABASE_ACCESS_TOKEN']);
    expect(result.kept).toEqual([]);
    expect(result.created).not.toContain('VAR');
    expect(readFileSync(join(root, OPENCODE_SECRET_DIR, 'SUPABASE_ACCESS_TOKEN'), 'utf8')).toBe('');
    expect(existsSync(join(root, '.env'))).toBe(false);
  });

  test('never overwrites an existing file: it may hold a real credential', () => {
    const root = makeRoot();
    scaffoldFreshClone(root);
    write(root, `${OPENCODE_SECRET_DIR}/SUPABASE_ACCESS_TOKEN`, 'real-value-literal');
    const result = ensureOpencodePlaceholders(root);
    expect(result.kept).toEqual(['SUPABASE_ACCESS_TOKEN']);
    expect(result.created).toEqual(['N8N_API_KEY']);
    expect(readFileSync(join(root, OPENCODE_SECRET_DIR, 'SUPABASE_ACCESS_TOKEN'), 'utf8')).toBe('real-value-literal');
  });

  test('is idempotent: a second run creates nothing', () => {
    const root = makeRoot();
    scaffoldFreshClone(root);
    ensureOpencodePlaceholders(root);
    const again = ensureOpencodePlaceholders(root);
    expect(again.created).toEqual([]);
    expect(again.kept).toEqual(['N8N_API_KEY', 'SUPABASE_ACCESS_TOKEN']);
  });

  test('writes at mode 0600, like every other value file', () => {
    if (process.platform === 'win32') { return; }
    const root = makeRoot();
    scaffoldFreshClone(root);
    ensureOpencodePlaceholders(root);
    expect(statSync(join(root, OPENCODE_SECRET_DIR, 'SUPABASE_ACCESS_TOKEN')).mode & 0o777).toBe(0o600);
  });

  test('reads a config with trailing commas, the shape Prettier writes for opencode.jsonc', () => {
    const root = makeRoot();
    write(root, OPENCODE_CONFIG, [
      '{',
      '  "mcp": {',
      `    "n8n": { "environment": { "N8N_API_KEY": "${opencodeFileRef('N8N_API_KEY')}", }, },`,
      '  },',
      '}',
      '',
    ].join('\n'));
    const result = ensureOpencodePlaceholders(root);
    expect(result.error).toBeUndefined();
    expect(result.created).toEqual(['N8N_API_KEY']);
  });

  test('does nothing, and says nothing broke, when there is no opencode.jsonc', () => {
    const root = makeRoot();
    const result = ensureOpencodePlaceholders(root);
    expect(result).toEqual({ created: [], kept: [] });
    expect(existsSync(join(root, OPENCODE_SECRET_DIR))).toBe(false);
  });
});

describe('worktree redirection', () => {
  test('emitter A writes the MAIN checkout, because that is the file Claude Code reads', () => {
    if (process.platform === 'win32') { return; }
    const parent = makeRoot();
    const main = join(parent, 'main');
    mkdirSync(main, { recursive: true });
    run(main, ['init', '-q']);
    run(main, ['-c', 'user.email=t@t.invalid', '-c', 'user.name=t', 'commit', '-q', '--allow-empty', '-m', 'init']);
    scaffold(main, 'SUPABASE_ACCESS_TOKEN=tk\nN8N_API_KEY=n8n.invalid\n');
    const wt = join(parent, 'wt');
    run(main, ['worktree', 'add', '-q', wt, '-b', 'probe']);
    scaffold(wt, 'SUPABASE_ACCESS_TOKEN=tk\nN8N_API_KEY=n8n.invalid\n');

    expect(claudeSettingsRoot(wt)).toBe(main);
    const result = generate(wt);
    expect(result.claude.redirectedToMainCheckout).toBe(true);
    // The credential lands where the harness looks...
    expect(existsSync(join(main, CLAUDE_LOCAL_SETTINGS))).toBe(true);
    // ...and NOT only in the worktree, where it would be a silent no-op.
    expect(existsSync(join(wt, CLAUDE_LOCAL_SETTINGS))).toBe(false);
    // Emitter B stays worktree-local: its {file:} paths resolve against the
    // worktree's own opencode.jsonc.
    expect(existsSync(join(wt, OPENCODE_SECRET_DIR, 'SUPABASE_ACCESS_TOKEN'))).toBe(true);
    expect(existsSync(join(main, OPENCODE_SECRET_DIR, 'SUPABASE_ACCESS_TOKEN'))).toBe(false);
  });

  test('warns, by NAME only, when the worktree .env disagrees with the main checkout', () => {
    if (process.platform === 'win32') { return; }
    const parent = makeRoot();
    const main = join(parent, 'main');
    mkdirSync(main, { recursive: true });
    run(main, ['init', '-q']);
    run(main, ['-c', 'user.email=t@t.invalid', '-c', 'user.name=t', 'commit', '-q', '--allow-empty', '-m', 'init']);
    scaffold(main, 'SUPABASE_ACCESS_TOKEN=main-value\nN8N_API_KEY=same\n');
    const wt = join(parent, 'wt');
    run(main, ['worktree', 'add', '-q', wt, '-b', 'probe']);
    scaffold(wt, 'SUPABASE_ACCESS_TOKEN=worktree-value\nN8N_API_KEY=same\n');

    const result = generate(wt);
    expect(result.claude.divergentFromMainCheckout).toEqual(['SUPABASE_ACCESS_TOKEN']);
    const finding = check(wt).findings.find(f => f.kind === 'worktree-divergence');
    expect(finding?.blocking).toBe(false);
    // A warning, never a block: diverging on purpose is legitimate, and this is a
    // limitation of how Claude Code resolves that file, not a broken setup.
    expect(check(wt).ok).toBe(true);
    const serialised = JSON.stringify(check(wt));
    expect(serialised).not.toContain('worktree-value');
    expect(serialised).not.toContain('main-value');
  });

  /** A main checkout holding a real env block, and one worktree of it with no `.env`. */
  function mainWithWorktree(): { main: string, wt: string, settings: string } {
    const parent = makeRoot();
    const main = join(parent, 'main');
    mkdirSync(main, { recursive: true });
    run(main, ['init', '-q']);
    run(main, ['-c', 'user.email=t@t.invalid', '-c', 'user.name=t', 'commit', '-q', '--allow-empty', '-m', 'init']);
    scaffold(main, 'SUPABASE_ACCESS_TOKEN=tk\nN8N_API_KEY=n8n.invalid\n');
    generate(main);
    const wt = join(parent, 'wt');
    run(main, ['worktree', 'add', '-q', wt, '-b', 'probe']);
    scaffold(wt, '');
    rmSync(join(wt, '.env'));
    return { main, wt, settings: join(main, CLAUDE_LOCAL_SETTINGS) };
  }

  test('refuses to write from a worktree with no .env, and leaves the main env block intact', () => {
    if (process.platform === 'win32') { return; }
    const { wt, settings } = mainWithWorktree();
    const before = readFileSync(settings, 'utf8');

    const result = generate(wt);
    expect(result.refused).toContain('bun run worktree:provision');
    expect(result.changed).toBe(false);
    expect(readFileSync(settings, 'utf8')).toBe(before);
    // Emitter B is held back too: nothing is written while the run is refused.
    expect(existsSync(join(wt, OPENCODE_SECRET_DIR))).toBe(false);
    // No override reaches a run with nothing to generate from.
    expect(generate(wt, { allowPrimaryRemoval: true }).refused).toBeDefined();
    expect(readFileSync(settings, 'utf8')).toBe(before);
  });

  test('refuses a worktree .env that would strip credentials from the main block, unless overridden', () => {
    if (process.platform === 'win32') { return; }
    const { wt, settings } = mainWithWorktree();
    // The shape an unprovisioned worktree invites: `.env` copied from the template.
    write(wt, '.env', 'SUPABASE_ACCESS_TOKEN=\nN8N_API_KEY=\n');
    const before = readFileSync(settings, 'utf8');

    const refused = generate(wt);
    expect(refused.refused).toContain('SUPABASE_ACCESS_TOKEN');
    expect(refused.refused).toContain('--allow-primary-removal');
    expect(JSON.stringify(refused)).not.toContain('n8n.invalid');
    expect(readFileSync(settings, 'utf8')).toBe(before);

    const allowed = generate(wt, { allowPrimaryRemoval: true });
    expect(allowed.refused).toBeUndefined();
    expect(allowed.claude.removed).toEqual(['N8N_API_KEY', 'SUPABASE_ACCESS_TOKEN']);
    expect(readFileSync(settings, 'utf8')).not.toContain('SUPABASE_ACCESS_TOKEN');
  });

  test('a provisioned worktree is not refused', () => {
    if (process.platform === 'win32') { return; }
    const { wt } = mainWithWorktree();
    write(wt, '.env', 'SUPABASE_ACCESS_TOKEN=tk\nN8N_API_KEY=n8n.invalid\n');
    expect(generate(wt).refused).toBeUndefined();
  });

  test('provisioning regenerates the worktree OpenCode files and never touches the main env block', () => {
    if (process.platform === 'win32') { return; }
    const { wt, settings } = mainWithWorktree();
    write(wt, '.env', 'SUPABASE_ACCESS_TOKEN=rotated-in-worktree\nN8N_API_KEY=n8n.invalid\n');
    const before = readFileSync(settings, 'utf8');

    const plan = writeOpencodeSurface(wt);
    expect(plan?.write).toEqual(['N8N_API_KEY', 'SUPABASE_ACCESS_TOKEN']);
    expect(readFileSync(join(wt, OPENCODE_SECRET_DIR, 'SUPABASE_ACCESS_TOKEN'), 'utf8')).toBe('rotated-in-worktree');
    expect(readFileSync(settings, 'utf8')).toBe(before);
    expect(JSON.stringify(plan)).not.toContain('rotated-in-worktree');
  });

  test('provisioning without a .env writes nothing and reports null', () => {
    const { wt } = mainWithWorktree();
    expect(writeOpencodeSurface(wt)).toBeNull();
    expect(existsSync(join(wt, OPENCODE_SECRET_DIR))).toBe(false);
  });

  test('a plain checkout is never redirected', () => {
    const root = makeRoot();
    scaffold(root, 'SUPABASE_ACCESS_TOKEN=tk\n');
    expect(claudeSettingsRoot(root)).toBe(root);
    expect(generate(root).claude.redirectedToMainCheckout).toBe(false);
  });

  function run(cwd: string, args: string[]): void {
    execFileSync('git', args, { cwd, stdio: ['ignore', 'ignore', 'ignore'] });
  }
});

describe('check', () => {
  test('passes right after a generate', () => {
    const root = makeRoot();
    scaffold(root, 'SUPABASE_ACCESS_TOKEN=tk\nN8N_API_KEY=n8n.invalid\n');
    generate(root);
    const result = check(root);
    expect(result.ok).toBe(true);
    expect(result.summary).toContain('emitted 2 of 2 declared variables');
  });

  test('fails when .env gains a value the surfaces do not have', () => {
    const root = makeRoot();
    scaffold(root, 'SUPABASE_ACCESS_TOKEN=tk\nN8N_API_KEY=n8n.invalid\n');
    generate(root);
    write(root, '.env', 'SUPABASE_ACCESS_TOKEN=rotated\nN8N_API_KEY=n8n.invalid\n');
    const result = check(root);
    expect(result.ok).toBe(false);
    expect(result.findings.some(f => f.kind === 'claude-stale' && f.names.includes('SUPABASE_ACCESS_TOKEN'))).toBe(true);
    expect(result.findings.some(f => f.kind === 'opencode-file-stale' && f.names.includes('SUPABASE_ACCESS_TOKEN'))).toBe(true);
  });

  test('fails when a new MCP variable appears in a config', () => {
    const root = makeRoot();
    scaffold(root, 'SUPABASE_ACCESS_TOKEN=tk\nN8N_API_KEY=n8n.invalid\nNEW_API_KEY=nk\n');
    generate(root);
    write(root, '.mcp.json', JSON.stringify({
      mcpServers: { extra: { command: 'bunx', args: ['-y', 'extra-mcp'], env: { NEW_API_KEY: dollarVar('NEW_API_KEY') } } },
    }, null, 2));
    const result = check(root);
    expect(result.ok).toBe(false);
    expect(result.findings.some(f => f.kind === 'claude-missing' && f.names.includes('NEW_API_KEY'))).toBe(true);
  });

  test('fails when opencode.jsonc still carries an {env:} placeholder', () => {
    const root = makeRoot();
    scaffold(root, 'SUPABASE_ACCESS_TOKEN=tk\nN8N_API_KEY=n8n.invalid\n');
    const result = check(root);
    expect(result.ok).toBe(false);
    expect(result.findings.some(f => f.kind === 'opencode-placeholder')).toBe(true);
  });

  test('fails, and says so, when there is no .env at all', () => {
    const root = makeRoot();
    scaffold(root, '');
    rmSync(join(root, '.env'));
    const result = check(root);
    expect(result.ok).toBe(false);
    expect(result.findings[0]?.kind).toBe('env-missing');
  });

  test('never carries a value in any finding', () => {
    const root = makeRoot();
    scaffold(root, 'SUPABASE_ACCESS_TOKEN=super-secret-literal\nN8N_API_KEY=n8n.invalid\n');
    const serialised = JSON.stringify(check(root));
    expect(serialised).not.toContain('super-secret-literal');
    expect(serialised).not.toContain('n8n.invalid');
  });

  test('the generate result is serialisable without carrying a value', () => {
    const root = makeRoot();
    scaffold(root, 'SUPABASE_ACCESS_TOKEN=super-secret-literal\nN8N_API_KEY=n8n.invalid\n');
    const serialised = JSON.stringify(generate(root, { dryRun: true }));
    expect(serialised).not.toContain('super-secret-literal');
    expect(serialised).not.toContain('n8n.invalid');
  });

  test('a dry run writes nothing', () => {
    const root = makeRoot();
    scaffold(root, 'SUPABASE_ACCESS_TOKEN=tk\nN8N_API_KEY=n8n.invalid\n');
    generate(root, { dryRun: true });
    expect(existsSync(join(root, CLAUDE_LOCAL_SETTINGS))).toBe(false);
    expect(existsSync(join(root, OPENCODE_SECRET_DIR))).toBe(false);
    expect(readFileSync(join(root, OPENCODE_CONFIG), 'utf8')).toContain('{env:SUPABASE_ACCESS_TOKEN}');
  });
});
