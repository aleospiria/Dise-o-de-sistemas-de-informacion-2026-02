/** Valores del formulario de préstamo (Req 8.2). */
export interface LoanFormValues {
  /** "2026-10-20": el préstamo empieza y termina el mismo día. */
  fecha: string
  /** "14:00" */
  horaInicio: string
  /** "16:00" */
  horaFin: string
  motivo: string
}

export const MOTIVO_MIN_LENGTH = 10
export const MOTIVO_MAX_LENGTH = 500
