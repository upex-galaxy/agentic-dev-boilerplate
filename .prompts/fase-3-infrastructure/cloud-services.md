# Prompt: Cloud Services Setup

## Contexto
Lee `.context/SRS/architecture-specs.md` para conocer el tech stack.

## Tu tarea
Configurar la infraestructura cloud del proyecto:

1. **Crear proyecto en Supabase:**
   - Proyecto nuevo con nombre del proyecto
   - Anotar: Project URL, API Keys (anon, service_role)
   - Configurar autenticación (email, OAuth si aplica)

2. **Crear proyecto en Vercel:**
   - Proyecto nuevo vinculado al repo
   - Configurar dominios
   - Anotar: Project ID, Team ID

3. **Configurar ambientes:**
   - Development (local)
   - Staging (para QA)
   - Production

4. **Generar `.env.example`:**
```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# Vercel (para local development)
VERCEL_URL=

# Otros servicios
SENTRY_DSN=
STRIPE_SECRET_KEY=
```

## Output
- Proyectos creados en Supabase y Vercel
- `.env.example` en la raíz del proyecto
- Documento `.context/infrastructure-setup.md` con credenciales y URLs
