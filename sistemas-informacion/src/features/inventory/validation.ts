/**
 * Validación pura del formulario de recurso. Reutiliza `validators.ts`, las
 * mismas reglas que aplica el servicio (Req 4.4, 4.5).
 */
import {
  DESCRIPCION_MAX_LENGTH,
  NOMBRE_MAX_LENGTH,
  type ResourceFormValues,
} from '@/features/inventory/types'
import { VALIDATION_MESSAGES as M } from '@/shared/constants/messages'
import type { FormErrors } from '@/shared/utils/formResolver'
import { validateQuantity, validateResourceName } from '@/shared/utils/validators'

export interface ResourceFormRules {
  /**
   * Cantidad mínima permitida: al editar, las unidades que hoy están en uso
   * (prestadas o reservadas) no se pueden quitar.
   */
  minQuantity: number
}

export function validateResourceForm(
  values: ResourceFormValues,
  { minQuantity }: ResourceFormRules,
): FormErrors<ResourceFormValues> {
  const errors: FormErrors<ResourceFormValues> = {}

  const nombre = values.nombre.trim()
  if (!nombre) errors.nombre = M.required
  else if (!validateResourceName(values.nombre)) {
    errors.nombre = `Máximo ${NOMBRE_MAX_LENGTH} caracteres.`
  }

  if (!values.codigoInventario.trim()) errors.codigoInventario = M.required
  if (!values.tipo) errors.tipo = M.required

  if (values.descripcion.trim().length > DESCRIPCION_MAX_LENGTH) {
    errors.descripcion = `Máximo ${DESCRIPCION_MAX_LENGTH} caracteres.`
  }

  const cantidad = values.cantidadTotal.trim()
  if (!cantidad) errors.cantidadTotal = M.required
  else if (!validateQuantity(Number(cantidad))) {
    errors.cantidadTotal = 'Ingresa un número entero mayor que 0.'
  } else if (Number(cantidad) < minQuantity) {
    errors.cantidadTotal = `Hay ${minQuantity} unidades en uso: la cantidad mínima es ${minQuantity}.`
  }

  return errors
}
