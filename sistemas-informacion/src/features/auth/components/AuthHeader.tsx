import styles from '@/features/auth/components/AuthHeader.module.css'
import { Icon, type IconName } from '@/shared/components/ui/icons'
import { APP_NAME } from '@/shared/constants/app'

export interface AuthHeaderProps {
  /** Ícono de la pantalla, dentro de un recuadro de acento. */
  icon: IconName
  /** Título de la pantalla: es el único `<h1>` de la página. */
  title: string
  /** Una frase que explica qué se hace aquí. */
  description: string
}

/** Encabezado común de las pantallas públicas: marca, título y descripción. */
export function AuthHeader({ icon, title, description }: AuthHeaderProps) {
  return (
    <header className={styles.header}>
      <span className={styles.iconWrap}>
        <Icon name={icon} size={26} />
      </span>
      <p className={styles.appName}>{APP_NAME}</p>
      <h1 className={styles.title}>{title}</h1>
      <p className={styles.description}>{description}</p>
    </header>
  )
}
