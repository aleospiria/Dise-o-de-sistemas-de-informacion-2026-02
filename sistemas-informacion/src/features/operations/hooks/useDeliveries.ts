import { useMemo } from 'react'
import { useLoans } from '@/contexts/useLoans'
import { useResources } from '@/contexts/useResources'
import { useToast } from '@/contexts/useToast'
import { useUsers } from '@/contexts/useUsers'
import type { ConditionFormValues } from '@/features/operations/types'
import { useNow } from '@/shared/hooks/useNow'
import type { Loan, Resource } from '@/shared/types'

export interface PendingDelivery {
  loan: Loan
  resourceName: string
  /** Recurso del préstamo, para mostrar su imagen. */
  resource?: Resource
  studentName: string
}

const UNKNOWN_RESOURCE = 'Recurso no disponible'
const UNKNOWN_STUDENT = 'Usuario desconocido'

/**
 * Entregas pendientes (Req 12.1–12.3): reservas cuya hora de inicio ya llegó,
 * la más antigua primero. Se recalcula con el reloj, así una reserva aparece
 * sola cuando llega su hora.
 */
export function useDeliveries() {
  const { loans, getPendingDeliveries, registerDelivery } = useLoans()
  const { resources } = useResources()
  const { users } = useUsers()
  const { showToast } = useToast()
  const now = useNow()

  const items = useMemo<PendingDelivery[]>(() => {
    const resourcesById = new Map(resources.map((r) => [r.idRecurso, r]))
    const studentNames = new Map(users.map((u) => [u.idUsuario, u.nombre]))
    return getPendingDeliveries().map((loan) => {
      const resource = resourcesById.get(loan.idRecurso)
      return {
        loan,
        resourceName: resource?.nombre ?? UNKNOWN_RESOURCE,
        resource,
        studentName: studentNames.get(loan.idUsuario) ?? UNKNOWN_STUDENT,
      }
    })
    // `loans` y `now` fuerzan el recálculo (cambio de datos o paso del tiempo).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loans, now, resources, users, getPendingDeliveries])

  async function register(item: PendingDelivery, values: ConditionFormValues) {
    const result = await registerDelivery(item.loan.idPrestamo, {
      condicion: values.condicion,
      observaciones: values.observaciones || undefined,
    })
    if (result.success) {
      showToast('success', `Entrega registrada: ${item.resourceName} para ${item.studentName}.`)
    }
    return result
  }

  return { items, register }
}
