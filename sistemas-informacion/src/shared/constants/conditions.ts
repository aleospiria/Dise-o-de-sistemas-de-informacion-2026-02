import type { ResourceCondition } from '@/shared/types'

/**
 * Etiqueta de cada condición del recurso (Req 12.5). Al ser
 * `Record<ResourceCondition, …>`, una condición nueva exige su etiqueta aquí.
 */
export const CONDITION_LABELS: Record<ResourceCondition, string> = {
  Bueno: 'Bueno',
  Regular: 'Regular',
  Dañado: 'Dañado',
}

export const CONDITIONS = Object.keys(CONDITION_LABELS) as ResourceCondition[]
