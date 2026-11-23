import type { ReactNode } from 'react'
import styles from '@/shared/components/ui/FilterBar.module.css'

export interface FilterBarProps {
  /** Nombre accesible de la región de filtros. */
  label: string
  /** Controles de filtro (Input, Select, casillas…). */
  children: ReactNode
  /** Botones que se aplican a todos los filtros (consultar, limpiar…). */
  actions?: ReactNode
  /** Máximo de columnas de controles en pantallas anchas. */
  columns?: 2 | 3
}

/** Panel de filtros en cuadrícula: una columna en móvil, varias desde 640 px. */
export function FilterBar({ label, children, actions, columns = 3 }: FilterBarProps) {
  return (
    <section
      className={`${styles.bar} ${columns === 2 ? styles.two : styles.three}`}
      aria-label={label}
    >
      <div className={styles.controls}>{children}</div>
      {actions && <div className={styles.actions}>{actions}</div>}
    </section>
  )
}
