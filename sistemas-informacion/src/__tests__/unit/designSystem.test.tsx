import { render, screen, within } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it } from 'vitest'
import { Card } from '@/shared/components/ui/Card'
import { ButtonLink } from '@/shared/components/ui/ButtonLink'
import { DataTable } from '@/shared/components/ui/DataTable'
import { EmptyState } from '@/shared/components/ui/EmptyState'
import { PageHeader } from '@/shared/components/ui/PageHeader'
import { StateMessage } from '@/shared/components/ui/StateMessage'
import { TypeBadge } from '@/shared/components/ui/TypeBadge'
import { ICON_NODES, Icon } from '@/shared/components/ui/icons'

describe('Icon', () => {
  it('es decorativo por defecto: oculto para lectores de pantalla y sin rol', () => {
    const { container } = render(<Icon name="home" />)
    const svg = container.querySelector('svg')
    expect(svg).toHaveAttribute('aria-hidden', 'true')
    expect(svg).not.toHaveAttribute('role')
    expect(screen.queryByRole('img')).not.toBeInTheDocument()
  })

  it('con título se expone como imagen con nombre accesible', () => {
    render(<Icon name="alert-triangle" title="Retraso" />)
    expect(screen.getByRole('img', { name: 'Retraso' })).toBeInTheDocument()
  })

  it('dibuja el tamaño pedido sin estilos en línea', () => {
    const { container } = render(<Icon name="search" size={32} />)
    const svg = container.querySelector('svg')
    expect(svg).toHaveAttribute('width', '32')
    expect(svg).toHaveAttribute('height', '32')
    expect(svg).not.toHaveAttribute('style')
  })

  it('cada ícono de la tabla tiene geometría', () => {
    for (const name of Object.keys(ICON_NODES) as Array<keyof typeof ICON_NODES>) {
      const { container, unmount } = render(<Icon name={name} />)
      expect(container.querySelector('path, circle, rect'), name).not.toBeNull()
      unmount()
    }
  })
})

describe('TypeBadge', () => {
  it('comunica el tipo con texto, no solo con color o ícono', () => {
    render(
      <>
        <TypeBadge type="Equipo" />
        <TypeBadge type="Herramienta" />
        <TypeBadge type="Material" />
      </>,
    )
    expect(screen.getByText('Equipo')).toBeInTheDocument()
    expect(screen.getByText('Herramienta')).toBeInTheDocument()
    expect(screen.getByText('Material')).toBeInTheDocument()
  })
})

describe('PageHeader', () => {
  it('muestra la descripción y la acción principal, sin dibujar un título', () => {
    render(
      <PageHeader
        description="Gestiona los recursos del laboratorio."
        action={<button type="button">Nuevo recurso</button>}
      />,
    )
    expect(screen.getByText('Gestiona los recursos del laboratorio.')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Nuevo recurso' })).toBeInTheDocument()
    expect(screen.queryByRole('heading')).not.toBeInTheDocument()
  })

  it('no dibuja nada si no hay contenido', () => {
    const { container } = render(<PageHeader />)
    expect(container).toBeEmptyDOMElement()
  })
})

describe('EmptyState', () => {
  it('explica qué pasa y ofrece una acción', () => {
    render(
      <EmptyState
        title="Sin préstamos"
        description="Cuando reserves un recurso aparecerá aquí."
        action={<button type="button">Ver disponibilidad</button>}
      />,
    )
    expect(screen.getByText('Sin préstamos')).toBeInTheDocument()
    expect(screen.getByText('Cuando reserves un recurso aparecerá aquí.')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Ver disponibilidad' })).toBeInTheDocument()
  })
})

describe('StateMessage', () => {
  it('el error se anuncia como alerta; carga, éxito e información como estado', () => {
    render(
      <>
        <StateMessage kind="error" title="No se pudo cargar">
          Intenta de nuevo.
        </StateMessage>
        <StateMessage kind="loading" title="Cargando recursos" />
        <StateMessage kind="success" title="Guardado" />
        <StateMessage kind="info" title="Sin cambios" />
      </>,
    )
    expect(screen.getByRole('alert')).toHaveTextContent('No se pudo cargar')
    expect(screen.getAllByRole('status')).toHaveLength(3)
    expect(screen.getByText('Cargando recursos').closest('[role="status"]')).toHaveAttribute(
      'aria-busy',
      'true',
    )
  })
})

describe('DataTable', () => {
  type Row = { id: string; name: string; qty: number }
  const rows: Row[] = [
    { id: 'a', name: 'Osciloscopio', qty: 2 },
    { id: 'b', name: 'Multímetro', qty: 5 },
  ]

  it('conserva la semántica de tabla con nombre accesible y encabezados de fila', () => {
    render(
      <DataTable
        label="Recursos de prueba"
        rows={rows}
        getRowKey={(row) => row.id}
        columns={[
          { key: 'name', header: 'Nombre', rowHeader: true, render: (row) => row.name },
          { key: 'qty', header: 'Cantidad', render: (row) => row.qty },
        ]}
      />,
    )
    const table = screen.getByRole('table', { name: 'Recursos de prueba' })
    expect(within(table).getAllByRole('columnheader').map((h) => h.textContent)).toEqual([
      'Nombre',
      'Cantidad',
    ])
    expect(within(table).getAllByRole('rowheader').map((h) => h.textContent)).toEqual([
      'Osciloscopio',
      'Multímetro',
    ])
    expect(within(table).getByRole('cell', { name: '5' })).toBeInTheDocument()
  })
})

describe('Card y ButtonLink', () => {
  it('Card dibuja el elemento pedido con su contenido', () => {
    render(
      <Card as="section" interactive>
        <p>contenido</p>
      </Card>,
    )
    expect(screen.getByText('contenido').parentElement?.tagName).toBe('SECTION')
  })

  it('ButtonLink es un enlace a la ruta, con el nombre del texto', () => {
    render(
      <MemoryRouter>
        <ButtonLink to="/dashboard" icon="home">
          Ir al inicio
        </ButtonLink>
      </MemoryRouter>,
    )
    expect(screen.getByRole('link', { name: 'Ir al inicio' })).toHaveAttribute('href', '/dashboard')
  })
})
