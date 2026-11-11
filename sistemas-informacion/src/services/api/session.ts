import { LS_KEYS } from '@/shared/constants/lsKeys'
import type { Session } from '@/shared/types'

export interface StoredApiSession {
  token: string
  session: Session
}

function readJson<T>(key: string): T | null {
  try {
    const raw = localStorage.getItem(key)
    return raw ? (JSON.parse(raw) as T) : null
  } catch {
    return null
  }
}

export function getApiToken(): string | null {
  try {
    return localStorage.getItem(LS_KEYS.TOKEN)
  } catch {
    return null
  }
}

export function storeApiSession(token: string, session: Session): void {
  localStorage.setItem(LS_KEYS.TOKEN, token)
  localStorage.setItem(LS_KEYS.SESSION, JSON.stringify(session))
}

export function clearApiSession(): void {
  try {
    localStorage.removeItem(LS_KEYS.TOKEN)
    localStorage.removeItem(LS_KEYS.SESSION)
  } catch {
    // El cierre de sesión en memoria sigue siendo válido aunque falle el storage.
  }
}

export function readApiSession(): StoredApiSession | null {
  const token = getApiToken()
  const session = readJson<Session>(LS_KEYS.SESSION)
  if (!token || !session) return null
  if (new Date(session.expiresAt).getTime() <= Date.now()) {
    clearApiSession()
    return null
  }
  return { token, session }
}
