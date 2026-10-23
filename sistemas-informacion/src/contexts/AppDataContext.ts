/**
 * Contextos de datos de dominio (SOLID M4 — SRP + ISP).
 *
 * En lugar de un único contexto ancho, hay un contexto por dominio. Un
 * componente que solo consume recursos depende únicamente de
 * `ResourcesContext` y no se re-renderiza cuando cambian los préstamos.
 */
import { createContext } from 'react'
import type {
  CreateResourceData,
  DeliveryData,
  Loan,
  LoanFormData,
  OperationResult,
  Resource,
  ResourceFilters,
  ResourceStatus,
  ReturnData,
  User,
} from '@/shared/types'

export interface ResourcesContextValue {
  /**
   * Todos los recursos ordenados por nombre, incluidos los dados de baja
   * (el inventario del administrador los muestra, Req 4.6). Las consultas de
   * disponibilidad los excluyen (Req 4.9).
   */
  resources: Resource[]
  createResource: (data: CreateResourceData) => OperationResult<Resource>
  updateResource: (
    id: string,
    data: Partial<CreateResourceData>,
  ) => OperationResult<Resource>
  updateResourceStatus: (
    id: string,
    newStatus: ResourceStatus,
    motivo?: string,
  ) => OperationResult<void>
  retireResource: (id: string) => OperationResult<void>
}

export interface LoansContextValue {
  loans: Loan[]
  createLoan: (data: LoanFormData, userId: string) => OperationResult<Loan>
  registerDelivery: (
    loanId: string,
    data: DeliveryData,
  ) => OperationResult<Loan>
  registerReturn: (loanId: string, data: ReturnData) => OperationResult<Loan>
  getLoansByUser: (userId: string) => Loan[]
  getPendingDeliveries: () => Loan[]
  getPendingReturns: () => Loan[]
  /**
   * Consultas de disponibilidad. Leen el estado vigente del almacenamiento,
   * que también depende de los recursos: quien las use para mostrar datos
   * debe combinarlas con `useResources` para re-renderizar al cambiar stock.
   */
  checkAvailability: (resourceId: string, start: string, end: string) => boolean
  getAvailableResources: (
    start: string,
    end: string,
    filters?: ResourceFilters,
  ) => Resource[]
}

export interface UsersContextValue {
  users: User[]
  getUserById: (id: string) => User | undefined
  updateUser: (
    id: string,
    data: Partial<Omit<User, 'idUsuario' | 'fechaRegistro'>>,
  ) => OperationResult<User>
}

export const ResourcesContext = createContext<ResourcesContextValue | undefined>(
  undefined,
)
export const LoansContext = createContext<LoansContextValue | undefined>(
  undefined,
)
export const UsersContext = createContext<UsersContextValue | undefined>(
  undefined,
)
