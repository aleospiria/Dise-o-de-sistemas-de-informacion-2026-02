import { fireEvent, render, screen, within } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { describe, expect, it } from 'vitest'
import { AuthProvider } from '@/contexts/AuthProvider'
import { LS_KEYS } from '@/shared/constants/lsKeys'
import { getNavGroupsForRole } from '@/shared/constants/navigation'
import { loginUser } from '@/services/mockDb/auth.service'
import { seedData } from '@/services/mockDb/seed-data'
import { InMemoryStorageRepository } from '@/services/storage'
import { AppShell } from '@/shared/components/layout/AppShell'
import { AuthLayout } from '@/shared/components/layout/AuthLayout'
import { getRouteBreadcrumbs } from '@/shared/components/layout/routeBreadcrumbs'

// jsdom aplica el display:none base del menú móvil (el @media no se evalúa),
// así que los elementos del menú cerrado se consultan con `hidden: true`.
const ANY = { hidden: true } as const

const CREDENTIALS = {
  estudiante: ['estudiante@itm.edu.co', 'Estudiante123'],
  tecnico: ['tecnico@itm.edu.co', 'Tecnico123'],
  admin: ['admin@itm.edu.co', 'Admin123'],
} as const

function renderShell(
  path: string,
  user: keyof typeof CREDENTIALS = 'estudiante',
) {
  const repo = new InMemoryStorageRepository()
  seedData(repo)
  loginUser(CREDENTIALS[user][0], CREDENTIALS[user][1], repo)

  const utils = render(
    <AuthProvider repository={repo}>
      <MemoryRouter initialEntries={[path]}>
        <Routes>
          <Route path="/login" element={<p>pantalla de login</p>} />
          <Route element={<AppShell />}>
            <Route path="/dashboard" element={<p>contenido panel</p>} />
            <Route path="/availability" element={<p>contenido disponibilidad</p>} />
            <Route path="/inventory/new" element={<p>contenido nuevo recurso</p>} />
          </Route>
        </Routes>
      </MemoryRouter>
    </AuthProvider>,
  )
  return { repo, ...utils }
}

/**
 * El menú cerrado tiene display:none en su propio elemento, y entonces su
 * nombre accesible se calcula vacío: no se puede buscar por `name`. Se
 * localiza por id (el mismo que referencia la hamburguesa).
 */
function sidebarElement(): HTMLElement {
  const element = document.getElementById('app-nav')
  if (!element) throw new Error('No se encontró el menú lateral (#app-nav).')
  return element
}

function sidebar() {
  return within(sidebarElement())
}

describe('getNavGroupsForRole', () => {
  it('cada rol recibe solo sus grupos, sin grupos vacíos', () => {
    const ids = (role: Parameters<typeof getNavGroupsForRole>[0]) =>
      getNavGroupsForRole(role).map((g) => g.id)

    expect(ids('Estudiante')).toEqual(['principal', 'prestamos'])
    expect(ids('Técnico_Laboratorio')).toEqual(['principal', 'operaciones'])
    expect(ids('Administrador_Laboratorio')).toEqual([
      'principal',
      'operaciones',
      'administracion',
    ])
  })
})

describe('getRouteBreadcrumbs', () => {
  it('resuelve rutas con parámetros y enlaza los niveles previos', () => {
    const crumbs = getRouteBreadcrumbs('/inventory/abc-123/edit')
    expect(crumbs.map((c) => c.label)).toEqual(['Inicio', 'Inventario', 'Editar recurso'])
    expect(crumbs[0].href).toBe('/dashboard')
    expect(crumbs[1].href).toBe('/inventory')
    expect(crumbs[2].href).toBeUndefined()

    expect(getRouteBreadcrumbs('/loans/new/r-0001').map((c) => c.label)).toEqual([
      'Inicio',
      'Disponibilidad',
      'Solicitar préstamo',
    ])
  })

  it('la página de inicio tiene un único nivel y las rutas desconocidas ninguno', () => {
    expect(getRouteBreadcrumbs('/dashboard')).toHaveLength(1)
    expect(getRouteBreadcrumbs('/no-existe')).toEqual([])
  })

  it('tolera la barra final', () => {
    expect(getRouteBreadcrumbs('/inventory/')).toHaveLength(2)
  })
})

describe('AuthLayout', () => {
  it('centra el contenido público dentro de un <main>', () => {
    render(
      <MemoryRouter initialEntries={['/login']}>
        <Routes>
          <Route element={<AuthLayout />}>
            <Route path="/login" element={<p>formulario</p>} />
          </Route>
        </Routes>
      </MemoryRouter>,
    )
    expect(within(screen.getByRole('main')).getByText('formulario')).toBeInTheDocument()
    expect(screen.queryByRole('navigation', ANY)).not.toBeInTheDocument()
  })
})

describe('Sidebar: opciones por rol', () => {
  it('el estudiante ve sus opciones y no las de operación ni administración', () => {
    renderShell('/dashboard', 'estudiante')
    const menu = sidebar()
    expect(menu.getByRole('link', { name: 'Disponibilidad', ...ANY })).toBeInTheDocument()
    expect(menu.getByRole('link', { name: 'Mis préstamos', ...ANY })).toBeInTheDocument()
    expect(menu.queryByRole('link', { name: 'Entregas', ...ANY })).not.toBeInTheDocument()
    expect(menu.queryByRole('link', { name: 'Inventario', ...ANY })).not.toBeInTheDocument()
  })

  it('el técnico ve entregas y devoluciones, pero no préstamos ni inventario', () => {
    renderShell('/dashboard', 'tecnico')
    const menu = sidebar()
    expect(menu.getByRole('link', { name: 'Entregas', ...ANY })).toBeInTheDocument()
    expect(menu.getByRole('link', { name: 'Devoluciones', ...ANY })).toBeInTheDocument()
    expect(menu.queryByRole('link', { name: 'Mis préstamos', ...ANY })).not.toBeInTheDocument()
    expect(menu.queryByRole('link', { name: 'Inventario', ...ANY })).not.toBeInTheDocument()
  })

  it('el administrador ve inventario y operaciones, pero no "Mis préstamos"', () => {
    renderShell('/dashboard', 'admin')
    const menu = sidebar()
    expect(menu.getByRole('link', { name: 'Inventario', ...ANY })).toBeInTheDocument()
    expect(menu.getByRole('link', { name: 'Entregas', ...ANY })).toBeInTheDocument()
    expect(menu.queryByRole('link', { name: 'Mis préstamos', ...ANY })).not.toBeInTheDocument()
  })

  it('marca como actual solo la opción de la ruta visitada', () => {
    renderShell('/availability')
    const menu = sidebar()
    expect(menu.getByRole('link', { name: 'Disponibilidad', ...ANY })).toHaveAttribute(
      'aria-current',
      'page',
    )
    expect(menu.getByRole('link', { name: 'Inicio', ...ANY })).not.toHaveAttribute('aria-current')
  })

  it('cada sección se puede colapsar y expandir', () => {
    renderShell('/dashboard')
    const toggle = sidebar().getByRole('button', { name: 'Principal', ...ANY })
    const list = document.getElementById(toggle.getAttribute('aria-controls') as string)!

    expect(toggle).toHaveAttribute('aria-expanded', 'true')
    expect(list).not.toHaveAttribute('hidden')

    fireEvent.click(toggle)
    expect(toggle).toHaveAttribute('aria-expanded', 'false')
    expect(list).toHaveAttribute('hidden')

    fireEvent.click(toggle)
    expect(toggle).toHaveAttribute('aria-expanded', 'true')
    expect(list).not.toHaveAttribute('hidden')
  })
})

describe('AppShell', () => {
  it('expone los landmarks de la página y el enlace para saltar al contenido', () => {
    renderShell('/dashboard')
    expect(screen.getByRole('banner')).toBeInTheDocument()
    expect(screen.getByRole('main')).toHaveAttribute('id', 'main-content')
    expect(screen.getByRole('contentinfo')).toBeInTheDocument()
    expect(sidebarElement().tagName).toBe('NAV')
    expect(sidebarElement()).toHaveAttribute('aria-label', 'Navegación principal')
    expect(screen.getByRole('link', { name: 'Saltar al contenido' })).toHaveAttribute(
      'href',
      '#main-content',
    )
  })

  it('en el inicio muestra el título y no muestra migas de pan (Req 20.1)', () => {
    renderShell('/dashboard')
    expect(screen.getByRole('heading', { level: 1, name: 'Inicio' })).toBeInTheDocument()
    expect(screen.queryByRole('navigation', { name: 'Ruta de navegación', ...ANY })).not.toBeInTheDocument()
    expect(screen.getByText('contenido panel')).toBeInTheDocument()
  })

  it('en una subpágina el título coincide con la última miga (Req 20.10)', () => {
    renderShell('/inventory/new', 'admin')
    expect(screen.getByRole('heading', { level: 1, name: 'Nuevo recurso' })).toBeInTheDocument()
    const migas = within(screen.getByRole('navigation', { name: 'Ruta de navegación', ...ANY }))
    expect(migas.getByRole('link', { name: 'Inventario', ...ANY })).toHaveAttribute('href', '/inventory')
  })

  it('actualiza el título del documento por página', () => {
    renderShell('/availability')
    expect(document.title).toBe('Disponibilidad · Préstamo de recursos de laboratorio')
  })

  it('muestra el nombre y el rol del usuario autenticado', () => {
    renderShell('/dashboard', 'tecnico')
    expect(screen.getByText('Tomás Técnico')).toBeInTheDocument()
    expect(screen.getByText('Técnico Laboratorio')).toBeInTheDocument()
  })

  it('el botón de cerrar sesión termina la sesión y redirige al login', () => {
    const { repo } = renderShell('/dashboard')
    expect(repo.get(LS_KEYS.SESSION)).not.toBeNull()

    fireEvent.click(screen.getByRole('button', { name: 'Cerrar sesión' }))
    expect(screen.getByText('pantalla de login')).toBeInTheDocument()
    expect(repo.get(LS_KEYS.SESSION)).toBeNull()
  })

  it('el menú móvil empieza cerrado, se abre con la hamburguesa y se cierra al navegar', () => {
    renderShell('/dashboard')
    const burger = screen.getByRole('button', { name: 'Abrir menú' })
    expect(burger).toHaveAttribute('aria-expanded', 'false')
    expect(burger).toHaveAttribute('aria-controls', 'app-nav')
    expect(screen.queryByRole('navigation', { name: 'Navegación principal' })).not.toBeInTheDocument()

    fireEvent.click(burger)
    expect(screen.getByRole('button', { name: 'Cerrar menú' })).toHaveAttribute('aria-expanded', 'true')
    const menu = within(screen.getByRole('navigation', { name: 'Navegación principal' }))

    fireEvent.click(menu.getByRole('link', { name: 'Disponibilidad' }))
    expect(screen.getByRole('button', { name: 'Abrir menú' })).toHaveAttribute('aria-expanded', 'false')
    expect(screen.getByText('contenido disponibilidad')).toBeInTheDocument()
  })
})
