import { useCallback, useEffect, useState } from 'react'
import { useToast } from '@/contexts/useToast'
import { useUsers } from '@/contexts/useUsers'
import { apiErrorMessage } from '@/services/api/errors'
import * as sanctionsService from '@/services/api/sanctions.service'
import { Alert } from '@/shared/components/ui/Alert'
import { Button } from '@/shared/components/ui/Button'
import styles from '@/shared/components/ui/DataPage.module.css'
import { Select } from '@/shared/components/ui/Select'
import { formatDateTime } from '@/shared/utils/dateUtils'
import type { Sanction, SanctionStatus } from '@/shared/types'

const STATUS_OPTIONS = [
  { value: '', label: 'Todas' },
  { value: 'Activa', label: 'Activas' },
  { value: 'Expirada', label: 'Expiradas' },
]

export function SanctionsPage() {
  const { showToast } = useToast()
  const { users, getUserById } = useUsers()
  const [sanctions, setSanctions] = useState<Sanction[]>([])
  const [status, setStatus] = useState<SanctionStatus | ''>('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      setSanctions(await sanctionsService.listSanctions(status || undefined))
    } catch (caught) {
      setError(apiErrorMessage(caught))
    } finally {
      setLoading(false)
    }
  }, [status])

  useEffect(() => {
    let active = true
    sanctionsService
      .listSanctions(status || undefined)
      .then((items) => {
        if (active) {
          setSanctions(items)
          setError(null)
        }
      })
      .catch((caught: unknown) => {
        if (active) setError(apiErrorMessage(caught))
      })
      .finally(() => {
        if (active) setLoading(false)
      })
    return () => {
      active = false
    }
  }, [status])

  async function lift(sanction: Sanction) {
    try {
      const updated = await sanctionsService.liftSanction(sanction.idSancion)
      setSanctions((current) =>
        current.map((item) =>
          item.idSancion === updated.idSancion ? updated : item,
        ),
      )
      showToast('success', 'Sanción levantada.')
    } catch (caught) {
      showToast('error', apiErrorMessage(caught))
    }
  }

  const userName = (id: string) =>
    users.find((user) => user.idUsuario === id)?.nombre ??
    getUserById(id)?.nombre ??
    id

  const activeCount = sanctions.filter((item) => item.estado === 'Activa').length

  return (
    <div className={styles.page}>
      <header className={styles.pageHeader}>
        <div className={styles.pageHeading}>
          <p className={styles.eyebrow}>Control de acceso</p>
          <p className={styles.lead} aria-live="polite">
            {activeCount > 0
              ? `${activeCount} sanciones activas requieren seguimiento.`
              : 'No hay sanciones activas en este momento.'}
          </p>
        </div>
        <div className={styles.actions}>
          <Button
            variant="secondary"
          onClick={() => void load()}
            loading={loading}
          >
            Actualizar
          </Button>
        </div>
      </header>

      <section className={styles.panel} aria-label="Filtros de sanciones">
        <div className={styles.filters}>
          <Select
            label="Estado"
            options={STATUS_OPTIONS}
            value={status}
            onChange={(event) =>
              setStatus(event.target.value as SanctionStatus | '')
            }
          />
        </div>
      </section>

      {error && <Alert type="error">{error}</Alert>}

      {loading ? (
        <p className={styles.hint}>Cargando sanciones...</p>
      ) : sanctions.length === 0 ? (
        <div className={styles.empty}>
          <span className={styles.emptyTitle}>Sin sanciones</span>
          <span>No hay sanciones para este filtro.</span>
        </div>
      ) : (
        <section className={styles.panel}>
          <div className={styles.tableWrapper}>
            <table className={styles.table}>
              <caption className="sr-only">Sanciones registradas</caption>
              <thead>
                <tr>
                  <th scope="col">Usuario</th>
                  <th scope="col">Motivo</th>
                  <th scope="col">Inicio</th>
                  <th scope="col">Fin</th>
                  <th scope="col">Estado</th>
                  <th scope="col">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {sanctions.map((sanction) => (
                  <tr key={sanction.idSancion}>
                    <th scope="row">{userName(sanction.idUsuario)}</th>
                    <td>{sanction.motivo}</td>
                    <td>{formatDateTime(sanction.fechaInicio)}</td>
                    <td>{formatDateTime(sanction.fechaFin)}</td>
                    <td>
                      <span
                        className={`${styles.badge} ${
                          sanction.estado === 'Activa'
                            ? styles.badgeActive
                            : styles.badgeExpired
                        }`}
                      >
                        {sanction.estado}
                      </span>
                    </td>
                    <td>
                      {sanction.estado === 'Activa' ? (
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={() => void lift(sanction)}
                        >
                          Levantar
                        </Button>
                      ) : (
                        <span className={styles.hint}>Sin acciones</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}
    </div>
  )
}
