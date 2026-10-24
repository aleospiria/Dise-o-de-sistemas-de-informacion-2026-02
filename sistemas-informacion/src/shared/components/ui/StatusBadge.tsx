import styles from '@/shared/components/ui/StatusBadge.module.css'
import type { LoanStatus, ResourceStatus } from '@/shared/types'

export type BadgeStatus = ResourceStatus | LoanStatus

type Tone = 'green' | 'yellow' | 'blue' | 'orange' | 'gray' | 'red'

/**
 * Tabla declarativa estado → etiqueta y color (SOLID OCP). Al tipar el mapa
 * con `Record<BadgeStatus, …>`, agregar un estado nuevo a los tipos de dominio
 * obliga a darle una entrada aquí. El estado siempre se comunica también con
 * texto, no solo con color.
 */
const STATUS_BADGE: Record<BadgeStatus, { label: string; tone: Tone }> = {
  Disponible: { label: 'Disponible', tone: 'green' },
  Reservado: { label: 'Reservado', tone: 'yellow' },
  En_Préstamo: { label: 'En préstamo', tone: 'blue' },
  En_Mantenimiento: { label: 'En mantenimiento', tone: 'orange' },
  Dado_de_Baja: { label: 'Dado de baja', tone: 'gray' },
  Devuelto: { label: 'Devuelto', tone: 'green' },
  Cancelado: { label: 'Cancelado', tone: 'gray' },
  Vencido: { label: 'Vencido', tone: 'red' },
}

export interface StatusBadgeProps {
  status: BadgeStatus
}

export function StatusBadge({ status }: StatusBadgeProps) {
  const { label, tone } = STATUS_BADGE[status]
  return <span className={`${styles.badge} ${styles[tone]}`}>{label}</span>
}
