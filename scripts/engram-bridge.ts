#!/usr/bin/env bun
/**
 * engram-bridge.ts — optional mirror of PBI artifacts to Engram.
 *
 * The bridge is a lightweight wrapper around the `engram` CLI. It auto-detects
 * the binary on PATH; if absent, every subcommand no-ops cleanly with exit 0.
 * No package.json dependency is added; the binary is the only coupling, and
 * it's optional.
 *
 * Convention: artifacts are stored file-first under
 * `.context/PBI/{ticket}/{artifact}.md`. The bridge mirrors them to Engram with
 * the deterministic topic_key `pbi/{ticket}/{artifact}` (UPSERT semantics).
 * See `.claude/skills/agentic-dev-core/references/topic-key-conventions.md`.
 *
 * Subcommands:
 *   save <ticket> <artifact-path>
 *       Save the file's contents to Engram. The artifact name is derived from
 *       the file basename (minus `.md`). Example:
 *           bun scripts/engram-bridge.ts save UPEX-123 .context/PBI/UPEX-123/impl-plan.md
 *           → engram save "pbi/UPEX-123/impl-plan" "<content>" \
 *                 --topic pbi/UPEX-123/impl-plan --type architecture --scope project
 *
 *   search <query>
 *       Search Engram for matching topic_keys / content. Returns IDs + previews.
 *           bun scripts/engram-bridge.ts search "pbi/UPEX-123"
 *           → engram search "pbi/UPEX-123" --scope project
 *
 *   get <observation-id>
 *       Fetch full content of one observation by ID. Engram's CLI exposes this
 *       as `timeline <id>` — we wrap it with `--before 0 --after 0` to get
 *       just the target observation.
 *           bun scripts/engram-bridge.ts get abc123
 *           → engram timeline abc123 --before 0 --after 0
 *
 * Flags:
 *   --dry-run            Print the engram command that would run; do not exec.
 *   --verbose, -v        Log each step (binary detection, key derivation, exec).
 *   --no-capture-prompt  Pass through to engram (auto-generated artifacts).
 *   --help, -h           Show usage.
 *
 * Exit codes:
 *   0 — success, OR engram absent (no-op), OR --dry-run
 *   1 — bad arguments, file not found, or engram exec failed
 */

import { spawnSync } from 'node:child_process';
import { existsSync, readFileSync, statSync } from 'node:fs';
import { basename, resolve } from 'node:path';

// -----------------------------------------------------------------------------
// Types
// -----------------------------------------------------------------------------

type Subcommand = 'save' | 'search' | 'get';

interface CliFlags {
  dryRun: boolean
  verbose: boolean
  captureProm: boolean | null
  subcommand: Subcommand | null
  positional: string[]
}

// -----------------------------------------------------------------------------
// CLI parsing
// -----------------------------------------------------------------------------

function printHelp(): void {
  console.log(`Usage:
  bun scripts/engram-bridge.ts save <ticket> <artifact-path> [--dry-run] [--verbose] [--no-capture-prompt]
  bun scripts/engram-bridge.ts search <query>                [--dry-run] [--verbose]
  bun scripts/engram-bridge.ts get <observation-id>          [--dry-run] [--verbose]

Mirror PBI artifacts to Engram (when the binary is on PATH; no-op otherwise).

Subcommands:
  save     Upload a file's contents under topic_key pbi/{ticket}/{artifact}.
           Artifact name is derived from the file basename (minus .md).
  search   Search Engram for matching topic_keys / content. Returns IDs.
  get      Fetch the full content of one observation by ID (engram timeline
           with --before 0 --after 0).

Flags:
  --dry-run            Print the engram command that would run; do not exec.
  --verbose, -v        Log each step.
  --no-capture-prompt  Pass through to engram (auto-generated artifacts).
                       Default for 'save' is capture_prompt=true unless this
                       flag is set.
  --help, -h           Show this help.

Exit codes:
  0 — success, engram absent (no-op), or --dry-run
  1 — bad arguments, file not found, or engram exec failed

See .claude/skills/agentic-dev-core/references/topic-key-conventions.md for the
convention this script implements.
`);
}

function parseArgs(argv: string[]): CliFlags {
  if (argv.length === 0 || argv.includes('-h') || argv.includes('--help')) {
    printHelp();
    process.exit(0);
  }

  const flags: CliFlags = {
    dryRun: false,
    verbose: false,
    captureProm: null,
    subcommand: null,
    positional: [],
  };

  for (const arg of argv) {
    if (arg === '--dry-run') { flags.dryRun = true; }
    else if (arg === '--verbose' || arg === '-v') { flags.verbose = true; }
    else if (arg === '--no-capture-prompt') { flags.captureProm = false; }
    else if (arg === '--capture-prompt') { flags.captureProm = true; }
    else if (arg.startsWith('--')) {
      console.error(`Unknown flag: ${arg}`);
      process.exit(1);
    }
    else if (flags.subcommand === null) {
      if (arg !== 'save' && arg !== 'search' && arg !== 'get') {
        console.error(`Unknown subcommand: ${arg}`);
        printHelp();
        process.exit(1);
      }
      flags.subcommand = arg;
    }
    else { flags.positional.push(arg); }
  }

  return flags;
}

let VERBOSE = false;
function vlog(msg: string): void {
  if (VERBOSE) { console.log(`  ${msg}`); }
}

// -----------------------------------------------------------------------------
// Engram detection
// -----------------------------------------------------------------------------

/** Returns the absolute path to `engram` if on PATH, or null otherwise. */
function detectEngram(): string | null {
  const result = spawnSync('which', ['engram'], { encoding: 'utf8' });
  if (result.status !== 0) { return null; }
  const path = result.stdout.trim();
  if (path === '') { return null; }
  vlog(`[engram] detected at ${path}`);
  return path;
}

function engramAbsentMessage(): void {
  console.log('engram-bridge: `engram` not found on PATH — no-op.');
  console.log('  Install: https://github.com/aleemrahil/engram (or `brew install engram`).');
  console.log('  Artifacts remain file-first under .context/PBI/{ticket}/{artifact}.md.');
}

// -----------------------------------------------------------------------------
// Topic-key helpers
// -----------------------------------------------------------------------------

/** Derive `pbi/{ticket}/{artifact}` from a file path. */
function deriveTopicKey(ticket: string, artifactPath: string): string {
  const base = basename(artifactPath);
  // Strip a single trailing .md extension; keep dots inside the name.
  const artifact = base.endsWith('.md') ? base.slice(0, -3) : base;
  if (artifact === '') {
    console.error(`Cannot derive artifact name from path: ${artifactPath}`);
    process.exit(1);
  }
  return `pbi/${ticket}/${artifact}`;
}

// -----------------------------------------------------------------------------
// Subcommand handlers
// -----------------------------------------------------------------------------

interface ExecPlan {
  bin: string
  args: string[]
  /** Optional stdin content (used by `save` for very large payloads if needed). */
  stdin?: string
}

function planSave(flags: CliFlags, engramBin: string): ExecPlan {
  if (flags.positional.length !== 2) {
    console.error('Usage: save <ticket> <artifact-path>');
    process.exit(1);
  }
  const [ticket, artifactPath] = flags.positional as [string, string];

  const absPath = resolve(artifactPath);
  if (!existsSync(absPath)) {
    console.error(`File not found: ${absPath}`);
    process.exit(1);
  }
  const stat = statSync(absPath);
  if (!stat.isFile()) {
    console.error(`Not a regular file: ${absPath}`);
    process.exit(1);
  }

  let content: string;
  try { content = readFileSync(absPath, 'utf8'); }
  catch (err) {
    console.error(`Cannot read ${absPath}: ${(err as Error).message}`);
    process.exit(1);
  }

  const topicKey = deriveTopicKey(ticket, absPath);
  vlog(`[save] topic_key=${topicKey}`);
  vlog(`[save] bytes=${content.length}`);

  // Engram CLI signature:
  //   engram save <title> <content> [--type TYPE] [--project PROJECT]
  //                                  [--scope SCOPE] [--topic TOPIC_KEY]
  // We use the topic_key as the title too, so the human-readable handle
  // matches the deterministic key. type=architecture, scope=project mirror
  // the gentle-ai SDD convention this bridge is inspired by.
  const args = [
    'save',
    topicKey,
    content,
    '--topic',
    topicKey,
    '--type',
    'architecture',
    '--scope',
    'project',
  ];

  // capture_prompt: bridge default = true (preserve human intent).
  // --no-capture-prompt explicitly opts out for auto-generated artifacts.
  // The engram CLI itself does not (today) expose --capture-prompt as a
  // flag on `save`; the field is set by the calling agent. We log the
  // intended value so the operator can see it, and pass it through if the
  // CLI ever surfaces the flag. Forward-compatible: harmless today.
  if (flags.captureProm === false) {
    vlog('[save] capture_prompt=false (auto-generated artifact)');
  }
  else {
    vlog('[save] capture_prompt=true (default; pass --no-capture-prompt for auto-generated)');
  }

  return { bin: engramBin, args };
}

function planSearch(flags: CliFlags, engramBin: string): ExecPlan {
  if (flags.positional.length !== 1) {
    console.error('Usage: search <query>');
    process.exit(1);
  }
  const query = flags.positional[0];
  vlog(`[search] query=${query}`);
  return {
    bin: engramBin,
    args: ['search', query, '--scope', 'project'],
  };
}

function planGet(flags: CliFlags, engramBin: string): ExecPlan {
  if (flags.positional.length !== 1) {
    console.error('Usage: get <observation-id>');
    process.exit(1);
  }
  const obsId = flags.positional[0];
  vlog(`[get] observation_id=${obsId}`);
  // Engram CLI lacks a literal `get` subcommand; `timeline <id>` returns the
  // observation plus surrounding context. With --before 0 --after 0 we get
  // just the target. This is the closest equivalent to the MCP
  // `mem_get_observation` operation.
  return {
    bin: engramBin,
    args: ['timeline', obsId, '--before', '0', '--after', '0'],
  };
}

// -----------------------------------------------------------------------------
// Exec
// -----------------------------------------------------------------------------

function execPlan(plan: ExecPlan, dryRun: boolean): number {
  // Compact preview that doesn't dump megabytes of file content into the log.
  const previewArgs = plan.args.map((a, i) => {
    // The 3rd arg of `save` is the full content; truncate it for display.
    if (i === 2 && plan.args[0] === 'save' && a.length > 80) {
      return `<${a.length} bytes>`;
    }
    return a.includes(' ') ? `'${a}'` : a;
  });
  const preview = `${plan.bin} ${previewArgs.join(' ')}`;

  if (dryRun) {
    console.log(`[dry-run] would exec: ${preview}`);
    return 0;
  }

  vlog(`[exec] ${preview}`);
  const result = spawnSync(plan.bin, plan.args, {
    stdio: ['ignore', 'inherit', 'inherit'],
    encoding: 'utf8',
  });

  if (result.error !== undefined) {
    console.error(`engram-bridge: exec error: ${result.error.message}`);
    return 1;
  }
  return result.status ?? 1;
}

// -----------------------------------------------------------------------------
// Main
// -----------------------------------------------------------------------------

function main(): void {
  const flags = parseArgs(process.argv.slice(2));
  VERBOSE = flags.verbose;

  if (flags.subcommand === null) {
    printHelp();
    process.exit(1);
  }

  const engramBin = detectEngram();
  if (engramBin === null) {
    engramAbsentMessage();
    process.exit(0);
  }

  let plan: ExecPlan;
  switch (flags.subcommand) {
    case 'save': plan = planSave(flags, engramBin); break;
    case 'search': plan = planSearch(flags, engramBin); break;
    case 'get': plan = planGet(flags, engramBin); break;
  }

  const exitCode = execPlan(plan, flags.dryRun);
  process.exit(exitCode);
}

main();
