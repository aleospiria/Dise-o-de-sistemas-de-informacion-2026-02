import { apiRequest } from '@/services/api/client'
import type { Sanction, SanctionStatus } from '@/shared/types'

export function listSanctions(
  estado?: SanctionStatus,
  idUsuario?: string,
): Promise<Sanction[]> {
  const params = new URLSearchParams()
  if (estado) params.set('estado', estado)
  if (idUsuario) params.set('id_usuario', idUsuario)
  const suffix = params.size > 0 ? `?${params.toString()}` : ''
  return apiRequest<Sanction[]>(`/sanctions${suffix}`)
}

export function listMySanctions(): Promise<Sanction[]> {
  return apiRequest<Sanction[]>('/sanctions/me')
}

export function liftSanction(id: string): Promise<Sanction> {
  return apiRequest<Sanction>(`/sanctions/${id}/lift`, { method: 'POST' })
}
