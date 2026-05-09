# Skills Migration — Handoff Context

> **Para la próxima IA**: este doc te pone al día sin necesidad de leer todo el historial. Contiene estado actual, decisiones locked, convenciones, gotchas descubiertos, y referencias a archivos clave para deep-dive.

---

## TL;DR (lee esto primero)

Este repo era `ai-driven-project-starter` con 14 fases de prompts mezclando dev y QA. Lo refactoreamos a un boilerplate **dev-only basado en Claude Code skills**, listo para pushearse como `agentic-dev-boilerplate` (push aún no hecho — diferido por decisión del user).

**Estado**: rama `skills-migration` con 12 commits. 10 skills workflow + 5 reusable + 5 slash commands. Migración base + 9 borrows de gentle-ai aplicados. Lint/format clean.

**Lo que falta**: push al nuevo origin (esperando decisión del user) + Fase 15 futura (super-installer + onboarding para integrar con gentle-ai).

**Plan maestro**: `.plans/MASTER-PLAN.md` (lectura completa si querés contexto profundo).

---

## Quick navigation

| Sección                                                  | Cuándo leer                                                 |
| -------------------------------------------------------- | ----------------------------------------------------------- |
| [Estado actual](#estado-actual)                          | Para saber dónde estamos                                    |
| [Lo hecho](#lo-hecho-fases-1-14)                         | Para ver qué cubrió cada fase                               |
| [Lo pendiente](#lo-pendiente)                            | Para saber qué viene                                        |
| [Decisiones locked](#decisiones-locked-del-user)         | ANTES de proponer cambios — el user ya decidió varias cosas |
| [Convenciones](#convenciones-establecidas)               | Para mantener consistencia                                  |
| [Gotchas](#gotchas--descubrimientos)                     | Para evitar trampas que ya nos pasaron                      |
| [Cómo continuar](#cómo-continuar-tips-operativos)        | Para arrancar a trabajar                                    |
| [Archivos clave](#archivos-clave-para-deep-dive)         | Cuando necesites contexto específico                        |
| [Memorias auto-loaded](#memorias-relevantes-auto-loaded) | Las preferencias del user que ya están guardadas            |

---

## Estado actual

**Branch**: `skills-migration` en `/home/sai/Desktop/upex/web-apps/ai-driven-project-starter/`
**Origin**: `https://github.com/upex-galaxy/ai-driven-project-starter.git` (no se modificó)
**Último commit**: `ed1e041 feat(skills): Fase 14 — 9 borrows from gentle-ai`
**Métricas vs main**: 279 archivos, +20,695 / -70,575 líneas

**Skills activas (10 workflow + 5 reusable)**:

| Slug                                          | Tipo               | Phase tag      | Trigger principal                                                 |
| --------------------------------------------- | ------------------ | -------------- | ----------------------------------------------------------------- |
| `init-project`                                | workflow           | bootstrap      | "/init-project", "initialize the project"                         |
| `project-foundation`                          | workflow           | foundation     | "definir el PRD", "constituir el proyecto"                        |
| `project-bootstrap`                           | workflow           | foundation     | "scaffolding del proyecto", "setup backend"                       |
| `product-management`                          | workflow           | management     | "crear épica", "refinar AC", "3 amigos"                           |
| `sprint-dev`                                  | workflow           | implementation | "implementar story", "sprint-dev", per-story dev loop             |
| `unit-testing`                                | workflow           | implementation | "TDD this", "write unit tests", composable c/sprint-dev           |
| `chained-pr`                                  | workflow           | planning       | auto-trigger desde sprint-dev cuando workload-forecast risk=High  |
| `judgment-day`                                | workflow           | review         | "doble review", "que lo juzguen", auto-trigger en paths sensibles |
| `cognitive-doc-design`                        | utility            | implementation | "make this doc scannable", "reduce cognitive load"                |
| `comment-writer`                              | utility            | implementation | "review comment", "redactar respuesta"                            |
| `frontend-design`, `next-*`, `playwright-cli` | reusable knowledge | varias         | (preservadas tal cual eran, son symlinks a `.agents/skills/`)     |

**Slash commands (5)**: `/git-flow`, `/fix-git-conflict`, `/project-doc-setup`, `/context-engineering-setup`, `/sprint-report` (en `.claude/commands/`)

---

## Lo hecho (Fases 1-14)

| Fase | Commit      | Qué hizo                                                                                                                                                                                                                                                                                                                     |
| ---- | ----------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1    | (no commit) | Crear branch, scaffolding `.claude/skills/{6 slugs}/`, copiar plan a `.plans/MASTER-PLAN.md`                                                                                                                                                                                                                                 |
| 2    | `15548c1`   | Port `framework-core` del repo hermano (`agentic-qa-boilerplate`) como `init-project` skill, con poda QA                                                                                                                                                                                                                     |
| 3    | `b6b6b99`   | Eliminar 23 paths de scope testing (.prompts/fase-5/10/11/12/14, QA/TAE guidelines, xray-cli skill, etc.)                                                                                                                                                                                                                    |
| 4    | `a292b26`   | Build `project-foundation` (13 refs) + `project-bootstrap` (7 refs)                                                                                                                                                                                                                                                          |
| 5    | `61740ae`   | Build `product-management` (6 refs incluyendo extracción quirúrgica AC de fase-5) + retire fase-5 sources                                                                                                                                                                                                                    |
| 6    | `06a12a5`   | Build `sprint-dev` mega-orquestador (18 refs, fases 6+7+8+9+13)                                                                                                                                                                                                                                                              |
| 7    | `2018502`   | Build `unit-testing` (5 refs, TDD-composable)                                                                                                                                                                                                                                                                                |
| 8    | `39e8c5f`   | Build 5 slash commands (git-flow, git-conflict-fix, project-doc-setup, context-engineering-setup, sprint-report)                                                                                                                                                                                                             |
| 9    | `76d2a69`   | Adaptar `.agents/` (poda jira-required.yaml, clear jira.json, update lint scan roots)                                                                                                                                                                                                                                        |
| 10   | `a612b24`   | Reescribir CLAUDE.md (-91 líneas, dev-only, Future Hooks section)                                                                                                                                                                                                                                                            |
| 11   | `57d5279`   | Evals (3-7 test cases por skill, 6 skills × evals.json)                                                                                                                                                                                                                                                                      |
| 12   | `ab04381`   | Cleanup polish: 102 paths borrados (.prompts entero, .context/guidelines/DEV, docs/testing, .books/fase-{5,10,11,12,14}-\*)                                                                                                                                                                                                  |
| 14   | `ed1e041`   | 9 borrows from gentle-ai: 4 nuevas skills (chained-pr, judgment-day, cognitive-doc-design, comment-writer), 3 scripts (detect-testing-capabilities, build-skill-registry, engram-bridge), Workload Forecast + Compliance Matrix + model_preferences metadata + Skill Resolver + Topic_key conventions + Delta Specs OPCIONAL |

Fase 13 (push) **NO se ejecutó** — el user decidió no pushear todavía.

---

## Lo pendiente

### Fase 13: Push a `agentic-dev-boilerplate` (DEFERIDO indefinidamente)

El user decidió no pushear en este ciclo. Cuando lo decida:

1. Crear repo `agentic-dev-boilerplate` en GitHub (acción humana)
2. `git remote add agentic-dev <url>`
3. `git push agentic-dev skills-migration:main`

NO pushear sin confirmación explícita.

### Fase 15 (FUTURO): Super-installer + onboarding gentle-ai

Out of scope del ciclo actual. Cuando se reabra:

- `docs/setup/integrating-gentle-ai.md` — cómo combinar este repo con gentle-ai
- `scripts/setup-gentle-ai.ts` — instalador minimal (solo engram + sdd skills + sdd commands + sdd agents; SIN Gentleman persona, SIN GGA, SIN bypassPermissions)
- Hand-off matrix: cuándo usar `/sprint-dev` vs delegar a `/sdd-*` para change-rigorous

---

## Decisiones locked del user

> ⚠️ Estas decisiones ya las tomó el user. NO las re-discutas; aplicalas.

### Sobre el scope (qué entró, qué quedó fuera)

- **3 grupos de scope**: Baseline (one-time técnico) ≠ Project Management (continuo producto) ≠ Software Development (per-story técnico). NO conflar Baseline con PM.
- **Mega-skill orchestrator pattern preferido** para workflow loops (sprint-dev cubre fases 6-9+13). NO uno-skill-por-fase.
- **Testing OUT of scope**: todas las fases QA (5/10/11/12/14), guidelines QA/TAE/TMS, xray-cli, .books/fase-\*-testing — al sister repo `agentic-qa-boilerplate`.

### Sobre gentle-ai (Fase 14)

Adoptados (Tier 1 + Tier 2):

- ✅ Testing-capabilities cache + Strict TDD detection
- ✅ Workload Forecast + 400-line gate + chained-pr skill
- ✅ Compact Rules + Skill Resolver protocol
- ✅ Topic_key conventions + Engram bridge HÍBRIDO (engram opcional)
- ✅ Delta specs como pattern OPCIONAL (default: in-place AC editing)
- ✅ Spec Compliance Matrix HÍBRIDA (any evidence type counts)
- ✅ Per-phase model preferences (advisory metadata)
- ✅ judgment-day skill
- ✅ cognitive-doc-design + comment-writer skills

Descartados:

- ❌ Engram binary as hard dep — el user ya lo tiene instalado aparte, lo usa standalone, NO lo acoplamos al repo
- ❌ GGA provider switcher — somos Claude Code-only
- ❌ Multi-agent matrix de 12 agentes — Claude Code-only
- ❌ Gentleman persona + bypassPermissions — el user no quiere persona impuesta
- ❌ skill-creator de gentle-ai — ya tenemos uno

### Sobre el modo de trabajo

- **Orquestación pura** para trabajos sustanciales: hilo principal NO ejecuta, despacha subagentes (`Explore` para auditorías, `Plan` para diseño, `general-purpose` para implementación).
- **Cada commit = una fase** (con mensaje descriptivo, sin AI attribution).
- **NO push sin confirmación explícita** del user.
- **NO `--no-verify`**: si el pre-commit hook falla, fixear el problema, no bypassearlo.

---

## Convenciones establecidas

### Frontmatter SKILL.md (10 skills siguen este formato)

```yaml
---
name: <slug>                 # debe coincidir EXACTO con el nombre del directorio
description: "<2-3 líneas. Triggers explícitos al final + 'Do NOT use for: <delimitación>'"
license: MIT
compatibility: [claude-code, copilot, cursor, codex, opencode]
phase: <foundation|management|implementation|review|bootstrap|planning>
---

<!-- Model preferences (advisory; dispatchers may use to route) -->
<!--
model_preferences:
  foundation: opus
  planning: sonnet
  implementation: sonnet
  review: opus
  archive: haiku
-->
```

El bloque `model_preferences` es **HTML comment con YAML adentro**: invisible para markdown render, parseable por tools que grep `^model_preferences:`. Idéntico en todas las skills (no per-skill customization para mantener grep contract limpio).

### Topic_key convention (artifacts en .context/PBI/)

- Format: `pbi/{ticket}/{artifact}` — ej. `pbi/UPEX-123/spec`, `pbi/UPEX-123/test-report`, `pbi/UPEX-123/compliance-matrix`
- UPSERT semantics (mismo key → overwrite; usá git para history)
- 2-step retrieval: search → fetch full content
- `capture_prompt: false` para auto-generated artifacts; `true` (default) para human-prompted decisions
- File-first storage: `.context/PBI/{ticket}/{artifact}.md`. Si engram está instalado, `scripts/engram-bridge.ts` puede mirror.

### Briefing template para subagentes (init-project/references/briefing-template.md)

7 componentes obligatorios:

1. Goal (1 frase)
2. Context docs (qué leer primero)
3. **Project Standards (auto-resolved)** ← NUEVO en Fase 14: pegar compact rules de skills relevantes desde `.context/skill-registry.md`
4. Skills/MCPs to load
5. Exact instructions (numeradas, no metas vagas)
6. Report format
7. Rules (Critical Rules relevantes)

### Strict TDD priority chain (testing-capabilities cache)

1. CLAUDE.md marker `<!-- strict_tdd: true -->` o `false` (override explícito del user)
2. `.agents/project.yaml::testing.strict_tdd` (config declarativo)
3. Fallback: si runner detectado → `true`; si no → `false`

### Workload Forecast (sprint-dev Stage 1)

Bloque obligatorio al final del impl-plan:

```
## Review Workload Forecast
Estimated: <X> additions + <Y> deletions = <Z> total lines
400-line budget risk: Low | Medium | High
Chain strategy: stacked-to-main | feature-branch-chain | size-exception | pending
Decision needed before apply: Yes | No
```

**Gate**: Stage 2 (Implementation) NO arranca si `risk=High` y `chain_strategy=pending` — hand-off a `/chained-pr`.

### Spec Compliance Matrix (sprint-dev Stage 3, HÍBRIDA)

`covered_by` valores válidos:

- `test:<id>` — automated test (cualquier tipo: unit/integration/E2E)
- `manual:<evidence-path>` — manual con evidencia documentada
- `exempt:<reason>` — AC no testeable; razón ESPECÍFICA obligatoria
- `review-approved:<reviewer>` — code review confirmó sin test

Status: `covered` | `manual` | `exempt` | `review-approved` | `uncovered` (BLOCKER de merge si sin justificación).

---

## Gotchas / descubrimientos

> Estas son las trampas reales que nos pasaron. La próxima IA puede ahorrarse repetirlas.

### 1. ESLint `regexp/no-super-linear-backtracking` (lo hemos hecho 2 veces)

Cualquier regex con `\s*(.*?)\s*` o `\s+...\.+` adyacente trippea este lint y bloquea pre-commit. Solución probada (Option A): refactorear a single greedy capture + split en código.

```ts
// MAL (trippea ReDoS):
const m = line.match(/^(\s+)(.+)$/);

// BIEN:
const m = line.match(/^([ \t]+)(\S.+)$/);
// O incluso:
const trimmed = line.trimStart();
```

Archivos donde ya pasó: `scripts/sync-jira-workflows.ts` (Fase 2), `scripts/build-skill-registry.ts` (Fase 14). **Si vas a escribir un script con regex, tenelo en mente desde el principio.**

### 2. Husky pre-commit auto-corrige format pero bloquea eslint

El hook corre `prettier --write` (auto-fix) y `eslint --fix` (auto-fix lo que pueda) sobre staged files. Format-only fallas se auto-resuelven. Pero **errores ESLint sin auto-fix** (como ReDoS) bloquean el commit y revierten el state al stash.

Si el commit falla:

- El working tree puede haberse revertido — verificá con `git status`
- Los errores aparecen en el output del hook, no en logs separados
- Fixeá el error, re-stage los archivos modificados, retry commit

### 3. Symlinks en `.claude/skills/`

Las 5 reusable skills (`frontend-design`, `next-best-practices`, `next-cache-components`, `next-upgrade`, `playwright-cli`) son **symlinks** a `.agents/skills/<name>/`. Las 10 workflow skills (init-project, etc.) son directorios reales.

**Implicación**: cualquier script que escanee `.claude/skills/` debe aceptar symlinks. `Dirent.isDirectory()` retorna `false` para symlinks; usá también `isSymbolicLink()` y verificá que tenga `SKILL.md` adentro. Ya lo manejamos en `scripts/build-skill-registry.ts`.

### 4. Coexistencia con gentle-ai a nivel global

El user instaló gentle-ai a nivel `~/.claude/`. Eso significa:

- Skills SDD (`sdd-init`, `sdd-explore`, etc.) están disponibles a nivel user
- `judgment-day` también está a nivel user (de gentle-ai)
- Nuestro `.claude/skills/judgment-day/` es project-level — **override** al global cuando se trabaja en este repo

**Nuestro repo es self-contained**: proyectos que lo adopten obtienen `judgment-day` aunque no tengan gentle-ai instalado. Es por eso que portamos vs solo referenciar.

### 5. CLAUDE.md global tiene markers de gentle-ai

Cuando el user instaló gentle-ai, el installer reescribió `~/.claude/CLAUDE.md` (global, no project-specific) inyectando bloques marcados `<!-- gentle-ai:engram-protocol -->` y `<!-- gentle-ai:sdd-orchestrator -->`. Es inocuo si lo entendés. NO toques esos bloques (gentle-ai los gestiona).

El `CLAUDE.md` PROJECT-level (en `/home/sai/Desktop/upex/web-apps/ai-driven-project-starter/CLAUDE.md`) NO tiene esos markers — ese lo controlamos nosotros.

### 6. lint:agents allowlist para auto-generated content

Cuando agregás contenido auto-generado que copia documentación literal (como `.context/skill-registry.md` que copia bullets de SKILL.md), el linter de `{{VAR}}` references puede flaggear los `{{...}}` literales como "undeclared variable".

Solución: agregar entrada al `DOC_META_ALLOWLIST` en `scripts/agents-lint.ts` con file path + tokens permitidos. Ya lo hicimos para skill-registry.md.

### 7. Pre-existing lint warnings (NO los toques)

`bun run lint:agents` reporta:

- **7 errors en AGENTS.md** — son `{{VAR}}`, `{{VARIABLE}}`, `{{VAR_NAME}}` etc. usados como placeholders documentando la sintaxis. Son intencionales. Quedaron desde antes de la migración. NO los "fixees".
- **5 warnings DECLARED_BUT_UNUSED** — son `BACKEND_REPO`, `BACKEND_ENTRY`, `FRONTEND_REPO`, `FRONTEND_ENTRY`, `DEFAULT_ENV` en `project.yaml`. Son template scaffolding para downstream projects. NO los purgues.

`bun run lint` (ESLint sobre TS) reporta **35 errors pre-existentes** en `.agents/jira-required.yaml` y otros configs. Heredados desde main. NO son responsabilidad de la migración.

### 8. Husky lint-staged + format:check

`bun run format:check` puede reportar archivos sin formatear, PERO si los staging y commiteás, el husky hook corre `prettier --write` automáticamente. Resultado: el commit pasa con format aplicado en flight. NO necesitás correr `bun run format` manualmente antes de cada commit.

EXCEPCIÓN: si tenés cambios sin staging, esos no se auto-formatean. Stagealos primero.

### 9. Engram convention: `capture_prompt` semantic

Default `capture_prompt: true` (asume contexto humano del prompt).
**Set `capture_prompt: false`** para artifacts auto-generados:

- SDD artifacts (proposal/spec/design/tasks/apply/verify/archive)
- Testing-capabilities cache
- Skill registry output
- Compliance matrix
- Workload forecast block

Razón: el "prompt" del save no representa una decisión humana, es output mecánico de un pipeline.

### 10. AGENTS.md debe ser mirror de CLAUDE.md

`AGENTS.md` y `CLAUDE.md` son contenido idéntico (project-level). Algunos plataformas usan AGENTS.md, otras CLAUDE.md. Mantenelos sincronizados. Si modificás uno, modificá el otro.

En la migración Fase 12 reemplazamos AGENTS.md wholesale con copia de CLAUDE.md después del rewrite. Si vas a editar la project memory, hacelo en CLAUDE.md primero, luego copiá a AGENTS.md.

### 11. `.context/skill-registry.md` se regenera, no se edita a mano

Si lo ves en el diff, probablemente se regeneró por correr `bun scripts/build-skill-registry.ts`. NO lo edites a mano — sus cambios se sobreescriben en el siguiente run. Si querés tunear el contenido, edita `scripts/build-skill-registry.ts` (lógica de extraction) o agrega un `## Compact Rules` explícito al SKILL.md correspondiente (Strategy A).

### 12. Numbering quirk: Fase 14 ejecuta ANTES de Fase 13

El plan tiene Fase 13 (push) y Fase 14 (gentle-ai borrows). **Ejecutamos 14 antes de 13** porque agregamos las mejoras antes del push final. Después el user diferió el push indefinidamente. La numeración refleja el orden de DESCUBRIMIENTO, no de ejecución.

### 13. El Agent tool puede morir transient

Una vez (Fase 14 Track 5.1) el Agent tool retornó `Tool result missing due to internal error` y el subagente murió sin reportar. Verificá `git status` — si el working tree está limpio, no hizo cambios; re-dispatch con el mismo briefing. Si hizo cambios parciales, decidí entre rollback y completar manualmente.

---

## Cómo continuar (tips operativos)

### Antes de empezar a trabajar

1. **Leé este doc completo** (sí, todo). Es lo que reemplaza el contexto perdido.
2. **Leé `.plans/MASTER-PLAN.md`** si necesitás el detalle del scope.
3. **`git log --oneline main..skills-migration`** para ver los 12 commits de la migración.
4. **`bun run lint:agents`** para confirmar el baseline (debe dar 7 errors AGENTS.md + 5 warnings unused vars; si da más, algo cambió).

### Modo de trabajo (orquestación pura — el user lo pidió explícitamente)

- **Para trabajos sustanciales** (>3 archivos / >100 líneas / múltiples sub-tareas): despachar subagentes.
- **Para trivialidades**: ejecutá inline.
- **Briefing format obligatorio**: ver `.claude/skills/init-project/references/briefing-template.md`.

### Tipos de subagente y cuándo usar cada uno

| Tipo              | Cuándo                                                                                              |
| ----------------- | --------------------------------------------------------------------------------------------------- |
| `Explore`         | Auditorías read-only, mapeo de archivos, audit de QA-leakage, lectura de gentle-ai source en GitHub |
| `Plan`            | Diseño de outline / arquitectura / decisiones intermedias antes de implementar                      |
| `general-purpose` | Implementación (Write/Edit/Bash) — el caballo de batalla                                            |

### Reglas duras

- **NUNCA chain bash con `&&`, `;`, `\|`** — viola CLAUDE.md global del user. Cada comando en Bash separado.
- **NO `git add -A`** — usá paths específicos.
- **NO `--no-verify` en commits** — fixeá el problema underlying.
- **NO push** sin confirmación user.
- **NO AI attribution** en commits ("Generated with...", "Co-Authored-By: Claude" — NO).

### Cadence de commits

Una commit por fase / sub-track grande, con mensaje descriptivo (puede ser largo). Pre-commit hook auto-formatea.

### Cuándo PARAR y preguntar al user

- Si una decisión es ambigua y el plan no la cubre
- Si una "fix" requeriría una decisión arquitectónica
- Antes de cualquier `git push`, `git remote add`, force operations
- Si un subagente reporta blockers que no podés resolver

---

## Archivos clave para deep-dive

> Si necesitás más detalle de algo, abrí estos archivos.

### Plan & docs

| Archivo                 | Qué encontrarás                                                                             |
| ----------------------- | ------------------------------------------------------------------------------------------- |
| `.plans/MASTER-PLAN.md` | Plan ejecutivo completo. Fases 1-14 con dispatch strategy, scope, riesgos, verification     |
| `.plans/HANDOFF.md`     | (este doc)                                                                                  |
| `CLAUDE.md`             | Project memory cargada cada sesión. Quick start, critical rules, skills table, future hooks |
| `AGENTS.md`             | Mirror de CLAUDE.md                                                                         |
| `README.md`             | Descripción del repo dev-only                                                               |

### Skills core (orquestación)

| Archivo                                                            | Qué encontrarás                                                      |
| ------------------------------------------------------------------ | -------------------------------------------------------------------- |
| `.claude/skills/init-project/SKILL.md`                             | Bootstrap doctrine, init order, briefing template, dispatch patterns |
| `.claude/skills/init-project/references/briefing-template.md`      | Formato obligatorio para briefings de subagentes (7 componentes)     |
| `.claude/skills/init-project/references/dispatch-patterns.md`      | Tabla decisión Single/Sequential/Parallel/Background                 |
| `.claude/skills/init-project/references/orchestration-doctrine.md` | Reglas de orquestación, error protocol                               |
| `.claude/skills/init-project/references/skill-resolver.md`         | Compact Rules protocol (Fase 14)                                     |
| `.claude/skills/init-project/references/topic-key-conventions.md`  | Persistence keys + UPSERT + 2-step retrieval                         |
| `.claude/skills/init-project/references/testing-capabilities.md`   | Cache schema + Strict TDD priority chain                             |
| `.claude/skills/init-project/references/model-routing.md`          | model_preferences advisory convention                                |

### Skills workflow (mega-orquestadores)

| Archivo                                                          | Qué encontrarás                                                                        |
| ---------------------------------------------------------------- | -------------------------------------------------------------------------------------- |
| `.claude/skills/sprint-dev/SKILL.md`                             | 12-step dev loop. 5 stages. Workload forecast en Stage 1, Compliance Matrix en Stage 3 |
| `.claude/skills/sprint-dev/references/workload-forecast.md`      | Algoritmo + risk thresholds + 400-line gate                                            |
| `.claude/skills/sprint-dev/references/spec-compliance-matrix.md` | Matrix HÍBRIDA: any evidence type counts                                               |
| `.claude/skills/product-management/SKILL.md`                     | Workflows A-F (backlog, add-feature, epic, story refinement, AC, edge cases)           |
| `.claude/skills/product-management/references/delta-specs.md`    | Pattern OPCIONAL ADDED/MODIFIED/REMOVED + RFC 2119 + Gherkin                           |

### Scripts útiles

| Archivo                                  | Qué hace                                                                      |
| ---------------------------------------- | ----------------------------------------------------------------------------- |
| `scripts/agents-lint.ts`                 | Valida `{{VAR}}` y `{{jira.*}}` references; tiene allowlist para doc-meta     |
| `scripts/agents-setup.ts`                | Wizard interactivo para llenar `.agents/project.yaml`                         |
| `scripts/sync-jira-fields.ts`            | Descubre custom fields Jira → `.agents/jira.json`                             |
| `scripts/sync-jira-workflows.ts`         | Sincroniza workflows + statuses Jira                                          |
| `scripts/check-jira-setup.ts`            | Valida `jira-required.yaml` vs `jira.json`                                    |
| `scripts/detect-testing-capabilities.ts` | Detecta runner/coverage/lint/typecheck → `.context/testing-capabilities.json` |
| `scripts/build-skill-registry.ts`        | Escanea `.claude/skills/`, emite `.context/skill-registry.md`                 |
| `scripts/engram-bridge.ts`               | Bridge a engram binary si instalado; no-op si absent                          |

### `.agents/` config

| Archivo                      | Qué                                                             |
| ---------------------------- | --------------------------------------------------------------- |
| `.agents/README.md`          | Contrato completo del sistema de variables (4 sintaxis)         |
| `.agents/project.yaml`       | Template per-proyecto (flat keys + environments)                |
| `.agents/jira-required.yaml` | Manifest de campos Jira; podado de QA-only                      |
| `.agents/jira.json`          | Catálogo placeholder (se regenera por proyecto vía sync-fields) |

### Repo hermano (referencia structural)

`/home/sai/Desktop/upex/web-apps/agentic-qa-boilerplate` — el repo de QA. Estructura SKILL.md parecida. Útil como referencia para patrones, NO copiar contenido (es QA scope).

---

## Memorias relevantes (auto-loaded)

Estas memorias están en `/home/sai/.claude/projects/-home-sai-Desktop-upex-web-apps-ai-driven-project-starter/memory/` y la próxima IA las carga automáticamente. Son las preferencias del user que NO necesitás re-discutir:

| Memoria                                      | Resumen                                                                               |
| -------------------------------------------- | ------------------------------------------------------------------------------------- |
| `feedback_orchestration_mode.md`             | Orquestación pura para migraciones. Hilo principal NO ejecuta.                        |
| `feedback_three_group_categorization.md`     | Baseline ≠ PM ≠ DEV. NO conflar.                                                      |
| `feedback_megaskill_orchestrator_pattern.md` | Mega-skill por workflow loop, NO uno-skill-por-fase.                                  |
| `feedback_copy_directories.md`               | Usá `cp -r` para sync de directorios, no file-by-file.                                |
| `reference_sister_repo.md`                   | agentic-qa-boilerplate es la referencia structural canónica.                          |
| `project_skills_migration.md`                | Estado del proyecto: branch + commits + lo pendiente (push diferido, Fase 15 futura). |

---

## Next steps posibles

Cuando la próxima IA se sume, opciones razonables (en orden de prioridad probable):

1. **El user pide push final**: ejecutar Fase 13 — crear repo en GitHub, agregar remote, push. Confirmar con user antes de cada step.
2. **El user pide Fase 15**: super-installer + onboarding gentle-ai. Out of scope hasta que se reabra.
3. **Refactor menor**: si el user encuentra algo que mejorar en alguna skill, edición quirúrgica vía subagente.
4. **Adición de skill nueva**: usar `/skill-creator` (existe a nivel user); seguir convenciones de este repo (frontmatter, model_preferences metadata, evals.json, eventualmente Strategy A compact rules section).
5. **Test real end-to-end**: invocar `/init-project` en un repo dummy + correr el flujo completo. Smoke test fue light hasta ahora.
6. **Strategy A en SKILL.md bodies**: agregar sección explícita `## Compact Rules` a cada SKILL.md para que `build-skill-registry.ts` use Strategy A en vez de fallback Strategy B. Mejora la calidad del registry.
7. **Per-repo `.context/PBI/` template**: crear placeholders más concretos para los 4 placeholder dirs (PBI/, PRD/, SRS/, idea/) — actualmente solo tienen README.md.

---

## Última cosa: si te perdés

- Re-leé este doc.
- Si no es suficiente, leé `.plans/MASTER-PLAN.md` §13 (Fase 14 detailed spec).
- Si una skill específica te confunde, leé su `SKILL.md` + `references/` (cada skill es self-documenting).
- Si una decisión te parece random, mirá las memorias en `/home/sai/.claude/projects/.../memory/` — el user ya validó preferencias.
- Si hay un blocker no documentado, **PARAR Y PREGUNTAR**. Mejor que improvisar.

**Última actualización**: 2026-05-08, después del commit `96c5fe5` (Fase 15-pre).

---

## Sesión 2026-05-08 — Auditoría comparativa cross-repo + cleanup

> Sesión post-Fase 14. Pre-push (Fase 13 sigue diferida). El user pidió comparar A vs sister repo `agentic-qa-boilerplate` antes de continuar con push o Fase 15.

### Lo entregado en esta sesión (5 commits)

| Commit    | Bloque                                                                                                                                                                        |
| --------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `c916bce` | Audit doc: `.plans/AUDIT-CROSS-REPO-2026-05-08.md` (520 L, 30+ candidates catalogued)                                                                                         |
| `e219a2d` | Quick wins Q1+Q2+Q4 + AB4+AB5: CLAUDE↔AGENTS symlink, agents-lint cleanup (`.prompts/` removed), `.agents/README.md` cleanup, `type-check`/`agents:setup`/`clean` npm scripts |
| `10d0a53` | Bloque 2: AB1 port `commit-push-pr.md`, AB2 port `refresh-ai-memory.md`, D5 rename `git-conflict-fix.md` → `fix-git-conflict.md` (12 ref updates)                             |
| `374d2a3` | Bloque 3: S5 jira-setup-guide.md ES → EN (port from B)                                                                                                                        |
| `96c5fe5` | Bloque 4: AB3 port `acli` skill (8 files, 2262 insertions; DEV-adapted)                                                                                                       |

### Audit corrections (no eran reales)

- **Q3/L4**: `scripts/jira-sync.ts` SÍ existe — `jira:sync` npm script no es referencia rota.
- **Q5/L2**: `.context/guidelines/DEV/` ya no existe — fue borrado en cleanup previo.
- **Bonus encontrado**: `scripts/agents-lint.ts:47` SCAN_ROOTS todavía listaba `.prompts` (legacy). Limpiado en commit `e219a2d`.

### Decisiones D1-D7 tomadas

| ID  | Decisión                                                                            | Aplicada?             |
| --- | ----------------------------------------------------------------------------------- | --------------------- |
| D1  | Mantener `init-project` (A) y `framework-core` (B) divergentes — naming por dominio | NO-OP                 |
| D2  | Inglés canónico para docs/skills/commands                                           | Aplicada parcial (S5) |
| D3  | `.context/` migra a `mapping/+reports/` — **DEFER**                                 | Defer                 |
| D4  | `.books/` se queda en A                                                             | NO-OP                 |
| D5  | Naming verbo-primero (`fix-git-conflict`)                                           | Aplicada              |
| D6  | `cli/` → `scripts/` migración — **DEFER** (toca infra)                              | Defer                 |
| D7  | `build-skill-registry` on-demand                                                    | NO-OP                 |

### Items DEFERIDOS para sesiones futuras (con razón)

| #          | Item                                                                                                                                                                      | Razón defer                                                                                                                                                                                       |
| ---------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| AB7        | "Customization Guide" section en CLAUDE.md                                                                                                                                | Cubierto por `/refresh-ai-memory` bootstrap template (recién portado)                                                                                                                             |
| L3         | `.context/idea/` legacy — mantener                                                                                                                                        | Decisión D-style; contenido narrativo válido                                                                                                                                                      |
| L7 (NUEVO) | `docs/setup/mcp-dbhub.md` y `mcp-openapi.md` tienen contenido QA-flavored heredado (audience "QA Engineers", `qa_automation` SQL user, refs a KATA + `docs/testing/api/`) | Detectado por subagente S6; cleanup útil pero scope separado al sync. Convertir a DEV-flavor: cambiar audience, ejemplos `qa_automation` → `dev_automation`, eliminar refs KATA/docs/testing/api/ |
| D3         | `.context/` arquitectura migration                                                                                                                                        | ADR mayor; requiere alineación + decisión tooling                                                                                                                                                 |
| D6         | `cli/` → `scripts/` migration                                                                                                                                             | Riesgo medio; toca `package.json` 3 scripts (`up`, `api:sync`, `resend`) + 3 archivos. Mejor en commit dedicado                                                                                   |
| S2         | `docs/methodology/early-game-testing.md` divergencia silenciosa                                                                                                           | Investigación reveló: solo paths de links difieren (A: `./file.md`, B: `docs/methodology/file.md`). Contenido 99.5% idéntico. Sync por estilo no urgente                                          |
| S4         | `docs/workflows/environments.md` divergencia silenciosa                                                                                                                   | Misma causa que S2 (paths de links). No urgente                                                                                                                                                   |

### Estado final del repo post-sesión

- 11 workflow skills (10 originales + nueva `acli`) + 5 reusable (symlinks)
- 7 slash commands (5 originales + 2 nuevos: `commit-push-pr`, `refresh-ai-memory`; `git-conflict-fix` renombrado a `fix-git-conflict`)
- CLAUDE.md ahora symlink → AGENTS.md (cero drift)
- 3 npm scripts nuevos (`type-check`, `agents:setup`, `clean`)
- `docs/setup/jira-setup-guide.md` en inglés (D2)
- `scripts/agents-lint.ts` ya no escanea `.prompts/` (legacy ref limpiada)
- `.agents/README.md` actualizado (referencias `prompts` → `skills/commands`)

### Verificaciones baseline mantenidas

- `bun run lint:agents`: 7 errors AGENTS.md placeholders + 5 warnings unused vars (mismo baseline pre-sesión, gotcha #7)
- `bun run type-check`: 1 error TS preexistente en `cli/sync-openapi.ts:116` (heredado de main; no introducido en esta sesión)

### Próximos pasos sugeridos (en orden razonable)

1. **Fase 13 (push)** — diferida indefinidamente. Cuando el user lo decida.
2. **L7 cleanup** — DEV-flavor mcp-dbhub/mcp-openapi (subagente, ~30 min).
3. **D6 migración** — `cli/` → `scripts/` (subagente con cuidado, propio commit).
4. **Fase 15** — super-installer + onboarding gentle-ai (out of scope este ciclo).
5. **D3 ADR** — decidir si `.context/` migra a `mapping/+reports/` (alineación con B, requiere tooling).

---

## Continuación 2026-05-09 — Sub-bloque post-audit (3 commits)

> Continuación de la sesión 2026-05-08. El user pidió evaluar items que el audit anterior NO cubrió: `.claude/settings.json`, `.mcp.example.json` (Supabase MCP), `cli/resend.ts` deprecation, y "stale files".

### Audit gaps detectados (no estaban en `AUDIT-CROSS-REPO-2026-05-08.md`)

1. **`.claude/settings.json`** — A estaba MUY pobre vs B (17 blanket allow vs ~70 granular).
2. **`.mcp.example.json`** — byte-idéntico A↔B PERO **falta Supabase MCP** (parte del stack DEV documentado en CLAUDE.md MCPs Available).
3. **`skills-lock.json`** — A SÍ lo tiene (no "skills.log.json" como dijo el audit; nombre real `skills-lock.json`). Lockfile estilo package-lock para reusable skills externas con SHA hashes.
4. **`.gemini/settings.{json,catalog.json}`** — config Gemini CLI solo en A, no comparada.
5. **`cli/resend.ts`** — script custom deprecable, suplantado por skill oficial `resend-cli` (de `resend/resend-cli` GitHub) que apareció via skill management (no manual).

### Audit corrections (segundo round)

- `cli/resend.ts` se referencia en docs colaterales (api-architecture.md, srs.MANUAL.md, implementation-planning.MANUAL.md), PERO esas refs son al **producto Resend** (email service) o al verbo "re-send", NO al script. **Cero edits colaterales requeridos** para deprecar el script.
- `.mcp.json` está en `.gitignore` (línea 68) y nunca commiteado — el local con tokens reales NO leak.

### Commits del sub-bloque

| Commit    | Cambio                                                                                                                                                                                                                                                                            |
| --------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `fb5b601` | `chore(settings)`: upgrade `.claude/settings.json` (B-style, granular permissions, skill allowlist 24 entries, deny destructive 14 entries, removed `disableAllHooks` y `defaultMode: acceptEdits`). **Absorbió `cli/resend.ts` deletion** porque `git rm` lo había staged previo |
| `f14d3dc` | `feat(mcp)`: add Supabase MCP server to `.mcp.example.json` con env vars `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `SUPABASE_ACCESS_TOKEN`                                                                                                                |
| `3001cc8` | `refactor(cli)`: replace `cli/resend.ts` with official `resend-cli` skill (from `resend/resend-cli` GitHub). 19 files: SKILL.md + 16 references + symlink + skills-lock.json update + package.json clean                                                                          |

### Decisión estratégica del user (D8 NUEVA)

> **Implementar Fase 15 (super-installer + onboarding gentle-ai)** — confirmada por user como dirección estratégica.

**Implicaciones**:

- Las 4 skills borrowed de gentle-ai (chained-pr, judgment-day, cognitive-doc-design, comment-writer) eventualmente migran a venir de gentle-ai user-install en lugar de copias locales.
- A va a tener un script de instalación que detecta y conecta con gentle-ai.
- Onboarding guiado para new users.

**Constraint del user (recordatorio explícito)**: Fase 15 debe ejecutarse en **modo orquestación pura** — el hilo principal NO ejecuta, solo despacha subagentes con briefings inteligentes (alineado con `feedback_orchestration_mode.md` memory).

### Plan tentativo Fase 15 (próxima sesión dedicada, 1-2 sesiones)

**Phase A — Diseño** (1 sub-agent `Plan` o invocar `sdd-propose`):

- Propuesta + spec + design para el installer
- Decisión: ¿gentle-ai como hard dep o soft (fallback a copies locales si no instalado)?
- Decisión: formato del installer (bun script CLI, npm postinstall, Make target, etc.)
- Decisión: qué skills migran a referencia gentle-ai vs cuáles se mantienen locales

**Phase B — Build** (subagentes en paralelo):

- `scripts/install.ts` — detector + linker
- `docs/setup/integrating-gentle-ai.md` — guía onboarding user-facing
- Hand-off matrix: cuándo usar `/sprint-dev` vs delegar a `/sdd-*` para change-rigorous flows

**Phase C — Migración de skills borrowed** (1 subagent):

- Si se decide referencia: convert chained-pr, judgment-day, cognitive-doc-design, comment-writer a symlinks/references hacia `~/.claude/skills/`
- Si se decide hybrid: documentar la relación + crear `scripts/sync-from-gentle-ai.ts` para drift detection
- Update settings.json (remover Skill() entries que ahora vienen de user-level)

**Phase D — Verify** (1 subagent):

- Smoke test installer en repo dummy
- Update CLAUDE.md / AGENTS.md con sección Onboarding
- Update HANDOFF cierre

### Estado final post-2026-05-09 sub-bloque

- 11 workflow skills + 5 reusable + **6 reusable** (con `resend-cli`)
- 7 slash commands
- `.claude/settings.json` modernizado (B-style con adaptaciones DEV)
- `.mcp.example.json` con 8 MCPs (incl. Supabase)
- `skills-lock.json` con 5 entradas (4 originales + resend-cli)
- `cli/resend.ts` deprecado; package.json sin script `resend`
- `cli/` ahora tiene solo: `update-template.js`, `sync-openapi.ts` (D6 migración a `scripts/` sigue pendiente)

### Items que siguen DEFERIDOS

| #       | Item                                                                           | Fase asignada                                   |
| ------- | ------------------------------------------------------------------------------ | ----------------------------------------------- |
| Fase 13 | Push como `agentic-dev-boilerplate`                                            | Cuando user lo decida                           |
| Fase 15 | Super-installer + onboarding gentle-ai                                         | **Próxima sesión dedicada (orquestación pura)** |
| L7      | mcp-dbhub/mcp-openapi DEV-flavor cleanup                                       | Sesión separada                                 |
| D6      | `cli/` → `scripts/` migration (queda `update-template.js` y `sync-openapi.ts`) | Sesión separada                                 |
| D3      | `.context/` arquitectura migration a `mapping/+reports/`                       | ADR explícito requerido                         |
| S2/S4   | docs/methodology + workflows/environments link path drift                      | Estilo, no urgente                              |

---

## Continuación 2026-05-09b — gentle-ai research + git-flow-master + Fase 15 plan

> Sub-bloque post-2026-05-09. El user pidió investigar gentle-ai a fondo, decidir qué skills traer, y consolidar todos los comandos git/PR en una super-skill propia ANTES de Fase 15.

### Audit gaps detectados (NO estaban en `AUDIT-CROSS-REPO-2026-05-08.md`)

1. **`.claude/settings.json`**: A estaba MUY pobre (17 blanket allow vs ~70 granular en B). Resuelto en commit `fb5b601` (sub-bloque 2026-05-09a).
2. **`.mcp.example.json`** sin Supabase MCP. Resuelto en commit `f14d3dc`. **Pero la lista canónica REAL del user es solo 4 MCPs**: tavily, context7, supabase, **n8n** (con su skill). Resto via CLI + skills. Necesita cleanup futuro: sacar atlassian/playwright/dbhub/openapi/postman, agregar n8n.
3. **`skills-lock.json`** existe en A (lockfile de skills externas con SHA hashes). El audit lo nombró mal "skills.log.json" — el correcto es **`skills-lock.json`**.
4. **`cli/resend.ts`** deprecable: hay skill oficial `resend-cli` ahora. Resuelto en commit `3001cc8`.
5. **5 errors lint `{{ATLASSIAN_SITE}}`** en acli skill (introducidos cuando portamos acli en commit `96c5fe5`). Resuelto en commit `b7fe7a4` (mini-fase 15-pre).
6. **Templates per-agente en `templates/mcp/`**: existen `claude.template.json`, `opencode.template.json`, `codex.template.toml`, `gemini.template.json`, `dbhub.example.toml`. Decisión: **NO borrar** (user puede borrar después según necesite). El installer puede usar los templates como base para configurar MCPs interactivamente.

### Mini-fase 15-pre completada (3 commits)

| Commit    | Cambio                                                                                                                                                                             |
| --------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `b7fe7a4` | `chore`: declare ATLASSIAN_SITE + remove 3 git/PR commands + chained-pr skill (consolidados en git-flow-master)                                                                    |
| `e2da049` | `feat(skills)`: add `git-flow-master` super-skill (352 L SKILL + 4 references + 8 evals) + cross-ref updates en sprint-dev, comment-writer, judgment-day, AGENTS.md, settings.json |
| `5530492` | `docs(plans)`: add `.plans/GENTLE-AI-RESEARCH.md` (792 L) — investigación completa del ecosistema gentle-ai v1.26.5                                                                |

**git-flow-master soporta 7 estrategias de branching** (más de las 3 que el user pidió):

1. `solo-main` (personal/side projects)
2. `main-integration` (Apex Galaxy style)
3. `enterprise` (multi-branch + release/hotfix)
4. `trunk-based` (feature flags, <1d branches)
5. `gitflow` (Vincent Driessen clásico)
6. `github-flow` (main + features, no integration)
7. `gitlab-flow` (env branches: pre-production, production)

Auto-detecta strategy via `.git/config` + branches existentes + marker `<!-- git-flow-master:strategy:value -->` en AGENTS.md. Si ambiguo, pregunta al user y persiste la decisión.

**Lint baseline**: ahora **7 errors + 5 warnings** (era 12+5; ATLASSIAN_SITE fix bajó 5 errors).

### Decisiones del user para Fase 15 (D9 — D14 NUEVAS)

| ID  | Decisión                                                                                                                                                                                                                                                                 |
| --- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| D9  | gentle-ai NOT mandatory pero **quasi-must-have**. Engram = casi obligatorio. SDD skills = casi obligatorias. Resto opcional pero el installer ofrece todas las que marcamos. CLAUDE.md/AGENTS.md debe documentar: "este repo usa gentle-ai como base global, NO crítico" |
| D10 | Installer formato: **bun script CLI interactivo** (confirmado)                                                                                                                                                                                                           |
| D11 | NO usar `gentle-ai install --preset ecosystem-only` — instalar **por args específicos** para tener control granular y evitar que gentle-ai agregue cosas extras a presets                                                                                                |
| D12 | `templates/mcp/` **NO borrar**. User decide qué borrar después. Script `update-boilerplate.ts` puede actualizar el template del agent que el user elija                                                                                                                  |
| D13 | Lista **canónica de MCPs**: tavily, context7, supabase, **n8n** (con skill de n8n). Todos los demás via CLI + skills                                                                                                                                                     |
| D14 | Soportar SOLO **2 agentes**: Claude Code + OpenCode. Todo lo demás (Codex, Gemini, Cursor, Copilot, etc.) fuera de scope                                                                                                                                                 |

### Decisiones sobre skills a traer de gentle-ai (D15)

**15 skills selectas** (NO las 22 community + NO chained-pr/branch-pr/work-unit-commits/skill-creator/go-testing):

✅ **SDD bloque completo (11)**: `sdd-init`, `sdd-explore`, `sdd-propose`, `sdd-spec`, `sdd-design`, `sdd-tasks`, `sdd-apply`, `sdd-verify`, `sdd-archive`, `sdd-onboard`, `skill-registry`

✅ **Foundation (4)**: `judgment-day`, `cognitive-doc-design`, `comment-writer`, `issue-creation`

❌ **Descartadas**:

- `chained-pr`, `branch-pr`, `work-unit-commits` — consolidados en `/git-flow-master` propio
- `skill-creator` — el oficial de Anthropic se instala via `npx skills add skill-creator`
- `go-testing` — no usamos Go
- 22 community skills (`react-19`, `nextjs-15`, `typescript`, `tailwind-4`, `zod-4`, etc.) — preferimos skills oficiales via `find-skills` (que el user ya tiene global)

### Skill propia adicional para Fase 15

✅ Crear `/agentic-dev-onboard` (mejor nombre que `/dev-onboard`) — explica el flujo del repo (`/sprint-dev` + Jira + Next.js + Supabase). Complementa al `sdd-onboard` de gentle-ai.

### Lista de cleanup a hacer DURANTE Fase 15 (consolidado)

1. **Eliminar copias locales de skills borrowed** (vienen de gentle-ai user-install):
   - `.claude/skills/judgment-day/`
   - `.claude/skills/cognitive-doc-design/`
   - `.claude/skills/comment-writer/`
   - (`chained-pr` ya borrada en `b7fe7a4`)
   - Update `.claude/settings.json` Skill() entries

2. **`.mcp.example.json`** rehacerlo con lista canónica: tavily, context7, supabase, n8n. Sacar atlassian, playwright, dbhub, openapi, postman.

3. **Agregar `Bash(supabase *)`, `Bash(vercel *)`, etc.** al settings.json allow (CLIs que el installer verifica).

4. **`cli/update-template.js`** → migrar a `cli/update-boilerplate.ts` (TypeScript + bun, alineado con QA boilerplate).

5. **Crear `cli/install.ts`** (o `scripts/install.ts`) — el installer interactivo dual.

6. **Crear `docs/setup/integrating-gentle-ai.md`** + hand-off matrix `/sprint-dev` ↔ `/sdd-*`.

### Plan Fase 15 (actualizado, próxima sesión, orquestación pura)

**Phase A — Diseño concreto** (1 sub-agent `Plan` o `sdd-propose`):

- Confirmar D9-D15 + ajustar
- Diseñar el flow exacto del installer (steps, prompts, fallbacks)
- Decidir cómo se persiste si el user opt-out de gentle-ai (script anota decisión, no re-pregunta)

**Phase B — Build** (2-3 subagentes en paralelo):

- `cli/install.ts` — installer dual (delega a gentle-ai via args específicos + verifica CLIs externos + configura MCPs interactivo)
- `cli/update-boilerplate.ts` — migración TS + lógica de update de templates por agent
- `docs/setup/integrating-gentle-ai.md` — guía + hand-off matrix `/sprint-dev` ↔ `/sdd-*`
- `.mcp.example.json` rehecho con lista canónica
- Update `.claude/settings.json`

**Phase C — Migración + nueva skill propia** (1 subagent):

- Eliminar 3 copias locales de skills borrowed (judgment-day, cognitive-doc-design, comment-writer)
- Update settings.json para sacar Skill() entries (vienen del user-level)
- Crear `/agentic-dev-onboard` skill nueva (con `skill-creator` oficial)
- Actualizar AGENTS.md sección Skills + Future Hooks

**Phase D — Verify + cierre** (1 subagent):

- Smoke test: simular "Create from Template" → run installer → todo funciona
- Update CLAUDE.md/AGENTS.md sección Onboarding
- Update HANDOFF + cierre Fase 15
