/**
 * Validación pura de los formularios de entrega y devolución. Reutiliza
 * `validators.ts`, las mismas reglas que aplica el servicio (Req 12.7, 12.8).
 */
import {
  OBSERVACIONES_MAX_LENGTH,
  type ConditionFormValues,
} from '@/features/operations/types'
import { VALIDATION_MESSAGES as M } from '@/shared/constants/messages'
import type { FormErrors } from '@/shared/utils/formResolver'
import { validateObservaciones } from '@/shared/utils/validators'

export interface ConditionFormRules {
  /** En la entrega, un recurso dañado exige explicarlo (Req 12.8). */
  requireNotesIfDamaged: boolean
}

export function validateConditionForm(
  values: ConditionFormValues,
  { requireNotesIfDamaged }: ConditionFormRules,
): FormErrors<ConditionFormValues> {
  const errors: FormErrors<ConditionFormValues> = {}

  if (!values.condicion) errors.condicion = M.required

  const observaciones = values.observaciones.trim()
  if (!validateObservaciones(observaciones)) {
    errors.observaciones = `Máximo ${OBSERVACIONES_MAX_LENGTH} caracteres.`
  } else if (requireNotesIfDamaged && values.condicion === 'Dañado' && !observaciones) {
    errors.observaciones = 'Las observaciones son obligatorias si el recurso está dañado.'
  }

  return errors
}
