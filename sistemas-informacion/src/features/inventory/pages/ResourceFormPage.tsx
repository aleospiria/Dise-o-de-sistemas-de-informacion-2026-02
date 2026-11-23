import { useParams } from 'react-router-dom'
import { useResources } from '@/contexts/useResources'
import { ResourceForm } from '@/features/inventory/components/ResourceForm'
import { ButtonLink } from '@/shared/components/ui/ButtonLink'
import { PageHeader } from '@/shared/components/ui/PageHeader'
import { StateMessage } from '@/shared/components/ui/StateMessage'

const BACK_TO_INVENTORY = (
  <ButtonLink to="/inventory" variant="secondary" icon="arrow-left">
    Volver al inventario
  </ButtonLink>
)

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
      <StateMessage
        kind="error"
        title="No encontramos el recurso que quieres editar."
        action={BACK_TO_INVENTORY}
      >
        Puede que ya no exista. Vuelve al inventario y elige otro.
      </StateMessage>
    )
  }

  if (resource?.estadoActual === 'Dado_de_Baja') {
    return (
      <StateMessage
        kind="info"
        title={`${resource.nombre} está dado de baja y ya no se puede editar.`}
        action={BACK_TO_INVENTORY}
      />
    )
  }

  // `key`: al pasar de un recurso a otro el formulario se reinicia con sus datos.
  return (
    <>
      <PageHeader
        description={
          resource
            ? 'Actualiza los datos del recurso. Los cambios se ven de inmediato en Disponibilidad.'
            : 'Completa los datos del recurso nuevo. La vista previa muestra cómo se verá en Disponibilidad.'
        }
      />
      <ResourceForm key={resource?.idRecurso ?? 'nuevo'} resource={resource} />
    </>
  )
}
