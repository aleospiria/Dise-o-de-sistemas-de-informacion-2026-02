import type { BarChartItem, BarTone } from '@/shared/components/ui/BarChart'
import { RESOURCE_TYPE_LABELS, RESOURCE_TYPES } from '@/shared/constants/resourceTypes'
import type { LoanStatus, ReportRow } from '@/shared/types'

const STATUS_ORDER: { status: LoanStatus; label: string; tone: BarTone }[] = [
  { status: 'Reservado', label: 'Reservado', tone: 'orange' },
  { status: 'En_Préstamo', label: 'En préstamo', tone: 'blue' },
  { status: 'Devuelto', label: 'Devuelto', tone: 'green' },
  { status: 'Cancelado', label: 'Cancelado', tone: 'gray' },
  { status: 'Vencido', label: 'Vencido', tone: 'red' },
]

const MONTHS = [
  'ene',
  'feb',
  'mar',
  'abr',
  'may',
  'jun',
  'jul',
  'ago',
  'sep',
  'oct',
  'nov',
  'dic',
]

/** Cantidad de préstamos por estado, en el orden del ciclo de vida (omite los vacíos). */
export function countByStatus(rows: ReportRow[]): BarChartItem[] {
  return STATUS_ORDER.map(({ status, label, tone }) => ({
    key: status,
    label,
    tone,
    value: rows.filter((row) => row.estado === status).length,
  })).filter((item) => item.value > 0)
}

/** Cantidad de préstamos por tipo de recurso, de mayor a menor. */
export function countByType(rows: ReportRow[]): BarChartItem[] {
  return RESOURCE_TYPES.map((type) => ({
    key: type,
    label: RESOURCE_TYPE_LABELS[type],
    tone: 'teal' as const,
    value: rows.filter((row) => row.tipoRecurso === type).length,
  }))
    .filter((item) => item.value > 0)
    .sort((a, b) => b.value - a.value)
}

/** Cantidad de préstamos por mes (orden cronológico), para ver la tendencia. */
export function countByMonth(rows: ReportRow[]): BarChartItem[] {
  const counts = new Map<string, number>()
  for (const row of rows) {
    const key = row.fecha.slice(0, 7)
    counts.set(key, (counts.get(key) ?? 0) + 1)
  }
  return [...counts.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, value]) => {
      const [year, month] = key.split('-')
      return {
        key,
        label: `${MONTHS[Number(month) - 1] ?? month} ${year}`,
        tone: 'blue' as const,
        value,
      }
    })
}

/** Los recursos más solicitados, de mayor a menor (empates por nombre). */
export function topResources(rows: ReportRow[], limit = 5): BarChartItem[] {
  const counts = new Map<string, { label: string; value: number }>()
  for (const row of rows) {
    const current = counts.get(row.idRecurso)
    counts.set(row.idRecurso, {
      label: row.recurso,
      value: (current?.value ?? 0) + 1,
    })
  }
  return [...counts.entries()]
    .map(([key, { label, value }]) => ({ key, label, value, tone: 'teal' as const }))
    .sort((a, b) => b.value - a.value || a.label.localeCompare(b.label, 'es'))
    .slice(0, limit)
}
