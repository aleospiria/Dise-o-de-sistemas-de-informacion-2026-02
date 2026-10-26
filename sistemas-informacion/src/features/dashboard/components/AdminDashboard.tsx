import { Link } from 'react-router-dom'
import { useLoans } from '@/contexts/useLoans'
import { useResources } from '@/contexts/useResources'
import styles from '@/features/dashboard/components/Dashboard.module.css'
import { StatCard } from '@/features/dashboard/components/StatCard'
import { summarizeInventory, summarizeLoans } from '@/features/dashboard/summaries'

/** Panel del administrador: estado del inventario y préstamos abiertos. */
export function AdminDashboard() {
  const { resources } = useResources()
  const { loans } = useLoans()
  const inventory = summarizeInventory(resources)
  const loanSummary = summarizeLoans(loans)

  return (
    <div className={styles.view}>
      <section className={styles.section} aria-labelledby="inventory-title">
        <h2 id="inventory-title">Inventario</h2>
        <ul className={styles.stats}>
          <li>
            <StatCard
              label="Recursos en servicio"
              value={inventory.total}
              hint="Sin contar los dados de baja"
              to="/inventory"
            />
          </li>
          <li>
            <StatCard
              label="Disponibles"
              value={inventory.available}
              hint="Se pueden reservar ahora"
              to="/inventory"
            />
          </li>
          <li>
            <StatCard
              label="En mantenimiento"
              value={inventory.inMaintenance}
              to="/inventory"
              alert
            />
          </li>
        </ul>
      </section>

      <section className={styles.section} aria-labelledby="loans-title">
        <h2 id="loans-title">Préstamos</h2>
        <ul className={styles.stats}>
          <li>
            <StatCard
              label="Préstamos activos"
              value={loanSummary.active}
              hint="Reservados y en curso"
            />
          </li>
          <li>
            <StatCard label="Reservados" value={loanSummary.reserved} hint="Aún sin entregar" />
          </li>
          <li>
            <StatCard label="En préstamo" value={loanSummary.inProgress} hint="Entregados" />
          </li>
        </ul>
      </section>

      <div className={styles.actions}>
        <Link to="/inventory/new" className={styles.primary}>
          Nuevo recurso
        </Link>
        <Link to="/inventory" className={styles.secondary}>
          Ver inventario
        </Link>
        <Link to="/deliveries" className={styles.secondary}>
          Entregas
        </Link>
        <Link to="/returns" className={styles.secondary}>
          Devoluciones
        </Link>
      </div>
    </div>
  )
}
