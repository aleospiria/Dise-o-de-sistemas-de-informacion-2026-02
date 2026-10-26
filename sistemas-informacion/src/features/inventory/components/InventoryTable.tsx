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
      {/* Roles explícitos: el CSS compacto cambia `display` y algunos navegadores
          descartarían la semántica de tabla (ver InventoryTable.module.css). */}
      <table className={styles.table} role="table">
        <caption className="sr-only">Recursos del inventario</caption>
        <thead role="rowgroup">
          <tr role="row">
            <th scope="col" role="columnheader">
              Nombre
            </th>
            <th scope="col" role="columnheader" className={styles.secondary}>
              Tipo
            </th>
            <th scope="col" role="columnheader">
              Estado
            </th>
            <th scope="col" role="columnheader" className={styles.secondary}>
              Disponibles
            </th>
            <th scope="col" role="columnheader">
              Acciones
            </th>
          </tr>
        </thead>
        <tbody role="rowgroup">
          {resources.map((resource) => {
            const retired = resource.estadoActual === 'Dado_de_Baja'
            const tipo = RESOURCE_TYPE_LABELS[resource.tipo]
            return (
              <tr key={resource.idRecurso} role="row">
                <th scope="row" role="rowheader" className={styles.cellName}>
                  {resource.nombre}
                  <span className={styles.code}>{resource.codigoInventario}</span>
                  <details className={styles.details}>
                    {/* El nombre completo va solo para lectores de pantalla:
                        en móvil el texto visible corto evita desbordar la tabla. */}
                    <summary>
                      Ver detalles{' '}
                      <span className="sr-only">de {resource.nombre}</span>
                    </summary>
                    <p>Tipo: {tipo}</p>
                    <p>
                      Disponibles: {resource.cantidadDisponible} de {resource.cantidadTotal}
                    </p>
                  </details>
                </th>
                <td role="cell" className={styles.secondary}>
                  {tipo}
                </td>
                <td role="cell" className={styles.cellStatus}>
                  <StatusBadge status={resource.estadoActual} />
                </td>
                <td role="cell" className={styles.secondary}>
                  {resource.cantidadDisponible} de {resource.cantidadTotal}
                </td>
                <td role="cell" className={styles.cellActions}>
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
