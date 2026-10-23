import { useCallback, useMemo, useState, type ReactNode } from 'react'
import {
  UIContext,
  type ToastMessage,
  type ToastType,
  type UIContextValue,
} from '@/contexts/UIContext'
import { generateUUID } from '@/shared/utils/uuidUtils'

/** Estado de UI transversal: toasts apilados y carga global. */
export function UIProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastMessage[]>([])
  const [isGlobalLoading, setGlobalLoading] = useState(false)

  const showToast = useCallback((type: ToastType, message: string) => {
    const id = generateUUID()
    setToasts((current) => [...current, { id, type, message }])
    return id
  }, [])

  const dismissToast = useCallback((id: string) => {
    setToasts((current) => current.filter((t) => t.id !== id))
  }, [])

  const value = useMemo<UIContextValue>(
    () => ({ toasts, isGlobalLoading, showToast, dismissToast, setGlobalLoading }),
    [toasts, isGlobalLoading, showToast, dismissToast],
  )

  return <UIContext.Provider value={value}>{children}</UIContext.Provider>
}
