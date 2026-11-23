import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { useSearchParams } from 'react-router-dom'
import { useAuth } from '@/contexts/useAuth'
import { useToast } from '@/contexts/useToast'
import type { ResetPasswordFormValues } from '@/features/auth/types'
import { validateResetPasswordForm } from '@/features/auth/validation'
import { createResolver, hasFieldErrors } from '@/shared/utils/formResolver'

const resolver = createResolver(validateResetPasswordForm)

const MISSING_TOKEN =
  'El enlace de recuperación no es válido o expiró. Solicita uno nuevo.'

/** Cambia la contraseña con el token que llega en `?token=`. */
export function useResetPasswordForm() {
  const { confirmPasswordReset } = useAuth()
  const { showToast } = useToast()
  const [searchParams] = useSearchParams()
  const token = searchParams.get('token')?.trim() ?? ''
  const [successMessage, setSuccessMessage] = useState<string | null>(null)

  const form = useForm<ResetPasswordFormValues>({
    defaultValues: { nuevaContrasena: '', confirmacionContrasena: '' },
    resolver,
  })
  const { errors, isSubmitted, isSubmitting } = form.formState

  const onSubmit = form.handleSubmit(async (values) => {
    if (!token) {
      form.setError('root.server', { message: MISSING_TOKEN })
      return
    }

    try {
      const result = await confirmPasswordReset({
        token,
        nuevaContrasena: values.nuevaContrasena,
        confirmacionContrasena: values.confirmacionContrasena,
      })
      if (!result.success) {
        form.setError('root.server', {
          message: result.error ?? 'No se pudo cambiar la contraseña.',
        })
        return
      }
      setSuccessMessage(
        result.data ?? 'Contraseña actualizada correctamente.',
      )
      showToast('success', 'Contraseña actualizada. Ya puedes iniciar sesión.')
      form.reset()
    } catch {
      form.setError('root.server', {
        message: 'No se pudo cambiar la contraseña. Intenta de nuevo.',
      })
    }
  })

  return {
    field: form.register,
    errors,
    serverError: errors.root?.server?.message,
    isSubmitting,
    canSubmit: !(isSubmitted && hasFieldErrors(errors)),
    hasToken: Boolean(token),
    successMessage,
    onSubmit,
  }
}
