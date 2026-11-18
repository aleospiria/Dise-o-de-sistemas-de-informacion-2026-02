import { Link } from 'react-router-dom'
import styles from '@/features/auth/components/AuthForm.module.css'
import { useForgotPasswordForm } from '@/features/auth/hooks/useForgotPasswordForm'
import { Alert } from '@/shared/components/ui/Alert'
import { Button } from '@/shared/components/ui/Button'
import { Input } from '@/shared/components/ui/Input'

/** Solicitud del enlace para restablecer la contraseña. */
export function ForgotPasswordForm() {
  const {
    field,
    errors,
    serverError,
    isSubmitting,
    canSubmit,
    info,
    resetPath,
    onSubmit,
  } = useForgotPasswordForm()

  if (info) {
    return (
      <>
        <Alert type="success">{info.message}</Alert>
        {resetPath && (
          <p className={styles.helper}>
            <Link to={resetPath}>Continuar con el cambio de contraseña</Link>
          </p>
        )}
      </>
    )
  }

  return (
    <form className={styles.form} onSubmit={onSubmit} noValidate>
      {serverError && <Alert type="error">{serverError}</Alert>}
      <p className={styles.helper}>
        Escribe el correo de tu cuenta y te enviaremos un enlace para crear una
        contraseña nueva.
      </p>

      <Input
        label="Correo electrónico"
        type="email"
        autoComplete="email"
        required
        error={errors.correo?.message}
        {...field('correo')}
      />

      <Button
        type="submit"
        className={styles.submit}
        loading={isSubmitting}
        disabled={!canSubmit}
      >
        Enviar enlace
      </Button>
    </form>
  )
}
