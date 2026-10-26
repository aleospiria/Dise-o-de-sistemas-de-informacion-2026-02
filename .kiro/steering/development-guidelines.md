---
inclusion: always
---

# Development Guidelines - Sistema de Préstamos

## Stack Tecnológico

- **Framework**: React 19 con TypeScript
- **Build Tool**: Vite 8
- **Styling**: CSS Modules (Tailwind no se usa)
- **State Management**: React Context + Hooks (localStorage para persistencia)
- **Routing**: React Router v7 (paquete `react-router-dom`)
- **Forms**: React Hook Form; la validación es una función pura por formulario adaptada con `createResolver` (Zod está instalado pero sin usar)
- **Testing**: Vitest + React Testing Library
- **Linting**: ESLint (Prettier no está instalado)
- **Types**: TypeScript strict mode

## Estructura de Carpetas

```
sistemas-informacion/
├── src/
│   ├── components/        # Componentes reutilizables
│   │   ├── ui/           # Componentes base (Button, Input, Modal)
│   │   ├── auth/         # Componentes de autenticación
│   │   ├── inventory/    # Componentes de inventario
│   │   ├── loans/        # Componentes de préstamos
│   │   └── layout/       # Componentes de layout (Header, Sidebar)
│   ├── pages/            # Páginas/vistas principales
│   ├── hooks/            # Custom hooks
│   ├── contexts/         # React contexts
│   ├── services/         # Lógica de negocio y mock API
│   ├── types/            # TypeScript types e interfaces
│   ├── utils/            # Funciones utilitarias
│   ├── constants/        # Constantes y configuraciones
│   ├── data/             # Mock data inicial
│   └── assets/           # Imágenes, iconos, etc.
```

## Convenciones de Código

### Nomenclatura

#### Archivos y Carpetas
- Componentes: `PascalCase.tsx` - `LoginForm.tsx`
- Hooks: `camelCase.ts` - `useAuth.ts`
- Utils: `camelCase.ts` - `formatDate.ts`
- Types: `PascalCase.types.ts` - `User.types.ts`
- Constants: `UPPER_SNAKE_CASE.ts` - `API_ENDPOINTS.ts`

#### Variables y Funciones
```typescript
// Variables: camelCase
const userName = 'John';
const isLoggedIn = true;

// Funciones: camelCase, verbos descriptivos
function getUserById(id: number) { }
function handleSubmit() { }
function validateEmail(email: string): boolean { }

// Constantes: UPPER_SNAKE_CASE
const MAX_LOGIN_ATTEMPTS = 3;
const DEFAULT_TIMEOUT = 5000;

// Tipos/Interfaces: PascalCase
interface User { }
type LoanStatus = 'reserved' | 'active' | 'completed';

// Componentes: PascalCase
function LoginForm() { }
export const UserProfile = () => { };
```

### TypeScript

#### Strict Mode
```json
{
  "compilerOptions": {
    "strict": true,
    "noImplicitAny": true,
    "strictNullChecks": true
  }
}
```

#### Preferir Types sobre Interfaces para Shapes
```typescript
// ✅ Preferido
type User = {
  id: number;
  name: string;
  email: string;
};

// ⚠️ Usar Interfaces solo para extensión/implementación
interface UserActions {
  login(): void;
  logout(): void;
}
```

#### No usar `any`
```typescript
// ❌ Evitar
function processData(data: any) { }

// ✅ Usar tipos específicos o unknown
function processData(data: unknown) {
  // Type guard aquí
}
```

### React Components

#### Functional Components con TypeScript
```typescript
// ✅ Componente con props tipadas
type ButtonProps = {
  label: string;
  onClick: () => void;
  variant?: 'primary' | 'secondary';
  disabled?: boolean;
};

export function Button({ label, onClick, variant = 'primary', disabled = false }: ButtonProps) {
  return (
    <button 
      className={`btn btn-${variant}`}
      onClick={onClick}
      disabled={disabled}
    >
      {label}
    </button>
  );
}
```

#### Hooks
```typescript
// Custom hook con tipos
function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(false);
  
  // ... lógica
  
  return { user, loading, login, logout };
}

// Uso
const { user, loading, login } = useAuth();
```

### Estado y Contexto

#### Context Pattern
```typescript
// auth.context.tsx
type AuthContextType = {
  user: User | null;
  login: (credentials: LoginCredentials) => Promise<void>;
  logout: () => void;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  // Estado y lógica
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}
```

### Mock Data y Persistencia

#### LocalStorage Service
```typescript
// storage.service.ts
export const storage = {
  get<T>(key: string): T | null {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : null;
  },
  
  set<T>(key: string, value: T): void {
    localStorage.setItem(key, JSON.stringify(value));
  },
  
  remove(key: string): void {
    localStorage.removeItem(key);
  }
};
```

#### Mock API Pattern
```typescript
// loans.service.ts
export const loansService = {
  async getAll(): Promise<Loan[]> {
    // Simular delay de red
    await delay(500);
    
    const loans = storage.get<Loan[]>('loans') ?? DEFAULT_LOANS;
    return loans;
  },
  
  async create(data: CreateLoanData): Promise<Loan> {
    await delay(500);
    
    const loans = await this.getAll();
    const newLoan: Loan = {
      id: generateId(),
      ...data,
      status: 'reserved',
      createdAt: new Date().toISOString()
    };
    
    storage.set('loans', [...loans, newLoan]);
    return newLoan;
  }
};
```

## Validación de Formularios

> En este proyecto no se usa Zod: la validación vive en `features/*/validation.ts` (funciones puras) y se conecta con React Hook Form mediante `createResolver` en `shared/utils/formResolver.ts`. Los ejemplos de Zod y `zodResolver` de esta sección son de referencia general.

### Zod Schemas
```typescript
import { z } from 'zod';

export const loginSchema = z.object({
  email: z.string().email('Email inválido'),
  password: z
    .string()
    .min(8, 'Mínimo 8 caracteres')
    .regex(/[A-Z]/, 'Debe contener mayúscula')
    .regex(/[a-z]/, 'Debe contener minúscula')
    .regex(/[0-9]/, 'Debe contener número')
});

export type LoginFormData = z.infer<typeof loginSchema>;
```

### React Hook Form
```typescript
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

function LoginForm() {
  const { register, handleSubmit, formState: { errors } } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema)
  });
  
  const onSubmit = (data: LoginFormData) => {
    // Handle login
  };
  
  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <input {...register('email')} />
      {errors.email && <span>{errors.email.message}</span>}
      {/* ... */}
    </form>
  );
}
```

## Error Handling

### Try-Catch Pattern
```typescript
async function handleLogin(credentials: LoginCredentials) {
  try {
    setLoading(true);
    const user = await authService.login(credentials);
    setUser(user);
    toast.success('Login exitoso');
    navigate('/dashboard');
  } catch (error) {
    if (error instanceof ValidationError) {
      toast.error(error.message);
    } else {
      toast.error('Error inesperado. Intenta nuevamente.');
      console.error('Login error:', error);
    }
  } finally {
    setLoading(false);
  }
}
```

## Testing

### Component Testing
```typescript
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { Button } from './Button';

describe('Button', () => {
  it('renders with label', () => {
    render(<Button label="Click me" onClick={() => {}} />);
    expect(screen.getByText('Click me')).toBeInTheDocument();
  });
  
  it('calls onClick when clicked', () => {
    const handleClick = vi.fn();
    render(<Button label="Click" onClick={handleClick} />);
    
    fireEvent.click(screen.getByText('Click'));
    expect(handleClick).toHaveBeenCalledTimes(1);
  });
  
  it('is disabled when disabled prop is true', () => {
    render(<Button label="Click" onClick={() => {}} disabled />);
    expect(screen.getByRole('button')).toBeDisabled();
  });
});
```

## Accesibilidad

### ARIA y Semántica
```tsx
// ✅ Buenas prácticas
<button aria-label="Cerrar modal" onClick={onClose}>
  <XIcon />
</button>

<input 
  type="email"
  id="email"
  aria-invalid={!!errors.email}
  aria-describedby={errors.email ? 'email-error' : undefined}
/>
{errors.email && <span id="email-error" role="alert">{errors.email}</span>}

// Modal accesible
<div role="dialog" aria-modal="true" aria-labelledby="modal-title">
  <h2 id="modal-title">Confirmar acción</h2>
  {/* contenido */}
</div>
```

## Performance

### React Optimization
```typescript
// Memoización de componentes
export const ExpensiveComponent = memo(({ data }: Props) => {
  // render lógica
});

// useMemo para cálculos costosos
const sortedItems = useMemo(() => {
  return items.sort((a, b) => a.name.localeCompare(b.name));
}, [items]);

// useCallback para funciones
const handleDelete = useCallback((id: number) => {
  deleteItem(id);
}, [deleteItem]);
```

### Code Splitting
```typescript
// Lazy loading de páginas
const Dashboard = lazy(() => import('./pages/Dashboard'));
const Inventory = lazy(() => import('./pages/Inventory'));

function App() {
  return (
    <Suspense fallback={<LoadingSpinner />}>
      <Routes>
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/inventory" element={<Inventory />} />
      </Routes>
    </Suspense>
  );
}
```

## Seguridad

### XSS Prevention
```typescript
// ❌ Nunca usar dangerouslySetInnerHTML sin sanitizar
<div dangerouslySetInnerHTML={{ __html: userInput }} />

// ✅ React escapa automáticamente
<div>{userInput}</div>

// ✅ Si necesitas HTML, sanitizar primero
import DOMPurify from 'dompurify';
<div dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(htmlContent) }} />
```

### Validación de Roles
```typescript
// Protected route component
function ProtectedRoute({ children, allowedRoles }: Props) {
  const { user } = useAuth();
  
  if (!user) {
    return <Navigate to="/login" />;
  }
  
  if (!allowedRoles.includes(user.role)) {
    return <Navigate to="/unauthorized" />;
  }
  
  return <>{children}</>;
}

// Uso
<Route 
  path="/admin" 
  element={
    <ProtectedRoute allowedRoles={['admin']}>
      <AdminPanel />
    </ProtectedRoute>
  } 
/>
```

## Code Review Checklist

Antes de crear PR, verificar:

- [ ] Código sigue convenciones de nomenclatura
- [ ] No hay warnings de TypeScript
- [ ] No hay console.logs de debug
- [ ] Componentes tienen tipos correctos
- [ ] Formularios tienen validación
- [ ] Errores son manejados apropiadamente
- [ ] Loading states implementados
- [ ] Componentes son accesibles (ARIA)
- [ ] Mobile responsive verificado
- [ ] Tests agregados para nueva funcionalidad
- [ ] ESLint pasa sin errores
- [ ] Prettier aplicado

---

**Nota para Kiro**: Seguir estas guidelines al generar código para mantener consistencia y calidad.
