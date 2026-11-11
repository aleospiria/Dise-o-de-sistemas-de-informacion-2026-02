import { apiRequest } from '@/services/api/client'
import type { User } from '@/shared/types'

export interface UserDto {
  idUsuario: string
  idRol: User['idRol']
  nombre: string
  correo: string
  cedula: string
  carnet?: string | null
  fechaRegistro: string
  sanctionEndDate?: string | null
}

export function mapUser(data: UserDto): User {
  return {
    idUsuario: data.idUsuario,
    idRol: data.idRol,
    nombre: data.nombre,
    correo: data.correo,
    cedula: data.cedula,
    carnet: data.carnet ?? undefined,
    contrasena: '',
    fechaRegistro: data.fechaRegistro,
    sanctionEndDate: data.sanctionEndDate ?? undefined,
  }
}

export async function listUsers(): Promise<User[]> {
  const users = await apiRequest<UserDto[]>('/users')
  return users.map(mapUser)
}

export async function updateUser(
  id: string,
  data: Partial<Omit<User, 'idUsuario' | 'fechaRegistro'>>,
): Promise<User> {
  const body: Record<string, unknown> = { ...data }
  delete body.contrasena
  const updated = await apiRequest<UserDto>(`/users/${id}`, {
    method: 'PATCH',
    body,
  })
  return mapUser(updated)
}
