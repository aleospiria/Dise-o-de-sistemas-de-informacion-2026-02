import { apiRequest } from '@/services/api/client'
import type { TwoFactorSetup, User } from '@/shared/types'
import { mapUser, type UserDto } from '@/services/api/users.service'

export async function getCurrentUser(): Promise<User> {
  const user = await apiRequest<UserDto>('/auth/me')
  return mapUser(user)
}

export function setupTwoFactor(): Promise<TwoFactorSetup> {
  return apiRequest<TwoFactorSetup>('/auth/2fa/setup', { method: 'POST' })
}

export async function enableTwoFactor(codigo: string): Promise<User> {
  const user = await apiRequest<UserDto>('/auth/2fa/enable', {
    method: 'POST',
    body: { codigo },
  })
  return mapUser(user)
}

export async function disableTwoFactor(contrasena: string): Promise<User> {
  const user = await apiRequest<UserDto>('/auth/2fa/disable', {
    method: 'POST',
    body: { contrasena },
  })
  return mapUser(user)
}
