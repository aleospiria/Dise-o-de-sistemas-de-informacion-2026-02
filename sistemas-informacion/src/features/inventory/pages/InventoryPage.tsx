import { useRef, useState } from 'react'
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
import { ButtonLink } from '@/shared/components/ui/ButtonLink'
import { EmptyState } from '@/shared/components/ui/EmptyState'
import { Input } from '@/shared/components/ui/Input'
import { Modal } from '@/shared/components/ui/Modal'
import { PageHeader } from '@/shared/components/ui/PageHeader'
import { Select } from '@/shared/components/ui/Select'
import { RESOURCE_TYPE_LABELS, RESOURCE_TYPES } from '@/shared/constants/resourceTypes'
import type { Resource, ResourceType } from '@/shared/types'

const TYPE_OPTIONS = RESOURCE_TYPES.map((value) => ({
  value,
  label: RESOURCE_TYPE_LABELS[value],
}))

/** Listado del inventario con alta, edición y baja de recursos (Req 4.1, 4.6). */
export function InventoryPage() {
  const { resources, retire } = useInventory()
  const { reloadResources } = useResources()
  const { showToast } = useToast()
  const fileInput = useRef<HTMLInputElement>(null)
  const [toRetire, setToRetire] = useState<Resource | null>(null)
  const [importError, setImportError] = useState<string | null>(null)
  const [importing, setImporting] = useState(false)
  const [search, setSearch] = useState('')
  const [type, setType] = useState<ResourceType | ''>('')

  const active = resources.filter((r) => r.estadoActual !== 'Dado_de_Baja').length
  const query = search.trim().toLowerCase()
  const visible = resources.filter(
    (r) =>
      (type === '' || r.tipo === type) &&
      (query === '' ||
        r.nombre.toLowerCase().includes(query) ||
        r.codigoInventario.toLowerCase().includes(query)),
  )
  const filtering = query !== '' || type !== ''
  const close = () => setToRetire(null)

  function clearFilters() {
    setSearch('')
    setType('')
  }

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
    <div className={styles.page}>
      <PageHeader
        description="Administra los equipos, herramientas y materiales del laboratorio: crea, edita, da de baja o importa recursos desde un CSV."
        action={
          <>
            <Button variant="secondary" icon="download" onClick={() => void exportCsv()}>
              Exportar CSV
            </Button>
            <Button
              variant="secondary"
              icon="upload"
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
            <ButtonLink to="/inventory/new" icon="plus">
              Nuevo recurso
            </ButtonLink>
          </>
        }
      />
      {importError && <Alert type="error">{importError}</Alert>}
      {resources.length === 0 ? (
        <EmptyState
          icon="package"
          title="Todavía no hay recursos."
          description="Crea el primero con el botón «Nuevo recurso» o impórtalos desde un archivo CSV."
        />
      ) : (
        <>
          <div className={styles.toolbar}>
            <div className={styles.filters}>
              <Input
                label="Buscar por nombre o código"
                type="search"
                autoComplete="off"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
              />
              <Select
                label="Filtrar por tipo"
                placeholder="Todos los tipos"
                options={TYPE_OPTIONS}
                value={type}
                onChange={(event) => setType(event.target.value as ResourceType | '')}
              />
            </div>
            <p className={styles.summary}>
              {resources.length} recursos registrados, {active} en servicio.
            </p>
          </div>
          {visible.length === 0 ? (
            <EmptyState
              icon="search"
              title="Ningún recurso coincide con el filtro."
              description="Revisa el nombre o el código, o quita el filtro de tipo."
              action={
                filtering ? (
                  <Button variant="secondary" icon="refresh" onClick={clearFilters}>
                    Ver todo el inventario
                  </Button>
                ) : undefined
              }
            />
          ) : (
            <InventoryTable resources={visible} onRetire={setToRetire} />
          )}
        </>
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
          <Button variant="danger" icon="trash" onClick={confirmRetire}>
            Dar de baja
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  )
}
