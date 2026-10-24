import type { ComponentProps } from 'react'
import styles from '@/shared/components/ui/Button.module.css'

export type ButtonVariant = 'primary' | 'secondary' | 'danger' | 'ghost'
export type ButtonSize = 'sm' | 'md' | 'lg'

export interface ButtonProps extends ComponentProps<'button'> {
  variant?: ButtonVariant
  size?: ButtonSize
  /** Muestra un spinner centrado y bloquea el botón (Req 18.2, 18.5). */
  loading?: boolean
}

export function Button({
  variant = 'primary',
  size = 'md',
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
      <span className={loading ? styles.loadingLabel : undefined}>{children}</span>
      {loading && (
        <span className={styles.spinnerOverlay}>
          <span className={styles.spinner} aria-hidden="true" />
          <span className="sr-only">Cargando…</span>
        </span>
      )}
    </button>
  )
}
