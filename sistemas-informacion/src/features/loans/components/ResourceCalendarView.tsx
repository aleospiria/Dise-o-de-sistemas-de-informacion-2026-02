import { useCallback, useEffect, useState } from 'react'
import { apiErrorMessage } from '@/services/api/errors'
import * as resourcesService from '@/services/api/resources.service'
import { Alert } from '@/shared/components/ui/Alert'
import { Button } from '@/shared/components/ui/Button'
import styles from '@/shared/components/ui/DataPage.module.css'
import { Input } from '@/shared/components/ui/Input'
import { Select } from '@/shared/components/ui/Select'
import { StatusBadge } from '@/shared/components/ui/StatusBadge'
import { formatDate, formatDateTimeRange, toDateInputValue } from '@/shared/utils/dateUtils'
import type { Resource, ResourceCalendar } from '@/shared/types'

function addDays(date: Date, days: number): Date {
  const result = new Date(date)
  result.setDate(result.getDate() + days)
  return result
}

export function ResourceCalendarView({ resources }: { resources: Resource[] }) {
  const today = new Date()
  const [resourceId, setResourceId] = useState('')
  const [desde, setDesde] = useState(toDateInputValue(today))
  const [hasta, setHasta] = useState(toDateInputValue(addDays(today, 6)))
  const [calendar, setCalendar] = useState<ResourceCalendar | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const load = useCallback(async () => {
    if (!resourceId) return
    setLoading(true)
    setError(null)
    try {
      setCalendar(
        await resourcesService.getResourceCalendar(resourceId, desde, hasta),
      )
    } catch (caught) {
      setError(apiErrorMessage(caught))
    } finally {
      setLoading(false)
    }
  }, [resourceId, desde, hasta])

  useEffect(() => {
    if (!resourceId) return
    let active = true
    resourcesService
      .getResourceCalendar(resourceId, desde, hasta)
      .then((data) => {
        if (active) {
          setCalendar(data)
          setError(null)
        }
      })
      .catch((caught: unknown) => {
        if (active) setError(apiErrorMessage(caught))
      })
      .finally(() => {
        if (active) setLoading(false)
      })
    return () => {
      active = false
    }
  }, [resourceId, desde, hasta])

  const options = resources.map((resource) => ({
    value: resource.idRecurso,
    label: resource.nombre,
  }))

  return (
    <section className={styles.page} aria-labelledby="calendar-title">
      <div className={styles.pageHeader}>
        <div className={styles.pageHeading}>
          <h2 id="calendar-title">Calendario de disponibilidad</h2>
          <p className={styles.lead}>
            Consulta franjas libres y reservas por recurso en un rango de fechas.
          </p>
        </div>
      </div>
      <div className={styles.panel}>
        <div className={styles.filters}>
          <Select
            label="Recurso"
            placeholder="Elige un recurso"
            options={options}
            value={resourceId}
            onChange={(event) => setResourceId(event.target.value)}
          />
          <Input
            label="Desde"
            type="date"
            value={desde}
            onChange={(event) => setDesde(event.target.value)}
          />
          <Input
            label="Hasta"
            type="date"
            value={hasta}
            onChange={(event) => setHasta(event.target.value)}
          />
        </div>
        <div className={styles.actions}>
          <Button
            variant="secondary"
          onClick={() => void load()}
            loading={loading}
            disabled={!resourceId}
          >
            Consultar calendario
          </Button>
        </div>
      </div>

      {error && <Alert type="error">{error}</Alert>}

      {calendar && calendar.dias.length === 0 && (
        <div className={styles.empty}>
          <span className={styles.emptyTitle}>Sin días consultados</span>
          <span>No hay días en el rango consultado.</span>
        </div>
      )}

      {calendar && calendar.dias.length > 0 && (
        <ul className={styles.list}>
          {calendar.dias.map((day) => (
            <li key={day.fecha} className={styles.card}>
              <div className={styles.listItem}>
                <div className={styles.listItemBody}>
                  <h3>{formatDate(`${day.fecha}T12:00:00`)}</h3>
                  <p className={styles.hint}>
                    {day.cantidadDisponible} unidades disponibles
                  </p>
                </div>
                <span className={`${styles.badge} ${styles.badgeSuccess}`}>
                  {day.franjas.filter((slot) => slot.disponible).length} de{' '}
                  {day.franjas.length} franjas libres
                </span>
              </div>
              {day.reservas.length > 0 && (
                <ul className={styles.list}>
                  {day.reservas.map((reservation) => (
                    <li key={reservation.idPrestamo} className={styles.listItem}>
                      <span>
                        {formatDateTimeRange(
                          reservation.fechaHoraInicio,
                          reservation.fechaHoraFin,
                        )}
                      </span>
                      <span className={styles.listItemMeta}>
                        <StatusBadge status={reservation.estado} />
                        {reservation.propio ? ' · Tu reserva' : ''}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
