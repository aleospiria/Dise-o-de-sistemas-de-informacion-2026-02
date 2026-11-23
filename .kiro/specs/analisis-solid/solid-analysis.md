# Plantilla de Análisis Principios SOLID

**Proyecto:** Sistema de Gestión de Préstamo de Recursos de Laboratorio
**Integrante:** Victor Alejandro Aristizabal Ospina
**Docente:** Alejandra Guerrero Bocanegra
**Curso:** Diseño de Sistemas de Información — ITM
**Entregable:** No. 2 — Anexo de la Sección 7 (soporte de la Sección 6, "Aplicación de Principios SOLID")
**Fecha:** 26/10/2026
**Versión del código analizada:** commit `fcad2f3` (rama `main`), MVP del frontend terminado

> Instrumento de apoyo para justificar los principios SOLID dentro del alcance de un producto mínimo viable. Este documento diligencia la plantilla oficial sobre el **código implementado**, no sobre el diseño. Reemplaza al análisis del 14/10/2026, que evaluaba el diseño antes de escribir código; ese diagnóstico original (calificaciones y definiciones de las mejoras M1–M8) sigue disponible con `git show a81f9ed:.kiro/specs/analisis-solid/solid-analysis.md`.

> **Nota sobre la numeración.** La plantilla oficial pasa de la sección 7 a la sección 9 y no tiene sección 8. Se conserva su numeración tal cual (1–7 y 9).

> **Nota de coherencia con el modelo C4.** El diagrama C4 del Entregable 2 no estaba en el repositorio al redactar este anexo. Los nombres de componentes que aparecen aquí son los del código. La tabla 3.2 propone la correspondencia con los niveles C4 y es una **propuesta**: debe alinearse con el diagrama final antes de entregar.

> **Convención de rutas.** Las rutas son relativas a `sistemas-informacion/src/` salvo que se indique otra raíz. El formato `archivo:línea` vale para el commit `fcad2f3`.

---

## 1. Información general

| Campo | Valor |
|---|---|
| **Lenguaje / Framework** | TypeScript 6 (modo `strict`) + React 19 + Vite 8 + React Router 7 + React Hook Form 7. Estilos con CSS Modules. Pruebas con Vitest 5, Testing Library y fast-check 4. SPA sin backend; persistencia simulada en `localStorage`. |
| **Tipo de análisis** | Estático sobre el código implementado del MVP, contrastado con la suite automática (350 pruebas, todas en verde) y con un experimento de extensión ejecutado sobre una copia del proyecto (sección 5.2). |
| **Contexto** | Proyecto de aula, alcance MVP (Release 1). Continuación del Entregable 1: los requisitos de usuario RU-01 a RU-06, los requisitos funcionales RF-01 a RF-06, las reglas de negocio RN-01 a RN-05 y las historias HU-01 a HU-06 se materializaron en las capas `features/`, `contexts/`, `services/` y `shared/`. La trazabilidad completa está en el anexo A de este documento. |

Detalle del contexto:

- **Qué evolucionó entre el Entregable 1 y el 2.** El diagrama de clases (`Usuario`, `Rol`, `Recurso`, `Prestamo`, `EstadoRecurso`) pasó a tipos de dominio (`User`, `UserRole`, `Resource`, `Loan`, `ResourceStatusHistory` en `shared/types/index.ts`) y a servicios de dominio (`loans.service`, `resources.service`, `auth.service`, `users.service`). Las historias de usuario pasaron a las carpetas `features/auth`, `features/loans`, `features/inventory` y `features/operations`.
- **Qué NO se implementó del Entregable 1.** RN-03 (máximo 3 préstamos activos), RN-05 (horario operativo), validación de formato y unicidad de la cédula, rol Docente, cancelación de reservas y todo el story mapping Post-MVP. El anexo B lo detalla.
- **Qué no es verificable aquí.** Los requisitos no funcionales RNF-01 a RNF-03 (tiempos, clics, navegadores) no se midieron. RNF-04 (escalabilidad de la base de datos) no aplica sin backend.

---

## 2. Objetivo del análisis

Determinar en qué medida el frontend MVP del sistema de préstamo de recursos de laboratorio cumple los cinco principios SOLID, usando como evidencia el código del commit `fcad2f3`, sus pruebas automáticas y la historia de commits entre el Entregable 1 y el Entregable 2.

**Alcance.** Se analizan los componentes que evolucionaron desde el Entregable 1: los servicios de dominio de préstamos y recursos, las validaciones puras de formularios, las tablas declarativas de estados, navegación y paneles, el puerto de almacenamiento con sus dos adaptadores, los contextos de estado por dominio y la raíz de composición. **Fuera de alcance:** el diseño visual, el rendimiento, la accesibilidad (cubierta por `__tests__/unit/accessibility.test.tsx`) y las funciones Post-MVP, que no existen en el código.

Como el proyecto está escrito en TypeScript funcional y no usa herencia de clases de dominio, **LSP se evalúa como sustituibilidad de contratos** (una implementación de una interfaz puede reemplazar a otra sin que el cliente cambie), no como relación entre superclase y subclase.

---

## 3. Descripción breve del componente

**Componente analizado:** frontend MVP del sistema de préstamo de recursos de laboratorio (capas `app/`, `features/`, `contexts/`, `services/` y `shared/`).

**Función principal:**
Permitir que un estudiante consulte la disponibilidad de recursos y solicite un préstamo, que un técnico registre la entrega y la devolución (con cálculo de retraso) y que un administrador gestione el inventario, todo con control de acceso por rol y sin backend.

**Responsabilidades actuales:**
- Autenticación y sesión (registro, inicio y cierre de sesión, expiración a las 8 horas).
- Consulta de disponibilidad por franja horaria y filtros.
- Ciclo del préstamo: reservar, entregar, devolver, con descuento y reposición de stock.
- Máquina de estados del recurso con historial de cambios.
- Gestión de inventario (alta, edición, baja con regla de préstamos activos).
- Navegación, guardias de ruta y paneles por rol.
- Persistencia simulada detrás de un puerto (`StorageRepository`).

**Clases / interfaces involucradas:**
- Puerto y adaptadores: `StorageRepository`, `LocalStorageRepository`, `InMemoryStorageRepository`.
- Contrato de resultado: `OperationResult<T>`.
- Servicios de dominio: `services/mockDb/loans.service.ts`, `resources.service.ts`, `auth.service.ts`, `users.service.ts`, `seed-data.ts`.
- Contextos: `ResourcesContextValue`, `LoansContextValue`, `UsersContextValue`, `AuthContextValue`, `UIContextValue`.
- Tablas declarativas: `RESOURCE_TRANSITIONS`, `RETURN_CONDITION_STRATEGY`, `NAV_GROUPS`, `DASHBOARD_VIEWS`, `STATUS_BADGE`, `ROLE_LABELS`, `RESOURCE_TYPE_LABELS`.
- Validación pura: `shared/utils/validators.ts`, `shared/utils/dateUtils.ts`, `features/*/validation.ts`, `shared/utils/formResolver.ts`.

**Dependencias principales:**
React 19, React Router 7, React Hook Form 7 (Zod y `@hookform/resolvers` están instalados, pero ningún archivo de `src/` los importa) y el `localStorage` del navegador, que solo toca `services/storage/LocalStorageRepository.ts` (líneas 14, 25 y 36).

**Relación con otros módulos:**
Las páginas de cada feature usan hooks propios (`useLoanForm`, `useMyLoans`, `useReturns`, …) que consumen los contextos; los contextos invocan a los servicios; los servicios leen y escriben solo a través del puerto. `shared/` contiene la interfaz común y las reglas puras. Ningún archivo de `features/` ni de `shared/` importa de `services/`. Ver diagrama de capas en `docs/solid-aplicado-en-el-frontend.md`.

### 3.1 Componentes concretos evaluados y su origen en el Entregable 1

| Componente (ruta) | Origen en el Entregable 1 | Principio donde se evalúa |
|---|---|---|
| `services/mockDb/loans.service.ts` | `Prestamo.registrarEntrega()`, `registrarDevolucion()`, `calcularRetraso()`; HU-03, HU-04, HU-06 | SRP |
| `services/mockDb/resources.service.ts` | `Recurso.actualizarEstado()`, `darDeBaja()`; HU-05 | SRP |
| `shared/utils/validators.ts`, `dateUtils.ts`, `features/*/validation.ts`, `shared/utils/formResolver.ts` | Reglas de negocio de HU-01, HU-02, HU-04 | SRP |
| `features/loans/hooks/useLoanForm.ts` + `components/LoanForm.tsx`, `useMyLoans.ts` | HU-04 (solicitud) | SRP |
| `shared/constants/resourceStateMachine.ts` (`RESOURCE_TRANSITIONS`, `RETURN_CONDITION_STRATEGY`) | `EstadoRecurso`, RF-04, RN-02 | OCP |
| `shared/constants/navigation.ts` (`NAV_GROUPS`), `features/dashboard/pages/DashboardPage.tsx` (`DASHBOARD_VIEWS`), `shared/components/ui/StatusBadge.tsx` (`STATUS_BADGE`) | `Rol`, RF-02, RN-01 | OCP |
| `services/storage/StorageRepository.ts` con `LocalStorageRepository.ts` e `InMemoryStorageRepository.ts`; `OperationResult<T>` | Persistencia de todas las clases del diagrama | LSP, DIP |
| `contexts/AppDataContext.ts`, `AuthContext.ts`, `UIContext.ts` y sus hooks | Acceso de la interfaz a `Usuario`, `Recurso`, `Prestamo` | ISP |
| `app/providers.tsx` (`AppProviders`), `app/App.tsx`, `src/test/renderApp.tsx` | Composición del sistema | DIP |

### 3.2 Correspondencia propuesta con el modelo C4 (hipótesis, sin diagrama C4 del proyecto en el repositorio)

| Nivel C4 | Elemento propuesto (nombre del código) |
|---|---|
| 1. Contexto | Sistema de préstamo de recursos de laboratorio. Actores: Estudiante, Técnico de laboratorio, Administrador de laboratorio (`shared/constants/roles.ts`). Sin sistemas externos en el MVP. |
| 2. Contenedores | Aplicación web SPA (React 19 + TypeScript + Vite) y almacenamiento local del navegador (`localStorage`, prefijo `sistema-prestamos-lab-`). No hay API ni base de datos. |
| 3. Componentes de la SPA | Raíz de composición (`app/`), features (`auth`, `dashboard`, `inventory`, `loans`, `operations`), estado global (`contexts/`), servicios de dominio (`services/mockDb`), puerto y adaptadores (`services/storage`) y núcleo compartido (`shared/`). |
| 4. Código | Tipos y servicios de la sección 3.1, como refinamiento del diagrama de clases del Entregable 1. |

Diferencias entre el diseño documentado (`design.md`), el código y este mapeo:
- El diagrama de capas de `design.md` (sección Architecture) tiene cuatro capas, con el router dentro de Infraestructura y las páginas como capa propia. El código real añade la capa `app/` (`App.tsx`, `providers.tsx`, `router.tsx`: raíz de composición, que la sección Folder Structure de `design.md` sí lista) y no tiene una capa `pages/` separada: las páginas están en `features/*/pages/`, más `shared/pages/NotFoundPage.tsx` y `shared/components/guards/AccessDeniedPage.tsx`.
- `design.md` lista `users/` y `reports/` como features. No existen: la gestión de usuarios vive en `contexts/` y `services/mockDb/users.service.ts`, y los reportes son Post-MVP.

---

## 4. Resumen ejecutivo

| Principio | Nivel de cumplimiento | Observación general |
|---|---|---|
| S - Single Responsibility Principle | **Medio** | La validación, las fechas, la máquina de estados y la persistencia están en módulos propios y los formularios separan hook y presentación. `loans.service` aloja además consultas de disponibilidad, `resources.service` lee la clave de préstamos y "préstamo activo" está escrito en 4 lugares. |
| O - Open/Closed Principle | **Alto** | Estados, condiciones, roles, tipos de recurso, menú y paneles se extienden editando tablas `Record<Unión, …>`; el compilador señala lo que falta. Quedan literales de dominio (`'Dañado'`, `'Estudiante'`) fuera de las tablas. |
| L - Liskov Substitution Principle | **Medio** | Las dos implementaciones del puerto son intercambiables en las 350 pruebas, pero el puerto no declara que `set` puede lanzar, `LocalStorageRepository` no se prueba y tres servicios incumplen su postcondición "no lanza" si falla la escritura. |
| I - Interface Segregation Principle | **Medio** | Los contextos se dividieron por dominio y el puerto tiene 3 métodos. `useAuth` mezcla sesión y acciones, `LoansContextValue` tiene 9 miembros y hay miembros sin consumidores. |
| D - Dependency Inversion Principle | **Medio** | Existe el puerto, la inyección y una raíz de composición. La mejora M2 está incompleta: 25 valores por defecto concretos, providers que importan módulos de servicio y 6 componentes de `shared/` que importan de `contexts/`. |

**Conclusión global del componente:**
El diseño es sólido en extensión (OCP) y en aislamiento de la persistencia (puerto y adaptadores), pero no cumple SOLID por completo. La deuda se concentra en la capa de servicios (manejo de fallos de almacenamiento, mezcla de consultas y comandos) y en el cierre de la inversión de dependencias. Ningún hallazgo impide el MVP, pero hay uno de prioridad Alta: `AppDataProvider.run` evita que la excepción rompa la interfaz y no revierte las escrituras ya hechas, por lo que el riesgo de datos a medias en `createLoan` y `registerReturn` sigue abierto (sección 7).

**Nivel general de calidad del diseño:** Medio (con tendencia a Alto en extensión y persistencia).

**Prioridad de intervención:** Media.

---

## 5. Análisis de Principios SOLID

### 5.1 S - Single Responsibility Principle (SRP)

**Definición.** Una clase o módulo debe tener una sola razón para cambiar.

**Elemento evaluado:**
- `services/mockDb/loans.service.ts` (313 líneas): orquesta el ciclo del préstamo y aloja consultas de disponibilidad.
- `services/mockDb/resources.service.ts` (260 líneas): CRUD de recursos, conciliación de stock e historial de estados.
- `shared/utils/validators.ts`, `shared/utils/dateUtils.ts`, `features/*/validation.ts` y `shared/utils/formResolver.ts`: validación pura.
- `features/loans/hooks/useLoanForm.ts` con `features/loans/components/LoanForm.tsx`, y `features/loans/hooks/useMyLoans.ts`: separación entre lógica de formulario y presentación.
- `contexts/AppDataProvider.tsx` (206 líneas): proveedor de los datos de dominio.

**Evaluación:** Cumple parcialmente

**Evidencia observada:**
- La validación es pura y se reutiliza. `shared/utils/validators.ts` abre con el comentario "Cada función tiene una única razón de cambio (SRP) y no depende de estado global". `loans.service.ts` importa `validateLoanTimes`, `validateMotivo` y `validateObservaciones`, y `features/loans/validation.ts` (`validateLoanForm`) reutiliza `validateLoanTimes` y `validateMotivo`: la misma regla de 1 a 24 horas se aplica en el formulario y en el servicio. Es una regla añadida en el Entregable 2 (Req 8.3 a 8.6 de `requirements.md`); HU-04 del Entregable 1 solo describe la reserva y el límite de 3 préstamos.
- El puente con la librería de formularios es una función de una sola responsabilidad:
  ```ts
  // shared/utils/formResolver.ts:14-16
  export function createResolver<T extends FieldValues>(
    validate: (values: T) => FormErrors<T>,
  ): Resolver<T> {
  ```
  ```ts
  // features/loans/hooks/useLoanForm.ts:11
  const resolver = createResolver(validateLoanForm)
  ```
- Reparto hook/presentación: `LoanForm.tsx` solo importa `useLoanForm`; el hook usa `useAuth`, `useLoans`, `useToast`, `useNavigate` y `useForm`. `ConditionForm.tsx` es un formulario único para entrega y devolución, parametrizado por las props `requireNotesIfDamaged` y `submit`.
- La máquina de estados es un módulo propio de 54 líneas con datos y una función (`shared/constants/resourceStateMachine.ts`).
- `loans.service.ts` exporta 8 funciones: `checkAvailability` (77), `getAvailableResources` (90), `createLoan` (105), `getLoansByUser` (166), `getPendingDeliveries` (180), `getPendingReturns` (198), `registerDelivery` (224) y `registerReturn` (272). Son consultas de disponibilidad, listados y tres comandos del ciclo. Además produce efectos sobre otro agregado: `adjustAvailableQuantity` (154, 297) y `updateResourceStatus` (160, 263, 309).
- `resources.service.ts` mezcla CRUD, conciliación de stock (`reconcileStockState`, línea 110), historial (`appendStatusHistory`, línea 35) y **lee la clave de préstamos**: `resources.service.ts:247` `const loans = repo.get<Loan[]>(LS_KEYS.LOANS) ?? []`.
- `AppDataProvider.tsx` combina la siembra (`ensureSeeded` dentro de `initState`, línea 58), la lectura del snapshot, `reuseIfEqual` (68), el reducer (76), la ejecución protegida `run` (119), tres `useMemo` de valores de contexto (136, 155, 178) y la pantalla de error de almacenamiento (188).
- El concepto "préstamo activo" (`Reservado` o `En_Préstamo`) está escrito en cuatro sitios: `services/mockDb/loans.service.ts:55`, `services/mockDb/resources.service.ts:251`, `features/loans/availability.ts:62` y `features/dashboard/summaries.ts:43`.
- Acoplamiento observado en la historia: el commit `7575ca3` (`feat(loans): agregar servicio de préstamos`) introdujo `loans.service.ts` (archivo nuevo de 316 líneas) y, en el mismo commit, amplió `RESOURCE_TRANSITIONS` en `shared/constants/resourceStateMachine.ts` (7 líneas) para permitir la devolución dañada de recursos con varias unidades. Esto muestra que el ciclo del préstamo y las reglas de estado del recurso están acopladas, pero no es un cambio posterior del servicio.

**Preguntas guía:**
1. **¿La clase tiene una única responsabilidad claramente definida?** Depende del artefacto. Sí en `validators.ts`, `dateUtils.ts`, `resourceStateMachine.ts`, `StorageRepository` y `formResolver.ts`. Parcialmente en `loans.service.ts`: orquesta el ciclo del préstamo, pero también aloja consultas de disponibilidad y listados (8 exportaciones, 313 líneas).
2. **¿Mezcla lógica de negocio, acceso a datos, validación, presentación o infraestructura?** Los servicios no tocan la interfaz ni `localStorage` (solo el puerto) y delegan la validación en funciones puras. Las mezclas que quedan: `resources.service.ts` lee `LS_KEYS.LOANS` (línea 247) y gestiona historial y stock; `AppDataProvider.tsx` mezcla siembra, estado, ejecución protegida y la pantalla de error.
3. **¿Existen múltiples razones de cambio en el mismo artefacto?** En `loans.service.ts` sí: la regla de disponibilidad y solapamiento, el ciclo del préstamo y la política de efectos sobre el recurso (stock y estado). El contenido actual del archivo lo muestra: 8 exportaciones que mezclan consulta (disponibilidad y listados), comandos del ciclo (reservar, entregar, devolver) y efectos sobre el stock y el estado del recurso.
4. **¿El nombre de la clase refleja una sola intención?** Sí en utilidades y constantes. `loans.service` nombra "préstamos" pero incluye "disponibilidad", y `AppDataProvider` agrupa tres dominios (recursos, préstamos y usuarios).

**Hallazgos:**
- `loans.service` mezcla el ciclo del préstamo con las consultas de disponibilidad.
- `resources.service` conoce el almacenamiento de otro agregado (la clave de préstamos).
- La definición de "préstamo activo" está duplicada en 4 archivos.
- `AppDataProvider` concentra siembra, estado, ejecución protegida y marcado de error.

**Impacto técnico potencial:**
- Tocar la disponibilidad puede provocar regresiones en el ciclo del préstamo y al revés.
- Cambiar la definición de "activo" (por ejemplo, al agregar el estado `Cancelado` o `Vencido` en el futuro) exige editar 4 archivos y es fácil olvidar uno.
- Con un backend real, consultas y comandos se separarían en servicios distintos; hoy están acoplados en un solo módulo.

**Recomendaciones:**
- Extraer la disponibilidad de `loans.service` a su propio módulo (`availability.service`).
- Centralizar `isActiveLoan` en `shared/utils/`, junto a `resourceRules.ts`.
- Reemplazar la lectura directa de `LS_KEYS.LOANS` en `retireResource` por una función de `loans.service` o del puerto.
- Separar la siembra y la pantalla de error del provider.

**Pruebas que lo respaldan** (archivo → `describe` › `it`):
- `__tests__/unit/utils.test.ts` → `validators` › `validateLoanTimes respeta mínimo 1h y máximo 24h`.
- `__tests__/properties/validators.property.test.ts` → `Propiedades de validateLoanTimes` (4 pruebas) y `Propiedades de validatePassword` (5 pruebas).
- `__tests__/unit/loans.test.tsx` → `validación pura del formulario de préstamo` › `acepta un préstamo válido` (el validador se prueba sin React ni almacenamiento).
- `__tests__/unit/auth.test.tsx` → `validación pura de formularios` › `registro: contraseña débil y confirmación distinta`.
- `__tests__/unit/services.test.ts` → `loans.service` › `crea un préstamo válido en estado Reservado y descuenta stock`.

### 5.2 O - Open/Closed Principle (OCP)

**Definición.** Las entidades de software deben estar abiertas para extensión, pero cerradas para modificación.

**Elemento evaluado:**
- `shared/constants/resourceStateMachine.ts`: `RESOURCE_TRANSITIONS` y `RETURN_CONDITION_STRATEGY`.
- `shared/constants/navigation.ts`: `NAV_GROUPS` y `getRolesForRoute`.
- `features/dashboard/pages/DashboardPage.tsx`: `DASHBOARD_VIEWS`.
- `shared/components/ui/StatusBadge.tsx`: `STATUS_BADGE`.
- `shared/constants/roles.ts`, `resourceTypes.ts` y `conditions.ts`: `ROLE_LABELS`, `RESOURCE_TYPE_LABELS`, `CONDITION_LABELS`.
- `shared/components/layout/routeBreadcrumbs.ts` (`ROUTE_BREADCRUMBS`) y `shared/components/guards/RoleGuard.tsx` (`allowedRoles`).

**Evaluación:** Cumple

**Evidencia observada:**
- La variación de dominio se expresa como datos tipados con `Record<Unión, …>`:
  ```ts
  // shared/constants/resourceStateMachine.ts:20-29
  export const RESOURCE_TRANSITIONS: Record<ResourceStatus, ResourceStatus[]> = {
    // En_Mantenimiento desde Disponible/Reservado: un recurso con varias
    // unidades puede recibir una devolución dañada mientras otras siguen libres
    // o reservadas (Req 13.9).
    Disponible: ['Reservado', 'En_Mantenimiento', 'Dado_de_Baja'],
    Reservado: ['En_Préstamo', 'Disponible', 'En_Mantenimiento'], // Disponible = cancelación (Post-MVP)
    En_Préstamo: ['Disponible', 'En_Mantenimiento'],
    En_Mantenimiento: ['Disponible', 'Dado_de_Baja'],
    Dado_de_Baja: [], // estado terminal
  }
  ```
  ```ts
  // shared/constants/resourceStateMachine.ts:34-39
  export function isValidTransition(
    from: ResourceStatus,
    to: ResourceStatus,
  ): boolean {
    return RESOURCE_TRANSITIONS[from].includes(to)
  }
  ```
  ```ts
  // shared/constants/resourceStateMachine.ts:47-54
  export const RETURN_CONDITION_STRATEGY: Record<
    ResourceCondition,
    { nuevoEstado: ResourceStatus }
  > = {
    Bueno: { nuevoEstado: 'Disponible' },
    Regular: { nuevoEstado: 'Disponible' },
    Dañado: { nuevoEstado: 'En_Mantenimiento' },
  }
  ```
  ```ts
  // features/dashboard/pages/DashboardPage.tsx:13-17
  const DASHBOARD_VIEWS: Record<UserRole, ComponentType> = {
    Estudiante: StudentDashboard,
    Técnico_Laboratorio: TechnicianDashboard,
    Administrador_Laboratorio: AdminDashboard,
  }
  ```
  ```ts
  // shared/components/ui/StatusBadge.tsx:14-23
  const STATUS_BADGE: Record<BadgeStatus, { label: string; tone: Tone }> = {
    Disponible: { label: 'Disponible', tone: 'green' },
    Reservado: { label: 'Reservado', tone: 'yellow' },
    En_Préstamo: { label: 'En préstamo', tone: 'blue' },
    En_Mantenimiento: { label: 'En mantenimiento', tone: 'orange' },
    Dado_de_Baja: { label: 'Dado de baja', tone: 'gray' },
    Devuelto: { label: 'Devuelto', tone: 'green' },
    Cancelado: { label: 'Cancelado', tone: 'gray' },
    Vencido: { label: 'Vencido', tone: 'red' },
  }
  ```
- `NAV_GROUPS` (`shared/constants/navigation.ts:26`) es la fuente de verdad del menú y de `getRolesForRoute` (línea 74), que alimenta los `RoleGuard` en `app/router.tsx` (`guarded(getRolesForRoute('/loans/my'), …)`). El formulario de registro deriva sus opciones de `ROLE_LABELS`, y los filtros y el formulario de inventario derivan de `RESOURCE_TYPES`.
- **Evolución real (git).** El commit `7575ca3` (21/10/2026), que además introdujo `loans.service.ts`, ampliaba en `resourceStateMachine.ts` solo líneas de la tabla `RESOURCE_TRANSITIONS` (7 líneas) para permitir la devolución dañada de recursos con varias unidades; `isValidTransition` no se tocó. El diff de ese archivo:
  ```diff
  -  Disponible: ['Reservado', 'Dado_de_Baja'],
  -  Reservado: ['En_Préstamo', 'Disponible'], // Disponible = cancelación (Post-MVP)
  +  // En_Mantenimiento desde Disponible/Reservado: un recurso con varias
  +  // unidades puede recibir una devolución dañada mientras otras siguen libres
  +  // o reservadas (Req 13.9).
  +  Disponible: ['Reservado', 'En_Mantenimiento', 'Dado_de_Baja'],
  +  Reservado: ['En_Préstamo', 'Disponible', 'En_Mantenimiento'], // Disponible = cancelación (Post-MVP)
  ```
- **Experimento de extensión** (ejecutado sobre una copia temporal del proyecto, fuera del repositorio): se agregó el tipo de recurso `Reactivo` solo a la unión `ResourceType` y `tsc -b --noEmit` falló con `src/shared/constants/resourceTypes.ts(7,14): error TS2741: Property 'Reactivo' is missing …`. Al agregar la etiqueta en `RESOURCE_TYPE_LABELS`, `tsc` terminó sin errores y `npx vitest run` dio 350 pruebas en verde. Los filtros de `AvailabilityPage.tsx` y el formulario `ResourceForm.tsx` se alimentan de `RESOURCE_TYPES`, así que no se tocaron. Un tipo de recurso nuevo cuesta 2 archivos.

Costo de extender cada unión de dominio:

| Cambio de extensión | Archivos a tocar | Lo que exige el compilador |
|---|---|---|
| Agregar `'Reactivo'` a `ResourceType` | 2: `shared/types/index.ts` y `shared/constants/resourceTypes.ts` | La etiqueta en `RESOURCE_TYPE_LABELS` |
| Agregar `'En_Calibración'` a `ResourceStatus` | 3: la unión, `StatusBadge.tsx` y `resourceStateMachine.ts` | Entradas en `STATUS_BADGE` y `RESOURCE_TRANSITIONS` |
| Agregar `'Incompleto'` a `ResourceCondition` | 3: la unión, `conditions.ts` y `resourceStateMachine.ts` | Entradas en `CONDITION_LABELS` y `RETURN_CONDITION_STRATEGY` |
| Agregar `'Docente'` a `UserRole` | 3 de producción más un ajuste manual: la unión, `roles.ts` y `DashboardPage.tsx`; en las pruebas, `USER_BY_ROLE` de `router.test.tsx`; y los `roles` de `NAV_GROUPS` a mano | `ROLE_LABELS` y `DASHBOARD_VIEWS`; **no** exige `NAV_GROUPS` (sin ese ajuste el rol nuevo solo vería los grupos que usan `ALL_ROLES`) |

Las cuatro filas se ejecutaron sobre copias temporales del proyecto (fuera del repositorio) con `tsc -b --noEmit`; el compilador señaló exactamente los archivos de la tabla. Solo la primera fila se ejecutó además con la suite completa (350 pruebas en verde).

- **Excepciones honestas: literales de dominio fuera de las tablas.**
  - La regla "Dañado exige observaciones" está escrita en `services/mockDb/loans.service.ts:239`, `features/operations/validation.ts:29` y `features/operations/hooks/useConditionForm.ts:46`. Además `features/operations/hooks/useReturns.ts:64` repite que `Dañado` va a mantenimiento (`if (values.condicion === 'Dañado') parts.push('El recurso pasó a mantenimiento.')`) en lugar de consultar `RETURN_CONDITION_STRATEGY`.
  - `'Estudiante'` aparece como literal en `features/auth/validation.ts:51`, `features/auth/hooks/useRegisterForm.ts:44` y `:65`, y `features/loans/pages/AvailabilityPage.tsx:32` (`canRequestLoan = session?.role === 'Estudiante'`).
  - El único `switch` del código es el reducer de `contexts/AppDataProvider.tsx:76`, con 2 acciones (`LOAD`, `STORAGE_ERROR`). Es la mejora M7, pendiente.
  - Quedan condicionales sobre estados de recurso dentro de los servicios (`loans.service.ts:158`, `:262`, `:304-305`; `resources.service.ts:114`, `:117`, `:151`).

**Preguntas guía:**
1. **¿Agregar funcionalidad obliga a modificar código estable?** Para estados, condiciones, tipos y roles no: se edita una tabla y el compilador marca lo que falta (experimento anterior; además, en `resourceStateMachine.ts` el commit `7575ca3` solo cambió líneas de la tabla). Excepción: una regla nueva atada a una condición concreta obliga a tocar los 4 sitios donde está el literal `'Dañado'`.
2. **¿Se usan abstracciones, polimorfismo o estrategias de extensión?** No hay polimorfismo de clases. Sí hay estrategia como dato (`RETURN_CONDITION_STRATEGY`), componentes parametrizados (`ConditionForm`, `RoleGuard` con `allowedRoles`), `createResolver(validate)` y el mapeo `DASHBOARD_VIEWS`.
3. **¿Existen estructuras if/switch crecientes basadas en tipos o casos?** No sobre `ResourceStatus`, `UserRole` ni `ResourceType`: no hay `switch` sobre ellos, y el único `switch` del código es el reducer de 2 acciones. Sí hay `if` con literales de estado y condición dentro de los servicios (lista de excepciones).
4. **¿El diseño favorece agregar comportamientos sin romper lo ya construido?** Sí. `Record<Unión, …>` obliga a completar los casos en compilación, y las propiedades de transición se generan a partir de la tabla (`resources.property.test.ts` usa `RESOURCE_TRANSITIONS`), de modo que la prueba sigue a la tabla.

**Hallazgos:**
- Tablas declarativas consolidadas para estados, condiciones, tipos, roles, menú, paneles y etiquetas de estado.
- Literales de dominio duplicados (`'Dañado'` en 4 sitios, `'Estudiante'` en 4 líneas).
- Reducer con `switch` (M7).

**Impacto técnico potencial:**
- Bajo hoy. Sube con las reglas Post-MVP (cancelación, sanciones), que añaden estados y condiciones y harían crecer los condicionales de los servicios.

**Recomendaciones:**
- Mover "condición que exige observaciones" y "condición que va a mantenimiento" a una tabla, por ejemplo `CONDITION_RULES: Record<ResourceCondition, {…}>`.
- Centralizar `isActiveLoan` (mismo hallazgo de SRP).
- Convertir el reducer en un mapa de handlers solo si crecen las acciones.

**Pruebas que lo respaldan:**
- `__tests__/unit/utils.test.ts` → `resourceStateMachine` › `valida transiciones según la tabla declarativa` y `estrategia de devolución mapea condición a estado`.
- `__tests__/properties/resources.property.test.ts` → `Propiedades de transición de estado (updateResourceStatus)` › `rechaza toda transición ausente de la tabla y no modifica el recurso` y `acepta toda transición de la tabla y registra el cambio en el historial` (100 iteraciones cada una).
- `__tests__/unit/services.test.ts` → `resources.service` › `rechaza transiciones inválidas y registra historial en las válidas` y `una transición rechazada no cambia el estado ni escribe en el historial`; `loans.service` › `devolución Dañado lleva el recurso a En_Mantenimiento`.
- `__tests__/properties/loans.property.test.ts` → `Propiedades del ciclo de préstamo (createLoan, registerReturn)` › `registerReturn con condición Dañado deja el recurso En_Mantenimiento`.
- `__tests__/unit/ui.test.tsx` → `StatusBadge` › `muestra la etiqueta legible de cada estado`.
- `__tests__/unit/router.test.tsx` → `control de acceso por rol` y `getRolesForRoute` › `lanza si la ruta no está en el menú`.
- `__tests__/unit/layouts.test.tsx` → `getNavGroupsForRole` › `cada rol recibe solo sus grupos, sin grupos vacíos`.
- `__tests__/unit/dashboard.test.tsx` → `cada rol ve solo su panel`.

### 5.3 L - Liskov Substitution Principle (LSP)

**Definición.** Los objetos de una subclase deben poder sustituir a los de su clase base sin alterar el comportamiento esperado del sistema.

**Elemento evaluado:**
- `services/storage/StorageRepository.ts` (el contrato) frente a `LocalStorageRepository.ts` e `InMemoryStorageRepository.ts` (las dos implementaciones). Son las únicas relaciones `implements` del código (`LocalStorageRepository.ts:11` e `InMemoryStorageRepository.ts:10`).
- `OperationResult<T>` (`shared/types/index.ts:160`) y su uso como postcondición de los servicios de dominio.

*Aclaración metodológica:* no hay jerarquías de herencia de dominio. En TypeScript funcional se evalúa la sustituibilidad a nivel de contrato (interfaz y postcondiciones), no de clase base y subclase.

**Evaluación:** Cumple parcialmente

**Evidencia observada:**
- Contrato y las dos implementaciones de `set`:
  ```ts
  // services/storage/StorageRepository.ts:8-15
  export interface StorageRepository {
    /** Lee y deserializa el valor asociado a `key`. Devuelve `null` si no existe. */
    get<T>(key: string): T | null
    /** Serializa y guarda `value` bajo `key`. */
    set<T>(key: string, value: T): void
    /** Elimina la entrada asociada a `key`. */
    remove(key: string): void
  }
  ```
  ```ts
  // services/storage/LocalStorageRepository.ts:23-32
    set<T>(key: string, value: T): void {
      try {
        localStorage.setItem(key, JSON.stringify(value))
      } catch (error) {
        throw new Error(
          `No se pudo guardar en el almacenamiento local (clave: ${key}).`,
          { cause: error },
        )
      }
    }
  ```
  ```ts
  // services/storage/InMemoryStorageRepository.ts:19-21
    set<T>(key: string, value: T): void {
      this.store.set(key, JSON.stringify(value))
    }
  ```
- **Asimetría del contrato.** El puerto no documenta que `set` puede lanzar: el adaptador real lanza (cuota excedida, modo privado) y el adaptador en memoria nunca lanza. `InMemoryStorageRepository` añade además `clear()` (línea 28), que no está en el puerto; es una extensión inocua porque ningún cliente del puerto la usa.
- **Ninguna prueba ejercita el adaptador real.** Una búsqueda de `LocalStorageRepository`, `localStorageRepository` y `localStorage` en `__tests__/` y `src/test/` no encuentra coincidencias. Los 350 tests corren sobre `InMemoryStorageRepository` o sobre repositorios falsos escritos en la propia prueba. La sustituibilidad entre real y fake se sostiene por lectura del código, no por una prueba de contrato.
- **Los servicios no siempre cumplen la postcondición "devuelve `OperationResult` y no lanza".** `auth.service.ts` sí la cumple desde el commit `d8e609c`: `tryWrite` (línea 47) convierte el fallo de `set` en un resultado de error. `resources.service.ts` (`writeResources` línea 32, `appendStatusHistory` línea 41), `loans.service.ts` (`writeLoans` línea 51) y `users.service.ts` (`updateUser`, línea 45) llaman a `repo.set` sin proteger. Se comprobó ejecutando los servicios sobre una copia temporal con un repositorio simulado cuyo `set` lanza `Error('Cuota excedida')`: `createResource`, `updateUser` y `createLoan` **lanzaron** en lugar de devolver `{ success: false }`. Es una prueba hecha con un almacenamiento simulado, no una prueba del repositorio del proyecto.
- **Datos a medias.** Con el mismo repositorio simulado, cuyo `set` falla a partir de la segunda escritura, `createLoan` lanzó después de guardar el préstamo: el número de préstamos pasó de 5 a 6 y la `cantidadDisponible` del recurso siguió en 5 (stock sin descontar). `createLoan` escribe el préstamo (`loans.service.ts:152`) y después ajusta stock (154) y estado (160); `registerReturn` hace lo mismo con `updateLoan` (289), `adjustAvailableQuantity` (297) y `updateResourceStatus` (309).
- La cabecera de `loans.service.ts` declara "M8 (LSP): toda función retorna `OperationResult`; nunca lanza". Esa afirmación **no se cumple** para tres servicios cuando falla el almacenamiento y por eso no se usa aquí como evidencia.
- **Contención.** `AppDataProvider.run` captura la excepción y devuelve un resultado de error, así que la interfaz no se rompe:
  ```tsx
  // contexts/AppDataProvider.tsx:119-134
  const run = useCallback(
    <T,>(operation: () => OperationResult<T>): OperationResult<T> => {
      try {
        const result = operation()
        if (result.success) refresh()
        return result
      } catch (error) {
        return {
          success: false,
          error:
            error instanceof Error ? error.message : STORAGE_ERROR_MESSAGE,
        }
      }
    },
    [refresh],
  )
  ```
  Pero `run` no revierte las escrituras que sí ocurrieron.
- `OperationResult` no es una unión discriminada (`success: boolean; data?: T; error?: string`): un `{ success: true }` sin `data` compila, por eso el código usa `result.data?.`.
- El único `instanceof` del código de producción (`AppDataProvider.tsx:129`) comprueba `Error`, no un subtipo del puerto.

**Preguntas guía:**
1. **¿Las subclases respetan el contrato de la superclase?** Las dos implementaciones comparten la firma `get/set/remove` y el mismo viaje de ida y vuelta JSON (el repositorio en memoria usa `JSON.stringify/parse`). La única prueba de ese viaje es sobre el repositorio en memoria (`serialization.property.test.ts`); no existe una prueba de contrato contra el adaptador real.
2. **¿Alguna subclase lanza excepciones inesperadas o deshabilita comportamientos heredados?** `LocalStorageRepository.set` lanza y el puerto no lo declara; `InMemoryStorageRepository.set` no lanza. Ningún método se deshabilita.
3. **¿Se redefinen precondiciones o postcondiciones de manera incompatible?** La postcondición de los servicios "devuelve `OperationResult` y no lanza" no se cumple en `resources.service`, `loans.service` y `users.service` cuando `repo.set` falla. En `createLoan` el fallo de la segunda escritura deja el préstamo guardado sin descontar stock.
4. **¿El cliente necesita conocer el subtipo concreto para funcionar correctamente?** No conoce la clase: servicios y providers reciben `StorageRepository`, y fuera de `LocalStorageRepository.ts` ningún archivo usa `localStorage`. Sí necesita saber que `set` puede lanzar, y ese conocimiento del adaptador real se filtra a `tryWrite` en `auth.service.ts` y al `try/catch` de `AppDataProvider.run`.

**Hallazgos:**
- El contrato del puerto está incompleto: no declara que `set` puede lanzar.
- Tres servicios incumplen su postcondición cuando falla el almacenamiento.
- Las operaciones con varias escrituras (`createLoan`, `registerReturn`) pueden dejar datos a medias.
- No hay prueba de contrato contra el adaptador real.
- `OperationResult` no es una unión discriminada.

**Impacto técnico potencial:**
- El día que exista una API real, un adaptador que lance o rechace promesas romperá a los servicios que no capturan el error.
- Si se llena la cuota de `localStorage` (las imágenes se guardan como data URL, ver `shared/utils/imageUtils.ts`) una reserva puede quedar guardada sin descontar el stock.
- La documentación del código afirma una garantía ("nunca lanza") que no se sostiene.

**Recomendaciones:**
- Documentar en `StorageRepository.set` que puede lanzar (`@throws`).
- Extraer `tryWrite` a un módulo compartido de servicios y usarlo en `resources`, `loans` y `users`; decidir el orden de las escrituras de `createLoan` y `registerReturn`.
- Agregar una prueba de contrato parametrizada (`describe.each([InMemoryStorageRepository, LocalStorageRepository])`) que cubra `get`, `set`, `remove` y el fallo de `set`.
- Valorar `OperationResult` como unión discriminada.
- Corregir la cabecera de los servicios hasta que la postcondición se cumpla.

**Pruebas que lo respaldan:**
- `__tests__/unit/services.test.ts` → `postcondición de OperationResult (LSP / M8)` › `ninguna operación lanza excepción ante entradas inexistentes` (cubre entradas inexistentes, **no** un repositorio que falla).
- `__tests__/unit/services.test.ts` → `auth.service` › `cuando el almacenamiento lanza al escribir` › `registerUser devuelve un error en lugar de lanzar y no guarda al usuario`, `loginUser devuelve un error en lugar de lanzar y no crea sesión`, `loginUser con credenciales inválidas sigue devolviendo el error genérico` y `logoutUser y la limpieza de una sesión expirada no lanzan`.
- `__tests__/unit/contexts.test.tsx` → `AuthProvider` › `cuando el almacenamiento lanza al escribir` › `login devuelve un error y no deja sesión en memoria ni en el almacenamiento`, `register devuelve un error en lugar de lanzar` y `logout descarta la sesión en memoria aunque no pueda borrarla del almacenamiento`.
- `__tests__/unit/contexts.test.tsx` → `AppDataProvider` › `convierte un fallo de almacenamiento en un resultado de error, sin lanzar`.
- `__tests__/properties/serialization.property.test.ts` → `Propiedad de serialización JSON (round-trip)` › `el repositorio devuelve las listas guardadas sin alterarlas`.

### 5.4 I - Interface Segregation Principle (ISP)

**Definición.** Los clientes no deben depender de interfaces que no utilizan.

**Elemento evaluado:**
- `contexts/AppDataContext.ts`: `ResourcesContextValue` (línea 22), `LoansContextValue` (42) y `UsersContextValue` (66).
- `contexts/AuthContext.ts`: `AuthContextValue` (9). `contexts/UIContext.ts`: `UIContextValue` (12).
- Los hooks `contexts/useResources.ts`, `useLoans.ts`, `useUsers.ts`, `useAuth.ts` y `useToast.ts`.
- Las props de `StatusBadge`, `Toast` y `Breadcrumb`, y el puerto `StorageRepository` (3 métodos).

**Evaluación:** Cumple parcialmente

**Evidencia observada:**
- En lugar de un único `useAppData()` hay tres contextos de dominio y un hook por cada uno. El diagnóstico original calificó esa situación como "No cumple"; se resolvió al implementarse en el commit `3082f79` (`feat(api): agregar contextos de datos por dominio`). La cabecera de `contexts/AppDataContext.ts` lo explica: un componente que solo consume recursos depende únicamente de `ResourcesContext` y no se vuelve a renderizar cuando cambian los préstamos.
- `reuseIfEqual` (`AppDataProvider.tsx:68`) conserva la referencia de un segmento si su contenido no cambió, y el reducer lo usa para `resources`, `loans` y `users`.
- Props mínimas: `StatusBadgeProps { status: BadgeStatus }` es la única prop del distintivo; `ButtonProps` extiende `ComponentProps<'button'>`.
- **Medido por búsqueda** de `= useAuth()` en el código de producción: 11 consumidores. 8 usan solo `session` (`RoleGuard`, `GuestRoute`, `PrivateRoute`, `Sidebar`, `DashboardPage`, `AvailabilityPage`, `useMyLoans`, `useLoanForm`); `useLoginForm` usa solo `login`; `useRegisterForm` usa solo `register`; `AppShell` usa `session` y `logout`.
- `LoansContextValue` tiene 9 miembros y ningún consumidor usa más de 3: `AdminDashboard` usa `loans`; `useAvailability`, `loans` y `getAvailableResources`; `useMyLoans`, `loans` y `getLoansByUser`; `useDeliveries`, `loans`, `getPendingDeliveries` y `registerDelivery`; `useReturns`, `loans`, `getPendingReturns` y `registerReturn`.
- Miembros sin ningún consumidor en `features/`, `shared/` ni `app/`: `checkAvailability`, `getUserById`, `updateUser` y `updateResourceStatus`. En `UIContextValue`, `isGlobalLoading` y `setGlobalLoading` solo aparecen en `UIProvider.tsx`.
- **Acoplamiento residual de re-render.** El valor de `LoansContext` depende de `state.resources` para forzar una identidad nueva de las consultas (`AppDataProvider.tsx:172-175`: comentario, `// eslint-disable-next-line react-hooks/exhaustive-deps` y la lista `[state.loans, state.resources, run, repository]`). Además, tres hooks incluyen `loans` como dependencia manual con su propio `eslint-disable` (`useMyLoans.ts:29`, `useDeliveries.ts:40`, `useReturns.ts:49`) porque las consultas leen el almacenamiento y no el estado.

**Preguntas guía:**
1. **¿Las interfaces obligan a implementar métodos irrelevantes?** No. `StorageRepository` tiene 3 métodos y las dos clases, más los repositorios falsos de las pruebas (`failingRepo` y similares), implementan exactamente esos 3. Los valores de contexto solo los construyen los providers.
2. **¿Existen interfaces demasiado amplias o genéricas?** `LoansContextValue` (9 miembros) y `AuthContextValue` (4, mezcla lectura y acciones) son las más anchas. El antiguo contexto único ya se dividió.
3. **¿Los clientes consumen solo una parte mínima de la interfaz?** Sí: 8 de los 11 consumidores de `useAuth` leen solo `session`, y ningún consumidor de `useLoans` usa más de 3 de sus 9 miembros.
4. **¿Se podrían dividir los contratos en interfaces más cohesionadas?** Sí: `useSession` frente a las acciones de autenticación; el ciclo del préstamo (`createLoan`, `registerDelivery`, `registerReturn`) frente a las consultas; los avisos (toasts) frente a la carga global. El costo es bajo y el beneficio, hoy, también.

**Hallazgos:**
- `useAuth` agrupa sesión y acciones.
- `LoansContextValue` es ancho.
- Hay 4 miembros de `LoansContext`/`ResourcesContext`/`UsersContext` y 2 de `UIContext` sin consumidores.
- El re-render de las consultas está acoplado a `resources`.

**Impacto técnico potencial:**
- Bajo: re-renders adicionales y una API más difícil de razonar.
- Crece si se agregan más operaciones al contexto de préstamos (por ejemplo, la cancelación Post-MVP).

**Recomendaciones:**
- Separar un `useSession()` de las acciones de autenticación.
- Dividir las consultas de los comandos en `LoansContext`.
- Eliminar `isGlobalLoading` y `setGlobalLoading`, o consumirlos.
- Hacer que las consultas dependan del estado y no del almacenamiento, para quitar los `eslint-disable`.

**Pruebas que lo respaldan:**
- `__tests__/unit/contexts.test.tsx` → `AppDataProvider` › `un cambio de préstamos no cambia la referencia de recursos si no los afecta`, `siembra los datos en el primer arranque y los expone por dominio` y `los hooks de dominio fallan con un mensaje claro fuera del provider`.
- `__tests__/unit/dashboard.test.tsx` → `cada rol ve solo su panel`.
- `__tests__/unit/availability.test.tsx` → `pantalla de disponibilidad` › `solicitar préstamo según el rol (Req 8.1)`.

### 5.5 D - Dependency Inversion Principle (DIP)

**Definición.** Los módulos de alto nivel no deben depender de módulos de bajo nivel; ambos deben depender de abstracciones.

**Elemento evaluado:**
- El puerto `services/storage/StorageRepository.ts`.
- La inyección del repositorio en los servicios (`services/mockDb/*.service.ts`, parámetro `repo`) y en `contexts/AuthProvider.tsx` y `contexts/AppDataProvider.tsx` (prop `repository`).
- La raíz de composición `app/providers.tsx` (`AppProviders`) y `app/App.tsx`.
- `shared/utils/formResolver.ts` (desacopla la validación de React Hook Form).
- `src/test/renderApp.tsx` (composición de las pruebas).

**Evaluación:** Cumple parcialmente

**Evidencia observada:**
- El único lugar donde se decide la implementación de producción es la raíz de composición:
  ```tsx
  // app/providers.tsx:22-40
  export function AppProviders({
    children,
    repository = localStorageRepository,
  }: AppProvidersProps) {
    return (
      <AuthProvider repository={repository}>
        <AppDataProvider repository={repository}>
          <UIProvider>
            {children}
            <ToastContainer />
          </UIProvider>
        </AppDataProvider>
      </AuthProvider>
    )
  }
  ```
- Los servicios reciben el repositorio como último parámetro, pero con un valor por defecto concreto:
  ```ts
  // services/mockDb/loans.service.ts:105-109
  export function createLoan(
    data: LoanFormData,
    userId: string,
    repo: StorageRepository = localStorageRepository,
  ): OperationResult<Loan> {
  ```
- Los providers dependen de módulos de servicio, no de interfaces de servicio:
  ```tsx
  // contexts/AppDataProvider.tsx:11-14
  import * as loansService from '@/services/mockDb/loans.service'
  import * as resourcesService from '@/services/mockDb/resources.service'
  import { ensureSeeded } from '@/services/mockDb/seed-data'
  import * as usersService from '@/services/mockDb/users.service'
  ```
- Las pruebas componen la aplicación real con un adaptador falso:
  ```tsx
  // src/test/renderApp.tsx:24-27 y 36-40
    const repo = new InMemoryStorageRepository()
    seedData(repo)
    prepare?.(repo)
    ...
    const utils = render(
      <AppProviders repository={repo}>
        <RouterProvider router={router} />
      </AppProviders>,
    )
  ```
- La instancia de producción se crea una sola vez (`services/storage/LocalStorageRepository.ts:44`: `export const localStorageRepository = new LocalStorageRepository()`).
- **Estado verificado de la mejora M2.** Hecho: puerto, dos adaptadores, `repo` inyectado en las funciones, `repository` en los providers y raíz de composición. Pendiente: 25 valores por defecto `= localStorageRepository` (22 en los cuatro servicios y 3 en providers; el de `app/providers.tsx:24` es el legítimo de la raíz de composición), providers que importan módulos de servicio y ausencia de interfaces de servicio. La tabla siguiente lista dónde están los valores por defecto.
- **Capas invertidas.** Seis archivos de `shared/components/` importan de `contexts/`, es decir, una capa baja depende de una capa alta: `guards/GuestRoute.tsx:2`, `guards/PrivateRoute.tsx:3`, `guards/RoleGuard.tsx:3`, `layout/AppShell.tsx:3`, `layout/Sidebar.tsx:3` (todos `useAuth`) y `ui/ToastContainer.tsx:1` (`useToast`). El import de tipo `ToastType` ya se movió a `shared/types` (commit `9d28f0b`).
- Ningún componente ni página importa `services/mockDb/*`: los únicos que lo hacen son `contexts/AppDataProvider.tsx`, `contexts/AuthProvider.tsx`, las pruebas y `src/test/renderApp.tsx`. Y `localStorage.getItem/setItem/removeItem` aparece solo en `LocalStorageRepository.ts` (líneas 14, 25 y 36).
- El puerto es **síncrono**. Un backend real es asíncrono, así que conectarlo exige cambiar el contrato (`Promise`), no solo agregar un adaptador.

Valores por defecto concretos (`= localStorageRepository`) por archivo:

| Archivo | Líneas | Cantidad |
|---|---|---|
| `services/mockDb/auth.service.ts` | 61, 109, 137, 147 | 4 |
| `services/mockDb/loans.service.ts` | 81, 94, 108, 168, 181, 199, 227, 275 | 8 |
| `services/mockDb/resources.service.ts` | 47, 67, 75, 130, 186, 221, 245 | 7 |
| `services/mockDb/users.service.ts` | 17, 24, 36 | 3 |
| `contexts/AuthProvider.tsx`, `contexts/AppDataProvider.tsx`, `app/providers.tsx` | 27, 102 y 24 | 3 |
| **Total** | | **25** |

**Preguntas guía:**
1. **¿La lógica de negocio depende directamente de implementaciones concretas?** De la persistencia no: depende del tipo `StorageRepository`. Queda un residuo: los 4 servicios importan la instancia concreta `localStorageRepository` para el valor por defecto de 22 firmas, los providers importan módulos concretos de servicio y 6 componentes de `shared/` importan de `contexts/`.
2. **¿Se inyectan dependencias o se crean con new dentro del componente?** Se inyectan: `repo` como último parámetro de cada función de servicio y `repository` como prop de los providers. El único `new` de producción es `export const localStorageRepository = new LocalStorageRepository()` y la elección ocurre en `app/providers.tsx`.
3. **¿Existen interfaces o abstracciones desacopladoras?** Sí: `StorageRepository`, los hooks `useAuth`, `useLoans`, `useResources`, `useUsers` y `useToast` como fachadas, y `createResolver`. Faltan interfaces de servicio (M2 parcial).
4. **¿El componente puede probarse fácilmente con mocks, stubs o fakes?** Sí. Los 350 tests corren sobre `InMemoryStorageRepository` o repositorios falsos escritos en la prueba, y `renderApp(path, { role, prepare })` monta la aplicación real (providers y router) sobre un almacenamiento en memoria.

**Hallazgos:**
- La mejora M2 está incompleta (25 valores por defecto, providers sobre módulos, sin interfaces de servicio).
- `shared/` depende de `contexts/` en 6 archivos.
- El puerto es síncrono.

**Impacto técnico potencial:**
- Migrar a un backend exige cambiar el contrato del puerto y tocar servicios y providers.
- Los valores por defecto mantienen un acoplamiento al adaptador concreto en 25 puntos.
- Las capas invertidas dificultan reutilizar `shared/` sin traer el estado global.

**Recomendaciones:**
- Quitar los valores por defecto y pasar `repo` desde una fábrica en la raíz de composición.
- Definir interfaces de servicio e inyectarlas en los providers.
- Mover guardias, layout y `ToastContainer` a una capa por encima de `contexts/` (por ejemplo `src/layout/` o dentro de `app/`).
- Hacer el puerto asíncrono cuando exista backend.

**Pruebas que lo respaldan:**
- Todas las de `__tests__/unit/services.test.ts` y `__tests__/unit/contexts.test.tsx` usan `new InMemoryStorageRepository()`.
- `__tests__/unit/auth.test.tsx` → `cuentas de demostración` (3 pruebas `$correo inicia sesión contra los datos semilla`).
- `__tests__/unit/contexts.test.tsx` → `AppDataProvider` › `muestra un error bloqueante si el almacenamiento no está disponible`.
- `__tests__/unit/router.test.tsx` monta `AppProviders` con `repository={repo}`.

---

## 6. Hallazgos transversales

Problemas recurrentes identificados:
- **Política de fallos de almacenamiento inconsistente.** `auth.service` los convierte en `OperationResult`; `resources`, `loans` y `users` dejan que `repo.set` lance y confían en `AppDataProvider.run`. Las operaciones con varias escrituras no son atómicas (afecta LSP, SRP y DIP).
- **Literales de dominio duplicados.** `'Dañado'` en 4 sitios, `'Estudiante'` en 4 líneas y la definición de "préstamo activo" en 4 archivos. La tabla existe, pero algunos consumidores no la consultan (OCP y SRP).
- **Consultas no reactivas.** Las consultas del contexto de préstamos leen el almacenamiento y no el estado, lo que obliga a 4 comentarios `eslint-disable react-hooks/exhaustive-deps` (`AppDataProvider.tsx:174`, `useMyLoans.ts:29`, `useDeliveries.ts:40`, `useReturns.ts:49`) (ISP).
- **Capas invertidas y dependencias circulares.** `shared/components` importa de `contexts/` en 6 archivos. Además `features/loans` y `features/inventory` se importan mutuamente: `AvailabilityPage` importa `ResourceCard`, y `ResourceCard` importa el tipo `Reservation` de `loans/availability` (DIP).
- **Pruebas fuertes, pero ninguna sobre el adaptador real.** Hay 350 pruebas (324 unitarias y 26 de propiedades con fast-check) y ninguna ejercita `LocalStorageRepository` (LSP).
- **Puerto síncrono.** El contrato de persistencia no admite un backend asíncrono sin cambiar servicios y providers (DIP).
- **Documentación del código que promete más de lo que cumple.** Las cabeceras de `loans.service`, `resources.service` y `users.service` declaran que nunca lanzan (LSP).

---

## 7. Priorización de mejoras

| Hallazgo | Principio | Severidad | Esfuerzo | Prioridad | Acción sugerida |
|---|---|---|---|---|---|
| Servicios de dominio lanzan si falla `repo.set`; `createLoan` y `registerReturn` pueden dejar datos a medias | LSP (y SRP) | Media | Medio | **Alta** | Extraer `tryWrite` a un módulo compartido, usarlo en `resources`, `loans` y `users`, y ordenar las escrituras de `createLoan` y `registerReturn` para minimizar el daño. |
| Contrato del puerto sin `@throws` y sin prueba contra `LocalStorageRepository` | LSP | Media | Bajo | **Media** | Documentar que `set` puede lanzar y agregar una prueba de contrato `describe.each` sobre los dos adaptadores. |
| M2 incompleta: 25 valores por defecto concretos y providers sobre módulos, sin interfaces de servicio | DIP | Media | Alto | **Media** | Quitar los valores por defecto, crear una fábrica de servicios en la raíz de composición e inyectar interfaces de servicio. |
| Literales de dominio duplicados (`'Dañado'` ×4, `'Estudiante'` ×4, "préstamo activo" ×4) | OCP (y SRP) | Baja | Bajo | **Media** | Crear `CONDITION_RULES` y `isActiveLoan` centralizados. |
| `shared/` importa de `contexts/` (6 archivos) | DIP | Baja | Alto | **Baja** | Mover guardias, layout y `ToastContainer` a una capa sobre `contexts/`. |
| `loans.service` mezcla ciclo y consultas; `resources.service` lee `LS_KEYS.LOANS` | SRP | Baja | Medio | **Baja** | Extraer `availability.service` y una función de consulta de préstamos activos. |
| `useAuth` y `LoansContext` anchos; miembros sin consumidores; re-render ligado a `resources` | ISP | Baja | Bajo | **Baja** | Crear `useSession`, dividir consultas y comandos y eliminar los miembros sin uso. |
| Reducer con `switch` (M7) | OCP | Baja | Bajo | **Baja** | Mapa de handlers solo si crecen las acciones. |
| Puerto síncrono: un backend real exige `Promise` | DIP | Alta (cuando exista backend) | Alto | **Baja** (fuera del MVP) | Hacer asíncrono el puerto, los servicios y los providers al integrar el backend. |

Justificación de la prioridad **Alta**: es la única deuda que puede producir datos inconsistentes (reserva guardada sin descontar stock) y es alcanzable en el uso real, porque las imágenes se guardan como data URL en `localStorage` y la cuota (~5 MB) se puede llenar. El esfuerzo es medio y no cambia lo que ve el usuario.

### 7.1 Diagnóstico original → estado actual de las mejoras M1–M8

Las mejoras se definieron en la sección 7 del análisis del 14/10/2026 (`git show a81f9ed:.kiro/specs/analisis-solid/solid-analysis.md`).

| Código | Principio | Mejora propuesta en el diagnóstico | Estado verificado en `fcad2f3` |
|---|---|---|---|
| M1 | SRP | Separar reglas de negocio, orquestación y persistencia en los servicios | **Hecho con salvedad.** Validación pura delegada y persistencia por el puerto; `loans.service` aún aloja las consultas de disponibilidad. |
| M2 | DIP | Puerto `StorageRepository` e interfaces de servicio inyectadas | **Parcial.** Puerto, dos adaptadores e inyección hechos (commit `0b2d98e`); faltan interfaces de servicio y quitar los 25 valores por defecto. |
| M3 | OCP | Tabla declarativa de transiciones de estado | **Hecho** (commit `793834c`); ampliada en `7575ca3` (en `resourceStateMachine.ts` solo cambiaron líneas de la tabla; `isValidTransition` no se tocó). |
| M4 | SRP + ISP | Contextos por dominio | **Hecho** (commit `3082f79`); `useAuth` sin dividir. |
| M5 | OCP | Estrategia de devolución por condición | **Hecho con salvedad.** `RETURN_CONDITION_STRATEGY` se usa en `loans.service.ts:307`; 4 sitios repiten el literal `'Dañado'`. |
| M6 | SRP | Separar hash, uuid y política de sesión de `auth.service` | **Parcial.** `hashUtils`, `uuidUtils` y validación delegados; `SESSION_DURATION_MS` (línea 28) y la expiración (`getCurrentSession`) siguen en el servicio. |
| M7 | OCP | Reducer con mapa de handlers | **Pendiente.** `switch (action.type)` en `AppDataProvider.tsx:76`, con 2 acciones. |
| M8 | LSP | Reforzar postcondiciones de `OperationResult` | **Parcial.** Hecho para `auth.service` (`tryWrite`, commit `d8e609c`, 7 pruebas nuevas: 4 en `auth.service` y 3 que fijan el comportamiento de `AuthProvider`, cuyo archivo no cambió); pendiente en `resources`, `loans` y `users`. |

---

## 9. Conclusión

**Síntesis del estado del diseño:**
El frontend MVP tiene una base sólida: las reglas variables viven en tablas tipadas, la persistencia queda aislada detrás de un puerto con dos adaptadores y la aplicación completa se prueba sobre un almacenamiento en memoria. Los principios no se cumplen del todo en la capa de servicios (fallos de escritura, mezcla de consultas y comandos) ni en el cierre de la inversión de dependencias (valores por defecto concretos, capas invertidas).

**Principios más comprometidos:**
LSP (postcondición "no lanza" incumplida en tres servicios y adaptador real sin probar), DIP (mejora M2 incompleta) y SRP (en `loans.service` y `AppDataProvider`).

**Principios mejor implementados:**
OCP, seguido del puerto de persistencia, que es lo más logrado de DIP.

**Nivel de deuda técnica asociada al diseño:**
Media. Ningún hallazgo bloquea el MVP, pero la deuda incluye un hallazgo de prioridad Alta (sección 7): `AppDataProvider.run` evita que la excepción rompa la interfaz y no revierte las escrituras ya hechas, de modo que el riesgo de datos a medias en `createLoan` y `registerReturn` sigue abierto.

**Recomendación final:**
Cerrar primero el manejo de fallos de escritura (`tryWrite` compartido y una prueba de contrato para los dos adaptadores) y completar la mejora M2 antes de conectar un backend. La migración a un backend real también exigirá hacer asíncrono el puerto.

---

## Versión corta para revisión rápida

| Principio | ¿Se cumple? | Evidencia | Problema detectado | Recomendación |
|---|---|---|---|---|
| SRP | Parcial | Validación pura (`validators.ts`, `formResolver.ts`), `resourceStateMachine.ts` y hooks separados de los componentes | `loans.service` mezcla ciclo y consultas; "préstamo activo" duplicado en 4 archivos; `AppDataProvider` con varias tareas | Extraer `availability.service`, centralizar `isActiveLoan`, separar siembra y pantalla de error |
| OCP | Sí | `RESOURCE_TRANSITIONS`, `RETURN_CONDITION_STRATEGY`, `NAV_GROUPS`, `DASHBOARD_VIEWS`, `STATUS_BADGE`; commit `7575ca3`; experimento `Reactivo` (2 archivos) | Literales `'Dañado'` y `'Estudiante'` fuera de las tablas; `switch` del reducer | Crear `CONDITION_RULES`; mapa de handlers solo si crecen las acciones |
| LSP | Parcial | `InMemoryStorageRepository` y `LocalStorageRepository` implementan `StorageRepository`; 350 pruebas sobre el fake | `set` puede lanzar y el puerto no lo declara; 3 servicios lanzan; adaptador real sin pruebas | `@throws` en el puerto, `tryWrite` compartido y prueba de contrato |
| ISP | Parcial | Contextos `Resources`, `Loans` y `Users` separados; `reuseIfEqual`; `StorageRepository` de 3 métodos | `useAuth` mezcla sesión y acciones; `LoansContext` de 9 miembros; miembros sin uso | `useSession`, dividir consultas y comandos, eliminar lo no usado |
| DIP | Parcial | Puerto `StorageRepository`, `repo` inyectado, `app/providers.tsx`, `renderApp` con repositorio en memoria | 25 valores por defecto concretos; providers sobre módulos; `shared` → `contexts` (6 archivos); puerto síncrono | Fábrica en la raíz de composición, interfaces de servicio, mover capas, puerto asíncrono con el backend |

---

## Anexo A. Trazabilidad con el Entregable 1 (RU, RF, RN, HU)

| Historia (Entregable 1) | Código del MVP | Prueba representativa |
|---|---|---|
| RU-01 / RF-01 / HU-01 Registro | `features/auth/pages/RegisterPage`, `components/RegisterForm`, `hooks/useRegisterForm`, `validation.ts` → `contexts/AuthProvider` → `services/mockDb/auth.service.ts` (`registerUser`) | `auth.test.tsx` › `pantalla de registro` › `un registro válido crea la cuenta y vuelve al login con el correo precargado (Req 1.2)` |
| RU-02 / HU-02 Inicio de sesión | `LoginForm`, `useLoginForm` → `auth.service.ts` (`loginUser`) | `auth.test.tsx` › `pantalla de inicio de sesión` › `credenciales inválidas muestran un error genérico y no inician sesión (Req 1.8)` |
| RU-03 / RF-05 / HU-03 Consultar disponibilidad | `features/loans/pages/AvailabilityPage`, `hooks/useAvailability`, `availability.ts` → `loans.service.ts` (`getAvailableResources`, `checkAvailability`) | `resources.property.test.ts` › `Propiedades de disponibilidad por horario (getAvailableResources)` |
| RU-04 / HU-04 Solicitar préstamo | `features/loans/pages/LoanFormPage`, `components/LoanForm`, `hooks/useLoanForm`, `validation.ts` → `loans.service.ts` (`createLoan`) | `loans.test.tsx` › `flujo completo: disponibilidad → solicitud → mis préstamos` › `el estudiante reserva un recurso y lo ve en su lista como Reservado` |
| RU-05 / RF-03 / RF-04 / HU-05 Gestionar inventario | `features/inventory/*` → `resources.service.ts` (`createResource`, `updateResource`, `retireResource`, `updateResourceStatus`) | `inventory.test.tsx` › `dar de baja (Req 4.9, 4.10)` › `un recurso con préstamos activos no se puede dar de baja y se muestra el motivo` |
| RU-06 / RF-06 / HU-06 Entrega y devolución | `features/operations/*` (`useDeliveries`, `useReturns`, `ConditionForm`) → `loans.service.ts` (`registerDelivery`, `registerReturn`) | `operations.test.tsx` › `ciclo completo del técnico: entrega → devolución` › `entrega una reserva y la devuelve desde la otra pantalla` |
| RN-01 Autenticación obligatoria | `PrivateRoute`, `RoleGuard`, `GuestRoute`; solo `/login` y `/register` son públicas | `router.test.tsx` › `sin sesión (Req 1.11, 19.9)` |
| RN-02 Bloqueo por estado del recurso | `shared/utils/resourceRules.ts` (`isResourceBookable`); `features/loans/availability.ts` (`LISTABLE_STATUSES`) | `resources.property.test.ts` (propiedades de disponibilidad) |
| RN-04 Política de retrasos (RF-06) | `shared/utils/dateUtils.ts` (`calculateDelayHours`), `loans.service.ts` (`registerReturn`) | `loans.property.test.ts` › `Propiedades de calculateDelayHours` |
| Diagrama de clases → código | `Usuario` → `User`; `Rol` → `UserRole` y `ROLE_LABELS`; `Recurso` → `Resource`; `Prestamo` → `Loan`; `EstadoRecurso` → `ResourceStatusHistory`. Métodos: `iniciarSesion` → `loginUser`, `registrarEntrega` → `registerDelivery`, `calcularRetraso` → `calculateDelayHours`, `darDeBaja` → `retireResource`, `actualizarEstado` → `updateResourceStatus` | — |

## Anexo B. Reglas y elementos del Entregable 1 que NO se implementaron (o se implementaron a medias)

| Elemento | Entregable 1 | Estado en el MVP | Evidencia |
|---|---|---|---|
| **RN-03** Máximo 3 préstamos activos | Sí | **No implementada.** `MAX_ACTIVE_SHOWN = 3` en `features/dashboard/components/StudentDashboard.tsx` solo limita cuántos préstamos se muestran. | HU-04, segundo escenario Gherkin, sin cubrir |
| **RN-05** Horario operativo (7:00 a 20:00) | Sí | **No implementada.** No existe validación de horario operativo. | Sin coincidencias en el código |
| **Cédula** (RF-01) | Numérica, única, de 6 a 10 dígitos | **Parcial.** Campo obligatorio y guardado (`User.cedula`), sin validar formato, longitud ni unicidad. | `features/auth/validation.ts:49` |
| **Rol Docente** | Administrador, Técnico, Docente, Estudiante | **No existe.** Solo hay tres roles: `Estudiante`, `Técnico_Laboratorio`, `Administrador_Laboratorio`. | `shared/types/index.ts:8-11` |
| **Asignación de roles** (RF-02) | El administrador asigna el rol | **Parcial.** El rol se elige en el formulario de registro (por defecto `Estudiante`); no hay pantalla de asignación. | `features/auth/hooks/useRegisterForm.ts:15` |
| **Cancelación de reservas** (hasta 2 h antes) | Post-MVP | **No implementada.** No hay `cancelLoan` ni botón; `Cancelado` solo existe en el tipo, en `StatusBadge` y en el préstamo semilla `p-0005`. | `seed-data.ts:202,208` |
| **Estado `Vencido`** y estado "Retrasado" | Retrasado | **No se asigna nunca.** `Vencido` está en el tipo y en `StatusBadge`, pero ningún código lo usa. El retraso se guarda como `retrasoHoras`, sin cambiar el estado del préstamo. | `shared/types/index.ts:61-66` |
| **Cambio manual de estado** (RF-04) | El técnico cambia a mantenimiento o defectuoso | **Parcial.** `updateResourceStatus` existe en el servicio y en el contexto, pero ninguna pantalla lo invoca; la única vía a `En_Mantenimiento` en la interfaz es una devolución `Dañado`. | 0 usos en `features/` |
| **Historial de estados** (`EstadoRecurso`) | Clase auxiliar | **Parcial.** Se persiste en cada cambio válido (`appendStatusHistory`), pero no hay pantalla que lo muestre. | `resources.service.ts:35-43` |
| **Gestión de inventario por Técnico** (RU-05) | Técnico o Administrador | **Cambió.** Solo el administrador accede a `/inventory`. | `shared/constants/navigation.ts:61-64`; `inventory.test.tsx` › `acceso al inventario` › `Técnico_Laboratorio no puede entrar` |
| **RNF-01, RNF-02, RNF-03** | Tiempos de respuesta, carga y navegadores | **No medidos.** | — |
| **Story mapping Post-MVP** | Recuperar contraseña, 2FA, importación CSV, calendario, notificaciones, reservas recurrentes, cancelar, reportes y sanciones | **Ninguno implementado.** Solo hay un aviso "¿Olvidaste tu contraseña?" que indica función futura. | `requirements.md` (requisitos Post-MVP); `tasks.md` tareas 23 a 31 sin marcar |
| **Mensaje de login inválido** (HU-02) | "Usuario o contraseña inválidos" | **Texto distinto:** `'Correo o contraseña incorrectos.'` (genérico, no revela cuál campo falla). | `services/mockDb/auth.service.ts:29` |

Evolución adicional respecto del Entregable 1 (no son carencias): los recursos tienen cantidades (`cantidadTotal`, `cantidadDisponible`), lo que motivó el commit `7575ca3`; el carnet es obligatorio solo para estudiantes; la contraseña exige además mayúscula, minúscula y número; la duración del préstamo se limita a entre 1 y 24 horas (`validators.ts`, `MIN_LOAN_HOURS` y `MAX_LOAN_HOURS`) y el formulario usa una fecha y dos horas, por lo que el préstamo empieza y termina el mismo día.
