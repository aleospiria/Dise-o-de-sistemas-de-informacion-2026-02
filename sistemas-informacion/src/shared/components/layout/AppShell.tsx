import { useEffect, useRef, useState } from 'react'
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '@/contexts/useAuth'
import styles from '@/shared/components/layout/AppShell.module.css'
import { Sidebar } from '@/shared/components/layout/Sidebar'
import { getRouteBreadcrumbs } from '@/shared/components/layout/routeBreadcrumbs'
import { Breadcrumb } from '@/shared/components/ui/Breadcrumb'
import { Button } from '@/shared/components/ui/Button'
import { Icon } from '@/shared/components/ui/icons'
import { APP_NAME } from '@/shared/constants/app'
import { ROLE_LABELS } from '@/shared/constants/roles'
import { useDocumentTitle } from '@/shared/hooks/useDocumentTitle'

const NAV_ID = 'app-nav'

/** Iniciales para el avatar: primera letra de las dos primeras palabras. */
function getInitials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0].toUpperCase())
    .join('')
}

/**
 * Estructura de las páginas autenticadas: menú lateral, encabezado con usuario
 * y cierre de sesión (Req 1.9), migas de pan, título de página y pie.
 * Úsalo como layout route; el contenido de cada página entra por `<Outlet />`.
 *
 * El shell dibuja el único `<h1>` de la página (Req 20.10), tomado del último
 * nivel de las migas; las páginas deben usar `<h2>` para sus secciones.
 */
export function AppShell() {
  const { session, logout } = useAuth()
  const { pathname } = useLocation()
  const navigate = useNavigate()
  const [menuOpen, setMenuOpen] = useState(false)
  const menuButtonRef = useRef<HTMLButtonElement>(null)
  const crumbs = getRouteBreadcrumbs(pathname)
  const title = crumbs.length > 0 ? crumbs[crumbs.length - 1].label : APP_NAME
  // Sin migas en la página de inicio (Req 20.1).
  const showBreadcrumb = crumbs.length > 1
  useDocumentTitle(title)

  // Escape cierra el menú móvil y devuelve el foco a la hamburguesa.
  useEffect(() => {
    if (!menuOpen) return
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key !== 'Escape') return
      setMenuOpen(false)
      menuButtonRef.current?.focus()
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [menuOpen])

  function handleLogout() {
    logout()
    navigate('/login', { replace: true })
  }

  return (
    <div className={styles.shell}>
      <a href="#main-content" className={styles.skipLink}>
        Saltar al contenido
      </a>
      <Sidebar
        id={NAV_ID}
        open={menuOpen}
        onNavigate={() => setMenuOpen(false)}
      />
      {menuOpen && (
        <div
          className={styles.scrim}
          aria-hidden="true"
          onClick={() => setMenuOpen(false)}
        />
      )}
      <div className={styles.column}>
        <header className={styles.header}>
          <button
            ref={menuButtonRef}
            type="button"
            className={styles.menuButton}
            aria-label={menuOpen ? 'Cerrar menú' : 'Abrir menú'}
            aria-expanded={menuOpen}
            aria-controls={NAV_ID}
            onClick={() => setMenuOpen((open) => !open)}
          >
            <Icon name={menuOpen ? 'close' : 'menu'} size={22} />
          </button>
          <Link to="/dashboard" className={styles.brand}>
            <span className={styles.brandMark}>
              <Icon name="flask" size={20} />
            </span>
            <span className={styles.brandName}>{APP_NAME}</span>
          </Link>
          <div className={styles.user}>
            {session && (
              <>
                <span className={styles.avatar} aria-hidden="true">
                  {getInitials(session.nombre)}
                </span>
                <div className={styles.userInfo}>
                  <span className={styles.userName}>{session.nombre}</span>
                  <span className={styles.userRole}>{ROLE_LABELS[session.role]}</span>
                </div>
              </>
            )}
            <Button
              variant="secondary"
              size="sm"
              icon="log-out"
              onClick={handleLogout}
            >
              <span className={styles.logoutLabel}>Cerrar sesión</span>
            </Button>
          </div>
        </header>
        <main id="main-content" tabIndex={-1} className={styles.main}>
          {showBreadcrumb && <Breadcrumb items={crumbs} />}
          <h1 className={styles.title}>{title}</h1>
          <Outlet />
        </main>
        <footer className={styles.footer}>
          © {new Date().getFullYear()} {APP_NAME}
        </footer>
      </div>
    </div>
  )
}
