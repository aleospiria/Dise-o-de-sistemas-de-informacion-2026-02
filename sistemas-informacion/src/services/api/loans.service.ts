import { apiRequest } from '@/services/api/client'
import type { DeliveryData, Loan, LoanFormData, ReturnData } from '@/shared/types'

export function listLoans(): Promise<Loan[]> {
  return apiRequest<Loan[]>('/loans')
}

export function listMyLoans(): Promise<Loan[]> {
  return apiRequest<Loan[]>('/loans/my')
}

export function createLoan(data: LoanFormData): Promise<Loan> {
  return apiRequest<Loan>('/loans', { method: 'POST', body: data })
}

export function registerDelivery(
  loanId: string,
  data: DeliveryData,
): Promise<Loan> {
  return apiRequest<Loan>(`/loans/${loanId}/delivery`, {
    method: 'POST',
    body: data,
  })
}

export function registerReturn(loanId: string, data: ReturnData): Promise<Loan> {
  return apiRequest<Loan>(`/loans/${loanId}/return`, {
    method: 'POST',
    body: data,
  })
}
