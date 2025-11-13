# Prompt: Unit Testing

## Contexto
Lee el código implementado en la story actual.

## Cuándo crear unit tests
- Funciones con lógica de negocio compleja
- Utilidades y helpers reutilizables
- Transformaciones de datos
- Cálculos matemáticos o financieros

## Cuándo NO crear unit tests
- Componentes React simples (solo UI)
- Código que solo llama APIs (eso es integration test)
- Configuraciones o constantes

## Tu tarea

### 1. Identificar funciones críticas
Revisar el código implementado y listar funciones que necesitan unit tests.

### 2. Crear tests con Jest/Vitest

```typescript
// Ejemplo
describe('calculateDiscount', () => {
  it('should apply 10% discount for orders over $100', () => {
    expect(calculateDiscount(150)).toBe(135)
  })
  
  it('should not apply discount for orders under $100', () => {
    expect(calculateDiscount(50)).toBe(50)
  })
  
  it('should handle edge case of exactly $100', () => {
    expect(calculateDiscount(100)).toBe(90)
  })
})
```

### 3. Validar cobertura
- Mínimo 80% cobertura en funciones críticas
- Casos edge incluidos
- Error cases incluidos

## Output
- Archivo `.test.ts` por cada módulo que lo necesite
- Tests pasando localmente
- Coverage report green
