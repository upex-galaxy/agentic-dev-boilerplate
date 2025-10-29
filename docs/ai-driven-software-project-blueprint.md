# 🎯 AI-DRIVEN SOFTWARE PROJECT BLUEPRINT

**Versión**: 2.0 (Arquitectura Unificada)
**Última actualización**: 2025-10-29
**Autor**: UPEX Galaxy - DOJO AI-Powered Quality Engineer

---

## 📋 ÍNDICE

1. [Filosofía del Sistema](#filosofía-del-sistema)
2. [Detección de Tipo de Proyecto](#detección-de-tipo-de-proyecto)
3. [Arquitectura de Carpetas](#arquitectura-de-carpetas)
4. [Workflow por Fase](#workflow-por-fase)
5. [Estructura Detallada por Fase](#estructura-detallada-por-fase)
6. [Prompts y Guidelines](#prompts-y-guidelines)
7. [Sincronización con Jira](#sincronización-con-jira)

---

## 🎯 FILOSOFÍA DEL SISTEMA

### **Principios Core**

- **AI-First**: Cada documento generado con Context Engineering
- **Shift-Left Native**: QA involucrado desde especificación
- **MCP-Powered**: Integración automática con Jira, Supabase, GitHub
- **Progressive Refinement**: Cada fase alimenta la siguiente
- **Trazabilidad Total**: Todo relacionado en un solo lugar
- **Living Documentation**: Siempre fuentes reales (Supabase MCP), no docs estáticas
- **DRY Always**: Código reutilizable, NO hardcodear

### **Arquitectura Unificada**

TODO se integra en `.context/PBI/` donde cada épica/story es una **carpeta** conteniendo:
- Documentación (Fase 2)
- Pruebas (Fase 3)
- Planes (Fase 4)

**Beneficio:** Para trabajar en una story, la IA lee UNA sola carpeta.

---

## 🔍 DETECCIÓN DE TIPO DE PROYECTO

### **🌱 Greenfield (Desde cero)**
- Sin código base previo
- Workflow: Idea → PRD → SRS → PBI → Implementation

**Señales:**
- No hay `package.json` con dependencias
- No existe `src/`, `app/` con código
- No hay schema de DB
- `.context` vacío

### **🏛️ Legacy (Existente)**
- Código ya implementado
- Workflow: Análisis Reverso → Documentación → Testing → Refactoring

**Señales:**
- `package.json` con dependencies > 5
- Directorio `src/`, `app/` con código
- DB con schema y datos
- Historia de commits

### **Detección Automática (IA ejecuta checks)**

```
1. Verificar código: ¿Existe src/, app/?
2. Verificar deps: ¿package.json con deps > 5?
3. Verificar DB: ¿Migrations? ¿Schema en Supabase? (usar MCP)
4. Verificar git: ¿Commits significativos?

Decisión:
- TODOS fallan → GREENFIELD
- AL MENOS 2 pasan → LEGACY
```

### **Diferencias en Workflow**

| Fase | Greenfield | Legacy |
|------|-----------|--------|
| **0. Análisis** | ❌ No aplica | ✅ Explorar codebase/DB → `legacy-analysis.md` |
| **1. Constitution** | Desde idea | Desde código existente |
| **2. Specification** | PRD/SRS desde cero | Reverse engineering |
| **3. Testing** | Tests para nuevas features | Tests de caracterización primero |
| **4. Planning** | Diseño libre | Adaptarse a arquitectura existente |

---

## 📐 ARQUITECTURA DE CARPETAS

```
.context/
│
├── README.md                          (índice maestro del proyecto)
│
├── idea/                              [FASE 1: Constitution]
│   ├── README.md
│   ├── business-model.md
│   ├── market-context.md
│   └── legacy-analysis.md             (solo para proyectos legacy)
│
├── PRD/                               [FASE 2: Product Requirements]  ⬅️ MAYÚSCULAS
│   ├── README.md
│   ├── executive-summary.md           Problem statement, KPIs, target users
│   ├── user-personas.md               2-3 personas detalladas
│   ├── mvp-scope.md                   Épicas y user stories (must have)
│   └── user-journeys.md               Happy path + edge cases
│
├── SRS/                               [FASE 2: Software Requirements]  ⬅️ MAYÚSCULAS
│   ├── README.md
│   ├── functional-specs.md            FRs mapeados 1:1 con user stories
│   ├── non-functional-specs.md        Performance, security, scalability
│   ├── architecture-specs.md          C4 diagrams, ERD, tech stack
│   └── api-contracts.yaml             OpenAPI 3.0 spec
│
├── PBI/                               [FASES 2-4: Product Backlog]  ⬅️ MAYÚSCULAS
│   ├── README.md
│   ├── epic-tree.md                   Vista high-level del árbol completo
│   │
│   └── epics/
│       │
│       └── EPIC-XXX-nombre/           📁 CARPETA POR ÉPICA
│           │
│           ├── epic.md                [FASE 2] Descripción, scope, acceptance criteria
│           │
│           ├── feature-test-plan.md   [FASE 3] Test strategy a nivel feature
│           │                          - Scope, risk analysis, test data requirements
│           │
│           ├── feature-implementation-plan.md  [FASE 4] Plan técnico a nivel feature
│           │                          - Technical decisions, dependencies, architecture
│           │
│           └── stories/
│               │
│               └── STORY-XXX-nombre/  📁 CARPETA POR STORY
│                   │
│                   ├── story.md       [FASE 2] User story + acceptance criteria (Gherkin)
│                   │
│                   ├── test-cases.md  [FASE 3] Test cases detallados (6+ test cases)
│                   │                  - Refined criteria, positive/negative/boundary tests
│                   │
│                   ├── implementation-plan.md  [FASE 4] Plan específico de esta story
│                   │                  - Steps, technical approach, estimated effort
│                   │
│                   └── [opcionales - IA decide según complejidad]
│                       ├── components.md      (componentes React complejos)
│                       ├── api-details.md     (lógica API compleja)
│                       └── database-changes.md (migrations complejas)
│
├── TAE/                               [FASE 7: Test Automation Engineering]  ⬅️ MAYÚSCULAS
│   ├── README.md
│   ├── test-strategy.md               (generado con prompt)
│   ├── kata-architecture.md           (reference doc - KATA framework completo)
│   ├── kata-implementation-plan.md    (generado con prompt)
│   ├── component-catalog.md           (plantilla para llenar)
│   ├── atc-registry.md                (plantilla para llenar)
│   ├── automation-standards.md        (generado con prompt)
│   ├── test-data-management.md        (reference doc)
│   ├── tms-integration.md             (reference doc)
│   └── ci-cd-integration.md           (reference doc)
│
└── guidelines/                        [FASES 5-6: Implementation]  ⬅️ minúsculas
    ├── README.md
    ├── implementation-workflow.md     Workflow paso a paso para implementar story
    ├── code-standards.md              DRY, naming, TypeScript, testing
    ├── error-handling.md              NO hardcodear, error classes, logging
    ├── context-loading.md             Qué archivos leer en cada fase
    ├── automation-workflow.md         Testing automation con KATA
    └── mcp-usage-tips.md              Cuándo usar Supabase/Atlassian/IDE MCP
```

### **Convenciones de Nomenclatura**

- **Directorios principales en MAYÚSCULAS**: `PRD/`, `SRS/`, `PBI/`, `TAE/` (siglas)
- **Directorios secundarios en minúsculas**: `idea/`, `guidelines/`, `epics/`, `stories/`
- **Archivos siempre en minúsculas con guiones**: `epic-tree.md`, `test-cases.md`

---

## 🔄 WORKFLOW POR FASE

### **FASE 1: Constitution**
**Rol:** Founder/Client
**Output:** `/idea/` completo (2-3 archivos)

---

### **FASE 2: Specification (PRD + SRS + PBI)**
**Rol:** PO/PM/BA
**Output:**
- `/PRD/` completo (4 archivos)
- `/SRS/` completo (4 archivos)
- `/PBI/epic-tree.md` + todas las épicas y stories (estructura inicial)

**Prompts:** Ver `.prompts/fase-2-specification/`

---

### **FASE 3: Shift-Left Testing**
**Rol:** QA

**Por cada épica:**
1. Leer `epic.md`
2. Crear `feature-test-plan.md` (test strategy, risk analysis)

**Por cada story:**
1. Leer `story.md` + PRD + SRS relacionado
2. Refinar acceptance criteria
3. Identificar edge cases
4. Crear `test-cases.md` (6+ test cases)
5. Sincronizar con Jira/Xray

**Prompts:** Ver `.prompts/fase-3-shift-left-testing/`

---

### **FASE 4: Planning**
**Rol:** Dev

**Por cada épica (una vez):**
1. Leer `epic.md` + SRS
2. Tomar decisiones técnicas a nivel feature
3. Crear `feature-implementation-plan.md`

**Por cada story (antes de codear):**
1. Leer `story.md` + `test-cases.md` + `feature-implementation-plan.md`
2. Crear `implementation-plan.md` detallado
3. IA decide si necesita archivos auxiliares (components.md, api-details.md, etc.)

**Prompts:** Ver `.prompts/fase-4-planning/`

---

### **FASE 5-6: Implementation**
**Rol:** Dev (con IA)

1. Cargar contexto completo (leer `implementation-plan.md`)
2. Leer `/guidelines/*.md` (TODOS)
3. Ejecutar subtareas según plan
4. Quality checks después de cada step
5. Usar MCP tools (Supabase, Atlassian)

**Guidelines:** Ver `.context/guidelines/`

---

### **FASE 7: Test Automation Engineering (TAE)**
**Rol:** QA / Test Engineer (con IA)

**Objetivo:** Establecer arquitectura de testing automatizada basada en KATA framework

**Workflow:**
1. Generar Test Strategy (leer PRD + SRS + PBI completo)
2. Diseñar Arquitectura KATA (adaptar KATA al proyecto)
3. Definir Estándares (naming, estructura, best practices)
4. Completar Reference Docs (kata-architecture, TMS, CI/CD)
5. Iniciar Implementación (estructura /tests, TestContext, primeros componentes)

**Output:** Directorio `/TAE` completo (10 archivos) + estructura inicial de `/tests`

**Diferencias Legacy vs Greenfield:**
- **Greenfield**: Diseñar suite completa desde cero
- **Legacy**: Evaluar suite existente → Migrar a KATA o crear desde cero con tests de caracterización primero

**Prompts:** Ver `.prompts/fase-7-tae/` (3 prompts: test-strategy, kata-implementation-plan, automation-standards)

---

## 📋 ESTRUCTURA DETALLADA POR FASE

### **FASE 1: CONSTITUTION**

#### **Carpeta `/idea`**

| Archivo | Contenido | Longitud |
|---------|-----------|----------|
| `README.md` | "Fase 1: Constitución del proyecto" | 1 párrafo |
| `business-model.md` | Business Model Canvas (9 bloques) + Problem Statement + MVP Hypothesis | 2-3 páginas |
| `market-context.md` | Competitive Landscape + Market Opportunity + Trends | 2 páginas |
| `legacy-analysis.md` | Tech stack + Features existentes + Gaps de docs (solo legacy) | 2-3 páginas |

**Prompts:** `.prompts/fase-1-constitution/`

---

### **FASE 2: SPECIFICATION**

#### **Carpeta `/PRD`**

| Archivo | Contenido |
|---------|-----------|
| `executive-summary.md` | Problem Statement + Solution Overview + Success Metrics (3-5 KPIs) + Target Users (2-3 personas breves) |
| `user-personas.md` | 2-3 personas con: Demographics, Goals, Pain Points, Tech Savviness, Quote |
| `mvp-scope.md` | In Scope (5-7 épicas con 3-5 user stories cada una) + Out of Scope + Success Criteria |
| `user-journeys.md` | 2-3 journeys (Happy Path + Edge Cases) con Steps, User Actions, System Responses, Pain Points |

#### **Carpeta `/SRS`**

| Archivo | Contenido |
|---------|-----------|
| `functional-specs.md` | FRs mapeados 1:1 con User Stories. FR-001, FR-002... (Input, Processing, Output, Validations) |
| `non-functional-specs.md` | Performance, Security, Scalability, Accessibility, Browser Support |
| `architecture-specs.md` | System Architecture (C4 Mermaid), Database Design (ERD Mermaid), Tech Stack Justification, Data Flow, Security Architecture |
| `api-contracts.yaml` | OpenAPI 3.0 spec con endpoints, request/response schemas, status codes |

**⚠️ IMPORTANTE:** NO generar SQL schemas estáticos. Usar Supabase MCP para obtener schema real.

#### **Carpeta `/PBI`**

##### **Nivel ÉPICA (Carpeta)**

Archivo `epic.md`:
- **Metadata**: id, jira_id, priority, business_value, estimated_story_points
- **Description**
- **Scope** (In/Out)
- **Acceptance Criteria** (Epic-level)
- **Dependencies** (épicas dependientes, recursos externos)
- **User Stories** (lista con links relativos)

Archivos generados en fases posteriores:
- `feature-test-plan.md` (Fase 3)
- `feature-implementation-plan.md` (Fase 4)

##### **Nivel STORY (Carpeta)**

Archivo `story.md`:
- **Metadata**: id, jira_id, epic_id, title, priority, story_points, assignee, status
- **Description**
- **Acceptance Criteria** (Gherkin: Given/When/Then)
- **Technical Notes** (iniciales)
- **Definition of Done** (checklist)

Archivos generados en fases posteriores:
- `test-cases.md` (Fase 3)
- `implementation-plan.md` (Fase 4)
- Opcionales: `components.md`, `api-details.md`, `database-changes.md` (IA decide)

**Prompts:** `.prompts/fase-2-specification/`

---

### **FASE 3: SHIFT-LEFT TESTING**

#### **Feature Test Plan (epic level)**

Archivo `feature-test-plan.md`:
- **Test Strategy**: Scope (In/Out), Test Levels (unit, integration, e2e), Test Types
- **Test Scope**: Features to test, Features NOT to test
- **Risk Analysis**: High risk areas con Impact, Likelihood, Mitigation
- **Test Data Requirements**: Data needed, Test environments
- **Test Cases Summary**: Total estimado por story
- **Entry/Exit Criteria**

#### **Test Cases (story level)**

Archivo `test-cases.md`:
- **Refined Acceptance Criteria**: Escenarios refinados con datos específicos
- **Test Cases**: Mínimo 6 test cases (3 positive, 2 negative, 1 boundary)
  - TC-001: Related Story, Type, Priority, Preconditions, Test Steps, Expected Result, Test Data
- **Edge Cases Identified**: Listado de casos límite detectados
- **Test Data Summary**: Tabla de tipos de datos

**Prompts:** `.prompts/fase-3-shift-left-testing/`

---

### **FASE 4: PLANNING**

#### **Feature Implementation Plan (epic level)**

Archivo `feature-implementation-plan.md`:
- **Overview**: Alcance, Stack técnico
- **Technical Decisions**: Options considered, Chosen, Reasoning (✅/❌), Implementation notes
- **Shared Dependencies**: Pre-requisitos comunes para todas las stories
- **Architecture Notes**: Folder structure, Design patterns, Third-party libraries
- **Implementation Order**: Orden recomendado de stories con razones
- **Risks & Mitigations**: Riesgos técnicos a nivel feature
- **Success Criteria**: Checklist de feature completa

#### **Implementation Plan (story level)**

Archivo `implementation-plan.md`:
- **Overview**: Qué se va a implementar, Acceptance Criteria a cumplir
- **Technical Approach**: Chosen approach, Alternatives considered, Why this approach
- **Implementation Steps**: Step 1, 2, 3... (Task, Details, Testing, Estimated time)
  - ⚠️ NO incluir SQL estático, usar Supabase MCP
- **Technical Decisions** (story-specific)
- **Dependencies**: Pre-requisitos técnicos
- **Risks & Mitigations**
- **Estimated Effort**: Tabla de steps con tiempos (total debe match story points)
- **Definition of Done Checklist**: Completo con tests específicos

**Prompts:** `.prompts/fase-4-planning/`

---

## 📝 PROMPTS Y GUIDELINES

### **Prompts (Generación de Documentos)**

Todos los prompts están en `.prompts/` organizados por fase:

- **Fase 1:** `fase-1-constitution/` (2 prompts)
- **Fase 2:** `fase-2-specification/` (9 prompts)
- **Fase 3:** `fase-3-shift-left-testing/` (2 prompts)
- **Fase 4:** `fase-4-planning/` (2 prompts)

**Instrucciones de uso:** Ver `.prompts/README.md`

**Características:**
- **Copy-paste ready**: Abrir archivo → Ctrl+A → Ctrl+C → usar
- **Sin código**: Solo texto descriptivo (no ejemplos de código hardcodeados)
- **Detallados**: Máximo nivel de detalle para resultados determinísticos
- **Contexto acumulativo**: Cada prompt pide como input el output de prompts anteriores

---

### **Guidelines (System Prompts para IA)**

Todos los guidelines están en `.context/guidelines/` para fases 5-6:

| Archivo | Propósito |
|---------|-----------|
| `implementation-workflow.md` | Workflow paso a paso para implementar story (leer contexto, verificar plan, breakdown, quality checks) |
| `code-standards.md` | DRY, naming conventions, TypeScript strict, component structure, performance, a11y |
| `error-handling.md` | NO hardcodear fallbacks, structured error responses, custom error classes, retry logic |
| `context-loading.md` | Qué archivos leer en cada fase, Living Documentation (usar MCPs), Context loading checklist |
| `automation-workflow.md` | Testing automation con KATA (POM, AAA pattern, test organization, CI/CD) |
| `mcp-usage-tips.md` | Cuándo usar Supabase MCP, Atlassian MCP, IDE Diagnostics |

**Cuándo leer:** La IA debe leer TODOS los guidelines antes de implementar (Fases 5-6).

---

## 🔗 SINCRONIZACIÓN CON JIRA

### **Flujo Recomendado**

1. **Crear localmente en `/PBI`**
   - Generar epic-tree.md
   - Generar /epics/EPIC-XXX/epic.md
   - Generar /epics/EPIC-XXX/stories/STORY-XXX/story.md

2. **Sincronizar con Jira (Atlassian MCP)**
   - Crear épicas en Jira
   - Crear stories en Jira
   - Obtener IDs de Jira (UPEX-123, etc.)

3. **Actualizar archivos locales**
   - Actualizar `jira_id` en epic.md
   - Actualizar `jira_id` en story.md

4. **IA puede consultar Jira directamente (MCP)**
   - Cuando necesite datos live
   - Para actualizar status de stories

### **Sincronización de Test Cases (Xray)**

- Crear test cases en Xray después de generar `test-cases.md`
- Mapear TC-001, TC-002... con IDs de Xray
- Sincronización automática de resultados (ver TAE/tms-integration.md)

---

## ✅ RESUMEN EJECUTIVO

### **Estructura Final**

```
.context/
├── idea/           (2-3 archivos) - Fase 1
├── PRD/            (4 archivos) - Fase 2
├── SRS/            (4 archivos) - Fase 2
├── PBI/            (estructura de carpetas con épicas y stories) - Fases 2-4
├── TAE/            (10 archivos) - Fase 7
└── guidelines/     (6 archivos) - System prompts para IA
```

### **Beneficios de la Arquitectura Unificada**

✅ **Trazabilidad total**: Todo en una carpeta por story
✅ **Cero duplicación**: No hay árboles separados
✅ **Context Engineering optimizado**: IA lee un lugar
✅ **Workflow natural**: Incremental, no artificial
✅ **Flexible**: Archivos opcionales según complejidad

### **Eliminado (vs versiones anteriores)**

❌ `/refinement` (integrado en `/PBI`)
❌ `/plans` (integrado en `/PBI`)
❌ `/tasking` (reemplazado por `/guidelines`)

### **Fases Totales del Blueprint**

1. **Constitution** (idea de negocio)
2. **Specification** (PRD + SRS + PBI)
3. **Shift-Left Testing** (feature test plans + test cases)
4. **Planning** (feature plans + implementation plans)
5. **Tasking** (breakdown en subtareas atómicas - guiado por guidelines)
6. **Implementation** (desarrollo guiado por guidelines + MCP)
7. **Test Automation Engineering** (arquitectura KATA)

---

**🎯 Arquitectura optimizada para IA. Siguiente paso: Usar prompts de `.prompts/` para generar documentación.** 🚀
