import type { LoanStatus } from '@/shared/types'

export type ProgressStatus = Extract<LoanStatus, 'Reservado' | 'En_Préstamo' | 'Devuelto'>

/**
 * Etapas del recorrido normal de un préstamo. Es una tabla de datos: el orden
 * del arreglo es el orden de la línea de estado.
 */
export const PROGRESS_STEPS: Array<{ status: ProgressStatus; label: string }> = [
  { status: 'Reservado', label: 'Reservado' },
  { status: 'En_Préstamo', label: 'En préstamo' },
  { status: 'Devuelto', label: 'Devuelto' },
]

/** Indica si el estado forma parte del recorrido Reservado → En préstamo → Devuelto. */
export function isProgressStatus(status: LoanStatus): boolean {
  return PROGRESS_STEPS.some((step) => step.status === status)
}
