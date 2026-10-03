# Prompt: Deploy to Production

## Estrategia

Deploy gradual con feature flags si es posible.

## Proceso

### Automático (Vercel/Railway)

```bash
# 1. Merge a main
git checkout main
git pull origin main
git merge staging   # rama de integración: git_strategy.branches.integration
git push origin main

# 2. Vercel auto-deploya a producción
# Monitorear en dashboard
```

### Post-Deploy

1. Smoke tests automáticos (Stage 5, post-deploy)
2. Monitoreo activo (primeras 2-4 horas)
3. Validar métricas de negocio

## Output

- URL de producción funcionando
- Smoke tests pasando
- Monitoreo activo
