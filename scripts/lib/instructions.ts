/**
 * instructions.ts — readers for the progressive disclosure of the project
 * instructions: the always-on `AGENTS.md` (L0) and the on-demand section files
 * under `.agents/instructions/` (L1).
 *
 * One parser per shape, shared by `scripts/lint-instructions.ts` and every
 * reader of a table that moved out of `AGENTS.md` (the skill router of
 * `scripts/lint-docs.ts`). A reader asks for the section first and falls back
 * to `AGENTS.md`, so a project that still carries the single-file layout keeps
 * passing its gates.
 */

import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { parse as parseYaml } from 'yaml';

export const L0_FILE = 'AGENTS.md';
export const SECTIONS_DIR = '.agents/instructions';
export const RULES_FILE = '01-critical-rules.md';
export const SKILLS_FILE = '20-skills-and-mcps.md';
export const PROJECT_FILE = 'project.md';
export const README_FILE = 'README.md';
/** The heading `bun run up --adopt` puts above an adopted app's preserved instructions (`ADOPT_INSTRUCTIONS_HEADING` in `cli/lib/updater-adopt.ts`). */
export const APP_BLOCK_HEADING = '## 0. Project instructions (pre-adoption)';

/** A numbered section file: `NN-<id>.md`. */
export const NUMBERED_SECTION = /^(\d{2})-([a-z0-9]+(?:-[a-z0-9]+)*)\.md$/;

export interface RouterRow {
  /** 1-based line in L0. */
  line: number
  kind: string
  /** Repo-relative load targets: backticked paths, then bare `@path` imports. */
  targets: string[]
}

export interface L0Rule {
  n: number
  name: string
  /** Verbatim excerpts of the full rule (`…` joins them in L0). */
  excerpts: string[]
  line: number
}

/** Text with fenced blocks blanked and inline code spans emptied (line count kept). */
export function withoutCode(text: string): string {
  let fenced = false;
  return text.split('\n').map((line) => {
    if (/^\s*(?:```|~~~)/.test(line)) {
      fenced = !fenced;
      return '';
    }
    return fenced ? '' : line.replace(/`[^`]*`/g, '``');
  }).join('\n');
}

/** Bytes of L0 without an adopted app's preserved block (from its heading to the last `## 1` heading). */
export function coreBytes(l0: string): number {
  const lines = l0.split('\n');
  const start = lines.findIndex(l => l.trim() === APP_BLOCK_HEADING);
  if (start === -1) { return Buffer.byteLength(l0); }
  let end = lines.length;
  for (let i = lines.length - 1; i > start; i -= 1) {
    if (/^## 1[.\s]/.test(lines[i])) {
      end = i;
      break;
    }
  }
  return Buffer.byteLength([...lines.slice(0, start), ...lines.slice(end)].join('\n'));
}

/** Rows of the L0 router table, or null when its markers are missing. */
export function parseRouter(l0: string): RouterRow[] | null {
  const lines = l0.split('\n');
  const start = lines.findIndex(l => l.trim() === '<!-- router:start -->');
  const end = lines.findIndex(l => l.trim() === '<!-- router:end -->');
  if (start === -1 || end === -1 || end < start) { return null; }
  const rows: RouterRow[] = [];
  for (let i = start + 1; i < end; i += 1) {
    const line = lines[i].trim();
    if (!line.startsWith('|') || /^\|[\s:|-]+\|$/.test(line)) { continue; }
    const cells = line.slice(1, -1).split('|').map(c => c.trim());
    if (cells[0] === 'Kind') { continue; }
    const load = cells[1] ?? '';
    const targets = [
      ...[...load.matchAll(/`([^`]+)`/g)].map(m => m[1]),
      ...[...load.replace(/`[^`]*`/g, '').matchAll(/(?<![\w.])@([\w./-]+)/g)].map(m => m[1]),
    ];
    rows.push({ line: i + 1, kind: cells[0] ?? '', targets });
  }
  return rows;
}

/** YAML frontmatter of a section file, or null when it has none. */
export function parseFrontmatter(text: string): Record<string, unknown> | null {
  const match = /^---\n([\s\S]*?)\n---\n/.exec(text);
  if (!match) { return null; }
  const data = parseYaml(match[1]) as unknown;
  return data && typeof data === 'object' ? data as Record<string, unknown> : null;
}

/** Critical Rules as L0 states them under `## 1. CRITICAL RULES`. */
export function parseL0Rules(l0: string): L0Rule[] {
  const lines = l0.split('\n');
  const start = lines.findIndex(l => l.startsWith('## 1. CRITICAL RULES'));
  if (start === -1) { return []; }
  const rules: L0Rule[] = [];
  for (let i = start + 1; i < lines.length && !lines[i].startsWith('## '); i += 1) {
    const m = /^(\d+)\. \*\*([^*]+)\*\*(.*)$/.exec(lines[i]);
    if (!m) { continue; }
    const body = m[3].replace(/\s*Full: \S+\s*$/, '').replace(/^[:.]\s*/, '').trim();
    rules.push({ n: Number(m[1]), name: m[2], excerpts: body.split('…').map(s => s.trim()).filter(Boolean), line: i + 1 });
  }
  return rules;
}

/** Full rule bodies of the critical-rules section, keyed by number (`## N. NAME`). */
export function parseFullRules(text: string): Map<number, { name: string, body: string }> {
  const rules = new Map<number, { name: string, body: string }>();
  for (const part of text.split(/^## /m).slice(1)) {
    const m = /^(\d+)\. (.+)\n([\s\S]*)$/.exec(part);
    if (m) { rules.set(Number(m[1]), { name: m[2].trim(), body: m[3] }); }
  }
  return rules;
}

/**
 * The file that holds the skill router table (`### Skills T1`): the skills
 * section when it exists, `AGENTS.md` otherwise. Null when neither exists.
 */
export function skillTableSource(root: string): { file: string, text: string } | null {
  for (const file of [`${SECTIONS_DIR}/${SKILLS_FILE}`, L0_FILE]) {
    const full = join(root, file);
    if (existsSync(full)) { return { file, text: readFileSync(full, 'utf8') }; }
  }
  return null;
}
