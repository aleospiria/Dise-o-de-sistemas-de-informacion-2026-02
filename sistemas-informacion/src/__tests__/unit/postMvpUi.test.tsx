import { fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { RecurringLoanForm } from '@/features/loans/components/RecurringLoanForm'
import { ResourceCalendarView } from '@/features/loans/components/ResourceCalendarView'
import { listOccurrences } from '@/features/loans/utils/recurrence'
import {
  countByMonth,
  countByStatus,
  countByType,
  topResources,
} from '@/features/reports/utils/aggregate'
import { BarChart } from '@/shared/components/ui/BarChart'
import { FilterBar } from '@/shared/components/ui/FilterBar'
import type { Resource, ReportRow, ResourceCalendar } from '@/shared/types'

const getResourceCalendar = vi.fn<() => Promise<ResourceCalendar>>()

vi.mock('@/services/api/resources.service', () => ({
  getResourceCalendar: () => getResourceCalendar(),
}))

vi.mock('@/contexts/useLoans', () => ({
  useLoans: () => ({ createRecurringLoans: vi.fn() }),
}))

vi.mock('@/contexts/useToast', () => ({
  useToast: () => ({ showToast: vi.fn() }),
}))

function row(partial: Partial<ReportRow>): ReportRow {
  return {
    idPrestamo: 'p',
    fecha: '2026-02-05T14:00:00.000Z',
    recurso: 'Osciloscopio',
    estudiante: 'Elena',
    estado: 'Devuelto',
    tipoRecurso: 'Equipo',
    idRecurso: 'r-0001',
    idUsuario: 'u-0001',
    ...partial,
  }
}

describe('BarChart', () => {
  const items = [
    { key: 'a', label: 'Devuelto', value: 3, tone: 'green' as const },
    { key: 'b', label: 'Vencido', value: 1, tone: 'red' as const },
  ]

  it('muestra etiqueta, valor y porcentaje como texto, no solo como barra', () => {
    render(<BarChart title="Préstamos por estado" unit="préstamos" items={items} />)
    const figure = screen.getByRole('figure', { name: 'Préstamos por estado' })
    const bars = within(within(figure).getByRole('list'))
    expect(bars.getByText('Devuelto')).toBeInTheDocument()
    expect(bars.getByText(/75 %/)).toBeInTheDocument()
    expect(bars.getByText(/25 %/)).toBeInTheDocument()
  })

  it('ofrece una tabla equivalente con los mismos datos', () => {
    render(<BarChart title="Préstamos por estado" unit="préstamos" items={items} />)
    const table = screen.getByRole('table', { name: 'Préstamos por estado', hidden: true })
    expect(within(table).getByRole('rowheader', { name: 'Vencido', hidden: true })).toBeInTheDocument()
    expect(within(table).getAllByRole('cell', { hidden: true }).map((cell) => cell.textContent)).toEqual([
      '3',
      '1',
    ])
  })

  it('oculta las barras decorativas a los lectores de pantalla', () => {
    const { container } = render(
      <BarChart title="Estados" unit="préstamos" items={items} />,
    )
    for (const svg of container.querySelectorAll('svg')) {
      expect(svg).toHaveAttribute('aria-hidden', 'true')
      expect(svg).not.toHaveAttribute('style')
    }
  })

  it('explica cuándo no hay datos', () => {
    render(<BarChart title="Estados" unit="préstamos" items={[]} emptyText="Sin datos." />)
    expect(screen.getByText('Sin datos.')).toBeInTheDocument()
  })
})

describe('agregados del reporte', () => {
  const rows = [
    row({ idPrestamo: '1', estado: 'Devuelto' }),
    row({ idPrestamo: '2', estado: 'Devuelto', fecha: '2026-03-01T10:00:00.000Z' }),
    row({
      idPrestamo: '3',
      estado: 'Vencido',
      tipoRecurso: 'Material',
      idRecurso: 'r-0005',
      recurso: 'Protoboard',
    }),
  ]

  it('cuenta por estado en el orden del ciclo y omite los vacíos', () => {
    expect(countByStatus(rows).map((item) => [item.label, item.value])).toEqual([
      ['Devuelto', 2],
      ['Vencido', 1],
    ])
  })

  it('cuenta por tipo de mayor a menor', () => {
    expect(countByType(rows).map((item) => [item.label, item.value])).toEqual([
      ['Equipo', 2],
      ['Material', 1],
    ])
  })

  it('ordena los meses cronológicamente', () => {
    expect(countByMonth(rows).map((item) => [item.label, item.value])).toEqual([
      ['feb 2026', 2],
      ['mar 2026', 1],
    ])
  })

  it('lista los recursos más solicitados con límite', () => {
    expect(topResources(rows, 1).map((item) => [item.label, item.value])).toEqual([
      ['Osciloscopio', 2],
    ])
  })
})

describe('listOccurrences', () => {
  it('devuelve las fechas que caen en los días elegidos, ambos extremos incluidos', () => {
    expect(listOccurrences('2026-03-02', '2026-03-15', [1])).toEqual([
      '2026-03-02',
      '2026-03-09',
    ])
  })

  it('devuelve vacío sin días, con fechas inválidas o con rango invertido', () => {
    expect(listOccurrences('2026-03-02', '2026-03-15', [])).toEqual([])
    expect(listOccurrences('', '2026-03-15', [1])).toEqual([])
    expect(listOccurrences('2026-03-15', '2026-03-02', [1])).toEqual([])
  })
})

describe('FilterBar', () => {
  it('es una región con nombre accesible y muestra sus acciones', () => {
    render(
      <FilterBar label="Filtros de prueba" actions={<button type="button">Aplicar</button>}>
        <input aria-label="Campo" />
      </FilterBar>,
    )
    const region = screen.getByRole('region', { name: 'Filtros de prueba' })
    expect(within(region).getByRole('button', { name: 'Aplicar' })).toBeInTheDocument()
  })
})

describe('ResourceCalendarView', () => {
  const resources = [{ idRecurso: 'r-0001', nombre: 'Osciloscopio' }] as Resource[]

  beforeEach(() => {
    getResourceCalendar.mockReset()
  })

  it('muestra la leyenda con texto y un estado vacío antes de consultar', () => {
    render(<ResourceCalendarView resources={resources} />)
    const legend = screen.getByRole('list', { name: 'Leyenda del calendario' })
    expect(within(legend).getByText('Franja libre')).toBeInTheDocument()
    expect(within(legend).getByText('Franja ocupada')).toBeInTheDocument()
    expect(within(legend).getByText('Tu reserva')).toBeInTheDocument()
    expect(screen.getByText('Elige un recurso para ver su calendario')).toBeInTheDocument()
  })

  it('rotula cada franja como Libre u Ocupada con texto', async () => {
    getResourceCalendar.mockResolvedValue({
      idRecurso: 'r-0001',
      desde: '2026-03-02',
      hasta: '2026-03-02',
      dias: [
        {
          fecha: '2026-03-02',
          disponible: true,
          cantidadDisponible: 2,
          reservas: [],
          franjas: [
            { horaInicio: '08:00', horaFin: '09:00', disponible: true, reservasActivas: 0 },
            { horaInicio: '09:00', horaFin: '10:00', disponible: false, reservasActivas: 2 },
          ],
        },
      ],
    })
    render(<ResourceCalendarView resources={resources} />)
    fireEvent.change(screen.getByLabelText('Recurso'), { target: { value: 'r-0001' } })
    const slots = await screen.findByRole('list', { name: 'Franjas del día' })
    expect(within(slots).getByText('Libre')).toBeInTheDocument()
    expect(within(slots).getByText('Ocupada')).toBeInTheDocument()
    expect(screen.getByText('1 de 2 franjas libres')).toBeInTheDocument()
  })

  it('informa el error con opción de reintentar', async () => {
    getResourceCalendar.mockRejectedValue(new Error('falló'))
    render(<ResourceCalendarView resources={resources} />)
    fireEvent.change(screen.getByLabelText('Recurso'), { target: { value: 'r-0001' } })
    await waitFor(() =>
      expect(screen.getByRole('alert')).toHaveTextContent('No se pudo cargar el calendario.'),
    )
    expect(screen.getByRole('button', { name: 'Reintentar' })).toBeInTheDocument()
  })
})

describe('RecurringLoanForm', () => {
  function renderForm() {
    return render(
      <MemoryRouter>
        <RecurringLoanForm resourceId="r-0001" />
      </MemoryRouter>,
    )
  }

  it('agrupa los campos en pasos numerados', () => {
    renderForm()
    for (const name of [
      'Periodo de la serie',
      'Horario de cada reserva',
      'Días de la semana',
      'Motivo',
    ]) {
      expect(screen.getByRole('group', { name })).toBeInTheDocument()
    }
  })

  it('resume las ocurrencias al elegir días y último día', () => {
    renderForm()
    expect(screen.getByText(/Elige el último día y al menos un día/)).toBeInTheDocument()
    fireEvent.change(screen.getByLabelText(/Primer día/), { target: { value: '2026-03-02' } })
    fireEvent.change(screen.getByLabelText(/Último día/), { target: { value: '2026-03-15' } })
    fireEvent.click(screen.getByLabelText('Lunes'))
    expect(screen.getByText('2 reservas')).toBeInTheDocument()
    const dates = screen.getByRole('list', { name: 'Fechas de la serie' })
    expect(within(dates).getAllByRole('listitem')).toHaveLength(2)
  })

  it('advierte si la duración de cada reserva no está entre 1 y 24 horas', () => {
    renderForm()
    fireEvent.change(screen.getByLabelText(/Último día/), { target: { value: '2026-12-31' } })
    fireEvent.click(screen.getByLabelText('Lunes'))
    fireEvent.change(screen.getByLabelText(/Hora de inicio/), { target: { value: '08:00' } })
    fireEvent.change(screen.getByLabelText(/Hora de fin/), { target: { value: '08:30' } })
    expect(screen.getByText('Cada reserva debe durar entre 1 y 24 horas.')).toBeInTheDocument()
  })
})
