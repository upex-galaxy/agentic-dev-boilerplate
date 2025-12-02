# Data-TestID Standards

Este documento define las convenciones para agregar atributos `data-testid` a los componentes y elementos UI del proyecto. Esto es esencial para pruebas automatizadas E2E y garantiza selectores estables y predecibles.

---

## Por Qué Usar data-testid

- **Estabilidad:** Los selectores basados en `data-testid` no se rompen con cambios de CSS o estructura HTML
- **Claridad:** Identifican claramente qué elemento está siendo testeado
- **Independencia:** Desacoplan las pruebas de la implementación visual
- **Mantenibilidad:** Facilitan el mantenimiento de pruebas automatizadas E2E

---

## Reglas de Nomenclatura (explicado con Ejemplos - esto debe adaptarse al proyecto bajo contexto)

### 1. Componentes: camelCase

El `data-testid` de un **componente** usa el nombre del componente en **camelCase**.

```tsx
// Componente: MentorCard.tsx
export function MentorCard({ mentor }: MentorCardProps) {
  return (
    <div data-testid="mentorCard" className="...">
      {/* contenido */}
    </div>
  )
}

// Componente: SearchBar.tsx
export function SearchBar({ onSearch }: SearchBarProps) {
  return (
    <div data-testid="searchBar" className="...">
      <input ... />
      <button>Buscar</button>
    </div>
  )
}
```

**Ejemplos de conversión:**
| Nombre Componente | data-testid |
|-------------------|-------------|
| `MentorCard` | `mentorCard` |
| `SearchBar` | `searchBar` |
| `LoginForm` | `loginForm` |
| `Navbar` | `navbar` |
| `UserDropdown` | `userDropdown` |

### 2. Elementos Específicos: snake_case

Cuando necesitas identificar **elementos específicos dentro de un componente grande**, usa **snake_case**.

```tsx
// Componente: LoginForm.tsx
export function LoginForm({ onSubmit }: LoginFormProps) {
  return (
    <form data-testid="loginForm" onSubmit={onSubmit}>
      <input data-testid="email_input" type="email" />
      <input data-testid="password_input" type="password" />
      <button data-testid="submit_button" type="submit">
        Iniciar Sesión
      </button>
    </form>
  )
}

// Componente: Navbar.tsx
export function Navbar() {
  return (
    <nav data-testid="navbar">
      <a data-testid="logo_link" href="/">Logo</a>
      <button data-testid="menu_toggle">Menu</button>
      <div data-testid="user_menu">
        <button data-testid="logout_button">Cerrar Sesión</button>
      </div>
    </nav>
  )
}
```

**Patrón de nomenclatura para elementos específicos:**
- `{descripcion}_{tipo}` donde tipo puede ser: `input`, `button`, `link`, `container`, `list`, `item`, etc.

---

## Posicionamiento del data-testid

### Regla Principal: Root del Componente

El `data-testid` debe estar en el **elemento raíz** del componente, permitiendo que los testers naveguen hacia elementos hijos usando selectores CSS.

```tsx
// ✅ CORRECTO: data-testid en el root
export function SearchBar() {
  return (
    <div data-testid="searchBar" className="flex gap-2">
      <input placeholder="Buscar..." />
      <button>Buscar</button>
    </div>
  )
}

// Uso en tests:
// $('[data-testid="searchBar"] input')
// $('[data-testid="searchBar"] button')
```

```tsx
// ❌ INCORRECTO: data-testid solo en elementos internos sin root
export function SearchBar() {
  return (
    <div className="flex gap-2">
      <input data-testid="searchInput" />
      <button data-testid="searchButton">Buscar</button>
    </div>
  )
}
```

### Elementos Interactivos

Si el componente ES un elemento interactivo (ej: un botón wrapper), el `data-testid` va en el elemento interactivo mismo.

```tsx
// ✅ CORRECTO: Button es el elemento interactivo
export function SubmitButton({ children }: SubmitButtonProps) {
  return (
    <button data-testid="submitButton" type="submit">
      {children}
    </button>
  )
}
```

---

## Unicidad: Por Componente, NO Por Instancia

### Regla Fundamental

El `data-testid` es **único por tipo de componente**, NO por cada instancia renderizada.

```tsx
// ✅ CORRECTO: Todas las MentorCard tienen el mismo data-testid
function MentorList({ mentors }: MentorListProps) {
  return (
    <div data-testid="mentorList">
      {mentors.map((mentor) => (
        <MentorCard key={mentor.id} mentor={mentor} />
        {/* Cada MentorCard tiene data-testid="mentorCard" */}
      ))}
    </div>
  )
}

// Uso en tests:
// $$('[data-testid="mentorCard"]') → Obtiene array de todas las cards
// $$('[data-testid="mentorCard"]')[0] → Primera card
// $('[data-testid="mentorCard"]:nth-child(2)') → Segunda card
```

### NUNCA Usar IDs Dinámicos

```tsx
// ❌ INCORRECTO: ID dinámico hace el selector impredecible
<div data-testid={`mentorCard-${mentor.id}`}>

// ❌ INCORRECTO: Index dinámico
<div data-testid={`mentorCard-${index}`}>

// ✅ CORRECTO: data-testid estático basado en el componente
<div data-testid="mentorCard">
```

**Razón:** Los QA Automation combinan `data-testid` con:
- Índices: `$$('[data-testid="mentorCard"]')[2]`
- Selectores CSS: `$('[data-testid="mentorCard"]:has-text("John")')`
- Atributos: `$('[data-testid="mentorCard"][data-mentor-id="123"]')`

---

## Estrategia para Componentes Complejos

Para componentes grandes con múltiples elementos interactivos, aplica **ambas estrategias**:

### Ejemplo: Formulario de Registro

```tsx
export function SignupForm({ onSubmit }: SignupFormProps) {
  return (
    <form data-testid="signupForm" onSubmit={onSubmit}>
      {/* Sección de datos personales */}
      <div data-testid="personal_info_section">
        <input data-testid="first_name_input" name="firstName" />
        <input data-testid="last_name_input" name="lastName" />
        <input data-testid="email_input" type="email" name="email" />
      </div>

      {/* Sección de contraseña */}
      <div data-testid="password_section">
        <input data-testid="password_input" type="password" />
        <input data-testid="confirm_password_input" type="password" />
      </div>

      {/* Acciones */}
      <div data-testid="form_actions">
        <button data-testid="submit_button" type="submit">
          Registrarse
        </button>
        <a data-testid="login_link" href="/login">
          Ya tengo cuenta
        </a>
      </div>
    </form>
  )
}
```

**Selectores disponibles para QA:**
```javascript
// Formulario completo
$('[data-testid="signupForm"]')

// Campos específicos
$('[data-testid="email_input"]')
$('[data-testid="password_input"]')

// Navegación dentro del componente
$('[data-testid="signupForm"] [data-testid="submit_button"]')
$('[data-testid="personal_info_section"] input')

// Combinaciones
$('[data-testid="signupForm"] button[type="submit"]')
```

---

## Cuándo Agregar data-testid

### SIEMPRE agregar en:

1. **Componentes reutilizables** (`components/ui/`, `components/`)
2. **Formularios y sus campos**
3. **Botones de acción** (submit, CTA, navegación)
4. **Elementos de navegación** (navbar, sidebar, tabs)
5. **Cards y elementos de listas**
6. **Modales y diálogos**
7. **Mensajes de error/éxito**
8. **Dropdowns y menús**

### Opcional en:

1. Elementos puramente decorativos
2. Wrappers de layout sin interacción
3. Iconos (a menos que sean clickeables)

---

## Resumen de Convenciones

| Contexto | Nomenclatura | Ejemplo |
|----------|--------------|---------|
| Componente (root) | camelCase | `data-testid="mentorCard"` |
| Elemento específico | snake_case | `data-testid="email_input"` |
| Sección de componente | snake_case | `data-testid="form_actions"` |
| Botón de acción | snake_case | `data-testid="submit_button"` |

---

## Checklist para Implementación

Al implementar un componente, verifica:

- [ ] El componente tiene `data-testid` en su elemento raíz (camelCase)
- [ ] Los elementos interactivos importantes tienen `data-testid` (snake_case)
- [ ] NO hay IDs dinámicos en los `data-testid`
- [ ] Los `data-testid` permiten selectores descendientes (`[data-testid="X"] button`)
- [ ] La nomenclatura es consistente (camelCase para componentes, snake_case para elementos)

---

## Ejemplos Reales del Proyecto

### MentorCard

```tsx
export function MentorCard({ mentor }: MentorCardProps) {
  return (
    <Card data-testid="mentorCard">
      <CardHeader>
        <img data-testid="avatar_image" src={mentor.avatar} />
        <h3>{mentor.name}</h3>
      </CardHeader>
      <CardContent>
        <p>{mentor.bio}</p>
        <div data-testid="skills_container">
          {mentor.skills.map(skill => (
            <Badge key={skill}>{skill}</Badge>
          ))}
        </div>
      </CardContent>
      <CardFooter>
        <Button data-testid="view_profile_button">
          Ver Perfil
        </Button>
        <Button data-testid="book_session_button" variant="outline">
          Agendar Sesión
        </Button>
      </CardFooter>
    </Card>
  )
}
```

### SearchBar

```tsx
export function SearchBar({ onSearch }: SearchBarProps) {
  return (
    <div data-testid="searchBar" className="flex gap-2">
      <Input
        data-testid="search_input"
        placeholder="Buscar mentor por nombre o especialidad..."
      />
      <Button data-testid="search_button">
        <SearchIcon />
        Buscar
      </Button>
    </div>
  )
}
```

### Navbar

```tsx
export function Navbar() {
  return (
    <nav data-testid="navbar">
      <a data-testid="logo_link" href="/">
        <Logo />
      </a>

      <div data-testid="nav_links">
        <a data-testid="home_link" href="/">Inicio</a>
        <a data-testid="mentors_link" href="/mentors">Mentores</a>
      </div>

      <div data-testid="auth_actions">
        <Button data-testid="login_button" variant="ghost">
          Iniciar Sesión
        </Button>
        <Button data-testid="signup_button">
          Registrarse
        </Button>
      </div>
    </nav>
  )
}
```
