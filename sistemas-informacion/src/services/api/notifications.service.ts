import { apiRequest } from '@/services/api/client'
import type { AvailabilityRequest, Notification } from '@/shared/types'

export function listNotifications(
  days = 7,
  soloNoLeidas = false,
): Promise<Notification[]> {
  const params = new URLSearchParams({
    days: String(days),
    solo_no_leidas: String(soloNoLeidas),
  })
  return apiRequest<Notification[]>(`/notifications?${params.toString()}`)
}

export function markNotificationRead(id: string): Promise<Notification> {
  return apiRequest<Notification>(`/notifications/${id}/read`, {
    method: 'PATCH',
  })
}

export function markAllNotificationsRead(): Promise<{ message: string }> {
  return apiRequest<{ message: string }>('/notifications/read-all', {
    method: 'PATCH',
  })
}

export function listAvailabilityRequests(): Promise<AvailabilityRequest[]> {
  return apiRequest<AvailabilityRequest[]>('/notifications/availability-requests')
}

export function requestAvailability(
  idRecurso: string,
): Promise<AvailabilityRequest> {
  return apiRequest<AvailabilityRequest>('/notifications/availability-requests', {
    method: 'POST',
    body: { idRecurso },
  })
}

export function cancelAvailabilityRequest(
  resourceId: string,
): Promise<{ message: string }> {
  return apiRequest<{ message: string }>(
    `/notifications/availability-requests/${resourceId}`,
    { method: 'DELETE' },
  )
}
