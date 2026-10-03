# Troubleshooting: Supabase Connections and the Database MCP

Common issues when connecting to a Supabase database, from your own code or through the AI's `db` capability (the `supabase` MCP server), and how to solve them.

---

## Supabase MCP Issues

The AI reaches the database through the `supabase` server declared in `.mcp.json`, `opencode.jsonc` and `.codex/config.toml`. It reads `SUPABASE_ACCESS_TOKEN`, `NEXT_PUBLIC_SUPABASE_URL`, `SUPABASE_PUBLISHABLE_KEY` and `SUPABASE_SECRET_KEY` from `.env`.

### A 401 / 403, or a tool call that fails for no visible reason

**Cause:** a credential is missing or stale. The failure is silent at startup: on Claude Code an unset `${VAR}` is passed through as the literal text and the server only dies on its first authenticated call (`AGENTS.md` Critical Rule #9).

**Solution:**

1. Run `/mcp` inside the session: it shows whether `supabase` connected and with which tools
2. Fix the value in `.env` (names are in `.env.example`)
3. If the session was launched without a command line (desktop app, a supervised worker), run `bun run harness:env` so the per-harness credential files are regenerated from `.env`; `bun run harness:env:check` reports drift by variable name
4. **Restart the agent session.** MCP servers read the environment once, when they spawn. On OpenCode also run `opencode service restart`: its background service caches the resolved config

Launching through the `package.json` wrappers (`bun run claude`, `bun run opencode`, `bun run codex`) makes `.env` win over a stale variable inherited from your shell.

### MCP shows as "failed" in Claude Code

1. **View error details:**

   ```bash
   claude mcp get supabase
   ```

2. **Test the command directly:** copy the server's command from `.mcp.json`, replace the `${VAR}` references with real values in your terminal (never in the file), and run it to see the actual error.

### A server added to one harness only

Every server must exist in all three harness configs with the same `.env` dependencies. `bun run agents:compat:check` fails naming the server and the harness that lacks it.

---

## Database Connection Issues

### Error: `ENETUNREACH` with an IPv6 address

**Symptom:**

```
Failed to connect to PostgreSQL database: Error: connect ENETUNREACH 2600:1f18:...:5432
```

**Cause:** your network only supports IPv4, and the direct connection (`db.<project-ref>.supabase.co`) resolves to IPv6 only.

**Solution:** use one of the poolers, which accept IPv4.

| Type                  | Host                                 | Port |
| --------------------- | ------------------------------------ | ---- |
| ❌ Direct connection  | `db.<project-ref>.supabase.co`       | 5432 |
| ✅ Session pooler     | `aws-0-<region>.pooler.supabase.com` | 5432 |
| ✅ Transaction pooler | `aws-0-<region>.pooler.supabase.com` | 6543 |

**How to get the pooler string:**

1. Supabase Dashboard → Project Settings → Database
2. Change **Method** from "Direct connection" to "Transaction" or "Session"
3. Copy the new connection string

Or enable the **IPv4 Add-on** to keep using the direct connection.

---

### Error: `bash: !@...: event not found`

**Symptom:**

```bash
psql "postgresql://postgres.<project-ref>:Password!@host..."
bash: !@host: event not found
```

**Cause:** Bash interprets `!` as a history command inside double quotes.

**Solution:** use **single quotes** in Bash:

```bash
# ❌ Incorrect (double quotes)
psql "postgresql://postgres.<project-ref>:Pass!@host:6543/postgres"

# ✅ Correct (single quotes)
psql 'postgresql://postgres.<project-ref>:Pass!@host:6543/postgres'
```

| Terminal       | Quotes for a connection string | Escape `!`    |
| -------------- | ------------------------------ | ------------- |
| **PowerShell** | Double `"..."`                 | Not necessary |
| **CMD**        | Double `"..."`                 | Not necessary |
| **Git Bash**   | Single `'...'`                 | Or use `\!`   |
| **WSL**        | Single `'...'`                 | Or use `\!`   |

---

### Error: `Password authentication failed`

**Possible causes:**

1. **Incorrect password:** verify it in Supabase Dashboard → Settings → Database
2. **Wrong user format for the pooler:** the pooler user is `<role>.<project-ref>`, the direct connection user is just `postgres`

**Correct format for the pooler:**

```
postgresql://postgres.<project-ref>:<password>@aws-0-<region>.pooler.supabase.com:6543/postgres
```

---

### Error: `too many connections`

**Cause:** serverless functions (Vercel) open a connection per invocation.

**Solution:** connect through the transaction pooler (port `6543`) and reuse one client per process.

---

## Database Permission Issues

### Error: `permission denied for table`

**Cause:** the role the request runs as has no grant on the table, or an RLS policy filters every row.

**Solution:**

1. Requests from the app run as `anon` or `authenticated`: check the table's RLS policies first (a missing policy means no rows, not an error, for `SELECT`)
2. Grants and policies are schema changes: write them as a migration, never as a one-off edit in the SQL Editor, so every environment gets the same change

```sql
-- Example grant, inside a migration
GRANT SELECT, INSERT, UPDATE, DELETE ON public.orders TO authenticated;
```

### Error: `permission denied for sequence`

**Cause:** missing permission on the sequence behind an auto-incremental ID.

**Solution (inside a migration):**

```sql
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO authenticated;
```

---

## Quick Connection Verification

```bash
# With psql (if installed)
psql 'postgresql://postgres.<project-ref>:<password>@aws-0-<region>.pooler.supabase.com:6543/postgres'

# With curl (verify that the REST API responds)
curl -I "https://<project-ref>.supabase.co/rest/v1/" -H "apikey: <SUPABASE_PUBLISHABLE_KEY>"
```

---

## If You Added DBHub (opt-in)

DBHub is not part of the committed server set. When a project adds it from the blocks in `docs/mcp/`:

- Include `--transport stdio` in its arguments, or the host cannot talk to it
- On Windows, its native dependency (`better-sqlite3`) needs Python and build tools; running it with `bunx`, under WSL, or from the `bytebase/dbhub` Docker image avoids the compile step
- If `npx` fails with `EPERM` while cleaning its cache on Windows, run `npm cache clean --force` from an elevated PowerShell and retry

---

## Troubleshooting Checklist

- [ ] Does `/mcp` show the `supabase` server connected?
- [ ] Are the variables it needs set in `.env`, and did you restart the session after changing them?
- [ ] For a desktop or worker launch, did you run `bun run harness:env`?
- [ ] Are you connecting through a pooler if your network has no IPv6?
- [ ] Is the pooler user in the `<role>.<project-ref>` format?
- [ ] Did you use **single quotes** in Bash?
- [ ] Does the role have the grants and RLS policies the query needs?
