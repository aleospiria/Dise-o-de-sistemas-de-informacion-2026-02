from __future__ import annotations

from datetime import datetime

from pydantic import EmailStr, Field, field_validator, model_validator

from app.domain.enums import UserRole
from app.domain.validators import validate_email, validate_password
from app.schemas.common import ApiModel


class RegisterRequest(ApiModel):
    nombre: str = Field(min_length=1, max_length=120)
    correo: str = Field(min_length=3, max_length=255)
    contrasena: str
    confirmacion_contrasena: str
    id_rol: UserRole
    cedula: str = Field(min_length=1, max_length=30)
    carnet: str | None = Field(default=None, max_length=30)

    @field_validator("correo")
    @classmethod
    def _validate_correo(cls, value: str) -> str:
        if not validate_email(value):
            raise ValueError("Ingresa un correo electrónico válido.")
        return value

    @field_validator("contrasena")
    @classmethod
    def _validate_contrasena(cls, value: str) -> str:
        if not validate_password(value):
            raise ValueError(
                "La contraseña debe tener mínimo 8 caracteres, con mayúscula, minúscula y número."
            )
        return value

    @model_validator(mode="after")
    def _passwords_match(self) -> RegisterRequest:
        if self.contrasena != self.confirmacion_contrasena:
            raise ValueError("Las contraseñas no coinciden.")
        return self


class LoginRequest(ApiModel):
    correo: str
    contrasena: str


class SessionResponse(ApiModel):
    user_id: str
    role: UserRole
    nombre: str
    correo: str
    expires_at: datetime


class LoginResponse(ApiModel):
    requires_2fa: bool = False
    challenge_token: str | None = None
    token: str | None = None
    session: SessionResponse | None = None


class TwoFactorVerifyRequest(ApiModel):
    challenge_token: str
    codigo: str = Field(min_length=6, max_length=6)


class TwoFactorSetupResponse(ApiModel):
    secret: str
    otpauth_uri: str
    qr_svg: str


class TwoFactorEnableRequest(ApiModel):
    codigo: str = Field(min_length=6, max_length=6)


class TwoFactorDisableRequest(ApiModel):
    contrasena: str


class PasswordResetRequest(ApiModel):
    correo: str

    @field_validator("correo")
    @classmethod
    def _validate_correo(cls, value: str) -> str:
        if not validate_email(value):
            raise ValueError("Ingresa un correo electrónico válido.")
        return value


class PasswordResetRequestResponse(ApiModel):
    message: str
    reset_token: str | None = None
    reset_url: str | None = None
    expires_at: datetime | None = None


class PasswordResetConfirmRequest(ApiModel):
    token: str = Field(min_length=10)
    nueva_contrasena: str
    confirmacion_contrasena: str

    @field_validator("nueva_contrasena")
    @classmethod
    def _validate_contrasena(cls, value: str) -> str:
        if not validate_password(value):
            raise ValueError(
                "La contraseña debe tener mínimo 8 caracteres, con mayúscula, minúscula y número."
            )
        return value

    @model_validator(mode="after")
    def _passwords_match(self) -> PasswordResetConfirmRequest:
        if self.nueva_contrasena != self.confirmacion_contrasena:
            raise ValueError("Las contraseñas no coinciden.")
        return self


class EmailRequest(ApiModel):
    correo: EmailStr
