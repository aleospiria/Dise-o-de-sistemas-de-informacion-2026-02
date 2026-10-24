import styles from '@/shared/components/ui/SkeletonLoader.module.css'

export type SkeletonVariant = 'line' | 'card' | 'table-row'

export interface SkeletonLoaderProps {
  variant?: SkeletonVariant
  /** Cantidad de marcadores a mostrar. */
  count?: number
}

const VARIANT_CLASS: Record<SkeletonVariant, string> = {
  line: styles.line,
  card: styles.card,
  'table-row': styles.tableRow,
}

/**
 * Marcadores de posición mientras carga una lista o tabla (Req 18.6).
 * Anuncia "Cargando" una sola vez para lectores de pantalla, sin importar
 * cuántos marcadores dibuje.
 */
export function SkeletonLoader({ variant = 'line', count = 1 }: SkeletonLoaderProps) {
  return (
    <div className={styles.group} role="status" aria-live="polite">
      <span className="sr-only">Cargando contenido…</span>
      {Array.from({ length: count }, (_, index) => (
        <div
          key={index}
          className={`${styles.item} ${VARIANT_CLASS[variant]}`}
          aria-hidden="true"
        />
      ))}
    </div>
  )
}
