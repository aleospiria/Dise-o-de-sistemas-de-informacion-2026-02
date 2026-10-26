import { createContext } from 'react'
import type { ToastType } from '@/shared/types'

export type { ToastType }

export interface ToastMessage {
  id: string
  type: ToastType
  message: string
}

export interface UIContextValue {
  toasts: ToastMessage[]
  isGlobalLoading: boolean
  /** Muestra un toast y devuelve su id. */
  showToast: (type: ToastType, message: string) => string
  dismissToast: (id: string) => void
  setGlobalLoading: (loading: boolean) => void
}

export const UIContext = createContext<UIContextValue | undefined>(undefined)
