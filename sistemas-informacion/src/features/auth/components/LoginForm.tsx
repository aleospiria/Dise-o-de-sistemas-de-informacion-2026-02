import styles from '@/features/auth/components/AuthForm.module.css'
import { DemoAccounts } from '@/features/auth/components/DemoAccounts'
import { useLoginForm } from '@/features/auth/hooks/useLoginForm'
import { Alert } from '@/shared/components/ui/Alert'
import { Button } from '@/shared/components/ui/Button'
import { Input } from '@/shared/components/ui/Input'

/** Formulario de inicio de sesión (Req 1.6). La lógica vive en `useLoginForm`. */
export function LoginForm() {
  const {
    field,
    errors,
    serverError,
    isSubmitting,
    canSubmit,
    onSubmit,
    fillDemoAccount,
    onForgotPassword,
  } = useLoginForm()

  return (
    <>
      {/* noValidate: los mensajes los da nuestra validación, no el navegador. */}
      <form className={styles.form} onSubmit={onSubmit} noValidate>
        {serverError && <Alert type="error">{serverError}</Alert>}

        <Input
          label="Correo electrónico"
          type="email"
          autoComplete="email"
          required
          error={errors.correo?.message}
          {...field('correo')}
        />
        <Input
          label="Contraseña"
          type="password"
          autoComplete="current-password"
          required
          error={errors.contrasena?.message}
          {...field('contrasena')}
        />

        <Button
          type="submit"
          className={styles.submit}
          loading={isSubmitting}
          disabled={!canSubmit}
        >
          Iniciar sesión
        </Button>
        <button
          type="button"
          className={styles.linkButton}
          onClick={onForgotPassword}
        >
          ¿Olvidaste tu contraseña?
        </button>
      </form>

      <DemoAccounts onSelect={fillDemoAccount} />
    </>
  )
}
