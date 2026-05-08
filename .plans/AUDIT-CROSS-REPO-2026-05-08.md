# Auditoría Comparativa Cross-Repo — Post Skills-Migration

> **Fecha**: 2026-05-07
> **Repos comparados**:
>
> - **A (DEV)** — `ai-driven-project-starter` rama `skills-migration`
> - **B (QA)** — `agentic-qa-boilerplate` (rama default)
>
> **Objetivo**: Mapear divergencias y solapamientos para decidir, en sesiones futuras, qué borrows tienen sentido en cada dirección + limpieza interna en A.
>
> **Naturaleza**: Reporte de visibilidad. **No incluye implementación** — la viabilidad de cada candidato se evalúa después.

---

## Contexto

A acaba de completar el refactor "skills-migration" (12 commits, 14 fases), pasando de prompts a Claude Code skills. B ya estaba en skills hace tiempo y es el repo hermano structural. El usuario quiere, antes de continuar con el push diferido + Fase 15 que indica el HANDOFF, hacer un pase comparativo lateral para detectar:

- Skills/commands con mismo propósito disfrazado
- Documentación duplicada o redundante
- Referencias huérfanas a `.prompts/` o `guidelines/` (estructuras del pasado)
- Mejoras del lado QA portables al lado DEV (y viceversa)
- Drift en archivos que deberían estar sincronizados (CLAUDE.md ↔ AGENTS.md)

Las auditorías previas (`AUDIT-PANORAMA.md`, `AUDIT-ACTION-PLAN.md`) son de referencia histórica — son anteriores al refactor a skills y reflejan el estado de `main`, no de `skills-migration`.

---

## Resumen ejecutivo (8 hallazgos críticos)

> Si solo leés esto, te llevás lo importante.

| #   | Hallazgo                                                                                                                                                                                                                 | Impacto                       | Dirección |
| --- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ----------------------------- | --------- |
| 1   | **CLAUDE.md ≠ AGENTS.md en A** (29859 bytes ambos, regular files, **mtimes distintos**: May 7 02:09 vs 01:38). En B son symlink. **Drift activo: A ya divergió 31 minutos entre los dos archivos.**                      | Alto — single source of truth | A ← B     |
| 2   | **`init-project` (A) y `framework-core` (B)** son hermanos funcionales: bootstrap + shared references. Mismo rol, distinto nombre. Importante para alinear mental-model entre repos.                                     | Medio — naming consistency    | Decisión  |
| 3   | **`docs/methodology/` tiene 4 archivos hermanos** entre A y B (mid-game-testing, late-game-testing, early-game-testing, IQL-methodology). 2 son byte-idénticos, 2 son divergentes pese a tamaño igual. Drift silencioso. | Medio — sync hygiene          | Bidir     |
| 4   | **`.context/` divergió arquitectónicamente**: A mantiene `idea/ + guidelines/{DEV,QA,TAE}` (legacy phase-1 model). B reemplazó por `mapping/ + reports/`. Decisión pendiente: ¿A debería seguir a B?                     | Alto — arquitectura           | A ← B?    |
| 5   | **Scripts no son idénticos** entre repos pese al naming (`agents-lint.ts`, `sync-jira-fields.ts` divergen). A tiene además `build-skill-registry.ts`, `engram-bridge.ts`, `detect-testing-capabilities.ts` que B no.     | Alto — cross-pollination      | B ← A     |
| 6   | **`.claude/commands/` apenas overlap**: A tiene 5, B tiene 10, **0 duplicados de nombre**. Pero `git-conflict-fix` (A) y `fix-git-conflict` (B) son funcionalmente idénticos con orden de palabras invertido.            | Bajo — naming convention      | Decisión  |
| 7   | **B tiene `commit-push-pr.md`, `refresh-ai-memory.md`, `business-*-map.md` commands** que A no tiene. Tres de esos podrían beneficiar a A.                                                                               | Medio                         | A ← B     |
| 8   | **A tiene `.books/` (12 fases lifecycle), `templates/mcp/` (7 configs MCP), `setup/mcp/` (5 docs MCP), Future Hooks section en CLAUDE.md, skill-registry generator** que B no tiene. Material valioso para B.            | Medio                         | B ← A     |

---

## Tabla maestra side-by-side

```
┌─────────────────────┬──────────────────────────────────┬──────────────────────────────────┐
│ Dominio             │ A (DEV — skills-migration)       │ B (QA)                           │
├─────────────────────┼──────────────────────────────────┼──────────────────────────────────┤
│ workflow skills     │ 10 (incl. 4 borrows gentle-ai)   │ 8                                │
│ reusable skills     │ 5 (symlinks a .agents/skills/)   │ 0 (playwright-cli embebido)      │
│ slash commands      │ 5                                │ 10                               │
│ scripts/            │ 8 (incl. build-skill-registry)   │ 6                                │
│ cli/                │ 3 (sync-openapi, resend, update) │ 13 (xray completo + boilerplate) │
│ docs/ subdirs       │ 4 (architectures/methodology/    │ 5 (docs/testing/ exclusivo: 16   │
│                     │ setup/workflows)                 │ archivos API/DB/Automation)      │
│ .books/             │ 12 items (lifecycle)             │ ✗ (no existe)                    │
│ templates/          │ templates/mcp/ (7 configs)       │ pr-test-automation.md (1 file)   │
│ .context/ root      │ idea/, business-data-map,        │ mapping/, reports/, README       │
│                     │ context-engineering, system-     │ (sin guidelines/)                │
│                     │ prompt, skill-registry (gen)     │                                  │
│ guidelines/         │ DEV/QA/TAE (phase-1 legacy)      │ (movido a skills + .agents/)     │
│ CLAUDE.md ↔ AGENTS  │ 2 archivos regulares (DRIFT)     │ symlink CLAUDE→AGENTS            │
│ skills.log.json     │ ✗                                │ ✗                                │
│ .claude/settings*   │ settings.json + .local.json      │ settings.json + .local.json      │
│ package.json deps   │ 2 / 8 (minimal dev tools)        │ 2 / 12 (+playwright,faker,allure)│
└─────────────────────┴──────────────────────────────────┴──────────────────────────────────┘
```

---

## 1. Skills (`.claude/skills/`)

### 1.1 Workflow skills (mega-orquestadores y utilidades)

| Skill name (A → B)                | A   | B   | Status          | Nota                                                                       |
| --------------------------------- | --- | --- | --------------- | -------------------------------------------------------------------------- |
| `init-project` ↔ `framework-core` | ✓   | ✓   | **HERMANOS**    | Mismo rol (bootstrap + shared references). Naming distinto.                |
| `project-foundation`              | ✓   | ✗   | A only          | Constitution + PRD + SRS + Discovery (DEV side)                            |
| `project-discovery`               | ✗   | ✓   | B only          | Onboarding QA al proyecto (4 fases: Const → Arch → Infra → Spec)           |
| `project-bootstrap`               | ✓   | ✗   | A only          | Backend + Frontend + OpenAPI scaffolding                                   |
| `product-management`              | ✓   | ✗   | A only          | Backlog + INVEST + AC refinement (PM side)                                 |
| `sprint-dev` ↔ `sprint-testing`   | ✓   | ✓   | **HERMANOS**    | Mega-orquestadores per-story. Mismo patrón, distinto dominio.              |
| `unit-testing`                    | ✓   | ✗   | A only          | TDD + mocking (composable con sprint-dev)                                  |
| `test-automation`                 | ✗   | ✓   | B only          | KATA architecture (Playwright + TS)                                        |
| `test-documentation`              | ✗   | ✓   | B only          | TMS bridge (Jira/Xray)                                                     |
| `regression-testing`              | ✗   | ✓   | B only          | CI/CD regression + GO/NO-GO                                                |
| `chained-pr`                      | ✓   | ✗   | A only (gentle) | Split oversized PRs. **Borrow de gentle-ai**, candidato fuerte para B.     |
| `judgment-day`                    | ✓   | ✗   | A only (gentle) | Adversarial dual-judge review. **Borrow de gentle-ai**, candidato para B.  |
| `cognitive-doc-design`            | ✓   | ✗   | A only (gentle) | Progressive disclosure docs. **Útil en cualquier repo.** Candidato para B. |
| `comment-writer`                  | ✓   | ✗   | A only (gentle) | PR/issue comment voicing (voseo). **Útil en cualquier repo.** B candidato. |

### 1.2 Reusable knowledge skills

| Skill                   | A           | B   | Nota                                                                                     |
| ----------------------- | ----------- | --- | ---------------------------------------------------------------------------------------- |
| `playwright-cli`        | ✓ (symlink) | ✓   | A linka a `.agents/skills/playwright-cli`; B lo embebe. Mismo source.                    |
| `frontend-design`       | ✓ (symlink) | ✗   | A symlink a `.agents/skills/frontend-design`. **Borrow potencial para B.**               |
| `next-best-practices`   | ✓ (symlink) | ✗   | A symlink. **Borrow potencial para B.**                                                  |
| `next-cache-components` | ✓ (symlink) | ✗   | A symlink. **Borrow potencial para B.**                                                  |
| `next-upgrade`          | ✓ (symlink) | ✗   | A symlink. **Borrow potencial para B.**                                                  |
| `acli`                  | ✗           | ✓   | Atlassian CLI cookbook. **Borrow potencial para A** (Jira issue tracking en sprint-dev). |
| `xray-cli`              | ✗           | ✓   | Xray Cloud. NO aplica a A (es testing-only).                                             |

### 1.3 Conclusiones de skills

- **A ganó** los 4 borrows de gentle-ai (chained-pr, judgment-day, cognitive-doc-design, comment-writer). **B no los tiene** y son agnósticos al dominio dev/qa → fuertes candidatos a portar.
- **B mantiene `acli`** como skill dedicada para Jira CLI. A usa Atlassian via MCP. Si A va a interactuar más con Jira (commits con ticket-id, transitions, etc.), `acli` es candidato a portar.
- **Reusable skills (frontend-design, next-\*)**: A las tiene como symlinks que apuntan a `.agents/skills/`. B no las tiene. Si B alguna vez automatiza tests sobre proyectos Next.js, esas skills son útiles.
- **Patrón divergente**: A separa "reusable knowledge" (symlinks a `.agents/`) de "workflow" (directorios reales). B no hace esa separación. **El patrón de A es más limpio** y podría adoptarse en B.

---

## 2. Slash commands (`.claude/commands/`)

A tiene **5**, B tiene **10**, con **0 nombres exactos** en común.

| Command                     | En A | En B | Análisis                                                                                       |
| --------------------------- | ---- | ---- | ---------------------------------------------------------------------------------------------- |
| `context-engineering-setup` | ✓    | ✗    | A only — setup `.context/` structure                                                           |
| `git-flow`                  | ✓    | ✗    | A only — git flow guidance                                                                     |
| `git-conflict-fix`          | ✓    | ✗    | **Funcionalmente == `fix-git-conflict` de B** (orden de palabras invertido)                    |
| `project-doc-setup`         | ✓    | ✗    | A only — regenerar README + CLAUDE.md                                                          |
| `sprint-report`             | ✓    | ✗    | A only — sprint progress report (épicas + stories + PRs)                                       |
| `adapt-framework`           | ✗    | ✓    | B only — adaptar KATA al stack target                                                          |
| `break-down-tests`          | ✗    | ✓    | B only — descomponer test suite                                                                |
| `business-api-map`          | ✗    | ✓    | B only — mapeo APIs business view                                                              |
| `business-data-map`         | ✗    | ✓    | B only — mapeo data business view. **Equivalente al doc de A `.context/business-data-map.md`** |
| `business-feature-map`      | ✗    | ✓    | B only                                                                                         |
| `commit-push-pr`            | ✗    | ✓    | B only — commit→push→PR orquestación. **Útil en A** (encaja con `/sprint-dev`)                 |
| `fix-git-conflict`          | ✗    | ✓    | == `git-conflict-fix` de A                                                                     |
| `fix-traceability`          | ✗    | ✓    | B only — repair TMS traceability (QA-only)                                                     |
| `master-test-plan`          | ✗    | ✓    | B only — coverage matrix (QA-only)                                                             |
| `refresh-ai-memory`         | ✗    | ✓    | B only — refresh project memory facts. **Útil en A**.                                          |

### 2.1 Conclusiones de commands

- **Naming inconsistencia**: `git-conflict-fix` vs `fix-git-conflict` — convención distinta. Decidir naming canónico (verbo-primero o sustantivo-primero) y alinear ambos repos.
- **Candidatos A ← B**: `commit-push-pr`, `refresh-ai-memory`. Ambos son agnósticos al dominio.
- **`business-*-map` en B**: ya existen como **docs** en A (`.context/business-data-map.md`). En B son commands (interactivos, generan el doc). **Eso es upgrade**: B promovió docs a commands generadores. A podría hacer lo mismo o portar los commands.
- **`adapt-framework` y `break-down-tests`**: específicos de QA, no aplican.

---

## 3. `docs/` — comparación estructural

### 3.1 Subdirs top-level

| Subdir                           | A   | B   | Status                                                                            |
| -------------------------------- | --- | --- | --------------------------------------------------------------------------------- |
| `architectures/`                 | ✓   | ✓   | Ambos solo README en root; A tiene subdir `supabase-nextjs/` con 3 archivos.      |
| `methodology/`                   | ✓   | ✓   | Overlap parcial (4 archivos hermanos)                                             |
| `setup/`                         | ✓   | ✓   | Overlap parcial; A tiene `setup/mcp/` (5 docs) exclusivo                          |
| `workflows/`                     | ✓   | ✓   | A: sync-openapi-guide + update-template-guide (DEV-only); ningún archivo overlap. |
| `testing/`                       | ✗   | ✓   | **B only**: api/ + database/ + automation/ (16+ archivos)                         |
| `onboarding/`                    | ✗   | ✓   | **B only**: HTML + CSS                                                            |
| `agentic-quality-engineering.md` | ✗   | ✓   | B only (root, 743 líneas)                                                         |
| `getting-started.md`             | ✗   | ✓   | B only (root, 257 líneas)                                                         |

### 3.2 Archivos con nombre idéntico (drift detector)

| Path relativo                          | A líneas | B líneas | Status         | Acción sugerida                             |
| -------------------------------------- | -------- | -------- | -------------- | ------------------------------------------- |
| `methodology/mid-game-testing.md`      | 253      | 253      | **IDÉNTICO**   | Mantener sync                               |
| `methodology/late-game-testing.md`     | 286      | 286      | **IDÉNTICO**   | Mantener sync                               |
| `methodology/early-game-testing.md`    | 334      | 334      | **DIVERGENTE** | Mismo size, distinto contenido — investigar |
| `methodology/IQL-methodology.md`       | 432      | 432      | **DIVERGENTE** | Mismo size, distinto contenido — investigar |
| `workflows/git-flow.md`                | 229      | 229      | **IDÉNTICO**   | Mantener sync                               |
| `workflows/environments.md`            | 334      | 334      | **DIVERGENTE** | Mismo size, distinto contenido — investigar |
| `setup/jira-setup-guide.md`            | 558      | 550      | **VARIANTE**   | A español, B inglés — decidir lengua        |
| `setup/mcp-dbhub.md`                   | 374      | 377      | **VARIANTE**   | Sync mínimo                                 |
| `setup/mcp-openapi.md`                 | 462      | 455      | **VARIANTE**   | Sync mínimo                                 |
| `context-engineering.md` (no en docs/) | 240      | 316      | **VARIANTE**   | B +76 líneas; B menciona symlink AGENTS     |
| `README.md` (root)                     | 152      | 183      | **VARIANTE**   | B +31 líneas; B agrega "Empieza Aquí"       |

### 3.3 docs/ exclusivos de A (DEV-only)

```
docs/
├── architectures/supabase-nextjs/
│   ├── auth-tokens.md
│   ├── connection-setup.md
│   └── troubleshooting.md
├── setup/mcp/                ← 5 archivos (claude-code, copilot-cli, gemini-cli, vscode, README)
└── workflows/
    ├── sync-openapi-guide.md
    └── update-template-guide.md
```

### 3.4 docs/ exclusivos de B (QA-only)

```
docs/
├── agentic-quality-engineering.md (743 L)
├── getting-started.md (257 L)
├── methodology/kata-fundamentals.md (1892 L)
├── methodology/test-management-system.md (1025 L)
├── testing/api/   ← 7 archivos
├── testing/database/   ← 4 archivos
├── testing/automation/   ← 6 archivos
├── onboarding/   ← HTML+CSS
└── workflows/test-automation-lifecycle.md, test-manual-lifecycle.md
```

### 3.5 Conclusiones docs

- **4 archivos methodology hermanos** ya tienen 2 idénticos y 2 divergentes con mismo size. Drift silencioso. **Sync mantenimiento bidireccional sugerido** (script o decisión humana).
- **`setup/mcp/` en A es valioso para B**. B no documenta cómo configurar Claude Code, Copilot CLI, Gemini, VSCode con sus MCPs. Si alguien intentara setup de B, miraría A.
- **`docs/testing/` en B (16 archivos)**: NO aplica a A (DEV-only).
- **`getting-started.md`**: A no tiene un equivalente en docs (lo cubre CLAUDE.md). Decisión: ¿A debería tener un onboarding doc separado al CLAUDE.md (que es para AI)? El de B (257 líneas) sirve de modelo.
- **`agentic-quality-engineering.md` en B (743 L)**: es el "manifesto" del repo. **A no tiene equivalente** (un "agentic-development.md" sería análogo). Candidato para A.

---

## 4. `.books/` y `templates/`

| Recurso          | A                                                        | B                                            |
| ---------------- | -------------------------------------------------------- | -------------------------------------------- |
| `.books/`        | ✓ 12 items: README + 9 fase-\* dirs (lifecycle completo) | ✗ no existe                                  |
| `templates/mcp/` | ✓ 7 configs (claude.json, gemini.json, dbhub.toml, etc.) | ✗ no existe                                  |
| `templates/`     | (cubierto por templates/mcp/)                            | ✓ 1 archivo: `pr-test-automation.md` (755 B) |

### Conclusiones

- **`.books/` es DEV-specific** (lifecycle phases ya migrado a skills). El user lo describió como "lectura interesante". **Decisión pendiente**: ¿se mantiene como referencia narrativa, se elimina, o se mueve a `docs/methodology/`? El HANDOFF Fase 12 ya borró 5 fases QA-related. Quedan 9 dev-related.
- **`templates/mcp/` en A es valioso para B**. Configurar MCPs es paso 1 para cualquier proyecto AI-driven. **Borrow candidato fuerte para B**.
- **`templates/pr-test-automation.md` en B**: PR template para automation tasks. A no tiene `templates/` para PRs. Si A define su propio PR template, podría seguir el patrón.

---

## 5. `scripts/` y `cli/`

### 5.1 scripts/ overlap

| Script                           | A   | B   | Identical? | Nota                                                                     |
| -------------------------------- | --- | --- | ---------- | ------------------------------------------------------------------------ |
| `agents-lint.ts`                 | ✓   | ✓   | **NO**     | Forks divergentes. A tiene allowlist para skill-registry; B no.          |
| `agents-setup.ts`                | ✓   | ✓   | TBD        | Probablemente fork divergente                                            |
| `check-jira-setup.ts`            | ✓   | ✓   | TBD        | Probable identidad funcional                                             |
| `sync-jira-fields.ts`            | ✓   | ✓   | **NO**     | Forks divergentes                                                        |
| `sync-jira-workflows.ts`         | ✓   | ✓   | TBD        | Probable identidad funcional                                             |
| `build-skill-registry.ts`        | ✓   | ✗   | —          | **A only — útil para B** (escanear .claude/skills/ y emitir registry md) |
| `detect-testing-capabilities.ts` | ✓   | ✗   | —          | **A only — gentle-ai borrow** (cache de testing capabilities)            |
| `engram-bridge.ts`               | ✓   | ✗   | —          | **A only — gentle-ai borrow** (engram opcional)                          |
| `api-login.ts`                   | ✗   | ✓   | —          | B only — auth para API tests                                             |
| `kata-manifest.ts`               | ✗   | ✓   | —          | B only — kata test framework                                             |
| `onboarding.ts`                  | ✗   | ✓   | —          | B only — interactivo                                                     |

### 5.2 cli/ overlap

| Path                        | A   | B   | Nota                                                                         |
| --------------------------- | --- | --- | ---------------------------------------------------------------------------- |
| `cli/sync-openapi.ts`       | ✓   | ✗   | A only (B lo movió a `scripts/sync-openapi.ts`)                              |
| `cli/resend.ts`             | ✓   | ✗   | A only — email tooling                                                       |
| `cli/update-template.js`    | ✓   | ✗   | A only — update boilerplate from upstream                                    |
| `cli/update-boilerplate.ts` | ✗   | ✓   | B only — funcionalmente == `cli/update-template.js` de A pero TS y diferente |
| `cli/xray/*` (~11 archivos) | ✗   | ✓   | B only — Xray integration completa (QA-only)                                 |

### 5.3 Conclusiones scripts/cli

- **3 scripts A-only que B no tiene**: `build-skill-registry.ts`, `detect-testing-capabilities.ts`, `engram-bridge.ts`. **Todos candidatos fuertes para B**: build-skill-registry y detect-testing-capabilities son agnósticos; engram-bridge depende de la decisión de B sobre engram.
- **Drift en scripts hermanos** (`agents-lint.ts`, `sync-jira-fields.ts`): los repos divergieron. Decidir source-of-truth o mantener forks documentados.
- **`cli/update-template.js` (A) vs `cli/update-boilerplate.ts` (B)**: misma idea, distintas implementaciones. A todavía en JS. Considerar migrar a TS y unificar lógica.
- **`cli/sync-openapi.ts` en A vs `scripts/sync-openapi.ts` en B**: ubicación distinta. B parece haber estandarizado todo bajo `scripts/`. **Decisión arquitectónica**: ¿qué directorio canónico? B votó por `scripts/`.

---

## 6. `package.json` — scripts npm + dependencies

### 6.1 Scripts npm (overlap)

Compartidos (9): `api:sync`, `format`, `format:check`, `jira:check`, `jira:sync-fields`, `lint`, `lint:agents`, `lint:fix`, `prepare`.

Solo en A (3): `resend`, `up`, `jira:sync` (referencia rota a `scripts/jira-sync.ts` que probablemente no existe — el agente lo flaggeó).

Solo en B (15+): `agents:setup`, `api:login*` (3 variantes), `api:types`, `clean`, `env:validate`, `jira:sync-issues`, `jira:sync-workflows`, `kata:manifest*`, `onboarding`, `pw:install`, `test*` (8 variantes), `type-check`, `update`, `xray`.

### 6.2 Dependencies

| Repo | deps | devDeps | Notable                                                                                     |
| ---- | ---- | ------- | ------------------------------------------------------------------------------------------- |
| A    | 2    | 8       | Minimal: base + lint tools                                                                  |
| B    | 2    | 12      | +4 extras: `@playwright/test`, `@faker-js/faker`, `allure-playwright`, `openapi-typescript` |

### 6.3 Conclusiones package.json

- **Referencia rota potencial en A**: `package.json` declara `"jira:sync"` script pero no encontré `scripts/jira-sync.ts`. Verificar.
- **B `type-check` script**: `tsc --noEmit`. A no lo tiene como npm script (aunque el CLAUDE.md lo menciona). **Borrow fácil para A**.
- **B `agents:setup`, `env:validate`, `pw:install`**: DX scripts útiles. A debería tener al menos `agents:setup` (lo tiene como `scripts/agents-setup.ts` pero no como comando npm).
- **B `clean` script**: probablemente borra outputs/builds. A no tiene equivalente. Útil agregarlo.

---

## 7. `.agents/` y `.context/`

### 7.1 `.agents/` comparación

| Item                  | A                               | B                           | Nota                                                    |
| --------------------- | ------------------------------- | --------------------------- | ------------------------------------------------------- |
| `project.yaml`        | template (nulls)                | template + ejemplos UPEX/OB | B tiene proyecto concreto seedado                       |
| `jira-required.yaml`  | DEV-podado                      | full QA-fields              | Schemas distintos pero idéntica estructura              |
| `jira.json`           | ✓                               | ✗                           | A only (generated) — probablemente naming distinto en B |
| `jira-fields.json`    | ✗                               | ✓                           | B only (generated)                                      |
| `jira-workflows.json` | ✗                               | ✓                           | B only (generated)                                      |
| `README.md`           | menciona "prompts"              | menciona "skills"           | **A tiene referencia outdated a `.prompts/`** ⚠         |
| `skills/` subdir      | ✓ (4: frontend-design, next-\*) | ✗                           | A only — patrón symlink-a-.claude                       |

### 7.2 `.context/` root comparación

| Item                       | A                        | B                   | Nota                                         |
| -------------------------- | ------------------------ | ------------------- | -------------------------------------------- |
| `README.md`                | ✓                        | ✓                   | Variantes (audit previa lo flaggeó)          |
| `business-data-map.md`     | ✓ (4KB)                  | ✗                   | A only (B lo tiene como command)             |
| `context-engineering.md`   | ✓ (30KB)                 | ✗                   | A only                                       |
| `system-prompt.md`         | ✓                        | ✗                   | A only                                       |
| `skill-registry.md`        | ✓ (29KB, generado May 7) | ✗                   | A only (output de `build-skill-registry.ts`) |
| `idea/` subdir             | ✓                        | ✗                   | A only                                       |
| `mapping/` subdir          | ✗                        | ✓                   | B only                                       |
| `reports/` subdir          | ✗                        | ✓                   | B only                                       |
| `guidelines/{DEV,QA,TAE}/` | ✓ (legacy)               | ✗ (movido a skills) | **A tiene legacy DEV/QA/TAE** ⚠              |

### 7.3 Conclusiones .agents y .context

- ⚠ **Referencia outdated en `.agents/README.md` de A**: menciona "prompts/" cuando ya no existe ese directorio. **Limpieza pendiente** (vestigio del pasado).
- ⚠ **`.context/guidelines/{DEV,QA,TAE}/` en A es legacy**. El HANDOFF Fase 12 borró QA y TAE del scope, pero queda DEV/. ¿Dónde vive ahora? El SKILL.md de `sprint-dev` debería ya tenerlo absorbido. **Verificar y borrar duplicados**.
- **`.context/` divergencia arquitectónica**: A todavía con modelo phase-1 (`idea/` + `guidelines/`). B con modelo orquestador (`mapping/` + `reports/`). **Decisión estratégica pendiente**: ¿A se moderniza siguiendo a B?
- **`.context/business-data-map.md` (A) vs command `business-data-map` (B)**: B promovió el doc a generador interactivo. A podría hacer lo mismo y eliminar el doc en favor del command.
- **`skill-registry.md` (A only)**: salida de build-skill-registry.ts. **Útil en B también** (genera catálogo de las 8 skills de B).

---

## 8. `CLAUDE.md` ↔ `AGENTS.md` — el tema del symlink

| Repo | CLAUDE.md           | AGENTS.md    | bytes               | mtime               | Status             |
| ---- | ------------------- | ------------ | ------------------- | ------------------- | ------------------ |
| A    | regular file        | regular file | 29859 / 29859       | May 7 01:38 / 02:09 | ⚠ **DRIFT activo** |
| B    | symlink → AGENTS.md | regular file | 9 (symlink) / 28061 | (symlink dynamic)   | ✓ single source    |

### Hallazgo crítico

**A tiene los dos archivos como copias regulares con mtimes distintos** (31 minutos de diferencia). Aunque hoy el size es idéntico, ya divergieron en algún momento. **Es solo cuestión de tiempo hasta que el contenido también divergan**, lo cual rompe el objetivo de "AGENTS.md y CLAUDE.md son mirror" que está documentado en el HANDOFF Gotcha #10.

**Solución sugerida** (ya validada en B):

```bash
# En A, posición pendiente:
rm CLAUDE.md
ln -s AGENTS.md CLAUDE.md
```

Esto convierte CLAUDE.md en symlink a AGENTS.md. Cualquier edit a uno se refleja en el otro automáticamente. Cero drift posible.

### Headers comparison

| Métrica                  | A                                                                                                                 | B                                                                                    |
| ------------------------ | ----------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------ |
| Líneas                   | ~590                                                                                                              | ~430                                                                                 |
| Secciones (`## headers`) | 24                                                                                                                | 18                                                                                   |
| A-only headers           | "Planning Scopes", "Discovery Progress", "Known Issues & Blockers", "Session Log", "Next Actions", "Future Hooks" | —                                                                                    |
| B-only headers           | —                                                                                                                 | enfoque QA: KATA Architecture, CI/CD Pipelines, TMS Integration, Customization Guide |

Ambos están bien structured pero divergieron de propósito. Cada uno está adaptado a su dominio. No requiere unificación, solo:

1. Symlink CLAUDE↔AGENTS en A.
2. Decisión sobre si A debería tener una sección "Customization Guide" como B (ayuda a usuarios nuevos).

---

## 9. Configs root + `.gitignore`

| File              | A                                         | B     | Nota                                            |
| ----------------- | ----------------------------------------- | ----- | ----------------------------------------------- |
| `.gitignore`      | 1.1K                                      | 1.4K  | B +300 bytes (más restrictivo)                  |
| `.prettierrc`     | 199 B                                     | 199 B | **Idénticos** (`diff` confirmado)               |
| `tsconfig.json`   | 547 B                                     | 1.7K  | B 3x mayor (probable Playwright strict + paths) |
| `eslint.config.*` | (vía package.json `@antfu/eslint-config`) | idem  | Convención compartida, configurada en deps      |
| `bun.lock`        | 96K                                       | 94K   | Ambos presentes                                 |

### Conclusiones

- **`tsconfig.json` en B es más rico**. A podría adoptar paths/strict adicionales si va a tener tests.
- **`.gitignore` en B más restrictivo**: revisar las +300 bytes y portar las que apliquen a A (probable: outputs, evidence/, allure-results/).

---

## 10. Catálogo de candidatos para evaluación posterior

> Lista priorizada, agrupada por dirección. **No ejecutar sin aprobación user**. Cada item es candidato a ser evaluado en sesión separada con dispatch a subagentes.

### 10.1 Quick wins (alto impacto / bajo esfuerzo) — recomendado primero

| #   | Item                                                               | Esfuerzo | Impacto | Riesgo |
| --- | ------------------------------------------------------------------ | -------- | ------- | ------ |
| Q1  | Symlink `CLAUDE.md → AGENTS.md` en A (eliminar drift)              | XS       | Alto    | Bajo   |
| Q2  | Limpiar referencia a "prompts/" en `.agents/README.md` de A        | XS       | Bajo    | Bajo   |
| Q3  | Verificar y resolver `package.json::jira:sync` script (¿ref rota?) | XS       | Bajo    | Bajo   |
| Q4  | Agregar npm script `type-check` a A (`tsc --noEmit`)               | XS       | Medio   | Bajo   |
| Q5  | Decidir destino de `.context/guidelines/DEV/` (legacy phase-1)     | S        | Medio   | Medio  |

### 10.2 A ← B (portar de QA a DEV)

| #   | Item                                                                                | Razón                                            |
| --- | ----------------------------------------------------------------------------------- | ------------------------------------------------ |
| AB1 | Command `commit-push-pr.md`                                                         | Encaja con `/sprint-dev` Stage final             |
| AB2 | Command `refresh-ai-memory.md`                                                      | Útil para recovery post-compaction               |
| AB3 | Skill `acli` (Atlassian CLI cookbook)                                               | A interactúa con Jira en sprint-dev, hoy via MCP |
| AB4 | npm script `agents:setup` (referencia a `scripts/agents-setup.ts` que ya tiene)     | Acceso DX                                        |
| AB5 | npm script `clean`                                                                  | Borrar builds                                    |
| AB6 | Símbolo unificado de naming: `fix-git-conflict` o `git-conflict-fix` (no ambos)     | Convención cross-repo                            |
| AB7 | Inspirar sección "Customization Guide" en CLAUDE.md de A                            | Onboarding para users nuevos                     |
| AB8 | Considerar arquitectura `.context/{mapping,reports}/` vs `idea/+guidelines/` actual | Modernización (pero requiere ADR explícito)      |

### 10.3 B ← A (portar de DEV a QA, sugerencias para sister repo)

| #    | Item                                                                | Razón                                                               |
| ---- | ------------------------------------------------------------------- | ------------------------------------------------------------------- |
| BA1  | Symlink `CLAUDE.md → AGENTS.md` ya existe en B ✓ (no acción)        |                                                                     |
| BA2  | Skill `chained-pr` (Workload Forecast + 400-line gate)              | Útil en B también para PRs grandes de tests                         |
| BA3  | Skill `judgment-day` (adversarial dual review)                      | Aplicable a PRs críticas en B                                       |
| BA4  | Skill `cognitive-doc-design`                                        | Diseño de docs aplicable a cualquier repo                           |
| BA5  | Skill `comment-writer`                                              | Voicing de comentarios universal                                    |
| BA6  | Script `build-skill-registry.ts` + `.context/skill-registry.md`     | Útil en B (8 skills, registry serviría)                             |
| BA7  | Script `detect-testing-capabilities.ts`                             | Cache de capabilities útil en B                                     |
| BA8  | `templates/mcp/` (7 configs MCP) y `docs/setup/mcp/` (5 docs)       | B no documenta setup MCP                                            |
| BA9  | Sección "Future Hooks" en CLAUDE.md (extension points documentados) | Patrón replicable                                                   |
| BA10 | Patrón "reusable skills via symlink a `.agents/skills/`"            | Si B alguna vez agrega skills agnósticas, este patrón es más limpio |

### 10.4 Limpieza interna A (vestigios del pasado)

| #   | Item                                                                              | Acción                                                               |
| --- | --------------------------------------------------------------------------------- | -------------------------------------------------------------------- |
| L1  | `.agents/README.md` menciona "prompts/" — referencia obsoleta                     | Editar string                                                        |
| L2  | `.context/guidelines/DEV/` legacy — el contenido ya está absorbido por sprint-dev | Confirmar absorción y borrar duplicados                              |
| L3  | `.context/idea/` directory — phase-1 model legacy                                 | Decidir si se mantiene (referencia narrativa) o se mueve a `.books/` |
| L4  | `package.json::jira:sync` script — ¿target script existe?                         | Verificar y o restaurar o eliminar                                   |
| L5  | `cli/sync-openapi.ts` — B lo movió a `scripts/`. Decidir si A unifica.            | Decisión arquitectónica + mover                                      |
| L6  | `cli/update-template.js` (JS legacy) vs B's `cli/update-boilerplate.ts` (TS)      | Migrar a TS, unificar naming                                         |

### 10.5 Sync de docs hermanos (mantenimiento bidireccional)

| #   | Archivos                                                       | Estado actual              | Sugerencia                                               |
| --- | -------------------------------------------------------------- | -------------------------- | -------------------------------------------------------- |
| S1  | `docs/methodology/mid-game-testing.md`, `late-game-testing.md` | byte-idénticos             | Mantener sync; cambios en uno se replican manualmente    |
| S2  | `docs/methodology/early-game-testing.md`, `IQL-methodology.md` | mismo size, **divergente** | Investigar por qué divergieron — bug, traducción, o real |
| S3  | `docs/workflows/git-flow.md`                                   | byte-idénticos             | Mantener sync                                            |
| S4  | `docs/workflows/environments.md`                               | mismo size, **divergente** | Investigar                                               |
| S5  | `docs/setup/jira-setup-guide.md`                               | A español, B inglés        | Decidir lengua canónica + sync                           |
| S6  | `docs/setup/mcp-dbhub.md`, `mcp-openapi.md`                    | variantes menores          | Sync mínimo                                              |
| S7  | `docs/architectures/README.md`                                 | ambos solo con README      | Considerar si A debería expandir architectures           |

### 10.6 Decisiones estratégicas (requieren input del user)

| ID  | Decisión                                                                                          | Recomendación tentativa                                              |
| --- | ------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------- |
| D1  | ¿Naming canónico para "bootstrap + shared references"? `init-project` (A) vs `framework-core` (B) | Mantener divergente: cada repo nombre semánticamente acorde a domain |
| D2  | ¿Lengua de docs/prompts: español o inglés?                                                        | Inglés para docs/skills/commands; español aceptable en READMEs       |
| D3  | ¿`.context/` migra del modelo `idea/+guidelines/` al modelo `mapping/+reports/`?                  | ADR explícito antes de mover. Probablemente sí, pero costo medio     |
| D4  | ¿`.books/` se mantiene en A o se mueve a `docs/methodology/`?                                     | Mantener en A; es contenido narrativo, no docs reference             |
| D5  | ¿Commands `git-conflict-fix` (A) vs `fix-git-conflict` (B) — naming canónico?                     | "verbo-primero" (`fix-X`) — cambiar A para alinear con B             |
| D6  | ¿A adopta `cli/` o todo va a `scripts/`?                                                          | Estándar `scripts/` (siguiendo B); preservar `cli/xray/*` solo en B  |
| D7  | ¿Build-skill-registry corre en CI o on-demand?                                                    | On-demand; ya existe gotcha #11 sobre regeneración                   |

---

## 11. Relación con el HANDOFF.md y próximas fases

Este reporte **NO bloquea** la Fase 13 (push) ni la Fase 15 (super-installer + onboarding gentle-ai) que aparecen en el HANDOFF como pendientes. Sin embargo:

- Los **Quick wins (Q1-Q5)** son razonables de hacer **antes** del push (limpieza pre-push).
- Los items **A ← B (AB1-AB8)** son una "Fase 16" (post-push) opcional.
- Los items **B ← A (BA1-BA10)** son sugerencias para el sister repo `agentic-qa-boilerplate` — fuera de scope de este repo, pero documentados acá para no perderlos.
- La **Limpieza interna L1-L6** es seguridad de migración: vale hacerla antes del push si el user quiere un push impecable.
- Los **Sync de docs (S1-S7)** son mantenimiento continuo, no urgente.
- Las **Decisiones estratégicas (D1-D7)** requieren conversación explícita con el user — no se delegan a subagentes.

---

## 12. Verificación end-to-end del reporte

Cualquiera puede validar este reporte:

```bash
# Symlink check
ls -la /home/sai/Desktop/upex/web-apps/ai-driven-project-starter/{CLAUDE.md,AGENTS.md}
ls -la /home/sai/Desktop/upex/web-apps/agentic-qa-boilerplate/{CLAUDE.md,AGENTS.md}

# Skills count
ls /home/sai/Desktop/upex/web-apps/ai-driven-project-starter/.claude/skills/ | wc -l
ls /home/sai/Desktop/upex/web-apps/agentic-qa-boilerplate/.claude/skills/ | wc -l

# Commands overlap
ls /home/sai/Desktop/upex/web-apps/ai-driven-project-starter/.claude/commands/
ls /home/sai/Desktop/upex/web-apps/agentic-qa-boilerplate/.claude/commands/

# Doc duplicates (methodology)
md5sum /home/sai/Desktop/upex/web-apps/ai-driven-project-starter/docs/methodology/*.md
md5sum /home/sai/Desktop/upex/web-apps/agentic-qa-boilerplate/docs/methodology/*.md

# Drift check on shared scripts
diff /home/sai/Desktop/upex/web-apps/ai-driven-project-starter/scripts/agents-lint.ts \
     /home/sai/Desktop/upex/web-apps/agentic-qa-boilerplate/scripts/agents-lint.ts | head -50
```

---

## 13. Próximos pasos sugeridos

1. **Aprobar este reporte** (ExitPlanMode).
2. **Mover el reporte** a `.plans/AUDIT-CROSS-REPO-2026-05-07.md` para que viva junto a HANDOFF.md y MASTER-PLAN.md.
3. **El user decide** qué bloque atacar primero:
   - (a) Quick wins Q1-Q5 (recomendado pre-push)
   - (b) A ← B borrows (Fase 16)
   - (c) Limpieza interna L1-L6
   - (d) Sync docs S1-S7
   - (e) Decisiones D1-D7 en conversación
4. **Cada bloque** se ejecuta en sesión separada con dispatch a subagentes (orquestación pura), siguiendo el modelo de las 14 fases ya completadas.

**Última actualización**: 2026-05-07, post-skills-migration commit `ed1e041` (Fase 14).
