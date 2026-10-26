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

const DATE_INPUT_PATTERN = /^\d{4}-\d{2}-\d{2}$/
const TIME_INPUT_PATTERN = /^\d{2}:\d{2}$/

/**
 * Une el valor de un `<input type="date">` ("2026-10-20") y de un
 * `<input type="time">` ("14:30"), interpretados en hora local, y devuelve el
 * instante en ISO 8601. Devuelve `null` si alguno falta o es inválido.
 */
export function combineDateAndTime(date: string, time: string): string | null {
  if (!DATE_INPUT_PATTERN.test(date) || !TIME_INPUT_PATTERN.test(time)) return null
  const combined = new Date(`${date}T${time}`)
  return Number.isNaN(combined.getTime()) ? null : combined.toISOString()
}

/** Fecha local con el formato de `<input type="date">` ("2026-10-20"). */
export function toDateInputValue(date: Date = new Date()): string {
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${date.getFullYear()}-${month}-${day}`
}

/**
 * Formatea un intervalo legible. Si empieza y termina el mismo día, la fecha
 * se muestra una sola vez: "20 de octubre de 2026, 02:00 p. m. – 04:00 p. m.".
 */
export function formatDateTimeRange(startIso: string, endIso: string): string {
  const start = new Date(startIso)
  const end = new Date(endIso)
  if (start.toDateString() !== end.toDateString()) {
    return `${formatDateTime(startIso)} – ${formatDateTime(endIso)}`
  }
  const endTime = end.toLocaleTimeString('es-CO', {
    hour: '2-digit',
    minute: '2-digit',
  })
  return `${formatDateTime(startIso)} – ${endTime}`
}
