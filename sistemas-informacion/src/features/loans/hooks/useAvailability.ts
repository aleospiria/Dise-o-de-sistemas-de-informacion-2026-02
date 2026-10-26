import { useMemo, useState } from 'react'
import { useLoans } from '@/contexts/useLoans'
import { useResources } from '@/contexts/useResources'
import {
  filterByName,
  filterByType,
  getActiveReservations,
  getNextAvailableAt,
  isListable,
  resolveAvailabilityWindow,
  sortByName,
  type Reservation,
} from '@/features/loans/availability'
import { useDebounce } from '@/shared/hooks/useDebounce'
import type { Resource, ResourceType } from '@/shared/types'
import { isResourceBookable } from '@/shared/utils/resourceRules'

export interface AvailabilityFilters {
  nombre: string
  tipo: ResourceType | ''
  fecha: string
  hora: string
}

const INITIAL_FILTERS: AvailabilityFilters = {
  nombre: '',
  tipo: '',
  fecha: '',
  hora: '',
}

export interface AvailabilityItem {
  resource: Resource
  /** Se puede reservar ahora: estado "Disponible" y con unidades libres. */
  bookable: boolean
  reservations: Reservation[]
  /** Solo si no se puede reservar: cuándo se libera la primera unidad. */
  nextAvailableAt?: string
}

const WINDOW_MESSAGES = {
  incomplete: 'Elige la fecha y la hora para filtrar por horario.',
  past: 'La fecha y la hora no pueden estar en el pasado.',
} as const

/**
 * Estado y resultados de la consulta de disponibilidad (Req 6.2–6.11).
 *
 * Con fecha y hora completas lista solo lo reservable en esa ventana; sin
 * ellas lista los recursos visibles marcando los no disponibles. La búsqueda
 * por nombre se aplica con retraso para no recalcular en cada tecla.
 */
export function useAvailability() {
  const { resources } = useResources()
  const { loans, getAvailableResources } = useLoans()
  const [filters, setFilters] = useState<AvailabilityFilters>(INITIAL_FILTERS)
  const debouncedNombre = useDebounce(filters.nombre)

  const { fecha, hora, tipo } = filters
  const items = useMemo<AvailabilityItem[]>(() => {
    const window = resolveAvailabilityWindow(fecha, hora)
    const base =
      window.status === 'ok'
        ? getAvailableResources(window.start, window.end)
        : resources.filter(isListable)

    return sortByName(filterByType(filterByName(base, debouncedNombre), tipo)).map(
      (resource) => {
        const bookable = isResourceBookable(resource)
        const reservations = getActiveReservations(loans, resource.idRecurso)
        return {
          resource,
          bookable,
          reservations,
          nextAvailableAt: bookable ? undefined : getNextAvailableAt(reservations),
        }
      },
    )
  }, [resources, loans, getAvailableResources, debouncedNombre, tipo, fecha, hora])

  const windowStatus = resolveAvailabilityWindow(fecha, hora).status
  const windowMessage =
    windowStatus === 'incomplete' || windowStatus === 'past'
      ? WINDOW_MESSAGES[windowStatus]
      : undefined

  function setFilter<K extends keyof AvailabilityFilters>(
    key: K,
    value: AvailabilityFilters[K],
  ) {
    setFilters((current) => ({ ...current, [key]: value }))
  }

  return {
    filters,
    setFilter,
    clearFilters: () => setFilters(INITIAL_FILTERS),
    hasActiveFilters: Object.values(filters).some(Boolean),
    items,
    /** Hay un horario válido aplicado al listado. */
    filteringByWindow: windowStatus === 'ok',
    windowMessage,
  }
}
