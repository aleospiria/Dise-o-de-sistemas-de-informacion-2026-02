import { useMemo } from 'react'
import { useLoans } from '@/contexts/useLoans'
import { useResources } from '@/contexts/useResources'
import { useToast } from '@/contexts/useToast'
import { useUsers } from '@/contexts/useUsers'
import type { ConditionFormValues } from '@/features/operations/types'
import { useNow } from '@/shared/hooks/useNow'
import type { Loan } from '@/shared/types'

export interface PendingDelivery {
  loan: Loan
  resourceName: string
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
    const resourceNames = new Map(resources.map((r) => [r.idRecurso, r.nombre]))
    const studentNames = new Map(users.map((u) => [u.idUsuario, u.nombre]))
    return getPendingDeliveries().map((loan) => ({
      loan,
      resourceName: resourceNames.get(loan.idRecurso) ?? UNKNOWN_RESOURCE,
      studentName: studentNames.get(loan.idUsuario) ?? UNKNOWN_STUDENT,
    }))
    // `loans` y `now` fuerzan el recálculo (cambio de datos o paso del tiempo).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loans, now, resources, users, getPendingDeliveries])

  function register(item: PendingDelivery, values: ConditionFormValues) {
    const result = registerDelivery(item.loan.idPrestamo, {
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
