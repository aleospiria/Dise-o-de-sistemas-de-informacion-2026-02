import { apiRequest } from '@/services/api/client'
import { apiErrorMessage } from '@/services/api/errors'
import {
  clearApiSession,
  readApiSession,
  storeApiSession,
} from '@/services/api/session'
import { mapUser, type UserDto } from '@/services/api/users.service'
import type {
  AuthLoginResult,
  OperationResult,
  PasswordResetConfirmData,
  PasswordResetRequestInfo,
  RegisterFormData,
  Session,
  User,
} from '@/shared/types'

interface SessionDto {
  userId: string
  role: Session['role']
  nombre: string
  correo: string
  expiresAt: string
}

interface LoginResponseDto {
  requires2fa: boolean
  challengeToken: string | null
  token: string | null
  session: SessionDto | null
}

interface PasswordResetResponseDto {
  message: string
  resetToken: string | null
  resetUrl: string | null
  expiresAt: string | null
}

interface MessageDto {
  message: string
}

const TWO_FACTOR_REQUIRED_MESSAGE =
  'Ingresa el código de tu aplicación autenticadora.'
const TWO_FACTOR_INCOMPLETE_MESSAGE =
  'No se pudo iniciar la verificación en dos pasos. Intenta de nuevo.'

function mapSession(data: SessionDto): Session {
  return {
    userId: data.userId,
    role: data.role,
    nombre: data.nombre,
    correo: data.correo,
    expiresAt: data.expiresAt,
  }
}

function sessionResult(data: LoginResponseDto): OperationResult<Session> {
  if (!data.token || !data.session) {
    return { success: false, error: TWO_FACTOR_INCOMPLETE_MESSAGE }
  }
  const session = mapSession(data.session)
  storeApiSession(data.token, session)
  return { success: true, data: session }
}

export function getApiCurrentSession(): Session | null {
  return readApiSession()?.session ?? null
}

export async function login(
  correo: string,
  contrasena: string,
): Promise<AuthLoginResult> {
  try {
    const data = await apiRequest<LoginResponseDto>('/auth/login', {
      method: 'POST',
      body: { correo: correo.trim(), contrasena },
      auth: false,
    })
    if (data.requires2fa) {
      return {
        success: false,
        error: data.challengeToken
          ? TWO_FACTOR_REQUIRED_MESSAGE
          : TWO_FACTOR_INCOMPLETE_MESSAGE,
        requires2fa: true,
        challengeToken: data.challengeToken ?? undefined,
      }
    }
    return sessionResult(data)
  } catch (error) {
    return { success: false, error: apiErrorMessage(error) }
  }
}

export async function verifyTwoFactor(
  challengeToken: string,
  codigo: string,
): Promise<OperationResult<Session>> {
  try {
    const data = await apiRequest<LoginResponseDto>('/auth/2fa/verify', {
      method: 'POST',
      body: { challengeToken, codigo },
      auth: false,
    })
    return sessionResult(data)
  } catch (error) {
    return { success: false, error: apiErrorMessage(error) }
  }
}

export async function requestPasswordReset(
  correo: string,
): Promise<OperationResult<PasswordResetRequestInfo>> {
  try {
    const data = await apiRequest<PasswordResetResponseDto>(
      '/auth/password-reset/request',
      {
        method: 'POST',
        body: { correo: correo.trim() },
        auth: false,
      },
    )
    return {
      success: true,
      data: {
        message: data.message,
        resetToken: data.resetToken ?? undefined,
        resetUrl: data.resetUrl ?? undefined,
        expiresAt: data.expiresAt ?? undefined,
      },
    }
  } catch (error) {
    return { success: false, error: apiErrorMessage(error) }
  }
}

export async function confirmPasswordReset(
  data: PasswordResetConfirmData,
): Promise<OperationResult<string>> {
  try {
    const response = await apiRequest<MessageDto>(
      '/auth/password-reset/confirm',
      {
        method: 'POST',
        body: data,
        auth: false,
      },
    )
    return { success: true, data: response.message }
  } catch (error) {
    return { success: false, error: apiErrorMessage(error) }
  }
}

export async function register(
  data: RegisterFormData,
): Promise<OperationResult<User>> {
  try {
    const created = await apiRequest<UserDto>('/auth/register', {
      method: 'POST',
      body: data,
      auth: false,
    })
    return { success: true, data: mapUser(created) }
  } catch (error) {
    return { success: false, error: apiErrorMessage(error) }
  }
}

export function logout(): void {
  clearApiSession()
}
