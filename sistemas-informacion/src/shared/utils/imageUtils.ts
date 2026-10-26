/**
 * Utilidades de imágenes de recursos (Req 4.11).
 *
 * Las imágenes se guardan como data URL dentro de `localStorage`, que ronda los
 * 5 MB en total. Por eso, en el navegador se reducen antes de guardarlas; una
 * foto de 5 MB (el máximo permitido) sin reducir llenaría el almacenamiento.
 */

export const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'] as const
export const MAX_IMAGE_BYTES = 5 * 1024 * 1024
const MAX_IMAGE_DIMENSION = 800
const JPEG_QUALITY = 0.85

/** Devuelve el motivo de rechazo del archivo, o `undefined` si es válido. */
export function validateImageFile(file: File): string | undefined {
  if (!(ALLOWED_IMAGE_TYPES as readonly string[]).includes(file.type)) {
    return 'La imagen debe ser JPG, PNG o WEBP.'
  }
  if (file.size > MAX_IMAGE_BYTES) {
    return 'La imagen no puede superar los 5 MB.'
  }
  return undefined
}

function readAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result))
    reader.onerror = () => reject(reader.error)
    reader.readAsDataURL(file)
  })
}

/**
 * Lee la imagen como data URL. Si el navegador permite dibujar en canvas, la
 * reduce a un máximo de 800 px por lado y la recodifica como JPEG; si no, la
 * devuelve tal cual.
 */
export async function readImageAsDataUrl(file: File): Promise<string> {
  if (typeof createImageBitmap === 'function' && typeof document !== 'undefined') {
    try {
      const bitmap = await createImageBitmap(file)
      const scale = Math.min(1, MAX_IMAGE_DIMENSION / Math.max(bitmap.width, bitmap.height))
      const canvas = document.createElement('canvas')
      canvas.width = Math.round(bitmap.width * scale)
      canvas.height = Math.round(bitmap.height * scale)
      const context = canvas.getContext('2d')
      if (context) {
        // Fondo blanco: JPEG no admite transparencia (PNG/WEBP con alfa).
        context.fillStyle = '#ffffff'
        context.fillRect(0, 0, canvas.width, canvas.height)
        context.drawImage(bitmap, 0, 0, canvas.width, canvas.height)
        bitmap.close()
        return canvas.toDataURL('image/jpeg', JPEG_QUALITY)
      }
      bitmap.close()
    } catch {
      // Imagen que el navegador no puede decodificar: se intenta sin reducir.
    }
  }
  return readAsDataUrl(file)
}
