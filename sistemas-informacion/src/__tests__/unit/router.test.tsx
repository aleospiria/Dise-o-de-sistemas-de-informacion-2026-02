import { render, screen } from '@testing-library/react'
import { createMemoryRouter, RouterProvider } from 'react-router-dom'
import { describe, expect, it } from 'vitest'
import { AppProviders } from '@/app/providers'
import { appRoutes } from '@/app/router'
import { loginUser } from '@/services/mockDb/auth.service'
import { seedData } from '@/services/mockDb/seed-data'
import { InMemoryStorageRepository } from '@/services/storage'
import {
  ALL_ROLES,
  getRolesForRoute,
  NAV_GROUPS,
} from '@/shared/constants/navigation'
import type { UserRole } from '@/shared/types'

const USER_BY_ROLE: Record<UserRole, [string, string]> = {
  Estudiante: ['estudiante@itm.edu.co', 'Estudiante123'],
  Técnico_Laboratorio: ['tecnico@itm.edu.co', 'Tecnico123'],
  Administrador_Laboratorio: ['admin@itm.edu.co', 'Admin123'],
}

function renderRoute(path: string, role?: UserRole) {
  const repo = new InMemoryStorageRepository()
  seedData(repo)
  if (role) loginUser(USER_BY_ROLE[role][0], USER_BY_ROLE[role][1], repo)

  const router = createMemoryRouter(appRoutes, { initialEntries: [path] })
  const utils = render(
    <AppProviders repository={repo}>
      <RouterProvider router={router} />
    </AppProviders>,
  )
  return { router, ...utils }
}

const h1 = () => screen.getByRole('heading', { level: 1 })

describe('sin sesión (Req 1.11, 19.9)', () => {
  it.each(['/dashboard', '/availability', '/loans/my', '/inventory', '/access-denied'])(
    'redirige %s al inicio de sesión',
    (path) => {
      const { router } = renderRoute(path)
      expect(router.state.location.pathname).toBe('/login')
      expect(screen.getByText(/Tarea 11/)).toBeInTheDocument()
    },
  )

  it('la raíz / lleva a /dashboard y, sin sesión, a /login', () => {
    const { router } = renderRoute('/')
    expect(router.state.location.pathname).toBe('/login')
  })

  it('/login y /register son públicas y usan el layout sin menú', () => {
    renderRoute('/register')
    expect(screen.getByRole('main')).toHaveTextContent(/Tarea 11/)
    expect(document.getElementById('app-nav')).toBeNull()
  })
})

describe('con sesión', () => {
  it('la raíz / lleva al inicio dentro del shell', () => {
    const { router } = renderRoute('/', 'Estudiante')
    expect(router.state.location.pathname).toBe('/dashboard')
    expect(h1()).toHaveTextContent('Inicio')
    expect(document.getElementById('app-nav')).not.toBeNull()
  })

  it('las rutas dinámicas resuelven su parámetro y su título', () => {
    renderRoute('/loans/new/r-0001', 'Estudiante')
    expect(h1()).toHaveTextContent('Solicitar préstamo')

    renderRoute('/inventory/r-0001/edit', 'Administrador_Laboratorio')
    expect(screen.getAllByRole('heading', { level: 1 }).at(-1)).toHaveTextContent('Editar recurso')
  })
})

describe('control de acceso por rol (Req 19.2, 19.3)', () => {
  it('un estudiante que intenta entrar a inventario ve "Acceso denegado"', () => {
    const { router } = renderRoute('/inventory', 'Estudiante')
    expect(router.state.location.pathname).toBe('/access-denied')
    expect(h1()).toHaveTextContent('Acceso denegado')
    expect(screen.getByRole('link', { name: 'Volver al inicio' })).toHaveAttribute('href', '/dashboard')
  })

  it('el técnico no accede a inventario ni a préstamos de estudiante', () => {
    expect(renderRoute('/inventory/new', 'Técnico_Laboratorio').router.state.location.pathname).toBe(
      '/access-denied',
    )
    expect(renderRoute('/loans/my', 'Técnico_Laboratorio').router.state.location.pathname).toBe(
      '/access-denied',
    )
  })

  it('el técnico sí accede a entregas y devoluciones', () => {
    renderRoute('/returns', 'Técnico_Laboratorio')
    expect(h1()).toHaveTextContent('Devoluciones')
  })

  // Garantiza que el menú y el router salen de la misma fuente: para cada
  // opción del menú y cada rol, el router deja pasar exactamente a quien el
  // Sidebar le muestra la opción.
  const cases = NAV_GROUPS.flatMap((group) => group.items).flatMap((item) =>
    ALL_ROLES.map((role) => ({ to: item.to, role })),
  )

  it.each(cases)('$role → $to coincide con el menú', ({ to, role }) => {
    const { router } = renderRoute(to, role)
    const permitido = getRolesForRoute(to).includes(role)
    expect(router.state.location.pathname).toBe(permitido ? to : '/access-denied')
  })
})

describe('rutas inexistentes', () => {
  it('muestra la página 404 a un usuario con sesión, sin pasar por el shell', () => {
    renderRoute('/no-existe', 'Estudiante')
    expect(h1()).toHaveTextContent('Página no encontrada')
    expect(document.getElementById('app-nav')).toBeNull()
  })

  it('también la muestra a un usuario sin sesión', () => {
    const { router } = renderRoute('/otra/ruta/rara')
    expect(router.state.location.pathname).toBe('/otra/ruta/rara')
    expect(h1()).toHaveTextContent('Página no encontrada')
  })
})

describe('getRolesForRoute', () => {
  it('lanza si la ruta no está en el menú', () => {
    expect(() => getRolesForRoute('/no-esta')).toThrow(/no está registrada/)
  })

  it('entregas y devoluciones comparten roles', () => {
    expect(getRolesForRoute('/returns')).toEqual(getRolesForRoute('/deliveries'))
  })
})
