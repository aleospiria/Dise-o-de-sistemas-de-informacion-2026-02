import styles from '@/features/inventory/components/ResourceCard.module.css'
import type { Reservation } from '@/features/loans/availability'
import { Button } from '@/shared/components/ui/Button'
import { Icon } from '@/shared/components/ui/icons'
import { ResourceImage } from '@/shared/components/ui/ResourceImage'
import { StatusBadge } from '@/shared/components/ui/StatusBadge'
import { TypeBadge } from '@/shared/components/ui/TypeBadge'
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
  /** Si se pasa y el recurso no está libre, ofrece avisar cuando se libere. */
  onRequestAvailability?: () => void
  /** El usuario ya pidió el aviso para este recurso. */
  availabilityRequested?: boolean
}

/** Tarjeta de un recurso para la consulta de disponibilidad. */
export function ResourceCard({
  resource,
  onRequestLoan,
  reservations = [],
  nextAvailableAt,
  onRequestAvailability,
  availabilityRequested = false,
}: ResourceCardProps) {
  const bookable = isResourceBookable(resource)
  const shown = reservations.slice(0, MAX_RESERVATIONS_SHOWN)
  const hidden = reservations.length - shown.length
  const total = resource.cantidadTotal

  return (
    <article className={styles.card}>
      <ResourceImage resource={resource} size="card" decorative />
      <div className={styles.body}>
        <div className={styles.chips}>
          <TypeBadge type={resource.tipo} />
          <StatusBadge status={resource.estadoActual} />
        </div>
        <header className={styles.header}>
          <h2 className={styles.title}>{resource.nombre}</h2>
          <p className={styles.code}>{resource.codigoInventario}</p>
        </header>
        {resource.descripcion && <p className={styles.description}>{resource.descripcion}</p>}
        {bookable ? (
          <div className={styles.stockBlock}>
            <p className={styles.stock}>
              {resource.cantidadDisponible} de {total} disponibles
            </p>
            {/* Barra decorativa: la cifra de arriba ya lo dice con texto. */}
            <meter
              className={styles.meter}
              aria-hidden="true"
              min={0}
              max={total}
              low={total * 0.25}
              high={total * 0.5}
              optimum={total}
              value={resource.cantidadDisponible}
            />
          </div>
        ) : (
          <div className={styles.notice}>
            <Icon name="clock" size={18} />
            <div>
              <p className={styles.unavailable}>No disponible</p>
              <p className={styles.noticeText}>
                {nextAvailableAt
                  ? `Se libera el ${formatDateTime(nextAvailableAt)}.`
                  : 'Sin fecha estimada de disponibilidad.'}
              </p>
            </div>
          </div>
        )}
        {shown.length > 0 && (
          <div className={styles.reservations}>
            <h3>Próximas reservas</h3>
            <ul>
              {shown.map((r, index) => (
                <li key={`${r.start}-${r.end}-${index}`}>{formatDateTimeRange(r.start, r.end)}</li>
              ))}
            </ul>
            {hidden > 0 && <p className={styles.more}>y {hidden} más.</p>}
          </div>
        )}
        {onRequestLoan && bookable && (
          <Button
            className={styles.action}
            icon="calendar"
            onClick={onRequestLoan}
            aria-label={`Solicitar préstamo de ${resource.nombre}`}
          >
            Solicitar préstamo
          </Button>
        )}
        {onRequestAvailability && !bookable && (
          <Button
            className={styles.action}
            variant="secondary"
            icon="bell"
            onClick={onRequestAvailability}
            disabled={availabilityRequested}
            aria-label={`Avisarme cuando ${resource.nombre} esté disponible`}
          >
            {availabilityRequested ? 'Aviso solicitado' : 'Avisarme cuando esté disponible'}
          </Button>
        )}
      </div>
    </article>
  )
}
