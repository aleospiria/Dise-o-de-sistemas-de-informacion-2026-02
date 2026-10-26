import { screen, waitFor, within } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import {
  getActiveLoans,
  summarizeInventory,
  summarizeLoans,
} from '@/features/dashboard/summaries'
import type { InventorySummary } from '@/features/dashboard/summaries'
import { LS_KEYS } from '@/shared/constants/lsKeys'
import type { Loan, Resource } from '@/shared/types'
import { renderApp } from '@/test/renderApp'

function resource(partial: Partial<Resource>): Resource {
  return {
    idRecurso: 'r',
    nombre: 'Recurso',
    codigoInventario: 'X',
    tipo: 'Equipo',
    descripcion: '',
    cantidadTotal: 2,
    cantidadDisponible: 2,
    estadoActual: 'Disponible',
    fechaCreacion: '2026-01-01T00:00:00.000Z',
    ...partial,
  }
}

function loan(estadoPrestamo: Loan['estadoPrestamo'], id: string = estadoPrestamo): Loan {
  return {
    idPrestamo: id,
    idUsuario: 'u',
    idRecurso: 'r',
    fechaHoraReserva: '2026-01-01T00:00:00.000Z',
    fechaHoraInicioProgramada: '2026-01-02T10:00:00.000Z',
    fechaHoraFinProgramada: '2026-01-02T12:00:00.000Z',
    estadoPrestamo,
    motivoPrestamo: 'Práctica de laboratorio',
  }
}

/**
 * Valor numérico del contador con esa etiqueta. Solo busca entre los
 * contadores (`label` con su `value`), así no confunde la etiqueta "En
 * préstamo" con la insignia de estado de una tarjeta de préstamo.
 */
function stat(label: string): number {
  const labelEl = screen
    .getAllByText(label)
    .find((el) => el.nextElementSibling && /^\d+$/.test(el.nextElementSibling.textContent ?? ''))
  if (!labelEl) throw new Error(`No hay un contador con la etiqueta "${label}".`)
  return Number(labelEl.nextElementSibling?.textContent)
}

/** Enlace "Inicio" del menú lateral (hay otro, el de marca, en el encabezado). */
function goHome() {
  const menu = document.getElementById('app-nav') as HTMLElement
  return within(menu).getByRole('link', { name: 'Inicio', hidden: true })
}

describe('resúmenes puros', () => {
  it('summarizeInventory cuenta en servicio, disponibles, mantenimiento y bajas', () => {
    const resumen: InventorySummary = summarizeInventory([
      resource({ idRecurso: '1' }),
      resource({ idRecurso: '2', cantidadDisponible: 0, estadoActual: 'Reservado' }),
      resource({ idRecurso: '3', estadoActual: 'En_Mantenimiento' }),
      resource({ idRecurso: '4', estadoActual: 'Dado_de_Baja' }),
    ])
    expect(resumen).toEqual({ total: 3, available: 1, inMaintenance: 1, retired: 1 })
  })

  it('un recurso Disponible sin unidades libres no cuenta como disponible', () => {
    expect(
      summarizeInventory([resource({ cantidadDisponible: 0 })]).available,
    ).toBe(0)
  })

  it('un inventario vacío da todo en cero', () => {
    expect(summarizeInventory([])).toEqual({ total: 0, available: 0, inMaintenance: 0, retired: 0 })
  })

  it('summarizeLoans cuenta reservados y en curso, e ignora los cerrados', () => {
    const resumen = summarizeLoans([
      loan('Reservado', 'a'),
      loan('Reservado', 'b'),
      loan('En_Préstamo'),
      loan('Devuelto'),
      loan('Cancelado'),
      loan('Vencido'),
    ])
    expect(resumen).toEqual({ reserved: 2, inProgress: 1, active: 3 })
  })

  it('getActiveLoans conserva el orden recibido', () => {
    const activos = getActiveLoans([loan('Devuelto'), loan('En_Préstamo'), loan('Reservado')])
    expect(activos.map((l) => l.estadoPrestamo)).toEqual(['En_Préstamo', 'Reservado'])
  })
})

describe('panel del estudiante', () => {
  it('saluda, muestra sus contadores y sus préstamos activos (más reciente primero)', () => {
    renderApp('/dashboard', { role: 'Estudiante' })
    expect(screen.getByRole('heading', { level: 1, name: 'Inicio' })).toBeInTheDocument()
    expect(screen.getByText('Hola, Elena Estudiante.')).toBeInTheDocument()

    expect(stat('Reservados')).toBe(1)
    expect(stat('En préstamo')).toBe(1)

    const seccion = screen.getByRole('region', { name: 'Tus préstamos activos' })
    // Los títulos de las tarjetas (excluye el h2 de la propia sección).
    expect(
      within(seccion)
        .getAllByRole('article')
        .map((tarjeta) => within(tarjeta).getByRole('heading', { level: 2 }).textContent),
    ).toEqual(['Osciloscopio Tektronix TBS1052', 'Cautín de estación Hakko FX-888D'])
  })

  it('no muestra los préstamos cerrados (devueltos o cancelados)', () => {
    renderApp('/dashboard', { role: 'Estudiante' })
    expect(screen.queryByText('Protoboard 830 puntos')).not.toBeInTheDocument()
    expect(screen.queryByText('Fuente de poder regulable 0-30V')).not.toBeInTheDocument()
  })

  it('limita a 3 los préstamos activos mostrados', () => {
    renderApp('/dashboard', {
      role: 'Estudiante',
      prepare: (repo) => {
        const extra: Loan[] = ['a', 'b', 'c'].map((id, i) => ({
          ...loan('Reservado', id),
          idUsuario: 'u-estudiante-0001',
          idRecurso: 'r-0004',
          fechaHoraInicioProgramada: `2026-03-0${i + 1}T10:00:00.000Z`,
          fechaHoraFinProgramada: `2026-03-0${i + 1}T12:00:00.000Z`,
        }))
        repo.set(LS_KEYS.LOANS, [...(repo.get<Loan[]>(LS_KEYS.LOANS) ?? []), ...extra])
      },
    })
    const seccion = screen.getByRole('region', { name: 'Tus préstamos activos' })
    expect(within(seccion).getAllByRole('article')).toHaveLength(3)
    expect(stat('Reservados')).toBe(4)
  })

  it('sin préstamos activos lo dice y sigue ofreciendo buscar un recurso', () => {
    renderApp('/dashboard', {
      role: 'Estudiante',
      prepare: (repo) => repo.set(LS_KEYS.LOANS, []),
    })
    expect(screen.getByText('No tienes préstamos activos.')).toBeInTheDocument()
    expect(stat('Reservados')).toBe(0)
    expect(screen.getByRole('link', { name: 'Buscar un recurso' })).toHaveAttribute('href', '/availability')
  })

  it('el enlace "Ver todos mis préstamos" lleva a su lista', async () => {
    const { user, pathname } = renderApp('/dashboard', { role: 'Estudiante' })
    await user.click(screen.getByRole('link', { name: 'Ver todos mis préstamos' }))
    expect(pathname()).toBe('/loans/my')
  })
})

describe('panel del técnico', () => {
  it('muestra los contadores de entregas, devoluciones y retrasos con datos semilla', () => {
    renderApp('/dashboard', { role: 'Técnico_Laboratorio' })
    expect(screen.getByText('Hola, Tomás Técnico.')).toBeInTheDocument()
    expect(stat('Entregas pendientes')).toBe(1)
    expect(stat('Devoluciones pendientes')).toBe(1)
    expect(stat('Devoluciones con retraso')).toBe(1)
  })

  it('cada contador enlaza a su pantalla', () => {
    renderApp('/dashboard', { role: 'Técnico_Laboratorio' })
    expect(screen.getByText('Entregas pendientes').closest('a')).toHaveAttribute('href', '/deliveries')
    expect(screen.getByText('Devoluciones pendientes').closest('a')).toHaveAttribute('href', '/returns')
  })

  it('no ve contadores de inventario ni los préstamos del estudiante', () => {
    renderApp('/dashboard', { role: 'Técnico_Laboratorio' })
    expect(screen.queryByText('Recursos en servicio')).not.toBeInTheDocument()
    expect(screen.queryByText('Tus préstamos activos')).not.toBeInTheDocument()
  })

  it('los contadores se actualizan tras registrar una entrega y una devolución', async () => {
    const { user } = renderApp('/dashboard', { role: 'Técnico_Laboratorio' })

    // Entrega: 1 pendiente → 0, y la devolución pendiente pasa de 1 a 2.
    await user.click(screen.getByRole('link', { name: 'Registrar entregas' }))
    await screen.findByRole('heading', { level: 1, name: 'Entregas' })
    await user.click(screen.getByRole('button', { name: /^Registrar entrega:/ }))
    await user.click(screen.getByRole('button', { name: 'Confirmar entrega' }))
    await screen.findByText(/Entrega registrada/)

    await user.click(goHome())
    await screen.findByText('Hola, Tomás Técnico.')
    expect(stat('Entregas pendientes')).toBe(0)
    expect(stat('Devoluciones pendientes')).toBe(2)

    // Los dos préstamos en curso están vencidos (sus fines son de febrero), también
    // el osciloscopio recién entregado. Devolver el cautín deja 1 pendiente y 1 con retraso.
    expect(stat('Devoluciones con retraso')).toBe(2)

    await user.click(screen.getByRole('link', { name: 'Registrar devoluciones' }))
    await screen.findByRole('heading', { level: 1, name: 'Devoluciones' })
    await user.click(screen.getByRole('button', { name: /^Registrar devolución: Cautín/ }))
    await user.click(screen.getByRole('button', { name: 'Confirmar devolución' }))
    await screen.findByText(/Devolución registrada/)

    await user.click(goHome())
    await screen.findByText('Hola, Tomás Técnico.')
    expect(stat('Devoluciones pendientes')).toBe(1)
    expect(stat('Devoluciones con retraso')).toBe(1)
  })
})

describe('panel del administrador', () => {
  it('resume el inventario y los préstamos activos con datos semilla', () => {
    renderApp('/dashboard', { role: 'Administrador_Laboratorio' })
    expect(screen.getByText('Hola, Ana Admin.')).toBeInTheDocument()
    expect(stat('Recursos en servicio')).toBe(8)
    expect(stat('Disponibles')).toBe(7)
    expect(stat('En mantenimiento')).toBe(1)
    expect(stat('Préstamos activos')).toBe(2)
    expect(stat('Reservados')).toBe(1)
    expect(stat('En préstamo')).toBe(1)
  })

  it('ofrece accesos rápidos al inventario y a las operaciones', () => {
    renderApp('/dashboard', { role: 'Administrador_Laboratorio' })
    expect(screen.getByRole('link', { name: 'Nuevo recurso' })).toHaveAttribute('href', '/inventory/new')
    expect(screen.getByRole('link', { name: 'Ver inventario' })).toHaveAttribute('href', '/inventory')
    expect(screen.getByRole('link', { name: 'Entregas' })).toHaveAttribute('href', '/deliveries')
    expect(screen.getByRole('link', { name: 'Devoluciones' })).toHaveAttribute('href', '/returns')
  })

  it('un recurso dado de baja deja de contar como "en servicio"', async () => {
    const { user } = renderApp('/inventory', { role: 'Administrador_Laboratorio' })
    await user.click(screen.getByRole('button', { name: 'Dar de baja Kit de resistencias surtidas' }))
    await user.click(
      within(screen.getByRole('dialog')).getByRole('button', { name: 'Dar de baja' }),
    )
    await screen.findByText(/fue dado de baja/)

    await user.click(goHome())
    await screen.findByText('Hola, Ana Admin.')
    expect(stat('Recursos en servicio')).toBe(7)
    expect(stat('Disponibles')).toBe(6)
  })
})

describe('cada rol ve solo su panel', () => {
  it.each([
    ['Estudiante', 'Tus préstamos activos', 'Recursos en servicio'],
    ['Técnico_Laboratorio', 'Entregas pendientes', 'Tus préstamos activos'],
    ['Administrador_Laboratorio', 'Recursos en servicio', 'Entregas pendientes'],
  ] as const)('%s ve "%s" y no ve "%s"', (role, visible, hidden) => {
    renderApp('/dashboard', { role })
    expect(screen.getByText(visible)).toBeInTheDocument()
    expect(screen.queryByText(hidden)).not.toBeInTheDocument()
  })

  it('no queda ninguna pantalla provisional', async () => {
    const { pathname } = renderApp('/dashboard', { role: 'Estudiante' })
    await waitFor(() => expect(pathname()).toBe('/dashboard'))
    expect(screen.queryByText(/Pantalla pendiente/)).not.toBeInTheDocument()
  })
})
