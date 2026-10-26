import type { Resource } from '@/shared/types'

/**
 * Regla de dominio: un recurso se puede reservar si está "Disponible" y le
 * quedan unidades sin reservar. La usan el servicio de préstamos y la interfaz,
 * para que ambos coincidan en qué significa "disponible".
 */
export function isResourceBookable(resource: Resource): boolean {
  return resource.estadoActual === 'Disponible' && resource.cantidadDisponible > 0
}
