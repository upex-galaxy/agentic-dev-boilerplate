# Guía de Configuración MCP por host

Referencia de sintaxis para los tres hosts del contrato (`.agents/instructions/10-harnesses.md` §5.5): **Claude Code**, **OpenCode** y **Codex CLI + Desktop**. Qué servidores corre el repo, cómo llegan las credenciales y cómo sumar uno opt-in está en [`README.md`](./README.md); esta página es el detalle por host.

---

## Tabla de Contenidos

1. [Resumen de Formatos](#resumen-de-formatos)
2. [Variables y secretos](#variables-y-secretos)
3. [Claude Code](#claude-code)
4. [OpenCode](#opencode)
5. [Codex CLI + Desktop](#codex-cli--desktop)
6. [DBHub (SQL)](#dbhub-sql)
7. [OpenAPI](#openapi)
8. [Postman](#postman)
9. [Token de Supabase para llamar a la API](#token-de-supabase-para-llamar-a-la-api)
10. [Troubleshooting](#troubleshooting)

---

## Resumen de Formatos

| Host                | Archivo de proyecto  | Archivo global                     | Formato |
| ------------------- | -------------------- | ---------------------------------- | ------- |
| **Claude Code**     | `.mcp.json`          | `~/.claude.json` (scope `user`)    | JSON    |
| **OpenCode**        | `opencode.jsonc`     | `~/.config/opencode/opencode.json` | JSONC   |
| **Codex CLI + Desktop** | `.codex/config.toml` (solo en un repo trusted) | `~/.codex/config.toml` | TOML |

**En este repo** los tres archivos de proyecto están commiteados con el mismo conjunto de servidores: el que declara `.mcp.json`. `bun run agents:compat:check` los normaliza y compara; un servidor que falte en un host, o que exista en uno solo, falla el gate. Los servidores que trae el boilerplate (`KNOWN_MCP_IDS` en `cli/lib/agent-compatibility-contracts.ts`) reciben además un chequeo estricto de forma por host; cualquier otro, solo el chequeo genérico de variables de `.env`.

### Diferencias Clave

| Característica | Claude Code     | OpenCode                    | Codex                                                    |
| -------------- | --------------- | --------------------------- | -------------------------------------------------------- |
| Root key       | `mcpServers`    | `mcp`                       | `mcp_servers`                                            |
| Command        | string + `args` | array                       | string + `args`                                          |
| Env vars key   | `env`           | `environment`               | `env_vars` (por nombre) + `[mcp_servers.X.env]` (literales) |
| Secreto        | `${VAR}`        | `{file:.auth/opencode/VAR}` | por nombre: `env_vars` / `bearer_token_env_var`          |
| Remote type    | `type: "http"`  | `type: "remote"`            | `url`                                                    |
| Enable/disable | N/A             | `enabled`                   | `enabled`                                                |

---

## Variables y secretos

Los templates de este directorio usan `{{VARIABLE}}` solo como marcador de buscar y reemplazar: ningún host lo entiende en runtime. Un secreto se reemplaza por la referencia nativa del host y su valor vive en `.env` (gitignored):

| Host        | Referencia                                                                                   | Dónde funciona                                    | Si la variable falta                                   |
| ----------- | -------------------------------------------------------------------------------------------- | ------------------------------------------------- | ------------------------------------------------------ |
| Claude Code | `${VAR}` o `${VAR:-default}`                                                                  | `command`, `args`, `env`, `url`, `headers`        | pasa `${VAR}` literal; el server falla en su primera llamada autenticada |
| OpenCode    | `{file:.auth/opencode/VAR}` (valor que escribe `bun run harness:env`); `{env:VAR}` lee el entorno del proceso | cualquier string del config (sustitución textual) | archivo vacío → `""`; archivo inexistente → el config ENTERO es inválido |
| Codex       | `env_vars = ["VAR"]` (stdio) / `bearer_token_env_var = "VAR"` (HTTP). NO expande `${VAR}`     | ninguno: el secreto viaja por nombre              | la variable no se reenvía; el server falla en auth (401/403) |

**Por qué `{file:}` y no `{env:}` en OpenCode.** `{env:VAR}` se resuelve desde el entorno del proceso OpenCode, que no existe cuando se lanza desde la app de escritorio o como worker supervisado. `{file:}` lee el contenido de un archivo y no depende del entorno. `bun install` crea un placeholder vacío por cada referencia para que un clon fresco cargue; `bun run harness:env` los llena desde `.env`.

**Cargar `.env` antes de lanzar.** `bun run claude` / `bun run opencode` / `bun run codex` envuelven `dotenv -o -e .env` (el `-o` hace que `.env` gane sobre una variable heredada del shell). Un lanzamiento sin línea de comando (app de escritorio, worker supervisado) necesita `bun run harness:env` después de cada cambio de `.env`. Codex no lo necesita: sus servers stdio arrancan con un loader de `.env` (ver [Codex](#codex-cli--desktop)).

> **Regla crítica:** ningún host se niega a arrancar por una variable faltante. Un 401/403 o una falla misteriosa de una tool ES la señal. Verificá con `/mcp` dentro de la sesión, corregí `.env` y reiniciá la sesión: las variables se leen al spawnear el MCP (`AGENTS.md` Critical Rule #9).

---

## Claude Code

**Archivo de proyecto:** `.mcp.json` en el root.

```json
{
  "mcpServers": {
    "server-name": {
      "command": "npx",
      "args": ["-y", "package-name"],
      "env": {
        "API_KEY": "${API_KEY}"
      }
    },
    "remote-server": {
      "type": "http",
      "url": "https://mcp.example.com/mcp",
      "headers": {
        "Authorization": "Bearer ${API_TOKEN}"
      }
    }
  }
}
```

```bash
# Ver, habilitar, autenticar o reconectar servers (dentro de la sesión)
/mcp

# Agregar un server a tu scope de usuario (fuera de este repo)
claude mcp add --scope user server-name -- npx -y package-name
```

Un server que solo agregás vos (por ejemplo búsqueda web) va al scope `user` o como conector de claude.ai, nunca a `.mcp.json`. Guía del host: [`docs/setup/mcp/claude-code.md`](../setup/mcp/claude-code.md).

---

## OpenCode

**Archivo de proyecto:** `opencode.jsonc` en el root.

```jsonc
{
  "$schema": "https://opencode.ai/config.json",
  "mcp": {
    "server-name": {
      "type": "local",
      "command": ["npx", "-y", "package-name"],
      "environment": {
        "API_KEY": "{file:.auth/opencode/API_KEY}",
      },
      "enabled": true,
    },
    "remote-server": {
      "type": "remote",
      "url": "https://mcp.example.com/mcp",
      "headers": {
        "Authorization": "Bearer {file:.auth/opencode/API_TOKEN}",
      },
      "oauth": false,
      "enabled": true,
    },
  },
}
```

- `command` es un array (`["npx", "-y", "package"]`), nunca un string.
- Las rutas de `{file:}` son relativas a `opencode.jsonc`, así que en un worktree leen su propio `.auth/opencode/` (`bun run worktree:provision` lo regenera).
- `enabled: false` desactiva un server sin borrarlo.
- El servicio en background cachea el config resuelto por directorio: después de reescribir un valor, `opencode service restart` (o cerrá todas las sesiones).

---

## Codex CLI + Desktop

**Archivo de proyecto:** `.codex/config.toml`. Solo se carga si Codex confía en el repositorio; la confianza es estado de runtime, así que `bun run setup:doctor` la reporta como WARN. Codex CLI y Codex Desktop leen el mismo archivo. Guía del host: [`docs/setup/mcp/codex.md`](../setup/mcp/codex.md).

Codex no interpola placeholders dentro de `args` ni de `[mcp_servers.X.env]`: un `${VAR}` ahí llega al server como texto literal. Un secreto se pasa **por nombre**:

- `env_vars = ["NOMBRE", ...]` en un server stdio: reenvía esas variables al proceso hijo.
- `bearer_token_env_var = "NOMBRE"` en un server HTTP: envía `Authorization: Bearer <valor>`.
- `[mcp_servers.X.env]` queda para settings literales (`MCP_MODE = "stdio"`).

**El loader de `.env`.** `env_vars` reenvía desde el entorno del proceso Codex, y Codex Desktop abierto desde Finder o el Dock no tiene ninguno. Por eso cada server stdio del repo arranca envuelto en `bunx -p dotenv-cli@<versión> dotenv -o -e .env -- <comando real>` (la versión fijada está en `.codex/config.toml`), con `startup_timeout_sec = 30` (un `bunx` en frío más el salto del loader puede pasar los 10 s por defecto):

```toml
[mcp_servers.server-name]
command = "bunx"
enabled = true
startup_timeout_sec = 30
args = [
  "-p", "dotenv-cli@8.0.0", "dotenv", "-o", "-e", ".env", "--",
  "npx", "-y", "package-name",
]
env_vars = ["API_KEY"]

[mcp_servers.remote-server]
url = "https://mcp.example.com/mcp"
bearer_token_env_var = "API_TOKEN"
```

`bun run agents:compat:check` compara **los nombres de variables de `.env`** de los que depende cada host, no la forma del comando, así que el loader y `env_vars` pasan el gate. Un server stdio sin loader o sin `startup_timeout_sec` falla el check en el boilerplate y es WARNING en un proyecto derivado. Los bloques reales están en `.codex/config.toml`; los opt-in, ya envueltos, en [`codex.template.toml`](./codex.template.toml).

```bash
# Server global (fuera de este repo)
codex mcp add server-name -- npx -y package-name
codex mcp add remote-name --url https://mcp.example.com/mcp
codex mcp login remote-name

# Dentro de la sesión
/mcp
```

---

## DBHub (SQL)

Opt-in. La capacidad `db` del repo la da el MCP `supabase` commiteado; DBHub se suma solo cuando un proyecto necesita SQL contra una base que ese MCP no cubre.

1. Copiá [`dbhub.example.toml`](./dbhub.example.toml) a `dbhub.toml` en el root. Usa `${VAR}`, que DBHub interpola desde el entorno al cargar, así que `dbhub.toml` se puede commitear sin secretos. Credenciales literales solo en `dbhub.local.toml` (ya gitignored).
2. Agregá `DB_HOST`, `DB_USER` y `DB_PASSWORD` a `.env` (y vacías a `.env.example`).
3. Copiá el bloque `sql` de los tres templates a `.mcp.json`, `opencode.jsonc` y `.codex/config.toml`, y corré `bun run agents:compat:check`.
4. Reiniciá la sesión y verificá con `/mcp`.

DBHub nombra sus tools con el id de la fuente (`execute_sql_<source_id>`); una variable sin definir queda como `${VAR}` literal sin error, y la conexión falla después.

---

## OpenAPI

Opt-in, para explorar la API de la app desde el agente. Para llamadas puntuales alcanza con `curl` y los tipos de `bun run api:sync` (`.agents/instructions/30-tool-resolution.md` §6, `[API_TOOL]`).

Requisitos: URL base de la API, URL del spec OpenAPI (JSON o YAML) y un bearer token ([abajo](#token-de-supabase-para-llamar-a-la-api)).

> **IMPORTANTE:** el flag `--tools dynamic` es obligatorio. Sin él, el server responde 400.

Bloques en los tres templates (`openapi`). Reemplazá `{{API_BASE_URL}}` y `{{OPENAPI_SPEC_URL}}` por las URLs de tu entorno. El header `API_HEADERS` lleva el token dentro del valor: en Claude Code y OpenCode referenciá la variable con la sintaxis del host; en Codex poné el valor entero (`API_HEADERS=Authorization:Bearer <token>`) en `.env` y reenvialo por nombre.

| Tool                      | Descripción                           |
| ------------------------- | ------------------------------------- |
| `list-api-endpoints`      | Lista los endpoints disponibles       |
| `get-api-endpoint-schema` | Obtiene el schema JSON de un endpoint |
| `invoke-api-endpoint`     | Ejecuta un endpoint con parámetros    |

---

## Postman

Opt-in, servidor remoto.

1. En https://www.postman.com: avatar → **Settings** → **API Keys** → **Generate API Key** (se muestra una sola vez).
2. Guardala en `.env` como `POSTMAN_API_KEY`.
3. Copiá el bloque `postman` de los tres templates. Codex la envía con `bearer_token_env_var = "POSTMAN_API_KEY"`.

Las tools cubren colecciones, requests, environments, specs, mocks y workspaces; `/mcp` lista las que expone tu versión.

---

## Token de Supabase para llamar a la API

```
CLIENTE                       SUPABASE AUTH                   API DE LA APP
   |  1. POST /auth/v1/token        |                               |
   |     { email, password }        |                               |
   | -----------------------------> |                               |
   |  2. { access_token: "eyJ..." } |                               |
   | <----------------------------- |                               |
   |  3. GET /api/<recurso>                                         |
   |     Authorization: Bearer eyJ...                               |
   | -------------------------------------------------------------> |
   |  4. 200 OK                                                     |
   | <------------------------------------------------------------- |
```

```bash
# 1. Obtener el token con la identidad de automatización del proyecto
curl -X POST 'https://<project-ref>.supabase.co/auth/v1/token?grant_type=password' \
  -H "apikey: $SUPABASE_PUBLISHABLE_KEY" \
  -H 'Content-Type: application/json' \
  -d '{"email":"<email>","password":"<password>"}'

# 2. Usar el token
curl 'https://<app-host>/api/<recurso>' \
  -H 'Authorization: Bearer <access_token del paso 1>'
```

El token dura lo que dice `expires_in` en la respuesta (en segundos). Ante un 401, pedí uno nuevo. `<project-ref>` está en `NEXT_PUBLIC_SUPABASE_URL`. `<email>` y `<password>` salen de las variables de `.env` que nombra `.agents/project.yaml` → `testing.automation_identity` (`email_var`, `password_var`): una cuenta dedicada de no producción, nunca un usuario creado a mano.

---

## Troubleshooting

### 401 / 403 o una tool que falla sin explicación

Variable faltante o vacía (ver [Variables y secretos](#variables-y-secretos)). Corregí `.env`, corré `bun run harness:env` si el lanzamiento no fue por terminal, y reiniciá la sesión.

### El MCP no aparece en `/mcp`

- Revisá la sintaxis del archivo (root key, `command` como array en OpenCode).
- Codex: confirmá que el repo es trusted.
- OpenCode: un `{file:}` que apunta a un archivo inexistente invalida todo el config; `bun install` recrea los placeholders.
- Reiniciá la sesión después de cada cambio.

### `bun run agents:compat:check` falla después de agregar un server

El server falta en alguno de los tres archivos, o depende de variables distintas en cada uno. El mensaje nombra el server y el host.

### Error 400 en OpenAPI

Falta `--tools dynamic` en los argumentos.

### Error de conexión en DBHub

- `dbhub.toml` existe en el root y sus `${VAR}` están en `.env`.
- La base es alcanzable desde tu red (Supabase: pooler en IPv4).

---

## Referencias

- [Claude Code MCP](https://docs.anthropic.com/en/docs/claude-code/mcp)
- [OpenCode Config](https://opencode.ai/docs/config/)
- [Codex MCP](https://developers.openai.com/codex/mcp/)
- [DBHub Configuration](https://dbhub.ai/config/toml)
- [OpenAPI MCP Server](https://github.com/ivo-toby/mcp-openapi-server)
