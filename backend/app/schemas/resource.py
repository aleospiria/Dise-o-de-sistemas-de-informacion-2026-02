from __future__ import annotations

from datetime import date, datetime

from pydantic import Field, field_validator

from app.domain.enums import LoanStatus, ResourceStatus, ResourceType
from app.domain.validators import validate_quantity, validate_resource_name
from app.schemas.common import ApiModel


class ResourceCreateRequest(ApiModel):
    nombre: str = Field(min_length=1, max_length=100)
    codigo_inventario: str = Field(min_length=1, max_length=50)
    tipo: ResourceType
    descripcion: str = Field(default="", max_length=2000)
    imagen_url: str | None = None
    cantidad_total: int

    @field_validator("nombre")
    @classmethod
    def _validate_nombre(cls, value: str) -> str:
        if not validate_resource_name(value):
            raise ValueError("El nombre es obligatorio y no debe superar 100 caracteres.")
        return value

    @field_validator("cantidad_total")
    @classmethod
    def _validate_cantidad(cls, value: int) -> int:
        if not validate_quantity(value):
            raise ValueError("La cantidad debe ser un número entero mayor que 0.")
        return value


class ResourceUpdateRequest(ApiModel):
    nombre: str | None = Field(default=None, min_length=1, max_length=100)
    codigo_inventario: str | None = Field(default=None, min_length=1, max_length=50)
    tipo: ResourceType | None = None
    descripcion: str | None = Field(default=None, max_length=2000)
    imagen_url: str | None = None
    cantidad_total: int | None = None

    @field_validator("nombre")
    @classmethod
    def _validate_nombre(cls, value: str | None) -> str | None:
        if value is not None and not validate_resource_name(value):
            raise ValueError("El nombre es obligatorio y no debe superar 100 caracteres.")
        return value

    @field_validator("cantidad_total")
    @classmethod
    def _validate_cantidad(cls, value: int | None) -> int | None:
        if value is not None and not validate_quantity(value):
            raise ValueError("La cantidad debe ser un número entero mayor que 0.")
        return value


class ResourceStatusUpdateRequest(ApiModel):
    nuevo_estado: ResourceStatus
    motivo: str | None = Field(default=None, max_length=500)


class ResourceResponse(ApiModel):
    id_recurso: str = Field(validation_alias="id")
    nombre: str
    codigo_inventario: str
    tipo: ResourceType
    descripcion: str
    imagen_url: str | None = None
    cantidad_total: int
    cantidad_disponible: int
    estado_actual: ResourceStatus
    fecha_creacion: datetime


class ResourceStatusHistoryResponse(ApiModel):
    id_estado: str = Field(validation_alias="id")
    id_recurso: str = Field(validation_alias="resource_id")
    estado: ResourceStatus
    fecha_cambio: datetime
    motivo: str | None = None


class AvailabilityResponse(ApiModel):
    disponible: bool
    cantidad_disponible: int
    reservas_activas: int
    proxima_disponibilidad: datetime | None = None


class ResourceAvailabilityResponse(ResourceResponse):
    disponible: bool
    reservas_activas: int
    proxima_disponibilidad: datetime | None = None


class CalendarReservation(ApiModel):
    id_prestamo: str
    fecha_hora_inicio: datetime
    fecha_hora_fin: datetime
    estado: LoanStatus
    propio: bool = False
    usuario: str | None = None


class CalendarSlot(ApiModel):
    hora_inicio: datetime
    hora_fin: datetime
    disponible: bool
    reservas_activas: int


class CalendarDay(ApiModel):
    fecha: date
    disponible: bool
    cantidad_disponible: int
    reservas: list[CalendarReservation] = Field(default_factory=list)
    franjas: list[CalendarSlot] = Field(default_factory=list)


class ResourceCalendarResponse(ApiModel):
    id_recurso: str
    desde: date
    hasta: date
    dias: list[CalendarDay] = Field(default_factory=list)


class ResourceImportRow(ApiModel):
    fila: int
    id_recurso: str | None = None
    nombre: str
    codigo_inventario: str
    tipo: ResourceType
    descripcion: str = ""
    imagen_url: str | None = None
    cantidad_total: int
    cantidad_disponible: int
    estado_actual: ResourceStatus


class ResourceImportError(ApiModel):
    fila: int
    error: str


class ResourceImportResult(ApiModel):
    confirmado: bool
    total_filas: int
    filas_validas: int
    creados: int = 0
    actualizados: int = 0
    filas: list[ResourceImportRow] = Field(default_factory=list)
    errores: list[ResourceImportError] = Field(default_factory=list)
