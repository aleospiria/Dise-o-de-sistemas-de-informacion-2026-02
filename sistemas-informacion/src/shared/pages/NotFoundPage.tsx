import styles from '@/shared/pages/NotFoundPage.module.css'
import { ButtonLink } from '@/shared/components/ui/ButtonLink'
import { Icon } from '@/shared/components/ui/icons'

/**
 * Página 404. Es una ruta independiente (fuera del `AppShell`) porque también
 * la ven usuarios sin sesión; por eso dibuja su propio `<main>` y `<h1>`.
 */
export function NotFoundPage() {
  return (
    <main id="main-content" className={styles.wrapper}>
      <div className={styles.panel}>
        <span className={styles.iconWrap}>
          <Icon name="compass" size={36} />
        </span>
        <p className={styles.code}>Error 404</p>
        <h1 className={styles.title}>Página no encontrada</h1>
        <p className={styles.text}>La dirección que buscas no existe o fue movida.</p>
        <ButtonLink to="/dashboard" icon="home" size="lg">
          Ir al inicio
        </ButtonLink>
      </div>
    </main>
  )
}