import { Link } from 'react-router-dom'
import styles from '@/shared/pages/NotFoundPage.module.css'

/**
 * Página 404. Es una ruta independiente (fuera del `AppShell`) porque también
 * la ven usuarios sin sesión; por eso dibuja su propio `<main>` y `<h1>`.
 */
export function NotFoundPage() {
  return (
    <main id="main-content" className={styles.wrapper}>
      <h1>Página no encontrada</h1>
      <p>La dirección que buscas no existe o fue movida.</p>
      <Link to="/dashboard" className={styles.link}>
        Ir al inicio
      </Link>
    </main>
  )
}
