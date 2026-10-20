/**
 * Funciones de validación puras.
 * Cada función tiene una única razón de cambio (SRP) y no depende de estado global,
 * lo que las hace ideales para Property-Based Testing.
 */
import { isDateInPast } from '@/shared/utils/dateUtils'

const MS_PER_HOUR = 1000 * 60 * 60
const MIN_LOAN_HOURS = 1
const MAX_LOAN_HOURS = 24

/**
 * Valida contraseña: mínimo 8 caracteres, al menos una mayúscula,
 * una minúscula y un dígito. (Req 1.4)
 */
export function validatePassword(s: string): boolean {
  if (s.length < 8) return false
  const hasUpper = /[A-ZÀ-ÖØ-Þ]/.test(s)
  const hasLower = /[a-zà-öø-ÿ]/.test(s)
  const hasDigit = /[0-9]/.test(s)
  return hasUpper && hasLower && hasDigit
}

/**
 * Indica si dos contraseñas coinciden exactamente. (Req 1.5)
 */
export function passwordsMatch(a: string, b: string): boolean {
  return a === b
}

/**
 * Valida formato básico de correo electrónico.
 */
export function validateEmail(email: string): boolean {
  // Un solo @, con texto antes, y un dominio con al menos un punto después.
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
}

export interface LoanTimesValidation {
  valid: boolean
  error?: string
}

/**
 * Valida los tiempos de un préstamo (Req 8.3, 8.4, 8.5):
 * - el inicio no puede estar en el pasado
 * - la duración mínima es 1 hora
 * - la duración máxima es 24 horas
 */
export function validateLoanTimes(
  start: string,
  end: string,
): LoanTimesValidation {
  const startMs = new Date(start).getTime()
  const endMs = new Date(end).getTime()

  if (Number.isNaN(startMs) || Number.isNaN(endMs)) {
    return { valid: false, error: 'Fechas inválidas.' }
  }
  if (isDateInPast(start)) {
    return { valid: false, error: 'La fecha de inicio no puede estar en el pasado.' }
  }

  const durationHours = (endMs - startMs) / MS_PER_HOUR
  if (durationHours < MIN_LOAN_HOURS) {
    return {
      valid: false,
      error: 'La duración mínima del préstamo es de 1 hora.',
    }
  }
  if (durationHours > MAX_LOAN_HOURS) {
    return {
      valid: false,
      error: 'La duración máxima del préstamo es de 24 horas.',
    }
  }
  return { valid: true }
}

/**
 * Valida el motivo del préstamo: entre 10 y 500 caracteres. (Req 8.6)
 */
export function validateMotivo(motivo: string): boolean {
  const len = motivo.trim().length
  return len >= 10 && len <= 500
}

/**
 * Valida el nombre de un recurso: no vacío y máximo 100 caracteres. (Req 4.4)
 */
export function validateResourceName(name: string): boolean {
  const len = name.trim().length
  return len > 0 && len <= 100
}

/**
 * Valida la cantidad de un recurso: entero mayor que 0. (Req 4.5)
 */
export function validateQuantity(n: number): boolean {
  return Number.isInteger(n) && n > 0
}

/**
 * Valida observaciones: máximo 500 caracteres. (Req 12.7)
 */
export function validateObservaciones(obs: string): boolean {
  return obs.length <= 500
}
