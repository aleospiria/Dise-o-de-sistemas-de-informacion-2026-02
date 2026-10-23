import { AuthContext, type AuthContextValue } from '@/contexts/AuthContext'
import { useRequiredContext } from '@/contexts/requireContext'

/** Acceso al estado de sesión y a las acciones de autenticación. */
export function useAuth(): AuthContextValue {
  return useRequiredContext(AuthContext, 'useAuth', 'AuthProvider')
}
