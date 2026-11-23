/**
 * Tipos e interfaces globales del dominio.
 * Fuente: design.md — sección "Data Models".
 * Todas las fechas se representan como cadenas ISO 8601.
 */

// ─── Roles ───────────────────────────────────────────────────────────────────
export type UserRole =
  | 'Estudiante'
  | 'Docente'
  | 'Técnico_Laboratorio'
  | 'Administrador_Laboratorio';

// ─── Usuario ─────────────────────────────────────────────────────────────────
export interface User {
  idUsuario: string; // UUID v4
  idRol: UserRole;
  nombre: string;
  correo: string;
  cedula: string;
  carnet?: string; // solo Estudiante
  contrasena: string; // hash simulado
  fechaRegistro: string; // ISO 8601
  sanctionEndDate?: string; // ISO 8601 — Post-MVP
  totpEnabled?: boolean;
}

// ─── Estado de Recurso ───────────────────────────────────────────────────────
export type ResourceStatus =
  | 'Disponible'
  | 'Reservado'
  | 'En_Préstamo'
  | 'En_Mantenimiento'
  | 'Dado_de_Baja';

// ─── Tipo de Recurso ─────────────────────────────────────────────────────────
export type ResourceType = 'Equipo' | 'Herramienta' | 'Material';

// ─── Recurso ─────────────────────────────────────────────────────────────────
export interface Resource {
  idRecurso: string; // UUID v4
  nombre: string; // max 100 chars
  codigoInventario: string;
  tipo: ResourceType;
  descripcion: string;
  imagenUrl?: string;
  cantidadTotal: number; // entero > 0
  cantidadDisponible: number; // 0..cantidadTotal
  estadoActual: ResourceStatus;
  fechaCreacion: string; // ISO 8601
}

// ─── Historial de estado de recurso ──────────────────────────────────────────
export interface ResourceStatusHistory {
  idEstado: string;
  idRecurso: string;
  estado: ResourceStatus;
  fechaCambio: string; // ISO 8601
  motivo?: string;
}

// ─── Estado de Préstamo ──────────────────────────────────────────────────────
export type LoanStatus =
  | 'Reservado'
  | 'En_Préstamo'
  | 'Devuelto'
  | 'Cancelado'
  | 'Vencido';

// ─── Condición de recurso al registrar entrega/devolución ────────────────────
export type ResourceCondition = 'Bueno' | 'Regular' | 'Dañado';

// ─── Préstamo ─────────────────────────────────────────────────────────────────
export interface Loan {
  idPrestamo: string; // UUID v4
  idUsuario: string;
  idRecurso: string;
  idSerie?: string; // presente si el préstamo pertenece a una recurrencia
  fechaHoraReserva: string; // ISO 8601 — cuando se creó la reserva
  fechaHoraInicioProgramada: string; // ISO 8601 — inicio solicitado
  fechaHoraFinProgramada: string; // ISO 8601 — fin solicitado
  fechaHoraEntrega?: string; // ISO 8601 — registrada por Técnico
  fechaHoraDevolucionReal?: string; // ISO 8601 — registrada por Técnico
  estadoPrestamo: LoanStatus;
  motivoPrestamo: string; // 10..500 chars
  condicionEntrega?: ResourceCondition;
  condicionDevolucion?: ResourceCondition;
  observacionesEntrega?: string;
  observacionesDevolucion?: string;
  retrasoHoras?: number; // max(0, devReal - finProgramada) en horas
}

// ─── Sanción (Post-MVP) ───────────────────────────────────────────────────────
export type SanctionStatus = 'Activa' | 'Expirada';

export interface Sanction {
  idSancion: string;
  idUsuario: string;
  idPrestamo: string;
  fechaInicio: string; // ISO 8601
  fechaFin: string; // ISO 8601
  motivo: string;
  estado: SanctionStatus;
}

// ─── Sesión simulada ──────────────────────────────────────────────────────────
export interface Session {
  userId: string;
  role: UserRole;
  nombre: string;
  correo: string;
  expiresAt: string; // ISO 8601
}

// ─── Datos de formularios ─────────────────────────────────────────────────────
export interface RegisterFormData {
  nombre: string;
  correo: string;
  contrasena: string;
  confirmacionContrasena: string;
  cedula: string;
  carnet?: string;
}

export interface LoanFormData {
  idRecurso: string;
  fechaHoraInicioProgramada: string;
  fechaHoraFinProgramada: string;
  motivoPrestamo: string;
}

export interface CreateResourceData {
  nombre: string;
  codigoInventario: string;
  tipo: ResourceType;
  descripcion: string;
  imagenUrl?: string;
  cantidadTotal: number;
}

export interface DeliveryData {
  condicion: ResourceCondition;
  observaciones?: string;
}

export interface ReturnData {
  condicion: ResourceCondition;
  observaciones?: string;
}

// ─── Filtros de consulta de recursos ──────────────────────────────────────────
export interface ResourceFilters {
  nombre?: string
  tipo?: ResourceType
  estado?: ResourceStatus
}

export interface ResourceAvailability {
  disponible: boolean
  cantidadDisponible: number
  reservasActivas: number
  proximaDisponibilidad?: string
}

// ─── Notificaciones (toasts) ──────────────────────────────────────────────────
export type ToastType = 'success' | 'error' | 'info';

// ─── Resultado de operación ───────────────────────────────────────────────────
export interface OperationResult<T = void> {
  success: boolean
  data?: T
  error?: string
}

/** Una operación puede resolverse de inmediato (mock) o de forma asíncrona (API). */
export type MaybePromise<T> = T | Promise<T>

/** Resultado del login: puede pedir un segundo factor antes de crear la sesión. */
export interface AuthLoginResult extends OperationResult<Session> {
  requires2fa?: boolean
  challengeToken?: string
}

export interface PasswordResetRequestInfo {
  message: string
  resetToken?: string
  resetUrl?: string
  expiresAt?: string
}

export interface PasswordResetConfirmData {
  token: string
  nuevaContrasena: string
  confirmacionContrasena: string
}

export interface Notification {
  idNotificacion: string
  idUsuario: string
  idRecurso?: string
  mensaje: string
  leida: boolean
  fechaCreacion: string
  fechaLectura?: string
}

export interface AvailabilityRequest {
  idSolicitud: string
  idUsuario: string
  idRecurso: string
  activa: boolean
  fechaCreacion: string
  fechaCumplida?: string
}

export interface RecurringLoanData {
  idRecurso: string
  diasSemana: number[]
  horaInicio: string
  horaFin: string
  fechaInicio: string
  fechaFin: string
  motivoPrestamo: string
  crearSoloDisponibles?: boolean
}

export interface LoanSeries {
  idSerie: string
  idUsuario: string
  idRecurso: string
  diasSemana: number[]
  horaInicio: string
  horaFin: string
  fechaInicio: string
  fechaFin: string
  motivoPrestamo: string
  fechaCreacion: string
}

export interface RecurringLoanResult {
  serie: LoanSeries
  prestamos: Loan[]
  conflictos: string[]
  omitidos: string[]
}

export interface CalendarReservation {
  idPrestamo: string
  fechaHoraInicio: string
  fechaHoraFin: string
  estado: LoanStatus
  propio: boolean
  usuario?: string
}

export interface CalendarSlot {
  horaInicio: string
  horaFin: string
  disponible: boolean
  reservasActivas: number
}

export interface CalendarDay {
  fecha: string
  disponible: boolean
  cantidadDisponible: number
  reservas: CalendarReservation[]
  franjas: CalendarSlot[]
}

export interface ResourceCalendar {
  idRecurso: string
  desde: string
  hasta: string
  dias: CalendarDay[]
}

export interface ReportRow {
  idPrestamo: string
  fecha: string
  recurso: string
  estudiante: string
  estado: LoanStatus
  tipoRecurso: ResourceType
  idRecurso: string
  idUsuario: string
  retrasoHoras?: number
}

export interface ReportStats {
  totalPrestamos: number
  prestamosConDemora: number
  promedioDuracionHoras: number
  recursoMasSolicitado?: string
  recursoMasSolicitadoCantidad: number
}

export interface LoanReport {
  filas: ReportRow[]
  estadisticas: ReportStats
}

export interface DashboardSummary {
  rol: UserRole
  totalRecursos: number
  recursosDisponibles: number
  recursosEnMantenimiento: number
  prestamosActivos: number
  reservasPendientes: number
  entregasPendientes: number
  devolucionesPendientes: number
  sancionesActivas: number
  notificacionesNoLeidas: number
  misPrestamosActivos: number
}

export interface TwoFactorSetup {
  secret: string
  otpauthUri: string
  qrSvg: string
}

export interface ReportFilters {
  desde?: string
  hasta?: string
  idRecurso?: string
  tipoRecurso?: ResourceType
  estado?: LoanStatus
  idUsuario?: string
}
