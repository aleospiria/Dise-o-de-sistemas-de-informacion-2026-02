import { useState } from 'react'
import { DeliveryForm } from '@/features/operations/components/DeliveryForm'
import { PendingLoanCard } from '@/features/operations/components/PendingLoanCard'
import { useDeliveries } from '@/features/operations/hooks/useDeliveries'
import styles from '@/features/operations/pages/OperationsPage.module.css'
import { Modal } from '@/shared/components/ui/Modal'
import { formatDateTime } from '@/shared/utils/dateUtils'

/** Entregas pendientes: reservas cuya hora de inicio ya llegó (Req 12). */
export function DeliveryPage() {
  const { items, register } = useDeliveries()
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const selected = items.find((i) => i.loan.idPrestamo === selectedId) ?? null

  const close = () => setSelectedId(null)

  return (
    <>
      <p className={styles.summary} aria-live="polite">
        {items.length === 1 ? '1 entrega pendiente.' : `${items.length} entregas pendientes.`}
      </p>

      {items.length === 0 ? (
        <div className={styles.empty}>
          <p>No hay entregas pendientes. Aparecen aquí cuando llega la hora de una reserva.</p>
        </div>
      ) : (
        <ul className={styles.list}>
          {items.map((item) => (
            <li key={item.loan.idPrestamo}>
              <PendingLoanCard
                resourceName={item.resourceName}
                studentName={item.studentName}
                timeLabel="Inicio programado"
                time={formatDateTime(item.loan.fechaHoraInicioProgramada)}
                actionLabel="Registrar entrega"
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
              <p>
                {selected.resourceName} para {selected.studentName}.
              </p>
              <DeliveryForm
                onCancel={close}
                submit={(values) => {
                  const result = register(selected, values)
                  // Al registrarse, la entrega sale de la lista (Req 12.10).
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
