import { useCallback, useMemo, useReducer, type ReactNode } from 'react'
import {
  LoansContext,
  ResourcesContext,
  UsersContext,
  type LoansContextValue,
  type ResourcesContextValue,
  type UsersContextValue,
} from '@/contexts/AppDataContext'
import { LS_KEYS } from '@/shared/constants/lsKeys'
import * as loansService from '@/services/mockDb/loans.service'
import * as resourcesService from '@/services/mockDb/resources.service'
import { ensureSeeded } from '@/services/mockDb/seed-data'
import * as usersService from '@/services/mockDb/users.service'
import {
  localStorageRepository,
  type StorageRepository,
} from '@/services/storage'
import type { Loan, OperationResult, Resource, User } from '@/shared/types'

interface AppDataState {
  resources: Resource[]
  loans: Loan[]
  users: User[]
  /** Mensaje si el almacenamiento no está disponible; bloquea la app. */
  storageError: string | null
}

type AppDataAction =
  | { type: 'LOAD'; payload: Pick<AppDataState, 'resources' | 'loans' | 'users'> }
  | { type: 'STORAGE_ERROR'; message: string }

const EMPTY_STATE: AppDataState = {
  resources: [],
  loans: [],
  users: [],
  storageError: null,
}

const STORAGE_ERROR_MESSAGE =
  'No se pudo acceder al almacenamiento del navegador. Revisa que no esté bloqueado o lleno e intenta de nuevo.'

/** Lee del almacenamiento todos los datos de dominio. */
function loadSnapshot(
  repo: StorageRepository,
): Pick<AppDataState, 'resources' | 'loans' | 'users'> {
  const resources = (repo.get<Resource[]>(LS_KEYS.RESOURCES) ?? [])
    .slice()
    .sort((a, b) => a.nombre.localeCompare(b.nombre, 'es'))
  return {
    resources,
    loans: repo.get<Loan[]>(LS_KEYS.LOANS) ?? [],
    users: repo.get<User[]>(LS_KEYS.USERS) ?? [],
  }
}

/** Estado inicial: siembra en el primer arranque y carga el snapshot. */
function initState(repo: StorageRepository): AppDataState {
  try {
    ensureSeeded(repo)
    return { ...loadSnapshot(repo), storageError: null }
  } catch {
    return { ...EMPTY_STATE, storageError: STORAGE_ERROR_MESSAGE }
  }
}

/** Conserva la referencia previa si el contenido no cambió (evita re-renders). */
function reuseIfEqual<T>(previous: T[], next: T[]): T[] {
  return JSON.stringify(previous) === JSON.stringify(next) ? previous : next
}

function appDataReducer(
  state: AppDataState,
  action: AppDataAction,
): AppDataState {
  switch (action.type) {
    case 'LOAD':
      return {
        resources: reuseIfEqual(state.resources, action.payload.resources),
        loans: reuseIfEqual(state.loans, action.payload.loans),
        users: reuseIfEqual(state.users, action.payload.users),
        storageError: null,
      }
    case 'STORAGE_ERROR':
      return { ...state, storageError: action.message }
  }
}

interface AppDataProviderProps {
  children: ReactNode
  /** Puerto de persistencia (SOLID M2). Por defecto, `localStorage`. */
  repository?: StorageRepository
}

/**
 * Provee los datos de dominio por contextos separados (M4). Los servicios son
 * los únicos que escriben en el almacenamiento; tras cada operación exitosa el
 * provider vuelve a leer el estado desde el repositorio.
 */
export function AppDataProvider({
  children,
  repository = localStorageRepository,
}: AppDataProviderProps) {
  const [state, dispatch] = useReducer(appDataReducer, repository, initState)

  const refresh = useCallback(() => {
    try {
      dispatch({ type: 'LOAD', payload: loadSnapshot(repository) })
    } catch {
      dispatch({ type: 'STORAGE_ERROR', message: STORAGE_ERROR_MESSAGE })
    }
  }, [repository])

  /**
   * Ejecuta una operación de servicio. Si el almacenamiento falla (cuota,
   * modo privado) devuelve un `OperationResult` de error en lugar de lanzar,
   * y si la operación fue exitosa refresca el estado.
   */
  const run = useCallback(
    <T,>(operation: () => OperationResult<T>): OperationResult<T> => {
      try {
        const result = operation()
        if (result.success) refresh()
        return result
      } catch (error) {
        return {
          success: false,
          error:
            error instanceof Error ? error.message : STORAGE_ERROR_MESSAGE,
        }
      }
    },
    [refresh],
  )

  const resourcesValue = useMemo<ResourcesContextValue>(
    () => ({
      resources: state.resources,
      createResource: (data) =>
        run(() => resourcesService.createResource(data, repository)),
      updateResource: (id, data) =>
        run(() => resourcesService.updateResource(id, data, repository)),
      updateResourceStatus: (id, newStatus, motivo) =>
        run(() =>
          resourcesService.updateResourceStatus(id, newStatus, motivo, repository),
        ),
      retireResource: (id) =>
        run(() => resourcesService.retireResource(id, repository)),
    }),
    [state.resources, run, repository],
  )

  // Las consultas leen el almacenamiento vigente. Dependen de `resources`
  // porque la disponibilidad cambia cuando cambia el stock.
  const loansValue = useMemo<LoansContextValue>(
    () => ({
      loans: state.loans,
      createLoan: (data, userId) =>
        run(() => loansService.createLoan(data, userId, repository)),
      registerDelivery: (loanId, data) =>
        run(() => loansService.registerDelivery(loanId, data, repository)),
      registerReturn: (loanId, data) =>
        run(() => loansService.registerReturn(loanId, data, repository)),
      getLoansByUser: (userId) => loansService.getLoansByUser(userId, repository),
      getPendingDeliveries: () => loansService.getPendingDeliveries(repository),
      getPendingReturns: () => loansService.getPendingReturns(repository),
      checkAvailability: (resourceId, start, end) =>
        loansService.checkAvailability(resourceId, start, end, repository),
      getAvailableResources: (start, end, filters) =>
        loansService.getAvailableResources(start, end, filters, repository),
    }),
    // `state.resources` fuerza una nueva identidad de las consultas cuando
    // cambia el stock, para que los consumidores recalculen.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [state.loans, state.resources, run, repository],
  )

  const usersValue = useMemo<UsersContextValue>(
    () => ({
      users: state.users,
      getUserById: (id) => usersService.getUserById(id, repository),
      updateUser: (id, data) =>
        run(() => usersService.updateUser(id, data, repository)),
    }),
    [state.users, run, repository],
  )

  if (state.storageError) {
    return (
      <div role="alert">
        <h1>Error de almacenamiento</h1>
        <p>{state.storageError}</p>
      </div>
    )
  }

  return (
    <ResourcesContext.Provider value={resourcesValue}>
      <LoansContext.Provider value={loansValue}>
        <UsersContext.Provider value={usersValue}>
          {children}
        </UsersContext.Provider>
      </LoansContext.Provider>
    </ResourcesContext.Provider>
  )
}
