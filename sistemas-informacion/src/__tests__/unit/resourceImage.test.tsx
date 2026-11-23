import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { seedData } from '@/services/mockDb/seed-data'
import { InMemoryStorageRepository } from '@/services/storage'
import { ResourceImage } from '@/shared/components/ui/ResourceImage'
import { SEED_RESOURCE_IMAGES, TYPE_RESOURCE_IMAGES } from '@/shared/constants/resourceImages'
import { LS_KEYS } from '@/shared/constants/lsKeys'
import { RESOURCE_TYPES } from '@/shared/constants/resourceTypes'
import type { Resource } from '@/shared/types'
import { isUsableUploadedImage, selectResourceImage } from '@/shared/utils/resourceImage'

const PHOTO = 'data:image/jpeg;base64,/9j/AAAA'

const resource = (overrides: Partial<Resource> = {}) => ({
  nombre: 'Recurso de prueba',
  tipo: 'Equipo' as const,
  codigoInventario: 'XX-000-000',
  imagenUrl: undefined as string | undefined,
  ...overrides,
})

describe('selectResourceImage: subida > específica > por tipo', () => {
  it('prefiere la imagen subida aunque el recurso tenga ilustración propia', () => {
    const choice = selectResourceImage(resource({ codigoInventario: 'EQ-MUL-001', imagenUrl: PHOTO }))
    expect(choice).toEqual({ src: PHOTO, kind: 'uploaded' })
  })

  it('sin imagen subida usa la ilustración específica del recurso semilla', () => {
    const choice = selectResourceImage(resource({ codigoInventario: 'EQ-MUL-001' }))
    expect(choice).toEqual({ src: SEED_RESOURCE_IMAGES['EQ-MUL-001'], kind: 'specific' })
  })

  it('un recurso sin ilustración propia usa la genérica de su tipo', () => {
    for (const tipo of RESOURCE_TYPES) {
      expect(selectResourceImage(resource({ tipo }))).toEqual({
        src: TYPE_RESOURCE_IMAGES[tipo],
        kind: 'type',
      })
    }
  })

  it('ignora la imagen subida si se pide (p. ej. falló al cargar)', () => {
    const choice = selectResourceImage(
      resource({ codigoInventario: 'EQ-MUL-001', imagenUrl: PHOTO }),
      { ignoreUploaded: true },
    )
    expect(choice.kind).toBe('specific')
  })

  it('la asociación ignora mayúsculas y espacios del código', () => {
    expect(selectResourceImage(resource({ codigoInventario: ' eq-osc-001 ' })).kind).toBe('specific')
  })

  it('un código como "constructor" no lee el prototipo y cae en la genérica', () => {
    expect(selectResourceImage(resource({ codigoInventario: 'constructor' })).kind).toBe('type')
  })

  it('una imagen subida vacía, blob: o de otro esquema se descarta', () => {
    for (const imagenUrl of ['', '   ', 'blob:http://localhost/abc', 'javascript:alert(1)', 'ftp://x/y.png']) {
      expect(selectResourceImage(resource({ imagenUrl })).kind).toBe('type')
    }
  })

  it('acepta data: de imagen (incluido SVG), rutas del mismo origen y http(s)', () => {
    for (const url of [
      PHOTO,
      'data:image/svg+xml;base64,PHN2Zz48L3N2Zz4=',
      'data:image/png,AAAA',
      '/uploads/foto.png',
      'https://api.itm.edu.co/img/1.jpg',
    ]) {
      expect(isUsableUploadedImage(url)).toBe(true)
    }
    expect(isUsableUploadedImage('//otro-host/x.png')).toBe(false)
    expect(isUsableUploadedImage(undefined)).toBe(false)
  })
})

describe('tabla declarativa de ilustraciones', () => {
  it('cada recurso semilla tiene su ilustración, distinta de las genéricas y de las demás', () => {
    const repo = new InMemoryStorageRepository()
    seedData(repo)
    const seeds = repo.get<Resource[]>(LS_KEYS.RESOURCES) ?? []
    expect(seeds).toHaveLength(8)
    const sources = seeds.map((r) => {
      const choice = selectResourceImage(r)
      expect(choice.kind, r.nombre).toBe('specific')
      return choice.src
    })
    expect(new Set(sources).size).toBe(8)
    for (const generic of Object.values(TYPE_RESOURCE_IMAGES)) {
      expect(sources).not.toContain(generic)
    }
  })
})

describe('ResourceImage', () => {
  it('muestra la ilustración con alt descriptivo y proporción reservada', () => {
    render(<ResourceImage resource={resource({ nombre: 'Multímetro Fluke 117', codigoInventario: 'EQ-MUL-001' })} />)
    const image = screen.getByRole('img', { name: 'Ilustración de Multímetro Fluke 117' })
    expect(image).toHaveAttribute('src', SEED_RESOURCE_IMAGES['EQ-MUL-001'])
    expect(image).toHaveAttribute('width', '320')
    expect(image).toHaveAttribute('height', '180')
    expect(image).toHaveAttribute('data-kind', 'specific')
  })

  it('decorativa: la ilustración lleva alt vacío y no entra en el árbol de accesibilidad', () => {
    const { container } = render(<ResourceImage resource={resource()} decorative />)
    expect(container.querySelector('img')).toHaveAttribute('alt', '')
    expect(screen.queryByRole('img')).not.toBeInTheDocument()
  })

  it('una foto subida siempre lleva alt, aunque se pida decorativa', () => {
    render(<ResourceImage resource={resource({ nombre: 'Osciloscopio', imagenUrl: PHOTO })} decorative />)
    const image = screen.getByRole('img', { name: 'Imagen de Osciloscopio' })
    expect(image).toHaveAttribute('src', PHOTO)
    expect(image).toHaveAttribute('data-kind', 'uploaded')
  })

  it('admite una alternativa propia para la foto subida', () => {
    render(
      <ResourceImage
        resource={resource({ imagenUrl: PHOTO })}
        uploadedAlt="Vista previa de la imagen del recurso"
      />,
    )
    expect(screen.getByAltText('Vista previa de la imagen del recurso')).toBeInTheDocument()
  })

  it('si la foto subida no carga, vuelve a la ilustración del recurso', () => {
    render(<ResourceImage resource={resource({ codigoInventario: 'HE-CAU-001', imagenUrl: PHOTO })} />)
    fireEvent.error(screen.getByRole('img'))
    const image = screen.getByRole('img')
    expect(image).toHaveAttribute('src', SEED_RESOURCE_IMAGES['HE-CAU-001'])
    expect(image).toHaveAttribute('data-kind', 'specific')
  })

  it('no usa estilos en línea ni URLs blob:', () => {
    const { container } = render(<ResourceImage resource={resource({ imagenUrl: 'blob:http://x/1' })} size="thumb" />)
    const image = container.querySelector('img')
    expect(image).not.toHaveAttribute('style')
    expect(image?.getAttribute('src')).not.toMatch(/^blob:/)
    expect(image).toHaveAttribute('data-kind', 'type')
  })
})
