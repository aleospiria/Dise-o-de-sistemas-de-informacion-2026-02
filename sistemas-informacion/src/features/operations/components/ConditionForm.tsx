import type { ReactNode } from 'react'
import styles from '@/features/operations/components/ConditionForm.module.css'
import { useConditionForm } from '@/features/operations/hooks/useConditionForm'
import { OBSERVACIONES_MAX_LENGTH, type ConditionFormValues } from '@/features/operations/types'
import { Alert } from '@/shared/components/ui/Alert'
import { Button } from '@/shared/components/ui/Button'
import { Select } from '@/shared/components/ui/Select'
import { Textarea } from '@/shared/components/ui/Textarea'
import { CONDITION_LABELS, CONDITIONS } from '@/shared/constants/conditions'
import type { OperationResult } from '@/shared/types'

const CONDITION_OPTIONS = CONDITIONS.map((value) => ({
  value,
  label: CONDITION_LABELS[value],
}))

export interface ConditionFormProps {
  submitLabel: string
  requireNotesIfDamaged: boolean
  submit: (values: ConditionFormValues) => OperationResult<unknown>
  onCancel: () => void
  /** Información previa al formulario, p. ej. el retraso de una devolución. */
  children?: ReactNode
}

/** Formulario base de condición + observaciones, usado por entrega y devolución. */
export function ConditionForm({
  submitLabel,
  requireNotesIfDamaged,
  submit,
  onCancel,
  children,
}: ConditionFormProps) {
  const { field, errors, serverError, isSubmitting, canSubmit, notesRequired, onSubmit } =
    useConditionForm({ requireNotesIfDamaged, submit })

  return (
    <form className={styles.form} onSubmit={onSubmit} noValidate>
      {children}
      {serverError && <Alert type="error">{serverError}</Alert>}

      <Select
        label="Condición del recurso"
        options={CONDITION_OPTIONS}
        required
        data-autofocus
        error={errors.condicion?.message}
        {...field('condicion')}
      />
      <Textarea
        label="Observaciones"
        maxLength={OBSERVACIONES_MAX_LENGTH}
        showCharCount
        required={notesRequired}
        hint={notesRequired ? 'Explica el daño del recurso.' : 'Opcional.'}
        error={errors.observaciones?.message}
        {...field('observaciones')}
      />

      <div className={styles.actions}>
        <Button type="submit" loading={isSubmitting} disabled={!canSubmit}>
          {submitLabel}
        </Button>
        <Button variant="secondary" onClick={onCancel}>
          Cancelar
        </Button>
      </div>
    </form>
  )
}
