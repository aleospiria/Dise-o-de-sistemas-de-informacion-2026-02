import { UIContext, type UIContextValue } from '@/contexts/UIContext'
import { useRequiredContext } from '@/contexts/requireContext'

/** Toasts y estado de carga global de la interfaz. */
export function useToast(): UIContextValue {
  return useRequiredContext(UIContext, 'useToast', 'UIProvider')
}
