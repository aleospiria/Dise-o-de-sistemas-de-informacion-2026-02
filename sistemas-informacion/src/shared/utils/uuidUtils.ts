/**
 * Generación de identificadores únicos.
 */

/**
 * Genera un UUID v4.
 *
 * `crypto.randomUUID` solo existe en contextos seguros (HTTPS o `localhost`).
 * Si la app se abre por HTTP en una IP de la red (p. ej. al probarla desde el
 * móvil u otro equipo), esa función no está definida y cualquier operación que
 * cree registros fallaría. Por eso se usa como respaldo `crypto.getRandomValues`,
 * disponible en cualquier contexto, y `Math.random` como último recurso.
 */
export function generateUUID(): string {
  const cryptoObj = globalThis.crypto

  if (typeof cryptoObj?.randomUUID === 'function') {
    return cryptoObj.randomUUID()
  }

  const bytes = new Uint8Array(16)
  if (typeof cryptoObj?.getRandomValues === 'function') {
    cryptoObj.getRandomValues(bytes)
  } else {
    for (let i = 0; i < bytes.length; i++) {
      bytes[i] = Math.floor(Math.random() * 256)
    }
  }

  // Versión 4 (bits 12-15 del byte 6) y variante RFC 4122 (bits 6-7 del byte 8).
  bytes[6] = (bytes[6] & 0x0f) | 0x40
  bytes[8] = (bytes[8] & 0x3f) | 0x80

  const hex = Array.from(bytes, (byte) =>
    byte.toString(16).padStart(2, '0'),
  )
  return [
    hex.slice(0, 4).join(''),
    hex.slice(4, 6).join(''),
    hex.slice(6, 8).join(''),
    hex.slice(8, 10).join(''),
    hex.slice(10, 16).join(''),
  ].join('-')
}
