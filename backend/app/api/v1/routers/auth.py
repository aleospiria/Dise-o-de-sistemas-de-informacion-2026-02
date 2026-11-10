from __future__ import annotations

from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from app.api.deps import get_current_user
from app.db.session import get_db
from app.models import User
from app.schemas.auth import (
    LoginRequest,
    LoginResponse,
    PasswordResetConfirmRequest,
    PasswordResetRequest,
    PasswordResetRequestResponse,
    RegisterRequest,
    TwoFactorDisableRequest,
    TwoFactorEnableRequest,
    TwoFactorSetupResponse,
    TwoFactorVerifyRequest,
)
from app.schemas.common import Envelope, MessageResponse, ok
from app.schemas.user import UserResponse
from app.services import auth_service

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post(
    "/register",
    response_model=Envelope[UserResponse],
    status_code=status.HTTP_201_CREATED,
)
def register(data: RegisterRequest, db: Session = Depends(get_db)) -> Envelope[UserResponse]:
    user = auth_service.register_user(db, data)
    return ok(UserResponse.model_validate(user))


@router.post("/login", response_model=Envelope[LoginResponse])
def login(data: LoginRequest, db: Session = Depends(get_db)) -> Envelope[LoginResponse]:
    return ok(auth_service.login(db, data))


@router.post("/2fa/verify", response_model=Envelope[LoginResponse])
def verify_two_factor(
    data: TwoFactorVerifyRequest,
    db: Session = Depends(get_db),
) -> Envelope[LoginResponse]:
    return ok(auth_service.verify_two_factor(db, data))


@router.get("/me", response_model=Envelope[UserResponse])
def me(user: User = Depends(get_current_user)) -> Envelope[UserResponse]:
    return ok(UserResponse.model_validate(user))


@router.post("/2fa/setup", response_model=Envelope[TwoFactorSetupResponse])
def setup_two_factor(
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> Envelope[TwoFactorSetupResponse]:
    return ok(auth_service.setup_two_factor(db, user))


@router.post("/2fa/enable", response_model=Envelope[UserResponse])
def enable_two_factor(
    data: TwoFactorEnableRequest,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> Envelope[UserResponse]:
    updated = auth_service.enable_two_factor(db, user, data.codigo)
    return ok(UserResponse.model_validate(updated))


@router.post("/2fa/disable", response_model=Envelope[UserResponse])
def disable_two_factor(
    data: TwoFactorDisableRequest,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> Envelope[UserResponse]:
    updated = auth_service.disable_two_factor(db, user, data.contrasena)
    return ok(UserResponse.model_validate(updated))


@router.post(
    "/password-reset/request",
    response_model=Envelope[PasswordResetRequestResponse],
)
def request_password_reset(
    data: PasswordResetRequest,
    db: Session = Depends(get_db),
) -> Envelope[PasswordResetRequestResponse]:
    return ok(auth_service.request_password_reset(db, data))


@router.post(
    "/password-reset/confirm",
    response_model=Envelope[MessageResponse],
)
def confirm_password_reset(
    data: PasswordResetConfirmRequest,
    db: Session = Depends(get_db),
) -> Envelope[MessageResponse]:
    auth_service.confirm_password_reset(db, data)
    return ok(MessageResponse(message="Contraseña actualizada correctamente."))
