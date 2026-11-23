import { useState } from 'react'
import { DeliveryForm } from '@/features/operations/components/DeliveryForm'
import { OperationSummary } from '@/features/operations/components/OperationSummary'
import { PendingLoanCard } from '@/features/operations/components/PendingLoanCard'
import { useDeliveries } from '@/features/operations/hooks/useDeliveries'
import styles from '@/features/operations/pages/OperationsPage.module.css'
import { EmptyState } from '@/shared/components/ui/EmptyState'
import { Modal } from '@/shared/components/ui/Modal'
import { PageHeader } from '@/shared/components/ui/PageHeader'
import { formatDateTime } from '@/shared/utils/dateUtils'

/** Entregas pendientes: reservas cuya hora de inicio ya llegó (Req 12). */
export function DeliveryPage() {
  const { items, register } = useDeliveries()
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const selected = items.find((i) => i.loan.idPrestamo === selectedId) ?? null
  const close = () => setSelectedId(null)

  return (
    <div className={styles.page}>
      <PageHeader description="Entrega a cada estudiante el recurso que reservó y deja constancia de su condición." />
      <p className={styles.summary} aria-live="polite">
        {items.length === 1 ? '1 entrega pendiente.' : `${items.length} entregas pendientes.`}
      </p>
      {items.length === 0 ? (
        <EmptyState
          icon="send"
          title="No hay entregas pendientes."
          description="Aparecen aquí cuando llega la hora de una reserva."
        />
      ) : (
        <ul className={styles.list}>
          {items.map((item) => (
            <li key={item.loan.idPrestamo}>
              <PendingLoanCard
                resourceName={item.resourceName}
                resource={item.resource}
                studentName={item.studentName}
                timeLabel="Inicio programado"
                time={formatDateTime(item.loan.fechaHoraInicioProgramada)}
                actionLabel="Registrar entrega"
                actionIcon="send"
                onAction={() => setSelectedId(item.loan.idPrestamo)}
              />
            </li>
          ))}
        </ul>
      )}
      <Modal open={selected !== null} onClose={close}>
        <Modal.Header>Registrar entrega</Modal.Header>
        <Modal.Body>
          {selected && (
            <>
              <OperationSummary
                resourceName={selected.resourceName}
                resource={selected.resource}
                person={`Para ${selected.studentName}`}
                detail={`Inicio programado: ${formatDateTime(selected.loan.fechaHoraInicioProgramada)}`}
              />
              <DeliveryForm
                onCancel={close}
                submit={async (values) => {
                  const result = await register(selected, values)
                  // Al registrarse, la entrega sale de la lista (Req 12.10).
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
