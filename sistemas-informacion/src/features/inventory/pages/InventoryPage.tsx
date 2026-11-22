import { useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { useResources } from '@/contexts/useResources'
import { useToast } from '@/contexts/useToast'
import { InventoryTable } from '@/features/inventory/components/InventoryTable'
import { useInventory } from '@/features/inventory/hooks/useInventory'
import styles from '@/features/inventory/pages/InventoryPage.module.css'
import { apiErrorMessage } from '@/services/api/errors'
import { saveBlob } from '@/services/api/client'
import * as resourcesService from '@/services/api/resources.service'
import { Alert } from '@/shared/components/ui/Alert'
import { Button } from '@/shared/components/ui/Button'
import { Modal } from '@/shared/components/ui/Modal'
import type { Resource } from '@/shared/types'

/** Listado del inventario con alta, edición y baja de recursos (Req 4.1, 4.6). */
export function InventoryPage() {
  const { resources, retire } = useInventory()
  const { reloadResources } = useResources()
  const { showToast } = useToast()
  const fileInput = useRef<HTMLInputElement>(null)
  const [toRetire, setToRetire] = useState<Resource | null>(null)
  const [importError, setImportError] = useState<string | null>(null)
  const [importing, setImporting] = useState(false)

  const active = resources.filter((r) => r.estadoActual !== 'Dado_de_Baja').length
  const close = () => setToRetire(null)

  async function exportCsv() {
    try {
      saveBlob(await resourcesService.exportResourcesCsv(), 'inventario.csv')
    } catch (caught) {
      showToast('error', apiErrorMessage(caught))
    }
  }

  async function importCsv(file: File) {
    setImportError(null)
    setImporting(true)
    try {
      const result = await resourcesService.importResources(file, true)
      showToast(
        'success',
        `Importación: ${result.creados} creados y ${result.actualizados} actualizados.`,
      )
      await reloadResources()
    } catch (caught) {
      setImportError(apiErrorMessage(caught))
    } finally {
      setImporting(false)
      if (fileInput.current) fileInput.current.value = ''
    }
  }

  async function confirmRetire() {
    if (toRetire) await retire(toRetire)
    // El resultado (éxito o "tiene préstamos activos") se notifica con un toast.
    close()
  }

  return (
    <>
      <div className={styles.toolbar}>
        <p className={styles.summary}>
          {resources.length} recursos registrados, {active} en servicio.
        </p>
        <div className={styles.actions}>
          <Button variant="secondary" onClick={() => void exportCsv()}>
            Exportar CSV
          </Button>
          <Button
            variant="secondary"
            loading={importing}
            onClick={() => fileInput.current?.click()}
          >
            Importar CSV
          </Button>
          <input
            ref={fileInput}
            type="file"
            accept=".csv,text/csv"
            aria-label="Importar inventario desde CSV"
            className="sr-only"
            tabIndex={-1}
            onChange={(event) => {
              const file = event.target.files?.[0]
              if (file) void importCsv(file)
            }}
          />
          <Link to="/inventory/new" className={styles.create}>
            Nuevo recurso
          </Link>
        </div>
      </div>

      {importError && <Alert type="error">{importError}</Alert>}

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
