/**
 * Utilidades puras de formateo y cálculo de fechas.
 * Todas las entradas son cadenas ISO 8601.
 */

const MS_PER_HOUR = 1000 * 60 * 60

/**
 * Formatea una fecha ISO a formato legible en español (solo fecha).
 * Ej: "15 de octubre de 2026".
 */
export function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('es-CO', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}

/**
 * Formatea una fecha ISO a formato legible en español con hora.
 * Ej: "15 de octubre de 2026, 14:30".
 */
export function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleString('es-CO', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

/**
 * Calcula el retraso en horas de una devolución (Req 13.5, 13.11).
 * Devuelve `max(0, devolucionReal - finProgramada)`; nunca negativo.
 */
export function calculateDelayHours(
  realReturn: string,
  scheduledEnd: string,
): number {
  const diffMs = new Date(realReturn).getTime() - new Date(scheduledEnd).getTime()
  if (Number.isNaN(diffMs) || diffMs <= 0) return 0
  return diffMs / MS_PER_HOUR
}

/**
 * Indica si una fecha ISO es anterior al momento actual.
 */
export function isDateInPast(iso: string): boolean {
  return new Date(iso).getTime() < Date.now()
}

/**
 * Indica si dos intervalos temporales [start, end] se solapan.
 * Dos intervalos que solo se tocan en un extremo (end1 === start2) NO se
 * consideran solapados, de modo que un préstamo puede comenzar justo cuando
 * termina otro.
 */
export function intervalsOverlap(
  start1: string,
  end1: string,
  start2: string,
  end2: string,
): boolean {
  const s1 = new Date(start1).getTime()
  const e1 = new Date(end1).getTime()
  const s2 = new Date(start2).getTime()
  const e2 = new Date(end2).getTime()
  return s1 < e2 && s2 < e1
}
