# Requirements Document

## Introduction

El Sistema de Préstamos de Recursos de Laboratorio es una aplicación web frontend desarrollada en React + TypeScript + Vite que permite a estudiantes, administradores de laboratorio y técnicos gestionar el préstamo de equipos, herramientas y materiales de laboratorio. El sistema utiliza datos simulados (mock data) sin backend real, implementando una gestión completa del ciclo de vida de préstamos con validaciones, estados de recursos y control de permisos por rol.

## Glossary

- **Sistema**: La aplicación web frontend del Sistema de Préstamos de Recursos de Laboratorio
- **Usuario**: Cualquier persona que interactúa con el Sistema (Estudiante, Administrador o Técnico)
- **Estudiante**: Usuario con permisos para consultar disponibilidad y solicitar préstamos
- **Administrador_Laboratorio**: Usuario con permisos para gestionar inventario, aprobar préstamos y generar reportes
- **Técnico_Laboratorio**: Usuario con permisos para registrar entregas y devoluciones de recursos
- **Recurso**: Equipo, herramienta o material de laboratorio disponible para préstamo
- **Estado_Recurso**: Condición actual del recurso (Disponible, Reservado, En_Préstamo, En_Mantenimiento, Dado_de_Baja)
- **Préstamo**: Registro de reserva o uso de un Recurso por un Usuario
- **Reserva**: Préstamo en estado "Reservado" pendiente de entrega
- **Entrega**: Acción de proporcionar físicamente el Recurso al Usuario
- **Devolución**: Acción de retornar físicamente el Recurso al laboratorio
- **Demora**: Tiempo transcurrido después de la fecha/hora de devolución programada
- **Formulario**: Interfaz de entrada de datos del Sistema
- **Sesión**: Período de autenticación activa de un Usuario
- **Interfaz_Responsive**: Interfaz que se adapta a diferentes tamaños de pantalla
- **Validación**: Verificación de datos de entrada antes de procesarlos
- **Retroalimentación_Visual**: Mensajes e indicadores visuales de estado de operaciones
- **Accesibilidad**: Conformidad con estándares WCAG para usuarios con discapacidades
- **Sanción**: Restricción temporal de permisos de préstamo por incumplimiento de políticas

---

## Requirements

### Requisito 1: Gestión de Cuenta de Usuario

**User Story:** Como Usuario, quiero registrarme, iniciar sesión y cerrar sesión en el Sistema, para poder acceder a las funcionalidades según mi rol.

#### Criterios de Aceptación

1. THE Sistema SHALL proporcionar un Formulario de registro con campos: nombre completo, correo electrónico, contraseña, confirmación de contraseña y rol
2. WHEN un Usuario completa el Formulario de registro con datos válidos, THE Sistema SHALL crear una cuenta nueva y mostrar mensaje de confirmación
3. WHEN un Usuario intenta registrarse con un correo electrónico ya existente, THE Sistema SHALL mostrar un mensaje de error indicando que el correo ya está registrado
4. THE Sistema SHALL validar que la contraseña tenga al menos 8 caracteres, incluya una letra mayúscula, una minúscula y un número
5. WHEN un Usuario ingresa contraseña y confirmación que no coinciden, THE Sistema SHALL mostrar mensaje de error de no coincidencia
6. THE Sistema SHALL proporcionar un Formulario de inicio de sesión con campos: correo electrónico y contraseña
7. WHEN un Usuario ingresa credenciales válidas en el Formulario de inicio de sesión, THE Sistema SHALL iniciar una Sesión y redirigir al dashboard correspondiente al rol
8. WHEN un Usuario ingresa credenciales inválidas, THE Sistema SHALL mostrar un mensaje de error sin revelar si el correo o la contraseña son incorrectos
9. THE Sistema SHALL proporcionar un botón de cierre de sesión visible en todas las páginas autenticadas
10. WHEN un Usuario hace clic en cerrar sesión, THE Sistema SHALL terminar la Sesión y redirigir a la página de inicio de sesión
11. WHEN un Usuario no autenticado intenta acceder a una página protegida, THE Sistema SHALL redirigir a la página de inicio de sesión

### Requisito 2: Recuperación de Contraseña (Post-MVP Release 2)

**User Story:** Como Usuario, quiero recuperar mi contraseña cuando la olvido, para poder volver a acceder a mi cuenta.

#### Criterios de Aceptación

1. THE Sistema SHALL proporcionar un enlace "¿Olvidaste tu contraseña?" en la página de inicio de sesión
2. WHEN un Usuario hace clic en el enlace de recuperación, THE Sistema SHALL mostrar un Formulario solicitando correo electrónico
3. WHEN un Usuario ingresa un correo electrónico registrado, THE Sistema SHALL simular el envío de un correo de recuperación y mostrar mensaje de confirmación
4. WHEN un Usuario ingresa un correo electrónico no registrado, THE Sistema SHALL mostrar el mismo mensaje de confirmación por seguridad
5. THE Sistema SHALL generar un token de recuperación único con validez temporal de 1 hora
6. WHEN un Usuario accede al enlace de recuperación con token válido, THE Sistema SHALL mostrar un Formulario para establecer nueva contraseña
7. WHEN un Usuario establece una nueva contraseña válida, THE Sistema SHALL actualizar la contraseña y mostrar mensaje de confirmación
8. WHEN un Usuario intenta usar un token expirado o inválido, THE Sistema SHALL mostrar mensaje de error y ofrecer solicitar nuevo enlace

### Requisito 3: Autenticación de Dos Factores Opcional (Post-MVP Release 2)

**User Story:** Como Usuario, quiero habilitar autenticación de dos factores en mi cuenta, para aumentar la seguridad de mi acceso.

#### Criterios de Aceptación

1. WHERE autenticación de dos factores está habilitada en configuración de Usuario, THE Sistema SHALL solicitar un código adicional después de credenciales válidas
2. THE Sistema SHALL proporcionar una opción en configuración de cuenta para habilitar/deshabilitar autenticación de dos factores
3. WHEN un Usuario habilita autenticación de dos factores, THE Sistema SHALL generar un código QR y clave secreta para configurar aplicación autenticadora
4. WHEN un Usuario con autenticación de dos factores inicia sesión, THE Sistema SHALL solicitar código de 6 dígitos después de validar contraseña
5. WHEN un Usuario ingresa un código válido, THE Sistema SHALL completar el inicio de sesión
6. WHEN un Usuario ingresa un código inválido, THE Sistema SHALL mostrar mensaje de error y permitir reintentar hasta 3 veces
7. IF un Usuario falla 3 intentos de código de dos factores, THEN THE Sistema SHALL bloquear temporalmente el inicio de sesión por 15 minutos

### Requisito 4: Gestión de Inventario de Recursos

**User Story:** Como Administrador_Laboratorio, quiero registrar, editar y dar de baja recursos en el inventario, para mantener el catálogo de recursos actualizado.

#### Criterios de Aceptación

1. WHEN un Administrador_Laboratorio está autenticado, THE Sistema SHALL mostrar opción de gestión de inventario en el menú principal
2. THE Sistema SHALL proporcionar un Formulario de registro de Recurso con campos: nombre, tipo, descripción, imagen, cantidad disponible y estado inicial
3. WHEN un Administrador_Laboratorio completa el Formulario con datos válidos, THE Sistema SHALL crear el Recurso con Estado_Recurso "Disponible" y mostrar mensaje de confirmación
4. THE Sistema SHALL validar que el campo nombre no esté vacío y tenga máximo 100 caracteres
5. THE Sistema SHALL validar que el campo cantidad disponible sea un número entero mayor que 0
6. THE Sistema SHALL proporcionar una lista de todos los Recursos con opciones de edición y baja
7. WHEN un Administrador_Laboratorio selecciona editar un Recurso, THE Sistema SHALL mostrar el Formulario con datos actuales del Recurso
8. WHEN un Administrador_Laboratorio guarda cambios válidos en un Recurso, THE Sistema SHALL actualizar el Recurso y mostrar mensaje de confirmación
9. WHEN un Administrador_Laboratorio da de baja un Recurso, THE Sistema SHALL cambiar Estado_Recurso a "Dado_de_Baja" y ocultar de disponibilidad
10. WHEN un Administrador_Laboratorio intenta dar de baja un Recurso con Estado_Recurso "Reservado" o "En_Préstamo", THE Sistema SHALL mostrar mensaje de error indicando que tiene préstamos activos
11. THE Sistema SHALL permitir subir imagen del Recurso en formatos JPG, PNG o WEBP con tamaño máximo de 5MB

### Requisito 5: Importación y Exportación de Inventario (Post-MVP Release 2)

**User Story:** Como Administrador_Laboratorio, quiero importar y exportar el inventario en formato CSV, para gestionar recursos en lote y generar respaldos.

#### Criterios de Aceptación

1. THE Sistema SHALL proporcionar un botón "Exportar Inventario" en la página de gestión de inventario
2. WHEN un Administrador_Laboratorio hace clic en exportar, THE Sistema SHALL generar un archivo CSV con columnas: id, nombre, tipo, descripción, cantidad_disponible, estado
3. THE Sistema SHALL proporcionar un botón "Importar Inventario" con opción de seleccionar archivo CSV
4. WHEN un Administrador_Laboratorio selecciona un archivo CSV válido, THE Sistema SHALL mostrar vista previa de recursos a importar
5. WHEN un Administrador_Laboratorio confirma la importación, THE Sistema SHALL crear o actualizar recursos según archivo CSV y mostrar resumen de operación
6. WHEN el archivo CSV contiene errores de formato, THE Sistema SHALL mostrar mensaje detallado indicando filas con errores
7. THE Sistema SHALL validar que cada fila del CSV tenga todos los campos requeridos antes de importar
8. WHEN un Recurso importado tiene id existente, THE Sistema SHALL actualizar el Recurso existente en lugar de crear duplicado

### Requisito 6: Consulta de Disponibilidad de Recursos

**User Story:** Como Estudiante, quiero consultar la disponibilidad de recursos por nombre, tipo, fecha y hora, para encontrar recursos disponibles para préstamo.

#### Criterios de Aceptación

1. THE Sistema SHALL proporcionar una página de consulta de disponibilidad accesible para todos los Usuarios autenticados
2. THE Sistema SHALL mostrar una lista de todos los Recursos con Estado_Recurso "Disponible"
3. THE Sistema SHALL proporcionar un campo de búsqueda por nombre de Recurso
4. WHEN un Usuario ingresa texto en búsqueda, THE Sistema SHALL filtrar Recursos mostrando solo aquellos cuyo nombre contiene el texto ingresado
5. THE Sistema SHALL proporcionar filtro por tipo de Recurso con opciones: Equipo, Herramienta, Material
6. WHEN un Usuario selecciona un tipo, THE Sistema SHALL mostrar solo Recursos del tipo seleccionado
7. THE Sistema SHALL proporcionar selector de fecha y selector de hora para verificar disponibilidad
8. WHEN un Usuario selecciona fecha y hora, THE Sistema SHALL mostrar solo Recursos sin Préstamo activo o Reserva en ese horario
9. THE Sistema SHALL mostrar para cada Recurso: nombre, tipo, descripción, imagen, cantidad disponible y próximas reservas
10. WHEN un Recurso tiene cantidad disponible 0, THE Sistema SHALL mostrar el Recurso como "No disponible" con fecha de próxima disponibilidad
11. THE Sistema SHALL ordenar Recursos por nombre alfabéticamente de forma predeterminada

### Requisito 7: Calendario Visual Avanzado (Post-MVP Release 2)

**User Story:** Como Usuario, quiero visualizar la disponibilidad de recursos en un calendario interactivo, para identificar rápidamente horarios disponibles.

#### Criterios de Aceptación

1. THE Sistema SHALL proporcionar una vista de calendario mensual en la página de disponibilidad
2. WHEN un Usuario selecciona un Recurso, THE Sistema SHALL mostrar en el calendario los días con disponibilidad en verde y sin disponibilidad en rojo
3. WHEN un Usuario hace clic en un día del calendario, THE Sistema SHALL mostrar horarios disponibles ese día en intervalos de 1 hora
4. THE Sistema SHALL permitir cambiar entre vista mensual, semanal y diaria
5. WHEN un Usuario navega entre meses, THE Sistema SHALL actualizar disponibilidad según préstamos y reservas
6. THE Sistema SHALL mostrar etiquetas en días con reservas indicando cantidad de reservas ese día
7. WHEN un Usuario hace clic en una Reserva del calendario, THE Sistema SHALL mostrar detalles del Préstamo en modal

### Requisito 8: Realizar Préstamo de Recurso

**User Story:** Como Estudiante, quiero solicitar un préstamo de recurso seleccionando fecha y hora, para reservar el recurso que necesito.

#### Criterios de Aceptación

1. WHEN un Estudiante está autenticado, THE Sistema SHALL mostrar botón "Solicitar Préstamo" en cada Recurso disponible
2. WHEN un Estudiante hace clic en solicitar préstamo, THE Sistema SHALL mostrar Formulario con campos: fecha de inicio, hora de inicio, hora de fin, motivo del préstamo
3. THE Sistema SHALL validar que fecha de inicio no sea anterior a fecha actual
4. THE Sistema SHALL validar que hora de fin sea posterior a hora de inicio con mínimo 1 hora de diferencia
5. THE Sistema SHALL validar que duración del préstamo no exceda 24 horas
6. THE Sistema SHALL validar que motivo del préstamo tenga entre 10 y 500 caracteres
7. WHEN un Estudiante confirma un préstamo válido, THE Sistema SHALL crear Préstamo con Estado_Recurso "Reservado" y mostrar mensaje de confirmación
8. WHEN un Estudiante intenta reservar un Recurso en horario ocupado, THE Sistema SHALL mostrar mensaje de error indicando no disponibilidad
9. THE Sistema SHALL actualizar cantidad disponible del Recurso después de crear Reserva
10. THE Sistema SHALL enviar retroalimentación visual de carga mientras procesa la solicitud de préstamo
11. WHEN un Préstamo es creado exitosamente, THE Sistema SHALL redirigir al Estudiante a página "Mis Préstamos"

### Requisito 9: Notificaciones de Disponibilidad (Post-MVP Release 2)

**User Story:** Como Estudiante, quiero recibir notificaciones cuando un recurso no disponible se libere, para poder solicitarlo oportunamente.

#### Criterios de Aceptación

1. WHEN un Recurso no está disponible, THE Sistema SHALL mostrar opción "Notificarme cuando esté disponible"
2. WHEN un Estudiante activa notificación, THE Sistema SHALL registrar solicitud de notificación asociada al Estudiante y Recurso
3. WHEN un Recurso cambia Estado_Recurso de cualquier estado a "Disponible", THE Sistema SHALL enviar notificación simulada a Usuarios con solicitud activa
4. THE Sistema SHALL mostrar notificaciones en un panel de notificaciones dentro de la aplicación
5. WHEN un Estudiante hace clic en notificación, THE Sistema SHALL redirigir a página de disponibilidad del Recurso
6. THE Sistema SHALL permitir a Usuarios ver historial de notificaciones recibidas en últimos 7 días
7. WHEN un Estudiante solicita préstamo del Recurso notificado, THE Sistema SHALL marcar notificación como leída automáticamente

### Requisito 10: Reservas Recurrentes (Post-MVP Release 2)

**User Story:** Como Estudiante, quiero crear reservas recurrentes con patrón semanal, para asegurar disponibilidad de recursos en horarios regulares.

#### Criterios de Aceptación

1. THE Sistema SHALL proporcionar opción "Reserva recurrente" en el Formulario de préstamo
2. WHERE reserva recurrente está habilitada, THE Sistema SHALL solicitar patrón de recurrencia: días de la semana y fecha de finalización
3. THE Sistema SHALL validar que fecha de finalización no exceda 12 semanas desde fecha de inicio
4. WHEN un Estudiante confirma reserva recurrente válida, THE Sistema SHALL crear múltiples Préstamos según patrón especificado
5. THE Sistema SHALL validar disponibilidad para cada ocurrencia antes de crear reservas recurrentes
6. IF alguna ocurrencia no está disponible, THEN THE Sistema SHALL mostrar mensaje indicando fechas conflictivas y permitir crear solo ocurrencias disponibles
7. THE Sistema SHALL agrupar visualmente reservas recurrentes en página "Mis Préstamos" con indicador de serie
8. WHEN un Estudiante cancela una reserva recurrente, THE Sistema SHALL ofrecer opción de cancelar solo esa ocurrencia o toda la serie

### Requisito 11: Cancelación de Reservas (Post-MVP Release 2)

**User Story:** Como Estudiante, quiero cancelar mis reservas antes de la fecha programada, para liberar recursos que ya no necesito.

#### Criterios de Aceptación

1. THE Sistema SHALL mostrar botón "Cancelar" en cada Préstamo con Estado_Recurso "Reservado" en página "Mis Préstamos"
2. WHEN un Estudiante hace clic en cancelar, THE Sistema SHALL mostrar diálogo de confirmación explicando que la acción es irreversible
3. WHEN un Estudiante confirma cancelación, THE Sistema SHALL cambiar Estado_Recurso del Préstamo a "Cancelado" y liberar el Recurso
4. THE Sistema SHALL actualizar cantidad disponible del Recurso después de cancelar Reserva
5. THE Sistema SHALL mostrar mensaje de confirmación después de cancelación exitosa
6. THE Sistema SHALL permitir cancelar Reserva hasta 2 horas antes de hora de inicio programada
7. WHEN un Estudiante intenta cancelar con menos de 2 horas de anticipación, THE Sistema SHALL mostrar mensaje de error indicando tiempo mínimo de anticipación
8. THE Sistema SHALL registrar fecha y hora de cancelación en historial del Préstamo

### Requisito 12: Registro de Entrega de Recurso

**User Story:** Como Técnico_Laboratorio, quiero registrar la entrega física de un recurso reservado, para actualizar el estado del préstamo a activo.

#### Criterios de Aceptación

1. WHEN un Técnico_Laboratorio está autenticado, THE Sistema SHALL mostrar lista de Préstamos con Estado_Recurso "Reservado" cuya hora de inicio sea actual o pasada
2. THE Sistema SHALL ordenar lista de entregas pendientes por hora de inicio más antigua primero
3. THE Sistema SHALL mostrar para cada entrega pendiente: nombre del Recurso, nombre del Estudiante, hora de inicio programada
4. WHEN un Técnico_Laboratorio selecciona una entrega pendiente, THE Sistema SHALL mostrar Formulario de confirmación de entrega con campos: condición del recurso, observaciones
5. THE Sistema SHALL proporcionar opciones de condición: "Bueno", "Regular", "Dañado"
6. WHEN un Técnico_Laboratorio confirma entrega, THE Sistema SHALL cambiar Estado_Recurso a "En_Préstamo" y registrar fecha/hora real de entrega
7. THE Sistema SHALL validar que campo observaciones no exceda 500 caracteres
8. IF condición seleccionada es "Dañado", THEN THE Sistema SHALL requerir observaciones obligatorias
9. THE Sistema SHALL mostrar mensaje de confirmación después de registrar entrega exitosamente
10. WHEN un Técnico_Laboratorio registra entrega, THE Sistema SHALL actualizar vista de entregas pendientes eliminando la entrega procesada

### Requisito 13: Registro de Devolución de Recurso

**User Story:** Como Técnico_Laboratorio, quiero registrar la devolución física de un recurso en préstamo, para calcular demoras y actualizar disponibilidad.

#### Criterios de Aceptación

1. WHEN un Técnico_Laboratorio está autenticado, THE Sistema SHALL mostrar lista de Préstamos con Estado_Recurso "En_Préstamo"
2. THE Sistema SHALL ordenar lista de devoluciones pendientes por hora de fin programada más antigua primero
3. THE Sistema SHALL indicar visualmente Préstamos con Demora mayor a 0 en color rojo
4. WHEN un Técnico_Laboratorio selecciona una devolución pendiente, THE Sistema SHALL mostrar Formulario con campos: condición del recurso, observaciones
5. WHEN un Técnico_Laboratorio confirma devolución, THE Sistema SHALL registrar fecha/hora real de devolución y calcular Demora en horas
6. THE Sistema SHALL cambiar Estado_Recurso a "Disponible" después de registrar devolución
7. THE Sistema SHALL actualizar cantidad disponible del Recurso incrementando en 1
8. WHEN la Demora es mayor a 0, THE Sistema SHALL mostrar tiempo de Demora en el resumen de devolución
9. WHEN condición es "Dañado", THE Sistema SHALL cambiar Estado_Recurso a "En_Mantenimiento" en lugar de "Disponible"
10. THE Sistema SHALL mostrar mensaje de confirmación con detalles de devolución y Demora calculada
11. THE Sistema SHALL calcular Demora como diferencia entre fecha/hora real de devolución y hora de fin programada

### Requisito 14: Gestión de Sanciones por Demoras (Post-MVP Release 2)

**User Story:** Como Administrador_Laboratorio, quiero aplicar sanciones automáticas a estudiantes con demoras, para incentivar devoluciones puntuales.

#### Criterios de Aceptación

1. WHEN un Préstamo registra Demora mayor a 24 horas, THE Sistema SHALL crear una Sanción automáticamente para el Estudiante
2. THE Sistema SHALL calcular duración de Sanción como: días_sanción = días_demora × 2
3. THE Sistema SHALL almacenar en Sanción: usuario, fecha_inicio, fecha_fin, motivo, préstamo_origen
4. WHEN un Estudiante tiene Sanción activa, THE Sistema SHALL bloquear creación de nuevos Préstamos mostrando mensaje con fecha de fin de Sanción
5. THE Sistema SHALL proporcionar página de gestión de sanciones para Administrador_Laboratorio
6. WHEN un Administrador_Laboratorio visualiza sanciones, THE Sistema SHALL mostrar lista con: estudiante sancionado, fecha_inicio, fecha_fin, motivo, estado (Activa/Expirada)
7. THE Sistema SHALL permitir a Administrador_Laboratorio levantar Sanción manualmente antes de fecha_fin
8. WHEN un Administrador_Laboratorio levanta Sanción, THE Sistema SHALL cambiar estado a "Expirada" y permitir al Estudiante crear préstamos nuevamente
9. THE Sistema SHALL notificar a Estudiante cuando se aplica Sanción indicando duración y motivo
10. WHEN fecha actual supera fecha_fin de Sanción, THE Sistema SHALL cambiar estado automáticamente a "Expirada"

### Requisito 15: Reportes de Préstamos (Post-MVP Release 2)

**User Story:** Como Administrador_Laboratorio, quiero generar reportes de préstamos por período, recurso y usuario, para analizar uso del sistema.

#### Criterios de Aceptación

1. THE Sistema SHALL proporcionar página de generación de reportes accesible para Administrador_Laboratorio
2. THE Sistema SHALL proporcionar filtros de reporte: rango de fechas, tipo de recurso, estado de préstamo, estudiante
3. WHEN un Administrador_Laboratorio selecciona filtros y genera reporte, THE Sistema SHALL mostrar tabla con préstamos que coincidan con criterios
4. THE Sistema SHALL mostrar en reporte: fecha, recurso, estudiante, estado, demora si aplica
5. THE Sistema SHALL calcular y mostrar estadísticas: total de préstamos, préstamos con demora, promedio de duración, recurso más solicitado
6. THE Sistema SHALL proporcionar opción de exportar reporte en formato PDF
7. WHEN un Administrador_Laboratorio exporta reporte, THE Sistema SHALL generar PDF con tabla de préstamos y estadísticas
8. THE Sistema SHALL proporcionar opción de exportar reporte en formato CSV
9. THE Sistema SHALL permitir ordenar tabla de reporte por columna: fecha, recurso, estudiante, estado
10. THE Sistema SHALL validar que rango de fechas no exceda 1 año

### Requisito 16: Interfaz Responsive con Diseño Mobile-First

**User Story:** Como Usuario, quiero que la interfaz se adapte a mi dispositivo móvil, tablet o escritorio, para acceder al sistema desde cualquier dispositivo.

#### Criterios de Aceptación

1. THE Sistema SHALL implementar diseño mobile-first optimizado para pantallas de 320px de ancho mínimo
2. WHEN el ancho de pantalla es menor a 768px, THE Sistema SHALL mostrar menú de navegación en formato hamburguesa colapsable
3. WHEN el ancho de pantalla es mayor o igual a 768px, THE Sistema SHALL mostrar menú de navegación horizontal completo
4. THE Sistema SHALL adaptar tablas de datos mostrando versión simplificada en móvil con opción de expandir detalles
5. THE Sistema SHALL usar breakpoints responsive: móvil (<768px), tablet (768px-1024px), escritorio (>1024px)
6. THE Sistema SHALL mantener legibilidad de texto con tamaño mínimo de fuente 14px en móvil
7. THE Sistema SHALL proporcionar botones y áreas tocables con tamaño mínimo de 44px × 44px en móvil
8. THE Sistema SHALL adaptar Formularios apilando campos verticalmente en móvil y horizontalmente en escritorio cuando sea apropiado
9. THE Sistema SHALL adaptar modal y diálogos para ocupar pantalla completa en móvil
10. THE Sistema SHALL mantener funcionalidad completa en todas las resoluciones soportadas

### Requisito 17: Validación de Formularios con Retroalimentación

**User Story:** Como Usuario, quiero que el sistema valide mis entradas en formularios y me muestre errores claros, para corregir problemas antes de enviar.

#### Criterios de Aceptación

1. THE Sistema SHALL validar campos de Formulario en tiempo real después del primer intento de envío
2. WHEN un campo de Formulario contiene error, THE Sistema SHALL mostrar mensaje de error específico debajo del campo con color rojo
3. WHEN un Usuario corrige un error, THE Sistema SHALL ocultar mensaje de error inmediatamente al validar correctamente
4. THE Sistema SHALL deshabilitar botón de envío de Formulario mientras haya errores de validación
5. THE Sistema SHALL marcar visualmente campos requeridos con asterisco (*) junto al label
6. WHEN un Usuario intenta enviar Formulario con campos vacíos requeridos, THE Sistema SHALL mostrar mensaje "Este campo es requerido"
7. WHEN un Usuario ingresa formato inválido en campo de correo, THE Sistema SHALL mostrar mensaje "Ingresa un correo electrónico válido"
8. WHEN un Usuario ingresa número fuera de rango válido, THE Sistema SHALL mostrar mensaje indicando rango permitido
9. THE Sistema SHALL mostrar contador de caracteres en campos con límite de longitud
10. THE Sistema SHALL prevenir envío de Formulario usando tecla Enter si hay errores de validación

### Requisito 18: Estados de Carga y Retroalimentación Visual

**User Story:** Como Usuario, quiero ver indicadores visuales cuando el sistema está procesando operaciones, para saber que mi acción está siendo procesada.

#### Criterios de Aceptación

1. WHEN el Sistema está procesando operación que toma más de 500ms, THE Sistema SHALL mostrar indicador de carga visual
2. THE Sistema SHALL deshabilitar botones durante procesamiento para prevenir envíos duplicados
3. WHEN operación se completa exitosamente, THE Sistema SHALL mostrar mensaje de confirmación en verde por 3 segundos
4. WHEN operación falla, THE Sistema SHALL mostrar mensaje de error en rojo hasta que Usuario lo cierre
5. THE Sistema SHALL mostrar spinner de carga centrado en botones durante procesamiento
6. THE Sistema SHALL mostrar skeleton loaders en listas y tablas mientras carga datos
7. WHEN una página está cargando por primera vez, THE Sistema SHALL mostrar indicador de carga de página completa
8. THE Sistema SHALL proporcionar mensajes descriptivos en notificaciones: "Préstamo creado exitosamente", "Error al registrar recurso"
9. THE Sistema SHALL permitir cerrar mensajes de error y éxito manualmente con botón "×"
10. THE Sistema SHALL apilar múltiples notificaciones verticalmente en esquina superior derecha de pantalla

### Requisito 19: Control de Acceso Basado en Roles

**User Story:** Como Sistema, necesito controlar el acceso a funcionalidades según el rol del usuario autenticado, para garantizar seguridad y separación de permisos.

#### Criterios de Aceptación

1. THE Sistema SHALL verificar rol de Usuario en cada navegación a página protegida
2. WHEN un Estudiante intenta acceder a página de gestión de inventario, THE Sistema SHALL redirigir a página de acceso denegado
3. WHEN un Técnico_Laboratorio intenta acceder a página de gestión de sanciones, THE Sistema SHALL redirigir a página de acceso denegado
4. THE Sistema SHALL mostrar en menú de navegación solo opciones permitidas para rol de Usuario autenticado
5. THE Sistema SHALL almacenar rol de Usuario en contexto de Sesión después de autenticación exitosa
6. WHERE Usuario es Estudiante, THE Sistema SHALL permitir acceso a: consultar disponibilidad, solicitar préstamos, ver mis préstamos
7. WHERE Usuario es Técnico_Laboratorio, THE Sistema SHALL permitir acceso a: registrar entregas, registrar devoluciones, consultar disponibilidad
8. WHERE Usuario es Administrador_Laboratorio, THE Sistema SHALL permitir acceso a todas las funcionalidades del Sistema
9. WHEN un Usuario sin Sesión activa intenta acceder a cualquier página protegida, THE Sistema SHALL redirigir a inicio de sesión
10. THE Sistema SHALL incluir rol en token de Sesión para validación en lado del cliente

### Requisito 20: Navegación Intuitiva con Breadcrumbs

**User Story:** Como Usuario, quiero una navegación clara con indicadores de ubicación actual, para orientarme fácilmente en el sistema.

#### Criterios de Aceptación

1. THE Sistema SHALL mostrar breadcrumbs en todas las páginas excepto página de inicio y login
2. THE Sistema SHALL mostrar ruta de navegación actual en formato: Inicio > Sección > Subsección > Página Actual
3. WHEN un Usuario hace clic en cualquier elemento de breadcrumb, THE Sistema SHALL navegar a esa página
4. THE Sistema SHALL resaltar página actual en breadcrumb con color diferente sin enlace
5. THE Sistema SHALL adaptar breadcrumbs en móvil mostrando solo último nivel con botón "Atrás"
6. THE Sistema SHALL proporcionar menú lateral con secciones principales colapsables en escritorio
7. THE Sistema SHALL resaltar sección activa en menú lateral con color de fondo distintivo
8. WHEN un Usuario navega entre páginas, THE Sistema SHALL actualizar breadcrumbs automáticamente
9. THE Sistema SHALL mantener historial de navegación permitiendo usar botones adelante/atrás del navegador
10. THE Sistema SHALL mostrar título de página actual en encabezado consistente con breadcrumbs

### Requisito 21: Accesibilidad Conforme a WCAG 2.1 Nivel AA

**User Story:** Como Usuario con discapacidad, quiero que la interfaz sea accesible usando tecnologías asistivas, para poder usar el sistema de forma independiente.

#### Criterios de Aceptación

1. THE Sistema SHALL proporcionar atributos ARIA apropiados en todos los componentes interactivos
2. THE Sistema SHALL mantener contraste de color mínimo 4.5:1 para texto normal y 3:1 para texto grande
3. THE Sistema SHALL permitir navegación completa usando solo teclado con orden lógico de tabulación
4. WHEN un elemento recibe foco de teclado, THE Sistema SHALL mostrar indicador visual de foco claramente visible
5. THE Sistema SHALL proporcionar textos alternativos descriptivos en todas las imágenes usando atributo alt
6. THE Sistema SHALL etiquetar todos los campos de Formulario con elementos label asociados correctamente
7. THE Sistema SHALL proporcionar retroalimentación de errores accesible para lectores de pantalla usando aria-live
8. THE Sistema SHALL implementar landmarks semánticos HTML5: header, nav, main, aside, footer
9. THE Sistema SHALL permitir cerrar modal y diálogos usando tecla Escape
10. WHEN modal está abierto, THE Sistema SHALL mantener foco atrapado dentro del modal hasta cerrarlo
11. THE Sistema SHALL proporcionar etiquetas descriptivas en botones evitando textos genéricos como "Click aquí"

### Requisito 22: Gestión de Estados de Recursos

**User Story:** Como Sistema, necesito gestionar transiciones de estados de recursos de forma consistente, para mantener integridad de datos de disponibilidad.

#### Criterios de Aceptación

1. THE Sistema SHALL inicializar nuevos Recursos con Estado_Recurso "Disponible"
2. WHEN un Préstamo es creado para un Recurso disponible, THE Sistema SHALL cambiar Estado_Recurso a "Reservado"
3. WHEN una entrega es registrada para Reserva, THE Sistema SHALL cambiar Estado_Recurso a "En_Préstamo"
4. WHEN una devolución es registrada en condición buena o regular, THE Sistema SHALL cambiar Estado_Recurso a "Disponible"
5. WHEN una devolución es registrada en condición dañada, THE Sistema SHALL cambiar Estado_Recurso a "En_Mantenimiento"
6. WHERE Estado_Recurso es "En_Mantenimiento", THE Sistema SHALL permitir a Administrador_Laboratorio cambiar manualmente a "Disponible" o "Dado_de_Baja"
7. WHEN un Administrador_Laboratorio da de baja un Recurso, THE Sistema SHALL cambiar Estado_Recurso a "Dado_de_Baja" irreversiblemente
8. THE Sistema SHALL prevenir cambios de estado inválidos mostrando error si se intenta transición no permitida
9. THE Sistema SHALL registrar fecha y hora de cada cambio de Estado_Recurso en historial
10. THE Sistema SHALL mostrar Estado_Recurso actual con etiqueta de color distintivo: verde (Disponible), amarillo (Reservado), azul (En_Préstamo), naranja (En_Mantenimiento), gris (Dado_de_Baja)

### Requisito 23: Persistencia Local de Datos Simulados

**User Story:** Como Sistema, necesito persistir datos en almacenamiento local del navegador, para simular persistencia de backend sin servidor real.

#### Criterios de Aceptación

1. THE Sistema SHALL almacenar todos los datos de Usuarios, Recursos, Préstamos y Sanciones en localStorage del navegador
2. WHEN el Sistema inicia por primera vez, THE Sistema SHALL cargar datos de ejemplo predefinidos en localStorage
3. WHEN un Usuario realiza operación que modifica datos, THE Sistema SHALL actualizar localStorage inmediatamente
4. WHEN un Usuario recarga la página, THE Sistema SHALL cargar datos desde localStorage manteniendo estado previo
5. THE Sistema SHALL serializar datos a formato JSON antes de almacenar en localStorage
6. THE Sistema SHALL deserializar datos desde JSON al cargar desde localStorage
7. WHEN localStorage no está disponible en navegador, THE Sistema SHALL mostrar mensaje de error indicando requerimiento
8. THE Sistema SHALL implementar namespace único para claves de localStorage: "sistema-prestamos-lab-"
9. THE Sistema SHALL proporcionar opción en configuración de desarrollador para resetear datos a estado inicial
10. THE Sistema SHALL validar integridad de datos al cargar desde localStorage rechazando datos corruptos

---

## Non-Functional Requirements

### Rendimiento

1. THE Sistema SHALL cargar página inicial en menos de 2 segundos en conexión de banda ancha
2. THE Sistema SHALL responder a interacciones de Usuario en menos de 200ms
3. THE Sistema SHALL cargar imágenes de Recursos usando lazy loading para optimizar rendimiento

### Usabilidad

1. THE Sistema SHALL mantener diseño consistente en colores, tipografía y espaciado en todas las páginas
2. THE Sistema SHALL proporcionar mensajes de error en lenguaje claro sin términos técnicos
3. THE Sistema SHALL usar iconos intuitivos acompañados de texto descriptivo en acciones principales

### Compatibilidad

1. THE Sistema SHALL funcionar correctamente en navegadores: Chrome (últimas 2 versiones), Firefox (últimas 2 versiones), Safari (últimas 2 versiones), Edge (últimas 2 versiones)
2. THE Sistema SHALL funcionar en dispositivos iOS 14+ y Android 10+

### Mantenibilidad

1. THE Sistema SHALL implementar componentes reutilizables siguiendo principios de React
2. THE Sistema SHALL usar TypeScript con tipado estricto para prevenir errores en tiempo de desarrollo
3. THE Sistema SHALL organizar código en estructura modular por features: auth, inventory, loans, users

### Seguridad

1. THE Sistema SHALL almacenar contraseñas usando hash bcrypt antes de guardar en localStorage simulado
2. THE Sistema SHALL validar y sanitizar todas las entradas de Usuario antes de procesarlas
3. THE Sistema SHALL implementar protección contra inyección XSS escapando contenido dinámico

---

## Propiedades de Correctness para Testing

### Propiedades de Round-Trip

1. **Parser de Fechas**: PARA TODA fecha válida `d`, parsear(formatear(d)) == d
2. **Serialización de Recursos**: PARA TODO recurso `r`, deserializar(serializar(r)) == r
3. **Exportación/Importación CSV**: PARA TODO conjunto de recursos `R`, importar(exportar(R)) == R

### Propiedades de Invariantes

1. **Balance de Cantidad**: PARA TODO recurso `r`, suma(prestamos_activos(r)) <= r.cantidad_total
2. **Unicidad de Estados**: PARA TODO préstamo `p`, p tiene exactamente un Estado_Recurso en cualquier momento
3. **Integridad Temporal**: PARA TODO préstamo `p`, p.hora_inicio < p.hora_fin
4. **No Solapamiento**: PARA TODO par de préstamos del mismo recurso `(p1, p2)`, rangos_tiempo(p1) ∩ rangos_tiempo(p2) = ∅
5. **Consistencia de Sesión**: MIENTRAS sesión está activa, rol del usuario permanece constante

### Propiedades Metamórficas

1. **Filtrado de Búsqueda**: longitud(filtrar_recursos(texto)) <= longitud(todos_recursos())
2. **Paginación**: concatenar(página_1, página_2, ..., página_n) == lista_completa
3. **Ordenamiento**: cantidad(recursos_antes_ordenar) == cantidad(recursos_después_ordenar)

### Propiedades de Idempotencia

1. **Actualización de Estado**: cambiar_estado(recurso, estado_actual) resulta en sin cambios
2. **Cierre de Sesión**: cerrar_sesión llamado múltiples veces resulta en mismo estado
3. **Marcar Notificación Leída**: marcar_leida(notificacion_leida) no cambia estado

### Propiedades de Error

1. **Fechas Inválidas**: fechas pasadas en préstamos nuevos deben ser rechazadas
2. **Credenciales Inválidas**: login con contraseña incorrecta debe fallar
3. **Acceso No Autorizado**: usuarios sin permisos deben ser redirigidos
4. **Límites de Entrada**: textos que excedan longitud máxima deben ser rechazados

### Propiedades de Modelo

1. **Cálculo de Demora**: demora_calculada == max(0, tiempo_devolucion_real - tiempo_devolucion_programado)
2. **Duración de Sanción**: dias_sancion == dias_demora × 2
3. **Validación de Contraseña**: contraseña_valida(p) == (longitud(p) >= 8 AND tiene_mayuscula(p) AND tiene_minuscula(p) AND tiene_numero(p))

### Propiedades de Confluencia

1. **Filtros Múltiples**: aplicar filtro_tipo luego filtro_fecha produce mismo resultado que aplicar filtro_fecha luego filtro_tipo
2. **Ordenamiento Estable**: ordenar por nombre luego por tipo mantiene orden relativo de elementos con mismo tipo
