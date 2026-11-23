import { useCallback, useEffect, useState } from 'react'
import styles from '@/features/loans/components/ResourceCalendarView.module.css'
import { apiErrorMessage } from '@/services/api/errors'
import * as resourcesService from '@/services/api/resources.service'
import { Badge } from '@/shared/components/ui/Badge'
import { Button } from '@/shared/components/ui/Button'
import { Card } from '@/shared/components/ui/Card'
import { EmptyState } from '@/shared/components/ui/EmptyState'
import { FilterBar } from '@/shared/components/ui/FilterBar'
import { Icon } from '@/shared/components/ui/icons'
import { Input } from '@/shared/components/ui/Input'
import { Select } from '@/shared/components/ui/Select'
import { SkeletonLoader } from '@/shared/components/ui/SkeletonLoader'
import { StateMessage } from '@/shared/components/ui/StateMessage'
import { StatusBadge } from '@/shared/components/ui/StatusBadge'
import { formatDate, formatDateTimeRange, toDateInputValue } from '@/shared/utils/dateUtils'
import type { Resource, ResourceCalendar } from '@/shared/types'

function addDays(date: Date, days: number): Date {
  const result = new Date(date)
  result.setDate(result.getDate() + days)
  return result
}

/** Hora legible de una franja: acepta «HH:MM» o una fecha ISO completa. */
function formatHour(value: string): string {
  if (/^\d{2}:\d{2}/.test(value)) return value.slice(0, 5)
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return date.toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit', hour12: false })
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
    <section className={styles.view} aria-labelledby="calendar-title">
      <div className={styles.head}>
        <h2 id="calendar-title">Calendario de disponibilidad</h2>
        <p className={styles.lead}>
          Consulta franjas libres y reservas por recurso en un rango de fechas.
        </p>
      </div>

      <FilterBar
        label="Filtros del calendario"
        actions={
          <Button
            variant="secondary"
            icon="calendar"
            onClick={() => void load()}
            loading={loading}
            disabled={!resourceId}
          >
            Consultar calendario
          </Button>
        }
      >
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
      </FilterBar>

      <ul className={styles.legend} aria-label="Leyenda del calendario">
        <li className={styles.legendTitle}>Leyenda</li>
        <li>
          <span className={`${styles.swatch} ${styles.free}`}>
            <Icon name="check" size={14} />
          </span>
          Franja libre
        </li>
        <li>
          <span className={`${styles.swatch} ${styles.busy}`}>
            <Icon name="close" size={14} />
          </span>
          Franja ocupada
        </li>
        <li>
          <Badge tone="blue" icon="user">
            Tu reserva
          </Badge>
        </li>
      </ul>

      {error && (
        <StateMessage
          kind="error"
          title="No se pudo cargar el calendario."
          action={
            <Button variant="secondary" icon="refresh" onClick={() => void load()}>
              Reintentar
            </Button>
          }
        >
          {error}
        </StateMessage>
      )}

      {loading && <SkeletonLoader variant="card" count={2} />}

      {!loading && !error && !calendar && (
        <EmptyState
          icon="calendar"
          title="Elige un recurso para ver su calendario"
          description="Selecciona un recurso y un rango de fechas; verás las franjas libres y las reservas de cada día."
        />
      )}

      {!loading && calendar && calendar.dias.length === 0 && (
        <EmptyState
          icon="calendar"
          title="Sin días consultados"
          description="No hay días en el rango consultado."
        />
      )}

      {!loading && calendar && calendar.dias.length > 0 && (
        <ul className={styles.days}>
          {calendar.dias.map((day) => {
            const freeSlots = day.franjas.filter((slot) => slot.disponible).length
            return (
              <Card as="li" key={day.fecha}>
                <div className={styles.dayHeader}>
                  <div>
                    <h3>{formatDate(`${day.fecha}T12:00:00`)}</h3>
                    <p className={styles.units}>
                      {day.cantidadDisponible} unidades disponibles
                    </p>
                  </div>
                  <Badge tone={freeSlots > 0 ? 'green' : 'gray'}>
                    {freeSlots} de {day.franjas.length} franjas libres
                  </Badge>
                </div>
                {day.franjas.length > 0 && (
                  <ul className={styles.slots} aria-label="Franjas del día">
                    {day.franjas.map((slot) => (
                      <li
                        key={slot.horaInicio}
                        className={`${styles.slot} ${slot.disponible ? styles.free : styles.busy}`}
                      >
                        <span className={styles.slotTime}>
                          {formatHour(slot.horaInicio)} – {formatHour(slot.horaFin)}
                        </span>
                        <span className={styles.slotState}>
                          <Icon name={slot.disponible ? 'check' : 'close'} size={14} />
                          {slot.disponible ? 'Libre' : 'Ocupada'}
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
                {day.reservas.length > 0 && (
                  <ul className={styles.reservations} aria-label="Reservas del día">
                    {day.reservas.map((reservation) => (
                      <li key={reservation.idPrestamo}>
                        <span>
                          {formatDateTimeRange(
                            reservation.fechaHoraInicio,
                            reservation.fechaHoraFin,
                          )}
                        </span>
                        <span className={styles.reservationMeta}>
                          <StatusBadge status={reservation.estado} />
                          {reservation.propio && (
                            <Badge tone="blue" icon="user">
                              Tu reserva
                            </Badge>
                          )}
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
              </Card>
            )
          })}
        </ul>
      )}
    </section>
  )
}
