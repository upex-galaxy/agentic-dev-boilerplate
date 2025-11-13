# Deployment Workflow

## Flujo completo

```
Local Development
├── Desarrollo + unit tests
├── Code Review
└── ✅ Merge a develop

CI/CD (automático)
├── Linting + unit tests
├── Build validation
└── Deploy to Staging

Staging Environment
├── Smoke test (manual)
├── Exploratory testing (manual)
├── Integration tests (automatizado)
├── E2E tests (automatizado)
└── ✅ Aprobación QA

Production
├── Pre-deploy checklist
├── Deploy to Production
├── Smoke tests (automatizado)
└── Monitoring activo
```

## Ambientes

| Ambiente | Branch | Propósito | Tests |
|----------|--------|-----------|-------|
| Development | develop | Integración continua | Unit + Smoke |
| Staging | develop | QA y validación | Integration + E2E + Exploratory |
| Production | main | Usuarios finales | Smoke + Monitoring |
