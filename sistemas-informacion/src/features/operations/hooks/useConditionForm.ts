import { useMemo } from 'react'
import { useForm, useWatch } from 'react-hook-form'
import type { ConditionFormValues } from '@/features/operations/types'
import { validateConditionForm } from '@/features/operations/validation'
import type { OperationResult } from '@/shared/types'
import { createResolver, hasFieldErrors } from '@/shared/utils/formResolver'

interface UseConditionFormOptions {
  requireNotesIfDamaged: boolean
  /** Registra la operación; el resultado de error se muestra en el formulario. */
  submit: (values: ConditionFormValues) => OperationResult<unknown>
}

/** Estado y acciones del formulario de condición + observaciones. */
export function useConditionForm({ requireNotesIfDamaged, submit }: UseConditionFormOptions) {
  const resolver = useMemo(
    () =>
      createResolver<ConditionFormValues>((values) =>
        validateConditionForm(values, { requireNotesIfDamaged }),
      ),
    [requireNotesIfDamaged],
  )

  const form = useForm<ConditionFormValues>({
    defaultValues: { condicion: 'Bueno', observaciones: '' },
    resolver,
  })
  const { errors, isSubmitted, isSubmitting } = form.formState
  const condicion = useWatch({ control: form.control, name: 'condicion' })

  const onSubmit = form.handleSubmit((values) => {
    const result = submit({ ...values, observaciones: values.observaciones.trim() })
    if (!result.success) {
      form.setError('root.server', {
        message: result.error ?? 'No se pudo registrar la operación.',
      })
    }
  })

  return {
    field: form.register,
    errors,
    serverError: errors.root?.server?.message,
    isSubmitting,
    canSubmit: !(isSubmitted && hasFieldErrors(errors)),
    notesRequired: requireNotesIfDamaged && condicion === 'Dañado',
    onSubmit,
  }
}
