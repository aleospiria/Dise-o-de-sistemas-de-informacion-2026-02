import fc from 'fast-check'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { InMemoryStorageRepository } from '@/services/storage'
import { LS_KEYS } from '@/shared/constants/lsKeys'
import { seedData } from '@/services/mockDb/seed-data'
import {
  getCurrentSession,
  loginUser,
} from '@/services/mockDb/auth.service'
import {
  createLoan,
  registerDelivery,
  registerReturn,
} from '@/services/mockDb/loans.service'
import { getResourceById } from '@/services/mockDb/resources.service'
import type { Loan, LoanFormData, Resource } from '@/shared/types'
import { calculateDelayHours } from '@/shared/utils/dateUtils'

const MINUTE_MS = 60 * 1000
const HOUR_MS = 60 * MINUTE_MS
const FIXED_NOW = Date.UTC(2026, 5, 15, 12, 0, 0)

const ALPHANUMERIC = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
const RESOURCE_ID = 'r-prop-1'

/** Texto sin espacios en los extremos, para que `trim()` no cambie su longitud. */
const textArb = (minLength: number, maxLength: number): fc.Arbitrary<string> =>
  fc.string({ unit: fc.constantFrom(...ALPHANUMERIC), minLength, maxLength })

function repoWithResource(cantidadTotal: number): InMemoryStorageRepository {
  const resource: Resource = {
    idRecurso: RESOURCE_ID,
    nombre: 'Osciloscopio',
    codigoInventario: 'EQ-PROP-001',
    tipo: 'Equipo',
    descripcion: 'Recurso para pruebas de propiedades',
    cantidadTotal,
    cantidadDisponible: cantidadTotal,
    estadoActual: 'Disponible',
    fechaCreacion: new Date(FIXED_NOW).toISOString(),
  }
  const repo = new InMemoryStorageRepository()
  repo.set(LS_KEYS.RESOURCES, [resource])
  return repo
}

function loanForm(startMin: number, durationMin: number, motivo: string): LoanFormData {
  const start = FIXED_NOW + startMin * MINUTE_MS
  return {
    idRecurso: RESOURCE_ID,
    fechaHoraInicioProgramada: new Date(start).toISOString(),
    fechaHoraFinProgramada: new Date(start + durationMin * MINUTE_MS).toISOString(),
    motivoPrestamo: motivo,
  }
}

describe('Propiedades de loginUser', () => {
  const SEEDED_EMAILS = [
    'admin@itm.edu.co',
    'tecnico@itm.edu.co',
    'estudiante@itm.edu.co',
  ]

  function seededRepo(): InMemoryStorageRepository {
    const repo = new InMemoryStorageRepository()
    seedData(repo)
    return repo
  }

  // Feature: frontend-sistema-prestamos-laboratorio, Property 3
  it('rechaza correos no registrados con un mensaje genérico invariable', () => {
    const baseline = loginUser('estudiante@itm.edu.co', 'No-es-la-clave-1', seededRepo())

    fc.assert(
      fc.property(
        fc.oneof(fc.emailAddress(), fc.string()),
        fc.string({ unit: 'binary' }),
        (correo, contrasena) => {
          fc.pre(!SEEDED_EMAILS.includes(correo.trim().toLowerCase()))
          const repo = seededRepo()

          const result = loginUser(correo, contrasena, repo)

          expect(baseline.success).toBe(false)
          expect(result.success).toBe(false)
          expect(result.data).toBeUndefined()
          expect(result.error).toBe(baseline.error)
          expect(getCurrentSession(repo)).toBeNull()
        },
      ),
      { numRuns: 100 },
    )
  })

  // Feature: frontend-sistema-prestamos-laboratorio, Property 3
  it('da el mismo mensaje con un correo registrado y contraseña incorrecta', () => {
    const baseline = loginUser('no-existe@itm.edu.co', 'Clave1234', seededRepo())

    fc.assert(
      fc.property(
        fc.constantFrom(...SEEDED_EMAILS),
        fc.string(),
        (correo, contrasena) => {
          fc.pre(
            contrasena !== 'Admin123' &&
              contrasena !== 'Tecnico123' &&
              contrasena !== 'Estudiante123',
          )
          const result = loginUser(correo, contrasena, seededRepo())

          expect(result.success).toBe(false)
          expect(result.error).toBe(baseline.error)
        },
      ),
      { numRuns: 100 },
    )
  })
})

describe('Propiedades de calculateDelayHours', () => {
  // Feature: frontend-sistema-prestamos-laboratorio, Property 8
  it('es igual a max(0, devolución real − fin programada) en horas', () => {
    const instantMs = fc.integer({ min: 0, max: 4_000_000_000_000 })

    fc.assert(
      fc.property(instantMs, instantMs, (realMs, scheduledMs) => {
        const delay = calculateDelayHours(
          new Date(realMs).toISOString(),
          new Date(scheduledMs).toISOString(),
        )

        expect(delay).toBe(Math.max(0, (realMs - scheduledMs) / HOUR_MS))
        expect(delay).toBeGreaterThanOrEqual(0)
      }),
      { numRuns: 100 },
    )
  })
})

describe('Propiedades del ciclo de préstamo (createLoan, registerReturn)', () => {
  beforeEach(() => {
    vi.useFakeTimers({ now: FIXED_NOW })
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  // Feature: frontend-sistema-prestamos-laboratorio, Property 7
  it('createLoan con datos válidos deja el préstamo en estado Reservado', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 5 }),
        fc.integer({ min: 0, max: 30 * 24 * 60 }),
        fc.integer({ min: 60, max: 24 * 60 }),
        textArb(10, 500),
        fc.uuid(),
        (cantidadTotal, startMin, durationMin, motivo, userId) => {
          const repo = repoWithResource(cantidadTotal)

          const result = createLoan(loanForm(startMin, durationMin, motivo), userId, repo)

          expect(result.success).toBe(true)
          expect(result.data?.estadoPrestamo).toBe('Reservado')
          expect(result.data?.idUsuario).toBe(userId)
          const stored = repo.get<Loan[]>(LS_KEYS.LOANS) ?? []
          expect(stored.map((l) => l.idPrestamo)).toEqual([result.data?.idPrestamo])
          expect(getResourceById(RESOURCE_ID, repo)?.cantidadDisponible).toBe(
            cantidadTotal - 1,
          )
        },
      ),
      { numRuns: 100 },
    )
  })

  // Feature: frontend-sistema-prestamos-laboratorio, Property 9
  it('registerReturn con condición Dañado deja el recurso En_Mantenimiento', () => {
    const scenarioArb = fc
      .integer({ min: 1, max: 5 })
      .chain((cantidadTotal) =>
        fc.record({
          cantidadTotal: fc.constant(cantidadTotal),
          otrasReservas: fc.integer({ min: 0, max: cantidadTotal - 1 }),
          condicionEntrega: fc.constantFrom('Bueno', 'Regular'),
          observaciones: textArb(0, 100),
        }),
      )

    fc.assert(
      fc.property(
        scenarioArb,
        ({ cantidadTotal, otrasReservas, condicionEntrega, observaciones }) => {
          const repo = repoWithResource(cantidadTotal)
          const form = loanForm(60, 120, 'Práctica de laboratorio de circuitos.')
          for (let i = 0; i < otrasReservas; i++) {
            expect(createLoan(form, `otro-${i}`, repo).success).toBe(true)
          }
          const loan = createLoan(form, 'usuario-bajo-prueba', repo).data
          expect(loan).toBeDefined()
          const loanId = loan?.idPrestamo ?? ''
          expect(registerDelivery(loanId, { condicion: condicionEntrega }, repo).success).toBe(true)

          const result = registerReturn(loanId, { condicion: 'Dañado', observaciones }, repo)

          expect(result.success).toBe(true)
          expect(result.data?.condicionDevolucion).toBe('Dañado')
          expect(getResourceById(RESOURCE_ID, repo)?.estadoActual).toBe('En_Mantenimiento')
        },
      ),
      { numRuns: 100 },
    )
  })
})
