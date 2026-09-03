# Business Feature Map — placeholder

> **Run `/business-feature-map` (Claude Code command) to populate or refresh this file.**

This file is the canonical **feature-centric inventory** of the system — every feature catalogued by domain with status, maturity, CRUD coverage, API endpoints, UI components, third-party integrations, and feature flags. The complement to `business-data-map.md` (data-centric) and `business-api-map.md` (journey-centric).

- **Soft gate**: `business-data-map.md` should exist first; the feature map enriches its entities with capability detail.
- **Inputs**: API routes, frontend pages, DB schema, backend services, feature flags, env vars, WIP signals (TODOs, stub handlers, recent branches).
- **Consumed by**: `/master-implementation-plan` (uses MVP-relevance + dependency tags to rank waves), `/product-management` (backlog seeding from the feature catalog), `/sprint-development` (per-story planning grounds scope in the inventory).

Once generated, this file replaces the placeholder with: feature identification + status/maturity (Stable / Beta / Planned / WIP / Deprecated), CRUD matrix per entity, API endpoint inventory grouped by domain, UI component / page inventory, third-party integrations, feature flags + WIP signals, and discovery gaps.

See `.agents/skills/project-context/references/features.md` for the exact output contract.
