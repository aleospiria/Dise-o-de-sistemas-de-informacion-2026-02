import styles from '@/features/inventory/components/ResourceCard.module.css'
import type { Reservation } from '@/features/loans/availability'
import { Button } from '@/shared/components/ui/Button'
import { StatusBadge } from '@/shared/components/ui/StatusBadge'
import { RESOURCE_TYPE_LABELS } from '@/shared/constants/resourceTypes'
import type { Resource } from '@/shared/types'
import { formatDateTime, formatDateTimeRange } from '@/shared/utils/dateUtils'
import { isResourceBookable } from '@/shared/utils/resourceRules'

/** Cuántas próximas reservas se listan antes de resumir el resto. */
const MAX_RESERVATIONS_SHOWN = 3

export interface ResourceCardProps {
  resource: Resource
  /**
   * Si se pasa, y el recurso se puede reservar, muestra el botón "Solicitar
   * préstamo" (Req 8.1). Quien usa la tarjeta decide si el usuario puede pedirlo.
   */
  onRequestLoan?: () => void
  /** Próximas reservas del recurso (Req 6.9). */
  reservations?: Reservation[]
  /** Cuándo se libera una unidad, si el recurso no está disponible (Req 6.10). */
  nextAvailableAt?: string
}

/** Tarjeta de un recurso para la consulta de disponibilidad. */
export function ResourceCard({
  resource,
  onRequestLoan,
  reservations = [],
  nextAvailableAt,
}: ResourceCardProps) {
  const bookable = isResourceBookable(resource)
  const shown = reservations.slice(0, MAX_RESERVATIONS_SHOWN)
  const hidden = reservations.length - shown.length

  return (
    <article className={styles.card}>
      <div className={styles.media}>
        {resource.imagenUrl ? (
          <img
            className={styles.image}
            src={resource.imagenUrl}
            alt={`Imagen de ${resource.nombre}`}
            loading="lazy"
          />
        ) : (
          <div className={styles.placeholder} aria-hidden="true">
            {RESOURCE_TYPE_LABELS[resource.tipo]}
          </div>
        )}
      </div>

      <div className={styles.body}>
        <header className={styles.header}>
          <h2 className={styles.title}>{resource.nombre}</h2>
          <StatusBadge status={resource.estadoActual} />
        </header>

        <p className={styles.meta}>
          {RESOURCE_TYPE_LABELS[resource.tipo]} · {resource.codigoInventario}
        </p>
        <p>{resource.descripcion}</p>

        {bookable ? (
          <p className={styles.stock}>
            {resource.cantidadDisponible} de {resource.cantidadTotal} disponibles
          </p>
        ) : (
          <>
            <p className={`${styles.stock} ${styles.unavailable}`}>No disponible</p>
            <p>
              {nextAvailableAt
                ? `Se libera el ${formatDateTime(nextAvailableAt)}.`
                : 'Sin fecha estimada de disponibilidad.'}
            </p>
          </>
        )}

        {shown.length > 0 && (
          <div className={styles.reservations}>
            <h3>Próximas reservas</h3>
            <ul>
              {shown.map((r) => (
                <li key={`${r.start}-${r.end}`}>{formatDateTimeRange(r.start, r.end)}</li>
              ))}
            </ul>
            {hidden > 0 && <p className={styles.meta}>y {hidden} más.</p>}
          </div>
        )}

        {onRequestLoan && bookable && (
          <Button
            className={styles.action}
            onClick={onRequestLoan}
            aria-label={`Solicitar préstamo de ${resource.nombre}`}
          >
            Solicitar préstamo
          </Button>
        )}
      </div>
    </article>
  )
}
