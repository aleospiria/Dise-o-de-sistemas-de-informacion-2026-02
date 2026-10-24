import { useToast } from '@/contexts/useToast'
import { Toast } from '@/shared/components/ui/Toast'
import styles from '@/shared/components/ui/ToastContainer.module.css'

/** Cantidad máxima de toasts visibles a la vez; se muestran los más recientes. */
export const MAX_VISIBLE_TOASTS = 5

/** Apila verticalmente las notificaciones activas del `UIContext`. */
export function ToastContainer() {
  const { toasts, dismissToast } = useToast()
  const visible = toasts.slice(-MAX_VISIBLE_TOASTS)

  return (
    <section className={styles.container} aria-label="Notificaciones">
      {visible.map((toast) => (
        <Toast
          key={toast.id}
          type={toast.type}
          message={toast.message}
          onClose={() => dismissToast(toast.id)}
        />
      ))}
    </section>
  )
}
