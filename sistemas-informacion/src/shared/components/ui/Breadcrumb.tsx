import { Link } from 'react-router-dom'
import styles from '@/shared/components/ui/Breadcrumb.module.css'

export interface BreadcrumbItem {
  label: string
  /** Ausente en el último elemento (la página actual). */
  href?: string
}

export interface BreadcrumbProps {
  items: BreadcrumbItem[]
}

/**
 * Ruta de navegación (Req 20.1–20.5). El último elemento es la página actual:
 * no es un enlace y se marca con `aria-current="page"`. En móvil se reduce al
 * nivel actual más un botón "Atrás" hacia la página padre.
 */
export function Breadcrumb({ items }: BreadcrumbProps) {
  if (items.length === 0) return null

  const current = items[items.length - 1]
  const parent = items.length > 1 ? items[items.length - 2] : undefined

  return (
    <nav aria-label="Ruta de navegación">
      <ol className={`${styles.list} ${styles.desktop}`}>
        {items.map((item, index) => {
          const isCurrent = index === items.length - 1
          return (
            <li key={`${item.label}-${index}`} className={styles.item}>
              {isCurrent || !item.href ? (
                <span
                  className={styles.current}
                  aria-current={isCurrent ? 'page' : undefined}
                >
                  {item.label}
                </span>
              ) : (
                <Link to={item.href} className={styles.link}>
                  {item.label}
                </Link>
              )}
            </li>
          )
        })}
      </ol>

      <div className={styles.mobile}>
        {parent?.href && (
          <Link to={parent.href} className={styles.link}>
            ‹ Atrás
          </Link>
        )}
        <span className={styles.current} aria-current="page">
          {current.label}
        </span>
      </div>
    </nav>
  )
}
