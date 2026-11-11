import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react'
import { AuthContext, type AuthContextValue } from '@/contexts/AuthContext'
import * as apiAuth from '@/services/api/auth.service'
import { clearApiSession } from '@/services/api/session'
import {
  getCurrentSession,
  loginUser,
  logoutUser,
  registerUser,
} from '@/services/mockDb/auth.service'
import type { StorageRepository } from '@/services/storage'
import type { RegisterFormData, Session } from '@/shared/types'

interface AuthProviderProps {
  children: ReactNode
  /**
   * Puerto de persistencia (SOLID M2). Si se omite, autentica contra la API;
   * si se inyecta, usa el servicio mock (tests y demo local).
   */
  repository?: StorageRepository
}

/**
 * Mantiene la sesión activa. Al montar restaura la sesión guardada (si no
 * expiró) y programa el cierre automático cuando llegue su `expiresAt`.
 */
export function AuthProvider({ children, repository }: AuthProviderProps) {
  const isApi = repository === undefined
  const mockRepo = repository as StorageRepository
  const [session, setSession] = useState<Session | null>(() =>
    isApi ? apiAuth.getApiCurrentSession() : getCurrentSession(mockRepo),
  )

  const login = useCallback(
    (correo: string, contrasena: string) => {
      if (isApi) {
        return apiAuth.login(correo, contrasena).then((result) => {
          if (result.success && result.data) setSession(result.data)
          return result
        })
      }
      const result = loginUser(correo, contrasena, mockRepo)
      if (result.success && result.data) setSession(result.data)
      return result
    },
    [isApi, mockRepo],
  )

  const logout = useCallback(() => {
    if (isApi) {
      apiAuth.logout()
    } else {
      logoutUser(mockRepo)
    }
    setSession(null)
  }, [isApi, mockRepo])

  const register = useCallback(
    (data: RegisterFormData) =>
      isApi ? apiAuth.register(data) : registerUser(data, mockRepo),
    [isApi, mockRepo],
  )

  useEffect(() => {
    if (!isApi) return
    const handleUnauthorized = () => {
      clearApiSession()
      setSession(null)
    }
    window.addEventListener('auth:unauthorized', handleUnauthorized)
    return () => {
      window.removeEventListener('auth:unauthorized', handleUnauthorized)
    }
  }, [isApi])

  // Cierra la sesión automáticamente al expirar (Req 19.9).
  useEffect(() => {
    if (!session) return
    const msLeft = new Date(session.expiresAt).getTime() - Date.now()
    const timer = setTimeout(logout, Math.max(0, msLeft))
    return () => clearTimeout(timer)
  }, [session, logout])

  const value = useMemo<AuthContextValue>(
    () => ({ session, login, logout, register }),
    [session, login, logout, register],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
