import styles from '@/features/operations/components/PendingLoanCard.module.css'
import { Button } from '@/shared/components/ui/Button'

export interface PendingLoanCardProps {
  resourceName: string
  studentName: string
  /** Etiqueta del dato de tiempo, p. ej. "Inicio programado". */
  timeLabel: string
  time: string
  /** Aviso destacado, p. ej. "Con retraso de 2 h". */
  alert?: string
  /** Resalta la tarjeta (retraso). Siempre acompaña a `alert`, nunca va solo en color. */
  highlight?: boolean
  actionLabel: string
  onAction: () => void
}

/** Tarjeta de un préstamo pendiente de entrega o devolución. */
export function PendingLoanCard({
  resourceName,
  studentName,
  timeLabel,
  time,
  alert,
  highlight,
  actionLabel,
  onAction,
}: PendingLoanCardProps) {
  return (
    <article className={`${styles.card} ${highlight ? styles.overdue : ''}`}>
      <h2 className={styles.title}>{resourceName}</h2>
      <dl className={styles.details}>
        <dt>Estudiante</dt>
        <dd>{studentName}</dd>
        <dt>{timeLabel}</dt>
        <dd>{time}</dd>
      </dl>
      {alert && <p className={styles.alert}>{alert}</p>}
      <Button
        className={styles.action}
        onClick={onAction}
        aria-label={`${actionLabel}: ${resourceName}, ${studentName}`}
      >
        {actionLabel}
      </Button>
    </article>
  )
}
