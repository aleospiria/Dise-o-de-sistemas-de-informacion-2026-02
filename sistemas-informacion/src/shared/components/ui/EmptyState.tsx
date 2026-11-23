import type { ReactNode } from 'react'
import styles from '@/shared/components/ui/EmptyState.module.css'
import panelStyles from '@/shared/components/ui/DataPage.module.css'
import { Icon, type IconName } from '@/shared/components/ui/icons'

export interface EmptyStateProps {
  icon?: IconName
  title: string
  /** Por qué está vacío y cómo continuar. */
  description?: ReactNode
  /** Acción para salir del estado vacío (crear, limpiar filtros…). */
  action?: ReactNode
}

/** Estado vacío útil: ícono, qué pasa y qué hacer a continuación. */
export function EmptyState({ icon = 'inbox', title, description, action }: EmptyStateProps) {
  return (
    <div className={`${panelStyles.empty} ${styles.empty}`}>
      <span className={styles.iconWrap}>
        <Icon name={icon} size={28} />
      </span>
      <p className={panelStyles.emptyTitle}>{title}</p>
      {description && <p className={styles.description}>{description}</p>}
      {action && <div className={styles.action}>{action}</div>}
    </div>
  )
}