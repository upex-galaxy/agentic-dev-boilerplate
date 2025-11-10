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
│   ├── 📁 PBI/                            Para: FASES 3-5 - Product Backlog (tareas concretas)
│   │   ├── README.md                      Para: Explicar estructura de PBI
│   │   ├── epic-tree.md                   Para: Vista high-level de todas las épicas
│   │   │
│   │   └── 📁 epics/                      Para: Contener todas las épicas del proyecto
│   │       │
│   │       └── 📁 EPIC-{PROYECTO}-{NUM}-{nombre}/  Para: Una épica (ej: EPIC-MYM-13-mentor-discovery)
│   │           │
│   │           ├── epic.md                Para: FASE 3 - Descripción, scope, criteria
│   │           ├── feature-test-plan.md   Para: FASE 4 - Plan de pruebas a nivel feature
│   │           ├── feature-implementation-plan.md  Para: FASE 5 - Decisiones técnicas de la épica
│   │           │
│   │           └── 📁 stories/            Para: Contener todas las stories de esta épica
│   │               │
│   │               └── 📁 STORY-{PROYECTO}-{NUM}-{nombre}/  Para: Una story (ej: STORY-MYM-14-view-mentors)
│   │                   │
│   │                   ├── story.md       Para: FASE 3 - User story + acceptance criteria
│   │                   ├── test-cases.md  Para: FASE 4 - 6+ test cases detallados
│   │                   ├── implementation-plan.md  Para: FASE 5 - Plan técnico step-by-step
│   │                   │
│   │                   └── [opcionales]   Para: Archivos auxiliares si la story es compleja
│   │                       ├── components.md       Para: Detalles de componentes React
│   │                       ├── api-details.md      Para: Lógica API compleja
│   │                       └── database-changes.md Para: Migrations complejas
│   │
│   └── 📁 guidelines/                     Para: FASES 6-7-8 - Reference material para la IA
│       ├── README.md                      Para: Explicar guidelines y su uso
│       │
│       ├── 📄 Workflow y Estándares:
│       ├── implementation-workflow.md     Para: Workflow paso a paso de implementación
│       ├── code-standards.md              Para: DRY, naming, TypeScript strict
│       ├── error-handling.md              Para: NO hardcodear, error classes, logging
│       ├── context-loading.md             Para: Qué archivos leer en cada fase
│       ├── mcp-usage-tips.md              Para: Cuándo usar Supabase/Atlassian MCP
│       │
│       └── 📁 tae/                        Para: FASE 8 - Test Automation Engineering
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
│   ├── 📁 fase-3-specification/           Para: Generar product backlog (PBI)
│   │   ├── pbi-product-backlog.md         Para: Setup MVP - epic-tree + épicas/stories (Jira-First)
│   │   └── pbi-add-feature.md             Para: Post-MVP - Analiza + crea features (3 niveles)
│   │
│   ├── 📁 fase-3.5-frontend-scaffolding/  Para: Crear estructura inicial del frontend 🎨 NUEVO
│   │   └── setup-frontend-skeleton.md     Para: Setup proyecto + páginas estratégicas moqueadas
│   │
│   ├── 📁 fase-4-shift-left-testing/      Para: Generar docs de testing
│   │   ├── feature-test-plan.md           Para: Prompt de plan de pruebas (épica)
│   │   └── story-test-cases.md            Para: Prompt de test cases (story)
│   │
│   ├── 📁 fase-5-planning/                Para: Generar planes de implementación
│   │   ├── feature-implementation-plan.md Para: Prompt de plan técnico (épica)
│   │   └── story-implementation-plan.md   Para: Prompt de plan técnico (story)
│   │
│   └── 📁 fase-8-test-automation/         Para: Generar docs de testing automation
│       ├── test-strategy.md               Para: Prompt de estrategia de testing
│       ├── kata-implementation-plan.md    Para: Prompt de plan KATA
│       └── automation-standards.md        Para: Prompt de estándares de tests
│
└── 📁 docs/                               Para: Documentación maestra del sistema
    ├── 📄 README.md                       Para: Índice de toda la documentación
    │
    ├── 🏗️ Arquitectura y Blueprint
    │   ├── ai-driven-software-project-blueprint.md  Para: Metodología de 8 fases
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

---

### **FASES ASINCRÓNICAS** (Iterativas - por sprint/épica)

#### 3️⃣ FASE 3: Specification (PO/PM) ⚡ **FLUJO JIRA-FIRST**

```
Input (MVP): .context/PRD/ + .context/SRS/
Input (Post-MVP): Descripción de feature/idea
Usar:
  - .prompts/fase-3-specification/pbi-product-backlog.md (setup MVP)
  - .prompts/fase-3-specification/pbi-add-feature.md (agregar features)

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

#### 3.5️⃣ FASE 3.5: Frontend Scaffolding (Dev/Architect) 🎨 **NUEVO**

```
Input: .context/PRD/ + .context/SRS/ + .context/PBI/
Usar: .prompts/fase-3.5-frontend-scaffolding/setup-frontend-skeleton.md

Qué hace:
  1. Analiza épicas/stories para identificar páginas estratégicas
  2. Consulta docs oficiales con Context7 MCP (Next.js, Supabase, etc.)
  3. Instala dependencias fundamentales en directorio actual
  4. Crea estructura de carpetas según framework
  5. Implementa 3-5 páginas core moqueadas (auth + dashboard + domain pages)
  6. Genera componentes base reutilizables

Output:
  - Estructura completa del frontend (app/, components/, lib/, types/)
  - Páginas estratégicas con UI básica (NO lógica completa)
  - Archivos de configuración (tsconfig, tailwind, etc.)
  - .context/frontend-architecture.md
  - SETUP.md

Restricciones:
  ❌ NO usar create-next-app (trabaja en directorio actual)
  ❌ NO implementar todos los criterios de aceptación
  ✅ Solo páginas core del MVP (base para Fase 6)

Beneficio: Esqueleto visual funcional que acelera Fase 6
Quién: Senior Frontend Developer, Solution Architect
```

#### 4️⃣ FASE 4: Shift-Left Testing (QA)

```
Input: .context/PBI/ (épicas y stories específicas)
Usar: .prompts/fase-4-shift-left-testing/
Output:
  - .context/PBI/epics/EPIC-XXX/feature-test-plan.md
  - .context/PBI/epics/EPIC-XXX/stories/STORY-XXX/test-cases.md
Quién: QA Engineer, Test Lead
```

#### 5️⃣ FASE 5: Planning (Dev)

```
Input: .context/PBI/ + .context/SRS/
Usar: .prompts/fase-5-planning/
Output:
  - .context/PBI/epics/EPIC-XXX/feature-implementation-plan.md
  - .context/PBI/epics/EPIC-XXX/stories/STORY-XXX/implementation-plan.md
Quién: Tech Lead, Senior Developer
```

#### 6️⃣ FASE 6: Implementation (Dev + IA)

```
Input: .context/PBI/epics/EPIC-XXX/stories/STORY-XXX/implementation-plan.md
Leer: .context/guidelines/ (TODOS los archivos)
Output: Código implementado (src/, componentes, API, DB)
Quién: Developer + AI Assistant
Nota: NO hay prompts para esta fase (usa guidelines como referencia)
```

#### 7️⃣ FASE 7: Code Review (Dev)

```
Input: Pull Request con código implementado
Leer: .context/guidelines/code-standards.md
Output: PR aprobado o feedback de mejoras
Quién: Tech Lead, Senior Developer
Nota: NO hay prompts para esta fase (usa guidelines como referencia)
```

#### 8️⃣ FASE 8: Test Automation (QA)

```
Input: .context/PRD/ + .context/SRS/ + .context/PBI/
Usar: .prompts/fase-8-test-automation/
Output:
  - .context/guidelines/tae/ (10 archivos: 3 generados + 4 reference + 2 plantillas + 1 README)
  - /tests/ (estructura de tests con KATA framework)
Quién: QA Automation Engineer, SDET
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

| Fase             | Nombre             | Rol                  | Input                             | Output                                 |
| ---------------- | ------------------ | -------------------- | --------------------------------- | -------------------------------------- |
| **SINCRÓNICAS**  |                    |                      |                                   |                                        |
| 1                | Constitution       | Founder/Cliente/PO   | Idea de negocio                   | `.context/idea/`                       |
| 2                | Architecture       | Architect/PM/BA      | `.context/idea/`                  | `.context/PRD/` + `.context/SRS/`      |
| **ASINCRÓNICAS** |                      |                         |                                   |                                        |
| 3                | Specification        | PO/PM                   | PRD + SRS                         | `.context/PBI/` (épicas + stories)     |
| 3.5              | Frontend Scaffolding | Frontend Dev/Architect  | PRD + SRS + PBI                   | Frontend structure + `.context/frontend-architecture.md` |
| 4                | Shift-Left Testing   | QA Engineer             | PBI                               | Test plans + test cases en PBI         |
| 5                | Planning             | Tech Lead/Dev           | SRS + PBI                         | Implementation plans en PBI            |
| 6                | Implementation       | Dev + IA                | Implementation plans + guidelines | Código (src/)                          |
| 7                | Code Review          | Tech Lead/Senior Dev    | Pull Request                      | PR aprobado                            |
| 8                | Test Automation      | QA Automation/SDET      | PRD + SRS + PBI                   | `.context/guidelines/tae/` + `/tests/` |

### 🏗️ Arquitectura Unificada (PBI)

**Beneficio clave**: Para trabajar en una story, la IA lee **UNA sola carpeta**.

```
.context/PBI/epics/EPIC-MYM-13-mentor-discovery/stories/STORY-MYM-14-view-mentors/
├── story.md                    (Fase 3: Qué hacer)
├── test-cases.md               (Fase 4: Cómo probar)
└── implementation-plan.md      (Fase 5: Cómo implementar)
```

✅ **TODO en un lugar** → Sin duplicación → Context Engineering optimizado

**Nomenclatura:** `EPIC-{PROYECTO}-{NUM}-{nombre}/` y `STORY-{PROYECTO}-{NUM}-{nombre}/`

- IDs reales de Jira (obtenidos con flujo Jira-First)
- Kebab-case en nombres descriptivos
- Trazabilidad perfecta: carpeta local ↔ Jira issue (1:1)

---

## 📊 ESTADÍSTICAS

### Archivos Totales Creados

| Directorio                 | Archivos            | Propósito                               |
| -------------------------- | ------------------- | --------------------------------------- |
| `.context/idea/`           | 3-4                 | Fase 1: Constitution                    |
| `.context/PRD/`            | 4                   | Fase 2: Architecture (business)         |
| `.context/SRS/`            | 4                   | Fase 2: Architecture (technical)        |
| `.context/PBI/`            | Variable            | Fases 3-5 (depende de # épicas/stories) |
| `.context/guidelines/`     | 6                   | Fases 6-7: Reference material           |
| `.context/guidelines/tae/` | 10                  | Fase 8: Test Automation                 |
| `.prompts/`                | 20                  | Generadores de documentación (+ Fase 3.5) |
| `docs/`                    | 9                   | Blueprints + MCP configs                |
| **TOTAL BASE**             | **~55-58 archivos** | Sistema completo                        |

### Tamaños de Documentación

| Archivo                                   | Líneas | Descripción                                      |
| ----------------------------------------- | ------ | ------------------------------------------------ |
| `ai-driven-software-project-blueprint.md` | ~500   | Metodología de 8 fases                           |
| `kata-test-architecture.md`               | 1,874  | Documentación completa KATA                      |
| `.context/guidelines/tae/*`               | ~2,500 | Docs de testing automation                       |
| `.prompts/*`                              | ~3,600 | Prompts optimizados (incluye pbi-add-feature.md) |

---

## 🎯 PUNTOS CLAVE PARA RECORDAR

### ✅ DO's (Hacer)

1. **Seguir el orden secuencial** de fases (1 → 2 para setup, luego 3 → 8 iterativo)
2. **Usar prompts de `.prompts/`** para generar docs en `.context/`
3. **Usar flujo Jira-First** en Fase 3 (crear en Jira → obtener ID → crear local)
4. **Leer guidelines** antes de implementar (Fases 6-7-8)
5. **Usar MCP tools** (Supabase, Atlassian) para datos reales y crear issues
6. **Mantener arquitectura unificada** (todo en carpeta de story)
7. **Seguir nomenclatura estándar** (EPIC-{PROYECTO}-{NUM}-{nombre})
8. **Fases 1-2 son sincrónicas** (una sola vez), **Fases 3-8 son asincrónicas** (por sprint)
8. **Fase 3.5 es opcional** pero recomendada para proyectos frontend (scaffolding inicial)

### ❌ DON'Ts (No hacer)

1. **NO hardcodear** SQL schemas (usar Supabase MCP)
2. **NO saltarse** fases (cada una depende de la anterior)
3. **NO duplicar** información (DRY always)
4. **NO mezclar** prompts con documentación
5. **NO crear** archivos innecesarios (solo si son críticos)
6. **NO crear épicas/stories localmente primero** (usar flujo Jira-First con MCP)
7. **NO usar nomenclatura inconsistente** (siempre EPIC-{PROYECTO}-{NUM}-{nombre})
8. **NO inventar IDs** (siempre usar IDs reales de Jira obtenidos con MCP)

---

## 🚀 PRÓXIMOS PASOS

1. **Para nuevos proyectos**: Empezar con `.prompts/fase-1-constitution/`
2. **Para proyectos existentes**: Empezar con análisis legacy → `.context/idea/legacy-analysis.md`
3. **Setup inicial**: Completar Fases 1-2 (Constitution + Architecture) antes de entrar a sprints
4. **Setup MVP (Fase 3)**: Usar `pbi-product-backlog.md` con flujo Jira-First para crear backlog inicial
5. **Frontend Scaffolding (Fase 3.5)** 🎨: Usar `setup-frontend-skeleton.md` para crear estructura inicial del proyecto
6. **Agregar features post-MVP**: Usar `pbi-add-feature.md` que analiza complejidad y crea incremental
7. **Para implementación**: Leer `.context/guidelines/` + implementation plans (Fase 6)
8. **Para testing**: Usar `.prompts/fase-8-test-automation/` después de tener PRD/SRS/PBI

### 💡 Tips para Fase 3 (Specification)

**Setup MVP inicial:**

- Usa `pbi-product-backlog.md`
- Trabaja épica por épica (incremental)
- Crea primero en Jira → luego local (flujo Jira-First)

**Agregar features nuevas:**

- Usa `pbi-add-feature.md`
- Deja que analice la complejidad (3 niveles)
- Si es Nivel 3 (múltiples épicas), primero revisa el plan generado
- Trabaja incremental siempre

### 💡 Tips para Fase 3.5 (Frontend Scaffolding) 🎨

**Cuándo ejecutar:**

- Después de completar Fase 3 (PBI creado)
- ANTES de Fase 4 (Shift-Left Testing)
- Una sola vez por proyecto

**Preparación:**

- Asegúrate de tener PRD, SRS y PBI completos
- Define el framework y tech stack (Next.js, Supabase, etc.)
- Ten listas las credenciales de servicios externos

**Durante ejecución:**

- Deja que la IA consulte docs oficiales (Context7 MCP)
- Confía en su decisión de qué páginas crear (3-5 core)
- NO pidas implementar todas las páginas del MVP
- Solo páginas estratégicas: auth + dashboard + 1-3 core

**Después de ejecutar:**

- Configura `.env.local` con credenciales reales
- Prueba el servidor (`npm run dev`)
- Valida que las páginas cargan correctamente
- Muestra el resultado al equipo
- Procede a Fase 4 (testing) con el scaffolding listo

---

## 📚 DOCUMENTACIÓN COMPLETA

### Arquitectura del Sistema

- **[AI-Driven Software Project Blueprint](./docs/ai-driven-software-project-blueprint.md)** - Metodología completa de 8 fases
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

**💡 Este sistema es tu "segundo cerebro" para desarrollo de software impulsado por IA. Cada archivo tiene un propósito específico en el flujo de trabajo completo.**
