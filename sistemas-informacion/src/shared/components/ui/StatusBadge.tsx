import { Badge, type BadgeTone } from '@/shared/components/ui/Badge'
import type { IconName } from '@/shared/components/ui/icons'
import type { LoanStatus, ResourceStatus } from '@/shared/types'

export type BadgeStatus = ResourceStatus | LoanStatus

/**
 * Tabla declarativa estado → etiqueta, color e ícono (SOLID OCP). Al tipar el
 * mapa con `Record<BadgeStatus, …>`, agregar un estado nuevo a los tipos de
 * dominio obliga a darle una entrada aquí. El estado siempre se comunica
 * también con texto, no solo con color.
 */
const STATUS_BADGE: Record<BadgeStatus, { label: string; tone: BadgeTone; icon: IconName }> = {
  Disponible: { label: 'Disponible', tone: 'green', icon: 'check-circle' },
  Reservado: { label: 'Reservado', tone: 'yellow', icon: 'calendar' },
  En_Préstamo: { label: 'En préstamo', tone: 'blue', icon: 'clipboard' },
  En_Mantenimiento: { label: 'En mantenimiento', tone: 'orange', icon: 'wrench' },
  Dado_de_Baja: { label: 'Dado de baja', tone: 'gray', icon: 'close' },
  Devuelto: { label: 'Devuelto', tone: 'green', icon: 'undo' },
  Cancelado: { label: 'Cancelado', tone: 'gray', icon: 'close' },
  Vencido: { label: 'Vencido', tone: 'red', icon: 'alert-triangle' },
}

export interface StatusBadgeProps {
  status: BadgeStatus
}

export function StatusBadge({ status }: StatusBadgeProps) {
  const { label, tone, icon } = STATUS_BADGE[status]
  return (
    <Badge tone={tone} icon={icon}>
      {label}
    </Badge>
  )
}
