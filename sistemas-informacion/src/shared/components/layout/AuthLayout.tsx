import { Outlet } from 'react-router-dom'
import styles from '@/shared/components/layout/AuthLayout.module.css'

/**
 * Contenedor centrado y sin navegación para las pantallas públicas
 * (inicio de sesión y registro). Úsalo como layout route.
 */
export function AuthLayout() {
  return (
    <div className={styles.wrapper}>
      <main id="main-content" className={styles.card}>
        <Outlet />
      </main>
    </div>
  )
}
