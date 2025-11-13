# 🗺️ BIG PICTURE - Arquitectura Completa del Repositorio

## 📂 Estructura Visual Completa

```
aicode-starter/
│
├── 📁 .context/                           Para: Documentación de ingeniería de contexto (IA lee esto)
│   │
│   ├── 📄 README.md                       Para: Índice maestro del proyecto, punto de entrada
│   │
│   ├── 📁 idea/                           Para: FASE 1 - Constitución del negocio
│   │   ├── README.md                      Para: Explicar Fase 1
│   │   ├── business-model.md              Para: Business Model Canvas (9 bloques)
│   │   ├── market-context.md              Para: Análisis de mercado y competencia
│   │   └── legacy-analysis.md             Para: Análisis de código existente (solo proyectos legacy)
│   │
│   ├── 📁 PRD/                            Para: FASE 2 - Product Requirements (visión de negocio)
│   │   ├── README.md                      Para: Explicar qué es PRD
│   │   ├── executive-summary.md           Para: Problem statement + KPIs + target users
│   │   ├── user-personas.md               Para: 2-3 perfiles de usuarios detallados
│   │   ├── mvp-scope.md                   Para: Épicas y user stories del MVP
│   │   └── user-journeys.md               Para: Flujos de usuario (happy path + edge cases)
│   │
│   ├── 📁 SRS/                            Para: FASE 2 - Software Requirements (visión técnica)
│   │   ├── README.md                      Para: Explicar qué es SRS
│   │   ├── functional-specs.md            Para: Requerimientos funcionales (FRs mapeados 1:1)
│   │   ├── non-functional-specs.md        Para: Performance, security, scalability
│   │   ├── architecture-specs.md          Para: C4 diagrams, ERD, tech stack
│   │   └── api-contracts.yaml             Para: OpenAPI 3.0 spec de todos los endpoints
│   │
│   ├── 📁 PBI/                            Para: FASES 4-6 - Product Backlog (tareas concretas)
│   │   ├── README.md                      Para: Explicar estructura de PBI
│   │   ├── epic-tree.md                   Para: Vista high-level de todas las épicas
│   │   │
│   │   └── 📁 epics/                      Para: Contener todas las épicas del proyecto
│   │       │
│   │       └── 📁 EPIC-{PROYECTO}-{NUM}-{nombre}/  Para: Una épica (ej: EPIC-MYM-13-mentor-discovery)
│   │           │
│   │           ├── epic.md                Para: FASE 4 - Descripción, scope, criteria
│   │           ├── feature-test-plan.md   Para: FASE 5 - Plan de pruebas a nivel feature
│   │           ├── feature-implementation-plan.md  Para: FASE 6 - Decisiones técnicas de la épica
│   │           │
│   │           └── 📁 stories/            Para: Contener todas las stories de esta épica
│   │               │
│   │               └── 📁 STORY-{PROYECTO}-{NUM}-{nombre}/  Para: Una story (ej: STORY-MYM-14-view-mentors)
│   │                   │
│   │                   ├── story.md       Para: FASE 4 - User story + acceptance criteria
│   │                   ├── test-cases.md  Para: FASE 5 - 6+ test cases detallados
│   │                   ├── implementation-plan.md  Para: FASE 6 - Plan técnico step-by-step
│   │                   │
│   │                   └── [opcionales]   Para: Archivos auxiliares si la story es compleja
│   │                       ├── components.md       Para: Detalles de componentes React
│   │                       ├── api-details.md      Para: Lógica API compleja
│   │                       └── database-changes.md Para: Migrations complejas
│   │
│   └── 📁 guidelines/                     Para: FASES 7-13 - Reference material para la IA
│       ├── README.md                      Para: Explicar guidelines y su uso
│       │
│       ├── 📄 Workflow y Estándares:
│       ├── implementation-workflow.md     Para: Workflow paso a paso de implementación
│       ├── code-standards.md              Para: DRY, naming, TypeScript strict
│       ├── error-handling.md              Para: NO hardcodear, error classes, logging
│       ├── context-loading.md             Para: Qué archivos leer en cada fase
│       ├── mcp-usage-tips.md              Para: Cuándo usar Supabase/Atlassian MCP
│       ├── deployment-workflow.md         Para: Flujo staging → production ⭐ NUEVO
│       ├── testing-strategy.md            Para: Estrategia completa de testing ⭐ NUEVO
│       ├── exploratory-testing.md         Para: Guía de exploratory testing ⭐ NUEVO
│       ├── git-flow.md                    Para: Estrategia de Git Flow ⭐ NUEVO
│       │
│       └── 📁 tae/                        Para: FASE 11 - Test Automation Engineering
│           ├── README.md                  Para: Explicar TAE y workflow de uso
│           │
│           ├── 🤖 Archivos Estratégicos (generados con prompts):
│           ├── test-strategy.md           Para: Estrategia general de testing del proyecto
│           ├── kata-implementation-plan.md  Para: Plan de implementación de KATA framework
│           ├── automation-standards.md    Para: Estándares de código para tests
│           │
│           ├── 📚 Archivos de Referencia (documentación completa):
│           ├── kata-architecture.md       Para: Arquitectura KATA adaptada al proyecto
│           ├── test-data-management.md    Para: Gestión de datos de prueba (Faker, factories)
│           ├── tms-integration.md         Para: Integración con Xray Cloud o Jira Direct
│           ├── ci-cd-integration.md       Para: Configuración de GitHub Actions
│           │
│           └── 📋 Plantillas (llenar durante implementación):
│               ├── component-catalog.md   Para: Catalogar componentes implementados
│               └── atc-registry.md        Para: Registro de ATCs con trazabilidad a Jira
│
├── 📁 .prompts/                           Para: Prompts copy-paste para generar documentación
│   │
│   ├── 📄 README.md                       Para: Instrucciones de cómo usar los prompts
│   │
│   ├── 📁 fase-1-constitution/            Para: Generar docs de negocio
│   │   ├── business-model.md              Para: Prompt de Business Model Canvas
│   │   └── market-context.md              Para: Prompt de análisis de mercado
│   │
│   ├── 📁 fase-2-architecture/            Para: Generar specs de producto y arquitectura
│   │   ├── prd-executive-summary.md       Para: Prompt de executive summary
│   │   ├── prd-user-personas.md           Para: Prompt de user personas
│   │   ├── prd-mvp-scope.md               Para: Prompt de épicas iniciales
│   │   ├── prd-user-journeys.md           Para: Prompt de user journeys
│   │   ├── srs-functional-specs.md        Para: Prompt de FRs
│   │   ├── srs-non-functional-specs.md    Para: Prompt de NFRs
│   │   ├── srs-architecture-specs.md      Para: Prompt de arquitectura + C4
│   │   └── srs-api-contracts.md           Para: Prompt de OpenAPI spec
│   │
│   ├── 📁 fase-3-infrastructure/          Para: Setup técnico base (una sola vez) ⭐ NUEVA
│   │   ├── README.md                      Para: Guía de la fase
│   │   ├── cloud-services.md              Para: Setup de Supabase/Vercel
│   │   ├── backend-setup.md               Para: DB schemas + API boilerplate
│   │   └── frontend-setup.md              Para: Design System + proyecto frontend
│   │
│   ├── 📁 fase-4-specification/           Para: Generar product backlog (PBI)
│   │   ├── pbi-product-backlog.md         Para: Setup MVP - epic-tree + épicas/stories (Jira-First)
│   │   └── pbi-add-feature.md             Para: Post-MVP - Analiza + crea features (3 niveles)
│   │
│   ├── 📁 fase-5-shift-left-testing/      Para: Generar docs de testing
│   │   ├── feature-test-plan.md           Para: Prompt de plan de pruebas (épica)
│   │   └── story-test-cases.md            Para: Prompt de test cases (story)
│   │
│   ├── 📁 fase-6-planning/                Para: Generar planes de implementación
│   │   ├── feature-implementation-plan.md Para: Prompt de plan técnico (épica)
│   │   └── story-implementation-plan.md   Para: Prompt de plan técnico (story)
│   │
│   ├── 📁 fase-7-implementation/          Para: Guías de implementación de código
│   │   ├── README.md                      Para: Guía de uso de prompts de implementación
│   │   ├── implement-story.md             Para: Implementar story desde cero
│   │   ├── continue-implementation.md     Para: Retomar story pausada
│   │   ├── fix-issues.md                  Para: Debuggear y corregir errores
│   │   └── unit-testing.md                Para: Agregar unit tests ⭐ NUEVO
│   │
│   ├── 📁 fase-8-code-review/             Para: Guías de code review estático
│   │   ├── README.md                      Para: Guía de uso de prompts de review
│   │   ├── review-pr.md                   Para: Review completo de código
│   │   └── setup-linting.md               Para: Configurar ESLint + Prettier
│   │
│   ├── 📁 fase-9-deployment-staging/      Para: Deploy a ambiente de pruebas ⭐ NUEVA
│   │   ├── README.md                      Para: Guía de la fase
│   │   ├── ci-cd-setup.md                 Para: GitHub Actions workflow
│   │   ├── environment-config.md          Para: Configurar secrets por ambiente
│   │   └── deploy-to-staging.md           Para: Deploy automatizado
│   │
│   ├── 📁 fase-10-exploratory-testing/    Para: Testing manual rápido ⭐ NUEVA
│   │   ├── README.md                      Para: Guía de la fase
│   │   ├── smoke-test.md                  Para: Validar deployment ⭐ NUEVO
│   │   ├── test-charter.md                Para: Crear charter de exploración
│   │   ├── session-notes.md               Para: Documentar sesión
│   │   └── bug-report.md                  Para: Reportar bugs
│   │
│   ├── 📁 fase-11-test-automation/        Para: Automation con KATA framework
│   │   ├── README.md                      Para: Guía de la fase ⭐ NUEVO
│   │   ├── test-strategy.md               Para: Estrategia KATA maestro
│   │   ├── kata-implementation-plan.md    Para: Plan maestro KATA
│   │   ├── automation-standards.md        Para: Estándares de código
│   │   ├── integration-test-plan.md       Para: Plan tests API ⭐ NUEVO
│   │   ├── e2e-test-plan.md               Para: Plan tests E2E ⭐ NUEVO
│   │   ├── implement-integration-tests.md Para: Implementar tests API ⭐ NUEVO
│   │   └── implement-e2e-tests.md         Para: Implementar tests E2E ⭐ NUEVO
│   │
│   ├── 📁 fase-12-production-deployment/  Para: Deploy a producción ⭐ NUEVA
│   │   ├── README.md                      Para: Guía de la fase
│   │   ├── pre-deploy-checklist.md        Para: Validaciones pre-deploy
│   │   ├── deploy-to-production.md        Para: Estrategia de deploy
│   │   └── rollback-plan.md               Para: Plan de contingencia
│   │
│   └── 📁 fase-13-shift-right-testing/    Para: Monitoring y observabilidad ⭐ NUEVA
│       ├── README.md                      Para: Guía de la fase
│       ├── monitoring-setup.md            Para: Configurar Sentry/logs
│       ├── smoke-tests.md                 Para: Tests post-deploy
│       └── incident-response.md           Para: Playbook de incidentes
│
└── 📁 docs/                               Para: Documentación maestra del sistema
    ├── 📄 README.md                       Para: Índice de toda la documentación
    │
    ├── 🏗️ Arquitectura y Blueprint
    │   ├── ai-driven-software-project-blueprint.md  Para: Metodología de 13 fases ⭐ ACTUALIZADO
    │   └── kata-test-architecture.md      Para: Framework de testing KATA
    │
    ├── 🔧 MCP Configuration (Model Context Protocol)
    │   ├── mcp-config-general.md          Para: Conceptos fundamentales de MCP
    │   ├── mcp-config-claudecode.md       Para: Configuración Claude Code
    │   ├── mcp-config-geminicli.md        Para: Configuración Gemini CLI
    │   ├── mcp-config-copilotcli.md       Para: Configuración GitHub Copilot CLI
    │   ├── mcp-config-vscode.md           Para: Configuración VS Code + Copilot
    │   └── mcp-builder-strategy.md        Para: Optimización de tokens (session-based)
```

---

## 🎯 FLUJO DE TRABAJO COMPLETO

### **FASES SINCRÓNICAS** (Setup inicial - una sola vez)

#### 1️⃣ FASE 1: Constitution (Founder/Cliente)

```
Input: Idea de negocio
Usar: .prompts/fase-1-constitution/
Output: .context/idea/ (2-3 archivos)
Quién: Founder, Cliente, Product Owner
```

#### 2️⃣ FASE 2: Architecture (Architect/PM/BA)

```
Input: .context/idea/
Usar: .prompts/fase-2-architecture/
Output:
  - .context/PRD/ (4 archivos: executive-summary, user-personas, mvp-scope, user-journeys)
  - .context/SRS/ (4 archivos: functional-specs, non-functional-specs, architecture-specs, api-contracts)
Quién: Solution Architect, Product Manager, Business Analyst
```

#### 3️⃣ FASE 3: Infrastructure (DevOps/Dev) ⭐ **NUEVA**

```
Input: .context/PRD/ + .context/SRS/
Usar: .prompts/fase-3-infrastructure/

Ejecutar en orden:
1. cloud-services.md      → Crea proyectos Supabase/Vercel
2. backend-setup.md       → DB schemas + API + tipos TypeScript
3. frontend-setup.md      → Design System + proyecto frontend

Output: Proyecto base funcional con backend + frontend integrados
Quién: DevOps, Backend Dev, Frontend Dev

Por qué este orden:
- Backend define schemas → genera tipos TypeScript
- Frontend consume esos tipos → zero type errors
- Flujo natural: Cloud → DB → API → UI
```

---

### **FASES ASINCRÓNICAS** (Iterativas - por story/sprint)

#### 4️⃣ FASE 4: Specification (PO/PM) ⚡ **FLUJO JIRA-FIRST**

```
Input (MVP): .context/PRD/ + .context/SRS/
Input (Post-MVP): Descripción de feature/idea
Usar:
  - .prompts/fase-4-specification/pbi-product-backlog.md (setup MVP)
  - .prompts/fase-4-specification/pbi-add-feature.md (agregar features)

Flujo Jira-First:
  1. Crea épica/story en Jira (MCP) → Obtiene ID real
  2. Crea carpeta local con ID real (ej: EPIC-MYM-13-nombre/)
  3. Crea archivos .md locales

Output:
  - .context/PBI/epic-tree.md
  - .context/PBI/epics/EPIC-{PROYECTO}-{NUM}-{nombre}/epic.md
  - .context/PBI/epics/.../stories/STORY-{PROYECTO}-{NUM}-{nombre}/story.md

Beneficio: Nomenclatura correcta desde el inicio (IDs reales de Jira)
Quién: Product Owner, Product Manager
```

#### 5️⃣ FASE 5: Shift-Left Testing (QA)

```
Input: .context/PBI/ (épicas y stories específicas)
Usar: .prompts/fase-5-shift-left-testing/
Output:
  - .context/PBI/epics/EPIC-XXX/feature-test-plan.md
  - .context/PBI/epics/EPIC-XXX/stories/STORY-XXX/test-cases.md
Quién: QA Engineer, Test Lead
```

#### 6️⃣ FASE 6: Planning (Tech Lead/Dev)

```
Input: .context/PBI/ + .context/SRS/
Usar: .prompts/fase-6-planning/
Output:
  - .context/PBI/epics/EPIC-XXX/feature-implementation-plan.md
  - .context/PBI/epics/EPIC-XXX/stories/STORY-XXX/implementation-plan.md
Quién: Tech Lead, Senior Developer
```

#### 7️⃣ FASE 7: Implementation (Dev + IA)

```
Input: .context/PBI/epics/EPIC-XXX/stories/STORY-XXX/implementation-plan.md
Leer: .context/guidelines/ (TODOS los archivos)
Usar: .prompts/fase-7-implementation/

Flujo:
1. implement-story.md     → Implementar funcionalidad
2. unit-testing.md        → Agregar unit tests (si aplica) ⭐ NUEVO

Output: Código funcional implementado (src/, componentes, API, DB) + unit tests
Quién: Developer + AI Assistant
Nota: Solo funcionalidad + unit tests - NO incluye integration/E2E tests (esos van en Fase 11)
```

#### 8️⃣ FASE 8: Code Review (Tech Lead/Senior Dev)

```
Input: Código implementado (Fase 7)
Leer: .context/guidelines/code-standards.md
Usar: .prompts/fase-8-code-review/
Output: Reporte de review (APPROVE / CHANGES REQUESTED)
Quién: Tech Lead, Senior Developer
Nota: Análisis estático - NO revisa tests (tests van en Fase 11)
```

#### 9️⃣ FASE 9: Deployment Staging (DevOps) ⭐ **NUEVA**

```
Input: Código aprobado (Fase 8)
Usar: .prompts/fase-9-deployment-staging/

CI/CD ejecuta automáticamente:
1. Linting
2. Unit tests
3. Build
4. Deploy to Vercel Staging

Output: URL de staging disponible
Quién: DevOps (automatizado)
```

#### 🔟 FASE 10: Exploratory Testing (QA) ⭐ **NUEVA**

```
Input: URL de staging
Usar: .prompts/fase-10-exploratory-testing/

Flujo:
1. smoke-test.md          → Validar deployment (5 min) ⭐ NUEVO
2. test-charter.md        → Planear exploración
3. session-notes.md       → Documentar sesión
4. bug-report.md          → Reportar bugs

Output: Feedback manual + bugs encontrados
Quién: QA Engineer

Por qué manual antes que automatizado:
- Feedback rápido (minutos vs horas)
- Encuentra bugs de UX que tests automatizados no ven
- Solo automatizas lo ya validado manualmente
```

#### 1️⃣1️⃣ FASE 11: Test Automation (QA Automation) ⭐ **ACTUALIZADA**

```
Input: Exploratory findings (Fase 10)
Usar: .prompts/fase-11-test-automation/

Arquitectura: KATA Framework

Flujo:
1. integration-test-plan.md       → Plan de tests API ⭐ NUEVO
2. implement-integration-tests.md → Implementar tests API ⭐ NUEVO
3. e2e-test-plan.md               → Plan de tests E2E ⭐ NUEVO
4. implement-e2e-tests.md         → Implementar tests E2E ⭐ NUEVO

Output: Integration + E2E tests funcionando en CI/CD
Quién: QA Automation Engineer, SDET
Nota: Solo automatiza lo ya validado en Fase 10

Tipos de tests:
- ✅ Integration tests (API)
- ✅ E2E tests (UI con Playwright)
- ❌ Unit tests (esos van en Fase 7)
```

#### 1️⃣2️⃣ FASE 12: Production Deployment (DevOps) ⭐ **NUEVA**

```
Input: Tests automation pasando (Fase 11)
Usar: .prompts/fase-12-production-deployment/

Flujo:
1. pre-deploy-checklist.md   → Validaciones pre-deploy
2. deploy-to-production.md    → Deploy estratégico
3. rollback-plan.md           → Solo si hay problemas

Output: Código en producción
Quién: DevOps
```

#### 1️⃣3️⃣ FASE 13: Shift-Right Testing (SRE/DevOps) ⭐ **NUEVA**

```
Input: Producción activa
Usar: .prompts/fase-13-shift-right-testing/

Componentes:
- Monitoring (Sentry, logs)
- Smoke tests post-deploy
- Incident response

Output: Observabilidad activa
Quién: SRE, DevOps
```

---

## 🔑 CONCEPTOS CLAVE

### 📝 Documentación vs Prompts

| Tipo              | Ubicación   | Propósito                                            |
| ----------------- | ----------- | ---------------------------------------------------- |
| **Documentación** | `.context/` | Información que la IA lee para trabajar              |
| **Prompts**       | `.prompts/` | Plantillas para GENERAR documentación en `.context/` |
| **Blueprints**    | `docs/`     | Documentación maestra del sistema completo           |

### 🎭 Roles por Fase

| Fase             | Nombre               | Tipo       | Rol                      | Input                               | Output                                                          |
| ---------------- | -------------------- | ---------- | ------------------------ | ----------------------------------- | --------------------------------------------------------------- |
| **SINCRÓNICAS**  |                      |            |                          |                                     |                                                                 |
| 1                | Constitution         | Setup      | Founder/Cliente/PO       | Idea de negocio                     | `.context/idea/`                                                |
| 2                | Architecture         | Setup      | Architect/PM/BA          | `.context/idea/`                    | `.context/PRD/` + `.context/SRS/`                               |
| 3                | Infrastructure       | Setup      | DevOps/Backend/Frontend  | PRD + SRS                           | Cloud + Backend + Frontend base                                 |
| **ASINCRÓNICAS** |                      |            |                          |                                     |                                                                 |
| 4                | Specification        | Iterativa  | PO/PM                    | PRD + SRS                           | `.context/PBI/` (épicas + stories)                              |
| 5                | Shift-Left Testing   | Iterativa  | QA Engineer              | PBI                                 | Test plans + test cases en PBI                                  |
| 6                | Planning             | Iterativa  | Tech Lead/Dev            | SRS + PBI                           | Implementation plans                                            |
| 7                | Implementation       | Iterativa  | Dev + IA                 | Implementation plans + guidelines   | Código (src/) + unit tests                                      |
| 8                | Code Review          | Iterativa  | Tech Lead/Senior Dev     | Pull Request                        | PR aprobado                                                     |
| 9                | Deployment Staging   | Iterativa  | DevOps                   | Código aprobado                     | Deploy a staging                                                |
| 10               | Exploratory Testing  | Iterativa  | QA Engineer              | Staging                             | Feedback manual + bugs                                          |
| 11               | Test Automation      | Iterativa  | QA Automation/SDET       | Exploratory findings                | Integration + E2E tests                                         |
| 12               | Production Deploy    | Iterativa  | DevOps                   | Tests pasando                       | Deploy a producción                                             |
| 13               | Shift-Right Testing  | Iterativa  | SRE/DevOps               | Producción activa                   | Monitoring + observabilidad                                     |

### 🏗️ Arquitectura Unificada (PBI)

**Beneficio clave**: Para trabajar en una story, la IA lee **UNA sola carpeta**.

```
.context/PBI/epics/EPIC-MYM-13-mentor-discovery/stories/STORY-MYM-14-view-mentors/
├── story.md                    (Fase 4: Qué hacer)
├── test-cases.md               (Fase 5: Cómo probar)
└── implementation-plan.md      (Fase 6: Cómo implementar)
```

✅ **TODO en un lugar** → Sin duplicación → Context Engineering optimizado

**Nomenclatura:** `EPIC-{PROYECTO}-{NUM}-{nombre}/` y `STORY-{PROYECTO}-{NUM}-{nombre}/`

- IDs reales de Jira (obtenidos con flujo Jira-First)
- Kebab-case en nombres descriptivos
- Trazabilidad perfecta: carpeta local ↔ Jira issue (1:1)

---

## 🔑 CONCEPTOS CLAVE ACTUALIZADOS

### Architecture (Fase 2) vs Infrastructure (Fase 3)

**Architecture (Fase 2):**
- Specs técnicas en papel
- Diagramas C4, ERD, API contracts
- Decisiones de diseño
- **NO se escribe código**

**Infrastructure (Fase 3):**
- Implementación de la base técnica
- Código real: cloud + backend + frontend
- Se ejecuta **una sola vez**
- Output: proyecto funcional base

### Backend antes que Frontend (Fase 3)

**Por qué este orden:**

```typescript
// 1. Backend define schemas (Fase 3.2)
// schemas/user.ts
export const userSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  email: z.string().email()
})

// 2. Backend genera tipos automáticamente
export type User = z.infer<typeof userSchema>

// 3. Frontend importa tipos reales (Fase 3.3)
import type { User } from '@/lib/types'

const UserCard = ({ user }: { user: User }) => {
  return <div>{user.name}</div>  // ✅ Zero type errors
}
```

**Beneficios:**
- Zero type mismatches
- Frontend consume APIs reales (no mock)
- Cambios en backend se reflejan automáticamente en frontend

### Testing: Manual antes que Automatizado

**Exploratory (Fase 10) antes que Automation (Fase 11):**

| Aspecto       | Exploratory          | Automation                |
| ------------- | -------------------- | ------------------------- |
| Velocidad     | 5-30 minutos         | Horas/días                |
| Cobertura     | Bugs de UX + lógica  | Solo lógica               |
| Inversión     | Baja                 | Alta                      |
| Flexibilidad  | Total                | Rígida                    |

**Principio:** Solo automatiza lo ya validado manualmente.

**Razón:** No pierdas tiempo automatizando funcionalidad rota o que cambiará.

### Unit Tests en Implementation (Fase 7)

**Por qué unit tests van en desarrollo:**
- Son parte natural del código
- Rápidos (milisegundos)
- Corren local antes de commit
- Evitan bugs antes de merge

**Integration/E2E van después (Fase 11):**
- Necesitan ambiente real (staging)
- Lentos (segundos/minutos)
- Validan sistema completo integrado

### Arquitectura KATA en Test Automation

**KATA** = Keyword-Action-Test Architecture

Organiza tests en 3 capas:
- **Components:** Wrappers de APIs o Page Objects
- **Actions:** Flujos de negocio reutilizables
- **Tests:** Casos de prueba concretos

Todos los tests automation siguen KATA.

---

## 📊 ESTADÍSTICAS

### Archivos Totales Creados

| Directorio                     | Archivos            | Propósito                                |
| ------------------------------ | ------------------- | ---------------------------------------- |
| `.context/idea/`               | 3-4                 | Fase 1: Constitution                     |
| `.context/PRD/`                | 4                   | Fase 2: Architecture (business)          |
| `.context/SRS/`                | 4                   | Fase 2: Architecture (technical)         |
| `.context/PBI/`                | Variable            | Fases 4-6 (depende de # épicas/stories)  |
| `.context/guidelines/`         | 10                  | Fases 7-13: Reference material           |
| `.context/guidelines/tae/`     | 10                  | Fase 11: Test Automation                 |
| `.prompts/`                    | ~78-85              | Guías de prompts (todas las fases)       |
| `docs/`                        | 9                   | Blueprints + MCP configs                 |
| **TOTAL BASE**                 | **~118-125 archivos** | Sistema completo (13 fases)            |

### Tamaños de Documentación

| Archivo                                   | Líneas | Descripción                              |
| ----------------------------------------- | ------ | ---------------------------------------- |
| `ai-driven-software-project-blueprint.md` | ~800   | Metodología de 13 fases                  |
| `kata-test-architecture.md`               | 1,874  | Documentación completa KATA              |
| `.context/guidelines/tae/*`               | ~2,500 | Docs de testing automation               |
| `.prompts/*`                              | ~4,500 | Prompts optimizados (todas las fases)    |

---

## 🎯 PUNTOS CLAVE PARA RECORDAR

### ✅ DO's (Hacer)

1. **Seguir el orden secuencial** de fases (1-3 para setup, luego 4-13 iterativo)
2. **Usar prompts de `.prompts/`** para generar docs en `.context/`
3. **Fase 3 ANTES de Fase 4** - Setup técnico antes de backlog
4. **Backend antes que Frontend** en Fase 3 (tipos compartidos)
5. **Exploratory antes que Automation** - Manual (Fase 10) antes de automatizar (Fase 11)
6. **Unit tests en Fase 7** - Durante implementation, no después
7. **Usar flujo Jira-First** en Fase 4 (crear en Jira → obtener ID → crear local)
8. **Leer guidelines** antes de implementar (Fases 7-13)
9. **Usar MCP tools** (Supabase, Atlassian) para datos reales y crear issues
10. **Mantener arquitectura unificada** (todo en carpeta de story)
11. **Seguir nomenclatura estándar** (EPIC-{PROYECTO}-{NUM}-{nombre})
12. **Fases 1-3 son sincrónicas** (una sola vez), **Fases 4-13 son asincrónicas** (por sprint)

### ❌ DON'Ts (No hacer)

1. **NO hardcodear** SQL schemas (usar Supabase MCP)
2. **NO saltarse** fases (cada una depende de la anterior)
3. **NO duplicar** información (DRY always)
4. **NO mezclar** prompts con documentación
5. **NO crear** archivos innecesarios (solo si son críticos)
6. **NO crear épicas/stories localmente primero** (usar flujo Jira-First con MCP)
7. **NO usar nomenclatura inconsistente** (siempre EPIC-{PROYECTO}-{NUM}-{nombre})
8. **NO inventar IDs** (siempre usar IDs reales de Jira obtenidos con MCP)
9. **NO crear Frontend antes que Backend** (orden incorrecto)
10. **NO automatizar antes de validar manualmente** (Exploratory primero)
11. **NO poner unit tests en Fase 11** (van en Fase 7)
12. **NO saltarse smoke tests** (Fase 10 primero)

---

## 🚀 PRÓXIMOS PASOS

1. **Para nuevos proyectos**: Empezar con `.prompts/fase-1-constitution/`
2. **Para proyectos existentes**: Empezar con análisis legacy → `.context/idea/legacy-analysis.md`
3. **Setup inicial**: Completar Fases 1-3 (Constitution + Architecture + Infrastructure) antes de entrar a sprints
4. **Setup MVP (Fase 4)**: Usar `pbi-product-backlog.md` con flujo Jira-First para crear backlog inicial
5. **Infrastructure (Fase 3)** ⭐: Ejecutar en orden: cloud-services → backend-setup → frontend-setup
6. **Agregar features post-MVP**: Usar `pbi-add-feature.md` que analiza complejidad y crea incremental
7. **Para implementación (Fase 7)**: Usar `.prompts/fase-7-implementation/implement-story.md` por cada story
8. **Para code review (Fase 8)**: Usar `.prompts/fase-8-code-review/review-pr.md` antes de merge
9. **Para exploratory testing (Fase 10)**: Usar `.prompts/fase-10-exploratory-testing/` después de deploy staging
10. **Para automation (Fase 11)**: Usar `.prompts/fase-11-test-automation/` después de exploratory
11. **Para production (Fase 12)**: Usar `.prompts/fase-12-production-deployment/` cuando tests pasen

### 💡 Tips para Fase 3 (Infrastructure) ⭐ NUEVA

**Cuándo ejecutar:**
- Después de completar Fases 1-2 (Constitution + Architecture)
- ANTES de Fase 4 (Specification/Backlog)
- Una sola vez por proyecto (sincrónica)

**Orden correcto:**
1. **cloud-services.md** (primero) - Setup Supabase/Vercel
2. **backend-setup.md** (segundo) - DB schemas + API + tipos TypeScript
3. **frontend-setup.md** (tercero) - Design System + proyecto frontend

**Por qué Backend antes que Frontend:**
- Backend define schemas → genera tipos TypeScript automáticamente
- Frontend importa tipos reales → zero type mismatches
- Ejemplo: `schemas → types → componentes`

**Después de ejecutar:**
- Configura `.env.local` con credenciales reales
- Prueba el servidor (`npm run dev` o `bun run dev`)
- Revisa `.context/design-system.md` (tu guía de estilo)
- Muestra el design system al equipo
- Procede a Fase 4 (Specification) con base técnica lista

### 💡 Tips para Fase 4 (Specification)

**Setup MVP inicial:**
- Usa `pbi-product-backlog.md`
- Trabaja épica por épica (incremental)
- Crea primero en Jira → luego local (flujo Jira-First)

**Agregar features nuevas:**
- Usa `pbi-add-feature.md`
- Deja que analice la complejidad (3 niveles)
- Si es Nivel 3 (múltiples épicas), primero revisa el plan generado
- Trabaja incremental siempre

### 💡 Tips para Fase 7 (Implementation)

**Cuándo ejecutar:**
- Después de tener implementation-plan.md completo (Fase 6)
- Para cada story del sprint

**Durante ejecución:**
- La IA verifica si Context7 MCP está disponible (recomendado)
- Implementa step by step según el plan
- **Agregar unit tests** usando `unit-testing.md` ⭐
- Valida manualmente que funciona (smoke test)
- NO agrega integration/E2E tests (eso es Fase 11)

**Después de ejecutar:**
- Valida con `npm run build`
- Prueba manual de funcionalidad
- Procede a Fase 8 (Code Review)

### 💡 Tips para Fase 8 (Code Review)

**Cuándo ejecutar:**
- Después de implementar código (Fase 7)
- Antes de merge a rama principal

**Durante ejecución:**
- La IA ejecuta linting (`npm run lint`) si está configurado
- Si NO hay linter: usa `setup-linting.md` primero
- Revisa código según checklist completo
- NO revisa integration/E2E tests (eso es Fase 11)

**Resultados posibles:**
- ✅ **APPROVED** → Procede a Fase 9 (Deploy Staging)
- ❌ **CHANGES REQUESTED** → Vuelve a Fase 7 (fix-issues.md)

### 💡 Tips para Fase 10 (Exploratory Testing) ⭐ NUEVA

**Cuándo ejecutar:**
- Después de deploy a staging (Fase 9)
- ANTES de invertir en automation (Fase 11)

**Por qué manual primero:**
- Feedback en minutos (vs horas de automation)
- Encuentra bugs de UX que automation no ve
- Solo automatizas lo ya validado

**Flujo:**
1. `smoke-test.md` - Validar deployment (5 min)
2. `test-charter.md` - Planear exploración (15 min)
3. `session-notes.md` - Documentar (60-90 min)
4. `bug-report.md` - Reportar bugs

**Output:**
- Bugs encontrados temprano
- Feedback de UX
- Ideas para automation (Fase 11)

### 💡 Tips para Fase 11 (Test Automation) ⭐ ACTUALIZADA

**Cuándo ejecutar:**
- DESPUÉS de Exploratory Testing (Fase 10)
- Solo automatiza lo ya validado manualmente

**Arquitectura: KATA Framework**
- Lee primero: `test-strategy.md`, `kata-implementation-plan.md`
- Todos los tests siguen estructura: Components → Actions → Tests

**Tipos de tests:**
- ✅ Integration tests (API) - Fase 11
- ✅ E2E tests (UI) - Fase 11
- ❌ Unit tests - Van en Fase 7 (Implementation)

**Flujo:**
1. `integration-test-plan.md` - Plan tests API
2. `implement-integration-tests.md` - Implementar
3. `e2e-test-plan.md` - Plan tests E2E
4. `implement-e2e-tests.md` - Implementar

---

## 📚 DOCUMENTACIÓN COMPLETA

### Arquitectura del Sistema

- **[AI-Driven Software Project Blueprint](./docs/ai-driven-software-project-blueprint.md)** - Metodología completa de 13 fases ⭐ ACTUALIZADO
- **[KATA Test Architecture](./docs/kata-test-architecture.md)** - Framework de testing automatizado

### MCP Configuration (Model Context Protocol)

> 💡 **¿Qué es MCP?** Un protocolo que permite a las IAs conectarse con herramientas externas (bases de datos, APIs, testing, etc.)

**Configuración Esencial**:

1. **[MCP Builder Strategy](./docs/mcp-builder-strategy.md)** ⭐ **EMPIEZA AQUÍ**
   - Solución al "Token Hell" (reducción 80-90% tokens)
   - Carga de MCPs por sesión/tarea
   - Setup paso a paso con templates

2. **[MCP - Guía General](./docs/mcp-config-general.md)**
   - Conceptos fundamentales
   - Tipos de transporte (stdio, HTTP, SSE)
   - Seguridad y autenticación

**Configuración por Herramienta** (elige la tuya):

- **[Claude Code](./docs/mcp-config-claudecode.md)** - CLI de Anthropic
- **[Gemini CLI](./docs/mcp-config-geminicli.md)** - CLI de Google
- **[GitHub Copilot CLI](./docs/mcp-config-copilotcli.md)** - CLI de GitHub
- **[VS Code + Copilot](./docs/mcp-config-vscode.md)** - Integración en editor

**Quick Start MCP**:

```bash
# 1. Configura variables de ambiente
cp .env.example .env
# Edita .env y ajusta las rutas según tu herramienta (Gemini, Claude Code, etc.)

# 2. Copia template de MCP catalog
cp templates/mcp/gemini.template.json .gemini/settings.catalog.json

# 3. Agrega tus API keys al catalog
# Edita .gemini/settings.catalog.json con tus claves reales

# 4. Carga MCPs por tarea
node scripts/mcp-builder.js backend  # Solo supabase + context7
node scripts/mcp-builder.js frontend  # Solo playwright + context7
```

---

## 📋 TRACKING & CAMBIOS

- **[PENDING-PROMPTS.md](./PENDING-PROMPTS.md)** - Estado de implementación de prompts ⭐ NUEVO
- **[CHANGELOG.md](./CHANGELOG.md)** - Historial de cambios v1.0 → v2.0 ⭐ NUEVO

---

**💡 Este sistema es tu "segundo cerebro" para desarrollo de software impulsado por IA. Cada archivo tiene un propósito específico en el flujo de trabajo completo de 13 fases.**

**🎉 Versión 2.0** - Expandido de 8 a 13 fases para flujo empresarial completo
