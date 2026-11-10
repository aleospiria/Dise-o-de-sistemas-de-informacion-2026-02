from __future__ import annotations

from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.core.errors import bad_request, forbidden, not_found
from app.domain.enums import UserRole
from app.models import User
from app.schemas.user import UserUpdateRequest


def get_user(db: Session, user_id: str) -> User:
    user = db.get(User, user_id)
    if user is None:
        raise not_found("Usuario")
    return user


def list_users(
    db: Session,
    rol: UserRole | None = None,
    nombre: str | None = None,
) -> list[User]:
    statement = select(User)
    if rol is not None:
        statement = statement.where(User.role == rol)
    if nombre:
        statement = statement.where(User.nombre.ilike(f"%{nombre.strip()}%"))
    statement = statement.order_by(func.lower(User.nombre))
    return list(db.scalars(statement).all())


def update_user(
    db: Session,
    actor: User,
    user_id: str,
    data: UserUpdateRequest,
) -> User:
    user = get_user(db, user_id)
    is_admin = actor.role == UserRole.ADMINISTRADOR_LABORATORIO
    if not is_admin and actor.id != user.id:
        raise forbidden("Solo puedes editar tu propio perfil.")

    changes = data.model_dump(exclude_unset=True)
    if "id_rol" in changes and changes["id_rol"] is not None:
        if not is_admin:
            raise forbidden("Solo un administrador puede cambiar el rol.")
        user.role = changes.pop("id_rol")
    if "correo" in changes and changes["correo"] is not None:
        new_email = changes["correo"].strip()
        duplicate = db.scalar(
            select(User).where(
                func.lower(User.correo) == new_email.lower(),
                User.id != user.id,
            )
        )
        if duplicate is not None:
            raise bad_request("El correo ya está registrado.")
        changes["correo"] = new_email
    if "nombre" in changes and changes["nombre"] is not None:
        changes["nombre"] = changes["nombre"].strip()
    if "cedula" in changes and changes["cedula"] is not None:
        changes["cedula"] = changes["cedula"].strip()
    if "carnet" in changes and changes["carnet"] is not None:
        changes["carnet"] = changes["carnet"].strip() or None

    for field, value in changes.items():
        setattr(user, field, value)
    db.flush()
    return user
