/**
 * Contextos de datos de dominio (SOLID M4 — SRP + ISP).
 *
 * En lugar de un único contexto ancho, hay un contexto por dominio. Un
 * componente que solo consume recursos depende únicamente de
 * `ResourcesContext` y no se re-renderiza cuando cambian los préstamos.
 *
 * Las operaciones devuelven `MaybePromise`: en modo mock se resuelven de
 * inmediato y en modo API a través de HTTP. Los consumidores deben usar
 * `await`, que funciona con ambos casos.
 */
import { createContext } from 'react'
import type {
  CreateResourceData,
  DeliveryData,
  Loan,
  LoanFormData,
  MaybePromise,
  OperationResult,
  RecurringLoanData,
  RecurringLoanResult,
  Resource,
  ResourceAvailability,
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
  reloadResources: () => MaybePromise<void>
  createResource: (data: CreateResourceData) => MaybePromise<OperationResult<Resource>>
  updateResource: (
    id: string,
    data: Partial<CreateResourceData>,
  ) => MaybePromise<OperationResult<Resource>>
  updateResourceStatus: (
    id: string,
    newStatus: ResourceStatus,
    motivo?: string,
  ) => MaybePromise<OperationResult<void>>
  retireResource: (id: string) => MaybePromise<OperationResult<void>>
}

export interface LoansContextValue {
  loans: Loan[]
  createLoan: (data: LoanFormData, userId: string) => MaybePromise<OperationResult<Loan>>
  createRecurringLoans: (
    data: RecurringLoanData,
  ) => MaybePromise<OperationResult<RecurringLoanResult>>
  cancelLoan: (
    loanId: string,
    cancelSeries?: boolean,
  ) => MaybePromise<OperationResult<Loan[]>>
  registerDelivery: (
    loanId: string,
    data: DeliveryData,
  ) => MaybePromise<OperationResult<Loan>>
  registerReturn: (loanId: string, data: ReturnData) => MaybePromise<OperationResult<Loan>>
  getLoansByUser: (userId: string) => Loan[]
  getPendingDeliveries: () => Loan[]
  getPendingReturns: () => Loan[]
  /**
   * Consultas de disponibilidad. En modo API consultan el backend; en modo
   * mock leen el almacenamiento vigente.
   */
  checkAvailability: (
    resourceId: string,
    start: string,
    end: string,
  ) => MaybePromise<boolean>
  getAvailableResources: (
    start: string,
    end: string,
    filters?: ResourceFilters,
  ) => MaybePromise<Resource[]>
  getResourceAvailability: (
    resourceId: string,
    start: string,
    end: string,
  ) => MaybePromise<ResourceAvailability>
}

export interface UsersContextValue {
  users: User[]
  getUserById: (id: string) => User | undefined
  updateUser: (
    id: string,
    data: Partial<Omit<User, 'idUsuario' | 'fechaRegistro'>>,
  ) => MaybePromise<OperationResult<User>>
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
