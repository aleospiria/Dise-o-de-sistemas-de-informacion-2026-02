import { useCallback, useEffect, useState } from 'react'
import { useResources } from '@/contexts/useResources'
import { useToast } from '@/contexts/useToast'
import { useUsers } from '@/contexts/useUsers'
import styles from '@/features/reports/pages/ReportsPage.module.css'
import {
  countByMonth,
  countByStatus,
  countByType,
  topResources,
} from '@/features/reports/utils/aggregate'
import { apiErrorMessage } from '@/services/api/errors'
import { saveBlob } from '@/services/api/client'
import * as reportsService from '@/services/api/reports.service'
import { BarChart } from '@/shared/components/ui/BarChart'
import { Button } from '@/shared/components/ui/Button'
import { Card } from '@/shared/components/ui/Card'
import { DataTable, type DataTableColumn } from '@/shared/components/ui/DataTable'
import { EmptyState } from '@/shared/components/ui/EmptyState'
import { FilterBar } from '@/shared/components/ui/FilterBar'
import { Input } from '@/shared/components/ui/Input'
import { PageHeader } from '@/shared/components/ui/PageHeader'
import { Select } from '@/shared/components/ui/Select'
import { SkeletonLoader } from '@/shared/components/ui/SkeletonLoader'
import { StateMessage } from '@/shared/components/ui/StateMessage'
import { StatusBadge } from '@/shared/components/ui/StatusBadge'
import {
  RESOURCE_TYPE_LABELS,
  RESOURCE_TYPES,
} from '@/shared/constants/resourceTypes'
import { combineDateAndTime, formatDateTime } from '@/shared/utils/dateUtils'
import type {
  LoanReport,
  LoanStatus,
  ReportFilters,
  ReportRow,
  ResourceType,
} from '@/shared/types'

const TYPE_OPTIONS = RESOURCE_TYPES.map((value) => ({
  value,
  label: RESOURCE_TYPE_LABELS[value],
}))

const STATUS_OPTIONS = [
  { value: 'Reservado', label: 'Reservado' },
  { value: 'En_Préstamo', label: 'En préstamo' },
  { value: 'Devuelto', label: 'Devuelto' },
  { value: 'Cancelado', label: 'Cancelado' },
  { value: 'Vencido', label: 'Vencido' },
]

const ROW_COLUMNS: DataTableColumn<ReportRow>[] = [
  { key: 'fecha', header: 'Fecha', render: (row) => <span className={styles.nowrap}>{formatDateTime(row.fecha)}</span> },
  { key: 'recurso', header: 'Recurso', render: (row) => row.recurso },
  { key: 'usuario', header: 'Usuario', render: (row) => row.estudiante },
  { key: 'tipo', header: 'Tipo', render: (row) => RESOURCE_TYPE_LABELS[row.tipoRecurso] },
  { key: 'estado', header: 'Estado', render: (row) => <StatusBadge status={row.estado} /> },
  {
    key: 'retraso',
    header: 'Retraso',
    render: (row) => (row.retrasoHoras ? `${row.retrasoHoras} h` : '—'),
  },
]

export function ReportsPage() {
  const { showToast } = useToast()
  const { resources } = useResources()
  const { users } = useUsers()
  const [desde, setDesde] = useState('')
  const [hasta, setHasta] = useState('')
  const [idRecurso, setIdRecurso] = useState('')
  const [tipoRecurso, setTipoRecurso] = useState<ResourceType | ''>('')
  const [estado, setEstado] = useState<LoanStatus | ''>('')
  const [idUsuario, setIdUsuario] = useState('')
  const [report, setReport] = useState<LoanReport | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const buildFilters = useCallback((): ReportFilters => {
    const start = desde ? combineDateAndTime(desde, '00:00') : undefined
    const end = hasta ? combineDateAndTime(hasta, '23:59') : undefined
    return {
      desde: start ?? undefined,
      hasta: end ?? undefined,
      idRecurso: idRecurso || undefined,
      tipoRecurso: tipoRecurso || undefined,
      estado: estado || undefined,
      idUsuario: idUsuario || undefined,
    }
  }, [desde, hasta, idRecurso, tipoRecurso, estado, idUsuario])

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      setReport(await reportsService.getLoanReport(buildFilters()))
    } catch (caught) {
      setError(apiErrorMessage(caught))
    } finally {
      setLoading(false)
    }
  }, [buildFilters])

  useEffect(() => {
    let active = true
    reportsService
      .getLoanReport(buildFilters())
      .then((data) => {
        if (active) {
          setReport(data)
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
  }, [buildFilters])

  async function download(kind: 'csv' | 'pdf') {
    try {
      const blob =
        kind === 'csv'
          ? await reportsService.downloadLoanReportCsv(buildFilters())
          : await reportsService.downloadLoanReportPdf(buildFilters())
      saveBlob(blob, `reporte_prestamos.${kind}`)
    } catch (caught) {
      showToast('error', apiErrorMessage(caught))
    }
  }

  function clearFilters() {
    setDesde('')
    setHasta('')
    setIdRecurso('')
    setTipoRecurso('')
    setEstado('')
    setIdUsuario('')
  }

  const userOptions = users.map((user) => ({
    value: user.idUsuario,
    label: `${user.nombre} (${user.correo})`,
  }))
  const resourceOptions = resources.map((resource) => ({
    value: resource.idRecurso,
    label: resource.nombre,
  }))

  const stats = report?.estadisticas
  const rows = report?.filas ?? []

  return (
    <div className={styles.page}>
      <PageHeader
        eyebrow="Analítica de préstamos"
        description={
          <span aria-live="polite">
            Consulta, filtra y exporta el histórico de solicitudes del laboratorio.
          </span>
        }
        action={
          <>
            <Button variant="secondary" icon="download" onClick={() => void download('csv')}>
              Descargar CSV
            </Button>
            <Button variant="secondary" icon="download" onClick={() => void download('pdf')}>
              Descargar PDF
            </Button>
          </>
        }
      />

      <FilterBar
        label="Filtros del reporte"
        actions={
          <>
            <Button icon="search" onClick={() => void load()} loading={loading}>
              Consultar
            </Button>
            <Button variant="ghost" icon="refresh" onClick={clearFilters}>
              Limpiar filtros
            </Button>
            <p className={styles.hint}>El rango máximo es de 366 días.</p>
          </>
        }
      >
        <Input
          label="Desde"
          type="date"
          value={desde}
          onChange={(event) => setDesde(event.target.value)}
        />
        <Input
          label="Hasta"
          type="date"
          value={hasta}
          onChange={(event) => setHasta(event.target.value)}
        />
        <Select
          label="Recurso"
          placeholder="Todos los recursos"
          options={resourceOptions}
          value={idRecurso}
          onChange={(event) => setIdRecurso(event.target.value)}
        />
        <Select
          label="Tipo"
          placeholder="Todos los tipos"
          options={TYPE_OPTIONS}
          value={tipoRecurso}
          onChange={(event) => setTipoRecurso(event.target.value as ResourceType | '')}
        />
        <Select
          label="Estado"
          placeholder="Todos los estados"
          options={STATUS_OPTIONS}
          value={estado}
          onChange={(event) => setEstado(event.target.value as LoanStatus | '')}
        />
        <Select
          label="Usuario"
          placeholder="Todos los usuarios"
          options={userOptions}
          value={idUsuario}
          onChange={(event) => setIdUsuario(event.target.value)}
        />
      </FilterBar>

      {error && (
        <StateMessage
          kind="error"
          title="No se pudo generar el reporte."
          action={
            <Button variant="secondary" icon="refresh" onClick={() => void load()}>
              Reintentar
            </Button>
          }
        >
          {error}
        </StateMessage>
      )}

      {!report && !error && <SkeletonLoader variant="card" count={3} />}

      {report && stats && (
        <>
          <dl className={styles.stats} aria-live="polite">
            <div className={styles.stat}>
              <dt className={styles.statLabel}>Total de préstamos</dt>
              <dd className={styles.statValue}>{stats.totalPrestamos}</dd>
            </div>
            <div className={`${styles.stat} ${styles.statWarn}`}>
              <dt className={styles.statLabel}>Con demora</dt>
              <dd className={styles.statValue}>{stats.prestamosConDemora}</dd>
            </div>
            <div className={`${styles.stat} ${styles.statTeal}`}>
              <dt className={styles.statLabel}>Duración promedio</dt>
              <dd className={styles.statValue}>{stats.promedioDuracionHoras.toFixed(1)} h</dd>
            </div>
            <div className={`${styles.stat} ${styles.statTeal}`}>
              <dt className={styles.statLabel}>Recurso más solicitado</dt>
              <dd className={styles.statValue}>
                {stats.recursoMasSolicitado ?? 'Sin datos'} (
                {stats.recursoMasSolicitadoCantidad})
              </dd>
            </div>
          </dl>

          {rows.length > 0 && (
            <section className={styles.charts} aria-label="Gráficos del reporte">
              <Card>
                <BarChart
                  title="Préstamos por estado"
                  unit="préstamos"
                  items={countByStatus(rows)}
                />
              </Card>
              <Card>
                <BarChart
                  title="Préstamos por tipo de recurso"
                  unit="préstamos"
                  items={countByType(rows)}
                />
              </Card>
              <Card>
                <BarChart
                  title="Recursos más solicitados"
                  unit="préstamos"
                  items={topResources(rows)}
                />
              </Card>
              <Card>
                <BarChart
                  title="Préstamos por mes"
                  unit="préstamos"
                  items={countByMonth(rows)}
                />
              </Card>
            </section>
          )}

          <section aria-labelledby="report-detail">
            <div className={styles.sectionHeader}>
              <h2 id="report-detail">Detalle de préstamos</h2>
              <span className={styles.hint}>{rows.length} resultados</span>
            </div>
            {rows.length === 0 ? (
              <EmptyState
                icon="search"
                title="Sin resultados"
                description="No hay préstamos para estos filtros. Amplía el rango de fechas o limpia los filtros."
                action={
                  <Button variant="secondary" icon="refresh" onClick={clearFilters}>
                    Limpiar filtros
                  </Button>
                }
              />
            ) : (
              <DataTable
                label="Préstamos del reporte"
                columns={ROW_COLUMNS}
                rows={rows}
                getRowKey={(row) => row.idPrestamo}
              />
            )}
          </section>
        </>
      )}
    </div>
  )
}
