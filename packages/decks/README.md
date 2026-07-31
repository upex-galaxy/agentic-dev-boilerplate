# packages/decks — canonical source of the published deck site

Every HTML deck served at `https://upex-galaxy.github.io/agentic-dev-boilerplate/decks/<skill>/`
lives here, grouped by the skill it teaches. `.github/workflows/pages.yml` copies
this directory verbatim into the site's `/decks/` path on every push to `main`.

Sibling system: `agentic-qa-boilerplate/packages/decks/` follows the exact same
shape (same README structure, same publish mechanism). This repo's decks are a
**separate visual identity** ("Planos" — see tokens below), not a reskin of the
QA repo's dark GitHub theme. See `ROADMAP.md` in this same directory for the
backlog of decks still to write.

## Why here and not in `.claude/skills/`?

`packages/` is boilerplate-only: `packages/create-agentic-dev` prunes it wholesale
(`TEMPLATE_EXCLUDES` in `packages/create-agentic-dev/src/prepare.ts`, entry
`'packages'`) and `bun run up` never syncs it. Keeping the decks here means
consumer projects scaffolded from this template do NOT carry this HTML — they
browse the published site instead.

## Adding a new deck

1. Create `packages/decks/<skill>/<slug>.<lang>.html` — self-contained: **all**
   CSS and JS inlined, zero external requests (not even a font `@import` — see
   "Design tokens" below for why). Spanish decks use `.es.html`; if an English
   version is ever needed, `<slug>.en.html` in the same folder.
2. Before writing content, re-read the actual skill (`SKILL.md` + `references/`)
   — never write a deck from memory of a previous session. Skills evolve (see
   the Open Design MCP flow commits from 2026-07); a stale deck is worse than
   no deck. Stamp a "verificado contra el repo — <fecha>" line in the footer.
3. Register a card in `packages/pages-home/index.html` (the homepage catalog is
   hardcoded HTML, same as QA's). Move it from "Próximamente" to a live link.
4. Flip its row from `todo` to `hecho` in `ROADMAP.md`.
5. Update the three narrative summaries that don't auto-derive from the table/cards
   and will otherwise silently go stale: `ROADMAP.md`'s "Próximo a construir"
   paragraph, `pages-home/index.html`'s hero facts tile (deck count, the "P0 /
   próximos" line, last-updated date), and the closing callout in whichever
   homepage section the new deck lived in if it named that deck as pending.
6. Nothing else: `pages.yml` copies this whole directory verbatim, so the new
   file publishes automatically at
   `https://upex-galaxy.github.io/agentic-dev-boilerplate/decks/<skill>/<file>`.

**Linking to `ROADMAP.md`/`README.md` from inside a deck**: `pages.yml` strips
both files from the published `/decks/` tree (`rm -f _site/decks/README.md
_site/decks/ROADMAP.md`), so a relative link from a deck (e.g. `../ROADMAP.md`)
404s on the live site even though it resolves correctly on disk. Link to the
GitHub source instead:
`https://github.com/upex-galaxy/agentic-dev-boilerplate/blob/main/packages/decks/ROADMAP.md`
(same pattern `pages-home/index.html`'s footer already uses).

## Design tokens — "Planos"

Every deck and the homepage share this token block so the whole hub reads as
one system even though there is no shared CSS file (each HTML is standalone by
design — see `ROADMAP.md`'s "fuente de verdad" note on why: a deck must survive
being opened as a lone file, emailed, or archived, with zero broken references).
Copy this verbatim into a new deck's `:root`, then only add deck-local classes.

```css
:root {
  --paper: #e8ecf1;
  --paper-2: #dee5ed;
  --surface: #f5f8fb;
  --surface-2: #ffffff;
  --ink: #172236;
  --ink-soft: #4a5873;
  --ink-faint: #5e6e88;
  --line: rgba(23, 34, 54, 0.14);
  --line-soft: rgba(23, 34, 54, 0.08);
  --blue: #1e56a8; /* el plan / el sistema */
  --blue-2: #2f72ce;
  --blue-wash: rgba(30, 86, 168, 0.08);
  --blue-solid: #1e56a8; /* white-text fills — fixed, does NOT change in dark mode */
  --signal: #c2410c; /* la corrección / lo que requiere atención humana */
  --signal-2: #ea580c;
  --signal-wash: rgba(194, 65, 12, 0.09);
  --signal-solid: #9a3412; /* white-text fills — fixed, does NOT change in dark mode */
  --agent: #6d28d9; /* el agente de IA operando dentro del plan */
  --agent-wash: rgba(109, 40, 217, 0.08);
  --agent-solid: #6d28d9; /* white-text fills — fixed, does NOT change in dark mode */
  --good: #15803d;
  --warn: #b45309;
  --font-display: 'Iowan Old Style', 'Palatino Linotype', Palatino, 'Book Antiqua', Georgia, serif;
  --font-body:
    -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Helvetica Neue', system-ui, sans-serif;
  --font-mono:
    ui-monospace, 'SF Mono', 'JetBrains Mono', 'Cascadia Code', Menlo, Consolas, monospace;
}
@media (prefers-color-scheme: dark) {
  :root {
    --paper: #0b1220;
    --paper-2: #0e1626;
    --surface: #121b2e;
    --surface-2: #16213a;
    --ink: #e4e9f2;
    --ink-soft: #9fb0c9;
    --ink-faint: #7e8caa;
    --line: rgba(160, 180, 210, 0.16);
    --line-soft: rgba(160, 180, 210, 0.09);
    --blue: #6fa8ff;
    --blue-2: #8cbbff;
    --blue-wash: rgba(111, 168, 255, 0.11);
    --signal: #fb923c;
    --signal-2: #fdba74;
    --signal-wash: rgba(251, 146, 60, 0.12);
    --agent: #c4b5fd;
    --agent-wash: rgba(196, 181, 253, 0.12);
    --good: #4ade80;
    --warn: #fbbf24;
  }
}
```

Both `flujo-mockups.es.html` and `pages-home/index.html` also carry an explicit
`:root[data-theme="light"]` / `:root[data-theme="dark"]` override pair (same
values as above) so a manual theme-toggle button wins over the OS preference in
both directions — copy that block too, not just the media query.

**The `-solid` tokens never get redeclared in the dark overrides — that's the
point.** `--blue`/`--signal`/`--agent` lighten in dark mode (correct for links
and body text on the dark paper), but that same lighter value drops white-text
solid fills (chat bubbles, `::selection`, filled buttons) below WCAG AA
contrast — measured as low as 2.26:1 in an earlier draft of this hub. Any
component that puts white text on a solid `--blue`/`--signal`/`--agent`
background must use the matching `-solid` variant instead, which stays fixed
across both themes precisely so it never needs a dark-mode override.

**Why "Planos" (blueprints) as the brand**: the whole repo's Critical Rule #2 is
"plan before coding" — every skill produces a written plan before it produces
code (an impl plan, a `master-design-plan.md`, an epic breakdown). The visual
language literalizes that: architect's paper, ink, a blue plan-line, and a rust
"signal" mark for whatever still needs a human decision. The third color,
`--agent`, is the one thing this hub's palette has that a real blueprint
wouldn't — it marks where the AI agent is the one holding the pencil.

**Why zero external requests, not even Google Fonts**: a deck is meant to
survive being opened as a lone file offline, years from now, with no
dependency resolution. System font stacks only.

## Shared JS pattern (copy, don't import — no shared file by design)

Every deck ships the same three self-contained IIFEs: theme toggle (reads/sets
`data-theme` on `<html>`, respects `prefers-color-scheme` and
`prefers-reduced-motion`), a hero reveal animation, and an `IntersectionObserver`
scroll-reveal for `.r` elements. See `flujo-mockups.es.html`'s closing
`<script>` block for the reference implementation — copy it verbatim into new
decks and only touch the DOM ids it targets if a deck's hero markup differs.
