import { Link } from 'react-router-dom'
import styles from '@/features/inventory/components/ResourceForm.module.css'
import { useResourceForm } from '@/features/inventory/hooks/useResourceForm'
import {
  DESCRIPCION_MAX_LENGTH,
  NOMBRE_MAX_LENGTH,
} from '@/features/inventory/types'
import { Alert } from '@/shared/components/ui/Alert'
import { Button } from '@/shared/components/ui/Button'
import { Input } from '@/shared/components/ui/Input'
import { Select } from '@/shared/components/ui/Select'
import { Textarea } from '@/shared/components/ui/Textarea'
import { RESOURCE_TYPE_LABELS, RESOURCE_TYPES } from '@/shared/constants/resourceTypes'
import type { Resource } from '@/shared/types'
import { ALLOWED_IMAGE_TYPES } from '@/shared/utils/imageUtils'

const TYPE_OPTIONS = RESOURCE_TYPES.map((value) => ({
  value,
  label: RESOURCE_TYPE_LABELS[value],
}))

export interface ResourceFormProps {
  /** Si se pasa, el formulario edita ese recurso; si no, crea uno nuevo. */
  resource?: Resource
}

/** Formulario para crear o editar un recurso del inventario (Req 4.2, 4.7). */
export function ResourceForm({ resource }: ResourceFormProps) {
  const {
    field,
    errors,
    serverError,
    isSubmitting,
    canSubmit,
    onSubmit,
    isEdit,
    minQuantity,
    imageUrl,
    imageError,
    onImageChange,
    removeImage,
  } = useResourceForm(resource)

  return (
    <form className={styles.form} onSubmit={onSubmit} noValidate>
      {serverError && <Alert type="error">{serverError}</Alert>}

      <Input
        label="Nombre"
        maxLength={NOMBRE_MAX_LENGTH}
        showCharCount
        required
        error={errors.nombre?.message}
        {...field('nombre')}
      />

      <div className={styles.row}>
        <Input
          label="Código de inventario"
          required
          error={errors.codigoInventario?.message}
          {...field('codigoInventario')}
        />
        <Select
          label="Tipo"
          placeholder="Selecciona un tipo"
          options={TYPE_OPTIONS}
          required
          error={errors.tipo?.message}
          {...field('tipo')}
        />
      </div>

      <Textarea
        label="Descripción"
        maxLength={DESCRIPCION_MAX_LENGTH}
        showCharCount
        hint="Opcional."
        error={errors.descripcion?.message}
        {...field('descripcion')}
      />

      <Input
        label="Cantidad total"
        type="number"
        inputMode="numeric"
        min={minQuantity}
        step={1}
        required
        hint={
          isEdit && minQuantity > 1
            ? `Hay ${minQuantity} unidades en uso; no puedes bajar de ${minQuantity}.`
            : 'Unidades que tiene el laboratorio de este recurso.'
        }
        error={errors.cantidadTotal?.message}
        {...field('cantidadTotal')}
      />

      <div className={styles.image}>
        <Input
          label="Imagen"
          type="file"
          accept={ALLOWED_IMAGE_TYPES.join(',')}
          hint="Opcional. JPG, PNG o WEBP, de hasta 5 MB."
          error={imageError}
          onChange={(event) => void onImageChange(event.target.files?.[0])}
        />
        {imageUrl && (
          <div className={styles.preview}>
            <img
              className={styles.previewImage}
              src={imageUrl}
              alt="Vista previa de la imagen del recurso"
            />
            <Button variant="secondary" size="sm" onClick={removeImage}>
              Quitar imagen
            </Button>
          </div>
        )}
      </div>

      <div className={styles.actions}>
        <Button type="submit" loading={isSubmitting} disabled={!canSubmit}>
          {isEdit ? 'Guardar cambios' : 'Crear recurso'}
        </Button>
        <Link to="/inventory" className={styles.cancel}>
          Cancelar
        </Link>
      </div>
    </form>
  )
}
