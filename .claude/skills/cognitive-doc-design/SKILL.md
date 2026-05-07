---
name: cognitive-doc-design
description: "Reduce cognitive load in technical documentation through progressive disclosure, chunking, signposting, tables vs prose, and descriptive headings. Use when designing or revising any project doc (READMEs, design docs, runbooks, ADRs, post-mortems). Triggers on: 'diseñar este doc', 'make this doc scannable', 'reduce cognitive load', 'simplificar este doc', 'refactor this README', 'doc design', 'cognitive load too high', 'is this doc clear?'. Do NOT use for: code documentation generation (different skill), API reference auto-generation, OR rewriting marketing copy."
license: MIT
compatibility: [claude-code, copilot, cursor, codex, opencode]
phase: implementation
---

<!-- Model preferences (advisory; dispatchers may use to route) -->
<!--
model_preferences:
  foundation: opus       # high-leverage architectural work
  planning: sonnet       # structured writing
  implementation: sonnet # default for code work
  review: opus           # critical analysis
  archive: haiku         # mechanical close-out
-->

# Cognitive Doc Design — Make project docs scannable

Diseñá docs que el lector pueda escanear, entender y usar en el momento. La carga cognitiva es presupuesto: cada párrafo denso, cada heading vago, cada lista sin agrupar es token desperdiciado en la cabeza del reviewer. Este skill te da los patrones para gastarlo bien.

This skill is **structural** — no escribe contenido nuevo, no genera API docs, no inventa secciones. Toma un doc existente (o un draft tuyo) y aplica patrones de progressive disclosure, chunking y signposting para que el lector encuentre lo que necesita en segundos.

---

## When to use

Cargá este skill cuando:

- Estás escribiendo o revisando un README, ADR, runbook, post-mortem, design doc, o cualquier guía interna.
- Un doc existente "se siente largo" o el reviewer pide TL;DR.
- Necesitás que un onboarding sea consumible sin un humano al lado.
- Tenés que documentar un PR no trivial donde el reviewer va a pagar el costo cognitivo.

No lo uses para:

- Auto-generar referencia de API desde JSDoc / OpenAPI (eso es otra herramienta).
- Reescribir copy de marketing o landing pages.
- Generar código documentado a partir de specs.

---

## Critical Patterns

| Pattern                 | Rule                                                                                         |
| ----------------------- | -------------------------------------------------------------------------------------------- |
| Lead with the answer    | Poné la decisión, la acción, o el outcome primero. El contexto va después.                   |
| Progressive disclosure  | Empezá con el happy path. Después agregás detalles, edge cases, y referencias.               |
| Chunking                | Agrupá info relacionada en secciones chicas. Listas planas: 5±2 ítems máximo.                |
| Signposting             | Headings descriptivos, callouts, y resúmenes para que el lector siempre sepa dónde está.     |
| Recognition over recall | Tablas, checklists, ejemplos y plantillas le ganan a prosa que el lector tiene que recordar. |
| Descriptive headings    | "Why this matters" le gana a "Section 3". El heading es el TOC del cerebro del lector.       |
| Review empathy          | El doc tiene que dejar verificar la intención sin reconstruir toda la historia.              |

---

## Documentation Shape

Usá esta estructura por default cuando no haya un template del repo:

```markdown
# <Outcome-oriented title>

<One paragraph: what changed, who it helps, and why it matters.>

## Quick path

1. <First action>
2. <Second action>
3. <Verification or expected result>

## Details

| Topic  | Decision              |
| ------ | --------------------- |
| <area> | <concise explanation> |

## Checklist

- [ ] <Reader can confirm this>
- [ ] <Reader can confirm that>

## Next step

<Link or action that continues the workflow.>
```

---

## Tables vs prose

Cuándo gana una tabla:

- Comparás 3+ opciones en 2+ dimensiones.
- El lector va a volver a buscar un valor puntual.
- La info es paralela (mismo tipo de dato por fila).

Cuándo gana la prosa:

- Hay una narrativa o secuencia con causalidad.
- Una sola decisión con justificación larga (un ADR clásico).
- El detalle no es escaneable en celda — necesita oraciones completas.

Si dudás, probá la tabla primero. Si forzás celdas con párrafos largos, volvé a prosa.

---

## Anti-patterns

Evitá:

- **Walls of prose** sin headings ni listas — el lector pierde el lugar y abandona.
- **Deep nesting** (`####` y más profundo) — si necesitás `####`, el doc probablemente quiere ser dos docs.
- **Vague headings** ("Overview", "More info", "Notes") — no anclan nada en la memoria.
- **Listas indiferenciadas** de 15+ ítems sin agrupar — es ruido, no señal.
- **Front-loading de contexto** — si el lector tiene que leer 4 párrafos antes de saber qué hace el sistema, el doc está mal ordenado.
- **Conditionals mezclados con happy path** — separá "casi siempre hacés esto" de "si pasa X, hacés esto otro".

---

## PR and Review Docs

Cuando documentás un PR, bajale carga al reviewer:

- Decí qué revisar primero (el archivo o cambio crítico).
- Decí qué está intencionalmente fuera de scope.
- Linkeá el PR previo y el siguiente cuando hay cadena.
- Cada sección apunta a una decisión o unidad de trabajo.
- Usá checklists para criterios de aceptación y verificación.

---

## Workflow when revising a doc

1. **Leer el doc completo una vez** sin tocar nada. Notá dónde te perdiste.
2. **Identificar la promesa** — ¿qué pregunta resuelve este doc? Si no podés contestar en una oración, el doc no tiene foco todavía.
3. **Agrupar contenido** en bloques de 5±2 ítems. Cada bloque, un heading descriptivo.
4. **Lead-with-answer pass** — para cada sección, ¿la primera oración es la respuesta o el contexto? Si es contexto, reordenalo.
5. **Tablas vs prosa pass** — buscá cualquier comparación o enumeración paralela y candidateala a tabla.
6. **Anti-patterns pass** — buscá walls of prose, vague headings, deep nesting, listas indiferenciadas.
7. **Final scan test** — leé solo los headings y las primeras oraciones de cada sección. Si esa lectura cuenta la historia completa, el doc está scannable.

---

## Commands

```bash
# Check markdown files changed in the current branch
git diff --name-only -- '*.md'

# Inspect PR changed-line count for cognitive load
gh pr view <PR_NUMBER> --json additions,deletions,changedFiles
```

---

## Output format

Cuando aplicás este skill sobre un doc existente, devolvé:

1. **Diagnóstico breve** — 3-5 bullets nombrando los anti-patterns que encontraste.
2. **Doc revisado** — el doc reescrito siguiendo la shape de arriba.
3. **Notas de decisión** — cualquier sección que cortaste, fusionaste, o promoviste a tabla, con una línea de justificación.
