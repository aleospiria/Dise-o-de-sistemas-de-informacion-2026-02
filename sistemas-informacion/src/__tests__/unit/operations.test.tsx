import { act, fireEvent, screen, waitFor, within } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { validateConditionForm } from '@/features/operations/validation'
import type { InMemoryStorageRepository } from '@/services/storage'
import { LS_KEYS } from '@/shared/constants/lsKeys'
import { VALIDATION_MESSAGES as M } from '@/shared/constants/messages'
import type { Loan, Resource } from '@/shared/types'
import { formatDuration } from '@/shared/utils/dateUtils'
import { renderApp } from '@/test/renderApp'

const HOUR = 60 * 60 * 1000
const MOTIVO = 'Práctica de laboratorio de circuitos.'

afterEach(() => {
  vi.useRealTimers()
})

function addLoan(repo: InMemoryStorageRepository, loan: Partial<Loan> & { idPrestamo: string }) {
  const full: Loan = {
    idUsuario: 'u-estudiante-0001',
    idRecurso: 'r-0004',
    fechaHoraReserva: new Date().toISOString(),
    fechaHoraInicioProgramada: new Date(Date.now() - HOUR).toISOString(),
    fechaHoraFinProgramada: new Date(Date.now() + 3 * HOUR).toISOString(),
    estadoPrestamo: 'Reservado',
    motivoPrestamo: MOTIVO,
    ...loan,
  }
  repo.set(LS_KEYS.LOANS, [...(repo.get<Loan[]>(LS_KEYS.LOANS) ?? []), full])
}

const loansOf = (repo: InMemoryStorageRepository) => repo.get<Loan[]>(LS_KEYS.LOANS) ?? []
const resourceOf = (repo: InMemoryStorageRepository, id: string) =>
  (repo.get<Resource[]>(LS_KEYS.RESOURCES) ?? []).find((r) => r.idRecurso === id)
const cardTitles = () => screen.getAllByRole('heading', { level: 2 }).map((h) => h.textContent)

describe('formatDuration', () => {
  it('formatea horas con decimales, días y casos límite', () => {
    expect(formatDuration(0)).toBe('0 min')
    expect(formatDuration(0.5)).toBe('30 min')
    expect(formatDuration(3.5)).toBe('3 h 30 min')
    expect(formatDuration(24)).toBe('1 día')
    expect(formatDuration(51)).toBe('2 días 3 h')
    expect(formatDuration(-4)).toBe('0 min')
  })
})

describe('validación del formulario de condición', () => {
  const base = { condicion: 'Bueno' as const, observaciones: '' }

  it('una condición buena sin observaciones es válida', () => {
    expect(validateConditionForm(base, { requireNotesIfDamaged: true })).toEqual({})
  })

  it('en la entrega, Dañado exige observaciones (Req 12.8)', () => {
    const dañado = { condicion: 'Dañado' as const, observaciones: '   ' }
    expect(validateConditionForm(dañado, { requireNotesIfDamaged: true }).observaciones).toMatch(
      /obligatorias/,
    )
    expect(validateConditionForm(dañado, { requireNotesIfDamaged: false })).toEqual({})
  })

  it('rechaza observaciones de más de 500 caracteres (Req 12.7)', () => {
    const largas = { ...base, observaciones: 'x'.repeat(501) }
    expect(validateConditionForm(largas, { requireNotesIfDamaged: false }).observaciones).toMatch(/500/)
    expect(
      validateConditionForm({ ...base, observaciones: 'x'.repeat(500) }, { requireNotesIfDamaged: false }),
    ).toEqual({})
  })

  it('exige condición', () => {
    expect(
      validateConditionForm({ ...base, condicion: '' as never }, { requireNotesIfDamaged: false }).condicion,
    ).toBe(M.required)
  })
})

describe('entregas pendientes (Req 12)', () => {
  const dialog = () => screen.getByRole('dialog', { name: 'Registrar entrega' })

  it('lista la reserva cuya hora ya llegó, con recurso, estudiante e inicio (Req 12.1, 12.3)', () => {
    renderApp('/deliveries', { role: 'Técnico_Laboratorio' })
    expect(screen.getByRole('heading', { level: 1, name: 'Entregas' })).toBeInTheDocument()
    const tarjeta = screen
      .getByRole('heading', { level: 2, name: 'Osciloscopio Tektronix TBS1052' })
      .closest('article')!
    expect(within(tarjeta).getByText('Elena Estudiante')).toBeInTheDocument()
    expect(within(tarjeta).getByText('Inicio programado')).toBeInTheDocument()
    expect(screen.getByText('1 entrega pendiente.')).toBeInTheDocument()
  })

  it('no lista las reservas futuras ni las que ya no están en estado Reservado', () => {
    renderApp('/deliveries', {
      role: 'Técnico_Laboratorio',
      prepare: (repo) =>
        addLoan(repo, {
          idPrestamo: 'futura',
          fechaHoraInicioProgramada: new Date(Date.now() + 24 * HOUR).toISOString(),
          fechaHoraFinProgramada: new Date(Date.now() + 26 * HOUR).toISOString(),
        }),
    })
    expect(cardTitles()).toEqual(['Osciloscopio Tektronix TBS1052'])
  })

  it('ordena por hora de inicio, la más antigua primero (Req 12.2)', () => {
    renderApp('/deliveries', {
      role: 'Técnico_Laboratorio',
      prepare: (repo) =>
        addLoan(repo, {
          idPrestamo: 'mas-antigua',
          idRecurso: 'r-0004',
          fechaHoraInicioProgramada: '2026-01-30T08:00:00.000Z',
          fechaHoraFinProgramada: '2026-01-30T10:00:00.000Z',
        }),
    })
    expect(cardTitles()).toEqual([
      'Juego de destornilladores de precisión',
      'Osciloscopio Tektronix TBS1052',
    ])
  })

  it('una reserva aparece sola cuando llega su hora, sin recargar', () => {
    vi.useFakeTimers()
    renderApp('/deliveries', {
      role: 'Técnico_Laboratorio',
      prepare: (repo) =>
        addLoan(repo, {
          idPrestamo: 'en-un-minuto',
          idRecurso: 'r-0004',
          fechaHoraInicioProgramada: new Date(Date.now() + 60_000).toISOString(),
          fechaHoraFinProgramada: new Date(Date.now() + 2 * HOUR).toISOString(),
        }),
    })
    expect(cardTitles()).toEqual(['Osciloscopio Tektronix TBS1052'])

    act(() => {
      vi.advanceTimersByTime(90_000)
    })
    // La nueva (empieza ahora) va después del osciloscopio, que empezó en febrero.
    expect(cardTitles()).toEqual([
      'Osciloscopio Tektronix TBS1052',
      'Juego de destornilladores de precisión',
    ])
  })

  it('sin entregas muestra un estado vacío', () => {
    renderApp('/deliveries', {
      role: 'Técnico_Laboratorio',
      prepare: (repo) => repo.set(LS_KEYS.LOANS, []),
    })
    expect(screen.getByText(/No hay entregas pendientes/)).toBeInTheDocument()
    expect(screen.getByText('0 entregas pendientes.')).toBeInTheDocument()
  })

  it('abre un diálogo con condición "Bueno" por defecto y se cierra con Cancelar', async () => {
    const { user, repo } = renderApp('/deliveries', { role: 'Técnico_Laboratorio' })
    await user.click(screen.getByRole('button', { name: /^Registrar entrega:/ }))

    expect(within(dialog()).getByLabelText(/^Condición del recurso/)).toHaveValue('Bueno')
    expect(within(dialog()).getByLabelText(/^Condición del recurso/)).toHaveFocus()

    await user.click(within(dialog()).getByRole('button', { name: 'Cancelar' }))
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    expect(loansOf(repo).find((l) => l.idPrestamo === 'p-0001')?.estadoPrestamo).toBe('Reservado')
  })

  it('Dañado sin observaciones muestra el error y no registra la entrega (Req 12.8)', async () => {
    const { user, repo } = renderApp('/deliveries', { role: 'Técnico_Laboratorio' })
    await user.click(screen.getByRole('button', { name: /^Registrar entrega:/ }))
    await user.selectOptions(within(dialog()).getByLabelText(/^Condición del recurso/), 'Dañado')
    await user.click(within(dialog()).getByRole('button', { name: 'Confirmar entrega' }))

    expect(
      await within(dialog()).findByText('Las observaciones son obligatorias si el recurso está dañado.'),
    ).toBeInTheDocument()
    expect(loansOf(repo).find((l) => l.idPrestamo === 'p-0001')?.estadoPrestamo).toBe('Reservado')
  })

  it('confirmar la entrega pasa el préstamo a En_Préstamo y lo saca de la lista (Req 12.6, 12.9, 12.10)', async () => {
    const { user, repo } = renderApp('/deliveries', { role: 'Técnico_Laboratorio' })
    await user.click(screen.getByRole('button', { name: /^Registrar entrega:/ }))
    await user.type(within(dialog()).getByLabelText(/^Observaciones/), 'Con sus cables')
    await user.click(within(dialog()).getByRole('button', { name: 'Confirmar entrega' }))

    expect(
      await screen.findByText('Entrega registrada: Osciloscopio Tektronix TBS1052 para Elena Estudiante.'),
    ).toBeInTheDocument()
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    expect(screen.getByText(/No hay entregas pendientes/)).toBeInTheDocument()

    const prestamo = loansOf(repo).find((l) => l.idPrestamo === 'p-0001')!
    expect(prestamo.estadoPrestamo).toBe('En_Préstamo')
    expect(prestamo.condicionEntrega).toBe('Bueno')
    expect(prestamo.observacionesEntrega).toBe('Con sus cables')
    expect(prestamo.fechaHoraEntrega).toBeDefined()
  })

  it('una entrega en condición Dañado con observaciones se registra', async () => {
    const { user, repo } = renderApp('/deliveries', { role: 'Técnico_Laboratorio' })
    await user.click(screen.getByRole('button', { name: /^Registrar entrega:/ }))
    await user.selectOptions(within(dialog()).getByLabelText(/^Condición del recurso/), 'Dañado')
    await user.type(within(dialog()).getByLabelText(/^Observaciones/), 'Pantalla rayada')
    await user.click(within(dialog()).getByRole('button', { name: 'Confirmar entrega' }))

    await waitFor(() =>
      expect(loansOf(repo).find((l) => l.idPrestamo === 'p-0001')?.condicionEntrega).toBe('Dañado'),
    )
  })
})

describe('devoluciones pendientes (Req 13)', () => {
  const dialog = () => screen.getByRole('dialog', { name: 'Registrar devolución' })

  function addOnTimeLoan(repo: InMemoryStorageRepository) {
    addLoan(repo, { idPrestamo: 'a-tiempo', estadoPrestamo: 'En_Préstamo', idRecurso: 'r-0004' })
  }

  it('lista los préstamos en curso y marca el atrasado en rojo con texto (Req 13.1, 13.3)', () => {
    renderApp('/returns', { role: 'Técnico_Laboratorio' })
    expect(screen.getByRole('heading', { level: 1, name: 'Devoluciones' })).toBeInTheDocument()
    const tarjeta = screen
      .getByRole('heading', { level: 2, name: 'Cautín de estación Hakko FX-888D' })
      .closest('article')!
    expect(within(tarjeta).getByText(/^Con retraso de /)).toBeInTheDocument()
    expect(within(tarjeta).getByText('Fin programado')).toBeInTheDocument()
    expect(screen.getByText('1 devolución pendiente, 1 con retraso.')).toBeInTheDocument()
  })

  it('un préstamo a tiempo no muestra aviso de retraso', () => {
    renderApp('/returns', { role: 'Técnico_Laboratorio', prepare: addOnTimeLoan })
    const tarjeta = screen
      .getByRole('heading', { level: 2, name: 'Juego de destornilladores de precisión' })
      .closest('article')!
    expect(within(tarjeta).queryByText(/Con retraso/)).not.toBeInTheDocument()
    expect(screen.getByText('2 devoluciones pendientes, 1 con retraso.')).toBeInTheDocument()
  })

  it('ordena por hora de fin, la más antigua primero (Req 13.2)', () => {
    renderApp('/returns', { role: 'Técnico_Laboratorio', prepare: addOnTimeLoan })
    expect(cardTitles()).toEqual([
      'Cautín de estación Hakko FX-888D',
      'Juego de destornilladores de precisión',
    ])
  })

  it('sin devoluciones muestra un estado vacío', () => {
    renderApp('/returns', {
      role: 'Técnico_Laboratorio',
      prepare: (repo) => repo.set(LS_KEYS.LOANS, []),
    })
    expect(screen.getByText(/No hay devoluciones pendientes/)).toBeInTheDocument()
  })

  it('el diálogo muestra el retraso acumulado, o que está a tiempo (Req 13.8)', async () => {
    const { user } = renderApp('/returns', { role: 'Técnico_Laboratorio', prepare: addOnTimeLoan })

    await user.click(screen.getByRole('button', { name: /^Registrar devolución: Cautín/ }))
    expect(within(dialog()).getByText(/^Retraso actual: /)).toBeInTheDocument()
    await user.click(within(dialog()).getByRole('button', { name: 'Cancelar' }))

    await user.click(screen.getByRole('button', { name: /^Registrar devolución: Juego de destornilladores/ }))
    expect(within(dialog()).getByText('La devolución está a tiempo.')).toBeInTheDocument()
  })

  it('devolver en buen estado libera la unidad, calcula el retraso y deja el recurso Disponible (Req 13.5–13.7, 13.10, 13.11)', async () => {
    const { user, repo } = renderApp('/returns', { role: 'Técnico_Laboratorio' })
    await user.click(screen.getByRole('button', { name: /^Registrar devolución:/ }))
    await user.click(within(dialog()).getByRole('button', { name: 'Confirmar devolución' }))

    expect(
      await screen.findByText(/^Devolución registrada: Cautín de estación Hakko FX-888D\. Retraso: /),
    ).toBeInTheDocument()
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    expect(screen.getByText(/No hay devoluciones pendientes/)).toBeInTheDocument()

    const prestamo = loansOf(repo).find((l) => l.idPrestamo === 'p-0002')!
    expect(prestamo.estadoPrestamo).toBe('Devuelto')
    expect(prestamo.retrasoHoras).toBeGreaterThan(0)
    expect(prestamo.fechaHoraDevolucionReal).toBeDefined()
    expect(resourceOf(repo, 'r-0003')).toMatchObject({ cantidadDisponible: 4, estadoActual: 'Disponible' })
  })

  it('una devolución a tiempo lo indica en la confirmación', async () => {
    const { user, repo } = renderApp('/returns', { role: 'Técnico_Laboratorio', prepare: addOnTimeLoan })
    await user.click(screen.getByRole('button', { name: /^Registrar devolución: Juego de destornilladores/ }))
    await user.click(within(dialog()).getByRole('button', { name: 'Confirmar devolución' }))

    expect(await screen.findByText(/Devuelto a tiempo\./)).toBeInTheDocument()
    expect(loansOf(repo).find((l) => l.idPrestamo === 'a-tiempo')?.retrasoHoras).toBe(0)
  })

  it('devolver Dañado manda el recurso a mantenimiento y lo avisa (Req 13.9)', async () => {
    const { user, repo } = renderApp('/returns', { role: 'Técnico_Laboratorio' })
    await user.click(screen.getByRole('button', { name: /^Registrar devolución:/ }))
    await user.selectOptions(within(dialog()).getByLabelText(/^Condición del recurso/), 'Dañado')
    // En la devolución las observaciones son opcionales (el Req 12.8 aplica a la entrega).
    await user.click(within(dialog()).getByRole('button', { name: 'Confirmar devolución' }))

    expect(await screen.findByText(/El recurso pasó a mantenimiento\./)).toBeInTheDocument()
    expect(resourceOf(repo, 'r-0003')?.estadoActual).toBe('En_Mantenimiento')
  })
})

describe('ciclo completo del técnico: entrega → devolución', () => {
  it('entrega una reserva y la devuelve desde la otra pantalla', async () => {
    const { user, repo } = renderApp('/deliveries', {
      role: 'Técnico_Laboratorio',
      prepare: (store) =>
        addLoan(store, {
          idPrestamo: 'ciclo',
          idRecurso: 'r-0004',
          fechaHoraInicioProgramada: '2026-01-25T08:00:00.000Z',
          fechaHoraFinProgramada: new Date(Date.now() + 2 * HOUR).toISOString(),
        }),
    })

    // 1) Entrega
    await user.click(
      screen.getByRole('button', { name: /^Registrar entrega: Juego de destornilladores/ }),
    )
    await user.click(screen.getByRole('button', { name: 'Confirmar entrega' }))
    await screen.findByText(/Entrega registrada: Juego de destornilladores/)
    expect(loansOf(repo).find((l) => l.idPrestamo === 'ciclo')?.estadoPrestamo).toBe('En_Préstamo')

    // 2) Navega a Devoluciones desde el menú
    fireEvent.click(screen.getByRole('link', { name: 'Devoluciones', hidden: true }))
    await screen.findByRole('heading', { level: 1, name: 'Devoluciones' })
    expect(cardTitles()).toContain('Juego de destornilladores de precisión')

    // 3) Devolución a tiempo
    await user.click(
      screen.getByRole('button', { name: /^Registrar devolución: Juego de destornilladores/ }),
    )
    await user.click(screen.getByRole('button', { name: 'Confirmar devolución' }))
    await screen.findByText(/Devolución registrada: Juego de destornilladores/)
    expect(loansOf(repo).find((l) => l.idPrestamo === 'ciclo')?.estadoPrestamo).toBe('Devuelto')
  })
})
