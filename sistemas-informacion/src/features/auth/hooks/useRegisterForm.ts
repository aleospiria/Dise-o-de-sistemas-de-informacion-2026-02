import { useForm, useWatch } from 'react-hook-form'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/contexts/useAuth'
import { useToast } from '@/contexts/useToast'
import type { RegisterFormValues } from '@/features/auth/types'
import { validateRegisterForm } from '@/features/auth/validation'
import { createResolver, hasFieldErrors } from '@/shared/utils/formResolver'

const resolver = createResolver(validateRegisterForm)

const DEFAULT_VALUES: RegisterFormValues = {
  nombre: '',
  correo: '',
  cedula: '',
  idRol: 'Estudiante',
  carnet: '',
  contrasena: '',
  confirmacionContrasena: '',
}

/**
 * Estado y acciones del formulario de registro (Req 1.1–1.5, 17). Al crear la
 * cuenta muestra una confirmación y lleva al inicio de sesión con el correo
 * precargado.
 */
export function useRegisterForm() {
  const { register: registerAccount } = useAuth()
  const { showToast } = useToast()
  const navigate = useNavigate()

  const form = useForm<RegisterFormValues>({
    defaultValues: DEFAULT_VALUES,
    resolver,
  })
  const { errors, isSubmitted, isSubmitting } = form.formState
  const rol = useWatch({ control: form.control, name: 'idRol' })

  const onSubmit = form.handleSubmit((values) => {
    const result = registerAccount({
      nombre: values.nombre,
      correo: values.correo,
      cedula: values.cedula,
      idRol: values.idRol,
      carnet: values.idRol === 'Estudiante' ? values.carnet : undefined,
      contrasena: values.contrasena,
      confirmacionContrasena: values.confirmacionContrasena,
    })
    if (!result.success || !result.data) {
      // P. ej. correo ya registrado (Req 1.3).
      form.setError('root.server', {
        message: result.error ?? 'No se pudo crear la cuenta.',
      })
      return
    }
    showToast('success', 'Cuenta creada. Ya puedes iniciar sesión.')
    navigate('/login', { state: { correo: result.data.correo } })
  })

  return {
    field: form.register,
    errors,
    serverError: errors.root?.server?.message,
    isSubmitting,
    canSubmit: !(isSubmitted && hasFieldErrors(errors)),
    requiresCarnet: rol === 'Estudiante',
    onSubmit,
  }
}
