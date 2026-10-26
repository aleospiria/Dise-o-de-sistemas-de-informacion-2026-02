import { beforeEach, describe, expect, it } from 'vitest'
import { InMemoryStorageRepository, type StorageRepository } from '@/services/storage'
import { LS_KEYS } from '@/shared/constants/lsKeys'
import { seedData } from '@/services/mockDb/seed-data'
import {
  getCurrentSession,
  loginUser,
  logoutUser,
  registerUser,
} from '@/services/mockDb/auth.service'
import {
  createResource,
  getResourceById,
  getResources,
  retireResource,
  updateResourceStatus,
} from '@/services/mockDb/resources.service'
import {
  checkAvailability,
  createLoan,
  getAvailableResources,
  getPendingDeliveries,
  getPendingReturns,
  registerDelivery,
  registerReturn,
} from '@/services/mockDb/loans.service'
import type { RegisterFormData, ResourceStatusHistory } from '@/shared/types'

const HOUR = 60 * 60 * 1000

/** Devuelve un rango futuro [inicio, fin] en ISO, desplazado `offsetH` horas. */
function slot(offsetH: number, durationH = 2): { start: string; end: string } {
  const start = Date.now() + offsetH * HOUR
  return {
    start: new Date(start).toISOString(),
    end: new Date(start + durationH * HOUR).toISOString(),
  }
}

const MOTIVO = 'Práctica de laboratorio de circuitos.'

let repo: InMemoryStorageRepository

beforeEach(() => {
  repo = new InMemoryStorageRepository()
  seedData(repo)
})

describe('auth.service', () => {
  const formBase: RegisterFormData = {
    nombre: 'Nuevo Usuario',
    correo: 'nuevo@itm.edu.co',
    contrasena: 'Clave1234',
    confirmacionContrasena: 'Clave1234',
    idRol: 'Estudiante',
    cedula: '123456',
  }

  it('registra un usuario válido', () => {
    const r = registerUser(formBase, repo)
    expect(r.success).toBe(true)
    expect(r.data?.correo).toBe('nuevo@itm.edu.co')
    // la contraseña se guarda hasheada, nunca en texto plano
    expect(r.data?.contrasena).not.toBe('Clave1234')
  })

  it('rechaza correo duplicado sin distinguir mayúsculas', () => {
    const r = registerUser({ ...formBase, correo: 'ADMIN@itm.edu.co' }, repo)
    expect(r.success).toBe(false)
    expect(r.error).toMatch(/ya está registrado/i)
  })

  it('rechaza contraseña débil y confirmación distinta', () => {
    expect(registerUser({ ...formBase, contrasena: 'abc', confirmacionContrasena: 'abc' }, repo).success).toBe(false)
    expect(registerUser({ ...formBase, confirmacionContrasena: 'Otra1234' }, repo).success).toBe(false)
  })

  it('login válido crea sesión con el rol correcto', () => {
    const r = loginUser('estudiante@itm.edu.co', 'Estudiante123', repo)
    expect(r.success).toBe(true)
    expect(r.data?.role).toBe('Estudiante')
    expect(getCurrentSession(repo)?.correo).toBe('estudiante@itm.edu.co')
  })

  it('login inválido da el mismo error genérico para correo o contraseña', () => {
    const badPass = loginUser('estudiante@itm.edu.co', 'Incorrecta1', repo)
    const badMail = loginUser('noexiste@itm.edu.co', 'Estudiante123', repo)
    expect(badPass.success).toBe(false)
    expect(badMail.success).toBe(false)
    expect(badPass.error).toBe(badMail.error)
  })

  it('logout elimina la sesión y una sesión expirada se limpia', () => {
    loginUser('admin@itm.edu.co', 'Admin123', repo)
    logoutUser(repo)
    expect(getCurrentSession(repo)).toBeNull()

    repo.set('sistema-prestamos-lab-session', {
      userId: 'x',
      role: 'Estudiante',
      nombre: 'x',
      correo: 'x@x.co',
      expiresAt: new Date(Date.now() - HOUR).toISOString(),
    })
    expect(getCurrentSession(repo)).toBeNull()
  })

  describe('cuando el almacenamiento lanza al escribir', () => {
    /** Lee del repositorio real, pero toda escritura o borrado lanza. */
    function failingRepo(): StorageRepository {
      return {
        get: repo.get.bind(repo),
        set: () => {
          throw new Error('Cuota excedida')
        },
        remove: () => {
          throw new Error('Almacenamiento bloqueado')
        },
      }
    }

    it('registerUser devuelve un error en lugar de lanzar y no guarda al usuario', () => {
      const antes = repo.get<unknown[]>(LS_KEYS.USERS)?.length
      const r = registerUser(formBase, failingRepo())
      expect(r.success).toBe(false)
      expect(r.data).toBeUndefined()
      expect(r.error).toMatch(/almacenamiento/i)
      expect(repo.get<unknown[]>(LS_KEYS.USERS)?.length).toBe(antes)
    })

    it('loginUser devuelve un error en lugar de lanzar y no crea sesión', () => {
      const r = loginUser('estudiante@itm.edu.co', 'Estudiante123', failingRepo())
      expect(r.success).toBe(false)
      expect(r.data).toBeUndefined()
      expect(r.error).toMatch(/almacenamiento/i)
      expect(getCurrentSession(repo)).toBeNull()
    })

    it('loginUser con credenciales inválidas sigue devolviendo el error genérico', () => {
      const conAlmacenamientoRoto = loginUser('estudiante@itm.edu.co', 'Incorrecta1', failingRepo())
      const conAlmacenamientoSano = loginUser('estudiante@itm.edu.co', 'Incorrecta1', repo)
      expect(conAlmacenamientoRoto.success).toBe(false)
      expect(conAlmacenamientoRoto.error).toBe(conAlmacenamientoSano.error)
    })

    it('logoutUser y la limpieza de una sesión expirada no lanzan', () => {
      const expirada = {
        userId: 'x',
        role: 'Estudiante',
        nombre: 'x',
        correo: 'x@x.co',
        expiresAt: new Date(Date.now() - HOUR).toISOString(),
      }
      repo.set(LS_KEYS.SESSION, expirada)
      expect(() => logoutUser(failingRepo())).not.toThrow()
      expect(getCurrentSession(failingRepo())).toBeNull()
    })
  })
})

describe('resources.service', () => {
  it('crea un recurso con estado inicial Disponible', () => {
    const r = createResource(
      {
        nombre: 'Generador de funciones',
        codigoInventario: 'EQ-GEN-001',
        tipo: 'Equipo',
        descripcion: 'Generador de señales.',
        cantidadTotal: 2,
      },
      repo,
    )
    expect(r.success).toBe(true)
    expect(r.data?.estadoActual).toBe('Disponible')
    expect(r.data?.cantidadDisponible).toBe(2)
  })

  it('rechaza nombre vacío y cantidad no válida', () => {
    const base = { codigoInventario: 'X', tipo: 'Equipo' as const, descripcion: '' }
    expect(createResource({ ...base, nombre: '  ', cantidadTotal: 1 }, repo).success).toBe(false)
    expect(createResource({ ...base, nombre: 'Ok', cantidadTotal: 0 }, repo).success).toBe(false)
  })

  it('rechaza dar de baja un recurso con préstamo activo', () => {
    // r-0001 tiene el préstamo p-0001 en estado Reservado
    const r = retireResource('r-0001', repo)
    expect(r.success).toBe(false)
    expect(r.error).toMatch(/préstamos activos/i)
  })

  it('da de baja un recurso sin préstamos activos y lo oculta del listado', () => {
    const r = retireResource('r-0006', repo)
    expect(r.success).toBe(true)
    expect(getResourceById('r-0006', repo)?.estadoActual).toBe('Dado_de_Baja')
    expect(getResources(undefined, repo).some((x) => x.idRecurso === 'r-0006')).toBe(false)
  })

  it('rechaza transiciones inválidas y registra historial en las válidas', () => {
    const bad = updateResourceStatus('r-0006', 'En_Préstamo', undefined, repo)
    expect(bad.success).toBe(false)

    const ok = updateResourceStatus('r-0006', 'En_Mantenimiento', 'Revisión', repo)
    expect(ok.success).toBe(true)
    const history = repo.get<unknown[]>('sistema-prestamos-lab-status-history') ?? []
    expect(history.length).toBe(2) // 1 del seed + 1 nuevo
  })

  it('la transición válida guarda en el historial el recurso, el nuevo estado, el motivo y la fecha (Req 22.9)', () => {
    const antes = Date.now()
    updateResourceStatus('r-0006', 'En_Mantenimiento', 'Revisión', repo)

    const entradas = (repo.get<ResourceStatusHistory[]>(LS_KEYS.STATUS_HISTORY) ?? []).filter(
      (h) => h.idRecurso === 'r-0006',
    )
    expect(entradas).toHaveLength(1)
    expect(entradas[0].estado).toBe('En_Mantenimiento')
    expect(entradas[0].motivo).toBe('Revisión')
    expect(new Date(entradas[0].fechaCambio).getTime()).toBeGreaterThanOrEqual(antes)
    expect(getResourceById('r-0006', repo)!.estadoActual).toBe('En_Mantenimiento')
  })

  it('una transición rechazada no cambia el estado ni escribe en el historial', () => {
    const antes = repo.get<ResourceStatusHistory[]>(LS_KEYS.STATUS_HISTORY)?.length
    const r = updateResourceStatus('r-0006', 'En_Préstamo', undefined, repo)
    expect(r.success).toBe(false)
    expect(r.error).toMatch(/Transición de estado inválida/)
    expect(getResourceById('r-0006', repo)!.estadoActual).toBe('Disponible')
    expect(repo.get<ResourceStatusHistory[]>(LS_KEYS.STATUS_HISTORY)?.length).toBe(antes)
  })

  it('filtra por nombre y tipo, ordenado alfabéticamente', () => {
    const porNombre = getResources({ nombre: 'protoboard' }, repo)
    expect(porNombre.map((r) => r.idRecurso)).toEqual(['r-0005'])

    const herramientas = getResources({ tipo: 'Herramienta' }, repo)
    const nombres = herramientas.map((r) => r.nombre)
    expect(nombres).toEqual([...nombres].sort((a, b) => a.localeCompare(b, 'es')))
  })
})

describe('loans.service', () => {
  const userId = 'u-estudiante-0001'

  it('crea un préstamo válido en estado Reservado y descuenta stock', () => {
    const { start, end } = slot(48)
    const antes = getResourceById('r-0002', repo)!.cantidadDisponible
    const r = createLoan(
      { idRecurso: 'r-0002', fechaHoraInicioProgramada: start, fechaHoraFinProgramada: end, motivoPrestamo: MOTIVO },
      userId,
      repo,
    )
    expect(r.success).toBe(true)
    expect(r.data?.estadoPrestamo).toBe('Reservado')
    expect(getResourceById('r-0002', repo)!.cantidadDisponible).toBe(antes - 1)
  })

  it('rechaza tiempos inválidos y motivo corto', () => {
    const { start } = slot(48)
    const corto = new Date(new Date(start).getTime() + 30 * 60 * 1000).toISOString()
    expect(
      createLoan({ idRecurso: 'r-0002', fechaHoraInicioProgramada: start, fechaHoraFinProgramada: corto, motivoPrestamo: MOTIVO }, userId, repo).success,
    ).toBe(false)

    const s = slot(48)
    expect(
      createLoan({ idRecurso: 'r-0002', fechaHoraInicioProgramada: s.start, fechaHoraFinProgramada: s.end, motivoPrestamo: 'corto' }, userId, repo).success,
    ).toBe(false)
  })

  it('rechaza reservar cuando los préstamos solapados agotan las unidades', () => {
    // r-0008 (analizador lógico) tiene 1 sola unidad
    const { start, end } = slot(72)
    const data = { idRecurso: 'r-0008', fechaHoraInicioProgramada: start, fechaHoraFinProgramada: end, motivoPrestamo: MOTIVO }
    expect(createLoan(data, userId, repo).success).toBe(true)

    const segundo = createLoan(data, userId, repo)
    expect(segundo.success).toBe(false)
    expect(segundo.error).toMatch(/no está disponible/i)
  })

  it('con stock agotado el recurso pasa a Reservado y deja de ser reservable', () => {
    const { start, end } = slot(96)
    createLoan({ idRecurso: 'r-0008', fechaHoraInicioProgramada: start, fechaHoraFinProgramada: end, motivoPrestamo: MOTIVO }, userId, repo)
    expect(getResourceById('r-0008', repo)!.estadoActual).toBe('Reservado')
    const otro = slot(200)
    expect(checkAvailability('r-0008', otro.start, otro.end, repo)).toBe(false)
  })

  it('permite tantas reservas simultáneas como unidades disponibles', () => {
    // r-0001 (osciloscopio) tiene 2 unidades disponibles
    const { start, end } = slot(120, 2)
    const data = { idRecurso: 'r-0001', fechaHoraInicioProgramada: start, fechaHoraFinProgramada: end, motivoPrestamo: MOTIVO }
    expect(createLoan(data, userId, repo).success).toBe(true)
    expect(createLoan(data, userId, repo).success).toBe(true)
    expect(createLoan(data, userId, repo).success).toBe(false) // tercera: sin unidades
  })

  it('getAvailableResources excluye recursos sin unidades en el horario', () => {
    const { start, end } = slot(150)
    createLoan({ idRecurso: 'r-0008', fechaHoraInicioProgramada: start, fechaHoraFinProgramada: end, motivoPrestamo: MOTIVO }, userId, repo)
    const ids = getAvailableResources(start, end, undefined, repo).map((r) => r.idRecurso)
    expect(ids).not.toContain('r-0008')
    expect(ids).toContain('r-0002')
  })

  it('lista entregas pendientes (inicio ya llegado) y devoluciones en curso', () => {
    // p-0001 es Reservado con inicio en el pasado (2026-02-05)
    expect(getPendingDeliveries(repo).map((l) => l.idPrestamo)).toContain('p-0001')
    // p-0002 está En_Préstamo
    expect(getPendingReturns(repo).map((l) => l.idPrestamo)).toContain('p-0002')
  })

  it('registerDelivery pasa el préstamo a En_Préstamo', () => {
    const r = registerDelivery('p-0001', { condicion: 'Bueno' }, repo)
    expect(r.success).toBe(true)
    expect(r.data?.estadoPrestamo).toBe('En_Préstamo')
    expect(r.data?.fechaHoraEntrega).toBeDefined()
  })

  it('la entrega de la última unidad reservada deja el recurso En_Préstamo (Req 12.6, 22.3)', () => {
    // r-0008 tiene 1 unidad: al reservarla queda Reservado
    const { start, end } = slot(48)
    const reserva = createLoan(
      { idRecurso: 'r-0008', fechaHoraInicioProgramada: start, fechaHoraFinProgramada: end, motivoPrestamo: MOTIVO },
      userId,
      repo,
    )
    expect(getResourceById('r-0008', repo)!.estadoActual).toBe('Reservado')

    const r = registerDelivery(reserva.data!.idPrestamo, { condicion: 'Bueno' }, repo)
    expect(r.success).toBe(true)
    expect(getResourceById('r-0008', repo)!.estadoActual).toBe('En_Préstamo')

    const historial = (repo.get<ResourceStatusHistory[]>(LS_KEYS.STATUS_HISTORY) ?? []).filter(
      (h) => h.idRecurso === 'r-0008',
    )
    expect(historial.map((h) => h.estado)).toEqual(['Reservado', 'En_Préstamo'])
  })

  it('la entrega mantiene el recurso Reservado mientras queden otras reservas por entregar', () => {
    // r-0001: 2 unidades libres + la reserva p-0001 del seed. Dos reservas nuevas agotan el stock.
    const { start, end } = slot(120, 2)
    const data = { idRecurso: 'r-0001', fechaHoraInicioProgramada: start, fechaHoraFinProgramada: end, motivoPrestamo: MOTIVO }
    const primera = createLoan(data, userId, repo).data!
    const segunda = createLoan(data, userId, repo).data!
    expect(getResourceById('r-0001', repo)!.estadoActual).toBe('Reservado')

    expect(registerDelivery(primera.idPrestamo, { condicion: 'Bueno' }, repo).success).toBe(true)
    expect(registerDelivery(segunda.idPrestamo, { condicion: 'Bueno' }, repo).success).toBe(true)
    // p-0001 sigue pendiente de entrega
    expect(getResourceById('r-0001', repo)!.estadoActual).toBe('Reservado')

    registerDelivery('p-0001', { condicion: 'Bueno' }, repo)
    expect(getResourceById('r-0001', repo)!.estadoActual).toBe('En_Préstamo')
  })

  it('registerDelivery exige observaciones si el recurso está Dañado', () => {
    const r = registerDelivery('p-0001', { condicion: 'Dañado' }, repo)
    expect(r.success).toBe(false)
    expect(registerDelivery('p-0001', { condicion: 'Dañado', observaciones: 'Rayado' }, repo).success).toBe(true)
  })

  it('devolución en buen estado libera la unidad y deja el recurso Disponible', () => {
    // p-0002: cautín r-0003 (4 total, 3 disponibles) En_Préstamo
    const r = registerReturn('p-0002', { condicion: 'Bueno' }, repo)
    expect(r.success).toBe(true)
    expect(r.data?.estadoPrestamo).toBe('Devuelto')
    expect(getResourceById('r-0003', repo)!.cantidadDisponible).toBe(4)
    expect(getResourceById('r-0003', repo)!.estadoActual).toBe('Disponible')
  })

  it('devolución Dañado lleva el recurso a En_Mantenimiento', () => {
    const r = registerReturn('p-0002', { condicion: 'Dañado', observaciones: 'Punta rota' }, repo)
    expect(r.success).toBe(true)
    expect(getResourceById('r-0003', repo)!.estadoActual).toBe('En_Mantenimiento')
  })

  it('calcula el retraso de una devolución tardía (p-0002 venció en febrero)', () => {
    const r = registerReturn('p-0002', { condicion: 'Bueno' }, repo)
    expect(r.data!.retrasoHoras).toBeGreaterThan(0)
  })

  it('no permite devolver un préstamo que no está en curso', () => {
    expect(registerReturn('p-0001', { condicion: 'Bueno' }, repo).success).toBe(false)
  })
})

describe('postcondición de OperationResult (LSP / M8)', () => {
  it('ninguna operación lanza excepción ante entradas inexistentes', () => {
    const ops: Array<() => { success: boolean; error?: string }> = [
      () => loginUser('', '', repo),
      () => updateResourceStatus('no-existe', 'Disponible', undefined, repo),
      () => retireResource('no-existe', repo),
      () => registerDelivery('no-existe', { condicion: 'Bueno' }, repo),
      () => registerReturn('no-existe', { condicion: 'Bueno' }, repo),
      () => createLoan({ idRecurso: 'no-existe', fechaHoraInicioProgramada: 'x', fechaHoraFinProgramada: 'y', motivoPrestamo: '' }, 'u', repo),
    ]
    for (const op of ops) {
      expect(() => op()).not.toThrow()
      const r = op()
      expect(r.success).toBe(false)
      expect(typeof r.error).toBe('string')
    }
  })
})
