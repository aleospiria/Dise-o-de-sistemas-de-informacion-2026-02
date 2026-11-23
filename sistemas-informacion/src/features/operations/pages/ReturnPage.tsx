import { useState } from 'react'
import { OperationSummary } from '@/features/operations/components/OperationSummary'
import { PendingLoanCard } from '@/features/operations/components/PendingLoanCard'
import { ReturnForm } from '@/features/operations/components/ReturnForm'
import { useReturns } from '@/features/operations/hooks/useReturns'
import styles from '@/features/operations/pages/OperationsPage.module.css'
import { EmptyState } from '@/shared/components/ui/EmptyState'
import { Modal } from '@/shared/components/ui/Modal'
import { PageHeader } from '@/shared/components/ui/PageHeader'
import { formatDateTime, formatDuration } from '@/shared/utils/dateUtils'

/** Devoluciones pendientes: préstamos en curso, con retraso resaltado (Req 13). */
export function ReturnPage() {
  const { items, register } = useReturns()
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const selected = items.find((i) => i.loan.idPrestamo === selectedId) ?? null
  const close = () => setSelectedId(null)
  const overdueCount = items.filter((i) => i.overdue).length

  return (
    <div className={styles.page}>
      <PageHeader description="Recibe los recursos prestados, revisa su condición y registra los retrasos. Los préstamos vencidos aparecen resaltados en rojo." />
      <p
        className={`${styles.summary} ${overdueCount > 0 ? styles.summaryAlert : ''}`}
        aria-live="polite"
      >
        {items.length === 1 ? '1 devolución pendiente' : `${items.length} devoluciones pendientes`}
        {overdueCount > 0 && `, ${overdueCount} con retraso`}.
      </p>
      {items.length === 0 ? (
        <EmptyState
          icon="undo"
          title="No hay devoluciones pendientes."
          description="Aparecen aquí cuando se registra una entrega."
        />
      ) : (
        <ul className={styles.list}>
          {items.map((item) => (
            <li key={item.loan.idPrestamo}>
              <PendingLoanCard
                resourceName={item.resourceName}
                resource={item.resource}
                studentName={item.studentName}
                timeLabel="Fin programado"
                time={formatDateTime(item.loan.fechaHoraFinProgramada)}
                highlight={item.overdue}
                alert={
                  item.overdue ? `Con retraso de ${formatDuration(item.delayHours)}` : undefined
                }
                actionLabel="Registrar devolución"
                actionIcon="undo"
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
              <OperationSummary
                resourceName={selected.resourceName}
                resource={selected.resource}
                person={`Prestado a ${selected.studentName}`}
                detail={`Fin programado: ${formatDateTime(selected.loan.fechaHoraFinProgramada)}`}
              />
              <ReturnForm
                delayHours={selected.delayHours}
                onCancel={close}
                submit={async (values) => {
                  const result = await register(selected, values)
                  if (result.success) close()
                  return result
                }}
              />
            </>
          )}
        </Modal.Body>
      </Modal>
    </div>
  )
}
