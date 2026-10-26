import { Link } from 'react-router-dom'
import styles from '@/features/dashboard/components/Dashboard.module.css'
import { StatCard } from '@/features/dashboard/components/StatCard'
import { getActiveLoans, summarizeLoans } from '@/features/dashboard/summaries'
import { LoanCard } from '@/features/loans/components/LoanCard'
import { useMyLoans } from '@/features/loans/hooks/useMyLoans'

/** Cuántos préstamos activos se muestran en el panel; el resto, en "Mis préstamos". */
const MAX_ACTIVE_SHOWN = 3

/** Panel del estudiante: resumen de sus préstamos activos y acceso a la búsqueda. */
export function StudentDashboard() {
  const items = useMyLoans()
  const summary = summarizeLoans(items.map((i) => i.loan))
  const active = getActiveLoans(items.map((i) => i.loan))
  const shown = items.filter((i) => active.includes(i.loan)).slice(0, MAX_ACTIVE_SHOWN)

  return (
    <div className={styles.view}>
      <ul className={styles.stats} aria-label="Resumen de tus préstamos">
        <li>
          <StatCard label="Reservados" value={summary.reserved} to="/loans/my" />
        </li>
        <li>
          <StatCard label="En préstamo" value={summary.inProgress} to="/loans/my" />
        </li>
      </ul>

      <section className={styles.section} aria-labelledby="active-loans-title">
        <h2 id="active-loans-title">Tus préstamos activos</h2>
        {shown.length === 0 ? (
          <p className={styles.empty}>No tienes préstamos activos.</p>
        ) : (
          <ul className={styles.list}>
            {shown.map(({ loan, resourceName }) => (
              <li key={loan.idPrestamo}>
                <LoanCard loan={loan} resourceName={resourceName} />
              </li>
            ))}
          </ul>
        )}
      </section>

      <div className={styles.actions}>
        <Link to="/availability" className={styles.primary}>
          Buscar un recurso
        </Link>
        <Link to="/loans/my" className={styles.secondary}>
          Ver todos mis préstamos
        </Link>
      </div>
    </div>
  )
}
