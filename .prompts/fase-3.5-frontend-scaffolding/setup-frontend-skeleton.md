Actúa como Senior Frontend Architect, DevOps Engineer, y Full-Stack Developer experto.

**Input:**

- PRD completo: [usar .context/PRD/]
- SRS completo: [usar .context/SRS/]
- PBI (épicas y stories): [usar .context/PBI/epic-tree.md + revisar épicas en .context/PBI/epics/]

---

## 🎯 OBJETIVO

Crear la estructura inicial del proyecto frontend (scaffolding) en el **directorio actual**, consultando documentación oficial y generando páginas estratégicas moqueadas basándote en el análisis del contexto del proyecto.

---

## 🚨 RESTRICCIONES CRÍTICAS

### ❌ NO HACER:
- **NO usar comandos como `create-next-app`, `create-vite`, `create-react-app`** - Estos crean subdirectorios
- **NO crear subcarpetas para el proyecto** - Ya estamos en el directorio correcto
- **NO instalar dependencias innecesarias** - Solo fundamentales
- **NO implementar todas las historias de usuario** - Solo páginas estratégicas (3-5)
- **NO implementar todos los criterios de aceptación** - Solo UI básica
- **NO hardcodear nombres genéricos** (ej: "Dashboard", "Settings") - Usa nombres del dominio del negocio
- **NO ejecutar comandos interactivos** (ej: `npm run dev`) - Solo comandos que terminen
- **NO hacer commits automáticos** - Solo recomendar al usuario

### ✅ SÍ HACER:
- **Trabajar en el directorio actual** - Usar package.json existente
- **Usar Context7 MCP** - Consultar docs oficiales (Next.js, Supabase, etc.)
- **Analizar contexto del proyecto** - PRD, SRS, PBI completos
- **Decidir estratégicamente** - Qué páginas crear según el negocio
- **Seguir estructura del framework** - Consultar docs oficiales
- **Explicar cada decisión** - Para que el usuario comprenda
- **Validar con build** - `npm run build` (no comandos interactivos)
- **Recomendar acciones** - No forzar (especialmente git commits)

---

## 📊 FASE 1: ANÁLISIS DE CONTEXTO

**Objetivo:** Comprender profundamente el proyecto antes de crear cualquier código.

### Paso 1.1: Leer Documentación del Proyecto

**Archivos a leer (TODOS):**

**PRD (Product Requirements):**
- `.context/PRD/executive-summary.md` → Problema, solución, usuarios
- `.context/PRD/user-personas.md` → Quiénes usarán el sistema
- `.context/PRD/mvp-scope.md` → Épicas y funcionalidades principales
- `.context/PRD/user-journeys.md` → Flujos de usuario principales

**SRS (Software Requirements):**
- `.context/SRS/functional-specs.md` → Requerimientos funcionales detallados
- `.context/SRS/non-functional-specs.md` → Performance, security, etc.
- `.context/SRS/architecture-specs.md` → **MUY IMPORTANTE:** Stack técnico, framework, patrones
- `.context/SRS/api-contracts.yaml` → Endpoints disponibles

**PBI (Product Backlog):**
- `.context/PBI/epic-tree.md` → Vista completa de épicas del MVP
- `.context/PBI/epics/*/epic.md` → Revisar TODAS las épicas
- `.context/PBI/epics/*/stories/*/story.md` → Escanear stories principales

**Qué identificar:**

1. **Dominio del negocio:**
   - ¿Qué problema resuelve? (PRD)
   - ¿Quiénes son los usuarios? (PRD)
   - ¿Cuál es el vocabulario del dominio? (nombres, entidades)

2. **Stack técnico:**
   - Framework frontend (Next.js, React+Vite, SvelteKit, etc.)
   - UI Library (TailwindCSS, Material UI, Chakra, etc.)
   - Auth provider (Supabase, Auth0, Firebase, NextAuth, etc.)
   - Backend/DB (Supabase, Firebase, custom API, etc.)
   - State management (Zustand, Redux, Jotai, etc.)

3. **Funcionalidades core:**
   - Épicas con mayor prioridad
   - Páginas que aparecen en múltiples user journeys
   - Entidades principales del negocio

**Output de este paso (NO mostrar al usuario, uso interno):**
- Stack técnico identificado
- Dominio del negocio comprendido
- Lista de épicas prioritarias
- Vocabulario del dominio (nombres correctos)

---

### Paso 1.2: Consultar Documentación Oficial (Context7 MCP)

**Acción:** Usa el MCP de Context7 para consultar la documentación oficial de las tecnologías del stack identificado.

**Queries recomendadas:**

1. **Framework:**
   - "[Framework] project structure best practices latest version"
   - "[Framework] routing configuration"
   - "[Framework] recommended folder structure"

2. **Auth Provider:**
   - "[Auth Provider] client setup [Framework]"
   - "[Auth Provider] authentication flow [Framework]"

3. **UI Library:**
   - "[UI Library] setup [Framework]"
   - "[UI Library] configuration best practices"

**Objetivo:** Obtener información actualizada sobre:
- Cómo estructurar el proyecto según el framework
- Cómo configurar dependencias correctamente
- Patrones recomendados por las docs oficiales

**Output esperado (mostrar al usuario):**

```markdown
## 📚 Análisis Completado

### Stack Técnico Identificado:
- **Framework:** [Nombre y versión del SRS]
- **Auth Provider:** [Identificado del SRS]
- **UI Library:** [Identificado del SRS]
- **Backend/DB:** [Identificado del SRS]
- [Otros componentes relevantes]

### Dominio del Negocio:
- **Problema que resuelve:** [Resumen 1 línea del PRD]
- **Usuarios principales:** [Listar personas del PRD]
- **Entidades core:** [Listar entidades principales identificadas]

### Épicas Prioritarias (del PBI):
1. [EPIC-XXX]: [Nombre] - [Razón de prioridad]
2. [EPIC-YYY]: [Nombre] - [Razón de prioridad]
3. [EPIC-ZZZ]: [Nombre] - [Razón de prioridad]

### Documentación Consultada:
He consultado las docs oficiales de:
- **[Framework]**: [Conceptos clave aplicables]
- **[Auth Provider]**: [Setup recomendado]
- **[UI Library]**: [Configuración recomendada]

**Próximo paso:** Decidir qué páginas crear basándome en este análisis.
```

---

## 🧠 FASE 2: DECISIÓN ESTRATÉGICA DE PÁGINAS

**Objetivo:** Decidir inteligentemente qué páginas crear (3-5 máximo) basándote en el análisis anterior.

### Criterios de Selección:

**Páginas obligatorias (si aplican al proyecto):**

1. **Autenticación** (solo si el proyecto requiere auth):
   - Analiza PRD/SRS: ¿El sistema requiere usuarios con login?
   - Si SÍ → Incluir página de login/auth
   - Si NO → Omitir

2. **Página principal post-login o home** (casi siempre aplica):
   - ¿Cómo se llama en el contexto del negocio?
   - Ejemplos: "Home", "Proyectos", "Mi Espacio", etc.
   - Usa vocabulario del dominio (NO genérico "Dashboard")

**Páginas del dominio (1-3 páginas):**

Analiza épicas y user journeys para identificar:

- **Páginas que aparecen en múltiples user journeys** (alta prioridad)
- **Épicas marcadas como "MUST HAVE" o "HIGH"** en el PBI
- **Funcionalidades core del MVP** (del PRD mvp-scope.md)

**Criterios para descartar:**
- ❌ Páginas secundarias (configuraciones avanzadas)
- ❌ Páginas administrativas (admin panels)
- ❌ Flujos multi-paso complejos (wizards)
- ❌ Páginas de detalle complejas

**Análisis de layout:**

Basándote en las páginas identificadas, decide:
- ¿Necesita sidebar? (si hay 4+ páginas)
- ¿Necesita navbar? (casi siempre)
- ¿Es SPA simple? (1-2 páginas)
- ¿Tiene secciones diferenciadas? (auth vs app)

---

### Output Esperado (mostrar al usuario):

```markdown
## 🗂️ Plan de Páginas Estratégicas

**Total de páginas a crear:** [número] (3-5 recomendado)

---

### Decisión de Layout:

**Tipo de layout:** [Sidebar + Navbar | Navbar solo | Simple]
**Razón:** [Explicar basándote en número de páginas y contexto del negocio]

---

### Páginas Seleccionadas:

#### 1️⃣ [Nombre de Página] (Autenticación - si aplica)
**Ruta:** `/[ruta]`
**Razón:** [Por qué esta página es necesaria]
**Funcionalidad moqueada:**
- [Listar elementos básicos a implementar]
- [Qué NO se implementa todavía]

**Épica relacionada:** [EPIC-XXX] (si aplica)
**Stories relacionadas:** [STORY-XXX, STORY-YYY] (si aplica)

---

#### 2️⃣ [Nombre de Página] (Página Principal)
**Ruta:** `/[ruta]`
**Razón:** [Por qué esta página es estratégica según PRD/PBI]
**Funcionalidad moqueada:**
- [Elementos clave]

**Épica relacionada:** [EPIC-XXX]

---

#### 3️⃣ [Nombre de Página Core 1]
**Ruta:** `/[ruta]`
**Razón:** [Justificar con user journeys o épicas prioritarias]
**Funcionalidad moqueada:**
- [Elementos clave]

**Épica relacionada:** [EPIC-XXX]
**Stories relacionadas:** [STORY-XXX]

---

[Repetir para página 4 y 5 si aplica]

---

### ❌ Páginas Diferidas (implementar en Fase 6)

Las siguientes páginas se implementarán durante Fase 6 al desarrollar las stories correspondientes:

- `/[página]` - Razón: [Por qué no es prioritaria ahora]
- `/[página]` - Razón: [Por qué no es prioritaria ahora]
- ...

**Beneficio:** Enfoque en lo esencial para tener esqueleto visual funcional.

---

**Próximo paso:** Setup del proyecto con instalación de dependencias.
```

---

## 🏗️ FASE 3: SETUP DEL PROYECTO

**Objetivo:** Configurar el proyecto en el directorio actual instalando dependencias y creando estructura.

### Paso 3.1: Verificar Entorno Actual

**Explica al usuario qué encontraste:**

```bash
# Ver archivos existentes
ls -la

# Ver package.json actual
cat package.json
```

**Output esperado:**

```markdown
## 🔍 Análisis del Directorio Actual

**Directorio de trabajo:** [pwd]

**Archivos encontrados:**
- ✅ `package.json` encontrado → Lo usaremos como base
- ✅ `.git/` encontrado → Repositorio Git inicializado
- ✅ `.context/` con documentación del proyecto
- [Listar otros archivos relevantes]

**Estado del package.json:**
- Dependencias existentes: [listar si hay]
- Scripts existentes: [listar si hay]

**Próximo paso:** Instalar dependencias fundamentales sin romper lo existente.
```

---

### Paso 3.2: Instalar Dependencias Fundamentales

**IMPORTANTE:** Explica CADA dependencia ANTES de instalarla.

**Proceso:**

1. **Identifica categorías de dependencias necesarias:**
   - Core framework
   - UI library
   - Auth provider
   - Developer tools (TypeScript, ESLint)

2. **Por cada categoría, explica al usuario:**

```markdown
### 📦 Instalando [Categoría]

**Dependencias a instalar:**
- `[paquete-1]`: [Para qué sirve]
- `[paquete-2]`: [Para qué sirve]

**Razón:** [Por qué son necesarias para este proyecto específico]

**Comando:**
```bash
npm install [paquetes...]
```

**Instalando...**
```

3. **Ejecuta instalaciones:**

```bash
# Framework core (ajustar según identificado)
npm install [framework-packages]

# UI Library (ajustar según identificado)
npm install [ui-packages]

# Auth Provider (ajustar según identificado)
npm install [auth-packages]

# TypeScript + Dev Tools
npm install -D typescript @types/react @types/node eslint prettier
```

**NO hardcodear paquetes específicos** - Usa los identificados del SRS.

---

### Paso 3.3: Crear Estructura de Carpetas

**Acción:** Consulta las docs oficiales del framework (vía Context7 si es necesario) y crea la estructura recomendada.

**IMPORTANTE:** La estructura varía según framework:
- Next.js App Router → `app/`, `components/`, `lib/`
- Next.js Pages Router → `pages/`, `components/`, `lib/`
- React+Vite → `src/`, `components/`, `utils/`
- SvelteKit → `src/routes/`, `src/lib/`

**NO asumir estructura específica** - Consulta docs y crea según framework real.

**Ejemplo de explicación al usuario:**

```markdown
## 📁 Creando Estructura de Carpetas

Basándome en las mejores prácticas de **[Framework]** (consultadas de docs oficiales), voy a crear la siguiente estructura:

```
[Mostrar árbol de carpetas según framework identificado]
```

**Explicación de carpetas clave:**
- `[carpeta-1]/`: [Propósito según framework]
- `[carpeta-2]/`: [Propósito según framework]
- `[carpeta-3]/`: [Propósito según framework]

**Creando estructura...**
```

```bash
# Crear carpetas (ajustar según framework)
mkdir -p [carpetas según framework identificado]
```

**Ejemplo (NO hardcodear esto, es solo ilustrativo):**
- Si es Next.js App Router: `app/`, `components/`, `lib/`, `types/`
- Si es Vite: `src/`, `src/components/`, `src/utils/`, `src/types/`

---

### Paso 3.4: Crear Archivos de Configuración

**Acción:** Crea configuraciones mínimas necesarias según el stack.

**IMPORTANTE:** NO copies/pegues configs completas hardcodeadas.

**Proceso:**

1. **Identifica qué configs necesita el proyecto** (del SRS + framework)
2. **Consulta Context7 si es necesario** para obtener configs recomendadas
3. **Crea archivos básicos** explicando cada uno

**Archivos comunes (ajustar según stack):**

- Config del framework (ej: `next.config.js`, `vite.config.ts`)
- TypeScript (`tsconfig.json`)
- UI Library (ej: `tailwind.config.ts`)
- ESLint (`.eslintrc.json`)
- Environment vars (`.env.local.example`)

**Formato de explicación:**

```markdown
### ⚙️ Creando [Nombre de Config]

**Archivo:** `[nombre-archivo]`
**Propósito:** [Para qué sirve en este proyecto]

**Configuraciones clave aplicadas:**
- [Config 1]: [Razón]
- [Config 2]: [Razón]

**Nota:** [Alguna nota relevante si aplica]

**Creando archivo...**
```

**Para `.env.local.example`:**

```markdown
### 🔐 Creando Template de Variables de Entorno

**Archivo:** `.env.local.example`

**Variables definidas (basadas en SRS):**
- `[VAR_1]`: [Descripción - ej: URL del backend]
- `[VAR_2]`: [Descripción - ej: API Key de Supabase]

**⚠️ ACCIÓN REQUERIDA DEL USUARIO:**

1. Copia este archivo a `.env.local`:
   ```bash
   cp .env.local.example .env.local
   ```

2. Reemplaza los valores de ejemplo con tus credenciales reales

3. `.env.local` ya está en `.gitignore` (no se commiteará)

**Tip:** Puedes usar herramientas MCP (ej: Supabase MCP) para obtener credenciales reales si las necesitas.
```

---

## 🎨 FASE 4: IMPLEMENTAR COMPONENTES BASE

**Objetivo:** Crear utilidades, clientes, y componentes base reutilizables.

### Paso 4.1: Clientes de Auth/Backend

**Acción:** Crea clientes según el auth provider identificado.

**IMPORTANTE:** NO hardcodear código de Supabase si el proyecto usa otro provider.

**Proceso:**

1. **Identifica el provider** (del SRS)
2. **Consulta Context7** para obtener setup recomendado
3. **Crea archivos de cliente** explicando su propósito

**Ejemplo de explicación:**

```markdown
### 🔌 Creando Cliente de [Auth Provider]

**Provider identificado:** [Nombre del SRS]

**Archivos a crear:**
- `lib/[provider]/client.ts` - Cliente para uso en browser/cliente
- `lib/[provider]/server.ts` - Cliente para uso en server (si aplica)

**Propósito:** Estos clientes permiten autenticación y acceso a [servicios del provider].

**Uso posterior:**
- En Client Components: importar desde `client.ts`
- En Server Components: importar desde `server.ts`

**Creando archivos basados en docs oficiales de [Provider]...**
```

**Crea los archivos** consultando Context7 o siguiendo docs del provider (NO pegues snippets hardcodeados de 50+ líneas).

---

### Paso 4.2: Utilidades Comunes

**Acción:** Crea utilidades básicas (ej: función `cn` para TailwindCSS si se usa).

**Mantén esto minimalista** - Solo utilidades que sabes que se usarán.

```markdown
### 🛠️ Creando Utilidades Comunes

**Archivo:** `lib/utils.ts` (o ubicación según framework)

**Utilidades incluidas:**
- [Utilidad 1]: [Para qué sirve]
- [Utilidad 2]: [Para qué sirve]

**Ejemplo de uso:** [Mostrar brevemente]

**Creando archivo...**
```

---

### Paso 4.3: Tipos TypeScript Base

**Acción:** Crea tipos básicos según el dominio del negocio.

**IMPORTANTE:** Usa entidades del dominio (del PRD/SRS/PBI), NO tipos genéricos.

```markdown
### 📘 Creando Tipos TypeScript

**Archivo:** `types/index.ts` (o ubicación según framework)

**Tipos definidos (basados en entidades del negocio):**

- `[Entidad1]`: [Descripción de la entidad del negocio]
  - Campos principales identificados del SRS/PBI

- `[Entidad2]`: [Descripción]
  - Campos principales

**Nota:** Estos tipos base se extenderán en Fase 6 al implementar stories completas.

**⚠️ IMPORTANTE:** NO hardcodear schemas de DB aquí. Si necesitas schemas reales, usa herramientas MCP (ej: Supabase MCP) durante Fase 6.

**Creando archivo...**
```

---

### Paso 4.4: Layouts Base

**Acción:** Crea layout raíz según framework.

```markdown
### 🏗️ Creando Layout Raíz

**Archivo:** [Ubicación según framework, ej: `app/layout.tsx` o `src/routes/+layout.svelte`]

**Propósito:** Estructura HTML base que envuelve toda la aplicación.

**Configuraciones aplicadas:**
- Font: [Especificar cuál y por qué]
- Metadata: [Título y descripción del proyecto - obtener del PRD]
- Estilos globales: [UI library setup]

**Creando archivo...**
```

---

## 📄 FASE 5: IMPLEMENTAR PÁGINAS ESTRATÉGICAS

**Objetivo:** Crear las páginas seleccionadas en Fase 2 con UI básica moqueada.

### ⚠️ RECORDATORIO CRÍTICO:

- **Implementar SOLO UI básica** + navegación funcional
- **NO implementar** todos los criterios de aceptación
- **Usar mock data** apropiada al dominio del negocio
- **Usar nombres del dominio** (NO "Dashboard", "Settings" genéricos)
- **Explicar qué se deja** para Fase 6

---

### Proceso por Página:

**Por cada página seleccionada en Fase 2:**

1. **Anuncia qué vas a crear:**

```markdown
### [📋/🔐/etc.] Creando Página: [Nombre del Dominio]

**Ruta:** `/[ruta]`
**Archivo:** [Ubicación según framework]

**Funcionalidad a implementar:**
- ✅ [Elemento 1 - UI básica]
- ✅ [Elemento 2 - navegación]
- ✅ [Elemento 3 - mock data si aplica]

**⏭️ Diferido para Fase 6 (Stories relacionadas: [STORY-XXX]):**
- ❌ [Funcionalidad compleja 1]
- ❌ [Funcionalidad compleja 2]
- ❌ [Validaciones avanzadas]

**Razón del diferimiento:** Esta página demuestra la estructura y UI esperada. La lógica completa (fetch real, validaciones, acciones) se implementará al desarrollar [STORY-XXX] en Fase 6.

**Creando archivo...**
```

2. **Crea el archivo** con:
   - Estructura básica del componente
   - UI moqueada apropiada
   - Mock data si es necesario (basada en el dominio)
   - Navegación funcional
   - Comentarios `// TODO Phase 6` donde aplique

3. **NO pegues** bloques de código de 50+ líneas hardcodeados

---

### Layout Compartido (si aplica):

Si decidiste en Fase 2 que necesita sidebar/navbar:

```markdown
### 🎨 Creando Layout de Aplicación

**Archivos a crear:**
- Layout compartido: [Ubicación según framework]
- Componente de navegación: `components/[Nombre]Navigation.tsx` (o similar)
- Componente de header: `components/[Nombre]Header.tsx` (si aplica)

**Decisión de layout (de Fase 2):** [Sidebar + Navbar | Solo Navbar]

**Elementos de navegación (basados en páginas de Fase 2):**
- [Página 1]: `/[ruta]` - Icono: [apropiado al contexto]
- [Página 2]: `/[ruta]` - Icono: [apropiado al contexto]
- ...

**IMPORTANTE:** Nombres y rutas basados en el dominio del negocio (NO genéricos).

**Funcionalidad implementada:**
- ✅ Navegación entre páginas
- ✅ Indicador de página activa
- ✅ Logout (si hay auth)

**⏭️ Diferido para Fase 6:**
- ❌ Notificaciones
- ❌ User dropdown con perfil completo
- ❌ Search bar
- ❌ Responsive mobile menu

**Creando archivos...**
```

---

## ✅ FASE 6: VALIDACIÓN

**Objetivo:** Verificar que el proyecto compila correctamente.

### Paso 6.1: Validar Compilación

**IMPORTANTE:** NO ejecutar `npm run dev` (comando interactivo).

```markdown
## 🔍 Validando Proyecto

**Acción:** Voy a ejecutar el build para verificar que todo compila correctamente.

**Comando a ejecutar:**
```bash
npm run build
```

**¿Por qué build y no dev?**
- `npm run build` es un comando que termina (no interactivo)
- Si el build pasa → el proyecto está configurado correctamente
- Detecta errores de TypeScript, imports incorrectos, etc.

**Ejecutando build...**
```

```bash
npm run build
```

**Analizar resultado:**

**Si build exitoso:**
```markdown
✅ **Build exitoso!**

**Resultado:**
- ✓ TypeScript compiló sin errores
- ✓ Todas las dependencias se resolvieron correctamente
- ✓ Archivos generados en [output directory]

**Próximo paso:** Documentación y recomendaciones finales.
```

**Si hay errores:**
```markdown
⚠️ **Build encontró errores**

**Errores detectados:**
[Listar errores]

**Análisis:** [Explicar qué causó los errores]

**Corrigiendo...**

[Corregir errores y re-ejecutar build]
```

---

### Paso 6.2: Actualizar Scripts (si es necesario)

```markdown
### 📦 Verificando Scripts de package.json

**Scripts disponibles:**
- `npm run dev` - Inicia servidor de desarrollo
- `npm run build` - Compila para producción
- `npm run start` - Inicia servidor de producción (después de build)
- `npm run lint` - Ejecuta ESLint

[Agregar si faltan]

✅ Scripts configurados correctamente.
```

---

## 📚 FASE 7: DOCUMENTACIÓN Y RECOMENDACIONES

**Objetivo:** Documentar lo creado y dar recomendaciones al usuario (NO hacer acciones automáticas como commits).

### Paso 7.1: Crear Documentación de Setup

**Archivo:** `SETUP.md` (en la raíz del proyecto)

```markdown
### 📖 Creando SETUP.md

**Propósito:** Guía para que cualquier desarrollador pueda levantar el proyecto.

**Contenido incluido:**
- Requisitos previos (Node.js, cuentas necesarias)
- Pasos de instalación
- Configuración de variables de entorno
- Cómo iniciar el servidor de desarrollo
- Estructura del proyecto
- Próximos pasos (Fases 4-6)

**Creando archivo...**
```

**Contenido del archivo (adaptado al proyecto real):**

```markdown
# [Nombre del Proyecto] - Setup Guide

## Requisitos Previos
- Node.js [versión] o superior
- [Otros requisitos según stack]

## Instalación

### 1. Instalar dependencias
```bash
npm install
```

### 2. Configurar variables de entorno

Copia el archivo de ejemplo:
```bash
cp .env.local.example .env.local
```

Edita `.env.local` con tus credenciales reales:
- `[VAR_1]`: [Cómo obtenerla]
- `[VAR_2]`: [Cómo obtenerla]

### 3. Iniciar servidor de desarrollo

⚠️ **IMPORTANTE:** Abre una nueva terminal para no bloquear tu sesión actual.

```bash
npm run dev
```

Abre [http://localhost:3000](http://localhost:3000) en tu navegador (ajustar puerto según framework).

## Estructura del Proyecto

[Mostrar árbol de carpetas creado]

## Páginas Implementadas

✅ **[Página 1]** (`/[ruta]`)
- [Descripción breve]
- Stories relacionadas: [STORY-XXX]

✅ **[Página 2]** (`/[ruta]`)
- [Descripción breve]
- Stories relacionadas: [STORY-XXX]

[Listar todas las páginas creadas]

## Próximos Pasos

Este es un **scaffolding inicial** (Fase 3.5). Para implementar funcionalidades completas:

1. **Fase 4: Shift-Left Testing**
   - Generar test plans para épicas
   - Generar test cases detallados por story

2. **Fase 5: Planning**
   - Generar implementation plans por story

3. **Fase 6: Implementation**
   - Implementar stories siguiendo los planes
   - Desarrollar encima del scaffolding existente
   - Leer guidelines en `.context/guidelines/`

## Referencias

- [Framework Docs](url)
- [Auth Provider Docs](url)
- [UI Library Docs](url)
```

---

### Paso 7.2: Crear Documentación de Arquitectura

**Archivo:** `.context/frontend-architecture.md`

```markdown
### 📄 Creando .context/frontend-architecture.md

**Propósito:** Documentar las decisiones técnicas del scaffolding para el equipo.

**Contenido incluido:**
- Stack técnico y versiones
- Estructura del proyecto
- Páginas implementadas (con status)
- Decisiones técnicas justificadas
- Workflow para Fase 6

**Creando archivo...**
```

**Estructura del archivo:**

```markdown
# Frontend Architecture - [Nombre del Proyecto]

**Generado:** Fase 3.5 - Frontend Scaffolding
**Fecha:** [Fecha]
**Framework:** [Nombre y versión]

---

## 🏗️ Stack Técnico

| Tecnología | Versión | Propósito |
|------------|---------|-----------|
| [Framework] | [X.X.X] | Frontend framework |
| [UI Library] | [X.X.X] | Estilos y componentes |
| [Auth Provider] | [X.X.X] | Autenticación |
| TypeScript | [X.X.X] | Type-safety |
| [Otros] | [X.X.X] | [Propósito] |

---

## 📂 Estructura del Proyecto

[Mostrar árbol de carpetas completo]

---

## 🎨 Páginas Implementadas

[Por cada página creada:]

### [Nombre Página] (`/[ruta]`)
**Status:** ✅ Scaffolding completo
**Funcionalidad:** [Descripción breve]
**Story relacionada:** [STORY-XXX] (a completar en Fase 6)

**Componentes creados:**
- [Componente 1]
- [Componente 2]

**Pendiente para Fase 6:**
- [Funcionalidad 1]
- [Funcionalidad 2]

---

## 🔧 Decisiones Técnicas

### [Decisión 1]
**Razón:** [Justificación basada en docs oficiales o SRS]

### [Decisión 2]
**Razón:** [Justificación]

[Documentar decisiones importantes tomadas]

---

## 🚀 Workflow para Fase 6 (Implementation)

1. **Lee la story:** `.context/PBI/epics/EPIC-XXX/stories/STORY-XXX/story.md`
2. **Lee el test plan:** `.context/PBI/epics/EPIC-XXX/stories/STORY-XXX/test-cases.md`
3. **Lee el implementation plan:** `.context/PBI/epics/EPIC-XXX/stories/STORY-XXX/implementation-plan.md`
4. **Identifica si existe base en scaffolding:**
   - Si existe → EXTIENDE la funcionalidad
   - Si no existe → CREA siguiendo patterns del scaffolding
5. **Sigue guidelines:** `.context/guidelines/`

---

## 📚 Referencias

- **PRD:** `.context/PRD/`
- **SRS:** `.context/SRS/`
- **PBI:** `.context/PBI/`
- **Guidelines:** `.context/guidelines/`
```

---

### Paso 7.3: Resumen Ejecutivo

**Output final para el usuario:**

```markdown
# 🎉 Frontend Scaffolding Completado

---

## 📊 Resumen

**Archivos creados:** [número total]
**Páginas implementadas:** [número]
**Componentes creados:** [número]
**Configuraciones creadas:** [número]

---

## ✅ Lo que se Implementó

### Stack Configurado:
- ✅ [Framework] con estructura recomendada
- ✅ [UI Library] configurado y listo
- ✅ [Auth Provider] clientes creados
- ✅ TypeScript + ESLint configurados

### Páginas Creadas:
1. ✅ [Página 1] (`/[ruta]`) - [Descripción breve]
2. ✅ [Página 2] (`/[ruta]`) - [Descripción breve]
3. ✅ [Página 3] (`/[ruta]`) - [Descripción breve]
[Listar todas]

### Documentación Generada:
- ✅ `SETUP.md` - Guía de instalación
- ✅ `.context/frontend-architecture.md` - Arquitectura y decisiones
- ✅ `.env.local.example` - Template de variables de entorno

---

## ⚠️ Lo que NO está Implementado

Este scaffolding es **solo la base visual**. Las siguientes funcionalidades se implementarán en **Fase 6** (Implementation):

**[Página 1]:**
- ❌ [Funcionalidad compleja 1]
- ❌ [Funcionalidad compleja 2]

**[Página 2]:**
- ❌ [Funcionalidad compleja 1]
- ❌ [Funcionalidad compleja 2]

[Listar para cada página]

**Razón:** El objetivo del scaffolding es estructura base + demostración visual. La lógica completa se implementa al desarrollar cada story en Fase 6.

---

## 🚀 Próximos Pasos Inmediatos

### 1️⃣ Configurar Variables de Entorno (AHORA)

```bash
# Copiar template
cp .env.local.example .env.local

# Editar con tus credenciales reales
# (usa tu editor de código favorito)
```

**Credenciales necesarias:**
- `[VAR_1]`: [Cómo obtenerla]
- `[VAR_2]`: [Cómo obtenerla]

---

### 2️⃣ Probar el Proyecto (AHORA)

**⚠️ IMPORTANTE:** Abre una **nueva terminal** (no uses la actual para evitar bloquearla).

```bash
npm run dev
```

**Luego:**
1. Abre [http://localhost:[puerto]]([http://localhost:[puerto]) en tu navegador
2. Verifica que las páginas cargan correctamente
3. Navega entre páginas usando la navegación
4. Valida que los estilos se aplican correctamente

**Si encuentras errores:** Revisa la consola del navegador y terminal.

---

### 3️⃣ Considerar Crear un Checkpoint Git (RECOMENDADO)

**¿Por qué es buena idea?**
- ✅ Tienes un punto de retorno si algo sale mal más adelante
- ✅ Separación clara entre scaffolding (Fase 3.5) y desarrollo (Fase 6)
- ✅ Facilita code reviews (se ve qué es base vs features)

**Antes de commitear, revisa:**
```bash
git status
```

**Verifica** que todos los archivos listados sean del scaffolding (no archivos personales sin guardar).

**Mensaje de commit sugerido:**
```
chore: Initial frontend scaffolding

- Setup [Framework] with [Auth Provider]
- Configure [UI Library] + TypeScript
- Implement [X] strategic pages with basic UI
- Add setup documentation

Phase: 3.5 - Frontend Scaffolding
```

**Comando para commitear (cuando estés listo):**
```bash
git add .
git commit -m "tu mensaje aquí"
```

**Nota:** Esto es **opcional**. Si prefieres commitear después de probar, está bien. Si tienes archivos sin guardar que no quieres incluir, haz commits selectivos con `git add [archivos-específicos]`.

---

### 4️⃣ Mostrar al Equipo (RECOMENDADO)

El scaffolding está listo para **demostración visual**:

1. Levanta el servidor (`npm run dev`)
2. Navega por las páginas creadas
3. Explica que es **solo la base** (no funcionalidad completa)
4. Muestra el PBI para explicar qué viene en Fase 6

**Valor:** El equipo visualiza hacia dónde va el proyecto.

---

### 5️⃣ Continuar con Fase 4: Shift-Left Testing (SIGUIENTE)

Ahora que tienes la estructura base, procede con:

**Fase 4: Shift-Left Testing**
- Generar test plans para cada épica
- Generar test cases detallados por story
- Identificar edge cases y gaps

**Ubicación de prompts:** `.prompts/fase-4-shift-left-testing/`

---

## 💡 Tips Finales

### Al Implementar Stories en Fase 6:

1. **Extiende, no reescribas:**
   - Si una página ya existe en scaffolding → Agrégale funcionalidad
   - Si no existe → Créala siguiendo los patterns del scaffolding

2. **Mantén consistencia:**
   - Usa las mismas utilidades (`lib/utils.ts`)
   - Reutiliza componentes base
   - Sigue la estructura de carpetas establecida

3. **Lee los planes:**
   - `.context/PBI/epics/EPIC-XXX/stories/STORY-XXX/story.md`
   - `.context/PBI/epics/EPIC-XXX/stories/STORY-XXX/test-cases.md`
   - `.context/PBI/epics/EPIC-XXX/stories/STORY-XXX/implementation-plan.md`

4. **Sigue guidelines:**
   - `.context/guidelines/code-standards.md`
   - `.context/guidelines/error-handling.md`
   - `.context/guidelines/implementation-workflow.md`

---

## 🎯 Valor Generado

**¿Qué logramos?**

✅ **Estructura sólida** siguiendo mejores prácticas de [Framework]
✅ **Base visual** para demostración al equipo
✅ **Configuración correcta** consultando docs oficiales
✅ **Decisiones documentadas** para futuros desarrolladores
✅ **Acelera Fase 6** (base lista para extender)

**Próxima reunión con el equipo:**
- Muestra las páginas funcionando
- Explica que es solo scaffolding
- Presenta el PBI y roadmap de Fases 4-6

---

**🎉 ¡Scaffolding completado exitosamente!**

**¿Preguntas?** Consulta:
- `SETUP.md` - Instrucciones de setup
- `.context/frontend-architecture.md` - Arquitectura y decisiones
- `.context/guidelines/` - Guidelines de implementación
```

---

## 📋 VALIDACIONES FINALES (CHECKLIST INTERNO)

Antes de terminar, valida mentalmente (NO mostrar al usuario):

### Estructura:
- ✅ Carpetas del framework creadas correctamente
- ✅ Archivos de configuración presentes
- ✅ `.env.local.example` creado

### Código:
- ✅ Build pasa sin errores (`npm run build`)
- ✅ No hay imports rotos
- ✅ TypeScript sin errores

### Documentación:
- ✅ `SETUP.md` creado con instrucciones claras
- ✅ `.context/frontend-architecture.md` creado con decisiones
- ✅ Explicaciones claras durante todo el proceso

### Usuario:
- ✅ Se explicó cada paso mientras trabajabas
- ✅ Se dieron instrucciones claras de próximos pasos
- ✅ Se recomendó (NO forzó) crear commit
- ✅ Se explicó cómo levantar el servidor (nueva terminal)

---

**Output:** Proyecto frontend funcional con estructura completa, dependencias instaladas, páginas estratégicas implementadas, documentación clara, y recomendaciones para el usuario.

**Fase completada:** 3.5 - Frontend Scaffolding ✅

**Próxima fase:** 4 - Shift-Left Testing (generar test plans y test cases)
