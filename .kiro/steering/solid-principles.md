---
inclusion: auto
name: solid-principles
description: Guía de cómo se aplican los principios SOLID en este proyecto (servicios mock, contextos, componentes y router), con reglas para código nuevo, el estado real de las mejoras M1-M8 y la deuda conocida. Úsala al diseñar, escribir, refactorizar o revisar código, y al redactar el análisis SOLID del Entregable 2.
---

# Principios SOLID en el proyecto

## Cómo usar esta guía

- **Diagnóstico original:** `.kiro/specs/analisis-solid/solid-analysis.md`. Evalúa el *diseño* antes de escribir código; sus calificaciones ("No cumple", "Bajo") **no describen el código actual**.
- **Esta guía:** el estado real del código, con el archivo que lo respalda. Si cambias el código, actualiza esta guía; no debe afirmar nada que no se pueda comprobar.
- Las mejoras llevan el código **M1–M8** del diagnóstico. Su estado actual está en la sección "Estado de las mejoras".

## Reglas rápidas para código nuevo

| Principio | Haz | No hagas |
|---|---|---|
| **SRP** | Una razón de cambio por módulo: validación en `validators.ts`, fechas en `dateUtils.ts`, persistencia detrás de `StorageRepository`, reglas de estado en `resourceStateMachine.ts`. Los servicios solo **orquestan**. | Mezclar `localStorage`, reglas de negocio y formato en un mismo archivo o componente. |
| **OCP** | Expresar la variación como **datos**: una tabla `Record<Unión, …>` tipada. Agregar un caso es editar la tabla. | `if (rol === …)` o `switch` sobre estados de dominio dentro de componentes o servicios. |
| **LSP** | Todo servicio devuelve `OperationResult<T>`; toda implementación de `StorageRepository` respeta el mismo contrato. | Lanzar excepciones desde un servicio, o devolver `success: true` sin `data`. |
| **ISP** | Consumir el hook del dominio (`useResources`, `useLoans`, `useUsers`) y pasar props mínimas. | Crear un contexto "todo en uno" o pasar un objeto entero cuando se usa un solo campo. |
| **DIP** | Depender de abstracciones: `StorageRepository`, `useAuth`. Los providers reciben `repository`. | Usar `localStorage` fuera de `LocalStorageRepository`; importar `services/mockDb/*` desde componentes o páginas. |

## S — Responsabilidad única (SRP)

Un módulo debe tener una sola razón para cambiar.

| Módulo | Su única responsabilidad | Delega en |
|---|---|---|
| `services/mockDb/loans.service.ts` | Orquestar el ciclo del préstamo (crear, entregar, devolver) | `validators`/`dateUtils` (validación pura), `resources.service` (stock y estado), `StorageRepository` (persistencia), `RETURN_CONDITION_STRATEGY` |
| `services/mockDb/resources.service.ts` | CRUD de recursos y cambios de estado | `isValidTransition` para validar la transición |
| `services/mockDb/auth.service.ts` | Registro, inicio de sesión y sesión | `validators`, `hashUtils`, `uuidUtils` |
| `ui/FormField.tsx` y `hooks/useCharCount.ts` | Etiqueta, ayuda, error y contador / conteo de caracteres | `Input`, `Textarea` y `Select` solo aportan el control |
| `layout/routeBreadcrumbs.ts`, `constants/navigation.ts` | Datos de migas y de menú | `AppShell` y `Sidebar` solo los presentan |
| `contexts/requireContext.ts` | El chequeo "hook usado fuera de su provider", en un solo lugar | Todos los hooks de contexto |

**Antes del diagnóstico (M1):** `loans.service` mezclaba validación, solapamiento, retraso, estado del recurso y persistencia. Hoy la validación es pura y testeable sin almacenamiento, y la persistencia pasa por el puerto.

## O — Abierto/cerrado (OCP)

Abierto a extensión, cerrado a modificación. Aquí la extensión se hace **editando datos, no funciones**.

| Para extender… | Edita | Qué fuerza el compilador |
|---|---|---|
| Transiciones de estado de un recurso | `RESOURCE_TRANSITIONS` | Es `Record<ResourceStatus, …>`: un estado nuevo exige una entrada |
| Estado resultante de una devolución | `RETURN_CONDITION_STRATEGY` | `Record<ResourceCondition, …>`: una condición nueva exige entrada |
| Etiqueta y color de un estado | `STATUS_BADGE` | `Record<BadgeStatus, …>` |
| Opciones del menú y quién las ve | `NAV_GROUPS` | — (ver "Cómo hacer cambios comunes") |
| Migas de pan por ruta | `ROUTE_BREADCRUMBS` | — |
| Roles de un grupo de rutas | `allowedRoles` de `RoleGuard` | — |

**Evidencia real:** al aparecer el caso de recursos con varias unidades se añadieron `Disponible → En_Mantenimiento` y `Reservado → En_Mantenimiento`. Solo cambiaron líneas de la tabla; `isValidTransition` no se tocó.

## L — Sustitución de Liskov (LSP)

El proyecto es funcional y **no usa herencia**, así que LSP se evalúa como **sustituibilidad de contratos**: otra implementación del mismo contrato no debe obligar a cambiar al cliente.

- **`OperationResult<T>`:** todo servicio devuelve `{ success, data | error }`.
- **`StorageRepository`** tiene dos implementaciones intercambiables: `LocalStorageRepository` (producción) e `InMemoryStorageRepository` (tests). Toda la suite de servicios y contextos corre sobre el fake sin cambiar el código bajo prueba.
- **Evidencia en tests:** `services.test.ts` → "postcondición de OperationResult"; `contexts.test.tsx` → fallos de almacenamiento convertidos en resultado de error.

**Límite conocido:** el contrato del puerto está incompleto. `LocalStorageRepository.set` lanza un `Error` si el almacenamiento falla (cuota, modo privado), pero `InMemoryStorageRepository.set` nunca lanza y la interfaz no documenta ese comportamiento. `AppDataProvider` lo contiene (función `run`); `AuthProvider` no (ver "Deuda conocida").

## I — Segregación de interfaces (ISP)

Los clientes no deben depender de lo que no usan.

- **Un contexto por dominio**, en `contexts/AppDataContext.ts`: `ResourcesContext`, `LoansContext`, `UsersContext`, con sus hooks `useResources`, `useLoans`, `useUsers`.
- **Los re-renders respetan la segregación:** el reducer conserva la referencia de un slice si su contenido no cambió (`reuseIfEqual` en `AppDataProvider.tsx`). Un test lo comprueba: "un cambio de préstamos no cambia la referencia de recursos…".
- **Props mínimas:** `StatusBadge` recibe solo `status`; `Toast`, `Breadcrumb` y `Modal` reciben únicamente lo que usan; `Button` extiende `ComponentProps<'button'>`.

**Límite conocido:** `useAuth` aún agrupa lectura (`session`) y acciones (`login`, `logout`, `register`). Los guardias y el `Sidebar` solo necesitan `session`.

## D — Inversión de dependencias (DIP)

Los módulos de alto nivel dependen de abstracciones.

- **Puerto:** `services/storage/StorageRepository.ts`. El único archivo que usa `localStorage` es `LocalStorageRepository.ts`; ningún otro archivo de `src/` lo toca.
- **Inyección:** cada servicio recibe `repo` como último parámetro; `AuthProvider` y `AppDataProvider` reciben `repository`; `AppProviders` (`app/providers.tsx`) es la **raíz de composición** donde se elige la implementación.
- **Abstracción de sesión:** `PrivateRoute`, `RoleGuard`, `Sidebar` y `AppShell` dependen de `useAuth`, no de `auth.service`.
- **Fronteras:** solo los providers importan servicios concretos; ningún componente ni página lo hace. Mantenlo así.

**Límites conocidos:** cada servicio declara `repo = localStorageRepository` como valor por defecto, así que el módulo todavía importa la implementación concreta. Los providers importan módulos de servicio, no interfaces. Además, `shared/` (guardias, layout, `ToastContainer`) importa de `contexts/`, lo que invierte el sentido de capas del diseño.

## Estado de las mejoras

| Código | Principio | Estado | Evidencia o pendiente |
|---|---|---|---|
| **M1** | SRP en servicios | **Hecho** | Validación pura delegada; ver tabla SRP. `loans.service` aún contiene también las consultas de disponibilidad. |
| **M2** | DIP, puerto de persistencia | **Parcial** | Hecho: puerto, dos implementaciones, inyección. Pendiente: interfaces de servicio y quitar los valores por defecto. |
| **M3** | OCP, transiciones declarativas | **Hecho** | `RESOURCE_TRANSITIONS`, `isValidTransition`. |
| **M4** | SRP/ISP, contextos por dominio | **Hecho** | Tres contextos y tres hooks. `useAuth` sin dividir. |
| **M5** | OCP, estrategia de devolución | **Hecho** | `RETURN_CONDITION_STRATEGY` usada en `registerReturn`. |
| **M6** | SRP en autenticación | **Parcial** | Hash, uuid y validación delegados. La duración de sesión (8 h) y su expiración siguen en `auth.service.ts`. |
| **M7** | OCP, reducer por mapa de handlers | **Pendiente** | El reducer usa `switch` con 2 acciones; bajo valor por ahora. |
| **M8** | LSP, postcondiciones | **Parcial** | Hay tests de "nunca lanza"; falta cubrir `repo.set` en autenticación. |

## Deuda conocida (por prioridad)

1. **Media — `auth.service` puede lanzar.** `registerUser` y `loginUser` llaman a `repo.set` sin capturar errores; `AuthProvider` tampoco los captura. Con el almacenamiento lleno o bloqueado, iniciar sesión lanzaría en lugar de devolver `OperationResult`. Corrección: capturar en `AuthProvider` (o en el servicio) y devolver `success: false`.
2. **Media — DIP incompleto.** Definir interfaces de servicio y que los providers dependan de ellas; quitar los valores por defecto de `repo`.
3. **Baja — capas.** `shared/` no debería importar de `contexts/`; los componentes podrían recibir sesión y acciones por props o por una abstracción más baja.
4. **Baja — ISP en `useAuth`.** Separar `useSession` de las acciones.
5. **Baja — `loans.service`.** Separar el ciclo del préstamo de las consultas de disponibilidad.
6. **Baja — reducer.** Mapa de handlers si crecen las acciones (M7).

## Cómo hacer cambios comunes sin romper SOLID

- **Agregar un estado de recurso:** añadir el literal a `ResourceStatus`; el compilador marcará `RESOURCE_TRANSITIONS` y `STATUS_BADGE` hasta completarlos. No hace falta tocar funciones.
- **Agregar un rol:** añadirlo a `UserRole` **y a `ALL_ROLES`** (el array no está verificado por el compilador), y ajustar `roles` en `NAV_GROUPS`. El `Sidebar` y el router se actualizan solos.
- **Agregar una página:** fila en `NAV_GROUPS` si va en el menú, fila en `ROUTE_BREADCRUMBS` y la ruta en `router.tsx` usando `getRolesForRoute`. El test que cruza menú y router (`router.test.tsx`) cubre las opciones del menú automáticamente.
- **Agregar una regla de negocio:** como función pura en `validators.ts` o `dateUtils.ts`, con test; el servicio solo la invoca.
- **Probar un servicio:** inyectar `InMemoryStorageRepository`; no usar `localStorage` en tests.
- **Migrar a un backend real:** el puerto actual es **síncrono**, y una API es asíncrona. Habría que volverlo `Promise`-based y adaptar servicios y providers; es un cambio de contrato, no solo una implementación nueva.

## Checklist de revisión

- [ ] ¿El módulo tiene una sola razón para cambiar? ¿Delega validación, persistencia y reglas de estado?
- [ ] ¿La variación está en una tabla tipada con `Record`, y no en `if`/`switch` sobre valores de dominio?
- [ ] ¿Devuelve `OperationResult` sin lanzar? ¿Qué pasa si el almacenamiento falla?
- [ ] ¿El componente consume solo el hook de dominio que necesita?
- [ ] ¿Aparece `localStorage` fuera de `LocalStorageRepository`, o un import de `services/mockDb` fuera de un provider?
- [ ] ¿Se puede probar con `InMemoryStorageRepository`?
- [ ] Si se agrega un caso (estado, rol, condición), ¿bastó con editar datos?

## Para el Entregable 2

- Distingue **diagnóstico** (sobre el diseño, `solid-analysis.md`) de **estado actual** (esta guía y el código). Una tabla "antes → después" por mejora M1–M8 es la evidencia más sólida.
- Cita archivos y tests concretos, no solo el principio. No afirmes cumplimiento total: la sección "Deuda conocida" muestra criterio técnico y es parte del análisis.
