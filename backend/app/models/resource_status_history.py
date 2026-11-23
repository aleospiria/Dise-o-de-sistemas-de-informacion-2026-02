from __future__ import annotations

from datetime import datetime
from typing import TYPE_CHECKING

from sqlalchemy import DateTime, ForeignKey, String
from sqlalchemy import Enum as SAEnum
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base, new_id, utcnow
from app.domain.enums import ResourceStatus

if TYPE_CHECKING:
    from app.models.resource import Resource


def _status_enum() -> SAEnum:
    return SAEnum(
        ResourceStatus,
        name="resource_status_history_estado",
        native_enum=False,
        length=50,
        values_callable=lambda enum: [member.value for member in enum],
    )


class ResourceStatusHistory(Base):
    __tablename__ = "resource_status_history"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=new_id)
    resource_id: Mapped[str] = mapped_column(
        ForeignKey("resources.id", ondelete="CASCADE"), index=True, nullable=False
    )
    estado: Mapped[ResourceStatus] = mapped_column(_status_enum(), nullable=False)
    fecha_cambio: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=utcnow, nullable=False
    )
    motivo: Mapped[str | None] = mapped_column(String(500), nullable=True)

    resource: Mapped[Resource] = relationship(back_populates="status_history")
