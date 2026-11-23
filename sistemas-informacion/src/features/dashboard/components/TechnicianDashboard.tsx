import styles from '@/features/dashboard/components/Dashboard.module.css'
import { QuickLink } from '@/features/dashboard/components/QuickLink'
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
            icon="send"
            hint="Reservas cuya hora ya llegó"
            to="/deliveries"
          />
        </li>
        <li>
          <StatCard
            label="Devoluciones pendientes"
            value={returns.length}
            icon="undo"
            hint="Préstamos en curso"
            to="/returns"
          />
        </li>
        <li>
          <StatCard
            label="Devoluciones con retraso"
            value={overdue}
            icon="alert-triangle"
            hint="Pasaron su hora de fin"
            to="/returns"
            alert
          />
        </li>
      </ul>
      <section className={styles.section} aria-labelledby="quick-title">
        <h2 id="quick-title">Accesos rápidos</h2>
        <div className={styles.quick}>
          <QuickLink
            to="/deliveries"
            icon="send"
            title="Registrar entregas"
            description="Entrega las reservas que ya llegaron"
            primary
          />
          <QuickLink
            to="/returns"
            icon="undo"
            title="Registrar devoluciones"
            description="Recibe los recursos y su condición"
          />
          <QuickLink
            to="/availability"
            icon="search"
            title="Consultar disponibilidad"
            description="Mira qué hay libre ahora"
          />
        </div>
      </section>
    </div>
  )
}
