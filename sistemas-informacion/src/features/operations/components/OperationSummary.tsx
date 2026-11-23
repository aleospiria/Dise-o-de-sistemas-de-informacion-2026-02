import styles from '@/features/operations/components/OperationSummary.module.css'
import { ResourceImage } from '@/shared/components/ui/ResourceImage'
import type { Resource } from '@/shared/types'

export interface OperationSummaryProps {
  resourceName: string
  resource?: Resource
  /** Frase que une al estudiante con el recurso, p. ej. "Para Elena Estudiante". */
  person: string
  /** Dato de apoyo, p. ej. el horario programado. */
  detail?: string
}

/** Resumen del préstamo al inicio de un diálogo de entrega o devolución. */
export function OperationSummary({ resourceName, resource, person, detail }: OperationSummaryProps) {
  return (
    <div className={styles.summary}>
      {resource && <ResourceImage resource={resource} size="thumb" decorative />}
      <div className={styles.text}>
        <p className={styles.name}>{resourceName}</p>
        <p className={styles.person}>{person}</p>
        {detail && <p className={styles.detail}>{detail}</p>}
      </div>
    </div>
  )
}
