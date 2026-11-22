import { useEffect, useState, type FormEvent } from 'react'
import { useToast } from '@/contexts/useToast'
import { apiErrorMessage } from '@/services/api/errors'
import * as securityService from '@/services/api/security.service'
import { Alert } from '@/shared/components/ui/Alert'
import { Button } from '@/shared/components/ui/Button'
import styles from '@/shared/components/ui/DataPage.module.css'
import { Input } from '@/shared/components/ui/Input'
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
      <header className={styles.pageHeader}>
        <div className={styles.pageHeading}>
          <p className={styles.eyebrow}>Seguridad de la cuenta</p>
          <p className={styles.lead} aria-live="polite">
            Protege el acceso con una segunda verificación además de tu
            contraseña.
          </p>
        </div>
        <span
          className={`${styles.badge} ${
            loading
              ? styles.badgeExpired
              : enabled
                ? styles.badgeSuccess
                : styles.badgeWarning
          }`}
        >
          {loading ? 'Consultando' : enabled ? 'Activada' : 'Desactivada'}
        </span>
      </header>

      {error && <Alert type="error">{error}</Alert>}

      <section className={styles.panel} aria-labelledby="2fa-status">
        <div className={styles.panelHeader}>
          <h2 id="2fa-status">Verificación en dos pasos (2FA)</h2>
          <span className={styles.hint}>
            {loading ? 'Consultando el estado de tu cuenta...' : 'Estado actual'}
          </span>
        </div>
        {!loading && (
          <p>
            Estado: <strong>{enabled ? 'Activada' : 'Desactivada'}</strong>
          </p>
        )}
      </section>

      {!loading && !enabled && (
        <section className={styles.panel} aria-labelledby="2fa-setup">
          <div className={styles.panelHeader}>
            <h2 id="2fa-setup">Activar 2FA</h2>
            <span className={`${styles.badge} ${styles.badgeWarning}`}>Paso 1 de 2</span>
          </div>
          <p className={styles.hint}>
            Usa una aplicación autenticadora (Google Authenticator, Authy o
            similar) para escanear el código y confirmar con un código de 6
            dígitos.
          </p>
          <hr className={styles.divider} />
          {!setup ? (
            <div className={styles.actions}>
              <Button onClick={() => void startSetup()} loading={busy}>
                Generar código QR
              </Button>
            </div>
          ) : (
            <form className={styles.form} onSubmit={enable}>
              <div className={styles.twoColumn}>
                <img
                  className={styles.qr}
                  src={setup.qrSvg}
                  alt="Código QR para configurar la verificación en dos pasos"
                />
                <div className={styles.listItemBody}>
                  <span className={styles.statLabel}>Clave manual</span>
                  <span className={styles.code}>{setup.secret}</span>
                  <p className={styles.hint}>
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
                onChange={(event) =>
                  setCodigo(event.target.value.replace(/\D/g, ''))
                }
              />
              <div className={styles.actions}>
                <Button type="submit" loading={busy} disabled={codigo.length !== 6}>
                  Activar 2FA
                </Button>
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => setSetup(null)}
                >
                  Cancelar
                </Button>
              </div>
            </form>
          )}
        </section>
      )}

      {!loading && enabled && (
        <section className={styles.panel} aria-labelledby="2fa-disable">
          <div className={styles.panelHeader}>
            <h2 id="2fa-disable">Desactivar 2FA</h2>
            <span className={`${styles.badge} ${styles.badgeActive}`}>
              Acceso reforzado
            </span>
          </div>
          <p className={styles.hint}>
            Confirma tu contraseña actual para desactivar la verificación en dos
            pasos.
          </p>
          <hr className={styles.divider} />
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
              <Button
                type="submit"
                variant="danger"
                loading={busy}
                disabled={!contrasena}
              >
                Desactivar 2FA
              </Button>
            </div>
          </form>
        </section>
      )}
    </div>
  )
}

