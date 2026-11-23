import type { ComponentProps } from 'react'
import styles from '@/shared/components/ui/Button.module.css'
import { Icon, type IconName } from '@/shared/components/ui/icons'

export type ButtonVariant = 'primary' | 'secondary' | 'danger' | 'ghost'
export type ButtonSize = 'sm' | 'md' | 'lg'

export interface ButtonProps extends ComponentProps<'button'> {
  variant?: ButtonVariant
  size?: ButtonSize
  /** Ícono decorativo antes del texto (el texto sigue nombrando el botón). */
  icon?: IconName
  /** Muestra un spinner centrado y bloquea el botón (Req 18.2, 18.5). */
  loading?: boolean
}

export function Button({
  variant = 'primary',
  size = 'md',
  icon,
  loading = false,
  disabled = false,
  type = 'button',
  className,
  children,
  ...rest
}: ButtonProps) {
  const classes = [styles.button, styles[variant], styles[size], className]
    .filter(Boolean)
    .join(' ')
  return (
    <button
      {...rest}
      type={type}
      className={classes}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
    >
      {/* El texto se conserva (oculto) para que el botón no cambie de ancho. */}
      <span
        className={[styles.content, loading ? styles.loadingLabel : '']
          .filter(Boolean)
          .join(' ')}
      >
        {icon && <Icon name={icon} size={size === 'sm' ? 16 : 18} />}
        {children}
      </span>
      {loading && (
        <span className={styles.spinnerOverlay}>
          <span className={styles.spinner} aria-hidden="true" />
          <span className="sr-only">Cargando…</span>
        </span>
      )}
    </button>
  )
}
