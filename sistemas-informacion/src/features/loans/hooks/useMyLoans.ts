import { useMemo } from 'react'
import { useAuth } from '@/contexts/useAuth'
import { useLoans } from '@/contexts/useLoans'
import { useResources } from '@/contexts/useResources'
import type { Loan } from '@/shared/types'

export interface MyLoanItem {
  loan: Loan
  resourceName: string
}

const UNKNOWN_RESOURCE = 'Recurso no disponible'

/** Préstamos del usuario autenticado, del más reciente al más antiguo. */
export function useMyLoans(): MyLoanItem[] {
  const { session } = useAuth()
  const { loans, getLoansByUser } = useLoans()
  const { resources } = useResources()
  const userId = session?.userId

  return useMemo(() => {
    if (!userId) return []
    const names = new Map(resources.map((r) => [r.idRecurso, r.nombre]))
    return getLoansByUser(userId).map((loan) => ({
      loan,
      resourceName: names.get(loan.idRecurso) ?? UNKNOWN_RESOURCE,
    }))
    // `loans` fuerza el recálculo cuando cambian los préstamos.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId, loans, resources, getLoansByUser])
}
