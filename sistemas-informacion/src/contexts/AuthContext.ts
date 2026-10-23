import { createContext } from 'react'
import type {
  OperationResult,
  RegisterFormData,
  Session,
  User,
} from '@/shared/types'

export interface AuthContextValue {
  /** Sesión activa, o `null` si no hay usuario autenticado. */
  session: Session | null
  login: (correo: string, contrasena: string) => OperationResult<Session>
  logout: () => void
  register: (data: RegisterFormData) => OperationResult<User>
}

export const AuthContext = createContext<AuthContextValue | undefined>(
  undefined,
)
