import type { ReactNode } from 'react'
import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '@/contexts/useAuth'

/**
 * Exige sesión activa (Req 1.11, 19.9). Sin sesión redirige a `/login`.
 * Se usa como layout route (renderiza `<Outlet />`) o envolviendo `children`.
 * Depende de la abstracción `useAuth`, no de dónde se guarda la sesión.
 */
export function PrivateRoute({ children }: { children?: ReactNode }) {
  const { session } = useAuth()

  if (!session) {
    return <Navigate to="/login" replace />
  }
  return <>{children ?? <Outlet />}</>
}
