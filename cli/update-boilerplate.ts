#!/usr/bin/env bun
/**
 * @fileoverview UPEX Boilerplate Updater — sync a consumer project with the upstream boilerplate.
 *
 * Strategy: "intelligent merge" — copies files from upstream over the consumer's tree
 * without deleting user-owned files. Skills, commands, .agents/, scripts/, cli/, .vscode/,
 * .husky/, docs/, .context/, templates/mcp/, and tooling files are all in scope.
 *
 * v5.0 — TypeScript migration. Renamed from update-template.js → update-boilerplate.ts.
 * v4.1 — legacy `.prompts/fase-*` + `.books/` model retired; content now lives in
 * `.claude/skills/` and `.claude/commands/`. Legacy commands map to `claude` with a warning.
 *
 * Requires: gh CLI (authenticated), bun runtime.
 *
 * @example
 *   bun up                           # interactive menu
 *   bun up all                       # sync everything
 *   bun up claude agents             # subset
 *   bun up all --dry-run             # preview only
 *   bun up --rollback                # restore latest backup
 *   bun up --update-mcp-template claude   # refresh templates/mcp/claude.template.json
 */

import { execSync } from 'node:child_process';
import * as fs from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';
import * as readline from 'node:readline';

// ============================================================================
// CONFIGURATION
// ============================================================================

const CLI_VERSION = '5.0';
const TEMPLATE_REPO = 'upex-galaxy/ai-driven-project-starter';
const TEMP_DIR = path.join(os.tmpdir(), 'aicode-template-update');
const VERSION_FILE = '.template-version.json';

const TOOLING_FILES: string[] = ['.editorconfig', '.prettierrc', '.prettierignore'];
const EXAMPLE_FILES: string[] = [];

// `.agents/` framework universals — always overwritten.
const AGENTS_FRAMEWORK_FILES: string[] = [
  'README.md',
  'jira-required.yaml',
];

// `.agents/` bootstraps — copied only if missing locally; never overwritten.
const AGENTS_BOOTSTRAP_FILES: string[] = [
  'project.yaml',
  'jira.json',
];

const SCRIPTS_FILES: string[] = [
  'agents-lint.ts',
  'agents-setup.ts',
  'check-jira-setup.ts',
  'sync-jira-issues.ts',
  'sync-jira-fields.ts',
  'sync-jira-workflows.ts',
];

// Supported MCP template agents. Keep in sync with `templates/mcp/`.
const MCP_TEMPLATE_AGENTS = ['claude', 'opencode', 'codex', 'gemini'] as const;
type McpAgent = typeof MCP_TEMPLATE_AGENTS[number];

const MCP_TEMPLATE_FILE: Record<McpAgent, string> = {
  claude: 'claude.template.json',
  opencode: 'opencode.template.json',
  codex: 'codex.template.toml',
  gemini: 'gemini.template.json',
};

interface DeprecatedFile {
  path: string
  component: string
  reason: string
  deprecatedSince: string
}

const DEPRECATED_FILES: DeprecatedFile[] = [
  {
    path: '.prompts/setup/kata-framework-setup.md',
    component: 'prompts',
    reason: 'renamed to monorepo-for-qa-setup.md',
    deprecatedSince: '2026-04-28',
  },
  {
    path: '.prompts/setup/kata-architecture-adaptation.md',
    component: 'prompts',
    reason: 'renamed to test-framework-adaptation.md',
    deprecatedSince: '2026-04-28',
  },
];

interface MergeResult {
  success: number
  errors: number
}

interface ParsedArgs {
  commands: string[]
  help: boolean
  dryRun: boolean
  rollback: boolean
  updateMcpTemplate: McpAgent | null
}

interface SyncVersion {
  lastSync: string
  templateCommit: string
  cliVersion: string
  syncedComponents: string[]
  variableSystemVersion: boolean
}

// ============================================================================
// TERMINAL COLORS
// ============================================================================

const colors = {
  green: '\x1B[32m',
  yellow: '\x1B[33m',
  red: '\x1B[31m',
  blue: '\x1B[34m',
  cyan: '\x1B[36m',
  magenta: '\x1B[35m',
  bold: '\x1B[1m',
  dim: '\x1B[2m',
  reset: '\x1B[0m',
} as const;

function logHeader(message: string): void {
  console.log(`\n${colors.bold}${colors.cyan}${message}${colors.reset}`);
}

function logSuccess(message: string): void {
  console.log(`${colors.green}✅ ${message}${colors.reset}`);
}

function logWarning(message: string): void {
  console.log(`${colors.yellow}⚠️  ${message}${colors.reset}`);
}

function logError(message: string): void {
  console.log(`${colors.red}❌ ${message}${colors.reset}`);
}

function logInfo(message: string): void {
  console.log(`${colors.blue}ℹ️  ${message}${colors.reset}`);
}

function logStep(message: string): void {
  console.log(`${colors.yellow}📦 ${message}${colors.reset}`);
}

function logMerge(message: string): void {
  console.log(`${colors.magenta}🔀 ${message}${colors.reset}`);
}

function errorMessage(err: unknown): string {
  if (err instanceof Error) { return err.message; }
  return String(err);
}

// ============================================================================
// DEPENDENCY CHECK
// ============================================================================

function isPackageInstalled(packageName: string): boolean {
  const nodeModulesPath = path.join(process.cwd(), 'node_modules', packageName);
  if (fs.existsSync(nodeModulesPath)) {
    return true;
  }

  if (packageName.startsWith('@')) {
    const [scope, name] = packageName.split('/');
    const scopedPath = path.join(process.cwd(), 'node_modules', scope, name);
    if (fs.existsSync(scopedPath)) {
      return true;
    }
  }

  return false;
}

async function nativePrompt(question: string): Promise<string> {
  return new Promise((resolve) => {
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    });

    rl.question(question, (answer) => {
      rl.close();
      resolve(answer.trim().toLowerCase());
    });
  });
}

async function ensureDependencies(): Promise<boolean> {
  if (isPackageInstalled('@inquirer/prompts')) {
    return true;
  }

  console.log(`
${colors.yellow}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${colors.reset}
${colors.bold}${colors.yellow}⚠️  Dependencia faltante: @inquirer/prompts${colors.reset}
${colors.yellow}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${colors.reset}

Esta dependencia es necesaria para el ${colors.cyan}menú interactivo${colors.reset} del script.

${colors.dim}Sin ella, solo puedes usar comandos directos como:${colors.reset}
  ${colors.green}bun up all${colors.reset}              - Actualizar todo
  ${colors.green}bun up docs${colors.reset}             - Actualizar docs/
  ${colors.green}bun up claude agents${colors.reset}    - Skills/commands + agents config

${colors.bold}¿Deseas instalar la dependencia ahora?${colors.reset}
`);

  const answer = await nativePrompt(`${colors.cyan}[Y/n]:${colors.reset} `);

  if (answer === '' || answer === 'y' || answer === 'yes' || answer === 'si' || answer === 's') {
    console.log(`\n${colors.blue}📦 Instalando @inquirer/prompts...${colors.reset}\n`);

    try {
      execSync('bun add @inquirer/prompts', { stdio: 'inherit' });
      console.log(`
${colors.green}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${colors.reset}
${colors.bold}${colors.green}✅ Dependencia instalada correctamente${colors.reset}
${colors.green}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${colors.reset}

Ahora puedes ejecutar el script nuevamente:

  ${colors.cyan}bun up${colors.reset}          - Menú interactivo
  ${colors.cyan}bun up all${colors.reset}      - Actualizar todo
  ${colors.cyan}bun up help${colors.reset}     - Ver opciones

`);
      process.exit(0);
    }
    catch (err) {
      logError(`Error instalando dependencia: ${errorMessage(err)}`);
      console.log(`\n${colors.yellow}Intenta instalar manualmente:${colors.reset}`);
      console.log(`  ${colors.green}bun add @inquirer/prompts${colors.reset}\n`);
      process.exit(1);
    }
  }
  else {
    console.log(`\n${colors.yellow}Instalación cancelada.${colors.reset}`);
    console.log('\nPuedes usar comandos directos sin el menú interactivo:');
    console.log(`  ${colors.green}bun up all${colors.reset}      - Actualizar todo`);
    console.log(`  ${colors.green}bun up help${colors.reset}     - Ver todas las opciones\n`);
    process.exit(0);
  }
}

// ============================================================================
// MERGE UTILITIES
// ============================================================================

function mergeDirectory(srcDir: string, destDir: string, prefix = ''): MergeResult {
  let success = 0;
  let errors = 0;

  fs.mkdirSync(destDir, { recursive: true });

  const items = fs.readdirSync(srcDir, { withFileTypes: true });

  for (const item of items) {
    const srcPath = path.join(srcDir, item.name);
    const destPath = path.join(destDir, item.name);

    try {
      if (item.isDirectory()) {
        const sub = mergeDirectory(srcPath, destPath, `${prefix}  `);
        success += sub.success;
        errors += sub.errors;
        logSuccess(`${prefix}${item.name}/`);
      }
      else {
        fs.cpSync(srcPath, destPath);
        success++;
        logSuccess(`${prefix}${item.name}`);
      }
    }
    catch (err) {
      logWarning(`${prefix}Skipped ${item.name}: ${errorMessage(err)}`);
      errors++;
    }
  }

  return { success, errors };
}

function countFilesInDir(dir: string): number {
  if (!fs.existsSync(dir)) { return 0; }
  let count = 0;
  const items = fs.readdirSync(dir, { withFileTypes: true });
  for (const item of items) {
    if (item.isDirectory()) {
      count += countFilesInDir(path.join(dir, item.name));
    }
    else {
      count++;
    }
  }
  return count;
}

function collectFiles(dir: string): string[] {
  const files: string[] = [];
  if (!fs.existsSync(dir)) { return files; }

  const items = fs.readdirSync(dir, { withFileTypes: true });
  for (const item of items) {
    const fullPath = path.join(dir, item.name);
    if (item.isDirectory()) {
      files.push(...collectFiles(fullPath));
    }
    else {
      files.push(fullPath);
    }
  }
  return files;
}

// ============================================================================
// HELP
// ============================================================================

function showHelp(): void {
  console.log(`
${colors.bold}${colors.cyan}📦 UPEX Boilerplate Updater v${CLI_VERSION} - Ayuda${colors.reset}

${colors.bold}USO:${colors.reset}
  bun up                        ${colors.dim}# Menu interactivo${colors.reset}
  bun up <comando> [opciones]   ${colors.dim}# Ejecucion directa${colors.reset}

Sincroniza skills, commands, scripts, .agents/, y archivos de configuracion
desde el boilerplate upstream. Las skills (.claude/skills/) y commands
(.claude/commands/) reemplazan al modelo legacy de .prompts/fase-*.

${colors.bold}COMANDOS:${colors.reset}
  all           Actualiza todo (merge completo de todos los directorios)
  docs          Actualiza docs/ (merge completo del directorio)
  context       Actualiza .context/ (merge completo del directorio)
  templates     Actualiza templates/mcp/ (merge completo del directorio)
  scripts       Actualiza scripts/ (solo framework: agents + jira)
  cli           Actualiza cli/ (Xray CLI y otras herramientas)
  agents        Actualiza .agents/ (framework + bootstrap protegido)
  claude        Actualiza .claude/ (settings.json + skills/ + commands/)
  vscode        Actualiza .vscode/ (extensions.json, settings.json)
  husky         Actualiza .husky/ (git hooks)
  tooling       Actualiza archivos de configuracion del framework
  examples      Actualiza archivos de ejemplo
  rollback      Restaura desde el backup mas reciente
  help          Muestra esta ayuda

${colors.bold}FLAGS GLOBALES:${colors.reset}
  --dry-run                       Preview de cambios sin modificar archivos
  --rollback                      Restaura desde el backup mas reciente
  --update-mcp-template <agent>   Refresca templates/mcp/<agent>.template.* desde upstream
                                  (agents soportados: ${MCP_TEMPLATE_AGENTS.join(', ')})
  --help, -h                      Muestra esta ayuda

${colors.bold}MERGE INTELIGENTE:${colors.reset}
  Este script sincroniza TODOS los archivos del template:
  - Actualiza/agrega cualquier archivo que exista en el template
  - Preserva archivos/carpetas creados por el usuario (no en template)
  - No elimina nada que no exista en el template
  - Sin listas hardcodeadas: nuevos archivos del template se incluyen automaticamente

${colors.bold}EJEMPLOS:${colors.reset}
  bun up                                    ${colors.dim}# Menu interactivo${colors.reset}
  bun up all                                ${colors.dim}# Actualiza todo${colors.reset}
  bun up claude agents                      ${colors.dim}# Skills/commands + agents config${colors.reset}
  bun up docs context                       ${colors.dim}# Multiples componentes${colors.reset}
  bun up vscode husky                       ${colors.dim}# Config de VS Code y git hooks${colors.reset}
  bun up tooling examples                   ${colors.dim}# Archivos de configuracion${colors.reset}
  bun up all --dry-run                      ${colors.dim}# Preview sin modificar${colors.reset}
  bun up --rollback                         ${colors.dim}# Restaurar ultimo backup${colors.reset}
  bun up --update-mcp-template claude       ${colors.dim}# Refrescar el template MCP de Claude${colors.reset}
`);
}

// ============================================================================
// INTERACTIVE MENUS
// ============================================================================

async function showMainMenu(): Promise<string[]> {
  const { checkbox } = await import('@inquirer/prompts');

  return checkbox({
    message: 'Que deseas actualizar? (flechas, ESPACIO selecciona, ENTER confirma)',
    choices: [
      { name: 'Todo (all)', value: 'all' },
      { name: 'Claude (.claude/) - Skills, commands y settings', value: 'claude' },
      { name: 'Agents (.agents/) - Framework + bootstrap protegido', value: 'agents' },
      { name: 'Scripts (scripts/) - Solo framework (agents + jira)', value: 'scripts' },
      { name: 'CLI Tools (cli/) - Xray CLI y otras herramientas', value: 'cli' },
      { name: 'Documentacion (docs/)', value: 'docs' },
      { name: 'Context (.context/)', value: 'context' },
      { name: 'Templates MCP (templates/mcp/)', value: 'templates' },
      { name: 'VS Code (.vscode/)', value: 'vscode' },
      { name: 'Husky (.husky/) - Git hooks', value: 'husky' },
      { name: 'Tooling - Archivos de configuracion', value: 'tooling' },
      { name: 'Examples - Archivos de ejemplo', value: 'examples' },
    ],
  });
}

// ============================================================================
// ARGUMENT PARSING
// ============================================================================

function isMcpAgent(value: string): value is McpAgent {
  return (MCP_TEMPLATE_AGENTS as readonly string[]).includes(value);
}

function parseArgs(args: string[]): ParsedArgs {
  const result: ParsedArgs = {
    commands: [],
    help: false,
    dryRun: false,
    rollback: false,
    updateMcpTemplate: null,
  };

  const validCommands = [
    'all',
    'docs',
    'context',
    'guidelines',
    'templates',
    'scripts',
    'cli',
    'agents',
    'claude',
    'vscode',
    'husky',
    'tooling',
    'examples',
    'help',
    'rollback',
  ];
  const legacyAliases: Record<string, string> = {
    prompts: 'claude',
    books: 'claude',
    guidelines: 'context',
  };

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];

    if (arg === 'help' || arg === '--help' || arg === '-h') {
      result.help = true;
    }
    else if (arg === '--dry-run') {
      result.dryRun = true;
    }
    else if (arg === '--rollback' || arg === 'rollback') {
      result.rollback = true;
    }
    else if (arg === '--update-mcp-template') {
      const next = args[i + 1];
      if (!next || next.startsWith('-')) {
        logError(`--update-mcp-template requiere un agente: ${MCP_TEMPLATE_AGENTS.join(', ')}`);
        process.exit(1);
      }
      if (!isMcpAgent(next)) {
        logError(`Agente desconocido: ${next}. Soportados: ${MCP_TEMPLATE_AGENTS.join(', ')}`);
        process.exit(1);
      }
      result.updateMcpTemplate = next;
      i++;
    }
    else if (arg === '--all' || arg === '--standalone' || arg === '--fase'
      || arg === '--phase' || arg === '--rol' || arg === '--role') {
      if (arg === '--fase' || arg === '--phase' || arg === '--rol' || arg === '--role') {
        i++;
      }
      logWarning(`Flag legacy ignorada: ${arg} (el modelo .prompts/fase-* fue retirado en v4.1)`);
    }
    else if (legacyAliases[arg]) {
      const mapped = legacyAliases[arg];
      logWarning(`Comando legacy '${arg}' mapeado a '${mapped}' (skills + commands reemplazan a .prompts/.books)`);
      result.commands.push(mapped);
    }
    else if (validCommands.includes(arg)) {
      result.commands.push(arg);
    }
    else if (!arg.startsWith('-')) {
      logWarning(`Comando desconocido: ${arg}`);
    }
  }

  return result;
}

// ============================================================================
// PREREQUISITES
// ============================================================================

function checkCommand(command: string, name: string): boolean {
  try {
    execSync(`${command} --version`, { stdio: 'ignore' });
    return true;
  }
  catch {
    logError(`${name} no esta instalado`);
    return false;
  }
}

async function validatePrerequisites(): Promise<void> {
  if (!checkCommand('gh', 'GitHub CLI (gh)')) {
    console.log('\nInstalalo con:');
    if (process.platform === 'darwin') {
      console.log('  brew install gh');
    }
    else if (process.platform === 'win32') {
      console.log('  winget install GitHub.cli');
    }
    else {
      console.log('  sudo apt install gh  # Ubuntu/Debian');
      console.log('  O visita: https://cli.github.com/');
    }
    process.exit(1);
  }

  try {
    execSync('gh auth status', { stdio: 'ignore' });
  }
  catch {
    logWarning('No estas autenticado en GitHub CLI');
    console.log('Ejecuta: gh auth login');
    process.exit(1);
  }
}

// ============================================================================
// BACKUP
// ============================================================================

function createBackup(components: string[]): string {
  logStep('Creando backup...');

  const dateSegment = new Date().toISOString().replace(/[:.]/g, '-').split('T')[0];
  const timeSegment = new Date().toTimeString().split(' ')[0].replace(/:/g, '');
  const backupDir = path.join('.backups', `update-${dateSegment}-${timeSegment}`);

  fs.mkdirSync(backupDir, { recursive: true });

  const backupMap: Record<string, { src: string, dest: string }> = {
    docs: { src: 'docs', dest: 'docs' },
    context: { src: '.context', dest: '.context' },
    templates: { src: 'templates/mcp', dest: 'templates/mcp' },
    scripts: { src: 'scripts', dest: 'scripts' },
    cli: { src: 'cli', dest: 'cli' },
    agents: { src: '.agents', dest: '.agents' },
    claude: { src: '.claude', dest: '.claude' },
    vscode: { src: '.vscode', dest: '.vscode' },
    husky: { src: '.husky', dest: '.husky' },
  };

  for (const comp of components) {
    const mapping = backupMap[comp];
    if (mapping && fs.existsSync(mapping.src)) {
      const destPath = path.join(backupDir, mapping.dest);
      fs.mkdirSync(path.dirname(destPath), { recursive: true });
      fs.cpSync(mapping.src, destPath, { recursive: true });
    }
  }

  if (components.includes('tooling')) {
    for (const file of TOOLING_FILES) {
      if (fs.existsSync(file)) {
        fs.cpSync(file, path.join(backupDir, file));
      }
    }
  }

  if (components.includes('examples')) {
    for (const file of EXAMPLE_FILES) {
      if (fs.existsSync(file)) {
        fs.cpSync(file, path.join(backupDir, file));
      }
    }
  }

  if (fs.existsSync('context-engineering.md')) {
    fs.cpSync('context-engineering.md', path.join(backupDir, 'context-engineering.md'));
  }

  logSuccess(`Backup guardado en: ${backupDir}`);
  return backupDir;
}

function cleanupDeprecatedFiles(components: string[]): { removed: number } {
  const allMode = components.includes('all');
  const relevant = DEPRECATED_FILES.filter(d => allMode || components.includes(d.component));
  const present = relevant.filter(d => fs.existsSync(d.path));

  if (present.length === 0) {
    return { removed: 0 };
  }

  console.log('');
  logStep(`Limpiando ${present.length} archivo(s) deprecated...`);

  let removed = 0;
  for (const dep of present) {
    try {
      fs.unlinkSync(dep.path);
      logSuccess(`  Eliminado: ${dep.path}`);
      logInfo(`             Razon: ${dep.reason} (deprecated desde ${dep.deprecatedSince})`);
      removed++;
    }
    catch (err) {
      logWarning(`  No se pudo eliminar ${dep.path}: ${errorMessage(err)}`);
    }
  }

  return { removed };
}

function previewDeprecatedCleanup(commands: string[]): void {
  const allMode = commands.includes('all');
  const relevant = DEPRECATED_FILES.filter(d => allMode || commands.includes(d.component));
  const present = relevant.filter(d => fs.existsSync(d.path));

  if (present.length === 0) {
    return;
  }

  console.log('');
  console.log(`   ${colors.yellow}Deprecated cleanup${colors.reset}  →  Eliminaria ${present.length} archivo(s):`);
  for (const dep of present) {
    console.log(`     ${colors.dim}- ${dep.path}${colors.reset}  ${colors.dim}(${dep.reason})${colors.reset}`);
  }
}

function rollbackFromBackup(): void {
  logHeader('🔄 Rollback desde Backup');

  const backupsDir = '.backups';
  if (!fs.existsSync(backupsDir)) {
    logError('No se encontraron backups. El directorio .backups/ no existe.');
    process.exit(1);
  }

  const backups = fs.readdirSync(backupsDir, { withFileTypes: true })
    .filter(d => d.isDirectory() && d.name.startsWith('update-'))
    .map(d => d.name)
    .sort()
    .reverse();

  if (backups.length === 0) {
    logError('No se encontraron backups en .backups/');
    process.exit(1);
  }

  const latest = backups[0];
  const backupPath = path.join(backupsDir, latest);

  logInfo(`Se encontraron ${backups.length} backup${backups.length > 1 ? 's' : ''}:`);
  for (const b of backups.slice(0, 5)) {
    const marker = b === latest ? `${colors.green}  (mas reciente)${colors.reset}` : '';
    console.log(`   ${colors.dim}${b}${colors.reset}${marker}`);
  }
  if (backups.length > 5) {
    console.log(`   ${colors.dim}... y ${backups.length - 5} mas${colors.reset}`);
  }

  console.log('');
  logStep(`Restaurando desde: ${latest}`);

  let restored = 0;
  const restoreDir = (srcDir: string, destDir: string): void => {
    const items = fs.readdirSync(srcDir, { withFileTypes: true });
    for (const item of items) {
      const srcPath = path.join(srcDir, item.name);
      const destPath = path.join(destDir, item.name);
      if (item.isDirectory()) {
        fs.mkdirSync(destPath, { recursive: true });
        restoreDir(srcPath, destPath);
      }
      else {
        fs.cpSync(srcPath, destPath);
        restored++;
      }
    }
  };

  try {
    restoreDir(backupPath, process.cwd());
    logSuccess(`Restaurados ${restored} archivos desde ${latest}`);
  }
  catch (err) {
    logError(`Rollback fallido: ${errorMessage(err)}`);
    process.exit(1);
  }
}

function executeDryRun(commands: string[], allMode: boolean): void {
  logHeader('🔍 DRY RUN — No se modificaran archivos');
  console.log('');

  const components: { name: string, dir: string }[] = [];

  if (commands.includes('claude') || allMode) {
    components.push({ name: 'Claude (.claude/)', dir: path.join(TEMP_DIR, '.claude') });
  }
  if (commands.includes('context') || allMode) {
    components.push({ name: 'Context (.context/)', dir: path.join(TEMP_DIR, '.context') });
  }
  if (commands.includes('docs') || allMode) {
    components.push({ name: 'Documentation (docs/)', dir: path.join(TEMP_DIR, 'docs') });
  }
  if (commands.includes('templates') || allMode) {
    components.push({ name: 'Templates MCP (templates/mcp/)', dir: path.join(TEMP_DIR, 'templates', 'mcp') });
  }
  if (commands.includes('scripts') || allMode) {
    const scriptsCount = SCRIPTS_FILES.filter(f => fs.existsSync(path.join(TEMP_DIR, 'scripts', f))).length;
    console.log(`   ${colors.cyan}Scripts (scripts/)${colors.reset}  →  Sincronizaria ${scriptsCount} archivo${scriptsCount !== 1 ? 's' : ''} de framework`);
  }
  if (commands.includes('cli') || allMode) {
    components.push({ name: 'CLI Tools (cli/)', dir: path.join(TEMP_DIR, 'cli') });
  }
  if (commands.includes('agents') || allMode) {
    const frameworkCount = AGENTS_FRAMEWORK_FILES.filter(f => fs.existsSync(path.join(TEMP_DIR, '.agents', f))).length;
    const bootstrapCount = AGENTS_BOOTSTRAP_FILES.filter(f =>
      fs.existsSync(path.join(TEMP_DIR, '.agents', f)) && !fs.existsSync(path.join('.agents', f)),
    ).length;
    const total = frameworkCount + bootstrapCount;
    console.log(`   ${colors.cyan}Agents (.agents/)${colors.reset}  →  Sincronizaria ${total} archivo${total !== 1 ? 's' : ''} (${frameworkCount} framework + ${bootstrapCount} bootstrap)`);
  }
  if (commands.includes('vscode') || allMode) {
    components.push({ name: 'VS Code (.vscode/)', dir: path.join(TEMP_DIR, '.vscode') });
  }
  if (commands.includes('husky') || allMode) {
    components.push({ name: 'Git Hooks (.husky/)', dir: path.join(TEMP_DIR, '.husky') });
  }
  if (commands.includes('tooling') || allMode) {
    const toolingCount = TOOLING_FILES.filter(f => fs.existsSync(path.join(TEMP_DIR, f))).length;
    console.log(`   ${colors.cyan}Tooling${colors.reset}  →  Sincronizaria ${toolingCount} archivo${toolingCount !== 1 ? 's' : ''} de config`);
  }
  if (commands.includes('examples') || allMode) {
    const examplesCount = EXAMPLE_FILES.filter(f => fs.existsSync(path.join(TEMP_DIR, f))).length;
    console.log(`   ${colors.cyan}Examples${colors.reset}  →  Sincronizaria ${examplesCount} archivo${examplesCount !== 1 ? 's' : ''} de ejemplo`);
  }

  let totalFiles = 0;
  for (const comp of components) {
    const count = countFilesInDir(comp.dir);
    totalFiles += count;
    if (count > 0) {
      console.log(`   ${colors.cyan}${comp.name}${colors.reset}  →  Sincronizaria ${count} archivo${count !== 1 ? 's' : ''}`);
    }
    else {
      console.log(`   ${colors.dim}${comp.name}  →  No encontrado en template${colors.reset}`);
    }
  }

  console.log('');
  logInfo(`Total: ${totalFiles} archivos se sincronizarian`);
  logInfo('Ejecuta sin --dry-run para aplicar los cambios.');
}

// ============================================================================
// CLONE TEMPLATE
// ============================================================================

async function cloneTemplate(): Promise<void> {
  logStep('Descargando ultima version del template...');
  console.log(`${colors.dim}  Repo: ${TEMPLATE_REPO}${colors.reset}`);
  console.log(`${colors.dim}  Destino temporal: ${TEMP_DIR}${colors.reset}`);

  if (fs.existsSync(TEMP_DIR)) {
    console.log(`${colors.dim}  Limpiando directorio temporal anterior...${colors.reset}`);
    fs.rmSync(TEMP_DIR, { recursive: true, force: true });
  }

  console.log(`${colors.dim}  Verificando autenticacion de GitHub CLI...${colors.reset}`);
  try {
    execSync('gh auth status', { stdio: 'pipe' });
    console.log(`${colors.green}  ✓ GitHub CLI autenticado${colors.reset}`);
  }
  catch {
    logError('GitHub CLI no esta autenticado');
    console.log(`\n${colors.yellow}Ejecuta primero:${colors.reset}`);
    console.log(`  ${colors.cyan}gh auth login${colors.reset}\n`);
    process.exit(1);
  }

  console.log(
    `${colors.dim}  Clonando repositorio (esto puede tomar unos segundos)...${colors.reset}`,
  );

  try {
    const cloneCommand = `gh repo clone ${TEMPLATE_REPO} "${TEMP_DIR}" -- --depth 1 --quiet`;
    execSync(cloneCommand, {
      stdio: ['pipe', 'pipe', 'pipe'],
      timeout: 60000,
    });
    console.log(`${colors.green}  ✓ Template descargado correctamente${colors.reset}`);
  }
  catch (err) {
    const killed = typeof err === 'object' && err !== null && 'killed' in err
      ? Boolean((err as { killed?: unknown }).killed)
      : false;
    if (killed) {
      logError('Timeout: La descarga tardo demasiado (>60s)');
      console.log(`${colors.yellow}Posibles causas:${colors.reset}`);
      console.log('  • Conexion a internet lenta');
      console.log('  • Problemas con GitHub');
      console.log(`\n${colors.yellow}Intenta ejecutar manualmente:${colors.reset}`);
      console.log(`  ${colors.cyan}gh repo clone ${TEMPLATE_REPO}${colors.reset}\n`);
    }
    else {
      logError('Error al descargar el template');
      console.log(`${colors.yellow}Posibles causas:${colors.reset}`);
      console.log('  • No tienes acceso al repositorio privado de UPEX Galaxy');
      console.log('  • Problemas de conexion a internet');
      console.log('  • GitHub CLI no configurado correctamente');
      console.log(`\n${colors.yellow}Verifica tu acceso:${colors.reset}`);
      console.log(`  ${colors.cyan}gh repo view ${TEMPLATE_REPO}${colors.reset}\n`);
    }
    process.exit(1);
  }
}

// ============================================================================
// UPDATE FUNCTIONS
// ============================================================================

function updateDocs(): MergeResult {
  logStep('Actualizando docs/ (merge)...');

  const docsPath = path.join(TEMP_DIR, 'docs');
  if (!fs.existsSync(docsPath)) {
    logWarning('No se encontro directorio docs en el template');
    return { success: 0, errors: 0 };
  }

  logMerge('Sincronizando directorio completo...');
  return mergeDirectory(docsPath, 'docs');
}

function updateContext(): MergeResult {
  logStep('Actualizando .context/ (merge)...');

  const contextPath = path.join(TEMP_DIR, '.context');
  if (!fs.existsSync(contextPath)) {
    logWarning('No se encontro directorio .context en el template');
    return { success: 0, errors: 0 };
  }

  logMerge('Sincronizando directorio completo...');
  return mergeDirectory(contextPath, '.context');
}

function updateTemplates(): MergeResult {
  logStep('Actualizando templates/mcp/ (merge)...');

  const templatesPath = path.join(TEMP_DIR, 'templates', 'mcp');
  if (!fs.existsSync(templatesPath)) {
    logWarning('No se encontro directorio templates/mcp en el template');
    return { success: 0, errors: 0 };
  }

  return mergeDirectory(templatesPath, 'templates/mcp');
}

function updateScripts(): MergeResult {
  logStep('Actualizando scripts/ (framework scripts only)...');

  let success = 0;
  let errors = 0;

  fs.mkdirSync('scripts', { recursive: true });

  logMerge('Sincronizando framework scripts:');
  for (const file of SCRIPTS_FILES) {
    const srcPath = path.join(TEMP_DIR, 'scripts', file);
    const destPath = path.join('scripts', file);
    try {
      if (fs.existsSync(srcPath)) {
        fs.cpSync(srcPath, destPath);
        logSuccess(`  ${file}`);
        success++;
      }
      else {
        logWarning(`scripts/${file} no encontrado en template`);
      }
    }
    catch (err) {
      logWarning(`Skipped scripts/${file}: ${errorMessage(err)}`);
      errors++;
    }
  }

  return { success, errors };
}

function updateCli(): MergeResult {
  logStep('Actualizando cli/ (merge)...');

  const cliPath = path.join(TEMP_DIR, 'cli');
  if (!fs.existsSync(cliPath)) {
    logWarning('No se encontro directorio cli en el template');
    return { success: 0, errors: 0 };
  }

  logMerge('Sincronizando directorio completo...');
  return mergeDirectory(cliPath, 'cli');
}

function updateVscode(): MergeResult {
  logStep('Actualizando .vscode/ (merge)...');

  const vscodePath = path.join(TEMP_DIR, '.vscode');
  if (!fs.existsSync(vscodePath)) {
    logWarning('No se encontro directorio .vscode en el template');
    return { success: 0, errors: 0 };
  }

  logMerge('Sincronizando directorio completo...');
  return mergeDirectory(vscodePath, '.vscode');
}

function updateHusky(): MergeResult {
  logStep('Actualizando .husky/ (merge)...');

  const huskyPath = path.join(TEMP_DIR, '.husky');
  if (!fs.existsSync(huskyPath)) {
    logWarning('No se encontro directorio .husky en el template');
    return { success: 0, errors: 0 };
  }

  logMerge('Sincronizando directorio completo...');
  return mergeDirectory(huskyPath, '.husky');
}

function updateTooling(): MergeResult {
  logStep('Actualizando archivos de tooling...');

  let success = 0;
  let errors = 0;

  for (const file of TOOLING_FILES) {
    const srcPath = path.join(TEMP_DIR, file);
    try {
      if (fs.existsSync(srcPath)) {
        fs.cpSync(srcPath, file);
        logSuccess(file);
        success++;
      }
      else {
        logWarning(`${file} no encontrado en template`);
      }
    }
    catch (err) {
      logWarning(`Skipped ${file}: ${errorMessage(err)}`);
      errors++;
    }
  }

  return { success, errors };
}

function updateExamples(): MergeResult {
  logStep('Actualizando archivos de ejemplo...');

  let success = 0;
  let errors = 0;

  for (const file of EXAMPLE_FILES) {
    const srcPath = path.join(TEMP_DIR, file);
    try {
      if (fs.existsSync(srcPath)) {
        fs.cpSync(srcPath, file);
        logSuccess(file);
        success++;
      }
      else {
        logWarning(`${file} no encontrado en template`);
      }
    }
    catch (err) {
      logWarning(`Skipped ${file}: ${errorMessage(err)}`);
      errors++;
    }
  }

  return { success, errors };
}

function extractVersion(content: string): string | null {
  const match = content.match(/const\s+CLI_VERSION\s*=\s*['"]([^'"]+)['"]/);
  return match ? match[1] : null;
}

/**
 * Auto-update this script from upstream before running other operations.
 *
 * Why: prefer the upstream `update-boilerplate.ts` first; fall back to the
 * legacy `update-template.js` filename so older consumers still get refreshed
 * in place during the transition.
 */
function selfUpdate(): boolean {
  const upstreamCandidates = [
    path.join(TEMP_DIR, 'cli', 'update-boilerplate.ts'),
    path.join(TEMP_DIR, 'cli', 'update-template.js'),
  ];

  const templateScriptPath = upstreamCandidates.find(p => fs.existsSync(p));
  if (!templateScriptPath) {
    return false;
  }

  const upstreamIsTs = templateScriptPath.endsWith('.ts');
  const localScriptPath = upstreamIsTs
    ? path.join(process.cwd(), 'cli', 'update-boilerplate.ts')
    : path.join(process.cwd(), 'cli', 'update-template.js');

  const currentContent = fs.existsSync(localScriptPath)
    ? fs.readFileSync(localScriptPath, 'utf-8')
    : '';
  const templateContent = fs.readFileSync(templateScriptPath, 'utf-8');

  if (currentContent !== templateContent) {
    const currentVer = extractVersion(currentContent) || 'unknown';
    const templateVer = extractVersion(templateContent) || 'unknown';

    const currentMajor = currentVer.split('.')[0];
    const templateMajor = templateVer.split('.')[0];

    if (currentMajor !== templateMajor && currentMajor !== 'unknown') {
      logWarning(`Cambio de version mayor detectado: v${currentVer} → v${templateVer}`);
      logInfo('Revisa el changelog por posibles cambios incompatibles despues de esta actualizacion.');
    }

    const baseName = path.basename(localScriptPath);
    logStep(`Auto-actualizando ${baseName} (v${currentVer} → v${templateVer})...`);
    fs.mkdirSync('cli', { recursive: true });
    fs.cpSync(templateScriptPath, localScriptPath);
    logSuccess(`${baseName} actualizado a v${templateVer}`);
    return true;
  }

  return false;
}

function updateAgents(): MergeResult {
  logStep('Actualizando .agents/ (framework files + bootstrap)...');

  let success = 0;
  let errors = 0;

  fs.mkdirSync('.agents', { recursive: true });

  logMerge('Framework files (overwrite):');
  for (const file of AGENTS_FRAMEWORK_FILES) {
    const srcPath = path.join(TEMP_DIR, '.agents', file);
    const destPath = path.join('.agents', file);
    try {
      if (fs.existsSync(srcPath)) {
        fs.cpSync(srcPath, destPath);
        logSuccess(`  ${file}`);
        success++;
      }
      else {
        logWarning(`.agents/${file} no encontrado en template`);
      }
    }
    catch (err) {
      logWarning(`Skipped .agents/${file}: ${errorMessage(err)}`);
      errors++;
    }
  }

  logMerge('Bootstrap files (only if missing):');
  for (const file of AGENTS_BOOTSTRAP_FILES) {
    const srcPath = path.join(TEMP_DIR, '.agents', file);
    const destPath = path.join('.agents', file);
    try {
      if (fs.existsSync(destPath)) {
        console.log(`${colors.dim}  ${file} (preservado — tu version)${colors.reset}`);
        continue;
      }

      if (fs.existsSync(srcPath)) {
        fs.cpSync(srcPath, destPath);
        logSuccess(`  ${file} (bootstrapped)`);
        success++;
      }
      else if (file === 'jira.json') {
        fs.writeFileSync(destPath, '{}\n');
        logSuccess(`  ${file} (bootstrapped: {})`);
        success++;
      }
      else {
        logWarning(`.agents/${file} no encontrado en template`);
      }
    }
    catch (err) {
      logWarning(`Skipped .agents/${file}: ${errorMessage(err)}`);
      errors++;
    }
  }

  return { success, errors };
}

function updateClaude(): MergeResult {
  logStep('Actualizando .claude/ (skills + commands + settings)...');

  let success = 0;
  let errors = 0;

  const settingsPath = path.join(TEMP_DIR, '.claude', 'settings.json');
  if (fs.existsSync(settingsPath)) {
    try {
      fs.mkdirSync('.claude', { recursive: true });
      fs.cpSync(settingsPath, '.claude/settings.json');
      logSuccess('settings.json');
      success++;
    }
    catch (err) {
      logWarning(`Skipped settings.json: ${errorMessage(err)}`);
      errors++;
    }
  }

  const upstreamSkillsDir = path.join(TEMP_DIR, '.claude', 'skills');
  if (fs.existsSync(upstreamSkillsDir)) {
    logMerge('skills/ (from upstream):');
    const result = mergeDirectory(upstreamSkillsDir, path.join('.claude', 'skills'), '  ');
    success += result.success;
    errors += result.errors;
  }

  const upstreamCommandsDir = path.join(TEMP_DIR, '.claude', 'commands');
  if (fs.existsSync(upstreamCommandsDir)) {
    logMerge('commands/ (from upstream):');
    const result = mergeDirectory(upstreamCommandsDir, path.join('.claude', 'commands'), '  ');
    success += result.success;
    errors += result.errors;
  }

  logInfo('settings.local.json preservado (nunca se sincroniza)');
  return { success, errors };
}

function updateContextEngineering(): MergeResult {
  const templateReadmePath = path.join(TEMP_DIR, 'README.md');
  if (fs.existsSync(templateReadmePath)) {
    logStep('Actualizando context-engineering.md...');
    try {
      fs.cpSync(templateReadmePath, 'context-engineering.md');
      logSuccess('context-engineering.md actualizado');
      return { success: 1, errors: 0 };
    }
    catch (err) {
      logWarning(`Skipped context-engineering.md: ${errorMessage(err)}`);
      return { success: 0, errors: 1 };
    }
  }
  return { success: 0, errors: 0 };
}

/**
 * Refresh a single MCP template file (templates/mcp/<agent>.template.*) from
 * upstream while leaving every other template untouched.
 *
 * Why: per D12 in FASE-15-DESIGN, templates/mcp/ is user-managed (the user
 * fills placeholders), but the updater can opt-in refresh a specific agent's
 * template when upstream adds new MCP servers or fixes structure.
 */
async function updateMcpTemplateForAgent(agent: McpAgent): Promise<MergeResult> {
  logHeader(`📦 UPEX Boilerplate Updater v${CLI_VERSION} — MCP template refresh`);
  logInfo(`Agente: ${agent}`);

  await validatePrerequisites();
  await cloneTemplate();

  const fileName = MCP_TEMPLATE_FILE[agent];
  const srcPath = path.join(TEMP_DIR, 'templates', 'mcp', fileName);
  const destPath = path.join('templates', 'mcp', fileName);

  if (!fs.existsSync(srcPath)) {
    logError(`Upstream no contiene templates/mcp/${fileName}`);
    cleanup();
    return { success: 0, errors: 1 };
  }

  fs.mkdirSync(path.dirname(destPath), { recursive: true });

  if (fs.existsSync(destPath)) {
    const localContent = fs.readFileSync(destPath, 'utf-8');
    const upstreamContent = fs.readFileSync(srcPath, 'utf-8');
    if (localContent === upstreamContent) {
      logInfo(`Sin cambios — tu templates/mcp/${fileName} ya esta sincronizado.`);
      cleanup();
      return { success: 0, errors: 0 };
    }
    logWarning(`Tu archivo local templates/mcp/${fileName} sera sobrescrito.`);
    logInfo('Tip: ejecuta "bun up --rollback" si necesitas revertir.');
  }

  try {
    const componentBackup = createBackup(['templates']);
    fs.cpSync(srcPath, destPath);
    logSuccess(`templates/mcp/${fileName} actualizado desde upstream`);
    logInfo(`Backup disponible en: ${componentBackup}`);
    cleanup();
    return { success: 1, errors: 0 };
  }
  catch (err) {
    logError(`No se pudo actualizar templates/mcp/${fileName}: ${errorMessage(err)}`);
    cleanup();
    return { success: 0, errors: 1 };
  }
}

function cleanup(): void {
  fs.rmSync(TEMP_DIR, { recursive: true, force: true });
}

// ============================================================================
// VERSION TRACKING
// ============================================================================

function getTemplateCommit(): string {
  try {
    return execSync('git rev-parse HEAD', { cwd: TEMP_DIR, stdio: ['pipe', 'pipe', 'pipe'] })
      .toString()
      .trim();
  }
  catch {
    return 'unknown';
  }
}

function recordSyncVersion(syncedComponents: string[]): void {
  const version: SyncVersion = {
    lastSync: new Date().toISOString(),
    templateCommit: getTemplateCommit(),
    cliVersion: CLI_VERSION,
    syncedComponents,
    variableSystemVersion: true,
  };

  fs.writeFileSync(VERSION_FILE, `${JSON.stringify(version, null, 2)}\n`);
  logSuccess(`Version registrada en ${VERSION_FILE}`);
}

function readSyncVersion(): SyncVersion | null {
  if (!fs.existsSync(VERSION_FILE)) { return null; }
  try {
    return JSON.parse(fs.readFileSync(VERSION_FILE, 'utf-8')) as SyncVersion;
  }
  catch {
    return null;
  }
}

// ============================================================================
// VARIABLE DETECTION
// ============================================================================

function detectUnfilledVariables(): void {
  const claudeMdPath = path.join(process.cwd(), 'CLAUDE.md');
  if (!fs.existsSync(claudeMdPath)) {
    return;
  }

  const claudeContent = fs.readFileSync(claudeMdPath, 'utf-8');

  if (!claudeContent.includes('## Project Variables')) {
    return;
  }

  const definedVars = new Map<string, string>();
  const varLineRegex = /`\{\{([A-Z][A-Z_]+)\}\}`/;

  for (const line of claudeContent.split('\n')) {
    const varMatch = varLineRegex.exec(line);
    if (!varMatch) { continue; }

    const cells = line.split('|').map(c => c.trim());
    if (cells.length >= 4) {
      definedVars.set(varMatch[1], cells[3]);
    }
  }

  if (definedVars.size === 0) {
    return;
  }

  const VARIABLE_REGEX = /\{\{([A-Z][A-Z_]+)\}\}/g;
  const syncedDirs = ['.claude/skills', '.claude/commands', '.context/guidelines', 'docs'];
  const varUsage = new Map<string, number>();

  for (const dir of syncedDirs) {
    const files = collectFiles(dir);
    for (const file of files) {
      if (!file.endsWith('.md') && !file.endsWith('.ts') && !file.endsWith('.json')) { continue; }

      try {
        const content = fs.readFileSync(file, 'utf-8');
        const varsInFile = new Set<string>();

        for (const varMatch of content.matchAll(VARIABLE_REGEX)) {
          varsInFile.add(varMatch[1]);
        }

        for (const varName of varsInFile) {
          varUsage.set(varName, (varUsage.get(varName) || 0) + 1);
        }
      }
      catch {
        // Skip unreadable files
      }
    }
  }

  if (varUsage.size === 0) {
    return;
  }

  const PLACEHOLDER_PATTERNS = ['[', 'example', 'myproject', 'localhost', 'company.atlassian'];
  const unfilled: { name: string, files: number }[] = [];
  const filled: { name: string, files: number }[] = [];

  for (const [varName, fileCount] of varUsage) {
    const value = definedVars.get(varName) || '';
    const isPlaceholder = !value
      || PLACEHOLDER_PATTERNS.some(p => value.toLowerCase().includes(p));

    if (isPlaceholder) {
      unfilled.push({ name: varName, files: fileCount });
    }
    else {
      filled.push({ name: varName, files: fileCount });
    }
  }

  if (unfilled.length === 0) {
    return;
  }

  console.log('');
  logWarning('Variables necesitan configuracion en CLAUDE.md:\n');

  const maxNameLen = Math.max(...[...unfilled, ...filled].map(v => v.name.length + 4));
  const header = `   ${'Variable'.padEnd(maxNameLen + 2)}${'Usado en'.padEnd(12)}Estado`;
  console.log(`${colors.dim}${header}${colors.reset}`);
  console.log(`${colors.dim}   ${'─'.repeat(maxNameLen + 2 + 12 + 15)}${colors.reset}`);

  for (const v of unfilled) {
    const varStr = `{{${v.name}}}`.padEnd(maxNameLen + 2);
    const filesStr = `${v.files} archivo${v.files > 1 ? 's' : ''}`.padEnd(12);
    console.log(`   ${colors.yellow}${varStr}${colors.reset}${filesStr}${colors.yellow}⚠ Aun placeholder${colors.reset}`);
  }
  for (const v of filled) {
    const varStr = `{{${v.name}}}`.padEnd(maxNameLen + 2);
    const filesStr = `${v.files} archivo${v.files > 1 ? 's' : ''}`.padEnd(12);
    console.log(`   ${colors.green}${varStr}${colors.reset}${filesStr}${colors.green}✓ Configurado${colors.reset}`);
  }

  console.log('');
  logInfo('Abre CLAUDE.md y completa la tabla de Project Variables.');
  logInfo('O ejecuta este comando en tu asistente IA:\n');
  console.log(`   ${colors.cyan}/project-doc-setup${colors.reset}\n`);
}

// ============================================================================
// MIGRATION DETECTION
// ============================================================================

function checkMigrationNeeded(): void {
  const syncVersion = readSyncVersion();
  if (syncVersion && syncVersion.variableSystemVersion) {
    return;
  }

  const claudeMdPath = path.join(process.cwd(), 'CLAUDE.md');

  if (!fs.existsSync(claudeMdPath)) {
    return;
  }

  const content = fs.readFileSync(claudeMdPath, 'utf-8');

  if (content.includes('## Project Variables')) {
    return;
  }

  console.log(`
${colors.yellow}╔══════════════════════════════════════════════════════════════╗${colors.reset}
${colors.yellow}║${colors.reset}${colors.bold}                      UPGRADE NOTICE                        ${colors.reset}${colors.yellow}║${colors.reset}
${colors.yellow}╠══════════════════════════════════════════════════════════════╣${colors.reset}
${colors.yellow}║${colors.reset}                                                            ${colors.yellow}║${colors.reset}
${colors.yellow}║${colors.reset}  Este template ahora usa ${colors.cyan}Project Variables${colors.reset}.                 ${colors.yellow}║${colors.reset}
${colors.yellow}║${colors.reset}  Todos los prompts usan ${colors.cyan}{{VARIABLE}}${colors.reset} placeholders que       ${colors.yellow}║${colors.reset}
${colors.yellow}║${colors.reset}  se resuelven desde tu configuracion en CLAUDE.md.           ${colors.yellow}║${colors.reset}
${colors.yellow}║${colors.reset}                                                            ${colors.yellow}║${colors.reset}
${colors.yellow}║${colors.reset}  ${colors.bold}DESPUES${colors.reset} de que esta actualizacion termine, ejecuta:        ${colors.yellow}║${colors.reset}
${colors.yellow}║${colors.reset}                                                            ${colors.yellow}║${colors.reset}
${colors.yellow}║${colors.reset}    ${colors.green}/project-doc-setup${colors.reset}                                      ${colors.yellow}║${colors.reset}
${colors.yellow}║${colors.reset}                                                            ${colors.yellow}║${colors.reset}
${colors.yellow}║${colors.reset}  Esto actualizara tu CLAUDE.md con la nueva tabla de         ${colors.yellow}║${colors.reset}
${colors.yellow}║${colors.reset}  variables y lo configurara para tu proyecto.                ${colors.yellow}║${colors.reset}
${colors.yellow}║${colors.reset}                                                            ${colors.yellow}║${colors.reset}
${colors.yellow}╚══════════════════════════════════════════════════════════════╝${colors.reset}
`);
}

// ============================================================================
// POST-SYNC NOTICES
// ============================================================================

interface PackageJson {
  scripts?: Record<string, string>
  dependencies?: Record<string, string>
  devDependencies?: Record<string, string>
}

function checkAgentsPackageJsonMigration(): void {
  const pkgPath = path.join(process.cwd(), 'package.json');
  if (!fs.existsSync(pkgPath)) {
    return;
  }

  let pkg: PackageJson;
  try {
    pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf-8')) as PackageJson;
  }
  catch {
    return;
  }

  const expectedScripts: Record<string, string> = {
    'lint:agents': 'bun run scripts/agents-lint.ts',
    'jira:sync-fields': 'bun run scripts/sync-jira-fields.ts',
    'jira:check': 'bun run scripts/check-jira-setup.ts',
  };

  const missingScripts: string[] = [];
  for (const [name, command] of Object.entries(expectedScripts)) {
    if (!pkg.scripts || pkg.scripts[name] !== command) {
      missingScripts.push(name);
    }
  }

  const hasYamlDep = Boolean(
    (pkg.dependencies && pkg.dependencies.yaml)
    || (pkg.devDependencies && pkg.devDependencies.yaml),
  );

  if (missingScripts.length === 0 && hasYamlDep) {
    return;
  }

  console.log(`
${colors.yellow}╔══════════════════════════════════════════════════════════════╗${colors.reset}
${colors.yellow}║${colors.reset}${colors.bold}              package.json — ACTUALIZACION MANUAL            ${colors.reset}${colors.yellow}║${colors.reset}
${colors.yellow}╚══════════════════════════════════════════════════════════════╝${colors.reset}

El sistema ${colors.cyan}.agents/${colors.reset} requiere scripts npm y una dependencia que
este CLI no puede agregar automaticamente (tu package.json es
especifico del proyecto y nunca se sobrescribe).
`);

  if (missingScripts.length > 0) {
    console.log(`${colors.bold}Agrega a ${colors.cyan}package.json${colors.reset}${colors.bold} > scripts:${colors.reset}\n`);
    for (const name of missingScripts) {
      console.log(`  ${colors.green}"${name}": "${expectedScripts[name]}"${colors.reset},`);
    }
    console.log('');
  }

  if (!hasYamlDep) {
    console.log(`${colors.bold}Agrega a ${colors.cyan}package.json${colors.reset}${colors.bold} > dependencies:${colors.reset}\n`);
    console.log(`  ${colors.green}"yaml": "^2.8.2"${colors.reset}\n`);
    console.log(`Luego ejecuta: ${colors.cyan}bun install${colors.reset}\n`);
  }

  console.log(`Despues de actualizar, valida la sincronizacion:
  ${colors.cyan}bun run lint:agents${colors.reset}     # valida {{VAR}} y {{jira.<slug>}}
  ${colors.cyan}bun run jira:check${colors.reset}      # valida manifest de Jira vs catalogo

Mas detalles en: ${colors.cyan}.agents/README.md${colors.reset}
`);
}

// ============================================================================
// SYNC SUMMARY
// ============================================================================

function printSyncSummary(totals: MergeResult): void {
  if (totals.errors > 0) {
    logWarning(`Sync finalizado con advertencias: ${totals.success} archivos sincronizados, ${totals.errors} omitidos`);
    logInfo('Revisa las advertencias arriba para detalles. Tu backup esta disponible en .backups/');
  }
  else {
    logSuccess(`${totals.success} archivos sincronizados exitosamente`);
  }
}

// ============================================================================
// MAIN
// ============================================================================

async function main(): Promise<void> {
  const args = process.argv.slice(2);

  // Pre-route --update-mcp-template: it's a standalone flow that does its own
  // clone/backup, so we short-circuit before the menu / regular component sync.
  if (args.includes('--update-mcp-template')) {
    const parsed = parseArgs(args);
    if (parsed.help) {
      showHelp();
      process.exit(0);
    }
    if (!parsed.updateMcpTemplate) {
      process.exit(1);
    }
    const result = await updateMcpTemplateForAgent(parsed.updateMcpTemplate);
    printSyncSummary(result);
    return;
  }

  logHeader(`📦 UPEX Boilerplate Updater v${CLI_VERSION}`);
  logInfo('Usando merge inteligente (preserva archivos del usuario)');

  const totals: MergeResult = { success: 0, errors: 0 };
  const addResult = (r: MergeResult): void => { totals.success += r.success; totals.errors += r.errors; };

  if (args.length === 0) {
    const depsReady = await ensureDependencies();
    if (!depsReady) { return; }

    const selected = await showMainMenu();

    if (selected.length === 0) {
      logWarning('No seleccionaste nada. Saliendo...');
      process.exit(0);
    }

    await validatePrerequisites();

    const components = selected.includes('all')
      ? ['docs', 'context', 'templates', 'scripts', 'cli', 'agents', 'claude', 'vscode', 'husky', 'tooling', 'examples']
      : selected;

    createBackup(components);
    await cloneTemplate();

    checkMigrationNeeded();
    selfUpdate();

    if (selected.includes('all')) {
      addResult(updateDocs());
      addResult(updateContext());
      addResult(updateTemplates());
      addResult(updateScripts());
      addResult(updateCli());
      addResult(updateAgents());
      addResult(updateClaude());
      addResult(updateVscode());
      addResult(updateHusky());
      addResult(updateTooling());
      addResult(updateExamples());
      addResult(updateContextEngineering());
    }
    else {
      for (const cmd of selected) {
        if (cmd === 'docs') {
          addResult(updateDocs());
        }
        else if (cmd === 'context') {
          addResult(updateContext());
        }
        else if (cmd === 'templates') {
          addResult(updateTemplates());
        }
        else if (cmd === 'scripts') {
          addResult(updateScripts());
        }
        else if (cmd === 'cli') {
          addResult(updateCli());
        }
        else if (cmd === 'agents') {
          addResult(updateAgents());
        }
        else if (cmd === 'claude') {
          addResult(updateClaude());
        }
        else if (cmd === 'vscode') {
          addResult(updateVscode());
        }
        else if (cmd === 'husky') {
          addResult(updateHusky());
        }
        else if (cmd === 'tooling') {
          addResult(updateTooling());
        }
        else if (cmd === 'examples') {
          addResult(updateExamples());
        }
      }
    }

    cleanupDeprecatedFiles(components);
    recordSyncVersion(components);
    detectUnfilledVariables();
    if (components.includes('agents') || components.includes('scripts')) {
      checkAgentsPackageJsonMigration();
    }
    cleanup();
    logHeader('✅ Actualizacion completada!');
    printSyncSummary(totals);
    logInfo('Tus archivos personalizados han sido preservados.');
    return;
  }

  const parsed = parseArgs(args);

  if (parsed.help) {
    showHelp();
    process.exit(0);
  }

  if (parsed.rollback) {
    rollbackFromBackup();
    return;
  }

  if (parsed.commands.length === 0) {
    logError('No se especifico ningun comando valido');
    showHelp();
    process.exit(1);
  }

  await validatePrerequisites();

  let allMode = false;
  if (parsed.commands.includes('all')) {
    parsed.commands = ['docs', 'context', 'templates', 'scripts', 'cli', 'agents', 'claude', 'vscode', 'husky', 'tooling', 'examples'];
    allMode = true;
  }

  await cloneTemplate();

  if (parsed.dryRun) {
    executeDryRun(parsed.commands, allMode);
    previewDeprecatedCleanup(parsed.commands);
    cleanup();
    return;
  }

  checkMigrationNeeded();

  createBackup(parsed.commands);

  selfUpdate();

  for (const cmd of parsed.commands) {
    switch (cmd) {
      case 'docs':
        addResult(updateDocs());
        break;
      case 'context':
        addResult(updateContext());
        break;
      case 'templates':
        addResult(updateTemplates());
        break;
      case 'scripts':
        addResult(updateScripts());
        break;
      case 'cli':
        addResult(updateCli());
        break;
      case 'agents':
        addResult(updateAgents());
        break;
      case 'claude':
        addResult(updateClaude());
        break;
      case 'vscode':
        addResult(updateVscode());
        break;
      case 'husky':
        addResult(updateHusky());
        break;
      case 'tooling':
        addResult(updateTooling());
        break;
      case 'examples':
        addResult(updateExamples());
        break;
    }
  }

  if (allMode) {
    addResult(updateContextEngineering());
  }

  cleanupDeprecatedFiles(parsed.commands);
  recordSyncVersion(parsed.commands);
  detectUnfilledVariables();
  if (parsed.commands.includes('agents') || parsed.commands.includes('scripts')) {
    checkAgentsPackageJsonMigration();
  }
  cleanup();
  logHeader('✅ Actualizacion completada!');
  printSyncSummary(totals);
  logInfo('Tus archivos personalizados han sido preservados.');
}

main().catch((err: unknown) => {
  logError('Error inesperado:');
  console.error(err);
  process.exit(1);
});
