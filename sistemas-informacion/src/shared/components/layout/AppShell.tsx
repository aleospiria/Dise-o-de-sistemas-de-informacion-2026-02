import { useEffect, useState } from 'react'
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '@/contexts/useAuth'
import styles from '@/shared/components/layout/AppShell.module.css'
import { Sidebar } from '@/shared/components/layout/Sidebar'
import { getRouteBreadcrumbs } from '@/shared/components/layout/routeBreadcrumbs'
import { Breadcrumb } from '@/shared/components/ui/Breadcrumb'
import { Button } from '@/shared/components/ui/Button'

const APP_NAME = 'Préstamo de recursos de laboratorio'
const NAV_ID = 'app-nav'

/**
 * Estructura de las páginas autenticadas: encabezado con usuario y cierre de
 * sesión (Req 1.9), menú lateral, migas de pan, título de página y pie.
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

  const crumbs = getRouteBreadcrumbs(pathname)
  const title = crumbs.length > 0 ? crumbs[crumbs.length - 1].label : APP_NAME
  // Sin migas en la página de inicio (Req 20.1).
  const showBreadcrumb = crumbs.length > 1

  useEffect(() => {
    document.title = `${title} · ${APP_NAME}`
  }, [title])

  function handleLogout() {
    logout()
    navigate('/login', { replace: true })
  }

  return (
    <div className={styles.shell}>
      <a href="#main-content" className={styles.skipLink}>
        Saltar al contenido
      </a>

      <header className={styles.header}>
        <button
          type="button"
          className={styles.menuButton}
          aria-label={menuOpen ? 'Cerrar menú' : 'Abrir menú'}
          aria-expanded={menuOpen}
          aria-controls={NAV_ID}
          onClick={() => setMenuOpen((open) => !open)}
        >
          <span aria-hidden="true">{menuOpen ? '✕' : '☰'}</span>
        </button>
        <Link to="/dashboard" className={styles.brand}>
          {APP_NAME}
        </Link>
        <div className={styles.user}>
          {session && (
            <div className={styles.userInfo}>
              <span className={styles.userName}>{session.nombre}</span>
              <span className={styles.userRole}>
                {session.role.replaceAll('_', ' ')}
              </span>
            </div>
          )}
          <Button variant="secondary" size="sm" onClick={handleLogout}>
            Cerrar sesión
          </Button>
        </div>
      </header>

      <div className={styles.body}>
        <Sidebar
          id={NAV_ID}
          open={menuOpen}
          onNavigate={() => setMenuOpen(false)}
        />
        <div className={styles.content}>
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
    </div>
  )
}
