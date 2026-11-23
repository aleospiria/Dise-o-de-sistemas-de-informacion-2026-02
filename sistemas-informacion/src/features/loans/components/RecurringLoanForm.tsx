import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useLoans } from '@/contexts/useLoans'
import { useToast } from '@/contexts/useToast'
import styles from '@/features/loans/components/LoanForm.module.css'
import { MOTIVO_MAX_LENGTH } from '@/features/loans/types'
import { Alert } from '@/shared/components/ui/Alert'
import { Button } from '@/shared/components/ui/Button'
import { Input } from '@/shared/components/ui/Input'
import { Textarea } from '@/shared/components/ui/Textarea'
import { toDateInputValue } from '@/shared/utils/dateUtils'
import type { RecurringLoanResult } from '@/shared/types'

const WEEK_DAYS = [
  { value: 0, label: 'Domingo' },
  { value: 1, label: 'Lunes' },
  { value: 2, label: 'Martes' },
  { value: 3, label: 'Miércoles' },
  { value: 4, label: 'Jueves' },
  { value: 5, label: 'Viernes' },
  { value: 6, label: 'Sábado' },
]

export function RecurringLoanForm({ resourceId }: { resourceId: string }) {
  const { createRecurringLoans } = useLoans()
  const { showToast } = useToast()
  const navigate = useNavigate()
  const [fechaInicio, setFechaInicio] = useState(toDateInputValue())
  const [fechaFin, setFechaFin] = useState('')
  const [horaInicio, setHoraInicio] = useState('')
  const [horaFin, setHoraFin] = useState('')
  const [dias, setDias] = useState<number[]>([])
  const [motivo, setMotivo] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<RecurringLoanResult | null>(null)
  const [submitting, setSubmitting] = useState(false)

  function toggleDay(day: number) {
    setDias((current) =>
      current.includes(day)
        ? current.filter((item) => item !== day)
        : [...current, day].sort(),
    )
  }

  async function onSubmit(event: FormEvent) {
    event.preventDefault()
    setError(null)
    setSubmitting(true)
    try {
      const outcome = await createRecurringLoans({
        idRecurso: resourceId,
        diasSemana: dias,
        horaInicio,
        horaFin,
        fechaInicio,
        fechaFin,
        motivoPrestamo: motivo,
        crearSoloDisponibles: true,
      })
      if (!outcome.success || !outcome.data) {
        setError(outcome.error ?? 'No se pudo crear la recurrencia.')
        return
      }
      setResult(outcome.data)
      showToast(
        'success',
        `Serie creada con ${outcome.data.prestamos.length} préstamos.`,
      )
      if (outcome.data.prestamos.length > 0) navigate('/loans/my')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <form className={styles.form} onSubmit={onSubmit} noValidate>
      {error && <Alert type="error">{error}</Alert>}
      {result && (
        <Alert type="info">
          Serie {result.serie.idSerie}: {result.prestamos.length} préstamos
          creados, {result.conflictos.length} conflictos y{' '}
          {result.omitidos.length} omitidos.
        </Alert>
      )}

      <div className={styles.times}>
        <Input
          label="Primer día"
          type="date"
          required
          min={toDateInputValue()}
          value={fechaInicio}
          onChange={(event) => setFechaInicio(event.target.value)}
        />
        <Input
          label="Último día"
          type="date"
          required
          min={fechaInicio}
          value={fechaFin}
          onChange={(event) => setFechaFin(event.target.value)}
        />
      </div>

      <div className={styles.times}>
        <Input
          label="Hora de inicio"
          type="time"
          required
          value={horaInicio}
          onChange={(event) => setHoraInicio(event.target.value)}
        />
        <Input
          label="Hora de fin"
          type="time"
          required
          value={horaFin}
          onChange={(event) => setHoraFin(event.target.value)}
        />
      </div>

      <fieldset className={styles.weekdayGroup}>
        <legend>Días de la semana</legend>
        <div className={styles.weekdays}>
          {WEEK_DAYS.map((day) => (
            <label key={day.value}>
              <input
                type="checkbox"
                checked={dias.includes(day.value)}
                onChange={() => toggleDay(day.value)}
              />
              {day.label}
            </label>
          ))}
        </div>
      </fieldset>

      <Textarea
        label="Motivo del préstamo"
        maxLength={MOTIVO_MAX_LENGTH}
        showCharCount
        required
        hint="Entre 10 y 500 caracteres."
        value={motivo}
        onChange={(event) => setMotivo(event.target.value)}
      />

      <div className={styles.actions}>
        <Button
          type="submit"
          loading={submitting}
          disabled={
            dias.length === 0 ||
            !fechaFin ||
            !horaInicio ||
            !horaFin ||
            motivo.trim().length < 10
          }
        >
          Crear serie de reservas
        </Button>
        <Link to="/availability" className={styles.cancel}>
          Cancelar
        </Link>
      </div>
    </form>
  )
}
