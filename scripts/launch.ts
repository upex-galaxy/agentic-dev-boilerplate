#!/usr/bin/env bun
/**
 * launch.ts — start an agent harness through varlock, after a precedence check.
 *
 *   bun run claude [args...]     = bun --no-env-file scripts/launch.ts claude [args...]
 *   bun run codex | opencode     same, for the other two harnesses
 *
 * What it does, in order, after one quiet clean-up: when a secret-manager
 * overlay exists (`.env.provider.schema`, ADR-0011), the EMPTY inherited copies
 * of the keys it resolves are dropped, because an empty variable would win over
 * the vault and CI turns every unset secret into one
 * (`withoutEmptyProviderShadows`, cli/lib/secret-providers.ts).
 *
 *   1. PREFLIGHT. `varlock run` lets a variable already in the process
 *      environment WIN over `.env` / `.env.local` (measured on the pinned
 *      1.20.0; no flag inverts it), the opposite of the `dotenv -o` wrappers
 *      it replaced. So a stale value inherited from the parent shell would make
 *      a corrected `.env` a silent no-op for the whole session. Before
 *      launching, `inheritedOverrides` (cli/lib/env-schema.ts) takes varlock's
 *      own `overrideKeys` and compares each one with the env files: an
 *      inherited value that DIFFERS refuses the launch, naming the variables
 *      with masked lengths only. An equal value passes silently.
 *   2. LAUNCH. `varlock run -- <bin> [args...]`: varlock resolves and
 *      validates the schema (`.env.schema` + `.env.core.schema`) against
 *      `.env` / `.env.local`, then starts the harness with the values in its
 *      environment. An interactive terminal gets raw pass-through.
 *
 * `--no-env-file` keeps Bun from autoloading `.env` into THIS process: the
 * preflight must see what the parent shell really exported, and varlock stays
 * the one loader of the env files. Nothing here prints a value.
 *
 * Exit code: the harness's own, or 1 when the preflight refuses, 2 on usage.
 */

import { spawnSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { join } from 'node:path';

import { inheritedOverrides } from '../cli/lib/env-schema.ts';
import { withoutEmptyProviderShadows } from '../cli/lib/secret-providers.ts';

const REPO_ROOT = join(import.meta.dir, '..');

/** The preflight's refusal text, or null when the launch may proceed. Names and lengths only. */
export function preflightRefusal(root: string, env: Record<string, string | undefined>): string | null {
  const report = inheritedOverrides(root, env);
  if (report.findings.length === 0) { return null; }
  const lines = [
    'launch: REFUSED. These variables are exported by the parent shell with a value that differs from .env / .env.local,',
    'and varlock lets the inherited value win, so the session would run on it and ignore your env files:',
    ...report.findings.map(f => `  - ${f.name}: inherited ${f.processLength} chars vs env file ${f.fileLength} chars${f.sensitive ? ' (sensitive)' : ''}`),
    '',
    'Fix, then relaunch:',
    `  unset ${report.findings.map(f => f.name).join(' ')}   # in this shell, if the env file holds the right value`,
    '  # or find who exports it: walk `ps eww -p $PPID` up the chain, check ~/.zshrc and direnv,',
    '  # or launch from a clean shell:  env -i HOME="$HOME" PATH="$PATH" zsh -l',
    'If the inherited value is the right one, put it in .env (or .env.local) instead.',
  ];
  return lines.join('\n');
}

function varlockBin(root: string): string {
  const local = join(root, 'node_modules', '.bin', process.platform === 'win32' ? 'varlock.cmd' : 'varlock');
  return existsSync(local) ? local : 'varlock';
}

function main(argv: string[]): number {
  const [bin, ...rest] = argv;
  if (bin === undefined || bin.startsWith('-')) {
    console.error('usage: bun --no-env-file scripts/launch.ts <claude|codex|opencode> [args...]');
    return 2;
  }

  const { env } = withoutEmptyProviderShadows(REPO_ROOT, process.env);
  const refusal = preflightRefusal(REPO_ROOT, env);
  if (refusal !== null) {
    console.error(refusal);
    return 1;
  }

  const child = spawnSync(varlockBin(REPO_ROOT), ['run', '--', bin, ...rest], {
    cwd: process.cwd(),
    stdio: 'inherit',
    env: env as NodeJS.ProcessEnv,
  });
  if (child.error) {
    console.error(`launch: could not start varlock (${child.error.message}). Run bun install, then retry.`);
    return 1;
  }
  return child.status ?? 1;
}

if (import.meta.main) {
  process.exit(main(process.argv.slice(2)));
}
