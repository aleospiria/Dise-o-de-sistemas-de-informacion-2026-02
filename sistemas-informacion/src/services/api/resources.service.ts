import { apiDownload, apiRequest } from '@/services/api/client'
import type {
  CreateResourceData,
  Resource,
  ResourceAvailability,
  ResourceCalendar,
  ResourceFilters,
  ResourceStatus,
} from '@/shared/types'

export interface ResourceAvailabilityRow extends Resource, ResourceAvailability {}


interface AvailabilityResponse {
  disponible: boolean
  cantidadDisponible: number
  reservasActivas: number
  proximaDisponibilidad: string | null
}

function sortByName<T extends Resource>(resources: T[]): T[] {
  return [...resources].sort((a, b) => a.nombre.localeCompare(b.nombre, 'es'))
}

export async function listResources(): Promise<Resource[]> {
  const resources = await apiRequest<Resource[]>('/resources?incluir_baja=true')
  return sortByName(resources)
}

export async function getAvailableResources(
  start: string,
  end: string,
  filters?: ResourceFilters,
): Promise<Resource[]> {
  const params = new URLSearchParams({ inicio: start, fin: end })
  if (filters?.nombre) params.set('nombre', filters.nombre)
  if (filters?.tipo) params.set('tipo', filters.tipo)
  const resources = await apiRequest<Resource[]>(
    `/resources/available?${params.toString()}`,
  )
  return sortByName(resources)
}

export async function getResourcesAvailability(
  start: string,
  end: string,
  filters?: ResourceFilters,
): Promise<ResourceAvailabilityRow[]> {
  const params = new URLSearchParams({ inicio: start, fin: end })
  if (filters?.nombre) params.set('nombre', filters.nombre)
  if (filters?.tipo) params.set('tipo', filters.tipo)
  const rows = await apiRequest<ResourceAvailabilityRow[]>(
    `/resources/availability?${params.toString()}`,
  )
  return sortByName(rows)
}

export async function getResourceCalendar(
  resourceId: string,
  desde: string,
  hasta: string,
): Promise<ResourceCalendar> {
  const params = new URLSearchParams({ desde, hasta })
  return apiRequest<ResourceCalendar>(
    `/resources/${resourceId}/calendar?${params.toString()}`,
  )
}

export function exportResourcesCsv(): Promise<Blob> {
  return apiDownload('/resources/export/csv')
}

export async function importResources(
  archivo: File,
  confirmar: boolean,
): Promise<{
  confirmado: boolean
  totalFilas: number
  filasValidas: number
  creados: number
  actualizados: number
  filas: unknown[]
  errores: { fila: number; error: string }[]
}> {
  const body = new FormData()
  body.append('archivo', archivo)
  body.append('confirmar', String(confirmar))
  return apiRequest('/resources/import', { method: 'POST', body })
}

export async function getResourceAvailability(
  resourceId: string,
  start: string,
  end: string,
): Promise<ResourceAvailability> {
  const params = new URLSearchParams({ inicio: start, fin: end })
  const data = await apiRequest<AvailabilityResponse>(
    `/resources/${resourceId}/availability?${params.toString()}`,
  )
  return {
    disponible: data.disponible,
    cantidadDisponible: data.cantidadDisponible,
    reservasActivas: data.reservasActivas,
    proximaDisponibilidad: data.proximaDisponibilidad ?? undefined,
  }
}

export async function checkAvailability(
  resourceId: string,
  start: string,
  end: string,
): Promise<boolean> {
  const data = await getResourceAvailability(resourceId, start, end)
  return data.disponible
}

export function createResource(data: CreateResourceData): Promise<Resource> {
  return apiRequest<Resource>('/resources', { method: 'POST', body: data })
}

export function updateResource(
  id: string,
  data: Partial<CreateResourceData>,
): Promise<Resource> {
  return apiRequest<Resource>(`/resources/${id}`, { method: 'PATCH', body: data })
}

export function updateResourceStatus(
  id: string,
  newStatus: ResourceStatus,
  motivo?: string,
): Promise<Resource> {
  return apiRequest<Resource>(`/resources/${id}/status`, {
    method: 'PATCH',
    body: { nuevoEstado: newStatus, motivo },
  })
}

export function retireResource(id: string): Promise<Resource> {
  return updateResourceStatus(id, 'Dado_de_Baja', 'Dado de baja por administrador.')
}
