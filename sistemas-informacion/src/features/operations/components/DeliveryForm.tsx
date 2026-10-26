import { ConditionForm } from '@/features/operations/components/ConditionForm'
import type { ConditionFormValues } from '@/features/operations/types'
import type { OperationResult } from '@/shared/types'

export interface DeliveryFormProps {
  submit: (values: ConditionFormValues) => OperationResult<unknown>
  onCancel: () => void
}

/** Confirmación de entrega: condición y observaciones (Req 12.4). Dañado exige observaciones. */
export function DeliveryForm({ submit, onCancel }: DeliveryFormProps) {
  return (
    <ConditionForm
      submitLabel="Confirmar entrega"
      requireNotesIfDamaged
      submit={submit}
      onCancel={onCancel}
    />
  )
}
