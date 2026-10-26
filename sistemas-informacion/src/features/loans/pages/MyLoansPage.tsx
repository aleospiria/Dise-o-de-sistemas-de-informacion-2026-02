import { Link } from 'react-router-dom'
import { LoanCard } from '@/features/loans/components/LoanCard'
import { useMyLoans } from '@/features/loans/hooks/useMyLoans'
import styles from '@/features/loans/pages/MyLoansPage.module.css'

/** Historial de préstamos del estudiante autenticado (Req 8.11). */
export function MyLoansPage() {
  const items = useMyLoans()

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
          <LoanCard loan={loan} resourceName={resourceName} />
        </li>
      ))}
    </ul>
  )
}
