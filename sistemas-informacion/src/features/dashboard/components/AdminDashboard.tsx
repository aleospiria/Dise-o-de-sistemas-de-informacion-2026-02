import { useLoans } from '@/contexts/useLoans'
import { useResources } from '@/contexts/useResources'
import styles from '@/features/dashboard/components/Dashboard.module.css'
import { QuickLink } from '@/features/dashboard/components/QuickLink'
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
              icon="package"
              hint="Sin contar los dados de baja"
              to="/inventory"
            />
          </li>
          <li>
            <StatCard
              label="Disponibles"
              value={inventory.available}
              icon="check-circle"
              hint="Se pueden reservar ahora"
              to="/inventory"
            />
          </li>
          <li>
            <StatCard
              label="En mantenimiento"
              value={inventory.inMaintenance}
              icon="wrench"
              hint="No se pueden reservar"
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
              icon="clipboard-check"
              hint="Reservados y en curso"
            />
          </li>
          <li>
            <StatCard
              label="Reservados"
              value={loanSummary.reserved}
              icon="calendar"
              hint="Aún sin entregar"
            />
          </li>
          <li>
            <StatCard
              label="En préstamo"
              value={loanSummary.inProgress}
              icon="clipboard"
              hint="Entregados"
            />
          </li>
        </ul>
      </section>
      <section className={styles.section} aria-labelledby="quick-title">
        <h2 id="quick-title">Accesos rápidos</h2>
        <div className={styles.quick}>
          <QuickLink
            to="/inventory/new"
            icon="plus"
            title="Nuevo recurso"
            description="Agrega un equipo, herramienta o material"
            primary
          />
          <QuickLink
            to="/inventory"
            icon="package"
            title="Ver inventario"
            description="Edita, da de baja o importa recursos"
          />
          <QuickLink
            to="/deliveries"
            icon="send"
            title="Entregas"
            description="Reservas listas para entregar"
          />
          <QuickLink
            to="/returns"
            icon="undo"
            title="Devoluciones"
            description="Préstamos que esperan su devolución"
          />
        </div>
      </section>
    </div>
  )
}
