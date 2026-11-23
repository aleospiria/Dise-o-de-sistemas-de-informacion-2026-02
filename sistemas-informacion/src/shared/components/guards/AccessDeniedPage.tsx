import styles from '@/shared/components/guards/AccessDeniedPage.module.css'
import { ButtonLink } from '@/shared/components/ui/ButtonLink'
import { Icon } from '@/shared/components/ui/icons'

/**
 * Destino de `RoleGuard` cuando el rol no tiene permiso. Se muestra dentro del
 * `AppShell`, que ya dibuja el título "Acceso denegado" (Req 19.2, 19.3).
 */
export function AccessDeniedPage() {
  return (
    <div className={styles.content}>
      <span className={styles.iconWrap}>
        <Icon name="lock" size={36} />
      </span>
      <p className={styles.lead}>No tienes permiso para ver esta página con tu rol actual.</p>
      <p className={styles.detail}>
        Si necesitas este acceso, consulta con un administrador del laboratorio.
      </p>
      <ButtonLink to="/dashboard" icon="home">
        Volver al inicio
      </ButtonLink>
    </div>
  )
}