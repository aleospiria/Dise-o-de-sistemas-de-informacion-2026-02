import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { createMemoryRouter, RouterProvider } from 'react-router-dom'
import { describe, expect, it } from 'vitest'
import { AppProviders } from '@/app/providers'
import { appRoutes } from '@/app/router'
import { DEMO_ACCOUNTS } from '@/features/auth/demoAccounts'
import type { RegisterFormValues } from '@/features/auth/types'
import { validateLoginForm, validateRegisterForm } from '@/features/auth/validation'
import { loginUser } from '@/services/mockDb/auth.service'
import { seedData } from '@/services/mockDb/seed-data'
import { InMemoryStorageRepository } from '@/services/storage'
import { LS_KEYS } from '@/shared/constants/lsKeys'
import { VALIDATION_MESSAGES as M } from '@/shared/constants/messages'
import type { Session, User } from '@/shared/types'

function setup(path = '/login') {
  const repo = new InMemoryStorageRepository()
  seedData(repo)
  const router = createMemoryRouter(appRoutes, { initialEntries: [path] })
  const user = userEvent.setup()
  render(
    <AppProviders repository={repo}>
      <RouterProvider router={router} />
    </AppProviders>,
  )
  return { repo, router, user, path: () => router.state.location.pathname }
}

// Las etiquetas de campos requeridos terminan en " *", por eso se anclan al inicio.
const correo = () => screen.getByLabelText(/^Correo electrónico/)
const contrasena = () => screen.getByLabelText(/^Contraseña/)
const loginButton = () => screen.getByRole('button', { name: 'Iniciar sesión' })
const createButton = () => screen.getByRole('button', { name: 'Crear cuenta' })

describe('validación pura de formularios', () => {
  it('login: exige ambos campos y un correo con formato válido', () => {
    expect(validateLoginForm({ correo: '', contrasena: '' })).toEqual({
      correo: M.required,
      contrasena: M.required,
    })
    expect(validateLoginForm({ correo: 'no-es-correo', contrasena: 'x' })).toEqual({
      correo: M.email,
    })
    expect(validateLoginForm({ correo: 'a@b.co', contrasena: 'x' })).toEqual({})
  })

  const valido: RegisterFormValues = {
    nombre: 'Ana Pérez',
    correo: 'ana@itm.edu.co',
    cedula: '123',
    idRol: 'Estudiante',
    carnet: 'EST-1',
    contrasena: 'Clave1234',
    confirmacionContrasena: 'Clave1234',
  }

  it('registro: acepta datos válidos', () => {
    expect(validateRegisterForm(valido)).toEqual({})
  })

  it('registro: contraseña débil y confirmación distinta', () => {
    expect(validateRegisterForm({ ...valido, contrasena: 'abc', confirmacionContrasena: 'abc' }).contrasena).toBe(M.password)
    expect(validateRegisterForm({ ...valido, confirmacionContrasena: 'Otra1234' }).confirmacionContrasena).toBe(
      M.passwordMismatch,
    )
  })

  it('registro: el carnet solo es obligatorio para estudiantes', () => {
    expect(validateRegisterForm({ ...valido, carnet: '' }).carnet).toBe(M.required)
    expect(validateRegisterForm({ ...valido, idRol: 'Técnico_Laboratorio', carnet: '' }).carnet).toBeUndefined()
  })

  it('registro: nombre vacío o de más de 100 caracteres', () => {
    expect(validateRegisterForm({ ...valido, nombre: '   ' }).nombre).toBe(M.required)
    expect(validateRegisterForm({ ...valido, nombre: 'a'.repeat(101) }).nombre).toMatch(/100/)
  })
})

describe('cuentas de demostración', () => {
  it.each(DEMO_ACCOUNTS)('$correo inicia sesión contra los datos semilla', (account) => {
    const repo = new InMemoryStorageRepository()
    seedData(repo)
    const result = loginUser(account.correo, account.contrasena, repo)
    expect(result.success).toBe(true)
    expect(result.data?.role).toBe(account.rol)
  })
})

describe('pantalla de inicio de sesión', () => {
  it('muestra el título, el formulario y fija el título de la pestaña', () => {
    setup()
    expect(screen.getByRole('heading', { level: 1, name: 'Iniciar sesión' })).toBeInTheDocument()
    expect(correo()).toHaveAttribute('type', 'email')
    expect(contrasena()).toHaveAttribute('type', 'password')
    expect(document.title).toBe('Iniciar sesión · Préstamo de recursos de laboratorio')
  })

  it('enviar vacío muestra "Este campo es requerido", enfoca el primer error y no entra', async () => {
    const { user, path } = setup()
    await user.click(loginButton())

    expect(await screen.findAllByText(M.required)).toHaveLength(2)
    expect(correo()).toHaveFocus()
    expect(correo()).toHaveAttribute('aria-invalid', 'true')
    expect(loginButton()).toBeDisabled()
    expect(path()).toBe('/login')
  })

  it('tras el primer envío valida en tiempo real y desbloquea el botón (Req 17.1, 17.3)', async () => {
    const { user } = setup()
    await user.click(loginButton())
    await screen.findAllByText(M.required)

    await user.type(correo(), 'admin@itm.edu.co')
    await user.type(contrasena(), 'x')
    await waitFor(() => expect(screen.queryByText(M.required)).not.toBeInTheDocument())
    expect(loginButton()).toBeEnabled()
  })

  it('un correo con formato inválido muestra su mensaje', async () => {
    const { user } = setup()
    await user.type(correo(), 'no-es-correo')
    await user.type(contrasena(), 'x')
    await user.click(loginButton())
    expect(await screen.findByText(M.email)).toBeInTheDocument()
  })

  it('credenciales inválidas muestran un error genérico y no inician sesión (Req 1.8)', async () => {
    const { user, path, repo } = setup()
    await user.type(correo(), 'admin@itm.edu.co')
    await user.type(contrasena(), 'Incorrecta1')
    await user.click(loginButton())

    expect(await screen.findByRole('alert')).toHaveTextContent('Correo o contraseña incorrectos.')
    expect(path()).toBe('/login')
    expect(repo.get(LS_KEYS.SESSION)).toBeNull()
    // El error del servidor no bloquea el botón: se puede reintentar.
    expect(loginButton()).toBeEnabled()
  })

  it('credenciales válidas inician sesión y llevan al inicio (Req 1.7)', async () => {
    const { user, path, repo } = setup()
    await user.type(correo(), 'admin@itm.edu.co')
    await user.type(contrasena(), 'Admin123')
    await user.click(loginButton())

    await waitFor(() => expect(path()).toBe('/dashboard'))
    expect(await screen.findByRole('heading', { level: 1, name: 'Inicio' })).toBeInTheDocument()
    // El saludo también aparece en el aviso de bienvenida; se acota al <main>.
    expect(await within(screen.getByRole('main')).findByText('Hola, Ana Admin.')).toBeInTheDocument()
    expect(repo.get<Session>(LS_KEYS.SESSION)?.role).toBe('Administrador_Laboratorio')
  })

  it('elegir una cuenta de demostración llena el formulario y permite entrar', async () => {
    const { user, path, repo } = setup()
    await user.click(screen.getByRole('button', { name: /Técnico de laboratorio/ }))
    expect(correo()).toHaveValue('tecnico@itm.edu.co')
    expect(contrasena()).toHaveValue('Tecnico123')

    await user.click(loginButton())
    await waitFor(() => expect(path()).toBe('/dashboard'))
    expect(repo.get<Session>(LS_KEYS.SESSION)?.role).toBe('Técnico_Laboratorio')
  })

  it('"¿Olvidaste tu contraseña?" avisa que es una función futura', async () => {
    const { user } = setup()
    await user.click(screen.getByRole('button', { name: '¿Olvidaste tu contraseña?' }))
    expect(await screen.findByText(/próxima versión/)).toBeInTheDocument()
  })

  it('el enlace "Crear cuenta" lleva al registro', async () => {
    const { user, path } = setup()
    await user.click(screen.getByRole('link', { name: 'Crear cuenta' }))
    expect(path()).toBe('/register')
  })
})

describe('pantalla de registro', () => {
  async function fillValid(
    user: ReturnType<typeof userEvent.setup>,
    email = 'nuevo@itm.edu.co',
  ) {
    await user.type(screen.getByLabelText(/^Nombre completo/), 'Nuevo Estudiante')
    await user.type(correo(), email)
    await user.type(screen.getByLabelText(/^Cédula/), '1234567')
    await user.type(screen.getByLabelText(/^Carnet estudiantil/), 'EST-2026-099')
    await user.type(contrasena(), 'Clave1234')
    await user.type(screen.getByLabelText(/^Confirmar contraseña/), 'Clave1234')
  }

  it('pide el carnet solo para el rol Estudiante', async () => {
    const { user } = setup('/register')
    expect(screen.getByLabelText(/^Carnet estudiantil/)).toBeInTheDocument()

    await user.selectOptions(screen.getByLabelText(/^Rol/), 'Técnico_Laboratorio')
    expect(screen.queryByLabelText(/^Carnet estudiantil/)).not.toBeInTheDocument()
  })

  it('enviar vacío marca los campos requeridos sin crear la cuenta', async () => {
    const { user, repo } = setup('/register')
    await user.click(createButton())
    // nombre, correo, cédula, carnet, contraseña y confirmación
    expect(await screen.findAllByText(M.required)).toHaveLength(6)
    expect(repo.get<User[]>(LS_KEYS.USERS)).toHaveLength(3)
  })

  it('un registro válido crea la cuenta y vuelve al login con el correo precargado (Req 1.2)', async () => {
    const { user, path, repo } = setup('/register')
    await fillValid(user)
    await user.click(createButton())

    await waitFor(() => expect(path()).toBe('/login'))
    expect(await screen.findByText('Cuenta creada. Ya puedes iniciar sesión.')).toBeInTheDocument()
    expect(correo()).toHaveValue('nuevo@itm.edu.co')

    const users = repo.get<User[]>(LS_KEYS.USERS) ?? []
    const creado = users.find((u) => u.correo === 'nuevo@itm.edu.co')
    expect(creado?.carnet).toBe('EST-2026-099')
    expect(creado?.contrasena).not.toBe('Clave1234')

    // La cuenta nueva puede iniciar sesión.
    await user.type(contrasena(), 'Clave1234')
    await user.click(loginButton())
    await waitFor(() => expect(path()).toBe('/dashboard'))
  })

  it('un correo ya registrado muestra el error del servicio (Req 1.3)', async () => {
    const { user, path } = setup('/register')
    await fillValid(user, 'admin@itm.edu.co')
    await user.click(createButton())

    expect(await screen.findByRole('alert')).toHaveTextContent('El correo ya está registrado.')
    expect(path()).toBe('/register')
  })

  it('contraseñas distintas muestran el error de no coincidencia (Req 1.5)', async () => {
    const { user } = setup('/register')
    await fillValid(user)
    const confirmacion = screen.getByLabelText(/^Confirmar contraseña/)
    await user.clear(confirmacion)
    await user.type(confirmacion, 'Distinta1')
    await user.click(createButton())
    expect(await screen.findByText(M.passwordMismatch)).toBeInTheDocument()
  })

  it('un rol sin carnet se registra sin enviar carnet', async () => {
    const { user, path, repo } = setup('/register')
    await user.selectOptions(screen.getByLabelText(/^Rol/), 'Técnico_Laboratorio')
    await user.type(screen.getByLabelText(/^Nombre completo/), 'Nuevo Técnico')
    await user.type(correo(), 'tec2@itm.edu.co')
    await user.type(screen.getByLabelText(/^Cédula/), '7654321')
    await user.type(contrasena(), 'Clave1234')
    await user.type(screen.getByLabelText(/^Confirmar contraseña/), 'Clave1234')
    await user.click(createButton())

    await waitFor(() => expect(path()).toBe('/login'))
    const creado = (repo.get<User[]>(LS_KEYS.USERS) ?? []).find((u) => u.correo === 'tec2@itm.edu.co')
    expect(creado?.idRol).toBe('Técnico_Laboratorio')
    expect(creado?.carnet).toBeUndefined()
  })
})
