import { Link } from 'react-router-dom'
import styles from '@/features/dashboard/components/Dashboard.module.css'
import { StatCard } from '@/features/dashboard/components/StatCard'
import { useDeliveries } from '@/features/operations/hooks/useDeliveries'
import { useReturns } from '@/features/operations/hooks/useReturns'

/** Panel del técnico: contadores de lo que tiene por entregar y por recibir. */
export function TechnicianDashboard() {
  const { items: deliveries } = useDeliveries()
  const { items: returns } = useReturns()
  const overdue = returns.filter((r) => r.overdue).length

  return (
    <div className={styles.view}>
      <ul className={styles.stats} aria-label="Resumen de operaciones">
        <li>
          <StatCard
            label="Entregas pendientes"
            value={deliveries.length}
            hint="Reservas cuya hora ya llegó"
            to="/deliveries"
          />
        </li>
        <li>
          <StatCard
            label="Devoluciones pendientes"
            value={returns.length}
            hint="Préstamos en curso"
            to="/returns"
          />
        </li>
        <li>
          <StatCard
            label="Devoluciones con retraso"
            value={overdue}
            hint="Pasaron su hora de fin"
            to="/returns"
            alert
          />
        </li>
      </ul>

      <div className={styles.actions}>
        <Link to="/deliveries" className={styles.primary}>
          Registrar entregas
        </Link>
        <Link to="/returns" className={styles.secondary}>
          Registrar devoluciones
        </Link>
        <Link to="/availability" className={styles.secondary}>
          Consultar disponibilidad
        </Link>
      </div>
    </div>
  )
}
