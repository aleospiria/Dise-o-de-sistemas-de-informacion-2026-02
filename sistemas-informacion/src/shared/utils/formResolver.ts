/**
 * Puente entre las validaciones puras del proyecto y React Hook Form.
 *
 * Cada formulario define una función pura `valores → errores` (testeable sin
 * React y basada en `validators.ts`). `createResolver` la adapta al formato
 * que espera React Hook Form, así la validación no queda acoplada a la
 * librería (SOLID DIP) y no duplicamos reglas en un esquema aparte.
 */
import type { FieldErrors, FieldValues, Resolver } from 'react-hook-form'

/** Mensaje de error por campo; un campo sin entrada es válido. */
export type FormErrors<T> = Partial<Record<keyof T, string>>

export function createResolver<T extends FieldValues>(
  validate: (values: T) => FormErrors<T>,
): Resolver<T> {
  return async (values) => {
    const entries = Object.entries(validate(values)).filter(
      (entry): entry is [string, string] => Boolean(entry[1]),
    )
    if (entries.length === 0) {
      return { values, errors: {} }
    }
    const errors = Object.fromEntries(
      entries.map(([field, message]) => [field, { type: 'validate', message }]),
    ) as FieldErrors<T>
    return { values: {}, errors }
  }
}

/**
 * Indica si hay errores de campo. Ignora `root` (errores del servidor), que no
 * se limpian al escribir y bloquearían el botón de envío para siempre.
 */
export function hasFieldErrors(errors: FieldErrors): boolean {
  return Object.keys(errors).some((field) => field !== 'root')
}
