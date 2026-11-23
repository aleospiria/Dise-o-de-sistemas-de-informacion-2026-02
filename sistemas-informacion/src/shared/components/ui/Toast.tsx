import { useEffect, useRef } from 'react'
import styles from '@/shared/components/ui/Toast.module.css'
import { Icon, type IconName } from '@/shared/components/ui/icons'
import type { ToastType } from '@/shared/types'

/** Tiempo antes del cierre automático de éxito e informativos (Req 18.3). */
export const TOAST_AUTO_CLOSE_MS = 3000

const TOAST_ICONS: Record<ToastType, IconName> = {
  success: 'check-circle',
  error: 'alert-circle',
  info: 'info',
}

export interface ToastProps {
  type: ToastType
  message: string
  onClose: () => void
}

/**
 * Notificación individual. Éxito e informativos se cierran solos a los 3 s;
 * los errores permanecen hasta que el usuario los cierre (Req 18.4, 18.9).
 */
export function Toast({ type, message, onClose }: ToastProps) {
  const onCloseRef = useRef(onClose)

  useEffect(() => {
    onCloseRef.current = onClose
  }, [onClose])

  useEffect(() => {
    if (type === 'error') return
    const timer = setTimeout(() => onCloseRef.current(), TOAST_AUTO_CLOSE_MS)
    return () => clearTimeout(timer)
  }, [type])

  return (
    <div
      // Los errores interrumpen al lector de pantalla; el resto se anuncia con cortesía.
      role={type === 'error' ? 'alert' : 'status'}
      className={`${styles.toast} ${styles[type]}`}
    >
      <Icon name={TOAST_ICONS[type]} size={20} className={styles.icon} />
      <p className={styles.message}>{message}</p>
      <button
        type="button"
        className={styles.close}
        aria-label="Cerrar notificación"
        onClick={onClose}
      >
        <Icon name="close" size={18} />
      </button>
    </div>
  )
}
