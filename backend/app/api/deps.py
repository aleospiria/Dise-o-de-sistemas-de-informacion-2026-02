from __future__ import annotations

from collections.abc import Callable

import jwt
from fastapi import Depends
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy.orm import Session

from app.core.errors import forbidden, unauthorized
from app.core.security import decode_access_token
from app.db.session import get_db
from app.domain.enums import UserRole
from app.models import User

bearer_scheme = HTTPBearer(auto_error=False)


def get_current_user(
    credentials: HTTPAuthorizationCredentials | None = Depends(bearer_scheme),
    db: Session = Depends(get_db),
) -> User:
    if credentials is None:
        raise unauthorized("Token de acceso requerido.")
    try:
        payload = decode_access_token(credentials.credentials)
    except jwt.PyJWTError as exc:
        raise unauthorized("Token inválido o expirado.") from exc
    if payload.get("type") != "access":
        raise unauthorized("Token inválido para esta operación.")
    user = db.get(User, str(payload.get("sub")))
    if user is None:
        raise unauthorized("Usuario no encontrado.")
    return user


def require_roles(*roles: UserRole) -> Callable[..., User]:
    def dependency(user: User = Depends(get_current_user)) -> User:
        if user.role not in roles:
            raise forbidden("No tienes permisos para esta acción.")
        return user

    return dependency


require_admin = require_roles(UserRole.ADMINISTRADOR_LABORATORIO)
require_staff = require_roles(
    UserRole.ADMINISTRADOR_LABORATORIO,
    UserRole.TECNICO_LABORATORIO,
)
