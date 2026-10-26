/** Mensajes de validación comunes a todos los formularios (Req 17.6, 17.7). */
export const VALIDATION_MESSAGES = {
  required: 'Este campo es requerido',
  email: 'Ingresa un correo electrónico válido',
  password:
    'La contraseña debe tener mínimo 8 caracteres, con mayúscula, minúscula y número.',
  passwordMismatch: 'Las contraseñas no coinciden.',
} as const
