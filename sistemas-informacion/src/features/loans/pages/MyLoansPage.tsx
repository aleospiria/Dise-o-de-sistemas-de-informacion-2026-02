import { Link } from 'react-router-dom'
import { useLoans } from '@/contexts/useLoans'
import { useToast } from '@/contexts/useToast'
import { LoanCard } from '@/features/loans/components/LoanCard'
import { useMyLoans } from '@/features/loans/hooks/useMyLoans'
import styles from '@/features/loans/pages/MyLoansPage.module.css'

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

  if (items.length === 0) {
    return (
      <div className={styles.empty}>
        <p>Todavía no tienes préstamos.</p>
        <Link to="/availability" className={styles.link}>
          Buscar un recurso
        </Link>
      </div>
    )
  }

  return (
    <ul className={styles.list}>
      {items.map(({ loan, resourceName }) => (
        <li key={loan.idPrestamo}>
          <LoanCard
            loan={loan}
            resourceName={resourceName}
            onCancel={(series) => void cancel(loan.idPrestamo, series)}
          />
        </li>
      ))}
    </ul>
  )
}
