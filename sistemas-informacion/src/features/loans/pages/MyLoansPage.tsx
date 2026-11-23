import { useLoans } from '@/contexts/useLoans'
import { useToast } from '@/contexts/useToast'
import { LoanCard } from '@/features/loans/components/LoanCard'
import { useMyLoans } from '@/features/loans/hooks/useMyLoans'
import styles from '@/features/loans/pages/MyLoansPage.module.css'
import { ButtonLink } from '@/shared/components/ui/ButtonLink'
import { EmptyState } from '@/shared/components/ui/EmptyState'
import { PageHeader } from '@/shared/components/ui/PageHeader'

/** Historial de préstamos del usuario autenticado (Req 8.11). */
export function MyLoansPage() {
  const items = useMyLoans()
  const { cancelLoan } = useLoans()
  const { showToast } = useToast()

  async function cancel(loanId: string, series: boolean) {
    const result = await cancelLoan(loanId, series)
    if (!result.success) {
      showToast('error', result.error ?? 'No se pudo cancelar la reserva.')
      return
    }
    showToast('success', 'Reserva cancelada.')
  }

  return (
    <div className={styles.page}>
      <PageHeader
        description="Sigue cada préstamo desde la reserva hasta la devolución y cancela las reservas que aún no recoges."
        action={
          <ButtonLink to="/availability" icon="plus">
            Nueva reserva
          </ButtonLink>
        }
      />
      {items.length === 0 ? (
        <EmptyState
          icon="clipboard"
          title="Todavía no tienes préstamos."
          description="Cuando reserves un recurso aparecerá aquí con su horario y su estado."
          action={
            <ButtonLink to="/availability" icon="search">
              Buscar un recurso
            </ButtonLink>
          }
        />
      ) : (
        <ul className={styles.list}>
          {items.map(({ loan, resourceName, resource }) => (
            <li key={loan.idPrestamo}>
              <LoanCard
                loan={loan}
                resourceName={resourceName}
                resource={resource}
                onCancel={(series) => void cancel(loan.idPrestamo, series)}
              />
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
