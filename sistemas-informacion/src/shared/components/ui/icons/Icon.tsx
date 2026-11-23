import type { ComponentProps } from 'react'
import styles from '@/shared/components/ui/icons/Icon.module.css'
import { ICON_NODES, type IconName } from '@/shared/components/ui/icons/iconNodes'

export interface IconProps extends Omit<ComponentProps<'svg'>, 'children' | 'name'> {
  name: IconName
  /** Lado en píxeles (el ícono es cuadrado). */
  size?: number
  /**
   * Nombre accesible. Sin él el ícono es decorativo (`aria-hidden`): úsalo
   * solo cuando el ícono comunica algo que no está ya en el texto cercano.
   */
  title?: string
}

/**
 * Ícono SVG propio (24×24, trazo de 2 px, hereda el color del texto con
 * `currentColor`). Decorativo por defecto, para no duplicar el texto del
 * botón o enlace que lo contiene.
 */
export function Icon({ name, size = 20, title, className, ...rest }: IconProps) {
  const classes = [styles.icon, className].filter(Boolean).join(' ')
  return (
    <svg
      {...rest}
      className={classes}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      role={title ? 'img' : undefined}
      aria-label={title}
      aria-hidden={title ? undefined : true}
      focusable="false"
    >
      {ICON_NODES[name]}
    </svg>
  )
}
