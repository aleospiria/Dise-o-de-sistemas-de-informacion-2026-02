/**
 * Configuración del cliente HTTP. En desarrollo apunta al backend local; se
 * puede sobreescribir con `VITE_API_BASE_URL`.
 */
const configuredUrl = import.meta.env.VITE_API_BASE_URL?.trim()

export const API_BASE_URL = configuredUrl
  ? configuredUrl.replace(/\/$/, '')
  : 'http://localhost:8000/api/v1'
