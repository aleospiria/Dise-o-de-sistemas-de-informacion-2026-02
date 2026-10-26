import { fireEvent, screen, waitFor, within } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { validateLoanForm } from '@/features/loans/validation'
import type { LoanFormValues } from '@/features/loans/types'
import type { InMemoryStorageRepository } from '@/services/storage'
import { LS_KEYS } from '@/shared/constants/lsKeys'
import { VALIDATION_MESSAGES as M } from '@/shared/constants/messages'
import type { Loan, Resource } from '@/shared/types'
import { toDateInputValue } from '@/shared/utils/dateUtils'
import { renderApp } from '@/test/renderApp'

const MOTIVO = 'Práctica de laboratorio de circuitos.'

function daysFromNow(days: number): Date {
  const date = new Date()
  date.setDate(date.getDate() + days)
  return date
}

const TOMORROW_PLUS = toDateInputValue(daysFromNow(2))
const YESTERDAY = toDateInputValue(daysFromNow(-1))

const valid: LoanFormValues = {
  fecha: TOMORROW_PLUS,
  horaInicio: '10:00',
  horaFin: '12:00',
  motivo: MOTIVO,
}

describe('validación pura del formulario de préstamo', () => {
  it('acepta un préstamo válido', () => {
    expect(validateLoanForm(valid)).toEqual({})
  })

  it('exige fecha, horas y motivo', () => {
    expect(validateLoanForm({ fecha: '', horaInicio: '', horaFin: '', motivo: '' })).toEqual({
      fecha: M.required,
      horaInicio: M.required,
      horaFin: M.required,
      motivo: M.required,
    })
  })

  it('rechaza un inicio en el pasado y lo atribuye a la fecha (Req 8.3)', () => {
    const errors = validateLoanForm({ ...valid, fecha: YESTERDAY })
    expect(errors.fecha).toMatch(/pasado/)
    expect(errors.horaFin).toBeUndefined()
  })

  it('rechaza menos de 1 hora, o un fin anterior al inicio, y lo atribuye a la hora de fin (Req 8.4)', () => {
    expect(validateLoanForm({ ...valid, horaFin: '10:30' }).horaFin).toMatch(/1 hora/)
    expect(validateLoanForm({ ...valid, horaInicio: '12:00', horaFin: '10:00' }).horaFin).toBeDefined()
  })

  it('acepta exactamente 1 hora y rechaza motivos fuera de 10–500 caracteres (Req 8.6)', () => {
    expect(validateLoanForm({ ...valid, horaFin: '11:00' })).toEqual({})
    expect(validateLoanForm({ ...valid, motivo: 'corto' }).motivo).toMatch(/entre 10 y 500/)
    expect(validateLoanForm({ ...valid, motivo: 'x'.repeat(501) }).motivo).toMatch(/entre 10 y 500/)
    expect(validateLoanForm({ ...valid, motivo: 'x'.repeat(500) })).toEqual({})
  })

  it('no evalúa los tiempos mientras falte alguno de los campos', () => {
    const errors = validateLoanForm({ ...valid, horaFin: '' })
    expect(errors).toEqual({ horaFin: M.required })
  })
})

describe('formulario de solicitud de préstamo', () => {
  const field = {
    fecha: () => screen.getByLabelText(/^Fecha/),
    inicio: () => screen.getByLabelText(/^Hora de inicio/),
    fin: () => screen.getByLabelText(/^Hora de fin/),
    motivo: () => screen.getByLabelText(/^Motivo del préstamo/),
  }
  const submit = () => screen.getByRole('button', { name: 'Confirmar reserva' })

  function fill(values: Partial<LoanFormValues> = {}) {
    const v = { ...valid, ...values }
    fireEvent.change(field.fecha(), { target: { value: v.fecha } })
    fireEvent.change(field.inicio(), { target: { value: v.horaInicio } })
    fireEvent.change(field.fin(), { target: { value: v.horaFin } })
    fireEvent.change(field.motivo(), { target: { value: v.motivo } })
  }

  it('muestra el recurso y el formulario, con el título de la página (Req 8.2)', () => {
    renderApp('/loans/new/r-0002', { role: 'Estudiante' })
    expect(screen.getByRole('heading', { level: 1, name: 'Solicitar préstamo' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { level: 2, name: 'Multímetro Fluke 117' })).toBeInTheDocument()
    expect(screen.getByText(/5 de 5 disponibles/)).toBeInTheDocument()
    expect(field.fecha()).toHaveValue(toDateInputValue())
    expect(screen.getByRole('link', { name: 'Cancelar' })).toHaveAttribute('href', '/availability')
  })

  it('enviar vacío marca los campos requeridos y no crea la reserva', async () => {
    const { user, repo, pathname } = renderApp('/loans/new/r-0002', { role: 'Estudiante' })
    await user.click(submit())

    // La fecha viene precargada; faltan las dos horas y el motivo.
    expect(await screen.findAllByText(M.required)).toHaveLength(3)
    expect(submit()).toBeDisabled()
    expect(pathname()).toBe('/loans/new/r-0002')
    expect(repo.get<Loan[]>(LS_KEYS.LOANS)).toHaveLength(5)
  })

  it('muestra el error de duración mínima junto a la hora de fin (Req 8.4)', async () => {
    const { user } = renderApp('/loans/new/r-0002', { role: 'Estudiante' })
    fill({ horaFin: '10:30' })
    await user.click(submit())
    expect(await screen.findByText('La duración mínima del préstamo es de 1 hora.')).toBeInTheDocument()
    expect(field.fin()).toHaveAttribute('aria-invalid', 'true')
  })

  it('muestra el error de fecha pasada junto a la fecha (Req 8.3)', async () => {
    const { user } = renderApp('/loans/new/r-0002', { role: 'Estudiante' })
    fill({ fecha: YESTERDAY })
    await user.click(submit())
    expect(await screen.findByText('La fecha de inicio no puede estar en el pasado.')).toBeInTheDocument()
    expect(field.fecha()).toHaveAttribute('aria-invalid', 'true')
  })

  it('valida el motivo y muestra el contador de caracteres (Req 17.9)', async () => {
    const { user } = renderApp('/loans/new/r-0002', { role: 'Estudiante' })
    expect(screen.getByText('0/500')).toBeInTheDocument()
    fill({ motivo: 'corto' })
    await user.click(submit())
    expect(await screen.findByText(/entre 10 y 500 caracteres/)).toBeInTheDocument()
  })

  it('una reserva válida queda en estado Reservado, descuenta stock y lleva a Mis préstamos (Req 8.7, 8.9, 8.11)', async () => {
    const { user, repo, pathname } = renderApp('/loans/new/r-0002', { role: 'Estudiante' })
    fill()
    await user.click(submit())

    await waitFor(() => expect(pathname()).toBe('/loans/my'))
    expect(await screen.findByText('Reserva creada. Quedó en estado "Reservado".')).toBeInTheDocument()

    const loans = repo.get<Loan[]>(LS_KEYS.LOANS) ?? []
    const creado = loans.find((l) => l.motivoPrestamo === MOTIVO)
    expect(creado?.estadoPrestamo).toBe('Reservado')
    expect(creado?.idUsuario).toBe('u-estudiante-0001')

    const recursos = repo.get<Resource[]>(LS_KEYS.RESOURCES) ?? []
    expect(recursos.find((r) => r.idRecurso === 'r-0002')?.cantidadDisponible).toBe(4)
  })

  it('un horario ya ocupado muestra el error del servicio y no crea la reserva (Req 8.8)', async () => {
    const start = new Date(`${TOMORROW_PLUS}T10:00`)
    const end = new Date(`${TOMORROW_PLUS}T12:00`)
    const { user, repo, pathname } = renderApp('/loans/new/r-0001', {
      role: 'Estudiante',
      prepare: (store: InMemoryStorageRepository) => {
        // r-0001 sigue "Disponible", pero sus 3 unidades están ocupadas en ese horario.
        const existentes = store.get<Loan[]>(LS_KEYS.LOANS) ?? []
        const ocupadas: Loan[] = Array.from({ length: 3 }, (_, i) => ({
          idPrestamo: `ocupado-${i}`,
          idUsuario: 'otro',
          idRecurso: 'r-0001',
          fechaHoraReserva: new Date().toISOString(),
          fechaHoraInicioProgramada: start.toISOString(),
          fechaHoraFinProgramada: end.toISOString(),
          estadoPrestamo: 'Reservado',
          motivoPrestamo: MOTIVO,
        }))
        store.set(LS_KEYS.LOANS, [...existentes, ...ocupadas])
      },
    })
    const antes = (repo.get<Loan[]>(LS_KEYS.LOANS) ?? []).length

    fill()
    await user.click(submit())

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'El recurso no está disponible en el horario seleccionado.',
    )
    expect(pathname()).toBe('/loans/new/r-0001')
    expect(repo.get<Loan[]>(LS_KEYS.LOANS)).toHaveLength(antes)
    // El error del servicio no bloquea el botón: se puede probar otro horario.
    expect(submit()).toBeEnabled()
  })

  it('un recurso inexistente muestra un error y un enlace de regreso', () => {
    renderApp('/loans/new/no-existe', { role: 'Estudiante' })
    expect(screen.getByRole('alert')).toHaveTextContent('No encontramos el recurso')
    expect(screen.getByRole('link', { name: 'Volver a disponibilidad' })).toHaveAttribute('href', '/availability')
    expect(screen.queryByRole('button', { name: 'Confirmar reserva' })).not.toBeInTheDocument()
  })

  it('un recurso sin disponibilidad no muestra el formulario', () => {
    // r-0007 está en mantenimiento.
    renderApp('/loans/new/r-0007', { role: 'Estudiante' })
    expect(screen.getByRole('status')).toHaveTextContent('no está disponible para préstamo')
    expect(screen.queryByRole('button', { name: 'Confirmar reserva' })).not.toBeInTheDocument()
  })
})

describe('Mis préstamos', () => {
  const titles = () => screen.getAllByRole('heading', { level: 2 }).map((h) => h.textContent)

  it('lista solo los préstamos del usuario, del más reciente al más antiguo (Req 8.11)', () => {
    renderApp('/loans/my', {
      role: 'Estudiante',
      prepare: (store) => {
        const existentes = store.get<Loan[]>(LS_KEYS.LOANS) ?? []
        store.set(LS_KEYS.LOANS, [
          ...existentes,
          {
            idPrestamo: 'ajeno',
            idUsuario: 'u-otro',
            idRecurso: 'r-0008',
            fechaHoraReserva: '2026-03-01T00:00:00.000Z',
            fechaHoraInicioProgramada: '2026-03-02T10:00:00.000Z',
            fechaHoraFinProgramada: '2026-03-02T12:00:00.000Z',
            estadoPrestamo: 'Reservado',
            motivoPrestamo: 'Préstamo de otra persona',
          },
        ])
      },
    })
    expect(screen.getByRole('heading', { level: 1, name: 'Mis préstamos' })).toBeInTheDocument()
    expect(titles()).toEqual([
      'Multímetro Fluke 117', // p-0005, 10 feb
      'Osciloscopio Tektronix TBS1052', // p-0001, 5 feb
      'Cautín de estación Hakko FX-888D', // p-0002, 3 feb
      'Protoboard 830 puntos', // p-0003, 21 ene
      'Fuente de poder regulable 0-30V', // p-0004, 19 ene
    ])
    expect(screen.queryByText('Préstamo de otra persona')).not.toBeInTheDocument()
  })

  it('cada tarjeta muestra estado, horario y motivo', () => {
    renderApp('/loans/my', { role: 'Estudiante' })
    const tarjeta = screen
      .getByRole('heading', { level: 2, name: 'Osciloscopio Tektronix TBS1052' })
      .closest('article')!
    expect(within(tarjeta).getByText('Reservado')).toBeInTheDocument()
    expect(within(tarjeta).getByText('Práctica de laboratorio de señales analógicas.')).toBeInTheDocument()
    expect(within(tarjeta).getByText('Horario')).toBeInTheDocument()

    expect(screen.getByText('Cancelado')).toBeInTheDocument()
    expect(screen.getByText('En préstamo')).toBeInTheDocument()
    expect(screen.getAllByText('Devuelto')).toHaveLength(2)
  })

  it('sin préstamos muestra un estado vacío con acceso a la búsqueda', () => {
    renderApp('/loans/my', {
      role: 'Estudiante',
      prepare: (store) => store.set(LS_KEYS.LOANS, []),
    })
    expect(screen.getByText('Todavía no tienes préstamos.')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Buscar un recurso' })).toHaveAttribute('href', '/availability')
  })

  it('un préstamo de un recurso que ya no existe usa un nombre genérico', () => {
    renderApp('/loans/my', {
      role: 'Estudiante',
      prepare: (store) => {
        const recursos = store.get<Resource[]>(LS_KEYS.RESOURCES) ?? []
        store.set(
          LS_KEYS.RESOURCES,
          recursos.filter((r) => r.idRecurso !== 'r-0002'),
        )
      },
    })
    expect(titles()).toContain('Recurso no disponible')
  })
})

describe('flujo completo: disponibilidad → solicitud → mis préstamos', () => {
  it('el estudiante reserva un recurso y lo ve en su lista como Reservado', async () => {
    const { user, pathname, repo } = renderApp('/availability', { role: 'Estudiante' })

    await user.click(
      screen.getByRole('button', { name: 'Solicitar préstamo de Protoboard 830 puntos' }),
    )
    expect(pathname()).toBe('/loans/new/r-0005')

    fireEvent.change(screen.getByLabelText(/^Fecha/), { target: { value: TOMORROW_PLUS } })
    fireEvent.change(screen.getByLabelText(/^Hora de inicio/), { target: { value: '08:00' } })
    fireEvent.change(screen.getByLabelText(/^Hora de fin/), { target: { value: '10:00' } })
    fireEvent.change(screen.getByLabelText(/^Motivo del préstamo/), {
      target: { value: 'Montaje de un amplificador para el proyecto final.' },
    })
    await user.click(screen.getByRole('button', { name: 'Confirmar reserva' }))

    await waitFor(() => expect(pathname()).toBe('/loans/my'))
    // La URL cambia antes de que se pinte la página nueva: se espera su título.
    await screen.findByRole('heading', { level: 1, name: 'Mis préstamos' })
    // Es el más reciente por fecha de inicio: aparece primero.
    const primera = screen.getAllByRole('heading', { level: 2 })[0]
    expect(primera).toHaveTextContent('Protoboard 830 puntos')
    const tarjeta = primera.closest('article')!
    expect(within(tarjeta).getByText('Reservado')).toBeInTheDocument()
    expect(within(tarjeta).getByText('Montaje de un amplificador para el proyecto final.')).toBeInTheDocument()

    const recursos = repo.get<Resource[]>(LS_KEYS.RESOURCES) ?? []
    expect(recursos.find((r) => r.idRecurso === 'r-0005')?.cantidadDisponible).toBe(17)
  })
})
