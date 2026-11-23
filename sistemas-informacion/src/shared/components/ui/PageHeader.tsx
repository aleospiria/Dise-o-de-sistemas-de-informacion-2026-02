import type { ReactNode } from 'react'
import styles from '@/shared/components/ui/DataPage.module.css'

export interface PageHeaderProps {
  /** Texto corto sobre el título (p. ej. la sección). */
  eyebrow?: string
  /** Descripción breve: qué se puede hacer en esta página. */
  description?: ReactNode
  /** Acción principal de la página (un botón o enlace). */
  action?: ReactNode
}

/**
 * Cabecera de página bajo el título. `AppShell` ya dibuja el único `<h1>`; este
 * bloque aporta la descripción y la acción principal, sin repetir el título.
 */
export function PageHeader({ eyebrow, description, action }: PageHeaderProps) {
  if (!eyebrow && !description && !action) return null
  return (
    <div className={styles.pageHeader}>
      <div className={styles.pageHeading}>
        {eyebrow && <p className={styles.eyebrow}>{eyebrow}</p>}
        {description && <p className={styles.lead}>{description}</p>}
      </div>
      {action && <div className={styles.actions}>{action}</div>}
    </div>
  )
}