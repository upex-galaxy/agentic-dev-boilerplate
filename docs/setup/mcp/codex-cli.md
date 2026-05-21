# Configuración de MCP para Codex CLI

**Codex CLI** es una herramienta de terminal potente para programación asistida por IA que soporta integración nativa con MCP a través de TOML.

> 💡 Para conceptos generales de MCP, consulta [MCP - Guía General](./README.md)

---

## 🚀 Quick Start

### Archivos de Configuración

- **Configuración Global (Usuario)**: `~/.codex/config.toml` (Recomendada para la mayoría de MCPs).
- **Configuración de Proyecto**: `.codex/config.toml` en la raíz de tu proyecto. **Advertencia**: Utiliza esta ubicación local solo en **proyectos trusted** (de confianza), ya que Codex leerá y ejecutará las configuraciones definidas aquí.

### El rol de AGENTS.md

A diferencia de Claude Code, que lee automáticamente `CLAUDE.md`, Codex CLI no debe asumirse leyendo `CLAUDE.md` por defecto. En este repositorio, las reglas generales y agnósticas de seguridad para todos los agentes residen en `AGENTS.md`. Familiarízate con este archivo para entender el manejo de memoria en `.context/` y `.agents/`.

---

## 📝 Configuración de MCPs

### Método 1: Mediante CLI (Recomendado)

#### Agregar servidor stdio local

```bash
codex mcp add myserver -- npx -y @mypackage/mcp-server
```

#### Ver ayuda y comandos disponibles

```bash
codex mcp --help
```

#### Comandos en sesión

Dentro de una sesión activa de Codex CLI, puedes usar:

```bash
/mcp
```

Para listar los servidores MCP disponibles y su estado.

### Método 2: Edición Manual de config.toml

Codex utiliza el formato TOML. La estructura básica define un servidor bajo `[mcp_servers.nombre_del_servidor]`.

#### Servidor stdio Local

```toml
[mcp_servers.playwright]
command = "npx"
args = ["-y", "@playwright/mcp@latest"]
```

Si el servidor requiere variables de entorno, se definen en las siguientes subsecciones:
- `env`: define pares clave/valor para el proceso del servidor MCP.
- `env_vars`: permite reenviar variables existentes del entorno local de Codex al servidor MCP.

```toml
[mcp_servers.database]
command = "npx"
args = ["-y", "my-db-mcp-server"]

[mcp_servers.database.env]
DB_HOST = "localhost"
```

#### Servidor HTTP Remoto

Para servidores HTTP (Streamable), se utiliza la clave `url` en lugar de `command` y `args`. Para manejar la autenticación (Bearer tokens) sin guardar secretos en el TOML, Codex provee el campo `bearer_token_env_var`:

```toml
[mcp_servers.postman]
url = "https://mcp.postman.com/mcp"
bearer_token_env_var = "POSTMAN_API_KEY"
```

De esta forma, Codex leerá el valor de la variable de entorno `POSTMAN_API_KEY` desde tu entorno local y lo usará como cabecera HTTP `Authorization: Bearer ...`.

---

## 🛠 Skills en Codex CLI

Codex CLI soporta *skills* basadas en el formato estándar `SKILL.md`.

Una skill se organiza como una carpeta que contiene un archivo obligatorio `SKILL.md` y, opcionalmente, directorios como `scripts/`, `references/` y `assets/`.

En este repositorio, las skills existentes viven actualmente en `.claude/skills/` para preservar el flujo de Claude Code. Esta PR no mueve esas skills ni cambia su carga automática; solo documenta cómo preparar el boilerplate para compatibilidad opcional con Codex. Una PR futura podría exponerlas mediante ubicaciones nativas de Codex o ubicaciones compartidas como `.agents/skills/`.

---

## 🐛 Troubleshooting

### Error al cargar el archivo de configuración

- **Causa**: Error de sintaxis TOML.
- **Solución**: Verifica que los *arrays* usen corchetes (ej. `args = ["-y", "pkg"]`) y que las cadenas usen comillas dobles. Las subsecciones de entorno (`[mcp_servers.nombre.env]`) deben ir debajo de la declaración principal del servidor.

### "No authentication token provided" o Fallo 401 en HTTP

- **Causa**: La variable de entorno referenciada en `bearer_token_env_var` no está definida en la terminal antes de lanzar Codex.
- **Solución**: Asegúrate de exportar la variable explícitamente o iniciar Codex desde una shell que ya tenga el entorno cargado. Evita escribir tokens reales en la documentación o en archivos versionados.

### MCP no aparece o falla al iniciar

- **Solución**: Revisa los logs de inicio de Codex. Asegúrate de tener instalado `node` o `npx` y de que el comando base especificado en `command` sea accesible en el `PATH` desde la terminal donde ejecutas Codex.

---

## 💡 Mejores Prácticas

1. **Evitar Secretos en Código**: Nunca uses valores literales para API keys dentro de `config.toml`, ni siquiera si el proyecto usa gitignore. Usa `bearer_token_env_var` para HTTP, o inyecta variables de entorno a nivel del sistema operativo para servidores locales.
2. **Global vs Local**: Prefiere configurar MCPs de uso general (como Context7, Postman, Playwright) en `~/.codex/config.toml` para que estén disponibles en todos tus proyectos. Usa `.codex/config.toml` solo para servidores hiper-específicos del proyecto.
3. **Validar antes de Commitear**: Si añades `.codex/config.toml` a un repositorio de equipo, asegúrate de que esté libre de configuración personal que afecte a otros desarrolladores.

---

**Última actualización**: 2026-05-21
