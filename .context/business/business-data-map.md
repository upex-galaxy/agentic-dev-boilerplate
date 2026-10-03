# Business Data Map — placeholder

> **Run `/project-context data` to populate or refresh this file (skill `project-context`; Claude Code slash form shown, other harnesses invoke the skill and mode in prose).**

This file is the canonical **visual + narrative map** of the system under development — entities, business flows, state machines, automatic processes, and external integrations — so developers can plan implementation against real domain context instead of guessing.

- **Hard inputs**: DB schema (read via Supabase MCP), backend repo, frontend repo.
- **Soft inputs**: PRD (`.context/PRD/`), SRS (`.context/SRS/`), package dependencies.
- **Consumed by**: `/project-context features`, `/project-context api`, `/project-context master-plan` (the full dependency cascade reads from here), and every `/sprint-development` cycle when planning a story.

Once generated, this file replaces the placeholder with the full structure: executive summary, entity map, business flows, state machines, automatic processes (DB triggers / cron / webhooks), and external integrations. Treat the populated version as the **most valuable context file in the repo** for downstream planning.

See `.agents/skills/project-context/references/data.md` for the exact output contract.
