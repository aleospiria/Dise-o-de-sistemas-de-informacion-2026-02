import styles from '@/features/loans/components/LoanCard.module.css'
import { Button } from '@/shared/components/ui/Button'
import { StatusBadge } from '@/shared/components/ui/StatusBadge'
import type { Loan } from '@/shared/types'
import { formatDateTimeRange } from '@/shared/utils/dateUtils'

export interface LoanCardProps {
  loan: Loan
  /** Nombre del recurso, que el préstamo solo referencia por id. */
  resourceName: string
  /** Cancela la reserva; `series` cancela todas las de la recurrencia. */
  onCancel?: (series: boolean) => void
}

/** Tarjeta de un préstamo en "Mis préstamos" (Req 8.11). */
export function LoanCard({ loan, resourceName, onCancel }: LoanCardProps) {
  return (
    <article className={styles.card}>
      <header className={styles.header}>
        <h2 className={styles.title}>{resourceName}</h2>
        <StatusBadge status={loan.estadoPrestamo} />
      </header>
      <dl className={styles.details}>
        <dt>Horario</dt>
        <dd>
          {formatDateTimeRange(loan.fechaHoraInicioProgramada, loan.fechaHoraFinProgramada)}
        </dd>
        <dt>Motivo</dt>
        <dd>{loan.motivoPrestamo}</dd>
        {loan.idSerie && (
          <>
            <dt>Recurrencia</dt>
            <dd>Parte de una serie de reservas.</dd>
          </>
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
