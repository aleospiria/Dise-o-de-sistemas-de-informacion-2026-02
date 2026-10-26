/**
 * Servicio de autenticación (mock).
 *
 * SOLID M1 (SRP): el servicio ORQUESTA. Delega validación a `validators`,
 * hashing a `hashUtils` y generación de id a `uuidUtils`.
 * SOLID M2 (DIP): depende de `StorageRepository`, no de `localStorage`.
 * SOLID M8 (LSP): toda función retorna `OperationResult`; nunca lanza.
 */
import { LS_KEYS } from '@/shared/constants/lsKeys'
import {
  localStorageRepository,
  type StorageRepository,
} from '@/services/storage'
import type {
  OperationResult,
  RegisterFormData,
  Session,
  User,
} from '@/shared/types'
import { hashPassword, verifyPassword } from '@/shared/utils/hashUtils'
import { generateUUID } from '@/shared/utils/uuidUtils'
import {
  passwordsMatch,
  validateEmail,
  validatePassword,
} from '@/shared/utils/validators'

const SESSION_DURATION_MS = 8 * 60 * 60 * 1000 // 8 horas
const GENERIC_LOGIN_ERROR = 'Correo o contraseña incorrectos.'
/**
 * Fallo de escritura (cuota, modo privado). No depende de las credenciales:
 * ocurre en el navegador del propio usuario, por lo que no es un oráculo
 * de cuentas (Req 1.8 aplica al rechazo de credenciales).
 */
const STORAGE_WRITE_ERROR =
  'No se pudo guardar en el almacenamiento del navegador. Revisa que no esté bloqueado o lleno e intenta de nuevo.'

function readUsers(repo: StorageRepository): User[] {
  return repo.get<User[]>(LS_KEYS.USERS) ?? []
}

/**
 * Ejecuta una escritura sobre el puerto. `StorageRepository.set` puede lanzar
 * (p. ej. `LocalStorageRepository` con cuota excedida); aquí se convierte en
 * `false` para que el servicio devuelva un `OperationResult` de error (M8).
 */
function tryWrite(write: () => void): boolean {
  try {
    write()
    return true
  } catch {
    return false
  }
}

/**
 * Registra un nuevo usuario. Valida correo único, formato y contraseña.
 */
export function registerUser(
  data: RegisterFormData,
  repo: StorageRepository = localStorageRepository,
): OperationResult<User> {
  if (!data.nombre.trim()) {
    return { success: false, error: 'El nombre es obligatorio.' }
  }
  if (!validateEmail(data.correo)) {
    return { success: false, error: 'Ingresa un correo electrónico válido.' }
  }
  if (!validatePassword(data.contrasena)) {
    return {
      success: false,
      error:
        'La contraseña debe tener mínimo 8 caracteres, con mayúscula, minúscula y número.',
    }
  }
  if (!passwordsMatch(data.contrasena, data.confirmacionContrasena)) {
    return { success: false, error: 'Las contraseñas no coinciden.' }
  }

  const users = readUsers(repo)
  const correoNormalizado = data.correo.trim().toLowerCase()
  if (users.some((u) => u.correo.toLowerCase() === correoNormalizado)) {
    return { success: false, error: 'El correo ya está registrado.' }
  }

  const nuevo: User = {
    idUsuario: generateUUID(),
    idRol: data.idRol,
    nombre: data.nombre.trim(),
    correo: data.correo.trim(),
    cedula: data.cedula.trim(),
    carnet: data.carnet?.trim() || undefined,
    contrasena: hashPassword(data.contrasena),
    fechaRegistro: new Date().toISOString(),
  }
  if (!tryWrite(() => repo.set(LS_KEYS.USERS, [...users, nuevo]))) {
    return { success: false, error: STORAGE_WRITE_ERROR }
  }
  return { success: true, data: nuevo }
}

/**
 * Inicia sesión. En caso de fallo devuelve SIEMPRE el mismo mensaje genérico,
 * sin revelar si el correo o la contraseña son incorrectos (Req 1.8).
 */
export function loginUser(
  correo: string,
  contrasena: string,
  repo: StorageRepository = localStorageRepository,
): OperationResult<Session> {
  const users = readUsers(repo)
  const correoNormalizado = correo.trim().toLowerCase()
  const user = users.find((u) => u.correo.toLowerCase() === correoNormalizado)

  if (!user || !verifyPassword(contrasena, user.contrasena)) {
    return { success: false, error: GENERIC_LOGIN_ERROR }
  }

  const session: Session = {
    userId: user.idUsuario,
    role: user.idRol,
    nombre: user.nombre,
    correo: user.correo,
    expiresAt: new Date(Date.now() + SESSION_DURATION_MS).toISOString(),
  }
  if (!tryWrite(() => repo.set(LS_KEYS.SESSION, session))) {
    return { success: false, error: STORAGE_WRITE_ERROR }
  }
  return { success: true, data: session }
}

/**
 * Cierra la sesión actual. Si el almacenamiento no permite borrarla, no
 * lanza: el llamador igualmente descarta la sesión en memoria.
 */
export function logoutUser(
  repo: StorageRepository = localStorageRepository,
): void {
  tryWrite(() => repo.remove(LS_KEYS.SESSION))
}

/**
 * Devuelve la sesión activa si existe y no ha expirado; en caso contrario
 * la limpia y devuelve `null`.
 */
export function getCurrentSession(
  repo: StorageRepository = localStorageRepository,
): Session | null {
  const session = repo.get<Session>(LS_KEYS.SESSION)
  if (!session) return null
  if (new Date(session.expiresAt).getTime() <= Date.now()) {
    tryWrite(() => repo.remove(LS_KEYS.SESSION))
    return null
  }
  return session
}
