from __future__ import annotations

from datetime import datetime
from typing import TYPE_CHECKING

from sqlalchemy import Boolean, DateTime, Integer, String
from sqlalchemy import Enum as SAEnum
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base, new_id, utcnow
from app.domain.enums import UserRole

if TYPE_CHECKING:
    from app.models.availability_request import AvailabilityRequest
    from app.models.loan import Loan
    from app.models.notification import Notification
    from app.models.password_reset_token import PasswordResetToken
    from app.models.sanction import Sanction


def _role_enum() -> SAEnum:
    return SAEnum(
        UserRole,
        name="user_role",
        native_enum=False,
        length=50,
        values_callable=lambda enum: [member.value for member in enum],
    )


class User(Base):
    __tablename__ = "users"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=new_id)
    role: Mapped[UserRole] = mapped_column(_role_enum(), nullable=False)
    nombre: Mapped[str] = mapped_column(String(120), nullable=False)
    correo: Mapped[str] = mapped_column(String(255), unique=True, index=True, nullable=False)
    cedula: Mapped[str] = mapped_column(String(30), nullable=False)
    carnet: Mapped[str | None] = mapped_column(String(30), nullable=True)
    contrasena_hash: Mapped[str] = mapped_column(String(255), nullable=False)
    fecha_registro: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=utcnow, nullable=False
    )
    sanction_end_date: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True
    )
    totp_secret: Mapped[str | None] = mapped_column(String(64), nullable=True)
    totp_enabled: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    failed_2fa_attempts: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    locked_until: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)

    loans: Mapped[list[Loan]] = relationship(back_populates="user")
    sanctions: Mapped[list[Sanction]] = relationship(back_populates="user")
    notifications: Mapped[list[Notification]] = relationship(back_populates="user")
    availability_requests: Mapped[list[AvailabilityRequest]] = relationship(back_populates="user")
    password_reset_tokens: Mapped[list[PasswordResetToken]] = relationship(back_populates="user")
