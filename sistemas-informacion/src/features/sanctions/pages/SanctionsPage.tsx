import { useCallback, useEffect, useState } from 'react'
import { useToast } from '@/contexts/useToast'
import { useUsers } from '@/contexts/useUsers'
import styles from '@/features/sanctions/pages/SanctionsPage.module.css'
import { apiErrorMessage } from '@/services/api/errors'
import * as sanctionsService from '@/services/api/sanctions.service'
import { Badge } from '@/shared/components/ui/Badge'
import { Button } from '@/shared/components/ui/Button'
import { DataTable, type DataTableColumn } from '@/shared/components/ui/DataTable'
import { EmptyState } from '@/shared/components/ui/EmptyState'
import { FilterBar } from '@/shared/components/ui/FilterBar'
import { Icon } from '@/shared/components/ui/icons'
import { PageHeader } from '@/shared/components/ui/PageHeader'
import { Select } from '@/shared/components/ui/Select'
import { SkeletonLoader } from '@/shared/components/ui/SkeletonLoader'
import { StateMessage } from '@/shared/components/ui/StateMessage'
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

  const columns: DataTableColumn<Sanction>[] = [
    {
      key: 'usuario',
      header: 'Usuario',
      rowHeader: true,
      render: (sanction) => (
        <span className={styles.user}>{userName(sanction.idUsuario)}</span>
      ),
    },
    {
      key: 'motivo',
      header: 'Motivo',
      render: (sanction) => <span className={styles.reason}>{sanction.motivo}</span>,
    },
    { key: 'inicio', header: 'Inicio', render: (s) => formatDateTime(s.fechaInicio) },
    { key: 'fin', header: 'Fin', render: (s) => formatDateTime(s.fechaFin) },
    {
      key: 'estado',
      header: 'Estado',
      render: (sanction) =>
        sanction.estado === 'Activa' ? (
          <span className={styles.statusCell}>
            <Badge tone="red" icon="shield-alert">
              Activa
            </Badge>
            <span className={styles.until}>
              Bloqueado hasta {formatDateTime(sanction.fechaFin)}
            </span>
          </span>
        ) : (
          <Badge tone="gray" icon="clock">
            Expirada
          </Badge>
        ),
    },
    {
      key: 'acciones',
      header: 'Acciones',
      render: (sanction) =>
        sanction.estado === 'Activa' ? (
          <Button size="sm" variant="secondary" onClick={() => void lift(sanction)}>
            Levantar
          </Button>
        ) : (
          <span className={styles.until}>Sin acciones</span>
        ),
    },
  ]

  return (
    <div className={styles.page}>
      <PageHeader
        eyebrow="Control de acceso"
        description={
          <span aria-live="polite">
            {activeCount > 0
              ? `${activeCount} sanciones activas requieren seguimiento.`
              : 'No hay sanciones activas en este momento.'}
          </span>
        }
        action={
          <Button
            variant="secondary"
            icon="refresh"
            onClick={() => void load()}
            loading={loading}
          >
            Actualizar
          </Button>
        }
      />

      {!loading && !error && (
        <p className={`${styles.block} ${activeCount === 0 ? styles.ok : ''}`}>
          <Icon name={activeCount > 0 ? 'shield-alert' : 'shield-check'} size={22} />
          {activeCount > 0
            ? `Usuarios con bloqueo activo: ${activeCount}. No pueden solicitar préstamos hasta que termine la sanción.`
            : 'Ningún usuario está bloqueado por sanciones.'}
        </p>
      )}

      <FilterBar label="Filtros de sanciones" columns={2}>
        <Select
          label="Estado"
          options={STATUS_OPTIONS}
          value={status}
          onChange={(event) => setStatus(event.target.value as SanctionStatus | '')}
        />
      </FilterBar>

      {error ? (
        <StateMessage
          kind="error"
          title="No se pudieron cargar las sanciones."
          action={
            <Button variant="secondary" icon="refresh" onClick={() => void load()}>
              Reintentar
            </Button>
          }
        >
          {error}
        </StateMessage>
      ) : loading ? (
        <SkeletonLoader variant="table-row" count={4} />
      ) : sanctions.length === 0 ? (
        <EmptyState
          icon="shield-check"
          title="Sin sanciones"
          description="No hay sanciones para este filtro."
        />
      ) : (
        <DataTable
          label="Sanciones registradas"
          columns={columns}
          rows={sanctions}
          getRowKey={(sanction) => sanction.idSancion}
        />
      )}
    </div>
  )
}
