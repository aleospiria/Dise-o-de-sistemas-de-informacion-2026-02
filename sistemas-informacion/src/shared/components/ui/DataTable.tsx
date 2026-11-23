import type { ReactNode } from 'react'
import styles from '@/shared/components/ui/DataPage.module.css'

export interface DataTableColumn<T> {
  /** Clave estable de la columna. */
  key: string
  header: string
  /** Contenido de la celda para una fila. */
  render: (row: T) => ReactNode
  /** La celda identifica la fila: se dibuja como `<th scope="row">`. */
  rowHeader?: boolean
}

export interface DataTableProps<T> {
  /** Nombre accesible de la tabla (se anuncia al entrar en ella). */
  label: string
  columns: DataTableColumn<T>[]
  rows: T[]
  getRowKey: (row: T) => string
}

/**
 * Tabla semántica con encabezado fijo, filas resaltables y desplazamiento
 * horizontal contenido (la página nunca desborda en móvil). El contenedor
 * desplazable recibe foco para poder recorrerlo con el teclado.
 */
export function DataTable<T>({ label, columns, rows, getRowKey }: DataTableProps<T>) {
  return (
    <div className={styles.tableWrapper} role="region" aria-label={label} tabIndex={0}>
      <table className={styles.table} aria-label={label}>
        <thead>
          <tr>
            {columns.map((column) => (
              <th key={column.key} scope="col">
                {column.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={getRowKey(row)}>
              {columns.map((column) =>
                column.rowHeader ? (
                  <th key={column.key} scope="row">
                    {column.render(row)}
                  </th>
                ) : (
                  <td key={column.key}>{column.render(row)}</td>
                ),
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}