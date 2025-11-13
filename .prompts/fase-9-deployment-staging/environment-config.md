# Prompt: Environment Configuration

## Contexto
Lee `.context/infrastructure-setup.md` para obtener credenciales de servicios.

## Tu tarea

Configurar variables de entorno por ambiente:

### 1. Development (local)
- Archivo: `.env.local`
- Variables: Todas las necesarias para desarrollo local
- Fuente: `.env.example`

### 2. Staging (Vercel/Railway)
- Platform: Vercel Dashboard → Settings → Environment Variables
- Scope: Preview
- Variables:
  - `NEXT_PUBLIC_SUPABASE_URL`
  - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
  - `SUPABASE_SERVICE_ROLE_KEY`
  - Otras según necesidad

### 3. Production (futuro - Fase 12)
- Platform: Vercel Dashboard → Settings → Environment Variables
- Scope: Production
- Variables: Mismas que staging con valores de producción

## Validación
- ✅ Variables configuradas en plataforma
- ✅ Build de staging usa variables correctas
- ✅ No hay secrets hardcodeados en código
