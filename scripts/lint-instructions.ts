#!/usr/bin/env bun
/**
 * lint-instructions.ts — structural gate for the progressive disclosure of the
 * project instructions: the always-on `AGENTS.md` (L0) and the on-demand
 * section files under `.agents/instructions/` (L1). Parsers live in
 * `scripts/lib/instructions.ts`.
 *
 * Checks (errors, except the `budget` target, which warns):
 *
 *   - `budget`: L0 bytes, measured without an adopted app's preserved block
 *     (`## 0. Project instructions (pre-adoption)`), warn over `L0_TARGET`
 *     and fail over `L0_BUDGET`; the whole file, that block included, fails
 *     over `L0_PROJECT_BUDGET` and, whatever the budgets say, at Codex's
 *     `project_doc_max_bytes` default. Codex cuts its project instructions
 *     there without a visible notice, so that cap is a correctness limit, not
 *     a style preference.
 *   - `router`: the table between `<!-- router:start -->` and
 *     `<!-- router:end -->` exists, every row has a kind and at least one load
 *     target, every target resolves (a backticked repo path or a bare
 *     `@path` import), and every section file is the target of some row.
 *   - `frontmatter`: a numbered section (`NN-<id>.md`) opens with `id` (its
 *     file stem without the number), `title`, `load_when`, `triggers` (a
 *     non-empty list of strings that compile as case-insensitive regexes) and
 *     `paths` (a list of repo-relative prefixes); `project.md` carries `id:
 *     project`, `title` and `load_when` and no `triggers`; `README.md` carries
 *     none. No other file lives in the folder.
 *   - `rules`: every L0 Critical Rule (`N. **NAME**: text … Full: …`) has a
 *     `## N. NAME` heading in `01-critical-rules.md`, every rule there has its
 *     L0 line, and each L0 excerpt (`…` joins excerpts) appears verbatim in
 *     the full text. The binding sentence never exists only in a section.
 *   - `binding`: a line of a section that says `NEVER` or `MUST` names what
 *     carries it into context when the section is not loaded: a Critical Rule
 *     (`Rule #N` with N in L0), a skill whose `## Compact Rules` reach every
 *     executor (`` `slug` `` or `/slug`), a bold contract label L0 also
 *     carries, or an explicit `<!-- binds-in-section: <reason> -->` that
 *     declares the rule binding only on the work that routes to the section.
 *     `01-critical-rules.md` and `project.md` are exempt (the first holds the
 *     full text of rules L0 carries, the second is project-owned).
 *   - `import`: a bare `@path` outside code in L0 is a Claude Code import
 *     (loaded in full at launch); only `ALLOWED_IMPORTS` may appear, and each
 *     must exist.
 *
 * Usage: bun scripts/lint-instructions.ts   (exit 1 on any error)
 */

import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import {
  coreBytes,
  L0_FILE,
  NUMBERED_SECTION,
  parseFrontmatter,
  parseFullRules,
  parseL0Rules,
  parseRouter,
  PROJECT_FILE,
  README_FILE,
  RULES_FILE,
  SECTIONS_DIR,
  withoutCode,
} from './lib/instructions';

/** Target for L0 without project additions: over it is a warning, so the number stays visible. */
export const L0_TARGET = 16 * 1024;
/** Ceiling for L0 without project additions. */
export const L0_BUDGET = 24 * 1024;
/** Ceiling for L0 with a project's additions (an adopted app's preserved block). */
export const L0_PROJECT_BUDGET = 28 * 1024;
/** Codex `project_doc_max_bytes` default: past it the file is cut at the byte. */
export const CODEX_PROJECT_DOC_MAX_BYTES = 32 * 1024;
/** Bare `@path` imports L0 may carry: Claude Code loads them at launch, the other hosts follow the router row. */
export const ALLOWED_IMPORTS = ['package.json', '.agents/project.yaml'] as const;

export type InstructionFindingKind = 'budget' | 'router' | 'frontmatter' | 'rules' | 'binding' | 'import';

export interface InstructionFinding {
  kind: InstructionFindingKind
  severity: 'error' | 'warning'
  file: string
  line: number
  message: string
}

const squash = (s: string): string => s.replace(/\s+/g, ' ').trim();

function finding(kind: InstructionFindingKind, file: string, line: number, message: string): InstructionFinding {
  return { kind, severity: 'error', file, line, message };
}

/** Skills whose `SKILL.md` has a `## Compact Rules` section (their rules reach every executor through `REGISTRY.md`). */
function compactRuleSkills(root: string): Set<string> {
  const dir = join(root, '.agents', 'skills');
  if (!existsSync(dir)) { return new Set(); }
  return new Set(readdirSync(dir).filter((slug) => {
    const file = join(dir, slug, 'SKILL.md');
    return existsSync(file) && /^## Compact Rules\b/m.test(readFileSync(file, 'utf8'));
  }));
}

/** `budget` findings for one L0 text. */
export function lintBudget(l0: string): InstructionFinding[] {
  const findings: InstructionFinding[] = [];
  const core = coreBytes(l0);
  const total = Buffer.byteLength(l0);
  if (core > L0_BUDGET) {
    findings.push(finding('budget', L0_FILE, 1, `L0 is ${core} bytes, over the ${L0_BUDGET}-byte ceiling: move detail into a section`));
  }
  else if (core > L0_TARGET) {
    findings.push({ ...finding('budget', L0_FILE, 1, `L0 is ${core} bytes, over the ${L0_TARGET}-byte target`), severity: 'warning' });
  }
  if (total > CODEX_PROJECT_DOC_MAX_BYTES) {
    findings.push(finding('budget', L0_FILE, 1, `L0 is ${total} bytes: Codex cuts project instructions at ${CODEX_PROJECT_DOC_MAX_BYTES}`));
  }
  else if (total > L0_PROJECT_BUDGET) {
    findings.push(finding('budget', L0_FILE, 1, `L0 with project additions is ${total} bytes, over ${L0_PROJECT_BUDGET}: move project text into ${SECTIONS_DIR}/${PROJECT_FILE} or a context skill`));
  }
  return findings;
}

/** `import` findings: bare `@path` tokens outside code in L0. */
export function lintImports(root: string, l0: string): InstructionFinding[] {
  const findings: InstructionFinding[] = [];
  withoutCode(l0).split('\n').forEach((line, i) => {
    for (const m of line.matchAll(/(?<![\w.])@([\w./-]+)/g)) {
      const target = m[1].replace(/\.$/, '');
      if (!(ALLOWED_IMPORTS as readonly string[]).includes(target)) {
        findings.push(finding('import', L0_FILE, i + 1, `bare \`@${target}\` is a Claude Code import; only ${ALLOWED_IMPORTS.map(a => `@${a}`).join(', ')} may appear (wrap other mentions in backticks)`));
      }
      else if (!existsSync(join(root, target))) {
        findings.push(finding('import', L0_FILE, i + 1, `import target missing: ${target}`));
      }
    }
  });
  return findings;
}

/** `frontmatter` findings for one file of the sections folder. */
export function lintFrontmatter(rel: string, name: string, text: string): InstructionFinding[] {
  const bad = (message: string): InstructionFinding[] => [finding('frontmatter', rel, 1, message)];
  const meta = parseFrontmatter(text);
  if (name === README_FILE) { return meta ? bad('README.md carries no frontmatter') : []; }
  if (!meta) { return bad('missing YAML frontmatter'); }
  for (const key of ['id', 'title', 'load_when']) {
    if (typeof meta[key] !== 'string' || !meta[key].trim()) { return bad(`\`${key}\` must be a non-empty string`); }
  }
  if (name === PROJECT_FILE) {
    if (meta.id !== 'project') { return bad('`id` must be `project`'); }
    return 'triggers' in meta ? bad('project.md carries no `triggers`') : [];
  }
  const numbered = NUMBERED_SECTION.exec(name);
  if (!numbered) { return bad('file name must be `NN-<id>.md`, `project.md` or `README.md`'); }
  if (meta.id !== numbered[2]) { return bad(`\`id\` must be \`${numbered[2]}\` (the file stem without the number)`); }
  const triggers = meta.triggers;
  if (!Array.isArray(triggers) || triggers.length === 0 || triggers.some(t => typeof t !== 'string')) {
    return bad('`triggers` must be a non-empty list of strings');
  }
  for (const trigger of triggers as string[]) {
    try { void new RegExp(trigger, 'i'); }
    catch { return bad(`trigger does not compile: ${trigger}`); }
  }
  if (!Array.isArray(meta.paths) || meta.paths.some(p => typeof p !== 'string')) { return bad('`paths` must be a list of strings'); }
  return [];
}

/** `router` findings: markers, rows, resolvable targets, every section routed. */
export function lintRouter(root: string, l0: string, sections: string[]): InstructionFinding[] {
  const rows = parseRouter(l0);
  if (rows === null) { return [finding('router', L0_FILE, 1, 'router markers `<!-- router:start -->` / `<!-- router:end -->` missing')]; }
  const findings: InstructionFinding[] = [];
  if (rows.length === 0) { findings.push(finding('router', L0_FILE, 1, 'router table has no rows')); }
  const routed = new Set<string>();
  for (const row of rows) {
    if (!row.kind) { findings.push(finding('router', L0_FILE, row.line, 'row without a kind')); }
    if (row.targets.length === 0) { findings.push(finding('router', L0_FILE, row.line, 'row without a load target')); }
    for (const target of row.targets) {
      if (!existsSync(join(root, target))) { findings.push(finding('router', L0_FILE, row.line, `load target does not resolve: ${target}`)); }
      routed.add(target);
    }
  }
  for (const section of sections) {
    if (!routed.has(`${SECTIONS_DIR}/${section}`)) {
      findings.push(finding('router', `${SECTIONS_DIR}/${section}`, 1, 'section is not the load target of any router row'));
    }
  }
  return findings;
}

/** `rules` findings: L0 binding lines against the full-text rules file. */
export function lintRules(l0: string, rulesText: string | null): InstructionFinding[] {
  const l0Rules = parseL0Rules(l0);
  const rulesRel = `${SECTIONS_DIR}/${RULES_FILE}`;
  if (l0Rules.length === 0) { return [finding('rules', L0_FILE, 1, 'no Critical Rules found under `## 1. CRITICAL RULES`')]; }
  if (rulesText === null) { return [finding('rules', rulesRel, 1, 'full-text rules file missing')]; }
  const findings: InstructionFinding[] = [];
  const full = parseFullRules(rulesText);
  for (const rule of l0Rules) {
    const target = full.get(rule.n);
    if (!target) {
      findings.push(finding('rules', L0_FILE, rule.line, `rule ${rule.n} has no \`## ${rule.n}. ${rule.name}\` in ${RULES_FILE}`));
      continue;
    }
    if (target.name !== rule.name) {
      findings.push(finding('rules', L0_FILE, rule.line, `rule ${rule.n} is \`${rule.name}\` in L0 but \`${target.name}\` in ${RULES_FILE}`));
    }
    if (rule.excerpts.length === 0) {
      findings.push(finding('rules', L0_FILE, rule.line, `rule ${rule.n} has no binding text in L0`));
    }
    for (const excerpt of rule.excerpts) {
      if (!squash(target.body).includes(squash(excerpt))) {
        findings.push(finding('rules', L0_FILE, rule.line, `rule ${rule.n} excerpt is not verbatim in ${RULES_FILE}: "${excerpt.slice(0, 60)}…"`));
      }
    }
  }
  const inL0 = new Set(l0Rules.map(r => r.n));
  for (const n of full.keys()) {
    if (!inL0.has(n)) { findings.push(finding('rules', rulesRel, 1, `rule ${n} has no binding line in L0`)); }
  }
  return findings;
}

/** `binding` findings for one section file. */
export function lintBinding(
  rel: string,
  text: string,
  ctx: { ruleNumbers: Set<number>, skills: Set<string>, l0: string },
): InstructionFinding[] {
  const findings: InstructionFinding[] = [];
  const raw = text.split('\n');
  withoutCode(text).split('\n').forEach((line, i) => {
    if (!/\bNEVER\b|\bMUST\b/.test(line)) { return; }
    const full = raw[i];
    if (/<!--\s*binds-in-section:\s*\S/.test(full)) { return; }
    if ([...full.matchAll(/\bRule #?(\d+)\b/g)].some(m => ctx.ruleNumbers.has(Number(m[1])))) { return; }
    const slugs = [...full.matchAll(/`\/?([a-z][a-z0-9-]+)`|(?<![\w/.])\/([a-z][a-z0-9-]+)\b/g)].map(m => m[1] ?? m[2]);
    if (slugs.some(s => ctx.skills.has(s))) { return; }
    const label = /^\s*(?:[-*]\s+|>\s*)?\*\*([^*]+)\*\*/.exec(full);
    if (label && ctx.l0.includes(`**${label[1]}**`)) { return; }
    findings.push(finding('binding', rel, i + 1, 'NEVER/MUST with no carrier: cite `Rule #N`, a skill with Compact Rules, a contract L0 carries, or mark `<!-- binds-in-section: <reason> -->`'));
  });
  return findings;
}

export function lintInstructions(root: string): InstructionFinding[] {
  const l0Path = join(root, L0_FILE);
  if (!existsSync(l0Path)) { return [finding('router', L0_FILE, 1, 'AGENTS.md missing')]; }
  const l0 = readFileSync(l0Path, 'utf8');
  const dir = join(root, SECTIONS_DIR);
  const files = existsSync(dir) ? readdirSync(dir).filter(f => f.endsWith('.md')).sort() : [];
  const sections = files.filter(f => f !== README_FILE);
  const rulesPath = join(dir, RULES_FILE);

  const findings = [
    ...lintBudget(l0),
    ...lintImports(root, l0),
    ...lintRouter(root, l0, sections),
    ...files.flatMap(name => lintFrontmatter(`${SECTIONS_DIR}/${name}`, name, readFileSync(join(dir, name), 'utf8'))),
    ...lintRules(l0, existsSync(rulesPath) ? readFileSync(rulesPath, 'utf8') : null),
  ];
  const ctx = { ruleNumbers: new Set(parseL0Rules(l0).map(r => r.n)), skills: compactRuleSkills(root), l0 };
  for (const name of sections) {
    if (name === RULES_FILE || name === PROJECT_FILE) { continue; }
    findings.push(...lintBinding(`${SECTIONS_DIR}/${name}`, readFileSync(join(dir, name), 'utf8'), ctx));
  }
  return findings;
}

if (import.meta.main) {
  const root = process.cwd();
  const findings = lintInstructions(root);
  const l0Path = join(root, L0_FILE);
  const bytes = existsSync(l0Path) ? coreBytes(readFileSync(l0Path, 'utf8')) : 0;
  const errors = findings.filter(f => f.severity === 'error');
  for (const f of findings.filter(f => f.severity === 'warning')) {
    console.warn(`  ! ${f.file}:${f.line}  ${f.kind}  ${f.message}`);
  }
  if (errors.length === 0) {
    console.log(`✓ instructions:check passed (L0 ${bytes} bytes; target ${L0_TARGET}, ceiling ${L0_BUDGET})`);
    process.exit(0);
  }
  console.error(`✗ instructions:check found ${errors.length} problem(s):\n`);
  for (const f of errors) {
    console.error(`  ${f.file}:${f.line}  ${f.kind}  ${f.message}`);
  }
  process.exit(1);
}
