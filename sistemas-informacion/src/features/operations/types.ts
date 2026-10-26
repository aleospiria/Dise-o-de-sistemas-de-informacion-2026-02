import type { ResourceCondition } from '@/shared/types'

/** Valores comunes de los formularios de entrega y devolución (Req 12.4, 13.4). */
export interface ConditionFormValues {
  condicion: ResourceCondition
  observaciones: string
}

export const OBSERVACIONES_MAX_LENGTH = 500
