import { useMemo } from 'react'
import { useAuth } from '@/contexts/useAuth'
import { useLoans } from '@/contexts/useLoans'
import { useResources } from '@/contexts/useResources'
import type { Loan, Resource } from '@/shared/types'

export interface MyLoanItem {
  loan: Loan
  resourceName: string
  /** Recurso del préstamo, para mostrar su imagen; ausente si ya no existe. */
  resource?: Resource
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
    const byId = new Map(resources.map((r) => [r.idRecurso, r]))
    return getLoansByUser(userId).map((loan) => {
      const resource = byId.get(loan.idRecurso)
      return { loan, resourceName: resource?.nombre ?? UNKNOWN_RESOURCE, resource }
    })
    // `loans` fuerza el recálculo cuando cambian los préstamos.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId, loans, resources, getLoansByUser])
}
