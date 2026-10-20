/**
 * Claves de localStorage bajo el namespace `sistema-prestamos-lab-`.
 * Fuente: design.md — sección "Data Models".
 */
export const LS_KEYS = {
  USERS: 'sistema-prestamos-lab-users',
  RESOURCES: 'sistema-prestamos-lab-resources',
  LOANS: 'sistema-prestamos-lab-loans',
  STATUS_HISTORY: 'sistema-prestamos-lab-status-history',
  SANCTIONS: 'sistema-prestamos-lab-sanctions',
  SESSION: 'sistema-prestamos-lab-session',
  INITIALIZED: 'sistema-prestamos-lab-initialized',
} as const

export type LsKey = (typeof LS_KEYS)[keyof typeof LS_KEYS]
