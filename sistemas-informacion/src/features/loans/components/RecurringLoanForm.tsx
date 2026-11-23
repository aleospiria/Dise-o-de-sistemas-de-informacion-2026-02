import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useLoans } from '@/contexts/useLoans'
import { useToast } from '@/contexts/useToast'
import styles from '@/features/loans/components/LoanForm.module.css'
import recurringStyles from '@/features/loans/components/RecurringLoanForm.module.css'
import { MOTIVO_MAX_LENGTH } from '@/features/loans/types'
import { MAX_LISTED_OCCURRENCES, listOccurrences } from '@/features/loans/utils/recurrence'
import { Alert } from '@/shared/components/ui/Alert'
import { Button } from '@/shared/components/ui/Button'
import { Icon } from '@/shared/components/ui/icons'
import { Input } from '@/shared/components/ui/Input'
import { Textarea } from '@/shared/components/ui/Textarea'
import { formatDate, toDateInputValue } from '@/shared/utils/dateUtils'
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

function minutesOf(time: string): number | null {
  const match = /^(\d{2}):(\d{2})$/.exec(time)
  return match ? Number(match[1]) * 60 + Number(match[2]) : null
}

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

  const occurrences = listOccurrences(fechaInicio, fechaFin, dias)
  const startMinutes = minutesOf(horaInicio)
  const endMinutes = minutesOf(horaFin)
  const hours =
    startMinutes !== null && endMinutes !== null ? (endMinutes - startMinutes) / 60 : null
  const durationInvalid = hours !== null && (hours < 1 || hours > 24)
  const showSummary = dias.length > 0 && Boolean(fechaFin)
  const listed = occurrences.slice(0, MAX_LISTED_OCCURRENCES)

  return (
    <form className={styles.form} onSubmit={onSubmit} noValidate>
      {error && <Alert type="error">{error}</Alert>}
      {result && (
        <Alert type="info">
          <p>
            Serie {result.serie.idSerie}: {result.prestamos.length} préstamos
            creados, {result.conflictos.length} conflictos y{' '}
            {result.omitidos.length} omitidos.
          </p>
          {result.conflictos.length > 0 && (
            <ul className={recurringStyles.result} aria-label="Conflictos de la serie">
              {result.conflictos.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          )}
        </Alert>
      )}

      <fieldset className={recurringStyles.group}>
        <legend className={recurringStyles.legend}>
          <span className={recurringStyles.step} aria-hidden="true">
            1
          </span>
          Periodo de la serie
        </legend>
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
      </fieldset>

      <fieldset className={recurringStyles.group}>
        <legend className={recurringStyles.legend}>
          <span className={recurringStyles.step} aria-hidden="true">
            2
          </span>
          Horario de cada reserva
        </legend>
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
      </fieldset>

      <fieldset className={recurringStyles.group}>
        <legend className={recurringStyles.legend}>
          <span className={recurringStyles.step} aria-hidden="true">
            3
          </span>
          Días de la semana
        </legend>
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

      <fieldset className={recurringStyles.group}>
        <legend className={recurringStyles.legend}>
          <span className={recurringStyles.step} aria-hidden="true">
            4
          </span>
          Motivo
        </legend>
        <Textarea
          label="Motivo del préstamo"
          maxLength={MOTIVO_MAX_LENGTH}
          showCharCount
          required
          hint="Entre 10 y 500 caracteres."
          value={motivo}
          onChange={(event) => setMotivo(event.target.value)}
        />
      </fieldset>

      <section className={recurringStyles.summary} aria-labelledby="series-summary" aria-live="polite">
        <h3 id="series-summary">Resumen de la serie</h3>
        {showSummary ? (
          <>
            <p className={recurringStyles.count}>
              {occurrences.length === 1
                ? '1 reserva'
                : `${occurrences.length} reservas`}
              {hours !== null && !durationInvalid && ` de ${hours} h`}
            </p>
            {occurrences.length > 0 ? (
              <ul className={recurringStyles.dates} aria-label="Fechas de la serie">
                {listed.map((date) => (
                  <li key={date}>{formatDate(`${date}T12:00:00`)}</li>
                ))}
                {occurrences.length > listed.length && (
                  <li>y {occurrences.length - listed.length} más</li>
                )}
              </ul>
            ) : (
              <p>Ninguna fecha del periodo cae en los días elegidos.</p>
            )}
            <p>La disponibilidad se confirma al crear la serie; los conflictos se te informarán.</p>
          </>
        ) : (
          <p>Elige el último día y al menos un día de la semana para ver las fechas.</p>
        )}
        {durationInvalid && (
          <p className={recurringStyles.warning}>
            <Icon name="alert-triangle" size={18} />
            Cada reserva debe durar entre 1 y 24 horas.
          </p>
        )}
      </section>

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
