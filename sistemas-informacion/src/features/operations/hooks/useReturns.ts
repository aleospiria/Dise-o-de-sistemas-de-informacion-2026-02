import { useMemo } from 'react'
import { useLoans } from '@/contexts/useLoans'
import { useResources } from '@/contexts/useResources'
import { useToast } from '@/contexts/useToast'
import { useUsers } from '@/contexts/useUsers'
import type { ConditionFormValues } from '@/features/operations/types'
import { useNow } from '@/shared/hooks/useNow'
import type { Loan } from '@/shared/types'
import { calculateDelayHours, formatDuration } from '@/shared/utils/dateUtils'

export interface PendingReturn {
  loan: Loan
  resourceName: string
  studentName: string
  /** Horas de retraso hasta este momento (0 si aún está a tiempo). */
  delayHours: number
  overdue: boolean
}

const UNKNOWN_RESOURCE = 'Recurso no disponible'
const UNKNOWN_STUDENT = 'Usuario desconocido'

/**
 * Devoluciones pendientes (Req 13.1–13.3): préstamos en curso, el de fin más
 * antiguo primero, con el retraso acumulado calculado con el reloj.
 */
export function useReturns() {
  const { loans, getPendingReturns, registerReturn } = useLoans()
  const { resources } = useResources()
  const { users } = useUsers()
  const { showToast } = useToast()
  const now = useNow()

  const items = useMemo<PendingReturn[]>(() => {
    const resourceNames = new Map(resources.map((r) => [r.idRecurso, r.nombre]))
    const studentNames = new Map(users.map((u) => [u.idUsuario, u.nombre]))
    const nowIso = new Date(now).toISOString()
    return getPendingReturns().map((loan) => {
      const delayHours = calculateDelayHours(nowIso, loan.fechaHoraFinProgramada)
      return {
        loan,
        resourceName: resourceNames.get(loan.idRecurso) ?? UNKNOWN_RESOURCE,
        studentName: studentNames.get(loan.idUsuario) ?? UNKNOWN_STUDENT,
        delayHours,
        overdue: delayHours > 0,
      }
    })
    // `loans` fuerza el recálculo cuando cambian los datos.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loans, now, resources, users, getPendingReturns])

  function register(item: PendingReturn, values: ConditionFormValues) {
    const result = registerReturn(item.loan.idPrestamo, {
      condicion: values.condicion,
      observaciones: values.observaciones || undefined,
    })
    if (result.success) {
      // Resumen con el retraso real y el destino del recurso (Req 13.8, 13.10).
      const delay = result.data?.retrasoHoras ?? 0
      const parts = [
        `Devolución registrada: ${item.resourceName}.`,
        delay > 0 ? `Retraso: ${formatDuration(delay)}.` : 'Devuelto a tiempo.',
      ]
      if (values.condicion === 'Dañado') parts.push('El recurso pasó a mantenimiento.')
      showToast('success', parts.join(' '))
    }
    return result
  }

  return { items, register }
}
