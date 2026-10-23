import {
  LoansContext,
  type LoansContextValue,
} from '@/contexts/AppDataContext'
import { useRequiredContext } from '@/contexts/requireContext'

/** Préstamos, entregas, devoluciones y disponibilidad (dominio de préstamos). */
export function useLoans(): LoansContextValue {
  return useRequiredContext(LoansContext, 'useLoans', 'AppDataProvider')
}
