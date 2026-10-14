# Contributing Guidelines

## 📋 Antes de Empezar

Lee la documentación en `.kiro/steering/`:
- `git-conventions.md` - Convenciones de commits y workflow
- `development-guidelines.md` - Guías de desarrollo y código

## 🚀 Setup Inicial

```bash
cd sistemas-informacion
npm install
npm run dev
```

## 📝 Commits

Seguimos **Conventional Commits**:

```
<type>(<scope>): <subject>
```

### Types
- `feat`: Nueva funcionalidad
- `fix`: Corrección de bug
- `docs`: Documentación
- `style`: Formato de código
- `refactor`: Refactorización
- `test`: Tests
- `chore`: Build, configs, deps

### Scopes
`auth`, `inventory`, `loans`, `returns`, `ui`, `api`, `types`, `config`

### Ejemplos
```bash
git commit -m "feat(auth): agregar validación de formulario"
git commit -m "fix(inventory): corregir conteo de recursos"
git commit -m "docs(readme): actualizar instrucciones de setup"
```

**Importante:** 
- ✅ Subject máximo 50 caracteres
- ✅ **En ESPAÑOL** - idioma del equipo
- ✅ Imperativo: "agregar" no "agregado"
- ✅ Sin punto final
- ❌ No escribir párrafos enteros

## 🌿 Branches

```bash
# Feature
git checkout -b feature/auth-login-form

# Bugfix
git checkout -b fix/inventory-count

# Docs
git checkout -b docs/api-documentation
```

## 🔍 Pre-commit Checklist

- [ ] ESLint sin errores: `npm run lint`
- [ ] Tests pasan: `npm run test`
- [ ] TypeScript sin errores: `npm run type-check`
- [ ] Código formateado: `npm run format`

## 📦 Pull Requests

### Título
```
feat(scope): descriptive title
```

### Template
```markdown
## Descripción
Breve resumen del cambio

## Cambios
- Lista de cambios principales

## Testing
- [ ] Tests unitarios
- [ ] Tested manualmente

## Screenshots
(si aplica)

Closes #issue
```

## 🎯 Code Style

- TypeScript strict mode
- Functional components con hooks
- Props tipadas
- No usar `any`
- Validación con Zod
- Error handling con try-catch
- ARIA para accesibilidad

## 🧪 Testing

```bash
npm run test          # Run tests
npm run test:watch    # Watch mode
npm run test:coverage # Coverage
```

## 📚 Recursos

- [Conventional Commits](https://www.conventionalcommits.org/)
- [React TypeScript Cheatsheet](https://react-typescript-cheatsheet.netlify.app/)
- [Testing Library](https://testing-library.com/docs/react-testing-library/intro/)

---

¿Dudas? Revisa `.kiro/steering/` o pregunta al equipo.
