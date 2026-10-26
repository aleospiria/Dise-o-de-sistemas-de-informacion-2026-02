import type { ReactNode } from 'react'
import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '@/contexts/useAuth'
import type { UserRole } from '@/shared/types'

export interface RoleGuardProps {
  allowedRoles: UserRole[]
  children?: ReactNode
}

/**
 * Restringe el acceso por rol (Req 19.1–19.3). Sin sesión redirige a
 * `/login`; con un rol no permitido, a `/access-denied`. Agregar un rol nuevo
 * no modifica el guard: solo cambia la lista `allowedRoles` (SOLID OCP).
 */
export function RoleGuard({ allowedRoles, children }: RoleGuardProps) {
  const { session } = useAuth()

  if (!session) {
    return <Navigate to="/login" replace />
  }
  if (!allowedRoles.includes(session.role)) {
    return <Navigate to="/access-denied" replace />
  }
  return <>{children ?? <Outlet />}</>
}
