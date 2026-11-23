import { SEED_RESOURCE_IMAGES, TYPE_RESOURCE_IMAGES } from '@/shared/constants/resourceImages'
import type { Resource } from '@/shared/types'

/** Datos del recurso que bastan para elegir su imagen. */
export type ResourceImageSource = Pick<Resource, 'tipo' | 'codigoInventario' | 'imagenUrl'>

/**
 * Origen de la imagen elegida: foto subida, ilustración del recurso semilla o
 * ilustración genérica del tipo.
 */
export type ResourceImageKind = 'uploaded' | 'specific' | 'type'

export type ResourceImageChoice = { src: string; kind: ResourceImageKind }

export type SelectResourceImageOptions = {
  /** Ignora la imagen subida (p. ej. si el navegador no pudo cargarla). */
  ignoreUploaded?: boolean
}

/**
 * Una imagen subida solo se usa si es una `data:` URL de imagen, una ruta del
 * mismo origen o una URL http(s). Se descartan `blob:` y esquemas ajenos
 * porque la CSP solo admite `img-src 'self' data:`.
 */
export function isUsableUploadedImage(url: string | undefined): url is string {
  if (!url) return false
  const value = url.trim()
  if (value === '') return false
  return /^(data:image\/[a-z0-9.+-]+[;,]|https?:\/\/|\/(?!\/))/i.test(value)
}

/**
 * Elige la imagen de un recurso. Prioridad: imagen subida > ilustración
 * específica del recurso semilla > ilustración genérica del tipo. Función pura.
 */
export function selectResourceImage(
  resource: ResourceImageSource,
  options: SelectResourceImageOptions = {},
): ResourceImageChoice {
  if (!options.ignoreUploaded && isUsableUploadedImage(resource.imagenUrl)) {
    return { src: resource.imagenUrl.trim(), kind: 'uploaded' }
  }
  const code = resource.codigoInventario.trim().toUpperCase()
  // `hasOwn` evita que un código como "constructor" lea el prototipo.
  if (Object.hasOwn(SEED_RESOURCE_IMAGES, code)) {
    return { src: SEED_RESOURCE_IMAGES[code], kind: 'specific' }
  }
  return { src: TYPE_RESOURCE_IMAGES[resource.tipo], kind: 'type' }
}
