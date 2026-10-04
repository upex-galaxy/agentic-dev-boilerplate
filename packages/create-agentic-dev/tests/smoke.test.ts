import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { afterEach, beforeEach, describe, expect, test } from 'bun:test';

// The updater's twin (repo-side; `packages/` is pruned from consumers, so a
// test here may read it). See `resetGitStrategyMeta` in `../src/prepare.ts`.
import { resetGitStrategyProvenance } from '../../../cli/lib/git-strategy-provenance.ts';
import { findStubLeaks } from '../../../cli/lib/updater-instructions.ts';
import { parseArgs } from '../src/args.ts';
import { buildTarArgs } from '../src/download.ts';
import { CliError } from '../src/errors.ts';
import { countStubLeaks, pruneBootstrapExcludes, resetGitStrategyMeta, rewriteProjectYaml, sanitizeProjectName, seedProjectInstructions, seedProjectYamlFromSchema } from '../src/prepare.ts';

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

  test('matches its twin in cli/lib byte for byte (the updater --adopt path uses that one)', async () => {
    for (const yaml of [TEMPLATE_YAML, 'project:\n  project_name: null\n']) {
      writeFileSync(join(dir, '.agents', 'project.yaml'), yaml);
      await resetGitStrategyMeta(dir);
      expect(readYaml()).toBe(resetGitStrategyProvenance(yaml).content);
    }
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

  test('removes the maintainer\'s master implementation plan, keeps the rest of .context', async () => {
    mkdirSync(join(dir, '.context', 'business'), { recursive: true });
    writeFileSync(join(dir, '.context', 'master-implementation-plan.md'), '# plan');
    writeFileSync(join(dir, '.context', 'business', 'keep-me.md'), '# keep');

    await pruneBootstrapExcludes(dir);

    expect(existsSync(join(dir, '.context', 'master-implementation-plan.md'))).toBe(false);
    expect(existsSync(join(dir, '.context', 'business', 'keep-me.md'))).toBe(true);
  });
});

describe('seedProjectYamlFromSchema', () => {
  let dir: string;

  // What the boilerplate SHIPS: its own filled yaml, narrating its own git
  // host. The old field-by-field reset left all of this in every scaffold.
  const MAINTAINER_YAML = [
    '# Project configuration consumed by AI agents',
    '# MAINTAINER COPY: this is the boilerplate\'s OWN file.',
    '',
    'project:',
    '  project_name: null # TODO: Project name',
    '',
    'git_strategy:',
    '  description: >',
    '    Work is pushed DIRECTLY to main because the credential is an org admin',
    '    and the ProtectPublic ruleset bypasses on every push.',
    '  policy:',
    '    direct_push_to_protected: allowed',
    '    admin_bypass: true',
    '    require_pr_reviews: 1 # VERIFIED 2026-08-21 against ruleset 16809536',
    '  meta:',
    '    strategy_source: chosen # the maintainer confirmed this on 2026-08-21',
    '',
  ].join('\n');

  // What `bun run agents:schema` GENERATES from it.
  const SCHEMA_YAML = [
    '# GENERATED by `bun run agents:schema` from .agents/project.yaml. DO NOT EDIT BY HAND.',
    '# To change it: edit .agents/project.yaml, then run `bun run agents:schema`.',
    '',
    'project:',
    '  project_name: null # TODO: Project name',
    '',
    'git_strategy:',
    '  description: >',
    '    TODO: describe this project\'s branching strategy in prose.',
    '  policy:',
    '    direct_push_to_protected: confirm',
    '    admin_bypass: false',
    '    require_pr_reviews: 1 # required approving reviews on a protected branch.',
    '  meta:',
    '    strategy_source: inherited # inherited | chosen',
    '',
  ].join('\n');

  const readYaml = (): string => readFileSync(join(dir, '.agents', 'project.yaml'), 'utf8');

  beforeEach(() => {
    dir = mkdtempSync(join(tmpdir(), 'cad-seed-schema-'));
    mkdirSync(join(dir, '.agents'), { recursive: true });
    writeFileSync(join(dir, '.agents', 'project.yaml'), MAINTAINER_YAML);
    writeFileSync(join(dir, '.agents', 'project.schema.yaml'), SCHEMA_YAML);
  });

  afterEach(() => { rmSync(dir, { recursive: true, force: true }); });

  test('the schema becomes the project yaml', async () => {
    expect(await seedProjectYamlFromSchema(dir)).toBe(true);
    const yaml = readYaml();
    expect(yaml).toContain('direct_push_to_protected: confirm');
    expect(yaml).toContain('admin_bypass: false');
    expect(yaml).toContain('strategy_source: inherited');
  });

  test('no maintainer identity survives the seed', async () => {
    await seedProjectYamlFromSchema(dir);
    const yaml = readYaml();
    expect(yaml).not.toContain('16809536');
    expect(yaml).not.toContain('ProtectPublic');
    expect(yaml).not.toContain('2026-08-21');
    expect(yaml).not.toContain('direct_push_to_protected: allowed');
    expect(yaml).not.toContain('MAINTAINER COPY');
  });

  test('the generated banner is swapped for a consumer header', async () => {
    await seedProjectYamlFromSchema(dir);
    const yaml = readYaml();
    expect(yaml).not.toContain('DO NOT EDIT BY HAND');
    expect(yaml.startsWith('# Project configuration consumed by AI agents')).toBe(true);
    expect(yaml).toContain('bun run agents:schema --project');
    expect(yaml).toContain('\nproject:\n');
  });

  // An older tag has no schema: the caller falls back to the field-by-field
  // reset rather than silently leaving the maintainer's values in place.
  test('a template without a schema reports false and leaves the file alone', async () => {
    rmSync(join(dir, '.agents', 'project.schema.yaml'));
    expect(await seedProjectYamlFromSchema(dir)).toBe(false);
    expect(readYaml()).toBe(MAINTAINER_YAML);
  });

  test('identity written after the seed survives', async () => {
    await seedProjectYamlFromSchema(dir);
    await rewriteProjectYaml(dir, { projectName: 'acme-webapp' });
    expect(readYaml()).toContain('project_name: acme-webapp');
    expect(readYaml()).toContain('strategy_source: inherited');
  });

  // The real pair: the boilerplate's committed schema seeds a consumer file
  // that carries none of the boilerplate's git_strategy answers.
  test('seeding from the boilerplate\'s own committed schema', async () => {
    const repoRoot = join(import.meta.dir, '..', '..', '..');
    writeFileSync(join(dir, '.agents', 'project.schema.yaml'), readFileSync(join(repoRoot, '.agents', 'project.schema.yaml'), 'utf8'));
    expect(await seedProjectYamlFromSchema(dir)).toBe(true);
    const yaml = readYaml();
    expect(yaml).toContain('    direct_push_to_protected: confirm #');
    expect(yaml).toContain('    strategy_source: inherited #');
    expect(yaml).not.toContain('ProtectPublic');
  });
});

describe('seedProjectInstructions', () => {
  const REPO = join(import.meta.dir, '..', '..', '..');
  const OWN = readFileSync(join(REPO, '.agents', 'instructions', 'project.md'), 'utf8');
  const STUB = readFileSync(join(REPO, '.agents', 'instructions', 'project.md.template'), 'utf8');
  let dir: string;
  const target = (): string => join(dir, '.agents', 'instructions', 'project.md');

  beforeEach(() => {
    dir = mkdtempSync(join(tmpdir(), 'cad-seed-instructions-'));
    mkdirSync(join(dir, '.agents', 'instructions'), { recursive: true });
  });
  afterEach(() => { rmSync(dir, { recursive: true, force: true }); });

  test('the extracted boilerplate overlay is replaced by the generic stub', async () => {
    writeFileSync(target(), OWN);
    writeFileSync(join(dir, '.agents', 'instructions', 'project.md.template'), STUB);
    expect(await seedProjectInstructions(dir)).toBe('seeded');
    expect(readFileSync(target(), 'utf8')).toBe(STUB);
  });

  test('fails closed: a leaking stub is not written and the maintainer file is removed', async () => {
    writeFileSync(target(), OWN);
    writeFileSync(join(dir, '.agents', 'instructions', 'project.md.template'), OWN);
    expect(await seedProjectInstructions(dir)).toBe('removed');
    expect(existsSync(target())).toBe(false);
  });

  test('a template from before the split is a no-op', async () => {
    expect(await seedProjectInstructions(dir)).toBe('absent');
  });

  test('same verdict as the updater\'s leak gate (twins: change them together)', () => {
    const cases: Array<[string, string | null]> = [[STUB, OWN], [OWN, OWN], [OWN, null], [STUB, null], ['Plain generic text that is long enough to count.\n', null]];
    for (const [stub, own] of cases) {
      expect(countStubLeaks(stub, own)).toBe(findStubLeaks(stub, own).length);
    }
  });
});
