/**
 * Generación de identificadores únicos.
 */

/**
 * Genera un UUID v4 usando la API nativa del navegador.
 * `crypto.randomUUID` está disponible en todos los navegadores modernos
 * y en Node 19+ (entorno de tests con jsdom).
 */
export function generateUUID(): string {
  return crypto.randomUUID()
}
