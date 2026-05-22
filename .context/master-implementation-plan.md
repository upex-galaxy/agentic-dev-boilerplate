# Master Implementation Plan — placeholder

> **Run `/master-implementation-plan` (Claude Code command) to populate or refresh this file.**

This file is the canonical high-level dev roadmap for this repo — the macro view of "what to build, in what order, and why that order matters." It sits **on top of** `business-data-map.md` and `business-feature-map.md` and converts them into a ranked implementation strategy.

- **Hard requirement**: `.context/business/business-data-map.md` must exist before the generator runs (the master plan inherits its flows, state machines, and integrations).
- **Soft input**: `.context/business/business-feature-map.md` — used to enrich each priority claim with the MVP-relevance row and CRUD signals. The generator warns if missing but still produces a plan.
- **Other inputs** (when available): PRD priorities, SRS architecture, PBI epic ROADMAPs, git history, issue tracker backlog.
- **Consumed by**: `/sprint-development` (per-story planning grounds each ticket in this roadmap), `/product-management` (epic-creation pulls Master Sprint 0 features here), and any human reading the dev roadmap.

Once generated, this file replaces the placeholder with the full structure: Executive value/priority map, per-Master-Sprint implementation rationale, feature dependency cascade, hidden feature → feature couplings, external integrations roadmap, edge implementation cases, pre-ship checklist, out-of-scope boundaries, and implementation gaps.

See `.claude/commands/master-implementation-plan.md` for the exact output contract and the prioritization heuristics (user value × urgency × blocking factor).
