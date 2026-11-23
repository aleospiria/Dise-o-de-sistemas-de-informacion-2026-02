from __future__ import annotations

from datetime import datetime

from pydantic import Field

from app.domain.enums import SanctionStatus
from app.schemas.common import ApiModel


class SanctionResponse(ApiModel):
    id_sancion: str = Field(validation_alias="id")
    id_usuario: str = Field(validation_alias="user_id")
    id_prestamo: str = Field(validation_alias="loan_id")
    fecha_inicio: datetime
    fecha_fin: datetime
    motivo: str
    estado: SanctionStatus
