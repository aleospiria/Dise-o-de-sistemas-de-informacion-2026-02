---
inclusion: always
---

# Git Conventions and Workflow

## Commit Message Format

Todos los commits deben seguir el formato **Conventional Commits**:

```
<type>(<scope>): <subject>

[optional body]

[optional footer]
```

### Type (requerido)
- `feat`: Nueva funcionalidad
- `fix`: Corrección de bug
- `docs`: Cambios en documentación
- `style`: Formato, punto y coma faltantes, etc (sin cambios de código)
- `refactor`: Refactorización de código (sin cambios funcionales)
- `perf`: Mejoras de rendimiento
- `test`: Agregar o corregir tests
- `chore`: Cambios en build, configs, dependencies
- `ci`: Cambios en CI/CD
- `revert`: Revertir commit anterior

### Scope (opcional)
El alcance debe ser específico al área afectada:
- `auth`: Autenticación y autorización
- `inventory`: Gestión de inventario
- `loans`: Préstamos y reservas
- `returns`: Devoluciones
- `ui`: Componentes de interfaz
- `api`: Capa de datos/API mock
- `types`: TypeScript types
- `config`: Configuración del proyecto
- `deps`: Dependencias

### Subject (requerido)
- **Máximo 50 caracteres**
- **En ESPAÑOL** - idioma nativo del equipo
- Usar imperativo presente: "agregar" no "agregado" o "agrega"
- Sin mayúscula inicial
- Sin punto final
- Ser preciso y descriptivo

### Body (opcional)
- Separar del subject con línea en blanco
- Explicar el **qué** y **por qué**, no el cómo
- Máximo 72 caracteres por línea
- Usar solo cuando el subject no es suficientemente descriptivo

### Footer (opcional)
- Referencias a issues: `Closes #123`
- Breaking changes: `BREAKING CHANGE: description`

## Ejemplos Correctos

### ✅ Commits Simples (en ESPAÑOL)
```
feat(auth): agregar validación de formulario de login
fix(inventory): corregir cálculo de cantidad de recursos
docs(readme): actualizar pasos de instalación
style(ui): formatear componentes de botones
refactor(loans): extraer lógica de validación a utils
test(auth): agregar tests unitarios de formulario
chore(deps): actualizar react a v18.3.1
```

### ✅ Commits con Body
```
feat(loans): implementar reservas recurrentes

Agregar patrón de recurrencia semanal con límite de 12 semanas.
Validar disponibilidad para cada ocurrencia antes de crear.

Closes #45
```

### ✅ Breaking Change
```
refactor(api)!: cambiar valores de enum de estado

BREAKING CHANGE: Valores de estado cambiados de números a strings.
Actualizar todas las referencias de enums numéricos a literales.
```

## Ejemplos Incorrectos

### ❌ Commits Vagos
```
fix: arreglé bug
update: actualicé archivos
chore: cambios
```

### ❌ Commits Largos (Párrafos)
```
feat: Agregué el nuevo sistema de login con validación y manejo de errores y también agregué la funcionalidad de recuperación de contraseña con simulación de email y generación de token y lógica de expiración y actualicé todos los componentes relacionados
```

### ❌ Formato Incorrecto
```
Agregado formulario de login.
Arreglar bug en inventario
Actualizado archivo README.
```

### ❌ En Inglés (NO USAR)
```
feat(auth): add login form
fix(inventory): fix bug
docs: update readme
```

## Reglas de Commits

1. **Un commit = un cambio lógico**: No mezclar múltiples features o fixes
2. **Commits atómicos**: Cada commit debe dejar el código en estado funcional
3. **Subject conciso**: 50 caracteres máximo, sin punto final
4. **En ESPAÑOL**: Todos los commits en español, idioma del equipo
5. **Imperativo**: "agregar", "corregir", "actualizar", no "agregado", "corregí", "actualicé"
6. **Sin párrafos**: Detalles extensos van en el body, no en el subject
7. **Scope específico**: Usar scopes definidos o crear nuevos descriptivos
8. **Sin WIP commits**: No hacer commits con "WIP", "temp", "test"

## Workflow de Branches

### Branch principal
- `main`: Rama principal protegida, siempre estable

### Feature branches
```
feature/<scope>-<short-description>
```
Ejemplos:
- `feature/auth-login-form`
- `feature/inventory-csv-import`
- `feature/loans-recurring-reservations`

### Bugfix branches
```
fix/<scope>-<short-description>
```
Ejemplos:
- `fix/auth-password-validation`
- `fix/inventory-count-calculation`

### Docs branches
```
docs/<short-description>
```
Ejemplo:
- `docs/api-documentation`

## Pull Request Guidelines

### Título del PR
Seguir el mismo formato que commits pero puede ser más descriptivo:
```
feat(auth): implement complete authentication system
```

### Descripción del PR
```markdown
## Descripción
Breve resumen del cambio

## Cambios Realizados
- Lista de cambios principales
- Nuevas funcionalidades
- Fixes aplicados

## Testing
- [ ] Tests unitarios agregados
- [ ] Tests de integración agregados
- [ ] Tested manualmente en navegador

## Screenshots (si aplica)
Agregar capturas si hay cambios visuales

## Closes
Closes #issue-number
```

### Review Process
1. Auto-review antes de crear PR
2. Esperar al menos 1 aprobación
3. Resolver todos los comentarios
4. Asegurar que CI/CD pasa

## Git Hooks (Recomendado)

### Pre-commit
- Ejecutar linter (ESLint)
- Ejecutar formatter (Prettier)
- Validar tipos (TypeScript)

### Commit-msg
- Validar formato de commit message
- Rechazar si no cumple convenciones

## Comandos Útiles

### Verificar último commit
```bash
git log -1 --oneline
```

### Amend último commit (solo si no está pushed)
```bash
git commit --amend -m "feat(scope): new message"
```

### Ver commits en formato corto
```bash
git log --oneline --graph --all
```

### Squash commits antes de merge
```bash
git rebase -i HEAD~3  # Squash últimos 3 commits
```

## Referencias

- [Conventional Commits](https://www.conventionalcommits.org/)
- [Angular Commit Guidelines](https://github.com/angular/angular/blob/main/CONTRIBUTING.md#commit)
- [How to Write a Git Commit Message](https://chris.beams.io/posts/git-commit/)

---

**Nota para Kiro**: Al hacer commits automáticos:
1. SIEMPRE usar formato conventional commits
2. **Escribir TODOS los commits en ESPAÑOL**
3. Subject máximo 50 caracteres
4. Usar imperativo: "agregar", "corregir", "actualizar"
5. Ser específico pero conciso
6. Usar scope apropiado
7. NO escribir párrafos en el subject
8. Agregar body solo si es necesario explicar contexto adicional
