import { useState } from 'react'
import { NavLink } from 'react-router-dom'
import { useAuth } from '@/contexts/useAuth'
import styles from '@/shared/components/layout/Sidebar.module.css'
import { getNavGroupsForRole } from '@/shared/constants/navigation'

export interface SidebarProps {
  /** Id del elemento, para que el botón hamburguesa lo referencie. */
  id: string
  /** Solo afecta a móvil: en escritorio el menú siempre está visible. */
  open: boolean
  /** Se invoca al elegir una opción (para cerrar el menú en móvil). */
  onNavigate?: () => void
}

/**
 * Menú lateral. Muestra solo las opciones permitidas al rol de la sesión
 * (Req 19.4), resalta la sección activa (Req 20.7) y permite colapsar cada
 * sección (Req 20.6).
 */
export function Sidebar({ id, open, onNavigate }: SidebarProps) {
  const { session } = useAuth()
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({})

  const groups = session ? getNavGroupsForRole(session.role) : []

  return (
    <nav
      id={id}
      aria-label="Navegación principal"
      className={`${styles.sidebar} ${open ? styles.open : ''}`}
    >
      {groups.map((group) => {
        const isCollapsed = collapsed[group.id] ?? false
        const listId = `${id}-${group.id}`
        return (
          <div key={group.id} className={styles.group}>
            <button
              type="button"
              className={styles.groupToggle}
              aria-expanded={!isCollapsed}
              aria-controls={listId}
              onClick={() =>
                setCollapsed((current) => ({
                  ...current,
                  [group.id]: !isCollapsed,
                }))
              }
            >
              {group.label}
              <span className={styles.chevron} aria-hidden="true">
                ▾
              </span>
            </button>
            <ul id={listId} className={styles.list} hidden={isCollapsed}>
              {group.items.map((item) => (
                <li key={item.to}>
                  <NavLink
                    to={item.to}
                    onClick={onNavigate}
                    className={({ isActive }) =>
                      `${styles.link} ${isActive ? styles.linkActive : ''}`
                    }
                  >
                    {item.label}
                  </NavLink>
                </li>
              ))}
            </ul>
          </div>
        )
      })}
    </nav>
  )
}
