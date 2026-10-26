import type { ReactNode } from 'react'
import { act, render, renderHook } from '@testing-library/react'
import { beforeEach, describe, expect, it } from 'vitest'
import { AppDataProvider } from '@/contexts/AppDataProvider'
import { AuthProvider } from '@/contexts/AuthProvider'
import { UIProvider } from '@/contexts/UIProvider'
import { useAuth } from '@/contexts/useAuth'
import { useLoans } from '@/contexts/useLoans'
import { useResources } from '@/contexts/useResources'
import { useToast } from '@/contexts/useToast'
import { useUsers } from '@/contexts/useUsers'
import { LS_KEYS } from '@/shared/constants/lsKeys'
import { InMemoryStorageRepository, type StorageRepository } from '@/services/storage'
import { seedData } from '@/services/mockDb/seed-data'

let repo: InMemoryStorageRepository

beforeEach(() => {
  repo = new InMemoryStorageRepository()
})

function dataWrapper(repository: StorageRepository = repo) {
  return ({ children }: { children: ReactNode }) => (
    <AppDataProvider repository={repository}>{children}</AppDataProvider>
  )
}

describe('AppDataProvider', () => {
  it('siembra los datos en el primer arranque y los expone por dominio', () => {
    const { result } = renderHook(
      () => ({ r: useResources(), l: useLoans(), u: useUsers() }),
      { wrapper: dataWrapper() },
    )
    expect(repo.get(LS_KEYS.INITIALIZED)).toBe(true)
    expect(result.current.r.resources).toHaveLength(8)
    expect(result.current.l.loans).toHaveLength(5)
    expect(result.current.u.users).toHaveLength(3)
  })

  it('no vuelve a sembrar si ya estaba inicializado', () => {
    seedData(repo)
    repo.set(LS_KEYS.RESOURCES, [])
    const { result } = renderHook(() => useResources(), { wrapper: dataWrapper() })
    expect(result.current.resources).toHaveLength(0)
  })

  it('incluye en el estado los recursos dados de baja', () => {
    const { result } = renderHook(() => useResources(), { wrapper: dataWrapper() })
    act(() => {
      expect(result.current.retireResource('r-0006').success).toBe(true)
    })
    const baja = result.current.resources.find((r) => r.idRecurso === 'r-0006')
    expect(baja?.estadoActual).toBe('Dado_de_Baja')
  })

  it('una mutación persiste en el repositorio y refresca el estado', () => {
    const { result } = renderHook(() => useResources(), { wrapper: dataWrapper() })
    act(() => {
      const r = result.current.createResource({
        nombre: 'Generador de funciones',
        codigoInventario: 'EQ-GEN-001',
        tipo: 'Equipo',
        descripcion: 'Generador de señales.',
        cantidadTotal: 2,
      })
      expect(r.success).toBe(true)
    })
    expect(result.current.resources).toHaveLength(9)
    expect(repo.get<unknown[]>(LS_KEYS.RESOURCES)).toHaveLength(9)
  })

  it('una operación fallida no cambia el estado', () => {
    const { result } = renderHook(() => useResources(), { wrapper: dataWrapper() })
    const antes = result.current.resources
    act(() => {
      // r-0001 tiene un préstamo reservado activo
      expect(result.current.retireResource('r-0001').success).toBe(false)
    })
    expect(result.current.resources).toBe(antes)
  })

  it('un cambio de préstamos no cambia la referencia de recursos si no los afecta', () => {
    const { result } = renderHook(
      () => ({ r: useResources(), l: useLoans() }),
      { wrapper: dataWrapper() },
    )
    const recursosAntes = result.current.r.resources
    act(() => {
      // Entregar p-0001 (Reservado) no altera stock ni estado de r-0001
      expect(result.current.l.registerDelivery('p-0001', { condicion: 'Bueno' }).success).toBe(true)
    })
    expect(result.current.l.loans.find((l) => l.idPrestamo === 'p-0001')?.estadoPrestamo).toBe('En_Préstamo')
    expect(result.current.r.resources).toBe(recursosAntes)
  })

  it('convierte un fallo de almacenamiento en un resultado de error, sin lanzar', () => {
    const { result } = renderHook(() => useResources(), { wrapper: dataWrapper() })
    const fallando: StorageRepository = {
      get: repo.get.bind(repo),
      set: () => {
        throw new Error('Cuota excedida')
      },
      remove: repo.remove.bind(repo),
    }
    const { result: result2 } = renderHook(() => useResources(), {
      wrapper: dataWrapper(fallando),
    })
    expect(result.current.resources.length).toBeGreaterThan(0)
    act(() => {
      const r = result2.current.createResource({
        nombre: 'X',
        codigoInventario: 'X',
        tipo: 'Material',
        descripcion: '',
        cantidadTotal: 1,
      })
      expect(r.success).toBe(false)
      expect(r.error).toMatch(/cuota/i)
    })
  })

  it('muestra un error bloqueante si el almacenamiento no está disponible', () => {
    const roto: StorageRepository = {
      get: () => null,
      set: () => {
        throw new Error('sin almacenamiento')
      },
      remove: () => undefined,
    }
    const { getByRole, queryByText } = render(
      <AppDataProvider repository={roto}>
        <p>contenido</p>
      </AppDataProvider>,
    )
    expect(getByRole('alert')).toBeInTheDocument()
    expect(queryByText('contenido')).not.toBeInTheDocument()
  })

  it('los hooks de dominio fallan con un mensaje claro fuera del provider', () => {
    expect(() => renderHook(() => useResources())).toThrow(/AppDataProvider/)
  })
})

describe('AuthProvider', () => {
  function authWrapper({ children }: { children: ReactNode }) {
    return (
      <AppDataProvider repository={repo}>
        <AuthProvider repository={repo}>{children}</AuthProvider>
      </AppDataProvider>
    )
  }

  it('inicia sin sesión y permite iniciar y cerrar sesión', () => {
    const { result } = renderHook(() => useAuth(), { wrapper: authWrapper })
    expect(result.current.session).toBeNull()

    act(() => {
      expect(result.current.login('tecnico@itm.edu.co', 'Tecnico123').success).toBe(true)
    })
    expect(result.current.session?.role).toBe('Técnico_Laboratorio')
    expect(repo.get(LS_KEYS.SESSION)).not.toBeNull()

    act(() => result.current.logout())
    expect(result.current.session).toBeNull()
    expect(repo.get(LS_KEYS.SESSION)).toBeNull()
  })

  it('un login inválido no crea sesión', () => {
    const { result } = renderHook(() => useAuth(), { wrapper: authWrapper })
    act(() => {
      expect(result.current.login('admin@itm.edu.co', 'incorrecta').success).toBe(false)
    })
    expect(result.current.session).toBeNull()
  })

  it('restaura una sesión vigente al montar y descarta una expirada', () => {
    seedData(repo)
    const vigente = {
      userId: 'u-admin-0001',
      role: 'Administrador_Laboratorio',
      nombre: 'Ana Admin',
      correo: 'admin@itm.edu.co',
      expiresAt: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
    }
    repo.set(LS_KEYS.SESSION, vigente)
    const a = renderHook(() => useAuth(), { wrapper: authWrapper })
    expect(a.result.current.session?.correo).toBe('admin@itm.edu.co')
    a.unmount()

    repo.set(LS_KEYS.SESSION, { ...vigente, expiresAt: new Date(Date.now() - 1000).toISOString() })
    const b = renderHook(() => useAuth(), { wrapper: authWrapper })
    expect(b.result.current.session).toBeNull()
  })

  it('register delega en el servicio y devuelve su resultado', () => {
    const { result } = renderHook(() => useAuth(), { wrapper: authWrapper })
    let ok = false
    act(() => {
      ok = result.current.register({
        nombre: 'Nuevo',
        correo: 'nuevo@itm.edu.co',
        contrasena: 'Clave1234',
        confirmacionContrasena: 'Clave1234',
        idRol: 'Estudiante',
        cedula: '99',
      }).success
    })
    expect(ok).toBe(true)
  })

  describe('cuando el almacenamiento lanza al escribir', () => {
    let failing: StorageRepository

    beforeEach(() => {
      seedData(repo)
      failing = {
        get: repo.get.bind(repo),
        set: () => {
          throw new Error('Cuota excedida')
        },
        remove: () => {
          throw new Error('Almacenamiento bloqueado')
        },
      }
    })

    function failingWrapper({ children }: { children: ReactNode }) {
      return <AuthProvider repository={failing}>{children}</AuthProvider>
    }

    it('login devuelve un error y no deja sesión en memoria ni en el almacenamiento', () => {
      const { result } = renderHook(() => useAuth(), { wrapper: failingWrapper })
      let login: ReturnType<typeof result.current.login> | undefined
      act(() => {
        login = result.current.login('tecnico@itm.edu.co', 'Tecnico123')
      })
      expect(login?.success).toBe(false)
      expect(login?.error).toMatch(/almacenamiento/i)
      expect(result.current.session).toBeNull()
      expect(repo.get(LS_KEYS.SESSION)).toBeNull()
    })

    it('register devuelve un error en lugar de lanzar', () => {
      const { result } = renderHook(() => useAuth(), { wrapper: failingWrapper })
      let registro: ReturnType<typeof result.current.register> | undefined
      act(() => {
        registro = result.current.register({
          nombre: 'Nuevo',
          correo: 'nuevo@itm.edu.co',
          contrasena: 'Clave1234',
          confirmacionContrasena: 'Clave1234',
          idRol: 'Estudiante',
          cedula: '99',
        })
      })
      expect(registro?.success).toBe(false)
      expect(registro?.error).toMatch(/almacenamiento/i)
    })

    it('logout descarta la sesión en memoria aunque no pueda borrarla del almacenamiento', () => {
      repo.set(LS_KEYS.SESSION, {
        userId: 'u-admin-0001',
        role: 'Administrador_Laboratorio',
        nombre: 'Ana Admin',
        correo: 'admin@itm.edu.co',
        expiresAt: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
      })
      const { result } = renderHook(() => useAuth(), { wrapper: failingWrapper })
      expect(result.current.session?.correo).toBe('admin@itm.edu.co')
      act(() => result.current.logout())
      expect(result.current.session).toBeNull()
    })
  })
})

describe('UIProvider', () => {
  const uiWrapper = ({ children }: { children: ReactNode }) => (
    <UIProvider>{children}</UIProvider>
  )

  it('apila toasts y permite cerrarlos individualmente', () => {
    const { result } = renderHook(() => useToast(), { wrapper: uiWrapper })
    let id1 = ''
    act(() => {
      id1 = result.current.showToast('success', 'Guardado')
      result.current.showToast('error', 'Falló')
    })
    expect(result.current.toasts.map((t) => t.type)).toEqual(['success', 'error'])

    act(() => result.current.dismissToast(id1))
    expect(result.current.toasts).toHaveLength(1)
    expect(result.current.toasts[0].message).toBe('Falló')
  })

  it('controla el estado de carga global', () => {
    const { result } = renderHook(() => useToast(), { wrapper: uiWrapper })
    expect(result.current.isGlobalLoading).toBe(false)
    act(() => result.current.setGlobalLoading(true))
    expect(result.current.isGlobalLoading).toBe(true)
  })
})
