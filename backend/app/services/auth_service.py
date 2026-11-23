from __future__ import annotations

import hashlib
import secrets
from datetime import UTC, datetime, timedelta

import jwt
import pyotp
import segno
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.core.config import get_settings
from app.core.errors import bad_request, not_found, unauthorized
from app.core.security import (
    create_access_token,
    decode_access_token,
    hash_password,
    verify_password,
)
from app.domain.enums import UserRole
from app.domain.validators import now_utc
from app.models import PasswordResetToken, User
from app.schemas.auth import (
    LoginRequest,
    LoginResponse,
    PasswordResetConfirmRequest,
    PasswordResetRequest,
    PasswordResetRequestResponse,
    RegisterRequest,
    SessionResponse,
    TwoFactorSetupResponse,
    TwoFactorVerifyRequest,
)

GENERIC_LOGIN_ERROR = "Correo o contraseña incorrectos."
GENERIC_RESET_MESSAGE = (
    "Si el correo está registrado, recibirás un enlace para restablecer tu contraseña."
)


def _hash_token(token: str) -> str:
    return hashlib.sha256(token.encode("utf-8")).hexdigest()


def get_user_by_email(db: Session, correo: str) -> User | None:
    return db.scalar(select(User).where(func.lower(User.correo) == correo.strip().lower()))


def get_user(db: Session, user_id: str) -> User:
    user = db.get(User, user_id)
    if user is None:
        raise not_found("Usuario")
    return user


def register_user(db: Session, data: RegisterRequest) -> User:
    if get_user_by_email(db, data.correo) is not None:
        raise bad_request("El correo ya está registrado.")
    user = User(
        nombre=data.nombre.strip(),
        correo=data.correo.strip(),
        cedula=data.cedula.strip(),
        carnet=data.carnet.strip() if data.carnet else None,
        role=UserRole.ESTUDIANTE,
        contrasena_hash=hash_password(data.contrasena),
    )
    db.add(user)
    db.flush()
    return user


def authenticate(db: Session, correo: str, contrasena: str) -> User:
    user = get_user_by_email(db, correo)
    if user is None or not verify_password(contrasena, user.contrasena_hash):
        raise unauthorized(GENERIC_LOGIN_ERROR)
    return user


def _issue_session(user: User) -> LoginResponse:
    settings = get_settings()
    expires_at = now_utc() + timedelta(minutes=settings.access_token_expire_minutes)
    token = create_access_token(user.id, user.role.value)
    session = SessionResponse(
        user_id=user.id,
        role=user.role,
        nombre=user.nombre,
        correo=user.correo,
        expires_at=expires_at,
    )
    return LoginResponse(token=token, session=session)


def _issue_login(user: User) -> LoginResponse:
    settings = get_settings()
    if user.totp_enabled:
        challenge = create_access_token(
            user.id,
            user.role.value,
            expires_minutes=settings.two_factor_challenge_minutes,
            token_type="2fa_challenge",
        )
        return LoginResponse(requires_2fa=True, challenge_token=challenge)
    return _issue_session(user)


def login(db: Session, data: LoginRequest) -> LoginResponse:
    user = authenticate(db, data.correo, data.contrasena)
    if user.locked_until is not None and user.locked_until > now_utc():
        raise unauthorized("La cuenta está bloqueada temporalmente por intentos fallidos de 2FA.")
    return _issue_login(user)


def verify_two_factor(db: Session, data: TwoFactorVerifyRequest) -> LoginResponse:
    settings = get_settings()
    try:
        payload = decode_access_token(data.challenge_token)
    except jwt.PyJWTError as exc:
        raise unauthorized("El token de verificación es inválido o expiró.") from exc
    if payload.get("type") != "2fa_challenge":
        raise unauthorized("El token de verificación es inválido.")
    user = get_user(db, str(payload.get("sub")))
    now = now_utc()
    if user.locked_until is not None and user.locked_until > now:
        raise unauthorized(
            "La cuenta está bloqueada temporalmente. Intenta de nuevo en 15 minutos."
        )
    if not user.totp_enabled or not user.totp_secret:
        raise bad_request("La autenticación de dos factores no está habilitada.")
    if pyotp.TOTP(user.totp_secret).verify(data.codigo, valid_window=1):
        user.failed_2fa_attempts = 0
        user.locked_until = None
        db.flush()
        return _issue_session(user)

    user.failed_2fa_attempts += 1
    remaining = settings.two_factor_max_attempts - user.failed_2fa_attempts
    if remaining <= 0:
        user.failed_2fa_attempts = 0
        user.locked_until = now + timedelta(minutes=settings.two_factor_lock_minutes)
        db.flush()
        raise unauthorized(
            "Demasiados intentos fallidos. La cuenta quedó bloqueada por 15 minutos."
        )
    db.flush()
    raise unauthorized(f"Código inválido. Te quedan {remaining} intentos.")


def setup_two_factor(db: Session, user: User) -> TwoFactorSetupResponse:
    if user.totp_enabled:
        raise bad_request("La autenticación de dos factores ya está habilitada.")
    settings = get_settings()
    secret = pyotp.random_base32()
    user.totp_secret = secret
    db.flush()
    uri = pyotp.TOTP(secret).provisioning_uri(
        name=user.correo,
        issuer_name=settings.app_name,
    )
    qr_svg = segno.make(uri).svg_data_uri(scale=5)
    return TwoFactorSetupResponse(secret=secret, otpauth_uri=uri, qr_svg=qr_svg)


def enable_two_factor(db: Session, user: User, codigo: str) -> User:
    if not user.totp_secret:
        raise bad_request("Primero debes generar el secreto de dos factores.")
    if not pyotp.TOTP(user.totp_secret).verify(codigo, valid_window=1):
        raise bad_request("Código de verificación inválido.")
    user.totp_enabled = True
    db.flush()
    return user


def disable_two_factor(db: Session, user: User, contrasena: str) -> User:
    if not verify_password(contrasena, user.contrasena_hash):
        raise bad_request("La contraseña es incorrecta.")
    user.totp_enabled = False
    user.totp_secret = None
    user.failed_2fa_attempts = 0
    user.locked_until = None
    db.flush()
    return user


def request_password_reset(
    db: Session,
    data: PasswordResetRequest,
) -> PasswordResetRequestResponse:
    settings = get_settings()
    user = get_user_by_email(db, data.correo)
    if user is None:
        return PasswordResetRequestResponse(message=GENERIC_RESET_MESSAGE)

    raw_token = secrets.token_urlsafe(32)
    expires_at = now_utc() + timedelta(minutes=settings.password_reset_expire_minutes)
    db.add(
        PasswordResetToken(
            user_id=user.id,
            token_hash=_hash_token(raw_token),
            expires_at=expires_at,
        )
    )
    db.flush()
    reset_url = f"{settings.frontend_url.rstrip('/')}/reset-password?token={raw_token}"
    return PasswordResetRequestResponse(
        message=GENERIC_RESET_MESSAGE,
        reset_token=raw_token if settings.expose_reset_token else None,
        reset_url=reset_url if settings.expose_reset_token else None,
        expires_at=expires_at if settings.expose_reset_token else None,
    )


def confirm_password_reset(db: Session, data: PasswordResetConfirmRequest) -> User:
    token = db.scalar(
        select(PasswordResetToken).where(PasswordResetToken.token_hash == _hash_token(data.token))
    )
    if token is None or token.used_at is not None or token.expires_at <= now_utc():
        raise bad_request("El enlace de recuperación es inválido o expiró.")
    user = get_user(db, token.user_id)
    user.contrasena_hash = hash_password(data.nueva_contrasena)
    token.used_at = datetime.now(UTC)
    db.flush()
    return user
