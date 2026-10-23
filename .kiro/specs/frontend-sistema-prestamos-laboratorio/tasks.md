# Implementation Plan: Frontend Sistema de Préstamos de Laboratorio

## Overview

Implementación incremental de una SPA React 18 + TypeScript + Vite sin backend real. Toda la persistencia usa `localStorage` con mock data. El plan sigue el orden de dependencias natural: tipos → utilidades → servicios → contextos → componentes compartidos → layouts → router → features → tests. Cada tarea produce código funcional que se integra inmediatamente en la capa anterior.

Las tareas marcadas como **[Post-MVP]** en su título corresponden a requisitos de Release 2 del documento de requisitos y no deben implementarse en la primera entrega.

---

## Tasks

- [x] 1. Setup inicial del proyecto
  - Instalar dependencias base en `sistemas-informacion/`: `react-router-dom@6`, `fast-check`, `vitest`, `@testing-library/react`, `@testing-library/jest-dom`, `@testing-library/user-event`
  - Configurar `vite.config.ts` para incluir alias de rutas (`@/` → `src/`) y soporte de testing con Vitest
  - Crear la estructura de carpetas completa según el diseño: `src/app/`, `src/features/auth/`, `src/features/inventory/`, `src/features/loans/`, `src/features/operations/`, `src/features/dashboard/`, `src/shared/components/ui/`, `src/shared/components/layout/`, `src/shared/components/guards/`, `src/shared/hooks/`, `src/shared/types/`, `src/shared/utils/`, `src/shared/constants/`, `src/services/mockDb/`, `src/contexts/`, `src/__tests__/properties/`, `src/__tests__/unit/`
  - Configurar `tsconfig.app.json` con `strict: true` y paths para el alias `@/`
  - _Requirements: NFR Mantenibilidad 1, 2, 3_

- [x] 2. Tipos TypeScript globales
  - [x] 2.1 Crear `src/shared/types/index.ts` con todas las interfaces y tipos del diseño
    - Implementar: `UserRole`, `User`, `ResourceStatus`, `ResourceType`, `Resource`, `ResourceStatusHistory`, `LoanStatus`, `ResourceCondition`, `Loan`, `Sanction`, `SanctionStatus`, `Session`, `LoanFormData`, `OperationResult<T>`
    - _Requirements: 1.1, 4.2, 8.2, 12.4, 13.4, 22.1, 23.1_
  - [x] 2.2 Crear `src/shared/constants/lsKeys.ts` con el objeto `LS_KEYS` y namespace `sistema-prestamos-lab-`
    - _Requirements: 23.8_

- [x] 3. Utilidades puras
  - [x] 3.1 Crear `src/shared/utils/uuidUtils.ts` con función `generateUUID(): string` usando `crypto.randomUUID()`
    - _Requirements: 23.1_
  - [x] 3.2 Crear `src/shared/utils/hashUtils.ts` con función `hashPassword(password: string): string` (SHA-256 simulado con `crypto.subtle` o implementación determinista para mock)
    - _Requirements: NFR Seguridad 1_
  - [x] 3.3 Crear `src/shared/utils/validators.ts` con todas las funciones de validación puras exportadas individualmente
    - `validatePassword(s: string): boolean` — mínimo 8 chars, mayúscula, minúscula, dígito
    - `passwordsMatch(a: string, b: string): boolean`
    - `validateEmail(email: string): boolean`
    - `validateLoanTimes(start: string, end: string): { valid: boolean; error?: string }` — inicio no pasado, diferencia mínima 1h, máximo 24h
    - `validateMotivo(motivo: string): boolean` — 10–500 chars
    - `validateResourceName(name: string): boolean` — no vacío, max 100 chars
    - `validateQuantity(n: number): boolean` — entero > 0
    - `validateObservaciones(obs: string): boolean` — max 500 chars
    - _Requirements: 1.4, 1.5, 4.4, 4.5, 8.3, 8.4, 8.5, 8.6, 12.7, 17.6, 17.7, 17.8_
  - [x] 3.4 Crear `src/shared/utils/dateUtils.ts` con funciones de formateo y cálculo de fechas
    - `formatDate(iso: string): string` — formato legible en español
    - `formatDateTime(iso: string): string`
    - `calculateDelayHours(realReturn: string, scheduledEnd: string): number` — `max(0, diff)`
    - `isDateInPast(iso: string): boolean`
    - `intervalsOverlap(start1: string, end1: string, start2: string, end2: string): boolean`
    - _Requirements: 8.3, 13.5, 13.11_
  - [x] 3.5 **[SOLID M3 — OCP]** Crear `src/shared/constants/resourceStateMachine.ts` con la máquina de estados declarativa
    - Exportar `RESOURCE_TRANSITIONS: Record<ResourceStatus, ResourceStatus[]>` con todas las transiciones válidas del diseño (Disponible→Reservado, Reservado→En_Préstamo, En_Préstamo→Disponible|En_Mantenimiento, etc.)
    - Función pura `isValidTransition(from: ResourceStatus, to: ResourceStatus): boolean` que consulta la tabla
    - Objetivo SOLID: cerrar la lógica para modificación — agregar una transición solo cambia los datos, no la función. Referencia: análisis SOLID M3 (OCP)
    - _Requirements: 22.8_
  - [x] 3.6 **[SOLID M5 — OCP]** Agregar en `resourceStateMachine.ts` el mapa de estrategia de devolución
    - Exportar `RETURN_CONDITION_STRATEGY: Record<ResourceCondition, { nuevoEstado: ResourceStatus }>` que mapea `Bueno/Regular → Disponible` y `Dañado → En_Mantenimiento`
    - Objetivo SOLID: reemplazar la condicional incrustada en `registerReturn` por una tabla extensible. Referencia: análisis SOLID M5 (Strategy)
    - _Requirements: 13.6, 13.9_

- [ ] 4. Capa de persistencia y servicios mock (MockDB)
  - [x] 4.0 **[SOLID M2 — DIP]** Crear el puerto de persistencia antes de los servicios
    - Crear `src/services/storage/StorageRepository.ts` con la interfaz `StorageRepository` (métodos `get<T>(key): T | null`, `set<T>(key, value): void`, `remove(key): void`)
    - Crear `src/services/storage/LocalStorageRepository.ts` que implementa `StorageRepository` sobre `localStorage` con `try/catch` y serialización JSON
    - Exportar una instancia por defecto; los servicios dependerán de la interfaz, no de `localStorage` directamente
    - Objetivo SOLID: invertir la dependencia alto→bajo; permite sustituir por una API real o un fake en tests. Referencia: análisis SOLID M2 (DIP)
    - _Requirements: 23.1, NFR Mantenibilidad 2_
  - [x] 4.1 Crear `src/services/mockDb/seed-data.ts` con datos iniciales predefinidos
    - Al menos 3 usuarios (uno por rol), 8 recursos variados (Equipo, Herramienta, Material), 5 préstamos en diferentes estados
    - Función `seedData(repo: StorageRepository): void` que escribe los datos vía el repositorio (no `localStorage` directo) bajo las claves `LS_KEYS`
    - _Requirements: 23.2_
  - [x] 4.2 Crear `src/services/mockDb/auth.service.ts`
    - `registerUser(data: RegisterFormData): OperationResult<User>` — valida correo único, contraseña, genera UUID, hashea contraseña
    - `loginUser(correo: string, contrasena: string): OperationResult<Session>` — mensaje de error genérico en fallo, crea `Session` con `expiresAt` a 8h
    - `logoutUser(): void` — elimina la sesión vía el repositorio
    - `getCurrentSession(): Session | null` — lee y valida expiración
    - **[SOLID M1 — SRP + M2 — DIP]** depender de `StorageRepository` (no de `localStorage`); delegar validación a `validators.ts`; delegar hash a `hashUtils` y generación de id a `uuidUtils` — el servicio solo orquesta
    - _Requirements: 1.1–1.11, 19.5, 19.9, 19.10_
  - [x] 4.3 Crear `src/services/mockDb/resources.service.ts`
    - Implementar todas las funciones del contrato del diseño: `getResources`, `getResourceById`, `createResource`, `updateResource`, `retireResource`, `updateResourceStatus`
    - **[SOLID M3 — OCP]** `updateResourceStatus` debe usar `isValidTransition()` de `resourceStateMachine.ts` para validar la transición (no una tabla incrustada), y luego registrar en `ResourceStatusHistory`
    - **[SOLID M1 — SRP]** separar el CRUD de la lógica de transición de estado; delegar validación de campos a `validators.ts`
    - **[SOLID M2 — DIP]** depender de `StorageRepository` en lugar de `localStorage`
    - `retireResource` rechaza si hay préstamos `Reservado` o `En_Préstamo`
    - _Requirements: 4.1–4.11, 22.1–22.10_
  - [x] 4.4 Crear `src/services/mockDb/loans.service.ts`
    - Implementar: `createLoan`, `getLoansByUser`, `getPendingDeliveries`, `getPendingReturns`, `registerDelivery`, `registerReturn`, `checkAvailability`
    - `createLoan`: verificar solapamiento con `intervalsOverlap`, validar tiempos con `validateLoanTimes`, actualizar `cantidadDisponible` del recurso y cambiar estado a `Reservado`
    - `registerDelivery`: cambiar estado a `En_Préstamo`, registrar `fechaHoraEntrega`
    - `registerReturn`: calcular `retrasoHoras` con `calculateDelayHours`, incrementar `cantidadDisponible`
    - **[SOLID M5 — OCP]** determinar el nuevo estado del recurso en `registerReturn` consultando `RETURN_CONDITION_STRATEGY` (no con una condicional `if Dañado`)
    - **[SOLID M1 — SRP]** el servicio orquesta; la validación es pura (`validators`/`dateUtils`) y la persistencia pasa por el repositorio
    - **[SOLID M2 — DIP]** depender de `StorageRepository`
    - _Requirements: 8.1–8.11, 12.1–12.10, 13.1–13.11, 22.2–22.5_
  - [x] 4.5 Crear `src/services/mockDb/users.service.ts`
    - `getUsers(): User[]`, `getUserById(id: string): User | undefined`, `updateUser(id: string, data: Partial<User>): OperationResult<User>`
    - _Requirements: 19.1_
  - [ ] 4.6 Crear `src/services/mockDb/sanctions.service.ts` **[Post-MVP]**
    - `createSanction(data)`, `getSanctionsByUser(userId)`, `liftSanction(id)`, `checkActiveSanction(userId): Sanction | null`
    - Calcular `fechaFin = fechaInicio + diasDemora * 2 días`
    - _Requirements: 14.1–14.10_
  - [x] 4.7 Crear `src/services/mockDb/index.ts` que re-exporta todos los servicios
    - _Requirements: 23.1_
  - [x]* 4.8 Escribir tests unitarios de servicios mockDb
    - Cubrir casos de: registro con correo duplicado, login inválido, creación de préstamo con solapamiento, devolución dañada → `En_Mantenimiento`, retiro de recurso con préstamo activo
    - Usar un **fake** de `StorageRepository` en memoria (habilitado por M2) en lugar de `localStorage` real
    - **[SOLID M8 — LSP]** verificar la postcondición de `OperationResult`: toda función retorna `{ success, data | error }` y nunca lanza excepción
    - _Requirements: 1.3, 1.8, 8.8, 13.9, 4.10_

- [x] 5. Contextos globales
  - [x] 5.1 Crear `src/contexts/AuthContext.tsx`
    - Estado: `session: Session | null`
    - Acciones: `login(correo, contrasena)`, `logout()`, `register(data)`
    - Al montar: leer `LS_KEYS.SESSION` y validar expiración; si expirado, limpiar
    - Custom hook `useAuth()` exportado
    - _Requirements: 1.7, 1.10, 19.5, 19.9_
  - [x] 5.2 Crear `src/contexts/AppDataContext.tsx` usando `useReducer`
    - Estado: `{ resources: Resource[], loans: Loan[], users: User[] }`
    - Al montar: leer vía `StorageRepository`; si no existe `LS_KEYS.INITIALIZED`, ejecutar `ensureSeeded(repo)`
    - Los servicios son los únicos que escriben en el repositorio; tras cada operación exitosa el provider vuelve a leer el estado (no hay `useEffect` de sincronización, para evitar dos escritores sobre el mismo dato)
    - Manejar error si el almacenamiento no está disponible mostrando error bloqueante
    - **[SOLID M2 — DIP]** el contexto recibe/usa `StorageRepository`, no `localStorage` directo
    - _Requirements: 23.1–23.10_
  - [x] 5.3 **[SOLID M4 — SRP + ISP]** Exponer hooks por dominio en lugar de un único `useAppData` ancho
    - Crear selectores/hooks `useResources()`, `useLoans()`, `useUsers()` que devuelvan solo el slice de estado y las acciones de su dominio
    - Los consumidores (ej. `ResourceCard`) dependen solo del hook de su dominio, no de todo el estado global
    - Objetivo SOLID: evitar que un componente dependa de datos que no usa y reducir re-renders. Referencia: análisis SOLID M4 (ISP)
    - _Requirements: 23.1_
  - [x] 5.4 Crear `src/contexts/UIContext.tsx`
    - Estado: `{ toasts: Toast[], isGlobalLoading: boolean }`
    - Acciones: `showToast(type, message)`, `dismissToast(id)`, `setGlobalLoading(bool)`
    - Custom hook `useToast()` exportado
    - _Requirements: 18.3, 18.4, 18.8, 18.9, 18.10_

- [ ] 6. Checkpoint — Verificar servicios y contextos
  - Asegurarse de que todos los tests pasan, los contextos leen y escriben en localStorage correctamente, y `seedData()` produce datos válidos. Preguntar al usuario si hay dudas.

- [ ] 7. Componentes UI compartidos
  - [ ] 7.1 Crear `src/shared/components/ui/Button.tsx`
    - Props: `variant` (primary/secondary/danger/ghost), `size`, `loading`, `disabled`, `type`, `onClick`, `children`
    - Mostrar spinner cuando `loading=true` y deshabilitar el botón
    - Tamaño mínimo táctil 44×44px, atributos ARIA apropiados
    - _Requirements: 16.7, 17.4, 18.2, 18.5, 21.11_
  - [ ] 7.2 Crear `src/shared/components/ui/Input.tsx`
    - Props: `label`, `error`, `required`, `hint`, `maxLength`, `showCharCount`
    - Mostrar asterisco en label si `required`, contador de caracteres si `maxLength`, mensaje de error debajo con color rojo
    - Asociar `<label>` con `htmlFor`, atributo `aria-describedby` apuntando al mensaje de error
    - _Requirements: 17.1–17.9, 21.6, 21.7_
  - [ ] 7.3 Crear `src/shared/components/ui/Select.tsx`
    - Props: `label`, `options`, `error`, `required`
    - Mismo patrón de accesibilidad que `Input`
    - _Requirements: 17.1, 21.6_
  - [ ] 7.4 Crear `src/shared/components/ui/Modal.tsx`
    - Subcomponentes: `Modal.Header`, `Modal.Body`, `Modal.Footer`
    - Cerrar con tecla Escape, foco atrapado dentro del modal mientras está abierto
    - Pantalla completa en móvil (<768px), `role="dialog"`, `aria-modal="true"`, `aria-labelledby`
    - _Requirements: 16.9, 21.9, 21.10_
  - [ ] 7.5 Crear `src/shared/components/ui/Toast.tsx` y `ToastContainer.tsx`
    - `Toast`: props `type` (success/error/info), `message`, `onClose`; auto-cierre en 3s para success
    - `ToastContainer`: apila toasts en esquina superior derecha, máximo visible simultáneamente
    - _Requirements: 18.3, 18.4, 18.9, 18.10_
  - [ ] 7.6 Crear `src/shared/components/ui/SkeletonLoader.tsx`
    - Variantes: `line`, `card`, `table-row`
    - Usar animación CSS pulse
    - _Requirements: 18.6, 18.7_
  - [ ] 7.7 Crear `src/shared/components/ui/StatusBadge.tsx`
    - Props: `status: ResourceStatus | LoanStatus`
    - Colores por estado: verde (Disponible), amarillo (Reservado), azul (En_Préstamo), naranja (En_Mantenimiento), gris (Dado_de_Baja), rojo (Vencido)
    - _Requirements: 22.10_
  - [ ] 7.8 Crear `src/shared/components/ui/Breadcrumb.tsx`
    - Props: `items: { label: string; href?: string }[]`
    - Último item sin href (página actual), color diferente
    - En móvil mostrar solo último nivel con botón "Atrás"
    - `aria-label="breadcrumb"`, `aria-current="page"` en último item
    - _Requirements: 20.1–20.5, 21.1_
  - [ ]* 7.9 Escribir tests unitarios de componentes UI compartidos
    - Cubrir: Button muestra spinner en loading, Input muestra error, Modal cierra con Escape, Toast desaparece en 3s
    - _Requirements: 17.2, 18.2, 18.3, 21.9_

- [ ] 8. Layouts
  - [ ] 8.1 Crear `src/shared/components/layout/AuthLayout.tsx`
    - Contenedor centrado sin navegación, semántica HTML5 con `<main>`
    - _Requirements: 21.8_
  - [ ] 8.2 Crear `src/shared/components/layout/Sidebar.tsx`
    - Mostrar solo opciones permitidas para el rol del usuario autenticado (leer `useAuth()`)
    - Resaltar sección activa con color de fondo distintivo
    - Colapsable en escritorio con secciones principales
    - _Requirements: 19.4, 20.6, 20.7_
  - [ ] 8.3 Crear `src/shared/components/layout/AppShell.tsx`
    - Compone: `<header>`, `<nav>` (Sidebar), `<main>` con `<Breadcrumb>`, `<footer>`
    - Header: título de la app + nombre del usuario + botón de cerrar sesión visible en todas las páginas
    - Menú hamburguesa colapsable en móvil (<768px), menú horizontal en escritorio (≥768px)
    - Breadcrumbs automáticos usando la ruta actual de React Router
    - _Requirements: 1.9, 16.2, 16.3, 20.1, 20.8, 20.9, 20.10, 21.8_

- [ ] 9. Guardias de router y configuración de rutas
  - [ ] 9.1 Crear `src/shared/components/guards/PrivateRoute.tsx`
    - Leer `useAuth()`; si no hay sesión redirigir a `/login`
    - _Requirements: 1.11, 19.9_
  - [ ] 9.2 Crear `src/shared/components/guards/RoleGuard.tsx`
    - Props: `allowedRoles: UserRole[]`; si el rol no está permitido redirigir a `/access-denied`
    - _Requirements: 19.1–19.3, 19.6–19.8_
  - [ ] 9.3 Crear `src/app/router.tsx` con `createBrowserRouter` y todas las rutas del diseño
    - Rutas públicas: `/login`, `/register`
    - Rutas privadas con `PrivateRoute` + `RoleGuard` según tabla del diseño
    - Rutas utilitarias: `/access-denied`, `*` → 404
    - _Requirements: 19.1–19.10_
  - [ ] 9.4 Crear `src/app/providers.tsx` que compone `AuthProvider > AppDataProvider > UIProvider`
    - Incluir `ToastContainer` dentro del árbol de providers
    - _Requirements: 23.7_
  - [ ] 9.5 Actualizar `src/app/App.tsx` y `src/main.tsx` para usar `RouterProvider` y `providers.tsx`
    - _Requirements: 23.1_

- [ ] 10. Checkpoint — Verificar navegación y guardias
  - Confirmar que rutas protegidas redirigen correctamente sin sesión, que el rol controla el acceso, y que el layout se renderiza sin errores. Preguntar al usuario si hay dudas.

- [ ] 11. Feature: Autenticación
  - [ ] 11.1 Crear `src/features/auth/components/LoginForm.tsx`
    - Campos: correo electrónico, contraseña
    - Validación en tiempo real post-primer-submit usando `validators.ts`
    - Botón deshabilitado mientras hay errores o cargando
    - Enlace "¿Olvidaste tu contraseña?" visible (redirige a placeholder Post-MVP)
    - _Requirements: 1.6, 1.8, 17.1–17.10_
  - [ ] 11.2 Crear `src/features/auth/components/RegisterForm.tsx`
    - Campos: nombre completo, correo electrónico, contraseña, confirmación de contraseña, rol (Select)
    - Validaciones: contraseña fuerte, coincidencia de contraseñas, correo único
    - _Requirements: 1.1–1.5, 17.1–17.10_
  - [ ] 11.3 Crear `src/features/auth/hooks/useLoginForm.ts` y `useRegisterForm.ts`
    - Encapsular estado del formulario, validación y llamada a `useAuth()`
    - _Requirements: 1.7, 1.2_
  - [ ] 11.4 Crear `src/features/auth/pages/LoginPage.tsx` y `RegisterPage.tsx`
    - Usar `AuthLayout`, renderizar formularios, manejar toast de error/éxito
    - Redirigir a `/dashboard` tras login exitoso
    - _Requirements: 1.7, 1.2_
  - [ ]* 11.5 Escribir tests unitarios del flujo de autenticación
    - Cubrir: login válido redirige al dashboard, login inválido muestra error genérico, registro con correo duplicado muestra error
    - _Requirements: 1.7, 1.8, 1.3_

- [ ] 12. Feature: Inventario (Administrador_Laboratorio)
  - [ ] 12.1 Crear `src/features/inventory/components/ResourceForm.tsx`
    - Campos: nombre, tipo (Select), descripción, imagen (file upload JPG/PNG/WEBP ≤5MB), cantidad, estado inicial
    - Validaciones inline usando `validators.ts`
    - Modo crear y modo editar (props opcionales con datos actuales)
    - _Requirements: 4.2–4.5, 4.11, 17.1–17.10_
  - [ ] 12.2 Crear `src/features/inventory/components/InventoryTable.tsx`
    - Tabla responsive: versión simplificada en móvil con opción expandir
    - Columnas: nombre, tipo, estado (StatusBadge), cantidad disponible, acciones (editar, dar de baja)
    - _Requirements: 4.6, 16.4_
  - [ ] 12.3 Crear `src/features/inventory/components/ResourceCard.tsx`
    - Mostrar: nombre, tipo, descripción, imagen con lazy loading, cantidad disponible, estado (StatusBadge)
    - Botón "Solicitar Préstamo" solo si el usuario es Estudiante y el recurso está Disponible
    - _Requirements: 6.9, 8.1, NFR Rendimiento 3_
  - [ ] 12.4 Crear `src/features/inventory/hooks/useInventory.ts`
    - Fachada sobre el hook de dominio `useResources()` (M4) y `resources.service`: `createResource`, `updateResource`, `retireResource`
    - Disparar `showToast` de `useToast()` en éxito/error
    - _Requirements: 4.3, 4.8, 4.9_
  - [ ] 12.5 Crear `src/features/inventory/pages/InventoryPage.tsx`
    - Listado con `InventoryTable`, botón "Nuevo Recurso", skeleton loader mientras carga
    - _Requirements: 4.1, 4.6, 18.6_
  - [ ] 12.6 Crear `src/features/inventory/pages/ResourceFormPage.tsx`
    - Ruta `/inventory/new` y `/inventory/:id/edit`; usa `ResourceForm`
    - _Requirements: 4.7, 4.8_
  - [ ]* 12.7 Escribir tests unitarios del feature de inventario
    - Cubrir: crear recurso válido, editar recurso, dar de baja con préstamo activo (error), estado inicial Disponible
    - _Requirements: 4.3, 4.9, 4.10, 22.1_

- [ ] 13. Feature: Consulta de Disponibilidad
  - [ ] 13.1 Crear `src/features/loans/hooks/useAvailability.ts`
    - Filtros: texto de búsqueda (debounced), tipo de recurso, fecha, hora
    - Exponer lista filtrada de recursos Disponibles
    - Usar `useDebounce` de `src/shared/hooks/`
    - _Requirements: 6.2–6.11_
  - [ ] 13.2 Crear `src/shared/hooks/useDebounce.ts`
    - _Requirements: NFR Rendimiento 2_
  - [ ] 13.3 Crear `src/features/loans/pages/AvailabilityPage.tsx`
    - Campo de búsqueda por nombre, filtro por tipo (Select), selector de fecha y hora
    - Lista de `ResourceCard` con skeleton loader en carga inicial
    - Orden alfabético por defecto
    - Mostrar "No disponible" con próxima fecha cuando `cantidadDisponible === 0`
    - _Requirements: 6.1–6.11, 18.6_
  - [ ]* 13.4 Escribir tests unitarios de disponibilidad
    - Cubrir: filtrado por nombre, filtrado por tipo, filtrado por horario con solapamiento
    - _Requirements: 6.4, 6.6, 6.8_

- [ ] 14. Feature: Préstamos (Estudiante)
  - [ ] 14.1 Crear `src/features/loans/components/LoanForm.tsx`
    - Campos: fecha de inicio, hora de inicio, hora de fin, motivo del préstamo
    - Validación completa con `validateLoanTimes` y `validateMotivo`
    - Spinner de carga mientras se procesa, botón deshabilitado durante envío
    - _Requirements: 8.2–8.6, 8.10, 17.1–17.10, 18.1, 18.2_
  - [ ] 14.2 Crear `src/features/loans/hooks/useLoans.ts`
    - Fachada sobre `loans.service`: `createLoan`, `getLoansByUser`
    - Disparar toast en éxito y navegar a `/loans/my` tras préstamo creado
    - _Requirements: 8.7, 8.11_
  - [ ] 14.3 Crear `src/features/loans/pages/LoanFormPage.tsx`
    - Ruta `/loans/new/:resourceId`; cargar datos del recurso, renderizar `LoanForm`
    - _Requirements: 8.1, 8.2_
  - [ ] 14.4 Crear `src/features/loans/components/LoanCard.tsx`
    - Mostrar: nombre del recurso, fecha/hora inicio-fin, estado (StatusBadge), motivo
    - _Requirements: 8.11_
  - [ ] 14.5 Crear `src/features/loans/pages/MyLoansPage.tsx`
    - Lista de `LoanCard` del usuario autenticado, skeleton loader, estado vacío
    - _Requirements: 8.11, 18.6_
  - [ ]* 14.6 Escribir tests unitarios del feature de préstamos
    - Cubrir: préstamo válido crea estado Reservado, solapamiento rechazado, validación de tiempos
    - _Requirements: 8.7, 8.8, 8.3–8.5_

- [ ] 15. Checkpoint — Verificar ciclo de vida básico de préstamo
  - Confirmar que el flujo Disponibilidad → Solicitar Préstamo → Mis Préstamos funciona de extremo a extremo con datos mock. Preguntar al usuario si hay dudas.

- [ ] 16. Feature: Operaciones (Técnico_Laboratorio)
  - [ ] 16.1 Crear `src/features/operations/components/DeliveryForm.tsx`
    - Campos: condición (Select: Bueno/Regular/Dañado), observaciones
    - Observaciones obligatorias si condición es "Dañado"
    - _Requirements: 12.4, 12.5, 12.7, 12.8_
  - [ ] 16.2 Crear `src/features/operations/hooks/useDeliveries.ts`
    - `getPendingDeliveries()` ordenado por hora de inicio más antigua primero
    - `registerDelivery(loanId, data)` con toast en éxito
    - _Requirements: 12.1, 12.2, 12.6_
  - [ ] 16.3 Crear `src/features/operations/pages/DeliveryPage.tsx`
    - Lista de entregas pendientes ordenadas, modal con `DeliveryForm` al seleccionar
    - Eliminar de lista al procesar exitosamente
    - _Requirements: 12.1–12.10_
  - [ ] 16.4 Crear `src/features/operations/components/ReturnForm.tsx`
    - Campos: condición, observaciones; mostrar demora calculada en tiempo real
    - _Requirements: 13.4, 13.8_
  - [ ] 16.5 Crear `src/features/operations/hooks/useReturns.ts`
    - `getPendingReturns()` ordenado por hora de fin más antigua; indicar visualmente retrasos en rojo
    - `registerReturn(loanId, data)` con toast mostrando demora
    - _Requirements: 13.1–13.3, 13.5–13.11_
  - [ ] 16.6 Crear `src/features/operations/pages/ReturnPage.tsx`
    - Lista de devoluciones pendientes; préstamos con demora resaltados en rojo
    - Modal con `ReturnForm` al seleccionar
    - _Requirements: 13.1–13.11_
  - [ ]* 16.7 Escribir tests unitarios del feature de operaciones
    - Cubrir: entrega cambia estado a En_Préstamo, devolución buena → Disponible, devolución dañada → En_Mantenimiento, demora calculada correctamente
    - _Requirements: 12.6, 13.6, 13.9, 13.11_

- [ ] 17. Feature: Dashboard por rol
  - [ ] 17.1 Crear `src/features/dashboard/pages/DashboardPage.tsx`
    - Renderizar vista diferente según `session.role` usando componentes condicionales
    - **Estudiante**: resumen de mis préstamos activos, acceso rápido a disponibilidad
    - **Técnico_Laboratorio**: contadores de entregas y devoluciones pendientes, acceso rápido
    - **Administrador_Laboratorio**: resumen del inventario (total, disponibles, en mantenimiento), contadores de préstamos activos
    - Skeleton loaders en contadores mientras carga
    - _Requirements: 19.4, 19.6, 19.7, 19.8, 18.6_

- [ ] 18. Páginas utilitarias
  - [ ] 18.1 Crear `src/shared/components/guards/AccessDeniedPage.tsx`
    - Mensaje claro de acceso denegado, botón para volver al dashboard
    - _Requirements: 19.2, 19.3_
  - [ ] 18.2 Crear `src/shared/pages/NotFoundPage.tsx`
    - Mensaje 404, enlace al dashboard
    - _Requirements: 20.9_

- [ ] 19. Tests de propiedades PBT (fast-check)
  - [ ] 19.1 Crear `src/__tests__/properties/validators.property.test.ts`
    - **Propiedad 1**: `validatePassword(s)` retorna `true` sii longitud ≥ 8, tiene mayúscula, minúscula y dígito — `// Feature: frontend-sistema-prestamos-laboratorio, Property 1`
    - **Propiedad 2**: `passwordsMatch(a, b)` retorna `false` para todo par donde `a !== b` — `// Feature: frontend-sistema-prestamos-laboratorio, Property 2`
    - **Propiedad 6**: `validateLoanTimes(inicio, fin)` retorna `false` si inicio en pasado, diferencia < 1h, o diferencia > 24h — `// Feature: frontend-sistema-prestamos-laboratorio, Property 6`
    - _Requirements: 1.4, 1.5, 8.3, 8.4, 8.5_
  - [ ] 19.2 Crear `src/__tests__/properties/resources.property.test.ts`
    - **Propiedad 4**: `filterByName(R, t)` retorna subconjunto con longitud ≤ `R.length` y todos los elementos contienen `t` — `// Feature: frontend-sistema-prestamos-laboratorio, Property 4`
    - **Propiedad 5**: ningún recurso retornado por `getAvailableResources(inicio, fin)` tiene préstamo activo solapado — `// Feature: frontend-sistema-prestamos-laboratorio, Property 5`
    - **Propiedad 10**: `updateResourceStatus` rechaza transiciones no presentes en la tabla de transiciones válidas — `// Feature: frontend-sistema-prestamos-laboratorio, Property 10`
    - _Requirements: 6.4, 6.8, 6.11, 22.8_
  - [ ] 19.3 Crear `src/__tests__/properties/loans.property.test.ts`
    - **Propiedad 3**: `loginUser` con credenciales no registradas retorna `success: false` con mensaje genérico invariable — `// Feature: frontend-sistema-prestamos-laboratorio, Property 3`
    - **Propiedad 7**: `createLoan` con datos válidos retorna `Loan.estadoPrestamo === 'Reservado'` — `// Feature: frontend-sistema-prestamos-laboratorio, Property 7`
    - **Propiedad 8**: `calculateDelayHours(devReal, finProgramada) === max(0, diff)` — `// Feature: frontend-sistema-prestamos-laboratorio, Property 8`
    - **Propiedad 9**: `registerReturn` con condición Dañado deja el recurso en `En_Mantenimiento` — `// Feature: frontend-sistema-prestamos-laboratorio, Property 9`
    - _Requirements: 1.8, 8.7, 13.5, 13.9, 13.11, 22.2, 22.5_
  - [ ] 19.4 Crear `src/__tests__/properties/serialization.property.test.ts`
    - **Propiedad 11**: `JSON.parse(JSON.stringify(obj))` produce objeto estructuralmente equivalente para `Resource`, `User`, `Loan` — `// Feature: frontend-sistema-prestamos-laboratorio, Property 11`
    - _Requirements: 23.5, 23.6_

- [ ] 20. Tests unitarios de ejemplo
  - [ ]* 20.1 Crear `src/__tests__/unit/auth.test.ts`
    - Login válido retorna Session con rol correcto
    - Login inválido retorna error genérico (no distingue correo/contraseña)
    - Registro con correo duplicado falla
    - Registro con contraseña débil falla
    - _Requirements: 1.3, 1.7, 1.8_
  - [ ]* 20.2 Crear `src/__tests__/unit/loanService.test.ts`
    - Préstamo en horario ocupado es rechazado
    - Préstamo válido crea estado Reservado y reduce `cantidadDisponible`
    - Entrega cambia estado a En_Préstamo
    - Devolución buena devuelve recurso a Disponible e incrementa `cantidadDisponible`
    - Devolución dañada lleva recurso a En_Mantenimiento
    - _Requirements: 8.7–8.9, 12.6, 13.6, 13.7, 13.9_
  - [ ]* 20.3 Crear `src/__tests__/unit/resourceService.test.ts`
    - Nuevo recurso se inicializa con estado Disponible
    - Dar de baja con préstamo activo falla con mensaje descriptivo
    - Transición válida de estado actualiza historial
    - _Requirements: 4.9, 4.10, 22.1, 22.9_

- [ ] 21. Ajustes finales de accesibilidad y responsive
  - [ ] 21.1 Auditar y completar atributos ARIA en todos los componentes interactivos
    - Verificar `aria-live="polite"` en áreas de mensajes de error de formularios
    - Verificar `aria-label` descriptivo en todos los botones de acción
    - Verificar landmarks: `<header>`, `<nav>`, `<main>`, `<aside>`, `<footer>` presentes en `AppShell`
    - _Requirements: 21.1, 21.7, 21.8, 21.11_
  - [ ] 21.2 Verificar y ajustar contraste de colores y foco de teclado
    - Contraste mínimo 4.5:1 para texto normal, 3:1 para texto grande (WCAG AA)
    - Indicador de foco visible en todos los elementos interactivos
    - Orden lógico de tabulación en todos los formularios y páginas
    - _Requirements: 21.2, 21.3, 21.4_
  - [ ] 21.3 Validar y completar textos alternativos e imágenes
    - Atributo `alt` descriptivo en imágenes de recursos
    - _Requirements: 21.5_
  - [ ] 21.4 Verificar y ajustar diseño responsive en breakpoints definidos
    - Móvil (<768px): menú hamburguesa, campos apilados, modales pantalla completa, fuente ≥14px, botones ≥44×44px
    - Tablet (768px–1024px) y escritorio (>1024px): menú horizontal, tabla completa
    - _Requirements: 16.1–16.10_

- [ ] 22. Checkpoint final — Validación completa
  - Ejecutar todos los tests (`vitest --run`) y confirmar que pasan. Verificar flujo completo: registro → login → consulta → préstamo → entrega → devolución. Preguntar al usuario si hay dudas antes de considerar el MVP completo.

---

## Post-MVP (Release 2)

> Las siguientes tareas implementan los Requisitos 2, 3, 5, 7, 9, 10, 11, 14 y 15. No forman parte del MVP y deben planificarse en un sprint separado.

- [ ] 23. [Post-MVP] Recuperación de contraseña
  - Página de "¿Olvidaste tu contraseña?" con formulario de correo
  - Simulación de envío de correo y token con validez de 1 hora en localStorage
  - Página de restablecimiento con token en URL
  - _Requirements: 2.1–2.8_

- [ ] 24. [Post-MVP] Autenticación de dos factores
  - Configuración en perfil de usuario (habilitar/deshabilitar 2FA)
  - Generación de código QR simulado y clave secreta
  - Pantalla de verificación de código 6 dígitos con bloqueo tras 3 intentos fallidos
  - _Requirements: 3.1–3.7_

- [ ] 25. [Post-MVP] Cancelación de reservas (Estudiante)
  - Botón "Cancelar" en `LoanCard` para préstamos en estado Reservado
  - Diálogo de confirmación, validación de 2 horas mínimas de anticipación
  - Servicio `cancelLoan` en `loans.service.ts`
  - _Requirements: 11.1–11.8_

- [ ] 26. [Post-MVP] Importación y exportación CSV
  - Botones "Exportar" e "Importar" en `InventoryPage`
  - Servicio `exportInventoryCSV` y `importInventoryCSV` con validación de formato y vista previa
  - _Requirements: 5.1–5.8_

- [ ] 27. [Post-MVP] Calendario visual de disponibilidad
  - Vista de calendario mensual/semanal/diaria en `AvailabilityPage`
  - Días con disponibilidad en verde, sin disponibilidad en rojo, etiquetas de reservas
  - _Requirements: 7.1–7.7_

- [ ] 28. [Post-MVP] Notificaciones de disponibilidad
  - Botón "Notificarme" en recursos no disponibles
  - Panel de notificaciones en header, historial de 7 días
  - _Requirements: 9.1–9.7_

- [ ] 29. [Post-MVP] Reservas recurrentes
  - Opción en `LoanForm` para habilitar recurrencia semanal
  - Validación de hasta 12 semanas, creación de múltiples préstamos, gestión de conflictos
  - _Requirements: 10.1–10.8_

- [ ] 30. [Post-MVP] Gestión de sanciones
  - `SanctionsPage` para Administrador_Laboratorio
  - Aplicación automática de sanción al registrar devolución con demora > 24h
  - Bloqueo de préstamos para estudiantes sancionados
  - _Requirements: 14.1–14.10_

- [ ] 31. [Post-MVP] Reportes de préstamos
  - `ReportsPage` con filtros de fecha, tipo, estado, estudiante
  - Tabla ordenable, estadísticas calculadas, exportación PDF y CSV
  - _Requirements: 15.1–15.10_

---

## Notes

- Tareas marcadas con `*` son opcionales (tests) y pueden omitirse para un MVP más rápido
- El orden de tareas 1–22 es el orden recomendado de implementación; las dependencias entre módulos lo imponen
- Cada servicio en `mockDb` retorna `OperationResult<T>` — nunca lanza excepciones no controladas
- Los tests PBT (tarea 19) usan `fast-check` con mínimo 100 iteraciones por propiedad
- La propiedad `cantidadDisponible` del recurso debe mantenerse consistente con los préstamos activos en todo momento
- El namespace de localStorage `sistema-prestamos-lab-` debe usarse en todas las operaciones de persistencia
- Las funciones de `validators.ts` y `dateUtils.ts` son puras — no dependen de estado global, lo que las hace ideales para PBT

### Mejoras SOLID integradas

Las subtareas marcadas con **[SOLID M*]** aplican las recomendaciones del análisis en `.kiro/specs/analisis-solid/solid-analysis.md`, incorporándolas desde el inicio para evitar reproceso:

| Mejora | Principio | Dónde se aplica |
|---|---|---|
| M2 | DIP | Puerto `StorageRepository` (tarea 4.0); inyectado en servicios (4.2–4.4) y contextos (5.2) |
| M1 | SRP | Servicios orquestan; validación pura y persistencia separadas (4.2–4.4) |
| M3 | OCP | Máquina de estados declarativa `resourceStateMachine.ts` (tarea 3.5) usada en 4.3 |
| M5 | OCP | Estrategia de devolución por `ResourceCondition` como tabla (tarea 3.6) usada en 4.4 |
| M4 | SRP + ISP | Hooks por dominio `useResources`/`useLoans`/`useUsers` (tarea 5.3) |
| M8 | LSP | Postcondiciones de `OperationResult` verificadas en tests (ver 4.8 y PBT) |

> M6 y M7 son refinamientos de baja prioridad; se aplican de forma oportunista durante la implementación.

## Task Dependency Graph

```json
{
  "waves": [
    { "id": 0, "tasks": ["2.1", "2.2"] },
    { "id": 1, "tasks": ["3.1", "3.2", "3.3", "3.4"] },
    { "id": 2, "tasks": ["4.1", "4.2", "4.3", "4.4", "4.5", "4.6", "4.7"] },
    { "id": 3, "tasks": ["5.1", "5.2", "5.3", "4.8"] },
    { "id": 4, "tasks": ["7.1", "7.2", "7.3", "7.4", "7.5", "7.6", "7.7", "7.8", "8.1"] },
    { "id": 5, "tasks": ["7.9", "8.2", "8.3", "13.2"] },
    { "id": 6, "tasks": ["9.1", "9.2"] },
    { "id": 7, "tasks": ["9.3", "9.4"] },
    { "id": 8, "tasks": ["9.5"] },
    { "id": 9, "tasks": ["11.1", "11.2", "11.3"] },
    { "id": 10, "tasks": ["11.4", "12.1", "12.2", "12.3", "12.4", "13.1"] },
    { "id": 11, "tasks": ["11.5", "12.5", "12.6", "13.3", "14.1", "14.2"] },
    { "id": 12, "tasks": ["12.7", "13.4", "14.3", "14.4", "14.5", "16.1", "16.2"] },
    { "id": 13, "tasks": ["14.6", "16.3", "16.4", "16.5"] },
    { "id": 14, "tasks": ["16.6", "16.7", "17.1"] },
    { "id": 15, "tasks": ["18.1", "18.2"] },
    { "id": 16, "tasks": ["19.1", "19.2", "19.3", "19.4"] },
    { "id": 17, "tasks": ["20.1", "20.2", "20.3"] },
    { "id": 18, "tasks": ["21.1", "21.2", "21.3", "21.4"] }
  ]
}
```
