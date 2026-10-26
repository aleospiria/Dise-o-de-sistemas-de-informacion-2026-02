import type { UserRole } from '@/shared/types'

export interface DemoAccount {
  rol: UserRole
  correo: string
  contrasena: string
}

/**
 * Cuentas de los datos semilla (`seed-data.ts`), una por rol, para probar y
 * presentar el sistema sin backend. Un test verifica que todas inician sesión
 * contra los datos semilla, para que esta lista no se desincronice.
 */
export const DEMO_ACCOUNTS: DemoAccount[] = [
  { rol: 'Estudiante', correo: 'estudiante@itm.edu.co', contrasena: 'Estudiante123' },
  { rol: 'Técnico_Laboratorio', correo: 'tecnico@itm.edu.co', contrasena: 'Tecnico123' },
  { rol: 'Administrador_Laboratorio', correo: 'admin@itm.edu.co', contrasena: 'Admin123' },
]
