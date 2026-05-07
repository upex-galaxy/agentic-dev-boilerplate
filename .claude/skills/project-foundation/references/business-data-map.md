# Business Data Map Generator

Actúa como **Business Systems Analyst** y **Technical Storyteller**.

---

## MISIÓN

Tu objetivo es **COMPRENDER PROFUNDAMENTE** cómo funciona este sistema y generar un **mapa visual y narrativo** que explique:

- Cómo viajan los datos a través del sistema
- Por qué existen las entidades y sus relaciones
- Los flujos de negocio de cada feature importante
- Las máquinas de estado y sus transiciones
- Los procesos automáticos y su propósito

**Filosofía:**

- **Visual primero:** Usa diagramas ASCII para que sea fácil de comprender
- **Narrativa de negocio:** Explica el "por qué", no solo el "qué"
- **No duplicar lo que da el MCP:** No listes schema, RLS, o funciones (eso se obtiene via MCP en tiempo real)
- **Síntesis, no extracción:** Combina código + DB + lógica para crear comprensión

**Output:** `.context/business-data-map.md`

---

## FASE 0: DISCOVERY

### 0.1 Detectar Configuración

**Identifica automáticamente:**

1. **System Prompt del proyecto:**
   - Buscar: `CLAUDE.md`, `GEMINI.md`, `CURSOR.md`, `COPILOT.md`, `.ai-instructions.md`
   - Guardar nombre para actualización posterior

2. **Nombre y propósito del proyecto:**
   - Leer: `package.json`, `README.md`
   - Extraer descripción del sistema

3. **MCP de base de datos disponible:**
   - Detectar qué herramientas tienes para explorar la DB
   - Usar para COMPRENDER, no para listar

4. **Documentación existente:**
   - Buscar: `.context/PRD/`, `.context/SRS/`, `docs/`
   - Usar como contexto de negocio si existe

### 0.2 Detectar Modo

```
¿Existe .context/business-data-map.md?
  → SÍ: Modo UPDATE (mostrar diff, pedir confirmación)
  → NO: Modo CREATE (generar desde cero)
```

---

## FASE 1: EXPLORACIÓN PROFUNDA

### 📦 ENTIDADES DE NEGOCIO

**Comprende:**

- ¿Cuáles son los conceptos CORE del dominio?
- ¿Qué representa cada entidad en el mundo real?
- ¿Por qué existe cada entidad? ¿Qué problema resuelve?
- ¿Cómo se relacionan entre sí? ¿Por qué esas relaciones?

**Explora código + DB para entender, NO para listar.**

---

### 🔄 FLUJOS DE NEGOCIO

**Identifica cada feature importante del sistema:**

- ¿Cuáles son las funcionalidades principales?
- ¿Cómo viajan los datos en cada una?
- ¿Qué endpoints, servicios y tablas participan?
- ¿Qué reglas de negocio aplican?

**Para cada flujo, traza el viaje completo:** Usuario → API → Lógica → DB → Respuesta

---

### 📊 ESTADOS Y TRANSICIONES

**Comprende:**

- ¿Qué entidades tienen estados (pending, active, completed...)?
- ¿Cuáles son las transiciones válidas?
- ¿Qué eventos disparan cada transición?
- ¿Qué consecuencias tiene cada cambio de estado?

---

### ⚡ PROCESOS AUTOMÁTICOS

**Identifica:**

- **Triggers:** ¿Qué se ejecuta automáticamente en la DB?
- **Cron jobs:** ¿Qué procesos corren periódicamente?
- **Webhooks:** ¿Qué eventos externos disparan acciones?

**Para cada uno:** ¿Por qué existe? ¿Qué problema resuelve?

---

### 🔗 INTEGRACIONES EXTERNAS

**Comprende:**

- ¿Qué servicios externos se usan?
- ¿Cómo impactan los datos del sistema?
- ¿Qué flujos dependen de ellos?

---

## FASE 2: GENERACIÓN DEL DOCUMENTO

### Genera: `.context/business-data-map.md`

El documento debe ser **VISUAL** y **NARRATIVO**. Usa diagramas ASCII extensivamente.

---

### ESTRUCTURA DEL OUTPUT

```markdown
# Business Data Map: [Nombre del Proyecto]

╔══════════════════════════════════════════════════════════════════════════════╗
║ [NOMBRE] - BUSINESS DATA MAP ║
║ [Descripción corta del sistema] ║
╚══════════════════════════════════════════════════════════════════════════════╝
```

---

#### 1. RESUMEN EJECUTIVO

```markdown
┌──────────────────────────────────────────────────────────────────────────────┐
│ 📋 RESUMEN EJECUTIVO │
└──────────────────────────────────────────────────────────────────────────────┘

## ¿Qué hace este sistema?

[2-3 párrafos explicando el propósito del negocio, el problema que resuelve,
y cómo crea valor para los usuarios]

## Actores Principales

┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐
│ Actor 1 │ │ Actor 2 │ │ Actor 3 │
│ (descripción) │ │ (descripción) │ │ (descripción) │
└─────────────────┘ └─────────────────┘ └─────────────────┘

## Propuesta de Valor

[Cómo el sistema beneficia a cada actor]
```

---

#### 2. MAPA DE ENTIDADES

```markdown
┌──────────────────────────────────────────────────────────────────────────────┐
│ 📦 MAPA DE ENTIDADES │
└──────────────────────────────────────────────────────────────────────────────┘

[Diagrama ASCII mostrando las entidades principales y sus relaciones]

Ejemplo:
┌───────────────────┐
│ auth.users │
└─────────┬─────────┘
│ trigger
▼
┌───────────────────┐
│ profiles │──────────┬──────────┐
└───────────────────┘ │ │
│ │ │
▼ ▼ ▼
┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐
│ bookings │ │ reviews │ │ messages │
└─────────────────┘ └─────────────────┘ └─────────────────┘

### Entidades y su Rol de Negocio

| Entidad  | Rol en el Negocio | Por Qué Existe          |
| -------- | ----------------- | ----------------------- |
| [nombre] | [qué representa]  | [problema que resuelve] |
| ...      | ...               | ...                     |

### Relaciones Clave

[Narrativa explicando POR QUÉ existen las relaciones principales,
no solo que existen]
```

---

#### 3. FLUJOS DE NEGOCIO

**Documenta CADA feature importante del sistema.**

```markdown
┌──────────────────────────────────────────────────────────────────────────────┐
│ 🔄 FLUJOS DE NEGOCIO │
└──────────────────────────────────────────────────────────────────────────────┘

═══════════════════════════════════════════════════════════════════════════════
FLUJO 1: [NOMBRE DEL FLUJO/FEATURE]
═══════════════════════════════════════════════════════════════════════════════

[Diagrama ASCII del flujo completo]

Ejemplo:
┌─────────────┐ POST /api/xxx ┌─────────────────┐
│ Usuario │ ───────────────────► │ API Route │
│ │ {payload} │ │
└─────────────┘ └────────┬────────┘
│
▼
┌─────────────────┐
│ Service │
│ (lógica) │
└────────┬────────┘
│
▼
┌─────────────────┐
│ Database │
│ (tablas) │
└─────────────────┘

**Narrativa del Flujo:**

1. El usuario [acción inicial]...
2. El sistema [validación/proceso]...
3. Se persiste en [tabla] con estado [estado]...
4. [Efectos secundarios: emails, webhooks, etc.]

**Reglas de Negocio:**

- [Regla 1]: [Descripción y por qué existe]
- [Regla 2]: [Descripción y por qué existe]

**Código Involucrado:**

- `src/app/api/...` → [qué hace]
- `src/lib/...` → [qué hace]

═══════════════════════════════════════════════════════════════════════════════
FLUJO 2: [NOMBRE DEL FLUJO/FEATURE]
═══════════════════════════════════════════════════════════════════════════════

[Repetir estructura para cada flujo importante]
```

**Documenta TODOS los flujos importantes del sistema.** No te limites a 3.

---

#### 4. STATE MACHINES

```markdown
┌──────────────────────────────────────────────────────────────────────────────┐
│ 📊 STATE MACHINES │
└──────────────────────────────────────────────────────────────────────────────┘

### [Entidad con estados]

┌─────────────────────────────────────────────────────────────────────────────┐
│ [ENTIDAD] STATUS MACHINE │
│─────────────────────────────────────────────────────────────────────────────│
│ │
│ ┌──────────┐ (evento) ┌──────────┐ (evento) ┌──────────┐ │
│ │ Estado A │ ─────────────► │ Estado B │ ─────────────► │ Estado C │ │
│ └──────────┘ └──────────┘ └──────────┘ │
│ │ │ │
│ │ (cancelación) │ (cancelación) │
│ ▼ ▼ │
│ ┌──────────────────────────────────────────┐ │
│ │ CANCELADO │ │
│ └──────────────────────────────────────────┘ │
│ │
└─────────────────────────────────────────────────────────────────────────────┘

**Transiciones:**

| De  | A         | Evento que lo dispara | Efectos         |
| --- | --------- | --------------------- | --------------- |
| A   | B         | [qué lo causa]        | [qué pasa]      |
| B   | C         | [qué lo causa]        | [qué pasa]      |
| \*  | Cancelado | [condiciones]         | [consecuencias] |

**Reglas de Negocio:**

- [Por qué estas transiciones y no otras]
- [Restricciones importantes]
```

---

#### 5. PROCESOS AUTOMÁTICOS

```markdown
┌──────────────────────────────────────────────────────────────────────────────┐
│ ⚡ PROCESOS AUTOMÁTICOS │
└──────────────────────────────────────────────────────────────────────────────┘

### Triggers de Base de Datos

| Trigger  | Cuándo se ejecuta | Qué hace | Por qué existe          |
| -------- | ----------------- | -------- | ----------------------- |
| [nombre] | INSERT en [tabla] | [acción] | [problema que resuelve] |

### Cron Jobs

| Job      | Frecuencia | Qué hace  | Por qué existe         |
| -------- | ---------- | --------- | ---------------------- |
| [nombre] | [cuándo]   | [proceso] | [necesidad de negocio] |

[Diagrama del flujo del cron job si es complejo]

### Webhooks Entrantes

| Webhook    | Origen     | Qué procesa | Efectos en el sistema      |
| ---------- | ---------- | ----------- | -------------------------- |
| [endpoint] | [servicio] | [evento]    | [tablas/estados afectados] |

[Diagrama del flujo del webhook si es complejo]
```

---

#### 6. INTEGRACIONES EXTERNAS

```markdown
┌──────────────────────────────────────────────────────────────────────────────┐
│ 🔗 INTEGRACIONES EXTERNAS │
└──────────────────────────────────────────────────────────────────────────────┘

### [Servicio Externo 1]

┌─────────────────────────────────────────────────────────────────────────────┐
│ │
│ [Tu Sistema] [Servicio Externo] │
│ │ │ │
│ │──── llamada API ──────────────────►│ │
│ │ │ │
│ │◄─── webhook/respuesta ─────────────│ │
│ │ │ │
└─────────────────────────────────────────────────────────────────────────────┘

**Qué hace:** [Propósito de la integración]

**Cómo afecta los datos:**

- [Tabla/entidad afectada]: [cómo]

**Flujos que dependen de esto:**

- [Flujo 1]
- [Flujo 2]
```

---

## FASE 3: INTEGRACIÓN

### 3.1 Actualizar System Prompt

Buscar en el archivo de system prompt (CLAUDE.md o similar) si existe una sección de "Business Data Map" o "Database".

**Si NO existe, agregar:**

```markdown
## Business Data Map

See `.context/business-data-map.md` for comprehensive visual documentation of:

- System overview and business purpose
- Entity relationships and their business meaning
- Business flows for each major feature
- State machines and lifecycle management
- Automatic processes (triggers, cron jobs, webhooks)
- External integrations

**Key flows:** [listar los principales]

**Last updated:** [fecha]
```

**Si existe, actualizar** con información relevante.

### 3.2 Modo UPDATE

Si se detectó modo UPDATE:

1. Generar el nuevo mapa
2. Comparar con la versión anterior
3. Mostrar resumen de cambios:

```
📊 Cambios detectados:

ENTIDADES:
+ nueva_tabla (agregada)
~ profiles (nuevas relaciones)

FLUJOS:
+ Flujo de pagos (nuevo)
~ Flujo de booking (modificado)

INTEGRACIONES:
+ Webhook de Stripe (nuevo)

¿Desea aplicar estos cambios? (sí/no)
```

4. Solo sobrescribir si el usuario confirma

---

## CHECKLIST FINAL

Antes de guardar, verificar:

- [ ] Header visual con nombre del proyecto
- [ ] Resumen ejecutivo explica claramente qué hace el sistema
- [ ] Mapa de entidades con diagrama ASCII y roles de negocio
- [ ] TODOS los flujos importantes documentados con diagramas ASCII
- [ ] State machines de entidades con estados
- [ ] Procesos automáticos con su razón de existir
- [ ] Integraciones externas mapeadas
- [ ] System prompt actualizado con referencia

---

## REPORTE FINAL

Al terminar, mostrar:

```markdown
# ✅ Business Data Map Generado

## Archivo Creado:

`.context/business-data-map.md`

## Sistema Documentado:

[Nombre del proyecto] - [descripción breve]

## Contenido:

- **Entidades documentadas:** N
- **Flujos de negocio:** N
- **State machines:** N
- **Procesos automáticos:** N triggers, N cron jobs, N webhooks
- **Integraciones externas:** N

## System Prompt Actualizado:

`[archivo]` - Sección "Business Data Map" agregada/actualizada

## Documentos Relacionados:

<!-- post-migration: this map feeds /project-foundation's project-dev-guide reference and any QA test-guide produced by agentic-qa-boilerplate. -->
```

---

## FILOSOFÍA DE ESTE PROMPT

- **Visual primero:** Los diagramas ASCII son más fáciles de comprender que texto
- **Narrativa de negocio:** Explica el "por qué", no solo lista el "qué"
- **No duplicar MCP:** Schema, RLS, funciones se obtienen via MCP en tiempo real
- **Síntesis valiosa:** Combina código + DB + lógica en algo que no se puede obtener de un solo lugar
- **Agnóstico:** Funciona con cualquier stack tecnológico

**Usa las herramientas que tengas disponibles** (MCPs, búsqueda de archivos, lectura de código) para explorar libremente el sistema y construir una comprensión genuina.
