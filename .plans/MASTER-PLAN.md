# Master Plan — Migración a Skills (`agentic-dev-boilerplate`)

> **Propuesta ejecutiva** para migrar el repo `ai-driven-project-starter` desde un workflow basado en prompts (`.prompts/`) a un workflow basado en Claude Code skills (`.claude/skills/` + `.claude/commands/`), preservando solo el dominio de desarrollo de software y excluyendo todo lo de testing.

---

## 1. Context

El repo actual es un _AI-driven project starter_ que usa prompts en `.prompts/` organizados en 14 fases (1-3 sincrónicas, 4-14 asincrónicas). Hoy mezcla:

- **Desarrollo de software** (fases 1, 2, 3, 4, 6, 7, 8, 9, 13)
- **Testing** (fases 5, 10, 11, 12, 14)

El repo hermano `agentic-qa-boilerplate` ya migró su mitad QA a Claude Code skills siguiendo la convención de Anthropic (agentskills.io). Queremos hacer lo mismo para la mitad dev, en un repo nuevo `agentic-dev-boilerplate`.

**Problema que resolvemos:** los prompts actuales son fragmentados, sin trigger automático, y mezclan dominios. Al migrar a skills logramos: (a) auto-trigger basado en el contexto del usuario, (b) progressive disclosure (carga lazy de references), (c) portabilidad cross-agent (Claude Code, Cursor, OpenCode, Codex), (d) separación clara de dev vs testing.

**Outcome esperado:** repo `agentic-dev-boilerplate` con 6 skills de workflow + skills reutilizables existentes + 5 slash commands de utilidades, todo en una rama `skills-migration` lista para push como nuevo origin.

---

## 1.5. Modo de ejecución: orquestación pura (constraint duro)

> **Todo se ejecuta en orquestación.** El hilo principal NO ejecuta tareas directamente; solo despacha subagentes, recibe reportes, toma decisiones, y dispara el siguiente paso. Esta restricción aplica a CADA fase del Migration Order (§8).

**Reglas operativas:**

1. **Auditorías y research** → `Explore` agents (read-only, en paralelo cuando son independientes).
2. **Diseño/decisiones intermedias** → `Plan` agents (cuando el siguiente paso requiere arquitectura).
3. **Implementación (write/edit)** → `general-purpose` agents con briefings quirúrgicos.
4. **Verificación post-implementación** → `Explore` o `general-purpose` agents (lint, tests, type checks, smoke tests).
5. **Hilo principal SOLO**: dispatch, recibo de reportes, decisiones, comunicación con usuario, edición del plan/MEMORY.md.

**Briefing format obligatorio para cada subagente (mismo de CLAUDE.md):**

1. **Goal** — una frase
2. **Context docs** — qué archivos leer primero
3. **Skills/MCPs to load** — si aplica
4. **Exact instructions** — pasos numerados, no metas vagas
5. **Report format** — qué devolver (archivos cambiados, validaciones, blockers)
6. **Rules** — Critical Rules relevantes (no AI attribution, no force push, etc.)

**Ejecución paralela vs secuencial:**

- **Paralelo**: tareas independientes (3 skills construyéndose en sub-agentes distintos al mismo tiempo, audits cruzados, etc.)
- **Secuencial**: cuando la salida de A alimenta B (ej. extracción AC de fase-5 → escritura del reference)
- **Background**: validaciones largas (lint, jira:check, smoke tests E2E)
- **Single**: tareas atómicas pequeñas (un edit a CLAUDE.md)

**Error protocol:** si un subagente falla → STOP, reporte al usuario con contexto completo, NO intentar fix sin aprobación, presentar opciones (retry/skip/abort).

**Quirurgico:** cero detalles escapados. Cada subagente devuelve un reporte verificable; el hilo principal cruza reportes contra el plan antes de avanzar. Si un reporte deja ambigüedad, otro subagente la resuelve antes de pasar a la siguiente fase.

---

## 2. Decisiones arquitectónicas (locked)

| Decisión                | Valor confirmado                                                                                                                                                     |
| ----------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Grupos de scope         | **3 grupos**: A=Baseline (one-time), B=Project Management (continuo), C=Software Development (per-story)                                                             |
| Skills Grupo A          | **2 skills**: `project-foundation` + `project-bootstrap`                                                                                                             |
| Skills Grupo B          | **1 skill**: `product-management`                                                                                                                                    |
| Skills Grupo C          | **2 skills**: `sprint-dev` (mega-orquestador) + `unit-testing` (composable, TDD-ready)                                                                               |
| Init bootstrap          | **`init-project`** skill portada desde `framework-core` del hermano                                                                                                  |
| Utilities como commands | **5 commands**: `/git-flow`, `/git-conflict-fix`, `/project-doc-setup`, `/context-engineering-setup`, `/sprint-report` (con cleanup)                                 |
| Hooks gentle-ai         | **Fuerte**: portar `framework-core` + phase tags en frontmatter + sección "Future Hooks" en CLAUDE.md                                                                |
| Estrategia repo         | **Rama `skills-migration`** en repo actual (sin worktree). Push final como `agentic-dev-boilerplate`                                                                 |
| Convención              | agentskills.io standard: SKILL.md ≤500 líneas, name=dirname kebab-case, description ≤1024 chars (trigger), 3 subdirs estándar (`scripts/`, `references/`, `assets/`) |

**Total skills nuevas: 6** | **Total commands nuevos: 5**

---

## 3. Scope

### IN SCOPE (migra)

**Prompts → Skills/Commands:**

- `.prompts/fase-1-constitution/*` (2 archivos)
- `.prompts/fase-2-architecture/*` (8 archivos)
- `.prompts/fase-3-infrastructure/*` + `features/` (7 archivos)
- `.prompts/fase-4-specification/*` (2 archivos)
- `.prompts/fase-5-shift-left-testing/*` — **solo porción AC-refinement**, extraída
- `.prompts/fase-6-planning/*` (2 archivos)
- `.prompts/fase-7-implementation/*` (5 archivos)
- `.prompts/fase-8-code-review/*` (2 archivos)
- `.prompts/fase-9-deployment-staging/*` (3 archivos)
- `.prompts/fase-13-production-deployment/*` (3 archivos)
- `.prompts/discovery/business-data-map.md`, `api-architecture.md`, `project-dev-guide.md`
- `.prompts/utilities/git-flow.md`, `git-conflict-fix.md`, `context-engineering-setup.md`, `sprint-report.md`
- `.prompts/setup/project-doc-setup.md`

**Guidelines → references:**

- `.context/guidelines/DEV/code-standards.md`
- `.context/guidelines/DEV/spec-driven-development.md`
- `.context/guidelines/DEV/error-handling.md`
- `.context/guidelines/DEV/data-testid-standards.md`

**`.agents/` config:** preservar con poda de campos Jira testing-only (~15 entradas), regenerar `jira.json` con `bun run jira:sync-fields --force` post-migration.

### OUT OF SCOPE (elimina del repo nuevo)

- Todas las fases de testing: 5 (porción QA), 10, 11, 12, 14
- `us-qa-workflow.md`, `bug-qa-workflow.md`
- `orchestrators/sprint-testing-agent.md`, `test-automation-agent.md`
- `QA-learning-methodology/*` (4 archivos)
- `setup/test-framework-adaptation.md`, `monorepo-for-qa-setup.md`
- `utilities/sprint-test-framework-generator.md`, `test-execution-breakdown.md`, `traceability-fix.md`
- Guidelines: `.context/guidelines/QA/*`, `TAE/*`, `tms-*.md`
- Skill existente: `.claude/skills/xray-cli/` (testing-only)
- Top-level: `session-start.md`, `us-dev-workflow.md` (innecesarios; `sprint-dev` orquesta)
- `.context/PBI/`, `.context/PRD/`, `.context/SRS/`, `.context/idea/` (project-specific, deja templates vacíos)

### KEEP AS-IS (skills existentes reutilizables)

`.claude/skills/`: `frontend-design`, `next-best-practices`, `next-cache-components`, `next-upgrade`, `playwright-cli`. Útiles para dev, agnósticas a testing.

---

## 4. Diseño de Skills

Cada skill sigue convención agentskills.io + best practices del repo hermano:

```
.claude/skills/<slug>/
├── SKILL.md          (≤500 líneas, frontmatter + body orquestador)
├── references/       (loaded on-demand, 1 archivo por subtema)
└── evals/evals.json  (test cases para validar trigger)
```

**Frontmatter estándar:**

```yaml
---
name: <slug> # kebab-case, debe igualar al dirname
description: "<2-3 líneas. Triggers explícitos al final + 'Do NOT use for: <delimitación>'"
license: MIT
compatibility: [claude-code, copilot, cursor, codex, opencode]
phase: <sdd-phase> # NUEVO (gentle-ai-inspired): foundation|management|design|implementation|review|deploy
allowed-tools: <opcional> # restringe Bash si aplica
---
```

### 4.1 `project-foundation` (Grupo A — fases 1+2 + discovery)

**Trigger:** "estoy ideando un nuevo producto", "definir el PRD", "mapear arquitectura del sistema", "constituir el proyecto"
**Phase tag:** `foundation`
**Source mapping:**
| Prompt origen | Reference destino |
|---|---|
| `.prompts/fase-1-constitution/business-model.md` | `references/constitution-business-model.md` |
| `.prompts/fase-1-constitution/market-context.md` | `references/constitution-market-context.md` |
| `.prompts/fase-2-architecture/prd-executive-summary.md` | `references/prd-executive-summary.md` |
| `.prompts/fase-2-architecture/prd-user-personas.md` | `references/prd-personas.md` |
| `.prompts/fase-2-architecture/prd-mvp-scope.md` | `references/prd-mvp-scope.md` |
| `.prompts/fase-2-architecture/prd-user-journeys.md` | `references/prd-user-journeys.md` |
| `.prompts/fase-2-architecture/srs-functional-specs.md` | `references/srs-functional.md` |
| `.prompts/fase-2-architecture/srs-non-functional-specs.md` | `references/srs-non-functional.md` |
| `.prompts/fase-2-architecture/srs-architecture-specs.md` | `references/srs-architecture.md` |
| `.prompts/fase-2-architecture/srs-api-contracts.md` | `references/srs-api-contracts.md` |
| `.prompts/discovery/business-data-map.md` | `references/business-data-map.md` |
| `.prompts/discovery/api-architecture.md` | `references/api-architecture.md` |
| `.prompts/discovery/project-dev-guide.md` | `references/project-dev-guide.md` |

### 4.2 `project-bootstrap` (Grupo A — fase 3)

**Trigger:** "scaffolding del proyecto", "setup del backend", "inicializar el frontend", "configurar OpenAPI"
**Phase tag:** `foundation`
**Source mapping:**
| Prompt origen | Reference destino |
|---|---|
| `.prompts/fase-3-infrastructure/backend-setup.md` | `references/backend-setup.md` |
| `.prompts/fase-3-infrastructure/frontend-setup.md` | `references/frontend-setup.md` |
| `.prompts/fase-3-infrastructure/features/openapi-setup.md` | `references/openapi-setup.md` |
| `.prompts/fase-3-infrastructure/features/api-routes-setup.md` | `references/api-routes-setup.md` |
| `.prompts/fase-3-infrastructure/features/bearer-token-support.md` | `references/bearer-token-support.md` |
| `.prompts/fase-3-infrastructure/features/env-url-setup.md` | `references/env-url-setup.md` |
| `.prompts/fase-3-infrastructure/features/supabase-types-setup.md` | `references/supabase-types-setup.md` |

### 4.3 `product-management` (Grupo B — fase 4 + AC-refinement de fase 5)

**Trigger:** "crear épica", "agregar historia al backlog", "refinar acceptance criteria", "enumerar edge cases", "INVEST a esta historia", "3 amigos"
**Phase tag:** `management`
**Source mapping:**
| Prompt origen | Reference destino |
|---|---|
| `.prompts/fase-4-specification/pbi-product-backlog.md` | `references/product-backlog-seed.md` |
| `.prompts/fase-4-specification/pbi-add-feature.md` | `references/add-feature.md` |
| **NUEVO** (extraído de pbi-\*) | `references/epic-creation.md` |
| **NUEVO** (3 amigos, INVEST) | `references/story-refinement.md` |
| **EXTRAÍDO** de `fase-5/acceptance-test-plan.md` | `references/acceptance-criteria.md` |
| **EXTRAÍDO** de `fase-5/feature-test-plan.md` | `references/edge-cases-enumeration.md` |

⚠️ **Riesgo extracción fase 5:** los prompts de shift-left mezclan AC-thinking con TC-formal. La extracción requiere lectura cuidadosa para no arrastrar lenguaje QA.

### 4.4 `sprint-dev` (Grupo C — fases 6+7+8+9+13, mega-orquestador)

**Trigger:** "implementar esta historia", "trabajar el ticket UPEX-XXX", "plan→code→review→deploy", "fix bug y mergear", "deploy a staging"
**Phase tag:** `implementation`
**Diseño orquestador (mirror sprint-testing del hermano):**

- SKILL.md describe el dispatch strategy: Single (planning) → Sequential (implementation) → Single (review) → Background (deploy monitoring)
- Subagent dispatch para tareas paralelas (multi-file edits, tests + types + lint en paralelo)
- Decision tree: ticket vs bug vs continue-from
- Hand-offs documentados: a `unit-testing` (TDD), a `code-review`, a `/git-flow` (PR creation)

**Source mapping:**
| Prompt origen | Reference destino |
|---|---|
| `.prompts/fase-6-planning/feature-implementation-plan.md` | `references/feature-plan.md` |
| `.prompts/fase-6-planning/story-implementation-plan.md` | `references/story-plan.md` |
| `.context/guidelines/DEV/spec-driven-development.md` | `references/spec-driven-development.md` |
| `.prompts/fase-7-implementation/implement-story.md` | `references/implement-story.md` |
| `.prompts/fase-7-implementation/bug-fix-workflow.md` | `references/bug-fix-workflow.md` |
| `.prompts/fase-7-implementation/continue-implementation.md` | `references/continue-implementation.md` |
| `.prompts/fase-7-implementation/fix-issues.md` | `references/fix-issues.md` |
| `.context/guidelines/DEV/code-standards.md` | `references/code-standards.md` |
| `.context/guidelines/DEV/error-handling.md` | `references/error-handling.md` |
| `.context/guidelines/DEV/data-testid-standards.md` | `references/data-testid-standards.md` |
| `.prompts/fase-8-code-review/review-pr.md` | `references/review-pr.md` |
| `.prompts/fase-8-code-review/setup-linting.md` | `references/setup-linting.md` |
| `.prompts/fase-9-deployment-staging/ci-cd-setup.md` | `references/ci-cd-setup.md` |
| `.prompts/fase-9-deployment-staging/deploy-to-staging.md` | `references/staging-deploy.md` |
| `.prompts/fase-9-deployment-staging/environment-config.md` | `references/environment-config.md` |
| `.prompts/fase-13-production-deployment/pre-deploy-checklist.md` | `references/pre-deploy-checklist.md` |
| `.prompts/fase-13-production-deployment/deploy-to-production.md` | `references/production-deploy.md` |
| `.prompts/fase-13-production-deployment/rollback-plan.md` | `references/rollback-plan.md` |
| `.prompts/us-dev-workflow.md` | **fuente del orquestador** en SKILL.md body |

**Total: 18 references + 1 SKILL.md.** Comparable a `test-automation` del hermano (11 refs).

### 4.5 `unit-testing` (Grupo C — composable con sprint-dev para TDD)

**Trigger:** "escribir unit tests", "TDD esta función", "qué mockear aquí", "naming de este test", "test coverage de esta clase"
**Phase tag:** `implementation` (sub-fase TDD)
**Composabilidad:** invocable standalone o desde `sprint-dev` (cuando el flujo plan→code adopta TDD).
**Source mapping:**
| Prompt origen | Reference destino |
|---|---|
| `.prompts/fase-7-implementation/unit-testing.md` | `references/unit-testing.md` |
| **NUEVO** | `references/tdd-workflow.md` (Red→Green→Refactor; integration con sprint-dev) |
| **NUEVO** | `references/test-naming.md` (convenciones AAA, Given-When-Then) |
| **NUEVO** | `references/mocking-patterns.md` (Jest/Vitest mocks vs spies vs stubs) |
| **NUEVO** | `references/test-coverage.md` (qué medir, qué ignorar) |

### 4.6 `init-project` (gentle-ai-inspired, port desde `framework-core` del hermano)

**Trigger:** "inicializar el repo", "/init-project", "setup primera vez", "auto-detectar stack del proyecto"
**Phase tag:** `bootstrap`
**Diseño:**

- Wizard interactivo: detecta stack del repo target, llena `.agents/project.yaml`, valida `.env`
- Bootstrapea `.agents/` (project.yaml, jira-required.yaml, jira.json placeholders)
- Instala `scripts/agents-setup.ts`, `agents-lint.ts`, `sync-jira-fields.ts`, `check-jira-setup.ts`
- Crea `CLAUDE.md`/`AGENTS.md` desde template
  **Source:** copy directo desde `agentic-qa-boilerplate/.claude/skills/framework-core/` con poda de templates QA-specific.

---

## 5. Diseño de Commands (slash commands)

Convención Claude Code: `.claude/commands/<slug>.md`. User-invoked via `/<slug>`. Más simple que skills (no frontmatter complejo, single-purpose).

| Command                      | Source                                   | Cleanup necesario                                                                          |
| ---------------------------- | ---------------------------------------- | ------------------------------------------------------------------------------------------ | ---- |
| `/git-flow`                  | `utilities/git-flow.md`                  | Ninguno (agnóstico)                                                                        |
| `/git-conflict-fix`          | `utilities/git-conflict-fix.md`          | Ninguno (agnóstico)                                                                        |
| `/project-doc-setup`         | `setup/project-doc-setup.md`             | Eliminar referencias a `project-test-guide`, ajustar a regenerar README+CLAUDE.md dev-only |
| `/context-engineering-setup` | `utilities/context-engineering-setup.md` | Eliminar referencias a `.context/guidelines/QA                                             | TAE` |
| `/sprint-report`             | `utilities/sprint-report.md`             | Limpiar para reporte de avance dev/PM (épicas + historias + PRs), sin testing              |

---

## 6. `.agents/` adaptación

Preservar el sistema de variables intacto (es agnóstico por diseño). Acciones específicas:

1. **Copy `.agents/README.md`** as-is (contrato de las 4 sintaxis: `{{VAR}}`, `{{environments.<env>.<var>}}`, `<<VAR>>`, `{{jira.<slug>}}`).
2. **Copy `.agents/project.yaml`** as-is (template, nulls por proyecto).
3. **Pode `.agents/jira-required.yaml`** — eliminar ~15 campos testing-only:
   - `acceptance_test_plan_atp`, `feature_test_plan_qa`, `test_status`, `to_be_automated_qa`, `qa_framework`, `in_regression_plan_qa`, `test_design`, `test_analysis`, `test_outline`, `test_strategy`, `test_description`, `test_data`, `scenario`, `xray_begin_date`, `xray_end_date`, `xray_revision`
   - **Mantener**: story fields (AC, business rules, scope, mockup, workflow, story points), bug fields (severity, error_type, etc.)
4. **Regenerar `.agents/jira.json`** post-migration con `bun run jira:sync-fields --force` (proyecto-específico).
5. **Copy scripts as-is**: `agents-lint.ts`, `sync-jira-fields.ts`, `check-jira-setup.ts`. Son agnósticos.

---

## 7. CLAUDE.md changes

El `CLAUDE.md` actual tiene 14 secciones. Cambios para el nuevo repo:

| Sección                                      | Acción                                                                                                                                                                 |
| -------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Quick Start                                  | Reemplazar referencias a `.prompts/` por skills `/<slug>`. Documentar el orden: `/init-project` → `/project-foundation` → `/project-bootstrap` → loop de `/sprint-dev` |
| Critical Reminders                           | Eliminar reglas QA-specific (Shift-Left, Exploratory before Automation, Unit tests in Fase 7) — quedará simplificado                                                   |
| Project Variables                            | Mantener intacto (agnóstico)                                                                                                                                           |
| Tool Resolution                              | Eliminar `[TMS_TOOL]` (no aplica). Mantener `[ISSUE_TRACKER_TOOL]`, `[AUTOMATION_TOOL]` (para dev local), `[DB_TOOL]`, `[API_TOOL]`                                    |
| QA Workflow by Work Type                     | **ELIMINAR** completo                                                                                                                                                  |
| Dev + QA Planning Scopes                     | Renombrar a "Planning Scopes". Eliminar la subsección de Test Planning                                                                                                 |
| Fundamental Rules                            | Eliminar sección KATA Architecture (testing-specific). Mantener TypeScript Patterns con poda                                                                           |
| Git Workflow                                 | Mantener intacto                                                                                                                                                       |
| Orchestration Mode                           | Mantener — sigue siendo válido para sprint-dev                                                                                                                         |
| Usage Modes                                  | Reescribir: skills nuevas como entry points, no prompts                                                                                                                |
| Context System                               | Mantener; ajustar al hecho de que `.context/PBI/` ahora se usa también para dev sessions                                                                               |
| MCPs Available                               | Mantener                                                                                                                                                               |
| Skills                                       | **REESCRIBIR**: tabla con las 6 skills nuevas + 5 reutilizables                                                                                                        |
| Test Project Structure                       | **ELIMINAR** completo                                                                                                                                                  |
| Critical Test Priorities                     | **ELIMINAR** completo                                                                                                                                                  |
| Testing Decisions                            | **ELIMINAR** completo                                                                                                                                                  |
| **NUEVO**: Future Hooks (gentle-ai inspired) | Documentar puntos de extensión: per-phase model routing, skill registry, engram-style memory                                                                           |

---

## 8. Migration order (fases ejecutables)

> **Cada fase es atómica y verificable.** Marca completed antes de pasar a la siguiente.
> **Cada fase declara qué subagente la ejecuta.** Hilo principal solo orquesta (ver §1.5).

**Leyenda de dispatch:**

- 🔍 `Explore` — auditoría/lectura
- 📐 `Plan` — diseño/decisión arquitectónica
- ⚙️ `general-purpose` — implementación (write/edit)
- 🧵 `main` — solo el hilo principal (decisión, push, confirmación user)
- ∥ paralelo · → secuencial · ⏳ background

### Fase 1: Setup branch + scaffolding · 🧵 main → ⚙️ 1 agent

- 🧵 `git checkout -b skills-migration` (decisión user-confirm)
- ⚙️ Subagente: crear `.plans/MASTER-PLAN.md` (copia), crear estructura vacía `.claude/skills/{...}/{references,evals}/`, `.claude/commands/`. Reporta árbol creado.

### Fase 2: Port `init-project` desde hermano · 🔍 1 → ⚙️ 1

- 🔍 `Explore`: auditoría completa de `agentic-qa-boilerplate/.claude/skills/framework-core/`. Identifica qué referencias/templates son agnósticos vs QA-specific. Reporte con tabla "keep/drop/adapt".
- ⚙️ `general-purpose`: copy + rename `name`, podar lo flagged como QA-specific por el agente anterior, adaptar wizard. Reporte con diff.

### Fase 3: Eliminar testing del scope · 🔍 1 → ⚙️ 1

- 🔍 `Explore`: validación final pre-deletion. Confirma que ningún archivo a eliminar es referenciado por archivos a conservar (cross-check refs). Reporte con lista DEFINITIVA de paths a borrar + warnings de referencias huérfanas.
- ⚙️ `general-purpose`: borrar paths con `git rm` (preserva historia). Conservar `.prompts/fase-5-shift-left-testing/` temporalmente. Reporte con diff de archivos borrados.

### Fase 4: Build skills Grupo A · ∥ 2 agents

- ⚙️∥ Agente A: construye `project-foundation` (copy 13 refs + write SKILL.md orquestador). Briefing incluye §4.1 del plan.
- ⚙️∥ Agente B: construye `project-bootstrap` (copy 7 refs + write SKILL.md). Briefing incluye §4.2.
- 🔍 Post: agente verifica `bun run lint:agents` sale 0 + frontmatter válido (name=dirname, description ≤1024).

### Fase 5: Build skill Grupo B (más quirúrgica) · 🔍 1 → 📐 1 → ⚙️ 1

- 🔍 `Explore`: lee `fase-5/acceptance-test-plan.md` y `feature-test-plan.md` completos. Marca con anotaciones inline qué bloques son AC-thinking (PM) vs TC-formal (QA). Reporte con bloques clasificados.
- 📐 `Plan`: con la clasificación, diseña la estructura interna de `acceptance-criteria.md` y `edge-cases-enumeration.md`. Define qué se reescribe vs copy. Define también scaffolding de los 2 archivos NUEVOS (`epic-creation.md`, `story-refinement.md`).
- ⚙️ `general-purpose`: ejecuta el diseño. Migra 4 refs directas + crea 4 NUEVAS según plan. Escribe SKILL.md. Borra `.prompts/fase-5-*/` al final.

### Fase 6: Build skill `sprint-dev` (la más grande) · 🔍 1 → 📐 1 → ∥ 3 agents

- 🔍 `Explore`: lee `us-dev-workflow.md` + las 5 fases que orquesta. Reporta el flujo exacto + dependencias entre fases.
- 📐 `Plan`: diseña SKILL.md de sprint-dev (≤500 líneas). Define dispatch strategy, decision tree (ticket vs bug vs continue), hand-offs. Outline final del SKILL.md.
- ⚙️∥ 3 agents en paralelo migran refs por bloque:
  - Agente 1: refs fase 6+7 (planning + implementation, 9 archivos)
  - Agente 2: refs fase 8 + DEV guidelines (review + standards, 5 archivos)
  - Agente 3: refs fase 9+13 (deployment, 6 archivos)
- ⚙️ Agente final: escribe SKILL.md según outline del Plan agent. Reporte con line count + verificación frontmatter.

### Fase 7: Build skill `unit-testing` · 📐 1 → ⚙️ 1

- 📐 `Plan`: diseña los 4 archivos NUEVOS (tdd-workflow, test-naming, mocking-patterns, test-coverage). Define composabilidad con sprint-dev (cómo se invocan juntos en TDD).
- ⚙️ `general-purpose`: migra 1 ref + escribe los 4 NUEVOS + SKILL.md.

### Fase 8: Build commands · ⚙️ 1 (con cleanup quirúrgico)

- ⚙️ `general-purpose`: migra 5 commands. Para `/project-doc-setup`, `/context-engineering-setup`, `/sprint-report` aplica cleanup (eliminar refs a QA, dejar solo dev/PM). Reporte por command con diff + verificación de invocación.

### Fase 9: Adaptación `.agents/` · 🔍 1 → ⚙️ 1

- 🔍 `Explore`: confirma los 15 campos a podar de `jira-required.yaml` cruzando con `{{jira.*}}` references en skills/commands ya migrados. Reporta exact list (puede ser distinta a la del plan si descubre uso).
- ⚙️ `general-purpose`: poda yaml, borra `jira.json`, ejecuta `bun run jira:check` (debe salir warning de "fields not in catalog" porque jira.json está vacío — eso es esperado y se resuelve en el bootstrap por-proyecto).

### Fase 10: CLAUDE.md rewrite · 📐 1 → ⚙️ 1

- 📐 `Plan`: lee CLAUDE.md actual + §7 del plan. Produce un outline section-by-section (keep/edit/delete/new).
- ⚙️ `general-purpose`: aplica el outline. Reporta diff por sección.

### Fase 11: Evals para cada skill · ∥ 6 agents

- ⚙️∥ 1 agente por skill (6 en paralelo). Cada uno escribe `evals/evals.json` con 3-6 test cases (mix positive/negative triggers, mirror del hermano §evals/evals.json de sprint-testing). Briefing incluye el SKILL.md de su skill como contexto.

### Fase 12: Verification end-to-end · ∥ 3 agents + 🧵

- ⚙️∥ Agente A: corre `bun run lint:agents` y `bun run jira:check`. Reporta exit codes + cualquier warning.
- ⚙️∥ Agente B: smoke test invocando cada skill con un trigger de su evals.json (sin ejecutar el workflow completo, solo verificar que la skill se carga). Reporta pass/fail por skill.
- ⚙️∥ Agente C: end-to-end simulado — repo dummy + `/init-project` → `/project-foundation` → `/sprint-dev` con ticket fake. Reporta blockers.
- 🧵 main: cruza los 3 reportes. Si hay rojo → spawn agente fix targeted. Si verde → avanza fase 13.

### Fase 13: Push como nuevo origin · 🧵 main only

- 🧵 confirmación user explícita ("¿push ahora?")
- 🧵 user crea repo en GitHub (acción humana via UI)
- 🧵 `git remote add agentic-dev <url>` + `git push agentic-dev skills-migration:main`

---

## 9. Verification & validation

| Check                    | Cómo                                                                   |
| ------------------------ | ---------------------------------------------------------------------- |
| Skill triggers correctly | `evals/evals.json` per skill + manual invocación con prompts realistas |
| `{{VAR}}` resolution     | `bun run lint:agents` (debe salir 0)                                   |
| Jira manifest válido     | `bun run jira:check` (debe salir 0)                                    |
| SKILL.md ≤500 líneas     | `wc -l .claude/skills/*/SKILL.md`                                      |
| name = dirname           | grep frontmatter `name:` y comparar con basename                       |
| description ≤1024 chars  | manual review                                                          |
| End-to-end smoke test    | `/init-project` en repo dummy, luego `/sprint-dev` con ticket fake     |

---

## 10. Future Hooks (gentle-ai inspired)

Documentado en CLAUDE.md sección "Future Hooks". No implementado ahora, dejado abierto:

1. **Per-phase model routing.** Cada SKILL.md declara `phase:` en frontmatter. Un orquestador futuro puede leer esto y elegir modelo distinto por fase (ej. Opus para foundation, Sonnet para implementation, Haiku para review).
2. **Skill registry explícito.** `scripts/skill-registry.ts` (TBD) que escanea `.claude/skills/` y emite un catálogo machine-readable. Útil para dashboards y para skills que necesitan descubrir otras skills.
3. **Memory layer estilo Engram.** Hoy usamos `.context/PBI/{module}/{ticket}/` + auto-memory. Engram propone una capa más rica con sync entre máquinas. Hook-point: `.context/.engram/` (TBD).
4. **Cross-agent portability.** Compatibility frontmatter ya declara claude-code, copilot, cursor, codex, opencode. Para activar realmente cross-agent: validar en CI con runners cross-agent (TBD).

---

## 11. Riesgos & open questions

| Riesgo                                                                      | Mitigación                                                                                                                                         |
| --------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------- |
| Extracción AC de fase-5 arrastra lenguaje QA                                | Lectura cuidadosa, write fresh, no copy-paste literal                                                                                              |
| `sprint-dev` SKILL.md crece >500 líneas                                     | Si pasa, mover orquestación específica a `references/orchestration.md`                                                                             |
| `init-project` del hermano referencia archivos QA                           | Audit completo durante port, eliminar referencias QA-specific                                                                                      |
| Jira-required.yaml poda accidentalmente campo aún usado                     | Correr `bun run lint:agents` después; cualquier `{{jira.X}}` no resuelto sale como error                                                           |
| Push a nuevo origin sobreescribe historia compartida                        | Confirmar con user explícitamente, push como rama nueva (no force)                                                                                 |
| Existing skills (frontend-design, next-\*) tienen referencias internas a QA | Audit antes de copiar; probable que sean independientes pero verificar                                                                             |
| Hilo principal cae en tentación de implementar directo                      | Constraint duro §1.5 — toda implementación pasa por subagente con briefing. Si me veo escribiendo Edit/Write fuera del plan file, parar y delegar. |
| Subagente devuelve reporte ambiguo                                          | Otro subagente resuelve antes de avanzar. Cero "asumimos que sí" sin verificación.                                                                 |
| Reporte de subagente describe lo que intentó hacer, no lo que hizo          | Verificación post-implementación independiente (ej. lint + grep + read selectivo) antes de marcar fase completed.                                  |

**Open questions (resolver durante implementación, no bloquean plan):**

- ¿`unit-testing` debe declarar dependency explícita en `sprint-dev` o ser totalmente standalone?
- ¿Mantenemos `.context/business-data-map.md` como output del skill foundation, o solo como reference dentro del skill?
- ¿`/sprint-report` necesita un schema de output o solo prompt?

---

## 12. Resumen ejecutivo

**6 skills nuevas** + **5 commands nuevos** + **5 skills existentes preservadas** = repo completo de desarrollo de software, con auto-trigger, progressive disclosure, y portabilidad cross-agent. Migración en **13 fases atómicas** sobre rama `skills-migration`. Push final como `agentic-dev-boilerplate`.

**Métricas de éxito:**

- ✅ Todo trigger relevante invoca la skill correcta (validado por evals)
- ✅ `bun run lint:agents` y `jira:check` salen 0
- ✅ End-to-end: `/init-project` → `/project-foundation` → `/sprint-dev` ejecuta sin errores
- ✅ CLAUDE.md sin referencias a `.prompts/` ni a fases QA
- ✅ Repo nuevo es un dev-only boilerplate funcional, agnóstico al stack
