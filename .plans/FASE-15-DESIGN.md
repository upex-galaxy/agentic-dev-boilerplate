# Fase 15 — Design Doc (Phase A output)

> Spec autoritativo para Phase B (subagentes B1 + B2 + B3). Cierra las 8 decisiones de `.plans/FASE-15-PLAN.md` §5 y define el flow del installer paso a paso.

## D6 resolución (cli/ vs scripts/)

- **Decisión**: `cli/`
- **Razón**: D6 (unificar `cli/` → `scripts/`) sigue deferida según gotcha #4. Mover ahora amplía scope sin beneficio inmediato. Cuando D6 se cierre, `install.ts` y `update-boilerplate.ts` migran juntos en una sola PR de cleanup.
- **Implicación para B2**: rename target = `cli/update-boilerplate.ts` (NO `scripts/update-boilerplate.ts`). Coherencia B1+B2 garantizada — ambos viven en `cli/`. `package.json` script `up` apunta a `bun cli/update-boilerplate.ts`.

---

## Decisión 1 — Detección de gentle-ai

**Opciones consideradas**:

- A: solo `which gentle-ai`
- B: solo `gentle-ai version`
- C: lookup hardcoded `~/.local/bin/gentle-ai` o `~/bin/gentle-ai`
- D: combo A + B (presence + versión)

**Decisión**: D (combo). Step 1 = `which gentle-ai` (presence). Step 2 = `gentle-ai version` y parseo de output (debe ser ≥1.26.5 según `.plans/GENTLE-AI-RESEARCH.md`).

**Razón**: `which` da presence rápido; `version` confirma binario funcional y compatibilidad de flags `--skill` / `--component`. Lookup hardcoded (C) es frágil — gentle-ai puede vivir en `/usr/local/bin/`, `~/bin/`, `~/go/bin/`, brew dirs, etc.

**Si no está instalado**: mostrar bloque copy-paste con los 2 comandos oficiales de install (`brew install gentle-ai` macOS / `go install github.com/Gentleman-Programming/gentle-ai/cmd/gentle-ai@latest` cross-platform). NO ejecutar nada. Preguntar: "Continuar sin gentle-ai? Te perdés los 15 skills + engram + SDD orchestrator. Solo se configuran los 4 MCPs canónicos." Si user acepta skip → marcar en `.agents/install-state.json` y continuar.

---

## Decisión 2 — Detección del agente

**Opciones consideradas**:

- A: stat `~/.claude/` solo
- B: stat `~/.config/opencode/` solo
- C: stat ambos + prompt multi-select

**Decisión**: C. Chequear ambos paths en paralelo. Resultados:

- Solo Claude Code presente → confirm "Configurar para Claude Code? [Y/n]"
- Solo OpenCode presente → confirm "Configurar para OpenCode? [Y/n]"
- Ambos → multi-select (checkbox prompt: "Qué agentes configurar? [x] Claude Code [x] OpenCode")
- Ninguno → mostrar warning + abort: "No detecté Claude Code (`~/.claude/`) ni OpenCode (`~/.config/opencode/`). Instalá uno y volvé a correr."

**Razón**: D14 limita scope a estos 2 agentes. La detección por filesystem es zero-cost y refleja install real (gentle-ai usa los mismos paths según research).

---

## Decisión 3 — Idempotencia

**Opciones consideradas**:

- A: re-run completo siempre (gentle-ai sync se encarga)
- B: leer `.agents/install-state.json` y skipear lo ya hecho
- C: hash-compare config files antes de sobrescribir

**Decisión**: B + C parcial. Cada step verifica state previo:

- **Skills**: si `installState.skills[slug] === "installed"` → skip + log info. Else → invocar `gentle-ai install --skill <slug> --agent <agent>`.
- **MCPs**: si `.mcp.json` existe y contiene una clave del MCP siendo configurado → preguntar "Ya existe config para `tavily`. Sobrescribir? [y/N]". Default no destructivo.
- **CLIs externos**: idempotente por naturaleza (solo verifica + reporta).

**Razón**: gentle-ai sync es idempotente upstream pero el flow del installer hace varias cosas más (MCPs, CLIs verify) que necesitan tracking propio. `.agents/install-state.json` es la fuente de verdad local.

---

## Decisión 4 — Persistencia "skip gentle-ai"

**Opciones consideradas**:

- A: marker HTML en `AGENTS.md` (`<!-- install:gentle-ai:skipped-by-user -->`)
- B: archivo `.agents/install-state.json`
- C: ambos

**Decisión**: B (solo `.agents/install-state.json`).

**Razón**: AGENTS.md es contenido user-curated; ensuciarlo con markers de installer mezcla concerns. `.agents/` ya es el lugar para state operacional del framework (ahí viven `project.yaml`, `jira.json`). Schema:

```json
{
  "version": 1,
  "installedAt": "2026-05-09T18:42:00Z",
  "agents": ["claude-code"],
  "gentleAi": {
    "status": "installed",
    "version": "1.26.5",
    "checkedAt": "2026-05-09T18:42:00Z"
  },
  "skills": {
    "sdd-init": "installed",
    "sdd-explore": "installed",
    "judgment-day": "installed"
  },
  "mcps": {
    "tavily": "configured-with-key",
    "context7": "configured-no-key",
    "supabase": "placeholder",
    "n8n": "skipped-by-user"
  },
  "externalClis": {
    "vercel": "found",
    "supabase": "found",
    "acli": "missing",
    "playwright": "found",
    "resend": "missing"
  }
}
```

`.agents/install-state.json` se agrega a `.gitignore` (state local del dev, no del proyecto).

---

## Decisión 5 — Manejo de API keys

**Opciones consideradas**:

- A: prompt obligatorio (no continuar sin valor)
- B: prompt opcional con Enter para skip → placeholder
- C: leer de env (`process.env.TAVILY_API_KEY`) + fallback a prompt

**Decisión**: C + B (capa env primero, prompt si no está, Enter para skip → placeholder).

**Razón**: muchos devs ya tienen las keys en `~/.bashrc` / `~/.zshrc`. C ahorra retipear. B respeta el flow "skip y completá luego".

**Convención de placeholder**: usar `{{VAR_NAME}}` (NO `${VAR_NAME}` como decía el plan §5). Esto matchea los templates existentes en `templates/mcp/*.template.json` (líneas 38, 51, 78, etc.). Documentar en `.mcp.json` resultante:

```jsonc
{
  "mcpServers": {
    "tavily": {
      "command": "npx",
      "args": ["-y", "mcp-remote", "https://mcp.tavily.com/mcp/?tavilyApiKey={{TAVILY_API_KEY}}"],
    },
  },
}
```

**Summary final del installer** muestra una sección "Faltan estas env vars": lista de `{{VAR}}` no resueltas + instrucción de exportarlas o reemplazarlas inline en `.mcp.json` (que está gitignored).

---

## Decisión 6 — Per-agent MCP config

**Opciones consideradas**:

- A: hardcoded JSON en `cli/install.ts`
- B: leer `templates/mcp/{agent}.template.json` + filtrar al subset 4
- C: rehacer template files con solo los 4 canónicos

**Decisión**: B (filtrar templates existentes). Pasos del installer:

1. Detectar agente (Decisión 2)
2. Leer `templates/mcp/claude.template.json` o `templates/mcp/opencode.template.json`
3. Filtrar el campo `mcpServers` (Claude) o `mcp` (OpenCode) a solo: `tavily`, `context7`, `supabase`, `n8n`. **n8n no existe en los templates actuales** — el installer lo agrega inline (referencia: `npx -y @n8n/mcp-server` o equivalente, B3 confirma sintaxis exacta vía web search).
4. Para OpenCode template: setear `enabled: true` en los 4 (default es `false` para todos).
5. Reemplazar placeholders `{{VAR}}` con valores del user (Decisión 5).
6. Escribir output: Claude → `.mcp.json` en raíz del proyecto. OpenCode → `opencode.json` (que también está en `.gitignore` línea 72).

**Razón**: D12 dice "templates/mcp/ NO se borra" — son user-managed. El installer los lee como source-of-truth pero no los muta. Filtrar evita tocar D13 (4 canónicos) sin borrar opciones que el user puede agregar manual después.

**Nota para B3 (cleanup)**: B3 sí rehace `.mcp.example.json` con solo los 4 — ese es archivo separado, sirve como ejemplo committeable.

---

## Decisión 7 — Verificación de CLIs externos

**Opciones consideradas**:

- A: solo `which` cada CLI
- B: `which` + `--version` para confirmar funcional
- C: ofrecer install automático

**Decisión**: A. Run `which vercel`, `which supabase`, `which acli`, `which playwright`, `which resend` en paralelo (`Promise.all`). Output = tabla:

```
CLI            Status      Install (si falta)
─────────────────────────────────────────────────────
vercel         found       (skip)
supabase       missing     npm i -g supabase
acli           found       (skip)
playwright     missing     npm i -D @playwright/test
resend         found       (skip)
```

**Razón**: `--version` agrega 5 subprocess calls innecesarios — `which` cubre 99% del caso. C (auto-install) no se hace nunca: rompe boundary de "el installer del repo NO instala globals del sistema". Mostrar comando oficial es suficiente.

**Comando install oficial por CLI** (hardcoded en el installer):

| CLI        | Comando sugerido                                           |
| ---------- | ---------------------------------------------------------- |
| vercel     | `npm i -g vercel`                                          |
| supabase   | `brew install supabase/tap/supabase` o `npm i -g supabase` |
| acli       | `brew install --cask atlassian-cli`                        |
| playwright | `npm i -D @playwright/test`                                |
| resend     | `npm i -g resend`                                          |

---

## Decisión 8 — Output del installer

**Decisión**: 3 outputs concretos + mensaje de cierre.

1. **`.mcp.json`** (Claude) o **`opencode.json`** (OpenCode) en raíz del proyecto. Contiene los 4 MCPs configurados con keys reales o `{{PLACEHOLDER}}`. Ambos paths están gitignored (líneas 68 y 72 del `.gitignore`).
2. **`.agents/install-state.json`** con schema de Decisión 4. Tracker para idempotencia + onboarding handoff.
3. **Mensaje de cierre** stdout (multi-líneas):

```
✓ Installer completado.

Skills instaladas: 15/15 (engram + 11 SDD + 4 foundation)
MCPs configurados: 4/4 (tavily, context7, supabase, n8n)
CLIs externos: 3/5 found (faltan: supabase, resend)
Env vars pendientes: TAVILY_API_KEY, SUPABASE_ACCESS_TOKEN

Próximos pasos:
1. Resolvé las env vars pendientes (export en tu shell o reemplazá en .mcp.json)
2. Instalá los CLIs faltantes (ver tabla arriba)
3. Corré: bun run lint:agents (verificar config válido)
4. Corré: /refresh-ai-memory (cargar context inicial en Claude/OpenCode)
5. Corré: /init-project (bootstrap del agente sobre este repo)

Doc completa: docs/setup/integrating-gentle-ai.md
```

**Razón**: 3 outputs cubren state (json), config aplicada (mcp), y handoff humano (stdout). User sabe qué falta y qué hacer next sin tener que adivinar.

---

## Outline del flow del installer

### Step 1 — Welcome + repo identity check

- **Pregunta al user**: ninguna (info-only).
- **Acción**: print banner + verificar que estamos en root del repo (`package.json` tiene `"name": "ai-driven-project-starter"` o similar — fallback: confirmar con user).
- **Disco**: nada.

### Step 2 — Detect gentle-ai

- **Pregunta**: ninguna (auto).
- **Acción**: `which gentle-ai` + parsear `gentle-ai version`. Resultado guardado en memory: `{ found, version }`.
- **Disco**: nada todavía.

### Step 3 — Offer gentle-ai install (if missing) or skip

- **Si gentle-ai found**: skip a Step 4.
- **Si missing — pregunta**: "gentle-ai no detectado. Quiero ayudarte a instalarlo (manda skills + SDD + engram). Opciones: [1] Mostrame el comando de install, salgo y vuelvo, [2] Continuar sin gentle-ai (solo configura MCPs propios)."
- **Si responde 1**: print bloque copy-paste con `brew install gentle-ai` + alternativa `go install ...` → exit 0. (User vuelve a correr el installer luego.)
- **Si responde 2**: marcar `installState.gentleAi.status = "skipped"`, saltar Steps 5-6, ir a Step 7.
- **Disco**: nada (state se materializa en Step 9).

### Step 4 — Detect agent (Claude Code / OpenCode / both)

- **Pregunta**: depende de detección (ver Decisión 2). Multi-select si ambos detectados; confirm si uno; abort si ninguno.
- **Acción**: guardar `installState.agents = ["claude-code"]` o `["claude-code", "opencode"]`.
- **Disco**: nada.

### Step 5 — Offer skill installation via gentle-ai

- **Solo si gentle-ai found** (Step 3 path A).
- **Pregunta**: "Voy a instalar 15 skills + engram + SDD orchestrator via gentle-ai. Esto corre `gentle-ai install --skill <slug> --agent <agent>` 16 veces (1 engram + 15 skills) por cada agente elegido. Continuar? [Y/n]"
- **Default**: Y (mantiene el flow ágil).
- **Acción**: si Y → Step 6.
- **Disco**: nada.

### Step 6 — Per-skill idempotency check + dispatch

- **Loop**: para cada agente × cada slug en `[engram, sdd-init, sdd-explore, sdd-propose, sdd-spec, sdd-design, sdd-tasks, sdd-apply, sdd-verify, sdd-archive, sdd-onboard, skill-registry, judgment-day, cognitive-doc-design, comment-writer, issue-creation]`:
  - Si ya marcado `installed` en state previo → skip + log "skipping <slug> (already installed)".
  - Else → ejecutar `gentle-ai install --component engram --agent <agent>` (engram) o `gentle-ai install --skill <slug> --agent <agent>` (skills).
  - **TBD Phase B**: validar empíricamente si `--yes` / `--non-interactive` flag existe. Si gentle-ai pide confirm interactivo en cada llamada, el installer del repo necesita pasar el flag para no romperse. Si el flag NO existe, replantear: pedir al user que corra `gentle-ai install --preset ecosystem-only` manual antes y el installer solo verifica.
- **Disco**: nada todavía. State updates se buffer y flush en Step 9.

### Step 7 — MCP configuration loop

- **Loop**: para cada agente, leer `templates/mcp/{agent}.template.json`, filtrar a 4 canónicos, agregar `n8n` (no en template actual), prompt API keys.
- **Pregunta por MCP**:
  - tavily: "TAVILY_API_KEY (Enter para placeholder, leído de $TAVILY_API_KEY si seteado):" → secret input.
  - context7: no requiere key.
  - supabase: "SUPABASE_ACCESS_TOKEN (Enter para placeholder):" → secret input.
  - n8n: depende del paquete (B3 confirma) — probable env var `N8N_API_KEY`.
- **Acción**: interpolar valores en JSON in-memory.
- **Disco**: escribir `.mcp.json` (Claude) o `opencode.json` (OpenCode). Si el archivo existe → preguntar sobrescribir (Decisión 3).

### Step 8 — Verify external CLIs

- **Pregunta**: ninguna (auto).
- **Acción**: `which vercel`, `which supabase`, `which acli`, `which playwright`, `which resend` en paralelo. Build tabla de resultados.
- **Disco**: nada (resultado guardado en state para Step 9).

### Step 9 — Write outputs (state + config files)

- **Acción**: serializar `installState` → `.agents/install-state.json`. Confirmar que `.mcp.json` / `opencode.json` se escribió correctamente en Step 7.
- **Disco**:
  - `.agents/install-state.json` (nuevo o sobrescrito)
  - `.mcp.json` o `opencode.json` (escrito en Step 7, verificación final acá)
  - **NO** modificar AGENTS.md (eso es trabajo de B3).

### Step 10 — Closing summary with next steps

- **Output**: imprimir el mensaje de Decisión 8 (skills count, MCPs count, CLIs missing, env vars pendientes, next steps numerados, link a `docs/setup/integrating-gentle-ai.md`).
- **Exit**: 0.

---

## Anexo A — Comando exacto gentle-ai install (15 skills + engram)

Por D11 (no usar `--preset`), uno por slug, multiplicar por agente seleccionado.

```bash
# Engram (componente, no skill)
gentle-ai install --component engram --agent claude-code

# SDD bloque (11 — incluye skill-registry y sdd-onboard)
gentle-ai install --skill sdd-init --agent claude-code
gentle-ai install --skill sdd-explore --agent claude-code
gentle-ai install --skill sdd-propose --agent claude-code
gentle-ai install --skill sdd-spec --agent claude-code
gentle-ai install --skill sdd-design --agent claude-code
gentle-ai install --skill sdd-tasks --agent claude-code
gentle-ai install --skill sdd-apply --agent claude-code
gentle-ai install --skill sdd-verify --agent claude-code
gentle-ai install --skill sdd-archive --agent claude-code
gentle-ai install --skill sdd-onboard --agent claude-code
gentle-ai install --skill skill-registry --agent claude-code

# Foundation (4)
gentle-ai install --skill judgment-day --agent claude-code
gentle-ai install --skill cognitive-doc-design --agent claude-code
gentle-ai install --skill comment-writer --agent claude-code
gentle-ai install --skill issue-creation --agent claude-code
```

Si el user eligió OpenCode también, el bloque entero se repite con `--agent opencode`.

**Total**: 16 invocaciones × N agentes elegidos. Para 1 agente: 16 calls. Para 2: 32 calls.

---

## Anexo B — Decisiones diferidas a Phase B

1. **`--yes` / `--non-interactive` flag de gentle-ai**: validar empíricamente en B1 smoke test. Si no existe, fallback a "user corre `gentle-ai install --preset ecosystem-only` antes y el installer solo verifica state".
2. **Sintaxis exacta del MCP n8n**: B3 confirma vía web search (probable `npx @n8n/mcp-server` o equivalente). Hasta entonces, el installer pone placeholder con TODO comment.
3. **`package.json` script name conflict**: `"install"` choca con `npm install` semantics. B1 usa `"setup"` o `"bootstrap"` en su lugar (decidir en B1, no acá).

---

## Anexo C — Dependencias entre B1, B2, B3

- **B1** (cli/install.ts) depende de: `templates/mcp/{agent}.template.json` (Decisión 6) + `.gitignore` ya tiene `.mcp.json` / `opencode.json` ignored.
- **B2** (cli/update-boilerplate.ts) renombra desde `cli/update-template.js`. **Update obligatorio en `package.json`**: línea 11 `"up": "bun cli/update-template.js"` → `"up": "bun cli/update-boilerplate.ts"`. Sin esto, `bun run up` rompe.
- **B3** (docs + .mcp.example.json + AGENTS.md) sirve de doc humano para el flow que B1 implementa. B1 referencia `docs/setup/integrating-gentle-ai.md` en su mensaje de cierre (Step 10) — B3 debe crearlo antes de smoke-test de Fase D.

---

**Diseño completado**: 2026-05-09. Phase B puede arrancar leyendo este doc + `.plans/FASE-15-PLAN.md` §6.
