/**
 * Reglas puras de la consulta de disponibilidad (Req 6). No dependen de React
 * ni del almacenamiento, por lo que se prueban directamente.
 */
import type { Loan, Resource, ResourceStatus, ResourceType } from '@/shared/types'
import { combineDateAndTime, isDateInPast } from '@/shared/utils/dateUtils'

/**
 * Estados que se listan en la consulta. Incluye los que no se pueden reservar
 * ahora ("Reservado", "En_Préstamo") para poder mostrarlos como "No
 * disponible" con su fecha de regreso (Req 6.10); excluye los que no volverán
 * pronto (mantenimiento y baja).
 */
export const LISTABLE_STATUSES: ResourceStatus[] = [
  'Disponible',
  'Reservado',
  'En_Préstamo',
]

export function isListable(resource: Resource): boolean {
  return LISTABLE_STATUSES.includes(resource.estadoActual)
}

/** Recursos cuyo nombre contiene el texto, sin distinguir mayúsculas (Req 6.4). */
export function filterByName(resources: Resource[], text: string): Resource[] {
  const query = text.trim().toLowerCase()
  if (!query) return resources
  return resources.filter((r) => r.nombre.toLowerCase().includes(query))
}

/** Recursos del tipo indicado; una cadena vacía significa "todos" (Req 6.6). */
export function filterByType(
  resources: Resource[],
  type: ResourceType | '',
): Resource[] {
  return type ? resources.filter((r) => r.tipo === type) : resources
}

/** Orden alfabético por nombre, el predeterminado (Req 6.11). No muta la entrada. */
export function sortByName(resources: Resource[]): Resource[] {
  return [...resources].sort((a, b) => a.nombre.localeCompare(b.nombre, 'es'))
}

export interface Reservation {
  start: string
  end: string
}

/**
 * Reservas y préstamos en curso de un recurso que aún no terminan, de la más
 * próxima a la más lejana (Req 6.9).
 */
export function getActiveReservations(
  loans: Loan[],
  resourceId: string,
  nowMs: number = Date.now(),
): Reservation[] {
  return loans
    .filter(
      (loan) =>
        loan.idRecurso === resourceId &&
        (loan.estadoPrestamo === 'Reservado' || loan.estadoPrestamo === 'En_Préstamo') &&
        new Date(loan.fechaHoraFinProgramada).getTime() > nowMs,
    )
    .map((loan) => ({
      start: loan.fechaHoraInicioProgramada,
      end: loan.fechaHoraFinProgramada,
    }))
    .sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime())
}

/**
 * Cuándo se libera la primera unidad: el fin más cercano entre las reservas
 * vigentes. `undefined` si no hay ninguna que lo indique (Req 6.10).
 */
export function getNextAvailableAt(reservations: Reservation[]): string | undefined {
  if (reservations.length === 0) return undefined
  return reservations.reduce((earliest, r) =>
    new Date(r.end).getTime() < new Date(earliest.end).getTime() ? r : earliest,
  ).end
}

/** Duración de la ventana al consultar por fecha y hora: una hora (mínimo de un préstamo). */
export const AVAILABILITY_WINDOW_MS = 60 * 60 * 1000

export type AvailabilityWindow =
  | { status: 'none' }
  | { status: 'incomplete' }
  | { status: 'past' }
  | { status: 'ok'; start: string; end: string }

/**
 * Interpreta los campos de fecha y hora del filtro (Req 6.7, 6.8). Sin ambos
 * no se filtra por horario; con uno solo, falta el otro; y no se consultan
 * momentos pasados.
 */
export function resolveAvailabilityWindow(date: string, time: string): AvailabilityWindow {
  if (!date && !time) return { status: 'none' }
  if (!date || !time) return { status: 'incomplete' }

  const start = combineDateAndTime(date, time)
  if (!start) return { status: 'incomplete' }
  if (isDateInPast(start)) return { status: 'past' }

  const end = new Date(new Date(start).getTime() + AVAILABILITY_WINDOW_MS).toISOString()
  return { status: 'ok', start, end }
}
