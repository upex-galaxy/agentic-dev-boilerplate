# 🎯 AI-DRIVEN SOFTWARE PROJECT BLUEPRINT

**Versión**: 4.0 (13 Fases: 3 Sincrónicas + 10 Asincrónicas)
**Última actualización**: 2024-11-12
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
8. [Conceptos Clave v4.0](#conceptos-clave-v40)

---

## 🎯 FILOSOFÍA DEL SISTEMA

### **Principios Core**

- **AI-First**: Cada documento generado con Context Engineering
- **Shift-Left Native**: QA involucrado desde especificación
- **Shift-Right Enabled**: Monitoring y observabilidad en producción
- **MCP-Powered**: Integración automática con Jira, Supabase, GitHub
- **Progressive Refinement**: Cada fase alimenta la siguiente
- **Trazabilidad Total**: Todo relacionado en un solo lugar
- **Living Documentation**: Siempre fuentes reales (Supabase MCP), no docs estáticas
- **DRY Always**: Código reutilizable, NO hardcodear
- **Backend First**: Backend genera tipos → Frontend los consume
- **Manual Before Automated**: Testing exploratorio valida antes de automatizar

### **Arquitectura Unificada**

TODO se integra en `.context/PBI/` donde cada épica/story es una **carpeta** conteniendo:

- Documentación (Fase 4)
- Pruebas (Fase 5)
- Planes (Fase 6)

**Beneficio:** Para trabajar en una story, la IA lee UNA sola carpeta.

### **13 Fases: 3 Sincrónicas + 10 Asincrónicas**

**Fases Sincrónicas** (una sola vez, setup inicial):

1. **Constitution** - Idea de negocio → `.context/idea/`
2. **Architecture** - Product + Technical specs → `.context/PRD/` + `.context/SRS/`
3. **Infrastructure** ⭐ **NUEVA** - Setup técnico real (cloud + backend + frontend)

**Fases Asincrónicas** (iterativas, por sprint/épica): 4. **Specification** - Product backlog → `.context/PBI/` 5. **Shift-Left Testing** - Test plans + test cases 6. **Planning** - Implementation plans 7. **Implementation** - Código + unit tests (guiado por `.context/guidelines/`) 8. **Code Review** - Revisión de código 9. **Deployment Staging** ⭐ **NUEVA** - CI/CD + deploy a staging 10. **Exploratory Testing** ⭐ **NUEVA** - Testing manual rápido 11. **Test Automation** - Integration + E2E tests (KATA framework) 12. **Production Deployment** ⭐ **NUEVA** - Deploy a producción 13. **Shift-Right Testing** ⭐ **NUEVA** - Monitoring y observabilidad

---

## 🔍 DETECCIÓN DE TIPO DE PROYECTO

### **🌱 Greenfield (Desde cero)**

- Sin código base previo
- Workflow: Idea → PRD → SRS → Infrastructure → PBI → Implementation

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

| Fase                      | Greenfield                 | Legacy                                         |
| ------------------------- | -------------------------- | ---------------------------------------------- |
| **0. Análisis**           | ❌ No aplica               | ✅ Explorar codebase/DB → `legacy-analysis.md` |
| **1. Constitution**       | Desde idea                 | Desde código existente                         |
| **2. Architecture**       | PRD/SRS desde cero         | Reverse engineering                            |
| **3. Infrastructure**     | Setup completo desde cero  | Documentar infraestructura existente           |
| **4. Specification**      | PBI desde cero             | Mapear épicas existentes                       |
| **5. Shift-Left Testing** | Tests para nuevas features | Tests de caracterización primero               |
| **6. Planning**           | Diseño libre               | Adaptarse a arquitectura existente             |

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
├── infrastructure/                    [FASE 3: Infrastructure Setup]  ⬅️ NUEVA
│   ├── cloud-setup.md                 Supabase/Vercel/Railway projects creados
│   ├── backend-schema.md              DB schemas + API types generados
│   ├── frontend-project.md            Design System + tipos del backend importados
│   └── env-config.md                  Variables de entorno configuradas
│
├── PBI/                               [FASES 4-6: Product Backlog]  ⬅️ MAYÚSCULAS
│   ├── README.md
│   ├── epic-tree.md                   Vista high-level del árbol completo
│   │
│   └── epics/
│       │
│       └── EPIC-XXX-nombre/           📁 CARPETA POR ÉPICA
│           │
│           ├── epic.md                [FASE 4] Descripción, scope, acceptance criteria
│           │
│           ├── feature-test-plan.md   [FASE 5] Test strategy a nivel feature
│           │                          - Scope, risk analysis, test data requirements
│           │
│           ├── feature-implementation-plan.md  [FASE 6] Plan técnico a nivel feature
│           │                          - Technical decisions, dependencies, architecture
│           │
│           └── stories/
│               │
│               └── STORY-XXX-nombre/  📁 CARPETA POR STORY
│                   │
│                   ├── story.md       [FASE 4] User story + acceptance criteria (Gherkin)
│                   │
│                   ├── test-cases.md  [FASE 5] Test cases detallados (6+ test cases)
│                   │                  - Refined criteria, positive/negative/boundary tests
│                   │
│                   ├── implementation-plan.md  [FASE 6] Plan específico de esta story
│                   │                  - Steps, technical approach, estimated effort
│                   │
│                   └── [opcionales - IA decide según complejidad]
│                       ├── components.md      (componentes React complejos)
│                       ├── api-details.md     (lógica API compleja)
│                       └── database-changes.md (migrations complejas)
│
├── deployment/                        [FASES 9, 12: Deployment]  ⬅️ NUEVA
│   ├── staging/
│   │   ├── ci-cd-config.yaml          GitHub Actions workflows
│   │   ├── environment-vars.md        Variables por ambiente
│   │   └── deployment-log.md          Historial de deploys a staging
│   │
│   └── production/
│       ├── pre-deploy-checklist.md    Validaciones pre-deploy
│       ├── deployment-log.md          Historial de deploys a prod
│       └── rollback-procedures.md     Plan de contingencia
│
├── testing/                           [FASES 10, 13: Testing Post-Deploy]  ⬅️ NUEVA
│   ├── exploratory/
│   │   ├── smoke-tests.md             Tests de humo (5-10 min)
│   │   ├── test-charters/             Charters por story
│   │   ├── session-notes/             Notas de sesiones exploratorias
│   │   └── bug-reports/               Bugs encontrados
│   │
│   └── shift-right/
│       ├── monitoring-config.md       Sentry/DataDog setup
│       ├── smoke-tests-automated.md   Tests post-deploy automatizados
│       └── incident-reports/          Incidentes de producción
│
└── guidelines/                        [FASES 7-8-11: Reference Material]  ⬅️ minúsculas
    ├── README.md
    ├── implementation-workflow.md     Workflow paso a paso para implementar story
    ├── code-standards.md              DRY, naming, TypeScript, testing
    ├── error-handling.md              NO hardcodear, error classes, logging
    ├── context-loading.md             Qué archivos leer en cada fase
    ├── mcp-usage-tips.md              Cuándo usar Supabase/Atlassian/IDE MCP
    ├── deployment-workflow.md         ⭐ NUEVA - Flujo staging → production
    ├── testing-strategy.md            ⭐ NUEVA - Estrategia completa de testing
    ├── exploratory-testing.md         ⭐ NUEVA - Guía de exploratory testing
    ├── git-flow.md                    ⭐ NUEVA - Estrategia de Git Flow
    │
    └── tae/                           [FASE 11: Test Automation Engineering]
        ├── README.md
        ├── test-strategy.md           (generado con prompt)
        ├── kata-architecture.md       (reference doc - KATA framework completo)
        ├── kata-implementation-plan.md (generado con prompt)
        ├── component-catalog.md       (plantilla para llenar)
        ├── atc-registry.md            (plantilla para llenar)
        ├── automation-standards.md    (generado con prompt)
        ├── integration-test-plan.md   ⭐ NUEVA - Plan de tests API (KATA)
        ├── e2e-test-plan.md           ⭐ NUEVA - Plan de tests E2E (KATA)
        ├── test-data-management.md    (reference doc)
        ├── tms-integration.md         (reference doc)
        └── ci-cd-integration.md       (reference doc)
```

### **Convenciones de Nomenclatura**

- **Directorios principales en MAYÚSCULAS**: `PRD/`, `SRS/`, `PBI/` (siglas)
- **Directorios secundarios en minúsculas**: `idea/`, `infrastructure/`, `deployment/`, `testing/`, `guidelines/`, `epics/`, `stories/`, `tae/`
- **Archivos siempre en minúsculas con guiones**: `epic-tree.md`, `test-cases.md`

---

## 🔄 WORKFLOW POR FASE

### **🔹 FASES SINCRÓNICAS** (una sola vez, setup inicial)

---

### **FASE 1: Constitution**

**Rol:** Founder/Client/PO
**Output:** `.context/idea/` completo (2-3 archivos)
**Prompts:** Ver `.prompts/fase-1-constitution/`

**Workflow:**

1. Usar prompts para generar business-model.md y market-context.md
2. Si es legacy, generar también legacy-analysis.md

---

### **FASE 2: Architecture (PRD + SRS)**

**Rol:** Solution Architect/PM/BA
**Output:**

- `.context/PRD/` completo (4 archivos: executive-summary, user-personas, mvp-scope, user-journeys)
- `.context/SRS/` completo (4 archivos: functional-specs, non-functional-specs, architecture-specs, api-contracts)

**Prompts:** Ver `.prompts/fase-2-architecture/`

**Workflow:**

1. Generar PRD primero (business requirements)
2. Luego generar SRS (technical requirements)
3. Asegurar mapeo 1:1 entre User Stories (PRD) y Functional Requirements (SRS)

---

### **FASE 3: Infrastructure Setup** ⭐ **NUEVA**

**Rol:** DevOps/Backend Dev/Frontend Dev
**Output:** `.context/infrastructure/` completo (4 archivos)

**Prompts:** Ver `.prompts/fase-3-infrastructure/`

**⚠️ ORDEN CRÍTICO: Backend → Frontend**

**Workflow:**

1. **Cloud Services Setup** (15-30 min)
   - Crear proyecto en Supabase
   - Crear proyecto en Vercel/Railway
   - Configurar ambiente de desarrollo
   - Generar `.env.example`

2. **Backend Setup** (30-60 min)
   - Crear DB schemas en Supabase (via MCP o GUI)
   - Generar tipos TypeScript: `npx supabase gen types typescript`
   - Crear API boilerplate (Next.js API routes o Hono)
   - Seed de datos iniciales

3. **Frontend Setup** (60-90 min)
   - Implementar Design System completo
   - Crear proyecto frontend (Next.js/Vite)
   - **IMPORTAR tipos del backend** (zero type mismatches)
   - Configurar Tailwind + componentes base

**Por qué Backend primero:**

```
Backend define schemas → Genera tipos TypeScript automáticamente
↓
Frontend importa tipos reales (no mock)
↓
Zero type mismatches entre frontend y backend
```

**Ejemplo de integración de tipos:**

```typescript
// lib/database.types.ts (generado por Supabase)
export type Database = {
  public: {
    Tables: {
      users: {
        Row: { id: string; email: string; created_at: string };
        Insert: { email: string };
        Update: { email?: string };
      };
    };
  };
};

// lib/types.ts (helper creado manualmente)
import type { Database } from './database.types';

export type User = Database['public']['Tables']['users']['Row'];
export type UserInsert = Database['public']['Tables']['users']['Insert'];

// components/UserProfile.tsx (frontend consume tipos reales)
import type { User } from '@/lib/types';

interface UserProfileProps {
  user: User; // ✅ Tipo real del backend
}
```

---

### **🔹 FASES ASINCRÓNICAS** (iterativas, por sprint/épica)

---

### **FASE 4: Specification (PBI)**

**Rol:** PO/PM
**Output:**

- `.context/PBI/epic-tree.md`
- `.context/PBI/epics/EPIC-XXX/epic.md`
- `.context/PBI/epics/EPIC-XXX/stories/STORY-XXX/story.md`

**Prompts:** Ver `.prompts/fase-4-specification/`

**Workflow:**

1. Generar epic-tree.md (árbol completo de épicas)
2. Por cada épica: crear carpeta + epic.md
3. Por cada story: crear carpeta + story.md con Gherkin

---

### **FASE 5: Shift-Left Testing**

**Rol:** QA Engineer

**Por cada épica:**

1. Leer `epic.md`
2. Crear `feature-test-plan.md` (test strategy, risk analysis)

**Por cada story:**

1. Leer `story.md` + PRD + SRS relacionado
2. Refinar acceptance criteria
3. Identificar edge cases
4. Crear `test-cases.md` (6+ test cases)
5. Sincronizar con Jira/Xray

**Prompts:** Ver `.prompts/fase-5-shift-left-testing/`

---

### **FASE 6: Planning**

**Rol:** Tech Lead/Dev

**Por cada épica (una vez):**

1. Leer `epic.md` + SRS
2. Tomar decisiones técnicas a nivel feature
3. Crear `feature-implementation-plan.md`

**Por cada story (antes de codear):**

1. Leer `story.md` + `test-cases.md` + `feature-implementation-plan.md`
2. Crear `implementation-plan.md` detallado
3. IA decide si necesita archivos auxiliares (components.md, api-details.md, etc.)

**Prompts:** Ver `.prompts/fase-6-planning/`

---

### **FASE 7: Implementation**

**Rol:** Dev (con IA)

**Workflow:**

1. Cargar contexto completo (leer `implementation-plan.md`)
2. Leer `.context/guidelines/*.md` (TODOS los archivos)
3. Ejecutar subtareas según plan
4. **Crear unit tests** durante implementación (NO en Fase 11)
5. Quality checks después de cada step
6. Usar MCP tools (Supabase, Atlassian)

**Unit Tests en Implementation:**

- Funciones con lógica de negocio compleja
- Utilidades y helpers reutilizables
- Validaciones y transformaciones de datos
- **NO** componentes React simples (eso es E2E)
- **NO** código que solo llama APIs (eso es integration test)

**Guidelines:** Ver `.context/guidelines/`
**Prompts:** Ver `.prompts/fase-7-implementation/unit-testing.md`

---

### **FASE 8: Code Review**

**Rol:** Tech Lead/Senior Dev

**Workflow:**

1. Revisar Pull Request
2. Verificar adherencia a `.context/guidelines/code-standards.md`
3. Verificar tests (unit tests deben existir)
4. Aprobar o solicitar cambios

**Guidelines:** Ver `.context/guidelines/code-standards.md`
**Prompts:** Ver `.prompts/fase-8-code-review/`

---

### **FASE 9: Deployment Staging** ⭐ **NUEVA**

**Rol:** DevOps/Tech Lead

**Workflow:**

1. **Setup CI/CD** (primera vez)
   - Crear GitHub Actions workflow
   - Configurar secrets (SUPABASE_URL, VERCEL_TOKEN, etc.)
   - Definir triggers (push a develop, PR a develop)

2. **Deploy to Staging** (cada story)
   - Merge PR a branch `develop`
   - CI/CD ejecuta automáticamente
   - Deploy a Vercel preview o staging environment

3. **Verificación Post-Deploy**
   - Check de health endpoint
   - Verificar logs (Vercel, Railway)
   - Notificar a QA para exploratory testing

**Output:** `.context/deployment/staging/` con configuración y logs

**Prompts:** Ver `.prompts/fase-9-deployment-staging/`

---

### **FASE 10: Exploratory Testing** ⭐ **NUEVA**

**Rol:** QA Engineer (manual)

**⚠️ IMPORTANTE: Esta fase viene ANTES de Test Automation**

**Por qué Exploratory antes de Automation:**

| Aspecto           | Exploratory (Fase 10)                      | Automation (Fase 11)           |
| ----------------- | ------------------------------------------ | ------------------------------ |
| **Tiempo**        | 5-30 minutos por story                     | Horas/días por story           |
| **Qué encuentra** | Bugs de UX, edge cases, problemas visuales | Solo bugs de lógica/regresión  |
| **Inversión**     | Baja (tiempo humano)                       | Alta (código, mantenimiento)   |
| **Cuándo**        | Inmediatamente después de deploy           | Después de validar manualmente |

**Principio:** No pierdas tiempo automatizando funcionalidad rota.

**Workflow:**

1. **Smoke Test** (5-10 min)
   - ¿La app carga?
   - ¿Login funciona?
   - ¿Features básicas responden?

2. **Test Charter** (15 min)
   - Leer story.md
   - Definir áreas a explorar
   - Identificar riesgos

3. **Exploratory Session** (60-90 min)
   - Explorar funcionalidad
   - Probar edge cases
   - Documentar bugs encontrados

4. **Bug Report**
   - Crear issues en Jira para bugs críticos
   - Documentar en `.context/testing/exploratory/bug-reports/`

**Output:**

- Smoke test completado
- Session notes documentadas
- Bug reports creados (si aplica)
- **Luz verde para automatizar (Fase 11)** o **bloqueo para fix (volver a Fase 7)**

**Prompts:** Ver `.prompts/fase-10-exploratory-testing/`

---

### **FASE 11: Test Automation Engineering** (KATA Framework)

**Rol:** QA Automation Engineer / SDET (con IA)

**⚠️ IMPORTANTE: Esta fase viene DESPUÉS de Exploratory Testing (Fase 10)**

**Solo automatizas funcionalidad ya validada manualmente.**

**Objetivo:** Establecer arquitectura de testing automatizada basada en KATA framework

**KATA = Keyword-Action-Test Architecture**

```
tests/
├── integration/               (API tests)
│   └── api/
│       └── users/
│           ├── components/    ← Wrappers de API
│           ├── actions/       ← Lógica de negocio reutilizable
│           └── tests/         ← Tests concretos
│
└── e2e/                      (End-to-End tests con Playwright)
    └── user-management/
        ├── components/        ← Page Objects
        ├── actions/           ← User Flows reutilizables
        └── tests/             ← Tests concretos
```

**Workflow:**

**Primera vez (setup):**

1. Generar Test Strategy (leer PRD + SRS + PBI completo)
2. Diseñar Arquitectura KATA (adaptar KATA al proyecto)
3. Definir Estándares (naming, estructura, best practices)
4. Crear estructura `/tests` con TestContext

**Por cada story (iterativo):**

1. Leer exploratory session notes (bugs ya encontrados)
2. Crear Integration Test Plan (API tests)
3. Crear E2E Test Plan (user flows críticos)
4. Implementar tests siguiendo KATA:
   - Components (Page Objects, API Wrappers)
   - Actions (User Flows, Business Logic)
   - Tests (Concrete test cases)

**Output:** Directorio `.context/guidelines/tae/` completo + estructura de `/tests`

**Diferencias Legacy vs Greenfield:**

- **Greenfield**: Diseñar suite completa desde cero
- **Legacy**: Evaluar suite existente → Migrar a KATA o crear desde cero con tests de caracterización primero

**Prompts:** Ver `.prompts/fase-11-test-automation/` (8 prompts: 3 KATA maestros + 5 planes específicos)

---

### **FASE 12: Production Deployment** ⭐ **NUEVA**

**Rol:** DevOps/Tech Lead

**⚠️ IMPORTANTE: Ejecutar checklist ANTES de deploy**

**Workflow:**

1. **Pre-Deploy Checklist** (15-30 min)
   - ✅ Exploratory testing completado (Fase 10)
   - ✅ Automation tests passing (Fase 11)
   - ✅ Code review aprobado (Fase 8)
   - ✅ Staging funcionando sin errores críticos
   - ✅ Database migrations testeadas en staging
   - ✅ Environment variables configuradas en producción
   - ✅ Rollback plan documentado

2. **Deploy to Production**
   - Merge branch `develop` → `main`
   - CI/CD ejecuta deploy a producción (Vercel Production)
   - Ejecutar smoke tests automatizados post-deploy

3. **Post-Deploy Verification**
   - Verificar health checks
   - Monitorear logs en tiempo real (15-30 min)
   - Verificar métricas clave (response time, error rate)

4. **Rollback (si es necesario)**
   - Revertir deploy en Vercel (rollback a versión anterior)
   - Revertir database migrations si aplica
   - Notificar a equipo

**Output:** `.context/deployment/production/` con logs y checklist

**Prompts:** Ver `.prompts/fase-12-production-deployment/`

---

### **FASE 13: Shift-Right Testing** ⭐ **NUEVA**

**Rol:** DevOps/SRE/QA (Monitoring)

**⚠️ Esta fase es continua (siempre activa en producción)**

**Objetivo:** Monitorear producción y detectar issues en tiempo real

**Workflow:**

1. **Monitoring Setup** (una vez)
   - Configurar Sentry (error tracking)
   - Configurar Vercel Analytics (performance)
   - Configurar logs centralizados (Logtail, DataDog)
   - Definir alertas (error rate > 5%, response time > 2s)

2. **Automated Smoke Tests** (post-deploy)
   - Tests automatizados que corren cada X minutos en producción
   - Verifican funcionalidad crítica (login, homepage, API health)
   - Alertan si algo falla

3. **Incident Response** (cuando ocurre un issue)
   - Recibir alerta (Sentry, PagerDuty)
   - Investigar logs y traces
   - Ejecutar rollback si es crítico (Fase 12)
   - Crear incident report
   - Post-mortem y lessons learned

**Output:**

- `.context/testing/shift-right/monitoring-config.md`
- `.context/testing/shift-right/incident-reports/`

**Prompts:** Ver `.prompts/fase-13-shift-right-testing/`

---

## 📋 ESTRUCTURA DETALLADA POR FASE

### **FASE 1: CONSTITUTION**

#### **Carpeta `.context/idea/`**

| Archivo              | Contenido                                                              | Longitud    |
| -------------------- | ---------------------------------------------------------------------- | ----------- |
| `README.md`          | "Fase 1: Constitución del proyecto"                                    | 1 párrafo   |
| `business-model.md`  | Business Model Canvas (9 bloques) + Problem Statement + MVP Hypothesis | 2-3 páginas |
| `market-context.md`  | Competitive Landscape + Market Opportunity + Trends                    | 2 páginas   |
| `legacy-analysis.md` | Tech stack + Features existentes + Gaps de docs (solo legacy)          | 2-3 páginas |

**Prompts:** `.prompts/fase-1-constitution/`

---

### **FASE 2: ARCHITECTURE**

#### **Carpeta `.context/PRD/`**

| Archivo                | Contenido                                                                                               |
| ---------------------- | ------------------------------------------------------------------------------------------------------- |
| `executive-summary.md` | Problem Statement + Solution Overview + Success Metrics (3-5 KPIs) + Target Users (2-3 personas breves) |
| `user-personas.md`     | 2-3 personas con: Demographics, Goals, Pain Points, Tech Savviness, Quote                               |
| `mvp-scope.md`         | In Scope (5-7 épicas con 3-5 user stories cada una) + Out of Scope + Success Criteria                   |
| `user-journeys.md`     | 2-3 journeys (Happy Path + Edge Cases) con Steps, User Actions, System Responses, Pain Points           |

#### **Carpeta `.context/SRS/`**

| Archivo                   | Contenido                                                                                                                   |
| ------------------------- | --------------------------------------------------------------------------------------------------------------------------- |
| `functional-specs.md`     | FRs mapeados 1:1 con User Stories. FR-001, FR-002... (Input, Processing, Output, Validations)                               |
| `non-functional-specs.md` | Performance, Security, Scalability, Accessibility, Browser Support                                                          |
| `architecture-specs.md`   | System Architecture (C4 Mermaid), Database Design (ERD Mermaid), Tech Stack Justification, Data Flow, Security Architecture |
| `api-contracts.yaml`      | OpenAPI 3.0 spec con endpoints, request/response schemas, status codes                                                      |

**⚠️ IMPORTANTE:** NO generar SQL schemas estáticos. Usar Supabase MCP para obtener schema real.

**Prompts:** `.prompts/fase-2-architecture/`

---

### **FASE 3: INFRASTRUCTURE SETUP** ⭐ **NUEVA**

#### **Carpeta `.context/infrastructure/`**

| Archivo               | Contenido                                                                              |
| --------------------- | -------------------------------------------------------------------------------------- |
| `cloud-setup.md`      | Projects creados en Supabase, Vercel, Railway. URLs, API keys, environment setup       |
| `backend-schema.md`   | DB schemas creados, tipos TypeScript generados, API boilerplate, seed data             |
| `frontend-project.md` | Design System implementado, proyecto frontend scaffolded, tipos del backend importados |
| `env-config.md`       | Todas las environment variables con valores de ejemplo (sin secrets reales)            |

**Orden de ejecución:**

1. Cloud Services Setup → `cloud-setup.md`
2. Backend Setup → `backend-schema.md`
3. Frontend Setup → `frontend-project.md`
4. Environment Config → `env-config.md`

**Prompts:** `.prompts/fase-3-infrastructure/`

---

### **FASE 4: SPECIFICATION**

#### **Carpeta `.context/PBI/`**

##### **Nivel ÉPICA (Carpeta)**

Archivo `epic.md`:

- **Metadata**: id, jira_id, priority, business_value, estimated_story_points
- **Description**
- **Scope** (In/Out)
- **Acceptance Criteria** (Epic-level)
- **Dependencies** (épicas dependientes, recursos externos)
- **User Stories** (lista con links relativos)

Archivos generados en fases posteriores:

- `feature-test-plan.md` (Fase 5)
- `feature-implementation-plan.md` (Fase 6)

##### **Nivel STORY (Carpeta)**

Archivo `story.md`:

- **Metadata**: id, jira_id, epic_id, title, priority, story_points, assignee, status
- **Description**
- **Acceptance Criteria** (Gherkin: Given/When/Then)
- **Technical Notes** (iniciales)
- **Definition of Done** (checklist)

Archivos generados en fases posteriores:

- `test-cases.md` (Fase 5)
- `implementation-plan.md` (Fase 6)
- Opcionales: `components.md`, `api-details.md`, `database-changes.md` (IA decide)

**Prompts:** `.prompts/fase-4-specification/`

---

### **FASE 5: SHIFT-LEFT TESTING**

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

**Prompts:** `.prompts/fase-5-shift-left-testing/`

---

### **FASE 6: PLANNING**

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

**Prompts:** `.prompts/fase-6-planning/`

---

### **FASE 7: IMPLEMENTATION**

**Guidelines (Reference Material):**

- `.context/guidelines/implementation-workflow.md` - Workflow paso a paso
- `.context/guidelines/code-standards.md` - Estándares de código
- `.context/guidelines/error-handling.md` - Manejo de errores
- `.context/guidelines/context-loading.md` - Qué archivos leer
- `.context/guidelines/mcp-usage-tips.md` - Cuándo usar MCPs

**Unit Testing:**

- Crear unit tests DURANTE implementation (Fase 7)
- **NO** esperar hasta Fase 11 (que es para integration + e2e)
- Ver prompt: `.prompts/fase-7-implementation/unit-testing.md`

**Cuándo crear unit tests:**

- ✅ Funciones con lógica de negocio compleja
- ✅ Utilidades y helpers reutilizables
- ✅ Validaciones y transformaciones de datos
- ❌ Componentes React simples (solo UI)
- ❌ Código que solo llama APIs (eso es integration test)

---

### **FASE 8: CODE REVIEW**

**Guidelines:**

- `.context/guidelines/code-standards.md` - Checklist de revisión

**Verificar:**

- ✅ Código sigue estándares DRY
- ✅ TypeScript strict mode sin errores
- ✅ Unit tests existen y pasan
- ✅ No hay hardcoded values
- ✅ Error handling implementado correctamente

**Prompts:** `.prompts/fase-8-code-review/`

---

### **FASE 9: DEPLOYMENT STAGING** ⭐ **NUEVA**

**Output:**

- `.context/deployment/staging/ci-cd-config.yaml` - GitHub Actions workflow
- `.context/deployment/staging/environment-vars.md` - Variables por ambiente
- `.context/deployment/staging/deployment-log.md` - Historial de deploys

**Workflow típico:**

1. Crear GitHub Actions workflow (.github/workflows/deploy-staging.yml)
2. Configurar secrets en GitHub (SUPABASE_URL, VERCEL_TOKEN, etc.)
3. Merge PR a `develop` → CI/CD ejecuta automáticamente
4. Vercel despliega a preview environment
5. Notificar a QA para exploratory testing (Fase 10)

**Prompts:** `.prompts/fase-9-deployment-staging/`

---

### **FASE 10: EXPLORATORY TESTING** ⭐ **NUEVA**

**Output:**

- `.context/testing/exploratory/smoke-tests.md` - Smoke test completado
- `.context/testing/exploratory/test-charters/STORY-XXX.md` - Charter de sesión
- `.context/testing/exploratory/session-notes/STORY-XXX-session-YYYY-MM-DD.md` - Notas de sesión
- `.context/testing/exploratory/bug-reports/BUG-XXX.md` - Bugs encontrados

**Técnicas de exploración:**

- **Tours**: Recorrer la aplicación como usuario
- **Pairing**: Explorar en dupla (dev + QA)
- **Personas**: Usar diferentes user personas del PRD
- **Edge Cases**: Inputs inválidos, límites, casos raros

**Criterios de salida:**

- ✅ Smoke test pasó (funcionalidad básica funciona)
- ✅ Session documentada con findings
- ✅ Bugs críticos reportados y priorizados
- ✅ **Luz verde para automatizar** (Fase 11) o **bloqueo para fix**

**Prompts:** `.prompts/fase-10-exploratory-testing/`

---

### **FASE 11: TEST AUTOMATION ENGINEERING** (KATA)

**Output:**

- `.context/guidelines/tae/test-strategy.md` - Estrategia general
- `.context/guidelines/tae/kata-implementation-plan.md` - Plan maestro KATA
- `.context/guidelines/tae/automation-standards.md` - Estándares de código
- `.context/guidelines/tae/integration-test-plan.md` - Plan de tests API
- `.context/guidelines/tae/e2e-test-plan.md` - Plan de tests E2E
- Estructura `/tests` con componentes KATA implementados

**Arquitectura KATA:**

```
tests/
├── integration/
│   └── api/
│       └── users/
│           ├── components/
│           │   └── UserApiClient.ts      ← Wrapper de API
│           ├── actions/
│           │   └── UserActions.ts        ← Lógica reutilizable
│           └── tests/
│               └── user-crud.test.ts     ← Test concreto
│
└── e2e/
    └── user-management/
        ├── components/
        │   └── LoginPage.ts              ← Page Object
        ├── actions/
        │   └── AuthActions.ts            ← User Flow
        └── tests/
            └── login-flow.test.ts        ← Test concreto
```

**Beneficios KATA:**

- ✅ Componentes reutilizables (DRY)
- ✅ Actions encapsulan lógica de negocio
- ✅ Tests son declarativos y legibles
- ✅ Fácil mantenimiento

**Prompts:** `.prompts/fase-11-test-automation/` (8 archivos)

---

### **FASE 12: PRODUCTION DEPLOYMENT** ⭐ **NUEVA**

**Output:**

- `.context/deployment/production/pre-deploy-checklist.md` - Checklist completado
- `.context/deployment/production/deployment-log.md` - Log del deploy
- `.context/deployment/production/rollback-procedures.md` - Plan de rollback

**Pre-Deploy Checklist:**

- ✅ Todas las fases anteriores completadas
- ✅ Exploratory testing aprobado
- ✅ Automation tests passing
- ✅ Code review aprobado
- ✅ Staging sin errores críticos por 24-48h
- ✅ Database migrations testeadas
- ✅ Environment variables configuradas
- ✅ Rollback plan documentado
- ✅ Equipo notificado del deploy

**Deploy Strategy:**

- **Opción 1**: Blue-Green deployment (Vercel lo hace automático)
- **Opción 2**: Canary deployment (desplegar a 10% de tráfico primero)
- **Opción 3**: Feature flags (deploy código apagado, activar gradualmente)

**Prompts:** `.prompts/fase-12-production-deployment/`

---

### **FASE 13: SHIFT-RIGHT TESTING** ⭐ **NUEVA**

**Output:**

- `.context/testing/shift-right/monitoring-config.md` - Sentry/DataDog setup
- `.context/testing/shift-right/smoke-tests-automated.md` - Tests post-deploy
- `.context/testing/shift-right/incident-reports/INCIDENT-XXX.md` - Incident reports

**Monitoring Stack:**

- **Error Tracking**: Sentry (errores de JavaScript, API errors)
- **Performance**: Vercel Analytics (Core Web Vitals, TTFB, FCP)
- **Logs**: Logtail o DataDog (logs centralizados)
- **Uptime**: UptimeRobot (health checks cada 5 min)

**Alertas configuradas:**

- 🚨 Error rate > 5% en 5 minutos
- 🚨 Response time > 2 segundos (p95)
- 🚨 Health endpoint down por 2 minutos
- 🚨 Critical user flow failing (login, signup)

**Incident Response:**

1. **Detect**: Alerta automática (Sentry, PagerDuty)
2. **Assess**: Revisar logs, traces, error messages
3. **Mitigate**: Rollback si es crítico (< 5 min)
4. **Fix**: Hotfix o planear fix en siguiente sprint
5. **Post-Mortem**: Documentar qué pasó, por qué, cómo prevenir

**Prompts:** `.prompts/fase-13-shift-right-testing/`

---

## 📝 PROMPTS Y GUIDELINES

### **Prompts (Generación de Documentos)**

Todos los prompts están en `.prompts/` organizados por fase:

- **Fase 1:** `fase-1-constitution/` (2 prompts)
- **Fase 2:** `fase-2-architecture/` (8 prompts: PRD + SRS)
- **Fase 3:** `fase-3-infrastructure/` ⭐ **NUEVA** (4 prompts: cloud + backend + frontend + env)
- **Fase 4:** `fase-4-specification/` (1 prompt: PBI)
- **Fase 5:** `fase-5-shift-left-testing/` (2 prompts)
- **Fase 6:** `fase-6-planning/` (2 prompts)
- **Fase 7:** `fase-7-implementation/` (1 prompt: unit-testing.md)
- **Fase 8:** `fase-8-code-review/` (prompts para revisión)
- **Fase 9:** `fase-9-deployment-staging/` ⭐ **NUEVA** (4 prompts: CI/CD + deploy)
- **Fase 10:** `fase-10-exploratory-testing/` ⭐ **NUEVA** (5 prompts: smoke + charter + session + bugs)
- **Fase 11:** `fase-11-test-automation/` (8 prompts: 3 KATA maestros + 5 planes específicos)
- **Fase 12:** `fase-12-production-deployment/` ⭐ **NUEVA** (4 prompts: checklist + deploy + rollback)
- **Fase 13:** `fase-13-shift-right-testing/` ⭐ **NUEVA** (4 prompts: monitoring + smoke + incident)

**Instrucciones de uso:** Ver `.prompts/README.md`

**Características:**

- **Copy-paste ready**: Abrir archivo → Ctrl+A → Ctrl+C → usar
- **Sin código**: Solo texto descriptivo (no ejemplos de código hardcodeados)
- **Detallados**: Máximo nivel de detalle para resultados determinísticos
- **Contexto acumulativo**: Cada prompt pide como input el output de prompts anteriores

---

### **Guidelines (Reference Material para IA)**

Todos los guidelines están en `.context/guidelines/` para fases 7-8-11:

| Archivo                               | Propósito                                                       | Fase    |
| ------------------------------------- | --------------------------------------------------------------- | ------- |
| `implementation-workflow.md`          | Workflow paso a paso para implementar story                     | 7       |
| `code-standards.md`                   | DRY, naming conventions, TypeScript strict, component structure | 7-8     |
| `error-handling.md`                   | NO hardcodear fallbacks, custom error classes, retry logic      | 7       |
| `context-loading.md`                  | Qué archivos leer en cada fase, Living Documentation (MCPs)     | 7       |
| `mcp-usage-tips.md`                   | Cuándo usar Supabase MCP, Atlassian MCP, IDE Diagnostics        | 7       |
| `deployment-workflow.md` ⭐ **NUEVA** | Flujo staging → production, Git Flow strategy                   | 9-12    |
| `testing-strategy.md` ⭐ **NUEVA**    | Testing pyramid: unit → integration → e2e                       | 7-10-11 |
| `exploratory-testing.md` ⭐ **NUEVA** | Técnicas de exploratory testing                                 | 10      |
| `git-flow.md` ⭐ **NUEVA**            | Branching strategy: feature → develop → main                    | 7-9-12  |
| `tae/*`                               | Test Automation Engineering (13 archivos KATA)                  | 11      |

**Cuándo leer:** La IA debe leer TODOS los guidelines relevantes antes de ejecutar cada fase.

---

## 🔗 SINCRONIZACIÓN CON JIRA

### **Flujo Recomendado (Jira-First)**

**Opción 1: Jira-First (Recomendado para equipos con Jira)**

1. **Crear en Jira primero**
   - Crear épicas en Jira
   - Crear stories en Jira
   - Obtener IDs reales (UPEX-123, UPEX-124, etc.)

2. **Generar archivos locales con IDs reales**
   - Usar prompt de Fase 4 con IDs de Jira
   - Crear `/PBI/epics/UPEX-123-nombre/`
   - Crear `/PBI/epics/UPEX-123/stories/UPEX-124-nombre/`

3. **Sincronizar cambios**
   - Actualizar Jira cuando cambie status local
   - Usar Atlassian MCP para queries automáticas

**Opción 2: Local-First (Proyectos sin Jira)**

1. **Crear localmente en `/PBI`**
   - Generar epic-tree.md
   - Generar /epics/EPIC-XXX/epic.md
   - Generar /epics/EPIC-XXX/stories/STORY-XXX/story.md

2. **Sincronizar con Jira después (opcional)**
   - Crear épicas en Jira
   - Crear stories en Jira
   - Actualizar `jira_id` en epic.md y story.md

### **Sincronización de Test Cases (Xray)**

- Crear test cases en Xray después de generar `test-cases.md`
- Mapear TC-001, TC-002... con IDs de Xray
- Sincronización automática de resultados (ver TAE/tms-integration.md)

---

## 🎯 CONCEPTOS CLAVE v4.0

### **1. Architecture (Fase 2) vs Infrastructure (Fase 3)**

**Architecture (Fase 2)** = Decisiones de diseño (documentos)

- Qué stack usar (Next.js, Supabase, Vercel)
- Diagramas (C4, ERD, Data Flow)
- API contracts (OpenAPI spec)
- **Output**: Documentos en `.context/PRD/` y `.context/SRS/`

**Infrastructure (Fase 3)** = Implementación real (setup)

- Crear proyectos en Supabase, Vercel, Railway
- Crear DB schemas reales
- Implementar Design System
- Generar tipos TypeScript
- **Output**: Infraestructura funcionando + documentación en `.context/infrastructure/`

**Por qué separarlos:**

- Architecture es planning (specs)
- Infrastructure es execution (setup técnico)
- Separación clara entre "qué" (Fase 2) y "cómo" (Fase 3)

---

### **2. Backend Before Frontend**

**Flujo:**

```
1. Backend define schemas (Fase 3.2)
   ↓
2. Generar tipos TypeScript automáticamente
   npx supabase gen types typescript --local > lib/database.types.ts
   ↓
3. Frontend importa tipos (Fase 3.3)
   import type { Database } from './database.types'
   ↓
4. Zero type mismatches
```

**Beneficios:**

- ✅ Un solo source of truth (backend schemas)
- ✅ Frontend no puede usar tipos incorrectos
- ✅ Refactorings más seguros
- ✅ TypeScript compiler detecta breaking changes

**Antes (sin esto):**

- ❌ Frontend define tipos manualmente
- ❌ Backend cambia schema → frontend rompe
- ❌ Errores en runtime

---

### **3. Testing: Manual Before Automated**

**Fase 10 (Exploratory) → Fase 11 (Automation)**

**Por qué Exploratory primero:**

| Aspecto           | Exploratory         | Automation                     |
| ----------------- | ------------------- | ------------------------------ |
| **Tiempo**        | 5-30 min            | Horas/días                     |
| **Inversión**     | Baja                | Alta                           |
| **Qué encuentra** | UX bugs, edge cases | Solo lógica/regresión          |
| **Cuándo**        | Después de deploy   | Después de validar manualmente |

**Principio:**

> No pierdas tiempo automatizando funcionalidad rota.

**Flujo:**

1. Deploy a staging (Fase 9)
2. Explorar manualmente (Fase 10) - 30 min
3. ¿Encontraste bugs críticos? → Fix (volver a Fase 7)
4. ¿Todo OK? → Automatizar (Fase 11) - horas

**Resultado:**

- Automation tests solo para funcionalidad validada
- Menos tests que mantener
- Más confianza en la suite

---

### **4. Unit Tests en Implementation (Fase 7), NO en Automation (Fase 11)**

**Fase 7 (Implementation):**

- ✅ Unit tests para lógica de negocio
- ✅ Tests para utilidades y helpers
- ✅ Tests rápidos (< 1 segundo cada uno)

**Fase 11 (Test Automation):**

- ✅ Integration tests (API)
- ✅ E2E tests (Playwright)
- ❌ NO unit tests (ya se hicieron en Fase 7)

**Por qué:**

- Unit tests son parte del desarrollo (TDD/ATDD)
- Automation es para regresión (integration + e2e)
- Separar concerns: Fase 7 = feature completa con unit tests, Fase 11 = suite de regresión

**Testing Pyramid:**

```
        /\
       /E2E\       ← Fase 11 (pocos, lentos, críticos)
      /------\
     /Integration\ ← Fase 11 (medianos, APIs)
    /------------\
   /  Unit Tests  \ ← Fase 7 (muchos, rápidos, lógica)
  /----------------\
```

---

### **5. KATA Architecture (Fase 11)**

**KATA = Keyword-Action-Test**

**Estructura:**

- **Components**: Wrappers (Page Objects, API Clients)
- **Actions**: Lógica reutilizable (User Flows, Business Logic)
- **Tests**: Tests concretos (declarativos)

**Ejemplo (E2E):**

```typescript
// components/LoginPage.ts (Page Object)
export class LoginPage {
  async navigate() { ... }
  async fillEmail(email: string) { ... }
  async fillPassword(pwd: string) { ... }
  async clickSubmit() { ... }
}

// actions/AuthActions.ts (User Flow)
export class AuthActions {
  async login(email: string, password: string) {
    await this.loginPage.navigate()
    await this.loginPage.fillEmail(email)
    await this.loginPage.fillPassword(password)
    await this.loginPage.clickSubmit()
  }
}

// tests/login-flow.test.ts (Test concreto)
test('should login successfully', async () => {
  await authActions.login('user@test.com', 'password123')
  await expect(page).toHaveURL('/dashboard')
})
```

**Beneficios:**

- ✅ DRY (lógica reutilizable)
- ✅ Declarativo (tests legibles)
- ✅ Mantenible (cambios en un solo lugar)
- ✅ Escalable (agregar tests es fácil)

---

### **6. Shift-Left (Fase 5) + Shift-Right (Fase 13)**

**Shift-Left** = Testing temprano (pre-development)

- Fase 5: Crear test plans y test cases ANTES de codear
- Beneficio: Detectar problemas en specs (no en código)

**Shift-Right** = Testing en producción (post-deployment)

- Fase 13: Monitoring, alertas, smoke tests automatizados
- Beneficio: Detectar problemas reales de usuarios

**Juntos:**

```
Shift-Left (Fase 5) → Implementation (Fase 7) → Shift-Right (Fase 13)
       ↓                       ↓                         ↓
  Test Plans            Código + Unit Tests       Monitoring en Prod
```

---

## ✅ RESUMEN EJECUTIVO

### **Estructura Final**

```
.context/
├── idea/                (2-3 archivos) - Fase 1: Constitution
├── PRD/                 (4 archivos) - Fase 2: Architecture (business)
├── SRS/                 (4 archivos) - Fase 2: Architecture (technical)
├── infrastructure/      ⭐ NUEVA (4 archivos) - Fase 3: Infrastructure Setup
├── PBI/                 (estructura de carpetas) - Fases 4-6: Specification, Testing, Planning
├── deployment/          ⭐ NUEVA (logs y configs) - Fases 9, 12: Deployments
├── testing/             ⭐ NUEVA (exploratory + shift-right) - Fases 10, 13
└── guidelines/          (10 archivos) - Fases 7-8-11: Reference material
    └── tae/             (13 archivos) - Fase 11: Test Automation (KATA)
```

### **Beneficios de la Arquitectura Unificada**

✅ **Trazabilidad total**: Todo en una carpeta por story
✅ **Cero duplicación**: No hay árboles separados
✅ **Context Engineering optimizado**: IA lee un lugar
✅ **Workflow natural**: Incremental, no artificial
✅ **Flexible**: Archivos opcionales según complejidad
✅ **Backend-First**: Tipos compartidos, zero mismatches
✅ **Testing completo**: Shift-Left (pre) + Exploratory (post-deploy) + Automation + Shift-Right (prod)

### **Eliminado (vs versiones anteriores)**

❌ `/refinement` (integrado en `/PBI`)
❌ `/plans` (integrado en `/PBI`)
❌ `/tasking` (reemplazado por `/guidelines`)
❌ `fase-2.5-design` (movido a Fase 3: Infrastructure)

### **Agregado en v4.0**

✅ **Fase 3: Infrastructure** - Setup técnico real
✅ **Fase 9: Deployment Staging** - CI/CD + staging
✅ **Fase 10: Exploratory Testing** - Testing manual pre-automation
✅ **Fase 12: Production Deployment** - Deploy a producción
✅ **Fase 13: Shift-Right Testing** - Monitoring y observabilidad
✅ **Unit tests en Fase 7** - Durante implementation, no en automation
✅ **4 Guidelines nuevas** - deployment, testing-strategy, exploratory, git-flow
✅ **KATA expandido** - Integration + E2E test plans

### **Fases Totales del Blueprint v4.0**

**Fases Sincrónicas** (una sola vez, setup inicial):

1. **Constitution** - Idea de negocio
2. **Architecture** - PRD + SRS (product + technical specs)
3. **Infrastructure** ⭐ - Cloud + Backend + Frontend setup

**Fases Asincrónicas** (iterativas, por sprint/story): 4. **Specification** - PBI (épicas + stories) 5. **Shift-Left Testing** - Feature test plans + test cases 6. **Planning** - Feature plans + implementation plans 7. **Implementation** - Desarrollo + unit tests 8. **Code Review** - Revisión de código 9. **Deployment Staging** ⭐ - CI/CD + deploy a staging 10. **Exploratory Testing** ⭐ - Testing manual rápido 11. **Test Automation** - Integration + E2E tests (KATA) 12. **Production Deployment** ⭐ - Deploy a producción 13. **Shift-Right Testing** ⭐ - Monitoring + observabilidad

---

**🎯 Blueprint v4.0 - Arquitectura completa para proyectos AI-First desde idea hasta producción.** 🚀

**Próximo paso:** Revisar `CHANGELOG.md` y `PENDING-PROMPTS.md` para detalles de migración.
