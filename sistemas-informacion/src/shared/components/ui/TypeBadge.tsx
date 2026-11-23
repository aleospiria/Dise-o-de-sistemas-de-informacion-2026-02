import { Badge } from '@/shared/components/ui/Badge'
import type { IconName } from '@/shared/components/ui/icons'
import { RESOURCE_TYPE_LABELS } from '@/shared/constants/resourceTypes'
import type { ResourceType } from '@/shared/types'

/** Ícono de cada tipo de recurso (tabla declarativa, SOLID OCP). */
const RESOURCE_TYPE_ICONS: Record<ResourceType, IconName> = {
  Equipo: 'cpu',
  Herramienta: 'wrench',
  Material: 'layers',
}

export interface TypeBadgeProps {
  type: ResourceType
}

/** Chip con el tipo de recurso (Equipo, Herramienta o Material). */
export function TypeBadge({ type }: TypeBadgeProps) {
  return (
    <Badge tone="teal" icon={RESOURCE_TYPE_ICONS[type]}>
      {RESOURCE_TYPE_LABELS[type]}
    </Badge>
  )
}
