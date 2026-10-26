/**
 * Resúmenes del panel de inicio. Funciones puras: reciben los datos ya leídos
 * y devuelven los contadores, sin depender de React ni del almacenamiento.
 */
import type { Loan, Resource } from '@/shared/types'
import { isResourceBookable } from '@/shared/utils/resourceRules'

export interface InventorySummary {
  /** Recursos en servicio: todos los que no están dados de baja. */
  total: number
  /** Recursos que se pueden reservar ahora (estado Disponible y con unidades libres). */
  available: number
  inMaintenance: number
  retired: number
}

export function summarizeInventory(resources: Resource[]): InventorySummary {
  const inService = resources.filter((r) => r.estadoActual !== 'Dado_de_Baja')
  return {
    total: inService.length,
    available: inService.filter(isResourceBookable).length,
    inMaintenance: inService.filter((r) => r.estadoActual === 'En_Mantenimiento').length,
    retired: resources.length - inService.length,
  }
}

export interface LoanSummary {
  reserved: number
  inProgress: number
  /** Reservados + en préstamo: los que todavía no se cierran. */
  active: number
}

export function summarizeLoans(loans: Loan[]): LoanSummary {
  const reserved = loans.filter((l) => l.estadoPrestamo === 'Reservado').length
  const inProgress = loans.filter((l) => l.estadoPrestamo === 'En_Préstamo').length
  return { reserved, inProgress, active: reserved + inProgress }
}

/** Préstamos aún abiertos (reservados o en curso), conservando el orden recibido. */
export function getActiveLoans(loans: Loan[]): Loan[] {
  return loans.filter(
    (l) => l.estadoPrestamo === 'Reservado' || l.estadoPrestamo === 'En_Préstamo',
  )
}
