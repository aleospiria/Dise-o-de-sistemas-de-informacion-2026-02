import { useCallback, useEffect, useState } from 'react'
import { useResources } from '@/contexts/useResources'
import { useToast } from '@/contexts/useToast'
import { useUsers } from '@/contexts/useUsers'
import { apiErrorMessage } from '@/services/api/errors'
import { saveBlob } from '@/services/api/client'
import * as reportsService from '@/services/api/reports.service'
import { Alert } from '@/shared/components/ui/Alert'
import { Button } from '@/shared/components/ui/Button'
import styles from '@/shared/components/ui/DataPage.module.css'
import { Input } from '@/shared/components/ui/Input'
import { Select } from '@/shared/components/ui/Select'
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

  const userOptions = users.map((user) => ({
    value: user.idUsuario,
    label: `${user.nombre} (${user.correo})`,
  }))
  const resourceOptions = resources.map((resource) => ({
    value: resource.idRecurso,
    label: resource.nombre,
  }))

  return (
    <div className={styles.page}>
      <header className={styles.pageHeader}>
        <div className={styles.pageHeading}>
          <p className={styles.eyebrow}>Analítica de préstamos</p>
          <p className={styles.lead} aria-live="polite">
            Consulta, filtra y exporta el histórico de solicitudes del laboratorio.
          </p>
        </div>
        <div className={styles.actions}>
          <Button variant="secondary" onClick={() => void download('csv')}>
            Descargar CSV
          </Button>
          <Button variant="secondary" onClick={() => void download('pdf')}>
            Descargar PDF
          </Button>
        </div>
      </header>

      <section className={styles.panel} aria-labelledby="report-filters">
        <div className={styles.panelHeader}>
          <h2 id="report-filters">Filtros</h2>
          <span className={styles.hint}>El rango máximo es de 366 días.</span>
        </div>
        <div className={styles.filters}>
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
            onChange={(event) =>
              setTipoRecurso(event.target.value as ResourceType | '')
            }
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
        </div>
        <div className={styles.actions}>
          <Button
            onClick={() => void load()}
            loading={loading}
          >
            Consultar
          </Button>
        </div>
      </section>

      {error && <Alert type="error">{error}</Alert>}

      {report && (
        <>
          <dl className={styles.stats} aria-live="polite">
            <div>
              <dt>Total de préstamos</dt>
              <dd>{report.estadisticas.totalPrestamos}</dd>
            </div>
            <div>
              <dt>Con demora</dt>
              <dd>{report.estadisticas.prestamosConDemora}</dd>
            </div>
            <div>
              <dt>Duración promedio</dt>
              <dd>{report.estadisticas.promedioDuracionHoras.toFixed(1)} h</dd>
            </div>
            <div>
              <dt>Recurso más solicitado</dt>
              <dd>
                {report.estadisticas.recursoMasSolicitado ?? 'Sin datos'} (
                {report.estadisticas.recursoMasSolicitadoCantidad})
              </dd>
            </div>
          </dl>

          <section className={styles.panel}>
            <div className={styles.panelHeader}>
              <h2>Detalle de préstamos</h2>
              <span className={styles.hint}>
                {report.filas.length} resultados
              </span>
            </div>
            {report.filas.length === 0 ? (
              <div className={styles.empty}>
                <span className={styles.emptyTitle}>Sin resultados</span>
                <span>No hay préstamos para estos filtros.</span>
              </div>
            ) : (
              <div className={styles.tableWrapper}>
                <table className={styles.table}>
                  <caption className="sr-only">Préstamos del reporte</caption>
                  <thead>
                    <tr>
                      <th scope="col">Fecha</th>
                      <th scope="col">Recurso</th>
                      <th scope="col">Usuario</th>
                      <th scope="col">Tipo</th>
                      <th scope="col">Estado</th>
                      <th scope="col">Retraso</th>
                    </tr>
                  </thead>
                  <tbody>
                    {report.filas.map((row) => (
                      <tr key={row.idPrestamo}>
                        <td>{formatDateTime(row.fecha)}</td>
                        <td>{row.recurso}</td>
                        <td>{row.estudiante}</td>
                        <td>{RESOURCE_TYPE_LABELS[row.tipoRecurso]}</td>
                        <td>
                          <StatusBadge status={row.estado} />
                        </td>
                        <td>
                          {row.retrasoHoras ? `${row.retrasoHoras} h` : '—'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </>
      )}
    </div>
  )
}
