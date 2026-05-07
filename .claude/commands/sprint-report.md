---
description: Generate a sprint progress report — epics + stories + PRs, focused on development progress
---

# Sprint Report

> **Propósito**: Generar un reporte visual del estado actual del Sprint y Backlog desde una perspectiva de desarrollo / PM (épicas, historias, PRs).
> **Herramienta**: `[ISSUE_TRACKER_TOOL]` (+ `gh` para PRs)
> **Output**: Reporte markdown con épicas, historias y PRs agrupados por estado.

---

## Prerequisitos

- MCP de Atlassian configurado y conectado
- Acceso al proyecto en Jira
- Conocer el código del proyecto (ej: `SQ`, `PROJ`, `APP`)
- (Opcional) `gh` autenticado para incluir estado de PRs

---

## Input Requerido

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ PARÁMETROS DEL REPORTE                                                       │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│ Proyecto:        _________________________________ (ej: SQ, PROJ)           │
│                                                                             │
│ Tipo de Reporte: ○ Sprint Activo   ○ Backlog Completo   ○ Ambos            │
│                                                                             │
│ Filtros Opcionales:                                                         │
│ ─────────────────────────────────────────────────────────────────────────  │
│ Sprint:          _________________________________ (ej: "Sprint 5")         │
│ Assignee:        _________________________________ (ej: "Juan Perez")       │
│ Epic:            _________________________________ (ej: "PROJ-100")         │
│                                                                             │
│ Incluir PRs:     ○ Sí (requiere gh)   ○ No                                 │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Workflow

### Paso 0: Descubrir Tipos de Issues del Proyecto (Dinámico)

**IMPORTANTE**: Antes de hacer las consultas principales, descubrir qué tipos de issues existen en el proyecto:

```
Use [ISSUE_TRACKER_TOOL] to search issues:
  jql: "project = {PROJECT} ORDER BY created DESC"
  limit: 1
  fields: "issuetype"
```

**Tipos relevantes para reporte de desarrollo:**

| Tipo            | Descripción                        | Incluir en Reporte |
| --------------- | ---------------------------------- | ------------------ |
| **Epic**        | Épicas (contenedores de historias) | ✅ Siempre         |
| **Story**       | Funcionalidades de usuario         | ✅ Siempre         |
| **Improvement** | Mejoras técnicas / deuda técnica   | ✅ Si existe       |
| **Task**        | Tareas técnicas                    | ⚪ Opcional        |

### Paso 1: Obtener Épicas del Sprint / Proyecto

```
Use [ISSUE_TRACKER_TOOL] to search issues:
  jql: "project = {PROJECT} AND issuetype = Epic AND status NOT IN (Done, Closed, Cancelled) ORDER BY priority DESC, created ASC"
  limit: 50
  fields: "summary,status,priority,assignee"
```

### Paso 2: Obtener Historias del Sprint Activo

Ejecutar búsqueda JQL incluyendo los tipos relevantes para desarrollo:

```
Use [ISSUE_TRACKER_TOOL] to search issues:
  jql: "project = {PROJECT} AND issuetype IN (Story, Improvement, Task) AND status NOT IN (Done, Closed, Cancelled) ORDER BY status ASC, priority DESC"
  limit: 100
  fields: "summary,status,priority,assignee,issuetype,parent"
```

### Paso 3: Obtener Issues del Backlog (si aplica)

```
Use [ISSUE_TRACKER_TOOL] to search issues:
  jql: "project = {PROJECT} AND issuetype IN (Story, Improvement, Task) AND status IN (Backlog, 'To Do', Open) ORDER BY priority DESC, created ASC"
  limit: 100
  fields: "summary,status,priority,assignee,issuetype,parent"
```

### Paso 4 (Opcional): Obtener Estado de PRs

Si el usuario solicitó incluir PRs y `gh` está disponible:

```bash
# PRs abiertos
gh pr list --state open --json number,title,headRefName,author,isDraft,reviewDecision,labels

# PRs recientemente mergeados (última semana)
gh pr list --state merged --search "merged:>=$(date -d '7 days ago' +%Y-%m-%d)" --json number,title,mergedAt,author
```

Cruzar el `headRefName` con el ticket (ej. `feature/PROJ-123-...`) para asociar cada PR a su historia.

### Paso 5: Procesar y Agrupar Resultados

Agrupar los issues por **status** desde una perspectiva de desarrollo:

**Orden de Status (prioridad de atención):**

1. **BLOCKED** (crítico - requiere atención inmediata)
2. **In Progress** (desarrollo activo)
3. **In Review** (PR abierto)
4. **Ready For Dev** (listo para desarrollo)
5. **To Do / Backlog** (pendientes)
6. **Done** (completadas)

**Iconos por Tipo de Issue:**

| Tipo        | Icono |
| ----------- | ----- |
| Epic        | 🎯    |
| Story       | 📗    |
| Improvement | 💡    |
| Task        | 📋    |

---

## Template de Output

Generar el siguiente reporte en formato markdown:

```markdown
# 📋 Sprint Report - {PROJECT}

**Fecha:** {fecha_actual}
**Sprint:** {sprint_name} (si aplica)

---

## 🎯 Épicas Activas ({count})

| Key   | Epic      | Status   | Stories totales | Stories Done | Progreso |
| ----- | --------- | -------- | --------------- | ------------ | -------- |
| {key} | {summary} | {status} | {n}             | {n}          | {%}      |

---

## 🔴 BLOCKED ({count})

{Si hay items bloqueados, mostrar tabla. Si no: "No hay issues bloqueados actualmente ✅"}

| Type     | Key   | Summary   | Priority   | Assignee   | Epic       |
| -------- | ----- | --------- | ---------- | ---------- | ---------- |
| 📗 Story | {key} | {summary} | {priority} | {assignee} | {epic-key} |

---

## 🟡 In Progress ({count})

| Type          | Key   | Summary   | Priority   | Assignee   | Epic       | PR      |
| ------------- | ----- | --------- | ---------- | ---------- | ---------- | ------- |
| {icon} {type} | {key} | {summary} | {priority} | {assignee} | {epic-key} | {pr#/–} |

---

## 🔵 In Review ({count})

> Historias con PR abierto

| Type          | Key   | Summary   | Assignee   | PR    | Review Status                                    |
| ------------- | ----- | --------- | ---------- | ----- | ------------------------------------------------ |
| {icon} {type} | {key} | {summary} | {assignee} | #{pr} | {APPROVED / CHANGES_REQUESTED / REVIEW_REQUIRED} |

---

## 🟦 Ready For Dev ({count})

| Type          | Key   | Summary   | Priority   | Assignee   | Epic       |
| ------------- | ----- | --------- | ---------- | ---------- | ---------- |
| {icon} {type} | {key} | {summary} | {priority} | {assignee} | {epic-key} |

---

## 📦 Backlog / To Do ({count})

> Pendientes de priorización o de empezar

| Type          | Key   | Summary   | Priority   | Assignee   | Epic       |
| ------------- | ----- | --------- | ---------- | ---------- | ---------- |
| {icon} {type} | {key} | {summary} | {priority} | {assignee} | {epic-key} |

---

## ✅ Done en este Sprint ({count})

| Type          | Key   | Summary   | Assignee   | Mergeado        |
| ------------- | ----- | --------- | ---------- | --------------- |
| {icon} {type} | {key} | {summary} | {assignee} | {pr-merge-date} |

---

## 📊 Resumen por Status

| Status        | Stories | Improvements | Tasks   | Total             |
| ------------- | ------- | ------------ | ------- | ----------------- |
| BLOCKED       | {n}     | {n}          | {n}     | {total}           |
| In Progress   | {n}     | {n}          | {n}     | {total}           |
| In Review     | {n}     | {n}          | {n}     | {total}           |
| Ready For Dev | {n}     | {n}          | {n}     | {total}           |
| Backlog       | {n}     | {n}          | {n}     | {total}           |
| Done          | {n}     | {n}          | {n}     | {total}           |
| **Total**     | **{n}** | **{n}**      | **{n}** | **{grand_total}** |

---

## 📈 Resumen por Épica

| Epic          | Stories totales | In Progress | In Review | Done | Progreso |
| ------------- | --------------- | ----------- | --------- | ---- | -------- |
| 🎯 {epic-key} | {n}             | {n}         | {n}       | {n}  | {%}      |

---

## 🔀 PRs (si se solicitó)

### Abiertos

| PR   | Title   | Author   | Branch   | Ticket   | Review     | Draft?   |
| ---- | ------- | -------- | -------- | -------- | ---------- | -------- |
| #{n} | {title} | {author} | {branch} | {ticket} | {decision} | {Yes/No} |

### Mergeados Recientemente

| PR   | Title   | Author   | Mergeado | Ticket   |
| ---- | ------- | -------- | -------- | -------- |
| #{n} | {title} | {author} | {date}   | {ticket} |

---

## 🎯 Métricas Clave

| Métrica                   | Valor                           |
| ------------------------- | ------------------------------- |
| **Issues Bloqueados**     | {blocked_count} {⚠️ si > 0}     |
| **Stories en desarrollo** | {in_progress_count}             |
| **PRs abiertos**          | {open_pr_count}                 |
| **PRs esperando review**  | {review_required_count}         |
| **Stories completadas**   | {done_count}                    |
| **Progreso del Sprint**   | {(done / total_sprint) \* 100}% |

---

## ⚠️ Alertas

### Bloqueos Activos

{Si hay BLOCKED: listar con tipo y razón del bloqueo}

### Historias In Progress sin PR

{Si hay stories In Progress sin un PR asociado por más de N días: listar}

### PRs sin revisión

{Si hay PRs abiertos sin reviewers asignados o sin actividad: listar}

### Issues sin Assignee

{Si hay issues sin assignee en estados activos: listar}
```

---

## Consultas JQL de Referencia

### Sprint Activo - Historias y Tareas

```jql
project = {PROJECT}
AND issuetype IN (Story, Improvement, Task)
AND sprint in openSprints()
ORDER BY status ASC, priority DESC
```

### Épicas Activas

```jql
project = {PROJECT}
AND issuetype = Epic
AND status NOT IN (Done, Closed, Cancelled)
ORDER BY priority DESC
```

### Historias por Épica

```jql
project = {PROJECT}
AND issuetype = Story
AND parent = {EPIC-KEY}
ORDER BY status ASC, priority DESC
```

### Issues Bloqueados

```jql
project = {PROJECT}
AND issuetype IN (Story, Improvement, Task)
AND status = "BLOCKED"
ORDER BY priority DESC
```

### Issues sin Assignee (Activos)

```jql
project = {PROJECT}
AND issuetype IN (Story, Improvement, Task)
AND assignee IS EMPTY
AND status NOT IN (Backlog, Done, Closed)
ORDER BY priority DESC
```

### Improvements Pendientes (Deuda Técnica)

```jql
project = {PROJECT}
AND issuetype = Improvement
AND status NOT IN (Done, Closed)
ORDER BY priority DESC
```

---

## Adaptación del Workflow

### Tipos de Issues por Proyecto

Algunos proyectos usan nombres diferentes. Adaptar según el proyecto:

| Tipo Estándar | Alternativas Comunes                  |
| ------------- | ------------------------------------- |
| Epic          | Initiative, Theme                     |
| Story         | User Story, Historia, Feature         |
| Improvement   | Enhancement, Technical Debt, Refactor |
| Task          | Technical Task, Dev Task, Spike       |

### Detección Automática de Tipos

Si no estás seguro de qué tipos existen, usar esta consulta para descubrirlos:

```jql
project = {PROJECT} ORDER BY created DESC
```

Y observar el campo `issuetype` en los resultados.

---

## Ejemplo de Ejecución

### Input

```
Proyecto: SQ
Tipo: Sprint Activo + Backlog
Incluir PRs: Sí
```

### Llamadas

```
// Paso 1: Épicas activas
Use [ISSUE_TRACKER_TOOL] to search issues:
  jql: "project = SQ AND issuetype = Epic AND status NOT IN (Done, Closed, Cancelled) ORDER BY priority DESC"
  limit: 50
  fields: "summary,status,priority,assignee"

// Paso 2: Historias activas (todos los tipos dev)
Use [ISSUE_TRACKER_TOOL] to search issues:
  jql: "project = SQ AND issuetype IN (Story, Improvement, Task) AND status NOT IN (Done, Closed, Cancelled) ORDER BY status ASC, priority DESC"
  limit: 100
  fields: "summary,status,priority,assignee,issuetype,parent"

// Paso 3: Backlog
Use [ISSUE_TRACKER_TOOL] to search issues:
  jql: "project = SQ AND issuetype IN (Story, Improvement, Task) AND status IN (Backlog, 'To Do', Open) ORDER BY priority DESC"
  limit: 100
  fields: "summary,status,priority,assignee,issuetype,parent"

// Paso 4: PRs abiertos (vía gh)
gh pr list --state open --json number,title,headRefName,author,isDraft,reviewDecision
```

### Output Esperado

```markdown
# 📋 Sprint Report - SQ

**Fecha:** 2026-03-10
**Sprint:** Sprint 5

---

## 🎯 Épicas Activas (2)

| Key       | Epic          | Status      | Stories totales | Stories Done | Progreso |
| --------- | ------------- | ----------- | --------------- | ------------ | -------- |
| 🎯 SQ-100 | Onboarding    | In Progress | 8               | 3            | 38%      |
| 🎯 SQ-150 | Auth refactor | In Progress | 5               | 1            | 20%      |

---

## 🔴 BLOCKED (0)

No hay issues bloqueados actualmente ✅

---

## 🟡 In Progress (3)

| Type           | Key    | Summary           | Priority | Assignee         | Epic   | PR  |
| -------------- | ------ | ----------------- | -------- | ---------------- | ------ | --- |
| 📗 Story       | SQ-2   | User Registration | Highest  | Samuel Amonzabel | SQ-100 | #42 |
| 📗 Story       | SQ-4   | Password Recovery | High     | Maxe Aguilera    | SQ-100 | –   |
| 💡 Improvement | SQ-101 | Optimize queries  | Medium   | Dev Team         | SQ-150 | –   |

---

## 🔵 In Review (2)

| Type     | Key  | Summary           | Assignee         | PR  | Review Status     |
| -------- | ---- | ----------------- | ---------------- | --- | ----------------- |
| 📗 Story | SQ-2 | User Registration | Samuel Amonzabel | #42 | APPROVED          |
| 📗 Story | SQ-7 | Login flow        | Ana Garcia       | #45 | CHANGES_REQUESTED |

---

## 📊 Resumen por Status

| Status      | Stories | Improvements | Tasks | Total  |
| ----------- | ------- | ------------ | ----- | ------ |
| BLOCKED     | 0       | 0            | 0     | 0      |
| In Progress | 2       | 1            | 0     | 3      |
| In Review   | 2       | 0            | 0     | 2      |
| Backlog     | 18      | 4            | 2     | 24     |
| Done        | 4       | 1            | 0     | 5      |
| **Total**   | **26**  | **6**        | **2** | **34** |

---

## ⚠️ Alertas

### Historias In Progress sin PR

- 📗 **SQ-4** - Password Recovery (asignada hace 5 días, sin PR aún)

### PRs sin revisión

- #45 - Login flow (open hace 3 días sin reviewers)
```

---

## Variantes del Reporte

### Reporte Solo Épicas + Progreso

```jql
project = {PROJECT}
AND issuetype = Epic
AND status NOT IN (Done, Closed)
ORDER BY priority DESC
```

### Reporte Solo Historias

```jql
project = {PROJECT}
AND issuetype = Story
AND status NOT IN (Done, Closed)
ORDER BY status ASC, priority DESC
```

### Reporte de Deuda Técnica

```jql
project = {PROJECT}
AND issuetype = Improvement
AND status NOT IN (Done, Closed)
ORDER BY priority DESC
```

### Reporte Rápido (Solo Métricas)

```markdown
## 📊 Sprint Status - {PROJECT}

| Métrica            | Valor |
| ------------------ | ----- |
| 🔴 Bloqueados      | 1 ⚠️  |
| 📗 Stories Activas | 16    |
| 🔀 PRs abiertos    | 6     |
| ✅ Completados     | 9     |
| 📈 Progreso        | 36%   |
```

---

## Siguiente Paso

Después de generar el reporte:

- **Si hay BLOCKED**: Investigar y resolver bloqueos inmediatamente
- **Si hay PRs abiertos sin actividad**: Empujar revisiones / reasignar reviewers
- **Si Stories In Progress sin PR > N días**: Hacer follow-up con el assignee
- **Si hay issues sin assignee**: Asignar responsables
- **Si Backlog crece sin priorizar**: Sesión de refinamiento

---

**Versión**: 2.0
**Última Actualización**: 2026-05-07
