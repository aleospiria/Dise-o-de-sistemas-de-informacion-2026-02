from __future__ import annotations

from datetime import datetime

from pydantic import Field, field_validator

from app.domain.enums import UserRole
from app.domain.validators import validate_email
from app.schemas.common import ApiModel


class UserResponse(ApiModel):
    id_usuario: str = Field(validation_alias="id")
    id_rol: UserRole = Field(validation_alias="role")
    nombre: str
    correo: str
    cedula: str
    carnet: str | None = None
    fecha_registro: datetime
    sanction_end_date: datetime | None = None
    totp_enabled: bool = False


class UserUpdateRequest(ApiModel):
    nombre: str | None = Field(default=None, min_length=1, max_length=120)
    correo: str | None = Field(default=None, min_length=3, max_length=255)
    cedula: str | None = Field(default=None, min_length=1, max_length=30)
    carnet: str | None = Field(default=None, max_length=30)
    id_rol: UserRole | None = None

    @field_validator("correo")
    @classmethod
    def _validate_correo(cls, value: str | None) -> str | None:
        if value is not None and not validate_email(value):
            raise ValueError("Ingresa un correo electrónico válido.")
        return value
