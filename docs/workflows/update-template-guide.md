# Actualizar Template - Guia de Uso

Esta guia explica como usar el script `cli/update-boilerplate.ts` (invocado via `bun up`) para mantener tu proyecto sincronizado con el template `upex-galaxy/agentic-dev-boilerplate`. El contenido de workflow vive en `.claude/skills/` (skills auto-cargadas por Claude Code) y `.claude/commands/` (slash commands).

---

## Setup Inicial (una sola vez)

### 1. Instalar GitHub CLI

```bash
# Mac
brew install gh

# Windows
winget install GitHub.cli

# Linux (Ubuntu/Debian)
sudo apt install gh
```

### 2. Autenticarse en GitHub CLI

```bash
gh auth login
```

Selecciona:

- GitHub.com
- HTTPS
- Login with web browser
- Copia el codigo de 8 digitos
- Pegalo en el navegador

### 3. Verificar acceso al template

```bash
gh repo view upex-galaxy/agentic-dev-boilerplate
```

Si ves la info del repo, todo listo.

### 4. Instalar dependencias

```bash
bun install
```

### 5. Verificar el script en `package.json`

```json
{
  "scripts": {
    "up": "bun cli/update-template.js"
  }
}
```

### 6. Agregar `.backups` al `.gitignore`

```
.backups
```

---

## Uso del Script

### Menu Interactivo (recomendado)

```bash
bun up
```

Abre un menu donde puedes seleccionar que actualizar:

- Todo (`all`)
- Claude (`.claude/`) — skills, commands y settings
- Agents (`.agents/`) — framework + bootstrap protegido
- Scripts (`scripts/`) — solo framework (agents + jira)
- CLI Tools (`cli/`) — Xray CLI y otras herramientas
- Documentacion (`docs/`)
- Context (`.context/`)
- Templates MCP (`templates/mcp/`)
- VS Code (`.vscode/`)
- Husky (`.husky/`) — git hooks
- Tooling — archivos de configuracion del framework
- Examples — archivos de ejemplo

### Comandos Directos

```bash
bun up all           # Actualiza todo
bun up claude        # Actualiza .claude/ (settings.json + skills/ + commands/)
bun up agents        # Actualiza .agents/ (framework + bootstrap protegido)
bun up scripts       # Actualiza scripts/ (sync-jira-issues.ts y otros del framework)
bun up cli           # Actualiza cli/ (Xray CLI, sync-openapi, update-template)
bun up docs          # Actualiza docs/
bun up context       # Actualiza .context/
bun up templates     # Actualiza templates/mcp/
bun up vscode       # Actualiza .vscode/
bun up husky        # Actualiza .husky/
bun up tooling      # Actualiza archivos de configuracion del framework
bun up examples     # Actualiza archivos de ejemplo
bun up help         # Muestra ayuda
bun up --rollback   # Restaura desde el backup mas reciente
```

### Flags Globales

```bash
bun up all --dry-run     # Preview de cambios sin modificar archivos
bun up claude --dry-run  # Preview solo de .claude/
bun up --rollback        # Restaura desde el backup mas reciente
```

### Multiples Componentes

```bash
bun up claude agents docs   # Actualiza los 3 componentes
```

---

## Merge Inteligente

El script usa **merge inteligente** sin listas hardcodeadas:

- **Actualiza/agrega cualquier archivo del template** — si existe upstream, se sincroniza.
- **Preserva tus archivos** — si creaste archivos o carpetas propios, no se tocan.
- **No elimina nada que no exista en el template** (excepto entradas explicitas en `DEPRECATED_FILES`, que limpian archivos renombrados o retirados upstream).
- **Nuevos archivos del template se incluyen automaticamente** sin tener que actualizar el script.

### Ejemplo

Si tienes en `docs/`:

```
docs/
├── workflows/              # Del template - SE ACTUALIZA
├── methodology/            # Del template - SE ACTUALIZA
├── architectures/          # Del template - SE ACTUALIZA (carpetas existentes)
│   └── mi-stack-custom/    # Tuyo - NO SE TOCA
├── mi-guia-custom.md       # Tuyo - NO SE TOCA
└── mis-runbooks/           # Tuyo - NO SE TOCA
```

---

## Dry Run (Preview)

El flag `--dry-run` permite previsualizar que archivos se sincronizarian **sin modificar nada**.

### Uso

```bash
bun up all --dry-run             # Preview de todo
bun up claude --dry-run          # Preview solo de .claude/
bun up docs context --dry-run    # Preview de docs/ y .context/
```

### Que muestra

- Cantidad de archivos por componente que se sincronizarian
- Total de archivos que cambiarian
- Componentes que no existen en el template (marcados como "No encontrado")

### Ejemplo de salida

```
DRY RUN — No se modificaran archivos

   Claude (.claude/)    →  Sincronizaria 28 archivos
   Context (.context/)  →  Sincronizaria 18 archivos
   Tooling              →  Sincronizaria 5 archivos de config

Total: 51 archivos se sincronizarian
Ejecuta sin --dry-run para aplicar los cambios.
```

---

## Rollback (Restaurar Backup)

El flag `--rollback` restaura tu proyecto desde el backup mas reciente. No necesitas buscar manualmente en `.backups/`.

### Uso

```bash
bun up --rollback
```

### Que hace

1. Lista los backups disponibles en `.backups/` (muestra hasta 5, con indicador del mas reciente)
2. Selecciona automaticamente el backup mas reciente
3. Restaura todos los archivos del backup a sus ubicaciones originales
4. Muestra cuantos archivos fueron restaurados

### Ejemplo de salida

```
Rollback desde Backup

Se encontraron 3 backups:
   update-2026-04-13-143022  (mas reciente)
   update-2026-04-12-091500
   update-2026-04-10-170845

Restaurando desde: update-2026-04-13-143022
Restaurados 65 archivos desde update-2026-04-13-143022
```

---

## Version Tracking

Despues de cada sincronizacion exitosa, el script registra metadata en `.boilerplate-version.json` en la raiz del proyecto.

### Que registra

| Campo                   | Descripcion                                         |
| ----------------------- | --------------------------------------------------- |
| `lastSync`              | Fecha y hora de la ultima sincronizacion (ISO 8601) |
| `templateCommit`        | Hash del commit del template que se uso             |
| `cliVersion`            | Version del CLI (ej: `4.1`)                         |
| `syncedComponents`      | Lista de componentes que se sincronizaron           |
| `variableSystemVersion` | Indica que el proyecto usa el sistema de variables  |

### Ejemplo

```json
{
  "lastSync": "2026-05-07T14:30:22.000Z",
  "templateCommit": "abc1234",
  "cliVersion": "4.1",
  "syncedComponents": ["claude", "agents", "context", "docs"],
  "variableSystemVersion": true
}
```

> **Nota**: Este archivo se puede commitear al repo. Es util para saber cuando fue la ultima vez que el proyecto se sincronizo con el template.

---

## Deteccion de Variables

Despues de cada sincronizacion, el script escanea los archivos sincronizados buscando placeholders `{{VARIABLE}}` que aun no han sido configurados.

### Que hace

1. Lee la tabla de **Project Variables** en `CLAUDE.md` (y `.agents/project.yaml` cuando existe)
2. Escanea `.claude/`, `.context/` y `docs/` buscando `{{VARIABLE}}`
3. Compara los valores configurados con patrones de placeholder (ej: `[`, `example`, `myproject`, `localhost`)
4. Muestra una tabla con el estado de cada variable

### Ejemplo de salida

```
Variables necesitan configuracion en CLAUDE.md / .agents/project.yaml:

   Variable                Usado en    Estado
   ────────────────────────────────────────────────
   {{PROJECT_NAME}}        12 archivos   Aun placeholder
   {{API_URL_STAGING}}      8 archivos   Aun placeholder
   {{JIRA_URL}}             3 archivos   Configurado

Abre CLAUDE.md y completa la tabla de Project Variables (o edita .agents/project.yaml).
```

### Como resolver

Abre `CLAUDE.md`, busca la seccion **Project Variables** y reemplaza los valores de ejemplo. Tambien puedes editar directamente `.agents/project.yaml` (single source of truth) y validar con `bun run lint:agents`.

---

## Self-Update Mejorado

El script se auto-actualiza antes de cada sincronizacion. Si detecta una version mas reciente del propio `update-template.js` upstream, la descarga primero y muestra la transicion de versiones.

### Que hace

- Compara tu version local del script con la version del template
- Muestra la transicion de version (ej: `v4.0 → v4.1`)
- Si detecta un **cambio de version mayor** (ej: `3.x → 4.x`), muestra una advertencia adicional para que revises posibles cambios incompatibles

### Ejemplo de salida

```
Cambio de version mayor detectado: v3.0 → v4.1
Revisa el changelog por posibles cambios incompatibles despues de esta actualizacion.
Auto-actualizando update-template.js (v3.0 → v4.1)...
update-template.js actualizado a v4.1
```

> **Nota**: El self-update ocurre automaticamente. No necesitas ejecutar ningun comando adicional.

---

## Que se Actualiza

### Se actualizan (merge)

| Componente       | Contenido                                                                                        |
| ---------------- | ------------------------------------------------------------------------------------------------ |
| `.claude/`       | `settings.json` + `skills/` + `commands/` (workflows + slash commands)                           |
| `.agents/`       | `project.yaml`, `jira-required.yaml`, `jira-fields.json`, `jira-workflows.json`, framework files |
| `scripts/`       | `agents/`, `sync-jira-issues.ts` (solo del framework)                                            |
| `cli/`           | `update-template.js`, `sync-openapi.ts`, `xray/`                                                 |
| `docs/`          | `architectures/`, `methodology/`, `setup/`, `workflows/`                                         |
| `.context/`      | `system-prompt.md`, `README.md`, archivos de Discovery (genericos)                               |
| `templates/mcp/` | Templates de configuracion MCP                                                                   |
| `.vscode/`       | `extensions.json`, `settings.json`                                                               |
| `.husky/`        | Git hooks                                                                                        |
| Tooling          | `.editorconfig`, `.prettierrc`, `.prettierignore`                                                |

### NO se tocan (tu trabajo)

| Directorio       | Descripcion                                |
| ---------------- | ------------------------------------------ |
| `.context/idea/` | Tu documentacion de negocio                |
| `.context/PRD/`  | Tus requerimientos de producto             |
| `.context/SRS/`  | Tus especificaciones tecnicas              |
| `.context/PBI/`  | Tu product backlog y contexto por historia |
| `src/`           | Tu codigo                                  |
| `.env`           | Tus credenciales                           |
| Archivos propios | Cualquier archivo/carpeta que hayas creado |

---

## Sistema de Backups

Cada ejecucion crea un backup automatico:

- Formato: `.backups/update-YYYY-MM-DD-HHMMSS/`
- Los backups NO se sobrescriben, se acumulan
- Util para comparar versiones o revertir cambios

### Restaurar un Backup

La forma mas facil es usar el flag `--rollback`:

```bash
bun up --rollback         # Restaura desde el backup mas reciente
```

Si prefieres restaurar manualmente un backup especifico, copia las carpetas que necesites:

```bash
ls -la .backups/

# Restaurar (reemplaza la fecha)
cp -r .backups/update-2026-XX-XX-XXXXXX/.claude .
cp -r .backups/update-2026-XX-XX-XXXXXX/.agents .
cp -r .backups/update-2026-XX-XX-XXXXXX/docs .
cp -r .backups/update-2026-XX-XX-XXXXXX/.context .
```

---

## Flujo SHA-tracked (v6)

A partir de CLI v6.0, `bun up` usa seguimiento de SHA por componente en lugar de un bulk `cpSync`. Esta sección describe el nuevo flujo, el schema del archivo de estado, y los modos de operación disponibles.

### Schema `.boilerplate-version.json` (v6)

```json
{
  "schemaVersion": 6,
  "lastSync": "2026-05-14T12:00:00.000Z",
  "templateCommit": "abc1234def567",
  "cliVersion": "6.0",
  "syncedComponents": ["claude", "agents", "docs"],
  "variableSystemVersion": 1,
  "perComponentCommit": {
    "claude": "abc1234def567",
    "agents": "abc1234def567",
    "docs": "abc1234def567"
  }
}
```

| Campo                   | Descripcion                                                                                                        |
| ----------------------- | ------------------------------------------------------------------------------------------------------------------ |
| `schemaVersion`         | Siempre `6` para este formato. Versiones anteriores se detectan y migran.                                          |
| `lastSync`              | Fecha y hora ISO-8601 de la ultima sincronizacion exitosa.                                                         |
| `templateCommit`        | SHA completo del commit del template usado en el ultimo sync.                                                      |
| `cliVersion`            | Version del CLI que escribio el estado (ej. `"6.0"`).                                                              |
| `syncedComponents`      | Lista de nombres de componente sincronizados en la ultima corrida.                                                 |
| `variableSystemVersion` | Numero de version del sistema de variables (por defecto `1` en migraciones desde v5).                              |
| `perComponentCommit`    | `Record<string, string>` — SHA del template por componente. Los archivos skipped NO avanzan el SHA del componente. |

### Requisito: git ≥ 2.25

El CLI usa partial clone (`--filter=blob:none --no-checkout`) + `git sparse-checkout` para descargar solo las rutas de los componentes necesarios. Esto requiere git 2.25 o superior. Si el binario local reporta una version inferior, el CLI falla con un error fatal antes de cualquier operacion de red.

```bash
git --version   # debe ser >= 2.25
```

### Modo `--auto` (CI / no-interactivo)

Se activa con el flag `--auto` o automaticamente cuando `process.env.CI === 'true'` o `!process.stdin.isTTY`.

Comportamiento:

- Aplica archivos clasificados como `clean-fastforward` y `new-upstream`.
- **Salta** archivos `locally-diverged` y `deleted-upstream` sin preguntar.
- Nunca borra archivos.
- Siempre termina con exit 0, incluso si hay archivos diverged.
- Imprime una tabla de resumen en espanol al final.

```bash
bun up --auto            # modo auto explicito
CI=true bun up           # deteccion automatica en pipelines
```

### Modo `--dry-run` (preview sin escritura)

Simula el sync completo (clasificacion, delta, resolucion) **sin modificar ningun archivo en disco**.

- Funciona en ambos pipelines: `--auto` y el interactivo.
- El prompt de migracion v5→v6 **si aparece** en dry-run, pero el disco no se toca; se imprime `[dry-run] se migraría a v6 (no se escribirá al disco)`.
- La preview de archivos DEPRECATED_FILES se muestra pero no se eliminan.

```bash
bun up --dry-run          # preview interactivo
bun up --auto --dry-run   # preview en modo CI
```

### Modo `--rollback` (restaurar backup)

Restaura todos los archivos desde el directorio de backup mas reciente (`".backups/update-{ISO-ts}/"`).

```bash
bun up --rollback
```

El directorio de backup se selecciona automaticamente (el mas reciente por timestamp). Cada archivo sobreescrito durante un sync tiene su copia en ese directorio antes de la escritura, junto con un manifiesto `RESTORE.txt`.

### Migracion v5 → v6

Si el CLI detecta un `.boilerplate-version.json` con schema anterior (sin campo `schemaVersion: 6`), presenta un prompt al usuario:

```
Detectado: esquema v5 en .boilerplate-version.json.
Se actualizará al esquema v6 con perComponentCommit tracking.
¿Migrar ahora? [Y/n]:
```

- **Si acepta (default Y)**: el estado se migra en memoria y se escribe al disco de forma atomica (tmp + rename) al final del sync exitoso.
- **Si declina**: se ejecuta el flujo legacy sin modificar el archivo.
- **En `--dry-run`**: el prompt aparece igualmente, pero la escritura se omite.

El campo `variableSystemVersion` se establece en `1` si no estaba presente en el estado v5.

### Bootstrap (primera corrida sin `.boilerplate-version.json`)

Si no existe `.boilerplate-version.json`, el CLI muestra un banner de primera corrida y ejecuta un bulk sync de todos los componentes, copiando los archivos del template que faltan o difieren en el repo local. Al final de un sync exitoso escribe el estado v6 inicial con todos los SHAs de componente.

En `--dry-run`: preview de los archivos que se sincronizarian, sin escrituras.

### Archivos skipped

Los archivos que el usuario omite (resolucion `skip`) o que el modo `--auto` salta (clasificados como `locally-diverged`) **no avanzan el SHA del componente** en `perComponentCommit`. La proxima corrida volvera a ofrecer esos archivos.

### Divergencia por whitespace

Antes de clasificar un archivo como `locally-diverged`, el CLI normaliza el contenido (CRLF→LF + elimina espacios en blanco al final de linea). Si la diferencia es solo de whitespace, el archivo se clasifica como `clean-fastforward` y se aplica automaticamente. Los bytes raw del upstream se escriben sin normalizar.

### Limpieza de archivos DEPRECATED

`previewDeprecatedCleanup()` se ejecuta al inicio de cada corrida (antes de cualquier menu). `cleanupDeprecatedFiles()` se ejecuta **despues** del loop de resolucion de archivos y **antes** de escribir el estado v6 en disco. En `--dry-run`, solo se hace preview — ningun archivo se borra.

### Alcance de verificacion

Este flujo **no puede verificarse funcionalmente desde el repo template** — hacerlo sincronizaria el template contra si mismo. La verificacion end-to-end (delta, clasificacion, UI interactiva, `--auto`, `--rollback`, escritura de schema) debe realizarse manualmente en un repo downstream creado a partir del template.

Para referencia de la implementacion, ver handoff original: `.scratch/handoffs/2026-05-14-port-update-boilerplate-from-qa.md`.

---

## Troubleshooting

### "gh: command not found"

```bash
brew install gh        # Mac
winget install GitHub.cli  # Windows
sudo apt install gh    # Linux
```

### "authentication required"

```bash
gh auth login
```

### "repository not found"

Verifica que tienes acceso al repositorio `upex-galaxy/agentic-dev-boilerplate`.

### "Cannot find module '@inquirer/prompts'"

```bash
bun install
# O especificamente:
bun add @inquirer/prompts
```

### Mi proyecto venia de v3.x y no veo skills

Ejecuta `bun up claude` para sincronizar `.claude/skills/` y `.claude/commands/`.

---

## Tips

- Usa `bun up` sin argumentos para el menu interactivo
- El script **preserva tus archivos personalizados**
- Los backups se guardan automaticamente en `.backups/`
- Usa `bun up help` para ver todas las opciones
- Usa `--dry-run` antes de actualizar para ver que cambiaria sin riesgo
- Usa `--rollback` si algo salio mal — restaura el backup mas reciente en un paso
- Revisa `.boilerplate-version.json` para saber cuando fue tu ultima sincronizacion
- Si ves advertencias de variables, completa la tabla en `CLAUDE.md`

---

**Ver tambien:**

- [Git Flow](./git-flow.md)
- [Environments](./environments.md)
- [Sync OpenAPI](./sync-openapi-guide.md)
