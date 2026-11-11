import { API_BASE_URL } from '@/services/api/config'
import { ApiError, apiErrorMessage } from '@/services/api/errors'
import { getApiToken } from '@/services/api/session'
import type { OperationResult } from '@/shared/types'

interface Envelope<T> {
  success: boolean
  data: T | null
  error: string | null
  details?: unknown
}

interface RequestOptions {
  method?: 'GET' | 'POST' | 'PATCH' | 'PUT' | 'DELETE'
  body?: unknown
  auth?: boolean
}

function detailMessage(details: unknown): string | null {
  if (!Array.isArray(details)) return null
  const first = details[0] as { message?: unknown } | undefined
  return typeof first?.message === 'string' ? first.message : null
}

export async function apiRequest<T>(
  path: string,
  { method = 'GET', body, auth = true }: RequestOptions = {},
): Promise<T> {
  const token = getApiToken()
  const headers: Record<string, string> = { Accept: 'application/json' }
  if (body !== undefined) headers['Content-Type'] = 'application/json'
  if (auth && token) headers.Authorization = `Bearer ${token}`

  let response: Response
  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      method,
      headers,
      body: body === undefined ? undefined : JSON.stringify(body),
    })
  } catch (error) {
    throw new ApiError(apiErrorMessage(error), 0)
  }

  if (response.status === 204) return undefined as T

  const text = await response.text()
  let payload: Envelope<T> | null = null
  if (text) {
    try {
      payload = JSON.parse(text) as Envelope<T>
    } catch {
      payload = null
    }
  }

  if (!response.ok || payload?.success === false || payload === null) {
    if (response.status === 401 && token) {
      window.dispatchEvent(new Event('auth:unauthorized'))
    }
    const message =
      detailMessage(payload?.details) ??
      payload?.error ??
      `Error ${response.status} al comunicarse con el servidor.`
    throw new ApiError(message, response.status, payload?.details)
  }

  return payload.data as T
}

export async function runApi<T>(
  operation: () => Promise<T>,
): Promise<OperationResult<T>> {
  try {
    return { success: true, data: await operation() }
  } catch (error) {
    return { success: false, error: apiErrorMessage(error) }
  }
}
