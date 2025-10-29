# Guía Completa de Configuración de Model Context Protocol (MCP) en Agentes de IA

## Tabla de Contenidos
1. [Conceptos Fundamentales](#conceptos-fundamentales)
2. [Tipos de Transporte MCP](#tipos-de-transporte-mcp)
3. [Gemini CLI](#gemini-cli)
4. [Claude Code](#claude-code)
5. [GitHub Copilot CLI](#github-copilot-cli)
6. [Cline (Extensión VS Code)](#cline-extensión-vs-code)
7. [VS Code con GitHub Copilot](#vs-code-con-github-copilot)
8. [Autenticación y Seguridad](#autenticación-y-seguridad)
9. [Comparativa Rápida](#comparativa-rápida)
10. [Casos de Uso y Ejemplos](#casos-de-uso-y-ejemplos)

---

## Conceptos Fundamentales

### ¿Qué es MCP?

**Model Context Protocol (MCP)** es un estándar abierto que define cómo los modelos de lenguaje (LLMs) se conectan e interactúan con herramientas externas y fuentes de datos. Funciona como un puente universal entre asistentes de IA y servicios externos.

**Analogía**: MCP es al ecosistema de IA lo que HTTP es a la web. Crea un lenguaje común que permite a cualquier cliente de IA comunicarse con cualquier fuente de datos o herramienta.

### Componentes de MCP

**Cliente MCP**: La aplicación que usa el modelo de IA (Gemini CLI, Claude Code, GitHub Copilot, etc.)

**Servidor MCP**: Un programa que expone herramientas, recursos y capacidades específicas al cliente

**Transporte**: El método de comunicación entre cliente y servidor (stdio, SSE, HTTP)

**Herramientas (Tools)**: Funciones que el servidor expone y que el modelo puede invocar

**Recursos (Resources)**: Datos que el servidor puede proporcionar (archivos, APIs, bases de datos)

**Prompts**: Plantillas predefinidas que el servidor puede ofrecer

**JSON-RPC**: Protocolo de llamada a procedimientos remotos usado por MCP para estructurar mensajes

### Conceptos Clave de Transporte

**stdio (Standard Input/Output)**: Comunicación a través de flujos estándar de entrada/salida. El servidor se ejecuta como un proceso local y se comunica mediante stdin/stdout.

**SSE (Server-Sent Events)**: Protocolo unidireccional del servidor al cliente sobre HTTP. El servidor puede enviar actualizaciones en tiempo real al cliente sin que este haga nuevas peticiones.

**HTTP Streamable**: Usa HTTP POST para llamadas cliente-servidor y SSE para streaming servidor-cliente. Soporta autenticación estándar (tokens bearer, API keys, OAuth).

**Stateful vs Stateless**: MCP es inherentemente stateful. Una vez inicializado, mantiene una sesión que permite múltiples llamadas RPC sin reinicializar.

---

## Tipos de Transporte MCP

### 1. stdio (Standard Input/Output)

**Uso principal**: Servidores locales que corren en la misma máquina que el cliente

#### Características

- **Latencia**: Mínima (sin overhead de red)
- **Seguridad**: Alta (comunicación local)
- **Escalabilidad**: Limitada (un proceso por cliente)
- **Autenticación**: No requiere (proceso local)
- **Complejidad**: Baja

#### Cuándo usar stdio

- Desarrollo local y pruebas
- Acceso a recursos del sistema de archivos local
- Herramientas de línea de comandos
- Entornos de un solo usuario
- Cuando el rendimiento es crítico

#### Formato de configuración típico

```json
{
  "mcpServers": {
    "nombre-servidor": {
      "command": "node",
      "args": ["/ruta/a/servidor.js"],
      "env": {
        "API_KEY": "valor"
      }
    }
  }
}
```

### 2. SSE (Server-Sent Events)

**Uso principal**: Servidores remotos con comunicación unidireccional servidor→cliente

#### Características

- **Latencia**: Media (overhead de red HTTP)
- **Seguridad**: Media (requiere HTTPS en producción)
- **Escalabilidad**: Media (conexiones long-running)
- **Autenticación**: Soporta headers HTTP, tokens bearer
- **Complejidad**: Media

#### Cuándo usar SSE

- Servidores remotos con actualizaciones en tiempo real
- Cuando no se soporta HTTP Streamable
- Integraciones de terceros que solo ofrecen SSE
- Prototipado rápido de servicios remotos

#### Estado actual

**IMPORTANTE**: SSE está siendo deprecado en favor de HTTP Streamable. Muchos servidores y clientes están eliminando soporte para SSE.

#### Formato de configuración típico

```json
{
  "mcpServers": {
    "servidor-remoto": {
      "type": "sse",
      "url": "https://api.ejemplo.com/mcp",
      "headers": {
        "Authorization": "Bearer token"
      }
    }
  }
}
```

### 3. HTTP Streamable (Recomendado para Producción)

**Uso principal**: Servidores remotos escalables y stateless

#### Características

- **Latencia**: Media-baja (HTTP optimizado)
- **Seguridad**: Alta (OAuth 2.0, API keys, tokens)
- **Escalabilidad**: Alta (stateless, balanceo de carga)
- **Autenticación**: OAuth 2.0, API keys, custom headers
- **Complejidad**: Media-alta

#### Cuándo usar HTTP Streamable

- **Producción** (siempre que sea posible)
- Múltiples usuarios
- Servicios en la nube
- Cuando se requiere balanceo de carga
- Integraciones empresariales

#### Ventajas sobre SSE

- Mejor escalabilidad (stateless)
- Autenticación más robusta
- Soporte para balanceadores de carga
- Reconexión automática más confiable

#### Formato de configuración típico

```json
{
  "mcpServers": {
    "servidor-http": {
      "type": "streamable-http",
      "url": "https://api.ejemplo.com/mcp",
      "headers": {
        "Authorization": "Bearer ${input:token}"
      }
    }
  }
}
```

---

## Gemini CLI

**Descripción**: CLI oficial de Google para interactuar con Gemini usando comandos de terminal.

### Archivos de Configuración

- **macOS/Linux**: `~/.gemini/settings.json`
- **Windows**: `%USERPROFILE%\.gemini\settings.json`
- **Proyecto específico**: `.gemini/settings.json` (en la raíz del proyecto)

### Métodos de Configuración

#### 1. Mediante CLI (Recomendado)

```bash
# Agregar servidor stdio local
gemini mcp add myserver --command "python3 my_server.py" --port 8080

# Agregar servidor HTTP remoto
gemini mcp add --transport http context7 https://context7.example.com

# Listar servidores configurados
gemini mcp list

# Eliminar servidor
gemini mcp remove myserver
```

#### 2. Edición Manual de settings.json

##### Servidor stdio Local

```json
{
  "mcpServers": {
    "firebase": {
      "command": "npx",
      "args": ["-y", "firebase-tools@latest", "mcp"],
      "env": {
        "FIREBASE_TOKEN": "tu-token"
      }
    }
  }
}
```

##### Servidor HTTP/SSE Remoto

```json
{
  "mcpServers": {
    "figma": {
      "type": "http",
      "url": "https://mcp.figma.com/",
      "headers": {
        "Authorization": "Bearer ${FIGMA_TOKEN}"
      }
    }
  }
}
```

##### Servidor con Variables de Entorno

```json
{
  "mcpServers": {
    "database-tools": {
      "command": "python",
      "args": ["server.py"],
      "env": {
        "DB_HOST": "localhost",
        "DB_PORT": "5432",
        "DB_USER": "admin"
      },
      "cwd": "./mcp_tools/python",
      "timeout": 15000
    }
  }
}
```

### Transportes Soportados

- ✅ **stdio**: Totalmente soportado
- ✅ **SSE**: Soportado (en deprecación)
- ✅ **HTTP Streamable**: Totalmente soportado

### Comandos Útiles en Sesión

```bash
# Ver servidores y herramientas disponibles
/mcp

# Ver descripción de servidor específico
/mcp desc nombre-servidor

# Autenticar servidor con OAuth
/mcp auth nombre-servidor

# Listar todos los servidores
/mcp list
```

### Extensiones de Gemini CLI

Gemini CLI soporta **extensiones** que empaquetan:
- Uno o más servidores MCP
- Archivos de contexto personalizados
- Comandos slash personalizados
- Herramientas excluidas/incluidas

```bash
# Instalar extensión (ejemplo: Firebase)
gemini extension install firebase

# Listar extensiones instaladas
gemini extension list
```

### Ejemplo Completo: Integración con Firebase

```bash
# Opción 1: Instalar extensión (recomendado)
gemini extension install firebase

# Opción 2: Configuración manual
# Editar ~/.gemini/settings.json
```

```json
{
  "mcpServers": {
    "firebase": {
      "command": "npx",
      "args": ["-y", "firebase-tools@latest", "mcp"]
    }
  }
}
```

### Características Especiales

- **Auto-discovery**: Detecta automáticamente configuraciones de otros clientes MCP
- **Gestión de contexto**: Memoria conversacional y ramificación
- **Integración VS Code**: Extensión disponible para VS Code
- **Custom slash commands**: Permite crear comandos personalizados

---

## Claude Code

**Descripción**: Herramienta CLI de Anthropic para codificación asistida por Claude directamente desde la terminal.

### Archivos de Configuración

Claude Code usa un sistema jerárquico de configuración:

1. **Proyecto** (`.mcp.json` en la raíz del proyecto) - Mayor prioridad
2. **Local** (`.mcp.json` en el directorio actual)
3. **Usuario** (`~/.claude.json`) - Configuración global

### Scopes de Configuración

- `user`: Global para todos los proyectos
- `project`: Específico del proyecto actual
- `local`: Directorio de trabajo actual

### Métodos de Configuración

#### 1. Mediante CLI (Recomendado)

```bash
# Agregar servidor stdio
claude mcp add -t stdio -s user mi-servidor -- npx -y @paquete/servidor

# Agregar servidor HTTP
claude mcp add --transport http --scope user firebase https://firebase.mcp.com

# Agregar servidor SSE (deprecado pero aún funcional en versiones <2.0.9)
claude mcp add --transport sse snyk https://snyk-mcp.example.com

# Listar servidores configurados
claude mcp list

# Eliminar servidor
claude mcp remove mi-servidor
```

#### 2. Edición Manual de ~/.claude.json

##### Servidor stdio Local

```json
{
  "mcpServers": {
    "snyk": {
      "type": "stdio",
      "command": "/ruta/absoluta/a/snyk",
      "args": ["mcp", "-t", "stdio"],
      "env": {}
    }
  }
}
```

##### Servidor HTTP con Autenticación

```json
{
  "mcpServers": {
    "postman": {
      "type": "http",
      "url": "https://api.postman.com/mcp",
      "headers": {
        "Authorization": "Bearer ${input:postman-api-key}"
      }
    }
  },
  "inputs": [
    {
      "id": "postman-api-key",
      "type": "promptString",
      "description": "Enter your Postman API key"
    }
  ]
}
```

##### Servidor con npx

```json
{
  "mcpServers": {
    "svelte": {
      "type": "stdio",
      "command": "npx",
      "args": ["-y", "@sveltejs/mcp"]
    }
  }
}
```

### Transportes Soportados

- ✅ **stdio**: Totalmente soportado
- ⚠️ **SSE**: **Eliminado en versiones >2.0.9** (deprecado del estándar MCP)
- ✅ **HTTP Streamable**: Totalmente soportado

### IMPORTANTE: Cambio en Versión 2.0.9+

Claude Code eliminó soporte para SSE en versiones superiores a 2.0.9. Si tienes servidores SSE:

**Solución 1**: Usar versión anterior de Claude Code
```bash
npm install -g claude-code@2.0.9
```

**Solución 2**: Usar proxy stdio-to-SSE
```json
{
  "mcpServers": {
    "atlassian-mcp": {
      "type": "stdio",
      "command": "npx",
      "args": ["@playwright/mcp@latest", "--extension"]
    }
  }
}
```

### Setup Inicial Crítico

La primera vez que uses Claude Code:

```bash
# Bypass de permisos inicial (NECESARIO)
claude --dangerously-skip-permissions
```

Esto:
- Inicializa el directorio de configuración
- Establece permisos de seguridad
- Crea tokens de autenticación
- Configura el registro de MCP

### Ejemplo Completo: Svelte MCP

```bash
# Agregar mediante CLI
claude mcp add -t stdio -s user svelte -- npx -y @sveltejs/mcp
```

**O manualmente en ~/.claude.json:**

```json
{
  "mcpServers": {
    "svelte": {
      "type": "stdio",
      "command": "npx",
      "args": ["-y", "@sveltejs/mcp"]
    }
  }
}
```

### Características Especiales

- **Sistema jerárquico**: Project > Local > User
- **Gestión de permisos**: Control granular de acceso
- **Registry de MCP**: Acceso a servidores verificados
- **Variables de entrada**: Soporte para inputs interactivos

---

## GitHub Copilot CLI

**Descripción**: CLI oficial de GitHub para interactuar con Copilot desde la terminal, con capacidades agentic.

### Archivos de Configuración

- **Principal**: `~/.copilot/mcp-config.json`
- **Otros archivos**:
  - `~/.copilot/config.json` - Preferencias generales
  - `~/.copilot/command-history-state.json` - Historial
  - `~/.copilot/logs/` - Logs de depuración

### Métodos de Configuración

#### 1. Mediante Comando Interactivo

```bash
# Iniciar sesión
/mcp add
```

Esto abrirá un asistente interactivo que te pedirá:
1. **Server Name**: Nombre del servidor
2. **Server Type**: stdio / HTTP / SSE
3. **URL** (si es HTTP/SSE): URL del servidor
4. **HTTP Headers** (opcional): Para autenticación
5. **Tools**: Seleccionar herramientas específicas o todas

#### 2. Edición Manual de mcp-config.json

##### Servidor stdio Local

```json
{
  "mcpServers": {
    "context7": {
      "type": "local",
      "command": "npx",
      "args": ["-y", "@upstash/context7-mcp@latest"],
      "tools": ["*"]
    }
  }
}
```

##### Servidor HTTP Remoto

```json
{
  "mcpServers": {
    "github": {
      "type": "http",
      "url": "https://mcp.github.com/",
      "tools": ["*"]
    }
  }
}
```

##### Servidor con Autenticación

```json
{
  "mcpServers": {
    "context7": {
      "type": "http",
      "url": "https://context7.example.com",
      "headers": {
        "X-API-Key": "tu-api-key"
      },
      "tools": ["search_docs", "get_library"]
    }
  }
}
```

### Transportes Soportados

- ✅ **stdio**: Totalmente soportado (referido como "local")
- ⚠️ **SSE**: Soporte limitado (siendo deprecado)
- ✅ **HTTP**: Totalmente soportado

### Comandos en Sesión

```bash
# Ver servidores y herramientas disponibles
/mcp

# Agregar nuevo servidor
/mcp add

# Gestionar permisos de sesión
/session

# Restablecer permisos
/reset

# Agregar directorio permitido
/add-directory /ruta/al/directorio

# Cambiar modelo
/model o1
/model gpt-4o

# Habilitar modo reasoning
/model --reasoning
```

### Servidor GitHub MCP (Preconfigurado)

Copilot CLI viene con el servidor GitHub MCP ya instalado:

```bash
# Las siguientes operaciones ya están disponibles:
- Buscar issues
- Crear issues
- Listar PRs
- Leer contenido de repositorios
- Gestión de proyectos
```

### Ejemplo Completo: Configuración Multi-Servidor

```json
{
  "mcpServers": {
    "github": {
      "type": "http",
      "url": "https://mcp.github.com/",
      "tools": ["*"]
    },
    "context7": {
      "type": "local",
      "command": "npx",
      "args": ["-y", "@upstash/context7-mcp@latest"],
      "tools": ["*"]
    },
    "sequential-thinking": {
      "type": "local",
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-sequential-thinking"],
      "tools": ["*"]
    }
  }
}
```

### Características Especiales

- **Agente de GitHub**: Acceso directo a GitHub.com sin configuración
- **Gestión de permisos**: Sistema de allowlist interactivo
- **Historial persistente**: Configuración se mantiene entre sesiones
- **Modelos múltiples**: Cambio dinámico entre GPT-4o, o1, etc.

### Problema Conocido: Herramientas no Visibles

Si configuras servidores pero sus herramientas no aparecen:

1. Verifica que el servidor use `"tools": ["*"]` o liste herramientas específicas
2. Reinicia Copilot CLI completamente
3. Revisa logs en `~/.copilot/logs/`
4. Confirma que el servidor está corriendo (si es stdio local)

---

## Cline (Extensión VS Code)

**Descripción**: Extensión de VS Code que proporciona un agente de IA para codificación asistida con soporte MCP.

### Archivos de Configuración

**Global**:
- **macOS**: `~/Library/Application Support/Code/User/globalStorage/saoudrizwan.claude-dev/settings/cline_mcp_settings.json`
- **Windows**: `%APPDATA%/Code/User/globalStorage/saoudrizwan.claude-dev/settings/cline_mcp_settings.json`
- **Linux**: `~/.config/Code/User/globalStorage/saoudrizwan.claude-dev/settings/cline_mcp_settings.json`

**Proyecto específico**: `.cline/mcp_config.json` (en la raíz del proyecto)

**Alternativa**: Configuración mediante VS Code settings (`cline.mcpSettings`)

### Métodos de Configuración

#### 1. Mediante Interfaz de Cline

1. Abrir panel de Cline en VS Code
2. Ir a **MCP Servers** > **Add Server**
3. Configurar tipo (stdio/SSE/HTTP), comando y argumentos

#### 2. Edición Manual de cline_mcp_settings.json

##### Servidor stdio Local

```json
{
  "mcpServers": {
    "repomix": {
      "command": "npx",
      "args": ["-y", "repomix", "--mcp"]
    }
  }
}
```

##### Servidor SSE Remoto

```json
{
  "mcpServers": {
    "stata-mcp": {
      "url": "http://localhost:8000/sse",
      "transport": "sse"
    }
  }
}
```

##### Servidor con Ruta Absoluta

```json
{
  "mcpServers": {
    "fabric-mcp": {
      "command": "node",
      "args": ["/ruta/absoluta/a/fabric-mcp-server/build/index.js"]
    }
  }
}
```

#### 3. Mediante VS Code Settings

Editar `settings.json` de VS Code:

```json
{
  "cline.mcpSettings": {
    "repomix": {
      "command": "npx",
      "args": ["-y", "repomix", "--mcp"]
    }
  }
}
```

### Transportes Soportados

- ✅ **stdio**: Totalmente soportado
- ✅ **SSE**: Soportado
- ✅ **HTTP**: Soportado

### Ejemplo Completo: Fabric Pattern MCP

```json
{
  "mcpServers": {
    "fabric-mcp-server": {
      "command": "node",
      "args": ["/Users/tu-usuario/fabric-mcp-server/build/index.js"]
    }
  }
}
```

### Características Especiales

- **Integración VS Code**: Acceso directo desde el editor
- **Panel dedicado**: UI específica para gestión de MCPs
- **Soporte multi-proveedor**: OpenAI, Anthropic, SAP AI Core, etc.
- **Reglas de proyecto**: Sistema de guardrails con "Cline Rules"

### Cline Rules (Guardrails)

Archivo: `.clinerules` en la raíz del proyecto

```markdown
# Project Guidelines for AI Assistant

## Scope
- Solo modificar archivos en `/src`
- Nunca tocar archivos de configuración sin confirmar

## Coding Style
- Usar TypeScript strict mode
- Preferir functional components en React
- 2 espacios de indentación

## Testing
- Cada feature requiere tests
- Coverage mínimo: 80%
```

---

## VS Code con GitHub Copilot

**Descripción**: Integración nativa de GitHub Copilot en Visual Studio Code con soporte MCP completo.

### Archivos de Configuración

**Workspace**: `.vscode/mcp.json` (en la raíz del workspace)
**Global**: Configuración de usuario de VS Code

### Métodos de Configuración

#### 1. Mediante Command Palette

```
Ctrl/Cmd + Shift + P
> MCP: Add Server
```

Luego:
1. Seleccionar tipo de servidor (Command/HTTP/SSE)
2. Ingresar comando o URL
3. Elegir scope (Global/Workspace)

#### 2. Creación Manual de .vscode/mcp.json

##### Servidor stdio Local

```json
{
  "servers": {
    "memory": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-memory"]
    }
  }
}
```

##### Servidor HTTP con OAuth

```json
{
  "servers": {
    "github-mcp": {
      "type": "http",
      "url": "https://mcp.github.com/"
    }
  },
  "inputs": [
    {
      "id": "github-token",
      "type": "promptString",
      "description": "GitHub Personal Access Token",
      "password": true
    }
  ]
}
```

##### Servidor con Variables

```json
{
  "inputs": [
    {
      "type": "promptString",
      "id": "apiKey",
      "description": "Enter your API key",
      "password": true
    }
  ],
  "servers": {
    "custom-server": {
      "command": "npx",
      "args": ["-y", "@company/mcp-server"],
      "env": {
        "API_KEY": "${input:apiKey}"
      }
    }
  }
}
```

#### 3. Mediante CLI (Instalación Global)

```bash
# Instalar servidor globalmente
code --add-mcp '{"name":"my-server","command":"uvx","args":["mcp-server-fetch"]}'

# VS Code Insiders
code-insiders --add-mcp '{"name":"repomix","command":"npx","args":["-y","repomix","--mcp"]}'
```

### Transportes Soportados

- ✅ **stdio**: Totalmente soportado
- ⚠️ **SSE**: Soporte legacy (se prefiere HTTP)
- ✅ **HTTP Streamable**: Totalmente soportado (recomendado)

### Uso de MCP en Agent Mode

Una vez configurado:

1. Abrir GitHub Copilot Chat
2. Seleccionar **Agent** del dropdown de modo
3. Click en icono de herramientas para ver MCPs disponibles
4. Usar `#` para referenciar herramientas específicas

```
@workspace usa #github-search para encontrar issues relacionados con MCP
```

### Ejemplo Completo: Figma Dev Mode MCP

```bash
# Mediante Command Palette
MCP: Add Server > HTTP
```

```json
{
  "servers": {
    "figma-dev-mode": {
      "type": "http",
      "url": "http://localhost:9339/mcp"
    }
  }
}
```

**Nota**: Requiere Figma Desktop con "Enable local MCP Server" activado.

### Autodiscovery de Servidores

VS Code puede detectar automáticamente configuraciones de:
- Claude Desktop (`claude_desktop_config.json`)
- Cursor (`.cursor/mcp.json`)
- Otros clientes MCP compatibles

Habilitar en settings:
```json
{
  "chat.mcp.discovery.enabled": true
}
```

### Características Especiales

- **IntelliSense**: Autocompletado en mcp.json
- **Botones de control**: Start/Stop/Restart servers desde el editor
- **Agent mode**: Uso de herramientas en contexto
- **Dev Containers**: Soporte para configuración en contenedores

### Configuración en Dev Containers

En `.devcontainer/devcontainer.json`:

```json
{
  "customizations": {
    "vscode": {
      "mcp": {
        "servers": {
          "container-server": {
            "command": "python",
            "args": ["/workspace/mcp-server.py"]
          }
        }
      }
    }
  }
}
```

---

## Autenticación y Seguridad

### Métodos de Autenticación Soportados

#### 1. API Keys

**Uso**: Autenticación simple para prototipos y servidores propios

**Pros**:
- Fácil de implementar
- Sin dependencias externas

**Contras**:
- Menos seguro en producción
- Sin expiración automática
- Difícil de revocar granularmente

**Implementación**:

```json
{
  "mcpServers": {
    "mi-api": {
      "type": "http",
      "url": "https://api.ejemplo.com/mcp",
      "headers": {
        "X-API-Key": "api-key-secreta"
      }
    }
  }
}
```

#### 2. Bearer Tokens

**Uso**: Tokens de autenticación estándar HTTP

**Implementación**:

```json
{
  "mcpServers": {
    "servicio-auth": {
      "type": "http",
      "url": "https://servicio.com/mcp",
      "headers": {
        "Authorization": "Bearer eyJhbGciOiJIUzI1NiIs..."
      }
    }
  }
}
```

#### 3. OAuth 2.0 (Recomendado para Producción)

**Uso**: Autenticación robusta con delegación de permisos

**Pros**:
- Estándar de la industria
- Tokens con expiración
- Revocación granular
- Soporte multi-tenant

**Flujo Típico**:

1. Cliente MCP obtiene URL de autorización del servidor
2. Usuario autoriza en navegador
3. Servidor OAuth emite access token
4. Cliente incluye token en cada petición MCP

**Discovery Document**: `/.well-known/oauth-protected-resource`

**Implementación en Cliente**:

```json
{
  "mcpServers": {
    "github": {
      "type": "http",
      "url": "https://mcp.github.com/",
      "oauth": {
        "discoveryUrl": "https://mcp.github.com/.well-known/oauth-protected-resource"
      }
    }
  }
}
```

#### 4. Dynamic Client Registration (DCR)

**Uso**: Registro automático de clientes OAuth

**Ventajas**:
- Onboarding sin configuración manual
- Registro just-in-time
- Ideal para clientes distribuidos

**Flujo DCR**:

1. Cliente hace POST a `/register` con metadatos
2. Servidor responde con `client_id` y `client_secret`
3. Cliente usa credenciales para OAuth flow

### Variables de Entorno y Secretos

#### Approach 1: Variables de Entorno del Sistema

```bash
export API_KEY="mi-clave-secreta"
```

```json
{
  "mcpServers": {
    "servidor": {
      "command": "node",
      "args": ["servidor.js"],
      "env": {
        "API_KEY": "${API_KEY}"
      }
    }
  }
}
```

#### Approach 2: Input Prompts

```json
{
  "inputs": [
    {
      "id": "api-token",
      "type": "promptString",
      "description": "Ingresa tu API token",
      "password": true
    }
  ],
  "servers": {
    "mi-servidor": {
      "type": "http",
      "url": "https://api.com/mcp",
      "headers": {
        "Authorization": "Bearer ${input:api-token}"
      }
    }
  }
}
```

### Mejores Prácticas de Seguridad

#### Para Servidores stdio Locales

✅ **Hacer**:
- Validar inputs del cliente
- Limitar acceso a filesystem
- Usar permisos mínimos necesarios

❌ **Evitar**:
- Ejecutar comandos shell sin sanitizar
- Acceso sin restricciones al filesystem
- Confiar ciegamente en datos del cliente

#### Para Servidores HTTP/SSE Remotos

✅ **Hacer**:
- Usar HTTPS siempre
- Implementar OAuth 2.0
- Validar origen de peticiones (CORS)
- Usar `audience` en JWT para limitar scope
- Implementar rate limiting
- Logs de auditoría

❌ **Evitar**:
- HTTP en producción
- API keys hardcodeadas
- Tokens sin expiración
- Aceptar cualquier cliente

### Resource Indicators (RFC 8707)

**Problema**: Token válido para múltiples APIs es riesgo de seguridad

**Solución**: Tokens específicos por recurso

```json
{
  "aud": "https://mcp.ejemplo.com/servidor-especifico",
  "scope": "read:tools write:resources"
}
```

Cada servidor MCP debe validar que el token es específicamente para él.

### Headers de Seguridad Recomendados

```json
{
  "mcpServers": {
    "servidor-seguro": {
      "type": "http",
      "url": "https://api.com/mcp",
      "headers": {
        "Authorization": "Bearer ${input:token}",
        "X-Client-ID": "mi-cliente-mcp",
        "X-Client-Version": "1.0.0"
      }
    }
  }
}
```

---

## Comparativa Rápida

### Por Tipo de Transporte

| Feature | stdio | SSE | HTTP Streamable |
|---------|-------|-----|-----------------|
| **Latencia** | Muy baja | Media | Media-baja |
| **Escalabilidad** | Baja | Media | Alta |
| **Multi-usuario** | ❌ | Limitado | ✅ |
| **Autenticación** | No necesaria | Básica | Robusta (OAuth) |
| **Producción** | ❌ | ⚠️ Deprecado | ✅ Recomendado |
| **Uso típico** | Desarrollo local | Transición | Servicios cloud |

### Por Herramienta

| Feature | Gemini CLI | Claude Code | Copilot CLI | Cline | VS Code Copilot |
|---------|-----------|-------------|-------------|-------|-----------------|
| **stdio** | ✅ | ✅ | ✅ | ✅ | ✅ |
| **SSE** | ✅ | ❌ (>v2.0.9) | ⚠️ | ✅ | ⚠️ Legacy |
| **HTTP** | ✅ | ✅ | ✅ | ✅ | ✅ |
| **Archivo config** | settings.json | .mcp.json | mcp-config.json | cline_mcp_settings.json | mcp.json |
| **CLI para agregar** | ✅ | ✅ | ⚠️ Interactive | ❌ | ✅ |
| **Extensions** | ✅ | ❌ | ❌ | ❌ | Parcial |
| **Auto-discovery** | ✅ | ❌ | ❌ | ❌ | ✅ |
| **OAuth nativo** | ✅ | ✅ | Parcial | ❌ | ✅ |
| **Scope jerárquico** | ⚠️ | ✅ | ❌ | ⚠️ | ✅ |

### Recomendaciones por Caso de Uso

#### Desarrollo Local Individual
- **Mejor opción**: Claude Code o Gemini CLI
- **Transporte**: stdio
- **Por qué**: Latencia mínima, setup simple

#### Equipo Pequeño (2-10 personas)
- **Mejor opción**: VS Code Copilot
- **Transporte**: stdio para recursos locales, HTTP para compartidos
- **Por qué**: Integración IDE, configuración por workspace

#### Empresa/Producción
- **Mejor opción**: VS Code Copilot + Gemini CLI
- **Transporte**: HTTP Streamable exclusivamente
- **Por qué**: Escalabilidad, OAuth, auditoría

#### Experimentación/Prototyping
- **Mejor opción**: Gemini CLI o Cline
- **Transporte**: Cualquiera
- **Por qué**: Flexibilidad, rápida iteración

---

## Casos de Uso y Ejemplos

### Caso 1: Documentación de Biblioteca con Context7

**Problema**: Necesitas documentación actualizada de Next.js mientras codificas.

**Solución**: Context7 MCP Server

#### Gemini CLI

```bash
gemini mcp add --transport http context7 https://context7.mcp.io
```

#### Claude Code

```bash
claude mcp add --transport http --scope user context7 -- https://context7.mcp.io
```

#### VS Code Copilot

```json
{
  "servers": {
    "context7": {
      "type": "http",
      "url": "https://context7.mcp.io"
    }
  }
}
```

**Uso**:
```
Usuario: "Cómo implemento server actions en Next.js 14?"
AI: [usa context7 tool] "Según la documentación oficial..."
```

### Caso 2: Acceso a Base de Datos PostgreSQL

**Problema**: Ejecutar queries SQL desde el AI assistant.

**Solución**: MCP Toolbox for Databases

#### Configuración Multi-Cliente

**Gemini CLI** (`~/.gemini/settings.json`):

```json
{
  "mcpServers": {
    "postgres": {
      "command": "npx",
      "args": ["-y", "mcp-toolbox-databases", "--preset", "postgresql"],
      "env": {
        "DB_HOST": "localhost",
        "DB_PORT": "5432",
        "DB_NAME": "midb",
        "DB_USER": "admin",
        "DB_PASSWORD": "${DB_PASSWORD}"
      }
    }
  }
}
```

**Claude Code** (`~/.claude.json`):

```json
{
  "mcpServers": {
    "postgres": {
      "type": "stdio",
      "command": "npx",
      "args": ["-y", "mcp-toolbox-databases", "--preset", "postgresql"],
      "env": {
        "DB_HOST": "localhost",
        "DB_PORT": "5432",
        "DB_NAME": "midb",
        "DB_USER": "admin",
        "DB_PASSWORD": "${DB_PASSWORD}"
      }
    }
  }
}
```

**Uso**:
```
Usuario: "Cuántos usuarios registrados hay?"
AI: [ejecuta SQL] SELECT COUNT(*) FROM users; -> "Hay 1,247 usuarios registrados"
```

### Caso 3: Integración GitHub

**Problema**: Crear issues, buscar PRs, leer código de repos.

**Solución**: GitHub MCP Server

#### Copilot CLI (Ya incluido)

```bash
# Ya está configurado por defecto
/mcp
# Verás: github-mcp con 30+ herramientas
```

#### Gemini CLI

```bash
gemini mcp add --transport http github https://mcp.github.com/

# Autenticar con OAuth
gemini
> /mcp auth github
```

#### VS Code Copilot

```json
{
  "servers": {
    "github": {
      "type": "http",
      "url": "https://mcp.github.com/"
    }
  }
}
```

**Uso**:
```
Usuario: "Crea un issue para implementar dark mode"
AI: [usa github-create-issue] "Issue #123 creado en repo/proyecto"
```

### Caso 4: Testing con Playwright

**Problema**: Generar tests E2E automáticamente.

**Solución**: Playwright MCP

#### Configuración Universal

```json
{
  "mcpServers": {
    "playwright": {
      "command": "npx",
      "args": ["-y", "@playwright/mcp@latest"]
    }
  }
}
```

**Uso**:
```
Usuario: "Genera un test que verifique el login"
AI: [usa playwright tools]

test('login flow', async ({ page }) => {
  await page.goto('/login');
  await page.fill('#email', 'test@example.com');
  await page.fill('#password', 'password123');
  await page.click('button[type="submit"]');
  await expect(page).toHaveURL('/dashboard');
});
```

### Caso 5: Empaquetado de Repositorios con Repomix

**Problema**: Analizar estructura completa de un proyecto.

**Solución**: Repomix MCP Server

#### Configuración

**Cualquier cliente** (`mcp.json` / `settings.json` / etc):

```json
{
  "mcpServers": {
    "repomix": {
      "command": "npx",
      "args": ["-y", "repomix", "--mcp"]
    }
  }
}
```

**Uso**:
```
Usuario: "Analiza la estructura del proyecto y sugiere mejoras"
AI: [usa repomix-pack tool] "El proyecto tiene 47 archivos TypeScript..."
```

### Caso 6: Diseño a Código con Figma

**Problema**: Convertir diseños de Figma en código React.

**Solución**: Figma Dev Mode MCP

#### Prerequisitos

1. Figma Desktop instalado
2. Seat Dev/Full (Pro/Org/Enterprise)
3. Habilitar "Enable local MCP Server" en Preferences

#### Configuración

**Gemini CLI**:

```bash
gemini mcp add --transport http figma http://localhost:9339/mcp

# Autenticar con OAuth
/mcp auth figma
```

**VS Code Copilot**:

```json
{
  "servers": {
    "figma": {
      "type": "http",
      "url": "http://localhost:9339/mcp"
    }
  }
}
```

**Uso**:
```
Usuario: "Genera código React del componente en https://figma.com/file/xyz"
AI: [lee variables, components, metadata de Figma]

export const Button = () => {
  return (
    <button
      style={{
        backgroundColor: 'var(--primary-500)',
        padding: 'var(--spacing-md)'
      }}
    >
      Click me
    </button>
  );
};
```

### Caso 7: Monitoreo de Logs con Observabilidad

**Problema**: Analizar logs de aplicación en tiempo real.

**Solución**: MCP Server custom para CloudWatch/Datadog

#### Ejemplo: Servidor Custom Python

**servidor_logs.py**:

```python
from mcp import Server
import boto3

server = Server("logs-mcp")
cloudwatch = boto3.client('logs')

@server.tool()
def buscar_errores(log_group: str, tiempo_minutos: int):
    """Busca errores en CloudWatch logs"""
    # Implementación...
    return resultados

if __name__ == "__main__":
    server.run()
```

**Configuración**:

```json
{
  "mcpServers": {
    "observabilidad": {
      "command": "python",
      "args": ["servidor_logs.py"],
      "env": {
        "AWS_REGION": "us-east-1"
      }
    }
  }
}
```

**Uso**:
```
Usuario: "¿Hubo errores 500 en la última hora?"
AI: [busca logs] "Sí, 3 errores 500 relacionados con timeout de DB"
```

### Caso 8: Multi-Agent con Copilot como MCP

**Problema**: Comunicación entre diferentes agentes de IA.

**Solución**: Copilot CLI como servidor MCP para Gemini CLI

#### Setup

**1. Crear wrapper MCP** (`mcp_copilot_cli.js`):

```javascript
const { spawn } = require('child_process');
const { Server } = require('@modelcontextprotocol/sdk/server');

const server = new Server({
  name: 'copilot-cli-mcp',
  version: '1.0.0'
});

server.setRequestHandler('tools/call', async (request) => {
  const copilot = spawn('copilot', ['chat']);
  // Implementación de proxy...
});

server.run();
```

**2. Configurar en Gemini CLI**:

```json
{
  "mcpServers": {
    "copilot": {
      "command": "node",
      "args": ["/ruta/a/mcp_copilot_cli.js"]
    }
  }
}
```

**3. Uso**:

```
Usuario en Gemini CLI: "Pregúntale a Copilot sobre patrones de React"
Gemini: [usa tool discuss_with_copilot_cli]
Copilot: [responde con su perspectiva]
Gemini: [sintetiza respuesta]
```

---

## Troubleshooting Común

### Problema: "Servidor no se encuentra"

**Síntomas**: Error `ENOENT` o "command not found"

**Soluciones**:

1. **Usar rutas absolutas**:
```json
{
  "command": "/usr/local/bin/node",
  "args": ["/ruta/completa/a/servidor.js"]
}
```

2. **Verificar PATH**:
```bash
which npx
which node
# Usar la ruta retornada en la config
```

3. **Windows**: Usar `node.exe` completo
```json
{
  "command": "C:\\Program Files\\nodejs\\node.exe"
}
```

### Problema: "Token inválido" en HTTP

**Soluciones**:

1. Verificar formato de header:
```json
{
  "headers": {
    "Authorization": "Bearer tu-token-aqui"
  }
}
```

2. Comprobar expiración del token

3. Regenerar token en servicio origen

### Problema: SSE no funciona en Claude Code

**Causa**: SSE eliminado en v2.0.9+

**Soluciones**:

1. Downgrade a v2.0.9:
```bash
npm install -g claude-code@2.0.9
```

2. Migrar a HTTP Streamable

3. Usar proxy stdio-to-SSE

### Problema: "Permission denied" en stdio

**Soluciones**:

1. Hacer ejecutable:
```bash
chmod +x servidor.sh
```

2. Usar intérprete explícito:
```json
{
  "command": "python3",
  "args": ["servidor.py"]
}
```

### Problema: Herramientas no aparecen

**Diagnóstico**:

```bash
# Gemini CLI
/mcp list

# Claude Code
claude mcp list

# Copilot CLI
/mcp
```

**Soluciones**:

1. Reiniciar cliente completamente

2. Verificar logs:
   - Gemini: `gemini --debug`
   - Claude Code: Buscar logs en directorio de configuración
   - Copilot: `~/.copilot/logs/`

3. Probar servidor manualmente:
```bash
npx -y @paquete/servidor
```

---

## Recursos Adicionales

### Documentación Oficial

- **MCP Specification**: https://modelcontextprotocol.io/
- **Gemini CLI Docs**: https://github.com/google-gemini/gemini-cli
- **Claude Code Docs**: https://docs.claude.com/en/docs/claude-code
- **GitHub Copilot CLI**: https://github.com/github/copilot-cli
- **VS Code MCP Guide**: https://code.visualstudio.com/docs/copilot/customization/mcp-servers

### Registros de Servidores

- **GitHub MCP Registry**: https://github.com/modelcontextprotocol/servers
- **Awesome MCP Servers**: https://github.com/punkpeye/awesome-mcp-servers
- **LobeHub MCP Hub**: https://lobehub.com/mcp

### Herramientas de Desarrollo

- **MCP Inspector**: Herramienta para debugging de servidores MCP
- **mcp-proxy**: Proxy para convertir entre transportes
- **MCP Publisher CLI**: Para publicar servidores en registry

### Comunidad

- **Discord de Anthropic**: Discusiones sobre MCP
- **GitHub Discussions**: Cada herramienta tiene su sección
- **Stack Overflow**: Tag `model-context-protocol`

---

## Conclusión

Model Context Protocol representa un cambio fundamental en cómo los modelos de IA interactúan con el mundo exterior. La elección entre Gemini CLI, Claude Code, GitHub Copilot CLI, Cline o VS Code Copilot depende de tu flujo de trabajo específico, pero todos comparten el mismo estándar MCP subyacente.

**Puntos clave para recordar**:

1. **stdio** es ideal para desarrollo local
2. **HTTP Streamable** es el estándar para producción
3. **SSE** está siendo deprecado progresivamente
4. Cada herramienta tiene su formato de configuración pero los conceptos son los mismos
5. La seguridad importa: usa OAuth 2.0 para servicios remotos

Esta guía debe servir como referencia completa para configurar MCPs independientemente de la herramienta que elijas. Los ejemplos están basados en documentación oficial y casos de uso reales del ecosistema MCP.

---

**Última actualización**: Octubre 2025  
**Autor**: Documentación compilada de fuentes oficiales y comunidad MCP  
**Contribuciones**: Este documento está en constante evolución. Reporta errores o sugiere mejoras.