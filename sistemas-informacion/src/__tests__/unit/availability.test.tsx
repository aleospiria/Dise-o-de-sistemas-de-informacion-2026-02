import { fireEvent, screen, waitFor, within } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import {
  filterByName,
  filterByType,
  getActiveReservations,
  getNextAvailableAt,
  isListable,
  resolveAvailabilityWindow,
  sortByName,
} from '@/features/loans/availability'
import { createLoan } from '@/services/mockDb/loans.service'
import { LS_KEYS } from '@/shared/constants/lsKeys'
import type { Loan, Resource } from '@/shared/types'
import { toDateInputValue } from '@/shared/utils/dateUtils'
import { renderApp } from '@/test/renderApp'
import type { InMemoryStorageRepository } from '@/services/storage'

const MOTIVO = 'Práctica de laboratorio de circuitos.'

function resource(partial: Partial<Resource>): Resource {
  return {
    idRecurso: 'r',
    nombre: 'Recurso',
    codigoInventario: 'X',
    tipo: 'Equipo',
    descripcion: '',
    cantidadTotal: 1,
    cantidadDisponible: 1,
    estadoActual: 'Disponible',
    fechaCreacion: '2026-01-01T00:00:00.000Z',
    ...partial,
  }
}

function loan(partial: Partial<Loan>): Loan {
  return {
    idPrestamo: 'l',
    idUsuario: 'u-estudiante-0001',
    idRecurso: 'r',
    fechaHoraReserva: '2026-01-01T00:00:00.000Z',
    fechaHoraInicioProgramada: '2026-01-01T10:00:00.000Z',
    fechaHoraFinProgramada: '2026-01-01T12:00:00.000Z',
    estadoPrestamo: 'Reservado',
    motivoPrestamo: MOTIVO,
    ...partial,
  }
}

/** Fecha local `days` días adelante, a la hora indicada. */
function futureAt(days: number, hour: number): Date {
  const date = new Date()
  date.setDate(date.getDate() + days)
  date.setHours(hour, 0, 0, 0)
  return date
}

/** Agrega préstamos activos sintéticos que ocupan un horario sin tocar el stock. */
function occupy(repo: InMemoryStorageRepository, resourceId: string, count: number, start: Date, end: Date) {
  const existing = repo.get<Loan[]>(LS_KEYS.LOANS) ?? []
  const synthetic = Array.from({ length: count }, (_, i) =>
    loan({
      idPrestamo: `sint-${i}`,
      idRecurso: resourceId,
      fechaHoraInicioProgramada: start.toISOString(),
      fechaHoraFinProgramada: end.toISOString(),
    }),
  )
  repo.set(LS_KEYS.LOANS, [...existing, ...synthetic])
}

const cardNames = () =>
  screen.getAllByRole('heading', { level: 2 }).map((h) => h.textContent)

describe('reglas puras de disponibilidad', () => {
  const recursos = [
    resource({ idRecurso: '1', nombre: 'Osciloscopio', tipo: 'Equipo' }),
    resource({ idRecurso: '2', nombre: 'Cautín', tipo: 'Herramienta' }),
    resource({ idRecurso: '3', nombre: 'Protoboard', tipo: 'Material' }),
  ]

  it('filterByName ignora mayúsculas y devuelve un subconjunto (Req 6.4)', () => {
    expect(filterByName(recursos, 'OSCI').map((r) => r.idRecurso)).toEqual(['1'])
    expect(filterByName(recursos, 'o').length).toBeLessThanOrEqual(recursos.length)
    expect(filterByName(recursos, '   ')).toBe(recursos)
    expect(filterByName(recursos, 'zzz')).toEqual([])
  })

  it('filterByType filtra por tipo y "" significa todos (Req 6.6)', () => {
    expect(filterByType(recursos, 'Material').map((r) => r.nombre)).toEqual(['Protoboard'])
    expect(filterByType(recursos, '')).toBe(recursos)
  })

  it('sortByName ordena alfabéticamente sin mutar la entrada (Req 6.11)', () => {
    const original = [...recursos]
    expect(sortByName(recursos).map((r) => r.nombre)).toEqual(['Cautín', 'Osciloscopio', 'Protoboard'])
    expect(recursos).toEqual(original)
  })

  it('isListable muestra disponibles y en uso, no mantenimiento ni bajas', () => {
    expect(isListable(resource({ estadoActual: 'Disponible' }))).toBe(true)
    expect(isListable(resource({ estadoActual: 'Reservado' }))).toBe(true)
    expect(isListable(resource({ estadoActual: 'En_Préstamo' }))).toBe(true)
    expect(isListable(resource({ estadoActual: 'En_Mantenimiento' }))).toBe(false)
    expect(isListable(resource({ estadoActual: 'Dado_de_Baja' }))).toBe(false)
  })

  describe('reservas vigentes', () => {
    const now = new Date('2026-06-01T12:00:00.000Z').getTime()
    const loans = [
      loan({ idPrestamo: 'a', fechaHoraInicioProgramada: '2026-06-03T10:00:00.000Z', fechaHoraFinProgramada: '2026-06-03T12:00:00.000Z' }),
      loan({ idPrestamo: 'b', fechaHoraInicioProgramada: '2026-06-02T10:00:00.000Z', fechaHoraFinProgramada: '2026-06-02T11:00:00.000Z', estadoPrestamo: 'En_Préstamo' }),
      loan({ idPrestamo: 'c', fechaHoraInicioProgramada: '2026-05-01T10:00:00.000Z', fechaHoraFinProgramada: '2026-05-01T12:00:00.000Z' }), // ya terminó
      loan({ idPrestamo: 'd', fechaHoraInicioProgramada: '2026-06-04T10:00:00.000Z', fechaHoraFinProgramada: '2026-06-04T12:00:00.000Z', estadoPrestamo: 'Cancelado' }),
      loan({ idPrestamo: 'e', idRecurso: 'otro', fechaHoraInicioProgramada: '2026-06-02T10:00:00.000Z', fechaHoraFinProgramada: '2026-06-02T12:00:00.000Z' }),
    ]

    it('solo cuenta activas y no terminadas del recurso, ordenadas por inicio (Req 6.9)', () => {
      const reservas = getActiveReservations(loans, 'r', now)
      expect(reservas.map((r) => r.start)).toEqual(['2026-06-02T10:00:00.000Z', '2026-06-03T10:00:00.000Z'])
    })

    it('la próxima disponibilidad es el fin más cercano (Req 6.10)', () => {
      expect(getNextAvailableAt(getActiveReservations(loans, 'r', now))).toBe('2026-06-02T11:00:00.000Z')
      expect(getNextAvailableAt([])).toBeUndefined()
    })
  })

  describe('ventana de horario (Req 6.7, 6.8)', () => {
    it('sin fecha ni hora no filtra; con una sola, está incompleta', () => {
      expect(resolveAvailabilityWindow('', '').status).toBe('none')
      expect(resolveAvailabilityWindow('2099-01-01', '').status).toBe('incomplete')
      expect(resolveAvailabilityWindow('', '10:00').status).toBe('incomplete')
    })

    it('un momento pasado no es válido', () => {
      expect(resolveAvailabilityWindow('2020-01-01', '10:00').status).toBe('past')
    })

    it('un momento futuro abarca exactamente una hora', () => {
      const window = resolveAvailabilityWindow('2099-01-01', '10:00')
      expect(window.status).toBe('ok')
      if (window.status === 'ok') {
        expect(new Date(window.end).getTime() - new Date(window.start).getTime()).toBe(60 * 60 * 1000)
      }
    })
  })
})

describe('pantalla de disponibilidad', () => {
  it('lista los recursos visibles por nombre y oculta los que están en mantenimiento (Req 6.2, 6.11)', () => {
    renderApp('/availability', { role: 'Estudiante' })
    expect(screen.getByRole('heading', { level: 1, name: 'Disponibilidad' })).toBeInTheDocument()
    expect(cardNames()).toEqual([
      'Analizador lógico 8 canales',
      'Cautín de estación Hakko FX-888D',
      'Juego de destornilladores de precisión',
      'Kit de resistencias surtidas',
      'Multímetro Fluke 117',
      'Osciloscopio Tektronix TBS1052',
      'Protoboard 830 puntos',
    ])
    expect(screen.getByText('7 recursos encontrados.')).toBeInTheDocument()
  })

  it('busca por nombre con retraso y sin distinguir mayúsculas (Req 6.3, 6.4)', async () => {
    const { user } = renderApp('/availability', { role: 'Estudiante' })
    await user.type(screen.getByLabelText('Buscar por nombre'), 'MULTÍ')
    await waitFor(() => expect(cardNames()).toEqual(['Multímetro Fluke 117']))
    expect(screen.getByText('1 recurso encontrado.')).toBeInTheDocument()
  })

  it('filtra por tipo (Req 6.5, 6.6)', async () => {
    const { user } = renderApp('/availability', { role: 'Estudiante' })
    await user.selectOptions(screen.getByLabelText('Tipo'), 'Material')
    expect(cardNames()).toEqual(['Kit de resistencias surtidas', 'Protoboard 830 puntos'])
  })

  it('combina nombre y tipo, y muestra un mensaje si no hay resultados', async () => {
    const { user } = renderApp('/availability', { role: 'Estudiante' })
    await user.selectOptions(screen.getByLabelText('Tipo'), 'Herramienta')
    await user.type(screen.getByLabelText('Buscar por nombre'), 'osciloscopio')
    expect(await screen.findByText('No hay recursos que coincidan con la búsqueda.')).toBeInTheDocument()
  })

  it('"Limpiar filtros" restablece el listado', async () => {
    const { user } = renderApp('/availability', { role: 'Estudiante' })
    const limpiar = screen.getByRole('button', { name: 'Limpiar filtros' })
    expect(limpiar).toBeDisabled()

    await user.selectOptions(screen.getByLabelText('Tipo'), 'Material')
    expect(limpiar).toBeEnabled()
    await user.click(limpiar)
    expect(cardNames()).toHaveLength(7)
    expect(screen.getByLabelText('Tipo')).toHaveValue('')
  })

  describe('filtro por fecha y hora (Req 6.7, 6.8)', () => {
    const start = futureAt(2, 10)
    const end = futureAt(2, 12)
    const setWindow = (hora: string, fecha = toDateInputValue(start)) => {
      fireEvent.change(screen.getByLabelText('Fecha'), { target: { value: fecha } })
      fireEvent.change(screen.getByLabelText('Hora'), { target: { value: hora } })
    }

    it('excluye los recursos cuyas unidades están todas ocupadas en ese horario', () => {
      // r-0002 sigue "Disponible" y con stock, pero sus 5 unidades están reservadas ese día.
      renderApp('/availability', {
        role: 'Estudiante',
        prepare: (repo) => occupy(repo, 'r-0002', 5, start, end),
      })
      expect(cardNames()).toContain('Multímetro Fluke 117')

      setWindow('10:30')
      expect(cardNames()).not.toContain('Multímetro Fluke 117')
      expect(cardNames()).toContain('Protoboard 830 puntos')
      expect(screen.getByText(/Disponibles en el horario elegido/)).toBeInTheDocument()
    })

    it('un horario sin conflicto sigue mostrando el recurso', () => {
      renderApp('/availability', {
        role: 'Estudiante',
        prepare: (repo) => occupy(repo, 'r-0002', 5, start, end),
      })
      setWindow('14:00') // después de que termina la ocupación
      expect(cardNames()).toContain('Multímetro Fluke 117')
    })

    it('con solo uno de los dos campos pide completar el otro', () => {
      renderApp('/availability', { role: 'Estudiante' })
      fireEvent.change(screen.getByLabelText('Hora'), { target: { value: '10:00' } })
      expect(screen.getByText('Elige la fecha y la hora para filtrar por horario.')).toBeInTheDocument()
      expect(cardNames()).toHaveLength(7)
    })

    it('rechaza un momento pasado', () => {
      renderApp('/availability', { role: 'Estudiante' })
      setWindow('10:00', '2020-01-01')
      expect(screen.getByText('La fecha y la hora no pueden estar en el pasado.')).toBeInTheDocument()
      expect(cardNames()).toHaveLength(7)
    })
  })

  describe('recursos no disponibles (Req 6.9, 6.10)', () => {
    const start = futureAt(2, 10)
    const end = futureAt(2, 12)

    function reserveLastUnit(repo: InMemoryStorageRepository) {
      // r-0008 tiene una sola unidad: al reservarla queda sin stock.
      const result = createLoan(
        {
          idRecurso: 'r-0008',
          fechaHoraInicioProgramada: start.toISOString(),
          fechaHoraFinProgramada: end.toISOString(),
          motivoPrestamo: MOTIVO,
        },
        'u-estudiante-0001',
        repo,
      )
      expect(result.success).toBe(true)
    }

    it('lo marca "No disponible", indica cuándo se libera y no ofrece solicitarlo', () => {
      renderApp('/availability', { role: 'Estudiante', prepare: reserveLastUnit })
      const card = screen.getByRole('heading', { level: 2, name: 'Analizador lógico 8 canales' }).closest('article')!
      expect(within(card).getByText('No disponible')).toBeInTheDocument()
      expect(within(card).getByText(/Se libera el/)).toBeInTheDocument()
      expect(within(card).queryByRole('button')).not.toBeInTheDocument()
    })

    it('muestra las próximas reservas de un recurso', () => {
      renderApp('/availability', { role: 'Estudiante', prepare: reserveLastUnit })
      const card = screen.getByRole('heading', { level: 2, name: 'Analizador lógico 8 canales' }).closest('article')!
      expect(within(card).getByRole('heading', { level: 3, name: 'Próximas reservas' })).toBeInTheDocument()
      expect(within(card).getAllByRole('listitem')).toHaveLength(1)
    })
  })

  describe('solicitar préstamo según el rol (Req 8.1)', () => {
    it('el estudiante ve el botón en los recursos disponibles y navega al formulario', async () => {
      const { user, pathname } = renderApp('/availability', { role: 'Estudiante' })
      expect(screen.getAllByRole('button', { name: /^Solicitar préstamo de / })).toHaveLength(7)

      await user.click(screen.getByRole('button', { name: 'Solicitar préstamo de Multímetro Fluke 117' }))
      expect(pathname()).toBe('/loans/new/r-0002')
    })

    it.each(['Técnico_Laboratorio', 'Administrador_Laboratorio'] as const)(
      '%s consulta la disponibilidad pero no ve el botón de solicitar',
      (role) => {
        renderApp('/availability', { role })
        expect(cardNames()).toHaveLength(7)
        expect(screen.queryByRole('button', { name: /Solicitar préstamo/ })).not.toBeInTheDocument()
      },
    )
  })
})
