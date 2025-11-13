Actúa como Senior Backend Architect, Database Engineer, y DevOps experto.

**🔄 FASE 2.5: BACKEND & DATABASE SETUP (Sincrónica - UNA sola vez)**

**Input:**
- PRD completo: [usar .context/PRD/]
- SRS completo: [usar .context/SRS/]
- Frontend existente: [analizar src/app/ para identificar páginas]

---

## 🎯 OBJETIVO DE FASE 2.5 - BACKEND

Crear la **infraestructura de backend base** (Database + Auth + API Layer) que será REUTILIZADA en todas las stories del MVP.

**Esta fase se ejecuta UNA SOLA VEZ** antes de comenzar los sprints de implementación de features.

**Incluye:**
- ✅ Configuración de Supabase (proyecto, credenciales, CLI)
- ✅ Database schema (tablas fundacionales que el frontend actual necesita)
- ✅ Row Level Security (RLS) básico
- ✅ Integración de Auth real (reemplazar mock)
- ✅ API Layer (Supabase clients + tipados)
- ✅ Seed data realista (replicar UX del frontend mockeado)
- ✅ Documentación (`.context/backend-setup.md`, `.context/api-documentation.md`)

**NO incluye:**
- ❌ Implementar TODAS las tablas del ERD completo
- ❌ Funcionalidad de negocio compleja
- ❌ Features específicas de cada story (eso es Fase 6)
- ❌ Configuración de múltiples ambientes (dev/staging/prod)

**Resultado:** Backend funcional + Frontend conectado a DB real + UX idéntica a mock pero con datos reales.

---

## 🚨 RESTRICCIONES CRÍTICAS

### ❌ NO HACER:
- **NO crear tablas que el frontend actual no usa** - Solo fundacionales
- **NO hardcodear valores del proyecto** - Leer del contexto
- **NO crear SQL scripts manuales** - Usar MCP de Supabase
- **NO proceder sin MCP de Supabase** - Es crítico
- **NO escribir código completo en el prompt** - Usar pseudocódigo + Context7
- **NO hacer commits automáticos** - Solo recomendar
- **NO usar código de ejemplos sin verificar versiones** - Consultar Context7 primero
- **NO crear archivos .env sin consultar al usuario** - Verificar estrategia primero
- **NO asumir nombres de paquetes o imports** - Verificar con Context7 MCP
- **NO sobrescribir trabajo sin verificar git status** - Revisar estado primero

### ✅ SÍ HACER:
- **Verificar herramientas necesarias** - MCP, CLI, credenciales, git
- **Leer contexto completo** - PRD, SRS, frontend existente
- **Usar Context7 MCP SIEMPRE** - Antes de instalar/usar cualquier dependencia
- **Verificar archivo de env existente** - .env, .env.local, .env.example
- **Centralizar configuración** - Crear archivo config para env vars
- **Analizar mock data del frontend** - Entender qué datos mostrar en DB
- **Crear solo tablas fundacionales** - Analizar qué usa el frontend
- **Optimizar con índices** - Queries rápidas desde el inicio
- **Aplicar RLS básico** - Seguridad desde el inicio
- **Generar tipados TypeScript** - Supabase CLI
- **Crear seed data realista** - Replicar UX del frontend mockeado
- **Documentar todo** - Backend setup + API endpoints
- **Validar integración** - Frontend conectado a DB real
- **Verificar versiones de Next.js y React** - Puede afectar el setup de Supabase

---

## 📦 FASE 0: VALIDACIONES & SETUP

**Objetivo:** Asegurar que todas las herramientas necesarias están disponibles.

### Paso 0.0: Verificar Estado de Git

**CRÍTICO - Evitar sobrescribir trabajo no guardado**

**Acción:**
```bash
git status
```

**Analizar output:**
1. **Si hay cambios sin commit:**
   - ADVERTIR al usuario claramente
   - Listar archivos modificados
   - **Preguntar:** "Tienes cambios sin commit. ¿Quieres continuar de todas formas?"
   - **Sugerir:** Hacer commit o `git stash` antes de continuar

2. **Si repo está limpio:**
   - Continuar sin avisos

3. **Si no es un repo git:**
   - Solo avisar (no es bloqueante)
   - Sugerir: `git init` si es un proyecto nuevo

**Output esperado:**
```
✅ Git status verificado
   - Estado: [limpio / cambios pendientes / no es repo git]
   - [Advertencias si aplican]
```

---

### Paso 0.1: Verificar MCP de Supabase

**CRÍTICO - Si no está disponible, DETENER TODO.**

**Acción:**
1. Intentar listar herramientas MCP disponibles
2. Buscar MCP de Supabase
3. Si NO está disponible:
   ```
   DETENER EJECUCIÓN

   ❌ MCP de Supabase NO disponible

   Este prompt requiere el MCP de Supabase para crear tablas, RLS, y gestionar la base de datos.

   Por favor:
   1. Configura el MCP de Supabase en tu entorno
   2. Reinicia y vuelve a ejecutar este prompt

   Documentación: [link a docs de MCP Supabase]
   ```

**Si está disponible:** Continuar.

---

### Paso 0.2: Solicitar PROJECT_ID de Supabase

**Pregunta:** "¿Cuál es tu Supabase Project ID?"

**Opciones:**
1. **Tengo un proyecto existente** → Pedir PROJECT_ID
2. **Necesito crear un proyecto nuevo** → Mostrar instrucciones

**Guardar PROJECT_ID para uso posterior.**

---

### Paso 0.3: Verificar Supabase CLI

**Acción:**
```bash
supabase --version
```

**Si NO está instalado:**
- Consultar Context7 para comando de instalación actualizado
- Preguntar: "¿Puedo instalarlo por ti?"
- Ejecutar instalación o mostrar instrucciones manuales

**Output:**
```
✅ Supabase CLI: v[version]
✅ MCP Supabase disponible
✅ Project ID: [project-id]
```

---

### Paso 0.4: Detectar Estrategia de Variables de Entorno

**CRÍTICO PARA EVITAR ERRORES**

**Acción:**
1. Verificar archivos existentes:
   ```bash
   ls -la | grep -E "^\.env"
   ```

2. Leer contenido de archivos encontrados

3. **Preguntar al usuario:**
   "Detecté [archivos]. ¿Cómo prefieres gestionar las variables de Supabase?"

   **Opciones:**
   - a) Usar `.env` existente
   - b) Usar `.env.local` (Next.js standard)
   - c) Archivo centralizado de configuración

4. Implementar estrategia elegida

**Output:**
```
✅ Estrategia: [elegida]
✅ Archivos a actualizar: [listar]
```

---

### Paso 0.5: Verificar Versiones del Stack

**CRÍTICO PARA COMPATIBILIDAD**

**Acción:**
1. Leer `package.json` → Next.js, React, TypeScript
2. Usar Context7 MCP:
   - Query: "Supabase auth Next.js [version] React [version] latest setup"
   - Identificar paquetes correctos según versiones

3. Documentar decisión:
   ```
   Versiones detectadas:
   - Next.js: [version]
   - React: [version]

   Paquetes a usar:
   - @supabase/ssr@[version] (verificado con Context7)
   - @supabase/supabase-js@[version]

   Razón: [explicar compatibilidad]
   ```

**Output:**
```
✅ Stack analizado
✅ Paquetes verificados con Context7
✅ Compatibilidad confirmada
```

---

## 📊 FASE 1: ANÁLISIS DE CONTEXTO

**Objetivo:** Comprender el proyecto y decidir qué tablas crear.

### Paso 1.1: Leer Documentación del Proyecto

**Archivos a leer:**
- `.context/SRS/architecture-specs.md` → ERD completo, tech stack
- `.context/SRS/functional-specs.md` → Requerimientos funcionales
- `.context/PRD/mvp-scope.md` → Funcionalidades principales
- `src/types/index.ts` → Tipos del dominio
- `src/app/**/page.tsx` → Páginas implementadas

**Qué identificar:**
1. **ERD del SRS:** Todas las tablas, relaciones, constraints
2. **Mock data en frontend:**
   - Buscar archivos como `lib/data.ts`, `mock/*.ts`, etc.
   - Analizar qué datos muestran las páginas
   - Identificar estructura de datos mockeados
3. **Tablas fundacionales:** Las que el frontend YA consume
4. **Roles de usuario:** Admin, user, vendor, etc.

**Output interno (no mostrar):**
- ERD completo
- Listado de mock data encontrado
- Tablas fundacionales a crear
- Estructura de seed data a replicar

---

### Paso 1.2: Consultar Documentación Oficial (Context7 MCP)

**OBLIGATORIO ANTES DE CUALQUIER IMPLEMENTACIÓN**

**Queries necesarias:**

1. "Supabase JavaScript client Next.js [version] App Router latest package"
2. "Supabase Auth Next.js [version] App Router setup authentication"
3. "Supabase Next.js [version] middleware authentication refresh session"
4. "Supabase Row Level Security policies best practices"
5. "Supabase CLI generate types TypeScript command"
6. "Next.js [version] environment variables best practices"
7. (Si Next.js 15+) "Next.js 15 cookies async breaking changes"

**IMPORTANTE:** NO escribir código hasta completar todas las queries.

**Output al usuario:**
```markdown
## 📚 Análisis Completado

### ERD Identificado:
- Tablas totales en SRS: [número]
- Tablas fundacionales a crear: [listar con razón]

Ejemplo:
- `profiles` - Requerida por: auth, /dashboard
- `mentors` - Requerida por: /mentors, MentorCard component

### Mock Data Detectado:
- Archivo: lib/data.ts
  - mockMentors: 8 registros
  - mockReviews: 15 registros
- Esta estructura se replicará en seed data

### Stack Técnico Verificado:
- Framework: Next.js [version] (App Router)
- Database: Supabase PostgreSQL
- Auth: Supabase Auth
- Client: @supabase/ssr@[version] (verificado con Context7)

### Decisiones:
- Paquete: @supabase/ssr (no auth-helpers - deprecado)
- Cookies: [async/sync según version]
- Env vars: [estrategia del paso 0.4]
```

---

## 🔧 FASE 1.5: INSTALACIÓN DE DEPENDENCIAS

**Objetivo:** Instalar paquetes correctos verificados con Context7.

### Paso 1.5.1: Verificar Dependencias Existentes

1. Leer `package.json` completo
2. Identificar conflictos:
   - ¿Existe `@supabase/auth-helpers-nextjs`? → Remover (deprecado)
   - ¿Existe `@supabase/supabase-js`? → Verificar versión

3. Mostrar plan:
   ```
   Plan de dependencias:

   A remover:
   - @supabase/auth-helpers-nextjs (deprecado)

   A instalar:
   - @supabase/ssr@[version]
   - @supabase/supabase-js@[version]
   ```

### Paso 1.5.2: Instalar

```bash
[package-manager] remove @supabase/auth-helpers-nextjs
[package-manager] add @supabase/ssr @supabase/supabase-js
```

**Validar:**
```bash
[package-manager] list | grep supabase
```

**Output:**
```
✅ @supabase/ssr@[version]
✅ @supabase/supabase-js@[version]
✅ Deprecados removidos
```

---

## 🏗️ FASE 2: DATABASE SCHEMA

**Objetivo:** Crear tablas fundacionales usando MCP de Supabase.

### Paso 2.1: Crear Tablas Fundacionales

**IMPORTANTE:** Usar MCP de Supabase, NO scripts SQL manuales.

**Para cada tabla fundacional:**

**Pseudocódigo:**
```
Para tabla [TABLE_NAME] del ERD:

  1. Preparar definición:
     - Nombre: [table_name] (snake_case)
     - Columnas: [según ERD + timestamps]
     - PK: id (uuid, gen_random_uuid())
     - FKs: [según relaciones]
     - Constraints: [unique, not null, defaults]

  2. Crear via MCP Supabase:
     MCP_CALL: create_table(definition)

  3. Validar creación:
     Verificar que tabla existe en Supabase
```

**Convenciones:**
- snake_case: `user_profiles`, `mentor_sessions`
- UUID para IDs: `gen_random_uuid()`
- Timestamps: `created_at TIMESTAMPTZ DEFAULT now()`
- Soft deletes (si aplica): `deleted_at TIMESTAMPTZ`

**Output por tabla:**
```
✅ Tabla `[table_name]` creada
   - Columnas: [número]
   - PKs: id
   - FKs: [listar]
   - Índices: [listar]
```

---

### Paso 2.1.5: Optimizar con Índices

**NUEVO - Para performance desde el inicio**

**Para cada tabla, considerar índices en:**
- Columnas de búsqueda frecuente (email, username, slug)
- Foreign keys (automático en algunos casos)
- Campos de ordenamiento (created_at, rating, price)
- Campos de filtrado (status, category, is_active)

**Pseudocódigo:**
```
Para cada tabla:
  Analizar queries esperadas del frontend

  SI columna usada en WHERE/ORDER BY frecuentemente:
    Crear índice: CREATE INDEX idx_[table]_[column] ON [table]([column])

  SI columna es FK:
    Verificar que índice existe (debería ser automático)

  Documentar: Qué índices se crearon y razón
```

**Output:**
```
✅ Índices optimizados:
   - profiles.email (búsquedas de login)
   - mentors.average_rating (ordenamiento)
   - sessions.user_id (FK + filtros)
```

---

### Paso 2.2: Configurar Row Level Security (RLS)

**Para cada tabla creada:**

**Pseudocódigo:**
```
1. Habilitar RLS:
   MCP_CALL: enable_rls([table_name])

2. Crear políticas según tipo de tabla:

   SI tabla_pública (catálogos, listados):
     POLICY: SELECT permitir a todos

   SI tabla_autenticada (perfiles, datos user):
     POLICY: SELECT solo autenticados
     POLICY: INSERT solo autenticados
     POLICY: UPDATE solo si user_id = auth.uid()
     POLICY: DELETE solo si user_id = auth.uid()

   SI tabla_admin (configuración, reportes):
     POLICY: SELECT solo si role = 'admin'
     POLICY: INSERT/UPDATE/DELETE solo admin

3. Validar políticas:
   Probar con query simulado
```

**Security Checklist:**
- [ ] ¿Users pueden leer datos ajenos? (Si no deben, política restrictiva)
- [ ] ¿Policies son lo más restrictivas posible?
- [ ] ¿Service role key nunca expuesto en frontend?

**Output:**
```
✅ RLS configurado en [table_name]
   - SELECT: [público/autenticado/propio]
   - INSERT: [descripción]
   - UPDATE: [descripción]
   - DELETE: [descripción]

🔒 Security verified:
   - Policies restrictivas aplicadas
   - No data leaks identificados
```

---

### Paso 2.3: Seed Data Inteligente

**CRÍTICO - Replicar UX del frontend mockeado**

**Objetivo:** Usuario debe ver la MISMA experiencia visual, pero con datos reales de DB.

**Acción:**

**Pseudocódigo:**
```
1. Analizar mock data del frontend:
   - Leer archivos de mock (lib/data.ts)
   - Identificar estructura de cada entidad
   - Contar cuántos registros existen
   - Analizar relaciones entre entidades

2. Preguntar al usuario:
   "Detecté [X] mentors, [Y] reviews en mock data.
    ¿Quieres crear seed data similar en la DB para replicar la UX?"

   Opciones:
   a) Sí, replicar mock data (recomendado)
   b) Crear mínimo (2-3 registros)
   c) No, dejar tablas vacías

3. SI usuario elige (a):
   Para cada entidad mockeada:
     - Crear registros similares (mismo número aprox)
     - Mantener tipos de datos (nombres realistas, ratings, etc.)
     - Preservar relaciones (FK válidos)
     - Usar datos creativos (NO copiar mock exacto, generar nuevos)

   Ejemplo:
   SI mockMentors tiene 8 registros con ratings 4.5-5.0:
     Crear 8 mentors en DB con ratings similares
     Nombres diferentes pero realistas
     Especialidades variadas como en mock

4. SI usuario elige (b):
   Crear 2-3 registros básicos por tabla
   Suficiente para validar queries

5. Insertar via MCP Supabase:
   Para cada registro:
     MCP_CALL: insert_row([table], [data])

6. Validar inserción:
   Query para confirmar datos en DB
```

**Output:**
```
✅ Seed data creado:
   - profiles: 10 registros (replicando mock)
   - mentors: 8 registros (similar a mockMentors)
   - reviews: 15 registros (vinculados a mentors)

📊 Datos generados:
   - Nombres realistas (no Lorem Ipsum)
   - Relaciones válidas (FKs correctos)
   - UX del frontend preservada

⚠️ Nota: Mock data del frontend puede removerse ahora
```

---

## 🔐 FASE 3: AUTH INTEGRATION

**Objetivo:** Reemplazar auth mock con Supabase Auth real.

### Paso 3.1: Configurar Supabase Auth

**En Supabase Dashboard (instrucciones al usuario):**
1. Verificar Email Auth habilitado
2. Configurar redirect URLs: `http://localhost:3000/**`
3. (Opcional) OAuth providers si PRD lo menciona

---

### Paso 3.2: Crear Archivo de Configuración Centralizado

**Archivo:** `src/lib/config.ts`

**Pseudocódigo:**
```
Crear archivo config que:
1. Importa process.env variables
2. Exporta constantes tipadas
3. Valida que variables requeridas existen
4. Lanza errores descriptivos si faltan
5. (Opcional) Log en desarrollo sin exponer secrets

Estructura:
- supabaseUrl: NEXT_PUBLIC_SUPABASE_URL
- supabaseAnonKey: NEXT_PUBLIC_SUPABASE_ANON_KEY
- supabaseServiceRoleKey: SUPABASE_SERVICE_ROLE_KEY (solo server)
- appUrl: NEXT_PUBLIC_APP_URL

Validaciones:
- throw Error si falta supabaseUrl
- throw Error si falta supabaseAnonKey
```

**Output:**
```
✅ Config creado: src/lib/config.ts
✅ Validaciones incluidas
✅ Type-safe exports
```

---

### Paso 3.3: Actualizar Archivos de Environment

**Según estrategia elegida en Paso 0.4:**

**Pseudocódigo:**
```
SI estrategia = "usar .env existente":
  Agregar variables a .env:
  - NEXT_PUBLIC_SUPABASE_URL=...
  - NEXT_PUBLIC_SUPABASE_ANON_KEY=...
  - SUPABASE_SERVICE_ROLE_KEY=...

SI estrategia = "usar .env.local":
  Crear/actualizar .env.local con variables

SIEMPRE:
  Actualizar .env.example con:
  - Instrucciones claras
  - URLs de donde obtener credenciales
  - Warnings de seguridad
  - Valores de ejemplo (placeholder)
```

**Mostrar al usuario:**
```
✅ Variables de entorno configuradas
   - Archivo: [.env / .env.local]
   - Template: .env.example actualizado

⚠️ ACCIÓN REQUERIDA:
   Agrega tus credenciales reales al archivo [.env]

   Obtener credenciales:
   1. https://supabase.com/dashboard/project/[PROJECT_ID]/settings/api
   2. Copiar: URL, anon key, service_role key
   3. Pegar en tu archivo de env
```

---

### Paso 3.4: Crear Supabase Clients

**USAR CÓDIGO VERIFICADO CON CONTEXT7**

**Archivos a crear:**

**1. Browser client:** `src/lib/supabase/client.ts`

**Pseudocódigo:**
```
Importar:
- createBrowserClient desde @supabase/ssr
- Database type desde @/types/supabase
- Config desde ../config

Exportar función createClient():
  Retornar: createBrowserClient<Database>(supabaseUrl, supabaseAnonKey)

NOTA: Verificar API con Context7 (puede cambiar según versión)
```

---

**2. Server client:** `src/lib/supabase/server.ts`

**Pseudocódigo (Next.js 15+ con async cookies):**
```
Importar:
- createServerClient desde @supabase/ssr
- cookies desde next/headers
- Database type, config

Exportar función createServer() async:
  cookieStore = await cookies()  // async en Next.js 15+

  Retornar createServerClient<Database>(url, key, {
    cookies: {
      getAll(): cookieStore.getAll(),
      setAll(cookies):
        try {
          cookies.forEach -> cookieStore.set()
        } catch {
          // Ignorar si llamado desde Server Component
        }
    }
  })

NOTA: Si Next.js 13-14, cookies() es sync (sin await)
```

---

**3. (Opcional) Admin client:** `src/lib/supabase/admin.ts`

**Pseudocódigo:**
```
Crear solo si necesario (bypass RLS)
Usar service_role key
Advertir: NUNCA usar en frontend
```

**Output:**
```
✅ Supabase clients creados:
   - client.ts (browser)
   - server.ts (server components)
   - [admin.ts] (opcional)
✅ Importan config centralizado
✅ Tipados con Database
```

---

### Paso 3.5: Crear Middleware

**Archivo:** `middleware.ts` (raíz)

**Pseudocódigo:**
```
Importar: createServerClient, NextResponse

Función middleware(req):
  1. Crear response inicial: NextResponse.next()

  2. Crear cliente Supabase con cookies del request:
     - getAll() desde req.cookies
     - setAll() actualiza req y response cookies

  3. Obtener sesión: supabase.auth.getSession()

  4. Definir rutas protegidas (del análisis de Fase 1):
     protectedRoutes = ['/dashboard', '/profile', ...]

  5. Lógica de redirect:
     SI no hay sesión Y ruta es protegida:
       Redirect a /login con param ?redirect=[ruta]

     SI hay sesión Y ruta es /login o /signup:
       Redirect a /dashboard

  6. Retornar response con cookies actualizadas

Config matcher:
  Excluir: _next/static, _next/image, favicon, assets
```

**Output:**
```
✅ Middleware creado
   - Refresh automático de sesión
   - Rutas protegidas: [listar]
   - Redirects configurados
```

---

### Paso 3.6: Actualizar AuthContext

**Archivo:** `src/contexts/auth-context.tsx`

**Pseudocódigo (NO código completo):**
```
Refactorizar AuthContext:

1. Importar createClient desde @/lib/supabase/client

2. Reemplazar localStorage con Supabase Auth:
   - login() → supabase.auth.signInWithPassword()
   - signup() → supabase.auth.signUp()
   - logout() → supabase.auth.signOut()

3. Sincronizar estado:
   useEffect(() => {
     supabase.auth.onAuthStateChange((event, session) => {
       SI session:
         Fetch profile desde DB
         Actualizar estado user
       SINO:
         setState(null)
     })
   })

4. Mantener misma API pública para componentes
5. Manejar errores apropiadamente
```

**Output:**
```
✅ AuthContext refactorizado
   - Usa Supabase Auth SDK
   - API compatible con componentes
   - Sincroniza con auth state
```

---

## 🌐 FASE 4: FRONTEND INTEGRATION

**Objetivo:** Conectar frontend con DB real, reemplazar mock data.

### Paso 4.1: Identificar Páginas con Mock Data

**Análisis:**
```
Buscar en codebase:
- Imports de mock data (import { mockMentors } from '@/lib/data')
- Archivos de datos (lib/data.ts, mock/*.ts)
- Componentes que consumen estos datos

Crear lista:
- Página X usa mockMentors
- Página Y usa mockReviews
- etc.
```

---

### Paso 4.2: Reemplazar Mock con DB Queries

**Para 1-2 páginas principales (no todas):**

**Pseudocódigo:**
```
Para página [PageName]:

1. Identificar mock data usada
2. Convertir a Server Component (si no lo es)
3. Refactor:

   ANTES:
   import { mockItems } from '@/lib/data'
   const items = mockItems

   DESPUÉS:
   import { createServer } from '@/lib/supabase/server'

   const supabase = await createServer()  // await si Next.js 15+
   const { data: items, error } = await supabase
     .from('[table_name]')
     .select('*')
     .order('created_at', { ascending: false })

   SI error:
     Manejar (mostrar mensaje, logging, etc.)

4. Validar UX:
   - Mismos datos visibles que con mock
   - Misma estructura de datos
   - Sin errores de tipos
```

**Output:**
```
✅ Páginas conectadas a DB:
   - /mentors: Consume tabla 'mentors'
   - /dashboard: Consume tabla 'profiles'
✅ Mock data removido de estas páginas
✅ UX idéntica a versión mockeada
```

---

## ✅ FASE 5: TIPADOS & VALIDACIÓN

**Objetivo:** Generar tipos TypeScript y validar integración.

### Paso 5.1: Generar Tipos de Supabase

**Comando (verificar con Context7):**
```bash
supabase gen types typescript --project-id [PROJECT_ID] > src/types/supabase.ts
```

**Validar:**
- Archivo creado
- Contiene tipos de todas las tablas
- No hay errores de sintaxis

**Explicar:**
```
✅ Tipados generados: src/types/supabase.ts

Contiene:
- Interfaces de tablas
- Tipos Row, Insert, Update
- Enums de DB
- Type-safety en queries

Uso:
import { Database } from '@/types/supabase'
type Mentor = Database['public']['Tables']['mentors']['Row']
```

---

### Paso 5.2: Validar TypeScript

```bash
[package-manager] run typecheck
# O: npx tsc --noEmit
```

**Verificar:**
- ✅ Sin errores TypeScript
- ✅ Imports correctos
- ✅ Config.ts valida

**Si errores:** Revisar y corregir.

---

### Paso 5.3: Validar Build Completo

```bash
[package-manager] run build
```

**Verificar:**
- ✅ Build exitoso
- ✅ Sin warnings de env vars
- ✅ Middleware compila
- ✅ Server Components OK

**Si errores:** Analizar, corregir, documentar.

**Output:**
```
✅ TypeScript validated
✅ Production build successful
✅ Ready for development
```

---

## 📚 FASE 6: DOCUMENTACIÓN

**Objetivo:** Documentar setup para el equipo.

### Paso 6.1: Crear backend-setup.md

**Archivo:** `.context/backend-setup.md`

**Contenido (estructura):**
```markdown
# Backend Setup - [Proyecto]

## Database Schema
[Tabla por tabla: propósito, columnas, relaciones, RLS]

## Authentication
[Provider, flujo, archivos clave]

## API Layer
[Paquetes, config, clients, uso]

## Variables de Entorno
[Estrategia, cómo obtenerlas, validación]

## Comandos Útiles
[Regenerar tipos, build, dev, etc.]

## Troubleshooting
[Errores comunes y soluciones]

## Próximos Pasos
[Features a implementar, sugerencias]
```

---

### Paso 6.2: Crear api-documentation.md

**Archivo:** `.context/api-documentation.md`

**Contenido:**
- Endpoints REST de Supabase
- Headers necesarios
- Ejemplos de requests
- Testing con Postman/Insomnia
- Recomendación: Usar cliente JS en lugar de fetch directo

---

### Paso 6.3: Actualizar .env.example

**Hacer archivo MUY descriptivo:**
```env
# =============================================================================
# Supabase Configuration
# =============================================================================
# Obtén credenciales en:
# https://supabase.com/dashboard/project/[PROJECT_ID]/settings/api
#
# IMPORTANTE:
# - Copia este archivo como .env (o .env.local)
# - Reemplaza valores placeholder
# - NUNCA commitees archivos .env con credenciales reales
# =============================================================================

NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGc...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGc... # ⚠️ SOLO servidor

NEXT_PUBLIC_APP_URL=http://localhost:3000

# =============================================================================
# Instrucciones:
# 1. cp .env.example .env
# 2. Ve a Supabase dashboard → Settings → API
# 3. Copia URL, anon key, service_role key
# 4. Reinicia dev server
# =============================================================================
```

---

## 🎉 FASE 7: REPORTE FINAL

### Paso 7.1: Resumen Ejecutivo

**Mostrar al usuario:**

```markdown
# 🎉 BACKEND SETUP COMPLETADO

## ✅ Lo Implementado

### 1. Database Schema
**Tablas creadas:** [número]
[Listar con propósito]

### 2. Row Level Security
- RLS habilitado
- Políticas configuradas
- Security validated

### 3. Authentication
- Supabase Auth con @supabase/ssr
- AuthContext refactorizado
- Middleware de protección

### 4. API Layer
- Clients configurados
- Config centralizado: src/lib/config.ts
- Frontend conectado a DB real

### 5. Seed Data
- [X] registros creados
- UX del frontend replicada
- Datos realistas

### 6. TypeScript
- Tipos generados: src/types/supabase.ts
- Build validated

### 7. Documentación
- .context/backend-setup.md
- .context/api-documentation.md
- .env.example actualizado

---

## 🚀 Próximos Pasos INMEDIATOS

### 1️⃣ Configurar Variables (AHORA)

```bash
cp .env.example .env  # (o .env.local)
```

Edita y agrega credenciales de:
https://supabase.com/dashboard/project/[PROJECT_ID]/settings/api

El archivo src/lib/config.ts validará automáticamente.

---

### 2️⃣ Probar Integración (AHORA)

```bash
[package-manager] run dev
```

**Checklist:**
1. ✅ App inicia sin errors de env
2. ✅ Signup funciona
3. ✅ Login funciona
4. ✅ Datos reales visibles en páginas
5. ✅ UX idéntica a versión mock
6. ✅ Logout funciona
7. ✅ Redirects de middleware funcionan

---

### 3️⃣ Verificar Database (RECOMENDADO)

1. https://supabase.com/dashboard/project/[PROJECT_ID]/editor
2. Ver tablas creadas
3. Ver seed data insertado
4. Verificar usuario en auth.users después de signup

---

### 4️⃣ Commit (RECOMENDADO)

```bash
git add .
git commit -m "feat: Supabase backend setup

- Database schema con [X] tablas
- RLS policies configuradas
- Auth integration con @supabase/ssr
- Middleware de rutas
- Config centralizado
- Seed data realista
- Frontend conectado a DB
- Documentación completa
"
```

---

## 💎 Valor Generado

**Antes:**
- ❌ Auth mock
- ❌ Datos hardcodeados
- ❌ Sin API real
- ❌ Sin DB

**Ahora:**
- ✅ Auth real (JWT, sessions)
- ✅ PostgreSQL con RLS
- ✅ API REST auto-generada
- ✅ Type-safety completo
- ✅ Config centralizado
- ✅ Dependencias actualizadas
- ✅ UX idéntica pero con DB real
- ✅ Lista para features

---

## 📚 Documentación

- .context/backend-setup.md
- .context/api-documentation.md
- .env.example
- src/lib/config.ts

---

## 🎯 Stack Final

- Next.js [version] (App Router)
- Supabase PostgreSQL
- @supabase/ssr@[version]
- TypeScript full type-safety

---

**🎊 Backend completado exitosamente!**

Ahora implementa features con:
- ✅ DB funcional
- ✅ Auth real
- ✅ API documentada
- ✅ Type-safety garantizado
```

---

## 🔄 VALIDACIONES FINALES (Checklist Interno)

**NO mostrar al usuario, uso interno:**

### Pre-ejecución:
- ✅ Git status verificado
- ✅ Supabase CLI instalado
- ✅ MCP Supabase disponible
- ✅ Context7 MCP disponible

### Backend:
- ✅ Tablas fundacionales creadas
- ✅ Índices optimizados
- ✅ RLS configurado
- ✅ Security validated
- ✅ Seed data realista

### Dependencias:
- ✅ Context7 consultado ANTES de instalar
- ✅ @supabase/ssr instalado (NO auth-helpers)
- ✅ Compatibilidad verificada
- ✅ Deprecados removidos

### Environment:
- ✅ Estrategia definida con usuario
- ✅ Config centralizado creado
- ✅ .env.example actualizado
- ✅ Validaciones funcionando

### Auth:
- ✅ Supabase Auth configurado
- ✅ AuthContext refactorizado
- ✅ Middleware con patrón actualizado

### API:
- ✅ Clients configurados
- ✅ Server client async (si Next.js 15+)
- ✅ Frontend conectado (1-2 páginas)
- ✅ Mock data reemplazado
- ✅ UX idéntica verificada

### Validaciones:
- ✅ TypeScript check passed
- ✅ Build passed
- ✅ Sin errors de env vars

### Documentación:
- ✅ backend-setup.md creado
- ✅ api-documentation.md creado
- ✅ .env.example descriptivo
- ✅ Troubleshooting incluido

---

## 📋 MEJORAS vs PROMPT ORIGINAL

### 🆕 Nuevas Fases:

1. **Paso 0.0** - Verificar git status (evitar sobrescribir)
2. **Paso 0.4** - Detectar estrategia env vars
3. **Paso 0.5** - Verificar versiones con Context7
4. **Fase 1.5** - Instalación verificada
5. **Paso 2.1.5** - Optimización con índices
6. **Paso 2.3 mejorado** - Seed data inteligente (replica mock UX)
7. **Fase 3.2** - Config centralizado
8. **Fase 3.3** - Actualizar env files
9. **Paso 5.3** - Validar full build

### 🔧 Correcciones Clave:

- ✅ Más pseudocódigo, menos código literal
- ✅ Condensado secciones repetitivas
- ✅ Verificación git obligatoria
- ✅ Estrategia env vars pregunta al usuario
- ✅ Context7 obligatorio antes de instalar
- ✅ @supabase/ssr verificado (no deprecado)
- ✅ Análisis inteligente de mock data
- ✅ Seed data replica UX del frontend
- ✅ Índices para performance
- ✅ Security checklist
- ✅ Validación completa de build

### 🚫 NO Incluido (según tus preferencias):

- ❌ Múltiples ambientes (demasiado complejo)
- ❌ Separar en múltiples prompts
- ❌ Preservar mock data (se reemplaza)
- ❌ Dependencias extra (faker.js, etc.)

---

**Resultado:** Prompt conciso, robusto, con pseudocódigo flexible, que evita errores comunes y genera setup completo en una ejecución.
