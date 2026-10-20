import { describe, expect, it } from 'vitest'
import {
  calculateDelayHours,
  intervalsOverlap,
} from '@/shared/utils/dateUtils'
import { hashPassword, verifyPassword } from '@/shared/utils/hashUtils'
import {
  passwordsMatch,
  validateLoanTimes,
  validatePassword,
  validateQuantity,
} from '@/shared/utils/validators'
import {
  isValidTransition,
  RETURN_CONDITION_STRATEGY,
} from '@/shared/constants/resourceStateMachine'

describe('validators', () => {
  it('acepta contraseña fuerte y rechaza débiles', () => {
    expect(validatePassword('Abcdef12')).toBe(true)
    expect(validatePassword('abcdef12')).toBe(false) // sin mayúscula
    expect(validatePassword('ABCDEF12')).toBe(false) // sin minúscula
    expect(validatePassword('Abcdefgh')).toBe(false) // sin dígito
    expect(validatePassword('Abc12')).toBe(false) // < 8 chars
  })

  it('passwordsMatch compara exactamente', () => {
    expect(passwordsMatch('Secreto1', 'Secreto1')).toBe(true)
    expect(passwordsMatch('Secreto1', 'secreto1')).toBe(false)
  })

  it('validateQuantity exige entero positivo', () => {
    expect(validateQuantity(1)).toBe(true)
    expect(validateQuantity(0)).toBe(false)
    expect(validateQuantity(-3)).toBe(false)
    expect(validateQuantity(2.5)).toBe(false)
  })

  it('validateLoanTimes respeta mínimo 1h y máximo 24h', () => {
    const base = new Date(Date.now() + 60 * 60 * 1000) // +1h desde ahora
    const start = base.toISOString()
    const end2h = new Date(base.getTime() + 2 * 60 * 60 * 1000).toISOString()
    const end30m = new Date(base.getTime() + 30 * 60 * 1000).toISOString()
    const end25h = new Date(base.getTime() + 25 * 60 * 60 * 1000).toISOString()

    expect(validateLoanTimes(start, end2h).valid).toBe(true)
    expect(validateLoanTimes(start, end30m).valid).toBe(false)
    expect(validateLoanTimes(start, end25h).valid).toBe(false)
  })

  it('validateLoanTimes rechaza inicio en el pasado', () => {
    const past = new Date(Date.now() - 60 * 60 * 1000).toISOString()
    const end = new Date(Date.now() + 60 * 60 * 1000).toISOString()
    expect(validateLoanTimes(past, end).valid).toBe(false)
  })
})

describe('dateUtils', () => {
  it('calculateDelayHours nunca es negativo', () => {
    const end = '2026-10-15T10:00:00.000Z'
    const late = '2026-10-15T13:00:00.000Z'
    const early = '2026-10-15T09:00:00.000Z'
    expect(calculateDelayHours(late, end)).toBe(3)
    expect(calculateDelayHours(early, end)).toBe(0)
    expect(calculateDelayHours(end, end)).toBe(0)
  })

  it('intervalsOverlap detecta solapamiento y permite extremos contiguos', () => {
    const a = ['2026-10-15T10:00:00Z', '2026-10-15T12:00:00Z'] as const
    // se solapa
    expect(intervalsOverlap(a[0], a[1], '2026-10-15T11:00:00Z', '2026-10-15T13:00:00Z')).toBe(true)
    // contiguos (end1 === start2) → no solapa
    expect(intervalsOverlap(a[0], a[1], '2026-10-15T12:00:00Z', '2026-10-15T14:00:00Z')).toBe(false)
    // disjuntos
    expect(intervalsOverlap(a[0], a[1], '2026-10-15T15:00:00Z', '2026-10-15T16:00:00Z')).toBe(false)
  })
})

describe('hashUtils', () => {
  it('es determinista y verificable', () => {
    const h = hashPassword('Secreto1')
    expect(hashPassword('Secreto1')).toBe(h)
    expect(verifyPassword('Secreto1', h)).toBe(true)
    expect(verifyPassword('Otra1234', h)).toBe(false)
  })
})

describe('resourceStateMachine', () => {
  it('valida transiciones según la tabla declarativa', () => {
    expect(isValidTransition('Disponible', 'Reservado')).toBe(true)
    expect(isValidTransition('Reservado', 'En_Préstamo')).toBe(true)
    expect(isValidTransition('En_Préstamo', 'En_Mantenimiento')).toBe(true)
    // inválidas
    expect(isValidTransition('Disponible', 'En_Préstamo')).toBe(false)
    expect(isValidTransition('Dado_de_Baja', 'Disponible')).toBe(false)
  })

  it('estrategia de devolución mapea condición a estado', () => {
    expect(RETURN_CONDITION_STRATEGY.Bueno.nuevoEstado).toBe('Disponible')
    expect(RETURN_CONDITION_STRATEGY.Regular.nuevoEstado).toBe('Disponible')
    expect(RETURN_CONDITION_STRATEGY.Dañado.nuevoEstado).toBe('En_Mantenimiento')
  })
})
