import {
  createBrowserRouter,
  Navigate,
  type RouteObject,
} from 'react-router-dom'
import { PendingPage } from '@/app/PendingPage'
import { AccessDeniedPage } from '@/shared/components/guards/AccessDeniedPage'
import { PrivateRoute } from '@/shared/components/guards/PrivateRoute'
import { RoleGuard } from '@/shared/components/guards/RoleGuard'
import { AppShell } from '@/shared/components/layout/AppShell'
import { AuthLayout } from '@/shared/components/layout/AuthLayout'
import { getRolesForRoute } from '@/shared/constants/navigation'
import { NotFoundPage } from '@/shared/pages/NotFoundPage'
import type { UserRole } from '@/shared/types'

/** Agrupa rutas bajo un `RoleGuard` sin agregar un nivel a la URL. */
function guarded(allowedRoles: UserRole[], children: RouteObject[]): RouteObject {
  return { element: <RoleGuard allowedRoles={allowedRoles} />, children }
}

/**
 * Tabla de rutas de la aplicación (design.md — "Routing Strategy").
 *
 * Los roles de cada grupo salen de `navigation.ts`, la misma fuente del menú,
 * para que lo que se ve en el `Sidebar` y lo que permite el router no puedan
 * desincronizarse. Las páginas con `PendingPage` son provisionales.
 */
export const appRoutes: RouteObject[] = [
  { path: '/', element: <Navigate to="/dashboard" replace /> },

  // Públicas
  {
    element: <AuthLayout />,
    children: [
      { path: '/login', element: <PendingPage task="Tarea 11" /> },
      { path: '/register', element: <PendingPage task="Tarea 11" /> },
    ],
  },

  // Autenticadas (requieren sesión) dentro del shell con menú y migas
  {
    element: <PrivateRoute />,
    children: [
      {
        element: <AppShell />,
        children: [
          { path: '/dashboard', element: <PendingPage task="Tarea 17" /> },
          { path: '/availability', element: <PendingPage task="Tarea 13" /> },
          { path: '/access-denied', element: <AccessDeniedPage /> },

          guarded(getRolesForRoute('/loans/my'), [
            { path: '/loans/new/:resourceId', element: <PendingPage task="Tarea 14" /> },
            { path: '/loans/my', element: <PendingPage task="Tarea 14" /> },
          ]),

          guarded(getRolesForRoute('/deliveries'), [
            { path: '/deliveries', element: <PendingPage task="Tarea 16" /> },
            { path: '/returns', element: <PendingPage task="Tarea 16" /> },
          ]),

          guarded(getRolesForRoute('/inventory'), [
            { path: '/inventory', element: <PendingPage task="Tarea 12" /> },
            { path: '/inventory/new', element: <PendingPage task="Tarea 12" /> },
            { path: '/inventory/:id/edit', element: <PendingPage task="Tarea 12" /> },
          ]),
        ],
      },
    ],
  },

  { path: '*', element: <NotFoundPage /> },
]

export function createAppRouter() {
  return createBrowserRouter(appRoutes)
}
