# FASES 2-4: Product Backlog Items (PBI)

Este directorio contiene el backlog completo del producto organizado por épicas y stories.

## 🏗️ Arquitectura Unificada

**Beneficio clave**: Para trabajar en una story, la IA lee **UNA sola carpeta**.

```
PBI/
├── epic-tree.md                    Vista high-level de todas las épicas
├── ALIGNMENT-REPORT.md             [Opcional] Mapeo PRD → Jira
└── epics/
    └── EPIC-{PROYECTO}-{NUM}-{nombre-descriptivo}/
        ├── epic.md                 [FASE 3] Descripción de la épica
        ├── feature-test-plan.md    [FASE 4] Plan de pruebas
        ├── feature-implementation-plan.md  [FASE 5] Plan técnico
        └── stories/
            └── STORY-{PROYECTO}-{NUM}-{nombre-descriptivo}/
                ├── story.md        [FASE 3] User story
                ├── test-cases.md   [FASE 4] Test cases
                └── implementation-plan.md  [FASE 5] Plan de implementación
```

**Ejemplo real:**

```
PBI/
├── epic-tree.md
└── epics/
    └── EPIC-MYM-13-mentor-discovery-search/
        ├── epic.md
        ├── feature-test-plan.md
        ├── feature-implementation-plan.md
        └── stories/
            ├── STORY-MYM-14-view-all-mentors/
            │   ├── story.md
            │   ├── test-cases.md
            │   └── implementation-plan.md
            ├── STORY-MYM-15-search-mentors-keyword/
            │   └── ...
            └── STORY-MYM-16-filter-mentors-skills/
                └── ...
```

## 📄 Archivos a generar

### FASE 3: Product Backlog Specification ⚡ **FLUJO JIRA-FIRST**

**IMPORTANTE:** Usa `.prompts/fase-3-specification/pbi-product-backlog.md` que trabaja con MCP de Atlassian.

**Primera ejecución (Planificación):**

- Genera `epic-tree.md` - Vista completa del backlog planificado

**Por cada épica (Incremental - Jira First → Local):**

1. **Jira:** Crea épica en Jira usando MCP → Obtén ID real (ej: MYM-13)
2. **Local:** Crea carpeta `epics/EPIC-MYM-13-nombre-descriptivo/`
3. **Local:** Crea archivo `epic.md` con datos completos
4. **Jira:** Crea todas las stories de la épica en Jira → Obtén IDs reales
5. **Local:** Crea carpetas `stories/STORY-MYM-14-nombre/` con `story.md`
6. **Local:** Actualiza `epic.md` con IDs reales de stories
7. ✅ Repite para siguiente épica

**Beneficio del flujo Jira-First:**

- Nomenclatura correcta desde el inicio (IDs reales de Jira en carpetas)
- No hay necesidad de sincronización posterior
- Trazabilidad perfecta: carpeta local ↔ Jira issue (1:1)

### FASE 4: Shift-Left Testing (QA)

**Por cada épica:**

- Usa `.prompts/fase-4-shift-left-testing/feature-test-plan.md`
- Genera `epics/EPIC-XXX/feature-test-plan.md`

**Por cada story:**

- Usa `.prompts/fase-4-shift-left-testing/story-test-cases.md`
- Genera `epics/EPIC-XXX/stories/STORY-XXX/test-cases.md`

### FASE 5: Planning (Dev)

**Por cada épica (una vez):**

- Usa `.prompts/fase-5-planning/feature-implementation-plan.md`
- Genera `epics/EPIC-XXX/feature-implementation-plan.md`

**Por cada story (antes de codear):**

- Usa `.prompts/fase-5-planning/story-implementation-plan.md`
- Genera `epics/EPIC-XXX/stories/STORY-XXX/implementation-plan.md`

## 🎯 Output esperado

Al completar todas las fases para una story tendrás:

- Definición clara (story.md)
- Test cases detallados (test-cases.md)
- Plan de implementación (implementation-plan.md)
- **TODO en una carpeta** → Context Engineering optimizado

## 📝 Nomenclatura de Carpetas

**IMPORTANTE:** Nomenclatura estándar usando IDs reales de Jira.

### Épicas

**Formato:** `EPIC-{PROYECTO}-{NUMERO}-{nombre-descriptivo}/`

**Componentes:**

- `{PROYECTO}`: Código del proyecto en Jira (ej: MYM, UPEX) - MAYÚSCULAS
- `{NUMERO}`: ID numérico de Jira sin ceros a la izquierda (ej: 2, 13, 28)
- `{nombre-descriptivo}`: 2-4 palabras en kebab-case, minúsculas, descriptivo

**Ejemplos válidos:**

- ✅ `EPIC-MYM-2-user-authentication-profiles/`
- ✅ `EPIC-MYM-13-mentor-discovery-search/`
- ✅ `EPIC-UPEX-45-payment-processing/`

**Ejemplos INVÁLIDOS:**

- ❌ `EPIC-001-user-auth/` (falta código proyecto)
- ❌ `EPIC_MYM_2_UserAuth/` (snake_case/CamelCase)
- ❌ `EPIC-MYM-002-auth/` (no usar ceros a la izquierda)
- ❌ `EPIC-MYM-2-user-authentication-and-comprehensive-profile-management-system/` (muy largo)

### Stories

**Formato:** `STORY-{PROYECTO}-{NUMERO}-{nombre-descriptivo}/`
(Mismas reglas que épicas)

**Ejemplos válidos:**

- ✅ `STORY-MYM-3-user-signup-email/`
- ✅ `STORY-MYM-14-view-all-mentors/`
- ✅ `STORY-UPEX-67-stripe-payment-integration/`

### Reglas Generales

- ✅ Usar kebab-case en nombres de carpetas (palabras separadas por guiones)
- ✅ IDs sin ceros a la izquierda (MYM-2, no MYM-002)
- ✅ Nombres concisos pero descriptivos (2-4 palabras)
- ❌ NO usar snake_case, CamelCase, o espacios
- ❌ NO usar caracteres especiales excepto guiones (-)
- ❌ NO inventar IDs, SIEMPRE usar IDs reales de Jira

**Nota:** El flujo Jira-First garantiza que siempre uses IDs correctos porque primero creas el issue en Jira, obtienes el ID, y luego creas la carpeta local.
