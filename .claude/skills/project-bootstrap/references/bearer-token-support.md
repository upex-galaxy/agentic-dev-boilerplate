Actúa como Senior Backend Developer, API Security Expert, y Next.js Expert.

---

## 🎯 TAREA

**🔧 FEATURE: Bearer Token Support for API Routes (Fase 3 - Infrastructure)**

Agregar soporte de **autenticación Bearer Token** a las API routes de Next.js para permitir:

- Testing de APIs desde Postman, Insomnia, curl
- Integración con clientes externos (mobile apps, third-party services)
- Compatibilidad con flujos de autenticación estándar OAuth/JWT

**Mantiene compatibilidad** con la autenticación por cookies existente (browser).

---

## 📥 INPUT REQUERIDO

### 1. Contexto del Proyecto

**Leer estos archivos:**

- `CLAUDE.md` - Supabase Project ID y stack tecnológico
- `src/lib/supabase/server.ts` - Server client actual
- `src/app/api/` - Endpoints existentes
- `src/lib/config.ts` - Configuración de Supabase

### 2. Información a Extraer

- **Supabase URL** → Para crear cliente con token
- **Anon Key** → Para autenticación
- **Endpoints existentes** → Para actualizarlos

---

## ⚙️ VERIFICACIÓN DE HERRAMIENTAS

### MCP Requeridos:

1. **MCP Context7** - Para verificar APIs de Supabase/Next.js

### Dependencias Requeridas (verificar):

- `@supabase/supabase-js` - Para crear cliente con token
- `@supabase/ssr` - Para cliente SSR existente

---

## 🔀 DETECCIÓN DE MODO

**Ejecutar análisis para determinar estado actual:**

```bash
# Verificar si ya existe soporte Bearer Token
grep -r "createServerFromRequest\|Authorization.*Bearer" src/lib/supabase/ src/app/api/ 2>/dev/null

# Contar endpoints que usan createServer
grep -r "createServer()" src/app/api/ --include="*.ts" | wc -l

# Verificar estructura de server.ts
cat src/lib/supabase/server.ts | head -20
```

**Resultado:**

| Condición                              | Modo                |
| -------------------------------------- | ------------------- |
| Ya existe `createServerFromRequest`    | **YA IMPLEMENTADO** |
| Solo existe `createServer` (cookies)   | **IMPLEMENTAR**     |
| No existe `src/lib/supabase/server.ts` | **CREAR TODO**      |

---

## 📤 OUTPUT GENERADO

### Archivos Modificados/Creados:

**Core (`src/lib/supabase/`):**

- ✅ `server.ts` - Agregar `createServerFromRequest()` con soporte dual

**API Routes (`src/app/api/`):**

- ✅ Todos los endpoints protegidos actualizados para usar `createServerFromRequest`

**Documentación (si existe `api-docu`):**

- ✅ `auth-info-panel.tsx` actualizado con guía de Bearer Token

---

## 🛠️ PASOS DETALLADOS

### FASE 0: Análisis del Proyecto

**Paso 0.1: Verificar estado actual**

```bash
# Verificar si ya existe soporte
grep -l "createServerFromRequest" src/lib/supabase/server.ts 2>/dev/null && echo "✅ Ya tiene soporte" || echo "❌ Necesita implementación"
```

**Paso 0.2: Listar endpoints a actualizar**

```bash
# Encontrar todos los endpoints que usan createServer
grep -rl "await createServer()" src/app/api/ --include="*.ts"
```

**Paso 0.3: Verificar configuración de Supabase**

```bash
# Verificar que existen las variables necesarias
cat src/lib/config.ts | grep -E "supabaseUrl|supabaseAnonKey"
```

---

### FASE 1: Modificar `server.ts`

**Paso 1.1: Agregar import de `createClient`**

Si no existe, agregar al inicio del archivo:

```typescript
import { createClient } from '@supabase/supabase-js';
```

**Paso 1.2: Agregar función `createServerFromRequest`**

Agregar después de la función `createServer()` existente:

```typescript
/**
 * Creates a Supabase client from a Request object, supporting both:
 * - Bearer token authentication (Authorization header)
 * - Cookie-based authentication (default SSR behavior)
 *
 * This is useful for API routes that need to support external clients
 * (Postman, mobile apps, third-party integrations) via Bearer tokens,
 * while still working with browser requests that use cookies.
 *
 * @example
 * // Route Handler with dual auth support
 * import { createServerFromRequest } from '@/lib/supabase/server'
 *
 * export async function GET(request: Request) {
 *   const supabase = await createServerFromRequest(request)
 *   const { data: { user } } = await supabase.auth.getUser()
 *   // ...
 * }
 *
 * @example
 * // Postman request with Bearer token
 * // GET /api/clients
 * // Authorization: Bearer eyJhbGciOiJIUzI1NiIs...
 */
export async function createServerFromRequest(request: Request) {
  const authHeader = request.headers.get('Authorization');

  // If Bearer token is provided, use it directly
  if (authHeader?.startsWith('Bearer ')) {
    const accessToken = authHeader.slice(7); // Remove "Bearer " prefix

    return createClient<Database>(supabaseUrl, supabaseAnonKey, {
      global: {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      },
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });
  }

  // Fallback to cookie-based authentication
  return createServer();
}
```

**IMPORTANTE:** Asegurarse de que:

- `Database` type está importado de `@/types/supabase`
- `supabaseUrl` y `supabaseAnonKey` están disponibles desde config

---

### FASE 2: Actualizar API Routes

**Paso 2.1: Identificar patrón de actualización**

Por cada endpoint protegido, cambiar:

```typescript
// ANTES
import { createServer } from '@/lib/supabase/server';

export async function GET() {
  const supabase = await createServer();
  // ...
}

// DESPUÉS
import { createServerFromRequest } from '@/lib/supabase/server';

export async function GET(request: Request) {
  const supabase = await createServerFromRequest(request);
  // ...
}
```

**Paso 2.2: Casos especiales**

Para handlers que ignoraban el request (`_request`):

```typescript
// ANTES
export async function GET(_request: Request) {
  const supabase = await createServer();

// DESPUÉS
export async function GET(request: Request) {
  const supabase = await createServerFromRequest(request);
```

Para handlers con `context` (rutas dinámicas):

```typescript
// ANTES
export async function GET(
  _request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const supabase = await createServer();

// DESPUÉS
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const supabase = await createServerFromRequest(request);
```

**Paso 2.3: NO actualizar endpoints públicos**

Endpoints que NO requieren autenticación NO necesitan cambios:

- `/api/health` - Health check público
- `/api/openapi` - Spec OpenAPI público
- `/api/auth/forgot-password` - Flujo de reset password

---

### FASE 3: (Opcional) Actualizar Documentación

**Solo si existe `/api-docu`.**

**Paso 3.1: Verificar existencia**

```bash
ls src/app/**/api-docu/auth-info-panel.tsx 2>/dev/null
```

**Paso 3.2: Actualizar `auth-info-panel.tsx`**

Si existe, agregar sección de Bearer Token con:

1. **Flujo de autenticación** - Diagrama ASCII mostrando:
   - POST a Supabase Auth para obtener token
   - Usar token en header Authorization

2. **Paso a paso** - Instrucciones claras:
   - URL del endpoint de login de Supabase
   - Headers requeridos (apikey, Content-Type)
   - Body con email/password
   - Cómo usar el access_token obtenido

3. **Ejemplos copiables** - Botones de copiar para:
   - URL de login
   - Headers
   - Body JSON
   - cURL de ejemplo

4. **Lista de endpoints** - Todos los endpoints protegidos

5. **Info de expiración** - Token expira en 1 hora, cómo renovar

---

### FASE 4: Validación

**Paso 4.1: TypeScript check**

```bash
bun run typecheck
```

**Paso 4.2: Lint check**

```bash
bun run lint
```

**Paso 4.3: Test manual (opcional)**

```bash
# 1. Obtener token
curl -X POST "https://[PROJECT_ID].supabase.co/auth/v1/token?grant_type=password" \
  -H "apikey: [ANON_KEY]" \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password"}'

# 2. Usar token
curl "http://localhost:3000/api/[endpoint]" \
  -H "Authorization: Bearer [ACCESS_TOKEN]"
```

---

## 📋 CHECKLIST FINAL

### Implementación Core:

- [ ] `createServerFromRequest()` agregado a `server.ts`
- [ ] Import de `createClient` agregado
- [ ] Tipos correctamente referenciados

### API Routes:

- [ ] Todos los endpoints protegidos actualizados
- [ ] Import cambiado de `createServer` a `createServerFromRequest`
- [ ] Parámetro `request` usado (no `_request`)

### Validación:

- [ ] `bun run typecheck` pasa
- [ ] `bun run lint` pasa sin nuevos errores
- [ ] Endpoints siguen funcionando con cookies (browser)
- [ ] Endpoints funcionan con Bearer token (Postman)

### Documentación (si aplica):

- [ ] `auth-info-panel.tsx` actualizado
- [ ] Guía de Bearer Token visible en `/api-docu`

---

## 🎉 REPORTE FINAL

```markdown
# ✅ Bearer Token Support Implementado

## Archivos Modificados:

### Core:

- src/lib/supabase/server.ts (nueva función createServerFromRequest)

### API Routes Actualizados:

[Listar todos los archivos modificados]

### Documentación:

- src/app/(minimal)/api-docu/auth-info-panel.tsx (si existe)

## Cómo Usar:

### 1. Obtener Token:

POST https://[PROJECT_ID].supabase.co/auth/v1/token?grant_type=password
Headers:

- apikey: [ANON_KEY]
- Content-Type: application/json
  Body:
  {"email": "...", "password": "..."}

### 2. Usar Token:

GET /api/[endpoint]
Headers:

- Authorization: Bearer [access_token]

## Compatibilidad:

- ✅ Browser (cookies) - Sigue funcionando igual
- ✅ Postman (Bearer token) - Nuevo soporte
- ✅ Mobile apps (Bearer token) - Nuevo soporte
- ✅ Third-party integrations (Bearer token) - Nuevo soporte

## Notas:

- Token expira en 1 hora (3600 segundos)
- Múltiples tokens pueden coexistir
- Para renovar, usar refresh_token con grant_type=refresh_token
```

---

## ❓ PREGUNTAS FRECUENTES

**P: ¿Esto rompe la autenticación existente por cookies?**
R: No. La función detecta si hay Bearer token; si no lo hay, usa cookies automáticamente.

**P: ¿Necesito modificar el middleware?**
R: No. El middleware sigue manejando la protección de páginas con cookies. Los API routes manejan su propia autenticación.

**P: ¿Funciona con Row Level Security (RLS)?**
R: Sí. El cliente creado con Bearer token tiene el mismo `user_id` que con cookies, y RLS se aplica igual.

**P: ¿Qué pasa si el token expira?**
R: El endpoint retorna 401 Unauthorized. El cliente debe obtener un nuevo token.

**P: ¿Puedo usar este token para el API de Supabase directamente?**
R: Sí. El mismo `access_token` funciona para:

- Next.js API routes (con Bearer header)
- Supabase REST API (con Authorization header + apikey)
- Supabase Realtime

**P: ¿Cómo obtengo el token sin usar la UI?**
R: POST a `/auth/v1/token?grant_type=password` con email/password. Ver sección de validación.

---

## 🔗 INTEGRACIÓN CON OTROS FEATURES

### Con `api-routes-setup`:

Este feature complementa `api-routes-setup`. Si ejecutas primero `api-routes-setup`, luego puedes ejecutar este para agregar Bearer token support.

### Con `openapi-setup`:

Si tienes `/api-docu` configurado, este feature actualiza el `auth-info-panel` con la documentación de Bearer token.

### Con `supabase-types-setup`:

Los tipos de `Database` deben estar disponibles en `@/types/supabase` para el typing correcto.

---

## 📝 NOTAS PARA LA IA

1. **Detectar estado actual** antes de modificar. Si ya existe `createServerFromRequest`, reportar que ya está implementado.

2. **No modificar endpoints públicos** como health checks o endpoints de autenticación que deben ser accesibles sin token.

3. **Preservar funcionalidad existente**. El fallback a cookies es crítico para que el browser siga funcionando.

4. **Documentar cambios**. Si existe `/api-docu`, actualizar la documentación es parte del feature.

5. **Usar el request parameter**. Cambiar `_request` a `request` en los handlers es necesario para pasar el header.
