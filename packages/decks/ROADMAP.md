# Docs-hub roadmap — backlog de decks

Backlog vivo de presentaciones HTML (decks) para el docs-hub de `agentic-dev-boilerplate`, publicado en GitHub Pages (`https://upex-galaxy.github.io/agentic-dev-boilerplate/`). Espejo conceptual del sistema `packages/decks/` de `agentic-qa-boilerplate`, con identidad visual propia — ver `README.md` en este mismo directorio para la convención de autoría y los tokens de diseño compartidos.

No es un roadmap de producto: es la lista de qué doctrina/skill de este repo todavía no tiene su presentación explicativa, y en qué orden conviene construirla.

## Cómo se prioriza

- **P0** — la skill que más tickets/sesiones toca en el día a día (`sprint-development`, `product-management`). Sin deck, el usuario nuevo tarda más en entender el flujo central del repo.
- **P1** — doctrina transversal que explica _cómo piensa_ el repo (orquestación, capa comportamental) o skills de uso frecuente (`project-foundation`, `unit-testing`, `git-flow-master`).
- **P2** — skills de uso puntual pero con curva de aprendizaje propia (`project-bootstrap`, `testability-guide`, profundizaciones de `design-system` y `sprint-development`).
- **P3** — cookbooks de herramienta específica (`acli`, `vercel-cli`), útiles pero ya cubiertos razonablemente por sus propios `references/`.

## Backlog

### Núcleo — doctrina del repo (`agentic-dev-core`)

| #   | Deck                                                      | Archivo                                        | Prioridad | Estado |
| --- | --------------------------------------------------------- | ---------------------------------------------- | --------- | ------ |
| 1   | El comando y sus ejecutores                               | `agentic-dev-core/orquestacion.es.html`        | P1        | todo   |
| 2   | La capa comportamental (Butler, PM Voice, Visual Mapping) | `agentic-dev-core/capa-comportamental.es.html` | P1        | todo   |
| 3   | Cómo encadenan las skills, de cero a producción           | `agentic-dev-core/flujo-de-skills.es.html`     | P2        | todo   |

### Ciclo de vida del desarrollo (orden de ejecución real)

| #   | Deck                                                   | Archivo                                           | Prioridad | Estado    |
| --- | ------------------------------------------------------ | ------------------------------------------------- | --------- | --------- |
| 4   | Project Foundation · cómo funciona                     | `project-foundation/como-funciona.es.html`        | P1        | todo      |
| 5   | Del plano al producto — flujo de mockups con IA        | `design-system/flujo-mockups.es.html`             | —         | **hecho** |
| 6   | DESIGN.md · los 5 caminos                              | `design-system/design-md.es.html`                 | P2        | todo      |
| 7   | Project Bootstrap · cómo funciona                      | `project-bootstrap/como-funciona.es.html`         | P2        | todo      |
| 8   | Product Management · cómo funciona                     | `product-management/como-funciona.es.html`        | **P0**    | todo      |
| 9   | Sprint Development · cómo funciona (las 12 etapas)     | `sprint-development/como-funciona.es.html`        | **P0**    | todo      |
| 10  | El contrato de fidelidad UI (Regla 14 + Live-UI-First) | `sprint-development/ui-fidelity-contract.es.html` | P2        | todo      |
| 11  | Unit Testing · TDD, mocking, cobertura                 | `unit-testing/como-funciona.es.html`              | P1        | todo      |

### Operación y entrega

| #   | Deck                                           | Archivo                                   | Prioridad | Estado |
| --- | ---------------------------------------------- | ----------------------------------------- | --------- | ------ |
| 12  | Git Flow Master · cómo funciona                | `git-flow-master/como-funciona.es.html`   | P1        | todo   |
| 13  | Estrategias de git — solo-main vs multi-branch | `git-flow-master/estrategias-git.es.html` | P2        | todo   |
| 14  | Testability Guide · cómo funciona              | `testability-guide/como-funciona.es.html` | P2        | todo   |
| 15  | acli · cookbook de Jira/Confluence             | `acli/como-funciona.es.html`              | P3        | todo   |
| 16  | vercel-cli · cookbook de deploy                | `vercel-cli/como-funciona.es.html`        | P3        | todo   |

## Próximo a construir

`product-management/como-funciona.es.html` y `sprint-development/como-funciona.es.html` (los dos P0 pendientes) son el siguiente batch recomendado: son las skills que un usuario nuevo toca primero después del onboarding, y hoy no tienen ninguna explicación visual — solo el `SKILL.md` en texto.

## Fuente de verdad

Cada deck se autoría releyendo la skill real (`SKILL.md` + `references/`) al momento de escribir — nunca copiando de memoria. La fecha de "verificado contra el repo" va en el footer de cada deck (mismo patrón que `flujo-mockups.es.html`), porque las skills evolucionan (ver commits recientes sobre Open Design MCP) y un deck desactualizado es peor que no tener deck.
