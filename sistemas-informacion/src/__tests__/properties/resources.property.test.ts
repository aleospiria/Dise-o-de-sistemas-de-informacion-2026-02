import fc from 'fast-check'
import { describe, expect, it } from 'vitest'
import { InMemoryStorageRepository } from '@/services/storage'
import { LS_KEYS } from '@/shared/constants/lsKeys'
import { RESOURCE_TRANSITIONS } from '@/shared/constants/resourceStateMachine'
import { getAvailableResources } from '@/services/mockDb/loans.service'
import {
  getResourceById,
  getResources,
  updateResourceStatus,
} from '@/services/mockDb/resources.service'
import type {
  Loan,
  LoanStatus,
  Resource,
  ResourceStatus,
  ResourceStatusHistory,
  ResourceType,
} from '@/shared/types'
import { intervalsOverlap } from '@/shared/utils/dateUtils'

const MINUTE_MS = 60 * 1000
const BASE_MS = Date.UTC(2026, 5, 15, 8, 0, 0)

const ALL_STATUSES: ResourceStatus[] = [
  'Disponible',
  'Reservado',
  'En_Préstamo',
  'En_Mantenimiento',
  'Dado_de_Baja',
]
const ALL_LOAN_STATUSES: LoanStatus[] = [
  'Reservado',
  'En_Préstamo',
  'Devuelto',
  'Cancelado',
  'Vencido',
]
const ALL_TYPES: ResourceType[] = ['Equipo', 'Herramienta', 'Material']

const statusArb = fc.constantFrom(...ALL_STATUSES)
const isoAt = (minutesFromBase: number): string =>
  new Date(BASE_MS + minutesFromBase * MINUTE_MS).toISOString()

function buildResource(
  fields: Pick<Resource, 'idRecurso' | 'nombre' | 'estadoActual'> &
    Partial<Resource>,
): Resource {
  return {
    codigoInventario: 'COD-001',
    tipo: 'Equipo',
    descripcion: 'Recurso de prueba',
    cantidadTotal: 1,
    cantidadDisponible: 1,
    fechaCreacion: isoAt(0),
    ...fields,
  }
}

describe('Propiedades de filtrado por nombre (getResources)', () => {
  const resourcesArb = fc
    .uniqueArray(
      fc.record({
        idRecurso: fc.uuid(),
        nombre: fc.string({ maxLength: 30 }),
        estadoActual: statusArb,
      }),
      { selector: (r) => r.idRecurso, maxLength: 15 },
    )
    .map((items) => items.map((item) => buildResource(item)))

  /** Término arbitrario o fragmento real de alguno de los nombres. */
  const scenarioArb = resourcesArb.chain((resources) => {
    const fragment =
      resources.length === 0
        ? fc.string({ maxLength: 4 })
        : fc
            .tuple(fc.constantFrom(...resources), fc.nat(30), fc.nat(30))
            .map(([resource, from, length]) =>
              resource.nombre.slice(from, from + length),
            )
    return fc.record({
      resources: fc.constant(resources),
      term: fc.oneof(fc.string({ maxLength: 4 }), fragment),
    })
  })

  // Feature: frontend-sistema-prestamos-laboratorio, Property 4
  it('retorna un subconjunto cuyos nombres contienen el término', () => {
    fc.assert(
      fc.property(scenarioArb, ({ resources, term }) => {
        const repo = new InMemoryStorageRepository()
        repo.set(LS_KEYS.RESOURCES, resources)

        const found = getResources({ nombre: term }, repo)

        expect(found.length).toBeLessThanOrEqual(resources.length)
        const knownIds = new Set(resources.map((r) => r.idRecurso))
        for (const resource of found) {
          expect(knownIds.has(resource.idRecurso)).toBe(true)
          expect(resource.nombre.toLowerCase()).toContain(term.toLowerCase())
        }
      }),
      { numRuns: 100 },
    )
  })

  // Feature: frontend-sistema-prestamos-laboratorio, Property 4
  it('no omite ningún recurso (no dado de baja) cuyo nombre contenga el término', () => {
    fc.assert(
      fc.property(scenarioArb, ({ resources, term }) => {
        const repo = new InMemoryStorageRepository()
        repo.set(LS_KEYS.RESOURCES, resources)

        const foundIds = new Set(
          getResources({ nombre: term }, repo).map((r) => r.idRecurso),
        )

        for (const resource of resources) {
          const matches = resource.nombre
            .toLowerCase()
            .includes(term.toLowerCase())
          const visible = resource.estadoActual !== 'Dado_de_Baja'
          expect(foundIds.has(resource.idRecurso)).toBe(matches && visible)
        }
      }),
      { numRuns: 100 },
    )
  })
})

describe('Propiedades de disponibilidad por horario (getAvailableResources)', () => {
  const RESOURCE_IDS = ['r-a', 'r-b', 'r-c', 'r-d']

  const resourceArb = (id: string): fc.Arbitrary<Resource> =>
    fc
      .record({
        cantidadTotal: fc.integer({ min: 1, max: 4 }),
        estadoActual: statusArb,
        tipo: fc.constantFrom(...ALL_TYPES),
      })
      .chain(({ cantidadTotal, estadoActual, tipo }) =>
        fc.integer({ min: 0, max: cantidadTotal }).map((cantidadDisponible) =>
          buildResource({
            idRecurso: id,
            nombre: `Recurso ${id}`,
            estadoActual,
            tipo,
            cantidadTotal,
            cantidadDisponible,
          }),
        ),
      )

  const loanArb = fc.record({
    idRecurso: fc.constantFrom(...RESOURCE_IDS),
    startMin: fc.integer({ min: 0, max: 48 * 60 }),
    durationMin: fc.integer({ min: 60, max: 10 * 60 }),
    estadoPrestamo: fc.constantFrom(...ALL_LOAN_STATUSES),
  })

  const loansArb = fc.array(loanArb, { maxLength: 12 }).map((items) =>
    items.map(
      ({ idRecurso, startMin, durationMin, estadoPrestamo }, index): Loan => ({
        idPrestamo: `l-${index}`,
        idUsuario: 'u-1',
        idRecurso,
        fechaHoraReserva: isoAt(0),
        fechaHoraInicioProgramada: isoAt(startMin),
        fechaHoraFinProgramada: isoAt(startMin + durationMin),
        estadoPrestamo,
        motivoPrestamo: 'Práctica de laboratorio.',
      }),
    ),
  )

  const scenarioArb = fc.record({
    resources: fc.tuple(...RESOURCE_IDS.map(resourceArb)),
    loans: loansArb,
    queryStartMin: fc.integer({ min: 0, max: 48 * 60 }),
    queryDurationMin: fc.integer({ min: 60, max: 10 * 60 }),
  })

  function activeOverlaps(
    loans: Loan[],
    resourceId: string,
    start: string,
    end: string,
  ): Loan[] {
    return loans.filter(
      (l) =>
        l.idRecurso === resourceId &&
        (l.estadoPrestamo === 'Reservado' ||
          l.estadoPrestamo === 'En_Préstamo') &&
        intervalsOverlap(
          l.fechaHoraInicioProgramada,
          l.fechaHoraFinProgramada,
          start,
          end,
        ),
    )
  }

  // Feature: frontend-sistema-prestamos-laboratorio, Property 5
  it('no retorna recursos cuyos préstamos activos solapados agoten sus unidades', () => {
    fc.assert(
      fc.property(
        scenarioArb,
        ({ resources, loans, queryStartMin, queryDurationMin }) => {
          const repo = new InMemoryStorageRepository()
          repo.set(LS_KEYS.RESOURCES, resources)
          repo.set(LS_KEYS.LOANS, loans)
          const start = isoAt(queryStartMin)
          const end = isoAt(queryStartMin + queryDurationMin)

          const available = getAvailableResources(start, end, undefined, repo)

          for (const resource of available) {
            const overlapping = activeOverlaps(
              loans,
              resource.idRecurso,
              start,
              end,
            )
            expect(overlapping.length).toBeLessThan(resource.cantidadTotal)
            // Con una sola unidad, cualquier solape activo la deja ocupada.
            if (resource.cantidadTotal === 1) {
              expect(overlapping).toHaveLength(0)
            }
          }
        },
      ),
      { numRuns: 100 },
    )
  })

  // Feature: frontend-sistema-prestamos-laboratorio, Property 5
  it('retorna todo recurso reservable sin préstamos activos solapados', () => {
    fc.assert(
      fc.property(
        scenarioArb,
        ({ resources, loans, queryStartMin, queryDurationMin }) => {
          const repo = new InMemoryStorageRepository()
          repo.set(LS_KEYS.RESOURCES, resources)
          repo.set(LS_KEYS.LOANS, loans)
          const start = isoAt(queryStartMin)
          const end = isoAt(queryStartMin + queryDurationMin)

          const availableIds = new Set(
            getAvailableResources(start, end, undefined, repo).map(
              (r) => r.idRecurso,
            ),
          )

          for (const resource of resources) {
            const free =
              resource.estadoActual === 'Disponible' &&
              resource.cantidadDisponible > 0 &&
              activeOverlaps(loans, resource.idRecurso, start, end).length === 0
            if (free) {
              expect(availableIds.has(resource.idRecurso)).toBe(true)
            }
          }
        },
      ),
      { numRuns: 100 },
    )
  })
})

describe('Propiedades de transición de estado (updateResourceStatus)', () => {
  const RESOURCE_ID = 'r-1'

  function seededRepo(from: ResourceStatus): InMemoryStorageRepository {
    const repo = new InMemoryStorageRepository()
    repo.set(LS_KEYS.RESOURCES, [
      buildResource({
        idRecurso: RESOURCE_ID,
        nombre: 'Osciloscopio',
        estadoActual: from,
      }),
    ])
    return repo
  }

  // Feature: frontend-sistema-prestamos-laboratorio, Property 10
  it('rechaza toda transición ausente de la tabla y no modifica el recurso', () => {
    fc.assert(
      fc.property(statusArb, statusArb, (from, to) => {
        fc.pre(!RESOURCE_TRANSITIONS[from].includes(to))
        const repo = seededRepo(from)

        const result = updateResourceStatus(RESOURCE_ID, to, undefined, repo)

        expect(result.success).toBe(false)
        expect(result.error).toBeTruthy()
        expect(getResourceById(RESOURCE_ID, repo)?.estadoActual).toBe(from)
        expect(repo.get<ResourceStatusHistory[]>(LS_KEYS.STATUS_HISTORY)).toBeNull()
      }),
      { numRuns: 100 },
    )
  })

  // Feature: frontend-sistema-prestamos-laboratorio, Property 10
  it('acepta toda transición de la tabla y registra el cambio en el historial', () => {
    fc.assert(
      fc.property(statusArb, statusArb, (from, to) => {
        fc.pre(RESOURCE_TRANSITIONS[from].includes(to))
        const repo = seededRepo(from)

        const result = updateResourceStatus(RESOURCE_ID, to, 'Motivo', repo)

        expect(result.success).toBe(true)
        expect(getResourceById(RESOURCE_ID, repo)?.estadoActual).toBe(to)
        const history = repo.get<ResourceStatusHistory[]>(LS_KEYS.STATUS_HISTORY)
        expect(history).toHaveLength(1)
        expect(history?.[0]).toMatchObject({ idRecurso: RESOURCE_ID, estado: to })
      }),
      { numRuns: 100 },
    )
  })
})
