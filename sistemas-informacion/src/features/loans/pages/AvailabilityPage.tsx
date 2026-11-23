import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/contexts/useAuth'
import { useResources } from '@/contexts/useResources'
import { useToast } from '@/contexts/useToast'
import { ResourceCard } from '@/features/inventory/components/ResourceCard'
import { ResourceCalendarView } from '@/features/loans/components/ResourceCalendarView'
import { useAvailability } from '@/features/loans/hooks/useAvailability'
import { apiErrorMessage } from '@/services/api/errors'
import * as notificationsService from '@/services/api/notifications.service'
import styles from '@/features/loans/pages/AvailabilityPage.module.css'
import { Alert } from '@/shared/components/ui/Alert'
import { Button } from '@/shared/components/ui/Button'
import { EmptyState } from '@/shared/components/ui/EmptyState'
import { Icon } from '@/shared/components/ui/icons'
import { Input } from '@/shared/components/ui/Input'
import { PageHeader } from '@/shared/components/ui/PageHeader'
import { Select } from '@/shared/components/ui/Select'
import { SkeletonLoader } from '@/shared/components/ui/SkeletonLoader'
import { RESOURCE_TYPE_LABELS, RESOURCE_TYPES } from '@/shared/constants/resourceTypes'
import { toDateInputValue } from '@/shared/utils/dateUtils'

const TYPE_OPTIONS = RESOURCE_TYPES.map((value) => ({
  value,
  label: RESOURCE_TYPE_LABELS[value],
}))

/** Consulta de disponibilidad de recursos (Req 6). Visible para todos los roles. */
export function AvailabilityPage() {
  const { session } = useAuth()
  const navigate = useNavigate()
  const { showToast } = useToast()
  const { resources } = useResources()
  const [requested, setRequested] = useState<Set<string>>(new Set())
  const [showCalendar, setShowCalendar] = useState(false)
  const {
    filters,
    setFilter,
    clearFilters,
    hasActiveFilters,
    items,
    loading,
    error,
    retry,
    filteringByWindow,
    windowMessage,
  } = useAvailability()

  // Estudiantes y docentes pueden solicitar préstamos (RN-03).
  const canRequestLoan =
    session?.role === 'Estudiante' || session?.role === 'Docente'

  useEffect(() => {
    if (!canRequestLoan) return
    let active = true
    notificationsService
      .listAvailabilityRequests()
      .then((requests) => {
        if (active) {
          setRequested(
            new Set(
              requests
                .filter((request) => request.activa)
                .map((request) => request.idRecurso),
            ),
          )
        }
      })
      .catch(() => {
        // El aviso es opcional: si falla, la consulta de disponibilidad sigue.
      })
    return () => {
      active = false
    }
  }, [canRequestLoan])

  async function requestAvailability(resourceId: string) {
    try {
      await notificationsService.requestAvailability(resourceId)
      setRequested((current) => new Set(current).add(resourceId))
      showToast('success', 'Te avisaremos cuando el recurso esté disponible.')
    } catch (caught) {
      showToast('error', apiErrorMessage(caught))
    }
  }

  const resultsText = loading
    ? 'Consultando disponibilidad...'
    : items.length === 1
      ? '1 recurso encontrado.'
      : `${items.length} recursos encontrados.`

  return (
    <div className={styles.page}>
      <PageHeader
        description={
          canRequestLoan
            ? 'Mira qué recursos están libres, filtra por tipo o por horario y solicita el que necesitas.'
            : 'Consulta qué recursos están libres, filtra por tipo o por horario y revisa sus próximas reservas.'
        }
        action={
          <Button
            variant="secondary"
            icon="calendar"
            aria-expanded={showCalendar}
            onClick={() => setShowCalendar((open) => !open)}
          >
            {showCalendar ? 'Ocultar calendario' : 'Ver calendario por recurso'}
          </Button>
        }
      />

      <section className={styles.filters} aria-label="Filtros de búsqueda">
        <fieldset className={styles.group}>
          <legend className={styles.legend}>
            <Icon name="search" size={16} />
            ¿Qué buscas?
          </legend>
          <div className={styles.groupFields}>
            <Input
              label="Buscar por nombre"
              type="search"
              autoComplete="off"
              value={filters.nombre}
              onChange={(e) => setFilter('nombre', e.target.value)}
            />
            <Select
              label="Tipo"
              placeholder="Todos los tipos"
              options={TYPE_OPTIONS}
              value={filters.tipo}
              onChange={(e) => setFilter('tipo', e.target.value as typeof filters.tipo)}
            />
          </div>
        </fieldset>
        <fieldset className={styles.group}>
          <legend className={styles.legend}>
            <Icon name="clock" size={16} />
            ¿Cuándo lo necesitas?
          </legend>
          <div className={styles.groupFields}>
            <Input
              label="Fecha"
              type="date"
              min={toDateInputValue()}
              value={filters.fecha}
              onChange={(e) => setFilter('fecha', e.target.value)}
            />
            <Input
              label="Hora"
              type="time"
              value={filters.hora}
              onChange={(e) => setFilter('hora', e.target.value)}
            />
          </div>
          <p className={styles.hint}>
            Con fecha y hora se muestran los recursos libres durante 1 hora desde ese momento.
          </p>
        </fieldset>
        <div className={styles.filtersActions}>
          <Button
            variant="secondary"
            icon="close"
            onClick={clearFilters}
            disabled={!hasActiveFilters}
          >
            Limpiar filtros
          </Button>
        </div>
      </section>

      {error && (
        <Alert type="error">
          <span>No se pudo consultar la disponibilidad: {error}</span>{' '}
          <Button size="sm" variant="secondary" icon="refresh" onClick={retry}>
            Reintentar
          </Button>
        </Alert>
      )}

      {/* Región viva: anuncia el cambio de resultados y los avisos del horario. */}
      <div aria-live="polite" className={styles.summary}>
        {windowMessage && (
          <p className={styles.warning}>
            <Icon name="alert-triangle" size={18} />
            {windowMessage}
          </p>
        )}
        <p className={styles.count}>
          {resultsText}
          {filteringByWindow && ' Disponibles en el horario elegido.'}
        </p>
      </div>

      {loading ? (
        <SkeletonLoader variant="card" count={3} />
      ) : items.length === 0 ? (
        <EmptyState
          icon="search"
          title="No hay recursos que coincidan con la búsqueda."
          description="Prueba con otro nombre, otro tipo o un horario distinto."
          action={
            hasActiveFilters ? (
              <Button variant="secondary" onClick={clearFilters} icon="refresh">
                Ver todos los recursos
              </Button>
            ) : undefined
          }
        />
      ) : (
        <ul className={styles.results}>
          {items.map(({ resource, reservations, nextAvailableAt }) => (
            <li key={resource.idRecurso}>
              <ResourceCard
                resource={resource}
                reservations={reservations}
                nextAvailableAt={nextAvailableAt}
                onRequestLoan={
                  canRequestLoan
                    ? () => navigate(`/loans/new/${resource.idRecurso}`)
                    : undefined
                }
                onRequestAvailability={
                  canRequestLoan
                    ? () => void requestAvailability(resource.idRecurso)
                    : undefined
                }
                availabilityRequested={requested.has(resource.idRecurso)}
              />
            </li>
          ))}
        </ul>
      )}

      {showCalendar && <ResourceCalendarView resources={resources} />}
    </div>
  )
}
