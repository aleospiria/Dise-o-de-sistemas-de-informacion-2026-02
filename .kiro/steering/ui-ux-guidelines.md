---
inclusion: auto
name: ui-ux-guidelines
description: Guía de interfaz del proyecto (tokens CSS, componentes base de shared/components/ui, accesibilidad, patrones por tipo de pantalla y qué hacer o no hacer). Úsala al crear o modificar pantallas, componentes o estilos.
---
# Guía de UI/UX — Sistema de Préstamos

La fuente de verdad del diseño es `design-system/MASTER.md` (decisiones, paleta con contrastes, checklist). Esta guía resume cómo aplicarlo en el código. Si existe `design-system/pages/<pagina>.md`, sus reglas sustituyen a MASTER para esa página. Los tokens viven en `sistemas-informacion/src/index.css`.

Stack de estilos: CSS Modules + variables CSS. Sin Tailwind, sin librerías de UI ni de gráficos, sin fuentes ni imágenes externas (la CSP lo impide), sin estilos en línea.

## Tokens

Usa siempre `var(--token)`. No pongas hexadecimales ni `px` sueltos en un módulo CSS de componente.

| Grupo | Tokens |
|---|---|
| Texto | `--color-text`, `--color-text-muted`, `--color-text-inverse` |
| Superficies | `--color-bg`, `--color-surface`, `--color-surface-alt` |
| Bordes | `--color-border` (controles, 4.8:1), `--color-border-subtle`, `--color-border-strong` (decorativos) |
| Acción | `--color-primary` (+ `-hover`, `-soft`, `-soft-text`) |
| Acento | `--color-accent` (+ `-hover`, `-soft`, `-soft-border`, `-tint`, `-tint-text`) |
| Estado | `--color-success`, `--color-warning`, `--color-danger`, `--color-info`, cada uno con `-soft` y `-soft-text` (danger también `-hover`) |
| Foco | `--color-focus`, `--color-focus-on-dark` |
| Menú lateral | `--color-nav-*` |
| Tipografía | `--font-sans`, `--font-mono` (códigos, tokens, secretos 2FA), `--font-size-xs` a `--font-size-2xl` |
| Espaciado | `--space-1` (4 px) a `--space-12` (48 px) |
| Forma y elevación | `--radius-sm`, `--radius`, `--radius-lg`, `--radius-xl`, `--radius-pill`; `--shadow-sm`, `--shadow-md`, `--shadow` |
| Movimiento | `--duration-fast` (150 ms), `--duration` (200 ms), `--duration-slow` (300 ms), `--ease`, `--transition` |
| Capas y layout | `--z-sticky`, `--z-drawer`, `--z-modal`, `--z-toast`, `--z-skip`; `--touch-target` (44 px), `--header-height`, `--sidebar-width`, `--content-max` |

Los valores exactos y sus contrastes están en MASTER.md §3. Antes de usar un token nuevo, comprueba que existe en `index.css`.

## Componentes base

Todos viven en `src/shared/components/ui/` y se importan con el alias `@/shared/components/ui/<Nombre>`. Antes de escribir markup propio, busca aquí.

| Componente | Cuándo usarlo | Props clave |
|---|---|---|
| `Button` | Acción que ejecuta algo en la página (enviar, guardar, abrir un diálogo). | `variant` (`primary`, `secondary`, `danger`, `ghost`), `size` (`sm`, `md`, `lg`), `icon`, `loading`. `loading` bloquea el botón y muestra un spinner con texto para lectores de pantalla. `type` es `button` por defecto. |
| `ButtonLink` | Acción que lleva a otra ruta (es un `<a>` de React Router con la apariencia de `Button`). | Las mismas `variant`, `size`, `icon`, más las de `Link` (`to`). |
| `Card` | Superficie con borde sutil y sombra pequeña. | `as` (`div`, `section`, `article`, `li`), `interactive` (hover; la acción debe ser un enlace o botón interior), `flush` (sin relleno, para imagen o tabla), `aria-label` / `aria-labelledby`. |
| `Badge` | Chip de color con texto. | `tone` (`green`, `yellow`, `blue`, `orange`, `gray`, `red`, `teal`), `icon`. |
| `StatusBadge` | Estado de un recurso o de un préstamo. Una tabla declarativa asigna etiqueta, tono e ícono a cada estado. | `status`. Al añadir un estado a los tipos de dominio, TypeScript exige darle entrada en la tabla. |
| `TypeBadge` | Tipo de recurso (Equipo, Herramienta, Material). | `type`. |
| `PageHeader` | Descripción breve y acción principal de la página. No dibuja título. | `eyebrow`, `description`, `action`. Si no recibe nada, no pinta nada. |
| `EmptyState` | Lista o tabla sin datos. Explica por qué y ofrece cómo continuar. | `icon`, `title`, `description`, `action`. |
| `StateMessage` | Estado de página completa: cargando, error, éxito o información. | `kind` (`loading`, `error`, `success`, `info`), `title`, `children`, `action`. Los errores usan `role="alert"`; el resto, `role="status"`. |
| `Alert` | Mensaje en línea dentro de un formulario o sección. | `type` (`error`, `success`, `info`). |
| `Toast` / `ToastContainer` | Aviso transitorio tras una acción. Se dispara con `useToast().showToast`. | Éxito se cierra solo a ~3 s; el error no se cierra hasta pulsar la ×. |
| `SkeletonLoader` | Carga de listas, tarjetas o tablas. | `variant` (`line`, `card`, `table-row`), `count`. |
| `DataTable` | Tabla semántica de datos. | `label` (nombre accesible), `columns` (`key`, `header`, `render`, `rowHeader`), `rows`, `getRowKey`. La celda con `rowHeader` se pinta como `<th scope="row">`. El contenedor desplazable recibe foco para recorrerlo con teclado. |
| `FilterBar` | Panel de filtros en cuadrícula (una columna en móvil, varias desde 640 px). | `label` (nombre de la región), `children` (controles), `actions` (consultar, limpiar), `columns` (`2` o `3`). |
| `BarChart` | Comparar categorías en Reportes. Barras horizontales SVG con etiqueta y valor en texto, y una tabla equivalente debajo. | `title`, `items` (`key`, `label`, `value`, `tone`), `unit`, `emptyText`. `tone`: `blue`, `teal`, `green`, `orange`, `red`, `gray`. |
| `Input`, `Select`, `Textarea` + `FormField` | Campos de formulario. `FormField` pone etiqueta, ayuda, error y contador. | `FormField`: `label`, `error`, `hint`, `required`, `counter`, y una función hija que recibe las props del control. |
| `Modal` | Diálogo accesible (Escape, trampa de foco, pantalla completa en móvil). | `open`, `onClose`, `titleId`, `closeOnBackdrop`. |
| `Breadcrumb` | Migas de pan en subpáginas. | `items` (`label`, `href`). |
| `ResourceImage` | Imagen de un recurso: foto subida, ilustración del recurso semilla o ilustración genérica del tipo. Si la foto no carga, cae a la ilustración. | `resource`, `size` (`card`, `summary`, `thumb`, `preview`), `decorative`, `uploadedAlt`. |
| `Icon` | Ícono SVG propio. | `name` (tipo `IconName`), `size`, `title`. |

`AppShell`, `Sidebar` y `AuthLayout` (en `shared/components/layout/`) son el marco de las pantallas. `AppShell` dibuja el único `<h1>` de cada página, a partir del último elemento de las migas.

### Íconos

`<Icon name="..." />` en `shared/components/ui/icons/`. El conjunto actual es: `home`, `search`, `calendar`, `clipboard`, `clipboard-check`, `bell`, `send`, `undo`, `shield-alert`, `shield-check`, `package`, `bar-chart`, `users`, `user`, `lock`, `menu`, `close`, `chevron-down`, `chevron-right`, `chevron-left`, `arrow-left`, `log-out`, `check-circle`, `alert-circle`, `alert-triangle`, `info`, `clock`, `plus`, `edit`, `trash`, `download`, `upload`, `filter`, `eye`, `refresh`, `inbox`, `image`, `key`, `flask`, `cpu`, `wrench`, `layers`, `compass`, `check`, `arrow-right`, `graduation-cap`, `book-open`, `mail`, `user-plus`.

- Son de 24×24, trazo de 2 px y heredan el color con `currentColor`.
- Sin `title` son decorativos (`aria-hidden`). Pasa `title` solo si el ícono comunica algo que el texto cercano no dice.
- Para un ícono nuevo, añade su nodo en `iconNodes.tsx`. No instales una librería de íconos y no uses emojis como íconos.

## Accesibilidad

- Un solo `<h1>` por página (lo pone `AppShell`). Las secciones usan `<h2>`, sin saltar niveles.
- HTML semántico antes que ARIA: `<button>`, `<a>`, `<label>`, `<table>`.
- Toda región de filtros, tabla y gráfico tiene nombre accesible (`label` en `FilterBar` y `DataTable`, `title` en `BarChart`).
- Los errores de campo van en una región `aria-live` junto al campo (`FormField` lo resuelve). Un estado nunca se comunica solo con color: añade texto e ícono.
- Foco visible con `:focus-visible`. No quites el `outline` sin sustituirlo.
- Áreas táctiles de al menos 44 px (`--touch-target`) y texto de cuerpo de al menos 14 px.
- Contraste de texto de al menos 4.5:1; texto grande y bordes de control, 3:1. Los pares de MASTER.md ya cumplen.
- Respeta `prefers-reduced-motion` (hay una regla global en `index.css`). Transiciones de 150 a 300 ms, sin `transform` que desplace el contenido vecino.
- Imágenes informativas con `alt`; las que repiten un texto cercano, con `alt=""` (`ResourceImage decorative`).

## Patrones por tipo de pantalla

- **Listado con filtros** (Disponibilidad, Sanciones, Usuarios, Notificaciones): `PageHeader` con la descripción, `FilterBar`, resultado en `DataTable` o en tarjetas, `EmptyState` si no hay datos (con acción para limpiar filtros), `SkeletonLoader` mientras carga y `StateMessage kind="error"` con reintento si falla.
- **Tabla de gestión** (Inventario, Sanciones, Usuarios): `DataTable` con una columna `rowHeader` que identifica la fila y una columna de acciones con `Button size="sm"`. Para móvil, Inventario usa fichas por debajo de 1024 px.
- **Formulario** (Solicitar préstamo, Recurso, Registro): `FormField` por campo, validación con función pura y `createResolver`, botón principal con `loading` durante el envío y resultado con `Toast` o `Alert`.
- **Diálogo de confirmación o registro** (Entregas, Devoluciones, Dar de baja): `Modal` con título enlazado por `titleId`; el foco entra al diálogo y vuelve al botón que lo abrió.
- **Panel de inicio**: tarjetas numéricas (`StatCard`) y accesos rápidos (`QuickLink`) distintos por rol.
- **Reporte con gráficos**: `FilterBar`, resumen numérico, `BarChart` por dimensión (estado, tipo, recurso, mes) y `DataTable` con el detalle. Los datos se agregan en `features/reports/utils/aggregate.ts`.
- **Calendario por recurso**: `ResourceCalendarView`, que se abre desde Disponibilidad con "Ver calendario por recurso". Muestra franjas libres y reservas de cada día, con leyenda.
- **Reserva recurrente**: `RecurringLoanForm`, que en la pantalla de solicitud se elige con el botón "Reserva recurrente" (junto a "Reserva única"). Muestra un resumen en vivo de las fechas de la serie y lista los conflictos al crearla.
- **Página de estado** (404, acceso denegado): ícono grande, título, una frase y un único botón principal "Ir al inicio".
- **Autenticación**: `AuthLayout` de dos columnas desde 1024 px; en móvil, cabecera de marca compacta sobre la tarjeta.

## Hacer y no hacer

| Hacer | No hacer |
|---|---|
| `var(--token)` para color, espacio, radio, sombra y movimiento | Hexadecimales, `px` mágicos o `z-index` sueltos |
| Reusar un componente de `shared/components/ui` | Duplicar markup de botón, tarjeta, chip o tabla en una página |
| `ButtonLink` para ir a otra ruta, `Button` para ejecutar una acción | `<Button>` que llama a `navigate`, o `<a>` con estilo de botón escrito a mano |
| `EmptyState` con acción, `SkeletonLoader` para listas, `loading` en botones | Pantalla en blanco o lista vacía sin explicación |
| Ícono SVG de `ui/icons` con `currentColor` | Emojis, librerías de íconos o imágenes externas |
| Estado con texto e ícono, además del color | Comunicar un estado solo con color |
| Barras con valor etiquetado y tabla alternativa | Gráficos de pastel con más de 5 categorías, o librerías de gráficos |
| Cambiar color, sombra u opacidad al pasar el cursor | `transform: scale` que mueva el contenido vecino |
| Un `<h1>` por página, puesto por `AppShell` | Repetir el título en `PageHeader` |
| Textos de interfaz en español, tono directo | Mensajes genéricos tipo "Error" sin decir cómo seguir |
| Mantener el error de login genérico ("Correo o contraseña incorrectos.") | Revelar si falló el correo o la contraseña |

## Antes de entregar una pantalla

Comprueba el checklist de MASTER.md §7: sin emojis como íconos, `cursor: pointer` en lo clicable, foco visible, contraste, responsive a 375, 768, 1024 y 1440 px sin scroll horizontal en móvil, `alt` en imágenes y sin estilos en línea. Después ejecuta `npx tsc -b --noEmit`, `npx eslint src` y `npx vitest run` en `sistemas-informacion`.
