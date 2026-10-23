/**
 * Datos iniciales (seed) del sistema.
 *
 * Se cargan la primera vez que arranca la app (cuando no existe la clave
 * `INITIALIZED`). La función recibe un `StorageRepository` (SOLID M2 — DIP),
 * de modo que puede sembrarse tanto en `localStorage` como en un fake de tests.
 *
 * Las contraseñas se almacenan hasheadas (ver `hashUtils`). Credenciales de
 * ejemplo para desarrollo:
 *   - admin@itm.edu.co   / Admin123
 *   - tecnico@itm.edu.co / Tecnico123
 *   - estudiante@itm.edu.co / Estudiante123
 */
import { LS_KEYS } from '@/shared/constants/lsKeys'
import type { StorageRepository } from '@/services/storage/StorageRepository'
import type {
  Loan,
  Resource,
  ResourceStatusHistory,
  Sanction,
  User,
} from '@/shared/types'
import { hashPassword } from '@/shared/utils/hashUtils'

const SEED_USERS: User[] = [
  {
    idUsuario: 'u-admin-0001',
    idRol: 'Administrador_Laboratorio',
    nombre: 'Ana Admin',
    correo: 'admin@itm.edu.co',
    cedula: '1000000001',
    contrasena: hashPassword('Admin123'),
    fechaRegistro: '2026-01-10T08:00:00.000Z',
  },
  {
    idUsuario: 'u-tecnico-0001',
    idRol: 'Técnico_Laboratorio',
    nombre: 'Tomás Técnico',
    correo: 'tecnico@itm.edu.co',
    cedula: '1000000002',
    contrasena: hashPassword('Tecnico123'),
    fechaRegistro: '2026-01-11T08:00:00.000Z',
  },
  {
    idUsuario: 'u-estudiante-0001',
    idRol: 'Estudiante',
    nombre: 'Elena Estudiante',
    correo: 'estudiante@itm.edu.co',
    cedula: '1000000003',
    carnet: 'EST-2026-001',
    contrasena: hashPassword('Estudiante123'),
    fechaRegistro: '2026-01-12T08:00:00.000Z',
  },
]

const SEED_RESOURCES: Resource[] = [
  {
    idRecurso: 'r-0001',
    nombre: 'Osciloscopio Tektronix TBS1052',
    codigoInventario: 'EQ-OSC-001',
    tipo: 'Equipo',
    descripcion: 'Osciloscopio digital de 2 canales, 50 MHz.',
    cantidadTotal: 3,
    cantidadDisponible: 2,
    estadoActual: 'Disponible',
    fechaCreacion: '2026-01-15T08:00:00.000Z',
  },
  {
    idRecurso: 'r-0002',
    nombre: 'Multímetro Fluke 117',
    codigoInventario: 'EQ-MUL-001',
    tipo: 'Equipo',
    descripcion: 'Multímetro digital true-RMS para electrónica.',
    cantidadTotal: 5,
    cantidadDisponible: 5,
    estadoActual: 'Disponible',
    fechaCreacion: '2026-01-15T08:10:00.000Z',
  },
  {
    idRecurso: 'r-0003',
    nombre: 'Cautín de estación Hakko FX-888D',
    codigoInventario: 'HE-CAU-001',
    tipo: 'Herramienta',
    descripcion: 'Estación de soldadura con control de temperatura.',
    cantidadTotal: 4,
    cantidadDisponible: 3,
    estadoActual: 'Disponible',
    fechaCreacion: '2026-01-15T08:20:00.000Z',
  },
  {
    idRecurso: 'r-0004',
    nombre: 'Juego de destornilladores de precisión',
    codigoInventario: 'HE-DES-001',
    tipo: 'Herramienta',
    descripcion: 'Kit de 32 puntas para electrónica fina.',
    cantidadTotal: 6,
    cantidadDisponible: 6,
    estadoActual: 'Disponible',
    fechaCreacion: '2026-01-15T08:30:00.000Z',
  },
  {
    idRecurso: 'r-0005',
    nombre: 'Protoboard 830 puntos',
    codigoInventario: 'MA-PRO-001',
    tipo: 'Material',
    descripcion: 'Placa de pruebas sin soldadura de 830 contactos.',
    cantidadTotal: 20,
    cantidadDisponible: 18,
    estadoActual: 'Disponible',
    fechaCreacion: '2026-01-15T08:40:00.000Z',
  },
  {
    idRecurso: 'r-0006',
    nombre: 'Kit de resistencias surtidas',
    codigoInventario: 'MA-RES-001',
    tipo: 'Material',
    descripcion: 'Caja con 600 resistencias de valores variados.',
    cantidadTotal: 15,
    cantidadDisponible: 15,
    estadoActual: 'Disponible',
    fechaCreacion: '2026-01-15T08:50:00.000Z',
  },
  {
    idRecurso: 'r-0007',
    nombre: 'Fuente de poder regulable 0-30V',
    codigoInventario: 'EQ-FUE-001',
    tipo: 'Equipo',
    descripcion: 'Fuente DC regulable con límite de corriente.',
    cantidadTotal: 2,
    cantidadDisponible: 0,
    estadoActual: 'En_Mantenimiento',
    fechaCreacion: '2026-01-15T09:00:00.000Z',
  },
  {
    idRecurso: 'r-0008',
    nombre: 'Analizador lógico 8 canales',
    codigoInventario: 'EQ-ANA-001',
    tipo: 'Equipo',
    descripcion: 'Analizador lógico USB de 8 canales.',
    cantidadTotal: 1,
    cantidadDisponible: 1,
    estadoActual: 'Disponible',
    fechaCreacion: '2026-01-15T09:10:00.000Z',
  },
]

const SEED_LOANS: Loan[] = [
  {
    idPrestamo: 'p-0001',
    idUsuario: 'u-estudiante-0001',
    idRecurso: 'r-0001',
    fechaHoraReserva: '2026-02-01T10:00:00.000Z',
    fechaHoraInicioProgramada: '2026-02-05T14:00:00.000Z',
    fechaHoraFinProgramada: '2026-02-05T18:00:00.000Z',
    estadoPrestamo: 'Reservado',
    motivoPrestamo: 'Práctica de laboratorio de señales analógicas.',
  },
  {
    idPrestamo: 'p-0002',
    idUsuario: 'u-estudiante-0001',
    idRecurso: 'r-0003',
    fechaHoraReserva: '2026-02-02T09:00:00.000Z',
    fechaHoraInicioProgramada: '2026-02-03T08:00:00.000Z',
    fechaHoraFinProgramada: '2026-02-03T12:00:00.000Z',
    fechaHoraEntrega: '2026-02-03T08:05:00.000Z',
    estadoPrestamo: 'En_Préstamo',
    motivoPrestamo: 'Soldadura de placa para proyecto de curso.',
    condicionEntrega: 'Bueno',
  },
  {
    idPrestamo: 'p-0003',
    idUsuario: 'u-estudiante-0001',
    idRecurso: 'r-0005',
    fechaHoraReserva: '2026-01-20T09:00:00.000Z',
    fechaHoraInicioProgramada: '2026-01-21T08:00:00.000Z',
    fechaHoraFinProgramada: '2026-01-21T12:00:00.000Z',
    fechaHoraEntrega: '2026-01-21T08:00:00.000Z',
    fechaHoraDevolucionReal: '2026-01-21T11:30:00.000Z',
    estadoPrestamo: 'Devuelto',
    motivoPrestamo: 'Montaje de circuito de prueba en protoboard.',
    condicionEntrega: 'Bueno',
    condicionDevolucion: 'Bueno',
    retrasoHoras: 0,
  },
  {
    idPrestamo: 'p-0004',
    idUsuario: 'u-estudiante-0001',
    idRecurso: 'r-0007',
    fechaHoraReserva: '2026-01-18T09:00:00.000Z',
    fechaHoraInicioProgramada: '2026-01-19T08:00:00.000Z',
    fechaHoraFinProgramada: '2026-01-19T12:00:00.000Z',
    fechaHoraEntrega: '2026-01-19T08:00:00.000Z',
    fechaHoraDevolucionReal: '2026-01-19T15:00:00.000Z',
    estadoPrestamo: 'Devuelto',
    motivoPrestamo: 'Pruebas de alimentación para circuito de potencia.',
    condicionEntrega: 'Bueno',
    condicionDevolucion: 'Dañado',
    observacionesDevolucion: 'Perilla de voltaje floja, requiere revisión.',
    retrasoHoras: 3,
  },
  {
    idPrestamo: 'p-0005',
    idUsuario: 'u-estudiante-0001',
    idRecurso: 'r-0002',
    fechaHoraReserva: '2026-02-04T09:00:00.000Z',
    fechaHoraInicioProgramada: '2026-02-10T14:00:00.000Z',
    fechaHoraFinProgramada: '2026-02-10T16:00:00.000Z',
    estadoPrestamo: 'Cancelado',
    motivoPrestamo: 'Medición de continuidad en práctica (cancelada).',
  },
]

const SEED_STATUS_HISTORY: ResourceStatusHistory[] = [
  {
    idEstado: 'h-0001',
    idRecurso: 'r-0007',
    estado: 'En_Mantenimiento',
    fechaCambio: '2026-01-19T15:05:00.000Z',
    motivo: 'Devolución en condición dañada (préstamo p-0004).',
  },
]

const SEED_SANCTIONS: Sanction[] = []

/**
 * Siembra los datos solo si el sistema aún no fue inicializado
 * (primer arranque). No sobrescribe datos existentes.
 */
export function ensureSeeded(repo: StorageRepository): void {
  if (!repo.get<boolean>(LS_KEYS.INITIALIZED)) {
    seedData(repo)
  }
}

/**
 * Siembra los datos iniciales en el almacenamiento indicado y marca el
 * sistema como inicializado. Idempotente respecto a las claves que escribe.
 */
export function seedData(repo: StorageRepository): void {
  repo.set(LS_KEYS.USERS, SEED_USERS)
  repo.set(LS_KEYS.RESOURCES, SEED_RESOURCES)
  repo.set(LS_KEYS.LOANS, SEED_LOANS)
  repo.set(LS_KEYS.STATUS_HISTORY, SEED_STATUS_HISTORY)
  repo.set(LS_KEYS.SANCTIONS, SEED_SANCTIONS)
  repo.set(LS_KEYS.INITIALIZED, true)
}
