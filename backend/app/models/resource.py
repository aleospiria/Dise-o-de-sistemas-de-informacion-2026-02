from __future__ import annotations

from datetime import datetime
from typing import TYPE_CHECKING

from sqlalchemy import CheckConstraint, DateTime, Integer, String, Text
from sqlalchemy import Enum as SAEnum
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base, new_id, utcnow
from app.domain.enums import ResourceStatus, ResourceType

if TYPE_CHECKING:
    from app.models.availability_request import AvailabilityRequest
    from app.models.loan import Loan
    from app.models.notification import Notification
    from app.models.resource_status_history import ResourceStatusHistory


def _status_enum() -> SAEnum:
    return SAEnum(
        ResourceStatus,
        name="resource_status",
        native_enum=False,
        length=50,
        values_callable=lambda enum: [member.value for member in enum],
    )


def _type_enum() -> SAEnum:
    return SAEnum(
        ResourceType,
        name="resource_type",
        native_enum=False,
        length=50,
        values_callable=lambda enum: [member.value for member in enum],
    )


class Resource(Base):
    __tablename__ = "resources"
    __table_args__ = (
        CheckConstraint("cantidad_total > 0", name="ck_resources_cantidad_total_positiva"),
        CheckConstraint(
            "cantidad_disponible >= 0",
            name="ck_resources_cantidad_disponible_no_negativa",
        ),
        CheckConstraint(
            "cantidad_disponible <= cantidad_total",
            name="ck_resources_cantidad_disponible_max",
        ),
    )

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=new_id)
    nombre: Mapped[str] = mapped_column(String(100), nullable=False)
    codigo_inventario: Mapped[str] = mapped_column(
        String(50), unique=True, index=True, nullable=False
    )
    tipo: Mapped[ResourceType] = mapped_column(_type_enum(), nullable=False)
    descripcion: Mapped[str] = mapped_column(Text, default="", nullable=False)
    imagen_url: Mapped[str | None] = mapped_column(Text, nullable=True)
    cantidad_total: Mapped[int] = mapped_column(Integer, nullable=False)
    cantidad_disponible: Mapped[int] = mapped_column(Integer, nullable=False)
    estado_actual: Mapped[ResourceStatus] = mapped_column(
        _status_enum(), default=ResourceStatus.DISPONIBLE, nullable=False
    )
    fecha_creacion: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=utcnow, nullable=False
    )

    loans: Mapped[list[Loan]] = relationship(back_populates="resource")
    status_history: Mapped[list[ResourceStatusHistory]] = relationship(back_populates="resource")
    notifications: Mapped[list[Notification]] = relationship(back_populates="resource")
    availability_requests: Mapped[list[AvailabilityRequest]] = relationship(
        back_populates="resource"
    )
