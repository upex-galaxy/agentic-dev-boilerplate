# US Development Workflow

> **Propósito:** Guía completa para desarrollar User Stories desde diagnóstico hasta deploy.
> Este es el ÚNICO archivo que necesitas para sesiones de desarrollo de US.

---

## REGLA CRÍTICA: Lectura de Prompts

Cuando este workflow te indique leer un prompt (ej: `.prompts/fase-7-implementation/implement-story.md`):

1. **LEE EL PROMPT COMPLETO** antes de ejecutar cualquier acción
2. **SIGUE LAS INSTRUCCIONES** del prompt al pie de la letra
3. Si el prompt referencia otros archivos de contexto, **LÉELOS TAMBIÉN**
4. **NO ASUMAS** - cada prompt tiene instrucciones específicas que DEBES seguir
5. **VUELVE A ESTE WORKFLOW** después de completar lo que indica el prompt

```
⚠️ La cadena de lectura puede ser:
   workflow → prompt fase X → contexto A → contexto B

   Sigue la cadena completa. No te saltes archivos.
```

---

## FASE 1: DIAGNÓSTICO INICIAL

### Detección de Modo de Sesión

**Primero, determina en qué modo estás:**

| Modo | Condición | Acción |
|------|-----------|--------|
| **A: Nueva** | No hay Resumen de Progreso adjunto | Ir a "Diagnóstico Automático" |
| **B: Reanudación** | Usuario adjuntó Resumen de Progreso | Ir a "Reanudación de Sesión" (al final) |

---

### Diagnóstico Automático

**Ejecuta este checklist EN ORDEN:**

#### Paso D1: Verificar Shift-Left Testing

**Buscar:** `.context/PBI/epics/EPIC-MYM-{N}-*/stories/STORY-MYM-{N}-*/test-cases.md`

| Estado | Acción |
|--------|--------|
| **NO existe** | ⛔ STOP. Informar: "Debe ejecutar Shift-Left Testing primero con `.prompts/fase-5-shift-left-testing/story-test-cases.md`". NO continuar. |
| **SÍ existe** | ✅ Continuar a Paso D2 |

#### Paso D2: Verificar Feature Implementation Plan

**Buscar:** `.context/PBI/epics/EPIC-MYM-{N}-*/feature-implementation-plan.md`

| Estado | Acción |
|--------|--------|
| **NO existe** | 📝 Leer y ejecutar `.prompts/fase-6-planning/feature-implementation-plan.md`. Commit. Generar Resumen de Progreso. FIN de sesión. |
| **SÍ existe** | ✅ Continuar a Paso D3 |

#### Paso D3: Verificar Story Implementation Plan

**Buscar:** `.context/PBI/epics/EPIC-MYM-{N}-*/stories/STORY-MYM-{N}-*/implementation-plan.md`

| Estado | Acción |
|--------|--------|
| **NO existe** | 📝 Leer y ejecutar `.prompts/fase-6-planning/story-implementation-plan.md`. Commit. Generar Resumen de Progreso. FIN de sesión. |
| **SÍ existe** | ✅ Continuar a FASE 2: Los 11 Pasos |

---

### Reportar Estado Detectado

Después del diagnóstico, muestra:

```markdown
## Estado Detectado

**Epic:** EPIC-MYM-{N} - {nombre}
**Story:** MYM-{N} - {nombre}

**Checklist:**
- [x] Shift-Left Testing: Existe
- [x] Feature Implementation Plan: Existe
- [x] Story Implementation Plan: Existe

**Siguiente Acción:** Ejecutar los 11 pasos del workflow
**Paso inicial:** Paso 1 - Verificar Status en Jira
```

---

## FASE 2: LOS 11 PASOS DEL WORKFLOW

```
⚠️ EJECUTA ESTOS PASOS EN ORDEN. NO TE SALTES NINGUNO.
```

---

### PASO 1: Verificar Status en Jira

**Objetivo:** Asegurar que la US está lista para trabajar.

**Acciones:**
1. Obtener detalles con `mcp__atlassian__getJiraIssue`
2. Verificar status = `Ready For Dev`
3. Transitar a `In Progress` con `mcp__atlassian__transitionJiraIssue`

**Criterio de éxito:** ✅ US en Jira con status `In Progress`

---

### PASO 2: Crear Rama y Leer Plan

**Objetivo:** Preparar entorno de desarrollo.

**Acciones:**
1. Crear rama: `git checkout -b feat/MYM-{N}/{short-name}`
2. Leer el `implementation-plan.md` de la story
3. Entender los steps que vas a implementar

**Criterio de éxito:** ✅ Rama creada, plan leído y entendido

---

### PASO 3: Implementar (Fase 7)

```
⚠️ CRÍTICO: LEE EL PROMPT COMPLETO ANTES DE IMPLEMENTAR
```

**Prompt a leer:** `.prompts/fase-7-implementation/implement-story.md`

**Acciones:**
1. **LEE** el prompt completo de implementación
2. **LEE** los archivos de contexto que indica el prompt:
   - `.context/design-system.md` (si hay UI)
   - `.context/guidelines/code-standards.md`
   - `.context/backend-setup.md` (si aplica)
3. **IMPLEMENTA** siguiendo los steps del `implementation-plan.md`
4. Verifica: `bun run lint && bun run build`
5. Commits atómicos por cada step completado

**Criterio de éxito:** ✅ Código implementado, lint y build pasan

---

### PASO 4: Git Flow y Crear PR

**Prompt de referencia:** `.prompts/git-flow.md`

**Acciones:**
1. Push de la rama: `git push -u origin feat/MYM-{N}/{short-name}`
2. Crear PR con `gh pr create`:
   ```bash
   gh pr create --base staging --title "feat(MYM-{N}): {descripción}" --body "..."
   ```
3. Guardar URL del PR creado

**Criterio de éxito:** ✅ PR creado apuntando a staging

---

### PASO 5: Verificar Transición Automática

**Objetivo:** Confirmar que Jira detectó el PR.

**Acciones:**
1. Esperar ~30 segundos
2. Verificar status con `mcp__atlassian__getJiraIssue`
3. Status debería ser `In Review` automáticamente

**Si NO cambió:** Informar al usuario que la automation no funcionó.

**Criterio de éxito:** ✅ US en Jira con status `In Review`

---

### PASO 6: Code Review (Fase 8)

```
⚠️ CRÍTICO: LEE EL PROMPT DE REVIEW COMPLETO
```

**Prompt a leer:** `.prompts/fase-8-code-review/review-pr.md`

**Acciones:**
1. **LEE** el prompt completo de code review
2. Revisar código con el checklist del prompt:
   - Acceptance Criteria cumplidos
   - Lint y build pasan
   - Code standards respetados
   - Security checks
   - UI/UX según design system
3. Si hay issues: corregir, push, re-verificar

**Criterio de éxito:** ✅ Code review aprobado, todos los checks pasan

---

### PASO 7: Merge del PR

**Acciones:**
1. Verificar todos los checks en verde
2. Mergear: `gh pr merge {PR_NUMBER} --squash`
3. Eliminar rama local: `git checkout staging && git branch -d feat/MYM-{N}/{short-name}`

**Criterio de éxito:** ✅ PR mergeado

---

### PASO 8: Verificar Transición a Ready For QA

**Acciones:**
1. Esperar ~30 segundos
2. Verificar status con `mcp__atlassian__getJiraIssue`
3. Status debería ser `Ready For QA` automáticamente

**Si NO cambió:** Informar al usuario.

**Criterio de éxito:** ✅ US en Jira con status `Ready For QA`

---

### PASO 9: Notificar en Jira

**Acciones:**
1. Agregar comentario con `mcp__atlassian__addCommentToJiraIssue`:

```
Feature implementada y desplegada en staging.

PR: [URL del PR]
Branch: feat/MYM-{N}/{short-name}

La funcionalidad está lista para pruebas en staging.
```

**Criterio de éxito:** ✅ Comentario agregado

---

### PASO 10: Actualizar Documentación

```
⚠️ CRÍTICO: Esto debe hacerse ANTES del merge o en un PR separado
```

**Archivos a actualizar:**
1. `.context/PRD/shift-left-status-report.md`:
   - Marcar implementation plan como completado
   - Actualizar estado del PR
   - Actualizar contadores

2. `.context/PRD/release-notes.md` (opcional):
   ```markdown
   #### MYM-{N}: {Título}
   - **Epic:** EPIC-MYM-{N}
   - **PR:** #{número}
   - **Cambios:** {lista de cambios}
   ```

**Criterio de éxito:** ✅ Documentación actualizada

---

### PASO 11: Sincronizar y Preparar Siguiente

**Acciones:**
1. Actualizar staging local:
   ```bash
   git checkout staging && git pull origin staging
   ```
2. Verificar merge: `git log --oneline -3`
3. Esperar instrucciones del usuario sobre siguiente US

**Criterio de éxito:** ✅ Staging actualizado, listo para siguiente US

---

## FASE 3: REANUDACIÓN DE SESIÓN

**Solo si el usuario adjuntó un Resumen de Progreso.**

### Paso R1: Verificar Progreso

```bash
git log --oneline -5
git status
git branch --show-current
```

Lee los archivos mencionados en el resumen para confirmar que existen.

### Paso R2: Validar Alineación

Compara el resumen con:
1. El `implementation-plan.md` → ¿Los steps coinciden?
2. Los archivos reales → ¿El código existe?

**Si hay discrepancias:**
```
⚠️ Detecté diferencias entre el resumen y el estado actual:
- Resumen dice: {X}
- Estado real: {Y}

Continuando basándome en el estado real.
```

### Paso R3: Continuar

```markdown
## Reanudación Verificada

**Progreso confirmado:** [lista de lo completado]
**Continuando desde:** Paso {N} - {descripción}
**Próxima acción:** {qué voy a hacer}
```

---

## FASE 4: RESUMEN DE PROGRESO

### Cuándo Generarlo

Genera resumen automáticamente al:
- ✅ Completar un `implementation-plan.md`
- ✅ Completar cada Step del plan durante implementación
- ✅ Usuario escribe: `resumen`, `pausa`, `guardar progreso`

### Template

```markdown
## Resumen de Progreso

**Sesión:** {fecha aproximada}
**Epic:** EPIC-MYM-{N} - {nombre}
**Story:** MYM-{N} - {nombre}

### Estado del Workflow
- **Paso actual:** {número y nombre}
- **Fase actual:** {5/6/7/8}

### Progreso Completado
- [x] {tarea 1}
- [x] {tarea 2}

### Archivos Creados/Modificados
| Archivo | Estado | Descripción |
|---------|--------|-------------|
| `{ruta}` | Creado | {descripción} |

### Commits Realizados
- `{hash}`: {mensaje}

### Tarea en Progreso
**Qué estaba haciendo:** {descripción}
**Siguiente acción:** {qué hacer}

### Contexto Crítico
{decisiones técnicas, problemas resueltos, dependencias}

### Verificación Rápida
1. `git log --oneline -5`
2. `git status`
3. Leer `{archivo clave}`
```

---

## REFERENCIAS RÁPIDAS

### MCPs Disponibles

| MCP | Uso |
|-----|-----|
| **Atlassian** | Jira (issues, transiciones, comentarios) |
| **Supabase** | Backend (DB, migraciones, queries) |
| **Context7** | Documentación actualizada de librerías |
| **shadcn** | Componentes UI |

### Configuración

- **Jira CloudID:** `348c51d9-ae78-4544-b33e-4ee8e89a7534`
- **Jira Project:** `MYM`
- **Supabase ProjectID:** `ionevzckjyxtpmyenbxc`

### Archivos de Contexto por Fase

| Fase | Archivos a Leer |
|------|-----------------|
| **Planificación** | `story.md`, `test-cases.md`, `epic.md` |
| **Implementación** | `implementation-plan.md`, `design-system.md`, `code-standards.md` |
| **Code Review** | `code-standards.md`, `data-testid-standards.md` |

---

## REGLAS IMPORTANTES

1. **LEE los prompts completos** - No asumas, cada prompt tiene instrucciones específicas
2. **Sigue la cadena de contexto** - Si un prompt referencia otro archivo, léelo
3. **Commits atómicos** - Un commit por step o cambio lógico
4. **Verifica siempre** - Lint y build antes de push
5. **No asumas estados** - Verifica Jira, no confíes en automations
6. **Documenta progreso** - Genera resumen en cada hito

---

**Versión:** 2.0 (fusionado)
**Última actualización:** 2025-12-05
