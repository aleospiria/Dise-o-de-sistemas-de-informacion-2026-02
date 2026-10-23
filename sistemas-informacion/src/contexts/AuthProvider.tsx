import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react'
import { AuthContext, type AuthContextValue } from '@/contexts/AuthContext'
import {
  getCurrentSession,
  loginUser,
  logoutUser,
  registerUser,
} from '@/services/mockDb/auth.service'
import {
  localStorageRepository,
  type StorageRepository,
} from '@/services/storage'
import type { RegisterFormData, Session } from '@/shared/types'

interface AuthProviderProps {
  children: ReactNode
  /** Puerto de persistencia (SOLID M2). Por defecto, `localStorage`. */
  repository?: StorageRepository
}

/**
 * Mantiene la sesión activa. Al montar restaura la sesión guardada (si no
 * expiró) y programa el cierre automático cuando llegue su `expiresAt`.
 */
export function AuthProvider({
  children,
  repository = localStorageRepository,
}: AuthProviderProps) {
  const [session, setSession] = useState<Session | null>(() =>
    getCurrentSession(repository),
  )

  const login = useCallback(
    (correo: string, contrasena: string) => {
      const result = loginUser(correo, contrasena, repository)
      if (result.success && result.data) setSession(result.data)
      return result
    },
    [repository],
  )

  const logout = useCallback(() => {
    logoutUser(repository)
    setSession(null)
  }, [repository])

  const register = useCallback(
    (data: RegisterFormData) => registerUser(data, repository),
    [repository],
  )

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
