# 🎯 AI-DRIVEN SOFTWARE PROJECT BLUEPRINT

**Versión**: 2.0 (Arquitectura Unificada)
**Última actualización**: October 20th, 2025 12:32 PM
**Autor**: UPEX Galaxy - DOJO AI-Powered Quality Engineer

---

## 📋 ÍNDICE

1. [Filosofía del Sistema](#filosofía-del-sistema)
2. [Arquitectura de Carpetas](#arquitectura-de-carpetas)
3. [Workflow Completo](#workflow-completo)
4. [Estructura Detallada por Fase](#estructura-detallada-por-fase)
5. [Prompts Ideales por Fase](#prompts-ideales-por-fase)
6. [Guidelines para IA](#guidelines-para-ia)
7. [Sincronización con Jira](#sincronización-con-jira)

---

## 🎯 FILOSOFÍA DEL SISTEMA

### **Principios Core**

1. **AI-First**: Cada documento se genera con Context Engineering
2. **Shift-Left Native**: QA involucrado desde la especificación
3. **MCP-Powered**: Integración automática con Jira, Supabase, GitHub
4. **Progressive Refinement**: Cada fase alimenta la siguiente
5. **Trazabilidad Total**: Todo relacionado en un solo lugar
6. **Living Documentation**: Siempre usar fuentes reales (Supabase MCP), no docs estáticas
7. **DRY Always**: Don't Repeat Yourself - código reutilizable, NO hardcodear

### **Concepto Revolucionario**

**Arquitectura Unificada**: En lugar de tener carpetas separadas para `/pbi`, `/plans`, `/refinement`, TODO se integra en un único directorio `/pbi` donde cada épica y cada story es una **carpeta** conteniendo:

- Documentación (Fase 2: Specification)
- Pruebas (Fase 3: Shift-Left Testing)
- Planes de implementación (Fase 4: Planning)

**Beneficio**: Trazabilidad completa. Para trabajar en una story, la IA lee UNA sola carpeta.

---

## 🔍 DETECCIÓN DE TIPO DE PROYECTO

### **Legacy vs Greenfield: Dos Escenarios Diferentes**

Este blueprint está diseñado para adaptarse a **dos escenarios** fundamentales:

#### **🌱 Greenfield Project (Proyecto desde cero)**

**Características:**
- No existe código base previo
- Se inicia desde la idea de negocio
- Total libertad arquitectónica
- Workflow: Idea → PRD → SRS → PBI → Implementation

**Señales de detección:**
- No hay `package.json`, `requirements.txt`, `pom.xml` con dependencias
- No existe directorio `src/`, `app/`, o similar con código
- No hay schema de base de datos existente
- No hay historia de commits significativa
- El directorio `.context` está vacío o con placeholders

---

#### **🏛️ Legacy Project (Proyecto existente)**

**Características:**
- Código base ya implementado (parcial o completo)
- Puede o no tener documentación
- Arquitectura y decisiones técnicas ya tomadas
- Workflow: Análisis Reverso → Documentación → Testing → Refactoring

**Señales de detección:**
- Existe `package.json`/`requirements.txt` con dependencias instaladas
- Directorio `src/`, `app/`, `lib/` con código funcional
- Base de datos con schema y datos (migrations existentes)
- Historia de commits con features implementadas
- Endpoints/rutas funcionando
- Usuarios reales o en QA/staging

---

### **Criterios de Detección Automática**

La IA debe ejecutar estos checks al iniciar:

```md
**Paso 1: Verificar existencia de código**
- ¿Existe directorio con código fuente? (`src/`, `app/`, `lib/`)
- ¿Hay archivos de configuración de frameworks? (`next.config.js`, `tsconfig.json`)

**Paso 2: Verificar dependencias**
- ¿Existe `package.json` con dependencies > 5?
- ¿Existe `package-lock.json` o `bun.lockb`?

**Paso 3: Verificar base de datos**
- ¿Hay carpeta `migrations/` con archivos?
- ¿Hay schema definido en Supabase? (usar Supabase MCP: `list_tables`)

**Paso 4: Verificar git history**
- ¿Existen commits más allá del initial commit?
- ¿Hay branches además de main?

**Decisión:**
- Si **TODOS** los checks fallan → **GREENFIELD**
- Si **AL MENOS 2** checks pasan → **LEGACY**
```

---

### **Diferencias en el Workflow**

| Fase | Greenfield | Legacy |
|------|-----------|--------|
| **0. Análisis Reverso** | ❌ No aplica | ✅ Explorar codebase, DB, funcionalidad existente |
| **1. Constitution** | Generar desde idea de negocio | Extraer business model del código/features existentes |
| **2. Specification** | Crear PRD/SRS desde cero | Generar PRD/SRS basado en funcionalidad actual (reverse engineering) |
| **3. Shift-Left Testing** | Diseñar tests para features nuevas | Tests de caracterización primero, luego expansión |
| **4. Planning** | Diseño arquitectónico libre | Adaptarse a arquitectura existente |
| **5-6. Implementation** | Construir desde cero | Refactoring incremental + nuevas features |
| **7. TAE** | Diseñar suite desde cero con KATA | Migrar suite existente a KATA (si hay) o crear desde cero |

---

### **Fase 0 (Solo Legacy): Análisis y Documentación Reversa**

Cuando se detecta proyecto legacy, **ANTES** de generar cualquier documento, la IA debe:

**0.1 Explorar Codebase**
- Usar `Glob` para mapear estructura de archivos
- Usar `Grep` para encontrar componentes clave (API routes, pages, schemas)
- Leer archivos principales (`package.json`, `README.md`, configs)

**0.2 Analizar Base de Datos**
- Usar Supabase MCP: `list_tables`
- Usar Supabase MCP: `execute_sql` para ver schema completo
- Identificar entidades, relaciones, constraints

**0.3 Identificar Features Existentes**
- Mapear rutas/endpoints activos
- Identificar páginas/vistas existentes
- Listar funcionalidades por área (auth, payments, admin, etc.)

**0.4 Generar Reporte de Análisis**
- Crear `.context/idea/legacy-analysis.md` con:
  - Tech stack identificado
  - Features existentes mapeadas
  - Gaps de documentación detectados
  - Recomendaciones para generar docs

**Output de Fase 0:**
- `legacy-analysis.md` → Input para Fase 1 (Constitution)

---

### **Adaptaciones Específicas por Fase**

#### **Fase 1: Constitution (Legacy)**

**Prompt adaptado:**
```md
Actúa como Business Analyst y Product Archaeologist.

**Contexto:**
Tengo un proyecto legacy con código existente pero sin documentación de negocio.

**Input:**
- legacy-analysis.md: [pegar análisis de código]
- Features identificadas: [lista de funcionalidades]
- Database schema: [schema de Supabase]

**Tarea:**
Reconstruir el Business Model Canvas haciendo ingeniería reversa:
1. Customer Segments: ¿A quién sirve este código?
2. Value Propositions: ¿Qué problema resuelven estas features?
3. Revenue Streams: ¿Cómo monetiza? (inferir de código de payments, subscriptions)
...
```

#### **Fase 2: Specification (Legacy)**

**Adaptación PRD:**
- Generar PRD basado en features existentes (no desde idea)
- Mapear user journeys actuales (no ideales)
- Identificar gaps entre funcionalidad actual y deseable

**Adaptación SRS:**
- Documentar arquitectura actual (no diseñar nueva)
- Generar ERD desde schema real de DB
- Crear OpenAPI spec desde endpoints existentes (no diseñar API)

#### **Fase 3: Shift-Left Testing (Legacy)**

**Enfoque diferente:**
1. **Tests de Caracterización** primero:
   - Capturar comportamiento actual (aunque sea buggy)
   - Safety net para refactoring
2. **Tests de Regresión**:
   - Asegurar que features existentes no se rompan
3. **Tests de Nuevas Features**:
   - Aplicar shift-left normal para expansión

#### **Fase 7: TAE (Legacy)**

**Estrategia específica:**
- Si ya existe suite de tests → Migrar a KATA incrementalmente
- Si no hay tests → Priorizar tests de caracterización
- Enfoque: Estabilizar primero, expandir después

---

### **Flowchart de Decisión**

```
Inicio
  ↓
Detectar tipo de proyecto
  ↓
  ├─ GREENFIELD → Fase 1: Constitution (desde idea)
  │                ↓
  │              Workflow normal del blueprint
  │
  └─ LEGACY → Fase 0: Análisis Reverso
                ↓
              Generar legacy-analysis.md
                ↓
              Fase 1: Constitution (desde código)
                ↓
              Workflow adaptado (reverse engineering)
```

---

## 📐 ARQUITECTURA DE CARPETAS

```
.context
│
├── README.md (índice maestro del proyecto)
│
├── /idea (Fase 1: Constitución)
│   ├── README.md
│   ├── business-model.md
│   ├── market-context.md
│   └── legacy-analysis.md (solo para proyectos legacy - Fase 0)
│
├── /prd (Fase 2: Product Requirements Document)
│   ├── README.md
│   ├── executive-summary.md
│   ├── user-personas.md
│   ├── mvp-scope.md
│   └── user-journeys.md
│
├── /srs (Fase 2: Software Requirements Specification)
│   ├── README.md
│   ├── functional-specs.md
│   ├── non-functional-specs.md
│   ├── architecture-specs.md
│   └── api-contracts.yaml
│
├── /pbi (Fase 2 + 3 + 4: Product Backlog Items - TODO INTEGRADO)
│   ├── README.md
│   ├── epic-tree.md (vista high-level del árbol completo)
│   └── /epics
│       └── /EPIC-001-user-authentication (📁 CARPETA)
│           ├── epic.md (detalles de la épica)
│           ├── feature-test-plan.md (plan de pruebas a nivel feature)
│           ├── feature-implementation-plan.md (plan maestro de implementación)
│           └── /stories
/pbi/epics/EPIC-MYM-2-user-authentication/stories/STORY-MYM-3-register-with-email (📁 CARPETA)
│                   ├── story.md (detalles US + acceptance criteria)
│                   ├── test-cases.md (casos de prueba Shift-Left)
│                   ├── implementation-plan.md (plan específico de esta story)
│                   └── [archivos opcionales según complejidad - IA decide]
│
├── /tae (Fase 7: Test Automation Engineering - NUEVO)
│   ├── README.md
│   ├── test-strategy.md (estrategia general - generado con prompt)
│   ├── kata-architecture.md (arquitectura KATA aplicada - reference)
│   ├── kata-implementation-plan.md (plan específico - generado con prompt)
│   ├── component-catalog.md (catálogo de componentes - plantilla)
│   ├── atc-registry.md (registro de ATCs - plantilla)
│   ├── automation-standards.md (estándares de código - generado con prompt)
│   ├── test-data-management.md (gestión de datos de prueba - reference)
│   ├── tms-integration.md (integración TMS - reference)
│   └── ci-cd-integration.md (integración CI/CD - reference)
│
└── /guidelines (System prompts para IA - Fases 5-6)
    ├── README.md
    ├── implementation-workflow.md
    ├── code-standards.md
    ├── error-handling.md
    ├── context-loading.md
    ├── automation-workflow.md
    └── mcp-usage-tips.md
```

---

## 🔄 WORKFLOW COMPLETO

### **Fase 1: Constitution**

**Rol**: Founder/Client
**Output**: `/idea/` completo

---

### **Fase 2: Specification (PRD + SRS + PBI)**

**Rol**: PO/PM/BA
**Output**:

- `/prd/` completo (4 archivos)
- `/srs/` completo (4 archivos)
- `/pbi/epic-tree.md` (high-level)
- `/pbi/epics/EPIC-XXX/epic.md` (todas las épicas)
- `/pbi/epics/EPIC-XXX/stories/STORY-XXX/story.md` (todas las stories)

---

### **Fase 3: Refinement (Shift-Left Testing - integrado en `/pbi`)**

**Rol**: QA

**Por cada épica**:

1. Leer `epic.md`
2. Crear `feature-test-plan.md`
3. Identificar riesgos a nivel feature

**Por cada story a implementar** (durante sprint planning):

1. Leer `story.md` + PRD + SRS relacionado
2. Refinar acceptance criteria
3. Identificar edge cases
4. Crear `test-cases.md`
5. Actualizar Jira con test cases

---

### **Fase 4: Planning (integrado en `/pbi`)**

**Rol**: Dev

**Por cada épica** (una vez, antes de implementar stories):

1. Leer `epic.md` + SRS
2. Decisiones técnicas a nivel feature
3. Crear `feature-implementation-plan.md`

**Por cada story** (justo antes de codear):

1. Leer `story.md` + `test-cases.md` + `feature-implementation-plan.md`
2. Crear `implementation-plan.md` detallado
3. IA decide si necesita archivos auxiliares (components.md, api-details.md, etc.)

---

### **Fase 5: Tasking (guiado por `/guidelines`)**

**Rol**: Dev (con IA)

1. Leer `implementation-plan.md`
2. Leer `/guidelines/implementation-workflow.md`
3. Breakdown en subtareas atómicas
4. Asignar subtareas a IA o Dev

---

### **Fase 6: Implementation (guiado por `/guidelines`)**

**Rol**: Dev (con IA)

1. Cargar contexto completo
2. Leer `/guidelines/*.md`
3. Ejecutar subtareas según plan
4. Quality checks después de cada step
5. Usar MCP tools (Supabase, Atlassian)

---

### **Fase 7: Test Automation Engineering (TAE)**

**Rol**: QA / Test Engineer (con IA)

**Objetivo**: Establecer arquitectura de testing automatizada basada en KATA framework

**Workflow:**

1. **Generar Test Strategy**
   - Leer PRD + SRS + PBI completo
   - Definir capas de testing (unit, integration, e2e)
   - Establecer cobertura esperada
   - Crear `/tae/test-strategy.md` (con prompt)

2. **Diseñar Arquitectura KATA**
   - Adaptar KATA al proyecto específico
   - Identificar componentes API y UI necesarios
   - Planificar estructura de fixtures
   - Crear `/tae/kata-implementation-plan.md` (con prompt)

3. **Definir Estándares**
   - Naming conventions para tests
   - Estructura de componentes
   - Best practices del proyecto
   - Crear `/tae/automation-standards.md` (con prompt)

4. **Completar Reference Docs**
   - Copiar arquitectura KATA adaptada
   - Crear plantillas para catalog y registry
   - Documentar integración TMS y CI/CD
   - Archivos: kata-architecture.md, component-catalog.md, etc.

5. **Iniciar Implementación**
   - Crear estructura de carpetas /tests
   - Implementar TestContext base
   - Crear primeros componentes siguiendo KATA
   - Configurar integración con Xray/TestRail

**Output:**
- Directorio `/tae` completo (10 archivos)
- Estructura inicial de `/tests` implementada
- Configuración de TMS y CI/CD lista

**Diferencias Legacy vs Greenfield:**
- **Greenfield**: Diseñar suite completa desde cero
- **Legacy**: Evaluar suite existente → Migrar a KATA (si hay) o crear desde cero con tests de caracterización primero

---

### **Fases 8-11: Execution, Documentation, Reporting, Maintenance**

**Rol**: QA / Dev
**Práctica**: Ejecución continua de la suite automatizada
**Herramientas**: Playwright, Vitest, Xray, Allure Report, GitHub Actions

**Fase 8**: Test Execution (manual + automatizado)
**Fase 9**: Documentation & Reporting (test results, metrics)
**Fase 10**: CI/CD Automation (GitHub Actions workflows)
**Fase 11**: Regression & Maintenance (suite upkeep, refactoring)

---

## 🎨 ESTRUCTURA DETALLADA POR FASE

### **FASE 1: CONSTITUTION**

#### **Carpeta `/idea`**

```
/idea
├── README.md
│   → "Fase 1: Constitución del proyecto. Define el modelo de negocio,
│      problema a resolver, y contexto de mercado."
│
├── business-model.md
│   → Business Model Canvas (9 bloques)
│   → Problem Statement
│   → MVP Hypothesis (3 hipótesis a validar)
│   → Ligero: 2-3 páginas máximo
│
└── market-context.md
    → Competitive Landscape (Top 3 competidores)
    → Market Opportunity (TAM/SAM/SOM)
    → Trends & Insights (2-3 tendencias)
    → Ligero: 2 páginas máximo
```

---

### **FASE 2: SPECIFICATION**

#### **Carpeta `/prd`**

```
/prd
├── README.md
│
├── executive-summary.md
│   ├── Problem Statement
│   ├── Solution Overview
│   ├── Success Metrics (3-5 KPIs)
│   └── Target Users (2-3 personas breves)
│
├── user-personas.md
│   → 2-3 personas con:
│   ├── Demographics
│   ├── Goals
│   ├── Pain Points
│   ├── Tech Savviness
│   └── Quote representativa
│
├── mvp-scope.md
│   ├── In Scope (Must Have) - 5-7 épicas
│   ├── Out of Scope (Nice to Have)
│   └── Success Criteria
│
└── user-journeys.md
    ├── Happy Path
    ├── Edge Case 1
    └── Edge Case 2
```

---

#### **Carpeta `/srs`**

```
/srs
├── README.md
│
├── functional-specs.md
│   → Mapeo 1:1 con User Stories del PRD
│   → FR-001: [Feature] debe permitir [acción]
│   ├── Relacionado a: Epic X, US Y.Z
│   ├── Input / Processing / Output
│   └── Validations
│
├── non-functional-specs.md
│   ├── Performance (< 2s LCP, < 500ms API)
│   ├── Security (JWT, RBAC, encryption)
│   ├── Scalability (concurrent users, caching)
│   ├── Accessibility (WCAG 2.1 AA)
│   └── Browser Support
│
├── architecture-specs.md
│   ├── System Architecture (Mermaid C4)
│   ├── Database Design (ERD en Mermaid)
│   ├── Tech Stack Justification
│   ├── Data Flow
│   └── Security Architecture
│
│   ⚠️ IMPORTANTE: NO generar SQL schemas estáticos.
│      Indicar que se usará Supabase MCP para obtener
│      schema real en tiempo real.
│
└── api-contracts.yaml
    → OpenAPI 3.0 spec
    ├── Endpoints (GET, POST, PUT, DELETE)
    ├── Request/Response schemas
    ├── Status codes
    └── Authentication headers
```

---

#### **Carpeta `/pbi` (Product Backlog Items)**

##### **Nivel ÉPICA (Carpeta)**

```
/pbi/epics/EPIC-001-user-authentication/
│
├── epic.md
│   ├── Metadata
│   │   ├── id: EPIC-001
│   │   ├── jira_id: null (se llena post-sync)
│   │   ├── priority: High
│   │   ├── business_value: High
│   │   └── estimated_story_points: 21
│   ├── Description
│   ├── Scope (In/Out)
│   ├── Acceptance Criteria (Epic-level)
│   ├── Dependencies (épicas dependientes, recursos externos)
│   └── User Stories (lista con links relativos)
│
├── feature-test-plan.md (FASE 3 - Shift-Left Testing)
│   ├── Test Strategy
│   │   → ¿Cómo testear esta feature?
│   │   → ¿Qué capas? (UI, API, Database)
│   ├── Test Scope
│   │   → Funcionalidades a cubrir
│   │   → Funcionalidades excluidas
│   ├── Risk Analysis
│   │   → ¿Qué puede salir mal?
│   │   → Mitigaciones
│   ├── Test Data Requirements
│   │   → Datos necesarios para testing
│   └── Test Cases Summary
│       → Resumen de casos (detalle va en stories)
│
└── feature-implementation-plan.md (FASE 4 - Planning)
    ├── Overview
    │   → ¿Cómo implementar esta feature?
    │   → Arquitectura general
    ├── Technical Decisions
    │   → Assumptions a nivel feature
    │   → Ej: "Usaremos Supabase Auth para toda la feature"
    ├── Shared Dependencies
    │   → Recursos comunes para todas las stories
    │   → Ej: "Todas las stories requieren Supabase configurado"
    ├── Architecture Notes
    │   → Patrones de diseño a usar
    │   → Librerías/frameworks
    ├── Implementation Order
    │   → ¿En qué orden implementar las stories?
    │   → Dependencies entre stories
    └── Risks & Mitigations
        → Riesgos técnicos a nivel feature
```

---

##### **Nivel STORY (Carpeta)**

```
/pbi/epics/EPIC-001-user-authentication/stories/STORY-001-register-with-email/
│
├── story.md (FASE 2 - Specification)
│   ├── Metadata
│   │   ├── id: STORY-001
│   │   ├── jira_id: null (se llena post-sync)
│   │   ├── epic_id: EPIC-001
│   │   ├── title: Como usuario, quiero registrarme con email
│   │   ├── priority: High
│   │   ├── story_points: 5
│   │   ├── assignee: null
│   │   └── status: To Do
│   ├── Description
│   ├── Acceptance Criteria (Gherkin original)
│   │   ├── Scenario 1: Registro exitoso
│   │   ├── Scenario 2: Email duplicado
│   │   └── Scenario 3: Password débil
│   ├── Technical Notes (iniciales)
│   └── Definition of Done
│
├── test-cases.md (FASE 3 - Shift-Left Testing)
│   ├── Refined Acceptance Criteria
│   │   → Criterios mejorados con edge cases
│   │   → Datos de ejemplo concretos
│   │   → Validaciones específicas
│   │
│   ├── Test Cases
│   │   TC-001: [Título]
│   │   ├── Related Story: STORY-001
│   │   ├── Type: Positive/Negative/Boundary
│   │   ├── Priority: High/Medium/Low
│   │   ├── Preconditions: [Estado inicial]
│   │   ├── Test Steps: [Detallados]
│   │   ├── Expected Result: [Específico]
│   │   └── Test Data: [Concretos]
│   │
│   │   → Generar al menos:
│   │     - 3 test cases positivos
│   │     - 2 test cases negativos
│   │     - 1 test case boundary
│   │
│   └── Edge Cases Identified
│       → Listado de casos límite detectados
│
├── implementation-plan.md (FASE 4 - Planning)
│   ├── Overview
│   │   → ¿Qué se va a implementar?
│   ├── Technical Approach
│   │   → ¿Por qué esta aproximación?
│   │   → Alternativas consideradas
│   ├── Implementation Steps
│   │   Step 1: Database Schema (si aplica)
│   │   ├── ⚠️ NO incluir SQL estático
│   │   ├── Descripción de cambios necesarios
│   │   ├── Usar Supabase MCP: apply_migration
│   │   └── Verificar con: list_tables + execute_sql
│   │
│   │   Step 2: Backend API
│   │   ├── Endpoints a crear
│   │   ├── Input validation (Zod schema)
│   │   ├── Business logic
│   │   ├── Error handling
│   │   └── Response format
│   │
│   │   Step 3: Frontend Components
│   │   ├── Components a crear
│   │   ├── Form fields
│   │   ├── Validations
│   │   ├── Loading/Error states
│   │   └── Styling (TailwindCSS)
│   │
│   │   Step 4: Integration
│   │   └── Flow completo (frontend → backend → DB)
│   │
│   │   Step 5: Testing Preparation
│   │   ├── Test Data (referencia a test-cases.md)
│   │   └── Test Scenarios
│   ├── Technical Decisions
│   │   → Decisiones específicas de esta story
│   │   → Trade-offs
│   ├── Dependencies
│   │   → Pre-requisitos técnicos
│   ├── Risks & Mitigations
│   ├── Estimated Effort
│   │   → Breakdown por step
│   │   → Total (debe match story points)
│   └── Definition of Done Checklist
│       - [ ] Código implementado
│       - [ ] Acceptance Criteria pasando
│       - [ ] Tests unitarios (coverage > 80%)
│       - [ ] Tests de integración
│       - [ ] Code review aprobado
│       - [ ] Sin errores de linting/TypeScript
│       - [ ] Deployed to staging
│
└── [archivos opcionales - IA DECIDE según complejidad]
    ├── components.md (si hay componentes React complejos)
    ├── api-details.md (si hay lógica de API compleja)
    ├── database-changes.md (si hay migrations complejas)
    └── [otros según necesidad]
```

---

### **FASE 7: TEST AUTOMATION ENGINEERING (TAE)**

#### **Carpeta `/tae`**

```
/tae
├── README.md
│   → "Fase 7: Test Automation Engineering. Arquitectura KATA para testing automatizado."
│
├── test-strategy.md (🤖 Generado con prompt)
│   → Estrategia general de testing del proyecto
│   ├── Scope (qué se testea, qué no)
│   ├── Test Levels (unit, integration, e2e)
│   ├── Test Types (functional, regression, smoke, etc.)
│   ├── Coverage Goals (% esperado por capa)
│   ├── Tools & Frameworks (Playwright, Vitest, etc.)
│   ├── Test Environments (local, staging, production)
│   ├── Execution Strategy (cuando corren los tests)
│   ├── Reporting & Metrics (qué métricas trackear)
│   └── Timeline (cronograma de implementación)
│
├── kata-architecture.md (📚 Reference - contenido completo)
│   → Documentación KATA adaptada al proyecto
│   ├── Overview de KATA (filosofía y beneficios)
│   ├── Arquitectura de Capas (TestContext, Base, Components, Fixture, Tests)
│   ├── Conceptos clave (ATCs, Fixed Assertions, Soft Fail)
│   ├── Estructura de directorios aplicada al proyecto
│   ├── Ejemplos específicos del proyecto
│   └── Best practices y convenciones
│
├── kata-implementation-plan.md (🤖 Generado con prompt)
│   → Plan específico de implementación KATA para este proyecto
│   ├── Overview
│   │   → ¿Qué componentes necesitamos?
│   │   → ¿Qué ATCs implementar primero?
│   ├── Component Breakdown
│   │   → Componentes API necesarios (UsersApi, LoansApi, etc.)
│   │   → Componentes UI necesarios (LoginPage, DashboardPage, etc.)
│   ├── Implementation Roadmap
│   │   → Phase 1: Setup (TestContext, Base classes)
│   │   → Phase 2: Core components (auth, CRUD básico)
│   │   → Phase 3: Advanced components (features complejas)
│   ├── ATC Prioritization
│   │   → ATCs críticos a implementar primero
│   │   → Mapeo con test cases de /pbi
│   ├── Migration Strategy (si legacy)
│   │   → ¿Cómo migrar suite existente a KATA?
│   │   → Tests de caracterización primero
│   └── Success Criteria
│       → ¿Cuándo está completa la implementación?
│
├── component-catalog.md (📋 Plantilla - para llenar manualmente)
│   → Catálogo de componentes implementados
│   ├── API Components
│   │   Component: UsersApi
│   │   ├── Purpose: Gestión de usuarios
│   │   ├── ATCs: create_user_successfully, get_user_by_id, etc.
│   │   └── File: tests/components/api/users_api.py
│   ├── UI Components
│   │   Component: LoginPage
│   │   ├── Purpose: Página de login
│   │   ├── ATCs: login_successfully, login_with_invalid_credentials
│   │   └── File: tests/components/ui/login_page.py
│   └── Template para agregar nuevos componentes
│
├── atc-registry.md (📋 Plantilla - para llenar manualmente)
│   → Registro centralizado de ATCs con trazabilidad
│   ├── Format:
│   │   | ATC ID | Test ID (Jira) | Component | Description | Status |
│   │   |--------|----------------|-----------|-------------|--------|
│   │   | ATC-001 | USER-001 | UsersApi | create_user_successfully | ✅ Done |
│   │   | ATC-002 | AUTH-001 | LoginPage | login_successfully | 🚧 WIP |
│   └── Template para agregar ATCs nuevos
│
├── automation-standards.md (🤖 Generado con prompt)
│   → Estándares de código específicos para tests
│   ├── Naming Conventions
│   │   → Componentes: `UsersApi`, `LoginPage`
│   │   → ATCs: `create_user_successfully`, `login_with_invalid_credentials`
│   │   → Test files: `test_user_journey.py`
│   ├── Component Structure
│   │   → Orden de métodos (locators, ATCs, helpers)
│   │   → Docstrings obligatorios
│   │   → Type hints en todos los métodos
│   ├── Test Structure
│   │   → Arrange-Act-Assert pattern
│   │   → Naming: `test_[scenario]_[expected_outcome]`
│   ├── Assertion Guidelines
│   │   → Fixed assertions vs test-level assertions
│   │   → Custom assertion messages
│   ├── Code Quality
│   │   → Linting rules (ruff, mypy)
│   │   → Coverage minimums (80% para ATCs)
│   └── Review Checklist
│       → Checklist para code review de tests
│
├── test-data-management.md (📚 Reference - contenido completo)
│   → Estrategias para gestión de datos de prueba
│   ├── Data Generation
│   │   → Uso de Faker para datos dinámicos
│   │   → Factories pattern para objetos complejos
│   ├── Test Data Files
│   │   → Dónde guardar datos estáticos (JSON, CSV)
│   │   → Naming: `auth_data.json`, `products_data.csv`
│   ├── Database Management
│   │   → Setup de DB de testing (Supabase staging)
│   │   → Cleanup strategies (truncate vs reset)
│   │   → Transactions para aislamiento
│   ├── Environment Variables
│   │   → Qué variables necesita la suite (.env.test)
│   │   → Configuración por ambiente (dev, staging)
│   └── Best Practices
│       → Evitar datos hardcodeados
│       → Tests independientes (no shared state)
│
├── tms-integration.md (📚 Reference - contenido completo)
│   → Integración con Test Management System
│   ├── Tool Selection
│   │   → Xray (default) vs TestRail vs Jira directo
│   ├── Configuration (Xray Cloud ejemplo)
│   │   → Variables de entorno necesarias
│   │   → CLIENT_ID, CLIENT_SECRET, PROJECT_KEY
│   ├── Sync Strategy
│   │   → Auto-sync después de cada run
│   │   → Formato de resultados (JSON → Xray format)
│   ├── Test Case Mapping
│   │   → ATC decorators: @atc(test_id="USER-001")
│   │   → Trazabilidad 1:1 código ↔ Jira
│   ├── Reporting
│   │   → Qué información se sube (pass/fail, errors, screenshots)
│   │   → Test Execution creation automática
│   └── Troubleshooting
│       → Errores comunes y soluciones
│
└── ci-cd-integration.md (📚 Reference - contenido completo)
    → Integración con CI/CD pipelines
    ├── GitHub Actions Setup
    │   → Workflow file ejemplo (.github/workflows/test.yml)
    │   → Triggers (on push, on PR, scheduled)
    ├── Test Execution
    │   → Comandos para correr suite completa
    │   → Comandos para smoke tests
    │   → Parallel execution configuration
    ├── Artifact Management
    │   → Screenshots de fallos
    │   → Videos de tests E2E
    │   → HTML reports (Allure, Playwright)
    ├── Notifications
    │   → Slack/Discord notifications on failure
    │   → GitHub PR comments con resultados
    └── Best Practices
        → Fail fast strategies
        → Retry flaky tests (max 2 retries)
        → Timeouts adecuados
```

---

**Archivos con Prompts (generados por IA):**
- `test-strategy.md`
- `kata-implementation-plan.md`
- `automation-standards.md`

**Archivos Reference (contenido completo estático):**
- `kata-architecture.md`
- `test-data-management.md`
- `tms-integration.md`
- `ci-cd-integration.md`

**Archivos Plantilla (para llenar manualmente por QA):**
- `component-catalog.md`
- `atc-registry.md`

---

## 🤖 PROMPTS IDEALES POR FASE

### **PROMPTS PARA FASE 1: CONSTITUTION**

#### **Prompt: business-model.md**

```md
Actúa como Business Strategist y Product Visionary.

**Contexto:**
Necesito definir el modelo de negocio de un MVP para [industria/vertical].

**Idea inicial:**
[Descripción breve del problema y solución en 2-3 párrafos]

**Target audience:**
[Demografía, comportamiento, pain points]

**Genera un Business Model Canvas completo con:**

1. **Customer Segments** (¿Para quién creamos valor?)
2. **Value Propositions** (¿Qué problema resolvemos?)
3. **Channels** (¿Cómo llegamos a los clientes?)
4. **Customer Relationships** (¿Qué relación establecemos?)
5. **Revenue Streams** (¿Cómo generamos ingresos?)
6. **Key Resources** (¿Qué recursos necesitamos?)
7. **Key Activities** (¿Qué actividades clave hacemos?)
8. **Key Partners** (¿Quiénes son nuestros partners?)
9. **Cost Structure** (¿Cuáles son los costos principales?)

**Además, incluye:**
- **Problem Statement** (2-3 párrafos): Describe el pain point crítico
- **MVP Hypothesis** (3 hipótesis a validar con el MVP)

**Formato:** Markdown estructurado, listo para copiar a .context/idea/business-model.md

**Restricciones:**
- Mantener ligero (2-3 páginas máximo)
- Enfocado en MVP (no roadmap futuro)
- Datos específicos y cuantificables donde sea posible
```

---

#### **Prompt: market-context.md**

```md
Actúa como Market Research Analyst.

**Contexto:**
Tengo este modelo de negocio: [pegar business-model.md]

**Genera análisis de mercado ligero con:**

1. **Competitive Landscape** (Top 3 competidores directos)
   - Fortalezas de cada uno
   - Debilidades/gaps que podemos explotar
   - Nuestra diferenciación clave

2. **Market Opportunity**
   - Tamaño de mercado (TAM/SAM/SOM si es posible)
   - Tendencias de crecimiento
   - Barreras de entrada

3. **Trends & Insights** (2-3 tendencias relevantes)
   - Tecnológicas (ej: adopción de IA)
   - De mercado (ej: shift a remote work)
   - De comportamiento de usuario

**Formato:** Markdown, máximo 2 páginas, con bullets concisos

**Fuentes:** Puedes usar conocimiento general, pero indica cuando sea especulativo
```

---

### **PROMPTS PARA FASE 2: SPECIFICATION**

#### **Prompt: PRD completo**

```md
Actúa como Senior Product Manager.

**Input:**
- Business Model: [pegar constitution/business-model.md]
- Market Context: [pegar constitution/market-context.md]
- Tech Stack: Next.js 15, Supabase (PostgreSQL), Vercel, GitHub Actions

**Genera PRD completo separado en 4 archivos:**

---

**Archivo 1: executive-summary.md**

Incluye:
1. Problem Statement (del BMC, refinado)
2. Solution Overview (qué construiremos en el MVP)
3. Success Metrics (3-5 KPIs específicos y medibles)
4. Target Users (2-3 user personas breves)

---

**Archivo 2: user-personas.md**

Crea 2-3 personas con:
- Nombre ficticio + foto (describe características para generar con IA)
- Demographics (edad, ocupación, ubicación)
- Goals (qué quiere lograr)
- Pain Points (frustraciones actuales)
- Tech Savviness (nivel de adopción tech)
- Quote representativa

---

**Archivo 3: mvp-scope.md**

Define:

1. **In Scope (Must Have)** - Features core del MVP
   - Organizado por épicas (5-7 épicas)
   - Cada épica con 3-5 user stories high-level

2. **Out of Scope (Nice to Have)** - Para v2+

3. **Success Criteria** - ¿Cuándo consideramos el MVP exitoso?

Formato:
- Epic 1: [Category]
  - US 1.1: Como [user], quiero [action], para [benefit]
  - US 1.2: ...

---

**Archivo 4: user-journeys.md**

Mapea 2-3 user journeys principales:
1. Happy Path (flujo ideal)
2. Edge Case 1 (ej: error de validación)
3. Edge Case 2 (ej: usuario sin permisos)

Formato por journey:
- Steps (1, 2, 3...)
- User Actions
- System Responses
- Pain Points (dónde puede fallar)

---

**Output:** 4 archivos Markdown separados, listos para .context/prd/
```

---

#### **Prompt: SRS completo**

```md
Actúa como Software Architect y Tech Lead.

**Input:**
- PRD completo: [pegar /prd/*.md]
- Tech Stack: Next.js 15 (App Router), React 19, Supabase, Vercel, TailwindCSS

**Genera SRS completo separado en 4 archivos:**

---

**Archivo 1: functional-specs.md**

Mapea cada User Story del PRD a Functional Requirements:

FR-001: [Feature] debe permitir [acción específica]
- Relacionado a: Epic X, US Y.Z (del PRD)
- Input: [datos de entrada esperados]
- Processing: [lógica de negocio]
- Output: [resultado esperado]
- Validations: [reglas de validación]

FR-002: ...

**Formato:** Tabla o lista numerada, 1:1 con User Stories

---

**Archivo 2: non-functional-specs.md**

Define NFRs en categorías:

1. **Performance**
   - Page Load Time: < 2s (LCP)
   - API Response Time: < 500ms (p95)
   - Concurrent Users: 100 (MVP), 1000 (v2)

2. **Security**
   - Authentication: JWT tokens (Supabase Auth)
   - Authorization: RBAC (roles: user, admin)
   - Data Encryption: At rest (Supabase) + in transit (HTTPS)
   - Input Validation: Server-side + client-side

3. **Scalability**
   - Database: PostgreSQL con Row Level Security (RLS)
   - CDN: Vercel Edge Network
   - Caching: ISR (Incremental Static Regeneration)

4. **Accessibility**
   - WCAG 2.1 Level AA compliance
   - Keyboard navigation
   - Screen reader support

5. **Browser Support**
   - Chrome (últimas 2 versiones)
   - Firefox (últimas 2 versiones)
   - Safari (últimas 2 versiones)
   - Mobile: iOS Safari, Android Chrome

---

**Archivo 3: architecture-specs.md**

Incluye:

1. **System Architecture** (diagrama C4 Level 1-2 en Mermaid)
   ```mermaid
   graph TB
   ...
   ```

2. **Database Design** (ERD en Mermaid)

   ```mermaid
   erDiagram
   ...
   ```

3. **Tech Stack Justification**
   - Frontend: Next.js 15 (por qué)
   - Backend: Supabase (por qué)
   - Deployment: Vercel (por qué)

4. **Data Flow** (request → response flow)

5. **Security Architecture**
   - Auth flow diagram
   - RBAC implementation

**IMPORTANTE:** NO generar SQL schemas estáticos. Indicar que se usará Supabase MCP para obtener schema real en tiempo real.

---

**Archivo 4: api-contracts.yaml**

Genera OpenAPI 3.0 spec con:

- Endpoints principales (GET, POST, PUT, DELETE)
- Request/Response schemas
- Status codes (200, 400, 401, 404, 500)
- Authentication headers

Ejemplo:

```yaml
openapi: 3.0.0
info:
  title: [Project Name] API
  version: 1.0.0
paths:
  /api/users:
    post:
      summary: Register new user
      requestBody:
        content:
          application/json:
            schema:
              type: object
              properties:
                email:
                  type: string
                  format: email
                password:
                  type: string
                  minLength: 8
      responses:
        '201':
          description: User created
        '400':
          description: Validation error
```

---

**Output:** 4 archivos (3 Markdown + 1 YAML), listos para .context/srs/

```

---

#### **Prompt: PBI (Product Backlog Items)**

```md
Actúa como Scrum Master y Product Owner.

**Input:**

- PRD: [pegar /prd/mvp-scope.md]
- SRS: [pegar /srs/functional-specs.md]

**Genera estructura completa de Product Backlog Items:**

---

**Archivo 1: epic-tree.md**

Crea árbol visual high-level:

```
EPIC-MYM-2: User Authentication & Authorization
├── STORY-MYM-3: Register with email
├── STORY-MYM-4: Login with credentials
├── STORY-MYM-5: Password reset flow
└── STORY-MYM-6: RBAC implementation

EPIC-MYM-8: User Profile Management
├── STORY-MYM-9: View profile
├── STORY-MYM-10: Edit profile
└── STORY-MYM-11: Upload avatar

EPIC-MYM-13: [Next epic]
...
```

Total: 5-7 épicas, 20-30 user stories para MVP

---

**Archivo 2: Estructura de carpetas /epics**

Para cada épica, genera:

**epic.md** (dentro de /epics/EPIC-XXX-nombre/)

```markdown
---
id: EPIC-MYM-2
jira_id: null
title: User Authentication & Authorization
priority: High
business_value: High
estimated_story_points: 21
---

## Description
[Descripción de la épica]

## Scope
- Features incluidas
- Features excluidas

## Acceptance Criteria (Epic-level)
- Criterios de aceptación de alto nivel

## Dependencies
- Épicas dependientes
- Recursos externos necesarios

## User Stories
- STORY-MYM-3: Register with email (5 pts)
- STORY-MYM-4: Login with credentials (3 pts)
- ...
```

---

**Archivo 3: User Stories individuales**

Para cada story, crea una CARPETA: /epics/EPIC-XXX/stories/STORY-XXX/

Dentro de cada carpeta, genera:

**story.md**

```markdown
---
id: STORY-MYM-3
jira_id: null
epic_id: EPIC-MYM-2
title: Como usuario, quiero registrarme con email para acceder a la plataforma
priority: High
story_points: 5
assignee: null
status: To Do
---

## Description
El usuario debe poder crear una cuenta usando su email y contraseña.

## Acceptance Criteria (Gherkin)

**Scenario 1: Registro exitoso**
- **Given:** Usuario en página de registro
- **When:** Ingresa email válido y contraseña segura (8+ caracteres, 1 mayúscula, 1 número)
- **Then:** Sistema crea cuenta y envía email de verificación

**Scenario 2: Email duplicado**
- **Given:** Usuario en página de registro
- **When:** Ingresa email ya registrado
- **Then:** Sistema muestra error "Email ya existe"

**Scenario 3: Validación de password débil**
- **Given:** Usuario en página de registro
- **When:** Ingresa password < 8 caracteres
- **Then:** Sistema muestra error de validación

## Technical Notes
- Usar Supabase Auth para gestión de usuarios
- Hash de passwords con bcrypt (Supabase lo hace automáticamente)
- Email verification con Supabase Email Templates

## Definition of Done
- [ ] Código implementado y funcionando
- [ ] Tests unitarios (coverage > 80%)
- [ ] Tests de integración (API + DB)
- [ ] Tests E2E (Playwright)
- [ ] Code review aprobado
- [ ] Documentación actualizada
- [ ] Deployed to staging
```

---

**Output:**

1. epic-tree.md
2. Estructura de carpetas /epics con:
   - 5-7 carpetas de épicas
   - Cada épica con epic.md
   - Cada épica con /stories/ conteniendo carpetas STORY-XXX
   - Cada carpeta STORY-XXX con story.md inicial

**Formato:** Archivos Markdown listos para .context/pbi/

**Nota:** Los archivos `feature-test-plan.md`, `feature-implementation-plan.md`, `test-cases.md` e `implementation-plan.md` se crean en las siguientes fases.

**Post-generación:** Usar Atlassian MCP para crear estos items en Jira y actualizar los jira_id en los archivos locales.

---

### **PROMPTS PARA FASE 3: REFINEMENT (Shift-Left Testing)**

#### **Prompt: Feature Test Plan (a nivel épica)**

```md
Actúa como QA Lead experto en Shift-Left Testing y Test Strategy.

**Input:**

- Epic: [pegar /pbi/epics/EPIC-XXX/epic.md]
- SRS NFRs: [pegar /srs/non-functional-specs.md]
- Todas las stories de la épica: [listar titles]

**Genera Feature Test Plan:**

**Archivo: feature-test-plan.md** (dentro de /pbi/epics/EPIC-XXX/)

```markdown
# Feature Test Plan: EPIC-MYM-2 - [Epic Title]

## Test Strategy

### Scope
**In Scope:**
- Functional testing (UI, API, Database)
- Non-functional testing (Performance, Security)
- Cross-browser testing (Chrome, Firefox, Safari)
- Mobile responsiveness (iOS, Android)

**Out of Scope:**
- Load testing (dejar para v2)
- Penetration testing (contratar externo)

### Test Levels
- **Unit Testing**: Funciones/métodos individuales (coverage > 80%)
- **Integration Testing**: API + Database interactions
- **E2E Testing**: User flows completos (Playwright)

### Test Types per Story
- Positive test cases (Happy Path)
- Negative test cases (Error handling)
- Boundary test cases (Edge cases)

---

## Test Scope

### Features to Test
- [Feature 1]: Register with email
  - Validaciones de input
  - Integración con Supabase Auth
  - Email verification flow

- [Feature 2]: Login with credentials
  - ...

### Features NOT to Test (Excluded)
- Features Out of Scope del MVP

---

## Risk Analysis

### High Risk Areas
**Risk 1:** Email delivery failures
- **Impact:** High (usuarios no pueden verificar cuenta)
- **Likelihood:** Medium
- **Mitigation:** Usar Supabase Email Service confiable + retry logic

**Risk 2:** Security vulnerabilities en auth
- **Impact:** Critical
- **Likelihood:** Low (usando Supabase Auth)
- **Mitigation:** Code review exhaustivo + security testing

---

## Test Data Requirements

### Data Needed
- Valid emails: test1@example.com, test2@example.com
- Invalid emails: invalid-email, @example.com
- Valid passwords: SecurePass123, MyPassword1
- Weak passwords: 123, pass

### Test Environments
- Staging: jzhxmrtqnbfcmmqxbaoo.supabase.co
- Production: eqyczlpowhdgulnkhjjm.supabase.co

---

## Test Cases Summary

Total estimado: 30 test cases para esta feature

- STORY-MYM-3: 6 test cases (3 positive, 2 negative, 1 boundary)
- STORY-MYM-4: 5 test cases (3 positive, 1 negative, 1 boundary)
- ...

(Detalle de cada test case va en `test-cases.md` de cada story)

---

## Entry/Exit Criteria

### Entry Criteria
- [ ] Story implementada y deployed to staging
- [ ] Code review aprobado
- [ ] No hay blocker bugs

### Exit Criteria
- [ ] Todos los test cases ejecutados
- [ ] 95% de test cases pasando (críticos: 100%)
- [ ] Bugs críticos resueltos
- [ ] Test report generado
```

---

**Output:** Archivo Markdown listo para .context/pbi/epics/EPIC-XXX/feature-test-plan.md

```

---

#### **Prompt: Test Cases (a nivel story)**

```md
Actúa como QA Engineer experto en Shift-Left Testing y Test Case Design.

**Input:**

- Story: [pegar /pbi/epics/EPIC-XXX/stories/STORY-XXX/story.md]
- Feature Test Plan: [pegar /pbi/epics/EPIC-XXX/feature-test-plan.md]
- SRS relacionado: [pegar secciones relevantes de /srs/]

**Genera Test Cases completos para esta story:**

**Archivo: test-cases.md** (dentro de /pbi/epics/EPIC-XXX/stories/STORY-XXX/)

```markdown
# Test Cases: STORY-MYM-3 - [Story Title]

## Refined Acceptance Criteria

### Scenario 1: Registro exitoso (refinado)
- **Given:** Usuario en página /register, database vacía
- **When:** Ingresa email "test@example.com" y password "SecurePass123"
- **Then:**
  - Sistema crea user en DB con id=UUID
  - API retorna 201 Created con {success: true, userId: UUID}
  - Email de verificación enviado a "test@example.com"
  - Usuario redirigido a /verify-email

### Scenario 2: Email duplicado (refinado)
- **Given:** Email "test@example.com" ya existe en tabla `users`
- **When:** Usuario intenta registrarse con ese email
- **Then:**
  - API retorna 400 Bad Request con {success: false, error: "Email already exists"}
  - Frontend muestra mensaje: "Este email ya está registrado. ¿Olvidaste tu contraseña?"
  - NO se crea registro en DB

### Scenario 3: Password débil (edge case agregado)
- **Given:** Usuario en /register
- **When:** Ingresa password "123" (< 8 caracteres, sin mayúscula, solo números)
- **Then:**
  - Validación client-side muestra errores:
    - "Mínimo 8 caracteres"
    - "Requiere al menos 1 mayúscula"
  - Submit button permanece disabled
  - NO se hace request a API

---

## Test Cases

### **TC-001: Registro exitoso con email válido y password fuerte**

- **Related Story:** STORY-001
- **Type:** Positive
- **Priority:** High
- **Preconditions:**
  - Database staging vacía (o usar email único)
  - Ambiente staging funcional

**Test Steps:**
1. Navegar a https://staging.upexgalaxy.com/register
2. Ingresar email: "testuser001@example.com"
3. Ingresar password: "SecurePass123"
4. Click en botón "Registrar"
5. Verificar redirect a /verify-email
6. Verificar en DB: SELECT * FROM users WHERE email='testuser001@example.com'

**Expected Result:**
- Status code: 201 Created
- Response: {success: true, userId: <UUID>}
- User creado en DB con email_verified=false
- Email enviado (verificar logs o bandeja)
- Frontend muestra: "Te enviamos un email de verificación"

**Test Data:**
- Email: testuser001@example.com
- Password: SecurePass123

---

### **TC-002: Registro fallido - Email duplicado**

- **Related Story:** STORY-001
- **Type:** Negative
- **Priority:** High
- **Preconditions:**
  - Email "duplicate@example.com" YA existe en staging DB

**Test Steps:**
1. Navegar a /register
2. Ingresar email: "duplicate@example.com"
3. Ingresar password: "SecurePass123"
4. Click en "Registrar"

**Expected Result:**
- Status code: 400 Bad Request
- Response: {success: false, error: "Email already exists"}
- Frontend muestra: "Este email ya está registrado"
- NO se crea nuevo registro en DB

**Test Data:**
- Email: duplicate@example.com
- Password: SecurePass123

---

### **TC-003: Validación client-side - Password débil**

- **Related Story:** STORY-001
- **Type:** Negative
- **Priority:** Medium
- **Preconditions:** Ninguna

**Test Steps:**
1. Navegar a /register
2. Ingresar password: "123"
3. Observar validaciones en tiempo real

**Expected Result:**
- Mensajes de error visibles:
  - "Mínimo 8 caracteres"
  - "Requiere al menos 1 mayúscula"
  - "Requiere al menos 1 número"
- Submit button disabled
- NO se hace request a API (verificar Network tab)

**Test Data:**
- Password: 123

---

### **TC-004: Validación server-side - Email formato inválido**

- **Related Story:** STORY-001
- **Type:** Negative
- **Priority:** High
- **Preconditions:** Ninguna

**Test Steps:**
1. Bypass client-side validation (usar curl o Postman)
2. POST /api/auth/register con {"email": "invalid-email", "password": "SecurePass123"}

**Expected Result:**
- Status code: 400 Bad Request
- Response: {success: false, error: "Invalid email format"}
- NO se crea registro en DB

**Test Data:**
- Email: invalid-email
- Password: SecurePass123

---

### **TC-005: Boundary - Email con 254 caracteres (RFC max)**

- **Related Story:** STORY-001
- **Type:** Boundary
- **Priority:** Low
- **Preconditions:** Ninguna

**Test Steps:**
1. Navegar a /register
2. Ingresar email de 254 caracteres: "a" * 240 + "@example.com" (validar que sea válido)
3. Ingresar password: "SecurePass123"
4. Click en "Registrar"

**Expected Result:**
- Sistema acepta el email (RFC 5321 permite hasta 254 chars)
- Registro exitoso
- Email enviado correctamente

**Test Data:**
- Email: [240 'a's]@example.com
- Password: SecurePass123

---

### **TC-006: Boundary - Password con 72 caracteres (bcrypt max)**

- **Related Story:** STORY-001
- **Type:** Boundary
- **Priority:** Low
- **Preconditions:** Ninguna

**Test Steps:**
1. Navegar a /register
2. Ingresar email: "longpass@example.com"
3. Ingresar password de 72 caracteres: "SecurePass123" * 6 (72 chars)
4. Click en "Registrar"

**Expected Result:**
- Sistema acepta el password (bcrypt maneja hasta 72 bytes)
- Registro exitoso

**Test Data:**
- Email: longpass@example.com
- Password: [72 caracteres]

---

## Edge Cases Identified

1. **Email con caracteres especiales**: test+tag@example.com (válido según RFC)
2. **Multiple espacios en password**: "Secure   Pass123" (¿se permite?)
3. **Email case sensitivity**: Test@Example.com vs test@example.com (¿duplicado?)
4. **Concurrent registrations**: Dos users registrándose con mismo email simultáneamente (race condition)
5. **Email service down**: ¿Qué pasa si Supabase no puede enviar email? (retry logic)

---

## Test Data Summary

| Type | Count | Examples |
|------|-------|----------|
| Valid emails | 10 | testuser001@example.com, test+tag@example.com |
| Invalid emails | 5 | invalid-email, @example.com, test@.com |
| Valid passwords | 8 | SecurePass123, MyP@ssw0rd |
| Weak passwords | 6 | 123, pass, 12345678 |

```

---

**Output:** Archivo Markdown listo para .context/pbi/epics/EPIC-XXX/stories/STORY-XXX/test-cases.md

**Post-generación:** Crear test cases en Jira Xray y linkear con story.

---

### **FASE 4: PLANNING**

#### **Prompt: Feature Implementation Plan (a nivel épica)**

```md
Actúa como Senior Software Architect y Tech Lead.

**Input:**

- Epic: [pegar /pbi/epics/EPIC-XXX/epic.md]
- SRS completo: [pegar /srs/*.md]
- Feature Test Plan: [pegar /pbi/epics/EPIC-XXX/feature-test-plan.md]

**Genera Feature Implementation Plan:**

**Archivo: feature-implementation-plan.md** (dentro de /pbi/epics/EPIC-XXX/)

```markdown
# Feature Implementation Plan: EPIC-XXX - [Epic Title]

## Overview

Esta feature implementa [descripción high-level de la feature].

**Alcance:**
- [Story 1]: Register with email
- [Story 2]: Login with credentials
- [Story 3]: Password reset
- [Story 4]: RBAC implementation

**Stack técnico:**
- Frontend: Next.js 15 (App Router), React 19, TailwindCSS
- Backend: Supabase (Auth + Database)
- Deployment: Vercel
- Testing: Playwright (E2E), Vitest (unit/integration)

---

## Technical Decisions

### Decision 1: Authentication Strategy

**Options considered:**
- A) Custom JWT implementation
- B) NextAuth.js
- C) Supabase Auth

**Chosen:** C) Supabase Auth

**Reasoning:**
- ✅ Built-in email verification
- ✅ JWT tokens out-of-the-box
- ✅ Row Level Security (RLS) integration
- ✅ Reduces development time (MVP goal)
- ❌ Trade-off: Dependencia de Supabase (vendor lock-in)

**Implementation notes:**
- Usar Supabase Client en server components
- Configurar RLS policies en DB
- Email templates en Supabase dashboard

---

### Decision 2: Password Validation

**Chosen:** Client-side + Server-side with Zod

**Reasoning:**
- ✅ UX: Feedback inmediato (client-side)
- ✅ Security: Validación confiable (server-side)
- ✅ DRY: Mismo schema Zod compartido

**Implementation notes:**
- Schema en `/lib/validations/auth.ts`
- Exportar para reutilizar en client y server

---

### Decision 3: Error Handling Strategy

**Chosen:** Structured error responses + Error boundary

**Reasoning:**
- ✅ Consistencia en toda la feature
- ✅ User-friendly messages
- ✅ Developer-friendly debugging (error codes)

**Format:**
```typescript
{
  success: false,
  error: {
    code: "EMAIL_ALREADY_EXISTS",
    message: "Este email ya está registrado",
    details: {} // optional
  }
}
```

---

## Shared Dependencies

**Todas las stories de esta feature requieren:**

1. **Supabase Project configurado**
   - Project ID: jzhxmrtqnbfcmmqxbaoo (staging)
   - Environment variables:
     - NEXT_PUBLIC_SUPABASE_URL
     - NEXT_PUBLIC_SUPABASE_ANON_KEY
     - SUPABASE_SERVICE_ROLE_KEY

2. **Database setup**
   - ⚠️ NO usar SQL estático, usar Supabase MCP
   - Migrations versionadas (naming: `YYYYMMDD_description.sql`)
   - RLS policies habilitadas

3. **Email templates**
   - Template "email_verification" configurado en Supabase
   - Template "password_reset" configurado

4. **Frontend utilities**
   - Supabase Client singleton (`/lib/supabase/client.ts`)
   - Auth hooks (`/hooks/useAuth.ts`)

---

## Architecture Notes

### Folder Structure

```
/app
├── /api
│   └── /auth
│       ├── /register
│       │   └── route.ts (POST /api/auth/register)
│       ├── /login
│       │   └── route.ts (POST /api/auth/login)
│       └── /reset-password
│           └── route.ts (POST /api/auth/reset-password)
│
├── /(auth) (route group)
│   ├── /register
│   │   └── page.tsx
│   ├── /login
│   │   └── page.tsx
│   └── /reset-password
│       └── page.tsx
│
/components
└── /auth
    ├── RegisterForm.tsx
    ├── LoginForm.tsx
    └── ResetPasswordForm.tsx

/lib
├── /validations
│   └── auth.ts (Zod schemas)
└── /supabase
    └── client.ts
```

### Design Patterns

1. **API Routes**: RESTful endpoints con estructura consistente
2. **Form Validation**: Controlled components con React Hook Form + Zod
3. **Error Handling**: Try-catch con custom error classes
4. **Loading States**: Optimistic UI con loading skeletons

---

## Implementation Order

**Recomendado:**

- **STORY-MYM-3: Register** (base para todo)
- **STORY-MYM-4: Login** (depende de STORY-MYM-3)
- **STORY-MYM-6: RBAC** (depende de STORY-MYM-3, STORY-MYM-4)
- **STORY-MYM-5: Password reset** (puede ir en paralelo)

---

## Risks & Mitigations

### Risk 1: Email delivery failures

**Impact:** High (users can't verify accounts)
**Likelihood:** Medium
**Mitigation:**

- Usar Supabase Email Service (99.9% uptime)
- Implementar "Resend email" button
- Logs de emails enviados para debugging

### Risk 2: Race conditions en registration

**Impact:** Medium (duplicate users created)
**Likelihood:** Low
**Mitigation:**

- UNIQUE constraint en users.email (DB level)
- Optimistic locking si es necesario

### Risk 3: Security vulnerabilities

**Impact:** Critical
**Likelihood:** Low (usando Supabase Auth)
**Mitigation:**

- Code review exhaustivo
- Security testing (parte del feature test plan)
- Usar Supabase built-in security features

---

## Success Criteria

**Esta feature estará completa cuando:**

- [ ] Todas las stories implementadas y deployed
- [ ] 100% de test cases críticos pasando
- [ ] Security review aprobado
- [ ] Performance targets alcanzados (< 2s page load)
- [ ] Documentation actualizada

```

---

**Output:** Archivo Markdown listo para .context/pbi/epics/EPIC-XXX/feature-implementation-plan.md
```

---

#### **Prompt: Implementation Plan (a nivel story)**

```md
Actúa como Senior Full-Stack Developer.

**Input:**
- Story: [pegar /pbi/epics/EPIC-XXX/stories/STORY-XXX/story.md]
- Test Cases: [pegar /pbi/epics/EPIC-XXX/stories/STORY-XXX/test-cases.md]
- Feature Implementation Plan: [pegar /pbi/epics/EPIC-XXX/feature-implementation-plan.md]
- SRS relevante: [pegar secciones relacionadas de /srs/]

**Genera Implementation Plan detallado:**

**Archivo: implementation-plan.md** (dentro de /pbi/epics/EPIC-XXX/stories/STORY-XXX/)

```markdown
# Implementation Plan: STORY-MYM-3 - [Story Title]

## Overview

Implementar funcionalidad de registro de usuarios usando email y password, con validación robusta y email de verificación.

**Acceptance Criteria a cumplir:**
- Registro exitoso con email válido
- Validación de email duplicado
- Validación de password débil (client + server)
- Email de verificación enviado

---

## Technical Approach

**Chosen approach:** Server-side API route + Client-side form con validación dual

**Alternatives considered:**
- Server Actions (Next.js 15): Más moderno pero menos control sobre response format
- Client-side only: Inseguro, vulnerable a bypass

**Why this approach:**
- ✅ Separation of concerns (API reutilizable)
- ✅ Better error handling
- ✅ Testeable independientemente

---

## Implementation Steps

### **Step 1: Database Schema** (si aplica)

**Task:** Verificar que tabla `users` existe con columnas necesarias

⚠️ **IMPORTANTE:** NO incluir SQL estático aquí. En su lugar:
- Usar Supabase MCP para verificar schema actual
- Ejecutar migration solo si es necesario

**Verification:**
```

Usar Supabase MCP:

1. list_tables → verificar si "users" existe
2. execute_sql("SELECT column_name FROM information_schema.columns WHERE table_name='users'")

```

**Expected columns:**
- id (uuid, primary key, default: uuid_generate_v4())
- email (text, unique, not null)
- password_hash (text, not null) - Supabase Auth maneja esto
- email_verified (boolean, default: false)
- created_at (timestamp, default: now())

**If table doesn't exist:**
- Usar Supabase MCP: `apply_migration` con nombre "create_users_table_v1"
- Habilitar Row Level Security (RLS)

**Estimated time:** 30 min

---

### **Step 2: Backend API - Validation Layer**

**Task:** Crear Zod schema para validación

**File:** `/lib/validations/auth.ts`

**Structure:**
- Email validation: Required, valid email format, max 254 chars (RFC 5321)
- Password validation: Min 8 chars, at least 1 uppercase, at least 1 number, max 72 chars (bcrypt limit)
- Export TypeScript type from schema

**Testing:**
- Unit test: Valid inputs pass
- Unit test: Invalid inputs throw ZodError

**Estimated time:** 30 min

---

### **Step 3: Backend API - Business Logic**

**Task:** Implementar endpoint POST /api/auth/register

**File:** `/app/api/auth/register/route.ts`

**Flow:**
1. Parse and validate request body (Zod schema)
2. Create Supabase client
3. Check if email already exists (query DB)
4. Create user with Supabase Auth (signUp method)
5. Return success response (201) or error (400/500)

**Response Structure:**
- Success: `{success: true, userId: UUID, message: string}` (201)
- Error: `{success: false, error: {code: string, message: string, details?: object}}` (400/500)

**Edge cases handled:**
- Email duplicado (400 - EMAIL_ALREADY_EXISTS)
- Validación fallida (400 - VALIDATION_ERROR)
- Supabase Auth error (500 - SIGNUP_FAILED)
- Unexpected errors (500 - INTERNAL_ERROR)

**Error Handling:**
- Catch Zod validation errors → structured response
- Catch Supabase errors → structured response
- Catch unexpected errors → generic response + log

**Testing:**
- Integration test: POST with valid data → 201
- Integration test: POST with duplicate email → 400
- Integration test: POST with invalid email → 400

**Estimated time:** 2h

---

### **Step 4: Frontend Components**

**Task:** Crear RegisterForm component

**File:** `/components/auth/RegisterForm.tsx`

**Component Structure:**
- Client component ('use client')
- State management: loading, errors (field-level + general)
- Form handler: preventDefault, extract FormData, validate, API call
- Conditional rendering: loading states, error messages

**Key Features:**
1. **Dual Validation:** Client-side (Zod schema) + Server-side (API)
2. **Error Display:** Field-level errors inline + general error at bottom
3. **Loading States:** Disabled inputs + button text change during submission
4. **User Feedback:** Success → redirect to /verify-email, Error → show message
5. **Accessibility:** data-testid attributes, proper input types, keyboard navigation

**Form Fields:**
- Email input (type="email", name="email")
- Password input (type="password", name="password")
- Submit button (disabled during loading)
- Error spans (conditional rendering)

**API Integration:**
- POST to /api/auth/register
- Handle success: router.push('/verify-email')
- Handle error: Display error message

**Styling:** TailwindCSS classes

**Testing:**
- E2E test: Fill form + submit → redirect to /verify-email
- E2E test: Submit with weak password → show validation errors

**Estimated time:** 2h

---

### **Step 5: Integration**

**Task:** Conectar frontend → backend → database

**Flow completo:**
1. User lands on /register
2. Fills RegisterForm
3. Client-side validation (Zod)
4. If valid, POST to /api/auth/register
5. Server-side validation (Zod)
6. Check email duplicate (Supabase query)
7. Create user (Supabase Auth)
8. Send verification email (Supabase)
9. Return success/error to client
10. Client redirects to /verify-email or shows error

**Testing:**
- E2E test: Complete happy path
- E2E test: Test all error scenarios from test-cases.md

**Estimated time:** 1h

---

### **Step 6: Testing Preparation**

**Task:** Preparar test data y scenarios

**Test Data (from test-cases.md):**
- Valid emails: testuser001@example.com, test+tag@example.com
- Invalid emails: invalid-email, @example.com
- Valid passwords: SecurePass123, MyP@ssw0rd
- Weak passwords: 123, pass, 12345678

**Test Scenarios:**
- TC-001: Registro exitoso (positive)
- TC-002: Email duplicado (negative)
- TC-003: Password débil (negative)
- TC-004: Email inválido server-side (negative)
- TC-005: Email 254 chars (boundary)
- TC-006: Password 72 chars (boundary)

**Estimated time:** 30 min

---

## Technical Decisions (Story-specific)

### Decision 1: Form library

**Chosen:** Plain React (no library)

**Reasoning:**
- ✅ Simple form, no necesita React Hook Form
- ✅ Menos dependencias
- ❌ Trade-off: Si form crece, refactor a RHF

### Decision 2: Error display strategy

**Chosen:** Inline errors + toast for success

**Reasoning:**
- ✅ UX: Errors near fields
- ✅ Success feedback visible (toast)

---

## Dependencies

**Pre-requisitos:**
- [x] Supabase project configurado (staging)
- [x] Environment variables set
- [ ] Email template "email_verification" configurado (BLOCKER)

---

## Risks & Mitigations

**Risk 1:** Email template not configured
- **Impact:** High (email won't send)
- **Mitigation:** Configurar template ANTES de implementar

**Risk 2:** Supabase Auth rate limits
- **Impact:** Medium (testing puede trigger rate limits)
- **Mitigation:** Usar throttling en tests, limpiar DB después

---

## Estimated Effort

| Step | Time |
|------|------|
| 1. Database Schema | 30 min |
| 2. Validation Layer | 30 min |
| 3. Backend API | 2h |
| 4. Frontend Components | 2h |
| 5. Integration | 1h |
| 6. Testing Preparation | 30 min |
| **Total** | **6.5h** |

**Story points:** 5 (matches estimation)

---

## Definition of Done Checklist

- [ ] Código implementado según este plan
- [ ] Todos los Acceptance Criteria pasando
- [ ] Tests unitarios escritos (coverage > 80%)
  - [ ] Zod schema validation
  - [ ] API route error handling
- [ ] Tests de integración pasando
  - [ ] POST /api/auth/register con valid data
  - [ ] POST con duplicate email
- [ ] Tests E2E pasando (referencia: test-cases.md)
  - [ ] TC-001: Registro exitoso
  - [ ] TC-002: Email duplicado
  - [ ] TC-003: Password débil
  - [ ] TC-004: Email inválido
  - [ ] TC-005: Boundary email
  - [ ] TC-006: Boundary password
- [ ] Code review aprobado
- [ ] Sin errores de linting/TypeScript
  - [ ] `bun run lint` passes
  - [ ] `bun run build` passes
- [ ] Deployed to staging
- [ ] Manual smoke test en staging
```

---

**Output:** Archivo Markdown listo para .context/pbi/epics/EPIC-XXX/stories/STORY-XXX/implementation-plan.md

**Decisión de IA:** Si story es compleja, crear archivos adicionales:

- `components.md` (detalle de componentes React)
- `api-details.md` (detalles de endpoints)
- `database-changes.md` (migrations detalladas)

```

---

### **PROMPTS PARA FASE 7: TEST AUTOMATION ENGINEERING**

#### **Prompt: test-strategy.md**

```md
Actúa como QA Lead y Test Architect experto en KATA Framework.

**Contexto:**
Necesito definir la estrategia general de testing automatizado para este proyecto.

**Input:**
- PRD completo: [pegar /prd/*.md]
- SRS completo: [pegar /srs/*.md]
- PBI: [pegar /pbi/epic-tree.md y listar épicas principales]
- Tech Stack: Next.js 15, React 19, Supabase, Vercel, Playwright, Vitest
- KATA Architecture: [referencia a kata-architecture.md]

**Genera Test Strategy completo:**

## 1. Executive Summary
- Overview del enfoque de testing
- Objetivos principales (quality gates, coverage, speed)

## 2. Scope

### In Scope
- Functional testing (API + UI)
- Integration testing (API + Database)
- E2E testing (user journeys críticos)
- Regression testing (suite automatizada)

### Out of Scope (para v2 o manual)
- Performance/Load testing (reservar para fase posterior)
- Security penetration testing (contratar externo)
- Accessibility testing completo (WCAG - manual spot checks)

## 3. Test Levels

### Unit Testing
- **Coverage Goal**: 80% para lógica de negocio
- **Framework**: Vitest
- **Scope**: Funciones puras, helpers, validations (Zod schemas)
- **Execution**: On commit (pre-commit hook)

### Integration Testing
- **Coverage Goal**: 100% de endpoints críticos (auth, payments)
- **Framework**: Vitest + Supabase MCP
- **Scope**: API routes + Database interactions
- **Execution**: On PR

### E2E Testing
- **Coverage Goal**: Happy paths + critical journeys (top 10 user flows)
- **Framework**: Playwright
- **Scope**: User journeys completos (login → action → logout)
- **Execution**: Nightly + on release

## 4. Test Architecture (KATA)

### Components API
- UsersApi (auth, CRUD)
- [Listar otros componentes según épicas del PBI]

### Components UI
- LoginPage
- [Listar otros componentes según páginas del proyecto]

### Fixture Strategy
- ApiFixture: agrupa todos los componentes API
- UiFixture: agrupa todos los componentes UI
- TestFixture: unifica ambos para tests E2E

### ATC Strategy
- Priorizar ATCs para happy paths primero
- Luego negative cases
- Mapeo 1:1 con test cases de Jira (trazabilidad)

## 5. Test Data Management

- **Generación**: Faker para datos dinámicos
- **Cleanup**: Truncate DB después de cada test suite
- **Isolation**: Tests independientes (no shared state)
- **Fixtures**: Factory pattern para objetos complejos

## 6. Test Environments

### Local
- Database: Supabase local (docker) o staging con namespace único
- API: Next.js dev server (`bun dev`)

### Staging
- Database: Supabase staging project (jzhxmrtqnbfcmmqxbaoo)
- API: Vercel preview deployment
- **Nota**: Limpiar datos de test después de cada run

### Production
- ❌ NO ejecutar tests destructivos
- ✅ Solo smoke tests read-only (health checks)

## 7. Execution Strategy

### On Commit (local)
- Linting (`bun run lint`)
- Type checking (`bun run build`)
- Unit tests (`bun run test`)

### On Pull Request (CI)
- Unit tests
- Integration tests (API)
- Smoke tests E2E (solo happy paths críticos)

### Nightly (CI)
- Full E2E suite
- Regression tests
- Generate coverage reports

### On Release (CI)
- Full suite (unit + integration + E2E)
- Smoke tests en staging
- Deploy solo si 100% pasa

## 8. Reporting & Metrics

### Metrics to Track
- Test pass rate (goal: >95%)
- Coverage (unit: >80%, integration: >90%, e2e: top 10 journeys)
- Execution time (goal: E2E suite < 10 min)
- Flakiness rate (goal: <2%)

### Reporting Tools
- **Xray**: Sincronización automática de resultados
- **Allure**: HTML reports para devs
- **GitHub PR comments**: Summary de resultados en cada PR

## 9. Test Management System

- **Tool**: Xray Cloud
- **Sync**: Auto-sync después de cada run (usar decorador @atc)
- **Mapping**: Test cases en Jira ↔ ATCs en código (1:1)

## 10. CI/CD Integration

- **Tool**: GitHub Actions
- **Workflow**: `.github/workflows/test.yml`
- **Parallelization**: Split E2E tests en 3 shards
- **Artifacts**: Screenshots, videos, HTML reports

## 11. Implementation Timeline

### Week 1: Setup
- Crear estructura KATA (/tests/components)
- Implementar TestContext + ApiBase + UiBase
- Setup CI/CD workflow

### Week 2: Core Components
- Implementar UsersApi (auth ATCs)
- Implementar LoginPage (UI ATCs)
- Primeros tests E2E funcionando

### Week 3-4: Expand Coverage
- Implementar componentes restantes
- Alcanzar coverage goals
- Integración con Xray completa

### Week 5+: Maintenance
- Refactoring según feedback
- Agregar tests para nuevas features
- Monitor flakiness y optimizar

## 12. Risks & Mitigations

**Risk 1**: Tests flaky por timing issues
- **Mitigation**: Usar waitFor en Playwright, evitar sleep hardcoded

**Risk 2**: Suite E2E muy lenta
- **Mitigation**: Paralelización + priorizar happy paths

**Risk 3**: Datos de test interfieren con staging
- **Mitigation**: Namespace único para datos de test + cleanup automático

---

**Output:** Archivo Markdown listo para `.context/tae/test-strategy.md`

**Nota para IA:**
- Si es proyecto **GREENFIELD**: Diseñar estrategia completa desde cero
- Si es proyecto **LEGACY**: Evaluar suite existente primero, luego adaptar estrategia (enfoque en tests de caracterización si no hay suite)
```

---

#### **Prompt: kata-implementation-plan.md**

```md
Actúa como Senior Test Automation Engineer experto en KATA Framework.

**Contexto:**
Necesito un plan específico para implementar KATA en este proyecto, identificando componentes, ATCs, y roadmap.

**Input:**
- Test Strategy: [pegar /tae/test-strategy.md]
- KATA Architecture: [pegar kata-architecture.md o referenciar doc completo]
- PBI completo: [pegar epic-tree.md + listar épicas con sus stories]
- Tech Stack: [especificar lenguaje para componentes: Python/TypeScript]

**Genera KATA Implementation Plan:**

## 1. Overview

**Goal**: Implementar arquitectura KATA completa para este proyecto, con componentes reutilizables y trazabilidad 1:1 con Jira.

**Approach**: [Python con pytest + Playwright] o [TypeScript con Vitest + Playwright]

**Expected Outcome**:
- Suite de tests organizada en componentes KATA
- ATCs reutilizables mapeados a test cases de Jira
- Cobertura de [X]% en 4 semanas

---

## 2. Component Breakdown

### API Components

Basado en las épicas del PBI, identificar componentes API necesarios:

**Component: UsersApi**
- Purpose: Gestión de usuarios (auth, CRUD)
- ATCs to implement:
  - `create_user_successfully` (maps to USER-001)
  - `login_successfully` (maps to AUTH-001)
  - `get_user_by_id` (maps to USER-002)
  - `update_user_profile` (maps to USER-003)
  - `delete_user_account` (maps to USER-004)
- Related PBI: EPIC-001 (User Authentication)

**Component: [LoansApi]** (ejemplo si aplica)
- Purpose: [...]
- ATCs to implement: [...]
- Related PBI: [...]

[Listar todos los componentes API necesarios basados en épicas]

---

### UI Components

Basado en páginas/vistas del proyecto:

**Component: LoginPage**
- Purpose: Página de login
- ATCs to implement:
  - `login_successfully` (maps to AUTH-001)
  - `login_with_invalid_credentials` (maps to AUTH-002)
  - `login_with_expired_session` (maps to AUTH-003)
- Related PBI: EPIC-001 (User Authentication)

**Component: [DashboardPage]**
- Purpose: [...]
- ATCs to implement: [...]
- Related PBI: [...]

[Listar todos los componentes UI necesarios basados en páginas]

---

## 3. Implementation Roadmap

### Phase 1: Foundation (Week 1)

**Goal**: Setup completo de arquitectura KATA

**Tasks**:
1. Crear estructura de directorios:
   ```
   /tests
   ├── /components
   │   ├── testcontext.py (o .ts)
   │   ├── /api
   │   │   └── api_base.py
   │   └── /ui
   │       └── ui_base.py
   ├── /integration
   └── /e2e
   ```

2. Implementar TestContext:
   - Config loading (dev, staging, prod)
   - Faker setup
   - Logger setup
   - HTTP client (requests.Session o fetch wrapper)

3. Implementar ApiBase:
   - Helper methods: `_get`, `_post`, `_put`, `_delete`
   - URL building: `_full_url`
   - Error handling base

4. Implementar UiBase:
   - Playwright Page wrapper
   - Navigation helpers: `navigate_to`, `wait_for_element`
   - Screenshot helpers

5. Crear decorador @atc:
   - Implementar trazabilidad (captura de resultados)
   - Implementar soft_fail
   - Generar JSON report

**Deliverables**:
- Estructura de carpetas completa
- Base classes funcionales
- Decorador @atc implementado

---

### Phase 2: Core Components (Week 2)

**Goal**: Implementar componentes críticos (auth + CRUD básico)

**Priority 1 - Authentication (API + UI)**:

1. Implementar `UsersApi`:
   - `create_user_successfully`
   - `login_successfully`
   - `logout_successfully`

2. Implementar `LoginPage`:
   - `login_successfully`
   - `login_with_invalid_credentials`

3. Crear ApiFixture y UiFixture:
   - Instanciar componentes
   - Inyección de dependencias

4. Escribir primeros tests E2E:
   - `test_user_registration_journey`
   - `test_login_logout_flow`

**Deliverables**:
- 2 componentes funcionales (UsersApi, LoginPage)
- Fixtures configurados
- 2 tests E2E pasando

---

### Phase 3: Expansion (Week 3-4)

**Goal**: Implementar componentes restantes hasta alcanzar coverage goal

**Priorización**:
1. Componentes de épicas High priority (según PBI)
2. Componentes de épicas Medium priority
3. Componentes Low priority (si hay tiempo)

**Strategy**:
- Implementar 2-3 componentes por semana
- Cada componente con al menos 3 ATCs (happy + 2 edge cases)
- Tests E2E para journeys críticos

**Deliverables**:
- [X] componentes API completos
- [Y] componentes UI completos
- Coverage: 80% unit, 90% integration, top 10 journeys E2E

---

### Phase 4: Integration & Polish (Week 5)

**Goal**: Integración completa con TMS + CI/CD + refactoring

**Tasks**:
1. Integración Xray:
   - Configurar variables de entorno
   - Validar sync automático
   - Crear test executions

2. CI/CD setup:
   - GitHub Actions workflow
   - Parallel execution
   - Artifact upload (reports, screenshots)

3. Refactoring:
   - Eliminar duplicación
   - Mejorar nombres de ATCs
   - Documentar componentes

**Deliverables**:
- Suite completa ejecutándose en CI
- Resultados sincronizándose con Xray
- Documentación actualizada (component-catalog.md, atc-registry.md)

---

## 4. ATC Prioritization

Orden de implementación de ATCs:

### Tier 1 (Critical - Week 2)
1. `UsersApi.create_user_successfully` → USER-001
2. `UsersApi.login_successfully` → AUTH-001
3. `LoginPage.login_successfully` → AUTH-001 (UI)
4. `DashboardPage.verify_welcome_message` → DASH-001

### Tier 2 (High Priority - Week 3)
[Listar ATCs high priority basados en test cases críticos del PBI]

### Tier 3 (Medium Priority - Week 4)
[Listar ATCs medium priority]

### Tier 4 (Low Priority - Backlog)
[Listar ATCs nice-to-have]

---

## 5. Migration Strategy (Solo Legacy)

**Si el proyecto YA tiene una suite de tests:**

### Step 1: Assess Existing Suite
- ¿Qué framework usa? (pytest, jest, etc.)
- ¿Cuántos tests hay?
- ¿Están organizados? (POM, helpers, etc.)
- ¿Coverage actual?

### Step 2: Identify Candidates for Migration
- Priorizar tests que se repiten mucho
- Identificar bloques reutilizables → candidatos a ATCs

### Step 3: Migrate Incrementally
- No reescribir todo de golpe
- Migrar componente por componente
- Mantener suite vieja funcionando en paralelo

### Step 4: Validate & Replace
- Validar que nuevos ATCs pasan igual que tests viejos
- Eliminar tests legacy gradualmente

**Si NO hay suite de tests:**

### Enfoque: Tests de Caracterización Primero
1. Capturar comportamiento actual del sistema (aunque tenga bugs)
2. Safety net para refactoring
3. Luego agregar tests para nuevas features

---

## 6. Success Criteria

**La implementación está completa cuando:**

- [ ] Todos los componentes identificados están implementados
- [ ] Coverage goals alcanzados (80% unit, 90% int, top journeys E2E)
- [ ] 100% de ATCs mapeados a test cases en Jira
- [ ] Suite ejecutándose en CI sin fallos
- [ ] Sincronización con Xray funcionando
- [ ] Documentación completa (catalog + registry actualizado)
- [ ] Tiempo de ejecución E2E < 10 min

---

**Output:** Archivo Markdown listo para `.context/tae/kata-implementation-plan.md`

**Nota para IA:**
- Adaptar componentes según épicas reales del PBI del proyecto
- Si es **GREENFIELD**: Lista completa de componentes desde cero
- Si es **LEGACY**: Evaluar suite existente + plan de migración específico
```

---

#### **Prompt: automation-standards.md**

```md
Actúa como Senior Test Automation Engineer y Code Reviewer.

**Contexto:**
Necesito definir estándares de código específicos para la suite de tests automatizados de este proyecto.

**Input:**
- KATA Architecture: [referencia a kata-architecture.md]
- Tech Stack: [Python/TypeScript] con [pytest/Vitest] + Playwright
- Project Code Standards: [pegar /guidelines/code-standards.md si existe]

**Genera Automation Standards:**

## 1. Naming Conventions

### Components

**API Components:**
- Formato: `{Resource}Api` (plural)
- Ejemplos: `UsersApi`, `ProductsApi`, `PaymentsApi`
- File: `tests/components/api/users_api.py` (snake_case)

**UI Components:**
- Formato: `{Page/Widget}Page` (singular)
- Ejemplos: `LoginPage`, `CheckoutPage`, `DashboardPage`
- File: `tests/components/ui/login_page.py`

---

### ATCs (Acceptance Test Cases)

**Pattern**: `{verb}_{resource}_{scenario}_{condition}`

**Reglas:**
- Usar infinitivo en inglés (o español según convención del equipo)
- Ser descriptivo pero conciso
- Indicar si es positivo (`successfully`) o negativo (`with_invalid_X`)

**Ejemplos:**
- ✅ `create_user_successfully`
- ✅ `login_with_invalid_credentials`
- ✅ `delete_product_with_missing_id`
- ❌ `test_user` (muy genérico)
- ❌ `createUserSuccessfully` (camelCase, usar snake_case)

---

### Test Files

**Pattern**: `test_{feature}_{scenario}.py`

**Ejemplos:**
- `test_user_registration.py`
- `test_login_flow.py`
- `test_purchase_journey.py`

---

## 2. Component Structure

### File Template

```python
# tests/components/api/users_api.py
from components.api.api_base import ApiBase
from utils.decorators import atc

class UsersApi(ApiBase):
    """API Component for user management."""

    # ============== ATCs (Acceptance Test Cases) ==============

    @atc(test_id="USER-001")
    def create_user_successfully(self, name: str, email: str, password: str) -> dict:
        """
        ATC: Create user with valid data.

        Args:
            name: User full name
            email: Unique email address
            password: Password (min 8 chars)

        Returns:
            dict: Created user with ID assigned

        Fixed Validations:
            - Response status 201
            - User returned contains ID
            - Email matches sent value
        """
        # ARRANGE
        payload = {"name": name, "email": email, "password": password}

        # ACT
        response = self._post("/users", json=payload)

        # ASSERT (Fixed Assertions)
        assert response.status_code == 201, f"Expected 201, got {response.status_code}"
        user = response.json()
        assert "id" in user, "User ID not returned"
        assert user["email"] == email, f"Email mismatch: expected {email}, got {user['email']}"

        self.logger.info(f"✅ User created: {user['id']}")
        return user

    # ============== Private Helpers (if needed) ==============

    def _validate_user_schema(self, user: dict) -> bool:
        """Private helper for schema validation."""
        required_fields = ["id", "name", "email", "created_at"]
        return all(field in user for field in required_fields)
```

---

### Order of Methods

1. **Locators** (solo para UI components)
2. **ATCs** (métodos públicos con decorador @atc)
3. **Private Helpers** (métodos internos sin decorador)

---

## 3. Test Structure

### Pattern: Arrange-Act-Assert (AAA)

```python
def test_user_registration_happy_path(fixture):
    """Test de integración: Registro de usuario exitoso."""

    # ARRANGE: Preparar datos
    test_data = {
        "name": fixture.api.faker.name(),
        "email": fixture.api.faker.email(),
        "password": "SecurePass123"
    }

    # ACT: Ejecutar acción
    user = fixture.api.users.create_user_successfully(**test_data)

    # ASSERT: Validar resultado (test-level assertions)
    assert user["name"] == test_data["name"]
    assert user["email"] == test_data["email"]

    # Cleanup (si es necesario)
    # fixture.api.users.delete_user(user["id"])
```

---

### Test Naming

**Pattern**: `test_{scenario}_{expected_outcome}`

**Ejemplos:**
- `test_registration_successful_with_valid_data`
- `test_login_fails_with_invalid_password`
- `test_purchase_completes_with_credit_card`

---

## 4. Docstrings

### Component Docstrings

```python
class UsersApi(ApiBase):
    """
    API Component for user management.

    Provides ATCs for:
    - User creation (register)
    - User authentication (login/logout)
    - User CRUD operations

    Related PBI: EPIC-001 (User Authentication)
    """
```

---

### ATC Docstrings

**Required sections:**
1. Brief description
2. Args (with types)
3. Returns (with type)
4. Fixed Validations (qué assertions están embebidas)

```python
@atc(test_id="USER-001")
def create_user_successfully(self, name: str, email: str) -> dict:
    """
    ATC: Create user with valid data.

    Args:
        name: User full name
        email: Unique email address

    Returns:
        dict: Created user with ID

    Fixed Validations:
        - Status code 201
        - User ID present
    """
```

---

## 5. Type Hints

**ALWAYS use type hints** (Python typing / TypeScript types)

```python
# ✅ Good
def create_user_successfully(self, email: str, password: str) -> dict:
    pass

# ❌ Bad
def create_user_successfully(self, email, password):
    pass
```

---

## 6. Assertions

### Fixed Assertions (dentro de ATCs)

- Validar que la acción funcionó correctamente
- Status codes, campos obligatorios, tipos de datos

```python
@atc(test_id="USER-001")
def create_user_successfully(self, email: str) -> dict:
    response = self._post("/users", json={"email": email})

    # Fixed assertions
    assert response.status_code == 201
    assert "id" in response.json()

    return response.json()
```

---

### Test-Level Assertions (en tests)

- Validar resultado de combinar acciones
- Estado final del sistema

```python
def test_refund_reduces_balance(fixture):
    loan = fixture.api.loans.create_loan_successfully(amount=1000)
    refund = fixture.api.payments.refund_payment_successfully(loan["id"], 200)

    # Test-level assertion
    updated_loan = fixture.api.loans.get_loan(loan["id"])
    assert updated_loan["balance"] == 800
```

---

### Assertion Messages

**ALWAYS include descriptive messages:**

```python
# ✅ Good
assert response.status_code == 201, f"Expected 201, got {response.status_code}"

# ❌ Bad
assert response.status_code == 201
```

---

## 7. Error Handling

**En ATCs:**
- Dejar que errores propaguen (no catch silencioso)
- Logs antes de assertions para debugging

```python
@atc(test_id="USER-001")
def create_user_successfully(self, email: str) -> dict:
    self.logger.info(f"🚀 Creating user: {email}")

    response = self._post("/users", json={"email": email})

    if response.status_code != 201:
        self.logger.error(f"❌ Failed: {response.text}")

    assert response.status_code == 201

    self.logger.info(f"✅ User created successfully")
    return response.json()
```

---

## 8. Code Quality

### Linting

- **Python**: `ruff` o `flake8`
- **TypeScript**: `eslint` con reglas de Playwright/Vitest

**Run on commit:**
```bash
bun run lint  # o python -m ruff check
```

---

### Type Checking

- **Python**: `mypy --strict`
- **TypeScript**: `tsc --noEmit`

**Run on PR:**
```bash
bun run typecheck
```

---

### Coverage

**Minimums:**
- Unit tests: 80%
- Integration tests: 90%
- E2E tests: Top 10 user journeys

**Run:**
```bash
bun run test --coverage
```

---

## 9. Test Independence

**CRITICAL: Tests must be independent**

```python
# ✅ Good - cada test crea sus propios datos
def test_scenario_a(fixture):
    user = fixture.api.users.create_user_successfully(...)
    # test logic

def test_scenario_b(fixture):
    user = fixture.api.users.create_user_successfully(...)  # NOT reusing from scenario_a
    # test logic
```

```python
# ❌ Bad - shared state
global_user = None

def test_scenario_a(fixture):
    global global_user
    global_user = fixture.api.users.create_user_successfully(...)

def test_scenario_b():
    assert global_user is not None  # DEPENDS on scenario_a running first
```

---

## 10. Code Review Checklist

Antes de aprobar un PR con tests:

- [ ] Nombres de componentes siguen convención (`UsersApi`, `LoginPage`)
- [ ] Nombres de ATCs siguen pattern (`create_user_successfully`)
- [ ] Todos los ATCs tienen decorador `@atc(test_id="XXX")`
- [ ] Docstrings completos (descripción, args, returns, fixed validations)
- [ ] Type hints en todos los métodos
- [ ] Assertions con mensajes descriptivos
- [ ] AAA pattern en tests (Arrange-Act-Assert)
- [ ] Tests independientes (no shared state)
- [ ] Logging apropiado (🚀 inicio, ✅ éxito, ❌ error)
- [ ] Linting passing (`bun run lint`)
- [ ] Type checking passing (`bun run typecheck`)
- [ ] Coverage acceptable (>80%)

---

**Output:** Archivo Markdown listo para `.context/tae/automation-standards.md`

**Nota para IA:**
- Adaptar ejemplos al lenguaje del proyecto (Python/TypeScript)
- Si es proyecto **LEGACY**: Agregar sección de "Migration Standards" para estandarizar código legacy
```

---

## 📚 GUIDELINES PARA IA

### **Contenido de `/guidelines`**

```

/guidelines
├── README.md
├── implementation-workflow.md
├── code-standards.md
├── error-handling.md
├── context-loading.md
├── automation-workflow.md
└── mcp-usage-tips.md

```

---

#### **README.md**

```markdown
# Guidelines para IA

Este directorio contiene system prompts y best practices para que la IA trabaje eficientemente en el proyecto.

## Índice de Guidelines

1. **implementation-workflow.md**: Workflow paso a paso para implementación
2. **code-standards.md**: Estándares de código (DRY, naming, patterns)
3. **error-handling.md**: Cómo manejar errores correctamente
4. **context-loading.md**: Qué archivos leer en cada fase
5. **automation-workflow.md**: Workflow para testing automation
6. **mcp-usage-tips.md**: Cuándo y cómo usar MCP tools

## Cuándo leer cada guideline

- **Antes de implementar**: Leer todos los guidelines
- **Durante implementation**: Referenciar `code-standards.md` y `error-handling.md`
- **Durante testing**: Referenciar `automation-workflow.md`
- **Cuando uses MCP tools**: Referenciar `mcp-usage-tips.md`

---

## 📂 Organización de Documentación

### `.context` (Para IA - RAG)
- Documentos estructurados para que la IA los lea sistemáticamente
- Aplicación de Context Engineering
- Living documentation (siempre actualizado)
- Usado como fuente de verdad para generación de código

### `/docs` (Para Humanos)
- Documentación para lectura humana
- Guías, tutoriales, arquitectura high-level
- No necesariamente leído por la IA durante implementación

**Regla de oro**: Si la IA lo necesita para trabajar → `.context`. Si es solo para humanos → `/docs`

---

## 🔧 Scripts y Herramientas

### MCP Management Scripts
Este proyecto incluye scripts para gestión eficiente de MCPs (Model Context Protocol):
- Activar/desactivar MCPs por sesión
- Configurar contexto específico para diferentes tareas
- **Uso**: Ejecutados por humanos antes de iniciar chat con CodeAgent
- **Beneficio**: Context Engineering optimizado, solo MCPs necesarios activos

**Nota**: Estos scripts NO necesitan ser usados por la IA, son herramientas para el desarrollador humano.
```

---

#### **implementation-workflow.md**

```md
# Implementation Workflow

Workflow paso a paso para implementar una User Story.

## Step 1: Context Loading

**Archivos a leer (en orden):**
1. `.context/pbi/epics/EPIC-XXX/stories/STORY-XXX/story.md`
2. `.context/pbi/epics/EPIC-XXX/stories/STORY-XXX/test-cases.md`
3. `.context/pbi/epics/EPIC-XXX/stories/STORY-XXX/implementation-plan.md`
4. `.context/pbi/epics/EPIC-XXX/feature-implementation-plan.md`
5. `.context/srs/architecture-specs.md` (si necesitas entender arquitectura)

**⚠️ IMPORTANTE:** Usar Supabase MCP para ver schema actual de DB, NO confiar en docs estáticas.

---

## Step 2: Planning Verification

**Verificar que el plan es claro:**
- [ ] ¿Entiendo todos los acceptance criteria?
- [ ] ¿Entiendo todos los edge cases?
- [ ] ¿Entiendo las decisiones técnicas?
- [ ] ¿Tengo todos los pre-requisitos?

**Si algo no está claro:** Preguntar al usuario ANTES de implementar.

---

## Step 3: Task Breakdown

**Dividir implementation plan en subtareas atómicas:**

Ejemplo:
- Subtask 1: Database migration (30 min)
- Subtask 2: Zod validation schema (30 min)
- Subtask 3: API endpoint (2h)
- Subtask 4: Frontend component (2h)
- Subtask 5: Integration (1h)

**Execution order:** Seguir el orden del implementation plan (generalmente: DB → Backend → Frontend → Integration)

---

## Step 4: Implementation (por subtask)

**Por cada subtask:**

1. **Leer guidelines relevantes:**
   - `code-standards.md` (SIEMPRE)
   - `error-handling.md` (si hay manejo de errores)
   - `mcp-usage-tips.md` (si usas Supabase MCP, Atlassian MCP, etc.)

2. **Implementar según plan**

3. **Quality checks:**
   - [ ] `bun run lint` (verificar linting)
   - [ ] `bun run build` (verificar TypeScript)
   - [ ] `mcp__ide__getDiagnostics` (verificar inconsistencias)

4. **Si hay error:**
   - Leer error message completo
   - Verificar que contexto cargado es correcto
   - Usar Supabase MCP para verificar estado real de DB
   - **NO hardcodear soluciones** (ver `error-handling.md`)

---

## Step 5: Testing

**Después de implementar todas las subtasks:**

1. **Ejecutar tests:**
   - Unit tests: `bun run test`
   - E2E tests: `bun run test:e2e`

2. **Verificar test cases:**
   - Referenciar `.context/pbi/epics/EPIC-XXX/stories/STORY-XXX/test-cases.md`
   - Verificar que TODOS los test cases pasan

3. **Manual smoke test:**
   - Probar happy path manualmente en staging

---

## Step 6: Code Review Preparation

**Antes de marcar como completo:**
- [ ] Código cumple `code-standards.md`
- [ ] Error handling cumple `error-handling.md`
- [ ] Todos los test cases pasando
- [ ] Definition of Done completo
- [ ] Documentación actualizada (si aplica)

---

## Common Pitfalls (Evitar)

❌ **NO hacer:**
- Hardcodear fallbacks en lugar de error handlers
- Confiar en docs estáticas de DB
- Implementar sin leer test cases
- Saltar quality checks

✅ **SÍ hacer:**
- Leer TODOS los archivos de contexto
- Usar Supabase MCP para schema real
- Implementar error handlers reutilizables
- Ejecutar quality checks después de cada subtask
```

---

#### **code-standards.md**

```md
# Code Standards

Estándares de código para mantener calidad y consistencia.

## Principio #1: DRY (Don't Repeat Yourself)

**SIEMPRE evitar código duplicado.**

❌ **MAL:**
```typescript
// En RegisterForm.tsx
if (password.length < 8) {
  setError('Mínimo 8 caracteres')
}

// En LoginForm.tsx
if (password.length < 8) {
  setError('Mínimo 8 caracteres')
}
```

✅ **BIEN:**

```typescript
// En /lib/validations/auth.ts
export const passwordSchema = z.string().min(8, 'Mínimo 8 caracteres')

// En RegisterForm.tsx y LoginForm.tsx
passwordSchema.parse(password)
```

---

## Principio #2: Error Handling (NO hardcodear)

**Ver `error-handling.md` para detalles.**

❌ **MAL:**

```typescript
try {
  await createUser(email)
} catch (error) {
  return { success: false, error: 'Something went wrong' } // ❌ Hardcoded
}
```

✅ **BIEN:**

```typescript
try {
  await createUser(email)
} catch (error) {
  return handleApiError(error) // ✅ Reutilizable
}
```

---

## Naming Conventions

### Variables y Funciones

- **camelCase**: `userName`, `fetchUserData()`
- Descriptivos: `isLoading` (no `loading`), `hasError` (no `error`)

### Componentes React

- **PascalCase**: `RegisterForm`, `UserProfile`
- Archivo mismo nombre que componente: `RegisterForm.tsx`

### Constants

- **UPPER_SNAKE_CASE**: `MAX_PASSWORD_LENGTH`, `API_BASE_URL`

### Files/Folders

- **kebab-case**: `user-profile.ts`, `auth-utils/`

---

## TypeScript

**SIEMPRE usar TypeScript strict mode.**

❌ **MAL:**

```typescript
function createUser(data: any) { // ❌ any
  return fetch('/api/users', { body: data })
}
```

✅ **BIEN:**

```typescript
interface CreateUserInput {
  email: string
  password: string
}

function createUser(data: CreateUserInput) {
  return fetch('/api/users', { body: JSON.stringify(data) })
}
```

---

## Component Structure (React)

```typescript
'use client' // Si es client component

import { useState } from 'react'
import { ComponentProps } from './types'

// 1. Types/Interfaces
interface Props {
  // ...
}

// 2. Component
export function MyComponent({ prop1, prop2 }: Props) {
  // 3. Hooks
  const [state, setState] = useState()

  // 4. Handlers
  const handleClick = () => {
    // ...
  }

  // 5. Effects (si aplica)
  useEffect(() => {
    // ...
  }, [])

  // 6. Render
  return (
    <div>
      {/* ... */}
    </div>
  )
}
```

---

## Code Organization

### Imports Order

```typescript
// 1. React/Next.js
import { useState } from 'react'
import { useRouter } from 'next/navigation'

// 2. External libraries
import { z } from 'zod'

// 3. Internal utilities
import { createClient } from '@/lib/supabase/client'

// 4. Components
import { Button } from '@/components/ui/button'

// 5. Types
import type { User } from '@/types'
```

### File Structure

```
/app
  /api         → API routes
  /(routes)    → Route groups
  /page.tsx    → Pages

/components
  /ui          → Reusable UI components
  /auth        → Feature-specific components

/lib
  /utils       → Utility functions
  /validations → Zod schemas
  /supabase    → Supabase client

/types
  index.ts     → Shared types
```

---

## Comments

**Comentar el POR QUÉ, no el QUÉ.**

❌ **MAL:**

```typescript
// Incrementa counter en 1
counter++
```

✅ **BIEN:**

```typescript
// Incrementar para trigger re-render y actualizar UI
counter++
```

**Usar JSDoc para funciones públicas:**

```typescript
/**
 * Creates a new user in Supabase Auth
 * @param email - User email (must be valid format)
 * @param password - User password (min 8 chars)
 * @returns User ID if successful
 * @throws {AuthError} If email already exists
 */
async function createUser(email: string, password: string): Promise<string> {
  // ...
}
```

---

## Testing

**Todos los archivos deben tener tests.**

- Unit tests: `*.test.ts` (junto al archivo)
- E2E tests: `/tests/e2e/`

**Coverage mínimo: 80%**

```bash
bun run test --coverage
```

---

## Performance

### Evitar re-renders innecesarios

```typescript
// ✅ Memoize callbacks
const handleClick = useCallback(() => {
  // ...
}, [dependencies])

// ✅ Memoize expensive calculations
const expensiveValue = useMemo(() => {
  return computeExpensiveValue(data)
}, [data])
```

### Lazy loading

```typescript
// ✅ Lazy load components
const HeavyComponent = lazy(() => import('./HeavyComponent'))
```

---

## Accessibility (a11y)

**SIEMPRE agregar:**

- `data-testid` para testing
- ARIA labels para screen readers
- Keyboard navigation (tab, enter, escape)

```typescript
<button
  data-testid="register-button"
  aria-label="Registrar cuenta"
  onClick={handleRegister}
>
  Registrar
</button>
```

```

---

#### **error-handling.md**

```md
# Error Handling

Cómo manejar errores correctamente sin hardcodear.

## Principio #1: Error primero, NUNCA hardcodear fallbacks

❌ **MAL (hardcodear):**
```typescript
try {
  const user = await getUser(id)
  return user.name
} catch (error) {
  return 'Usuario desconocido' // ❌ Hardcoded fallback
}
```

✅ **BIEN (error handler):**

```typescript
try {
  const user = await getUser(id)
  return user.name
} catch (error) {
  throw new UserNotFoundError(id) // ✅ Error específico
}
```

**Razón:** Hardcodear oculta errores reales. Mejor fallar explícitamente y manejar en un layer superior.

---

## Structured Error Responses (APIs)

**Formato consistente:**

```typescript
interface ApiErrorResponse {
  success: false
  error: {
    code: string // Error code (para programmatic handling)
    message: string // User-friendly message
    details?: unknown // Optional debug info
  }
}
```

**Ejemplo:**

```typescript
return NextResponse.json(
  {
    success: false,
    error: {
      code: 'EMAIL_ALREADY_EXISTS',
      message: 'Este email ya está registrado',
      details: { email: input.email } // Only in dev
    }
  },
  { status: 400 }
)
```

---

## Custom Error Classes

**Crear error classes específicos:**

```typescript
// /lib/errors.ts

export class AppError extends Error {
  constructor(
    message: string,
    public code: string,
    public statusCode: number
  ) {
    super(message)
    this.name = this.constructor.name
  }
}

export class EmailAlreadyExistsError extends AppError {
  constructor(email: string) {
    super(
      'Este email ya está registrado',
      'EMAIL_ALREADY_EXISTS',
      400
    )
  }
}

export class InvalidInputError extends AppError {
  constructor(message: string, public details?: unknown) {
    super(message, 'INVALID_INPUT', 400)
  }
}
```

**Uso:**

```typescript
if (existingUser) {
  throw new EmailAlreadyExistsError(input.email)
}
```

---

## Error Handler Reutilizable (API)

**File:** `/lib/api/error-handler.ts`

**Function:** `handleApiError(error: unknown)`

**Logic:**

1. Check if ZodError → Return 400 with VALIDATION_ERROR
2. Check if AppError (custom) → Return with error.code and error.statusCode
3. Otherwise → Log error + Return 500 with INTERNAL_ERROR

**Response Format:** Always return structured `{success: false, error: {code, message, details?}}`

**Uso:** Wrap all API route try-catch blocks with `return handleApiError(error)`

---

## Logging Best Practices

**SIEMPRE log errors (pero no exponerlos al usuario):**

```typescript
try {
  await sensitiveOperation()
} catch (error) {
  // ✅ Log para debugging
  console.error('[API] Sensitive operation failed:', {
    userId: user.id,
    error: error instanceof Error ? error.message : 'Unknown error',
    stack: error instanceof Error ? error.stack : undefined
  })

  // ❌ NO exponer detalles al usuario
  throw new AppError(
    'No pudimos completar la operación',
    'OPERATION_FAILED',
    500
  )
}
```

---

## User-Facing Error Messages

**Mensajes claros y accionables:**

❌ **MAL:**

- "Error 500"
- "Something went wrong"
- "Failed to create user"

✅ **BIEN:**

- "Este email ya está registrado. ¿Olvidaste tu contraseña?"
- "Tu password debe tener al menos 8 caracteres"
- "No pudimos enviar el email de verificación. Por favor intenta de nuevo."

---

## Error Boundaries (React)

**File:** `/components/ErrorBoundary.tsx`

**Pattern:** React Class Component with error handling

**Key Methods:**

- `getDerivedStateFromError()` - Capture error state
- `componentDidCatch()` - Log error for debugging
- `render()` - Show fallback UI when error occurs

**Props:**

- `children` - Components to wrap
- `fallback?` - Custom error UI (optional)

**Usage:** Wrap app sections prone to errors (e.g., `<ErrorBoundary><UserProfile /></ErrorBoundary>`)

---

## Retry Logic (para operaciones críticas)

**Pattern:** Retry function with exponential backoff

**Function:** `retryOperation<T>(operation, maxRetries=3, delayMs=1000)`

**Logic:**

- Try operation up to `maxRetries` times
- Wait `delayMs` between attempts
- If all retries fail → Throw MAX_RETRIES_EXCEEDED error

**Use cases:** Network requests, external API calls, transient failures

**Example usage:** `const user = await retryOperation(() => createUser(email, password))`

```

---

#### **context-loading.md**

```md
# Context Loading

Qué archivos leer en cada fase para tener el contexto correcto.

## Living Documentation

⚠️ **REGLA DE ORO:** SIEMPRE usar fuentes reales (MCPs), NO docs estáticas.

**Ejemplo:**
```typescript
// ❌ MAL: Confiar en docs estáticas
// Leer SQL schema de .context/srs/database-schema.sql

// ✅ BIEN: Obtener schema real
// Usar Supabase MCP: list_tables + execute_sql
```

---

## Fase 1: Constitution

**Archivos a leer:**

- `.context/idea/business-model.md`
- `.context/idea/market-context.md`

**MCPs a usar:** Ninguno

---

## Fase 2: Specification (PRD + SRS + PBI)

**Archivos a leer:**

- `.context/idea/*.md` (contexto previo)
- `.context/prd/*.md` (generar)
- `.context/srs/*.md` (generar)
- `.context/pbi/epic-tree.md` (generar)
- `.context/pbi/epics/*/epic.md` (generar)
- `.context/pbi/epics/*/stories/*/story.md` (generar)

**MCPs a usar:**

- **Atlassian MCP**: Crear épicas/stories en Jira
- **Supabase MCP**: Verificar DB existente (si aplica)

---

## Fase 3: Shift-Left Testing

**Por cada épica:**

- Leer `.context/pbi/epics/EPIC-XXX/epic.md`
- Leer `.context/srs/*.md` (NFRs relevantes)
- Generar `.context/pbi/epics/EPIC-XXX/feature-test-plan.md`

**Por cada story:**

- Leer `.context/pbi/epics/EPIC-XXX/stories/STORY-XXX/story.md`
- Leer `.context/pbi/epics/EPIC-XXX/feature-test-plan.md`
- Leer `.context/srs/functional-specs.md` (FR relacionados)
- Generar `.context/pbi/epics/EPIC-XXX/stories/STORY-XXX/test-cases.md`

**MCPs a usar:**

- **Atlassian MCP**: Crear test cases en Xray

---

## Fase 4: Planning

**Por cada épica (feature plan):**

- Leer `.context/pbi/epics/EPIC-XXX/epic.md`
- Leer `.context/srs/*.md` (arquitectura, tech stack)
- Leer `.context/pbi/epics/EPIC-XXX/feature-test-plan.md`
- Generar `.context/pbi/epics/EPIC-XXX/feature-implementation-plan.md`

**Por cada story (implementation plan):**

- Leer `.context/pbi/epics/EPIC-XXX/stories/STORY-XXX/story.md`
- Leer `.context/pbi/epics/EPIC-XXX/stories/STORY-XXX/test-cases.md`
- Leer `.context/pbi/epics/EPIC-XXX/feature-implementation-plan.md`
- Leer `.context/srs/architecture-specs.md` (si necesita arquitectura)
- Generar `.context/pbi/epics/EPIC-XXX/stories/STORY-XXX/implementation-plan.md`

**MCPs a usar:**

- **Supabase MCP**: `list_tables`, `execute_sql` (ver schema actual)

---

## Fase 5-6: Tasking + Implementation

**Antes de codear:**

1. Leer `.context/pbi/epics/EPIC-XXX/stories/STORY-XXX/implementation-plan.md`
2. Leer `.context/guidelines/*.md` (TODOS)
3. Leer codebase context:
   - Archivos relacionados existentes
   - Utilities relevantes (`/lib/`)
   - Componentes similares (`/components/`)

**Durante implementation:**

- Referenciar `.context/guidelines/code-standards.md`
- Referenciar `.context/guidelines/error-handling.md`
- Referenciar `.context/guidelines/mcp-usage-tips.md` (cuando uses MCPs)

**MCPs a usar:**

- **Supabase MCP**:
    - `list_tables` (ver schema actual)
    - `execute_sql` (queries complejas)
    - `apply_migration` (crear/modificar tables)
- **Atlassian MCP**:
    - Consultar story details si es necesario
    - Actualizar status de story
- **IDE Diagnostics**:
    - `mcp__ide__getDiagnostics` (después de cambios significativos)

---

## Context Loading Checklist (antes de cada task)

- [ ] ¿Leí todos los archivos de la story?
- [ ] ¿Leí el feature plan de la épica?
- [ ] ¿Leí los guidelines relevantes?
- [ ] ¿Usé Supabase MCP para ver schema real?
- [ ] ¿Leí código existente relacionado?
- [ ] ¿Entiendo todos los acceptance criteria?
- [ ] ¿Entiendo todos los edge cases?

**Si falta algo → Leer ANTES de implementar.**

```

---

#### **automation-workflow.md**

```md
# Automation Workflow

Workflow para testing automation (Fases 7-9 del DOJO).

## Principios de Automation

1. **Arquitectura KATA** (Shared Actions Test Architect)
   - Acciones compartidas reutilizables
   - Page Object Model (POM)
   - Utilities y helpers centralizados

2. **Layers de Testing**
   - UI Layer (Playwright E2E)
   - API Layer (Supertest / Fetch)
   - Database Layer (Direct queries via Supabase MCP)

3. **Data-Driven Testing**
   - Test data en archivos externos (JSON/CSV)
   - Parametrización de tests

---

## Test Organization

```

/tests
├── /e2e (Playwright)
│   ├── /auth
│   │   ├── register.spec.ts
│   │   └── login.spec.ts
│   └── /user-profile
│       └── edit-profile.spec.ts
│
├── /integration (API + DB)
│   ├── /api
│   │   └── auth.test.ts
│   └── /database
│       └── users.test.ts
│
├── /unit
│   └── (junto a archivos .ts)
│
└── /helpers (Shared utilities)
    ├── page-objects/
    ├── test-data/
    └── utils/

```

---

## E2E Testing (Playwright)

### Page Object Model (POM)

**Pattern:** Encapsulate page elements and actions in classes

**Structure:**
- **Locators** (getters): Return page elements by data-testid
- **Actions** (methods): Perform user interactions (fill, click, navigate)
- **Assertions** (methods): Verify expected outcomes

**Benefits:** Reusable actions, maintainable tests, reduced duplication

**Example:** `RegisterPage` class with `emailInput`, `passwordInput`, `register()` method

---

### Test Structure (E2E)

**Framework:** Playwright

**Pattern:** AAA (Arrange-Act-Assert)

**Structure:**
- `test.describe()` - Group related tests
- `test.beforeEach()` - Setup (create page objects, navigate)
- `test()` - Individual test cases with TC-XXX naming
- Assertions with `expect()`

**Data:** Import from `/tests/helpers/test-data/*.json`

**Example:** Test registration flow (happy path + error cases)

---

## API Testing

**Framework:** Vitest

**Pattern:** Direct HTTP calls to API endpoints

**Structure:**
- Arrange: Prepare input data
- Act: fetch() call to API endpoint
- Assert: Verify status code + response structure

**Test Coverage:**
- Happy path (201 success)
- Error cases (400 validation, 400 duplicate, 500 server error)

**Example:** POST /api/auth/register with valid/invalid data

---

## Database Testing (via Supabase MCP)

**Approach:** Direct database queries using Supabase MCP

**Test Types:**
- Schema validation (constraints, defaults)
- Data integrity (unique, foreign keys)
- RLS policies (if applicable)

**Pattern:**
- Arrange: Prepare test data
- Act: execute_sql() via Supabase MCP
- Assert: Verify database state

**Example:** Test email UNIQUE constraint, default values

---

## Test Data Management

```json
// /tests/helpers/test-data/auth.json

{
  "validUser": {
    "email": "testuser@example.com",
    "password": "SecurePass123"
  },
  "duplicateUser": {
    "email": "duplicate@example.com",
    "password": "SecurePass123"
  },
  "weakPassword": {
    "email": "weakpass@example.com",
    "password": "123"
  },
  "invalidEmail": {
    "email": "invalid-email",
    "password": "SecurePass123"
  }
}
```

---

## CI/CD Integration (GitHub Actions)

```yaml
# .github/workflows/test.yml

name: Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: oven-sh/setup-bun@v1

      - name: Install dependencies
        run: bun install

      - name: Run linting
        run: bun run lint

      - name: Run unit tests
        run: bun run test

      - name: Run E2E tests
        run: bun run test:e2e

      - name: Upload test results
        if: always()
        uses: actions/upload-artifact@v3
        with:
          name: test-results
          path: test-results/
```

---

## Best Practices

1. **Independencia de tests**: Cada test debe poder ejecutarse solo
2. **Cleanup**: Limpiar datos de test después de cada run
3. **Flaky tests**: Evitar sleeps arbitrarios, usar waitFor
4. **Descriptive names**: Nombres de tests claros (TC-001: ...)
5. **AAA Pattern**: Arrange, Act, Assert

---

## Resources

- Playwright docs: <https://playwright.dev>
- Vitest docs: <https://vitest.dev>
- KATA Architecture: [Detalles en syllabus DOJO]

```

---

#### **mcp-usage-tips.md**

```md
# MCP Usage Tips

Cuándo y cómo usar MCP tools (Model Context Protocol).

## Available MCPs

1. **Supabase MCP**: Interacción con database
2. **Atlassian MCP**: Interacción con Jira
3. **IDE Diagnostics**: Verificar errores de TypeScript

---

## Supabase MCP

### **Cuándo usar:**
- ✅ Verificar schema actual de DB (SIEMPRE antes de migrations)
- ✅ Ejecutar migrations (crear/modificar tables)
- ✅ Queries complejas (JOIN, subqueries)
- ✅ Testing: Verificar datos insertados/actualizados

### **Cuándo NO usar:**
- ❌ Para queries simples en application code (usar Supabase Client)
- ❌ Durante runtime de la app (MCP es para desarrollo)

---

### **Common Operations:**

#### 1. Ver schema actual
```

Usar Supabase MCP:

- list_tables (staging project: jzhxmrtqnbfcmmqxbaoo)
- execute_sql("SELECT column_name, data_type FROM information_schema.columns WHERE table_name='users'")

```

#### 2. Ejecutar migration
```

Usar Supabase MCP:

- apply_migration(
    project_id: "jzhxmrtqnbfcmmqxbaoo",
    name: "create_users_table_v1",
    query: "CREATE TABLE users (...)"
  )

```

#### 3. Verificar datos (testing)
```

Usar Supabase MCP:

- execute_sql("SELECT * FROM users WHERE email='<test@example.com>'")

```

---

### **Projects:**
- **Staging**: `jzhxmrtqnbfcmmqxbaoo` (jzhxmrtqnbfcmmqxbaoo.supabase.co)
- **Production**: `eqyczlpowhdgulnkhjjm` (eqyczlpowhdgulnkhjjm.supabase.co)

⚠️ **SIEMPRE usar staging primero, luego production.**

---

## Atlassian MCP

### **Cuándo usar:**
- ✅ Crear épicas/stories en Jira (Fase 2)
- ✅ Crear test cases en Xray (Fase 3)
- ✅ Consultar story details (si necesitas datos live)
- ✅ Actualizar status de stories (durante implementation)

### **Cuándo NO usar:**
- ❌ Para leer stories (mejor leer archivos locales en `/pbi`)
- ❌ Durante runtime de la app

---

### **Common Operations:**

#### 1. Crear épica en Jira
```

Usar Atlassian MCP:

- create_issue(
    project_key: "UPEX",
    issue_type: "Epic",
    summary: "User Authentication & Authorization",
    description: "[pegar contenido de epic.md]"
  )

```

#### 2. Crear story en Jira
```

Usar Atlassian MCP:

- create_issue(
    project_key: "UPEX",
    issue_type: "Story",
    summary: "Como usuario, quiero registrarme con email",
    description: "[pegar contenido de story.md]",
    epic_link: "UPEX-1"
  )

```

#### 3. Crear test cases en Xray
```

Usar Atlassian MCP:

- create_test_case(
    project_key: "UPEX",
    summary: "TC-001: Registro exitoso",
    steps: "[pegar de test-cases.md]"
  )

```

---

## IDE Diagnostics MCP

### **Cuándo usar:**
- ✅ Después de cambios significativos en código
- ✅ Antes de commit (verificar no hay errores TypeScript)
- ✅ Cuando algo no funciona y no sabes por qué

### **Cuándo NO usar:**
- ❌ Después de cada línea de código (too frequent)
- ❌ Si ya ejecutaste `bun run build` (build ya verifica errores)

---

### **Common Operations:**

#### 1. Verificar errores de TypeScript
```

Usar mcp__ide__getDiagnostics después de:

- Agregar nuevo archivo
- Modificar types/interfaces
- Cambios en imports

```

---

## Best Practices

1. **Living Documentation**: SIEMPRE usar Supabase MCP para ver schema real, NO confiar en docs estáticas
2. **Staging First**: SIEMPRE probar en staging antes de production
3. **Error Handling**: Siempre verificar que MCP calls fueron exitosos
4. **Rate Limits**: No hacer demasiados calls seguidos (puede trigger rate limits)

---

## Troubleshooting

### "MCP tool not found"
- Verificar que MCP está configurado en Claude Code
- Ver configuración en `.claude/mcp.json`

### "Permission denied"
- Verificar environment variables (SUPABASE_SERVICE_ROLE_KEY, JIRA_API_TOKEN)
- Verificar que tienes permisos en Supabase/Jira

### "Connection timeout"
- Verificar internet connection
- Verificar que Supabase/Jira están accesibles
```

---

## 🔗 SINCRONIZACIÓN CON JIRA

### **Flujo Confirmado**

1. **Crear localmente en `/pbi`**
   - Generar epic-tree.md
   - Generar /epics/EPIC-XXX/epic.md
   - Generar /epics/EPIC-XXX/stories/STORY-XXX/story.md

2. **Sincronizar con Jira (Atlassian MCP)**
   - Crear épicas en Jira
   - Crear stories en Jira
   - Obtener IDs de Jira

3. **Actualizar archivos locales**
   - Actualizar `jira_id` en epic.md
   - Actualizar `jira_id` en story.md

4. **IA puede consultar Jira directamente (MCP)**
   - Cuando necesite datos live
   - Para actualizar status

---

### **Script de Sincronización (Futuro)**

**Opcional**: Crear script `bun run jira:sync` que:

- Lee /pbi/epics
- Por cada epic/story sin jira_id:
    - Crea en Jira via MCP
    - Actualiza archivo local con jira_id
- Por cada epic/story con jira_id:
    - Verifica si cambió en Jira
    - Actualiza archivo local si es necesario

---

## ✅ RESUMEN EJECUTIVO

### **Arquitectura Unificada**

- `/idea` (2 archivos) - Fase 1
- `/prd` (4 archivos) - Fase 2
- `/srs` (4 archivos) - Fase 2
- `/pbi` (TODO integrado) - Fases 2 + 3 + 4
    - Épicas = Carpetas (epic.md + feature-test-plan.md + feature-implementation-plan.md)
    - Stories = Carpetas (story.md + test-cases.md + implementation-plan.md + opcionales)
- `/guidelines` (7 archivos) - System prompts para IA

### **Eliminado**

- ❌ `/refinement` (integrado en `/pbi`)
- ❌ `/plans` (integrado en `/pbi`)
- ❌ `/tasking` (reemplazado por `/guidelines`)

### **Beneficios**

✅ Trazabilidad total (todo en una carpeta por story)
✅ Cero duplicación (no hay árboles separados)
✅ Context Engineering optimizado (IA lee un lugar)
✅ Workflow natural (incremental, no artificial)
✅ Flexible (archivos opcionales según complejidad)

### **Prompts Creados**

- Fase 1: Constitution (2 prompts)
- Fase 2: Specification (3 prompts: PRD, SRS, PBI)
- Fase 3: Refinement (2 prompts: Feature Test Plan, Test Cases)
- Fase 4: Planning (2 prompts: Feature Plan, Implementation Plan)

### **Guidelines Creados**

- implementation-workflow.md
- code-standards.md
- error-handling.md
- context-loading.md
- automation-workflow.md
- mcp-usage-tips.md

---

**🎯 Arquitectura lista para producción. Siguiente paso: Implementar en el DOJO.** 🚀
