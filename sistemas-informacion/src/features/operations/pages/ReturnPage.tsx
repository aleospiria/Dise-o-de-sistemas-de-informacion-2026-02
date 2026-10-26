import { useState } from 'react'
import { PendingLoanCard } from '@/features/operations/components/PendingLoanCard'
import { ReturnForm } from '@/features/operations/components/ReturnForm'
import { useReturns } from '@/features/operations/hooks/useReturns'
import styles from '@/features/operations/pages/OperationsPage.module.css'
import { Modal } from '@/shared/components/ui/Modal'
import { formatDateTime, formatDuration } from '@/shared/utils/dateUtils'

/** Devoluciones pendientes: préstamos en curso, con retraso resaltado (Req 13). */
export function ReturnPage() {
  const { items, register } = useReturns()
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const selected = items.find((i) => i.loan.idPrestamo === selectedId) ?? null

  const close = () => setSelectedId(null)
  const overdueCount = items.filter((i) => i.overdue).length

  return (
    <>
      <p className={styles.summary} aria-live="polite">
        {items.length === 1 ? '1 devolución pendiente' : `${items.length} devoluciones pendientes`}
        {overdueCount > 0 && `, ${overdueCount} con retraso`}.
      </p>

      {items.length === 0 ? (
        <div className={styles.empty}>
          <p>No hay devoluciones pendientes. Aparecen aquí cuando se registra una entrega.</p>
        </div>
      ) : (
        <ul className={styles.list}>
          {items.map((item) => (
            <li key={item.loan.idPrestamo}>
              <PendingLoanCard
                resourceName={item.resourceName}
                studentName={item.studentName}
                timeLabel="Fin programado"
                time={formatDateTime(item.loan.fechaHoraFinProgramada)}
                highlight={item.overdue}
                alert={
                  item.overdue ? `Con retraso de ${formatDuration(item.delayHours)}` : undefined
                }
                actionLabel="Registrar devolución"
                onAction={() => setSelectedId(item.loan.idPrestamo)}
              />
            </li>
          ))}
        </ul>
      )}

      <Modal open={selected !== null} onClose={close}>
        <Modal.Header>Registrar devolución</Modal.Header>
        <Modal.Body>
          {selected && (
            <>
              <p>
                {selected.resourceName}, prestado a {selected.studentName}.
              </p>
              <ReturnForm
                delayHours={selected.delayHours}
                onCancel={close}
                submit={(values) => {
                  const result = register(selected, values)
                  if (result.success) close()
                  return result
                }}
              />
            </>
          )}
        </Modal.Body>
      </Modal>
    </>
  )
}
