import { useState } from 'react'
import { Link } from 'react-router-dom'
import { InventoryTable } from '@/features/inventory/components/InventoryTable'
import { useInventory } from '@/features/inventory/hooks/useInventory'
import styles from '@/features/inventory/pages/InventoryPage.module.css'
import { Button } from '@/shared/components/ui/Button'
import { Modal } from '@/shared/components/ui/Modal'
import type { Resource } from '@/shared/types'

/** Listado del inventario con alta, edición y baja de recursos (Req 4.1, 4.6). */
export function InventoryPage() {
  const { resources, retire } = useInventory()
  const [toRetire, setToRetire] = useState<Resource | null>(null)

  const active = resources.filter((r) => r.estadoActual !== 'Dado_de_Baja').length
  const close = () => setToRetire(null)

  function confirmRetire() {
    if (toRetire) retire(toRetire)
    // El resultado (éxito o "tiene préstamos activos") se notifica con un toast.
    close()
  }

  return (
    <>
      <div className={styles.toolbar}>
        <p className={styles.summary}>
          {resources.length} recursos registrados, {active} en servicio.
        </p>
        <Link to="/inventory/new" className={styles.create}>
          Nuevo recurso
        </Link>
      </div>

      {resources.length === 0 ? (
        <div className={styles.empty}>
          <p>Todavía no hay recursos. Crea el primero con «Nuevo recurso».</p>
        </div>
      ) : (
        <InventoryTable resources={resources} onRetire={setToRetire} />
      )}

      <Modal open={toRetire !== null} onClose={close}>
        <Modal.Header>Dar de baja el recurso</Modal.Header>
        <Modal.Body>
          <p>
            ¿Dar de baja <strong>{toRetire?.nombre}</strong>? Dejará de aparecer en la
            disponibilidad y esta acción no se puede deshacer.
          </p>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={close} data-autofocus>
            Cancelar
          </Button>
          <Button variant="danger" onClick={confirmRetire}>
            Dar de baja
          </Button>
        </Modal.Footer>
      </Modal>
    </>
  )
}
