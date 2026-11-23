import { useEffect, useState, type FormEvent } from 'react'
import { useToast } from '@/contexts/useToast'
import styles from '@/features/security/pages/SecurityPage.module.css'
import { apiErrorMessage } from '@/services/api/errors'
import * as securityService from '@/services/api/security.service'
import { Alert } from '@/shared/components/ui/Alert'
import { Badge } from '@/shared/components/ui/Badge'
import { Button } from '@/shared/components/ui/Button'
import { Card } from '@/shared/components/ui/Card'
import { Icon } from '@/shared/components/ui/icons'
import { Input } from '@/shared/components/ui/Input'
import { PageHeader } from '@/shared/components/ui/PageHeader'
import { SkeletonLoader } from '@/shared/components/ui/SkeletonLoader'
import type { TwoFactorSetup } from '@/shared/types'

export function SecurityPage() {
  const { showToast } = useToast()
  const [enabled, setEnabled] = useState(false)
  const [loading, setLoading] = useState(true)
  const [setup, setSetup] = useState<TwoFactorSetup | null>(null)
  const [codigo, setCodigo] = useState('')
  const [contrasena, setContrasena] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    let active = true
    securityService
      .getCurrentUser()
      .then((user) => {
        if (active) setEnabled(Boolean(user.totpEnabled))
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
  }, [])

  async function startSetup() {
    setError(null)
    setBusy(true)
    try {
      setSetup(await securityService.setupTwoFactor())
    } catch (caught) {
      setError(apiErrorMessage(caught))
    } finally {
      setBusy(false)
    }
  }

  async function enable(event: FormEvent) {
    event.preventDefault()
    setError(null)
    setBusy(true)
    try {
      const user = await securityService.enableTwoFactor(codigo.trim())
      setEnabled(Boolean(user.totpEnabled))
      setSetup(null)
      setCodigo('')
      showToast('success', 'Verificación en dos pasos activada.')
    } catch (caught) {
      setError(apiErrorMessage(caught))
    } finally {
      setBusy(false)
    }
  }

  async function disable(event: FormEvent) {
    event.preventDefault()
    setError(null)
    setBusy(true)
    try {
      const user = await securityService.disableTwoFactor(contrasena)
      setEnabled(Boolean(user.totpEnabled))
      setContrasena('')
      showToast('success', 'Verificación en dos pasos desactivada.')
    } catch (caught) {
      setError(apiErrorMessage(caught))
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className={styles.page}>
      <PageHeader
        eyebrow="Seguridad de la cuenta"
        description={
          <span aria-live="polite">
            Protege el acceso con una segunda verificación además de tu contraseña.
          </span>
        }
      />

      {error && <Alert type="error">{error}</Alert>}

      <Card as="section" aria-labelledby="2fa-status">
        <div className={styles.sectionHeader}>
          <h2 id="2fa-status">Verificación en dos pasos (2FA)</h2>
          {loading ? (
            <Badge tone="gray">Consultando</Badge>
          ) : enabled ? (
            <Badge tone="green" icon="shield-check">
              Activada
            </Badge>
          ) : (
            <Badge tone="yellow" icon="shield-alert">
              Desactivada
            </Badge>
          )}
        </div>
        {loading ? (
          <SkeletonLoader variant="line" count={2} />
        ) : (
          <div className={styles.status}>
            <span className={`${styles.statusIcon} ${enabled ? styles.statusOn : ''}`}>
              <Icon name={enabled ? 'shield-check' : 'shield-alert'} size={26} />
            </span>
            <div className={styles.statusText}>
              <p>
                Estado: <strong>{enabled ? 'Activada' : 'Desactivada'}</strong>
              </p>
              <p className={styles.muted}>
                {enabled
                  ? 'Al iniciar sesión te pediremos además un código de tu aplicación autenticadora.'
                  : 'Tu cuenta solo está protegida por la contraseña. Activa la segunda verificación.'}
              </p>
            </div>
          </div>
        )}
      </Card>

      {!loading && !enabled && (
        <Card as="section" aria-labelledby="2fa-setup">
          <div className={styles.sectionHeader}>
            <h2 id="2fa-setup">Activar 2FA</h2>
            <Badge tone="blue">{setup ? 'Paso 2 de 2' : 'Paso 1 de 2'}</Badge>
          </div>
          <ol className={styles.steps}>
            <li>
              Usa una aplicación autenticadora (Google Authenticator, Authy o similar)
              para escanear el código QR.
            </li>
            <li>Escribe el código de 6 dígitos que muestra la aplicación para confirmar.</li>
          </ol>
          {!setup ? (
            <div className={styles.actions}>
              <Button icon="key" onClick={() => void startSetup()} loading={busy}>
                Generar código QR
              </Button>
            </div>
          ) : (
            <form className={styles.form} onSubmit={enable}>
              <div className={styles.setup}>
                <img
                  className={styles.qr}
                  src={setup.qrSvg}
                  alt="Código QR para configurar la verificación en dos pasos"
                />
                <div className={styles.secretBox}>
                  <span className={styles.secretLabel}>Clave manual</span>
                  <span className={styles.code}>{setup.secret}</span>
                  <p className={styles.muted}>
                    Guarda esta clave en un lugar seguro. Sirve si pierdes el
                    dispositivo autenticador.
                  </p>
                </div>
              </div>
              <Input
                label="Código de verificación"
                inputMode="numeric"
                autoComplete="one-time-code"
                maxLength={6}
                required
                value={codigo}
                onChange={(event) => setCodigo(event.target.value.replace(/\D/g, ''))}
              />
              <div className={styles.actions}>
                <Button type="submit" loading={busy} disabled={codigo.length !== 6}>
                  Activar 2FA
                </Button>
                <Button type="button" variant="secondary" onClick={() => setSetup(null)}>
                  Cancelar
                </Button>
              </div>
            </form>
          )}
        </Card>
      )}

      {!loading && enabled && (
        <Card as="section" aria-labelledby="2fa-disable">
          <div className={styles.sectionHeader}>
            <h2 id="2fa-disable">Desactivar 2FA</h2>
            <Badge tone="red" icon="alert-triangle">
              Reduce la seguridad
            </Badge>
          </div>
          <p className={styles.muted}>
            Confirma tu contraseña actual para desactivar la verificación en dos pasos.
          </p>
          <form className={styles.form} onSubmit={disable}>
            <Input
              label="Contraseña actual"
              type="password"
              autoComplete="current-password"
              required
              value={contrasena}
              onChange={(event) => setContrasena(event.target.value)}
            />
            <div className={styles.actions}>
              <Button type="submit" variant="danger" loading={busy} disabled={!contrasena}>
                Desactivar 2FA
              </Button>
            </div>
          </form>
        </Card>
      )}
    </div>
  )
}
