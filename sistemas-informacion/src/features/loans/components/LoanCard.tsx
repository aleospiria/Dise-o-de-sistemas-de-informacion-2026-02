import styles from '@/features/loans/components/LoanCard.module.css'
import { LoanProgress } from '@/features/loans/components/LoanProgress'
import { isProgressStatus } from '@/features/loans/progressSteps'
import { Button } from '@/shared/components/ui/Button'
import { Icon } from '@/shared/components/ui/icons'
import { ResourceImage } from '@/shared/components/ui/ResourceImage'
import { StatusBadge } from '@/shared/components/ui/StatusBadge'
import type { Loan, Resource } from '@/shared/types'
import { formatDateTimeRange } from '@/shared/utils/dateUtils'

export interface LoanCardProps {
  loan: Loan
  /** Nombre del recurso, que el préstamo solo referencia por id. */
  resourceName: string
  /** Recurso completo, para mostrar su imagen; sin él no se dibuja imagen. */
  resource?: Resource
  /** Cancela la reserva; `series` cancela todas las de la recurrencia. */
  onCancel?: (series: boolean) => void
}

/** Tarjeta de un préstamo en "Mis préstamos" (Req 8.11). */
export function LoanCard({ loan, resourceName, resource, onCancel }: LoanCardProps) {
  const inProgress = isProgressStatus(loan.estadoPrestamo)
  return (
    <article className={styles.card}>
      <header className={styles.header}>
        <div className={styles.identity}>
          {resource && <ResourceImage resource={resource} size="thumb" decorative />}
          <div className={styles.titleBlock}>
            <h2 className={styles.title}>{resourceName}</h2>
            {resource && <p className={styles.code}>{resource.codigoInventario}</p>}
          </div>
        </div>
        {/* Cancelado y Vencido no son parte del recorrido normal: van como chip. */}
        {!inProgress && <StatusBadge status={loan.estadoPrestamo} />}
      </header>
      {inProgress && <LoanProgress status={loan.estadoPrestamo} />}
      <dl className={styles.details}>
        <div className={styles.detail}>
          <dt>
            <Icon name="clock" size={16} />
            Horario
          </dt>
          <dd>
            {formatDateTimeRange(loan.fechaHoraInicioProgramada, loan.fechaHoraFinProgramada)}
          </dd>
        </div>
        <div className={styles.detail}>
          <dt>
            <Icon name="clipboard" size={16} />
            Motivo
          </dt>
          <dd>{loan.motivoPrestamo}</dd>
        </div>
        {loan.idSerie && (
          <div className={styles.detail}>
            <dt>
              <Icon name="refresh" size={16} />
              Recurrencia
            </dt>
            <dd>Parte de una serie de reservas.</dd>
          </div>
        )}
      </dl>
      {onCancel && loan.estadoPrestamo === 'Reservado' && (
        <div className={styles.actions}>
          <Button size="sm" variant="danger" onClick={() => onCancel(false)}>
            Cancelar reserva
          </Button>
          {loan.idSerie && (
            <Button size="sm" variant="secondary" onClick={() => onCancel(true)}>
              Cancelar serie completa
            </Button>
          )}
        </div>
      )}
    </article>
  )
}
