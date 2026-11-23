import type { ReactNode } from 'react'
import styles from '@/shared/components/ui/Card.module.css'
import panelStyles from '@/shared/components/ui/DataPage.module.css'

export interface CardProps {
  /** Elemento HTML a dibujar; por defecto `div`. */
  as?: 'div' | 'section' | 'article' | 'li'
  /** Resalta la tarjeta al pasar el cursor (la acción debe ser un enlace o botón interior). */
  interactive?: boolean
  /** Sin relleno interior, para contenido que llega a los bordes (imagen, tabla). */
  flush?: boolean
  className?: string
  'aria-label'?: string
  'aria-labelledby'?: string
  children: ReactNode
}

/** Superficie base: borde sutil, sombra pequeña y radio del sistema. */
export function Card({
  as: Tag = 'div',
  interactive = false,
  flush = false,
  className,
  children,
  'aria-label': ariaLabel,
  'aria-labelledby': ariaLabelledBy,
}: CardProps) {
  const classes = [
    panelStyles.panel,
    styles.card,
    interactive ? styles.interactive : '',
    flush ? styles.flush : '',
    className,
  ]
    .filter(Boolean)
    .join(' ')
  return (
    <Tag className={classes} aria-label={ariaLabel} aria-labelledby={ariaLabelledBy}>
      {children}
    </Tag>
  )
}