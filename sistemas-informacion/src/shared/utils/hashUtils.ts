/**
 * Hash de contraseñas (SIMULADO para el mock académico).
 *
 * ADVERTENCIA: esto NO es seguridad real. El proyecto no tiene backend y
 * persiste en localStorage; el único objetivo es evitar almacenar la
 * contraseña en texto plano. En un sistema real, el hashing se hace en el
 * servidor con bcrypt/argon2 y nunca en el cliente.
 *
 * Se usa un hash determinista y síncrono (variante FNV-1a de 32 bits) para
 * que los servicios del dominio puedan permanecer síncronos. `crypto.subtle`
 * se descartó por ser asíncrono.
 */

const FNV_OFFSET_BASIS = 0x811c9dc5
const FNV_PRIME = 0x01000193

/**
 * Devuelve un hash hexadecimal determinista de la contraseña.
 * La misma entrada produce siempre la misma salida.
 */
export function hashPassword(password: string): string {
  let hash = FNV_OFFSET_BASIS
  for (let i = 0; i < password.length; i++) {
    hash ^= password.charCodeAt(i)
    hash = Math.imul(hash, FNV_PRIME)
  }
  // `>>> 0` normaliza a entero sin signo de 32 bits.
  const unsigned = hash >>> 0
  return `sim$${unsigned.toString(16).padStart(8, '0')}`
}

/**
 * Compara una contraseña en texto plano con un hash previamente generado.
 */
export function verifyPassword(password: string, hash: string): boolean {
  return hashPassword(password) === hash
}
