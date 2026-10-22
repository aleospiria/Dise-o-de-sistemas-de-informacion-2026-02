/**
 * Servicio de usuarios (mock).
 * SOLID M2 (DIP): depende de `StorageRepository`.
 */
import { LS_KEYS } from '@/shared/constants/lsKeys'
import {
  localStorageRepository,
  type StorageRepository,
} from '@/services/storage'
import type { OperationResult, User } from '@/shared/types'

function readUsers(repo: StorageRepository): User[] {
  return repo.get<User[]>(LS_KEYS.USERS) ?? []
}

export function getUsers(
  repo: StorageRepository = localStorageRepository,
): User[] {
  return readUsers(repo)
}

export function getUserById(
  id: string,
  repo: StorageRepository = localStorageRepository,
): User | undefined {
  return readUsers(repo).find((u) => u.idUsuario === id)
}

/**
 * Actualiza datos de un usuario. El id y la fecha de registro no se pueden
 * modificar.
 */
export function updateUser(
  id: string,
  data: Partial<Omit<User, 'idUsuario' | 'fechaRegistro'>>,
  repo: StorageRepository = localStorageRepository,
): OperationResult<User> {
  const users = readUsers(repo)
  const idx = users.findIndex((u) => u.idUsuario === id)
  if (idx === -1) {
    return { success: false, error: 'Usuario no encontrado.' }
  }
  const actualizado: User = { ...users[idx], ...data }
  users[idx] = actualizado
  repo.set(LS_KEYS.USERS, users)
  return { success: true, data: actualizado }
}
