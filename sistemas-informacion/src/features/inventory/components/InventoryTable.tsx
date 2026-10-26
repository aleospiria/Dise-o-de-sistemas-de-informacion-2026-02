import { Link } from 'react-router-dom'
import styles from '@/features/inventory/components/InventoryTable.module.css'
import { Button } from '@/shared/components/ui/Button'
import { StatusBadge } from '@/shared/components/ui/StatusBadge'
import { RESOURCE_TYPE_LABELS } from '@/shared/constants/resourceTypes'
import type { Resource } from '@/shared/types'

export interface InventoryTableProps {
  resources: Resource[]
  onRetire: (resource: Resource) => void
}

/**
 * Tabla del inventario (Req 4.6). En móvil oculta las columnas secundarias y
 * ofrece sus datos en un "Ver detalles" desplegable (Req 16.4).
 */
export function InventoryTable({ resources, onRetire }: InventoryTableProps) {
  return (
    <div className={styles.wrapper}>
      <table className={styles.table}>
        <caption className="sr-only">Recursos del inventario</caption>
        <thead>
          <tr>
            <th scope="col">Nombre</th>
            <th scope="col" className={styles.secondary}>
              Tipo
            </th>
            <th scope="col">Estado</th>
            <th scope="col" className={styles.secondary}>
              Disponibles
            </th>
            <th scope="col">Acciones</th>
          </tr>
        </thead>
        <tbody>
          {resources.map((resource) => {
            const retired = resource.estadoActual === 'Dado_de_Baja'
            const tipo = RESOURCE_TYPE_LABELS[resource.tipo]
            return (
              <tr key={resource.idRecurso}>
                <th scope="row">
                  {resource.nombre}
                  <span className={styles.code}>{resource.codigoInventario}</span>
                  <details className={styles.details}>
                    <summary>Ver detalles de {resource.nombre}</summary>
                    <p>Tipo: {tipo}</p>
                    <p>
                      Disponibles: {resource.cantidadDisponible} de {resource.cantidadTotal}
                    </p>
                  </details>
                </th>
                <td className={styles.secondary}>{tipo}</td>
                <td>
                  <StatusBadge status={resource.estadoActual} />
                </td>
                <td className={styles.secondary}>
                  {resource.cantidadDisponible} de {resource.cantidadTotal}
                </td>
                <td>
                  {retired ? (
                    <span className={styles.muted}>Sin acciones</span>
                  ) : (
                    <div className={styles.actions}>
                      <Link
                        to={`/inventory/${resource.idRecurso}/edit`}
                        className={styles.edit}
                        aria-label={`Editar ${resource.nombre}`}
                      >
                        Editar
                      </Link>
                      <Button
                        variant="danger"
                        size="sm"
                        onClick={() => onRetire(resource)}
                        aria-label={`Dar de baja ${resource.nombre}`}
                      >
                        Dar de baja
                      </Button>
                    </div>
                  )}
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
