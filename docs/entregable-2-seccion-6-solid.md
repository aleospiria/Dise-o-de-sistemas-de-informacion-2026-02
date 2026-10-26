# Sección 6. Aplicación de Principios SOLID

> Texto listo para pegar en el documento del Entregable No. 2. Las notas dirigidas al estudiante están al final, bajo "Notas para el estudiante (no pegar)".

## 6.1 Enfoque del análisis

El análisis de los principios SOLID se hizo sobre el **código implementado del MVP** del frontend (commit `fcad2f3`), no sobre ejemplos aislados. Los componentes evaluados son los que cambiaron al pasar del Entregable 1 al Entregable 2: el diagrama de clases (`Usuario`, `Rol`, `Recurso`, `Prestamo`, `EstadoRecurso`) se convirtió en tipos de dominio y servicios, y las historias de usuario HU-01 a HU-06 se convirtieron en las carpetas `features/auth`, `features/loans`, `features/inventory` y `features/operations`. El sistema es solo frontend: no hay backend y la persistencia se simula con el `localStorage` del navegador, detrás de un puerto de almacenamiento.

La evidencia combina tres fuentes: el código (con rutas y líneas), la suite automática (350 pruebas, 324 unitarias y 26 de propiedades con fast-check, todas en verde) y la historia de commits entre ambas entregas. Como el código está escrito en TypeScript funcional y no usa herencia de clases de dominio, el principio de Liskov se evaluó como **sustituibilidad de contratos** (una implementación de una interfaz puede reemplazar a otra sin que el cliente cambie), no como relación entre clase base y subclase.

La plantilla oficial diligenciada se anexa en la Sección 7 (archivo `solid-analysis.md`).

## 6.2 Componentes analizados y evolución desde el Entregable 1

| Elemento | Entregable 1 | Entregable 2 (MVP implementado) | Principio donde se analiza |
|---|---|---|---|
| Ciclo del préstamo | `Prestamo.registrarEntrega()`, `registrarDevolucion()` y `calcularRetraso()` | `loans.service.ts` (`createLoan`, `registerDelivery`, `registerReturn`) y `calculateDelayHours`; el retraso se guarda en horas (`retrasoHoras`) | SRP |
| Estados del recurso | Disponible, Prestado, Reservado, Mantenimiento, Defectuoso y Baja | Cinco estados (`Disponible`, `Reservado`, `En_Préstamo`, `En_Mantenimiento`, `Dado_de_Baja`) en la tabla declarativa `RESOURCE_TRANSITIONS`; "Defectuoso" se modela como condición `Dañado` | OCP |
| Roles | Administrador, Técnico, Docente y Estudiante | Tres roles (`Estudiante`, `Técnico_Laboratorio`, `Administrador_Laboratorio`) con `ROLE_LABELS`, `NAV_GROUPS` y `DASHBOARD_VIEWS`; no existe el rol Docente | OCP |
| Cantidad del recurso | Un recurso sin cantidades | `cantidadTotal` y `cantidadDisponible` (varias unidades), lo que, con la devolución dañada de recursos con varias unidades, obligó a ampliar la tabla de transiciones (commit `7575ca3`) | SRP, OCP |
| Persistencia | No especificada en el diagrama de clases | Puerto `StorageRepository` con `LocalStorageRepository` e `InMemoryStorageRepository`; los servicios devuelven `OperationResult<T>` | LSP, DIP |
| Acceso de la interfaz a los datos | No especificado | Contextos por dominio: recursos, préstamos, usuarios, sesión e interfaz | ISP |
| Reglas de negocio | RN-01 a RN-05 | RN-01 (autenticación obligatoria) y RN-02 (bloqueo por estado del recurso) implementadas; **RN-03 (máximo 3 préstamos activos) y RN-05 (horario operativo) no se implementaron**; RN-04 (retrasos) se implementó sin estado "Retrasado" | Alcance |

## 6.3 Resultados por principio

| Principio | Nivel | Resumen |
|---|---|---|
| SRP | Medio | Validación, fechas, máquina de estados y persistencia están en módulos propios; los formularios separan hook y componente. El servicio de préstamos aloja además las consultas de disponibilidad. |
| OCP | Alto | Estados, condiciones, roles, tipos, menú y paneles se extienden editando tablas `Record<Unión, …>`; agregar un tipo de recurso toca 2 archivos y el compilador señala lo que falta. Quedan literales de dominio fuera de las tablas. |
| LSP | Medio | Las dos implementaciones del puerto son intercambiables en toda la suite. El puerto no declara que escribir puede fallar, tres servicios pueden lanzar si falla el almacenamiento y ninguna prueba ejercita el adaptador real. |
| ISP | Medio | Contextos por dominio en lugar de uno único y un puerto de tres métodos. El contexto de sesión mezcla lectura y acciones y el de préstamos tiene nueve miembros. |
| DIP | Medio | Puerto inyectable, raíz de composición y pruebas sobre almacenamiento en memoria. Incompleto: 25 valores por defecto concretos y seis componentes compartidos que dependen de la capa de contextos. |
**Nivel general de calidad del diseño:** Medio, con tendencia a Alto en extensión y persistencia. **Prioridad de intervención:** Media. **Deuda técnica asociada al diseño:** Media: ningún hallazgo bloquea el MVP, pero hay una deuda de prioridad Alta (la ejecución protegida de `AppDataProvider` contiene el error sin revertir la escritura parcial).

## 6.4 Conclusiones

1. **SOLID se aplicó donde más cambió el sistema.** Las reglas variables (estados, roles, tipos, menú) viven en tablas tipadas, y la persistencia está aislada detrás de un puerto. En `resourceStateMachine.ts`, el commit `7575ca3` amplió la máquina de estados para la devolución dañada de recursos con varias unidades cambiando solo líneas de la tabla (7 líneas), sin tocar la función que la consulta; ese mismo commit introdujo `loans.service.ts`.
2. **El cumplimiento no es total y el análisis lo dice.** La deuda principal es el manejo de fallos de escritura: si el almacenamiento está lleno, los servicios de préstamos, recursos y usuarios pueden lanzar una excepción y una reserva podría quedar guardada sin descontar el stock. Hoy el proveedor de datos contiene el error y la interfaz muestra un mensaje.
3. **La arquitectura está lista para crecer, con trabajo pendiente.** Antes de conectar un backend conviene completar la inversión de dependencias (quitar los valores por defecto e introducir interfaces de servicio) y hacer asíncrono el puerto, porque una API real no es síncrona.
4. **Hay reglas del Entregable 1 sin implementar** (RN-03, RN-05, validación de formato de la cédula, rol Docente y cancelación de reservas). Se declaran como alcance no cubierto en el anexo y no se presentan como funcionales.

## 6.5 Qué pegar en la Sección 7 (Anexos) en relación con SOLID

- [ ] La plantilla de análisis SOLID diligenciada: convertir `.kiro/specs/analisis-solid/solid-analysis.md` a PDF y adjuntarla completa, incluidos los anexos A y B. El PDF antiguo del mismo nombre (`solid-analysis.pdf`) está desactualizado y debe reemplazarse.
- [ ] El enlace al repositorio, indicando el commit analizado (`fcad2f3`) y la ruta de la plantilla.
- [ ] Una captura de `npx vitest run` con el resultado `17 passed` (archivos) y `350 passed` (pruebas), y otra de `npx tsc -b --noEmit` sin errores, ejecutadas desde `sistemas-informacion/`.
- [ ] Una captura del experimento de extensión: error `TS2741` al agregar el tipo de recurso `Reactivo` solo en la unión, y resultado limpio al completar la etiqueta (ver la sección 4 de `docs/solid-aplicado-en-el-frontend.md`).
- [ ] Los diagramas Mermaid de `docs/solid-aplicado-en-el-frontend.md` (capas, puerto con adaptadores y flujo de estados), exportados como imagen, si se quieren como soporte de la Sección 6.
- [ ] En la bibliografía, la plantilla de análisis de principios SOLID de la asignatura y la guía del Entregable 2.

---

## Notas para el estudiante (no pegar)

1. **Diagrama C4.** Al preparar estos documentos no estaba disponible el diagrama C4 del proyecto: el archivo extraído del curso es la guía genérica del laboratorio (caso LogiTrack). Los nombres de componentes de este texto son los del código. En `solid-analysis.md` (sección 3.2) hay una correspondencia **propuesta** con los cuatro niveles C4; hay que alinearla con tu diagrama final y, si tus nombres de contenedores o componentes difieren, ajustar la tabla de 6.2.
2. **Patrones de diseño.** `design.md` registra Strategy, Repository, Facade y Guard, y los adaptadores de almacenamiento son una aplicación del patrón Adapter. Los cinco patrones definitivos del Entregable 2 son los de tu plantilla de patrones GoF: este texto no afirma coincidencia con ellos. Si alguno coincide (por ejemplo Adapter o Strategy), puedes añadir una frase que lo enlace con el principio correspondiente.
3. **Coherencia con la Sección 1 (Tabla 1).** Las filas de 6.2 sirven también como "Cómo estaba antes / Cómo quedó refinado / Motivo del ajuste" de la Sección 1. Mantén las mismas cifras en ambos lugares.
4. **Cifras.** Todas se verificaron sobre el commit `fcad2f3`: 350 pruebas, 25 valores por defecto concretos (22 en servicios y 3 en providers) y 6 componentes de `shared/` que importan de `contexts/`. Si el código cambia antes de la entrega, hay que recontarlas.
5. **Prototipo y diagramas de actividades.** Este texto no describe el prototipo funcional ni los diagramas de actividades (Secciones 4 y 5). Las guías `docs/guia-de-pruebas-manuales.md` y los flujos F-1 a F-7 sirven de soporte para ellas.
