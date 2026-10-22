/**
 * Puerto de persistencia (SOLID M2 — DIP).
 *
 * Los servicios de dominio dependen de esta interfaz, NO de `localStorage`.
 * Esto permite sustituir la implementación por una API real o por un fake en
 * memoria para tests, sin tocar la lógica de negocio.
 */
export interface StorageRepository {
  /** Lee y deserializa el valor asociado a `key`. Devuelve `null` si no existe. */
  get<T>(key: string): T | null
  /** Serializa y guarda `value` bajo `key`. */
  set<T>(key: string, value: T): void
  /** Elimina la entrada asociada a `key`. */
  remove(key: string): void
}
