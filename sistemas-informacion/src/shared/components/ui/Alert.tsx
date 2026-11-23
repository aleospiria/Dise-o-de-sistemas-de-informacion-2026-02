import type { ReactNode } from 'react'
import styles from '@/shared/components/ui/Alert.module.css'
import { Icon, type IconName } from '@/shared/components/ui/icons'

export type AlertType = 'error' | 'success' | 'info'

export interface AlertProps {
  type?: AlertType
  children: ReactNode
}

const ALERT_ICONS: Record<AlertType, IconName> = {
  error: 'alert-circle',
  success: 'check-circle',
  info: 'info',
}

/**
 * Mensaje en línea dentro de un formulario o página, p. ej. el error genérico
 * de inicio de sesión (Req 1.8). Los errores usan `role="alert"` para que se
 * anuncien al aparecer; el resto, `role="status"`. El tipo se comunica con
 * color, ícono y texto.
 */
export function Alert({ type = 'info', children }: AlertProps) {
  return (
    <div
      role={type === 'error' ? 'alert' : 'status'}
      className={`${styles.alert} ${styles[type]}`}
    >
      <Icon name={ALERT_ICONS[type]} size={20} className={styles.icon} />
      <div className={styles.body}>{children}</div>
    </div>
  )
}
