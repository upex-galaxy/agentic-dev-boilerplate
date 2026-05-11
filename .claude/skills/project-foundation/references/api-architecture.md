# API Architecture Generator

Actúa como **Solutions Architect** y **API Documentation Specialist**.

---

## MISIÓN

Tu objetivo es **DOCUMENTAR COMPLETAMENTE** la arquitectura de APIs del proyecto y generar un **mapa visual y técnico** que explique:

- Todos los endpoints disponibles (REST API + Custom Routes)
- La estructura de autenticación y autorización
- Cómo testear cada endpoint manualmente
- Los flujos de datos complejos entre servicios
- Tabla resumen para QA testing

**Filosofía:**

- **Visual primero:** Usa diagramas ASCII para que sea fácil de comprender
- **Agnóstico de stack:** Detecta cualquier framework (Next.js, Express, FastAPI, Django, NestJS)
- **Orientado a testing:** Cada endpoint con ejemplos de cómo probarlo
- **No duplicar:** Si existe `business-data-map.md`, referencia flujos de negocio
- **Mantenible:** Patrón CREATE/UPDATE para mantener sincronizado

**Output:** `.context/discovery/api-architecture.md`

---

## FASE 0: DISCOVERY

### 0.1 Detectar Configuración

**Identifica automáticamente:**

1. **System Prompt del proyecto:**
   - Buscar: `CLAUDE.md`, `GEMINI.md`, `CURSOR.md`, `COPILOT.md`, `.ai-instructions.md`
   - Guardar nombre para actualización posterior

2. **Nombre y propósito del proyecto:**
   - Leer: `package.json`, `README.md`, `pyproject.toml`, `setup.py`
   - Extraer descripción del sistema

3. **MCP de base de datos disponible:**
   - Detectar qué herramientas tienes para explorar la DB
   - Usar para comprender esquema si es necesario

4. **Documentación existente:**
   - Buscar: `.context/discovery/business-data-map.md` (flujos de negocio)
   - Buscar: `.context/SRS/` (especificaciones técnicas)
   - Buscar: `.context/api-auth.md` (documentación de auth existente)

### 0.2 Detectar Stack Type

**Analiza el proyecto para determinar el framework:**

| Stack                    | Detección                            | Patrón de Endpoints                                                 | Ubicación Típica                  |
| ------------------------ | ------------------------------------ | ------------------------------------------------------------------- | --------------------------------- |
| **Next.js App Router**   | `next.config.*` + `src/app/api/`     | `export async function GET\|POST\|PUT\|PATCH\|DELETE` en `route.ts` | `src/app/api/[domain]/route.ts`   |
| **Next.js Pages Router** | `pages/api/`                         | `export default handler`                                            | `pages/api/[domain].ts`           |
| **Express**              | `express` en package.json            | `router.get\|post\|put\|delete(...)`                                | `routes/*.js` o `src/routes/*.ts` |
| **FastAPI**              | `fastapi` imports en `.py`           | `@app.get\|post\|put\|delete(...)`                                  | `main.py` o `app/*.py`            |
| **Django**               | `manage.py` + `urls.py`              | `path()` patterns                                                   | `urls.py` + `views.py`            |
| **NestJS**               | `nest-cli.json`                      | `@Get\|Post\|Put\|Delete()` decorators                              | `*.controller.ts`                 |
| **Supabase Only**        | Sin API custom, solo Supabase client | REST API auto-generada                                              | N/A (PostgREST)                   |

**Ejecutar detección:**

```
1. Buscar archivos de configuración (next.config.*, nest-cli.json, manage.py)
2. Buscar patrones en package.json (express, fastapi, @nestjs)
3. Buscar carpetas API (src/app/api, pages/api, routes)
4. Determinar si hay API custom o solo Supabase REST
```

### 0.3 Detectar Modo

```
¿Existe .context/discovery/api-architecture.md?
  → SÍ: Modo UPDATE (mostrar diff, pedir confirmación)
  → NO: Modo CREATE (generar desde cero)
```

---

## FASE 1: EXPLORACIÓN

### 1.1 Encontrar Todos los Endpoints

**Para cada stack detectado:**

#### Next.js App Router:

```bash
# Buscar todas las rutas API
find src/app/api -name "route.ts" -o -name "route.js"

# Analizar cada archivo para encontrar métodos exportados
# GET, POST, PUT, PATCH, DELETE
```

#### Next.js Pages Router:

```bash
# Buscar todas las rutas API
find pages/api -name "*.ts" -o -name "*.js"
```

#### Express:

```bash
# Buscar definiciones de rutas
grep -r "router\.\(get\|post\|put\|patch\|delete\)" --include="*.js" --include="*.ts"
```

#### FastAPI:

```bash
# Buscar decoradores de endpoint
grep -r "@app\.\(get\|post\|put\|patch\|delete\)" --include="*.py"
```

**Para cada endpoint encontrado, extraer:**

- Ruta completa (ej: `/api/users/[id]`)
- Método HTTP (GET, POST, PUT, PATCH, DELETE)
- Parámetros de ruta (ej: `[id]`, `[slug]`)
- Query params si los hay
- Request body schema (si aplica)
- Response schema esperado
- Autenticación requerida (detectar middleware, guards)

---

### 1.2 Analizar Autenticación

**Detectar sistema de auth:**

1. **Supabase Auth:**
   - Buscar: `createClient`, `supabase.auth`, `getUser()`
   - Middleware: Verificar `supabase.auth.getUser()` antes de operaciones

2. **NextAuth.js:**
   - Buscar: `getServerSession`, `useSession`, `authOptions`
   - Middleware: `middleware.ts` con `withAuth`

3. **JWT Custom:**
   - Buscar: `jsonwebtoken`, `jwt.verify`, `Authorization: Bearer`

4. **API Keys:**
   - Buscar: Headers custom (`x-api-key`, etc.)

**Clasificar endpoints por nivel de acceso:**

| Nivel          | Descripción         | Ejemplo de Verificación        |
| -------------- | ------------------- | ------------------------------ |
| **Public**     | Sin autenticación   | Ninguna verificación           |
| **Protected**  | Usuario autenticado | `session?.user` exists         |
| **Role-Based** | Rol específico      | `user.role === 'admin'`        |
| **Owner**      | Dueño del recurso   | `resource.user_id === user.id` |

---

### 1.3 Identificar Servicios Externos

**Buscar integraciones:**

- **Pagos:** Stripe, MercadoPago, PayPal
- **Email:** Resend, SendGrid, Postmark
- **Storage:** Supabase Storage, AWS S3, Cloudinary
- **AI:** OpenAI, Anthropic, Replicate
- **Analytics:** Mixpanel, Amplitude, PostHog

**Para cada servicio, documentar:**

- Qué endpoints lo usan
- Webhooks recibidos
- Formato de datos intercambiados

---

### 1.4 Mapear Conexiones de DB

**Identificar:**

- ¿Qué endpoints leen de qué tablas?
- ¿Qué endpoints escriben a qué tablas?
- ¿Hay operaciones que cruzan múltiples tablas?

**Si existe `.context/discovery/business-data-map.md`, referenciar** en lugar de duplicar.

---

## FASE 2: GENERACIÓN DEL DOCUMENTO

### Genera: `.context/discovery/api-architecture.md`

El documento debe ser **VISUAL** y orientado a **TESTING**. Usa diagramas ASCII extensivamente.

---

### ESTRUCTURA DEL OUTPUT

```markdown
# API Architecture: [Nombre del Proyecto]

╔══════════════════════════════════════════════════════════════════════════════╗
║ [NOMBRE] - API ARCHITECTURE MAP ║
║ Stack: [Stack detectado] | Endpoints: [N total] ║
╚══════════════════════════════════════════════════════════════════════════════╝
```

---

#### 1. RESUMEN EJECUTIVO

```markdown
┌──────────────────────────────────────────────────────────────────────────────┐
│ 📋 RESUMEN EJECUTIVO │
└──────────────────────────────────────────────────────────────────────────────┘

## Stack Tecnológico

| Componente | Tecnología                            |
| ---------- | ------------------------------------- |
| Framework  | [Next.js App Router / Express / etc.] |
| Database   | [Supabase / PostgreSQL / etc.]        |
| Auth       | [Supabase Auth / NextAuth / etc.]     |
| Hosting    | [Vercel / Railway / etc.]             |

## Estadísticas de Endpoints

| Categoría       | Cantidad |
| --------------- | -------- |
| Total Endpoints | N        |
| Public          | N        |
| Protected       | N        |
| Admin Only      | N        |

## Base URLs

| Ambiente   | URL                               |
| ---------- | --------------------------------- |
| Local      | `http://localhost:3000/api`       |
| Staging    | `https://staging.example.com/api` |
| Production | `https://example.com/api`         |
```

---

#### 2. ARQUITECTURA COMPLETA

```markdown
┌──────────────────────────────────────────────────────────────────────────────┐
│ 🏗️ ARQUITECTURA COMPLETA │
└──────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│ FLUJO DE REQUEST │
│─────────────────────────────────────────────────────────────────────────────│
│ │
│ ┌──────────┐ Request ┌────────────────────────────────────────────┐ │
│ │ Client │ ────────────► │ API LAYER │ │
│ │ (Browser)│ │ ┌────────────────────────────────────────┐ │ │
│ └──────────┘ │ │ Middleware (Auth, Validation, CORS) │ │ │
│ ▲ │ └───────────────────┬────────────────────┘ │ │
│ │ │ │ │ │
│ │ │ ┌───────────────────▼────────────────────┐ │ │
│ │ │ │ Route Handlers │ │ │
│ │ │ │ ┌─────────┐ ┌─────────┐ ┌─────────┐ │ │ │
│ │ Response │ │ │/api/auth│ │/api/user│ │/api/... │ │ │ │
│ │ │ │ └────┬────┘ └────┬────┘ └────┬────┘ │ │ │
│ │ │ └──────┼───────────┼───────────┼────────┘ │ │
│ │ └────────┼───────────┼───────────┼──────────┘ │
│ │ │ │ │ │
│ │ ▼ ▼ ▼ │
│ │ ┌────────────────────────────────────────────┐│
│ │ │ DATA LAYER ││
│ │ │ ┌──────────────┐ ┌───────────────────┐ ││
│ │ │ │ Supabase │ │ External Services │ ││
│ │ │ │ (PostgreSQL) │ │ (Stripe, Resend) │ ││
│ └─────────────────────│ └──────────────┘ └───────────────────┘ ││
│ └────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────────────────────────┘
```

---

#### 3. CATÁLOGO DE ENDPOINTS

```markdown
┌──────────────────────────────────────────────────────────────────────────────┐
│ 📡 CATÁLOGO DE ENDPOINTS │
└──────────────────────────────────────────────────────────────────────────────┘

═══════════════════════════════════════════════════════════════════════════════
DOMINIO: [Domain Name] (ej: Authentication)
═══════════════════════════════════════════════════════════════════════════════

┌────────┬────────────────────────┬──────────────────┬─────────────────────────┐
│ Método │ Endpoint │ Auth │ Descripción │
├────────┼────────────────────────┼──────────────────┼─────────────────────────┤
│ POST │ /api/auth/signup │ 🔓 Public │ Registro de usuario │
│ POST │ /api/auth/login │ 🔓 Public │ Iniciar sesión │
│ POST │ /api/auth/logout │ 🔐 Protected │ Cerrar sesión │
│ GET │ /api/auth/me │ 🔐 Protected │ Obtener usuario actual │
│ POST │ /api/auth/refresh │ 🔐 Protected │ Refrescar token │
└────────┴────────────────────────┴──────────────────┴─────────────────────────┘

**Leyenda:**

- 🔓 Public: Sin autenticación requerida
- 🔐 Protected: Requiere usuario autenticado
- 👑 Admin: Requiere rol administrador
- 👤 Owner: Requiere ser dueño del recurso

═══════════════════════════════════════════════════════════════════════════════
DOMINIO: [Otro Domain]
═══════════════════════════════════════════════════════════════════════════════

[Repetir estructura para cada dominio...]
```

---

#### 4. DETALLE DE ENDPOINTS POR DOMINIO

Para cada dominio, documentar cada endpoint con:

````markdown
### [DOMAIN]: [Endpoint Name]

**Endpoint:** `[METHOD] /api/[path]`

**Autenticación:** [Public | Protected | Admin | Owner]

**Request:**

```[json/typescript]
// Headers
{
  "Authorization": "Bearer <token>",
  "Content-Type": "application/json"
}

// Body (si aplica)
{
  "field1": "value",
  "field2": "value"
}
```
````

**Response:**

```[json]
// 200 OK
{
  "data": { ... },
  "message": "Success"
}

// 400 Bad Request
{
  "error": "Validation error",
  "details": [...]
}

// 401 Unauthorized
{
  "error": "Unauthorized"
}
```

**Ejemplo cURL:**

```bash
curl -X [METHOD] \
  'http://localhost:3000/api/[path]' \
  -H 'Authorization: Bearer <token>' \
  -H 'Content-Type: application/json' \
  -d '{
    "field1": "value"
  }'
```

````

---

#### 5. AUTENTICACIÓN POR TIPO

```markdown
┌──────────────────────────────────────────────────────────────────────────────┐
│ 🔐 AUTENTICACIÓN POR TIPO                                                    │
└──────────────────────────────────────────────────────────────────────────────┘

## 🔓 ENDPOINTS PÚBLICOS (sin auth)

Estos endpoints no requieren autenticación:

| Endpoint | Propósito |
|----------|-----------|
| `POST /api/auth/signup` | Registro de nuevos usuarios |
| `POST /api/auth/login` | Inicio de sesión |
| `GET /api/public/[...]` | Datos públicos |

**Cómo testear:**
```bash
# No requiere headers de auth
curl 'http://localhost:3000/api/auth/signup' \
  -H 'Content-Type: application/json' \
  -d '{"email":"test@test.com","password":"Test123!"}'
````

---

## 🔐 ENDPOINTS PROTEGIDOS (usuario autenticado)

Estos endpoints requieren un usuario autenticado:

| Endpoint              | Propósito                        |
| --------------------- | -------------------------------- |
| `GET /api/auth/me`    | Obtener datos del usuario actual |
| `PUT /api/profile`    | Actualizar perfil                |
| `GET /api/[resource]` | Listar recursos del usuario      |

**Cómo obtener token:**

```bash
# 1. Login para obtener token
TOKEN=$(curl -s 'http://localhost:3000/api/auth/login' \
  -H 'Content-Type: application/json' \
  -d '{"email":"test@test.com","password":"Test123!"}' \
  | jq -r '.token')

# 2. Usar token en requests
curl 'http://localhost:3000/api/auth/me' \
  -H "Authorization: Bearer $TOKEN"
```

---

## 👑 ENDPOINTS DE ADMIN (rol admin)

Estos endpoints requieren rol de administrador:

| Endpoint                       | Propósito                 |
| ------------------------------ | ------------------------- |
| `GET /api/admin/users`         | Listar todos los usuarios |
| `DELETE /api/admin/users/[id]` | Eliminar usuario          |

**Verificación de rol:**

```typescript
// El endpoint verifica:
if (user.role !== 'admin') {
  return { error: 'Forbidden', status: 403 };
}
```

---

## 👤 ENDPOINTS OWNER (dueño del recurso)

Estos endpoints verifican propiedad del recurso:

| Endpoint                 | Verificación               |
| ------------------------ | -------------------------- |
| `PUT /api/posts/[id]`    | `post.user_id === user.id` |
| `DELETE /api/posts/[id]` | `post.user_id === user.id` |

**Verificación de ownership:**

```typescript
// El endpoint verifica:
const post = await getPost(id);
if (post.user_id !== user.id) {
  return { error: 'Forbidden', status: 403 };
}
```

````

---

#### 6. GUÍA DE TESTING

```markdown
┌──────────────────────────────────────────────────────────────────────────────┐
│ 🧪 GUÍA DE TESTING                                                           │
└──────────────────────────────────────────────────────────────────────────────┘

## 1. Testing con Browser DevTools

### Obtener Token de Sesión

1. Abrir DevTools (F12)
2. Ir a **Application** → **Cookies** o **Local Storage**
3. Buscar: `sb-access-token` (Supabase) o `next-auth.session-token` (NextAuth)

### Hacer Request desde Console

```javascript
// GET request con auth
fetch('/api/resource', {
  headers: {
    'Authorization': `Bearer ${localStorage.getItem('sb-access-token')}`
  }
}).then(r => r.json()).then(console.log)

// POST request con body
fetch('/api/resource', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${localStorage.getItem('sb-access-token')}`
  },
  body: JSON.stringify({ field: 'value' })
}).then(r => r.json()).then(console.log)
````

---

## 2. Testing con Postman

### Setup de Environment

```json
{
  "name": "[Project] Local",
  "values": [
    { "key": "base_url", "value": "http://localhost:3000" },
    { "key": "token", "value": "" }
  ]
}
```

### Collection Recomendada

```
📁 [Project] API
├── 📁 Auth
│   ├── POST Signup
│   ├── POST Login (guarda token en variable)
│   ├── GET Me
│   └── POST Logout
├── 📁 [Domain 1]
│   ├── GET List
│   ├── GET By ID
│   ├── POST Create
│   ├── PUT Update
│   └── DELETE Remove
└── 📁 [Domain 2]
    └── ...
```

### Script de Pre-request (Auth automático)

```javascript
// En la collection, tab "Pre-request Script"
if (pm.environment.get('token')) {
  pm.request.headers.add({
    key: 'Authorization',
    value: 'Bearer ' + pm.environment.get('token'),
  });
}
```

---

## 3. Testing con cURL

### Flujo Completo de Testing

```bash
# Variables de ambiente
export BASE_URL="http://localhost:3000"
export EMAIL="test@example.com"
export PASSWORD="Test123!"

# 1. Signup (si no existe usuario)
curl -X POST "$BASE_URL/api/auth/signup" \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"$EMAIL\",\"password\":\"$PASSWORD\"}"

# 2. Login y guardar token
export TOKEN=$(curl -s -X POST "$BASE_URL/api/auth/login" \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"$EMAIL\",\"password\":\"$PASSWORD\"}" \
  | jq -r '.access_token')

# 3. Verificar autenticación
curl "$BASE_URL/api/auth/me" \
  -H "Authorization: Bearer $TOKEN"

# 4. Usar en cualquier endpoint protegido
curl "$BASE_URL/api/[resource]" \
  -H "Authorization: Bearer $TOKEN"
```

---

## 4. Testing con Playwright (E2E)

```typescript
import { test, expect } from '@playwright/test';

// Helper para autenticación
async function getAuthToken(email: string, password: string) {
  const response = await fetch('http://localhost:3000/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  const data = await response.json();
  return data.access_token;
}

test.describe('API Tests', () => {
  let token: string;

  test.beforeAll(async () => {
    token = await getAuthToken('test@test.com', 'Test123!');
  });

  test('GET /api/resource returns data', async ({ request }) => {
    const response = await request.get('/api/resource', {
      headers: { Authorization: `Bearer ${token}` },
    });
    expect(response.ok()).toBeTruthy();
    const data = await response.json();
    expect(data).toHaveProperty('items');
  });
});
```

````

---

#### 7. FLUJOS DE DATOS COMPLEJOS

```markdown
┌──────────────────────────────────────────────────────────────────────────────┐
│ 🔄 FLUJOS DE DATOS COMPLEJOS                                                 │
└──────────────────────────────────────────────────────────────────────────────┘

═══════════════════════════════════════════════════════════════════════════════
FLUJO: [Nombre del Flujo] (ej: Proceso de Checkout)
═══════════════════════════════════════════════════════════════════════════════

┌─────────────────────────────────────────────────────────────────────────────┐
│                                                                             │
│  1. Cliente          2. API              3. DB            4. External       │
│  ───────────────────────────────────────────────────────────────────────── │
│                                                                             │
│  ┌──────────┐  POST /api/xxx  ┌──────────┐                                 │
│  │  Client  │ ───────────────►│  Handler │                                 │
│  └──────────┘                 └────┬─────┘                                 │
│                                    │                                        │
│                                    ▼                                        │
│                              ┌──────────┐     INSERT      ┌──────────┐     │
│                              │ Validate │ ───────────────►│  Table A │     │
│                              └────┬─────┘                 └──────────┘     │
│                                   │                                        │
│                                   ▼                                        │
│                              ┌──────────┐     API Call    ┌──────────┐     │
│                              │ Service  │ ───────────────►│  Stripe  │     │
│                              └────┬─────┘                 └──────────┘     │
│                                   │                                        │
│                                   ▼                                        │
│  ┌──────────┐     Response   ┌──────────┐                                 │
│  │  Client  │◄───────────────│  Return  │                                 │
│  └──────────┘                └──────────┘                                 │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘

**Pasos del flujo:**

1. **Request inicial:** Cliente envía `POST /api/xxx` con payload
2. **Validación:** Handler valida request body con Zod/Yup
3. **Persistencia:** Guarda en `table_a` con estado inicial
4. **Servicio externo:** Llama API de Stripe para procesar pago
5. **Update estado:** Actualiza `table_a` con resultado
6. **Response:** Retorna resultado al cliente

**Tablas involucradas:** `table_a`, `table_b`
**Servicios externos:** Stripe

**Endpoint principal:** `POST /api/xxx`
**Endpoints relacionados:** `GET /api/xxx/[id]/status`
````

---

#### 8. TABLA RESUMEN PARA QA

```markdown
┌──────────────────────────────────────────────────────────────────────────────┐
│ ✅ TABLA RESUMEN PARA QA │
└──────────────────────────────────────────────────────────────────────────────┘

## Quick Reference Card

| #   | Endpoint                | Auth | Happy Path                    | Error Cases            |
| --- | ----------------------- | ---- | ----------------------------- | ---------------------- |
| 1   | `POST /api/auth/signup` | 🔓   | Email válido → 201            | Email duplicado → 409  |
| 2   | `POST /api/auth/login`  | 🔓   | Credenciales OK → 200 + token | Credenciales mal → 401 |
| 3   | `GET /api/auth/me`      | 🔐   | Token válido → 200 + user     | Sin token → 401        |
| ... | ...                     | ...  | ...                           | ...                    |

## Test Cases Sugeridos

### Autenticación

- [ ] Signup con email nuevo → 201 Created
- [ ] Signup con email existente → 409 Conflict
- [ ] Login con credenciales válidas → 200 + token
- [ ] Login con credenciales inválidas → 401 Unauthorized
- [ ] Request protegido sin token → 401 Unauthorized
- [ ] Request protegido con token expirado → 401 Unauthorized
- [ ] Request admin sin rol admin → 403 Forbidden

### CRUD Operations

- [ ] GET list sin filtros → 200 + array
- [ ] GET list con paginación → 200 + items limitados
- [ ] GET by ID existente → 200 + objeto
- [ ] GET by ID inexistente → 404 Not Found
- [ ] POST crear recurso válido → 201 Created
- [ ] POST con body inválido → 400 Bad Request
- [ ] PUT update propio recurso → 200 Updated
- [ ] PUT update recurso ajeno → 403 Forbidden
- [ ] DELETE propio recurso → 204 No Content
- [ ] DELETE recurso ajeno → 403 Forbidden

## Coverage por Dominio

| Dominio   | Endpoints | Casos Happy | Casos Error | Coverage |
| --------- | --------- | ----------- | ----------- | -------- |
| Auth      | N         | N           | N           | 0%       |
| [Domain]  | N         | N           | N           | 0%       |
| **TOTAL** | **N**     | **N**       | **N**       | **0%**   |
```

---

## FASE 3: INTEGRACIÓN

### 3.1 Actualizar System Prompt

Buscar en el archivo de system prompt (CLAUDE.md o similar) si existe una sección de "API Architecture" o "Endpoints".

**Si NO existe, agregar:**

```markdown
## API Architecture

See `.context/discovery/api-architecture.md` for comprehensive API documentation including:

- Complete endpoint catalog grouped by domain
- Authentication requirements per endpoint
- Testing guides (DevTools, Postman, cURL, Playwright)
- Complex data flow diagrams
- QA testing checklist

**Stack:** [Framework detectado]
**Total Endpoints:** [N]
**Last updated:** [fecha]
```

**Si existe, actualizar** con información relevante.

### 3.2 Modo UPDATE

Si se detectó modo UPDATE:

1. Generar el nuevo documento
2. Comparar con la versión anterior
3. Mostrar resumen de cambios:

```
📊 Cambios detectados en API Architecture:

ENDPOINTS:
+ POST /api/new-endpoint (agregado)
~ PUT /api/existing (modificado: nuevo param)
- DELETE /api/removed (eliminado)

DOMINIOS:
+ Payments (nuevo dominio con 5 endpoints)

AUTENTICACIÓN:
~ /api/public/data ahora es Protected

¿Desea aplicar estos cambios? (sí/no)
```

4. Solo sobrescribir si el usuario confirma

---

## CHECKLIST FINAL

Antes de guardar, verificar:

- [ ] Header visual con nombre del proyecto y stack
- [ ] Resumen ejecutivo con estadísticas
- [ ] Arquitectura completa con diagrama ASCII
- [ ] Catálogo de TODOS los endpoints encontrados
- [ ] Detalle de cada endpoint con request/response
- [ ] Autenticación clasificada (Public/Protected/Admin/Owner)
- [ ] Guía de testing con ejemplos para cada método
- [ ] Flujos complejos documentados con diagramas
- [ ] Tabla resumen para QA con test cases
- [ ] System prompt actualizado con referencia

---

## REPORTE FINAL

Al terminar, mostrar:

```markdown
# ✅ API Architecture Map Generado

## Archivo Creado:

`.context/discovery/api-architecture.md`

## Sistema Documentado:

[Nombre del proyecto] - [Stack detectado]

## Contenido:

- **Stack detectado:** [Framework]
- **Total endpoints:** N
- **Endpoints públicos:** N
- **Endpoints protegidos:** N
- **Endpoints admin:** N
- **Dominios documentados:** N
- **Flujos complejos:** N

## System Prompt Actualizado:

`[archivo]` - Sección "API Architecture" agregada/actualizada

## Documentos Relacionados:

- `.context/discovery/business-data-map.md` - Flujos de negocio
- `.context/api-auth.md` - Documentación detallada de auth

## Próximos Pasos:

<!-- post-migration: once API architecture is documented, downstream skills (e.g. /sprint-dev for implementation, or QA workflows in agentic-qa-boilerplate) consume this map. -->
```

---

## FILOSOFÍA DE ESTE PROMPT

- **Visual primero:** Los diagramas ASCII son más fáciles de comprender que texto
- **Orientado a testing:** Cada endpoint con ejemplos prácticos de cómo probarlo
- **Agnóstico de stack:** Detecta cualquier framework backend común
- **No duplicar:** Referencia business-data-map.md para flujos de negocio
- **Mantenible:** Patrón CREATE/UPDATE para mantener sincronizado
- **Para QA:** Tabla resumen y checklist listos para usar

**Usa las herramientas que tengas disponibles** (MCPs, búsqueda de archivos, lectura de código) para explorar libremente el sistema y documentar completamente la API.
