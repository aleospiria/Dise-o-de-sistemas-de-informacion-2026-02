import styles from '@/features/loans/components/LoanProgress.module.css'
import { PROGRESS_STEPS } from '@/features/loans/progressSteps'
import { Icon } from '@/shared/components/ui/icons'
import type { LoanStatus } from '@/shared/types'


export interface LoanProgressProps {
  status: LoanStatus
}

/**
 * Línea de estado de un préstamo: Reservado → En préstamo → Devuelto. La etapa
 * actual se marca con `aria-current="step"`, ícono y color; las anteriores,
 * con un visto. Los estados fuera del recorrido (Cancelado, Vencido) no usan
 * esta línea y se muestran con `StatusBadge`.
 */
export function LoanProgress({ status }: LoanProgressProps) {
  const currentIndex = PROGRESS_STEPS.findIndex((step) => step.status === status)
  return (
    <ol className={styles.progress} aria-label="Estado del préstamo">
      {PROGRESS_STEPS.map((step, index) => {
        const state = index < currentIndex ? 'done' : index === currentIndex ? 'current' : 'todo'
        return (
          <li
            key={step.status}
            className={`${styles.step} ${styles[state]}`}
            aria-current={state === 'current' ? 'step' : undefined}
          >
            <span className={styles.marker}>
              {state === 'todo' ? (
                <span className={styles.dot} />
              ) : (
                <Icon name="check" size={16} />
              )}
            </span>
            <span className={styles.label}>{step.label}</span>
            {state === 'done' && <span className="sr-only">(completado)</span>}
          </li>
        )
      })}
    </ol>
  )
}
