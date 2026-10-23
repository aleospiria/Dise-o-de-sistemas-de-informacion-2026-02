import {
  ResourcesContext,
  type ResourcesContextValue,
} from '@/contexts/AppDataContext'
import { useRequiredContext } from '@/contexts/requireContext'

/** Recursos del inventario y sus operaciones (dominio de recursos). */
export function useResources(): ResourcesContextValue {
  return useRequiredContext(ResourcesContext, 'useResources', 'AppDataProvider')
}
