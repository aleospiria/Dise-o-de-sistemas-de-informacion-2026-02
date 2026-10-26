import { useMemo, useState } from 'react'
import { useForm } from 'react-hook-form'
import { useNavigate } from 'react-router-dom'
import { useInventory } from '@/features/inventory/hooks/useInventory'
import type { ResourceFormValues } from '@/features/inventory/types'
import { validateResourceForm } from '@/features/inventory/validation'
import type { Resource } from '@/shared/types'
import { createResolver, hasFieldErrors } from '@/shared/utils/formResolver'
import { readImageAsDataUrl, validateImageFile } from '@/shared/utils/imageUtils'

/**
 * Estado y acciones del formulario de recurso, en modo crear (sin `resource`)
 * o editar (Req 4.2–4.8, 4.11).
 */
export function useResourceForm(resource?: Resource) {
  const { create, update } = useInventory()
  const navigate = useNavigate()
  const isEdit = resource !== undefined

  // Al editar, las unidades en uso no se pueden quitar.
  const minQuantity = resource
    ? Math.max(1, resource.cantidadTotal - resource.cantidadDisponible)
    : 1
  const resolver = useMemo(
    () =>
      createResolver<ResourceFormValues>((values) =>
        validateResourceForm(values, { minQuantity }),
      ),
    [minQuantity],
  )

  const form = useForm<ResourceFormValues>({
    defaultValues: {
      nombre: resource?.nombre ?? '',
      codigoInventario: resource?.codigoInventario ?? '',
      tipo: resource?.tipo ?? '',
      descripcion: resource?.descripcion ?? '',
      cantidadTotal: String(resource?.cantidadTotal ?? ''),
    },
    resolver,
  })
  const { errors, isSubmitted, isSubmitting } = form.formState

  const [imageUrl, setImageUrl] = useState<string | undefined>(resource?.imagenUrl)
  const [imageError, setImageError] = useState<string | undefined>()

  async function onImageChange(file: File | undefined) {
    if (!file) return
    const problem = validateImageFile(file)
    if (problem) {
      setImageError(problem)
      return
    }
    try {
      setImageUrl(await readImageAsDataUrl(file))
      setImageError(undefined)
    } catch {
      setImageError('No se pudo leer la imagen. Prueba con otra.')
    }
  }

  function removeImage() {
    setImageUrl(undefined)
    setImageError(undefined)
  }

  const onSubmit = form.handleSubmit((values) => {
    const data = {
      nombre: values.nombre,
      codigoInventario: values.codigoInventario,
      tipo: values.tipo as Exclude<ResourceFormValues['tipo'], ''>,
      descripcion: values.descripcion,
      imagenUrl: imageUrl,
      cantidadTotal: Number(values.cantidadTotal),
    }
    const result = resource ? update(resource.idRecurso, data) : create(data)
    if (!result.success) {
      form.setError('root.server', {
        message: result.error ?? 'No se pudo guardar el recurso.',
      })
      return
    }
    navigate('/inventory')
  })

  return {
    field: form.register,
    errors,
    serverError: errors.root?.server?.message,
    isSubmitting,
    canSubmit: !(isSubmitted && hasFieldErrors(errors)),
    onSubmit,
    isEdit,
    minQuantity,
    imageUrl,
    imageError,
    onImageChange,
    removeImage,
  }
}
