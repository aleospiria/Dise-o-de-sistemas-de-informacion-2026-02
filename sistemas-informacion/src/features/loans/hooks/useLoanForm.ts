import { useForm } from 'react-hook-form'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/contexts/useAuth'
import { useLoans } from '@/contexts/useLoans'
import { useToast } from '@/contexts/useToast'
import type { LoanFormValues } from '@/features/loans/types'
import { validateLoanForm } from '@/features/loans/validation'
import { combineDateAndTime, toDateInputValue } from '@/shared/utils/dateUtils'
import { createResolver, hasFieldErrors } from '@/shared/utils/formResolver'

const resolver = createResolver(validateLoanForm)

/**
 * Estado y acciones del formulario de préstamo (Req 8.2–8.11). Al crear la
 * reserva muestra una confirmación y lleva a "Mis préstamos".
 */
export function useLoanForm(resourceId: string) {
  const { session } = useAuth()
  const { createLoan } = useLoans()
  const { showToast } = useToast()
  const navigate = useNavigate()

  const form = useForm<LoanFormValues>({
    defaultValues: { fecha: toDateInputValue(), horaInicio: '', horaFin: '', motivo: '' },
    resolver,
  })
  const { errors, isSubmitted, isSubmitting } = form.formState

  const onSubmit = form.handleSubmit((values) => {
    const start = combineDateAndTime(values.fecha, values.horaInicio)
    const end = combineDateAndTime(values.fecha, values.horaFin)

    if (!session || !start || !end) {
      form.setError('root.server', {
        message: !session
          ? 'Tu sesión expiró. Inicia sesión de nuevo.'
          : 'La fecha y las horas no son válidas.',
      })
      return
    }

    const result = createLoan(
      {
        idRecurso: resourceId,
        fechaHoraInicioProgramada: start,
        fechaHoraFinProgramada: end,
        motivoPrestamo: values.motivo,
      },
      session.userId,
    )
    if (!result.success) {
      // P. ej. horario ocupado (Req 8.8).
      form.setError('root.server', {
        message: result.error ?? 'No se pudo crear la reserva.',
      })
      return
    }

    showToast('success', 'Reserva creada. Quedó en estado "Reservado".')
    navigate('/loans/my')
  })

  return {
    field: form.register,
    errors,
    serverError: errors.root?.server?.message,
    isSubmitting,
    canSubmit: !(isSubmitted && hasFieldErrors(errors)),
    onSubmit,
    minDate: toDateInputValue(),
  }
}
