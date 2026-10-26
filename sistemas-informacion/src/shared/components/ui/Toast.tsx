import { useEffect, useRef } from 'react'
import styles from '@/shared/components/ui/Toast.module.css'
import type { ToastType } from '@/shared/types'

/** Tiempo antes del cierre automático de éxito e informativos (Req 18.3). */
export const TOAST_AUTO_CLOSE_MS = 3000

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
      <p className={styles.message}>{message}</p>
      <button
        type="button"
        className={styles.close}
        aria-label="Cerrar notificación"
        onClick={onClose}
      >
        <span aria-hidden="true">×</span>
      </button>
    </div>
  )
}
