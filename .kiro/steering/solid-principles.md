---
inclusion: auto
name: solid-principles
description: Guía de cómo se aplican los principios SOLID en este proyecto (servicios mock, contextos, componentes y router), con reglas para código nuevo, el estado real de las mejoras M1-M8 y la deuda conocida. Úsala al diseñar, escribir, refactorizar o revisar código, y al redactar el análisis SOLID del Entregable 2.
---

# Principios SOLID en el proyecto

## Cómo usar esta guía

- **Análisis del Entregable 2:** `.kiro/specs/analisis-solid/solid-analysis.md` es la plantilla oficial diligenciada sobre el **código actual** (commit `fcad2f3`, 26/10/2026). El diagnóstico original, que evaluaba el *diseño* antes de escribir código (sus calificaciones "No cumple" y "Bajo" **no describen el código actual**) y define las mejoras M1–M8, se recupera con `git show a81f9ed:.kiro/specs/analisis-solid/solid-analysis.md`.
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
| Panel de inicio de cada rol | `DASHBOARD_VIEWS` (`DashboardPage.tsx`) | `Record<UserRole, ComponentType>`: un rol nuevo exige su panel |
| Etiquetas de roles, tipos de recurso y condiciones | `ROLE_LABELS`, `RESOURCE_TYPE_LABELS`, `CONDITION_LABELS` | `Record<Unión, string>` en cada caso |
| Opciones del menú y quién las ve | `NAV_GROUPS` | — (ver "Cómo hacer cambios comunes") |
| Migas de pan por ruta | `ROUTE_BREADCRUMBS` | — |
| Roles de un grupo de rutas | `allowedRoles` de `RoleGuard` | — |

**Evidencia real:** en el commit `7575ca3`, al aparecer el caso de recursos con varias unidades, se añadieron `Disponible → En_Mantenimiento` y `Reservado → En_Mantenimiento`. Solo cambiaron líneas de la tabla; `isValidTransition` no se tocó.

**Literales que siguen fuera de las tablas:** la regla "Dañado exige observaciones" está en `loans.service.ts`, `features/operations/validation.ts` y `useConditionForm.ts`, y `useReturns.ts` repite que `Dañado` va a mantenimiento; `'Estudiante'` aparece como literal en `features/auth` y en `AvailabilityPage.tsx`. Ver "Deuda conocida".

## L — Sustitución de Liskov (LSP)

El proyecto es funcional y **no usa herencia**, así que LSP se evalúa como **sustituibilidad de contratos**: otra implementación del mismo contrato no debe obligar a cambiar al cliente.

- **`OperationResult<T>`:** todo servicio devuelve `{ success, data | error }`.
- **`StorageRepository`** tiene dos implementaciones intercambiables: `LocalStorageRepository` (producción) e `InMemoryStorageRepository` (tests). Toda la suite de servicios y contextos corre sobre el fake sin cambiar el código bajo prueba.
- **Evidencia en tests:** `services.test.ts` → "postcondición de OperationResult"; `contexts.test.tsx` → fallos de almacenamiento convertidos en resultado de error.

**Límite conocido:** el contrato del puerto está incompleto. `LocalStorageRepository.set` lanza un `Error` si el almacenamiento falla (cuota, modo privado), pero `InMemoryStorageRepository.set` nunca lanza y la interfaz no documenta ese comportamiento. `auth.service` ya captura esos fallos (`tryWrite`) y devuelve `success: false`. `resources.service`, `loans.service` y `users.service` todavía dejan que `repo.set` lance; `AppDataProvider` lo contiene en `run` (ver "Deuda conocida"). Además, ningún test ejercita `LocalStorageRepository` (los 350 usan `InMemoryStorageRepository` o repositorios falsos), así que la sustituibilidad real↔fake no tiene una prueba de contrato. Y las cabeceras de esos tres servicios ("nunca lanza") no deben usarse como evidencia de LSP.

## I — Segregación de interfaces (ISP)

Los clientes no deben depender de lo que no usan.

- **Un contexto por dominio**, en `contexts/AppDataContext.ts`: `ResourcesContext`, `LoansContext`, `UsersContext`, con sus hooks `useResources`, `useLoans`, `useUsers`.
- **Los re-renders respetan la segregación:** el reducer conserva la referencia de un slice si su contenido no cambió (`reuseIfEqual` en `AppDataProvider.tsx`). Un test lo comprueba: "un cambio de préstamos no cambia la referencia de recursos…".
- **Props mínimas:** `StatusBadge` recibe solo `status`; `Toast`, `Breadcrumb` y `Modal` reciben únicamente lo que usan; `Button` extiende `ComponentProps<'button'>`.

**Límites conocidos:** `useAuth` aún agrupa lectura (`session`) y acciones (`login`, `logout`, `register`); 8 de sus 11 consumidores solo leen `session`. `LoansContextValue` tiene 9 miembros y ningún consumidor usa más de 3; `checkAvailability`, `getUserById`, `updateUser`, `updateResourceStatus`, `isGlobalLoading` y `setGlobalLoading` no tienen consumidores fuera de los providers. Las consultas de préstamos leen el almacenamiento y no el estado, por lo que `LoansContext` depende de `state.resources` y hay 4 `eslint-disable react-hooks/exhaustive-deps` (`AppDataProvider.tsx`, `useMyLoans.ts`, `useDeliveries.ts`, `useReturns.ts`).

## D — Inversión de dependencias (DIP)

Los módulos de alto nivel dependen de abstracciones.

- **Puerto:** `services/storage/StorageRepository.ts`. El único archivo que usa `localStorage` es `LocalStorageRepository.ts`; ningún otro archivo de `src/` lo toca.
- **Inyección:** cada servicio recibe `repo` como último parámetro; `AuthProvider` y `AppDataProvider` reciben `repository`; `AppProviders` (`app/providers.tsx`) es la **raíz de composición** donde se elige la implementación.
- **Abstracción de sesión:** `PrivateRoute`, `RoleGuard`, `Sidebar` y `AppShell` dependen de `useAuth`, no de `auth.service`.
- **Fronteras:** solo los providers importan servicios concretos; ningún componente ni página lo hace. Mantenlo así.

**Límites conocidos:** hay 25 valores por defecto concretos `= localStorageRepository`: 22 en las firmas de los cuatro servicios (`auth` 4, `loans` 8, `resources` 7, `users` 3) y 3 en providers (`AuthProvider`, `AppDataProvider` y `app/providers.tsx`; este último es el legítimo de la raíz de composición). Por eso los servicios todavía importan la implementación concreta. Los providers importan módulos de servicio, no interfaces, y no existen interfaces de servicio. Además, `shared/` (guardias, layout, `ToastContainer`) importa de `contexts/`, lo que invierte el sentido de capas del diseño (ver "Deuda conocida").

## Estado de las mejoras

| Código | Principio | Estado | Evidencia o pendiente |
|---|---|---|---|
| **M1** | SRP en servicios | **Hecho con salvedad** | Validación pura delegada; ver tabla SRP. `loans.service` aún contiene también las consultas de disponibilidad. |
| **M2** | DIP, puerto de persistencia | **Parcial** | Hecho: puerto, dos implementaciones, inyección, raíz de composición `app/providers.tsx`. Pendiente: interfaces de servicio y quitar los 25 valores por defecto (22 en servicios y 3 en providers, uno de ellos legítimo). |
| **M3** | OCP, transiciones declarativas | **Hecho** | `RESOURCE_TRANSITIONS`, `isValidTransition`. |
| **M4** | SRP/ISP, contextos por dominio | **Hecho** | Tres contextos y tres hooks. `useAuth` sin dividir. |
| **M5** | OCP, estrategia de devolución | **Hecho con salvedad** | `RETURN_CONDITION_STRATEGY` usada en `registerReturn`. Salvedad: el literal `'Dañado'` se repite en 4 sitios (`loans.service`, `features/operations/validation.ts`, `useConditionForm.ts`, `useReturns.ts`). |
| **M6** | SRP en autenticación | **Parcial** | Hash, uuid y validación delegados. La duración de sesión (8 h) y su expiración siguen en `auth.service.ts`. |
| **M7** | OCP, reducer por mapa de handlers | **Pendiente** | El reducer usa `switch` con 2 acciones; bajo valor por ahora. |
| **M8** | LSP, postcondiciones | **Parcial** | Hecho en `auth.service` (commit `d8e609c`): `tryWrite` y 7 tests de `repo.set` que falla (4 en `auth.service` y 3 en `AuthProvider`, cuyo archivo no cambió). Pendiente: lo mismo en `resources`, `loans` y `users` (hoy lo contiene `AppDataProvider.run`, que no revierte escrituras parciales). |

## Deuda conocida (por prioridad)

Verificada contra el commit `fcad2f3`. El detalle y la priorización con severidad y esfuerzo están en `.kiro/specs/analisis-solid/solid-analysis.md`, secciones 6 y 7.

1. **Alta — los servicios de dominio pueden lanzar y dejar datos a medias.** `resources.service` (`writeResources`, línea 32; historial de estado, línea 41), `loans.service` (`writeLoans`, línea 51) y `users.service` (`updateUser`, línea 45) llaman a `repo.set` sin capturar errores; `seed-data.ts` (líneas 240-245) tampoco, aunque se ejecuta dentro del `try` de `initState`. Solo `AppDataProvider.run` evita que la excepción llegue a la UI, y no revierte lo ya escrito. Comprobado con un almacenamiento simulado: `createResource`, `updateUser` y `createLoan` lanzaron, y `createLoan` dejó el préstamo guardado sin descontar el stock. `auth.service` ya está corregido (`tryWrite`, commit `d8e609c`). Corrección: mover `tryWrite` a un módulo compartido, aplicarlo en los tres servicios y decidir el orden de las escrituras de `createLoan` y `registerReturn`.
2. **Media — DIP incompleto (M2).** Definir interfaces de servicio para que los providers dependan de ellas, y quitar los 25 valores por defecto `= localStorageRepository` (22 en servicios, 3 en providers; el de `app/providers.tsx` es legítimo).
3. **Media — sin prueba de contrato del adaptador real.** Ningún test usa `LocalStorageRepository`, y `StorageRepository.set` no documenta que puede lanzar. Corrección: `@throws` en el puerto y un `describe.each` sobre los dos adaptadores.
4. **Media — literales de dominio duplicados.** `'Dañado'` en 4 sitios (`loans.service.ts:239`, `features/operations/validation.ts:29`, `useConditionForm.ts:46`, `useReturns.ts:64`), `'Estudiante'` en 4 líneas de `features/auth` y `AvailabilityPage.tsx`, y "préstamo activo" (`Reservado` o `En_Préstamo`) en 4 archivos (`loans.service.ts:55`, `resources.service.ts:251`, `features/loans/availability.ts:62`, `features/dashboard/summaries.ts:43`). Corrección: una tabla `CONDITION_RULES` y un `isActiveLoan` compartido.
5. **Baja — capas.** Seis archivos de `shared/components/` importan de `contexts/`: `guards/GuestRoute.tsx`, `guards/PrivateRoute.tsx`, `guards/RoleGuard.tsx`, `layout/AppShell.tsx`, `layout/Sidebar.tsx` (todos `useAuth`) y `ui/ToastContainer.tsx` (`useToast`). El import de tipo `ToastType` ya se movió a `shared/types` (commit `9d28f0b`). La opción más coherente es mover guardias, layout y `ToastContainer` a una capa por encima de `contexts/` (p. ej. `src/layout/` o dentro de `app/`): toca unos 15 archivos más imports en tests y CSS. También hay un ciclo entre `features/loans` y `features/inventory`.
6. **Baja — ISP.** Separar `useSession` de las acciones de `useAuth`; dividir consultas y comandos de `LoansContext`; quitar o consumir los miembros sin uso; hacer que las consultas dependan del estado para eliminar los 4 `eslint-disable`.
7. **Baja — `loans.service` y `resources.service`.** Separar el ciclo del préstamo de las consultas de disponibilidad, y que `retireResource` (`resources.service.ts:247`) no lea `LS_KEYS.LOANS` directamente.
8. **Baja — reducer.** Mapa de handlers si crecen las acciones (M7).
9. **Baja (fuera del MVP) — puerto síncrono.** Un backend real exige `Promise`.

## Cómo hacer cambios comunes sin romper SOLID

- **Agregar un estado de recurso:** añadir el literal a `ResourceStatus`; el compilador marcará `RESOURCE_TRANSITIONS` y `STATUS_BADGE` hasta completarlos. No hace falta tocar funciones.
- **Agregar un rol:** añadirlo a `UserRole`; el compilador exige su etiqueta en `ROLE_LABELS` (`shared/constants/roles.ts`, de donde sale `ALL_ROLES`) y su panel en `DASHBOARD_VIEWS` (`DashboardPage.tsx`). Luego ajustar `roles` en `NAV_GROUPS` **a mano**: el compilador no lo exige y sin ese ajuste el rol solo vería "Inicio" y "Disponibilidad". El `Sidebar`, el router y el registro se actualizan solos.
- **Agregar un tipo de recurso:** añadirlo a la unión `ResourceType` (`shared/types/index.ts`) y a `RESOURCE_TYPE_LABELS` (`shared/constants/resourceTypes.ts`): 2 archivos. Los filtros y el formulario de inventario salen de `RESOURCE_TYPES`.
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

- Los tres documentos del Entregable 2 sobre SOLID: `.kiro/specs/analisis-solid/solid-analysis.md` (plantilla diligenciada, anexo de la Sección 7), `docs/solid-aplicado-en-el-frontend.md` (guía para exponer) y `docs/entregable-2-seccion-6-solid.md` (texto de la Sección 6).
- Distingue **diagnóstico original** (sobre el diseño, `git show a81f9ed:.kiro/specs/analisis-solid/solid-analysis.md`) de **estado actual** (esta guía, el código y `solid-analysis.md`). La tabla "antes → después" por mejora M1–M8 está en `solid-analysis.md`, sección 7.1.
- Cita archivos y tests concretos, no solo el principio. No afirmes cumplimiento total: la sección "Deuda conocida" muestra criterio técnico y es parte del análisis.
