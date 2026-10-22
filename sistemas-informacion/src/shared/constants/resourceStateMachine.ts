/**
 * Máquina de estados de recursos — definición DECLARATIVA.
 *
 * SOLID M3 (OCP): las transiciones viven como datos, no como condicionales
 * incrustadas en la lógica. Agregar o quitar una transición solo cambia esta
 * tabla; `isValidTransition` nunca se modifica.
 *
 * SOLID M5 (OCP/Strategy): la estrategia de devolución mapea cada condición
 * del recurso a su estado resultante, reemplazando el `if (Dañado)` del
 * servicio por una tabla extensible.
 *
 * Fuente: design.md — "Resource State Machine".
 */
import type { ResourceCondition, ResourceStatus } from '@/shared/types'

/**
 * Transiciones válidas de la máquina de estados de recurso.
 * Cada clave es el estado origen; el array son los destinos permitidos.
 */
export const RESOURCE_TRANSITIONS: Record<ResourceStatus, ResourceStatus[]> = {
  // En_Mantenimiento desde Disponible/Reservado: un recurso con varias
  // unidades puede recibir una devolución dañada mientras otras siguen libres
  // o reservadas (Req 13.9).
  Disponible: ['Reservado', 'En_Mantenimiento', 'Dado_de_Baja'],
  Reservado: ['En_Préstamo', 'Disponible', 'En_Mantenimiento'], // Disponible = cancelación (Post-MVP)
  En_Préstamo: ['Disponible', 'En_Mantenimiento'],
  En_Mantenimiento: ['Disponible', 'Dado_de_Baja'],
  Dado_de_Baja: [], // estado terminal
}

/**
 * Indica si la transición `from → to` es válida según la tabla declarativa.
 */
export function isValidTransition(
  from: ResourceStatus,
  to: ResourceStatus,
): boolean {
  return RESOURCE_TRANSITIONS[from].includes(to)
}

/**
 * Estrategia de devolución: mapea la condición del recurso al estado
 * resultante tras registrar una devolución (Req 13.6, 13.9).
 * - Bueno/Regular → Disponible
 * - Dañado → En_Mantenimiento
 */
export const RETURN_CONDITION_STRATEGY: Record<
  ResourceCondition,
  { nuevoEstado: ResourceStatus }
> = {
  Bueno: { nuevoEstado: 'Disponible' },
  Regular: { nuevoEstado: 'Disponible' },
  Dañado: { nuevoEstado: 'En_Mantenimiento' },
}
