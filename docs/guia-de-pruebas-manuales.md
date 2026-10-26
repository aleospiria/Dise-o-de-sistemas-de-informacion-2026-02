# Guía de pruebas manuales — Sistema de préstamo de recursos de laboratorio

Casos de uso y flujos completos para probar el front a mano y estudiarlo. Cada caso indica qué hacer, qué debe pasar y el requisito que cubre (de `requirements.md`).

## 0. Preparación

```
cd sistemas-informacion
npm run dev          # abre http://localhost:5173
```

**Cuentas de demostración** (también están como botones en la pantalla de inicio de sesión):

| Rol | Correo | Contraseña |
|---|---|---|
| Estudiante (Elena Estudiante) | `estudiante@itm.edu.co` | `Estudiante123` |
| Técnico de laboratorio (Tomás Técnico) | `tecnico@itm.edu.co` | `Tecnico123` |
| Administrador (Ana Admin) | `admin@itm.edu.co` | `Admin123` |

**Reiniciar los datos** (vuelven los datos semilla y se cierra la sesión). Pégalo en la consola del navegador (F12):

```js
Object.keys(localStorage).filter(k => k.startsWith('sistema-prestamos-lab-')).forEach(k => localStorage.removeItem(k)); location.reload()
```

**Cambiar de rol:** usa **una sola ventana** y alterna con "Cerrar sesión" e iniciar con otra cuenta. Los datos viven en `localStorage` y se conservan al cambiar de cuenta, que es lo que permite seguir un préstamo de un rol a otro. No sirven dos pestañas (comparten también la sesión, así que ambas serían el mismo usuario) ni una ventana de incógnito (tiene su propio `localStorage`, vacío, y no ve los datos de la otra).

### Datos semilla

| Recurso | Tipo | Unidades (libres / total) | Estado |
|---|---|---|---|
| Osciloscopio Tektronix TBS1052 | Equipo | 2 / 3 | Disponible (tiene la reserva `p-0001`) |
| Multímetro Fluke 117 | Equipo | 5 / 5 | Disponible |
| Cautín de estación Hakko FX-888D | Herramienta | 3 / 4 | Disponible (tiene el préstamo `p-0002` en curso) |
| Juego de destornilladores de precisión | Herramienta | 6 / 6 | Disponible |
| Protoboard 830 puntos | Material | 18 / 20 | Disponible |
| Kit de resistencias surtidas | Material | 15 / 15 | Disponible |
| Fuente de poder regulable 0-30V | Equipo | 0 / 2 | En mantenimiento |
| Analizador lógico 8 canales | Equipo | 1 / 1 | Disponible (**una sola unidad**, útil para probar agotamiento) |

Préstamos semilla de Elena: `p-0001` **Reservado** (osciloscopio, febrero, ya "vencido" para entrega), `p-0002` **En préstamo** (cautín, con retraso), `p-0003` y `p-0004` **Devuelto**, `p-0005` **Cancelado**. Las fechas semilla son de enero y febrero de 2026, así que verás fechas pasadas: es normal.

### Qué existe y qué no

| Existe | Todavía no |
|---|---|
| Inicio de sesión, registro, cierre de sesión | Post-MVP: recuperar contraseña, 2FA, importar/exportar CSV, calendario, notificaciones de disponibilidad, reservas recurrentes, **cancelar una reserva**, sanciones, reportes |
| **Inicio** (`/dashboard`) con un panel distinto por rol | |
| Disponibilidad, solicitud de préstamo, Mis préstamos | |
| Entregas y devoluciones (técnico/administrador) | |
| Inventario: alta, edición, baja (administrador) | |

---

## 1. Autenticación (Req 1)

| ID | Qué hacer | Resultado esperado |
|---|---|---|
| A-01 | Entrar con cada cuenta de demostración (usa los botones del recuadro y pulsa "Iniciar sesión"). | Llegas a `/dashboard` con un aviso "Hola, {nombre}." y el menú propio de cada rol. |
| A-02 | Pulsar "Iniciar sesión" con todo vacío. | "Este campo es requerido" bajo cada campo; el foco va al primer campo con error; el botón queda deshabilitado. |
| A-03 | Tras A-02, escribir en los campos. | Los errores desaparecen al corregir (validación en tiempo real tras el primer envío) y el botón se habilita. |
| A-04 | Correo `no-es-correo` con cualquier contraseña. | "Ingresa un correo electrónico válido". |
| A-05 | Correo real con contraseña incorrecta, y luego un correo inexistente con cualquier contraseña. | **El mismo mensaje en ambos casos:** "Correo o contraseña incorrectos." (no revela cuál falló). |
| A-06 | Pulsar "¿Olvidaste tu contraseña?". | Aviso informativo: la recuperación llegará en una próxima versión. |
| A-07 | "Crear cuenta" con datos válidos (rol Estudiante, con carnet). | Aviso "Cuenta creada. Ya puedes iniciar sesión." y vuelves al login **con el correo ya escrito**. |
| A-08 | Iniciar sesión con la cuenta recién creada. | Entras a `/dashboard`. |
| A-09 | En el registro, cambiar el rol a Técnico o Administrador. | El campo "Carnet estudiantil" desaparece (solo lo piden los estudiantes). |
| A-10 | Registro con contraseña `abc`. | "La contraseña debe tener mínimo 8 caracteres, con mayúscula, minúscula y número." |
| A-11 | Registro con confirmación distinta. | "Las contraseñas no coinciden." |
| A-12 | Registro con un correo ya usado (también con otras mayúsculas, p. ej. `ADMIN@itm.edu.co`). | Error en rojo: "El correo ya está registrado." |
| A-13 | "Cerrar sesión" (botón del encabezado) desde cualquier página. | Vuelves a `/login`; si pulsas "Atrás" del navegador no recuperas la sesión. |
| A-14 | Con sesión iniciada, recargar la página (F5). | La sesión se conserva. |
| A-15 | Con sesión, escribir `/login` o `/register` en la barra. | Te redirige a `/dashboard`. |
| A-16 | Sin sesión, escribir `/dashboard`, `/inventory` o `/loans/my`. | Te redirige a `/login`. |

> La sesión dura 8 horas; no es práctico probarlo a mano (lo cubren los tests automáticos).

## 2. Control de acceso por rol (Req 19)

| ID | Qué hacer | Resultado esperado |
|---|---|---|
| C-01 | Con cada rol, mirar el menú lateral. | **Estudiante:** Inicio, Disponibilidad, Mis préstamos. **Técnico:** Inicio, Disponibilidad, Entregas, Devoluciones. **Administrador:** Inicio, Disponibilidad, Entregas, Devoluciones, Inventario. |
| C-02 | Escribir a mano en la barra una ruta que tu rol no ve (matriz de abajo). | Pantalla "Acceso denegado" con "Volver al inicio". |
| C-03 | Escribir una ruta que no existe (`/cualquier-cosa`). | "Página no encontrada" con enlace "Ir al inicio". |
| C-04 | En una ruta con parámetro inexistente: `/loans/new/xyz` (estudiante) o `/inventory/xyz/edit` (administrador). | Aviso de que no se encontró el recurso, con enlace de regreso. |

| Ruta | Estudiante | Técnico | Administrador |
|---|:--:|:--:|:--:|
| `/availability` | ✔ | ✔ | ✔ |
| `/loans/my`, `/loans/new/:id` | ✔ | ✘ | ✘ |
| `/deliveries`, `/returns` | ✘ | ✔ | ✔ |
| `/inventory`, `/inventory/new`, `/inventory/:id/edit` | ✘ | ✘ | ✔ |

> **Decisión para confirmar:** el administrador accede a Entregas y Devoluciones pero no a "Mis préstamos".

## 3. Consulta de disponibilidad (Req 6) — como Estudiante

| ID | Qué hacer | Resultado esperado |
|---|---|---|
| D-01 | Abrir **Disponibilidad**. | 7 recursos ordenados por nombre (la Fuente de poder, en mantenimiento, no aparece). Texto "7 recursos encontrados." |
| D-02 | Escribir `protoboard` (también `PROTOBOARD`). | Tras una breve pausa queda solo el Protoboard; "1 recurso encontrado." |
| D-03 | Escribir `multimetro` (sin tilde). | **No encuentra nada:** la búsqueda distingue tildes. Con `multím` sí. |
| D-04 | Filtrar por tipo Material, luego Herramienta, luego "Todos los tipos". | Solo aparecen los de ese tipo; con "Todos" vuelven los 7. |
| D-05 | Combinar tipo Herramienta con el nombre `osciloscopio`. | "No hay recursos que coincidan con la búsqueda." |
| D-06 | Pulsar "Limpiar filtros" (deshabilitado si no hay filtros). | Vuelve el listado completo. |
| D-07 | Elegir **solo** la fecha, o solo la hora. | Aviso: "Elige la fecha y la hora para filtrar por horario." y no se filtra. |
| D-08 | Elegir una fecha/hora pasada. | "La fecha y la hora no pueden estar en el pasado." |
| D-09 | Elegir mañana a las 10:00 (sin reservas hechas). | Siguen los 7 recursos y el texto añade "Disponibles en el horario elegido." |
| D-10 | Cada tarjeta. | Muestra nombre, estado, tipo y código, descripción y "X de Y disponibles". La lista "Próximas reservas" solo aparece si el recurso tiene reservas **vigentes** (que aún no terminaron); las del dato semilla son de febrero, así que no la verás hasta crear una reserva futura (P-09). |
| D-11 | Entrar como Técnico o Administrador a Disponibilidad. | Mismo listado, pero **sin** botón "Solicitar préstamo". |

## 4. Solicitud de préstamo y Mis préstamos (Req 8) — como Estudiante

| ID | Qué hacer | Resultado esperado |
|---|---|---|
| P-01 | En una tarjeta, pulsar "Solicitar préstamo". | Va a `/loans/new/{id}`; título "Solicitar préstamo", resumen del recurso y la fecha de hoy precargada. |
| P-02 | Confirmar sin llenar nada. | "Este campo es requerido" en hora de inicio, hora de fin y motivo (3 errores). |
| P-03 | Hora de fin 30 minutos después de la de inicio. | "La duración mínima del préstamo es de 1 hora." junto a la hora de fin. |
| P-04 | Hora de fin **antes** de la de inicio. | El mismo error de duración mínima. |
| P-05 | Fecha de ayer. | "La fecha de inicio no puede estar en el pasado." junto a la fecha. |
| P-06 | Fecha de hoy con una hora de inicio que ya pasó. | El mismo error de fecha en el pasado. |
| P-07 | Motivo de menos de 10 caracteres. | "El motivo debe tener entre 10 y 500 caracteres." El contador muestra `n/500`. |
| P-08 | Duración de exactamente 1 hora. | Se acepta. |
| P-09 | Reserva válida (mañana 10:00–12:00, motivo largo). | Aviso: `Reserva creada. Quedó en estado "Reservado".` y vas a **Mis préstamos** con la reserva arriba, en estado **Reservado**. |
| P-10 | Volver a Disponibilidad. | Ese recurso tiene **una unidad menos** ("X de Y disponibles"). |
| P-11 | Pulsar "Cancelar" en el formulario. | Vuelve a Disponibilidad sin crear nada. |
| P-12 | Escribir a mano `/loans/new/r-0007` (Fuente en mantenimiento). | Aviso de que el recurso no está disponible; no hay formulario. |
| P-13 | **Mis préstamos** con la cuenta de Elena. | 5 tarjetas, de la más reciente a la más antigua, con estados Reservado, En préstamo, Devuelto (×2) y Cancelado. |
| P-14 | Registrar una cuenta nueva de estudiante y abrir Mis préstamos. | "Todavía no tienes préstamos." con enlace "Buscar un recurso". |
| P-15 | Reservar el **Analizador lógico** (1 sola unidad). | Tras reservar, vuelve a Disponibilidad: aparece "**No disponible**", "Se libera el {fecha}.", la lista "Próximas reservas" y **sin** botón de solicitar. |

> **Solo por tests:** el mensaje "El recurso no está disponible en el horario seleccionado." (Req 8.8) no se alcanza desde la interfaz, porque al agotarse las unidades el recurso deja de ofrecerse. Lo cubre la suite automática.
>
> **Límite:** el préstamo empieza y termina el mismo día (el formulario solo tiene "hora de fin").

## 5. Entregas (Req 12) — como Técnico o Administrador

| ID | Qué hacer | Resultado esperado |
|---|---|---|
| E-01 | Abrir **Entregas** con datos semilla. | 1 entrega pendiente: Osciloscopio, Elena Estudiante, con su "Inicio programado". |
| E-02 | Una reserva que **empieza en el futuro** (la de P-09). | **No aparece** todavía. |
| E-03 | Pulsar "Registrar entrega". | Diálogo "Registrar entrega"; el foco está en "Condición del recurso", con "Bueno" por defecto. |
| E-04 | Pulsar Escape, "Cancelar" o la X. | El diálogo se cierra y no cambia nada; el foco vuelve al botón. |
| E-05 | Condición "Dañado" sin observaciones y confirmar. | "Las observaciones son obligatorias si el recurso está dañado." |
| E-06 | Escribir observaciones (el contador muestra `n/500`). | Con "Bueno" o "Regular" son opcionales. |
| E-07 | Confirmar la entrega. | Aviso "Entrega registrada: {recurso} para {estudiante}."; el diálogo se cierra y la entrega **sale de la lista**. |
| E-08 | Ver el resultado como Estudiante en Mis préstamos. | Ese préstamo ahora está **En préstamo**. |
| E-09 | Sin entregas pendientes. | "No hay entregas pendientes…" y "0 entregas pendientes." |

## 6. Devoluciones (Req 13) — como Técnico o Administrador

| ID | Qué hacer | Resultado esperado |
|---|---|---|
| R-01 | Abrir **Devoluciones** con datos semilla. | El Cautín aparece **resaltado en rojo** y con el texto "Con retraso de …"; el resumen dice "1 devolución pendiente, 1 con retraso." |
| R-02 | Con varias pendientes. | Orden: la de fin programado más antiguo primero. |
| R-03 | Abrir "Registrar devolución" de una con retraso. | El diálogo muestra "Retraso actual: …" (en rojo). Si estuviera a tiempo: "La devolución está a tiempo." |
| R-04 | Confirmar con condición "Bueno". | Aviso "Devolución registrada: … Retraso: …"; sale de la lista. |
| R-05 | Revisar Disponibilidad después de R-04. | El Cautín recupera una unidad (4 de 4) y sigue "Disponible". |
| R-06 | Devolver con condición **Dañado** (las observaciones son opcionales aquí). | El aviso añade "El recurso pasó a mantenimiento." |
| R-07 | Revisar tras R-06. | El recurso **desaparece de Disponibilidad** y, como administrador, en Inventario figura "En mantenimiento". |

## 7. Inventario (Req 4) — como Administrador

| ID | Qué hacer | Resultado esperado |
|---|---|---|
| I-01 | Abrir **Inventario**. | Tabla con los 8 recursos (incluida la Fuente en mantenimiento) y el texto "8 recursos registrados, 8 en servicio." |
| I-02 | **Nuevo recurso** vacío y "Crear recurso". | 4 errores "Este campo es requerido" (nombre, código, tipo, cantidad). |
| I-03 | Cantidad `0`, `-3` o `2.5`. | "Ingresa un número entero mayor que 0." |
| I-04 | Crear un recurso válido. | Aviso `Recurso "…" creado.`; aparece en la tabla como **Disponible** con todas sus unidades libres, y también en Disponibilidad. |
| I-05 | Nombre: intentar escribir más de 100 caracteres. | El campo no deja pasar de 100; el contador lo muestra. |
| I-06 | Subir una imagen JPG, PNG o WEBP. | Aparece su vista previa; "Quitar imagen" la elimina. |
| I-07 | Subir un `.gif` o un PDF. | "La imagen debe ser JPG, PNG o WEBP." |
| I-08 | Subir una imagen de más de 5 MB. | "La imagen no puede superar los 5 MB." |
| I-09 | Crear un recurso con imagen y verlo en Disponibilidad. | La tarjeta muestra la imagen. |
| I-10 | **Editar** el Protoboard: los datos vienen precargados. | Nombre, código, tipo y cantidad (20) correctos; la ayuda dice "Hay 2 unidades en uso; no puedes bajar de 2." |
| I-11 | Cambiar el nombre y subir la cantidad a 25; guardar. | Aviso `Recurso "…" actualizado.`; las 2 unidades en uso se conservan, así que las libres pasan de 18 a 23. |
| I-12 | Bajar la cantidad a 1. | Error: "Hay 2 unidades en uso: la cantidad mínima es 2." y no guarda. |
| I-13 | Editar el **Osciloscopio** y poner cantidad 1 (tiene 1 en uso). | Se guarda, pero queda con 0 unidades libres y estado **Reservado** (no se puede reservar). |
| I-14 | Subir la cantidad de un recurso agotado (el de P-15 o el de I-13). | Vuelve a **Disponible** con unidades libres. |
| I-15 | **Dar de baja** el Kit de resistencias → "Cancelar". | No cambia nada. |
| I-16 | Dar de baja el Kit de resistencias → confirmar. | Aviso `"Kit de resistencias surtidas" fue dado de baja.`; en la tabla queda "Dado de baja" y "Sin acciones"; desaparece de Disponibilidad. |
| I-17 | Dar de baja el **Osciloscopio** (tiene una reserva activa). | Aviso de error: "No se puede dar de baja: el recurso tiene préstamos activos." y sigue en servicio. |
| I-18 | Escribir a mano la URL de edición de un recurso dado de baja. | "… está dado de baja y ya no se puede editar." |

## 7 bis. Inicio por rol (Req 18.6, 19.4)

Cada rol ve un panel distinto en **Inicio**, con el saludo "Hola, {nombre}." y tarjetas numéricas. Las tarjetas con enlace llevan a la pantalla correspondiente. Los valores de abajo son los de los datos semilla (reinicia antes si has hecho cambios).

| ID | Qué hacer | Resultado esperado |
|---|---|---|
| H-01 | Entrar como **Estudiante** (Elena). | Saludo "Hola, Elena Estudiante." Tarjetas: **Reservados 1**, **En préstamo 1**. Sección "Tus préstamos activos" con 2 tarjetas (osciloscopio reservado y cautín en préstamo). |
| H-02 | Pulsar una tarjeta numérica del estudiante. | Va a **Mis préstamos**. |
| H-03 | Pulsar "Buscar un recurso" y "Ver todos mis préstamos". | Van a Disponibilidad y a Mis préstamos. |
| H-04 | Entrar con un estudiante recién registrado. | Tarjetas en 0 y el texto "No tienes préstamos activos." |
| H-05 | Como Elena, hacer una reserva nueva (P-09) y volver a Inicio. | **Reservados** sube a 2 y la reserva nueva aparece entre los préstamos activos. |
| H-06 | Crear 4 reservas con la misma cuenta y volver a Inicio. | Solo se listan 3 préstamos activos (el resto está en Mis préstamos); los contadores sí cuentan todos. |
| H-07 | Entrar como **Técnico** (Tomás). | Saludo "Hola, Tomás Técnico." Tarjetas: **Entregas pendientes 1**, **Devoluciones pendientes 1**, **Devoluciones con retraso 1** (esta última resaltada como alerta). |
| H-08 | Pulsar cada tarjeta y cada acceso rápido del técnico. | Entregas pendientes → Entregas; las dos de devoluciones → Devoluciones; los botones "Registrar entregas", "Registrar devoluciones" y "Consultar disponibilidad" van a su pantalla. |
| H-09 | Como técnico, registrar la entrega semilla (E-07) y volver a Inicio. | **Entregas pendientes 0**, **Devoluciones pendientes 2** y **con retraso 2**: el osciloscopio recién entregado también venció, porque su hora de fin (febrero) ya pasó. |
| H-10 | Registrar la devolución del cautín (R-04) y volver a Inicio. | **Devoluciones pendientes 1** y **con retraso 1** (queda el osciloscopio). |
| H-11 | Entrar como **Administrador** (Ana). | Saludo "Hola, Ana Admin." Sección *Inventario*: **Recursos en servicio 8**, **Disponibles 7**, **En mantenimiento 1** (alerta). Sección *Préstamos*: **Préstamos activos 2**, **Reservados 1**, **En préstamo 1**. |
| H-12 | Pulsar las tarjetas de Inventario y los accesos rápidos del administrador. | Las tres tarjetas de inventario van a Inventario; las de Préstamos no son enlaces. Los botones "Nuevo recurso", "Ver inventario", "Entregas" y "Devoluciones" van a su pantalla. |
| H-13 | Como administrador, dar de baja el Kit de resistencias (I-16) y volver a Inicio. | **Recursos en servicio 7** y **Disponibles 6**. |
| H-14 | Cerrar sesión y entrar con otro rol. | Cada panel muestra solo lo de su rol; no se mezclan tarjetas. |

> El panel del administrador no tiene contadores de entregas o devoluciones pendientes; para eso están sus accesos rápidos.

## 8. Flujos completos de punta a punta

Se recorren en **una sola ventana**, cerrando sesión y entrando con la cuenta del rol que indica cada paso (los datos se conservan). **Atajo de tiempo:** una reserva solo aparece en Entregas cuando llega su hora de inicio. Crea la reserva con inicio **dentro de 1 o 2 minutos** (hoy, hora futura), entra como técnico a *Entregas* y espera sin recargar: la lista se actualiza sola cada 30 segundos y la reserva aparece cuando llega su hora. Como el préstamo dura mínimo 1 hora y termina el mismo día, este atajo no sirve pasadas las 22:59; en ese caso usa las reservas semilla. Si no quieres esperar, usa también las reservas semilla.

### F-1. Ciclo de vida normal de un préstamo
1. **Estudiante:** Disponibilidad → Solicitar el Multímetro, hoy con inicio en ~2 min y fin 1 hora después → *Mis préstamos* lo muestra **Reservado**; Disponibilidad baja 1 unidad.
2. **Técnico:** espera a que llegue la hora → *Entregas* muestra la reserva → registrar entrega (Bueno) → sale de la lista.
3. **Estudiante:** *Mis préstamos* → **En préstamo**.
4. **Técnico:** *Devoluciones* → aparece (a tiempo) → registrar devolución → aviso "Devuelto a tiempo."
5. **Estudiante:** *Mis préstamos* → **Devuelto**; Disponibilidad recupera la unidad.

### F-2. Devolución con daño
1. Repetir F-1 hasta la devolución, pero con condición **Dañado**.
2. **Técnico:** el aviso indica que el recurso pasó a mantenimiento.
3. **Administrador:** Inventario lo muestra "En mantenimiento".
4. **Estudiante:** ya no aparece en Disponibilidad.

### F-3. Devolución tardía (retraso)
1. **Técnico:** Devoluciones → el Cautín semilla (con retraso, en rojo) → registrar con "Bueno".
2. El aviso incluye "Retraso: …" y el préstamo queda **Devuelto** en la cuenta de Elena.

### F-4. Agotar y reponer stock
1. **Estudiante:** reservar el Analizador lógico (1 unidad) → queda "No disponible" sin botón.
2. **Administrador:** Inventario → Editar → cantidad 3 → guardar.
3. **Estudiante:** el Analizador vuelve a "Disponible", con "2 de 3 disponibles".

### F-5. Baja bloqueada y luego permitida
1. **Administrador:** dar de baja el Osciloscopio → error por préstamo activo (I-17).
2. **Técnico:** entregar la reserva `p-0001` y luego devolverla.
3. **Administrador:** dar de baja el Osciloscopio de nuevo → ahora sí se acepta.

### F-6. Alta de usuario nuevo hasta su primer préstamo
1. Registrar un estudiante nuevo → inicia sesión → *Mis préstamos* vacío.
2. Reservar un recurso → aparece como Reservado y Disponibilidad refleja la unidad menos.

### F-7. Persistencia y reinicio
1. Hacer cambios (un recurso nuevo, una reserva) y recargar: todo se conserva.
2. Ejecutar el comando de reinicio de la sección 0: vuelven los datos semilla y la sesión se cierra.

## 9. Pruebas transversales

### Responsive (herramientas de desarrollo, F12 → modo dispositivo; probar ≤ 767 px, tablet y escritorio)
| ID | Qué comprobar | Esperado |
|---|---|---|
| T-01 | Menú en móvil | Aparece el botón ☰ ("Abrir menú"); abre y cierra el menú; al elegir una opción el menú se cierra. |
| T-02 | Menú en escritorio (≥ 768 px) | Menú lateral fijo, sin botón ☰; cada sección se colapsa con su título. |
| T-03 | Migas de pan | Aparecen en las subpáginas (no en Inicio). En móvil se reducen a "‹ Atrás" + página actual. |
| T-04 | Tabla de Inventario en móvil | Se ocultan Tipo y Disponibles; cada fila tiene "Ver detalles de …" desplegable. |
| T-05 | Diálogos en móvil | Ocupan toda la pantalla. |
| T-06 | Botones y campos | Alto mínimo cómodo para tocar (44 px) y texto de al menos 14 px. |

### Teclado y accesibilidad
| ID | Qué comprobar | Esperado |
|---|---|---|
| T-07 | Pulsar Tab al cargar una página | Primero aparece el enlace "Saltar al contenido"; al activarlo, el foco va al contenido. |
| T-08 | Recorrer con Tab | El orden es lógico y el foco siempre se ve con un contorno azul. |
| T-09 | Diálogos | El foco queda atrapado dentro; Escape cierra; al cerrar el foco vuelve al botón que lo abrió. |
| T-10 | Título de la pestaña | Cambia en cada página ("Disponibilidad · Préstamo de recursos de laboratorio"). |
| T-11 | Lector de pantalla (opcional) | Los errores de campo y los avisos se anuncian al aparecer. |

### Notificaciones
| ID | Qué comprobar | Esperado |
|---|---|---|
| T-12 | Avisos de éxito | Verdes; se cierran solos a los ~3 segundos. |
| T-13 | Avisos de error | Rojos; **no** se cierran solos hasta pulsar la ×. |
| T-14 | Varios avisos seguidos | Se apilan arriba a la derecha (máximo 5 visibles). |

### Imágenes (solo se comprueban a mano)
| ID | Qué comprobar | Esperado |
|---|---|---|
| T-15 | Subir una foto grande (varios MB, p. ej. 4000×3000) en un recurso nuevo | Se guarda sin error y la vista previa se ve bien: el navegador la reduce a 800 px por lado antes de guardarla. |
| T-16 | F12 → Application → Local Storage | La clave `sistema-prestamos-lab-resources` pesa unas decenas de KB, no varios MB. |

> **Por qué importa T-15:** los datos viven en `localStorage` (≈ 5 MB en total). Sin la reducción, una foto de 5 MB lo llenaría y el sistema dejaría de guardar. Esta reducción usa canvas y la suite automática no la puede ejercitar.

## 10. Comportamientos que conviene conocer (no son errores)

- La búsqueda por nombre distingue tildes (`multimetro` no encuentra "Multímetro").
- Los préstamos duran como máximo el mismo día en que empiezan.
- **Limitación del modelo:** el estado (Disponible, En mantenimiento…) es del recurso completo, no de cada unidad. Si se devuelve **una** unidad dañada de un recurso con varias, todo el recurso pasa a mantenimiento y deja de ofrecerse, aunque las otras unidades estén bien (R-06, R-07). Así lo define el diseño original (un solo `estadoActual` por recurso).
- Un recurso agotado se muestra "No disponible" con la fecha en que se libera; un recurso en mantenimiento o dado de baja no se lista en Disponibilidad.
- Cualquiera puede registrarse con el rol de Administrador (lo pide el Req 1.1); en un sistema real no debería permitirse.
- Las contraseñas se "hashean" con un algoritmo simulado: solo evita guardarlas en texto plano; **no es seguridad real**.
- No hay forma de cancelar una reserva ni de ver tu propio historial más allá de la lista de Mis préstamos (Post-MVP).

## 11. Qué cubre ya la suite automática

`npm run test:run` ejecuta 287 pruebas que cubren la lógica, los servicios, los formularios y los flujos completos (login, reserva, entrega, devolución, inventario, paneles de Inicio) sobre la aplicación real con un almacenamiento en memoria. **No pueden comprobar:** el aspecto visual, los `@media` (responsive), el foco real del navegador, la reducción de imágenes con canvas ni la lectura con lector de pantalla; por eso existen las secciones 9 y los casos T-01 a T-16.
