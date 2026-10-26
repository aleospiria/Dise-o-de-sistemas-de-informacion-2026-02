import type { UserRole } from '@/shared/types'

/**
 * Etiqueta legible de cada rol. Al ser `Record<UserRole, …>`, agregar un rol
 * a los tipos de dominio obliga a darle una etiqueta aquí (SOLID OCP).
 */
export const ROLE_LABELS: Record<UserRole, string> = {
  Estudiante: 'Estudiante',
  Técnico_Laboratorio: 'Técnico de laboratorio',
  Administrador_Laboratorio: 'Administrador de laboratorio',
}

/** Todos los roles, derivados de `ROLE_LABELS` para que el compilador los verifique. */
export const ALL_ROLES = Object.keys(ROLE_LABELS) as UserRole[]
