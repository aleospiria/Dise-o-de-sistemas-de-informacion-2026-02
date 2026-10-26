import { useResources } from '@/contexts/useResources'
import { useToast } from '@/contexts/useToast'
import type { CreateResourceData, Resource } from '@/shared/types'

/**
 * Fachada del inventario sobre el hook de dominio `useResources` (SOLID M4):
 * añade las notificaciones de éxito. Los errores de crear y editar se
 * devuelven para mostrarlos junto al formulario; el de dar de baja, que ocurre
 * en un diálogo, se notifica también como toast.
 */
export function useInventory() {
  const { resources, createResource, updateResource, retireResource } = useResources()
  const { showToast } = useToast()

  function create(data: CreateResourceData) {
    const result = createResource(data)
    if (result.success) showToast('success', `Recurso "${data.nombre.trim()}" creado.`)
    return result
  }

  function update(id: string, data: CreateResourceData) {
    const result = updateResource(id, data)
    if (result.success) showToast('success', `Recurso "${data.nombre.trim()}" actualizado.`)
    return result
  }

  function retire(resource: Resource) {
    const result = retireResource(resource.idRecurso)
    if (result.success) {
      showToast('success', `"${resource.nombre}" fue dado de baja.`)
    } else {
      showToast('error', result.error ?? 'No se pudo dar de baja el recurso.')
    }
    return result
  }

  return { resources, create, update, retire }
}
