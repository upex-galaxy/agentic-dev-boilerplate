import pc from 'picocolors';

import { CliError } from './errors.ts';
import { headline } from './tui.ts';

export interface Args {
  projectName?: string
  here: boolean
  template: string
  templateRepo: string
  projectKey?: string
  noInstall: boolean
  noSetup: boolean
  noGit: boolean
  nonInteractive: boolean
  help: boolean
  version: boolean
  menu: boolean
  noBanner: boolean
  /** Install into the EXISTING app in the current directory (delegates to the updater's --adopt). */
  adopt: boolean
  /** Print the prerequisite checks and exit. */
  doctor: boolean
  /** With --doctor: also run the --adopt checks against the current directory. */
  preflight: boolean
}

/** The template the scaffolder downloads unless --template-repo says otherwise. */
export const DEFAULT_TEMPLATE_REPO = 'upex-galaxy/agentic-dev-boilerplate';

const DEFAULTS: Args = {
  here: false,
  template: 'main',
  templateRepo: DEFAULT_TEMPLATE_REPO,
  noInstall: false,
  noSetup: false,
  noGit: false,
  nonInteractive: !process.stdin.isTTY,
  help: false,
  version: false,
  menu: false,
  noBanner: false,
  adopt: false,
  doctor: false,
  preflight: false,
};

export function parseArgs(argv: readonly string[]): Args {
  const out: Args = { ...DEFAULTS };
  const positionals: string[] = [];

  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];

    switch (arg) {
      case '--help':
      case '-h':
        out.help = true;
        break;
      case '--version':
      case '-v':
        out.version = true;
        break;
      case '--here':
        out.here = true;
        break;
      case '--no-install':
        out.noInstall = true;
        break;
      case '--no-setup':
        out.noSetup = true;
        break;
      case '--no-git':
        out.noGit = true;
        break;
      case '--non-interactive':
        out.nonInteractive = true;
        break;
      case '--menu':
        out.menu = true;
        break;
      case '--no-banner':
        out.noBanner = true;
        break;
      case '--adopt':
        out.adopt = true;
        break;
      case '--doctor':
        out.doctor = true;
        break;
      case '--preflight':
        out.preflight = true;
        break;
      case '--template':
        out.template = requireValue(argv, ++i, '--template');
        break;
      case '--template-repo':
        out.templateRepo = requireValue(argv, ++i, '--template-repo');
        break;
      case '--project-key':
        out.projectKey = requireValue(argv, ++i, '--project-key');
        break;
      default:
        if (arg.startsWith('--')) {
          throw new CliError('USAGE', `Unknown flag: ${arg}`);
        }
        positionals.push(arg);
    }
  }

  if (positionals.length > 1) {
    throw new CliError('USAGE', `Too many positional arguments: ${positionals.join(' ')}`);
  }
  if (positionals.length === 1) {
    out.projectName = positionals[0];
  }

  if (out.preflight && !out.doctor) {
    throw new CliError('USAGE', '--preflight is a --doctor option.', 'Usage:\n  bunx create-agentic-dev --doctor --preflight');
  }
  if (out.adopt) {
    // --adopt works on the app in the current directory: nothing is created,
    // renamed or initialised, so the greenfield-only inputs make no sense.
    const clash = [
      out.projectName !== undefined ? '<project-name>' : null,
      out.here ? '--here' : null,
      out.projectKey !== undefined ? '--project-key' : null,
      out.noGit ? '--no-git' : null,
      out.noInstall ? '--no-install' : null,
      out.noSetup ? '--no-setup' : null,
      out.doctor ? '--doctor' : null,
    ].filter((f): f is string => f !== null);
    if (clash.length > 0) {
      throw new CliError(
        'USAGE',
        `--adopt does not combine with ${clash.join(', ')}.`,
        'Run it from the root of the existing app: bunx create-agentic-dev --adopt',
      );
    }
    // The updater syncs the template's default branch; a different ref here
    // would install one version of the updater against another of the files.
    if (out.template !== DEFAULTS.template) {
      throw new CliError('USAGE', '--adopt installs from the template\'s main branch; --template is not supported with it.');
    }
  }

  // Only throw in non-interactive mode (piped / CI); in a TTY the menu handles
  // missing project names interactively. `isTTY` is undefined when there is no
  // TTY at all (CI), so use !isTTY to catch both false and undefined.
  if (!out.projectName && !out.here && !out.adopt && !out.doctor && !out.help && !out.version && !process.stdin.isTTY) {
    throw new CliError(
      'USAGE',
      'missing required project name.',
      'Usage:\n  bunx create-agentic-dev <project-name>\n  bunx create-agentic-dev --here          # use current directory',
    );
  }

  return out;
}

function requireValue(argv: readonly string[], idx: number, flag: string): string {
  const v = argv[idx];
  if (!v || v.startsWith('--')) {
    throw new CliError('USAGE', `Flag ${flag} requires a value.`);
  }
  return v;
}

export function printHelp(): void {
  process.stdout.write(`${headline('create-agentic-dev')}\n`);
  process.stdout.write('scaffolder for the Agentic Dev ecosystem\n\n');

  process.stdout.write(pc.bold('Usage:\n'));
  process.stdout.write(`  ${pc.cyan('bunx create-agentic-dev <project-name> [flags]')}\n`);
  process.stdout.write(`  ${pc.cyan('bunx create-agentic-dev --here')}                  # use current directory\n`);
  process.stdout.write(`  ${pc.cyan('bunx create-agentic-dev --adopt')}                 # install into the existing app here\n\n`);

  process.stdout.write(pc.bold('Flags:\n'));
  const flags = [
    ['--here', 'Bootstrap into the current directory, or run setup if already bootstrapped.'],
    ['--template <ref>', 'Branch/tag/SHA of the template (default: main).'],
    ['--template-repo <owner/repo>', 'Override template upstream (default: upex-galaxy/agentic-dev-boilerplate).'],
    ['--project-key <KEY>', 'Jira project key (optional; prompted if omitted).'],
    ['--no-install', 'Skip "bun install".'],
    ['--no-setup', 'Skip "bun run setup".'],
    ['--no-git', 'Skip git init + initial commit.'],
    ['--non-interactive', 'Use safe defaults; no prompts.'],
    ['--menu', 'Force the interactive menu even when args are provided.'],
    ['--no-banner', 'Suppress the logo (useful for CI / piped output).'],
    ['--adopt', 'Install into the EXISTING app in the current directory: never overwrites its files, no git init.'],
    ['--doctor', 'Check prerequisites and exit.'],
    ['--preflight', 'With --doctor: also run the --adopt checks on the current directory.'],
    ['--help, -h', 'Print this help.'],
    ['--version, -v', 'Print CLI version.'],
  ];
  const maxFlag = flags.reduce((m, [f]) => Math.max(m, f.length), 0);
  for (const [flag, desc] of flags) {
    process.stdout.write(`  ${pc.cyan(flag.padEnd(maxFlag))}  ${desc}\n`);
  }

  process.stdout.write(`\n${pc.bold('Examples:\n')}`);
  process.stdout.write(`  ${pc.cyan('bunx create-agentic-dev my-app')}\n`);
  process.stdout.write(`  ${pc.cyan('bunx create-agentic-dev my-app --project-key ACME')}\n`);
  process.stdout.write(`  ${pc.cyan('bunx create-agentic-dev --here')}\n`);
  process.stdout.write(`  ${pc.cyan('bunx create-agentic-dev --doctor --preflight')}\n`);
  process.stdout.write(`  ${pc.cyan('bunx create-agentic-dev --adopt')}\n`);
  process.stdout.write(`  ${pc.cyan('bunx create-agentic-dev fork --template-repo my-fork/agentic-dev-boilerplate')}\n`);
  process.stdout.write('\n');
}
