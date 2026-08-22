import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { afterEach, beforeEach, describe, expect, test } from 'bun:test';

import { parseArgs } from '../src/args.ts';
import { buildTarArgs } from '../src/download.ts';
import { CliError } from '../src/errors.ts';
import { pruneBootstrapExcludes, resetGitStrategyMeta, rewriteProjectYaml, sanitizeProjectName } from '../src/prepare.ts';

describe('buildTarArgs', () => {
  // `--force-local` is GNU-only; bsdtar (macOS, and C:\Windows\System32\tar.exe
  // on Windows 10 1803+ / 11) aborts with "Option --force-local is not supported".
  test('never passes --force-local, on any platform', () => {
    expect(buildTarArgs('/tmp/target')).not.toContain('--force-local');
  });

  test('passes the tarball as a bare relative name (no drive colon for GNU tar)', () => {
    const args = buildTarArgs('/tmp/target');
    const file = args[args.indexOf('-xzf') + 1];
    expect(file).toBe('template.tar.gz');
    expect(file).not.toContain(':');
    expect(file).not.toContain('/');
  });

  test('strips the GitHub wrapper directory', () => {
    expect(buildTarArgs('/tmp/target')).toContain('--strip-components=1');
  });

  test('passes the target directory to -C', () => {
    const args = buildTarArgs('/tmp/target');
    expect(args[args.indexOf('-C') + 1]).toBe('/tmp/target');
  });
});

describe('rewriteProjectYaml', () => {
  let dir: string;

  // Mirrors the real .agents/project.yaml shape: the field is `project_name`,
  // NOT `name`. Targeting the wrong key used to no-op silently on every scaffold.
  const TEMPLATE_YAML = [
    'project:',
    '  project_name: null # TODO: fill per project',
    '  project_key: null # TODO: fill per project',
    '  other: keep-me',
    '',
  ].join('\n');

  beforeEach(() => {
    dir = mkdtempSync(join(tmpdir(), 'cad-yaml-'));
    mkdirSync(join(dir, '.agents'), { recursive: true });
    writeFileSync(join(dir, '.agents', 'project.yaml'), TEMPLATE_YAML);
  });

  afterEach(() => {
    rmSync(dir, { recursive: true, force: true });
  });

  function readYaml(): string {
    return readFileSync(join(dir, '.agents', 'project.yaml'), 'utf8');
  }

  test('writes project_name, the field the template actually declares', async () => {
    await rewriteProjectYaml(dir, { projectName: 'my-app' });

    expect(readYaml()).toContain('  project_name: my-app');
    expect(readYaml()).not.toContain('project_name: null');
  });

  test('writes project_key only when one is provided', async () => {
    await rewriteProjectYaml(dir, { projectName: 'my-app' });
    expect(readYaml()).toContain('  project_key: null');

    await rewriteProjectYaml(dir, { projectName: 'my-app', projectKey: 'ACME' });
    expect(readYaml()).toContain('  project_key: ACME');
  });

  test('leaves unrelated fields untouched', async () => {
    await rewriteProjectYaml(dir, { projectName: 'my-app', projectKey: 'ACME' });
    expect(readYaml()).toContain('  other: keep-me');
  });

  test('does not throw when the field is absent', async () => {
    writeFileSync(join(dir, '.agents', 'project.yaml'), 'project:\n  unrelated: x\n');
    await rewriteProjectYaml(dir, { projectName: 'my-app' });
    expect(readYaml()).toContain('  unrelated: x');
  });
});

describe('resetGitStrategyMeta', () => {
  let dir: string;

  // Mirrors the shape the boilerplate ships: strategy VALUES plus the
  // maintainer's own provenance stamps and an accepted_divergences entry that
  // names THIS repo's ruleset — false in any scaffolded consumer project.
  const TEMPLATE_YAML = [
    'project:',
    '  project_name: null',
    '',
    'git_strategy:',
    '  strategy: solo-main # DEFAULT, not a decision',
    '  branches:',
    '    production: main',
    '  protected: [main]',
    '  policy:',
    '    direct_push_to_protected: allowed',
    '    admin_bypass: true',
    '    require_pr_reviews: 1',
    '    # Host divergences that are ACCEPTED, not drift.',
    '    # verify moves matching findings from DRIFT to ACCEPTED.',
    '    accepted_divergences:',
    '      - field: main.direct_push_to_protected',
    '        enforced: blocked (pull_request rule)',
    '        accepted: 2026-08-21',
    '        reason: >',
    '          The ProtectPublic ruleset requires a PR; the admin credential bypasses it.',
    '  meta:',
    '    setup_version: 1',
    '    created: 2026-06-20',
    '    policy_verified: 2026-08-21 # YYYY-MM-DD of the last verify. null = never reconciled',
    '    policy_source: accepted # verified | accepted | declared',
    '    strategy_source: chosen # inherited | chosen',
    '',
    'environments:',
    '  local:',
    '    web_url: null',
    '',
  ].join('\n');

  beforeEach(() => {
    dir = mkdtempSync(join(tmpdir(), 'cad-gitstrat-'));
    mkdirSync(join(dir, '.agents'), { recursive: true });
    writeFileSync(join(dir, '.agents', 'project.yaml'), TEMPLATE_YAML);
  });

  afterEach(() => {
    rmSync(dir, { recursive: true, force: true });
  });

  function readYaml(): string {
    return readFileSync(join(dir, '.agents', 'project.yaml'), 'utf8');
  }

  test('resets provenance to inherited/declared/null', async () => {
    await resetGitStrategyMeta(dir);
    const yaml = readYaml();
    expect(yaml).toContain('strategy_source: inherited');
    expect(yaml).not.toContain('strategy_source: chosen');
    expect(yaml).toContain('policy_source: declared');
    expect(yaml).not.toContain('policy_source: accepted');
    expect(yaml).toContain('policy_verified: null');
    expect(yaml).not.toContain('policy_verified: 2026-08-21');
  });

  test('removes the accepted_divergences block (entries name the boilerplate ruleset)', async () => {
    await resetGitStrategyMeta(dir);
    const yaml = readYaml();
    expect(yaml).not.toContain('accepted_divergences');
    expect(yaml).not.toContain('main.direct_push_to_protected');
    expect(yaml).not.toContain('ProtectPublic');
    // Its contiguous comment header goes with it.
    expect(yaml).not.toContain('Host divergences that are ACCEPTED');
  });

  test('keeps the strategy and policy VALUES as shipped', async () => {
    await resetGitStrategyMeta(dir);
    const yaml = readYaml();
    expect(yaml).toContain('strategy: solo-main');
    expect(yaml).toContain('direct_push_to_protected: allowed');
    expect(yaml).toContain('admin_bypass: true');
    expect(yaml).toContain('require_pr_reviews: 1');
    expect(yaml).toContain('protected: [main]');
  });

  test('preserves inline comments on the reset leaves', async () => {
    await resetGitStrategyMeta(dir);
    const yaml = readYaml();
    expect(yaml).toContain('strategy_source: inherited # inherited | chosen');
    expect(yaml).toContain('policy_source: declared # verified | accepted | declared');
  });

  test('leaves surrounding sections untouched', async () => {
    await resetGitStrategyMeta(dir);
    const yaml = readYaml();
    expect(yaml).toContain('project:');
    expect(yaml).toContain('environments:');
    expect(yaml).toContain('web_url: null');
  });

  test('is a no-op on a template without the git_strategy block', async () => {
    writeFileSync(join(dir, '.agents', 'project.yaml'), 'project:\n  project_name: null\n');
    await resetGitStrategyMeta(dir);
    expect(readYaml()).toBe('project:\n  project_name: null\n');
  });

  test('does not throw when project.yaml is absent', async () => {
    rmSync(join(dir, '.agents', 'project.yaml'));
    await resetGitStrategyMeta(dir);
    expect(existsSync(join(dir, '.agents', 'project.yaml'))).toBe(false);
  });
});

describe('parseArgs', () => {
  test('accepts a project name as positional', () => {
    const a = parseArgs(['my-app']);
    expect(a.projectName).toBe('my-app');
    expect(a.here).toBe(false);
    expect(a.template).toBe('main');
  });

  test('rejects missing project name without --here', () => {
    expect(() => parseArgs([])).toThrow(CliError);
  });

  test('accepts --here without a name', () => {
    const a = parseArgs(['--here']);
    expect(a.here).toBe(true);
    expect(a.projectName).toBeUndefined();
  });

  test('parses --template and --template-repo', () => {
    const a = parseArgs(['my-app', '--template', 'develop', '--template-repo', 'fork/agentic-dev-boilerplate']);
    expect(a.template).toBe('develop');
    expect(a.templateRepo).toBe('fork/agentic-dev-boilerplate');
  });

  test('parses skip flags', () => {
    const a = parseArgs(['my-app', '--no-install', '--no-setup', '--no-git']);
    expect(a.noInstall).toBe(true);
    expect(a.noSetup).toBe(true);
    expect(a.noGit).toBe(true);
  });

  test('rejects unknown flag', () => {
    expect(() => parseArgs(['--bogus'])).toThrow(CliError);
  });

  test('rejects flag missing value', () => {
    expect(() => parseArgs(['my-app', '--template'])).toThrow(CliError);
  });
});

describe('sanitizeProjectName', () => {
  test('lowercases and replaces invalid chars', () => {
    expect(sanitizeProjectName('My App!')).toBe('my-app');
  });

  test('collapses repeated dashes', () => {
    expect(sanitizeProjectName('foo---bar')).toBe('foo-bar');
  });

  test('trims leading/trailing dashes', () => {
    expect(sanitizeProjectName('-foo-')).toBe('foo');
  });

  test('clamps to 214 chars', () => {
    const long = 'a'.repeat(300);
    expect(sanitizeProjectName(long).length).toBeLessThanOrEqual(214);
  });
});

describe('pruneBootstrapExcludes', () => {
  let dir: string;

  beforeEach(() => {
    dir = mkdtempSync(join(tmpdir(), 'cad-test-'));
  });

  afterEach(() => {
    rmSync(dir, { recursive: true, force: true });
  });

  test('removes hardcoded paths and preserves unrelated files', async () => {
    // `packages` is one of TEMPLATE_EXCLUDES — it must be pruned.
    mkdirSync(join(dir, 'packages', 'foo'), { recursive: true });
    writeFileSync(join(dir, 'packages', 'foo', 'a.ts'), '// a');
    writeFileSync(join(dir, 'keep.txt'), 'keep me');

    await pruneBootstrapExcludes(dir);

    expect(existsSync(join(dir, 'packages'))).toBe(false);
    expect(existsSync(join(dir, 'keep.txt'))).toBe(true);
  });

  test('is a no-op when none of the excluded paths exist', async () => {
    writeFileSync(join(dir, 'keep.txt'), 'keep me');
    await pruneBootstrapExcludes(dir);
    expect(existsSync(join(dir, 'keep.txt'))).toBe(true);
  });

  // The boilerplate's own release history must not travel to a consumer project.
  test('removes the boilerplate CHANGELOG', async () => {
    writeFileSync(join(dir, 'CHANGELOG.md'), '# Changelog');
    writeFileSync(join(dir, 'README.md'), '# Keep me');

    await pruneBootstrapExcludes(dir);

    expect(existsSync(join(dir, 'CHANGELOG.md'))).toBe(false);
    expect(existsSync(join(dir, 'README.md'))).toBe(true);
  });

  // The boilerplate's own CI + Pages workflows are template infrastructure; a
  // consumer project defines its own CI and keeps any workflows of its own.
  test('removes boilerplate-only GitHub workflows, keeps others', async () => {
    mkdirSync(join(dir, '.github', 'workflows'), { recursive: true });
    writeFileSync(join(dir, '.github', 'workflows', 'ci.yml'), 'name: ci');
    writeFileSync(join(dir, '.github', 'workflows', 'pages.yml'), 'name: pages');
    writeFileSync(join(dir, '.github', 'workflows', 'keep.yml'), 'name: keep');

    await pruneBootstrapExcludes(dir);

    expect(existsSync(join(dir, '.github', 'workflows', 'ci.yml'))).toBe(false);
    expect(existsSync(join(dir, '.github', 'workflows', 'pages.yml'))).toBe(false);
    expect(existsSync(join(dir, '.github', 'workflows', 'keep.yml'))).toBe(true);
  });

  test('removes business map files when present', async () => {
    mkdirSync(join(dir, '.context', 'business'), { recursive: true });
    writeFileSync(join(dir, '.context', 'business', 'business-data-map.md'), '# map');
    writeFileSync(join(dir, '.context', 'business', 'keep-me.md'), '# keep');

    await pruneBootstrapExcludes(dir);

    expect(existsSync(join(dir, '.context', 'business', 'business-data-map.md'))).toBe(false);
    expect(existsSync(join(dir, '.context', 'business', 'keep-me.md'))).toBe(true);
  });
});
