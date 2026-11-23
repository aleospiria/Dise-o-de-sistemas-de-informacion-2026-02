import { useState } from 'react'
import styles from '@/shared/components/ui/ResourceImage.module.css'
import {
  selectResourceImage,
  type ResourceImageSource,
} from '@/shared/utils/resourceImage'
import type { Resource } from '@/shared/types'

export type ResourceImageSize = 'card' | 'summary' | 'thumb' | 'preview'

export interface ResourceImageProps {
  resource: ResourceImageSource & Pick<Resource, 'nombre'>
  /** `card`: ancho completo; `summary`/`preview`: acotada; `thumb`: miniatura de lista. */
  size?: ResourceImageSize
  /**
   * La ilustración repite un nombre que ya está en texto: se oculta a los
   * lectores de pantalla (`alt=""`). Una foto subida siempre lleva `alt`,
   * porque muestra la unidad real del laboratorio.
   */
  decorative?: boolean
  /** Alternativa de la foto subida; por defecto «Imagen de <nombre>». */
  uploadedAlt?: string
  className?: string
}

/**
 * Imagen de un recurso: foto subida, ilustración del recurso semilla o
 * ilustración genérica del tipo (ver `selectResourceImage`).
 */
export function ResourceImage({
  resource,
  size = 'card',
  decorative = false,
  uploadedAlt,
  className,
}: ResourceImageProps) {
  // Si la foto subida no carga, se recuerda su URL y se muestra la ilustración.
  const [failedUrl, setFailedUrl] = useState<string | undefined>()
  const choice = selectResourceImage(resource, {
    ignoreUploaded: failedUrl !== undefined && failedUrl === resource.imagenUrl,
  })
  const alt =
    choice.kind === 'uploaded'
      ? (uploadedAlt ?? `Imagen de ${resource.nombre}`)
      : decorative
        ? ''
        : `Ilustración de ${resource.nombre}`
  const classes = [styles.image, styles[size], className].filter(Boolean).join(' ')
  return (
    <img
      className={classes}
      src={choice.src}
      alt={alt}
      width={320}
      height={180}
      loading="lazy"
      decoding="async"
      data-kind={choice.kind}
      onError={choice.kind === 'uploaded' ? () => setFailedUrl(resource.imagenUrl) : undefined}
    />
  )
}
