import styles from '@/features/dashboard/components/Dashboard.module.css'
import { QuickLink } from '@/features/dashboard/components/QuickLink'
import { StatCard } from '@/features/dashboard/components/StatCard'
import { getActiveLoans, summarizeLoans } from '@/features/dashboard/summaries'
import { LoanCard } from '@/features/loans/components/LoanCard'
import { useMyLoans } from '@/features/loans/hooks/useMyLoans'
import { EmptyState } from '@/shared/components/ui/EmptyState'

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
          <StatCard
            label="Reservados"
            value={summary.reserved}
            icon="calendar"
            hint="Esperando que los recojas"
            to="/loans/my"
          />
        </li>
        <li>
          <StatCard
            label="En préstamo"
            value={summary.inProgress}
            icon="clipboard"
            hint="Los tienes en tu poder"
            to="/loans/my"
          />
        </li>
      </ul>
      <section className={styles.section} aria-labelledby="active-loans-title">
        <h2 id="active-loans-title">Tus préstamos activos</h2>
        {shown.length === 0 ? (
          <EmptyState
            icon="clipboard"
            title="No tienes préstamos activos."
            description="Cuando reserves un recurso lo verás aquí con su horario y estado."
          />
        ) : (
          <ul className={styles.list}>
            {shown.map(({ loan, resourceName, resource }) => (
              <li key={loan.idPrestamo}>
                <LoanCard loan={loan} resourceName={resourceName} resource={resource} />
              </li>
            ))}
          </ul>
        )}
      </section>
      <section className={styles.section} aria-labelledby="quick-title">
        <h2 id="quick-title">Accesos rápidos</h2>
        <div className={styles.quick}>
          <QuickLink
            to="/availability"
            icon="search"
            title="Buscar un recurso"
            description="Mira qué hay libre y reserva"
            primary
          />
          <QuickLink
            to="/loans/my"
            icon="clipboard"
            title="Ver todos mis préstamos"
            description="Historial y reservas por cancelar"
          />
        </div>
      </section>
    </div>
  )
}
