from __future__ import annotations

from datetime import datetime
from typing import TYPE_CHECKING

from sqlalchemy import DateTime, ForeignKey, String
from sqlalchemy import Enum as SAEnum
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base, new_id, utcnow
from app.domain.enums import SanctionStatus

if TYPE_CHECKING:
    from app.models.loan import Loan
    from app.models.user import User


def _sanction_status_enum() -> SAEnum:
    return SAEnum(
        SanctionStatus,
        name="sanction_status",
        native_enum=False,
        length=50,
        values_callable=lambda enum: [member.value for member in enum],
    )


class Sanction(Base):
    __tablename__ = "sanctions"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=new_id)
    user_id: Mapped[str] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"), index=True, nullable=False
    )
    loan_id: Mapped[str] = mapped_column(
        ForeignKey("loans.id", ondelete="CASCADE"), unique=True, nullable=False
    )
    fecha_inicio: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=utcnow, nullable=False
    )
    fecha_fin: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    motivo: Mapped[str] = mapped_column(String(500), nullable=False)
    estado: Mapped[SanctionStatus] = mapped_column(
        _sanction_status_enum(), default=SanctionStatus.ACTIVA, nullable=False
    )

    user: Mapped[User] = relationship(back_populates="sanctions")
    loan: Mapped[Loan] = relationship(back_populates="sanction")
