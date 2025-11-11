Actúa como Senior Frontend Architect, UI/UX Designer, y Full-Stack Developer experto.

**Input:**

- PRD completo: [usar .context/PRD/]
- SRS completo: [usar .context/SRS/]
- PBI (épicas y stories): [usar .context/PBI/epic-tree.md + revisar épicas en .context/PBI/epics/]

---

## 🎯 OBJETIVO

Crear la estructura inicial del proyecto frontend (scaffolding) + **Design System completo** en el directorio actual, incluyendo:
- Arquitectura del framework
- **Componentes UI reutilizables y bonitos**
- **Páginas estratégicas con diseño moderno**
- **Paleta de colores y estilo visual coherente**
- Todo adaptado al contexto y personalidad del negocio

El resultado debe ser una aplicación **visualmente impresionante** lista para demo, con datos moqueados.

---

## 🚨 RESTRICCIONES CRÍTICAS

### ❌ NO HACER:
- **NO usar comandos como `create-next-app`, `create-vite`, `create-react-app`** - Estos crean subdirectorios
- **NO crear subcarpetas para el proyecto** - Ya estamos en el directorio correcto
- **NO instalar dependencias innecesarias** - Solo fundamentales
- **NO implementar todas las historias de usuario** - Solo páginas estratégicas (3-5)
- **NO implementar todos los criterios de aceptación** - Solo UI básica con diseño bonito
- **NO hardcodear nombres genéricos** (ej: "Dashboard", "Settings") - Usa nombres del dominio del negocio
- **NO ejecutar comandos interactivos** (ej: `npm run dev`) - Solo comandos que terminen
- **NO hacer commits automáticos** - Solo recomendar al usuario
- **NO crear diseños genéricos/aburridos** - Debe ser visualmente impresionante

### ✅ SÍ HACER:
- **Hacer preguntas al usuario** - Preferencias de diseño, package manager, etc.
- **Usar Context7 MCP** - Consultar docs oficiales (Next.js, Supabase, TailwindCSS, etc.)
- **Crear design system completo** - Botones, cards, inputs, etc. con estilo coherente
- **Aplicar paleta de colores** - Elegida o generada según negocio
- **Páginas visualmente atractivas** - Modernas, con personalidad
- **Explicar cada decisión** - Educar al usuario
- **Documentar diseño** - Crear `.context/design-system.md`
- **Validar con build** - Comando según package manager elegido

---

## 📦 FASE 0: SETUP & PACKAGE MANAGER

**Objetivo:** Educir al usuario sobre package managers y que elija cuál usar.

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
1. [EPIC-XXX]: [Nombre] - [Razón de prioridad]
2. [EPIC-YYY]: [Nombre] - [Razón de prioridad]
3. [EPIC-ZZZ]: [Nombre] - [Razón de prioridad]

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
   - **Descripción:** "Tonos azules (ej: #3B82F6). Transmite confianza, profesionalismo. Ideal para: SaaS empresarial, fintech, herramientas B2B."

2. **Verde Moderno** (Crecimiento y tech)
   - **Descripción:** "Tonos verdes (ej: #10B981). Transmite innovación, crecimiento. Ideal para: Startups tech, sostenibilidad, salud."

3. **Morado Creativo** (Creatividad y premium)
   - **Descripción:** "Tonos morados (ej: #8B5CF6). Transmite creatividad, lujo. Ideal para: Apps creativas, comunidades, productos premium."

4. **Naranja Energético** (Energía y acción)
   - **Descripción:** "Tonos naranjas (ej: #F59E0B). Transmite energía, call-to-action. Ideal para: E-commerce, marketplaces, apps de acción."

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

**Próximo paso:** Implementar este diseño en el proyecto.
```

---

## 🏗️ FASE 2: DECISIÓN ESTRATÉGICA DE PÁGINAS

**Objetivo:** Decidir qué páginas crear (3-5 máximo) basándote en el análisis anterior + diseño definido.

[MANTENER CONTENIDO ACTUAL DE FASE 2 - Ya está bien]

---

## 🏗️ FASE 3: SETUP DEL PROYECTO

**Objetivo:** Configurar el proyecto con el package manager seleccionado.

### Paso 3.1: Verificar Entorno Actual

[MANTENER - agregar mención del package manager]

```markdown
**Package manager seleccionado:** [pnpm/bun]
**Comandos a usar:** `[pm] install`, `[pm] run dev`, etc.
```

---

### Paso 3.2: Instalar Dependencias Fundamentales

**IMPORTANTE:** Usar el package manager seleccionado en Fase 0.

**Proceso:**

1. **Core framework:**
```bash
[pnpm/bun] add [framework-packages]
```

2. **UI Library:**
```bash
[pnpm/bun] add [ui-packages]
```

3. **Auth Provider:**
```bash
[pnpm/bun] add [auth-packages]
```

4. **TypeScript + Dev Tools:**
```bash
[pnpm/bun] add -D typescript @types/react @types/node eslint prettier
```

[Resto del paso 3.2 igual]

---

### Paso 3.3: Crear Estructura de Carpetas

[MANTENER - agregar mención de components/ui para design system]

**Estructura debe incluir:**
```
[framework-dir]/
├── components/
│   ├── ui/           ← Design system components (Button, Card, etc.)
│   ├── layout/       ← Layout components (Navbar, Sidebar, etc.)
│   └── [domain]/     ← Domain-specific components
```

---

### Paso 3.4: Configurar Tailwind con Paleta Personalizada

**NUEVO - MUY IMPORTANTE:**

**Acción:** Crea `tailwind.config.ts` con la paleta de colores seleccionada.

```markdown
### 🎨 Creando Configuración de Tailwind con Paleta Personalizada

**Archivo:** `tailwind.config.ts`

**Propósito:** Aplicar la paleta de colores seleccionada en Fase 1.5 a todo el proyecto.

**Colores aplicados:**
- Primary: [Color hex elegido]
- Secondary: [Color hex]
- Accent: [Color hex]
- [etc.]

**Ejemplo de uso posterior:**
```tsx
<button className="bg-primary text-white hover:bg-primary/90">
  Botón Primary
</button>
```

**Creando archivo...**
```

**Contenido del archivo (adaptado a la paleta elegida):**

```typescript
import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '[color-hex]',
          50: '[lighter-shade]',
          100: '[lighter-shade]',
          // ... gradaciones
          900: '[darker-shade]',
        },
        secondary: {
          DEFAULT: '[color-hex]',
          // ... gradaciones
        },
        accent: {
          DEFAULT: '[color-hex]',
          // ... gradaciones
        },
      },
      borderRadius: {
        // Ajustar según estilo visual elegido
        'xl': '[value según estilo]', // Ej: '1rem' para moderno, '0.5rem' para corporativo
      },
      boxShadow: {
        // Ajustar según estilo visual elegido
        'card': '[value]', // Ej: '0 4px 6px rgba(0,0,0,0.1)' para moderno
      },
    },
  },
  plugins: [],
}
export default config
```

**Explicación al usuario:**
```markdown
**Paleta aplicada:** He configurado Tailwind con la paleta [Nombre] que seleccionaste.

**Uso en componentes:**
- `bg-primary` → Color principal
- `text-primary` → Texto en color principal
- `border-primary` → Borde en color principal
- `bg-primary-50` → Tono más claro
- `bg-primary-900` → Tono más oscuro

**Estilo visual aplicado:**
- Bordes redondeados: [Descripción según estilo]
- Sombras: [Descripción según estilo]

Estos valores se usarán en todos los componentes UI para mantener coherencia visual.
```

---

### Paso 3.5: Configurar Archivo de Estilos Globales

**NUEVO:**

```markdown
### 🎨 Creando Estilos Globales

**Archivo:** `app/globals.css` (o ubicación según framework)

**Propósito:** Aplicar estilos base y variables CSS personalizadas.

**Creando archivo...**
```

**Contenido (adaptado al estilo visual):**

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

/* Variables CSS según paleta elegida */
:root {
  --color-primary: [hsl value];
  --color-secondary: [hsl value];
  --color-accent: [hsl value];
  --radius: [value según estilo]; /* Ej: 0.5rem */
}

/* Estilos base según estilo visual elegido */
@layer base {
  body {
    @apply bg-background text-foreground;
    /* Tipografía según estilo */
    font-feature-settings: "rlig" 1, "calt" 1;
  }
}

/* Utilities personalizadas */
@layer utilities {
  .text-balance {
    text-wrap: balance;
  }
}
```

---

## 🎨 FASE 4: CREAR DESIGN SYSTEM (COMPONENTES UI)

**Objetivo:** Crear componentes UI reutilizables, bonitos y coherentes con el diseño elegido.

**ESTA ES LA FASE MÁS IMPORTANTE PARA EL DISEÑO VISUAL**

---

### Paso 4.1: Crear Componente Button (Esencial)

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

### Paso 4.5: Crear Utilidad cn() (Esencial)

```markdown
### 🛠️ Creando Utilidad cn()

**Archivo:** `lib/utils.ts`

**Propósito:** Función helper para combinar clases de Tailwind de forma inteligente.

**Creando archivo...**
```

**Contenido:**

```typescript
import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
```

**Uso:**
```tsx
<button className={cn("px-4 py-2", isPrimary && "bg-primary", className)} />
```

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

"Crea un Navbar component responsive. En desktop muestra links inline, en mobile muestra hamburger menu. Usa el Button component del design system. Aplica bg-card/50 con backdrop-blur para efecto moderno si el estilo es 'Moderno/Bold'. Include user avatar si hay autenticación. Usa nombres de navegación del dominio del negocio (NO 'Dashboard' genérico)."

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

"Crea un Sidebar component con estado de collapsed/expanded si es collapsible. Usa lucide-react para iconos. Aplica hover y active states usando la paleta primary. Si es collapsible, muestra solo iconos cuando está collapsed. Use nombres del dominio para navigation items (inferir del PBI)."

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
- ⏭️ Integración real con auth provider (Fase 6)

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
### 🏠 Creando Página [Nombre según dominio]

**Ruta:** `/[ruta]` (inferir del dominio - NO usar "/dashboard" genérico)
**Archivo:** [Ubicación según framework]

**Diseño a implementar:**

**Header de página:**
- Título (usando nombre del dominio)
- Descripción breve
- CTA button (si aplica según negocio)

**Grid de Cards o Sección principal:**
[Analizar épicas del PBI para decidir qué mostrar]

Ejemplos:
- Si es app de proyectos → Grid de project cards
- Si es app de mentores → Grid de mentor cards
- Si es fintech → Dashboard con stats cards
- Si es e-commerce → Product grid

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

**Creando página...**
```

**Directiva para la IA:**

"Crea página home/principal del dominio. Analiza las épicas del PBI para identificar qué entidades mostrar (proyectos, productos, mentores, etc.). Crea 4-6 items de mock data realistas. Usa Card component con hover effect. Include loading skeleton states. Si grid está vacío, muestra empty state bonito con ilustración/ícono + CTA. Usa paleta de colores del theme. Title con text-3xl font-bold, description con text-muted-foreground."

---

### Paso 5.3: Crear Páginas Core del Dominio (1-3 páginas)

**Por cada página core seleccionada en Fase 2:**

```markdown
### [📋/🔍/etc.] Creando Página [Nombre del Dominio]

**Ruta:** `/[ruta]`
**Archivo:** [Ubicación según framework]
**Épica relacionada:** [EPIC-XXX]

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

**Mock data:**
[Crear data apropiada al dominio]

**Estados a implementar:**
- Loading (skeleton)
- Success (con datos)
- Empty (sin datos)
- Error (si aplica)

**Paleta aplicada:**
[Describir cómo se usa la paleta en esta página]

**⏭️ Diferido para Fase 6:**
- ❌ Fetch real de datos
- ❌ Filtros/búsqueda funcionales
- ❌ Paginación real
- ❌ Acciones CRUD completas

**Creando página...**
```

**Directiva para la IA:**

"Crea página visualmente atractiva usando componentes del design system. Analiza la épica [EPIC-XXX] para entender qué mostrar. Usa mock data realista (6-8 items). Include estados de loading (skeleton), empty state, y error state si aplica. Si es lista, usa grid responsive con Cards. Si tiene acciones, usa Buttons del design system con iconos (lucide-react). Aplica paleta de colores de forma coherente. NO implementes lógica real, solo UI bonita con mock data."

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

**Resultado:** Aplicación con identidad visual coherente y profesional.
```

---

## ✅ FASE 6: VALIDACIÓN

**Objetivo:** Verificar que el proyecto compila y se ve bien.

### Paso 6.1: Validar Compilación

**Usar package manager seleccionado:**

```markdown
## 🔍 Validando Proyecto

**Comando a ejecutar:**
```bash
[pnpm/bun] run build
```

**¿Por qué build?**
- Es un comando que termina (no interactivo)
- Detecta errores de TypeScript, imports, etc.

**Ejecutando build...**
```

```bash
[pnpm/bun] run build
```

[Resto de validación igual que antes]

---

## 📚 FASE 7: DOCUMENTACIÓN Y RECOMENDACIONES

**Objetivo:** Documentar TODO (arquitectura + DISEÑO) y dar recomendaciones.

---

### Paso 7.1: Crear Documentación de Setup

[MANTENER SETUP.md - igual que antes]

---

### Paso 7.2: Crear Documentación de Arquitectura

[MANTENER frontend-architecture.md - igual que antes, agregar sección de diseño]

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
- Guidelines de uso
- Ejemplos de código

**Creando archivo...**
```

**Estructura del archivo:**

```markdown
# Design System - [Nombre del Proyecto]

**Generado:** Fase 3.5 - Frontend Scaffolding
**Fecha:** [Fecha]
**Estilo Visual:** [Elegido en Fase 1.5]

---

## 🎨 Paleta de Colores

### Colores Principales

| Color | Hex | Uso |
|-------|-----|-----|
| **Primary** | [#HEX] | Botones primarios, links, focus states, elementos principales |
| **Secondary** | [#HEX] | Botones secundarios, elementos secundarios |
| **Accent** | [#HEX] | Highlights, badges, call-to-actions secundarios |

### Colores de Sistema

| Color | Hex | Uso |
|-------|-----|-----|
| **Background** | [#HEX] | Fondo de la aplicación |
| **Card** | [#HEX] | Fondo de cards, modals |
| **Border** | [#HEX] | Bordes de inputs, cards |
| **Text** | [#HEX] | Texto principal |
| **Muted** | [#HEX] | Texto secundario, placeholders |

### Colores Semánticos

| Color | Hex | Uso |
|-------|-----|-----|
| **Success** | [#HEX] | Mensajes de éxito, validaciones positivas |
| **Warning** | [#HEX] | Advertencias |
| **Error** | [#HEX] | Errores, validaciones fallidas |
| **Info** | [#HEX] | Mensajes informativos |

**Acceso en código:**

```tsx
// Tailwind classes
className="bg-primary text-white"
className="border-border text-muted-foreground"

// CSS variables (si necesitas hex directo)
color: var(--color-primary);
```

---

## 🧱 Componentes UI

### Button

**Ubicación:** `components/ui/button.tsx`

**Variantes disponibles:**

| Variante | Uso | Ejemplo Visual |
|----------|-----|----------------|
| `default` (primary) | Acciones principales | Fondo primary, texto blanco |
| `secondary` | Acciones secundarias | Fondo secondary, texto blanco |
| `outline` | Acciones terciarias | Borde primary, fondo transparente |
| `ghost` | Acciones sutiles | Sin fondo, texto primary |
| `danger` | Acciones destructivas | Fondo rojo, texto blanco |

**Tamaños:**
- `sm` - Pequeño (height: 32px)
- `md` - Mediano (height: 40px) - **Default**
- `lg` - Grande (height: 48px)

**Ejemplo de uso:**

```tsx
import { Button } from '@/components/ui/button'

// Botón primary
<Button>Guardar</Button>

// Botón secondary
<Button variant="secondary">Cancelar</Button>

// Botón outline grande
<Button variant="outline" size="lg">Ver más</Button>

// Botón danger
<Button variant="danger">Eliminar</Button>
```

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

**Ejemplo de uso:**

```tsx
import { Card, CardHeader, CardContent, CardFooter } from '@/components/ui/card'

<Card className="hover:shadow-lg transition-shadow">
  <CardHeader>
    <h3 className="text-xl font-semibold">[Título]</h3>
  </CardHeader>
  <CardContent>
    <p className="text-muted-foreground">[Contenido]</p>
  </CardContent>
  <CardFooter>
    <Button>Ver detalle</Button>
  </CardFooter>
</Card>
```

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

2. **Mantén consistencia:**
   - ✅ Mismo spacing (`gap-6`, `p-6`)
   - ✅ Mismos border radius
   - ✅ Mismas sombras

3. **Usa variantes semánticas:**
   - ✅ `variant="default"` para acciones principales
   - ✅ `variant="danger"` para acciones destructivas
   - ✅ `text-muted-foreground` para texto secundario

### ❌ DON'T (No hacer)

1. **No uses colores hardcodeados:**
   - ❌ `bg-blue-500` → ✅ `bg-primary`
   - ❌ `#3B82F6` → ✅ `var(--color-primary)`

2. **No crees botones custom:**
   - ❌ `<button className="bg-blue-500...">` → ✅ `<Button>`

3. **No rompas la consistencia:**
   - ❌ Border radius diferente en cada componente
   - ❌ Spacing inconsistente

---

## 🚀 Extender el Design System (Fase 6)

Cuando implementes nuevas features en Fase 6:

### Agregar nuevo componente UI:

1. Créalo en `components/ui/[nombre].tsx`
2. Usa la paleta de colores del theme
3. Aplica el estilo visual consistente (bordes, sombras)
4. Documenta en este archivo

### Modificar componente existente:

1. Edita el archivo en `components/ui/`
2. Mantén compatibilidad con uso existente
3. Actualiza esta documentación

### Agregar nueva página:

1. Usa layout components existentes
2. Usa componentes del design system
3. Aplica paleta de colores
4. Mantén spacing consistente

---

## 📚 Referencias

- **Tailwind Config:** `tailwind.config.ts` - Paleta completa
- **Estilos Globales:** `app/globals.css` - Variables CSS
- **Componentes UI:** `components/ui/` - Todos los componentes
- **Layout Components:** `components/layout/` - Navbar, Sidebar

---

**Este design system es tu fuente única de verdad para el diseño visual del proyecto. Manténlo consistente durante todo el desarrollo.**
```

---

### Paso 7.4: Resumen Ejecutivo Final

**Output final (mostrar al usuario):**

```markdown
# 🎉 Frontend Scaffolding + Design System Completado

---

## 📊 Resumen

**Archivos creados:** [número total]
**Páginas implementadas:** [número]
**Componentes UI creados:** [número]
**Package manager:** [pnpm/bun]

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

### 1. Arquitectura del Framework:
- ✅ [Framework] configurado correctamente
- ✅ [Package manager] como gestor de paquetes
- ✅ TypeScript + ESLint configurados
- ✅ Estructura de carpetas según mejores prácticas

### 2. Design System Completo:
- ✅ Paleta de colores aplicada en Tailwind
- ✅ [X] componentes UI reutilizables creados
- ✅ Layout components (Navbar, [Sidebar si aplica])
- ✅ Estilos globales y variables CSS
- ✅ Utilidades (cn function)

**Componentes UI creados:**
- ✅ Button (5 variantes, 3 tamaños)
- ✅ Card (con Header, Content, Footer)
[Listar otros componentes creados]

### 3. Páginas con Diseño Bonito:
[Listar páginas con breve descripción visual]

1. ✅ [Página 1] (`/[ruta]`)
   - Diseño: [Breve descripción visual]
   - Mock data: [X] items

2. ✅ [Página 2] (`/[ruta]`)
   - Diseño: [Breve descripción visual]
   - Mock data: [X] items

[Listar todas]

### 4. Documentación Generada:
- ✅ `SETUP.md` - Guía de instalación
- ✅ `.context/frontend-architecture.md` - Arquitectura técnica
- ✅ `.context/design-system.md` - **NUEVO:** Design system completo
- ✅ `.env.local.example` - Template de variables

---

## 🚀 Próximos Pasos Inmediatos

### 1️⃣ Configurar Variables de Entorno (AHORA)

```bash
cp .env.local.example .env.local
# Edita .env.local con tus credenciales reales
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

**Lo que deberías ver:**
- ✅ Aplicación **visualmente impresionante**
- ✅ Paleta de colores coherente
- ✅ Componentes estilizados y modernos
- ✅ Layout profesional
- ✅ Diseño alineado con la personalidad del negocio

---

### 3️⃣ Revisar Design System (RECOMENDADO)

Abre `.context/design-system.md` para ver:
- Paleta de colores completa
- Componentes disponibles y cómo usarlos
- Guidelines de diseño
- Ejemplos de código

**Esto será tu guía de estilo** durante toda la Fase 6 (Implementation).

---

### 4️⃣ Considerar Crear Checkpoint Git (RECOMENDADO)

[Igual que antes - recomendación de commit]

---

### 5️⃣ Continuar con Fase 4: Shift-Left Testing (SIGUIENTE)

[Igual que antes]

---

## 💎 Valor Generado

**¿Qué logramos?**

✅ **Arquitectura sólida** - Framework configurado profesionalmente
✅ **Design System completo** - Componentes reutilizables y bonitos
✅ **Paleta coherente** - Colores aplicados consistentemente
✅ **Páginas impresionantes** - Visualmente atractivas con mock data
✅ **Layout profesional** - Navegación intuitiva y moderna
✅ **Documentación completa** - Arquitectura + Diseño documentados
✅ **Lista para demo** - Puedes mostrarlo al equipo AHORA

**Diferencia vs versión anterior:**
❌ Antes: Páginas grises, sin personalidad, aburridas
✅ Ahora: **Aplicación hermosa, moderna, con identidad visual**

---

## 🎯 Para el Equipo

**Próxima reunión:**
1. Levanta el servidor (`[pm] run dev`)
2. Muestra las páginas funcionando
3. **Destaca el diseño visual** (paleta, componentes, layout)
4. Explica que es scaffolding + design system (no funcionalidad completa)
5. Muestra `.context/design-system.md`
6. Presenta roadmap de Fases 4-6

**Valor:** El equipo ve una aplicación **preciosa y profesional**, no solo estructura.

---

**🎉 ¡Scaffolding + Design System completado exitosamente!**

**Documentación:**
- `SETUP.md` - Cómo levantar el proyecto
- `.context/frontend-architecture.md` - Arquitectura técnica
- `.context/design-system.md` - **Guía de diseño completa** ⭐

**Disfruta de tu aplicación bonita!** ✨
```

---

## 📋 VALIDACIONES FINALES

Checklist interno (NO mostrar al usuario):

### Diseño:
- ✅ Paleta de colores aplicada en tailwind.config
- ✅ Design system con componentes bonitos creado
- ✅ Páginas usan componentes del design system
- ✅ Consistencia visual en toda la aplicación
- ✅ `.context/design-system.md` creado

### Arquitectura:
- ✅ Framework configurado
- ✅ Package manager elegido por usuario
- ✅ Estructura de carpetas correcta
- ✅ Build pasa sin errores

### Documentación:
- ✅ SETUP.md con instrucciones
- ✅ frontend-architecture.md con decisiones técnicas
- ✅ design-system.md con guía de diseño ⭐

### Usuario:
- ✅ Se hicieron preguntas interactivas (package manager, diseño)
- ✅ Se explicó cada decisión
- ✅ Se educó sobre opciones
- ✅ Se dio opción "Elige por mí"
- ✅ Se recomendó (NO forzó) crear commit

---

**Output:** Proyecto frontend con arquitectura sólida + **Design System completo** + páginas visualmente impresionantes, todo documentado y listo para demo.

**Fase completada:** 3.5 - Frontend Scaffolding + Design System ✅

**Próxima fase:** 4 - Shift-Left Testing
