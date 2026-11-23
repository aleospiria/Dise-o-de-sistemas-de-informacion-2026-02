import { Link } from 'react-router-dom'
import styles from '@/features/auth/components/AuthForm.module.css'
import { useTwoFactorForm } from '@/features/auth/hooks/useTwoFactorForm'
import { TWO_FACTOR_CODE_LENGTH } from '@/features/auth/validation'
import { Alert } from '@/shared/components/ui/Alert'
import { Button } from '@/shared/components/ui/Button'
import { Input } from '@/shared/components/ui/Input'

/** Código temporal que completa el inicio de sesión con 2FA. */
export function TwoFactorForm() {
  const {
    field,
    errors,
    serverError,
    isSubmitting,
    canSubmit,
    hasChallenge,
    correo,
    onSubmit,
  } = useTwoFactorForm()

  if (!hasChallenge) {
    return (
      <Alert type="error">
        La verificación expiró o no es válida. <Link to="/login">Vuelve a iniciar sesión</Link>.
      </Alert>
    )
  }

  return (
    <form className={styles.form} onSubmit={onSubmit} noValidate>
      {serverError && <Alert type="error">{serverError}</Alert>}
      <p className={styles.helper}>
        {correo
          ? `Ingresa el código de 6 dígitos para ${correo}.`
          : 'Ingresa el código de 6 dígitos de tu aplicación autenticadora.'}
      </p>

      <Input
        label="Código de verificación"
        inputMode="numeric"
        autoComplete="one-time-code"
        pattern="[0-9]*"
        maxLength={TWO_FACTOR_CODE_LENGTH}
        className={styles.code}
        autoFocus
        required
        error={errors.codigo?.message}
        {...field('codigo')}
      />

      <Button
        type="submit"
        className={styles.submit}
        loading={isSubmitting}
        disabled={!canSubmit}
      >
        Verificar código
      </Button>
    </form>
  )
}
