/**
 * Servicio de préstamos (mock).
 *
 * SOLID M1 (SRP): el servicio ORQUESTA; la validación es pura
 *   (`validators`/`dateUtils`) y la persistencia pasa por el repositorio.
 * SOLID M2 (DIP): depende de `StorageRepository`.
 * SOLID M5 (OCP): el estado del recurso tras una devolución sale de
 *   `RETURN_CONDITION_STRATEGY`, no de un `if (Dañado)`.
 * SOLID M8 (LSP): toda función retorna `OperationResult`; nunca lanza.
 *
 * Modelo de disponibilidad: `cantidadDisponible` es un contador de unidades
 * sin reservar; además se verifica que los préstamos activos solapados en el
 * horario pedido no agoten `cantidadTotal`. El recurso pasa a "Reservado"
 * solo cuando se agota el contador, para no ocultar unidades aún libres.
 */
import { LS_KEYS } from '@/shared/constants/lsKeys'
import { RETURN_CONDITION_STRATEGY } from '@/shared/constants/resourceStateMachine'
import {
  adjustAvailableQuantity,
  getResourceById,
  getResources,
  updateResourceStatus,
} from '@/services/mockDb/resources.service'
import {
  localStorageRepository,
  type StorageRepository,
} from '@/services/storage'
import type {
  DeliveryData,
  Loan,
  LoanFormData,
  OperationResult,
  Resource,
  ResourceFilters,
  ReturnData,
} from '@/shared/types'
import { calculateDelayHours, intervalsOverlap } from '@/shared/utils/dateUtils'
import { generateUUID } from '@/shared/utils/uuidUtils'
import {
  validateLoanTimes,
  validateMotivo,
  validateObservaciones,
} from '@/shared/utils/validators'

function readLoans(repo: StorageRepository): Loan[] {
  return repo.get<Loan[]>(LS_KEYS.LOANS) ?? []
}

function writeLoans(repo: StorageRepository, loans: Loan[]): void {
  repo.set(LS_KEYS.LOANS, loans)
}

function isActive(loan: Loan): boolean {
  return loan.estadoPrestamo === 'Reservado' || loan.estadoPrestamo === 'En_Préstamo'
}

/** Cuenta préstamos activos del recurso que se solapan con [start, end]. */
function countOverlapping(
  loans: Loan[],
  resourceId: string,
  start: string,
  end: string,
): number {
  return loans.filter(
    (l) =>
      l.idRecurso === resourceId &&
      isActive(l) &&
      intervalsOverlap(l.fechaHoraInicioProgramada, l.fechaHoraFinProgramada, start, end),
  ).length
}

function isResourceBookable(resource: Resource): boolean {
  return resource.estadoActual === 'Disponible' && resource.cantidadDisponible > 0
}

/**
 * Indica si el recurso puede reservarse en [start, end]: está disponible,
 * le quedan unidades y los préstamos solapados no agotan `cantidadTotal`.
 */
export function checkAvailability(
  resourceId: string,
  start: string,
  end: string,
  repo: StorageRepository = localStorageRepository,
): boolean {
  const resource = getResourceById(resourceId, repo)
  if (!resource || !isResourceBookable(resource)) return false
  const overlapping = countOverlapping(readLoans(repo), resourceId, start, end)
  return overlapping < resource.cantidadTotal
}

/** Recursos reservables en [start, end], con filtros opcionales (Req 6.8). */
export function getAvailableResources(
  start: string,
  end: string,
  filters?: ResourceFilters,
  repo: StorageRepository = localStorageRepository,
): Resource[] {
  const loans = readLoans(repo)
  return getResources(filters, repo).filter(
    (r) =>
      isResourceBookable(r) &&
      countOverlapping(loans, r.idRecurso, start, end) < r.cantidadTotal,
  )
}

/** Crea una reserva en estado "Reservado" (Req 8.2–8.9). */
export function createLoan(
  data: LoanFormData,
  userId: string,
  repo: StorageRepository = localStorageRepository,
): OperationResult<Loan> {
  const times = validateLoanTimes(
    data.fechaHoraInicioProgramada,
    data.fechaHoraFinProgramada,
  )
  if (!times.valid) {
    return { success: false, error: times.error }
  }
  if (!validateMotivo(data.motivoPrestamo)) {
    return {
      success: false,
      error: 'El motivo del préstamo debe tener entre 10 y 500 caracteres.',
    }
  }

  const resource = getResourceById(data.idRecurso, repo)
  if (!resource) {
    return { success: false, error: 'Recurso no encontrado.' }
  }
  if (
    !checkAvailability(
      data.idRecurso,
      data.fechaHoraInicioProgramada,
      data.fechaHoraFinProgramada,
      repo,
    )
  ) {
    return {
      success: false,
      error: 'El recurso no está disponible en el horario seleccionado.',
    }
  }

  const loan: Loan = {
    idPrestamo: generateUUID(),
    idUsuario: userId,
    idRecurso: data.idRecurso,
    fechaHoraReserva: new Date().toISOString(),
    fechaHoraInicioProgramada: data.fechaHoraInicioProgramada,
    fechaHoraFinProgramada: data.fechaHoraFinProgramada,
    estadoPrestamo: 'Reservado',
    motivoPrestamo: data.motivoPrestamo.trim(),
  }
  writeLoans(repo, [...readLoans(repo), loan])

  const adjusted = adjustAvailableQuantity(data.idRecurso, -1, repo)
  if (
    adjusted.data &&
    adjusted.data.cantidadDisponible === 0 &&
    adjusted.data.estadoActual === 'Disponible'
  ) {
    updateResourceStatus(data.idRecurso, 'Reservado', 'Stock agotado por reservas.', repo)
  }
  return { success: true, data: loan }
}

/** Préstamos de un usuario, del más reciente al más antiguo. */
export function getLoansByUser(
  userId: string,
  repo: StorageRepository = localStorageRepository,
): Loan[] {
  return readLoans(repo)
    .filter((l) => l.idUsuario === userId)
    .sort(
      (a, b) =>
        new Date(b.fechaHoraInicioProgramada).getTime() -
        new Date(a.fechaHoraInicioProgramada).getTime(),
    )
}

/** Reservas cuya hora de inicio ya llegó, la más antigua primero (Req 12.1, 12.2). */
export function getPendingDeliveries(
  repo: StorageRepository = localStorageRepository,
): Loan[] {
  const now = Date.now()
  return readLoans(repo)
    .filter(
      (l) =>
        l.estadoPrestamo === 'Reservado' &&
        new Date(l.fechaHoraInicioProgramada).getTime() <= now,
    )
    .sort(
      (a, b) =>
        new Date(a.fechaHoraInicioProgramada).getTime() -
        new Date(b.fechaHoraInicioProgramada).getTime(),
    )
}

/** Préstamos en curso, por hora de fin más antigua primero (Req 13.1, 13.2). */
export function getPendingReturns(
  repo: StorageRepository = localStorageRepository,
): Loan[] {
  return readLoans(repo)
    .filter((l) => l.estadoPrestamo === 'En_Préstamo')
    .sort(
      (a, b) =>
        new Date(a.fechaHoraFinProgramada).getTime() -
        new Date(b.fechaHoraFinProgramada).getTime(),
    )
}

function updateLoan(
  repo: StorageRepository,
  loanId: string,
  patch: Partial<Loan>,
): Loan {
  const loans = readLoans(repo)
  const idx = loans.findIndex((l) => l.idPrestamo === loanId)
  const updated = { ...loans[idx], ...patch }
  loans[idx] = updated
  writeLoans(repo, loans)
  return updated
}

/** Registra la entrega física: Reservado → En_Préstamo (Req 12.4–12.8). */
export function registerDelivery(
  loanId: string,
  data: DeliveryData,
  repo: StorageRepository = localStorageRepository,
): OperationResult<Loan> {
  const loan = readLoans(repo).find((l) => l.idPrestamo === loanId)
  if (!loan) return { success: false, error: 'Préstamo no encontrado.' }
  if (loan.estadoPrestamo !== 'Reservado') {
    return { success: false, error: 'Solo se pueden entregar préstamos reservados.' }
  }

  const observaciones = data.observaciones?.trim() ?? ''
  if (!validateObservaciones(observaciones)) {
    return { success: false, error: 'Las observaciones no pueden superar 500 caracteres.' }
  }
  if (data.condicion === 'Dañado' && observaciones.length === 0) {
    return {
      success: false,
      error: 'Las observaciones son obligatorias si el recurso está dañado.',
    }
  }

  const updated = updateLoan(repo, loanId, {
    estadoPrestamo: 'En_Préstamo',
    fechaHoraEntrega: new Date().toISOString(),
    condicionEntrega: data.condicion,
    observacionesEntrega: observaciones || undefined,
  })

  // Con stock agotado el recurso está "Reservado"; pasa a "En_Préstamo" cuando
  // ya no quedan otras reservas pendientes de entrega.
  const resource = getResourceById(loan.idRecurso, repo)
  const otrasPendientes = readLoans(repo).some(
    (l) =>
      l.idRecurso === loan.idRecurso &&
      l.idPrestamo !== loanId &&
      l.estadoPrestamo === 'Reservado',
  )
  if (resource?.estadoActual === 'Reservado' && !otrasPendientes) {
    updateResourceStatus(loan.idRecurso, 'En_Préstamo', 'Entrega registrada.', repo)
  }
  return { success: true, data: updated }
}

/**
 * Registra la devolución: calcula el retraso, libera la unidad y fija el
 * estado del recurso según la estrategia por condición (Req 13.5–13.11).
 */
export function registerReturn(
  loanId: string,
  data: ReturnData,
  repo: StorageRepository = localStorageRepository,
): OperationResult<Loan> {
  const loan = readLoans(repo).find((l) => l.idPrestamo === loanId)
  if (!loan) return { success: false, error: 'Préstamo no encontrado.' }
  if (loan.estadoPrestamo !== 'En_Préstamo') {
    return { success: false, error: 'Solo se pueden devolver préstamos en curso.' }
  }

  const observaciones = data.observaciones?.trim() ?? ''
  if (!validateObservaciones(observaciones)) {
    return { success: false, error: 'Las observaciones no pueden superar 500 caracteres.' }
  }

  const now = new Date().toISOString()
  const updated = updateLoan(repo, loanId, {
    estadoPrestamo: 'Devuelto',
    fechaHoraDevolucionReal: now,
    condicionDevolucion: data.condicion,
    observacionesDevolucion: observaciones || undefined,
    retrasoHoras: calculateDelayHours(now, loan.fechaHoraFinProgramada),
  })

  adjustAvailableQuantity(loan.idRecurso, 1, repo)

  // Estado resultante según la estrategia (M5). Un recurso ya en
  // mantenimiento o dado de baja no se modifica por una devolución.
  const resource = getResourceById(loan.idRecurso, repo)
  if (
    resource &&
    resource.estadoActual !== 'En_Mantenimiento' &&
    resource.estadoActual !== 'Dado_de_Baja'
  ) {
    const { nuevoEstado } = RETURN_CONDITION_STRATEGY[data.condicion]
    if (nuevoEstado !== resource.estadoActual) {
      updateResourceStatus(loan.idRecurso, nuevoEstado, 'Devolución registrada.', repo)
    }
  }
  return { success: true, data: updated }
}
