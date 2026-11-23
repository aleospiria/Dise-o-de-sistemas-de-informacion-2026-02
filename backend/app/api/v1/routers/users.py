from __future__ import annotations

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.api.deps import get_current_user, require_staff
from app.core.errors import forbidden
from app.db.session import get_db
from app.domain.enums import UserRole
from app.models import User
from app.schemas.common import Envelope, ok
from app.schemas.user import UserResponse, UserUpdateRequest
from app.services import user_service

router = APIRouter(prefix="/users", tags=["users"])


@router.get("", response_model=Envelope[list[UserResponse]])
def list_users(
    rol: UserRole | None = Query(default=None),
    nombre: str | None = Query(default=None),
    _: User = Depends(require_staff),
    db: Session = Depends(get_db),
) -> Envelope[list[UserResponse]]:
    users = user_service.list_users(db, rol=rol, nombre=nombre)
    return ok([UserResponse.model_validate(user) for user in users])


@router.get("/{user_id}", response_model=Envelope[UserResponse])
def get_user(
    user_id: str,
    actor: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> Envelope[UserResponse]:
    if actor.role in (UserRole.ESTUDIANTE, UserRole.DOCENTE) and actor.id != user_id:
        raise forbidden("No puedes acceder al perfil de otro usuario.")
    return ok(UserResponse.model_validate(user_service.get_user(db, user_id)))


@router.patch("/{user_id}", response_model=Envelope[UserResponse])
def update_user(
    user_id: str,
    data: UserUpdateRequest,
    actor: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> Envelope[UserResponse]:
    updated = user_service.update_user(db, actor, user_id, data)
    return ok(UserResponse.model_validate(updated))
