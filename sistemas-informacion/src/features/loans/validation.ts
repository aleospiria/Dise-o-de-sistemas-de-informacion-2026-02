/**
 * Validación pura del formulario de préstamo. Reutiliza `validators.ts`: las
 * mismas reglas que aplica el servicio (Req 8.3–8.6), mostradas junto al
 * campo que las causa.
 */
import {
  MOTIVO_MAX_LENGTH,
  MOTIVO_MIN_LENGTH,
  type LoanFormValues,
} from '@/features/loans/types'
import { VALIDATION_MESSAGES as M } from '@/shared/constants/messages'
import { combineDateAndTime, isDateInPast } from '@/shared/utils/dateUtils'
import type { FormErrors } from '@/shared/utils/formResolver'
import { validateLoanTimes, validateMotivo } from '@/shared/utils/validators'

export function validateLoanForm(values: LoanFormValues): FormErrors<LoanFormValues> {
  const errors: FormErrors<LoanFormValues> = {}

  if (!values.fecha) errors.fecha = M.required
  if (!values.horaInicio) errors.horaInicio = M.required
  if (!values.horaFin) errors.horaFin = M.required

  const motivo = values.motivo.trim()
  if (!motivo) errors.motivo = M.required
  else if (!validateMotivo(values.motivo)) {
    errors.motivo = `El motivo debe tener entre ${MOTIVO_MIN_LENGTH} y ${MOTIVO_MAX_LENGTH} caracteres.`
  }

  // Los tiempos solo se evalúan si están los tres campos.
  const start = combineDateAndTime(values.fecha, values.horaInicio)
  const end = combineDateAndTime(values.fecha, values.horaFin)
  if (start && end) {
    const times = validateLoanTimes(start, end)
    if (!times.valid) {
      // Inicio en el pasado se atribuye a la fecha; el resto, a la hora de fin.
      if (isDateInPast(start)) errors.fecha = times.error
      else errors.horaFin = times.error
    }
  }

  return errors
}
