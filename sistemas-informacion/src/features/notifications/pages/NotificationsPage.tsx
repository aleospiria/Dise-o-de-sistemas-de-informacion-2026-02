import { useCallback, useEffect, useState } from 'react'
import { useResources } from '@/contexts/useResources'
import { useToast } from '@/contexts/useToast'
import styles from '@/features/notifications/pages/NotificationsPage.module.css'
import { apiErrorMessage } from '@/services/api/errors'
import * as notificationsService from '@/services/api/notifications.service'
import { Badge } from '@/shared/components/ui/Badge'
import { Button } from '@/shared/components/ui/Button'
import { Card } from '@/shared/components/ui/Card'
import { EmptyState } from '@/shared/components/ui/EmptyState'
import { FilterBar } from '@/shared/components/ui/FilterBar'
import { Icon } from '@/shared/components/ui/icons'
import { PageHeader } from '@/shared/components/ui/PageHeader'
import { Select } from '@/shared/components/ui/Select'
import { SkeletonLoader } from '@/shared/components/ui/SkeletonLoader'
import { StateMessage } from '@/shared/components/ui/StateMessage'
import { formatDateTime } from '@/shared/utils/dateUtils'
import type { AvailabilityRequest, Notification } from '@/shared/types'

const DAYS_OPTIONS = [1, 7, 15, 30]

export function NotificationsPage() {
  const { showToast } = useToast()
  const { resources } = useResources()
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [requests, setRequests] = useState<AvailabilityRequest[]>([])
  const [days, setDays] = useState(7)
  const [onlyUnread, setOnlyUnread] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const [items, pending] = await Promise.all([
        notificationsService.listNotifications(days, onlyUnread),
        notificationsService.listAvailabilityRequests(),
      ])
      setNotifications(items)
      setRequests(pending)
    } catch (caught) {
      setError(apiErrorMessage(caught))
    } finally {
      setLoading(false)
    }
  }, [days, onlyUnread])

  useEffect(() => {
    let active = true
    Promise.all([
      notificationsService.listNotifications(days, onlyUnread),
      notificationsService.listAvailabilityRequests(),
    ])
      .then(([items, pending]) => {
        if (!active) return
        setNotifications(items)
        setRequests(pending)
        setError(null)
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
  }, [days, onlyUnread])

  const resourceName = (id?: string) =>
    resources.find((resource) => resource.idRecurso === id)?.nombre ?? 'Recurso'

  async function markRead(notification: Notification) {
    try {
      const updated = await notificationsService.markNotificationRead(
        notification.idNotificacion,
      )
      setNotifications((current) =>
        current.map((item) =>
          item.idNotificacion === updated.idNotificacion ? updated : item,
        ),
      )
    } catch (caught) {
      showToast('error', apiErrorMessage(caught))
    }
  }

  async function markAll() {
    try {
      await notificationsService.markAllNotificationsRead()
      setNotifications((current) =>
        current.map((item) => ({ ...item, leida: true })),
      )
      showToast('success', 'Notificaciones marcadas como leídas.')
    } catch (caught) {
      showToast('error', apiErrorMessage(caught))
    }
  }

  async function cancelRequest(request: AvailabilityRequest) {
    try {
      await notificationsService.cancelAvailabilityRequest(request.idRecurso)
      setRequests((current) =>
        current.filter((item) => item.idSolicitud !== request.idSolicitud),
      )
      showToast('success', 'Solicitud de disponibilidad cancelada.')
    } catch (caught) {
      showToast('error', apiErrorMessage(caught))
    }
  }

  const unreadCount = notifications.filter((item) => !item.leida).length
  const activeRequests = requests.filter((item) => item.activa)

  return (
    <div className={styles.page}>
      <PageHeader
        eyebrow="Centro de avisos"
        description={
          <span aria-live="polite">
            {unreadCount > 0
              ? `${unreadCount} notificaciones sin leer.`
              : 'Todas tus notificaciones están al día.'}
          </span>
        }
        action={
          <>
            <Button
              variant="secondary"
              icon="check"
              onClick={markAll}
              disabled={unreadCount === 0}
            >
              Marcar todas como leídas
            </Button>
            <Button
              variant="secondary"
              icon="refresh"
              onClick={() => void load()}
              loading={loading}
            >
              Actualizar
            </Button>
          </>
        }
      />

      <FilterBar label="Filtros de notificaciones" columns={2}>
        <Select
          label="Últimos días"
          value={String(days)}
          options={DAYS_OPTIONS.map((option) => ({
            value: String(option),
            label: `${option} días`,
          }))}
          onChange={(event) => setDays(Number(event.target.value))}
        />
        <label>
          <input
            type="checkbox"
            checked={onlyUnread}
            onChange={(event) => setOnlyUnread(event.target.checked)}
          />
          Solo no leídas
        </label>
      </FilterBar>

      {error && (
        <StateMessage
          kind="error"
          title="No se pudieron cargar las notificaciones."
          action={
            <Button variant="secondary" icon="refresh" onClick={() => void load()}>
              Reintentar
            </Button>
          }
        >
          {error}
        </StateMessage>
      )}

      <div className={styles.columns}>
        <Card as="section" aria-labelledby="notifications-title">
          <div className={styles.sectionHeader}>
            <h2 id="notifications-title">Notificaciones</h2>
            <Badge tone={unreadCount > 0 ? 'red' : 'green'} icon="bell">
              {unreadCount} sin leer
            </Badge>
          </div>
          {loading ? (
            <SkeletonLoader variant="card" count={3} />
          ) : notifications.length === 0 ? (
            <EmptyState
              icon="bell"
              title="Sin notificaciones"
              description="No hay notificaciones en este período. Prueba con más días."
            />
          ) : (
            <ul className={styles.list}>
              {notifications.map((notification) => (
                <li
                  key={notification.idNotificacion}
                  className={`${styles.item} ${notification.leida ? '' : styles.unread}`}
                >
                  <span className={styles.icon}>
                    <Icon name="bell" size={20} />
                  </span>
                  <div className={styles.body}>
                    <p className={styles.message}>{notification.mensaje}</p>
                    <div className={styles.meta}>
                      <Badge tone={notification.leida ? 'gray' : 'blue'}>
                        {notification.leida ? 'Leída' : 'No leída'}
                      </Badge>
                      <span>
                        {formatDateTime(notification.fechaCreacion)}
                        {notification.idRecurso
                          ? ` · ${resourceName(notification.idRecurso)}`
                          : ''}
                      </span>
                    </div>
                    {!notification.leida && (
                      <div className={styles.itemActions}>
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={() => void markRead(notification)}
                        >
                          Marcar como leída
                        </Button>
                      </div>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card as="section" aria-labelledby="requests-title">
          <div className={styles.sectionHeader}>
            <h2 id="requests-title">Avisos de disponibilidad</h2>
            <Badge tone="teal">{activeRequests.length} activos</Badge>
          </div>
          <p className={styles.intro}>
            Recibirás una notificación cuando el recurso vuelva a estar disponible.
          </p>
          {activeRequests.length === 0 ? (
            <EmptyState
              icon="clock"
              title="Sin avisos activos"
              description="Solicita un aviso desde un recurso no disponible."
            />
          ) : (
            <ul className={styles.list}>
              {activeRequests.map((request) => (
                <li key={request.idSolicitud} className={styles.item}>
                  <span className={styles.icon}>
                    <Icon name="clock" size={20} />
                  </span>
                  <div className={styles.body}>
                    <strong className={styles.requestName}>
                      {resourceName(request.idRecurso)}
                    </strong>
                    <span className={styles.meta}>
                      Creada el {formatDateTime(request.fechaCreacion)}
                    </span>
                    <div className={styles.itemActions}>
                      <Button
                        size="sm"
                        variant="danger"
                        onClick={() => void cancelRequest(request)}
                      >
                        Cancelar aviso
                      </Button>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>
    </div>
  )
}
