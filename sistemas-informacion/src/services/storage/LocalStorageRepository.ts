/**
 * Implementación de `StorageRepository` sobre `localStorage`.
 *
 * Toda operación se envuelve en try/catch: si `localStorage` no está
 * disponible (modo privado, cuota excedida, SSR) las lecturas devuelven
 * `null` y las escrituras lanzan un error controlado para que la capa
 * superior lo transforme en un mensaje de usuario.
 */
import type { StorageRepository } from '@/services/storage/StorageRepository'

export class LocalStorageRepository implements StorageRepository {
  get<T>(key: string): T | null {
    try {
      const raw = localStorage.getItem(key)
      if (raw === null) return null
      return JSON.parse(raw) as T
    } catch {
      // Clave corrupta o almacenamiento inaccesible: tratamos como ausente.
      return null
    }
  }

  set<T>(key: string, value: T): void {
    try {
      localStorage.setItem(key, JSON.stringify(value))
    } catch (error) {
      throw new Error(
        `No se pudo guardar en el almacenamiento local (clave: ${key}).`,
        { cause: error },
      )
    }
  }

  remove(key: string): void {
    try {
      localStorage.removeItem(key)
    } catch {
      // Silencioso: eliminar algo que no existe no es un fallo relevante.
    }
  }
}

/** Instancia por defecto usada por los servicios y contextos. */
export const localStorageRepository = new LocalStorageRepository()
