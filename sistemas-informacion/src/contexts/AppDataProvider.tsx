import {
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useReducer,
  type ReactNode,
} from 'react'
import { AuthContext } from '@/contexts/AuthContext'
import {
  LoansContext,
  ResourcesContext,
  UsersContext,
  type LoansContextValue,
  type ResourcesContextValue,
  type UsersContextValue,
} from '@/contexts/AppDataContext'
import { apiErrorMessage } from '@/services/api/errors'
import * as apiLoans from '@/services/api/loans.service'
import * as apiResources from '@/services/api/resources.service'
import * as apiUsers from '@/services/api/users.service'
import * as loansService from '@/services/mockDb/loans.service'
import * as resourcesService from '@/services/mockDb/resources.service'
import { ensureSeeded } from '@/services/mockDb/seed-data'
import * as usersService from '@/services/mockDb/users.service'
import {
  localStorageRepository,
  type StorageRepository,
} from '@/services/storage'
import { LS_KEYS } from '@/shared/constants/lsKeys'
import type {
  Loan,
  OperationResult,
  Resource,
  ResourceAvailability,
  User,
} from '@/shared/types'
import { intervalsOverlap } from '@/shared/utils/dateUtils'
import { isResourceBookable } from '@/shared/utils/resourceRules'

interface AppDataState {
  resources: Resource[]
  loans: Loan[]
  users: User[]
  /** Error de carga o almacenamiento; bloquea la app. */
  dataError: string | null
  isLoading: boolean
}

type AppDataAction =
  | { type: 'LOAD'; payload: Pick<AppDataState, 'resources' | 'loans' | 'users'> }
  | { type: 'LOADING' }
  | { type: 'ERROR'; message: string }
  | { type: 'CLEAR' }

const EMPTY_STATE: AppDataState = {
  resources: [],
  loans: [],
  users: [],
  dataError: null,
  isLoading: false,
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

/** Estado inicial: en modo mock siembra y carga; en modo API espera la red. */
function initState(repository?: StorageRepository): AppDataState {
  if (!repository) return { ...EMPTY_STATE, isLoading: true }
  try {
    ensureSeeded(repository)
    return {
      ...loadSnapshot(repository),
      dataError: null,
      isLoading: false,
    }
  } catch {
    return { ...EMPTY_STATE, dataError: STORAGE_ERROR_MESSAGE }
  }
}

/** Conserva la referencia previa si el contenido no cambió (evita re-renders). */
function reuseIfEqual<T>(previous: T[], next: T[]): T[] {
  return JSON.stringify(previous) === JSON.stringify(next) ? previous : next
}

function appDataReducer(state: AppDataState, action: AppDataAction): AppDataState {
  switch (action.type) {
    case 'LOAD':
      return {
        resources: reuseIfEqual(state.resources, action.payload.resources),
        loans: reuseIfEqual(state.loans, action.payload.loans),
        users: reuseIfEqual(state.users, action.payload.users),
        dataError: null,
        isLoading: false,
      }
    case 'LOADING':
      return { ...state, isLoading: true, dataError: null }
    case 'ERROR':
      return { ...state, dataError: action.message, isLoading: false }
    case 'CLEAR':
      return EMPTY_STATE
  }
}

function selectLoansByUser(loans: Loan[], userId: string): Loan[] {
  return loans
    .filter((loan) => loan.idUsuario === userId)
    .sort(
      (a, b) =>
        new Date(b.fechaHoraInicioProgramada).getTime() -
        new Date(a.fechaHoraInicioProgramada).getTime(),
    )
}

function selectPendingDeliveries(loans: Loan[]): Loan[] {
  const now = Date.now()
  return loans
    .filter(
      (loan) =>
        loan.estadoPrestamo === 'Reservado' &&
        new Date(loan.fechaHoraInicioProgramada).getTime() <= now,
    )
    .sort(
      (a, b) =>
        new Date(a.fechaHoraInicioProgramada).getTime() -
        new Date(b.fechaHoraInicioProgramada).getTime(),
    )
}

function selectPendingReturns(loans: Loan[]): Loan[] {
  return loans
    .filter((loan) => loan.estadoPrestamo === 'En_Préstamo')
    .sort(
      (a, b) =>
        new Date(a.fechaHoraFinProgramada).getTime() -
        new Date(b.fechaHoraFinProgramada).getTime(),
    )
}

function computeAvailability(
  resources: Resource[],
  loans: Loan[],
  resourceId: string,
  start: string,
  end: string,
): ResourceAvailability {
  const resource = resources.find((r) => r.idRecurso === resourceId)
  if (!resource) {
    return { disponible: false, cantidadDisponible: 0, reservasActivas: 0 }
  }
  const active = loans.filter(
    (loan) =>
      loan.idRecurso === resourceId &&
      (loan.estadoPrestamo === 'Reservado' ||
        loan.estadoPrestamo === 'En_Préstamo') &&
      intervalsOverlap(
        loan.fechaHoraInicioProgramada,
        loan.fechaHoraFinProgramada,
        start,
        end,
      ),
  )
  const futureEnds = loans
    .filter(
      (loan) =>
        loan.idRecurso === resourceId &&
        (loan.estadoPrestamo === 'Reservado' ||
          loan.estadoPrestamo === 'En_Préstamo') &&
        new Date(loan.fechaHoraFinProgramada).getTime() > Date.now(),
    )
    .map((loan) => loan.fechaHoraFinProgramada)
    .sort((a, b) => new Date(a).getTime() - new Date(b).getTime())
  return {
    disponible:
      isResourceBookable(resource) && active.length < resource.cantidadTotal,
    cantidadDisponible: resource.cantidadDisponible,
    reservasActivas: active.length,
    proximaDisponibilidad: isResourceBookable(resource)
      ? new Date().toISOString()
      : futureEnds[0],
  }
}

interface AppDataProviderProps {
  children: ReactNode
  /**
   * Puerto de persistencia (SOLID M2). Si se omite, el provider usa la API
   * HTTP; si se inyecta, usa los servicios mock (tests y demo local).
   */
  repository?: StorageRepository
}

/**
 * Provee los datos de dominio por contextos separados (M4). En modo API carga
 * recursos, préstamos y usuarios al iniciar sesión; en modo mock lee del
 * repositorio inyectado.
 */
export function AppDataProvider({ children, repository }: AppDataProviderProps) {
  const auth = useContext(AuthContext)
  const session = auth?.session ?? null
  const isApi = repository === undefined
  const mockRepo = repository ?? localStorageRepository

  const [state, dispatch] = useReducer(appDataReducer, repository, initState)

  const refresh = useCallback(() => {
    try {
      dispatch({ type: 'LOAD', payload: loadSnapshot(mockRepo) })
    } catch {
      dispatch({ type: 'ERROR', message: STORAGE_ERROR_MESSAGE })
    }
  }, [mockRepo])

  const refreshApi = useCallback(async () => {
    const [resources, loans] = await Promise.all([
      apiResources.listResources(),
      apiLoans.listLoans(),
    ])
    const users =
      session && session.role !== 'Estudiante' ? await apiUsers.listUsers() : []
    dispatch({
      type: 'LOAD',
      payload: { resources, loans, users },
    })
  }, [session])

  useEffect(() => {
    if (!isApi) return
    if (!session) {
      dispatch({ type: 'CLEAR' })
      return
    }
    let active = true
    dispatch({ type: 'LOADING' })
    refreshApi().catch((error: unknown) => {
      if (active) {
        dispatch({ type: 'ERROR', message: apiErrorMessage(error) })
      }
    })
    return () => {
      active = false
    }
  }, [isApi, session, refreshApi])

  const run = useCallback(
    <T,>(operation: () => OperationResult<T>): OperationResult<T> => {
      try {
        const result = operation()
        if (result.success) refresh()
        return result
      } catch (error) {
        return {
          success: false,
          error: error instanceof Error ? error.message : STORAGE_ERROR_MESSAGE,
        }
      }
    },
    [refresh],
  )

  const runApi = useCallback(
    async <T,>(operation: () => Promise<T>): Promise<OperationResult<T>> => {
      try {
        const data = await operation()
        await refreshApi()
        return { success: true, data }
      } catch (error) {
        return { success: false, error: apiErrorMessage(error) }
      }
    },
    [refreshApi],
  )

  const resourcesValue = useMemo<ResourcesContextValue>(
    () => ({
      resources: state.resources,
      createResource: (data) =>
        isApi
          ? runApi(() => apiResources.createResource(data))
          : run(() => resourcesService.createResource(data, mockRepo)),
      updateResource: (id, data) =>
        isApi
          ? runApi(() => apiResources.updateResource(id, data))
          : run(() => resourcesService.updateResource(id, data, mockRepo)),
      updateResourceStatus: (id, newStatus, motivo) =>
        isApi
          ? runApi(async () => {
              await apiResources.updateResourceStatus(id, newStatus, motivo)
            })
          : run(() =>
              resourcesService.updateResourceStatus(id, newStatus, motivo, mockRepo),
            ),
      retireResource: (id) =>
        isApi
          ? runApi(async () => {
              await apiResources.retireResource(id)
            })
          : run(() => resourcesService.retireResource(id, mockRepo)),
    }),
    [state.resources, isApi, run, runApi, mockRepo],
  )

  const loansValue = useMemo<LoansContextValue>(
    () => ({
      loans: state.loans,
      createLoan: (data, userId) =>
        isApi
          ? runApi(() => apiLoans.createLoan(data))
          : run(() => loansService.createLoan(data, userId, mockRepo)),
      registerDelivery: (loanId, data) =>
        isApi
          ? runApi(() => apiLoans.registerDelivery(loanId, data))
          : run(() => loansService.registerDelivery(loanId, data, mockRepo)),
      registerReturn: (loanId, data) =>
        isApi
          ? runApi(() => apiLoans.registerReturn(loanId, data))
          : run(() => loansService.registerReturn(loanId, data, mockRepo)),
      getLoansByUser: (userId) => selectLoansByUser(state.loans, userId),
      getPendingDeliveries: () => selectPendingDeliveries(state.loans),
      getPendingReturns: () => selectPendingReturns(state.loans),
      checkAvailability: (resourceId, start, end) =>
        isApi
          ? apiResources.checkAvailability(resourceId, start, end).catch(() => false)
          : loansService.checkAvailability(resourceId, start, end, mockRepo),
      getAvailableResources: (start, end, filters) =>
        isApi
          ? apiResources.getAvailableResources(start, end, filters)
          : loansService.getAvailableResources(start, end, filters, mockRepo),
      getResourceAvailability: (resourceId, start, end) =>
        isApi
          ? apiResources.getResourceAvailability(resourceId, start, end)
          : computeAvailability(state.resources, state.loans, resourceId, start, end),
    }),
    [state.loans, state.resources, isApi, run, runApi, mockRepo],
  )

  const usersValue = useMemo<UsersContextValue>(
    () => ({
      users: state.users,
      getUserById: (id) => state.users.find((user) => user.idUsuario === id),
      updateUser: (id, data) =>
        isApi
          ? runApi(() => apiUsers.updateUser(id, data))
          : run(() => usersService.updateUser(id, data, mockRepo)),
    }),
    [state.users, isApi, run, runApi, mockRepo],
  )

  if (state.dataError) {
    return (
      <div role="alert">
        <h1>No se pudieron cargar los datos</h1>
        <p>{state.dataError}</p>
      </div>
    )
  }

  if (state.isLoading && state.resources.length === 0 && state.loans.length === 0) {
    return (
      <div role="status">
        <p>Cargando datos...</p>
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
