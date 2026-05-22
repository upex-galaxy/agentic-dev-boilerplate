#!/usr/bin/env bun
/**
 * lint-skills.ts — validates the skill composition system.
 *
 * Checks:
 *   1. ORPHAN-CATEGORY (ERROR) — SKILL.md frontmatter declares a category not in §4.1.
 *   2. STALE-MENTION   (WARN)  — Expected matches table cites a skill name that is
 *                                not in install.ts (any tier) and not in skill-registry slugs.
 *   3. TIER-MISMATCH   (ERROR) — Expected matches table annotates a skill as `(T2)`
 *                                or similar but install.ts says different tier.
 *   4. MISSING-SECTION (ERROR) — Skill declares `complementary_categories` but has
 *                                no `## Composable Skills` heading (sprint-development
 *                                is exempt — uses `## SDD Composition`).
 *   5. EMPTY-CATEGORY  (ERROR) — §4.1 row declares a category but maps it to zero
 *                                skills (the category is unreachable).
 *   6. STALE-PATH      (ERROR) — Any file references the old `.context/skill-composition-strategy.md`
 *                                path instead of the canonical
 *                                `.claude/skills/agentic-dev-core/references/skill-composition-strategy.md`.
 *   7. DUPLICATE-TIER  (ERROR) — Same skill name appears in both SKILL_SLUGS (T2)
 *                                and PROJECT_LEVEL_SKILLS (T3) — install.ts conflict.
 *   8. SESSION-BANNER-MISSING (ERROR) — A retrofitted SKILL.md does not contain
 *                                the verbatim session-management banner prefix.
 *   9. SESSION-PHASE-0-MISSING (ERROR) — A retrofitted SKILL.md has no Phase 0
 *                                (or Phase -1) section, or that section omits `.session/`.
 *  10. SESSION-SCOPE-INVALID  (WARN)  — A `.session/<skill>/<scope>/` directory
 *                                does not match the per-skill scope regex.
 *  11. PM-HARDCODED-CFID      (ERROR) — `customfield_NNNN` literal id inside
 *                                product-management refs (K1). Anti-pattern
 *                                citations (line contains NEVER/Never) are exempt.
 *  12. PM-FR-SUMMARY-PREFIX   (ERROR) — `FR-XXX —` (em-dash) summary anti-pattern
 *                                inside product-management refs (K2). Anti-pattern
 *                                citations exempt.
 *  13. PM-DESC-HEADER         (WARN)  — `## Acceptance Criteria` / `## Scope` /
 *                                `## Out Of Scope` H2 inside product-management
 *                                refs — may belong in custom fields, not the
 *                                description body. Humans audit (K3).
 *  14. PM-LITERAL-TOOL        (ERROR) — Literal tool commands (`acli `,
 *                                `mcp__atlassian__`, `curl ... rest/api/3/`)
 *                                inside product-management refs (K4). Anti-pattern
 *                                citations exempt.
 *  15. PM-WAVE-TERMINOLOGY    (ERROR) — Residual "Wave" terminology in
 *                                product-management refs and master-implementation-plan
 *                                docs (K7). Exceptions: idiom `hand-wave`,
 *                                anti-pattern citations (line contains `NEVER`
 *                                or quoted `"Wave"`).
 *
 * Note: `complementary_categories` frontmatter is OPTIONAL on every T1 skill.
 * Skills that do not need to borrow community capability (e.g. pure CLI wrappers
 * like git-flow-master, acli) simply omit the field — no warning, no info.
 *
 * Exit codes:
 *   0 — no errors (warnings/info OK)
 *   1 — at least one ERROR found
 */

import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { parse as parseYaml } from 'yaml';

// -----------------------------------------------------------------------------
// Configuration
// -----------------------------------------------------------------------------

const REPO_ROOT = join(import.meta.dir, '..');
const SKILLS_DIR = join(REPO_ROOT, '.claude/skills');
const STRATEGY_DOC = join(SKILLS_DIR, 'agentic-dev-core/references/skill-composition-strategy.md');
const INSTALL_TS = join(REPO_ROOT, 'cli/install.ts');
const STALE_PATH_LITERAL = '.context/skill-composition-strategy.md';
const SCAN_FOR_STALE_PATH = ['CLAUDE.md', '.claude/skills', '.context'];
const SPRINT_DEV_EXEMPT = 'sprint-development'; // uses "## SDD Composition" instead

// -----------------------------------------------------------------------------
// Session-management contract (per agentic-dev-core/references/session-management.md §14)
// -----------------------------------------------------------------------------

/**
 * Skills that adopted the session-management contract. Each maps to the regex
 * that the immediate child directory under `.session/<skill>/` must satisfy,
 * or `null` if the skill stores state directly under `.session/<skill>/` with
 * no `<scope>` segment. Skills NOT in this map are exempt from BANNER, PHASE-0,
 * and SCOPE-INVALID checks.
 */
const SESSION_RETROFITTED_SKILLS: Record<string, RegExp | null> = {
  'project-foundation': null,
  'project-bootstrap': null,
  // `seed` (curation root) is a strict subset of `[a-z0-9][a-z0-9-]*`
  // (kebab-case epic slug); no separate literal branch is needed.
  'product-management': /^[a-z0-9][a-z0-9-]*$/,
  'design-system': null,
  'testability-guide': null,
  'sprint-development': /^[A-Z]+-\d+$/,
};

/**
 * Invariant prefix of the orchestration + session banner that every retrofitted
 * SKILL.md must contain verbatim. Continues differently in the progress-only
 * variant (sprint-development) but the prefix up to "archive on completion)."
 * is identical in both forms. Contains an em-dash (U+2014) between "dispatch"
 * and "main thread" — copy-paste from project-foundation/SKILL.md; do not retype.
 */
const SESSION_BANNER_PREFIX = '> **Orchestration & Session contracts**: this skill follows `./orchestration-doctrine.md` (mandatory subagent dispatch — main thread is command center) AND `./session-management.md` (Phase 0 resume check, plan-first persistence at `.session/<skill-slug>/<scope>/`, archive on completion).';

/**
 * Matches `## Phase 0`, `## Phase 0.0`, `## Phase -1` (ASCII hyphen-minus), or
 * `## Phase −1` (U+2212 minus). The session-resume Phase 0 is named `-1` in
 * test-documentation to avoid a numeric collision with its existing Phase 0.
 */
const PHASE_0_HEADING = /^## Phase (?:0(?:\.0)?|-1|−1)(?:\s|$)/m;

// -----------------------------------------------------------------------------
// Findings collector
// -----------------------------------------------------------------------------

type Severity = 'ERROR' | 'WARN' | 'INFO';
interface Finding {
  severity: Severity
  code: string
  scope: string
  message: string
}

const findings: Finding[] = [];

function record(severity: Severity, code: string, scope: string, message: string) {
  findings.push({ severity, code, scope, message });
}

// -----------------------------------------------------------------------------
// Frontmatter parsing
// -----------------------------------------------------------------------------

interface SkillMeta {
  name: string
  path: string
  body: string
  complementaryCategories: string[]
  hasComposableSection: boolean
  expectedMatchesSkills: string[] // skills mentioned in the "Expected matches" table
  expectedMatchesTierAnnotations: Map<string, string> // skill → annotated tier (e.g. "T2", "T3", "T4 ASK")
}

interface Frontmatter {
  complementary_categories?: string[]
}

function parseFrontmatter(raw: string): { meta: Frontmatter, body: string } {
  if (!raw.startsWith('---\n')) { return { meta: {}, body: raw }; }
  const end = raw.indexOf('\n---', 4);
  if (end === -1) { return { meta: {}, body: raw }; }
  const yamlText = raw.slice(4, end);
  const body = raw.slice(end + 4);
  try {
    return { meta: (parseYaml(yamlText) ?? {}) as Frontmatter, body };
  }
  catch (e: unknown) {
    const message = e instanceof Error ? e.message : String(e);
    record('ERROR', 'BAD-FRONTMATTER', 'unknown', `YAML parse error: ${message}`);
    return { meta: {}, body };
  }
}

function extractExpectedMatches(body: string): {
  skills: string[]
  tierAnnotations: Map<string, string>
} {
  // Find the section starting with "## Composable Skills" or "## SDD Composition"
  // Look at "Expected matches" table inside it.
  const skills: string[] = [];
  const tierAnnotations = new Map<string, string>();
  const headings = ['## Composable Skills', '## SDD Composition'];
  let sectionStart = -1;
  for (const h of headings) {
    const idx = body.indexOf(h);
    if (idx !== -1) { sectionStart = idx; break; }
  }
  if (sectionStart === -1) { return { skills, tierAnnotations }; }
  // Section ends at next "## " heading (not ###)
  const restAfterStart = body.slice(sectionStart);
  const nextH2 = restAfterStart.slice(2).search(/\n## /);
  const sectionText = nextH2 === -1 ? restAfterStart : restAfterStart.slice(0, nextH2 + 2);
  // Match table rows: lines starting with `|`. Skip header + separator.
  const rows = sectionText.split('\n').filter(l => l.trim().startsWith('|') && !l.trim().startsWith('| ---') && !/\| Category /.test(l));
  for (const row of rows) {
    // Split into cells. First cell is category, second+ are skill listings.
    const cells = row.split('|').map(c => c.trim()).filter(c => c.length > 0);
    if (cells.length < 2) { continue; }
    const skillsCells = cells.slice(1).join(' | '); // join cell[1..n] for matches
    const skillMatches = skillsCells.matchAll(/`([a-z][a-z0-9-]+(?:\/[a-z0-9-]+)?)`/g);
    for (const m of skillMatches) {
      const name = m[1];
      // Filter non-skill tokens (tier markers, status words, common CLI tools)
      if (/^(?:T[1-4]|silent|ASK|none|hybrid|engram|file|strict|standard|off)$/i.test(name)) { continue; }
      if (/^(?:gh|git|npm|pnpm|yarn|npx)$/.test(name)) { continue; }
      skills.push(name);
      // Tier annotation: "(T2)", "(T3)", "(T4)" right after the backtick
      const tierMatch = skillsCells.match(new RegExp(`\`${name}\`\\s*\\((T[1-4])\\)`));
      if (tierMatch) { tierAnnotations.set(name, tierMatch[1]); }
      // "T4 ASK:" prefix marks subsequent skills in that segment as T4
      const beforeName = skillsCells.slice(0, skillsCells.indexOf(`\`${name}\``));
      const lastT4Ask = beforeName.lastIndexOf('T4 ASK');
      const lastSemicolon = beforeName.lastIndexOf(';');
      if (lastT4Ask !== -1 && lastT4Ask > lastSemicolon) {
        tierAnnotations.set(name, 'T4');
      }
    }
  }
  return { skills: [...new Set(skills)], tierAnnotations };
}

function loadSkill(name: string): SkillMeta | null {
  const path = join(SKILLS_DIR, name, 'SKILL.md');
  let raw: string;
  try { raw = readFileSync(path, 'utf8'); }
  catch { return null; }
  const { meta, body } = parseFrontmatter(raw);
  const cats = Array.isArray(meta.complementary_categories) ? meta.complementary_categories : [];
  const hasSection = body.includes('## Composable Skills') || body.includes('## SDD Composition');
  const { skills, tierAnnotations } = extractExpectedMatches(body);
  return {
    name,
    path,
    body,
    complementaryCategories: cats,
    hasComposableSection: hasSection,
    expectedMatchesSkills: skills,
    expectedMatchesTierAnnotations: tierAnnotations,
  };
}

// -----------------------------------------------------------------------------
// install.ts parsing — extract T2 / T3 / T4 skill names
// -----------------------------------------------------------------------------

function extractInstallTsSkills(): { t2: Set<string>, t3: Set<string>, t4: Set<string> } {
  const src = readFileSync(INSTALL_TS, 'utf8');
  const t2 = new Set<string>();
  const t3 = new Set<string>();
  const t4 = new Set<string>();

  // SKILL_SLUGS — array of string literals
  const slugsMatch = src.match(/const SKILL_SLUGS = \[([^\]]+)\]/);
  if (slugsMatch) {
    for (const m of slugsMatch[1].matchAll(/['"]([a-z][a-z0-9-]+)['"]/g)) { t2.add(m[1]); }
  }

  // PROJECT_LEVEL_SKILLS / USER_LEVEL_SKILLS — array of object literals { skill: '...' }
  const projMatch = src.match(/const PROJECT_LEVEL_SKILLS[^=]*=\s*\[([\s\S]*?)\];/);
  if (projMatch) {
    for (const m of projMatch[1].matchAll(/skill:\s*['"]([a-z][a-z0-9-]+)['"]/g)) { t3.add(m[1]); }
  }
  const userMatch = src.match(/const USER_LEVEL_SKILLS[^=]*=\s*\[([\s\S]*?)\];/);
  if (userMatch) {
    for (const m of userMatch[1].matchAll(/skill:\s*['"]([a-z][a-z0-9-]+)['"]/g)) { t4.add(m[1]); }
    // also catch entries with only `package` (whole-repo installs like n8n-skills)
    for (const m of userMatch[1].matchAll(/package:\s*['"]([^'"]*)['"]\s*\}/g)) {
      const pkg = m[1];
      const last = pkg.split('/').pop()?.replace(/\.git$/, '');
      if (last) { t4.add(last); }
    }
  }

  return { t2, t3, t4 };
}

// -----------------------------------------------------------------------------
// Strategy doc §4.1 parsing — category → skills lookup
// -----------------------------------------------------------------------------

interface CategoryEntry {
  skills: string[]
  /**
   * True when §4.1 cell explicitly marks the category as T1-only (no community
   * skills exist — e.g. `issue-tracker` is covered solely by the project-owned
   * `acli` skill). EMPTY-CATEGORY does not fire for these.
   */
  t1Only: boolean
}

function extractCategoryVocab(): Map<string, CategoryEntry> {
  const src = readFileSync(STRATEGY_DOC, 'utf8');
  const startMarker = '### 4.1 Category list';
  const endMarker = '### 4.2';
  const start = src.indexOf(startMarker);
  const end = src.indexOf(endMarker, start);
  if (start === -1 || end === -1) {
    record('ERROR', 'BAD-STRATEGY-DOC', 'strategy', '§4.1 or §4.2 heading missing');
    return new Map();
  }
  const section = src.slice(start, end);
  const vocab = new Map<string, CategoryEntry>();
  for (const line of section.split('\n')) {
    if (!line.trim().startsWith('|')) { continue; }
    if (line.includes('---')) { continue; }
    if (line.includes('Category')) { continue; }
    const cells = line.split('|').map(c => c.trim()).filter(Boolean);
    if (cells.length < 2) { continue; }
    const catMatch = cells[0].match(/^`([a-z][a-z0-9-]+)`$/);
    if (!catMatch) { continue; }
    const category = catMatch[1];
    const skillCell = cells[1];
    const skills = [...skillCell.matchAll(/`([a-z][a-z0-9-]+)`/g)].map(m => m[1]);
    // Detect intentional T1-only marker (e.g. "(acli is T1)") so EMPTY-CATEGORY
    // is suppressed for documented project-owned-only domains.
    const t1Only = /\bis\s+T1\b/i.test(skillCell);
    vocab.set(category, { skills, t1Only });
  }
  return vocab;
}

// -----------------------------------------------------------------------------
// Path mismatch scan (Check 6)
// -----------------------------------------------------------------------------

function walk(dir: string, files: string[] = []): string[] {
  let entries;
  try { entries = readdirSync(dir); }
  catch { return files; }
  for (const e of entries) {
    const full = join(dir, e);
    let s;
    try { s = statSync(full); }
    catch { continue; }
    if (s.isDirectory()) { walk(full, files); }
    else if (e.endsWith('.md')) { files.push(full); }
  }
  return files;
}

function scanForStalePath() {
  const targets: string[] = [];
  for (const t of SCAN_FOR_STALE_PATH) {
    const full = join(REPO_ROOT, t);
    let s;
    try { s = statSync(full); }
    catch { continue; }
    if (s.isDirectory()) { targets.push(...walk(full)); }
    else { targets.push(full); }
  }
  for (const f of targets) {
    const text = readFileSync(f, 'utf8');
    const idx = text.indexOf(STALE_PATH_LITERAL);
    if (idx === -1) { continue; }
    // Strip leading prefix to compute line number
    const line = text.slice(0, idx).split('\n').length;
    record('ERROR', 'STALE-PATH', f.replace(`${REPO_ROOT}/`, ''), `line ${line}: stale ref to '.context/skill-composition-strategy.md' (canonical: '.claude/skills/agentic-dev-core/references/skill-composition-strategy.md')`);
  }
}

// -----------------------------------------------------------------------------
// Inline-code STALE-PATH scan (per-skill, body-scoped)
// -----------------------------------------------------------------------------

function stripFencedCodeBlocks(md: string): string {
  return md.replace(/```[\s\S]*?```/g, '');
}

const INLINE_CODE_PATH
  = /`((?:\.claude\/skills|scripts|cli|\.agents|tests|api)\/[\w./-]+)`/g;

/**
 * Paths that are documented but intentionally generated by a separate manual
 * script (not present in the repo at all times). The lint skips STALE-PATH for
 * these. Each entry's existence is owned by another script — STALE-PATH would
 * be a false positive.
 */
const STALE_PATH_DEFERRED_ALLOWLIST = new Set<string>([
  // .agents/jira-link-types.json — synced by `bun run jira:sync-link-types`.
  // Sync script is stubbed (see scripts/sync-jira-link-types.ts); the JSON
  // file appears only after a real workspace sync. Skills reference the path
  // to teach the contract; STALE-PATH must not fire while it's deferred.
  '.agents/jira-link-types.json',
]);

function checkInlineStalePaths(
  skillSlug: string,
  skillDir: string,
  body: string,
  repoRoot: string,
): void {
  const stripped = stripFencedCodeBlocks(body);
  INLINE_CODE_PATH.lastIndex = 0;
  for (const match of stripped.matchAll(INLINE_CODE_PATH)) {
    const path = match[1];
    if (path.startsWith('/')) { continue; }
    if (path.endsWith('/')) { continue; } // directory-shape illustration, not a file ref
    if (STALE_PATH_DEFERRED_ALLOWLIST.has(path)) { continue; }
    // Skill-dir-first resolution: shorthand like `scripts/foo.ts` inside a skill
    // body resolves against the skill's own directory; fall back to repo root.
    if (existsSync(join(skillDir, path))) { continue; }
    if (existsSync(join(repoRoot, path))) { continue; }
    record('ERROR', 'STALE-PATH', skillSlug, `\`${path}\` referenced in SKILL.md body does not exist on disk`);
  }
}

// -----------------------------------------------------------------------------
// Session-management checks (per agentic-dev-core/references/session-management.md §14)
// -----------------------------------------------------------------------------

function checkSessionBanner(skill: SkillMeta): void {
  if (!(skill.name in SESSION_RETROFITTED_SKILLS)) { return; }
  if (!skill.body.includes(SESSION_BANNER_PREFIX)) {
    record('ERROR', 'SESSION-BANNER-MISSING', skill.name, 'SKILL.md body missing the verbatim session-management banner prefix (see session-management.md §3)');
  }
}

function checkSessionPhase0(skill: SkillMeta): void {
  if (!(skill.name in SESSION_RETROFITTED_SKILLS)) { return; }
  const match = PHASE_0_HEADING.exec(skill.body);
  if (!match) {
    record('ERROR', 'SESSION-PHASE-0-MISSING', skill.name, 'SKILL.md has no `## Phase 0` (or `## Phase -1`) heading');
    return;
  }
  const headingIdx = match.index;
  const restAfter = skill.body.slice(headingIdx + match[0].length);
  const nextH2 = restAfter.search(/\n## /);
  const sectionBody = nextH2 === -1 ? restAfter : restAfter.slice(0, nextH2);
  if (!sectionBody.includes('.session/')) {
    record('ERROR', 'SESSION-PHASE-0-MISSING', skill.name, 'Phase 0 section does not mention `.session/` — must reference session-management resume path');
  }
}

function checkSessionScopes(): void {
  const sessionRoot = join(REPO_ROOT, '.session');
  if (!existsSync(sessionRoot)) { return; }
  for (const [skillSlug, scopeRegex] of Object.entries(SESSION_RETROFITTED_SKILLS)) {
    const skillSessionDir = join(sessionRoot, skillSlug);
    if (!existsSync(skillSessionDir)) { continue; }
    let entries: string[];
    try { entries = readdirSync(skillSessionDir); }
    catch { continue; }
    for (const e of entries) {
      const full = join(skillSessionDir, e);
      let s;
      try { s = statSync(full); }
      catch { continue; }
      if (scopeRegex === null) {
        if (s.isDirectory()) {
          record('WARN', 'SESSION-SCOPE-INVALID', skillSlug, `.session/${skillSlug}/${e}/ exists but ${skillSlug} stores state directly under .session/${skillSlug}/ (no <scope> segment expected)`);
        }
      }
      else {
        if (!s.isDirectory()) { continue; }
        if (!scopeRegex.test(e)) {
          record('WARN', 'SESSION-SCOPE-INVALID', skillSlug, `.session/${skillSlug}/${e}/ does not match expected scope shape ${scopeRegex}`);
        }
      }
    }
  }
}

// -----------------------------------------------------------------------------
// Product-management refactor checks (K1–K4, K7 per the May 2026 refactor plan)
// -----------------------------------------------------------------------------

const PM_DIR = join(SKILLS_DIR, 'product-management');
const MASTER_PLAN_DOCS = [
  join(REPO_ROOT, '.claude/commands/master-implementation-plan.md'),
  join(REPO_ROOT, '.context/master-implementation-plan.md'),
];

/**
 * Anti-pattern citations are lines that document the rule by stating it
 * negatively (e.g. "NEVER hardcode customfield_NNNNN", "❌ No literal tool
 * commands"). These lines legitimately include the banned token as an
 * illustration; skipping them prevents the methodology's own rules from
 * tripping their own lint.
 *
 * Heuristic — line matches ANY of:
 *   - `NEVER`, `Never ` (caveat: must be followed by space to skip false hits like "Nevertheless")
 *   - `Anti-pattern`, `Restrictions`, `never appear`
 *   - leading `❌` (negative checklist row)
 *   - `**No ` (bolded "No" prefix used in summary anti-pattern callouts)
 *   - `- No ` (bulleted "No" anti-pattern row at start of bullet)
 */
function isAntiPatternCitation(line: string): boolean {
  if (/\b(?:NEVER|Never |Anti-pattern|Restrictions|never appear)\b/.test(line)) { return true; }
  if (/❌/.test(line)) { return true; }
  if (/\*\*No\s/.test(line)) { return true; } // "**No `FR-XXX —` prefix.**"
  if (/^\s*[-*]\s+No\s/.test(line)) { return true; }
  return false;
}

interface GrepFinding {
  file: string
  line: number
  text: string
}

function gatherProductManagementMarkdown(): string[] {
  if (!existsSync(PM_DIR)) { return []; }
  return walk(PM_DIR);
}

function scanLines(
  files: string[],
  pattern: RegExp,
  predicate: (line: string, match: RegExpExecArray) => boolean,
): GrepFinding[] {
  const out: GrepFinding[] = [];
  for (const file of files) {
    let text: string;
    try { text = readFileSync(file, 'utf8'); }
    catch { continue; }
    const lines = text.split('\n');
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      pattern.lastIndex = 0;
      const m = pattern.exec(line);
      if (m === null) { continue; }
      if (!predicate(line, m)) { continue; }
      out.push({ file, line: i + 1, text: line.trim() });
    }
  }
  return out;
}

function relScope(file: string): string {
  return file.replace(`${REPO_ROOT}/`, '');
}

function checkPmHardcodedCfid(files: string[]): void {
  // K1: customfield_NNNN literals.
  const re = /customfield_\d{4,}/;
  const hits = scanLines(files, re, line => !isAntiPatternCitation(line));
  for (const h of hits) {
    record(
      'ERROR',
      'PM-HARDCODED-CFID',
      relScope(h.file),
      `line ${h.line}: hardcoded \`${h.text.match(re)?.[0]}\` — use {{jira.<slug>}} instead`,
    );
  }
}

function checkPmFrSummaryPrefix(files: string[]): void {
  // K2: `FR-XXX —` em-dash anti-pattern.
  // Use em-dash U+2014 literal.
  const re = /FR-[A-Z0-9]{3,} —/;
  const hits = scanLines(files, re, line => !isAntiPatternCitation(line));
  for (const h of hits) {
    record(
      'ERROR',
      'PM-FR-SUMMARY-PREFIX',
      relScope(h.file),
      `line ${h.line}: \`FR-XXX —\` summary anti-pattern — use \`**Source spec:** FR-XXX\` as the first body line`,
    );
  }
}

function checkPmDescriptionHeaders(files: string[]): void {
  // K3: ## Acceptance Criteria / ## Scope / ## Out Of Scope H2 headers — WARN.
  const re = /^## (Acceptance [Cc]riteria|Scope|Out [Oo]f [Ss]cope)\s*$/;
  const hits = scanLines(files, re, () => true);
  for (const h of hits) {
    record(
      'WARN',
      'PM-DESC-HEADER',
      relScope(h.file),
      `line ${h.line}: \`${h.text}\` — verify this lives in a methodology discussion section, not a description template (custom fields own AC / Scope / Out Of Scope)`,
    );
  }
}

function checkPmLiteralTools(files: string[]): void {
  // K4: literal tool commands inside skill content — must use [ISSUE_TRACKER_TOOL] pseudo-code.
  const re = /\bacli |mcp__atlassian__|curl[^\n]*rest\/api\/3\//;
  const hits = scanLines(files, re, line => !isAntiPatternCitation(line));
  for (const h of hits) {
    record(
      'ERROR',
      'PM-LITERAL-TOOL',
      relScope(h.file),
      `line ${h.line}: literal tool command — replace with \`[ISSUE_TRACKER_TOOL]\` pseudo-code; HOW belongs in the owning tool skill`,
    );
  }
}

function checkPmWaveTerminology(files: string[]): void {
  // K7: residual "Wave" terminology — except idiom `hand-wave` and anti-pattern citations.
  // Case-insensitive on the `wave` form; word-boundary on both.
  const re = /\bwave\b/i;
  const hits = scanLines(files, re, (line) => {
    if (isAntiPatternCitation(line)) { return false; }
    // Exception 1: idiom `hand-wave` / `hand-waves` / `hand-waving`.
    if (/\bhand-wav(?:e|es|ed|ing)\b/i.test(line)) { return false; }
    // Exception 2: anti-pattern citation with quoted "Wave" or `Wave`.
    if (/"Wave"/.test(line)) { return false; }
    if (/`Wave`/.test(line)) { return false; }
    return true;
  });
  for (const h of hits) {
    record(
      'ERROR',
      'PM-WAVE-TERMINOLOGY',
      relScope(h.file),
      `line ${h.line}: residual "Wave" — use "Sprint" (or "Master Sprint" / "Execution Sprint" when ambiguity matters)`,
    );
  }
}

function checkProductManagementRefactor(): void {
  const pmFiles = gatherProductManagementMarkdown();
  checkPmHardcodedCfid(pmFiles);
  checkPmFrSummaryPrefix(pmFiles);
  checkPmDescriptionHeaders(pmFiles);
  checkPmLiteralTools(pmFiles);

  // K7 also scans master-implementation-plan command + generated doc.
  const waveFiles = [...pmFiles];
  for (const p of MASTER_PLAN_DOCS) {
    if (existsSync(p)) { waveFiles.push(p); }
  }
  checkPmWaveTerminology(waveFiles);
}

// -----------------------------------------------------------------------------
// Main
// -----------------------------------------------------------------------------

function tierOf(skillName: string, t1: Set<string>, t2: Set<string>, t3: Set<string>, t4: Set<string>): string | null {
  if (t1.has(skillName)) { return 'T1'; }
  if (t2.has(skillName)) { return 'T2'; }
  if (t3.has(skillName)) { return 'T3'; }
  if (t4.has(skillName)) { return 'T4'; }
  return null;
}

function main() {
  // Discover T1 skills (folders in .claude/skills/)
  const t1 = new Set<string>();
  for (const e of readdirSync(SKILLS_DIR)) {
    const skillFile = join(SKILLS_DIR, e, 'SKILL.md');
    try { if (statSync(skillFile).isFile()) { t1.add(e); } }
    catch { /* skip */ }
  }

  const { t2, t3, t4 } = extractInstallTsSkills();
  const vocab = extractCategoryVocab();

  // Check 8: duplicate across tiers
  const seen = new Map<string, string[]>();
  for (const s of t2) { (seen.get(s) ?? seen.set(s, []).get(s)!).push('T2'); }
  for (const s of t3) { (seen.get(s) ?? seen.set(s, []).get(s)!).push('T3'); }
  for (const s of t4) { (seen.get(s) ?? seen.set(s, []).get(s)!).push('T4'); }
  for (const [skill, tiers] of seen) {
    if (tiers.length > 1) {
      record('ERROR', 'DUPLICATE-TIER', `install.ts:${skill}`, `appears in multiple tiers: ${tiers.join(', ')}`);
    }
  }

  // Check 5: empty-category — §4.1 row maps a category to zero skills.
  // A category with one or more skills is healthy (single-skill is fine — if
  // the lone skill disappears the installer surfaces it; categories are not
  // forced to be redundant). Categories marked as T1-only (e.g. `issue-tracker`,
  // covered exclusively by the project-owned `acli` skill) are intentionally
  // empty and exempt.
  for (const [cat, entry] of vocab) {
    if (entry.skills.length === 0 && !entry.t1Only) {
      record('ERROR', 'EMPTY-CATEGORY', `§4.1:${cat}`, 'category declared in §4.1 but maps to zero skills (unreachable)');
    }
  }

  // Per-skill checks
  for (const skillName of [...t1].sort()) {
    const skill = loadSkill(skillName);
    if (!skill) {
      record('ERROR', 'UNREADABLE', skillName, 'SKILL.md missing or unreadable');
      continue;
    }

    // Check 4: missing Composable Skills section
    if (skill.complementaryCategories.length > 0 && !skill.hasComposableSection && skillName !== SPRINT_DEV_EXEMPT) {
      record('ERROR', 'MISSING-SECTION', skillName, 'has complementary_categories but no `## Composable Skills` heading');
    }

    // Check 1: orphan category
    for (const cat of skill.complementaryCategories) {
      if (!vocab.has(cat)) {
        record('ERROR', 'ORPHAN-CATEGORY', skillName, `category '${cat}' not in strategy doc §4.1`);
      }
    }

    // Check 2: stale skill mentions
    // Lenient: accept if known in install.ts (any tier) OR mentioned anywhere in §4.1 vocab.
    const vocabSkillSet = new Set<string>();
    for (const entry of vocab.values()) { for (const s of entry.skills) { vocabSkillSet.add(s); } }
    for (const mentioned of skill.expectedMatchesSkills) {
      const tier = tierOf(mentioned, t1, t2, t3, t4);
      if (!tier && !vocabSkillSet.has(mentioned)) {
        record('WARN', 'STALE-MENTION', skillName, `Expected matches cites '${mentioned}' which is not in any tier (T1/T2/T3/T4) nor in §4.1 vocab`);
      }
    }

    // Check 3: tier mismatch
    for (const [skillName2, annotatedTier] of skill.expectedMatchesTierAnnotations) {
      const actualTier = tierOf(skillName2, t1, t2, t3, t4);
      if (actualTier && actualTier !== annotatedTier) {
        record('ERROR', 'TIER-MISMATCH', skillName, `'${skillName2}' annotated as ${annotatedTier} but install.ts says ${actualTier}`);
      }
    }

    // Inline-code STALE-PATH: path-like literals in backtick spans of SKILL.md
    // body must resolve relative to the skill dir or repo root.
    checkInlineStalePaths(skillName, join(SKILLS_DIR, skillName), skill.body, REPO_ROOT);

    // Session-management checks (per-skill).
    checkSessionBanner(skill);
    checkSessionPhase0(skill);
  }

  // Check 6: stale path scan
  scanForStalePath();

  // Session-management checks (global).
  checkSessionScopes();

  // Product-management refactor checks (K1–K4, K7).
  checkProductManagementRefactor();

  // Report
  const counts = { ERROR: 0, WARN: 0, INFO: 0 };
  for (const f of findings) { counts[f.severity]++; }

  // Group by severity, then scope
  const byScope = new Map<string, Finding[]>();
  for (const f of findings) {
    const arr = byScope.get(f.scope) ?? [];
    arr.push(f);
    byScope.set(f.scope, arr);
  }

  const t1Sorted = [...t1].sort();
  console.log('\nlint-skills — skill composition system audit');
  console.log(`Scanning ${SKILLS_DIR.replace(`${REPO_ROOT}/`, '')} ... ${t1.size} T1 skills`);
  console.log(`Reading ${STRATEGY_DOC.replace(`${REPO_ROOT}/`, '')} §4.1 ... ${vocab.size} categories`);
  console.log(`Reading cli/install.ts ... ${t2.size} T2, ${t3.size} T3, ${t4.size} T4\n`);

  for (const skill of t1Sorted) {
    const skillFindings = findings.filter(f => f.scope === skill);
    const errs = skillFindings.filter(f => f.severity === 'ERROR').length;
    const warns = skillFindings.filter(f => f.severity === 'WARN').length;
    const infos = skillFindings.filter(f => f.severity === 'INFO').length;
    const icon = errs > 0 ? '❌' : warns > 0 ? '⚠️ ' : infos > 0 ? 'ℹ️ ' : '✅';
    const tag = errs > 0 ? `${errs} ERROR` : warns > 0 ? `${warns} WARN` : infos > 0 ? `${infos} INFO` : 'OK';
    console.log(`${icon}  ${skill.padEnd(25)} — ${tag}`);
    for (const f of skillFindings) {
      console.log(`     [${f.severity}/${f.code}] ${f.message}`);
    }
  }

  // Non-skill-scoped findings
  const nonSkillScopes = [...new Set(findings.map(f => f.scope))].filter(s => !t1.has(s));
  if (nonSkillScopes.length > 0) {
    console.log('\nGlobal findings:');
    for (const scope of nonSkillScopes.sort()) {
      for (const f of findings.filter(x => x.scope === scope)) {
        const icon = f.severity === 'ERROR' ? '❌' : f.severity === 'WARN' ? '⚠️ ' : 'ℹ️ ';
        console.log(`${icon}  [${f.severity}/${f.code}] ${scope} — ${f.message}`);
      }
    }
  }

  console.log(`\nSummary: ${counts.ERROR} errors, ${counts.WARN} warnings, ${counts.INFO} info`);
  process.exit(counts.ERROR > 0 ? 1 : 0);
}

main();
