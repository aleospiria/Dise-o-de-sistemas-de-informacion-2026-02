import type { ReactNode } from 'react'
import styles from '@/shared/components/ui/Badge.module.css'
import { Icon, type IconName } from '@/shared/components/ui/icons'

export type BadgeTone = 'green' | 'yellow' | 'blue' | 'orange' | 'gray' | 'red' | 'teal'

export interface BadgeProps {
  tone: BadgeTone
  /** Ícono decorativo; el significado siempre va en el texto. */
  icon?: IconName
  children: ReactNode
}

/** Chip de color con texto. Base de `StatusBadge` y `TypeBadge`. */
export function Badge({ tone, icon, children }: BadgeProps) {
  return (
    <span className={`${styles.badge} ${styles[tone]}`}>
      {icon && <Icon name={icon} size={14} />}
      {children}
    </span>
  )
}
