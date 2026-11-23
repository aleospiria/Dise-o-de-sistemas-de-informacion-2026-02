/** Máximo de fechas que el resumen enumera antes de agrupar el resto. */
export const MAX_LISTED_OCCURRENCES = 8

function parseDate(value: string): Date | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value)
  if (!match) return null
  return new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]))
}

/**
 * Fechas (AAAA-MM-DD) entre `start` y `end`, ambas incluidas, que caen en alguno
 * de los días de la semana indicados (0 = domingo). Es solo una vista previa
 * para el usuario: la creación real y sus conflictos los decide el servicio.
 */
export function listOccurrences(start: string, end: string, weekdays: number[]): string[] {
  const from = parseDate(start)
  const to = parseDate(end)
  if (!from || !to || weekdays.length === 0) return []
  const dates: string[] = []
  for (const cursor = new Date(from); cursor <= to; cursor.setDate(cursor.getDate() + 1)) {
    if (weekdays.includes(cursor.getDay())) {
      const month = String(cursor.getMonth() + 1).padStart(2, '0')
      const day = String(cursor.getDate()).padStart(2, '0')
      dates.push(`${cursor.getFullYear()}-${month}-${day}`)
    }
  }
  return dates
}
