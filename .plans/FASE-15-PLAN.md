# Fase 15 — Plan Ejecutivo Detallado

> **Para la próxima IA**: este es el plan completo. Briefings de subagentes pre-escritos al final. Vos sos el orquestador.

---

## Tabla de contenidos

1. [Contexto recuperado (recap)](#1-contexto-recuperado-recap)
2. [Decisiones locked (D9-D15)](#2-decisiones-locked-d9-d15)
3. [Skills a traer de gentle-ai (15)](#3-skills-a-traer-de-gentle-ai-15-exact-slugs)
4. [Cleanup colateral (lista cerrada)](#4-cleanup-colateral-lista-cerrada)
5. [Phase A — Diseño concreto](#5-phase-a--diseño-concreto)
6. [Phase B — Build paralelo](#6-phase-b--build-paralelo)
7. [Phase C — Migración + skill propia](#7-phase-c--migración--skill-propia)
8. [Phase D — Verify + cierre](#8-phase-d--verify--cierre)
9. [Verificaciones finales y criterios de cierre](#9-verificaciones-finales-y-criterios-de-cierre)
10. [Gotchas conocidos](#10-gotchas-conocidos)
11. [Briefings de subagentes pre-escritos](#11-briefings-de-subagentes-pre-escritos)

---

## 1. Contexto recuperado (recap)

### Qué es este repo

`ai-driven-project-starter` (rama `skills-migration`): boilerplate dev-only para apps Next.js + Supabase, basado en Claude Code skills. Migración terminada hace 2 sesiones; quedan 2 grandes pendientes: **Fase 13 (push)** y **Fase 15 (este plan)**.

### Estado al 2026-05-09 (último commit `4fd84d2`)

- 12 workflow skills locales (incluye `git-flow-master` recién creado)
- 6 reusable skills (symlinks a `.agents/skills/`): frontend-design, next-best-practices, next-cache-components, next-upgrade, playwright-cli, resend-cli
- 3 borrowed locales que **se van a borrar en este Fase 15**: `judgment-day`, `cognitive-doc-design`, `comment-writer`
- 4 commands: `project-doc-setup`, `context-engineering-setup`, `sprint-report`, `refresh-ai-memory`
- Lint baseline: 7 errors + 5 warnings (placeholders intencionales en AGENTS.md)
- `CLAUDE.md` es symlink → `AGENTS.md` (single source of truth)
- `.mcp.json` está en `.gitignore` (tokens locales del user, no commit)

### Por qué Fase 15

Las 4 skills "borrowed" de gentle-ai (chained-pr ya borrada + judgment-day, cognitive-doc-design, comment-writer pendientes) son copias literales de upstream. El user decidió (D9) que se obtengan via gentle-ai user-install en lugar de mantenerlas locales. Eso requiere un installer en el repo + docs de cómo conectar gentle-ai.

---

## 2. Decisiones locked (D9-D15)

> Estas YA fueron decididas. NO re-discutir. Aplicar.

| ID  | Decisión                                                                                                                                                                                 |
| --- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| D9  | gentle-ai = quasi-must-have, NO estricto. Engram + SDD = casi obligatorios. Resto opcional pero el installer ofrece todo. AGENTS.md debe documentar la relación                          |
| D10 | Installer formato = **bun script CLI interactivo**                                                                                                                                       |
| D11 | NO usar `gentle-ai install --preset X`. Instalar **por args específicos** (`gentle-ai install --component engram`, `gentle-ai install --skill judgment-day`, etc.) para control granular |
| D12 | `templates/mcp/` NO se borra. User puede borrar después según necesite. Script `update-boilerplate.ts` puede actualizar el template del agente que el user elija                         |
| D13 | MCPs canónicos = solo 4: **tavily, context7, supabase, n8n**. Resto via CLI + skills. n8n incluye su skill propia                                                                        |
| D14 | Solo 2 agentes soportados: **Claude Code + OpenCode**. Codex/Gemini/Cursor/Copilot fuera de scope                                                                                        |
| D15 | 15 skills a traer (lista exacta abajo). Reject: chained-pr/branch-pr/work-unit-commits (cubierto por git-flow-master), skill-creator (oficial Anthropic), go-testing, las 22 community   |

---

## 3. Skills a traer de gentle-ai (15 exact slugs)

### SDD bloque (11)

`sdd-init`, `sdd-explore`, `sdd-propose`, `sdd-spec`, `sdd-design`, `sdd-tasks`, `sdd-apply`, `sdd-verify`, `sdd-archive`, `sdd-onboard`, `skill-registry`

### Foundation (4)

`judgment-day`, `cognitive-doc-design`, `comment-writer`, `issue-creation`

### Comando exacto a generar para el installer

Por D11, debe ser uno por skill:

```bash
gentle-ai install --component engram --agent claude-code
gentle-ai install --skill sdd-init --agent claude-code
gentle-ai install --skill sdd-explore --agent claude-code
# ... una línea por skill, multiplicar por agente si user eligió OpenCode también
```

(El comando exacto puede variar según el CLI real de gentle-ai. Ver `.plans/GENTLE-AI-RESEARCH.md` § "CLI: comandos" para sintaxis confirmada. Si difiere, adaptarse.)

---

## 4. Cleanup colateral (lista cerrada)

Hacer DURANTE Fase 15. NO agregar items fuera de esta lista sin pedir confirmación al user.

### A. Borrar (Phase C)

- `.claude/skills/judgment-day/` (entera — 2 archivos)
- `.claude/skills/cognitive-doc-design/` (entera)
- `.claude/skills/comment-writer/` (entera)

### B. Editar/rehacer

- `.mcp.example.json` — rehacerlo desde cero con SOLO los 4 canónicos: tavily, context7, supabase, n8n. SACAR: atlassian, playwright, dbhub, openapi, postman.
- `.claude/settings.json` — actualizar `Skill()` allow:
  - SACAR: `Skill(judgment-day)`, `Skill(cognitive-doc-design)`, `Skill(comment-writer)` (vienen del user-level)
  - AGREGAR: `Bash(supabase *)`, `Bash(vercel *)` si no están (para CLIs verificados por installer)
  - AGREGAR: `mcp__n8n__*`, SACAR: `mcp__atlassian__*`, `mcp__playwright__*`, `mcp__dbhub__*`, `mcp__openapi__*`
  - Actualizar `enabledMcpjsonServers`: `[context7, tavily, supabase, n8n]`
- `AGENTS.md` — sección "MCPs Available" → solo los 4 canónicos
- `AGENTS.md` — sección "Skills (Claude Code)" → marcar 3 borrowed como "instaladas via gentle-ai (user-level)"
- `AGENTS.md` — agregar sección nueva "Onboarding" con resumen del installer + link a `docs/setup/integrating-gentle-ai.md`

### C. Crear

- `cli/install.ts` (o `scripts/install.ts` si decidís alinear con D6 — ver gotcha #4)
- `cli/update-boilerplate.ts` (rename + migración TS desde `cli/update-template.js`)
- `docs/setup/integrating-gentle-ai.md` (guía humana + hand-off matrix `/sprint-dev` ↔ `/sdd-*`)
- `.claude/skills/agentic-dev-onboard/SKILL.md` (skill propia que explica el flujo del repo: `/sprint-dev` + Jira + Next.js + Supabase)

### D. NO borrar (recordatorio explícito)

- `templates/mcp/*` (D12 — user-managed)
- `.books/*` (decisión D4 previa)
- `.context/idea/`, `.context/PRD/`, `.context/SRS/` (placeholders válidos)

---

## 5. Phase A — Diseño concreto

**Goal**: producir un design doc que decide los detalles técnicos del installer ANTES de codear nada.

**Subagent**: 1 × `Plan` (preferido) o invocar `sdd-propose` si querés flow SDD formal.

**Decisiones que debe cerrar**:

1. **Detección de gentle-ai instalado** — qué comando usar (`which gentle-ai` vs `gentle-ai --version` vs lookup `~/.local/bin/gentle-ai`). Qué hacer si no está: ofrecer instalación (mostrar comando `brew install gentle-ai` o `go install ...@latest`) o continuar sin él (skip skills, install MCPs propios solo).
2. **Detección del agente** — `~/.claude/` exists vs `~/.config/opencode/` exists vs ambos. Qué pasa si ninguno: el script no aplica, mostrar warning.
3. **Idempotencia** — el script puede correr 2da vez sin romper nada. Cómo: chequear "ya instalado" para cada skill antes de invocar `gentle-ai install --skill X`.
4. **Persistencia de la decisión "skip gentle-ai"** — escribir un marker en `AGENTS.md` (`<!-- install:gentle-ai:skipped-by-user -->`) o en `.agents/install-state.json` o algo similar.
5. **Manejo de API keys** — el user tipea o presiona Enter para skip. Si skipea, escribir placeholder `${TAVILY_API_KEY}` en `.mcp.json` (ya soporta interpolación de env). Mostrar al final qué env vars faltan.
6. **Per-agent MCP config** — leer `templates/mcp/claude.template.json` o `opencode.template.json` según agente detectado, y aplicarlo después de prompt al user para los API keys.
7. **Verificación de CLIs externos** — `which vercel`, `which supabase`, `which acli`, `which playwright`, `which resend`. Si falta alguno, mostrar comando de instalación oficial sin ejecutarlo (el user lo decide).
8. **Output del installer** — `.mcp.json` poblado con los 4 MCPs + API keys (o placeholders), `.agents/install-state.json` con timestamp + skills installed, mensaje de cierre con next steps (`/refresh-ai-memory`, `/init-project`).

**Briefing del subagente**: ver §11 "Briefing Phase A".

**Output esperado**: archivo `.plans/FASE-15-DESIGN.md` con cada decisión arriba resuelta + 1 outline del flujo del installer (steps numerados con prompts user-facing).

---

## 6. Phase B — Build paralelo

**Goal**: construir las piezas del installer y la doc.

**Dispatch**: 3 subagentes `general-purpose` en paralelo.

### Subagent B1: `cli/install.ts`

Implementa el flow diseñado en Phase A. Lenguaje: TypeScript + bun. Interactivo via `@inquirer/prompts` (ya está en deps de A). Ver `.plans/FASE-15-DESIGN.md` para el flow exacto.

### Subagent B2: `cli/update-boilerplate.ts` (rename + migración)

- Lee `cli/update-template.js` actual (legacy JS)
- Migra a TypeScript
- Mantiene la misma lógica core (sync from upstream sin git history)
- Agrega capacidad de actualizar `templates/mcp/{agent}.template.json` para el agente que el user elija (D12)
- Renombra el archivo: `git mv cli/update-template.js cli/update-boilerplate.ts` (preserva history)
- Update `package.json` script `up` → `bun cli/update-boilerplate.ts`

### Subagent B3: `docs/setup/integrating-gentle-ai.md` + cleanup colateral

Crea el doc humano que explica:

- Qué es gentle-ai y por qué este repo lo usa como base global
- Qué se instala via gentle-ai (las 15 skills + engram + SDD)
- Qué se queda local (workflow skills propias del repo)
- **Hand-off matrix `/sprint-dev` ↔ `/sdd-*`** (CRÍTICO):

| Cuándo usar                                                                  | Skill                                                                |
| ---------------------------------------------------------------------------- | -------------------------------------------------------------------- |
| Trabajo "normal por ticket Jira" (la mayoría)                                | `/sprint-dev` (workflow ticket-driven)                               |
| Refactor grande / decisión arquitectónica / feature nueva sin ticket todavía | `/sdd-*` (workflow spec-driven)                                      |
| Story con specs detalladas que querés trazar formalmente                     | Ambos: `/sdd-spec` para la spec, después `/sprint-dev` para el ciclo |

- Troubleshooting (gentle-ai no detectado, MCPs no funcionan, etc.)
- Cómo opt-out de gentle-ai (y qué se pierde)

**También en este subagent (cleanup colateral asociado a la doc)**:

- Rehacer `.mcp.example.json` con los 4 canónicos (Tavily, Context7, Supabase, n8n)
- Update sección MCPs Available en AGENTS.md
- Agregar sección "Onboarding" en AGENTS.md

---

## 7. Phase C — Migración + skill propia

**Subagent**: 1 × `general-purpose`.

### Tareas

1. **Borrar las 3 copias locales de skills borrowed**:

   ```bash
   git rm -r .claude/skills/judgment-day
   git rm -r .claude/skills/cognitive-doc-design
   git rm -r .claude/skills/comment-writer
   ```

2. **Update `.claude/settings.json`** — sacar las 3 `Skill()` entries.

3. **Crear `/agentic-dev-onboard` skill** usando `skill-creator` (la oficial de Anthropic, instalada user-level — `Skill skill-creator` con args).

   Briefing para skill-creator:
   - Nombre: `agentic-dev-onboard`
   - Tipo: workflow / utility
   - Description: explica el flujo del repo (ticket Jira → `/sprint-dev` → 12 stages → deploy). Complementa `/sdd-onboard` de gentle-ai (que es genérico).
   - Phase tag: `bootstrap`
   - Compatibility: `[claude-code, opencode]` (D14)
   - Body: walkthrough paso-a-paso. Menciona stack (Next.js + Supabase), Jira workflow (Ready For Dev → In Progress → In Review → Ready For QA), uso de `/sprint-dev` vs `/sdd-*`, MCPs disponibles, env vars críticas.
   - Triggers: "onboard me", "explain this repo", "first time using this", "/agentic-dev-onboard"

4. **Verificar refs huérfanas** — grep en repo por `judgment-day|cognitive-doc-design|comment-writer` y reportar/limpiar (excepto en `.plans/` que son históricos).

---

## 8. Phase D — Verify + cierre

**Subagent**: 1 × `general-purpose` o `Explore` para verify.

### Tareas

1. **Smoke test del installer**:
   - Crear repo dummy temp (`mktemp -d`)
   - Copy del repo current ahí
   - Correr `bun cli/install.ts` simulando user nuevo
   - Verificar que pide preguntas, escribe `.mcp.json`, no rompe
   - Borrar el dummy

2. **Update CLAUDE.md/AGENTS.md** sección Onboarding con link al nuevo doc + summary del installer

3. **Update `.context/skill-registry.md`** corriendo `bun scripts/build-skill-registry.ts`

4. **Update HANDOFF.md** — append final con commits hechos + estado final + cierre Fase 15

5. **Run final lint:agents** — confirmar baseline 7+5 sigue

6. **Reportar al user** con summary de la fase + decisión de si pushear (Fase 13)

---

## 9. Verificaciones finales y criterios de cierre

Fase 15 se considera **completa** cuando:

- [ ] `cli/install.ts` existe, corre sin errores, smoke-test pasa
- [ ] `cli/update-boilerplate.ts` existe (renombrado de `update-template.js`)
- [ ] `docs/setup/integrating-gentle-ai.md` existe con hand-off matrix
- [ ] `.mcp.example.json` solo tiene los 4 MCPs canónicos
- [ ] `.claude/settings.json` actualizado (sin las 3 borrowed skills, MCPs ajustados)
- [ ] Las 3 skills borrowed (`judgment-day`, `cognitive-doc-design`, `comment-writer`) borradas localmente
- [ ] Skill `/agentic-dev-onboard` creada y aparece en harness
- [ ] AGENTS.md tiene sección "Onboarding" + sección "MCPs Available" actualizada
- [ ] `bun run lint:agents` da baseline 7+5
- [ ] HANDOFF.md tiene append cerrando Fase 15
- [ ] Cero refs rotas a las 3 skills borradas (excepto en `.plans/` históricos)

---

## 10. Gotchas conocidos

> Trampas que ya nos pasaron o que son fáciles de cometer.

1. **`.context/skill-registry.md` es auto-gen** — NO lo edites a mano. Si cambia, es el script `scripts/build-skill-registry.ts` que lo regeneró. Ignoralo en commits salvo que vos quieras commitear regeneración intencional.

2. **`CLAUDE.md` es symlink → `AGENTS.md`**. Editar AGENTS.md, ambas se actualizan. No tratar como archivos separados.

3. **`bun lint-staged` corre prettier en pre-commit** — no necesitás formatear manualmente, el hook lo hace.

4. **D6 (cli/→scripts/) sigue deferida**. Si en Phase A decidís que `install.ts` va en `cli/` o en `scripts/`, escogé uno y documentá. Una opinión: si Fase 15 es donde unificás, hacelo todo a `scripts/` (alineado con QA boilerplate sister). Si vas a esperar D6, dejá `install.ts` en `cli/` por ahora. Decidí AL INICIO de Phase A.

5. **`gentle-ai` CLI puede pedir confirmaciones interactivas**. El installer puede necesitar pasar flags `--yes` o `--non-interactive` si existen. Verificar en `.plans/GENTLE-AI-RESEARCH.md` § "CLI: comandos".

6. **API tokens en `.mcp.json`** — el archivo está en `.gitignore` (línea 68). Es seguro escribir tokens reales ahí. NUNCA commitear `.mcp.json`. Solo `.mcp.example.json` (con `${PLACEHOLDERS}`).

7. **`update-template.js` lo usa el `bun run up` script** — al renombrar, actualizá `package.json` también o el script rompe.

8. **No hagas push automático.** Aunque Fase 15 cierre exitoso, NO hagas `git push`. El user decide push (Fase 13 sigue diferida).

9. **Las 3 skills borrowed tienen edits "innecesarios"** del sub-bloque 2026-05-09b (ref `/git-flow-master`). NO los re-edites — borrá los archivos directo en Phase C, los edits desaparecen.

10. **Engram MCP detectado por gentle-ai install** — no lo agregues manualmente al `.mcp.example.json`. El installer de gentle-ai lo registra solo cuando instala el componente engram. Si lo agregás también vos, queda doble (no rompe pero es noise).

---

## 11. Briefings de subagentes pre-escritos

### Briefing Phase A — Diseño

```
Tarea: cerrar las 8 decisiones de diseño de Fase 15 Phase A para el installer del repo
ai-driven-project-starter (rama skills-migration).

## Goal
Producir `.plans/FASE-15-DESIGN.md` (≤300 líneas) que cierre cada una de las 8 decisiones
listadas en `.plans/FASE-15-PLAN.md` §5, más un outline del flow del installer (steps
numerados con prompts user-facing) que sirva como spec para Phase B.

## Inputs (leer en orden)
1. `.plans/FASE-15-PLAN.md` §1-4 (contexto + decisiones locked + cleanup list)
2. `.plans/GENTLE-AI-RESEARCH.md` §CLI commands + §Settings injection (para sintaxis real
   de gentle-ai install args)
3. `templates/mcp/claude.template.json` y `opencode.template.json` (para entender
   estructura MCP per-agent)
4. `cli/update-template.js` actual (para entender baseline del updater)

## Reglas
- READ-ONLY excepto crear `.plans/FASE-15-DESIGN.md`
- NO codear nada todavía. Solo decisiones + outline.
- Lengua: español (consistente con HANDOFF y MASTER-PLAN)
- Sin AI attribution, sin "ported from..."

## Output format del doc
Para CADA decisión (8): título, opciones consideradas, decisión + razón en 1-2 líneas.
Después un outline:
"Flow del installer (numerado)" — Step 1: detect gentle-ai, Step 2: choose agent, etc.
Cada step con qué pregunta hace al user, qué hace si responde X o Y, qué escribe a disco.

## Reporte
- Path doc creado
- Decisiones cerradas (8 bullets de 1 línea)
- Outline en bullets (no copiar el doc entero)
- Blockers si los hubo
```

### Briefing Phase B — Subagent B1 (install.ts)

```
Tarea: implementar `cli/install.ts` (TypeScript + bun) según el design en
`.plans/FASE-15-DESIGN.md`. Repo destino: ai-driven-project-starter rama skills-migration.

## Inputs (leer en orden)
1. `.plans/FASE-15-DESIGN.md` (autoritativo — ése es tu spec)
2. `.plans/FASE-15-PLAN.md` §3 (skills exactas a instalar)
3. `.plans/GENTLE-AI-RESEARCH.md` §CLI commands (sintaxis de gentle-ai install)
4. `templates/mcp/claude.template.json` y `opencode.template.json` (base para MCP config)
5. `cli/update-template.js` (estilo + patterns existentes)

## Goal
Crear `cli/install.ts` que implementa el flow del design doc. TypeScript estricto.
Interactivo via `@inquirer/prompts`. Idempotente. NO ejecuta nada destructivo sin confirm.

## Pieces
- Detector de gentle-ai (presence + version)
- Detector de agente (Claude Code y/o OpenCode)
- Loop de install per-skill via `gentle-ai install --skill X --agent Y`
- Verificador de CLIs externos (vercel, supabase, acli, playwright, resend) — solo verifica
  + muestra comando de instalación oficial si falta. NO instala automáticamente.
- Configurador interactivo de MCPs (4 canónicos: tavily, context7, supabase, n8n) —
  pide API keys, escribe `.mcp.json` con valores reales o `${PLACEHOLDER}` si user skipea
- Output final: `.mcp.json` + `.agents/install-state.json` (timestamp, skills installed,
  agente elegido) + mensaje de cierre con next steps

## Reglas
- TypeScript strict mode
- Sin `&&` en bash subprocess
- NO ejecutar `gentle-ai install` sin confirm del user (cada skill = 1 confirm o 1 batch
  confirm — vos decidís según UX)
- Mensajes user-facing en INGLÉS (consistente con D2)
- Code comments mínimos (regla CLAUDE.md global)
- Sin `console.log` directo — usá un mini logger consistente
- `package.json` script: agregar `"install": "bun cli/install.ts"` (verificar que no
  conflicte con `npm install` que usa la misma key — si lo hace, renombrar a
  `setup` o `install:project`)

## Reporte
- Path archivo creado + line count
- Funciones principales (lista corta)
- Smoke test mental: "qué pasa si user corre el script en repo con .agents/install-state.json
  ya existente" — describir comportamiento (idempotencia)
```

### Briefing Phase B — Subagent B2 (update-boilerplate.ts)

```
Tarea: renombrar y migrar `cli/update-template.js` → `cli/update-boilerplate.ts`. Repo:
ai-driven-project-starter rama skills-migration.

## Goal
1. `git mv cli/update-template.js cli/update-boilerplate.ts` (preserva history)
2. Migrar a TypeScript estricto
3. Mantener funcionalidad core (sync from upstream sin git history)
4. Agregar capacidad de actualizar `templates/mcp/{agent}.template.json` para el agente
   que el user elija (D12 — templates user-managed pero updater opcional)
5. Update `package.json`: script `up` → `bun cli/update-boilerplate.ts`

## Inputs
1. `cli/update-template.js` (source)
2. `package.json` (verificar script `up`)
3. `templates/mcp/` (entender estructura per-agente)

## Reglas
- TypeScript strict
- NO romper `bun run up` (debe seguir funcionando exactamente igual)
- Code comments mínimos
- Sin AI attribution

## Reporte
- Path archivo creado
- Diff conceptual JS→TS (qué cambió aparte de tipos)
- Verificación que `bun run up --help` (o equivalente) sigue funcionando
- Update a package.json
```

### Briefing Phase B — Subagent B3 (docs + cleanup MCPs)

```
Tarea: crear docs de integración + rehacer `.mcp.example.json` + actualizar AGENTS.md.
Repo: ai-driven-project-starter rama skills-migration.

## Goal
3 piezas:

### A. Crear `docs/setup/integrating-gentle-ai.md`
Doc humano que explica la relación gentle-ai ↔ este repo. Secciones:
1. Qué es gentle-ai y por qué este repo lo usa como base global
2. Qué se instala via gentle-ai (las 15 skills + engram + SDD)
3. Qué se queda local (workflow skills propias del repo)
4. **Hand-off matrix `/sprint-dev` ↔ `/sdd-*`** (tabla — ver `.plans/FASE-15-PLAN.md` §6)
5. Troubleshooting (gentle-ai no detectado, MCPs no funcionan, etc.)
6. Cómo opt-out de gentle-ai (y qué se pierde)

### B. Rehacer `.mcp.example.json`
Borrar el actual. Crear nuevo con SOLO 4 MCPs canónicos (D13):
- tavily
- context7
- supabase
- n8n

Sintaxis: ver `.mcp.example.json` actual como referencia de formato (env vars
con `${VAR_NAME}` interpolation). Para n8n MCP: investigar paquete oficial (probable
`@n8n/mcp-server` o similar — verificar con web search rápido).

### C. Update AGENTS.md
- Sección "MCPs Available" → lista solo los 4 canónicos
- Sección "Skills (Claude Code)" → las 3 borrowed (judgment-day, cognitive-doc-design,
  comment-writer) marcarlas como "instaladas via gentle-ai (user-level)"
- Agregar sección nueva "Onboarding" con summary del installer + link a
  `docs/setup/integrating-gentle-ai.md`

## Inputs
1. `.plans/FASE-15-PLAN.md` (contexto + decisions)
2. `.plans/GENTLE-AI-RESEARCH.md` (para hand-off matrix bien fundada)
3. AGENTS.md current
4. `.mcp.example.json` current

## Reglas
- Lengua: INGLÉS (D2)
- Sin AI attribution
- Doc scannable (usar tablas + headings claros — invocá la skill `cognitive-doc-design`
  de gentle-ai si está disponible)

## Reporte
- 3 archivos modificados/creados
- Highlights de cada uno
```

### Briefing Phase C — Migración + skill propia

```
Tarea: borrar 3 skills borrowed locales + actualizar settings + crear /agentic-dev-onboard
nueva skill propia. Repo: ai-driven-project-starter rama skills-migration.

## Goal

### Borrar
1. `git rm -r .claude/skills/judgment-day`
2. `git rm -r .claude/skills/cognitive-doc-design`
3. `git rm -r .claude/skills/comment-writer`

### Update
- `.claude/settings.json`: sacar `Skill(judgment-day)`, `Skill(cognitive-doc-design)`,
  `Skill(comment-writer)`
- Grep en repo por refs huérfanas a esas 3 skills (excluir `.plans/`):
  `grep -rln "judgment-day\|cognitive-doc-design\|comment-writer" \
   --exclude-dir=.git --exclude-dir=node_modules --exclude-dir=.plans`
- Reportar refs encontradas + arreglarlas (cada caso decidir: actualizar a "instalada via
  gentle-ai" o eliminar la mención)

### Crear
Nueva skill `/agentic-dev-onboard` usando la skill `skill-creator` (oficial Anthropic,
user-level). Invocá `Skill skill-creator` con args:
- Nombre: `agentic-dev-onboard`
- Tipo: workflow / utility
- Phase tag: `bootstrap`
- Compatibility: `[claude-code, opencode]` (D14)
- Description: 2-3 líneas con triggers + "Do NOT use for..."
  - Triggers sugeridos: "onboard me", "explain this repo", "first time using this",
    "/agentic-dev-onboard", "primer vez en este repo"
  - Do NOT use for: feature implementation (use /sprint-dev), test design (use
    /unit-testing)
- Body: walkthrough paso a paso. Menciona stack (Next.js + Supabase), Jira workflow
  (Ready For Dev → In Progress → In Review → Ready For QA), cuándo usar `/sprint-dev` vs
  `/sdd-*` (hand-off matrix), MCPs disponibles (tavily/context7/supabase/n8n), env vars
  críticas, link a `docs/setup/integrating-gentle-ai.md`

## Inputs
1. `.plans/FASE-15-PLAN.md` (contexto)
2. AGENTS.md (para entender el flujo del repo que la skill explica)
3. `docs/setup/integrating-gentle-ai.md` (recién creado en Phase B3 — para alinear
   referencias)
4. `.claude/skills/init-project/SKILL.md` (estilo/frontmatter de referencia)

## Reglas
- Lengua: INGLÉS para SKILL.md
- Sin AI attribution
- SKILL.md ≤500 líneas
- Frontmatter YAML válido
- Crear `evals/evals.json` con 5-8 test cases (positivos + negativos)

## Reporte
- 3 directorios borrados (confirmar git status muestra deletes)
- Settings.json actualizado (3 entries removed)
- Refs huérfanas encontradas + cómo las arreglaste (lista)
- Skill `/agentic-dev-onboard` creada (path + line count + frontmatter description)
```

### Briefing Phase D — Verify + cierre

```
Tarea: verificar Fase 15 está completa + actualizar docs de cierre. Repo:
ai-driven-project-starter rama skills-migration.

## Goal
1. Smoke test del installer
2. Regenerar skill-registry
3. Update AGENTS.md sección Onboarding
4. Update HANDOFF.md con cierre Fase 15
5. Confirmar checklist `.plans/FASE-15-PLAN.md` §9

## Tareas

### A. Smoke test
- Crear repo dummy: `mktemp -d` → asignar a $TMPDIR
- Copy del repo current ahí: `cp -r /home/sai/Desktop/upex/web-apps/ai-driven-project-starter
  $TMPDIR/test-install`
- `cd $TMPDIR/test-install && bun cli/install.ts` (o el script name final)
- Verificar:
  - Pide preguntas user-facing
  - No rompe (sin errores TS o runtime)
  - Escribe `.mcp.json` válido (probar con `jq . .mcp.json`)
  - Escribe `.agents/install-state.json`
- Reportar pass/fail
- Borrar el dummy: `rm -rf $TMPDIR/test-install`

### B. Regenerar skill registry
`bun scripts/build-skill-registry.ts` — debe escribir/actualizar
`.context/skill-registry.md`. Verificar que no aparecen las 3 skills borradas.

### C. Update AGENTS.md sección Onboarding
Si Phase B3 ya la creó, verificar que está bien. Si no, agregarla:
"## Onboarding — primera vez en este repo: corré `bun cli/install.ts` (o script name
final). Lee `docs/setup/integrating-gentle-ai.md` para entender qué se instala."

### D. Update HANDOFF.md
Append final con:
- Commits de Fase 15 (lista con hashes)
- Estado final del repo (skills count, commands count, lint baseline)
- Items que quedan: Fase 13 (push), L7, D3, D6 (los que sigan deferidos)
- Mensaje de cierre: "Fase 15 cerrada en commit X. Próxima sesión: opcionalmente Fase 13
  cuando user lo decida."

### E. Verificación final
- `bun run lint:agents 2>&1 | tail -5` → debe dar 7 errors + 5 warnings
- `bun run type-check` → reportar (probable 1 error preexistente en cli/sync-openapi.ts)
- `git log --oneline main..skills-migration | head -20` → mostrar últimos commits Fase 15
- `git status` → debe estar clean (todo committeado)

## Reglas
- READ + Edit. NO crear archivos nuevos en este phase salvo el HANDOFF append.
- NO push.
- Lengua: español para HANDOFF append (consistente con resto del HANDOFF), inglés
  para AGENTS.md.

## Reporte
- Smoke test result
- Skill registry regenerado: ✓/✗
- AGENTS.md sección Onboarding: ✓/✗
- HANDOFF.md actualizado: ✓ + summary de lo que agregaste
- Checklist Fase 15 §9 — confirmar cada item ✓ o reportar el faltante
- Commit recomendado al orquestador con todos estos cambios
```

---

## Cierre

Cuando todos los checks de §9 pasan, Fase 15 está completa. El orquestador hace 1 commit final por phase (no consolidado) y reporta al user con summary breve. Después decide con el user si arrancar Fase 13 (push) o cerrar sesión.

**No olvides**: NO push sin confirm explícito del user.

---

**Fecha del plan**: 2026-05-09
**Última base commit**: `4fd84d2`
**Próxima IA**: leé este doc + `FASE-15-PROMPT.md` + HANDOFF.md y arrancá.
