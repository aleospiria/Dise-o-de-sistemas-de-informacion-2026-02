import { createContext } from 'react'
import type {
  MaybePromise,
  OperationResult,
  RegisterFormData,
  Session,
  User,
} from '@/shared/types'

export interface AuthContextValue {
  /** Sesión activa, o `null` si no hay usuario autenticado. */
  session: Session | null
  login: (
    correo: string,
    contrasena: string,
  ) => MaybePromise<OperationResult<Session>>
  logout: () => void
  register: (data: RegisterFormData) => MaybePromise<OperationResult<User>>
}

export const AuthContext = createContext<AuthContextValue | undefined>(
  undefined,
)
