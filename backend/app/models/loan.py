from __future__ import annotations

from datetime import datetime
from typing import TYPE_CHECKING

from sqlalchemy import (
    CheckConstraint,
    DateTime,
    Float,
    ForeignKey,
    Index,
    String,
)
from sqlalchemy import (
    Enum as SAEnum,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base, new_id, utcnow
from app.domain.enums import LoanStatus, ResourceCondition

if TYPE_CHECKING:
    from app.models.loan_series import LoanSeries
    from app.models.resource import Resource
    from app.models.sanction import Sanction
    from app.models.user import User


def _loan_status_enum() -> SAEnum:
    return SAEnum(
        LoanStatus,
        name="loan_status",
        native_enum=False,
        length=50,
        values_callable=lambda enum: [member.value for member in enum],
    )


def _condition_enum() -> SAEnum:
    return SAEnum(
        ResourceCondition,
        name="resource_condition",
        native_enum=False,
        length=50,
        values_callable=lambda enum: [member.value for member in enum],
    )


class Loan(Base):
    __tablename__ = "loans"
    __table_args__ = (
        CheckConstraint(
            "fecha_hora_inicio_programada < fecha_hora_fin_programada",
            name="ck_loans_rango_temporal",
        ),
        Index(
            "ix_loans_resource_estado_fechas",
            "resource_id",
            "estado_prestamo",
            "fecha_hora_inicio_programada",
            "fecha_hora_fin_programada",
        ),
        Index(
            "ix_loans_user_inicio",
            "user_id",
            "fecha_hora_inicio_programada",
        ),
    )

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=new_id)
    user_id: Mapped[str] = mapped_column(
        ForeignKey("users.id", ondelete="RESTRICT"), index=True, nullable=False
    )
    resource_id: Mapped[str] = mapped_column(
        ForeignKey("resources.id", ondelete="RESTRICT"), index=True, nullable=False
    )
    series_id: Mapped[str | None] = mapped_column(
        ForeignKey("loan_series.id", ondelete="SET NULL"), index=True, nullable=True
    )
    fecha_hora_reserva: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=utcnow, nullable=False
    )
    fecha_hora_inicio_programada: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False
    )
    fecha_hora_fin_programada: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False
    )
    fecha_hora_entrega: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True
    )
    fecha_hora_devolucion_real: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True
    )
    fecha_hora_cancelacion: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True
    )
    estado_prestamo: Mapped[LoanStatus] = mapped_column(
        _loan_status_enum(), default=LoanStatus.RESERVADO, nullable=False
    )
    motivo_prestamo: Mapped[str] = mapped_column(String(500), nullable=False)
    condicion_entrega: Mapped[ResourceCondition | None] = mapped_column(
        _condition_enum(), nullable=True
    )
    condicion_devolucion: Mapped[ResourceCondition | None] = mapped_column(
        _condition_enum(), nullable=True
    )
    observaciones_entrega: Mapped[str | None] = mapped_column(String(500), nullable=True)
    observaciones_devolucion: Mapped[str | None] = mapped_column(String(500), nullable=True)
    retraso_horas: Mapped[float | None] = mapped_column(Float, nullable=True)

    user: Mapped[User] = relationship(back_populates="loans")
    resource: Mapped[Resource] = relationship(back_populates="loans")
    series: Mapped[LoanSeries | None] = relationship(back_populates="loans")
    sanction: Mapped[Sanction | None] = relationship(back_populates="loan", uselist=False)
