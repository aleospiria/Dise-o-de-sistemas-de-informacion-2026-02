import {
  createBrowserRouter,
  Navigate,
  type RouteObject,
} from 'react-router-dom'
import { DashboardPage } from '@/features/dashboard/pages/DashboardPage'
import { LoginPage } from '@/features/auth/pages/LoginPage'
import { RegisterPage } from '@/features/auth/pages/RegisterPage'
import { AvailabilityPage } from '@/features/loans/pages/AvailabilityPage'
import { LoanFormPage } from '@/features/loans/pages/LoanFormPage'
import { MyLoansPage } from '@/features/loans/pages/MyLoansPage'
import { InventoryPage } from '@/features/inventory/pages/InventoryPage'
import { ResourceFormPage } from '@/features/inventory/pages/ResourceFormPage'
import { DeliveryPage } from '@/features/operations/pages/DeliveryPage'
import { ReturnPage } from '@/features/operations/pages/ReturnPage'
import { AccessDeniedPage } from '@/shared/components/guards/AccessDeniedPage'
import { GuestRoute } from '@/shared/components/guards/GuestRoute'
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
 * desincronizarse.
 */
export const appRoutes: RouteObject[] = [
  { path: '/', element: <Navigate to="/dashboard" replace /> },

  // Públicas, solo para invitados: con sesión activa redirigen al inicio
  {
    element: <GuestRoute />,
    children: [
      {
        element: <AuthLayout />,
        children: [
          { path: '/login', element: <LoginPage /> },
          { path: '/register', element: <RegisterPage /> },
        ],
      },
    ],
  },

  // Autenticadas (requieren sesión) dentro del shell con menú y migas
  {
    element: <PrivateRoute />,
    children: [
      {
        element: <AppShell />,
        children: [
          { path: '/dashboard', element: <DashboardPage /> },
          { path: '/availability', element: <AvailabilityPage /> },
          { path: '/access-denied', element: <AccessDeniedPage /> },

          guarded(getRolesForRoute('/loans/my'), [
            { path: '/loans/new/:resourceId', element: <LoanFormPage /> },
            { path: '/loans/my', element: <MyLoansPage /> },
          ]),

          guarded(getRolesForRoute('/deliveries'), [
            { path: '/deliveries', element: <DeliveryPage /> },
            { path: '/returns', element: <ReturnPage /> },
          ]),

          guarded(getRolesForRoute('/inventory'), [
            { path: '/inventory', element: <InventoryPage /> },
            { path: '/inventory/new', element: <ResourceFormPage /> },
            { path: '/inventory/:id/edit', element: <ResourceFormPage /> },
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
