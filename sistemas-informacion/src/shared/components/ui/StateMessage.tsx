import type { ReactNode } from 'react'
import styles from '@/shared/components/ui/StateMessage.module.css'
import { Icon, type IconName } from '@/shared/components/ui/icons'

export type StateMessageKind = 'loading' | 'error' | 'success' | 'info'

export interface StateMessageProps {
  kind: StateMessageKind
  title: string
  children?: ReactNode
  /** Acción de recuperación (reintentar, volver…). */
  action?: ReactNode
}

const STATE_ICONS: Record<Exclude<StateMessageKind, 'loading'>, IconName> = {
  error: 'alert-circle',
  success: 'check-circle',
  info: 'info',
}

/**
 * Estado de página completo: cargando, error, éxito o información. Los errores
 * usan `role="alert"`; el resto, `role="status"`. El tipo se comunica con
 * color, ícono y texto. Para cargas de listas usa `SkeletonLoader`.
 */
export function StateMessage({ kind, title, children, action }: StateMessageProps) {
  return (
    <div
      role={kind === 'error' ? 'alert' : 'status'}
      aria-busy={kind === 'loading' || undefined}
      className={`${styles.state} ${styles[kind]}`}
    >
      <span className={styles.iconWrap}>
        {kind === 'loading' ? (
          <span className={styles.spinner} aria-hidden="true" />
        ) : (
          <Icon name={STATE_ICONS[kind]} size={28} />
        )}
      </span>
      <p className={styles.title}>{title}</p>
      {children && <div className={styles.description}>{children}</div>}
      {action && <div className={styles.action}>{action}</div>}
    </div>
  )
}