import type { ParityFinding, ParityInput, ParityMeta } from './updater-parity.ts';
import { existsSync, mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';

import { dirname, join } from 'node:path';

import { afterEach, describe, expect, test } from 'bun:test';
import {
  ABORTED_OUTRO,
  archivedSkillsToReport,
  buildParityFileBody,
  buildParityPrompt,
  collectParityFindings,
  compatErrorSuggestion,
  compatErrorSurface,
  configKeyDelta,
  configKeys,
  describeWatchedFile,
  diffNoIndex,
  diffStats,
  markdownSectionDelta,
  persistArchivedSkillMarkers,
  readGitStrategyStamp,
  renderParityReport,
  runVerdict,
  strictVerdict,
  SURFACE_ORDER,
} from './updater-parity.ts';

const temporaryRoots: string[] = [];

function temporaryRoot(): string {
  const root = mkdtempSync(join(tmpdir(), 'parity '));
  temporaryRoots.push(root);
  return root;
}

function write(root: string, relativePath: string, contents: string): void {
  const destination = join(root, relativePath);
  mkdirSync(dirname(destination), { recursive: true });
  writeFileSync(destination, contents);
}

afterEach(() => {
  while (temporaryRoots.length > 0) {
    const root = temporaryRoots.pop();
    if (root) { rmSync(root, { recursive: true, force: true }); }
  }
});

const META: ParityMeta = {
  templateRepo: 'upex-galaxy/agentic-dev-boilerplate',
  upstreamSha: 'abcdef1234567890',
  lockSha: '1234567abcdef',
  promptFile: '.agents/prompts/parity-plan.md',
};

const MANIFEST = JSON.stringify({
  version: 1,
  wrapperHosts: ['claude', 'opencode'],
  aliases: [{ alias: 'sync-ai-memory', skill: 'sync-ai-memory', mode: 'default', forwardArguments: true }],
});

/** A project + upstream pair with every finding type present. */
function fixture(): { root: string, upstream: string, input: ParityInput } {
  const root = temporaryRoot();
  const upstream = temporaryRoot();

  // Instructions: upstream added a section, changed one, project has its own.
  write(root, 'AGENTS.md', '# Memory\n\n## 1. RULES\n\nold rule\n\n## 9. ACME ONLY\n\nours\n');
  write(upstream, 'AGENTS.md', '# Memory\n\n## 1. RULES\n\nnew rule\n\n## 5.5 MULTI-HARNESS\n\nthree hosts\n');

  // Hooks/config: project keeps its own permission entries, upstream added a key.
  write(root, '.claude/settings.json', JSON.stringify({ permissions: { allow: ['Bash(bun *)'] }, hooks: {} }, null, 2));
  write(upstream, '.claude/settings.json', JSON.stringify({ permissions: { allow: [], deny: [] }, hooks: {}, env: {} }, null, 2));

  // MCP: the Codex registry drifted (upstream added n8n) AND fails the set contract.
  write(root, '.codex/config.toml', '[mcp_servers.context7]\ncommand = "x"\n\n[mcp_servers.acme]\ncommand = "y"\n');
  write(upstream, '.codex/config.toml', '[mcp_servers.context7]\ncommand = "x"\n\n[mcp_servers.n8n]\ncommand = "z"\n');

  // Commands: one manifest wrapper, one overlay wrapper, one rogue wrapper per
  // host. The compat check names the Claude one; the OpenCode one is found by
  // the disk scan alone (as when the check could not run).
  write(upstream, '.agents/compatibility/command-aliases.json', MANIFEST);
  write(root, '.agents/compatibility/command-aliases.json', MANIFEST);
  write(root, '.agents/compatibility/command-aliases.project.json', JSON.stringify({ version: 1, aliases: [{ alias: 'acme-deploy' }] }));
  write(root, '.claude/commands/sync-ai-memory.md', 'wrapper\n');
  write(root, '.claude/commands/acme-deploy.md', 'overlay wrapper\n');
  write(root, '.claude/commands/rogue.md', 'nobody produced this\n');
  write(root, '.opencode/commands/rogue.md', 'nobody produced this\n');

  // Skills: the migration archived a colliding copy.
  write(root, '.agents/skills/acli/SKILL.md', '---\nname: acli\n---\nupstream body\n');
  write(root, '.template/pre-agents-migration/skills/acli/SKILL.md', '---\nname: acli\n---\nproject body\n');

  // Git: shipped default nobody chose.
  write(root, '.agents/project.yaml', 'git_strategy:\n  strategy: solo-main\n  meta:\n    strategy_source: inherited\n');

  const input: ParityInput = {
    root,
    upstreamDir: upstream,
    drift: [
      { path: 'AGENTS.md', reason: 'memory' },
      { path: '.claude/settings.json', reason: 'permissions' },
      { path: '.codex/config.toml', reason: 'codex mcp registry' },
    ],
    compatErrors: [
      'MCP n8n missing from codex: declared in .mcp.json, absent from .codex/config.toml',
      'MCP acme present in codex only: declare it in .mcp.json or remove it from .codex/config.toml',
      'claude command wrapper contains workflow prose: .claude/commands/sync-ai-memory.md',
      'Command wrapper not declared in any manifest: .claude/commands/rogue.md; add it to .agents/compatibility/command-aliases.project.json or delete it',
      'claude hook command must be exactly: node "$CLAUDE_PROJECT_DIR/.agents/hooks/personality-reinject.mjs"',
    ],
    archivedSkills: ['acli'],
    archivedSkillsDir: join(root, '.template/pre-agents-migration/skills'),
    heldBack: [{ component: 'cli', lockCommit: 'deadbeefcafe' }, { component: 'docs', lockCommit: null }],
    envNewKeys: ['N8N_API_KEY', 'RESEND_API_KEY'],
  };
  return { root, upstream, input };
}

describe('section-level evidence', () => {
  test('markdown delta reports headings added upstream, changed, and project-only', () => {
    const delta = markdownSectionDelta(
      '# T\n\n## A\n\nsame\n\n## B\n\nmine\n\n## C\n\nours\n',
      '# T\n\n## A\n\nsame\n\n## B\n\ntheirs\n\n## D\n\nnew\n',
    );
    expect(delta.added).toEqual(['D']);
    expect(delta.changed).toEqual(['B']);
    expect(delta.removed).toEqual(['C']);
  });

  test('config keys go two levels deep for JSON, JSONC, TOML and YAML', () => {
    expect(configKeys('{"mcpServers":{"n8n":{}},"x":1}', '.mcp.json')).toEqual(['mcpServers', 'mcpServers.n8n', 'x']);
    expect(configKeys('{\n  // c\n  "mcp": { "n8n": {}, },\n}', 'opencode.jsonc')).toEqual(['mcp', 'mcp.n8n']);
    expect(configKeys('[mcp_servers.n8n]\ncommand = "x"\n', '.codex/config.toml')).toEqual(['mcp_servers', 'mcp_servers.n8n']);
    expect(configKeys('testing:\n  default_env: staging\ngit_strategy:\n  strategy: solo-main\n', '.agents/project.yaml'))
      .toEqual(['testing', 'testing.default_env', 'git_strategy', 'git_strategy.strategy']);
    expect(configKeys('export default {}', 'eslint.config.js')).toBeNull();
  });

  test('key delta separates upstream additions from project-only keys', () => {
    expect(configKeyDelta(['a', 'b.x'], ['a', 'b.y'])).toEqual({ added: ['b.y'], projectOnly: ['b.x'] });
  });

  test('watched-file evidence names sections for markdown and keys for config, plus hunk counts', () => {
    const diff = '--- a\n+++ b\n@@ -1 +1 @@\n-old\n+new\n@@ -5 +5 @@\n+added\n';
    expect(diffStats(diff)).toEqual({ hunks: 2, added: 2, removed: 1 });
    const md = describeWatchedFile('AGENTS.md', '## A\n\nx\n', '## A\n\ny\n\n## B\n\nz\n', diff);
    expect(md).toBe('upstream added 1 heading(s): "B"; changed 1: "A"; 2 hunks (+2/-1)');
    const json = describeWatchedFile('.mcp.json', '{"mcpServers":{"a":{}}}', '{"mcpServers":{"a":{},"b":{}}}', diff);
    expect(json).toBe('upstream added key(s): "mcpServers.b"; 2 hunks (+2/-1)');
    expect(describeWatchedFile('eslint.config.js', 'a', 'b', diff)).toBe('content differs; 2 hunks (+2/-1)');
  });
});

describe('compat error classification', () => {
  test('surface and suggestion follow the wording', () => {
    expect(compatErrorSurface('claude command wrapper contains workflow prose: .claude/commands/x.md')).toBe('commands');
    expect(compatErrorSuggestion('claude command wrapper contains workflow prose: .claude/commands/x.md')).toBe('run agents:compat');
    expect(compatErrorSurface('Claude skills alias missing: .claude/skills')).toBe('skills');
    expect(compatErrorSuggestion('Claude skills alias missing: .claude/skills')).toBe('run agents:compat');
    expect(compatErrorSurface('codex hook command must be exactly: …')).toBe('hooks');
    expect(compatErrorSuggestion('codex hook command must be exactly: …')).toBe('take upstream');
    expect(compatErrorSurface('opencode MCP n8n mismatch: expected {…}, found {…}')).toBe('mcp');
    const stray = 'Command wrapper not declared in any manifest: .claude/commands/stray.md; add it to .agents/compatibility/command-aliases.project.json or delete it';
    expect(compatErrorSurface(stray)).toBe('commands');
    expect(compatErrorSuggestion(stray)).toBe('add to overlay');
  });
});

describe('diffNoIndex', () => {
  test('relabels the two absolute paths as project/ and upstream/, forward slashes included', () => {
    const root = temporaryRoot();
    write(root, 'a/AGENTS.md', '# one\n');
    write(root, 'b/AGENTS.md', '# two\n');
    const diff = diffNoIndex(join(root, 'a', 'AGENTS.md'), join(root, 'b', 'AGENTS.md'));
    expect(diff).toContain('--- a/project/AGENTS.md');
    expect(diff).toContain('+++ b/upstream/AGENTS.md');
    expect(diff).not.toContain(root);
    // A Windows-style caller path is normalized before the relabel, so the
    // forward-slash header git prints still matches it.
    const windowsStyle = diffNoIndex(join(root, 'a', 'AGENTS.md').replace(/\//g, '\\'), join(root, 'b', 'AGENTS.md').replace(/\//g, '\\'));
    if (windowsStyle !== '') { expect(windowsStyle).not.toContain(root); }
  });
});

describe('collectParityFindings', () => {
  test('produces one finding per type, sequential ids, evidence on every row', () => {
    const { input } = fixture();
    const findings = collectParityFindings(input);

    expect(findings.map(f => f.id)).toEqual(findings.map((_, i) => i + 1));
    for (const f of findings) { expect(f.evidence.length).toBeGreaterThan(0); }

    const byPath = (p: string): ParityFinding => {
      const f = findings.find(x => x.path === p);
      if (!f) { throw new Error(`no finding for ${p}: ${findings.map(x => x.path).join(', ')}`); }
      return f;
    };

    const agents = byPath('AGENTS.md');
    expect(agents.surface).toBe('instructions');
    expect(agents.blocking).toBe(false);
    expect(agents.suggested).toBe('merge');
    expect(agents.evidence).toContain('upstream added 1 heading(s): "5.5 MULTI-HARNESS"');
    expect(agents.evidence).toContain('changed 1: "1. RULES"');
    expect(agents.evidence).toContain('project-only 1: "9. ACME ONLY"');
    expect(agents.evidence).toMatch(/\d+ hunks? \(\+\d+\/-\d+\)$/);
    expect(agents.diff).toContain('@@');

    const settings = byPath('.claude/settings.json');
    expect(settings.surface).toBe('hooks');
    expect(settings.evidence).toContain('upstream added key(s): "permissions.deny", "env"');
    expect(settings.diff).toContain('-      "Bash(bun *)"');

    // MCP set errors fold into one row per host, and the watched-file drift on
    // the same path folds into THAT row: compat evidence first, drift evidence
    // appended, the full diff kept, upstream's shape suggested.
    const codex = byPath('.codex/config.toml');
    expect(codex.surface).toBe('mcp');
    expect(codex.blocking).toBe(true);
    expect(codex.evidence).toMatch(/^missing: n8n \(declared in \.mcp\.json\); only here: acme \(not in \.mcp\.json\); upstream added key\(s\): "mcp_servers\.n8n"; project-only key\(s\): "mcp_servers\.acme"; \d+ hunks? \(\+\d+\/-\d+\)$/);
    expect(codex.suggested).toBe('take upstream');
    expect(codex.diff).toContain('+[mcp_servers.n8n]');
    expect(findings.filter(f => f.path === '.codex/config.toml')).toHaveLength(1);
    expect(findings.filter(f => f.surface === 'mcp')).toHaveLength(1);

    const wrapper = byPath('.claude/commands/sync-ai-memory.md');
    expect(wrapper.surface).toBe('commands');
    expect(wrapper.blocking).toBe(true);
    expect(wrapper.suggested).toBe('run agents:compat');

    const hook = findings.find(f => f.surface === 'hooks' && f.blocking);
    expect(hook?.suggested).toBe('take upstream');

    const archived = byPath('.template/pre-agents-migration/skills/acli');
    expect(archived.surface).toBe('skills');
    expect(archived.evidence).toMatch(/^archived collision vs \.agents\/skills\/acli: 1 hunk \(\+1\/-1\)$/);
    expect(archived.suggested).toBe('decide');
    expect(archived.diff).toContain('project body');

    // A stray wrapper is ONE row per path: the one the compat check named is
    // blocking, the one only the disk scan found is not; both say `add to overlay`.
    const rogue = findings.filter(f => f.surface === 'commands' && f.suggested === 'add to overlay');
    expect(rogue.map(f => [f.path, f.blocking])).toEqual([['.claude/commands/rogue.md', true], ['.opencode/commands/rogue.md', false]]);
    for (const f of rogue) { expect(f.evidence).toBe('wrapper not produced by .agents/compatibility/command-aliases.json nor .agents/compatibility/command-aliases.project.json'); }
    expect(findings.some(f => f.path === '.claude/commands/acme-deploy.md')).toBe(false);

    const held = byPath('.template/boilerplate.lock.json');
    expect(held.surface).toBe('components');
    expect(held.evidence).toBe('held back: cli@deadbee, docs@no lock');

    const env = byPath('.env');
    expect(env.surface).toBe('env');
    expect(env.evidence).toBe('upstream .env.example added 2 key(s): N8N_API_KEY, RESEND_API_KEY');

    const git = byPath('.agents/project.yaml');
    expect(git.surface).toBe('git');
    expect(git.evidence).toContain('strategy_source: inherited');
    expect(git.blocking).toBe(false);
  });

  test('a fully aligned project yields zero findings', () => {
    const root = temporaryRoot();
    const upstream = temporaryRoot();
    write(root, '.agents/compatibility/command-aliases.json', MANIFEST);
    write(upstream, '.agents/compatibility/command-aliases.json', MANIFEST);
    write(root, '.claude/commands/sync-ai-memory.md', 'wrapper\n');
    write(root, '.agents/project.yaml', 'git_strategy:\n  strategy: solo-main\n  meta:\n    strategy_source: chosen\n');
    const findings = collectParityFindings({
      root,
      upstreamDir: upstream,
      drift: [],
      compatErrors: [],
      archivedSkills: [],
      archivedSkillsDir: join(root, '.template/pre-agents-migration/skills'),
      heldBack: [],
      envNewKeys: [],
    });
    expect(findings).toEqual([]);
  });

  test('stray wrappers need a manifest to compare against', () => {
    const root = temporaryRoot();
    write(root, '.claude/commands/anything.md', 'x\n');
    const findings = collectParityFindings({
      root,
      upstreamDir: temporaryRoot(),
      drift: [],
      compatErrors: [],
      archivedSkills: [],
      archivedSkillsDir: join(root, '.template/pre-agents-migration/skills'),
      heldBack: [],
      envNewKeys: [],
    });
    expect(findings.filter(f => f.surface === 'commands')).toEqual([]);
  });

  test('archived skills nudge once: this run, plus unreported archive entries, until their marker exists', () => {
    const root = temporaryRoot();
    const archive = join(root, '.template/pre-agents-migration/skills');
    write(root, '.template/pre-agents-migration/skills/acli/SKILL.md', 'old\n');
    write(root, '.template/pre-agents-migration/skills/old-one/SKILL.md', 'older\n');

    // The migration archived `acli` this run; `old-one` sits there from an
    // earlier run that never reported it. Both get their one nudge.
    expect(archivedSkillsToReport(root, archive, ['acli'])).toEqual(['acli', 'old-one']);
    persistArchivedSkillMarkers(root, ['acli', 'old-one']);
    expect(existsSync(join(root, '.template/upstream-sha/archived-skill-acli.marker'))).toBe(true);

    // Next run: the archive dir is still on disk, no migration result, no row.
    expect(archivedSkillsToReport(root, archive, [])).toEqual([]);
    // A fresh archive of the same name (marker present) stays quiet; a new name does not.
    write(root, '.template/pre-agents-migration/skills/newer/SKILL.md', 'x\n');
    expect(archivedSkillsToReport(root, archive, ['acli', 'newer'])).toEqual(['newer']);
    // No archive dir at all: only this run's names.
    expect(archivedSkillsToReport(temporaryRoot(), join(root, 'nope'), ['x'])).toEqual(['x']);
  });

  test('git strategy stamp reads block presence, strategy and provenance', () => {
    expect(readGitStrategyStamp(null)).toEqual({ present: false, strategy: null, source: null });
    expect(readGitStrategyStamp('name: x\n')).toEqual({ present: false, strategy: null, source: null });
    expect(readGitStrategyStamp('git_strategy:\n  strategy: gitflow # c\n  meta:\n    strategy_source: chosen\n'))
      .toEqual({ present: true, strategy: 'gitflow', source: 'chosen' });
  });
});

describe('renderParityReport', () => {
  test('table has every surface with ok / warn / blocked, prompt carries the WAIT contract, file body carries the diffs', () => {
    const { input } = fixture();
    const findings = collectParityFindings(input);
    const report = renderParityReport(findings, META);

    expect(report.surfaces.map(r => r.surface)).toEqual(SURFACE_ORDER);
    const state = Object.fromEntries(report.surfaces.map(r => [r.surface, r.state]));
    expect(state).toEqual({
      instructions: 'warn',
      skills: 'warn',
      commands: 'blocked',
      hooks: 'blocked',
      mcp: 'blocked',
      env: 'warn',
      components: 'warn',
      git: 'warn',
    });
    expect(report.surfaces.map(r => r.label)).toEqual(['Instrucciones y config', 'Skills', 'Comandos', 'Hooks', 'MCP', 'Env', 'Componentes', 'Git']);
    expect(report.surfaces.find(r => r.surface === 'mcp')?.cell).toBe('1 hallazgo: .codex/config.toml');

    const prompt = report.prompt;
    expect(prompt.startsWith('Parity review after `bun run up` (upstream upex-galaxy/agentic-dev-boilerplate@abcdef1, project lock 1234567).')).toBe(true);
    expect(prompt).toContain('WAIT for a decision per row');
    expect(prompt).toContain('(keep project | take upstream | merge) BEFORE editing anything');
    expect(prompt).toContain('| # | Surface | File | What differs (evidence) | Suggested |');
    expect(prompt).toContain('| 1 | Instructions | AGENTS.md | upstream added 1 heading(s): "5.5 MULTI-HARNESS"');
    expect(prompt).toMatch(/\| MCP \| \.codex\/config\.toml \| missing: n8n \(declared in \.mcp\.json\); only here: acme \(not in \.mcp\.json\); upstream added key\(s\): "mcp_servers\.n8n"[^|]* \| take upstream \(BLOCKING\) \|/);
    expect(prompt.trimEnd().endsWith('Post-merge: bun run agents:compat && bun run agents:compat:check && bun run repo:check')).toBe(true);
    // Scannable: never the diff itself, never rule numbers.
    expect(prompt).not.toContain('@@');
    expect(prompt).not.toMatch(/Rule #\d/);

    const body = report.fileBody;
    expect(body).toContain('AUTO-GENERATED, SINGLE-USE');
    expect(body).toContain('### 1. AGENTS.md');
    expect(body).toContain('### 2. .claude/settings.json');
    expect(body).toContain('```diff');
    expect(body).toContain('+## 5.5 MULTI-HARNESS');
    expect(buildParityFileBody(findings, META)).toBe(body);
  });

  test('the raw-URL hint appears for a GitHub handle only, never for a local upstream path', () => {
    expect(buildParityPrompt([], META)).toContain('https://raw.githubusercontent.com/upex-galaxy/agentic-dev-boilerplate/main/<path>');
    expect(buildParityPrompt([], { ...META, templateRepo: '/tmp/upstream' })).not.toContain('raw.githubusercontent.com');
  });

  test('zero findings render an all-ok table and an empty prompt table', () => {
    const report = renderParityReport([], META);
    expect(report.surfaces.every(r => r.state === 'ok' && r.cell === 'sin diferencias')).toBe(true);
    expect(buildParityPrompt([], META)).not.toContain('| 1 |');
  });

  test('pipes and newlines inside evidence never break the markdown table', () => {
    const prompt = buildParityPrompt([{
      id: 1,
      surface: 'hooks',
      path: '.claude/settings.json',
      evidence: 'a | b\nc',
      suggested: 'merge',
      blocking: false,
    }], META);
    expect(prompt).toContain('| 1 | Hooks | .claude/settings.json | a \\| b c | merge |');
  });
});

describe('strictVerdict', () => {
  const blocking: ParityFinding = { id: 1, surface: 'mcp', path: '.codex/config.toml', evidence: 'missing: n8n', suggested: 'take upstream', blocking: true };
  const drift: ParityFinding = { id: 2, surface: 'instructions', path: 'AGENTS.md', evidence: 'changed 1: "x"', suggested: 'merge', blocking: false };

  test('default mode never fails, whatever the findings', () => {
    expect(strictVerdict(false, [blocking, drift])).toEqual({ exitCode: 0, reason: null });
  });

  test('--strict fails only on blocking findings; watched-file drift alone passes', () => {
    expect(strictVerdict(true, [drift])).toEqual({ exitCode: 0, reason: null });
    expect(strictVerdict(true, [])).toEqual({ exitCode: 0, reason: null });
    const verdict = strictVerdict(true, [blocking, drift]);
    expect(verdict.exitCode).toBe(1);
    expect(verdict.reason).toContain('1 hallazgo(s) bloqueante(s)');
    expect(verdict.reason).toContain('.codex/config.toml');
    expect(verdict.reason?.split('\n')).toHaveLength(1);
  });

  test('an aborted run exits 1 with `Abortado.` in every mode, and never reads as completed', () => {
    for (const mode of [{ dryRun: false, strict: false }, { dryRun: false, strict: true }, { dryRun: true, strict: false }]) {
      const verdict = runVerdict({ aborted: true, ...mode }, [blocking]);
      expect(verdict).toEqual({ exitCode: 1, reason: null, outro: ABORTED_OUTRO });
      expect(verdict.outro).toBe('Abortado.');
    }
  });

  test('a completed run keeps the strict semantics and names its mode in the outro', () => {
    expect(runVerdict({ aborted: false, dryRun: false, strict: false }, [blocking]))
      .toEqual({ exitCode: 0, reason: null, outro: 'Sincronizacion completada.' });
    expect(runVerdict({ aborted: false, dryRun: true, strict: false }, []))
      .toEqual({ exitCode: 0, reason: null, outro: 'Dry-run completado.' });
    const strict = runVerdict({ aborted: false, dryRun: false, strict: true }, [blocking, drift]);
    expect(strict.exitCode).toBe(1);
    expect(strict.reason).toContain('--strict');
    expect(strict.outro).toBe('Sincronizacion completada con contratos rotos (--strict).');
    expect(runVerdict({ aborted: false, dryRun: false, strict: true }, [drift]).exitCode).toBe(0);
  });
});
