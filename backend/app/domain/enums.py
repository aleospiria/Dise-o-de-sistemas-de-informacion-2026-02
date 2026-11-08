from enum import StrEnum


class UserRole(StrEnum):
    ESTUDIANTE = "Estudiante"
    TECNICO_LABORATORIO = "Técnico_Laboratorio"
    ADMINISTRADOR_LABORATORIO = "Administrador_Laboratorio"


class ResourceStatus(StrEnum):
    DISPONIBLE = "Disponible"
    RESERVADO = "Reservado"
    EN_PRESTAMO = "En_Préstamo"
    EN_MANTENIMIENTO = "En_Mantenimiento"
    DADO_DE_BAJA = "Dado_de_Baja"


class ResourceType(StrEnum):
    EQUIPO = "Equipo"
    HERRAMIENTA = "Herramienta"
    MATERIAL = "Material"


class LoanStatus(StrEnum):
    RESERVADO = "Reservado"
    EN_PRESTAMO = "En_Préstamo"
    DEVUELTO = "Devuelto"
    CANCELADO = "Cancelado"
    VENCIDO = "Vencido"


class ResourceCondition(StrEnum):
    BUENO = "Bueno"
    REGULAR = "Regular"
    DANADO = "Dañado"


class SanctionStatus(StrEnum):
    ACTIVA = "Activa"
    EXPIRADA = "Expirada"
