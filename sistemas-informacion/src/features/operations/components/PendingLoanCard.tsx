import styles from '@/features/operations/components/PendingLoanCard.module.css'
import { Button } from '@/shared/components/ui/Button'
import { Icon, type IconName } from '@/shared/components/ui/icons'
import { ResourceImage } from '@/shared/components/ui/ResourceImage'
import type { Resource } from '@/shared/types'

export interface PendingLoanCardProps {
  resourceName: string
  /** Recurso completo, para mostrar su imagen; sin él no se dibuja imagen. */
  resource?: Resource
  studentName: string
  /** Etiqueta del dato de tiempo, p. ej. "Inicio programado". */
  timeLabel: string
  time: string
  /** Aviso destacado, p. ej. "Con retraso de 2 h". */
  alert?: string
  /** Resalta la tarjeta (retraso). Siempre acompaña a `alert`, nunca va solo en color. */
  highlight?: boolean
  actionLabel: string
  /** Ícono decorativo del botón de acción. */
  actionIcon?: IconName
  onAction: () => void
}

/** Tarjeta de un préstamo pendiente de entrega o devolución. */
export function PendingLoanCard({
  resourceName,
  resource,
  studentName,
  timeLabel,
  time,
  alert,
  highlight,
  actionLabel,
  actionIcon,
  onAction,
}: PendingLoanCardProps) {
  return (
    <article className={`${styles.card} ${highlight ? styles.overdue : ''}`}>
      {alert && (
        <p className={styles.alert}>
          <Icon name="alert-triangle" size={18} />
          {alert}
        </p>
      )}
      <div className={styles.body}>
        <div className={styles.identity}>
          {resource && <ResourceImage resource={resource} size="thumb" decorative />}
          <div className={styles.titleBlock}>
            <h2 className={styles.title}>{resourceName}</h2>
            {resource && <p className={styles.code}>{resource.codigoInventario}</p>}
          </div>
        </div>
        <dl className={styles.details}>
          <div className={styles.detail}>
            <dt>
              <Icon name="user" size={16} />
              Estudiante
            </dt>
            <dd>{studentName}</dd>
          </div>
          <div className={styles.detail}>
            <dt>
              <Icon name="clock" size={16} />
              {timeLabel}
            </dt>
            <dd>{time}</dd>
          </div>
        </dl>
        <Button
          className={styles.action}
          icon={actionIcon}
          onClick={onAction}
          aria-label={`${actionLabel}: ${resourceName}, ${studentName}`}
        >
          {actionLabel}
        </Button>
      </div>
    </article>
  )
}
