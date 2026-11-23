export interface LoginFormValues {
  correo: string
  contrasena: string
}

export interface TwoFactorFormValues {
  codigo: string
}

export interface ForgotPasswordFormValues {
  correo: string
}

export interface ResetPasswordFormValues {
  nuevaContrasena: string
  confirmacionContrasena: string
}

export interface RegisterFormValues {
  nombre: string
  correo: string
  cedula: string
  carnet: string
  contrasena: string
  confirmacionContrasena: string
}
