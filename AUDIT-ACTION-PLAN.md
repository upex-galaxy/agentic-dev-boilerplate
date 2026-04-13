# Plan de Acción: Sincronizar project-starter con boilerplate

> **Fecha:** 2026-04-06
> **Fuente de verdad:** `ai-driven-test-automation-boilerplate` (B)
> **Destino:** `ai-driven-project-starter` (A)
>
> **Principio:** Traer las mejoras de contenido de B → A, manteniendo la estructura y archivos exclusivos de A.

---

## Prioridades

| Prioridad        | Criterio                                                                                        |
| ---------------- | ----------------------------------------------------------------------------------------------- |
| **P0 — Crítica** | Contenido nuevo que introduce conceptos fundamentales (TC Identity Rule, Triage, Data Strategy) |
| **P1 — Alta**    | Archivos significativamente divergentes que afectan la calidad del workflow                     |
| **P2 — Media**   | Archivos nuevos en B que complementan el flujo existente                                        |
| **P3 — Baja**    | Diffs menores, traducciones, formato                                                            |

---

## P0 — Cambios Críticos (Conceptos Fundamentales)

### 0.1 Incorporar modelo "TC = Precondition + Action" en Guidelines QA

**Archivos afectados:**

- `COPIAR` → `.context/guidelines/QA/test-spec-standards.md` (nuevo, 416 líneas)
- `COPIAR` → `.context/guidelines/QA/test-hierarchy.md` (nuevo, 143 líneas)
- `ACTUALIZAR` → `.context/guidelines/QA/atc-definition-strategy.md`
- `ACTUALIZAR` → `.context/guidelines/QA/README.md` (agregar 2 entradas a tabla de contenidos)

**Qué traer de B:**

- Sección "Terminology" (Test Ticket, TC, TS, ATC)
- Step 1 reescrito: "Identify Unique Precondition + Action Combinations"
- Sub-sección "What about multiple assertions?"
- Anti-patrón adicional: "Splitting by UI concern"

**Nota de idioma:** Estos archivos están en inglés en ambos repos, así que se pueden copiar directamente.

---

### 0.2 Incorporar TC Identity Rule en Guidelines TAE

**Archivos afectados:**

- `ACTUALIZAR` → `.context/guidelines/TAE/test-design-principles.md`

**Qué traer de B:**

- Nuevo punto 2 en Quick Summary sobre "Precondition + Action"
- Nueva sub-sección completa "TC Identity Rule: Precondition + Action" (~40 líneas)
- Párrafo introductorio en sección 4 enlazando a la TC Identity Rule
- Anti-patrón "Splitting by Concern" con enfoque correcto

---

### 0.3 Incorporar estrategia Discover/Modify/Generate en TAE

**Archivos afectados:**

- `ACTUALIZAR` → `.context/guidelines/TAE/test-data-management.md`

**Qué traer de B:**

- Reescritura de sección 1 (Philosophy): Golden Rule → "NEVER hardcode test data"
- Tabla "Test Data Strategy (Priority Order)" con 3 patrones
- Sub-sección "Feasibility Check"
- Principio "Resilience" en tabla de principios
- **Nueva sección 4:** "Data Patterns: Discover, Modify, Generate" (~80 líneas con code examples)
- **Nueva sección 5:** "Precondition Placement Strategy" (~100 líneas: beforeAll vs beforeEach, cleanup, validation)
- Renumeración de secciones subsiguientes

---

### 0.4 Corregir semántica de reportes ATC en TAE

**Archivos afectados:**

- `ACTUALIZAR` → `.context/guidelines/TAE/atc-tracing-system.md`

**Qué traer de B:**

- Sección 4.1: `total` = ATCs únicos (no ejecuciones), nuevo campo `executions`
- Sección 4.3: Reescritura de campo descriptions
- Sección 6.3: Teardown reescrito (lee NDJSON directamente, muestra "ATC Coverage")
- Sección 8: Descripción actualizada de archivo teardown

---

### 0.5 Incorporar Phase 0: TRIAGE en acceptance-test-plan

**Archivos afectados:**

- `ACTUALIZAR` → `.prompts/fase-5-shift-left-testing/acceptance-test-plan.md`
- `ACTUALIZAR` → `.prompts/fase-5-shift-left-testing/README.md`

**Qué traer de B:**

- **Phase 0: TRIAGE** completo:
  - Step 0.0: Check Veto Conditions (tablas SKIP y REQUIRE)
  - Step 0.1: Calculate Risk Score (7 factores, interpretación 0-3/4-7/8+)
  - Step 0.2: Data Feasibility Check (assessment AC-por-AC)
- Actualizar workflow de "10 pasos en 3 partes" → "11 pasos en 4 partes"
- En README: agregar secciones "Triage Decision" y "Entry / Exit Criteria"

**Nota de idioma:** Este prompt está en español en A. Se debe traducir el contenido de B al español, o decidir si se migra a inglés.

---

## P1 — Cambios de Alta Prioridad

### 1.1 Actualizar docs/testing/automation/ (4 archivos en español incompletos)

**Archivos afectados:**

- `REEMPLAZAR` → `docs/testing/automation/dependency-injection.md` (363→553 líneas)
- `REEMPLAZAR` → `docs/testing/automation/playwright-api-testing.md` (507→1028 líneas)
- `REEMPLAZAR` → `docs/testing/automation/playwright-framework.md` (327→512 líneas)
- `ACTUALIZAR` → `docs/testing/automation/fundamentals.md` (381→420 líneas)

**Qué traer de B:**

- dependency-injection: TestFixture examples, Lazy Loading proof, Shared Context patterns, Instance Flow diagrams
- playwright-api-testing: KATA implementation examples completos (~2x contenido)
- playwright-framework: VS Code Extension usage, File Matching, Common Scenarios, Extension vs Terminal comparison
- fundamentals: KATA component pattern con `@atc` decorator, Screenplay Pattern

**Decisión necesaria:** ¿Migrar estos archivos a inglés (como B) o traducir las adiciones al español?

---

### 1.2 Incorporar prompts de automation planning nuevos

**Archivos afectados:**

- `COPIAR` → `.prompts/fase-12-test-automation/planning/atc-implementation-plan.md` (nuevo)
- `COPIAR` → `.prompts/fase-12-test-automation/planning/module-test-specification.md` (nuevo)

**Qué contienen:**

- `atc-implementation-plan.md`: Especificación per-ATC (tipo, assertions split, return type, equivalence partitioning, code templates API/UI)
- `module-test-specification.md`: Planificación macro con investigación multi-agente, master document, TC Identity Rule, infrastructure files (ROADMAP, PROGRESS, SESSION-PROMPT)

**Nota:** Estos son archivos completamente nuevos. Adaptar nomenclatura de paths (`tests/` → `qa/tests/`, `stage-X` → `fase-X`).

---

### 1.3 Expandir integration-test-review

**Archivos afectados:**

- `ACTUALIZAR` → `.prompts/fase-12-test-automation/integration/integration-review.md`

**Qué traer de B:**

- Type Safety Review (TS-01 a TS-06, TU-01 a TU-04): 10 checks nuevos
- Assertion Quality (AS-01 a AS-04): 4 checks nuevos
- Test Coverage (TC-01 a TC-04)
- Test Independence (TI-01 a TI-04)
- Test Data (TD-01 a TD-04)
- Missing Authentication y Missing Error Handling common issues
- Total: de 23 → 36 checks

---

### 1.4 Agregar test-report.md al flujo de exploratory/reporting

**Archivos afectados:**

- `COPIAR` → `.prompts/fase-10-exploratory-testing/test-report.md` (nuevo, 373 líneas)

**Qué contiene:**

- Workflow ATR (Automated Test Report) completo
- Templates para resultados PASSED/FAILED
- Integración con TMS CLI
- Transición de tickets a "Tested"

---

### 1.5 Agregar "TCs as Guides" callout en prompts de exploración

**Archivos afectados:**

- `ACTUALIZAR` → `.prompts/fase-10-exploratory-testing/exploratory-test.md`
- `ACTUALIZAR` → `.prompts/fase-10-exploratory-testing/exploratory-api-test.md`
- `ACTUALIZAR` → `.prompts/fase-10-exploratory-testing/exploratory-db-test.md`
- `ACTUALIZAR` → `.prompts/fase-10-exploratory-testing/smoke-test.md`

**Qué agregar (después del párrafo Purpose):**

```markdown
> **TCs as Guides**: If Test Cases exist from Stage 1 planning, use them as a guide
> but explore freely. Update TC statuses (PASSED/FAILED) as you validate.
> Discovering new scenarios beyond the TCs is expected and encouraged.
```

---

### 1.6 Agregar Test Data Strategy y TMS Update en coding prompts

**Archivos afectados:**

- `ACTUALIZAR` → `.prompts/fase-12-test-automation/e2e/e2e-coding.md`
- `ACTUALIZAR` → `.prompts/fase-12-test-automation/integration/integration-coding.md`

**Qué traer de B:**

- **Phase 1.5: Apply Test Data Strategy** con `test.skip()` guard pattern, Discover/Modify/Generate
- **Phase 8: Update TMS** con paso explícito de actualización TMS

---

## P2 — Cambios de Prioridad Media

### 2.1 Incorporar test-management-system.md

**Archivos afectados:**

- `COPIAR` → `.context/test-management-system.md` (49KB, nuevo)

**Qué contiene:** IQL methodology completa, Xray Cloud integration, test management processes. Evaluar si es relevante para el starter o si es específico del boilerplate.

---

### 2.2 Incorporar mcp-usage-tips.md

**Archivos afectados:**

- `COPIAR` → `.context/guidelines/mcp-usage-tips.md` (12.5KB, nuevo)

**Qué contiene:** Guía completa de uso de cada MCP tool, decision tree, token optimization, Context7 vs Tavily comparison.

**Nota:** Este archivo fue referenciado en B pero A eliminó la referencia rota. Si se incorpora, restaurar la referencia en `exploratory-testing.md`.

---

### 2.3 Actualizar README de prompts de exploración

**Archivos afectados:**

- `ACTUALIZAR` → `.prompts/fase-10-exploratory-testing/README.md`

**Qué traer de B:**

- Entry / Exit Criteria (checkboxes)
- Key Concepts (tabla Smoke vs Exploratory)
- Bug Severity Guidelines summary
- When to Re-run table
- Output Files Location tree

---

### 2.4 Actualizar README de test documentation

**Archivos afectados:**

- `ACTUALIZAR` → `.prompts/fase-11-test-documentation/README.md`

**Qué traer de B:**

- Overview con filosofía "Not all tests belong in regression"
- Prioritization Framework (fórmula ROI, decision tree, expected outcomes)
- Workflow Status Transitions (7 estados detallados)
- Entry/Exit Criteria
- Next Stage con 3 paths (Candidate, Manual, Deferred TCs)

---

### 2.5 Agregar sección "Function Parameters" a code-standards

**Archivos afectados:**

- `ACTUALIZAR` → `.context/guidelines/DEV/code-standards.md`

**Qué traer de B:**

- "Max 2 Positional Parameters Rule" (~40 líneas)
- Interface definitions pattern
- Benefits table

---

### 2.6 Actualizar README de test automation

**Archivos afectados:**

- `ACTUALIZAR` → `.prompts/fase-12-test-automation/README.md`

**Qué traer de B:**

- Ticket ID Convention section
- TMS Workflow Status Transitions section

---

### 2.7 Agregar skip-guidance note en test-analysis

**Archivos afectados:**

- `ACTUALIZAR` → `.prompts/fase-11-test-documentation/test-analysis.md`

**Qué agregar:** Nota al inicio indicando que si Stage 1 (shift-left) ya fue completado, se puede saltar este prompt.

---

## P3 — Cambios de Baja Prioridad

### 3.1 Actualizar bug-report.md (traducción + Root Cause field)

**Archivos afectados:**

- `ACTUALIZAR` → `.prompts/fase-10-exploratory-testing/bug-report.md`

**Qué traer de B:**

- Agregar `customfield_10049` (Root Cause Text) como campo requerido
- Agregar Root Cause al JSON de creación Jira
- Generalizar URL workspace (remover hardcoded `upexgalaxy62`)
- Remover emojis de field names

**Decisión:** ¿Traducir a inglés completo o mantener español con las mejoras?

---

### 3.2 Normalizar Trifuerza → Triforce

**Archivos afectados:**

- `.prompts/fase-10-exploratory-testing/exploratory-api-test.md`
- `.prompts/fase-10-exploratory-testing/exploratory-db-test.md`

**Cambio:** Renombrar "Trifuerza" → "Triforce" en headings y ASCII art de integración.

---

### 3.3 Actualizar diffs menores en TAE guidelines

**Archivos afectados:**

- `.context/guidelines/TAE/README.md` — agregar sección "Auto-Generated" (si aplica)
- `.context/guidelines/TAE/kata-ai-index.md` — agregar nav row y sección "Auto-Generated Context" (si aplica)
- `.context/guidelines/TAE/automation-standards.md` — actualizar comment separators, agregar 6 referencias a prompts

**Nota:** Las referencias a `kata-manifest.json` y `bun run kata:manifest` son específicas del boilerplate. Evaluar si el starter las necesita.

---

### 3.4 Corregir referencia desactualizada en B

**En el boilerplate (B), no en A:**

- `feature-test-plan.md` todavía referencia `story-test-cases.md` (nombre viejo) en vez de `acceptance-test-plan.md`
- Reportar o corregir en B

---

### 3.5 Actualizar test-automation-lifecycle.md paths

**Archivos afectados:**

- `ACTUALIZAR` → `docs/workflows/test-automation-lifecycle.md`

**Qué cambiar:** Actualizar paths de prompts si se reestructuran las carpetas de automation (planning/, coding/, review/).

---

### 3.6 Limpiar markdown en exploratory-db-test.md

**Archivos afectados:**

- `.prompts/fase-10-exploratory-testing/exploratory-db-test.md`

**Qué hacer:** Limpiar fenced code blocks anidados rotos (como B hizo), convertir a indented content.

---

## Decisiones Pendientes

| #   | Decisión                      | Impacto | Opciones                                                        |
| --- | ----------------------------- | ------- | --------------------------------------------------------------- |
| D1  | **Idioma de prompts**         | Alto    | a) Mantener español / b) Migrar a inglés (como B) / c) Bilingüe |
| D2  | **Estructura de carpetas**    | Medio   | a) Mantener `fase-X` / b) Migrar a `stage-X` (como B)           |
| D3  | **Path prefix**               | Medio   | a) Mantener `qa/tests/` / b) Migrar a `tests/` (como B)         |
| D4  | **test-management-system.md** | Medio   | a) Incorporar / b) No aplica al starter                         |
| D5  | **kata-manifest references**  | Bajo    | a) Incorporar / b) Son específicas del boilerplate              |
| D6  | **Steps vs Flows module**     | Bajo    | a) Adoptar "Steps" (como B) / b) Mantener "Flows"               |

---

## Orden de Ejecución Recomendado

```
Semana 1 — P0: Fundamentos
├── 0.1 TC Identity Rule en QA guidelines (copiar 2 archivos + actualizar 2)
├── 0.2 TC Identity Rule en TAE test-design-principles
├── 0.3 Discover/Modify/Generate en TAE test-data-management
├── 0.4 Semántica ATC en TAE atc-tracing-system
└── 0.5 Phase 0 TRIAGE en acceptance-test-plan

Semana 2 — P1: Flujo de trabajo
├── 1.1 docs/testing/automation/ (4 archivos expandidos)
├── 1.2 Nuevos planning prompts (atc-implementation-plan, module-test-spec)
├── 1.3 Expandir integration-review
├── 1.4 Agregar test-report.md
├── 1.5 TCs as Guides callout (4 archivos)
└── 1.6 Test Data Strategy en coding prompts

Semana 3 — P2: Complementos
├── 2.1-2.2 Evaluar e incorporar archivos de context
├── 2.3-2.4 Actualizar READMEs de fases
├── 2.5-2.7 Mejoras menores en guidelines y prompts
└── Tomar decisiones D1-D6

Semana 4 — P3: Pulido
├── 3.1-3.6 Traducciones, normalización, limpieza
└── Validación final de coherencia cross-repo
```

---

## Métricas de Éxito

- [ ] Todos los archivos P0 actualizados y verificados
- [ ] 0 referencias rotas entre archivos
- [ ] Modelo "TC = Precondition + Action" presente en QA + TAE guidelines
- [ ] Estrategia Discover/Modify/Generate documentada
- [ ] Phase 0 TRIAGE operativo en acceptance-test-plan
- [ ] 2 nuevos planning prompts incorporados
- [ ] integration-review con 36+ checks
- [ ] Decisiones D1-D6 tomadas y documentadas
