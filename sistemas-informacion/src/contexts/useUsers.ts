import {
  UsersContext,
  type UsersContextValue,
} from '@/contexts/AppDataContext'
import { useRequiredContext } from '@/contexts/requireContext'

/** Usuarios registrados y sus operaciones (dominio de usuarios). */
export function useUsers(): UsersContextValue {
  return useRequiredContext(UsersContext, 'useUsers', 'AppDataProvider')
}
