import styles from '@/features/auth/components/AuthForm.module.css'
import { useRegisterForm } from '@/features/auth/hooks/useRegisterForm'
import { NOMBRE_MAX_LENGTH } from '@/features/auth/validation'
import { Alert } from '@/shared/components/ui/Alert'
import { Button } from '@/shared/components/ui/Button'
import { Input } from '@/shared/components/ui/Input'

/** Formulario de registro (Req 1.1). La lógica vive en `useRegisterForm`. */
export function RegisterForm() {
  const {
    field,
    errors,
    serverError,
    isSubmitting,
    canSubmit,
    onSubmit,
  } = useRegisterForm()

  return (
    <form className={styles.form} onSubmit={onSubmit} noValidate>
      {serverError && <Alert type="error">{serverError}</Alert>}
      <Input
        label="Nombre completo"
        autoComplete="name"
        maxLength={NOMBRE_MAX_LENGTH}
        required
        error={errors.nombre?.message}
        {...field('nombre')}
      />
      <Input
        label="Correo electrónico"
        type="email"
        autoComplete="email"
        required
        error={errors.correo?.message}
        {...field('correo')}
      />
      <div className={styles.pair}>
        <Input
          label="Cédula"
          inputMode="numeric"
          required
          error={errors.cedula?.message}
          {...field('cedula')}
        />
        <Input
          label="Carnet estudiantil"
          required
          error={errors.carnet?.message}
          {...field('carnet')}
        />
      </div>
      <Input
        label="Contraseña"
        type="password"
        autoComplete="new-password"
        hint="Mínimo 8 caracteres, con mayúscula, minúscula y número."
        required
        error={errors.contrasena?.message}
        {...field('contrasena')}
      />
      <Input
        label="Confirmar contraseña"
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
        Crear cuenta
      </Button>
    </form>
  )
}
