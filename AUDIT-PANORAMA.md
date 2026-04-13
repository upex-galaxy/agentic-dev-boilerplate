# Auditoría Comparativa: project-starter vs boilerplate

> **Fecha:** 2026-04-06
> **Repos comparados:**
>
> - **A** (este repo): `ai-driven-project-starter`
> - **B** (referencia): `ai-driven-test-automation-boilerplate`
>
> **Objetivo:** Identificar divergencias de contenido para alinear A con las últimas actualizaciones de B.

---

## Resumen Ejecutivo

| Dimensión                        | project-starter (A)                     | boilerplate (B)        |
| -------------------------------- | --------------------------------------- | ---------------------- |
| **Idioma**                       | Español (prompts) / Inglés (guidelines) | Inglés completo        |
| **Nomenclatura**                 | "Fase 1-14" (ciclo completo)            | "Stage 1-6" (ciclo QA) |
| **Paths de test**                | `qa/tests/...`                          | `tests/...`            |
| **Roles**                        | DEV + QA + TAE                          | QA + TAE               |
| **Última actualización general** | Dic 2025 – Mar 2026                     | Feb – Abr 2026         |

### Veredicto Global

**El boilerplate (B) es la versión más evolucionada** en la mayoría de áreas de contenido QA/TAE. El project-starter (A) tiene ventajas en: guidelines DEV, archivos de context-engineering, y algunas secciones exclusivas de docs (UI, observability, research, project-management).

---

## 1. Guidelines QA (`.context/guidelines/QA/`)

| Archivo                      | Estado            | Más actualizado | Detalle                                                                                                         |
| ---------------------------- | ----------------- | --------------- | --------------------------------------------------------------------------------------------------------------- |
| `spec-driven-testing.md`     | IDÉNTICO          | --              | Sin cambios                                                                                                     |
| `jira-test-management.md`    | IDÉNTICO          | --              | Sin cambios                                                                                                     |
| `exploratory-testing.md`     | Diff menor        | **A**           | A eliminó referencia rota a `mcp-usage-tips.md`; B aún la tiene                                                 |
| `atc-definition-strategy.md` | **MUY DIFERENTE** | **B**           | B introduce modelo "Precondition + Action" para identidad de TC, sección de Terminología, anti-patrón adicional |
| `README.md`                  | Diff menor        | **B**           | B lista 2 archivos nuevos en tabla de contenidos                                                                |
| `test-spec-standards.md`     | **SOLO EN B**     | **B**           | 416 líneas: TC Discovery Scopes, TC Identity Rule, diseño de TCs, formato de documentación                      |
| `test-hierarchy.md`          | **SOLO EN B**     | **B**           | 143 líneas: jerarquía de 5 niveles (Module→Feature→Ticket→Scenario→ATC), mapeo doc-to-code                      |

### Hallazgo clave

B evolucionó hacia el modelo **"TC = Precondition + Action"** que afecta 3 archivos (atc-definition-strategy, test-spec-standards, test-hierarchy). A todavía usa el modelo simplificado "1 AC = 1 ATC".

---

## 2. Guidelines TAE (`.context/guidelines/TAE/`)

| Archivo                           | Estado            | Más actualizado |
| --------------------------------- | ----------------- | --------------- | ------------------------------------------------------------------------------------------------------------------------------------ |
| `kata-architecture.md`            | IDÉNTICO          | --              |
| `api-testing-patterns.md`         | IDÉNTICO          | --              |
| `e2e-testing-patterns.md`         | IDÉNTICO          | --              |
| `ci-cd-integration.md`            | IDÉNTICO          | --              |
| `data-testid-usage.md`            | IDÉNTICO          | --              |
| `openapi-integration.md`          | IDÉNTICO          | --              |
| `playwright-automation-system.md` | IDÉNTICO          | --              |
| `typescript-patterns.md`          | Diff menor        | --              | Placeholders `PROJ-001` vs `TK-101`                                                                                                  |
| `README.md`                       | Diff menor        | **B**           | B tiene sección "Auto-Generated" con kata-manifest                                                                                   |
| `kata-ai-index.md`                | Diff menor        | **B**           | B tiene nav row extra y sección "Auto-Generated Context"                                                                             |
| `automation-standards.md`         | Diff menor        | **B**           | B tiene comment separators mejorados y 6 referencias extra a prompts                                                                 |
| `tms-integration.md`              | Diff menor        | --              | Solo path de Xray CLI difiere (`cli/xray/` vs `cli/xray.ts`)                                                                         |
| `atc-tracing-system.md`           | **MUY DIFERENTE** | **B**           | B corrige semántica del report: `total` = ATCs únicos, nuevo campo `executions`, teardown reescrito                                  |
| `test-design-principles.md`       | **MUY DIFERENTE** | **B**           | B agrega "TC Identity Rule: Precondition + Action" (~40 líneas nuevas), Quick Summary expandido                                      |
| `test-data-management.md`         | **MUY DIFERENTE** | **B**           | B reescribe filosofía (Discover/Modify/Generate), agrega secciones 4 y 5 completas (Data Patterns + Precondition Placement Strategy) |

### Hallazgo clave

3 archivos TAE críticos divergen significativamente. B tiene: corrección de semántica de reportes ATC, regla de identidad TC, y estrategia de datos Discover/Modify/Generate con placement de precondiciones.

---

## 3. Prompts: Shift-Left / Planning (`.prompts/fase-5-*` vs `stage-1-*`)

| Archivo (A → B)           | Estado             | Más actualizado |
| ------------------------- | ------------------ | --------------- | -------------------------------------------------------------------------------------------------- |
| `README.md`               | **MUY DIFERENTE**  | **B**           | B agrega Triage Decision, Entry/Exit Criteria                                                      |
| `acceptance-test-plan.md` | **MUY DIFERENTE**  | **B**           | B agrega **Phase 0: TRIAGE** completo (veto conditions, risk scoring 0-14, data feasibility check) |
| `feature-test-plan.md`    | Mayormente similar | **Mixto**       | A tiene Custom Field Sync; B tiene referencia desactualizada a `story-test-cases.md`               |

### Hallazgo clave

B introduce un **mecanismo de Triage (Phase 0)** en acceptance-test-plan.md con: condiciones SKIP/REQUIRE, cálculo de Risk Score (7 factores), y Data Feasibility Check. A no tiene nada de esto.

---

## 4. Prompts: Exploratory Testing (`.prompts/fase-10-*` vs `stage-2-*` + `stage-3-*`)

| Archivo (A → B)                                  | Estado             | Más actualizado |
| ------------------------------------------------ | ------------------ | --------------- | ------------------------------------------------------------------------------------------ |
| `README.md`                                      | **MUY DIFERENTE**  | **B**           | B agrega Entry/Exit Criteria, Key Concepts, When to Re-run, Output Files Location          |
| `exploratory-test.md` → `ui-exploration.md`      | Mayormente similar | **B**           | B agrega callout "TCs as Guides"                                                           |
| `exploratory-api-test.md` → `api-exploration.md` | Mayormente similar | **B**           | B agrega callout TCs, renombra Trifuerza→Triforce                                          |
| `exploratory-db-test.md` → `db-exploration.md`   | Mayormente similar | **B**           | B agrega callout TCs, markdown más limpio                                                  |
| `bug-report.md`                                  | **MUY DIFERENTE**  | **B**           | B: inglés completo, agrega `customfield_10049` (Root Cause Text), URL genérica, sin emojis |
| `smoke-test.md`                                  | **MUY DIFERENTE**  | **B**           | B: inglés completo, agrega callout TCs, referencias actualizadas                           |
| `stage-3-reporting/README.md`                    | **SOLO EN B**      | **B**           | Overview del stage de reporting                                                            |
| `stage-3-reporting/test-report.md`               | **SOLO EN B**      | **B**           | 373 líneas: workflow ATR Test Report completo                                              |

### Hallazgo clave

B agrega el patrón **"TCs as Guides"** en todos los prompts de exploración y tiene un **stage-3-reporting** separado con un prompt de test-report.md completamente nuevo.

---

## 5. Prompts: Test Documentation (`.prompts/fase-11-*` vs `stage-4-*`)

| Archivo                  | Estado            | Más actualizado |
| ------------------------ | ----------------- | --------------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| `README.md`              | **MUY DIFERENTE** | **B**           | B agrega Prioritization Framework (fórmula ROI), Workflow Status Transitions detallados, Entry/Exit Criteria, paths para TCs diferidos |
| `test-documentation.md`  | ~98% idéntico     | --              | Solo idioma (ES vs EN) y paths                                                                                                         |
| `test-analysis.md`       | ~95% idéntico     | **B**           | B agrega nota de skip-guidance si Stage 1 ya fue completado                                                                            |
| `test-prioritization.md` | ~99% idéntico     | --              | Solo idioma                                                                                                                            |

---

## 6. Prompts: Test Automation (`.prompts/fase-12-*` vs `stage-5-*` + `stage-6-*`)

| Archivo (A → B)                                        | Estado             | Más actualizado |
| ------------------------------------------------------ | ------------------ | --------------- | ---------------------------------------------------------------------------------------------------------- |
| `README.md`                                            | **MUY DIFERENTE**  | **B**           | B tiene Ticket ID Convention, TMS Workflow Status Transitions                                              |
| `e2e-plan.md` → `test-implementation-plan.md`          | **MUY DIFERENTE**  | **B**           | B unifica E2E+Integration en un solo plan, agrega Xray CLI, MCP Atlassian, Data Strategy                   |
| _(no existe)_ → `atc-implementation-plan.md`           | **SOLO EN B**      | **B**           | Especificación per-ATC con templates API/UI                                                                |
| _(no existe)_ → `module-test-specification.md`         | **SOLO EN B**      | **B**           | Planificación macro con investigación multi-agente                                                         |
| `e2e-coding.md` → `e2e-test-coding.md`                 | Mayormente similar | **B**           | B agrega Phase 1.5 (Test Data Strategy), Phase 8 (TMS Update), Steps module                                |
| `integration-coding.md` → `integration-test-coding.md` | Mayormente similar | **B**           | Mismas adiciones que E2E coding                                                                            |
| `e2e-review.md` → `e2e-test-review.md`                 | Mayormente similar | **B**           | B referencia `test-design-principles.md` en lugar de `typescript-patterns.md`                              |
| `integration-review.md` → `integration-test-review.md` | **MUY DIFERENTE**  | **B**           | B tiene **36 checks** vs 23 en A (agrega Type Safety, Assertion Quality, Test Coverage, Test Independence) |
| `regression-analysis.md`                               | Idéntico (idioma)  | --              | Solo ES vs EN                                                                                              |
| `regression-execution.md`                              | Idéntico (idioma)  | --              | Solo ES vs EN                                                                                              |
| `regression-report.md`                                 | Idéntico (idioma)  | --              | Solo ES vs EN                                                                                              |

### Hallazgo clave

B tiene **2 prompts de planning completamente nuevos** (atc-implementation-plan, module-test-specification) y un integration-review significativamente más completo (+13 checks).

---

## 7. Docs: Methodology (`docs/methodology/`)

| Archivo                 | Estado             | Más actualizado |
| ----------------------- | ------------------ | --------------- | ----------------------------------------------- |
| `kata-fundamentals.md`  | Mayormente similar | --              | Solo formato de tablas                          |
| `IQL-methodology.md`    | Mayormente similar | --              | Solo formato                                    |
| `early-game-testing.md` | Mayormente similar | --              | Solo formato                                    |
| `mid-game-testing.md`   | Mayormente similar | --              | Solo formato                                    |
| `late-game-testing.md`  | Mayormente similar | --              | Solo formato                                    |
| `jira-platform.md`      | Diff menor         | **A**           | A refleja refactor `cli/xray/index.ts` (Mar 28) |
| `README.md`             | Mayormente similar | --              | Solo formato                                    |

**Nota:** A usa links relativos correctos (`./file.md`), B usa links root-relative (`docs/methodology/file.md`) que podrían no funcionar en todos los renderers.

---

## 8. Docs: Testing (`docs/testing/`)

| Subdirectorio                          | A                   | B                    | Detalle                                                                |
| -------------------------------------- | ------------------- | -------------------- | ---------------------------------------------------------------------- |
| `api/` (7 archivos)                    | ✅                  | ✅                   | Mayormente similar (formato)                                           |
| `database/` (4 archivos)               | ✅                  | ✅                   | Mayormente similar (formato)                                           |
| `automation/fundamentals.md`           | ✅                  | ✅                   | **B tiene más contenido** (KATA component pattern, Screenplay Pattern) |
| `automation/dependency-injection.md`   | ✅ (ES, 363 líneas) | ✅ (EN, 553 líneas)  | **B tiene +52% contenido** (TestFixture, Lazy Loading, Shared Context) |
| `automation/playwright-api-testing.md` | ✅ (ES, 507 líneas) | ✅ (EN, 1028 líneas) | **B tiene +103% contenido** (KATA examples completos)                  |
| `automation/playwright-framework.md`   | ✅ (ES, 327 líneas) | ✅ (EN, 512 líneas)  | **B tiene +57% contenido** (VS Code Extension, File Matching)          |
| `ui/` (4 archivos)                     | ✅                  | ❌                   | **Solo en A**                                                          |
| `project-management/` (3 archivos)     | ✅                  | ❌                   | **Solo en A**                                                          |
| `observability/` (3 archivos)          | ✅                  | ❌                   | **Solo en A**                                                          |
| `research/` (3 archivos)               | ✅                  | ❌                   | **Solo en A**                                                          |

### Hallazgo clave

4 archivos de `automation/` en A están en español con significativamente menos contenido que B. Pero A tiene 4 directorios exclusivos (ui, project-management, observability, research) que B no tiene.

---

## 9. Docs: Workflows (`docs/workflows/`)

| Archivo                        | A   | B   | Detalle                                   |
| ------------------------------ | --- | --- | ----------------------------------------- |
| `README.md`                    | ✅  | ✅  | Formato                                   |
| `environments.md`              | ✅  | ✅  | Formato                                   |
| `git-flow.md`                  | ✅  | ✅  | Formato                                   |
| `test-automation-lifecycle.md` | ✅  | ✅  | **B tiene paths de prompts más actuales** |
| `test-manual-lifecycle.md`     | ✅  | ✅  | Formato                                   |
| `sync-openapi-guide.md`        | ✅  | ❌  | **Solo en A**                             |
| `update-template-guide.md`     | ✅  | ❌  | **Solo en A**                             |

---

## 10. Skills (`.agents/skills/` vs `.claude/skills/`)

| Skill                     | Estado                  | Detalle                                          |
| ------------------------- | ----------------------- | ------------------------------------------------ |
| `playwright-cli/SKILL.md` | Funcionalmente idéntico | A tiene formato prettier (Mar 22)                |
| `xray-cli/SKILL.md`       | Funcionalmente idéntico | Solo estilo de bullet (`-` vs `*`)               |
| `references/*.md`         | Funcionalmente idéntico | A tiene tablas prettificadas y GraphQL expandido |

**Sin acción requerida** -- las diferencias son puramente cosméticas.

---

## 11. Context Root (`.context/`)

| Archivo                     | A            | B            | Detalle                                                     |
| --------------------------- | ------------ | ------------ | ----------------------------------------------------------- |
| `README.md`                 | ES, Dic 2025 | EN, Abr 2026 | **B más actualizado**, reestructurado a Discovery+QA Stages |
| `context-engineering.md`    | ✅ (30KB)    | ❌           | **Solo en A**: arquitectura completa 14 fases               |
| `system-prompt.md`          | ✅ (6.5KB)   | ❌           | **Solo en A**: template de system prompt                    |
| `test-management-system.md` | ❌           | ✅ (49KB)    | **Solo en B**: IQL methodology, Xray Cloud integration      |
| `mcp-usage-tips.md`         | ❌           | ✅ (12.5KB)  | **Solo en B**: guía MCP completa                            |

---

## 12. Guidelines Root + DEV (`.context/guidelines/`)

| Archivo                        | A              | B            | Detalle                                                                       |
| ------------------------------ | -------------- | ------------ | ----------------------------------------------------------------------------- |
| `README.md`                    | ES, 3 roles    | EN, 2 roles  | B no tiene DEV/                                                               |
| `code-standards.md`            | En `DEV/` (ES) | En root (EN) | **B agrega sección "Function Parameters"**                                    |
| `mcp-usage-tips.md`            | ❌             | ✅           | Solo en B                                                                     |
| `DEV/` directorio (5 archivos) | ✅             | ❌           | **Solo en A**: data-testid-standards, error-handling, spec-driven-development |

---

## Estadísticas de Divergencia

| Categoría             | Idénticos | Diffs menores | Muy diferentes | Solo en A | Solo en B |
| --------------------- | :-------: | :-----------: | :------------: | :-------: | :-------: |
| Guidelines QA         |     2     |       2       |       1        |     0     |     2     |
| Guidelines TAE        |     8     |       4       |       3        |     0     |     0     |
| Prompts Planning      |     0     |       1       |       2        |     0     |     0     |
| Prompts Exploratory   |     0     |       3       |       3        |     0     |     2     |
| Prompts Documentation |     0     |       2       |       1        |     0     |     0     |
| Prompts Automation    |     3     |       4       |       3        |     0     |     2     |
| docs/methodology      |     0     |       7       |       0        |     0     |     0     |
| docs/testing          |     0     |      12       |       4        |    13     |     0     |
| docs/workflows        |     0     |       4       |       0        |     2     |     0     |
| Skills                |     0     |      10       |       0        |     0     |     0     |
| Context root          |     0     |       0       |       1        |     2     |     2     |
| Guidelines root       |     0     |       1       |       1        |     5     |     1     |
| **TOTAL**             |  **13**   |    **50**     |     **19**     |  **22**   |   **9**   |

---

## Archivos Exclusivos por Repo

### Solo en A (conservar — son propios del starter)

- `.context/context-engineering.md` — arquitectura 14 fases
- `.context/system-prompt.md` — template de system prompt
- `.context/guidelines/DEV/` — 5 archivos de guidelines DEV
- `docs/testing/ui/` — 4 archivos
- `docs/testing/project-management/` — 3 archivos
- `docs/testing/observability/` — 3 archivos
- `docs/testing/research/` — 3 archivos
- `docs/workflows/sync-openapi-guide.md`
- `docs/workflows/update-template-guide.md`

### Solo en B (candidatos a incorporar en A)

- `.context/guidelines/QA/test-spec-standards.md` — TC Discovery + Identity Rule
- `.context/guidelines/QA/test-hierarchy.md` — jerarquía de 5 niveles
- `.context/test-management-system.md` — IQL + Xray Cloud (49KB)
- `.context/guidelines/mcp-usage-tips.md` — guía MCP
- `.prompts/stage-3-reporting/test-report.md` — ATR Test Report workflow
- `.prompts/stage-5-automation/planning/atc-implementation-plan.md` — spec per-ATC
- `.prompts/stage-5-automation/planning/module-test-specification.md` — planificación macro
- `code-standards.md` sección "Function Parameters" — regla Max 2 Positional Params
- `.context/README.md` — versión reestructurada con Discovery+QA Stages
