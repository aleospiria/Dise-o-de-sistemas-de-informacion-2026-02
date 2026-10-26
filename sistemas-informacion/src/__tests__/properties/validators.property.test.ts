import fc from 'fast-check'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import {
  passwordsMatch,
  validateLoanTimes,
  validatePassword,
} from '@/shared/utils/validators'

const HOUR_MS = 60 * 60 * 1000
const FIXED_NOW = Date.UTC(2026, 5, 15, 12, 0, 0)

const UPPER = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'
const LOWER = 'abcdefghijklmnopqrstuvwxyz'
const DIGITS = '0123456789'
const SYMBOLS = ' !"#$%&\'()*+,-./:;<=>?@[\\]^_`{|}~'

/** Genera una cadena a partir de los caracteres del alfabeto dado. */
function stringFrom(
  alphabet: string,
  constraints: { minLength: number; maxLength: number },
): fc.Arbitrary<string> {
  return fc.string({ unit: fc.constantFrom(...alphabet), ...constraints })
}

const char = (alphabet: string): fc.Arbitrary<string> =>
  fc.constantFrom(...alphabet)

describe('Propiedades de validatePassword', () => {
  // Feature: frontend-sistema-prestamos-laboratorio, Property 1
  it('acepta toda cadena de ≥ 8 con mayúscula, minúscula y dígito', () => {
    const accepted = fc
      .tuple(
        char(UPPER),
        char(LOWER),
        char(DIGITS),
        fc.array(char(UPPER + LOWER + DIGITS + SYMBOLS), {
          minLength: 5,
          maxLength: 40,
        }),
      )
      .chain(([upper, lower, digit, filler]) => {
        const parts = [upper, lower, digit, ...filler]
        return fc
          .shuffledSubarray(parts, {
            minLength: parts.length,
            maxLength: parts.length,
          })
          .map((shuffled) => shuffled.join(''))
      })

    fc.assert(
      fc.property(accepted, (password) => {
        expect(validatePassword(password)).toBe(true)
      }),
      { numRuns: 100 },
    )
  })

  // Feature: frontend-sistema-prestamos-laboratorio, Property 1
  it('rechaza toda cadena de menos de 8 caracteres', () => {
    fc.assert(
      fc.property(fc.string({ maxLength: 7 }), (password) => {
        expect(validatePassword(password)).toBe(false)
      }),
      { numRuns: 100 },
    )
  })

  // Feature: frontend-sistema-prestamos-laboratorio, Property 1
  it('rechaza toda cadena larga sin mayúscula', () => {
    fc.assert(
      fc.property(
        stringFrom(LOWER + DIGITS + SYMBOLS, { minLength: 8, maxLength: 60 }),
        (password) => {
          expect(validatePassword(password)).toBe(false)
        },
      ),
      { numRuns: 100 },
    )
  })

  // Feature: frontend-sistema-prestamos-laboratorio, Property 1
  it('rechaza toda cadena larga sin minúscula', () => {
    fc.assert(
      fc.property(
        stringFrom(UPPER + DIGITS + SYMBOLS, { minLength: 8, maxLength: 60 }),
        (password) => {
          expect(validatePassword(password)).toBe(false)
        },
      ),
      { numRuns: 100 },
    )
  })

  // Feature: frontend-sistema-prestamos-laboratorio, Property 1
  it('rechaza toda cadena larga sin dígito', () => {
    fc.assert(
      fc.property(
        stringFrom(UPPER + LOWER + SYMBOLS, { minLength: 8, maxLength: 60 }),
        (password) => {
          expect(validatePassword(password)).toBe(false)
        },
      ),
      { numRuns: 100 },
    )
  })
})

describe('Propiedades de passwordsMatch', () => {
  // Feature: frontend-sistema-prestamos-laboratorio, Property 2
  it('retorna false para todo par con a !== b', () => {
    fc.assert(
      fc.property(
        fc.string({ unit: 'binary' }),
        fc.string({ unit: 'binary' }),
        (a, b) => {
          fc.pre(a !== b)
          expect(passwordsMatch(a, b)).toBe(false)
        },
      ),
      { numRuns: 100 },
    )
  })

  // Feature: frontend-sistema-prestamos-laboratorio, Property 2
  it('retorna true cuando ambas cadenas son iguales', () => {
    fc.assert(
      fc.property(fc.string({ unit: 'binary' }), (a) => {
        expect(passwordsMatch(a, a)).toBe(true)
      }),
      { numRuns: 100 },
    )
  })
})

describe('Propiedades de validateLoanTimes', () => {
  beforeEach(() => {
    vi.useFakeTimers({ now: FIXED_NOW })
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  const iso = (ms: number): string => new Date(ms).toISOString()

  // Feature: frontend-sistema-prestamos-laboratorio, Property 6
  it('rechaza todo inicio en el pasado, sea cual sea el fin', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 365 * 24 * HOUR_MS }),
        fc.integer({ min: HOUR_MS, max: 24 * HOUR_MS }),
        (msAgo, durationMs) => {
          const start = FIXED_NOW - msAgo
          const result = validateLoanTimes(iso(start), iso(start + durationMs))
          expect(result.valid).toBe(false)
        },
      ),
      { numRuns: 100 },
    )
  })

  // Feature: frontend-sistema-prestamos-laboratorio, Property 6
  it('rechaza toda duración menor a 1 hora (incluida negativa)', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 0, max: 30 * 24 * HOUR_MS }),
        fc.integer({ min: -24 * HOUR_MS, max: HOUR_MS - 1 }),
        (msAhead, durationMs) => {
          const start = FIXED_NOW + msAhead
          const result = validateLoanTimes(iso(start), iso(start + durationMs))
          expect(result.valid).toBe(false)
        },
      ),
      { numRuns: 100 },
    )
  })

  // Feature: frontend-sistema-prestamos-laboratorio, Property 6
  it('rechaza toda duración mayor a 24 horas', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 0, max: 30 * 24 * HOUR_MS }),
        fc.integer({ min: 24 * HOUR_MS + 1, max: 30 * 24 * HOUR_MS }),
        (msAhead, durationMs) => {
          const start = FIXED_NOW + msAhead
          const result = validateLoanTimes(iso(start), iso(start + durationMs))
          expect(result.valid).toBe(false)
        },
      ),
      { numRuns: 100 },
    )
  })

  // Feature: frontend-sistema-prestamos-laboratorio, Property 6
  it('acepta inicio no pasado con duración entre 1 y 24 horas (inclusive)', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 0, max: 30 * 24 * HOUR_MS }),
        fc.integer({ min: HOUR_MS, max: 24 * HOUR_MS }),
        (msAhead, durationMs) => {
          const start = FIXED_NOW + msAhead
          const result = validateLoanTimes(iso(start), iso(start + durationMs))
          expect(result.valid).toBe(true)
        },
      ),
      { numRuns: 100 },
    )
  })
})
