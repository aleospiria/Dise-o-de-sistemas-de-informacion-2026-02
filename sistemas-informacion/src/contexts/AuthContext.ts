import { createContext } from 'react'
import type {
  AuthLoginResult,
  MaybePromise,
  OperationResult,
  PasswordResetConfirmData,
  PasswordResetRequestInfo,
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
  ) => MaybePromise<AuthLoginResult>
  verifyTwoFactor: (
    challengeToken: string,
    codigo: string,
  ) => MaybePromise<OperationResult<Session>>
  requestPasswordReset: (
    correo: string,
  ) => MaybePromise<OperationResult<PasswordResetRequestInfo>>
  confirmPasswordReset: (
    data: PasswordResetConfirmData,
  ) => MaybePromise<OperationResult<string>>
  logout: () => void
  register: (data: RegisterFormData) => MaybePromise<OperationResult<User>>
}

export const AuthContext = createContext<AuthContextValue | undefined>(
  undefined,
)
