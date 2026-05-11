# Business API Map — placeholder

> **Run `/business-api-map` (Claude Code command) to populate or refresh this file.**

This file is the canonical **business-first map of how the API powers user journeys** — the permission/auth model, critical journeys traced as end-to-end API call chains, the architecture behind the API (services, persistence, boundaries), and external integrations at the API boundary. The narrative complement to `business-data-map.md` (data-centric) and `business-feature-map.md` (capability-centric).

- **Soft gates**: `business-data-map.md` and `business-feature-map.md` — the API map cross-references both. Generator warns if missing but still produces a map.
- **Inputs**: OpenAPI spec, auth middleware, controllers, backend services. NOT a raw endpoint catalog — that lives in `api/schemas/` after `bun run api:sync`.
- **Consumed by**: `/master-implementation-plan` (auth-model decisions block features), `/sprint-development` (per-story planning grounds API touch points in the auth + journey model).

Once generated, this file replaces the placeholder with: permission and auth model (tiers, token flow, where enforcement lives), critical business journeys traced as API call chains, the architecture behind the API (services, persistence, boundaries), and external integrations at the API boundary.

See `.claude/commands/business-api-map.md` for the exact output contract.
