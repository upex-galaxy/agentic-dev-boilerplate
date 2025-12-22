# Implementation Workflow

> **Para**: Fases 6-7 (Implementation + Code Review)
> **Propósito**: Workflow paso a paso para implementar una story con IA

---

## 🎯 Objetivo

Asegurar que cada implementación siga un proceso consistente, optimizado para trabajo con IA assistant.

---

## 📋 Workflow Completo

### **1. Cargar Contexto**

Antes de empezar a codear, la IA DEBE leer:

```
Contexto obligatorio:
├── .context/PBI/epics/EPIC-XXX/stories/STORY-XXX/
│   ├── story.md                    # User story + acceptance criteria
│   ├── test-cases.md               # Test cases esperados
│   └── implementation-plan.md      # Plan técnico detallado
│
├── .context/SRS/
│   ├── architecture-specs.md       # Arquitectura general
│   ├── api-contracts.yaml          # API specs (si aplica)
│   └── functional-specs.md         # FRs relevantes
│
└── .context/guidelines/
    ├── code-standards.md           # Estándares de código
    ├── error-handling.md           # Manejo de errores
    └── mcp-usage-tips.md           # Cuándo usar MCPs
```

**Checklist de contexto**:

- [ ] Story completa leída
- [ ] Test cases comprendidos
- [ ] Implementation plan revisado
- [ ] Arquitectura general conocida
- [ ] Guidelines de código cargadas

---

### **2. Verificar Plan de Implementación**

Antes de escribir código, REVISAR el implementation plan:

```markdown
¿El plan tiene?:

- [ ] Breakdown en subtareas claras
- [ ] Orden de implementación lógico
- [ ] Consideraciones de testing
- [ ] Edge cases identificados
- [ ] Performance considerations
```

Si el plan está incompleto → PAUSAR y mejorarlo primero.

---

### **3. Breakdown en Subtareas**

Dividir la implementación en pasos pequeños:

```
Ejemplo: STORY-001-login

Subtareas:
1. [ ] Create login form component (UI)
2. [ ] Add form validation
3. [ ] Create login API endpoint
4. [ ] Integrate form with API
5. [ ] Add error handling
6. [ ] Add loading states
7. [ ] Write unit tests
8. [ ] Update documentation
```

**Regla**: Cada subtarea debe ser <= 30 minutos de trabajo.

---

### **4. Implementar Iterativamente**

**POR CADA SUBTAREA**:

```
Do:
1. Implementar la subtarea
2. Verificar que compila sin errores
3. Ejecutar tests relevantes
4. Commit con mensaje descriptivo
5. Marcar subtarea como completa

Don't:
❌ Implementar múltiples subtareas a la vez
❌ Hacer commits gigantes
❌ Saltarse tests
❌ Ignorar warnings
```

**Ejemplo de commits**:

```bash
git commit -m "feat(auth): add login form component with validation"
git commit -m "feat(auth): create login API endpoint"
git commit -m "feat(auth): integrate form with API endpoint"
```

---

### **5. Quality Checks Después de Cada Step**

Después de implementar cada subtarea:

```
Checklist:
- [ ] Código compila sin errores
- [ ] No hay warnings de TypeScript
- [ ] Tests unitarios pasan
- [ ] Código sigue code-standards.md
- [ ] No hay console.log() olvidados
- [ ] No hay TODOs sin resolver
- [ ] Error handling implementado
```

Si algún check falla → ARREGLAR antes de continuar.

---

### **6. Testing Continuo**

**Durante implementación**:

```bash
# Ejecutar tests unitarios frecuentemente
npm test LoginForm.test.tsx

# Ejecutar linter
npm run lint

# TypeScript check
npm run type-check
```

**Antes de marcar story como completa**:

```bash
# Todos los tests
npm test

# Build de producción
npm run build

# E2E tests (si aplica)
npm run test:e2e
```

---

### **7. Code Review Self-Check**

Antes de solicitar code review:

```
Self-review checklist:
- [ ] Leí mi propio código línea por línea
- [ ] Todas las acceptance criteria cumplidas
- [ ] Todos los test cases implementados
- [ ] No hay código hardcodeado
- [ ] Variables de entorno usadas correctamente
- [ ] Error messages son user-friendly
- [ ] Performance es aceptable
- [ ] Accessibility (a11y) considerada
- [ ] Mobile responsive (si aplica)
```

---

### **8. Documentación**

Actualizar documentación relevante:

```
Documentar:
- [ ] Nuevas API endpoints (en api-contracts.yaml)
- [ ] Nuevos componentes (en component-catalog.md)
- [ ] Cambios de schema (migrations)
- [ ] Environment variables nuevas (.env.example)
- [ ] README si hay setup nuevo
```

---

## 🔧 Uso de MCP Tools

Durante implementación, usar MCPs estratégicamente:

**Supabase MCP**:

```
Cuándo: Necesitas schema real de DB
Ejemplo: "¿Qué columnas tiene la tabla users?"
```

**Context7 MCP**:

```
Cuándo: Necesitas docs de biblioteca
Ejemplo: "¿Cómo usar React Hook Form?"
```

**Playwright MCP**:

```
Cuándo: Implementando E2E tests
Ejemplo: "Genera test para flujo de login"
```

Ver detalles en `mcp-usage-tips.md`.

---

## ⚠️ Errores Comunes a Evitar

### ❌ NO hacer

1. **Implementar sin leer el plan**
   - Resultado: Código que no cumple requirements

2. **Hardcodear valores**

   ```typescript
   // ❌ MAL
   const apiUrl = 'https://api.example.com';

   // ✅ BIEN
   const apiUrl = process.env.NEXT_PUBLIC_API_URL;
   ```

3. **Ignorar edge cases**

   ```typescript
   // ❌ MAL
   function divide(a, b) {
     return a / b;
   }

   // ✅ BIEN
   function divide(a, b) {
     if (b === 0) throw new Error('Division by zero');
     return a / b;
   }
   ```

4. **Commits sin contexto**

   ```bash
   # ❌ MAL
   git commit -m "fixes"

   # ✅ BIEN
   git commit -m "fix(auth): handle expired token error on login"
   ```

---

## 🎯 Definition of Done

Una story está DONE cuando:

- [x] Todo el código implementado
- [x] Todos los acceptance criteria cumplidos
- [x] Todos los test cases pasan
- [x] Unit tests escritos y pasando
- [x] E2E tests escritos (si aplica)
- [x] Code review aprobado
- [x] No hay merge conflicts
- [x] Build de producción exitoso
- [x] Documentación actualizada
- [x] Performance aceptable
- [x] Accessibility verificada

---

**Última actualización**: 2025-10-29
**Fase**: Implementation (Fase 6)
