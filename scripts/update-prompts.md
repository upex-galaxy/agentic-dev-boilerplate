## 📦 Actualizar prompts del template

### ⚙️ Setup inicial (una sola vez)

**1. Instalar GitHub CLI:**

```bash
# Mac
brew install gh

# Windows
winget install GitHub.cli

# Linux (Ubuntu/Debian)
sudo apt install gh
```

**2. Autenticarse en GitHub CLI:**

```bash
gh auth login
```

Selecciona:

- ✅ GitHub.com
- ✅ HTTPS
- ✅ Login with web browser
- ✅ Copia el código de 8 dígitos
- ✅ Pégalo en el navegador

**3. Verificar acceso al template de UPEX Galaxy:**

```bash
gh repo view upex-galaxy/ai-driven-project-starter
```

Si ves la info del repo → ✅ Todo listo!

**4. Instalar dependencias del script:**

```bash
bun install
```

**5. Agregar script al package.json:**

Abre tu `package.json` y agrega esta línea en la sección `"scripts"`:

```json
{
  "scripts": {
    "up": "bun scripts/update-prompts.js"
  }
}
```

**6. Agregar `.backups` en tu `.gitignore` (recomendado):**

```
.backups
```

---

### 🚀 Uso del Script

#### Menú Interactivo (recomendado)

```bash
bun up
```

Abre un menú donde puedes seleccionar qué actualizar:

- Todo (all)
- Prompts (.prompts/)
- Documentación (docs/)
- Guidelines (.context/guidelines/)
- Templates MCP (templates/mcp/)
- Scripts de actualización

#### Comandos Directos

```bash
bun up all                    # Actualiza todo
bun up prompts                # Menú para elegir fases
bun up docs                   # Actualiza docs/
bun up guidelines             # Actualiza .context/guidelines/
bun up templates              # Actualiza templates/mcp/
bun up scripts                # Actualiza scripts de actualización
bun up help                   # Muestra ayuda
```

#### Múltiples Componentes

```bash
bun up prompts docs templates # Actualiza los 3 componentes
```

---

### 📝 Opciones para Prompts

Cuando usas `bun up prompts`, puedes especificar qué fases actualizar:

#### Por Rol (presets)

```bash
bun up prompts --rol qa       # Fases 5, 10, 11, 12 (Testing)
bun up prompts --rol qa-full  # Fases 4, 5, 10, 11, 12 (Testing + Specification)
bun up prompts --rol dev      # Fases 6, 7, 8 (Desarrollo)
bun up prompts --rol devops   # Fases 3, 9, 13, 14 (Infraestructura)
bun up prompts --rol po       # Fases 1, 2, 4 (Producto)
bun up prompts --rol setup    # Fases 1, 2, 3 (Setup inicial)
```

#### Por Fases Específicas

```bash
bun up prompts --fase 5       # Solo fase 5
bun up prompts --fase 5,10,12 # Fases 5, 10 y 12
```

#### Otras Opciones

```bash
bun up prompts --all          # Todas las fases (1-14) + standalone
bun up prompts --standalone   # Solo archivos standalone (git-flow, workflows)
```

---

### 👤 Roles Disponibles

| Rol       | Fases            | Descripción                                        |
| --------- | ---------------- | -------------------------------------------------- |
| `qa`      | 5, 10, 11, 12    | Shift-Left, Exploratory, Documentation, Automation |
| `qa-full` | 4, 5, 10, 11, 12 | QA + Specification (contexto de negocio)           |
| `dev`     | 6, 7, 8          | Planning, Implementation, Code Review              |
| `devops`  | 3, 9, 13, 14     | Infrastructure, Staging, Production, Monitoring    |
| `po`      | 1, 2, 4          | Constitution, Architecture, Specification          |
| `setup`   | 1, 2, 3          | Fases sincrónicas iniciales                        |

---

### 📋 ¿Qué se actualiza?

✅ **Se actualizan:**

- `.prompts/` → Fases seleccionadas (o todas)
- `context-engineering.md` → Documentación de la arquitectura del template
- `docs/` → Archivos del template:
  - `ai-driven-software-project-blueprint.md`
  - `kata-test-architecture.md`
  - `kata-fundamentals.md`
  - `mcp-builder-strategy.md`
  - `GITFLOW.md`
  - `AMBIENTES.md`
  - `README.md`
  - `mcp-config-*.md` (todos los archivos de MCP)
  - `api-testing-guide/` (guia completa de API testing)
- `scripts/` → Scripts de actualización:
  - `update-prompts.js`
  - `update-prompts.md`
  - `mcp-builder.js`
  - `email-checker.js`
- `templates/mcp/` → Todos los templates de configuración de MCP
- `.context/guidelines/` → Guías (excepto archivos proyecto-específicos)

❌ **NO se tocan (tu trabajo):**

- `.context/idea/` → Tu documentación de negocio
- `.context/PRD/` → Tus requerimientos de producto
- `.context/SRS/` → Tus especificaciones técnicas
- `.context/PBI/` → Tu product backlog
- `.context/guidelines/data-testid-standards.md` → Archivo proyecto-específico
- `src/` → Tu código
- `.env` → Tus credenciales
- `README.md` → Tu documentación personalizada del proyecto

---

### 📦 Sistema de Backups

Cada ejecución crea un **nuevo directorio** de backup con timestamp único:

- Formato: `.backups/prompts-YYYY-MM-DD-HHMMSS/`
- Ejemplo: `.backups/prompts-2024-11-13-101845/`
- Los backups **NO se sobrescriben**, se acumulan
- Útil para comparar versiones o revertir cambios

---

### 🆘 Troubleshooting

**Error: "gh: command not found"**

```bash
# Instala GitHub CLI según tu OS:
# Mac: brew install gh
# Windows: winget install GitHub.cli
# Linux: sudo apt install gh
```

**Error: "authentication required"**

```bash
gh auth login
# Sigue los pasos de autenticación
```

**Error: "repository not found"**
→ Verifica que Ely te dio acceso al repositorio privado de UPEX Galaxy
→ Contacta a Ely para que te agregue como colaborador

**Error: "Cannot find module '@inquirer/prompts'"**

```bash
bun install
# O específicamente:
bun add @inquirer/prompts
```

**Algo salió mal y quiero revertir los cambios**

Los backups están en `.backups/prompts-FECHA/`:

```bash
# Ver backups disponibles (ordenados por fecha)
ls -la .backups/

# Restaurar el último backup (reemplaza la fecha con la del backup que quieres)
cp -r .backups/prompts-2024-XX-XX-XXXXXX/.prompts .
cp .backups/prompts-2024-XX-XX-XXXXXX/context-engineering.md .
cp -r .backups/prompts-2024-XX-XX-XXXXXX/templates/mcp templates/
```

---

### 💡 Tips

- Ejecuta `bun up` sin argumentos para usar el menú interactivo
- Usa `bun up prompts --rol qa-full` si eres QA y necesitas contexto de negocio
- El script **nunca toca** tu carpeta `.context/` donde está tu trabajo (excepto guidelines)
- Los backups se guardan automáticamente, así que puedes probar sin miedo
- Usa `bun up help` para ver todas las opciones disponibles
