import { Link } from 'react-router-dom'
import styles from '@/shared/components/guards/AccessDeniedPage.module.css'

/**
 * Destino de `RoleGuard` cuando el rol no tiene permiso. Se muestra dentro del
 * `AppShell`, que ya dibuja el título "Acceso denegado" (Req 19.2, 19.3).
 */
export function AccessDeniedPage() {
  return (
    <div className={styles.content}>
      <p>No tienes permiso para ver esta página con tu rol actual.</p>
      <Link to="/dashboard" className={styles.link}>
        Volver al inicio
      </Link>
    </div>
  )
}
