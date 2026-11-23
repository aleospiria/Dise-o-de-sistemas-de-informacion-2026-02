import { useState } from 'react'
import { useParams } from 'react-router-dom'
import { useResources } from '@/contexts/useResources'
import { LoanForm } from '@/features/loans/components/LoanForm'
import { RecurringLoanForm } from '@/features/loans/components/RecurringLoanForm'
import styles from '@/features/loans/pages/LoanFormPage.module.css'
import { Button } from '@/shared/components/ui/Button'
import { ButtonLink } from '@/shared/components/ui/ButtonLink'
import { Icon, type IconName } from '@/shared/components/ui/icons'
import { PageHeader } from '@/shared/components/ui/PageHeader'
import { ResourceImage } from '@/shared/components/ui/ResourceImage'
import { StateMessage } from '@/shared/components/ui/StateMessage'
import { StatusBadge } from '@/shared/components/ui/StatusBadge'
import { TypeBadge } from '@/shared/components/ui/TypeBadge'
import { isResourceBookable } from '@/shared/utils/resourceRules'

/** Reglas del préstamo que se muestran junto al formulario (tabla declarativa). */
const LOAN_RULES: Array<{ icon: IconName; text: string }> = [
  { icon: 'clock', text: 'Duración mínima de 1 hora y máxima de 24 horas.' },
  { icon: 'calendar', text: 'El préstamo empieza y termina el mismo día.' },
  { icon: 'check-circle', text: 'Debe comenzar a partir de ahora y en un horario libre.' },
]

/** Solicitud de préstamo de un recurso: `/loans/new/:resourceId` (Req 8.1, 8.2). */
export function LoanFormPage() {
  const { resourceId = '' } = useParams()
  const { resources } = useResources()
  const [mode, setMode] = useState<'single' | 'recurring'>('single')
  const resource = resources.find((r) => r.idRecurso === resourceId)

  if (!resource) {
    return (
      <StateMessage
        kind="error"
        title="No encontramos el recurso que quieres solicitar."
        action={
          <ButtonLink to="/availability" variant="secondary" icon="arrow-left">
            Volver a disponibilidad
          </ButtonLink>
        }
      >
        Puede que ya no exista. Elige otro desde la lista de disponibilidad.
      </StateMessage>
    )
  }

  // Quien llega por una URL guardada puede encontrar el recurso ya agotado.
  if (!isResourceBookable(resource)) {
    return (
      <StateMessage
        kind="info"
        title={`${resource.nombre} no está disponible para préstamo en este momento.`}
        action={
          <ButtonLink to="/availability" variant="secondary" icon="arrow-left">
            Volver a disponibilidad
          </ButtonLink>
        }
      >
        Puedes pedir que te avisemos cuando se libere desde la lista de disponibilidad.
      </StateMessage>
    )
  }

  return (
    <div className={styles.page}>
      <PageHeader description="Elige el día y la franja horaria, y cuéntanos para qué necesitas el recurso." />
      <div className={styles.layout}>
        <aside className={styles.side}>
          <section className={styles.summary} aria-label="Recurso solicitado">
            <ResourceImage resource={resource} size="card" decorative />
            <div className={styles.summaryBody}>
              <div className={styles.chips}>
                <TypeBadge type={resource.tipo} />
                <StatusBadge status={resource.estadoActual} />
              </div>
              <h2 className={styles.summaryTitle}>{resource.nombre}</h2>
              <p className={styles.code}>{resource.codigoInventario}</p>
              <p className={styles.stock}>
                {resource.cantidadDisponible} de {resource.cantidadTotal} disponibles
              </p>
              {resource.descripcion && <p className={styles.description}>{resource.descripcion}</p>}
            </div>
          </section>
          <section className={styles.rules} aria-label="Reglas del préstamo">
            <p className={styles.rulesTitle}>Antes de reservar</p>
            <ul className={styles.rulesList}>
              {LOAN_RULES.map((rule) => (
                <li key={rule.text}>
                  <Icon name={rule.icon} size={18} />
                  <span>{rule.text}</span>
                </li>
              ))}
            </ul>
          </section>
        </aside>
        <div className={styles.main}>
          <div role="group" aria-label="Tipo de reserva" className={styles.modeSwitch}>
            <Button
              variant={mode === 'single' ? 'primary' : 'ghost'}
              icon="calendar"
              onClick={() => setMode('single')}
              aria-pressed={mode === 'single'}
            >
              Reserva única
            </Button>
            <Button
              variant={mode === 'recurring' ? 'primary' : 'ghost'}
              icon="refresh"
              onClick={() => setMode('recurring')}
              aria-pressed={mode === 'recurring'}
            >
              Reserva recurrente
            </Button>
          </div>
          <div className={styles.formPanel}>
            {mode === 'single' ? (
              <LoanForm resourceId={resource.idRecurso} />
            ) : (
              <RecurringLoanForm resourceId={resource.idRecurso} />
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
