/** Error de la API con el código HTTP y el detalle devuelto por el backend. */
export class ApiError extends Error {
  readonly status: number
  readonly details: unknown

  constructor(message: string, status: number, details?: unknown) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.details = details
  }
}

export function apiErrorMessage(error: unknown): string {
  if (error instanceof ApiError) return error.message
  if (error instanceof TypeError) {
    return 'No se pudo conectar con el servidor. Verifica que el backend esté en ejecución.'
  }
  if (error instanceof Error) return error.message
  return 'Ocurrió un error inesperado.'
}
