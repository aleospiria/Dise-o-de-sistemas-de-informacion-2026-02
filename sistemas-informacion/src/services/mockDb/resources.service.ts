/**
 * Servicio de recursos (mock).
 *
 * SOLID M1 (SRP): CRUD y lógica de transición separados; validación delegada.
 * SOLID M2 (DIP): depende de `StorageRepository`.
 * SOLID M3 (OCP): usa `isValidTransition` de la máquina de estados declarativa.
 * SOLID M8 (LSP): retorna `OperationResult`; nunca lanza.
 */
import { LS_KEYS } from '@/shared/constants/lsKeys'
import { isValidTransition } from '@/shared/constants/resourceStateMachine'
import {
  localStorageRepository,
  type StorageRepository,
} from '@/services/storage'
import type {
  CreateResourceData,
  Loan,
  OperationResult,
  Resource,
  ResourceFilters,
  ResourceStatus,
  ResourceStatusHistory,
} from '@/shared/types'
import { validateQuantity, validateResourceName } from '@/shared/utils/validators'
import { generateUUID } from '@/shared/utils/uuidUtils'

function readResources(repo: StorageRepository): Resource[] {
  return repo.get<Resource[]>(LS_KEYS.RESOURCES) ?? []
}

function writeResources(repo: StorageRepository, resources: Resource[]): void {
  repo.set(LS_KEYS.RESOURCES, resources)
}

function appendStatusHistory(
  repo: StorageRepository,
  entry: ResourceStatusHistory,
): void {
  const history =
    repo.get<ResourceStatusHistory[]>(LS_KEYS.STATUS_HISTORY) ?? []
  repo.set(LS_KEYS.STATUS_HISTORY, [...history, entry])
}

/** Lista recursos aplicando filtros opcionales; excluye los dados de baja. */
export function getResources(
  filters?: ResourceFilters,
  repo: StorageRepository = localStorageRepository,
): Resource[] {
  let resources = readResources(repo).filter(
    (r) => r.estadoActual !== 'Dado_de_Baja',
  )
  if (filters?.nombre) {
    const q = filters.nombre.toLowerCase()
    resources = resources.filter((r) => r.nombre.toLowerCase().includes(q))
  }
  if (filters?.tipo) {
    resources = resources.filter((r) => r.tipo === filters.tipo)
  }
  if (filters?.estado) {
    resources = resources.filter((r) => r.estadoActual === filters.estado)
  }
  return resources.sort((a, b) => a.nombre.localeCompare(b.nombre, 'es'))
}

export function getResourceById(
  id: string,
  repo: StorageRepository = localStorageRepository,
): Resource | undefined {
  return readResources(repo).find((r) => r.idRecurso === id)
}

/** Crea un recurso nuevo con estado inicial "Disponible". */
export function createResource(
  data: CreateResourceData,
  repo: StorageRepository = localStorageRepository,
): OperationResult<Resource> {
  if (!validateResourceName(data.nombre)) {
    return {
      success: false,
      error: 'El nombre es obligatorio y no debe superar 100 caracteres.',
    }
  }
  if (!validateQuantity(data.cantidadTotal)) {
    return {
      success: false,
      error: 'La cantidad debe ser un número entero mayor que 0.',
    }
  }

  const nuevo: Resource = {
    idRecurso: generateUUID(),
    nombre: data.nombre.trim(),
    codigoInventario: data.codigoInventario.trim(),
    tipo: data.tipo,
    descripcion: data.descripcion.trim(),
    imagenUrl: data.imagenUrl,
    cantidadTotal: data.cantidadTotal,
    cantidadDisponible: data.cantidadTotal,
    estadoActual: 'Disponible',
    fechaCreacion: new Date().toISOString(),
  }
  writeResources(repo, [...readResources(repo), nuevo])
  return { success: true, data: nuevo }
}

/**
 * Alinea el estado con el stock tras cambiar la cantidad: sin unidades libres
 * el recurso no se puede reservar, y con unidades libres sí.
 */
function reconcileStockState(resource: Resource, repo: StorageRepository): void {
  const { idRecurso, estadoActual, cantidadDisponible } = resource
  if (
    cantidadDisponible > 0 &&
    (estadoActual === 'Reservado' || estadoActual === 'En_Préstamo')
  ) {
    updateResourceStatus(idRecurso, 'Disponible', 'Se agregaron unidades.', repo)
  } else if (cantidadDisponible === 0 && estadoActual === 'Disponible') {
    updateResourceStatus(idRecurso, 'Reservado', 'Sin unidades libres.', repo)
  }
}

/**
 * Actualiza los datos editables de un recurso. Si cambia la cantidad total, las
 * unidades en uso se conservan y el stock libre sigue al nuevo total; no se
 * puede bajar el total por debajo de las unidades en uso.
 */
export function updateResource(
  id: string,
  data: Partial<CreateResourceData>,
  repo: StorageRepository = localStorageRepository,
): OperationResult<Resource> {
  const resources = readResources(repo)
  const idx = resources.findIndex((r) => r.idRecurso === id)
  if (idx === -1) {
    return { success: false, error: 'Recurso no encontrado.' }
  }
  if (data.nombre !== undefined && !validateResourceName(data.nombre)) {
    return {
      success: false,
      error: 'El nombre es obligatorio y no debe superar 100 caracteres.',
    }
  }
  if (data.cantidadTotal !== undefined && !validateQuantity(data.cantidadTotal)) {
    return {
      success: false,
      error: 'La cantidad debe ser un número entero mayor que 0.',
    }
  }

  const actual = resources[idx]
  if (actual.estadoActual === 'Dado_de_Baja') {
    return { success: false, error: 'Un recurso dado de baja no se puede editar.' }
  }

  const enUso = actual.cantidadTotal - actual.cantidadDisponible
  const cantidadTotal = data.cantidadTotal ?? actual.cantidadTotal
  if (cantidadTotal < enUso) {
    return {
      success: false,
      error: `No puedes reducir la cantidad a ${cantidadTotal}: hay ${enUso} unidades en uso.`,
    }
  }

  const actualizado: Resource = {
    ...actual,
    ...data,
    nombre: data.nombre?.trim() ?? actual.nombre,
    descripcion: data.descripcion?.trim() ?? actual.descripcion,
    cantidadTotal,
    cantidadDisponible: cantidadTotal - enUso,
  }
  resources[idx] = actualizado
  writeResources(repo, resources)
  reconcileStockState(actualizado, repo)
  return { success: true, data: getResourceById(id, repo) ?? actualizado }
}

/**
 * Cambia el estado de un recurso validando la transición (M3) y registrando
 * el cambio en el historial.
 */
export function updateResourceStatus(
  id: string,
  newStatus: ResourceStatus,
  motivo: string | undefined,
  repo: StorageRepository = localStorageRepository,
): OperationResult<void> {
  const resources = readResources(repo)
  const idx = resources.findIndex((r) => r.idRecurso === id)
  if (idx === -1) {
    return { success: false, error: 'Recurso no encontrado.' }
  }

  const actual = resources[idx]
  if (!isValidTransition(actual.estadoActual, newStatus)) {
    return {
      success: false,
      error: `Transición de estado inválida: ${actual.estadoActual} → ${newStatus}.`,
    }
  }

  resources[idx] = { ...actual, estadoActual: newStatus }
  writeResources(repo, resources)
  appendStatusHistory(repo, {
    idEstado: generateUUID(),
    idRecurso: id,
    estado: newStatus,
    fechaCambio: new Date().toISOString(),
    motivo,
  })
  return { success: true }
}

/**
 * Ajusta `cantidadDisponible` en `delta` unidades, acotando el resultado al
 * rango [0, cantidadTotal]. Lo usa `loans.service` al reservar y devolver.
 */
export function adjustAvailableQuantity(
  id: string,
  delta: number,
  repo: StorageRepository = localStorageRepository,
): OperationResult<Resource> {
  const resources = readResources(repo)
  const idx = resources.findIndex((r) => r.idRecurso === id)
  if (idx === -1) {
    return { success: false, error: 'Recurso no encontrado.' }
  }
  const actual = resources[idx]
  const nueva = Math.min(
    actual.cantidadTotal,
    Math.max(0, actual.cantidadDisponible + delta),
  )
  const actualizado: Resource = { ...actual, cantidadDisponible: nueva }
  resources[idx] = actualizado
  writeResources(repo, resources)
  return { success: true, data: actualizado }
}

/**
 * Da de baja un recurso. Rechaza si tiene préstamos activos
 * (Reservado o En_Préstamo). (Req 4.10)
 */
export function retireResource(
  id: string,
  repo: StorageRepository = localStorageRepository,
): OperationResult<void> {
  const loans = repo.get<Loan[]>(LS_KEYS.LOANS) ?? []
  const tieneActivos = loans.some(
    (l) =>
      l.idRecurso === id &&
      (l.estadoPrestamo === 'Reservado' || l.estadoPrestamo === 'En_Préstamo'),
  )
  if (tieneActivos) {
    return {
      success: false,
      error: 'No se puede dar de baja: el recurso tiene préstamos activos.',
    }
  }
  return updateResourceStatus(id, 'Dado_de_Baja', 'Dado de baja por administrador.', repo)
}
