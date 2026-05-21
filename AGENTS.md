# AGENTS.md — Project AI Agent Instructions

> **Audience**: AI Coding Agents (Codex CLI, OpenCode, Cursor, etc.) and humans integrating new agents into this boilerplate.

## Overview
This repository (`agentic-dev-boilerplate`) is designed to support multiple AI coding agents. While it contains tool-specific files such as `CLAUDE.md`, the core architecture relies on agent-agnostic structures:
- `.agents/`: Shared project variables and Jira catalogs.
- `.context/`: Shared project memory (Business, PRD, SRS, PBIs).
- `docs/`: Human-readable methodology and workflows.
- `.claude/skills/`: Reusable workflow skills written in the `SKILL.md` format. These are currently stored under the Claude Code directory and may be exposed to other agents through Codex-native or future shared skill locations.

## Important Rules for All AI Agents

### 1. Multi-Agent Compatibility
- Do NOT assume you are the only agent operating in this repository.
- **Do not automatically read `CLAUDE.md`** as your primary system prompt unless you are specifically Claude Code or configured to do so. Other agents should refer to this `AGENTS.md` file for baseline rules, and load specific context files when executing tasks.

### 2. Security & Privacy
- **NEVER** read, print, or expose `.env` files, API tokens, auth files, cookies, storage states, or database connection strings.
- Always redact sensitive information if you encounter it during error debugging.

### 3. Execution & Git Rules
- Make surgical, small changes.
- ALWAYS show a diff or summary of changes.
- **NEVER** execute `git add`, `git commit`, `git push`, `git rebase`, or `git merge` without explicit confirmation from the human user.
- Prefer explicit CLI tools and scripts defined in `package.json`.

## Skill Execution
Workflow skills in this repository (currently located in `.claude/skills/` to preserve the existing Claude Code workflow) use a standardized format (e.g., `SKILL.md`). Agents capable of loading skills from arbitrary paths can use these. A future PR may expose them through Codex-native or shared locations such as `.agents/skills/`.

Always rely on empirical verification (running tests, type-checking, linting) after applying code changes.
