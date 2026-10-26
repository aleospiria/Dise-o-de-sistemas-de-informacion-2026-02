import type { ReactNode } from 'react'
import styles from '@/shared/components/ui/Alert.module.css'

export type AlertType = 'error' | 'success' | 'info'

export interface AlertProps {
  type?: AlertType
  children: ReactNode
}

/**
 * Mensaje en línea dentro de un formulario o página, p. ej. el error genérico
 * de inicio de sesión (Req 1.8). Los errores usan `role="alert"` para que se
 * anuncien al aparecer; el resto, `role="status"`.
 */
export function Alert({ type = 'info', children }: AlertProps) {
  return (
    <div
      role={type === 'error' ? 'alert' : 'status'}
      className={`${styles.alert} ${styles[type]}`}
    >
      {children}
    </div>
  )
}
