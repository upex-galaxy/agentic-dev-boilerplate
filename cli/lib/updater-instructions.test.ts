import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';

import { afterEach, describe, expect, test } from 'bun:test';
import { parse as parseYaml } from 'yaml';

import {
  deliverProjectInstructionsStub,
  findStubLeaks,
  INSTRUCTIONS_DIR,
  isSplitL0,
  LEGACY_SECTION_HOMES,
  legacyHeadingHome,
  PROJECT_INSTRUCTIONS_FILE,
  PROJECT_INSTRUCTIONS_TEMPLATE,
} from './updater-instructions.ts';
import { collectParityFindings, legacyInstructionsMap, legacyInstructionsNote } from './updater-parity.ts';

const REPO = join(import.meta.dir, '..', '..');
const readRepo = (rel: string): string => readFileSync(join(REPO, rel), 'utf8');

const roots: string[] = [];
function tempRoot(): string {
  const root = mkdtempSync(join(tmpdir(), 'updater instructions '));
  roots.push(root);
  return root;
}
afterEach(() => {
  while (roots.length > 0) { rmSync(roots.pop()!, { recursive: true, force: true }); }
});
function write(root: string, rel: string, text: string): void {
  mkdirSync(dirname(join(root, rel)), { recursive: true });
  writeFileSync(join(root, rel), text);
}

/** The headings of the pre-split single-file AGENTS.md (the last release before progressive disclosure). */
const LEGACY_HEADINGS = [
  '# AGENTS.md: AI Persistent Memory',
  '## 1. CRITICAL RULES: ALWAYS APPLY',
  '## 2. BEHAVIORAL LAYER: HOW AI REASONS',
  '## 3. ORCHESTRATION MODE: PERMANENTLY ACTIVE',
  '## 4. CONTEXT LOADING MAP: TASK → WHAT TO LOAD',
  '## 5. SKILLS + MODES + MCPs REGISTRY',
  '### Skills T1 (committed in `.agents/skills/`)',
  '### Skill modes',
  '### MCPs (decision rules)',
  '## 5.5 MULTI-HARNESS: ONE SOURCE, THREE CONSUMERS',
  '## 6. TOOL RESOLUTION ([TAG_TOOL] pseudocode)',
  '## 6.5 CLI → SKILL AUTO-LOAD MAPPING',
  '## 7. PROJECT VARIABLES: POINTER',
  '## 8. AI BEHAVIOR DURING DEVELOPMENT',
  '## 9. LOCAL CONTEXT (PBI)',
  '## 10. STACK QUICK-REFERENCE (TypeScript + DRY)',
  '## 11. GIT WORKFLOW: POINTERS',
  '## Git Strategy',
  '## 12. PROACTIVE MEMORY TRIGGERS',
];
const legacyAgents = (extra: string[] = []): string =>
  [...LEGACY_HEADINGS, ...extra].map(h => `${h}\n\nbody of ${h}\n`).join('\n');

describe('the shipped stub', () => {
  test('passes the leak gate against the boilerplate\'s own project.md, which fails it', () => {
    const stub = readRepo(PROJECT_INSTRUCTIONS_TEMPLATE);
    const own = readRepo(PROJECT_INSTRUCTIONS_FILE);
    expect(findStubLeaks(stub, own)).toEqual([]);
    // The gate is real: the maintainer's file is exactly what it refuses.
    expect(findStubLeaks(own, own).length).toBeGreaterThan(0);
    expect(findStubLeaks(own, null).length).toBeGreaterThan(0);
  });

  test('carries the overlay frontmatter instructions:check expects of project.md (id, title, load_when, no triggers)', () => {
    const stub = readRepo(PROJECT_INSTRUCTIONS_TEMPLATE);
    const match = /^---\n([\s\S]*?)\n---\n/.exec(stub);
    expect(match).not.toBeNull();
    const meta = parseYaml(match![1]) as Record<string, unknown>;
    expect(meta.id).toBe('project');
    expect(typeof meta.title).toBe('string');
    expect(typeof meta.load_when).toBe('string');
    expect('triggers' in meta).toBe(false);
  });

  test('is not a `.md` file, so no section reader or instructions:check ever treats it as a section', () => {
    expect(PROJECT_INSTRUCTIONS_TEMPLATE.endsWith('.md')).toBe(false);
    expect(PROJECT_INSTRUCTIONS_TEMPLATE.startsWith(`${INSTRUCTIONS_DIR}/`)).toBe(true);
  });
});

describe('findStubLeaks', () => {
  test('a body line copied from the boilerplate\'s project.md is a leak; frontmatter and headings are not', () => {
    const own = '---\nid: project\n---\n\n# Project instructions\n\nThis line is long enough to identify the maintainer copy verbatim.\n';
    const stub = '---\nid: project\n---\n\n# Project instructions\n\nThis line is long enough to identify the maintainer copy verbatim.\n';
    expect(findStubLeaks(stub, own)).toEqual([{ line: 7, why: 'a line copied from the boilerplate\'s own project.md', text: 'This line is long enough to identify the maintainer copy verbatim.' }]);
    expect(findStubLeaks('---\nid: project\n---\n\n# Project instructions\n\nGeneric text.\n', own)).toEqual([]);
  });

  test('the vocabulary of the boilerplate\'s own exception is refused even without its file', () => {
    expect(findStubLeaks('We keep the accepted_divergences list here.\n', null)[0]?.why).toBe('the accepted ruleset divergence');
    expect(findStubLeaks('Pushes run under standing authorization.\n', null)[0]?.why).toBe('a standing push authorization');
  });
});

describe('deliverProjectInstructionsStub', () => {
  const STUB = '---\nid: project\ntitle: "Project instructions"\nload_when: "x"\n---\n\n# Project instructions\n';

  test('a project without project.md gets the stub once; a dry run writes nothing', () => {
    const upstream = tempRoot();
    const repo = tempRoot();
    write(upstream, PROJECT_INSTRUCTIONS_TEMPLATE, STUB);
    write(upstream, PROJECT_INSTRUCTIONS_FILE, '---\nid: project\n---\n\nThis repository runs under standing authorization.\n');
    expect(deliverProjectInstructionsStub(repo, upstream, { dryRun: true })).toEqual({ kind: 'delivered', dryRun: true });
    expect(existsSync(join(repo, PROJECT_INSTRUCTIONS_FILE))).toBe(false);
    expect(deliverProjectInstructionsStub(repo, upstream)).toEqual({ kind: 'delivered', dryRun: false });
    expect(readFileSync(join(repo, PROJECT_INSTRUCTIONS_FILE), 'utf8')).toBe(STUB);
  });

  test('an existing project.md is never touched, whatever it says', () => {
    const upstream = tempRoot();
    const repo = tempRoot();
    write(upstream, PROJECT_INSTRUCTIONS_TEMPLATE, STUB);
    write(repo, PROJECT_INSTRUCTIONS_FILE, 'mine\n');
    expect(deliverProjectInstructionsStub(repo, upstream)).toEqual({ kind: 'present' });
    expect(readFileSync(join(repo, PROJECT_INSTRUCTIONS_FILE), 'utf8')).toBe('mine\n');
  });

  test('an upstream without the template delivers nothing; a leaking template is refused and nothing is written', () => {
    const upstream = tempRoot();
    const repo = tempRoot();
    expect(deliverProjectInstructionsStub(repo, upstream)).toEqual({ kind: 'no-template' });
    write(upstream, PROJECT_INSTRUCTIONS_TEMPLATE, `${STUB}\nThe maintainer's admin credential is on the bypass list.\n`);
    const outcome = deliverProjectInstructionsStub(repo, upstream);
    expect(outcome.kind).toBe('refused');
    expect(existsSync(join(repo, PROJECT_INSTRUCTIONS_FILE))).toBe(false);
  });
});

describe('legacy AGENTS.md heading map', () => {
  test('every heading of the pre-split file has a home, and every home exists in this repo', () => {
    for (const heading of LEGACY_HEADINGS.slice(1)) {
      expect(legacyHeadingHome(heading)).not.toBeNull();
    }
    for (const { home } of LEGACY_SECTION_HOMES) {
      for (const file of home.files) { expect(existsSync(join(REPO, file))).toBe(true); }
    }
    expect(legacyHeadingHome('## 13. ACME DEPLOY RULES')).toBeNull();
    // Number match, not substring: 5.5 is the harness section, not the skills one.
    expect(legacyHeadingHome('## 5.5 MULTI-HARNESS')?.files).toEqual([`${INSTRUCTIONS_DIR}/10-harnesses.md`]);
  });

  test('this repo\'s AGENTS.md is the split L0', () => {
    expect(isSplitL0(readRepo('AGENTS.md'))).toBe(true);
  });

  test('a pre-split project gets a row that maps moved headings to sections and its own headings to project.md', () => {
    const upstream = readRepo('AGENTS.md');
    const project = legacyAgents(['## 13. ACME DEPLOY RULES']);
    const rows = legacyInstructionsMap(project, upstream);
    expect(rows.find(r => r.heading === '13. ACME DEPLOY RULES')).toMatchObject({ kind: 'own', files: [PROJECT_INSTRUCTIONS_FILE] });
    expect(rows.find(r => r.heading.startsWith('9. LOCAL CONTEXT'))).toMatchObject({ kind: 'moved', files: [`${INSTRUCTIONS_DIR}/60-local-context-pbi.md`] });
    expect(rows.find(r => r.heading === 'Git Strategy')?.files).toContain(PROJECT_INSTRUCTIONS_FILE);
    // The shared title maps to nothing.
    expect(rows.some(r => r.heading.startsWith('AGENTS.md'))).toBe(false);

    const note = legacyInstructionsNote('AGENTS.md', project, upstream);
    expect(note).not.toBeNull();
    expect(note!.clause).toContain('legacy single-file AGENTS.md: 14 heading(s) now ship as synced sections');
    expect(note!.clause).toContain('1 heading(s) are this project\'s own and move into .agents/instructions/project.md');
    expect(note!.clause).toContain('LOAD PROTOCOL + ROUTER');
    expect(note!.clause).toContain('never rewritten automatically');
    expect(note!.note).toContain('| 13. ACME DEPLOY RULES | `.agents/instructions/project.md` |');
  });

  test('no row once the project\'s AGENTS.md is the split L0, nor for another file', () => {
    const upstream = readRepo('AGENTS.md');
    expect(legacyInstructionsNote('AGENTS.md', upstream, upstream)).toBeNull();
    expect(legacyInstructionsNote('CONTEXT.md', legacyAgents(), upstream)).toBeNull();
    // An upstream that is still the single file is not a split to migrate to.
    expect(legacyInstructionsNote('AGENTS.md', legacyAgents(), legacyAgents())).toBeNull();
  });

  test('the AGENTS.md drift row carries the map instead of "keep project-only headings"', () => {
    const root = tempRoot();
    const upstreamDir = tempRoot();
    write(root, 'AGENTS.md', legacyAgents(['## 13. ACME DEPLOY RULES']));
    write(upstreamDir, 'AGENTS.md', readRepo('AGENTS.md'));
    const findings = collectParityFindings({
      root,
      upstreamDir,
      drift: [{ path: 'AGENTS.md', reason: 'per-project AI memory', structural: false }],
      compatErrors: [],
      archivedSkills: [],
      archivedSkillsDir: join(root, 'archive'),
      heldBack: [],
      envNewKeys: [],
      contextMaps: [],
    });
    const row = findings.find(f => f.path === 'AGENTS.md');
    expect(row).toBeDefined();
    expect(row!.suggested).toBe('merge');
    expect(row!.blocking).toBe(false);
    expect(row!.evidence).toContain('legacy single-file AGENTS.md');
    expect(row!.evidence).not.toContain('keep project-only headings');
    expect(row!.note).toContain('| Your heading | Lives now in | What to do |');
  });
});
