import { fireEvent, screen, waitFor, within } from '@testing-library/react'
import { beforeEach, describe, expect, it } from 'vitest'
import { validateResourceForm } from '@/features/inventory/validation'
import type { ResourceFormValues } from '@/features/inventory/types'
import { createLoan } from '@/services/mockDb/loans.service'
import {
  getResourceById,
  retireResource,
  updateResource,
} from '@/services/mockDb/resources.service'
import { seedData } from '@/services/mockDb/seed-data'
import { InMemoryStorageRepository } from '@/services/storage'
import { LS_KEYS } from '@/shared/constants/lsKeys'
import { VALIDATION_MESSAGES as M } from '@/shared/constants/messages'
import type { Resource } from '@/shared/types'
import { MAX_IMAGE_BYTES, validateImageFile } from '@/shared/utils/imageUtils'
import { renderApp } from '@/test/renderApp'

const MOTIVO = 'Práctica de laboratorio de circuitos.'

const resourcesOf = (repo: InMemoryStorageRepository) =>
  repo.get<Resource[]>(LS_KEYS.RESOURCES) ?? []
const rowOf = (name: RegExp | string) => screen.getByRole('row', { name })

describe('servicio: editar la cantidad total de un recurso', () => {
  let repo: InMemoryStorageRepository

  beforeEach(() => {
    repo = new InMemoryStorageRepository()
    seedData(repo)
  })

  it('subir el total aumenta el stock libre conservando las unidades en uso', () => {
    // r-0001: 3 en total, 2 libres, 1 en uso
    const result = updateResource('r-0001', { cantidadTotal: 5 }, repo)
    expect(result.success).toBe(true)
    expect(result.data).toMatchObject({ cantidadTotal: 5, cantidadDisponible: 4 })
  })

  it('bajar el total reduce el stock libre sin dejar "más libres que totales"', () => {
    // r-0003: 4 en total, 3 libres, 1 en uso
    const result = updateResource('r-0003', { cantidadTotal: 2 }, repo)
    expect(result.data).toMatchObject({ cantidadTotal: 2, cantidadDisponible: 1 })
  })

  it('no permite bajar el total por debajo de las unidades en uso', () => {
    // r-0005: 20 en total, 18 libres, 2 en uso
    const result = updateResource('r-0005', { cantidadTotal: 1 }, repo)
    expect(result.success).toBe(false)
    expect(result.error).toMatch(/hay 2 unidades en uso/)
    expect(getResourceById('r-0005', repo)?.cantidadTotal).toBe(20)
  })

  it('si no quedan unidades libres, el recurso pasa a Reservado (no se puede reservar)', () => {
    // r-0001 con 1 en uso: total 1 → 0 libres
    const result = updateResource('r-0001', { cantidadTotal: 1 }, repo)
    expect(result.data).toMatchObject({ cantidadDisponible: 0, estadoActual: 'Reservado' })
  })

  it('agregar unidades a un recurso agotado lo devuelve a Disponible', () => {
    const start = new Date(Date.now() + 48 * 3600_000).toISOString()
    const end = new Date(Date.now() + 50 * 3600_000).toISOString()
    // r-0008 tiene 1 sola unidad: al reservarla queda agotado y en "Reservado".
    createLoan(
      { idRecurso: 'r-0008', fechaHoraInicioProgramada: start, fechaHoraFinProgramada: end, motivoPrestamo: MOTIVO },
      'u-estudiante-0001',
      repo,
    )
    expect(getResourceById('r-0008', repo)?.estadoActual).toBe('Reservado')

    const result = updateResource('r-0008', { cantidadTotal: 3 }, repo)
    expect(result.data).toMatchObject({ cantidadDisponible: 2, estadoActual: 'Disponible' })
  })

  it('editar solo el nombre no toca la cantidad ni el estado', () => {
    const before = getResourceById('r-0002', repo)!
    const result = updateResource('r-0002', { nombre: '  Multímetro nuevo  ' }, repo)
    expect(result.data).toMatchObject({
      nombre: 'Multímetro nuevo',
      cantidadTotal: before.cantidadTotal,
      cantidadDisponible: before.cantidadDisponible,
      estadoActual: before.estadoActual,
    })
  })

  it('no permite editar un recurso dado de baja', () => {
    retireResource('r-0006', repo)
    const result = updateResource('r-0006', { nombre: 'Otro' }, repo)
    expect(result.success).toBe(false)
    expect(result.error).toMatch(/dado de baja/)
  })
})

describe('validación pura del formulario de recurso', () => {
  const valid: ResourceFormValues = {
    nombre: 'Generador de funciones',
    codigoInventario: 'EQ-GEN-001',
    tipo: 'Equipo',
    descripcion: 'Genera señales.',
    cantidadTotal: '2',
  }
  const rules = { minQuantity: 1 }

  it('acepta un recurso válido', () => {
    expect(validateResourceForm(valid, rules)).toEqual({})
  })

  it('exige nombre, código, tipo y cantidad', () => {
    expect(
      validateResourceForm({ nombre: '', codigoInventario: '', tipo: '', descripcion: '', cantidadTotal: '' }, rules),
    ).toEqual({
      nombre: M.required,
      codigoInventario: M.required,
      tipo: M.required,
      cantidadTotal: M.required,
    })
  })

  it('limita el nombre a 100 caracteres (Req 4.4)', () => {
    expect(validateResourceForm({ ...valid, nombre: 'a'.repeat(100) }, rules).nombre).toBeUndefined()
    expect(validateResourceForm({ ...valid, nombre: 'a'.repeat(101) }, rules).nombre).toMatch(/100/)
  })

  it('la cantidad debe ser un entero mayor que 0 (Req 4.5)', () => {
    for (const cantidad of ['0', '-3', '2.5', 'abc']) {
      expect(validateResourceForm({ ...valid, cantidadTotal: cantidad }, rules).cantidadTotal).toBe(
        'Ingresa un número entero mayor que 0.',
      )
    }
  })

  it('al editar, la cantidad no baja de las unidades en uso', () => {
    const errors = validateResourceForm({ ...valid, cantidadTotal: '1' }, { minQuantity: 2 })
    expect(errors.cantidadTotal).toMatch(/unidades en uso: la cantidad mínima es 2/)
    expect(validateResourceForm({ ...valid, cantidadTotal: '2' }, { minQuantity: 2 })).toEqual({})
  })

  it('limita la descripción a 500 caracteres', () => {
    expect(validateResourceForm({ ...valid, descripcion: 'x'.repeat(501) }, rules).descripcion).toMatch(/500/)
  })
})

describe('validación de la imagen (Req 4.11)', () => {
  const file = (type: string, size = 100) => {
    const f = new File(['x'], 'foto', { type })
    Object.defineProperty(f, 'size', { value: size })
    return f
  }

  it.each(['image/jpeg', 'image/png', 'image/webp'])('acepta %s', (type) => {
    expect(validateImageFile(file(type))).toBeUndefined()
  })

  it.each(['image/gif', 'application/pdf', 'text/plain'])('rechaza %s', (type) => {
    expect(validateImageFile(file(type))).toBe('La imagen debe ser JPG, PNG o WEBP.')
  })

  it('acepta exactamente 5 MB y rechaza un byte más', () => {
    expect(validateImageFile(file('image/png', MAX_IMAGE_BYTES))).toBeUndefined()
    expect(validateImageFile(file('image/png', MAX_IMAGE_BYTES + 1))).toBe(
      'La imagen no puede superar los 5 MB.',
    )
  })
})

describe('pantalla de inventario', () => {
  it('lista todos los recursos, también los que están en mantenimiento (Req 4.6)', () => {
    renderApp('/inventory', { role: 'Administrador_Laboratorio' })
    expect(screen.getByRole('heading', { level: 1, name: 'Inventario' })).toBeInTheDocument()
    // Cabecera + 8 recursos
    expect(screen.getAllByRole('row')).toHaveLength(9)
    expect(within(rowOf(/Fuente de poder regulable/)).getByText('En mantenimiento')).toBeInTheDocument()
    expect(screen.getByText('8 recursos registrados, 8 en servicio.')).toBeInTheDocument()
  })

  it('cada recurso en servicio ofrece Editar y Dar de baja con nombre accesible', () => {
    renderApp('/inventory', { role: 'Administrador_Laboratorio' })
    expect(screen.getByRole('link', { name: 'Editar Multímetro Fluke 117' })).toHaveAttribute(
      'href',
      '/inventory/r-0002/edit',
    )
    expect(screen.getByRole('button', { name: 'Dar de baja Multímetro Fluke 117' })).toBeInTheDocument()
  })

  it('el enlace "Nuevo recurso" lleva al formulario de alta', async () => {
    const { user, pathname } = renderApp('/inventory', { role: 'Administrador_Laboratorio' })
    await user.click(screen.getByRole('link', { name: 'Nuevo recurso' }))
    expect(pathname()).toBe('/inventory/new')
  })

  it('sin recursos muestra un estado vacío', () => {
    renderApp('/inventory', {
      role: 'Administrador_Laboratorio',
      prepare: (repo) => repo.set(LS_KEYS.RESOURCES, []),
    })
    expect(screen.getByText(/Todavía no hay recursos/)).toBeInTheDocument()
    expect(screen.queryByRole('table')).not.toBeInTheDocument()
  })

  describe('dar de baja (Req 4.9, 4.10)', () => {
    const dialog = () => screen.getByRole('dialog', { name: 'Dar de baja el recurso' })

    it('pide confirmación y Cancelar no hace nada', async () => {
      const { user, repo } = renderApp('/inventory', { role: 'Administrador_Laboratorio' })
      await user.click(screen.getByRole('button', { name: 'Dar de baja Kit de resistencias surtidas' }))
      expect(within(dialog()).getByText('Kit de resistencias surtidas')).toBeInTheDocument()
      expect(within(dialog()).getByRole('button', { name: 'Cancelar' })).toHaveFocus()

      await user.click(within(dialog()).getByRole('button', { name: 'Cancelar' }))
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
      expect(resourcesOf(repo).find((r) => r.idRecurso === 'r-0006')?.estadoActual).toBe('Disponible')
    })

    it('al confirmar, el recurso queda "Dado de baja", sin acciones, y se avisa', async () => {
      const { user, repo } = renderApp('/inventory', { role: 'Administrador_Laboratorio' })
      await user.click(screen.getByRole('button', { name: 'Dar de baja Kit de resistencias surtidas' }))
      await user.click(within(dialog()).getByRole('button', { name: 'Dar de baja' }))

      expect(await screen.findByText('"Kit de resistencias surtidas" fue dado de baja.')).toBeInTheDocument()
      expect(resourcesOf(repo).find((r) => r.idRecurso === 'r-0006')?.estadoActual).toBe('Dado_de_Baja')
      const fila = rowOf(/Kit de resistencias surtidas/)
      expect(within(fila).getByText('Dado de baja')).toBeInTheDocument()
      expect(within(fila).getByText('Sin acciones')).toBeInTheDocument()
    })

    it('un recurso con préstamos activos no se puede dar de baja y se muestra el motivo', async () => {
      const { user, repo } = renderApp('/inventory', { role: 'Administrador_Laboratorio' })
      // r-0001 tiene la reserva p-0001 activa.
      await user.click(screen.getByRole('button', { name: 'Dar de baja Osciloscopio Tektronix TBS1052' }))
      await user.click(within(dialog()).getByRole('button', { name: 'Dar de baja' }))

      expect(
        await screen.findByText('No se puede dar de baja: el recurso tiene préstamos activos.'),
      ).toBeInTheDocument()
      expect(resourcesOf(repo).find((r) => r.idRecurso === 'r-0001')?.estadoActual).toBe('Disponible')
      expect(screen.getByRole('button', { name: 'Dar de baja Osciloscopio Tektronix TBS1052' })).toBeInTheDocument()
    })
  })
})

describe('crear un recurso (Req 4.2–4.5)', () => {
  const f = {
    nombre: () => screen.getByLabelText(/^Nombre/),
    codigo: () => screen.getByLabelText(/^Código de inventario/),
    tipo: () => screen.getByLabelText(/^Tipo/),
    descripcion: () => screen.getByLabelText(/^Descripción/),
    cantidad: () => screen.getByLabelText(/^Cantidad total/),
    imagen: () => screen.getByLabelText(/^Imagen/),
  }
  const submit = () => screen.getByRole('button', { name: 'Crear recurso' })

  function fillValid() {
    fireEvent.change(f.nombre(), { target: { value: 'Generador de funciones' } })
    fireEvent.change(f.codigo(), { target: { value: 'EQ-GEN-001' } })
    fireEvent.change(f.tipo(), { target: { value: 'Equipo' } })
    fireEvent.change(f.descripcion(), { target: { value: 'Genera señales senoidales.' } })
    fireEvent.change(f.cantidad(), { target: { value: '3' } })
  }

  it('muestra el formulario con su título y el contador del nombre', () => {
    renderApp('/inventory/new', { role: 'Administrador_Laboratorio' })
    expect(screen.getByRole('heading', { level: 1, name: 'Nuevo recurso' })).toBeInTheDocument()
    expect(screen.getByText('0/100')).toBeInTheDocument()
    expect(f.imagen()).toHaveAttribute('accept', 'image/jpeg,image/png,image/webp')
  })

  it('enviar vacío marca los cuatro campos requeridos y no crea nada', async () => {
    const { user, repo, pathname } = renderApp('/inventory/new', { role: 'Administrador_Laboratorio' })
    await user.click(submit())

    expect(await screen.findAllByText(M.required)).toHaveLength(4)
    expect(submit()).toBeDisabled()
    expect(pathname()).toBe('/inventory/new')
    expect(resourcesOf(repo)).toHaveLength(8)
  })

  it('muestra el error de cantidad inválida (Req 4.5)', async () => {
    const { user } = renderApp('/inventory/new', { role: 'Administrador_Laboratorio' })
    fillValid()
    fireEvent.change(f.cantidad(), { target: { value: '0' } })
    await user.click(submit())
    expect(await screen.findByText('Ingresa un número entero mayor que 0.')).toBeInTheDocument()
  })

  it('un recurso válido se crea Disponible con todas sus unidades y vuelve al listado (Req 4.3)', async () => {
    const { user, repo, pathname } = renderApp('/inventory/new', { role: 'Administrador_Laboratorio' })
    fillValid()
    await user.click(submit())

    await waitFor(() => expect(pathname()).toBe('/inventory'))
    expect(await screen.findByText('Recurso "Generador de funciones" creado.')).toBeInTheDocument()
    const creado = resourcesOf(repo).find((r) => r.nombre === 'Generador de funciones')
    expect(creado).toMatchObject({
      estadoActual: 'Disponible',
      tipo: 'Equipo',
      cantidadTotal: 3,
      cantidadDisponible: 3,
      codigoInventario: 'EQ-GEN-001',
    })
    expect(within(rowOf(/Generador de funciones/)).getByText('Disponible')).toBeInTheDocument()
  })

  describe('imagen', () => {
    const png = () => new File(['contenido'], 'foto.png', { type: 'image/png' })

    it('una imagen válida muestra su vista previa y se guarda con el recurso', async () => {
      const { user, repo, pathname } = renderApp('/inventory/new', { role: 'Administrador_Laboratorio' })
      fillValid()
      fireEvent.change(f.imagen(), { target: { files: [png()] } })

      expect(await screen.findByAltText('Vista previa de la imagen del recurso')).toBeInTheDocument()
      await user.click(submit())
      await waitFor(() => expect(pathname()).toBe('/inventory'))
      const creado = resourcesOf(repo).find((r) => r.nombre === 'Generador de funciones')
      expect(creado?.imagenUrl).toMatch(/^data:image\/png;base64,/)
    })

    it('"Quitar imagen" elimina la vista previa', async () => {
      const { user } = renderApp('/inventory/new', { role: 'Administrador_Laboratorio' })
      fireEvent.change(f.imagen(), { target: { files: [png()] } })
      await screen.findByAltText('Vista previa de la imagen del recurso')

      await user.click(screen.getByRole('button', { name: 'Quitar imagen' }))
      expect(screen.queryByAltText('Vista previa de la imagen del recurso')).not.toBeInTheDocument()
    })

    it('rechaza un formato no permitido', async () => {
      renderApp('/inventory/new', { role: 'Administrador_Laboratorio' })
      fireEvent.change(f.imagen(), {
        target: { files: [new File(['x'], 'animada.gif', { type: 'image/gif' })] },
      })
      expect(await screen.findByText('La imagen debe ser JPG, PNG o WEBP.')).toBeInTheDocument()
      expect(screen.queryByAltText('Vista previa de la imagen del recurso')).not.toBeInTheDocument()
    })

    it('rechaza una imagen de más de 5 MB', async () => {
      renderApp('/inventory/new', { role: 'Administrador_Laboratorio' })
      const grande = png()
      Object.defineProperty(grande, 'size', { value: MAX_IMAGE_BYTES + 1 })
      fireEvent.change(f.imagen(), { target: { files: [grande] } })
      expect(await screen.findByText('La imagen no puede superar los 5 MB.')).toBeInTheDocument()
    })
  })
})

describe('editar un recurso (Req 4.7, 4.8)', () => {
  const nombre = () => screen.getByLabelText(/^Nombre/)
  const cantidad = () => screen.getByLabelText(/^Cantidad total/)
  const save = () => screen.getByRole('button', { name: 'Guardar cambios' })

  it('precarga los datos actuales del recurso', () => {
    renderApp('/inventory/r-0005/edit', { role: 'Administrador_Laboratorio' })
    expect(screen.getByRole('heading', { level: 1, name: 'Editar recurso' })).toBeInTheDocument()
    expect(nombre()).toHaveValue('Protoboard 830 puntos')
    expect(screen.getByLabelText(/^Código de inventario/)).toHaveValue('MA-PRO-001')
    expect(screen.getByLabelText(/^Tipo/)).toHaveValue('Material')
    expect(cantidad()).toHaveValue(20)
    // r-0005 tiene 2 unidades en uso
    expect(screen.getByText(/Hay 2 unidades en uso; no puedes bajar de 2/)).toBeInTheDocument()
    expect(cantidad()).toHaveAttribute('min', '2')
  })

  it('guardar cambios actualiza el recurso, avisa y vuelve al listado', async () => {
    const { user, repo, pathname } = renderApp('/inventory/r-0005/edit', { role: 'Administrador_Laboratorio' })
    fireEvent.change(nombre(), { target: { value: 'Protoboard 400 puntos' } })
    fireEvent.change(cantidad(), { target: { value: '25' } })
    await user.click(save())

    await waitFor(() => expect(pathname()).toBe('/inventory'))
    expect(await screen.findByText('Recurso "Protoboard 400 puntos" actualizado.')).toBeInTheDocument()
    expect(resourcesOf(repo).find((r) => r.idRecurso === 'r-0005')).toMatchObject({
      nombre: 'Protoboard 400 puntos',
      cantidadTotal: 25,
      cantidadDisponible: 23, // las 2 unidades en uso se conservan
    })
  })

  it('no deja bajar la cantidad por debajo de las unidades en uso', async () => {
    const { user, repo, pathname } = renderApp('/inventory/r-0005/edit', { role: 'Administrador_Laboratorio' })
    fireEvent.change(cantidad(), { target: { value: '1' } })
    await user.click(save())

    expect(await screen.findByText(/unidades en uso: la cantidad mínima es 2/)).toBeInTheDocument()
    expect(pathname()).toBe('/inventory/r-0005/edit')
    expect(resourcesOf(repo).find((r) => r.idRecurso === 'r-0005')?.cantidadTotal).toBe(20)
  })

  it('un recurso inexistente muestra un error y un enlace de regreso', () => {
    renderApp('/inventory/no-existe/edit', { role: 'Administrador_Laboratorio' })
    expect(screen.getByRole('alert')).toHaveTextContent('No encontramos el recurso')
    expect(screen.getByRole('link', { name: 'Volver al inventario' })).toHaveAttribute('href', '/inventory')
    expect(screen.queryByRole('button', { name: 'Guardar cambios' })).not.toBeInTheDocument()
  })

  it('un recurso dado de baja no se puede editar', () => {
    renderApp('/inventory/r-0006/edit', {
      role: 'Administrador_Laboratorio',
      prepare: (repo) => retireResource('r-0006', repo),
    })
    expect(screen.getByRole('status')).toHaveTextContent('está dado de baja y ya no se puede editar')
    expect(screen.queryByRole('button', { name: 'Guardar cambios' })).not.toBeInTheDocument()
  })
})

describe('acceso al inventario', () => {
  it.each(['Estudiante', 'Técnico_Laboratorio'] as const)('%s no puede entrar', (role) => {
    const { pathname } = renderApp('/inventory', { role })
    expect(pathname()).toBe('/access-denied')
  })
})
