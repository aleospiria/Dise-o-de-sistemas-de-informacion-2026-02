import { Link } from 'react-router-dom'
import styles from '@/features/auth/components/AuthForm.module.css'
import { useResetPasswordForm } from '@/features/auth/hooks/useResetPasswordForm'
import { Alert } from '@/shared/components/ui/Alert'
import { Button } from '@/shared/components/ui/Button'
import { ButtonLink } from '@/shared/components/ui/ButtonLink'
import { Input } from '@/shared/components/ui/Input'

/** Formulario para definir la nueva contraseña con un token vigente. */
export function ResetPasswordForm() {
  const {
    field,
    errors,
    serverError,
    isSubmitting,
    canSubmit,
    hasToken,
    successMessage,
    onSubmit,
  } = useResetPasswordForm()

  if (successMessage) {
    return (
      <div className={styles.result}>
        <Alert type="success">{successMessage}</Alert>
        <ButtonLink to="/login" icon="arrow-right" className={styles.resultAction}>
          Iniciar sesión con la nueva contraseña
        </ButtonLink>
      </div>
    )
  }

  if (!hasToken) {
    return (
      <Alert type="error">
        El enlace de recuperación no es válido o expiró.{' '}
        <Link to="/forgot-password">Solicita uno nuevo</Link>.
      </Alert>
    )
  }

  return (
    <form className={styles.form} onSubmit={onSubmit} noValidate>
      {serverError && <Alert type="error">{serverError}</Alert>}
      <Input
        label="Nueva contraseña"
        type="password"
        autoComplete="new-password"
        hint="Mínimo 8 caracteres, con mayúscula, minúscula y número."
        required
        error={errors.nuevaContrasena?.message}
        {...field('nuevaContrasena')}
      />
      <Input
        label="Confirmar nueva contraseña"
        type="password"
        autoComplete="new-password"
        required
        error={errors.confirmacionContrasena?.message}
        {...field('confirmacionContrasena')}
      />
      <Button
        type="submit"
        className={styles.submit}
        loading={isSubmitting}
        disabled={!canSubmit}
      >
        Cambiar contraseña
      </Button>
    </form>
  )
}
