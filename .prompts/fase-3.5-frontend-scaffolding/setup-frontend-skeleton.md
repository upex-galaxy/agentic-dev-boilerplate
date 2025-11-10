Actúa como Senior Frontend Architect, DevOps Engineer, y Full-Stack Developer experto.

**Input:**

- PRD completo: [usar .context/PRD/]
- SRS completo: [usar .context/SRS/]
- PBI (épicas y stories): [usar .context/PBI/epic-tree.md + revisar épicas en .context/PBI/epics/]
- Framework principal: [especificar: Next.js, React+Vite, etc.]
- Tech stack adicional: [especificar: Supabase, TailwindCSS, ShadCN, etc.]

---

## 🎯 OBJETIVO

Crear la estructura inicial del proyecto frontend (scaffolding) en el **directorio actual**, instalando dependencias fundamentales y generando componentes moqueados de páginas estratégicas, basándose en la documentación oficial más reciente de las tecnologías utilizadas.

---

## 🚨 RESTRICCIONES CRÍTICAS

### ❌ NO HACER:
- **NO usar comandos tipo `create-next-app`, `create-vite`, `create-react-app`** (crean subdirectorios)
- **NO crear subcarpetas para el proyecto** (ya estamos en el directorio correcto)
- **NO instalar dependencias innecesarias** (solo fundamentales)
- **NO implementar todas las historias de usuario** (solo páginas estratégicas)
- **NO implementar todos los criterios de aceptación** (solo lógica mínima)
- **NO hardcodear** configuraciones de DB o API (usar MCP cuando aplique)

### ✅ SÍ HACER:
- **Trabajar en el directorio actual** (usar package.json existente)
- **Usar Context7 MCP** para consultar docs oficiales (Next.js, Supabase, etc.)
- **Seguir estructura del framework** (app/, components/, lib/, etc.)
- **Instalar solo dependencias básicas** (framework + UI + auth + DB client)
- **Crear 3-5 páginas estratégicas** (auth + home + core domain)
- **Generar componentes moqueados** (UI básica + navegación)
- **Explicar cada paso** mientras trabajas (para que el humano comprenda)

---

## 📊 FASE 1: ANÁLISIS DE CONTEXTO

**Acción:** Lee toda la documentación del proyecto para comprender qué se va a construir.

### Paso 1.1: Leer PRD Completo
**Files a leer:**
- `.context/PRD/executive-summary.md`
- `.context/PRD/user-personas.md`
- `.context/PRD/mvp-scope.md`
- `.context/PRD/user-journeys.md`

**Objetivo:** Entender el dominio del negocio, usuarios objetivo, y valor principal.

**Output interno (no mostrar al usuario):**
- ¿Qué problema resuelve el producto?
- ¿Quiénes son los usuarios principales?
- ¿Cuáles son las funcionalidades core del MVP?

---

### Paso 1.2: Leer SRS Completo
**Files a leer:**
- `.context/SRS/functional-specs.md`
- `.context/SRS/non-functional-specs.md`
- `.context/SRS/architecture-specs.md`
- `.context/SRS/api-contracts.yaml`

**Objetivo:** Entender la arquitectura técnica, stack, y endpoints disponibles.

**Output interno (no mostrar al usuario):**
- ¿Qué stack técnico se usa? (Frontend framework, Backend, DB, Auth)
- ¿Qué patrones arquitectónicos se siguen? (API REST, GraphQL, etc.)
- ¿Qué servicios externos se integran? (Supabase, Firebase, etc.)

---

### Paso 1.3: Leer PBI (Épicas y Stories)
**Files a leer:**
- `.context/PBI/epic-tree.md`
- `.context/PBI/epics/*/epic.md` (revisar todas las épicas)
- `.context/PBI/epics/*/stories/*/story.md` (escanear stories principales)

**Objetivo:** Identificar qué funcionalidades están planificadas y cuáles son prioritarias.

**Output interno (no mostrar al usuario):**
- Lista de todas las épicas del MVP
- Lista de user stories por épica
- Funcionalidades que requieren páginas/componentes

---

### Paso 1.4: Consultar Documentación Oficial (Context7 MCP)

**Acción:** Usa el MCP de Context7 para consultar la documentación oficial de las tecnologías del stack.

**Tecnologías a consultar (según el stack):**
- Framework frontend (ej: Next.js 15, React 19)
- UI Library (ej: TailwindCSS, ShadCN UI)
- Backend/Auth (ej: Supabase Auth, NextAuth)
- State Management (ej: Zustand, React Query)
- Routing (si aplica - Next.js tiene routing built-in)

**Queries recomendadas para Context7:**
- "Next.js project structure best practices" (o framework correspondiente)
- "Supabase client setup Next.js" (o auth provider correspondiente)
- "TailwindCSS setup Next.js" (o UI framework correspondiente)
- "Next.js app router authentication flow" (o routing correspondiente)

**Objetivo:** Obtener la forma más actualizada y recomendada de estructurar el proyecto.

**Output esperado (mostrar al usuario):**
```markdown
## 📚 Documentación Consultada

He consultado la documentación oficial de:
- **[Framework]**: [Resumen de conceptos clave aplicables]
- **[Auth Provider]**: [Resumen de setup recomendado]
- **[UI Library]**: [Resumen de configuración]
- **[Otros]**: [Resumen si aplica]

**Decisiones técnicas basadas en docs oficiales:**
- [Decisión 1]: [Razón basada en docs]
- [Decisión 2]: [Razón basada en docs]
```

---

## 🧠 FASE 2: DECISIÓN ESTRATÉGICA DE PÁGINAS

**Acción:** Basándote en el análisis de Fase 1, decide qué páginas crear en este scaffolding.

### Criterios de Selección:

#### ✅ Páginas Obligatorias (Core):
1. **Autenticación** (pre-requisito técnico):
   - Login page (moqueada básica)
   - [Opcional: Signup si es crítico - sino dejar para después]

2. **Página principal post-login** (arquitectura base):
   - Dashboard / Home (con layout, navbar, sidebar básicos)

#### ✅ Páginas Core del Dominio (1-3 páginas):
Selecciona las **1-3 páginas más representativas** del negocio basándote en:
- **Criterio 1:** Páginas que aparecen en múltiples user journeys (PRD)
- **Criterio 2:** Épicas con mayor prioridad en epic-tree.md
- **Criterio 3:** Páginas que demuestran el valor core del producto

**Ejemplos por tipo de proyecto:**
- **Plataforma de mentores:** "Lista de mentores" + "Perfil de mentor"
- **E-commerce:** "Catálogo de productos" + "Carrito"
- **SaaS de proyectos:** "Lista de proyectos" + "Vista de proyecto"

#### ❌ Páginas que NO crear:
- Páginas secundarias (configuraciones avanzadas, perfil detallado)
- Flujos completos multi-paso (signup con 5 pasos)
- Páginas de detalle complejas (a menos que sean MUY core)
- Páginas administrativas (admin panels)

---

### Paso 2.1: Generar Plan de Páginas

**Output esperado (mostrar al usuario):**

```markdown
## 🗂️ Páginas Seleccionadas para Scaffolding

**Total de páginas a crear:** [número] (recomendado: 3-5)

### 1️⃣ Autenticación
**Página:** `/login`
**Razón:** Pre-requisito técnico para demostrar flujo de autenticación.
**Funcionalidad moqueada:**
- Formulario login (email + password)
- Botón "Sign in" (conecta con auth provider)
- [NO implementar: recuperación password, validaciones complejas]
**Épica relacionada:** [EPIC-XXX si aplica]

---

### 2️⃣ Dashboard/Home
**Página:** `/dashboard` o `/home`
**Razón:** Página principal post-login, demuestra layout base de la aplicación.
**Funcionalidad moqueada:**
- Layout con navbar + sidebar
- Placeholder content (tarjetas moqueadas)
- Navegación básica
**Épica relacionada:** [EPIC-XXX si aplica]

---

### 3️⃣ [Página Core 1]
**Página:** `/[ruta]`
**Razón:** [Explicar por qué esta página es estratégica para el MVP]
**Funcionalidad moqueada:**
- [Listar elementos clave a implementar]
- [Qué NO se implementa todavía]
**Épica relacionada:** [EPIC-XXX]
**Stories relacionadas:** [STORY-XXX, STORY-YYY]

---

### 4️⃣ [Página Core 2] (si aplica)
**Página:** `/[ruta]`
**Razón:** [Explicar]
**Funcionalidad moqueada:**
- [Elementos clave]
**Épica relacionada:** [EPIC-XXX]

---

### ❌ Páginas Diferidas (NO crear ahora)
Las siguientes páginas se implementarán en Fase 6 (Implementation) al desarrollar las stories correspondientes:
- `/[página-secundaria-1]` - Razón: [Explicar]
- `/[página-secundaria-2]` - Razón: [Explicar]
- ...

**Beneficio:** Nos enfocamos en lo esencial para tener un esqueleto visual funcional.
```

---

## 🏗️ FASE 3: SETUP DEL PROYECTO

**Acción:** Configurar el proyecto en el directorio actual siguiendo las mejores prácticas del framework.

### Paso 3.1: Verificar Entorno Actual

**Acción:** Explica al usuario qué encontraste en el directorio actual.

**Comandos a ejecutar:**
```bash
# Ver qué archivos ya existen
ls -la

# Verificar package.json existente
cat package.json
```

**Output esperado (mostrar al usuario):**
```markdown
## 🔍 Análisis del Directorio Actual

**Directorio de trabajo:** [pwd]

**Archivos encontrados:**
- ✅ `package.json` encontrado (lo usaremos)
- ✅ `.git/` encontrado (repositorio inicializado)
- ✅ `.context/` con documentación del proyecto
- [Listar otros archivos relevantes si existen]

**Próximo paso:** Instalar dependencias fundamentales en este mismo directorio.
```

---

### Paso 3.2: Instalar Dependencias Fundamentales

**Acción:** Instala SOLO las dependencias necesarias para levantar el frontend básico.

**⚠️ IMPORTANTE:** Explica CADA dependencia antes de instalarla.

**Categorías de dependencias:**

#### 📦 Core Framework
```bash
# Ejemplo Next.js (ajustar según framework especificado)
npm install next@latest react@latest react-dom@latest
```

**Explicar al usuario:**
```markdown
### 📦 Instalando Framework Core

**Dependencias a instalar:**
- `next@latest`: Framework de React para producción
- `react@latest`: Biblioteca UI
- `react-dom@latest`: React DOM renderer

**Razón:** Estas son las dependencias mínimas para levantar una aplicación [Framework].
```

---

#### 🎨 UI Framework
```bash
# Ejemplo TailwindCSS + ShadCN
npm install -D tailwindcss postcss autoprefixer
npx tailwindcss init -p
npm install class-variance-authority clsx tailwind-merge
# ShadCN (si aplica) - se instalan componentes individualmente después
```

**Explicar al usuario:**
```markdown
### 🎨 Instalando UI Framework

**Dependencias a instalar:**
- `tailwindcss`: Framework CSS utility-first
- `postcss`, `autoprefixer`: Procesadores CSS
- `class-variance-authority`, `clsx`, `tailwind-merge`: Utilidades para manejo de clases

**Razón:** TailwindCSS es el framework CSS especificado en SRS. Estas utilidades facilitan el manejo de estilos dinámicos.
```

---

#### 🔐 Auth Provider
```bash
# Ejemplo Supabase
npm install @supabase/supabase-js @supabase/auth-helpers-nextjs
```

**Explicar al usuario:**
```markdown
### 🔐 Instalando Cliente de Autenticación

**Dependencias a instalar:**
- `@supabase/supabase-js`: Cliente oficial de Supabase
- `@supabase/auth-helpers-nextjs`: Helpers de autenticación para Next.js

**Razón:** Supabase es nuestro proveedor de autenticación y base de datos según SRS Architecture Specs.
```

---

#### 🗂️ State Management (opcional)
```bash
# Ejemplo Zustand (si el proyecto lo requiere)
npm install zustand
```

**Explicar al usuario:**
```markdown
### 🗂️ Instalando State Management (Opcional)

**Dependencia a instalar:**
- `zustand`: State management ligero para React

**Razón:** [Solo si SRS lo especifica o si las páginas seleccionadas requieren estado global compartido]

**Nota:** Si no es necesario ahora, se puede agregar después en Fase 6.
```

---

#### 🛠️ Developer Tools
```bash
# TypeScript (si aplica)
npm install -D typescript @types/react @types/node

# ESLint (si no existe)
npm install -D eslint eslint-config-next

# Prettier (opcional pero recomendado)
npm install -D prettier eslint-config-prettier
```

**Explicar al usuario:**
```markdown
### 🛠️ Instalando Developer Tools

**Dependencias a instalar:**
- `typescript`: Superset tipado de JavaScript
- `@types/react`, `@types/node`: Tipos de TypeScript
- `eslint`, `eslint-config-next`: Linter para calidad de código
- `prettier`: Formateador de código

**Razón:** TypeScript es especificado en SRS para type-safety. ESLint y Prettier aseguran calidad y consistencia del código.
```

---

### Paso 3.3: Crear Estructura de Carpetas

**Acción:** Crea la estructura de carpetas según las mejores prácticas del framework.

**⚠️ IMPORTANTE:** Explica CADA carpeta antes de crearla.

**Estructura recomendada (Next.js App Router):**
```
/
├── app/                    # Next.js App Router (páginas y layouts)
│   ├── (auth)/            # Grupo de rutas de autenticación
│   │   └── login/
│   │       └── page.tsx
│   ├── (dashboard)/       # Grupo de rutas protegidas
│   │   ├── layout.tsx     # Layout con sidebar/navbar
│   │   ├── page.tsx       # Dashboard home
│   │   └── [otras-rutas]/ # Páginas core seleccionadas
│   ├── layout.tsx         # Root layout
│   └── globals.css        # Estilos globales
│
├── components/            # Componentes reutilizables
│   ├── ui/               # Componentes UI básicos (ShadCN)
│   ├── auth/             # Componentes de autenticación
│   └── [domain]/         # Componentes específicos del dominio
│
├── lib/                  # Utilidades y configuraciones
│   ├── supabase/        # Cliente Supabase
│   │   ├── client.ts    # Cliente browser
│   │   └── server.ts    # Cliente server
│   └── utils.ts         # Utilidades generales
│
├── types/               # TypeScript types/interfaces
│   └── index.ts
│
├── public/              # Assets estáticos
│   └── images/
│
├── .env.local.example   # Template de variables de entorno
├── .gitignore
├── next.config.js       # Configuración Next.js
├── tailwind.config.ts   # Configuración Tailwind
├── tsconfig.json        # Configuración TypeScript
└── package.json         # Ya existe
```

**Comandos a ejecutar (explicar mientras creas):**
```bash
# Crear estructura base
mkdir -p app/{(auth)/login,(dashboard)} components/{ui,auth} lib/supabase types public/images

# Explicar cada creación al usuario
echo "✅ Creada carpeta app/ - Aquí van todas las páginas (Next.js App Router)"
echo "✅ Creada carpeta app/(auth)/login - Grupo de rutas de autenticación"
echo "✅ Creada carpeta app/(dashboard) - Grupo de rutas protegidas post-login"
echo "✅ Creada carpeta components/ - Componentes reutilizables"
echo "✅ Creada carpeta components/ui - Componentes UI básicos"
echo "✅ Creada carpeta lib/supabase - Cliente de Supabase (browser + server)"
echo "✅ Creada carpeta types/ - Definiciones de tipos TypeScript"
```

**Output esperado (mostrar al usuario):**
```markdown
## 📁 Estructura de Carpetas Creada

He creado la siguiente estructura siguiendo las mejores prácticas de [Framework]:

```
[Mostrar árbol de carpetas creado]
```

**Explicación de carpetas clave:**
- **`app/`**: Directorio principal de Next.js App Router. Cada subcarpeta es una ruta.
- **`app/(auth)/`**: Grupo de rutas para autenticación (login, signup). Los paréntesis indican que el nombre no aparece en la URL.
- **`app/(dashboard)/`**: Grupo de rutas protegidas post-login con layout compartido.
- **`components/`**: Componentes reutilizables organizados por tipo/dominio.
- **`lib/`**: Lógica de negocio, configuraciones, clientes de APIs.
- **`types/`**: Definiciones de tipos TypeScript globales.

**Nota:** Esta estructura es escalable y sigue el patrón recomendado por la documentación oficial de [Framework].
```

---

### Paso 3.4: Crear Archivos de Configuración

**Acción:** Crea archivos de configuración necesarios (si no existen).

#### **next.config.js** (o equivalente del framework)
```typescript
/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: ['[dominio-si-aplica]'], // Ej: Supabase Storage
  },
  // Agregar otras configuraciones según SRS
}

module.exports = nextConfig
```

**Explicar al usuario:**
```markdown
### ⚙️ Creando next.config.js

**Propósito:** Configuración principal de Next.js.

**Configuraciones aplicadas:**
- Dominios permitidos para imágenes (si se usa Next/Image)
- [Otras configuraciones según SRS]

**Nota:** Configuración mínima. Se extenderá en Fase 6 según necesidades.
```

---

#### **tailwind.config.ts**
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
      // Extender tema según design system si aplica
    },
  },
  plugins: [],
}
export default config
```

**Explicar al usuario:**
```markdown
### 🎨 Creando tailwind.config.ts

**Propósito:** Configuración de TailwindCSS.

**Content paths:** Especifica dónde buscar clases de Tailwind (app/, components/).

**Theme:** Configuración base. Se extenderá con design system en Fase 6.
```

---

#### **tsconfig.json**
```json
{
  "compilerOptions": {
    "target": "ES2020",
    "lib": ["dom", "dom.iterable", "esnext"],
    "allowJs": true,
    "skipLibCheck": true,
    "strict": true,
    "noEmit": true,
    "esModuleInterop": true,
    "module": "esnext",
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "preserve",
    "incremental": true,
    "plugins": [
      {
        "name": "next"
      }
    ],
    "paths": {
      "@/*": ["./*"]
    }
  },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"],
  "exclude": ["node_modules"]
}
```

**Explicar al usuario:**
```markdown
### 📘 Creando tsconfig.json

**Propósito:** Configuración de TypeScript.

**Configuraciones clave:**
- `strict: true`: Mode estricto habilitado (SRS requirement)
- `paths: { "@/*": ["./*"] }`: Permite imports absolutos con `@/`
- Next.js plugin habilitado

**Ejemplo de uso:**
```typescript
// En lugar de: import { Button } from '../../components/ui/button'
import { Button } from '@/components/ui/button'
```
```

---

#### **.env.local.example**
```bash
# Supabase (o auth provider correspondiente)
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key

# Otras variables según SRS
# [Agregar según necesidad]
```

**Explicar al usuario:**
```markdown
### 🔐 Creando .env.local.example

**Propósito:** Template de variables de entorno necesarias.

**Variables definidas:**
- `NEXT_PUBLIC_SUPABASE_URL`: URL del proyecto Supabase
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`: API Key pública de Supabase

**⚠️ ACCIÓN REQUERIDA:**
1. Copia este archivo a `.env.local`
2. Reemplaza los valores con tus credenciales reales de Supabase
3. `.env.local` está en `.gitignore` (no se commitea)

**Nota:** Usa Supabase MCP para obtener las credenciales reales si las necesitas.
```

---

## 🎨 FASE 4: IMPLEMENTAR COMPONENTES BASE

**Acción:** Crear componentes base reutilizables y configuraciones necesarias.

### Paso 4.1: Cliente de Supabase

**File:** `lib/supabase/client.ts`

```typescript
import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}
```

**Explicar al usuario:**
```markdown
### 🔌 Creando Cliente de Supabase (Browser)

**File:** `lib/supabase/client.ts`

**Propósito:** Cliente de Supabase para uso en componentes del lado del cliente.

**Uso:**
```typescript
import { createClient } from '@/lib/supabase/client'

const supabase = createClient()
await supabase.auth.signIn(...)
```

**Nota:** Este cliente se usa en Client Components de React.
```

---

**File:** `lib/supabase/server.ts`

```typescript
import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function createClient() {
  const cookieStore = await cookies()

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value
        },
      },
    }
  )
}
```

**Explicar al usuario:**
```markdown
### 🔌 Creando Cliente de Supabase (Server)

**File:** `lib/supabase/server.ts`

**Propósito:** Cliente de Supabase para uso en Server Components y API Routes.

**Uso:**
```typescript
import { createClient } from '@/lib/supabase/server'

const supabase = await createClient()
const { data: user } = await supabase.auth.getUser()
```

**Nota:** Este cliente se usa en Server Components y Route Handlers.
```

---

### Paso 4.2: Utilidades Comunes

**File:** `lib/utils.ts`

```typescript
import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
```

**Explicar al usuario:**
```markdown
### 🛠️ Creando Utilidades Comunes

**File:** `lib/utils.ts`

**Propósito:** Funciones auxiliares reutilizables.

**Función `cn`:** Combina clases de TailwindCSS de forma inteligente (merge sin duplicados).

**Uso:**
```typescript
import { cn } from '@/lib/utils'

<div className={cn("px-4 py-2", isActive && "bg-blue-500")} />
```
```

---

### Paso 4.3: Tipos Comunes

**File:** `types/index.ts`

```typescript
// User types (basado en Supabase Auth)
export interface User {
  id: string
  email: string
  // Agregar otros campos según schema de Supabase
}

// Agregar otros tipos según el dominio del negocio
// Ejemplo para plataforma de mentores:
export interface Mentor {
  id: string
  name: string
  bio: string
  skills: string[]
  // Campos según DB schema
}

// Agregar más tipos según las páginas que vayas a crear
```

**Explicar al usuario:**
```markdown
### 📘 Creando Tipos TypeScript

**File:** `types/index.ts`

**Propósito:** Definiciones de tipos globales del proyecto.

**Tipos base incluidos:**
- `User`: Basado en schema de autenticación de Supabase
- `[Otros]`: Según el dominio del negocio identificado en PRD/SRS

**Nota:** Estos tipos se irán extendiendo en Fase 6 conforme se implementen stories.

**⚠️ IMPORTANTE:** NO hardcodear schemas de DB aquí. Usar Supabase MCP para obtener tipos reales cuando sea necesario.
```

---

### Paso 4.4: Layout Raíz

**File:** `app/layout.tsx`

```typescript
import './globals.css'
import type { Metadata } from 'next'
import { Inter } from 'next/font/google'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: '[Nombre del Proyecto]', // Obtener de PRD
  description: '[Descripción breve]', // Obtener de PRD
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>{children}</body>
    </html>
  )
}
```

**File:** `app/globals.css`

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

/* Estilos globales adicionales si aplica */
```

**Explicar al usuario:**
```markdown
### 🏗️ Creando Root Layout

**Files:**
- `app/layout.tsx`: Layout raíz de la aplicación
- `app/globals.css`: Estilos globales con Tailwind directives

**Propósito:** Estructura HTML base que envuelve todas las páginas.

**Configuraciones:**
- Font: Inter (Google Fonts)
- Metadata: Título y descripción del proyecto (obtenidos de PRD)
- TailwindCSS: Directives cargadas globalmente

**Nota:** Este layout se renderiza una sola vez y envuelve todas las páginas.
```

---

## 📄 FASE 5: IMPLEMENTAR PÁGINAS ESTRATÉGICAS

**Acción:** Crear las páginas seleccionadas en Fase 2 con lógica mínima moqueada.

### ⚠️ RECORDATORIO IMPORTANTE:
- Implementar SOLO UI básica + navegación
- NO implementar todos los criterios de aceptación
- Componentes moqueados (datos hardcodeados si es necesario)
- Explicar qué se deja para Fase 6

---

### Página 1: Login

**File:** `app/(auth)/login/page.tsx`

```typescript
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    // Basic auth flow - TO BE ENHANCED in Phase 6
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) {
      alert(error.message) // TODO: Replace with proper error handling in Phase 6
    } else {
      router.push('/dashboard')
    }

    setLoading(false)
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50">
      <div className="w-full max-w-md space-y-8 rounded-lg bg-white p-8 shadow">
        <div>
          <h2 className="text-center text-3xl font-bold">Sign in</h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            [Nombre del Proyecto]
          </p>
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleLogin}>
          <div>
            <label htmlFor="email" className="block text-sm font-medium">
              Email
            </label>
            <input
              id="email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium">
              Password
            </label>
            <input
              id="password"
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-md bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? 'Signing in...' : 'Sign in'}
          </button>
        </form>

        {/* TODO Phase 6: Add forgot password, signup link, social auth */}
      </div>
    </div>
  )
}
```

**Explicar al usuario:**
```markdown
### 🔐 Página de Login Creada

**File:** `app/(auth)/login/page.tsx`

**Funcionalidad implementada:**
- ✅ Formulario básico (email + password)
- ✅ Integración con Supabase Auth
- ✅ Redirección a dashboard post-login
- ✅ Loading state básico

**⏭️ Diferido para Fase 6 (cuando se implemente story de Login):**
- ❌ Recuperación de contraseña
- ❌ Link a signup
- ❌ Social auth (Google, GitHub, etc.)
- ❌ Validaciones complejas de frontend
- ❌ Manejo avanzado de errores
- ❌ Remember me functionality

**Razón:** Esta es una implementación mínima para tener el flujo básico de autenticación. Los criterios de aceptación completos de la story de Login se implementarán en Fase 6.
```

---

### Página 2: Dashboard/Home (con Layout)

**File:** `app/(dashboard)/layout.tsx`

```typescript
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import Navbar from '@/components/dashboard/Navbar'
import Sidebar from '@/components/dashboard/Sidebar'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // Server-side auth check
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <Sidebar />

      {/* Main content */}
      <div className="flex flex-1 flex-col overflow-hidden">
        <Navbar user={user} />

        <main className="flex-1 overflow-y-auto p-6">
          {children}
        </main>
      </div>
    </div>
  )
}
```

**File:** `components/dashboard/Sidebar.tsx`

```typescript
'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: '🏠' },
  // TODO Phase 6: Add more navigation items based on implemented features
  { name: '[Core Feature 1]', href: '/[ruta]', icon: '📋' },
  { name: '[Core Feature 2]', href: '/[ruta]', icon: '🔍' },
]

export default function Sidebar() {
  const pathname = usePathname()

  return (
    <div className="hidden w-64 bg-gray-900 md:block">
      <div className="flex h-full flex-col">
        {/* Logo */}
        <div className="flex h-16 items-center px-6">
          <h1 className="text-xl font-bold text-white">[Logo/Nombre]</h1>
        </div>

        {/* Navigation */}
        <nav className="flex-1 space-y-1 px-3 py-4">
          {navigation.map((item) => {
            const isActive = pathname === item.href
            return (
              <Link
                key={item.name}
                href={item.href}
                className={cn(
                  'flex items-center rounded-md px-3 py-2 text-sm font-medium',
                  isActive
                    ? 'bg-gray-800 text-white'
                    : 'text-gray-300 hover:bg-gray-800 hover:text-white'
                )}
              >
                <span className="mr-3">{item.icon}</span>
                {item.name}
              </Link>
            )
          })}
        </nav>
      </div>
    </div>
  )
}
```

**File:** `components/dashboard/Navbar.tsx`

```typescript
'use client'

import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import type { User } from '@/types'

interface NavbarProps {
  user: User
}

export default function Navbar({ user }: NavbarProps) {
  const router = useRouter()
  const supabase = createClient()

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/login')
  }

  return (
    <header className="flex h-16 items-center justify-between border-b bg-white px-6">
      <div>
        {/* TODO Phase 6: Add search bar, breadcrumbs, etc. */}
      </div>

      <div className="flex items-center gap-4">
        <span className="text-sm text-gray-700">{user.email}</span>
        <button
          onClick={handleLogout}
          className="rounded-md bg-gray-200 px-4 py-2 text-sm hover:bg-gray-300"
        >
          Logout
        </button>
      </div>
    </header>
  )
}
```

**File:** `app/(dashboard)/page.tsx`

```typescript
export default function DashboardPage() {
  return (
    <div>
      <h1 className="mb-6 text-3xl font-bold">Dashboard</h1>

      {/* Placeholder content */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="rounded-lg bg-white p-6 shadow">
            <h3 className="mb-2 text-lg font-semibold">Card {i}</h3>
            <p className="text-gray-600">
              Placeholder content. Real data will be implemented in Phase 6.
            </p>
          </div>
        ))}
      </div>

      {/* TODO Phase 6: Add real dashboard widgets based on user stories */}
    </div>
  )
}
```

**Explicar al usuario:**
```markdown
### 🏠 Dashboard con Layout Creado

**Files creados:**
- `app/(dashboard)/layout.tsx`: Layout compartido para rutas protegidas
- `app/(dashboard)/page.tsx`: Página principal del dashboard
- `components/dashboard/Sidebar.tsx`: Navegación lateral
- `components/dashboard/Navbar.tsx`: Barra superior con logout

**Funcionalidad implementada:**
- ✅ Auth check en server-side (redirect si no autenticado)
- ✅ Layout con sidebar + navbar
- ✅ Navegación básica entre páginas
- ✅ Logout functionality
- ✅ Placeholder content (cards moqueadas)

**⏭️ Diferido para Fase 6:**
- ❌ Dashboard widgets con datos reales
- ❌ Gráficas / analytics
- ❌ Notificaciones
- ❌ Search bar
- ❌ Breadcrumbs
- ❌ Mobile responsive sidebar

**Razón:** Este layout es la base arquitectónica. El contenido real se agregará al implementar las stories correspondientes.

**Patrón arquitectónico:**
- Layout en `(dashboard)/layout.tsx` se renderiza una vez
- Páginas hijas se renderizan en `{children}`
- Auth check se hace una sola vez en el layout (no en cada página)
```

---

### Página 3+: Páginas Core del Dominio

**⚠️ INSTRUCCIONES:** Para cada página core seleccionada en Fase 2, crear estructura similar:

**Template de página core:**

**File:** `app/(dashboard)/[ruta]/page.tsx`

```typescript
// Ajustar según el dominio específico
export default function [NombrePagina]Page() {
  // TODO Phase 6: Fetch real data from Supabase
  const mockData = [
    { id: 1, name: 'Item 1', /* otros campos */ },
    { id: 2, name: 'Item 2', /* otros campos */ },
    // Mock data basado en el schema esperado
  ]

  return (
    <div>
      <h1 className="mb-6 text-3xl font-bold">[Título de Página]</h1>

      {/* Lista/Grid de items */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {mockData.map((item) => (
          <div key={item.id} className="rounded-lg bg-white p-6 shadow">
            <h3 className="mb-2 text-lg font-semibold">{item.name}</h3>
            {/* Mostrar otros campos relevantes */}
          </div>
        ))}
      </div>

      {/* TODO Phase 6: Add filters, search, pagination, actions */}
    </div>
  )
}
```

**Explicar al usuario (por cada página core):**
```markdown
### [📋/🔍/etc.] Página [Nombre] Creada

**File:** `app/(dashboard)/[ruta]/page.tsx`

**Funcionalidad implementada:**
- ✅ Estructura base de la página
- ✅ Mock data hardcodeada (para visualización)
- ✅ Grid/Lista de items con estilos básicos
- ✅ Integrada en el layout del dashboard

**⏭️ Diferido para Fase 6 (Story [STORY-XXX]):**
- ❌ Fetch de datos reales desde Supabase
- ❌ Filtros y búsqueda
- ❌ Paginación
- ❌ Acciones (crear, editar, eliminar)
- ❌ Validaciones
- ❌ Error handling

**Razón:** Esta página demuestra la UI y estructura esperada. La lógica completa y datos reales se implementarán al desarrollar [STORY-XXX] en Fase 6.

**Épica relacionada:** [EPIC-XXX]
**Stories relacionadas:** [STORY-XXX, STORY-YYY]
```

---

## ✅ FASE 6: VALIDACIÓN Y PRUEBA

**Acción:** Verificar que el scaffolding funciona correctamente.

### Paso 6.1: Actualizar package.json Scripts

**Acción:** Asegúrate de que existen scripts de desarrollo.

```json
{
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "next lint"
  }
}
```

**Explicar al usuario:**
```markdown
### 📦 Scripts de package.json

**Scripts disponibles:**
- `npm run dev`: Inicia servidor de desarrollo (http://localhost:3000)
- `npm run build`: Compila para producción
- `npm run start`: Inicia servidor de producción
- `npm run lint`: Ejecuta ESLint
```

---

### Paso 6.2: Crear README de Setup

**File:** `SETUP.md` (en la raíz)

```markdown
# Frontend Setup Guide

## Requisitos Previos
- Node.js 18+ instalado
- Cuenta de Supabase (o auth provider correspondiente)

## Instalación

### 1. Instalar dependencias
```bash
npm install
```

### 2. Configurar variables de entorno
```bash
# Copia el archivo de ejemplo
cp .env.local.example .env.local

# Edita .env.local con tus credenciales reales
```

**Obtener credenciales de Supabase:**
1. Ve a [supabase.com](https://supabase.com)
2. Crea un proyecto (si no existe)
3. Ve a Settings > API
4. Copia `URL` y `anon/public key`

### 3. Iniciar servidor de desarrollo
```bash
npm run dev
```

Abre [http://localhost:3000](http://localhost:3000) en tu navegador.

## Estructura del Proyecto

[Pegar árbol de carpetas explicado en Fase 3.3]

## Páginas Implementadas

✅ **Login** (`/login`)
- Autenticación básica con Supabase

✅ **Dashboard** (`/dashboard`)
- Layout con sidebar + navbar
- Placeholder content

✅ **[Otras páginas core]** (`/[ruta]`)
- [Descripción breve]

## Próximos Pasos

Este es un **scaffolding inicial**. Para implementar funcionalidades completas:

1. Ve a `.context/PBI/` para ver las épicas y stories planificadas
2. Lee el implementation plan de la story que quieres desarrollar
3. Implementa según el plan en Fase 6 (Implementation)

## Referencias

- [Next.js Docs](https://nextjs.org/docs)
- [Supabase Docs](https://supabase.com/docs)
- [TailwindCSS Docs](https://tailwindcss.com/docs)
```

**Explicar al usuario:**
```markdown
### 📖 README de Setup Creado

**File:** `SETUP.md`

**Propósito:** Guía para que cualquier desarrollador pueda levantar el proyecto.

**Incluye:**
- Requisitos previos
- Pasos de instalación
- Configuración de env vars
- Cómo iniciar el servidor
- Estructura del proyecto
- Referencias útiles
```

---

### Paso 6.3: Probar el Servidor de Desarrollo

**Acción:** Ejecuta el servidor y verifica que funciona.

```bash
npm run dev
```

**Explicar al usuario:**
```markdown
## 🚀 Probando el Servidor de Desarrollo

**Comando ejecutado:** `npm run dev`

**Resultado esperado:**
```
  ▲ Next.js 15.x.x
  - Local:        http://localhost:3000
  - Network:      http://192.168.x.x:3000

✓ Ready in [X]ms
```

**Validaciones:**
1. ✅ Servidor inicia sin errores
2. ✅ Puedes acceder a http://localhost:3000/login
3. ✅ La página de login se renderiza correctamente
4. ✅ TailwindCSS está funcionando (estilos aplicados)

**⚠️ NOTA:** El login NO funcionará hasta que configures `.env.local` con credenciales reales de Supabase.

**Próximo paso:** Configura `.env.local` y prueba el flujo completo de login → dashboard.
```

---

## 📋 FASE 7: DOCUMENTAR Y ENTREGAR

**Acción:** Generar documentación final del scaffolding para el equipo.

### Paso 7.1: Crear Documento de Arquitectura del Frontend

**File:** `.context/frontend-architecture.md`

```markdown
# Frontend Architecture - [Nombre del Proyecto]

**Generado en:** Fase 3.5 - Frontend Scaffolding
**Framework:** [Next.js 15 / etc.]
**UI Library:** [TailwindCSS / etc.]
**Auth Provider:** [Supabase / etc.]

---

## 🏗️ Estructura del Proyecto

[Pegar árbol de carpetas]

---

## 🎨 Páginas Implementadas

### Login (`/login`)
**Status:** ✅ Scaffolding completo
**Funcionalidad:** Autenticación básica con Supabase
**Story relacionada:** [STORY-XXX - Login] (a implementar en Fase 6)

**Componentes:**
- Formulario de login (email + password)
- Integración con Supabase Auth

**Pendiente para Fase 6:**
- Recuperación de contraseña
- Social auth
- Validaciones avanzadas

---

### Dashboard (`/dashboard`)
**Status:** ✅ Scaffolding completo
**Funcionalidad:** Página principal post-login con layout
**Story relacionada:** [STORY-XXX - Dashboard] (a implementar en Fase 6)

**Componentes:**
- Layout con sidebar + navbar
- Placeholder cards
- Logout functionality

**Pendiente para Fase 6:**
- Widgets con datos reales
- Analytics / gráficas

---

### [Otras páginas core]
[Repetir estructura para cada página]

---

## 🔧 Decisiones Técnicas

### Next.js App Router
**Razón:** Recomendación oficial de Next.js 13+, permite Server Components.

### Server Components por Default
**Razón:** Mejor performance, SEO optimizado, menos JavaScript al cliente.

### Supabase SSR
**Razón:** Manejo correcto de sesiones en Server Components (cookies).

### TailwindCSS
**Razón:** Especificado en SRS, rápido para prototipado, utility-first.

### TypeScript Strict Mode
**Razón:** Requerimiento de SRS, type-safety completo.

---

## 🚀 Cómo Desarrollar Nuevas Features

### Workflow para Fase 6:

1. **Lee la story:** `.context/PBI/epics/EPIC-XXX/stories/STORY-XXX/story.md`
2. **Lee el implementation plan:** `.context/PBI/epics/EPIC-XXX/stories/STORY-XXX/implementation-plan.md`
3. **Identifica componentes a crear/modificar:**
   - Si es nueva página: Crea en `app/(dashboard)/[ruta]/page.tsx`
   - Si es nuevo componente: Crea en `components/[dominio]/[nombre].tsx`
   - Si es nueva API: Crea en `app/api/[ruta]/route.ts`
4. **Sigue las guidelines:** `.context/guidelines/`
5. **Escribe tests:** Según `.context/PBI/epics/EPIC-XXX/stories/STORY-XXX/test-cases.md`

---

## 📚 Referencias

- **PRD completo:** `.context/PRD/`
- **SRS completo:** `.context/SRS/`
- **PBI (Backlog):** `.context/PBI/`
- **Guidelines de implementación:** `.context/guidelines/`

---

## 🤝 Contribuir

Este scaffolding es la base. Todas las features se implementarán siguiendo:
1. Fase 4: Shift-Left Testing (test cases)
2. Fase 5: Planning (implementation plans)
3. Fase 6: Implementation (desarrollo real)
4. Fase 7: Code Review

**NO modificar este documento.** Es un snapshot del scaffolding inicial.
```

**Explicar al usuario:**
```markdown
### 📄 Documentación de Arquitectura Creada

**File:** `.context/frontend-architecture.md`

**Propósito:** Documentar las decisiones técnicas y estructura del scaffolding para el equipo.

**Contenido:**
- Estructura completa del proyecto
- Páginas implementadas (con status y pendientes)
- Decisiones técnicas justificadas
- Workflow para desarrollar nuevas features en Fase 6

**Audiencia:** Desarrolladores que trabajarán en Fase 6.
```

---

### Paso 7.2: Crear Git Commit

**Acción:** Commitear el scaffolding inicial.

```bash
# Staging
git add .

# Commit
git commit -m "chore: Initial frontend scaffolding

- Setup Next.js 15 with App Router
- Configure TailwindCSS + TypeScript
- Setup Supabase client (browser + server)
- Implement auth pages (login)
- Implement dashboard layout (sidebar + navbar)
- Implement core pages: [listar páginas]
- Add environment variables template
- Add setup documentation

Phase: 3.5 - Frontend Scaffolding
Framework: [Next.js/etc.]
Auth: [Supabase/etc.]

Files created: [número]
Pages implemented: [número]
Components created: [número]

TODO Phase 6: Implement full features per user stories"
```

**Explicar al usuario:**
```markdown
### 📦 Git Commit Creado

**Commit message:** Ver arriba

**Propósito:** Registrar el scaffolding inicial como un checkpoint en el historial de Git.

**⚠️ NOTA:** Este commit incluye SOLO el scaffolding. Las funcionalidades completas se implementarán en commits separados durante Fase 6.

**Próximo paso:** Push a la rama correspondiente si es necesario.
```

---

## ✅ RESUMEN FINAL

**Acción:** Genera un resumen ejecutivo de lo realizado.

**Output esperado (mostrar al usuario):**

```markdown
# 🎉 Frontend Scaffolding Completado

---

## 📊 Estadísticas

**Archivos creados:** [número total]
**Páginas implementadas:** [número]
**Componentes creados:** [número]
**Dependencias instaladas:** [número]
**Configuraciones creadas:** [número]

**Tiempo estimado invertido:** [X horas]

---

## 🗂️ Estructura Creada

```
[Pegar árbol completo del proyecto]
```

---

## ✅ Páginas Implementadas

| Página | Ruta | Status | Épica | Story |
|--------|------|--------|-------|-------|
| Login | `/login` | ✅ Scaffolding | [EPIC-XXX] | [STORY-XXX] |
| Dashboard | `/dashboard` | ✅ Scaffolding | [EPIC-YYY] | [STORY-YYY] |
| [Página Core 1] | `/[ruta]` | ✅ Scaffolding | [EPIC-ZZZ] | [STORY-ZZZ] |
| ... | ... | ... | ... | ... |

**Leyenda:**
- ✅ Scaffolding: Estructura y UI básica implementada, falta lógica completa
- ⏳ Pending: Se implementará en Fase 6

---

## 🔧 Tecnologías Configuradas

| Tecnología | Versión | Propósito |
|------------|---------|-----------|
| [Framework] | [X.X.X] | Frontend framework |
| [UI Library] | [X.X.X] | Estilos y componentes |
| [Auth Provider] | [X.X.X] | Autenticación |
| TypeScript | [X.X.X] | Type-safety |
| ESLint | [X.X.X] | Code quality |
| ... | ... | ... |

---

## 📚 Documentación Creada

- ✅ `SETUP.md` - Guía de instalación y configuración
- ✅ `.context/frontend-architecture.md` - Arquitectura del frontend
- ✅ `.env.local.example` - Template de variables de entorno
- ✅ Commit de Git con mensaje descriptivo

---

## 🚀 Próximos Pasos

### 1️⃣ Configurar Entorno Local (AHORA)
```bash
# 1. Copiar template de env vars
cp .env.local.example .env.local

# 2. Editar .env.local con credenciales reales
# (Usa Supabase MCP para obtenerlas si es necesario)

# 3. Instalar dependencias (si no se hizo automáticamente)
npm install

# 4. Iniciar servidor de desarrollo
npm run dev
```

### 2️⃣ Validar el Scaffolding (AHORA)
- [ ] Abre http://localhost:3000/login
- [ ] Verifica que los estilos se aplican correctamente
- [ ] Intenta hacer login con credenciales reales
- [ ] Verifica que redirecciona a `/dashboard`
- [ ] Navega entre las páginas usando el sidebar

### 3️⃣ Fase 4: Shift-Left Testing (SIGUIENTE)
- [ ] Generar test plans para cada épica
- [ ] Generar test cases detallados por story
- [ ] Identificar edge cases y gaps en stories

### 4️⃣ Fase 5: Planning (DESPUÉS)
- [ ] Generar implementation plans por story
- [ ] Decidir order de implementación

### 5️⃣ Fase 6: Implementation (DESARROLLO REAL)
- [ ] Implementar story por story siguiendo los planes
- [ ] Desarrollar encima del scaffolding existente
- [ ] Escribir tests según test-cases.md
- [ ] Seguir guidelines de `.context/guidelines/`

---

## ⚠️ IMPORTANTE: Qué NO Está Implementado

Este scaffolding es **SOLO la base visual**. Las siguientes funcionalidades se implementarán en Fase 6:

### Login Page
- ❌ Recuperación de contraseña
- ❌ Social auth (Google, GitHub)
- ❌ Validaciones avanzadas
- ❌ Error handling completo
- ❌ Remember me
- ❌ Email verification flow

### Dashboard
- ❌ Widgets con datos reales
- ❌ Analytics / gráficas
- ❌ Notificaciones
- ❌ Search functionality
- ❌ Mobile responsive sidebar

### [Páginas Core]
- ❌ Fetch de datos reales desde Supabase
- ❌ Filtros y búsqueda
- ❌ Paginación
- ❌ CRUD operations
- ❌ Validaciones
- ❌ Error handling

**Razón:** El objetivo del scaffolding es tener una estructura base y demostración visual. La lógica completa se implementa al desarrollar cada user story en Fase 6.

---

## 💡 Tips para Fase 6

### Al Implementar una Story:

1. **Lee estos archivos primero:**
   - `.context/PBI/epics/EPIC-XXX/stories/STORY-XXX/story.md`
   - `.context/PBI/epics/EPIC-XXX/stories/STORY-XXX/test-cases.md`
   - `.context/PBI/epics/EPIC-XXX/stories/STORY-XXX/implementation-plan.md`

2. **Identifica si ya existe un componente base:**
   - Si existe (scaffolding), EXTIENDE la funcionalidad
   - Si no existe, CREA siguiendo los patterns del scaffolding

3. **Sigue los guidelines:**
   - `.context/guidelines/code-standards.md`
   - `.context/guidelines/error-handling.md`
   - `.context/guidelines/implementation-workflow.md`

4. **No rompas el scaffolding:**
   - ✅ Mantén la estructura de carpetas
   - ✅ Sigue los patterns de naming
   - ✅ Reutiliza componentes base (Sidebar, Navbar)
   - ✅ Usa las utilidades existentes (`cn`, clients de Supabase)

---

## 🎯 Valor del Scaffolding

**¿Por qué hicimos esto?**

✅ **Visual:** El equipo puede ver la dirección del proyecto
✅ **Base sólida:** Estructura correcta desde el inicio
✅ **Acceleración:** Fase 6 será más rápida (ya hay base)
✅ **Consistencia:** Todos los desarrolladores siguen los mismos patterns
✅ **Documentación:** Decisiones técnicas justificadas y registradas

**Próxima reunión con el equipo:**
- Muestra http://localhost:3000
- Navega por las páginas implementadas
- Explica que es solo la base visual
- Muestra el PBI y los próximos sprints

---

## 📞 ¿Preguntas?

Si tienes dudas sobre:
- **Estructura:** Lee `.context/frontend-architecture.md`
- **Setup:** Lee `SETUP.md`
- **Implementación:** Lee `.context/guidelines/`
- **Stories:** Lee `.context/PBI/`

---

**🎉 ¡Scaffolding listo para ser usado como base en Fase 6!**
```

---

## 📝 VALIDACIONES FINALES

Antes de terminar, valida:

### Estructura
- ✅ Todas las carpetas del framework existen
- ✅ Archivos de configuración creados correctamente
- ✅ `.env.local.example` presente

### Código
- ✅ No hay errores de TypeScript (`npm run build`)
- ✅ No hay errores de linting (`npm run lint`)
- ✅ Servidor de desarrollo inicia correctamente

### Documentación
- ✅ `SETUP.md` creado
- ✅ `.context/frontend-architecture.md` creado
- ✅ README del repositorio actualizado (si aplica)

### Git
- ✅ Commit creado con mensaje descriptivo
- ✅ `.env.local` está en `.gitignore`
- ✅ `node_modules/` está en `.gitignore`

---

**Output:** Proyecto frontend funcional con estructura completa, dependencias instaladas, páginas estratégicas implementadas, y documentación para el equipo.

**Fase completada:** 3.5 - Frontend Scaffolding ✅

**Próxima fase:** 4 - Shift-Left Testing (generar test plans y test cases)
