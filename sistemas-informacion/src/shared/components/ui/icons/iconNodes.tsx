import type { ReactNode } from 'react'

/**
 * Geometría de cada ícono (rejilla de 24×24, trazo de 2 px). Es una tabla de
 * datos: un ícono nuevo agrega una entrada aquí y aparece en `IconName`.
 * Los trazos son originales del proyecto (sin librería de íconos).
 */
export const ICON_NODES = {
  home: (
    <>
      <path d="M3 10.5 12 3l9 7.5" />
      <path d="M5 9.5V20a1 1 0 0 0 1 1h3.5v-6h5v6H18a1 1 0 0 0 1-1V9.5" />
    </>
  ),
  search: (
    <>
      <circle cx="11" cy="11" r="7" />
      <path d="m20 20-3.5-3.5" />
    </>
  ),
  calendar: (
    <>
      <rect x="3" y="4.5" width="18" height="16.5" rx="2" />
      <path d="M3 9.5h18M8 2.5v4M16 2.5v4" />
    </>
  ),
  clipboard: (
    <>
      <rect x="5" y="5" width="14" height="16" rx="2" />
      <rect x="9" y="3" width="6" height="4" rx="1" />
      <path d="M9 12h6M9 16h4" />
    </>
  ),
  'clipboard-check': (
    <>
      <rect x="5" y="5" width="14" height="16" rx="2" />
      <rect x="9" y="3" width="6" height="4" rx="1" />
      <path d="m9 14 2 2 4-4" />
    </>
  ),
  bell: (
    <>
      <path d="M6 9a6 6 0 0 1 12 0c0 6 2.5 7.5 2.5 7.5h-17S6 15 6 9Z" />
      <path d="M10 20a2 2 0 0 0 4 0" />
    </>
  ),
  send: <path d="M7 17 17 7M9 7h8v8" />,
  undo: (
    <>
      <path d="M9 14 4 9l5-5" />
      <path d="M4 9h10.5a5.5 5.5 0 0 1 0 11H11" />
    </>
  ),
  'shield-alert': (
    <>
      <path d="M12 3 4.5 6v5.5c0 4.5 3.2 8 7.5 9.5 4.3-1.5 7.5-5 7.5-9.5V6z" />
      <path d="M12 8.5v4M12 15.8v.2" />
    </>
  ),
  'shield-check': (
    <>
      <path d="M12 3 4.5 6v5.5c0 4.5 3.2 8 7.5 9.5 4.3-1.5 7.5-5 7.5-9.5V6z" />
      <path d="m9 12 2.2 2.2L15.5 10" />
    </>
  ),
  package: (
    <>
      <path d="M3 7.5 12 3l9 4.5v9L12 21l-9-4.5z" />
      <path d="m3 7.5 9 4.5 9-4.5M12 12v9" />
    </>
  ),
  'bar-chart': <path d="M3 21h18M6 21V11M12 21V4M18 21v-8" />,
  users: (
    <>
      <circle cx="9" cy="8" r="3.5" />
      <path d="M2.5 20a6.5 6.5 0 0 1 13 0" />
      <path d="M16 4.7a3.5 3.5 0 0 1 0 6.6M18 14.2a6.5 6.5 0 0 1 3.5 5.8" />
    </>
  ),
  user: (
    <>
      <circle cx="12" cy="8" r="4" />
      <path d="M4 21a8 8 0 0 1 16 0" />
    </>
  ),
  lock: (
    <>
      <rect x="4.5" y="10.5" width="15" height="10" rx="2" />
      <path d="M8 10.5v-3a4 4 0 0 1 8 0v3" />
    </>
  ),
  menu: <path d="M4 6h16M4 12h16M4 18h16" />,
  close: <path d="M6 6l12 12M18 6 6 18" />,
  'chevron-down': <path d="m6 9 6 6 6-6" />,
  'chevron-right': <path d="m9 6 6 6-6 6" />,
  'chevron-left': <path d="m15 6-6 6 6 6" />,
  'arrow-left': <path d="M19 12H5M11 5l-7 7 7 7" />,
  'log-out': (
    <>
      <path d="M9 4H6a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h3" />
      <path d="m16 8 4 4-4 4M20 12H9" />
    </>
  ),
  'check-circle': (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="m8 12.2 2.8 2.8L16 9.5" />
    </>
  ),
  'alert-circle': (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7.5v5.5M12 16.3v.2" />
    </>
  ),
  'alert-triangle': (
    <>
      <path d="M12 3.5 2.5 20h19z" />
      <path d="M12 10v4.5M12 17.3v.2" />
    </>
  ),
  info: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 11v5.5M12 7.7v.2" />
    </>
  ),
  clock: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3 2" />
    </>
  ),
  plus: <path d="M12 5v14M5 12h14" />,
  edit: <path d="M4 20v-4L16 4l4 4L8 20z" />,
  trash: <path d="M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13M10 11v6M14 11v6" />,
  download: <path d="M12 4v11M7.5 10.5 12 15l4.5-4.5M4 20h16" />,
  upload: <path d="M12 15V4M7.5 8.5 12 4l4.5 4.5M4 20h16" />,
  filter: <path d="M3 5h18l-7 8.5V20l-4-2v-4.5z" />,
  eye: (
    <>
      <path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12z" />
      <circle cx="12" cy="12" r="3" />
    </>
  ),
  refresh: (
    <>
      <path d="M20 11a8 8 0 0 0-14.5-4M4 4v3.5h3.5" />
      <path d="M4 13a8 8 0 0 0 14.5 4M20 20v-3.5h-3.5" />
    </>
  ),
  inbox: (
    <>
      <path d="m3 13 3-8h12l3 8v6a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1z" />
      <path d="M3 13h5l1 3h6l1-3h5" />
    </>
  ),
  image: (
    <>
      <rect x="3" y="4" width="18" height="16" rx="2" />
      <circle cx="9" cy="10" r="1.8" />
      <path d="m21 16-5-5-8 9" />
    </>
  ),
  key: (
    <>
      <circle cx="8" cy="15" r="4" />
      <path d="m11 12 9-9M16 7l3 3" />
    </>
  ),
  flask: (
    <>
      <path d="M9 3h6M10 3v6.5L4.5 19a1.8 1.8 0 0 0 1.6 2.7h11.8a1.8 1.8 0 0 0 1.6-2.7L14 9.5V3" />
      <path d="M7.5 15h9" />
    </>
  ),
  cpu: (
    <>
      <rect x="6" y="6" width="12" height="12" rx="2" />
      <rect x="9.5" y="9.5" width="5" height="5" rx="0.5" />
      <path d="M9 2v4M15 2v4M9 18v4M15 18v4M2 9h4M2 15h4M18 9h4M18 15h4" />
    </>
  ),
  wrench: (
    <path d="M14.7 6.3a4 4 0 0 0-5.3 5.2L3.5 17.4a1.8 1.8 0 0 0 2.6 2.6l5.9-5.9a4 4 0 0 0 5.2-5.3l-2.6 2.6-2.4-.6-.6-2.4z" />
  ),
  layers: (
    <>
      <path d="m12 3 9 4.5-9 4.5-9-4.5z" />
      <path d="m3 12 9 4.5 9-4.5M3 16.5 12 21l9-4.5" />
    </>
  ),
  compass: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="m15.5 8.5-2 5-5 2 2-5z" />
    </>
  ),
  check: <path d="m5 12.5 4.5 4.5L19 7.5" />,
  'arrow-right': <path d="M5 12h14M13 5l7 7-7 7" />,
  'graduation-cap': (
    <>
      <path d="m2 9 10-5 10 5-10 5z" />
      <path d="M6 11.5V16c0 1.5 2.7 3 6 3s6-1.5 6-3v-4.5M22 9v6" />
    </>
  ),
  'book-open': (
    <>
      <path d="M3 5.5c2-1 5.5-1 9 1 3.5-2 7-2 9-1v13c-2-1-5.5-1-9 1-3.5-2-7-2-9-1z" />
      <path d="M12 6.5v13" />
    </>
  ),
  mail: (
    <>
      <rect x="3" y="5" width="18" height="14" rx="2" />
      <path d="m3.5 7 8.5 6 8.5-6" />
    </>
  ),
  'user-plus': (
    <>
      <circle cx="9.5" cy="8" r="4" />
      <path d="M2.5 21a7 7 0 0 1 14 0M19 8v6M16 11h6" />
    </>
  ),
} as const satisfies Record<string, ReactNode>

/** Nombres válidos para `<Icon name="…" />`, derivados de la tabla. */
export type IconName = keyof typeof ICON_NODES
