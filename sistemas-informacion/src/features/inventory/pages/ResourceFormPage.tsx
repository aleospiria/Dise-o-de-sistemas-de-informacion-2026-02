import { Link, useParams } from 'react-router-dom'
import { useResources } from '@/contexts/useResources'
import { ResourceForm } from '@/features/inventory/components/ResourceForm'
import { Alert } from '@/shared/components/ui/Alert'

/**
 * Crear (`/inventory/new`) o editar (`/inventory/:id/edit`) un recurso
 * (Req 4.7, 4.8). El título lo dibuja el `AppShell`.
 */
export function ResourceFormPage() {
  const { id } = useParams()
  const { resources } = useResources()
  const resource = id ? resources.find((r) => r.idRecurso === id) : undefined

  if (id && !resource) {
    return (
      <>
        <Alert type="error">No encontramos el recurso que quieres editar.</Alert>
        <p>
          <Link to="/inventory">Volver al inventario</Link>
        </p>
      </>
    )
  }

  if (resource?.estadoActual === 'Dado_de_Baja') {
    return (
      <>
        <Alert type="info">{resource.nombre} está dado de baja y ya no se puede editar.</Alert>
        <p>
          <Link to="/inventory">Volver al inventario</Link>
        </p>
      </>
    )
  }

  // `key`: al pasar de un recurso a otro el formulario se reinicia con sus datos.
  return <ResourceForm key={resource?.idRecurso ?? 'nuevo'} resource={resource} />
}
