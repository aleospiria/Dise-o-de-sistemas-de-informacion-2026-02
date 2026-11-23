import { useForm } from 'react-hook-form'
import { useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '@/contexts/useAuth'
import { useToast } from '@/contexts/useToast'
import type { TwoFactorFormValues } from '@/features/auth/types'
import { validateTwoFactorForm } from '@/features/auth/validation'
import { createResolver, hasFieldErrors } from '@/shared/utils/formResolver'

const resolver = createResolver(validateTwoFactorForm)

interface TwoFactorLocationState {
  challengeToken?: string
  correo?: string
}

const MISSING_CHALLENGE =
  'La verificación expiró o no es válida. Vuelve a iniciar sesión.'

/** Código de 6 dígitos que completa un inicio de sesión con 2FA. */
export function useTwoFactorForm() {
  const { verifyTwoFactor } = useAuth()
  const { showToast } = useToast()
  const navigate = useNavigate()
  const location = useLocation()
  const state = location.state as TwoFactorLocationState | null
  const challengeToken = state?.challengeToken ?? ''
  const correo = state?.correo

  const form = useForm<TwoFactorFormValues>({
    defaultValues: { codigo: '' },
    resolver,
  })
  const { errors, isSubmitted, isSubmitting } = form.formState

  const onSubmit = form.handleSubmit(async (values) => {
    if (!challengeToken) {
      form.setError('root.server', { message: MISSING_CHALLENGE })
      return
    }

    try {
      const result = await verifyTwoFactor(challengeToken, values.codigo.trim())
      if (!result.success || !result.data) {
        form.setError('root.server', {
          message: result.error ?? 'El código no es válido.',
        })
        return
      }
      showToast('success', `Hola, ${result.data.nombre}.`)
      navigate('/dashboard', { replace: true })
    } catch {
      form.setError('root.server', {
        message: 'No se pudo verificar el código. Intenta de nuevo.',
      })
    }
  })

  return {
    field: form.register,
    errors,
    serverError: errors.root?.server?.message,
    isSubmitting,
    canSubmit: !(isSubmitted && hasFieldErrors(errors)),
    hasChallenge: Boolean(challengeToken),
    correo,
    onSubmit,
  }
}
