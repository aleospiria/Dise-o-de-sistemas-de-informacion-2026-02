import { useForm } from 'react-hook-form'
import { useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '@/contexts/useAuth'
import { useToast } from '@/contexts/useToast'
import type { DemoAccount } from '@/features/auth/demoAccounts'
import type { LoginFormValues } from '@/features/auth/types'
import { validateLoginForm } from '@/features/auth/validation'
import { createResolver, hasFieldErrors } from '@/shared/utils/formResolver'

const resolver = createResolver(validateLoginForm)

/** Estado que puede llegar desde el registro para precargar el correo. */
interface LoginLocationState {
  correo?: string
}

/**
 * Estado y acciones del formulario de inicio de sesión (Req 1.6–1.8, 17).
 * Valida al enviar y, después del primer envío, en cada cambio (Req 17.1).
 */
export function useLoginForm() {
  const { login } = useAuth()
  const { showToast } = useToast()
  const navigate = useNavigate()
  const location = useLocation()
  const correoInicial =
    (location.state as LoginLocationState | null)?.correo ?? ''

  const form = useForm<LoginFormValues>({
    defaultValues: { correo: correoInicial, contrasena: '' },
    resolver,
  })
  const { errors, isSubmitted, isSubmitting } = form.formState

  const onSubmit = form.handleSubmit((values) => {
    const result = login(values.correo.trim(), values.contrasena)
    if (!result.success || !result.data) {
      // Mensaje genérico del servicio: no revela qué dato falló (Req 1.8).
      form.setError('root.server', {
        message: result.error ?? 'No se pudo iniciar sesión.',
      })
      return
    }
    showToast('success', `Hola, ${result.data.nombre}.`)
    navigate('/dashboard', { replace: true })
  })

  function fillDemoAccount(account: DemoAccount) {
    const options = { shouldValidate: isSubmitted }
    form.setValue('correo', account.correo, options)
    form.setValue('contrasena', account.contrasena, options)
    form.clearErrors('root')
  }

  function onForgotPassword() {
    showToast(
      'info',
      'La recuperación de contraseña estará disponible en una próxima versión.',
    )
  }

  return {
    field: form.register,
    errors,
    serverError: errors.root?.server?.message,
    isSubmitting,
    // Tras un envío fallido, el botón se bloquea hasta corregir (Req 17.4).
    canSubmit: !(isSubmitted && hasFieldErrors(errors)),
    onSubmit,
    fillDemoAccount,
    onForgotPassword,
  }
}
