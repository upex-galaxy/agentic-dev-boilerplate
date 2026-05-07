---
name: comment-writer
description: "Write warm, direct, human PR/issue comments and review feedback. Style: Rioplatense voseo for ES, neutral professional for EN; no em-dashes; concrete and concise; no AI-tells. Use for: review comments on PRs, issue triage notes, replies to teammates, code review feedback. Triggers on: 'escribir comentario para este PR', 'comentario para issue', 'review comment', 'responder a este comentario', 'redactar la respuesta', 'how should I word this PR comment?'. Do NOT use for: commit messages (different convention, see /git-flow), formal documentation (use cognitive-doc-design), or external customer-facing copy."
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

# Comment Writer — Warm, direct, human PR/issue comments

Escribí comentarios que suenen a un compañero atento, no a un bot corporativo. Útiles, breves, accionables. Si el thread está en español, voseo Rioplatense (`podés`, `tenés`, `fijate`, `dale`). Si está en inglés, neutral profesional. Sin em-dashes (es uno de los AI-tells más obvios). Sin fórmulas ("I'd like to", "kindly", "It's important to note"). Sin halagos de relleno.

Este skill es **estilístico** — no decide qué pedir, decide cómo decirlo. Asumí que ya tenés la observación o el ask; lo que necesitás es la redacción.

---

## When to use

Cargá este skill cuando:

- Tenés que escribir feedback en un PR (request changes, approve con notas, comentario en línea).
- Estás respondiendo un issue (triage, follow-up, cierre con explicación).
- Necesitás contestar a un teammate en un thread async (Slack, Discord, comentario de Jira).
- Tenés una observación clara y querés ponerla en palabras sin sonar a IA.

No lo uses para:

- **Commit messages** — eso es otra convención (ver `/git-flow`).
- **Docs formales** (READMEs, ADRs, runbooks) — usá `/cognitive-doc-design`.
- **Copy customer-facing** (emails de soporte, landing copy, comunicados) — el tono y los stakes son distintos.

---

## Voice Rules

| Rule                  | Requirement                                                                                                         |
| --------------------- | ------------------------------------------------------------------------------------------------------------------- |
| Be useful fast        | Empezá por el punto accionable. No recapitules el PR antes de dar el feedback.                                      |
| Be warm and direct    | Suena a un compañero pensante, no a un bot corporativo.                                                             |
| Keep it short         | 1 a 3 párrafos cortos, o una lista compacta. Si necesitás más, probablemente hagan falta dos comentarios separados. |
| Explain why           | Cuando pedís un cambio, dá la razón técnica. "Cambialo" sin justificación deja al autor adivinando.                 |
| Avoid pile-ons        | Comentá el issue de mayor valor. Las preferencias menores no necesitan comentario.                                  |
| Match thread language | Espejá el idioma del thread. Si es español, voseo Rioplatense. Si es inglés, neutral profesional.                   |
| No em-dashes          | Usá comas, puntos, paréntesis, o partí en dos oraciones. El em-dash es AI-tell automático.                          |
| No filler praise      | Si el código está bien, decilo concreto: "el split de validación quedó claro". "Great job!" no aporta nada.         |

---

## AI-tells to avoid

| Patrón                           | Por qué evitarlo                                      | Reemplazo                                                   |
| -------------------------------- | ----------------------------------------------------- | ----------------------------------------------------------- |
| Em-dashes (`—`)                  | Signature AI-tell.                                    | Coma, punto, paréntesis, o cortar la oración.               |
| Rule of three forzado            | "It's clean, fast, and maintainable" suena sintético. | Quedate con el adjetivo que más importa.                    |
| "It's important to note that..." | Frase muleta. Si es importante, decilo directo.       | "Ojo: <punto>".                                             |
| "I'd like to..." / "Could we..." | Indirecto, evasivo.                                   | "Movería esto a..." / "Separá esto en otro commit".         |
| "kindly" / "please kindly"       | Suena a soporte automático.                           | Sin adverbio, o "porfa" en español casual.                  |
| Praise genérica                  | "Great work!" no transmite info.                      | "El refactor del scheduler quedó mucho más legible".        |
| Negative parallels               | "Not just X, but Y" tres veces seguidas.              | Una oración directa.                                        |
| Hedging excesivo                 | "Maybe perhaps consider..." diluye el ask.            | "Cambialo a X". Si tenés dudas, preguntalas, no las cubras. |

---

## Comment Formula

```text
<Direct observation or request>

<Why it matters, only if needed>

<Concrete next action>
```

Si una de las tres partes ya quedó clara en el thread, salteala. La fórmula es estructura, no checklist obligatorio.

---

## Examples

### Request change (Spanish)

```markdown
Buenísimo el enfoque. Acá separaría este cambio en otro commit porque mezcla la validación con el wiring de UI.

Eso le baja carga al reviewer y hace que el rollback sea más claro si falla la integración.
```

### Approve with a note (Spanish)

```markdown
Está bien encaminado y el scope se entiende rápido.

Dejo aprobado. Para el próximo PR, agregá el link al anterior y al siguiente así la cadena queda navegable.
```

### Ask for split (Spanish)

```markdown
Este PR supera el presupuesto de 400 líneas, así que necesitamos dividirlo o justificar `size:exception`.

Mi sugerencia: primero foundation + tests, después integración, después docs. Cada review queda con inicio y fin claros.
```

### Request change (English, neutral)

```markdown
The approach looks solid. I'd split this commit though, the validation logic and the UI wiring are doing different things.

Lower review cost and a cleaner rollback if the integration breaks.
```

### Nitpick framing (English)

```markdown
Nit (non-blocking): the helper at line 42 could move to `utils/format.ts`, two other files import the same pattern.

Happy to merge as-is and follow up.
```

### Issue triage reply (Spanish)

```markdown
Pude reproducir con Chrome 120 + sesión nueva. Falla solo cuando el cookie de feature flag está vacío.

Lo paso a in-progress y agrego el repro a la descripción.
```

---

## Workflow when drafting a comment

1. **Identificá el ask** — ¿qué querés que pase después de este comentario? (cambio, aprobación, info, decisión).
2. **Elegí el idioma** — espejo del thread. Si es ambiguo, mirá el último comentario del autor.
3. **Aplicá la fórmula** — observación → razón (si hace falta) → próximo paso.
4. **Pasada anti-AI** — buscá em-dashes, "I'd like to", "kindly", rule-of-three forzado, hedging. Reemplazá.
5. **Pasada de longitud** — ¿se puede decir en menos? Borrá adjetivos vacíos.
6. **Lectura en voz alta** — ¿suena a vos hablando con un compañero? Si suena a soporte automático, reescribí.

---

## Commands

```bash
# Inspect a PR before writing review feedback
gh pr view <PR_NUMBER> --json title,body,additions,deletions,changedFiles

# Read recent comments on a PR for tone matching
gh api repos/<owner>/<repo>/pulls/<PR_NUMBER>/comments
```

---

## Output format

Devolvé el comentario listo para pegar. Si hay dos versiones razonables (más directa vs más diplomática), ofrecelas como opción A / opción B con una línea de cuándo elegir cada una.
