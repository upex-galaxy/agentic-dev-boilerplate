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
│   ├── 📁 PBI/                            Para: FASES 2-4 - Product Backlog (tareas concretas)
│   │   ├── README.md                      Para: Explicar estructura de PBI
│   │   ├── epic-tree.md                   Para: Vista high-level de todas las épicas
│   │   │
│   │   └── 📁 epics/                      Para: Contener todas las épicas del proyecto
│   │       │
│   │       └── 📁 EPIC-XXX-nombre/        Para: Una épica específica (ej: user-auth)
│   │           │
│   │           ├── epic.md                Para: FASE 2 - Descripción, scope, criteria
│   │           ├── feature-test-plan.md   Para: FASE 3 - Plan de pruebas a nivel feature
│   │           ├── feature-implementation-plan.md  Para: FASE 4 - Decisiones técnicas de la épica
│   │           │
│   │           └── 📁 stories/            Para: Contener todas las stories de esta épica
│   │               │
│   │               └── 📁 STORY-XXX-nombre/  Para: Una user story específica
│   │                   │
│   │                   ├── story.md       Para: FASE 2 - User story + acceptance criteria
│   │                   ├── test-cases.md  Para: FASE 3 - 6+ test cases detallados
│   │                   ├── implementation-plan.md  Para: FASE 4 - Plan técnico step-by-step
│   │                   │
│   │                   └── [opcionales]   Para: Archivos auxiliares si la story es compleja
│   │                       ├── components.md       Para: Detalles de componentes React
│   │                       ├── api-details.md      Para: Lógica API compleja
│   │                       └── database-changes.md Para: Migrations complejas
│   │
│   ├── 📁 TAE/                            Para: FASE 7 - Test Automation Engineering
│   │   ├── README.md                      Para: Explicar TAE y workflow de uso
│   │   │
│   │   ├── 🤖 Archivos Estratégicos (generados con prompts):
│   │   ├── test-strategy.md               Para: Estrategia general de testing del proyecto
│   │   ├── kata-implementation-plan.md    Para: Plan de implementación de KATA framework
│   │   ├── automation-standards.md        Para: Estándares de código para tests
│   │   │
│   │   ├── 📚 Archivos de Referencia (documentación completa):
│   │   ├── kata-architecture.md           Para: Arquitectura KATA adaptada al proyecto
│   │   ├── test-data-management.md        Para: Gestión de datos de prueba (Faker, factories)
│   │   ├── tms-integration.md             Para: Integración con Xray Cloud o Jira Direct
│   │   ├── ci-cd-integration.md           Para: Configuración de GitHub Actions
│   │   │
│   │   └── 📋 Plantillas (llenar durante implementación):
│   │       ├── component-catalog.md       Para: Catalogar componentes implementados
│   │       └── atc-registry.md            Para: Registro de ATCs con trazabilidad a Jira
│   │
│   └── 📁 guidelines/                     Para: FASES 5-6 - System prompts para la IA
│       ├── README.md                      Para: Explicar guidelines
│       ├── implementation-workflow.md     Para: Workflow paso a paso de implementación
│       ├── code-standards.md              Para: DRY, naming, TypeScript strict
│       ├── error-handling.md              Para: NO hardcodear, error classes, logging
│       ├── context-loading.md             Para: Qué archivos leer en cada fase
│       ├── automation-workflow.md         Para: Testing automation con KATA
│       └── mcp-usage-tips.md              Para: Cuándo usar Supabase/Atlassian MCP
│
├── 📁 .prompts/                           Para: Prompts copy-paste para generar documentación
│   │
│   ├── 📄 README.md                       Para: Instrucciones de cómo usar los prompts
│   │
│   ├── 📁 fase-1-constitution/            Para: Generar docs de negocio
│   │   ├── business-model.md              Para: Prompt de Business Model Canvas
│   │   └── market-context.md              Para: Prompt de análisis de mercado
│   │
│   ├── 📁 fase-2-specification/           Para: Generar specs de producto
│   │   ├── prd-executive-summary.md       Para: Prompt de executive summary
│   │   ├── prd-user-personas.md           Para: Prompt de user personas
│   │   ├── prd-mvp-scope.md               Para: Prompt de épicas y stories
│   │   ├── prd-user-journeys.md           Para: Prompt de user journeys
│   │   ├── srs-functional-specs.md        Para: Prompt de FRs
│   │   ├── srs-non-functional-specs.md    Para: Prompt de NFRs
│   │   ├── srs-architecture-specs.md      Para: Prompt de arquitectura + C4
│   │   ├── srs-api-contracts.md           Para: Prompt de OpenAPI spec
│   │   └── pbi-product-backlog.md         Para: Prompt de epic-tree + stories
│   │
│   ├── 📁 fase-3-shift-left-testing/      Para: Generar docs de testing
│   │   ├── feature-test-plan.md           Para: Prompt de plan de pruebas (épica)
│   │   └── story-test-cases.md            Para: Prompt de test cases (story)
│   │
│   ├── 📁 fase-4-planning/                Para: Generar planes de implementación
│   │   ├── feature-implementation-plan.md Para: Prompt de plan técnico (épica)
│   │   └── story-implementation-plan.md   Para: Prompt de plan técnico (story)
│   │
│   └── 📁 fase-7-tae/                     Para: Generar docs de testing automation
│       ├── test-strategy.md               Para: Prompt de estrategia de testing
│       ├── kata-implementation-plan.md    Para: Prompt de plan KATA
│       └── automation-standards.md        Para: Prompt de estándares de tests
│
└── 📁 docs/                               Para: Documentación maestra del sistema
    ├── ai-driven-software-project-blueprint.md  Para: Blueprint completo (506 líneas)
    └── kata-test-architecture.md          Para: Documentación completa de KATA (1,874 líneas)
```

---

## 🎯 FLUJO DE TRABAJO COMPLETO

### 1️⃣ FASE 1: Constitution (Founder/Cliente)
```
Input: Idea de negocio
Usar: .prompts/fase-1-constitution/
Output: .context/idea/ (2-3 archivos)
```

### 2️⃣ FASE 2: Specification (PO/PM/BA)
```
Input: .context/idea/
Usar: .prompts/fase-2-specification/
Output:
  - .context/PRD/ (4 archivos)
  - .context/SRS/ (4 archivos)
  - .context/PBI/ (epic-tree + carpetas de épicas/stories)
```

### 3️⃣ FASE 3: Shift-Left Testing (QA)
```
Input: .context/PRD/ + .context/SRS/ + .context/PBI/
Usar: .prompts/fase-3-shift-left-testing/
Output:
  - .context/PBI/epics/EPIC-XXX/feature-test-plan.md
  - .context/PBI/epics/EPIC-XXX/stories/STORY-XXX/test-cases.md
```

### 4️⃣ FASE 4: Planning (Dev)
```
Input: .context/PBI/ + .context/SRS/
Usar: .prompts/fase-4-planning/
Output:
  - .context/PBI/epics/EPIC-XXX/feature-implementation-plan.md
  - .context/PBI/epics/EPIC-XXX/stories/STORY-XXX/implementation-plan.md
```

### 5️⃣ FASES 5-6: Implementation (Dev + IA)
```
Input: .context/PBI/epics/EPIC-XXX/stories/STORY-XXX/implementation-plan.md
Leer: .context/guidelines/ (TODOS los archivos)
Output: Código implementado
```

### 7️⃣ FASE 7: Test Automation Engineering (QA)
```
Input: .context/PRD/ + .context/SRS/ + .context/PBI/
Usar: .prompts/fase-7-tae/
Output:
  - .context/TAE/ (10 archivos: 3 generados + 4 reference + 2 plantillas + 1 README)
  - /tests/ (estructura de tests con KATA)
```

---

## 🔑 CONCEPTOS CLAVE

### 📝 Documentación vs Prompts

| Tipo | Ubicación | Propósito |
|------|-----------|-----------|
| **Documentación** | `.context/` | Información que la IA lee para trabajar |
| **Prompts** | `.prompts/` | Plantillas para GENERAR documentación en `.context/` |
| **Blueprints** | `docs/` | Documentación maestra del sistema completo |

### 🎭 Roles por Fase

| Fase | Rol | Input | Output |
|------|-----|-------|--------|
| 1 | Founder/Cliente | Idea | `.context/idea/` |
| 2 | PO/PM/BA | Idea | `.context/PRD/`, `.context/SRS/`, `.context/PBI/` |
| 3 | QA | PRD + SRS + PBI | Test plans + test cases |
| 4 | Dev | SRS + PBI | Implementation plans |
| 5-6 | Dev + IA | Implementation plans + guidelines | Código |
| 7 | QA | PRD + SRS + PBI | `.context/TAE/` + `/tests/` |

### 🏗️ Arquitectura Unificada (PBI)

**Beneficio clave**: Para trabajar en una story, la IA lee **UNA sola carpeta**.

```
.context/PBI/epics/EPIC-001-user-auth/stories/STORY-005-login/
├── story.md                    (Fase 2: Qué hacer)
├── test-cases.md               (Fase 3: Cómo probar)
└── implementation-plan.md      (Fase 4: Cómo implementar)
```

✅ **TODO en un lugar** → Sin duplicación → Context Engineering optimizado

---

## 📊 ESTADÍSTICAS

### Archivos Totales Creados

| Directorio | Archivos | Propósito |
|------------|----------|-----------|
| `.context/idea/` | 3-4 | Fase 1 |
| `.context/PRD/` | 4 | Fase 2 |
| `.context/SRS/` | 4 | Fase 2 |
| `.context/PBI/` | Variable | Fases 2-4 (depende de # épicas/stories) |
| `.context/TAE/` | 10 | Fase 7 |
| `.context/guidelines/` | 6 | Fases 5-6 |
| `.prompts/` | 18 | Generadores |
| `docs/` | 2 | Blueprints maestros |
| **TOTAL BASE** | **~47-50 archivos** | Sistema completo |

### Tamaños de Documentación

| Archivo | Líneas | Descripción |
|---------|--------|-------------|
| `ai-driven-software-project-blueprint.md` | 506 | Blueprint refactorizado (88% reducción) |
| `kata-test-architecture.md` | 1,874 | Documentación completa KATA |
| `.context/TAE/*` | ~2,500 | Docs de testing automation |
| `.prompts/*` | ~3,000 | Prompts optimizados |

---

## 🎯 PUNTOS CLAVE PARA RECORDAR

### ✅ DO's (Hacer)

1. **Seguir el orden secuencial** de fases (1 → 2 → 3 → 4 → 7)
2. **Usar prompts de `.prompts/`** para generar docs en `.context/`
3. **Leer guidelines** antes de implementar (Fases 5-6)
4. **Usar MCP tools** (Supabase, Atlassian) para datos reales
5. **Mantener arquitectura unificada** (todo en carpeta de story)

### ❌ DON'Ts (No hacer)

1. **NO hardcodear** SQL schemas (usar Supabase MCP)
2. **NO saltarse** fases (cada una depende de la anterior)
3. **NO duplicar** información (DRY always)
4. **NO mezclar** prompts con documentación
5. **NO crear** archivos innecesarios (solo si son críticos)

---

## 🚀 PRÓXIMOS PASOS

1. **Para nuevos proyectos**: Empezar con `.prompts/fase-1-constitution/`
2. **Para proyectos existentes**: Empezar con análisis legacy → `.context/idea/legacy-analysis.md`
3. **Para testing**: Usar `.prompts/fase-7-tae/` después de tener PRD/SRS/PBI
4. **Para implementación**: Leer `.context/guidelines/` + implementation plans

---

**💡 Este sistema es tu "segundo cerebro" para desarrollo de software impulsado por IA. Cada archivo tiene un propósito específico en el flujo de trabajo completo.**
