import analizadorLogico from '@/assets/resources/analizador-logico.svg'
import cautin from '@/assets/resources/cautin.svg'
import destornilladores from '@/assets/resources/destornilladores.svg'
import fuentePoder from '@/assets/resources/fuente-poder.svg'
import genericoEquipo from '@/assets/resources/generico-equipo.svg'
import genericoHerramienta from '@/assets/resources/generico-herramienta.svg'
import genericoMaterial from '@/assets/resources/generico-material.svg'
import multimetro from '@/assets/resources/multimetro.svg'
import osciloscopio from '@/assets/resources/osciloscopio.svg'
import protoboard from '@/assets/resources/protoboard.svg'
import resistencias from '@/assets/resources/resistencias.svg'
import type { ResourceType } from '@/shared/types'

/**
 * Ilustración genérica de cada tipo de recurso. Al ser `Record<ResourceType, …>`,
 * agregar un tipo a los tipos de dominio obliga a darle una ilustración aquí
 * (SOLID OCP, igual que `RESOURCE_TYPE_LABELS`).
 */
export const TYPE_RESOURCE_IMAGES: Record<ResourceType, string> = {
  Equipo: genericoEquipo,
  Herramienta: genericoHerramienta,
  Material: genericoMaterial,
}

/**
 * Ilustración específica de los recursos semilla, por código de inventario
 * (los mismos en `mockDb/seed-data.ts` y `backend/app/db/seed.py`). Un recurso
 * nuevo con ilustración propia solo añade una entrada: no hay `if`/`switch`.
 */
export const SEED_RESOURCE_IMAGES: Record<string, string> = {
  'EQ-OSC-001': osciloscopio,
  'EQ-MUL-001': multimetro,
  'HE-CAU-001': cautin,
  'HE-DES-001': destornilladores,
  'MA-PRO-001': protoboard,
  'MA-RES-001': resistencias,
  'EQ-FUE-001': fuentePoder,
  'EQ-ANA-001': analizadorLogico,
}
