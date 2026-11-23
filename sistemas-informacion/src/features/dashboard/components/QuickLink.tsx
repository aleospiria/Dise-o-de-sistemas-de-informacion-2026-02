import { useId } from 'react'
import { Link } from 'react-router-dom'
import styles from '@/features/dashboard/components/QuickLink.module.css'
import { Icon, type IconName } from '@/shared/components/ui/icons'

export interface QuickLinkProps {
  to: string
  icon: IconName
  /** Nombre del acceso: es el nombre accesible del enlace. */
  title: string
  /** Frase que explica a dónde lleva; se anuncia como descripción. */
  description: string
  /** Acceso principal: se dibuja con el color de acción. */
  primary?: boolean
}

/** Acceso rápido del panel de inicio: ícono, nombre y una frase de apoyo. */
export function QuickLink({ to, icon, title, description, primary }: QuickLinkProps) {
  const baseId = useId()
  const titleId = `${baseId}-title`
  const descriptionId = `${baseId}-description`
  return (
    <Link
      to={to}
      className={`${styles.link} ${primary ? styles.primary : ''}`}
      aria-labelledby={titleId}
      aria-describedby={descriptionId}
    >
      <span className={styles.iconWrap}>
        <Icon name={icon} size={22} />
      </span>
      <span className={styles.text}>
        <span id={titleId} className={styles.title}>
          {title}
        </span>
        <span id={descriptionId} className={styles.description}>
          {description}
        </span>
      </span>
      <Icon name="arrow-right" size={18} className={styles.go} />
    </Link>
  )
}
