import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { useAuth } from '@/contexts/useAuth'
import type { ForgotPasswordFormValues } from '@/features/auth/types'
import { validateForgotPasswordForm } from '@/features/auth/validation'
import type { PasswordResetRequestInfo } from '@/shared/types'
import { createResolver, hasFieldErrors } from '@/shared/utils/formResolver'

const resolver = createResolver(validateForgotPasswordForm)

function resetPathFrom(info: PasswordResetRequestInfo | null): string | null {
  if (!info) return null
  if (info.resetToken) {
    return `/reset-password?token=${encodeURIComponent(info.resetToken)}`
  }
  if (!info.resetUrl) return null
  try {
    const url = new URL(info.resetUrl, window.location.origin)
    return `${url.pathname}${url.search}`
  } catch {
    return null
  }
}

/** Solicita el enlace de recuperación sin revelar si el correo existe. */
export function useForgotPasswordForm() {
  const { requestPasswordReset } = useAuth()
  const [info, setInfo] = useState<PasswordResetRequestInfo | null>(null)

  const form = useForm<ForgotPasswordFormValues>({
    defaultValues: { correo: '' },
    resolver,
  })
  const { errors, isSubmitted, isSubmitting } = form.formState

  const onSubmit = form.handleSubmit(async (values) => {
    try {
      const result = await requestPasswordReset(values.correo.trim())
      if (!result.success || !result.data) {
        form.setError('root.server', {
          message: result.error ?? 'No se pudo solicitar la recuperación.',
        })
        return
      }
      setInfo(result.data)
    } catch {
      form.setError('root.server', {
        message: 'No se pudo solicitar la recuperación. Intenta de nuevo.',
      })
    }
  })

  return {
    field: form.register,
    errors,
    serverError: errors.root?.server?.message,
    isSubmitting,
    canSubmit: !(isSubmitted && hasFieldErrors(errors)),
    info,
    resetPath: resetPathFrom(info),
    onSubmit,
  }
}
