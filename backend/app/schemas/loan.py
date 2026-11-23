from __future__ import annotations

from datetime import date, datetime, time

from pydantic import Field, field_validator, model_validator

from app.domain.enums import LoanStatus, ResourceCondition
from app.domain.validators import (
    ensure_aware,
    validate_motivo,
    validate_observaciones,
)
from app.schemas.common import ApiModel


class LoanCreateRequest(ApiModel):
    id_recurso: str
    fecha_hora_inicio_programada: datetime
    fecha_hora_fin_programada: datetime
    motivo_prestamo: str = Field(max_length=500)

    @field_validator("fecha_hora_inicio_programada", "fecha_hora_fin_programada")
    @classmethod
    def _ensure_aware(cls, value: datetime) -> datetime:
        return ensure_aware(value)

    @field_validator("motivo_prestamo")
    @classmethod
    def _validate_motivo(cls, value: str) -> str:
        if not validate_motivo(value):
            raise ValueError("El motivo del préstamo debe tener entre 10 y 500 caracteres.")
        return value


class LoanResponse(ApiModel):
    id_prestamo: str = Field(validation_alias="id")
    id_usuario: str = Field(validation_alias="user_id")
    id_recurso: str = Field(validation_alias="resource_id")
    id_serie: str | None = Field(default=None, validation_alias="series_id")
    fecha_hora_reserva: datetime
    fecha_hora_inicio_programada: datetime
    fecha_hora_fin_programada: datetime
    fecha_hora_entrega: datetime | None = None
    fecha_hora_devolucion_real: datetime | None = None
    fecha_hora_cancelacion: datetime | None = None
    estado_prestamo: LoanStatus
    motivo_prestamo: str
    condicion_entrega: ResourceCondition | None = None
    condicion_devolucion: ResourceCondition | None = None
    observaciones_entrega: str | None = None
    observaciones_devolucion: str | None = None
    retraso_horas: float | None = None


class LoanSeriesResponse(ApiModel):
    id_serie: str = Field(validation_alias="id")
    id_usuario: str = Field(validation_alias="user_id")
    id_recurso: str = Field(validation_alias="resource_id")
    dias_semana: list[int]
    hora_inicio: time
    hora_fin: time
    fecha_inicio: date
    fecha_fin: date
    motivo_prestamo: str
    fecha_creacion: datetime


class RecurringLoanRequest(ApiModel):
    id_recurso: str
    dias_semana: list[int] = Field(min_length=1, max_length=7)
    hora_inicio: time
    hora_fin: time
    fecha_inicio: date
    fecha_fin: date
    motivo_prestamo: str = Field(max_length=500)
    crear_solo_disponibles: bool = False

    @field_validator("dias_semana")
    @classmethod
    def _validate_dias(cls, value: list[int]) -> list[int]:
        if any(day < 0 or day > 6 for day in value):
            raise ValueError("Los días de la semana deben estar entre 0 (domingo) y 6 (sábado).")
        if len(set(value)) != len(value):
            raise ValueError("Los días de la semana no deben repetirse.")
        return sorted(value)

    @field_validator("motivo_prestamo")
    @classmethod
    def _validate_motivo(cls, value: str) -> str:
        if not validate_motivo(value):
            raise ValueError("El motivo del préstamo debe tener entre 10 y 500 caracteres.")
        return value

    @model_validator(mode="after")
    def _validate_rango(self) -> RecurringLoanRequest:
        if self.hora_fin <= self.hora_inicio:
            raise ValueError("La hora de fin debe ser posterior a la hora de inicio.")
        if self.fecha_fin <= self.fecha_inicio:
            raise ValueError("La fecha de finalización debe ser posterior a la fecha de inicio.")
        if (self.fecha_fin - self.fecha_inicio).days > 84:
            raise ValueError("La reserva recurrente no puede superar 12 semanas.")
        return self


class RecurringLoanResponse(ApiModel):
    serie: LoanSeriesResponse
    prestamos: list[LoanResponse] = Field(default_factory=list)
    conflictos: list[datetime] = Field(default_factory=list)
    omitidos: list[datetime] = Field(default_factory=list)


class DeliveryRequest(ApiModel):
    condicion: ResourceCondition
    observaciones: str | None = Field(default=None, max_length=500)

    @field_validator("observaciones")
    @classmethod
    def _validate_observaciones(cls, value: str | None) -> str | None:
        if not validate_observaciones(value):
            raise ValueError("Las observaciones no pueden superar 500 caracteres.")
        return value


class ReturnRequest(DeliveryRequest):
    pass
