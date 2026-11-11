import { apiRequest } from '@/services/api/client'
import { apiErrorMessage } from '@/services/api/errors'
import {
  clearApiSession,
  readApiSession,
  storeApiSession,
} from '@/services/api/session'
import { mapUser, type UserDto } from '@/services/api/users.service'
import type {
  OperationResult,
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

const TWO_FACTOR_MESSAGE =
  'Tu cuenta requiere verificación en dos pasos. Contacta al administrador del laboratorio.'

export function getApiCurrentSession(): Session | null {
  return readApiSession()?.session ?? null
}

export async function login(
  correo: string,
  contrasena: string,
): Promise<OperationResult<Session>> {
  try {
    const data = await apiRequest<LoginResponseDto>('/auth/login', {
      method: 'POST',
      body: { correo: correo.trim(), contrasena },
      auth: false,
    })
    if (data.requires2fa || !data.token || !data.session) {
      return { success: false, error: TWO_FACTOR_MESSAGE }
    }
    const session: Session = {
      userId: data.session.userId,
      role: data.session.role,
      nombre: data.session.nombre,
      correo: data.session.correo,
      expiresAt: data.session.expiresAt,
    }
    storeApiSession(data.token, session)
    return { success: true, data: session }
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
