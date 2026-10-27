# Entregable 2 — Diseño de Sistemas de Información

> Nota para la copia en Obsidian: las imágenes usan rutas relativas del repositorio (`diagramas/img/...`). Se visualizan correctamente al abrir o exportar este archivo desde `docs/entregable-2-maestro.md` en el repositorio.

## 0. Portada

| Campo | Valor |
|---|---|
| Proyecto | Sistema de Gestión de Préstamo de Recursos de Laboratorio |
| Integrante | Victor Alejandro Aristizabal Ospina |
| Docente | Alejandra Guerrero Bocanegra |
| Curso | Diseño de Sistemas de Información |
| Fecha (editable) | 26/10/2026 |
| Institución | Instituto Tecnológico Metropolitano (ITM) |

## 1. Refinamiento y consolidación del Entregable 1 en el Entregable 2

El Entregable 1 aportó el contexto, los requisitos de usuario (RU-01..RU-06), los requisitos funcionales (RF-01..RF-06), las reglas de negocio (RN), las historias de usuario (HU-01..HU-06), el story mapping, el diagrama de clases y el prototipo en Figma. El Entregable 2 no los reemplaza: los materializa en un frontend funcional (React 19, TypeScript 6, Vite 8, React Router v7, CSS Modules, React Hook Form, Vitest, Testing Library y fast-check). No hay backend; la persistencia se simula con `localStorage`.

**Tabla 1. Ajustes realizados frente a la entrega anterior**

| Elemento ajustado | Cómo estaba antes | Cómo quedó refinado | Motivo del ajuste |
|---|---|---|---|
| Autenticación (HU-01, HU-02) | Registro e inicio de sesión descritos en historias y prototipo | Formularios con validación pura conectada a React Hook Form; el error de login es siempre genérico (no revela si falló el correo o la contraseña) | Evitar enumeración de usuarios y poder probar la validación sin la interfaz |
| Roles | Administrador, Técnico, Docente y Estudiante | Tres roles: `Estudiante`, `Técnico_Laboratorio`, `Administrador_Laboratorio`. No existe el rol Docente | Acotar el MVP a los actores que ejecutan el flujo principal |
| Disponibilidad (HU-03) | Consulta de recursos en el prototipo | Página de disponibilidad con filtros, para todos los roles | Dar visibilidad antes de solicitar un préstamo |
| Préstamos (HU-04) | Solicitud con fechas | Reserva con duración de 1 a 24 h dentro del mismo día. RN-03 (máximo 3 préstamos activos) y RN-05 (horario operativo) no se implementaron. La cancelación es Post-MVP | Priorizar el flujo principal dentro del tiempo disponible |
| Inventario y estados (HU-05) | Seis estados en el diagrama de clases | Cinco estados (`Disponible`, `Reservado`, `En_Préstamo`, `En_Mantenimiento`, `Dado_de_Baja`) en una tabla declarativa de transiciones; "Defectuoso" pasa a ser la condición `Dañado`. Se agregó cantidad total y disponible | Una máquina de estados explícita evita transiciones inválidas |
| Entregas y devoluciones (HU-06) | Métodos de entrega, devolución y retraso en `Prestamo` | Servicios `registerDelivery` y `registerReturn`; el retraso se guarda en horas. Una devolución dañada envía el recurso a mantenimiento | Aplicar la regla de retraso y de daño de forma verificable |
| Arquitectura y clases | Diagrama de clases sin capas ni persistencia | Capas `app` → `features` → `contexts` → `services` → `shared`, con puerto `StorageRepository`; el nivel 4 de C4 refina el diagrama de clases | Aislar la persistencia y facilitar las pruebas |
| Prototipo | Prototipo Figma | Prototipo funcional navegable con datos semilla | Demostrar las HU en funcionamiento |
| Registro de usuario | Cédula como dato del usuario | La cédula se solicita, pero no se valida su formato ni su unicidad | Limitación declarada del MVP |

## 2. Arquitectura C4

El modelo C4 se elaboró específicamente para este proyecto, porque el PDF de modelo encontrado era genérico. Los diagramas se editan con draw.io; el índice está en [diagramas/README.md](diagramas/README.md).

### Nivel 1. Contexto

![C4 Nivel 1 - Contexto](diagramas/img/c4-1-contexto.png)

Archivo editable: [diagramas/c4-1-contexto.drawio](diagramas/c4-1-contexto.drawio)

Muestra el sistema frente a sus tres actores (estudiante, técnico de laboratorio y administrador). Cada actor corresponde a un rol de las HU del Entregable 1. El sistema no se conecta con servicios externos en el MVP.

### Nivel 2. Contenedores

![C4 Nivel 2 - Contenedores](diagramas/img/c4-2-contenedores.png)

Archivo editable: [diagramas/c4-2-contenedores.drawio](diagramas/c4-2-contenedores.drawio)

En el MVP no hay backend ni base de datos. El único contenedor ejecutable es la aplicación web de una página (React) que corre en el navegador, y los datos se guardan en el `localStorage` del navegador con el prefijo `sistema-prestamos-lab-`.

### Nivel 3. Componentes

![C4 Nivel 3 - Componentes](diagramas/img/c4-3-componentes.png)

Archivo editable: [diagramas/c4-3-componentes.drawio](diagramas/c4-3-componentes.drawio)

Detalla las capas de la aplicación: composición y router (`app/`), módulos por funcionalidad (`features/` de auth, inventory, loans, operations y dashboard), contextos, servicios (`mockDb` y `storage`) y elementos compartidos. Cada módulo corresponde a una o más HU.

### Nivel 4. Código / Clases

Se presenta en dos vistas: dominio y persistencia.

![C4 Nivel 4a - Dominio](diagramas/img/c4-4-codigo-4a-dominio.png)

![C4 Nivel 4b - Persistencia](diagramas/img/c4-4-codigo-4b-persistencia.png)

Archivo editable (ambas vistas): [diagramas/c4-4-codigo.drawio](diagramas/c4-4-codigo.drawio)

Incluye los tipos de dominio `User`, `Resource`, `Loan` y `StatusHistory` (en TypeScript son tipos, no clases), la interfaz `StorageRepository` y sus adaptadores `LocalStorageRepository` e `InMemoryStorageRepository`. Señala los patrones candidatos de la sección 3. Es el refinamiento del diagrama de clases del Entregable 1.

## 3. Patrones de diseño GoF

No se recibió una plantilla GoF separada; esta sección se diligenció con el criterio del enunciado: cinco patrones distintos, cada uno con una necesidad concreta del MVP, sin sobreingeniería. Los patrones Adapter, State y Strategy son los casos más directos. Facade y Observer son aplicaciones pragmáticas del diseño en React.

### 3.1 Adapter

- **Necesidad (MVP):** los servicios deben guardar datos sin depender de `localStorage`, para poder cambiar a una API real y probar con memoria.
- **Intención:** convertir una interfaz existente en la que el cliente espera.
- **Aplicación:** `StorageRepository` (`get`, `set`, `remove`) en `src/services/storage/StorageRepository.ts`, con `LocalStorageRepository` e `InMemoryStorageRepository`. Repository es el puerto arquitectónico; Adapter es el encaje GoF de `localStorage` a ese puerto.
- **Relación con E1:** todas las RU/RF que persisten datos (RF-01..RF-06) y HU-01..HU-06.
- **Beneficios:** los servicios no conocen el almacenamiento; las pruebas usan memoria.
- **Alternativa descartada:** llamar a `localStorage` directamente en cada servicio; acopla la lógica al navegador y complica las pruebas.
- **Límites y validación:** el puerto es síncrono y no declara que escribir pueda fallar. La suite de 350 pruebas usa el adaptador en memoria.

### 3.2 Strategy

- **Necesidad (MVP):** el estado del recurso tras una devolución depende de su condición (HU-06).
- **Intención:** encapsular una variación de comportamiento intercambiable.
- **Aplicación:** `RETURN_CONDITION_STRATEGY` en `src/shared/constants/resourceStateMachine.ts` asigna `Bueno` y `Regular` a `Disponible`, y `Dañado` a `En_Mantenimiento`. Las etiquetas están en `src/shared/constants/conditions.ts`.
- **Relación con E1:** HU-06 y la regla de devolución dañada.
- **Beneficios:** una condición nueva se agrega como una entrada de la tabla, sin condicionales en el servicio.
- **Alternativa descartada:** un `if (Dañado)` dentro de `registerReturn`; crece con cada condición.
- **Límites y validación:** es una tabla de datos, no clases con una interfaz común; es la forma funcional del patrón. Lo cubren las pruebas de devolución.

### 3.3 State

- **Necesidad (MVP):** un recurso solo puede pasar por ciertos estados (HU-04, HU-05, HU-06).
- **Intención:** hacer que el comportamiento dependa del estado y que las transiciones sean explícitas.
- **Aplicación:** `RESOURCE_TRANSITIONS` e `isValidTransition` en `src/shared/constants/resourceStateMachine.ts`. Flujo: Disponible → Reservado → En_Préstamo → Disponible o En_Mantenimiento → Disponible o Dado_de_Baja.
- **Relación con E1:** los estados del diagrama de clases y RN-02 (bloqueo por estado).
- **Beneficios:** una transición inválida se rechaza en un único lugar.
- **Alternativa descartada:** clases de estado con herencia; excesivo para cinco estados.
- **Límites y validación:** la máquina es declarativa, no una jerarquía de clases. El estado se modela por recurso y no por unidad física. Hay pruebas unitarias y de propiedades.

### 3.4 Facade

- **Necesidad (MVP):** las pantallas y contextos necesitan operaciones simples (reservar, entregar, devolver) sin conocer validaciones, historial ni persistencia.
- **Intención:** ofrecer una interfaz unificada a un conjunto de operaciones internas.
- **Aplicación:** los módulos `src/services/mockDb/loans.service.ts` (`createLoan`, `registerDelivery`, `registerReturn`), `resources.service.ts` y `auth.service.ts` (`registerUser`, `loginUser`, `logoutUser`). Devuelven `OperationResult<T>`.
- **Relación con E1:** HU-01, HU-02, HU-04, HU-05, HU-06.
- **Beneficios:** la interfaz de usuario llama una función y recibe un resultado uniforme.
- **Alternativa descartada:** que cada componente coordine recursos, préstamos e historial; duplica reglas.
- **Límites y validación:** es una aplicación pragmática, no una clase Facade formal. Los servicios `resources`, `loans` y `users` aún pueden lanzar excepciones si falla la escritura. Se valida con las pruebas de servicios.

### 3.5 Observer

- **Necesidad (MVP):** cuando cambia la sesión, el inventario o un préstamo, todas las pantallas afectadas deben actualizarse.
- **Intención:** notificar a los interesados cuando cambia un estado compartido.
- **Aplicación:** React Context y hooks: `AuthProvider`, `AppDataProvider`, `UIProvider`, `useAuth`, `useLoans`, `useResources` y `useToast` (en `src/contexts/`). Los consumidores se vuelven a renderizar al cambiar el valor del contexto.
- **Relación con E1:** HU-03 (disponibilidad al día) y HU-04..HU-06.
- **Beneficios:** sin enlaces manuales entre pantallas.
- **Alternativa descartada:** implementar un Subject propio con suscripciones; duplica lo que React ya ofrece.
- **Límites y validación:** es el mecanismo reactivo del framework usado con la idea del patrón Observer, no una implementación manual de Subject. Se valida con pruebas de componentes.

### 3.6 Tabla comparativa

| Patrón | Necesidad del MVP | Ubicación | Tipo de aplicación |
|---|---|---|---|
| Adapter | Persistencia intercambiable | `src/services/storage/` | Directa |
| Strategy | Estado según condición al devolver | `RETURN_CONDITION_STRATEGY` | Directa (tabla) |
| State | Transiciones válidas del recurso | `RESOURCE_TRANSITIONS` | Directa (declarativa) |
| Facade | API simple para la interfaz | `src/services/mockDb/` | Pragmática |
| Observer | Actualización reactiva | `src/contexts/` | Pragmática (framework) |

Los cinco patrones son distintos entre sí y resuelven necesidades diferentes: persistencia, variación por condición, ciclo de vida, punto de entrada y notificación.

## 4. Prototipo funcional

El flujo principal implementado es: el estudiante inicia sesión, consulta la disponibilidad, reserva un recurso (1 a 24 h); el técnico registra la entrega y luego la devolución con la condición del recurso; el administrador revisa y gestiona el inventario. El paso a paso está en [guia-de-pruebas-manuales.md](guia-de-pruebas-manuales.md). El proyecto tiene 350 pruebas automáticas (324 unitarias y 26 de propiedades con fast-check).

Cuentas demo (solo como apoyo):

| Rol | Correo | Contraseña |
|---|---|---|
| Estudiante | `estudiante@itm.edu.co` | `Estudiante123` |
| Técnico de laboratorio | `tecnico@itm.edu.co` | `Tecnico123` |
| Administrador | `admin@itm.edu.co` | `Admin123` |

Capturas que se deben tomar y pegar aquí (no se incluyen capturas del flujo en este repositorio):

- [Captura pendiente: inicio de sesión del estudiante]
- [Captura pendiente: disponibilidad de recursos]
- [Captura pendiente: formulario de reserva y confirmación]
- [Captura pendiente: entrega registrada por el técnico]
- [Captura pendiente: devolución con condición del recurso]
- [Captura pendiente: inventario del administrador]

## 5. Diagramas de actividades del MVP

Representan el flujo principal de cada historia implementada. Índice en [diagramas/README.md](diagramas/README.md).

### HU-01. Registro de nuevo usuario
![Actividad HU-01](diagramas/img/actividad-hu-01-registro.png)

Editable: [diagramas/actividad-hu-01-registro.drawio](diagramas/actividad-hu-01-registro.drawio). El usuario completa el formulario, se valida y se crea la cuenta.

### HU-02. Inicio de sesión
![Actividad HU-02](diagramas/img/actividad-hu-02-inicio-sesion.png)

Editable: [diagramas/actividad-hu-02-inicio-sesion.drawio](diagramas/actividad-hu-02-inicio-sesion.drawio). Se validan las credenciales y se entra al panel según el rol.

### HU-03. Consultar disponibilidad
![Actividad HU-03](diagramas/img/actividad-hu-03-consultar-disponibilidad.png)

Editable: [diagramas/actividad-hu-03-consultar-disponibilidad.drawio](diagramas/actividad-hu-03-consultar-disponibilidad.drawio). Se listan los recursos y su disponibilidad.

### HU-04. Solicitar préstamo
![Actividad HU-04](diagramas/img/actividad-hu-04-solicitar-prestamo.png)

Editable: [diagramas/actividad-hu-04-solicitar-prestamo.drawio](diagramas/actividad-hu-04-solicitar-prestamo.drawio). Se elige recurso y horario (1 a 24 h) y se crea la reserva.

### HU-05. Gestión de inventario
![Actividad HU-05](diagramas/img/actividad-hu-05-gestion-inventario.png)

Editable: [diagramas/actividad-hu-05-gestion-inventario.drawio](diagramas/actividad-hu-05-gestion-inventario.drawio). El administrador crea, edita o da de baja recursos; la baja se rechaza si hay préstamos activos.

### HU-06. Registrar entrega y devolución
![Actividad HU-06](diagramas/img/actividad-hu-06-entrega-devolucion.png)

Editable: [diagramas/actividad-hu-06-entrega-devolucion.drawio](diagramas/actividad-hu-06-entrega-devolucion.drawio). El técnico entrega la reserva y registra la devolución con su condición; si está dañado, el recurso pasa a mantenimiento.

## 6. Aplicación de Principios SOLID

El análisis se hizo sobre el código del MVP. Como el código usa TypeScript funcional sin herencia de dominio, Liskov se evaluó como sustituibilidad de contratos.

| Principio | Nivel | Resumen |
|---|---|---|
| S (Responsabilidad única) | Medio / Parcial | Validación, fechas, máquina de estados y persistencia están en módulos propios; el servicio de préstamos también aloja consultas de disponibilidad. |
| O (Abierto/Cerrado) | Alto / Cumple | Estados, condiciones, roles, tipos y menú se extienden editando tablas tipadas. |
| L (Sustitución de Liskov) | Medio / Parcial | Las dos implementaciones del puerto son intercambiables; el puerto no declara que escribir puede fallar y ninguna prueba ejercita el adaptador real. |
| I (Segregación de interfaces) | Medio / Parcial | Contextos por dominio y puerto de tres métodos; el contexto de sesión mezcla lectura y acciones. |
| D (Inversión de dependencias) | Medio / Parcial | Puerto inyectable y raíz de composición; quedan valores por defecto concretos (DIP M2 parcial). |

Deuda conocida:

- Componentes de `shared` que dependen de la capa de `contexts`.
- DIP M2 parcial: quedan dependencias concretas por defecto.
- Los servicios distintos de auth (`resources`, `loans`, `users`) aún pueden lanzar si falla la escritura.
- El estado se modela por recurso y no por unidad física.

Ninguno bloquea el MVP. Análisis completo (anexo): [solid-analysis.md](../.kiro/specs/analisis-solid/solid-analysis.md). Documentos de apoyo: [solid-aplicado-en-el-frontend.md](solid-aplicado-en-el-frontend.md) y [entregable-2-seccion-6-solid.md](entregable-2-seccion-6-solid.md).

## 7. Anexos, enlaces y bibliografía

**Enlaces**

- Repositorio en GitHub: [Pegar aquí el enlace del repositorio]
- Prototipo Figma (Entregable 1): https://www.figma.com/make/mUOfKBWLRjzhbzUaiBGgVP/Sistema-de-Gesti%C3%B3n-de-Pr%C3%A9stamos?t=5LQft74EymGE12Cs-1
- Diagramas editables (draw.io): carpeta [diagramas/](diagramas/); si se publica el repositorio, usar el enlace de esa carpeta.

**Anexos**

- Análisis SOLID: [solid-analysis.md](../.kiro/specs/analisis-solid/solid-analysis.md)
- Diagramas draw.io: `docs/diagramas/*.drawio`
- Imágenes: `docs/diagramas/img/`
- Guía de pruebas manuales: [guia-de-pruebas-manuales.md](guia-de-pruebas-manuales.md)
- Plantilla/criterios GoF: no se recibió una plantilla separada, por lo que la sección 3 se diligenció con los criterios del enunciado.
- Capturas pendientes: las listadas en la sección 4.

**Bibliografía**

- Gamma, E., Helm, R., Johnson, R. y Vlissides, J. *Design Patterns: Elements of Reusable Object-Oriented Software*. Addison-Wesley.
- Martin, R. C. *Clean Architecture* (principios SOLID). Prentice Hall.
- Brown, S. *The C4 model for visualising software architecture*. https://c4model.com
- Documentación oficial de React: https://react.dev
- Documentación oficial de TypeScript: https://www.typescriptlang.org/docs/
- Documentación oficial de Vite: https://vite.dev
- Documentación oficial de React Router: https://reactrouter.com
- draw.io (diagrams.net): https://www.drawio.com