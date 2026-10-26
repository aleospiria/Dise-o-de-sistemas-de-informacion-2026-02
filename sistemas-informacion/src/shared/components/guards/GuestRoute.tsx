import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '@/contexts/useAuth'

/**
 * Inverso de `PrivateRoute`: para pantallas solo de invitados (inicio de
 * sesión y registro). Con una sesión activa redirige al inicio.
 */
export function GuestRoute() {
  const { session } = useAuth()

  if (session) {
    return <Navigate to="/dashboard" replace />
  }
  return <Outlet />
}
