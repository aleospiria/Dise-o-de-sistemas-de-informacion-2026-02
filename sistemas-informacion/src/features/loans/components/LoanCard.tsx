import styles from '@/features/loans/components/LoanCard.module.css'
import { StatusBadge } from '@/shared/components/ui/StatusBadge'
import type { Loan } from '@/shared/types'
import { formatDateTimeRange } from '@/shared/utils/dateUtils'

export interface LoanCardProps {
  loan: Loan
  /** Nombre del recurso, que el préstamo solo referencia por id. */
  resourceName: string
}

/** Tarjeta de un préstamo en "Mis préstamos" (Req 8.11). */
export function LoanCard({ loan, resourceName }: LoanCardProps) {
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
      </dl>
    </article>
  )
}
