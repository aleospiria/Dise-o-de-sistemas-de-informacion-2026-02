import { Link } from 'react-router-dom'
import styles from '@/features/dashboard/components/StatCard.module.css'

export interface StatCardProps {
  label: string
  value: number
  /** Texto de apoyo bajo el número. */
  hint?: string
  /** Si se pasa, la tarjeta completa es un enlace a esa ruta. */
  to?: string
  /** Resalta el contador cuando requiere atención y es mayor que 0. */
  alert?: boolean
}

/** Contador del panel de inicio, opcionalmente enlazado a su pantalla. */
export function StatCard({ label, value, hint, to, alert }: StatCardProps) {
  const className = `${styles.card} ${alert && value > 0 ? styles.alert : ''}`
  const content = (
    <>
      <span className={styles.label}>{label}</span>
      <span className={styles.value}>{value}</span>
      {hint && <span className={styles.hint}>{hint}</span>}
    </>
  )

  return to ? (
    <Link to={to} className={className}>
      {content}
    </Link>
  ) : (
    <div className={className}>{content}</div>
  )
}
