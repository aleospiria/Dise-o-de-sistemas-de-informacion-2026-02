import styles from '@/features/auth/components/AuthForm.module.css'
import { useRegisterForm } from '@/features/auth/hooks/useRegisterForm'
import { NOMBRE_MAX_LENGTH } from '@/features/auth/validation'
import { Alert } from '@/shared/components/ui/Alert'
import { Button } from '@/shared/components/ui/Button'
import { Input } from '@/shared/components/ui/Input'
import { Select } from '@/shared/components/ui/Select'
import { ROLE_LABELS } from '@/shared/constants/roles'

const ROLE_OPTIONS = Object.entries(ROLE_LABELS).map(([value, label]) => ({
  value,
  label,
}))

/** Formulario de registro (Req 1.1). La lógica vive en `useRegisterForm`. */
export function RegisterForm() {
  const {
    field,
    errors,
    serverError,
    isSubmitting,
    canSubmit,
    requiresCarnet,
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
      <Input
        label="Cédula"
        inputMode="numeric"
        required
        error={errors.cedula?.message}
        {...field('cedula')}
      />
      <Select
        label="Rol"
        options={ROLE_OPTIONS}
        required
        error={errors.idRol?.message}
        {...field('idRol')}
      />
      {requiresCarnet && (
        <Input
          label="Carnet estudiantil"
          required
          error={errors.carnet?.message}
          {...field('carnet')}
        />
      )}
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
