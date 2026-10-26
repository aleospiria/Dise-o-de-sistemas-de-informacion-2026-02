import { Link, useParams } from 'react-router-dom'
import { useResources } from '@/contexts/useResources'
import { LoanForm } from '@/features/loans/components/LoanForm'
import styles from '@/features/loans/pages/LoanFormPage.module.css'
import { Alert } from '@/shared/components/ui/Alert'
import { StatusBadge } from '@/shared/components/ui/StatusBadge'
import { RESOURCE_TYPE_LABELS } from '@/shared/constants/resourceTypes'
import { isResourceBookable } from '@/shared/utils/resourceRules'

/** Solicitud de préstamo de un recurso: `/loans/new/:resourceId` (Req 8.1, 8.2). */
export function LoanFormPage() {
  const { resourceId = '' } = useParams()
  const { resources } = useResources()
  const resource = resources.find((r) => r.idRecurso === resourceId)

  if (!resource) {
    return (
      <div className={styles.page}>
        <Alert type="error">No encontramos el recurso que quieres solicitar.</Alert>
        <Link to="/availability" className={styles.back}>
          Volver a disponibilidad
        </Link>
      </div>
    )
  }

  // Quien llega por una URL guardada puede encontrar el recurso ya agotado.
  if (!isResourceBookable(resource)) {
    return (
      <div className={styles.page}>
        <Alert type="info">
          {resource.nombre} no está disponible para préstamo en este momento.
        </Alert>
        <Link to="/availability" className={styles.back}>
          Volver a disponibilidad
        </Link>
      </div>
    )
  }

  return (
    <div className={styles.page}>
      <section className={styles.summary} aria-label="Recurso solicitado">
        <div className={styles.summaryHeader}>
          <h2>{resource.nombre}</h2>
          <StatusBadge status={resource.estadoActual} />
        </div>
        <p className={styles.meta}>
          {RESOURCE_TYPE_LABELS[resource.tipo]} · {resource.codigoInventario} ·{' '}
          {resource.cantidadDisponible} de {resource.cantidadTotal} disponibles
        </p>
        <p>{resource.descripcion}</p>
      </section>

      <LoanForm resourceId={resource.idRecurso} />
    </div>
  )
}
