# Design System Master — Sistema de préstamo de laboratorio

> **Lógica de consulta:** al construir una página concreta, revisa primero `design-system/pages/<pagina>.md`.
> Si existe, sus reglas **sustituyen** a este archivo; si no, aplica este archivo completo.
> Los tokens viven en `sistemas-informacion/src/index.css` (variables CSS) y los patrones de página
> en `sistemas-informacion/src/shared/components/ui/DataPage.module.css`.

- **Proyecto:** Sistema de préstamo de recursos de laboratorio (ITM, Diseño de Sistemas de Información)
- **Generado con:** skill `ui-ux-pro-max` (`search.py "laboratory resource lending university dashboard professional" --design-system --persist`)
- **Stack real:** React 19 + CSS Modules + variables CSS. **Sin Tailwind, sin librerías de UI, sin CDNs.**

---

## 1. Resultado de la skill y adaptación al proyecto

| Tema | Recomendación de la skill | Decisión en este proyecto | Motivo |
|---|---|---|---|
| Patrón | Data-Dense + Drill-Down | **Se adopta**: tablas, tarjetas de resumen (KPI), filtros visibles y detalle al hacer clic | Es una herramienta operativa de inventario y préstamos |
| Estilo | Data-Dense Dashboard (con apoyo de Minimalism & Swiss Style para entornos institucionales) | **Se adopta** con espaciado generoso en formularios | Jerarquía clara sin ornamento (la skill penaliza el "Ornate design") |
| Paleta | Slate `#0F172A` / `#1E293B`, CTA verde `#22C55E`, fondo oscuro `#020617` | **Un solo modo claro.** Slate se usa para el marco de navegación; el CTA pasa a azul institucional `#1E40AF`; el verde se reserva para "éxito/disponible" en tono oscuro `#15803D` | `#22C55E` con texto blanco da 2.2:1 (falla AA). El brief pide paleta sobria y un solo modo claro |
| Tipografía | Fira Code + Fira Sans (Google Fonts) | **Pila del sistema** (`system-ui, Segoe UI, Roboto…`) y `ui-monospace` para códigos | CSP `font-src 'self'` y `style-src 'self'`: no se cargan fuentes externas; autoalojar añadiría peso sin beneficio |
| Efectos | Hover en filas, tooltips, carga con spinners/skeleton | **Se adopta** (transiciones 150–300 ms, sin `transform` que mueva el layout) | Checklist de la skill |
| Gráficos | Barras para comparar categorías, tabla como alternativa accesible; evitar pastel con más de 5 elementos | **Se adopta** barras SVG/CSS + tabla textual, sin librería | `--domain chart`: "Add value labels", "Add data table" |

Consultas complementarias ejecutadas: `--domain ux` (carga y animación: skeleton/spinner solo para cargas; sin animaciones decorativas infinitas; carga diferida de imágenes bajo el pliegue), `--domain web` (HTML semántico antes que ARIA; `<button>`/`<a>`/`<label>`; tipos de input semánticos), `--domain style`, `--domain typography`, `--domain color`, `--stack react`, `--domain chart`.

---

## 2. Dirección visual

**«Instrumental institucional»**: marco oscuro de navegación en slate (laboratorio, equipo de medición) y área de trabajo clara y aireada, con azul institucional como acción principal y verde azulado como acento de laboratorio. Estados siempre con color **y** texto/ícono.

- Menú lateral oscuro (`--color-nav-bg`) con marca, secciones colapsables e ítem activo con barra de acento.
- Contenido sobre `--color-bg` (gris azulado muy claro) con tarjetas blancas y borde sutil.
- Encabezado superior blanco con usuario, rol (avatar con iniciales) y botón «Cerrar sesión».
- Íconos SVG propios (trazo de 2 px, 24×24, `currentColor`), nunca emojis.

---

## 3. Tokens

Todos están en `:root` de `src/index.css`. Usa siempre `var(--token)`, nunca un hexadecimal suelto en un módulo CSS de componente.

### Color

| Rol | Token | Valor | Contraste |
|---|---|---|---|
| Texto | `--color-text` | `#0F172A` | 17.9:1 sobre blanco |
| Texto atenuado | `--color-text-muted` | `#475569` | 7.6:1 sobre blanco, 6.9:1 sobre fondo |
| Fondo de la app | `--color-bg` | `#F1F5F9` | |
| Superficie / alterna | `--color-surface` / `--color-surface-alt` | `#FFFFFF` / `#F8FAFC` | |
| Borde de control | `--color-border` | `#64748B` | 4.8:1 (≥ 3:1) |
| Borde sutil / fuerte | `--color-border-subtle` / `--color-border-strong` | `#E2E8F0` / `#CBD5E1` | decorativo |
| Primario (CTA) | `--color-primary` (+ `-hover`, `-soft`, `-soft-text`) | `#1E40AF` | 8.7:1 con texto blanco |
| Acento | `--color-accent` (+ `-hover`, `-soft`, `-soft-border`) | `#0F766E` | 5.5:1 sobre blanco |
| Éxito | `--color-success`, `-soft`, `-soft-text` | `#15803D`, `#F0FDF4`, `#14532D` | 5.0:1 / 8.7:1 |
| Advertencia | `--color-warning`, `-soft`, `-soft-text` | `#B45309`, `#FFFBEB`, `#78350F` | 5.0:1 / 8.8:1 |
| Peligro | `--color-danger` (+ `-hover`, `-soft`, `-soft-text`) | `#B91C1C`, `#FEF2F2`, `#7F1D1D` | 6.5:1 / 9.2:1 |
| Información / neutro | `--color-info-*`, `--color-neutral-soft(-text)` | azul / slate | ≥ 8:1 |
| Menú lateral | `--color-nav-bg`, `-bg-hover`, `-text`, `-text-muted`, `-active-bg`, `-active-bar` | `#0F172A`, `#1E293B`, `#CBD5E1`, `#94A3B8`, `#1E3A8A`, `#5EEAD4` | 12:1 / 6.9:1 |
| Foco | `--color-focus` / `--color-focus-on-dark` | `#1D4ED8` / `#93C5FD` | 6.7:1 / 9.9:1 |

### Tipografía

- `--font-sans`: `system-ui, -apple-system, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif`
- `--font-mono`: `ui-monospace, SFMono-Regular, 'Cascadia Mono', Consolas, monospace` (códigos de inventario, tokens, secretos 2FA)
- Escala: `--font-size-xs` 12 px (solo etiquetas no esenciales), `-sm` 14, `-md` 16 (cuerpo), `-lg` 20, `-xl` 24, `-2xl` 30. Cuerpo nunca por debajo de 14 px.
- Interlineado 1.5 en cuerpo, 1.25 en títulos. Pesos: 500 / 600 / 700.

### Espaciado, forma, elevación, movimiento

| Grupo | Tokens |
|---|---|
| Espaciado (base 4 px) | `--space-1` 4, `-2` 8, `-3` 12, `-4` 16, `-5` 20, `-6` 24, `-8` 32, `-10` 40, `-12` 48 |
| Radios | `--radius-sm` 4, `--radius` 8, `--radius-lg` 12, `--radius-xl` 16, `--radius-pill` |
| Sombras | `--shadow-sm` (tarjetas), `--shadow-md` (hover de tarjeta), `--shadow` (diálogos, toasts) |
| Movimiento | `--duration-fast` 150 ms, `--duration` 200 ms, `--duration-slow` 300 ms, `--ease`, `--transition` |
| Capas | `--z-sticky` 20, `--z-drawer` 40, `--z-modal` 1000, `--z-toast` 1100, `--z-skip` 2000 |
| Layout | `--touch-target` 44 px, `--header-height` 4 rem, `--sidebar-width` 16 rem, `--content-max` 80 rem |

---

## 4. Componentes base (`src/shared/components/`)

| Componente | Uso | Reglas |
|---|---|---|
| `ui/Button` | `primary`, `secondary`, `danger`, `ghost`; `sm/md/lg`; `loading`; ícono opcional | Alto mínimo 44 px, `cursor: pointer`, foco visible, estado `disabled` legible |
| `ui/Input`, `Select`, `Textarea` + `FormField` | Etiqueta siempre visible, ayuda, error en región `aria-live` | Error con texto + borde rojo, nunca solo color; `required` con asterisco `aria-hidden` |
| `ui/Card` | Superficie con borde sutil y sombra `sm`; `interactive` añade hover | Una tarjeta clicable es un `<a>`/`<button>`, no un `div` |
| `ui/Badge`, `StatusBadge`, `TypeBadge` | Estado de recurso/préstamo y tipo | Siempre texto (y ícono opcional); tonos `green/yellow/blue/orange/gray/red/teal` |
| `ui/PageHeader` | Descripción breve y acción principal bajo el `<h1>` de la página | El único `<h1>` lo dibuja `AppShell` |
| `ui/EmptyState` | Ícono + título + explicación + acción | Dice qué ocurre y cómo continuar |
| `ui/StateMessage`, `Alert`, `Toast` | Carga, error, éxito, información | `role="alert"` solo para errores; el resto `role="status"` |
| `ui/DataTable` | Tabla semántica con `caption`/nombre accesible y desplazamiento horizontal contenido | Fila de encabezado sticky, hover en filas |
| `ui/Modal` | Diálogo accesible (Escape, trampa de foco, pantalla completa en móvil) | Botón de cierre con `aria-label` |
| `ui/Breadcrumb` | Migas; en móvil, «Atrás» + nivel actual | `aria-current="page"` |
| `ui/icons` | `<Icon name="…">`, decorativos por defecto (`aria-hidden`) | Con significado propio: pasar `title` |
| `layout/AppShell`, `Sidebar`, `AuthLayout` | Marco autenticado y marco público | Ver §6 |

---

## 5. Páginas especiales

- **404** y **acceso denegado**: ilustración con ícono grande en círculo, título claro, una frase de explicación y un único botón principal «Ir al inicio».
- **Login / registro**: marco `AuthLayout` de dos columnas (marca a la izquierda desde 1024 px, formulario a la derecha); en móvil, cabecera de marca compacta sobre la tarjeta.

---

## 6. Layout y responsive

| Ancho | Comportamiento |
|---|---|
| 375 px | Encabezado con botón de menú (44 px), marca (ícono) y usuario; menú lateral como panel deslizante bajo el encabezado con fondo atenuado; contenido a una columna; sin scroll horizontal |
| 768 px | Igual que móvil con más aire; tablas con desplazamiento contenido |
| ≥ 1024 px | Menú lateral fijo de 16 rem con marca; encabezado con usuario y rol; contenido hasta 80 rem |

El menú se cierra con Escape, al elegir una opción o al tocar el fondo.

---

## 7. Accesibilidad y checklist previa a la entrega

- [ ] Sin emojis como íconos (SVG propios de `ui/icons`, decorativos con `aria-hidden`)
- [ ] `cursor: pointer` en todo elemento clicable
- [ ] Transiciones de 150–300 ms; hover sin `transform` que desplace el layout
- [ ] Texto ≥ 4.5:1 (texto grande y componentes ≥ 3:1)
- [ ] Foco visible (`:focus-visible`, 3 px, sobre fondo oscuro `--color-focus-on-dark`)
- [ ] `prefers-reduced-motion` respetado (regla global en `index.css`)
- [ ] Responsive a 375 / 768 / 1024 / 1440 px, sin scroll horizontal en móvil
- [ ] Áreas táctiles ≥ 44 px
- [ ] Estados comunicados con texto, no solo con color
- [ ] Cada imagen informativa con `alt`; las decorativas con `alt=""`
- [ ] Sin estilos en línea, sin `blob:`, sin fuentes ni imágenes externas (CSP)

## 8. Qué hacer / qué no hacer

| Hacer | No hacer |
|---|---|
| Usar `var(--token)` para color, espacio, radio, sombra, movimiento | Hexadecimales sueltos o `px` mágicos en componentes |
| Un `<h1>` por página (lo pone `AppShell`); `<h2>` para secciones | Saltar niveles de encabezado |
| Un estado vacío útil con acción | Listas en blanco sin explicación |
| Skeleton para listas/tablas, spinner para acciones | Pantalla en blanco mientras carga |
| Íconos SVG propios con `currentColor` | Emojis o librerías de íconos nuevas |
| Gráficos de barras con valores etiquetados y tabla alternativa | Gráficos de pastel con más de 5 categorías |
| Cambiar color/sombra/opacidad al hacer hover | `transform: scale` que mueva el contenido vecino |

## 9. Gráficos (Reportes)

Recomendación de la skill para «comparar categorías»: barras horizontales o verticales, ordenadas de mayor a menor, con etiquetas de valor y tabla como alternativa. Se implementan con SVG/CSS y una tabla `<table>` equivalente visible o colapsable; sin Chart.js/Recharts.
