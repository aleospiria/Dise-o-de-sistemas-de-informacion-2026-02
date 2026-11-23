/**
 * Validación pura de los formularios de acceso. Reutiliza `validators.ts`,
 * de modo que las reglas de negocio (p. ej. contraseña fuerte) viven en un
 * solo lugar y los servicios aplican exactamente las mismas.
 */
import type {
  ForgotPasswordFormValues,
  LoginFormValues,
  RegisterFormValues,
  ResetPasswordFormValues,
  TwoFactorFormValues,
} from '@/features/auth/types'
import { VALIDATION_MESSAGES as M } from '@/shared/constants/messages'
import type { FormErrors } from '@/shared/utils/formResolver'
import {
  passwordsMatch,
  validateEmail,
  validatePassword,
} from '@/shared/utils/validators'

export const NOMBRE_MAX_LENGTH = 100
export const TWO_FACTOR_CODE_LENGTH = 6

function validateCorreo(correo: string): string | undefined {
  if (!correo.trim()) return M.required
  if (!validateEmail(correo.trim())) return M.email
  return undefined
}

/** Inicio de sesión: solo exige los campos; la credencial la valida el servicio. */
export function validateLoginForm(
  values: LoginFormValues,
): FormErrors<LoginFormValues> {
  const errors: FormErrors<LoginFormValues> = {}
  const correo = validateCorreo(values.correo)
  if (correo) errors.correo = correo
  if (!values.contrasena) errors.contrasena = M.required
  return errors
}

/** Verificación en dos pasos: código numérico de 6 dígitos. */
export function validateTwoFactorForm(
  values: TwoFactorFormValues,
): FormErrors<TwoFactorFormValues> {
  const errors: FormErrors<TwoFactorFormValues> = {}
  const codigo = values.codigo.trim()
  if (!codigo) errors.codigo = M.required
  else if (!new RegExp(`^\\d{${TWO_FACTOR_CODE_LENGTH}}$`).test(codigo)) {
    errors.codigo = `Ingresa el código de ${TWO_FACTOR_CODE_LENGTH} dígitos.`
  }
  return errors
}

export function validateForgotPasswordForm(
  values: ForgotPasswordFormValues,
): FormErrors<ForgotPasswordFormValues> {
  const errors: FormErrors<ForgotPasswordFormValues> = {}
  const correo = validateCorreo(values.correo)
  if (correo) errors.correo = correo
  return errors
}

export function validateResetPasswordForm(
  values: ResetPasswordFormValues,
): FormErrors<ResetPasswordFormValues> {
  const errors: FormErrors<ResetPasswordFormValues> = {}
  if (!values.nuevaContrasena) errors.nuevaContrasena = M.required
  else if (!validatePassword(values.nuevaContrasena)) {
    errors.nuevaContrasena = M.password
  }

  if (!values.confirmacionContrasena) {
    errors.confirmacionContrasena = M.required
  } else if (
    !passwordsMatch(values.nuevaContrasena, values.confirmacionContrasena)
  ) {
    errors.confirmacionContrasena = M.passwordMismatch
  }
  return errors
}

/** Registro (Req 1.1, 1.4, 1.5). El correo único lo comprueba el servicio. */
export function validateRegisterForm(
  values: RegisterFormValues,
): FormErrors<RegisterFormValues> {
  const errors: FormErrors<RegisterFormValues> = {}

  const nombre = values.nombre.trim()
  if (!nombre) errors.nombre = M.required
  else if (nombre.length > NOMBRE_MAX_LENGTH) {
    errors.nombre = `Máximo ${NOMBRE_MAX_LENGTH} caracteres.`
  }

  const correo = validateCorreo(values.correo)
  if (correo) errors.correo = correo

  if (!values.cedula.trim()) errors.cedula = M.required
  if (!values.carnet.trim()) errors.carnet = M.required

  if (!values.contrasena) errors.contrasena = M.required
  else if (!validatePassword(values.contrasena)) errors.contrasena = M.password

  if (!values.confirmacionContrasena) errors.confirmacionContrasena = M.required
  else if (!passwordsMatch(values.contrasena, values.confirmacionContrasena)) {
    errors.confirmacionContrasena = M.passwordMismatch
  }

  return errors
}
