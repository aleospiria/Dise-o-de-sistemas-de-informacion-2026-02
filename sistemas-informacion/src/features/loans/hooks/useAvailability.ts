import { useEffect, useMemo, useState } from 'react'
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
import type { MaybePromise, Resource, ResourceType } from '@/shared/types'
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

type AvailabilityEntry = readonly [string, string | undefined]

function isPromise<T>(value: MaybePromise<T>): value is Promise<T> {
  return typeof (value as Promise<T> | undefined)?.then === 'function'
}

/**
 * Estado y resultados de la consulta de disponibilidad (Req 6.2–6.11).
 *
 * Con fecha y hora completas lista solo lo reservable en esa ventana; sin
 * ellas lista los recursos visibles marcando los no disponibles. La búsqueda
 * por nombre se aplica con retraso para no recalcular en cada tecla.
 */
export function useAvailability() {
  const { resources } = useResources()
  const { loans, getAvailableResources, getResourceAvailability } = useLoans()
  const [filters, setFilters] = useState<AvailabilityFilters>(INITIAL_FILTERS)
  const [windowResult, setWindowResult] = useState<{
    key: string
    resources: Resource[]
  } | null>(null)
  const [nextAvailability, setNextAvailability] = useState<
    Record<string, string | undefined>
  >({})
  const debouncedNombre = useDebounce(filters.nombre)

  const { fecha, hora, tipo } = filters
  const window = resolveAvailabilityWindow(fecha, hora)
  const windowStart = window.status === 'ok' ? window.start : undefined
  const windowEnd = window.status === 'ok' ? window.end : undefined
  const windowKey =
    windowStart && windowEnd ? `${windowStart}|${windowEnd}` : null
  const windowResources =
    windowKey && windowResult?.key === windowKey ? windowResult.resources : null
  const loading = Boolean(windowKey && !windowResources)

  useEffect(() => {
    let active = true
    const now = new Date()
    const detailStart = windowStart ?? now.toISOString()
    const detailEnd =
      windowEnd ?? new Date(now.getTime() + 60 * 60 * 1000).toISOString()

    function resolveDetails(base: Resource[]): MaybePromise<AvailabilityEntry[]> {
      const entries: AvailabilityEntry[] = []
      const pending: Promise<AvailabilityEntry>[] = []
      for (const resource of base.filter((r) => !isResourceBookable(r))) {
        const info = getResourceAvailability(
          resource.idRecurso,
          detailStart,
          detailEnd,
        )
        if (isPromise(info)) {
          pending.push(
            info.then(
              (value) =>
                [resource.idRecurso, value.proximaDisponibilidad] as const,
            ),
          )
        } else {
          entries.push([resource.idRecurso, info.proximaDisponibilidad] as const)
        }
      }
      if (pending.length === 0) return entries
      return Promise.all([
        ...pending,
        ...entries.map((entry) => Promise.resolve(entry)),
      ])
    }

    function apply(base: Resource[], entries: AvailabilityEntry[]) {
      if (!active) return
      setWindowResult(windowKey ? { key: windowKey, resources: base } : null)
      setNextAvailability(Object.fromEntries(entries))
    }

    const baseResult: MaybePromise<Resource[]> =
      windowKey && windowStart && windowEnd
        ? getAvailableResources(windowStart, windowEnd)
        : resources.filter(isListable)

    if (isPromise(baseResult)) {
      baseResult
        .then(async (base) => {
          const details = resolveDetails(base)
          const entries = isPromise(details) ? await details : details
          apply(base, entries)
        })
        .catch(() => apply([], []))
    } else {
      const details = resolveDetails(baseResult)
      if (isPromise(details)) {
        details
          .then((entries) => apply(baseResult, entries))
          .catch(() => apply(baseResult, []))
      } else {
        apply(baseResult, details)
      }
    }

    return () => {
      active = false
    }
  }, [
    windowKey,
    windowStart,
    windowEnd,
    resources,
    loans,
    getAvailableResources,
    getResourceAvailability,
  ])

  const items = useMemo<AvailabilityItem[]>(() => {
    const base = windowKey
      ? (windowResources ?? [])
      : resources.filter(isListable)

    return sortByName(filterByType(filterByName(base, debouncedNombre), tipo)).map(
      (resource) => {
        const bookable = isResourceBookable(resource)
        const reservations = getActiveReservations(loans, resource.idRecurso)
        return {
          resource,
          bookable,
          reservations,
          nextAvailableAt: bookable
            ? undefined
            : (nextAvailability[resource.idRecurso] ??
              getNextAvailableAt(reservations)),
        }
      },
    )
  }, [
    resources,
    loans,
    windowResources,
    windowKey,
    nextAvailability,
    debouncedNombre,
    tipo,
  ])

  const windowStatus = window.status
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
    loading,
    /** Hay un horario válido aplicado al listado. */
    filteringByWindow: windowStatus === 'ok',
    windowMessage,
  }
}
