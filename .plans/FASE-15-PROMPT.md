# Fase 15 — Bootstrap Prompt para próxima sesión IA

> **Para la nueva sesión de IA**: este es tu kickoff. Leé este doc primero, después los referenciados al final, y arrancá Fase 15 con orquestación pura.

---

## Quién sos y qué hacés

Sos la IA que continúa el proyecto `ai-driven-project-starter` (rama `skills-migration`). Tu única misión esta sesión es **ejecutar la Fase 15** — el super-installer que combina gentle-ai como base + un installer propio del repo.

El usuario ya tomó todas las decisiones estratégicas. Vos NO re-discutís D1-D15. Las aplicás.

---

## Modo operativo (no negociable)

1. **Orquestación pura**. El hilo principal NO ejecuta tareas grandes — despacha subagentes con briefings quirúrgicos. Hilo principal solo: dispatch, recibo de reportes, decisiones, comunicación con user.
2. **Sin AI attribution** en commits (regla `Critical Reminder #4` de AGENTS.md).
3. **Sin push**. NUNCA push sin confirmación explícita del user (regla #5).
4. **Sin `--no-verify`**, sin `git rm -rf`, sin force push.
5. **Sin `&&` ni `;` en bash**. Cada comando individual.
6. **No descartar archivos** que el user pueda querer (templates/mcp/, .books/, etc.).
7. **Cada commit = una fase atómica** con mensaje descriptivo.

---

## Orden de lectura obligatorio (antes de hacer nada)

```
1. .plans/FASE-15-PROMPT.md          ← este doc
2. .plans/FASE-15-PLAN.md            ← plan ejecutivo detallado (LO MÁS IMPORTANTE)
3. .plans/HANDOFF.md                 ← contexto histórico de toda la migración (skipear las primeras secciones si hay tiempo limitado, pero leé los gotchas y la última sub-sesión 2026-05-09b)
4. .plans/GENTLE-AI-RESEARCH.md      ← catálogo del ecosistema gentle-ai (tablas 4 y 5 son las que importan)
5. AGENTS.md                         ← project memory; CLAUDE.md es symlink → AGENTS.md
6. .agents/README.md                 ← contrato del sistema de variables {{VAR}} y {{jira.*}}
```

NO leas todo el HANDOFF de un saque — usá las anclas de la "Quick navigation" del doc.

---

## Cosa que arregla pendiente del sub-bloque previo (LEER)

Durante 2026-05-09b se hicieron edits inocentes pero innecesarios en archivos que **se van a borrar en Fase 15 Phase C**:

- `.claude/skills/comment-writer/SKILL.md` (2 refs cambiadas a `/git-flow-master`)
- `.claude/skills/comment-writer/evals/evals.json` (1 ref)
- `.claude/skills/judgment-day/evals/evals.json` (1 ref)

**No los re-toques**. Borrá los 3 directorios completos en Phase C y los edits desaparecen con ellos. Lo mismo para `.claude/skills/cognitive-doc-design/` (no editada pero se borra igual).

---

## Inputs concretos para arrancar Phase A

Antes de despachar el subagente Plan, tenés estos datos **ya decididos** (no los re-confirmes):

- **Stack del repo**: Next.js + Supabase (locked)
- **Agentes soportados**: Claude Code + OpenCode (D14)
- **MCPs canónicos**: tavily, context7, supabase, n8n (D13)
- **CLIs externos a verificar**: vercel, supabase, acli, playwright, resend
- **15 skills a traer de gentle-ai** (lista exacta en FASE-15-PLAN.md §3)
- **Installer formato**: bun script CLI interactivo (D10)
- **gentle-ai relación**: quasi-must-have, no estricto (D9)
- **Instalación**: por args específicos, NO `--preset` (D11)

---

## Plan de phases (alto nivel)

```
Phase A — Diseño concreto         (1 subagent: Plan o sdd-propose)
Phase B — Build paralelo          (2-3 subagents en paralelo)
Phase C — Migración               (1 subagent: borrar borrowed + crear /agentic-dev-onboard)
Phase D — Verify + cierre         (1 subagent: smoke test + docs)
```

Detalle completo + briefings pre-escritos en `.plans/FASE-15-PLAN.md`.

---

## Cuándo PARAR y preguntar al user

- Si una decisión NO está cubierta por D1-D15 (ver `.plans/HANDOFF.md` "Decisiones locked")
- Antes de cualquier `git push`, `git remote add`, force op
- Antes de borrar archivos que NO estén en la "lista de cleanup colateral" del plan
- Si un subagente reporta blocker que no podés resolver

---

## Primera acción al recibir este prompt

1. Leé en orden los 6 docs de la sección "Orden de lectura"
2. Verificá `git log --oneline main..skills-migration | head -20` para confirmar último commit
3. Verificá `bun run lint:agents 2>&1 | tail -5` — debe dar **7 errors + 5 warnings** (baseline)
4. Saludá al user con un ACK breve: "Cargué el contexto. Listo para arrancar Fase 15 Phase A. ¿Confirmás que arranco?"

NO arranques nada hasta que el user confirme.

---

**Fecha del prompt**: 2026-05-09. **Última actualización del repo**: commit `4fd84d2`.
