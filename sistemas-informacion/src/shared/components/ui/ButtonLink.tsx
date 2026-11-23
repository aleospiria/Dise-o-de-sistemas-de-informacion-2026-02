import { Link, type LinkProps } from 'react-router-dom'
import styles from '@/shared/components/ui/Button.module.css'
import type { ButtonSize, ButtonVariant } from '@/shared/components/ui/Button'
import { Icon, type IconName } from '@/shared/components/ui/icons'

export interface ButtonLinkProps extends LinkProps {
  variant?: ButtonVariant
  size?: ButtonSize
  /** Ícono decorativo antes del texto. */
  icon?: IconName
}

/**
 * Enlace de navegación con la apariencia de `Button`. Úsalo cuando la acción
 * lleva a otra ruta (un `<a>`), no cuando ejecuta algo en la página.
 */
export function ButtonLink({
  variant = 'primary',
  size = 'md',
  icon,
  className,
  children,
  ...rest
}: ButtonLinkProps) {
  const classes = [styles.button, styles[variant], styles[size], className]
    .filter(Boolean)
    .join(' ')
  return (
    <Link {...rest} className={classes}>
      <span className={styles.content}>
        {icon && <Icon name={icon} size={size === 'sm' ? 16 : 18} />}
        {children}
      </span>
    </Link>
  )
}