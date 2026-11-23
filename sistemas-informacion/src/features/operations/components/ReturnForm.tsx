import { ConditionForm } from '@/features/operations/components/ConditionForm'
import styles from '@/features/operations/components/ReturnForm.module.css'
import type { ConditionFormValues } from '@/features/operations/types'
import { Icon } from '@/shared/components/ui/icons'
import type { MaybePromise, OperationResult } from '@/shared/types'
import { formatDuration } from '@/shared/utils/dateUtils'

export interface ReturnFormProps {
  /** Horas de retraso acumuladas hasta ahora (Req 13.8). */
  delayHours: number
  submit: (values: ConditionFormValues) => MaybePromise<OperationResult<unknown>>
  onCancel: () => void
}

/** Confirmación de devolución: muestra el retraso y pide condición y observaciones (Req 13.4). */
export function ReturnForm({ delayHours, submit, onCancel }: ReturnFormProps) {
  const late = delayHours > 0
  return (
    <ConditionForm
      submitLabel="Confirmar devolución"
      requireNotesIfDamaged={false}
      submit={submit}
      onCancel={onCancel}
    >
      <p className={`${styles.delay} ${late ? styles.late : ''}`} role="status">
        <Icon name={late ? 'alert-triangle' : 'check-circle'} size={20} />
        <span>
          {late ? `Retraso actual: ${formatDuration(delayHours)}.` : 'La devolución está a tiempo.'}
        </span>
      </p>
    </ConditionForm>
  )
}
