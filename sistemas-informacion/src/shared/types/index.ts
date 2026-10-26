/**
 * Tipos e interfaces globales del dominio.
 * Fuente: design.md — sección "Data Models".
 * Todas las fechas se representan como cadenas ISO 8601.
 */

// ─── Roles ───────────────────────────────────────────────────────────────────
export type UserRole =
  | 'Estudiante'
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
  idRol: UserRole;
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
  nombre?: string;
  tipo?: ResourceType;
  estado?: ResourceStatus;
}

// ─── Notificaciones (toasts) ──────────────────────────────────────────────────
export type ToastType = 'success' | 'error' | 'info';

// ─── Resultado de operación ───────────────────────────────────────────────────
export interface OperationResult<T = void> {
  success: boolean;
  data?: T;
  error?: string;
}
