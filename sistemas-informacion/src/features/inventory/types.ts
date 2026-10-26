import type { ResourceType } from '@/shared/types'

/** Valores del formulario de recurso (Req 4.2). La imagen se maneja aparte. */
export interface ResourceFormValues {
  nombre: string
  codigoInventario: string
  tipo: ResourceType | ''
  descripcion: string
  /** Texto del campo numérico; se convierte al validar. */
  cantidadTotal: string
}

export const NOMBRE_MAX_LENGTH = 100
export const DESCRIPCION_MAX_LENGTH = 500
