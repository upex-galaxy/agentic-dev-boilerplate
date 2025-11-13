# Git Flow Strategy

## Branches principales
- main (producción)
- develop (staging)

## Feature branches
- feature/STORY-XXX-descripcion

## Workflow
1. Branch desde develop
2. Implementar + unit tests
3. PR a develop
4. Code review
5. Merge → deploy staging automático
6. QA valida en staging
7. Merge develop → main
8. Deploy a producción
