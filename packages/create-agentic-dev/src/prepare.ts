import { spawnSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { readFile, rm, writeFile } from 'node:fs/promises';
import { join } from 'node:path';

import { CliError } from './errors.ts';
import { log } from './log.ts';

/**
 * Project-name sanitization rules:
 * - lowercase
 * - replace non [a-z0-9._-] with '-'
 * - collapse repeated '-'
 * - trim leading/trailing '-'
 * - clamp to 214 chars (npm pkg name limit)
 */
export function sanitizeProjectName(raw: string): string {
  return raw
    .toLowerCase()
    .replace(/[^a-z0-9._-]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^[-._]+|[-._]+$/g, '')
    .slice(0, 214);
}

export async function scrubGitHistory(projectDir: string): Promise<void> {
  const gitDir = join(projectDir, '.git');
  if (existsSync(gitDir)) {
    await rm(gitDir, { recursive: true, force: true });
    log.dim('  Removed inherited .git history.');
  }
}

export async function rewritePackageJson(projectDir: string, projectName: string): Promise<void> {
  const pkgPath = join(projectDir, 'package.json');
  if (!existsSync(pkgPath)) {
    throw new CliError('BOOTSTRAP', `package.json missing at ${pkgPath}.`);
  }
  const raw = await readFile(pkgPath, 'utf8');
  const pkg = JSON.parse(raw) as Record<string, unknown>;

  pkg.name = projectName;
  pkg.version = '0.1.0';
  pkg.description = '';
  if (pkg.author === '') { delete pkg.author; }
  if (pkg.keywords && Array.isArray(pkg.keywords) && pkg.keywords.length === 0) {
    delete pkg.keywords;
  }
  // Drop "main" if it points at a non-existent default entrypoint.
  if (pkg.main === 'index.js' && !existsSync(join(projectDir, 'index.js'))) {
    delete pkg.main;
  }

  await writeFile(pkgPath, `${JSON.stringify(pkg, null, 2)}\n`, 'utf8');
  log.dim(`  Wrote package.json (name=${projectName}, version=0.1.0).`);
}

/**
 * Patch top-level keys in `.agents/project.yaml`. We do regex line edits rather
 * than full YAML parsing to keep this package zero-dep and to preserve comments.
 *
 * Updates supported:
 *   - project.project_name (always set if found)
 *   - project.project_key  (only if projectKey provided)
 *
 * Field names must match `.agents/project.yaml` exactly. A miss is reported,
 * never swallowed: this function used to target a field called `name`, which
 * the template does not have, so every scaffold left `project_name: null`
 * while the CLI logged that it had written the name.
 */
export async function rewriteProjectYaml(projectDir: string, opts: {
  projectName: string
  projectKey?: string
}): Promise<void> {
  const yamlPath = join(projectDir, '.agents', 'project.yaml');
  if (!existsSync(yamlPath)) {
    // Boilerplate ships .agents/project.yaml; if missing the template is older
    // than expected — surface a non-fatal warning.
    log.warn('  .agents/project.yaml not found in template; skipping rename.');
    return;
  }

  let content = await readFile(yamlPath, 'utf8');
  const written: string[] = [];
  const missed: string[] = [];

  for (const [field, value] of [
    ['project_name', opts.projectName],
    ...(opts.projectKey ? [['project_key', opts.projectKey]] : []),
  ] as Array<[string, string]>) {
    const next = replaceYamlField(content, field, value);
    if (next === null) { missed.push(field); }
    else {
      content = next;
      written.push(`${field}=${value}`);
    }
  }

  await writeFile(yamlPath, content, 'utf8');

  if (written.length > 0) {
    log.dim(`  Wrote .agents/project.yaml (${written.join(', ')}).`);
  }
  for (const field of missed) {
    log.warn(`  .agents/project.yaml has no \`${field}:\` field — left unset. Fill it in manually.`);
  }
}

/**
 * Replace the value of a top-level field inside the `project:` map of the YAML.
 * Matches the first occurrence of `^  <field>: <anything>$`.
 *
 * Returns `null` when the field is absent, so the caller can report the miss
 * rather than silently reporting success.
 */
function replaceYamlField(content: string, field: string, value: string): string | null {
  const pattern = new RegExp(`^(\\s{2}${escapeReg(field)}:)\\s*.*$`, 'm');
  if (!pattern.test(content)) { return null; }
  return content.replace(pattern, `$1 ${value}`);
}

function escapeReg(s: string): string {
  return s.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&');
}

/**
 * Reset the git-strategy PROVENANCE in a freshly scaffolded `.agents/project.yaml`.
 *
 * The boilerplate repo ships its `git_strategy:` block with the maintainer's own
 * provenance stamps: `meta.strategy_source: chosen`, `meta.policy_source:
 * accepted`, a `meta.policy_verified` date, and a `policy.accepted_divergences`
 * list whose entries name THIS repo's GitHub ruleset — all of which are false in
 * any other repository. The strategy itself (`solo-main`) and the policy VALUES
 * are kept as a sane shipped default; only the "someone decided and verified
 * this" claims are reset. With `strategy_source: inherited`, git-flow-master's
 * bootstrap offer fires on the consumer's first git action and they define
 * their own strategy explicitly.
 *
 * Same regex-line-edit pattern as the project_name rewrite: zero-dep, preserves
 * comments and formatting, and a template without the block (older tag) is a
 * silent no-op per field.
 */
export async function resetGitStrategyMeta(projectDir: string): Promise<void> {
  const yamlPath = join(projectDir, '.agents', 'project.yaml');
  if (!existsSync(yamlPath)) { return; } // older template — rewriteProjectYaml already warned.

  let content = await readFile(yamlPath, 'utf8');
  if (!/^git_strategy:/m.test(content)) { return; } // template predates the block.

  const reset: string[] = [];
  for (const [field, value] of [
    ['strategy_source', 'inherited'],
    ['policy_source', 'declared'],
    ['policy_verified', 'null'],
  ] as Array<[string, string]>) {
    const next = resetYamlLeafValue(content, field, value);
    if (next !== null) {
      content = next;
      reset.push(`${field}=${value}`);
    }
  }

  const withoutDivergences = removeYamlBlock(content, 'accepted_divergences');
  if (withoutDivergences !== content) {
    content = withoutDivergences;
    reset.push('accepted_divergences removed');
  }

  await writeFile(yamlPath, content, 'utf8');
  if (reset.length > 0) {
    log.dim(`  Reset git_strategy provenance (${reset.join(', ')}).`);
  }
}

/**
 * Replace a scalar leaf's VALUE anywhere in the YAML (first occurrence),
 * preserving indentation and any trailing `#` comment. Returns null when the
 * field is absent.
 */
function resetYamlLeafValue(content: string, field: string, value: string): string | null {
  const pattern = new RegExp(`^([ \\t]*${escapeReg(field)}:)[^#\\n]*(#.*)?$`, 'm');
  if (!pattern.test(content)) { return null; }
  // Function replacer: a `$` inside the preserved comment must stay literal.
  return content.replace(pattern, (_m, head: string, comment?: string) =>
    `${head} ${value}${comment ? ` ${comment}` : ''}`);
}

/**
 * Remove a mapping key, its indented body, and the contiguous same-indent
 * comment header immediately above it. Returns the content unchanged when the
 * key is absent.
 */
function removeYamlBlock(content: string, field: string): string {
  const lines = content.split('\n');
  const keyRe = new RegExp(`^[ \\t]*${escapeReg(field)}:`);
  const keyIdx = lines.findIndex(l => keyRe.test(l));
  if (keyIdx === -1) { return content; }
  const indent = lines[keyIdx].match(/^[ \t]*/)![0];

  // Contiguous comment header at the same indent (documents the removed key).
  let start = keyIdx;
  while (start - 1 >= 0 && lines[start - 1].startsWith(`${indent}#`)) { start -= 1; }

  // Body: every line more indented than the key (blank lines tolerated).
  let end = keyIdx;
  for (let i = keyIdx + 1; i < lines.length; i += 1) {
    const line = lines[i];
    if (line.trim() === '') { continue; }
    const leading = line.match(/^[ \t]*/)![0];
    if (leading.length > indent.length) { end = i; continue; }
    break;
  }

  return [...lines.slice(0, start), ...lines.slice(end + 1)].join('\n');
}

export function initGitRepo(projectDir: string): void {
  // `git init -b <branch>` needs git >= 2.28 (Jul 2020). Ubuntu 20.04 ships
  // 2.25, Debian 10 ships 2.20, Catalina's CLT ship 2.24 — on those it exits
  // with "unknown switch `b`" and the caller's rollback deletes the whole
  // freshly scaffolded project over a branch name. Init plain, then point HEAD
  // at main via symbolic-ref, which every git version understands.
  const initRes = spawnSync('git', ['init'], { cwd: projectDir, stdio: ['ignore', 'pipe', 'pipe'] });
  if (initRes.status !== 0) {
    throw new CliError('BOOTSTRAP', 'git init failed.', initRes.stderr.toString());
  }

  // Before the first commit HEAD is an unborn ref, so this just renames the
  // branch the initial commit will land on. Non-fatal: a repo on `master` is
  // still a working repo.
  const headRes = spawnSync('git', ['symbolic-ref', 'HEAD', 'refs/heads/main'], {
    cwd: projectDir,
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  if (headRes.status !== 0) {
    log.warn('  Could not set the default branch to main; continuing on git\'s default.');
  }

  const addRes = spawnSync('git', ['add', '.'], { cwd: projectDir, stdio: ['ignore', 'pipe', 'pipe'] });
  if (addRes.status !== 0) {
    throw new CliError('BOOTSTRAP', 'git add failed.', addRes.stderr.toString());
  }

  const commitRes = spawnSync(
    'git',
    ['commit', '-m', 'chore: initial commit from agentic-dev-boilerplate', '--no-verify'],
    { cwd: projectDir, stdio: ['ignore', 'pipe', 'pipe'] },
  );
  if (commitRes.status !== 0) {
    // Most likely: no git user.email/name configured. Surface a clear hint.
    throw new CliError(
      'BOOTSTRAP',
      'git commit failed.',
      `Stderr: ${commitRes.stderr.toString().trim()}\nHint: configure your git identity:\n  git config --global user.email "you@example.com"\n  git config --global user.name "Your Name"`,
    );
  }
  log.dim('  git init + initial commit done.');
}

/**
 * Paths that exist in the boilerplate repo but MUST NOT land in a freshly
 * bootstrapped consumer project. Examples: this CLI's own source under
 * `packages/`, and business/data maps specific to the template's own product.
 *
 * Updating the list requires republishing `create-agentic-dev`. That's the
 * intended cost: the scaffolder owns its own exclusion contract, no separate
 * `.template/manifest.json` to drift out of sync.
 */
const TEMPLATE_EXCLUDES: readonly string[] = [
  'packages',
  // The boilerplate's own release history, versioned against the boilerplate
  // and the create-agentic-dev npm package. A fresh consumer project starts its
  // own history at 0.1.0 and would only be confused by ours.
  'CHANGELOG.md',
  // Boilerplate-only docs-hub workflow: publishes the "Planos" deck site
  // (homepage + decks under packages/, already excluded above) to
  // gh-pages. A consumer project has none of that content.
  '.github/workflows/pages.yml',
  // Boilerplate-only CI workflow: runs the template's own quality gates
  // (installer tests, registry checks) against the boilerplate repo. A consumer
  // project defines its own CI for its own stack.
  '.github/workflows/ci.yml',
  '.context/business/business-data-map.md',
  '.context/business/business-feature-map.md',
  '.context/business/business-api-map.md',
  '.context/master-implementation-plan.md',
  // Jira catalogs are cached from the boilerplate's source workspace and must
  // not travel to a new project (otherwise `jira:sync-fields` errors with
  // "already populated" on first install).
  '.agents/jira-fields.json',
  '.agents/jira-workflows.json',
];

/**
 * Delete every path in TEMPLATE_EXCLUDES from the freshly extracted
 * project. Security: paths are restricted to project-relative (no absolute
 * paths, no `..` traversal). Unsafe entries are skipped with a warning.
 */
export async function pruneBootstrapExcludes(projectDir: string): Promise<void> {
  let pruned = 0;
  for (const rel of TEMPLATE_EXCLUDES) {
    if (rel.startsWith('/') || rel.split(/[\\/]/).includes('..')) {
      log.warn(`  Skipped unsafe exclude path: ${rel}`);
      continue;
    }
    const abs = join(projectDir, rel);
    if (existsSync(abs)) {
      await rm(abs, { recursive: true, force: true });
      pruned++;
    }
  }
  log.dim(`  Pruned ${pruned} bootstrap-only path(s) from extracted project.`);
}
