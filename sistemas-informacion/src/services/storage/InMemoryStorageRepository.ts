/**
 * Implementación de `StorageRepository` en memoria.
 *
 * Habilitada por SOLID M2 (DIP): permite probar los servicios sin depender de
 * `localStorage` real. Serializa igual que la implementación de producción
 * para reproducir el mismo comportamiento de round-trip JSON.
 */
import type { StorageRepository } from '@/services/storage/StorageRepository'

export class InMemoryStorageRepository implements StorageRepository {
  private store = new Map<string, string>()

  get<T>(key: string): T | null {
    const raw = this.store.get(key)
    if (raw === undefined) return null
    return JSON.parse(raw) as T
  }

  set<T>(key: string, value: T): void {
    this.store.set(key, JSON.stringify(value))
  }

  remove(key: string): void {
    this.store.delete(key)
  }

  /** Vacía todo el almacenamiento. Útil para aislar tests. */
  clear(): void {
    this.store.clear()
  }
}
