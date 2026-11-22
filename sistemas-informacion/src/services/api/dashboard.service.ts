import { apiRequest } from '@/services/api/client'
import type { DashboardSummary } from '@/shared/types'

export function getDashboardSummary(): Promise<DashboardSummary> {
  return apiRequest<DashboardSummary>('/dashboard')
}
