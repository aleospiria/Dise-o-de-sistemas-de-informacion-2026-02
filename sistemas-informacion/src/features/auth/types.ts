import type { UserRole } from '@/shared/types'

export interface LoginFormValues {
  correo: string
  contrasena: string
}

export interface RegisterFormValues {
  nombre: string
  correo: string
  cedula: string
  idRol: UserRole
  /** Solo se pide y se envía para el rol Estudiante. */
  carnet: string
  contrasena: string
  confirmacionContrasena: string
}
