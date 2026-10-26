import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/contexts/useAuth'
import { ResourceCard } from '@/features/inventory/components/ResourceCard'
import { useAvailability } from '@/features/loans/hooks/useAvailability'
import styles from '@/features/loans/pages/AvailabilityPage.module.css'
import { Button } from '@/shared/components/ui/Button'
import { Input } from '@/shared/components/ui/Input'
import { Select } from '@/shared/components/ui/Select'
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
  const {
    filters,
    setFilter,
    clearFilters,
    hasActiveFilters,
    items,
    filteringByWindow,
    windowMessage,
  } = useAvailability()

  // Solo los estudiantes solicitan préstamos (Req 8.1).
  const canRequestLoan = session?.role === 'Estudiante'

  const resultsText =
    items.length === 1 ? '1 recurso encontrado.' : `${items.length} recursos encontrados.`

  return (
    <div className={styles.page}>
      <section className={styles.filters} aria-label="Filtros de búsqueda">
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

        <div className={styles.filtersActions}>
          <Button variant="secondary" onClick={clearFilters} disabled={!hasActiveFilters}>
            Limpiar filtros
          </Button>
          <p className={styles.hint}>
            Con fecha y hora se muestran los recursos libres durante 1 hora desde ese momento.
          </p>
        </div>
      </section>

      {/* Región viva: anuncia el cambio de resultados y los avisos del horario. */}
      <div aria-live="polite">
        {windowMessage && <p className={styles.warning}>{windowMessage}</p>}
        <p className={styles.hint}>
          {resultsText}
          {filteringByWindow && ' Disponibles en el horario elegido.'}
        </p>
      </div>

      {items.length === 0 ? (
        <div className={styles.empty}>
          <p>No hay recursos que coincidan con la búsqueda.</p>
        </div>
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
              />
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
