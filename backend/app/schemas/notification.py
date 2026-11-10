from __future__ import annotations

from datetime import datetime

from pydantic import Field

from app.schemas.common import ApiModel


class NotificationResponse(ApiModel):
    id_notificacion: str = Field(validation_alias="id")
    id_usuario: str = Field(validation_alias="user_id")
    id_recurso: str | None = Field(default=None, validation_alias="resource_id")
    mensaje: str
    leida: bool
    fecha_creacion: datetime
    fecha_lectura: datetime | None = None


class AvailabilityRequestResponse(ApiModel):
    id_solicitud: str = Field(validation_alias="id")
    id_usuario: str = Field(validation_alias="user_id")
    id_recurso: str = Field(validation_alias="resource_id")
    activa: bool
    fecha_creacion: datetime
    fecha_cumplida: datetime | None = None


class AvailabilityRequestCreate(ApiModel):
    id_recurso: str
