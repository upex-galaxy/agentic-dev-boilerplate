# Docs-hub roadmap — backlog de decks

Backlog vivo de presentaciones HTML (decks) para el docs-hub de `agentic-dev-boilerplate`, publicado en GitHub Pages (`https://upex-galaxy.github.io/agentic-dev-boilerplate/`). Espejo conceptual del sistema `packages/decks/` de `agentic-qa-boilerplate`, con identidad visual propia — ver `README.md` en este mismo directorio para la convención de autoría y los tokens de diseño compartidos.

No es un roadmap de producto: es la lista de qué doctrina/skill de este repo tiene su presentación explicativa, cuál se plegó dentro de otra y cuál se descartó, con el motivo.

## La regla de cobertura

- **Una skill de flujo (`kind: workflow` en `.agents/skills/REGISTRY.md`) = un deck** `<skill>/como-funciona.es.html`, salvo que la tabla diga otra cosa y por qué.
- **Una categoría = un deck**: las skills de contexto (`context-skills/`) y las de herramientas (`tooling/`) se explican juntas, porque comparten mecanismo.
- **Doctrina transversal** (`agentic-dev-core/`) tiene deck cuando explica cómo piensa el repo y no cabe dentro de una skill.
- **Sin deck**: `agentic-dev-onboard`. Su superficie es el hub y la página de inicio (`docs/onboarding.html`, publicada como `onboarding.html`); un tercer recorrido sería otra copia que mantener.

Una skill de flujo nueva sin deck es la próxima fila `todo`. La lista real de skills la da `REGISTRY.md`; esta tabla no la copia, solo registra decisiones.

## Backlog

### Núcleo — doctrina del repo

| Deck                                                      | Archivo                                        | Estado    | Nota |
| --------------------------------------------------------- | ---------------------------------------------- | --------- | ---- |
| La capa comportamental (Butler, PM Voice, Visual Mapping) | `agentic-dev-core/capa-comportamental.es.html` | **hecho** | |
| El backlog no se commitea — PBI como caché de Jira        | `agentic-dev-core/pbi-jira-cache.es.html`      | **hecho** | |
| El comando y sus ejecutores                               | `agentic-dev-core/orquestacion.es.html`        | plegado   | los dos ejecutores y el briefing viven en `orca-orchestration/como-funciona.es.html` |
| Cómo encadenan las skills, de cero a producción           | `agentic-dev-core/flujo-de-skills.es.html`     | descartado | el hub ya ordena las skills por sección; un deck de cadena tendría que enumerar un conjunto que cambia |
| Context skills: el mapa del negocio adentro de una skill  | `context-skills/como-funciona.es.html`         | **hecho** | categoría: `business-data-context`, `business-feature-context`, `business-api-context` |
| Orca orchestration: un conductor y una flota              | `orca-orchestration/como-funciona.es.html`     | **hecho** | |

### Ciclo de vida del desarrollo (orden de ejecución real)

| Deck                                                   | Archivo                                           | Estado     | Nota |
| ------------------------------------------------------ | ------------------------------------------------- | ---------- | ---- |
| Project foundation · cómo funciona                     | `project-foundation/como-funciona.es.html`        | **hecho**  | |
| Del plano al producto — tokens y mockups con IA        | `design-system/flujo-mockups.es.html`             | **hecho**  | fase de tokens y fase de pantallas en un solo deck; URL publicada sin cambios |
| DESIGN.md · los 5 caminos                              | `design-system/design-md.es.html`                 | plegado    | dentro de `flujo-mockups.es.html` (fase de tokens) |
| Project bootstrap · cómo funciona                      | `project-bootstrap/como-funciona.es.html`         | **hecho**  | |
| Product management · cómo funciona                     | `product-management/como-funciona.es.html`        | **hecho**  | |
| Project context · mapas, plan maestro y roadmap        | `project-context/como-funciona.es.html`           | **hecho**  | |
| Sprint development · del ticket al deploy              | `sprint-development/como-funciona.es.html`        | **hecho**  | |
| El contrato de fidelidad UI (Regla 14 + Live-UI-First) | `sprint-development/ui-fidelity-contract.es.html` | plegado    | design gate y validación de UI viva dentro del deck de `sprint-development` |
| Unit testing · TDD, mocking, cobertura                 | `unit-testing/como-funciona.es.html`              | **hecho**  | |
| Testability guide · cómo funciona                      | `testability-guide/como-funciona.es.html`         | **hecho**  | |

### Operación y entrega

| Deck                                           | Archivo                                     | Estado     | Nota |
| ---------------------------------------------- | ------------------------------------------- | ---------- | ---- |
| Git Flow Master · cómo funciona                | `git-flow-master/como-funciona.es.html`     | **hecho**  | |
| Estrategias de git — solo-main vs multi-branch | `git-flow-master/estrategias-git.es.html`   | plegado    | una lámina dentro de `git-flow-master/como-funciona.es.html` |
| PR review lead · cómo funciona                 | `pr-review-lead/como-funciona.es.html`      | **hecho**  | |
| Session handoff · cómo funciona                | `session-handoff/como-funciona.es.html`     | **hecho**  | |
| Autonomous delivery · cómo funciona            | `autonomous-delivery/como-funciona.es.html` | **hecho**  | |
| Jira administration · cómo funciona            | `jira-administration/como-funciona.es.html` | **hecho**  | |
| Herramientas: acli, vercel-cli y el arranque   | `tooling/como-funciona.es.html`             | **hecho**  | categoría: reemplaza los cookbooks separados de `acli` y `vercel-cli` |

## Próximo a construir

Nada pendiente dentro de la regla de cobertura. La próxima fila nace cuando `REGISTRY.md` muestre una skill de flujo sin deck, o cuando una doctrina transversal nueva no quepa en ningún deck existente.

## Fuente de verdad

Cada deck se autoría releyendo la skill real (`SKILL.md` + `references/`) al momento de escribir — nunca copiando de memoria. El deck nombra los archivos que lo respaldan (la skill, `REGISTRY.md`, `package.json`, `.agents/project.yaml`) en vez de fechar una verificación, porque una fecha envejece sola y un archivo nombrado se puede abrir y comparar. Un deck desactualizado es peor que no tener deck, así que quien cambia una skill revisa también su deck.
