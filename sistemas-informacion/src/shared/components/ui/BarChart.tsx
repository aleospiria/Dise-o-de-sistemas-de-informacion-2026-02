import { useId } from 'react'
import styles from '@/shared/components/ui/BarChart.module.css'

export type BarTone = 'blue' | 'teal' | 'green' | 'orange' | 'red' | 'gray'

export interface BarChartItem {
  key: string
  label: string
  value: number
  tone?: BarTone
}

export interface BarChartProps {
  /** Título visible del gráfico (también su nombre accesible). */
  title: string
  items: BarChartItem[]
  /** Unidad del valor, p. ej. «préstamos»; se usa en la tabla alternativa. */
  unit: string
  /** Texto cuando no hay datos. */
  emptyText?: string
}

/**
 * Gráfico de barras horizontales con SVG (sin librerías). Cada barra muestra su
 * etiqueta y su valor como texto, y debajo hay una tabla equivalente: la
 * información nunca depende solo del color ni de la forma.
 */
export function BarChart({
  title,
  items,
  unit,
  emptyText = 'No hay datos para graficar.',
}: BarChartProps) {
  const titleId = useId()
  const total = items.reduce((sum, item) => sum + item.value, 0)
  const max = items.reduce((peak, item) => Math.max(peak, item.value), 0)
  return (
    <figure className={styles.figure} aria-labelledby={titleId}>
      <figcaption id={titleId} className={styles.title}>
        {title}
      </figcaption>
      {items.length === 0 || max === 0 ? (
        <p className={styles.empty}>{emptyText}</p>
      ) : (
        <>
          <ul className={styles.bars}>
            {items.map((item) => (
              <li key={item.key} className={styles.row}>
                <span className={styles.label}>{item.label}</span>
                <svg
                  className={styles.track}
                  viewBox="0 0 100 10"
                  preserveAspectRatio="none"
                  aria-hidden="true"
                  focusable="false"
                >
                  <rect className={styles.back} x="0" y="0" width="100" height="10" rx="2" />
                  <rect
                    className={`${styles.fill} ${styles[item.tone ?? 'blue']}`}
                    x="0"
                    y="0"
                    width={(item.value / max) * 100}
                    height="10"
                    rx="2"
                  />
                </svg>
                <span className={styles.value}>
                  {item.value}
                  <span className={styles.percent}>
                    {' '}
                    ({Math.round((item.value / total) * 100)} %)
                  </span>
                </span>
              </li>
            ))}
          </ul>
          <details className={styles.details}>
            <summary>Ver datos en tabla</summary>
            <table className={styles.table}>
              <caption className="sr-only">{title}</caption>
              <thead>
                <tr>
                  <th scope="col">Categoría</th>
                  <th scope="col">Cantidad ({unit})</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item) => (
                  <tr key={item.key}>
                    <th scope="row">{item.label}</th>
                    <td>{item.value}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </details>
        </>
      )}
    </figure>
  )
}
