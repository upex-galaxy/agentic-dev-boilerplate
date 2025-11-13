# Fase 6: Implementation - Guías de Prompts

> **Tipo de fase:** Asincrónica (iterativa por story)
> **Propósito:** Implementar código funcional siguiendo los planes de Fase 5

---

## 🎯 ¿Qué es esta fase?

En esta fase **NO generas documentación**. En su lugar, **implementas código real** que hace funcionar la aplicación.

**Esta fase se enfoca SOLO en:**
- ✅ Implementar funcionalidad según `implementation-plan.md`
- ✅ Seguir code standards de `.context/guidelines/`
- ✅ Validar manualmente que funciona (smoke testing)
- ✅ Crear código limpio y mantenible

**Esta fase NO incluye:**
- ❌ Pruebas unitarias (eso es Fase 8: Test Automation)
- ❌ Pruebas de integración (eso es Fase 8)
- ❌ Test coverage (eso es Fase 8)
- ❌ Code review (eso es Fase 7)

---

## 📋 Cuándo usar esta fase

**Prerequisitos:**
- ✅ Story tiene `implementation-plan.md` completo (Fase 5)
- ✅ Test cases definidos en `test-cases.md` (Fase 4)
- ✅ Design system configurado (Fase 2.5 - si hay UI)
- ✅ Architecture specs claras (Fase 2)

**Workflow típico:**
```
Fase 5 (Planning)
    ↓
Fase 6 (Implementation) ← ESTÁS AQUÍ
    ↓
Fase 7 (Code Review)
    ↓
Fase 8 (Test Automation)
```

---

## 📚 Prompts disponibles

| Prompt | Cuándo usarlo | Propósito |
|--------|---------------|-----------|
| **`implement-story.md`** ⭐ | Iniciar story desde cero | Implementar funcionalidad completa |
| **`continue-implementation.md`** | Retomar story pausada | Continuar desde donde quedó |
| **`fix-issues.md`** | Debuggear errores | Corregir bugs o errores |

---

## 🔄 Workflow típico de uso

### Escenario 1: Implementar story nueva

```bash
# 1. Usa el prompt principal
Use: implement-story.md

# 2. La IA implementa step by step
# 3. Valida manualmente que funciona
# 4. Si todo OK → Fase 7 (Code Review)
```

### Escenario 2: Story pausada/interrumpida

```bash
# 1. Retoma desde donde quedó
Use: continue-implementation.md

# 2. La IA analiza qué falta
# 3. Continúa implementación
```

### Escenario 3: Errores/bugs durante implementación

```bash
# 1. Debuggea el error
Use: fix-issues.md

# 2. La IA investiga y corrige
# 3. Valida que funciona
```

---

## ⚙️ MCP Tools requeridos

### **Context7 MCP** (Recomendado)

**¿Para qué?** Consultar documentación oficial de tecnologías (Next.js, React, Supabase, etc.)

**Si NO está disponible:**
La IA debe pedirle al usuario:
```
⚠️ MCP Context7 no detectado

Para implementar con documentación verificada y actualizada, necesito que conectes el MCP de Context7.

**¿Cómo conectarlo?**
1. Revisa: docs/mcp-config-[tu-herramienta].md
2. Agrega Context7 a tu configuración
3. Reinicia la sesión

¿Quieres continuar sin Context7? (usaré conocimiento interno, puede estar desactualizado)
```

### **Supabase MCP** (Si proyecto usa Supabase)

**¿Para qué?** Ejecutar queries, crear tablas, gestionar DB sin hardcodear SQL.

**Si NO está disponible:**
La IA debe advertir y pedir conexión o instruir al usuario cómo ejecutar manualmente.

---

## ⚠️ Restricciones críticas

### ❌ NO HACER:
- **NO hardcodear SQL** - Usa Supabase MCP o instruye al usuario
- **NO ejecutar scripts interactivos** - Evitar comandos que requieren input del usuario
- **NO agregar tests en esta fase** - Los tests van en Fase 8
- **NO ignorar error handling** - Implementar según `.context/guidelines/error-handling.md`
- **NO crear componentes si ya existen** - Reusar design system
- **NO hacer commits automáticos** - Solo recomendar al usuario

### ✅ SÍ HACER:
- **Leer todos los guidelines** antes de empezar
- **Implementar step by step** según `implementation-plan.md`
- **Seguir code standards** (DRY, naming, TypeScript strict)
- **Validar manualmente** que funciona (smoke test)
- **Usar Context7 MCP** para consultar docs oficiales
- **Pedir al usuario** si algo requiere script interactivo

---

## 💬 Output esperado de la IA

**Durante implementación:**
1. Explicar cada step antes de ejecutarlo
2. Mostrar código creado/modificado con contexto
3. Validar manualmente que funciona
4. Reportar cualquier blocker o decisión técnica

**Al finalizar:**
```markdown
## ✅ Implementación Completada

**Archivos creados/modificados:**
- `app/page.tsx` - [Descripción breve]
- `components/MentorCard.tsx` - [Descripción breve]
- `lib/api/mentors.ts` - [Descripción breve]

**Funcionalidad implementada:**
- ✅ AC1: [Descripción]
- ✅ AC2: [Descripción]
- ✅ AC3: [Descripción]

**Validación manual:**
- ✅ Página carga correctamente
- ✅ Datos se muestran
- ✅ Navegación funciona

**Comandos para probar:**
```bash
npm run dev
# Abre: http://localhost:3000/mentors
```

**Próximo paso:**
- Fase 7: Code Review (usar `.prompts/fase-7-code-review/review-pr.md`)
```

---

## 📖 Recursos adicionales

**Guidelines a leer:**
- `.context/guidelines/implementation-workflow.md` - Workflow detallado
- `.context/guidelines/code-standards.md` - Estándares de código
- `.context/guidelines/error-handling.md` - Manejo de errores
- `.context/guidelines/mcp-usage-tips.md` - Tips de MCP tools

**Specs técnicas:**
- `.context/SRS/architecture-specs.md` - Arquitectura del proyecto
- `.context/SRS/api-contracts.yaml` - Contratos de API
- `.context/design-system.md` - Design System (si hay UI)

---

## 🎯 Quick Start

```bash
# 1. Elige el prompt apropiado
cd .prompts/fase-6-implementation/

# 2. Copia el contenido de implement-story.md

# 3. Reemplaza [PROYECTO], [NUM], [nombre] con valores reales

# 4. Pégalo en tu chat con la IA

# 5. La IA implementará step by step
```

---

**Nota:** Esta fase implementa funcionalidad. Los tests automatizados se agregan en Fase 8 (Test Automation).
