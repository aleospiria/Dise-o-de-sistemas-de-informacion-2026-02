import { useCallback, useEffect, useState } from 'react'
import { useResources } from '@/contexts/useResources'
import { useToast } from '@/contexts/useToast'
import { apiErrorMessage } from '@/services/api/errors'
import * as notificationsService from '@/services/api/notifications.service'
import { Alert } from '@/shared/components/ui/Alert'
import { Button } from '@/shared/components/ui/Button'
import styles from '@/shared/components/ui/DataPage.module.css'
import { Select } from '@/shared/components/ui/Select'
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
      <header className={styles.pageHeader}>
        <div className={styles.pageHeading}>
          <p className={styles.eyebrow}>Centro de avisos</p>
          <p className={styles.lead} aria-live="polite">
            {unreadCount > 0
              ? `${unreadCount} notificaciones sin leer.`
              : 'Todas tus notificaciones están al día.'}
          </p>
        </div>
        <div className={styles.actions}>
          <Button
            variant="secondary"
            onClick={markAll}
            disabled={unreadCount === 0}
          >
            Marcar todas como leídas
          </Button>
          <Button
            variant="secondary"
            onClick={() => void load()}
            loading={loading}
          >
            Actualizar
          </Button>
        </div>
      </header>

      <section className={styles.panel} aria-label="Filtros de notificaciones">
        <div className={styles.filters}>
          <Select
            label="Últimos días"
            value={String(days)}
            options={DAYS_OPTIONS.map((option) => ({
              value: String(option),
              label: `${option} días`,
            }))}
            onChange={(event) => setDays(Number(event.target.value))}
          />
          <label className={styles.check}>
            <input
              type="checkbox"
              checked={onlyUnread}
              onChange={(event) => setOnlyUnread(event.target.checked)}
            />
            Solo no leídas
          </label>
        </div>
      </section>

      {error && <Alert type="error">{error}</Alert>}

      <div className={styles.twoColumn}>
        <section className={styles.panel} aria-labelledby="notifications-title">
          <div className={styles.panelHeader}>
            <h2 id="notifications-title">Notificaciones</h2>
            <span
              className={`${styles.badge} ${
                unreadCount > 0 ? styles.badgeActive : styles.badgeSuccess
              }`}
            >
              {unreadCount} sin leer
            </span>
          </div>
          {loading ? (
            <p className={styles.hint}>Cargando notificaciones...</p>
          ) : notifications.length === 0 ? (
            <div className={styles.empty}>
              <span className={styles.emptyTitle}>Sin notificaciones</span>
              <span>No hay notificaciones en este período.</span>
            </div>
          ) : (
            <ul className={styles.list}>
              {notifications.map((notification) => (
                <li key={notification.idNotificacion} className={styles.card}>
                  <div className={styles.listItem}>
                    <div className={styles.listItemBody}>
                      <div className={styles.listItemMeta}>
                        {!notification.leida && (
                          <span
                            className={styles.unreadDot}
                            role="img"
                            aria-label="No leída"
                          />
                        )}
                        <p className={notification.leida ? undefined : styles.unread}>
                          {notification.mensaje}
                        </p>
                      </div>
                      <p className={styles.hint}>
                        {formatDateTime(notification.fechaCreacion)}
                        {notification.idRecurso
                          ? ` · ${resourceName(notification.idRecurso)}`
                          : ''}
                      </p>
                    </div>
                    {!notification.leida && (
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => void markRead(notification)}
                      >
                        Marcar como leída
                      </Button>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className={styles.panel} aria-labelledby="requests-title">
          <div className={styles.panelHeader}>
            <h2 id="requests-title">Avisos de disponibilidad</h2>
            <span className={`${styles.badge} ${styles.badgeSuccess}`}>
              {activeRequests.length} activos
            </span>
          </div>
          <p className={styles.hint}>
            Recibirás una notificación cuando el recurso vuelva a estar disponible.
          </p>
          <hr className={styles.divider} />
          {activeRequests.length === 0 ? (
            <div className={styles.empty}>
              <span className={styles.emptyTitle}>Sin avisos activos</span>
              <span>Solicita un aviso desde un recurso no disponible.</span>
            </div>
          ) : (
            <ul className={styles.list}>
              {activeRequests.map((request) => (
                <li key={request.idSolicitud} className={styles.card}>
                  <div className={styles.listItem}>
                    <div className={styles.listItemBody}>
                      <strong>{resourceName(request.idRecurso)}</strong>
                      <p className={styles.hint}>
                        Creada el {formatDateTime(request.fechaCreacion)}
                      </p>
                    </div>
                    <Button
                      size="sm"
                      variant="danger"
                      onClick={() => void cancelRequest(request)}
                    >
                      Cancelar aviso
                    </Button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  )
}
