# Prompt: Deploy to Staging

## Contexto
Lee el PR/commit que se va a deployar.

## Pre-requisitos
- ✅ PR aprobado en code review
- ✅ Unit tests pasando
- ✅ Build local exitoso
- ✅ CI/CD configurado (Fase 9.1)

## Tu tarea

### Automático (via GitHub Actions)
El deploy a staging ocurre automáticamente cuando:
- Se hace merge a rama `develop`
- GitHub Actions ejecuta pipeline
- Tests pasan
- Vercel deploya automáticamente

### Manual (si CI/CD no está listo)

```bash
# 1. Validar local
npm run lint
npm run test
npm run build

# 2. Push a develop
git checkout develop
git pull origin develop
git merge [feature-branch]
git push origin develop

# 3. Vercel auto-deploya
# Espera ~2-5 minutos
```

## Output
- URL de staging: `https://[project]-[hash].vercel.app`
- Preview en Vercel dashboard
- Listo para Fase 10 (Exploratory Testing)

## Validación post-deploy
- ✅ Aplicación carga sin errores 500
- ✅ No hay errores en consola
- ✅ Assets cargan correctamente
