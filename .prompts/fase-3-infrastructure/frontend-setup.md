Actúa como Senior Frontend Architect, UI/UX Designer, y Full-Stack Developer experto.

---

## 🎯 TAREA

**🔄 FASE 3: FRONTEND SETUP (Sincrónica - UNA sola vez)**

Crear el **Design System base** y **scaffolding del proyecto frontend** que será REUTILIZADO en todas las stories del MVP.

**Esta fase se ejecuta UNA SOLA VEZ** después de haber completado Backend Setup (Fase 3 - backend-setup.md).

---

## 📥 INPUT REQUERIDO

### 1. Contexto del Proyecto

**Leer TODOS estos archivos:**

- `.context/PRD/executive-summary.md` - **CRÍTICO** - Nombre del proyecto, descripción, industry
- `.context/PRD/mvp-scope.md` - Épicas principales del MVP, features
- `.context/PRD/success-metrics.md` - KPIs, métricas de negocio (inspiran dashboard)
- `.context/SRS/architecture-specs.md` - Tech stack frontend, frameworks, librerías
- `.context/SRS/design-specs.md` - Wireframes, paleta de colores, estilos visuales
- `.context/SRS/functional-specs.md` - Features principales (inspiran páginas demo)
- `.context/PBI/epic-tree.md` - (Opcional) Épicas y estructura general para contexto

### 2. Backend Integration

**CRÍTICO - Backend debe estar completado primero:**

- `src/types/supabase.ts` (o `lib/database.types.ts`) - **Tipos generados desde database schema**
- `src/lib/supabase/client.ts` - Supabase browser client
- `src/lib/supabase/server.ts` - Supabase server client
- `src/lib/config.ts` - Configuración centralizada

**Qué identificar:**

1. **Database tables:** Qué entidades existen (para crear helpers de tipos)
2. **Auth flow:** Cómo funciona el login/signup (para crear páginas auth)
3. **API structure:** Qué queries están disponibles

### 3. Proyecto Existente (Si Aplica)

**Si el frontend ya existe parcialmente:**
- `package.json` - Dependencias actuales, package manager lock file
- `src/**` - Estructura de carpetas actual
- `tailwind.config.js` - Configuración de TailwindCSS existente

**Qué identificar:**
1. ¿Ya existe un proyecto Next.js/React/etc.?
2. ¿Qué dependencias ya están instaladas?
3. ¿Qué package manager se está usando?

---

## ⚙️ VERIFICACIÓN DE HERRAMIENTAS (MCP)

### MCP Recomendados:

1. **MCP Context7** - ALTAMENTE RECOMENDADO
   - Consultar docs oficiales antes de escribir código
   - Queries recomendadas:
     - "Next.js 15 App Router latest setup"
     - "TailwindCSS v4 configuration latest"
     - "Shadcn/ui installation Next.js App Router"
     - "Lucide React icons usage"

2. **MCP shadcn/ui** - ALTAMENTE RECOMENDADO (si usuario eligió shadcn/ui)
   - ⭐ **IMPORTANTE:** Si está disponible, úsalo para búsqueda de componentes
   - Permite buscar cualquier componente por lenguaje natural
   - Mucho más rápido que buscar manualmente
   - **Recomendación al usuario:** "Activa el MCP de shadcn/ui para desarrollo más eficiente"
   - Si NO está disponible: usar Context7 o búsqueda manual (funciona igual, pero más lento)

3. **NO se requieren otros MCP** para esta fase

### Herramientas Locales:
- Node.js instalado (v18+ recomendado)
- Package manager (npm/pnpm/yarn/bun) - se preguntará al usuario
- Git (para verificar estado)

### ⚠️ IMPORTANTE - Sobre Tailwind CSS (Versión 3):

**Usaremos Tailwind CSS v3** (versión estable y probada):
- ✅ **Versión recomendada:** v3.4.x (última estable de la serie v3)
- ✅ **Compatible con Next.js 15** + React 19
- ✅ **Totalmente compatible con shadcn/ui** (sin problemas de CLI)
- ✅ Configuración tradicional con `tailwind.config.js/ts`
- ✅ Sintaxis conocida: `@tailwind base/components/utilities`

**¿Por qué v3 en lugar de v4?**
- ❌ Tailwind v4 tiene problemas conocidos de compatibilidad con shadcn-cli
- ❌ Errores de validación durante instalación de componentes
- ❌ Configuración CSS-first más compleja
- ✅ v3 es más estable, probado y sin errores con shadcn/ui

**IMPORTANTE:** Al instalar, especificar explícitamente `tailwindcss@3` (npm install ahora usa v4 por defecto).

---

## 🎯 OBJETIVO DE FASE 3 - FRONTEND

Crear el **Design System base** y **scaffolding del proyecto frontend** que será REUTILIZADO en todas las stories del MVP.

**Incluye:**
- ✅ Setup del proyecto frontend (estructura de carpetas, configuración)
- ✅ **Importar tipos TypeScript del backend** (supabase.ts o database.types.ts)
- ✅ **Design System completo** (paleta, tipografía, componentes UI reutilizables)
- ✅ Layout system (Navbar, Sidebar, Footer según diseño)
- ✅ **2-3 páginas demo estratégicas** (validar que el design system funciona)
- ✅ Documentación completa (`.context/design-system.md`)

**NO incluye:**
- ❌ Implementar TODAS las páginas del MVP (solo demos)
- ❌ Implementar funcionalidad real de negocio (solo UI visual)
- ❌ Diseños específicos de cada story (eso es Fase 7: Implementation)
- ❌ Tests E2E completos (solo validación visual)

**Resultado:** Base visual reutilizable + tipos del backend integrados + demo funcional para mostrar al equipo.

---

## 📤 OUTPUT GENERADO

### Configuración del Proyecto:
- ✅ `package.json` - Dependencias frontend actualizadas
- ✅ `tsconfig.json` - TypeScript configuration
- ✅ `tailwind.config.js` - TailwindCSS con paleta personalizada
- ✅ `next.config.js` (o equivalente) - Framework configuration
- ✅ `postcss.config.js` - PostCSS setup

### Tipos y Helpers:
- ✅ `src/lib/types.ts` - Helpers de tipos extraídos desde database
- ✅ Importa de `src/types/supabase.ts` (creado en backend-setup)

### Design System:
- ✅ `src/components/ui/Button.tsx` - Componente botón reutilizable
- ✅ `src/components/ui/Card.tsx` - Componente card
- ✅ `src/components/ui/Input.tsx` - Componente input/form
- ✅ `src/components/ui/Badge.tsx` - Badges y tags
- ✅ `src/components/ui/Avatar.tsx` - Avatar component
- ✅ (Más componentes según necesidad del proyecto)

### Layout Components:
- ✅ `src/components/layout/Navbar.tsx` - Navigation bar
- ✅ `src/components/layout/Sidebar.tsx` - (Si aplica) Sidebar navigation
- ✅ `src/components/layout/Footer.tsx` - Footer component
- ✅ `src/app/layout.tsx` - Root layout con providers

### Páginas Demo (2-3 estratégicas):
- ✅ `src/app/page.tsx` - Landing/Home page demo
- ✅ `src/app/dashboard/page.tsx` - (Si aplica) Dashboard demo
- ✅ `src/app/[otra-pagina]/page.tsx` - Página demo según dominio

### Estilos:
- ✅ `src/app/globals.css` - Global styles + TailwindCSS imports
- ✅ Custom CSS variables para paleta de colores
- ✅ Typography system (font families, sizes)

### Documentación:
- ✅ `.context/design-system.md` - **CRÍTICO** - Documenta paleta, componentes, uso
- ✅ `SETUP.md` o `README.md` - Setup instructions para developers

### Validation:
- ✅ TypeScript build successful (sin errores de tipos)
- ✅ Dev server starts sin warnings críticos
- ✅ Design system visualmente coherente y atractivo

---

## 🔗 FASE 0.5: INTEGRACIÓN CON BACKEND (NUEVO)

**Objetivo:** Importar tipos TypeScript generados por el backend para zero type errors.

### Paso 0.5.1: Verificar tipos del backend

```markdown
## 🔍 Verificando tipos generados por Backend

**Archivo esperado:** `lib/database.types.ts` (generado en Fase 3.2)

**¿Existe el archivo?**
[Ejecutar: ls -la lib/database.types.ts]

**Si existe:**
✅ Tipos del backend disponibles
✅ Podemos importarlos en el frontend

**Si NO existe:**
⚠️ IMPORTANTE: Debes ejecutar Fase 3.2 (Backend Setup) primero
⚠️ Los tipos se generan con: `npx supabase gen types typescript --project-id xxx > lib/database.types.ts`
```

### Paso 0.5.2: Crear types helper

```markdown
### 📄 Creando Helper de Tipos

**Archivo:** `lib/types.ts`

**Propósito:** Extraer tipos específicos de la base de datos para usar en componentes.

**Creando archivo...**
```

**Directiva:**

Importar tipos de `database.types` y extraer tipos específicos de tablas (Row, Insert, Update). Crear helper types para respuestas de API si es necesario.

**Explicación al usuario:**

```markdown
**✅ Tipos del backend integrados**

**Beneficios:**

1. **Zero type mismatches:** Frontend y backend comparten los mismos tipos
2. **Autocomplete:** TypeScript sabe exactamente qué campos tiene cada entidad
3. **Refactoring seguro:** Cambios en el schema se reflejan automáticamente

**Ejemplo conceptual:**

Los componentes importan tipos de `@/lib/types` y TypeScript valida automáticamente los campos disponibles.

**Si el schema cambia:**
- Re-generas tipos: `npx supabase gen types typescript...`
- TypeScript te avisa dónde hay errores
- Actualizas el código
- Zero bugs en producción por campos inexistentes
```

---

## 🚨 RESTRICCIONES CRÍTICAS

### ❌ NO HACER:
- **NO usar comandos como `create-next-app`, `create-vite`, `create-react-app`** - Estos crean subdirectorios
- **NO crear subcarpetas para el proyecto** - Ya estamos en el directorio correcto
- **NO instalar dependencias innecesarias** - Solo fundamentales
- **NO implementar todas las páginas del MVP** - Solo 2-3 páginas demo estratégicas
- **NO implementar funcionalidad real** - Solo UI bonita con mock data para validar design system
- **NO implementar criterios de aceptación completos** - Eso es para Fase 7 (Implementation)
- **NO usar nombres de ejemplo de otros dominios** - Analiza el PRD/SRS/PBI del proyecto actual e identifica el vocabulario específico del dominio de este negocio
- **NO ejecutar comandos interactivos** (ej: `npm run dev`) - Solo comandos que terminen
- **NO hacer commits automáticos** - Solo recomendar al usuario
- **NO crear diseños genéricos/aburridos** - Debe ser visualmente impresionante

### ✅ SÍ HACER:
- **Hacer preguntas al usuario** - Preferencias de diseño, package manager, etc.
- **Usar Context7 MCP** - Consultar docs oficiales (Next.js, Supabase, TailwindCSS, etc.)
- **Importar tipos del backend** - Usar database.types.ts y crear helpers
- **Crear design system completo** - Botones, cards, inputs, etc. con estilo coherente
- **Aplicar paleta de colores** - Elegida o generada según negocio
- **Páginas visualmente atractivas** - Modernas, con personalidad
- **Explicar cada decisión** - Educar al usuario
- **Documentar diseño** - Crear `.context/design-system.md`
- **Validar con build** - Comando según package manager elegido

---

## 🔄 WORKFLOW

El proceso se divide en múltiples fases ejecutadas secuencialmente:

1. **Fase 0:** Setup y selección de package manager
2. **Fase 0.5:** Integración con tipos del backend
3. **Fase 1:** Análisis de contexto y decisiones de diseño
4. **Fase 2:** Instalación de dependencias
5. **Fase 3:** Design System (componentes UI)
6. **Fase 4:** Layout Components (Navbar, Sidebar, Footer)
7. **Fase 5:** Páginas Demo (2-3 estratégicas)
8. **Fase 6:** Documentación
9. **Fase 7:** Validación y Build

---

## 📦 FASE 0: SETUP & PACKAGE MANAGER

**Objetivo:** Educar al usuario sobre package managers y que elija cuál usar.

### Paso 0.1: Educar sobre Package Managers

**Explica al usuario:**

```markdown
## 📦 Selección de Package Manager

Antes de comenzar, necesito saber qué **package manager** quieres usar para instalar dependencias.

### ¿Qué es un Package Manager?

Un **package manager** es una herramienta que instala, actualiza y gestiona las librerías (paquetes) que tu proyecto necesita.

**npm (Node Package Manager):**
- El package manager **por defecto** que viene con Node.js
- Funciona bien, pero es el más lento de los tres
- Usa `node_modules/` tradicional
- Comando: `npm install`, `npm run dev`

**Las alternativas modernas (más rápidas):**

### 🚀 Opciones Recomendadas:

Hoy en día, hay alternativas **mucho más rápidas y eficientes** que npm:
```

### Paso 0.2: Preguntar Package Manager

**Usa `AskUserQuestion` tool:**

```markdown
**Pregunta al usuario** usando la herramienta `AskUserQuestion`:

**Pregunta:** "¿Qué package manager quieres usar para este proyecto?"

**Opciones:**

1. **pnpm** (Fast and disk-efficient)
   - **Descripción:** "Extremadamente rápido, ahorra espacio en disco usando hard links. Instalaciones hasta 2x más rápidas que npm. Muy popular en monorepos y proyectos grandes."
   - **Ventajas:** Eficiente en espacio, rápido, compatible con npm
   - **Comandos:** `pnpm install`, `pnpm run dev`

2. **bun** (Blazingly fast, all-in-one toolkit) ⭐ **RECOMENDADO**
   - **Descripción:** "El más rápido de todos (hasta 25x más rápido que npm). No solo instala paquetes, también ejecuta JavaScript y TypeScript directamente. Es la opción más moderna."
   - **Ventajas:** Velocidad extrema, ejecuta código JS/TS sin transpilación, todo-en-uno
   - **Comandos:** `bun install`, `bun run dev`

3. **Elige por mí** (Recomendación automática)
   - **Descripción:** "La IA seleccionará el package manager más apropiado basándose en tu proyecto y sistema operativo. Por defecto se recomienda **bun** por su velocidad y modernidad."

**Header de la pregunta:** "Package Manager"
**MultiSelect:** false
```

### Paso 0.3: Procesar Respuesta

**Según la respuesta del usuario:**

- Si elige **pnpm** → Usar pnpm en todos los comandos
- Si elige **bun** → Usar bun en todos los comandos
- Si elige **"Elige por mí"** → Seleccionar **bun** (recomendado) y explicar por qué

**Output esperado:**

```markdown
## ✅ Package Manager Seleccionado: [pnpm/bun]

**Razón:** [Si fue "Elige por mí", explicar: "He seleccionado **bun** porque es el más rápido y moderno, perfecto para desarrollo ágil. Instalaciones hasta 25x más rápidas que npm."]

**Comandos que usaremos:**
- Instalar dependencias: `[pnpm/bun] install`
- Agregar paquetes: `[pnpm/bun] add [paquete]`
- Ejecutar dev: `[pnpm/bun] run dev`
- Build: `[pnpm/bun] run build`

**Próximo paso:** Análisis del contexto del proyecto.
```

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

**Backend Types (NUEVO):**
- `lib/database.types.ts` → Tipos generados del schema de Supabase
- Identificar entidades principales disponibles

**Qué identificar:**

1. **Dominio del negocio:**
   - ¿Qué problema resuelve? (PRD)
   - ¿Quiénes son los usuarios? (PRD)
   - ¿Cuál es el vocabulario del dominio? (nombres, entidades)
   - **¿Qué personalidad/tono debe tener?** (formal, creativo, corporativo, startup)

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

4. **Pistas de diseño (si existen en docs):**
   - ¿Menciona colores específicos?
   - ¿Menciona estilo visual (minimalista, moderno, etc.)?
   - ¿Menciona referencias de diseño?

**Output de este paso (NO mostrar al usuario, uso interno):**
- Stack técnico identificado
- Dominio del negocio comprendido
- Personalidad/tono de la aplicación
- Lista de épicas prioritarias
- Vocabulario del dominio
- Pistas de diseño (si existen)
- **Entidades disponibles en database.types.ts**

---

### Paso 1.2: Consultar Documentación Oficial (Context7 MCP)

**Acción:** Usa el MCP de Context7 para consultar la documentación oficial de las tecnologías del stack identificado.

**Queries recomendadas:**

1. **Framework:**
   - "[Framework] project structure best practices latest version"
   - "[Framework] routing configuration"

2. **Auth Provider:**
   - "[Auth Provider] client setup [Framework]"
   - "[Auth Provider] authentication flow [Framework]"

3. **UI Library (MUY IMPORTANTE):**
   - "[UI Library] setup [Framework]"
   - "[UI Library] theming and customization"
   - "[UI Library] component patterns"

**Objetivo:** Obtener información actualizada sobre cómo crear componentes bonitos y aplicar diseño.

**Output esperado (mostrar al usuario):**

```markdown
## 📚 Análisis Completado

### Stack Técnico Identificado:
- **Framework:** [Nombre y versión del SRS]
- **UI Library:** [Identificado del SRS]
- **Auth Provider:** [Identificado del SRS]
- **Backend/DB:** [Identificado del SRS]

### Dominio del Negocio:
- **Problema que resuelve:** [Resumen 1 línea del PRD]
- **Usuarios principales:** [Listar personas del PRD]
- **Entidades core:** [Listar entidades principales]
- **Personalidad/Tono:** [Formal/Creativo/Corporativo/Startup - inferir del PRD]

### Épicas Prioritarias (del PBI):
1. EPIC-{PROJECT_KEY}-{ISSUE_NUM}-{nombre}: [Descripción] - [Razón de prioridad]
2. EPIC-{PROJECT_KEY}-{ISSUE_NUM}-{nombre}: [Descripción] - [Razón de prioridad]
3. EPIC-{PROJECT_KEY}-{ISSUE_NUM}-{nombre}: [Descripción] - [Razón de prioridad]

### Tipos Backend Disponibles:
[Listar entidades identificadas en database.types.ts]

### Documentación Consultada:
- **[Framework]**: [Conceptos clave]
- **[UI Library]**: [Patrones de diseño disponibles]
- **[Auth Provider]**: [Setup recomendado]

**Próximo paso:** Preguntar preferencias de diseño al usuario.
```

---

## 🎨 FASE 1.5: DISEÑO & PREFERENCIAS VISUALES (INTERACTIVA)

**Objetivo:** Recopilar preferencias visuales del usuario para crear un diseño coherente y bonito.

### Paso 1.5.1: Pregunta 1 - Paleta de Colores

**Usa `AskUserQuestion` tool:**

**Pregunta:** "¿Qué paleta de colores prefieres para tu aplicación?"

**Header:** "Paleta de Colores"

**Opciones:**

1. **Azul Profesional** (Confianza y corporativo)
   - **Descripción:** "Tonos azules (ej: #3B82F6). Transmite confianza, profesionalismo. Ideal para: SaaS empresarial, aplicaciones B2B, plataformas corporativas."

2. **Verde Moderno** (Crecimiento y tech)
   - **Descripción:** "Tonos verdes (ej: #10B981). Transmite innovación, crecimiento. Ideal para: Startups tech, sostenibilidad, salud."

3. **Morado Creativo** (Creatividad y premium)
   - **Descripción:** "Tonos morados (ej: #8B5CF6). Transmite creatividad, lujo. Ideal para: Apps creativas, comunidades, productos premium."

4. **Naranja Energético** (Energía y acción)
   - **Descripción:** "Tonos naranjas (ej: #F59E0B). Transmite energía, call-to-action. Ideal para: Plataformas transaccionales, apps de acción, servicios dinámicos."

5. **Elige por mí** (Basado en tu negocio)
   - **Descripción:** "La IA analizará la personalidad de tu negocio (del PRD) y seleccionará la paleta más apropiada automáticamente."

**MultiSelect:** false

---

### Paso 1.5.2: Pregunta 2 - Estilo Visual

**Usa `AskUserQuestion` tool:**

**Pregunta:** "¿Qué estilo visual prefieres para la interfaz?"

**Header:** "Estilo Visual"

**Opciones:**

1. **Minimalista** (Clean y espacioso)
   - **Descripción:** "Diseño limpio, mucho espacio en blanco, tipografía clara. Estilo Apple/Notion. Ideal para: Herramientas de productividad, dashboards, SaaS."

2. **Moderno/Bold** (Vibrante y llamativo)
   - **Descripción:** "Colores vibrantes, bordes redondeados, gradientes sutiles. Estilo Stripe/Vercel. Ideal para: Startups, productos innovadores, tech."

3. **Corporativo** (Serio y profesional)
   - **Descripción:** "Diseño formal, líneas rectas, colores sobrios. Estilo IBM/Microsoft. Ideal para: Enterprise, finanzas, gobierno."

4. **Startup/Playful** (Amigable y accesible)
   - **Descripción:** "Colores alegres, ilustraciones, bordes redondeados. Estilo Slack/Mailchimp. Ideal para: Comunidades, educación, consumer apps."

5. **Elige por mí** (Basado en tu negocio)
   - **Descripción:** "La IA seleccionará el estilo que mejor se ajuste a la personalidad de tu aplicación (inferida del PRD)."

**MultiSelect:** false

---

### Paso 1.5.3: Pregunta 3 - Layout Principal

**Usa `AskUserQuestion` tool:**

**Pregunta:** "¿Qué tipo de layout prefieres para la aplicación?"

**Header:** "Layout Principal"

**Opciones:**

1. **Sidebar + Top Navbar** (Dashboard clásico)
   - **Descripción:** "Navegación lateral fija con barra superior. Ideal para: Aplicaciones con muchas secciones (5+), dashboards, herramientas complejas."

2. **Solo Top Navbar** (Clean y simple)
   - **Descripción:** "Solo barra de navegación superior. Ideal para: Aplicaciones simples (2-4 secciones), landing pages, apps enfocadas."

3. **Sidebar Collapsible** (Flexible y moderno)
   - **Descripción:** "Sidebar que se puede ocultar/expandir. Ideal para: Aplicaciones medianas, necesitas espacio flexible, UX moderna."

4. **Elige por mí** (Según páginas del MVP)
   - **Descripción:** "La IA analizará cuántas páginas tiene tu MVP y seleccionará el layout más apropiado (2-3 páginas → Top Nav, 4+ → Sidebar)."

**MultiSelect:** false

---

### Paso 1.5.4: Pregunta 4 - Componentes UI Prioritarios

**Usa `AskUserQuestion` tool:**

**Pregunta:** "¿Qué componentes UI son prioritarios para tu aplicación? (puedes elegir varios)"

**Header:** "Componentes UI"

**Opciones:**

1. **Botones & CTAs** (Siempre recomendado)
   - **Descripción:** "Botones primary, secondary, outline, ghost. Esenciales para cualquier aplicación."

2. **Cards & Containers** (Muy común)
   - **Descripción:** "Tarjetas para mostrar información, contenedores con sombras/bordes. Útil para: Listas, dashboards, grids."

3. **Forms & Inputs** (Si tienes formularios)
   - **Descripción:** "Inputs, textareas, selects, checkboxes. Esencial para: Auth, formularios de creación/edición."

4. **Modals & Dialogs** (Interacciones)
   - **Descripción:** "Ventanas modales, confirmaciones, diálogos. Útil para: Confirmaciones, detalles, formularios rápidos."

5. **Elige por mí** (Según épicas del MVP)
   - **Descripción:** "La IA analizará las épicas de tu MVP y seleccionará los componentes que más necesitarás."

**MultiSelect:** true (puede elegir varios)

---

### Paso 1.5.5: Procesar Respuestas y Generar Plan de Diseño

**Después de recibir todas las respuestas, genera un plan:**

```markdown
## 🎨 Plan de Diseño Generado

Basándome en tus preferencias y el análisis del proyecto, aquí está el plan de diseño:

---

### Paleta de Colores: [Seleccionada]

**Colores principales:**
- **Primary:** [Color hex] - [Descripción]
- **Secondary:** [Color hex] - [Descripción]
- **Accent:** [Color hex] - [Descripción]
- **Background:** [Color hex]
- **Text:** [Color hex]
- **Border:** [Color hex]

**Razón:** [Si fue "Elige por mí", explicar: "He seleccionado [Color] porque tu aplicación es sobre [dominio] que transmite [valor], y esta paleta comunica [mensaje]."]

---

### Estilo Visual: [Seleccionado]

**Características:**
- Espaciado: [Generoso/Compacto]
- Bordes: [Redondeados/Rectos/Muy redondeados]
- Sombras: [Sutiles/Pronunciadas/Ninguna]
- Tipografía: [Sans-serif moderna/Serif formal]

**Razón:** [Si fue "Elige por mí", explicar por qué se ajusta al negocio]

---

### Layout: [Seleccionado]

**Estructura:**
- Navegación: [Sidebar/Top Nav/Sidebar Collapsible]
- Header: [Presente/Ausente] - [Contenido]
- Footer: [Presente/Ausente] - [Contenido si aplica]

**Razón:** [Si fue "Elige por mí", explicar: "Tu MVP tiene [X] páginas, por lo que [layout] es ideal."]

---

### Componentes UI a Crear:

**Nivel 1 (Esenciales - siempre se crean):**
- ✅ Button (primary, secondary, outline, ghost, danger)
- ✅ Card (default, hover, clickable)
- ✅ Layout components (Navbar, Sidebar si aplica)

**Nivel 2 (Según selección):**
[Listar componentes seleccionados por el usuario]

**Nivel 3 (Específicos del dominio):**
[Basándote en épicas, listar componentes específicos que se necesitarán]

---

**Próximo paso:** Decidir estrategia de componentes UI.
```

---

## 🧩 FASE 1.6: ESTRATEGIA DE COMPONENTES UI (INTERACTIVA)

**Objetivo:** Decidir cómo implementar el design system (componentes UI).

**CRÍTICO:** Esta decisión afecta significativamente el tiempo y esfuerzo de desarrollo.

---

### Paso 1.6.1: Pregunta - Estrategia de Componentes UI

**Usa `AskUserQuestion` tool:**

**Pregunta:** "¿Cómo prefieres implementar los componentes UI del design system?"

**Header:** "Estrategia UI"

**Opciones:**

1. **shadcn/ui** (Recomendado - Rápido y profesional) ⭐
   - **Descripción:** "Componentes pre-hechos, modernos y accesibles que se instalan con CLI. Compatible con Tailwind v4. Se integran directamente en tu código (no en node_modules) para total customización. Ahorra 80-90% del tiempo. Incluye: Button, Card, Input, Dialog, Select, Dropdown, Tooltip, y 40+ componentes más. Usado por Vercel, shadcn, y miles de proyectos."

2. **Componentes desde cero** (Control total y educativo)
   - **Descripción:** "La IA creará cada componente manualmente desde cero usando TypeScript + Tailwind CSS. Control absoluto sobre cada línea de código. Ideal para: aprender desarrollo de componentes, requisitos muy específicos, o proyectos con design system único. Más lento pero educativo."

3. **Headless UI + estilos custom** (Balance intermedio)
   - **Descripción:** "Usa Headless UI de Tailwind Labs para la lógica (accesibilidad, estados, keyboard navigation) y la IA crea los estilos visuales con Tailwind. Balance entre rapidez y control. Ideal para: necesitas accesibilidad garantizada pero quieres estilos únicos."

4. **Elige por mí** (Recomendación automática)
   - **Descripción:** "La IA analizará el tipo de proyecto y elegirá la mejor opción. Por defecto recomienda shadcn/ui por eficiencia, calidad y tiempo de desarrollo. Solo elegirá manual si detecta requisitos muy específicos."

**MultiSelect:** false

---

### Paso 1.6.2: Procesar Respuesta y Documentar Decisión

**Según la respuesta del usuario:**

**Si elige "shadcn/ui":**

```markdown
## ✅ Estrategia Seleccionada: shadcn/ui

**Ventajas para tu proyecto:**
- ✅ 40+ componentes profesionales en minutos (vs días/semanas)
- ✅ Accesibilidad WAI-ARIA incluida (screen readers, keyboard navigation)
- ✅ Responsive por defecto
- ✅ Compatible con Tailwind v4 (verificado)
- ✅ Compatible con React 19 + Next.js 15
- ✅ Código en tu proyecto (100% customizable)
- ✅ TypeScript con tipos completos
- ✅ Comunidad activa (miles de proyectos)

**Componentes disponibles:**
- UI Básico: Button, Card, Badge, Avatar, Separator
- Formularios: Input, Textarea, Select, Checkbox, Radio, Switch, Label
- Overlays: Dialog, Popover, Tooltip, Sheet, Drawer
- Navigation: Tabs, Dropdown Menu, Command Menu
- Feedback: Alert, Toast, Progress, Skeleton
- Layout: Accordion, Collapsible, Separator
- Data: Table, Data Table (con sorting, filtering)
- Y 20+ más...

**Instalación:** Se realizará en Fase 4.

**Próximo paso:** Decidir páginas demo del MVP.
```

**Si elige "Componentes desde cero":**

```markdown
## ✅ Estrategia Seleccionada: Componentes desde cero

**Beneficios para tu proyecto:**
- ✅ Control total sobre cada línea de código
- ✅ Aprendizaje profundo de arquitectura de componentes
- ✅ Sin dependencias externas
- ✅ 100% customizado a tu necesidad específica

**Componentes a crear:**
[Usar lista del Paso 1.5.5: Componentes UI a Crear]

**Consideraciones:**
- ⚠️ Mayor tiempo de desarrollo (3-5x más lento)
- ⚠️ La IA deberá implementar accesibilidad manualmente
- ⚠️ Cada componente = 50-150 líneas de código

**Implementación:** Se realizará en Fase 4.

**Próximo paso:** Decidir páginas demo del MVP.
```

**Si elige "Headless UI":**

```markdown
## ✅ Estrategia Seleccionada: Headless UI + estilos custom

**Beneficios para tu proyecto:**
- ✅ Lógica de componentes robusta (Tailwind Labs)
- ✅ Accesibilidad garantizada
- ✅ Estilos 100% personalizados
- ✅ Más rápido que desde cero
- ✅ Official support de Tailwind team

**Componentes disponibles:**
- Listbox (Select), Combobox (Autocomplete)
- Menu (Dropdown), Popover, Dialog (Modal)
- Disclosure (Accordion), Tabs, Switch
- Radio Group, Transition utilities

**Implementación:** Se realizará en Fase 4.

**Próximo paso:** Decidir páginas demo del MVP.
```

**Si elige "Elige por mí":**

```markdown
## 🤖 Analizando proyecto para recomendar estrategia...

**Análisis:**
- Tipo de proyecto: [Inferir del PRD]
- Complejidad UI: [Analizar épicas del PBI]
- Tiempo disponible: [Inferir de urgencia en PRD]
- Requisitos especiales: [Buscar en SRS]

**Recomendación: shadcn/ui** ⭐

**Razón:**
Tu proyecto [tipo de proyecto] requiere [X] componentes UI. shadcn/ui ofrece:
- [Beneficio específico 1 basado en épicas]
- [Beneficio específico 2 basado en user journeys]
- Reducción de tiempo de desarrollo en ~85%

Si tuvieras requisitos muy específicos de [área], recomendaría componentes desde cero.
Pero para tu caso, shadcn/ui es la opción óptima.

**Próximo paso:** Decidir páginas demo del MVP.
```

---

## 🏗️ FASE 2: DECISIÓN DE PÁGINAS DEMO

**Objetivo:** Decidir qué 2-3 páginas demo crear SOLO para validar el design system.

**Criterio de selección:**
- **NO** todas las páginas del MVP
- **SOLO** páginas que demuestren componentes del design system
- Típicamente: Auth + 1-2 páginas core del dominio

**Ejemplos según tipo de app:**
```pseudocode
SI app_tipo == "dashboard/herramienta":
  Páginas: Login + Vista principal (grid de entidades)

SI app_tipo == "plataforma transaccional":
  Páginas: Login + Grid de items principales

SI app_tipo == "comunidad/social":
  Páginas: Login + Feed/listado principal

SI app_tipo == "gestión de recursos":
  Páginas: Login + Listado de recursos principales
```

**Output de este paso:**
```markdown
## 📄 Páginas Demo Seleccionadas (2-3)

1. **[Nombre de página 1]** (`/[ruta]`)
   - **Propósito:** Validar [componentes que muestra]
   - **Componentes UI que usa:** [Button, Card, Form, etc.]

2. **[Nombre de página 2]** (`/[ruta]`)
   - **Propósito:** Validar [componentes que muestra]
   - **Componentes UI que usa:** [List, etc.]

**Nota:** Las demás páginas del MVP se implementarán en Fase 7 (Implementation) según los planes de cada story.
```

---

## 🏗️ FASE 3: SETUP DEL PROYECTO

**Objetivo:** Configurar el proyecto con el package manager seleccionado.

### Paso 3.1: Verificar Entorno Actual

```markdown
**Package manager seleccionado:** [pnpm/bun]
**Comandos a usar:** `[pm] install`, `[pm] run dev`, etc.
```

---

### Paso 3.2: Instalar Dependencias Fundamentales

**IMPORTANTE:** Usar el package manager seleccionado en Fase 0.

**Proceso:**

1. **Verificar versiones con Context7 PRIMERO:**
```markdown
Antes de instalar, consultar Context7 MCP para versiones actualizadas:
- "Next.js latest stable version installation"
- "Tailwind CSS v4 installation packages"
- "Supabase SSR Next.js latest version"
```

2. **Core Framework (Next.js):**
```bash
# Next.js 15.x (estable)
[pnpm/bun] add next@latest react@latest react-dom@latest

# Verificar versión instalada
[pnpm/bun] list next
# Esperado: next@15.x.x o superior
```

3. **UI Library (Tailwind CSS v3):**
```bash
# IMPORTANTE: Especificar versión 3 explícitamente
[pnpm/bun] add -D tailwindcss@3 postcss@latest autoprefixer@latest

# Verificar versión instalada
[pnpm/bun] list tailwindcss
# Esperado: tailwindcss@3.4.x
```

**⚠️ CRÍTICO:** Usar `tailwindcss@3` (NO `@latest`) ya que npm ahora instala v4 por defecto.

4. **Auth Provider (Supabase):**
```bash
# Supabase clients (versiones estables)
[pnpm/bun] add @supabase/supabase-js@latest @supabase/ssr@latest

# Verificar versiones instaladas
[pnpm/bun] list | grep supabase
# Esperado:
# @supabase/supabase-js@2.x.x
# @supabase/ssr@0.x.x
```

5. **TypeScript + Dev Tools:**
```bash
[pnpm/bun] add -D typescript @types/react @types/node eslint prettier

# Si se usa shadcn/ui (opcional):
[pnpm/bun] add -D @types/react-dom
```

6. **Validar todas las versiones:**
```bash
# Ver versiones de dependencias críticas
[pnpm/bun] list | grep -E "(next|react|tailwindcss|supabase)"
```

**Output esperado:**
```markdown
✅ Dependencias instaladas:
   - next: ^15.x.x ✓
   - react: ^19.x.x ✓
   - tailwindcss: ^3.4.x ✓ (IMPORTANTE: debe ser v3, NO v4)
   - @supabase/ssr: ^0.x.x ✓
   - @supabase/supabase-js: ^2.x.x ✓

⚠️ Si tailwindcss es 4.x.x:
   - PROBLEMA: Se instaló v4 por error
   - Solución: [pm] remove tailwindcss && [pm] add -D tailwindcss@3
```

---

### Paso 3.3: Crear Estructura de Carpetas

**Estructura debe incluir:**
```
[framework-dir]/
├── components/
│   ├── ui/           ← Design system components (Button, Card, etc.)
│   ├── layout/       ← Layout components (Navbar, Sidebar, etc.)
│   └── [domain]/     ← Domain-specific components
├── lib/
│   ├── database.types.ts  ← Backend types (ya existe desde Fase 3.2)
│   ├── types.ts           ← Type helpers (crear en Fase 0.5)
│   └── utils.ts           ← Utilities (cn function, etc.)
```

---

### Paso 3.4: Configurar Tailwind v3 con Paleta Personalizada

**Configuración tradicional con tailwind.config.ts**

**🎯 Verificar con Context7 (opcional):**

Si necesitas referencia, consultar Context7 MCP:
- Query: "Tailwind CSS v3 Next.js 15 setup configuration"

**Acción:** Crear archivos de configuración de Tailwind v3.

```markdown
### 🎨 Configurando Tailwind v3 (Configuración Tradicional)

**Configuración de Tailwind v3:**
- ✅ Usa `tailwind.config.ts` (o `.js`)
- ✅ Configuración de `content` paths para detección de clases
- ✅ Extensión de `theme` para colores personalizados
- ✅ Compatible 100% con shadcn/ui

**Propósito:** Aplicar la paleta de colores seleccionada en Fase 1.5 a todo el proyecto.
```

**Paso 3.4.1: Inicializar configuración de Tailwind**

```markdown
**Creando archivos de configuración:**
```bash
npx tailwindcss init -p
```

**Archivos creados:**
- `tailwind.config.js` (o renombrar a `.ts`)
- `postcss.config.js`

**Paso 3.4.2: Configurar tailwind.config.ts con paleta personalizada**

**Archivo:** `tailwind.config.ts`

**Directiva:**

Configurar `content` paths para detectar archivos que usan Tailwind, y extender `theme.extend.colors` con CSS variables que se definirán en globals.css. Usar formato HSL para compatibilidad con shadcn/ui.

**Paso 3.4.3: Explicación al usuario**

**Explicación al usuario:**
```markdown
**✅ Tailwind v3 configurado**

**Ventajas de v3 para este proyecto:**
- ✅ Totalmente compatible con shadcn/ui (sin errores)
- ✅ Configuración clara y documentada
- ✅ Stable y probado con Next.js 15

**Uso en componentes:**
- `bg-primary` → Color principal
- `text-primary` → Texto en color principal
- `border-primary` → Borde en color principal
- `bg-primary/90` → Primary con 90% opacidad

**Próximo paso:** Configurar estilos globales con la paleta.
```

---

### Paso 3.5: Configurar Archivo de Estilos Globales con Tailwind v3

**Sintaxis tradicional de Tailwind v3:**

```markdown
### 🎨 Creando Estilos Globales (Tailwind v3)

**Archivo:** `app/globals.css` (o ubicación según framework)

**Propósito:**
1. Importar directivas de Tailwind v3
2. Definir CSS variables para paleta de colores
3. Aplicar estilos base personalizados

**Creando archivo...**
```

**Directiva:**

1. Usar directivas tradicionales de v3:
   - `@tailwind base;`
   - `@tailwind components;`
   - `@tailwind utilities;`

2. Definir CSS variables en `:root` y `.dark`:
   - Colores en formato HSL: `--background`, `--foreground`, `--primary`, `--secondary`, etc.
   - Border radius: `--radius`
   - Usar formato compatible con shadcn/ui

3. En `@layer base`, aplicar estilos base al body

**Nota sobre HSL:**
```markdown
**¿Por qué HSL?**

Tailwind v3 + shadcn/ui usan HSL porque:
- ✅ Compatible con CSS variables
- ✅ Fácil manipulación de opacidad (ej: `hsl(var(--primary) / 0.9)`)
- ✅ Totalmente compatible con shadcn/ui
- ✅ Formato estándar y conocido

**Ejemplo de CSS variables:**
```css
:root {
  --background: 0 0% 100%;       /* white */
  --foreground: 222.2 84% 4.9%;  /* dark text */
  --primary: 221.2 83.2% 53.3%;  /* blue */
  --secondary: 210 40% 96.1%;    /* light blue */
}
```

---

## 🎨 FASE 4: IMPLEMENTAR DESIGN SYSTEM (COMPONENTES UI)

**Objetivo:** Implementar componentes UI según la estrategia elegida en Fase 1.6.

**ESTA ES LA FASE MÁS IMPORTANTE PARA EL DISEÑO VISUAL**

**Estrategias disponibles:**
- **Opción A:** shadcn/ui (Rápido - instalación CLI)
- **Opción B:** Componentes desde cero (Manual - implementación completa)
- **Opción C:** Headless UI + estilos (Híbrido)

**Seguir la sección correspondiente a la estrategia elegida.**

---

## 📦 OPCIÓN A: IMPLEMENTAR CON SHADCN/UI

**Usar SOLO si el usuario eligió "shadcn/ui" en Fase 1.6**

### Paso 4A.1: Verificar Herramientas MCP y Compatibilidad

**⚠️ RECOMENDACIÓN AL USUARIO:**

```markdown
## 💡 Recomendación: MCP shadcn/ui

**Para desarrollo más rápido y eficiente, activa el MCP de shadcn/ui.**

Con el MCP:
- ✅ Busca componentes por lenguaje natural
- ✅ Ve opciones disponibles instantáneamente
- ✅ Acelera implementación 3-5x

Sin el MCP:
- ⚠️ Debes buscar componentes manualmente
- ⚠️ Proceso más lento (pero funciona igual)

**¿Continúo?** (La IA continuará con o sin MCP)
```

**Verificar compatibilidad (Context7 o shadcn/ui MCP):**

```markdown
**Query (opcional):** "shadcn/ui Tailwind v3 Next.js 15 compatibility"

**Validación esperada:**
- ✅ shadcn/ui totalmente compatible con Tailwind v3
- ✅ Compatible con Next.js 15 + React 19
- ✅ Sin problemas de validación de CLI
```

---

### Paso 4A.2: Inicializar shadcn/ui

```markdown
## 🎬 Inicializando shadcn/ui CLI

**Comando:**
```bash
[pnpm/bun] dlx shadcn@latest init
```

**Proceso interactivo (responder):**

1. **Would you like to use TypeScript?** → Yes
2. **Which style would you like to use?** → Default (o New York si prefieres más minimalista)
3. **Which color would you like to use as base color?** → [Elegir según paleta de Fase 1.5]
   - Si paleta es azul → Slate o Blue
   - Si paleta es verde → Green o Emerald
   - Si paleta es morado → Violet
   - Si paleta es naranja → Orange
4. **Where is your global CSS file?** → `app/globals.css` (o según ubicación)
5. **Would you like to use CSS variables for colors?** → Yes
6. **Are you using a custom tailwind prefix?** → No
7. **Where is your tailwind.config located?** → `tailwind.config.ts` (o `.js` según tu archivo)
8. **Configure the import alias for components** → `@/components`
9. **Configure the import alias for utils** → `@/lib/utils`

**Output esperado:**
```
✔ Writing components.json
✔ Installing dependencies
✔ Created lib/utils.ts
```

**Explicar al usuario:**
```markdown
✅ shadcn/ui inicializado

**Archivos creados:**
- `components.json` - Configuración de shadcn/ui
- `lib/utils.ts` - Utilidad cn() (merge de clases Tailwind)

**Próximo paso:** Instalar componentes esenciales.
```

---

### Paso 4A.3: Configurar Colores con Paleta de Fase 1.5

**Acción:** Las CSS variables de shadcn/ui ya están configuradas en globals.css.

**Directiva:**

shadcn/ui CLI crea automáticamente las CSS variables en `:root` y `.dark` cuando ejecutas `shadcn@latest init`. Estas variables ya están en formato HSL compatible. Solo necesitas ajustar los valores HSL según la paleta elegida en Fase 1.5.

**Variables principales a personalizar:**
- `--primary`: Color principal de la paleta elegida
- `--secondary`: Color secundario
- `--accent`: Color de acento
- `--background`, `--foreground`: Colores de fondo y texto

**Resultado:** Componentes shadcn/ui usan automáticamente tu paleta personalizada.

---

### Paso 4A.4: Instalar Componentes según Selección de Fase 1.5.4

**Estrategia de instalación:**

**Si usuario tiene MCP shadcn/ui:** Buscar componentes por lenguaje natural según necesidad.

**Si NO tiene MCP:** Instalar con CLI:

```pseudocode
Comando base: [pm] dlx shadcn@latest add [componente]

Componentes SIEMPRE:
  - button, card, label

SI usuario seleccionó "Forms & Inputs" en Fase 1.5.4:
  - input, textarea, select, checkbox, radio-group, switch

SI usuario seleccionó "Modals & Dialogs":
  - dialog, popover, tooltip, sheet

Adicionales recomendados:
  - badge, avatar, separator, skeleton
```

**Resultado:** Componentes en `components/ui/`, fully typed, con accesibilidad WAI-ARIA.

---

### Paso 4A.5: Validar Instalación

```markdown
## ✅ Validando instalación de shadcn/ui
```

**Comando:**
```bash
ls -la components/ui/
```

**Verificar que existen:**
- `button.tsx` ✓
- `card.tsx` ✓
- `input.tsx` ✓ (si instalado)
- [otros componentes instalados]

**Comando de build para verificar tipos:**
```bash
[pnpm/bun] run build
```

**Esperado:**
- ✅ Sin errores de TypeScript
- ✅ Componentes compilan correctamente
- ✅ CSS de Tailwind v3 funciona
- ✅ shadcn/ui componentes sin errores de CLI

---

## 🔧 OPCIÓN B: IMPLEMENTAR COMPONENTES DESDE CERO

**Usar SOLO si el usuario eligió "Componentes desde cero" en Fase 1.6**

### Paso 4B.1: Crear Componente Button (Esencial)

```markdown
### 🔘 Creando Componente Button

**Archivo:** `components/ui/button.tsx`

**Propósito:** Botón reutilizable con variantes (primary, secondary, outline, ghost, danger).

**Variantes a implementar:**
- **primary:** Color principal, para acciones principales
- **secondary:** Color secundario, para acciones secundarias
- **outline:** Solo borde, para acciones terciarias
- **ghost:** Sin fondo, para acciones sutiles
- **danger:** Rojo, para acciones destructivas

**Tamaños:**
- sm (pequeño)
- md (mediano - default)
- lg (grande)

**Diseño aplicado:**
- Paleta: [Usar colores de tailwind.config]
- Bordes: [Según estilo visual elegido]
- Hover/Active states: [Transiciones suaves]
- Disabled state: [Opacidad reducida]

**Creando componente...**
```

**Directiva para la IA (NO hardcodear código completo):**

"Crea un componente Button usando TypeScript + TailwindCSS que implemente las variantes mencionadas. Usa `class-variance-authority` (cva) para gestionar variantes de forma limpia. Aplica la paleta de colores de `tailwind.config.ts` y el estilo de bordes/sombras según el estilo visual elegido. Incluye estados de hover, active, focus y disabled."

---

### Paso 4.2: Crear Componente Card (Esencial)

```markdown
### 🃏 Creando Componente Card

**Archivo:** `components/ui/card.tsx`

**Propósito:** Contenedor reutilizable para mostrar información agrupada.

**Variantes a implementar:**
- **default:** Card básica con borde/sombra
- **hover:** Con efecto hover (sube ligeramente)
- **clickable:** Con cursor pointer y hover effect

**Partes del componente:**
- CardHeader
- CardContent
- CardFooter

**Diseño aplicado:**
- Sombra: [Según estilo visual]
- Bordes: [Según estilo visual]
- Padding: [Generoso/Compacto según estilo]
- Background: bg-card (definido en theme)

**Creando componente...**
```

**Directiva para la IA:**

"Crea un componente Card con sub-componentes (Header, Content, Footer) usando TailwindCSS. Aplica sombras y bordes según el estilo visual elegido. Si el estilo es 'Moderno/Bold', usa sombras más pronunciadas y hover effects. Si es 'Minimalista', usa sombras sutiles."

---

### Paso 4.3: Crear Componentes de Formulario (Si aplica)

**Solo si el usuario seleccionó "Forms & Inputs" en Fase 1.5.4:**

```markdown
### 📝 Creando Componentes de Formulario

**Archivos:**
- `components/ui/input.tsx`
- `components/ui/textarea.tsx`
- `components/ui/select.tsx`
- `components/ui/label.tsx`

**Propósito:** Inputs estilizados con estados de validación visual.

**Estados a implementar:**
- Normal
- Focus (borde primary)
- Error (borde rojo + mensaje)
- Disabled
- Success (borde verde - opcional)

**Diseño aplicado:**
- Bordes: [Según estilo visual]
- Focus ring: Color primary
- Placeholder: text-muted-foreground
- Height: Cómodo para tocar (min 40px)

**Creando componentes...**
```

**Directiva para la IA:**

"Crea componentes de formulario (Input, Textarea, Select, Label) con estados de validación visual. Usa Tailwind para estilos. Aplica bordes redondeados según estilo visual. Include focus states con ring-primary. Para errores, usa text-red-500 y border-red-500."

---

### Paso 4.4: Crear Modal/Dialog (Si aplica)

**Solo si el usuario seleccionó "Modals & Dialogs":**

```markdown
### 🗨️ Creando Componente Modal

**Archivo:** `components/ui/modal.tsx`

**Propósito:** Modal reutilizable para confirmaciones, detalles, formularios.

**Partes:**
- Modal overlay (backdrop oscuro)
- Modal content (centered)
- Modal header
- Modal body
- Modal footer (botones)

**Funcionalidad:**
- Click fuera → cierra modal
- ESC key → cierra modal
- Animaciones suaves (fade in/out)

**Diseño aplicado:**
- Backdrop: bg-black/50
- Content: bg-card con sombra grande
- Bordes redondeados según estilo
- Max width responsivo

**Creando componente...**
```

**Directiva para la IA:**

"Crea un componente Modal con overlay y animaciones. Usa Radix UI o Headless UI si está disponible, sino implementa con estado React. Aplica animaciones suaves (transition-all duration-200). Include lógica para cerrar con ESC o click fuera. Usa la paleta de colores del theme."

---

## 🎭 OPCIÓN C: IMPLEMENTAR CON HEADLESS UI

**Usar SOLO si el usuario eligió "Headless UI" en Fase 1.6**

### Paso 4C.1: Instalar Headless UI

```bash
[pm] add @headlessui/react
```

**Verificar:** `@headlessui/react@2.x.x`

---

### Paso 4C.2: Crear Componentes Híbridos

**Estrategia:** Headless UI para lógica/accesibilidad + Tailwind para estilos.

**Componentes con Headless UI:**
- Dialog, Listbox (Select), Menu (Dropdown), Popover
- Tabs, Switch, Disclosure (Accordion), Radio Group
- Combobox (Autocomplete), Transition (animaciones)

**Componentes manuales simples:**
- Button, Card, Input, Badge, Avatar (sin lógica compleja)

**Directiva para la IA:**

```pseudocode
Para componentes con Headless UI:
  1. Importar componente de @headlessui/react
  2. Crear wrapper que aplique estilos Tailwind según paleta de Fase 1.5
  3. Incluir transiciones suaves con <Transition>
  4. Exportar API simple

Para componentes simples:
  Crear manualmente con Tailwind (ver Opción B)
```

**Resultado:** Balance entre rapidez (lógica pre-hecha) y customización (estilos propios).

---

## 🛠️ COMÚN A TODAS LAS OPCIONES

**Los siguientes pasos aplican sin importar la estrategia elegida:**

---

### Paso 4.5: Crear Utilidad cn() (Esencial)

**Archivo:** `lib/utils.ts`

**Propósito:** Combinar clases Tailwind inteligentemente (merge + conditional).

**Directiva:** Crear función `cn()` usando `clsx` + `tailwind-merge` que permita merge condicional de clases.

**Nota:** shadcn/ui crea esto automáticamente. Si hiciste Opción B o C, créalo manualmente.

---

### Paso 4.6: Resumen de Design System

```markdown
## ✅ Design System Creado

**Componentes UI implementados:**
- ✅ Button (5 variantes + 3 tamaños)
- ✅ Card (con Header, Content, Footer)
[Listar otros componentes creados según selección]

**Paleta aplicada:**
- Primary: [Color] - Usado en botones primarios, links, focus states
- Secondary: [Color] - Usado en botones secundarios, elementos secundarios
- Accent: [Color] - Usado en highlights, badges

**Estilo visual aplicado:**
- Bordes: [Descripción]
- Sombras: [Descripción]
- Espaciado: [Descripción]
- Tipografía: [Descripción]

**Archivos creados:**
- `components/ui/button.tsx`
- `components/ui/card.tsx`
[Listar otros]
- `lib/utils.ts`

**Próximo paso:** Crear componentes de layout (Navbar, Sidebar si aplica).
```

---

## 🧱 FASE 4.5: CREAR COMPONENTES DE LAYOUT

**Objetivo:** Crear Navbar, Sidebar (si aplica), y Layout principal según decisión de Fase 1.5.

---

### Paso 4.5.1: Crear Navbar/Header

```markdown
### 🔝 Creando Navbar/Header

**Archivo:** `components/layout/navbar.tsx`

**Propósito:** Barra de navegación superior.

**Elementos a incluir:**
- Logo/Nombre del proyecto (del PRD)
- Links de navegación (según páginas de Fase 2)
- User menu (avatar + dropdown si hay auth)
- CTA button (si aplica según negocio)

**Diseño aplicado:**
- Height: [Cómoda - 60-70px]
- Background: [bg-card o transparente según estilo]
- Border bottom: [Sutil]
- Sticky positioning
- Sombra suave (si aplica según estilo)

**Responsivo:**
- Desktop: Links visibles
- Mobile: Hamburger menu (si muchos links)

**Creando componente...**
```

**Directiva para la IA:**

"Crea un Navbar component responsive. En desktop muestra links inline, en mobile muestra hamburger menu. Usa el Button component del design system. Aplica bg-card/50 con backdrop-blur para efecto moderno si el estilo es 'Moderno/Bold'. Include user avatar si hay autenticación. Analiza el PRD/PBI para identificar las secciones principales de navegación del proyecto y usa esos nombres específicos del dominio de negocio."

---

### Paso 4.5.2: Crear Sidebar (Solo si se eligió en Fase 1.5)

**Solo si layout incluye Sidebar:**

```markdown
### 📂 Creando Sidebar

**Archivo:** `components/layout/sidebar.tsx`

**Propósito:** Navegación lateral (fija o collapsible).

**Elementos a incluir:**
- Logo/Nombre (top)
- Navigation links (con iconos)
- Active state (highlight)
- Collapse button (si es collapsible)

**Diseño aplicado:**
- Width: 256px (expanded), 64px (collapsed)
- Background: [bg-card o bg-muted según estilo]
- Border right: [Sutil]
- Iconos: [Biblioteca de iconos - lucide-react recomendado]

**Estados:**
- Active link: bg-primary/10 + text-primary
- Hover: bg-accent/50
- Focus: ring-primary

**Creando componente...**
```

**Directiva para la IA:**

"Crea un Sidebar component con estado de collapsed/expanded si es collapsible. Usa lucide-react para iconos. Aplica hover y active states usando la paleta primary. Si es collapsible, muestra solo iconos cuando está collapsed. Analiza el PRD/PBI para identificar las secciones y entidades principales del proyecto, y crea los navigation items usando esa nomenclatura específica del dominio de negocio."

---

### Paso 4.5.3: Crear Layout Principal

```markdown
### 🏗️ Creando Layout Principal

**Archivo:** `components/layout/main-layout.tsx` o directamente en `app/(app)/layout.tsx`

**Propósito:** Layout que combina Navbar, Sidebar (si aplica), y área de contenido.

**Estructura según decisión de Fase 1.5:**

[Si es "Sidebar + Top Navbar":]
- Navbar en top (full width)
- Sidebar en left (fixed)
- Main content (offset by sidebar width)

[Si es "Solo Top Navbar":]
- Navbar en top
- Main content (full width debajo)

[Si es "Sidebar Collapsible":]
- Similar a "Sidebar + Top Navbar" pero sidebar puede collapsar
- Estado guardado en localStorage

**Diseño aplicado:**
- Main content: padding adecuado
- Smooth transitions cuando sidebar colapsa
- Responsive: en mobile sidebar se convierte en drawer

**Creando layout...**
```

**Directiva para la IA:**

"Crea el Main Layout component que use Navbar y Sidebar (si aplica). Implementa el layout elegido en Fase 1.5. Si es Sidebar Collapsible, agrega lógica de toggle con estado en localStorage. En mobile (< 768px), sidebar se convierte en mobile drawer que se cierra automáticamente al navegar. Usa smooth transitions (transition-all duration-200)."

---

## 📄 FASE 5: IMPLEMENTAR PÁGINAS ESTRATÉGICAS CON DISEÑO

**Objetivo:** Crear las páginas seleccionadas en Fase 2, pero ahora con DISEÑO REAL usando el design system.

### ⚠️ CAMBIO CRÍTICO vs Versión Anterior:

**❌ Antes:** Páginas genéricas, sin estilo, aburridas
**✅ Ahora:** Páginas BONITAS usando componentes del design system

---

### Paso 5.1: Crear Página de Autenticación (si aplica)

**Si el proyecto requiere auth:**

```markdown
### 🔐 Creando Página de Login

**Ruta:** `/login` (o según framework)
**Archivo:** [Ubicación según framework]

**Diseño a implementar:**
- Layout centrado (min-h-screen flex items-center justify-center)
- Card component del design system
- Logo/Nombre del proyecto (del PRD)
- Form con Input components del design system
- Button primary para "Sign in"
- Link para "Forgot password?" (si aplica)
- Background: [Gradiente sutil o color sólido según estilo]

**Funcionalidad moqueada:**
- ✅ UI completa y bonita
- ✅ Validación visual (error states en inputs)
- ✅ Loading state en botón
- ⏭️ Integración real con auth provider (Fase 7)

**Paleta aplicada:**
- Card: bg-card con sombra
- Inputs: border-border, focus:ring-primary
- Button: variant="default" (primary)

**Creando página...**
```

**Directiva para la IA:**

"Crea página de login visualmente atractiva. Usa Card component para contener el formulario. Usa Input y Button del design system. Include Logo (usa nombre del proyecto del PRD). Background con gradiente sutil (ej: bg-gradient-to-br from-primary/5 to-secondary/5). Include estados de error con mensajes visuales (border-red-500 + text-red-500). Botón con loading spinner cuando se envía. NO implementes lógica real de auth, solo UI + validación visual básica."

**Mock data para testing:**
- Simular loading state (1-2 segundos)
- Simular error si email no es válido
- Redirect a home al "login exitoso"

---

### Paso 5.2: Crear Página Principal/Home

```markdown
### 🏠 Creando Página Principal

**Ruta:** (Analizar el PRD/PBI para determinar la ruta apropiada según el dominio de negocio del proyecto)
**Archivo:** [Ubicación según framework]

**Diseño a implementar:**

**Header de página:**
- Título (usando nombre del dominio)
- Descripción breve
- CTA button (si aplica según negocio)

**Grid de Cards o Sección principal:**
[Analizar épicas del PBI para decidir qué mostrar]

**Pseudocódigo para inferir:**
```pseudocode
Analizar épicas del PBI:
  Identificar ENTIDAD_PRINCIPAL del dominio
  
  SI épica principal muestra listado de [ENTIDAD]:
    Crear: Grid de [ENTIDAD] cards (responsive, hover effects)
  
  SI épica principal muestra estadísticas:
    Crear: Dashboard con stats cards (métricas del PRD)
  
  SI épica principal muestra flujo/timeline:
    Crear: Feed/timeline de [ENTIDAD] items
```

**Componentes a usar:**
- Card component del design system
- Button components
- [Otros según necesidad]

**Diseño aplicado:**
- Grid: gap-6, responsive (grid-cols-1 md:grid-cols-2 lg:grid-cols-3)
- Cards con hover effect
- Skeleton/Loading states (placeholder)
- Empty state (si no hay datos)

**Mock data:**
[Crear 4-6 items de mock data apropiados al dominio]

**Directiva de tipos:**

Importar tipo de entidad desde `@/lib/types` y tipar el mock data con ese tipo para garantizar type-safety.

**Creando página...**
```

**Directiva para la IA:**

"Crea página home/principal del dominio. Analiza las épicas del PBI para identificar ENTIDAD_PRINCIPAL (la entidad core del negocio). **USA los tipos del backend importados de @/lib/types** para crear mock data type-safe. Crea 4-6 items de mock data realistas que cumplan con la estructura del tipo. Usa Card component con hover effect. Include loading skeleton states. Si grid está vacío, muestra empty state bonito con ilustración/ícono + CTA. Usa paleta de colores del theme. Title con text-3xl font-bold, description con text-muted-foreground."

---

### Paso 5.3: Crear Páginas Core del Dominio (1-3 páginas)

**Por cada página core seleccionada en Fase 2:**

```markdown
### [📋/🔍/etc.] Creando Página [Nombre del Dominio]

**Ruta:** `/[ruta]`
**Archivo:** [Ubicación según framework]
**Épica relacionada:** EPIC-{PROJECT_KEY}-{ISSUE_NUM}-{nombre}

**Diseño a implementar:**

[Analizar la épica para decidir layout:]

- Si es página de lista → Grid/Table de Cards
- Si es página de detalle → Layout de 2 columnas (info + actions)
- Si es página de creación → Form con steps (si es complejo)

**Componentes a usar:**
- [Listar componentes del design system que se usarán]

**Secciones principales:**
1. [Sección 1]: [Descripción]
2. [Sección 2]: [Descripción]

**Directiva de mock data:**

Importar tipo de entidad desde `@/lib/types` y crear array de mock data tipado que cumpla con la estructura del backend.

**Estados a implementar:**
- Loading (skeleton)
- Success (con datos)
- Empty (sin datos)
- Error (si aplica)

**Paleta aplicada:**
[Describir cómo se usa la paleta en esta página]

**⏭️ Diferido para Fase 7:**
- ❌ Fetch real de datos
- ❌ Filtros/búsqueda funcionales
- ❌ Paginación real
- ❌ Acciones CRUD completas

**Creando página...**
```

**Directiva para la IA:**

"Crea página visualmente atractiva usando componentes del design system. Analiza la épica EPIC-{PROJECT_KEY}-{ISSUE_NUM}-{nombre} para entender qué mostrar. **USA tipos del backend de @/lib/types** para crear mock data type-safe. Crea 6-8 items de mock data realista que cumplan con la estructura del tipo. Include estados de loading (skeleton), empty state, y error state si aplica. Si es lista, usa grid responsive con Cards. Si tiene acciones, usa Buttons del design system con iconos (lucide-react). Aplica paleta de colores de forma coherente. NO implementes lógica real, solo UI bonita con mock data."

---

### Paso 5.4: Aplicar Consistencia Visual

```markdown
## 🎨 Validación de Consistencia Visual

**Revisión:** Verifico que todas las páginas usen:
- ✅ Misma paleta de colores (primary, secondary, accent)
- ✅ Mismos componentes del design system (Button, Card, etc.)
- ✅ Mismo espaciado (padding, margin consistentes)
- ✅ Misma tipografía (tamaños de text-)
- ✅ Mismas sombras y bordes (según estilo elegido)
- ✅ **Tipos del backend para mock data** (type-safe)

**Resultado:** Aplicación con identidad visual coherente y profesional.
```

---

## ✅ FASE 6: VALIDACIÓN

**Objetivo:** Verificar que el proyecto compila y se ve bien.

### Paso 6.1: Verificar Versiones Instaladas

**CRÍTICO - Validar antes del build:**

```markdown
## 🔍 Verificando Versiones de Dependencias

**Propósito:** Asegurar que todas las dependencias son versiones estables compatibles.
```

**Comando:**
```bash
[pnpm/bun] list | grep -E "(next|react|tailwindcss|supabase)"
```

**Output esperado (Noviembre 2025):**
```
✅ Versiones Validadas:

Stack Frontend:
- next: 15.x.x ✓ (estable)
- react: 19.x.x ✓ (estable)
- react-dom: 19.x.x ✓ (estable)
- tailwindcss: 3.4.x ✓ (estable - IMPORTANTE: debe ser v3)
- postcss: latest ✓
- autoprefixer: latest ✓

Stack Backend/Auth:
- @supabase/ssr: 0.x.x ✓ (estable)
- @supabase/supabase-js: 2.x.x ✓ (estable)

⚠️ Si tailwindcss es 4.x.x:
1. PROBLEMA: Se instaló v4 por error (incompatible con shadcn-cli)
2. Solución: [pm] remove tailwindcss && [pm] add -D tailwindcss@3
3. Re-ejecutar esta validación
```

**Compatibilidad cruzada verificada:**
- ✅ Next.js 15.x + Tailwind v3 → Compatible oficialmente
- ✅ Next.js 15.x + Supabase SSR 0.x → Compatible (async cookies)
- ✅ Tailwind v3 + shadcn/ui → Compatible 100% (sin errores de CLI)
- ✅ React 19.x + Next.js 15.x → Compatible oficialmente

---

### Paso 6.2: Validar Compilación

**Usar package manager seleccionado:**

```markdown
## 🔍 Validando Build del Proyecto

**Comando a ejecutar:**
```bash
[pnpm/bun] run build
```

**¿Por qué build?**
- Es un comando que termina (no interactivo)
- Detecta errores de TypeScript, imports, etc.
- **Valida que los tipos del backend están correctos**
- Verifica configuración de Tailwind v4

**Ejecutando build...**
```

```bash
[pnpm/bun] run build
```

**Problemas comunes y soluciones:**

```markdown
❌ Si falla con error de Tailwind:
   → Verificar que globals.css usa `@tailwind base;` `@tailwind components;` `@tailwind utilities;`
   → Verificar que existe tailwind.config.ts y postcss.config.js
   → Verificar que tailwindcss es versión 3.x (NO 4.x)
   → Consultar Context7: "Tailwind CSS v3 Next.js build error"

❌ Si falla con error de shadcn/ui:
   → Verificar que tailwindcss es 3.x (shadcn-cli tiene problemas con v4)
   → Reinstalar: [pm] remove tailwindcss && [pm] add -D tailwindcss@3
   → Re-ejecutar shadcn@latest init

❌ Si falla con error de Supabase tipos:
   → Verificar que database.types.ts existe
   → Regenerar tipos: npx supabase gen types typescript...
   → Verificar imports en lib/types.ts

❌ Si falla con error de React/Next:
   → Verificar versiones compatibles (React 19 + Next 15)
   → Limpiar cache: rm -rf .next && [pm] run build
```

---

## 📚 FASE 7: DOCUMENTACIÓN Y RECOMENDACIONES

**Objetivo:** Documentar TODO (arquitectura + DISEÑO) y dar recomendaciones.

---

### Paso 7.1: Crear Documentación de Setup

[MANTENER SETUP.md - igual que antes]

---

### Paso 7.2: Crear Documentación de Arquitectura

[MANTENER frontend-architecture.md - igual que antes, agregar sección de tipos backend]

---

### Paso 7.3: 🆕 Crear Documentación de Design System

**NUEVO - MUY IMPORTANTE:**

**Archivo:** `.context/design-system.md`

```markdown
### 📄 Creando .context/design-system.md

**Propósito:** Documentar todas las decisiones de diseño para el equipo.

**Contenido incluido:**
- Paleta de colores completa
- Componentes UI creados
- **Integración con tipos del backend**
- Guidelines de uso
- Ejemplos de código

**Creando archivo...**
```

**Estructura del archivo:**

```markdown
# Design System - [Nombre del Proyecto]

**Generado:** Fase 3.3 - Frontend Setup
**Fecha:** [Fecha]
**Estilo Visual:** [Elegido en Fase 1.5]

---

## 🔗 Integración Backend-Frontend (NUEVO)

### Tipos TypeScript Compartidos

**Beneficio clave:** Zero type mismatches entre backend y frontend.

**Archivo de tipos:** `lib/database.types.ts` (generado por Supabase CLI)
**Helper de tipos:** `lib/types.ts` (extrae tipos específicos)

**Ejemplo de uso:**

```typescript
import type { User, Profile } from '@/lib/types'

// TypeScript sabe exactamente qué campos tiene User
const UserCard = ({ user }: { user: User }) => {
  return (
    <div>
      <h3>{user.name}</h3>      {/* ✅ TypeScript valida que 'name' existe */}
      <p>{user.email}</p>       {/* ✅ TypeScript valida que 'email' existe */}
      <p>{user.invalid}</p>     {/* ❌ Error: 'invalid' no existe en User */}
    </div>
  )
}
```

**Flujo de sincronización:**

1. Backend define schemas (Supabase)
2. Se generan tipos: `npx supabase gen types typescript...`
3. Frontend importa tipos de `lib/types.ts`
4. Cualquier cambio en schema requiere re-generar tipos
5. TypeScript detecta errores automáticamente

---

## 🎨 Paleta de Colores

### Colores Principales

| Color         | Hex    | Uso                                                           |
| ------------- | ------ | ------------------------------------------------------------- |
| **Primary**   | [#HEX] | Botones primarios, links, focus states, elementos principales |
| **Secondary** | [#HEX] | Botones secundarios, elementos secundarios                    |
| **Accent**    | [#HEX] | Highlights, badges, call-to-actions secundarios               |

### Colores de Sistema

| Color          | Hex    | Uso                            |
| -------------- | ------ | ------------------------------ |
| **Background** | [#HEX] | Fondo de la aplicación         |
| **Card**       | [#HEX] | Fondo de cards, modals         |
| **Border**     | [#HEX] | Bordes de inputs, cards        |
| **Text**       | [#HEX] | Texto principal                |
| **Muted**      | [#HEX] | Texto secundario, placeholders |

### Colores Semánticos

| Color       | Hex    | Uso                                       |
| ----------- | ------ | ----------------------------------------- |
| **Success** | [#HEX] | Mensajes de éxito, validaciones positivas |
| **Warning** | [#HEX] | Advertencias                              |
| **Error**   | [#HEX] | Errores, validaciones fallidas            |
| **Info**    | [#HEX] | Mensajes informativos                     |

**Uso en componentes:**

- Clases Tailwind: `bg-primary`, `text-primary`, `border-border`, `text-muted-foreground`, etc.
- Variables CSS directas: `var(--color-primary)`, `var(--color-secondary)`, etc.

---

## 🧱 Componentes UI

### Button

**Ubicación:** `components/ui/button.tsx`

**Variantes disponibles:**

| Variante            | Uso                   | Ejemplo Visual                    |
| ------------------- | --------------------- | --------------------------------- |
| `default` (primary) | Acciones principales  | Fondo primary, texto blanco       |
| `secondary`         | Acciones secundarias  | Fondo secondary, texto blanco     |
| `outline`           | Acciones terciarias   | Borde primary, fondo transparente |
| `ghost`             | Acciones sutiles      | Sin fondo, texto primary          |
| `danger`            | Acciones destructivas | Fondo rojo, texto blanco          |

**Tamaños:**
- `sm` - Pequeño (height: 32px)
- `md` - Mediano (height: 40px) - **Default**
- `lg` - Grande (height: 48px)

**Uso:**

Importar de `@/components/ui/button` y usar con props `variant` (default/secondary/outline/ghost/danger) y `size` (sm/md/lg).

---

### Card

**Ubicación:** `components/ui/card.tsx`

**Sub-componentes:**
- `Card` - Contenedor principal
- `CardHeader` - Header con título
- `CardContent` - Contenido principal
- `CardFooter` - Footer con acciones

**Variantes:**
- `default` - Card básica
- `hover` - Con efecto hover (sube)
- `clickable` - Cursor pointer + hover

**Uso:**

Importar sub-componentes (Card, CardHeader, CardContent, CardFooter) de `@/components/ui/card`. Usar tipos del backend de `@/lib/types` para tipar props. Aplicar efectos hover con clases Tailwind.

---

[Documentar otros componentes creados...]

---

## 📐 Layout

### Estructura Elegida: [Sidebar + Top Navbar / Solo Top Navbar / etc.]

**Razón:** [Explicar por qué se eligió este layout]

**Componentes:**
- `components/layout/navbar.tsx` - Barra superior
[Si aplica:] - `components/layout/sidebar.tsx` - Navegación lateral

**Navegación disponible:**
[Listar páginas con sus rutas]

---

## ✨ Estilo Visual

### Características del Estilo [Elegido]

**Espaciado:**
- [Descripción: Generoso/Compacto]

**Bordes:**
- Border radius: [Value] - [Descripción: Muy redondeados/Redondeados/Rectos]
- Border width: [Value]

**Sombras:**
- [Descripción: Pronunciadas/Sutiles/Ninguna]
- Card shadow: [CSS value]

**Tipografía:**
- Font family: [Font name]
- Headings: [Tamaños]
- Body text: [Tamaño]

---

## 📖 Guidelines de Uso

### ✅ DO (Hacer)

1. **Usa componentes del design system:**
   - ✅ `<Button>` en lugar de `<button>`
   - ✅ `<Card>` para agrupar información
   - ✅ Clases de Tailwind con la paleta (`bg-primary`, `text-primary`)

2. **Usa tipos del backend:**
   - ✅ `import type { User } from '@/lib/types'`
   - ✅ Type-safe props: `{ user }: { user: User }`
   - ✅ Mock data con tipos: `const mockData: User[] = [...]`

3. **Mantén consistencia:**
   - ✅ Mismo spacing (`gap-6`, `p-6`)
   - ✅ Mismos border radius
   - ✅ Mismas sombras

4. **Usa variantes semánticas:**
   - ✅ `variant="default"` para acciones principales
   - ✅ `variant="danger"` para acciones destructivas
   - ✅ `text-muted-foreground` para texto secundario

### ❌ DON'T (No hacer)

1. **No uses colores hardcodeados:**
   - ❌ `bg-blue-500` → ✅ `bg-primary`
   - ❌ `#3B82F6` → ✅ `var(--color-primary)`

2. **No uses tipos `any`:**
   - ❌ `const user: any = ...` → ✅ `const user: User = ...`
   - ❌ `props: any` → ✅ `props: { user: User }`

3. **No crees botones custom:**
   - ❌ `<button className="bg-blue-500...">` → ✅ `<Button>`

4. **No rompas la consistencia:**
   - ❌ Border radius diferente en cada componente
   - ❌ Spacing inconsistente

---

## 🚀 Extender el Design System (Fase 7)

Cuando implementes nuevas features en Fase 7:

### Agregar nuevo componente UI:

1. Créalo en `components/ui/[nombre].tsx`
2. Usa la paleta de colores del theme
3. Aplica el estilo visual consistente (bordes, sombras)
4. **Usa tipos del backend si el componente recibe datos**
5. Documenta en este archivo

### Modificar componente existente:

1. Edita el archivo en `components/ui/`
2. Mantén compatibilidad con uso existente
3. Actualiza esta documentación

### Agregar nueva página:

1. Usa layout components existentes
2. Usa componentes del design system
3. Aplica paleta de colores
4. **Importa tipos del backend para props y mock data**
5. Mantén spacing consistente

---

## 📚 Referencias

- **Tailwind Config:** `tailwind.config.ts` - Paleta completa
- **Estilos Globales:** `app/globals.css` - Variables CSS
- **Componentes UI:** `components/ui/` - Todos los componentes
- **Layout Components:** `components/layout/` - Navbar, Sidebar
- **Tipos Backend:** `lib/database.types.ts` - Tipos generados de Supabase
- **Type Helpers:** `lib/types.ts` - Helpers de tipos

---

**Este design system es tu fuente única de verdad para el diseño visual del proyecto. Manténlo consistente durante todo el desarrollo.**
```

---

### Paso 7.4: Resumen Ejecutivo Final

**Output final (mostrar al usuario):**

```markdown
# 🎉 FASE 3.3: Frontend Setup Completado

---

## 📊 Resumen

**Archivos creados:** [número total]
**Páginas demo:** [2-3] (para validar design system)
**Componentes UI creados:** [número]
**Package manager:** [pnpm/bun]
**Fase:** 3.3 - Frontend Setup (Sincrónica - ejecutada UNA sola vez después de Backend)

---

## 🔗 Integración Backend-Frontend (NUEVO)

### ✅ Tipos TypeScript Sincronizados

**Archivo backend:** `lib/database.types.ts` (generado en Fase 3.2)
**Helper frontend:** `lib/types.ts` (creado en esta fase)

**Beneficio:**
- Zero type mismatches
- Autocomplete en todos los componentes
- Cambios en schema se reflejan automáticamente

**Ejemplo de uso:**
```typescript
import type { User } from '@/lib/types'

const UserCard = ({ user }: { user: User }) => {
  return <div>{user.name}</div>  // ✅ TypeScript valida todo
}
```

---

## 🎨 Diseño Implementado

### Paleta de Colores: [Nombre]
- **Primary:** [Color] - [Descripción de uso]
- **Secondary:** [Color] - [Descripción de uso]
- **Accent:** [Color] - [Descripción de uso]

### Estilo Visual: [Elegido]
- [Características principales]

### Layout: [Elegido]
- [Descripción de la estructura]

---

## ✅ Lo que se Implementó

### 1. Integración Backend (NUEVO):
- ✅ Tipos del backend importados (`lib/database.types.ts`)
- ✅ Helper de tipos creado (`lib/types.ts`)
- ✅ Mock data type-safe en páginas demo
- ✅ Zero type errors entre backend y frontend

### 2. Arquitectura del Framework:
- ✅ [Framework] configurado correctamente
- ✅ [Package manager] como gestor de paquetes
- ✅ TypeScript + ESLint configurados
- ✅ Estructura de carpetas según mejores prácticas

### 3. Design System Completo:
- ✅ Paleta de colores aplicada en Tailwind
- ✅ [X] componentes UI reutilizables creados
- ✅ Layout components (Navbar, [Sidebar si aplica])
- ✅ Estilos globales y variables CSS
- ✅ Utilidades (cn function)

**Componentes UI creados:**
- ✅ Button (5 variantes, 3 tamaños)
- ✅ Card (con Header, Content, Footer)
[Listar otros componentes creados]

### 4. Páginas Demo (para validar design system):
[Listar 2-3 páginas con breve descripción visual]

1. ✅ [Página 1] (`/[ruta]`)
   - Diseño: [Breve descripción visual]
   - Mock data: [X] items (usando tipos del backend ✅)
   - **Propósito:** Validar [componentes]

2. ✅ [Página 2] (`/[ruta]`)
   - Diseño: [Breve descripción visual]
   - Mock data: [X] items (usando tipos del backend ✅)
   - **Propósito:** Validar [componentes]

**Nota:** Las demás páginas del MVP se implementarán en Fase 7 según los implementation plans de cada story (Fase 6).

### 5. Documentación Generada:
- ✅ `SETUP.md` - Guía de instalación
- ✅ `.context/frontend-architecture.md` - Arquitectura técnica
- ✅ `.context/design-system.md` - Design system completo + integración backend
- ✅ `.env.example` - Template de variables

---

## 🚀 Próximos Pasos Inmediatos

### 1️⃣ Configurar Variables de Entorno (AHORA)

```bash
cp .env.example .env
# Edita .env con tus credenciales reales
```

---

### 2️⃣ Probar el Proyecto (AHORA)

**⚠️ IMPORTANTE:** Abre una **nueva terminal** separada.

```bash
[pnpm/bun] run dev
```

**Luego:**
1. Abre http://localhost:[puerto] en tu navegador
2. **DISFRUTA del diseño bonito** ✨
3. Navega entre páginas
4. Observa la consistencia visual (colores, componentes)
5. Prueba estados hover en botones y cards
6. **Verifica que mock data usa tipos del backend** (abre DevTools)

**Lo que deberías ver:**
- ✅ Aplicación **visualmente impresionante**
- ✅ Paleta de colores coherente
- ✅ Componentes estilizados y modernos
- ✅ Layout profesional
- ✅ Diseño alineado con la personalidad del negocio
- ✅ **Mock data type-safe** (zero TypeScript errors)

---

### 3️⃣ Revisar Design System (RECOMENDADO)

Abre `.context/design-system.md` para ver:
- Paleta de colores completa
- Componentes disponibles y cómo usarlos
- **Guía de integración backend-frontend**
- Guidelines de diseño
- Ejemplos de código

**Esto será tu guía de estilo** durante toda la Fase 7 (Implementation).

---

### 4️⃣ Considerar Crear Checkpoint Git (RECOMENDADO)

```bash
git add .
git commit -m "feat: Setup frontend with design system and backend types integration

- Configured [Framework] with [package manager]
- Created design system ([X] components)
- Integrated backend types (database.types.ts)
- Implemented [X] demo pages with type-safe mock data
- Applied [Color Palette] + [Visual Style]
- Layout: [Chosen Layout]
"
```

---

### 5️⃣ Continuar con Fase 4: Specification (SIGUIENTE)

**Ahora que tienes el Frontend Setup completo:**
- Backend schemas creados (Fase 3.2) ✅
- Frontend integrado con tipos del backend (Fase 3.3) ✅
- Design System base listo ✅

**Próximo paso:**
- Procede a crear el Product Backlog (PBI) con flujo Jira-First
- Usa `.prompts/fase-4-specification/pbi-product-backlog.md`
- Cada story implementará funcionalidad usando:
  - Componentes del design system
  - Tipos del backend
  - Patrones establecidos

---

## 💎 Valor Generado

**¿Qué logramos?**

✅ **Arquitectura sólida** - Framework configurado profesionalmente
✅ **Backend-Frontend integrados** - Tipos compartidos, zero mismatches
✅ **Design System completo** - Componentes reutilizables y bonitos
✅ **Paleta coherente** - Colores aplicados consistentemente
✅ **Páginas impresionantes** - Visualmente atractivas con mock data type-safe
✅ **Layout profesional** - Navegación intuitiva y moderna
✅ **Documentación completa** - Arquitectura + Diseño + Integración documentados
✅ **Lista para demo** - Puedes mostrarlo al equipo AHORA

**Diferencia vs versión anterior:**
❌ Antes: Páginas grises, sin personalidad, tipos manuales
✅ Ahora: **Aplicación hermosa, moderna, con identidad visual + tipos sincronizados**

---

## 🎯 Para el Equipo

**Próxima reunión:**
1. Levanta el servidor (`[pm] run dev`)
2. Muestra las páginas funcionando
3. **Destaca el diseño visual** (paleta, componentes, layout)
4. **Explica la integración backend-frontend** (zero type errors)
5. Muestra `.context/design-system.md`
6. Presenta roadmap de Fases 4-7

**Valor:** El equipo ve una aplicación **preciosa, profesional y type-safe**, no solo estructura.

---

**🎉 ¡Frontend Setup + Design System + Backend Integration completado exitosamente!**

**Documentación:**
- `SETUP.md` - Cómo levantar el proyecto
- `.context/frontend-architecture.md` - Arquitectura técnica
- `.context/design-system.md` - **Guía de diseño completa + integración backend** ⭐

**Disfruta de tu aplicación bonita y type-safe!** ✨
```

---

## 📋 VALIDACIONES FINALES

Checklist interno (NO mostrar al usuario):

### Integración Backend:
- ✅ `lib/database.types.ts` existe (verificado)
- ✅ `lib/types.ts` creado con helpers
- ✅ Mock data en páginas usa tipos del backend
- ✅ Build pasa sin TypeScript errors

### Diseño:
- ✅ Paleta de colores aplicada en tailwind.config
- ✅ Design system con componentes bonitos creado
- ✅ Páginas usan componentes del design system
- ✅ Consistencia visual en toda la aplicación
- ✅ `.context/design-system.md` creado con sección de integración backend

### Arquitectura:
- ✅ Framework configurado
- ✅ Package manager elegido por usuario
- ✅ Estructura de carpetas correcta
- ✅ Build pasa sin errores

### Documentación:
- ✅ SETUP.md con instrucciones
- ✅ frontend-architecture.md con decisiones técnicas
- ✅ design-system.md con guía de diseño + integración backend ⭐

### Usuario:
- ✅ Se hicieron preguntas interactivas (package manager, diseño)
- ✅ Se explicó cada decisión
- ✅ Se educó sobre opciones
- ✅ Se dio opción "Elige por mí"
- ✅ Se recomendó (NO forzó) crear commit

---

**Output:** Proyecto frontend con arquitectura sólida + **Backend types integrados** + **Design System completo** + 2-3 páginas demo visualmente impresionantes con mock data type-safe, todo documentado y listo para mostrar al equipo.

**Fase completada:** 3.3 - Frontend Setup ✅ (Sincrónica)

**Próxima fase:** 4 - Specification (Asincrónica)

---

## 🔄 DIVISIÓN DE DISEÑO: FASE 3.3 vs FASE 6

**Entender esta diferencia es CRÍTICO:**

### FASE 3.3 (Frontend Setup - UNA sola vez):
- ✅ Paleta de colores
- ✅ Componentes UI reutilizables (Button, Card, Form, Modal, etc.)
- ✅ Layout system (Navbar, Sidebar)
- ✅ **Integración con tipos del backend**
- ✅ 2-3 páginas demo (para validar que funciona)
- ✅ 80% del diseño visual

**Propósito:** Crear la base reutilizable para TODO el proyecto con tipos sincronizados.

### FASE 6 (Planning + UI Design - Por cada story):
- ✅ Wireframes/mockups específicos de la story
- ✅ Componentes custom del dominio (ej: [Entity]Card, [Entity]Table basados en negocio)
- ✅ Flujos de UX específicos
- ✅ Validaciones y estados visuales
- ✅ 20% del diseño específico

**Propósito:** Diseñar la implementación específica de cada story usando el design system base y los tipos del backend.

---

**Analogía:**
- **Fase 3.3** = Construir la caja de herramientas (martillo, destornillador, etc.) + planos precisos (tipos)
- **Fase 6** = Decidir cómo usar esas herramientas y planos para construir cada mueble específico
