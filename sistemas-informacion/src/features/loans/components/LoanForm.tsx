import { Link } from 'react-router-dom'
import styles from '@/features/loans/components/LoanForm.module.css'
import { useLoanForm } from '@/features/loans/hooks/useLoanForm'
import { MOTIVO_MAX_LENGTH } from '@/features/loans/types'
import { Alert } from '@/shared/components/ui/Alert'
import { Button } from '@/shared/components/ui/Button'
import { Input } from '@/shared/components/ui/Input'
import { Textarea } from '@/shared/components/ui/Textarea'

export interface LoanFormProps {
  resourceId: string
}

/** Formulario de solicitud de préstamo (Req 8.2). La lógica vive en `useLoanForm`. */
export function LoanForm({ resourceId }: LoanFormProps) {
  const { field, errors, serverError, isSubmitting, canSubmit, onSubmit, minDate } =
    useLoanForm(resourceId)

  return (
    <form className={styles.form} onSubmit={onSubmit} noValidate>
      {serverError && <Alert type="error">{serverError}</Alert>}

      <div className={styles.times}>
        <Input
          label="Fecha"
          type="date"
          min={minDate}
          required
          error={errors.fecha?.message}
          {...field('fecha')}
        />
        <Input
          label="Hora de inicio"
          type="time"
          required
          error={errors.horaInicio?.message}
          {...field('horaInicio')}
        />
        <Input
          label="Hora de fin"
          type="time"
          required
          hint="Entre 1 y 24 horas después del inicio, el mismo día."
          error={errors.horaFin?.message}
          {...field('horaFin')}
        />
      </div>

      <Textarea
        label="Motivo del préstamo"
        maxLength={MOTIVO_MAX_LENGTH}
        showCharCount
        required
        hint="Entre 10 y 500 caracteres."
        error={errors.motivo?.message}
        {...field('motivo')}
      />

      <div className={styles.actions}>
        <Button type="submit" loading={isSubmitting} disabled={!canSubmit}>
          Confirmar reserva
        </Button>
        <Link to="/availability" className={styles.cancel}>
          Cancelar
        </Link>
      </div>
    </form>
  )
}
