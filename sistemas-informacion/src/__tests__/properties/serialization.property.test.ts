import fc from 'fast-check'
import { describe, expect, it } from 'vitest'
import { InMemoryStorageRepository } from '@/services/storage'
import { LS_KEYS } from '@/shared/constants/lsKeys'
import type {
  Loan,
  LoanStatus,
  Resource,
  ResourceCondition,
  ResourceStatus,
  ResourceType,
  User,
  UserRole,
} from '@/shared/types'

const ROLES: UserRole[] = [
  'Estudiante',
  'Técnico_Laboratorio',
  'Administrador_Laboratorio',
]
const RESOURCE_STATUSES: ResourceStatus[] = [
  'Disponible',
  'Reservado',
  'En_Préstamo',
  'En_Mantenimiento',
  'Dado_de_Baja',
]
const RESOURCE_TYPES: ResourceType[] = ['Equipo', 'Herramienta', 'Material']
const LOAN_STATUSES: LoanStatus[] = [
  'Reservado',
  'En_Préstamo',
  'Devuelto',
  'Cancelado',
  'Vencido',
]
const CONDITIONS: ResourceCondition[] = ['Bueno', 'Regular', 'Dañado']

const textArb = fc.string({ unit: 'binary', maxLength: 60 })
const isoArb = fc
  .date({
    min: new Date('1970-01-01T00:00:00.000Z'),
    max: new Date('2100-01-01T00:00:00.000Z'),
    noInvalidDate: true,
  })
  .map((date) => date.toISOString())

/**
 * `fc.record` crea objetos sin prototipo; se copian a objetos planos para que
 * `toStrictEqual` compare contra lo que devuelve `JSON.parse`.
 */
const plain = <T extends object>(value: T): T => ({ ...value })

/**
 * Los campos opcionales se omiten (no se fijan en `undefined`): así es como
 * los producen los servicios, y `JSON.stringify` descarta `undefined`.
 */
const resourceArb: fc.Arbitrary<Resource> = fc.record(
  {
    idRecurso: fc.uuid(),
    nombre: textArb,
    codigoInventario: textArb,
    tipo: fc.constantFrom(...RESOURCE_TYPES),
    descripcion: textArb,
    imagenUrl: textArb,
    cantidadTotal: fc.integer({ min: 1, max: 1_000_000 }),
    cantidadDisponible: fc.integer({ min: 0, max: 1_000_000 }),
    estadoActual: fc.constantFrom(...RESOURCE_STATUSES),
    fechaCreacion: isoArb,
  },
  {
    requiredKeys: [
      'idRecurso',
      'nombre',
      'codigoInventario',
      'tipo',
      'descripcion',
      'cantidadTotal',
      'cantidadDisponible',
      'estadoActual',
      'fechaCreacion',
    ],
  },
).map(plain)

const userArb: fc.Arbitrary<User> = fc.record(
  {
    idUsuario: fc.uuid(),
    idRol: fc.constantFrom(...ROLES),
    nombre: textArb,
    correo: textArb,
    cedula: textArb,
    carnet: textArb,
    contrasena: textArb,
    fechaRegistro: isoArb,
    sanctionEndDate: isoArb,
  },
  {
    requiredKeys: [
      'idUsuario',
      'idRol',
      'nombre',
      'correo',
      'cedula',
      'contrasena',
      'fechaRegistro',
    ],
  },
).map(plain)

const loanArb: fc.Arbitrary<Loan> = fc.record(
  {
    idPrestamo: fc.uuid(),
    idUsuario: fc.uuid(),
    idRecurso: fc.uuid(),
    fechaHoraReserva: isoArb,
    fechaHoraInicioProgramada: isoArb,
    fechaHoraFinProgramada: isoArb,
    fechaHoraEntrega: isoArb,
    fechaHoraDevolucionReal: isoArb,
    estadoPrestamo: fc.constantFrom(...LOAN_STATUSES),
    motivoPrestamo: textArb,
    condicionEntrega: fc.constantFrom(...CONDITIONS),
    condicionDevolucion: fc.constantFrom(...CONDITIONS),
    observacionesEntrega: textArb,
    observacionesDevolucion: textArb,
    // `+ 0` normaliza -0 a 0, que es lo que devuelve JSON.parse.
    retrasoHoras: fc
      .double({ min: 0, max: 1_000_000, noNaN: true })
      .map((hours) => hours + 0),
  },
  {
    requiredKeys: [
      'idPrestamo',
      'idUsuario',
      'idRecurso',
      'fechaHoraReserva',
      'fechaHoraInicioProgramada',
      'fechaHoraFinProgramada',
      'estadoPrestamo',
      'motivoPrestamo',
    ],
  },
).map(plain)

describe('Propiedad de serialización JSON (round-trip)', () => {
  // Feature: frontend-sistema-prestamos-laboratorio, Property 11
  it('JSON.parse(JSON.stringify(recurso)) es equivalente al original', () => {
    fc.assert(
      fc.property(resourceArb, (resource) => {
        expect(JSON.parse(JSON.stringify(resource))).toStrictEqual(resource)
      }),
      { numRuns: 100 },
    )
  })

  // Feature: frontend-sistema-prestamos-laboratorio, Property 11
  it('JSON.parse(JSON.stringify(usuario)) es equivalente al original', () => {
    fc.assert(
      fc.property(userArb, (user) => {
        expect(JSON.parse(JSON.stringify(user))).toStrictEqual(user)
      }),
      { numRuns: 100 },
    )
  })

  // Feature: frontend-sistema-prestamos-laboratorio, Property 11
  it('JSON.parse(JSON.stringify(préstamo)) es equivalente al original', () => {
    fc.assert(
      fc.property(loanArb, (loan) => {
        expect(JSON.parse(JSON.stringify(loan))).toStrictEqual(loan)
      }),
      { numRuns: 100 },
    )
  })

  // Feature: frontend-sistema-prestamos-laboratorio, Property 11
  it('el repositorio devuelve las listas guardadas sin alterarlas', () => {
    fc.assert(
      fc.property(
        fc.array(resourceArb, { maxLength: 5 }),
        fc.array(userArb, { maxLength: 5 }),
        fc.array(loanArb, { maxLength: 5 }),
        (resources, users, loans) => {
          const repo = new InMemoryStorageRepository()
          repo.set(LS_KEYS.RESOURCES, resources)
          repo.set(LS_KEYS.USERS, users)
          repo.set(LS_KEYS.LOANS, loans)

          expect(repo.get<Resource[]>(LS_KEYS.RESOURCES)).toStrictEqual(resources)
          expect(repo.get<User[]>(LS_KEYS.USERS)).toStrictEqual(users)
          expect(repo.get<Loan[]>(LS_KEYS.LOANS)).toStrictEqual(loans)
        },
      ),
      { numRuns: 100 },
    )
  })
})
