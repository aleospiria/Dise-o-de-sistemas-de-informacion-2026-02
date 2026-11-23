import { apiDownload, apiRequest } from '@/services/api/client'
import type { LoanReport, ReportFilters } from '@/shared/types'

function query(filters: ReportFilters): string {
  const params = new URLSearchParams()
  if (filters.desde) params.set('desde', filters.desde)
  if (filters.hasta) params.set('hasta', filters.hasta)
  if (filters.idRecurso) params.set('id_recurso', filters.idRecurso)
  if (filters.tipoRecurso) params.set('tipo_recurso', filters.tipoRecurso)
  if (filters.estado) params.set('estado', filters.estado)
  if (filters.idUsuario) params.set('id_usuario', filters.idUsuario)
  const suffix = params.toString()
  return suffix ? `?${suffix}` : ''
}

export function getLoanReport(filters: ReportFilters): Promise<LoanReport> {
  return apiRequest<LoanReport>(`/reports/loans${query(filters)}`)
}

export function downloadLoanReportCsv(filters: ReportFilters): Promise<Blob> {
  return apiDownload(`/reports/loans/csv${query(filters)}`)
}

export function downloadLoanReportPdf(filters: ReportFilters): Promise<Blob> {
  return apiDownload(`/reports/loans/pdf${query(filters)}`)
}
