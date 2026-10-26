import type { ResourceType } from '@/shared/types'

/**
 * Etiqueta de cada tipo de recurso. Al ser `Record<ResourceType, …>`, agregar
 * un tipo a los tipos de dominio obliga a darle una etiqueta aquí (SOLID OCP).
 */
export const RESOURCE_TYPE_LABELS: Record<ResourceType, string> = {
  Equipo: 'Equipo',
  Herramienta: 'Herramienta',
  Material: 'Material',
}

export const RESOURCE_TYPES = Object.keys(RESOURCE_TYPE_LABELS) as ResourceType[]
